    // ── part 07-posts-misc: atalhos de teclado · scroll infinito ──
    // setado pela dock; o scroll infinito chama pra atualizar o número da página exibido
    let smgUpdateDockPage = null;

    // =========================================================
    // FEATURE: atalhos de teclado (j/k navegação · g goto · / busca · f feed)
    // =========================================================

    let kbBound = false;

    function setupKeyboardShortcuts() {
        if (kbBound) return;
        kbBound = true;

        document.addEventListener('keydown', e => {
            const t = e.target;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            // overlay de mídia aberto tem os próprios atalhos (Esc, v, setas/espaço no Feed)
            if (mediaView()) return;

            const click = id => document.getElementById(id)?.click();

            switch (e.key) {
                case 'j': click('smg-post-nav-down'); break;   // próximo post
                case 'k': click('smg-post-nav-up'); break;     // post anterior
                case 'g': click('smg-post-goto'); break;       // ir pra página
                case 'f': openMedia('feed'); break;   // overlay de mídia na vista Feed (navegação própria, página 1)
                case 'v': click('smg-view-toggle'); break;     // alterna lista/grade
                case 'n': if (FEATURES.alertsDock) toggleAlertsDock(); break;   // painel de notificações docked (abre/fecha)
                case '[': click('smg-post-page-prev'); break;  // página anterior
                case ']': click('smg-post-page-next'); break;  // próxima página
                case '/': e.preventDefault(); click('smg-thread-search'); break; // busca
                default: return;
            }
        });
    }

    // =========================================================
    // PERF: banners animados do SMG (.userBanner: pe-base/pe-heat/crownGlow, ~9 keyframes infinitos
    // por post) repintavam a página a CADA frame, inclusive os que estão fora da tela. Os de fora
    // pausam (classe smg-anim-paused); os visíveis continuam animando como no site.
    // =========================================================
    let bannerIO = null;
    function pauseOffscreenBanners(roots) {
        if (typeof IntersectionObserver !== 'function') return;
        eachIn(roots, '.userBanner', el => {
            if (el.dataset.smgAnimIo === '1') return;
            el.dataset.smgAnimIo = '1';
            if (!bannerIO) {   // só nasce na primeira página que tem banner
                bannerIO = new IntersectionObserver(entries => {
                    entries.forEach(en => {
                        if (!en.target.isConnected) { bannerIO.unobserve(en.target); return; }
                        en.target.classList.toggle('smg-anim-paused', !en.isIntersecting);
                    });
                }, { rootMargin: '100px 0px' });
            }
            bannerIO.observe(el);
        });
    }

    // =========================================================
    // PAGER: o motor comum de "carregar a próxima leva", usado por toda lista que cresce no fim (thread,
    // listagens, Feed, Salvos, carrossel da home, busca da dock, rail de alertas). Cada lista dá a FONTE
    // (load: página HTML, JSON, IndexedDB…) e o DESTINO (apply: pinta e diz qual é o próximo cursor); o motor
    // cuida do resto, igual pra todas:
    //   · gatilho por distância da borda — a página (window) ou um elemento rolável, vertical ou horizontal;
    //   · uma carga por vez; pré-busca opcional de UMA página (o download começa antes do gatilho de append);
    //   · falhas: padrão tenta de novo no próximo pedido e encerra depois de 3 seguidas (onFail decide outra coisa);
    //   · fim da lista: apply devolve next null;
    //   · guard de sequência: reset() troca a lista (nova busca, refresh) e descarta + aborta a carga no ar.
    // cfg: { cursor, load(cursor, signal) → Promise<página|null>, apply(página, cursor) → { next, added },
    //        root (elemento ou lista deles; ausente = a página), axis 'y'|'x', near (px), prefetch (px),
    //        enabled() (só barra o gatilho de scroll; more() explícito passa), onFail(err, n) → 'retry'|'stop',
    //        maxFailures, fill (página que acrescentou algo e ainda está perto do fim puxa a próxima),
    //        onState('loading'|'idle'|'error'|'end'), listen (false = sem listener de scroll; quem chama dá check()) }
    // =========================================================
    function createPager(cfg) {
        const roots = [].concat(cfg.root || []);
        const axisX = cfg.axis === 'x';
        const near = cfg.near != null ? cfg.near : 1400;
        const maxFailures = cfg.maxFailures || 3;
        let cursor = cfg.cursor != null ? cfg.cursor : null;
        let seq = 0, busy = false, failures = 0, failed = false, pre = null, disposed = false;
        const unlisten = [];

        const restOf = el => {
            if (!el) {
                const de = document.documentElement;
                return de.scrollHeight - ((window.scrollY || de.scrollTop || 0) + window.innerHeight);
            }
            return axisX ? el.scrollWidth - el.clientWidth - el.scrollLeft : el.scrollHeight - el.scrollTop - el.clientHeight;
        };
        const emit = kind => { if (cfg.onState) { try { cfg.onState(kind); } catch (e) {} } };
        // UMA página adiantada no máximo: a mesma carga serve a pré-busca e o append
        const fetchPage = cur => {
            if (pre && pre.cursor === cur) return pre.promise;
            const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
            let promise;
            try { promise = Promise.resolve(cfg.load(cur, ctrl ? ctrl.signal : undefined)); } catch (e) { promise = Promise.reject(e); }
            pre = { cursor: cur, ctrl, promise };
            return promise;
        };
        const dropPre = () => { if (pre && pre.ctrl) { try { pre.ctrl.abort(); } catch (e) {} } pre = null; };

        function more() {
            if (disposed || busy || cursor == null) return Promise.resolve(0);
            busy = true;
            const my = seq, cur = cursor;
            emit('loading');
            return fetchPage(cur)
                .then(page => {
                    if (my !== seq) return 0;
                    if (page == null) throw new Error('page load failed');   // fetchDoc devolve null em 429/HTTP != 2xx
                    pre = null;
                    failures = 0;
                    const r = cfg.apply(page, cur) || {};
                    cursor = r.next != null ? r.next : null;
                    return Math.max(0, +r.added || 0);
                })
                .catch(err => {
                    if (my !== seq) return 0;
                    if (pre && pre.cursor === cur) pre = null;   // falhou: joga fora a promessa, senão a mesma falha ficaria em cache
                    failures++;
                    const verdict = cfg.onFail ? cfg.onFail(err, failures) : (failures >= maxFailures ? 'stop' : 'retry');
                    if (verdict === 'stop') { cursor = null; failed = true; }
                    return -1;
                })
                .then(n => {
                    if (my !== seq) return 0;
                    busy = false;
                    emit(cursor == null ? 'end' : (n < 0 ? 'error' : 'idle'));
                    if (n > 0 && cfg.fill && cursor != null) check();
                    return n;
                });
        }
        // gatilho: perto o bastante do fim → append; na faixa de pré-busca → só adianta o download
        function check(el) {
            if (disposed || busy || cursor == null) return;
            if (cfg.enabled && !cfg.enabled()) return;
            const rest = restOf(el || roots[0] || null);
            if (rest <= near) { more(); return; }
            if (cfg.prefetch && rest <= cfg.prefetch) fetchPage(cursor);
        }
        function reset(next) {
            seq++;
            busy = false; failures = 0; failed = false;
            dropPre();
            cursor = next != null ? next : null;
        }
        // percorre a lista em sequência até o fim (ou `max` páginas): pra quem precisa dela inteira
        function drain(max) {
            let pages = 0;
            const step = () => {
                if (disposed || cursor == null || (max && pages >= max)) return { complete: !failed };
                pages++;
                return more().then(step);
            };
            return Promise.resolve().then(step);
        }
        function dispose() {
            disposed = true;
            seq++;
            busy = false;
            dropPre();
            unlisten.splice(0).forEach(fn => fn());
        }

        if (cfg.listen !== false) {
            if (!roots.length) unlisten.push(onScrollRaf(() => check()));
            roots.forEach(el => {
                let tick = false;
                const onScroll = () => {
                    if (tick) return;
                    tick = true;
                    requestAnimationFrame(() => { tick = false; check(el); });
                };
                el.addEventListener('scroll', onScroll, { passive: true });
                unlisten.push(() => el.removeEventListener('scroll', onScroll));
            });
        }

        return {
            check, more, reset, drain, dispose,
            get cursor() { return cursor; },
            get busy() { return busy; },
            get ended() { return cursor == null; },
            get failed() { return failed; },
        };
    }

    // =========================================================
    // FEATURE: scroll infinito na thread (anexa as próximas páginas)
    // =========================================================

    let infScrollBound = false;
    let infScrollGen = 0;
    let infScrollDispose = null;   // solta o listener de scroll da página anterior (soft-nav)
    function disposeInfiniteScroll() {
        if (infScrollDispose) { infScrollDispose(); infScrollDispose = null; }
        infScrollBound = false;
    }

    // pager-sync do scroll infinito: espelha a página visível na URL + dock + paginadores (nativo e SMG).
    // Fábrica: encapsula shownPage; devolve a função chamada no listener de scroll do setupInfiniteScroll.
    function makePagerSync(startPage, originalUrl) {
        let shownPage = startPage;

        // PERF: media a partir do ÚLTIMO separador conhecido em vez de varrer todos os que estão acima da
        // linha. A varredura antiga custava 1 leitura de layout por página já carregada, A CADA FRAME de
        // scroll (na página 30 eram 30 reflows/frame). Scroll contínuo anda 1 posição por vez → 1-2 leituras;
        // um salto (goto/âncora) caminha o resto de uma vez só. Mesmo resultado: o último sep acima da linha.
        let curIdx = -1;
        const currentSep = () => {
            const refY = 120; // linha de referência perto do topo
            const seps = document.querySelectorAll('.smg-inf-sep[data-page]');
            if (!seps.length) { curIdx = -1; return null; }
            let i = Math.min(curIdx, seps.length - 1);   // separadores em ordem do DOM → tops monotônicos
            while (i + 1 < seps.length && seps[i + 1].getBoundingClientRect().top <= refY) i++;   // desceu
            while (i >= 0 && seps[i].getBoundingClientRect().top > refY) i--;                      // subiu
            curIdx = i;
            return i >= 0 ? seps[i] : null;
        };

        const syncPage = () => {
            const sep = currentSep();
            const p = sep ? parseInt(sep.dataset.page, 10) : startPage;
            if (p === shownPage) return;
            shownPage = p;
            try { history.replaceState(history.state, '', sep ? sep.dataset.url : originalUrl); } catch {}
            if (typeof smgUpdateDockPage === 'function') smgUpdateDockPage(p);

            // "X of Y" do paginador simples (topo e rodapé)
            document.querySelectorAll('.pageNavSimple-el--current').forEach(el => {
                el.textContent = el.textContent.replace(/(\d+)(\s*of\s*\d+)/i, p + '$2');
            });

            // destaque "current" do paginador janelado — move o .pageNav-page--current
            // só se a página estiver na janela visível do pager (links têm /page-N; o "1" é a base)
            document.querySelectorAll('.pageNav-main').forEach(ul => {
                let target = null;
                ul.querySelectorAll('li.pageNav-page > a[href]').forEach(a => {
                    const m = (a.getAttribute('href') || '').match(/\/page-(\d+)/);
                    if ((m ? parseInt(m[1], 10) : 1) === p) target = a.parentElement;
                });
                if (!target) return; // página fora da janela do pager
                ul.querySelectorAll('.pageNav-page--current').forEach(li => li.classList.remove('pageNav-page--current'));
                target.classList.add('pageNav-page--current');
            });
        };
        return syncPage;
    }

    function setupInfiniteScroll() {
        if (infScrollBound) return;
        const gen = ++infScrollGen;
        // página SEM paginação não ganha uma depois do load: marca como "resolvido" senão a detecção
        // inteira (querySelectors + readPageJump) re-roda TODO frame de processAll, pra sempre
        const settle = () => { if (document.readyState === 'complete') infScrollBound = true; };

        // contexto detectado por DOM (URLs de fórum do socialmediagirls não têm /forums/, ex.: /youtubers/)
        let container, itemSelector, fetchScope, keyOf = null;   // keyOf: dedup por thread (article view repete sticky por página)
        let onPage = null, decorate = null;   // por página: ingestão do doc buscado / decoração de cada item importado
        if (document.querySelector('.message--post')) {
            // thread (posts)
            container = document.querySelector('.message--post').parentElement;
            itemSelector = '.message--post';
            fetchScope = doc => doc;
        } else if (document.querySelector('.structItem--thread')) {
            // listagem de fórum/seguidas — container real (evita o grupo sticky, que repete em toda página)
            const pick = root => root.querySelector('.structItemContainer-group.js-threadList')
                || root.querySelector('.structItemContainer.smg-tl-grid')
                || root.querySelector('.structItemContainer')
                || root.querySelector('.structItemContainer-group:not(.structItemContainer-group--sticky)')
                || (root.querySelector('.structItem--thread') || {}).parentElement
                || null;
            container = pick(document);
            itemSelector = '.structItem--thread';
            fetchScope = doc => pick(doc) || doc;
            if (/\/watched\/threads(?:\/|$)/.test(location.pathname)) {
                // seguidas: mesma lista, + ingestão de cada página no followed e a decoração própria das linhas
                keyOf = el => { const a = el.querySelector('.structItem-title a[href*="/threads/"]'); return a ? a.getAttribute('href').replace(/\/(unread|latest|page-\d+|post-\d+).*$/, '').replace(/\/$/, '') : null; };
                onPage = doc => ingestWatchedPageToFollowed(doc);
                decorate = decorateWatchedThreadRow;
            }
        } else if (document.querySelector('.smg-article-grid')) {
            // article view (forum_view_type_article): cards já movidos pro nosso grid; anexa os da próxima página nele
            container = document.querySelector('.smg-article-grid');
            itemSelector = '.message--articlePreview';
            fetchScope = doc => doc.querySelector('.block--articles') || doc;   // artigos da próxima página (no .block-body nativo do XF)
            keyOf = el => { const a = el.querySelector('.articlePreview-title a[href*="/threads/"]'); return a ? a.getAttribute('href').replace(/\/(unread|latest|page-\d+|post-\d+).*$/, '').replace(/\/$/, '') : null; };
        } else if (document.documentElement.getAttribute('data-template') === 'search_results') {
            // resultados de busca — só o conteúdo principal (evita o block-row da sidebar)
            const pick = root => {
                const scope = root.querySelector('.p-body-pageContent') || root;
                const r = scope.querySelector('.block-body > .block-row');
                return r ? r.parentElement : null;
            };
            container = pick(document);
            itemSelector = '.block-row';
            fetchScope = doc => pick(doc) || doc;
        } else {
            settle(); return;
        }
        if (!container) { settle(); return; }

        // segue o link "Next" REAL de cada página (robusto a qualquer formato de
        // paginação — /page-N, ?page=N, etc.); evita repetir a mesma página
        const nextLink = root => {
            if (!root) return null;
            const a = root.querySelector('.pageNav-jump--next, .pageNavSimple-el--next, a[rel="next"], .pageNav-page--current + .pageNav-page a, .pageNav-page.pageNav-page--current + .pageNav-page a');
            return a ? a.getAttribute('href') : null;
        };
        const pageNumOf = url => {
            const m = (url || '').match(/(?:\/page-|[?&]page=)(\d+)/);
            return m ? parseInt(m[1], 10) : null;
        };

        const firstUrl = nextLink(document);
        if (!firstUrl) { settle(); return; } // página única ou já na última

        const pj = readPageJump();
        const startPage = pj ? pj.cur : 1;
        const originalUrl = location.pathname + location.search;

        infScrollBound = true;
        let lastNum = startPage;
        // dedup (article view): registra as threads já presentes pra não repetir os sticky em cada página
        const seen = new Set();
        if (keyOf) container.querySelectorAll(itemSelector).forEach(el => { const k = keyOf(el); if (k) seen.add(k); });

        // o master switch e os toggles por contexto valem pro SCROLL da página; desligar no settings para na hora
        const enabled = () => {
            if (gen !== infScrollGen || !container.isConnected) return false;
            if (!FEATURES.infiniteScroll) return false;

            const isFeed = document.documentElement.classList.contains('smg-watched-feed')
                || (new URLSearchParams(location.search).get('view') === 'feed');
            const isThread = document.documentElement.classList.contains('smg-thread')
                || (!isFeed && !!document.querySelector('.message--post'));
            const isWatchedOrList = document.documentElement.classList.contains('smg-threadlist')
                || /\/watched\//i.test(location.pathname)
                || (!isFeed && !isThread && !!document.querySelector('.structItem--thread, .smg-article-grid, [data-template="search_results"]'));

            if (isFeed) {
                if (!FEATURES.infiniteScrollTimeline) return false;
            } else if (isThread) {
                if (!FEATURES.infiniteScrollThreads) return false;
            } else if (isWatchedOrList) {
                if (!FEATURES.infiniteScrollWatched) return false;
            }
            return !mediaView();   // o overlay de mídia pagina a sua própria lista
        };

        // anexa a página buscada: separador + itens num fragmento → UM reflow e UM lote de mutação
        const apply = (doc, url) => {
            if (onPage) safe(onPage, doc);
            const items = fetchScope(doc).querySelectorAll(itemSelector);
            if (!items.length) return { next: null, added: 0 };
            const num = pageNumOf(url) || (lastNum + 1);

            // separador como <li> se o container for lista (ol/ul), senão <div>
            const sep = document.createElement(/^(OL|UL)$/.test(container.tagName) ? 'li' : 'div');
            sep.className = 'smg-inf-sep';
            sep.dataset.page = num;  // p/ sincronizar o paginador
            sep.dataset.url = url;   // URL real dessa página (p/ replaceState)
            sep.textContent = i18n('Page') + ' ' + num;

            const frag = document.createDocumentFragment();
            frag.appendChild(sep);
            let added = 0;
            items.forEach(p => {
                if (keyOf) { const k = keyOf(p); if (k && seen.has(k)) return; if (k) seen.add(k); }  // pula thread repetida (sticky)
                const node = document.importNode(p, true);
                if (decorate) safe(decorate, node);
                frag.appendChild(node);
                added++;
            });
            container.appendChild(frag);

            lastNum = num;
            if (typeof window.smgReapplyFilters === 'function') {
                window.smgReapplyFilters();
            }
            return { next: nextLink(doc), added };   // segue o "Next" da página recém-buscada
        };

        // PRÉ-BUSCA de UMA página: o download começa a 4000px do fim, muito antes do gatilho de append
        // (1400px) → o documento já está na mão quando o gatilho bate e a página entra na hora.
        const pager = createPager({
            cursor: firstUrl,
            load: (url, signal) => {
                let abs;
                try { abs = new URL(url, location.href).href; } catch (e) { abs = url; }
                return fetchDoc(abs, { credentials: 'same-origin', signal });
            },
            apply,
            near: 1400,
            prefetch: 4000,
            enabled,
            listen: false,
        });

        // ---- sincroniza o paginador com o que está na tela (URL + número da dock + "X of Y") ----
        const syncPage = makePagerSync(startPage, originalUrl);

        if (infScrollDispose) infScrollDispose();
        const unScroll = onScrollRaf(() => { pager.check(); syncPage(); });
        infScrollDispose = () => { unScroll(); pager.dispose(); };

        pager.check();
    }
