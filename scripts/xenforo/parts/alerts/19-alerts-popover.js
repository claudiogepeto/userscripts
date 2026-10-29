    // alerts/19-alerts-popover.js
    // Owns: the alerts popover and phone drawer: paging, polling, mark all read.
    // Exposes: buildAlertsPopover, openAlertsPopover, closeAlertsPopover, toggleAlertsPopover, updateAlertsUnreadBadge.
    // Depends on: thread/07-posts-misc (createPager), alerts/18-alerts, core/06-helpers (popover and modal helpers).
    // =========================================================
    const ALPOP_POLL_MS = 90000;
    const ALPOP_AUTOFILL = 5;    // teto de páginas puxadas SOZINHO por ação (troca de aba/abertura)

    let alpop = null;            // elemento do painel (montado 1×)
    let alpopBound = false;
    let alertsNeedRefresh = false;

    // Fonte da lista: segue o próximo link nativo, deduplica e pagina ao rolar.
    const ALERTS_SRC = {
        alerts:  { title: 'Alerts',    seeAll: '/account/alerts',  empty: 'No notifications yet' },
    };
    // estado — busy: refresh do topo no ar · dry: páginas seguidas sem nada inédito · autoFill: páginas puxadas
    // sozinho desde a última ação do usuário (teto pra rolagem automática não varrer o histórico inteiro).
    // A rolagem infinita é o motor comum (createPager, 07): st.next É o cursor dele — gravar st.next troca a lista
    // (reset), e a página que ainda carregava pra lista anterior é descartada. Rolar a lista não é rolar a página:
    // o master switch do scroll infinito não vale aqui.
    const mkState = tab => {
        const st = { busy: false, loaded: false, keys: new Set(), lastFetch: 0, dry: 0, autoFill: 0 };
        st.pager = createPager({
            near: 400,
            load: url => fetchAlerts(tab, url),
            apply: ({ rows, next }) => {
                const added = alpopInsertRows(tab, rows, false);
                // conteúdo novo desloca a paginação → a página seguinte pode voltar só repetida. Uma tudo-repetida
                // é normal nesse deslocamento; DUAS seguidas = fim de verdade (e corta o loop de request à toa).
                st.dry = added ? 0 : st.dry + 1;
                alpopSyncCount();
                return { next: st.dry >= 2 ? null : next, added };
            },
            enabled: () => !!alpop && alpopOpen() && !st.busy && st.loaded,
            onFail: () => 'stop',   // erro de rede não vira loop de retry a cada scroll
            onState: kind => {
                alpopStatus(tab, kind === 'loading' ? 'loading' : '');
                if (kind !== 'loading') fillAlertsViewport(tab);
            },
            listen: false,   // o painel nasce depois (buildAlertsPopover): o listener de scroll dele chama check()
        });
        Object.defineProperty(st, 'next', { enumerable: true, get: () => st.pager.cursor, set: v => { st.pager.reset(v); } });
        return st;
    };
    const alpopState = { alerts: mkState('alerts') };

    const alpopPhone = () => typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 600px)').matches;
    const alpopOnAlertsPage = () => /\/account\/alerts(?:\/|$)/.test(location.pathname);
    const alpopOpen = () => !!alpop && alpop.classList.contains('open');
    const alertsBaseUrl = () => ALERTS_SRC.alerts.seeAll;

    // busca UMA página (a `url` já é a próxima, seguindo o link nativo) e devolve as linhas prontas
    // pro popover + o "next". Seguir o <a> de próxima em vez de montar ?page=N funciona nos 2 sites e
    // em qualquer formato de paginação (/page-N, ?page=N) — mesma escolha do scroll infinito.
    function fetchAlerts(tab, url) {
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
                const parsed = new DOMParser().parseFromString('<div id="smg-alert-parse">' + html + '</div>', 'text/html');
                const tmp = parsed.getElementById('smg-alert-parse') || parsed.body;
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

    const alertsPane = tab => alpop && alpop.querySelector('.smg-alpop-body[data-tab="' + tab + '"]');
    const alertsList = tab => alpop && alpop.querySelector('.smg-alpop-body[data-tab="' + tab + '"] .smg-alpop-list');

    // insere as linhas inéditas (topo ou fim) e já aplica a limpeza/i18n por linha.
    // Devolve quantas entraram — 0 no refresh significa "nada novo" (não mexe na tela).
    function alpopInsertRows(tab, rows, atTop) {
        const ol = alertsList(tab);
        if (!ol) return 0;
        const st = alpopState[tab];
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

    function alpopStatus(tab, kind) {
        const pane = alertsPane(tab);
        const el = pane && pane.querySelector('.smg-alpop-status');
        if (!el) return;
        const st = alpopState[tab], src = ALERTS_SRC[tab];
        const rowSel = 'li.alert';
        const list = alertsList(tab);
        if (kind === 'loading' && list && list.querySelector('.smg-alpop-skel-row')) {
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
        el.classList.toggle('smg-alpop-status--busy', kind === 'loading');
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
    function alpopSyncCount() {
        if (!alpop) return;
        const list = alertsList('alerts');
        const domUnread = (list && list.querySelector('li.alert'))
            ? list.querySelectorAll('li.alert.is-unread').length
            : null;
        const serverCount = alertsBadgeCount();
        const st = alpopState && alpopState.alerts;
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
        const el = alpop.querySelector('.smg-alpop-n');
        if (el) {
            el.textContent = n > 99 ? '99+' : String(n);
            el.hidden = !n;
        }
        gmSet('smg-alerts-count', String(n));
        updateAlertsUnreadBadge(n);
    }

    // fim comum das cargas (incremental e do zero): fotos das threads seguidas, warm, contador, status
    function afterAlertsLoad(tab) {
        dbFollowedGetAll().then(items => {
            indexFollowedThumbs(items);
            repaintAlertThumbs(alertsList(tab));
        }).catch(() => {});
        // a carga pode chegar depois de o cache já ter enchido → repinta sempre, e só então decide o warm
        repaintAlertThumbs(alertsList(tab));
        warmAlertThumbs();
        alpopSyncCount();
        alpopStatus(tab, '');
    }

    // Zera a lista e busca a primeira página de novo. O refresh incremental
    // só insere chave nova, então um alerta lido no clique continuava na sidebar.
    let alertsHardFlight = null;
    function refreshAlerts(tab) {
        const st = alpopState[tab];
        const list = alertsList(tab);
        if (!alpop || !st || !list || tab !== 'alerts') return Promise.resolve();
        if (alertsHardFlight) return alertsHardFlight;
        st.busy = true;
        st.lastFetch = Date.now();
        alpop.classList.add('smg-alpop--refreshing');
        alertsHardFlight = fetchAlerts(tab, alertsBaseUrl(tab))
            .then(({ rows, next, visitorAlerts }) => {
                // o contador do servidor; alpopSyncCount (fim desta mesma carga) grava e pinta
                if (typeof visitorAlerts === 'number' && !isNaN(visitorAlerts)) st.serverUnread = visitorAlerts;
                st.keys.clear();
                list.replaceChildren();
                alpopInsertRows(tab, rows || [], false);
                st.next = next;
                st.loaded = true;
                st.dry = 0;
                afterAlertsLoad(tab);
            })
            .catch(() => { alpopStatus(tab, 'error'); })
            .then(() => {
                st.busy = false;
                alertsHardFlight = null;
                if (alpop) alpop.classList.remove('smg-alpop--refreshing');
            });
        return alertsHardFlight;
    }
    document.addEventListener('smg:page', () => {
        if (!alertsNeedRefresh) return;
        alertsNeedRefresh = false;
        refreshAlerts('alerts');
    });

    // topo da lista: procura conteúdo NOVO (1ª página) e insere sem perder o scroll nem o que já foi lido
    function refreshAlertsIncremental(tab, force) {
        const st = alpopState[tab];
        if (!alpop || st.busy || st.pager.busy) return Promise.resolve();
        const now = Date.now();
        if (!force && now - st.lastFetch < 15000) return Promise.resolve();   // clique nervoso/foco repetido não vira rajada de request
        st.busy = true;
        st.lastFetch = now;
        const first = !st.loaded;
        const clearSkeleton = () => {
            const list = alertsList(tab);
            if (list) list.querySelectorAll('.smg-alpop-skel-row').forEach(row => row.remove());
        };
        if (first) alpopStatus(tab, 'loading'); else alpop.classList.add('smg-alpop--refreshing');

        return fetchAlerts(tab, alertsBaseUrl(tab))
            .then(({ rows, next, visitorAlerts }) => {
                clearSkeleton();
                // o contador do servidor; alpopSyncCount (fim desta mesma carga) grava e pinta
                if (typeof visitorAlerts === 'number' && !isNaN(visitorAlerts)) st.serverUnread = visitorAlerts;
                const added = alpopInsertRows(tab, rows, true);
                if (first) { st.next = next; st.loaded = true; }
                // recontagem do badge a partir do que acabou de chegar
                if (added) syncAlertBadgeFrom(alertsList('alerts'));
                afterAlertsLoad(tab);
            })
            .catch(() => { if (first) { clearSkeleton(); alpopStatus(tab, 'error'); } })
            .then(() => { st.busy = false; alpop.classList.remove('smg-alpop--refreshing'); });
    }

    // Alerta é sobre thread que você ACOMPANHA — e a lista de seguidas (IndexedDB) traz a foto de
    // todas elas. Quando sobra alerta sem foto e essa lista ainda está vazia, busca /watched/threads
    // UMA vez (a ingestão indexa as fotos e repinta o popover sozinha). Nunca uma requisição por item.
    let alertsWarmDone = false;
    function warmAlertThumbs() {
        if (alertsWarmDone) return;
        const list = alertsList('alerts');
        if (!list) return;
        alertsWarmDone = true;
        const missing = list.querySelectorAll('.smg-al-icon[data-smg-thread]:not([data-smg-thumbed])').length;
        if (missing < 3) return;                                       // cobertura boa → nada a buscar
        dbFollowedGetAll().then(items => {
            if (!items.length) return fetchAndIngestFollowed();
        }).catch(() => {});
    }

    // fim da lista: próxima página do histórico (rolagem infinita)
    function moreAlerts(tab) {
        const st = alpopState[tab];
        if (!alpop || !alpopOpen() || st.busy || !st.loaded) return Promise.resolve();
        return st.pager.more();
    }

    // poucas linhas pra encher o painel → puxa mais até ter o que mostrar (ou acabar).
    // Teto de ALPOP_AUTOFILL páginas por ação: sem ele, um painel alto varreria o histórico
    // inteiro numa rajada. Rolar até o fim continua puxando o resto normalmente.
    function fillAlertsViewport(tab) {
        const st = alpopState[tab];
        if (!alpop || !alpopOpen() || st.busy || st.pager.busy || !st.next) return;
        if (st.autoFill >= ALPOP_AUTOFILL || alpopOnAlertsPage()) return;
        const pane = alertsPane(tab), list = alertsList(tab);
        if (!pane) return;
        const visible = list.querySelectorAll('li.alert').length;
        if (visible < 8 || pane.scrollHeight <= pane.clientHeight + 40) { st.autoFill++; moreAlerts(tab); }
    }

    // painel aberto: recontagem + conteúdo novo (a 1ª abertura carrega a lista)
    function activateAlertsPopover() {
        if (!alpop) return;
        const st = alpopState.alerts;
        alpopSyncCount();
        st.autoFill = 0;
        refreshAlertsIncremental('alerts', !st.loaded).then(() => { alpopStatus('alerts', ''); fillAlertsViewport('alerts'); });
    }

    function buildAlertsPopover() {
        if (alpop) return alpop;
        const el = document.createElement('aside');
        el.id = 'smg-alpop';
        el.setAttribute('aria-label', i18n('Alerts'));
        const alertsSkeleton = '<li class="smg-alpop-skel-row" aria-hidden="true"></li>'.repeat(4);
        el.innerHTML =
            '<div class="smg-sheet-grip smg-alpop-handle"></div>' +
            '<div class="smg-alpop-head">' +
                '<span class="smg-alpop-title"><span class="smg-alpop-titletext">' + i18n('Alerts') + '</span><span class="smg-alpop-n" hidden></span></span>' +
                '<div class="smg-alpop-acts">' +
                    '<button type="button" class="smg-alpop-btn smg-alpop-markread" title="' + i18n('Mark all as read') + '" aria-label="' + i18n('Mark all as read') + '">' + ICONS.checkAll + '</button>' +
                    '<button type="button" class="smg-alpop-btn smg-alpop-refresh" title="' + i18n('Refresh') + '" aria-label="' + i18n('Refresh') + '">' + ICONS.refresh + '</button>' +
                    '<button type="button" class="smg-alpop-btn smg-alpop-close" title="' + i18n('Close panel') + '" aria-label="' + i18n('Close panel') + '">' + ICONS.close + '</button>' +
                '</div>' +
            '</div>' +
            '<div class="smg-alpop-body smg-tb-listbody" data-tab="alerts">' +
                '<ol class="smg-alpop-list smg-alert-clean">' + alertsSkeleton + '</ol>' +
                '<div class="smg-alpop-status" hidden></div>' +
            '</div>' +
            '<div class="smg-alpop-foot">' +
                '<a class="smg-alpop-seeall" href="/account/alerts">' + i18n('See all') + '</a>' +
            '</div>';
        document.body.appendChild(el);
        alpop = el;


        // No celular, o popover vira um drawer modal com detentes de meia tela e tela cheia.
        addSwipeClose(el, () => closeAlertsPopover(false), () => alpopPhone() && alpopOpen(),
            { setFull: full => el.classList.toggle('is-full', full) });

        const applyMarkAllReadSuccess = () => {
            el.querySelectorAll('li.alert.is-unread').forEach(row => {
                row.classList.remove('is-unread');
                row.classList.add('smg-al-old');
                row.querySelectorAll('.smg-al-read').forEach(b => b.remove());
            });
            const st = alpopState.alerts;
            if (typeof st.serverUnread === 'number') st.serverUnread = 0;
            gmSet('smg-alerts-count', '0');
            const nav = document.querySelector('.p-navgroup-link--alerts');
            if (nav) nav.removeAttribute('data-badge');
            syncReactiveBadges();   // termina no alpopSyncCount → pílula do painel + sinos
        };

        const markReadBtn = el.querySelector('.smg-alpop-markread');
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

        el.querySelector('.smg-alpop-close').addEventListener('click', () => closeAlertsPopover());
        el.querySelector('.smg-alpop-refresh').addEventListener('click', () => refreshAlerts('alerts'));

        // Fechar ao navegar na aba atual, sem consumir a entrada de history do drawer.
        // Cliques modificados e destinos em outra aba mantêm o painel aberto.
        el.addEventListener('click', e => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            const a = e.target.closest('a[href]');
            if (!a || a.hasAttribute('download') || (a.target && a.target.toLowerCase() !== '_self')) return;
            closeAlertsPopover(false, true);
        });

        const alertsBody = el.querySelector('.smg-alpop-body[data-tab="alerts"]');
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
                        refreshAlerts('alerts');
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
                    alpopState.alerts.autoFill = 0;   // rolar é ação do usuário: zera o teto do auto-preenchimento
                    alpopState.alerts.pager.check(alertsBody);
                });
            }, { passive: true });
        }

        i18nDom(el);
        return el;
    }

    const alpopModalKey = { alerts: true };
    let alpopPhoneOpen = false;

    function placeAlertsPopover() {
        if (!alpop || alpopPhone()) return;
        const trigger = document.querySelector('.smg-tb-bellbtn');
        if (!trigger) return;
        const rect = trigger.getBoundingClientRect();
        const topbar = document.querySelector('#smg-topbar');
        const topbarBottom = topbar ? topbar.getBoundingClientRect().bottom : rect.bottom;
        const width = Math.min(400, window.innerWidth - 24);
        alpop.style.width = width + 'px';
        alpop.style.left = Math.max(12, Math.min(window.innerWidth - width - 12, rect.right - width)) + 'px';
        alpop.style.top = 'calc(' + Math.round(topbarBottom) + 'px + var(--smg-sp-8))';
    }

    function openAlertsPopover() {
        buildAlertsPopover();
        alpop.classList.add('open');
        const scrim = document.querySelector('.smg-alpop-scrim');
        if (scrim) scrim.classList.toggle('open', alpopPhone());
        if (alpopPhone()) {
            alpop.classList.remove('is-full');
            if (!alpopPhoneOpen) {
                alpopPhoneOpen = true;
                smgModalOpen(alpopModalKey, () => closeAlertsPopover(false, true));
            }
        } else {
            placeAlertsPopover();
        }
        activateAlertsPopover();
    }

    function closeAlertsPopover(_persist, fromPop) {
        if (!alpop) return;
        alpop.classList.remove('open', 'is-full');
        const scrim = document.querySelector('.smg-alpop-scrim');
        if (scrim) scrim.classList.remove('open');
        if (alpopPhoneOpen) {
            alpopPhoneOpen = false;
            smgModalClose(alpopModalKey, fromPop);
        }
    }

    function toggleAlertsPopover() {
        if (alpopOpen()) closeAlertsPopover(); else openAlertsPopover();
    }

    function setupAlertsPopover() {
        if (alpopBound) return;
        alpopBound = true;
        dbFollowedGetAll().then(items => {
            indexFollowedThumbs(items);
            repaintAlertThumbs(alertsList('alerts'));
        }).catch(() => {});
        const scrim = document.createElement('div');
        scrim.className = 'smg-alpop-scrim';
        scrim.addEventListener('click', () => closeAlertsPopover());
        document.body.appendChild(scrim);
        smgPopover({
            inside: target => !!(target && ((document.querySelector('.smg-tb-bellbtn') || {}).contains(target) || (document.querySelector('#smg-alpop') || {}).contains(target))),
            isOpen: alpopOpen,
            close: () => closeAlertsPopover(),
            place: placeAlertsPopover,
            alive: () => !!document.querySelector('.smg-tb-bellbtn'),
        });
        window.addEventListener('resize', placeAlertsPopover);
        setInterval(() => { if (alpopOpen() && !document.hidden) refreshAlertsIncremental('alerts'); }, ALPOP_POLL_MS);
        document.addEventListener('visibilitychange', () => { if (!document.hidden && alpopOpen()) refreshAlertsIncremental('alerts'); });
    }

