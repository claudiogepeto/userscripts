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

scenario('a thread post far from the screen lets go of its iframes and videos and gets them back when it returns', async t => {
    const MEDIA = '<iframe class="far-ifr" src="https://example.com/embed/1" loading="lazy"></iframe><video class="far-vid" preload="metadata" src="https://example.com/v.mp4"></video>';
    const page = await t.open({
        url: SMG + THREAD,
        html: threadPage({ posts: [{ id: 101, body: MEDIA }], page: 1, of: 2 }),
        routes: threadSite({ 2: [{ id: 201, body: '<iframe class="far-ifr2" src="https://example.com/embed/2"></iframe>' }] }),
    });
    await page.settle(50);
    const post = page.$('#js-post-101');
    const ifr = page.$('iframe.far-ifr');
    const vid = page.$('video.far-vid');
    assert.ok(post && ifr && vid, 'control: the first post has its media');
    let paused = 0;
    vid.addEventListener('pause', () => { paused++; });
    assert.ok(page.intersect(post, false) > 0, 'posts of the first page are watched');
    await page.settle(10);
    assert.equal(post.dataset.smgFar, '1', 'the post is marked far');
    assert.ok(!ifr.isConnected, 'the iframe left the document');
    const ph = post.querySelector('.smg-far-ph');
    assert.ok(ph, 'a placeholder holds its place');
    assert.match(ph.style.getPropertyValue('height'), /px$/, 'the placeholder keeps a measured height');
    assert.equal(ph.style.getPropertyPriority('height'), 'important');
    assert.equal(vid.getAttribute('src'), null, 'the video let go of its source');
    assert.ok(paused >= 1, 'and was paused');
    assert.match(vid.style.getPropertyValue('height'), /px$/, 'the video box is held at its measured size');
    assert.ok(page.$('#js-post-101'), 'the post itself stays in the DOM');

    page.intersect(post, true);
    await page.settle(10);
    assert.equal(post.dataset.smgFar, undefined, 'back near: no longer far');
    assert.equal(post.querySelector('iframe.far-ifr'), ifr, 'the same iframe is back');
    assert.equal(post.querySelector('.smg-far-ph'), null, 'the placeholder is gone');
    assert.equal(vid.getAttribute('src'), 'https://example.com/v.mp4', 'the video source is back');
    vid.dispatchEvent(new page.window.Event('loadedmetadata'));
    assert.equal(vid.style.getPropertyValue('height'), '', 'the size hold is released once the video knows its size');

    const appended = page.$('#js-post-201');
    assert.ok(appended, 'control: page 2 was appended');
    assert.ok(page.intersect(appended, false) > 0, 'appended posts are watched too');
    await page.settle(10);
    assert.ok(!page.$('iframe.far-ifr2') && appended.querySelector('.smg-far-ph'), 'an appended post far away releases its iframe');
});
