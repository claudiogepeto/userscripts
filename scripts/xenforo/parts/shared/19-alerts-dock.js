    // =========================================================
    // FEATURE: painel lateral DOCKED (rail fixo à direita) — abas ALERTAS e SEGUINDO
    // O popover do sino serve pra espiar; ele fecha no primeiro clique e só traz as ~N mais
    // recentes. Aqui o mesmo conteúdo vira uma COLUNA fixa na direita que sobrevive à navegação
    // (estado em GM storage → remonta sozinha na próxima página), com o histórico inteiro em
    // rolagem infinita — dá pra abrir um alerta, ler a thread e continuar descendo a lista.
    // A aba Seguindo faz o mesmo com as threads acompanhadas (/watched/threads).
    //
    // Layout: EMPURRA o conteúdo (body padding-right + topbar termina antes do rail) em vez de
    // cobrir, e ALARGA a coluna do fórum (--smg-cw sobe) — a margem lateral que sobrava vira texto.
    //
    // Mapa (Cmd+F): estado/persistência · RAIL_SRC (as 2 fontes) · railFetch (paginação por "next")
    //   · watchedRow (structItem → linha compacta) · buildAlertsDock (DOM) · railRefresh/railMore
    //   · open/close/toggle/railShowTab · setupAlertsDock (boot + listeners).
    // =========================================================
    const ALDOCK_KEY = 'smg-alerts-dock';        // '1' = painel aberto (persiste entre páginas)
    const ALDOCK_TAB_KEY = 'smg-side-tab';       // aba ativa ('alerts' | 'watched')
    const ALDOCK_W_KEY = 'smg-alerts-dock-w';    // largura escolhida no arrasto (px)
    const ALDOCK_MIN_W = 300, ALDOCK_MAX_W = 620, ALDOCK_DEF_W = 360;
    const ALDOCK_RESP_MIN_W = 340, ALDOCK_RESP_MAX_W = 460;
    const ALDOCK_MIN_VW = 1100;   // abaixo disso o rail comeria o conteúdo → não docka (o popover/sheet continua valendo)
    const ALDOCK_POLL_MS = 90000; // busca conteúdo novo de tempos em tempos (o XF não avisa sozinho)
    const ALDOCK_AUTOFILL = 5;    // teto de páginas puxadas SOZINHO por ação (troca de aba/abertura)

    let aldock = null;            // elemento do painel (montado 1×)
    let aldockBound = false;

    // as duas fontes do rail. Cada aba tem a MESMA mecânica (paginar seguindo o "next" nativo,
    // deduplicar, rolagem infinita) e difere só no cabeçalho/affordances:
    //   count/markAll → só alertas (o XF não expõe contador nem "marcar tudo" pra threads seguidas)
    //   filter        → filtro opcional da fonte (a sidebar de Seguindo não o exibe)
    //   view          → grade/lista só em Seguindo (é quem tem thumb; alerta é texto)
    const RAIL_SRC = {
        alerts:  { title: 'Alerts',    seeAll: '/account/alerts',  count: true,  markAll: true,  filter: true,  view: false, empty: 'No notifications yet',   emptyUnread: 'No unread notifications' },
        watched: { title: 'Following', seeAll: '/watched/threads', count: true,  markAll: false, filter: false, view: true,  empty: 'No watched threads yet', emptyUnread: 'No unread notifications' },
    };
    const ALDOCK_VIEW_KEY = tab => 'smg-side-view-' + tab;   // 'grid' | 'list' por aba
    const railView = tab => (RAIL_SRC[tab].view && gmGet(ALDOCK_VIEW_KEY(tab), 'list') === 'grid') ? 'grid' : 'list';
    // estado por aba — dry: páginas seguidas sem nada inédito · autoFill: páginas puxadas sozinho
    // desde a última ação do usuário (teto pra aba "Não lidas" não varrer o histórico inteiro)
    const mkState = () => ({ url: null, next: null, busy: false, loaded: false, keys: new Set(), lastFetch: 0, dry: 0, autoFill: 0, filter: 'all' });
    const aldockState = { alerts: mkState(), watched: mkState() };
    let railTab = 'alerts';

    const aldockViewportMax = () => Math.max(
        ALDOCK_RESP_MIN_W,
        Math.min(ALDOCK_RESP_MAX_W, Math.round(window.innerWidth * 0.25))
    );
    const aldockWidth = () => {
        const n = parseInt(gmGet(ALDOCK_W_KEY, ''), 10);
        const preferred = (n >= ALDOCK_MIN_W && n <= ALDOCK_MAX_W) ? n : ALDOCK_DEF_W;
        return Math.min(preferred, aldockViewportMax());
    };
    // No CELULAR o mesmo rail vira TELA CHEIA (o sino da navbar abre). É a experiência do desktop
    // — abas Alertas/Seguindo, filtro Todas/Não lidas, marcar tudo, rolagem infinita — no lugar do
    // bottom sheet, que só mostrava a lista curta do popup nativo, sem paginação nem filtro.
    // A faixa do meio (601–1099) continua sem rail: lá ele comeria o conteúdo sem virar tela cheia.
    const aldockPhone = () => typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 600px)').matches;
    const aldockFits = () => window.innerWidth >= ALDOCK_MIN_VW || aldockPhone();
    const aldockWanted = () => gmGet(ALDOCK_KEY, '0') === '1';
    const aldockOpen = () => document.documentElement.classList.contains('smg-aldock-on');
    const railWantedTab = () => 'alerts';
    const railBaseUrl = tab => tab === 'watched'
        ? (navHref('watchedThreads', 'watched', 'watchedThreads2') || '/watched/threads')
        : '/account/alerts';

    // busca UMA página (a `url` já é a próxima, seguindo o link nativo) e devolve as linhas prontas
    // pro rail + o "next". Seguir o <a> de próxima em vez de montar ?page=N funciona nos 2 sites e
    // em qualquer formato de paginação (/page-N, ?page=N) — mesma escolha do scroll infinito.
    function railFetch(tab, url) {
        const csrf = document.documentElement.getAttribute('data-csrf')
            || (document.querySelector('input[name="_xfToken"]') || {}).value || '';
        const full = url + (url.indexOf('?') >= 0 ? '&' : '?') + '_xfResponseType=json'
            + (csrf ? '&_xfToken=' + encodeURIComponent(csrf) : '');
        return fetch(full, { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(r => r.text())
            .then(t => {
                let html = t;
                let visitorAlerts = null;
                try {
                    const j = JSON.parse(t);
                    html = (j.html && (j.html.content || j.html)) || j.content || t;
                    if (j && j.visitor && typeof j.visitor.alerts_unread !== 'undefined') {
                        visitorAlerts = parseInt(j.visitor.alerts_unread, 10);
                    }
                } catch (e) {}
                const tmp = document.createElement('div');
                tmp.innerHTML = html;
                let rows;
                if (tab === 'watched') {
                    rows = Array.prototype.slice.call(tmp.querySelectorAll('.structItem--thread'))
                        .map(watchedRow).filter(Boolean);
                    const nx = tmp.querySelector('.pageNav-jump--next, .pageNavSimple-el--next, a[rel="next"]');
                    const nextHref = nx ? nx.getAttribute('href') : null;
                    if (typeof ingestWatchedPageToFollowed === 'function') {
                        return ingestWatchedPageToFollowed(tmp).catch(() => 0).then(() => {
                            try {
                                window.dispatchEvent(new CustomEvent('smg-followed-updated', { detail: { count: rows.length } }));
                            } catch (e) {}
                            return { rows, next: nextHref, visitorAlerts };
                        });
                    }
                    try {
                        window.dispatchEvent(new CustomEvent('smg-followed-updated', { detail: { count: rows.length } }));
                    } catch (e) {}
                    return { rows, next: nextHref, visitorAlerts };
                } else {
                    // a PÁGINA usa <li class="block-row js-alert">, a POPUP usa <li class="alert"> — todo o
                    // resto (limpeza, CSS, marcar-lido) casa em li.alert, então promovemos a classe aqui.
                    rows = Array.prototype.slice.call(tmp.querySelectorAll('li.js-alert, li.alert'))
                        .filter(li => li.querySelector('.contentRow-main'));
                    rows.forEach(li => { li.classList.add('alert'); li.classList.remove('block-row', 'block-row--separated'); });
                }
                const nx = tmp.querySelector('.pageNav-jump--next, .pageNavSimple-el--next, a[rel="next"]');
                return { rows, next: nx ? nx.getAttribute('href') : null, visitorAlerts };
            });
    }

    // .structItem--thread (linha larga da listagem) → linha compacta do rail: thumb · título · fórum/hora.
    // Devolve null quando não há título (linha de anúncio/placeholder do tema).
    function watchedRow(it) {
        const titleA = it.querySelector('.structItem-title a[href*="/threads/"]')
            || it.querySelector('.structItem-title a[href]');
        if (!titleA) return null;
        const href = titleA.getAttribute('href') || '';
        if (!href) return null;
        const base = href.replace(/\/(unread|latest|page-\d+|post-\d+)(?:[/?#].*)?$/, '').replace(/\/$/, '');
        const unread = it.classList.contains('is-unread') || it.classList.contains('structItem--unread');

        const li = document.createElement('li');
        li.className = 'smg-rail-wt' + (unread ? ' is-unread' : '');
        const a = document.createElement('a');
        a.className = 'smg-rail-wt-link';
        // SEMPRE a última página (/latest = post mais novo). O /unread das não lidas caía no primeiro
        // post não lido, que numa thread parada há semanas fica lá no meio — quem acompanha quer ver
        // o que acabou de chegar. Mesma rota que o feed das seguidas já usa.
        a.href = safeHref(base + '/latest');

        const thumbUrl = threadThumbUrl(it);
        // alimenta o cache — é daqui que os ALERTAS ganham foto. O título vai junto porque é a única
        // chave que casa com o alerta (que só traz /posts/N, sem id de thread).
        if (thumbUrl) thumbCachePut(base, thumbUrl, titleA.textContent);
        const th = document.createElement('span');
        th.className = 'smg-rail-wt-thumb';
        if (thumbUrl) {
            const im = document.createElement('img');
            im.src = thumbUrl; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async';
            im.addEventListener('error', () => { th.classList.add('smg-rail-wt-thumb--ph'); im.remove(); th.innerHTML = railPhMark(); }, { once: true });
            th.appendChild(im);
        } else { th.classList.add('smg-rail-wt-thumb--ph'); th.innerHTML = railPhMark(); }
        a.appendChild(th);

        const body = document.createElement('span');
        body.className = 'smg-rail-wt-body';
        // chips do prefixo (cor da plataforma) — mesma ideia da linha de alerta
        const chips = Array.prototype.slice.call(it.querySelectorAll('.structItem-title .label, .structItem-title .prefix'));
        if (chips.length) {
            const tags = document.createElement('span');
            tags.className = 'smg-al-tags';
            chips.forEach(c => { const n = c.cloneNode(true); n.classList.add('smg-al-chip'); tags.appendChild(n); });
            body.appendChild(tags);
        }
        const t = document.createElement('span');
        t.className = 'smg-rail-wt-title';
        if (unread) {
            const dot = document.createElement('span');
            dot.className = 'smg-rail-wt-dot';
            dot.setAttribute('aria-hidden', 'true');
            t.appendChild(dot);
        }
        t.appendChild(document.createTextNode((titleA.textContent || '').trim()));
        body.appendChild(t);

        const meta = document.createElement('span');
        meta.className = 'smg-rail-wt-meta';
        const time = it.querySelector('.structItem-latestDate') || it.querySelector('.structItem-cell--latest time');
        if (time) { const c = time.cloneNode(true); c.className = 'smg-al-time'; meta.appendChild(c); }
        if (meta.childNodes.length) body.appendChild(meta);

        a.appendChild(body);
        li.appendChild(a);
        li.dataset.smgAlKey = 'wt:' + base;
        return li;
    }

    function renderFollowedRow(item) {
        if (!item || !item.path) return null;
        const isUnread = Boolean(item.unread);
        const li = document.createElement('li');
        li.className = 'smg-rail-wt' + (isUnread ? ' is-unread' : '');
        const a = document.createElement('a');
        a.className = 'smg-rail-wt-link';
        const base = (item.path || '').replace(/\/(unread|latest|page-\d+|post-\d+)(?:[/?#].*)?$/, '').replace(/\/$/, '');
        a.href = safeHref(base + '/latest');
        a.addEventListener('click', () => {
            if (typeof dbFollowedMarkSeen === 'function') {
                dbFollowedMarkSeen(item.path);
            }
        });

        const thumbUrl = item.thumbnail_url || (typeof thumbCacheGet === 'function' ? thumbCacheGet(item.path, item.thread_name) : '');
        const th = document.createElement('span');
        th.className = 'smg-rail-wt-thumb';
        if (thumbUrl) {
            const im = document.createElement('img');
            im.src = thumbUrl;
            im.alt = '';
            im.loading = 'lazy';
            im.decoding = 'async';
            im.addEventListener('error', () => {
                th.classList.add('smg-rail-wt-thumb--ph');
                im.remove();
                th.innerHTML = railPhMark();
            }, { once: true });
            th.appendChild(im);
        } else {
            th.classList.add('smg-rail-wt-thumb--ph');
            th.innerHTML = railPhMark();
        }
        a.appendChild(th);

        const body = document.createElement('span');
        body.className = 'smg-rail-wt-body';

        if (Array.isArray(item.tags) && item.tags.length) {
            const tags = document.createElement('span');
            tags.className = 'smg-al-tags';
            item.tags.forEach(t => {
                const name = typeof t === 'string' ? t : (t && t.name ? t.name : '');
                if (!name) return;
                const chip = document.createElement('span');
                const k = name.toLowerCase().trim();
                let cls = (typeof t === 'object' && t.className)
                    || (typeof KNOWN_XF_PREFIXES !== 'undefined' && KNOWN_XF_PREFIXES[k])
                    || ('label label--' + k.replace(/[^a-z0-9]+/g, '-'));
                if (!cls.includes('label')) cls = 'label ' + cls;
                chip.className = 'smg-al-chip ' + cls;
                if (typeof t === 'object' && t.style) {
                    chip.setAttribute('style', t.style);
                }
                chip.textContent = name;
                tags.appendChild(chip);
            });
            body.appendChild(tags);
        }

        const t = document.createElement('span');
        t.className = 'smg-rail-wt-title';
        if (isUnread) {
            const dot = document.createElement('span');
            dot.className = 'smg-rail-wt-dot';
            dot.setAttribute('aria-hidden', 'true');
            t.appendChild(dot);
        }
        t.appendChild(document.createTextNode((item.thread_name || '').trim()));
        body.appendChild(t);

        const meta = document.createElement('span');
        meta.className = 'smg-rail-wt-meta';
        const ts = item.updated_at || item.forum_activity_ts || 0;
        if (ts) {
            const time = document.createElement('time');
            time.className = 'smg-al-time';
            time.setAttribute('data-timestamp', String(ts));
            time.textContent = (typeof smgRelTime === 'function') ? smgRelTime(ts) : '';
            meta.appendChild(time);
        }
        if (meta.childNodes.length) body.appendChild(meta);

        a.appendChild(body);
        li.appendChild(a);
        li.dataset.smgAlKey = 'wt:' + base;
        return li;
    }
    const railPhMark = () => (document.documentElement.classList.contains('smg-smg') ? SMG_PH_MARK : SC_PH_MARK);

    // chave de dedupe — conteúdo novo empurra a lista, então a mesma linha reaparece na página seguinte.
    // Calculada ANTES da limpeza (cleanAlertRow remonta o conteúdo e o texto muda).
    function alertKey(li) {
        if (li.dataset.smgAlKey) return li.dataset.smgAlKey;   // linha de thread: a chave já veio pronta
        const id = li.getAttribute('data-alert-id');
        if (id) return 'id:' + id;
        const a = li.querySelector('a[href]');
        const t = li.querySelector('time');
        return 'k:' + ((a && a.getAttribute('href')) || '')
            + '|' + ((t && t.getAttribute('datetime')) || '')
            + '|' + (li.textContent || '').trim().slice(0, 60);
    }

    const railPane = tab => aldock && aldock.querySelector('.smg-aldock-body[data-tab="' + tab + '"]');
    const railList = tab => aldock && aldock.querySelector('.smg-aldock-body[data-tab="' + tab + '"] .smg-aldock-list');

    // insere as linhas inéditas (topo ou fim) e já aplica a limpeza/i18n por linha.
    // Devolve quantas entraram — 0 no refresh significa "nada novo" (não mexe na tela).
    function aldockInsertRows(tab, rows, atTop) {
        const ol = railList(tab);
        if (!ol) return 0;
        const st = aldockState[tab];
        const fresh = [];
        rows.forEach(li => {
            const key = alertKey(li);
            if (st.keys.has(key)) return;
            st.keys.add(key);
            li.dataset.smgAlKey = key;
            fresh.push(li);
        });
        fresh.forEach((li, i) => {
            if (atTop) ol.insertBefore(li, ol.children[i] || null); else ol.appendChild(li);
            if (tab === 'alerts') { try { cleanAlertRow(li.querySelector('.contentRow-main')); } catch (e) {} }
            i18nDom(li);   // "Mark read" do botão + resíduo EN do HTML buscado
        });
        return fresh.length;
    }

    function aldockStatus(tab, kind) {
        const pane = railPane(tab);
        const el = pane && pane.querySelector('.smg-aldock-status');
        if (!el) return;
        const st = aldockState[tab], src = RAIL_SRC[tab];
        const rowSel = tab === 'watched' ? '.smg-rail-wt' : 'li.alert';
        const list = railList(tab);
        if (kind === 'loading' && list && list.querySelector('.smg-aldock-skel-row')) {
            el.hidden = true;
            el.textContent = '';
            return;
        }
        const empty = !list.querySelector(rowSel);
        const noneVisible = st.filter === 'unread' && !list.querySelector(rowSel + '.is-unread');
        const txt = kind === 'loading' ? i18n('Loading…')
            : kind === 'error' ? i18n('Couldn’t load.')
            : empty ? i18n(src.empty)
            : noneVisible ? i18n(src.emptyUnread)
            : (!st.next && st.loaded ? i18n('End of the list') : '');
        el.textContent = txt;
        el.hidden = !txt;
        el.classList.toggle('smg-aldock-status--busy', kind === 'loading');
    }

    function getWatchedUnreadCount() {
        return Math.max(0, parseInt(gmGet('smg-watched-unread-count', '0'), 10) || 0);
    }

    function updateWatchedUnreadBadge(count) {
        const n = Math.max(0, parseInt(count, 10) || 0);
        document.querySelectorAll('.smg-tb-railbtn').forEach(btn => {
            if (typeof setReactiveBadge === 'function') {
                setReactiveBadge(btn, n, 'smg-tb-badge');
            } else {
                let b = btn.querySelector(':scope > .smg-tb-badge');
                if (n > 0) {
                    const t = n > 99 ? '99+' : String(n);
                    if (!b) { b = document.createElement('span'); b.className = 'smg-tb-badge'; btn.appendChild(b); }
                    if (b.textContent !== t) b.textContent = t;
                } else if (b) {
                    b.remove();
                }
            }
        });
        const navWatched = document.querySelector('#smg-nav-watched');
        if (navWatched) {
            const host = navWatched.querySelector('.smg-nav-ico') || navWatched;
            if (typeof setReactiveBadge === 'function') {
                setReactiveBadge(host, n, 'smg-nav-badge');
            } else {
                let b = host.querySelector(':scope > .smg-nav-badge');
                if (n > 0) {
                    const t = n > 99 ? '99+' : String(n);
                    if (!b) { b = document.createElement('span'); b.className = 'smg-nav-badge'; host.appendChild(b); }
                    if (b.textContent !== t) b.textContent = t;
                } else if (b) {
                    b.remove();
                }
            }
        }
    }

    function updateAlertsUnreadBadge(count) {
        const n = Math.max(0, parseInt(count, 10) || 0);
        document.querySelectorAll('.smg-tb-railbtn, #smg-topbar .smg-rt-alerts').forEach(btn => {
            if (typeof setReactiveBadge === 'function') {
                setReactiveBadge(btn, n, 'smg-tb-badge');
            } else {
                let b = btn.querySelector(':scope > .smg-tb-badge');
                if (n > 0) {
                    const t = n > 99 ? '99+' : String(n);
                    if (!b) { b = document.createElement('span'); b.className = 'smg-tb-badge'; btn.appendChild(b); }
                    if (b.textContent !== t) b.textContent = t;
                } else if (b) {
                    b.remove();
                }
            }
        });
        const navAlerts = document.querySelector('#smg-nav-alerts');
        if (navAlerts) {
            const host = navAlerts.querySelector('.smg-nav-ico') || navAlerts;
            if (typeof setReactiveBadge === 'function') {
                setReactiveBadge(host, n, 'smg-nav-badge');
            } else {
                let b = host.querySelector(':scope > .smg-nav-badge');
                if (n > 0) {
                    const t = n > 99 ? '99+' : String(n);
                    if (!b) { b = document.createElement('span'); b.className = 'smg-nav-badge'; host.appendChild(b); }
                    if (b.textContent !== t) b.textContent = t;
                } else if (b) {
                    b.remove();
                }
            }
        }
    }

    // contador do cabeçalho — atualiza o badge com a contagem de alertas não lidos
    function aldockSyncCount() {
        if (!aldock) return;
        const list = railList('alerts');
        const domUnread = (list && list.querySelector('li.alert'))
            ? list.querySelectorAll('li.alert.is-unread').length
            : null;
        const serverCount = (typeof alertsBadgeCount === 'function')
            ? alertsBadgeCount()
            : (parseInt(gmGet('smg-alerts-count', '0'), 10) || 0);
        const st = aldockState && aldockState.alerts;
        const hasMore = Boolean(st && st.next);

        let n;
        if (st && typeof st.serverUnread === 'number' && st.serverUnread >= 0) {
            n = (st.serverUnread === 0 && domUnread === 0) ? 0 : Math.max(st.serverUnread, domUnread || 0);
        } else if (domUnread === null) {
            n = serverCount;
        } else if (hasMore) {
            // Still has subsequent pages on the server: DOM has only partial count.
            n = Math.max(serverCount, domUnread);
        } else {
            // Reached end of list: DOM has all alerts.
            n = domUnread;
        }
        n = Math.max(0, parseInt(n, 10) || 0);
        const el = aldock.querySelector('.smg-aldock-n');
        if (el) {
            el.textContent = n > 99 ? '99+' : String(n);
            el.hidden = !n;
        }
        gmSet('smg-alerts-count', String(n));
        updateAlertsUnreadBadge(n);
    }

    // topo da lista: procura conteúdo NOVO (1ª página) e insere sem perder o scroll nem o que já foi lido
    function railRefresh(tab, force) {
        const st = aldockState[tab];
        if (!aldock || st.busy) return Promise.resolve();
        const now = Date.now();
        if (!force && now - st.lastFetch < 15000) return Promise.resolve();   // clique nervoso/foco repetido não vira rajada de request
        st.busy = true;
        st.lastFetch = now;
        const first = !st.loaded;
        const clearSkeleton = () => {
            const list = railList(tab);
            if (list) list.querySelectorAll('.smg-aldock-skel-row').forEach(row => row.remove());
        };
        if (first) aldockStatus(tab, 'loading'); else aldock.classList.add('smg-aldock--refreshing');

        if (tab === 'watched') {
            const getFollowed = (typeof dbFollowedGetAll === 'function') ? dbFollowedGetAll() : Promise.resolve([]);
            return getFollowed.then(items => {
                clearSkeleton();
                const list = railList('watched');
                if (!list) return;

                const valid = Array.isArray(items) ? items.filter(it => it && it.path) : [];
                const unread = valid.filter(t => Boolean(t.unread))
                    .sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
                const read = valid.filter(t => !t.unread)
                    .sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));

                const sorted = [...unread, ...read];
                list.innerHTML = '';
                st.keys.clear();
                sorted.forEach(item => {
                    const row = renderFollowedRow(item);
                    if (row) {
                        const key = row.dataset.smgAlKey || ('wt:' + item.path);
                        st.keys.add(key);
                        list.appendChild(row);
                        i18nDom(row);
                    }
                });

                st.loaded = true;
                st.next = null;

                gmSet('smg-watched-unread-count', String(unread.length));
                updateWatchedUnreadBadge(unread.length);
                aldockSyncCount();
                aldockStatus('watched', '');

                if (!valid.length && first) {
                    if (typeof fetchAndIngestFollowed === 'function') {
                        fetchAndIngestFollowed(false, false).catch(() => {});
                    }
                }
            }).catch(() => {
                clearSkeleton();
                aldockStatus('watched', 'error');
            }).finally(() => {
                st.busy = false;
                aldock.classList.remove('smg-aldock--refreshing');
            });
        }

        return railFetch(tab, railBaseUrl(tab))
            .then(({ rows, next, visitorAlerts }) => {
                clearSkeleton();
                if (tab === 'alerts' && typeof visitorAlerts === 'number' && !isNaN(visitorAlerts)) {
                    st.serverUnread = visitorAlerts;
                    gmSet('smg-alerts-count', String(visitorAlerts));
                    updateAlertsUnreadBadge(visitorAlerts);
                }
                const added = aldockInsertRows(tab, rows, true);
                if (first) { st.next = next; st.loaded = true; }
                // recontagem do badge a partir do que acabou de chegar (só alertas têm contador)
                if (added && tab === 'alerts') syncAlertBadgeFrom(railList('alerts'));
                if (tab === 'alerts' && typeof dbFollowedGetAll === 'function') {
                    dbFollowedGetAll().then(items => {
                        if (typeof indexFollowedThumbs === 'function') indexFollowedThumbs(items);
                        repaintAlertThumbs(railList('alerts'));
                    }).catch(() => {});
                }
                // toda carga pode ter esquentado o cache (a de seguidas põe foto; a de alertas pode
                // chegar depois de o cache já ter enchido) → repinta sempre, e só então decide o warm
                repaintAlertThumbs(railList('alerts'));
                if (tab !== 'watched') railWarmThumbs();
                railThumbReport();
                aldockSyncCount();
                aldockStatus(tab, '');
            })
            .catch(() => { if (first) { clearSkeleton(); aldockStatus(tab, 'error'); } })
            .then(() => { st.busy = false; aldock.classList.remove('smg-aldock--refreshing'); });
    }

    // DIAGNÓSTICO (temporário): fala UMA vez, e só quando a foto falhou em TODAS as linhas depois de
    // o cache já ter sido alimentado. Diz de onde veio o href do alerta e o que há no cache — é o que
    // separa "cache vazio" de "id do alerta não bate com o id da listagem". Silencioso quando funciona.
    let railThumbLogged = false;
    function railThumbReport() {
        if (railThumbLogged || !aldockState.watched.loaded) return;   // sem o warm ainda é cedo pra concluir
        const list = railList('alerts');
        const icons = list ? list.querySelectorAll('.smg-al-icon[data-smg-thread]') : [];
        if (!icons.length) return;
        railThumbLogged = true;
        if (list.querySelector('.smg-al-icon--thumb')) return;        // pintou alguma → nada a relatar
        const keys = Object.keys(thumbCacheAll());   // em MEMÓRIA: a gravação é em lote, o storage ainda pode estar vazio
        console.log('[SMG] thumb dos alertas: 0/' + icons.length
            + ' · 1º alerta: ' + (icons[0].dataset.smgThread || '(sem href)') + ' “' + (icons[0].dataset.smgTitle || '') + '”'
            + ' · cache: ' + keys.length + ' threads (ex.: ' + (keys[0] || '—') + ')'
            + ' · padrão: ' + (gmGet(THUMBTPL_KEY, '') || '(nenhum)'));
    }

    // Alerta é sobre thread que você ACOMPANHA — e a lista de seguidas traz a foto de todas elas.
    // Então, quando sobra alerta sem foto, esquentamos o cache com a MESMA busca da aba Seguindo (que
    // de quebra já fica pré-carregada). Uma página traz ~20 threads, e são ~30 alertas de threads
    // diferentes: seguimos paginando enquanto faltar foto, até ALDOCK_WARM_PAGES. Continua sendo um
    // punhado de requisições por PÁGINA — nunca uma por item — e para assim que a cobertura fecha.
    const ALDOCK_WARM_PAGES = 4;
    let railWarmDone = false, railWarmPages = 0;
    function railWarmThumbs() {
        if (railWarmDone || aldockState.watched.busy) return;
        const list = railList('alerts');
        if (!list) return;
        const missing = list.querySelectorAll('.smg-al-icon[data-smg-thread]:not([data-smg-thumbed])').length;
        if (missing < 3) { railWarmDone = true; return; }          // cobertura boa → para
        if (railWarmPages >= ALDOCK_WARM_PAGES) { railWarmDone = true; return; }
        const st = aldockState.watched;
        if (st.loaded && !st.next) { railWarmDone = true; return; }   // acabou a lista de seguidas
        railWarmPages++;
        (st.loaded ? railMore('watched') : railRefresh('watched', true)).then(() => {
            repaintAlertThumbs(railList('alerts'));
            railWarmThumbs();   // ainda falta foto e há próxima página? busca mais uma
        });
    }

    // fim da lista: próxima página do histórico (rolagem infinita)
    function railMore(tab) {
        const st = aldockState[tab];
        if (!aldock || !aldockOpen() || st.busy || !st.loaded || !st.next) return Promise.resolve();
        st.busy = true;
        aldockStatus(tab, 'loading');
        const url = st.next;
        return railFetch(tab, url)
            .then(({ rows, next }) => {
                st.next = next;
                const added = aldockInsertRows(tab, rows, false);
                // conteúdo novo desloca a paginação → a página seguinte pode voltar só repetida. Uma tudo-repetida
                // é normal nesse deslocamento; DUAS seguidas = fim de verdade (e corta o loop de request à toa).
                st.dry = added ? 0 : st.dry + 1;
                if (st.dry >= 2) st.next = null;
                aldockSyncCount();
                aldockStatus(tab, '');
            })
            .catch(() => { st.next = null; aldockStatus(tab, ''); })   // erro de rede não vira loop de retry a cada scroll
            .then(() => { st.busy = false; railFillViewport(tab); });
    }

    // filtro "não lidas" pode esconder tudo que está carregado → puxa mais até ter o que mostrar (ou acabar).
    // Teto de ALDOCK_AUTOFILL páginas por ação: sem ele, "Não lidas" com zero não-lida varreria o histórico
    // inteiro numa rajada. Rolar até o fim continua puxando o resto normalmente.
    function railFillViewport(tab) {
        const st = aldockState[tab];
        if (!aldock || !aldockOpen() || st.busy || !st.next) return;
        if (st.autoFill >= ALDOCK_AUTOFILL) return;
        const pane = railPane(tab), list = railList(tab);
        if (!pane || tab !== railTab) return;   // aba escondida não tem altura medível → só enche a que está à vista
        const rowSel = tab === 'watched' ? '.smg-rail-wt' : 'li.alert';
        const visible = st.filter === 'unread'
            ? list.querySelectorAll(rowSel + '.is-unread').length
            : list.querySelectorAll(rowSel).length;
        if (visible < 8 || pane.scrollHeight <= pane.clientHeight + 40) { st.autoFill++; railMore(tab); }
    }

    // grade × lista (só nas abas com `view`): classe no pane + ícone/rótulo do botão viram o MODO OPOSTO
    function railApplyView(tab) {
        const pane = railPane(tab), btn = aldock && aldock.querySelector('.smg-aldock-view');
        if (!pane || !btn) return;
        const grid = railView(tab) === 'grid';
        pane.classList.toggle('is-grid', grid);
        btn.hidden = !RAIL_SRC[tab].view;
        btn.innerHTML = grid ? ICONS.list : ICONS.gallery;
        const lbl = i18n(grid ? 'List view' : 'Grid view');
        btn.title = lbl; btn.setAttribute('aria-label', lbl);
    }

    // troca a aba visível: cabeçalho, ações, filtro e o "Ver todos os tópicos seguidos"
    function railShowTab(tab, persist) {
        if (!aldock) return;
        tab = RAIL_SRC[tab] ? tab : 'alerts';
        railTab = tab;
        if (persist !== false) gmSet(ALDOCK_TAB_KEY, tab);
        const src = RAIL_SRC[tab], st = aldockState[tab];
        aldock.querySelectorAll('.smg-aldock-body').forEach(b => { b.hidden = b.dataset.tab !== tab; });
        const titleEl = aldock.querySelector('.smg-aldock-titletext');
        if (titleEl) titleEl.textContent = i18n(src.title);
        const markAll = aldock.querySelector('.smg-aldock-markall');
        if (markAll) markAll.hidden = !src.markAll;
        const seeAll = aldock.querySelector('.smg-aldock-seeall');
        if (seeAll) {
            seeAll.href = safeHref(src.seeAll);
            seeAll.textContent = i18n(src.title === 'Alerts' ? 'See all' : 'See all watched threads');
        }
        st.filter = 'all';
        aldock.classList.remove('smg-aldock--unread');
        railApplyView(tab);
        aldockSyncCount();
        st.autoFill = 0;
        railRefresh(tab, !st.loaded).then(() => { aldockStatus(tab, ''); railFillViewport(tab); });
    }

    function buildAlertsDock() {
        if (aldock) return aldock;
        const el = document.createElement('aside');
        el.id = 'smg-aldock';
        el.setAttribute('aria-label', i18n('Alerts'));
        const alertsSkeleton = '<li class="smg-aldock-skel-row"><span class="smg-aldock-skel-thumb"></span><span class="smg-aldock-skel-copy"><span class="smg-aldock-skel-line"></span><span class="smg-aldock-skel-line short"></span></span></li>'.repeat(6);
        const pane = tab =>
            '<div class="smg-aldock-body smg-tb-listbody" data-tab="' + tab + '"' + (tab === 'alerts' ? '' : ' hidden') + '>' +
                '<ol class="smg-aldock-list ' + (tab === 'alerts' ? 'smg-alert-clean' : 'smg-rail-wtlist') + '">' + alertsSkeleton + '</ol>' +
                '<div class="smg-aldock-status" hidden></div>' +
            '</div>';
        el.innerHTML =
            '<div class="smg-aldock-grip" title="' + i18n('Drag to resize') + '"></div>' +
            '<div class="smg-aldock-head">' +
                '<span class="smg-aldock-title"><span class="smg-aldock-titletext">' + i18n('Alerts') + '</span><span class="smg-aldock-n" hidden></span></span>' +
                '<div class="smg-aldock-acts">' +
                    '<button type="button" class="smg-aldock-btn smg-aldock-markread" title="' + i18n('Mark all as read') + '" aria-label="' + i18n('Mark all as read') + '">' + ICONS.checkAll + '</button>' +
                    '<button type="button" class="smg-aldock-btn smg-aldock-view" hidden></button>' +
                    '<button type="button" class="smg-aldock-btn smg-aldock-refresh" title="' + i18n('Refresh') + '" aria-label="' + i18n('Refresh') + '">' + ICONS.refresh + '</button>' +
                    '<button type="button" class="smg-aldock-btn smg-aldock-close" title="' + i18n('Close panel') + '" aria-label="' + i18n('Close panel') + '">' + ICONS.close + '</button>' +
                '</div>' +
            '</div>' +
            pane('alerts') + pane('watched') +
            '<div class="smg-aldock-foot">' +
                '<a class="smg-aldock-seeall" href="/account/alerts">' + i18n('See all') + '</a>' +
            '</div>';
        document.body.appendChild(el);
        aldock = el;

        const applyMarkAllReadSuccess = () => {
            el.querySelectorAll('li.alert.is-unread').forEach(row => {
                row.classList.remove('is-unread');
                row.classList.add('smg-al-old');
                row.querySelectorAll('.smg-al-read').forEach(b => b.remove());
            });
            const badge = el.querySelector('.smg-aldock-n');
            if (badge) {
                badge.hidden = true;
                badge.textContent = '';
            }
            const st = aldockState && aldockState.alerts;
            if (st && typeof st.serverUnread === 'number') st.serverUnread = 0;
            gmSet('smg-alerts-count', '0');
            const nav = document.querySelector('.p-navgroup-link--alerts');
            if (nav) nav.removeAttribute('data-badge');
            if (typeof syncReactiveBadges === 'function') syncReactiveBadges();
            aldockSyncCount();
        };

        const markReadBtn = el.querySelector('.smg-aldock-markread');
        if (markReadBtn) {
            markReadBtn.addEventListener('click', () => {
                if (typeof window !== 'undefined' && window.__TEST_MODE__) {
                    applyMarkAllReadSuccess();
                    return;
                }
                if (markReadBtn.dataset.busy) return;
                markReadBtn.dataset.busy = '1';
                const csrf = document.documentElement.getAttribute('data-csrf')
                    || (document.querySelector('input[name="_xfToken"]') || {}).value
                    || (window.XF && window.XF.config && window.XF.config.csrf) || '';
                fetch('/account/alerts/mark-read', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'X-CSRF-Token': csrf,
                        '_xfToken': csrf
                    },
                    body: '_xfToken=' + encodeURIComponent(csrf) + '&_xfResponseType=json&_xfWithData=1'
                })
                    .then(r => r.text().then(txt => ({ ok: r.ok, txt })))
                    .then(({ ok, txt }) => {
                        let j = null; try { j = JSON.parse(txt); } catch (e) {}
                        if (!ok || (j && (j.errors || j.errorHtml))) throw new Error('xf');
                        applyMarkAllReadSuccess();
                    })
                    .catch(() => {})
                    .finally(() => {
                        delete markReadBtn.dataset.busy;
                    });
            });
        }

        el.querySelector('.smg-aldock-close').addEventListener('click', () => closeAlertsDock());
        el.querySelector('.smg-aldock-refresh').addEventListener('click', () => {
            if (railTab === 'watched' && typeof fetchAndIngestFollowed === 'function') {
                fetchAndIngestFollowed(false, true).catch(() => {});
            }
            railRefresh(railTab, true);
        });
        el.querySelector('.smg-aldock-view').addEventListener('click', () => {
            gmSet(ALDOCK_VIEW_KEY(railTab), railView(railTab) === 'grid' ? 'list' : 'grid');
            railApplyView(railTab);
            railFillViewport(railTab);   // a grade cabe mais por tela → pode faltar linha pra encher
        });

        // rolagem infinita DENTRO de cada aba (rAF-throttled, passive — mesmo padrão do resto do script)
        el.querySelectorAll('.smg-aldock-body').forEach(body => {
            let ticking = false;
            body.addEventListener('scroll', () => {
                if (ticking) return;
                ticking = true;
                requestAnimationFrame(() => {
                    ticking = false;
                    if (body.scrollTop + body.clientHeight > body.scrollHeight - 400) {
                        const t = body.dataset.tab;
                        aldockState[t].autoFill = 0;
                        railMore(t);
                    }
                });
            }, { passive: true });
        });

        // arrastar a borda esquerda pra redimensionar (largura fica salva)
        const grip = el.querySelector('.smg-aldock-grip');
        grip.addEventListener('pointerdown', e => {
            e.preventDefault();
            grip.setPointerCapture(e.pointerId);
            document.documentElement.classList.add('smg-aldock-resizing');
            const move = ev => {
                const w = Math.max(ALDOCK_MIN_W, Math.min(aldockViewportMax(), window.innerWidth - ev.clientX));
                document.documentElement.style.setProperty('--smg-ald-w', w + 'px');
            };
            const up = () => {
                grip.removeEventListener('pointermove', move);
                grip.removeEventListener('pointerup', up);
                document.documentElement.classList.remove('smg-aldock-resizing');
                const cur = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--smg-ald-w'), 10);
                if (cur) gmSet(ALDOCK_W_KEY, String(cur));
            };
            grip.addEventListener('pointermove', move);
            grip.addEventListener('pointerup', up);
        });

        i18nDom(el);
        return el;
    }

    function openAlertsDock(tab, persist) {
        if (!FEATURES.alertsDock || !aldockFits()) return;
        buildAlertsDock();
        document.documentElement.style.setProperty('--smg-ald-w', aldockWidth() + 'px');
        document.documentElement.classList.add('smg-aldock-on');
        // celular: tela cheia = trava o fundo e entra no histórico (o "voltar" fecha em vez de sair
        // da página). E NUNCA persiste: reabrir sozinho a cada navegação seria uma tela cheia na
        // cara do usuário em toda página — no desktop é uma coluna lateral, aqui é a tela inteira.
        if (aldockPhone()) {
            if (!railPhoneOpen) { railPhoneOpen = true; smgLockScroll(); try { history.pushState({ smgSheet: true }, ''); } catch (e) {} }
            persist = false;
        }
        if (persist !== false) gmSet(ALDOCK_KEY, '1');
        railShowTab(RAIL_SRC[tab] ? tab : railWantedTab(), persist);
    }
    let railPhoneOpen = false;

    function closeAlertsDock(persist, fromPop) {
        document.documentElement.classList.remove('smg-aldock-on');
        if (railPhoneOpen) {
            railPhoneOpen = false;
            smgUnlockScroll();
            if (!fromPop) { try { history.back(); } catch (e) {} }   // consome o estado que a abertura empurrou
        }
        if (persist !== false) gmSet(ALDOCK_KEY, '0');
    }

    // toggle do sino/atalho: fechado → abre na aba pedida (ou na última usada); aberto numa aba
    // DIFERENTE da pedida → só troca de aba (fechar aqui seria contraintuitivo); mesma aba → fecha.
    function toggleAlertsDock(tab) {
        if (!aldockOpen()) { openAlertsDock(tab); return; }
        if (tab && RAIL_SRC[tab] && tab !== railTab) { railShowTab(tab); return; }
        closeAlertsDock();
    }

    function setupAlertsDock() {
        if (aldockBound || !FEATURES.alertsDock) return;
        if (!document.querySelector('.p-navgroup-link--alerts')) {
            // The preference can survive a logout. Remove the early layout
            // reservation when there is no account control to own the dock.
            document.documentElement.classList.remove('smg-aldock-on');
            return;
        }   // deslogado / tema sem sino → não há o que dockar
        aldockBound = true;

        if (typeof dbFollowedGetAll === 'function') {
            dbFollowedGetAll().then(items => {
                if (typeof indexFollowedThumbs === 'function') indexFollowedThumbs(items);
                repaintAlertThumbs(railList('alerts'));
            }).catch(() => {});
        }

        // (o sino da topbar não existe mais — o botão do painel é o único controle e tem o próprio handler)

        // janela estreitou → desdocka SEM esquecer a preferência (volta sozinho ao alargar).
        // No celular não há "volta sozinho": lá o rail é tela cheia e só abre por gesto do usuário.
        window.addEventListener('resize', () => {
            if (aldockOpen() && aldockFits() && !aldockPhone()) {
                document.documentElement.style.setProperty('--smg-ald-w', aldockWidth() + 'px');
            }
            if (aldockOpen() && !aldockFits()) closeAlertsDock(false);
            else if (!aldockOpen() && aldockWanted() && aldockFits() && !aldockPhone()) openAlertsDock(null, false);
        });
        // celular: o "voltar" fecha a tela cheia (par do pushState no openAlertsDock)
        window.addEventListener('popstate', () => { if (railPhoneOpen) closeAlertsDock(false, true); });

        // conteúdo novo não avisa: sonda de tempos em tempos e ao voltar pra aba
        setInterval(() => { if (aldockOpen() && !document.hidden) railRefresh(railTab); }, ALDOCK_POLL_MS);
        document.addEventListener('visibilitychange', () => { if (!document.hidden && aldockOpen()) railRefresh(railTab); });

        window.addEventListener('smg-followed-updated', () => {
            if (aldock && aldockOpen() && railTab === 'watched') {
                railRefresh('watched', false);
            } else if (typeof dbFollowedGetUnreadCount === 'function') {
                dbFollowedGetUnreadCount().then(c => {
                    gmSet('smg-watched-unread-count', String(c));
                    updateWatchedUnreadBadge(c);
                });
            }
        });
        window.addEventListener('smg-followed-seen', e => {
            const path = e && e.detail && e.detail.path;
            if (path && aldock) {
                const base = path.replace(/\/(unread|latest|page-\d+|post-\d+).*$/, '').replace(/\/$/, '');
                const row = aldock.querySelector(`.smg-rail-wt[data-smg-al-key="wt:${base}"]`);
                if (row && row.classList.contains('is-unread')) {
                    row.classList.remove('is-unread');
                    aldockSyncCount();
                }
            }
        });
        window.addEventListener('smg-followed-all-seen', onFollowedAllSeen);

        if (aldockWanted() && aldockFits() && !aldockPhone()) openAlertsDock(null, false);
    }

    function onFollowedAllSeen() {
        if (aldock) {
            aldock.querySelectorAll('.smg-rail-wt.is-unread').forEach(row => row.classList.remove('is-unread'));
            const badge = aldock.querySelector('.smg-aldock-n');
            if (badge) { badge.hidden = true; badge.textContent = ''; }
            aldockSyncCount();
        }
    }

    if (typeof window !== 'undefined') {
        window.addEventListener('smg-followed-all-seen', onFollowedAllSeen);
        window.updateWatchedUnreadBadge = updateWatchedUnreadBadge;
        window.updateAlertsUnreadBadge = updateAlertsUnreadBadge;
        window.getWatchedUnreadCount = getWatchedUnreadCount;
        if (window.__TEST_MODE__) {
            window.__aldockExports = {
                buildAlertsDock,
                openAlertsDock,
                closeAlertsDock,
                toggleAlertsDock,
                railShowTab,
                watchedRow,
                renderFollowedRow,
                aldockSyncCount,
                updateWatchedUnreadBadge,
                updateAlertsUnreadBadge,
                getWatchedUnreadCount,
                aldockWidth,
                aldockState,
                RAIL_SRC,
                railFetch,
                railRefresh,
                getRailTab: () => railTab,
                getAldock: () => aldock
            };
        }
    }
