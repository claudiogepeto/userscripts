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
