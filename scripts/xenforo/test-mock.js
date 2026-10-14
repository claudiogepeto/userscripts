/**
 * xenforo/test-mock.js
 * Automated mock unit tests for SimpCity / SocialMediaGirls userscript
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('./node_modules/jsdom');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
    if (!condition) {
        testsFailed++;
        console.error(`  ❌ FAIL: ${message}`);
        throw new Error(`Assertion failed: ${message}`);
    } else {
        testsPassed++;
        console.log(`  ✅ PASS: ${message}`);
    }
}

async function runTests() {
    console.log('=== Iniciando Testes Automatizados Mockados (xenforo/test-mock.js) ===\n');

    // 1. Configurar o ambiente DOM mockado com elementos de thread necessários
    const html = `<!DOCTYPE html>
<html data-template="thread_view" class="has-js">
<head>
    <title>Test Thread | SocialMediaGirls</title>
</head>
<body class="p-body">
    <div class="p-pageWrapper">
        <div class="p-nav"></div>
        <div class="p-breadcrumbs">
            <a href="/forums/general.1/">General</a>
        </div>
        <div class="p-body-inner">
            <div class="p-body-main">
                <div class="p-body-content">
                    <article class="message message--post" id="js-post-1001" data-content="post-1001">
                        <span class="u-anchorTarget" id="post-1001"></span>
                        <div class="message-inner">
                            <div class="message-cell message-cell--user">
                                <a class="username" href="/members/author.1/">Author</a>
                            </div>
                            <div class="message-cell message-cell--main">
                                <div class="message-content">
                                    <div class="message-userContent">Hello World</div>
                                </div>
                            </div>
                        </div>
                    </article>
                    <div class="block">
                        <div class="structItem--thread"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;

    const dom = new JSDOM(html, {
        url: 'https://forums.socialmediagirls.com/threads/test-thread.12345/',
        runScripts: 'dangerously'
    });

    const window = dom.window;
    const document = window.document;
    Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });

    // Mock IntersectionObserver
    class MockIntersectionObserver {
        constructor(callback, options) {
            this.callback = callback;
            this.options = options || {};
            this.elements = new Set();
        }
        observe(target) {
            this.elements.add(target);
        }
        unobserve(target) {
            this.elements.delete(target);
        }
        disconnect() {
            this.elements.clear();
        }
        takeRecords() {
            return [];
        }
    }
    window.IntersectionObserver = MockIntersectionObserver;

    // Mock ResizeObserver
    class MockResizeObserver {
        constructor(callback) {
            this.callback = callback;
            this.elements = new Set();
        }
        observe(target) {
            this.elements.add(target);
        }
        unobserve(target) {
            this.elements.delete(target);
        }
        disconnect() {
            this.elements.clear();
        }
    }
    window.ResizeObserver = MockResizeObserver;
    window.scrollBy = () => {};

    // Mock requestAnimationFrame
    window.requestAnimationFrame = (fn) => setTimeout(fn, 0);
    window.cancelAnimationFrame = (id) => clearTimeout(id);

    // Mock scrollIntoView
    window.Element.prototype.scrollIntoView = () => {};

    // Mock matchMedia
    window.matchMedia = (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    });

    // Mock Tampermonkey GM functions
    const gmStore = {};
    window.GM_getValue = (k, def) => (k in gmStore ? gmStore[k] : def);
    window.GM_setValue = (k, v) => { gmStore[k] = v; };
    window.GM_xmlhttpRequest = (opts) => { if (opts && opts.onerror) setTimeout(opts.onerror, 0); };
    window.GM_download = () => {};

    // Mock fetch
    window.fetch = async (url, opts) => {
        return {
            ok: true,
            status: 200,
            text: async () => `<html><body>
                <select name="c[prefixes][]">
                    <option value="111">Model</option>
                    <option value="222">Cosplay</option>
                </select>
            </body></html>`,
            json: async () => ({}),
            url: typeof url === 'string' ? url : (url && url.url) || ''
        };
    };

    // Mock IndexedDB
    const mockStorage = {
        followed: new Map(),
        timeline: new Map(),
        meta: new Map(),
        bookmarks: new Map()
    };

    class MockIDBRequest {
        constructor() {
            this.onsuccess = null;
            this.onerror = null;
            this.result = null;
            this.error = null;
        }
        _resolve(val) {
            this.result = val;
            setTimeout(() => { if (this.onsuccess) this.onsuccess({ target: this }); }, 0);
        }
    }

    class MockIDBObjectStore {
        constructor(name, keyPath) {
            this.name = name;
            this.keyPath = keyPath;
            this.indices = new Map();
        }
        createIndex(name, keyPath) {
            this.indices.set(name, keyPath);
            return {};
        }
        get indexNames() {
            return {
                contains: (name) => this.indices.has(name)
            };
        }
        get(key) {
            const req = new MockIDBRequest();
            const val = mockStorage[this.name]?.get(key);
            req._resolve(val || undefined);
            return req;
        }
        put(item) {
            const req = new MockIDBRequest();
            const key = item[this.keyPath];
            if (!mockStorage[this.name]) mockStorage[this.name] = new Map();
            mockStorage[this.name].set(key, item);
            req._resolve(key);
            return req;
        }
        delete(key) {
            const req = new MockIDBRequest();
            mockStorage[this.name]?.delete(key);
            req._resolve();
            return req;
        }
        clear() {
            const req = new MockIDBRequest();
            mockStorage[this.name]?.clear();
            req._resolve();
            return req;
        }
        count() {
            const req = new MockIDBRequest();
            req._resolve(mockStorage[this.name]?.size || 0);
            return req;
        }
        openCursor(range, direction) {
            const req = new MockIDBRequest();
            const entries = Array.from((mockStorage[this.name] || new Map()).values());
            let idx = 0;
            const advance = () => {
                if (idx < entries.length) {
                    const currentVal = entries[idx++];
                    req.result = {
                        value: currentVal,
                        continue: advance,
                        update: (upVal) => { mockStorage[this.name].set(upVal[this.keyPath], upVal); },
                        delete: () => { mockStorage[this.name].delete(currentVal[this.keyPath]); }
                    };
                } else {
                    req.result = null;
                }
                if (req.onsuccess) req.onsuccess({ target: req });
            };
            setTimeout(advance, 0);
            return req;
        }
        index(name) {
            return {
                openCursor: (range, direction) => {
                    const req = new MockIDBRequest();
                    let entries = Array.from((mockStorage[this.name] || new Map()).values());
                    if (direction === 'prev') {
                        entries.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
                    } else {
                        entries.sort((a, b) => (a.created_at || 0) - (b.created_at || 0));
                    }
                    let idx = 0;
                    const advance = () => {
                        if (idx < entries.length) {
                            const currentVal = entries[idx++];
                            req.result = {
                                value: currentVal,
                                continue: advance,
                                delete: () => { mockStorage[this.name].delete(currentVal[this.keyPath]); }
                            };
                        } else {
                            req.result = null;
                        }
                        if (req.onsuccess) req.onsuccess({ target: req });
                    };
                    setTimeout(advance, 0);
                    return req;
                }
            };
        }
    }

    class MockIDBTransaction {
        constructor(storeNames) {
            this.storeNames = Array.isArray(storeNames) ? storeNames : [storeNames];
            this.oncomplete = null;
            this.onerror = null;
            setTimeout(() => { if (this.oncomplete) this.oncomplete(); }, 15);
        }
        objectStore(name) {
            return new MockIDBObjectStore(name, name === 'followed' ? 'path' : (name === 'timeline' ? 'post_id' : (name === 'meta' ? 'key' : 'postId')));
        }
    }

    class MockIDBDatabase {
        constructor() {
            this.objectStoreNames = {
                contains: (name) => ['followed', 'timeline', 'meta', 'bookmarks'].includes(name)
            };
        }
        createObjectStore(name, opts) {
            return new MockIDBObjectStore(name, opts?.keyPath);
        }
        deleteObjectStore(name) {}
        transaction(storeNames, mode) {
            return new MockIDBTransaction(storeNames);
        }
    }

    window.IDBKeyRange = {
        only: (val) => ({ val, type: 'only' }),
        bound: (lower, upper, lowerOpen, upperOpen) => ({ lower, upper, lowerOpen, upperOpen, type: 'bound' }),
        upperBound: (upper, open) => ({ upper, open, type: 'upperBound' }),
        lowerBound: (lower, open) => ({ lower, open, type: 'lowerBound' })
    };

    window.indexedDB = {
        open: (name, version) => {
            const req = new MockIDBRequest();
            const db = new MockIDBDatabase();
            const tx = new MockIDBTransaction(['followed', 'timeline', 'meta', 'bookmarks']);
            req.transaction = tx;
            setTimeout(() => {
                req.result = db;
                if (req.onupgradeneeded) req.onupgradeneeded({ result: db, target: req, transaction: tx });
                if (req.onsuccess) req.onsuccess({ target: req });
            }, 0);
            return req;
        },
        deleteDatabase: () => {}
    };

    // Ativar modo de teste
    window.__TEST_MODE__ = true;

    // Load and evaluate scripts/xenforo/script.js in the mock window.
    const scriptPath = path.join(__dirname, 'script.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');

    console.log('[1/4] Loading and executing scripts/xenforo/script.js in the mock environment...');
    window.eval(scriptContent);
    // Disparar DOMContentLoaded para executar boot()
    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    console.log('Script carregado e inicializado com sucesso!\n');
    const headerSource = fs.readFileSync(path.join(__dirname, 'parts', 'core', '01-header.js'), 'utf8');
    const expectedVersion = (headerSource.match(/\/\/ @version\s+(\S+)/) || [])[1];
    assert(!!expectedVersion && scriptContent.includes('// @version      ' + expectedVersion), `Userscript deve estar na versão ${expectedVersion} (parts/core/01-header.js)`);

    // =========================================================================
    // TESTE UI: topbar/thread header + posição central da busca na navbar mobile
    // =========================================================================
    console.log('--- TESTE UI: Topbar, tags e busca mobile ---');
    const navCenter = document.querySelector('#smg-post-nav-panel > .smg-nav-center');
    const navIds = navCenter ? Array.from(navCenter.children).map(el => el.id) : [];
    assert(navIds.includes('smg-thread-search'), 'Navbar mobile deve conter o botão de busca');
    assert(navIds.indexOf('smg-thread-search') === Math.floor(navIds.length / 2), 'Busca deve ocupar a posição central da navbar mobile');

    const uiThreadHeader = document.createElement('div');
    uiThreadHeader.className = 'p-body-header';
    uiThreadHeader.innerHTML = `
        <div class="p-title">
            <h1 class="p-title-value"><span class="label label--twitch">Twitch</span> Dorozea</h1>
        </div>
        <div class="p-description">
            <ul class="listInline">
                <li class="tagList-icon">🏷️</li>
                <li class="tagList"><a class="tagItem" href="/tags/cute-girl/">cute girl</a><a class="tagItem" href="/tags/dorozea/">dorozea</a></li>
            </ul>
        </div>`;
    const uiThreadBarHost = document.createElement('div');
    uiThreadBarHost.className = 'block-outer';
    uiThreadBarHost.innerHTML = '<div class="smg-bar"></div>';
    document.body.append(uiThreadHeader, uiThreadBarHost);
    window.__processAll([uiThreadHeader, uiThreadBarHost]);

    const mobileThreadbarTitle = document.querySelector('#smg-mobile-threadbar-title');
    assert(mobileThreadbarTitle?.querySelector('.label')?.textContent.trim() === 'Twitch', 'Topbar deve preservar a badge da thread como elemento estilizado');
    assert(mobileThreadbarTitle?.textContent.replace(/\s+/g, ' ').trim() === 'Twitch Dorozea', 'Topbar deve manter o texto completo da thread');
    const groupedTags = uiThreadHeader.querySelector('.smg-thead-tags') || document.querySelector('.smg-thead-tags');
    assert(groupedTags?.querySelector('.smg-thead-tags-row .tagList-icon') !== null
        && groupedTags?.querySelector('.smg-thead-tags-row .tagList') !== null,
    'Ícone de tags e lista de badges devem compartilhar a mesma linha');
    uiThreadHeader.remove();
    uiThreadBarHost.remove();
    document.querySelector('.smg-thead-tags-bar')?.remove();

    // =========================================================================
    // TESTE PERF: escopo incremental, caches e trabalho sujo
    // =========================================================================
    console.log('--- TESTE PERF: Escopo incremental, ingestão e caches ---');
    assert(window.__performanceExports !== undefined, 'Exports de performance devem estar disponíveis no modo de teste');
    const { normalizeRoots, makeTaskQueue } = window.__performanceExports;
    assert(typeof normalizeRoots === 'function', 'normalizeRoots deve ser função');
    const rootParent = document.createElement('div');
    const rootChild = document.createElement('div');
    rootParent.appendChild(rootChild);
    document.body.appendChild(rootParent);
    const normalizedRoots = normalizeRoots([rootChild, rootParent, rootChild]);
    assert(normalizedRoots.length === 1 && normalizedRoots[0] === rootParent, 'Roots aninhadas e duplicadas devem ser reduzidas à raiz mais externa');
    rootParent.remove();

    assert(typeof makeTaskQueue === 'function', 'makeTaskQueue deve ser função');
    const queued = makeTaskQueue(1);
    const queueOrder = [];
    const near = document.createElement('div');
    const far = document.createElement('div');
    near.getBoundingClientRect = () => ({ top: 10, bottom: 20, left: 0, right: 10, width: 10, height: 10 });
    far.getBoundingClientRect = () => ({ top: 5000, bottom: 5010, left: 0, right: 10, width: 10, height: 10 });
    document.body.append(near, far);
    queued.push(() => { queueOrder.push('far'); }, far);
    queued.push(() => { queueOrder.push('near'); }, near);
    await new Promise(resolve => setTimeout(resolve, 0));
    assert(queueOrder[0] === 'near', 'Fila de trabalho deve priorizar o item mais próximo da viewport');
    near.remove(); far.remove();

    const feedPerf = window.__feedExports;
    assert(feedPerf.riverSortDirty === true || typeof feedPerf.markRiverSortDirty === 'function', 'Timeline deve expor estado de ordenação suja');
    if (typeof feedPerf.markRiverSortDirty === 'function') feedPerf.markRiverSortDirty();
    assert(feedPerf.riverSortDirty === true, 'Inserção de conteúdo deve marcar a ordenação da timeline como suja');
    feedPerf.riverList = document.createElement('div');
    feedPerf.riverList.innerHTML = '<div class="smg-fp-card" data-ts="2"></div><div class="smg-fp-card" data-ts="1"></div>';
    feedPerf.ensureRiverSorted();
    assert(feedPerf.riverSortDirty === false, 'ensureRiverSorted deve limpar o estado sujo após ordenar');

    assert(window.__redgifsExports !== undefined, 'Exports do RedGifs devem estar disponíveis');
    const rgPerf = window.__redgifsExports;
    assert(typeof rgPerf.cacheSet === 'function', 'Cache do RedGifs deve possuir inserção LRU testável');
    for (let i = 0; i < rgPerf.RG_CACHE_MAX + 5; i++) rgPerf.cacheSet(rgPerf.rgCache, 'perf-' + i, { id: i });
    assert(rgPerf.rgCache.size <= rgPerf.RG_CACHE_MAX, 'Cache de metadados do RedGifs deve ter limite de tamanho');
    console.log('Teste PERF concluído com sucesso!\n');

    // =========================================================================
    // TESTE 1: feedSyncRunning está definido e não lança ReferenceError
    // =========================================================================
    console.log('--- TESTE 1: feedSyncRunning & River Loading ---');
    assert(window.__feedExports !== undefined, 'window.__feedExports deve estar exposto');
    assert(window.__feedExports.FEED_DATA_VERSION === 12, 'FEED_DATA_VERSION deve ser 12');
    assert(window.__feedExports.FEED_SYNC_VERSION === 10, 'FEED_SYNC_VERSION deve ser 10');
    assert(typeof window.__feedExports.feedSyncRunning === 'boolean', 'feedSyncRunning deve ser booleano');
    assert(window.__feedExports.feedSyncRunning === false, 'feedSyncRunning deve iniciar como false');

    // Preparar riverList
    const riverHost = document.createElement('div');
    riverHost.id = 'smg-river';
    const riverList = document.createElement('div');
    riverList.className = 'smg-river-list';
    riverHost.appendChild(riverList);
    document.body.appendChild(riverHost);
    window.__feedExports.riverList = riverList;

    // Chamar mountSentinel() enquanto feedSyncRunning = false
    try {
        window.__feedExports.mountSentinel();
        assert(true, 'mountSentinel() executou sem lançar ReferenceError');
    } catch (e) {
        assert(false, `mountSentinel() lançou erro: ${e.message}`);
    }

    const moreBtn = window.__feedExports.riverMoreEl;
    assert(moreBtn !== null && moreBtn.classList.contains('smg-river-more'), 'riverMoreEl foi criado com sucesso');
    assert(!moreBtn.classList.contains('is-loading'), 'riverMoreEl não deve ter is-loading quando feedSyncRunning é false');

    // Testar com feedSyncRunning = true
    window.__feedExports.feedSyncRunning = true;
    assert(window.__feedExports.feedSyncRunning === true, 'feedSyncRunning pode ser alterado para true');

    // Chamar firstPaint() que por sua vez chama mountSentinel() com feedSyncRunning = true
    try {
        window.__feedExports.firstPaint();
        assert(true, 'firstPaint() executou sem lançar ReferenceError');
    } catch (e) {
        assert(false, `firstPaint() lançou erro: ${e.message}`);
    }

    // Resetar estado
    window.__feedExports.feedSyncRunning = false;

    // Testar ensureRiverSorted
    const { ensureRiverSorted, riverCard } = window.__feedExports;
    assert(typeof ensureRiverSorted === 'function', 'ensureRiverSorted deve ser uma função');

    // Montar cards fora de ordem
    riverList.innerHTML = '';
    const card1 = document.createElement('div'); card1.className = 'smg-fp-card'; card1.dataset.postId = '1'; card1.dataset.ts = '1000';
    const card2 = document.createElement('div'); card2.className = 'smg-fp-card'; card2.dataset.postId = '2'; card2.dataset.ts = '3000';
    const card3 = document.createElement('div'); card3.className = 'smg-fp-card'; card3.dataset.postId = '3'; card3.dataset.ts = '2000';
    riverList.appendChild(card1);
    riverList.appendChild(card2);
    riverList.appendChild(card3);

    ensureRiverSorted();

    const sortedCards = Array.from(riverList.querySelectorAll('.smg-fp-card'));
    const sortedTs = sortedCards.map(c => +c.dataset.ts);
    assert(sortedTs[0] === 3000 && sortedTs[1] === 2000 && sortedTs[2] === 1000, `ensureRiverSorted deve reordenar cards para ordem decrescente estrita ([3000, 2000, 1000], obtido: [${sortedTs.join(', ')}])`);
    assert(window.__feedExports.riverLastTs === 1000, 'ensureRiverSorted deve atualizar riverLastTs para o timestamp do último card');

    // Testar sanitização defensiva em riverCard
    assert(typeof riverCard === 'function', 'riverCard deve ser função');
    assert(riverCard(null) === null, 'riverCard deve retornar null para entrada nula');
    assert(riverCard({ post_id: '', content_html: '<div class="bbWrapper">ok</div>' }) === null, 'riverCard deve retornar null para post sem post_id');
    assert(riverCard({ post_id: '120', content_html: '' }) === null, 'riverCard deve retornar null para post sem content_html');

    // 1. Caso threadTitle é "Editar" -> extrai slug da URL
    const cardEditar = riverCard({
        post_id: '123',
        thread_name: 'Editar',
        content_html: '<div class="bbWrapper">Texto do post</div>',
        permalink: 'https://forums.socialmediagirls.com/threads/minha-modelo-famosa.12345/post-999'
    }, 0);
    const titleEditar = cardEditar.querySelector('.smg-fp-tname').textContent;
    assert(titleEditar === 'minha modelo famosa', `riverCard deve sanitizar "Editar" usando slug da URL (obtido: "${titleEditar}")`);

    // 2. Caso threadTitle contém "Avisos..." vazado do header
    const cardAvisos = riverCard({
        post_id: '124',
        thread_name: 'Lett1Avisos We have a new domain whitelist, please request any domains missing here',
        content_html: '<div class="bbWrapper">Texto do post</div>',
        permalink: 'https://forums.socialmediagirls.com/threads/lett1.1111/'
    }, 0);
    const titleAvisos = cardAvisos.querySelector('.smg-fp-tname').textContent;
    assert(titleAvisos === 'Lett1', `riverCard deve remover "Avisos..." do título (obtido: "${titleAvisos}")`);

    // 3. Caso prefixesHtml com badges duplicadas
    const cardBadges = riverCard({
        post_id: '125',
        thread_name: 'Thread com Badges',
        content_html: '<div class="bbWrapper">Texto do post</div>',
        prefixes_html: '<a class="labelLink" href="/tags/brasil/"><span class="label label--blue">Brasil</span></a> <span class="label label--blue">Brasil</span> <span class="label label--purple">Twitch</span> <span class="label label--purple">Twitch</span>',
        permalink: 'https://forums.socialmediagirls.com/threads/badges.2222/'
    }, 0);
    const seenTexts = Array.from(cardBadges.querySelectorAll('.smg-fp-tags > *')).map(el => el.textContent.trim());
    assert(seenTexts.filter(t => t.toLowerCase() === 'brasil').length === 1, 'riverCard não deve duplicar badge Brasil');
    assert(seenTexts.filter(t => t.toLowerCase() === 'twitch').length === 1, 'riverCard não deve duplicar badge Twitch');

    console.log('Teste 1 concluído com sucesso!\n');

    // =========================================================================
    // TESTE 2: harvestPrefixesFromDoc extrai opções de <select name="c[prefixes][]">
    // =========================================================================
    console.log('--- TESTE 2: harvestPrefixesFromDoc ---');
    assert(window.__prefixExports !== undefined, 'window.__prefixExports deve estar exposto');
    const { harvestPrefixesFromDoc, globalPrefixMap } = window.__prefixExports;
    assert(typeof harvestPrefixesFromDoc === 'function', 'harvestPrefixesFromDoc deve ser função');
    assert(globalPrefixMap instanceof window.Map, 'globalPrefixMap deve ser uma instância de Map');

    const mockDocHtml = `<html><body>
        <form>
            <select name="c[prefixes][]">
                <option value="-1">Qualquer prefixo</option>
                <option value="42"> VIP Exclusive </option>
                <option value="88"> [MegaPack] </option>
                <option value="99"> #OnlyFans# </option>
                <option value="invalid">Texto Sem Id</option>
            </select>
            <select name="prefix_id[]">
                <option value="123">Premium</option>
            </select>
        </form>
    </body></html>`;

    const parser = new window.DOMParser();
    const mockDoc = parser.parseFromString(mockDocHtml, 'text/html');

    harvestPrefixesFromDoc(mockDoc);

    assert(globalPrefixMap.get('vip exclusive') === '42', 'Prefixo "vip exclusive" foi mapeado para ID "42"');
    assert(globalPrefixMap.get('megapack') === '88', 'Prefixo "megapack" foi limpo e mapeado para ID "88"');
    assert(globalPrefixMap.get('onlyfans') === '99', 'Prefixo "onlyfans" foi limpo e mapeado para ID "99"');
    assert(globalPrefixMap.get('premium') === '123', 'Prefixo "premium" de prefix_id[] foi mapeado para ID "123"');
    assert(!globalPrefixMap.has('qualquer prefixo'), 'Opção com valor -1 foi devidamente ignorada');
    assert(!globalPrefixMap.has('texto sem id'), 'Opção com valor não numérico foi ignorada');
    console.log('Teste 2 concluído com sucesso!\n');

    // =========================================================================
    // TESTE 3: paintResults filtra com badges ativas e caracteres limpos
    // =========================================================================
    console.log('--- TESTE 3: paintResults & Filtragem de Badges ---');
    assert(window.__dockSearchExports !== undefined, 'window.__dockSearchExports deve estar exposto');
    const { paintResults, activeSearchBadges, searchResultsEl } = window.__dockSearchExports;
    assert(typeof paintResults === 'function', 'paintResults deve ser função');
    assert(activeSearchBadges instanceof window.Set, 'activeSearchBadges deve ser um Set');
    assert(searchResultsEl instanceof window.HTMLElement, 'searchResultsEl deve ser um HTMLElement');

    // Criar mocks de itens de resultado de busca
    const makeLabel = (text) => {
        const el = document.createElement('span');
        el.className = 'label label--primary';
        el.textContent = text;
        return el;
    };

    const mockResults = [
        {
            title: 'Ana de Armas - Photoshoot 2026',
            href: 'https://forums.socialmediagirls.com/threads/1/',
            labels: [makeLabel('[VIP]'), makeLabel('Exclusive')]
        },
        {
            title: 'Emily Ratajkowski - Instagram Update',
            href: 'https://forums.socialmediagirls.com/threads/2/',
            labels: [makeLabel('# OnlyFans #')]
        },
        {
            title: 'Sydney Sweeney VIP set leaked',
            href: 'https://forums.socialmediagirls.com/threads/3/',
            labels: [] // Sem badge/label, mas tem 'VIP' no título (fallback)
        },
        {
            title: 'Generic Model Post',
            href: 'https://forums.socialmediagirls.com/threads/4/',
            labels: [makeLabel('Cosplay')]
        }
    ];

    // Cenário 3.1: Sem badges ativas -> Mostra todos os resultados
    activeSearchBadges.clear();
    paintResults(mockResults, 'https://forums.socialmediagirls.com/search/');
    let rendered = searchResultsEl.querySelectorAll('.smg-search-result');
    assert(rendered.length === 4, `Sem filtro: devem renderizar 4 resultados (renderizados: ${rendered.length})`);

    // Cenário 3.2: Filtrar por badge 'vip' (deve casar com '[VIP]' limpo e com título contendo 'VIP')
    activeSearchBadges.clear();
    activeSearchBadges.add('VIP');
    paintResults(mockResults, 'https://forums.socialmediagirls.com/search/');
    rendered = searchResultsEl.querySelectorAll('.smg-search-result');
    assert(rendered.length === 2, `Filtro 'VIP': devem casar 2 resultados (1 por label limpa, 1 por fallback no título; encontrados: ${rendered.length})`);

    // Cenário 3.3: Filtrar por badge 'onlyfans' (deve casar com '# OnlyFans #' limpo)
    activeSearchBadges.clear();
    activeSearchBadges.add('OnlyFans');
    paintResults(mockResults, 'https://forums.socialmediagirls.com/search/');
    rendered = searchResultsEl.querySelectorAll('.smg-search-result');
    assert(rendered.length === 1, `Filtro 'OnlyFans': deve casar 1 resultado com '# OnlyFans #' limpo (encontrados: ${rendered.length})`);

    // Cenário 3.4: Filtrar por badge inexistente -> Deve exibir mensagem de nenhum resultado
    activeSearchBadges.clear();
    activeSearchBadges.add('NaoExiste123');
    paintResults(mockResults, 'https://forums.socialmediagirls.com/search/');
    rendered = searchResultsEl.querySelectorAll('.smg-search-result');
    const emptyEl = searchResultsEl.querySelector('.smg-search-noresults');
    assert(rendered.length === 0, 'Filtro sem match: nenhum .smg-search-result exibido');
    assert(emptyEl !== null, 'Filtro sem match: mensagem de sem resultados exibida');

    // Cenário 3.5: Remoção de .smg-search-result-all ("Ver todos os resultados")
    activeSearchBadges.clear();
    paintResults(mockResults, 'https://forums.socialmediagirls.com/search/');
    const allBtn = searchResultsEl.querySelector('.smg-search-result-all');
    assert(allBtn === null, 'Botão .smg-search-result-all ("Ver todos os resultados") foi removido com sucesso');

    // Cenário 3.6: Estilos ancorados no topo e altura expandida do search
    const searchInjectedStyles = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');
    assert(searchInjectedStyles.includes('top: max(32px, 4vh);'), 'CSS deve definir top: max(32px, 4vh) para ancoragem de #smg-search-pop');
    assert(searchInjectedStyles.includes('transform: translateX(-50%) scale(0.98);'), 'CSS deve definir transform: translateX(-50%) scale(0.98) para #smg-search-pop');
    assert(searchInjectedStyles.includes('max-height: min(62vh, 560px) !important;'), 'CSS deve definir max-height: min(62vh, 560px) !important para os resultados de busca');
    assert(searchInjectedStyles.includes('width: 780px;'), 'CSS deve definir width: 780px para #smg-search-pop');
    assert(searchInjectedStyles.includes('.smg-search-sentinel'), 'CSS deve definir estilos para .smg-search-sentinel');
    assert(searchInjectedStyles.includes('.smg-search-sentinel.is-loading .smg-loading'), 'CSS deve definir exibição de .smg-loading quando o sentinel tem .is-loading');
    assert(searchInjectedStyles.includes('position: static !important;'), 'CSS deve definir position: static !important para spinner do sentinel');
    assert(searchInjectedStyles.includes('overflow: visible !important;'), 'CSS deve conter overflow: visible !important');
    assert(searchInjectedStyles.includes('min-height: fit-content !important;'), 'CSS deve definir min-height: fit-content !important na toolbar');
    assert(searchInjectedStyles.includes('flex-shrink: 0 !important;'), 'CSS deve definir flex-shrink: 0 !important na toolbar');

    // Cenário 3.7: Scroll Infinito, IntersectionObserver & Sentinel em paintResults
    const { loadMoreSearchResults, clearResults } = window.__dockSearchExports;
    assert(typeof loadMoreSearchResults === 'function', 'loadMoreSearchResults deve ser função');

    activeSearchBadges.clear();
    const nextPageUrl = 'https://forums.socialmediagirls.com/search/12345/?page=2';
    paintResults(mockResults, nextPageUrl);

    const sentinelEl = searchResultsEl.querySelector('.smg-search-sentinel');
    assert(sentinelEl !== null, 'Sentinel .smg-search-sentinel deve existir quando há próxima página');
    assert(sentinelEl.querySelector('.smg-loading') !== null, 'Sentinel deve conter o elemento .smg-loading');
    assert(!sentinelEl.classList.contains('is-loading'), 'Sentinel não deve ter .is-loading inicialmente');
    assert(typeof searchResultsEl.onscroll === 'function', 'onscroll deve estar registrado em searchResultsEl');
    assert(window.__dockSearchExports.searchSentinelIO !== null, 'searchSentinelIO deve estar inicializado');
    assert(window.__dockSearchExports.searchSentinelIO.elements.has(sentinelEl), 'searchSentinelIO deve estar observando sentinelEl');
    assert(window.__dockSearchExports.currentSearchNextUrl === nextPageUrl, 'currentSearchNextUrl deve conter o link da próxima página');

    const page2Html = `<!DOCTYPE html>
    <html><body>
        <div class="block-body">
            <div class="contentRow">
                <div class="contentRow-title"><a href="/threads/page2-thread.999/">Page 2 Infinite Thread</a></div>
                <div class="contentRow-snippet">Snippet from page 2</div>
                <div class="contentRow-minor">Today at 10:00 AM · Member</div>
            </div>
        </div>
    </body></html>`;

    const prevFetch = window.fetch;
    window.fetch = async (url, opts) => {
        if (typeof url === 'string' && url.includes('page=2')) {
            return {
                ok: true,
                status: 200,
                text: async () => page2Html,
                json: async () => ({}),
                url: url
            };
        }
        return prevFetch(url, opts);
    };

    await loadMoreSearchResults();

    const resultsAfterScroll = searchResultsEl.querySelectorAll('.smg-search-result');
    assert(resultsAfterScroll.length === 5, `Scroll infinito deve anexar resultados da página 2 (esperado 5, obtido: ${resultsAfterScroll.length})`);
    const page2Item = Array.from(resultsAfterScroll).find(el => el.textContent.includes('Page 2 Infinite Thread'));
    assert(page2Item !== undefined, 'Item da página 2 deve estar presente no DOM');
    assert(window.__dockSearchExports.currentSearchNextUrl === null, 'currentSearchNextUrl deve ser null quando a última página não tiver mais próximo link');
    assert(searchResultsEl.querySelector('.smg-search-sentinel') === null, 'Sentinel deve ser removido após término das páginas');
    assert(window.__dockSearchExports.searchSentinelIO === null, 'searchSentinelIO deve ser null após término das páginas');
    assert(searchResultsEl.onscroll === null, 'onscroll deve ser limpo após término das páginas');

    // Testar clearResults limpando estado e IntersectionObserver
    paintResults(mockResults, nextPageUrl);
    assert(window.__dockSearchExports.searchSentinelIO !== null, 'searchSentinelIO deve ser recriado com nova página');
    clearResults();
    assert(searchResultsEl.innerHTML === '', 'clearResults deve limpar o conteúdo de searchResultsEl');
    assert(window.__dockSearchExports.currentSearchNextUrl === null, 'clearResults deve zerar currentSearchNextUrl');
    assert(window.__dockSearchExports.searchSentinelIO === null, 'clearResults deve desconectar searchSentinelIO');

    window.fetch = prevFetch;

    console.log('Teste 3 concluído com sucesso!\n');

    // =========================================================================
    // TESTE 4: doSearch constrói campos corretamente para o XenForo
    // =========================================================================
    console.log('--- TESTE 4: doSearch & Montagem de Campos ---');
    const { doSearch, getSearchInput } = window.__dockSearchExports;
    assert(typeof doSearch === 'function', 'doSearch deve ser função');

    let lastFetchBody = null;
    window.fetch = async (url, opts) => {
        if (opts && opts.body) {
            lastFetchBody = opts.body;
        }
        return {
            ok: true,
            status: 200,
            text: async () => '<html><body><div class="block-body"></div></body></html>',
            json: async () => ({}),
            url: typeof url === 'string' ? url : (url && url.url) || ''
        };
    };

    // Caso 4.1: Badge com PID numérico conhecido ('vip exclusive' -> ID 42)
    const searchInp = getSearchInput();
    searchInp.value = 'photos';
    activeSearchBadges.clear();
    activeSearchBadges.add('VIP Exclusive');
    doSearch(false);
    let params = new URLSearchParams(lastFetchBody);
    assert(params.getAll('c[prefixes][]').includes('42'), 'Badge com PID deve enviar c[prefixes][] = 42');
    assert(!params.has('c[tags]'), 'NÃO deve enviar c[tags] para badges');

    // Caso 4.2: Badge sem PID numérico ('BadgeDesconhecida') -> fallback para keywords
    searchInp.value = 'photos';
    activeSearchBadges.clear();
    activeSearchBadges.add('BadgeDesconhecida');
    doSearch(false);
    params = new URLSearchParams(lastFetchBody);
    assert(!params.has('c[prefixes][]'), 'Badge sem PID NÃO deve enviar string para c[prefixes][]');
    assert(!params.has('c[tags]'), 'Badge sem PID NÃO deve enviar c[tags]');
    assert(params.get('keywords').includes('BadgeDesconhecida'), 'Badge sem PID deve agregar nome em keywords como fallback');

    // Caso 4.3: Keywords vazio com badge com PID -> adiciona search_type=thread
    searchInp.value = '';
    activeSearchBadges.clear();
    activeSearchBadges.add('VIP Exclusive');
    doSearch(false);
    params = new URLSearchParams(lastFetchBody);
    assert(params.getAll('c[prefixes][]').includes('42'), 'c[prefixes][] enviado com 42');
    assert(params.get('search_type') === 'thread', 'Quando keywords vazio mas há PID, deve adicionar search_type=thread');

    console.log('Teste 4 concluído com sucesso!\n');

    // =========================================================================
    // TESTE 5: Bookmarks (bmParseRows com posts/tópicos e setupBookmarksFeed)
    // =========================================================================
    console.log('--- TESTE 5: Bookmarks (Feed & Rows) ---');
    assert(window.__bookmarkExports !== undefined, 'window.__bookmarkExports deve estar exposto');
    const { setupBookmarksFeed, bmParseRows } = window.__bookmarkExports;
    assert(typeof setupBookmarksFeed === 'function', 'setupBookmarksFeed deve ser função');
    assert(typeof bmParseRows === 'function', 'bmParseRows deve ser função');

    // 5.1 bmParseRows deve extrair bookmarks de posts e tópicos
    const mockBmHtml = `<html><body>
        <div class="contentRow">
            <h3 class="contentRow-title"><a href="/posts/987654/">Post Bookmark Title</a></h3>
            <div class="contentRow-minor"><a class="username" href="/members/user1/">User 1</a><time data-timestamp="1700000000"></time></div>
            <div class="contentRow-snippet">Post Note</div>
        </div>
        <div class="contentRow">
            <h3 class="contentRow-title"><a href="/threads/my-awesome-thread.12345/">Thread Bookmark Title</a></h3>
            <div class="contentRow-minor"><a class="username" href="/members/user2/">User 2</a><time data-timestamp="1700001000"></time></div>
            <div class="contentRow-snippet">Thread Note</div>
        </div>
        <div class="contentRow">
            <h3 class="contentRow-title"><a href="/invalid-link/">Sem ID</a></h3>
        </div>
    </body></html>`;
    const bmDoc = parser.parseFromString(mockBmHtml, 'text/html');
    const parsedRows = bmParseRows(bmDoc);
    assert(parsedRows.length === 2, `bmParseRows deve extrair 2 bookmarks válidos (extraídos: ${parsedRows.length})`);
    assert(parsedRows[0].postId === '987654', 'Primeiro bookmark é do post 987654');
    assert(parsedRows[0].postUrl.includes('/posts/987654/'), 'postUrl do post aponta para /posts/987654/');
    assert(parsedRows[1].postId === 't-12345', 'Segundo bookmark é do tópico t-12345');
    assert(parsedRows[1].postUrl.includes('12345'), 'postUrl do tópico contém o ID 12345');

    // 5.1.1 bmParseRows deve ignorar links de edição (.contentRow-extra) e extrair título real de .contentRow-header
    const mockXf22BmHtml = `<html><body>
        <div class="contentRow">
            <div class="contentRow-extra">
                <a href="/posts/777888/bookmark-edit">Editar</a>
                <a href="/posts/777888/bookmark-delete">Excluir</a>
            </div>
            <div class="contentRow-main">
                <h3 class="contentRow-header"><a href="/posts/777888/">Post in thread 'Título Real do Post'</a></h3>
                <div class="contentRow-minor"><a class="username" href="/members/user3/">User 3</a><time data-timestamp="1700002000"></time></div>
                <div class="contentRow-snippet">Nota importante</div>
            </div>
        </div>
    </body></html>`;
    const bmDoc22 = parser.parseFromString(mockXf22BmHtml, 'text/html');
    const parsedXf22 = bmParseRows(bmDoc22);
    assert(parsedXf22.length === 1, 'bmParseRows deve extrair exatamente 1 bookmark de HTML do XenForo 2.2');
    assert(parsedXf22[0].postId === '777888', 'PostId extraído corretamente');
    assert(parsedXf22[0].title === 'Título Real do Post', `Título deve ser "Título Real do Post" e NÃO "Editar" (obtido: "${parsedXf22[0].title}")`);
    assert(parsedXf22[0].postUrl.includes('/posts/777888/') && !parsedXf22[0].postUrl.includes('bookmark-edit'), 'postUrl aponta para o post e não para bookmark-edit');

    // 5.1.2 bmParseRows ignora <a class="contentRow-badge">Tópico</a> e links de edição
    const mockPtBmHtml = `<html><body>
        <div class="contentRow">
            <div class="contentRow-main">
                <h3 class="contentRow-header">
                    <a class="contentRow-badge" href="/account/bookmarks?type=thread">Tópico</a>
                    <a href="/threads/modelo-brasileira.554433/">Modelo Brasileira 2026</a>
                </h3>
                <div class="contentRow-minor">
                    <a class="username" href="/members/user4/">User 4</a>
                    <time data-timestamp="1700003000"></time>
                </div>
                <div class="contentRow-snippet">Nota importante sobre a modelo</div>
            </div>
            <div class="contentRow-extra">
                <a href="/bookmarks/123/edit">Editar</a>
            </div>
        </div>
    </body></html>`;
    const bmDocPt = parser.parseFromString(mockPtBmHtml, 'text/html');
    const parsedPt = bmParseRows(bmDocPt);
    assert(parsedPt.length === 1, 'bmParseRows deve extrair exatamente 1 bookmark de HTML com badge "Tópico"');
    assert(parsedPt[0].postId === 't-554433', 'bmParseRows deve identificar como tópico t-554433');
    assert(parsedPt[0].title === 'Modelo Brasileira 2026', `bmParseRows deve ignorar badge "Tópico" e extrair o título real (obtido: "${parsedPt[0].title}")`);
    assert(!parsedPt[0].postUrl.includes('/account/bookmarks'), 'postUrl não deve apontar para /account/bookmarks');
    assert(!parsedPt[0].postUrl.includes('/edit'), 'postUrl não deve apontar para link de edição');

    // 5.1.3 O XenForo pode apontar o item salvo para a ação /bookmark; o feed precisa buscar o post real
    const mockBookmarkActionHtml = `<html><body>
        <div class="contentRow">
            <h3 class="contentRow-title"><a href="/posts/7540126/bookmark">Tópico</a></h3>
            <div class="contentRow-minor"><a class="username" href="/members/f1111ck.2762614/">F1111CK</a><time data-timestamp="1788078364"></time></div>
            <div class="contentRow-snippet">name please</div>
        </div>
    </body></html>`;
    const bmActionDoc = parser.parseFromString(mockBookmarkActionHtml, 'text/html');
    const parsedAction = bmParseRows(bmActionDoc);
    assert(parsedAction.length === 1, 'bmParseRows deve extrair bookmark apontando para a ação /bookmark');
    assert(parsedAction[0].postId === '7540126', 'Bookmark /bookmark deve manter o ID do post');
    assert(parsedAction[0].postUrl === 'https://forums.socialmediagirls.com/posts/7540126/', 'Bookmark /bookmark deve normalizar para a URL real do post');

    // 5.2 setupBookmarksFeed substitui .p-body-content e oculta nativos
    const existingMain = document.querySelector('.p-body-main');
    if (existingMain) existingMain.remove();

    const bmContainer = document.createElement('div');
    bmContainer.className = 'p-body-main p-body-main--withSideNav';
    bmContainer.innerHTML = `
        <div class="p-body-sideNav">
            <div class="block">SideNav Nav</div>
        </div>
        <div class="p-body-content">
            <div class="tabs">Tabs</div>
            <div class="block-filterBar">FilterBar</div>
            <div class="block">Native Bookmarks List</div>
            <div class="pageNavWrapper">PageNav</div>
        </div>
    `;
    document.body.appendChild(bmContainer);

    document.documentElement.setAttribute('data-template', 'account_bookmarks');
    window.__bookmarkExports.bmBuilt = false;

    setupBookmarksFeed();

    const sideNavBlock = bmContainer.querySelector('.p-body-sideNav .block');
    assert(sideNavBlock !== null, 'SideNav block continua existindo');
    assert(!bmContainer.querySelector('.p-body-sideNav #smg-bm-feed'), 'SideNav NÃO deve conter #smg-bm-feed');

    const contentCol = bmContainer.querySelector('.p-body-content');
    const feedInContent = contentCol.querySelector('#smg-bm-feed');
    assert(feedInContent !== null, '#smg-bm-feed deve ser inserido dentro de .p-body-content');

    const hiddenNativeBlocks = contentCol.querySelectorAll('.block, .tabs, .block-filterBar, .pageNavWrapper');
    let allHidden = true;
    hiddenNativeBlocks.forEach(el => {
        if (el.style.display !== 'none') allHidden = false;
    });
    assert(allHidden, 'Todos os blocos nativos dentro de .p-body-content foram ocultados com display: none');
    assert(document.documentElement.classList.contains('smg-bm-feed-on'), 'Classe smg-bm-feed-on adicionada ao html');

    // 5.3 bmFallbackPost gera objeto válido com dados de row e fallback de conteúdo
    const { bmFallbackPost, bmFetchPost } = window.__bookmarkExports;
    assert(typeof bmFallbackPost === 'function', 'bmFallbackPost deve ser uma função');

    const rowWithNote = {
        postId: '555',
        bmTs: 1710000000,
        title: 'Bookmark Title',
        author: 'UserNote',
        authorHref: '/members/usernote.5/',
        thumb: 'https://example.com/thumb.jpg',
        note: 'Minha nota especial',
        postUrl: 'https://example.com/posts/555/'
    };
    const fallbackObj1 = bmFallbackPost(rowWithNote);
    assert(fallbackObj1.post_id === '555', 'Fallback possui post_id correto');
    assert(fallbackObj1.created_at === 1710000000, 'Fallback possui timestamp correto');
    assert(fallbackObj1.thread_name === 'Bookmark Title', 'Fallback possui thread_name');
    assert(fallbackObj1.content_html.includes('smg-bm-fallback-text') && !fallbackObj1.content_html.includes('smg-bm-note-body'), 'Fallback NÃO duplica a nota dentro de content_html');

    const rowWithoutNote = {
        postId: '666',
        title: 'Thread Title Without Note',
        postUrl: 'https://example.com/threads/666/'
    };
    const fallbackObj2 = bmFallbackPost(rowWithoutNote);
    assert(fallbackObj2.content_html.includes('smg-bm-fallback-text') && fallbackObj2.content_html.includes('https://example.com/threads/666/'), 'Fallback sem nota contém link em .smg-bm-fallback-text');

    // bmFetchPost retorna fallback ao invés de null quando post não existe no doc
    const fetchResult = await bmFetchPost({ postId: '99999', postUrl: 'https://example.com/posts/99999/', title: 'Missing Post', note: 'Nota existente' });
    assert(fetchResult !== null && typeof fetchResult === 'object', 'bmFetchPost deve retornar objeto de fallback em caso de erro/post ausente (nunca null)');
    assert(fetchResult.post_id === '99999', 'Objeto de fallback retornado por bmFetchPost contém post_id');

    // 5.4 Salvo em cache no formato antigo (camelCase) continua renderizando sem refetch
    const { bmCardFromRec } = window.__bookmarkExports;
    const legacyCard = bmCardFromRec({ postId: '4242', note: '', bmTs: 1, obj: { postId: '4242', ts: 1700000000, author: 'Old', authorHref: '', threadTitle: 'Legacy Thread', prefixesHtml: '', threadThumb: '', permalink: 'https://example.com/posts/4242/', contentHtml: '<div class="bbWrapper">legacy body</div>' } });
    assert(legacyCard && legacyCard.querySelector('.smg-fp-tname').textContent === 'Legacy Thread', 'Salvo no formato antigo deve renderizar o título do tópico');
    assert(legacyCard.querySelector('.smg-fp-content').textContent.includes('legacy body'), 'Salvo no formato antigo deve renderizar o conteúdo');

    // 5.5 Salvos não aplicam o filtro de tags do feed (discussion/off-topic/ajuda continuam visíveis)
    ['Discussion', 'Off-Topic', 'Ajuda'].forEach(tag => {
        let tagged = null;
        try {
            tagged = bmCardFromRec({ postId: 'tag-' + tag, note: '', bmTs: 1, obj: { post_id: 'tag-' + tag, created_at: 1700000000, author: 'A', author_href: '', thread_name: 'Tagged ' + tag, prefixes_html: '<span class="label">' + tag + '</span>', thread_thumb: '', permalink: 'https://example.com/posts/1/', content_html: '<div class="bbWrapper">tagged body</div>' } });
        } catch (e) { tagged = null; }
        assert(tagged && tagged.querySelector('.smg-fp-content'), 'Salvo com a tag "' + tag + '" deve renderizar um card');
    });

    // 5.4 Testar as propriedades de largura 100% do #smg-bm-feed no CSS injetado
    const styleEls = Array.from(document.querySelectorAll('style'));
    const combinedCss = styleEls.map(s => s.textContent).join('\n');
    assert(combinedCss.includes('#smg-bm-feed'), 'CSS injetado contém regras para #smg-bm-feed');
    assert(/#smg-bm-feed\s*\{[^}]*width:\s*100%\s*!important/i.test(combinedCss), '#smg-bm-feed possui width: 100% !important');
    assert(/#smg-bm-feed\s*\{[^}]*max-width:\s*100%\s*!important/i.test(combinedCss), '#smg-bm-feed possui max-width: 100% !important');
    assert(/#smg-bm-feed\s*\{[^}]*margin:\s*0\s*!important/i.test(combinedCss), '#smg-bm-feed possui margin: 0 !important');
    assert(/html\.smg-bm-feed-on \.p-body-main[^}]*width:\s*100%\s*!important/i.test(combinedCss), 'html.smg-bm-feed-on .p-body-main possui width: 100% !important');
    assert(/html\.smg-bm-feed-on \.p-body-content[^}]*width:\s*100%\s*!important/i.test(combinedCss), 'html.smg-bm-feed-on .p-body-content possui width: 100% !important');

    console.log('Teste 5 concluído com sucesso!\n');

    // =========================================================================
    // TESTE 6: extractCleanTitleAndPrefixes (Remoção de Avisos & Deduplicação de Badges)
    // =========================================================================
    console.log('--- TESTE 6: extractCleanTitleAndPrefixes ---');
    const extractCleanTitleAndPrefixes = window.__extractCleanTitleAndPrefixes;
    assert(typeof extractCleanTitleAndPrefixes === 'function', 'extractCleanTitleAndPrefixes deve ser função');

    // 6.1 Remove avisos injetados (.smg-notices) e limpa título
    const titleContainer1 = document.createElement('h1');
    titleContainer1.className = 'p-title-value';
    titleContainer1.innerHTML = `
        <a class="labelLink" href="/tags/brasil/"><span class="label label--blue">Brasil</span></a>
        <a class="labelLink" href="/tags/brasil/"><span class="label label--blue">Brasil</span></a>
        <span class="label label--blue">Brasil</span>
        <a class="labelLink" href="/tags/twitch/"><span class="label label--purple">Twitch</span></a>
        <span class="label label--purple">Twitch</span>
        Nome da Modelo Famosa
        <div class="smg-notices">
            <button type="button" class="smg-notices-btn">
                <span class="smg-notices-ico"><svg></svg></span>
                <span class="smg-notices-badge">1</span>
            </button>
            <div class="smg-notices-pop">
                <div class="smg-notices-head">Avisos</div>
                <div class="smg-notices-body">We have a new domain whitelist, please request any domains missing here</div>
            </div>
        </div>
        <div class="p-title-pageAction"><button class="button">Watch</button></div>
    `;

    const res1 = extractCleanTitleAndPrefixes(titleContainer1);
    assert(res1.title === 'Nome da Modelo Famosa', `Título deve ser limpo de notices e botões (obtido: "${res1.title}")`);
    assert(!res1.title.includes('Avisos'), 'Título não deve conter texto de Avisos');
    assert(!res1.title.includes('domain whitelist'), 'Título não deve conter o conteúdo do notice');

    // Verifica que badges foram deduplicadas no HTML de prefixos gerado
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = res1.prefixesHtml;
    const labelsExtracted = Array.from(tempDiv.children).map(c => c.textContent.trim());
    assert(labelsExtracted.filter(t => t.toLowerCase() === 'brasil').length === 1, 'Deve conter exatamente 1 badge Brasil (sem duplicatas)');
    assert(labelsExtracted.filter(t => t.toLowerCase() === 'twitch').length === 1, 'Deve conter exatamente 1 badge Twitch (sem duplicatas)');

    // 6.2 Limpeza de prefixos acidentais "Post in thread '...'" e aspas
    const titleContainer2 = document.createElement('h3');
    titleContainer2.className = 'contentRow-header';
    titleContainer2.innerHTML = `<a href="/posts/1/">Post in thread 'Título Entre Aspas'</a>`;
    const res2 = extractCleanTitleAndPrefixes(titleContainer2);
    assert(res2.title === 'Título Entre Aspas', `Título deve remover "Post in thread" e aspas (obtido: "${res2.title}")`);

    // 6.3 structItemTs NÃO deve capturar a data de criação do tópico (.structItem-startDate time)
    const structItemTs = window.__structItemTs;
    assert(typeof structItemTs === 'function', 'structItemTs deve ser função');
    const threadRowEl = document.createElement('div');
    threadRowEl.className = 'structItem structItem--thread';
    threadRowEl.innerHTML = `
        <div class="structItem-cell structItem-cell--main">
            <li class="structItem-startDate">
                <time datetime="2021-05-10T12:00:00Z" data-timestamp="1620648000">May 10, 2021</time>
            </li>
        </div>
        <div class="structItem-cell structItem-cell--latest">
            <a href="/threads/exemplo.123/latest">
                <time class="structItem-latestDate" datetime="2026-09-04T05:00:00Z" data-timestamp="1788498000">Today at 5:00 AM</time>
            </a>
        </div>
    `;
    const extractedLatestTs = structItemTs(threadRowEl);
    assert(extractedLatestTs === 1788498000, `structItemTs DEVE retornar o timestamp do último post (1788498000), e NÃO a data de criação de 2021 (1620648000). Obtido: ${extractedLatestTs}`);

    // 6.4 Limpeza de prefixos acidentais em português ("Mensagem no tópico", "Post no tópico", "Tópico", "Mensagem")
    const titleContainerPt1 = document.createElement('h3');
    titleContainerPt1.className = 'contentRow-header';
    titleContainerPt1.innerHTML = `<a href="/posts/2/">Mensagem no tópico 'Bruna Marquezine 2026'</a>`;
    const resPt1 = extractCleanTitleAndPrefixes(titleContainerPt1);
    assert(resPt1.title === 'Bruna Marquezine 2026', `Deve remover "Mensagem no tópico" (obtido: "${resPt1.title}")`);

    const titleContainerPt2 = document.createElement('h3');
    titleContainerPt2.className = 'contentRow-header';
    titleContainerPt2.innerHTML = `<a href="/posts/3/">Post no tópico 'Anitta Vacation'</a>`;
    const resPt2 = extractCleanTitleAndPrefixes(titleContainerPt2);
    assert(resPt2.title === 'Anitta Vacation', `Deve remover "Post no tópico" (obtido: "${resPt2.title}")`);

    const titleContainerPt3 = document.createElement('h3');
    titleContainerPt3.className = 'contentRow-header';
    titleContainerPt3.innerHTML = `<a href="/threads/4/">Tópico 'Grazi Massafera'</a>`;
    const resPt3 = extractCleanTitleAndPrefixes(titleContainerPt3);
    assert(resPt3.title === 'Grazi Massafera', `Deve remover "Tópico" (obtido: "${resPt3.title}")`);

    // =========================================================================
    // TESTE 7: Nova Arquitetura de Sync da Timeline (Regras A, B, C e D), Deduplicação e Preservação de followed
    // =========================================================================
    console.log('--- TESTE 7: Nova Arquitetura de Sync & Preservação da Tabela followed ---');
    assert(window.__feedSyncExports !== undefined, 'window.__feedSyncExports deve estar exposto');
    const { decideThreadFetch } = window.__feedSyncExports;
    assert(typeof decideThreadFetch === 'function', 'decideThreadFetch deve ser função');

    // 7.1 Regra A: Novo/Sem páginas extraídas (maxSaved === 0) -> marcado para busca da última página
    const threadA = {
        path: '/threads/novo-topico.1111/',
        thread_name: 'Novo Tópico',
        last_page: 5,
        saved_pages: [],
        updated_at: 1000,
        last_sync_at: 0
    };
    const decisionA = decideThreadFetch(threadA, 2000);
    assert(decisionA !== null, 'Regra A: Tópico com maxSaved === 0 deve ser marcado para busca');
    assert(decisionA.targetPage === 5, 'Regra A: targetPage deve ser a última página (5)');
    assert(decisionA.reason === 'new', 'Regra A: reason deve ser "new"');

    // 7.2 Regra B: Nova página criada (lastPage > maxSaved) -> marcado para busca
    const threadB = {
        path: '/threads/topico-com-nova-pagina.2222/',
        thread_name: 'Tópico Nova Página',
        last_page: 4,
        saved_pages: [1, 2, 3],
        updated_at: 1500,
        last_sync_at: 1000
    };
    const decisionB = decideThreadFetch(threadB, 2000);
    assert(decisionB !== null, 'Regra B: Tópico com lastPage > maxSaved deve ser marcado para busca');
    assert(decisionB.targetPage === 4, 'Regra B: targetPage deve ser a última página (4)');
    assert(decisionB.reason === 'newPage', 'Regra B: reason deve ser "newPage"');

    // 7.3 Regra C: Última página coincide mas há novos posts (updated_at > lastTimelineRunTs) -> re-busca da última página
    const threadC1 = {
        path: '/threads/topico-mesma-pagina-recente.3333/',
        thread_name: 'Tópico Mesma Página Recente',
        last_page: 3,
        saved_pages: [1, 2, 3],
        updated_at: 2500,
        last_sync_at: 1000
    };
    const decisionC1 = decideThreadFetch(threadC1, 2000);
    assert(decisionC1 !== null, 'Regra C: Tópico com lastPage === maxSaved e updated_at > lastTimelineRunTs deve ser marcado para re-busca');
    assert(decisionC1.targetPage === 3, 'Regra C: targetPage deve ser a última página (3)');
    assert(decisionC1.reason === 'updatedPage', 'Regra C: reason deve ser "updatedPage"');

    // 7.3.1 Regra C (variante): updated_at > last_sync_at
    const threadC2 = {
        path: '/threads/topico-mesma-pagina-sync.4444/',
        thread_name: 'Tópico Sync Recente',
        last_page: 2,
        saved_pages: [1, 2],
        updated_at: 1800,
        last_sync_at: 1500
    };
    const decisionC2 = decideThreadFetch(threadC2, 2000);
    assert(decisionC2 !== null, 'Regra C: Tópico com updated_at > last_sync_at deve ser marcado para re-busca');
    assert(decisionC2.targetPage === 2, 'Regra C: targetPage deve ser a última página (2)');
    assert(decisionC2.reason === 'updatedPage', 'Regra C: reason deve ser "updatedPage"');

    // 7.4 Regra D: Sem novidades (lastPage === maxSaved e updated_at <= lastTimelineRunTs && <= last_sync_at) -> PULA
    const threadD = {
        path: '/threads/topico-sem-novidades.5555/',
        thread_name: 'Tópico Sem Novidades',
        last_page: 2,
        saved_pages: [1, 2],
        updated_at: 1500,
        last_sync_at: 1600
    };
    const decisionD = decideThreadFetch(threadD, 2000);
    assert(decisionD === null, 'Regra D: Tópico sem novidades deve retornar null (pula, 0 requisições)');

    // 7.4.1 Regra E: Tópico marcado como unread -> marcado para busca mesmo com timestamps antigos
    const threadUnread = {
        path: '/threads/topico-unread.6666/',
        thread_name: 'Tópico Unread',
        last_page: 2,
        saved_pages: [1, 2],
        updated_at: 1000,
        last_sync_at: 1500,
        unread: true
    };
    const decisionUnread = decideThreadFetch(threadUnread, 2000);
    assert(decisionUnread !== null, 'Tópico com unread === true deve ser marcado para busca');
    assert(decisionUnread.targetPage === 2, 'Tópico unread targetPage deve ser a última página (2)');
    assert(decisionUnread.reason === 'unread', 'Tópico unread reason deve ser "unread"');

    // 7.5 Deduplicação de posts no DOM e riverSeen
    const { insertFreshPosts } = window.__feedExports;
    assert(typeof insertFreshPosts === 'function', 'insertFreshPosts deve ser função');
    window.__feedExports.riverSeen = new Set();
    riverList.innerHTML = '';

    const testPosts = [
        { post_id: '8001', created_at: 1000, content_html: 'Post 1' },
        { post_id: '8001', created_at: 1000, content_html: 'Post 1 Duplicado' },
        { post_id: '8002', created_at: 2000, content_html: 'Post 2' }
    ];
    insertFreshPosts(testPosts);
    let cardsInDom = riverList.querySelectorAll('.smg-fp-card');
    assert(cardsInDom.length === 2, `insertFreshPosts deve deduplicar posts (esperado: 2, obtido: ${cardsInDom.length})`);
    assert(window.__feedExports.riverSeen.has('8001'), 'riverSeen registrou post 8001');
    assert(window.__feedExports.riverSeen.has('8002'), 'riverSeen registrou post 8002');

    // Chamar de novo com post 8001 -> deve ser ignorado pelo riverSeen
    window.__feedExports.riverSeen.clear();
    insertFreshPosts([{ post_id: '8001', created_at: 1000, contentHtml: 'Post 1 de novo' }]);
    assert(riverList.querySelectorAll('.smg-fp-card').length === 2, 'insertFreshPosts ignora post repetido já presente no riverSeen');

    // Limpar riverSeen mas manter o card no DOM -> deve ser ignorado pelo DOM check
    window.__feedExports.riverSeen.clear();
    insertFreshPosts([{ post_id: '8001', created_at: 1000, contentHtml: 'Post 1 DOM check' }]);
    assert(riverList.querySelectorAll('.smg-fp-card').length === 2, 'insertFreshPosts ignora post com mesmo data-post-id já presente no DOM');

    // 7.6 Preservação da tabela followed em dbClearAllData e fdbEnsureVersion + Reset de saved_pages e last_sync_at
    assert(window.__feedDbExports !== undefined, 'window.__feedDbExports deve estar exposto');
    const { dbClearAllData, dbFollowedUpsert, dbTimelinePutPosts, dbMetaSet, fdbEnsureVersion, fdbResetSyncMarks } = window.__feedDbExports;
    assert(typeof dbClearAllData === 'function', 'dbClearAllData deve ser função');
    assert(typeof fdbResetSyncMarks === 'function', 'fdbResetSyncMarks deve ser função');

    // Inserir dados nas tabelas
    await dbFollowedUpsert({
        path: '/threads/modelo-preservada.9999/',
        thread_name: 'Modelo Preservada',
        saved_pages: [1, 2],
        last_page: 2,
        last_sync_at: 12345
    });
    await dbTimelinePutPosts([
        { post_id: 'tp-100', created_at: 1000, thread_path: '/threads/modelo-preservada.9999/' }
    ]);
    await dbMetaSet('lastSync', 55555);
    await dbMetaSet('lastTimelineRunTs', 88888);

    assert(mockStorage.followed.has('/threads/modelo-preservada.9999/'), 'Tópico seguido foi inserido na store followed');
    assert(mockStorage.timeline.has('tp-100'), 'Post foi inserido na store timeline');
    assert(mockStorage.meta.has('lastSync'), 'Meta lastSync foi inserido');
    assert(mockStorage.meta.has('lastTimelineRunTs'), 'Meta lastTimelineRunTs foi inserido');

    // Executar dbClearAllData
    await dbClearAllData();

    assert(mockStorage.followed.has('/threads/modelo-preservada.9999/'), 'dbClearAllData DEVE PRESERVAR os tópicos da tabela followed!');
    assert(mockStorage.followed.size === 1, 'Tabela followed não teve seus registros apagados');
    const followedAfterClear = mockStorage.followed.get('/threads/modelo-preservada.9999/');
    assert(Array.isArray(followedAfterClear.saved_pages) && followedAfterClear.saved_pages.length === 0, 'dbClearAllData deve resetar saved_pages para []');
    assert(followedAfterClear.last_sync_at === 0, 'dbClearAllData deve resetar last_sync_at para 0');
    assert(mockStorage.timeline.size === 0, 'dbClearAllData deve limpar a tabela timeline');
    assert(!mockStorage.meta.has('lastSync'), 'dbClearAllData deve limpar meta tags da timeline');
    assert(!mockStorage.meta.has('lastTimelineRunTs'), 'dbClearAllData deve limpar lastTimelineRunTs da store meta');

    // Executar fdbResetSyncMarks
    await dbFollowedUpsert({
        path: '/threads/modelo-preservada.9999/',
        thread_name: 'Modelo Preservada',
        saved_pages: [1, 2],
        last_page: 2,
        last_sync_at: 12345
    });
    await dbMetaSet('lastTimelineRunTs', 88888);
    assert(mockStorage.meta.has('lastTimelineRunTs'), 'Meta lastTimelineRunTs foi inserido para teste do fdbResetSyncMarks');
    await fdbResetSyncMarks();
    assert(!mockStorage.meta.has('lastTimelineRunTs'), 'fdbResetSyncMarks deve limpar lastTimelineRunTs da store meta');
    const followedAfterReset = mockStorage.followed.get('/threads/modelo-preservada.9999/');
    assert(Array.isArray(followedAfterReset.saved_pages) && followedAfterReset.saved_pages.length === 0, 'fdbResetSyncMarks deve resetar saved_pages para []');
    assert(followedAfterReset.last_sync_at === 0, 'fdbResetSyncMarks deve resetar last_sync_at para 0');

    // Executar fdbEnsureVersion
    await fdbEnsureVersion(99);
    assert(mockStorage.followed.has('/threads/modelo-preservada.9999/'), 'fdbEnsureVersion DEVE PRESERVAR a tabela followed!');

    console.log('Teste 7 concluído com sucesso!\n');

    // --- TESTE 8: Ingestão de /watched/threads no followed, Sync 100% via IndexedDB (sem /watched/threads) & Background Cron ---
    console.log('--- TESTE 8: Ingestão de /watched/threads no followed & Sync 100% via IndexedDB ---');
    const {
        cronRefreshFollowedAndTimeline,
        startTimelineCron,
        syncTimeline
    } = window.__feedSyncExports;

    assert(typeof cronRefreshFollowedAndTimeline === 'function', 'cronRefreshFollowedAndTimeline deve ser função');
    assert(typeof startTimelineCron === 'function', 'startTimelineCron deve ser função');
    assert(typeof syncTimeline === 'function', 'syncTimeline deve ser função');
    assert(window.__filterbarExports !== undefined, 'window.__filterbarExports deve estar exposto');
    const { ingestWatchedPageToFollowed } = window.__filterbarExports;
    assert(typeof ingestWatchedPageToFollowed === 'function', 'ingestWatchedPageToFollowed deve ser função');

    // 8.1 Evitar concorrência com flag isCronRunning
    window.__feedSyncExports.isCronRunning = true;
    const concurrentRun = await cronRefreshFollowedAndTimeline();
    assert(concurrentRun === 0, 'cronRefreshFollowedAndTimeline deve retornar 0 quando isCronRunning é true');
    window.__feedSyncExports.isCronRunning = false;

    // 8.2 Mock do fetch com contador para garantir que /watched/threads NUNCA é chamado pela timeline ou cron
    let watchedThreadsFetchCount = 0;
    let topicPagesFetchCount = 0;
    const originalFetch = window.fetch;
    window.fetch = async (url, opts) => {
        const urlStr = typeof url === 'string' ? url : (url && url.url) || '';
        if (urlStr.includes('/watched/threads')) {
            watchedThreadsFetchCount++;
            return {
                ok: true,
                status: 200,
                text: async () => `<html><body></body></html>`,
                json: async () => ({}),
                url: urlStr
            };
        }
        if (urlStr.includes('/threads/')) {
            topicPagesFetchCount++;
            const m = urlStr.match(/\/threads\/([^/]+)\.(\d+)/);
            const slug = m ? m[1] : 'thread';
            const tid = m ? m[2] : '1';
            return {
                ok: true,
                status: 200,
                text: async () => `<html><body>
                    <h1 class="p-title-value">${slug}</h1>
                    <article class="message message--post" id="js-post-${tid}01" data-content="post-${tid}01">
                        <span class="u-anchorTarget" id="post-${tid}01"></span>
                        <div class="message-inner">
                            <div class="message-cell message-cell--user">
                                <a class="username" href="/members/user-${tid}.1/">User ${tid}</a>
                            </div>
                            <div class="message-cell message-cell--main">
                                <div class="message-content">
                                    <div class="message-userContent">Conteúdo novidade de ${slug}</div>
                                </div>
                            </div>
                            <div class="message-attribution">
                                <time data-timestamp="9500">Agora</time>
                            </div>
                        </div>
                    </article>
                </body></html>`,
                json: async () => ({}),
                url: urlStr
            };
        }
        return originalFetch(url, opts);
    };

    // 8.3 Estado prévio: tópicos antigos no IndexedDB com updated_at desatualizado
    mockStorage.followed.set('/threads/ashley-tervort.1111/', {
        path: '/threads/ashley-tervort.1111/',
        thread_name: 'Ashley Tervort',
        saved_pages: [1],
        last_page: 1,
        updated_at: 1000,
        last_sync_at: 1000
    });
    mockStorage.followed.set('/threads/lumineiia.2222/', {
        path: '/threads/lumineiia.2222/',
        thread_name: 'Lumineiia',
        saved_pages: [1, 2],
        last_page: 2,
        updated_at: 1200,
        last_sync_at: 1200
    });
    mockStorage.followed.set('/threads/lien-sue.3333/', {
        path: '/threads/lien-sue.3333/',
        thread_name: 'Lien Sue',
        saved_pages: [1],
        last_page: 1,
        updated_at: 800,
        last_sync_at: 800
    });

    // 8.4 Testar ingestWatchedPageToFollowed(doc) populando e atualizando a tabela followed a partir do DOM de /watched/threads
    const watchedHtml = `<html><body>
        <div class="structItem structItem--thread">
            <div class="structItem-title">
                <a href="/threads/ashley-tervort.1111/">Ashley Tervort</a>
            </div>
            <div class="structItem-pageJump">
                <a href="/threads/ashley-tervort.1111/page-2">2</a>
            </div>
            <div class="structItem-cell--latest">
                <time data-timestamp="9500">Hoje às 19:15</time>
            </div>
        </div>
        <div class="structItem structItem--thread">
            <div class="structItem-title">
                <a href="/threads/lumineiia.2222/">Lumineiia</a>
            </div>
            <div class="structItem-pageJump">
                <a href="/threads/lumineiia.2222/page-2">2</a>
            </div>
            <div class="structItem-cell--latest">
                <time data-timestamp="9000">Hoje às 18:45</time>
            </div>
        </div>
        <div class="structItem structItem--thread">
            <div class="structItem-title">
                <a href="/threads/lien-sue.3333/">Lien Sue</a>
            </div>
            <div class="structItem-cell--latest">
                <time data-timestamp="8500">Hoje às 18:30</time>
            </div>
        </div>
    </body></html>`;
    const watchedDoc = new JSDOM(watchedHtml).window.document;

    const ingestedCount = await ingestWatchedPageToFollowed(watchedDoc);
    assert(ingestedCount === 3, `ingestWatchedPageToFollowed deve atualizar 3 tópicos (obtido: ${ingestedCount})`);

    const ashley = mockStorage.followed.get('/threads/ashley-tervort.1111/');
    assert(ashley.forum_activity_ts === 9500, `Ashley Tervort forum_activity_ts deve ser 9500 (obtido: ${ashley.forum_activity_ts})`);
    assert(ashley.updated_at === 1000, `Ashley Tervort updated_at deve ser preservado em 1000 (obtido: ${ashley.updated_at})`);
    assert(ashley.last_page === 2, `Ashley Tervort last_page deve ter sido atualizado para 2 (obtido: ${ashley.last_page})`);
    assert(Array.isArray(ashley.saved_pages) && ashley.saved_pages.length === 1 && ashley.saved_pages[0] === 1, 'Ashley Tervort deve preservar saved_pages');
    assert(ashley.last_sync_at === 1000, 'Ashley Tervort deve preservar last_sync_at');

    const lumineiia = mockStorage.followed.get('/threads/lumineiia.2222/');
    assert(lumineiia.forum_activity_ts === 9000, `Lumineiia forum_activity_ts deve ser 9000 (obtido: ${lumineiia.forum_activity_ts})`);
    assert(lumineiia.updated_at === 1200, `Lumineiia updated_at deve ser preservado em 1200 (obtido: ${lumineiia.updated_at})`);

    const lien = mockStorage.followed.get('/threads/lien-sue.3333/');
    assert(lien.forum_activity_ts === 8500, `Lien Sue forum_activity_ts deve ser 8500 (obtido: ${lien.forum_activity_ts})`);
    assert(lien.updated_at === 800, `Lien Sue updated_at deve ser preservado em 800 (obtido: ${lien.updated_at})`);

    // 8.5 Priorização estrita por atividade recente (forum_activity_ts || updated_at) DESC
    const all = Array.from(mockStorage.followed.values());
    all.sort((a, b) => ((b.forum_activity_ts || b.updated_at || 0) - (a.forum_activity_ts || a.updated_at || 0)));
    assert(all[0].path === '/threads/ashley-tervort.1111/', 'Primeiro tópico na fila deve ser Ashley Tervort (9500)');
    assert(all[1].path === '/threads/lumineiia.2222/', 'Segundo tópico na fila deve ser Lumineiia (9000)');
    assert(all[2].path === '/threads/lien-sue.3333/', 'Terceiro tópico na fila deve ser Lien Sue (8500)');

    // 8.6 Testar execução do cronRefreshFollowedAndTimeline: NENHUM fetch para /watched/threads!
    let eventDetail = null;
    const onSyncDone = (e) => { eventDetail = e.detail; };
    window.addEventListener('smg-timeline-sync-done', onSyncDone);

    watchedThreadsFetchCount = 0;
    topicPagesFetchCount = 0;
    const cronAdded = await cronRefreshFollowedAndTimeline();

    assert(watchedThreadsFetchCount > 0, 'cronRefreshFollowedAndTimeline deve fazer fetch para /watched/threads para sincronizar tópicos seguidos');
    assert(topicPagesFetchCount > 0, 'cronRefreshFollowedAndTimeline deve fazer fetch para as páginas dos tópicos');
    assert(cronAdded > 0, `cronRefreshFollowedAndTimeline deve retornar posts adicionados (obtido: ${cronAdded})`);
    assert(eventDetail !== null, 'Evento smg-timeline-sync-done deve ter sido disparado');
    assert(eventDetail.added === cronAdded, `Evento smg-timeline-sync-done deve reportar added = ${cronAdded} (obtido: ${eventDetail?.added})`);

    window.removeEventListener('smg-timeline-sync-done', onSyncDone);

    // 8.7 Testar syncTimeline direta sem tópicos (empty state) - NENHUM fetch para /watched/threads
    mockStorage.followed.clear();
    watchedThreadsFetchCount = 0;
    const emptyAdded = await syncTimeline();
    assert(emptyAdded === 0, 'syncTimeline em banco vazio deve retornar 0 sem disparar crawling');
    assert(watchedThreadsFetchCount === 0, 'syncTimeline NUNCA deve requisitar /watched/threads em cold start');

    // 8.8 Testar startTimelineCron
    startTimelineCron();
    assert(window.__feedSyncExports.timelineCronTimer !== null, 'startTimelineCron deve registrar o timer do cron');
    const timerRef = window.__feedSyncExports.timelineCronTimer;
    startTimelineCron();
    assert(window.__feedSyncExports.timelineCronTimer === timerRef, 'startTimelineCron não deve duplicar o timer se já ativo');

    // 8.9 Backoff Exponencial do Cron (5 a 15 minutos)
    const {
        CRON_MIN_INTERVAL_MS,
        CRON_MAX_INTERVAL_MS,
        applyCronBackoff,
        resetCronBackoff
    } = window.__feedSyncExports;

    assert(CRON_MIN_INTERVAL_MS === 300000, 'CRON_MIN_INTERVAL_MS deve ser 300.000ms (5 minutos)');
    assert(CRON_MAX_INTERVAL_MS === 900000, 'CRON_MAX_INTERVAL_MS deve ser 900.000ms (15 minutos)');

    // Reset para garantir estado limpo
    resetCronBackoff();
    assert(window.__feedSyncExports.currentCronIntervalMs === 300000, 'currentCronIntervalMs inicial deve ser 300.000ms');
    assert(window.__feedSyncExports.cronConsecutive429 === 0, 'cronConsecutive429 deve iniciar em 0');

    // Chamar applyCronBackoff() 1x -> 600.000ms (10 min)
    applyCronBackoff('teste 429 - 1');
    assert(window.__feedSyncExports.currentCronIntervalMs === 600000, `applyCronBackoff 1x deve elevar intervalo para 600.000ms (obtido: ${window.__feedSyncExports.currentCronIntervalMs})`);
    assert(window.__feedSyncExports.cronConsecutive429 === 1, 'cronConsecutive429 deve ser 1');

    // Chamar applyCronBackoff() novamente na mesma janela de 60s -> DEBOUNCE (mantém 10 min, cronConsecutive429 continua 1)
    applyCronBackoff('teste 429 - debounce');
    assert(window.__feedSyncExports.currentCronIntervalMs === 600000, 'applyCronBackoff dentro da janela de 60s deve ser debounced');
    assert(window.__feedSyncExports.cronConsecutive429 === 1, 'cronConsecutive429 não deve incrementar dentro da janela de 60s');

    // Simula passagem de mais de 60s
    if (typeof window.__feedSyncExports.lastBackoffAppliedTs !== 'undefined') {
        window.__feedSyncExports.lastBackoffAppliedTs = Date.now() - 65000;
    }

    // Chamar applyCronBackoff() 2x -> teto de 900.000ms (15 min)
    applyCronBackoff('teste 429 - 2');
    assert(window.__feedSyncExports.currentCronIntervalMs === 900000, `applyCronBackoff 2x deve atingir o teto de 900.000ms (obtido: ${window.__feedSyncExports.currentCronIntervalMs})`);
    assert(window.__feedSyncExports.cronConsecutive429 === 2, 'cronConsecutive429 deve ser 2');

    // Simula passagem de mais de 60s
    if (typeof window.__feedSyncExports.lastBackoffAppliedTs !== 'undefined') {
        window.__feedSyncExports.lastBackoffAppliedTs = Date.now() - 65000;
    }
    applyCronBackoff('teste 429 - 3');
    assert(window.__feedSyncExports.currentCronIntervalMs === 900000, `applyCronBackoff não deve ultrapassar 900.000ms (obtido: ${window.__feedSyncExports.currentCronIntervalMs})`);
    assert(window.__feedSyncExports.cronConsecutive429 === 3, 'cronConsecutive429 deve ser 3');

    // Chamar resetCronBackoff() -> volta exatamente para 300.000ms (5 min)
    resetCronBackoff();
    assert(window.__feedSyncExports.currentCronIntervalMs === 300000, `resetCronBackoff deve restaurar intervalo para 300.000ms (obtido: ${window.__feedSyncExports.currentCronIntervalMs})`);
    assert(window.__feedSyncExports.cronConsecutive429 === 0, 'cronConsecutive429 deve ser resetado para 0');

    if (window.__feedSyncExports.timelineCronTimer) {
        clearTimeout(window.__feedSyncExports.timelineCronTimer);
        window.__feedSyncExports.timelineCronTimer = null;
    }

    // Restaurar fetch
    window.fetch = originalFetch;

    console.log('Teste 8 concluído com sucesso!\n');

    // =========================================================================
    // TESTE 9: Dock de Tópicos Seguidos (#smg-aldock) & Card do Modo Lista
    // =========================================================================
    console.log('--- TESTE 9: Dock de Tópicos Seguidos (#smg-aldock) & Card do Modo Lista ---');
    assert(window.__aldockExports !== undefined, 'window.__aldockExports deve estar exposto');
    const {
        buildAlertsDock,
        openAlertsDock,
        closeAlertsDock,
        toggleAlertsDock,
        aldockSyncCount,
        updateAlertsUnreadBadge,
        aldockState,
        aldockWidth,
        getAldock
    } = window.__aldockExports;

    // 9.1 Verificar configuração da dock lateral / sidebar
    const btnWatchedEl = document.getElementById('smg-nav-watched');
    assert(btnWatchedEl === null, 'Botão #smg-nav-watched (Seguindo na sidebar) não deve existir na dock');
    const btnAlertsEl = document.getElementById('smg-nav-alerts');
    assert(btnAlertsEl === null, 'Botão #smg-nav-alerts NÃO deve existir na barra/dock principal');

    // 9.2.1 A largura salva deve respeitar limites responsivos para não dominar telas grandes.
    window.GM_setValue('smg-alerts-dock-w', '620');
    window.innerWidth = 2048;
    assert(aldockWidth() === 460, `Sidebar deve limitar largura em telas grandes (obtido: ${aldockWidth()}px)`);
    window.innerWidth = 1280;
    assert(aldockWidth() === 340, `Sidebar deve manter largura mínima confortável em telas menores (obtido: ${aldockWidth()}px)`);
    window.GM_setValue('smg-alerts-dock-w', '');

    // 9.3 Montar dock e verificar estrutura do DOM
    const dockEl = buildAlertsDock();
    assert(dockEl !== null, 'buildAlertsDock deve criar o elemento aside#smg-aldock');
    assert(dockEl.id === 'smg-aldock', 'ID do painel deve ser smg-aldock');
    assert(dockEl.querySelector('.smg-aldock-switch') === null, 'A barra de alternância .smg-aldock-switch deve ser removida');
    assert(dockEl.querySelector('.smg-aldock-markall') === null, 'Botão .smg-aldock-markall deve ser removido');

    const titleText = dockEl.querySelector('.smg-aldock-titletext')?.textContent || '';
    assert(titleText === 'Alerts' || titleText === 'Alertas', `Título do cabeçalho deve ser Alerts/Alertas (obtido: ${titleText})`);

    // Botões de ação mantidos
    assert(dockEl.querySelector('.smg-aldock-view') === null, 'Botão grade/lista .smg-aldock-view (só da aba Seguindo) não deve existir');
    assert(dockEl.querySelector('.smg-aldock-refresh') !== null, 'Botão .smg-aldock-refresh deve existir');
    assert(dockEl.querySelector('.smg-aldock-close') !== null, 'Botão .smg-aldock-close deve existir');

    // A sidebar de Seguindo não possui abas de filtro
    const filterTabs = dockEl.querySelectorAll('.smg-aldock-tab');
    assert(filterTabs.length === 0, `Sidebar não deve possuir abas de filtro (encontradas: ${filterTabs.length})`);
    assert(dockEl.querySelector('.smg-aldock-tabs') === null, 'Bloco visual de filtros deve ser removido da sidebar');

    // Rodapé
    const seeAllLink = dockEl.querySelector('.smg-aldock-seeall');
    assert(seeAllLink !== null, 'Link do rodapé .smg-aldock-seeall deve existir');
    assert(seeAllLink.getAttribute('href').includes('/account/alerts'), `Link do rodapé deve apontar para /account/alerts (obtido: ${seeAllLink.getAttribute('href')})`);

    // 9.5 Testar aldockSyncCount e filtro de unread
    {
        const alertList = dockEl.querySelector('.smg-alert-clean');
        assert(alertList !== null, 'Lista de alertas .smg-alert-clean deve existir no dock');
        const alertRow = document.createElement('li');
        alertRow.className = 'alert is-unread';
        alertRow.innerHTML = '<span class="contentRow-main">Alerta novo</span><button class="smg-al-read">Read</button>';
        alertList.appendChild(alertRow);

        aldockSyncCount();
        const countBadge = dockEl.querySelector('.smg-aldock-n');
        assert(countBadge !== null, 'Badge .smg-aldock-n deve existir');
        assert(!countBadge.hidden, 'Badge deve estar visível com 1 item não lido');
        assert(countBadge.textContent === '1', `Badge deve exibir "1" (obtido: ${countBadge.textContent})`);

        const markReadBtn = dockEl.querySelector('.smg-aldock-markread');
        assert(markReadBtn !== null, 'Botão markread deve existir');
        markReadBtn.click();

        assert(!alertRow.classList.contains('is-unread'), 'markReadBtn deve remover is-unread do alerta');
        assert(alertRow.classList.contains('smg-al-old'), 'markReadBtn deve adicionar smg-al-old ao alerta');
        assert(alertRow.querySelector('.smg-al-read') === null, 'markReadBtn deve remover botões .smg-al-read');
        assert(countBadge.hidden || countBadge.textContent === '', 'Badge deve estar oculto ou vazio após mark all read');
        assert(window.GM_getValue('smg-alerts-count') === '0', 'GM storage smg-alerts-count deve ser 0');
    }

    // 9.6 Testar toggleAlertsDock('alerts')
    window.innerWidth = 1280;
    closeAlertsDock(false);
    assert(!document.documentElement.classList.contains('smg-aldock-on'), 'Dock deve iniciar fechado');
    toggleAlertsDock('alerts');
    assert(document.documentElement.classList.contains('smg-aldock-on'), 'toggleAlertsDock("alerts") deve abrir o painel');
    toggleAlertsDock('alerts');
    assert(!document.documentElement.classList.contains('smg-aldock-on'), 'toggleAlertsDock("alerts") com painel aberto deve fechar o painel');

    // 9.6.1 Na /account/alerts a lista nativa é a própria página: o rail lateral não abre
    const pathBeforeAlertsPage = window.location.pathname;
    window.history.pushState({}, '', '/account/alerts');
    openAlertsDock(false);
    assert(!document.documentElement.classList.contains('smg-aldock-on'), 'Na /account/alerts o rail lateral não deve abrir');
    window.history.pushState({}, '', pathBeforeAlertsPage);

    // 9.7 Validar CSS injetado dos chips
    const injectedStyles = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');
    assert(injectedStyles.includes('padding: var(--smg-sp-2) var(--smg-sp-6) !important'), 'CSS deve definir padding compacto para .label e .smg-badge-chip');
    assert(injectedStyles.includes('font-size: var(--smg-fs-10) !important'), 'CSS deve definir font-size 10px (escala) para .label e .smg-badge-chip');
    assert(!/li\.alert\.is-unread::before/.test(injectedStyles), 'Alertas não-lidos não devem desenhar faixa vertical na borda esquerda (::before)');
    assert(injectedStyles.includes('.smg-al-read::before'), 'O dot de não-lida à direita continua definido');

    // 9.8 Testar railBtn da topbar (classes e contador de seguidos)
    const railBtnEl = document.querySelector('.smg-tb-railbtn');
    assert(railBtnEl !== null, 'Botão .smg-tb-railbtn deve existir na topbar');
    assert(railBtnEl.classList.contains('smg-rt-alerts'), 'railBtn deve possuir classe .smg-rt-alerts');
    assert(!railBtnEl.classList.contains('smg-rt-watched'), 'railBtn NÃO deve possuir classe .smg-rt-watched');

    // 9.9 Badge de alertas no sino da topbar
    updateAlertsUnreadBadge(5);
    const railAlertsBadge = railBtnEl.querySelector('.smg-tb-badge');
    assert(railAlertsBadge !== null && railAlertsBadge.textContent === '5', `updateAlertsUnreadBadge(5) deve exibir "5" no railBtn (obtido: ${railAlertsBadge?.textContent})`);
    updateAlertsUnreadBadge(0);
    assert(railBtnEl.querySelector('.smg-tb-badge') === null, 'updateAlertsUnreadBadge(0) deve remover badge do railBtn');

    // Testar ingestWatchedPageToFollowed atualizando contagem de não lidos
    const docMock = document.createElement('div');
    docMock.innerHTML = `
        <div class="structItem structItem--thread is-unread"><div class="structItem-title"><a href="/threads/t-unread.1/">Unread Thread</a></div></div>
        <div class="structItem structItem--thread"><div class="structItem-title"><a href="/threads/t-read.2/">Read Thread</a></div></div>
    `;
    window.__filterbarExports.ingestWatchedPageToFollowed(docMock);
    assert(!window.GM_getValue('smg-watched-unread-count'), `ingestWatchedPageToFollowed não deve gravar smg-watched-unread-count (obtido: ${window.GM_getValue('smg-watched-unread-count')})`);
    assert(railBtnEl.querySelector('.smg-tb-badge') === null, 'O sino de alertas não deve exibir a contagem de seguidos após a ingestão');

    // 9.10 Testar Componente de Avisos (.smg-notices-collapse) com cabeçalho "Avisos", toggle e dismiss
    const noticeBlockMock = document.createElement('div');
    noticeBlockMock.className = 'notices--block';
    noticeBlockMock.innerHTML = `
        <div class="notice" data-notice-id="123">
            <div class="notice-image"><img src="https://example.com/icon.png" alt="" /></div>
            <div class="notice-content">Aviso do sistema <a href="#">link de novidade</a></div>
            <a href="/account/dismiss-notice?notice_id=123" class="notice-dismiss"></a>
        </div>
    `;
    document.body.appendChild(noticeBlockMock);

    if (typeof window.setupHeaderNotices === 'function') window.setupHeaderNotices();

    // 1. O banner nativo deve ser escondido com display: none
    assert(noticeBlockMock.style.display === 'none', 'Bloco nativo .notices--block deve ser escondido com display: none');

    // 2. Montagem do .smg-notices-collapse
    const collapseEl = document.querySelector('.smg-notices-collapse');
    assert(collapseEl !== null, 'setupHeaderNotices deve montar o componente .smg-notices-collapse');
    const noticesTitleText = collapseEl.querySelector('.smg-notices-collapse-title')?.textContent;
    assert(noticesTitleText === 'Avisos' || noticesTitleText === 'Notices', `Cabeçalho deve conter o título "Avisos" ou "Notices" (obtido: "${noticesTitleText}")`);
    assert(collapseEl.querySelector('.smg-notices-collapse-badge')?.textContent === '1', 'Badge deve exibir o número de avisos "1"');

    // 3. Estado inicial do corpo: recolhido (hidden = true)
    const bodyEl = collapseEl.querySelector('.smg-notices-collapse-body');
    assert(bodyEl?.hidden === true, 'Corpo do collapse deve iniciar recolhido (hidden = true)');
    assert(!collapseEl.classList.contains('is-expanded'), 'Collapse não deve conter a classe is-expanded inicialmente');

    // 4. Testar toggle ao clicar no cabeçalho
    const headEl = collapseEl.querySelector('.smg-notices-collapse-head');
    headEl.click();
    assert(bodyEl.hidden === false, 'Clicar no cabeçalho deve expandir o corpo (hidden = false)');
    assert(collapseEl.classList.contains('is-expanded'), 'Collapse deve possuir classe is-expanded quando aberto');
    assert(window.GM_getValue('smg-notices-expanded') === '1', 'GM_getValue(smg-notices-expanded) deve ser "1" após expandir');

    headEl.click();
    assert(bodyEl.hidden === true, 'Clicar novamente no cabeçalho deve recolher o corpo (hidden = true)');
    assert(!collapseEl.classList.contains('is-expanded'), 'Collapse não deve possuir classe is-expanded após recolher');
    assert(window.GM_getValue('smg-notices-expanded') === '0', 'GM_getValue(smg-notices-expanded) deve ser "0" após recolher');

    // 5. Testar dismiss total
    const dismissAllBtn = collapseEl.querySelector('.smg-notices-collapse-dismiss');
    assert(dismissAllBtn !== null, 'Botão de dismiss do cabeçalho deve existir');
    dismissAllBtn.click();
    assert(window.GM_getValue('smg-notices-dismissed-ids') === '123', `GM_getValue(smg-notices-dismissed-ids) deve conter o id dispensado "123" (obtido: ${window.GM_getValue('smg-notices-dismissed-ids')})`);

    // Aguardar animação de saída e remoção do DOM
    await new Promise(r => setTimeout(r, 300));
    assert(document.querySelector('.smg-notices-collapse') === null, 'Componente .smg-notices-collapse deve ser removido do DOM após dismiss');

    // 6. Validar que nova execução de setupHeaderNotices não monta o collapse se já dispensado
    if (typeof window.setupHeaderNotices === 'function') window.setupHeaderNotices();
    assert(document.querySelector('.smg-notices-collapse') === null, 'setupHeaderNotices NÃO deve recriar o componente se todos os IDs já foram dispensados');

    // Validar CSS dos novos componentes
    assert(injectedStyles.includes('.smg-notices-collapse'), 'CSS deve definir estilos para .smg-notices-collapse');
    assert(injectedStyles.includes('.smg-notices-collapse-head'), 'CSS deve definir estilos para .smg-notices-collapse-head');
    assert(injectedStyles.includes('.smg-notices-collapse-badge'), 'CSS deve definir estilos para .smg-notices-collapse-badge');
    assert(injectedStyles.includes('.smg-notices-collapse-chevron'), 'CSS deve definir estilos para .smg-notices-collapse-chevron');
    assert(injectedStyles.includes('border-radius: var(--smg-r-14) !important'), 'CSS deve definir border-radius: 14px para .smg-notices-collapse');
    assert(injectedStyles.includes('margin: var(--smg-sp-16) 0 !important'), 'CSS deve definir margin: 16px 0 !important para .smg-notices-collapse');
    noticeBlockMock.remove();

    console.log('Teste 9 concluído com sucesso!\n');

    // =========================================================================
    // TESTE 10: Ingestão do Painel de Seguidos, Concorrência 5, Lote Prioritário & Pintura Instantânea
    // =========================================================================
    console.log('--- TESTE 10: Ingestão do Painel de Seguidos, Concorrência & Pintura Instantânea ---');

    // 10.1 Concorrência 2, Delay 600ms, Interceptação de 429 & Circuit Breaker
    assert(window.__feedExports.RIVER_CONCURRENCY === 2, 'RIVER_CONCURRENCY deve ser 2');
    assert(window.__feedExports.RIVER_DELAY_MS === 600, 'RIVER_DELAY_MS deve ser 600ms');
    assert(typeof window.riverHandle429 === 'function', 'window.riverHandle429 deve estar exposto globalmente');
    assert(typeof window.__feedExports.riverHandle429 === 'function', '__feedExports.riverHandle429 deve estar exposto');
    assert(typeof window.riverAbortSync === 'function', 'window.riverAbortSync deve estar exposto globalmente');
    assert(typeof window.__feedExports.riverAbortSync === 'function', '__feedExports.riverAbortSync deve estar exposto');

    // Testar resposta 429 em fetchDoc: não faz retries, aborta sincronização e retorna null
    const prevFetch429 = window.fetch;
    let fetch429Calls = 0;

    window.fetch = async (url, opts) => {
        fetch429Calls++;
        return {
            status: 429,
            headers: new Map([['Retry-After', '300']])
        };
    };

    // Reset antes do teste
    window.__feedExports.riverAborted = false;
    window.__riverAborted = false;
    window.resetCronBackoff();

    const nowBefore429 = Date.now();
    const doc429 = await window.__fetchDoc('https://forums.socialmediagirls.com/threads/test-429.1/', {});

    assert(window.__feedExports.riverPauseUntil >= nowBefore429 + 299000, 'riverHandle429 deve atualizar riverPauseUntil com no mínimo 300.000ms (5 min)');
    assert(window.__lastRateLimitTs >= nowBefore429, 'riverHandle429 deve atualizar window.__lastRateLimitTs');
    assert(window.__feedSyncExports.cronConsecutive429 > 0, 'riverHandle429 deve acionar applyCronBackoff');
    assert(fetch429Calls === 1, `fetchDoc NÃO deve realizar retry após 429 (chamadas: ${fetch429Calls})`);
    assert(doc429 === null, 'fetchDoc com 429 deve retornar null imediatamente');
    assert(window.__feedExports.riverAborted === true, 'riverHandle429 deve definir riverAborted como true');
    assert(window.__riverAborted === true, 'riverHandle429 deve definir window.__riverAborted como true');

    // Chamadas subsequentes com riverAborted ativo NÃO devem ser bloqueadas (navegação normal / buscas / Seguindo)
    let fetchAfterAbortedCalls = 0;
    window.fetch = async () => {
        fetchAfterAbortedCalls++;
        return { ok: true, status: 200, text: async () => '<html><body>Normal Page</body></html>' };
    };
    const docNormal = await window.__fetchDoc('https://forums.socialmediagirls.com/threads/normal.1/', {});
    assert(docNormal !== null, 'fetchDoc NÃO deve bloquear requisições normais quando riverAborted estiver ativo');
    assert(fetchAfterAbortedCalls === 1, 'fetchDoc deve chamar fetch() na rede para navegação normal mesmo com riverAborted ativo');

    // Reset de cooldown e flags para prosseguir com os testes subsequentes
    window.__feedExports.riverAborted = false;
    window.__riverAborted = false;
    window.__feedExports.riverPauseUntil = 0;
    window.resetCronBackoff();
    window.fetch = prevFetch429;

    // 10.2 Ingestão das threads da lista de seguidos no IndexedDB
    const watchedPanelHtml = `<html><body>
        <div class="structItem structItem--thread">
            <div class="structItem-title">
                <a href="/threads/kira-pregiato.4444/">Kira Pregiato</a>
            </div>
            <div class="structItem-pageJump">
                <a href="/threads/kira-pregiato.4444/page-3">3</a>
            </div>
            <div class="structItem-cell--latest">
                <time data-timestamp="9996">Há 4 minutos</time>
            </div>
        </div>
        <div class="structItem structItem--thread">
            <div class="structItem-title">
                <a href="/threads/cubeu.5555/">Cubeu</a>
            </div>
            <div class="structItem-pageJump">
                <a href="/threads/cubeu.5555/page-2">2</a>
            </div>
            <div class="structItem-cell--latest">
                <time data-timestamp="9991">Há 9 minutos</time>
            </div>
        </div>
    </body></html>`;

    const watchedPanelDoc = new JSDOM(watchedPanelHtml).window.document;
    const ingestedPanel = await window.__filterbarExports.ingestWatchedPageToFollowed(watchedPanelDoc);
    assert(ingestedPanel === 2, `ingestWatchedPageToFollowed deve gravar 2 tópicos (obtido: ${ingestedPanel})`);

    const kira = mockStorage.followed.get('/threads/kira-pregiato.4444/');
    assert(kira !== undefined, 'Kira Pregiato deve estar gravada na tabela followed do IndexedDB');
    assert(kira.thread_name === 'Kira Pregiato', 'Kira Pregiato deve ter thread_name correto');
    assert(kira.forum_activity_ts === 9996, `Kira Pregiato deve ter forum_activity_ts 9996 (obtido: ${kira.forum_activity_ts})`);
    assert(kira.updated_at === 9996, `Kira Pregiato deve ter updated_at 9996 (obtido: ${kira.updated_at})`);
    assert(kira.unread === false, 'Kira Pregiato deve ter unread false na primeira ingestão');
    assert(kira.last_page === 3, `Kira Pregiato deve ter last_page 3 (obtido: ${kira.last_page})`);

    const cubeu = mockStorage.followed.get('/threads/cubeu.5555/');
    assert(cubeu !== undefined, 'Cubeu deve estar gravada na tabela followed do IndexedDB');
    assert(cubeu.thread_name === 'Cubeu', 'Cubeu deve ter thread_name correto');
    assert(cubeu.forum_activity_ts === 9991, `Cubeu deve ter forum_activity_ts 9991 (obtido: ${cubeu.forum_activity_ts})`);
    assert(cubeu.updated_at === 9991, `Cubeu deve ter updated_at 9991 (obtido: ${cubeu.updated_at})`);
    assert(cubeu.unread === false, 'Cubeu deve ter unread false na primeira ingestão');
    assert(cubeu.last_page === 2, `Cubeu deve ter last_page 2 (obtido: ${cubeu.last_page})`);

    // a ingestão da lista NUNCA deve iniciar syncTimeline em segundo plano
    assert(window.__feedSyncExports.timelineSyncRunning === false, 'A ingestão de seguidos NUNCA deve iniciar syncTimeline em segundo plano');

    // 10.3 Processamento calmo e sequencial de no máximo 8 tópicos prioritários
    while (window.__feedSyncExports.timelineSyncRunning) {
        await new Promise(r => setTimeout(r, 20));
    }

    mockStorage.followed.clear();
    for (let i = 1; i <= 20; i++) {
        mockStorage.followed.set(`/threads/topico-${i}.${i}/`, {
            path: `/threads/topico-${i}.${i}/`,
            thread_name: `Tópico ${i}`,
            saved_pages: [],
            last_page: 1,
            updated_at: 1000 + i,
            last_sync_at: 0
        });
    }

    const crawlOrder = [];
    const prevFetchForSync = window.fetch;
    window.fetch = async (url, opts) => {
        const urlStr = typeof url === 'string' ? url : (url && url.url) || '';
        const m = urlStr.match(/\/threads\/topico-(\d+)\.\d+/);
        if (m) {
            crawlOrder.push(parseInt(m[1], 10));
            return {
                ok: true,
                status: 200,
                text: async () => `<html><body>
                    <h1 class="p-title-value">Tópico ${m[1]}</h1>
                    <article class="message message--post" id="js-post-${m[1]}0" data-content="post-${m[1]}0">
                        <span class="u-anchorTarget" id="post-${m[1]}0"></span>
                        <div class="message-inner">
                            <div class="message-cell message-cell--user"><a class="username">User</a></div>
                            <div class="message-cell message-cell--main"><div class="message-userContent">Post ${m[1]}</div></div>
                            <div class="message-attribution"><time data-timestamp="${1000 + parseInt(m[1], 10)}">Agora</time></div>
                        </div>
                    </article>
                </body></html>`,
                json: async () => ({}),
                url: urlStr
            };
        }
        return prevFetchForSync(url, opts);
    };

    mockStorage.meta.set('lastTimelineRunTs', 0);
    const { syncTimeline: syncTimelineFn } = window.__feedSyncExports;
    await syncTimelineFn();

    assert(crawlOrder.length === 8, `Devem ser buscados no máximo 8 tópicos por ciclo (buscados: ${crawlOrder.length})`);
    const first5Crawled = crawlOrder.slice(0, 5);
    const top5Recent = [20, 19, 18, 17, 16];
    const containsAllTop5 = top5Recent.every(id => first5Crawled.includes(id));
    assert(containsAllTop5, 'O lote sequencial processado deve priorizar os tópicos mais recentes');
    assert(JSON.stringify(crawlOrder) === JSON.stringify([20, 19, 18, 17, 16, 15, 14, 13]), 'A sincronização de tópicos deve ser estritamente sequencial (1 por 1)');

    window.fetch = prevFetchForSync;

    // 10.4 Pintura instantânea no onBatch ao receber os primeiros posts
    const { firstPaint: fp, renderMore: rm } = window.__feedExports;
    const testRiverEl = document.createElement('div');
    testRiverEl.id = 'smg-river';
    const testListEl = document.createElement('div');
    testListEl.className = 'smg-fp-list';
    testListEl.innerHTML = '<div class="smg-fp-setup"><span class="smg-fp-setup-spin"></span></div>';
    testRiverEl.appendChild(testListEl);
    document.body.appendChild(testRiverEl);

    window.__feedExports.riverList = testListEl;
    window.__feedExports.riverSeen = new Set();
    window.__feedExports.riverFirstPainted = false;
    window.__feedExports.feedSyncRunning = false;

    assert(testListEl.querySelector('.smg-fp-setup') !== null, 'riverList deve iniciar com elemento .smg-fp-setup');

    mockStorage.timeline.set('post-99999', {
        post_id: '99999',
        thread_path: '/threads/kira-pregiato.4444/',
        thread_name: 'Kira Pregiato',
        author: 'Kira',
        author_href: '/members/kira.1/',
        created_at: 9996,
        content_html: '<div>Primeiro post ultra rápido</div>',
        permalink: '/threads/kira-pregiato.4444/#post-99999',
        media_urls: ['https://example.com/kira.jpg'],
        prefixes_html: '',
        thread_thumb: 'https://example.com/kira-thumb.jpg'
    });

    // Simulação do onBatch de kickSync: ao chegar o 1º lote (addedCount > 0) com .smg-fp-setup ativo
    if (testListEl && 1 > 0 && testListEl.querySelector('.smg-fp-setup')) {
        fp();
        await rm();
    }

    assert(testListEl.querySelector('.smg-fp-setup') === null, 'firstPaint no onBatch deve remover o spinner de setup imediatamente');
    const cardsRendered = testListEl.querySelectorAll('.smg-fp-card');
    assert(cardsRendered.length > 0, `renderMore no onBatch deve renderizar cards instantaneamente (renderizados: ${cardsRendered.length})`);

    // 10.5 Gatilhos Ativos de Atualização da Timeline
    const { handleTimelineFocusOrVisibility: focusHandler } = window.__feedExports;
    assert(typeof focusHandler === 'function', 'handleTimelineFocusOrVisibility deve ser função');

    window.__feedExports.lastTimelineSyncTime = Date.now() - 45000;
    document.documentElement.classList.add('smg-watched-feed');
    window.__feedExports.feedSyncRunning = false;

    focusHandler();
    assert(window.__feedExports.feedSyncRunning === true, 'Foco na janela/aba após 30s de inatividade na Timeline deve disparar kickSync');
    document.documentElement.classList.remove('smg-watched-feed');
    testRiverEl.remove();

    while (window.__feedExports.feedSyncRunning || window.__feedSyncExports.timelineSyncRunning) {
        await new Promise(r => setTimeout(r, 20));
    }

    console.log('Teste 10 concluído com sucesso!\n');

    // =========================================================================
    // TESTE 11: Sincronização Automática em Background com fetchAndIngestFollowed
    // =========================================================================
    console.log('--- TESTE 11: Sincronização Automática em Background com fetchAndIngestFollowed ---');

    assert(typeof window.fetchAndIngestFollowed === 'function', 'window.fetchAndIngestFollowed deve ser função global');
    assert(typeof window.fetchWatchedDoc === 'function', 'window.fetchWatchedDoc deve ser função global');
    assert(window.__filterbarExports !== undefined, '__filterbarExports deve estar exposto');
    assert(typeof window.__filterbarExports.fetchWatchedDoc === 'function', 'fetchWatchedDoc deve estar exposto em __filterbarExports');
    assert(typeof window.__filterbarExports.fetchAndIngestFollowed === 'function', 'fetchAndIngestFollowed deve estar exposto em __filterbarExports');

    const autoWatchedHtml = `<html><body>
        <div class="structItem structItem--thread">
            <div class="structItem-title">
                <a href="/threads/auto-model.8888/">Auto Model</a>
            </div>
            <div class="structItem-pageJump">
                <a href="/threads/auto-model.8888/page-3">3</a>
            </div>
            <div class="structItem-cell--latest">
                <time data-timestamp="10500">Hoje às 22:00</time>
            </div>
            <div class="structItem-cell--icon">
                <img src="https://example.com/thumb-auto.jpg" />
            </div>
        </div>
    </body></html>`;

    const prevFetch11 = window.fetch;
    let autoWatchedFetched = false;
    let autoTopicFetched = false;

    window.fetch = async (url, opts) => {
        const urlStr = typeof url === 'string' ? url : (url && url.url) || '';
        if (urlStr.includes('/watched/threads')) {
            autoWatchedFetched = true;
            const respBody = urlStr.includes('_xfResponseType=json')
                ? JSON.stringify({ status: 'ok', html: { content: autoWatchedHtml } })
                : autoWatchedHtml;
            return {
                ok: true,
                status: 200,
                text: async () => respBody,
                json: async () => ({ status: 'ok', html: { content: autoWatchedHtml } }),
                url: urlStr
            };
        }
        if (urlStr.includes('/threads/auto-model.8888')) {
            autoTopicFetched = true;
            return {
                ok: true,
                status: 200,
                text: async () => `<html><body>
                    <h1 class="p-title-value">Auto Model</h1>
                    <article class="message message--post" id="js-post-888801" data-content="post-888801">
                        <span class="u-anchorTarget" id="post-888801"></span>
                        <div class="message-inner">
                            <div class="message-cell message-cell--user">
                                <a class="username" href="/members/automodel.1/">Auto Model User</a>
                            </div>
                            <div class="message-cell message-cell--main">
                                <div class="message-content">
                                    <div class="message-userContent">Post automático colhido em segundo plano</div>
                                </div>
                            </div>
                            <div class="message-attribution">
                                <time data-timestamp="10500">Hoje às 22:00</time>
                            </div>
                        </div>
                    </article>
                </body></html>`,
                json: async () => ({}),
                url: urlStr
            };
        }
        return prevFetch11(url, opts);
    };

    // 11.1 fetchAndIngestFollowed busca /watched/threads e popula a store followed sem navegação
    const ingestedAutoCount = await window.fetchAndIngestFollowed();
    assert(autoWatchedFetched === true, 'fetchAndIngestFollowed deve requisitar /watched/threads via fetchWatchedDoc');
    assert(ingestedAutoCount === 1, `fetchAndIngestFollowed deve ingerir 1 tópico novo (obtido: ${ingestedAutoCount})`);

    const autoModel = mockStorage.followed.get('/threads/auto-model.8888/');
    assert(autoModel !== undefined, 'Tópico auto-model.8888 deve estar gravado na store followed do IndexedDB sem necessidade de navegação');
    assert(autoModel.thread_name === 'Auto Model', 'Auto Model deve ter thread_name correto');
    assert(autoModel.forum_activity_ts === 10500, 'Auto Model deve ter forum_activity_ts 10500');
    assert(autoModel.updated_at === 10500, 'Auto Model deve ter updated_at 10500 inicializado com forum_activity_ts');
    assert(autoModel.unread === false, 'Auto Model deve ter unread false na primeira ingestão');

    while (window.__feedSyncExports.timelineSyncRunning) {
        await new Promise(r => setTimeout(r, 20));
    }

    // 11.2 cronRefreshFollowedAndTimeline executa o ciclo completo: atualiza seguidos e timeline
    const nowTs = Math.floor(Date.now() / 1000);
    const cronWatchedHtml = `<html><body>
        <div class="structItem structItem--thread">
            <div class="structItem-title">
                <a href="/threads/cron-model.9999/">Cron Model</a>
            </div>
            <div class="structItem-pageJump">
                <a href="/threads/cron-model.9999/page-2">2</a>
            </div>
            <div class="structItem-cell--latest">
                <time data-timestamp="${nowTs}">Hoje às 23:00</time>
            </div>
            <div class="structItem-cell--icon">
                <img src="https://example.com/thumb-cron.jpg" />
            </div>
        </div>
    </body></html>`;

    let cronWatchedFetched = false;
    let cronTopicFetched = false;

    window.fetch = async (url, opts) => {
        const urlStr = typeof url === 'string' ? url : (url && url.url) || '';
        if (urlStr.includes('/watched/threads')) {
            cronWatchedFetched = true;
            const respBody = urlStr.includes('_xfResponseType=json')
                ? JSON.stringify({ status: 'ok', html: { content: cronWatchedHtml } })
                : cronWatchedHtml;
            return {
                ok: true,
                status: 200,
                text: async () => respBody,
                json: async () => ({ status: 'ok', html: { content: cronWatchedHtml } }),
                url: urlStr
            };
        }
        if (urlStr.includes('/threads/cron-model.9999')) {
            cronTopicFetched = true;
            return {
                ok: true,
                status: 200,
                text: async () => `<html><body>
                    <h1 class="p-title-value">Cron Model</h1>
                    <article class="message message--post" id="js-post-999901" data-content="post-999901">
                        <span class="u-anchorTarget" id="post-999901"></span>
                        <div class="message-inner">
                            <div class="message-cell message-cell--user">
                                <a class="username" href="/members/cronmodel.1/">Cron Model User</a>
                            </div>
                            <div class="message-cell message-cell--main">
                                <div class="message-content">
                                    <div class="message-userContent">Post do cron em segundo plano</div>
                                </div>
                            </div>
                            <div class="message-attribution">
                                <time data-timestamp="${nowTs}">Hoje às 23:00</time>
                            </div>
                        </div>
                    </article>
                </body></html>`,
                json: async () => ({}),
                url: urlStr
            };
        }
        return prevFetch11(url, opts);
    };

    let timelineDoneFired = false;
    let timelineDoneAdded = 0;
    const onTimelineDone = (e) => {
        timelineDoneFired = true;
        timelineDoneAdded = e.detail ? e.detail.added : 0;
    };
    window.addEventListener('smg-timeline-sync-done', onTimelineDone);

    window.__feedSyncExports.isCronRunning = false;
    window.__feedSyncExports.timelineSyncRunning = false;

    const cronCycleAdded = await cronRefreshFollowedAndTimeline();
    assert(cronWatchedFetched === true, 'cronRefreshFollowedAndTimeline deve requisitar /watched/threads para sincronizar a tabela followed');
    assert(cronTopicFetched === true, 'cronRefreshFollowedAndTimeline deve rastrear o tópico com novidades');
    assert(cronCycleAdded > 0, `cronRefreshFollowedAndTimeline deve adicionar posts à timeline (obtido: ${cronCycleAdded})`);
    assert(timelineDoneFired === true, 'Evento smg-timeline-sync-done deve ter sido disparado pelo cron');
    assert(timelineDoneAdded === cronCycleAdded, `smg-timeline-sync-done deve reportar added = ${cronCycleAdded}`);

    const cronModel = mockStorage.followed.get('/threads/cron-model.9999/');
    assert(cronModel !== undefined, 'Cron Model deve ter sido salvo na tabela followed pelo cron');
    assert(cronModel.thread_name === 'Cron Model', 'Cron Model deve ter thread_name correto');


    window.removeEventListener('smg-timeline-sync-done', onTimelineDone);
    window.fetch = prevFetch11;

    // 11.3 Testar fetchWatchedDoc com payload JSON nativo do XenForo (_xfResponseType=json)
    const { fetchWatchedDoc } = window.__filterbarExports;
    assert(typeof fetchWatchedDoc === 'function', 'fetchWatchedDoc deve ser função exportada em __filterbarExports');

    const sampleWatchedHtml = `<html><body>
        <div class="structItem structItem--thread">
            <div class="structItem-title"><a href="/threads/model-json.7777/">Model JSON</a></div>
        </div>
    </body></html>`;

    let watchedDocJsonRequested = false;
    const prevFetch11_3 = window.fetch;
    window.fetch = async (url, opts) => {
        const urlStr = typeof url === 'string' ? url : (url && url.url) || '';
        if (urlStr.includes('/watched/threads') && urlStr.includes('_xfResponseType=json')) {
            watchedDocJsonRequested = true;
            return {
                ok: true,
                status: 200,
                text: async () => JSON.stringify({ status: 'ok', html: { content: sampleWatchedHtml } }),
                json: async () => ({ status: 'ok', html: { content: sampleWatchedHtml } }),
                url: urlStr
            };
        }
        return prevFetch11_3(url, opts);
    };

    const docFromJson = await fetchWatchedDoc();
    assert(watchedDocJsonRequested === true, 'fetchWatchedDoc deve requisitar endpoint com _xfResponseType=json');
    assert(docFromJson !== null, 'fetchWatchedDoc deve retornar um Document válido');
    assert(docFromJson.querySelectorAll('.structItem--thread').length === 1, 'fetchWatchedDoc deve extrair os nós .structItem--thread do JSON');

    // 11.4 Testar fallback do fetchWatchedDoc para fetchDoc se o JSON vier sem tópicos
    let fallbackCalled = false;
    window.fetch = async (url, opts) => {
        const urlStr = typeof url === 'string' ? url : (url && url.url) || '';
        if (urlStr.includes('_xfResponseType=json')) {
            return {
                ok: true,
                status: 200,
                text: async () => JSON.stringify({ status: 'ok', html: { content: '<div>vazio</div>' } }),
                json: async () => ({}),
                url: urlStr
            };
        }
        if (urlStr.includes('/watched/threads')) {
            fallbackCalled = true;
            return {
                ok: true,
                status: 200,
                text: async () => sampleWatchedHtml,
                json: async () => ({}),
                url: urlStr
            };
        }
        return prevFetch11_3(url, opts);
    };

    const docFallback = await fetchWatchedDoc();
    assert(fallbackCalled === true, 'fetchWatchedDoc deve executar fallback para fetchDoc quando JSON não contiver .structItem--thread');
    assert(docFallback !== null && docFallback.querySelectorAll('.structItem--thread').length === 1, 'Fallback deve retornar documento válido');

    // 11.5 Testar botão de refresh da Timeline (.smg-river-refresh) disparando kickSync(true)
    const { buildRiver } = window.__feedExports;
    assert(typeof buildRiver === 'function', 'buildRiver deve estar exportado');
    const existingRiver = document.getElementById('smg-river');
    if (existingRiver) existingRiver.remove();

    buildRiver();
    const riverRefreshBtn = document.querySelector('.smg-river-refresh');
    assert(riverRefreshBtn !== null, 'Botão .smg-river-refresh deve existir no DOM');

    riverRefreshBtn.click();
    assert(window.__feedExports.feedSyncRunning === true, 'Clicar no botão .smg-river-refresh deve iniciar kickSync');

    while (window.__feedExports.feedSyncRunning || window.__feedSyncExports.timelineSyncRunning) {
        await new Promise(r => setTimeout(r, 20));
    }

    const testRiverEl2 = document.getElementById('smg-river');
    if (testRiverEl2) testRiverEl2.remove();
    window.fetch = prevFetch11_3;

    // 11.6 Testar streamAllWatchedPages: ZERO requisições imediatas + carregamento sob demanda (scroll)
    const { streamAllWatchedPages } = window.__filterbarExports;
    assert(typeof streamAllWatchedPages === 'function', 'streamAllWatchedPages deve estar exportado');

    const prevUrl11 = window.location.href;
    window.history.pushState({}, '', '/watched/threads');

    const watchedContainer = document.createElement('div');
    watchedContainer.className = 'structItemContainer smg-tl-grid';
    watchedContainer.innerHTML = `
        <div class="structItem structItem--thread">
            <div class="structItem-title"><a href="/threads/page1-topic.1/">Page 1 Topic</a></div>
        </div>
        <div class="pageNav">
            <a href="/watched/threads?page=2">2</a>
            <a href="/watched/threads?page=3">3</a>
        </div>
    `;
    document.body.appendChild(watchedContainer);

    let watchedPageFetchCount = 0;
    const prevFetch11_6 = window.fetch;
    window.fetch = async (url, opts) => {
        watchedPageFetchCount++;
        return {
            ok: true,
            status: 200,
            text: async () => `<html><body>
                <div class="structItem structItem--thread">
                    <div class="structItem-title"><a href="/threads/page2-topic.2/">Page 2 Topic</a></div>
                </div>
            </body></html>`,
            json: async () => ({}),
            url: typeof url === 'string' ? url : (url && url.url) || ''
        };
    };

    window.__filterbarExports.isStreamingWatched = false;
    await streamAllWatchedPages();

    // Verifica que NENHUMA requisição é disparada imediatamente (zero requests)
    assert(watchedPageFetchCount === 0, `streamAllWatchedPages NÃO deve disparar requisições imediatamente (obtido: ${watchedPageFetchCount})`);

    // As próximas páginas vêm do loader comum (setupInfiniteScroll: separadores, pré-busca, URL, toggle
    // infiniteScrollWatched); a lista de seguidas não tem mais paginador próprio.
    assert(typeof window.__loadNextWatchedPage === 'undefined' && typeof window.__onWatchedScroll === 'undefined', '/watched/threads deve usar o loader comum, sem paginador próprio');

    watchedContainer.remove();
    window.fetch = prevFetch11_6;
    window.history.pushState({}, '', prevUrl11);

    console.log('Teste 11 concluído com sucesso!\n');

    // =========================================================================
    // TESTE 12: Circuit Breaker & Resiliência a Rate Limit (HTTP 429)
    // =========================================================================
    console.log('--- TESTE 12: Circuit Breaker & Resiliência a Rate Limit (HTTP 429) ---');

    // 12.1 Simula 10 itens na fila riverQueue
    window.__feedExports.riverAborted = false;
    window.__riverAborted = false;
    window.__feedExports.riverPauseUntil = 0;
    window.resetCronBackoff();

    const queueRef = window.__feedExports.riverQueue;
    assert(Array.isArray(queueRef), 'riverQueue deve ser um array');
    queueRef.length = 0;
    for (let i = 0; i < 10; i++) {
        queueRef.push(() => Promise.resolve(i));
    }
    assert(queueRef.length === 10, `riverQueue deve conter 10 itens antes do 429 (obtido: ${queueRef.length})`);

    // 12.2 Dispara riverHandle429()
    const tsBefore429 = Date.now();
    window.riverHandle429(300);

    // 12.3 Verifica que riverAborted === true, riverQueue.length === 0 e window.__riverAborted === true
    assert(window.__feedExports.riverAborted === true, 'riverHandle429 deve definir riverAborted como true');
    assert(window.__riverAborted === true, 'riverHandle429 deve definir window.__riverAborted como true');
    assert(queueRef.length === 0, `riverHandle429 DEVE esvaziar imediatamente a fila riverQueue (restantes: ${queueRef.length})`);
    assert(window.__feedExports.riverPauseUntil >= tsBefore429 + 299000, 'riverHandle429 deve definir cooldown de no mínimo 5 minutos (300.000ms)');

    // 12.4 Verifica que chamadas a fetchDoc para navegação normal NÃO são bloqueadas pelo rate limit da timeline
    let networkFetchCalls12 = 0;
    const prevFetch12 = window.fetch;
    window.fetch = async () => {
        networkFetchCalls12++;
        return { ok: true, status: 200, text: async () => '<html><body>OK</body></html>' };
    };

    const docWhileAborted1 = await window.__fetchDoc('https://forums.socialmediagirls.com/threads/test-aborted-1.1/', {});
    const docWhileAborted2 = await window.__fetchDoc('https://forums.socialmediagirls.com/threads/test-aborted-2.1/', {});

    assert(docWhileAborted1 !== null, 'fetchDoc NÃO deve bloquear requisições normais quando riverAborted está ativo (chamada 1)');
    assert(docWhileAborted2 !== null, 'fetchDoc NÃO deve bloquear requisições normais quando riverAborted está ativo (chamada 2)');
    assert(networkFetchCalls12 === 2, `fetchDoc deve disparar requisições normais na rede sem ser bloqueado (chamadas feitas: ${networkFetchCalls12})`);

    // 12.5 Verifica que applyCronBackoff não emite múltiplos incrementos na mesma janela de 60s
    const consecutiveBefore = window.__feedSyncExports.cronConsecutive429;
    const intervalBefore = window.__feedSyncExports.currentCronIntervalMs;

    window.applyCronBackoff('HTTP 429 cascata 1');
    window.applyCronBackoff('HTTP 429 cascata 2');
    window.applyCronBackoff('HTTP 429 cascata 3');

    assert(window.__feedSyncExports.cronConsecutive429 === consecutiveBefore, `applyCronBackoff NÃO deve incrementar dentro de 60s (esperado ${consecutiveBefore}, obtido: ${window.__feedSyncExports.cronConsecutive429})`);
    assert(window.__feedSyncExports.currentCronIntervalMs === intervalBefore, `applyCronBackoff NÃO deve alterar intervalo dentro de 60s (esperado ${intervalBefore}, obtido: ${window.__feedSyncExports.currentCronIntervalMs})`);

    // Limpeza de estado após teste 12
    window.fetch = prevFetch12;
    window.__feedExports.riverAborted = false;
    window.__riverAborted = false;
    window.__feedExports.riverPauseUntil = 0;
    window.resetCronBackoff();

    console.log('Teste 12 concluído com sucesso!\n');

    // =========================================================================
    // TESTE 13: Feed/Timeline ImagePond Embeds & Ordem de Execução do processAll
    // =========================================================================
    console.log('--- TESTE 13: Feed/Timeline ImagePond Embeds & Ordem de Execução ---');

    const prevUrl13 = window.location.href;
    window.history.pushState({}, '', 'https://forums.socialmediagirls.com/?view=feed');
    document.documentElement.classList.remove('smg-thread');
    document.documentElement.classList.add('smg-home-page');
    document.documentElement.classList.add('smg-masonry-on');

    // 13.1 Cria um card de feed (.smg-fp-card) com múltiplos iframes do ImagePond
    const card13 = document.createElement('article');
    card13.className = 'smg-fp-card';
    const content13 = document.createElement('div');
    content13.className = 'smg-fp-content message-userContent';

    const ifr1 = document.createElement('iframe');
    ifr1.src = 'https://imagepond.net/videos/5312499-abc';
    content13.appendChild(ifr1);

    const ifr2 = document.createElement('iframe');
    ifr2.src = 'https://imagepond.net/video/987654-xyz';
    content13.appendChild(ifr2);

    card13.appendChild(content13);
    document.body.appendChild(card13);

    assert(typeof window.__processAll === 'function', '__processAll deve estar exposto em modo de teste');

    // 13.2 Executa processAll no card
    window.__processAll([card13]);

    // 13.3 Verifica se os iframes crus do imagepond foram substituídos por .generic2wide-iframe-div com .smg-turbo-slot
    const g2wWrappers = content13.querySelectorAll('.generic2wide-iframe-div');
    assert(g2wWrappers.length === 2, `Embeds do ImagePond devem ser convertidos em .generic2wide-iframe-div no feed (obtido: ${g2wWrappers.length})`);

    const slots = content13.querySelectorAll('.generic2wide-iframe-div .smg-turbo-slot');
    assert(slots.length === 2, `Cada wrapper deve conter um .smg-turbo-slot (obtido: ${slots.length})`);
    assert(g2wWrappers[0].dataset.ipId === '5312499-abc', 'O primeiro wrapper deve ter o ID correto do ImagePond');
    assert(g2wWrappers[1].dataset.ipId === '987654-xyz', 'O segundo wrapper deve ter o ID correto do ImagePond');

    // 13.4 Embeds/players são blocos de LARGURA TOTAL: o mosaico do post só agrupa imagens
    const grid13 = content13.querySelector('.auto-image-grid');
    assert(grid13 === null, 'buildPostGalleries não agrupa embeds/players: eles ficam fora do mosaico, no lugar de origem');
    const rawIframes = content13.querySelectorAll('iframe:not(.saint-iframe):not([data-ip-done])');
    assert(rawIframes.length === 0, `Nenhum iframe cru sem processamento deve sobrar no card (restantes: ${rawIframes.length})`);

    // Limpeza após teste 13
    card13.remove();
    document.documentElement.classList.remove('smg-home-page');
    window.history.pushState({}, '', prevUrl13);

    console.log('Teste 13 concluído com sucesso!\n');

    // =========================================================================
    // TESTE 14: buildPostGalleries exposto (o desaninhamento de grids saiu com o motor antigo: o novo nunca aninha)
    // =========================================================================
    console.log('--- TESTE 14: buildPostGalleries exposto ---');

    const buildPostGalleries = window.buildPostGalleries || window.__buildPostGalleries;
    assert(typeof buildPostGalleries === 'function', 'buildPostGalleries deve estar exposto em modo de teste');

    document.documentElement.classList.add('smg-masonry-on');


    console.log('Teste 14 concluído com sucesso!\n');

    // =========================================================================
    // TESTE 15: Otimizações de Performance (decorateThreadCard & autoExpandSpoilers)
    // =========================================================================
    console.log('--- TESTE 15: Otimizações de Performance & Anti-Layout-Thrashing ---');
    assert(window.__filterbarExports !== undefined, 'window.__filterbarExports deve estar exposto');
    const { decorateThreadCard } = window.__filterbarExports;
    assert(typeof decorateThreadCard === 'function', 'decorateThreadCard deve ser função');

    // 15.1 decorateThreadCard aplica data-smg-decorated e é idempotente
    const mockThreadRow = document.createElement('div');
    mockThreadRow.className = 'structItem structItem--thread';
    mockThreadRow.innerHTML = `
        <div class="structItem-cell structItem-cell--icon"><a href="/threads/test.1/"><img src="thumb.jpg"></a></div>
        <div class="structItem-cell structItem-cell--main">
            <div class="structItem-title"><a href="/threads/test.1/">Thread Title</a></div>
            <div class="structItem-minor">Minor info</div>
            <div class="structItem-startDate"><time>Yesterday</time></div>
        </div>
        <div class="structItem-cell structItem-cell--latest"><time>Today</time></div>
    `;
    document.body.appendChild(mockThreadRow);

    assert(!mockThreadRow.dataset.smgDecorated, 'Inicialmente row não deve ter data-smg-decorated');
    decorateThreadCard(mockThreadRow);
    assert(mockThreadRow.dataset.smgDecorated === '1', 'decorateThreadCard deve aplicar data-smg-decorated="1"');
    const datesRow = mockThreadRow.querySelector('.smg-card-dates');
    assert(datesRow !== null, 'smg-card-dates deve ter sido criado na 1ª execução');

    // Executa uma segunda vez e verifica que é no-op imediato
    datesRow.dataset.sentinel = 'keep';
    decorateThreadCard(mockThreadRow);
    assert(mockThreadRow.querySelector('.smg-card-dates').dataset.sentinel === 'keep', 'Segunda execução de decorateThreadCard não deve recriar elementos');
    mockThreadRow.remove();

    // 15.1b Botão de deixar de seguir em /watched/threads: mesmo botão "seguindo" da listagem do fórum + re-filtra a lista
    const { decorateWatchedThreadRow } = window.__filterbarExports;
    const prevUrl15 = window.location.href;
    window.history.pushState({}, '', '/watched/threads');
    const watchedRow15 = document.createElement('div');
    watchedRow15.className = 'structItem structItem--thread';
    watchedRow15.innerHTML = `
        <div class="structItem-cell structItem-cell--icon"><a href="/threads/watched-row.15/"><img src="thumb.jpg"></a></div>
        <div class="structItem-cell structItem-cell--main"><div class="structItem-title"><a href="/threads/watched-row.15/">Watched Row</a></div></div>
    `;
    document.body.appendChild(watchedRow15);
    decorateWatchedThreadRow(watchedRow15);
    const watchedBtn15 = watchedRow15.querySelector('.smg-thread-unwatch-btn');
    assert(watchedBtn15 && watchedBtn15.classList.contains('is-following'), 'Botão em /watched/threads deve ter o estado "seguindo" (is-following), igual ao do fórum');
    const prevReapply15 = window.smgReapplyFilters;
    let reapplied15 = 0;
    window.smgReapplyFilters = () => { reapplied15++; };
    watchedBtn15.click();
    await new Promise(resolve => setTimeout(resolve, 320));
    window.smgReapplyFilters = prevReapply15;
    assert(!watchedRow15.isConnected, 'Deixar de seguir em /watched/threads deve remover a linha');
    assert(reapplied15 > 0, 'Deixar de seguir em /watched/threads deve re-aplicar o filtro da lista (smgReapplyFilters)');
    window.history.pushState({}, '', prevUrl15);

    // 15.1c Seguir pela listagem grava o registro completo com updated_at em SEGUNDOS
    const followRow15 = document.createElement('div');
    followRow15.className = 'structItem structItem--thread';
    followRow15.innerHTML = `
        <div class="structItem-cell structItem-cell--icon"><a href="/threads/follow-row.16/"><img src="thumb.jpg"></a></div>
        <div class="structItem-cell structItem-cell--main"><div class="structItem-title"><a href="/threads/follow-row.16/">Follow Row</a></div></div>
    `;
    document.body.appendChild(followRow15);
    decorateThreadCard(followRow15);
    const followBtn15 = followRow15.querySelector('.smg-thread-unwatch-btn');
    assert(followBtn15 && !followBtn15.classList.contains('is-following'), 'Thread não seguida mostra o botão "seguir"');
    followBtn15.click();
    await new Promise(resolve => setTimeout(resolve, 20));
    const followedRec15 = mockStorage.followed.get('/threads/follow-row.16/');
    assert(followedRec15 && followedRec15.updated_at > 0 && followedRec15.updated_at < 1e11, `Seguir pela listagem deve gravar updated_at em segundos (obtido: ${followedRec15 && followedRec15.updated_at})`);
    assert(followedRec15 && Array.isArray(followedRec15.saved_pages) && followedRec15.last_page >= 1 && followedRec15.followed_at > 0 && followedRec15.followed_at < 1e11, 'Seguir pela listagem deve gravar o registro completo (saved_pages, last_page, followed_at)');
    followRow15.remove();

    // 15.2 autoExpandSpoilers expande sem getComputedStyle
    const autoExpandSpoilers = window.__autoExpandSpoilers;
    assert(typeof autoExpandSpoilers === 'function', 'autoExpandSpoilers deve ser função');

    const spoilerContainer = document.createElement('div');
    spoilerContainer.className = 'bbCodeSpoiler';
    const spoilerBtn = document.createElement('button');
    spoilerBtn.className = 'bbCodeSpoiler-button';
    spoilerBtn.textContent = 'Spoiler';
    const spoilerContent = document.createElement('div');
    spoilerContent.className = 'bbCodeSpoiler-content';
    spoilerContent.style.display = 'none';
    spoilerContainer.appendChild(spoilerBtn);
    spoilerContainer.appendChild(spoilerContent);
    document.body.appendChild(spoilerContainer);

    let spoilerClicked = false;
    spoilerBtn.addEventListener('click', () => { spoilerClicked = true; });

    autoExpandSpoilers([spoilerContainer]);
    assert(spoilerBtn.dataset.smgArrow === '1', 'autoExpandSpoilers deve adicionar data-smg-arrow no botão');
    assert(spoilerContainer.dataset.autoExpanded === 'true', 'autoExpandSpoilers deve marcar data-auto-expanded="true"');
    assert(spoilerClicked === true, 'autoExpandSpoilers deve ter acionado btn.click()');
    spoilerContainer.remove();

    // Article view: cards que chegam depois devem entrar na grade já existente, não criar uma segunda.
    console.log('--- TESTE PERF: Article view incremental ---');
    document.documentElement.classList.add('smg-threadlist');
    const articleParent = document.createElement('div');
    const makeArticlePreview = title => {
        const article = document.createElement('article');
        article.className = 'message--articlePreview';
        article.innerHTML = '<div class="articlePreview-main"><div class="articlePreview-title"><a href="/threads/' + title.toLowerCase() + '.1/">' + title + '</a></div></div>';
        return article;
    };
    articleParent.appendChild(makeArticlePreview('Primeiro'));
    document.body.appendChild(articleParent);
    window.__processAll([articleParent]);
    const firstArticleGrid = articleParent.nextElementSibling;
    articleParent.appendChild(makeArticlePreview('Segundo'));
    window.__processAll([articleParent.lastElementChild]);
    assert(document.querySelectorAll('.smg-article-grid').length === 1, 'Cards incrementais devem reutilizar a grade de article view existente');
    assert(firstArticleGrid?.querySelectorAll('.message--articlePreview').length === 2, 'A grade existente deve conter os cards antigos e os novos');
    articleParent.remove();
    document.documentElement.classList.remove('smg-threadlist');

    console.log('Teste 15 concluído com sucesso!\n');

    // =========================================================================
    // TESTE 16: RedGifs (o player próprio assume o loader antes do autoload nativo)
    // =========================================================================
    console.log('--- TESTE 16: RedGifs & Dono do Loader ---');
    const redgifsLoader = document.createElement('div');
    redgifsLoader.className = 'generic2wide-iframe-div';
    redgifsLoader.setAttribute('onclick', 'this.dataset.nativeClicked = "1"; /* https://www.redgifs.com/ifr/TestRedGifs123 */');
    let nativeRedgifsClicks = 0;
    redgifsLoader.addEventListener('click', () => { nativeRedgifsClicks++; });

    window.__processAll([redgifsLoader]);
    assert(redgifsLoader.querySelector('.smg-rg') !== null, 'Player próprio do RedGifs deve assumir o loader');
    assert(redgifsLoader.dataset.rgDone === '1', 'Loader do RedGifs deve ser marcado como processado');
    assert(nativeRedgifsClicks === 0, 'Autoload nativo não deve clicar no loader antes do player próprio');

    console.log('Teste 16 concluído com sucesso!\n');

    // =========================================================================
    // TESTE 17: RedGifs mostra fallback da thumbnail enquanto o blob está pendente
    // =========================================================================
    console.log('--- TESTE 17: RedGifs & Fallback Imediato da Thumbnail ---');
    assert(window.__redgifsExports !== undefined, 'window.__redgifsExports deve estar exposto');
    const { rgBuild, rgSetPoster } = window.__redgifsExports;
    assert(typeof rgBuild === 'function', 'rgBuild deve ser função');
    assert(typeof rgSetPoster === 'function', 'rgSetPoster deve ser função');

    const posterFixture = rgBuild('ThumbnailFallback123');
    document.body.appendChild(posterFixture.wrap);
    const posterFallbackUrl = 'https://media.redgifs.com/ThumbnailFallback123-poster.jpg';
    rgSetPoster(posterFixture.video, posterFallbackUrl);
    assert(posterFixture.video.poster === posterFallbackUrl, 'Thumbnail direta deve ser definida imediatamente enquanto o blob está pendente');
    posterFixture.wrap.remove();

    const originalCreateObjectURL = window.URL.createObjectURL;
    const originalRevokeObjectURL = window.URL.revokeObjectURL;
    window.URL.createObjectURL = () => 'blob:cached-redgifs-poster';
    window.URL.revokeObjectURL = () => {};
    const cachedPosterFixture = rgBuild('CachedPoster123');
    document.body.appendChild(cachedPosterFixture.wrap);
    window.__redgifsExports.cacheSet(window.__redgifsExports.rgPosterCache, 'cachedposter123', { blob: new window.Blob(['poster']) });
    rgSetPoster(cachedPosterFixture.video, 'https://media.redgifs.com/CachedPoster123-poster.jpg');
    assert(cachedPosterFixture.video.poster === 'blob:cached-redgifs-poster', 'Poster em cache deve ser aplicado por object URL, nunca como [object Object]');
    cachedPosterFixture.wrap.remove();
    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;

    // =========================================================================
    // TESTE 18: Masonry usa um meio-termo de colunas e limita verticais sem deformar
    // =========================================================================
    console.log('--- TESTE 18: Masonry & Proporção das Mídias Verticais ---');
    window.innerWidth = 1600;
    document.documentElement.classList.remove('smg-aldock-on');
    assert(window.__masonryExports !== undefined, 'window.__masonryExports deve estar exposto');
    const injectedStyles18 = Array.from(document.querySelectorAll('style')).map(style => style.textContent).join('\n');
    assert(injectedStyles18.includes('--smg-media-h: min(70vh, 750px);'), 'O teto de mídia deve ser min(70vh, 750px)');
    assert(injectedStyles18.includes('.generic2wide-iframe-div .smg-rg { margin: 0 auto !important; }'), 'Embeds de vídeo devem possuir margin: 0 auto !important');
    assert(injectedStyles18.includes('span[data-s9e-mediaembed] .smg-rg,'), 'Regra de embed data-s9e-mediaembed deve estar presente');
    assert(injectedStyles18.includes('.smg-turbo-slot > .smg-rg { margin: 0 auto !important; }'), 'Slot turbo deve possuir margin: 0 auto !important');
    assert(!injectedStyles18.includes('margin: 0 0 8px !important;'), 'Masonry não deve conter margin: 0 0 8px !important');
    assert(injectedStyles18.includes('img.bbImage.smg-vert'), 'Masonry deve possuir regra específica para imagens verticais');
    assert(injectedStyles18.includes('width: auto !important;'), 'Mídia vertical deve poder reduzir a largura sem deformar a altura');
    assert(injectedStyles18.includes('margin-left: auto !important;'), 'Mídia vertical deve ser centralizada horizontalmente');
    assert(injectedStyles18.includes('--smg-ald-w: 360px;'), 'Sidebar deve ter fallback compacto de 360px');

    // =========================================================================
    // TESTE 19: Contexto de página e contrato do paint gate
    // =========================================================================
    console.log('--- TESTE 19: Contexto de Página & Paint Gate ---');
    assert(window.__paintExports !== undefined, 'window.__paintExports deve estar exposto');
    const { classifyPaintPage, paintSkeletonMarkup, paintRailMarkup, paintHasFatalError, paintPageIsReady, PAINT_PAGE_KINDS } = window.__paintExports;
    assert(typeof classifyPaintPage === 'function', 'classifyPaintPage deve ser função');
    assert(typeof paintSkeletonMarkup === 'function', 'paintSkeletonMarkup deve ser função');
    assert(typeof paintRailMarkup === 'function', 'paintRailMarkup deve ser função');
    assert(typeof paintHasFatalError === 'function', 'paintHasFatalError deve ser função');
    assert(typeof paintPageIsReady === 'function', 'paintPageIsReady deve ser função');

    const originalTemplate19 = document.documentElement.getAttribute('data-template');
    const originalUrl19 = window.location.href;
    const setPage19 = (url, template) => {
        window.history.pushState({}, '', url);
        if (template == null) document.documentElement.removeAttribute('data-template');
        else document.documentElement.setAttribute('data-template', template);
        return classifyPaintPage();
    };

    assert(setPage19('/threads/test-thread.12345/', 'thread_view').kind === 'thread', 'Thread deve usar o contexto de thread');
    assert(setPage19('/', 'forum_list').kind === 'home', 'Home deve usar o contexto de home');
    assert(setPage19('/?view=feed', 'forum_list').kind === 'timeline', 'Home com ?view=feed deve usar o contexto de timeline');
    assert(setPage19('/watched/threads', 'watched_threads_list').kind === 'following', 'Seguindo deve usar o contexto de following');
    assert(setPage19('/account/bookmarks', 'account_bookmarks').kind === 'bookmarks', 'Bookmarks deve usar o contexto de bookmarks');
    assert(setPage19('/forums/general.1/', 'forum_view').kind === 'listing', 'Fórum deve usar o contexto de listing');

    const homeSkeleton19 = paintSkeletonMarkup('home');
    const threadSkeleton19 = paintSkeletonMarkup('thread');
    const listingSkeleton19 = paintSkeletonMarkup('listing');
    const followingSkeleton19 = paintSkeletonMarkup('following');
    const timelineSkeleton19 = paintSkeletonMarkup('timeline');
    const bookmarksSkeleton19 = paintSkeletonMarkup('bookmarks');
    assert((homeSkeleton19.match(/smg-home-skeleton-tile/g) || []).length >= 20, 'Skeleton da home deve reservar ao menos 20 cards de seção');
    assert(homeSkeleton19.includes('smg-home-skeleton-section-divider'), 'Skeleton da home deve desenhar dividers nos títulos das seções');
    assert(threadSkeleton19.includes('smg-page-skeleton-post'), 'Skeleton de thread deve reservar cards de post');
    assert(threadSkeleton19.includes('smg-page-skeleton-bottom-nav'), 'Skeleton de thread deve reservar a navbar mobile');
    assert(homeSkeleton19.includes('smg-page-skeleton-bottom-nav'), 'Skeleton da home deve reservar a navbar mobile (a mesma das outras páginas)');
    assert(paintRailMarkup().includes('smg-page-skeleton-rail-row'), 'Skeleton deve possuir linhas para a sidebar persistida');
    assert((threadSkeleton19.match(/smg-page-skeleton-post/g) || []).length >= 6, 'Skeleton de thread deve preencher a altura inicial com posts');
    assert((listingSkeleton19.match(/smg-page-skeleton-row/g) || []).length >= 12, 'Skeleton de listagem deve preencher a altura inicial com linhas');
    assert((followingSkeleton19.match(/smg-page-skeleton-row/g) || []).length >= 12, 'Skeleton de seguindo deve preencher a altura inicial com linhas');
    assert((timelineSkeleton19.match(/smg-page-skeleton-feed-card/g) || []).length >= 8, 'Skeleton de timeline deve preencher a altura inicial com cards');
    assert((bookmarksSkeleton19.match(/smg-page-skeleton-feed-card/g) || []).length >= 8, 'Skeleton de salvos deve preencher a altura inicial com cards');

    const paintCss19 = Array.from(document.querySelectorAll('style')).map(style => style.textContent).join('\n');
    const originalTitle19 = document.title;
    document.title = '500 Internal Server Error';
    assert(paintHasFatalError(), 'Paint gate deve reconhecer erro HTTP 500 pelo título da resposta');
    document.title = originalTitle19;
    assert(paintCss19.includes('html.smg-page-pending body > *'), 'Paint gate deve esconder toda a árvore nativa desde o primeiro paint');
    assert(paintCss19.includes('html.smg-page-pending body {'), 'Paint gate deve bloquear o body inteiro durante a composição');
    assert(paintCss19.includes('html.smg-page-pending #smg-topbar-wrap'), 'Chrome customizado não deve aparecer antes do handoff atômico');
    assert(paintCss19.includes('overflow: hidden !important'), 'Paint gate deve impedir scroll e scrollbar da página antiga durante a composição');
    assert(paintCss19.includes('html.smg-page-pending #smg-page-skeleton'), 'Skeleton deve ser a camada visível durante o paint gate');
    assert(paintCss19.includes('html.smg-page-pending.smg-aldock-on #smg-page-skeleton-rail'), 'Skeleton deve refletir a sidebar persistida');
    assert(paintCss19.includes('html.smg-critical-paint body > *'), 'Camada crítica deve esconder o DOM nativo antes da CSS completa');
    assert(paintCss19.includes('html.smg-critical-paint body {'), 'Camada crítica deve bloquear o body no primeiro statement');
    assert(!document.documentElement.classList.contains('smg-critical-paint'), 'Camada crítica deve ser transferida para o paint gate após a CSS completa');
    assert(paintCss19.includes('min-height: 100dvh'), 'Skeleton deve ocupar a altura útil da viewport');
    assert(paintCss19.includes('@media (max-width: 800px)'), 'Skeleton deve acompanhar o breakpoint mobile da topbar');
    assert(paintCss19.includes('position: absolute; left: 0; right: 0; bottom: 0'), 'Navbar do skeleton deve ocupar a base inteira do shell');
    assert(paintCss19.includes('z-index: var(--smg-z-topbar)'), 'Skeleton deve ficar acima da página nativa durante a composição');

    // -------------------------------------------------------------------------
    // Paint Gate Fallback & Setup State no River
    // -------------------------------------------------------------------------
    const timelineCtx = { kind: (PAINT_PAGE_KINDS && PAINT_PAGE_KINDS.TIMELINE) || 'timeline' };
    let riverEl = document.getElementById('smg-river');
    if (!riverEl) {
        riverEl = document.createElement('div');
        riverEl.id = 'smg-river';
        document.body.appendChild(riverEl);
    }
    riverEl.dataset.smgPaintReady = '0';

    // 2. showSetupState define smgPaintReady = "1" no #smg-river
    let riverListEl = riverEl.querySelector('.smg-fp-list');
    if (!riverListEl) {
        riverListEl = document.createElement('div');
        riverListEl.className = 'smg-fp-list';
        riverEl.appendChild(riverListEl);
    }
    window.__feedExports.riverList = riverListEl;
    window.__feedExports.riverFirstPainted = false;
    riverEl.dataset.smgPaintReady = '0';
    assert(typeof window.__feedExports.showSetupState === 'function', 'showSetupState deve estar exposto em __feedExports');
    window.__feedExports.showSetupState();
    assert(riverEl.dataset.smgPaintReady === '1', 'showSetupState define smgPaintReady = "1" no #smg-river');
    assert(!!riverListEl.querySelector('.smg-fp-setup'), 'riverList deve conter .smg-fp-setup após showSetupState');

    // 3. paintPageIsReady retorna true quando riverList contém .smg-fp-setup e smgPaintReady === '1'
    if (!document.getElementById('smg-topbar-wrap')) {
        const topbarMock = document.createElement('div');
        topbarMock.id = 'smg-topbar-wrap';
        document.body.appendChild(topbarMock);
    }
    if (!document.getElementById('smg-aldock')) {
        const dockMock = document.createElement('div');
        dockMock.id = 'smg-aldock';
        document.body.appendChild(dockMock);
    }
    assert(paintPageIsReady(timelineCtx) === true, 'paintPageIsReady retorna true quando riverList contém .smg-fp-setup e smgPaintReady === "1"');

    window.history.pushState({}, '', originalUrl19);
    if (originalTemplate19 == null) document.documentElement.removeAttribute('data-template');
    else document.documentElement.setAttribute('data-template', originalTemplate19);

    // =========================================================================
    // TESTE 20: Desencapsulamento de Proxy, Links Externos e Interceptação de Clique
    // =========================================================================
    console.log('--- TESTE 20: Proxy Helpers, Links Externos e fhBuildCardNow ---');

    const b64decode = window.__b64decode;
    const rawParam = window.__rawParam;
    const decodeProxyHref = window.__decodeProxyHref;
    const resolveProxyHref = window.__resolveProxyHref;
    const absUrl = window.__absUrl;

    assert(typeof b64decode === 'function', 'b64decode deve estar disponível');
    assert(typeof decodeProxyHref === 'function', 'decodeProxyHref deve estar disponível');
    assert(typeof resolveProxyHref === 'function', 'resolveProxyHref deve estar disponível');
    assert(typeof absUrl === 'function', 'absUrl deve estar disponível');

    // 1. b64decode: base64 padrão, url-safe e unpadded
    assert(b64decode('aHR0cHM6Ly9leGFtcGxlLmNvbQ==') === 'https://example.com', 'b64decode deve decodificar base64 com padding padrão');
    assert(b64decode('aHR0cHM6Ly9leGFtcGxlLmNvbQ') === 'https://example.com', 'b64decode deve decodificar base64 sem padding (unpadded)');
    // URL-safe (- e _)
    const sampleUrl = 'https://example.com/?query=1&test=true';
    const b64UrlSafe = Buffer.from(sampleUrl).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    assert(b64decode(b64UrlSafe) === sampleUrl, 'b64decode deve decodificar base64 url-safe unpadded');

    // 2. decodeProxyHref & resolveProxyHref
    const gotoProxy = '/goto/link-confirmation?url=' + Buffer.from('https://external-site.org/path').toString('base64');
    assert(decodeProxyHref(gotoProxy) === 'https://external-site.org/path', 'decodeProxyHref deve decodificar /goto/link-confirmation');
    assert(resolveProxyHref(gotoProxy) === 'https://external-site.org/path', 'resolveProxyHref deve resolver /goto/link-confirmation');

    const redirectPlain = '/redirect/?to=https%3A%2F%2Fdestination.com%2Fsub';
    assert(decodeProxyHref(redirectPlain) === 'https://destination.com/sub', 'decodeProxyHref deve decodificar /redirect/?to com plain URL');
    assert(resolveProxyHref(redirectPlain) === 'https://destination.com/sub', 'resolveProxyHref deve resolver /redirect/?to com plain URL');

    const proxyPhp = '/proxy.php?link=https%3A%2F%2Fimage-site.net%2Ffile.jpg';
    assert(decodeProxyHref(proxyPhp) === 'https://image-site.net/file.jpg', 'decodeProxyHref deve decodificar /proxy.php?link');
    assert(resolveProxyHref(proxyPhp) === 'https://image-site.net/file.jpg', 'resolveProxyHref deve resolver /proxy.php?link');

    const linkProxy = '/link-proxy/?url=' + Buffer.from('https://proxy-target.com').toString('base64');
    assert(decodeProxyHref(linkProxy) === 'https://proxy-target.com', 'decodeProxyHref deve decodificar /link-proxy/?url');
    assert(resolveProxyHref(linkProxy) === 'https://proxy-target.com', 'resolveProxyHref deve resolver /link-proxy/?url');

    // Link externo direto NÃO proxy
    const directExt = 'https://www.instagram.com/p/DB12345/';
    assert(decodeProxyHref(directExt) === null, 'decodeProxyHref deve retornar null para link externo direto não-proxy');
    assert(resolveProxyHref(directExt) === directExt, 'resolveProxyHref DEVE retornar o link original para link externo direto');

    // absUrl
    assert(absUrl('') === '', 'absUrl("") NUNCA deve resolver para location.href');
    assert(absUrl('   ') === '', 'absUrl de whitespace deve retornar vazio');
    assert(absUrl('https://example.com') === 'https://example.com/', 'absUrl de URL absoluta válida deve ser preservada');

    // 3. Teste de clique e interceptação de link externo (bindProxyClick)
    const extLink = document.createElement('a');
    extLink.className = 'link link--external';
    extLink.href = 'https://forums.socialmediagirls.com/goto/link-confirmation?url=' + Buffer.from('https://final-dest.com').toString('base64');
    extLink.setAttribute('data-proxy-href', extLink.href);
    extLink.setAttribute('data-blank-handler', 'true');
    document.body.appendChild(extLink);

    let stopImmediateCalled = false;
    const clickEvt = new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    const originalStopImmediate = clickEvt.stopImmediatePropagation;
    clickEvt.stopImmediatePropagation = function() {
        stopImmediateCalled = true;
        originalStopImmediate.call(this);
    };

    extLink.dispatchEvent(clickEvt);

    assert(stopImmediateCalled, 'bindProxyClick deve chamar stopImmediatePropagation no clique esquerdo em link externo/proxy');
    assert(extLink.getAttribute('href') === 'https://final-dest.com', 'bindProxyClick deve reescrever href para o destino real');
    assert(extLink.target === '_blank', 'bindProxyClick deve garantir target="_blank"');
    assert(extLink.rel.includes('noopener'), 'bindProxyClick deve garantir rel com noopener');
    assert(!extLink.hasAttribute('data-proxy-href'), 'bindProxyClick deve desarmar data-proxy-href');
    assert(!extLink.hasAttribute('data-blank-handler'), 'bindProxyClick deve desarmar data-blank-handler');
    extLink.remove();

    // 4. Teste unlazyImageLinks ignorando blocos protegidos
    const unfurlBlock = document.createElement('div');
    unfurlBlock.className = 'bbCodeBlock bbCodeBlock--unfurl';
    const unfurlTitleLink = document.createElement('a');
    unfurlTitleLink.className = 'link link--external';
    unfurlTitleLink.href = 'https://twitter.com/someuser/status/123';
    unfurlTitleLink.textContent = 'Post title on X';
    unfurlBlock.appendChild(unfurlTitleLink);
    document.body.appendChild(unfurlBlock);

    if (typeof window.__processAll === 'function') {
        window.__processAll([unfurlBlock]);
    }
    assert(unfurlTitleLink.textContent === 'Post title on X', 'unlazyImageLinks NÃO deve apagar ou corromper o texto de link em .bbCodeBlock--unfurl');
    unfurlBlock.remove();

    // 5. Teste buildTwitterCardDom: referrerpolicy="no-referrer" em vídeo, imagem e avatar
    assert(typeof window.buildTwitterCardDom === 'function', 'buildTwitterCardDom deve estar exposto em __TEST_MODE__');
    const mockVideoTweet = {
        text: 'Tweet with video',
        author: {
            name: 'Test User',
            screen_name: 'testuser',
            avatar_url: 'https://pbs.twimg.com/profile_images/123/avatar.jpg'
        },
        media: {
            videos: [{
                url: 'https://video.twimg.com/vid.mp4',
                thumbnail_url: 'https://pbs.twimg.com/thumb.jpg'
            }],
            photos: []
        }
    };
    const cardVideo = window.buildTwitterCardDom(mockVideoTweet, 'https://x.com/testuser/status/123');
    const avImg = cardVideo.querySelector('.smg-tw-avatar img');
    assert(avImg && (avImg.getAttribute('referrerpolicy') === 'no-referrer' || avImg.referrerPolicy === 'no-referrer'), 'Avatar do card Twitter deve conter referrerpolicy="no-referrer"');
    const videoEl = cardVideo.querySelector('video');
    assert(videoEl && (videoEl.getAttribute('referrerpolicy') === 'no-referrer' || videoEl.referrerPolicy === 'no-referrer'), 'Video do card Twitter deve conter referrerpolicy="no-referrer"');
    const playOverlay = cardVideo.querySelector('.smg-tw-play-overlay');
    assert(playOverlay, 'Card de vídeo do Twitter deve conter overlay de play (.smg-tw-play-overlay)');

    const mockPhotoTweet = {
        text: 'Tweet with photo',
        author: {
            name: 'Test User',
            screen_name: 'testuser',
            avatar_url: 'https://pbs.twimg.com/profile_images/123/avatar.jpg'
        },
        media: {
            videos: [],
            photos: [{ url: 'https://pbs.twimg.com/photo.jpg' }]
        }
    };
    const cardPhoto = window.buildTwitterCardDom(mockPhotoTweet, 'https://x.com/testuser/status/456');
    const imgEl = cardPhoto.querySelector('.smg-tw-media img');
    assert(imgEl && (imgEl.getAttribute('referrerpolicy') === 'no-referrer' || imgEl.referrerPolicy === 'no-referrer'), 'Imagem do card Twitter deve conter referrerpolicy="no-referrer"');

    const mockMultiPhotoTweet = {
        text: 'Tweet with multiple photos',
        author: {
            name: 'Test User',
            screen_name: 'testuser',
            avatar_url: 'https://pbs.twimg.com/profile_images/123/avatar.jpg'
        },
        media: {
            videos: [],
            photos: [
                { url: 'https://pbs.twimg.com/photo1.jpg' },
                { url: 'https://pbs.twimg.com/photo2.jpg' }
            ]
        }
    };
    const cardMulti = window.buildTwitterCardDom(mockMultiPhotoTweet, 'https://x.com/testuser/status/789');
    const gridImgs = cardMulti.querySelectorAll('.smg-tw-media-grid img');
    assert(gridImgs.length === 2 && Array.from(gridImgs).every(i => i.getAttribute('referrerpolicy') === 'no-referrer' || i.referrerPolicy === 'no-referrer'), 'Imagens da grade do Twitter devem conter referrerpolicy="no-referrer"');

    // =========================================================================
    // TESTE 21: Filtragem Estrita de Posts vs Comentários (isThreadPostElement & riverParsePost)
    // =========================================================================
    console.log('--- TESTE 21: isThreadPostElement & riverParsePost ---');
    const isThreadPostElement = window.isThreadPostElement || (window.__feedExports && window.__feedExports.isThreadPostElement);
    const riverParsePost = window.__feedExports && window.__feedExports.riverParsePost;

    assert(typeof isThreadPostElement === 'function', 'isThreadPostElement deve ser uma função exportada');
    assert(typeof riverParsePost === 'function', 'riverParsePost deve ser uma função exportada');

    // 1. Elementos de comentário retornam false em isThreadPostElement
    const commentEl1 = document.createElement('div');
    commentEl1.className = 'comment smg-cc';
    assert(isThreadPostElement(commentEl1) === false, '.comment deve retornar false em isThreadPostElement');

    const commentRow = document.createElement('div');
    commentRow.className = 'message-responseRow';
    const commentInner = document.createElement('div');
    commentRow.appendChild(commentInner);
    assert(isThreadPostElement(commentInner) === false, 'Elemento dentro de .message-responseRow deve retornar false em isThreadPostElement');

    const quickEditComment = document.createElement('div');
    quickEditComment.className = 'js-quickEditTargetComment js-post lbContainer js-lbContainer';
    assert(isThreadPostElement(quickEditComment) === false, '.js-quickEditTargetComment.js-post deve retornar false em isThreadPostElement');

    const commentByAttr = document.createElement('div');
    commentByAttr.className = 'message--post';
    commentByAttr.setAttribute('data-content', 'comment-1234');
    assert(isThreadPostElement(commentByAttr) === false, 'Elemento com data-content="comment-1234" deve retornar false em isThreadPostElement');

    const commentById = document.createElement('div');
    commentById.className = 'message--post';
    commentById.id = 'comment-5678';
    assert(isThreadPostElement(commentById) === false, 'Elemento com id="comment-5678" deve retornar false em isThreadPostElement');

    // 2. Posts reais retornam true em isThreadPostElement
    const realPost1 = document.createElement('article');
    realPost1.className = 'message message--post js-post';
    realPost1.id = 'js-post-123';
    realPost1.setAttribute('data-content', 'post-123');
    assert(isThreadPostElement(realPost1) === true, 'Post real com article.message--post deve retornar true em isThreadPostElement');

    const realPost2 = document.createElement('div');
    realPost2.className = 'message message--post';
    realPost2.id = 'post-456';
    realPost2.setAttribute('data-content', 'post-456');
    assert(isThreadPostElement(realPost2) === true, 'Post real com .message--post deve retornar true em isThreadPostElement');

    // 3. riverParsePost retorna null para nós de comentários
    const commentPostDom = document.createElement('div');
    commentPostDom.className = 'message-responseRow';
    commentPostDom.innerHTML = `
        <div class="comment smg-cc">
            <div class="js-quickEditTargetComment js-post lbContainer js-lbContainer">
                <article class="comment-body js-selectToQuote">
                    <div class="bbWrapper">here are some links</div>
                </article>
            </div>
        </div>`;
    const quickEditTarget = commentPostDom.querySelector('.js-quickEditTargetComment');
    const metaDummy = { title: 'Test Thread', prefixesHtml: '', thumb: '' };
    assert(riverParsePost(quickEditTarget, metaDummy, 'https://example.com/threads/test.123/') === null, 'riverParsePost deve retornar null para nós de comentário (.js-quickEditTargetComment)');
    assert(riverParsePost(commentPostDom, metaDummy, 'https://example.com/threads/test.123/') === null, 'riverParsePost deve retornar null para container de comentário (.message-responseRow)');

    // 4. riverParsePost em um post com links internos para /post-99999 dentro de sua .bbWrapper extrai o ID correto do post e NÃO o ID do link contido no texto
    const postWithInternalLink = document.createElement('article');
    postWithInternalLink.className = 'message message--post js-post';
    postWithInternalLink.id = 'js-post-77777';
    postWithInternalLink.setAttribute('data-content', 'post-77777');
    postWithInternalLink.innerHTML = `
        <div class="message-inner">
            <div class="message-cell message-cell--main">
                <header class="message-attribution">
                    <a href="/threads/test.123/post-77777">#1</a>
                    <time datetime="2026-09-01T12:00:00Z" data-timestamp="1788264000">Sep 1, 2026</time>
                </header>
                <div class="message-userContent">
                    <div class="bbWrapper">
                        Check this other post: <a href="https://forums.socialmediagirls.com/threads/minhas-edit.226638/post-99999" class="link link--internal">https://forums.socialmediagirls.com/threads/minhas-edit.226638/post-99999</a>
                        <div class="message-responses">
                            <div class="message-responseRow">
                                <div class="comment smg-cc">nested comment text</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    const parsedPost = riverParsePost(postWithInternalLink, metaDummy, 'https://forums.socialmediagirls.com/threads/test.123/');
    assert(parsedPost !== null, 'riverParsePost deve parsear post legítimo');
    assert(parsedPost.post_id === '77777', `riverParsePost deve extrair o post_id real do post (esperado: "77777", obtido: "${parsedPost ? parsedPost.post_id : ''}") e NÃO o link interno (/post-99999)`);
    assert(!parsedPost.content_html.includes('nested comment text'), 'riverParsePost deve remover nós de comentários residuais do content_html');

    // =========================================================================
    // TESTE 22: Controle de Visualização/Notificação (last_seen_at) e Sincronização Unificada
    // =========================================================================
    console.log('--- TESTE 22: sincronização unificada dos seguidos ---');
    // 3. Estado: tópicos seguidos de exemplo
    mockStorage.followed.clear();
    const mockDockItems = [
        { path: '/threads/read-older/', thread_name: 'Read Older', updated_at: 1000, unread: false },
        { path: '/threads/unread-seen-newer/', thread_name: 'Unread Seen Newer', updated_at: 9000, unread: true },
        { path: '/threads/unread-seen-older/', thread_name: 'Unread Seen Older', updated_at: 8000, unread: true },
        { path: '/threads/unread-tie/', thread_name: 'Unread Tie', updated_at: 4000, unread: true },
        { path: '/threads/read-updated-newer/', thread_name: 'Read Updated Newer', updated_at: 3000, unread: false },
        { path: '/threads/read-tie/', thread_name: 'Read Tie', updated_at: 2000, unread: false }
    ];
    mockDockItems.forEach(it => mockStorage.followed.set(it.path, it));

    // 4. Posts adicionados via syncThreadPage alimentam a timeline E atualizam updated_at para o timestamp do post
    const testSyncThread = {
        path: '/threads/sync-test.999/',
        thread_name: 'Sync Test',
        updated_at: 1000,
        saved_pages: []
    };
    mockStorage.followed.set(testSyncThread.path, testSyncThread);

    const prevFetchSyncTest = window.fetch;
    window.fetch = async (url, opts) => {
        const urlStr = typeof url === 'string' ? url : (url && url.url) || '';
        if (urlStr.includes('/threads/sync-test.999/')) {
            return {
                ok: true,
                status: 200,
                text: async () => `<html><body>
                    <h1 class="p-title-value">Sync Test</h1>
                    <article class="message message--post" id="js-post-99901" data-content="post-99901">
                        <span class="u-anchorTarget" id="post-99901"></span>
                        <div class="message-inner">
                            <div class="message-cell message-cell--user"><a class="username">Tester</a></div>
                            <div class="message-cell message-cell--main"><div class="message-userContent">Content 999</div></div>
                            <div class="message-attribution"><time data-timestamp="9500">Agora</time></div>
                        </div>
                    </article>
                </body></html>`,
                json: async () => ({}),
                url: urlStr
            };
        }
        return prevFetchSyncTest(url, opts);
    };

    const origTimelineCount = mockStorage.timeline.size;
    const syncResult = await window.__feedSyncExports.syncThreadPage(testSyncThread, 1);
    window.fetch = prevFetchSyncTest;
    assert(syncResult > 0, `syncThreadPage deve adicionar posts (obtido: ${syncResult})`);
    assert(mockStorage.timeline.size > origTimelineCount, 'Timeline deve receber novos posts após syncThreadPage');

    const syncedThreadFromDb = mockStorage.followed.get(testSyncThread.path);
    assert(syncedThreadFromDb.updated_at === 9500, `updated_at do tópico seguido deve ser atualizado para 9500 pelo post real (obtido: ${syncedThreadFromDb.updated_at})`);
    assert(syncedThreadFromDb.unread === true, 'Tópico sincronizado com post novo deve ficar unread = true');

    // 5. dbFollowedMarkAllSeen() atualiza todos os tópicos e limpa unread
    const { dbFollowedMarkAllSeen } = window.__feedDbExports;
    assert(typeof dbFollowedMarkAllSeen === 'function', 'dbFollowedMarkAllSeen deve estar exportada');
    mockStorage.followed.set('/threads/unread-batch-1/', {
        path: '/threads/unread-batch-1/',
        updated_at: 4000,
        unread: true
    });
    mockStorage.followed.set('/threads/unread-batch-2/', {
        path: '/threads/unread-batch-2/',
        updated_at: 6000,
        unread: true
    });
    await dbFollowedMarkAllSeen();
    const batch1 = mockStorage.followed.get('/threads/unread-batch-1/');
    const batch2 = mockStorage.followed.get('/threads/unread-batch-2/');
    assert(batch1.unread === false, 'dbFollowedMarkAllSeen deve marcar batch-1 como unread = false');
    assert(batch2.unread === false, 'dbFollowedMarkAllSeen deve marcar batch-2 como unread = false');

    // =========================================================================
    // TESTE 23: Regras de largura 100% da Timeline e last_seen_at no primeiro processamento
    // =========================================================================
    console.log('--- TESTE 23: Largura 100% da timeline e last_seen_at na primeira ingestão ---');

    // 1. Verificar regras CSS de largura total para html.smg-watched-feed e html:not(.smg-home)
    assert(scriptContent.includes('html.smg-watched-feed .p-body-main--withSidebar'), 'script.js deve conter regra de largura total para .p-body-main--withSidebar na timeline');
    assert(scriptContent.includes('html.smg-watched-feed .p-body-content'), 'script.js deve conter regra de largura total para .p-body-content na timeline');
    assert(scriptContent.includes('html:not(.smg-home) .p-body-sidebar'), 'script.js deve esconder a sidebar em qualquer página fora da home (html:not(.smg-home))');
    assert(scriptContent.includes('html.smg-watched-feed .block--category'), 'script.js deve conter regra escondendo .block--category na timeline');

    // 2. Testar ingestão pela primeira vez de um tópico (!prev) via ingestWatchedPageToFollowed
    const firstIngestHtml = `<html><body>
        <div class="structItem structItem--thread">
            <div class="structItem-title">
                <a href="/threads/brand-new-thread.7777/">Brand New Thread</a>
            </div>
            <div class="structItem-cell--latest">
                <time data-timestamp="8888">Hoje às 20:00</time>
            </div>
        </div>
    </body></html>`;
    const firstIngestDoc = new JSDOM(firstIngestHtml).window.document;
    await window.__filterbarExports.ingestWatchedPageToFollowed(firstIngestDoc);
    const brandNew = mockStorage.followed.get('/threads/brand-new-thread.7777/');
    assert(brandNew !== undefined, 'Tópico novo deve ter sido salvo no banco');
    assert(brandNew.updated_at === 8888, `updated_at deve ser 8888 (obtido: ${brandNew.updated_at})`);
    assert(brandNew.unread === false, `Na primeira ingestão (!prev), unread deve ser false (obtido: ${brandNew.unread})`);

    // 3. Testar syncThreadPage em tópico sem last_seen_at prévio
    const threadWithoutSeen = {
        path: '/threads/no-seen.888/',
        thread_name: 'No Seen Thread',
        updated_at: 0,
        saved_pages: []
    };
    mockStorage.followed.set(threadWithoutSeen.path, threadWithoutSeen);
    const prevFetchNoSeen = window.fetch;
    window.fetch = async (url, opts) => {
        const urlStr = typeof url === 'string' ? url : (url && url.url) || '';
        if (urlStr.includes('/threads/no-seen.888/')) {
            return {
                ok: true,
                status: 200,
                text: async () => `<html><body>
                    <h1 class="p-title-value">No Seen Thread</h1>
                    <article class="message message--post" id="js-post-88801" data-content="post-88801">
                        <span class="u-anchorTarget" id="post-88801"></span>
                        <div class="message-inner">
                            <div class="message-cell message-cell--user"><a class="username">Tester</a></div>
                            <div class="message-cell message-cell--main"><div class="message-userContent">Content 888</div></div>
                            <div class="message-attribution"><time data-timestamp="7700">Agora</time></div>
                        </div>
                    </article>
                </body></html>`,
                json: async () => ({}),
                url: urlStr
            };
        }
        return prevFetchNoSeen(url, opts);
    };
    await window.__feedSyncExports.syncThreadPage(threadWithoutSeen, 1);
    window.fetch = prevFetchNoSeen;
    const syncedNoSeen = mockStorage.followed.get(threadWithoutSeen.path);
    assert(syncedNoSeen.updated_at === 7700, `updated_at deve ser 7700 (obtido: ${syncedNoSeen.updated_at})`);
    assert(syncedNoSeen.unread === false, 'Tópico sem last_seen_at inicial sincronizado pela primeira vez não deve ficar unread');

    // =========================================================================
    // TESTE 24: Followed Thumbs indexing, thumbCacheGet, alert thumbnail painting & alert unread count accuracy
    // =========================================================================
    console.log('--- TESTE 24: Followed Thumbs, Alert Painting & Alert Count Accuracy ---');
    {
        const helpers = window.__helpersExports || {};
    const aldockExports = window.__aldockExports || {};
    const alertsExports = window.__alertsExports || {};

    const {
        indexFollowedThumbs,
        followedThumbsMap,
        thumbCacheGet
    } = helpers;

    // Test 1: indexFollowedThumbs indexes items by ID, slug, titleKey, and canonical path in followedThumbsMap
    assert(typeof indexFollowedThumbs === 'function', 'indexFollowedThumbs deve ser uma função exposta');
    assert(followedThumbsMap instanceof window.Map, 'followedThumbsMap deve ser uma instância de Map');

    const sampleFollowedItems = [
        {
            path: '/threads/amanda-alves.54321/',
            thread_name: 'Amanda Alves',
            thumbnail_url: 'https://example.com/amanda.jpg'
        },
        {
            path: '/threads/beatriz-silva.67890/page-3',
            thread_name: 'Beatriz Silva | OnlyFans / Fansly',
            thumbnail_url: 'https://example.com/beatriz.jpg'
        }
    ];

    indexFollowedThumbs(sampleFollowedItems);

    // Verificações do item 1
    assert(followedThumbsMap.get('54321') === 'https://example.com/amanda.jpg', 'indexFollowedThumbs deve indexar por ID');
    assert(followedThumbsMap.get('s:amanda-alves') === 'https://example.com/amanda.jpg', 'indexFollowedThumbs deve indexar por slug');
    assert(followedThumbsMap.get('/threads/amanda-alves.54321/') === 'https://example.com/amanda.jpg', 'indexFollowedThumbs deve indexar por caminho canônico');
    assert(followedThumbsMap.get('t:amanda alves') === 'https://example.com/amanda.jpg', 'indexFollowedThumbs deve indexar por titleKey');

    // Verificações do item 2
    assert(followedThumbsMap.get('67890') === 'https://example.com/beatriz.jpg', 'indexFollowedThumbs deve indexar por ID mesmo com /page-3');
    assert(followedThumbsMap.get('s:beatriz-silva') === 'https://example.com/beatriz.jpg', 'indexFollowedThumbs deve indexar por slug do segundo item');
    assert(followedThumbsMap.get('/threads/beatriz-silva.67890/') === 'https://example.com/beatriz.jpg', 'indexFollowedThumbs deve indexar por caminho canônico normalizado');
    assert(followedThumbsMap.get('t:beatriz silva, onlyfans, fansly') === 'https://example.com/beatriz.jpg', 'indexFollowedThumbs deve indexar por titleKey normalizado com vírgulas');

    // Test 2: thumbCacheGet finds followed thread thumbnail even without visiting the thread
    assert(typeof thumbCacheGet === 'function', 'thumbCacheGet deve ser uma função exposta');
    assert(thumbCacheGet('/threads/amanda-alves.54321/', 'Amanda Alves') === 'https://example.com/amanda.jpg', 'thumbCacheGet deve retornar thumb da memória por ID e título');
    assert(thumbCacheGet('/threads/another-slug.54321/', '') === 'https://example.com/amanda.jpg', 'thumbCacheGet deve retornar thumb da memória apenas por ID');
    assert(thumbCacheGet('', 'Amanda Alves') === 'https://example.com/amanda.jpg', 'thumbCacheGet deve retornar thumb da memória apenas por título');
    assert(thumbCacheGet('/posts/12345678/', 'Beatriz Silva | OnlyFans / Fansly') === 'https://example.com/beatriz.jpg', 'thumbCacheGet deve resolver thumb de post de alerta usando titleKey');
    assert(thumbCacheGet('/threads/beatriz-silva.67890/latest', '') === 'https://example.com/beatriz.jpg', 'thumbCacheGet deve resolver thumb usando canon/ID');

    // Test 3: Alerts dock doesn't truncate unread count when st.next exists (aldockSyncCount with st.next and serverCount/domUnread)
    const {
        buildAlertsDock,
        aldockSyncCount,
        aldockState,
        getAldock
    } = aldockExports;

    let dockDom = getAldock() || buildAlertsDock();
    const alertListEl = dockDom.querySelector('.smg-aldock-body[data-tab="alerts"] .smg-aldock-list');
    alertListEl.innerHTML = ''; // Limpar para teste controlado

    // Adiciona 3 alertas não lidos no DOM
    for (let i = 1; i <= 3; i++) {
        const row = document.createElement('li');
        row.className = 'alert is-unread';
        row.innerHTML = `<div class="contentRow"><div class="contentRow-main"><a href="/threads/test.${i}/">Test ${i}</a></div></div>`;
        alertListEl.appendChild(row);
    }

    const badgeEl = dockDom.querySelector('.smg-aldock-n');

    // Caso A: st.next existe (tem mais páginas no servidor) e servidor reporta 15 não lidos
    aldockState.alerts.next = '/account/alerts?page=2';
    delete aldockState.alerts.serverUnread;
    window.GM_setValue('smg-alerts-count', '15');

    aldockSyncCount();
    assert(badgeEl.textContent === '15', `aldockSyncCount com hasMore não deve truncar para o DOM (esperado: "15", obtido: "${badgeEl.textContent}")`);
    assert(window.GM_getValue('smg-alerts-count') === '15', 'smg-alerts-count deve manter 15 quando há próxima página');

    // Caso B: st.next é null (fim da lista alcançado no DOM) → DOM reflete tudo
    aldockState.alerts.next = null;
    aldockSyncCount();
    assert(badgeEl.textContent === '3', `aldockSyncCount sem hasMore deve usar contagem real do DOM (esperado: "3", obtido: "${badgeEl.textContent}")`);
    assert(window.GM_getValue('smg-alerts-count') === '3', 'smg-alerts-count deve ser atualizado para 3');

    // Caso C: st.serverUnread definido explicitamente
    aldockState.alerts.serverUnread = 25;
    aldockSyncCount();
    assert(badgeEl.textContent === '25', `aldockSyncCount com serverUnread deve respeitar serverUnread (esperado: "25", obtido: "${badgeEl.textContent}")`);

    // Caso D: marcar todos como lidos zera serverUnread
    const markReadBtn = dockDom.querySelector('.smg-aldock-markread');
    markReadBtn.click();
    assert(aldockState.alerts.serverUnread === 0, 'applyMarkAllReadSuccess deve zerar aldockState.alerts.serverUnread');
    assert(badgeEl.hidden || badgeEl.textContent === '', 'Badge deve estar oculto após marcar tudo como lido');

    // Test 4: Parsing visitor.alerts_unread from JSON response in railFetch sets st.serverUnread during railRefresh
    const { railRefresh, railFetch } = aldockExports;
    const origFetch = window.fetch;

    window.fetch = async (url, opts) => {
        const urlStr = typeof url === 'string' ? url : (url && url.url) || '';
        if (urlStr.includes('/account/alerts')) {
            return {
                ok: true,
                status: 200,
                text: async () => JSON.stringify({
                    html: {
                        content: `
                            <ol class="listPlain">
                                <li class="alert is-unread" data-alert-id="901">
                                    <div class="contentRow">
                                        <div class="contentRow-main">
                                            <a href="/threads/camila.11111/">Camila</a>
                                            <span class="contentRow-minor"><time>Agora</time></span>
                                        </div>
                                    </div>
                                </li>
                            </ol>
                        `
                    },
                    visitor: {
                        alerts_unread: 42
                    }
                })
            };
        }
        return origFetch(url, opts);
    };

    // Testar railFetch isoladamente primeiro
    const fetchRes = await railFetch('alerts', '/account/alerts');
    assert(fetchRes.visitorAlerts === 42, `railFetch deve extrair visitorAlerts = 42 (obtido: ${fetchRes.visitorAlerts})`);

    // Testar railRefresh preenchendo st.serverUnread e sincronizando badges
    aldockState.alerts.busy = false;
    aldockState.alerts.lastFetch = 0;
    await railRefresh('alerts', true);

    assert(aldockState.alerts.serverUnread === 42, `railRefresh deve setar st.serverUnread para 42 (obtido: ${aldockState.alerts.serverUnread})`);
    assert(window.GM_getValue('smg-alerts-count') === '42', 'railRefresh deve salvar smg-alerts-count = 42');
    assert(badgeEl.textContent === '42', `Badge do aldock deve exibir 42 (obtido: ${badgeEl.textContent})`);

    window.fetch = origFetch;

    // Test 5: Alert rows are painted with thread thumbnail when thread is in followed store
    const { cleanAlertRow, repaintAlertThumbs } = alertsExports;
    assert(typeof cleanAlertRow === 'function', 'cleanAlertRow deve ser uma função exposta');

    indexFollowedThumbs([{
        path: '/threads/carolina-novaes.22222/',
        thread_name: 'Carolina Novaes',
        thumbnail_url: 'https://example.com/carolina.jpg'
    }]);

    const testAlertLi = document.createElement('li');
    testAlertLi.className = 'alert is-unread';
    testAlertLi.innerHTML = `
        <div class="contentRow">
            <div class="contentRow-main">
                <a href="/threads/carolina-novaes.22222/">Carolina Novaes</a>
                <span class="contentRow-minor"><time>Hoje às 15:00</time></span>
            </div>
        </div>
    `;
    const mainEl = testAlertLi.querySelector('.contentRow-main');
    cleanAlertRow(mainEl);

    const iconEl = testAlertLi.querySelector('.smg-al-icon');
    assert(iconEl !== null, 'cleanAlertRow deve criar o ícone .smg-al-icon');
    assert(iconEl.classList.contains('smg-al-icon--thumb'), 'Ícone do alerta deve conter a classe smg-al-icon--thumb');
    const thumbImg = iconEl.querySelector('img');
    assert(thumbImg !== null, 'Ícone do alerta deve conter elemento img');
    assert(thumbImg.src === 'https://example.com/carolina.jpg', `Imagem do alerta deve apontar para https://example.com/carolina.jpg (obtido: ${thumbImg?.src})`);

    // Alerta que inicialmente não tinha thumb no cache ganha com repaintAlertThumbs
    const unindexedAlertLi = document.createElement('li');
    unindexedAlertLi.className = 'alert is-unread';
    unindexedAlertLi.innerHTML = `
        <div class="contentRow">
            <div class="contentRow-main">
                <a href="/threads/daniela-souza.33333/">Daniela Souza</a>
                <span class="contentRow-minor"><time>Hoje às 16:00</time></span>
            </div>
        </div>
    `;
    cleanAlertRow(unindexedAlertLi.querySelector('.contentRow-main'));
    const unindexedIcon = unindexedAlertLi.querySelector('.smg-al-icon');
    assert(!unindexedIcon.classList.contains('smg-al-icon--thumb'), 'Alerta não indexado não deve ter smg-al-icon--thumb inicialmente');

    // Indexa agora
    indexFollowedThumbs([{
        path: '/threads/daniela-souza.33333/',
        thread_name: 'Daniela Souza',
        thumbnail_url: 'https://example.com/daniela.jpg'
    }]);
        const repaintedCount = repaintAlertThumbs(unindexedAlertLi);
        assert(repaintedCount === 1, 'repaintAlertThumbs deve repintar 1 ícone');
        assert(unindexedIcon.classList.contains('smg-al-icon--thumb'), 'Ícone deve virar thumb após repaint');
        assert(unindexedIcon.querySelector('img')?.src === 'https://example.com/daniela.jpg', 'Imagem deve ter a URL correta');
    }

    // =========================================================================
    // TESTE 25: Post card action bar: like com 0 reações, save e share com ícones
    // =========================================================================
    console.log('--- TESTE 25: Post card action bar: like com 0 reações, save e share com ícones ---');

    document.documentElement.classList.add('smg-thread');

    if (!document.execCommand) {
        document.execCommand = () => true;
    }
    if (!window.navigator.clipboard) {
        window.navigator.clipboard = {
            writeText: async () => {}
        };
    }

    const testPostArticle = document.createElement('article');
    testPostArticle.className = 'message message--post';
    testPostArticle.id = 'js-post-25001';
    testPostArticle.setAttribute('data-content', 'post-25001');
    testPostArticle.innerHTML = `
        <div class="message-inner">
            <div class="message-cell message-cell--user">
                <div class="message-avatar"><a class="avatar" href="/members/testuser.99/"><img src="/data/avatars/s/0/99.jpg" /></a></div>
                <div class="message-name"><a href="/members/testuser.99/">TestUser</a></div>
            </div>
            <div class="message-cell message-cell--main">
                <div class="message-main">
                    <header class="message-attribution">
                        <ul class="message-attribution-main listInline">
                            <li><time data-timestamp="1700000000">1 de Jan de 2024</time></li>
                        </ul>
                        <ul class="message-attribution-opposite listInline">
                            <li><a href="/threads/test-thread.12345/post-25001">#1</a></li>
                            <li><a class="bookmarkLink" href="/posts/25001/bookmark"><i class="fa fa-bookmark"></i></a></li>
                            <li><a class="message-attribution-gadget" data-xf-init="share-tooltip" href="https://forums.socialmediagirls.com/threads/test-thread.12345/post-25001"><i class="fa fa-share-alt"></i></a></li>
                        </ul>
                    </header>
                    <div class="message-content">
                        <div class="message-userContent">Post body content</div>
                    </div>
                    <footer class="message-footer">
                        <div class="message-actionBar actionBar">
                            <div class="actionBar-set actionBar-set--external">
                                <a class="actionBar-action actionBar-action--like reaction" data-xf-click="reaction" href="/posts/25001/react"><i class="fa fa-thumbs-up"></i></a>
                                <a class="actionBar-action actionBar-action--reply" href="/posts/25001/reply"><i class="fa fa-reply"></i> Reply</a>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(testPostArticle);
    window.__processAll([testPostArticle]);

    const pcActions = testPostArticle.querySelector('.smg-pc-actions');
    assert(pcActions !== null, 'A action bar .smg-pc-actions deve ser criada no post');

    // 1. Botão de reação com 0 reações
    const reactBtn = pcActions.querySelector('.smg-pc-act--react');
    assert(reactBtn !== null, 'O botão de reação .smg-pc-act--react foi criado em .smg-pc-actions');

    const reactIc = reactBtn.querySelector('.smg-pc-react-ic');
    assert(reactIc !== null && reactIc.querySelector('svg') !== null, 'O botão de reação tem o ícone SVG .smg-pc-react-ic');

    const reactN = reactBtn.querySelector('.smg-pc-react-n');
    const reactNum = reactN ? reactN.querySelector('.smg-react-num') : null;
    const reactWord = reactN ? reactN.querySelector('.smg-react-w') : null;
    assert(reactNum !== null && reactNum.textContent === '0', 'A reação .smg-pc-react-n tem .smg-react-num com "0"');
    assert(reactWord !== null && (reactWord.textContent === 'reações' || reactWord.textContent === 'reactions'), 'A reação .smg-pc-react-n tem .smg-react-w com "reações"');

    // 2. Botão Salvar
    const saveBtn = pcActions.querySelector('.smg-pc-act--save');
    assert(saveBtn !== null, 'O botão save deve ser adicionado em .smg-pc-actions');
    const saveIc = saveBtn.querySelector('.smg-pc-act-ic');
    assert(saveIc !== null && saveIc.querySelector('svg') !== null, 'O botão save tem .smg-pc-act-ic contendo SVG');

    // 3. Botão Compartilhar
    const shareBtn = pcActions.querySelector('.smg-pc-act--share');
    assert(shareBtn !== null, 'O botão share deve ser adicionado em .smg-pc-actions');
    const shareIc = shareBtn.querySelector('.smg-pc-act-ic');
    assert(shareIc !== null && shareIc.querySelector('svg') !== null, 'O botão share tem .smg-pc-act-ic contendo SVG');

    // 4. Clique em Compartilhar ativa --copied e ícone shareDone
    shareBtn.click();
    await new Promise(r => setTimeout(r, 50));
    assert(shareBtn.classList.contains('smg-pc-act--copied'), 'Ao clicar no share com smgShareDirect, ativa --copied');
    const shareCopiedIc = shareBtn.querySelector('.smg-pc-act-ic');
    assert(shareCopiedIc !== null && shareCopiedIc.innerHTML.includes('M20 6 9 17l-5-5'), 'Ao clicar no share com smgShareDirect, ativa ícone shareDone');

    // Limpeza após teste 25
    testPostArticle.remove();

    // =========================================================================
    // TESTE 26: getSortHref e ordenação de tópicos na dock
    // =========================================================================
    console.log('--- TESTE 26: getSortHref e ordenação na dock ---');
    assert(typeof window.__getSortHref === 'function', '__getSortHref deve ser uma função exportada no __TEST_MODE__');

    // 1. Sem tabs no DOM: fallback para a URL atual (removendo /page-N e setando/removendo order)
    const prevLocHref = window.location.href;
    try {
        window.history.pushState({}, '', 'https://forums.socialmediagirls.com/threads/test-thread.12345/page-3?order=date#post-99');
        const urlReactions = window.__getSortHref(false);
        assert(urlReactions !== null, 'getSortHref(false) não deve retornar null');
        assert(urlReactions.includes('order=reaction_score'), 'getSortHref(false) deve adicionar order=reaction_score');
        assert(!urlReactions.includes('/page-3'), 'getSortHref deve resetar a paginação (/page-N) para a raiz da thread');
        assert(!urlReactions.includes('#post-99'), 'getSortHref deve limpar o hash da URL');

        const urlDate = window.__getSortHref(true);
        assert(urlDate !== null, 'getSortHref(true) não deve retornar null');
        assert(!urlDate.includes('order='), 'getSortHref(true) deve remover o parâmetro order');
        assert(!urlDate.includes('/page-3'), 'getSortHref(true) deve resetar a paginação (/page-N) para a raiz da thread');

        // 2. Com tabs no DOM: deve priorizar links existentes
        const mockSortBox = document.createElement('div');
        mockSortBox.className = 'tabs--standalone';
        const mockSortTab = document.createElement('a');
        mockSortTab.className = 'tabs-tab';
        mockSortTab.setAttribute('href', '/threads/test-thread.12345/?order=reaction_score');
        mockSortBox.appendChild(mockSortTab);
        document.body.appendChild(mockSortBox);

        const detectedReactHref = window.__getSortHref(false);
        assert(detectedReactHref === '/threads/test-thread.12345/?order=reaction_score', 'getSortHref(false) deve retornar o href da tab encontrada no DOM');
        mockSortBox.remove();
    } finally {
        window.history.pushState({}, '', prevLocHref);
    }

    // =========================================================================
    // TESTE 27: Melhorias de performance no Player de Vídeo
    // =========================================================================
    console.log('--- TESTE 27: Melhorias de performance no Player de Vídeo ---');
    assert(typeof window.__rgPrepareUrl === 'function', '__rgPrepareUrl deve ser uma função exportada');
    assert(typeof window.__rgViaDirect === 'function', '__rgViaDirect deve ser uma função exportada');
    assert(typeof window.__imagepondResolve === 'function', '__imagepondResolve deve ser uma função exportada');
    assert(window.__imagepondCache instanceof window.Map, '__imagepondCache deve ser uma instância de Map');
    assert(window.__imagepondInflight instanceof window.Map, '__imagepondInflight deve ser uma instância de Map');

    // 1. rgPrepareUrl: quando poster existe, NÃO define video.src com #t=0.1
    const testVideo = document.createElement('video');
    const testWrap = document.createElement('div');
    testWrap.className = 'smg-rg';
    document.body.appendChild(testWrap);
    testWrap.appendChild(testVideo);

    window.__rgPrepareUrl(testVideo, 'https://example.com/video.mp4', testWrap, 'https://example.com/poster.jpg');
    assert(testVideo.poster === 'https://example.com/poster.jpg', 'rgPrepareUrl deve definir video.poster imediatamente quando fornecido');
    assert(!testVideo.src || !testVideo.src.includes('#t=0.1'), 'rgPrepareUrl NÃO deve disparar requisição #t=0.1 quando poster for fornecido');

    // 2. rgPrepareUrl: quando poster NÃO existe, chama setNativeThumb definindo src com #t=0.1
    const testVideoNoPoster = document.createElement('video');
    const testWrapNoPoster = document.createElement('div');
    testWrapNoPoster.className = 'smg-rg';
    document.body.appendChild(testWrapNoPoster);
    testWrapNoPoster.appendChild(testVideoNoPoster);

    window.__rgPrepareUrl(testVideoNoPoster, 'https://example.com/video2.mp4', testWrapNoPoster, '');
    assert(testVideoNoPoster.src.includes('#t=0.1'), 'rgPrepareUrl deve definir #t=0.1 somente quando NÃO houver poster');

    // 3. Preload auto no play
    testVideo._rgUserPlayed = true;
    if (typeof window.__rgControls === 'function') {
        window.__rgControls(testWrap, testVideo);
        testVideo.dispatchEvent(new window.Event('play'));
        assert(testVideo.preload === 'auto', 'Evento play deve alterar video.preload para auto');
    }

    // 4. imagepondResolve: cache e deduplicação em voo (inflight)
    window.__imagepondCache.clear();
    window.__imagepondInflight.clear();

    let gmxCalls = 0;
    const origGmx = window.GM_xmlhttpRequest;
    window.GM_xmlhttpRequest = (opts) => {
        gmxCalls++;
        setTimeout(() => {
            opts.onload({
                responseText: '<source src="https://media.imagepond.net/media/videos/test1234.mp4" type="video/mp4">'
            });
        }, 10);
    };

    let ipRes1 = null, ipRes2 = null;
    window.__imagepondResolve('https://imagepond.net/videos/embed1', (r) => { ipRes1 = r; });
    window.__imagepondResolve('https://imagepond.net/videos/embed1', (r) => { ipRes2 = r; });

    assert(window.__imagepondInflight.has('https://imagepond.net/videos/embed1'), 'Requisição deve constar em __imagepondInflight');
    assert(window.__imagepondInflight.get('https://imagepond.net/videos/embed1').length === 2, 'Ambos os callbacks devem estar na fila inflight');

    await new Promise(r => setTimeout(r, 40));

    assert(gmxCalls === 1, `Apenas 1 chamada de rede deve ser feita para requisições concorrentes (obtido: ${gmxCalls})`);
    assert(ipRes1 && ipRes1.mp4 === 'https://media.imagepond.net/media/videos/test1234.mp4', 'ipRes1 deve resolver com o vídeo correto');
    assert(ipRes2 && ipRes2.mp4 === 'https://media.imagepond.net/media/videos/test1234.mp4', 'ipRes2 deve resolver com o vídeo correto');
    assert(window.__imagepondCache.has('https://imagepond.net/videos/embed1'), 'Resultado deve estar salvo no __imagepondCache');

    // Terceira chamada: deve responder instantaneamente do cache sem disparar rede
    let ipRes3 = null;
    window.__imagepondResolve('https://imagepond.net/videos/embed1', (r) => { ipRes3 = r; });
    assert(gmxCalls === 1, 'Chamada subsequente deve utilizar o cache sem rede adicional');
    assert(ipRes3 && ipRes3.mp4 === 'https://media.imagepond.net/media/videos/test1234.mp4', 'ipRes3 deve vir do cache');

    // Limite de cache até 128 entradas
    for (let i = 0; i < 130; i++) {
        window.__imagepondCache.set(`https://imagepond.net/videos/dummy_${i}`, { mp4: `https://example.com/v_${i}.mp4` });
    }
    // Uma nova resolução que chama finish() deve manter size <= 128
    window.GM_xmlhttpRequest = (opts) => {
        opts.onload({ responseText: '<source src="https://media.imagepond.net/media/videos/new.mp4">' });
    };
    window.__imagepondResolve('https://imagepond.net/videos/limit_test', () => {});
    await new Promise(r => setTimeout(r, 20));
    assert(window.__imagepondCache.size <= 128, `Tamanho do cache deve respeitar limite de 128 (atual: ${window.__imagepondCache.size})`);

    // Restaurar GM_xmlhttpRequest e limpar DOM de teste
    window.GM_xmlhttpRequest = origGmx;
    testWrap.remove();
    testWrapNoPoster.remove();

    // =========================================================================
    // TESTE 28: Race condition no streaming de posts e comentários (HTML parser)
    // =========================================================================
    console.log('--- TESTE 28: Race condition no streaming de posts e comentários ---');

    document.documentElement.classList.add('smg-thread');

    // 1. Simular documento em carregamento (HTML parser ativo)
    Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true, writable: true });

    const streamingPost = document.createElement('article');
    streamingPost.className = 'message message--post js-post js-inlineModContainer';
    streamingPost.id = 'js-post-28001';
    streamingPost.setAttribute('data-content', 'post-28001');
    document.body.appendChild(streamingPost);

    window.__processAll([streamingPost]);

    assert(!streamingPost.dataset.smgCard, 'Post incompleto durante carregamento NÃO deve receber data-smg-card');
    assert(!streamingPost.dataset.smgCardReady, 'Post incompleto durante carregamento NÃO deve receber data-smg-card-ready=skip');
    assert(!streamingPost.classList.contains('smg-pc'), 'Post incompleto NÃO deve receber a classe .smg-pc');

    // 2. Browser insere nós filhos (.message-inner e .message-cell--main)
    streamingPost.innerHTML = `
        <div class="message-inner">
            <div class="message-cell message-cell--user">
                <div class="message-avatar"><a class="avatar" href="/members/user28.28/"><img src="/data/avatars/s/0/28.jpg" /></a></div>
                <div class="message-name"><a href="/members/user28.28/">User28</a></div>
            </div>
            <div class="message-cell message-cell--main">
                <div class="message-main">
                    <header class="message-attribution">
                        <ul class="message-attribution-main listInline">
                            <li><time data-timestamp="1700000000">1 de Jan de 2024</time></li>
                        </ul>
                        <ul class="message-attribution-opposite listInline">
                            <li><a href="/threads/test-thread.12345/post-28001">#28</a></li>
                        </ul>
                    </header>
                    <div class="message-content">
                        <div class="message-userContent">Post 28 body content</div>
                    </div>
                    <footer class="message-footer">
                        <div class="message-actionBar actionBar">
                            <div class="actionBar-set actionBar-set--external">
                                <a class="actionBar-action actionBar-action--like reaction" data-xf-click="reaction" href="/posts/28001/react"><i class="fa fa-thumbs-up"></i></a>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    `;

    window.__processAll([streamingPost]);

    assert(streamingPost.dataset.smgCard === '1', 'Post agora preenchido deve receber data-smg-card="1"');
    assert(streamingPost.dataset.smgCardReady === '1', 'Post agora preenchido deve receber data-smg-card-ready="1"');
    assert(streamingPost.classList.contains('smg-pc'), 'Post agora preenchido deve receber a classe .smg-pc');
    assert(streamingPost.querySelector('.smg-pc-head') !== null, 'Post agora preenchido deve conter .smg-pc-head');
    assert(streamingPost.querySelector('.smg-pc-actions') !== null, 'Post agora preenchido deve conter .smg-pc-actions');

    // 3. Post previamente marcado com data-smg-card-ready="skip" deve ser recuperado ao receber filhos
    const skipPost = document.createElement('article');
    skipPost.className = 'message message--post js-post js-inlineModContainer';
    skipPost.id = 'js-post-28002';
    skipPost.setAttribute('data-content', 'post-28002');
    skipPost.dataset.smgCard = '1';
    skipPost.dataset.smgCardReady = 'skip';
    skipPost.innerHTML = `
        <div class="message-inner">
            <div class="message-cell message-cell--user">
                <div class="message-avatar"><a class="avatar" href="/members/user28b.29/"><img src="/data/avatars/s/0/29.jpg" /></a></div>
                <div class="message-name"><a href="/members/user28b.29/">User28b</a></div>
            </div>
            <div class="message-cell message-cell--main">
                <div class="message-main">
                    <header class="message-attribution">
                        <ul class="message-attribution-main listInline">
                            <li><time data-timestamp="1700000000">1 de Jan de 2024</time></li>
                        </ul>
                        <ul class="message-attribution-opposite listInline">
                            <li><a href="/threads/test-thread.12345/post-28002">#29</a></li>
                        </ul>
                    </header>
                    <div class="message-content">
                        <div class="message-userContent">Post 28b body content</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(skipPost);

    window.__processAll([skipPost]);

    assert(skipPost.dataset.smgCard === '1', 'Post recuperado de skip deve ter data-smg-card="1"');
    assert(skipPost.dataset.smgCardReady === '1', 'Post recuperado de skip deve ter data-smg-card-ready="1"');
    assert(skipPost.classList.contains('smg-pc'), 'Post recuperado de skip deve ter a classe .smg-pc');
    assert(skipPost.querySelector('.smg-pc-head') !== null, 'Post recuperado de skip deve conter .smg-pc-head');

    // 4. Se document.readyState === 'complete', post verdadeiramente vazio/deletado recebe skip
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true, writable: true });

    const deletedPost = document.createElement('article');
    deletedPost.className = 'message message--post js-post';
    deletedPost.id = 'js-post-deleted';
    document.body.appendChild(deletedPost);

    window.__processAll([deletedPost]);

    assert(deletedPost.dataset.smgCard === '1', 'Post sem conteúdo quando complete deve ter data-smg-card="1"');
    assert(deletedPost.dataset.smgCardReady === 'skip', 'Post sem conteúdo quando complete deve ter data-smg-card-ready="skip"');
    assert(!deletedPost.classList.contains('smg-pc'), 'Post sem conteúdo NÃO deve ter .smg-pc');

    // 5. Testar o mesmo comportamento para comentários (uw_fcs)
    Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true, writable: true });

    const responsesWrap = document.createElement('div');
    responsesWrap.className = 'message-responses';
    const streamingComment = document.createElement('div');
    streamingComment.className = 'comment';
    responsesWrap.appendChild(streamingComment);
    document.body.appendChild(responsesWrap);

    window.__processAll([responsesWrap]);

    assert(!streamingComment.dataset.smgCc, 'Comentário incompleto durante carregamento NÃO deve receber data-smg-cc');
    assert(!streamingComment.dataset.smgCcReady, 'Comentário incompleto durante carregamento NÃO deve receber data-smg-cc-ready=skip');

    // Inserir .comment-inner
    streamingComment.innerHTML = `
        <div class="comment-inner">
            <div class="comment-avatar"><a class="avatar" href="/members/cuser.1/"><img src="/data/avatars/s/0/1.jpg" /></a></div>
            <div class="comment-main">
                <div class="comment-contentWrapper">
                    <a class="comment-user" href="/members/cuser.1/">Commenter</a>
                    <time data-timestamp="1700000000">1 de Jan de 2024</time>
                    <div class="comment-body">Comment body</div>
                </div>
            </div>
        </div>
    `;

    window.__processAll([responsesWrap]);

    assert(streamingComment.dataset.smgCc === '1', 'Comentário preenchido deve receber data-smg-cc="1"');
    assert(streamingComment.dataset.smgCcReady === '1', 'Comentário preenchido deve receber data-smg-cc-ready="1"');
    assert(streamingComment.classList.contains('smg-cc'), 'Comentário preenchido deve receber a classe .smg-cc');

    // Comentário com skip recupera quando recebe filhos
    const skipComment = document.createElement('div');
    skipComment.className = 'comment';
    skipComment.dataset.smgCc = '1';
    skipComment.dataset.smgCcReady = 'skip';
    skipComment.innerHTML = `
        <div class="comment-inner">
            <div class="comment-main">
                <div class="comment-contentWrapper">
                    <a class="comment-user" href="/members/cuser2.2/">Commenter 2</a>
                    <div class="comment-body">Comment body 2</div>
                </div>
            </div>
        </div>
    `;
    responsesWrap.appendChild(skipComment);

    window.__processAll([responsesWrap]);

    assert(skipComment.dataset.smgCc === '1', 'Comentário recuperado de skip deve ter data-smg-cc="1"');
    assert(skipComment.dataset.smgCcReady === '1', 'Comentário recuperado de skip deve ter data-smg-cc-ready="1"');
    assert(skipComment.classList.contains('smg-cc'), 'Comentário recuperado de skip deve ter a classe .smg-cc');

    // Limpeza
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true, writable: true });
    streamingPost.remove();
    skipPost.remove();
    deletedPost.remove();
    responsesWrap.remove();

    // =========================================================================
    // TESTE 29: Interceptação de clique em imagens externas (Goonbox / Simp6 / etc.) e modal lightbox
    // =========================================================================
    console.log('--- TESTE 29: Interceptação de clique em imagens externas e modal lightbox ---');

    assert(window.__imageClickExports && typeof window.__imageClickExports.imageUrlOf === 'function', 'imageUrlOf deve estar exposto no __TEST_MODE__');
    assert(window.__imageClickExports && typeof window.__imageClickExports.setupImageClickFeed === 'function', 'setupImageClickFeed deve estar exposto no __TEST_MODE__');

    // 1. Criar link externo de imagem estilo goonbox com img.bbImage interna
    const goonboxLink = document.createElement('a');
    goonboxLink.href = 'https://goonbox.cr/img/tQ3xTest29';
    goonboxLink.className = 'link link--external smg-imglink';
    goonboxLink.target = '_blank';
    goonboxLink.setAttribute('rel', 'noopener noreferrer');
    goonboxLink.setAttribute('data-smg-imglink', '1');
    goonboxLink.setAttribute('data-smg-unwrap', '1');
    goonboxLink.setAttribute('data-blank-handler', 'true');

    const goonboxImg = document.createElement('img');
    goonboxImg.src = 'https://simp6.cuckcapital.cr/images4/test.jpg';
    goonboxImg.setAttribute('data-url', 'https://simp6.cuckcapital.cr/images4/test.jpg');
    goonboxImg.className = 'bbImage smg-wide smg-img-ready';
    goonboxLink.appendChild(goonboxImg);
    document.body.appendChild(goonboxLink);

    // Validar extração correta de URL em imageUrlOf
    const extractedUrl = window.__imageClickExports.imageUrlOf(goonboxImg);
    assert(extractedUrl === 'https://simp6.cuckcapital.cr/images4/test.jpg', 'imageUrlOf deve extrair a URL da imagem real em vez do link da página do goonbox');

    // Testar se src vazio ou data:image cai em data-url
    const lazyImg = document.createElement('img');
    lazyImg.setAttribute('data-url', 'https://simp6.cuckcapital.cr/images4/lazy.jpg');
    lazyImg.className = 'bbImage';
    goonboxLink.appendChild(lazyImg);
    assert(window.__imageClickExports.imageUrlOf(lazyImg) === 'https://simp6.cuckcapital.cr/images4/lazy.jpg', 'imageUrlOf deve usar data-url quando src não existir ou for vazio');
    lazyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    assert(window.__imageClickExports.imageUrlOf(lazyImg) === 'https://simp6.cuckcapital.cr/images4/lazy.jpg', 'imageUrlOf deve usar data-url quando src for data: URI');
    lazyImg.remove();

    // 2. Simular clique na imagem e verificar que a modal lightbox abre
    let feedEl = document.getElementById('smg-feed');
    if (feedEl) feedEl.classList.remove('open');

    // Spy no stopImmediatePropagation
    let imgClickStopImmediate = false;
    const imgClick = new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    const origStopImm = imgClick.stopImmediatePropagation;
    imgClick.stopImmediatePropagation = function() {
        imgClickStopImmediate = true;
        origStopImm.call(this);
    };

    goonboxImg.dispatchEvent(imgClick);

    feedEl = document.getElementById('smg-feed');
    assert(feedEl !== null && feedEl.classList.contains('open'), 'Clique na imagem goonbox deve abrir o lightbox (#smg-feed com classe .open)');
    assert(imgClick.defaultPrevented, 'Clique na imagem goonbox deve ter defaultPrevented pelo setupImageClickFeed');

    // Fechar feed para próximos testes
    if (feedEl) feedEl.classList.remove('open');

    // 3. Validar que o bindProxyClick NÃO sequestrou o clique do link que embrulha a imagem
    // Se o bindProxyClick tivesse executado sua interceptação de link externo, ele teria tentado abrir window.open se defaultPrevented
    let windowOpenCalls = [];
    const origWindowOpen = window.open;
    window.open = function(...args) {
        windowOpenCalls.push(args);
    };

    const imgClick2 = new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    goonboxImg.dispatchEvent(imgClick2);

    assert(windowOpenCalls.length === 0, 'bindProxyClick NÃO deve ter chamado window.open para clique na imagem');

    // Restaurar window.open
    window.open = origWindowOpen;
    if (feedEl) feedEl.classList.remove('open');
    goonboxLink.remove();

    // 4. Validar que um link externo de texto puro (sem imagem) continua sendo interceptado normalmente pelo bindProxyClick
    const plainExtLink = document.createElement('a');
    plainExtLink.className = 'link link--external';
    plainExtLink.href = 'https://external-service.org/article';
    document.body.appendChild(plainExtLink);

    let plainLinkStopImmediate = false;
    const plainClick = new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    const origPlainStopImm = plainClick.stopImmediatePropagation;
    plainClick.stopImmediatePropagation = function() {
        plainLinkStopImmediate = true;
        origPlainStopImm.call(this);
    };

    plainExtLink.dispatchEvent(plainClick);

    assert(plainLinkStopImmediate, 'bindProxyClick DEVE chamar stopImmediatePropagation em link externo de texto puro sem imagem');
    assert(plainExtLink.target === '_blank', 'bindProxyClick deve definir target="_blank" em link externo de texto puro');
    assert(plainExtLink.rel.includes('noopener'), 'bindProxyClick deve definir rel noopener em link externo de texto puro');
    plainExtLink.remove();

    // =========================================================================
    // TESTE 30: Resolução GoonBox para imagem em alta resolução (original_url)
    // =========================================================================
    console.log('--- TESTE 30: Resolução GoonBox para imagem em alta resolução (original_url) ---');

    assert(window.__masonryExports && typeof window.__masonryExports.goonboxViewer === 'function', 'goonboxViewer deve estar exposto no __TEST_MODE__');
    assert(window.__masonryExports && typeof window.__masonryExports.goonboxResolve === 'function', 'goonboxResolve deve estar exposto no __TEST_MODE__');
    assert(window.__masonryExports && window.__masonryExports.gbxCache instanceof window.Map, 'gbxCache deve estar exposto no __TEST_MODE__');
    assert(window.__masonryExports && typeof window.__masonryExports.processOneImage === 'function', 'processOneImage deve estar exposto no __TEST_MODE__');
    assert(window.__masonryExports && typeof window.__masonryExports.goonboxEmbed === 'function', 'goonboxEmbed deve estar exposto no __TEST_MODE__');

    const { goonboxViewer, goonboxResolve, gbxCache, gbxInflight, processOneImage, goonboxEmbed } = window.__masonryExports;
    const { imageUrlOf } = window.__imageClickExports;

    // 1. Validar goonboxViewer
    const gbxParsed = goonboxViewer('https://goonbox.cr/img/tQ3xEcd');
    assert(gbxParsed !== null, 'goonboxViewer deve reconhecer URL do goonbox.cr');
    assert(gbxParsed.host === 'goonbox.cr' && gbxParsed.id === 'tQ3xEcd', 'goonboxViewer deve extrair host e id corretamente');

    assert(goonboxViewer('https://otherdomain.com/img/tQ3xEcd') === null, 'goonboxViewer deve retornar null para domínio não-goonbox');
    assert(goonboxViewer('https://goonbox.cr/other/tQ3xEcd') === null, 'goonboxViewer deve retornar null para rota diferente de /img/');
    assert(goonboxViewer(null) === null, 'goonboxViewer deve retornar null para input nulo');

    // 2. Mockar GM_xmlhttpRequest para simular a API pública do Goonbox
    const origGmx30 = window.GM_xmlhttpRequest;
    window.GM_xmlhttpRequest = (opts) => {
        if (opts.url && opts.url.includes('/api/images/tQ3xEcd')) {
            setTimeout(() => {
                opts.onload({
                    status: 200,
                    responseText: JSON.stringify({
                        image: {
                            mime: "image/jpeg",
                            size_bytes: 1095474,
                            width: 5926,
                            height: 3534,
                            encoded_id: "tQ3xEcd",
                            original_filename: "99643dea-7adc-4a92-a440-d2237586453d.jpg",
                            original_url: "https://simp6.cuckcapital.cr/images4/99643dea-7adc-4a92-a440-d2237586453d.jpg",
                            thumb_url: "https://simp6.cuckcapital.cr/images4/4e2a557d-8d49-4ede-b6e9-04cb957eab17.jpg",
                            medium_url: "https://simp6.cuckcapital.cr/images4/d4240f3b-626b-4e42-922b-27b0d832f0f0.jpg"
                        }
                    })
                });
            }, 5);
        } else {
            console.log('GM_xmlhttpRequest unexpected url:', opts && opts.url);
            if (opts.onerror) opts.onerror();
        }
    };

    // 3. Testar goonboxResolve e cache
    gbxCache.clear();
    if (gbxInflight) gbxInflight.clear();
    let res30 = null;
    goonboxResolve('https://goonbox.cr/img/tQ3xEcd', res => {
        res30 = res;
    });

    for (let i = 0; i < 25 && !res30; i++) {
        await new Promise(r => setTimeout(r, 20));
    }

    assert(res30 !== null, 'goonboxResolve deve retornar resposta válida');
    assert(res30.original === 'https://simp6.cuckcapital.cr/images4/99643dea-7adc-4a92-a440-d2237586453d.jpg', 'res.original deve ser a URL de alta resolução');
    assert(res30.medium === 'https://simp6.cuckcapital.cr/images4/d4240f3b-626b-4e42-922b-27b0d832f0f0.jpg', 'res.medium deve ser a URL de resolução média');
    assert(res30.width === 5926 && res30.height === 3534, 'res deve conter as dimensões da imagem');
    assert(gbxCache.has('tQ3xEcd'), 'gbxCache deve conter a entrada resolvida tQ3xEcd');

    // 4. Testar elemento DOM processOneImage com imagem goonbox
    const testA30 = document.createElement('a');
    testA30.href = 'https://goonbox.cr/img/tQ3xEcd';
    testA30.className = 'link link--external smg-imglink';

    const testImg30 = document.createElement('img');
    testImg30.src = 'https://simp6.cuckcapital.cr/images4/d4240f3b-626b-4e42-922b-27b0d832f0f0.jpg';
    testImg30.className = 'bbImage';
    testA30.appendChild(testImg30);
    document.body.appendChild(testA30);

    processOneImage(testImg30);

    assert(testImg30.dataset.smgFull === 'https://simp6.cuckcapital.cr/images4/99643dea-7adc-4a92-a440-d2237586453d.jpg', 'img.dataset.smgFull deve ser atualizado para original_url');
    assert(testA30.href === 'https://simp6.cuckcapital.cr/images4/99643dea-7adc-4a92-a440-d2237586453d.jpg', 'link a.href deve ser atualizado para original_url');
    assert(testImg30.src === 'https://simp6.cuckcapital.cr/images4/d4240f3b-626b-4e42-922b-27b0d832f0f0.jpg', 'img.src no post deve manter o preview/thumb leve para evitar flickering e consumo excessivo de banda');
    assert(imageUrlOf(testImg30) === 'https://simp6.cuckcapital.cr/images4/99643dea-7adc-4a92-a440-d2237586453d.jpg', 'imageUrlOf deve retornar versão em alta resolução');

    // 5. Testar clique na imagem e abertura do feed lightbox
    let feed30 = document.getElementById('smg-feed');
    if (feed30) feed30.classList.remove('open');

    const clickEv30 = new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    testImg30.dispatchEvent(clickEv30);

    feed30 = document.getElementById('smg-feed');
    assert(feed30 && feed30.classList.contains('open'), 'Clique na imagem goonbox deve abrir o feed lightbox (#smg-feed.open)');
    const feedImgs30 = feed30.querySelectorAll('img.smg-feed-media');
    const hasHighRes30 = Array.from(feedImgs30).some(fi => fi.src === 'https://simp6.cuckcapital.cr/images4/99643dea-7adc-4a92-a440-d2237586453d.jpg' || fi.dataset.src === 'https://simp6.cuckcapital.cr/images4/99643dea-7adc-4a92-a440-d2237586453d.jpg');
    assert(hasHighRes30, 'Feed lightbox deve conter o slide com a imagem de alta resolução');

    if (feed30) feed30.classList.remove('open');
    testA30.remove();

    // 6. Testar naked link goonboxEmbed substituindo link pelado por bbImage com resolução original
    const nakedLink30 = document.createElement('a');
    nakedLink30.href = 'https://goonbox.cr/img/tQ3xEcd';
    nakedLink30.className = 'link link--external';
    nakedLink30.textContent = 'https://goonbox.cr/img/tQ3xEcd';
    document.body.appendChild(nakedLink30);

    const gbxViewerInfo30 = goonboxViewer(nakedLink30.href);
    assert(gbxViewerInfo30 !== null, 'goonboxViewer deve reconhecer o link pelado');
    goonboxEmbed(nakedLink30, nakedLink30.href, gbxViewerInfo30);

    const embedLink30 = document.body.querySelector('a[href="https://simp6.cuckcapital.cr/images4/99643dea-7adc-4a92-a440-d2237586453d.jpg"]');
    assert(embedLink30 !== null, 'goonboxEmbed deve criar link apontando para a resolução original');
    const embedImg30 = embedLink30.querySelector('img.bbImage');
    assert(embedImg30 !== null, 'goonboxEmbed deve conter elemento img.bbImage');
    assert(embedImg30.src === 'https://simp6.cuckcapital.cr/images4/d4240f3b-626b-4e42-922b-27b0d832f0f0.jpg' || embedImg30.src === 'https://simp6.cuckcapital.cr/images4/99643dea-7adc-4a92-a440-d2237586453d.jpg', 'img.src da embed deve usar medium ou original_url');
    assert(embedImg30.dataset.smgFull === 'https://simp6.cuckcapital.cr/images4/99643dea-7adc-4a92-a440-d2237586453d.jpg', 'img.dataset.smgFull deve ser original_url');
    embedLink30.remove();

    // 7. Testar resolução imediata de placeholder lazy (data-url com src data:image)
    const lazyImg30 = document.createElement('img');
    lazyImg30.className = 'bbImage';
    lazyImg30.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    lazyImg30.setAttribute('data-url', 'https://simp6.cuckcapital.cr/images4/lazy-resolved.jpg');
    document.body.appendChild(lazyImg30);
    processOneImage(lazyImg30);
    assert(lazyImg30.src === 'https://simp6.cuckcapital.cr/images4/lazy-resolved.jpg', 'Placeholders com data-url e src="data:..." devem ter o src atribuído imediatamente a partir de data-url');
    lazyImg30.remove();

    // Restaurar GM_xmlhttpRequest
    window.GM_xmlhttpRequest = origGmx30;

    // =========================================================================
    // TESTE 32: Inclusão de imagens separadas por <script class="js-extraPhrases"> e padronização de espaçamento 8px
    // =========================================================================
    console.log('--- TESTE 32: Inclusão de imagens separadas por <script class="js-extraPhrases"> e espaçamento 8px ---');

    document.documentElement.classList.add('smg-masonry-on');

    // 1. Post com Imagem 1, <script class="js-extraPhrases">, Imagem 2, Imagem 3
    const testPost32 = document.createElement('div');
    testPost32.className = 'message-userContent';
    testPost32.innerHTML = '<div class="bbWrapper">' +
        '<a href="https://example.com/img1.jpg" class="smg-imglink"><img src="https://example.com/img1.jpg" class="bbImage" alt=""></a>' +
        '<script class="js-extraPhrases" type="application/json">{"test":1}</script>' +
        '<a href="https://example.com/img2.jpg" class="smg-imglink"><img src="https://example.com/img2.jpg" class="bbImage" alt=""></a>' +
        '<a href="https://example.com/img3.jpg" class="smg-imglink"><img src="https://example.com/img3.jpg" class="bbImage" alt=""></a>' +
        '</div>';
    document.body.appendChild(testPost32);

    buildPostGalleries([testPost32]);

    const grid32 = testPost32.querySelector('.auto-image-grid');
    assert(grid32 !== null, 'Um elemento .auto-image-grid deve ser criado no post');

    const imagesInGrid = grid32 ? grid32.querySelectorAll('img.bbImage') : [];
    assert(imagesInGrid.length === 3, `Todas as 3 imagens devem ser incluídas dentro do .auto-image-grid (encontradas: ${imagesInGrid.length})`);

    const imagesOutsideGrid = testPost32.querySelectorAll('.bbWrapper > img.bbImage, .bbWrapper > a > img.bbImage');
    assert(imagesOutsideGrid.length === 0, 'Nenhuma imagem deve ficar solta fora do grid');

    // Validar que a Imagem 1 é o primeiro filho do grid (ordem preservada)
    assert(grid32 && grid32.firstElementChild && (grid32.firstElementChild.getAttribute('src') === 'https://example.com/img1.jpg' || (grid32.firstElementChild.querySelector && grid32.firstElementChild.querySelector('img[src="https://example.com/img1.jpg"]'))), 'Imagem 1 deve ser o primeiro filho do grid (ordem preservada)');

    // 2. Estilos do mosaico (motor 08a)
    const styleEl = document.getElementById('smg-styles');
    const injectedCSS = (styleEl && styleEl.textContent) || scriptContent;

    assert(!/column-(count|width)/.test(injectedCSS.match(/\.smg-mason[^{]*\{[^}]*\}/g).join('')), 'O mosaico não usa CSS columns (leria de cima pra baixo)');

    // Cleanup
    testPost32.remove();

    // =========================================================================
    // TESTE 35: Embeds rápidos/ricos (GoFile, Pixeldrain, Bunkr) e Masonry dentro de Spoilers
    // =========================================================================
    console.log('--- TESTE 35: Embeds rápidos/ricos (GoFile, Pixeldrain, Bunkr) e Masonry dentro de Spoilers ---');

    // 1. Card GoFile extrai título e snippet de .bbCodeBlock--unfurl
    const gfWrap = document.createElement('div');
    gfWrap.className = 'message-userContent';
    gfWrap.innerHTML = `
        <div class="bbCodeBlock bbCodeBlock--unfurl" data-url="https://gofile.io/d/abc123" data-host="gofile.io">
            <div class="contentRow">
                <div class="contentRow-figure">
                    <img src="https://example.com/gofile-thumb.jpg" />
                </div>
                <div class="contentRow-main">
                    <div class="contentRow-header js-unfurl-title">Holiday Photos Pack 2024</div>
                    <div class="contentRow-snippet">1.4 GB · 88 files</div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(gfWrap);
    const processFileHostCards = window.processFileHostCards;
    assert(typeof processFileHostCards === 'function', 'processFileHostCards deve estar exposto em modo de teste');
    processFileHostCards([gfWrap]);

    const gfCard = gfWrap.querySelector('.smg-fhcard[data-key="gofile"]');
    assert(gfCard !== null, 'Card GoFile deve ser inserido no DOM');
    const gfHost = gfCard ? gfCard.querySelector('.smg-fhcard-host') : null;
    const gfSub = gfCard ? gfCard.querySelector('.smg-fhcard-sub') : null;
    const gfImg = gfCard ? gfCard.querySelector('.smg-fhcard-thumb img') : null;
    const gfPlat = gfCard ? gfCard.querySelector('.smg-fhcard-platform') : null;
    assert(gfPlat && gfPlat.textContent === 'GoFile', 'Card GoFile com título customizado deve criar .smg-fhcard-platform com "GoFile"');
    assert(gfHost && gfHost.textContent === 'Holiday Photos Pack 2024', 'Card GoFile deve exibir o título real extraído do unfurl ("Holiday Photos Pack 2024")');
    assert(gfSub && gfSub.textContent === '1.4 GB · 88 files', 'Card GoFile deve exibir snippet/tamanho extraído do unfurl sem duplicar plataforma');
    assert(gfImg && gfImg.getAttribute('src') === 'https://example.com/gofile-thumb.jpg', 'Card GoFile deve usar thumbnail extraído do unfurl');
    gfWrap.remove();

    // 2. fhPixeldrain monta o card imediatamente com thumbnail e sem esperar rede
    const pdWrap = document.createElement('div');
    pdWrap.className = 'message-userContent';
    const pdUnfurl = document.createElement('div');
    pdUnfurl.className = 'bbCodeBlock bbCodeBlock--unfurl';
    pdUnfurl.setAttribute('data-url', 'https://pixeldrain.com/l/pdl123');
    pdUnfurl.setAttribute('data-host', 'pixeldrain.com');
    pdUnfurl.innerHTML = `
        <div class="contentRow">
            <div class="contentRow-figure"><img src="https://example.com/pd-unfurl-thumb.jpg" /></div>
            <div class="contentRow-main">
                <div class="contentRow-header js-unfurl-title">Exclusive Album 2024</div>
                <div class="contentRow-snippet">500 MB · 20 items</div>
            </div>
        </div>
    `;
    pdWrap.appendChild(pdUnfurl);
    document.body.appendChild(pdWrap);

    const fhPixeldrain = window.fhPixeldrain;
    assert(typeof fhPixeldrain === 'function', 'fhPixeldrain deve estar exposto em modo de teste');
    fhPixeldrain(pdUnfurl, 'https://pixeldrain.com/l/pdl123', pdUnfurl);

    const pdCard = pdWrap.querySelector('.smg-fhcard[data-key="pixeldrain"]');
    assert(pdCard !== null, 'Card Pixeldrain deve ser montado de forma imediata e síncrona');
    const pdHost = pdCard ? pdCard.querySelector('.smg-fhcard-host') : null;
    const pdSub = pdCard ? pdCard.querySelector('.smg-fhcard-sub') : null;
    const pdImg = pdCard ? pdCard.querySelector('.smg-fhcard-thumb img') : null;
    const pdPlat = pdCard ? pdCard.querySelector('.smg-fhcard-platform') : null;
    assert(pdPlat && pdPlat.textContent === 'Pixeldrain', 'Card Pixeldrain com título customizado deve criar .smg-fhcard-platform com "Pixeldrain"');
    assert(pdHost && pdHost.textContent === 'Exclusive Album 2024', 'Card Pixeldrain deve exibir título real');
    assert(pdSub && pdSub.textContent === '500 MB · 20 items', 'Card Pixeldrain deve exibir snippet sem duplicar plataforma');
    assert(pdImg && pdImg.getAttribute('src') === 'https://example.com/pd-unfurl-thumb.jpg', 'Card Pixeldrain deve montar thumbnail imediatamente');
    pdWrap.remove();

    // 3. fhBunkr monta o card imediatamente com thumbnail preliminar e atualiza via cache
    const bunkrWrap = document.createElement('div');
    bunkrWrap.className = 'message-userContent';
    const bkUnfurl = document.createElement('div');
    bkUnfurl.className = 'bbCodeBlock bbCodeBlock--unfurl';
    bkUnfurl.setAttribute('data-url', 'https://bunkr.cr/a/alb123');
    bkUnfurl.setAttribute('data-host', 'bunkr.cr');
    bkUnfurl.innerHTML = `
        <div class="contentRow">
            <div class="contentRow-figure"><img src="https://example.com/bunkr-prelim.jpg" /></div>
            <div class="contentRow-main">
                <div class="contentRow-header js-unfurl-title">Bunkr Photoshoot</div>
                <div class="contentRow-snippet">32 files</div>
            </div>
        </div>
    `;
    bunkrWrap.appendChild(bkUnfurl);
    document.body.appendChild(bunkrWrap);

    const fhBunkr = window.fhBunkr;
    assert(typeof fhBunkr === 'function', 'fhBunkr deve estar exposto em modo de teste');
    fhBunkr(bkUnfurl, 'https://bunkr.cr/a/alb123', bkUnfurl);

    const bkCard = bunkrWrap.querySelector('.smg-fhcard[data-key="bunkr"]');
    assert(bkCard !== null, 'Card Bunkr deve ser montado de forma imediata e síncrona');
    const bkImg = bkCard ? bkCard.querySelector('.smg-fhcard-thumb img') : null;
    assert(bkImg && bkImg.getAttribute('src') === 'https://example.com/bunkr-prelim.jpg', 'Card Bunkr deve ter thumbnail preliminar do unfurl');

    // Simula resposta em cache e renderização de segundo card usando cache
    const bunkrCache = window.bunkrCache;
    assert(bunkrCache && (bunkrCache instanceof window.Map || bunkrCache instanceof Map), 'bunkrCache deve ser uma instância de Map');
    bunkrCache.set('https://bunkr.cr/a/alb123', {
        count: 15,
        thumbs: ['https://example.com/b1.jpg', 'https://example.com/b2.jpg', 'https://example.com/b3.jpg', 'https://example.com/b4.jpg']
    });

    const bkUnfurl2 = document.createElement('div');
    bkUnfurl2.className = 'bbCodeBlock bbCodeBlock--unfurl';
    bkUnfurl2.setAttribute('data-url', 'https://bunkr.cr/a/alb123');
    bunkrWrap.appendChild(bkUnfurl2);
    fhBunkr(bkUnfurl2, 'https://bunkr.cr/a/alb123', null);

    const bkCard2 = bunkrWrap.querySelectorAll('.smg-fhcard[data-key="bunkr"]')[1];
    assert(bkCard2 !== null, 'Segundo card Bunkr deve ser montado');
    const bk2Thumbs = bkCard2 ? bkCard2.querySelectorAll('.smg-fhcard-thumb img') : [];
    assert(bk2Thumbs.length === 4, 'Card Bunkr via cache deve exibir 4 thumbnails do mosaico');
    const bk2Count = bkCard2 ? bkCard2.querySelector('.smg-fhcard-count') : null;
    assert(bk2Count && bk2Count.textContent.includes('15'), 'Card Bunkr via cache deve exibir badge com contagem 15');

    // 3b. Card Bunkr com título genérico (label == platform) não duplica na linha superior
    assert(bkCard.querySelector('.smg-fhcard-platform') === null, 'Card Bunkr genérico (onde label == platform) não deve ter .smg-fhcard-platform');
    assert(bkCard.querySelector('.smg-fhcard-host').textContent === 'Bunkr', 'Card Bunkr genérico deve manter "Bunkr" no título');

    // 3c. Card Bunkr com título customizado do unfurl (ex.: "Katerinchik 2026 07", "Galeria · 15 itens")
    const bkCustomWrap = document.createElement('div');
    bkCustomWrap.className = 'message-userContent';
    const bkCustomUnfurl = document.createElement('div');
    bkCustomUnfurl.className = 'bbCodeBlock bbCodeBlock--unfurl';
    bkCustomUnfurl.setAttribute('data-url', 'https://bunkr.cr/a/kat123');
    bkCustomUnfurl.setAttribute('data-host', 'bunkr.cr');
    bkCustomUnfurl.innerHTML = `
        <div class="contentRow">
            <div class="contentRow-figure"><img src="https://example.com/bunkr-kat.jpg" /></div>
            <div class="contentRow-main">
                <div class="contentRow-header js-unfurl-title">Katerinchik 2026 07</div>
                <div class="contentRow-snippet">15 itens</div>
            </div>
        </div>
    `;
    bkCustomWrap.appendChild(bkCustomUnfurl);
    document.body.appendChild(bkCustomWrap);
    fhBunkr(bkCustomUnfurl, 'https://bunkr.cr/a/kat123', bkCustomUnfurl);

    const bkCustomCard = bkCustomWrap.querySelector('.smg-fhcard[data-key="bunkr"]');
    assert(bkCustomCard !== null, 'Card Bunkr com título customizado deve ser montado');
    const bkCustomPlat = bkCustomCard ? bkCustomCard.querySelector('.smg-fhcard-platform') : null;
    const bkCustomHost = bkCustomCard ? bkCustomCard.querySelector('.smg-fhcard-host') : null;
    const bkCustomSub = bkCustomCard ? bkCustomCard.querySelector('.smg-fhcard-sub') : null;
    assert(bkCustomPlat && bkCustomPlat.textContent === 'Bunkr', 'Card Bunkr com título customizado deve ter .smg-fhcard-platform com "Bunkr"');
    assert(bkCustomHost && bkCustomHost.textContent === 'Katerinchik 2026 07', 'Card Bunkr com título customizado deve ter .smg-fhcard-host com o título');
    assert(bkCustomSub && bkCustomSub.textContent === '15 itens', 'Card Bunkr com título customizado deve ter .smg-fhcard-sub sem prefixo repetido');
    bkCustomWrap.remove();

    // 3d. pdPlace com link <a> contendo texto customizado
    const aWrap = document.createElement('div');
    aWrap.className = 'message-userContent';
    const aLink = document.createElement('a');
    aLink.href = 'https://bunkr.cr/a/kat123';
    aLink.textContent = 'Katerinchik 2026 07';
    aWrap.appendChild(aLink);
    document.body.appendChild(aWrap);

    const aCard = window.fhCard({ key: 'bunkr', platform: 'Bunkr', label: 'Bunkr', href: aLink.href, sub: 'Galeria · 15 itens' });
    window.pdPlace(aLink, aCard);
    const aPlat = aCard.querySelector('.smg-fhcard-platform');
    const aHost = aCard.querySelector('.smg-fhcard-host');
    const aSub = aCard.querySelector('.smg-fhcard-sub');
    assert(aPlat && aPlat.textContent === 'Bunkr', 'pdPlace com <a> customizado deve criar .smg-fhcard-platform com "Bunkr"');
    assert(aHost && aHost.textContent === 'Katerinchik 2026 07', 'pdPlace com <a> customizado deve definir .smg-fhcard-host com o texto do link');
    assert(aSub && aSub.textContent === 'Galeria · 15 itens', 'pdPlace com <a> customizado deve manter os detalhes no subtítulo');
    aWrap.remove();

    bunkrWrap.remove();

    // 4. fhGoonbox monta o card imediatamente e suporta cache/mosaico
    const gbWrap = document.createElement('div');
    gbWrap.className = 'message-userContent';
    const gbUnfurl = document.createElement('div');
    gbUnfurl.className = 'bbCodeBlock bbCodeBlock--unfurl';
    gbUnfurl.setAttribute('data-url', 'https://goonbox.cr/a/ab8XKK');
    gbUnfurl.setAttribute('data-host', 'goonbox.cr');
    gbUnfurl.innerHTML = `
        <div class="contentRow">
            <div class="contentRow-figure"><img src="https://example.com/gb-prelim.jpg" /></div>
            <div class="contentRow-main">
                <div class="contentRow-header js-unfurl-title">Special Photoshoot #1</div>
                <div class="contentRow-snippet">12 items</div>
            </div>
        </div>
    `;
    gbWrap.appendChild(gbUnfurl);
    document.body.appendChild(gbWrap);

    const fhGoonbox = window.fhGoonbox;
    assert(typeof fhGoonbox === 'function', 'fhGoonbox deve estar exposto em modo de teste');
    fhGoonbox(gbUnfurl, 'https://goonbox.cr/a/ab8XKK', null, gbUnfurl);

    const gbCard = gbWrap.querySelector('.smg-fhcard[data-key="goonbox"]');
    assert(gbCard !== null, 'Card Goonbox deve ser montado de forma imediata e síncrona');
    const gbImg = gbCard ? gbCard.querySelector('.smg-fhcard-thumb img') : null;
    assert(gbImg && gbImg.getAttribute('src') === 'https://example.com/gb-prelim.jpg', 'Card Goonbox deve ter thumbnail preliminar do unfurl');
    const gbPlat = gbCard ? gbCard.querySelector('.smg-fhcard-platform') : null;
    const gbHost = gbCard ? gbCard.querySelector('.smg-fhcard-host') : null;
    assert(gbPlat && gbPlat.textContent === 'Goonbox', 'Card Goonbox com título customizado deve ter .smg-fhcard-platform com "Goonbox"');
    assert(gbHost && gbHost.textContent === 'Special Photoshoot #1', 'Card Goonbox com título customizado deve ter .smg-fhcard-host com o título');
    gbWrap.remove();

    // 4. Spoiler com 3 imagens: valida que é criado um .auto-image-grid (mosaico do motor) dentro de .bbCodeSpoiler-content
    const spWrap = document.createElement('div');
    spWrap.className = 'message-userContent';
    spWrap.innerHTML = `
        <div class="bbCodeSpoiler">
            <button type="button" class="bbCodeSpoiler-button">Spoiler</button>
            <div class="bbCodeSpoiler-content">
                <a href="https://example.com/s1.jpg" class="smg-imglink"><img src="https://example.com/s1.jpg" class="bbImage" style="aspect-ratio: 1 / 1;"></a>
                <a href="https://example.com/s2.jpg" class="smg-imglink"><img src="https://example.com/s2.jpg" class="bbImage" style="aspect-ratio: 1 / 1;"></a>
                <a href="https://example.com/s3.jpg" class="smg-imglink"><img src="https://example.com/s3.jpg" class="bbImage" style="aspect-ratio: 1 / 1;"></a>
            </div>
        </div>
    `;
    document.body.appendChild(spWrap);
    buildPostGalleries([spWrap]);

    const spContent = spWrap.querySelector('.bbCodeSpoiler-content');
    const spGrid = spContent ? spContent.querySelector('.auto-image-grid') : null;
    assert(spGrid !== null, 'Deve ser criado um .auto-image-grid dentro do .bbCodeSpoiler-content');
    assert(spGrid && spGrid.classList.contains('smg-mason'), 'Grid dentro do spoiler deve ser montado no motor masonry (.smg-mason)');
    assert(spGrid && spGrid.querySelectorAll('img.bbImage').length === 3, 'Todas as 3 imagens devem estar dentro do grid do spoiler');
    spWrap.remove();

    // 5. Imagens fora do spoiler e imagens dentro do spoiler ficam em galerias separadas e não vazam
    const sepWrap = document.createElement('div');
    sepWrap.className = 'message-userContent';
    sepWrap.innerHTML = `
        <div class="bbWrapper">
            <a href="https://example.com/out1.jpg" class="smg-imglink"><img src="https://example.com/out1.jpg" class="bbImage" style="aspect-ratio: 1 / 1;"></a>
            <a href="https://example.com/out2.jpg" class="smg-imglink"><img src="https://example.com/out2.jpg" class="bbImage" style="aspect-ratio: 1 / 1;"></a>
            <div class="bbCodeSpoiler">
                <button type="button" class="bbCodeSpoiler-button">Spoiler</button>
                <div class="bbCodeSpoiler-content">
                    <a href="https://example.com/in1.jpg" class="smg-imglink"><img src="https://example.com/in1.jpg" class="bbImage" style="aspect-ratio: 1 / 1;"></a>
                    <a href="https://example.com/in2.jpg" class="smg-imglink"><img src="https://example.com/in2.jpg" class="bbImage" style="aspect-ratio: 1 / 1;"></a>
                    <a href="https://example.com/in3.jpg" class="smg-imglink"><img src="https://example.com/in3.jpg" class="bbImage" style="aspect-ratio: 1 / 1;"></a>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(sepWrap);
    buildPostGalleries([sepWrap]);

    const outGrid = sepWrap.querySelector('.bbWrapper > .auto-image-grid');
    assert(outGrid !== null, 'Deve existir um .auto-image-grid externo para as imagens fora do spoiler');
    const outImgs = outGrid ? Array.from(outGrid.querySelectorAll('img.bbImage')).map(i => i.getAttribute('src')) : [];
    assert(outImgs.length === 2 && outImgs.includes('https://example.com/out1.jpg') && outImgs.includes('https://example.com/out2.jpg'), 'Grid externo deve conter APENAS as imagens de fora do spoiler');
    assert(outGrid && outGrid.classList.contains('smg-mason'), 'Grid externo com 2 fotos deve ser montado no motor masonry (.smg-mason)');

    const inContent = sepWrap.querySelector('.bbCodeSpoiler-content');
    const inGrid = inContent ? inContent.querySelector('.auto-image-grid') : null;
    assert(inGrid !== null, 'Deve existir um .auto-image-grid interno dentro do spoiler');
    const inImgs = inGrid ? Array.from(inGrid.querySelectorAll('img.bbImage')).map(i => i.getAttribute('src')) : [];
    assert(inImgs.length === 3 && inImgs.includes('https://example.com/in1.jpg') && inImgs.includes('https://example.com/in2.jpg') && inImgs.includes('https://example.com/in3.jpg'), 'Grid do spoiler deve conter APENAS as imagens de dentro do spoiler');
    assert(!outImgs.includes('https://example.com/in1.jpg') && !inImgs.includes('https://example.com/out1.jpg'), 'Não deve haver vazamento de imagens entre o spoiler e o post externo');
    sepWrap.remove();

    // 6. Direct media (.mp4) dentro de spoiler é processada normalmente
    const dmWrap = document.createElement('div');
    dmWrap.className = 'message-userContent';
    dmWrap.innerHTML = `
        <div class="bbCodeSpoiler">
            <button type="button" class="bbCodeSpoiler-button">Open Spoiler</button>
            <div class="bbCodeSpoiler-content">
                <a href="https://example.com/video.mp4">Video Link</a>
            </div>
        </div>
    `;
    document.body.appendChild(dmWrap);
    const processDirectMedia = window.processDirectMedia;
    assert(typeof processDirectMedia === 'function', 'processDirectMedia deve estar exposto em modo de teste');
    processDirectMedia([dmWrap]);

    const dmVideoWrap = dmWrap.querySelector('.bbCodeSpoiler-content .smg-dm-wrap');
    assert(dmVideoWrap !== null, 'Vídeo direto .mp4 dentro de spoiler deve ser envolvido em .smg-dm-wrap');
    const dmVideo = dmVideoWrap ? dmVideoWrap.querySelector('video') : null;
    assert(dmVideo !== null, 'Elemento video deve ser criado para mídia direta dentro de spoiler');

    // 7. Spoiler button click adiciona seta e dispara relayoutGrid nas galerias internas
    if (typeof autoExpandSpoilers === 'function') {
        autoExpandSpoilers([dmWrap]);
        const btn = dmWrap.querySelector('.bbCodeSpoiler-button');
        assert(btn && btn.querySelector('.smg-spoiler-arrow'), 'Botão do spoiler deve receber a seta .smg-spoiler-arrow');
    }
    dmWrap.remove();

    // =========================================================================
    // TESTE 36: Prevenção de oscilação / flickering no Thread Header Sticky (.smg-thead-unified)
    // =========================================================================
    console.log('--- TESTE 36: Prevenção de oscilação / flickering no Thread Header Sticky (.smg-thead-unified) ---');

    // 1. Validar que o CSS de .smg-thead-unified e .smg-thead-sentinel contém overflow-anchor: none !important
    const unifiedOverflowAnchorMatch = scriptContent.includes('html.smg-thread .p-body-header.smg-thead-unified') &&
        scriptContent.includes('overflow-anchor: none !important;');
    assert(unifiedOverflowAnchorMatch, 'CSS de .smg-thead-unified deve conter overflow-anchor: none !important');

    const sentinelOverflowAnchorMatch = scriptContent.includes('.smg-thead-sentinel') &&
        scriptContent.includes('.smg-thead-sentinel { height: 0; margin: 0; padding: 0; overflow-anchor: none !important; }');
    assert(sentinelOverflowAnchorMatch, 'CSS de .smg-thead-sentinel deve conter overflow-anchor: none !important');

    // 2. Criar header mockado, spacer e sentinela no DOM
    const testHeader = document.createElement('div');
    testHeader.className = 'p-body-header smg-thead-unified';
    testHeader.style.top = '50px';
    const testSpacer = document.createElement('div');
    testSpacer.className = 'smg-thead-spacer';
    const testSentinel = document.createElement('div');
    testSentinel.className = 'smg-thead-sentinel';
    document.body.append(testSentinel, testSpacer, testHeader);

    let mockY = 100;
    testSentinel.getBoundingClientRect = () => ({ top: mockY, bottom: mockY, left: 0, right: 0, width: 0, height: 0 });

    const createStickySync = window.__filterbarExports?.createStickySync || window.createStickySync;
    assert(typeof createStickySync === 'function', 'createStickySync deve estar exposto em modo de teste');
    const sync = createStickySync(testHeader, testSentinel, testSpacer);
    assert(typeof sync === 'function', 'syncStuck deve ser retornado por createStickySync');
    assert(window.syncStuck === sync, 'window.syncStuck deve apontar para o handler de sincronização da thread');

    // Estado inicial no topo: não está stuck
    window.scrollY = 0;
    mockY = 100;
    sync();
    assert(!testHeader.classList.contains('is-stuck'), 'Estado inicial: is-stuck NÃO deve estar presente no topo');

    // Cenário 1: Se scrollY <= 40, is-stuck NÃO é adicionado mesmo se y <= 42 (topOff - 8)
    window.scrollY = 35;
    mockY = 40;
    sync();
    assert(!testHeader.classList.contains('is-stuck'), 'Cenário 1: Se scrollY <= 40, is-stuck NÃO é adicionado mesmo com y <= topOff - 8');

    // Cenário 2: Se scrollY = 50 e y = 40 (<= topOff - 8), is-stuck É adicionado
    window.scrollY = 50;
    mockY = 40;
    sync();
    assert(testHeader.classList.contains('is-stuck'), 'Cenário 2: Se scrollY > 40 e y <= topOff - 8, is-stuck É adicionado com sucesso');
    assert(testSpacer.style.display === 'block', 'Spacer deve ter display: block no modo stuck');
    assert(parseFloat(testSpacer.style.height) > 0, 'Spacer deve possuir altura positiva para preservar fluxo de scroll');

    // Cenário 3: Enquanto is-stuck estiver ativo, simular um salto de 40px no y (de 40 para 80) e scrollY = 50:
    // is-stuck NÃO é removido (a histerese de 45px protege contra o loop de oscilação / scroll anchoring)
    window.scrollY = 50;
    mockY = 80;
    sync();
    assert(testHeader.classList.contains('is-stuck'), 'Cenário 3: Salto de 40px no y por scroll anchoring NÃO remove is-stuck (histerese ampla de 45px)');

    // Cenário 4a: Se y >= topOff + 45 (ex.: 96px), is-stuck é removido com sucesso
    window.scrollY = 50;
    mockY = 96;
    sync();
    assert(!testHeader.classList.contains('is-stuck'), 'Cenário 4a: Se y >= topOff + 45 (96px), is-stuck é removido com sucesso');
    assert(testSpacer.style.display === 'none', 'Spacer deve ter display: none no modo unstuck');

    // Re-stick para validar reset pelo scroll no topo
    window.scrollY = 50;
    mockY = 40;
    sync();
    assert(testHeader.classList.contains('is-stuck'), 'Re-stick preparatório para testar retorno ao topo');

    // Cenário 4b: Se scrollY <= 20 (usuário rolou de volta até o topo da thread), is-stuck é removido com sucesso
    window.scrollY = 15;
    mockY = 70; // Sentinela ainda em zona intermediária, mas a página voltou ao topo
    sync();
    assert(!testHeader.classList.contains('is-stuck'), 'Cenário 4b: Se scrollY <= 20, is-stuck é removido com sucesso ao voltar ao topo da thread');

    // Limpeza
    testHeader.remove();
    testSpacer.remove();
    testSentinel.remove();

    // =========================================================================
    // TESTE 37: Unificação de imagens presas em tags de formatação vazias (<b><span><span>) e mesclagem de grids adjacentes
    // =========================================================================
    console.log('--- TESTE 37: Unificação de imagens presas em tags de formatação vazias (<b><span><span>) e mesclagem de grids adjacentes ---');

    // Sub-teste A: Unwrapping de formatação aninhada vazia
    const pWrap = document.createElement('div');
    pWrap.className = 'message-userContent';
    pWrap.innerHTML = `
        <div class="bbWrapper">
            <h2 class="bbHeading"><b><span style="color: rgb(97, 189, 109);"><span style="font-size: 26px;">Katerinchik Chaturbate pack 2026-07</span></span></b></h2>
            <hr>
            <b><span style="color: rgb(97, 189, 109);"><span style="font-size: 26px;">
                <a href="https://example.com/1.jpg"><img class="bbImage" src="https://example.com/1.jpg" style="width: 100px; aspect-ratio: 100 / 100;"></a>
                <a href="https://example.com/2.jpg"><img class="bbImage" src="https://example.com/2.jpg" style="aspect-ratio: 16 / 9;"></a>
                <a href="https://example.com/3.jpg"><img class="bbImage" src="https://example.com/3.jpg" style="aspect-ratio: 16 / 9;"></a>
            </span></span></b>
            <a href="https://example.com/4.jpg"><img class="bbImage" src="https://example.com/4.jpg" style="aspect-ratio: 3 / 4;"></a>
            <a href="https://example.com/5.jpg"><img class="bbImage" src="https://example.com/5.jpg" style="aspect-ratio: 3 / 4;"></a>
            <a href="https://example.com/6.jpg"><img class="bbImage" src="https://example.com/6.jpg" style="aspect-ratio: 3 / 4;"></a>
        </div>
    `;
    document.body.appendChild(pWrap);

    const img1 = pWrap.querySelector('img[src="https://example.com/1.jpg"]');
    Object.defineProperty(img1, 'naturalWidth', { value: 1080, configurable: true });
    Object.defineProperty(img1, 'naturalHeight', { value: 1920, configurable: true });
    Object.defineProperty(img1, 'complete', { value: true, configurable: true });
    const procImg = window.__masonryExports?.processOneImage || window.processOneImage || processOneImage;
    if (typeof procImg === 'function') procImg(img1);

    buildPostGalleries([pWrap]);

    // 1. Validar que existe EXATAMENTE 1 .auto-image-grid em pWrap (nenhum grid duplicado ou separado)
    const pWrapGrids = pWrap.querySelectorAll('.auto-image-grid');
    assert(pWrapGrids.length === 1, 'Deve existir EXATAMENTE 1 .auto-image-grid em pWrap');

    // 2. Validar que o .auto-image-grid possui todas as 6 imagens como filhos
    const pWrapGrid = pWrapGrids[0];
    const pWrapImgs = pWrapGrid.querySelectorAll('img.bbImage');
    assert(pWrapImgs.length === 6, 'O .auto-image-grid deve conter todas as 6 imagens');
    assert(pWrapGrid.children.length === 6, 'O .auto-image-grid deve possuir todas as 6 mídias como filhos diretos');

    // 3. Validar que nenhuma imagem ficou presa dentro de <b> ou <span>
    const trapped = pWrap.querySelectorAll('b img.bbImage, span img.bbImage');
    assert(trapped.length === 0, 'Nenhuma imagem deve ficar presa dentro de tags de formatação <b> ou <span>');

    // 4. Validar que o título dentro de <h2> continua intacto com suas tags de formatação <b><span><span>Katerinchik...</span></span></b>
    const heading2 = pWrap.querySelector('h2.bbHeading');
    assert(heading2 !== null, 'O elemento <h2> com o título do post deve existir');
    assert(heading2 && heading2.querySelector('b > span > span') !== null, 'O título dentro de <h2> deve manter suas tags de formatação');
    assert(heading2 && heading2.textContent.trim() === 'Katerinchik Chaturbate pack 2026-07', 'O texto autoral do título deve permanecer idêntico');

    // 5. Validar que a Imagem 1 teve seu width inline removido e seu aspect ratio corrigido
    assert(!img1.style.width, 'Imagem 1 deve ter seu width inline removido');
    assert(img1.style.aspectRatio === '1080 / 1920', 'Imagem 1 deve ter seu aspect-ratio corrigido de 100/100 para o natural');

    pWrap.remove();

    // Sub-teste B: imagem que nasce DEPOIS entre dois grupos (só <br> no meio) une os dois num grupo só
    const containerAdj = document.createElement('div');
    containerAdj.className = 'message-userContent';
    containerAdj.innerHTML = `<div class="bbWrapper"><div class="auto-image-grid"><a href="https://example.com/m1.jpg"><img class="bbImage" src="https://example.com/m1.jpg"></a><a href="https://example.com/m2.jpg"><img class="bbImage" src="https://example.com/m2.jpg"></a></div><br><a href="https://example.com/mx.jpg"><img class="bbImage" src="https://example.com/mx.jpg"></a><br><div class="auto-image-grid"><a href="https://example.com/m3.jpg"><img class="bbImage" src="https://example.com/m3.jpg"></a><a href="https://example.com/m4.jpg"><img class="bbImage" src="https://example.com/m4.jpg"></a></div></div>`;
    document.body.appendChild(containerAdj);
    window.__masonryExports.buildPostGallery(containerAdj);

    const mergedList = containerAdj.querySelectorAll('.auto-image-grid');
    assert(mergedList.length === 1, 'Grupos separados só por <br> + uma imagem nova viram exatamente 1 grupo');
    assert(mergedList[0].children.length === 5, 'O grupo unificado deve conter os 5 itens');
    assert(Array.from(mergedList[0].querySelectorAll('img')).map(i => i.getAttribute('src').slice(-6)).join(',') === 'm1.jpg,m2.jpg,mx.jpg,m3.jpg,m4.jpg', 'A ordem do documento é preservada ao unir grupos');

    containerAdj.remove();

    // =========================================================================
    // TESTE 38: Prevenção de corte de vídeo e preservação dos controles em players 1 por linha
    // =========================================================================
    console.log('--- TESTE 38: Prevenção de corte de vídeo e preservação dos controles em players 1 por linha ---');

    // 4. Validar que a regra defensiva não força overflow: hidden !important em elementos com .smg-player-loaded, :has(.smg-rg) ou :has(.smg-turbo-slot--filled)
    assert(injectedCSS.includes('.generic2wide-iframe-div:not(.smg-player-loaded):not(:has(.smg-rg)):not(:has(.smg-turbo-slot--filled))'), 'Regra defensiva não deve aplicar overflow: hidden a elementos com .smg-player-loaded, .smg-rg ou .smg-turbo-slot--filled');
    assert(injectedCSS.includes('span[data-s9e-mediaembed]:not(.smg-player-loaded):not(:has(.smg-rg))'), 'Regra defensiva não deve aplicar overflow: hidden a data-s9e-mediaembed com .smg-player-loaded ou .smg-rg');
    assert(!injectedCSS.match(/\.generic2wide-iframe-div,\s*span\[data-s9e-mediaembed\]\s*\{\s*overflow:\s*hidden\s*!important;\s*\}/), 'Regra defensiva geral NÃO deve aplicar overflow: hidden incondicionalmente');


    // =========================================================================
    // TESTE 40: Correção de corte de vídeos verticais e ocupação correta da altura do player
    // =========================================================================
    console.log('--- TESTE 40: Correção de corte de vídeos verticais e ocupação correta da altura do player ---');

    // 2) injectedCSS.includes('.generic2wide-iframe-div.smg-player-loaded') e span[data-s9e-mediaembed].smg-player-loaded com aspect-ratio: auto !important; e overflow: visible !important;
    assert(injectedCSS.includes('.generic2wide-iframe-div.smg-player-loaded'), 'CSS deve conter .generic2wide-iframe-div.smg-player-loaded');
    assert(injectedCSS.includes('span[data-s9e-mediaembed].smg-player-loaded'), 'CSS deve conter span[data-s9e-mediaembed].smg-player-loaded');
    const playerLoadedRule = injectedCSS.match(/\.generic2wide-iframe-div\.smg-player-loaded[\s\S]*?\{([^}]+)\}/);
    assert(playerLoadedRule !== null && playerLoadedRule[1].includes('aspect-ratio: auto !important;'), '.generic2wide-iframe-div.smg-player-loaded deve ter aspect-ratio: auto !important;');
    assert(playerLoadedRule !== null && playerLoadedRule[1].includes('overflow: visible !important;'), '.generic2wide-iframe-div.smg-player-loaded deve ter overflow: visible !important;');

    // 3) Criar elemento .generic2wide-iframe-div com .smg-rg, chamar rgAspect(wrap, 1080, 1920) e validar que o container pai ganha .smg-player-loaded, aspect-ratio: auto, --smg-ratio = 0.5625.
    const { rgAspect: testRgAspect, rgBuild: testRgBuild } = window.__redgifsExports;
    assert(typeof testRgAspect === 'function', 'rgAspect deve estar exposto em window.__redgifsExports');
    assert(typeof testRgBuild === 'function', 'rgBuild deve estar exposto em window.__redgifsExports');

    const t40Container = document.createElement('div');
    t40Container.className = 'generic2wide-iframe-div';
    const { wrap: t40Wrap } = testRgBuild('testId40');
    t40Container.appendChild(t40Wrap);
    document.body.appendChild(t40Container);

    const aspectResult = testRgAspect(t40Wrap, 1080, 1920);
    assert(aspectResult === true, 'rgAspect deve retornar true para 1080x1920');
    assert(t40Container.classList.contains('smg-player-loaded'), 'Container pai deve receber classe .smg-player-loaded');
    assert(t40Container.style.getPropertyValue('aspect-ratio') === 'auto', 'Container pai deve ter aspect-ratio = auto');
    assert(t40Container.style.getPropertyValue('overflow') === 'visible', 'Container pai deve ter overflow = visible');
    assert(t40Container.style.getPropertyValue('--smg-ratio') === '0.5625', 'Container pai deve ter --smg-ratio = 0.5625');
    assert(t40Container.style.getPropertyValue('--smg-rg-ratio') === '0.5625', 'Container pai deve ter --smg-rg-ratio = 0.5625');
    assert(t40Wrap.classList.contains('smg-rg-vert'), 'Wrapper deve ter classe smg-rg-vert para vídeo vertical');
    t40Container.remove();

    // 4) Validar que rgBuild escuta loadedmetadata e dispara rgAspect.
    const { wrap: t40BuildWrap, video: t40BuildVideo } = testRgBuild('metaTestId');
    const t40MetaContainer = document.createElement('div');
    t40MetaContainer.className = 'generic2wide-iframe-div';
    t40MetaContainer.appendChild(t40BuildWrap);
    document.body.appendChild(t40MetaContainer);

    Object.defineProperty(t40BuildVideo, 'videoWidth', { value: 720, configurable: true });
    Object.defineProperty(t40BuildVideo, 'videoHeight', { value: 1280, configurable: true });
    t40BuildVideo.dispatchEvent(new window.Event('loadedmetadata'));

    assert(t40MetaContainer.classList.contains('smg-player-loaded'), 'loadedmetadata deve disparar rgAspect e adicionar .smg-player-loaded ao container pai');
    assert(t40BuildWrap.style.aspectRatio === '720 / 1280', 'loadedmetadata deve atualizar o aspectRatio do wrapper para 720 / 1280');
    assert(t40BuildWrap.classList.contains('smg-rg-vert'), 'loadedmetadata deve adicionar .smg-rg-vert ao wrapper');
    t40MetaContainer.remove();

    // 5) Validar que .smg-rg standalone usa var(--smg-rg-ratio, 1.7778) no max-width
    const rgStandaloneMatch = injectedCSS.match(/\n\s*\.smg-rg\s*\{([^}]+)\}/);   // a regra SOLTA (não a de um contêiner)
    assert(rgStandaloneMatch !== null, 'CSS deve conter regra standalone para .smg-rg');
    assert(rgStandaloneMatch[1].includes('var(--smg-rg-ratio, 1.7778)'), '.smg-rg standalone deve usar var(--smg-rg-ratio, 1.7778) no max-width');
    assert(!rgStandaloneMatch[1].includes('calc(var(--smg-media-h) * 16 / 9)'), '.smg-rg standalone NÃO deve usar 16 / 9 fixo no max-width');

    // =========================================================================
    // TESTE 41: Iframe de turbo/saint nunca ganha height:auto (cortava o rodapé do player)
    // =========================================================================
    console.log('--- TESTE 41: Iframe de turbo/saint nunca ganha height:auto ---');

    // 3) Ausência de .generic2wide-iframe-div iframe no seletor de 07-feed.js que aplicava height: auto !important;
    const feedAutoHeightMatches = injectedCSS.match(/[^{}]*\.generic2wide-iframe-div\s+iframe[^{]*\{[^}]*height:\s*auto\s*!important[^}]*\}/g);
    assert(feedAutoHeightMatches === null, 'Nenhuma regra CSS deve aplicar height: auto !important em .generic2wide-iframe-div iframe');


    // =========================================================================
    // TESTE 42: Otimizações de Performance na Renderização da Thread
    // =========================================================================
    console.log('--- TESTE 42: Otimizações de Performance na Renderização da Thread ---');

    // 1. normalizeRoots fast-paths, ordenação por profundidade e cache _normalized
    const norm = window.__performanceExports.normalizeRoots;
    assert(typeof norm === 'function', 'normalizeRoots deve estar exposto no __performanceExports');

    // Fast-path null/undefined -> [document.body]
    const defRoots = norm(null);
    assert(defRoots.length === 1 && defRoots[0] === document.body && defRoots._normalized === true, 'normalizeRoots(null) deve retornar [document.body] com _normalized = true');

    // Fast-path _normalized cache
    const testArr = [document.createElement('div')];
    testArr._normalized = true;
    assert(norm(testArr) === testArr, 'normalizeRoots deve retornar o mesmo array se _normalized for true');

    // Fast-path único nó
    const singleNode = document.createElement('div');
    const normSingle = norm([singleNode]);
    assert(normSingle.length === 1 && normSingle[0] === singleNode && normSingle._normalized === true, 'normalizeRoots com único nó deve retornar o nó com _normalized = true');

    // Fast-path document.body ou documentElement em raízes múltiplas
    const mixedRoots = [document.createElement('div'), document.body, document.createElement('span')];
    const normMixed = norm(mixedRoots);
    assert(normMixed.length === 1 && normMixed[0] === document.body && normMixed._normalized === true, 'normalizeRoots com document.body deve retornar [document.body] imediatamente');

    const htmlMixedRoots = [document.createElement('div'), document.documentElement];
    const normHtml = norm(htmlMixedRoots);
    assert(normHtml.length === 1 && normHtml[0] === document.body && normHtml._normalized === true, 'normalizeRoots com documentElement deve retornar [document.body] imediatamente');

    // Filtragem de aninhamento com cache de profundidade (Map)
    const parentDiv = document.createElement('div');
    const childDiv = document.createElement('div');
    parentDiv.appendChild(childDiv);
    document.body.appendChild(parentDiv);
    const nestedNorm = norm([childDiv, parentDiv]);
    assert(nestedNorm.length === 1 && nestedNorm[0] === parentDiv && nestedNorm._normalized === true, 'normalizeRoots deve reter apenas a raiz ancestral mais externa');
    parentDiv.remove();

    // 2. eachIn(roots, selector, fn) evita chamar closest() no document.body/documentElement
    const eachInFn = window.__performanceExports.eachIn || window.__helpersExports.eachIn;
    assert(typeof eachInFn === 'function', 'eachIn deve estar exposto para testes');

    let bodyClosestCalled = false;
    const origBodyClosest = document.body.closest;
    document.body.closest = function(sel) {
        bodyClosestCalled = true;
        return origBodyClosest ? origBodyClosest.call(this, sel) : null;
    };
    const eachInHost = document.createElement('div');
    eachInHost.className = 'smg-test-eachin';
    document.body.appendChild(eachInHost);
    let eachInHits = 0;
    eachInFn([document.body], '.smg-test-eachin', node => {
        eachInHits++;
    });
    assert(bodyClosestCalled === false, 'eachIn NÃO deve chamar root.closest() quando root === document.body');
    assert(eachInHits === 1, 'eachIn deve localizar nós filhos corretamente');
    document.body.closest = origBodyClosest;
    eachInHost.remove();


    // 5. unwrapEmptyMediaFormatting sem clonagem de nós (hasAuthorText)
    const unwrapFn = window.__masonryExports.unwrapEmptyMediaFormatting;
    assert(typeof unwrapFn === 'function', 'unwrapEmptyMediaFormatting deve estar exposto');
    assert(!scriptContent.includes('const clone = el.cloneNode(true);'), 'unwrapEmptyMediaFormatting NÃO deve clonar nós do DOM com cloneNode');

    const testScope = document.createElement('div');
    testScope.innerHTML = '<b><span style="color:red"><img class="bbImage" src="https://example.com/p.jpg"></span></b>';
    unwrapFn(testScope);
    assert(testScope.querySelector('b') === null, 'unwrapEmptyMediaFormatting deve remover wrapper b vazio sem clonagem');
    assert(testScope.querySelector('span') === null, 'unwrapEmptyMediaFormatting deve remover wrapper span vazio sem clonagem');
    assert(testScope.querySelector('img.bbImage') !== null, 'unwrapEmptyMediaFormatting deve manter a imagem bbImage');

    // Garante que texto autoral real NÃO seja removido
    const testScopeWithText = document.createElement('div');
    testScopeWithText.innerHTML = '<b>Hello World<img class="bbImage" src="https://example.com/p.jpg"></b>';
    unwrapFn(testScopeWithText);
    assert(testScopeWithText.querySelector('b') !== null, 'unwrapEmptyMediaFormatting NÃO deve remover b que contém texto autoral real');

    // 6. Otimização do seletor em buildPostGalleries
    assert(scriptContent.includes("'img.bbImage:not([data-smg-galseen]), .smg-dead--img:not([data-smg-galseen])'"), 'buildPostGalleries deve utilizar seletor direto e indexado de mídias');
    assert(!scriptContent.includes('scopes.forEach(root => types.forEach(t => sel.push(root + \' \' + t + \':not([data-smg-galseen])\')));'), 'buildPostGalleries NÃO deve gerar a matriz de 20 seletores descendentes combinados');

    // 7. Eliminação de layout thrashing em processDirectMedia
    assert(!scriptContent.includes('const rect = v.getBoundingClientRect();'), 'processDirectMedia NÃO deve executar getBoundingClientRect() sobre elemento de vídeo desanexado');

    // 8. Condicionamento inteligente de passes em processAll
    assert(scriptContent.includes('const contentDirty = fullScan || threadDirty || (isBookmarks && listDirty) || (typeof feedContext === \'function\' && feedContext());'), 'processAll deve calcular flag agregada contentDirty');
    assert(scriptContent.includes('if (isContentFeed && contentDirty)'), 'processAll deve condicionar passes de conteúdo ao contentDirty');
    assert(scriptContent.includes('if (threadDirty) {') && scriptContent.includes('safe(buildPostCards, roots);'), 'Passes de thread devem ser condicionados a threadDirty');

    
    // =========================================================================
    // TESTE 43: Paralelização, Extração Síncrona de Dimensões e Anti-CLS no Loading
    // =========================================================================
    console.log('--- TESTE 43: Paralelização, Extração Síncrona de Dimensões e Anti-CLS no Loading ---');

    const { extractMediaDimensions, postItemRatio: bRelH } = window.__masonryExports;
    assert(typeof extractMediaDimensions === 'function', 'extractMediaDimensions deve estar exposto');

    // 1. Extração por atributos width e height no <img>
    const imgAttr = document.createElement('img');
    imgAttr.className = 'bbImage';
    imgAttr.setAttribute('width', '1920');
    imgAttr.setAttribute('height', '1080');
    const dimAttr = extractMediaDimensions(imgAttr);
    assert(dimAttr !== null, 'extractMediaDimensions deve extrair de width/height');
    assert(dimAttr.w === 1920 && dimAttr.h === 1080, 'w=1920 e h=1080 extraídos corretamente');
    assert(Math.abs(dimAttr.relH - 0.5625) < 0.001, 'relH deve ser ~0.5625 para 16:9');
    assert(Math.abs(bRelH(imgAttr) - 0.5625) < 0.001, 'A proporção do item no mosaico deve usar dimensões extraídas do HTML síncronas');

    // 2. Extração por data-width e data-height no wrapper .bbImageWrapper
    const wrapEl = document.createElement('div');
    wrapEl.className = 'bbImageWrapper';
    wrapEl.setAttribute('data-width', '1280');
    wrapEl.setAttribute('data-height', '720');
    const wrapImg = document.createElement('img');
    wrapImg.className = 'bbImage';
    wrapEl.appendChild(wrapImg);
    const dimWrap = extractMediaDimensions(wrapImg);
    assert(dimWrap !== null, 'extractMediaDimensions deve extrair do parent .bbImageWrapper');
    assert(dimWrap.w === 1280 && dimWrap.h === 720, 'w=1280 e h=720 extraídos do wrapper');
    assert(Math.abs(bRelH(wrapImg) - 0.5625) < 0.001, 'A proporção do item no mosaico deve retornar ~0.5625 para imagem dentro de wrapper');

    // 3. Extração por query params na URL (?w=1080&h=1920)
    const imgUrl = document.createElement('img');
    imgUrl.className = 'bbImage';
    imgUrl.src = 'https://example.com/photo.jpg?w=1080&h=1920';
    const dimUrl = extractMediaDimensions(imgUrl);
    assert(dimUrl !== null, 'extractMediaDimensions deve extrair de query params na URL');
    assert(dimUrl.w === 1080 && dimUrl.h === 1920, 'w=1080 e h=1920 extraídos da URL');
    assert(Math.abs(dimUrl.relH - 1.7778) < 0.001, 'relH deve ser ~1.7778 para vertical 9:16');

    // 4. Extração por padrão de arquivo na URL (/1920x1080/)
    const imgFile = document.createElement('img');
    imgFile.className = 'bbImage';
    imgFile.src = 'https://example.com/uploads/photo-1920x1080.jpg';
    const dimFile = extractMediaDimensions(imgFile);
    assert(dimFile !== null, 'extractMediaDimensions deve extrair de padrão de arquivo 1920x1080');
    assert(dimFile.w === 1920 && dimFile.h === 1080, 'w=1920 e h=1080 extraídos do nome de arquivo');

    // 6. Paint Gate para threads requer prontidão de post.dataset.smgGalReady
    const threadCtx = { kind: 'thread' };
    const pBodyHeader = document.createElement('div');
    pBodyHeader.className = 'p-body-header';
    pBodyHeader.dataset.smgThead = '1';
    pBodyHeader.dataset.smgUnified = '1';
    document.body.appendChild(pBodyHeader);

    const t43Content = document.querySelector('.p-body-content');
    let t43Block = t43Content ? t43Content.querySelector('.block--messages, .block-body--messages') : null;
    let t43CreatedBlock = false;
    if (!t43Block) {
        t43Block = document.createElement('div');
        t43Block.className = 'block--messages';
        if (t43Content) t43Content.appendChild(t43Block);
        t43CreatedBlock = true;
    }

    const postArticle = document.createElement('article');
    postArticle.className = 'message';
    postArticle.dataset.smgCardReady = '1';
    // Sem smgGalReady inicialmente
    t43Block.appendChild(postArticle);

    const { paintPageIsReady: pIsReady } = window.__paintExports;
    assert(pIsReady(threadCtx) === false, 'paintPageIsReady deve retornar FALSE se smgGalReady não estiver pronto');

    postArticle.dataset.smgGalReady = '1';
    assert(pIsReady(threadCtx) === true, 'paintPageIsReady deve retornar TRUE quando smgCardReady E smgGalReady estiverem prontos');

    postArticle.remove();
    pBodyHeader.remove();
    if (t43CreatedBlock && t43Block.parentNode) t43Block.remove();

    
    // =========================================================================
    // TESTE 48: Refatoração da Topbar da Thread (Badges acima do título, tags fora do header sticky, thumb ampliado e controles agrupados)
    // =========================================================================
    console.log('--- TESTE 48: Refatoração da Topbar da Thread (Badges acima do título, tags fora do header sticky, thumb ampliado e controles agrupados) ---');

    // 1. Validar no CSS gerado: .smg-thead-badges-row, .smg-thead-thumb com 120px, -webkit-line-clamp: 2, padding-left: 0 !important, -webkit-line-clamp: 1 no stuck, etc.
    const allStyles48 = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');
    assert(allStyles48.includes('.smg-thead-badges-row'), 'CSS deve conter regra para .smg-thead-badges-row');
    assert(allStyles48.includes('width: 120px !important;') && allStyles48.includes('height: 120px !important;'), 'CSS deve conter .smg-thead-thumb com 120px');
    assert(allStyles48.includes('-webkit-line-clamp: 2 !important;'), 'CSS deve conter -webkit-line-clamp: 2 para permitir até 2 linhas no título');
    assert(allStyles48.includes('padding-left: 0 !important;'), 'CSS deve conter padding-left: 0 !important;');
    assert(allStyles48.includes('.smg-thead-unified.is-stuck .p-title-value') && allStyles48.includes('-webkit-line-clamp: 1 !important;'), 'CSS deve conter -webkit-line-clamp: 1 no estado stuck');
    assert(allStyles48.includes('.smg-thead-controls') && allStyles48.includes('margin-left: auto') && allStyles48.includes('flex-shrink: 0'), 'CSS deve conter .smg-thead-controls com margin-left: auto e flex-shrink: 0');
    assert(allStyles48.includes('.smg-thead-unified.is-stuck .smg-thead-badges-row') && allStyles48.includes('display: none !important;'), 'CSS deve ocultar .smg-thead-badges-row quando o header estiver stuck');
    assert(allStyles48.includes('.smg-thead-spacer') && allStyles48.includes('overflow-anchor: none !important;'), 'CSS deve conter .smg-thead-spacer com overflow-anchor: none !important;');
    assert(allStyles48.includes('.smg-thead-unified.is-stuck .p-title-value') && allStyles48.includes('font-size: var(--smg-fs-15) !important;'), 'CSS deve conter font-size 15px (escala) no estado stuck');

    // 2. Criar header mockado com thumb, badges (.label), título longo e tags (.p-description)
    document.documentElement.classList.add('smg-thread');
    const header48 = document.createElement('div');
    header48.className = 'p-body-header';
    header48.innerHTML = `
        <div class="dcThumbnail"><img src="https://example.com/thumb.jpg" alt=""></div>
        <div class="p-title">
            <h1 class="p-title-value">  <span class="label label--twitch">Twitch</span> <span class="prefix prefix--onlyfans">OnlyFans</span>   Amouranth - Exclusive Photoshoot and Behind The Scenes Content Mega Collection Set (2024)   </h1>
        </div>
        <div class="p-description">
            <ul class="listInline">
                <li class="tagList-icon">🏷️</li>
                <li class="tagList"><a class="tagItem" href="/tags/cosplay/">cosplay</a></li>
            </ul>
        </div>`;
    const barHost48 = document.createElement('div');
    barHost48.className = 'block-outer';
    barHost48.innerHTML = '<div class="smg-bar"></div>';
    document.body.append(header48, barHost48);

    // 3. Executar buildThreadHeader()
    const buildThreadHeaderFn = window.__filterbarExports?.buildThreadHeader || window.buildThreadHeader;
    assert(typeof buildThreadHeaderFn === 'function', 'buildThreadHeader deve estar disponível');
    buildThreadHeaderFn();

    // 4. Validar que .smg-thead-badges-row foi criado acima do título com as badges
    const badgesRow48 = header48.querySelector('.smg-thead-badges-row');
    assert(badgesRow48 !== null, 'Linha de badges deve ser criada (.smg-thead-badges-row)');
    const badgesInRow48 = badgesRow48.querySelectorAll('.label, .prefix');
    assert(badgesInRow48.length >= 2, 'Badges devem estar na linha .smg-thead-badges-row');
    assert(badgesRow48.nextElementSibling?.classList.contains('smg-thead-titleline'), 'Badges devem ficar acima da linha do título (.smg-thead-titleline)');

    // Validar título longo quebra em até 2 linhas e sem padding/espaços indesejados no início
    const titleVal48 = header48.querySelector('.p-title-value');
    assert(titleVal48 !== null, '.p-title-value deve existir no header unificado');
    const titleTextSpan48 = titleVal48.querySelector('.smg-thead-title-text');
    assert(titleTextSpan48 !== null, '.smg-thead-title-text deve ser gerado');
    assert(titleTextSpan48.textContent.startsWith('Amouranth'), 'Título extraído não deve ter espaços residuais no início');
    assert(titleTextSpan48.textContent.endsWith('(2024)'), 'Título extraído não deve ter espaços residuais no fim');
    assert(!/^\s|\s$/.test(titleTextSpan48.textContent), 'Sanitização rigorosa deve garantir zero espaços no início e no fim do título');
    assert(!titleTextSpan48.textContent.includes('Twitch'), 'Badges não devem estar misturadas ao texto do título');

    // 5. Validar que as tags estão em .smg-thead-tags dentro de .smg-thead-info ao lado do título e da imagem
    const tagsBar48 = header48.querySelector('.smg-thead-tags') || header48.nextElementSibling;
    assert(tagsBar48 !== null && (tagsBar48.classList.contains('smg-thead-tags-bar') || tagsBar48.classList.contains('smg-thead-tags')), 'Tags devem estar em .smg-thead-tags');
    assert(tagsBar48.querySelector('.p-description') !== null, '.p-description deve estar dentro de .smg-thead-tags');
    assert(header48.contains(tagsBar48), 'Tags devem estar dentro do header junto ao título e à imagem');

    // 6. Validar que .smg-thead-controls abriga tanto .smg-bar quanto .smg-thead-actions
    const controls48 = header48.querySelector('.smg-thead-controls');
    assert(controls48 !== null, 'Controles da direita devem ser agrupados em .smg-thead-controls');
    assert(controls48.querySelector('.smg-bar') !== null, '.smg-thead-controls deve abrigar .smg-bar');
    assert(controls48.querySelector('.smg-thead-actions') !== null, '.smg-thead-controls deve abrigar .smg-thead-actions');

    // 7. Limpar os elementos criados
    header48.remove();
    barHost48.remove();
    tagsBar48?.remove();
    document.querySelector('.smg-thead-spacer')?.remove();
    document.querySelector('.smg-thead-sentinel')?.remove();

    // =========================================================================
    // TESTE 49: Imagens Widescreen Standalone e Sheets de Vídeo (Ocupação nobre de largura, sem miniatura de 500px)
    // =========================================================================
    console.log('--- TESTE 49: Imagens Widescreen Standalone e Sheets de Vídeo (Ocupação nobre de largura, sem miniatura de 500px) ---');

    // 1. Validar no CSS gerado: .smg-wide-link, img.bbImage.smg-wide com width: 100% !important e max-width: min(100%, 1080px) !important
    const allStyles49 = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');
    assert(allStyles49.includes('.smg-wide-link'), 'CSS deve conter regras para .smg-wide-link');
    assert(allStyles49.includes('max-width: min(100%, 1080px) !important;'), 'CSS deve conter max-width: min(100%, 1080px) !important; para imagens wide standalone');
    assert(allStyles49.includes('width: 100% !important;'), 'CSS deve conter width: 100% !important; para que imagens wide preencham o post');
    assert(allStyles49.includes('.bbCodeBlock--quote img.bbImage.smg-wide'), 'CSS deve manter teto compacto para imagens dentro de quotes');

    // 2. Mock de post real com imagem standalone horizontal (contact sheet / preview grid de 16 frames como do usuário)
    const post49 = document.createElement('article');
    post49.className = 'message message--post js-post';
    post49.innerHTML = `
        <div class="message-content">
            <div class="message-userContent">
                <div class="bbWrapper">
                    <p>Mirrors</p>
                    <a href="https://simp4.cuckcapital.cr/images2/video_sheet.jpg" class="js-lbImage smg-imglink">
                        <img src="https://simp6.cuckcapital.cr/images2/video_sheet.md.jpg"
                             data-url="https://simp6.cuckcapital.cr/images2/video_sheet.md.jpg"
                             class="bbImage"
                             alt="video_sheet.jpg">
                    </a>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(post49);

    const img49 = post49.querySelector('img.bbImage');
    const link49 = post49.querySelector('a.smg-imglink');

    // Simula dimensões naturais de um contact sheet widescreen (ex: 1920x1080 ou 500x281 na thumb)
    Object.defineProperty(img49, 'naturalWidth', { value: 500, configurable: true });
    Object.defineProperty(img49, 'naturalHeight', { value: 281, configurable: true });
    Object.defineProperty(img49, 'complete', { value: true, configurable: true });

    // Executa processImages
    const procImages = window.processImages || window.__masonryExports?.processImages;
    if (typeof procImages === 'function') {
        procImages([post49]);
    } else {
        const procOne = window.__masonryExports?.processOneImage || window.processOneImage;
        if (typeof procOne === 'function') procOne(img49);
    }

    // Validações
    assert(img49.classList.contains('smg-wide'), 'Imagem widescreen/sheet deve receber a classe .smg-wide');
    assert(link49.classList.contains('smg-wide-link'), 'Link container deve receber a classe .smg-wide-link para preencher a largura do post');
    assert(img49.dataset.smgFull === 'https://simp6.cuckcapital.cr/images2/video_sheet.jpg', 'img.dataset.smgFull deve apontar para o original sem .md.');
    assert(link49.href === 'https://simp6.cuckcapital.cr/images2/video_sheet.jpg', 'link.href deve apontar para o original em alta');

    // Limpeza
    post49.remove();

    // =========================================================================
    // TESTE 50: Reescrever domínios Saint para Turbo.cr e Embed de Links/Cards Turbo/Saint /embed/
    // =========================================================================
    console.log('--- TESTE 50: Saint2.su e domínios Saint para Turbo.cr & Embeds de /embed/ ---');

    // 1. Validar resolveProxyHref com domínios saint
    const resolveProxyFn = window.resolveProxyHref || window.__resolveProxyHref;
    assert(typeof resolveProxyFn === 'function', 'resolveProxyHref deve estar disponível no ambiente de testes');
    assert(resolveProxyFn('https://saint2.su/embed/BV4sXlByMZ-ua') === 'https://turbo.cr/embed/BV4sXlByMZ-ua', 'saint2.su deve ser reescrito para turbo.cr em resolveProxyHref');
    assert(resolveProxyFn('https://saint.cr/embed/xyz') === 'https://turbo.cr/embed/xyz', 'saint.cr deve ser reescrito para turbo.cr');
    assert(resolveProxyFn('https://saint.to/v/vid123') === 'https://turbo.cr/v/vid123', 'saint.to deve ser reescrito para turbo.cr');
    assert(resolveProxyFn('https://saint2.to/embed/test') === 'https://turbo.cr/embed/test', 'saint2.to deve ser reescrito para turbo.cr');
    assert(resolveProxyFn('https://saint2.cr/embed/test') === 'https://turbo.cr/embed/test', 'saint2.cr deve ser reescrito para turbo.cr');
    assert(resolveProxyFn('https://saint.su/embed/test') === 'https://turbo.cr/embed/test', 'saint.su deve ser reescrito para turbo.cr');

    // 2. Validar collectMediaFrom com turbo e saint
    const collectMediaFn = window.collectMediaFrom;
    assert(typeof collectMediaFn === 'function', 'collectMediaFrom deve estar disponível no ambiente de testes');

    const testRoot50 = document.createElement('div');
    testRoot50.innerHTML = `
        <a href="https://saint2.su/embed/BV4sXlByMZ-ua">saint2.su link</a>
        <a href="https://turbo.cr/embed/turbo123">turbo link</a>
        <div class="bbCodeBlock bbCodeBlock--unfurl" data-url="https://saint2.su/embed/unfurl123"></div>
        <div class="bbCodeBlock bbCodeBlock--unfurl" data-url="https://turbo.cr/embed/unfurl456"></div>
        <iframe src="https://saint2.su/embed/ifr789"></iframe>
    `;
    const collected50 = collectMediaFn(testRoot50);
    const collectedUrls = collected50.map(i => i.url);
    assert(collectedUrls.includes('https://turbo.cr/embed/BV4sXlByMZ-ua'), 'collectMediaFrom deve extrair embed do saint2.su reescrito para turbo.cr');
    assert(collectedUrls.includes('https://turbo.cr/embed/turbo123'), 'collectMediaFrom deve extrair embed do turbo.cr');
    assert(collectedUrls.includes('https://turbo.cr/embed/unfurl123'), 'collectMediaFrom deve extrair embed de unfurl saint reescrito');
    assert(collectedUrls.includes('https://turbo.cr/embed/unfurl456'), 'collectMediaFrom deve extrair embed de unfurl turbo');
    assert(collectedUrls.includes('https://turbo.cr/embed/ifr789'), 'collectMediaFrom deve extrair iframe reescrito para turbo.cr');

    // 2b. Álbum do turbo (turbo.cr/a/ID) não é vídeo: não vira o embed falso turbo.cr/embed/a
    const albumRoot50 = document.createElement('div');
    albumRoot50.innerHTML = `
        <div class="bbCodeBlock bbCodeBlock--unfurl" data-url="https://turbo.cr/a/AlbumXYZ"></div>
        <a href="https://turbo.cr/a/AlbumLink1">album link</a>
        <a href="https://turbo.cr/v/vidpage9">video page</a>
    `;
    const albumUrls50 = collectMediaFn(albumRoot50).map(i => i.url);
    assert(!albumUrls50.includes('https://turbo.cr/embed/a'), `Álbum do turbo não deve virar embed /embed/a (obtido: ${albumUrls50.join(', ')})`);
    assert(albumUrls50.includes('https://turbo.cr/embed/vidpage9'), 'Página /v/ID do turbo continua virando embed');

    // 2c. Total de páginas da dock lê "X de Y" (fórum em PT) igual a "X of Y"
    assert(typeof window.__readPageJump === 'function', 'readPageJump deve estar exposta para regressão');
    const prevUrl50 = window.location.href;
    window.history.pushState({}, '', '/threads/pt-pages.50/page-2');
    const pagerHost50 = document.createElement('div');
    pagerHost50.className = 'p-body-content';
    pagerHost50.innerHTML = '<div class="pageNavSimple"><a href="/threads/pt-pages.50/page-1">‹</a><span class="pageNavSimple-el pageNavSimple-el--current">2 de 30</span><a href="/threads/pt-pages.50/page-3">›</a></div>';
    document.body.prepend(pagerHost50);
    const pj50 = window.__readPageJump();
    pagerHost50.remove();
    window.history.pushState({}, '', prevUrl50);
    assert(pj50 && pj50.max === 30, `readPageJump deve ler o total de "2 de 30" (obtido: ${pj50 && pj50.max})`);

    // 3. Validar processTurboEmbeds em DOM vivo
    const procTurboFn = window.__processTurboEmbeds || window.processTurboEmbeds;
    assert(typeof procTurboFn === 'function', 'processTurboEmbeds deve estar disponível');

    const container50 = document.createElement('div');
    container50.innerHTML = `
        <iframe id="ifrSaint" src="https://saint2.su/embed/ifrTest1"></iframe>
        <div id="unfurlSaint" class="bbCodeBlock bbCodeBlock--unfurl" data-url="https://saint2.su/embed/unfurlTest2">
            <a href="https://saint2.su/embed/unfurlTest2">Unfurl</a>
        </div>
        <div id="unfurlTurbo" class="bbCodeBlock bbCodeBlock--unfurl" data-url="https://turbo.cr/embed/unfurlTest3">
            <a href="https://turbo.cr/embed/unfurlTest3">Unfurl</a>
        </div>
        <p id="bareP">
            <a id="bareSaint" href="https://saint2.su/embed/bareTest4">https://saint2.su/embed/bareTest4</a>
            <a id="bareTurbo" href="https://turbo.cr/embed/bareTest5">https://turbo.cr/embed/bareTest5</a>
            <a id="bareVideo" href="https://turbo.cr/v/mXZR1rnLc_yA2">https://turbo.cr/v/mXZR1rnLc_yA2</a>
            <a id="plainSaint" href="https://saint2.su/d/fileTest6">Download saint2.su file</a>
        </p>
        <div class="bbCodeBlock bbCodeBlock--quote">
            <a id="quotedSaint" href="https://saint2.su/embed/quoted7">Quoted Link</a>
        </div>
    `;
    document.body.appendChild(container50);

    procTurboFn([container50]);

    // Validar iframe existente reescrito
    const ifrSaint = container50.querySelector('#ifrSaint');
    assert(ifrSaint !== null, 'Iframe existente deve ser mantido');
    assert(ifrSaint.getAttribute('src') === 'https://turbo.cr/embed/ifrTest1', 'src do iframe deve ser reescrito para turbo.cr');
    assert(ifrSaint.classList.contains('saint-iframe'), 'Iframe deve receber a classe .saint-iframe');

    // Validar unfurl saint substituído por .generic2wide-iframe-div > iframe.saint-iframe
    assert(container50.querySelector('#unfurlSaint') === null, 'Unfurl card deve ter sido substituído');
    const ifrFromUnfurlSaint = container50.querySelector('iframe[src="https://turbo.cr/embed/unfurlTest2"]');
    assert(ifrFromUnfurlSaint !== null, 'Iframe turbo deve ser criado para unfurl saint');
    assert(ifrFromUnfurlSaint.classList.contains('saint-iframe'), 'Iframe criado deve ter saint-iframe');
    assert(ifrFromUnfurlSaint.parentElement.classList.contains('generic2wide-iframe-div'), 'Iframe deve estar dentro de .generic2wide-iframe-div');
    assert(ifrFromUnfurlSaint.parentElement.dataset.tbDone === '1', 'Wrapper deve estar marcado com data-tb-done = 1');

    // Validar unfurl turbo substituído por iframe
    assert(container50.querySelector('#unfurlTurbo') === null, 'Unfurl turbo deve ter sido substituído');
    const ifrFromUnfurlTurbo = container50.querySelector('iframe[src="https://turbo.cr/embed/unfurlTest3"]');
    assert(ifrFromUnfurlTurbo !== null, 'Iframe turbo deve ser criado para unfurl turbo');

    // Validar links bare /embed/ substituídos por player
    assert(container50.querySelector('#bareSaint') === null, 'Link bare saint /embed/ deve ter sido substituído por wrapper');
    const ifrFromBareSaint = container50.querySelector('iframe[src="https://turbo.cr/embed/bareTest4"]');
    assert(ifrFromBareSaint !== null, 'Iframe deve ser criado para bare saint link');
    assert(ifrFromBareSaint.parentElement.classList.contains('generic2wide-iframe-div'), 'Iframe bare saint deve estar dentro de .generic2wide-iframe-div');

    assert(container50.querySelector('#bareTurbo') === null, 'Link bare turbo /embed/ deve ter sido substituído por wrapper');
    const ifrFromBareTurbo = container50.querySelector('iframe[src="https://turbo.cr/embed/bareTest5"]');
    assert(ifrFromBareTurbo !== null, 'Iframe deve ser criado para bare turbo link');

    assert(container50.querySelector('#bareVideo') === null, 'Link turbo /v/ deve ter sido substituído por player');
    const ifrFromVideo = container50.querySelector('iframe[src="https://turbo.cr/embed/mXZR1rnLc_yA2"]');
    assert(ifrFromVideo !== null, 'Link /v/ deve virar iframe /embed/ do mesmo id');

    // Validar link plain saint (sem /embed/) reescrito para turbo.cr sem virar iframe
    const plainSaint = container50.querySelector('#plainSaint');
    assert(plainSaint !== null, 'Link saint sem /embed/ deve continuar sendo um elemento <a>');
    assert(plainSaint.getAttribute('href') === 'https://turbo.cr/d/fileTest6', 'href do link saint deve ser reescrito para turbo.cr');
    assert(plainSaint.textContent === 'Download turbo.cr file', 'textContent do link saint deve ser atualizado para turbo.cr');

    // Validar link dentro de quote ignorado (permanece <a> sem embed)
    const quotedSaint = container50.querySelector('#quotedSaint');
    assert(quotedSaint !== null && quotedSaint.tagName === 'A', 'Link dentro de quote não deve ser transformado em embed');

    // Limpeza
    container50.remove();

    // =========================================================================
    // TESTE 51: Suporte a .pageContent no tagsBar em SocialMediaGirls (html.smg-smg)
    // =========================================================================
    console.log('--- TESTE 51: SMG tagsBar com wrapper .pageContent & regras de CSS ---');

    // 1. Validar CSS gerado para SMG tagsBar
    const allStyles51 = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');
    assert(allStyles51.includes('html.smg-smg.smg-thread .smg-thead-tags-bar'), 'CSS deve conter regra para html.smg-smg.smg-thread .smg-thead-tags-bar');
    assert(allStyles51.includes('margin: var(--smg-sp-6) auto var(--smg-sp-14) auto !important;'), 'CSS deve conter margin: 6px auto 14px auto !important; para SMG tagsBar');
    assert(allStyles51.includes('html.smg-smg.smg-thread .smg-thead-tags-bar > .pageContent'), 'CSS deve conter regra para html.smg-smg.smg-thread .smg-thead-tags-bar > .pageContent');
    assert(allStyles51.includes('html.smg-smg.smg-thread .smg-thead-tags-bar:not(:has(.pageContent))'), 'CSS deve conter fallback para quando não houver .pageContent');
    assert(allStyles51.includes('.smg-thead-tags-bar > .pageContent') && allStyles51.includes('max-width: var(--smg-cw) !important;'), 'CSS desktop deve conter .smg-thead-tags-bar > .pageContent com max-width: var(--smg-cw)');

    // 2. Testar unifyThreadHeader no modo SMG quando o header possui .pageContent
    document.documentElement.className = 'smg-smg smg-thread';

    const smgHeader = document.createElement('div');
    smgHeader.className = 'p-body-header';
    smgHeader.innerHTML = `
        <div class="pageContent">
            <div class="p-title">
                <h1 class="p-title-value">SMG Thread Title</h1>
            </div>
            <div class="p-description">
                <ul class="listInline">
                    <li class="tagList"><a class="tagItem" href="/tags/model/">model</a></li>
                </ul>
            </div>
        </div>
    `;
    const smgBarHost = document.createElement('div');
    smgBarHost.className = 'block-outer';
    smgBarHost.innerHTML = '<div class="smg-bar"></div>';
    document.body.append(smgHeader, smgBarHost);

    const unifyFn = window.unifyThreadHeader || window.__filterbarExports?.unifyThreadHeader;
    assert(typeof unifyFn === 'function', 'unifyThreadHeader deve estar disponível');
    unifyFn(smgHeader);

    // Validar tagsBar inserido
    const smgTagsBar = smgHeader.querySelector('.smg-thead-tags') || smgHeader.nextElementSibling;
    assert(smgTagsBar !== null, 'tagsBar deve existir');
    assert(smgTagsBar.classList.contains('smg-thead-tags-bar'), 'tagsBar deve ter a classe .smg-thead-tags-bar');
    assert(smgTagsBar.classList.contains('smg-thead-tags'), 'tagsBar deve ter a classe .smg-thead-tags');

    // Validar que desc está em tagsBar
    const descInInner = smgTagsBar.querySelector('.p-description');
    assert(descInInner !== null, '.p-description deve estar dentro de tagsBar');

    // Limpeza
    smgHeader.remove();
    smgBarHost.remove();
    smgTagsBar?.remove();
    document.querySelector('.smg-thead-spacer')?.remove();
    document.querySelector('.smg-thead-sentinel')?.remove();

    // 3. Testar unifyThreadHeader quando header NÃO possui .pageContent (ex.: SimpCity)
    document.documentElement.className = 'smg-sc smg-thread';

    const scHeader = document.createElement('div');
    scHeader.className = 'p-body-header';
    scHeader.innerHTML = `
        <div class="p-title">
            <h1 class="p-title-value">SimpCity Thread Title</h1>
        </div>
        <div class="p-description">
            <ul class="listInline">
                <li class="tagList"><a class="tagItem" href="/tags/sc/">sc</a></li>
            </ul>
        </div>
    `;
    const scBarHost = document.createElement('div');
    scBarHost.className = 'block-outer';
    scBarHost.innerHTML = '<div class="smg-bar"></div>';
    document.body.append(scHeader, scBarHost);

    unifyFn(scHeader);

    const scTagsBar = scHeader.querySelector('.smg-thead-tags') || scHeader.nextElementSibling;
    assert(scTagsBar !== null, 'tagsBar deve existir no scHeader');
    assert(scTagsBar.classList.contains('smg-thead-tags-bar'), 'scTagsBar deve ter .smg-thead-tags-bar');
    assert(scTagsBar.querySelector('.p-description') !== null, '.p-description deve existir em scTagsBar');

    // Limpeza
    scHeader.remove();
    scBarHost.remove();
    scTagsBar.remove();
    document.querySelector('.smg-thead-spacer')?.remove();
    document.querySelector('.smg-thead-sentinel')?.remove();

    // =========================================================================
    // TESTE 52: Cards de Mídia Quebrada (.smg-dead) como Lista e Tratamento de Erro (200 / 0 / 404)
    // =========================================================================
    console.log('--- TESTE 52: Cards .smg-dead como lista, span-all e status de erro ---');
    {
        // 1. Validar deadReason(st)
        const deadReasonFn = window.deadReason;
        assert(typeof deadReasonFn === 'function', 'deadReason deve estar exposto em __TEST_MODE__');

        const r200 = deadReasonFn(200);
        const errWord = (typeof window.i18n === 'function') ? window.i18n('Error') : 'Erro';
        assert(r200.code === 'Erro' || r200.code === 'Error' || r200.code === errWord, 'deadReason(200) deve retornar code "Erro" / "Error"');
        assert(r200.code !== '200', 'deadReason(200) NÃO deve retornar "200" como código de erro');
        assert(r200.why === 'load error', 'deadReason(200) deve retornar why "load error"');

        const r404 = deadReasonFn(404);
        assert(r404.code === '404', 'deadReason(404) deve retornar code "404"');
        assert(r404.why === 'file deleted', 'deadReason(404) deve retornar why "file deleted"');

        const r0 = deadReasonFn(0);
        assert(r0.code === 'Erro' || r0.code === 'Error' || r0.code === errWord, 'deadReason(0) deve retornar code "Erro" / "Error"');
        assert(r0.why === 'unavailable', 'deadReason(0) deve retornar why "unavailable"');

        // 2. Validar buildDeadBox('https://simp4.selti-delivery.ru/test.jpg', { status: 200 })
        const buildDeadBoxFn = window.buildDeadBox;
        assert(typeof buildDeadBoxFn === 'function', 'buildDeadBox deve estar exposto em __TEST_MODE__');

        const testUrl = 'https://simp4.selti-delivery.ru/test.jpg';
        const deadBox = buildDeadBoxFn(testUrl, { status: 200 });
        assert(deadBox instanceof window.HTMLElement, 'buildDeadBox deve retornar um HTMLElement');
        assert(deadBox.classList.contains('smg-dead'), 'deadBox deve ter a classe .smg-dead');
        assert(deadBox.getAttribute('href') === testUrl, 'deadBox href deve ser o testUrl');

        const bCode = deadBox.querySelector('.smg-dead-code b');
        assert(bCode !== null, '.smg-dead-code b deve existir no card');
        assert(bCode.textContent === 'Erro' || bCode.textContent === 'Error', '.smg-dead-code b deve conter "Erro" ou "Error"');

        const subText = deadBox.querySelector('.smg-dead-sub');
        assert(subText !== null, '.smg-dead-sub deve existir no card');
        assert(subText.textContent.includes('erro ao carregar') || subText.textContent.includes('load error'), '.smg-dead-sub deve conter "erro ao carregar" ou "load error"');
        assert(subText.textContent.includes('simp4.selti-delivery.ru'), '.smg-dead-sub deve conter o hostname');
        assert(!deadBox.textContent.includes('200'), 'Card de erro não deve exibir o código numérico "200"');

        // 3. Validar no CSS injetado
        const allStyles52 = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');
        assert(allStyles52.includes('flex-direction: row;'), 'CSS deve conter flex-direction: row para .smg-dead');
        assert(allStyles52.includes('aspect-ratio: auto !important;'), 'CSS deve conter aspect-ratio: auto !important; para .smg-dead');
        assert(allStyles52.includes('html.smg-masonry-on .auto-image-grid.smg-mason > .smg-dead'), 'CSS deve conter regra da caixa morta como item do mosaico');

        // 4. Validar comportamento no mosaico .auto-image-grid e imgFailLink
        const postArticle52 = document.createElement('article');
        postArticle52.className = 'message message--post';
        const postBody52 = document.createElement('div');
        postBody52.className = 'message-userContent';

        const grid52 = document.createElement('div');
        grid52.className = 'auto-image-grid';

        const img1 = document.createElement('img');
        img1.className = 'bbImage';
        img1.src = 'https://simp4.selti-delivery.ru/dead1.jpg';
        img1.style.aspectRatio = '1 / 1';

        const img2 = document.createElement('img');
        img2.className = 'bbImage';
        img2.src = 'https://example.com/live.jpg';
        img2.style.aspectRatio = '4 / 3';

        grid52.append(img1, img2);
        postBody52.appendChild(grid52);
        postArticle52.appendChild(postBody52);
        document.body.appendChild(postArticle52);

        const imgFailLinkFn = window.__masonryExports?.imgFailLink;
        assert(typeof imgFailLinkFn === 'function', 'imgFailLink deve estar disponível');

        // Simular falha da img1
        imgFailLinkFn(img1);

        const deadItem = grid52.querySelector('.smg-dead');
        assert(deadItem !== null, 'img1 deve ter sido substituída por .smg-dead');
        assert(!deadItem.style.aspectRatio, 'deadItem na grade NÃO deve receber aspect-ratio inline forçado');
        assert(deadItem.parentElement === grid52 && grid52.firstElementChild === deadItem, 'A caixa morta fica no lugar do item, dentro do grupo');
        assert(deadItem.classList.contains('smg-dead--img') && deadItem.dataset.smgRatio === '1.0000', 'A caixa morta conta como item de imagem e herda a proporção (1:1) da imagem');

        // Limpeza
        postArticle52.remove();
    }

    // =========================================================================
    console.log('--- TESTE 53: Rotas de Notificação (/posts/ e /goto/) & Paint Gate Estável ---');
    // =========================================================================
    if (window.__paintExports) {
        const { classifyPaintPage } = window.__paintExports;
        const setPage53 = (url, template) => {
            window.history.pushState({}, '', url);
            if (template == null) document.documentElement.removeAttribute('data-template');
            else document.documentElement.setAttribute('data-template', template);
            return classifyPaintPage();
        };

        const postRoute = setPage53('/posts/987654/');
        assert(postRoute.kind === 'thread', 'Rota /posts/987654/ deve ser classificada como thread');
        assert(postRoute.gated === true, 'Rota /posts/987654/ deve ativar o paint gate');

        const gotoRoute = setPage53('/goto/post?id=987654');
        assert(gotoRoute.kind === 'thread', 'Rota /goto/post?id=987654 deve ser classificada como thread');
        assert(gotoRoute.gated === true, 'Rota /goto/post?id=987654 deve ativar o paint gate');

        const alertsRoute = setPage53('/account/alerts');
        assert(alertsRoute.kind === 'listing', 'Rota /account/alerts deve ser classificada como listing');
        assert(alertsRoute.gated === true, 'Rota /account/alerts deve ativar o paint gate');

        const watchedRoute = setPage53('/watched/threads');
        assert(watchedRoute.kind === 'following', 'Rota /watched/threads deve ser classificada como following');

        const queryThreadRoute = setPage53('/index.php?threads/example-thread.12345/');
        assert(queryThreadRoute.kind === 'thread', 'Rota /index.php?threads/... deve ser classificada como thread');
        assert(queryThreadRoute.gated === true, 'Rota /index.php?threads/... deve ativar o paint gate');

        const articleTypeRoute = setPage53('/threads/art.123/', 'thread_view_type_article');
        assert(articleTypeRoute.kind === 'thread', 'Template thread_view_type_article deve ser classificado como thread');

        const questionTypeRoute = setPage53('/threads/q.123/', 'thread_view_type_question');
        assert(questionTypeRoute.kind === 'thread', 'Template thread_view_type_question deve ser classificado como thread');

        // Testar delegação de clique em alerta in-page
        const dockEl = document.getElementById('smg-aldock') || (typeof buildAlertsDock === 'function' ? buildAlertsDock() : null);
        if (dockEl) {
            const alertsPane = dockEl.querySelector('.smg-aldock-body[data-tab="alerts"]');
            if (alertsPane) {
                // Criar post fictício no DOM
                const mockPost = document.createElement('article');
                mockPost.className = 'message message--post';
                mockPost.id = 'post-777888';
                mockPost.scrollIntoView = () => { mockPost._scrolled = true; };
                document.body.appendChild(mockPost);

                const mockLink = document.createElement('a');
                mockLink.href = '/posts/777888/';
                alertsPane.appendChild(mockLink);

                const clickEvt = new window.MouseEvent('click', { bubbles: true, cancelable: true });
                mockLink.dispatchEvent(clickEvt);

                assert(clickEvt.defaultPrevented === true, 'Clique em alerta de post existente na página deve prevenir navegação padrão');
                assert(mockPost._scrolled === true, 'Post existente no DOM deve ter scrollIntoView chamado ao clicar no alerta');

                mockPost.remove();
                mockLink.remove();
            }
        }

        // Testar interceptor global em citação de post (quote jump)
        const mockPostQuote = document.createElement('article');
        mockPostQuote.className = 'message message--post';
        mockPostQuote.id = 'post-999111';
        mockPostQuote.scrollIntoView = () => { mockPostQuote._scrolled = true; };
        document.body.appendChild(mockPostQuote);

        const quoteLink = document.createElement('a');
        quoteLink.href = '/goto/post?id=999111';
        quoteLink.className = 'bbCodeBlock-sourceJump';
        document.body.appendChild(quoteLink);

        const quoteClickEvt = new window.MouseEvent('click', { bubbles: true, cancelable: true });
        quoteLink.dispatchEvent(quoteClickEvt);

        assert(quoteClickEvt.defaultPrevented === true, 'Clique em citação de post existente na página deve prevenir navegação padrão');
        assert(mockPostQuote._scrolled === true, 'Post citado existente no DOM deve ter scroll suave e ancoragem ativada');

        mockPostQuote.remove();
        quoteLink.remove();
    }

    // =========================================================================
    console.log('--- TESTE 54: Universal Paint Gate, Dead Box Formatação, Player Error UI & FileHost Guard ---');
    // =========================================================================
    // 1. Universal Paint Gate (rotas genéricas)
    if (window.__paintExports) {
        const { classifyPaintPage, paintSkeletonMarkup } = window.__paintExports;
        const setPage54 = (url, template) => {
            window.history.pushState({}, '', url);
            if (template == null) document.documentElement.removeAttribute('data-template');
            else document.documentElement.setAttribute('data-template', template);
            return classifyPaintPage();
        };

        const genericRoute = setPage54('/some-unknown-path/xyz', 'custom_template_foo');
        assert(genericRoute.kind === 'generic', 'Rotas desconhecidas devem ser classificadas como generic');
        assert(genericRoute.gated === true, 'Rotas genéricas devem ter paint gate ativado (gated: true)');

        const genericSkeleton = paintSkeletonMarkup('generic');
        assert(genericSkeleton.includes('smg-page-skeleton-main'), 'Skeleton genérico deve possuir container main');
        assert(genericSkeleton.includes('smg-page-skeleton-row'), 'Skeleton genérico deve possuir linhas de skeleton');
        assert(genericSkeleton.includes('smg-page-skeleton-bottom-nav'), 'Skeleton genérico deve possuir bottom nav');
    }

    // 2. Dead Box com separador explícito e formatação limpa
    if (typeof window.buildDeadBox === 'function') {
        const deadBox = window.buildDeadBox('https://pixeldrain.com/api/file/QBWwuDfk', { media: true });
        assert(deadBox instanceof window.HTMLElement, 'buildDeadBox deve retornar HTMLElement');
        assert(deadBox.classList.contains('smg-dead'), 'buildDeadBox deve possuir a classe .smg-dead');
        const sepEl = deadBox.querySelector('.smg-dead-sep');
        assert(sepEl !== null, 'buildDeadBox deve possuir separador .smg-dead-sep');
        assert(sepEl.textContent.trim() === '·', 'Separador .smg-dead-sep deve conter caractere de ponto');
        const codeEl = deadBox.querySelector('.smg-dead-code');
        const subEl = deadBox.querySelector('.smg-dead-sub');
        assert(codeEl !== null && subEl !== null, 'buildDeadBox deve conter .smg-dead-code e .smg-dead-sub');
    }

    // 3. pdPlace e processFileHostCards ignorando .smg-dead e links de auto-image-grid
    if (typeof window.pdPlace === 'function') {
        const dummyDead = document.createElement('a');
        dummyDead.className = 'smg-dead';
        const dummyCard = document.createElement('div');
        dummyCard.className = 'smg-fhcard';
        const parent = document.createElement('div');
        parent.appendChild(dummyDead);
        window.pdPlace(dummyDead, dummyCard);
        assert(!parent.querySelector('.smg-fhcard'), 'pdPlace não deve inserir card quando o nó for .smg-dead');
    }

    if (typeof window.processFileHostCards === 'function') {
        const gridContainer = document.createElement('div');
        gridContainer.className = 'auto-image-grid';
        const gridDeadLink = document.createElement('a');
        gridDeadLink.href = 'https://pixeldrain.com/u/12345';
        gridDeadLink.className = 'smg-dead';
        gridContainer.appendChild(gridDeadLink);
        document.body.appendChild(gridContainer);

        window.processFileHostCards([gridContainer]);
        assert(!gridContainer.querySelector('.smg-fhcard'), 'processFileHostCards não deve converter links .smg-dead ou dentro de .auto-image-grid');
        gridContainer.remove();
    }

    // 4. Video Player Error UI
    if (typeof window.__showPlayerError === 'function') {
        const testWrap = document.createElement('div');
        testWrap.className = 'smg-rg smg-rg-loading';
        const testVideo = document.createElement('video');
        testVideo.className = 'smg-rg-v';
        testWrap.appendChild(testVideo);
        document.body.appendChild(testWrap);

        let retryTriggered = false;
        window.__showPlayerError(testWrap, testVideo, {
            code: 502,
            message: 'Bad Gateway · Host offline',
            url: 'https://imagepond.com/v/test123',
            retry: () => { retryTriggered = true; }
        });

        const errorOverlay = testWrap.querySelector('.smg-rg-error');
        assert(errorOverlay !== null, '__showPlayerError deve injetar .smg-rg-error dentro do wrap');
        assert(testWrap.classList.contains('smg-rg-has-error'), 'Wrap do player deve receber classe smg-rg-has-error');
        assert(!testWrap.classList.contains('smg-rg-loading'), 'Wrap do player não deve mais ter classe smg-rg-loading após erro');

        const badge = errorOverlay.querySelector('.smg-rg-error-badge');
        assert(badge !== null && badge.textContent.includes('502'), 'Overlay deve conter badge com código de erro 502');

        const msg = errorOverlay.querySelector('.smg-rg-error-msg');
        assert(msg !== null && msg.textContent.includes('Bad Gateway'), 'Overlay deve conter mensagem do erro');

        const retryBtn = errorOverlay.querySelector('.smg-rg-error-btn--retry');
        assert(retryBtn !== null, 'Overlay deve conter botão de retry');
        retryBtn.click();
        assert(retryTriggered === true, 'Clique no botão de retry deve invocar callback de retry');

        const extBtn = errorOverlay.querySelector('.smg-rg-error-btn--open');
        assert(extBtn !== null && extBtn.getAttribute('href') === 'https://imagepond.com/v/test123', 'Botão externo deve apontar para a URL do vídeo');

        testWrap.remove();
    }

    // 5. CSS checks: link contrast & loading player opacity
    const allCss = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');
    assert(allCss.includes('.smg-rg-error'), 'CSS deve conter estilos para .smg-rg-error');
    assert(allCss.includes('.smg-dead-sep'), 'CSS deve conter estilos para .smg-dead-sep');
    assert(!allCss.includes('.smg-rg.smg-rg-loading > .smg-rg-v { opacity: 0'), 'CSS não deve ocultar vídeo com opacity: 0 durante loading do player');

    // =========================================================================
    console.log('--- TESTE 55: Remoção de hoverPreview, Nova Opção replaceThumbsWithFull & Limpeza de Hover ---');
    // =========================================================================
    if (window.__configExports) {
        const { DEFAULT_FEATURES, FEATURES, SETTINGS_META } = window.__configExports;
        assert(DEFAULT_FEATURES.hoverPreview === undefined, 'DEFAULT_FEATURES não deve mais possuir hoverPreview');
        assert(DEFAULT_FEATURES.replaceThumbsWithFull === false, 'DEFAULT_FEATURES deve possuir replaceThumbsWithFull desabilitado por padrão');

        const imagesSection = SETTINGS_META.find(s => s.section === 'Images');
        assert(imagesSection !== undefined, 'SETTINGS_META deve conter seção Images');
        assert(!imagesSection.items.some(it => it.key === 'hoverPreview'), 'Seção Images não deve conter chave hoverPreview');
        assert(imagesSection.items.some(it => it.key === 'replaceThumbsWithFull'), 'Seção Images deve conter chave replaceThumbsWithFull');

        // Testar comportamento com replaceThumbsWithFull ativo vs inativo
        const { getFullIO, processOneImage, resolveFullImageUrl, applyReplaceThumbsWithFull, swapImgSrc } = window.__masonryExports || {};
        assert(typeof resolveFullImageUrl === 'function', 'resolveFullImageUrl deve estar disponível');
        assert(typeof applyReplaceThumbsWithFull === 'function', 'applyReplaceThumbsWithFull deve estar disponível');

        // 1. Resolução de anexos XenForo em links pai
        const xfAnchor = document.createElement('a');
        xfAnchor.href = '/attachments/screenshot-png.4512043/';
        const xfImg = document.createElement('img');
        xfImg.className = 'bbImage';
        xfImg.src = '/data/attachments/4512/4512043-a1b2c3d4e5.jpg';
        xfAnchor.appendChild(xfImg);
        document.body.appendChild(xfAnchor);

        const xfFull = resolveFullImageUrl(xfImg);
        assert(xfFull.includes('/attachments/screenshot-png.4512043/'), 'resolveFullImageUrl deve extrair URL de anexo XenForo do link pai');

        // 2. Resolução de anexos XenForo em wrappers (.bbImageWrapper[data-src])
        const xfWrap = document.createElement('div');
        xfWrap.className = 'bbImageWrapper js-lbImage';
        xfWrap.setAttribute('data-src', '/attachments/attachment-sample-jpg.999888/');
        const xfWrapImg = document.createElement('img');
        xfWrapImg.className = 'bbImage';
        xfWrapImg.src = '/data/attachments/999/999888-abcdef.jpg';
        xfWrap.appendChild(xfWrapImg);
        document.body.appendChild(xfWrap);

        const wrapFull = resolveFullImageUrl(xfWrapImg);
        assert(wrapFull.includes('/attachments/attachment-sample-jpg.999888/'), 'resolveFullImageUrl deve extrair URL de anexo do wrapper data-src');

        // 3. Resolução de query params de thumbnail (?thumb=1)
        const qThumbImg = document.createElement('img');
        qThumbImg.className = 'bbImage';
        qThumbImg.src = 'https://example.com/gallery/image123.jpg?thumb=1';
        const qFull = resolveFullImageUrl(qThumbImg);
        assert(qFull === 'https://example.com/gallery/image123.jpg', 'resolveFullImageUrl deve limpar parâmetros de thumbnail');

        // 4. Resolução de Pixhost e Imgbox
        const pixImg = document.createElement('img');
        pixImg.className = 'bbImage';
        pixImg.src = 'https://t12.pixhost.to/thumbs/100/200.jpg';
        assert(resolveFullImageUrl(pixImg) === 'https://img12.pixhost.to/images/100/200.jpg', 'resolveFullImageUrl deve converter thumb Pixhost em imagem full');

        const boxImg = document.createElement('img');
        boxImg.className = 'bbImage';
        boxImg.src = 'https://thumbs2.imgbox.com/aa/bb/cc123_t.jpg';
        assert(resolveFullImageUrl(boxImg) === 'https://images2.imgbox.com/aa/bb/cc123_o.jpg', 'resolveFullImageUrl deve converter thumb Imgbox _t em _o');

        // 5. Testar processOneImage com flag desativada (padrão) vs ativada
        if (typeof processOneImage === 'function') {
            const grid = document.createElement('div');
            grid.className = 'auto-image-grid';
            const imgEl = document.createElement('img');
            imgEl.className = 'bbImage';
            imgEl.src = 'https://example.com/photo.th.jpg';
            grid.appendChild(imgEl);
            document.body.appendChild(grid);

            // Com a flag desativada (padrão)
            FEATURES.replaceThumbsWithFull = false;
            processOneImage(imgEl);
            assert(imgEl.dataset.smgFull === 'https://example.com/photo.jpg', 'processOneImage deve extrair URL full em smgFull');
            assert(imgEl.dataset.smgMed === 'https://example.com/photo.md.jpg', 'processOneImage deve extrair URL med em smgMed');

            // Com a flag ativada, swapImgSrc substitui a imagem final
            FEATURES.replaceThumbsWithFull = true;
            assert(typeof getFullIO === 'function', 'getFullIO deve estar disponível');
            const fio = getFullIO();
            assert(fio !== null, 'getFullIO deve retornar instância de observer');

            // 6. Testar applyReplaceThumbsWithFull em lote
            applyReplaceThumbsWithFull(true);
            assert(imgEl.src === 'https://example.com/photo.jpg', 'applyReplaceThumbsWithFull deve substituir o src da miniatura pela imagem final');
            assert(xfImg.src.includes('/attachments/screenshot-png.4512043/'), 'applyReplaceThumbsWithFull deve substituir miniatura de anexo XF pela URL original');

            grid.remove();
        }

        xfAnchor.remove();
        xfWrap.remove();
    }

    // Validação de CSS limpo para hover
    const baseCss55 = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');
    assert(!baseCss55.includes('filter: drop-shadow(0 0 6px var(--smg-link'), 'CSS não deve conter drop-shadow neon em links no hover');
    assert(baseCss55.includes('.smg-fhcard, .smg-fhcard *') || baseCss55.includes('.smg-fhcard,\n            .smg-fhcard *'), 'CSS deve conter reset explícito de text-decoration e filter para .smg-fhcard e descendentes');

    // =========================================================================
    console.log('--- TESTE 56: Ciclo de Vida do Loading da Thread, Árvore Completa & Anti-Drifting ---');
    // =========================================================================
    if (window.__paintExports) {
        const {
            threadTreeIsComplete,
            threadMediaTreeIsReady,
            paintPageIsReady,
            paintPageSignature,
            requestedPostTargetId,
            setupNavigationTransition,
            PAINT_PAGE_KINDS
        } = window.__paintExports;

        assert(typeof threadTreeIsComplete === 'function', 'threadTreeIsComplete deve estar disponível em __paintExports');
        assert(typeof threadMediaTreeIsReady === 'function', 'threadMediaTreeIsReady deve estar disponível em __paintExports');

        // 1. threadTreeIsComplete deve retornar false enquanto readyState for 'loading'
        const origReadyState = Object.getOwnPropertyDescriptor(window.Document.prototype, 'readyState') ||
                               Object.getOwnPropertyDescriptor(document, 'readyState');
        Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true, writable: true });
        assert(threadTreeIsComplete() === false, 'threadTreeIsComplete deve retornar false enquanto document.readyState for "loading"');

        // 2. Com readyState 'interactive', mas apenas com pager no topo e sem footer ou fechamento, deve retornar false
        document.readyState = 'interactive';
        const dummyContent = document.createElement('div');
        dummyContent.className = 'p-body-content';
        const dummyMessages = document.createElement('div');
        dummyMessages.className = 'block--messages';
        const topPager = document.createElement('div');
        topPager.className = 'pageNav';
        document.body.appendChild(topPager);
        document.body.appendChild(dummyMessages);

        assert(threadTreeIsComplete() === false, 'threadTreeIsComplete NÃO deve ser enganada pelo pageNav do topo e deve retornar false sem footer');

        // 3. Ao adicionar o rodapé .p-footer, threadTreeIsComplete passa a retornar true
        const footer = document.createElement('footer');
        footer.className = 'p-footer';
        document.body.appendChild(footer);
        assert(threadTreeIsComplete() === true, 'threadTreeIsComplete deve retornar true quando o rodapé .p-footer estiver presente');

        // 4. Testar threadMediaTreeIsReady
        document.readyState = 'loading';
        assert(threadMediaTreeIsReady(dummyContent) === false, 'threadMediaTreeIsReady deve retornar false enquanto readyState for loading');

        document.readyState = 'interactive';
        const postWithImg = document.createElement('article');
        postWithImg.className = 'message';
        const testImg = document.createElement('img');
        testImg.className = 'bbImage';
        postWithImg.appendChild(testImg);
        dummyMessages.appendChild(postWithImg);

        assert(threadMediaTreeIsReady(dummyMessages) === false, 'threadMediaTreeIsReady deve retornar false para imagem sem dimensão nem aspect-ratio');

        testImg.style.aspectRatio = '16 / 9';
        assert(threadMediaTreeIsReady(dummyMessages) === true, 'threadMediaTreeIsReady deve retornar true quando todas as imagens possuem aspect-ratio travado');

        // 5. Testar paintPageIsReady exigindo post solicitado específico
        const realContent = document.querySelector('.p-body-content');
        let header = document.querySelector('.p-body-header');
        let createdHeader = false;
        if (!header) {
            header = document.createElement('div');
            header.className = 'p-body-header';
            document.body.prepend(header);
            createdHeader = true;
        }
        header.setAttribute('data-smg-thead', '1');
        header.setAttribute('data-smg-unified', '1');
        header.dataset.smgThead = '1';
        header.dataset.smgUnified = '1';

        let messages = realContent.querySelector('.block--messages');
        let createdMessages = false;
        if (!messages) {
            messages = document.createElement('div');
            messages.className = 'block--messages';
            realContent.appendChild(messages);
            createdMessages = true;
        }

        // Move postWithImg para messages com id post-1001 e marca posts como prontos
        postWithImg.id = 'post-1001';
        postWithImg.dataset.content = 'post-1001';
        postWithImg.dataset.smgCardReady = '1';
        postWithImg.dataset.smgGalReady = '1';
        messages.appendChild(postWithImg);
        realContent.querySelectorAll('article.message').forEach(p => {
            p.dataset.smgCardReady = '1';
            p.dataset.smgGalReady = '1';
        });

        // Simula hash apontando para post inexistente
        window.location.hash = '#post-9999';
        const threadCtx = { kind: PAINT_PAGE_KINDS.THREAD, gated: true };
        assert(paintPageIsReady(threadCtx) === false, 'paintPageIsReady deve retornar false se o post alvo solicitado (#post-9999) ainda não estiver no DOM');

        // Corrige o hash para apontar para o post existente no DOM (#post-1001)
        window.location.hash = '#post-1001';
        assert(paintPageIsReady(threadCtx) === true, 'paintPageIsReady deve retornar true quando o post alvo solicitado (#post-1001) existe e está pronto');

        // 6. Testar paintPageSignature incluindo altura e imagens
        const sig = paintPageSignature(threadCtx);
        assert(sig.includes('imgs:'), 'paintPageSignature deve incluir contador de imagens prontas');
        assert(sig.includes(',h:'), 'paintPageSignature deve incluir altura do bloco de mensagens');

        // 7. Testar setupNavigationTransition com links internos vs links de navegação
        setupNavigationTransition();
        const docRoot = document.documentElement;
        docRoot.classList.remove('smg-page-pending');

        // Link de post na mesma página (#post-1001) não deve disparar skeleton de página
        const inPageLink = document.createElement('a');
        inPageLink.href = '#post-1001';
        document.body.appendChild(inPageLink);
        inPageLink.click();
        assert(!docRoot.classList.contains('smg-page-pending'), 'Clique em link de post na mesma página NÃO deve ativar smg-page-pending');

        // Link de navegação para outro tópico deve ativar smg-page-pending
        const threadLink = document.createElement('a');
        threadLink.href = '/threads/outro-topico.12345/';
        document.body.appendChild(threadLink);
        threadLink.click();
        assert(docRoot.classList.contains('smg-page-pending'), 'Clique em link de outro tópico DEVE ativar smg-page-pending imediatamente');

        // Limpeza do DOM de teste
        docRoot.classList.remove('smg-page-pending');
        topPager.remove();
        dummyMessages.remove();
        if (createdHeader && header) header.remove();
        if (createdMessages && messages) messages.remove();
        postWithImg.remove();
        dummyContent.remove();
        footer.remove();
        inPageLink.remove();
        threadLink.remove();
        window.location.hash = '';
        if (origReadyState) Object.defineProperty(document, 'readyState', origReadyState);
    }

    // =========================================================================
    // TESTE 57: Desembrulho Recursivo de Proxies Aninhados, Limpeza de HTML & Fallback de Texto
    // =========================================================================
    console.log('--- TESTE 57: Proxies Aninhados, Limpeza de HTML & Fallback de Texto ---');
    {
        const decodeProxyHref = window.__decodeProxyHref || window.decodeProxyHref;
        const resolveProxyHref = window.__resolveProxyHref || window.resolveProxyHref;
        const isProxyUrl = window.__isProxyUrl || window.isProxyUrl;
        const cleanProxyString = window.__cleanProxyString || window.cleanProxyString;

        assert(typeof isProxyUrl === 'function', 'isProxyUrl deve estar disponível');
        assert(typeof cleanProxyString === 'function', 'cleanProxyString deve estar disponível');

        // 1. isProxyUrl validação
        assert(isProxyUrl('/goto/link-confirmation?url=abc'), 'isProxyUrl deve identificar /goto/link-confirmation');
        assert(isProxyUrl('https://forums.socialmediagirls.com/goto/link-confirmation?url=abc'), 'isProxyUrl deve identificar URL completa de link-confirmation');
        assert(isProxyUrl('/redirect/?to=xyz'), 'isProxyUrl deve identificar /redirect/');
        assert(isProxyUrl('/proxy.php?link=xyz'), 'isProxyUrl deve identificar /proxy.php');
        assert(!isProxyUrl('https://goonbox.cr/a/campopiano.aqa9je'), 'isProxyUrl deve retornar false para URL externa direta');

        // 2. Caso real SMG: Link aninhado com vazamento de aspas e classes HTML
        const nestedUserHref = '/goto/link-confirmation?url=L2dvdG8vbGluay1jb25maXJtYXRpb24%2FdXJsPWFIUjBjSE02THk5bmIyOXVZbTk0TG1OeUwyRXZZMkZ0Y0c5d2FXRnVieTVoY1dFNWFtVSUzRCZhbXA7cz0wMmM2ODRhNDUyYTBiMTZkYjMwM2E3N2RlZWQ2OWI3OCIgY2xhc3M9ImxpbmsgbGluay0taW50ZXJuYWw%3D&s=4e4d75b4241b84f1ef767ee719921a3b';
        const expectedFinalUrl = 'https://goonbox.cr/a/campopiano.aqa9je';

        assert(decodeProxyHref(nestedUserHref) === expectedFinalUrl, 'decodeProxyHref deve desembrulhar proxy aninhado e limpar aspas/classes HTML');
        assert(resolveProxyHref(nestedUserHref) === expectedFinalUrl, 'resolveProxyHref deve resolver proxy aninhado para o destino real');

        // 3. Caso com domínio completo do fórum
        const fullDomainNested = 'https://forums.socialmediagirls.com' + nestedUserHref;
        assert(decodeProxyHref(fullDomainNested) === expectedFinalUrl, 'decodeProxyHref deve resolver proxy aninhado com domínio do fórum');
        assert(resolveProxyHref(fullDomainNested) === expectedFinalUrl, 'resolveProxyHref deve resolver proxy aninhado com domínio do fórum');

        // 4. unwrapRedirectLinks com elemento que já continha data-smg-unwrap="1" e data-blank-handler="true"
        const brokenLink = document.createElement('a');
        brokenLink.href = nestedUserHref;
        brokenLink.setAttribute('data-smg-unwrap', '1');
        brokenLink.setAttribute('data-blank-handler', 'true');
        brokenLink.textContent = expectedFinalUrl;
        document.body.appendChild(brokenLink);

        const unwrapFn = window.__unwrapRedirectLinks || window.unwrapRedirectLinks;
        assert(typeof unwrapFn === 'function', 'unwrapRedirectLinks deve estar disponível');
        unwrapFn([document.body]);

        assert(brokenLink.getAttribute('href') === expectedFinalUrl, 'unwrapRedirectLinks deve corrigir href de link aninhado mesmo que já possuísse data-smg-unwrap');
        assert(!brokenLink.hasAttribute('data-blank-handler'), 'unwrapRedirectLinks deve desarmar data-blank-handler');
        assert(brokenLink.target === '_blank', 'unwrapRedirectLinks deve assegurar target="_blank"');
        assert(brokenLink.rel.includes('noopener'), 'unwrapRedirectLinks deve assegurar rel noopener');
        brokenLink.remove();

        // 5. Fallback por texto visível quando o proxy está completamente corrompido
        const corruptedLink = document.createElement('a');
        corruptedLink.href = '/goto/link-confirmation?url=corrompido-invalido-123';
        corruptedLink.setAttribute('data-blank-handler', 'true');
        corruptedLink.textContent = 'https://pixeldrain.com/u/abcdef';
        document.body.appendChild(corruptedLink);

        unwrapFn([document.body]);

        assert(corruptedLink.getAttribute('href') === 'https://pixeldrain.com/u/abcdef', 'unwrapRedirectLinks deve usar URL do textContent como fallback quando proxy for irrecuperável');
        assert(!corruptedLink.hasAttribute('data-blank-handler'), 'Fallback de texto deve remover data-blank-handler');
        corruptedLink.remove();

        // 6. Clique interceptado via bindProxyClick em link aninhado recém-inserido
        const dynamicNestedLink = document.createElement('a');
        dynamicNestedLink.className = 'link link--external';
        dynamicNestedLink.href = nestedUserHref;
        dynamicNestedLink.setAttribute('data-blank-handler', 'true');
        document.body.appendChild(dynamicNestedLink);

        let clickStopped = false;
        const testClick = new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
        const origStop = testClick.stopImmediatePropagation;
        testClick.stopImmediatePropagation = function() {
            clickStopped = true;
            origStop.call(this);
        };

        dynamicNestedLink.dispatchEvent(testClick);

        assert(clickStopped, 'bindProxyClick deve interceptar clique em link proxy aninhado');
        assert(dynamicNestedLink.getAttribute('href') === expectedFinalUrl, 'bindProxyClick deve resolver href do link aninhado no ato do clique');
        assert(!dynamicNestedLink.hasAttribute('data-blank-handler'), 'bindProxyClick deve remover data-blank-handler');
        dynamicNestedLink.remove();
    }

    // TESTE 58: Substituição de Thumbnails por Alta Resolução (replaceThumbsWithFull) & Referer de CDN
    console.log('--- TESTE 58: Substituição de Thumbnails por Alta Resolução & Referer de CDN ---');
    {
        const { FEATURES } = window.__configExports || {};
        const { swapImgSrc, resolveFullImageUrl, applyReplaceThumbsWithFull, processOneImage, getMedIO } = window.__masonryExports || {};
        assert(typeof swapImgSrc === 'function', 'swapImgSrc deve estar disponível');

        // 1. Simulação do caso do usuário com Cuckcapital / Goonbox no SMG
        const gbxPost = document.createElement('div');
        gbxPost.className = 'message-userContent';
        const cuckThumbUrl = 'https://simp6.cuckcapital.cr/panda/th/c876f8c1-9010-4c1c-8c37-ad5e03959143.jpg';
        const cuckFullUrl = 'https://simp6.cuckcapital.cr/panda/4e589165-1e43-4eed-9301-b792c0f2388d.jpg?s=tXtpi-v2ycCG8G-yi8SAs5WUkeh0mzzuqTN4vTNtv2E';

        const gbxImg = document.createElement('img');
        gbxImg.className = 'bbImage';
        gbxImg.src = cuckThumbUrl;
        gbxImg.setAttribute('data-url', cuckFullUrl);
        gbxImg.dataset.smgLink = 'https://goonbox.cr/img/tB8GXfi';
        gbxPost.appendChild(gbxImg);
        document.body.appendChild(gbxPost);

        // Resolução de URL completa via data-url
        const resolvedFull = resolveFullImageUrl(gbxImg);
        assert(resolvedFull === cuckFullUrl, 'resolveFullImageUrl deve extrair a URL de alta resolução de data-url');

        // Ativa a flag replaceThumbsWithFull
        FEATURES.replaceThumbsWithFull = true;

        // Processamento da imagem com a flag ativa
        processOneImage(gbxImg);
        assert(gbxImg.dataset.smgFull === cuckFullUrl, 'processOneImage deve armazenar a URL full em dataset.smgFull');

        // getMedIO deve mirar no full diretamente quando replaceThumbsWithFull estiver ativo
        const mio = getMedIO();
        assert(mio !== null, 'getMedIO deve retornar observer');

        // applyReplaceThumbsWithFull deve trocar o src da miniatura para a imagem final de alta resolução
        applyReplaceThumbsWithFull(true, [gbxPost]);
        assert(gbxImg.src === cuckFullUrl, 'applyReplaceThumbsWithFull deve substituir o src da miniatura pela imagem final');
        assert(gbxImg.dataset.smgFull === cuckFullUrl, 'smgFull deve manter a referência da imagem full');

        // 2. Testar comportamento do preload assíncrono e estratégia de retry de referer no swapImgSrc
        const mockImg = document.createElement('img');
        mockImg.className = 'bbImage';
        mockImg.src = 'https://example.com/thumb.jpg';
        document.body.appendChild(mockImg);

        // Salvar implementação original de Image
        const originalImage = window.Image;

        // Mock A: Host que exige referer (como simp6.cuckcapital.cr)
        // Se receber no-referrer, falha com onerror; se receber default/vazio, sucede com onload
        let mockLoadAttempts = [];
        window.Image = function() {
            const imgInstance = {
                decode: () => Promise.resolve(),
                set src(val) {
                    this._src = val;
                    setTimeout(() => {
                        mockLoadAttempts.push({ src: val, policy: this.referrerPolicy || '' });
                        if (this.referrerPolicy === 'no-referrer') {
                            if (this.onerror) this.onerror(new Error('403 Forbidden'));
                        } else {
                            if (this.onload) this.onload();
                        }
                    }, 5);
                },
                get src() { return this._src; }
            };
            return imgInstance;
        };

        swapImgSrc(mockImg, cuckFullUrl);
        await new Promise(r => setTimeout(r, 20));

        assert(mockImg.src === cuckFullUrl, 'swapImgSrc deve ter sucesso na primeira tentativa para CDN que exige Referer');
        assert(mockLoadAttempts.length === 1, 'Deve ter feito apenas 1 tentativa para CDN com Referer válido');
        assert(mockLoadAttempts[0].policy === '', 'Primeira tentativa deve preservar o Referer padrão do documento');

        // Mock B: Host com proteção anti-hotlink (que bloqueia o fórum na 1ª tentativa e exige no-referrer)
        mockLoadAttempts = [];
        const antiHotlinkImg = document.createElement('img');
        antiHotlinkImg.className = 'bbImage';
        antiHotlinkImg.src = 'https://antihotlink.com/thumb.jpg';
        document.body.appendChild(antiHotlinkImg);

        window.Image = function() {
            const imgInstance = {
                decode: () => Promise.resolve(),
                set src(val) {
                    this._src = val;
                    setTimeout(() => {
                        mockLoadAttempts.push({ src: val, policy: this.referrerPolicy || '' });
                        if (this.referrerPolicy === 'no-referrer') {
                            if (this.onload) this.onload();
                        } else {
                            if (this.onerror) this.onerror(new Error('403 Forbidden hotlink'));
                        }
                    }, 5);
                },
                get src() { return this._src; }
            };
            return imgInstance;
        };

        const targetHotlinkFull = 'https://antihotlink.com/full.jpg';
        swapImgSrc(antiHotlinkImg, targetHotlinkFull);
        await new Promise(r => setTimeout(r, 500));

        assert(antiHotlinkImg.src === targetHotlinkFull, 'swapImgSrc deve ter sucesso após fallback para no-referrer');
        assert(mockLoadAttempts.length === 2, 'Deve ter tentado 2 vezes (1ª com referer padrão, 2ª com no-referrer)');
        assert(mockLoadAttempts[0].policy === '', '1ª tentativa deve usar o referer padrão');
        assert(mockLoadAttempts[1].policy === 'no-referrer', '2ª tentativa deve tentar com no-referrer');
        assert(antiHotlinkImg.referrerPolicy === 'no-referrer', 'Elemento da imagem deve ter referrerPolicy configurada como no-referrer');

        // Restaurar Image e limpar
        window.Image = originalImage;
        gbxPost.remove();
        mockImg.remove();
        antiHotlinkImg.remove();
    }

    // =========================================================================
    // TESTE 59: Loadings Separados por Componente (Topbar, Sidebar, Conteúdo) & Gravação Estável da Estrutura da Thread
    // =========================================================================
    console.log('--- TESTE 59: Loadings Separados por Componente (Topbar, Sidebar, Conteúdo) & Gravação Estável da Estrutura da Thread ---');
    if (window.__paintExports) {
        const {
            markTopbarReady,
            markSidebarReady,
            markContentReady,
            isTopbarReady,
            isSidebarReady,
            isContentReady,
            threadStructureIsRecorded,
            PAINT_PAGE_KINDS,
            resetPaintMediaDeadline
        } = window.__paintExports;

        assert(typeof markTopbarReady === 'function', 'markTopbarReady deve estar disponível em __paintExports');
        assert(typeof markSidebarReady === 'function', 'markSidebarReady deve estar disponível em __paintExports');
        assert(typeof markContentReady === 'function', 'markContentReady deve estar disponível em __paintExports');
        assert(typeof threadStructureIsRecorded === 'function', 'threadStructureIsRecorded deve estar disponível em __paintExports');

        // 1. Desacoplamento da Topbar: Topbar pode ficar pronta independentemente do conteúdo
        const docEl = document.documentElement;
        docEl.classList.remove('smg-topbar-ready', 'smg-sidebar-ready', 'smg-content-ready', 'smg-page-ready');
        docEl.classList.add('smg-page-pending', 'smg-topbar-loading', 'smg-content-pending');

        markTopbarReady();
        assert(docEl.classList.contains('smg-topbar-ready'), 'markTopbarReady deve adicionar smg-topbar-ready ao elemento raiz');
        assert(!docEl.classList.contains('smg-topbar-loading'), 'markTopbarReady deve remover smg-topbar-loading do elemento raiz');
        assert(docEl.classList.contains('smg-content-pending'), 'Prontidão da topbar NÃO deve remover o loading pendente do conteúdo');
        assert(isTopbarReady() === true, 'isTopbarReady deve retornar true após markTopbarReady');
        assert(isContentReady() === false, 'isContentReady deve continuar false enquanto conteúdo não estiver pronto');

        // 2. Desacoplamento da Sidebar/Rail: Sidebar pode ficar pronta independentemente do conteúdo
        docEl.classList.add('smg-sidebar-loading');
        markSidebarReady();
        assert(docEl.classList.contains('smg-sidebar-ready'), 'markSidebarReady deve adicionar smg-sidebar-ready');
        assert(!docEl.classList.contains('smg-sidebar-loading'), 'markSidebarReady deve remover smg-sidebar-loading');
        assert(isSidebarReady() === true, 'isSidebarReady deve retornar true após markSidebarReady');
        assert(isContentReady() === false, 'isContentReady deve continuar false com sidebar pronta');

        // 3. CSS deve conter regras de desacoplamento por componente
        const stylesText = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');
        assert(stylesText.includes('html.smg-topbar-ready #smg-topbar-wrap'), 'CSS deve permitir exibição imediata de #smg-topbar-wrap via smg-topbar-ready');
        assert(stylesText.includes('html.smg-sidebar-ready #smg-aldock'), 'CSS deve permitir exibição imediata de #smg-aldock via smg-sidebar-ready');
        assert(stylesText.includes('html.smg-topbar-ready #smg-page-skeleton'), 'CSS deve ajustar topo do skeleton para não cobrir topbar pronta');

        // 4. Verificação de Gravação Estável da Estrutura da Thread (threadStructureIsRecorded)
        if (typeof resetPaintMediaDeadline === 'function') resetPaintMediaDeadline();
        const tContent = document.createElement('div');
        tContent.className = 'p-body-content';
        const tHeader = document.createElement('div');
        tHeader.className = 'p-body-header';
        const tMessages = document.createElement('div');
        tMessages.className = 'block--messages';
        const tFooter = document.createElement('footer');
        tFooter.className = 'p-footer';

        tContent.appendChild(tMessages);
        document.body.appendChild(tHeader);
        document.body.appendChild(tContent);
        document.body.appendChild(tFooter);

        // Sem dataset unificado no header, deve retornar false
        assert(threadStructureIsRecorded(tContent, tHeader) === false, 'threadStructureIsRecorded deve retornar false com header sem unificação');

        tHeader.dataset.smgThead = '1';
        tHeader.dataset.smgUnified = '1';

        // Com posts sem card estilizado (smgCardReady ausente), deve retornar false
        const tPost = document.createElement('article');
        tPost.className = 'message message--post';
        tMessages.appendChild(tPost);
        assert(threadStructureIsRecorded(tContent, tHeader) === false, 'threadStructureIsRecorded deve retornar false com post sem card pronto');

        tPost.dataset.smgCardReady = '1';

        // Com galeria que ainda não calculou colunas ou relayout, deve retornar false
        const tGrid = document.createElement('div');
        tGrid.className = 'auto-image-grid';
        tPost.appendChild(tGrid);
        assert(threadStructureIsRecorded(tContent, tHeader) === false, 'threadStructureIsRecorded deve retornar false com grade sem colunas/relayout computados');

        // Ao gravar colunas e relayout na grade e marcar galeria pronta
        tGrid.dataset.smgCols = '2';
        tGrid.dataset.smgRelayoutDone = '1';
        tPost.dataset.smgGalReady = '1';

        // Com imagem pendente de aspect ratio, deve retornar false
        const tImg = document.createElement('img');
        tImg.className = 'bbImage';
        tGrid.appendChild(tImg);
        assert(threadStructureIsRecorded(tContent, tHeader) === false, 'threadStructureIsRecorded deve retornar false se houver imagem sem dimensão nem ratio');

        // Com aspect-ratio travado na imagem, estrutura está completamente gravada
        tImg.style.aspectRatio = '4 / 3';
        assert(threadStructureIsRecorded(tContent, tHeader) === true, 'threadStructureIsRecorded deve retornar true quando header, posts, grids e mídias estão gravados');
        assert(tContent.dataset.smgStructureRecorded === '1', 'threadStructureIsRecorded deve gravar smgStructureRecorded="1" no container de conteúdo');

        // 5. Prontidão do Conteúdo (markContentReady)
        markContentReady({ kind: PAINT_PAGE_KINDS.THREAD });
        assert(docEl.classList.contains('smg-content-ready'), 'markContentReady deve adicionar smg-content-ready');
        assert(!docEl.classList.contains('smg-content-pending'), 'markContentReady deve remover smg-content-pending');
        assert(!docEl.classList.contains('smg-page-pending'), 'markContentReady deve finalizar o paint gate da página');
        assert(docEl.classList.contains('smg-page-ready'), 'markContentReady deve adicionar smg-page-ready');
        assert(isContentReady() === true, 'isContentReady deve retornar true');

        // Limpeza dos nós de teste
        tHeader.remove();
        tContent.remove();
        tFooter.remove();
        docEl.classList.remove('smg-topbar-ready', 'smg-sidebar-ready', 'smg-content-ready', 'smg-page-ready');
    }

    // =========================================================================
    // TESTE 60: Anti-Flickering do Skeleton, Transição Suave & Proteção de Navegação
    // =========================================================================
    console.log('--- TESTE 60: Anti-Flickering do Skeleton & Proteção de Transições ---');
    if (window.__paintExports) {
        const { setNavigatingOut, isNavigatingOut, ensurePageSkeleton } = window.__paintExports;
        const docEl = document.documentElement;

        // 1. Helpers de transição de navegação
        assert(typeof setNavigatingOut === 'function', 'setNavigatingOut deve estar disponível em __paintExports');
        assert(typeof isNavigatingOut === 'function', 'isNavigatingOut deve estar disponível em __paintExports');
        assert(isNavigatingOut() === false, 'isNavigatingOut deve iniciar como false');

        setNavigatingOut();
        assert(isNavigatingOut() === true, 'setNavigatingOut deve definir isNavigatingOut como true');

        // Navegação pelo histórico deve resetar o bloqueio
        window.dispatchEvent(new window.Event('popstate'));
        assert(isNavigatingOut() === false, 'popstate deve resetar isNavigatingOut para false');

        // 2. Proteção do CSS contra cortes secos e flickers
        const paintCss = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');
        assert(paintCss.includes('smg-skeleton-fade-out'), 'CSS deve conter classe de saída smg-skeleton-fade-out');
        assert(paintCss.includes('transition: opacity var(--smg-dur-12)'), 'Skeleton deve possuir transição suave de opacidade');
        assert(paintCss.includes('html.smg-content-ready:not(.smg-skeleton-fade-out) #smg-page-skeleton'), 'CSS deve manter skeleton durante fade-out sem corte display:none');

        // 3. Blindagem contra re-criação de skeleton se página já estiver pronta
        docEl.classList.add('smg-page-ready', 'smg-content-ready');
        const existingSkeleton = document.getElementById('smg-page-skeleton');
        if (existingSkeleton) existingSkeleton.remove();

        if (typeof ensurePageSkeleton === 'function') {
            ensurePageSkeleton();
            assert(document.getElementById('smg-page-skeleton') === null, 'ensurePageSkeleton NÃO deve criar skeleton se smg-page-ready já estiver presente');
        }

        // 4. Blindagem de detectPageClasses contra re-injeção de pending após liberação
        if (typeof window.detectPageClasses === 'function') {
            window.detectPageClasses();
            assert(!docEl.classList.contains('smg-page-pending'), 'detectPageClasses NÃO deve re-adicionar smg-page-pending se página já estiver pronta');
            assert(!docEl.classList.contains('smg-content-pending'), 'detectPageClasses NÃO deve re-adicionar smg-content-pending se página já estiver pronta');
        }

        // Limpeza
        docEl.classList.remove('smg-page-ready', 'smg-content-ready');
    }

    // =========================================================================
    // TESTE 61: Melhorias Visuais (Dock Gordinha, Ícones Centralizados, Reordenação Mobile e Header da Thread)
    // =========================================================================
    console.log('--- TESTE 61: Melhorias Visuais (Dock Gordinha, Ícones Centralizados, Reordenação Mobile e Header da Thread) ---');
    {
        const fs = require('fs');
        const scriptCode = fs.readFileSync(path.resolve(__dirname, 'script.js'), 'utf-8');

        // 1. Ícones scrollTop e scrollBottom perfeitamente centralizados
        assert(scriptCode.includes("scrollTop: svgIcon('<path d=\"M6 7h12\"/><path d=\"m18 17-6-6-6 6\"/>')"), 'scrollTop deve estar perfeitamente centralizado em Y=12.0');
        assert(scriptCode.includes("scrollBottom: svgIcon('<path d=\"m6 7 6 6 6-6\"/><path d=\"M6 17h12\"/>')"), 'scrollBottom deve estar perfeitamente centralizado em Y=12.0');

        // 2. Dock desktop mais alta e menos espaçada horizontalmente ("gordinha")
        assert(scriptCode.includes('padding: var(--smg-sp-10) var(--smg-sp-10);'), 'Dock desktop deve ter padding vertical maior');
        assert(scriptCode.includes('margin: 0 var(--smg-sp-6);'), 'Divisores da dock devem ter espaçamento horizontal reduzido');
        assert(scriptCode.includes('width: 44px;\n                height: 44px;') || scriptCode.includes('width: 44px; height: 44px;'), 'Botões da dock desktop devem ter 44px');

        // 3. Ordem de ícones na dock mobile: up | down | pages | sort | mode | notification
        assert(scriptCode.includes('[btnUpM, btnDownM, btnMobilePageBtn, btnSortM, btnViewModeM, btnWatchM]'), 'Dock mobile de thread deve ter ordem: up | down | pages | sort | mode | notification');

        // 4. Ícone de notificação com cor quando seguindo no mobile
        assert(scriptCode.includes('.smg-dock-thread-bar #smg-thread-watch.smg-active'), 'Dock mobile deve colorir botão de notificação quando ativo/seguindo');

        // 5. Remoção completa da topbar fixa do mobile na página de thread
        assert(scriptCode.includes('html.smg-thread #smg-topbar-wrap,\n                html.smg-thread .smg-mobile-threadbar {\n                    display: none !important;'), 'Topbar fixa mobile deve ser completamente removida em páginas de thread');

        // 6. Aumento da foto de perfil da thread no mobile
        assert(scriptCode.includes('html.smg-thread .smg-thead-thumb {\n                    flex: 0 0 88px !important;\n                    width: 88px !important;'), 'Foto de perfil da thread no mobile deve ser aumentada para 88px');

        // 7. Remoção no mobile da barra de páginas/follow/sort do topo da thread
        assert(scriptCode.includes('html.smg-thread .smg-thead-controls,\n                html.smg-thread .smg-thead-unified .smg-thead-controls,\n                html.smg-thread .smg-thead-unified .smg-bar'), 'Barra de controles e paginação do topo deve ser ocultada no mobile');
    }

    // =========================================================================
    // TESTE 62: Desacoplamento do Loading da Navbar & Espaçamento Uniforme da Barra Mobile
    // =========================================================================
    console.log('--- TESTE 62: Desacoplamento do Loading da Navbar & Espaçamento Uniforme da Barra Mobile ---');
    {
        const fs = require('fs');
        const scriptCode = fs.readFileSync(path.resolve(__dirname, 'script.js'), 'utf-8');
        const docEl = document.documentElement;

        // 1. Espaçamento uniforme na barra acima da navbar no mobile
        assert(scriptCode.includes('justify-content: space-around !important;'), 'Barra móvel deve ter justify-content: space-around !important');
        assert(scriptCode.includes('gap: 0 !important;'), 'Barra móvel deve zerar gap para distribuir botões homogeneamente');
        assert(scriptCode.includes('flex: 1 1 0 !important;'), 'Botões da barra móvel devem usar flex: 1 1 0 !important para largura uniforme');
        assert(scriptCode.includes('min-width: 0 !important;'), 'Botões da barra móvel devem ter min-width: 0 !important para evitar estouro');

        // 2. Disponibilidade e comportamento de markNavbarReady e isNavbarReady
        if (window.__paintExports) {
            const { markNavbarReady, isNavbarReady } = window.__paintExports;
            assert(typeof markNavbarReady === 'function', 'markNavbarReady deve estar disponível em __paintExports');
            assert(typeof isNavbarReady === 'function', 'isNavbarReady deve estar disponível em __paintExports');

            // Setup estado inicial de loading
            docEl.classList.remove('smg-navbar-ready');
            docEl.classList.add('smg-navbar-loading', 'smg-navbar-pending');
            assert(isNavbarReady() === false, 'isNavbarReady deve ser false antes de markNavbarReady');

            // Criar mockup da bottom nav do skeleton
            const dummyBottomNav = document.createElement('nav');
            dummyBottomNav.className = 'smg-page-skeleton-bottom-nav';
            document.body.appendChild(dummyBottomNav);

            // Acionar markNavbarReady
            markNavbarReady();
            assert(docEl.classList.contains('smg-navbar-ready'), 'markNavbarReady deve adicionar smg-navbar-ready');
            assert(!docEl.classList.contains('smg-navbar-loading'), 'markNavbarReady deve remover smg-navbar-loading');
            assert(!docEl.classList.contains('smg-navbar-pending'), 'markNavbarReady deve remover smg-navbar-pending');
            assert(isNavbarReady() === true, 'isNavbarReady deve retornar true após markNavbarReady');
            assert(!document.body.contains(dummyBottomNav), 'markNavbarReady deve remover a bottom nav do skeleton');

            // Limpeza
            docEl.classList.remove('smg-navbar-ready');
        }

        // 3. Regras CSS de desacoplamento da navbar
        assert(scriptCode.includes('html.smg-page-pending #smg-post-nav-wrapper {\n                visibility: hidden !important;'), 'CSS deve ocultar navbar quando página estiver pending');
        assert(scriptCode.includes('html.smg-navbar-ready #smg-post-nav-wrapper {\n                visibility: visible !important;\n                pointer-events: auto !important;\n                z-index: var(--smg-z-gate-2) !important;'), 'CSS deve exibir navbar imediatamente quando smg-navbar-ready');
        assert(scriptCode.includes('html.smg-navbar-ready .smg-page-skeleton-bottom-nav'), 'CSS deve ocultar bottom-nav do skeleton quando smg-navbar-ready');
    }

    // =========================================================================
    // TESTE 63: Safety Release Timer do Skeleton & Redesign do Search (Desktop & Mobile Icon-Only)
    // =========================================================================
    console.log('--- TESTE 63: Safety Release Timer do Skeleton & Redesign do Search ---');
    {
        const fs = require('fs');
        const scriptCode = fs.readFileSync(path.resolve(__dirname, 'script.js'), 'utf-8');
        const docEl = document.documentElement;

        // 1. Blindagem contra retenção do skeleton por mais de 10s
        assert(scriptCode.includes('PAINT_HARD_TIMEOUT_MS = 4500;'), 'Deve existir PAINT_HARD_TIMEOUT_MS de 4500ms');
        assert(scriptCode.includes('if (stable || expired)'), 'Condição de expiração deve liberar página sem loop infinito de fallback');
        assert(scriptCode.includes('armPagePaintSafetyTimer'), 'armPagePaintSafetyTimer deve estar presente no script');

        if (window.__paintExports) {
            const { armPagePaintSafetyTimer, markContentReady } = window.__paintExports;
            assert(typeof armPagePaintSafetyTimer === 'function', 'armPagePaintSafetyTimer deve estar exportado');

            // Simula página pendente e testa desarme do safety timer
            docEl.classList.add('smg-page-pending', 'smg-content-pending');
            armPagePaintSafetyTimer();
            // Ao marcar conteúdo pronto, safety timer é desarmado e classes removidas
            markContentReady();
            assert(!docEl.classList.contains('smg-page-pending'), 'markContentReady deve remover smg-page-pending');
            assert(docEl.classList.contains('smg-content-ready'), 'markContentReady deve aplicar smg-content-ready');
            docEl.classList.remove('smg-content-ready', 'smg-page-ready');
        }

        // 2. Toolbar do Search Desktop: ícones monocromáticos, altura uniforme de 34px e autor icon-only com row expansível
        assert(scriptCode.includes('height: 34px;\n                padding: 0 var(--smg-sp-28) 0 var(--smg-sp-32);\n                border-radius: var(--smg-r-10);'), 'Selects do desktop devem ter altura 34px e padding 32px (escala) à esquerda para o ícone monocromático');
        assert(scriptCode.includes('.smg-search-author-trigger {\n                display: inline-flex;\n                align-items: center;\n                justify-content: center;\n                width: 34px;\n                height: 34px;'), 'Botão do autor no desktop deve ser icon-only de 34px');
        assert(scriptCode.includes('.smg-search-global-toolbar.author-open .smg-search-tb-row {\n                display: none !important;\n            }'), 'Ao abrir autor, a row normal de filtros é oculta');
        assert(scriptCode.includes('.smg-search-author-row {\n                display: flex;\n                align-items: center;\n                gap: var(--smg-sp-10);\n                width: 100%;\n                height: 34px;'), 'A row de autor expansível ocupa a largura total no lugar da toolbar');
        assert(scriptCode.includes('.smg-search-tb-row .smg-search-adv, .smg-search-tb-right .smg-search-adv {\n                display: inline-flex;\n                align-items: center;\n                gap: var(--smg-sp-8);\n                height: 34px;'), 'Botão de filtro avançado no desktop deve ter altura 34px');
        assert(!scriptCode.includes('<div class="smg-search-badges-slot"></div>'), 'Filtro de tags deve ter sido removido da toolbar do search');

        // 3. Toolbar do Search Mobile: Dropdowns monocromáticos icon-only, autor icon-only e tela cheia com barra na base
        assert(scriptCode.includes('#smg-search-pop {\n                    position: fixed !important; inset: auto !important;\n                    top: var(--smg-kb-top, 0px) !important; bottom: auto !important; left: 0 !important; right: 0 !important;\n                    width: 100vw !important; max-width: 100vw !important;'), 'Search pop no mobile deve ir de borda a borda a partir do topo do viewport visível');
        assert(scriptCode.includes('height: var(--smg-kb-h, 100dvh) !important; max-height: var(--smg-kb-h, 100dvh) !important;'), 'Search pop no mobile deve ocupar toda a tela (--smg-kb-h, 100dvh)');
        assert(scriptCode.includes('#smg-search-pop::before { display: none !important; }'), 'Puxador do sheet deve ser removido no mobile');
        assert(scriptCode.includes('#smg-search-pop .smg-search-bar {\n                    order: 3 !important;'), 'Barra de busca no mobile deve ficar na base (order: 3)');
        assert(scriptCode.includes('#smg-search-pop .smg-search-global-toolbar {\n                    order: 2 !important;'), 'Toolbar de filtros no mobile deve ficar acima do input (order: 2)');
        assert(scriptCode.includes('#smg-search-pop .smg-search-results,\n                #smg-search-pop .smg-search-history,\n                #smg-search-pop .smg-search-empty {\n                    order: 1 !important;'), 'Resultados e histórico no mobile devem ficar no topo rolável (order: 1)');
        assert(scriptCode.includes('#smg-search-pop .smg-search-select-wrap {\n                    position: relative !important; flex: 0 0 38px !important;'), 'Select wraps no mobile devem ter 38px e ser icon-only');
        assert(scriptCode.includes('#smg-search-pop .smg-search-author-trigger {\n                    flex: 0 0 38px !important; width: 38px !important; height: 38px !important;'), 'Autor no mobile deve ser icon-only de 38px');
        assert(scriptCode.includes('#smg-search-pop .smg-search-tb-row .smg-search-adv span:first-child {\n                    display: none !important;'), 'Texto do filtro avançado no mobile deve ser ocultado para virar icon-only');
    }

    // =========================================================================
    // TESTE 64: Resolução Resiliente do ImagePond (media1, /media/new/, .media-container & Fallback sem Falso 404)
    // =========================================================================
    console.log('--- TESTE 64: Resolução Resiliente do ImagePond ---');
    if (typeof window.__imagepondResolve === 'function') {
        const origGmx = window.GM_xmlhttpRequest;

        // 1. Caso real 1: Embed de Imagem em /videos/ com subdomínio media1 e /media/new/images/
        window.__imagepondCache.clear();
        window.__imagepondInflight.clear();
        window.GM_xmlhttpRequest = (opts) => {
            setTimeout(() => {
                opts.onload({
                    status: 200,
                    responseText: `<!DOCTYPE html><html><body><div class="media-container"><img src="https://media1.imagepond.net/media/new/images/842235187_18119524292035434_8177815651524345792_n_1Ii4DLYf.jpg" alt="test.jpg"></div><div class="embed-link"><a href="https://www.imagepond.net/i/842235187-18119524292035434">link</a></div></body></html>`
                });
            }, 10);
        };

        let ipPhotoRes = null;
        window.__imagepondResolve('https://www.imagepond.net/videos/GfYUuCie', res => { ipPhotoRes = res; });
        await new Promise(r => setTimeout(r, 40));

        assert(ipPhotoRes !== null, 'imagepondResolve deve retornar resultado para página de imagem');
        assert(ipPhotoRes.error === undefined || ipPhotoRes.error === null, 'imagepondResolve não deve retornar erro 404 para imagem válida');
        assert(ipPhotoRes.img === 'https://media1.imagepond.net/media/new/images/842235187_18119524292035434_8177815651524345792_n_1Ii4DLYf.jpg', 'imagepondResolve deve extrair a URL correta de media1 da imagem');

        // 2. Caso real 2: Embed de Vídeo com media1 e /media/new/videos/
        window.__imagepondCache.clear();
        window.__imagepondInflight.clear();
        window.GM_xmlhttpRequest = (opts) => {
            setTimeout(() => {
                opts.onload({
                    status: 200,
                    responseText: `<!DOCTYPE html><html><body><div class="media-container"><video class="video-js" poster="https://media1.imagepond.net/media/new/images/poster_test.jpg"><source src="https://media1.imagepond.net/media/new/videos/clip_5wiiADFf.mp4" type="video/mp4"></video></div></body></html>`
                });
            }, 10);
        };

        let ipVidRes = null;
        window.__imagepondResolve('https://www.imagepond.net/videos/z5ZuecRe', res => { ipVidRes = res; });
        await new Promise(r => setTimeout(r, 40));

        assert(ipVidRes !== null, 'imagepondResolve deve retornar resultado para página de vídeo');
        assert(ipVidRes.mp4 === 'https://media1.imagepond.net/media/new/videos/clip_5wiiADFf.mp4', 'imagepondResolve deve extrair o vídeo de media1');
        assert(ipVidRes.poster === 'https://media1.imagepond.net/media/new/images/poster_test.jpg', 'imagepondResolve deve extrair o poster do vídeo');

        // 3. Caso 3: Página HTTP 200 sem mídia identificada NÃO deve forçar erro 404 (para permitir restoreIframe)
        window.__imagepondCache.clear();
        window.__imagepondInflight.clear();
        window.GM_xmlhttpRequest = (opts) => {
            setTimeout(() => {
                opts.onload({
                    status: 200,
                    responseText: `<!DOCTYPE html><html><body><div>Unknown embed format</div></body></html>`
                });
            }, 10);
        };

        let ipUnknownRes = null;
        window.__imagepondResolve('https://www.imagepond.net/videos/unknown_embed', res => { ipUnknownRes = res; });
        await new Promise(r => setTimeout(r, 40));

        assert(ipUnknownRes !== null, 'imagepondResolve deve chamar callback para formato desconhecido');
        assert(!ipUnknownRes.error, 'Página HTTP 200 não deve forçar erro 404 (permitindo restoreIframe nativo)');

        // 4. Caso 4: dois embeds do ImagePond que viraram imagem (<a><img>) lado a lado → um grupo de 2, sem <a> vazio
        const { buildPostGallery: bpg64 } = window.__masonryExports;
        const testGrid = document.createElement('div');
        testGrid.className = 'message-userContent';
        testGrid.innerHTML = '<div class="bbWrapper">Antes<br><a class="smg-imglink" href="https://media1.imagepond.net/media/new/images/foto1.jpg"><img class="bbImage" src="https://media1.imagepond.net/media/new/images/foto1.jpg"></a><br><a class="smg-imglink" href="https://media1.imagepond.net/media/new/images/foto2.jpg"><img class="bbImage" src="https://media1.imagepond.net/media/new/images/foto2.jpg"></a></div>';
        document.body.appendChild(testGrid);
        bpg64(testGrid);
        const grid64 = testGrid.querySelector('.auto-image-grid');
        assert(grid64 && grid64.children.length === 2, 'auto-image-grid deve conter exatamente 2 imagens após resolução do ImagePond');
        assert(Array.from(testGrid.querySelectorAll('a')).every(a => a.querySelector('img')), 'auto-image-grid NÃO deve conter nós <a> fantasmas vazios');
        assert(grid64 && grid64.querySelectorAll('img.bbImage').length === 2, 'auto-image-grid deve conter as 2 imagens');

        testGrid.remove();
        window.GM_xmlhttpRequest = origGmx;

        // =========================================================================
        // TESTE 65: Busca Flexível de Títulos (Espaços vs. Sem Espaços, CamelCase e Separadores)
        // =========================================================================
        console.log('--- TESTE 65: Busca Flexível de Títulos (Espaços vs. Sem Espaços) ---');
        const bfk = window.buildFlexibleKeywords;
        assert(typeof bfk === 'function', 'buildFlexibleKeywords deve estar disponível');

        // 1. Termo com espaços deve gerar variante original e variante concatenada unidas por OR
        const resSpaces = bfk('jade the jaguar', true);
        assert(resSpaces.includes('jade* the* jaguar*') || resSpaces.includes('jade the jaguar'), 'Deve conter as palavras originais');
        assert(resSpaces.includes('jadethejaguar*') || resSpaces.includes('jadethejaguar'), 'Deve conter a forma concatenada sem espaços');
        assert(resSpaces.includes(' OR '), 'Deve unir as variantes com operador OR');

        // 2. Termo com separadores (underline/hífen/ponto) deve gerar variantes
        const resUnderline = bfk('jade_the_jaguar', true);
        assert(resUnderline.includes('jadethejaguar') || resUnderline.includes('jade the jaguar'), 'Deve gerar formas limpas para termos com underline');
        assert(resUnderline.includes(' OR '), 'Deve unir com operador OR');

        // 3. Termo em CamelCase deve gerar forma separada
        const resCamel = bfk('JadeTheJaguar', true);
        assert(resCamel.includes('JadeTheJaguar'), 'Deve manter a forma original');
        assert(resCamel.includes('Jade') && resCamel.includes('Jaguar'), 'Deve conter a forma decomposta em palavras');
        assert(resCamel.includes(' OR '), 'Deve unir com operador OR');

        // 4. Termo com aspas explícitas deve respeitar literalidade sem OR
        const resQuotes = bfk('"jade the jaguar"', true);
        assert(!resQuotes.includes(' OR '), 'Busca com aspas explícitas NÃO deve inventar variantes com OR');
        assert(resQuotes === '"jade the jaguar"', 'Busca com aspas explícitas deve permanecer inalterada');

        // 5. Palavra única simples não deve inventar OR
        const resSingle = bfk('jaguar', true);
        assert(!resSingle.includes(' OR '), 'Palavra única não deve ter variantes com OR');
        assert(resSingle.startsWith('jaguar'), 'Palavra única deve ser preservada');
    }

    // =========================================================================
    // TESTE 66: Melhorias Avançadas do Search (Social Handles, Acentos, Clear, Atalho / e Chips Dinâmicos)
    // =========================================================================
    console.log('--- TESTE 66: Melhorias Avançadas do Search ---');
    {
        const bfk = window.buildFlexibleKeywords;
        const dockExports = window.__dockSearchExports || {};
        const extractHandle = window.extractSocialHandle || dockExports.extractSocialHandle;
        const removeAccents = window.removeAccents || dockExports.removeAccents;

        // 1. Extração de Identificadores Sociais e Limpeza de URLs
        assert(typeof extractHandle === 'function', 'extractSocialHandle deve estar disponível');
        assert(extractHandle('https://www.instagram.com/jadethejaguar/') === 'jadethejaguar', 'Deve extrair handle de link do Instagram');
        assert(extractHandle('https://x.com/jadethejaguar?t=abcd') === 'jadethejaguar', 'Deve extrair handle de link do Twitter/X com query params');
        assert(extractHandle('https://onlyfans.com/jadethejaguar') === 'jadethejaguar', 'Deve extrair handle de link do OnlyFans');
        assert(extractHandle('https://www.tiktok.com/@jadethejaguar') === 'jadethejaguar', 'Deve extrair handle de link do TikTok com @');
        assert(extractHandle('@jadethejaguar') === 'jadethejaguar', 'Deve limpar @ de @handle');
        assert(extractHandle('jadethejaguar') === 'jadethejaguar', 'Texto comum sem formato social deve ser preservado');

        const resSocial = bfk('https://www.instagram.com/jade_the_jaguar/', true);
        assert(resSocial.includes('jade_the_jaguar'), 'buildFlexibleKeywords com URL de rede social deve conter o handle extraído');
        assert(resSocial.includes(' OR '), 'buildFlexibleKeywords deve gerar variantes do handle social');

        // 2. Normalização de Diacríticos / Acentos (Unicode Unaccent)
        assert(typeof removeAccents === 'function', 'removeAccents deve estar disponível');
        assert(removeAccents('vitória') === 'vitoria', 'Deve remover acento agudo');
        assert(removeAccents('chloë') === 'chloe', 'Deve remover trema');
        assert(removeAccents('amanda leão') === 'amanda leao', 'Deve remover til');

        const resAccents = bfk('vitória', true);
        assert(resAccents.includes('vitória') && resAccents.includes('vitoria'), 'buildFlexibleKeywords deve gerar variantes com e sem acento');
        assert(resAccents.includes(' OR '), 'Variantes com/sem acento devem ser unidas por OR');

        const resCompoundAccent = bfk('amanda leão', true);
        assert(resCompoundAccent.includes('leao') || resCompoundAccent.includes('amandaleao'), 'Deve gerar variantes desacentuadas para palavras compostas');

        // 3. Botão de Limpar Busca (✕) no Input
        const searchInput = (dockExports.getSearchInput && dockExports.getSearchInput()) || document.querySelector('.smg-search-input');
        const bar = searchInput ? searchInput.closest('.smg-search-bar, .smg-tb-search') : null;
        const clearBtn = bar ? bar.querySelector('.smg-search-clear') : document.querySelector('.smg-search-clear');
        assert(clearBtn !== null, 'Botão .smg-search-clear deve existir no DOM da barra de busca');

        if (searchInput && clearBtn) {
            searchInput.value = 'teste query';
            dockExports.updateSearchClearButtons();
            assert(clearBtn.hidden === false, 'Botão .smg-search-clear deve ficar visível quando input tem texto');

            clearBtn.click();
            assert(searchInput.value === '', 'Clique em .smg-search-clear deve esvaziar o valor do input');
            assert(clearBtn.hidden === true, 'Botão .smg-search-clear deve ficar oculto após a limpeza');
            searchInput.blur();
        }

        // 4. Atalho Global de Teclado "/"
        const searchOverlay = document.getElementById('smg-search-overlay');
        assert(searchOverlay !== null, 'searchOverlay deve existir');

        if (searchOverlay && dockExports.closeSearch) {
            dockExports.closeSearch();
            assert(!searchOverlay.classList.contains('open'), 'Search overlay deve estar fechado antes do atalho');

            if (searchInput) searchInput.blur();
            if (document.body) document.body.focus();

            // Dispara tecla / em elemento neutro (ex: body)
            window.dispatchEvent(new window.KeyboardEvent('keydown', { key: '/', bubbles: true }));
            assert(searchOverlay.classList.contains('open'), 'Pressionar "/" em elemento neutro deve abrir a busca');

            dockExports.closeSearch();
        }

        // 5. Chips Dinâmicos de Prefixo nos Resultados da Busca
        const searchResultsEl = dockExports.searchResultsEl;
        assert(searchResultsEl !== null, 'searchResultsEl deve estar disponível');

        if (dockExports.activeSearchBadges) {
            dockExports.activeSearchBadges.clear();
        }

        if (dockExports.paintResults && searchResultsEl) {
            const mockLabelOF = document.createElement('span');
            mockLabelOF.className = 'label label--misc';
            mockLabelOF.textContent = 'OnlyFans';

            const mockLabelMega = document.createElement('span');
            mockLabelMega.className = 'label label--accent';
            mockLabelMega.textContent = 'Mega';

            const mockResults = [
                {
                    href: '/threads/1',
                    title: 'Thread Um',
                    snippet: 'Preview um',
                    meta: 'Meta um',
                    photo: '',
                    labels: [mockLabelOF]
                },
                {
                    href: '/threads/2',
                    title: 'Thread Dois',
                    snippet: 'Preview dois',
                    meta: 'Meta dois',
                    photo: '',
                    labels: [mockLabelMega]
                },
                {
                    href: '/threads/3',
                    title: 'Thread Tres',
                    snippet: 'Preview tres',
                    meta: 'Meta tres',
                    photo: '',
                    labels: [mockLabelOF]
                }
            ];

            dockExports.paintResults(mockResults, null);

            const chipsRow = searchResultsEl.querySelector('.smg-search-chips-row');
            assert(chipsRow !== null, 'Linha .smg-search-chips-row deve ser criada quando há 2 ou mais tags distintas');

            const chipButtons = chipsRow ? chipsRow.querySelectorAll('.smg-search-result-chip') : [];
            assert(chipButtons.length === 3, 'Deve renderizar 3 chips: All (Todos), OnlyFans e Mega');

            const allChip = chipButtons[0];
            assert(allChip && allChip.classList.contains('is-active'), 'Chip All deve iniciar com classe is-active');

            const cardsList = searchResultsEl.querySelector('.smg-search-results-list');
            assert(cardsList !== null, '.smg-search-results-list deve conter a lista de cards');
            assert(cardsList && cardsList.querySelectorAll('.smg-search-result').length === 3, 'Inicialmente todos os 3 cards devem estar visíveis');

            // Clica no chip OnlyFans
            const ofChip = Array.from(chipButtons).find(c => c.dataset.tag === 'onlyfans');
            assert(ofChip !== undefined, 'Chip OnlyFans deve existir com data-tag="onlyfans"');
            if (ofChip) {
                ofChip.click();
                assert(ofChip.classList.contains('is-active'), 'Chip OnlyFans deve se tornar is-active após clique');
                assert(!allChip.classList.contains('is-active'), 'Chip All não deve mais ser is-active');
                assert(cardsList.querySelectorAll('.smg-search-result').length === 2, 'Apenas os 2 cards com tag OnlyFans devem estar visíveis');
            }

            // Clica de volta no chip All
            if (allChip) {
                allChip.click();
                assert(allChip.classList.contains('is-active'), 'Chip All deve voltar a ser is-active');
                assert(cardsList.querySelectorAll('.smg-search-result').length === 3, 'Todos os 3 cards devem voltar a estar visíveis');
            }
        }
    }

    // =========================================================================
    // TESTE 67: Revamp da Homepage (Topbar, Hero Carousel & Category Hub)
    // =========================================================================
    console.log('--- TESTE 67: Revamp da Homepage (Topbar, Hero Carousel & Category Hub) ---');
    const allStyles = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');

    // 1. Topbar no estado default e flutuante
    assert(allStyles.includes('height: 72px;'), 'Topbar default deve ter 72px de altura');
    assert(allStyles.includes('padding-top: 72px !important;'), 'Body deve ter padding-top de 72px para compensar a topbar');
    assert(allStyles.includes('scroll-margin-top: 86px;'), ':target deve compensar 86px para a topbar de 72px');
    assert(allStyles.includes('#smg-topbar-wrap.floating #smg-tb-inner { height: 60px; }'), 'Topbar flutuante deve encolher para 60px no scroll');
    assert(allStyles.includes('.smg-tb-logo {') && allStyles.includes('height: 48px;'), '.smg-tb-logo deve ter 48px de altura');
    assert(allStyles.includes('.smg-tb-logo img {') && allStyles.includes('height: 42px;'), '.smg-tb-logo img deve ter 42px de altura');
    assert(allStyles.includes('max-width: 220px;'), 'Logo deve ter max-width expandido para 220px');
    assert(allStyles.includes('.smg-logo-word {') && allStyles.includes('font-size: var(--smg-fs-28);'), 'Logo SMG deve ter font-size 28px (escala)');
    assert(allStyles.includes('font-weight: 900;'), 'Logo SMG deve ter font-weight 900');
    assert(paintSkeletonMarkup('home').includes('smg-page-skeleton-chrome') && !allStyles.includes('.smg-home-skeleton-topbar {'), 'Skeleton da topbar da home deve ser o mesmo das outras páginas');
    assert(allStyles.includes('.smg-page-skeleton-chrome {') && allStyles.includes('height: 62px;'), 'Skeleton da topbar (home inclusive) deve ter 62px');

    // 2. Carousel de Últimos Posts e Em Alta
    assert(allStyles.includes('width: 295px;'), 'Cards do carousel devem ter largura expandida de 295px');
    assert(allStyles.includes('height: 395px;'), 'Cards do carousel devem ter altura expandida de 395px');
    assert(allStyles.includes('aspect-ratio: 3 / 4.02;'), 'Cards do carousel devem ter aspect-ratio de 3 / 4.02');
    assert(allStyles.includes('.smg-feed-card-badges'), 'CSS deve conter classe .smg-feed-card-badges para tags isoladas');
    assert(allStyles.includes('.smg-feed-card-meta .smg-feed-user'), 'CSS deve conter estilo para o usuário do card no meta');
    assert(allStyles.includes('.smg-feed-nav'), 'CSS deve conter botões de navegação .smg-feed-nav');

    if (window.__homeExports) {
        const {
            extractFeedItemData,
            createFeedCardEl,
            getCachedFeed,
            setCachedFeed,
            FEED_CACHE_KEY_PREFIX,
            enhanceHomeHubSections,
            homeLayoutSignature,
            classifyHomeNode,
            organizeHomeHub,
            getMainCategoryOrder
        } = window.__homeExports;

        // Testar extração de dados da thread
        const mockItem = document.createElement('div');
        mockItem.className = 'structItem structItem--thread';
        mockItem.innerHTML = `
            <div class="structItem-cell structItem-cell--icon">
                <div class="dcThumbnail"><img src="https://media.test/thumb.jpg"></div>
            </div>
            <div class="structItem-cell structItem-cell--main">
                <div class="structItem-title">
                    <span class="label label--instagram">Instagram</span>
                    <span class="prefix">MILF</span>
                    <a href="/threads/sample-model.123/">Sample Model</a>
                </div>
            </div>
            <div class="structItem-cell structItem-cell--latest">
                <a href="/posts/9999/" class="structItem-latestDate">10 minutos atrás</a>
                <span class="username">TestAuthor</span>
            </div>
        `;
        const itemData = extractFeedItemData(mockItem);
        assert(itemData !== null, 'extractFeedItemData deve extrair dados válidos da thread');
        assert(itemData.titleText === 'Sample Model', 'Deve extrair o texto limpo do título');
        assert(itemData.labels.length === 2, 'Deve extrair os 2 badges separadamente');
        assert(itemData.metaUser === 'TestAuthor', 'Deve extrair o autor mais recente');
        assert(itemData.metaTime === '10 minutos atrás', 'Deve extrair a data mais recente');

        // Testar renderização do card
        const cardEl = createFeedCardEl(itemData, '<svg></svg>');
        assert(cardEl !== null, 'createFeedCardEl deve criar elemento de card');
        assert(cardEl.classList.contains('smg-feed-card'), 'Card deve ter classe .smg-feed-card');
        const badgesEl = cardEl.querySelector('.smg-feed-card-badges');
        assert(badgesEl !== null, 'Card deve ter container isolado de badges');
        assert(badgesEl.querySelectorAll('.label, .prefix').length === 2, 'Badges devem estar dentro do container');
        const titleEl = cardEl.querySelector('.smg-feed-card-title');
        assert(titleEl !== null && titleEl.textContent === 'Sample Model', 'Título do card deve conter texto sem misturar spans');
        const metaEl = cardEl.querySelector('.smg-feed-card-meta');
        assert(metaEl !== null && metaEl.querySelector('.smg-feed-user')?.textContent === 'TestAuthor', 'Meta deve destacar o usuário em .smg-feed-user');

        // Testar cache do feed em sessionStorage
        const testCacheItems = [itemData];
        setCachedFeed('test_tab', testCacheItems, '/whats-new/posts/?page=2');
        const retrievedCache = getCachedFeed('test_tab');
        assert(retrievedCache !== null, 'getCachedFeed deve recuperar o feed salvo em cache');
        assert(Array.isArray(retrievedCache.items) && retrievedCache.items.length === 1, 'Cache deve conter 1 item salvo');
        assert(retrievedCache.items[0].titleText === 'Sample Model', 'Item do cache deve preservar título');
        assert(retrievedCache.nextUrl === '/whats-new/posts/?page=2', 'Cache deve preservar a próxima URL de paginação');

        // Testar List Layout e Hub Styles
        assert(allStyles.includes('/* ================= CATEGORY HUB ================= */'), 'CSS deve conter seção Category Hub');
        assert(allStyles.includes('.smg-hub-badge'), 'CSS deve estilizar badge .smg-hub-badge');
        assert(allStyles.includes('html.smg-home .block--category .block-body') && allStyles.includes('flex-direction: column !important;'), 'Seções da home devem utilizar layout em lista (flex column)');
        assert(allStyles.includes('html.smg-home .node-extra {') && allStyles.includes('background: transparent !important;'), '.node-extra deve ter background transparente');
        assert(allStyles.includes('.node-extra-title'), 'CSS deve conter estilo para o título do último post .node-extra-title');
        assert(allStyles.includes('.smg-hub-category-divider'), 'CSS deve conter estilo para o divisor de categorias .smg-hub-category-divider');
        assert(allStyles.includes('.p-body-header.smg-thead-unified') && allStyles.includes('top: 60px;'), 'Header sticky da thread deve respeitar top: 60px');
        assert(allStyles.includes('.p-body-header.smg-thead-unified') && allStyles.includes('justify-content: space-between !important;'), 'Header sticky da thread deve manter layout horizontal space-between');
        assert(allStyles.includes('.p-body-header.smg-thead-unified.is-stuck') && allStyles.includes('padding: var(--smg-sp-8) 0 !important;'), 'Header sticky no estado stuck deve ter padding simétrico 8px');

        // Testar classifyHomeNode
        assert(typeof classifyHomeNode === 'function', 'classifyHomeNode deve ser função');
        
        // 1. Sites
        const mockSiteNode = document.createElement('div');
        mockSiteNode.className = 'node';
        mockSiteNode.dataset.smgOrigCategory = 'Social Media';
        mockSiteNode.innerHTML = '<div class="node-body"><div class="node-title"><a href="/f/insta">Instagram</a></div></div>';
        assert(classifyHomeNode(mockSiteNode) === 'sites', 'Instagram deve ser classificado como sites');

        const mockOnlyFans = document.createElement('div');
        mockOnlyFans.className = 'node';
        mockOnlyFans.dataset.smgOrigCategory = 'Premium Fan Sites';
        mockOnlyFans.innerHTML = '<div class="node-body"><div class="node-title"><a href="/f/onlyfans">OnlyFans</a></div></div>';
        assert(classifyHomeNode(mockOnlyFans) === 'sites', 'OnlyFans deve ser classificado como sites');

        // 2. Navigation (inclui Workflows e Guides)
        const mockLounge = document.createElement('div');
        mockLounge.className = 'node';
        mockLounge.dataset.smgOrigCategory = 'Community';
        mockLounge.innerHTML = '<div class="node-body"><div class="node-title"><a href="/f/lounge">The Lounge</a></div></div>';
        assert(classifyHomeNode(mockLounge) === 'nav', 'The Lounge deve ser classificado como nav');

        const mockRules = document.createElement('div');
        mockRules.className = 'node';
        mockRules.dataset.smgOrigCategory = 'Info and Links';
        mockRules.innerHTML = '<div class="node-body"><div class="node-title"><a href="/f/rules">Rules</a></div></div>';
        assert(classifyHomeNode(mockRules) === 'nav', 'Rules deve ser classificado como nav');

        const mockWorkflows = document.createElement('div');
        mockWorkflows.className = 'node';
        mockWorkflows.innerHTML = '<div class="node-body"><div class="node-title"><a href="/f/workflows">Workflows</a></div></div>';
        assert(classifyHomeNode(mockWorkflows) === 'nav', 'Workflows deve ser classificado como nav');

        const mockGuides = document.createElement('div');
        mockGuides.className = 'node';
        mockGuides.innerHTML = '<div class="node-body"><div class="node-title"><a href="/f/guides">Guides + Discussion</a></div></div>';
        assert(classifyHomeNode(mockGuides) === 'nav', 'Guides + Discussion deve ser classificado como nav');

        // 3. Requests
        const mockRequests = document.createElement('div');
        mockRequests.className = 'node';
        mockRequests.innerHTML = '<div class="node-body"><div class="node-title"><a href="/f/requests">Requests</a></div></div>';
        assert(classifyHomeNode(mockRequests) === 'requests', 'Requests deve ser classificado como requests');

        // 4. Discussions (inclui Megathreads e Trans Reviews)
        const mockMegathreads = document.createElement('div');
        mockMegathreads.className = 'node';
        mockMegathreads.innerHTML = '<div class="node-body"><div class="node-title"><a href="/f/megathreads">Megathreads</a></div></div>';
        assert(classifyHomeNode(mockMegathreads) === 'discussions', 'Megathreads deve ser classificado como discussions');

        const mockGeneralDisc = document.createElement('div');
        mockGeneralDisc.className = 'node';
        mockGeneralDisc.innerHTML = '<div class="node-body"><div class="node-title"><a href="/f/discussion">General Discussion</a></div></div>';
        assert(classifyHomeNode(mockGeneralDisc) === 'discussions', 'General Discussion deve ser classificado como discussions');

        const mockTransReviews = document.createElement('div');
        mockTransReviews.className = 'node';
        mockTransReviews.innerHTML = '<div class="node-body"><div class="node-title"><a href="/f/trans-reviews">Trans Reviews</a></div></div>';
        assert(classifyHomeNode(mockTransReviews) === 'discussions', 'Trans Reviews deve ir para discussions');

        // 5. Celebrities e XXX / Porn devem ir para categories (não sites)
        const mockCelebs = document.createElement('div');
        mockCelebs.className = 'node';
        mockCelebs.dataset.smgOrigCategory = 'Social Media';
        mockCelebs.innerHTML = '<div class="node-body"><div class="node-title"><a href="/f/celebrities">Celebrities</a></div></div>';
        assert(classifyHomeNode(mockCelebs) === 'categories', 'Celebrities deve ir para categories');

        const mockPorn = document.createElement('div');
        mockPorn.className = 'node';
        mockPorn.dataset.smgOrigCategory = 'Adult Sites';
        mockPorn.innerHTML = '<div class="node-body"><div class="node-title"><a href="/f/xxx-porn">XXX / Porn</a></div></div>';
        assert(classifyHomeNode(mockPorn) === 'categories', 'XXX / Porn deve ir para categories');

        // 6. Remover container "Brasileiras | Brazilian Girls"
        const mockBrContainer = document.createElement('div');
        mockBrContainer.className = 'node';
        mockBrContainer.innerHTML = '<div class="node-body"><div class="node-title"><a href="/f/br-girls">Brasileiras | Brazilian Girls</a></div></div>';
        assert(classifyHomeNode(mockBrContainer) === null, 'Container Brasileiras | Brazilian Girls deve ser removido (retorna null)');

        // 7. Categories normais e 10 principais
        const mockCosplay = document.createElement('div');
        mockCosplay.className = 'node';
        mockCosplay.dataset.smgOrigCategory = 'Specialised Interests';
        mockCosplay.innerHTML = '<div class="node-body"><div class="node-title"><a href="/f/cosplay">Cosplay</a></div></div>';
        assert(classifyHomeNode(mockCosplay) === 'categories', 'Cosplay deve ser classificado como categories');

        const mockAnimatedGeneral = document.createElement('div');
        mockAnimatedGeneral.className = 'node';
        mockAnimatedGeneral.dataset.smgOrigCategory = 'Specialised Interests';
        mockAnimatedGeneral.innerHTML = '<div class="node-body"><div class="node-title"><a href="/f/animated">Animated</a></div></div>';
        assert(classifyHomeNode(mockAnimatedGeneral) === 'categories', 'Animated geral deve ser classificado como categories');
        assert(mockAnimatedGeneral.querySelector('.node-title a').textContent === 'Animated', 'Animated geral deve manter o título');

        const mock3D = document.createElement('div');
        mock3D.className = 'node';
        mock3D.innerHTML = '<div class="node-body"><div class="node-title"><a href="/f/3d">3D</a></div></div>';
        assert(classifyHomeNode(mock3D) === 'categories', '3D deve ir para categories');

        const mockHentai = document.createElement('div');
        mockHentai.className = 'node';
        mockHentai.innerHTML = '<div class="node-body"><div class="node-title"><a href="/f/hentai">Hentai</a></div></div>';
        assert(classifyHomeNode(mockHentai) === 'categories', 'Hentai deve ir para categories');

        const mockTransgender = document.createElement('div');
        mockTransgender.className = 'node';
        mockTransgender.innerHTML = '<div class="node-body"><div class="node-title"><a href="/f/transgender">Transgender</a></div></div>';
        assert(classifyHomeNode(mockTransgender) === 'categories', 'Transgender geral deve ir para categories');

        // 8. Brasil - detecção e renomeação
        const mockAnimatedBr = document.createElement('div');
        mockAnimatedBr.className = 'node smg-subcard';
        mockAnimatedBr.dataset.smgParentTitle = 'Brasileiras';
        mockAnimatedBr.innerHTML = '<div class="node-body"><div class="node-title"><a href="/f/animated-br">Animated</a></div></div>';
        assert(classifyHomeNode(mockAnimatedBr) === 'categories', 'Subfórum Animated do Brasil deve ir para categories');
        assert(mockAnimatedBr.querySelector('.node-title a').textContent === 'Brasil - Animated', 'Subfórum Animated do Brasil deve ser renomeado para Brasil - Animated');

        const mockTransBr = document.createElement('div');
        mockTransBr.className = 'node smg-subcard';
        mockTransBr.dataset.smgParentTitle = 'Brasileiras';
        mockTransBr.innerHTML = '<div class="node-body"><div class="node-title"><a href="/f/trans-br">Trans</a></div></div>';
        assert(classifyHomeNode(mockTransBr) === 'categories', 'Subfórum Trans do Brasil deve ir para categories');
        assert(mockTransBr.querySelector('.node-title a').textContent === 'Brasil - Trans', 'Subfórum Trans do Brasil deve ser renomeado para Brasil - Trans');

        const mockBrOnlyFans = document.createElement('div');
        mockBrOnlyFans.className = 'node smg-subcard';
        mockBrOnlyFans.dataset.smgParentTitle = 'Brasileiras';
        mockBrOnlyFans.innerHTML = '<div class="node-body"><div class="node-title"><a href="/f/br-onlyfans">OnlyFans</a></div></div>';
        assert(classifyHomeNode(mockBrOnlyFans) === 'categories', 'Subfórum OnlyFans do Brasil deve ir para categories');
        assert(mockBrOnlyFans.querySelector('.node-title a').textContent === 'Brasil - OnlyFans', 'Subfórum OnlyFans do Brasil deve ser renomeado para Brasil - OnlyFans');

        const mockBrPatreon = document.createElement('div');
        mockBrPatreon.className = 'node smg-subcard';
        mockBrPatreon.dataset.smgParentTitle = 'Brasileiras';
        mockBrPatreon.innerHTML = '<div class="node-body"><div class="node-title"><a href="/f/br-patreon">Patreon</a></div></div>';
        assert(classifyHomeNode(mockBrPatreon) === 'categories', 'Subfórum Patreon do Brasil deve ir para categories');
        assert(mockBrPatreon.querySelector('.node-title a').textContent === 'Brasil - Patreon', 'Subfórum Patreon do Brasil deve ser renomeado para Brasil - Patreon');

        // Testar ordem das categorias principais (incluindo Adult Productions, Amateur, Anime & Hentai, Celebrities, Foot Fetish, Male e XXX / Porn)
        assert(getMainCategoryOrder('3D') === 0, '3D deve ser prioridade 0');
        assert(getMainCategoryOrder('Animated') === 1, 'Animated deve ser prioridade 1');
        assert(getMainCategoryOrder('Adult Comics & Animations') === 1, 'Adult Comics deve ser prioridade 1');
        assert(getMainCategoryOrder('Adult Productions') === 2, 'Adult Productions deve ser prioridade 2');
        assert(getMainCategoryOrder('Amateur') === 3, 'Amateur deve ser prioridade 3');
        assert(getMainCategoryOrder('Anime & Hentai') === 4, 'Anime & Hentai deve ser prioridade 4');
        assert(getMainCategoryOrder('Asians') === 5, 'Asians deve ser prioridade 5');
        assert(getMainCategoryOrder('ASMR') === 6, 'ASMR deve ser prioridade 6');
        assert(getMainCategoryOrder('Cam Girls') === 7, 'Cam Girls deve ser prioridade 7');
        assert(getMainCategoryOrder('Celebrities') === 8, 'Celebrities deve ser prioridade 8');
        assert(getMainCategoryOrder('Foot Fetish') === 9, 'Foot Fetish deve ser prioridade 9');
        assert(getMainCategoryOrder('Hotwives') === 10, 'Hotwives deve ser prioridade 10');
        assert(getMainCategoryOrder('Male/Gay') === 11, 'Male/Gay deve ser prioridade 11');
        assert(getMainCategoryOrder('Transgender') === 12, 'Transgender deve ser prioridade 12');
        assert(getMainCategoryOrder('VTubers') === 13, 'VTubers deve ser prioridade 13');
        assert(getMainCategoryOrder('XXX / Porn') === 14, 'XXX / Porn deve ser prioridade 14');
        assert(getMainCategoryOrder('Cosplay') === 999, 'Cosplay não é prioridade principal (999)');
        assert(getMainCategoryOrder('Brasil - Animated') === 999, 'Brasil - Animated não é prioridade principal (999)');
        assert(getMainCategoryOrder('Brasil - OnlyFans') === 999, 'Brasil - OnlyFans não é prioridade principal (999)');

        // Testar ordem dos sites principais
        const { getMainSiteOrder } = window.__homeExports;
        assert(getMainSiteOrder('CameraPrive') === 0, 'CameraPrive deve ser prioridade 0 de sites');
        assert(getMainSiteOrder('CamWhores.tv') === 1, 'CamWhores deve ser prioridade 1 de sites');
        assert(getMainSiteOrder('Facecast') === 2, 'Facecast deve ser prioridade 2 de sites');
        assert(getMainSiteOrder('Instagram Models') === 3, 'Instagram deve ser prioridade 3 de sites');
        assert(getMainSiteOrder('Onlyfans') === 4, 'OnlyFans deve ser prioridade 4 de sites');
        assert(getMainSiteOrder('Patreon') === 5, 'Patreon deve ser prioridade 5 de sites');
        assert(getMainSiteOrder('Privacy') === 6, 'Privacy deve ser prioridade 6 de sites');
        assert(getMainSiteOrder('Reddit') === 7, 'Reddit deve ser prioridade 7 de sites');
        assert(getMainSiteOrder('Snapchat') === 8, 'Snapchat deve ser prioridade 8 de sites');
        assert(getMainSiteOrder('TikTok') === 9, 'TikTok deve ser prioridade 9 de sites');
        assert(getMainSiteOrder('Twitter Nudes') === 10, 'Twitter deve ser prioridade 10 de sites');
        assert(getMainSiteOrder('Twitch Streamers') === 11, 'Twitch deve ser prioridade 11 de sites');
        assert(getMainSiteOrder('Youtubers') === 12, 'YouTube deve ser prioridade 12 de sites');
        assert(getMainSiteOrder('Barista') === 999, 'Barista deve ser 999 (mais sites)');
        assert(getMainSiteOrder('MemberMe') === 999, 'MemberMe deve ser 999 (mais sites)');

        // Testar organizeHomeHub
        assert(typeof organizeHomeHub === 'function', 'organizeHomeHub deve ser função');
        const container = document.createElement('div');
        container.className = 'p-body-content';
        container.innerHTML = `
            <div class="block block--category">
                <h2 class="block-header"><span class="uix_categoryTitle">Social Media</span></h2>
                <div class="block-container"><div class="block-body"></div></div>
            </div>
            <div class="block block--category">
                <h2 class="block-header"><span class="uix_categoryTitle">Community</span></h2>
                <div class="block-container"><div class="block-body"></div></div>
            </div>
            <div class="block block--category">
                <h2 class="block-header"><span class="uix_categoryTitle">Specialised Interests</span></h2>
                <div class="block-container"><div class="block-body"></div></div>
            </div>
        `;
        const bodies = container.querySelectorAll('.block-body');
        bodies[0].appendChild(mockOnlyFans);
        bodies[0].appendChild(mockSiteNode);
        bodies[0].appendChild(mockCelebs);
        bodies[0].appendChild(mockPorn);
        bodies[0].appendChild(mockBrContainer);
        bodies[1].appendChild(mockLounge);
        bodies[1].appendChild(mockRules);
        bodies[1].appendChild(mockWorkflows);
        bodies[1].appendChild(mockGuides);
        bodies[1].appendChild(mockRequests);
        bodies[1].appendChild(mockMegathreads);
        bodies[1].appendChild(mockGeneralDisc);
        bodies[1].appendChild(mockTransReviews);
        bodies[2].appendChild(mockAnimatedBr);
        bodies[2].appendChild(mockTransBr);
        bodies[2].appendChild(mockBrOnlyFans);
        bodies[2].appendChild(mockBrPatreon);
        bodies[2].appendChild(mockCosplay);
        bodies[2].appendChild(mockAnimatedGeneral);
        bodies[2].appendChild(mock3D);
        bodies[2].appendChild(mockHentai);
        bodies[2].appendChild(mockTransgender);

        document.body.appendChild(container);
        document.documentElement.classList.add('smg-home');

        organizeHomeHub([container]);

        const hubSections = container.querySelectorAll('.block--category[data-smg-home-hub]');
        assert(hubSections.length === 5, `organizeHomeHub deve consolidar exatamente em 5 seções (obtido: ${hubSections.length})`);
        assert(container.querySelector('[data-smg-home-hub="sites"]') !== null, 'Deve existir seção Sites');
        assert(container.querySelector('[data-smg-home-hub="categories"]') !== null, 'Deve existir seção Categories');
        assert(container.querySelector('[data-smg-home-hub="discussions"]') !== null, 'Deve existir seção Discussions');
        assert(container.querySelector('[data-smg-home-hub="requests"]') !== null, 'Deve existir seção Requests');
        assert(container.querySelector('[data-smg-home-hub="nav"]') !== null, 'Deve existir seção Site Navigation');

        // Divisor visual de categorias
        const catDivider = container.querySelector('[data-smg-home-hub="categories"] .smg-hub-category-divider');
        assert(catDivider !== null, 'Deve existir divisor entre categorias principais e outras categorias');

        // Verificar ordenação em Sites
        const sitesList = Array.from(container.querySelectorAll('[data-smg-home-hub="sites"] .node-title a')).map(a => a.textContent.trim());
        assert(sitesList[0] === 'Instagram' && sitesList[1] === 'OnlyFans', 'Sites devem conter Instagram e OnlyFans em ordem alfabética');
        assert(!sitesList.includes('Celebrities') && !sitesList.includes('XXX / Porn'), 'Sites NÃO deve conter Celebrities nem XXX / Porn');

        // Verificar ordenação em Categories
        const catList = Array.from(container.querySelectorAll('[data-smg-home-hub="categories"] .node-title a')).map(a => a.textContent.trim());
        assert(catList.indexOf('3D') === 0, '3D deve ser a primeira categoria');
        assert(catList.indexOf('Animated') === 1, 'Animated deve vir em segundo');
        assert(catList.indexOf('Hentai') === 2, 'Hentai deve vir em terceiro entre os presentes');
        assert(catList.indexOf('Celebrities') === 3, 'Celebrities deve vir em quarto entre os presentes');
        assert(catList.indexOf('Transgender') === 4, 'Transgender deve vir em quinto entre os presentes');
        assert(catList.indexOf('XXX / Porn') === 5, 'XXX / Porn deve ser a 6ª categoria principal entre os presentes');
        assert(catList.indexOf('Brasil - Animated') > catList.indexOf('XXX / Porn'), 'Brasil - Animated deve vir após as categorias principais');
        assert(catList.indexOf('Brasil - OnlyFans') > catList.indexOf('XXX / Porn'), 'Brasil - OnlyFans deve vir após o divisor');
        assert(catList.indexOf('Brasil - Patreon') > catList.indexOf('XXX / Porn'), 'Brasil - Patreon deve vir após o divisor');
        assert(!catList.some(t => t.includes('Brasileiras | Brazilian Girls')), 'Brasileiras | Brazilian Girls deve ter sido removido');

        // Verificar Discussions
        const discList = Array.from(container.querySelectorAll('[data-smg-home-hub="discussions"] .node-title a')).map(a => a.textContent.trim());
        assert(discList.includes('General Discussion') && discList.includes('Megathreads') && discList.includes('Trans Reviews'), 'Discussions deve conter General Discussion, Megathreads e Trans Reviews');

        // Verificar Requests
        const reqList = Array.from(container.querySelectorAll('[data-smg-home-hub="requests"] .node-title a')).map(a => a.textContent.trim());
        assert(reqList.includes('Requests'), 'Requests deve conter Requests');

        // Verificar Nav
        const navList = Array.from(container.querySelectorAll('[data-smg-home-hub="nav"] .node-title a')).map(a => a.textContent.trim());
        assert(navList.includes('Workflows') && navList.includes('Guides + Discussion'), 'Nav deve conter Workflows e Guides + Discussion');

        // Testar enhanceHomeHubSections no Hub
        enhanceHomeHubSections();
        const sitesBadge = container.querySelector('[data-smg-home-hub="sites"] .smg-hub-badge');
        assert(sitesBadge !== null && sitesBadge.textContent.includes('2'), 'Badge de Sites deve exibir 2 fóruns');

        const catBadge = container.querySelector('[data-smg-home-hub="categories"] .smg-hub-badge');
        assert(catBadge !== null && catBadge.textContent.includes('11'), `Badge de Categories deve exibir 11 fóruns (obtido: ${catBadge ? catBadge.textContent : 'null'})`);

        // Testar estabilidade do homeLayoutSignature
        const sig1 = homeLayoutSignature();
        const sig2 = homeLayoutSignature();
        assert(sig1 === sig2, 'homeLayoutSignature deve ser 100% estável nas seções consolidadas');

        container.remove();
        document.documentElement.classList.remove('smg-home');
    }

    // =========================================================================
    // TESTE 68: Refinamentos de Listagem, Sticky Links, Placeholders e Subtopbar
    // =========================================================================
    console.log('--- TESTE 68: Refinamentos de Listagem, Sticky Links, Placeholders e Subtopbar ---');
    {
        const { classifyHomeNode } = window.__homeExports;
        const { markThreadGridContainer, markGridPlaceholders } = window;
        // 1. Roteamento de Bate-papo / Tutoriais / Ajuda do Brasil para Discussions
        const mockHelpNode = document.createElement('div');
        mockHelpNode.className = 'node';
        mockHelpNode.dataset.smgOrigCategory = 'Brasil';
        mockHelpNode.innerHTML = '<div class="node-body"><div class="node-title"><a href="/forums/bate-papo-tutoriais-ajuda.39/">Bate-papo | Tutoriais | Ajuda</a></div></div>';
        assert(classifyHomeNode(mockHelpNode) === 'discussions', 'Brasil - Bate-papo | Tutoriais | Ajuda deve ser classificado como discussions');

        // 2. markThreadGridContainer: .structItemContainer-group--sticky deve virar smg-sticky-compact-list
        document.documentElement.classList.add('smg-threadlist');
        const listWrapper = document.createElement('div');
        listWrapper.innerHTML = `
            <div class="structItemContainer-group structItemContainer-group--sticky smg-tl-grid">
                <div class="structItem structItem--thread">
                    <div class="structItem-cell structItem-cell--main">
                        <div class="structItem-title"><a href="/threads/sticky-1" data-xf-init="preview-tooltip" data-preview-url="/threads/sticky-1/preview">Sticky Thread</a></div>
                    </div>
                </div>
            </div>
            <div class="structItemContainer-group js-threadList">
                <div class="structItem structItem--thread">
                    <div class="structItem-cell structItem-cell--main">
                        <div class="structItem-title"><a href="/threads/normal-1" data-xf-init="preview-tooltip" data-preview-url="/threads/normal-1/preview">Normal Thread</a></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(listWrapper);

        markThreadGridContainer([listWrapper]);

        const stickyGroupEl = listWrapper.querySelector('.structItemContainer-group--sticky');
        const normalGroupEl = listWrapper.querySelector('.js-threadList');
        assert(stickyGroupEl.classList.contains('smg-sticky-compact-list'), 'Grupo sticky deve receber smg-sticky-compact-list');
        assert(!stickyGroupEl.classList.contains('smg-tl-grid'), 'Grupo sticky deve ter smg-tl-grid removido');
        assert(normalGroupEl.classList.contains('smg-tl-grid'), 'Grupo normal de threads deve receber smg-tl-grid');

        // Validar remoção de preview tooltip nativo nos links de título
        const stickyLink = stickyGroupEl.querySelector('.structItem-title a');
        assert(!stickyLink.hasAttribute('data-xf-init'), 'Link não deve possuir atributo data-xf-init');
        assert(!stickyLink.hasAttribute('data-preview-url'), 'Link não deve possuir atributo data-preview-url');

        // 3. markGridPlaceholders: SimpCity no_image.jpg deve ser interceptado e receber nosso placeholder
        const noImageItem = document.createElement('div');
        noImageItem.className = 'structItem structItem--thread';
        noImageItem.innerHTML = `
            <div class="structItem-cell structItem-cell--icon">
                <a class="avatar dcThumbnail">
                    <img style="background-image: url(https://simpcity.cr/data/assets/defaultThumbnailImage/no_image.jpg);">
                </a>
            </div>
        `;
        listWrapper.appendChild(noImageItem);

        markGridPlaceholders([listWrapper]);

        assert(noImageItem.classList.contains('smg-no-thumb'), 'Thread com no_image.jpg do SimpCity deve receber classe smg-no-thumb');
        const phEl = noImageItem.querySelector('.smg-thumb-ph');
        assert(phEl !== null, 'Thread sem foto real deve receber elemento .smg-thumb-ph');
        assert(phEl.innerHTML.includes('smg-ph-ico'), 'Placeholder customizado deve conter ícone SVG');

        // 4. Validação das regras de CSS
        assert(allStyles.includes('.smg-sticky-compact-list'), 'CSS deve conter estilos para .smg-sticky-compact-list');
        assert(allStyles.includes('html.smg-threadlist.smg-tv-grid .smg-tl-grid') && allStyles.includes('align-items: stretch !important;'), 'Grid de tópicos deve esticar cards uniformemente (align-items: stretch)');
        assert(allStyles.includes('min-height: 2.6em !important;') && allStyles.includes('-webkit-line-clamp: 2 !important;'), 'Títulos na grade devem reservar 2 linhas uniformes (min-height: 2.6em)');
        assert(allStyles.includes('margin-top: auto !important;') && allStyles.includes('padding-top: var(--smg-sp-8) !important;'), 'Datas no card devem colar na base uniformemente (margin-top: auto)');
        assert(allStyles.includes('clip-path: inset(0 -100vmax 0) !important;'), 'Subtopbar fixa deve cortar borda exatamente no limite (clip-path: inset(0 -100vmax 0))');
        assert(allStyles.includes('iframe[src*="turbo.cr"]::before') && allStyles.includes('display: none !important;'), 'Shimmer/loading deve ser suprimido em iframes do turbo.cr');
        assert(allStyles.includes('.tooltip--preview { display: none !important; }'), 'Tooltip nativo de preview deve ser ocultado no CSS');
        assert(allStyles.includes('.smg-home-section-sites .node-extra'), 'CSS deve estilizar .node-extra da seção Sites');

        // 5. Validação de markup de skeleton
        const homeSkel = paintSkeletonMarkup(PAINT_PAGE_KINDS.HOME);
        assert(homeSkel.includes('smg-home-skeleton-card-badges'), 'Home skeleton deve conter badges nos cards do feed');
        assert(homeSkel.includes('smg-home-skeleton-list'), 'Home skeleton deve conter seções de lista');
        assert(homeSkel.includes('smg-home-skeleton-row'), 'Home skeleton deve conter linhas de lista .smg-home-skeleton-row');

        listWrapper.remove();
        document.documentElement.classList.remove('smg-threadlist');
    }

    // =========================================================================
    // TESTE 69: Validação da Página Inicial e Cores do SocialMediaGirls (SMG)
    // =========================================================================
    console.log('--- TESTE 69: Validação da Página Inicial e Cores do SocialMediaGirls (SMG) ---');
    {
        const { classifyHomeNode } = window.__homeExports;

        // 1. Cores e tokens do SMG
        assert(allStyles.includes('html.smg-smg { --smg-link: hsl(var(--xf-linkColor--h, 334), 85%, 68%);'), 'SMG deve definir --smg-link com rosa institucional (#ff3d84 / 334deg)');
        assert(allStyles.includes('.node-title .uix_newIndicator'), 'CSS da home deve estilizar .uix_newIndicator');
        assert(allStyles.includes('.node-extra-title .prefix'), 'CSS da home deve estilizar .prefix nos últimos tópicos');
        assert(!allStyles.includes('html.smg-smg.smg-home .block--category .block-body > .node:hover'), 'Hover dos cards da home no SMG deve usar a mesma cor do Simp');
        assert(allStyles.includes('html.smg-home .block--category .node:hover'), 'CSS da home deve ter hover neutro compartilhado');
        assert(allStyles.includes('html.smg-smg.smg-home .smg-hub-badge'), 'CSS da home deve ter badges de contagem com rosa no SMG');

        // 2. Remoção de wrappers no SMG (Video Sharing & Streaming Apps e More Social Media Sites)
        const mockVideoWrapper = document.createElement('div');
        mockVideoWrapper.className = 'node';
        mockVideoWrapper.innerHTML = '<div class="node-body"><div class="node-title"><a href="/forums/video-sharing-streaming-apps.78/">Video Sharing & Streaming Apps</a></div></div>';
        document.body.appendChild(mockVideoWrapper);
        assert(classifyHomeNode(mockVideoWrapper) === null, 'Video Sharing & Streaming Apps deve ser removido (retorna null)');
        assert(!document.body.contains(mockVideoWrapper), 'Video Sharing & Streaming Apps deve ter sido removido do DOM');

        const mockMoreSocialWrapper = document.createElement('div');
        mockMoreSocialWrapper.className = 'node';
        mockMoreSocialWrapper.innerHTML = '<div class="node-body"><div class="node-title"><a href="/forums/more-social-media-sites.153/">More Social Media Sites</a></div></div>';
        document.body.appendChild(mockMoreSocialWrapper);
        assert(classifyHomeNode(mockMoreSocialWrapper) === null, 'More Social Media Sites deve ser removido (retorna null)');
        assert(!document.body.contains(mockMoreSocialWrapper), 'More Social Media Sites deve ter sido removido do DOM');

        // 3. Fallback de ícones quebrados na home (ensureHomeNodeIcons)
        const { ensureHomeNodeIcons } = window.__homeExports;
        document.documentElement.classList.add('smg-home');
        const testIconCat = document.createElement('div');
        testIconCat.className = 'block block--category';
        testIconCat.innerHTML = `
            <div class="block-body">
                <div class="node" id="test-broken-img">
                    <div class="node-body">
                        <span class="node-icon"><img src="/invalid-404-icon.png"></span>
                        <div class="node-title"><a href="/f/1">Broken Img Node</a></div>
                    </div>
                </div>
                <div class="node" id="test-empty-i">
                    <div class="node-body">
                        <span class="node-icon"><i class="far fa-comments"></i></span>
                        <div class="node-title"><a href="/f/2">Empty I Node</a></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(testIconCat);
        ensureHomeNodeIcons();
        // Disparar erro na imagem quebrada
        const brokenImg = testIconCat.querySelector('#test-broken-img img');
        brokenImg.dispatchEvent(new dom.window.Event('error'));
        assert(testIconCat.querySelector('#test-broken-img .node-icon svg') !== null, 'Imagem com erro deve ter fallback substituído por SVG');
        assert(testIconCat.querySelector('#test-empty-i .node-icon svg') !== null, 'Nó com ícone sem imagem nem SVG deve receber SVG genérico');
        testIconCat.remove();
        document.documentElement.classList.remove('smg-home');

        // 4. Classificação de Sites do SMG (plataformas reais)
        const checkSite = (title, href) => {
            const el = document.createElement('div');
            el.className = 'node';
            el.dataset.smgOrigCategory = 'Social Media';
            el.innerHTML = `<div class="node-body"><div class="node-title"><a href="${href}">${title}</a></div></div>`;
            assert(classifyHomeNode(el) === 'sites', `${title} (${href}) deve ser classificado como 'sites'`);
        };

        checkSite('TikTok', '/forums/tiktok.51/');
        checkSite('Live.me', '/forums/live-me.53/');
        checkSite('YouNow', '/forums/younow.54/');
        checkSite('Facecast', '/forums/facecast.66/');
        checkSite('Peeks', '/forums/peeks.69/');
        checkSite('CrazyCash/ViewHub/Dreamdares', '/forums/crazycash-viewhub-dreamdares.109/');
        checkSite('Omegle', '/forums/omegle.112/');
        checkSite('Reddit', '/forums/reddit.72/');
        checkSite('Barista', '/forums/barista.49/');
        checkSite('Twitter Nudes', '/forums/twitter-nudes.56/');
        checkSite('Tumblr', '/tumblr/');
        checkSite('Onlyfans', '/forums/onlyfans.138/');
        checkSite('MemberMe', '/memberme/');
        checkSite('DeviantArt', '/forums/deviantart.154/');
        checkSite('CamWhores.tv', '/forums/camwhores-tv.156/');
        checkSite('CameraPrive', '/forums/cameraprive.106/');
        checkSite('Privacy', '/forums/privacy.127/');
        checkSite('Swame', '/forums/swame.114/');

        // 4. Classificação de Categorias do SMG (conteúdo/nichos)
        const checkCat = (title, href) => {
            const el = document.createElement('div');
            el.className = 'node';
            el.dataset.smgOrigCategory = 'More Categories';
            el.innerHTML = `<div class="node-body"><div class="node-title"><a href="${href}">${title}</a></div></div>`;
            assert(classifyHomeNode(el) === 'categories', `${title} (${href}) deve ser classificado como 'categories'`);
        };

        checkCat('Celebrities', '/forums/celebrities.20/');
        checkCat('Foot Fetish', '/forums/foot-fetish.73/');
        checkCat('Transgender / Non-Binary', '/forums/transgender-non-binary.76/');
        checkCat('Male/Gay', '/forums/male-gay.157/');
        checkCat('Adult Comics & Animations', '/adult-comics-animations/');
        checkCat('Anime & Hentai', '/forums/anime-hentai.121/');
        checkCat('Online Marketplaces', '/forums/online-marketplaces.90/');
        checkCat('ASMR', '/forums/asmr.75/');
        checkCat('Brazilian/Portuguese', '/forums/brazilian-portuguese.135/');

        // 5. Classificação de Discussions do SMG
        const checkDisc = (title, href, origCat) => {
            const el = document.createElement('div');
            el.className = 'node';
            el.dataset.smgOrigCategory = origCat || 'Discussion';
            el.innerHTML = `<div class="node-body"><div class="node-title"><a href="${href}">${title}</a></div></div>`;
            assert(classifyHomeNode(el) === 'discussions', `${title} (${href}) deve ser classificado como 'discussions'`);
        };

        checkDisc('Megathreads', '/forums/megathreads.155/', 'More Categories');
        checkDisc('Model Reviews', '/forums/model-reviews.159/', 'Discussion');
        checkDisc('Off Topic', '/off-topic/', 'Discussion');
        checkDisc('Premium Link Downloads', '/forums/premium-link-downloads.33/', 'Discussion');

        // 6. Classificação de Nav do SMG
        const checkNav = (title, href, origCat) => {
            const el = document.createElement('div');
            el.className = 'node';
            el.dataset.smgOrigCategory = origCat || 'Announcements';
            el.innerHTML = `<div class="node-body"><div class="node-title"><a href="${href}">${title}</a></div></div>`;
            assert(classifyHomeNode(el) === 'nav', `${title} (${href}) deve ser classificado como 'nav'`);
        };

        checkNav('Forum Guides & Updates', '/forums/forum-guides-updates.13/', 'Announcements');
        checkNav('Self Promotion', '/forums/self-promotion.50/', 'Self Promotion');
    }


    // =========================================================================
    // TESTE FEED GATE: só thread SEGUIDA entra no feed (ingest da thread aberta)
    // =========================================================================
    console.log('--- TESTE FEED GATE: ingest da thread aberta só quando seguida ---');
    {
        const fgx = window.__feedSyncExports || {};
        assert(typeof fgx.ingestCurrentThreadPageIfFollowed === 'function', 'ingestCurrentThreadPageIfFollowed deve estar exposta em __feedSyncExports');
        const fgOrigUrl = window.location.href;
        const fgCanon = document.querySelector('link[rel="canonical"]');
        const fgCanonHref = fgCanon ? fgCanon.getAttribute('href') : null;
        const fgWatch = document.querySelector('.buttonGroup a[data-sk-watch][data-sk-unwatch]');
        const fgWatchParent = fgWatch ? fgWatch.parentNode : null;
        const fgWatchNext = fgWatch ? fgWatch.nextSibling : null;
        if (fgWatch) fgWatch.remove();
        const fgSetPage = path => {
            window.history.pushState({}, '', path);
            let c = document.querySelector('link[rel="canonical"]');
            if (!c) { c = document.createElement('link'); c.rel = 'canonical'; document.head.appendChild(c); }
            c.setAttribute('href', 'https://forums.socialmediagirls.com' + path);
        };
        const fgPost = document.createElement('article');
        fgPost.className = 'message message--post';
        fgPost.id = 'js-post-7770001';
        fgPost.setAttribute('data-content', 'post-7770001');
        fgPost.setAttribute('data-author', 'FeedGate');
        fgPost.innerHTML = '<div class="message-inner"><div class="message-cell message-cell--main">'
            + '<header class="message-attribution"><a href="/threads/x/post-7770001"><time data-timestamp="1700000500">now</time></a></header>'
            + '<div class="message-userContent"><div class="bbWrapper">Feed gate content</div></div></div></div>';
        document.body.appendChild(fgPost);

        // 1. thread NÃO seguida: nenhuma varredura de posts (assinatura) e nada escrito no banco do feed
        const fgUnfollowed = '/threads/feedgate-unfollowed.7770/';
        mockStorage.followed.delete(fgUnfollowed);
        fgSetPage(fgUnfollowed);
        const fgTimelineBefore = new Set(mockStorage.timeline.keys());
        const fgFollowedBefore = new Set(mockStorage.followed.keys());
        const fgOrigQsa = document.querySelectorAll;
        let fgPostScans = 0;
        document.querySelectorAll = function (sel) {
            if (typeof sel === 'string' && sel.includes('message--post')) fgPostScans++;
            return fgOrigQsa.call(this, sel);
        };
        let fgR1;
        try { fgR1 = await fgx.ingestCurrentThreadPageIfFollowed(); } finally { document.querySelectorAll = fgOrigQsa; }
        assert(fgR1 === 0, `Thread não seguida não deve ingerir posts (obtido: ${fgR1})`);
        assert(fgPostScans === 0, `Thread não seguida não deve varrer os posts pra assinatura (varreduras: ${fgPostScans})`);
        assert([...mockStorage.timeline.keys()].every(k => fgTimelineBefore.has(k)), 'Thread não seguida não deve escrever posts no feed');
        assert([...mockStorage.followed.keys()].every(k => fgFollowedBefore.has(k)) && !mockStorage.followed.has(fgUnfollowed), 'Thread não seguida não deve ser gravada em followed');

        // 2. thread seguida: continua ingerindo os posts da página aberta
        const fgFollowed = '/threads/feedgate-followed.7771/';
        mockStorage.followed.set(fgFollowed, { path: fgFollowed, thread_name: 'Feed Gate', saved_pages: [], last_page: 1, updated_at: 0 });
        fgSetPage(fgFollowed);
        const fgR2 = await fgx.ingestCurrentThreadPageIfFollowed();
        assert(fgR2 > 0, `Thread seguida deve ingerir os posts da página (obtido: ${fgR2})`);
        const fgStored = mockStorage.timeline.get('7770001');
        assert(!!fgStored && fgStored.thread_path === fgFollowed, 'Post da thread seguida deve ir pro feed com o path da thread');

        // limpeza
        fgPost.remove();
        mockStorage.timeline.delete('7770001');
        mockStorage.followed.delete(fgFollowed);
        if (fgWatch && fgWatchParent) fgWatchParent.insertBefore(fgWatch, fgWatchNext);
        const fgC = document.querySelector('link[rel="canonical"]');
        if (fgCanonHref === null) { if (fgC) fgC.remove(); } else if (fgC) fgC.setAttribute('href', fgCanonHref);
        window.history.pushState({}, '', fgOrigUrl);
    }

    // =========================================================================
    // TESTE FEED CRON: só a aba visível roda, e só uma aba por intervalo
    // =========================================================================
    console.log('--- TESTE FEED CRON: aba visível e uma aba por vez ---');
    {
        const cx = window.__feedSyncExports || {};
        assert(typeof cx.cronTick === 'function', 'cronTick deve estar exposto em __feedSyncExports');
        const CRON_KEY = 'smg-feed-cron-last-run';
        const hiddenDesc = Object.getOwnPropertyDescriptor(document, 'hidden');
        const setHidden = v => Object.defineProperty(document, 'hidden', { configurable: true, get: () => v });
        let cronRuns = 0;
        const onDone = () => { cronRuns++; };
        window.addEventListener('smg-timeline-sync-done', onDone);
        const clearCronTimer = () => {
            if (cx.timelineCronTimer) { clearTimeout(cx.timelineCronTimer); cx.timelineCronTimer = null; }
        };
        cx.isCronRunning = false;
        cx.timelineSyncRunning = false;

        // 1. aba escondida: não sincroniza
        setHidden(true);
        window.GM_setValue(CRON_KEY, '0');
        await cx.cronTick();
        await new Promise(r => setTimeout(r, 30));
        assert(cronRuns === 0, `Aba escondida não deve rodar o cron do feed (rodou ${cronRuns}x)`);
        assert(window.GM_getValue(CRON_KEY) === '0', 'Aba escondida não deve marcar a última execução compartilhada');
        clearCronTimer();

        // 2. aba visível, mas outra aba rodou há pouco: não sincroniza
        setHidden(false);
        window.GM_setValue(CRON_KEY, String(Date.now() - 1000));
        await cx.cronTick();
        await new Promise(r => setTimeout(r, 30));
        assert(cronRuns === 0, `Aba visível deve pular o cron quando outra aba rodou há pouco (rodou ${cronRuns}x)`);
        clearCronTimer();

        // 3. aba visível e última execução antiga: sincroniza e marca o timestamp compartilhado
        const before = Date.now();
        window.GM_setValue(CRON_KEY, String(before - 60 * 60 * 1000));
        await cx.cronTick();
        await new Promise(r => setTimeout(r, 30));
        assert(cronRuns >= 1, `Aba visível com execução antiga deve rodar o cron (rodou ${cronRuns}x)`);   // syncTimeline e o cron emitem o evento
        assert((parseInt(window.GM_getValue(CRON_KEY), 10) || 0) >= before, 'Cron deve gravar a última execução compartilhada entre abas');
        clearCronTimer();

        window.removeEventListener('smg-timeline-sync-done', onDone);
        if (hiddenDesc) Object.defineProperty(document, 'hidden', hiddenDesc);
        else delete document.hidden;
        cx.isCronRunning = false;
    }

    // =========================================================================
    // TESTE SPOILERS: configuração "Auto-expand spoilers"
    // =========================================================================
    console.log('--- TESTE SPOILERS: configuração de abrir spoilers automaticamente ---');
    {
        const { FEATURES: spFeat, SETTINGS_META: spMeta } = window.__configExports || {};
        const spExpand = window.__autoExpandSpoilers;
        assert(!!spFeat && Array.isArray(spMeta), '__configExports deve expor FEATURES e SETTINGS_META');
        const threadSection = spMeta.find(s => s.section === 'Thread & reading');
        const spItem = threadSection && threadSection.items.find(it => it.key === 'autoExpandSpoilers');
        assert(!!spItem, 'Seção Thread & reading deve conter a chave autoExpandSpoilers');
        assert(spItem && spItem.label === 'Auto-expand spoilers', `Label em inglês deve ser "Auto-expand spoilers" (obtido: ${spItem && spItem.label})`);
        assert(spItem && spItem.desc && spItem.desc.en && spItem.desc.pt, 'autoExpandSpoilers deve ter descrição em en e pt');
        assert(scriptContent.includes("'Auto-expand spoilers': 'Abrir spoilers automaticamente'"), 'Label em pt deve ser "Abrir spoilers automaticamente"');

        const makeSpoiler = () => {
            const box = document.createElement('div');
            box.className = 'bbCodeSpoiler';
            const btn = document.createElement('button');
            btn.className = 'bbCodeSpoiler-button';
            btn.textContent = 'Spoiler';
            const content = document.createElement('div');
            content.className = 'bbCodeSpoiler-content';
            content.style.display = 'none';
            btn.addEventListener('click', () => {   // o XF abre o spoiler no clique do botão
                box.classList.toggle('is-open');
                content.style.display = box.classList.contains('is-open') ? '' : 'none';
            });
            box.append(btn, content);
            document.body.appendChild(box);
            return { box, btn, content };
        };
        const spPrev = spFeat.autoExpandSpoilers;

        // ligado: o spoiler abre sozinho
        spFeat.autoExpandSpoilers = true;
        const on = makeSpoiler();
        spExpand([on.box]);
        assert(on.box.classList.contains('is-open') && on.content.style.display !== 'none', 'Com a opção ligada o spoiler deve abrir sozinho');

        // desligado: continua fechado, mas abre no clique
        spFeat.autoExpandSpoilers = false;
        const off = makeSpoiler();
        spExpand([off.box]);
        await new Promise(r => setTimeout(r, 250));
        assert(!off.box.classList.contains('is-open') && off.content.style.display === 'none', 'Com a opção desligada o spoiler deve continuar fechado');
        assert(off.btn.dataset.smgArrow === '1', 'Com a opção desligada o botão do spoiler ainda recebe a seta');
        off.btn.click();
        assert(off.box.classList.contains('is-open') && off.content.style.display !== 'none', 'Com a opção desligada o spoiler ainda abre no clique');

        spFeat.autoExpandSpoilers = spPrev;
        on.box.remove();
        off.box.remove();
    }

    // =========================================================================
    // SOFT-NAV: carrega o JS/CSS próprio da página de destino antes do XF.activate
    // (o editor Froala do quick reply só existe se o JS do editor estiver carregado)
    // =========================================================================
    {
        console.log('\n--- Soft-nav: assets da página de destino + XF.activate ---');
        const navHtml = `<!DOCTYPE html><html data-template="thread_view"><head><title>Dest</title>
<script>
        XF.ready(() =>
        {
            XF.extendObject(true, XF.config, {
                userId: 1,
                js: {"\/js\/xf\/message.min.js?_v=1":true,"\/js\/xf\/editor-compiled.js?_v=1":true},
                fullJs: false,
                css: {"public:message.less":true,"public:editor.less":true},
                cacheKey: 'x'
            });
        });
</script></head><body><div class="p-body"><div class="p-body-inner"><form class="js-quickReply" action="/threads/dest.77/add-reply">
<div class="message-editorWrapper"><textarea name="message_html" class="input js-editor" data-xf-init="editor"></textarea></div>
</form></div></div></body></html>`;
        const prevFetch = window.fetch;
        const prevXF = window.XF;
        const calls = { load: [], activate: [] };
        let pendingLoad = null;
        window.XF = {
            config: { csrf: '' },
            Loader: { load(js, css, cb) { calls.load.push({ js: Array.from(js || []), css: Array.from(css || []) }); pendingLoad = cb; } },
            activate(el) { calls.activate.push(el); }
        };
        window.fetch = () => Promise.resolve({ ok: true, status: 200, headers: { get: () => null }, text: () => Promise.resolve(navHtml) });
        window.smgSoftNavigate('/threads/dest.77/');
        await new Promise(r => setTimeout(r, 80));
        assert(calls.load.length === 1, `Soft-nav deve pedir ao XF.Loader os assets da página de destino (chamadas: ${calls.load.length})`);
        const ld = calls.load[0] || { js: [], css: [] };
        assert(ld.js.includes('/js/xf/editor-compiled.js?_v=1') && ld.js.includes('/js/xf/message.min.js?_v=1'), `Soft-nav deve carregar o JS declarado em XF.config.js do destino (obtido: ${JSON.stringify(ld.js)})`);
        assert(ld.css.includes('public:editor.less') && ld.css.includes('public:message.less'), `Soft-nav deve carregar o CSS declarado em XF.config.css do destino (obtido: ${JSON.stringify(ld.css)})`);
        assert(calls.activate.length === 0, 'XF.activate só pode rodar depois que os assets do destino carregaram');
        if (pendingLoad) pendingLoad();
        await new Promise(r => setTimeout(r, 20));
        assert(calls.activate.length === 1, `XF.activate deve rodar uma vez após o carregamento (chamadas: ${calls.activate.length})`);
        const act = calls.activate[0];
        assert(!!(act && act.querySelector && act.querySelector('textarea[data-xf-init="editor"]')), 'XF.activate deve receber o .p-body novo, que contém o textarea do editor');

        // sem XF.Loader (XF antigo): ativa direto, como antes
        calls.activate.length = 0;
        delete window.XF.Loader;
        window.smgSoftNavigate('/threads/dest.78/');
        await new Promise(r => setTimeout(r, 80));
        assert(calls.activate.length === 1, 'Sem XF.Loader o soft-nav ainda chama XF.activate no .p-body novo');

        window.fetch = prevFetch;
        if (prevXF === undefined) delete window.XF; else window.XF = prevXF;
    }

    // =========================================================================
    // SCROLL: sem hit-test de hover durante a rolagem (desktop)
    // =========================================================================
    {
        console.log('\n--- Scroll: guarda de hover ---');
        const root = document.documentElement;
        root.classList.remove('smg-scrolling');
        window.dispatchEvent(new window.Event('scroll'));
        assert(root.classList.contains('smg-scrolling'), 'Rolar deve marcar html.smg-scrolling');
        window.dispatchEvent(new window.Event('scroll'));
        await new Promise(r => setTimeout(r, 60));
        assert(root.classList.contains('smg-scrolling'), 'html.smg-scrolling continua enquanto a rolagem segue');
        await new Promise(r => setTimeout(r, 260));
        assert(!root.classList.contains('smg-scrolling'), 'html.smg-scrolling sai quando a rolagem para');
        const scrollCss = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');
        assert(/@media \(hover: hover\) and \(pointer: fine\)\s*\{\s*html\.smg-scrolling \.p-body \{ pointer-events: none/.test(scrollCss), 'CSS deve desligar o hover do .p-body só durante a rolagem e só com mouse');
        assert(/html\.smg-scrolling \.p-body \* \{ pointer-events: none !important; \}/.test(scrollCss), 'A guarda de hover também cobre os descendentes (cards com pointer-events:auto explícito)');
    }

    // =========================================================================
    // SCROLL: banners animados do SMG pausam fora da tela
    // =========================================================================
    {
        console.log('\n--- Scroll: banners animados fora da tela ---');
        const PrevIO = window.IntersectionObserver;
        const ios = [];
        window.IntersectionObserver = class extends PrevIO { constructor(cb, opts) { super(cb, opts); ios.push(this); } };
        const art = document.createElement('article');
        art.className = 'message message--post js-post';
        art.innerHTML = '<div class="message-userExtras"><div class="userBanner usergroup smgaddict"><span class="userBanner-before"></span><strong>Addict</strong><span class="userBanner-after"></span></div></div>';
        (document.body || document.querySelector('.p-body') || document.documentElement).appendChild(art);
        const banner = art.querySelector('.userBanner');
        window.__pauseOffscreenBanners([art]);
        const io = ios.find(o => o.elements.has(banner));
        assert(!!io, 'O banner animado deve ser observado por um IntersectionObserver');
        if (io) {
            io.callback([{ target: banner, isIntersecting: false }], io);
            assert(banner.classList.contains('smg-anim-paused'), 'Banner fora da tela deve ficar pausado');
            io.callback([{ target: banner, isIntersecting: true }], io);
            assert(!banner.classList.contains('smg-anim-paused'), 'Banner na tela volta a animar');
        }
        window.__pauseOffscreenBanners([art]);
        assert(ios.filter(o => o.elements.has(banner)).length === 1, 'O mesmo banner não é observado duas vezes');
        const bannerCss = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');
        assert(/\.userBanner\.smg-anim-paused::before[^{]*\{\s*animation-play-state: paused !important/.test(bannerCss), 'CSS deve pausar o banner e os pseudo-elementos dele');
        art.remove();
        window.IntersectionObserver = PrevIO;
    }

    // =========================================================================
    // SCROLL: linhas de tópico fora da tela não renderizam (listas)
    // =========================================================================
    {
        console.log('\n--- Scroll: content-visibility nas linhas de tópico ---');
        const listCss = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');
        assert(/html\.smg-threadlist :not\(\.smg-sticky-compact-list\) > \.structItem--thread \{\s*content-visibility: auto;\s*contain-intrinsic-size: auto 163px;/.test(listCss), 'Linhas da lista (fora da lista compacta de fixos) devem usar content-visibility:auto com altura estimada');
        assert(/html\.smg-threadlist\.smg-tv-grid :not\(\.smg-sticky-compact-list\) > \.structItem--thread \{\s*contain-intrinsic-size: auto 450px;/.test(listCss), 'Cards da grade devem estimar a altura do card');
    }

    // =========================================================================
    // SCROLL: overlay de erro do RedGifs sem backdrop-filter
    // =========================================================================
    {
        console.log('\n--- Scroll: overlay de erro do RedGifs ---');
        const rgCss = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');
        const rule = (rgCss.match(/\.smg-rg-error \{[^}]*\}/) || [''])[0];
        assert(rule.length > 0, 'CSS deve definir o overlay .smg-rg-error');
        assert(!/backdrop-filter/.test(rule), 'Overlay .smg-rg-error não pode usar backdrop-filter (repinta a cada frame de scroll)');
    }

    // =========================================================================
    // MOSAICO: motor masonry único (08a) — posicionamento pela coluna mais curta
    // =========================================================================
    {
        console.log('\n--- Mosaico: motor (coluna mais curta, colunas por largura) ---');
        const eng = window.__masonryEngine;
        assert(eng && typeof eng.masonryPlace === 'function', 'O motor masonry deve estar exposto em __TEST_MODE__ (window.__masonryEngine)');
        const { masonryPlace, masonryColsFor } = eng;
        assert(masonryColsFor(402) === 2 && masonryColsFor(600) === 2, 'Até 600px de largura: 2 colunas');
        assert(masonryColsFor(601) === 3 && masonryColsFor(1100) === 3, 'De 601 a 1100px: 3 colunas');
        assert(masonryColsFor(1101) === 4 && masonryColsFor(1500) === 4, 'Acima de 1100px: 4 colunas');
        // 4 colunas, gap 8, largura 1192 → coluna de 292px
        const r = masonryPlace([1, 1, 1, 1, 0.5, 2], 1192, { gap: 8 });
        assert(r.cols === 4 && Math.round(r.colW) === 292, 'Largura de coluna = (largura - gaps) / colunas');
        assert(r.boxes.slice(0, 4).map(b => b.col).join(',') === '0,1,2,3', 'A primeira linha preenche da esquerda pra direita');
        assert(r.boxes[4].col === 0 && r.boxes[4].y === 300, 'Empate de altura vai pra coluna mais à esquerda, logo abaixo do item de cima (+gap)');
        assert(r.boxes[5].col === 1, 'O próximo item vai pra coluna MAIS CURTA (não segue a ordem de colunas do CSS columns)');
        assert(r.boxes.every(b => b.w === 292), 'Todo item preenche a largura da coluna (sem caixa menor centrada)');
        assert(r.boxes[4].h === 146 && r.boxes[5].h === 584, 'A altura de cada item = largura da coluna × proporção (sem letterbox)');
        assert(r.height === Math.max(...r.boxes.map(b => b.y + b.h)), 'A altura do container = fundo da coluna mais alta');
        const two = masonryPlace([1.3, 1.3], 1192, { gap: 8 });
        assert(two.cols === 2 && Math.round(two.colW) === 592, 'Grupo com menos itens que colunas usa só tantas colunas quantos itens');
        const ordered = masonryPlace([1.5, 0.6, 1, 0.8, 1.2, 0.7, 1.1], 900, { gap: 8 });
        const firstRow = ordered.boxes.slice(0, ordered.cols).map(b => b.x);
        assert(firstRow.every((x, i) => i === 0 || x > firstRow[i - 1]), 'Ordem visual: os N primeiros itens ocupam a primeira linha da esquerda pra direita');
    }

    // =========================================================================
    // MOSAICO NO POST: modelo de blocos (o texto do autor fica onde ele pôs)
    // =========================================================================
    {
        console.log('\n--- Mosaico no post: blocos de texto e runs de imagem ---');
        document.documentElement.classList.add('smg-masonry-on');
        const { buildPostGallery: bpg } = window.__masonryExports;
        const im = (n, wrap) => {
            const tag = '<img class="bbImage" src="https://example.com/b' + n + '.jpg" width="1080" height="1350">';
            if (wrap === 'a') return '<a href="https://example.com/b' + n + '.jpg" class="link link--external">' + tag + '</a>';
            if (wrap === 'w') return '<div class="bbImageWrapper js-lbImage" data-src="https://example.com/b' + n + '.jpg">' + tag + '</div>';
            return tag;
        };
        const mk = html => {
            const post = document.createElement('div');
            post.className = 'message-userContent';
            post.innerHTML = '<div class="bbWrapper">' + html + '</div>';
            if (!document.body) document.documentElement.appendChild(document.createElement('body'));
            document.body.appendChild(post);
            bpg(post);
            return post.querySelector('.bbWrapper');
        };
        // sequência do corpo: T = texto, G<n> = grupo com n itens, I = imagem solta, e o nome da tag do resto
        const seq = bw => Array.from(bw.childNodes).map(n => {
            if (n.nodeType === 3) return n.textContent.trim() ? 'T' : '';
            if (n.classList.contains('auto-image-grid')) return 'G' + n.children.length;
            if (n.querySelector && (n.matches('img.bbImage') || n.querySelector('img.bbImage'))) return 'I';
            return n.tagName;
        }).filter(Boolean).join(' ');

        // 1. texto entre imagens fica no lugar; run de 3 vira um grupo; run de 1 fica solta
        const b1 = mk('Intro do autor.<br>' + im(1, 'a') + '<br>' + im(2, 'a') + '<br>' + im(3, 'a') + '<br>Texto no meio.<br>' + im(4, 'w') + '<br>Texto final.');
        assert(seq(b1) === 'T G3 T BR I BR T', 'Texto antes/entre/depois fica no lugar; run de 3 = G3; imagem única fica solta (obtido: ' + seq(b1) + ')');
        const g1 = b1.querySelector('.auto-image-grid');
        assert(g1.classList.contains('smg-mason'), 'O grupo do post é montado no motor masonry');
        assert(Array.from(g1.querySelectorAll('img')).map(i => i.getAttribute('src').slice(-6)).join(',') === 'b1.jpg,b2.jpg,b3.jpg', 'Itens do grupo na ordem do documento');
        assert(!b1.querySelector('.bbImageWrapper').closest('.auto-image-grid'), 'Run de exatamente 1 imagem NÃO é agrupada');

        // 2. <br>, espaço em branco, comentário e <script> entre duas imagens NÃO quebram a run
        const b2 = mk(im(5) + '\n  <br>\n<br> ' + im(6, 'a') + '<!-- c --><script type="application/json">{}</script>' + im(7, 'w'));
        assert(seq(b2) === 'G3', 'Separadores invisíveis não quebram a run (obtido: ' + seq(b2) + ')');

        // 3. blocos não-mídia são linhas inteiras entre grupos: citação, spoiler, card de file-host, card de link
        //    (players de vídeo SÃO mídia e entram na run — ver "Mosaico no post: vídeos")
        const blocks = [
            '<blockquote class="bbCodeBlock bbCodeBlock--quote"><div class="bbCodeBlock-content">quote</div></blockquote>',
            '<div class="bbCodeSpoiler"><button class="bbCodeSpoiler-button">Spoiler</button><div class="bbCodeSpoiler-content">x</div></div>',
            '<div class="smg-fhcard"><a class="smg-fhcard-main" href="https://gofile.io/d/x">gofile</a></div>',
            '<div class="bbCodeBlock bbCodeBlock--unfurl" data-url="https://example.org/">link</div>',
        ];
        blocks.forEach((blk, i) => {
            const b = mk(im(10 + i) + '<br>' + im(20 + i) + '<br>' + blk + '<br>' + im(30 + i) + '<br>' + im(40 + i));
            const s3 = seq(b);
            assert(/^G2 (BLOCKQUOTE|DIV) G2$/.test(s3.replace(/\bBR\b/g, '').replace(/ +/g, ' ').trim()), 'Bloco não-mídia #' + (i + 1) + ' fica entre dois grupos, fora deles (obtido: ' + s3 + ')');
            assert(Array.from(b.querySelectorAll('.auto-image-grid')).every(g => !g.querySelector('blockquote, .bbCodeSpoiler, .smg-fhcard, .bbCodeBlock--unfurl')),'Bloco não-mídia #' + (i + 1) + ' nunca entra no grupo');
        });

        // 4. imagem dentro de citação/assinatura nunca entra no mosaico do post
        const b4 = mk(im(50) + '<blockquote class="bbCodeBlock bbCodeBlock--quote"><div class="bbCodeBlock-content">' + im(51) + im(52) + '</div></blockquote>' + im(53));
        assert(!b4.querySelector('.auto-image-grid'), 'Imagens de uma citação não formam grupo nem puxam as de fora');

        // 5. ordem do clique = ordem visual: o visualizador lê a mídia em ordem do documento, que é a ordem de colocação
        const b5 = mk(Array.from({ length: 7 }, (_, k) => im(60 + k, 'a')).join('<br>'));
        const g5 = b5.querySelector('.auto-image-grid');
        const viewerOrder = window.collectMediaFrom(b5).map(it => it.url.slice(-7));
        const placeOrder = Array.from(g5.children).map(c => c.querySelector('img').getAttribute('src').slice(-7));
        assert(viewerOrder.join(',') === placeOrder.join(','), 'O visualizador abre a mídia na mesma ordem em que o motor coloca os itens');
        assert(placeOrder.join(',') === Array.from({ length: 7 }, (_, k) => 'b' + (60 + k) + '.jpg').join(','), 'A ordem de colocação é a ordem do autor');
        window.__masonryEngine.setWidth(g5, 1192);
        const lay = window.__masonryEngine.masonryLayout(g5);
        assert(lay.cols === 4 && lay.boxes.slice(0, 4).every((b, k) => b.col === k), 'Na largura de desktop os 4 primeiros itens formam a primeira linha, da esquerda pra direita');
        assert(Array.from(g5.children).every(c => /translate\(/.test(c.style.transform) && c.style.width === '292px'), 'O motor escreve posição e largura de cada item');
        assert(g5.style.height === lay.height + 'px', 'O motor escreve a altura do grupo');

        // 6. imagem que nasce depois ao lado de um grupo entra nele (chevereto/goonbox/imagepond)
        g1.insertAdjacentHTML('afterend', '<br>' + im(9, 'a'));
        bpg(b1.parentElement);
        assert(seq(b1) === 'T G4 T BR I BR T', 'Imagem nova colada no grupo entra nele, sem mexer no texto (obtido: ' + seq(b1) + ')');

        document.querySelectorAll('.message-userContent').forEach(p => { if (p.querySelector('img[src^="https://example.com/b"]')) p.remove(); });
    }

    // =========================================================================
    // MOSAICO: vídeos são itens do mosaico; vídeo HORIZONTAL ocupa 2 colunas
    // =========================================================================
    {
        console.log('\n--- Mosaico: motor com span de colunas ---');
        const { masonryPlace } = window.__masonryEngine;
        // (c) span escolhe o PAR de colunas adjacentes mais baixo (menor máximo), empate à esquerda
        //     4 colunas de 292px: alturas depois da 1ª linha = 300, 66, 96, 154
        const sp = masonryPlace([1, 0.2, 0.3, 0.5, 9 / 16], 1192, { gap: 8, spans: [1, 1, 1, 1, 2] });
        const v = sp.boxes[4];
        assert(sp.cols === 4, 'Span não muda a contagem de colunas pela largura (obtido: ' + sp.cols + ')');
        assert(v.col === 1 && v.span === 2, 'Item de span 2 começa na coluna cujo par adjacente tem o menor máximo (obtido: col ' + v.col + ', span ' + v.span + ')');
        assert(v.y === 96, 'Item de span 2 fica logo abaixo do mais alto dos dois (96), não do mais baixo (obtido: ' + v.y + ')');
        assert(v.w === 592 && v.x === 300, 'Item de span 2 tem 2 colunas + 1 gap de largura (obtido: x ' + v.x + ', w ' + v.w + ')');
        assert(v.h === 333, 'Altura do item de span 2 = sua largura × proporção (obtido: ' + v.h + ')');
        assert(sp.height === Math.max(...sp.boxes.map(b => b.y + b.h)), 'Altura do container cobre o item de span 2');
        // empate entre pares → o da esquerda
        const tie = masonryPlace([0.5, 0.5, 0.5, 0.5, 9 / 16], 1192, { gap: 8, spans: [1, 1, 1, 1, 2] });
        assert(tie.boxes[4].col === 0, 'Empate entre pares de colunas vai pro par mais à esquerda (obtido: ' + tie.boxes[4].col + ')');
        // depois do span, as duas colunas cobertas começam no fundo dele
        const after = masonryPlace([9 / 16, 1, 1], 1192, { gap: 8, spans: [2, 1, 1] });
        assert(after.boxes[0].col === 0 && after.boxes[1].col === 2 && after.boxes[2].col === 3, 'Itens seguintes ocupam as colunas livres ao lado do span, na ordem');
        // a contagem de colunas soma os spans: imagem + vídeo deitado no desktop = 3 colunas (1 + 2), não 2
        const pair = masonryPlace([1.25, 9 / 16], 1192, { gap: 8, spans: [1, 2] });
        assert(pair.cols === 3 && pair.boxes[1].w === Math.round(pair.colW * 2 + 8), 'Grupo pequeno usa tantas colunas quanto a soma dos spans (obtido: ' + pair.cols + ')');
        // (e) com 2 colunas (mobile) o vídeo deitado ocupa a linha inteira; com 1 coluna também
        const mob = masonryPlace([1.25, 9 / 16, 1.25], 402, { gap: 8, spans: [1, 2, 1] });
        assert(mob.cols === 2 && mob.boxes[1].w === 402 && mob.boxes[1].x === 0, 'Em 2 colunas o vídeo deitado ocupa a largura inteira (obtido: x ' + mob.boxes[1].x + ', w ' + mob.boxes[1].w + ')');
        assert(mob.boxes[1].y >= mob.boxes[0].y + mob.boxes[0].h, 'Em 2 colunas o vídeo deitado fica abaixo da imagem anterior');
        const one = masonryPlace([9 / 16, 1], 300, { gap: 8, cols: 1, spans: [2, 1] });
        assert(one.cols === 1 && one.boxes[0].w === 300 && one.boxes[0].h === 169, 'Com 1 coluna o span é limitado a ela (largura inteira)');
        // sem spans, nada muda (todo item = 1 coluna)
        const plain = masonryPlace([1, 1, 1, 1, 0.5, 2], 1192, { gap: 8 });
        assert(plain.boxes.every(b => b.span === 1 && b.w === 292), 'Sem spans todo item ocupa 1 coluna');
    }
    {
        console.log('\n--- Mosaico no post: vídeos ---');
        document.documentElement.classList.add('smg-masonry-on');
        const { buildPostGallery: bpg } = window.__masonryExports;
        const eng = window.__masonryEngine;
        const im = n => '<a href="https://example.com/v' + n + '.jpg" class="link link--external"><img class="bbImage" src="https://example.com/v' + n + '.jpg" width="1080" height="1350"></a>';
        // players como o script os deixa no DOM
        const direct = (w, h) => '<div class="smg-dm-wrap"><div class="smg-rg" style="aspect-ratio: ' + w + ' / ' + h + ';"><video class="smg-rg-v"></video></div></div>';
        const cyber = (w, h) => '<div class="generic2wide-iframe-div"><div class="smg-turbo-slot smg-turbo-slot--filled"><div class="smg-rg" style="aspect-ratio: ' + w + ' / ' + h + ';"><video class="smg-rg-v"></video></div></div></div>';
        const turbo = id => '<div class="generic2wide-iframe-div" data-tb-done="1"><iframe class="saint-iframe" src="https://turbo.cr/embed/' + id + '"></iframe></div>';
        const s9eRg = (w, h) => '<span data-s9e-mediaembed="redgifs" class="smg-player-loaded"><div class="smg-rg" style="aspect-ratio: ' + w + ' / ' + h + ';"><video class="smg-rg-v" data-rgid="abc"></video></div></span>';
        const mk = html => {
            const post = document.createElement('div');
            post.className = 'message-userContent';
            post.innerHTML = '<div class="bbWrapper">' + html + '</div>';
            document.body.appendChild(post);
            bpg(post);
            return post.querySelector('.bbWrapper');
        };
        const seq = bw => Array.from(bw.childNodes).map(n => {
            if (n.nodeType === 3) return n.textContent.trim() ? 'T' : '';
            if (n.classList.contains('auto-image-grid')) return 'G' + n.children.length;
            if (n.querySelector && (n.matches('img.bbImage') || n.querySelector('img.bbImage'))) return 'I';
            if (n.matches && n.matches('.smg-dm-wrap, .generic2wide-iframe-div, span[data-s9e-mediaembed], .smg-rg')) return 'V';
            return n.tagName;
        }).filter(Boolean).join(' ').replace(/\bBR\b ?/g, '').trim();
        const kind = c => c.querySelector('img.bbImage') ? 'img' : 'vid';

        // (a) imagem, vídeo deitado, imagem = UM grupo, na ordem do autor
        const a = mk('Antes.<br>' + im(1) + '<br>' + direct(1920, 1080) + '<br>' + im(2) + '<br>Depois.');
        assert(seq(a) === 'T G3 T', 'Imagem + vídeo + imagem formam um grupo só (obtido: ' + seq(a) + ')');
        const ga = a.querySelector('.auto-image-grid');
        assert(Array.from(ga.children).map(kind).join(',') === 'img,vid,img', 'O vídeo fica entre as imagens, na ordem do documento');
        assert(ga.classList.contains('smg-mason'), 'O grupo com vídeo é montado no motor masonry');

        // (b) deitado = 2 colunas, em pé = 1 coluna, imagem = 1 coluna
        const b = mk(im(3) + '<br>' + direct(1920, 1080) + '<br>' + cyber(1080, 1920) + '<br>' + im(4) + '<br>' + im(5));
        const gb = b.querySelector('.auto-image-grid');
        assert(gb && gb.children.length === 5, 'Run de imagens e vídeos de tipos diferentes vira um grupo de 5 (obtido: ' + seq(b) + ')');
        eng.setWidth(gb, 1192);
        const lb = eng.masonryLayout(gb);
        assert(lb.cols === 4 && Math.round(lb.colW) === 292, 'Desktop: 4 colunas de 292px');
        assert(lb.boxes[1].w === 592, 'Vídeo horizontal ocupa 2 colunas (obtido: ' + lb.boxes[1].w + ')');
        assert(lb.boxes[2].w === 292, 'Vídeo vertical ocupa 1 coluna (obtido: ' + lb.boxes[2].w + ')');
        assert([0, 3, 4].every(i => lb.boxes[i].w === 292), 'Imagens continuam ocupando 1 coluna');
        assert(Math.abs(lb.boxes[1].h / lb.boxes[1].w - 1080 / 1920) < 0.01, 'A caixa do vídeo tem a proporção do vídeo (sem letterbox)');
        assert(gb.children[1].style.width === '592px', 'O motor escreve a largura de 2 colunas no item do vídeo');

        // proporção desconhecida (iframe do turbo) → assume 16:9 deitado; s9e redgifs em pé → 1 coluna
        const c = mk(im(6) + '<br>' + turbo('xyz') + '<br>' + s9eRg(1080, 1350) + '<br>' + im(7));
        const gc = c.querySelector('.auto-image-grid');
        assert(gc && gc.children.length === 4, 'Embed do turbo e redgifs do s9e entram na run (obtido: ' + seq(c) + ')');
        eng.setWidth(gc, 1192);
        const lc = eng.masonryLayout(gc);
        assert(lc.boxes[1].w === 592 && Math.abs(lc.boxes[1].h / lc.boxes[1].w - 9 / 16) < 0.01, 'Vídeo sem proporção conhecida assume 16:9 e ocupa 2 colunas');
        assert(lc.boxes[2].w === 292, 'Redgifs em pé (s9e) ocupa 1 coluna');

        // o player revela a proporção depois → o MESMO nó é re-posicionado (não recriado nem movido)
        const vidBox = gc.children[1];
        const mo = new window.MutationObserver(() => {});
        mo.observe(gc, { childList: true, subtree: true });
        const rgx = window.__redgifsExports;
        const slot = document.createElement('div'); slot.className = 'smg-rg';
        vidBox.querySelector('iframe').replaceWith(slot);   // o iframe virou nosso player (caminho do fallback/scrape)
        mo.takeRecords();
        rgx.rgAspect(slot, 1080, 1920);
        eng.masonryLayout(gc);
        assert(gc.children[1] === vidBox && vidBox.contains(slot), 'Re-colocar não recria nem move o nó do player');
        assert(mo.takeRecords().length === 0, 'Re-colocar não mexe na árvore do DOM (só estilo)');
        assert(vidBox.style.width === '292px', 'Ao saber que é vertical, o vídeo passa a ocupar 1 coluna (obtido: ' + vidBox.style.width + ')');
        mo.disconnect();

        // imagem que chega depois ao lado de um grupo com vídeo entra nele SEM mover o player
        const mo2 = new window.MutationObserver(() => {});
        mo2.observe(ga, { childList: true });
        ga.insertAdjacentHTML('afterend', '<br>' + im(8));
        bpg(a.parentElement);
        const moved = mo2.takeRecords().some(r => Array.from(r.removedNodes).some(n => n.nodeType === 1 && kind(n) === 'vid'));
        assert(seq(a) === 'T G4 T', 'Imagem nova entra no grupo com vídeo (obtido: ' + seq(a) + ')');
        assert(!moved, 'Juntar uma imagem ao grupo não tira o player do lugar (iframe recarregaria, vídeo pausaria)');
        mo2.disconnect();

        // (d) um vídeo sozinho NÃO é grupo
        const d = mk('Texto.<br>' + direct(1920, 1080) + '<br>Mais texto.');
        assert(!d.querySelector('.auto-image-grid') && seq(d) === 'T V T', 'Run de 1 vídeo fica solta, como imagem única (obtido: ' + seq(d) + ')');
        const d2 = mk(cyber(1080, 1920));
        assert(!d2.querySelector('.auto-image-grid'), 'Post com só um vídeo não vira grupo');

        // (e) 2 colunas (mobile): o vídeo deitado ocupa a linha inteira
        eng.setWidth(gb, 402);
        const le = eng.masonryLayout(gb);
        assert(le.cols === 2 && le.boxes[1].w === 402 && le.boxes[1].x === 0, 'Em 2 colunas o vídeo deitado ocupa a largura inteira (obtido: w ' + le.boxes[1].w + ')');
        assert(le.boxes[2].w === Math.round(le.colW), 'Em 2 colunas o vídeo vertical continua com 1 coluna');

        // (f) texto entre vídeo e imagem quebra a run
        const f = mk(direct(1920, 1080) + '<br>Texto do autor.<br>' + im(9));
        assert(!f.querySelector('.auto-image-grid') && seq(f) === 'V T I', 'Texto entre vídeo e imagem separa os dois (obtido: ' + seq(f) + ')');
        const f2 = mk(direct(1920, 1080) + '<br>' + cyber(1080, 1920) + '<br>Texto.<br>' + im(10) + '<br>' + im(11));
        assert(seq(f2) === 'G2 T G2', 'Dois vídeos, texto, duas imagens = dois grupos com o texto no meio (obtido: ' + seq(f2) + ')');
        const quoteVid = mk(im(12) + '<blockquote class="bbCodeBlock bbCodeBlock--quote"><div class="bbCodeBlock-content">' + direct(1920, 1080) + '</div></blockquote>' + im(13));
        assert(!quoteVid.querySelector('.auto-image-grid'), 'Vídeo dentro de citação não entra no mosaico nem junta as imagens de fora');

        const css = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');
        assert(/\.auto-image-grid\.smg-mason[^{]*\.smg-rg[^{]*\{[^}]*height:\s*100%/.test(css), 'CSS: o player preenche a caixa que o motor deu ao item');

        document.querySelectorAll('.message-userContent').forEach(p => { if (p.querySelector('img[src^="https://example.com/v"], .smg-rg, .saint-iframe')) p.remove(); });
    }

    // =========================================================================
    // MOSAICO NA GALERIA: o overlay usa o mesmo motor (sem CSS columns)
    // =========================================================================
    {
        console.log('\n--- Mosaico na galeria (overlay) ---');
        const gx = window.__galleryExports;
        assert(gx && typeof gx.galMakeSection === 'function', 'Os helpers da galeria devem estar expostos em __TEST_MODE__');
        const sec = gx.galMakeSection(1, true);
        const cols = sec.querySelector('.smg-gallery-cols');
        assert(cols.classList.contains('smg-mason'), 'Cada página da galeria é um container do motor masonry');
        const sk = gx.galSkelTile(2);
        assert(Math.abs(gx.galTileRatio(sk) - 1.45) < 0.001, 'Tile-fantasma reserva a altura pela proporção guardada');
        const css = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');
        const galRules = (css.match(/\.smg-gallery-(cols|tile)[^{]*\{[^}]*\}/g) || []).join('\n');
        assert(!/column-(width|count)|break-inside/.test(galRules), 'A galeria não usa mais CSS columns (lia de cima pra baixo)');
        window.__masonryEngine.masonryUnmount(cols);

        // vídeos na galeria: deitado = 2 colunas (16:9 até o player saber), em pé = 1 coluna
        const vsec = gx.galMakeSection(2, false);
        const vcols = vsec.querySelector('.smg-gallery-cols');
        document.body.appendChild(vsec);
        const tileOf = (type, relh) => { const t = document.createElement('div'); t.className = 'smg-gallery-tile smg-gallery-tile--' + type; if (relh) t.dataset.relh = relh; vcols.appendChild(t); return t; };
        tileOf('image', '1.25'); const vUnknown = tileOf('embed'); const vVert = tileOf('embed', '1.7778'); tileOf('image', '1.5');
        window.__masonryEngine.setWidth(vcols, 1192);
        const gl = window.__masonryEngine.masonryLayout(vcols);
        assert(gl.boxes[1].w === 592, 'Galeria: vídeo de proporção desconhecida assume 16:9 e ocupa 2 colunas (obtido: ' + gl.boxes[1].w + ')');
        assert(gl.boxes[2].w === 292 && gl.boxes[0].w === 292 && gl.boxes[3].w === 292, 'Galeria: vídeo vertical e imagens ocupam 1 coluna');
        // o player revela a proporção (API do redgifs / metadata) → o tile guarda e é re-colocado
        const { wrap: gw } = window.__redgifsExports.rgBuild('galtest');
        vUnknown.appendChild(gw);
        window.__redgifsExports.rgAspect(gw, 1080, 1920);
        assert(Math.abs(+vUnknown.dataset.relh - 1920 / 1080) < 0.001, 'Galeria: a proporção que o player descobre vai pro tile (obtido: ' + vUnknown.dataset.relh + ')');
        const gl2 = window.__masonryEngine.masonryLayout(vcols);
        assert(gl2.boxes[1].w === 292 && vUnknown.contains(gw), 'Galeria: vídeo que se revela vertical passa a 1 coluna, mesmo player no mesmo tile');
        window.__masonryEngine.setWidth(vcols, 402);
        const gl3 = window.__masonryEngine.masonryLayout(vcols);
        vVert.dataset.relh = '0.5625';
        const gl4 = window.__masonryEngine.masonryLayout(vcols);
        assert(gl3.cols === 2 && gl4.boxes[2].w === 402, 'Galeria em 2 colunas: vídeo deitado ocupa a largura inteira (obtido: ' + gl4.boxes[2].w + ')');
        window.__masonryEngine.masonryUnmount(vcols);
        vsec.remove();
    }

    // =========================================================================
    // RESUMO FINAL
    // =========================================================================
    console.log('=================================================================');
    console.log(`TOTAL DE ASSERTS EXECUTADOS: ${testsPassed + testsFailed}`);
    console.log(`PASSOU: ${testsPassed}`);
    console.log(`FALHOU: ${testsFailed}`);
    console.log('=================================================================');

    if (testsFailed > 0) {
        process.exit(1);
    } else {
        console.log('\n🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
        process.exit(0);
    }
}

runTests().catch(err => {
    console.error('Erro fatal durante a execução dos testes:', err);
    process.exit(1);
});
