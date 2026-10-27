'use strict';

const assert = require('assert');
const { call, fixture, scenario } = require('../harness');

const cases = [
    ['bunkr.at', 'video', 'inline', 200, 'ok'],
    ['bunkr.cr', 'video', 'inline', 200, 'ok'],
    ['bunkr.tv', 'video', 'api', 200, 'ok'],
    ['bunkr.bz', 'video', 'api', 200, 'ok'],
    ['bunkr.click', null, null, 200, 'missing'],
    ['bunkr.fit', null, null, 200, 'missing'],
    ['bunkr.my', null, null, 200, 'missing'],
    ['bunkr.space', null, null, 200, 'missing'],
    ['bunkr.is', null, null, 404, 'missing'],
    ['bunkr.ru', null, null, 404, 'missing'],
    ['bunkr.black', null, null, 403, 'down'],
    ['bunkr.cat', null, null, 200, 'down'],
    ['bunkr.se', null, null, 200, 'down'],
    ['bunkrr.ph', null, null, 200, 'down'],
    ['bunkrr.ru', null, null, 200, 'down'],
    ['bunkr.la', null, null, 200, 'down'],
    ['bunkrr.cc', null, null, 200, 'down'],
    ['bunkr.nl', null, null, 200, 'down'],
    ['bunkrr.cr', null, null, 200, 'down'],
];

for (const [host, kind, signType, status, state] of cases) {
    scenario(host + ' fixture is classified as ' + state, () => {
        const result = call('classifyMirrorPage', {
            requestedHost: host,
            status,
            finalUrl: 'https://' + host + '/file/wrS44mX8k4KDd',
            html: fixture(host + '.html'),
        });
        assert.equal(result.state, state);
        assert.equal(typeof result.reason, 'string');
        assert.ok(result.reason.trim(), 'reason must be non-empty');
        assert.equal(result.kind, kind);
        if (signType) assert.equal(result.sign && result.sign.type, signType);
        else assert.equal(result.sign, null);
        if (signType === 'inline') {
            assert.equal(result.sign.cdn, 'https://c6no4-b.cdn.cr/storage/media/9b336899-6de4-4033-9d54-ee1e6775c273.mp4');
            assert.equal(result.sign.signUrl, 'https://glb-apisign.cdn.cr/sign');
        }
        if (signType === 'api') assert.equal(result.sign.path, '/api/sign/wrS44mX8k4KDd');
    });
}

scenario('API sign 404 template is missing', () => {
    const result = call('classifyMirrorPage', {
        requestedHost: 'bunkr.at', status: 404,
        finalUrl: 'https://bunkr.at/api/sign/wrS44mX8k4KDd',
        html: fixture('api-sign-not-found.html'),
    });
    assert.equal(result.state, 'missing');
    assert.equal(result.kind, null);
    assert.equal(result.sign, null);
});

scenario('www prefix is the same host and inline escaped slashes decode', () => {
    const result = call('classifyMirrorPage', {
        requestedHost: 'bunkr.at', status: 200,
        finalUrl: 'https://www.bunkr.at/file/wrS44mX8k4KDd',
        html: fixture('bunkr.at.html'),
    });
    assert.equal(result.state, 'ok');
    assert.equal(result.sign.cdn.includes('\\/'), false);
    assert.equal(result.sign.cdn.startsWith('https://'), true);
});

for (const [file, slug] of [['image.html', 'GpnSDpMeS4Pc4'], ['image-alt.html', 'myG1w4sYTticG']]) {
    scenario('image file page ' + slug + ' is image despite its inline signing code', () => {
        const result = call('classifyMirrorPage', {
            requestedHost: 'bunkr.cr', status: 200,
            finalUrl: 'https://bunkr.cr/f/' + slug,
            html: fixture(file),
        });
        assert.equal(result.state, 'ok');
        assert.equal(result.kind, 'image');
        assert.equal(result.sign && result.sign.type, 'inline');
        assert.equal(result.sign.signUrl, 'https://glb-apisign.cdn.cr/sign');
    });
}

for (const [file, query] of [['album.html', ''], ['album-advanced.html', '?advanced=1']]) {
    scenario('album page structure identifies the ' + (query ? 'advanced' : 'standard') + ' grid', () => {
        const result = call('classifyMirrorPage', {
            requestedHost: 'bunkr.cr', status: 200,
            finalUrl: 'https://bunkr.cr/a/6EejRDCc' + query,
            html: fixture(file),
        });
        assert.equal(result.state, 'ok');
        assert.equal(result.kind, 'album');
        assert.equal(result.sign, null);
    });
}

scenario('non-media file page with a download link is classified as file', () => {
    const result = call('classifyMirrorPage', {
        requestedHost: 'bunkr.cr', status: 200,
        finalUrl: 'https://bunkr.cr/f/TLrRU0IzMNV5L',
        html: fixture('file.html'),
    });
    assert.equal(result.state, 'ok');
    assert.equal(result.kind, 'file');
    assert.equal(result.sign, null);
});

scenario('offsite redirect is down even when the response looks like a file page', () => {
    const result = call('classifyMirrorPage', {
        requestedHost: 'bunkr.ps', status: 200,
        finalUrl: 'https://bunkrrr.org/wrS44mX8k4KDd',
        html: fixture('bunkr.ps.html'),
    });
    assert.equal(result.state, 'down');
    assert.equal(result.kind, null);
});

scenario('request error and timeout are down', () => {
    for (const input of [{ error: new Error('network') }, { timedOut: true }]) {
        const result = call('classifyMirrorPage', Object.assign({
            requestedHost: 'bunkr.at', status: 200,
            finalUrl: 'https://bunkr.at/file/x', html: fixture('bunkr.at.html'),
        }, input));
        assert.equal(result.state, 'down');
        assert.equal(result.kind, null);
    }
});

scenario('5xx responses and unknown same-host 200 pages are down', () => {
    for (const status of [500, 503, 599]) {
        const result = call('classifyMirrorPage', { requestedHost: 'bunkr.at', status, finalUrl: 'https://bunkr.at/file/x', html: '<title>Server error</title>' });
        assert.equal(result.state, 'down');
    }
    const unknown = call('classifyMirrorPage', { requestedHost: 'bunkr.at', status: 200, finalUrl: 'https://bunkr.at/other', html: '<title>Welcome</title><main>Nothing recognizable</main>' });
    assert.equal(unknown.state, 'down');
    assert.equal(unknown.reason, 'unknown page');
});

