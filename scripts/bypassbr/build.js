#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const PARTS = path.join(__dirname, 'parts');
const OUT = path.join(__dirname, 'script.js');

const PART_FILES = [
    'core/01-header.js',
    'core/02-shared.js',
    'sites/10-twitter.js',
    'sites/20-spankbang.js',
    'sites/30-chaturbate.js',
    'sites/40-erome.js',
    'sites/50-pornhub.js',
    'sites/60-sexcom.js',
    'runtime/99-footer.js',
];

const files = PART_FILES.map(file => path.join(PARTS, file));
const duplicateParts = PART_FILES.filter((file, index) => PART_FILES.indexOf(file) !== index);
if (duplicateParts.length) {
    console.error('ERROR: duplicate parts:\n  ' + [...new Set(duplicateParts)].join('\n  '));
    process.exit(1);
}

const missing = files.filter(file => !fs.existsSync(file));
if (missing.length) {
    console.error('ERROR: missing parts:\n  ' + missing.map(file => path.relative(PARTS, file)).join('\n  '));
    process.exit(1);
}

function listJavaScriptParts(dir, prefix = '') {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const relative = path.join(prefix, entry.name);
        if (entry.isDirectory()) return listJavaScriptParts(path.join(dir, entry.name), relative);
        return entry.isFile() && entry.name.endsWith('.js') ? [relative] : [];
    });
}

const actualParts = listJavaScriptParts(PARTS).sort();
const manifestParts = [...PART_FILES].sort();
const unlisted = actualParts.filter(file => !manifestParts.includes(file));
if (unlisted.length) {
    console.error('ERROR: parts missing from manifest:\n  ' + unlisted.join('\n  '));
    process.exit(1);
}

const out = files.map(file => fs.readFileSync(file, 'utf8').replace(/\s+$/, '')).join('\n') + '\n';
fs.writeFileSync(OUT, out);
console.log('build OK — ' + files.length + ' parts → ' + path.relative(process.cwd(), OUT));
console.log('parts: ' + PART_FILES.join('  '));
