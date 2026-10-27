'use strict';

const assert = require('assert');
const { call, scenario } = require('../harness');

scenario('nextWorking advances in domain order and skips unhealthy mirrors', () => {
    const domains = ['a', 'b', 'c', 'd'];
    const health = { a: { state: 'ok' }, b: { state: 'down' }, c: { state: 'ok' }, d: { state: 'missing' } };
    assert.equal(call('nextWorking', domains, health, 'a', 1), 'c');
});

scenario('nextWorking wraps forward and never returns current', () => {
    const domains = ['a', 'b', 'c'];
    const health = { a: { state: 'ok' }, b: { state: 'ok' }, c: { state: 'ok' } };
    assert.equal(call('nextWorking', domains, health, 'c', 1), 'a');
    assert.equal(call('nextWorking', domains, health, 'a', 1), 'b');
});

scenario('nextWorking cycles backward and wraps around', () => {
    const domains = ['a', 'b', 'c'];
    const health = { a: { state: 'ok' }, b: { state: 'down' }, c: { state: 'ok' } };
    assert.equal(call('nextWorking', domains, health, 'c', -1), 'a');
    assert.equal(call('nextWorking', domains, health, 'a', -1), 'c');
});

scenario('no other healthy mirror returns null', () => {
    assert.equal(call('nextWorking', ['a', 'b'], { a: { state: 'ok' }, b: { state: 'down' } }, 'a', 1), null);
    assert.equal(call('nextWorking', ['a', 'b'], {}, 'a', -1), null);
});

scenario('current absent from domains starts at the directional boundary', () => {
    const domains = ['a', 'b', 'c'];
    const health = { a: { state: 'ok' }, b: { state: 'down' }, c: { state: 'ok' } };
    assert.equal(call('nextWorking', domains, health, 'missing-current', 1), 'a');
    assert.equal(call('nextWorking', domains, health, 'missing-current', -1), 'c');
});
