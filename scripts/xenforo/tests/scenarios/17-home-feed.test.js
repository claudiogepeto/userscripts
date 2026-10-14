'use strict';
// Home "What's new" cards: a card thumbnail uses the host's reduced rendition when one is known
// (the thread thumbnail is usually the original file), and falls back to the original if it fails.
const assert = require('node:assert/strict');
const { scenario } = require('../harness');
const { listingPage, homePage } = require('../lib');

const CHV = 'https://simp6.cuckcapital.cr/images3/abc123.jpg';
const POND = 'https://media.imagepond.net/media/images/photo_Xy12.png';
const GIF = 'https://simp6.cuckcapital.cr/images3/anim.gif';

function whatsNew() {
    return listingPage({ rows: [{ id: 11, thumb: CHV }, { id: 12, thumb: POND }, { id: 13, thumb: GIF }], base: '/whats-new/posts/' })
        .replace(/forum_view/g, 'whats_new_posts');
}

scenario('home cards load the reduced rendition where the host has one and fall back to the original', async t => {
    const page = await t.open({
        url: 'https://forums.socialmediagirls.com/',
        html: homePage(),
        routes: [[/\/whats-new\/posts\//, () => whatsNew()]],
    });
    await page.settle(150);
    const imgs = page.$$('.smg-feed-panel.is-active .smg-feed-card .smg-feed-card-thumb img');
    assert.equal(imgs.length, 3, 'three cards with thumbnails');
    const [chv, pond, gif] = imgs;
    assert.equal(chv.getAttribute('src'), 'https://simp6.cuckcapital.cr/images3/abc123.md.jpg', 'Chevereto CDN: the .md. rendition');
    assert.equal(pond.getAttribute('src'), POND, 'imagepond has no rendition: the original');
    assert.equal(gif.getAttribute('src'), GIF, 'a GIF stays as it is');
    const box = chv.closest('.smg-feed-card-thumb');
    chv.dispatchEvent(new page.window.Event('error'));
    assert.equal(chv.getAttribute('src'), CHV, 'the reduced one failed: the original is tried');
    assert.ok(!box.classList.contains('smg-feed-noimg'), 'no placeholder yet');
    chv.dispatchEvent(new page.window.Event('error'));
    assert.ok(box.classList.contains('smg-feed-noimg'), 'the original failed too: placeholder');
});
