'use strict';
// Bookmarks as a feed: /account/bookmarks is replaced by a feed of the saved POSTS (all pages of
// the list), newest bookmark first, painted from cache on the next visit and kept in sync.
const assert = require('node:assert/strict');
const { scenario, Backing } = require('../harness');
const { threadPage, bookmarksPage } = require('../lib');

const URL = 'https://forums.socialmediagirls.com/account/bookmarks';
// /posts/N/ answers the thread page positioned on that post
const postRoute = [/\/posts\/(\d+)\/(?:$|\?)/, url => {
    const id = +url.match(/\/posts\/(\d+)/)[1];
    return threadPage({ posts: [{ id, body: 'Saved post body ' + id }] });
}];
const cards = page => page.$$('#smg-bm-feed .smg-fp-card').map(c => c.dataset.bmId);

scenario('the bookmarks page becomes a feed of every saved post, newest bookmark first', async t => {
    const page = await t.open({
        url: URL,
        html: bookmarksPage([{ id: 11, ts: 1700000100, note: 'remember this' }, { id: 12, ts: 1700000300 }], '/account/bookmarks?page=2'),
        routes: [[/\/account\/bookmarks\?page=2/, () => bookmarksPage([{ id: 13, ts: 1700000200 }, { id: 11, ts: 1700000100 }], null)], postRoute],
    });
    await page.settle(900);   // posts are fetched two at a time, 600ms apart
    assert.ok(page.document.documentElement.classList.contains('smg-bm-feed-on'));
    assert.equal(page.$('.p-body-content .block').style.display, 'none', 'native list hidden');
    assert.deepEqual(cards(page), ['12', '13', '11'], 'all pages, no duplicates, by bookmark time');
    assert.equal(page.text('#smg-bm-feed [data-bm-id="11"] .smg-bm-note'), 'remember this', 'the bookmark note shows on its card');
    assert.match(page.text('#smg-bm-feed [data-bm-id="12"] .smg-fp-content') || page.$('#smg-bm-feed [data-bm-id="12"]').textContent, /Saved post body 12/);
    const postGets = page.requested(/\/posts\/\d+\/$/);
    assert.ok(postGets.every(f => f.init.headers && f.init.headers['X-Purpose'] === 'prefetch'), 'saved posts fetched as prefetch (alerts untouched)');
    assert.deepEqual(page.idbRows('bookmarks').map(r => r.postId).sort(), ['11', '12', '13'], 'cached for the next visit');
});

scenario('a second visit paints from cache and drops what is no longer saved', async t => {
    const idb = new Backing();
    const routes = [postRoute];
    const first = await t.open({ url: URL, html: bookmarksPage([{ id: 21, ts: 1700000100 }, { id: 22, ts: 1700000200 }]), routes, idb });
    await first.settle(250);
    first.close();
    const second = await t.open({ url: URL, html: bookmarksPage([{ id: 22, ts: 1700000200 }]), routes, idb, onEval() {} });
    await second.settle(250);
    assert.deepEqual(cards(second), ['22']);
    assert.equal(second.requested(/\/posts\/22\//).length, 0, 'a cached post is not fetched again');
    assert.deepEqual(second.idbRows('bookmarks').map(r => r.postId), ['22']);
});

scenario('when a list page fails, the feed never claims there is nothing saved', async t => {
    const page = await t.open({
        url: URL,
        html: bookmarksPage([], '/account/bookmarks?page=2'),
        routes: [[/\/account\/bookmarks\?page=2/, { status: 500 }]],
    });
    await page.settle(200);
    assert.equal(page.text('#smg-bm-feed .smg-fp-empty'), 'Couldn’t load.');
});

scenario('remove from saved confirms through the forum form, then the card leaves', async t => {
    const confirm = '<html><body><form action="/posts/31/bookmark" method="post" class="block"><input type="hidden" name="_xfToken" value="csrf-token-1"><input type="hidden" name="delete" value="1"><button type="submit">Delete</button></form></body></html>';
    const page = await t.open({
        url: URL,
        html: bookmarksPage([{ id: 31 }, { id: 32 }]),
        routes: [[/\/posts\/31\/bookmark\?delete=1/, confirm], [/\/posts\/31\/bookmark$/, { json: { status: 'ok' } }], postRoute],
    });
    await page.settle(250);
    page.click('#smg-bm-feed [data-bm-id="31"] .smg-bm-remove');
    await page.settle(350);
    const post = page.fetches.find(f => f.method === 'POST');
    assert.ok(post && /\/posts\/31\/bookmark$/.test(post.url), 'posted to the bookmark form action');
    assert.equal(post.init.body.get('delete'), '1');
    assert.equal(post.init.body.get('_xfToken'), 'csrf-token-1');
    assert.deepEqual(cards(page), ['32']);
    assert.deepEqual(page.idbRows('bookmarks').map(r => r.postId), ['32']);
});
