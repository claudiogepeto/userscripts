'use strict';
// Thread cards: grid unread badges and tags, plus the followed-list Manage action.
const assert = require('node:assert/strict');
const { scenario } = require('../harness');
const { listingPage, watchedThreadsPage, FORUM } = require('../lib');

const SMG = 'https://forums.socialmediagirls.com';
const grid = { 'smg-threadview': 'grid' };
const labels = '<span class="label label--primary">Hot</span><span class="label-append"> </span><span class="prefix prefix--accent">Pinned</span>';

scenario('grid unread thread cards show one translated NEW badge in the thumbnail; read cards do not', async t => {
    for (const [lang, word] of [['en-US', 'NEW'], ['pt-BR', 'NOVO']]) {
        const html = listingPage({ lang, rows: [
            { id: 221, title: 'Unread', unread: true },
            { id: 222, title: 'Read' },
        ] });
        const page = await t.open({ url: SMG + FORUM, html, gm: Object.assign({}, grid) });
        await page.settle(60);
        const row = page.$('.js-threadListItem-221');
        const badge = row.querySelectorAll('.smg-card-new');
        assert.equal(badge.length, 1, 'one badge on an unread card');
        assert.equal(badge[0].textContent.trim(), word);
        assert.ok(badge[0].closest('.structItem-cell--icon'), 'badge is in the thumbnail cell');
        assert.equal(page.$('.js-threadListItem-222 .smg-card-new'), null, 'read cards have no badge');

        // Simulate the same row being revisited by a list re-scan after an append.
        row.removeAttribute('data-smg-decorated');
        row.parentElement.appendChild(row);
        await page.settle(40);
        assert.equal(row.querySelectorAll('.smg-card-new').length, 1, 'redecorating does not duplicate the badge');
        // jsdom reports getComputedStyle(element, '::after') as not implemented, so the legacy-dot
        // pseudo-element cannot be observed by this harness.
        page.close();
    }
});

scenario('grid thread labels move into one horizontal tags row with working, non-navigating arrows', async t => {
    let originalLabels;
    const page = await t.open({
        url: SMG + FORUM,
        html: listingPage({ rows: [
            { id: 223, title: 'Tagged thread', prefix: labels },
            { id: 224, title: 'Plain thread' },
        ] }),
        gm: Object.assign({}, grid),
        before(window, page) {
            const row = page.document.querySelector('.js-threadListItem-223');
            originalLabels = Array.from(row.querySelectorAll('.structItem-title > .label, .structItem-title > .prefix'));
        },
    });
    await page.settle(60);
    const row = page.$('.js-threadListItem-223');
    const title = row.querySelector('.structItem-title');
    assert.equal(originalLabels.length, 2);
    const tags = title.querySelector('.smg-card-tags');
    assert.ok(tags, 'tag container exists');
    assert.ok(tags.nextElementSibling.matches('a[data-tp-primary]'), 'tags sit before the title link');
    const track = tags.querySelector('.smg-card-tags-track');
    assert.ok(track, 'labels have a horizontal scrolling track');
    assert.deepEqual(Array.from(track.querySelectorAll('.label, .prefix')), originalLabels, 'original label elements are moved, not cloned');
    assert.equal(track.querySelectorAll('.label-append').length, 0, 'XenForo label-append spacers are dropped');
    assert.equal(row.querySelectorAll('.smg-card-tags').length, 1);
    assert.equal(page.$('.js-threadListItem-224 .smg-card-tags'), null, 'cards without labels get no tag container');

    const prev = tags.querySelector('.smg-card-tags-prev');
    const next = tags.querySelector('.smg-card-tags-next');
    assert.ok(prev && next, 'both arrow buttons exist');
    let scrollCalls = 0;
    track.scrollBy = options => {
        scrollCalls++;
        track.scrollLeft += typeof options === 'number' ? options : (options.left || 0);
    };
    const initial = track.scrollLeft;
    const clickNext = new page.window.MouseEvent('click', { bubbles: true, cancelable: true });
    assert.equal(next.dispatchEvent(clickNext), false, 'next arrow prevents its default action');
    assert.notEqual(track.scrollLeft, initial, 'next arrow scrolls the tag track');
    const afterNext = track.scrollLeft;
    const clickPrev = new page.window.MouseEvent('click', { bubbles: true, cancelable: true });
    assert.equal(prev.dispatchEvent(clickPrev), false, 'previous arrow prevents its default action');
    assert.notEqual(track.scrollLeft, afterNext, 'previous arrow scrolls the tag track');
    assert.ok(scrollCalls >= 2, 'scroll handlers act on the track');
    assert.equal(page.window.location.pathname, FORUM, 'arrow clicks do not navigate');
    assert.equal(page.requested(/threads\/thread-223/).length, 0, 'arrow clicks do not follow the card link');
});

scenario('watched threads moves the original Manage action into the title row and preserves forum actions', async t => {
    let originalButton, originalMenu;
    const watched = await t.open({
        url: SMG + '/watched/threads',
        html: watchedThreadsPage({ rows: [{ id: 225 }] }),
        gm: Object.assign({}, grid),
        before(window, page) {
            originalButton = page.document.querySelector('.block-outer-opposite .menuTrigger');
            originalMenu = page.document.querySelector('.block-outer-opposite .menu');
        },
    });
    await watched.settle(60);
    const title = watched.$('.p-body-header .p-title');
    const action = title.querySelector('.p-title-pageAction');
    assert.ok(action, 'Manage action is in the page title');
    assert.equal(title.querySelectorAll('.p-title-pageAction').length, 1);
    assert.equal(action.querySelector('.menuTrigger'), originalButton, 'the original button was moved');
    assert.equal(action.querySelector('.menu'), originalMenu, 'the original menu was moved');
    const outer = watched.$('.block form .block-outer') || watched.$('.block-outer');
    assert.ok(!outer || !outer.isConnected || watched.window.getComputedStyle(outer).display === 'none', 'empty pager row is hidden or removed');

    const forum = await t.open({ url: SMG + FORUM, html: listingPage({ rows: [{ id: 226 }] }) });
    await forum.settle(50);
    assert.ok(forum.$('.p-title-pageAction'), 'normal forum page keeps its existing page action');
    assert.equal(forum.$('.p-title-pageAction .menuTrigger'), null, 'forum action is not replaced by Manage');
});

scenario('soft navigation to watched threads moves Manage into the title exactly once', async t => {
    const watched = watchedThreadsPage({ rows: [{ id: 227 }] });
    const page = await t.open({
        url: SMG + FORUM,
        html: listingPage({ rows: [{ id: 228 }] }),
        routes: [[/\/watched\/threads(?:\?|$)/, watched]],
    });
    await page.settle(50);
    const link = page.document.createElement('a');
    link.href = '/watched/threads';
    link.textContent = 'Followed threads';
    page.$('.p-body-content').appendChild(link);
    page.click(link);
    await page.settle(120);
    assert.equal(page.window.location.pathname, '/watched/threads');
    const title = page.$('.p-body-header .p-title');
    assert.ok(title.querySelector('.p-title-pageAction .menuTrigger'), 'Manage is beside the followed title');
    assert.equal(title.querySelectorAll('.p-title-pageAction').length, 1, 'only one title action wrapper exists');
    assert.equal(page.$$('.block-outer-opposite .menuTrigger').length, 0, 'the original list action is no longer in the list row');
    assert.equal(page.$$('.p-title-pageAction .menuTrigger').length, 1, 'the action is applied once');
});
