'use strict';
// Scroll anchoring under the infinite loader. New pages go in ABOVE the bottom pager and the site
// footer, so those must never be the browser's scroll anchor: if the footer anchors the view, the
// browser scrolls down with every appended page and the reader is held at the end while the list
// keeps loading. Everything after the list is taken out of anchor selection; the posts stay in it.
const assert = require('node:assert/strict');
const { scenario } = require('../harness');
const { threadPage, listingPage, THREAD, FORUM } = require('../lib');

const SMG = 'https://forums.socialmediagirls.com';
const FOOTER = '<footer class="p-footer" id="footer"><div class="p-footer-inner">Site footer</div></footer>';
const withFooter = html => html.replace('</body>', FOOTER + '</body>');

scenario('a thread with more pages takes the bottom pager and the footer out of scroll anchoring, not the posts', async t => {
    const page = await t.open({
        url: SMG + THREAD,
        html: withFooter(threadPage({ posts: [{ id: 1 }, { id: 2 }], page: 1, of: 3 })),
        routes: [[/page-2/, () => threadPage({ posts: [{ id: 3 }], page: 2, of: 3 })]],
    });
    await page.settle(50);
    assert.ok(page.$('#footer').hasAttribute('data-smg-after-list'), 'the footer is never the anchor');
    const after = page.$('.block-outer--after');
    if (after) assert.ok(after.closest('[data-smg-after-list]'), 'nor the bottom pager');
    assert.ok(page.$$('article.message--post').every(a => !a.closest('[data-smg-after-list]')), 'every post can still anchor the reader');
    assert.equal(page.window.getComputedStyle(page.$('#footer')).overflowAnchor, 'none');
});

scenario('a forum listing gets the same treatment', async t => {
    const page = await t.open({
        url: SMG + FORUM,
        html: withFooter(listingPage({ rows: [{ id: 1 }], page: 1, of: 2 })),
        routes: [[/page-2/, () => listingPage({ rows: [{ id: 2 }], page: 2, of: 2 })]],
    });
    await page.settle(50);
    assert.ok(page.$('#footer').hasAttribute('data-smg-after-list'));
    assert.ok(page.$$('.structItem--thread').every(r => !r.closest('[data-smg-after-list]')));
});

scenario('a single-page thread leaves the footer alone (no infinite loader there)', async t => {
    const page = await t.open({ url: SMG + THREAD, html: withFooter(threadPage({ posts: [{ id: 1 }], page: 1, of: 1 })) });
    await page.settle(50);
    assert.ok(!page.$('#footer').hasAttribute('data-smg-after-list'));
});
