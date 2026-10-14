#!/usr/bin/env node
/* eslint-disable */
// =============================================================================
//  build.js — builds the single userscript (for Tampermonkey) from parts/.
//
//  Concatenates the ordered source manifest with '\n' between parts and
//  writes the monolith to ./script.js. This is intentionally only concatenation:
//  everything in parts/ is emitted with the same order and IIFE scope.
//
//  Por que '\n' entre parts reconstrói o original: cada part = um slice contíguo
//  de linhas salvo como linhas.join('\n') (sem '\n' no fim). Juntar os parts com
//  '\n' reinsere exatamente a quebra que existia na fronteira → idêntico.
//
//  Usage: node scripts/xenforo/build.js
//  Then install the generated scripts/xenforo/script.js in Tampermonkey.
// =============================================================================
const fs = require('fs');
const path = require('path');

const PARTS = path.join(__dirname, 'parts');
const OUT = path.join(__dirname, 'script.js');

// Folders group the files by feature; execution order stays explicit here because the
// fragments share one IIFE scope and some late sections depend on earlier helpers.
// A file may start mid-function (12b/12c continue setupPostNavigation from 12a).
const PART_FILES = [
    'core/01-header.js',
    'core/02-config.js',
    'core/03-i18n.js',
    'core/04-icons.js',
    'core/05-styles.js',
    'styles/01-base.js',
    'media/css-grids.js',
    'media/css-images.js',
    'media/css-social-embeds.js',
    'media/css-players.js',
    'styles/02-home.js',
    'styles/03-topbar.js',
    'navigation/css-notices.js',
    'alerts/css-alerts.js',
    'navigation/css-dock.js',
    'navigation/css-search.js',
    'media/css-media-feed.js',
    'navigation/css-dock-mobile.js',
    'listing/css-listing-controls.js',
    'navigation/css-settings.js',
    'styles/04-mobile.js',
    'styles/05-filterbar.js',
    'styles/06-thread.js',
    'listing/css-thread-cards.js',
    'thread/css-post-cards.js',
    'thread/css-comments.js',
    'styles/07-feed.js',
    'styles/08-alertdock.js',
    'styles/09-paint.js',
    'core/06-helpers.js',
    'feed/06b-feed-db.js',
    'thread/07-posts-misc.js',
    'media/08a-masonry-engine.js',
    'media/08-images-masonry.js',
    'media/10-redgifs-player.js',
    'media/11-autoload-spoiler.js',
    'navigation/12a-dock.js',
    'navigation/12b-dock-search.js',
    'navigation/12c-dock-settings.js',
    'media/13-search-imageclick.js',
    'media/14-feed-lightbox.js',
    'listing/15-listing.js',
    'home/16-home.js',
    'thread/17a-filterbar.js',
    'following/17b-watched-list.js',
    'thread/17c-post-cards.js',
    'alerts/18-alerts.js',
    'alerts/19-alerts-dock.js',
    'navigation/19-topbar.js',
    'navigation/20-thumb-url.js',
    'runtime/21-init-features.js',
    'feed/22-bookmarks.js',
    'feed/22-feed-sync.js',
    'feed/22-feed.js',
    'runtime/22-paint.js',
    'runtime/22-init.js',
];

const files = PART_FILES.map(file => path.join(PARTS, file));
const duplicateParts = PART_FILES.filter((file, index) => PART_FILES.indexOf(file) !== index);
if (duplicateParts.length) {
    console.error('ERRO: parts duplicados:\n  ' + [...new Set(duplicateParts)].join('\n  '));
    process.exit(1);
}
const missing = files.filter(file => !fs.existsSync(file));
if (missing.length) {
    console.error('ERRO: parts ausentes:\n  ' + missing.map(file => path.relative(PARTS, file)).join('\n  '));
    process.exit(1);
}

function listJavaScriptParts(dir, prefix) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const relative = prefix ? path.join(prefix, entry.name) : entry.name;
        if (entry.isDirectory()) return listJavaScriptParts(path.join(dir, entry.name), relative);
        return entry.isFile() && entry.name.endsWith('.js') ? [relative] : [];
    });
}

const actualParts = listJavaScriptParts(PARTS, '').sort();
const manifestParts = [...PART_FILES].sort();
const unlisted = actualParts.filter(file => !manifestParts.includes(file));
if (unlisted.length) {
    console.error('ERRO: parts fora do manifesto:\n  ' + unlisted.join('\n  '));
    process.exit(1);
}

const sources = PART_FILES.map(file => ({ file, src: fs.readFileSync(path.join(PARTS, file), 'utf8') }));

// ---- check (a): one owner per top-level name ----
// Every part shares one IIFE scope, so a second top-level `function x` silently replaces the
// first and a second `const x` is a SyntaxError only at install time. Top level = 4-space indent
// (the IIFE body); deeper declarations are local to their function.
{
    const owners = new Map();
    sources.forEach(({ file, src }) => src.split('\n').forEach((line, i) => {
        const m = /^    (?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)|^    (?:const|let|var)\s+([A-Za-z_$][\w$]*)/.exec(line);
        if (!m) return;
        const name = m[1] || m[2];
        if (!owners.has(name)) owners.set(name, []);
        owners.get(name).push(file + ':' + (i + 1));
    }));
    const dups = [...owners].filter(([, at]) => at.length > 1);
    if (dups.length) {
        console.error('ERRO: nome top-level declarado mais de uma vez (os parts dividem um escopo):\n  '
            + dups.map(([name, at]) => name + '  ' + at.join('  ')).join('\n  '));
        process.exit(1);
    }
}

const out = sources.map(({ src }) => src).join('\n');
fs.writeFileSync(OUT, out);

// Quick sanity check: count braces in CSS template literals.
// Supports both monolithic (style.textContent = `...`) and modular
// (const CSS_* = `...` in 05-styles.js) formats.
{
    let css = '';
    const monoIdx = out.indexOf('style.textContent = `');
    if (monoIdx !== -1) {
        // Original format: one template literal assigned directly.
        const open = out.indexOf('`', monoIdx), close = out.indexOf('`', open + 1);
        css = out.slice(open + 1, close);
    } else {
        // Modular format: collect all template literals from the context-owned style parts.
        const stylePaths = PART_FILES.filter(file => file.startsWith('styles/') || /\/css-[^/]+\.js$/.test(file)).map(file => path.join(PARTS, file));
        stylePaths.forEach(stylesPath => {
            const stylesSrc = fs.readFileSync(stylesPath, 'utf8');
            let i = 0, inT = false;
            for (; i < stylesSrc.length; i++) {
                if (stylesSrc[i] === '`') { inT = !inT; continue; }
                if (inT) css += stylesSrc[i];
            }
        });
    }
    if (css) {
        const o = (css.match(/{/g) || []).length, c = (css.match(/}/g) || []).length;
        console.log('CSS chaves: { ' + o + ' / } ' + c + (o === c ? '  OK' : '  ⚠️ DESBALANCEADO'));
    }
}
console.log('build OK — ' + files.length + ' parts → ' + path.relative(process.cwd(), OUT) + ' (' + out.split('\n').length + ' linhas)');
console.log('parts: ' + PART_FILES.join('  '));
console.log('Valide:  node --check ' + path.relative(process.cwd(), OUT) + '   ·   depois cole esse arquivo no Tampermonkey.');
