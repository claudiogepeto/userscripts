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
        const isThreadRoute = !/\/watched\//.test(path)
            && (/\/(?:threads|posts|goto)(?:\/|$)/.test(path) || /[?&](?:threads|posts|goto)(?:\/|$)/.test(location.search || ''));
        const isThread = paintContext.kind === PAINT_PAGE_KINDS.THREAD || cls.contains('smg-thread') || isThreadRoute;
        const isThreadList = [PAINT_PAGE_KINDS.LISTING, PAINT_PAGE_KINDS.FOLLOWING].includes(paintContext.kind)
            || cls.contains('smg-threadlist') || /\/forums\//.test(path) || /\/watched\//.test(path);
        const isHome = paintContext.kind === PAINT_PAGE_KINDS.HOME || (cls.contains('smg-home') && !cls.contains('smg-watched-feed'));
        const isAlerts = /\/account\/alerts/i.test(path);
        const isBookmarks = isBookmarksPage();
        const isSearch = /\/search\//i.test(path);
        const isContentFeed = isThread || isBookmarks || (typeof feedContext === 'function' && feedContext());
        const contentDirty = fullScan || threadDirty || (isBookmarks && listDirty) || (typeof feedContext === 'function' && feedContext());

        if (isContentFeed && contentDirty) {
            if (FEATURES.autoFullImages || FEATURES.replaceThumbsWithFull) safe(unlazyImageLinks, roots);
            if (FEATURES.unwrapLinks) safe(unwrapRedirectLinks, roots);
            if (FEATURES.autoFullImages || FEATURES.replaceThumbsWithFull) safe(processImages, roots);
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
                safe(buildPostCards, roots);
                safe(buildCommentCards, roots);
                safe(buildCommentBar, roots);
            }
            if (authorFilter) safe(applyAuthorFilter);
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
        const currentHomeSignature = homeCandidate && typeof homeLayoutSignature === 'function' ? homeLayoutSignature() : null;
        const homeDirty = homeCandidate
            && (homePassSignature !== currentHomeSignature || rootTouches(roots, '.node--link, .node-subNodesFlat', true));
        if (homeCandidate && !homeSidebarDone) safe(layoutHomeSidebar, roots);
        if (isHome && homeDirty) {
            homePassSignature = currentHomeSignature;
            safe(markHomeAdBlocks);
            safe(relocateSimpcityNodes, roots);
            safe(mergeSmallHomeSections, roots);
            safe(expandSubForums, roots);
            safe(relocateSmgNodes, roots);
            safe(splitTransSection, roots);
            safe(sortHomeCards, roots);
            safe(reorderHomeSections, roots);
            safe(makeHomeCardsClickable, roots);
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
    // Coleta os subtrees ADICIONADOS → os passes de conteúdo varrem só eles (scope), não o documento
    // inteiro a cada frame. A cada FULL_SCAN_EVERY runs (ou quando não houve adição) faz 1 full-scan de
    // segurança — pega nós que o scope não enxergou (ex.: match por atributo que mudou depois).
    let scheduled = false, dirtyRoots = new Set(), runCount = 0, fullPending = false, fullT = 0;
    const FULL_SCAN_EVERY = 60;   // PERF: reduz a frequência de varredura global do body inteiro para 60 ticks, mantendo passes escopados nos dirtyRoots

    function scheduleRun(mutations) {
        if (mutations) for (const m of mutations) {
            if (m.target && m.target.nodeType === 1) dirtyRoots.add(m.target);
            for (const n of m.addedNodes) if (n.nodeType === 1) dirtyRoots.add(n);
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
            const full = (++runCount % FULL_SCAN_EVERY === 0) || fullPending;
            // frame SEM nó adicionado (remoção pura — spinner/freeze do feed — ou troca de text node):
            // não há nada novo pra processar; o full-scan imediato aqui varria o body INTEIRO a cada
            // tick (ex.: scroll no feed congelando cards = vários full-scans/s). Backstop preservado:
            // agenda UM full-scan coalescido (máx 1 a cada ~600ms) p/ os casos raros de match por atributo.
            if (!full && !dirtyRoots.size) {
                if (!fullT) fullT = setTimeout(() => { fullT = 0; fullPending = true; scheduleRun(); }, 600);
                return;
            }
            fullPending = false;
            const roots = full ? [document.body] : [...dirtyRoots];
            dirtyRoots = new Set();
            processAll(roots);
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
        const isForumHome = tpl === 'forum_list' || isHomePath;
        if (isForumHome) cls.add('smg-home-page'); // a URL identifica a home antes do data-template
        const paintContext = classifyPaintPage({ pathname: path, search: location.search, template: tpl });
        ['home', 'thread', 'listing', 'following', 'timeline', 'bookmarks'].forEach(kind => cls.toggle('smg-page-' + kind, paintContext.kind === kind));
        if (paintContext.gated) cls.add('smg-page-pending');
        if (isForumHome && !isFeedView && FEATURES.homeRemake) {
            cls.add('smg-home');
            cls.add('smg-home-pending');
        }
        const isThreadRoute = !/\/watched\//.test(path)
            && (/\/(?:threads|posts|goto)(?:\/|$)/.test(path) || /[?&](?:threads|posts|goto)(?:\/|$)/.test(location.search || ''));
        if (/^thread_view/i.test(tpl) || isThreadRoute) cls.add('smg-thread');
        const isList = /\/(?:watched|whats-new|forums|tags|categories)(\/|$)/i.test(path)
            || /^(?:forum_view|watched_threads_list|search_results)$/i.test(tpl)
            || !!document.querySelector('.structItem--thread');
        if (isList) cls.add('smg-threadlist');
        if (tpl === 'search_results') cls.add('smg-search-page');   // página de resultados: painel inline + lista re-tematizada (CSS)
        if (tpl === 'search_form') cls.add('smg-search-form');      // form de busca avançada: re-tematizado (CSS; widgets do XF intactos)
        if (cls.contains('smg-threadlist') && gmGet('smg-threadview', 'grid') === 'grid') cls.add('smg-tv-grid');
        // página com menu lateral legítimo (conta/settings) → flag estática p/ o CSS (substitui o
        // :not(:has(.p-body-sideNav)) ancorado no .p-body-main, que re-validava a cada mutação da thread)
        if (/^account/i.test(tpl) || document.querySelector('.p-body-sideNav')) cls.add('smg-has-sidenav');
    }

    // ===== FASE 1 (document-start): tematiza ANTES da 1ª pintura → mata o flash do site antigo =====
    cls.add(/socialmediagirls/i.test(location.hostname) ? 'smg-smg' : 'smg-sc');  // site
    detectPageClasses();                                  // 1ª passada (URL + data-template)
    if (feedViewWanted()) cls.add('smg-watched-feed');   // feed ligado (home ?view=feed) → CSS esconde o conteúdo nativo JÁ, sem flash (smg-watched-feed = "feed on")
    if (FEATURES.autoFullImages) cls.add('smg-masonry-on');   // "Galeria" (full-res + masonry por post) — masonry atrelado à galeria
    if (FEATURES.unwrapLinks) { bindProxyClick(); handleRedirectPage(); }   // liga o intercept de clique JÁ no document-start (antes do XF) + pula página de aviso
    if (FEATURES.imageLightbox) safe(setupImageClickFeed);
    safe(setupNavigationTransition);
    injectStyles();                                       // CSS já vale enquanto o HTML é parseado
    // Reserve the persisted desktop dock before the body and topbar are built.
    // The panel itself is mounted during boot, but this class prevents its
    // late padding-right from moving the home after the first visible frame.
    if (FEATURES.alertsDock && typeof aldockWanted === 'function'
        && aldockWanted() && aldockFits() && !aldockPhone()) {
        cls.add('smg-aldock-on');
    }
    ensurePageSkeleton();
    if (FEATURES.topBar) cls.add('smg-topbar-on');        // esconde o header nativo já (reserva o espaço)
    // The tiny preflight from the header can leave now that the complete CSS is
    // active and the pending shell, when needed, already owns the viewport.
    releaseCriticalPaintGate();

    // Inicia o observador de mutações progressivo JÁ no document-start
    // Conforme o HTML do streaming chega, os nós são processados no próximo rAF sem esperar DOMContentLoaded
    const earlyObs = new MutationObserver(scheduleRun);
    earlyObs.observe(document.documentElement, { childList: true, subtree: true });

    // SCROLL STABILIZER: media, embeds, post cards and galleries finish sizing AFTER the first paint, and
    // everything above the viewport growing pushes the reading position down (opening on the last post ended
    // mid-thread). Native scroll anchoring cannot help because the script rebuilds posts (the anchor node is
    // replaced). So the post the reader landed on is pinned at its original viewport offset: every layout change
    // (ResizeObserver runs before paint, so there is no visible jump) and every late image/video load
    // re-aligns it. It lets go IMMEDIATELY on ANY user input (wheel, touch, click, scroll, key), or after
    // a brief safety deadline (2.5s), never fighting against user scrolling.
    let activeScrollStabilizer = null;

    function armScrollStabilizer(target) {
        if (!target || !target.isConnected || typeof ResizeObserver !== 'function') return;
        if (activeScrollStabilizer) {
            activeScrollStabilizer.stop();
            activeScrollStabilizer = null;
        }

        const PIN_MAX_MS = 1200;
        const startedAt = Date.now();
        let wantTop = target.getBoundingClientRect().top;
        let done = false;
        let adjusting = false;
        let ro = null;

        const stabilizerObj = {
            stop: () => stop(),
            isActive: () => !done
        };

        const stop = () => {
            if (done) return;
            done = true;
            if (activeScrollStabilizer === stabilizerObj) {
                activeScrollStabilizer = null;
            }
            if (ro) ro.disconnect();
            const inputs = ['wheel', 'touchstart', 'touchmove', 'pointerdown', 'mousedown', 'keydown'];
            inputs.forEach(ev => window.removeEventListener(ev, stop, true));
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('load', onLoad, true);
            document.removeEventListener('load', realign, true);
        };

        const onScroll = () => {
            if (done) return;
            if (!adjusting) {
                // Rolagem iniciada pelo usuário: solta o controle instantaneamente
                stop();
            }
        };

        const realign = () => {
            if (done) return;
            if (Date.now() - startedAt > PIN_MAX_MS || !target.isConnected) { stop(); return; }
            const currentTop = target.getBoundingClientRect().top;
            const delta = currentTop - wantTop;
            if (Math.abs(delta) > 1) {
                adjusting = true;
                window.scrollBy(0, delta);
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        adjusting = false;
                    });
                });
            }
        };

        const onLoad = () => realign();

        const inputs = ['wheel', 'touchstart', 'touchmove', 'pointerdown', 'mousedown', 'keydown'];
        inputs.forEach(ev => window.addEventListener(ev, stop, { capture: true, passive: true }));
        window.addEventListener('scroll', onScroll, { capture: true, passive: true });
        document.addEventListener('load', realign, true);   // <img>/<video>/<iframe> loads do not bubble → capture
        window.addEventListener('load', onLoad, true);

        ro = new ResizeObserver(realign);
        ro.observe(document.documentElement);
        const root = document.querySelector('.block--messages, .block-body--messages, .p-body-content');
        if (root) ro.observe(root);

        activeScrollStabilizer = stabilizerObj;
        setTimeout(stop, PIN_MAX_MS + 200);
        return stabilizerObj;
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
        const target = (typeof findTargetPost === 'function' ? findTargetPost() : null)
            || (h && (document.getElementById(h) || document.querySelector('[data-content="' + h.replace(/^js-/, '') + '"]')));
        const post = target && (target.closest ? (target.closest('article.message, .message--post, .comment, .message-responseRow') || target) : target);
        if (!post) return;
        safe(processAll, [post]);   // a mídia do post VISÍVEL monta antes do scan completo
        try {
            post.scrollIntoView({ block: 'start', behavior: 'instant' });
        } catch (e) {}
        safe(armScrollStabilizer, post);
    }
    // No hash (reload / browser scroll restoration / unread jump): pin whichever post sits at the top of the viewport.
    function pinRestoredPost() {
        if (!cls.contains('smg-thread') || (location.hash || '').length > 1 || window.scrollY < 80) return;
        const posts = document.querySelectorAll('article.message');
        for (const post of posts) {
            const r = post.getBoundingClientRect();
            if (r.bottom > 70) { safe(armScrollStabilizer, post); return; }
        }
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
        const pid = resolvePostIdFromHref(href);
        if (!pid) return;
        const postEl = findPostElementById(pid);
        if (postEl) {
            e.preventDefault();
            if (typeof aldockPhone === 'function' && aldockPhone() && typeof closeAlertsDock === 'function') {
                closeAlertsDock();
            }
            try {
                postEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (err) {}
            if (typeof armScrollStabilizer === 'function') {
                armScrollStabilizer(postEl);
            }
            try {
                history.replaceState(null, '', '#post-' + pid);
            } catch (err) {}
            postEl.classList.add('is-target');
            setTimeout(() => { postEl.classList.remove('is-target'); }, 2000);
        }
    }

    document.addEventListener('click', handleInPagePostClick);
    window.addEventListener('hashchange', () => {
        const target = (typeof findTargetPost === 'function' ? findTargetPost() : null);
        if (target && typeof armScrollStabilizer === 'function') {
            armScrollStabilizer(target);
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
        if (FEATURES.sidebarNavigation) safe(setupPostNavigation);
        if (FEATURES.keyboardShortcuts) safe(setupKeyboardShortcuts);
        if (FEATURES.imageLightbox) safe(setupImageClickFeed);
        if (FEATURES.alertsDock) safe(setupAlertsDock);
        if (FEATURES.headerNotices) safe(setupHeaderNotices);
        if (FEATURES.infiniteScroll) safe(setupInfiniteScroll);
        if (FEATURES.autoSearchTitleOnly) safe(enableSearchTitlesOnly);
        safe(watchNativeBadges);
        safe(restoreNavMode);

        if (feedContext()) safe(setupFeedView);
        if (isBookmarksPage() && FEATURES.bookmarksFeed) safe(setupBookmarksFeed);
        if (!/\/watched\//.test(location.pathname) && (/\/(?:threads|posts|goto)(?:\/|$)/.test(location.pathname) || /[?&](?:threads|posts|goto)(?:\/|$)/.test(location.search || ''))) safe(harvestCurrentThreadPage);
        safe(pinDeepLinkPost);
        safe(pinRestoredPost);
        safe(startTimelineCron);

        processAll([document.body]);
    }

    if (typeof window !== 'undefined' && window.__TEST_MODE__) {
        window.__processAll = processAll;
        window.__performanceExports = Object.assign(window.__performanceExports || {}, { normalizeRoots, eachIn, makeTaskQueue, rootTouches });
        window.__processImagepondNativeEmbeds = processImagepondNativeEmbeds;
        window.buildPostGalleries = buildPostGalleries;
        window.__buildPostGalleries = buildPostGalleries;
        window.__inPagePostExports = { resolvePostIdFromHref, findPostElementById, handleInPagePostClick, armScrollStabilizer, getActiveScrollStabilizer: () => activeScrollStabilizer };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();
