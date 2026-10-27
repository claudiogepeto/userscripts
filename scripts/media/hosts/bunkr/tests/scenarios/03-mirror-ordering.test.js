'use strict';

const assert = require('assert');
const { call, scenario } = require('../harness');

scenario('healthy mirrors sort by newest check, followed by unknown, missing, then down', () => {
    const domains = ['unknown-a', 'down-a', 'ok-old', 'missing-a', 'ok-new', 'unknown-b', 'down-b'];
    const health = {
        'down-a': { state: 'down', checkedAt: 100 },
        'ok-old': { state: 'ok', checkedAt: 10 },
        'missing-a': { state: 'missing', checkedAt: 500 },
        'ok-new': { state: 'ok', checkedAt: 20 },
        'down-b': { state: 'down', checkedAt: 200 },
    };
    assert.deepEqual(call('orderMirrors', domains, health, 'unknown-a'), ['ok-new', 'ok-old', 'unknown-b', 'missing-a', 'down-a', 'down-b']);
});

scenario('current mirror is excluded even when it is absent from health', () => {
    assert.deepEqual(call('orderMirrors', ['a', 'b', 'c'], {}, 'b'), ['a', 'c']);
});

scenario('ordering leaves domains and health unchanged', () => {
    const domains = ['a', 'b', 'c'];
    const health = { a: { state: 'down', checkedAt: 1 }, b: { state: 'ok', checkedAt: 2 } };
    const beforeDomains = domains.slice();
    const beforeHealth = JSON.stringify(health);
    const ordered = call('orderMirrors', domains, health, 'c');
    assert.notStrictEqual(ordered, domains);
    assert.deepEqual(domains, beforeDomains);
    assert.equal(JSON.stringify(health), beforeHealth);
});

scenario('equal health rank preserves original order', () => {
    assert.deepEqual(call('orderMirrors', ['b', 'a', 'c'], { a: { state: 'ok', checkedAt: 5 }, b: { state: 'ok', checkedAt: 5 } }, 'c'), ['b', 'a']);
});
