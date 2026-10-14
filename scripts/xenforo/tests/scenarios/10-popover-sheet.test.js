'use strict';
// Popover and sheet: ONE popover registry (click outside / Escape close, one open at a time) and
// ONE bottom-sheet mechanism (locks the page behind, back button closes, scrim/Escape close).
const assert = require('node:assert/strict');
const { scenario } = require('../harness');
const { threadPage, THREAD } = require('../lib');

const URL = 'https://forums.socialmediagirls.com' + THREAD;

async function threadOf3(t, extra) {
    const page = await t.open(Object.assign({ url: URL, html: threadPage({ posts: [{ id: 1 }], page: 1, of: 3 }) }, extra));
    await page.settle(80);
    return page;
}

scenario('popover: the go-to-page popover opens on its button and closes on an outside click or Escape', async t => {
    const page = await threadOf3(t);
    const trigger = page.$$('.smg-bar .smg-bar-btn').find(b => b.title === 'Go to page');
    assert.ok(trigger, 'thread bar has a go-to-page button');
    const pop = page.$('body > .smg-bar-pop--jump');
    assert.ok(pop, 'the popover lives in <body>, outside the clipped header');
    page.click(trigger);
    assert.ok(pop.classList.contains('open'));
    page.click(pop.querySelector('input'));
    assert.ok(pop.classList.contains('open'), 'a click inside keeps it open');
    page.click('.p-footer');
    assert.ok(!pop.classList.contains('open'), 'outside click closes');
    page.click(trigger);
    page.key('Escape');
    assert.ok(!pop.classList.contains('open'), 'Escape closes');
});

scenario('sheet: on a phone the dock options open as a bottom sheet that locks the page; Escape closes and unlocks', async t => {
    const page = await threadOf3(t, { width: 400, coarse: true });
    const root = page.document.documentElement;
    const historyBefore = page.window.history.length;
    page.click('#smg-dock-sheet-btn');
    const sheet = page.$('#smg-sheet');
    assert.ok(sheet.classList.contains('open'));
    assert.ok(root.classList.contains('smg-sheet-lock'), 'background locked');
    assert.equal(page.window.history.length, historyBefore + 1, 'one history entry so Back closes the sheet');
    assert.ok(page.$$('#smg-sheet .smg-sheet-title').map(e => e.textContent).includes('Navigation'), 'thread actions offered');
    page.key('Escape');
    assert.ok(!sheet.classList.contains('open'));
    assert.ok(!root.classList.contains('smg-sheet-lock'));
});

scenario('sheet: tapping the scrim or pressing Back closes it', async t => {
    const page = await threadOf3(t, { width: 400, coarse: true });
    const sheet = () => page.$('#smg-sheet');
    page.click('#smg-dock-sheet-btn');
    page.click(sheet());
    assert.ok(!sheet().classList.contains('open'), 'scrim tap closes');
    await page.settle(30);
    page.click('#smg-dock-sheet-btn');
    page.window.dispatchEvent(new page.window.PopStateEvent('popstate', { state: null }));
    assert.ok(!sheet().classList.contains('open'), 'Back closes');
    assert.ok(!page.document.documentElement.classList.contains('smg-sheet-lock'));
});
