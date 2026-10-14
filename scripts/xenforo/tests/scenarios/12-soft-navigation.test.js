'use strict';
// Soft navigation: an internal link swaps only .p-body. The topbar, dock and rail stay; the new
// page's own XenForo assets load before XF.activate (so the editor works); the old page's
// listeners are released, and N navigations leave exactly one of everything.
const assert = require('node:assert/strict');
const { scenario } = require('../harness');
const { threadPage, listingPage, THREAD, FORUM } = require('../lib');

const SMG = 'https://forums.socialmediagirls.com';
const XF_HEAD = `<script>
XF.ready(() => { XF.extendObject(true, XF.config, {
    userId: 1,
    js: {"\\/js\\/xf\\/message.min.js?_v=1":true,"\\/js\\/xf\\/editor-compiled.js?_v=1":true},
    css: {"public:message.less":true,"public:editor.less":true},
    cacheKey: 'x'
}); });
</script>`;
const EDITOR = '<form class="js-quickReply" action="/threads/other.200/add-reply"><div class="message-editorWrapper"><textarea name="message_html" class="input js-editor" data-xf-init="editor"></textarea></div></form>';

function site() {
    return [
        [/\/threads\/other\.200\/(?:$|\?)/, () => threadPage({ posts: [{ id: 2001, thread: '/threads/other.200/' }], base: '/threads/other.200/', head: XF_HEAD, after: EDITOR }).replace('<title>Sample Thread', '<title>Other Thread')],
        [/\/threads\/sample-thread\.100\/(?:$|\?)/, () => threadPage({ posts: [{ id: 1 }], page: 1, of: 2 })],
        [/\/forums\/instagram\.5\/(?:$|\?)/, () => listingPage({ rows: [{ id: 1 }, { id: 2 }] })],
    ];
}
// the page world's XenForo: records Loader.load and activate
function stubXF(window, page) {
    page.xf = { load: [], activate: [] };
    window.XF = {
        config: { csrf: 'csrf-token-1' },
        Loader: { load(js, css, cb) { page.xf.load.push({ js: Array.from(js), css: Array.from(css) }); page.xf.pending = cb; } },
        activate(el) { page.xf.activate.push(el); },
    };
}
function link(page, href) {
    const a = page.document.createElement('a');
    a.href = href; a.textContent = 'go';
    page.$('.p-body-content').appendChild(a);
    return a;
}
async function go(page, href) {
    page.click(link(page, href));
    await page.settle(80);
}

scenario('following an internal link swaps the page body only and updates URL and title', async t => {
    const page = await t.open({ url: SMG + THREAD, html: threadPage({ posts: [{ id: 1 }] }), routes: site(), before: stubXF });
    await page.settle(80);
    const topbar = page.$('#smg-topbar');
    const dock = page.$('#smg-post-nav-wrapper');
    const seen = {};
    page.click(link(page, '/threads/other.200/'));
    seen.pending = page.document.documentElement.classList.contains('smg-page-pending');
    seen.skeleton = (page.$('#smg-page-skeleton') || {}).className;
    await page.settle(100);
    assert.equal(seen.pending, true, 'the page goes pending at once');
    assert.match(seen.skeleton || '', /smg-page-skeleton--thread/, 'skeleton of the DESTINATION kind while fetching');
    assert.equal(page.window.location.pathname, '/threads/other.200/');
    assert.equal(page.document.title, 'Other Thread | SocialMediaGirls Forums');
    assert.ok(page.$('#js-post-2001') && !page.$('#js-post-1'), 'new body in, old body out');
    assert.equal(page.$('#smg-topbar'), topbar, 'the topbar is the same node');
    assert.equal(page.$('#smg-post-nav-wrapper'), dock, 'the dock is the same node');
    assert.ok(await page.waitFor(() => page.document.documentElement.classList.contains('smg-page-ready')), 'the new page is released');
});

scenario('the destination page assets are loaded before XF.activate, which gets the new body with the editor', async t => {
    const page = await t.open({ url: SMG + THREAD, html: threadPage({ posts: [{ id: 1 }] }), routes: site(), before: stubXF });
    await page.settle(60);
    await go(page, '/threads/other.200/');
    assert.equal(page.xf.load.length, 1);
    assert.deepEqual(page.xf.load[0].js.sort(), ['/js/xf/editor-compiled.js?_v=1', '/js/xf/message.min.js?_v=1']);
    assert.deepEqual(page.xf.load[0].css.sort(), ['public:editor.less', 'public:message.less']);
    assert.equal(page.xf.activate.length, 0, 'not activated before its assets');
    page.xf.pending();
    assert.equal(page.xf.activate.length, 1);
    assert.ok(page.xf.activate[0].querySelector('textarea[data-xf-init="editor"]'), 'activated on the new .p-body');
});

scenario('without XF.Loader the new body is still activated', async t => {
    const page = await t.open({ url: SMG + THREAD, html: threadPage({ posts: [{ id: 1 }] }), routes: site(), before: (w, p) => { stubXF(w, p); delete w.XF.Loader; } });
    await page.settle(60);
    await go(page, '/threads/other.200/');
    assert.equal(page.xf.activate.length, 1);
});

scenario('the previous page stops listening: its infinite loader never fires again', async t => {
    const page = await t.open({ url: SMG + THREAD, html: threadPage({ posts: [{ id: 1 }], page: 1, of: 3 }), routes: site(), before: stubXF });
    page.route(/sample-thread\.100\/page-2/, { status: 500 });   // a failing page is retried on every scroll
    await page.settle(60);
    page.scroll();
    await page.settle(40);
    const before = page.requested(/sample-thread\.100\/page-2/).length;
    assert.equal(before, 2, 'control: while on the thread, a scroll retries the failed page');
    await go(page, FORUM);
    page.scroll(); await page.settle(40);
    page.scroll(); await page.settle(40);
    assert.equal(page.requested(/sample-thread\.100\/page-2/).length, before, 'after leaving, scrolling never reaches the old loader');
});

scenario('ten navigations leave one topbar, one dock, one body and a bounded set of scroll listeners', async t => {
    let scrollAdds = 0, scrollRemoves = 0;
    const page = await t.open({
        url: SMG + THREAD, html: threadPage({ posts: [{ id: 1 }], page: 1, of: 2 }), routes: site(), gm: { 'smg-alerts-dock': '1' },
        before: (w, p) => {
            stubXF(w, p);
            const add = w.addEventListener.bind(w), rem = w.removeEventListener.bind(w);
            w.addEventListener = (type, fn, o) => { if (type === 'scroll') scrollAdds++; return add(type, fn, o); };
            w.removeEventListener = (type, fn, o) => { if (type === 'scroll') scrollRemoves++; return rem(type, fn, o); };
        },
    });
    page.route(/account\/alerts/, { json: { html: { content: '<ol></ol>' } } });
    await page.settle(80);
    await go(page, FORUM);
    const liveAfterOne = scrollAdds - scrollRemoves;
    const targets = ['/threads/other.200/', FORUM, THREAD, FORUM, '/threads/other.200/', THREAD, FORUM, '/threads/other.200/', FORUM];
    for (const href of targets) await go(page, href);
    assert.equal(page.window.location.pathname, FORUM);
    assert.equal(page.$$('#smg-topbar').length, 1);
    assert.equal(page.$$('#smg-post-nav-wrapper').length, 1);
    assert.equal(page.$$('#smg-aldock').length, 1);
    assert.equal(page.$$('.p-body').length, 1);
    assert.ok(await page.waitFor(() => !page.$('#smg-page-skeleton')), 'the last page is released');
    assert.ok(scrollAdds - scrollRemoves <= liveAfterOne + 1, 'scroll listeners do not pile up: ' + liveAfterOne + ' after one navigation, ' + (scrollAdds - scrollRemoves) + ' after ten');
});

scenario('Back returns to the previous page through the same soft navigation', async t => {
    const page = await t.open({ url: SMG + THREAD, html: threadPage({ posts: [{ id: 1 }] }), routes: site(), before: stubXF });
    await page.settle(60);
    await go(page, FORUM);
    assert.ok(page.$('.structItem--thread'));
    page.window.history.back();
    await page.settle(150);
    assert.equal(page.window.location.pathname, THREAD);
    assert.ok(page.$('#js-post-1'), 'the thread body is back');
    assert.ok(page.document.documentElement.classList.contains('smg-thread'));
});

scenario('leaving a page stops its media and drops its XenForo handlers and tooltips', async t => {
    const page = await t.open({
        url: SMG + THREAD,
        html: threadPage({ posts: [{ id: 1, body: '<video class="old-vid" src="https://example.com/v.mp4"><source src="https://example.com/v.webm"></video>' }] }),
        routes: site(),
        before: (w, p) => {
            stubXF(w, p);
            w.XF.eventHandlers = { default: { click: [] } };
            w.XF.TooltipTrigger = { cache: {} };
        },
    });
    await page.settle(60);
    const XF = page.window.XF;
    const vid = page.$('video.old-vid');
    const oldEl = page.$('#js-post-1');
    assert.ok(vid && oldEl, 'control: the old page has its video and post');
    let paused = 0;
    vid.addEventListener('pause', () => { paused++; });
    XF.eventHandlers.default.click.push({ element: oldEl, handler() {} }, { element: page.window, handler() {} }, { element: page.$('#smg-topbar') || page.document.body, handler() {} });
    XF.TooltipTrigger.cache.a = { target: oldEl };
    XF.TooltipTrigger.cache.b = { target: page.document.body };
    await go(page, '/threads/other.200/');
    assert.ok(!oldEl.isConnected, 'the old body left the document');
    assert.ok(paused >= 1, 'the old video was paused');
    assert.equal(vid.getAttribute('src'), null, 'the old video let go of its source');
    assert.equal(vid.querySelectorAll('source').length, 0, 'and of its <source> children');
    const left = XF.eventHandlers.default.click.map(r => r.element);
    assert.equal(left.length, 2, 'only handlers of live elements remain');
    assert.ok(!left.includes(oldEl), 'the old element handler is gone');
    assert.ok(left.includes(page.window), 'window handlers are kept');
    assert.deepEqual(Object.keys(XF.TooltipTrigger.cache), ['b'], 'tooltip cache keeps live targets only');
    assert.equal(page.xf.load.length, 1, 'the new page is still activated through the loader');
});

scenario('a page whose XenForo has no handler registry or tooltip cache still navigates', async t => {
    const page = await t.open({ url: SMG + THREAD, html: threadPage({ posts: [{ id: 1 }] }), routes: site(), before: (w, p) => { stubXF(w, p); w.XF.eventHandlers = null; w.XF.TooltipTrigger = { cache: 7 }; } });
    await page.settle(60);
    await go(page, '/threads/other.200/');
    page.xf.pending();
    assert.equal(page.xf.activate.length, 1, 'activation still happens');
    assert.ok(page.$('#js-post-2001'));
});
