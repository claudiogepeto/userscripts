    // =========================================================
    // FEATURE: alertas "Limpo" — tira ruído do HTML nativo do XF
    // nativo: "<autor> postou no/replied to <chips> <título>. Podem haver/There may be… · hora · marcar-lido"
    // limpo : 3 linhas → (1) tags coloridas  (2) nome do tópico  (3) publicado por @autor · data + botão marcar-lido
    // Simp usa <span class="label label--x">, SMG usa <span class="prefix prefixx"> — pegamos os dois.
    // estratégia: extrai as peças nativas (move = preserva handlers AJAX) e remonta o .contentRow-main do zero.
    // =========================================================

    // marca um alerta como lido NO SERVIDOR (XF) e atualiza o estado local + o contador do sino
    function markAlertRead(li, btn, href) {
        if (!href || btn.dataset.busy) return;
        btn.dataset.busy = '1';
        const csrf = document.documentElement.getAttribute('data-csrf')
            || (document.querySelector('input[name="_xfToken"]') || {}).value || '';
        // XF valida CSRF de POST pelo CORPO (form-urlencoded), não pela query — replicamos o XF.ajax
        fetch(href, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            body: '_xfToken=' + encodeURIComponent(csrf) + '&_xfResponseType=json&_xfWithData=1'
        })
            .then(r => r.text().then(txt => ({ ok: r.ok, txt })))
            .then(({ ok, txt }) => {
                let j = null; try { j = JSON.parse(txt); } catch (e) {}
                if (!ok || (j && (j.errors || j.errorHtml))) throw new Error('xf');   // falhou no servidor → NÃO marca local
                if (li && li.classList) { li.classList.remove('is-unread'); li.classList.add('smg-al-old'); }   // some o dot + esmaece na hora (virou lida)
                btn.remove();
                const st = (typeof aldockState !== 'undefined' && aldockState && aldockState.alerts) ? aldockState.alerts : null;
                if (st && typeof st.serverUnread === 'number') st.serverUnread = Math.max(0, st.serverUnread - 1);
                if (typeof aldockSyncCount === 'function') aldockSyncCount();
                const nav = document.querySelector('.p-navgroup-link--alerts');   // baixa o contador → o observer sincroniza topbar/dock
                if (nav) {
                    // parte do que ESTÁ NA TELA (atributo do tema ou o nosso valor guardado): em tema que
                    // não popula o data-badge, ler só o atributo dava sempre 0 e marcar lido não descia nada.
                    const base = nav.hasAttribute('data-badge')
                        ? (parseInt(nav.getAttribute('data-badge') || '0', 10) || 0)
                        : (parseInt(gmGet('smg-alerts-count', '0'), 10) || 0);
                    const n = Math.max(0, base - 1);
                    gmSet('smg-alerts-count', String(n));
                    if (n > 0) nav.setAttribute('data-badge', String(n)); else nav.removeAttribute('data-badge');
                }
            })
            .catch(() => { delete btn.dataset.busy; });   // falhou → permite tentar de novo
    }
    // recontagem do badge a partir da lista RECÉM-BUSCADA: sem isso o sino ficava com o número
    // do último F5 (o data-badge só vem no HTML da página), e reabrir o painel trazia alerta novo
    // com contador velho. O observer do 15-listing propaga daqui pra topbar e pro dock.
    function syncAlertBadgeFrom(root) {
        if (!root || !root.querySelectorAll) return;
        const rows = root.querySelectorAll('li.alert');
        if (!rows.length) return;
        const unread = root.querySelectorAll('li.alert.is-unread').length;
        const nav = document.querySelector('.p-navgroup-link--alerts');
        const cur = nav ? (parseInt(nav.getAttribute('data-badge') || '0', 10) || 0) : (parseInt(gmGet('smg-alerts-count', '0'), 10) || 0);
        const st = (typeof aldockState !== 'undefined' && aldockState && aldockState.alerts) ? aldockState.alerts : null;
        const hasMore = st ? Boolean(st.next) : false;
        const n = hasMore ? Math.max(cur, unread) : unread;
        gmSet('smg-alerts-count', String(n));
        if (nav) {
            if (n > 0) nav.setAttribute('data-badge', String(n)); else nav.removeAttribute('data-badge');
        }
    }
    // nome da thread contido no link do alerta, sem os chips de prefixo que moram dentro dele.
    // Clona pra não mexer no nó vivo (o resto do cleanAlertRow ainda vai usá-lo).
    function alertTitleText(el) {
        const c = el.cloneNode(true);
        c.querySelectorAll('.label, .prefix, .labelLink, [class*="label--"], [class*="prefix"]').forEach(n => n.remove());
        return (c.textContent || '').replace(/ /g, ' ').trim();
    }

    // troca o glifo do alerta pela FOTO da thread, se o cache já souber a URL (nunca busca nada).
    // A imagem quebrada (host fora / thumb apagada) volta pro glifo — nada de buraco na lista.
    function paintAlertThumb(ico) {
        if (!ico || ico.dataset.smgThumbed) return false;
        const url = thumbCacheGet(ico.dataset.smgThread || '', ico.dataset.smgTitle || '');
        if (!url) return false;
        ico.dataset.smgThumbed = '1';
        const glyph = ico.innerHTML;
        const img = document.createElement('img');
        img.src = url; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
        img.addEventListener('error', () => {
            ico.classList.remove('smg-al-icon--thumb');
            ico.innerHTML = glyph;
            delete ico.dataset.smgThumbed;   // outra listagem pode trazer uma URL melhor depois
        }, { once: true });
        ico.innerHTML = '';
        ico.classList.add('smg-al-icon--thumb');
        ico.appendChild(img);
        return true;
    }
    // re-pinta as linhas que ficaram sem foto — chamado quando o cache ganha thumbs novas
    // (ex.: a aba Seguindo carregou e trouxe as fotos das threads que você acompanha)
    function repaintAlertThumbs(root) {
        if (!root) return 0;
        let n = 0;
        root.querySelectorAll('.smg-al-icon:not([data-smg-thumbed])').forEach(ico => { if (paintAlertThumb(ico)) n++; });
        return n;
    }

    function cleanAlertRow(main) {
        if (!main || main.dataset.smgAlert) return;
        // título = nome do tópico. Em alerta de COMENTÁRIO o .fauxBlockLink-blockLink é a palavra "commented"
        // e o tópico vem num <a href="/threads/…"> separado → preferimos o link de thread quando existe.
        const title = main.querySelector('a[href*="/threads/"]') || main.querySelector('.fauxBlockLink-blockLink');
        main.dataset.smgAlert = '1';                                    // marca ANTES do guard → alerta sem tópico não é re-escaneado a cada refresh
        if (!title) return;                                             // tipo de alerta sem tópico: deixa nativo (só i18n)
        const isComment = !!main.querySelector('a[href*="/comments/"]');
        // ícone de tipo à ESQUERDA (comentário vs publicação) — diferencia rápido, no lugar da foto removida.
        // Se a THREAD já tiver thumb no cache (colhida de alguma listagem — ver thumbCacheGet), a foto dela
        // entra no lugar do glifo. Zero request extra: ou já sabemos a URL, ou fica o ícone.
        const row = main.parentElement;
        if (row && row.classList.contains('contentRow') && !row.querySelector(':scope > .smg-al-icon')) {
            const ico = document.createElement('span');
            ico.className = 'smg-al-icon ' + (isComment ? 'smg-al-icon--comment' : 'smg-al-icon--post');
            ico.innerHTML = isComment ? ICONS.comment : ICONS.newPost;
            // referência da thread p/ a foto. O alerta do XF linka pro POST (/posts/N) e não cita a
            // thread em lugar nenhum — quando não há link de /threads/, o TÍTULO é o único elo com a
            // listagem (thumbCacheGet casa por ele). Guardado ANTES da limpeza mexer no texto.
            const tLink = row.querySelector('a[href*="/threads/"]') || main.querySelector('a[href*="/threads/"]') || title;
            ico.dataset.smgThread = tLink ? (tLink.getAttribute('href') || '') : '';   // alvo do repaint quando o cache esquentar
            // SEM os chips: no alerta os prefixos vivem DENTRO do link do título (separados por &nbsp;),
            // então o texto cru sairia "Request OnlyFans daryna_cutie" e nunca casaria com o
            // "daryna_cutie" da listagem, onde os chips são irmãos do link.
            ico.dataset.smgTitle = alertTitleText(title);
            paintAlertThumb(ico);
            row.insertBefore(ico, row.firstChild);
        }

        const minor = main.querySelector('.contentRow-minor');
        const chips = Array.from(main.querySelectorAll('.label, .prefix'));   // Simp = .label · SMG = .prefix
        const userLink = main.querySelector('a.username, a[href*="/members/"]');

        // linha 3 — tags: move os chips nativos (com a cor da plataforma) pra fora do título
        const tags = document.createElement('div');
        tags.className = 'smg-al-tags';
        chips.forEach(c => { if (c !== title && !c.contains(title)) { c.classList.add('smg-al-chip'); tags.appendChild(c); } });

        // título: chips já saíram → textContent é só o NOME; separadores ( | / ) viram vírgula
        title.textContent = (title.textContent || '')
            .replace(/[|/]/g, ',').replace(/\s*,\s*/g, ', ')
            .replace(/(?:,\s*)+$/, '').replace(/^\s*,\s*/, '')
            .replace(/\s{2,}/g, ' ').trim();
        title.classList.add('smg-al-title');

        // linha 2 — apenas hora · ✕
        const by = document.createElement('div');
        by.className = 'smg-al-by';
        let markHref = null;
        if (minor) {
            const timeEl = minor.querySelector('time');
            if (timeEl) { timeEl.classList.add('smg-al-time'); by.appendChild(timeEl); }
            const markRead = Array.from(minor.querySelectorAll('a')).find(a => {
                const href = a.getAttribute('href') || '', cls = a.className || '', txt = (a.textContent || '').trim();
                return /alert-toggle|\/alert\/\d+\/(?:un)?read|mark-read|mark_read/i.test(href)
                    || /alert--mark|alertToggle|alertToggler/i.test(cls)
                    || /^(?:mark read|mark unread|marcar como lido|marcar como não lida|unread|não lida)$/i.test(txt);
            });
            markHref = markRead && markRead.getAttribute('href');
        }

        // remonta do zero: (1) tags · (2) nome · (3) publicado-por+data — verbo, boilerplate e foto não voltam
        main.textContent = '';
        if (tags.children.length) main.appendChild(tags);
        main.appendChild(title);
        if (by.childNodes.length) main.appendChild(by);

        // botão "marcar como lido" SEMPRE visível nas não-lidas — persiste no servidor + atualiza o estado
        const li = main.closest('li.alert') || main.closest('li');
        if (markHref && li && li.classList && li.classList.contains('is-unread')) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'smg-al-read';
            btn.title = i18n('Mark read');
            btn.setAttribute('aria-label', i18n('Mark read'));
            const lbl = document.createElement('span');     // texto "Marcar como lido" — só aparece no mobile (CSS)
            lbl.className = 'smg-al-read-txt';
            lbl.textContent = i18n('Mark read');
            btn.appendChild(lbl);
            btn.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation(); markAlertRead(li, btn, markHref); });
            main.appendChild(btn);
        }
    }

    // agrupa em "Novas" (não lidas) e "Anteriores" (lidas) — estilo Facebook, com cabeçalho de seção
    function groupAlerts(list) {
        const ol = (list.matches && list.matches('ol, ul')) ? list
                 : (list.querySelector && list.querySelector('ol.listPlain, ul.listPlain, ol, ul'));
        if (!ol || ol.dataset.smgGrouped) return;
        const rows = Array.from(ol.children).filter(li => li.querySelector && li.querySelector('.contentRow-main'));
        if (!rows.length) return;
        ol.dataset.smgGrouped = '1';
        const unread = rows.filter(li => li.classList && li.classList.contains('is-unread'));
        const read = rows.filter(li => unread.indexOf(li) < 0);
        const mkHeader = txt => { const li = document.createElement('li'); li.className = 'smg-al-section'; li.textContent = txt; return li; };
        ol.textContent = '';   // limpa rows + separador nativo + espaços em branco
        if (unread.length) { ol.appendChild(mkHeader(IS_PT ? 'Não lidas' : 'Unread')); unread.forEach(li => ol.appendChild(li)); }
        if (read.length) { ol.appendChild(mkHeader(IS_PT ? 'Lidas' : 'Read')); read.forEach(li => { li.classList.add('smg-al-old'); ol.appendChild(li); }); }
    }

    function cleanAlertList(list) {
        if (!list) return;
        const fresh = [];
        try {
            if (list.classList) list.classList.add('smg-alert-clean');
            list.querySelectorAll('.contentRow-main:not([data-smg-alert])').forEach(main => {
                try { cleanAlertRow(main); fresh.push(main); } catch (e) {}
            });
            groupAlerts(list);
        } catch (e) {}
        // O primeiro passe traduz a árvore nativa já existente. Depois disso, só linhas novas precisam
        // de tradução; revarrer centenas de alertas a cada atualização do contador era trabalho repetido.
        if (!list.dataset.smgI18nDone) {
            i18nDom(list);
            list.dataset.smgI18nDone = '1';
        } else {
            fresh.forEach(row => i18nDom(row));
        }
    }

    if (location.pathname.includes('/account/alerts')) {
        setTimeout(() => {
            if (typeof openAlertsDock === 'function') openAlertsDock('alerts', false);
        }, 50);
    }

    if (typeof window !== 'undefined' && window.__TEST_MODE__) {
        window.cleanAlertRow = cleanAlertRow;
        window.paintAlertThumb = paintAlertThumb;
        window.repaintAlertThumbs = repaintAlertThumbs;
        window.syncAlertBadgeFrom = syncAlertBadgeFrom;
        window.markAlertRead = markAlertRead;
        window.__alertsExports = {
            cleanAlertRow,
            paintAlertThumb,
            repaintAlertThumbs,
            syncAlertBadgeFrom,
            markAlertRead
        };
    }
