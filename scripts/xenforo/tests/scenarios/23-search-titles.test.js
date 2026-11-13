'use strict';
// Titles-only search sends parser-safe title terms and keeps the newest inline response.
const assert = require('node:assert/strict');
const { scenario } = require('../harness');
const { listingPage, FORUM } = require('../lib');

const ORIGIN = 'https://forums.socialmediagirls.com';

function resultRows(titles) {
    return '<div class="block-body">' + titles.map((title, i) =>
        `<div class="contentRow"><div class="contentRow-main"><h3 class="contentRow-title"><a href="/threads/result-${i}.1/">${title}</a></h3></div></div>`
    ).join('') + '</div>';
}

function postFields(fetch) {
    return new URLSearchParams(fetch.init.body);
}

function inputFor(page) {
    return page.$('.smg-tb-search-input') || page.$('.smg-search-input');
}

function search(page, query) {
    const input = inputFor(page);
    input.value = query;
    input.dispatchEvent(new page.window.Event('input', { bubbles: true }));
    page.click('.smg-search-go');
}

scenario('titles-only requests normalize handles into parser-safe index tokens', async t => {
    const page = await t.open({
        url: ORIGIN + FORUM,
        html: listingPage({ rows: [{ id: 1 }] }),
        routes: [[/\/search\/search(?:\?|$)/, (url, init) => {
            const keywords = new URLSearchParams(init.body).get('keywords') || '';
            return { body: resultRows([keywords.split(' OR ').map(token => token.replace(/\*$/, '')).join(' ')]) };
        }]],
        before(window) { window.localStorage.setItem('smg-search-def-titles', '1'); },
    });
    await page.settle(80);

    const cases = [
        ['Zara Larsson', 'zara* OR larsson*'],
        ['TiffyASMR', 'tiffy* OR asmr*'],
        ['Pia Volckmann pia__kim', 'pia* OR volckmann* OR kim*'],
        ['ol', 'ol'],
    ];
    for (let i = 0; i < cases.length; i++) {
        const [query, expected] = cases[i];
        search(page, query);
        assert.ok(await page.waitFor(() => page.requested(/\/search\/search/).length >= i + 1), `request sent for ${query}`);
        assert.ok(await page.waitFor(() => !page.$('.smg-search-rloading')), `response rendered for ${query}`);
        const fields = postFields(page.requested(/\/search\/search/).at(-1));
        assert.equal(fields.get('c[title_only]'), '1');
        assert.equal(fields.get('keywords'), expected);
    }
});

scenario('titles-only matches the whole query case-insensitively and ignores accents', async t => {
    const page = await t.open({
        url: ORIGIN + FORUM,
        html: listingPage({ rows: [{ id: 1 }] }),
        routes: [[/\/search\/search(?:\?|$)/, { body: resultRows([
            'Other Zara topic',
            'Larsson Zara profile',
            'ZARA LARSSON official',
            'zArA lArSsOn creator',
            'Beyoncé live',
            'Unrelated topic',
        ]) }]],
        before(window) { window.localStorage.setItem('smg-search-def-titles', '1'); },
    });
    await page.settle(80);
    search(page, 'zArA lArSsOn');
    assert.ok(await page.waitFor(() => page.$$('.smg-search-result').length > 0), 'inline results rendered');
    assert.deepEqual(page.$$('.smg-search-result-title').map(el => el.textContent), [
        'ZARA LARSSON official', 'zArA lArSsOn creator',
    ]);

    search(page, 'BEYONCE');
    assert.ok(await page.waitFor(() => page.$$('.smg-search-result-title').length === 1), 'accent-insensitive result rendered');
    assert.equal(page.$('.smg-search-result-title').textContent, 'Beyoncé live');
});

scenario('a late titles-only response for an older query cannot replace the latest results', async t => {
    const page = await t.open({
        url: ORIGIN + FORUM,
        html: listingPage({ rows: [{ id: 1 }] }),
        routes: [[/\/search\/search(?:\?|$)/, (url, init) => {
            const query = new URLSearchParams(init.body).get('keywords');
            return { body: resultRows([query.includes('older') ? 'Older title' : 'Newer title']), delay: query.includes('older') ? 90 : 10 };
        }]],
        before(window) { window.localStorage.setItem('smg-search-def-titles', '1'); },
    });
    await page.settle(80);
    search(page, 'older title');
    await page.settle(15);
    search(page, 'newer title');
    assert.ok(await page.waitFor(() => page.$('.smg-search-result-title')?.textContent === 'Newer title'), 'newer response rendered');
    await page.settle(120);
    assert.equal(page.$('.smg-search-result-title')?.textContent, 'Newer title');
});
