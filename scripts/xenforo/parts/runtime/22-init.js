    function rootTouches(roots, selector, alreadyNormalized) {
        const scope = alreadyNormalized ? roots : normalizeRoots(roots);
        return scope.some(root => root === document.body
            || (root.matches && root.matches(selector))
            || (root.closest && root.closest(selector))
            || (root.querySelector && root.querySelector(selector)));
    }

    function processAll(roots) {
        if (smgDisabled) return;
        roots = normalizeRoots(roots);
        const fullScan = roots.some(root => root === document.body);
        const threadDirty = fullScan || rootTouches(roots, '.message--post, .message, .js-post, .p-body-header, .block-outer, .message-userContent, .bbWrapper, .comment, .comment-body, .generic2wide-iframe-div, .auto-image-grid, .smg-dm-wrap, img.bbImage, .bbCodeSpoiler, .bbCodeBlock--unfurl, .message-responses', true);
        const listDirty = fullScan || rootTouches(roots, '.structItem--thread, .structItemContainer, .block-outer, .message--articlePreview', true);
        const chromeDirty = fullScan || rootTouches(roots, '.p-body-header, .p-nav, .block-outer', true);
        const paintContext = classifyPaintPage();

        if (FEATURES.customFavicon) safe(setFavicon);

        const path = location.pathname;
        const isThread = paintContext.kind === PAINT_PAGE_KINDS.THREAD || cls.contains('smg-thread') || isThreadRoute();
        const isThreadList = [PAINT_PAGE_KINDS.LISTING, PAINT_PAGE_KINDS.FOLLOWING].includes(paintContext.kind)
            || cls.contains('smg-threadlist') || /\/forums\//.test(path) || /\/watched\//.test(path);
        const isHome = paintContext.kind === PAINT_PAGE_KINDS.HOME || (cls.contains('smg-home') && !cls.contains('smg-watched-feed'));
        const isAlerts = /\/account\/alerts/i.test(path);
        const isBookmarks = isBookmarksPage();
        const isSearch = /\/search\//i.test(path);
        const isContentFeed = isThread || isBookmarks || (feedContext());
        const contentDirty = fullScan || threadDirty || (isBookmarks && listDirty) || (typeof feedContext === 'function' && feedContext());

        if (isContentFeed && contentDirty) {
            if (FEATURES.autoFullImages || FEATURES.replaceThumbsWithFull) safe(unlazyImageLinks, roots);
            if (FEATURES.unwrapLinks) safe(unwrapRedirectLinks, roots);
            if (FEATURES.autoFullImages || FEATURES.replaceThumbsWithFull) safe(processImages, roots);
            if (FEATURES.replaceThumbsWithFull) safe(applyReplaceThumbsWithFull, true, roots);
            if (FEATURES.directMedia) safe(processDirectMedia, roots);
            safe(processTurboEmbeds, roots);
            if (FEATURES.imagepondEmbeds) safe(processImagepondNativeEmbeds, roots);
            if (FEATURES.cyberdropEmbeds) safe(processCyberdropEmbeds, roots);
            safe(processInstagramEmbeds, roots);
            safe(processTwitterEmbeds, roots);
            if (FEATURES.fileHostCards) safe(processFileHostCards, roots);
            if (FEATURES.redgifsPlayer) safe(applyRedgifsPlayer, roots);
            if (FEATURES.autoLoadRedgifs) safe(autoLoadRedgifs, roots);
            safe(autoExpandSpoilers, roots);
            safe(markG2wWrappers, roots);
            if (FEATURES.autoFullImages) safe(buildPostGalleries, roots);
        }

        // 1. Passes específicos de THREADS (posts, mídia, comentários, galerias)
        if (isThread) {
            if (threadDirty) safe(ingestCurrentThreadPageIfFollowed, roots);
            if (threadDirty && FEATURES.groupLinks) safe(groupPostLinks, roots);
            if (threadDirty && FEATURES.revealLikedPosts) safe(revealLikedPosts, roots);

            if (listDirty) safe(buildFilterBars, roots);
            if (chromeDirty) {
                safe(buildThreadHeader, roots);
                safe(syncMobileThreadbar, roots);
            }
            if (threadDirty) {
                safe(pauseOffscreenBanners, roots);
                safe(buildPostCards, roots);
                safe(buildCommentCards, roots);
                safe(buildCommentBar, roots);
            }
        }

        // 2. Passes específicos de LISTAGENS & FÓRUNS
        if (isThreadList) {
            safe(harvestThreadThumbs, roots);
            safe(markThreadGridContainer, roots);
            safe(markCategoryNodeBlocks, roots);
            if (FEATURES.thumbPlaceholders) safe(markGridPlaceholders, roots);
            if (listDirty) safe(styleArticleCards, roots);
            if (listDirty) {
                safe(buildFilterBars, roots);
                if (typeof window.smgReapplyFilters === 'function') safe(window.smgReapplyFilters, roots);
            }
        }

        // 3. Passes específicos da HOME (forum_list). A home é transmitida em partes e
        // pode receber mutações de widgets fora do conteúdo principal; não refaça toda a
        // organização por causa dessas mutações irrelevantes.
        if (isHome && FEATURES.headerNotices) safe(setupHeaderNotices);
        const homeCandidate = isHome && (fullScan || rootTouches(roots, '.p-body-content, .p-body-pageContent, .block--category', true));
        // a assinatura (clone de cada header + todos os nós) só é refeita quando a mutação tocou uma
        // categoria ou um nó; o resto do miolo da home reaproveita a última.
        const homeTouched = homeCandidate && (fullScan || homePassSignature === null || rootTouches(roots, '.block--category, .node', true));
        const currentHomeSignature = homeTouched ? homeLayoutSignature() : homePassSignature;
        const homeDirty = homeCandidate
            && (homePassSignature !== currentHomeSignature || rootTouches(roots, '.node--link, .node-subNodesFlat', true));
        if (homeCandidate && !homeSidebarDone) safe(layoutHomeSidebar, roots);
        if (isHome && homeDirty) {
            safe(markHomeAdBlocks);
            safe(expandSubForums, roots);
            safe(organizeHomeHub, roots);
            safe(makeHomeCardsClickable, roots);
            safe(ensureHomeNodeIcons, roots);
            safe(enhanceHomeHubSections, roots);
            homePassSignature = homeLayoutSignature();
        }

        // 4. Passes de Páginas Específicas
        if (isAlerts) {
            if (fullScan || rootTouches(roots, '.js-alertList, ol.listPlain', true)) {
                const alertList = document.querySelector('.block-body.js-alertList, .js-alertList, ol.listPlain');
                if (alertList) safe(cleanAlertList, alertList);
            }
        }
        if (isBookmarks && FEATURES.bookmarksFeed) {
            if (fullScan || rootTouches(roots, '.p-body-content, .p-body-pageContent', true)) safe(setupBookmarksFeed, roots);
        }
        if (isSearch) {
            if (fullScan || rootTouches(roots, '.p-body-content, .smg-search-results', true)) safe(buildSearchResultsPanel, roots);
        }
        if (paintContext.gated && document.documentElement.classList.contains('smg-page-pending')) {
            // A dock persistida pode ser aberta pelo setupAlertsDock no mesmo frame em que
            // ela é montada. Atualiza o rail do shell antes do settle para não deixar uma
            // faixa vazia surgir entre o skeleton e a dock real.
            ensurePageSkeleton();
            // A stream da home pode alterar a ordem várias vezes antes do primeiro paint. O
            // controlador compartilhado reinicia apenas o settle timer nesse caso; depois da
            // liberação, mutações normais de feed/scroll nunca reabrem a página inteira.
            if (paintContext.kind === PAINT_PAGE_KINDS.HOME && homeDirty) cancelPagePaintRelease();
            schedulePagePaintRelease();
        }
    }

    // O observer dispara em QUALQUER mutação do DOM. Como o próprio processAll
    // muta o DOM, sem coalescer ele se re-dispara num flood de microtasks que
    // não cede pro render e trava a aba. Solução: no máximo 1 execução por frame.
    // Raízes = só os subtrees ADICIONADOS. O alvo de um registro só entra quando o registro é remoção
    // pura, e nunca quando o alvo é um container de posts (senão uma remoção dentro do post/lista
    // re-varreria todos os posts). Quem insere conteúdo por fora passa o nó: scheduleRun(node).
    // Backstop: UM full-scan em tempo ocioso (no máximo 1 a cada FULL_SCAN_GAP_MS) pega nós que o
    // scope não enxergou (ex.: match por atributo que mudou depois).
    let scheduled = false, dirtyRoots = new Set(), idleFullArmed = false, lastFullScanTs = 0;
    const FULL_SCAN_GAP_MS = 2000;
    const POST_CONTAINER_SEL = 'article.message, .message--post, .block-body, .structItemContainer, .p-body, .p-body-main, .p-body-pageContent';

    function addRoot(n) {
        if (n && n.nodeType === 1) dirtyRoots.add(n);
    }

    function armIdleFullScan() {
        if (idleFullArmed) return;
        idleFullArmed = true;
        const wait = Math.max(0, FULL_SCAN_GAP_MS - (Date.now() - lastFullScanTs));
        setTimeout(() => {
            const run = () => {
                idleFullArmed = false;
                lastFullScanTs = Date.now();
                if (document.body) processAll([document.body]);
            };
            if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 3000 });
            else run();
        }, wait);
    }

    function scheduleRun(input) {
        if (input && input.nodeType === 1) {
            addRoot(input);
        } else if (input) {
            for (const m of input) {
                if (m.addedNodes && m.addedNodes.length) {
                    for (const n of m.addedNodes) addRoot(n);
                } else if (m.target && m.target.nodeType === 1 && !(m.target.matches && m.target.matches(POST_CONTAINER_SEL))) {
                    addRoot(m.target);
                }
            }
        }
        if (scheduled) return;
        scheduled = true;

        requestAnimationFrame(() => {
            scheduled = false;
            if (FEATURES.topBar && !topbarBuilt && document.querySelector('.p-nav')) {
                safe(buildTopbar);
            }
            if (FEATURES.alertsDock && !aldockBound && document.querySelector('.p-navgroup-link--alerts')) {
                // Mount the persisted dock as soon as its native control exists,
                // instead of waiting for DOMContentLoaded behind the home paint.
                safe(setupAlertsDock);
            }
            if (!document.getElementById('smg-post-nav-wrapper') && document.body) {
                safe(setupPostNavigation);
            }
            if (!dirtyRoots.size) return;
            const roots = [...dirtyRoots];
            dirtyRoots = new Set();
            processAll(roots);
            armIdleFullScan();
        });
    }

    if (smgDisabled) {
        releaseCriticalPaintGate();
        return;   // kill-switch: não injeta CSS nem roda nada
    }

    const cls = document.documentElement.classList;

    // detecta as classes de página (smg-home/thread/threadlist/tv-grid). Roda 2x: cedo (URL+
    // data-template, no document-start) e de novo no DOM-ready (aí o .structItem--thread já existe).
    function detectPageClasses() {
        const tpl = document.documentElement.getAttribute('data-template') || '';
        const path = location.pathname;
        const isHomePath = path === '/' || path === '';
        const isFeedView = isHomePath && new URLSearchParams(location.search).get('view') === 'feed';
        const innerPage = /\/(?:watched|forums|threads|posts|goto|whats-new|search|tags|members|account|conversations|categories|pages)(?:\/|$)/i.test(path);
        const isForumHome = !innerPage && (tpl === 'forum_list' || isHomePath);
        cls.toggle('smg-home-page', isForumHome); // a URL identifica a home antes do data-template
        const paintContext = classifyPaintPage({ pathname: path, search: location.search, template: tpl });
        ['home', 'thread', 'listing', 'following', 'timeline', 'bookmarks'].forEach(kind => cls.toggle('smg-page-' + kind, paintContext.kind === kind));
        const isContentAlreadyReady = cls.contains('smg-page-ready') || cls.contains('smg-content-ready') || (isContentReady());
        if (paintContext.gated && !isContentAlreadyReady) {
            cls.add('smg-page-pending');
            cls.add('smg-content-pending');
            armPagePaintSafetyTimer();
        }
        const isTopbarAlreadyReady = cls.contains('smg-topbar-ready') || (isTopbarReady());
        if (FEATURES.topBar && !isTopbarAlreadyReady) {
            cls.add('smg-topbar-loading');
            cls.add('smg-topbar-pending');
        } else {
            markTopbarReady();
        }
        const isNavbarAlreadyReady = cls.contains('smg-navbar-ready') || (isNavbarReady());
        if (!isNavbarAlreadyReady) {
            cls.add('smg-navbar-loading');
            cls.add('smg-navbar-pending');
        } else {
            markNavbarReady();
        }
        const showHome = isForumHome && !isFeedView && FEATURES.homeRemake;
        cls.toggle('smg-home', showHome);
        if (showHome) {
            const isHomeAlreadyReady = cls.contains('smg-home-ready') || cls.contains('smg-page-ready');
            if (!isHomeAlreadyReady) cls.add('smg-home-pending');
        } else {
            cls.remove('smg-home-pending', 'smg-home-ready');
        }
        const isThread = /^thread_view/i.test(tpl) || isThreadRoute(path);
        cls.toggle('smg-thread', isThread);
        const isList = !isThread && (
            /\/(?:watched|whats-new|forums|tags|categories)(\/|$)/i.test(path)
            || /^(?:forum_view|watched_threads_list|search_results)$/i.test(tpl)
            || !!document.querySelector('.structItem--thread')
        );
        cls.toggle('smg-threadlist', isList);
        cls.toggle('smg-search-page', tpl === 'search_results');
        cls.toggle('smg-search-form', tpl === 'search_form');
        cls.toggle('smg-tv-grid', isList && gmGet('smg-threadview', 'grid') === 'grid');
        cls.toggle('smg-has-sidenav', /^account/i.test(tpl) || !!document.querySelector('.p-body-sideNav'));
    }

    // ===== FASE 1 (document-start): tematiza ANTES da 1ª pintura → mata o flash do site antigo =====
    cls.add(/socialmediagirls/i.test(location.hostname) ? 'smg-smg' : 'smg-sc');  // site
    detectPageClasses();                                  // 1ª passada (URL + data-template)
    if (feedViewWanted()) cls.add('smg-watched-feed');   // feed ligado (home ?view=feed) → CSS esconde o conteúdo nativo JÁ, sem flash (smg-watched-feed = "feed on")
    if (FEATURES.autoFullImages) cls.add('smg-masonry-on');   // "Galeria" (full-res + masonry por post) — masonry atrelado à galeria
    if (FEATURES.unwrapLinks) { bindProxyClick(); handleRedirectPage(); }   // liga o intercept de clique JÁ no document-start (antes do XF) + pula página de aviso
    safe(setupImageClickFeed);
    safe(setupNavigationTransition);
    injectStyles();                                       // CSS já vale enquanto o HTML é parseado
    // Reserve the persisted desktop dock before the body and topbar are built.
    // The panel itself is mounted during boot, but this class prevents its
    // late padding-right from moving the home after the first visible frame.
    if (FEATURES.alertsDock
        && aldockWanted() && aldockFits() && !aldockPhone()) {
        cls.add('smg-aldock-on');
        const isSidebarAlreadyReady = cls.contains('smg-sidebar-ready') || (isSidebarReady());
        if (!isSidebarAlreadyReady) {
            cls.add('smg-sidebar-loading');
            cls.add('smg-sidebar-pending');
        }
    } else {
        markSidebarReady();
    }
    ensurePageSkeleton();
    if (FEATURES.topBar) cls.add('smg-topbar-on');        // esconde o header nativo já (reserva o espaço)
    // The tiny preflight from the header can leave now that the complete CSS is
    // active and the pending shell, when needed, already owns the viewport.
    releaseCriticalPaintGate();

    // Inicia o observador de mutações progressivo JÁ no document-start
    // Conforme o HTML do streaming chega, os nós são processados no próximo rAF sem esperar DOMContentLoaded.
    // Depois do boot ele passa a olhar só o miolo (.p-body): topbar, dock e skeleton não disparam processAll.
    const earlyObs = new MutationObserver(scheduleRun);
    earlyObs.observe(document.documentElement, { childList: true, subtree: true });
    let earlyObsRoot = document.documentElement;
    function observePageContent() {
        const next = document.querySelector('.p-body');
        if (!next || next === earlyObsRoot) return;
        earlyObs.disconnect();
        earlyObs.observe(next, { childList: true, subtree: true });
        earlyObsRoot = next;
    }

    // DEEP-LINK (notificação/permalink → #post-X ou /posts/X): ao cair fundo na thread,
    // processa o post-alvo primeiro e faz o scroll suave inicial uma única vez
    // sem sequestrar a rolagem do usuário.
    function pinDeepLinkPost() {
        const h = (location.hash || '').replace(/^#/, '');
        const hasHashTarget = h && /^(?:js-)?(?:post|comment|post-comment)-\d+$/.test(h);
        const hasPathTarget = /\/(?:posts|post)[/-]?\d+/i.test(location.pathname)
            || (location.pathname.includes('/goto/') && /[?&]id=\d+/i.test(location.search));
        if (!hasHashTarget && !hasPathTarget) return;
        const target = (findTargetPost())
            || (h && (document.getElementById(h) || document.querySelector('[data-content="' + h.replace(/^js-/, '') + '"]')));
        const post = target && (target.closest ? (target.closest('article.message, .message--post, .comment, .message-responseRow') || target) : target);
        if (!post) return;
        safe(processAll, [post]);   // a mídia do post VISÍVEL monta antes do scan completo
        if (document.documentElement.classList.contains('smg-page-pending')) return;
        try {
            post.scrollIntoView({ block: 'start', behavior: 'instant' });
        } catch (e) {}
    }
    function resolvePostIdFromHref(href) {
        if (!href || typeof href !== 'string') return null;
        const hashMatch = href.match(/#(?:js-)?(?:post|comment|post-comment)-(\d+)/i);
        if (hashMatch) return hashMatch[1];
        const pathMatch = href.match(/\/(?:posts|post)[/-]?(\d+)/i);
        if (pathMatch) return pathMatch[1];
        if (href.includes('/goto/')) {
            const gotoMatch = href.match(/[?&]id=(\d+)/i);
            if (gotoMatch) return gotoMatch[1];
        }
        const queryMatch = href.match(/[?&](?:posts|post)[/-]?(\d+)/i);
        if (queryMatch) return queryMatch[1];
        return null;
    }

    function findPostElementById(pid) {
        if (!pid) return null;
        const el = document.getElementById('post-' + pid)
            || document.getElementById('js-post-' + pid)
            || document.querySelector('[data-content="post-' + pid + '"]')
            || document.querySelector('article.message[data-content*="' + pid + '"]');
        return el ? (el.closest('article.message, .message--post, .comment, .message-responseRow') || el) : null;
    }

    // INTERCEPTOR GLOBAL DE CLIQUES EM POSTS/THREADS:
    // Qualquer link no site (quote, notificação, menção, permalink, etc.) que aponte para um
    // post já presente no DOM da página atual é rolado suavemente com estabilizador de scroll,
    // sem disparar recarregamento desnecessário nem layout shift.
    function handleInPagePostClick(e) {
        if (e.defaultPrevented) return;
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || (e.button && e.button !== 0)) return;
        const a = e.target && e.target.closest && e.target.closest('a[href]');
        if (!a) return;
        const href = a.getAttribute('href') || a.href || '';
        if (!document.documentElement.classList.contains('smg-thread')) return;
        const pid = resolvePostIdFromHref(href);
        if (!pid) return;
        const postEl = findPostElementById(pid);
        if (postEl) {
            e.preventDefault();
            if (aldockPhone()) {
                closeAlertsDock();
            }
            try {
                postEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (err) {}
            try {
                history.replaceState(null, '', '#post-' + pid);
            } catch (err) {}
            postEl.classList.add('is-target');
            setTimeout(() => { postEl.classList.remove('is-target'); }, 2000);
        }
    }

    document.addEventListener('click', handleInPagePostClick);
    window.addEventListener('hashchange', () => {
        const target = (findTargetPost());
        if (target && !document.documentElement.classList.contains('smg-page-pending')) {
            try { target.scrollIntoView({ block: 'start', behavior: 'instant' }); } catch (err) {}
        }
    });
    // ===== FASE 2 (DOM pronto): re-detecta (DOM) + monta os componentes (topbar/dock/filter bar) =====
    function boot() {
        safe(handleCrossSiteSearch);
        if (FEATURES.unwrapLinks) handleRedirectPage();
        detectPageClasses();
        if (FEATURES.topBar && !document.querySelector('.p-nav')) cls.remove('smg-topbar-on');

        // Componentes Estáticos Globais (1x)
        if (FEATURES.topBar) safe(buildTopbar);
        safe(setupPostNavigation);
        if (FEATURES.keyboardShortcuts) safe(setupKeyboardShortcuts);
        safe(setupImageClickFeed);
        if (FEATURES.alertsDock) safe(setupAlertsDock);
        if (FEATURES.headerNotices) safe(setupHeaderNotices);
        if (FEATURES.infiniteScroll) safe(setupInfiniteScroll);
        safe(watchNativeBadges);
        safe(restoreNavMode);

        if (feedContext()) safe(setupFeedView);
        if (isBookmarksPage() && FEATURES.bookmarksFeed) safe(setupBookmarksFeed);
        if (isThreadRoute()) safe(ingestCurrentThreadPageIfFollowed);
        safe(pinDeepLinkPost);
        safe(startTimelineCron);

        processAll([document.body]);
        observePageContent();
        schedulePagePaintRelease();
    }

    // Navegação interna: troca só o .p-body. Topbar, dock de notificações e navbar ficam no documento.
    // Logout, login, editor e anexos continuam como carregamento inteiro.
    let softNavToken = 0;
    let softNavUsed = false;
    let softNavUrl = location.pathname + location.search;
    const SOFT_PAGE_CLASSES = [
        'smg-home', 'smg-home-page', 'smg-home-pending', 'smg-home-ready',
        'smg-thread', 'smg-threadlist', 'smg-tv-grid', 'smg-search-page', 'smg-search-form',
        'smg-has-sidenav', 'smg-watched-feed', 'smg-bm-feed-on',
        'smg-page-home', 'smg-page-thread', 'smg-page-listing', 'smg-page-following',
        'smg-page-timeline', 'smg-page-bookmarks'
    ];

    function copyNativeBadge(selector, doc) {
        const next = doc.querySelector(selector);
        const live = document.querySelector(selector);
        if (!next || !live) return;
        if (next.hasAttribute('data-badge')) live.setAttribute('data-badge', next.getAttribute('data-badge') || '');
        else live.removeAttribute('data-badge');
    }

    function resetSwappedPage() {
        SOFT_PAGE_CLASSES.forEach(name => cls.remove(name));
        homeSidebarDone = false;
        homeFeedDone = false;
        homePassSignature = null;
        riverSetupDone = false;
        riverBuilt = false;
        riverList = null;
        riverHost = null;
        const staleRiver = document.getElementById('smg-river');
        if (staleRiver) staleRiver.remove();
        bmBuilt = false;
        bmRendered = false;   // 2ª visita aos Salvos via soft-nav: sem isso o render nunca rodava e a lista ficava vazia
        disposeInfiniteScroll();
        disposeStickySyncs();
        smgPopPrune();
        contentIsReady = false;
    }

    // ── XF depois da troca do .p-body ──
    // O XF 2.3 declara no <head> de cada página o JS/CSS PRÓPRIO dela (XF.config.js / XF.config.css:
    // message.js, o editor Froala, quick-reply…). A soft-nav troca só o .p-body, então esses assets
    // nunca carregavam: o XF.activate achava textarea[data-xf-init="editor"] sem handler registrado e
    // não fazia nada (sobrava a moldura do quick reply, sem toolbar nem área editável). Agora o
    // XF.Loader carrega o que falta (ele ignora o que já está carregado) e só então ativa o .p-body.
    function xfPageAssets(doc) {
        const out = { js: [], css: [] };
        if (!doc) return out;
        const scripts = doc.querySelectorAll('script:not([src])');
        for (const s of scripts) {
            const text = s.textContent || '';
            if (text.indexOf('XF.config') < 0) continue;
            let found = false;
            ['js', 'css'].forEach(key => {
                const m = text.match(new RegExp('^\\s*' + key + ':\\s*(\\{.*\\}),?\\s*$', 'm'));
                if (!m) return;
                try { out[key] = Object.keys(JSON.parse(m[1])); found = true; } catch (e) {}
            });
            if (found) break;
        }
        return out;
    }

    // A ativação roda no mundo da PÁGINA: com @grant o gerenciador pode isolar o script e esconder
    // window.XF. A ponte é um <script> inline (a CSP desses fóruns só tem upgrade-insecure-requests).
    const XF_BRIDGE_ATTR = 'data-smg-xf-bridge';
    const XF_BRIDGE_SRC = `(function () {
        if (document.documentElement.hasAttribute('${XF_BRIDGE_ATTR}')) return;
        document.documentElement.setAttribute('${XF_BRIDGE_ATTR}', '1');
        document.addEventListener('smg-xf-activate', function (ev) {
            var req = {};
            try { req = JSON.parse(ev.detail || '{}') || {}; } catch (e) {}
            var XF = window.XF;
            if (!XF || typeof XF.activate !== 'function') return;
            var run = function () {
                var body = document.querySelector('.p-body');
                if (!body || document.documentElement.getAttribute('data-smg-xf-nav') !== String(req.token)) return;
                try { XF.activate(body); } catch (e) { console.warn('[SMG] XF.activate falhou após a navegação:', e); }
            };
            var js = req.js || [], css = req.css || [];
            if ((js.length || css.length) && XF.Loader && typeof XF.Loader.load === 'function') {
                try { XF.Loader.load(js, css, run); return; } catch (e) { console.warn('[SMG] XF.Loader falhou:', e); }
            }
            run();
        });
    })();`;

    function ensureXfBridge() {
        const root = document.documentElement;
        if (root.hasAttribute(XF_BRIDGE_ATTR)) return true;
        try {
            const s = document.createElement('script');
            s.textContent = XF_BRIDGE_SRC;
            (document.head || root).appendChild(s);
            s.remove();
        } catch (e) {}
        return root.hasAttribute(XF_BRIDGE_ATTR);
    }

    function activateXfPage(doc, token) {
        const assets = xfPageAssets(doc);
        document.documentElement.setAttribute('data-smg-xf-nav', String(token));
        if (ensureXfBridge()) {
            document.dispatchEvent(new CustomEvent('smg-xf-activate', {
                detail: JSON.stringify({ js: assets.js, css: assets.css, token: token })
            }));
            return;
        }
        // sem ponte (script inline bloqueado): mesmo caminho, direto do sandbox
        const XF = window.XF;
        if (!XF || typeof XF.activate !== 'function') return;
        const run = () => {
            const body = document.querySelector('.p-body');
            if (token !== softNavToken || !body) return;
            try { XF.activate(body); } catch (e) { console.warn('[SMG] XF.activate falhou após a navegação:', e); }
        };
        if ((assets.js.length || assets.css.length) && XF.Loader && typeof XF.Loader.load === 'function') {
            try { XF.Loader.load(assets.js, assets.css, run); return; } catch (e) {}
        }
        run();
    }

    function softNavigate(url, opts) {
        opts = opts || {};
        let abs;
        try { abs = new URL(url, location.href); } catch (e) { location.href = url; return; }
        if (abs.origin !== location.origin) { location.href = abs.href; return; }
        const token = ++softNavToken;
        stopWatchedStream();
        document.dispatchEvent(new Event('smg-search-close'));
        const root = document.documentElement;
        cancelPagePaintRelease();
        isNavigatingOut = false;
        root.classList.add('smg-page-pending', 'smg-content-pending');
        root.classList.remove('smg-page-ready', 'smg-content-ready', 'smg-home-ready');
        contentIsReady = false;
        // skeleton da página de DESTINO durante o fetch (antes: o da página que estava saindo, e nenhum ao sair da home)
        const target = classifyPaintPage({ pathname: abs.pathname, search: abs.search, template: '' });
        ensurePageSkeleton(target.gated ? target.kind : PAINT_PAGE_KINDS.GENERIC);
        try { history.scrollRestoration = 'manual'; } catch (e) {}
        try { window.scrollTo(0, 0); } catch (e) {}
        fetchDoc(abs.href, { credentials: 'same-origin' }).then(doc => {
            if (token !== softNavToken) return;
            const nextBodies = doc ? Array.from(doc.querySelectorAll('.p-body')) : [];
            const curBodies = Array.from(document.querySelectorAll('.p-body'));
            if (!doc || !nextBodies.length || !curBodies.length) {
                try { location.href = abs.href; } catch (e) {}
                return;
            }
            const bodySize = el => (el.innerHTML || '').length;
            const nextBody = nextBodies.reduce((best, el) => bodySize(el) > bodySize(best) ? el : best);
            const curBody = curBodies.reduce((best, el) => bodySize(el) > bodySize(best) ? el : best);
            const freshBody = document.importNode(nextBody, true);
            curBody.replaceWith(freshBody);
            curBodies.forEach(el => { if (el.isConnected) el.remove(); });
            document.querySelectorAll('.smg-feed-block, [data-smg-home-hub], #smg-river').forEach(el => {
                if (!freshBody.contains(el)) el.remove();
            });
            if (doc.body && doc.body.className) document.body.className = doc.body.className;
            ['data-template', 'data-csrf', 'data-app', 'data-cookie-prefix', 'data-container-key', 'data-content-key'].forEach(attr => {
                const value = doc.documentElement.getAttribute(attr);
                if (value != null) root.setAttribute(attr, value);
            });
            const csrf = doc.documentElement.getAttribute('data-csrf');
            if (csrf && window.XF && window.XF.config) window.XF.config.csrf = csrf;
            const title = doc.querySelector('title');
            if (title && title.textContent) document.title = title.textContent;
            copyNativeBadge('.p-navgroup-link--alerts', doc);
            syncReactiveBadges();
            const nextUrl = abs.pathname + abs.search;
            softNavUrl = nextUrl;
            if (opts.push !== false) {
                softNavUsed = true;
                try { history.pushState({ smgSoft: true }, '', abs.pathname + abs.search + abs.hash); } catch (e) {}
            }
            resetSwappedPage();
            detectPageClasses();
            if (FEATURES.alertsDock && aldockBound) safe(aldockReconcile, true);   // /account/alerts esconde o rail
            cls.toggle('smg-watched-feed', feedViewWanted());
            if (!feedViewWanted()) {
                document.querySelectorAll('.smg-river-hide').forEach(el => el.classList.remove('smg-river-hide'));
            }
            ensurePageSkeleton();   // mesmo tipo → mantém o mesmo skeleton (sem piscar); tipo diferente → troca
            activateXfPage(doc, token);
            if (feedContext()) safe(setupFeedView);
            if (isBookmarksPage() && FEATURES.bookmarksFeed) safe(setupBookmarksFeed);
            if (FEATURES.headerNotices) safe(setupHeaderNotices);
            if (FEATURES.infiniteScroll) safe(setupInfiniteScroll);
            if (isThreadRoute()) safe(ingestCurrentThreadPageIfFollowed);
            safe(pinDeepLinkPost);
            safe(syncMobileThreadbar);
            if (typeof window.smgRefreshDockPage === 'function') window.smgRefreshDockPage();
            if (window.smgAlertsNeedRefresh) {
                window.smgAlertsNeedRefresh = false;
                if (typeof window.smgRefreshAlertsDock === 'function') window.smgRefreshAlertsDock();
            }
            processAll([document.body]);
            observePageContent();
            schedulePagePaintRelease();
        });
    }
    window.smgSoftNavigate = softNavigate;

    // THE test hook: the scenario suite (scripts/xenforo/tests) sets window.__SMG_TEST__ before the script
    // runs, to reach the units no page shows directly (placement math, the pager engine). Everything else
    // is tested through the DOM. Do not add other window exports for tests.
    if (window.__SMG_TEST__ === true) window.__smgTest = Object.freeze({ masonryPlace, createPager });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }

    window.addEventListener('popstate', () => {
        if (!softNavUsed) return;
        const now = location.pathname + location.search;
        if (now === softNavUrl) return;
        softNavigate(location.href, { push: false });
    });
})();
