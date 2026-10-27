'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const TEST_DIR = __dirname;
const IMPLEMENTATION = path.join(__dirname, '..', '34-mirror-classify.js');
const FIXTURES = path.join(TEST_DIR, 'fixtures');
const registry = [];
let currentFile = '';
let functions;
let loadError;

function loadFunctions() {
    if (functions || loadError) return;
    let source;
    try {
        source = fs.readFileSync(IMPLEMENTATION, 'utf8');
    } catch (error) {
        loadError = new Error('module not found: ' + path.relative(process.cwd(), IMPLEMENTATION));
        return;
    }
    try {
        functions = vm.runInNewContext(source + '\n;({ classifyMirrorPage, classifyMediaProbe, orderMirrors, nextWorking })', {});
    } catch (error) {
        loadError = error;
    }
}

function call(name, ...args) {
    loadFunctions();
    if (loadError) throw loadError;
    if (!functions || typeof functions[name] !== 'function') {
        throw new Error('function missing: ' + name + ' in ' + path.relative(process.cwd(), IMPLEMENTATION));
    }
    return functions[name](...args);
}

function fixture(name) {
    return fs.readFileSync(path.join(FIXTURES, name), 'utf8');
}

function scenario(name, fn) {
    registry.push({ file: currentFile, name, fn });
}

function setFile(file) { currentFile = file; }

module.exports = { call, fixture, registry, scenario, setFile };
