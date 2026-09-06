    // =========================================================
    // FEATURE: topbar reformulada (ícones + popovers agrupados)
    // lê os links REAIS da nav nativa via data-nav-id → funciona no simpcity e no smg
    //
    // buildTopbar() é uma função só; mapa interno (Cmd+F): ZONA ESQUERDA (logo+Discover) ·
    //   ZONA CENTRAL (search bar) · ZONA DIREITA (notices/seguindo/alertas/conta) ·
    //   "// ----" abrir/fechar popovers · docked→flutuante · sheets mobile (sino/Discover/User)
    // =========================================================
    let topbarBuilt = false;

    function smgThreadBack() {
        let sameOriginReferrer = false;
        try {
            sameOriginReferrer = !!document.referrer
                && new URL(document.referrer, location.href).origin === location.origin;
        } catch (e) {}

        if (sameOriginReferrer && history.length > 1) {
            history.back();
            return;
        }

        const breadcrumbLinks = document.querySelectorAll('.p-breadcrumbs a[href], .breadcrumb a[href]');
        const forumHref = breadcrumbLinks[breadcrumbLinks.length - 1]?.getAttribute('href');
        location.href = safeHref(forumHref || '/');
    }

    // The title can arrive after the topbar (document-start/streaming). Keep the shell
    // independent from when the native XF header appears. Prefix badges are copied as
    // inert elements so the topbar keeps the forum's color class without copying the
    // whole native heading (which also contains notices/actions on some themes).
    function syncMobileThreadbar() {
        const titleEl = document.querySelector('#smg-mobile-threadbar-title');
        if (!titleEl) return;
        const nativeTitle = document.querySelector('.p-body-header .p-title-value');
        if (!nativeTitle) {
            if (titleEl.dataset.smgThreadbarSignature === 'fallback') return;
            titleEl.dataset.smgThreadbarSignature = 'fallback';
            titleEl.replaceChildren();
            const fallback = document.createElement('span');
            fallback.className = 'smg-mobile-threadbar-title-text';
            fallback.textContent = i18n('Thread');
            titleEl.appendChild(fallback);
            return;
        }

        const badgeNodes = Array.from(nativeTitle.querySelectorAll('.label, .prefix'));
        const badgeSignature = badgeNodes.map(node => (node.getAttribute('class') || '') + ':' + (node.textContent || '').replace(/\s+/g, ' ').trim()).join('|');
        const walker = document.createTreeWalker(nativeTitle, 4, {
            acceptNode(node) {
                return node.parentElement && node.parentElement.closest('.smg-notices, .p-title-pageAction, .label, .prefix')
                    ? 2 : 1;
            }
        });
        const titleText = [];
        while (walker.nextNode()) titleText.push(walker.currentNode.nodeValue);
        const title = titleText.join(' ').replace(/\s+/g, ' ').trim();
        const signature = [
            title,
            badgeSignature,
        ].join('\u001e');
        // processAll() also runs after DOM mutations. Do not rewrite the shell when the
        // source title did not change: replacing children here would create a new mutation
        // on every frame and make the observer chase its own work.
        if (titleEl.dataset.smgThreadbarSignature === signature) return;
        titleEl.dataset.smgThreadbarSignature = signature;
        titleEl.replaceChildren();
        const badgeRoots = [];
        badgeNodes.forEach(node => {
            // A label can be wrapped by an anchor in XenForo. Copy only the visual
            // label, never its link, to keep the mobile topbar a single action area.
            if (badgeRoots.some(b => b.textContent.trim() === node.textContent.trim())) return;
            const badge = node.cloneNode(true);
            badge.removeAttribute('id');
            badge.removeAttribute('href');
            badge.removeAttribute('target');
            badge.removeAttribute('rel');
            badge.removeAttribute('role');
            badge.removeAttribute('tabindex');
            badge.removeAttribute('data-xf-click');
            badgeRoots.push(badge);
        });
        badgeRoots.forEach(badge => titleEl.appendChild(badge));

        const text = document.createElement('span');
        text.className = 'smg-mobile-threadbar-title-text';
        text.textContent = (badgeRoots.length ? ' ' : '') + (title || i18n('Thread'));
        titleEl.appendChild(text);
    }

    function buildTopbar() {
        if (topbarBuilt || document.getElementById('smg-topbar-wrap')) return;
        if (!document.querySelector('.p-nav')) return; // sem nav nativa = nada a fazer
        topbarBuilt = true;

        const postThreadHref = (() => {
            const e = document.querySelector('.p-title-pageAction a[href*="post-thread"], .p-title-pageAction a[href*="create-thread"], .p-title-pageAction a[href*="add-thread"]');
            return e ? e.getAttribute('href') : null;
        })();

        // carrega a lista nativa do XF (alertas/etc) dentro de `body`: conteúdo → erro.
        // rethrow no catch p/ quem chamou resetar seu próprio flag de "já carregou".
        // keepOnError: numa RE-carga já existe lista na tela — falhar a rede não pode apagá-la.
        const loadXfListInto = (body, url, cleanAlerts, keepOnError) =>
            fetchXfList(url)
                .then(node => { body.innerHTML = ''; body.appendChild(node); if (cleanAlerts) { cleanAlertList(node); syncAlertBadgeFrom(node); } })
                .catch(err => { if (!keepOnError) body.innerHTML = '<div class="smg-tb-loading">' + i18n('Error loading.') + '</div>'; throw err; });
        // RE-CARREGA a cada abertura (antes carregava 1× por sessão → alerta novo só aparecia dando F5).
        // A lista atual continua na tela enquanto busca — só a barrinha de "atualizando" aparece.
        const refreshXfList = (body, url, cleanAlerts, state) => {
            if (!body || state.busy) return Promise.resolve();
            state.busy = true;
            if (state.loaded) body.classList.add('smg-tb-listbody--refreshing');
            return loadXfListInto(body, url, cleanAlerts, state.loaded)
                .then(() => { state.loaded = true; }, () => {})
                .then(() => { state.busy = false; body.classList.remove('smg-tb-listbody--refreshing'); });
        };

        // topbar em 3 zonas: ESQUERDA (logo + Discover) · CENTRO (search bar) · DIREITA (Seguindo · Notificações · User)
        // a navbar inferior (mobile) segue com os mesmos destinos via dock
        const discoverItems = [
            { section: 'Explore' },
            { label: 'Trending', desc: 'Most popular right now', icon: ICONS.flame, href: navHref('trending', 'smgtrending', 'trending2') },
            { label: 'What\'s new', desc: 'Recently posted', icon: ICONS.sparkles, href: navHref('whatsNew', 'whatsNew2') || '/whats-new/' },
            { label: 'New posts', desc: 'Latest messages', icon: ICONS.layers, href: navHref('whatsNewPosts', 'newPosts', 'whatsNewPosts2') || '/whats-new/posts/' },
            { label: 'Featured', desc: 'Featured content', icon: ICONS.star, href: navHref('featured') },
            { label: 'Activity', desc: 'Activity feed', icon: ICONS.activity, href: navHref('latestActivity') },
            { section: 'Threads' },
            { label: 'Find threads', desc: 'Browse threads', icon: ICONS.search, href: navHref('findThreads') || '/find-threads/started' },
            { label: 'Unanswered', desc: 'Awaiting a reply', icon: ICONS.help, href: navHref('unansweredThreads') || '/find-threads/unanswered' },
            { section: 'Community' },
            { label: 'Members', desc: 'Member list', icon: ICONS.users, href: navHref('members') || '/members/' },
            { label: 'Online now', desc: 'Who\'s online', icon: ICONS.user, href: navHref('currentVisitors') || '/online/' },
        ];
        // VISITANTE: Timeline (feed das seguidas) e Seguindo exigem conta — pro deslogado seriam só um
        // caminho pro muro de login. Ficam de fora; Discover é público e continua.
        const loggedIn = isLoggedIn();
        // esquerda = só o Discover (dropdown). Seguindo/Notificações/User viram ícones à DIREITA.
        const watchedHref = navHref('watchedThreads', 'watched', 'watchedThreads2') || '/watched/threads';
        const groups = [
            { label: 'Discover', mega: true, icon: ICONS.compass, items: discoverItems, featured: {   // mega-menu (grid 2-col + ícones em tile + painel destacado), estilo Vimeo
                title: 'Timeline', desc: 'Posts from the threads you follow, newest first.', cta: 'Open Timeline',
                href: '/?view=feed', icon: ICONS.feed,
            } },
            { label: 'Timeline', icon: ICONS.feed, href: '/?view=feed', member: true },   // ex-"Feed": river de posts das threads seguidas; mora SÓ na home (ver 22-feed.js)
            { label: 'Following', icon: ICONS.watched, href: watchedHref, member: true },     // threads que você segue (watched) — ícone Following
        ].filter(g => loggedIn || !g.member);

        const wrap = document.createElement('div');
        wrap.id = 'smg-topbar-wrap';
        const bar = document.createElement('div');
        bar.id = 'smg-topbar';

        // Mobile thread shell following the app-topbar pattern: back on the left, context
        // in the center, and an empty right column to keep the title truly centered.
        const mobileThreadbar = document.createElement('div');
        mobileThreadbar.className = 'smg-mobile-threadbar';
        const mobileBack = document.createElement('button');
        mobileBack.type = 'button';
        mobileBack.className = 'smg-mobile-threadbar-back';
        mobileBack.setAttribute('aria-label', i18n('Back'));
        mobileBack.title = i18n('Back');
        mobileBack.innerHTML = ICONS.back;
        mobileBack.addEventListener('click', smgThreadBack);
        const mobileThreadTitle = document.createElement('span');
        mobileThreadTitle.id = 'smg-mobile-threadbar-title';
        mobileThreadTitle.className = 'smg-mobile-threadbar-title';
        mobileThreadTitle.textContent = i18n('Thread');
        const mobileThreadbarEnd = document.createElement('span');
        mobileThreadbarEnd.className = 'smg-mobile-threadbar-end';
        mobileThreadbarEnd.setAttribute('aria-hidden', 'true');
        mobileThreadbar.append(mobileBack, mobileThreadTitle, mobileThreadbarEnd);
        bar.appendChild(mobileThreadbar);

        // inner alinhado à largura do conteúdo (ehentai): barra é full-width, inner é centralizado
        const inner = document.createElement('div');
        inner.id = 'smg-tb-inner';

        // logo (lido da nav nativa antes de escondê-la)
        const logoImg = document.querySelector('.p-header-logo img, .uix_logo img');
        const logoA = document.createElement('a');
        logoA.className = 'smg-tb-logo';
        logoA.href = '/';
        if (document.documentElement.classList.contains('smg-smg')) { logoA.innerHTML = SMG_LOGO_HTML; logoA.classList.add('smg-tb-logo--custom'); }
        else if (logoImg) { const im = document.createElement('img'); im.src = logoImg.getAttribute('src') || ''; im.alt = ''; logoA.appendChild(im); }
        else logoA.textContent = 'Home';
        // ZONA ESQUERDA: logo + Discover (o logo já é o "Início")
        const left = document.createElement('div');
        left.className = 'smg-tb-left';
        left.appendChild(logoA);

        const popovers = [];
        let closeAllPops = () => {};   // preenchido pelo wirePopovers; quem fecha os popovers de fora (ex.: botão de fixar os alertas)

        // navegação (esquerda) = só o Discover
        const nav = document.createElement('div');
        nav.className = 'smg-tb-nav';

        const cleanDiv = arr => { // remove divisores duplicados/nas pontas
            const out = [];
            arr.forEach(it => { if (it.divider) { if (out.length && !out[out.length - 1].divider) out.push(it); } else out.push(it); });
            while (out.length && out[out.length - 1].divider) out.pop();
            return out;
        };
        // mega-menu (Discover): agrupa em seções → grid de 2 colunas (ícone em tile + label + desc) + painel destacado à direita (estilo Vimeo)
        const arrowR = ICONS.arrowRight;
        const buildMegaPop = (items, feat) => {
            const secs = [];
            items.forEach(it => {
                if (it.section) { secs.push({ title: it.section, rows: [] }); return; }
                if (!it.href) return;                         // item sem destino (navHref vazio) → pula
                if (!secs.length) secs.push({ title: '', rows: [] });
                secs[secs.length - 1].rows.push(it);
            });
            const main = secs.filter(s => s.rows.length).map(s =>
                '<div class="smg-tb-mega-sec">' +
                (s.title ? '<div class="smg-tb-mega-label">' + s.title + '</div>' : '') +
                '<div class="smg-tb-mega-grid">' +
                s.rows.map(it =>
                    '<a class="smg-tb-megaitem" href="' + safeHref(it.href) + '">' +
                        '<span class="smg-tb-megaico">' + it.icon + '</span>' +
                        '<span class="smg-tb-megatext"><span class="smg-tb-megatitle">' + it.label + '</span>' +
                        (it.desc ? '<span class="smg-tb-megadesc">' + it.desc + '</span>' : '') + '</span>' +
                    '</a>'
                ).join('') +
                '</div></div>'
            ).join('');
            let html = '<div class="smg-tb-mega-cols"><div class="smg-tb-mega-main">' + main + '</div>';
            if (feat) html += '<a class="smg-tb-mega-feat" href="' + safeHref(feat.href) + '">' +
                '<div class="smg-tb-mega-feat-art">' + (feat.icon || '') + '</div>' +
                '<div class="smg-tb-mega-feat-body">' +
                    '<div class="smg-tb-mega-feat-title">' + feat.title + '</div>' +
                    '<div class="smg-tb-mega-feat-desc">' + feat.desc + '</div>' +
                    '<div class="smg-tb-mega-feat-cta">' + feat.cta + arrowR + '</div>' +
                '</div></a>';
            return html + '</div>';
        };
        groups.forEach(g => {
            if (g.href) { // atalho = link direto (sem dropdown)
                const a = document.createElement('a');
                a.className = 'smg-tb-item';
                a.href = g.href;
                a.innerHTML = (g.icon ? '<span class="smg-tb-ico">' + g.icon + '</span>' : '') + '<span>' + g.label + '</span>';
                nav.appendChild(a);
                return;
            }
            if (g.mega) {   // Discover → mega-menu (grid + painel destacado), não a lista simples
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'smg-tb-item smg-tb-trigger';
                btn.innerHTML = (g.icon ? '<span class="smg-tb-ico">' + g.icon + '</span>' : '') + '<span>' + g.label + '</span><span class="smg-tb-caret">' + ICONS.hide + '</span>';
                const pop = document.createElement('div');
                pop.className = 'smg-tb-pop smg-tb-pop--mega';
                pop.innerHTML = buildMegaPop(g.items, g.featured);
                nav.appendChild(btn);
                wrap.appendChild(pop);
                popovers.push({ btn, pop });
                return;
            }
            const items = cleanDiv(g.items.filter(it => it.divider || it.href));
            if (!items.some(it => !it.divider)) return;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'smg-tb-item smg-tb-trigger';
            btn.innerHTML = (g.icon ? '<span class="smg-tb-ico">' + g.icon + '</span>' : '') + '<span>' + g.label + '</span><span class="smg-tb-caret">' + ICONS.hide + '</span>';
            const pop = document.createElement('div');
            pop.className = 'smg-tb-pop';
            pop.innerHTML = items.map(it => it.divider
                ? '<div class="smg-tb-popdiv"></div>'
                : '<a class="smg-tb-poprow" href="' + safeHref(it.href) + '">' +
                    '<span class="smg-tb-popico">' + it.icon + '</span>' +
                    '<span class="smg-tb-poptext"><span class="smg-tb-poptitle">' + it.label + '</span><span class="smg-tb-popdesc">' + it.desc + '</span></span>' +
                '</a>'
            ).join('');
            nav.appendChild(btn);
            wrap.appendChild(pop);
            popovers.push({ btn, pop });
        });
        inner.appendChild(left);   // ESQUERDA = só o logo (a nav foi pro centro)

        // ZONA CENTRAL: navegação (Discover · Timeline · Following), centralizada — estilo Spellbook
        const center = document.createElement('div');
        center.className = 'smg-tb-center smg-tb-center--nav';
        center.appendChild(nav);
        inner.appendChild(center);

        // SEARCH vira OVERLAY que OCUPA a topbar quando aberto (disparado pelo ícone de busca na direita; reusa toda a engine do setupSearch)
        const searchBar = document.createElement('div');
        searchBar.className = 'smg-tb-search smg-tb-search--overlay';
        const tbInput = document.createElement('input');
        tbInput.type = 'text';
        tbInput.className = 'smg-tb-search-input';
        tbInput.placeholder = i18n('Search the forum…');
        tbInput.setAttribute('aria-label', i18n('Search'));
        tbInput.setAttribute('enterkeyhint', 'search');
        tbInput.autocapitalize = 'off'; tbInput.autocomplete = 'off'; tbInput.spellcheck = false;
        searchBar.innerHTML = '<span class="smg-tb-search-ico">' + ICONS.search + '</span>';
        // chip de contexto (Reddit-style): "Buscar em <tópico/fórum>" com × — preenchido/mostrado/escondido pelo setupSearch
        const tbChip = document.createElement('button');
        tbChip.type = 'button'; tbChip.className = 'smg-tb-search-chip smg-search-chip'; tbChip.hidden = true;
        tbChip.innerHTML = '<span class="smg-search-chip-t"></span><span class="smg-search-chip-x" aria-label="' + i18n('Clear') + '">' + ICONS.close + '</span>';
        searchBar.appendChild(tbChip);
        searchBar.appendChild(tbInput);
        // ações agrupadas à direita — apenas botão de fechar (.smg-search-close)
        const tbActs = document.createElement('span');
        tbActs.className = 'smg-search-acts'; searchBar.appendChild(tbActs);
        const tbClose = document.createElement('button');
        tbClose.type = 'button'; tbClose.className = 'smg-search-close'; tbClose.setAttribute('aria-label', i18n('Close'));
        tbClose.innerHTML = ICONS.close;
        tbClose.addEventListener('click', () => document.dispatchEvent(new CustomEvent('smg-search-close')));
        tbActs.appendChild(tbClose);
        // (sem botão "Buscar": digitar já busca via debounce; Enter força + grava; "Ver todos" abre a página cheia)
        // Enter → busca · Esc → fecha. A abertura só ocorre via clique intencional no botão de busca.
        tbInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); document.querySelector('#smg-search-pop .smg-search-go')?.click(); }
            else if (e.key === 'Escape') { e.preventDefault(); document.dispatchEvent(new CustomEvent('smg-search-close')); tbInput.blur(); }
        });
        // placeholder ROTATIVO — alterna a cada 3s (pausa enquanto você digita/foca). Edite SEARCH_HINTS com os termos que quiser.
        const SEARCH_HINTS = [
            i18n('Search the forum…'),
            'Lana Rhoades', 'Mia Khalifa', 'Brandi Love', 'Riley Reid', 'Abella Danger',
            'Angela White', 'Eva Elfie', 'Sweetie Fox', 'Liya Silver', 'Gabbie Carter',
            'Pokimane', 'Amouranth', 'Emiru', 'Kyedae', 'Valkyrae',
            'Alinity', 'Loserfruit', 'Chica', 'QuarterJade', 'LilyPichu',
        ];
        if (SEARCH_HINTS.length > 1) {
            let hintI = 0;
            setInterval(() => {
                if (document.hidden || !tbInput.offsetParent) return;   // aba em background / busca fechada → não gira placeholder que ninguém vê
                if (tbInput.value || document.activeElement === tbInput) return;
                if (document.documentElement.classList.contains('smg-search-scoped')) return;   // chip de contexto ativo → placeholder fixo "Buscar em X"
                hintI = (hintI + 1) % SEARCH_HINTS.length;
                tbInput.placeholder = SEARCH_HINTS[hintI];
            }, 3000);
        }
        inner.appendChild(searchBar);

        // ações (direita)
        const actions = document.createElement('div');
        actions.className = 'smg-tb-actions';
        const iconAct = (icon, label, href, badge) => {
            const a = document.createElement(href ? 'a' : 'button');
            if (href) a.href = href; else a.type = 'button';
            a.className = 'smg-tb-act';
            a.setAttribute('aria-label', label);
            a.title = label;
            a.innerHTML = '<span class="smg-tb-ico">' + icon + '</span>' + (badge ? '<span class="smg-tb-badge">' + (badge > 99 ? '99+' : badge) + '</span>' : '');
            return a;
        };

        // SINO/dropdown de alertas: SAIU da topbar. Os alertas moram no painel lateral (19-alerts-dock.js) —
        // ter os dois era a mesma lista em dois lugares, e o popover fechava no primeiro clique. O contador
        // de não lidas migrou pro botão do painel. No MOBILE (sem rail) o sino da navbar inferior + o
        // bottom sheet continuam sendo o caminho dos alertas.

        // NOTICES: ficam no banner nativo DENTRO da página (.notices--block) — não são mais recolhidos pra topbar.

        // ZONA DIREITA, ícone 1 — Search: abre o overlay que ocupa a topbar (Following saiu daqui → virou nav central)
        const searchBtn = iconAct(ICONS.search, 'Search');
        searchBtn.classList.add('smg-tb-searchbtn');
        searchBtn.addEventListener('click', e => {
            e.stopPropagation();   // não borbulha pro handler de clique-fora (capture pointerdown) que reverteria
            document.dispatchEvent(new CustomEvent('smg-search-open'));
            // foco robusto: agora + próximo frame + fallback (query fresca; o overlay precisa estar focável)
            const f = () => { const inp = document.querySelector('.smg-tb-search-input'); if (inp) try { inp.focus({ preventScroll: true }); } catch (x) {} };
            f(); requestAnimationFrame(f); setTimeout(f, 80);
        });
        actions.appendChild(searchBtn);

        // ZONA DIREITA, ícone 2 — conta (avatar + popover). Só de MEMBRO: pro visitante o bloco inteiro
        // vira Cadastrar + Entrar (mais abaixo) — antes o dropdown abria vazio pra quem não tem conta.
        const userLink = document.querySelector('.p-navgroup-link--user');
        const uname = (userLink && userLink.getAttribute('title')) || 'Account';
        const accPop = document.createElement('div');
        accPop.className = 'smg-tb-pop smg-tb-pop--account';
        const accSections = [
            [ // conta
                { label: 'Profile', icon: ICONS.user, href: navHref('profile', 'defaultYourProfile') || '/account/' },
                { label: 'Your account', icon: ICONS.settings, href: navHref('defaultYourAccount') || '/account/' },
            ],
            [ // salvos + assistidos — logo abaixo da conta (pedido)
                { label: 'Bookmarks', icon: ICONS.bookmarks, href: navHref('bookmarks') || '/account/bookmarks' },
                { label: 'Watched forums', icon: ICONS.alerts, href: navHref('watchedForums', 'watchedForums2') || '/watched/forums' },
            ],
            [ // criar / comunicação
                { label: 'Post thread', icon: ICONS.plus, href: postThreadHref },
                { label: 'Messages', icon: ICONS.mail, href: navHref('directMessages', 'conversations') || '/direct-messages/' },
            ],
            [ // "Meus" — itens pessoais que estavam espalhados em outros menus
                { label: 'Your threads', icon: ICONS.layers, href: navHref('yourThreads') || '/find-threads/started' },
                { label: 'Contributed', icon: ICONS.chat, href: navHref('contributedThreads') || '/find-threads/contributed' },
                { label: 'Your tickets', icon: ICONS.help, href: navHref('YourTickets') },
            ],
            [ // ações
                { label: 'Preferences', icon: ICONS.sliders, href: navHref('settings') || '/account/preferences' },
                { label: 'History', icon: ICONS.sortDate, href: navHref('history') },
                { label: 'Log out', icon: ICONS.logout, href: navHref('defaultLogOut') || '/logout/' },
            ],
        ];
        const accRow = it => '<a class="smg-tb-poprow smg-tb-poprow--sm" href="' + safeHref(it.href) + '"><span class="smg-tb-popico">' + it.icon + '</span><span class="smg-tb-poptitle">' + it.label + '</span></a>';
        accPop.innerHTML = '<div class="smg-tb-acchead"></div>' +
            accSections.map(sec => sec.filter(it => it.href)).filter(sec => sec.length)
                .map(sec => sec.map(accRow).join('')).join('<div class="smg-tb-popdiv"></div>');
        accPop.querySelector('.smg-tb-acchead').textContent = uname;   // nome do user via textContent (não interpola HTML)

        if (loggedIn) {
            const accBtn = document.createElement('button');
            accBtn.type = 'button';
            accBtn.className = 'smg-tb-account';
            accBtn.setAttribute('aria-label', 'Account');
            // clona o avatar nativo do XF — foto onde existe, ou o avatar-letra colorido
            const navAv = document.querySelector('.p-navgroup-link--user .avatar') || document.querySelector('.p-account .avatar');
            if (navAv) accBtn.appendChild(navAv.cloneNode(true));
            else accBtn.textContent = (uname[0] || '?').toUpperCase();
            actions.appendChild(accBtn);
            wrap.appendChild(accPop);
            popovers.push({ btn: accBtn, pop: accPop, right: true });   // sem noSwitch → abre no HOVER (igual Discover)

            // ZONA DIREITA, ícone 3 — PAINEL LATERAL, logo à direita do avatar. Controle ÚNICO do rail:
            // abre no painel lateral de Seguidos (Following).
            // Leva o BADGE de seguidos não lidos: .smg-rt-watched é o alvo do sync reativo,
            // e o valor inicial vem de getWatchedUnreadCount() pra não nascer mudo.
            if (FEATURES.alertsDock) {
                const railBtn = iconAct(ICONS.panelRight, 'Side panel', null, getWatchedUnreadCount());
                railBtn.classList.add('smg-tb-railbtn', 'smg-rt-watched');
                railBtn.addEventListener('click', e => { e.stopPropagation(); closeAllPops(); toggleAlertsDock('watched'); });
                actions.appendChild(railBtn);
            }
        } else {
            // VISITANTE: Cadastrar (texto) + Entrar (botão preenchido) no lugar do avatar. O clique
            // repassa pro link nativo → o overlay de login do XF abre igual ao do tema; sem overlay,
            // navega pro /login/ normalmente.
            const reg = registerHref();
            if (reg) {
                const r = document.createElement('a');
                r.className = 'smg-tb-authlink';
                r.href = safeHref(reg);
                r.textContent = i18n('Register');
                wireAuthClick(r, 'register');
                actions.appendChild(r);
            }
            const lg = document.createElement('a');
            lg.className = 'smg-tb-loginbtn';
            lg.href = safeHref(loginHref());
            lg.innerHTML = '<span class="smg-tb-ico">' + ICONS.login + '</span><span>' + i18n('Log in') + '</span>';
            wireAuthClick(lg, 'login');
            actions.appendChild(lg);
        }

        inner.appendChild(actions);
        bar.appendChild(inner);
        wrap.appendChild(bar);
        // prepend (não append): no desktop é fixed (tanto faz), mas no mobile a barra é position:static
        // e precisa ser o 1º elemento do body pra renderizar no TOPO (senão cai pro fim da página)
        document.body.insertBefore(wrap, document.body.firstChild);
        document.documentElement.classList.add('smg-topbar-on');
        if (!loggedIn) document.documentElement.classList.add('smg-guest');   // marcador estático p/ o CSS (esconde o que é de membro)

        // ---- abrir/fechar popovers (megamenu: hover troca, clique abre/fecha) ----
        const wirePopovers = () => {
            let openIdx = -1;
            const place = (btn, pop) => {
                const br = btn.getBoundingClientRect();
                const center = (br.left - bar.getBoundingClientRect().left) + br.width / 2;   // centro do botão relativo à barra
                const left = center - pop.offsetWidth / 2;                                     // centraliza o pop sob o item
                const maxLeft = bar.offsetWidth - pop.offsetWidth - 8;
                pop.style.right = 'auto';
                pop.style.left = Math.max(8, Math.min(left, maxLeft)) + 'px';
            };
            const closeAll = () => {
                popovers.forEach(p => { p.pop.classList.remove('open'); p.btn.classList.remove('active'); });
                openIdx = -1;
            };
            closeAllPops = closeAll;
            const openAt = i => {
                closeAll();
                const p = popovers[i];
                p.btn.classList.add('active');
                if (p.right) { // alinha pela direita do botão
                    // medido contra o WRAP, não contra a janela: com o painel lateral aberto o wrap
                    // termina antes da borda da tela (right: var(--smg-ald-w)), e usar innerWidth
                    // jogava o dropdown a uma largura de rail de distância do avatar.
                    const r = p.btn.getBoundingClientRect();
                    const w = wrap.getBoundingClientRect();
                    p.pop.style.left = 'auto';
                    p.pop.style.right = Math.max(8, Math.round(w.right - r.right)) + 'px';
                } else place(p.btn, p.pop);
                p.pop.classList.add('open');
                if (p.onOpen) p.onOpen();
                openIdx = i;
            };
            // hover: os menus "hoveráveis" (Discover) abrem ao passar o mouse e fecham ao sair
            // (com ponte pelo próprio popover). Alerts/Conta (noSwitch) seguem só no clique.
            let hoverTimer = null;
            const cancelHoverClose = () => { if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; } };
            const scheduleHoverClose = i => { cancelHoverClose(); hoverTimer = setTimeout(() => { if (openIdx === i) closeAll(); }, 180); };
            popovers.forEach((p, i) => {
                p.btn.addEventListener('click', e => { e.stopPropagation(); cancelHoverClose(); if (openIdx === i) closeAll(); else openAt(i); });
                if (!p.noSwitch) {
                    p.btn.addEventListener('mouseenter', () => { cancelHoverClose(); openAt(i); });
                    p.btn.addEventListener('mouseleave', () => scheduleHoverClose(i));
                    p.pop.addEventListener('mouseenter', cancelHoverClose);
                    p.pop.addEventListener('mouseleave', () => scheduleHoverClose(i));
                }
            });
            document.addEventListener('click', e => { if (!wrap.contains(e.target)) closeAll(); });
            document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
        };
        wirePopovers();

        // ---- docked no topo → flutuante após rolar ----
        const syncDock = () => { wrap.classList.toggle('floating', window.scrollY > 40); };
        onScrollRaf(syncDock);
        syncDock();

        // ---- mobile: bottom sheets (sino/Discover/User) — concern separada do topbar desktop ----
        const buildMobileSheets = () => {
            // o sino da navbar inferior abre um SHEET com os alertas — só de MEMBRO (visitante não tem
            // alerta nem conta; os botões correspondentes da navbar nem existem pra ele)
            let aSheet = null;
            if (loggedIn) {
                aSheet = document.createElement('div');
                aSheet.id = 'smg-alerts-sheet';
                aSheet.className = 'smg-sheet';
                aSheet.innerHTML =
                    '<div class="smg-csheet-panel">' +
                        '<div class="smg-sheet-grip"></div>' +
                        '<div class="smg-csheet-head"><span>Alerts</span><a href="/account/alerts">See all</a></div>' +
                        '<div class="smg-csheet-body smg-tb-listbody"><div class="smg-tb-loading">Loading…</div></div>' +
                    '</div>';
                document.body.appendChild(aSheet);
                const aSheetState = { loaded: false, busy: false };
                const openAlertsSheet = () => {
                    smgSheetOpen(aSheet);
                    refreshXfList(aSheet.querySelector('.smg-csheet-body'), '/account/alerts-popup', true, aSheetState);   // sempre busca o que há de novo
                };
                const navBell = document.getElementById('smg-nav-alerts');
                if (navBell) navBell.addEventListener('click', e => {
                    if (!window.matchMedia('(max-width: 600px)').matches) return;
                    e.preventDefault();
                    // o sino continua o mesmo; o que ele abre é o RAIL em tela cheia (abas, filtro,
                    // marcar tudo, scroll infinito) — o mesmo do desktop. Sem o rail (feature off),
                    // cai no bottom sheet antigo, que só traz a lista curta do popup nativo.
                    if (FEATURES.alertsDock && typeof openAlertsDock === 'function') openAlertsDock('alerts', false);
                    else openAlertsSheet();
                });
            }

            // helper genérico de bottom sheet (Discover / User)
            // full = dialog de TELA CHEIA (sem alça, sem cantos): pra listas longas o drawer só
            // mostrava metade e ainda disputava o arrasto com a rolagem da própria lista.
            const makeSheet = (id, title, bodyHTML, full) => {
                const s = document.createElement('div');
                s.id = id;
                s.className = 'smg-sheet' + (full ? ' smg-sheet--full' : '');
                s.innerHTML =
                    '<div class="smg-csheet-panel">' +
                        (full ? '' : '<div class="smg-sheet-grip"></div>') +
                        '<div class="smg-csheet-head"><span>' + title + '</span></div>' +
                        '<div class="smg-csheet-body">' + bodyHTML + '</div>' +
                    '</div>';
                document.body.appendChild(s);
                return s;
            };
            const sheetRow = it => it.divider
                ? '<div class="smg-tb-popdiv"></div>'
                : '<a class="smg-tb-poprow" href="' + safeHref(it.href) + '">' +
                    '<span class="smg-tb-popico">' + it.icon + '</span>' +
                    '<span class="smg-tb-poptext"><span class="smg-tb-poptitle">' + it.label + '</span>' +
                    (it.desc ? '<span class="smg-tb-popdesc">' + it.desc + '</span>' : '') + '</span>' +
                '</a>';
            const wireSheet = (btnId, sheet) => {
                const b = document.getElementById(btnId);
                if (b) b.addEventListener('click', e => { e.preventDefault(); smgSheetOpen(sheet); });
            };

            // Discover → sheet com os mesmos itens do dropdown da topbar
            const dSheet = makeSheet('smg-discover-sheet', 'Discover',
                cleanDiv(discoverItems.filter(it => it.divider || it.href)).map(sheetRow).join(''));
            wireSheet('smg-nav-discover', dSheet);

            // User → sheet com as seções do menu de conta (Salvos mora aqui agora). Visitante: em vez de
            // um sheet vazio, o botão da navbar leva direto pro login.
            let uSheet = null;
            if (loggedIn) {
                const uBody = accSections.map(sec => sec.filter(it => it.href)).filter(sec => sec.length)
                        .map(sec => sec.map(sheetRow).join('')).join('<div class="smg-tb-popdiv"></div>');
                uSheet = makeSheet('smg-user-sheet', 'Account', uBody, true);
                // CABEÇALHO: identidade de verdade — avatar + nome, clicáveis, levando ao perfil.
                // Antes eram duas linhas mortas dizendo a mesma coisa ("Conta" como título e o nome
                // solto embaixo), nenhuma delas clicável, ocupando o topo da tela sem função. O X
                // fecha: em tela cheia não há scrim pra tocar nem alça pra arrastar.
                const uHead = uSheet.querySelector('.smg-csheet-head');
                uHead.textContent = '';
                uHead.classList.add('smg-csheet-head--id');
                const xBtn = document.createElement('button');
                xBtn.type = 'button'; xBtn.className = 'smg-csheet-x'; xBtn.setAttribute('aria-label', i18n('Close'));
                xBtn.innerHTML = ICONS.close;
                xBtn.addEventListener('click', () => smgSheetClose(uSheet));
                const idBox = document.createElement('a');
                idBox.className = 'smg-csheet-id';
                idBox.href = safeHref(accSections[0][0].href);
                const navAv = document.querySelector('.p-navgroup-link--user .avatar') || document.querySelector('.p-account .avatar');
                if (navAv) idBox.appendChild(navAv.cloneNode(true));
                const idTxt = document.createElement('span'); idTxt.className = 'smg-csheet-idtxt';
                const nameEl = document.createElement('strong'); nameEl.textContent = uname;      // textContent: nome do user nunca vira HTML
                const subEl = document.createElement('span'); subEl.textContent = i18n('Profile');
                idTxt.append(nameEl, subEl);
                idBox.appendChild(idTxt);
                uHead.append(idBox, xBtn);   // ordem do DOM = ordem visual: identidade à esquerda, X à direita
                wireSheet('smg-nav-user', uSheet);
            }

            return { aSheet, dSheet, uSheet };
        };
        const { aSheet, dSheet, uSheet } = buildMobileSheets();
        // scrim + arrastar pra baixo + Esc nos sheets de alerts / profile / discover
        [aSheet, uSheet, dSheet].filter(Boolean).forEach(s => wireSheetClose(s, s.querySelector('.smg-csheet-panel')));

        // traduz TODA a UI da topbar + sheets mobile (Discover/User/Alertas) de uma vez.
        // só casa chaves em inglês → nome de usuário e conteúdo nativo passam intactos.
        [wrap, aSheet, dSheet, uSheet].filter(Boolean).forEach(i18nDom);
        syncMobileThreadbar();
    }

    // NOTICES COLLAPSE: transforma os avisos do XenForo (.notices--block) em um collapse moderno
    // com cabeçalho "Avisos", lista interna expansível e suporte a dismiss (individual e total).
    function setupHeaderNotices() {
        if (document.querySelector('.smg-notices-collapse')) return;
        const blocks = document.querySelectorAll('.notices--block');
        if (!blocks.length) return;

        const seen = new Set();
        const notices = [];
        let firstBlock = null;

        blocks.forEach(b => {
            if (!firstBlock) firstBlock = b;
            b.querySelectorAll('.notice').forEach(n => {
                const c = n.querySelector('.notice-content') || n;
                const txt = (c.textContent || '').trim();
                if (!txt) return;

                const dismissEl = n.querySelector('.notice-dismiss, a[href*="dismiss-notice"], .js-noticeDismiss');
                const dismissHref = dismissEl ? (dismissEl.getAttribute('href') || '') : '';

                let id = n.getAttribute('data-notice-id');
                if (!id && dismissHref) {
                    const m = dismissHref.match(/notice_id=(\d+)/);
                    if (m) id = m[1];
                }
                if (!id) id = txt.slice(0, 60);
                id = String(id);

                if (seen.has(id)) return;
                seen.add(id);

                const clone = c.cloneNode(true);
                clone.querySelectorAll('.notice-dismiss, a[href*="dismiss-notice"], .js-noticeDismiss').forEach(el => el.remove());

                let imgHtml = '';
                const imgInClone = clone.querySelector('.notice-image');
                if (imgInClone) {
                    imgHtml = imgInClone.innerHTML.trim();
                    imgInClone.remove();
                } else {
                    const imgEl = n.querySelector('.notice-image img, .notice-image, img.smilie');
                    if (imgEl) imgHtml = imgEl.outerHTML;
                }

                notices.push({
                    id,
                    content: clone,
                    dismissHref,
                    imgHtml
                });
            });
            b.style.setProperty('display', 'none', 'important');
        });

        if (!notices.length || !firstBlock) return;

        const allIds = notices.map(n => n.id).sort().join(',');
        if (gmGet('smg-notices-dismissed-ids', '') === allIds) return;

        const collapse = document.createElement('div');
        collapse.className = 'smg-notices-collapse';

        const isExpanded = gmGet('smg-notices-expanded', '0') === '1';
        if (isExpanded) collapse.classList.add('is-expanded');

        const head = document.createElement('div');
        head.className = 'smg-notices-collapse-head';
        head.setAttribute('role', 'button');
        head.setAttribute('tabindex', '0');
        head.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');

        const left = document.createElement('div');
        left.className = 'smg-notices-collapse-left';
        left.innerHTML =
            '<span class="smg-notices-collapse-ico">' + ICONS.megaphone + '</span>' +
            '<span class="smg-notices-collapse-title">' + i18n('Notices') + '</span>' +
            '<span class="smg-notices-collapse-badge">' + notices.length + '</span>';

        const right = document.createElement('div');
        right.className = 'smg-notices-collapse-right';
        right.innerHTML =
            '<span class="smg-notices-collapse-chevron" aria-hidden="true">' + ICONS.hide + '</span>' +
            '<button type="button" class="smg-notices-collapse-dismiss" title="' + i18n('Dismiss all') + '" aria-label="' + i18n('Dismiss all') + '">' +
                ICONS.close +
            '</button>';

        head.appendChild(left);
        head.appendChild(right);
        collapse.appendChild(head);

        const body = document.createElement('div');
        body.className = 'smg-notices-collapse-body';
        if (!isExpanded) body.hidden = true;

        const sendDismissReq = href => {
            if (!href) return;
            try {
                if (typeof GM_xmlhttpRequest === 'function') {
                    GM_xmlhttpRequest({ method: 'GET', url: href });
                } else if (typeof fetch === 'function') {
                    fetch(href, { credentials: 'same-origin' }).catch(() => {});
                }
            } catch {}
        };

        notices.forEach(n => {
            const item = document.createElement('div');
            item.className = 'smg-notices-collapse-item';
            item.setAttribute('data-notice-id', n.id);

            if (n.imgHtml) {
                const emote = document.createElement('span');
                emote.className = 'smg-notices-item-emote';
                emote.innerHTML = n.imgHtml;
                item.appendChild(emote);
            }

            const cDiv = document.createElement('div');
            cDiv.className = 'smg-notices-item-content';
            cDiv.appendChild(n.content);
            item.appendChild(cDiv);

            if (n.dismissHref) {
                const btnDismiss = document.createElement('button');
                btnDismiss.type = 'button';
                btnDismiss.className = 'smg-notices-item-dismiss';
                btnDismiss.title = i18n('Dismiss');
                btnDismiss.setAttribute('aria-label', i18n('Dismiss'));
                btnDismiss.innerHTML = ICONS.close;

                btnDismiss.addEventListener('click', e => {
                    e.stopPropagation();
                    e.preventDefault();
                    sendDismissReq(n.dismissHref);
                    item.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                    item.style.opacity = '0';
                    item.style.transform = 'translateX(10px)';
                    setTimeout(() => {
                        if (item.parentNode) item.remove();
                        const remaining = body.querySelectorAll('.smg-notices-collapse-item');
                        if (!remaining.length) {
                            gmSet('smg-notices-dismissed-ids', allIds);
                            collapse.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
                            collapse.style.opacity = '0';
                            collapse.style.transform = 'translateY(-6px)';
                            setTimeout(() => {
                                if (collapse.parentNode) collapse.remove();
                            }, 250);
                        } else {
                            const badge = collapse.querySelector('.smg-notices-collapse-badge');
                            if (badge) badge.textContent = remaining.length;
                        }
                    }, 200);
                });
                item.appendChild(btnDismiss);
            }

            body.appendChild(item);
        });

        collapse.appendChild(body);

        // Ações do Cabeçalho: expandir / recolher
        const toggle = () => {
            const willExpand = body.hidden;
            body.hidden = !willExpand;
            collapse.classList.toggle('is-expanded', willExpand);
            head.setAttribute('aria-expanded', willExpand ? 'true' : 'false');
            gmSet('smg-notices-expanded', willExpand ? '1' : '0');
        };

        head.addEventListener('click', e => {
            if (e.target.closest('.smg-notices-collapse-dismiss')) return;
            toggle();
        });

        head.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                if (e.target.closest('.smg-notices-collapse-dismiss')) return;
                e.preventDefault();
                toggle();
            }
        });

        // Botão de dispensar tudo
        const dismissAllBtn = collapse.querySelector('.smg-notices-collapse-dismiss');
        if (dismissAllBtn) {
            dismissAllBtn.addEventListener('click', e => {
                e.stopPropagation();
                e.preventDefault();
                gmSet('smg-notices-dismissed-ids', allIds);
                notices.forEach(n => {
                    if (n.dismissHref) sendDismissReq(n.dismissHref);
                });
                collapse.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
                collapse.style.opacity = '0';
                collapse.style.transform = 'translateY(-6px)';
                setTimeout(() => {
                    if (collapse.parentNode) collapse.remove();
                }, 250);
            });
        }

        if (firstBlock && firstBlock.parentNode) {
            firstBlock.parentNode.insertBefore(collapse, firstBlock);
        }
    }
    if (typeof window !== 'undefined') {
        window.setupHeaderNotices = setupHeaderNotices;
    }
