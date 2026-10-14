'use strict';
// The shared pager engine (createPager, thread/07-posts-misc.js): every list that grows at its end
// (threads, listings, Feed, Saved, home carousel, dock search, alerts rail) runs on it. Engine rules
// are checked through window.__smgTest.createPager; the home carousel is checked through the DOM.
const assert = require('node:assert/strict');
const { scenario } = require('../harness');
const { threadPage, listingPage, homePage, THREAD } = require('../lib');

const URL = 'https://forums.socialmediagirls.com' + THREAD;
async function engine(t) {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }] }), units: true });
    const w = page.window;
    // a scroll box with controlled metrics (jsdom has no layout)
    const scroller = m => {
        const el = w.document.createElement('div');
        ['scrollHeight', 'clientHeight', 'scrollTop', 'scrollWidth', 'clientWidth', 'scrollLeft'].forEach(k =>
            Object.defineProperty(el, k, { configurable: true, get: () => m[k] || 0, set: v => { m[k] = v; } }));
        return el;
    };
    // a source whose loads are resolved by hand
    const source = () => { const calls = []; return { calls, load: (cursor, signal) => new Promise((res, rej) => calls.push({ cursor, signal, res, rej })) }; };
    const flush = () => page.settle();
    return { createPager: w.__smgTest.createPager, scroller, source, flush };
}

scenario('pager: more() loads the cursor, one load at a time; apply returns the next cursor; null ends', async t => {
    const { createPager, source } = await engine(t);
    const s = source(); const applied = [];
    const p = createPager({ cursor: 'p2', load: s.load, listen: false, apply: (pg, cur) => { applied.push(cur + ':' + pg); return { next: pg === 'last' ? null : 'p3', added: 1 }; } });
    const pr = p.more();
    assert.deepEqual([s.calls.length, s.calls[0].cursor, p.busy], [1, 'p2', true]);
    p.more();
    assert.equal(s.calls.length, 1, 'no second load while one is in flight');
    s.calls[0].res('page2'); await pr;
    assert.deepEqual([applied.join(), p.cursor, p.busy], ['p2:page2', 'p3', false]);
    const pr2 = p.more(); s.calls[1].res('last'); await pr2;
    assert.deepEqual([p.ended, p.cursor], [true, null]);
    p.more();
    assert.equal(s.calls.length, 2, 'an ended list loads nothing');
});

scenario('pager: triggers by distance to the end, vertically or horizontally; enabled() gates scroll, not explicit more()', async t => {
    const { createPager, scroller, source, flush } = await engine(t);
    const s = source(); const m = { scrollHeight: 2000, clientHeight: 500, scrollTop: 0 };
    const p = createPager({ cursor: 'n', load: s.load, apply: () => ({ next: 'n', added: 1 }), root: scroller(m), near: 400, listen: false });
    p.check(); assert.equal(s.calls.length, 0, '1500px from the end: nothing');
    m.scrollTop = 1150; p.check(); assert.equal(s.calls.length, 1, '350px from the end (limit 400): loads');
    s.calls[0].res('x'); await flush();
    const mx = { scrollWidth: 3000, clientWidth: 1000, scrollLeft: 0 }; const s2 = source();
    const ph = createPager({ cursor: 'n', load: s2.load, apply: () => ({ next: 'n', added: 1 }), root: scroller(mx), axis: 'x', near: 700, listen: false });
    ph.check(); assert.equal(s2.calls.length, 0);
    mx.scrollLeft = 1400; ph.check(); assert.equal(s2.calls.length, 1, 'x axis: 600px from the right edge loads');
    const s3 = source();
    const gated = createPager({ cursor: 'n', load: s3.load, apply: () => ({ next: null, added: 1 }), root: scroller({ scrollHeight: 100, clientHeight: 100 }), near: 400, enabled: () => false, listen: false });
    gated.check(); assert.equal(s3.calls.length, 0, 'enabled() false: scroll does not load');
    gated.more(); assert.equal(s3.calls.length, 1, 'but an explicit more() does');
});

scenario('pager: failures retry, then stop after three in a row; onFail can stop at once or always retry', async t => {
    const { createPager, source } = await engine(t);
    const s = source();
    const p = createPager({ cursor: 'n', load: s.load, apply: () => ({ next: 'n', added: 1 }), listen: false });
    let pr = p.more(); s.calls[0].res(null); await pr;
    assert.deepEqual([p.cursor, p.ended], ['n', false], 'a null page is a failure: the cursor stays');
    pr = p.more(); s.calls[1].rej(new Error('net')); await pr;
    pr = p.more(); s.calls[2].res(null); await pr;
    assert.deepEqual([p.ended, p.failed], [true, true]);
    const s2 = source();
    const stop = createPager({ cursor: 'n', load: s2.load, apply: () => ({ next: 'n', added: 1 }), onFail: () => 'stop', listen: false });
    pr = stop.more(); s2.calls[0].res(null); await pr;
    assert.deepEqual([stop.ended, stop.failed], [true, true], "onFail 'stop'");
    const s3 = source();
    const retry = createPager({ cursor: 'n', load: s3.load, apply: () => ({ next: 'n', added: 1 }), onFail: () => 'retry', listen: false });
    for (let i = 0; i < 5; i++) { pr = retry.more(); s3.calls[i].res(null); await pr; }
    assert.deepEqual([retry.ended, retry.cursor], [false, 'n'], "onFail 'retry' never ends on failure");
});

scenario('pager: reset() aborts the load in flight and discards its late result', async t => {
    const { createPager, source } = await engine(t);
    const s = source(); const applied = [];
    const p = createPager({ cursor: 'old', load: s.load, apply: pg => { applied.push(pg); return { next: 'after-' + pg, added: 1 }; }, listen: false });
    const pr = p.more();
    p.reset('new');
    assert.equal(s.calls[0].signal.aborted, true);
    assert.deepEqual([p.busy, p.cursor], [false, 'new']);
    s.calls[0].res('stale'); await pr;
    assert.deepEqual([applied.length, p.cursor], [0, 'new'], 'sequence guard');
    const pr2 = p.more(); s.calls[1].res('fresh'); await pr2;
    assert.deepEqual([applied.join(), p.cursor], ['fresh', 'after-fresh']);
    p.reset(null);
    assert.equal(p.ended, true);
});

scenario('pager: prefetch starts the download early and the append reuses it; fill pulls while near the end', async t => {
    const { createPager, scroller, source, flush } = await engine(t);
    const s = source(); const applied = [];
    const m = { scrollHeight: 10000, clientHeight: 1000, scrollTop: 5500 };
    const p = createPager({ cursor: 'n', load: s.load, apply: pg => { applied.push(pg); return { next: null, added: 1 }; }, root: scroller(m), near: 1400, prefetch: 4000, listen: false });
    p.check();
    assert.deepEqual([s.calls.length, applied.length, p.busy], [1, 0, false], 'in the prefetch band: download only');
    s.calls[0].res('pre'); await flush();
    m.scrollTop = 7700; p.check(); await flush();
    assert.deepEqual([s.calls.length, applied.join()], [1, 'pre'], 'the append uses the prefetched page');
    const s2 = source(); let add = 1;
    const el = scroller({ scrollHeight: 100, clientHeight: 100 });
    const f = createPager({ cursor: 'n', load: s2.load, apply: () => ({ next: 'n', added: add }), root: el, near: 400, fill: true, listen: false });
    const pr = f.more(); s2.calls[0].res('a'); await pr; await flush();
    assert.equal(s2.calls.length, 2, 'fill: room left → the next page comes by itself');
    add = 0; s2.calls[1].res('b'); await flush();
    assert.equal(s2.calls.length, 2, 'a page that added nothing does not pull another (no loop)');
});

scenario('pager: drain() walks the whole list (Saved) and reports whether it is complete; states and dispose', async t => {
    const { createPager, source } = await engine(t);
    let n = 0;
    const all = createPager({ cursor: 1, load: c => Promise.resolve('pg' + c), apply: (pg, c) => { n++; return { next: c < 4 ? c + 1 : null, added: 1 }; }, onFail: () => 'stop', listen: false });
    assert.deepEqual([(await all.drain(40)).complete, n], [true, 4]);
    const broken = createPager({ cursor: 1, load: c => Promise.resolve(c === 3 ? null : 'pg'), apply: (pg, c) => ({ next: c + 1, added: 1 }), onFail: () => 'stop', listen: false });
    assert.equal((await broken.drain(40)).complete, false, 'a failed page marks the list incomplete');
    let k = 0;
    const capped = createPager({ cursor: 1, load: () => Promise.resolve('pg'), apply: (pg, c) => { k++; return { next: c + 1, added: 1 }; }, listen: false });
    await capped.drain(5);
    assert.equal(k, 5, 'drain respects its page cap');
    const s = source(); const states = [];
    const st = createPager({ cursor: 'n', load: s.load, apply: pg => ({ next: pg === 'end' ? null : 'n', added: 1 }), onState: x => states.push(x), listen: false });
    let pr = st.more(); s.calls[0].res('x'); await pr;
    pr = st.more(); s.calls[1].res(null); await pr;
    pr = st.more(); s.calls[2].res('end'); await pr;
    assert.equal(states.join(), 'loading,idle,loading,error,loading,end');
    const s2 = source(); const applied = [];
    const d = createPager({ cursor: 'n', load: s2.load, apply: pg => { applied.push(pg); return { next: 'n', added: 1 }; } });
    const prd = d.more(); d.dispose(); s2.calls[0].res('late'); await prd; d.more();
    assert.deepEqual([applied.length, s2.calls.length], [0, 1], 'after dispose nothing is appended or loaded');
});

// ---- home carousel (DOM) ----
function whatsNew(n) {
    const ids = n === 4 ? [21] : [n * 10 + 1, n * 10 + 2];   // page 4 only repeats an item already shown
    return listingPage({ rows: ids.map(id => ({ id, title: 'Car ' + id })), page: n, of: 9, base: '/whats-new/posts/' })
        .replace(/forum_view/g, 'whats_new_posts');
}

scenario('home carousel: pages to the right with skeletons, retries a failed page, stops when a page brings nothing new', async t => {
    let failNext = false, hold = null;
    const page = await t.open({
        url: 'https://forums.socialmediagirls.com/',
        html: homePage(),
        routes: [[/\/whats-new\/posts\//, url => {
            const n = +((url.match(/page-(\d+)/) || [])[1] || 1);
            if (n === 1) return whatsNew(1);
            if (failNext) { failNext = false; return { status: 503 }; }
            return new Promise(res => { hold = () => res(whatsNew(n)); });
        }]],
    });
    await page.settle(150);
    const panel = page.$('.smg-feed-panel.is-active');
    const cards = () => panel.querySelectorAll('.smg-feed-card:not(.smg-feed-skel)').length;
    const asked = () => page.requested(/\/whats-new\/posts\/page-\d/).map(f => +f.url.match(/page-(\d+)/)[1]);
    assert.equal(cards(), 2, 'first page in the carousel');
    page.scroll(panel); await page.settle(30);
    assert.deepEqual(asked(), [2], 'near the right edge: next page requested');
    assert.equal(panel.querySelectorAll('.smg-feed-skel').length, 4, 'four skeletons on the right while it loads');
    hold(); await page.settle(30);
    assert.equal(panel.querySelectorAll('.smg-feed-skel').length, 0);
    assert.equal(cards(), 4);
    failNext = true;
    page.scroll(panel); await page.settle(30);
    page.scroll(panel); await page.settle(30);
    assert.deepEqual(asked(), [2, 3, 3], 'the failed page is tried again on the next scroll');
    hold(); await page.settle(30);
    assert.equal(cards(), 6);
    page.scroll(panel); await page.settle(30); hold(); await page.settle(30);
    page.scroll(panel); await page.settle(30);
    assert.deepEqual(asked(), [2, 3, 3, 4], 'a page with nothing new ends the carousel');
});
