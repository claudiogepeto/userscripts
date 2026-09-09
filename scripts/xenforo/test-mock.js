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

    // Mock requestAnimationFrame
    window.requestAnimationFrame = (fn) => setTimeout(fn, 0);
    window.cancelAnimationFrame = (id) => clearTimeout(id);

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
    window.GM_xmlhttpRequest = () => {};
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
    assert(scriptContent.includes('// @version      3.12.6'), 'Userscript deve estar na versão 3.12.6');

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
    const groupedTags = uiThreadHeader.querySelector('.smg-thead-tags');
    assert(groupedTags?.querySelector('.smg-thead-tags-row .tagList-icon') !== null
        && groupedTags?.querySelector('.smg-thead-tags-row .tagList') !== null,
    'Ícone de tags e lista de badges devem compartilhar a mesma linha');
    uiThreadHeader.remove();
    uiThreadBarHost.remove();

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

    const feedSyncPerf = window.__feedSyncExports;
    assert(typeof feedSyncPerf.extractPostMediaUrls === 'function', 'extractPostMediaUrls deve estar exposta para regressão');
    const mediaFixture = new window.DOMParser().parseFromString('<div><img src="https://cdn.test/a.jpg"><img src="https://cdn.test/a.jpg"><video src="https://cdn.test/v.mp4"></video></div>', 'text/html').body.firstElementChild;
    const mediaUrls = feedSyncPerf.extractPostMediaUrls(mediaFixture);
    assert(mediaUrls.length === 2 && mediaUrls.includes('https://cdn.test/a.jpg') && mediaUrls.includes('https://cdn.test/v.mp4'), 'Extração de mídia deve deduplicar URLs em uma única leitura');

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
    assert(window.__feedExports.FEED_SYNC_VERSION === 7, 'FEED_SYNC_VERSION deve ser 7');
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
    assert(searchInjectedStyles.includes('max-height: calc(90vh - 160px) !important;'), 'CSS deve definir max-height: calc(90vh - 160px) !important para os resultados de busca');
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
    assert(fallbackObj1.postId === '555', 'Fallback possui postId correto');
    assert(fallbackObj1.ts === 1710000000, 'Fallback possui timestamp correto');
    assert(fallbackObj1.threadTitle === 'Bookmark Title', 'Fallback possui threadTitle');
    assert(fallbackObj1.contentHtml.includes('smg-bm-fallback-text') && !fallbackObj1.contentHtml.includes('smg-bm-note-body'), 'Fallback NÃO duplica a nota dentro de contentHtml');

    const rowWithoutNote = {
        postId: '666',
        title: 'Thread Title Without Note',
        postUrl: 'https://example.com/threads/666/'
    };
    const fallbackObj2 = bmFallbackPost(rowWithoutNote);
    assert(fallbackObj2.contentHtml.includes('smg-bm-fallback-text') && fallbackObj2.contentHtml.includes('https://example.com/threads/666/'), 'Fallback sem nota contém link em .smg-bm-fallback-text');

    // bmFetchPost retorna fallback ao invés de null quando post não existe no doc
    const fetchResult = await bmFetchPost({ postId: '99999', postUrl: 'https://example.com/posts/99999/', title: 'Missing Post', note: 'Nota existente' });
    assert(fetchResult !== null && typeof fetchResult === 'object', 'bmFetchPost deve retornar objeto de fallback em caso de erro/post ausente (nunca null)');
    assert(fetchResult.postId === '99999', 'Objeto de fallback retornado por bmFetchPost contém postId');

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
    assert(decisionA.targetPage === 5, 'Regra A: targetPage deve ser last_page (5)');
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
    assert(decisionB.targetPage === 4, 'Regra B: targetPage deve ser last_page (4)');
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
    assert(decisionUnread.targetPage === 2, 'Tópico unread targetPage deve ser last_page (2)');
    assert(decisionUnread.reason === 'unread', 'Tópico unread reason deve ser "unread"');

    // 7.5 Deduplicação de posts no DOM e riverSeen
    const { insertFreshPosts } = window.__feedExports;
    assert(typeof insertFreshPosts === 'function', 'insertFreshPosts deve ser função');
    window.__feedExports.riverSeen = new Set();
    riverList.innerHTML = '';

    const testPosts = [
        { post_id: '8001', created_at: 1000, contentHtml: 'Post 1' },
        { post_id: '8001', created_at: 1000, contentHtml: 'Post 1 Duplicado' },
        { post_id: '8002', created_at: 2000, contentHtml: 'Post 2' }
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
    assert(window.__feedSyncExports.TIMELINE_CRON_INTERVAL_MS === 300000, 'TIMELINE_CRON_INTERVAL_MS deve ser 300.000ms (5 minutos)');

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
        railShowTab,
        watchedRow,
        aldockSyncCount,
        updateAlertsUnreadBadge,
        aldockState,
        RAIL_SRC,
        aldockWidth,
        getRailTab,
        getAldock
    } = window.__aldockExports;

    // 9.1 Verificar configuração da dock lateral / sidebar
    const btnWatchedEl = document.getElementById('smg-nav-watched');
    assert(btnWatchedEl !== null, 'Botão #smg-nav-watched deve existir na barra/dock principal');
    const btnAlertsEl = document.getElementById('smg-nav-alerts');
    assert(btnAlertsEl === null, 'Botão #smg-nav-alerts NÃO deve existir na barra/dock principal');

    // 9.2 Verificar que o painel lateral é exclusivo para Seguidos (Following)
    assert(getRailTab() === 'alerts', 'Aba padrão do rail deve ser "alerts"');
    assert(RAIL_SRC.watched.filter === false, 'RAIL_SRC.watched não deve expor filtro Todas/Não lidas');
    assert(RAIL_SRC.watched.count === true, 'RAIL_SRC.watched deve ter count: true');

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
    assert(dockEl.querySelector('.smg-aldock-view') !== null, 'Botão .smg-aldock-view deve existir');
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

    // 9.4 Testar watchedRow (estrutura do card do modo lista idêntica ao design limpo do alerta)
    const threadMockHtml = `
        <div class="structItem structItem--thread is-unread" data-author="TestAuthor">
            <div class="structItem-iconContainer">
                <img src="https://example.com/thumb.jpg" alt="" class="avatar" />
            </div>
            <div class="structItem-title">
                <span class="label label--primary">VIP</span>
                <span class="prefix prefix--yellow">OnlyFans</span>
                <a href="/threads/modelo-exemplo.99999/">Modelo Exemplo Thread</a>
            </div>
            <div class="structItem-parts">
                <a href="/forums/modelos.10/">Modelos</a>
            </div>
            <div class="structItem-cell--latest">
                <time datetime="2026-09-03T18:00:00Z" class="structItem-latestDate">Hoje às 18:00</time>
            </div>
        </div>
    `;
    const tmpContainer = document.createElement('div');
    tmpContainer.innerHTML = threadMockHtml;
    const threadItem = tmpContainer.firstElementChild;

    const rowLi = watchedRow(threadItem);
    assert(rowLi !== null, 'watchedRow deve retornar elemento li');
    assert(rowLi.classList.contains('smg-rail-wt'), 'Elemento deve possuir classe .smg-rail-wt');
    assert(rowLi.classList.contains('is-unread'), 'Elemento não lido deve possuir classe .is-unread');

    const rowThumb = rowLi.querySelector('.smg-rail-wt-thumb');
    assert(rowThumb !== null, 'Card deve possuir thumbnail .smg-rail-wt-thumb');

    const rowTags = rowLi.querySelector('.smg-al-tags');
    assert(rowTags !== null, 'Card deve possuir container de badges .smg-al-tags no topo');
    const chips = rowTags.querySelectorAll('.smg-al-chip');
    assert(chips.length === 2, `Badges devem possuir classe .smg-al-chip (encontradas: ${chips.length})`);

    const rowTitle = rowLi.querySelector('.smg-rail-wt-title');
    assert(rowTitle !== null, 'Card deve possuir título .smg-rail-wt-title');
    assert(rowTitle.textContent.trim() === 'Modelo Exemplo Thread', `Título deve ser "Modelo Exemplo Thread" (obtido: ${rowTitle.textContent.trim()})`);

    const rowTime = rowLi.querySelector('.smg-al-time');
    assert(rowTime !== null, 'Card deve possuir data formatada com .smg-al-time');
    assert(rowLi.querySelector('.smg-rail-wt-forum') === null, 'Row deve exibir somente a data abaixo do título');
    assert(rowLi.querySelector('.smg-rail-wt-meta')?.children.length === 1, 'Meta da row deve conter somente a data de atualização');

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

    // 9.7 Validar CSS injetado para o novo card de Seguidos
    const injectedStyles = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');
    assert(injectedStyles.includes('width: 72px') && injectedStyles.includes('height: 72px'), 'CSS deve definir width/height 72px para .smg-rail-wt-thumb');
    assert(injectedStyles.includes('border-radius: 12px'), 'CSS deve definir border-radius: 12px para .smg-rail-wt-thumb');
    assert(injectedStyles.includes('font-size: 14.5px'), 'CSS deve definir font-size: 14.5px para .smg-rail-wt-title');
    assert(injectedStyles.includes('.smg-rail-wt-dot') && injectedStyles.includes('background: #54d66a'), 'CSS deve definir estilos para .smg-rail-wt-dot');
    assert(injectedStyles.includes('.smg-rail-wt.is-unread { background: transparent; opacity: 1; }'), 'CSS deve manter row não lida sem escurecimento');
    assert(injectedStyles.includes('.smg-rail-wt:not(.is-unread) {') && injectedStyles.includes('opacity: 0.55;'), 'CSS deve definir opacidade 0.55 para rows lidas');
    assert(injectedStyles.includes('.smg-rail-wt:not(.is-unread):hover {') && injectedStyles.includes('opacity: 1;'), 'CSS deve restaurar opacidade no hover');
    assert(injectedStyles.includes('padding: 1.5px 5.5px !important'), 'CSS deve definir padding compacto para .label e .smg-badge-chip');
    assert(injectedStyles.includes('font-size: 9.5px !important'), 'CSS deve definir font-size: 9.5px para .label e .smg-badge-chip');
    assert(!injectedStyles.includes('.smg-aldock-body.is-grid .smg-al-tags { display: none; }'), 'CSS da grade não deve esconder os badges');

    // 9.8 Testar railBtn da topbar (classes e contador de seguidos)
    const railBtnEl = document.querySelector('.smg-tb-railbtn');
    assert(railBtnEl !== null, 'Botão .smg-tb-railbtn deve existir na topbar');
    assert(railBtnEl.classList.contains('smg-rt-alerts'), 'railBtn deve possuir classe .smg-rt-alerts');
    assert(!railBtnEl.classList.contains('smg-rt-watched'), 'railBtn NÃO deve possuir classe .smg-rt-watched');

    // 9.9 Testar updateWatchedUnreadBadge e sincronização de não lidos de seguidos
    const { updateWatchedUnreadBadge, getWatchedUnreadCount } = window.__aldockExports;
    assert(typeof updateWatchedUnreadBadge === 'function', 'updateWatchedUnreadBadge deve ser função');
    assert(typeof getWatchedUnreadCount === 'function', 'getWatchedUnreadCount deve ser função');

    updateWatchedUnreadBadge(5);
    const railBadge = railBtnEl.querySelector('.smg-tb-badge');
    assert(railBadge !== null && railBadge.textContent === '5', `updateWatchedUnreadBadge(5) deve exibir "5" no railBtn (obtido: ${railBadge?.textContent})`);
    const navWatchedBadge = btnWatchedEl.querySelector('.smg-nav-badge');
    assert(navWatchedBadge !== null && navWatchedBadge.textContent === '5', `updateWatchedUnreadBadge(5) deve exibir "5" no #smg-nav-watched (obtido: ${navWatchedBadge?.textContent})`);

    updateWatchedUnreadBadge(0);
    assert(railBtnEl.querySelector('.smg-tb-badge') === null, 'updateWatchedUnreadBadge(0) deve remover badge do railBtn');
    assert(btnWatchedEl.querySelector('.smg-nav-badge') === null, 'updateWatchedUnreadBadge(0) deve remover badge de #smg-nav-watched');

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
    assert(window.GM_getValue('smg-watched-unread-count') === '1', `ingestWatchedPageToFollowed deve salvar contagem "1" (obtido: ${window.GM_getValue('smg-watched-unread-count')})`);
    assert(railBtnEl.querySelector('.smg-tb-badge')?.textContent === '1', 'ingestWatchedPageToFollowed deve atualizar badge do railBtn para 1');

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
    assert(injectedStyles.includes('border-radius: 14px !important'), 'CSS deve definir border-radius: 14px para .smg-notices-collapse');
    assert(injectedStyles.includes('margin: 16px 0 !important'), 'CSS deve definir margin: 16px 0 !important para .smg-notices-collapse');
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

    // 10.2 Ingestão das threads no IndexedDB a partir do painel de seguidos e disparo de smg-followed-updated
    const { railFetch } = window.__aldockExports;
    assert(typeof railFetch === 'function', 'railFetch deve ser função');

    const prevFetch10 = window.fetch;
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

    let followedUpdatedFired = false;
    let followedUpdatedCount = 0;
    const onFollowedUpdated = (e) => {
        followedUpdatedFired = true;
        followedUpdatedCount = e.detail ? e.detail.count : 0;
    };
    window.addEventListener('smg-followed-updated', onFollowedUpdated);

    window.fetch = async (url, opts) => {
        const urlStr = typeof url === 'string' ? url : (url && url.url) || '';
        if (urlStr.includes('/watched/threads')) {
            return {
                ok: true,
                status: 200,
                text: async () => watchedPanelHtml,
                json: async () => ({}),
                url: urlStr
            };
        }
        return prevFetch10(url, opts);
    };

    const railResult = await railFetch('watched', '/watched/threads');
    assert(railResult !== null && Array.isArray(railResult.rows), 'railFetch deve retornar objeto com array de rows');
    assert(railResult.rows.length === 2, `railFetch deve processar 2 rows (obtido: ${railResult.rows.length})`);
    assert(followedUpdatedFired === true, 'Evento smg-followed-updated deve ter sido disparado');
    assert(followedUpdatedCount === 2, `smg-followed-updated deve reportar 2 tópicos atualizados (obtido: ${followedUpdatedCount})`);

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

    window.removeEventListener('smg-followed-updated', onFollowedUpdated);
    window.fetch = prevFetch10;

    // smg-followed-updated NUNCA deve iniciar syncTimeline em segundo plano
    assert(window.__feedSyncExports.timelineSyncRunning === false, 'smg-followed-updated NUNCA deve iniciar syncTimeline em segundo plano');

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

    let followedEventFired = false;
    let followedEventCount = 0;
    const onFollowedEvent = (e) => {
        followedEventFired = true;
        followedEventCount = e.detail ? e.detail.count : 0;
    };
    window.addEventListener('smg-followed-updated', onFollowedEvent);

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
    assert(followedEventFired === true, 'Evento smg-followed-updated deve ter sido disparado por fetchAndIngestFollowed');
    assert(followedEventCount === 1, `Evento smg-followed-updated deve reportar count = 1 (obtido: ${followedEventCount})`);

    const autoModel = mockStorage.followed.get('/threads/auto-model.8888/');
    assert(autoModel !== undefined, 'Tópico auto-model.8888 deve estar gravado na store followed do IndexedDB sem necessidade de navegação');
    assert(autoModel.thread_name === 'Auto Model', 'Auto Model deve ter thread_name correto');
    assert(autoModel.forum_activity_ts === 10500, 'Auto Model deve ter forum_activity_ts 10500');
    assert(autoModel.updated_at === 10500, 'Auto Model deve ter updated_at 10500 inicializado com forum_activity_ts');
    assert(autoModel.unread === false, 'Auto Model deve ter unread false na primeira ingestão');

    window.removeEventListener('smg-followed-updated', onFollowedEvent);

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

    // 11.5 Testar botão de refresh da Timeline (.smg-river-refresh) disparando kickSync(null, true)
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

    // Aciona a rolagem / carregamento sob demanda
    if (typeof window.__loadNextWatchedPage === 'function') {
        await window.__loadNextWatchedPage();
        assert(watchedPageFetchCount === 1, `loadNextWatchedPage deve carregar a próxima página sob demanda (obtido: ${watchedPageFetchCount})`);
        const p2Link = watchedContainer.querySelector('a[href="/threads/page2-topic.2/"]');
        assert(p2Link !== null, 'Item da página 2 deve ser renderizado no container');
    }

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

    // 13.4 Verifica que a galeria agrupou os wrappers no .auto-image-grid sem iframes crus
    const grid13 = content13.querySelector('.auto-image-grid');
    assert(grid13 !== null, 'buildPostGalleries deve agrupar múltiplos embeds em .auto-image-grid');
    const rawIframes = content13.querySelectorAll('iframe:not(.saint-iframe):not([data-ip-done])');
    assert(rawIframes.length === 0, `Nenhum iframe cru sem processamento deve sobrar no card (restantes: ${rawIframes.length})`);

    // Limpeza após teste 13
    card13.remove();
    document.documentElement.classList.remove('smg-home-page');
    window.history.pushState({}, '', prevUrl13);

    console.log('Teste 13 concluído com sucesso!\n');

    // =========================================================================
    // TESTE 14: Desaninhamento de .auto-image-grid Aninhado (Anti-Nesting)
    // =========================================================================
    console.log('--- TESTE 14: Desaninhamento de .auto-image-grid Aninhado ---');

    const buildPostGalleries = window.buildPostGalleries || window.__buildPostGalleries;
    assert(typeof buildPostGalleries === 'function', 'buildPostGalleries deve estar exposto em modo de teste');

    document.documentElement.classList.add('smg-masonry-on');

    // 14.1 Criação de um container com .auto-image-grid aninhado dentro de outro .auto-image-grid
    const container14 = document.createElement('div');
    container14.className = 'message-userContent';

    const outerGrid = document.createElement('div');
    outerGrid.className = 'auto-image-grid';

    const innerGrid = document.createElement('div');
    innerGrid.className = 'auto-image-grid';

    const child1 = document.createElement('div');
    child1.className = 'media-item-1';
    child1.textContent = 'Media 1';

    const child2 = document.createElement('div');
    child2.className = 'media-item-2';
    child2.textContent = 'Media 2';

    innerGrid.appendChild(child1);
    innerGrid.appendChild(child2);
    outerGrid.appendChild(innerGrid);
    container14.appendChild(outerGrid);
    document.body.appendChild(container14);

    assert(container14.querySelectorAll('.auto-image-grid .auto-image-grid').length === 1, 'Antes do desaninhamento deve existir um .auto-image-grid aninhado');
    assert(innerGrid.children.length === 2, 'Grid interno contém os 2 itens filhos inicialmente');

    // 14.2 Executa buildPostGalleries no container
    buildPostGalleries([container14]);

    // 14.3 Valida que o grid interno foi desaninhado e os filhos pertencem diretamente ao grid externo
    assert(container14.querySelectorAll('.auto-image-grid .auto-image-grid').length === 0, 'O grid interno deve ter sido desaninhado completamente');
    assert(child1.parentElement === outerGrid, 'child1 agora deve pertencer diretamente ao grid externo');
    assert(child2.parentElement === outerGrid, 'child2 agora deve pertencer diretamente ao grid externo');
    assert(outerGrid.contains(child1) && outerGrid.contains(child2), 'Todos os nós filhos pertencem diretamente ao grid externo');
    assert(!outerGrid.contains(innerGrid), 'O nó innerGrid foi removido do DOM');

    // Limpeza após teste 14
    container14.remove();

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
    assert(window.__masonryExports !== undefined, 'window.__masonryExports deve estar exposto');
    const { gridColsFor } = window.__masonryExports;
    assert(typeof gridColsFor === 'function', 'gridColsFor deve ser função');

    const makeVerticalVideo = () => {
        const block = document.createElement('div');
        block.className = 'smg-rg';
        block.style.aspectRatio = '9 / 16';
        return block;
    };
    const makeWideVideo = () => {
        const block = document.createElement('div');
        block.className = 'smg-rg';
        block.style.aspectRatio = '16 / 9';
        return block;
    };
    assert(gridColsFor([makeVerticalVideo()]) === 1, 'Uma mídia vertical deve ocupar uma coluna');
    assert(gridColsFor([makeVerticalVideo(), makeVerticalVideo()]) === 2, 'Duas mídias verticais devem ocupar duas colunas');
    assert(gridColsFor([makeVerticalVideo(), makeVerticalVideo(), makeVerticalVideo()]) === 3, 'Três mídias verticais devem ocupar três colunas');
    assert(gridColsFor([makeVerticalVideo(), makeVerticalVideo(), makeVerticalVideo(), makeVerticalVideo()]) === 3, 'Quatro mídias verticais devem ocupar três colunas');
    assert(gridColsFor([makeVerticalVideo(), makeVerticalVideo(), makeVerticalVideo(), makeWideVideo()]) === 3, 'Quatro mídias com maioria vertical devem ocupar três colunas');
    assert(gridColsFor([makeVerticalVideo(), makeVerticalVideo(), makeWideVideo(), makeWideVideo()]) === 2, 'Quatro mídias sem maioria vertical devem manter duas colunas');
    assert(gridColsFor([makeVerticalVideo(), makeVerticalVideo(), makeVerticalVideo(), makeVerticalVideo(), makeVerticalVideo()]) === 3, 'Cinco ou mais mídias devem ocupar três colunas');
    assert(gridColsFor([makeWideVideo(), makeWideVideo(), makeWideVideo()]) === 2, 'Três mídias horizontais devem manter duas colunas para não ficarem pequenas');

    const injectedStyles18 = Array.from(document.querySelectorAll('style')).map(style => style.textContent).join('\n');
    assert(injectedStyles18.includes('--smg-media-h: 75vh;'), 'O teto de mídia deve ser 75vh');
    assert(injectedStyles18.includes('img.bbImage.smg-vert'), 'Masonry deve possuir regra específica para imagens verticais');
    assert(injectedStyles18.includes('.smg-rg.smg-rg-vert'), 'RedGifs vertical deve possuir regra específica de dimensionamento');
    assert(injectedStyles18.includes('width: auto !important;'), 'Mídia vertical deve poder reduzir a largura sem deformar a altura');
    assert(injectedStyles18.includes('margin-left: auto !important;'), 'Mídia vertical deve ser centralizada horizontalmente');
    assert(injectedStyles18.includes('text-align: center !important;'), 'Conteúdo do masonry deve ser centralizado horizontalmente');
    assert(injectedStyles18.includes('display: grid !important;'), 'Masonry deve usar uma grade estável');
    assert(injectedStyles18.includes('grid-template-columns: repeat(var(--smg-mcols, 3), minmax(0, 1fr)) !important;'), 'Masonry deve manter colunas de largura uniforme');
    assert(injectedStyles18.includes('grid-auto-flow: row !important;'), 'Masonry deve preservar a ordem das mídias por linha');
    assert(injectedStyles18.includes('gap: 8px !important;'), 'Masonry deve manter espaçamento uniforme entre linhas e colunas');
    assert(injectedStyles18.includes('justify-items: center !important;'), 'Masonry deve centralizar cada mídia dentro da coluna');
    assert(injectedStyles18.includes('html.smg-masonry-on .smg-fp-content .auto-image-grid'), 'Cards do feed devem usar o mesmo layout Grid do masonry');
    assert(injectedStyles18.includes('--smg-ald-w: 360px;'), 'Sidebar deve ter fallback compacto de 360px');

    // =========================================================================
    // TESTE 19: Contexto de página e contrato do paint gate
    // =========================================================================
    console.log('--- TESTE 19: Contexto de Página & Paint Gate ---');
    assert(window.__paintExports !== undefined, 'window.__paintExports deve estar exposto');
    const { classifyPaintPage, paintSkeletonMarkup, paintRailMarkup, paintHasFatalError, paintPageIsReady, paintPageCanFallback, PAINT_PAGE_KINDS } = window.__paintExports;
    assert(typeof classifyPaintPage === 'function', 'classifyPaintPage deve ser função');
    assert(typeof paintSkeletonMarkup === 'function', 'paintSkeletonMarkup deve ser função');
    assert(typeof paintRailMarkup === 'function', 'paintRailMarkup deve ser função');
    assert(typeof paintHasFatalError === 'function', 'paintHasFatalError deve ser função');
    assert(typeof paintPageCanFallback === 'function', 'paintPageCanFallback deve ser função');
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
    assert(homeSkeleton19.includes('smg-home-skeleton-bottom-nav'), 'Skeleton da home deve reservar a navbar mobile');
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
    assert(paintCss19.includes('z-index: 1000'), 'Skeleton deve ficar acima da página nativa durante a composição');

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

    // 1. paintPageCanFallback com contexto timeline e #smg-river presente retorna true
    assert(paintPageCanFallback(timelineCtx) === true, 'paintPageCanFallback com contexto timeline e #smg-river presente retorna true');

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
    assert(parsedPost.postId === '77777', `riverParsePost deve extrair o postId real do post (esperado: "77777", obtido: "${parsedPost ? parsedPost.postId : ''}") e NÃO o link interno (/post-99999)`);
    assert(!parsedPost.contentHtml.includes('nested comment text'), 'riverParsePost deve remover nós de comentários residuais do contentHtml');

    // =========================================================================
    // TESTE 22: Controle de Visualização/Notificação (last_seen_at) e Sincronização Unificada
    // =========================================================================
    console.log('--- TESTE 22: last_seen_at, dbFollowedMarkSeen, dbFollowedGetUnreadCount e ordenação ---');
    const { dbFollowedMarkSeen, dbFollowedGetUnreadCount } = window.__feedDbExports;
    assert(typeof dbFollowedMarkSeen === 'function', 'dbFollowedMarkSeen deve ser uma função exportada');
    assert(typeof dbFollowedGetUnreadCount === 'function', 'dbFollowedGetUnreadCount deve ser uma função exportada');

    // 1. dbFollowedMarkSeen(path) limpa unread
    mockStorage.followed.set('/threads/test-seen.100/', {
        path: '/threads/test-seen.100/',
        thread_name: 'Test Seen Thread',
        updated_at: 5000,
        unread: true
    });
    let seenEventDetail = null;
    const onSeenEvent = (e) => { seenEventDetail = e.detail; };
    window.addEventListener('smg-followed-seen', onSeenEvent);

    await dbFollowedMarkSeen('/threads/test-seen.100/');
    const markedItem = mockStorage.followed.get('/threads/test-seen.100/');
    assert(markedItem.unread === false, 'dbFollowedMarkSeen deve limpar unread para false');
    assert(seenEventDetail !== null && seenEventDetail.path === '/threads/test-seen.100/', 'Evento smg-followed-seen deve ser disparado com detalhes corretos');
    window.removeEventListener('smg-followed-seen', onSeenEvent);

    // 2. dbFollowedGetUnreadCount() retorna a contagem correta apenas quando unread = true
    mockStorage.followed.clear();
    mockStorage.followed.set('/threads/unread-1/', { path: '/threads/unread-1/', updated_at: 5000, unread: true });
    mockStorage.followed.set('/threads/unread-2/', { path: '/threads/unread-2/', updated_at: 6000, unread: true });
    mockStorage.followed.set('/threads/read-1/', { path: '/threads/read-1/', updated_at: 5000, unread: false });
    mockStorage.followed.set('/threads/read-2/', { path: '/threads/read-2/', updated_at: 4000, unread: false });
    mockStorage.followed.set('/threads/zero-updated/', { path: '/threads/zero-updated/', updated_at: 0, unread: false });

    const unreadTotal = await dbFollowedGetUnreadCount();
    assert(unreadTotal === 2, `dbFollowedGetUnreadCount deve contar apenas tópicos com unread = true (esperado: 2, obtido: ${unreadTotal})`);

    // 3. Ordenação da sidebar de seguidos:
    // - Tópicos não lidos no topo ordenados por updated_at DESC
    // - Tópicos lidos abaixo ordenados por updated_at DESC
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

    const { renderFollowedRow, railRefresh } = window.__aldockExports;
    assert(typeof renderFollowedRow === 'function', 'renderFollowedRow deve estar exposto');

    // Testar renderFollowedRow adicionando .is-unread e .smg-rail-wt-dot condicionalmente
    const rowUnread = renderFollowedRow(mockDockItems[1]);
    assert(rowUnread.classList.contains('smg-rail-wt'), 'renderFollowedRow deve ter classe smg-rail-wt');
    assert(rowUnread.classList.contains('is-unread'), 'renderFollowedRow para tópico não visto deve ter classe is-unread');
    assert(rowUnread.querySelector('.smg-rail-wt-dot') !== null, 'renderFollowedRow para tópico não visto deve conter .smg-rail-wt-dot');

    const rowRead = renderFollowedRow(mockDockItems[0]);
    assert(!rowRead.classList.contains('is-unread'), 'renderFollowedRow para tópico já visto NÃO deve ter classe is-unread');
    assert(rowRead.querySelector('.smg-rail-wt-dot') === null, 'renderFollowedRow para tópico já visto NÃO deve conter .smg-rail-wt-dot');

    // Testar badges coloridas em renderFollowedRow
    const rowWithTags = renderFollowedRow({
        path: '/threads/tags-test/',
        thread_name: 'Tags Test',
        tags: ['OnlyFans', 'Fansly']
    });
    const tagChips = Array.from(rowWithTags.querySelectorAll('.smg-al-chip'));
    assert(tagChips.length === 2, `renderFollowedRow deve renderizar 2 chips (obtido: ${tagChips.length})`);
    assert(tagChips[0].classList.contains('label--onlyfans'), '1º chip deve conter a classe label--onlyfans');
    assert(tagChips[1].classList.contains('label--fansly'), '2º chip deve conter a classe label--fansly');

    // Testar ordenação via railRefresh('watched')
    const aldockEl = window.__aldockExports.getAldock();
    const markReadBtn = aldockEl.querySelector('.smg-aldock-markread');
    assert(markReadBtn !== null, 'Botão .smg-aldock-markread deve existir no alerts dock');
    assert(markReadBtn.innerHTML.includes('<svg') || markReadBtn.innerHTML.includes('<path'), 'Botão .smg-aldock-markread deve conter o ícone checkAll');

    const listEl = aldockEl.querySelector('.smg-aldock-body[data-tab="watched"] .smg-aldock-list');
    await railRefresh('watched', true);

    const renderedRows = Array.from(listEl.querySelectorAll('.smg-rail-wt'));
    assert(renderedRows.length === 6, `railRefresh deve renderizar os 6 tópicos (obtido: ${renderedRows.length})`);

    const renderedKeys = renderedRows.map(r => r.dataset.smgAlKey);
    // Esperado:
    // 1. /threads/unread-seen-newer/ (last_seen_at 3000 > 1000)
    // 2. /threads/unread-seen-older/ (last_seen_at 1000, updated_at 9000 > 4000)
    // 3. /threads/unread-tie/ (last_seen_at 1000, updated_at 4000)
    // 4. /threads/read-updated-newer/ (updated_at 3000 > 1000)
    // 5. /threads/read-older/ (updated_at 1000, last_seen_at 5000 > 2000)
    // 6. /threads/read-tie/ (updated_at 1000, last_seen_at 2000)
    assert(renderedKeys[0] === 'wt:/threads/unread-seen-newer', `1º tópico deve ser unread-seen-newer (obtido: ${renderedKeys[0]})`);
    assert(renderedKeys[1] === 'wt:/threads/unread-seen-older', `2º tópico deve ser unread-seen-older (obtido: ${renderedKeys[1]})`);
    assert(renderedKeys[2] === 'wt:/threads/unread-tie', `3º tópico deve ser unread-tie (obtido: ${renderedKeys[2]})`);
    assert(renderedKeys[3] === 'wt:/threads/read-updated-newer', `4º tópico deve ser read-updated-newer (obtido: ${renderedKeys[3]})`);
    assert(renderedKeys[4] === 'wt:/threads/read-tie', `5º tópico deve ser read-tie (obtido: ${renderedKeys[4]})`);
    assert(renderedKeys[5] === 'wt:/threads/read-older', `6º tópico deve ser read-older (obtido: ${renderedKeys[5]})`);

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
