#!/usr/bin/env node
'use strict';
// Scenario runner for the XenForo userscript. Runs every tests/scenarios/*.test.js in order,
// one scenario at a time, each on fresh jsdom pages that load the built script.js.
//   node tests/run.js                 all scenarios
//   node tests/run.js masonry pager   only scenarios whose file or name contains one of the words
// Prints one line per scenario and a summary; exit code 1 when anything fails.
const fs = require('fs');
const path = require('path');
const harness = require('./harness');

const TIMEOUT_MS = 30000;
const filters = process.argv.slice(2).map(s => s.toLowerCase());
const dir = path.join(__dirname, 'scenarios');

fs.readdirSync(dir).filter(f => f.endsWith('.test.js')).sort().forEach(file => {
    harness.setFile(file.replace(/\.test\.js$/, ''));
    require(path.join(dir, file));
});

const selected = harness.registry.filter(s => !filters.length
    || filters.some(f => s.file.toLowerCase().includes(f) || s.name.toLowerCase().includes(f)));

function withTimeout(promise, ms, label) {
    let timer;
    return Promise.race([
        promise,
        new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('timed out after ' + ms + 'ms: ' + label)), ms); }),
    ]).finally(() => clearTimeout(timer));
}

(async () => {
    let passed = 0;
    const failures = [];
    const started = Date.now();
    let lastFile = '';
    for (const s of selected) {
        if (s.file !== lastFile) { console.log('\n# ' + s.file); lastFile = s.file; }
        const pages = [];
        const t = {
            open: async opts => { const p = await harness.openPage(opts); pages.push(p); return p; },
        };
        try {
            await withTimeout(Promise.resolve().then(() => s.fn(t)), TIMEOUT_MS, s.name);
            passed++;
            console.log('  ok   ' + s.name);
        } catch (err) {
            failures.push({ s, err });
            console.log('  FAIL ' + s.name + '\n       ' + String((err && err.message) || err).split('\n').join('\n       '));
            if (process.env.SMG_TEST_LOGS) pages.forEach(p => p.logs.forEach(l => console.log('       [' + l[0] + '] ' + l[1])));
        } finally {
            pages.forEach(p => p.close());
        }
    }
    const secs = ((Date.now() - started) / 1000).toFixed(1);
    console.log('\nscenarios: ' + selected.length + '  passed: ' + passed + '  failed: ' + failures.length + '  (' + secs + 's)');
    if (failures.length) {
        console.log('failed:');
        failures.forEach(f => console.log('  - ' + f.s.file + ': ' + f.s.name));
    }
    process.exit(failures.length ? 1 : 0);
})();
