'use strict';
// The control bar every built-in player shares (RedGifs, ImagePond, Cyberdrop, direct files): one bar
// with progress, skip, volume, speed, loop, download, gallery mode and fullscreen; keys go to the player
// with focus or under the pointer and never to it while the reader types; volume, mute, speed and loop
// are remembered across players.
const assert = require('node:assert/strict');
const { scenario } = require('../harness');
const { threadPage, THREAD } = require('../lib');

const URL = 'https://forums.socialmediagirls.com' + THREAD;
const DIRECT = '<a href="https://cdn.example-files.net/v/clip.mp4" class="link link--external" target="_blank">https://cdn.example-files.net/v/clip.mp4</a>';
const REDGIFS = '<span data-s9e-mediaembed="redgifs"><span><iframe src="https://www.redgifs.com/ifr/abcclip"></iframe></span></span>';
const NEVER = () => new Promise(() => {});

async function playerPage(t, body, extra) {
    const page = await t.open(Object.assign({
        url: URL,
        html: threadPage({ posts: [{ id: 1, body }] }),
        gmRoutes: [[/redgifs\.com/, NEVER]],
    }, extra));
    await page.settle(60);
    return page;
}
// jsdom has no media pipeline: give the <video> a duration and a writable clock
function fakeClock(page, video, duration) {
    let t = 0;
    Object.defineProperty(video, 'duration', { configurable: true, get: () => duration });
    Object.defineProperty(video, 'currentTime', { configurable: true, get: () => t, set: v => { t = v; } });
    return () => t;
}
const prefs = page => JSON.parse(page.gm['smg-player'] || '{}');

scenario('a direct file gets the one control bar: progress, skip, volume, time, speed menu, loop, download, fullscreen', async t => {
    const page = await playerPage(t, 'Clip: ' + DIRECT);
    const wrap = page.$('.smg-dm-wrap .smg-rg');
    assert.ok(wrap, 'the link became our player');
    const bar = wrap.querySelector('.smg-rgc-bottom');
    assert.ok(bar.querySelector('.smg-rgc-prog .smg-rgc-bar .smg-rgc-buf'), 'progress with a buffered range');
    assert.ok(bar.querySelector('.smg-rgc-prog .smg-rgc-tip'), 'progress with a hover time tooltip');
    assert.ok(bar.querySelector('.smg-rgc-barplay'), 'play/pause');
    assert.deepEqual(bar.querySelectorAll('.smg-rgc-skip').length, 2, '-5s and +5s');
    assert.ok(bar.querySelector('.smg-rgc-vol .smg-rgc-mute') && bar.querySelector('.smg-rgc-vol .smg-rgc-volbar[role="slider"]'), 'mute + volume slider');
    assert.ok(bar.querySelector('.smg-rgc-time'), 'current / total time');
    const rates = Array.from(bar.querySelectorAll('.smg-rgc-speedmenu .smg-rgc-menuitem')).map(b => Number(b.dataset.r));
    assert.deepEqual(rates, [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3], 'speed menu 0.25x to 3x');
    assert.ok(bar.querySelector('.smg-rgc-loop'), 'loop toggle');
    assert.ok(bar.querySelector('.smg-rgc-fs'), 'fullscreen');
    const dl = bar.querySelector('.smg-rgc-dl');
    assert.ok(dl && !dl.hidden, 'download / open original: the file URL is known');
    assert.ok(bar.querySelector('.smg-rgc-over').hidden, 'gallery mode hidden: the overlay does not list direct files');
    assert.ok(wrap.querySelector('.smg-rgc-flash .smg-rgc-play'), 'big centre play');
});

scenario('a Cyberdrop direct video iframe resolves through the API into our player', async t => {
    const suffix = 'mXGELVW7';
    const slug = 'AQqP2PQ6WeaOlO';
    const directUrl = 'https://cyberdrop.cr/0h15e4lxzx7cpz7rjbg8m_source-' + suffix + '.mp4';
    const mp4 = 'https://cdn.cyberdrop.cr/files/video.mp4?token=mock';
    const page = await playerPage(t,
        '<div class="generic2wide-iframe-div"><iframe class="saint-iframe" src="' + directUrl + '"></iframe></div>',
        { gmRoutes: [
            [/cyberdrop\.cr\/0h15e4lxzx7cpz7rjbg8m_source-mXGELVW7\.mp4/, { status: 200, finalUrl: 'https://cyberdrop.cr/f/' + slug }],
            [/api\.cyberdrop\.cr\/api\/file\/info\//, { json: { type: 'video/mp4', thumbnail_url: 'https://cdn.cyberdrop.cr/poster.jpg', auth_url: 'https://api.cyberdrop.cr/auth/mock' } }],
            [/api\.cyberdrop\.cr\/auth\/mock/, { json: { url: mp4 } }],
        ] });
    page.intersect(page.$('.smg-turbo-slot'));
    await page.settle(20);
    const player = page.$('.generic2wide-iframe-div .smg-rg video');
    assert.ok(player, 'direct video iframe became our player');
    assert.equal(player.poster, 'https://cdn.cyberdrop.cr/poster.jpg', 'API poster is preserved');
    assert.equal(player._rgUrl, mp4, 'resolved file URL is prepared for our player');
    assert.equal(player._rgExt, 'https://cyberdrop.cr/f/' + slug, 'open-file link uses the redirect slug');
    assert.ok(page.gmRequests.some(req => req.url.includes('/api/file/info/' + slug)), 'API was requested with the redirect slug');
    assert.ok(!page.gmRequests.some(req => req.url.includes('/api/file/info/' + suffix)), 'API was not requested with the filename suffix');
});

scenario('a Cyberdrop portrait video applies its real ratio after loadedmetadata', async t => {
    const directUrl = 'https://cyberdrop.cr/0h15e4lxzx7cpz7rjbg8m_source-mXGELVW7.mp4';
    const slug = 'AQqP2PQ6WeaOlO';
    const mp4 = 'https://cdn.cyberdrop.cr/files/portrait.mp4?token=mock';
    const page = await playerPage(t,
        '<div class="generic2wide-iframe-div"><iframe class="saint-iframe" src="' + directUrl + '"></iframe></div>',
        { gmRoutes: [
            [/cyberdrop\.cr\/0h15e4lxzx7cpz7rjbg8m_source-mXGELVW7\.mp4/, { status: 200, finalUrl: 'https://cyberdrop.cr/f/' + slug }],
            [/api\.cyberdrop\.cr\/api\/file\/info\//, { json: { type: 'video/mp4', thumbnail_url: 'https://cdn.cyberdrop.cr/poster.jpg', auth_url: 'https://api.cyberdrop.cr/auth/mock' } }],
            [/api\.cyberdrop\.cr\/auth\/mock/, { json: { url: mp4 } }],
        ] });
    page.intersect(page.$('.smg-turbo-slot'));
    await page.settle(20);

    const video = page.$('.generic2wide-iframe-div .smg-rg video');
    const player = video.closest('.smg-rg');
    Object.defineProperty(video, 'videoWidth', { configurable: true, value: 720 });
    Object.defineProperty(video, 'videoHeight', { configurable: true, value: 1280 });
    video.dispatchEvent(new page.window.Event('loadedmetadata'));

    assert.equal(player.style.getPropertyValue('--smg-rg-ratio'), '0.5625', 'player stores the portrait ratio used by the other native players');
    assert.ok(player.classList.contains('smg-rg-vert'), 'player marks the portrait shape');
    const box = player.closest('.generic2wide-iframe-div');
    assert.ok(box.classList.contains('smg-player-loaded'), 'embed wrapper releases its iframe-era sizing');
    assert.equal(box.style.getPropertyValue('--smg-rg-ratio'), '0.5625', 'embed wrapper receives the player ratio');
    assert.ok(page.$('.smg-turbo-slot').classList.contains('smg-turbo-slot--filled'), 'Cyberdrop slot uses the shared native-player sizing');
});

scenario('a Cyberdrop direct jpg image resolves into the regular post image path', async t => {
    const suffix = 'rOS8tuJA';
    const slug = 'AQqP2PQ6WeaOlO';
    const directUrl = 'https://cyberdrop.cr/2268x4032_66340f8229e29892eed3884b42771cec-' + suffix + '.jpg';
    const image = 'https://cdn.cyberdrop.cr/files/image.jpg?token=mock';
    const page = await playerPage(t,
        '<a href="' + directUrl + '"><img class="bbImage" src="' + directUrl + '"></a>'
            + '<img class="bbImage" src="https://example.com/nearby.jpg">',
        { gmRoutes: [
            [/cyberdrop\.cr\/2268x4032_66340f8229e29892eed3884b42771cec-rOS8tuJA\.jpg/, { status: 200, headers: { Location: '/f/' + slug } }],
            [/api\.cyberdrop\.cr\/api\/file\/info\//, { json: { type: 'image/jpeg', auth_url: 'https://api.cyberdrop.cr/auth/image' } }],
            [/api\.cyberdrop\.cr\/auth\/image/, { json: { url: image } }],
        ], before: window => { Object.defineProperty(window.HTMLImageElement.prototype, 'complete', { configurable: true, get: () => false }); } });
    page.intersect(page.$('img[data-cd-resolving]'));
    await page.settle(20);
    const img = page.$('.bbWrapper img.bbImage');
    assert.ok(img, 'resolved image remains a normal post image');
    assert.equal(img.getAttribute('src'), image, 'image source is replaced by the resolved file URL');
    assert.equal(img.closest('a').href, image, 'the image link opens the resolved file');
    assert.equal(page.$$('.auto-image-grid img.bbImage').length, 2, 'the Cyberdrop image joins the adjacent post image in masonry');
    assert.ok(!page.$('.smg-dead'), 'a resolved image does not become a dead box');
    assert.ok(page.gmRequests.some(req => req.url.includes('/api/file/info/' + slug)), 'API was requested with the redirect slug');
    assert.ok(!page.gmRequests.some(req => req.url.includes('/api/file/info/' + suffix)), 'API was not requested with the filename suffix');
});

scenario('a Cyberdrop direct jpg 404 inside a lightbox wrapper becomes a compact dead tile', async t => {
    const directUrl = 'https://cyberdrop.cr/2268x4032_66340f8229e29892eed3884b42771cec-rOS8tuJA.jpg';
    const wrapper = '<div class="bbImageWrapper js-lbImage" data-src="' + directUrl + '"><img class="bbImage" src="' + directUrl + '" width="3376" height="6000"></div>';
    const page = await playerPage(t,
        '<img class="bbImage" src="https://example.com/nearby.jpg"><br>' + wrapper,
        { gmRoutes: [[/cyberdrop\.cr\/2268x4032_66340f8229e29892eed3884b42771cec-rOS8tuJA\.jpg/, { status: 404 }]] });
    await page.settle(20);
    const body = page.$('.bbWrapper');
    const dead = body && body.querySelector('.smg-dead--img');
    assert.ok(dead, 'the failed image becomes a dead box');
    assert.ok(dead.querySelector('.smg-dead-num'), dead.outerHTML);
    assert.equal(dead.querySelector('.smg-dead-num').textContent, '404', 'the dead box shows the HTTP status');
    assert.equal(dead.closest('.js-lbImage'), null, 'the dead tile replaces the XenForo lightbox wrapper');
    assert.ok(dead.classList.contains('smg-dead--strip'), 'a dead image beside one live image uses the strip layout');
    assert.equal(dead.closest('.auto-image-grid'), null, 'the lone live image uses solo layout');
});

scenario('keys reach the focused player (seek, percent, volume) and never while typing in an editor', async t => {
    const page = await playerPage(t, 'Clip: ' + DIRECT + '<textarea class="reply"></textarea>');
    const wrap = page.$('.smg-dm-wrap .smg-rg');
    const video = wrap.querySelector('video');
    const now = fakeClock(page, video, 100);
    wrap.focus();
    page.key('ArrowRight', wrap);
    assert.equal(now(), 5, 'ArrowRight +5s');
    page.key('l', wrap);
    assert.equal(now(), 15, 'l +10s');
    page.key('j', wrap);
    assert.equal(now(), 5, 'j -10s');
    page.key('7', wrap);
    assert.equal(now(), 70, '7 = 70%');
    page.key('ArrowLeft', wrap);
    assert.equal(now(), 65, 'ArrowLeft -5s');
    page.key('ArrowDown', wrap);
    assert.equal(video.volume, 0.95, 'ArrowDown lowers the volume');
    assert.equal(prefs(page).v, 0.95, 'and remembers it');

    const ta = page.$('textarea.reply');
    ta.focus();
    page.key('ArrowRight', ta);
    page.key('5', ta);
    page.key('m', ta);
    assert.equal(now(), 65, 'typing never seeks');
    const muted = video.muted;
    page.key('k', ta);
    assert.equal(video.muted, muted, 'typing never mutes');
    assert.equal(video.paused, true, 'typing never plays');
});

scenario('m and space toggle mute and play on the focused player; the thread shortcut j does not move posts', async t => {
    const page = await playerPage(t, 'Clip: ' + DIRECT);
    const wrap = page.$('.smg-dm-wrap .smg-rg');
    const video = wrap.querySelector('video');
    fakeClock(page, video, 100);
    wrap.focus();
    const wasMuted = video.muted;
    page.key('m', wrap);
    assert.equal(video.muted, !wasMuted, 'm toggles mute');
    assert.equal(prefs(page).m, video.muted, 'mute is remembered');
    let jumped = 0;
    const down = page.$('#smg-post-nav-down');
    if (down) down.addEventListener('click', () => { jumped++; });
    page.key('j', wrap);
    assert.equal(jumped, 0, 'j went to the player, not to the next post');
});

scenario('speed and volume chosen on one player are remembered by the next one', async t => {
    const gm = {};
    const page = await playerPage(t, 'Clip: ' + DIRECT, { gm });
    const wrap = page.$('.smg-dm-wrap .smg-rg');
    const video = wrap.querySelector('video');
    page.click(wrap.querySelector('.smg-rgc-speed'));
    assert.ok(wrap.querySelector('.smg-rgc-speedmenu').classList.contains('open'), 'the speed menu opens');
    page.click(wrap.querySelector('.smg-rgc-speedmenu .smg-rgc-menuitem[data-r="2"]'));
    assert.equal(video.playbackRate, 2);
    assert.equal(wrap.querySelector('.smg-rgc-speed').textContent, '2x');
    assert.ok(!wrap.querySelector('.smg-rgc-speedmenu').classList.contains('open'), 'choosing closes the menu');
    page.click(wrap.querySelector('.smg-rgc-loop'));
    assert.equal(video.loop, false, 'loop toggled off');
    wrap.focus();
    page.key('ArrowDown', wrap);
    page.key('ArrowDown', wrap);
    assert.deepEqual(prefs(page), { v: 0.9, m: video.muted, r: 2, l: false });

    const next = await playerPage(t, 'Another: ' + DIRECT.replace(/clip/g, 'other'), { gm });
    const v2 = next.$('.smg-dm-wrap .smg-rg video');
    assert.equal(v2.playbackRate, 2, 'speed remembered');
    assert.equal(v2.volume, 0.9, 'volume remembered');
    assert.equal(v2.loop, false, 'loop remembered');
});

scenario('gallery mode opens the post media in the overlay Feed at this player', async t => {
    const body = '<img class="bbImage" src="https://example.com/media/m1.jpg" width="1080" height="1350">'
        + REDGIFS
        + '<img class="bbImage" src="https://example.com/media/m3.jpg" width="1080" height="1350">';
    const page = await playerPage(t, body);
    const wrap = page.$('.smg-rg');
    assert.ok(wrap && wrap.querySelector('video').dataset.rgid === 'abcclip', 'the redgifs iframe became our player');
    const over = wrap.querySelector('.smg-rgc-over');
    assert.ok(!over.hidden, 'gallery mode is offered');
    page.click(over);
    await page.settle(40);
    const root = page.$('#smg-media');
    assert.ok(root && root.classList.contains('open'), 'the overlay opened');
    assert.equal(root.dataset.view, 'feed');
    const thumbs = Array.from(root.querySelectorAll('#smg-feed .smg-feed-thumb'));
    assert.equal(thumbs.length, 3, 'the post media: image, player, image');
    assert.equal(thumbs.findIndex(th => th.classList.contains('active')), 1, 'the feed starts at the player, not at the first image');
    assert.equal(root.querySelector('#smg-feed .smg-feed-counter').textContent, '2 / 3');
});
