'use strict';
// Mobile navigation state: a page swap updates the shared controls once, browser history
// moves through soft navigations, and the alerts bell opens its rail without following its link.
const assert = require('node:assert/strict');
const { scenario } = require('../harness');
const { threadPage, listingPage, THREAD, FORUM } = require('../lib');

const SMG = 'https://forums.socialmediagirls.com';
const OTHER = '/threads/other.200/';

function routes() {
    return [
        [/\/threads\/other\.200\/(?:$|\?)/, () => threadPage({ posts: [{ id: 2001, thread: OTHER }], base: OTHER, page: 1, of: 9 }).replace(/Sample Thread/g, 'Other Thread')],
        [/\/threads\/sample-thread\.100\/page-2/, () => threadPage({ posts: [{ id: 2 }], page: 2, of: 3 })],
        [/\/threads\/sample-thread\.100\/(?:$|\?)/, () => threadPage({ posts: [{ id: 1 }], page: 1, of: 3 })],
        [/\/forums\/instagram\.5\/(?:$|\?)/, () => listingPage({ rows: [{ id: 1 }] })],
        [/\/account\/alerts\?_xfResponseType=json/, { json: { html: { content: '<ol></ol>' } } }],
        [/\/account\/alerts(?:$|\?)/, threadPage({ posts: [{ id: 9001 }], page: 1, of: 1 }).replace(/Sample Thread/g, 'Alerts Page')],
    ];
}

function link(page, href) {
    const a = page.document.createElement('a');
    a.href = href;
    a.textContent = 'go';
    page.$('.p-body-content').appendChild(a);
    return a;
}

async function go(page, href) {
    page.click(link(page, href));
    await page.settle(100);
}

scenario('soft link to another thread refreshes the mobile dock and threadbar exactly once', async t => {
    const page = await t.open({ url: SMG + THREAD + 'page-2', html: threadPage({ posts: [{ id: 2 }], page: 2, of: 3 }), routes: routes(), width: 400, coarse: true });
    await page.settle(80);
    await go(page, OTHER);
    assert.equal(page.window.location.pathname, OTHER);
    assert.match(page.$('#smg-mobile-threadbar-title').textContent, /Other Thread/);
    assert.equal(page.$$('#smg-post-nav-wrapper').length, 1, 'the dock exists once');
    assert.equal(page.$$('#smg-mobile-page-pop').length, 1, 'the mobile pager popover exists once');
    assert.equal(page.$$('#smg-mobile-page-pop .smg-mp-next').length, 1, 'the mobile next control exists once');
    assert.equal(page.$('#smg-mobile-page-btn .smg-nav-btn-text').textContent.trim(), '1 / 9', 'dock page state resets for the destination thread');
});

scenario('Back and Forward each restore one page through a soft swap', async t => {
    const page = await t.open({ url: SMG + THREAD, html: threadPage({ posts: [{ id: 1 }], page: 1, of: 3 }), routes: routes() });
    await page.settle(60);
    await go(page, FORUM);
    await go(page, OTHER);
    page.window.history.back();
    assert.ok(await page.waitFor(() => page.window.location.pathname === FORUM && !!page.$('.structItem--thread')), 'Back restores the forum listing');
    page.window.history.back();
    assert.ok(await page.waitFor(() => page.window.location.pathname === THREAD && !!page.$('#js-post-1')), 'the next Back restores the first thread');
    page.window.history.forward();
    assert.ok(await page.waitFor(() => page.window.location.pathname === FORUM && !!page.$('.structItem--thread')), 'Forward restores the forum listing');
});

scenario('Back closes an open mobile alerts modal without navigating, then the next Back navigates once', async t => {
    const page = await t.open({ url: SMG + THREAD, html: threadPage({ posts: [{ id: 1 }] }), routes: routes(), width: 400, coarse: true, gm: { 'smg-alerts-dock': '1' } });
    await page.settle(80);
    await go(page, OTHER);
    page.click('#smg-nav-bell');
    await page.settle(30);
    assert.ok(page.document.documentElement.classList.contains('smg-aldock-on'));
    assert.equal(page.window.location.pathname, OTHER);
    page.window.history.back();
    assert.ok(await page.waitFor(() => !page.document.documentElement.classList.contains('smg-aldock-on')), 'Back closes the modal');
    assert.equal(page.window.location.pathname, OTHER, 'closing the modal keeps the current page');
    page.window.history.back();
    assert.ok(await page.waitFor(() => page.window.location.pathname === THREAD && !!page.$('#js-post-1')), 'the next Back navigates exactly one page');
});

scenario('a real Back closes the options sheet after a lost close echo', async t => {
    let lostCloseEcho = false;
    const page = await t.open({
        url: SMG + THREAD,
        html: threadPage({ posts: [{ id: 1 }] }),
        routes: routes(),
        width: 400,
        coarse: true,
        gm: { 'smg-alerts-dock': '1' },
        before(window) {
            const nativeBack = window.history.back.bind(window.history);
            window.history.back = () => {
                if (!lostCloseEcho) { lostCloseEcho = true; return; }
                nativeBack();
            };
        },
    });
    await page.settle(80);
    await go(page, OTHER);
    page.click('#smg-dock-sheet-btn');
    await page.settle(30);
    assert.ok(page.$('#smg-sheet').classList.contains('open'));

    // Simulate the browser dropping the close-triggered history.back traversal. The options sheet
    // is closed, but its recorded echo remains pending while navigation changes the current URL.
    page.click('#smg-sheet');
    await page.settle(30);
    assert.ok(!page.$('#smg-sheet').classList.contains('open'));
    page.window.history.replaceState({}, '', FORUM);

    page.click('#smg-dock-sheet-btn');
    await page.settle(30);
    assert.ok(page.$('#smg-sheet').classList.contains('open'));
    page.window.history.back();
    assert.ok(await page.waitFor(() => !page.$('#smg-sheet').classList.contains('open') && page.$('.structItem--thread')), 'Back closes the newly opened sheet while the page is restored');
    assert.equal(page.window.location.pathname, FORUM, 'Back restores the current page URL');
});

scenario('mobile bell after a soft navigation opens alerts without following its href', async t => {
    const page = await t.open({ url: SMG + THREAD, html: threadPage({ posts: [{ id: 1 }] }), routes: routes(), width: 400, coarse: true });
    await page.settle(80);
    await go(page, OTHER);
    const current = page.window.location.href;
    page.click('#smg-nav-bell');
    await page.settle(100);
    assert.ok(page.document.documentElement.classList.contains('smg-aldock-on'), 'alerts rail opened');
    assert.equal(page.window.location.href, current, 'bell did not navigate to the alerts page');
    assert.equal(page.requested(/\/account\/alerts(?:\?|$)/).filter(f => !/[?&]_xfResponseType=json(?:&|$)/.test(f.url)).length, 0, 'bell did not request the alerts page for a soft navigation');
});
