'use strict';
// Masonry engine and the post block model. A post body is read as blocks: a run of 2+ media items
// (images and players) becomes one masonry group; text, quotes, spoilers and cards stay where the
// author put them. The engine places by shortest column, at most 3 columns (2 at <= 600px), and a
// landscape item spans 2 columns.
const assert = require('node:assert/strict');
const { scenario } = require('../harness');
const { threadPage, THREAD, attachmentList } = require('../lib');

const URL = 'https://forums.socialmediagirls.com' + THREAD;

// ---- markup the author writes (and players as the script leaves them mounted) ----
const img = (n, w = 1080, h = 1350, wrap = 'a') => {
    const tag = `<img class="bbImage" src="https://example.com/m${n}.jpg" width="${w}" height="${h}" alt="">`;
    if (wrap === 'a') return `<a href="https://example.com/m${n}.jpg" class="link link--external" rel="nofollow">${tag}</a>`;
    if (wrap === 'w') return `<div class="bbImageWrapper js-lbImage" data-src="https://example.com/m${n}.jpg">${tag}</div>`;
    return tag;
};
const direct = (w, h) => `<div class="smg-dm-wrap"><div class="smg-rg" style="aspect-ratio: ${w} / ${h};"><video class="smg-rg-v"></video></div></div>`;
const cyber = (w, h) => `<div class="generic2wide-iframe-div"><div class="smg-turbo-slot smg-turbo-slot--filled"><div class="smg-rg" style="aspect-ratio: ${w} / ${h};"><video class="smg-rg-v"></video></div></div></div>`;
const quote = inner => `<blockquote class="bbCodeBlock bbCodeBlock--expandable bbCodeBlock--quote"><div class="bbCodeBlock-content"><div class="bbCodeBlock-expandContent">${inner}</div></div></blockquote>`;

// one page with one post per body → the bbWrapper of each
async function postsWith(t, bodies, extra) {
    const page = await t.open(Object.assign({ url: URL, html: threadPage({ posts: bodies.map((body, i) => ({ id: 500 + i, body })) }) }, extra));
    await page.settle(80);
    page.bodies = bodies.map((_, i) => page.$(`#js-post-${500 + i} .bbWrapper`));
    return page;
}

// body as a sequence: T text, G<n> group of n, I loose image, V loose player, other tags by name
function seq(bw) {
    return Array.from(bw.childNodes).map(n => {
        if (n.nodeType === 3) return n.textContent.trim() ? 'T' : '';
        if (n.nodeType !== 1) return '';
        if (n.classList.contains('auto-image-grid')) return 'G' + n.children.length;
        if (n.matches('img.bbImage') || n.querySelector('img.bbImage')) return 'I';
        if (n.matches('.smg-dm-wrap, .generic2wide-iframe-div, .smg-rg')) return 'V';
        return n.tagName === 'BR' ? '' : n.tagName;
    }).filter(Boolean).join(' ');
}

// widths the engine wrote on the items of a group, once the group measures `width`
function layout(page, group, width) {
    page.resize(group, width);
    return Array.from(group.children).map(c => parseInt(c.style.width, 10));
}

// ---- engine (placement math, reached through window.__smgTest) ----

scenario('engine: 2 columns up to 600px, 3 above, never more', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }] }), units: true });
    const { masonryPlace } = page.window.__smgTest;
    const cols = w => masonryPlace([1, 1, 1, 1, 1, 1], w).cols;
    assert.deepEqual([402, 600, 601, 1100, 1500, 2560].map(cols), [2, 2, 3, 3, 3, 3]);
    const wide = masonryPlace([1, 1, 1, 1], 1192, { gap: 8 });
    assert.equal(Math.round(wide.colW), 392, '3 columns of 392px at 1192px');
    assert.equal(masonryPlace([1.3, 1.3], 1192).cols, 2, 'a group smaller than the column count uses only the columns it fills');
});

scenario('engine: each item goes to the shortest column, ties to the left, at column width x ratio', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }] }), units: true });
    const { masonryPlace } = page.window.__smgTest;
    const r = masonryPlace([1, 1, 1, 1, 0.5, 2], 1192, { gap: 8, cols: 4 });
    assert.equal(Math.round(r.colW), 292);
    assert.deepEqual(r.boxes.slice(0, 4).map(b => b.col), [0, 1, 2, 3], 'the first row fills left to right');
    assert.deepEqual([r.boxes[4].col, r.boxes[4].y], [0, 300], 'tie goes left, right under the item above plus the gap');
    assert.equal(r.boxes[5].col, 1, 'next item goes to the SHORTEST column, not the next one');
    assert.deepEqual([r.boxes[4].h, r.boxes[5].h], [146, 584], 'height = column width x ratio (no letterbox)');
    assert.equal(r.height, Math.max(...r.boxes.map(b => b.y + b.h)), 'container height = bottom of the tallest column');
});

scenario('engine: portrait videos cap at the media height while same-ratio images keep their full height', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }] }), units: true });
    const { masonryPlace } = page.window.__smgTest;
    const cap = 687;
    const r = masonryPlace([1280 / 720, 1280 / 720], 1192, {
        gap: 8,
        videoItems: [true, false],
        maxVideoHeight: cap,
    });
    assert.equal(r.cols, 2);
    assert.equal(r.boxes[0].h, cap, 'video height is capped at --smg-media-h');
    assert.equal(r.boxes[1].h, Math.round(r.boxes[1].w * (1280 / 720)), 'image keeps its uncapped ratio height');
    assert.equal(r.height, r.boxes[1].h, 'the group height follows the tallest placed item');
});

scenario('engine: a 2-column item takes the lowest adjacent pair and sits under the taller of the two', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }] }), units: true });
    const { masonryPlace } = page.window.__smgTest;
    const sp = masonryPlace([1, 0.2, 0.3, 0.5, 9 / 16], 1192, { gap: 8, cols: 4, spans: [1, 1, 1, 1, 2] });
    const v = sp.boxes[4];
    assert.deepEqual([v.col, v.span, v.y, v.x, v.w, v.h], [1, 2, 96, 300, 592, 333]);
    const tie = masonryPlace([0.5, 0.5, 0.5, 0.5, 9 / 16], 1192, { gap: 8, cols: 4, spans: [1, 1, 1, 1, 2] });
    assert.equal(tie.boxes[4].col, 0, 'tie between pairs goes left');
    const after = masonryPlace([9 / 16, 1, 1], 1192, { gap: 8, cols: 4, spans: [2, 1, 1] });
    assert.deepEqual(after.boxes.map(b => b.col), [0, 2, 3], 'following items take the free columns beside the span');
    const pair = masonryPlace([1.25, 9 / 16], 1192, { gap: 8, spans: [1, 2] });
    assert.equal(pair.cols, 3, 'column count sums the spans (1 + 2)');
    const mob = masonryPlace([1.25, 9 / 16, 1.25], 402, { gap: 8, spans: [1, 2, 1] });
    assert.deepEqual([mob.cols, mob.boxes[1].x, mob.boxes[1].w], [2, 0, 402], 'with 2 columns the wide item takes the whole row');
    const one = masonryPlace([9 / 16, 1], 300, { gap: 8, cols: 1, spans: [2, 1] });
    assert.deepEqual([one.boxes[0].w, one.boxes[0].h], [300, 169], 'a span is clamped to a single column');
});

scenario('engine: an all-landscape group lays out in 2 columns of pairs; a mixed group and 2 columns do not change', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }] }), units: true });
    const { masonryPlace } = page.window.__smgTest;
    const two = masonryPlace([9 / 16, 9 / 16], 1192, { gap: 8, spans: [2, 2] });
    assert.deepEqual([two.cols, ...two.boxes.map(b => [b.col, b.span, b.x, b.y, b.w])], [2, [0, 1, 0, 0, 592], [1, 1, 600, 0, 592]], 'two landscape items sit side by side');
    const three = masonryPlace([9 / 16, 0.5, 9 / 16], 1192, { gap: 8, spans: [2, 2, 2] });
    assert.equal(three.cols, 2);
    assert.deepEqual(three.boxes.map(b => [b.col, b.span, b.w]), [[0, 1, 592], [1, 1, 592], [0, 1, 592]], 'every item spans 1 of 2 columns');
    assert.deepEqual([three.boxes[2].x, three.boxes[2].y], [0, 341], 'odd count: the last item sits alone at the left of the next row, under the taller of the pair');
    assert.equal(three.height, 341 + 333);
    const mixed = masonryPlace([9 / 16, 1.25, 9 / 16], 1192, { gap: 8, spans: [2, 1, 2] });
    assert.deepEqual([mixed.cols, ...mixed.boxes.map(b => b.span)], [3, 2, 1, 2], 'a mixed group keeps 3 columns and wide landscape items');
    const mob = masonryPlace([9 / 16, 9 / 16, 9 / 16], 402, { gap: 8, spans: [2, 2, 2] });
    assert.deepEqual([mob.cols, ...mob.boxes.map(b => b.w)], [2, 402, 402, 402], 'with 2 columns each landscape item still takes the whole row');
    const single = masonryPlace([9 / 16], 1192, { gap: 8, spans: [2] });
    assert.deepEqual([single.cols, single.boxes[0].w], [2, 1192], 'a single landscape item keeps the full width');
});

scenario('engine: a group that would leave a column empty uses one column fewer and the full width', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 1 }] }), units: true });
    const { masonryPlace } = page.window.__smgTest;
    const r = masonryPlace([1.25, 1.25, 9 / 16], 1530, { gap: 8, spans: [1, 1, 2] });
    assert.equal(r.cols, 2, 'two portraits and one landscape: 2 columns, not 3 with the third empty');
    assert.deepEqual(r.boxes.map(b => [b.col, b.span, b.x, b.w]), [[0, 1, 0, 761], [1, 1, 769, 761], [0, 2, 0, 1530]], 'portraits side by side, the landscape under them across the full width');
    const full = masonryPlace([1.25, 1.25, 1.25], 1530, { gap: 8, spans: [1, 1, 1] });
    assert.equal(full.cols, 3, 'three portraits still fill 3 columns');
    const right = Math.max(...r.boxes.map(b => b.x + b.w));
    assert.equal(right, 1530, 'the group reaches the right edge of the post');
});

// ---- post block model (DOM) ----

scenario('post: text stays where the author put it; a run of 3 images is one group; a single image stays loose', async t => {
    const page = await postsWith(t, ['Intro.<br>' + img(1) + '<br>' + img(2) + '<br>' + img(3) + '<br>Middle text.<br>' + img(4, 1080, 1350, 'w') + '<br>Final text.']);
    const bw = page.bodies[0];
    assert.equal(seq(bw), 'T G3 T I T');
    const g = bw.querySelector('.auto-image-grid');
    assert.ok(g.classList.contains('smg-mason'), 'the group is mounted on the masonry engine');
    assert.deepEqual(Array.from(g.querySelectorAll('img')).map(i => i.getAttribute('src').slice(-6)), ['m1.jpg', 'm2.jpg', 'm3.jpg'], 'document order');
});

scenario('post: solo image scales to the height cap with a 2x natural-width bound; two images form a group', async t => {
    const page = await postsWith(t, [img(90, 250, 545), img(91, 250, 545) + '<br>' + img(92, 250, 545)]);
    const solo = page.bodies[0].querySelector('img.bbImage');
    page.loadImage(solo, 250, 545);
    assert.match(solo.style.width, /min\(100%,\s*calc\(var\(--smg-solo-h,\s*80vh\)\s*\*\s*0\.4587\),\s*500px\)/, 'solo width keeps the height cap and twice the known natural width');
    assert.equal(page.bodies[1].querySelector('.auto-image-grid')?.children.length, 2, 'a run of 2 images uses the masonry group treatment');
});

scenario('post: line breaks, whitespace, comments and scripts between images do not break a run', async t => {
    const page = await postsWith(t, [img(5, 1080, 1350, '') + '\n  <br>\n<br> ' + img(6) + '<!-- c --><script type="application/json">{}</script>' + img(7, 1080, 1350, 'w')]);
    assert.equal(seq(page.bodies[0]), 'G3');
});

scenario('post: quotes, spoilers and link unfurls split runs and never enter a group', async t => {
    const blocks = [
        quote('quoted text'),
        '<div class="bbCodeSpoiler"><button class="bbCodeSpoiler-button button--longText button">Spoiler</button><div class="bbCodeSpoiler-content"><div class="bbCodeBlock bbCodeBlock--spoiler"><div class="bbCodeBlock-content">x</div></div></div></div>',
        '<div class="bbCodeBlock bbCodeBlock--unfurl" data-url="https://example.org/">link</div>',
    ];
    const page = await postsWith(t, blocks.map((b, i) => img(10 + i) + '<br>' + img(20 + i) + '<br>' + b + '<br>' + img(30 + i) + '<br>' + img(40 + i)));
    page.bodies.forEach((bw, i) => {
        assert.match(seq(bw), /^G2 (BLOCKQUOTE|DIV) G2$/, 'block ' + i + ' sits between two groups: ' + seq(bw));
        assert.ok(Array.from(bw.querySelectorAll('.auto-image-grid')).every(g => !g.querySelector('blockquote, .bbCodeSpoiler, .bbCodeBlock--unfurl')));
    });
});

scenario('post: images inside a quote never join the post mosaic', async t => {
    const page = await postsWith(t, [img(50) + quote(img(51) + img(52)) + img(53)]);
    assert.equal(page.bodies[0].querySelector('.auto-image-grid'), null);
});

scenario('post: players join image runs; a landscape player spans 2 of 3 columns, a portrait one 1', async t => {
    const page = await postsWith(t, [img(3) + '<br>' + direct(1920, 1080) + '<br>' + cyber(1080, 1920) + '<br>' + img(4) + '<br>' + img(5)]);
    const g = page.bodies[0].querySelector('.auto-image-grid');
    assert.equal(g.children.length, 5, 'images and players of different hosts form one group');
    assert.deepEqual(layout(page, g, 1192), [392, 792, 392, 392, 392]);
    assert.equal(g.dataset.smgCols, '3');
    const vid = g.children[1];
    assert.ok(Math.abs(parseInt(vid.style.height, 10) / 792 - 1080 / 1920) < 0.01, 'the player box keeps the video ratio');
    assert.ok(parseInt(g.style.height, 10) > 0, 'the engine writes the group height');
    assert.deepEqual(layout(page, g, 402).slice(0, 3), [197, 402, 197], 'at 2 columns the landscape player takes the whole row');
});

scenario('post: solo video gets the solo height cap; grouped video keeps the media cap', async t => {
    const page = await postsWith(t, [direct(720, 1280), direct(1920, 1080) + '<br>' + img(8)]);
    const solo = page.bodies[0].querySelector('.smg-dm-wrap');
    const grouped = page.bodies[1].querySelector('.auto-image-grid .smg-dm-wrap');
    assert.ok(solo.classList.contains('smg-solo-video'), 'solo video carries the solo cap state');
    assert.ok(!grouped.classList.contains('smg-solo-video'), 'video inside a group does not carry the solo cap state');
});

scenario('post: Twitch and TikTok s9e embeds join YouTube as video items in the post block model', async t => {
    const s9e = provider => `<span data-s9e-mediaembed="${provider}"><span><iframe src="https://www.${provider}.com/embed/test" width="800" height="450"></iframe></span></span>`;
    const page = await postsWith(t, [s9e('youtube') + '<br>' + s9e('twitch') + '<br>' + s9e('tiktok')]);
    const body = page.bodies[0];
    const group = body.querySelector('.auto-image-grid');
    assert.ok(group, 'the consecutive embeds form a post media group');
    assert.deepEqual(Array.from(group.children).map(item => item.getAttribute('data-s9e-mediaembed')), ['youtube', 'twitch', 'tiktok']);
    assert.ok(Array.from(group.children).every(item => item.classList.contains('smg-mvid')), 'each provider is marked as a video item');
});

scenario('post: a landscape image spans 2 columns; square and near-square (1080x1072) images take 1', async t => {
    const page = await postsWith(t, [img(20, 1080, 1350) + '<br>' + img(21, 1920, 1080) + '<br>' + img(22, 1000, 1000) + '<br>' + img(23, 1080, 1072) + '<br>' + img(24, 1080, 1920)]);
    const g = page.bodies[0].querySelector('.auto-image-grid');
    assert.deepEqual(layout(page, g, 1192), [392, 792, 392, 392, 392]);
});

scenario('post: paint-gate image placeholder ratio is replaced with natural dimensions after load', async t => {
    const page = await postsWith(t, ['<img class="bbImage" src="https://example.com/portrait.jpg" data-smg-ph-ratio="1" style="aspect-ratio: 4 / 3">']);
    const image = page.bodies[0].querySelector('img.bbImage');
    page.loadImage(image, 612, 1331);
    assert.equal(image.style.aspectRatio, '612 / 1331', 'the loaded portrait replaces the 4:3 paint placeholder');
});

scenario('post: XenForo YouTube and Twitch wrappers form one video group', async t => {
    const youtube = '<div class="bbMediaWrapper" data-media-site-id="youtube" data-media-key="abc"><div class="bbMediaWrapper-inner"><iframe src="https://www.youtube.com/embed/abc" width="560" height="315"></iframe></div></div>';
    const twitch = '<div class="bbMediaWrapper" data-media-site-id="twitch" data-media-key="channel=foo"><div class="bbMediaWrapper-inner"><iframe src="https://player.twitch.tv/?channel=foo" width="560" height="315"></iframe></div></div>';
    const page = await postsWith(t, ['A post ' + youtube + twitch]);
    const group = page.bodies[0].querySelector('.auto-image-grid');
    assert.ok(group, 'consecutive XenForo video wrappers form a group');
    assert.equal(group.children.length, 2, 'both wrappers remain separate media items');
    assert.ok(Array.from(group.children).every(item => item.classList.contains('smg-mvid')), 'both wrappers are video items');
    assert.ok(Array.from(group.children).every(item => !item.classList.contains('smg-solo-video')), 'neither grouped video receives solo treatment');
});

scenario('post: a Twitch-only XenForo wrapper is a solo video item', async t => {
    const twitch = '<div class="bbMediaWrapper" data-media-site-id="twitch" data-media-key="channel=foo;clip_id=bar"><div class="bbMediaWrapper-inner"><iframe src="https://player.twitch.tv/?channel=foo" width="560" height="315"></iframe></div></div>';
    const page = await postsWith(t, [twitch]);
    const item = page.bodies[0].querySelector('.bbMediaWrapper');
    assert.ok(item.classList.contains('smg-mvid'), 'Twitch wrapper is recognized as a video item');
    assert.ok(item.classList.contains('smg-solo-video'), 'standalone Twitch wrapper gets solo treatment');
});

scenario('post: failed lightbox image replaces its wrapper with a compact grouped dead tile and retry restores it', async t => {
    const wrapper = '<div class="bbImageWrapper js-lbImage" data-src="https://example.com/3376x6000_dead.jpg"><img class="bbImage" src="https://example.com/3376x6000_dead.jpg" width="3376" height="6000"></div>';
    const page = await postsWith(t, [img(97, 1080, 1350) + '<br>' + wrapper]);
    const group = page.bodies[0].querySelector('.auto-image-grid');
    const image = group.querySelector('.bbImageWrapper img.bbImage');
    Object.defineProperty(image, 'complete', { configurable: true, value: true });
    image.dispatchEvent(new page.window.Event('error'));
    const dead = await page.waitFor(() => page.bodies[0].querySelector('.smg-dead--img'));
    assert.ok(dead, 'failed image becomes a dead tile');
    assert.ok(dead.classList.contains('smg-dead--strip'), 'one live image and one dead image use the strip layout');
    assert.equal(dead.closest('.js-lbImage'), null, 'the dead tile is outside the XenForo lightbox wrapper');
    page.click(dead.querySelector('.smg-dead-retry'));
    assert.ok(page.bodies[0].querySelector('.bbImageWrapper.js-lbImage img.bbImage') === image, 'retry restores the original wrapper and image');
});

scenario('post: a dead image stays the same node across later processing and masonry passes', async t => {
    const url = 'https://example.com/dead-loop.jpg';
    const wrapper = `<a href="${url}"><div class="bbImageWrapper js-lbImage" data-src="${url}"><img class="bbImage" src="${url}" width="1080" height="1350"></div></a>`;
    const page = await postsWith(t, [img(96) + '<br>' + wrapper]);
    const bw = page.bodies[0];
    const group = page.bodies[0].querySelector('.auto-image-grid');
    const image = group.querySelector('.bbImageWrapper img.bbImage');
    Object.defineProperty(image, 'complete', { configurable: true, value: true });
    image.dispatchEvent(new page.window.Event('error'));
    const dead = await page.waitFor(() => bw.querySelector('.smg-dead--img'));
    assert.ok(dead, 'failed image becomes a dead tile');
    await page.settle(80);
    const mutations = [];
    new page.window.MutationObserver(records => mutations.push(...records)).observe(group, { childList: true, subtree: true });
    dead.href = 'https://cyberdrop.cr/3376x6000_dead-loop.jpg';
    const marker = page.document.createElement('i');
    page.bodies[0].appendChild(marker);
    await page.settle(80);
    assert.equal(group.querySelector('.smg-dead--img'), dead, 'later processing preserves the dead tile node');
    assert.equal(mutations.filter(record => [...record.removedNodes].includes(dead)).length, 0, 'later passes never detach the dead tile');
});

scenario('post: a single player or text between a player and an image keeps them apart', async t => {
    const page = await postsWith(t, [
        'Text.<br>' + direct(1920, 1080) + '<br>More text.',
        direct(1920, 1080) + '<br>Author text.<br>' + img(9),
        direct(1920, 1080) + '<br>' + cyber(1080, 1920) + '<br>Text.<br>' + img(10) + '<br>' + img(11),
    ]);
    assert.equal(seq(page.bodies[0]), 'T V T');
    assert.equal(seq(page.bodies[1]), 'V T I');
    assert.equal(seq(page.bodies[2]), 'G2 T G2');
});

scenario('post: an image that arrives later next to a group joins it without moving the player', async t => {
    const page = await postsWith(t, ['Before.<br>' + img(1) + '<br>' + direct(1920, 1080) + '<br>' + img(2) + '<br>After.']);
    const bw = page.bodies[0];
    const g = bw.querySelector('.auto-image-grid');
    const player = g.children[1];
    const moves = [];
    new page.window.MutationObserver(recs => recs.forEach(r => r.removedNodes.forEach(n => moves.push(n)))).observe(g, { childList: true });
    g.insertAdjacentHTML('afterend', '<br>' + img(8));
    await page.settle(60);
    assert.equal(seq(bw), 'T G4 T');
    assert.equal(g.children[1], player, 'the player stays the same node in the same slot');
    assert.ok(!moves.includes(player), 'the player was never detached (an iframe would reload)');
});

scenario('post: a group of only landscape images lays out in pairs on desktop and one per row on mobile', async t => {
    const page = await postsWith(t, [
        img(60, 1920, 1080) + '<br>' + img(61, 1920, 1080),
        img(62, 1920, 1080) + '<br>' + direct(1920, 1080) + '<br>' + img(63, 1600, 900),
    ]);
    const [g2, g3] = page.bodies.map(bw => bw.querySelector('.auto-image-grid'));
    assert.deepEqual(layout(page, g2, 1192), [592, 592]);
    assert.equal(g2.dataset.smgCols, '2');
    assert.deepEqual(layout(page, g3, 1192), [592, 592, 592]);
    assert.equal(g3.dataset.smgCols, '2');
    const x = el => el.style.transform.match(/translate\((\d+)px/)[1];
    assert.deepEqual(Array.from(g3.children).map(x), ['0', '600', '0'], 'the third item starts a new row at the left');
    assert.deepEqual(layout(page, g3, 402), [402, 402, 402], 'mobile: each landscape item takes the whole row');
});

scenario('post: dead image beside one live video is a strip and video is solo', async t => {
    const page = await postsWith(t, [img(130) + '<br>' + direct(720, 1280)]);
    const bw = page.bodies[0];
    const image = bw.querySelector('img.bbImage');
    Object.defineProperty(image, 'complete', { configurable: true, value: true });
    image.dispatchEvent(new page.window.Event('error'));
    const dead = await page.waitFor(() => bw.querySelector('.smg-dead--img'));
    assert.ok(dead.classList.contains('smg-dead--strip'));
    assert.ok(bw.querySelector('.smg-dm-wrap.smg-solo-video'));
    assert.ok(!bw.querySelector('.auto-image-grid'));
});

scenario('post: dead image dissolves the group before video readiness and later relayout stays solo', async t => {
    const page = await postsWith(t, [img(129) + '<br>' + direct(720, 1280)]);
    const bw = page.bodies[0];
    const image = bw.querySelector('img.bbImage');
    const group = bw.querySelector('.auto-image-grid');
    const live = group.querySelector('.smg-dm-wrap');
    const readyVideo = live.querySelector('video');
    Object.defineProperty(image, 'complete', { configurable: true, value: true });
    image.dispatchEvent(new page.window.Event('error'));
    await page.waitFor(() => bw.querySelector('.smg-dead--img'));
    assert.equal(live.parentElement, bw, 'the remaining video is back in the post body flow');
    assert.equal(live.closest('article.message'), bw.closest('article.message'));
    assert.equal(live.style.position, '');
    assert.equal(live.style.transform, '');
    assert.equal(live.style.width, '');
    assert.equal(live.style.height, '');
    assert.equal(live.dataset.smgGridded, undefined);
    assert.equal(group.style.height, '', 'the dissolved group has no retained masonry height');

    Object.defineProperty(readyVideo, 'videoWidth', { configurable: true, value: 720 });
    Object.defineProperty(readyVideo, 'videoHeight', { configurable: true, value: 1280 });
    readyVideo.dispatchEvent(new page.window.Event('loadedmetadata'));
    page.resize(group, 1192);
    await page.settle(40);
    assert.equal(live.parentElement, bw, 'later video readiness and resize leave it in normal flow');
    assert.equal(live.style.transform, '');
    assert.equal(live.style.width, '');
    assert.equal(live.style.height, '');
    assert.equal(live.dataset.smgGridded, undefined);
});

scenario('post: video readiness before dead-image resolution is also cleared when the group dissolves', async t => {
    const page = await postsWith(t, [img(128) + '<br>' + direct(720, 1280)]);
    const bw = page.bodies[0];
    const group = bw.querySelector('.auto-image-grid');
    const live = group.querySelector('.smg-dm-wrap');
    const readyVideo = live.querySelector('video');
    Object.defineProperty(readyVideo, 'videoWidth', { configurable: true, value: 720 });
    Object.defineProperty(readyVideo, 'videoHeight', { configurable: true, value: 1280 });
    readyVideo.dispatchEvent(new page.window.Event('loadedmetadata'));
    page.resize(group, 1192);
    const image = bw.querySelector('img.bbImage');
    Object.defineProperty(image, 'complete', { configurable: true, value: true });
    image.dispatchEvent(new page.window.Event('error'));
    await page.waitFor(() => bw.querySelector('.smg-dead--img'));
    assert.equal(live.parentElement, bw);
    assert.equal(live.style.position, '');
    assert.equal(live.style.transform, '');
    assert.equal(live.style.width, '');
    assert.equal(live.style.height, '');
    assert.equal(live.dataset.smgGridded, undefined);
    assert.equal(group.style.height, '');
    page.resize(group, 800);
    await page.settle(40);
    assert.equal(live.parentElement, bw, 'a later resize cannot remount the dissolved group');
    assert.equal(live.style.transform, '');
    assert.equal(live.style.width, '');
    assert.equal(live.style.height, '');
});

scenario('post: two live images with one dead image keep a compact 2:1 tile', async t => {
    const page = await postsWith(t, [img(131) + '<br>' + img(132) + '<br>' + img(133)]);
    const bw = page.bodies[0]; const images = bw.querySelectorAll('img.bbImage');
    Object.defineProperty(images[1], 'complete', { configurable: true, value: true });
    images[1].dispatchEvent(new page.window.Event('error'));
    const dead = await page.waitFor(() => bw.querySelector('.smg-dead--img'));
    assert.equal(dead.closest('.auto-image-grid').children.length, 3);
    assert.equal(dead.dataset.smgRatio, '0.5');
});

scenario('post: all dead images are strips in original order', async t => {
    const page = await postsWith(t, [img(134) + '<br>' + img(135)]);
    const bw = page.bodies[0];
    for (const image of Array.from(bw.querySelectorAll('img.bbImage'))) {
        Object.defineProperty(image, 'complete', { configurable: true, value: true }); image.dispatchEvent(new page.window.Event('error'));
    }
    const dead = await page.waitFor(() => bw.querySelectorAll('.smg-dead--img').length === 2 && bw.querySelectorAll('.smg-dead--img'));
    assert.equal(dead.length, 2); assert.ok(Array.from(dead).every(n => n.classList.contains('smg-dead--strip')));
    assert.ok(!bw.querySelector('.auto-image-grid'));
});

scenario('post: one image attachment becomes a solo full image and hides the legacy list', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 701, body: 'Caption', attachments: attachmentList([{ href: '/attachments/pic.jpg.12/', type: 'image' }]) }] }) });
    await page.settle(60);
    const body = page.$('#js-post-701 .message-body'); const image = body.querySelector('img.bbImage');
    assert.equal(body.querySelector('div[itemprop="text"] > .bbWrapper'), body.querySelector('.bbWrapper'), 'the fixture matches XenForo’s itemprop wrapper');
    assert.ok(body.querySelector('.js-selectToQuoteEnd'), 'the fixture includes the quote-selection end marker');
    assert.equal(image.dataset.smgFull, 'https://forums.socialmediagirls.com/attachments/pic.jpg.12/');
    assert.equal(image.getAttribute('width'), null, 'thumbnail dimensions are not copied as real image dimensions');
    assert.equal(image.getAttribute('height'), null, 'thumbnail dimensions are not copied as real image dimensions');
    assert.equal(image.style.aspectRatio, '150 / 265', 'thumbnail ratio is kept as a placeholder while the full image loads');
    const section = page.$('#js-post-701 .message-attachments');
    assert.ok(section.hidden);
    assert.equal(section.parentElement, body.parentElement);
    assert.equal(body.querySelector('.message-attachments'), null);
    assert.equal(body.querySelectorAll('.auto-image-grid').length, 0);
    page.loadImage(image, 612, 1331);
    assert.equal(image.style.aspectRatio, '612 / 1331', 'the full image natural ratio replaces the thumbnail placeholder');
});

scenario('post: three image attachments form one masonry group', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 702, body: 'Caption', attachments: attachmentList([1, 2, 3].map(i => ({ href: `/attachments/pic-${i}.jpg.${i}/`, type: 'image' }))) }] }) });
    await page.settle(60);
    assert.equal(page.$('#js-post-702 .message-body .auto-image-grid')?.children.length, 3);
});

scenario('post: attachment full image failure returns to its thumbnail', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 703, body: '', attachments: attachmentList([{ href: '/attachments/fail.jpg.13/', type: 'image', thumb: 'https://simp6.example.su/thumb.jpg' }]) }] }) });
    await page.settle(60);
    const image = page.$('#js-post-703 .message-body img.bbImage');
    page.loadImage(image, 150, 265);
    image.dataset.smgFull = 'https://forums.socialmediagirls.com/attachments/fail.jpg.13/';
    image.dataset.smgGoodSrc = 'https://simp6.example.su/thumb.jpg';
    image.src = image.dataset.smgFull;
    image.dispatchEvent(new page.window.Event('error'));
    await page.settle(30);
    assert.equal(image.src, 'https://simp6.example.su/thumb.jpg');
    assert.ok(!page.$('#js-post-703 .message-body .smg-dead'));
});

scenario('post: failed attachment full source is replaced in viewer attributes', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 706, body: '', attachments: attachmentList([{ href: '/attachments/fail.jpg.16/', type: 'image', thumb: 'https://simp6.example.su/thumb.jpg' }]) }] }) });
    await page.settle(60);
    const image = page.$('#js-post-706 .message-body img.bbImage');
    const viewer = image.closest('.bbImageWrapper.js-lbImage');
    const fallback = 'https://simp6.example.su/thumb.jpg';
    page.loadImage(image, 150, 265);
    image.src = image.dataset.smgFull;
    image.dispatchEvent(new page.window.Event('error'));
    assert.equal(image.src, fallback);
    assert.equal(image.dataset.smgFull, fallback);
    assert.equal(image.dataset.smgLink, fallback);
    assert.equal(image.getAttribute('data-src'), fallback);
    assert.equal(viewer.href, fallback);
    assert.equal(viewer.dataset.src, fallback);
});

scenario('post: solo fallback image width is capped at twice thumbnail natural width', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 707, body: '', attachments: attachmentList([{ href: '/attachments/fail.jpg.17/', type: 'image', thumb: 'https://simp6.example.su/thumb.jpg' }]) }] }) });
    await page.settle(60);
    const image = page.$('#js-post-707 .message-body img.bbImage');
    page.loadImage(image, 150, 265);
    image.src = image.dataset.smgFull;
    image.dispatchEvent(new page.window.Event('error'));
    page.loadImage(image, 150, 265);
    assert.match(image.style.maxWidth, /300px/);
    assert.match(image.style.width, /300px/);
});

scenario('post: non-image attachment stays in the compact legacy list', async t => {
    const page = await t.open({ url: URL, html: threadPage({ posts: [{ id: 704, body: '', attachments: attachmentList([{ href: '/attachments/archive.zip.14/', type: 'file', name: 'archive.zip' }]) }] }) });
    await page.settle(60);
    const section = page.$('#js-post-704 .message-attachments');
    assert.ok(section && !section.hidden);
    assert.ok(section.querySelector('.file-name').textContent.includes('archive.zip'));
    assert.equal(page.$('#js-post-704 .message-body .auto-image-grid'), null);
});

scenario('post: an unconverted image attachment keeps its thumbnail visible', async t => {
    const html = threadPage({ posts: [{ id: 705, body: '', attachments: attachmentList([{ type: 'image' }]) }] })
        .replace(/<article class="message-body js-selectToQuote">[\s\S]*?<\/article>/, '');
    const page = await t.open({ url: URL, html });
    await page.settle(60);
    const row = page.$('#js-post-705 .message-attachments li');
    const preview = row.querySelector('.file-preview');
    assert.ok(row && !row.hidden, 'the legacy attachment row stays available');
    assert.equal(preview.querySelector('img').getAttribute('src'), 'https://simp6.example.su/simpo/data/attachments/45/45820-1.jpg?hash=thumb');
    assert.equal(page.window.getComputedStyle(preview).display, 'block', 'the fallback thumbnail is not hidden by compact-list styling');
});

scenario('gallery: a section of only landscape media lays out in pairs', async t => {
    const body = '<img class="bbImage" src="https://example.com/media/l1.jpg" width="1920" height="1080">'
        + '<img class="bbImage" src="https://example.com/media/l2.jpg" width="1920" height="1080">'
        + '<img class="bbImage" src="https://example.com/media/l3.jpg" width="1920" height="1080">';
    const page = await t.open({
        url: URL,
        html: threadPage({ posts: [{ id: 1, body: 'Hello' }] }),
        routes: [[/\/threads\/sample-thread\.100\/(\?|$)/, () => threadPage({ posts: [{ id: 1, body }] })]],
    });
    await page.settle(50);
    page.click('#smg-thread-media');
    await page.settle(60);
    const sec = page.$('#smg-gallery .smg-gallery-cols');
    assert.equal(sec.querySelectorAll('.smg-gallery-tile').length, 3);
    sec.querySelectorAll('.smg-gallery-tile--image img').forEach(im => page.loadImage(im, 1920, 1080));
    await page.settle(20);
    assert.deepEqual(layout(page, sec, 1192), [592, 592, 592]);
    assert.equal(sec.dataset.smgCols, '2');
});
