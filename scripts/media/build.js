#!/usr/bin/env node
/* eslint-disable */
// =============================================================================
//  build.js — builds the media-host userscripts (bunkr, gofile, filester,
//  pixeldrain, turbo, goonbox) from the parts under scripts/media/.
//
//  Each host is an ordered manifest of parts. An entry "core/x.js" comes from
//  scripts/media/core/, anything else from scripts/media/hosts/<host>/. Parts
//  share one IIFE scope and are joined with '\n' (each part is a contiguous
//  slice of lines saved without a trailing '\n'), the same scheme as
//  scripts/xenforo/build.js.
//
//  Output: scripts/<host>.user.js, which build.mjs then copies to dist/.
//  Usage: node scripts/media/build.js
// =============================================================================
const fs = require('fs');
const path = require('path');

const MEDIA = __dirname;
const CORE = path.join(MEDIA, 'core');
const HOSTS = path.join(MEDIA, 'hosts');
const OUT_DIR = path.dirname(MEDIA);

const MANIFEST = {
    bunkr: [
        '00-meta.js',
        '05-boot.js',
        '10-styles.js',
        '15-player.js',
        '20-stage.js',
        '25-topbar.js',
        '30-file-layout.js',
        '35-mirror.js',
        '40-album.js',
    ],
    gofile: [
        '00-meta.js',
        '05-styles.js',
        '10-helpers.js',
        '15-player-controls.js',
        '20-stage-builder.js',
        '25-group-by-type.js',
        '30-dates.js',
        '35-cards.js',
        '40-multiselect.js',
        '45-topbar.js',
        '50-observer.js',
    ],
    filester: [
        '00-meta.js',
        '05-styles.js',
        '10-helpers.js',
        '15-dates.js',
        '20-player-controls.js',
        '25-cdn.js',
        '30-sidebar.js',
        '35-stage-builder.js',
        '40-gallery.js',
        '45-single-item.js',
        '50-start.js',
    ],
    pixeldrain: [
        '00-meta.js',
        '05-boot.js',
        '10-mirrors.js',
        '15-icons.js',
        '20-mirror-manager.js',
        '25-player.js',
        '30-image.js',
        '35-text.js',
        '40-sidebar.js',
        '45-cards.js',
        '50-group-by-type.js',
        '55-ui.js',
        '60-sync.js',
        '65-styles.js',
    ],
    turbo: [
        '00-meta.js',
        '05-styles.js',
        '10-helpers.js',
        '15-dates.js',
        '20-player-controls.js',
        '25-player.js',
        '30-sidebar.js',
        '35-stage-builder.js',
        '40-album.js',
        '45-single-item.js',
        '50-start.js',
    ],
    goonbox: [
        '00-meta.js',
        '05-boot.js',
    ],
};

function fail(msg) {
    console.error('ERRO (media): ' + msg);
    process.exit(1);
}

function resolvePart(host, entry) {
    return entry.startsWith('core/') ? path.join(MEDIA, entry) : path.join(HOSTS, host, entry);
}

function listJs(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();
}

// Every part on disk must be listed somewhere, and every listed part must exist.
const usedCore = new Set();
for (const [host, entries] of Object.entries(MANIFEST)) {
    const dupes = entries.filter((e, i) => entries.indexOf(e) !== i);
    if (dupes.length) fail(host + ': parts duplicados: ' + [...new Set(dupes)].join(', '));
    const missing = entries.filter(e => !fs.existsSync(resolvePart(host, e)));
    if (missing.length) fail(host + ': parts ausentes: ' + missing.join(', '));
    entries.filter(e => e.startsWith('core/')).forEach(e => usedCore.add(e.slice(5)));
    const unlisted = listJs(path.join(HOSTS, host)).filter(f => !entries.includes(f));
    if (unlisted.length) fail(host + ': parts fora do manifesto: ' + unlisted.join(', '));
}
const unusedCore = listJs(CORE).filter(f => !usedCore.has(f));
if (unusedCore.length) fail('core sem uso: ' + unusedCore.join(', '));
const strayHosts = fs.readdirSync(HOSTS).filter(d => !MANIFEST[d]);
if (strayHosts.length) fail('hosts fora do manifesto: ' + strayHosts.join(', '));

for (const [host, entries] of Object.entries(MANIFEST)) {
    const out = entries.map(e => fs.readFileSync(resolvePart(host, e), 'utf8')).join('\n');
    fs.writeFileSync(path.join(OUT_DIR, host + '.user.js'), out);
    console.log('media: ' + host + '.user.js (' + entries.length + ' parts)');
}
