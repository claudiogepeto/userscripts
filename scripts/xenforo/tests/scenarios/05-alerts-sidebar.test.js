'use strict';
// Alerts sidebar: a rail docked on the right (desktop) that remembers being open across pages,
// pages through the whole alert history, marks everything read, and goes full screen on a phone.
const assert = require('node:assert/strict');
const { scenario } = require('../harness');
const { threadPage, alertsJson, THREAD } = require('../lib');

const URL = 'https://forums.socialmediagirls.com' + THREAD;
const ALERTS = /\/account\/alerts(?:\?|$)(?!.*mark-read)/;

// history: page 1 has 3 alerts (2 unread), page 2 two more, pages 3-4 only repeat → end
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
const rowIds = page => page.$$('#smg-aldock li.alert').map(li => li.getAttribute('data-alert-id'));

scenario('a rail left open on the last page is mounted again and loads the alerts', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }], alertBadge: '2' }), gm: { 'smg-alerts-dock': '1' }, routes: alertHistory() });
    await page.settle(150);
    const dock = page.$('#smg-aldock');
    assert.ok(dock, 'rail mounted');
    assert.ok(page.document.documentElement.classList.contains('smg-aldock-on'), 'page makes room for the rail');
    assert.deepEqual(rowIds(page).slice(0, 3), ['801', '802', '803']);
    assert.equal(dock.querySelectorAll('.smg-aldock-skel-row').length, 0, 'skeleton rows replaced by the real list');
    assert.equal(page.text('#smg-aldock .smg-aldock-n'), '2', 'the unread count is shown');
});

scenario('the rail pages through the history and stops after two pages with nothing new', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }] }), gm: { 'smg-alerts-dock': '1' }, routes: alertHistory() });
    await page.settle(250);
    assert.deepEqual(rowIds(page), ['801', '802', '803', '804', '805'], 'no alert repeated');
    assert.deepEqual(pagesAsked(page), [1, 2, 3, 4], 'two all-repeated pages in a row end the list');
    const status = page.$('#smg-aldock .smg-aldock-status');
    assert.ok(!status.hidden);
    assert.equal(page.text(status), 'End of the list');
    page.scroll(page.$('#smg-aldock .smg-aldock-body'));
    await page.settle(50);
    assert.deepEqual(pagesAsked(page), [1, 2, 3, 4], 'scrolling past the end asks for nothing');
});

scenario('a failed history page ends the list instead of retrying on every scroll', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }] }), gm: { 'smg-alerts-dock': '1' }, routes: alertHistory({ 2: 'fail' }) });
    await page.settle(200);
    const body = page.$('#smg-aldock .smg-aldock-body');
    for (let i = 0; i < 3; i++) { page.scroll(body); await page.settle(30); }
    assert.deepEqual(pagesAsked(page), [1, 2]);
});

scenario('the rail keeps paging when infinite scroll is switched off for pages', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }] }), gm: { 'smg-alerts-dock': '1' }, routes: alertHistory(), features: { infiniteScroll: false } });
    await page.settle(250);
    assert.deepEqual(pagesAsked(page), [1, 2, 3, 4]);
});

scenario('mark all as read posts to the forum and clears every unread row and the count', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }], alertBadge: '2' }), gm: { 'smg-alerts-dock': '1' }, routes: alertHistory() });
    page.route(/\/account\/alerts\/mark-read/, { json: { status: 'ok' } });
    await page.settle(200);
    assert.equal(page.$$('#smg-aldock li.alert.is-unread').length, 2);
    page.click('#smg-aldock .smg-aldock-markread');
    await page.settle(50);
    const post = page.requested(/mark-read/)[0];
    assert.equal(post.method, 'POST');
    assert.match(String(post.init.body), /_xfToken=csrf-token-1/);
    assert.equal(page.$$('#smg-aldock li.alert.is-unread').length, 0);
    assert.ok(page.$('#smg-aldock .smg-aldock-n').hidden, 'count hidden at zero');
    assert.equal(page.gm['smg-alerts-count'], '0');
});

scenario('n toggles the rail and the choice is remembered; close forgets it', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }] }), routes: alertHistory() });
    await page.settle(50);
    assert.equal(page.$('#smg-aldock'), null, 'closed by default');
    page.key('n');
    await page.settle(100);
    assert.ok(page.document.documentElement.classList.contains('smg-aldock-on'));
    assert.equal(page.gm['smg-alerts-dock'], '1');
    page.click('#smg-aldock .smg-aldock-close');
    assert.ok(!page.document.documentElement.classList.contains('smg-aldock-on'));
    assert.equal(page.gm['smg-alerts-dock'], '0');
});

scenario('on the alerts page itself the rail stays away (the page is the list)', async t => {
    const html = threadPage({ posts: [] }).replace(/thread_view/g, 'account_alerts');
    const page = await t.open({ url: 'https://forums.socialmediagirls.com/account/alerts', html, gm: { 'smg-alerts-dock': '1' }, routes: alertHistory() });
    await page.settle(100);
    assert.ok(!page.document.documentElement.classList.contains('smg-aldock-on'));
    assert.equal(page.requested(ALERTS).length, 0);
});

scenario('on a phone the rail opens full screen, locks the page behind it, and is not remembered', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }] }), routes: alertHistory(), width: 400, coarse: true, gm: { 'smg-alerts-dock': '1' } });
    await page.settle(80);
    assert.ok(!page.document.documentElement.classList.contains('smg-aldock-on'), 'a remembered rail does not reopen by itself on a phone');
    page.key('n');
    await page.settle(80);
    const root = page.document.documentElement;
    assert.ok(root.classList.contains('smg-aldock-on'));
    assert.ok(root.classList.contains('smg-sheet-lock'), 'background scroll locked');
    page.click('#smg-aldock .smg-aldock-close');
    await page.settle(30);
    assert.ok(!root.classList.contains('smg-sheet-lock'), 'unlocked on close');
});
