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
        if (document.getElementById('smg-post-nav-wrapper')) return;

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
        const prevPageLink = document.querySelector('.pageNav-jump--prev, .pageNavSimple-el--prev');
        const nextPageLink = document.querySelector('.pageNav-jump--next, .pageNavSimple-el--next');
        // sort tabs: a de reação tem ?order=reaction_score no href; a de data é a sem order=
        let sortDateLink = null, sortReactionLink = null;
        document.querySelectorAll('.tabs--standalone .tabs-tab, .block-outer-opposite--postSortFilter .tabs-tab').forEach(t => {
            const h = t.getAttribute('href') || '';
            if (/order=reaction/i.test(h)) sortReactionLink = t;
            else if (!/order=/i.test(h)) sortDateLink = t;
        });

        let sortIsDate = !/reaction/i.test(window.location.search || '');

        // ---- page jump (goto): página atual (URL) + total, via readPageJump ----
        const pageJump = (() => {
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
        const btnMobilePageBtn = pageJump ? makeDockButton({
            id: 'smg-mobile-page-btn',
            icon: ICONS.layers,
            label: 'Page navigation',
        }) : null;
        if (btnMobilePageBtn) {
            btnMobilePageBtn.classList.add('smg-nav-labeled', 'smg-mobile-page-pill');
            const txt = document.createElement('span');
            txt.className = 'smg-nav-btn-text';
            txt.textContent = `${pageJump.current} / ${pageJump.max}`;
            btnMobilePageBtn.appendChild(txt);
        }

        // Popover flutuante de paginação mobile (#smg-mobile-page-pop)
        const mobilePagePop = document.createElement('div');
        mobilePagePop.id = 'smg-mobile-page-pop';
        mobilePagePop.className = 'smg-mobile-page-pop';
        if (pageJump) {
            const firstHref = pageJump.tpl ? pageJump.tpl.replace(/\/page-%page%/, '/').replace('%page%', '1') : null;
            const prevHref = prevPageLink ? prevPageLink.getAttribute('href') : (pageJump.tpl && pageJump.current > 1 ? (pageJump.current - 1 === 1 ? pageJump.tpl.replace(/\/page-%page%/, '/') : pageJump.tpl.replace('%page%', String(pageJump.current - 1))) : null);
            const nextHref = nextPageLink ? nextPageLink.getAttribute('href') : (pageJump.tpl && pageJump.current < pageJump.max ? pageJump.tpl.replace('%page%', String(pageJump.current + 1)) : null);
            const lastHref = pageJump.tpl ? pageJump.tpl.replace('%page%', String(pageJump.max)) : null;

            mobilePagePop.innerHTML =
                `<a class="smg-mp-btn smg-mp-first" href="${firstHref || '#'}" title="${i18n('First page')}" ${pageJump.current <= 1 ? 'disabled' : ''}>${ICONS.pageFirst}</a>` +
                `<a class="smg-mp-btn smg-mp-prev" href="${prevHref || '#'}" title="${i18n('Prev page')}" ${pageJump.current <= 1 ? 'disabled' : ''}>${ICONS.pagePrev}</a>` +
                `<div class="smg-mp-goto">` +
                    `<input type="number" class="smg-mobile-page-input" min="1" max="${pageJump.max || ''}" value="${pageJump.current}" aria-label="${i18n('Go to page')}">` +
                    `<span class="smg-mp-sep">/</span>` +
                    `<span class="smg-mp-max">${pageJump.max || 1}</span>` +
                    `<button type="button" class="smg-mp-go">${i18n('Go')}</button>` +
                `</div>` +
                `<a class="smg-mp-btn smg-mp-next" href="${nextHref || '#'}" title="${i18n('Next page')}" ${pageJump.current >= pageJump.max ? 'disabled' : ''}>${ICONS.pageNext}</a>` +
                `<a class="smg-mp-btn smg-mp-last" href="${lastHref || '#'}" title="${i18n('Last page')}" ${pageJump.current >= pageJump.max ? 'disabled' : ''}>${ICONS.pageLast}</a>` +
                `<button type="button" class="smg-mp-close" aria-label="${i18n('Close')}">${ICONS.close}</button>`;

            const mpInput = mobilePagePop.querySelector('.smg-mobile-page-input');
            const mpGo = mobilePagePop.querySelector('.smg-mp-go');
            const mpClose = mobilePagePop.querySelector('.smg-mp-close');

            const doMpNav = () => {
                const n = clampPage(parseInt(mpInput.value, 10));
                if (!n || !pageJump.tpl) return;
                let url = (n === 1) ? pageJump.tpl.replace(/\/page-%page%/, '/') : pageJump.tpl.replace('%page%', String(n));
                if (location.search && url.indexOf('?') < 0 && /[?&]order=/.test(location.search)) url += location.search;
                window.location.href = url;
            };

            if (mpGo) mpGo.addEventListener('click', doMpNav);
            if (mpInput) mpInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doMpNav(); } });
            if (mpClose) mpClose.addEventListener('click', () => {
                mobilePagePop.classList.remove('open');
                if (btnMobilePageBtn) btnMobilePageBtn.classList.remove('smg-active');
            });

            if (btnMobilePageBtn) {
                btnMobilePageBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    const isOpen = mobilePagePop.classList.toggle('open');
                    btnMobilePageBtn.classList.toggle('smg-active', isOpen);
                    if (isOpen) {
                        mpInput.value = pageJump.current;
                        setTimeout(() => { mpInput.focus(); mpInput.select(); }, 50);
                    }
                });
            }
        }

        // o scroll infinito chama isto pra refletir a página que está na tela
        if (pageJump) smgUpdateDockPage = n => {
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
            btnPagePrev.disabled = !prevPageLink || n <= 1;
            btnPageNext.disabled = !nextPageLink || n >= pageJump.max;
            btnPageLast.disabled = n >= pageJump.max;
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
                (FEATURES.mediaFeed ? `<button type="button" class="smg-vm-opt" data-mode="feed"><span class="smg-vm-ic">${ICONS.feed}</span><span>${i18n('Feed')}</span></button>` : '') +
                `<button type="button" class="smg-vm-opt" data-mode="normal"><span class="smg-vm-ic">${ICONS.list}</span><span>${i18n('Thread')}</span></button>`;

            viewModePop.querySelectorAll('.smg-vm-opt').forEach(opt => {
                opt.addEventListener('click', e => {
                    e.stopPropagation();
                    viewModePop.classList.remove('open');
                    if (btnViewMode) btnViewMode.classList.remove('smg-active');
                    if (btnViewModeM) btnViewModeM.classList.remove('smg-active');
                    const m = opt.dataset.mode;
                    if (m === 'gallery') {
                        if (typeof openGallery === 'function') openGallery();
                    } else if (m === 'feed') {
                        if (typeof openMediaFeed === 'function') openMediaFeed(null, null, { fromStart: true });
                    } else if (m === 'normal') {
                        if (typeof closeGallery === 'function') closeGallery();
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

            document.addEventListener('click', e => {
                if (viewModePop.classList.contains('open')) {
                    if (!viewModePop.contains(e.target) && (!btnViewMode || !btnViewMode.contains(e.target)) && (!btnViewModeM || !btnViewModeM.contains(e.target))) {
                        viewModePop.classList.remove('open');
                        if (btnViewMode) btnViewMode.classList.remove('smg-active');
                        if (btnViewModeM) btnViewModeM.classList.remove('smg-active');
                    }
                }
            });
        }

        document.addEventListener('click', e => {
            if (mobilePagePop && mobilePagePop.classList.contains('open')) {
                if (!mobilePagePop.contains(e.target) && (!btnMobilePageBtn || !btnMobilePageBtn.contains(e.target))) {
                    mobilePagePop.classList.remove('open');
                    if (btnMobilePageBtn) btnMobilePageBtn.classList.remove('smg-active');
                }
            }
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
        const btnListFilter = onListUrl
            ? makeDockButton({ id: 'smg-list-filter', icon: ICONS.filter, label: IS_PT ? 'Filtrar tópicos (tags, autor, status)' : 'Filter threads' })
            : null;
        const btnListSort = onListUrl
            ? makeDockButton({ id: 'smg-list-sort', icon: ICONS.sort, label: getListSortTip() })
            : null;
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
        const btnViewToggle = (onListUrl && (document.querySelector('.structItem--thread, .structItem--bookmark, .smg-watched-card, #smg-watched-local-root') || document.querySelector('.message--articlePreview')))
            ? makeDockButton({ id: 'smg-view-toggle', icon: viewMode === 'grid' ? ICONS.list : ICONS.gallery, label: getViewToggleLabel(viewMode) })
            : null;
        if (btnViewToggle) btnViewToggle.addEventListener('click', () => {
            viewMode = viewMode === 'grid' ? 'list' : 'grid';
            gmSet('smg-threadview', viewMode);
            document.documentElement.classList.toggle('smg-tv-grid', viewMode === 'grid');
            const wGrid = document.querySelector('.smg-watched-grid');
            if (wGrid) {
                wGrid.classList.remove('smg-watched-view--grid', 'smg-watched-view--list');
                wGrid.classList.add(viewMode === 'list' ? 'smg-watched-view--list' : 'smg-watched-view--grid');
            }
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
        const btnWatched = dockLoggedIn ? makeDockLink({ id: 'smg-nav-watched', icon: ICONS.watched, label: 'Following', href: boardBase + 'watched/threads' }) : null;
        if (btnWatched) {
            btnWatched.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof toggleAlertsDock === 'function') toggleAlertsDock('watched');
            });
        }
        const btnTimeline = dockLoggedIn ? makeDockLink({ id: 'smg-nav-timeline', icon: ICONS.feed, label: 'Timeline', href: boardBase + '?view=feed' }) : null;   // espelha o item central da topbar (river das seguidas)
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
                if (uSheet && typeof smgSheetOpen === 'function') {
                    smgSheetOpen(uSheet);
                } else {
                    const tbUser = document.querySelector('.smg-tb-avatar, .p-navgroup-link--user');
                    if (tbUser) tbUser.click();
                }
            });
        }
        (function markActiveNav() {
            const path = location.pathname;
            // só MARCA a classe — o "preenchido" é feito via CSS no próprio ícone de contorno (que já renderiza).
            // (trocar innerHTML por um <svg fill> separado falhava no render → o ícone sumia)
            const on = btn => { if (btn) btn.classList.add('smg-nav-active'); };   // visitante não tem os botões de membro
            if (/[?&]view=feed/.test(location.search)) on(btnTimeline);   // ANTES do home: o feed mora NA home (?view=feed)
            else if (document.documentElement.classList.contains('smg-home-page') || path === boardBase || path === '/') on(btnHome);
            else if (/\/watched\//.test(path)) on(btnWatched);
            else if (/\/account(\/|$)/.test(path)) on(btnUser);                 // avatar ganha o anel
            else if (/\/whats-new(\/|$)/.test(path)) on(btnDiscover);
        })();

        // ---- montagem (esquerda: navegação · centro: global · direita: ações) ----
        const panel = document.createElement('div');
        panel.id = 'smg-post-nav-panel';

        // navegação principal (+config) — no desktop só sobra a engrenagem; no mobile vira a navbar inferior
        // navbar mobile = 5 itens (espelha a topbar, que tem a Timeline): início · timeline · buscar · following · user.
        // Discover fica no DOM (escondido via CSS) → o wireSheet/sheet de opções ainda o alcança.
        // (a engrenagem fica escondida no mobile e some atrás do FAB de opções; no desktop tudo some e sobra ela)
        const centralBtns = [btnHome, btnTimeline, btnSearch, btnWatched, btnUser, btnLogin].filter(Boolean);   // busca no centro da navbar; engrenagem saiu daqui → vai pra ESQUERDA da dock; visitante troca alertas/timeline/conta por "Entrar"
        const centralGroup = makeGroup(...centralBtns);
        centralGroup.classList.add('smg-nav-center');

        // botão que abre o bottom sheet de opções (só aparece no mobile)
        const btnSheet = makeDockButton({ id: 'smg-dock-sheet-btn', icon: ICONS.sliders, label: 'Options' });

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
            const threadBtns = [btnWatchM, btnSortM, btnMobilePageBtn, btnViewModeM, btnUpM, btnDownM].filter(Boolean);
            threadBar.append(...threadBtns);

            // Grupos para Desktop
            const actionsGroup = makeGroup(btnWatch);
            actionsGroup.className = 'smg-nav-group smg-side smg-side--acts smg-side--desktop-only';
            const pagenavGroup = makeGroup(btnSort, btnPageFirst, btnPagePrev, btnGoto, btnPageNext, btnPageLast, btnViewMode);
            pagenavGroup.className = 'smg-nav-group smg-side smg-side--desktop-only';
            const scrollGroup = makeGroup(btnUp, btnDown);
            scrollGroup.className = 'smg-nav-group smg-side smg-side--desktop-only';

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
            btnListFilterM = btnListFilter ? makeDockButton({ id: 'smg-list-filter-m', icon: ICONS.filter, label: IS_PT ? 'Filtrar tópicos (tags, autor, status)' : 'Filter threads' }) : null;
            if (btnListFilter && btnListFilterM) {
                btnListFilterM.addEventListener('click', e => {
                    e.stopPropagation();
                    btnListFilter.click();
                });
            }

            btnListSortM = btnListSort ? makeDockButton({ id: 'smg-list-sort-m', icon: ICONS.sort, label: getListSortTip() }) : null;
            if (btnListSortM) {
                btnListSortM.classList.add('smg-nav-labeled', 'smg-sort-pill');
                listSortTxtM = Object.assign(document.createElement('span'), {
                    className: 'smg-nav-btn-text',
                    textContent: getListSortLabel(currentSortOrder)
                });
                btnListSortM.appendChild(listSortTxtM);
            }
            if (btnListSort && btnListSortM) {
                btnListSortM.addEventListener('click', e => {
                    e.stopPropagation();
                    btnListSort.click();
                });
            }

            btnViewToggleM = btnViewToggle ? makeDockButton({ id: 'smg-view-toggle', icon: viewMode === 'grid' ? ICONS.list : ICONS.gallery, label: getViewToggleLabel(viewMode) }) : null;
            if (btnViewToggle && btnViewToggleM) {
                btnViewToggleM.addEventListener('click', () => btnViewToggle.click());
            }

            const btnUpM = makeDockButton({ id: 'smg-scroll-top', icon: ICONS.scrollTop, label: IS_PT ? 'Rolar para o topo da página' : 'Scroll to top' });
            btnUpM.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

            const btnDownM = makeDockButton({ id: 'smg-scroll-bottom', icon: ICONS.scrollBottom, label: IS_PT ? 'Rolar para o final da página' : 'Scroll to bottom' });
            btnDownM.addEventListener('click', () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }));

            const listBar = document.createElement('div');
            listBar.className = 'smg-dock-thread-bar';
            const listMobileBtns = [btnMobilePageBtn, btnListFilterM, btnListSortM, btnViewToggleM, btnUpM, btnDownM].filter(Boolean);
            listBar.append(...listMobileBtns);

            const listBtns = [];
            if (pageJump) listBtns.push(btnPageFirst, btnPagePrev, btnGoto, btnPageNext, btnPageLast);
            if (btnListFilter) listBtns.push(btnListFilter);
            if (btnListSort) listBtns.push(btnListSort);
            if (btnViewToggle) listBtns.push(btnViewToggle);
            const listGroup = makeGroup(...listBtns.filter(Boolean));
            listGroup.className = 'smg-nav-group smg-side smg-side--desktop-only';

            panel.append(
                btnSettings, makeDivider(),
                listBar,
                centralGroup, makeDivider(),
                listGroup,
                btnSheet
            );
        } else {
            panel.append(centralGroup, btnSheet);
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
            { key: 'smg-feed-window-days', label: i18n('Search window (days)'), min: 3, max: 30, def: 14 },
            { key: 'smg-feed-retention-days', label: i18n('Keep posts for (days)'), min: 7, max: 90, def: 30 },
            { key: 'smg-feed-cold-threads', label: i18n('Threads on first load'), min: 40, max: 300, step: 10, def: 120 },
            { key: 'smg-feed-deep-ttl', label: i18n('Deep re-scan every (h)'), min: 1, max: 48, def: 6 },
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
            <div class="smg-set-action-card" data-q="limpar timeline reset posts feed clear database">
                <div class="smg-set-text">
                    <span class="smg-set-label">${IS_PT ? 'Limpar Timeline' : 'Clear Timeline'}</span>
                    <span class="smg-set-desc">${IS_PT ? 'Remove todos os posts salvos localmente na timeline e redefine as páginas salvas das threads.' : 'Removes all locally saved timeline posts and resets thread saved pages.'}</span>
                </div>
                <button type="button" class="smg-set-btn-danger smg-btn-clear-timeline">${IS_PT ? 'Limpar Timeline' : 'Clear Timeline'}</button>
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
        const listFilterPop = (isList && btnListFilter) ? document.createElement('div') : null;
        if (listFilterPop) {
            listFilterPop.id = 'smg-listfilter-pop';
            listFilterPop.innerHTML = '<span class="smg-pop-title">' + (IS_PT ? 'Filtro' : 'Filter') + '</span><div class="smg-lf-body">' + (IS_PT ? 'Carregando…' : 'Loading…') + '</div>';
        }

        const sortPop = (isList && btnListSort) ? document.createElement('div') : null;
        if (sortPop) {
            sortPop.id = 'smg-listsort-pop';
            sortPop.className = 'smg-sort-pop';
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
                // Discover/Watched saíram da navbar (5 itens) → continuam alcançáveis por aqui
                // (fromBtn delega o click: Discover abre o sheet do wireSheet; Watched navega pelo href)
                addSection('Explore', [fromBtn(btnDiscover), fromBtn(btnWatched)]);
                if (isThread) {
                    addSection('Post', [btnWatch].map(b => b && fromBtn(b)));
                    addSection('View', [
                        sheetItem(ICONS.gallery, i18n('Gallery'), () => { closeSheet(); if (typeof openGallery === 'function') openGallery(); }),
                        FEATURES.mediaFeed ? sheetItem(ICONS.feed, i18n('Feed'), () => { closeSheet(); if (typeof openMediaFeed === 'function') openMediaFeed(null, null, { fromStart: true }); }) : null,
                        sheetItem(ICONS.list, i18n('Thread view'), () => { closeSheet(); if (typeof closeGallery === 'function') closeGallery(); }),
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

        function closePopovers() {
            navWrapper.classList.remove('goto-open', 'settings-open', 'listfilter-open', 'listsort-open', 'smg-dock-show');
            searchOverlay.classList.remove('open');
            if (mobilePagePop) mobilePagePop.classList.remove('open');
            if (viewModePop) viewModePop.classList.remove('open');
            if (btnMobilePageBtn) btnMobilePageBtn.classList.remove('smg-active');
            if (btnViewMode) btnViewMode.classList.remove('smg-active');
        }
        // arrastar pra baixo fecha os sheets/modais mobile (settings · filtro · ordenação têm grip = bottom sheet; goto é popover pequeno → fora)
        const isMobileSheet = () => window.innerWidth <= 600;
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
            window.location.href = pageJump.tpl.replace('%page%', clampPage(parseInt(gotoInput.value, 10)));
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

        // ---- search: popover de busca (XenForo /search/search) ----
        const setupSearch = () => {
            harvestPrefixesFromDoc(document);
            const threadId = (location.pathname.match(/threads\/[^/]+\.(\d+)/) || [])[1] || '';
            // node id do fórum pai: último link /forums/slug.ID/ do breadcrumb
            const forumId = (() => {
                let id = '';
                document.querySelectorAll('.p-breadcrumbs a[href*="/forums/"], .breadcrumbs a[href*="/forums/"]').forEach(a => {
                    const m = (a.getAttribute('href') || '').match(/\/forums\/[^/]+\.(\d+)/);
                    if (m) id = m[1];
                });
                return id;
            })();

            const searchInput = searchPop.querySelector('.smg-search-input');
            // input ATIVO: desktop usa o input REAL da topbar (dropdown); mobile usa o input do próprio modal.
            const getSearchInput = () => (window.innerWidth > 600 && document.querySelector('.smg-tb-search-input')) || searchInput;
            const searchResultsEl = searchPop.querySelector('.smg-search-results');
            const searchAdv = searchPop.querySelector('.smg-search-adv');
            const searchHistEl = searchPop.querySelector('.smg-search-history');
            const searchHistList = searchPop.querySelector('.smg-search-hist-list');
            const searchHistClear = searchPop.querySelector('.smg-search-hist-clear');
            const searchHistBadge = searchPop.querySelector('.smg-search-hist-badge');
            const searchEmptyEl = searchPop.querySelector('.smg-search-empty');

            // action + token do quick-search da própria página (robusto a subdiretório)
            const qsForm = document.querySelector('form[data-xf-init="quick-search"]');
            const searchAction = qsForm?.getAttribute('action') || '/search/search';
            if (searchAdv) searchAdv.href = searchAction.replace(/search\/?$/, ''); // /search/search -> /search/

            let applyingEntry = false;   // true durante fillFromEntry → segura o re-search por filtro

            // ===== ESCOPO estilo Reddit: começa no CONTEXTO (tópico/fórum atual); chip com × na barra → "em tudo" =====
            // título da página SEM o que injetamos/o XF cola dentro do h1 (botão de notices, prefixos/labels)
            const pageTitle = (() => {
                const el = document.querySelector('h1.p-title-value, .p-title-value'); if (!el) return '';
                const c = el.cloneNode(true);
                c.querySelectorAll('.smg-notices, .smg-notices-collapse, .label, .labelLink, [class*="label--"], .prefix, [class*="prefix"]').forEach(x => x.remove());
                return (c.textContent || '').replace(/\s+/g, ' ').trim();
            })();
            const ctxLabel = threadId
                ? pageTitle
                : forumId
                    ? (() => { let n = ''; document.querySelectorAll('.p-breadcrumbs a[href*="/forums/"], .breadcrumbs a[href*="/forums/"]').forEach(a => { const t = a.textContent.trim(); if (t) n = t; }); return n || pageTitle; })()
                    : '';
            let currentScope = threadId ? 'thread' : 'everywhere';
            let titlesOn = true, orderDate = false;   // (re)setados pelos comandos a cada busca
            const activeSearchBadges = new Set();
            let toggleTitleOnly = null;
            let sortSelect = null;
            let authorInput = null;
            let scopeSelect = null;
            let badgeMultiselect = null;

            function applyScopeUI() {
                const isThread = currentScope === 'thread';
                const scoped = isThread || (currentScope === 'forum' && !!ctxLabel);   // tópico vale pelo threadId (mesmo sem título); fórum precisa do nome
                document.documentElement.classList.toggle('smg-search-scoped', scoped);
                const chipText = isThread ? i18n('This thread') : ctxLabel;   // TÓPICO: rótulo curto fixo (nomes de tópico podem ser enormes); FÓRUM: nome
                const kind = isThread ? '' : i18n('Forum');                   // tópico não precisa de tag — o rótulo já diz
                Array.prototype.forEach.call(document.querySelectorAll('.smg-tb-search-chip, .smg-search-chip'), ch => {
                    ch.hidden = !scoped;
                    const t = ch.querySelector('.smg-search-chip-t'); if (t) t.textContent = chipText;
                    let k = ch.querySelector('.smg-search-chip-k');
                    if (scoped && kind) { if (!k) { k = document.createElement('span'); k.className = 'smg-search-chip-k'; ch.insertBefore(k, t); } k.textContent = kind; }
                    else if (k) k.remove();
                });
                const ph = isThread ? i18n('Search in this thread') : (scoped ? (i18n('Search in') + ' ' + ctxLabel) : i18n('Search the forum…'));
                if (searchInput) searchInput.placeholder = ph;
                const tb = document.querySelector('.smg-tb-search-input'); if (tb) tb.placeholder = ph;
                const scSel = searchPop.querySelector('.smg-search-scope-select');
                if (scSel && scSel.value !== currentScope) scSel.value = currentScope;
            }
            function unscope() { currentScope = 'everywhere'; applyScopeUI(); researchOnFilter(); try { getSearchInput().focus(); } catch (e) {} }
            // × do chip (delegado → cobre o chip da topbar E o do modal)
            document.addEventListener('pointerdown', e => {
                if (e.target.closest && (e.target.closest('.smg-search-chip-x') || e.target.closest('.smg-search-chip'))) {
                    e.preventDefault();
                }
            });
            document.addEventListener('click', e => {
                if (e.target.closest && (e.target.closest('.smg-search-chip-x') || e.target.closest('.smg-search-chip'))) {
                    e.preventDefault();
                    e.stopPropagation();
                    unscope();
                }
            });
            applyScopeUI();

            // defaults configuráveis (engrenagem da barra) — DECLARADOS AQUI (antes do bloco que os usa no setup); comando explícito sempre vence
            const CFG_TITLES = 'smg-search-def-titles', CFG_ORDER = 'smg-search-def-order', CFG_LIKE = 'smg-search-like';
            let cfgTitles = localStorage.getItem(CFG_TITLES) === '1';                 // só-títulos por padrão (busca global/fórum)
            let cfgOrder = localStorage.getItem(CFG_ORDER) === '1';                   // por data por padrão
            let cfgLike = (localStorage.getItem(CFG_LIKE) ?? '1') === '1';            // wildcard de parte da palavra

            // BUSCA AVANÇADA (na barra): com query → abre os RESULTADOS NATIVOS numa nova aba (POST, igual o inline → garantido),
            // já com o escopo/filtros atuais; a página de resultados tem o painel pra refinar. Sem query → o form de busca avançada.
            const advUrl = searchAction.replace(/search\/?$/, '');   // /search/search → /search/
            Array.prototype.forEach.call(document.querySelectorAll('.smg-search-adv'), a => { a.href = advUrl; a.title = i18n('Advanced'); });   // href base (ctrl/middle-click)
            function openAdvanced() {
                let keywords = getSearchInput().value.trim();
                const by = authorInput ? authorInput.value.trim() : '';
                const activeBadges = Array.from(activeSearchBadges);
                const titles = toggleTitleOnly ? toggleTitleOnly.checked : (currentScope !== 'thread' && cfgTitles);
                const order = sortSelect ? (sortSelect.value === 'date') : cfgOrder;
                if (!keywords && !by && !activeBadges.length && currentScope !== 'watched') { window.open(advUrl, '_blank', 'noopener'); return; }   // sem query → form avançado
                const token = qsForm?.querySelector('input[name="_xfToken"]')?.value || document.querySelector('input[name="_xfToken"]')?.value || '';
                const fields = [['_xfToken', token]];
                let hasPid = false;
                const fallbackBadges = [];
                if (activeBadges.length) {
                    activeBadges.forEach(b => {
                        const k = b.toLowerCase().trim();
                        const pid = globalPrefixMap.get(k) || (typeof serverPrefixMap !== 'undefined' && serverPrefixMap.get(k));
                        if (pid) {
                            fields.push(['c[prefixes][]', pid]);
                            hasPid = true;
                        } else {
                            fallbackBadges.push(b);
                        }
                    });
                }
                if (fallbackBadges.length) {
                    keywords = (keywords ? (keywords + ' ') : '') + fallbackBadges.join(' ');
                }
                if (keywords) {
                    fields.push(['keywords', likeify(keywords)]);
                } else if (hasPid) {
                    fields.push(['search_type', 'thread']);
                }
                if (currentScope === 'thread' && threadId) fields.push(['c[thread]', threadId], ['search_type', 'post']);   // search_type=post é OBRIGATÓRIO p/ restringir À thread (senão o XF busca threads no global e ignora c[thread])
                else if (currentScope === 'forum' && forumId) fields.push(['c[nodes][0]', forumId], ['c[child_nodes]', '1']);
                else if (currentScope === 'threads' && !fields.some(f => f[0] === 'search_type')) fields.push(['search_type', 'thread']);
                else if (currentScope === 'watched') fields.push(['c[watched]', '1']);
                if (titles && currentScope !== 'thread') fields.push(['c[title_only]', '1']);
                if (by) fields.push(['c[users]', by]);
                if (order) fields.push(['order', 'date']);
                const f = document.createElement('form'); f.method = 'post'; f.action = searchAction; f.target = '_blank'; f.style.display = 'none';
                fields.forEach(kv => { const i = document.createElement('input'); i.type = 'hidden'; i.name = kv[0]; i.value = kv[1]; f.appendChild(i); });
                document.body.appendChild(f); f.submit(); setTimeout(() => f.remove(), 0);
            }
            document.addEventListener('click', e => { const adv = e.target.closest && e.target.closest('.smg-search-adv'); if (adv) { e.preventDefault(); openAdvanced(); } });

            // CONFIG de defaults da busca (engrenagem na barra) — portalizada no body, igual o tooltip
            const cfgPortal = document.createElement('div'); cfgPortal.className = 'smg-search-cfg-portal';
            const cfgRow = (key, label, on) => '<label class="smg-search-cfg-row"><input type="checkbox" data-cfg="' + key + '"' + (on ? ' checked' : '') + '><span>' + label + '</span></label>';
            cfgPortal.innerHTML = '<div class="smg-search-cfg-head">' + i18n('Search defaults') + '</div>' +
                cfgRow(CFG_TITLES, i18n('Titles only by default'), cfgTitles) +
                cfgRow(CFG_ORDER, i18n('Newest first by default'), cfgOrder) +
                cfgRow(CFG_LIKE, i18n('Match partial words'), cfgLike);
            document.body.appendChild(cfgPortal);
            cfgPortal.addEventListener('change', e => {
                const k = e.target.getAttribute && e.target.getAttribute('data-cfg'); if (!k) return;
                const on = !!e.target.checked; localStorage.setItem(k, on ? '1' : '0');
                if (k === CFG_TITLES) cfgTitles = on; else if (k === CFG_ORDER) cfgOrder = on; else if (k === CFG_LIKE) cfgLike = on;
                researchOnFilter();   // re-busca com o novo default (se já tem query)
            });
            function closeCfg() { cfgPortal.classList.remove('open'); document.querySelectorAll('.smg-search-cfg').forEach(b => b.classList.remove('open')); }
            document.addEventListener('click', e => {
                const g = e.target.closest && e.target.closest('.smg-search-cfg');
                if (g) {
                    e.preventDefault(); e.stopPropagation();
                    const willOpen = !cfgPortal.classList.contains('open');
                    closeCfg();
                    if (willOpen) {
                        const r = g.getBoundingClientRect();
                        cfgPortal.classList.add('open');
                        g.classList.add('open');
                        const w = cfgPortal.offsetWidth || 240;
                        let left = r.right - w;
                        if (left < 8) left = 8;
                        if (left + w > window.innerWidth - 8) left = window.innerWidth - 8 - w;
                        cfgPortal.style.left = Math.round(left) + 'px';
                        let top = r.bottom + 6;
                        const h = cfgPortal.offsetHeight || 160;
                        if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
                        cfgPortal.style.top = Math.round(top) + 'px';
                    }
                    return;
                }
                if (!e.target.closest('.smg-search-cfg-portal')) closeCfg();
            });

            // TECLADO: Backspace no início do input remove o chip de contexto ("Neste tópico") → vira "em tudo"
            document.addEventListener('keydown', e => {
                if (e.key !== 'Backspace') return;
                const inp = e.target; if (!inp.matches || !inp.matches('.smg-tb-search-input, .smg-search-input')) return;
                if (currentScope !== 'everywhere' && (inp.value === '' || ((inp.selectionStart || 0) === 0 && (inp.selectionEnd || 0) === 0))) {
                    e.preventDefault();
                    unscope();
                }
            });

            // MENU DE COMANDOS (Tab): paleta pra escolher !a/!tag/!w/!sn/!st/!t/!i com teclado ou clique — descobrível sem decorar
            const CMD_ITEMS = [
                { code: '!t', ins: '!t ', label: i18n('titles only') },
                { code: '!i', ins: '!i ', label: i18n('search post text') },
                { code: '!a', ins: '!a ', label: i18n('author') },
                { code: '!tag', ins: '!tag ', label: i18n('tags / prefix') },
                { code: '!w', ins: '!w ', label: i18n('watched threads') },
                { code: '!sn', ins: '!sn ', label: i18n('by date') },
                { code: '!st', ins: '!st ', label: i18n('Relevance') },
            ];
            const cmdMenu = document.createElement('div'); cmdMenu.className = 'smg-search-cmd';
            cmdMenu.innerHTML = '<div class="smg-search-cmd-head">' + i18n('Search commands') + '</div>' +
                CMD_ITEMS.map((c, i) => '<button type="button" class="smg-search-cmd-item" data-i="' + i + '"><code>' + c.code + '</code><span>' + c.label + '</span></button>').join('');
            document.body.appendChild(cmdMenu);
            let cmdSel = -1;
            let cmdBtnEl = null;   // botão ⇥ que abriu (ganha .open e serve de âncora)
            // âncora = o PRÓPRIO botão ⇥ da barra visível (antes abria colado na esquerda da barra inteira)
            function cmdAnchorFor(el) {
                const bar = (el && el.closest && el.closest('.smg-tb-search, .smg-search-bar'))
                    || (window.innerWidth > 600 && document.querySelector('.smg-tb-search'))
                    || searchPop.querySelector('.smg-search-bar');
                if (!bar) return null;
                return bar.querySelector('.smg-search-cmdbtn') || bar;
            }
            function cmdOpen(anchor) {
                const a = (anchor && anchor.classList && anchor.classList.contains('smg-search-cmdbtn')) ? anchor : cmdAnchorFor(anchor);
                if (!a) return;
                cmdMenu.classList.add('open');                       // mede já visível (offsetWidth/Height)
                cmdBtnEl = a.classList.contains('smg-search-cmdbtn') ? a : null;
                if (cmdBtnEl) cmdBtnEl.classList.add('open');
                const r = a.getBoundingClientRect();
                const w = cmdMenu.offsetWidth, h = cmdMenu.offsetHeight;
                let left = r.right - w;                              // alinhado pela DIREITA do botão…
                left = Math.min(Math.max(8, left), Math.max(8, window.innerWidth - w - 8));   // …e preso na viewport
                let top = r.bottom + 6;
                if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);       // sem espaço abaixo → abre acima
                cmdMenu.style.left = left + 'px';
                cmdMenu.style.top = top + 'px';
                cmdSetSel(0);
            }
            function cmdClose() {
                cmdMenu.classList.remove('open'); cmdSel = -1;
                if (cmdBtnEl) { cmdBtnEl.classList.remove('open'); cmdBtnEl = null; }
            }
            function cmdSetSel(i) {
                const items = cmdMenu.querySelectorAll('.smg-search-cmd-item'); if (!items.length) return;
                cmdSel = (i + items.length) % items.length;
                items.forEach((el, j) => el.classList.toggle('sel', j === cmdSel));
            }
            function cmdInsert(i) {
                const c = CMD_ITEMS[i]; if (!c) return;
                const inp = getSearchInput(); const v = inp.value.replace(/\s+$/, '');
                inp.value = (v ? v + ' ' : '') + c.ins;
                cmdClose(); inp.focus();
                try { const L = inp.value.length; inp.setSelectionRange(L, L); } catch (e) {}
                inp.dispatchEvent(new Event('input', { bubbles: true }));   // re-avalia (flags re-buscam; !a espera o nome)
            }
            cmdMenu.addEventListener('mousedown', e => { const it = e.target.closest && e.target.closest('.smg-search-cmd-item'); if (it) { e.preventDefault(); cmdInsert(+it.dataset.i); } });
            // CAPTURE: roda ANTES dos handlers de Enter→buscar; com o menu aberto, intercepta a navegação/seleção
            document.addEventListener('keydown', e => {
                if (!e.target.matches || !e.target.matches('.smg-tb-search-input, .smg-search-input')) return;
                const open = cmdMenu.classList.contains('open');
                if (e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); if (!open) cmdOpen(e.target); else cmdSetSel(cmdSel + (e.shiftKey ? -1 : 1)); return; }
                if (!open) return;
                if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); cmdSetSel(cmdSel + 1); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); cmdSetSel(cmdSel - 1); }
                else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); cmdInsert(cmdSel); }
                else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cmdClose(); }
                else cmdClose();   // qualquer outra tecla → fecha e segue digitando
            }, true);
            // fora = fecha. O PRÓPRIO ⇥ fica de fora: senão o mousedown fechava e o click reabria (o toggle nunca desligava).
            document.addEventListener('mousedown', e => { if (cmdMenu.classList.contains('open') && !(e.target.closest && (e.target.closest('.smg-search-cmd') || e.target.closest('.smg-search-cmdbtn') || e.target.closest('.smg-tb-search-input, .smg-search-input')))) cmdClose(); });
            window.addEventListener('resize', () => { if (cmdMenu.classList.contains('open')) cmdClose(); });   // âncora se move → fecha (em vez de flutuar solto)
            // botão ⇥ (indica que o Tab existe + abre a paleta no clique → também serve no mobile, que não tem Tab)
            document.addEventListener('click', e => {
                const b = e.target.closest && e.target.closest('.smg-search-cmdbtn'); if (!b) return;
                e.preventDefault(); e.stopPropagation();
                if (cmdMenu.classList.contains('open')) cmdClose(); else { cmdOpen(b); try { getSearchInput().focus(); } catch (x) {} }
            });

            // %LIKE%: a busca (MySQL fulltext) não acha por parte da palavra → wildcard de PREFIXO (termo* = LIKE 'termo%').
            // Infix real (%termo%) o fulltext não suporta; respeita aspas/operadores (+ - " *) do usuário. Liga/desliga na config.
            function likeify(q) {
                if (!cfgLike || !q || /[*"+\-]/.test(q)) return q;
                return q.split(/\s+/).map(w => (w.length >= 3 && /^[\wÀ-ſ]+$/.test(w)) ? w + '*' : w).join(' ');
            }

            // ---- histórico (últimos 1000, COMPARTILHADO entre os fóruns via GM storage) ----
            const SEARCH_HISTORY_KEY = 'smg-search-history';
            const HIST_CHUNK = 20;   // linhas por lote: render incremental no scroll (nunca monta as 1000 de uma vez)
            const HIST_MAX = 1000;
            const SCOPE_LABEL = { everywhere: 'Everywhere', threads: 'Threads', forum: 'This forum', thread: 'This thread' };
            let histShown = 0;       // linhas já renderizadas na lista (índice do próximo lote)

            // gmGet/gmSet usam GM_*Value (mesmo storage do script em todos os domínios), com fallback localStorage
            // PERF: parse 1× por sessão (cache) — o JSON.parse de até 1000 entradas (~100KB) rodava a CADA
            // keystroke <3 chars (clearResults→renderHistory). Outra aba gravar não invalida o cache: staleness
            // aceitável (resolve no F5); esta aba sempre escreve via saveHistory, que atualiza o cache.
            let histCache = null;
            const loadHistory = () => { if (histCache) return histCache; try { histCache = JSON.parse(gmGet(SEARCH_HISTORY_KEY, '[]')) || []; } catch { histCache = []; } return histCache; };
            const saveHistory = arr => { histCache = arr; gmSet(SEARCH_HISTORY_KEY, JSON.stringify(arr)); };

            const histKey = e => (e.q || '') + '|' + (e.by || '') + '|' + (e.scope || '') + '|' + (e.titles ? 1 : 0) + '|' + (e.order || '');

            function addHistory(entry) {
                if (!entry.q && !entry.by) return;
                const k = histKey(entry);
                const arr = loadHistory().filter(e => histKey(e) !== k); // dedupe: move pro topo
                arr.unshift(entry);
                saveHistory(arr.slice(0, HIST_MAX));
            }

            function removeHistory(entry) {   // só persiste — a linha sai do DOM no handler do × (sem re-render → scroll preservado)
                const k = histKey(entry);
                saveHistory(loadHistory().filter(e => histKey(e) !== k));
            }

            // reconstrói o TEXTO da barra (keywords limpas) a partir de uma entrada do histórico
            function entryToBar(e) {
                return (e.q || '').trim();
            }
            function fillFromEntry(e) {
                applyingEntry = true;
                getSearchInput().value = entryToBar(e);
                if (authorInput) {
                    authorInput.value = e.by || '';
                    const box = authorInput.closest('.smg-search-author-box');
                    if (box) box.classList.toggle('has-value', !!e.by);
                }
                if (toggleTitleOnly) {
                    toggleTitleOnly.checked = !!e.titles;
                }
                if (sortSelect) {
                    sortSelect.value = (e.order === 'date') ? 'date' : 'relevance';
                }
                currentScope = ((e.scope === 'thread' && threadId) || (e.scope === 'forum' && forumId)) ? e.scope : 'everywhere';   // só reusa o escopo se existe NESTA página
                applyScopeUI();
                applyingEntry = false;
            }
            function applyHistoryEntry(e) { fillFromEntry(e); doSearch(true); }            // clique na linha: busca direto (grava)
            function sendToBar(e) { fillFromEntry(e); getSearchInput().focus(); }       // ↖ manda pra barra SEM buscar (ajusta filtros e busca depois)
            function openOnOther(e) {                                                   // ↗ abre a MESMA busca no OUTRO fórum (simpcity ↔ smg)
                const other = /socialmediagirls/i.test(location.hostname) ? 'https://simpcity.cr/' : 'https://forums.socialmediagirls.com/';
                const payload = { q: e.q || '', by: e.by || '', titles: !!e.titles, threads: e.scope === 'threads', order: e.order || '' };
                window.open(other + '#smg-xsearch=' + encodeURIComponent(JSON.stringify(payload)), '_blank', 'noopener');
            }

            function buildHistRow(e) {
                const row = document.createElement('button');
                row.type = 'button';
                row.className = 'smg-search-hist-item';
                const tags = [];
                if (e.scope && e.scope !== 'everywhere') tags.push(i18n(SCOPE_LABEL[e.scope] || e.scope));
                if (e.q && e.by) tags.push(i18n('author') + ': ' + e.by);
                if (e.titles) tags.push(i18n('titles only'));
                if (e.order === 'date') tags.push(i18n('by date'));
                const otherLabel = /socialmediagirls/i.test(location.hostname) ? 'SimpCity' : 'SocialMediaGirls';
                row.innerHTML =
                    '<span class="smg-search-hist-ico">' + ICONS.search + '</span>' +
                    '<span class="smg-search-hist-q"></span>' +
                    (tags.length ? '<span class="smg-search-hist-meta"></span>' : '') +
                    '<span class="smg-search-hist-acts">' +
                        '<span class="smg-search-hist-act smg-search-hist-edit" role="button" aria-label="' + i18n('Edit in search bar') + '" title="' + i18n('Edit in search bar') + '">' + svgIcon('<line x1="17" y1="17" x2="7" y2="7"/><polyline points="7 17 7 7 17 7"/>') + '</span>' +
                        '<span class="smg-search-hist-act smg-search-hist-cross" role="button" aria-label="' + i18n('Search on') + ' ' + otherLabel + '" title="' + i18n('Search on') + ' ' + otherLabel + '">' + svgIcon('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>') + '</span>' +
                        '<span class="smg-search-hist-act smg-search-hist-remove" role="button" aria-label="' + i18n('Remove') + '">' + ICONS.close + '</span>' +
                    '</span>';
                row.querySelector('.smg-search-hist-q').textContent = e.q || (i18n('author') + ': ' + e.by);
                if (tags.length) row.querySelector('.smg-search-hist-meta').textContent = tags.join(' · ');
                row.addEventListener('click', () => applyHistoryEntry(e));
                row.querySelector('.smg-search-hist-edit').addEventListener('click', ev => { ev.stopPropagation(); sendToBar(e); });
                row.querySelector('.smg-search-hist-cross').addEventListener('click', ev => { ev.stopPropagation(); openOnOther(e); });
                row.querySelector('.smg-search-hist-remove').addEventListener('click', ev => {
                    ev.stopPropagation();
                    removeHistory(e);                       // persiste
                    row.remove();                           // tira SÓ a linha (sem re-render → o scroll fica onde está)
                    histShown = Math.max(0, histShown - 1);
                    const all = loadHistory();
                    searchHistBadge.textContent = all.length;
                    if (!all.length) { renderHistory(); return; }   // zerou → estado vazio
                    // lista ficou curta demais pra rolar → repõe a linha removida
                    if (histShown < all.length && searchHistList.scrollHeight - searchHistList.scrollTop - searchHistList.clientHeight < 220) appendHistChunk(all, 1);
                });
                return row;
            }
            // anexa as próximas n linhas a partir de histShown (render incremental — as ~1000 nunca montam de uma vez)
            function appendHistChunk(all, n) {
                const end = Math.min(all.length, histShown + n);
                for (let i = histShown; i < end; i++) { const row = buildHistRow(all[i]); searchHistList.appendChild(row); i18nDom(row); }
                histShown = end;
            }
            function renderHistory() {
                const all = loadHistory();
                if (!all.length) { searchHistEl.hidden = true; searchEmptyEl.hidden = false; return; }   // sem histórico → estado vazio (não um toco só com a toolbar)
                searchEmptyEl.hidden = true;
                searchHistEl.hidden = false;
                searchHistBadge.textContent = all.length;
                // lista SEMPRE scrollável: mostra ~6 linhas e rola pro resto, carregando em lotes (sem "Show all")
                searchHistList.classList.add('smg-search-hist-list--scroll');
                searchHistList.scrollTop = 0;
                searchHistList.innerHTML = '';
                histShown = 0;
                appendHistChunk(all, HIST_CHUNK);
            }
            // perto do fundo → próximo lote (rAF-throttled, passive — padrão onScrollRaf, mas no scroll DA LISTA)
            let histScrollTick = false;
            searchHistList.addEventListener('scroll', () => {
                if (histScrollTick) return;
                histScrollTick = true;
                requestAnimationFrame(() => {
                    histScrollTick = false;
                    if (searchHistList.scrollHeight - searchHistList.scrollTop - searchHistList.clientHeight >= 220) return;
                    const all = loadHistory();
                    if (histShown < all.length) appendHistChunk(all, HIST_CHUNK);
                });
            }, { passive: true });

            searchHistClear.addEventListener('click', () => {
                if (!confirm(i18n('Clear all recent searches?'))) return;   // confirma antes de apagar
                saveHistory([]); renderHistory();
            });

            // mobile: mantém o sheet ACIMA do teclado e sem passar do topo da tela (visualViewport)
            const vv = window.visualViewport;
            function syncSearchKeyboard() {
                if (!vv || !searchOverlay.classList.contains('open')) return;
                if (window.innerWidth > 600) { searchPop.style.bottom = ''; searchPop.style.maxHeight = ''; return; }
                const kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));  // altura do teclado
                searchPop.style.bottom = kb + 'px';                            // encosta acima do teclado
                searchPop.style.maxHeight = Math.round(vv.height - 8) + 'px';  // nunca ultrapassa o topo visível
            }
            if (vv) { vv.addEventListener('resize', syncSearchKeyboard); vv.addEventListener('scroll', syncSearchKeyboard); }

            // DROPDOWN (desktop): ancora o pop abaixo do input REAL da topbar. MODAL (mobile/sem topbar): centralizado, como antes.
            const isDrop = () => window.innerWidth > 600 && !!document.querySelector('.smg-tb-search-input');
            function positionDrop() {
                const bar = document.querySelector('.smg-tb-search'); if (!bar) return;
                const r = bar.getBoundingClientRect();
                const w = Math.min(Math.max(r.width, 460), window.innerWidth - 16);
                let left = r.left; if (left + w > window.innerWidth - 8) left = window.innerWidth - 8 - w; if (left < 8) left = 8;
                // writes guardados: o followDrop roda por frame — só escreve quando a âncora moveu de fato
                const t = (r.bottom + 8) + 'px', l = left + 'px', ww = w + 'px';
                if (searchPop.style.top !== t) searchPop.style.top = t;
                if (searchPop.style.left !== l) searchPop.style.left = l;
                if (searchPop.style.width !== ww) searchPop.style.width = ww;
            }
            // A topbar pode encolher durante uma transição e mudar de posição ao rolar. Observa apenas
            // esses eventos: um rAF contínuo mantinha a aba fazendo layout mesmo quando nada se movia.
            let dropPositionRaf = 0;
            let dropResizeObserver = null;
            let dropPositionBound = false;
            function scheduleDropPosition() {
                if (dropPositionRaf) return;
                dropPositionRaf = requestAnimationFrame(() => {
                    dropPositionRaf = 0;
                    if (searchOverlay.classList.contains('open') && searchPop.classList.contains('smg-search-pop--drop')) positionDrop();
                });
            }
            function bindDropPositioning() {
                if (dropPositionBound) return;
                dropPositionBound = true;
                const bar = document.querySelector('.smg-tb-search');
                if (typeof ResizeObserver !== 'undefined' && bar) {
                    dropResizeObserver = new ResizeObserver(scheduleDropPosition);
                    dropResizeObserver.observe(bar);
                }
                window.addEventListener('resize', scheduleDropPosition, { passive: true });
                window.addEventListener('scroll', scheduleDropPosition, { passive: true });
                if (bar) bar.addEventListener('transitionend', scheduleDropPosition);
            }
            function unbindDropPositioning() {
                dropPositionBound = false;
                if (dropResizeObserver) { dropResizeObserver.disconnect(); dropResizeObserver = null; }
                window.removeEventListener('resize', scheduleDropPosition);
                window.removeEventListener('scroll', scheduleDropPosition);
                if (dropPositionRaf) { cancelAnimationFrame(dropPositionRaf); dropPositionRaf = 0; }
                const bar = document.querySelector('.smg-tb-search');
                if (bar) bar.removeEventListener('transitionend', scheduleDropPosition);
            }
            let searchLocked = false;   // o modal trava o fundo; o dropdown do desktop não (pareado no closeSearch)
            function openSearch() {
                refreshPrefixHarvest(() => {
                    if (badgeMultiselect && typeof badgeMultiselect.updateBadges === 'function') {
                        badgeMultiselect.updateBadges(getAllSearchBadges());
                    }
                });
                closePopovers();
                clearResults();   // some com os resultados da busca anterior + re-renderiza o histórico
                searchHistList.scrollTop = 0;   // sempre abre no topo da lista
                applyScopeUI();   // reflete o chip de contexto + placeholder ao abrir
                const drop = isDrop();
                searchOverlay.classList.toggle('smg-search-overlay--drop', drop);
                searchPop.classList.toggle('smg-search-pop--drop', drop);
                if (!drop) { unbindDropPositioning(); searchPop.style.top = ''; searchPop.style.left = ''; searchPop.style.width = ''; }
                searchOverlay.classList.add('open');
                if (drop) { bindDropPositioning(); positionDrop(); }
                // modal (mobile): trava o fundo, senão a página rola atrás enquanto você digita e
                // o arrasto pra fechar leva o documento junto. No dropdown do desktop, não.
                if (!drop && !searchLocked) { searchLocked = true; smgLockScroll(); }
                document.documentElement.classList.add('smg-search-open');   // mostra o botão Buscar dentro do input da topbar (CSS)
                // foco síncrono mantém o gesto p/ abrir o teclado no mobile (no desktop o input já é o da topbar, foco é no-op)
                getSearchInput().focus({ preventScroll: true });
                if (!drop) { syncSearchKeyboard(); setTimeout(syncSearchKeyboard, 260); }   // mobile: ajusta acima do teclado
            }

            function closeSearch() {
                closeCfg();
                unbindDropPositioning();
                if (searchSentinelIO) { searchSentinelIO.disconnect(); searchSentinelIO = null; }
                if (searchSentinelEl && searchSentinelEl.parentNode) searchSentinelEl.remove();
                searchSentinelEl = null;
                if (searchResultsEl) searchResultsEl.onscroll = null;
                if (searchPop) searchPop.onscroll = null;
                searchOverlay.classList.remove('open');
                if (searchLocked) { searchLocked = false; smgUnlockScroll(); }
                document.documentElement.classList.remove('smg-search-open');
                searchPop.style.bottom = ''; searchPop.style.maxHeight = '';   // limpa pra animação de saída
                searchPop.style.top = ''; searchPop.style.left = ''; searchPop.style.width = '';   // limpa o posicionamento do dropdown
            }

            function doSearch(addToHistory) {
                let keywords = getSearchInput().value.trim();
                const titlesOn = toggleTitleOnly?.checked ?? cfgTitles;
                const orderDate = (sortSelect?.value === 'date') || cfgOrder;
                const by = authorInput?.value.trim();
                const activeBadges = Array.from(activeSearchBadges);

                if (!keywords && !by && !activeBadges.length && currentScope !== 'watched') return;

                if (addToHistory) addHistory({ q: keywords || activeBadges.join(' '), by, scope: currentScope, titles: titlesOn, order: orderDate ? 'date' : '', t: Date.now() });

                const token = qsForm?.querySelector('input[name="_xfToken"]')?.value
                    || document.querySelector('input[name="_xfToken"]')?.value || '';

                const fields = [['_xfToken', token]];
                let hasPid = false;
                const fallbackBadges = [];
                if (activeBadges.length) {
                    activeBadges.forEach(b => {
                        const k = b.toLowerCase().trim();
                        const pid = globalPrefixMap.get(k) || (typeof serverPrefixMap !== 'undefined' && serverPrefixMap.get(k));
                        if (pid) {
                            fields.push(['c[prefixes][]', pid]);
                            hasPid = true;
                        } else {
                            fallbackBadges.push(b);
                        }
                    });
                }
                if (fallbackBadges.length) {
                    keywords = (keywords ? (keywords + ' ') : '') + fallbackBadges.join(' ');
                }
                if (keywords) {
                    fields.push(['keywords', likeify(keywords)]);
                } else if (hasPid) {
                    fields.push(['search_type', 'thread']);
                }
                if (currentScope === 'watched') {
                    fields.push(['c[watched]', '1']);
                }
                // ESCOPO: dentro do tópico busca POSTS (c[thread]); no fórum, posts dos nós (com filhos). title_only só faz sentido fora do tópico.
                if (currentScope === 'thread' && threadId) fields.push(['c[thread]', threadId], ['search_type', 'post']);   // search_type=post é OBRIGATÓRIO p/ restringir À thread (senão o XF busca threads no global e ignora c[thread])
                else if (currentScope === 'forum' && forumId) fields.push(['c[nodes][0]', forumId], ['c[child_nodes]', '1']);
                else if (currentScope === 'threads' && !fields.some(f => f[0] === 'search_type')) fields.push(['search_type', 'thread']);
                if (titlesOn && currentScope !== 'thread') fields.push(['c[title_only]', '1']);
                if (orderDate) fields.push(['order', 'date']);   // omitido = relevance (default do XF)
                if (by) fields.push(['c[users]', by]);

                runSearchInline(fields);
            }
            // === busca INLINE: faz o fetch dos resultados e mostra NO PRÓPRIO dropdown (em vez de navegar) ===
            let searchSeq = 0, searchAbort = null;
            let currentSearchNextUrl = null;
            let searchIsLoadingMore = false;
            let searchSentinelEl = null;
            let searchSentinelIO = null;

            function renderSearchCard(r, terms) {
                const a = document.createElement('a');
                a.className = 'smg-search-result'; a.href = r.href;
                if (r.photo) {
                    const f = document.createElement('span'); f.className = 'smg-search-result-fig';
                    const img = document.createElement('img'); img.loading = 'lazy'; img.referrerPolicy = 'no-referrer'; img.alt = '';
                    img.src = r.photo;
                    img.addEventListener('error', () => f.remove(), { once: true });
                    f.appendChild(img); a.appendChild(f);
                }
                const main = document.createElement('span'); main.className = 'smg-search-result-main';
                const tr = document.createElement('span'); tr.className = 'smg-search-result-titlerow';
                (r.labels || []).forEach(l => tr.appendChild(l.cloneNode(true)));
                const t = document.createElement('span'); t.className = 'smg-search-result-title'; setHL(t, r.title, terms); tr.appendChild(t);
                main.appendChild(tr);
                if (r.snippet) { const s = document.createElement('span'); s.className = 'smg-search-result-snippet'; setHL(s, r.snippet, terms); main.appendChild(s); }
                if (r.meta) { const m = document.createElement('span'); m.className = 'smg-search-result-meta'; m.textContent = r.meta; main.appendChild(m); }
                a.appendChild(main);
                a.addEventListener('click', commitCurrentSearch);
                return a;
            }

            function loadMoreSearchResults() {
                if (searchIsLoadingMore || !currentSearchNextUrl) return Promise.resolve();
                searchIsLoadingMore = true;
                if (searchSentinelEl) searchSentinelEl.classList.add('is-loading');
                const urlToFetch = currentSearchNextUrl;
                return fetchDoc(urlToFetch, { credentials: 'same-origin' })
                    .then(doc => {
                        if (!doc) throw new Error('No doc');
                        const moreResults = parseSearchResults(doc);
                        let moreFiltered = moreResults;
                        if (activeSearchBadges && activeSearchBadges.size > 0) {
                            const activeLower = Array.from(activeSearchBadges).map(b => b.toLowerCase().trim());
                            moreFiltered = moreResults.filter(r => {
                                const labelTexts = (r.labels || []).map(l => (l.textContent || '').toLowerCase().replace(/^[#\s\[\]]+|[#\s\[\]]+$/g, '').trim());
                                const hasLabel = activeLower.some(ab => labelTexts.some(lt => lt === ab || lt.includes(ab) || ab.includes(lt)));
                                if (hasLabel) return true;
                                const tLower = (r.title || '').toLowerCase();
                                return activeLower.some(ab => tLower.includes(ab));
                            });
                        }
                        const curTerms = hlTerms();
                        moreFiltered.forEach(r => {
                            const card = renderSearchCard(r, curTerms);
                            if (searchSentinelEl && searchSentinelEl.parentNode) {
                                searchResultsEl.insertBefore(card, searchSentinelEl);
                            } else {
                                searchResultsEl.appendChild(card);
                            }
                        });
                        const nextEl = doc.querySelector('.pageNav-jump--next, .pageNavSimple-el--next, a[rel="next"]');
                        let nextUrl = nextEl ? nextEl.getAttribute('href') : null;
                        if (nextUrl) {
                            try { nextUrl = new URL(nextUrl, urlToFetch).href; } catch (e) {}
                        }
                        currentSearchNextUrl = nextUrl;
                        if (!currentSearchNextUrl) {
                            if (searchSentinelIO) { searchSentinelIO.disconnect(); searchSentinelIO = null; }
                            if (searchSentinelEl && searchSentinelEl.parentNode) searchSentinelEl.remove();
                            searchSentinelEl = null;
                            searchResultsEl.onscroll = null;
                            if (searchPop) searchPop.onscroll = null;
                        }
                    })
                    .catch(err => {
                        if (searchSentinelIO) { searchSentinelIO.disconnect(); searchSentinelIO = null; }
                        if (searchSentinelEl && searchSentinelEl.parentNode) searchSentinelEl.remove();
                        searchSentinelEl = null;
                        searchResultsEl.onscroll = null;
                        if (searchPop) searchPop.onscroll = null;
                    })
                    .finally(() => {
                        if (searchSentinelEl) searchSentinelEl.classList.remove('is-loading');
                        searchIsLoadingMore = false;
                    });
            }

            function runSearchInline(fields) {
                refreshPrefixHarvest();
                const seq = ++searchSeq;
                if (searchAbort) searchAbort.abort();   // mata o POST anterior (full-text é caro no servidor; o seq só descartava a RESPOSTA — a request continuava rodando)
                const ctrl = searchAbort = (typeof AbortController === 'function') ? new AbortController() : null;
                searchHistEl.hidden = true;   // esconde o histórico enquanto mostra resultados
                searchEmptyEl.hidden = true;
                searchResultsEl.hidden = false;
                searchResultsEl.innerHTML = '<div class="smg-search-rloading"><span class="smg-loading"></span></div>';
                const body = fields.map(f => encodeURIComponent(f[0]) + '=' + encodeURIComponent(f[1])).join('&');
                fetch(searchAction, { method: 'POST', body: body, credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: ctrl ? ctrl.signal : undefined })
                    .then(r => r.text().then(html => ({ html: html, url: r.url })))
                    .then(o => {
                        if (seq === searchSeq) {
                            const doc = new DOMParser().parseFromString(o.html, 'text/html');
                            const results = parseSearchResults(doc);
                            const nextEl = doc.querySelector('.pageNav-jump--next, .pageNavSimple-el--next, a[rel="next"]');
                            let nextUrl = nextEl ? nextEl.getAttribute('href') : null;
                            if (nextUrl) {
                                try { nextUrl = new URL(nextUrl, o.url || location.href).href; } catch (e) {}
                            }
                            paintResults(results, nextUrl);
                        }
                    })
                    .catch(err => { if (seq === searchSeq && !(err && err.name === 'AbortError')) searchResultsEl.innerHTML = '<div class="smg-search-noresults">' + i18n('Search failed') + '</div>'; });
            }
            function parseSearchResults(doc) {
                const out = [];
                doc.querySelectorAll('.block-body .contentRow').forEach(row => {
                    const a = row.querySelector('.contentRow-title a[href], h3 a[href], .contentRow-main a[href]');
                    if (!a) return;
                    let href = a.getAttribute('href') || '';
                    try { href = new URL(href, location.href).href; } catch (e) {}
                    const snip = row.querySelector('.contentRow-snippet');
                    const minor = row.querySelector('.contentRow-minor');
                    // prefixos/tags: SimpCity usa .label; SMG usa .prefix (mesma divergência dos alertas) → seletor cobre os dois, senão a tag vaza no título ("YoutubersGals Of Gurk")
                    const LABEL_SEL = '.label, .label-append, [class*="label--"], .prefix, [class*="prefix"]';
                    const titleEl = a.closest('.contentRow-title') || a.parentElement;
                    const labels = titleEl ? Array.from(titleEl.querySelectorAll(LABEL_SEL)) : [];
                    const aClone = a.cloneNode(true);   // tags vêm DENTRO do <a> → tira do texto do título (senão duplica/cola)
                    aClone.querySelectorAll(LABEL_SEL).forEach(l => l.remove());
                    // FOTO = thumbnail do tópico (.structItem-cell--icon > .dcThumbnail; a URL real está no background-image do <img>). Reusa o dcThumbUrl.
                    const thumbEl = row.querySelector('.dcThumbnail');
                    let photo = thumbEl ? dcThumbUrl(thumbEl) : '';
                    if (/no_image|defaultThumbnail/i.test(photo)) photo = '';   // placeholder "sem imagem" → ignora
                    out.push({
                        href: href,
                        title: aClone.textContent.replace(/\s+/g, ' ').trim(),
                        snippet: snip ? snip.textContent.replace(/\s+/g, ' ').trim() : '',
                        meta: minor ? minor.textContent.replace(/\s+/g, ' ').trim() : '',
                        photo: photo,   // URL do thumbnail (string) — img limpa no paint (sem clonar <a> aninhado)
                        labels: labels.map(l => document.importNode(l, true)),  // tags/prefixos originais
                    });
                });
                return out;
            }
            // clicar num resultado (ou "Ver todos") TAMBÉM grava a busca no histórico — antes só Enter/Buscar gravava, então type→clica-link se perdia
            function commitCurrentSearch() {
                const keywords = getSearchInput().value.trim();
                const titlesOn = toggleTitleOnly?.checked ?? cfgTitles;
                const orderDate = (sortSelect?.value === 'date') || cfgOrder;
                const by = authorInput?.value.trim() || '';
                const activeBadges = Array.from(activeSearchBadges);
                addHistory({ q: keywords || activeBadges.join(' '), by, scope: currentScope, titles: (titlesOn === true), order: orderDate ? 'date' : '', t: Date.now() });
            }
            // termos p/ highlight = keywords digitadas (sem aspas/wildcard), ≥2 chars
            function hlTerms() {
                const kw = getSearchInput().value.trim();
                return kw.split(/\s+/).map(s => s.replace(/["*]/g, '').trim()).filter(s => s.length >= 2);
            }
            // escreve `text` em `el` envolvendo as ocorrências dos termos em <mark> (text nodes → SEM injeção de HTML).
            // como a busca usa wildcard de prefixo, o termo "fileste" destaca a palavra inteira "filester" ([\w] após o termo).
            function setHL(el, text, terms) {
                el.textContent = '';
                if (!terms.length || !text) { el.textContent = text || ''; return; }
                const esc = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\w]*');
                let re; try { re = new RegExp('(' + esc.join('|') + ')', 'ig'); } catch (e) { el.textContent = text; return; }
                let last = 0, m;
                while ((m = re.exec(text))) {
                    if (m.index > last) el.appendChild(document.createTextNode(text.slice(last, m.index)));
                    const mk = document.createElement('mark'); mk.className = 'smg-search-hl'; mk.textContent = m[0];
                    el.appendChild(mk);
                    last = m.index + m[0].length;
                    if (re.lastIndex === m.index) re.lastIndex++;   // guarda contra match vazio
                }
                if (last < text.length) el.appendChild(document.createTextNode(text.slice(last)));
            }
            function paintResults(results, nextUrl) {
                searchResultsEl.innerHTML = '';
                currentSearchNextUrl = nextUrl || null;
                searchIsLoadingMore = false;
                if (searchSentinelIO) { searchSentinelIO.disconnect(); searchSentinelIO = null; }
                if (searchSentinelEl && searchSentinelEl.parentNode) searchSentinelEl.remove();
                searchSentinelEl = null;
                searchResultsEl.onscroll = null;
                if (searchPop) searchPop.onscroll = null;

                const terms = hlTerms();

                let filtered = results;
                if (activeSearchBadges && activeSearchBadges.size > 0) {
                    const activeLower = Array.from(activeSearchBadges).map(b => b.toLowerCase().trim());
                    filtered = results.filter(r => {
                        const labelTexts = (r.labels || []).map(l => (l.textContent || '').toLowerCase().replace(/^[#\s\[\]]+|[#\s\[\]]+$/g, '').trim());
                        const hasLabel = activeLower.some(ab => labelTexts.some(lt => lt === ab || lt.includes(ab) || ab.includes(lt)));
                        if (hasLabel) return true;
                        // Fallback: se o título do tópico contém a badge
                        const tLower = (r.title || '').toLowerCase();
                        return activeLower.some(ab => tLower.includes(ab));
                    });
                }

                if (!filtered.length) {
                    const e = document.createElement('div');
                    e.className = 'smg-search-noresults';
                    e.textContent = (activeSearchBadges && activeSearchBadges.size > 0)
                        ? (IS_PT ? 'Nenhum resultado com os filtros selecionados' : 'No results found with selected filters')
                        : i18n('No results');
                    searchResultsEl.appendChild(e);
                } else {
                    filtered.forEach(r => {
                        searchResultsEl.appendChild(renderSearchCard(r, terms));
                    });
                }

                if (currentSearchNextUrl) {
                    searchSentinelEl = document.createElement('div');
                    searchSentinelEl.className = 'smg-search-sentinel';
                    searchSentinelEl.innerHTML = '<span class="smg-loading"></span>';
                    searchResultsEl.appendChild(searchSentinelEl);

                    if (typeof IntersectionObserver !== 'undefined') {
                        if (searchSentinelIO) searchSentinelIO.disconnect();
                        searchSentinelIO = new IntersectionObserver((entries) => {
                            if (entries.some(e => e.isIntersecting)) {
                                loadMoreSearchResults();
                            }
                        }, {
                            root: searchResultsEl,
                            rootMargin: '250px'
                        });
                        searchSentinelIO.observe(searchSentinelEl);
                    }

                    const checkScroll = (target) => {
                        if (!target || searchIsLoadingMore || !currentSearchNextUrl) return;
                        if (target.scrollHeight - target.scrollTop - target.clientHeight <= 350) {
                            loadMoreSearchResults();
                        }
                    };
                    searchResultsEl.onscroll = () => checkScroll(searchResultsEl);
                    if (searchPop) searchPop.onscroll = () => checkScroll(searchPop);
                }

                searchResultsEl.hidden = false;
            }
            function clearResults() {   // volta pro histórico — sem re-render se ele JÁ está na tela (era rebuild por keystroke)
                currentSearchNextUrl = null;
                searchIsLoadingMore = false;
                if (searchSentinelIO) { searchSentinelIO.disconnect(); searchSentinelIO = null; }
                if (searchSentinelEl && searchSentinelEl.parentNode) searchSentinelEl.remove();
                searchSentinelEl = null;
                searchResultsEl.onscroll = null;
                if (searchPop) searchPop.onscroll = null;
                if (!searchResultsEl.hidden) { searchResultsEl.hidden = true; searchResultsEl.innerHTML = ''; }
                if (searchHistEl.hidden && searchEmptyEl.hidden) renderHistory();
            }
            // DEBOUNCE: busca enquanto digita (não grava histórico; só Enter/Buscar grava). Delegado: vale pro input da topbar E do modal + autor.
            let searchDebounce = null;
            function onSearchInput() {
                clearTimeout(searchDebounce);
                const kw = getSearchInput().value.trim();
                const by = authorInput ? authorInput.value.trim() : '';
                const hasBadges = activeSearchBadges && activeSearchBadges.size > 0;
                if (kw.length < 3 && !by && !hasBadges && currentScope !== 'watched') { clearResults(); return; }   // vazio/curto demais → histórico (XF tem mínimo de caracteres)
                searchDebounce = setTimeout(() => doSearch(false), 420);
            }
            document.addEventListener('input', e => { if (e.target && e.target.matches && e.target.matches('.smg-tb-search-input, .smg-search-input')) onSearchInput(); });
            // mudança de FILTRO (escopo via chip) re-busca JÁ (sem debounce) se já existe query. Hoisted → ok no init.
            function researchOnFilter() {
                if (applyingEntry) return;
                const kw = getSearchInput().value.trim();
                const by = authorInput ? authorInput.value.trim() : '';
                const hasBadges = activeSearchBadges && activeSearchBadges.size > 0;
                if (kw.length < 3 && !by && !hasBadges && currentScope !== 'watched') return;
                clearTimeout(searchDebounce);
                doSearch(false);
            }

            searchInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') { e.preventDefault(); clearTimeout(searchDebounce); doSearch(true); }
                else if (e.key === 'Escape') closePopovers();
            });
            searchPop.querySelector('.smg-search-go').addEventListener('click', () => { clearTimeout(searchDebounce); doSearch(true); });

            // Toolbar de Filtros Completa no Search Global (Organizada em 2 Rows)
            const searchToolbarEl = searchPop.querySelector('.smg-search-global-toolbar');
            if (searchToolbarEl) {
                searchToolbarEl.innerHTML = '';

                // Obter badges conhecidas (DOM + PREFIX_CATEGORY_MAP + serverPrefixMap)
                const getAllSearchBadges = () => {
                    const badgeMap = new Map();
                    if (typeof getPageBadges === 'function') {
                        try {
                            getPageBadges().forEach(b => {
                                const k = (b.name || '').toLowerCase().trim();
                                if (k) badgeMap.set(k, b);
                            });
                        } catch (e) {}
                    }
                    if (typeof PREFIX_CATEGORY_MAP !== 'undefined') {
                        Object.keys(PREFIX_CATEGORY_MAP).forEach(k => {
                            const lower = k.toLowerCase().trim();
                            if (!badgeMap.has(lower)) {
                                const displayName = lower.charAt(0).toUpperCase() + lower.slice(1);
                                let cls = (typeof KNOWN_XF_PREFIXES !== 'undefined' && KNOWN_XF_PREFIXES[lower])
                                    ? KNOWN_XF_PREFIXES[lower]
                                    : 'label label--misc';
                                if (!cls.includes('label')) cls = 'label ' + cls;
                                badgeMap.set(lower, { name: displayName, type: 'prefix', className: cls, count: 0 });
                            }
                        });
                    }
                    if (typeof globalPrefixMap !== 'undefined' && globalPrefixMap && globalPrefixMap.size > 0) {
                        globalPrefixMap.forEach((prefixId, nameKey) => {
                            const lower = nameKey.toLowerCase().trim();
                            if (!badgeMap.has(lower)) {
                                const displayName = lower.charAt(0).toUpperCase() + lower.slice(1);
                                let cls = (typeof KNOWN_XF_PREFIXES !== 'undefined' && KNOWN_XF_PREFIXES[lower])
                                    ? KNOWN_XF_PREFIXES[lower]
                                    : 'label label--misc';
                                if (!cls.includes('label')) cls = 'label ' + cls;
                                badgeMap.set(lower, { name: displayName, type: 'prefix', className: cls, count: 0 });
                            }
                        });
                    }
                    if (typeof serverPrefixMap !== 'undefined' && serverPrefixMap && serverPrefixMap.size > 0) {
                        serverPrefixMap.forEach((prefixId, nameKey) => {
                            const lower = nameKey.toLowerCase().trim();
                            if (!badgeMap.has(lower)) {
                                const displayName = lower.charAt(0).toUpperCase() + lower.slice(1);
                                let cls = (typeof KNOWN_XF_PREFIXES !== 'undefined' && KNOWN_XF_PREFIXES[lower])
                                    ? KNOWN_XF_PREFIXES[lower]
                                    : 'label label--misc';
                                if (!cls.includes('label')) cls = 'label ' + cls;
                                badgeMap.set(lower, { name: displayName, type: 'prefix', className: cls, count: 0 });
                            }
                        });
                    }
                    return Array.from(badgeMap.values());
                };

                // ===== TOOLBAR UNIFICADA (PAINEL INTEGRADO) =====
                searchToolbarEl.innerHTML = `
                    <div class="smg-search-tb-row">
                        <div class="smg-search-select-wrap">
                            <select class="smg-search-scope-select">
                                <option value="everywhere">🌐 ${IS_PT ? 'Todo o fórum' : 'Everywhere'}</option>
                                <option value="watched">⭐ ${IS_PT ? 'Tópicos seguidos' : 'Watched'}</option>
                                <option value="threads">🧵 ${IS_PT ? 'Tópicos' : 'Threads'}</option>
                                ${threadId ? `<option value="thread">💬 ${IS_PT ? 'Neste tópico' : 'This thread'}</option>` : ''}
                            </select>
                        </div>
                        <div class="smg-search-select-wrap">
                            <select class="smg-search-sort-select">
                                <option value="relevance">📊 ${IS_PT ? 'Relevância' : 'Relevance'}</option>
                                <option value="date">📅 ${IS_PT ? 'Mais recentes' : 'Newest'}</option>
                            </select>
                        </div>
                        <div class="smg-search-badges-slot"></div>
                        <label class="smg-ios-toggle">
                            <input type="checkbox" class="smg-toggle-title-only"${titlesOn ? ' checked' : ''}>
                            <span class="smg-ios-switch"></span>
                            <span class="smg-ios-label">${IS_PT ? 'Só títulos' : 'Titles only'}</span>
                        </label>
                        <div class="smg-search-author-box">
                            <span class="smg-search-author-ic">${svgIcon('<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>')}</span>
                            <input type="text" class="smg-search-author-inp" placeholder="${IS_PT ? 'Autor…' : 'Author…'}">
                        </div>
                        <div class="smg-search-tb-spacer"></div>
                        <button type="button" class="smg-search-cfg" title="${i18n('Search defaults')}">${ICONS.sliders}</button>
                        <a class="smg-search-adv" href="${searchAction.replace(/search\/?$/, '') || '/search/'}" target="_blank" rel="noopener" title="${i18n('Advanced')}">
                            <span>${IS_PT ? 'Filtro avançado' : 'Advanced'}</span>
                            <span class="smg-ext-ic">${svgIcon('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>')}</span>
                        </a>
                    </div>
                `;

                scopeSelect = searchToolbarEl.querySelector('.smg-search-scope-select');
                sortSelect = searchToolbarEl.querySelector('.smg-search-sort-select');
                toggleTitleOnly = searchToolbarEl.querySelector('.smg-toggle-title-only');
                const authorBox = searchToolbarEl.querySelector('.smg-search-author-box');
                authorInput = searchToolbarEl.querySelector('.smg-search-author-inp');
                const badgesSlot = searchToolbarEl.querySelector('.smg-search-badges-slot');

                scopeSelect.value = currentScope;
                scopeSelect.addEventListener('change', () => {
                    currentScope = scopeSelect.value;
                    applyScopeUI();
                    researchOnFilter();
                    try { getSearchInput().focus(); } catch (e) {}
                });

                sortSelect.value = orderDate ? 'date' : 'relevance';
                sortSelect.addEventListener('change', () => {
                    orderDate = (sortSelect.value === 'date');
                    researchOnFilter();
                });

                toggleTitleOnly.addEventListener('change', () => {
                    titlesOn = toggleTitleOnly.checked;
                    researchOnFilter();
                });

                badgeMultiselect = createBadgeMultiselect({
                    badges: getAllSearchBadges(),
                    activeBadges: activeSearchBadges,
                    placeholder: i18n('Search tags…'),
                    buttonLabel: '🏷️ ' + (IS_PT ? 'Badges & Tags' : 'Badges & Tags'),
                    onChange: () => {
                        researchOnFilter();
                    }
                });
                badgeMultiselect.querySelector('.smg-multiselect-btn')?.addEventListener('click', () => {
                    refreshPrefixHarvest(() => {
                        if (badgeMultiselect && typeof badgeMultiselect.updateBadges === 'function') {
                            badgeMultiselect.updateBadges(getAllSearchBadges());
                        }
                    });
                });
                badgesSlot.appendChild(badgeMultiselect);

                let authorDebounce = null;
                const commitAuthor = () => {
                    const uname = (authorInput.value || '').trim();
                    authorBox.classList.toggle('has-value', !!uname);
                    researchOnFilter();
                };
                authorInput.addEventListener('input', () => {
                    clearTimeout(authorDebounce);
                    authorDebounce = setTimeout(commitAuthor, 400);
                });
                authorInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        clearTimeout(authorDebounce);
                        commitAuthor();
                        doSearch(true);
                    }
                });
            }

            if (typeof window !== 'undefined' && window.__TEST_MODE__) {
                window.__dockSearchExports = {
                    paintResults,
                    activeSearchBadges,
                    get searchResultsEl() { return searchResultsEl; },
                    doSearch,
                    openAdvanced,
                    getSearchInput,
                    parseSearchResults,
                    loadMoreSearchResults,
                    get currentSearchNextUrl() { return currentSearchNextUrl; },
                    get searchSentinelEl() { return searchSentinelEl; },
                    get searchSentinelIO() { return searchSentinelIO; },
                    renderSearchCard,
                    clearResults
                };
            }

            btnSearch.addEventListener('click', e => {
                e.stopPropagation();
                if (searchOverlay.classList.contains('open')) closeSearch();
                else openSearch();
            });

            // fechar: botão X, clique no backdrop (modal), Esc
            searchPop.querySelector('.smg-search-close').addEventListener('click', closeSearch);
            searchOverlay.addEventListener('click', e => { if (e.target === searchOverlay) closeSearch(); });
            document.addEventListener('keydown', e => { if (e.key === 'Escape' && searchOverlay.classList.contains('open')) closeSearch(); });

            // abrir/fechar disparado pela topbar (input real) via eventos custom — desacopla do escopo do dock
            document.addEventListener('smg-search-open', openSearch);
            document.addEventListener('smg-search-close', closeSearch);
            // DROPDOWN (desktop): o overlay é pointer-events:none, então o clique-no-backdrop não vale — fecha ao clicar FORA do pop e da search bar
            document.addEventListener('pointerdown', e => {
                if (!searchOverlay.classList.contains('open') || !searchPop.classList.contains('smg-search-pop--drop')) return;
                if (searchPop.contains(e.target) || (e.target.closest && e.target.closest('.smg-tb-search, .smg-search-cmd, .smg-search-cfg-portal'))) return;   // portais (paleta/config) ficam no body → não contam como "fora"
                closeSearch();
            }, true);
            window.addEventListener('resize', () => { if (searchOverlay.classList.contains('open') && searchPop.classList.contains('smg-search-pop--drop')) positionDrop(); });
            // arrastar pra baixo fecha o modal de busca (mobile; não no dropdown do desktop)
            addSwipeClose(searchPop, closeSearch, () => searchOverlay.classList.contains('open') && !searchPop.classList.contains('smg-search-pop--drop'));
        };
        setupSearch();

        // ---- settings (engrenagem) ----
        const setupSettings = () => {
            btnSettings.addEventListener('click', e => {
                e.stopPropagation();
                if (navWrapper.classList.contains('settings-open')) closePopovers();
                else { closePopovers(); navWrapper.classList.add('settings-open'); }
            });
            // toggles (FEATURES)
            settingsPop.querySelectorAll('input[data-feat]').forEach(inp => {
                inp.addEventListener('change', () => { FEATURES[inp.dataset.feat] = inp.checked; saveFeatures(); });
            });
            // sliders (tunables do feed → gmSet; aplicam na próxima abertura do feed)
            settingsPop.querySelectorAll('input[data-tune]').forEach(inp => {
                inp.addEventListener('input', () => {
                    gmSet(inp.dataset.tune, String(inp.value));
                    const badge = inp.parentElement.querySelector('.smg-set-val'); if (badge) badge.textContent = inp.value;
                });
            });
            // versão (do gerenciador de userscript)
            const verEl = settingsPop.querySelector('.smg-set-ver');
            if (verEl) verEl.textContent = (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) ? 'v' + GM_info.script.version : '';
            // fechar (×) + recarregar
            settingsPop.querySelector('.smg-set-x').addEventListener('click', e => { e.stopPropagation(); closePopovers(); });
            settingsPop.querySelector('.smg-set-reload').addEventListener('click', () => location.reload());
            // restaurar padrões: zera FEATURES + tunables e recarrega
            settingsPop.querySelector('.smg-set-reset').addEventListener('click', () => {
                if (!confirm(i18n('Restore default settings?'))) return;
                Object.assign(FEATURES, DEFAULT_FEATURES); saveFeatures();
                SET_TUNABLES.forEach(t => gmSet(t.key, ''));   // limpa → volta ao default no código
                location.reload();
            });
            // limpeza do banco de dados (aba Feed)
            const btnClearTimeline = settingsPop.querySelector('.smg-btn-clear-timeline');
            if (btnClearTimeline) {
                btnClearTimeline.addEventListener('click', () => {
                    if (!confirm(IS_PT ? 'Limpar todos os posts salvos na timeline e resetar páginas salvas?' : 'Clear all saved timeline posts and reset saved pages?')) return;
                    dbClearTimeline().then(() => {
                        if (typeof toast === 'function') toast(IS_PT ? 'Timeline limpa com sucesso' : 'Timeline cleared successfully');
                        else alert(IS_PT ? 'Timeline limpa com sucesso!' : 'Timeline cleared successfully!');
                    });
                });
            }
            const btnClearFollowed = settingsPop.querySelector('.smg-btn-clear-followed');
            if (btnClearFollowed) {
                btnClearFollowed.addEventListener('click', () => {
                    if (!confirm(IS_PT ? 'Limpar a tabela local de tópicos seguidos? (Isso NÃO deixará de seguir nada no fórum)' : 'Clear local cache of followed threads? (This will NOT unfollow anything on the forum)')) return;
                    dbClearFollowed().then(() => {
                        if (typeof toast === 'function') toast(IS_PT ? 'Cache de tópicos seguidos limpo com sucesso' : 'Followed threads cache cleared successfully');
                        else alert(IS_PT ? 'Cache de tópicos seguidos limpo com sucesso!' : 'Followed threads cache cleared successfully!');
                    });
                });
            }
            // rail de categorias + busca (filtra entre todas)
            const setTabs = Array.prototype.slice.call(settingsPop.querySelectorAll('.smg-set-tab'));
            const setSecs = Array.prototype.slice.call(settingsPop.querySelectorAll('.smg-set-sec'));
            const setEmpty = settingsPop.querySelector('.smg-set-empty');
            const setQ = settingsPop.querySelector('.smg-set-q');
            const setContentEl = settingsPop.querySelector('.smg-set-content');
            let setActive = 0;
            function setShowTab(i) {
                setActive = i; if (setQ) setQ.value = ''; settingsPop.classList.remove('searching'); if (setEmpty) setEmpty.hidden = true;
                setSecs.forEach((s, j) => { s.hidden = j !== i; s.querySelectorAll('[data-q]').forEach(r => { r.style.display = ''; }); });
                setTabs.forEach((t, j) => t.classList.toggle('active', j === i));
                if (setContentEl) setContentEl.scrollTop = 0;
            }
            setTabs.forEach((t, i) => t.addEventListener('click', e => { e.stopPropagation(); setShowTab(i); }));
            if (setQ) {
                setQ.addEventListener('keydown', e => e.stopPropagation());
                setQ.addEventListener('input', () => {
                    const term = setQ.value.trim().toLowerCase();
                    if (!term) { setShowTab(setActive); return; }
                    settingsPop.classList.add('searching'); setTabs.forEach(t => t.classList.remove('active'));
                    let any = false;
                    setSecs.forEach(s => {
                        let vis = false;
                        s.querySelectorAll('[data-q]').forEach(r => { const m = r.getAttribute('data-q').indexOf(term) !== -1; r.style.display = m ? '' : 'none'; if (m) { vis = true; any = true; } });
                        s.hidden = !vis;
                    });
                    if (setEmpty) setEmpty.hidden = any;
                });
            }

            // FAB de configurações: nas páginas onde a dock fica escondida (baronly no desktop), garante
            // acesso ao mod. Clique → revela a dock (só a engrenagem) + abre o settings. O closePopovers reseta.
            if (navWrapper.classList.contains('smg-dock-baronly') && !document.getElementById('smg-settings-fab')) {
                const fab = document.createElement('button');
                fab.id = 'smg-settings-fab';
                fab.type = 'button';
                fab.title = i18n('Settings');
                fab.setAttribute('aria-label', i18n('Settings'));
                fab.innerHTML = '<span class="smg-nav-ico">' + ICONS.settings + '</span>';   // mesmo wrapper da dock (fill:none → outline, não blob)
                fab.addEventListener('click', e => {
                    e.stopPropagation();
                    if (navWrapper.classList.contains('settings-open')) { closePopovers(); return; }
                    closePopovers();
                    navWrapper.classList.add('smg-dock-show', 'settings-open');
                });
                document.body.appendChild(fab);
            }
        };
        setupSettings();

        // ---- filtro e ordenação da listagem (fórum / watched / bookmarks / search) ----
        const setupListSortAndFilter = () => {
            if (!listFilterPop && !sortPop) return;
            const lfBody = listFilterPop ? listFilterPop.querySelector('.smg-lf-body') : null;
            const sortBody = sortPop ? sortPop.querySelector('.smg-sort-body') : null;
            let lfLoaded = false, lfData = null;
            let clientFilterQuery = '';
            const activeClientBadges = new Set();
            let clientBadgeMultiselect = null;
            const serverPrefixMap = new Map();
            let currentSortDir = 'desc';
            let currentLastDays = '0';

            const lfRow = label => {
                const row = document.createElement('div');
                row.className = 'smg-lf-row';
                if (label) { const l = document.createElement('div'); l.className = 'smg-lf-label'; l.textContent = label; row.appendChild(l); }
                return row;
            };
            function getThreadListContainer() {
                return document.querySelector('.structItemContainer.smg-tl-grid')
                    || document.querySelector('.structItemContainer')
                    || document.querySelector('.block-body.js-threadList')
                    || document.querySelector('.smg-article-grid')
                    || document.querySelector('.p-body-main .block-body');
            }

            const LIST_ITEM_SELECTOR = '.structItem--thread, .structItem--bookmark, .message--articlePreview, .smg-watched-card';
            const listMetaCache = new WeakMap();
            const parseListCount = text => {
                if (!text) return 0;
                const clean = text.replace(/[^0-9.KMkm]/g, '').trim().toUpperCase();
                if (!clean) return 0;
                if (clean.endsWith('M')) return (parseFloat(clean) || 0) * 1000000;
                if (clean.endsWith('K')) return (parseFloat(clean) || 0) * 1000;
                return parseInt(clean, 10) || 0;
            };
            const timeValue = time => {
                if (!time) return 0;
                const ts = parseInt(time.getAttribute('data-timestamp') || time.getAttribute('data-time') || '0', 10);
                if (ts > 10000) return ts;
                const dt = time.getAttribute('datetime');
                if (dt) { const ms = Date.parse(dt); if (!isNaN(ms)) return Math.floor(ms / 1000); }
                return 0;
            };
            function listItemMeta(el) {
                if (!el) return { title: '', author: '', badges: [], tags: [], values: {} };
                const cached = listMetaCache.get(el);
                if (cached) return cached;
                const titleA = el.querySelector('.structItem-title a[href*="/threads/"]')
                    || el.querySelector('.structItem-title a, .contentRow-title a, .articlePreview-title a, .smg-watched-card-title, h3 a');
                const userA = el.querySelector('.username, [data-user-id], .structItem-parts a, .smg-watched-card-author');
                const badges = (typeof extractRowBadges === 'function') ? extractRowBadges(el) : [];
                const tags = badges.map(b => (b.name || '').toLowerCase().replace(/^[#\s]+|[#\s]+$/g, '').trim());
                const startTime = el.querySelector('.structItem-startDate time, .contentRow-minor time, time');
                const lastTime = el.querySelector('.structItem-latestDate, .structItem-cell--latest time, .structItem-latestDate time, .structItem-cell--latest .u-dt');
                const reply = el.querySelector('.structItem-cell--meta dt:first-child + dd, .pairs--justified dd');
                const views = el.querySelector('.structItem-cell--meta dl:nth-child(2) dd, .structItem-cell--meta dt:last-of-type + dd');
                const reacts = el.querySelector('.structItem-cell--meta .reactions, [data-reaction-score]');
                const meta = {
                    title: (titleA ? titleA.textContent : '').replace(/\s+/g, ' ').trim().toLowerCase(),
                    author: (userA ? userA.textContent : '').replace(/\s+/g, ' ').trim().toLowerCase(),
                    badges,
                    tags,
                    values: {
                        title: (titleA ? titleA.textContent : '').replace(/\s+/g, ' ').trim().toLowerCase(),
                        post_date: timeValue(startTime),
                        last_post_date: timeValue(lastTime),
                        reply_count: reply ? parseListCount(reply.textContent) : 0,
                        view_count: views ? parseListCount(views.textContent) : 0,
                        first_post_reaction_score: reacts ? (reacts.getAttribute('data-reaction-score') ? parseInt(reacts.getAttribute('data-reaction-score'), 10) || 0 : parseListCount(reacts.textContent)) : 0
                    }
                };
                listMetaCache.set(el, meta);
                return meta;
            }
            function invalidateListMeta(roots) {
                if (!roots) return;
                normalizeRoots(roots).forEach(root => {
                    const row = root.closest && root.closest(LIST_ITEM_SELECTOR);
                    if (row) listMetaCache.delete(row);
                    if (root.matches && root.matches(LIST_ITEM_SELECTOR)) listMetaCache.delete(root);
                    if (root.querySelectorAll) root.querySelectorAll(LIST_ITEM_SELECTOR).forEach(item => listMetaCache.delete(item));
                });
            }

            let featChip = null;
            let starterInput = null;

            function applyForumFilterViaUrl() {
                const url = new URL(location.pathname, location.origin);
                if (currentLastDays && currentLastDays !== '0') url.searchParams.set('last_days', currentLastDays);
                else url.searchParams.set('last_days', '-1');
                if (currentSortOrder) url.searchParams.set('order', currentSortOrder);
                if (currentSortDir) url.searchParams.set('direction', currentSortDir);

                let pIdx = 0;
                activeClientBadges.forEach(badgeKey => {
                    if (serverPrefixMap.has(badgeKey)) {
                        url.searchParams.set(`prefix_id[${pIdx}]`, serverPrefixMap.get(badgeKey));
                        pIdx++;
                    }
                });
                if (featChip && featChip.dataset.on === '1') url.searchParams.set('featured', '1');
                const sv = starterInput ? starterInput.value.trim() : '';
                if (sv) url.searchParams.set('starter', sv);

                location.href = url.toString();
            }

            function sortListItems(order, direction) {
                if (order) currentSortOrder = order;
                if (listSortTxt) listSortTxt.textContent = getListSortLabel(currentSortOrder);
                if (listSortTxtM) listSortTxtM.textContent = getListSortLabel(currentSortOrder);
                const tip = IS_PT
                    ? `Ordenação atual: por ${getListSortLabel(currentSortOrder)}. Clique para alternar`
                    : `Current sort: by ${getListSortLabel(currentSortOrder)}. Click to change`;
                if (btnListSort) setBtnLabel(btnListSort, tip);
                if (btnListSortM) setBtnLabel(btnListSortM, tip);

                const listContainer = getThreadListContainer();
                if (!listContainer) return;
                const items = Array.from(listContainer.querySelectorAll(LIST_ITEM_SELECTOR));
                if (items.length < 2) return;
                const activeOrder = order || currentSortOrder;
                const entries = items.map(el => ({ el, value: listItemMeta(el).values[activeOrder] }));
                entries.sort((a, b) => {
                    const va = a.value, vb = b.value;
                    let res = 0;
                    if (typeof va === 'string') res = va.localeCompare(vb);
                    else res = va - vb;
                    return direction === 'desc' ? -res : res;
                });

                const frag = document.createDocumentFragment();
                entries.forEach(entry => frag.appendChild(entry.el));
                listContainer.appendChild(frag);
            }

            const sortOptions = [
                { key: 'last_post_date', label: '🕒 ' + (IS_PT ? 'Última mensagem' : 'Last message') },
                { key: 'post_date', label: '📅 ' + (IS_PT ? 'Primeira mensagem' : 'First message') },
                { key: 'title', label: '🔤 ' + (IS_PT ? 'Título' : 'Title') },
                { key: 'reply_count', label: '💬 ' + (IS_PT ? 'Respostas' : 'Replies') },
                { key: 'view_count', label: '👁️ ' + (IS_PT ? 'Visualizações' : 'Views') },
                { key: 'first_post_reaction_score', label: '❤️ ' + (IS_PT ? 'Curtidas' : 'Likes') }
            ];

            const periodOptions = [
                { value: '0', label: IS_PT ? 'A qualquer momento' : 'Any time' },
                { value: '7', label: IS_PT ? '7 dias' : '7 days' },
                { value: '14', label: IS_PT ? '14 dias' : '14 days' },
                { value: '30', label: IS_PT ? '30 dias' : '30 days' },
                { value: '60', label: IS_PT ? '2 meses' : '2 months' },
                { value: '90', label: IS_PT ? '3 meses' : '3 months' },
                { value: '182', label: IS_PT ? '6 meses' : '6 months' },
                { value: '365', label: IS_PT ? '1 ano' : '1 year' }
            ];

            function buildSortPop() {
                if (!sortBody) return;
                sortBody.innerHTML = '';

                // 1. Ordenar por
                const sRow = lfRow(IS_PT ? 'Ordenar por' : 'Sort by');
                sRow.className = 'smg-lf-row smg-lf-sort-row';
                const grid = document.createElement('div');
                grid.className = 'smg-lf-sort-grid';

                sortOptions.forEach(opt => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'smg-lf-sort-opt' + (currentSortOrder === opt.key ? ' active' : '');
                    btn.textContent = opt.label;
                    btn.dataset.sort = opt.key;
                    btn.addEventListener('click', () => {
                        currentSortOrder = opt.key;
                        grid.querySelectorAll('.smg-lf-sort-opt').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        if (listSortTxt) listSortTxt.textContent = getListSortLabel(currentSortOrder);
                        if (listSortTxtM) listSortTxtM.textContent = getListSortLabel(currentSortOrder);
                        const tip = IS_PT
                            ? `Ordenação atual: por ${getListSortLabel(currentSortOrder)}. Clique para alternar`
                            : `Current sort: by ${getListSortLabel(currentSortOrder)}. Click to change`;
                        if (btnListSort) setBtnLabel(btnListSort, tip);
                        if (btnListSortM) setBtnLabel(btnListSortM, tip);
                        sortListItems(currentSortOrder, currentSortDir);
                    });
                    grid.appendChild(btn);
                });
                sRow.appendChild(grid);
                sortBody.appendChild(sRow);

                // 2. Direção
                const dRow = lfRow(IS_PT ? 'Direção' : 'Direction');
                const dirGroup = document.createElement('div');
                dirGroup.className = 'smg-lf-dir-group';
                dirGroup.innerHTML = `
                    <button type="button" class="smg-lf-dir-opt ${currentSortDir === 'desc' ? 'active' : ''}" data-dir="desc">↓ ${IS_PT ? 'Decrescente' : 'Descending'}</button>
                    <button type="button" class="smg-lf-dir-opt ${currentSortDir === 'asc' ? 'active' : ''}" data-dir="asc">↑ ${IS_PT ? 'Crescente' : 'Ascending'}</button>
                `;
                dirGroup.querySelectorAll('.smg-lf-dir-opt').forEach(btn => {
                    btn.addEventListener('click', () => {
                        currentSortDir = btn.dataset.dir;
                        dirGroup.querySelectorAll('.smg-lf-dir-opt').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        sortListItems(currentSortOrder, currentSortDir);
                    });
                });
                dRow.appendChild(dirGroup);
                sortBody.appendChild(dRow);

                // 3. Última atualização / Período
                const pRow = lfRow(IS_PT ? 'Última atualização' : 'Last updated');
                const pSelect = document.createElement('select');
                pSelect.className = 'smg-lf-select';
                periodOptions.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.value;
                    opt.textContent = p.label;
                    if (p.value === currentLastDays) opt.selected = true;
                    pSelect.appendChild(opt);
                });
                pSelect.addEventListener('change', () => {
                    currentLastDays = pSelect.value;
                });
                pRow.appendChild(pSelect);
                sortBody.appendChild(pRow);

                // 4. Se houver formulário do servidor, botão de Aplicar / Recarregar
                if (lfData && lfData.token) {
                    const apply = document.createElement('button');
                    apply.type = 'button';
                    apply.className = 'smg-lf-apply';
                    apply.textContent = IS_PT ? 'Filtrar / Recarregar' : 'Filter / Reload';
                    apply.addEventListener('click', () => {
                        if (/\/forums\//i.test(location.pathname)) {
                            applyForumFilterViaUrl();
                        } else {
                            const fields = [['_xfToken', lfData.token], ['apply', '1']];
                            if (currentSortOrder) fields.push(['order', currentSortOrder]);
                            if (currentSortDir) fields.push(['direction', currentSortDir]);
                            if (currentLastDays) fields.push(['last_days', currentLastDays]);
                            postForm(lfData.action, fields);
                        }
                    });
                    sortBody.appendChild(apply);
                }

                i18nDom(sortBody);
            }

            function getPageBadges() {
                const badgeMap = new Map();
                const container = getThreadListContainer();
                const items = container ? Array.from(container.querySelectorAll(LIST_ITEM_SELECTOR)) : [];
                items.forEach(row => {
                    const bList = listItemMeta(row).badges;
                    bList.forEach(b => {
                        const name = (b.name || '').trim();
                        if (!name) return;
                        const k = name.toLowerCase().replace(/^[#\s]+|[#\s]+$/g, '').trim();
                        if (!badgeMap.has(k)) {
                            badgeMap.set(k, { name: name.replace(/^[#\s]+|[#\s]+$/g, '').trim(), type: b.type, className: b.className, style: b.style, count: 0 });
                        }
                        badgeMap.get(k).count++;
                    });
                });
                if (serverPrefixMap && serverPrefixMap.size > 0) {
                    serverPrefixMap.forEach((prefixId, nameKey) => {
                        if (!badgeMap.has(nameKey)) {
                            let cls = (typeof KNOWN_XF_PREFIXES !== 'undefined' && KNOWN_XF_PREFIXES[nameKey]) ? KNOWN_XF_PREFIXES[nameKey] : 'label label--misc';
                            if (!cls.includes('label')) cls = 'label ' + cls;
                            const displayName = nameKey.charAt(0).toUpperCase() + nameKey.slice(1);
                            badgeMap.set(nameKey, { name: displayName, type: 'prefix', className: cls, style: '', count: 0 });
                        }
                    });
                }
                return Array.from(badgeMap.values());
            }

            function applyLocalFilter() {
                const container = getThreadListContainer();
                if (!container) return;
                const items = Array.from(container.querySelectorAll(LIST_ITEM_SELECTOR));
                const q = clientFilterQuery.toLowerCase().trim();
                const normalizeTag = s => (s || '').toLowerCase().replace(/^[#\s]+|[#\s]+$/g, '').trim();
                const activeSelectedTags = new Set(Array.from(activeClientBadges).map(normalizeTag));

                let visible = 0;
                items.forEach(row => {
                    const meta = listItemMeta(row);
                    const title = meta.title;
                    const author = meta.author;
                    const threadTags = meta.tags;

                    const badgeMatch = activeSelectedTags.size === 0 || threadTags.some(t => activeSelectedTags.has(t));
                    const queryMatch = !q || title.includes(q) || author.includes(q) || threadTags.some(t => t.includes(q));

                    const show = badgeMatch && queryMatch;
                    if (show) {
                        row.style.removeProperty('display');
                        row.classList.remove('smg-hidden');
                        visible++;
                    } else {
                        row.style.setProperty('display', 'none', 'important');
                        row.classList.add('smg-hidden');
                    }
                });

                // Ocultar separadores de scroll infinito cujas threads estejam todas ocultas
                document.querySelectorAll('.smg-inf-sep').forEach(sep => {
                    let curr = sep.nextElementSibling;
                    let hasVisible = false;
                    let hasAnyItem = false;
                    while (curr && !curr.classList.contains('smg-inf-sep')) {
                        if (curr.matches('.structItem--thread, .structItem--bookmark, .message--articlePreview, .smg-watched-card')) {
                            hasAnyItem = true;
                            if (curr.style.display !== 'none' && !curr.classList.contains('smg-hidden')) {
                                hasVisible = true;
                                break;
                            }
                        }
                        curr = curr.nextElementSibling;
                    }
                    if (hasAnyItem && !hasVisible) {
                        sep.style.setProperty('display', 'none', 'important');
                    } else {
                        sep.style.removeProperty('display');
                    }
                });

                const countText = (visible === items.length)
                    ? (IS_PT ? `${items.length} tópicos` : `${items.length} threads`)
                    : (IS_PT ? `${visible} de ${items.length} tópicos` : `${visible} of ${items.length} threads`);

                if (listFilterPop) {
                    const popCount = listFilterPop.querySelector('.smg-lf-counter');
                    if (popCount) popCount.textContent = countText;
                }

                const watchedBarCount = document.querySelector('.smg-watched-count');
                if (watchedBarCount) watchedBarCount.textContent = countText;

                let emptyEl = container.querySelector('.smg-watched-empty');
                if (visible === 0 && items.length > 0) {
                    if (!emptyEl) {
                        emptyEl = document.createElement('div');
                        emptyEl.className = 'smg-watched-empty';
                        emptyEl.textContent = i18n('No matching threads found.');
                        container.appendChild(emptyEl);
                    }
                } else if (emptyEl) {
                    emptyEl.remove();
                }
            }

            window.smgReapplyFilters = roots => {
                try {
                    invalidateListMeta(roots);
                    if (clientBadgeMultiselect && typeof clientBadgeMultiselect.updateBadges === 'function') {
                        clientBadgeMultiselect.updateBadges(getPageBadges());
                    }
                    if (clientFilterQuery || activeClientBadges.size > 0) {
                        applyLocalFilter();
                    }
                } catch (e) {}
            };

            function buildClientListFilter() {
                if (!lfBody) return;
                lfBody.innerHTML = '';

                // Top row: Counter + Clear button
                const topRow = document.createElement('div');
                topRow.className = 'smg-lf-headrow';
                const container = getThreadListContainer();
                const totalItems = container ? container.querySelectorAll('.structItem--thread, .structItem--bookmark, .message--articlePreview, .smg-watched-card').length : 0;
                topRow.innerHTML = `
                    <span class="smg-lf-counter">${IS_PT ? `${totalItems} tópicos` : `${totalItems} threads`}</span>
                    <button type="button" class="smg-lf-reset-btn">${i18n('Clear filters')}</button>
                `;
                lfBody.appendChild(topRow);

                // Search row (instant search input)
                const sRow = lfRow(i18n('Search in page'));
                const sInput = document.createElement('input');
                sInput.type = 'text';
                sInput.className = 'smg-lf-input';
                sInput.placeholder = i18n('Filter by title, author or tag…');
                sInput.value = clientFilterQuery;
                sRow.appendChild(sInput);
                lfBody.appendChild(sRow);

                sInput.addEventListener('input', () => {
                    clientFilterQuery = sInput.value;
                    applyLocalFilter();
                });

                // Multiselect dropdown de Badges & Tags
                const bRow = lfRow(IS_PT ? 'Badges & Tags' : 'Badges & Tags');
                clientBadgeMultiselect = createBadgeMultiselect({
                    badges: getPageBadges(),
                    activeBadges: activeClientBadges,
                    placeholder: i18n('Search tags…'),
                    buttonLabel: IS_PT ? 'Filtrar por Badges / Tags' : 'Filter by Badges / Tags',
                    onChange: () => applyLocalFilter()
                });
                bRow.appendChild(clientBadgeMultiselect);
                lfBody.appendChild(bRow);

                // Reset button listener
                topRow.querySelector('.smg-lf-reset-btn').addEventListener('click', () => {
                    clientFilterQuery = '';
                    sInput.value = '';
                    activeClientBadges.clear();
                    if (clientBadgeMultiselect && typeof clientBadgeMultiselect.reset === 'function') {
                        clientBadgeMultiselect.reset();
                    }
                    applyLocalFilter();
                });

                i18nDom(lfBody);
                applyLocalFilter();
            }

            function buildListFilter(form) {
                lfData = { action: form.getAttribute('action') || location.pathname, token: form.querySelector('input[name="_xfToken"]')?.value || '' };
                const orderOrig = form.querySelector('select[name="order"]');
                const dirOrig = form.querySelector('select[name="direction"]');
                const lastOrig = form.querySelector('select[name="last_days"]');
                if (orderOrig?.value) {
                    currentSortOrder = orderOrig.value;
                    if (listSortTxt) listSortTxt.textContent = getListSortLabel(currentSortOrder);
                    if (listSortTxtM) listSortTxtM.textContent = getListSortLabel(currentSortOrder);
                    const tip = IS_PT
                        ? `Ordenação atual: por ${getListSortLabel(currentSortOrder)}. Clique para alternar`
                        : `Current sort: by ${getListSortLabel(currentSortOrder)}. Click to change`;
                    if (btnListSort) setBtnLabel(btnListSort, tip);
                    if (btnListSortM) setBtnLabel(btnListSortM, tip);
                }
                if (dirOrig?.value) currentSortDir = dirOrig.value;
                if (lastOrig?.value) currentLastDays = lastOrig.value;

                serverPrefixMap.clear();
                harvestPrefixesFromDoc(form);
                const prefixSelect = form.querySelector('select[name="prefix_id[]"]') || form.querySelector('select[name*="prefix"]');
                if (prefixSelect) {
                    Array.from(prefixSelect.querySelectorAll('option')).forEach(opt => {
                        if (opt.value && opt.value !== '-1' && opt.value !== '') {
                            const txt = (opt.textContent || '').replace(/\s+/g, ' ').trim();
                            if (txt) {
                                const k = txt.toLowerCase().replace(/^[#\s]+|[#\s]+$/g, '').trim();
                                serverPrefixMap.set(k, opt.value);
                                if (opt.selected) {
                                    activeClientBadges.add(k);
                                }
                            }
                        }
                    });
                }

                if (sortBody) buildSortPop();
                if (!lfBody) return;
                lfBody.innerHTML = '';

                // Top row: Counter + Clear button
                const topRow = document.createElement('div');
                topRow.className = 'smg-lf-headrow';
                const container = getThreadListContainer();
                const totalItems = container ? container.querySelectorAll('.structItem--thread, .structItem--bookmark, .message--articlePreview, .smg-watched-card').length : 0;
                topRow.innerHTML = `
                    <span class="smg-lf-counter">${IS_PT ? `${totalItems} tópicos` : `${totalItems} threads`}</span>
                    <button type="button" class="smg-lf-reset-btn">${i18n('Clear filters')}</button>
                `;
                lfBody.appendChild(topRow);

                // Busca rápida na página
                const sRow = lfRow(i18n('Search in page'));
                const sInput = document.createElement('input');
                sInput.type = 'text';
                sInput.className = 'smg-lf-input';
                sInput.placeholder = i18n('Filter by title, author or tag…');
                sInput.value = clientFilterQuery;
                sRow.appendChild(sInput);
                lfBody.appendChild(sRow);
                sInput.addEventListener('input', () => {
                    clientFilterQuery = sInput.value;
                    applyLocalFilter();
                });

                // Em destaque (toggle)
                const featOrig = form.querySelector('input[name="featured"]');
                featChip = null;
                if (featOrig) {
                    const row = lfRow('');
                    featChip = document.createElement('button');
                    featChip.type = 'button';
                    featChip.className = 'smg-chip smg-chip-toggle' + (featOrig.checked ? ' active' : '');
                    featChip.dataset.on = featOrig.checked ? '1' : '0';
                    featChip.innerHTML = '<span class="smg-chip-check">' + svgIcon('<path d="M20 6 9 17l-5-5"/>') + '</span>' + (IS_PT ? 'Apenas em destaque' : 'Featured only');
                    featChip.addEventListener('click', () => { const on = featChip.dataset.on !== '1'; featChip.dataset.on = on ? '1' : '0'; featChip.classList.toggle('active', on); });
                    row.appendChild(featChip);
                    lfBody.appendChild(row);
                }

                // Multiselect dropdown de Badges & Tags
                const isForumListing = /\/forums\//i.test(location.pathname);
                const bRow = lfRow(IS_PT ? 'Badges & Tags' : 'Badges & Tags');
                clientBadgeMultiselect = createBadgeMultiselect({
                    badges: getPageBadges(),
                    activeBadges: activeClientBadges,
                    placeholder: i18n('Search tags…'),
                    buttonLabel: IS_PT ? 'Filtrar por Badges / Tags' : 'Filter by Badges / Tags',
                    onChange: () => {
                        // Apenas atualiza o conjunto activeClientBadges, não recarrega automaticamente
                    }
                });
                bRow.appendChild(clientBadgeMultiselect);
                lfBody.appendChild(bRow);

                // Iniciado por
                const starterOrig = form.querySelector('input[name="starter"]');
                starterInput = null;
                if (starterOrig) {
                    const row = lfRow(IS_PT ? 'Iniciado por' : 'Started by');
                    starterInput = document.createElement('input');
                    starterInput.type = 'text';
                    starterInput.className = 'smg-lf-input';
                    starterInput.placeholder = IS_PT ? 'Nome de usuário' : 'Username';
                    starterInput.value = starterOrig.value || '';
                    row.appendChild(starterInput);
                    lfBody.appendChild(row);
                }

                // Reset button listener
                topRow.querySelector('.smg-lf-reset-btn').addEventListener('click', () => {
                    clientFilterQuery = '';
                    sInput.value = '';
                    activeClientBadges.clear();
                    if (clientBadgeMultiselect && typeof clientBadgeMultiselect.reset === 'function') {
                        clientBadgeMultiselect.reset();
                    }
                    if (featChip) { featChip.dataset.on = '0'; featChip.classList.remove('active'); }
                    if (starterInput) starterInput.value = '';
                    if (isForumListing) {
                        applyForumFilterViaUrl();
                        return;
                    }
                    applyLocalFilter();
                });

                // Filtrar
                const apply = document.createElement('button');
                apply.type = 'button';
                apply.className = 'smg-lf-apply';
                apply.textContent = IS_PT ? 'Filtrar' : 'Filter';
                apply.addEventListener('click', () => {
                    applyForumFilterViaUrl();
                });
                lfBody.appendChild(apply);
                i18nDom(lfBody);
            }

            const tryBuild = form => {
                if (!form) return false;
                try { buildListFilter(form); } catch (err) { console.warn('[smg] erro ao montar filtro', err); buildClientListFilter(); buildSortPop(); }
                return true;
            };

            const loadViaNative = () => {
                const trigger = document.querySelector('.filterBar-menuTrigger');
                const menuBody = document.querySelector('.filterBar .js-filterMenuBody');
                if (!trigger || !menuBody) { buildClientListFilter(); buildSortPop(); return; }
                if (tryBuild(menuBody.querySelector('form'))) return;

                const closeNative = () => document.querySelectorAll('.menu[data-href*="filters"], .menu.is-active, [data-menu="menu"]').forEach(m => {
                    if (m.classList.contains('is-active') || (m.getAttribute('data-href') || '').includes('filters')) {
                        m.classList.remove('is-active');
                        m.setAttribute('aria-hidden', 'true');
                    }
                });
                const hide = document.createElement('style');
                hide.textContent = '.menu[data-href*="filters"], .filterBar .menu, .menu.js-filterMenuBody, .menu.is-active { opacity: 0 !important; pointer-events: none !important; visibility: hidden !important; }';
                document.head.appendChild(hide);
                const sy = window.scrollY;
                trigger.click();

                let tries = 0;
                const poll = setInterval(() => {
                    const f = menuBody.querySelector('form');
                    if (f) {
                        clearInterval(poll);
                        tryBuild(f);
                        closeNative();
                        window.scrollTo(0, sy);
                        setTimeout(() => hide.remove(), 100);
                    } else if (++tries > 60) {
                        clearInterval(poll);
                        closeNative();
                        hide.remove();
                        buildClientListFilter();
                        buildSortPop();
                    }
                }, 100);
            };

            function loadListFilter(forceSort) {
                if (lfLoaded) {
                    if (location.pathname.includes('/watched/') || location.pathname.includes('/bookmarks') || !document.querySelector('.filterBar-menuTrigger')) {
                        buildClientListFilter();
                        buildSortPop();
                    } else if (forceSort) {
                        buildSortPop();
                    }
                    return;
                }
                lfLoaded = true;
                if (location.pathname.includes('/watched/') || location.pathname.includes('/bookmarks') || !document.querySelector('.filterBar-menuTrigger')) {
                    buildClientListFilter();
                    buildSortPop();
                    return;
                }
                const url = document.querySelector('.filterBar .menu[data-href]')?.getAttribute('data-href');
                if (!url) { loadViaNative(); return; }
                const tok = (document.documentElement.getAttribute('data-csrf') || '').trim();
                fetch(url + (url.includes('?') ? '&' : '?') + '_xfResponseType=json&_xfWithData=1' + (tok ? '&_xfToken=' + encodeURIComponent(tok) : ''), { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
                    .then(r => r.text())
                    .then(text => {
                        let h = text;
                        try {
                            const j = JSON.parse(text);
                            if (j && j.html && typeof j.html === 'object' && j.html.content) h = j.html.content;
                            else if (j && typeof j.html === 'string') h = j.html;
                        } catch {}
                        const form = new DOMParser().parseFromString(h, 'text/html').querySelector('form');
                        if (!tryBuild(form)) loadViaNative();
                    })
                    .catch(err => { console.warn('[smg] erro no fetch do filtro', err); loadViaNative(); });
            }

            if (btnListFilter) {
                btnListFilter.addEventListener('click', e => {
                    e.stopPropagation();
                    const isOpen = navWrapper.classList.contains('listfilter-open');
                    closePopovers();
                    if (!isOpen) {
                        navWrapper.classList.add('listfilter-open');
                        loadListFilter();
                    }
                });
            }

            if (btnListSort) {
                btnListSort.addEventListener('click', e => {
                    e.stopPropagation();
                    const isOpen = navWrapper.classList.contains('listsort-open');
                    closePopovers();
                    if (!isOpen) {
                        navWrapper.classList.add('listsort-open');
                        if (!lfLoaded) loadListFilter(true);
                        else buildSortPop();
                    }
                });
            }
        };
        setupListSortAndFilter();

        // fecha os popovers da dock (goto/config/filtro de lista/ordenação) ao clicar fora — o search tem backdrop próprio
        document.addEventListener('click', e => {
            if (!navWrapper.classList.contains('goto-open') && !navWrapper.classList.contains('settings-open')
                && !navWrapper.classList.contains('listfilter-open') && !navWrapper.classList.contains('listsort-open')) return;
            const inside = gotoPop.contains(e.target)
                || settingsPop.contains(e.target)
                || (listFilterPop && listFilterPop.contains(e.target))
                || (sortPop && sortPop.contains(e.target))
                || btnGoto.contains(e.target)
                || btnSettings.contains(e.target)
                || (btnListFilter && btnListFilter.contains(e.target))
                || (btnListFilterM && btnListFilterM.contains(e.target))
                || (btnListSort && btnListSort.contains(e.target))
                || (btnListSortM && btnListSortM.contains(e.target))
                || (e.target.closest && e.target.closest('.filterBar')); // não fecha ao usar o loader nativo
            if (!inside) closePopovers();
        });

        // ---- helpers de post ----
        let lastPostScan = 0, lastScanHeight = 0;
        function refreshPosts() {   // scroll infinito anexa posts DEPOIS do build → re-materializa a lista (só quando cresce)
            const h = document.documentElement.scrollHeight;
            if (h === lastScanHeight) return;   // nada anexado desde o último scan → poupa o qSA doc-wide + closest por anchor
            lastScanHeight = h;
            let p = Array.from(document.querySelectorAll('span.u-anchorTarget[id^="post-"]')).filter(el => !el.closest('.message-responseRow'));
            if (!p.length) p = Array.from(document.querySelectorAll('.message'));
            if (p.length > posts.length) posts = p;
        }
        // estado dos botões prev/next/goto: depende só de constantes capturadas no mount → seta 1× (não no scroll)
        function updatePostButtonsState() {
            btnPageFirst.disabled = !pageJump || pageJump.current <= 1;
            btnPagePrev.disabled = !prevPageLink || (pageJump && pageJump.current <= 1);
            btnPageNext.disabled = !nextPageLink || (pageJump && pageJump.current >= pageJump.max);
            btnPageLast.disabled = !pageJump || pageJump.current >= pageJump.max;
            btnGoto.disabled = !pageJump;
        }
        // sondagem "cheguei no fim da lista?" (scroll infinito anexou posts) — throttled 800ms.
        // O estado dos botões é constante; o scroll só verifica quando o último post
        // entrou na área de pré-carregamento.
        function pollEndOfList() {
            const now = Date.now();
            if (now - lastPostScan <= 800) return;
            lastPostScan = now;
            // "perto do fim?" só precisa do ÚLTIMO anchor (1 rect) — getCurrentPostIndex() lia o rect de
            // TODOS os posts até o atual (O(N) num thread fundo) só pra gatear este refresh
            const last = posts[posts.length - 1];
            if (last && last.getBoundingClientRect().top < window.innerHeight * 2) refreshPosts();
        }

        // ---- scroll topo / fundo (substituem o nav de post) ----
        btnUp.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        btnDown.addEventListener('click', () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }));

        // ---- watch thread ----
        function getWatchButton() {
            return document.querySelector('.buttonGroup a[data-sk-watch][data-sk-unwatch]');
        }

        const paintWatch = on => {
            const tip = on
                ? (IS_PT ? 'Seguindo este tópico. Clique para deixar de seguir' : 'Watching this thread. Click to unwatch')
                : (IS_PT ? 'Seguir este tópico (receber notificações)' : 'Watch thread (receive updates)');
            [btnWatch, btnWatchM].filter(Boolean).forEach(b => {
                setBtnIcon(b, on ? ICONS.unwatch : ICONS.watch);
                setBtnLabel(b, tip);
                b.classList.toggle('smg-active', on);   // destaca quando seguindo
            });
        };
        function updateWatchIcon() { paintWatch(smgIsWatching(getWatchButton())); }

        btnWatch.addEventListener('click', async () => {
            const watchBtn = getWatchButton();
            if (!watchBtn) return;
            const wasWatching = smgIsWatching(watchBtn);
            paintWatch(!wasWatching);   // REATIVO: vira o estado na hora (otimista)
            watchBtn.click();
            const confirmBtn = await waitForElement('.overlay button[type="submit"].button--primary');
            confirmBtn?.click();
            setTimeout(() => {
                updateWatchIcon();                  // re-sincroniza com o real (corrige se errou)
                const nowWatching = smgIsWatching(getWatchButton());
                // sincroniza o NOSSO banco do feed com a mudança: passou a seguir → adiciona a thread (puxa posts já); deixou de seguir → remove
                if (nowWatching && !wasWatching) safe(feedAddCurrentThread);
                else if (!nowWatching && wasWatching) safe(feedRemoveCurrentThread);
            }, 1500);
        });

        updateWatchIcon();

        // ---- paginação ----
        btnPageFirst.addEventListener('click', () => { if (pageJump) { const url = pageJump.tpl.replace(/\/page-%page%/, '/').replace('%page%', '1'); window.location.href = url; } });
        btnPagePrev.addEventListener('click', () => prevPageLink?.click());
        btnPageNext.addEventListener('click', () => nextPageLink?.click());
        btnPageLast.addEventListener('click', () => { if (pageJump) { const url = pageJump.tpl.replace('%page%', String(pageJump.max)); window.location.href = url; } });

        // ---- sort ----
        function updateSortIcon() {
            const sortTip = sortIsDate
                ? (IS_PT ? 'Ordenação atual: por data. Clique para ordenar por reações' : 'Current sort: by date. Click to sort by reactions')
                : (IS_PT ? 'Ordenação atual: por reações. Clique para ordenar por data' : 'Current sort: by reactions. Click to sort by date');
            [btnSort, btnSortM].filter(Boolean).forEach(b => {
                setBtnIcon(b, sortIsDate ? ICONS.sort : (ICONS.heart || ICONS.sort));
                setBtnLabel(b, sortTip);
                const t = b.querySelector('.smg-nav-btn-text');
                if (t) t.textContent = i18n(sortIsDate ? 'Date' : 'Reactions');
                b.classList.toggle('smg-active', !sortIsDate);
            });
        }

        btnSort.addEventListener('click', () => {
            sortIsDate = !sortIsDate;
            updateSortIcon();

            if (sortIsDate) sortDateLink?.click();
            else sortReactionLink?.click();
        });

        updateSortIcon();

        // ---- estado inicial dos botões (1×) + sondagem de fim-de-lista no scroll ----
        updatePostButtonsState();

        onScrollRaf(pollEndOfList);
    }
