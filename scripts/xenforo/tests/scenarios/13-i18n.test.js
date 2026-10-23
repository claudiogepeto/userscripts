'use strict';
// i18n: the UI the script injects follows the forum language (<html lang>): English by default,
// Brazilian Portuguese on pt-* forums. Forum content is never translated.
const assert = require('node:assert/strict');
const { scenario } = require('../harness');
const { threadPage, alertsJson, THREAD } = require('../lib');

const URL = 'https://forums.socialmediagirls.com' + THREAD;
const LANGS = { en: 'en-US', pt: 'pt-BR' };

async function threadIn(t, lang, extra) {
    const page = await t.open(Object.assign({
        url: URL,
        html: threadPage({ lang: LANGS[lang], posts: [{ id: 1, body: 'Media Page Settings' }], page: 1, of: 2 }),
        routes: [[/page-2/, () => threadPage({ lang: LANGS[lang], posts: [{ id: 2 }], page: 2, of: 2 })]],
    }, extra));
    await page.settle(100);
    return page;
}
const settingsTexts = page => ({
    sections: page.$$('#smg-settings-pop .smg-set-sectitle').map(e => e.textContent),
    labels: page.$$('#smg-settings-pop .smg-set-label').map(e => e.textContent),
    descs: page.$$('#smg-settings-pop .smg-set-desc').map(e => e.textContent),
});

scenario('an English forum gets English UI', async t => {
    const page = await threadIn(t, 'en');
    assert.equal(page.$('#smg-thread-media').getAttribute('aria-label'), 'Media');
    assert.equal(page.text('.smg-inf-sep'), 'Page 2');
    const s = settingsTexts(page);
    assert.ok(s.sections.includes('Appearance') && s.labels.includes('Redesigned top bar'));
    assert.ok(s.descs[0].startsWith('Replaces the original header'));
});

scenario('a Portuguese forum gets Portuguese UI in the same places', async t => {
    const page = await threadIn(t, 'pt');
    assert.equal(page.$('#smg-thread-media').getAttribute('aria-label'), 'Mídia');
    assert.equal(page.text('.smg-inf-sep'), 'Página 2');
    const s = settingsTexts(page);
    assert.ok(s.sections.includes('Aparência') && s.labels.includes('Barra superior redesenhada'));
    assert.ok(s.descs[0].startsWith('Substitui o cabeçalho original'));
});

scenario('settings sections, labels and descriptions have Portuguese versions', async t => {
    const en = settingsTexts(await threadIn(t, 'en'));
    const pt = settingsTexts(await threadIn(t, 'pt'));
    assert.equal(pt.labels.length, en.labels.length);
    const same = (a, b) => a.filter((x, i) => x === b[i]);
    assert.deepEqual(same(pt.sections, en.sections).filter(x => x !== 'Feed'), [], 'untranslated sections');
    assert.deepEqual(same(pt.labels, en.labels), [], 'untranslated toggle labels');
    assert.deepEqual(same(pt.descs, en.descs), [], 'untranslated descriptions');
});

scenario('Portuguese reaches dynamic text too: toasts and the alerts rail', async t => {
    const page = await threadIn(t, 'pt', { gm: { 'smg-alerts-dock': '1' }, routes: [[/account\/alerts/, alertsJson([{ id: 1 }], null, 0)]] });
    await page.settle(100);
    assert.equal(page.text('#smg-aldock .smg-aldock-titletext'), 'Alertas');
    assert.equal(page.text('#smg-aldock .smg-aldock-status'), 'Fim da lista');
});

scenario('forum content is never translated', async t => {
    const page = await threadIn(t, 'pt');
    assert.equal(page.text('#js-post-1 .bbWrapper'), 'Media Page Settings');
});
