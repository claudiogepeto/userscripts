'use strict';
// Media mode: ONE overlay (#smg-media) with two views over ONE media list, Gallery (masonry, per
// page) and Feed (one item at a time). Switching views never refetches; ?view= survives a reload;
// closing tears everything down.
const assert = require('node:assert/strict');
const { scenario } = require('../harness');
const { threadPage, THREAD } = require('../lib');

const URL = 'https://forums.socialmediagirls.com' + THREAD;
const MEDIA_BODY = '<img class="bbImage" src="https://example.com/media/m1.jpg" width="1080" height="1350">'
    + '<img class="bbImage" src="https://example.com/media/m2.jpg" width="1920" height="1080">'
    + '<iframe class="saint-iframe" src="https://turbo.cr/embed/vid123"></iframe>'
    + '<img class="bbImage" src="https://example.com/media/m3.jpg" width="1080" height="1350">';

async function mediaPage(t, extra) {
    const page = await t.open(Object.assign({
        url: URL,
        html: threadPage({ posts: [{ id: 1, body: 'Hello' }] }),
        routes: [[/\/threads\/sample-thread\.100\/(\?|$)/, () => threadPage({ posts: [{ id: 1, body: MEDIA_BODY }] })]],
    }, extra));
    await page.settle(50);
    page.pageFetches = () => page.requested(/\/threads\/sample-thread\.100\/(\?|$)/).length;
    page.view = () => new page.window.URL(page.window.location.href).searchParams.get('view');
    return page;
}

scenario('the dock has the one Media button; it opens the overlay on the Gallery with page 1 media', async t => {
    const page = await mediaPage(t);
    const btn = page.$('#smg-thread-media');
    assert.ok(btn, 'the dock carries the Media entry');
    assert.equal(btn.getAttribute('aria-label'), 'Media');
    assert.equal(page.$$('.smg-thead-actions .smg-thead-btn').length, 0, 'the sticky header no longer repeats it');
    page.click(btn);
    await page.settle(60);
    const root = page.$('#smg-media');
    assert.ok(root.classList.contains('open'));
    assert.equal(root.dataset.view, 'gallery');
    assert.equal(page.$$('#smg-media').length, 1);
    assert.ok(root.querySelector('#smg-gallery') && root.querySelector('#smg-feed'), 'both views live in the one root');
    assert.equal(root.querySelectorAll('#smg-gallery .smg-gallery-tile').length, 4);
    assert.equal(page.pageFetches(), 1);
    assert.equal(page.view(), 'gallery');
    assert.equal(page.$('#smg-media-view-gallery').getAttribute('aria-pressed'), 'true');
});

scenario('switching Gallery and Feed reuses the same list without fetching again', async t => {
    const page = await mediaPage(t);
    page.click('#smg-thread-media');
    await page.settle(60);
    page.click('#smg-media-view-feed');
    await page.settle(30);
    const root = page.$('#smg-media');
    assert.equal(root.dataset.view, 'feed');
    assert.equal(root.querySelectorAll('#smg-feed .smg-feed-slide').length, 4);
    assert.equal(page.view(), 'feed');
    assert.equal(page.$('#smg-media-view-feed').getAttribute('aria-pressed'), 'true');
    page.click('#smg-media-view-gallery');
    await page.settle(30);
    assert.equal(root.dataset.view, 'gallery');
    assert.equal(root.querySelectorAll('#smg-gallery .smg-gallery-tile').length, 4, 'the gallery is still mounted');
    assert.equal(root.querySelector('#smg-feed iframe, #smg-feed video'), null, 'leaving the feed stops its players');
    assert.equal(page.pageFetches(), 1, 'no view switch fetched again');
});

scenario('a gallery tile opens the Feed on that item; a video tile maximise opens it with its player', async t => {
    const page = await mediaPage(t);
    page.click('#smg-thread-media');
    await page.settle(60);
    page.click(page.$$('#smg-gallery .smg-gallery-tile--image')[1]);
    await page.settle(30);
    assert.equal(page.$('#smg-media').dataset.view, 'feed');
    assert.equal(page.text('#smg-feed .smg-feed-counter'), '2 / 4');
    page.click('#smg-media-view-gallery');
    await page.settle(30);
    page.click('#smg-gallery .smg-gallery-tile--embed .smg-gallery-max');
    await page.settle(30);
    assert.equal(page.text('#smg-feed .smg-feed-counter'), '3 / 4');
    assert.equal(page.$$('#smg-feed iframe').length, 1, 'the active video slide mounts its player');
});

scenario('the gallery lays its tiles on the masonry engine: landscape tiles span 2 of 3 columns', async t => {
    const page = await mediaPage(t);
    page.click('#smg-thread-media');
    await page.settle(60);
    const cols = page.$('#smg-gallery .smg-gallery-cols');
    assert.ok(cols.classList.contains('smg-mason'));
    const sizes = { m1: [1080, 1350], m2: [1920, 1080], m3: [1080, 1350] };
    cols.querySelectorAll('.smg-gallery-tile--image img').forEach(im => {
        const k = (im.getAttribute('src') || '').match(/m\d/)[0];
        page.loadImage(im, sizes[k][0], sizes[k][1]);
    });
    await page.settle(20);
    page.resize(cols, 1192);
    const widths = Array.from(cols.children).map(c => parseInt(c.style.width, 10));
    assert.deepEqual(widths, [392, 792, 792, 392], 'portrait 1 col, landscape image 2, video of unknown ratio assumed 16:9 = 2');
});

scenario('closing tears the overlay down; Escape closes it too', async t => {
    const page = await mediaPage(t);
    page.click('#smg-thread-media');
    await page.settle(60);
    const root = page.$('#smg-media');
    assert.equal(root.querySelector('.smg-feed-close'), null, 'the feed has no close button of its own');
    page.click('#smg-media-close');
    await page.settle(30);
    assert.ok(!root.classList.contains('open'));
    assert.equal(root.querySelector('iframe, video, .smg-feed-slide, .smg-gallery-tile'), null, 'players, slides and tiles unmounted');
    assert.equal(page.document.documentElement.style.overflow, '', 'page scroll restored');
    assert.equal(page.view(), null, '?view= cleared');
    page.key('f');
    await page.settle(60);
    assert.equal(root.dataset.view, 'feed', 'f opens the overlay on the Feed');
    page.key('Escape');
    await page.settle(30);
    assert.ok(!root.classList.contains('open'), 'Escape closes');
});

scenario('a reload with ?view=feed or ?view=gallery reopens the overlay on that view', async t => {
    for (const view of ['feed', 'gallery']) {
        const page = await mediaPage(t, { url: URL + '?view=' + view });
        await page.settle(80);
        const root = page.$('#smg-media');
        assert.ok(root && root.classList.contains('open'), view + ': overlay reopened');
        assert.equal(root.dataset.view, view);
        const items = view === 'feed' ? '#smg-feed .smg-feed-slide' : '#smg-gallery .smg-gallery-tile';
        assert.equal(page.$$(items).length, 4, view + ': page 1 media loaded');
        page.close();
    }
});
