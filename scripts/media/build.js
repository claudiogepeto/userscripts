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
//  Output: scripts/<host>.user.js, which build.mjs then copies to dist/. Each
//  output carries a GENERATED marker with a hash of its own content; if the
//  file on disk no longer matches its hash it was edited by hand, and the
//  build stops instead of overwriting that edit.
//  Usage: node scripts/media/build.js
// =============================================================================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MEDIA = __dirname;
const CORE = path.join(MEDIA, 'core');
const HOSTS = path.join(MEDIA, 'hosts');
const OUT_DIR = path.dirname(MEDIA);

const MANIFEST = {
    bunkr: [
        '00-meta.js',
        '05-boot.js',
        '06-host.js',
        'core/viewers.js',
        'core/css.js',
        'core/player.js',
        'core/dom.js',
        'core/clipboard.js',
        'core/toast.js',
        'core/dates.js',
        'core/position.js',
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
        '06-host.js',
        'core/viewers.js',
        'core/css.js',
        'core/player.js',
        'core/dom.js',
        'core/clipboard.js',
        'core/dates.js',
        'core/position.js',
        'core/history.js',
        'core/stage.js',
        '10-helpers.js',
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
        '06-host.js',
        'core/viewers.js',
        'core/css.js',
        'core/player.js',
        'core/dom.js',
        'core/clipboard.js',
        'core/toast.js',
        'core/dates.js',
        'core/position.js',
        '10-helpers.js',
        '15-dates.js',
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
        '06-host.js',
        'core/viewers.js',
        'core/css.js',
        'core/player.js',
        'core/dom.js',
        'core/clipboard.js',
        'core/toast.js',
        'core/dates.js',
        'core/position.js',
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
        '06-host.js',
        'core/viewers.js',
        'core/css.js',
        'core/player.js',
        'core/dom.js',
        'core/clipboard.js',
        'core/toast.js',
        'core/dates.js',
        'core/position.js',
        'core/stage.js',
        '10-helpers.js',
        '15-dates.js',
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
        '06-host.js',
        'core/viewers.js',
        'core/dom.js',
        'core/history.js',
        '10-app.js',
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

const MARKER_RE = /^\/\/ GENERATED by scripts\/media\/build\.js .* sha256:([0-9a-f]{64})$/m;
const META_END = '// ==/UserScript==';
const sha = text => crypto.createHash('sha256').update(text).digest('hex');

// The marker goes right after the metadata block, so dist keeps it too.
function withMarker(host, body) {
    const i = body.indexOf(META_END);
    if (i < 0) fail(host + ': sem bloco ==/UserScript==');
    const eol = body.indexOf('\n', i);
    const line = '// GENERATED by scripts/media/build.js from scripts/media/ (core + hosts/' + host + ') — edit the parts, not this file. sha256:' + sha(body);
    return body.slice(0, eol + 1) + line + '\n' + body.slice(eol + 1);
}

function stripMarker(text) {
    const m = text.match(MARKER_RE);
    if (!m) return null;
    return { hash: m[1], body: text.slice(0, m.index) + text.slice(m.index + m[0].length + 1) };
}

const outputs = {};
const edited = [];
for (const [host, entries] of Object.entries(MANIFEST)) {
    const body = entries.map(e => fs.readFileSync(resolvePart(host, e), 'utf8')).join('\n');
    const file = path.join(OUT_DIR, host + '.user.js');
    if (fs.existsSync(file)) {
        const cur = fs.readFileSync(file, 'utf8');
        const parsed = stripMarker(cur);
        // Without a marker (first generation) the file must equal the parts exactly.
        const handEdited = parsed ? sha(parsed.body) !== parsed.hash : cur !== body;
        if (handEdited) edited.push('scripts/' + host + '.user.js');
    }
    outputs[file] = { host, out: withMarker(host, body), parts: entries.length };
}
if (edited.length) {
    fail('arquivo gerado editado à mão (o hash do marcador GENERATED não confere):\n  ' + edited.join('\n  ') +
        '\n  Leve a mudança para scripts/media/ e apague o arquivo gerado, ou descarte-a com git checkout.');
}
for (const [file, o] of Object.entries(outputs)) {
    fs.writeFileSync(file, o.out);
    console.log('media: ' + o.host + '.user.js (' + o.parts + ' parts)');
}
