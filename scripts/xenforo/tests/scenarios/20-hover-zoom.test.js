'use strict';
// Hover zoom: resting the mouse on the thread header picture, or on a thread picture in the alerts
// rail, shows that picture enlarged in a floating preview. It is on by default, has its own switch in
// the settings panel, never takes clicks away from the row under it, and stays off on touch screens.
const assert = require('node:assert/strict');
const { scenario } = require('../harness');
const { threadPage, THREAD } = require('../lib');

const SMG = 'https://forums.socialmediagirls.com';
const IMG = 'https://img.example/zoom.jpg';

function page1() {
    return threadPage({ posts: [{ id: 1, body: `<img src="${IMG}" class="bbImage" alt="">` }] })
        .replace('</head>', '<meta property="og:site_name" content="Social Media Girls">\n</head>');
}
function hover(page, target, type) {
    target.dispatchEvent(new page.window.MouseEvent(type || 'mouseover', { bubbles: true, clientX: 100, clientY: 100 }));
}
const preview = page => page.$('#smg-hoverzoom');
const shown = page => { const p = preview(page); return !!p && p.classList.contains('open'); };

scenario('hovering the thread header picture shows it enlarged; leaving hides it', async t => {
    const page = await t.open({ url: SMG + THREAD, html: page1() });
    await page.settle(120);
    const img = page.$('.smg-thead-thumb img');
    assert.ok(img, 'the header has its picture');
    hover(page, img);
    await page.settle(20);
    assert.ok(shown(page), 'the preview opens');
    assert.equal(preview(page).querySelector('img').src, IMG, 'it shows the same picture');
    hover(page, img, 'mouseout');
    await page.settle(20);
    assert.ok(!shown(page), 'the preview closes when the mouse leaves');
});

scenario('hovering a thread picture in the alerts rail shows it enlarged', async t => {
    const page = await t.open({ url: SMG + THREAD, html: page1() });
    await page.settle(120);
    const ico = page.document.createElement('span');
    ico.className = 'smg-al-icon smg-al-icon--thumb';
    ico.innerHTML = `<img src="${IMG}" alt="">`;
    page.document.body.appendChild(ico);
    hover(page, ico.querySelector('img'));
    await page.settle(20);
    assert.ok(shown(page), 'the preview opens for an alert picture');
    assert.equal(getComputedStylePE(page), 'none', 'the preview never takes the click');
});
function getComputedStylePE(page) { return page.window.getComputedStyle(preview(page)).pointerEvents; }

scenario('hover zoom is on by default and the settings panel can turn it off', async t => {
    const on = await t.open({ url: SMG + THREAD, html: page1() });
    await on.settle(120);
    assert.ok(on.$$('#smg-settings-pop .smg-set-row input').some(i => i.dataset.feat === 'hoverZoom' && i.checked), 'its switch is in the panel and on');
    const off = await t.open({ url: SMG + THREAD, html: page1(), features: { hoverZoom: false } });
    await off.settle(120);
    hover(off, off.$('.smg-thead-thumb img'));
    await off.settle(20);
    assert.ok(!shown(off), 'turned off, hovering does nothing');
});

scenario('touch screens get no hover preview', async t => {
    const page = await t.open({ url: SMG + THREAD, html: page1(), coarse: true });
    await page.settle(120);
    const img = page.$('.smg-thead-thumb img');
    if (img) hover(page, img);
    await page.settle(20);
    assert.ok(!shown(page), 'no preview on a coarse pointer');
});
