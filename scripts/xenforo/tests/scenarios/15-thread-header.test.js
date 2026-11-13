'use strict';
// Thread header on SocialMediaGirls. Its UIX theme renders .p-body-header as a sibling BEFORE
// .p-body (wrapped in .pageContent > .uix_headerInner), not inside it like stock XenForo. The
// header must show the current page's title and image on a direct load and after any soft
// navigation. The pager stays in its block-outer, outside the title header.
const assert = require('node:assert/strict');
const { scenario } = require('../harness');
const { threadPage, homePage, THREAD } = require('../lib');

const SMG = 'https://forums.socialmediagirls.com';
const OTHER = '/threads/other-thread.200/';
const SITE_META = '<meta property="og:site_name" content="Social Media Girls">';

// stock fixture -> SMG shape: header moved out of .p-body, og:title in the head
function uix(html, ogTitle) {
    const m = html.match(/\s*<div class="p-body-header">[\s\S]*?\n {2}<\/div>\n/);
    if (m) {
        html = html.replace(m[0], '\n');
        const inner = m[0].trim().replace(/^<div class="p-body-header">/, '').replace(/<\/div>$/, '');
        html = html.replace('<div class="p-body">', `<div class="p-body-header"><div class="pageContent"><div class="uix_headerInner">${inner}</div></div></div>\n<div class="p-body">`);
    }
    return withMeta(html, ogTitle);
}
function withMeta(html, ogTitle) {
    return html.replace('</head>', `${SITE_META}\n<meta property="og:title" content="${ogTitle}">\n</head>`);
}
function thread({ base = THREAD, title = 'Sample Thread', page = 1, of = 3, img = 'a.jpg' } = {}) {
    const first = 1000 * (base === OTHER ? 2 : 1) + page;
    const html = threadPage({ base, page, of, posts: [{ id: first, thread: base, body: `<img src="https://img.example/${img}" class="bbImage" alt="">` }] })
        .replace(/Sample Thread/g, title)
        .replace(/sample-thread\.100/g, base.replace(/^\/threads\/|\/$/g, ''));
    return uix(html, title);
}
function home() {
    const html = homePage().replace('<title>SocialMediaGirls Forums</title>', '<title>Social Media Girls</title>')
        .replace('<div class="p-body">', '<div class="p-body-header"><div class="pageContent"><div class="uix_headerInner"><div class="p-title"><h1 class="p-title-value">Forum list</h1></div></div></div></div>\n<div class="p-body">');
    return withMeta(html, 'Social Media Girls');
}
function site() {
    return [
        [/\/threads\/sample-thread\.100\/page-2/, () => thread({ page: 2 })],
        [/\/threads\/sample-thread\.100\/(?:$|\?)/, () => thread()],
        [/\/threads\/other-thread\.200\/(?:$|\?)/, () => thread({ base: OTHER, title: 'Other Thread', of: 9, img: 'b.jpg' })],
        [/^https:\/\/forums\.socialmediagirls\.com\/(?:$|\?)/, () => home()],
    ];
}
function stubXF(window) {
    window.XF = { config: { csrf: 'csrf-token-1' }, activate() {} };
}
async function go(page, href) {
    const a = page.document.createElement('a');
    a.href = href; a.textContent = 'go';
    page.$('.p-body-content').appendChild(a);
    page.click(a);
    await page.settle(120);
}
// what the reader sees in the header
function head(page) {
    const headers = page.$$('.p-body-header');
    const h = headers[0];
    const sticky = page.$('.smg-thead-sticky');
    return {
        headers: headers.length,
        title: h ? (h.querySelector('.smg-thead-title-text') || {}).textContent : null,
        thumb: h ? ((h.querySelector('.smg-thead-thumb img') || {}).src || '') : null,
        stickyTitle: sticky ? (sticky.querySelector('.smg-thead-sticky-title') || {}).textContent : '',
        headerControls: h ? h.querySelectorAll('.smg-thead-controls, .smg-thead-actions, .smg-bar').length : 0,
        loosePageBars: page.$$('.p-body .block-outer:not(.block-outer--after) .smg-bar').length,
    };
}
function assertHeader(got, want, when) {
    assert.equal(got.headers, 1, when + ': exactly one thread header');
    assert.equal(got.title, want.title, when + ': header title');
    assert.equal(got.thumb, want.thumb, when + ': header image');
    assert.equal(got.stickyTitle, want.title, when + ': fixed title matches the thread');
    assert.equal(got.headerControls, 0, when + ': no controls or empty action bar in the header');
    assert.equal(got.loosePageBars, 1, when + ': pager remains in the top block-outer');
}

scenario('SMG thread header shows the thread on a direct load', async t => {
    const page = await t.open({ url: SMG + THREAD, html: thread(), routes: site(), before: stubXF });
    await page.settle(120);
    assertHeader(head(page), { title: 'Sample Thread', thumb: 'https://img.example/a.jpg' }, 'direct load');
});

scenario('SMG thread header after soft navigation from the forum list is the thread, not the site', async t => {
    const page = await t.open({ url: SMG + '/', html: home(), routes: site(), before: stubXF });
    await page.settle(80);
    await go(page, OTHER);
    assert.equal(page.window.location.pathname, OTHER);
    assertHeader(head(page), { title: 'Other Thread', thumb: 'https://img.example/b.jpg' }, 'home -> thread');
});

scenario('SMG thread header follows the page and the thread across soft navigations', async t => {
    const page = await t.open({ url: SMG + THREAD, html: thread(), routes: site(), before: stubXF });
    await page.settle(80);
    await go(page, THREAD + 'page-2');
    assertHeader(head(page), { title: 'Sample Thread', thumb: 'https://img.example/a.jpg' }, 'page 1 -> page 2');
    await go(page, OTHER);
    assertHeader(head(page), { title: 'Other Thread', thumb: 'https://img.example/b.jpg' }, 'thread -> other thread');
    await go(page, '/');
    assert.equal(page.$$('.p-body-header').length, 1, 'the forum list keeps one header');
    assert.equal(page.$$('.p-body-header .smg-bar').length, 0, 'no thread pager left on the forum list');
    assert.ok(!page.$('.smg-thead-hero'), 'no thread header left on the forum list');
    assert.equal(page.$('.smg-thead-sticky'), null, 'no fixed thread title left on the forum list');
});

scenario('the fixed thread title toggles without changing the in-flow header', async t => {
    const page = await t.open({ url: SMG + THREAD, html: thread(), routes: site(), before: stubXF });
    await page.settle(120);
    const header = page.$('.p-body-header');
    const sticky = page.$('.smg-thead-sticky');
    const sentinel = page.$('.smg-thead-sentinel');
    assert.ok(sticky, 'a separate fixed title exists');
    assert.ok(sentinel, 'the scroll threshold is outside the header');

    let sentinelTop = 60;
    sentinel.getBoundingClientRect = () => ({ top: sentinelTop });
    Object.defineProperty(page.window, 'scrollY', { configurable: true, value: 100 });
    page.window.dispatchEvent(new page.window.Event('scroll'));
    await page.settle(10);
    assert.ok(sticky.classList.contains('is-visible'), 'the fixed title appears after the sentinel passes the topbar');
    assert.ok(!header.classList.contains('is-stuck'), 'scroll state never changes the main header');

    sentinelTop = 130;
    page.window.dispatchEvent(new page.window.Event('scroll'));
    await page.settle(10);
    assert.ok(!sticky.classList.contains('is-visible'), 'the fixed title hides when the page returns above the threshold');
    assert.ok(!header.classList.contains('is-stuck'), 'the main header remains unchanged');
});

const SMILIE = '<img class="smilie smilie--emoji" alt="😍" src="https://cdn.jsdelivr.net/joypixels/assets/8.0/png/unicode/64/1f60d.png" title="Smiling face with heart-eyes" width="64" height="64">';
function smilieThread(body) {
    return uix(threadPage({ posts: [{ id: 1, body }] }), 'Sample Thread');
}

scenario('SMG thread header never uses a post smilie as the thread image', async t => {
    const page = await t.open({ url: SMG + THREAD, html: smilieThread(SMILIE + ' nice <img src="https://img.example/real.jpg" class="bbImage" alt="">'), before: stubXF });
    await page.settle(120);
    assert.equal(head(page).thumb, 'https://img.example/real.jpg', 'the first real image, not the smilie before it');
});

scenario('SMG thread header with only a smilie in the posts has no image', async t => {
    const page = await t.open({ url: SMG + THREAD, html: smilieThread('so good ' + SMILIE), before: stubXF });
    await page.settle(120);
    assert.equal(head(page).thumb, '', 'no thread image rather than the smilie');
});
