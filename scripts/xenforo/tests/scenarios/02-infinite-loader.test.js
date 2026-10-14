'use strict';
// Infinite loader: threads, forum listings and the watched list grow at the bottom with the next
// real page (following its Next link), behind a "Page N" separator, one page at a time.
const assert = require('node:assert/strict');
const { scenario } = require('../harness');
const { threadPage, listingPage, THREAD, FORUM } = require('../lib');

const SMG = 'https://forums.socialmediagirls.com';
const ids = page => page.$$('article.message--post').map(a => a.getAttribute('data-content').replace('post-', ''));

function threadSite(pages) {
    return [[/\/threads\/sample-thread\.100\/page-(\d+)/, url => {
        const n = +url.match(/page-(\d+)/)[1];
        return pages[n] === 'fail' ? { status: 500, body: '' } : threadPage({ posts: pages[n], page: n, of: 3 });
    }]];
}

scenario('a thread appends the next page under a separator when the reader nears the end', async t => {
    const page = await t.open({
        url: SMG + THREAD,
        html: threadPage({ posts: [{ id: 101 }, { id: 102 }], page: 1, of: 3 }),
        routes: threadSite({ 2: [{ id: 201 }, { id: 202 }], 3: [{ id: 301 }] }),
    });
    await page.settle(50);
    assert.deepEqual(page.requested(/page-\d/).map(f => f.url.replace(SMG, '')), [THREAD + 'page-2'], 'page 2 requested once');
    assert.deepEqual(ids(page), ['101', '102', '201', '202']);
    const sep = page.$('.smg-inf-sep');
    assert.equal(sep.dataset.page, '2');
    assert.equal(page.text(sep), 'Page 2');
    assert.equal(sep.nextElementSibling.getAttribute('data-content'), 'post-201', 'separator sits before the page it announces');

    page.scroll();
    await page.settle(50);
    assert.deepEqual(ids(page), ['101', '102', '201', '202', '301'], 'page 3 follows the Next link of page 2');
    assert.ok(page.window.location.pathname.endsWith('/page-2'), 'the URL follows the page on screen (page 2)');

    page.scroll();
    await page.settle(50);
    assert.ok(page.window.location.pathname.endsWith('/page-3'), 'the URL follows the page on screen (page 3)');
    assert.equal(page.requested(/page-\d/).length, 2, 'the last page has no Next: nothing more is requested');
});

scenario('a thread page that fails is retried on the next scroll and abandoned after three failures', async t => {
    const page = await t.open({
        url: SMG + THREAD,
        html: threadPage({ posts: [{ id: 101 }], page: 1, of: 3 }),
        routes: threadSite({ 2: 'fail' }),
    });
    await page.settle(30);
    for (let i = 0; i < 4; i++) { page.scroll(); await page.settle(30); }
    assert.equal(page.requested(/page-2/).length, 3, 'three attempts, then the loader stops');
    assert.equal(page.$$('.smg-inf-sep').length, 0, 'nothing appended');
});

scenario('a forum listing appends the next page of threads, decorated like the first', async t => {
    const page = await t.open({
        url: SMG + FORUM,
        html: listingPage({ rows: [{ id: 1 }, { id: 2 }], page: 1, of: 2 }),
        routes: [[/\/forums\/instagram\.5\/page-2/, () => listingPage({ rows: [{ id: 3 }, { id: 4 }], page: 2, of: 2 })]],
    });
    await page.settle(80);
    const rows = page.$$('.js-threadList .structItem--thread');
    assert.equal(rows.length, 4);
    assert.equal(page.text('.js-threadList .smg-inf-sep'), 'Page 2');
    assert.ok(rows.every(r => r.querySelector('.smg-thread-unwatch-btn')), 'appended rows get the follow button too');
});

scenario('the watched list appends its next page, skips repeated threads and records them as followed', async t => {
    const watched = (rows, n) => listingPage({ rows, page: n, of: 2, base: '/watched/threads/' }).replace(/forum_view/g, 'watched_threads_list');
    const page = await t.open({
        url: SMG + '/watched/threads/',
        html: watched([{ id: 1 }, { id: 2 }], 1),
        routes: [[/\/watched\/threads\/page-2/, () => watched([{ id: 2 }, { id: 3 }], 2)]],
    });
    await page.settle(150);
    const titles = page.$$('.structItem--thread .structItem-title a').map(a => a.textContent);
    assert.deepEqual(titles, ['Thread 1', 'Thread 2', 'Thread 3'], 'thread 2 is not repeated');
    const followed = page.idbRows('followed').map(r => r.path).sort();
    assert.deepEqual(followed, ['/threads/thread-1.1/', '/threads/thread-2.2/', '/threads/thread-3.3/']);
});

scenario('turning infinite scroll off for threads stops the loader at once', async t => {
    const page = await t.open({
        url: SMG + THREAD,
        html: threadPage({ posts: [{ id: 101 }], page: 1, of: 3 }),
        routes: threadSite({ 2: [{ id: 201 }] }),
        features: { infiniteScrollThreads: false },
    });
    await page.settle(50);
    page.scroll();
    await page.settle(50);
    assert.equal(page.requested(/page-\d/).length, 0);
});
