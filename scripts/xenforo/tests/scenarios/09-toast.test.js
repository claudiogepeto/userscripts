'use strict';
// Toast: one polite live region; messages stack (at most four), each leaves on its own after
// about 2.5s. Reached here through the feed card "copy link" button.
const assert = require('node:assert/strict');
const { scenario, Backing } = require('../harness');
const { listingPage } = require('../lib');

const RECENT = Math.floor(Date.now() / 1000) - 600;
function feedWith(n) {
    const idb = new Backing();
    idb.seed('smg-feed', 'followed', [{ path: '/threads/t.1/', thread_name: 'T', saved_pages: [1], last_page: 1, updated_at: RECENT, last_sync_at: RECENT }]);
    idb.seed('smg-feed', 'timeline', Array.from({ length: n }, (_, i) => ({
        post_id: String(900 + i), created_at: RECENT - i, author: 'A', author_href: '', thread_name: 'Feed thread', prefixes_html: '',
        thread_thumb: '', permalink: 'https://forums.socialmediagirls.com/threads/t.1/post-' + (900 + i), content_html: '<div class="bbWrapper">post ' + i + '</div>',
        thread_path: '/threads/t.1/', page_num: 1,
    })));
    idb.seed('smg-feed', 'meta', [{ key: 'dataVersion', val: 12 }, { key: 'syncVersion', val: 10 }]);
    return idb;
}

async function feedPage(t, n) {
    const page = await t.open({ url: 'https://forums.socialmediagirls.com/?view=feed', html: listingPage({}).replace(/forum_view/g, 'forum_list'), idb: feedWith(n) });
    await page.settle(250);
    return page;
}

scenario('copying a feed post link copies the permalink and confirms with a toast in a live region', async t => {
    const page = await feedPage(t, 2);
    const share = page.$('#smg-river .smg-fp-card .smg-fp-share');
    assert.ok(share, 'feed card rendered with its share button');
    page.click(share);
    await page.settle(30);
    assert.deepEqual(page.clipboard, ['https://forums.socialmediagirls.com/threads/t.1/post-900']);
    const box = page.$('#smg-toasts');
    assert.equal(box.getAttribute('role'), 'status');
    assert.equal(box.getAttribute('aria-live'), 'polite');
    assert.equal(page.text('#smg-toasts .smg-toast-msg'), 'Link copied');
    assert.ok(page.$('#smg-toasts .smg-toast').classList.contains('smg-toast--success'));
});

scenario('toasts stack up to four and each leaves by itself', async t => {
    const page = await feedPage(t, 6);
    page.$$('#smg-river .smg-fp-share').slice(0, 6).forEach(b => page.click(b));
    await page.settle(30);
    assert.equal(page.$$('#smg-toasts .smg-toast').length, 4, 'oldest dropped beyond four');
    await page.settle(2900);
    assert.equal(page.$$('#smg-toasts .smg-toast').length, 0, 'all gone after ~2.5s');
});
