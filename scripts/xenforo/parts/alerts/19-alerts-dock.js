    // alerts/19-alerts-dock.js
    // Owns: the alerts rail (desktop side rail, phone full-screen sheet): paging, polling, mark all read, width.
    // Exposes: buildAlertsDock, openAlertsDock, closeAlertsDock, toggleAlertsDock, updateAlertsUnreadBadge, ALDOCK_KEY.
    // Depends on: thread/07-posts-misc (createPager), alerts/18-alerts, core/06-helpers (sheets), runtime/22-paint.
    // =========================================================
    // FEATURE: painel lateral DOCKED (rail fixo à direita) — ALERTAS
    // O popover do sino serve pra espiar; ele fecha no primeiro clique e só traz as ~N mais
    // recentes. Aqui o mesmo conteúdo vira uma COLUNA fixa na direita que sobrevive à navegação
    // (estado em GM storage → remonta sozinha na próxima página), com o histórico inteiro em
    // rolagem infinita — dá pra abrir um alerta, ler a thread e continuar descendo a lista.
    //
    // Layout: EMPURRA o conteúdo (body padding-right + topbar termina antes do rail) em vez de
    // cobrir, e ALARGA a coluna do fórum (--smg-cw sobe) — a margem lateral que sobrava vira texto.
    //
    // Mapa (Cmd+F): estado/persistência · RAIL_SRC · railFetch (paginação por "next")
    //   · buildAlertsDock (DOM) · railRefresh/railMore · open/close/toggle · setupAlertsDock (boot + listeners).
    // =========================================================
    const ALDOCK_KEY = 'smg-alerts-dock';        // '1' = painel aberto (persiste entre páginas)
    const ALDOCK_W_KEY = 'smg-alerts-dock-w';    // largura escolhida no arrasto (px)
    const ALDOCK_MIN_W = 300, ALDOCK_MAX_W = 620, ALDOCK_DEF_W = 360;
    const ALDOCK_RESP_MIN_W = 340, ALDOCK_RESP_MAX_W = 460;
    const ALDOCK_MIN_VW = 1100;   // abaixo disso o rail comeria o conteúdo → não docka (o popover/sheet continua valendo)
    const ALDOCK_POLL_MS = 90000; // busca conteúdo novo de tempos em tempos (o XF não avisa sozinho)
    const ALDOCK_AUTOFILL = 5;    // teto de páginas puxadas SOZINHO por ação (troca de aba/abertura)

    let aldock = null;            // elemento do painel (montado 1×)
    let aldockBound = false;
    let alertsNeedRefresh = false;

    // a fonte do rail: paginar seguindo o "next" nativo, deduplicar, rolagem infinita.
    const RAIL_SRC = {
        alerts:  { title: 'Alerts',    seeAll: '/account/alerts',  empty: 'No notifications yet' },
    };
    // estado — busy: refresh do topo no ar · dry: páginas seguidas sem nada inédito · autoFill: páginas puxadas
    // sozinho desde a última ação do usuário (teto pra rolagem automática não varrer o histórico inteiro).
    // A rolagem infinita é o motor comum (createPager, 07): st.next É o cursor dele — gravar st.next troca a lista
    // (reset), e a página que ainda carregava pra lista anterior é descartada. Rolar o rail não é rolar a página:
    // o master switch do scroll infinito não vale aqui.
    const mkState = tab => {
        const st = { busy: false, loaded: false, keys: new Set(), lastFetch: 0, dry: 0, autoFill: 0 };
        st.pager = createPager({
            near: 400,
            load: url => railFetch(tab, url),
            apply: ({ rows, next }) => {
                const added = aldockInsertRows(tab, rows, false);
                // conteúdo novo desloca a paginação → a página seguinte pode voltar só repetida. Uma tudo-repetida
                // é normal nesse deslocamento; DUAS seguidas = fim de verdade (e corta o loop de request à toa).
                st.dry = added ? 0 : st.dry + 1;
                aldockSyncCount();
                return { next: st.dry >= 2 ? null : next, added };
            },
            enabled: () => !!aldock && aldockOpen() && !st.busy && st.loaded,
            onFail: () => 'stop',   // erro de rede não vira loop de retry a cada scroll
            onState: kind => {
                aldockStatus(tab, kind === 'loading' ? 'loading' : '');
                if (kind !== 'loading') railFillViewport(tab);
            },
            listen: false,   // o painel nasce depois (buildAlertsDock): o listener de scroll dele chama check()
        });
        Object.defineProperty(st, 'next', { enumerable: true, get: () => st.pager.cursor, set: v => { st.pager.reset(v); } });
        return st;
    };
    const aldockState = { alerts: mkState('alerts') };

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
    // — marcar tudo, rolagem infinita — no lugar do
    // bottom sheet, que só mostrava a lista curta do popup nativo, sem paginação nem filtro.
    // A faixa do meio (601–1099) continua sem rail: lá ele comeria o conteúdo sem virar tela cheia.
    const aldockPhone = () => typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 600px)').matches;
    // na /account/alerts a lista nativa (limpa) é a própria página: o rail só repetiria o conteúdo
    const aldockOnAlertsPage = () => /\/account\/alerts(?:\/|$)/.test(location.pathname);
    const aldockFits = () => !aldockOnAlertsPage() && (window.innerWidth >= ALDOCK_MIN_VW || aldockPhone());
    const aldockWanted = () => gmGet(ALDOCK_KEY, '0') === '1';
    const aldockOpen = () => document.documentElement.classList.contains('smg-aldock-on');
    const railBaseUrl = () => RAIL_SRC.alerts.seeAll;

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
                const parsed = new DOMParser().parseFromString('<div id="smg-rail-parse">' + html + '</div>', 'text/html');
                const tmp = parsed.getElementById('smg-rail-parse') || parsed.body;
                // a PÁGINA usa <li class="block-row js-alert">, a POPUP usa <li class="alert"> — todo o
                // resto (limpeza, CSS, marcar-lido) casa em li.alert, então promovemos a classe aqui.
                const rows = Array.prototype.slice.call(tmp.querySelectorAll('li.js-alert, li.alert'))
                    .filter(li => li.querySelector('.contentRow-main'));
                rows.forEach(li => { li.classList.add('alert'); li.classList.remove('block-row', 'block-row--separated'); });
                const nx = tmp.querySelector('.pageNav-jump--next, .pageNavSimple-el--next, a[rel="next"]');
                return { rows, next: nx ? nx.getAttribute('href') : null, visitorAlerts };
            });
    }

    // chave de dedupe — conteúdo novo empurra a lista, então a mesma linha reaparece na página seguinte.
    // Calculada ANTES da limpeza (cleanAlertRow remonta o conteúdo e o texto muda).
    function alertKey(li) {
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
        const rowSel = 'li.alert';
        const list = railList(tab);
        if (kind === 'loading' && list && list.querySelector('.smg-aldock-skel-row')) {
            el.hidden = true;
            el.textContent = '';
            return;
        }
        const empty = !list.querySelector(rowSel);
        const txt = kind === 'loading' ? i18n('Loading…')
            : kind === 'error' ? i18n('Couldn’t load.')
            : empty ? i18n(src.empty)
            : (!st.next && st.loaded ? i18n('End of the list') : '');
        el.textContent = txt;
        el.hidden = !txt;
        el.classList.toggle('smg-aldock-status--busy', kind === 'loading');
    }

    // badge de alertas não lidos: sino da topbar + sino da navbar mobile
    function updateAlertsUnreadBadge(count) {
        const n = Math.max(0, parseInt(count, 10) || 0);
        document.querySelectorAll('#smg-topbar .smg-rt-alerts').forEach(btn => {
            setReactiveBadge(btn, n, 'smg-tb-badge');
        });
        const nav = document.querySelector('#smg-nav-bell');
        if (nav) {
            const host = nav.querySelector('.smg-nav-ico') || nav;
            setReactiveBadge(host, n, 'smg-nav-badge');
        }
    }

    // contador do cabeçalho — atualiza o badge com a contagem de alertas não lidos
    function aldockSyncCount() {
        if (!aldock) return;
        const list = railList('alerts');
        const domUnread = (list && list.querySelector('li.alert'))
            ? list.querySelectorAll('li.alert.is-unread').length
            : null;
        const serverCount = alertsBadgeCount();
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

    // fim comum das cargas (incremental e do zero): fotos das threads seguidas, warm, contador, status
    function railAfterLoad(tab) {
        dbFollowedGetAll().then(items => {
            indexFollowedThumbs(items);
            repaintAlertThumbs(railList(tab));
        }).catch(() => {});
        // a carga pode chegar depois de o cache já ter enchido → repinta sempre, e só então decide o warm
        repaintAlertThumbs(railList(tab));
        railWarmThumbs();
        aldockSyncCount();
        aldockStatus(tab, '');
    }

    // Zera a lista e busca a primeira página de novo. O refresh incremental
    // só insere chave nova, então um alerta lido no clique continuava na sidebar.
    let railHardFlight = null;
    function railHardRefresh(tab) {
        const st = aldockState[tab];
        const list = railList(tab);
        if (!aldock || !st || !list || tab !== 'alerts') return Promise.resolve();
        if (railHardFlight) return railHardFlight;
        st.busy = true;
        st.lastFetch = Date.now();
        aldock.classList.add('smg-aldock--refreshing');
        railHardFlight = railFetch(tab, railBaseUrl(tab))
            .then(({ rows, next, visitorAlerts }) => {
                // o contador do servidor; aldockSyncCount (fim desta mesma carga) grava e pinta
                if (typeof visitorAlerts === 'number' && !isNaN(visitorAlerts)) st.serverUnread = visitorAlerts;
                st.keys.clear();
                list.replaceChildren();
                aldockInsertRows(tab, rows || [], false);
                st.next = next;
                st.loaded = true;
                st.dry = 0;
                railAfterLoad(tab);
            })
            .catch(() => { aldockStatus(tab, 'error'); })
            .then(() => {
                st.busy = false;
                railHardFlight = null;
                if (aldock) aldock.classList.remove('smg-aldock--refreshing');
            });
        return railHardFlight;
    }
    document.addEventListener('smg:page', () => {
        if (!alertsNeedRefresh) return;
        alertsNeedRefresh = false;
        railHardRefresh('alerts');
    });

    // topo da lista: procura conteúdo NOVO (1ª página) e insere sem perder o scroll nem o que já foi lido
    function railRefresh(tab, force) {
        const st = aldockState[tab];
        if (!aldock || st.busy || st.pager.busy) return Promise.resolve();
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

        return railFetch(tab, railBaseUrl(tab))
            .then(({ rows, next, visitorAlerts }) => {
                clearSkeleton();
                // o contador do servidor; aldockSyncCount (fim desta mesma carga) grava e pinta
                if (typeof visitorAlerts === 'number' && !isNaN(visitorAlerts)) st.serverUnread = visitorAlerts;
                const added = aldockInsertRows(tab, rows, true);
                if (first) { st.next = next; st.loaded = true; }
                // recontagem do badge a partir do que acabou de chegar
                if (added) syncAlertBadgeFrom(railList('alerts'));
                railAfterLoad(tab);
            })
            .catch(() => { if (first) { clearSkeleton(); aldockStatus(tab, 'error'); } })
            .then(() => { st.busy = false; aldock.classList.remove('smg-aldock--refreshing'); });
    }

    // Alerta é sobre thread que você ACOMPANHA — e a lista de seguidas (IndexedDB) traz a foto de
    // todas elas. Quando sobra alerta sem foto e essa lista ainda está vazia, busca /watched/threads
    // UMA vez (a ingestão indexa as fotos e repinta o rail sozinha). Nunca uma requisição por item.
    let railWarmDone = false;
    function railWarmThumbs() {
        if (railWarmDone) return;
        const list = railList('alerts');
        if (!list) return;
        railWarmDone = true;
        const missing = list.querySelectorAll('.smg-al-icon[data-smg-thread]:not([data-smg-thumbed])').length;
        if (missing < 3) return;                                       // cobertura boa → nada a buscar
        dbFollowedGetAll().then(items => {
            if (!items.length) return fetchAndIngestFollowed();
        }).catch(() => {});
    }

    // fim da lista: próxima página do histórico (rolagem infinita)
    function railMore(tab) {
        const st = aldockState[tab];
        if (!aldock || !aldockOpen() || st.busy || !st.loaded) return Promise.resolve();
        return st.pager.more();
    }

    // poucas linhas pra encher o painel → puxa mais até ter o que mostrar (ou acabar).
    // Teto de ALDOCK_AUTOFILL páginas por ação: sem ele, um painel alto varreria o histórico
    // inteiro numa rajada. Rolar até o fim continua puxando o resto normalmente.
    function railFillViewport(tab) {
        const st = aldockState[tab];
        if (!aldock || !aldockOpen() || st.busy || st.pager.busy || !st.next) return;
        if (st.autoFill >= ALDOCK_AUTOFILL) return;
        const pane = railPane(tab), list = railList(tab);
        if (!pane) return;
        const visible = list.querySelectorAll('li.alert').length;
        if (visible < 8 || pane.scrollHeight <= pane.clientHeight + 40) { st.autoFill++; railMore(tab); }
    }

    // painel aberto: recontagem + conteúdo novo (a 1ª abertura carrega a lista)
    function railActivate() {
        if (!aldock) return;
        const st = aldockState.alerts;
        aldockSyncCount();
        st.autoFill = 0;
        railRefresh('alerts', !st.loaded).then(() => { aldockStatus('alerts', ''); railFillViewport('alerts'); });
    }

    function buildAlertsDock() {
        if (aldock) return aldock;
        const el = document.createElement('aside');
        el.id = 'smg-aldock';
        el.setAttribute('aria-label', i18n('Alerts'));
        const alertsSkeleton = paintRailRow('li', 'smg-aldock-skel-row').repeat(6);
        el.innerHTML =
            '<div class="smg-aldock-grip" title="' + i18n('Drag to resize') + '"></div>' +
            '<div class="smg-sheet-grip smg-aldock-handle"></div>' +   // puxador do drawer (só no celular)
            '<div class="smg-aldock-head">' +
                '<span class="smg-aldock-title"><span class="smg-aldock-titletext">' + i18n('Alerts') + '</span><span class="smg-aldock-n" hidden></span></span>' +
                '<div class="smg-aldock-acts">' +
                    '<button type="button" class="smg-aldock-btn smg-aldock-markread" title="' + i18n('Mark all as read') + '" aria-label="' + i18n('Mark all as read') + '">' + ICONS.checkAll + '</button>' +
                    '<button type="button" class="smg-aldock-btn smg-aldock-refresh" title="' + i18n('Refresh') + '" aria-label="' + i18n('Refresh') + '">' + ICONS.refresh + '</button>' +
                    '<button type="button" class="smg-aldock-btn smg-aldock-close" title="' + i18n('Close panel') + '" aria-label="' + i18n('Close panel') + '">' + ICONS.close + '</button>' +
                '</div>' +
            '</div>' +
            '<div class="smg-aldock-body smg-tb-listbody" data-tab="alerts">' +
                '<ol class="smg-aldock-list smg-alert-clean">' + alertsSkeleton + '</ol>' +
                '<div class="smg-aldock-status" hidden></div>' +
            '</div>' +
            '<div class="smg-aldock-foot">' +
                '<a class="smg-aldock-seeall" href="/account/alerts">' + i18n('See all') + '</a>' +
            '</div>';
        document.body.appendChild(el);
        aldock = el;
        markSidebarReady();

        // celular: o rail é um DRAWER (metade da tela, arrasta até cheia ou pra baixo pra fechar) sobre um
        // scrim que fecha ao toque. No desktop nenhum dos dois aparece (CSS) e o arrasto não engata.
        const scrim = document.createElement('div');
        scrim.className = 'smg-aldock-scrim';
        scrim.addEventListener('click', () => closeAlertsDock(false));
        document.body.appendChild(scrim);
        addSwipeClose(el, () => closeAlertsDock(false), () => aldockPhone() && aldockOpen(),
            { setFull: full => el.classList.toggle('is-full', full) });

        const applyMarkAllReadSuccess = () => {
            el.querySelectorAll('li.alert.is-unread').forEach(row => {
                row.classList.remove('is-unread');
                row.classList.add('smg-al-old');
                row.querySelectorAll('.smg-al-read').forEach(b => b.remove());
            });
            const st = aldockState.alerts;
            if (typeof st.serverUnread === 'number') st.serverUnread = 0;
            gmSet('smg-alerts-count', '0');
            const nav = document.querySelector('.p-navgroup-link--alerts');
            if (nav) nav.removeAttribute('data-badge');
            syncReactiveBadges();   // termina no aldockSyncCount → pílula do painel + sinos
        };

        const markReadBtn = el.querySelector('.smg-aldock-markread');
        if (markReadBtn) {
            markReadBtn.addEventListener('click', () => {
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
        el.querySelector('.smg-aldock-refresh').addEventListener('click', () => railHardRefresh('alerts'));

        const alertsBody = el.querySelector('.smg-aldock-body[data-tab="alerts"]');
        if (alertsBody) {
            alertsBody.addEventListener('click', e => {
                const a = e.target.closest('a[href]');
                if (!a || a.classList.contains('smg-al-read')) return;
                let url;
                try { url = new URL(a.href, location.href); } catch (err) { return; }
                if (url.origin !== location.origin) return;
                // O fórum tira o alerta quando a página é vista. Não marca como lido daqui.
                // Mesma página: a navegação interna não busca de novo, então a visita é este GET.
                if (url.pathname + url.search === location.pathname + location.search) {
                    e.preventDefault();
                    fetch(url.href, { credentials: 'same-origin' }).catch(() => {}).finally(() => {
                        railHardRefresh('alerts');
                    });
                    const id = (url.hash || '').replace(/^#/, '');
                    const target = id && document.getElementById(id);
                    if (target) {
                        try { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (err) {}
                    }
                    return;
                }
                alertsNeedRefresh = true;
            });
        }

        // rolagem infinita DENTRO do painel (rAF-throttled, passive — mesmo padrão do resto do script)
        if (alertsBody) {
            let ticking = false;
            alertsBody.addEventListener('scroll', () => {
                if (ticking) return;
                ticking = true;
                requestAnimationFrame(() => {
                    ticking = false;
                    aldockState.alerts.autoFill = 0;   // rolar é ação do usuário: zera o teto do auto-preenchimento
                    aldockState.alerts.pager.check(alertsBody);
                });
            }, { passive: true });
        }

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

    function openAlertsDock(persist) {
        if (!FEATURES.alertsDock || !aldockFits()) return;
        buildAlertsDock();
        document.documentElement.style.setProperty('--smg-ald-w', aldockWidth() + 'px');
        document.documentElement.classList.add('smg-aldock-on');
        // celular: drawer = trava o fundo e entra no histórico (o "voltar" fecha em vez de sair
        // da página). E NUNCA persiste: reabrir sozinho a cada navegação seria um drawer na
        // cara do usuário em toda página — no desktop é uma coluna lateral, aqui cobre a tela.
        if (aldockPhone()) {
            aldock.classList.remove('is-full');   // drawer sempre abre na metade
            if (!railPhoneOpen) { railPhoneOpen = true; smgModalOpen(railModalKey, () => closeAlertsDock(false, true)); }
            persist = false;
        }
        if (persist !== false) gmSet(ALDOCK_KEY, '1');
        railActivate();
    }
    let railPhoneOpen = false;
    const railModalKey = { rail: 'alerts' };   // chave do modal (o painel pode ser recriado)

    function closeAlertsDock(persist, fromPop) {
        document.documentElement.classList.remove('smg-aldock-on');
        if (railPhoneOpen) {
            railPhoneOpen = false;
            smgModalClose(railModalKey, fromPop);   // sem fromPop: consome o estado que a abertura empurrou
        }
        if (persist !== false) gmSet(ALDOCK_KEY, '0');
    }

    // janela estreitou ou a página virou a /account/alerts → desdocka SEM esquecer a preferência (volta
    // sozinho ao alargar / sair dela). fromNav: chamado da navegação interna, que já criou a própria
    // entrada no histórico → fechar a tela cheia do celular não pode dar history.back().
    function aldockReconcile(fromNav) {
        if (aldockOpen() && aldockFits() && !aldockPhone()) {
            document.documentElement.style.setProperty('--smg-ald-w', aldockWidth() + 'px');
        }
        if (aldockOpen() && !aldockFits()) closeAlertsDock(false, fromNav);
        else if (!aldockOpen() && aldockWanted() && aldockFits() && !aldockPhone()) openAlertsDock(false);
    }

    // toggle do sino/atalho: fechado → abre; aberto → fecha.
    function toggleAlertsDock() {
        if (!aldockOpen()) { openAlertsDock(); return; }
        closeAlertsDock();
    }

    function setupAlertsDock() {
        if (aldockBound || !FEATURES.alertsDock) return;
        if (!document.querySelector('.p-navgroup-link--alerts')) {
            // The preference can survive a logout. Remove the early layout
            // reservation when there is no account control to own the dock.
            document.documentElement.classList.remove('smg-aldock-on');
            markSidebarReady();
            return;
        }   // deslogado / tema sem sino → não há o que dockar
        aldockBound = true;

        dbFollowedGetAll().then(items => {
            indexFollowedThumbs(items);
            repaintAlertThumbs(railList('alerts'));
        }).catch(() => {});

        // (o sino da topbar não existe mais — o botão do painel é o único controle e tem o próprio handler)

        // janela estreitou → desdocka SEM esquecer a preferência (volta sozinho ao alargar).
        // No celular não há "volta sozinho": lá o rail é tela cheia e só abre por gesto do usuário.
        window.addEventListener('resize', () => aldockReconcile(false));

        // conteúdo novo não avisa: sonda de tempos em tempos e ao voltar pra aba
        setInterval(() => { if (aldockOpen() && !document.hidden) railRefresh('alerts'); }, ALDOCK_POLL_MS);
        document.addEventListener('visibilitychange', () => { if (!document.hidden && aldockOpen()) railRefresh('alerts'); });

        if (aldockWanted() && aldockFits() && !aldockPhone()) {
            openAlertsDock(false);
        } else {
            markSidebarReady();
        }
    }

