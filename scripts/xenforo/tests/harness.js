'use strict';
// Loads the BUILT userscript (scripts/xenforo/script.js) into a jsdom page that looks like a
// XenForo page, with the userscript manager and browser APIs jsdom lacks stubbed out:
//   GM_getValue/GM_setValue (a plain object, shareable between pages = tabs),
//   GM_xmlhttpRequest and fetch (route tables; every call is recorded),
//   IndexedDB (tests/fake-idb.js, shareable between pages),
//   IntersectionObserver/ResizeObserver (recorded; tests fire them), matchMedia (by width),
//   requestAnimationFrame/requestIdleCallback (macrotasks), media element playback.
// Scenarios assert on what a user or the site would observe: DOM, storage, requests.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('../node_modules/jsdom');
const fakeIdb = require('./fake-idb');

const ROOT = path.join(__dirname, '..');
const SCRIPT_PATH = path.join(ROOT, 'script.js');
let scriptSource = null;
const script = () => scriptSource || (scriptSource = fs.readFileSync(SCRIPT_PATH, 'utf8'));

const FIXTURES = path.join(__dirname, 'fixtures');
// fixture('thread', { posts: '...' }) → the HTML of tests/fixtures/thread.html with {{posts}} filled in
function fixture(name, vars) {
    const html = fs.readFileSync(path.join(FIXTURES, name + '.html'), 'utf8');
    return html.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars && vars[k] != null ? String(vars[k]) : ''));
}

const sleep = ms => new Promise(r => setTimeout(r, ms || 0));

// ---- network stubs -----------------------------------------------------------------------------
// A route is [matcher, handler]: matcher is a RegExp or (url, opts) => bool; handler returns a
// string (HTML, 200), an object { status, body, json, headers, delay, redirect }, a Promise of one of those,
// or null (network error).
function matchRoute(routes, url, opts) {
    for (const [m, h] of routes) {
        if (m instanceof RegExp ? m.test(url) : m(url, opts)) return h;
    }
    return undefined;
}

function toResponse(window, res, url) {
    if (typeof res === 'string') res = { status: 200, body: res };
    const status = res.status == null ? 200 : res.status;
    const body = res.json !== undefined ? JSON.stringify(res.json) : (res.body || '');
    const headers = res.headers || {};
    return {
        ok: status >= 200 && status < 300,
        status,
        // res.redirect: the server answered with a redirect; fetch follows it and reports where it landed
        url: res.redirect ? new URL(res.redirect, url).href : url,
        redirected: !!res.redirect,
        headers: { get: k => { const hit = Object.keys(headers).find(h => h.toLowerCase() === String(k).toLowerCase()); return hit ? String(headers[hit]) : null; } },
        text: async () => body,
        json: async () => JSON.parse(body || 'null'),
        clone() { return this; },
    };
}

function absolute(window, url) {
    try { return new window.URL(String(url && url.url ? url.url : url), window.location.href).href; } catch (e) { return String(url); }
}

// ---- observers ---------------------------------------------------------------------------------
function installObservers(window, page) {
    class IO {
        constructor(cb, opts) { this.cb = cb; this.options = opts || {}; this.targets = new Set(); page.observers.intersection.push(this); }
        observe(el) { this.targets.add(el); }
        unobserve(el) { this.targets.delete(el); }
        disconnect() { this.targets.clear(); }
        takeRecords() { return []; }
    }
    class RO {
        constructor(cb) { this.cb = cb; this.targets = new Set(); page.observers.resize.push(this); }
        observe(el) { this.targets.add(el); }
        unobserve(el) { this.targets.delete(el); }
        disconnect() { this.targets.clear(); }
    }
    window.IntersectionObserver = IO;
    window.ResizeObserver = RO;
}

// matchMedia that answers width queries against the page's viewport and pointer queries
// against `coarse` (touch device)
function makeMatchMedia(page) {
    return query => {
        const q = String(query);
        const test = () => {
            const w = page.width;
            let ok = true;
            q.replace(/\((max|min)-width:\s*([\d.]+)px\)/g, (_, kind, n) => { ok = ok && (kind === 'max' ? w <= +n : w >= +n); return ''; });
            if (/\(pointer:\s*coarse\)/.test(q)) ok = ok && page.coarse;
            if (/\(pointer:\s*fine\)/.test(q)) ok = ok && !page.coarse;
            if (/\(hover:\s*none\)/.test(q)) ok = ok && page.coarse;
            if (/\(hover:\s*hover\)/.test(q)) ok = ok && !page.coarse;
            if (/prefers-reduced-motion:\s*reduce/.test(q)) ok = false;
            return ok;
        };
        return { media: q, get matches() { return test(); }, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false };
    };
}

// ---- page --------------------------------------------------------------------------------------
// opts:
//   html | fixture (+ vars)   page HTML
//   url                       page URL (default SMG thread)
//   gm                        shared GM store object (default: fresh)
//   features                  feature overrides written to the persisted settings before load
//   idb                       shared fakeIdb.Backing (default: fresh)
//   routes / gmRoutes         fetch / GM_xmlhttpRequest routes (see matchRoute)
//   width, coarse             viewport width (default 1280) and touch pointer
//   hidden                    document.hidden at load
//   units                     set the test flag so the script creates window.__smgTest
//   holdTimersFrom            hold timers >= this many ms (see page.runHeld)
//   imagesLoad                images made with new Image() load as soon as they get a src
//   before(window, page)      hook to stub more before the script runs
//   onEval(window, page)      runs right after the script, before DOMContentLoaded (first-paint state)
async function openPage(opts) {
    opts = opts || {};
    const url = opts.url || 'https://forums.socialmediagirls.com/threads/sample-thread.100/';
    const html = opts.html || fixture(opts.fixture || 'thread', opts.vars);
    const page = {
        width: opts.width || 1280,
        coarse: !!opts.coarse,
        hidden: !!opts.hidden,
        gm: opts.gm || {},
        idb: opts.idb || new fakeIdb.Backing(),
        routes: (opts.routes || []).slice(),
        gmRoutes: (opts.gmRoutes || []).slice(),
        fetches: [],
        gmRequests: [],
        logs: [],
        observers: { intersection: [], resize: [] },
    };
    if (opts.features) {
        let stored = {};
        try { stored = JSON.parse(page.gm['smg-features'] || '{}'); } catch (e) { stored = {}; }
        page.gm['smg-features'] = JSON.stringify(Object.assign(stored, opts.features));
    }

    const virtualConsole = new VirtualConsole();
    ['log', 'info', 'warn', 'error', 'debug'].forEach(level => virtualConsole.on(level, (...args) => page.logs.push([level, args.map(String).join(' ')])));
    virtualConsole.on('jsdomError', err => page.logs.push(['jsdomError', String(err && err.message)]));

    const dom = new JSDOM(html, { url, runScripts: 'dangerously', virtualConsole, pretendToBeVisual: false });
    const window = dom.window;
    const document = window.document;
    page.dom = dom;
    page.window = window;
    page.document = document;

    // viewport + visibility
    Object.defineProperty(window, 'innerWidth', { configurable: true, get: () => page.width });
    Object.defineProperty(window, 'innerHeight', { configurable: true, get: () => 900 });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => page.hidden });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (page.hidden ? 'hidden' : 'visible') });
    window.matchMedia = makeMatchMedia(page);

    // timing
    // (window timers: closing the page cancels them)
    window.requestAnimationFrame = fn => window.setTimeout(() => fn(Date.now()), 0);
    window.cancelAnimationFrame = id => window.clearTimeout(id);
    window.requestIdleCallback = fn => window.setTimeout(() => fn({ didTimeout: false, timeRemaining: () => 50 }), 0);
    window.cancelIdleCallback = id => window.clearTimeout(id);

    // layout no-ops jsdom does not implement
    window.scrollTo = () => {};
    window.scrollBy = () => {};
    window.Element.prototype.scrollIntoView = function () {};
    window.Element.prototype.scrollTo = function () {};
    window.Element.prototype.scrollBy = function () {};
    window.HTMLMediaElement.prototype.play = function () { this.dispatchEvent(new window.Event('play')); return Promise.resolve(); };
    window.HTMLMediaElement.prototype.pause = function () { this.dispatchEvent(new window.Event('pause')); };
    window.HTMLMediaElement.prototype.load = function () {};
    window.HTMLImageElement.prototype.decode = function () { return Promise.resolve(); };
    window.alert = () => {};
    window.confirm = () => true;
    page.clipboard = [];
    Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: { writeText: async t => { page.clipboard.push(t); } } });
    installObservers(window, page);
    fakeIdb.install(window, page.idb);

    // userscript manager
    window.GM_getValue = (k, d) => (Object.prototype.hasOwnProperty.call(page.gm, k) ? page.gm[k] : d);
    window.GM_setValue = (k, v) => { page.gm[k] = v; };
    window.GM_deleteValue = k => { delete page.gm[k]; };
    window.GM_xmlhttpRequest = req => {
        const u = absolute(window, req.url);
        page.gmRequests.push({ url: u, method: req.method || 'GET', headers: req.headers || {}, responseType: req.responseType });
        const h = matchRoute(page.gmRoutes, u, req);
        Promise.resolve(h === undefined ? null : (typeof h === 'function' ? h(u, req) : h)).then(res => {
            if (res == null) { if (req.onerror) req.onerror({ status: 0 }); return; }
            if (typeof res === 'string') res = { status: 200, body: res };
            const body = res.json !== undefined ? JSON.stringify(res.json) : (res.body || '');
            const response = { status: res.status == null ? 200 : res.status, responseText: body, response: res.response !== undefined ? res.response : (req.responseType === 'json' ? JSON.parse(body || 'null') : body), finalUrl: u, responseHeaders: '' };
            if (req.onload) req.onload(response);
        });
        return { abort() {} };
    };

    // network
    window.fetch = (input, init) => {
        const u = absolute(window, input);
        page.fetches.push({ url: u, method: (init && init.method) || 'GET', init: init || {} });
        const h = matchRoute(page.routes, u, init);
        const signal = init && init.signal;
        return new Promise((resolve, reject) => {
            if (signal && signal.aborted) { reject(new window.DOMException('aborted', 'AbortError')); return; }
            Promise.resolve(h === undefined ? { status: 404, body: '' } : (typeof h === 'function' ? h(u, init) : h)).then(res => {
                if (res == null) { reject(new window.TypeError('network error')); return; }
                const deliver = () => (signal && signal.aborted ? reject(new window.DOMException('aborted', 'AbortError')) : resolve(toResponse(window, res, u)));
                if (res && res.delay) window.setTimeout(deliver, res.delay); else deliver();
            }, reject);
        });
    };

    // holdTimersFrom: timers of at least that many ms are held instead of scheduled (cron, polls);
    // page.runHeld(ms) fires the held ones of exactly that delay, as if that time had passed
    page.held = [];
    if (opts.holdTimersFrom) {
        const realSet = window.setTimeout.bind(window);
        window.setTimeout = (fn, ms, ...args) => {
            if ((+ms || 0) >= opts.holdTimersFrom && typeof fn === 'function') { page.held.push({ fn, ms: +ms, args }); return 0; }
            return realSet(fn, ms, ...args);
        };
    }
    page.runHeld = ms => {
        const due = page.held.filter(h => ms == null || h.ms === ms);
        page.held = page.held.filter(h => !due.includes(h));
        return Promise.all(due.map(h => h.fn(...h.args)));
    };

    // imagesLoad: images created with new Image() "load" (at 1000x1500) as soon as they get a src
    if (opts.imagesLoad) {
        const Native = window.Image;
        window.Image = function (w, h) {
            const im = new Native(w, h);
            Object.defineProperty(im, 'src', {
                configurable: true,
                get: () => im.getAttribute('src') || '',
                set: v => {
                    im.setAttribute('src', v);
                    window.setTimeout(() => {
                        Object.defineProperty(im, 'naturalWidth', { configurable: true, value: 1000 });
                        Object.defineProperty(im, 'naturalHeight', { configurable: true, value: 1500 });
                        Object.defineProperty(im, 'complete', { configurable: true, value: true });
                        if (im.onload) im.onload({ target: im });
                        im.dispatchEvent(new window.Event('load'));
                    }, 0);
                },
            });
            return im;
        };
    }

    if (opts.units) window.__SMG_TEST__ = true;
    if (opts.before) opts.before(window, page);

    window.eval(script());
    if (opts.onEval) opts.onEval(window, page);
    if (document.readyState === 'loading') {
        await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));
    }
    await sleep(0);

    Object.assign(page, {
        $: sel => document.querySelector(sel),
        $$: sel => Array.from(document.querySelectorAll(sel)),
        // let queued frames, timers and promise chains run
        async settle(ms) { for (let i = 0; i < 6; i++) await sleep(0); if (ms) await sleep(ms); for (let i = 0; i < 6; i++) await sleep(0); },
        // poll until fn() is truthy (or `ms` pass); resolves to the last value. For states that settle
        // after timers, so a slow machine does not turn a timing into a failure
        async waitFor(fn, ms) {
            const end = Date.now() + (ms || 2000);
            let v = fn();
            while (!v && Date.now() < end) { await sleep(10); v = fn(); }
            return v;
        },
        route(m, h) { page.routes.unshift([m, h]); },
        gmRoute(m, h) { page.gmRoutes.unshift([m, h]); },
        requested(re) { return page.fetches.filter(f => re.test(f.url)); },
        // fire every IntersectionObserver that watches `el`
        intersect(el, isIntersecting) {
            const hit = page.observers.intersection.filter(o => o.targets.has(el));
            hit.forEach(o => o.cb([{ target: el, isIntersecting: isIntersecting !== false, intersectionRatio: isIntersecting === false ? 0 : 1, boundingClientRect: el.getBoundingClientRect() }], o));
            return hit.length;
        },
        // deliver a ResizeObserver entry: `el` now measures `width` px (jsdom has no layout)
        resize(el, width, height) {
            const hit = page.observers.resize.filter(o => o.targets.has(el));
            hit.forEach(o => o.cb([{ target: el, contentRect: { width, height: height || 0, top: 0, left: 0 } }], o));
            return hit.length;
        },
        // the browser finished loading `img` at w x h pixels
        loadImage(img, w, h) {
            Object.defineProperty(img, 'naturalWidth', { configurable: true, value: w });
            Object.defineProperty(img, 'naturalHeight', { configurable: true, value: h });
            Object.defineProperty(img, 'complete', { configurable: true, value: true });
            img.dispatchEvent(new window.Event('load'));
        },
        setHidden(v) { page.hidden = !!v; document.dispatchEvent(new window.Event('visibilitychange')); },
        click(el) { if (typeof el === 'string') el = document.querySelector(el); if (!el) throw new Error('click: element not found'); el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })); return el; },
        key(key, target) { (target || document).dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })); },
        scroll(target) { (target || window).dispatchEvent(new window.Event('scroll')); },
        text(sel) { const el = typeof sel === 'string' ? document.querySelector(sel) : sel; return el ? el.textContent.replace(/\s+/g, ' ').trim() : null; },
        idbRows(store) { return page.idb.rows('smg-feed', store); },
        close() { try { window.close(); } catch (e) { /* already closed */ } },
    });
    return page;
}

// ---- registry ----------------------------------------------------------------------------------
const registry = [];
let currentFile = '';
function scenario(name, fn) { registry.push({ file: currentFile, name, fn }); }
function setFile(f) { currentFile = f; }

module.exports = { openPage, fixture, scenario, registry, setFile, sleep, Backing: fakeIdb.Backing };
