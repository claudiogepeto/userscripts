'use strict';
// Masonry engine and the post block model. A post body is read as blocks: a run of 2+ media items
// (images and players) becomes one masonry group; text, quotes, spoilers and cards stay where the
// author put them. The engine places by shortest column, at most 3 columns (2 at <= 600px), and a
// landscape item spans 2 columns.
const assert = require('node:assert/strict');
const { scenario } = require('../harness');
const { threadPage, THREAD } = require('../lib');

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

// ---- post block model (DOM) ----

scenario('post: text stays where the author put it; a run of 3 images is one group; a single image stays loose', async t => {
    const page = await postsWith(t, ['Intro.<br>' + img(1) + '<br>' + img(2) + '<br>' + img(3) + '<br>Middle text.<br>' + img(4, 1080, 1350, 'w') + '<br>Final text.']);
    const bw = page.bodies[0];
    assert.equal(seq(bw), 'T G3 T I T');
    const g = bw.querySelector('.auto-image-grid');
    assert.ok(g.classList.contains('smg-mason'), 'the group is mounted on the masonry engine');
    assert.deepEqual(Array.from(g.querySelectorAll('img')).map(i => i.getAttribute('src').slice(-6)), ['m1.jpg', 'm2.jpg', 'm3.jpg'], 'document order');
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

scenario('post: a landscape image spans 2 columns; square and near-square (1080x1072) images take 1', async t => {
    const page = await postsWith(t, [img(20, 1080, 1350) + '<br>' + img(21, 1920, 1080) + '<br>' + img(22, 1000, 1000) + '<br>' + img(23, 1080, 1072) + '<br>' + img(24, 1080, 1920)]);
    const g = page.bodies[0].querySelector('.auto-image-grid');
    assert.deepEqual(layout(page, g, 1192), [392, 792, 392, 392, 392]);
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
