'use strict';
// Lazy media slots (ImagePond, Cyberdrop): a slot far from the viewport shows a still ring and only
// spins once its load has actually started, so an idle page runs no endless animation.
const assert = require('node:assert/strict');
const { scenario } = require('../harness');
const { threadPage, THREAD } = require('../lib');

const URL = 'https://forums.socialmediagirls.com' + THREAD;
const BODY = '<iframe src="https://imagepond.net/videos/abc123"></iframe>';

scenario('an imagepond slot stays still until it activates, then spins while it resolves', async t => {
    const page = await t.open({
        url: URL,
        html: threadPage({ posts: [{ id: 1, body: BODY }] }),
        gmRoutes: [[/imagepond\.net\/videos\/abc123/, () => new Promise(() => {})]],
    });
    await page.settle(50);
    const slot = page.$('.generic2wide-iframe-div .smg-turbo-slot');
    assert.ok(slot, 'the iframe became our slot');
    const ring = slot.querySelector('.smg-loading');
    assert.ok(ring, 'the slot has its loading ring');
    assert.ok(ring.classList.contains('smg-loading-idle'), 'not activated yet: the ring does not spin');
    assert.equal(page.requested(/imagepond/).length + page.gmRequests.filter(r => /imagepond/.test(r.url)).length, 0, 'nothing requested before activation');
    assert.ok(page.intersect(slot) > 0, 'the slot is observed by the lazy observer');
    await page.settle(20);
    assert.ok(slot.dataset.ipActivated, 'the slot activated');
    assert.ok(!ring.classList.contains('smg-loading-idle'), 'load in flight: the ring spins');
});
