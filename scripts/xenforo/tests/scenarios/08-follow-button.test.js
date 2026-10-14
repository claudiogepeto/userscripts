'use strict';
// Follow button: every thread row (forum listing and watched list) carries ONE watch/unwatch
// button on its thumb. It talks to the forum, keeps the followed table in step, and confirms with a toast.
const assert = require('node:assert/strict');
const { scenario, Backing } = require('../harness');
const { listingPage, FORUM } = require('../lib');

const SMG = 'https://forums.socialmediagirls.com';
const watched = rows => listingPage({ rows }).replace(/forum_view/g, 'watched_threads_list')
    .replace(/<div class="structItem structItem--thread([^"]*)" data-author="Starter">/g, (m, cls) => m)
    .replace(/js-threadListItem-(\d+)/g, (m, id) => m + '" data-thread-id="' + id);
const btnOf = (page, id) => page.$(`.js-threadListItem-${id} .smg-thread-unwatch-btn`);

scenario('a forum row shows a visible follow button; following posts to the forum, records it and toasts', async t => {
    const page = await t.open({ url: SMG + FORUM, html: listingPage({ rows: [{ id: 41, title: 'Followable' }] }), routes: [[/\/watch$/, { json: { status: 'ok' } }]] });
    await page.settle(80);
    const btn = btnOf(page, 41);
    assert.ok(btn, 'button on the row');
    assert.ok(btn.closest('.structItem-cell--icon'), 'on the thumb');
    assert.ok(!btn.classList.contains('is-following'));
    assert.equal(btn.title, 'Watch thread');
    page.click(btn);
    await page.settle(60);
    const post = page.requested(/\/threads\/thread-41\.41\/watch$/)[0];
    assert.equal(post.method, 'POST');
    assert.equal(post.init.body.get('email_subscribe'), '0');
    assert.ok(btnOf(page, 41).classList.contains('is-following'));
    assert.equal(btnOf(page, 41).title, 'Unwatch');
    const rec = page.idbRows('followed')[0];
    assert.equal(rec.path, '/threads/thread-41.41/');
    assert.equal(rec.thread_name, 'Followable');
    assert.equal(page.text('#smg-toasts .smg-toast-msg'), 'Following: Followable');
});

scenario('unfollowing from a forum row stops watching and removes the thread and its posts from the feed', async t => {
    const idb = new Backing();
    idb.seed('smg-feed', 'followed', [{ path: '/threads/thread-42.42/', thread_name: 'Old', saved_pages: [1], last_page: 1 }]);
    idb.seed('smg-feed', 'timeline', [{ post_id: '9', thread_path: '/threads/thread-42.42/', created_at: 1 }]);
    const page = await t.open({ url: SMG + FORUM, html: listingPage({ rows: [{ id: 42, title: 'Old' }] }), idb, routes: [[/\/watch$/, { json: { status: 'ok' } }]] });
    await page.settle(100);
    assert.ok(btnOf(page, 42).classList.contains('is-following'), 'a thread in the followed table shows as followed');
    page.click(btnOf(page, 42));
    await page.settle(80);
    const post = page.requested(/\/threads\/thread-42\.42\/watch$/)[0];
    assert.equal(post.init.body.get('stop'), '1');
    assert.deepEqual(page.idbRows('followed'), []);
    assert.deepEqual(page.idbRows('timeline'), [], 'its posts leave the feed too');
    assert.equal(page.text('#smg-toasts .smg-toast-msg'), 'Unfollowed: Old');
});

scenario('on the watched list the button unfollows through the list form and the row leaves', async t => {
    const html = watched([{ id: 43, title: 'Watched one' }, { id: 44 }]).replace('<div class="structItem-cell structItem-cell--icon">', '<div class="structItem-cell structItem-cell--icon"><input type="checkbox" name="thread_ids[]" value="43">');
    const page = await t.open({ url: SMG + '/watched/threads', html, routes: [[/\/watched\/threads\/update/, { json: { status: 'ok' } }]] });
    await page.settle(100);
    const btn = btnOf(page, 43);
    assert.ok(btn.classList.contains('is-following'), 'every watched row starts followed');
    page.click(btn);
    await page.settle(350);
    const post = page.requested(/\/watched\/threads\/update/)[0];
    assert.equal(post.init.body.get('state'), 'delete');
    assert.equal(post.init.body.get('thread_ids[]'), '43');
    assert.equal(page.$('.js-threadListItem-43'), null, 'row removed');
    assert.ok(page.$('.js-threadListItem-44'), 'other rows stay');
});
