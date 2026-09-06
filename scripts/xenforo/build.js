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

// The files are grouped by ownership, but execution order remains explicit because
// the fragments share one IIFE scope and some late sections depend on earlier helpers.
const PART_FILES = [
    'core/01-header.js',
    'core/02-config.js',
    'core/03-i18n.js',
    'core/04-icons.js',
    'core/05-styles.js',
    'styles/01-base.js',
    'styles/02-home.js',
    'styles/03-topbar.js',
    'styles/04-mobile.js',
    'styles/05-filterbar.js',
    'styles/06-thread.js',
    'styles/07-feed.js',
    'styles/08-alertdock.js',
    'styles/09-paint.js',
    'core/06-helpers.js',
    'core/06b-feed-db.js',
    'shared/07-posts-misc.js',
    'shared/08-images-masonry.js',
    'shared/10-redgifs-player.js',
    'shared/11-autoload-spoiler.js',
    'shared/12-dock-postnav.js',
    'shared/13-search-imageclick.js',
    'shared/14-feed-lightbox.js',
    'pages/15-listing.js',
    'pages/16-home.js',
    'pages/17-thread-filterbar.js',
    'shared/18-alerts.js',
    'shared/19-alerts-dock.js',
    'shared/19-topbar.js',
    'shared/20-hover-preview.js',
    'runtime/21-init-features.js',
    'pages/22-bookmarks.js',
    'pages/22-feed-sync.js',
    'pages/22-feed.js',
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

const out = files.map(f => fs.readFileSync(f, 'utf8')).join('\n');
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
        const stylePaths = PART_FILES.filter(file => file.startsWith('styles/')).map(file => path.join(PARTS, file));
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
