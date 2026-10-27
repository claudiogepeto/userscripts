#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const harness = require('./harness');

const dir = path.join(__dirname, 'scenarios');
let lastFile = '';
fs.readdirSync(dir).filter(file => file.endsWith('.test.js')).sort().forEach(file => {
    harness.setFile(file.replace(/\.test\.js$/, ''));
    require(path.join(dir, file));
});

(async () => {
    let passed = 0;
    const failures = [];
    for (const scenario of harness.registry) {
        if (scenario.file !== lastFile) {
            console.log('\n# ' + scenario.file);
            lastFile = scenario.file;
        }
        try {
            await scenario.fn();
            passed++;
            console.log('  ok   ' + scenario.name);
        } catch (error) {
            failures.push({ scenario, error });
            console.log('  FAIL ' + scenario.name + '\n       ' + String(error.message || error).split('\n').join('\n       '));
        }
    }
    console.log('\nscenarios: ' + harness.registry.length + '  passed: ' + passed + '  failed: ' + failures.length);
    if (failures.length) {
        console.log('failed:');
        failures.forEach(({ scenario }) => console.log('  - ' + scenario.file + ': ' + scenario.name));
    }
    process.exitCode = failures.length ? 1 : 0;
})();
