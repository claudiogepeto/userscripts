    // =========================================================
    // DOCK — navegação (setupPostNavigation): a barra flutuante + busca + filtros + sheet mobile.
    // É a MAIOR função do arquivo. Mapa interno (Cmd+F no texto "// ----"):
    //   layout ....... links da página · page jump · botões · navegação global · navbar mobile · montagem
    //   estado ....... estado da dock · bottom sheet (mobile)
    //   popovers ..... goto · search (+ histórico compartilhado) · settings · filtro por autor · filtro da listagem
    //   posts ........ helpers de post · navegação entre posts · share · save · watch thread · paginação · sort
    //   init ......... estado inicial + atualização dos botões no scroll
    const PREFIX_MAP_STORAGE_KEY = 'smg_known_prefix_ids';
    let globalPrefixMap = new Map();
    try {
        const saved = localStorage.getItem(PREFIX_MAP_STORAGE_KEY);
        if (saved) globalPrefixMap = new Map(JSON.parse(saved));
    } catch (e) {}

    function saveGlobalPrefixMap() {
        try {
            localStorage.setItem(PREFIX_MAP_STORAGE_KEY, JSON.stringify(Array.from(globalPrefixMap.entries())));
        } catch (e) {}
    }

    function harvestPrefixesFromDoc(doc) {
        if (!doc) return;
        doc.querySelectorAll('select[name="c[prefixes][]"] option, select[name="prefix_id[]"] option, select[name*="prefix"] option').forEach(opt => {
            const val = opt.value;
            const text = (opt.textContent || '').replace(/\s+/g, ' ').trim();
            if (val && val !== '-1' && val !== '' && !isNaN(val) && text) {
                const k = text.toLowerCase().replace(/^[#\s\[\]]+|[#\s\[\]]+$/g, '').trim();
                globalPrefixMap.set(k, String(val));
            }
        });
        if (globalPrefixMap.size > 0) saveGlobalPrefixMap();
    }

    function refreshPrefixHarvest(cb) {
        if (globalPrefixMap.size < 10) {
            fetch('/search/?type=post', { credentials: 'same-origin' })
                .then(r => r.text())
                .then(html => {
                    harvestPrefixesFromDoc(new DOMParser().parseFromString(html, 'text/html'));
                    if (typeof cb === 'function') cb();
                })
                .catch(() => {
                    fetch('/search/', { credentials: 'same-origin' })
                        .then(r => r.text())
                        .then(html => {
                            harvestPrefixesFromDoc(new DOMParser().parseFromString(html, 'text/html'));
                            if (typeof cb === 'function') cb();
                        })
                        .catch(() => {});
                });
        }
    }

    // Coleta do DOM atual (prefixos remotos são colhidos lazily ao abrir busca/filtros)
    harvestPrefixesFromDoc(document);

    if (typeof window !== 'undefined' && window.__TEST_MODE__) {
        window.__prefixExports = {
            harvestPrefixesFromDoc,
            globalPrefixMap,
            refreshPrefixHarvest
        };
    }

    function setupPostNavigation() {
        // já montado: sai cedo (não re-escaneia posts a cada mutação)
        if (document.getElementById('smg-post-nav-wrapper')) {
            if (typeof window.smgRefreshDockPage === 'function') window.smgRefreshDockPage();
            markNavbarReady();
            return;
        }

        // anchors de cada post (ignora respostas em quote)
        let posts = Array.from(
            document.querySelectorAll('span.u-anchorTarget[id^="post-"]')
        ).filter(el => !el.closest('.message-responseRow'));

        // fallback
        if (posts.length === 0) {
            posts = Array.from(document.querySelectorAll('.message'));
        }

        // dock é global: monta em qualquer página. Os grupos de navegação/ação
        // (e a fiação deles) só fazem sentido numa thread.
        const onThreadUrl = /\/threads\//.test(location.pathname);
        if (onThreadUrl && posts.length === 0) return; // espera os posts da thread carregarem
        const isThread = onThreadUrl && posts.length > 0;

        posts.forEach(el => {
            if (el instanceof HTMLElement) el.style.scrollMarginTop = '0px';
        });

        // ---- links da página (casados por CLASSE/HREF, não por texto → funcionam em PT, EN, etc.) ----
        // sort tabs / URLs: a de reação tem ?order=reaction_score no href; a de data é a sem order=
        function getSortHref(wantDate) {
            let dateHref = null, reactHref = null;
            document.querySelectorAll('.tabs--standalone .tabs-tab, .block-outer-opposite--postSortFilter .tabs-tab, a.smg-bar-sorttoggle').forEach(t => {
                const h = t.getAttribute('href') || t.href || '';
                if (/order=reaction/i.test(h)) reactHref = h;
                else if (h && !/order=/i.test(h) && /\/threads\//i.test(h)) dateHref = h;
            });
            if (wantDate && dateHref) return dateHref;
            if (!wantDate && reactHref) return reactHref;

            try {
                const u = new URL(window.location.href);
                u.pathname = u.pathname.replace(/\/page-\d+.*$/, '/'); // reseta paginação para o início da thread na nova ordenação (padrão XenForo)
                if (wantDate) {
                    u.searchParams.delete('order');
                } else {
                    u.searchParams.set('order', 'reaction_score');
                }
                u.hash = '';
                return u.toString();
            } catch (e) {
                return null;
            }
        }
        if (typeof window !== 'undefined' && window.__TEST_MODE__) {
            window.__getSortHref = getSortHref;
        }

        let sortIsDate = !/reaction/i.test(window.location.search || '');

        // ---- page jump (goto): página atual (URL) + total, via readPageJump ----
        let pageJump = (() => {
            const pj = readPageJump();
            return pj ? { tpl: pj.tpl, current: pj.cur, max: pj.max } : null;
        })();

        // ---- botões ----
        let btnWatchM, btnSortM, btnViewModeM, btnListFilterM, btnListSortM, btnViewToggleM;
        const btnSearch = makeDockButton({ id: 'smg-thread-search', icon: ICONS.search, label: 'Search' });
        const btnWatch = makeDockButton({
            id: 'smg-thread-watch',
            icon: ICONS.watch,
            label: IS_PT ? 'Seguir este tópico (receber notificações)' : 'Watch thread (receive updates)',
        });
        const sortTip = sortIsDate
            ? (IS_PT ? 'Ordenação atual: por data. Clique para ordenar por reações' : 'Current sort: by date. Click to sort by reactions')
            : (IS_PT ? 'Ordenação atual: por reações. Clique para ordenar por data' : 'Current sort: by reactions. Click to sort by date');
        const btnSort = makeDockButton({ id: 'smg-post-sort-toggle', icon: ICONS.sort, label: sortTip });   // ícone FIXO de ordenação; o critério vem no texto (ver ICONS.sort)
        btnSort.classList.add('smg-nav-labeled', 'smg-sort-pill');   // pílula com o critério escrito (Data/Reações) — deixa claro pelo quê ordena
        const sortTxt = Object.assign(document.createElement('span'), { className: 'smg-nav-btn-text', textContent: i18n(sortIsDate ? 'Date' : 'Reactions') });
        btnSort.appendChild(sortTxt);

        let currentSortOrder = (new URLSearchParams(location.search).get('order')) || 'last_post_date';
        const getListSortLabel = k => {
            if (k === 'first_post_reaction_score') return IS_PT ? 'Curtidas' : 'Likes';
            if (k === 'view_count') return IS_PT ? 'Vistas' : 'Views';
            if (k === 'reply_count') return IS_PT ? 'Respostas' : 'Replies';
            if (k === 'title') return IS_PT ? 'Título' : 'Title';
            return IS_PT ? 'Data' : 'Date';
        };
        const getListSortTip = () => IS_PT
            ? `Ordenação atual: por ${getListSortLabel(currentSortOrder)}. Clique para alternar`
            : `Current sort: by ${getListSortLabel(currentSortOrder)}. Click to change`;
        let listSortTxt = null, listSortTxtM = null;
        const btnPageFirst = makeDockButton({ id: 'smg-post-page-first', icon: ICONS.pageFirst, label: IS_PT ? 'Ir para a primeira página' : 'First page' });
        const btnPagePrev = makeDockButton({ id: 'smg-post-page-prev', icon: ICONS.pagePrev, label: IS_PT ? 'Página anterior' : 'Previous page' });
        const btnPageNext = makeDockButton({ id: 'smg-post-page-next', icon: ICONS.pageNext, label: IS_PT ? 'Próxima página' : 'Next page' });
        const btnPageLast = makeDockButton({ id: 'smg-post-page-last', icon: ICONS.pageLast, label: IS_PT ? 'Ir para a última página' : 'Last page' });
        const btnGoto = makeDockButton({
            id: 'smg-post-goto',
            icon: pageJump ? `${pageJump.current} / ${pageJump.max}` : ICONS.goto,
            label: IS_PT ? 'Pular para página específica' : 'Jump to specific page',
        });
        const btnMobilePageBtn = makeDockButton({
            id: 'smg-mobile-page-btn',
            icon: ICONS.layers,
            label: 'Page navigation',
        });
        btnMobilePageBtn.classList.add('smg-nav-labeled');
        const mobilePageTxt = document.createElement('span');
        mobilePageTxt.className = 'smg-nav-btn-text';
        mobilePageTxt.textContent = pageJump ? `${pageJump.current} / ${pageJump.max}` : '';
        btnMobilePageBtn.appendChild(mobilePageTxt);
        btnMobilePageBtn.classList.toggle('is-off', !pageJump);

        // Popover flutuante de paginação mobile. Os hrefs são reescritos a cada página
        // (paintMobilePager): o HTML do mount não pode continuar apontando pra thread anterior.
        const mobilePagePop = document.createElement('div');
        mobilePagePop.id = 'smg-mobile-page-pop';
        mobilePagePop.className = 'smg-mobile-page-pop';
        mobilePagePop.innerHTML =
            `<a class="smg-mp-btn smg-mp-first" href="#" title="${i18n('First page')}">${ICONS.pageFirst}</a>` +
            `<a class="smg-mp-btn smg-mp-prev" href="#" title="${i18n('Prev page')}">${ICONS.pagePrev}</a>` +
            `<div class="smg-mp-goto">` +
                `<input type="number" class="smg-mobile-page-input" min="1" value="1" aria-label="${i18n('Go to page')}">` +
                `<span class="smg-mp-sep">/</span>` +
                `<span class="smg-mp-max">1</span>` +
                `<button type="button" class="smg-mp-go">${i18n('Go')}</button>` +
            `</div>` +
            `<a class="smg-mp-btn smg-mp-next" href="#" title="${i18n('Next page')}">${ICONS.pageNext}</a>` +
            `<a class="smg-mp-btn smg-mp-last" href="#" title="${i18n('Last page')}">${ICONS.pageLast}</a>` +
            `<button type="button" class="smg-mp-close" aria-label="${i18n('Close')}">${ICONS.close}</button>`;

        function jumpUrl(n) {
            if (!pageJump || !pageJump.tpl || !n) return '';
            let url = n <= 1 ? pageJump.tpl.replace(/\/page-%page%/, '/') : pageJump.tpl.replace('%page%', String(n));
            url = url.replace('%page%', String(n));
            if (location.search && url.indexOf('?') < 0 && /[?&]order=/.test(location.search)) url += location.search;
            return url;
        }
        function paintMobilePager() {
            const pj = pageJump;
            btnMobilePageBtn.classList.toggle('is-off', !pj);
            mobilePageTxt.textContent = pj ? `${pj.current} / ${pj.max}` : '';
            const setA = (sel, n, off) => {
                const a = mobilePagePop.querySelector(sel);
                if (!a) return;
                a.setAttribute('href', (pj && !off) ? (jumpUrl(n) || '#') : '#');
                a.toggleAttribute('disabled', !pj || off);
            };
            setA('.smg-mp-first', 1, !pj || pj.current <= 1);
            setA('.smg-mp-prev', pj ? Math.max(1, pj.current - 1) : 1, !pj || pj.current <= 1);
            setA('.smg-mp-next', pj ? pj.current + 1 : 1, !pj || pj.current >= pj.max);
            setA('.smg-mp-last', pj ? pj.max : 1, !pj || pj.current >= pj.max);
            const mx = mobilePagePop.querySelector('.smg-mp-max');
            if (mx) mx.textContent = pj ? String(pj.max || 1) : '1';
            const inp = mobilePagePop.querySelector('.smg-mobile-page-input');
            if (inp) {
                inp.max = pj ? String(pj.max || '') : '';
                if (pj) inp.value = pj.current;
            }
            if (!pj) {
                mobilePagePop.classList.remove('open');
                btnMobilePageBtn.classList.remove('smg-active');
            }
        }
        paintMobilePager();

        const mpInput = mobilePagePop.querySelector('.smg-mobile-page-input');
        const mpGo = mobilePagePop.querySelector('.smg-mp-go');
        const mpClose = mobilePagePop.querySelector('.smg-mp-close');
        const doMpNav = () => {
            const n = clampPage(parseInt(mpInput.value, 10));
            if (!n || !pageJump || !pageJump.tpl) return;
            if (typeof window.setNavigatingOut === 'function') window.setNavigatingOut();
            document.documentElement.classList.add('smg-page-pending');
            document.documentElement.classList.remove('smg-page-ready');
            ensurePageSkeleton();
            mobilePagePop.classList.remove('open');
            btnMobilePageBtn.classList.remove('smg-active');
            dockGo(jumpUrl(n));
        };
        if (mpGo) mpGo.addEventListener('click', doMpNav);
        if (mpInput) mpInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doMpNav(); } });
        if (mpClose) mpClose.addEventListener('click', () => {
            mobilePagePop.classList.remove('open');
            btnMobilePageBtn.classList.remove('smg-active');
        });
        btnMobilePageBtn.addEventListener('click', e => {
            e.stopPropagation();
            if (!pageJump) return;
            const isOpen = mobilePagePop.classList.toggle('open');
            btnMobilePageBtn.classList.toggle('smg-active', isOpen);
            if (isOpen) {
                mpInput.value = pageJump.current;
                setTimeout(() => { mpInput.focus(); mpInput.select(); }, 50);
            }
        });

        // troca de página (navegação interna) e scroll infinito: relê o paginador
        // DESTA página. O objeto da página anterior não pode continuar na dock.
        function dockGo(url) {
            if (!url) return;
            if (typeof window.smgSoftNavigate === 'function') window.smgSoftNavigate(url);
            else {
                try { window.location.href = url; } catch (e) {}
            }
        }
        function syncDockListMode() {
            const root = document.documentElement;
            const thread = root.classList.contains('smg-thread');
            const list = root.classList.contains('smg-threadlist') && !thread;
            if (!navWrapper) return;
            navWrapper.classList.toggle('smg-dock-as-list', list);
            navWrapper.classList.toggle('smg-dock-baronly', !list && !thread);
        }
        window.smgRefreshDockPage = () => {
            syncDockListMode();
            if (typeof closePopovers === 'function') closePopovers();
            mobilePagePop.classList.remove('open');
            btnMobilePageBtn.classList.remove('smg-active');
            sortIsDate = !/reaction/i.test(location.search || '');
            if (typeof updateSortIcon === 'function') updateSortIcon();
            currentSortOrder = (new URLSearchParams(location.search).get('order')) || 'last_post_date';
            if (listSortTxt) listSortTxt.textContent = getListSortLabel(currentSortOrder);
            if (listSortTxtM) listSortTxtM.textContent = getListSortLabel(currentSortOrder);
            if (typeof updateWatchIcon === 'function') updateWatchIcon();
            if (typeof markActiveNav === 'function') markActiveNav();
            const pj = readPageJump();
            if (!pj) {
                pageJump = null;
                setBtnIcon(btnGoto, ICONS.goto);
                btnGoto.disabled = true;
                btnPageFirst.disabled = true;
                btnPagePrev.disabled = true;
                btnPageNext.disabled = true;
                btnPageLast.disabled = true;
                paintMobilePager();
                return;
            }
            if (!pageJump) pageJump = { tpl: pj.tpl, current: pj.cur, max: pj.max };
            else { pageJump.tpl = pj.tpl; pageJump.current = pj.cur; pageJump.max = pj.max; }
            btnGoto.disabled = false;
            if (typeof smgUpdateDockPage === 'function') smgUpdateDockPage(pj.cur);
            else setBtnIcon(btnGoto, `${pj.cur} / ${pj.max}`);
            paintMobilePager();
        };

        // o scroll infinito chama isto pra refletir a página que está na tela
        smgUpdateDockPage = n => {
            if (!pageJump) return;
            pageJump.current = n;
            setBtnIcon(btnGoto, `${n} / ${pageJump.max}`);
            if (btnMobilePageBtn) {
                const txt = btnMobilePageBtn.querySelector('.smg-nav-btn-text');
                if (txt) txt.textContent = `${n} / ${pageJump.max}`;
            }
            const mpInput = mobilePagePop.querySelector('.smg-mobile-page-input');
            if (mpInput) mpInput.value = n;
            const mpFirst = mobilePagePop.querySelector('.smg-mp-first');
            const mpPrev = mobilePagePop.querySelector('.smg-mp-prev');
            const mpNext = mobilePagePop.querySelector('.smg-mp-next');
            const mpLast = mobilePagePop.querySelector('.smg-mp-last');
            if (mpFirst) mpFirst.toggleAttribute('disabled', n <= 1);
            if (mpPrev) mpPrev.toggleAttribute('disabled', n <= 1);
            if (mpNext) mpNext.toggleAttribute('disabled', n >= pageJump.max);
            if (mpLast) mpLast.toggleAttribute('disabled', n >= pageJump.max);

            btnPageFirst.disabled = n <= 1;
            btnPagePrev.disabled = n <= 1;
            btnPageNext.disabled = n >= pageJump.max;
            btnPageLast.disabled = n >= pageJump.max;
            paintMobilePager();
        };

        // Botão de View Mode na Thread (Feed / Galeria / Normal)
        const btnViewMode = isThread ? makeDockButton({
            id: 'smg-thread-view-mode',
            icon: ICONS.gallery,
            label: 'View mode',
        }) : null;

        const viewModePop = isThread ? document.createElement('div') : null;
        if (viewModePop) {
            viewModePop.id = 'smg-viewmode-pop';
            viewModePop.className = 'smg-viewmode-pop';
            viewModePop.innerHTML =
                `<button type="button" class="smg-vm-opt" data-mode="gallery"><span class="smg-vm-ic">${ICONS.gallery}</span><span>${i18n('Gallery')}</span></button>` +
                `<button type="button" class="smg-vm-opt" data-mode="feed"><span class="smg-vm-ic">${ICONS.feed}</span><span>${i18n('Feed')}</span></button>` +
                `<button type="button" class="smg-vm-opt" data-mode="normal"><span class="smg-vm-ic">${ICONS.list}</span><span>${i18n('Thread')}</span></button>`;

            viewModePop.querySelectorAll('.smg-vm-opt').forEach(opt => {
                opt.addEventListener('click', e => {
                    e.stopPropagation();
                    viewModePop.classList.remove('open');
                    if (btnViewMode) btnViewMode.classList.remove('smg-active');
                    if (btnViewModeM) btnViewModeM.classList.remove('smg-active');
                    const m = opt.dataset.mode;
                    if (m === 'gallery') {
                        openGallery();
                    } else if (m === 'feed') {
                        openMediaFeed(null, null, { fromStart: true });
                    } else if (m === 'normal') {
                        closeGallery();
                        const f = document.getElementById('smg-feed');
                        if (f) f.remove();
                    }
                });
            });

            if (btnViewMode) {
                btnViewMode.addEventListener('click', e => {
                    e.stopPropagation();
                    const isOpen = viewModePop.classList.toggle('open');
                    btnViewMode.classList.toggle('smg-active', isOpen);
                    if (btnViewModeM) btnViewModeM.classList.toggle('smg-active', isOpen);
                    if (isOpen && mobilePagePop) {
                        mobilePagePop.classList.remove('open');
                        if (btnMobilePageBtn) btnMobilePageBtn.classList.remove('smg-active');
                    }
                });
            }

            smgPopover({
                inside: [viewModePop, btnViewMode, btnViewModeM],
                isOpen: () => viewModePop.classList.contains('open'),
                close: () => {
                    viewModePop.classList.remove('open');
                    if (btnViewMode) btnViewMode.classList.remove('smg-active');
                    if (btnViewModeM) btnViewModeM.classList.remove('smg-active');
                },
            });
        }

        if (mobilePagePop) smgPopover({
            inside: [mobilePagePop, btnMobilePageBtn],
            isOpen: () => mobilePagePop.classList.contains('open'),
            close: () => {
                mobilePagePop.classList.remove('open');
                if (btnMobilePageBtn) btnMobilePageBtn.classList.remove('smg-active');
            },
        });

        const btnUp = makeDockButton({ id: 'smg-scroll-top', icon: ICONS.scrollTop, label: IS_PT ? 'Rolar para o topo da página' : 'Scroll to top' });        // (era "Prev post") → rola pro topo
        const btnDown = makeDockButton({ id: 'smg-scroll-bottom', icon: ICONS.scrollBottom, label: IS_PT ? 'Rolar para o final da página' : 'Scroll to bottom' }); // (era "Next post") → rola pro fim

        // listagem (fórum/busca/watched/bookmarks): paginação na dock + botão de filtro
        const onListUrl = !!document.querySelector('.structItem--thread, .structItem--bookmark')
            || !!document.querySelector('.message--articlePreview')                      // article view (forum_view_type_article)
            || /\/forums\//.test(location.pathname)                                       // qualquer página de fórum
            || /\/watched\//.test(location.pathname)                                      // threads seguidas
            || /\/account\/bookmarks|\/bookmarks\//.test(location.pathname)              // favoritos
            || /^forum_view/.test(document.documentElement.getAttribute('data-template') || '')
            || document.documentElement.getAttribute('data-template') === 'search_results'
            || /\/search\//.test(location.pathname);
        // A dock nasce uma vez. Se a primeira página não for lista, o filtro nunca
        // existiria depois de uma navegação interna. Os botões ficam no DOM e o CSS
        // só os mostra em html.smg-threadlist.
        const btnListFilter = makeDockButton({ id: 'smg-list-filter', icon: ICONS.filter, label: IS_PT ? 'Filtrar tópicos (tags, autor, status)' : 'Filter threads' });
        const btnListSort = makeDockButton({ id: 'smg-list-sort', icon: ICONS.sort, label: getListSortTip() });
        if (btnListSort) {
            btnListSort.classList.add('smg-nav-labeled', 'smg-sort-pill');
            listSortTxt = Object.assign(document.createElement('span'), {
                className: 'smg-nav-btn-text',
                textContent: getListSortLabel(currentSortOrder)
            });
            btnListSort.appendChild(listSortTxt);
        }

        // alternar lista/grade (onde há .structItem--thread: fórum e threads seguidas)
        let viewMode = gmGet('smg-threadview', 'grid');   // grid é o default (toggle lista/grade segue existindo)
        const getViewToggleLabel = m => m === 'grid'
            ? (IS_PT ? 'Visualização atual: Grade. Clique para alternar para Lista' : 'Current view: Grid. Click to switch to List')
            : (IS_PT ? 'Visualização atual: Lista. Clique para alternar para Grade' : 'Current view: List. Click to switch to Grid');
        const btnViewToggle = makeDockButton({ id: 'smg-view-toggle', icon: viewMode === 'grid' ? ICONS.list : ICONS.gallery, label: getViewToggleLabel(viewMode) });
        if (btnViewToggle) btnViewToggle.addEventListener('click', () => {
            viewMode = viewMode === 'grid' ? 'list' : 'grid';
            gmSet('smg-threadview', viewMode);
            document.documentElement.classList.toggle('smg-tv-grid', viewMode === 'grid');
            [btnViewToggle, btnViewToggleM].filter(Boolean).forEach(b => {
                setBtnIcon(b, viewMode === 'grid' ? ICONS.list : ICONS.gallery);
                setBtnLabel(b, getViewToggleLabel(viewMode));
            });
        });

        const isList = !isThread && onListUrl && (!!pageJump || !!btnListFilter || !!btnListSort || !!btnViewToggle);

        // ---- navegação global (links) — base do fórum via quick-search (vale em qualquer página) ----
        const boardBase = (() => {
            const qs = document.querySelector('form[data-xf-init="quick-search"]');
            const act = qs?.getAttribute('action') || '/search/search';
            return act.replace(/search\/search\/?$/, '') || '/'; // '/' ou '/community/'
        })();
        // VISITANTE: alertas/seguindo/timeline/conta só existem com login → a navbar mobile troca esse
        // bloco por um único botão "Entrar" (antes levava o deslogado pro muro de login em 4 caminhos).
        const dockLoggedIn = isLoggedIn();
        const btnHome = makeDockLink({ id: 'smg-nav-home', icon: ICONS.home, label: 'Home', href: boardBase });

        // sino de alertas da navbar mobile: abre o rail de alertas em tela cheia (badge de não lidas via updateAlertsUnreadBadge)
        const btnBell = dockLoggedIn ? makeDockLink({ id: 'smg-nav-bell', icon: ICONS.alerts, label: 'Alerts', href: boardBase + 'account/alerts' }) : null;
        if (btnBell) {
            btnBell.addEventListener('click', e => {
                if (!FEATURES.alertsDock) return;   // sem rail → navega pra página de alertas
                e.preventDefault();
                e.stopPropagation();
                toggleAlertsDock();
            });
        }
        const btnTimeline = dockLoggedIn ? makeDockLink({ id: 'smg-nav-timeline', icon: ICONS.feed, label: 'Feed', href: boardBase + '?view=feed' }) : null;   // espelha o item central da topbar (river das seguidas)
        const btnLogin = dockLoggedIn ? null : makeDockLink({ id: 'smg-nav-login', icon: ICONS.login, label: 'Log in', href: loginHref() });
        if (btnLogin) wireAuthClick(btnLogin, 'login');
        // discover/user: só na navbar inferior (mobile); abrem bottom sheets montados no buildTopbar.
        // são links (fallback caso a topbar esteja off); com a topbar, o wireSheet faz preventDefault e abre o sheet.
        const btnDiscover = makeDockLink({ id: 'smg-nav-discover', icon: ICONS.compass, label: 'Discover', href: boardBase + 'whats-new/' });
        const btnUser = dockLoggedIn ? makeDockLink({ id: 'smg-nav-user', icon: ICONS.user, label: 'Account', href: boardBase + 'account/' }) : null;
        // modo feed · galeria · baixar mídia: MOVIDOS pro header da thread (smg-bar, ver 17-thread-filterbar.js).
        const btnSettings = makeDockButton({ id: 'smg-nav-settings', icon: ICONS.settings, label: 'Settings' });

        // ---- navbar mobile estilo Instagram: profile vira avatar circular + item da página atual fica "ativo" (ícone preenchido) ----
        // (só visível no mobile — no desktop a nav central some e sobra a engrenagem; aqui é inofensivo)
        const navAvatar = btnUser && document.querySelector('.p-navgroup-link--user .avatar');
        if (navAvatar) {
            const ico = btnUser.querySelector('.smg-nav-ico');
            if (ico) { ico.innerHTML = ''; ico.appendChild(navAvatar.cloneNode(true)); ico.classList.add('smg-nav-ico--avatar'); }
        }
        if (btnUser) {
            btnUser.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                const uSheet = document.getElementById('smg-user-sheet');
                if (uSheet) {
                    smgSheetOpen(uSheet);
                } else {
                    const tbUser = document.querySelector('.p-navgroup-link--user');
                    if (tbUser) tbUser.click();
                }
            });
        }
        function markActiveNav() {
            const path = location.pathname;
            [btnHome, btnTimeline, btnBell, btnUser, btnDiscover].forEach(b => { if (b) b.classList.remove('smg-nav-active'); });
            const on = btn => { if (btn) btn.classList.add('smg-nav-active'); };
            if (/[?&]view=feed/.test(location.search)) on(btnTimeline);
            else if (document.documentElement.classList.contains('smg-home-page') || path === boardBase || path === '/') on(btnHome);

            else if (/\/account\/alerts/.test(path)) on(btnBell);
            else if (/\/account(\/|$)/.test(path)) on(btnUser);
            else if (/\/whats-new(\/|$)/.test(path)) on(btnDiscover);
        }
        markActiveNav();

        // ---- montagem (esquerda: navegação · centro: global · direita: ações) ----
        const panel = document.createElement('div');
        panel.id = 'smg-post-nav-panel';

        // navegação principal (+config) — no desktop só sobra a engrenagem; no mobile vira a navbar inferior
        // navbar mobile = 5 itens (espelha a topbar, que tem a Timeline): início · timeline · buscar · alertas · user.
        // Discover fica no DOM (escondido via CSS) → o wireSheet/sheet de opções ainda o alcança.
        // (a engrenagem fica escondida no mobile e some atrás do FAB de opções; no desktop tudo some e sobra ela)
        const centralBtns = [btnHome, btnTimeline, btnSearch, btnBell, btnUser, btnLogin].filter(Boolean);   // busca no centro da navbar; engrenagem saiu daqui → vai pra ESQUERDA da dock; visitante troca alertas/timeline/conta por "Entrar"
        const centralGroup = makeGroup(...centralBtns);
        centralGroup.classList.add('smg-nav-center');

        // botão que abre o bottom sheet de opções (só aparece no mobile)
        const btnSheet = makeDockButton({ id: 'smg-dock-sheet-btn', icon: ICONS.sliders, label: 'Options' });

        btnListFilterM = makeDockButton({ id: 'smg-list-filter-m', icon: ICONS.filter, label: IS_PT ? 'Filtrar tópicos (tags, autor, status)' : 'Filter threads' });
        btnListFilterM.addEventListener('click', e => {
            e.stopPropagation();
            btnListFilter.click();
        });
        btnListSortM = makeDockButton({ id: 'smg-list-sort-m', icon: ICONS.sort, label: getListSortTip() });
        btnListSortM.classList.add('smg-nav-labeled', 'smg-sort-pill');
        listSortTxtM = Object.assign(document.createElement('span'), {
            className: 'smg-nav-btn-text',
            textContent: getListSortLabel(currentSortOrder)
        });
        btnListSortM.appendChild(listSortTxtM);
        btnListSortM.addEventListener('click', e => {
            e.stopPropagation();
            btnListSort.click();
        });
        btnViewToggleM = makeDockButton({ id: 'smg-view-toggle-m', icon: viewMode === 'grid' ? ICONS.list : ICONS.gallery, label: getViewToggleLabel(viewMode) });
        btnViewToggleM.addEventListener('click', () => btnViewToggle.click());

        if (isThread) {
            // Barra de controles de thread para mobile
            btnWatchM = makeDockButton({
                id: 'smg-thread-watch',
                icon: ICONS.watch,
                label: IS_PT ? 'Seguir este tópico (receber notificações)' : 'Watch thread (receive updates)',
            });
            btnWatchM.addEventListener('click', () => btnWatch.click());

            btnSortM = makeDockButton({ id: 'smg-post-sort-toggle', icon: ICONS.sort, label: sortTip });
            btnSortM.classList.add('smg-nav-labeled', 'smg-sort-pill');
            const sortTxtM = Object.assign(document.createElement('span'), { className: 'smg-nav-btn-text', textContent: i18n(sortIsDate ? 'Date' : 'Reactions') });
            btnSortM.appendChild(sortTxtM);
            btnSortM.addEventListener('click', () => btnSort.click());

            btnViewModeM = isThread ? makeDockButton({ id: 'smg-thread-view-mode', icon: ICONS.gallery, label: 'View mode' }) : null;
            if (btnViewMode && btnViewModeM) {
                btnViewModeM.addEventListener('click', e => {
                    e.stopPropagation();
                    btnViewMode.click();
                });
            }

            const btnUpM = makeDockButton({ id: 'smg-scroll-top', icon: ICONS.scrollTop, label: IS_PT ? 'Rolar para o topo da página' : 'Scroll to top' });
            btnUpM.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

            const btnDownM = makeDockButton({ id: 'smg-scroll-bottom', icon: ICONS.scrollBottom, label: IS_PT ? 'Rolar para o final da página' : 'Scroll to bottom' });
            btnDownM.addEventListener('click', () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }));

            const threadBar = document.createElement('div');
            threadBar.className = 'smg-dock-thread-bar';
            const threadBtns = [btnUpM, btnDownM, btnMobilePageBtn, btnSortM, btnViewModeM, btnWatchM].filter(Boolean);
            threadBtns.push(btnListSortM, btnListFilterM, btnViewToggleM);
            threadBar.append(...threadBtns.filter(Boolean));

            // Grupos para Desktop
            const actionsGroup = makeGroup(btnWatch);
            actionsGroup.className = 'smg-nav-group smg-side--desktop-only';
            const pagenavGroup = makeGroup(btnSort, btnListSort, btnListFilter, btnViewToggle, btnPageFirst, btnPagePrev, btnGoto, btnPageNext, btnPageLast, btnViewMode);
            pagenavGroup.className = 'smg-nav-group smg-side--desktop-only';
            const scrollGroup = makeGroup(btnUp, btnDown);
            scrollGroup.className = 'smg-nav-group smg-side--desktop-only';

            panel.append(
                btnSettings, makeDivider(),
                threadBar,
                actionsGroup, makeDivider(),
                centralGroup, makeDivider(),
                pagenavGroup, makeDivider(),
                scrollGroup,
                btnSheet
            );
        } else if (isList) {
            const btnUpM = makeDockButton({ id: 'smg-scroll-top', icon: ICONS.scrollTop, label: IS_PT ? 'Rolar para o topo da página' : 'Scroll to top' });
            btnUpM.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

            const btnDownM = makeDockButton({ id: 'smg-scroll-bottom', icon: ICONS.scrollBottom, label: IS_PT ? 'Rolar para o final da página' : 'Scroll to bottom' });
            btnDownM.addEventListener('click', () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }));

            const listBar = document.createElement('div');
            listBar.className = 'smg-dock-thread-bar';
            const listMobileBtns = [btnUpM, btnDownM, btnMobilePageBtn, btnSort, btnWatch, btnListSortM, btnListFilterM, btnViewToggleM].filter(Boolean);
            listBar.append(...listMobileBtns);

            const listBtns = [btnSort, btnWatch];
            if (pageJump) listBtns.push(btnPageFirst, btnPagePrev, btnGoto, btnPageNext, btnPageLast);
            if (btnListFilter) listBtns.push(btnListFilter);
            if (btnListSort) listBtns.push(btnListSort);
            if (btnViewToggle) listBtns.push(btnViewToggle);
            const listGroup = makeGroup(...listBtns.filter(Boolean));
            listGroup.className = 'smg-nav-group smg-side--desktop-only';

            panel.append(
                btnSettings, makeDivider(),
                listBar,
                centralGroup, makeDivider(),
                listGroup,
                btnSheet
            );
        } else {
            const btnUpM = makeDockButton({ id: 'smg-scroll-top', icon: ICONS.scrollTop, label: IS_PT ? 'Rolar para o topo da página' : 'Scroll to top' });
            btnUpM.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
            const btnDownM = makeDockButton({ id: 'smg-scroll-bottom', icon: ICONS.scrollBottom, label: IS_PT ? 'Rolar para o final da página' : 'Scroll to bottom' });
            btnDownM.addEventListener('click', () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }));
            const listBar = document.createElement('div');
            listBar.className = 'smg-dock-thread-bar';
            listBar.append(...[btnUpM, btnDownM, btnMobilePageBtn, btnSort, btnWatch, btnListSortM, btnListFilterM, btnViewToggleM].filter(Boolean));
            const listBtns = [btnSort, btnWatch, btnPageFirst, btnPagePrev, btnGoto, btnPageNext, btnPageLast, btnListFilter, btnListSort, btnViewToggle];
            const listGroup = makeGroup(...listBtns.filter(Boolean));
            listGroup.className = 'smg-nav-group smg-side--desktop-only';
            panel.append(btnSettings, makeDivider(), listBar, centralGroup, makeDivider(), listGroup, btnSheet);
        }

        const navWrapper = document.createElement('div');
        navWrapper.id = 'smg-post-nav-wrapper';
        // sem ações de thread/lista, no desktop sobraria só a engrenagem → marca p/ esconder a dock
        if (!isThread && !isList) navWrapper.classList.add('smg-dock-baronly');

        // handle pra reabrir quando a dock for ocultada manualmente
        const handle = document.createElement('button');
        handle.id = 'smg-dock-handle';
        handle.type = 'button';
        handle.title = i18n('Show dock');
        handle.setAttribute('aria-label', i18n('Show dock'));
        handle.dataset.label = i18n('Show dock');
        handle.innerHTML = ICONS.show;

        // popover do goto (fora do panel pra não ser cortado pelo overflow no mobile)
        const gotoPop = document.createElement('div');
        gotoPop.id = 'smg-goto-pop';
        gotoPop.innerHTML =
            '<span class="smg-goto-title">Go to page</span>' +
            '<div class="smg-goto-stepper">' +
                '<button type="button" class="smg-goto-step" data-dir="-1" aria-label="Decrease">−</button>' +
                '<input type="number" class="smg-goto-input" min="1" value="1">' +
                '<button type="button" class="smg-goto-step" data-dir="1" aria-label="Increase">+</button>' +
            '</div>' +
            '<span class="smg-goto-max"></span>' +
            '<button type="button" class="smg-goto-btn">Go</button>';

        // busca: dialog modal (montado no body, dentro de um overlay com backdrop escuro)
        const searchPop = document.createElement('div');
        searchPop.id = 'smg-search-pop';
        searchPop.innerHTML =
            '<div class="smg-search-bar">' +
                '<span class="smg-search-lupa">' + ICONS.search + '</span>' +
                '<button type="button" class="smg-search-chip" hidden><span class="smg-search-chip-t"></span><span class="smg-search-chip-x" aria-label="' + i18n('Clear') + '">' + ICONS.close + '</span></button>' +
                '<input type="text" class="smg-search-input" placeholder="Search the forum…" enterkeyhint="search" autocapitalize="off" autocomplete="off" spellcheck="false">' +
                '<span class="smg-search-acts">' +
                    '<button type="button" class="smg-search-clear" aria-label="' + i18n('Clear search') + '" title="' + i18n('Clear') + '" hidden>' + ICONS.close + '</button>' +
                    '<span class="smg-search-kbd" title="Press Esc to close">esc</span>' +
                    '<button type="button" class="smg-search-close" aria-label="Close">' + ICONS.close + '</button>' +
                '</span>' +
            '</div>' +
            '<div class="smg-search-toolbar smg-search-global-toolbar"></div>' +
            // filtros vêm de COMANDOS na barra (by:/sort:/posts:/title:). `by` fica oculto (ref interna p/ c[users]).
            '<input type="text" class="smg-search-by" hidden>' +
            '<div class="smg-search-results" hidden></div>' +
            '<div class="smg-search-history" hidden>' +
                '<div class="smg-search-hist-head">' +
                    '<span class="smg-search-hist-title">Recent searches</span>' +
                    '<span class="smg-search-hist-badge"></span>' +
                    '<button type="button" class="smg-search-hist-clear">Clear</button>' +   // lista sempre rola (sem "Show all") → só sobrou limpar
                '</div>' +
                '<div class="smg-search-hist-list"></div>' +
            '</div>' +
            '<div class="smg-search-empty" hidden>' +
                '<span class="smg-search-empty-ic">' + ICONS.search + '</span>' +
                '<span class="smg-search-empty-t">Search the forum</span>' +
                '<span class="smg-search-empty-s">Type at least 3 characters to see results</span>' +
                '<span class="smg-search-empty-hint"><span class="smg-search-tabkey">⇥ Tab</span><code>!t</code><code>!i</code><code>!a</code><code>!sn</code></span>' +
            '</div>' +
            '<div class="smg-search-foot">' +
                '<span class="smg-search-hint">Enter to search</span>' +
                '<button type="button" class="smg-search-go"><span class="smg-search-go-ic">' + ICONS.search + '</span>Search</button>' +
            '</div>';

        // backdrop (portal escuro) + dialog, fora da dock (o transform da dock no desktop quebraria o position:fixed)
        const searchOverlay = document.createElement('div');
        searchOverlay.id = 'smg-search-overlay';
        searchOverlay.appendChild(searchPop);
        document.body.appendChild(searchOverlay);
        i18nDom(searchOverlay);

        // popover de configurações (engrenagem) — toggles persistidos via GM_setValue
        const settingsPop = document.createElement('div');
        settingsPop.id = 'smg-settings-pop';
        // ícone por categoria (rail à esquerda) + sliders dos tunables do feed (gmGet/gmSet)
        const SET_ICONS = { 'Appearance': ICONS.sliders, 'Images': ICONS.typeImage, 'Videos': ICONS.typeVideo, 'Links & files': ICONS.link, 'Infinite scroll': ICONS.scrollBottom, 'Thread & reading': ICONS.list, 'Feed': ICONS.feed };
        const SET_TUNABLES = [
            { key: 'smg-feed-retention-days', label: i18n('Keep posts for (days)'), min: 7, max: 90, def: 30 },
        ];
        const qAttr = s => (s || '').toLowerCase().replace(/["<>]/g, '');
        const setToggleRow = it =>
            '<label class="smg-set-row" data-q="' + qAttr(it.label + ' ' + ((it.desc && (IS_PT ? it.desc.pt : it.desc.en)) || '')) + '">' +
                '<span class="smg-set-text">' +
                    '<span class="smg-set-label">' + it.label + '</span>' +
                    (it.desc ? '<span class="smg-set-desc">' + (IS_PT ? it.desc.pt : it.desc.en) + '</span>' : '') +
                '</span>' +
                '<input type="checkbox" data-feat="' + it.key + '"' + (FEATURES[it.key] ? ' checked' : '') + '>' +
                '<span class="smg-switch"></span>' +
            '</label>';
        const setSliderRow = it => {
            const v = parseInt(gmGet(it.key, ''), 10) || it.def;
            return '<div class="smg-set-slider" data-q="' + qAttr(it.label) + '">' +
                '<div class="smg-set-slidertop"><span class="smg-set-label">' + it.label + '</span><span class="smg-set-val">' + v + '</span></div>' +
                '<input type="range" data-tune="' + it.key + '" min="' + it.min + '" max="' + it.max + '" step="' + (it.step || 1) + '" value="' + v + '">' +
            '</div>';
        };
        const dbActionsHtml = `
            <div class="smg-set-sectitle">${IS_PT ? 'Banco de Dados & Cache Local' : 'Database & Local Cache'}</div>
            <div class="smg-set-action-card" data-q="limpar feed timeline reset posts clear database">
                <div class="smg-set-text">
                    <span class="smg-set-label">${IS_PT ? 'Limpar feed' : 'Clear feed'}</span>
                    <span class="smg-set-desc">${IS_PT ? 'Remove todos os posts salvos localmente no feed e redefine as páginas salvas das threads.' : 'Removes all locally saved feed posts and resets thread saved pages.'}</span>
                </div>
                <button type="button" class="smg-set-btn-danger smg-btn-clear-timeline">${IS_PT ? 'Limpar feed' : 'Clear feed'}</button>
            </div>
            <div class="smg-set-action-card" data-q="limpar seguidos reset cache watched threads clear database">
                <div class="smg-set-text">
                    <span class="smg-set-label">${IS_PT ? 'Limpar Cache de Seguidos' : 'Clear Followed Cache'}</span>
                    <span class="smg-set-desc">${IS_PT ? 'Limpa a tabela local de tópicos seguidos (apenas dados locais, não deixa de seguir nada no fórum).' : 'Clears local table of followed threads (local data only, does not unfollow anything on forum).'}</span>
                </div>
                <button type="button" class="smg-set-btn-danger smg-btn-clear-followed">${IS_PT ? 'Limpar Seguidos' : 'Clear Followed'}</button>
            </div>`;
        const SET_SECTIONS = SETTINGS_META.concat([{ section: 'Feed', sliders: SET_TUNABLES, customHtml: dbActionsHtml }]);
        const setRail = SET_SECTIONS.map((s, i) => '<button type="button" class="smg-set-tab' + (i === 0 ? ' active' : '') + '" data-i="' + i + '" title="' + s.section + '" aria-label="' + s.section + '">' + (SET_ICONS[s.section] || ICONS.settings) + '</button>').join('');
        const setContent = SET_SECTIONS.map((s, i) =>
            '<div class="smg-set-sec" data-i="' + i + '"' + (i === 0 ? '' : ' hidden') + '>' +
                '<div class="smg-set-sectitle">' + s.section + '</div>' +
                (s.items ? s.items.map(setToggleRow).join('') : '') +
                (s.sliders ? s.sliders.map(setSliderRow).join('') : '') +
                (s.customHtml || '') +
            '</div>').join('');
        settingsPop.innerHTML =
            '<div class="smg-set-head"><span class="smg-set-logo">' + ICONS.settings + '</span><b class="smg-set-title">' + i18n('Settings') + '</b><button type="button" class="smg-set-x" aria-label="' + i18n('Close') + '">' + ICONS.close + '</button></div>' +
            '<div class="smg-set-search"><span class="smg-set-searchic">' + ICONS.search + '</span><input type="text" class="smg-set-q" placeholder="' + i18n('Search setting…') + '" spellcheck="false" autocomplete="off"></div>' +
            '<div class="smg-set-body">' +
                '<div class="smg-set-rail">' + setRail + '</div>' +
                '<div class="smg-set-content">' + setContent + '<div class="smg-set-empty" hidden>' + i18n('No settings found') + '</div></div>' +
            '</div>' +
            '<div class="smg-set-foot">' +
                '<button type="button" class="smg-set-reset">' + i18n('Restore defaults') + '</button>' +
                '<button type="button" class="smg-set-reload">' + i18n('Reload') + '</button>' +
                '<span class="smg-set-ver"></span>' +
            '</div>';

        // popovers de filtro e ordenação da listagem (fórum) — conteúdo carregado sob demanda
        const listFilterPop = btnListFilter ? document.createElement('div') : null;
        if (listFilterPop) {
            listFilterPop.id = 'smg-listfilter-pop';
            listFilterPop.innerHTML = '<span class="smg-pop-title">' + (IS_PT ? 'Filtro' : 'Filter') + '</span><div class="smg-lf-body">' + (IS_PT ? 'Carregando…' : 'Loading…') + '</div>';
        }

        const sortPop = (isList && btnListSort) ? document.createElement('div') : null;
        if (sortPop) {
            sortPop.id = 'smg-listsort-pop';
            sortPop.innerHTML = '<span class="smg-pop-title">' + (IS_PT ? 'Ordenar' : 'Sort') + '</span><div class="smg-sort-body"></div>';
        }

        // backdrop dos popovers do dock (settings/filtro/ordenar) — vira o scrim do bottom sheet no mobile.
        // clicar nele fecha via o handler de clique-fora (não está dentro de nenhum pop/botão).
        const dockBackdrop = document.createElement('div');
        dockBackdrop.className = 'smg-dock-backdrop';
        navWrapper.append(panel, handle, gotoPop, settingsPop, dockBackdrop);
        if (listFilterPop) navWrapper.append(listFilterPop);
        if (sortPop) navWrapper.append(sortPop);
        if (mobilePagePop) navWrapper.append(mobilePagePop);
        if (viewModePop) navWrapper.append(viewModePop);
        document.body.appendChild(navWrapper);
        i18nDom(navWrapper);
        markNavbarReady();

        // ---- estado da dock: ocultar manual + auto-hide no scroll (só no celular) ----

        // No desktop a dock é uma ilha flutuante e não atrapalha; no celular ela é uma barra
        // colada embaixo, comendo tela em toda rolagem de leitura. Some ao descer, volta ao subir
        // (o gesto de subir é o de "quero navegar"), e volta sempre no topo da página.
        // rAF + limiar de 6px: scroll é o evento mais quente da página, e sem o limiar o tremor
        // do dedo/momentum faz a barra piscar.
        let navLastY = window.scrollY || 0, navAway = false, navTick = false;
        const isMobileNav = () => window.matchMedia('(max-width: 600px)').matches;
        function syncNavAway() {
            navTick = false;
            const y = Math.max(0, window.scrollY || 0);
            const dy = y - navLastY;
            if (!isMobileNav()) { navLastY = y; if (navAway) { navAway = false; navWrapper.classList.remove('smg-nav-away'); } return; }
            if (Math.abs(dy) < 6) return;                 // ruído: não conta como intenção
            navLastY = y;
            const away = dy > 0 && y > 140;               // desceu E já saiu da região do topo
            if (away === navAway) return;
            navAway = away;
            navWrapper.classList.toggle('smg-nav-away', away);
        }
        window.addEventListener('scroll', () => {
            if (navTick) return;
            navTick = true;
            requestAnimationFrame(syncNavAway);
        }, { passive: true });

        const DOCK_HIDDEN_KEY = 'smg-dock-hidden';
        let manualHidden = localStorage.getItem(DOCK_HIDDEN_KEY) === '1';

        function applyManualHidden() {
            navWrapper.classList.toggle('manual-hidden', manualHidden);
        }

        // ocultar agora vem de dentro das Settings
        function hideDock() {
            manualHidden = true;
            localStorage.setItem(DOCK_HIDDEN_KEY, '1');
            applyManualHidden();
        }

        handle.addEventListener('click', () => {
            manualHidden = false;
            localStorage.setItem(DOCK_HIDDEN_KEY, '0');
            applyManualHidden();
        });

        applyManualHidden();

        // ---- bottom sheet de opções (mobile): o botão à direita abre tudo aqui ----
        const setupOptionsSheet = () => {
            const sheet = document.createElement('div');
            sheet.id = 'smg-sheet';
            sheet.innerHTML =
                '<div class="smg-sheet-panel">' +
                    '<div class="smg-sheet-grip"></div>' +
                    '<div class="smg-sheet-body"></div>' +
                '</div>';
            document.body.appendChild(sheet);

            const sheetPanel = sheet.querySelector('.smg-sheet-panel');
            const sheetBody = sheet.querySelector('.smg-sheet-body');

            const closeSheet = () => smgSheetClose(sheet);   // trava do fundo + botão voltar moram no helper

            const sheetItem = (iconHtml, label, onClick, disabled) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'smg-sheet-item' + (disabled ? ' smg-sheet-disabled' : '');
                const ico = document.createElement('span'); ico.className = 'smg-sheet-ico'; ico.innerHTML = iconHtml;   // iconHtml = SVG controlado pelo script
                const lbl = document.createElement('span'); lbl.className = 'smg-sheet-lbl'; lbl.textContent = label;   // label pode ser username (filtro por autor) → textContent, NUNCA innerHTML
                b.append(ico, lbl);
                // stopPropagation: senão o clique borbulha até o handler de "fora" e fecha
                // o popover que acabamos de abrir (config/goto/filtro)
                b.addEventListener('click', e => { e.stopPropagation(); onClick(); });
                return b;
            };
            // lê ícone+label+ESTADO atuais do botão da dock e delega o clique (mantém estado sincronizado)
            const fromBtn = btn => {
                if (!btn) return null;   // botão de membro ausente (visitante) → o addSection filtra
                const item = sheetItem(
                    btn.querySelector('.smg-nav-ico')?.innerHTML || '',
                    btn.dataset.label || '',
                    () => { if (btn.disabled) return; closeSheet(); btn.click(); },
                    btn.disabled
                );
                // espelha o estado ativo (watch seguindo, filtro aplicado, etc.) — lido a cada abertura do sheet
                if (btn.classList.contains('smg-active')) item.classList.add('smg-active');
                return item;
            };

            function rebuildSheet() {
                sheetBody.innerHTML = '';

                const addSection = (title, items) => {
                    items = items.filter(Boolean);
                    if (!items.length) return;
                    const h = document.createElement('div');
                    h.className = 'smg-sheet-title';
                    h.textContent = title;
                    const grid = document.createElement('div');
                    grid.className = 'smg-sheet-grid';
                    items.forEach(it => grid.appendChild(it));
                    sheetBody.append(h, grid);
                };

                // General no TOPO
                addSection('General', [
                    fromBtn(btnSettings),
                    sheetItem(ICONS.hide, 'Hide dock', () => { closeSheet(); hideDock(); }),
                ]);
                // Discover/Following saíram da navbar (5 itens) → continuam alcançáveis por aqui
                // (fromBtn delega o click: Discover abre o sheet do wireSheet; Following abre a página de seguidos)
                addSection('Explore', [
                    fromBtn(btnDiscover),
                    dockLoggedIn ? sheetItem(ICONS.watched, i18n('Following'), () => { closeSheet(); dockGo(boardBase + 'watched/threads'); }) : null,
                ]);
                if (isThread) {
                    addSection('Post', [btnWatch].map(b => b && fromBtn(b)));
                    addSection('View', [
                        sheetItem(ICONS.gallery, i18n('Gallery'), () => { closeSheet(); openGallery(); }),
                        sheetItem(ICONS.feed, i18n('Feed'), () => { closeSheet(); openMediaFeed(null, null, { fromStart: true }); }),
                        sheetItem(ICONS.list, i18n('Thread view'), () => { closeSheet(); closeGallery(); }),
                    ]);
                    // Sort by date entra DEPOIS de Next page
                    addSection('Navigation', [btnUp, btnDown, btnPageFirst, btnPagePrev, btnGoto, btnPageNext, btnPageLast, btnSort].map(b => b && fromBtn(b)));
                } else if (isList) {
                    const listItems = [];
                    if (pageJump) listItems.push(btnPageFirst, btnPagePrev, btnGoto, btnPageNext, btnPageLast);
                    if (btnListFilter) listItems.push(btnListFilter);
                    if (btnListSort) listItems.push(btnListSort);
                    if (btnViewToggle) listItems.push(btnViewToggle);
                    addSection('Page', listItems.map(b => b && fromBtn(b)));
                }
                i18nDom(sheetBody);
            }

            btnSheet.addEventListener('click', () => { rebuildSheet(); smgSheetOpen(sheet); });
            // scrim + arrasto + Esc: mesmo comportamento dos sheets da topbar (antes este tinha um
            // drag próprio, que engatava em QUALQUER ponto do painel e brigava com o scroll da lista)
            wireSheetClose(sheet, sheetPanel);
        };
        setupOptionsSheet();

        // ---- goto: popover pra pular pra uma página ----
        const gotoInput = gotoPop.querySelector('.smg-goto-input');
        const gotoMax = gotoPop.querySelector('.smg-goto-max');
        const gotoGoBtn = gotoPop.querySelector('.smg-goto-btn');

        function clampPage(n) {
            if (!n || n < 1) n = 1;
            if (pageJump && pageJump.max && n > pageJump.max) n = pageJump.max;
            return n;
        }

        // fromPop: o "voltar" já consumiu o estado do modal · keepModal: vai abrir outro sheet em seguida
        function closePopovers(fromPop, keepModal) {
            if (!keepModal) smgModalClose(navWrapper, fromPop === true);
            navWrapper.classList.remove('goto-open', 'settings-open', 'listfilter-open', 'listsort-open', 'smg-dock-show');
            searchOverlay.classList.remove('open');
            if (mobilePagePop) mobilePagePop.classList.remove('open');
            if (viewModePop) viewModePop.classList.remove('open');
            if (btnMobilePageBtn) btnMobilePageBtn.classList.remove('smg-active');
            if (btnViewMode) btnViewMode.classList.remove('smg-active');
        }
        // arrastar pra baixo fecha os sheets/modais mobile (settings · filtro · ordenação têm grip = bottom sheet; goto é popover pequeno → fora)
        const isMobileSheet = () => window.innerWidth <= 600;
        // abre um popover da dock; no celular settings/filtro/ordenação são bottom sheets → modal único
        // (trava do fundo + "voltar" fecha). Trocar de um sheet pro outro reaproveita o mesmo estado.
        function openDockPop(cls) {
            const wasModal = smgModalIsOpen(navWrapper);
            closePopovers(false, true);
            navWrapper.classList.add(cls);
            const sheet = isMobileSheet() && cls !== 'goto-open';
            if (sheet && !wasModal) smgModalOpen(navWrapper, () => closePopovers(true));
            else if (!sheet && wasModal) smgModalClose(navWrapper);
        }
        addSwipeClose(settingsPop, closePopovers, () => isMobileSheet() && navWrapper.classList.contains('settings-open'));
        if (listFilterPop) addSwipeClose(listFilterPop, closePopovers, () => isMobileSheet() && navWrapper.classList.contains('listfilter-open'));
        if (sortPop) addSwipeClose(sortPop, closePopovers, () => isMobileSheet() && navWrapper.classList.contains('listsort-open'));

        function openGoto() {
            if (!pageJump) return;
            closePopovers();
            gotoInput.max = pageJump.max || '';
            gotoInput.value = pageJump.current;
            gotoMax.textContent = pageJump.max ? 'of ' + pageJump.max + ' pages' : '';
            navWrapper.classList.add('goto-open');
            setTimeout(() => { gotoInput.focus(); gotoInput.select(); }, 0);
        }

        function doGoto() {
            if (!pageJump) return;
            dockGo(pageJump.tpl.replace('%page%', clampPage(parseInt(gotoInput.value, 10))));
        }

        btnGoto.addEventListener('click', e => {
            e.stopPropagation();
            if (navWrapper.classList.contains('goto-open')) closePopovers();
            else openGoto();
        });

        // botões − / + (sempre visíveis)
        gotoPop.querySelectorAll('.smg-goto-step').forEach(b => {
            b.addEventListener('click', () => {
                gotoInput.value = clampPage((parseInt(gotoInput.value, 10) || 1) + parseInt(b.dataset.dir, 10));
            });
        });

        gotoInput.addEventListener('change', () => {
            gotoInput.value = clampPage(parseInt(gotoInput.value, 10));
        });

        gotoGoBtn.addEventListener('click', doGoto);

        gotoInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); doGoto(); }
            else if (e.key === 'Escape') closePopovers();
        });
