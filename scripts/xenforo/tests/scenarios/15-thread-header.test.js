'use strict';
// Thread header on SocialMediaGirls. Its UIX theme renders .p-body-header as a sibling BEFORE
// .p-body (wrapped in .pageContent > .uix_headerInner), not inside it like stock XenForo. The
// header must show the current page's title, image and pager on a direct load and after any soft
// navigation, and every page keeps exactly one header and one pager bar in it.
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
    const bars = h ? h.querySelectorAll('.smg-bar') : [];
    const cur = bars[0] && bars[0].querySelector('.smg-bar-cur');
    return {
        headers: headers.length,
        title: h ? (h.querySelector('.smg-thead-title-text') || {}).textContent : null,
        thumb: h ? ((h.querySelector('.smg-thead-thumb img') || {}).src || '') : null,
        headerBars: bars.length,
        cur: cur ? cur.textContent.replace(/\s+/g, ' ').trim() : '',
        loosePageBars: page.$$('.p-body .block-outer:not(.block-outer--after) .smg-bar').length,
    };
}
function assertHeader(got, want, when) {
    assert.equal(got.headers, 1, when + ': exactly one thread header');
    assert.equal(got.title, want.title, when + ': header title');
    assert.equal(got.thumb, want.thumb, when + ': header image');
    assert.equal(got.headerBars, 1, when + ': one pager bar in the header');
    assert.match(got.cur, want.cur, when + ': header pager shows the current page');
    assert.equal(got.loosePageBars, 0, when + ': no second pager bar left above the posts');
}

scenario('SMG thread header shows the thread on a direct load', async t => {
    const page = await t.open({ url: SMG + THREAD, html: thread(), routes: site(), before: stubXF });
    await page.settle(120);
    assertHeader(head(page), { title: 'Sample Thread', thumb: 'https://img.example/a.jpg', cur: /^1\s*\/\s*3$/ }, 'direct load');
});

scenario('SMG thread header after soft navigation from the forum list is the thread, not the site', async t => {
    const page = await t.open({ url: SMG + '/', html: home(), routes: site(), before: stubXF });
    await page.settle(80);
    await go(page, OTHER);
    assert.equal(page.window.location.pathname, OTHER);
    assertHeader(head(page), { title: 'Other Thread', thumb: 'https://img.example/b.jpg', cur: /^1\s*\/\s*9$/ }, 'home -> thread');
});

scenario('SMG thread header follows the page and the thread across soft navigations', async t => {
    const page = await t.open({ url: SMG + THREAD, html: thread(), routes: site(), before: stubXF });
    await page.settle(80);
    await go(page, THREAD + 'page-2');
    assertHeader(head(page), { title: 'Sample Thread', thumb: 'https://img.example/a.jpg', cur: /^2\s*\/\s*3$/ }, 'page 1 -> page 2');
    await go(page, OTHER);
    assertHeader(head(page), { title: 'Other Thread', thumb: 'https://img.example/b.jpg', cur: /^1\s*\/\s*9$/ }, 'thread -> other thread');
    await go(page, '/');
    assert.equal(page.$$('.p-body-header').length, 1, 'the forum list keeps one header');
    assert.equal(page.$$('.p-body-header .smg-bar').length, 0, 'no thread pager left on the forum list');
    assert.ok(!page.$('.smg-thead-hero'), 'no thread header left on the forum list');
});
