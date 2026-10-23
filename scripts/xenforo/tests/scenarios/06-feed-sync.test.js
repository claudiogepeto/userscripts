'use strict';
// Feed sync: only FOLLOWED threads feed the timeline (IndexedDB smg-feed). Opening a followed
// thread ingests its page; a background cron, run by one visible tab at a time, refreshes the
// followed list and fetches new pages with prefetch headers (so alerts are not consumed).
const assert = require('node:assert/strict');
const { scenario, Backing } = require('../harness');
const { threadPage, threadRow, THREAD } = require('../lib');

const SMG = 'https://forums.socialmediagirls.com';
const POST_KEYS = ['author', 'author_href', 'content_html', 'created_at', 'page_num', 'permalink', 'post_id', 'prefixes_html', 'thread_name', 'thread_path', 'thread_thumb'];
const FOLLOWED_KEYS = ['author', 'created_at', 'followed_at', 'forum_activity_ts', 'last_page', 'last_sync_at', 'path', 'saved_pages', 'tags', 'thread_name', 'thumbnail_url', 'timeline_skip', 'unread', 'updated_at'];

function followedRec(path, extra) {
    return Object.assign({ path, thread_name: 'Sample Thread', thumbnail_url: '', tags: [], followed_at: 1, forum_activity_ts: 0, updated_at: 0, created_at: 0, author: '', last_page: 1, saved_pages: [], last_sync_at: 0, unread: false, timeline_skip: false }, extra);
}

scenario('opening a thread you do not follow writes nothing to the feed', async t => {
    const page = await t.open({ url: SMG + THREAD, html: threadPage({ posts: [{ id: 11 }, { id: 12 }], watching: false }) });
    await page.settle(150);
    assert.deepEqual(page.idbRows('timeline'), []);
    assert.deepEqual(page.idbRows('followed'), []);
});

scenario('opening a thread you watch stores its posts and the thread, in the feed schema', async t => {
    const page = await t.open({ url: SMG + THREAD, html: threadPage({ posts: [{ id: 11, ts: 1700000011 }, { id: 12, ts: 1700000012 }], watching: true }) });
    await page.settle(150);
    const rows = page.idbRows('timeline').sort((a, b) => a.created_at - b.created_at);
    assert.deepEqual(rows.map(r => r.post_id), ['11', '12']);
    assert.deepEqual(Object.keys(rows[0]).sort(), POST_KEYS, 'one post row shape (snake_case)');
    assert.equal(rows[0].thread_path, THREAD);
    assert.equal(rows[0].created_at, 1700000011, 'seconds, from the post time');
    assert.equal(rows[0].page_num, 1);
    assert.equal(rows[0].thread_name, 'Sample Thread');
    assert.match(rows[0].permalink, /\/threads\/sample-thread\.100\/post-11$/);
    assert.match(rows[0].content_html, /bbWrapper/);
    const followed = page.idbRows('followed');
    assert.equal(followed.length, 1);
    assert.deepEqual(Object.keys(followed[0]).sort(), FOLLOWED_KEYS, 'one followed-thread shape');
    assert.equal(followed[0].path, THREAD);
    assert.deepEqual(followed[0].saved_pages, [1]);
    assert.equal(followed[0].updated_at, 1700000012);
});

scenario('the stored thread name is exactly the title, without the controls the script adds to the header', async t => {
    const page = await t.open({ url: SMG + THREAD, html: threadPage({ posts: [{ id: 31 }], watching: true }) });
    await page.settle(150);
    assert.ok(page.$('.p-body-header.smg-thead-unified'), 'the header was rebuilt with the script controls');
    assert.deepEqual(page.idbRows('timeline').map(r => r.thread_name), ['Sample Thread']);
    assert.deepEqual(page.idbRows('followed').map(r => r.thread_name), ['Sample Thread']);
});

scenario('a thread already in the followed table is ingested even without the watch button', async t => {
    const idb = new Backing();
    idb.seed('smg-feed', 'followed', [followedRec(THREAD)]);
    const html = threadPage({ posts: [{ id: 21 }] }).replace(/<a href="\/threads\/sample-thread\.100\/watch"[^]*?<\/a>/, '');
    const page = await t.open({ url: SMG + THREAD, html, idb });
    await page.settle(150);
    assert.deepEqual(page.idbRows('timeline').map(r => r.post_id), ['21']);
});

scenario('a thread sorted by reactions or filed under off-topic is not ingested', async t => {
    const sorted = await t.open({ url: SMG + THREAD + '?order=reaction_score', html: threadPage({ posts: [{ id: 31 }], watching: true }) });
    await sorted.settle(150);
    assert.deepEqual(sorted.idbRows('timeline'), [], 'reaction order');
    const offTopic = threadPage({ posts: [{ id: 32 }], watching: true }).replace('>Instagram</a>', '>Off-Topic</a>');
    const off = await t.open({ url: SMG + THREAD, html: offTopic });
    await off.settle(150);
    assert.deepEqual(off.idbRows('timeline'), [], 'off-topic forum');
});

// ---- cron ----
const CRON_MS = 5 * 60 * 1000;
const CRON_KEY = 'smg-feed-cron-last-run';
const watchedJson = rows => ({ json: { html: { content: '<div class="structItemContainer">' + rows.map(threadRow).join('') + '</div>' } } });

const RECENT = Math.floor(Date.now() / 1000) - 3600;   // inside the feed retention window
async function cronTab(t, { gm, idb, hidden }) {
    const page = await t.open({
        url: SMG + '/forums/instagram.5/',
        html: threadPage({ posts: [] }).replace(/thread_view/g, 'forum_view'),
        gm, idb, hidden, holdTimersFrom: 60000,
        routes: [
            [/\/watched\/threads\?/, () => watchedJson([{ id: 7, slug: 'cron-thread', title: 'Cron thread', ts: RECENT }])],
            [/\/threads\/cron-thread\.7\//, () => threadPage({ posts: [{ id: 71, ts: RECENT, thread: '/threads/cron-thread.7/' }], base: '/threads/cron-thread.7/' })],
        ],
    });
    await page.settle(30);
    return page;
}

scenario('cron: a hidden tab skips the run and leaves the shared last-run mark alone', async t => {
    const gm = { [CRON_KEY]: '0' };
    const page = await cronTab(t, { gm, hidden: true });
    await page.runHeld(CRON_MS);
    await page.settle(50);
    assert.equal(page.requested(/\/watched\/threads/).length, 0);
    assert.equal(gm[CRON_KEY], '0');
    assert.ok(page.held.some(h => h.ms === CRON_MS), 'the tab re-arms its timer');
});

scenario('cron: a visible tab skips the run when another tab ran it moments ago', async t => {
    const gm = { [CRON_KEY]: String(Date.now() - 1000) };
    const page = await cronTab(t, { gm });
    await page.runHeld(CRON_MS);
    await page.settle(50);
    assert.equal(page.requested(/\/watched\/threads/).length, 0);
});

scenario('cron: the visible tab whose turn it is refreshes the followed list and syncs new pages as prefetch', async t => {
    const before = Date.now();
    const gm = { [CRON_KEY]: String(before - 60 * 60 * 1000) };
    const page = await cronTab(t, { gm });
    let synced = 0;
    page.window.addEventListener('smg-timeline-sync-done', () => { synced++; });
    await page.runHeld(CRON_MS);
    await page.settle(300);
    assert.ok(+gm[CRON_KEY] >= before, 'the shared last-run mark is written for the other tabs');
    assert.equal(page.requested(/\/watched\/threads/).length, 1, 'followed list refreshed once');
    assert.deepEqual(page.idbRows('followed').map(r => r.path), ['/threads/cron-thread.7/']);
    const threadGet = page.requested(/\/threads\/cron-thread\.7\//);
    assert.equal(threadGet.length, 1, 'the new followed thread is fetched');
    assert.equal(threadGet[0].init.headers['X-Purpose'], 'prefetch', 'background fetch does not mark alerts read');
    assert.deepEqual(page.idbRows('timeline').map(r => r.post_id), ['71']);
    assert.ok(synced >= 1, 'smg-timeline-sync-done announced');
});

scenario('cron: two tabs sharing storage run the sync once per interval', async t => {
    const gm = { [CRON_KEY]: '0' };
    const idb = new Backing();
    const a = await cronTab(t, { gm, idb });
    const b = await cronTab(t, { gm, idb });
    await a.runHeld(CRON_MS);
    await a.settle(200);
    await b.runHeld(CRON_MS);
    await b.settle(100);
    assert.equal(a.requested(/\/watched\/threads/).length + b.requested(/\/watched\/threads/).length, 1);
});
