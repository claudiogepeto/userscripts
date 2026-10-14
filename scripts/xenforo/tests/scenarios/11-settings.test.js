'use strict';
// Settings: every toggle in the settings panel (SETTINGS_META) really switches its feature.
// Each case loads the same page with the toggle on and off and reads what a user would see.
const assert = require('node:assert/strict');
const { scenario, Backing } = require('../harness');
const { threadPage, listingPage, homePage, bookmarksPage, THREAD, FORUM } = require('../lib');

const SMG = 'https://forums.socialmediagirls.com';
const thread = (body, extra) => Object.assign({ url: SMG + THREAD, html: threadPage({ posts: [{ id: 1, body }] }) }, extra);
const RECENT = Math.floor(Date.now() / 1000) - 600;

function feedDb() {
    const idb = new Backing();
    idb.seed('smg-feed', 'followed', [{ path: '/threads/t.1/', thread_name: 'T', saved_pages: [1], last_page: 1, updated_at: RECENT, last_sync_at: RECENT }]);
    idb.seed('smg-feed', 'timeline', Array.from({ length: 40 }, (_, i) => ({ post_id: String(1000 + i), created_at: RECENT - i, author: 'A', author_href: '', thread_name: 'T', prefixes_html: '', thread_thumb: '', permalink: SMG + '/threads/t.1/post-' + (1000 + i), content_html: '<div class="bbWrapper">p</div>', thread_path: '/threads/t.1/', page_num: 1 })));
    idb.seed('smg-feed', 'meta', [{ key: 'dataVersion', val: 12 }, { key: 'syncVersion', val: 10 }]);
    return idb;
}
// XenForo's own spoiler toggle (its JS is not on the test page)
const xfSpoilers = window => window.document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.bbCodeSpoiler-button');
    if (!b) return;
    const box = b.closest('.bbCodeSpoiler');
    box.classList.toggle('is-open');
    box.querySelector('.bbCodeSpoiler-content').style.display = box.classList.contains('is-open') ? 'block' : 'none';
});
const REDGIFS_LOADER = `<div class="generic2wide-iframe-div" onclick="loadMedia(this, '//www.redgifs.com/ifr/happyfluffycat')"><span>Click to load</span></div>`;
const page2 = [[/page-2/, url => (/forums/.test(url) ? listingPage({ rows: [{ id: 9 }], page: 2, of: 2 }) : threadPage({ posts: [{ id: 2 }], page: 2, of: 2 }))]];

// key -> { open: page options, act(page) optional, seen(page) -> true when the feature shows, base: features for both runs }
const CASES = {
    topBar: { open: thread('x'), seen: p => !!p.$('#smg-topbar') },
    homeRemake: { open: { url: SMG + '/', html: homePage() }, seen: p => p.document.documentElement.classList.contains('smg-home') },
    alertsDock: { open: thread('x', { gm: { 'smg-alerts-dock': '1' }, routes: [[/account\/alerts/, { json: { html: { content: '<ol></ol>' } } }]] }), seen: p => !!p.$('#smg-aldock') },
    headerNotices: { open: { url: SMG + '/', html: homePage() }, seen: p => !!p.$('.smg-notices-collapse') },
    customFavicon: { open: thread('x'), seen: p => !!p.$('#smg-favicon') },
    autoFullImages: { open: thread('<img class="bbImage" src="https://example.com/a.jpg" width="9" height="9"><br><img class="bbImage" src="https://example.com/b.jpg" width="9" height="9">'), seen: p => !!p.$('.auto-image-grid') },
    replaceThumbsWithFull: { open: thread('<img class="bbImage" src="https://simp6.example.su/images/pic.md.jpg" alt="">', { imagesLoad: true }), seen: p => /\/pic\.jpg$/.test(p.$('.bbWrapper img').getAttribute('src')) },
    thumbPlaceholders: { open: { url: SMG + FORUM, html: listingPage({ rows: [{ id: 5 }] }) }, seen: p => !!p.$('.structItem--thread .smg-thumb-ph') },
    autoLoadRedgifs: {
        base: { redgifsPlayer: false },
        open: thread(REDGIFS_LOADER, { before: (w, page) => { page.loaded = []; w.loadMedia = (el, url) => page.loaded.push(url); } }),
        seen: p => p.loaded.length > 0,
    },
    redgifsPlayer: { open: thread(REDGIFS_LOADER, { before: w => { w.loadMedia = () => {}; } }), seen: p => !!p.$('.generic2wide-iframe-div.smg-player-loaded') },
    imagepondEmbeds: { open: thread('<iframe src="https://imagepond.net/videos/abc123" width="560" height="315"></iframe>'), seen: p => !p.$('.bbWrapper iframe[src*="imagepond"]') },
    cyberdropEmbeds: { open: thread('<iframe src="https://cyberdrop.me/e/AbCd1234" width="560" height="315"></iframe>'), seen: p => !p.$('.bbWrapper > iframe[src*="cyberdrop"]') },
    directMedia: { open: thread('<a href="https://cdn.example.com/clip.mp4" class="link link--external">https://cdn.example.com/clip.mp4</a>'), seen: p => !!p.$('.smg-dm-wrap') },
    fileHostCards: { open: thread('<a href="https://gofile.io/d/AbCd12" class="link link--external">https://gofile.io/d/AbCd12</a>'), seen: p => !!p.$('.smg-fhcard') },
    unwrapLinks: { open: thread('<a href="/goto/link-confirmation?url=aHR0cHM6Ly9leGFtcGxlLm9yZy9wYWdl" class="link link--external">Click</a>'), seen: p => p.$('.bbWrapper a').getAttribute('href') === 'https://example.org/page' },
    // with the defaults (image grid on), so links already carrying the script's favicon are grouped too
    groupLinks: { open: thread('<a href="https://example.org/a" class="link link--external">one</a> and <a href="https://example.net/b" class="link link--external">two</a>'), seen: p => !!p.$('.smg-post-links') },
    infiniteScroll: { open: { url: SMG + THREAD, html: threadPage({ posts: [{ id: 1 }], of: 2 }), routes: page2 }, seen: p => p.requested(/page-2/).length > 0 },
    infiniteScrollThreads: { open: { url: SMG + THREAD, html: threadPage({ posts: [{ id: 1 }], of: 2 }), routes: page2 }, seen: p => p.requested(/page-2/).length > 0 },
    infiniteScrollTimeline: {
        open: () => ({ url: SMG + '/?view=feed', html: homePage(), idb: feedDb() }),
        act: async p => { p.scroll(); await p.settle(100); },
        seen: p => p.$$('#smg-river .smg-fp-card').length > 15,
    },
    infiniteScrollWatched: { open: { url: SMG + FORUM, html: listingPage({ rows: [{ id: 1 }], of: 2 }), routes: page2 }, seen: p => p.requested(/page-2/).length > 0 },
    revealLikedPosts: {
        open: thread('<div class="hidethanks">React to this post to see the hidden content</div>'),
        act: async p => { p.click('a.reaction'); await p.settle(10); },
        seen: p => !!p.$('.smg-reveal-spin'),
    },
    autoExpandSpoilers: {
        open: thread('<div class="bbCodeSpoiler"><button type="button" class="bbCodeSpoiler-button button"><span class="button-text">Spoiler</span></button><div class="bbCodeSpoiler-content" style="display: none"><div class="bbCodeBlock bbCodeBlock--spoiler"><div class="bbCodeBlock-content">hidden</div></div></div></div>', { before: xfSpoilers }),
        seen: p => p.$('.bbCodeSpoiler').classList.contains('is-open'),
    },
    keyboardShortcuts: { open: thread('x'), act: async p => { p.key('f'); await p.settle(30); }, seen: p => !!p.$('#smg-media.open') },
    bookmarksFeed: { open: { url: SMG + '/account/bookmarks', html: bookmarksPage([{ id: 3 }]) }, seen: p => !!p.$('#smg-bm-feed') },
    shareDirectLink: {
        open: thread('x'),
        act: async p => { p.click('.smg-pc-act--share, a[data-xf-init="share-tooltip"]'); await p.settle(10); },
        seen: p => p.clipboard.some(u => /post-1$/.test(u)),
    },
};

async function run(t, c, on) {
    const base = typeof c.open === 'function' ? c.open() : c.open;
    const opts = Object.assign({}, base, { gm: Object.assign({}, base.gm), features: Object.assign({}, c.base, { [c.key]: on }) });
    const page = await t.open(opts);
    await page.settle(120);
    if (c.act) await c.act(page);
    const seen = c.seen(page);
    page.close();
    return seen;
}

scenario('the settings panel offers exactly the toggles covered here, and a toggle persists its choice', async t => {
    const page = await t.open({ url: SMG + THREAD, html: threadPage({ posts: [{ id: 1 }] }) });
    await page.settle(60);
    const inputs = page.$$('#smg-settings-pop input[data-feat]');
    assert.deepEqual(inputs.map(i => i.dataset.feat).sort(), Object.keys(CASES).sort());
    const toggle = inputs.find(i => i.dataset.feat === 'groupLinks');
    assert.equal(toggle.checked, true, 'reflects the default');
    toggle.checked = false;
    toggle.dispatchEvent(new page.window.Event('change'));
    assert.equal(JSON.parse(page.gm['smg-features']).groupLinks, false, 'saved to the userscript storage');
});

scenario('link grouping still runs with the image grid on, ignoring the favicons the script put in the links', async t => {
    const page = await t.open(thread('<a href="https://example.org/a" class="link link--external">one</a> and <a href="https://example.net/b" class="link link--external">two</a>'));
    await page.settle(120);
    assert.ok(page.$$('.bbWrapper a.link--external img.smg-linkfav').length > 0, 'the links carry a favicon from the script');
    assert.deepEqual(page.$$('.smg-post-links .smg-link-chip').map(a => a.getAttribute('href')), ['https://example.org/a', 'https://example.net/b']);
});

Object.keys(CASES).forEach(key => {
    scenario('toggle ' + key + ' switches its feature', async t => {
        const c = Object.assign({ key }, CASES[key]);
        assert.equal(await run(t, c, true), true, key + ' on: feature visible');
        assert.equal(await run(t, c, false), false, key + ' off: feature gone');
    });
});
