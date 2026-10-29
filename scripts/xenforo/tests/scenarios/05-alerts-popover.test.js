'use strict';
// Alerts popover: opens from the bell, uses the shared popover registry, loads alert history,
// and becomes a full-screen drawer on phones.
const assert = require('node:assert/strict');
const { scenario } = require('../harness');
const { threadPage, alertsJson, THREAD } = require('../lib');

const URL = 'https://forums.socialmediagirls.com' + THREAD;
const ALERTS = /\/account\/alerts(?:\?|$)(?!.*mark-read)/;

// Page 1 and 2 add alerts; pages 3 and 4 repeat existing rows and end paging.
function alertHistory(extra) {
    const pages = Object.assign({
        1: [[{ id: 801, unread: true }, { id: 802, unread: true }, { id: 803 }], '/account/alerts?page=2'],
        2: [[{ id: 804 }, { id: 805 }], '/account/alerts?page=3'],
        3: [[{ id: 805 }], '/account/alerts?page=4'],
        4: [[{ id: 804 }], '/account/alerts?page=5'],
    }, extra);
    return [[ALERTS, url => {
        const n = +((url.match(/[?&]page=(\d+)/) || [])[1] || 1);
        const pg = pages[n];
        if (pg === 'fail') return null;
        return alertsJson(pg[0], pg[1], n === 1 ? 2 : undefined);
    }]];
}
const pagesAsked = page => page.requested(ALERTS).map(f => +((f.url.match(/[?&]page=(\d+)/) || [])[1] || 1));
const rowIds = page => page.$$('#smg-alpop li.alert').map(li => li.getAttribute('data-alert-id'));
const pop = page => page.$('#smg-alpop');
async function closeLegacyRail(page) {
    if (page.$('#smg-aldock .smg-aldock-close')) {
        page.click('#smg-aldock .smg-aldock-close');
        await page.settle(100);
    }
}
async function openedPopover(page) {
    await page.settle(250);
    const el = pop(page);
    const opened = !!el && el.classList.contains('open');
    // Let the legacy rail close before a deliberate pre-implementation failure.
    if (!el) await closeLegacyRail(page);
    assert.ok(opened, 'the bell opens the alerts popover');
    return el;
}

scenario('the desktop bell toggles one body popover and loads alerts on open', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }], alertBadge: '2' }), routes: alertHistory() });
    assert.equal(pop(page), null, 'popover is created on first open');
    page.click('.smg-tb-bellbtn');
    const dock = await openedPopover(page);
    assert.ok(dock.classList.contains('open'));
    assert.equal(page.$$('body > #smg-alpop').length, 1);
    assert.deepEqual(rowIds(page).slice(0, 3), ['801', '802', '803']);
    assert.equal(pop(page).querySelectorAll('.smg-alpop-skel-row').length, 0, 'skeleton rows are replaced');
    assert.equal(page.text('#smg-alpop .smg-alpop-n'), '2', 'the unread count is shown');
    page.click('.smg-tb-bellbtn');
    assert.ok(!pop(page).classList.contains('open'), 'the bell closes it');
});

scenario('n toggles the alerts popover and an 800px desktop can open it', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }] }), width: 800, routes: alertHistory() });
    page.key('n');
    const alerts = await openedPopover(page);
    assert.ok(alerts.classList.contains('open'));
    page.key('n');
    await page.settle(100);
    assert.ok(!pop(page).classList.contains('open'));
});

scenario('the alerts popover stays open inside, closes outside and on Escape', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }] }), routes: alertHistory() });
    page.click('.smg-tb-bellbtn');
    const alerts = await openedPopover(page);
    page.click(alerts.querySelector('.smg-alpop-body'));
    assert.ok(alerts.classList.contains('open'), 'an inside click keeps it open');
    page.click('.p-footer');
    assert.ok(!alerts.classList.contains('open'), 'an outside click closes it');
    page.click('.smg-tb-bellbtn');
    await openedPopover(page);
    page.key('Escape');
    assert.ok(!alerts.classList.contains('open'), 'Escape closes it');
});

scenario('opening another registered popover closes the alerts popover', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }], page: 1, of: 3 }), routes: alertHistory() });
    page.click('.smg-tb-bellbtn');
    const alerts = await openedPopover(page);
    const jump = page.$$('.smg-bar .smg-bar-btn').find(b => b.title === 'Go to page');
    assert.ok(jump, 'the thread bar has a registered popover trigger');
    page.click(jump);
    assert.ok(!alerts.classList.contains('open'));
    assert.ok(page.$('body > .smg-bar-pop--jump').classList.contains('open'));
});

scenario('the alerts popover is never restored or persisted and never reserves a rail', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }] }), gm: { 'smg-alerts-dock': '1' }, routes: alertHistory() });
    await page.settle(50);
    assert.equal(pop(page), null, 'a previously saved rail does not mount or open');
    page.click('.smg-tb-bellbtn');
    await page.settle(250);
    const alerts = await openedPopover(page);
    assert.ok(alerts.classList.contains('open'));
    assert.equal(page.gm['smg-alerts-dock'], '1', 'the legacy value is not changed');
    assert.ok(!page.document.documentElement.classList.contains('smg-aldock-on'));
    assert.equal(page.document.documentElement.style.marginRight, '', 'the page is not pushed aside');
    assert.equal(page.document.documentElement.style.getPropertyValue('--smg-aldock-width'), '');
});

scenario('opening the alerts popover never writes the legacy open-state key', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }] }), routes: alertHistory() });
    page.click('.smg-tb-bellbtn');
    await openedPopover(page);
    assert.equal(page.gm['smg-alerts-dock'], undefined);
});

scenario('the alerts page can open the alerts popover', async t => {
    const html = threadPage({ posts: [] }).replace(/thread_view/g, 'account_alerts');
    const page = await t.open({ url: 'https://forums.socialmediagirls.com/account/alerts', html, routes: alertHistory() });
    page.click('.smg-tb-bellbtn');
    const alerts = await openedPopover(page);
    assert.ok(alerts.classList.contains('open'));
    assert.deepEqual(pagesAsked(page), [1]);
});

scenario('the popover pages history and stops after two pages with nothing new', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }] }), routes: alertHistory() });
    page.click('.smg-tb-bellbtn');
    await page.settle(300);
    await closeLegacyRail(page);
    assert.deepEqual(rowIds(page), ['801', '802', '803', '804', '805'], 'no alert is repeated');
    assert.deepEqual(pagesAsked(page), [1, 2, 3, 4], 'two all-repeated pages end the list');
    const status = page.$('#smg-alpop .smg-alpop-status');
    assert.ok(!status.hidden);
    assert.equal(page.text(status), 'End of the list');
    page.scroll(page.$('#smg-alpop .smg-alpop-body'));
    await page.settle(50);
    assert.deepEqual(pagesAsked(page), [1, 2, 3, 4], 'scrolling past the end asks for nothing');
});

scenario('a failed history page ends the list instead of retrying on every scroll', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }] }), routes: alertHistory({ 2: 'fail' }) });
    page.click('.smg-tb-bellbtn');
    await page.settle(200);
    const body = page.$('#smg-alpop .smg-alpop-body');
    for (let i = 0; i < 3; i++) { page.scroll(body); await page.settle(30); }
    assert.deepEqual(pagesAsked(page), [1, 2]);
    await closeLegacyRail(page);
});

scenario('the popover keeps paging when infinite scroll is switched off for pages', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }] }), routes: alertHistory(), features: { infiniteScroll: false } });
    page.click('.smg-tb-bellbtn');
    await page.settle(250);
    assert.deepEqual(pagesAsked(page), [1, 2, 3, 4]);
    await closeLegacyRail(page);
});

scenario('mark all as read posts to the forum and clears unread rows and count', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }], alertBadge: '2' }), routes: alertHistory() });
    page.route(/\/account\/alerts\/mark-read/, { json: { status: 'ok' } });
    page.click('.smg-tb-bellbtn');
    await page.settle(300);
    await closeLegacyRail(page);
    assert.equal(page.$$('#smg-alpop li.alert.is-unread').length, 2);
    page.click('#smg-alpop .smg-alpop-markread');
    await page.settle(50);
    const post = page.requested(/mark-read/)[0];
    assert.equal(post.method, 'POST');
    assert.match(String(post.init.body), /_xfToken=csrf-token-1/);
    assert.equal(page.$$('#smg-alpop li.alert.is-unread').length, 0);
    assert.ok(page.$('#smg-alpop .smg-alpop-n').hidden, 'count hidden at zero');
    assert.equal(page.gm['smg-alerts-count'], '0');
});

scenario('on a phone the navbar bell opens a full-screen drawer that locks the page', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }] }), routes: alertHistory(), width: 400, coarse: true, gm: { 'smg-alerts-dock': '1' } });
    await page.settle(80);
    assert.equal(pop(page), null, 'a remembered state does not reopen on a phone');
    page.click('#smg-nav-bell');
    const root = page.document.documentElement;
    await openedPopover(page);
    assert.ok(pop(page).classList.contains('open'));
    assert.ok(root.classList.contains('smg-sheet-lock'), 'background scroll is locked');
    const historyLength = page.window.history.length;
    page.click('#smg-alpop .smg-alpop-close');
    await page.settle(30);
    assert.ok(!root.classList.contains('smg-sheet-lock'), 'closing unlocks the page');
    assert.equal(page.window.history.length, historyLength, 'the drawer is not remembered as an open state');
});
