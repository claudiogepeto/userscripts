'use strict';
// Paint and skeleton: the forum's own page never flashes; a skeleton of the right kind covers the
// viewport until the redesigned page is composed, then it fades out and leaves the DOM.
const assert = require('node:assert/strict');
const { scenario } = require('../harness');
const { threadPage, listingPage } = require('../lib');

function firstPaint(t, url, html, extra) {
    const seen = {};
    return t.open(Object.assign({
        url, html,
        onEval(window) {
            const root = window.document.documentElement;
            const shell = window.document.getElementById('smg-page-skeleton');
            seen.pending = root.classList.contains('smg-page-pending');
            seen.shellClass = shell ? shell.className : null;
            seen.hasCriticalGate = root.classList.contains('smg-critical-paint');
        },
    }, extra)).then(page => Object.assign(page, { firstPaint: seen }));
}

scenario('a thread page is covered by the thread skeleton until its posts are composed', async t => {
    const page = await firstPaint(t, 'https://forums.socialmediagirls.com/threads/sample-thread.100/', threadPage({ posts: [{ id: 1 }, { id: 2 }] }));
    assert.equal(page.firstPaint.pending, true, 'page starts pending');
    assert.match(page.firstPaint.shellClass || '', /smg-page-skeleton--thread/, 'thread skeleton mounted at first paint');
    assert.equal(page.firstPaint.hasCriticalGate, false, 'the critical pre-paint gate hands over once the skeleton exists');
    const root = page.document.documentElement;
    assert.ok(await page.waitFor(() => !page.$('#smg-page-skeleton')), 'skeleton leaves');
    assert.ok(root.classList.contains('smg-page-ready'), 'page marked ready');
    assert.ok(!root.classList.contains('smg-page-pending'), 'pending state cleared');
    assert.equal(page.$('#smg-page-skeleton'), null, 'skeleton removed after the fade');
    assert.ok(page.$$('article.message').every(a => a.dataset.smgCardReady === '1'), 'every post was composed before release');
});

scenario('each page kind gets its own skeleton', async t => {
    const cases = [
        ['https://forums.socialmediagirls.com/forums/instagram.5/', listingPage({ rows: [{ id: 1 }] }), 'listing'],
        ['https://forums.socialmediagirls.com/watched/threads', listingPage({ rows: [{ id: 1 }] }).replace(/forum_view/g, 'watched_threads_list'), 'following'],
        ['https://forums.socialmediagirls.com/account/bookmarks', listingPage({}).replace(/forum_view/g, 'account_bookmarks'), 'bookmarks'],
        ['https://forums.socialmediagirls.com/?view=feed', listingPage({}).replace(/forum_view/g, 'forum_list'), 'timeline'],
    ];
    for (const [url, html, kind] of cases) {
        const page = await firstPaint(t, url, html);
        assert.match(page.firstPaint.shellClass || '', new RegExp('smg-page-skeleton--' + kind), url + ' shows the ' + kind + ' skeleton');
        page.close();
    }
});

scenario('a forum listing is released once every row is decorated', async t => {
    const page = await firstPaint(t, 'https://forums.socialmediagirls.com/forums/instagram.5/', listingPage({ rows: [{ id: 1 }, { id: 2 }, { id: 3 }] }));
    assert.ok(await page.waitFor(() => !page.$('#smg-page-skeleton')));
    assert.ok(page.document.documentElement.classList.contains('smg-page-ready'));
    assert.ok(page.$$('.structItem--thread').every(r => r.dataset.smgDecoratedReady === '1'), 'rows decorated before release');
});

scenario('lazy thumbnails far below the first screen do not hold a listing behind the skeleton', async t => {
    const thumb = n => `<a href="/threads/t.${n}/" class="dtt-thread-thumbnail"><img src="https://forums.socialmediagirls.com/data/thumbs/${n}.jpg" loading="lazy" alt=""></a>`;
    const html = listingPage({ rows: [{ id: 1 }, { id: 2 }, { id: 3 }] })
        .replace(/<a href="\/members\/starter\.9\/" class="avatar avatar--s"><img [^>]*><\/a>/g, (() => { let n = 0; return () => thumb(++n); })());
    const page = await firstPaint(t, 'https://forums.socialmediagirls.com/forums/instagram.5/', html);
    await page.settle(30);
    const root = page.document.documentElement;
    const imgs = page.$$('.structItem--thread .dtt-thread-thumbnail img');
    assert.equal(imgs.length, 3, 'three rows with lazy thumbnails');
    assert.ok(root.classList.contains('smg-page-pending'), 'pending while the thumbnails are unknown');
    assert.equal(page.intersect(imgs[0], true), 1, 'the first row is near the first screen');
    page.intersect(imgs[1], false);
    page.intersect(imgs[2], false);
    await page.settle(30);
    assert.ok(root.classList.contains('smg-page-pending'), 'the near thumbnail still holds the page until it loads');
    page.loadImage(imgs[0], 300, 200);
    assert.ok(await page.waitFor(() => root.classList.contains('smg-page-ready'), 3000), 'released without waiting for the far thumbnails');
    imgs[2].dispatchEvent(new page.window.Event('error'));
    assert.ok(page.$$('.structItem--thread')[2].classList.contains('smg-no-thumb'), 'a far thumbnail that fails later still gets the placeholder');
});

scenario('a server error page is shown at once instead of waiting behind the skeleton', async t => {
    // control: a thread page with no posts yet keeps waiting
    const empty = await firstPaint(t, 'https://forums.socialmediagirls.com/threads/sample-thread.100/', threadPage({ posts: [] }));
    await empty.settle(200);
    assert.ok(empty.document.documentElement.classList.contains('smg-page-pending'), 'control: an unfinished thread stays behind the skeleton');
    empty.close();
    const html = threadPage({ posts: [] }).replace('<title>Sample Thread', '<title>500 Internal Server Error').replace('>Sample Thread</h1>', '>Oops! We ran into some problems.</h1>');
    const page = await firstPaint(t, 'https://forums.socialmediagirls.com/threads/sample-thread.100/', html);
    await page.settle(200);
    assert.ok(page.document.documentElement.classList.contains('smg-page-ready'), 'error page released without the 4s wait');
});

scenario('with the kill switch on, nothing is painted or hidden', async t => {
    const page = await firstPaint(t, 'https://forums.socialmediagirls.com/threads/sample-thread.100/', threadPage({ posts: [{ id: 1 }] }), { gm: { 'smg-off': '1' } });
    assert.equal(page.firstPaint.pending, false);
    assert.equal(page.firstPaint.shellClass, null);
    await page.settle(100);
    assert.equal(page.$('#smg-topbar'), null, 'no topbar');
    assert.equal(page.$('#smg-styles'), null, 'no stylesheet');
    assert.ok(!page.document.documentElement.classList.contains('smg-critical-paint'), 'page not left invisible');
});
