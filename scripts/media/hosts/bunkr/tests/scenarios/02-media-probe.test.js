'use strict';

const assert = require('assert');
const { call, scenario } = require('../harness');

for (const status of [200, 206]) {
    scenario('successful ranged response ' + status + ' is ok', () => {
        assert.equal(call('classifyMediaProbe', { status, contentType: 'video/mp4' }), 'ok');
    });
}

for (const status of [404, 410, 403]) {
    scenario('ranged response ' + status + ' is missing', () => {
        assert.equal(call('classifyMediaProbe', { status, contentType: 'video/mp4' }), 'missing');
    });
}

scenario('HTML error page on a successful CDN status is missing', () => {
    assert.equal(call('classifyMediaProbe', { status: 200, contentType: 'text/html; charset=utf-8' }), 'missing');
    assert.equal(call('classifyMediaProbe', { status: 206, contentType: 'text/html' }), 'missing');
});

scenario('timeout and network error remain inconclusive', () => {
    assert.equal(call('classifyMediaProbe', { timedOut: true }), 'inconclusive');
    assert.equal(call('classifyMediaProbe', { error: new Error('network') }), 'inconclusive');
});

scenario('server errors and unrecognized statuses are inconclusive', () => {
    for (const status of [500, 502, 503, 0, 301]) {
        assert.equal(call('classifyMediaProbe', { status, contentType: 'video/mp4' }), 'inconclusive');
    }
});
