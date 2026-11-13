    // thread/17a-filterbar.js
    // Owns: the filter bar (pager, sort, actions), thread header, sticky sync, follow button and THE thread card (decorateThreadCard).
    // Exposes: buildThreadHeader, unifyThreadHeader, createStickySync, threadFollowButton, decorateThreadCard, smgPopHost, smgPagerShow.
    // Depends on: core/06-helpers, feed/06b-feed-db, feed/22-feed-sync, following/17b-watched-list.
    // =========================================================
    // BARRA ÚNICA SEGMENTADA (filter bar) — SMG · thread + fórum
    // Um componente só (pager · ordenar · ações). Espelha os links do XF e
    // PROXY-CLICA os botões nativos (que ficam escondidos no DOM, igual a dock faz):
    // watch/mark-read/translate/jump-to-new/menu seguem com o comportamento AJAX do XF.
    // O .block-outer nativo é escondido (fonte de dados pro scroll infinito + page-jump).
    // Mapa: smgBarBtn/smgPopHost/smgJumpHost (blocos) · smgPagerGroup/smgSortGroup/smgPrimaryActions/smgMoreButton (grupos) · buildFilterBars (monta tudo).
    // =========================================================
    const SMG_ICO = {   // ⚠️ ícones SÓ do filtro-bar (paths crus p/ svgIcon()). check saiu → usar ICONS.shareDone (era idêntico)
        globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/>',
        eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
        eyeOff: '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>',
        thumb: '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
    };

    // tooltip estilo dock, mas position:FIXED (escapa o overflow:hidden da barra). um elemento só, reposicionado.
    let smgTipEl = null;
    function smgShowTip(btn, text) {
        if (!smgTipEl) { smgTipEl = document.createElement('div'); smgTipEl.className = 'smg-bar-tip'; document.body.appendChild(smgTipEl); }
        smgTipEl.textContent = text;
        const r = btn.getBoundingClientRect();
        smgTipEl.style.left = Math.round(r.left + r.width / 2) + 'px';
        smgTipEl.style.top = Math.round(r.top - 8) + 'px';
        smgTipEl.classList.add('show');
    }
    function smgHideTip() { if (smgTipEl) smgTipEl.classList.remove('show'); }

    function smgBarBtn({ icon, label, title, href, current, onClick, cls, disabled }) {
        title = i18n(title); label = i18n(label);
        const isLink = href && !disabled;
        const el = document.createElement(isLink ? 'a' : 'button');
        if (isLink) {
            el.href = href;
        } else {
            el.type = 'button';
            if (disabled) {
                el.disabled = true;
                el.setAttribute('disabled', '');
            }
        }
        el.className = 'smg-bar-btn' + (icon && !label ? ' smg-bar-btn--icon' : '') + (current ? ' smg-bar-btn--current' : '') + (cls ? ' ' + cls : '') + (disabled ? ' disabled' : '');
        if (title) { el.title = title; el.setAttribute('aria-label', title); }
        el.innerHTML = (icon ? '<span class="smg-bar-ic">' + icon + '</span>' : '') + (label ? '<span>' + label + '</span>' : '');
        if (onClick && !disabled) el.addEventListener('click', onClick);
        // ícones (sem label visível) ganham o tooltip custom no hover (lê el.title VIVO → watch atualiza)
        if (title && icon && !label && !disabled) {
            el.addEventListener('mouseenter', () => smgShowTip(el, el.title || title));
            el.addEventListener('mouseleave', smgHideTip);
            el.addEventListener('click', smgHideTip);
        }
        return el;
    }

    // popover ancorado num botão (abre no clique, fecha clicando fora). pop é position:fixed →
    // posiciono acima do botão na hora de abrir (escapa o overflow:hidden da barra).
    function smgPopHost(triggerBtn, popEl) {
        const host = document.createElement('span');
        host.className = 'smg-bar-pophost';
        // O POPOVER MORA NO <body>, não dentro da barra: o header tem clip-path (é ele que faz o fundo
        // ir de ponta a ponta sem criar scroll lateral) e clip em ancestral RECORTA descendentes, mesmo
        // com position:fixed — o popover aparecia cortado logo abaixo da barra.
        document.body.appendChild(popEl);
        const place = () => {
            const r = triggerBtn.getBoundingClientRect();
            popEl.style.left = Math.round(r.left + r.width / 2) + 'px';
            // ABAIXO do botão: a barra vive no topo da tela (header sticky), então abrir pra cima
            // jogava o popover pra fora da viewport. Se não couber embaixo, aí sim abre pra cima.
            const espacoAbaixo = window.innerHeight - r.bottom;
            const alturaPop = popEl.offsetHeight || 56;
            if (espacoAbaixo >= alturaPop + 12) {
                popEl.style.top = Math.round(r.bottom + 8) + 'px';
                popEl.style.transform = 'translate(-50%, 0)';
            } else {
                popEl.style.top = Math.round(r.top - 8) + 'px';
                popEl.style.transform = 'translate(-50%, -100%)';
            }
        };
        triggerBtn.addEventListener('click', e => {
            e.preventDefault(); e.stopPropagation();
            const abrir = !popEl.classList.contains('open');
            document.querySelectorAll('.smg-bar-pop.open').forEach(p => p.classList.remove('open'));   // um por vez
            host.classList.toggle('open', abrir);
            popEl.classList.toggle('open', abrir);
            if (abrir) { place(); setTimeout(() => { const i = popEl.querySelector('input'); if (i) { i.focus(); i.select(); } }, 0); }
        });
        // fechar clicando fora / Esc / reposicionar no scroll: registro único (smgPopover). O popover não é
        // descendente do host, então os dois entram na checagem; quando a barra sai com a página
        // (soft-nav), o popover que mora no <body> sai junto.
        smgPopover({
            inside: [host, popEl], place,
            isOpen: () => popEl.classList.contains('open'),
            close: () => { host.classList.remove('open'); popEl.classList.remove('open'); },
            alive: () => host.isConnected,
            onDispose: () => popEl.remove(),
        });
        host.append(triggerBtn);
        return host;
    }

    // "ir pra página" (template /page-%page%): input + Go
    function smgJumpHost(tpl, max, label, curNum, cls) {
        const btn = smgBarBtn({ label, title: 'Go to page', cls });
        const pop = document.createElement('div'); pop.className = 'smg-bar-pop smg-bar-pop--jump';
        const input = document.createElement('input'); input.type = 'number'; input.min = '1';
        input.value = curNum || '1';
        if (max) { input.max = String(max); input.placeholder = '1–' + max; }
        const go = document.createElement('button'); go.type = 'button'; go.className = 'smg-bar-go'; go.textContent = i18n('Go');
        const nav = () => {
            const n = parseInt(input.value, 10);
            if (!n || n < 1 || !tpl || (max && n > +max)) return;
            let url = (n === 1) ? tpl.replace(/\/page-%page%/, '/') : tpl.replace('%page%', String(n));
            if (location.search && url.indexOf('?') < 0 && /[?&]order=/.test(location.search)) url += location.search;
            window.location.href = url;
        };
        go.addEventListener('click', nav);
        input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); nav(); } });
        pop.append(input, go);
        return smgPopHost(btn, pop);
    }

    function smgPageUrlTpl(wrap) {
        const row = wrap.querySelector('[data-page-url]');
        if (row) return row.getAttribute('data-page-url');                 // .../page-%page%
        const any = wrap.querySelector('.pageNav-page > a[href*="/page-"]');
        return any ? any.getAttribute('href').replace(/\/page-\d+/, '/page-%page%') : null;
    }
    function smgCurPage(wrap) {
        const cur = wrap.querySelector('.pageNav-page--current');
        if (cur) return (cur.textContent || '').trim();
        const simp = wrap.querySelector('.pageNavSimple-el--current');
        const m = simp && (simp.textContent || '').match(/(\d+)\s*of/i);
        return m ? m[1] : '1';
    }

    // GRUPO 1 — pager (seletor circular compacto de 5 botões: first · prev · goto · next · last)
    function smgPagerGroup(wrap) {
        const main = wrap.querySelector('.pageNav-main');
        if (!main && !wrap.querySelector('.pageNav') && !wrap.querySelector('.pageNavSimple')) return null;
        let tpl = smgPageUrlTpl(wrap);
        const prev = wrap.querySelector('.pageNav-jump--prev, .pageNavSimple-el--prev');
        const next = wrap.querySelector('.pageNav-jump--next, .pageNavSimple-el--next');
        const pjInput = wrap.querySelector('.js-pageJumpPage, input[type="number"]');
        let max = pjInput ? pjInput.getAttribute('max') : null;
        if (!max) {
            let mVal = 0;
            wrap.querySelectorAll('a[href*="/page-"]').forEach(a => {
                const m = (a.getAttribute('href') || '').match(/\/page-(\d+)/);
                if (m) mVal = Math.max(mVal, parseInt(m[1], 10));
            });
            const simple = wrap.querySelector('.pageNavSimple-el--current')?.textContent.match(/(\d+)\s*of\s*(\d+)/i);
            if (simple) mVal = Math.max(mVal, parseInt(simple[2], 10) || 0);
            if (mVal > 0) max = String(mVal);
        }
        const cur = smgCurPage(wrap);
        const curNum = parseInt(cur, 10) || 1;
        let maxNum = parseInt(max, 10) || curNum;

        if (!tpl && maxNum > 1) {
            const anyHref = wrap.querySelector('a[href*="/page-"]')?.getAttribute('href');
            if (anyHref) tpl = anyHref.replace(/\/page-\d+/, '/page-%page%');
        }

        if (maxNum <= 1 && !tpl) return null;
        if (maxNum < curNum) maxNum = curNum;
        return smgPagerBuild(tpl, curNum, maxNum, prev ? prev.getAttribute('href') : null, next ? next.getAttribute('href') : null);
    }

    // href da página n pelo template do próprio XF (/page-%page%, com a query da ordenação): a página 1 é a base
    function smgPageHref(tpl, n) {
        if (!tpl) return null;
        return n <= 1 ? tpl.replace(/\/page-%page%/, '/').replace('%page%', '1') : tpl.replace('%page%', String(n));
    }

    // monta o grupo do pager. prevHref/nextHref: os links nativos da página do servidor (quando existem);
    // sem eles, sai tudo do template — é o caso da página que o scroll infinito trouxe (smgPagerShow).
    function smgPagerBuild(tpl, curNum, maxNum, prevHref, nextHref) {
        const g = document.createElement('div');
        g.className = 'smg-bar-group smg-bar-pager';
        if (tpl) { g.dataset.tpl = tpl; g.dataset.max = String(maxNum); }
        if (!prevHref && curNum > 1) prevHref = smgPageHref(tpl, curNum - 1);
        if (!nextHref && curNum < maxNum) nextHref = smgPageHref(tpl, curNum + 1);

        g.appendChild(smgBarBtn({ icon: ICONS.pageFirst, title: 'First page', href: smgPageHref(tpl, 1), disabled: curNum <= 1, cls: 'smg-bar-pager-btn' }));
        g.appendChild(smgBarBtn({ icon: ICONS.pagePrev, title: 'Prev page', href: prevHref, disabled: curNum <= 1 || !prevHref, cls: 'smg-bar-pager-btn' }));

        // goto: número da página atual compacto
        if (tpl) {
            const jump = smgJumpHost(tpl, maxNum, `${curNum} / ${maxNum}`, curNum, 'smg-bar-cur smg-bar-pager-goto');
            jump.classList.add('smg-bar-curhost');
            g.appendChild(jump);
        } else {
            const compact = document.createElement('span');
            compact.className = 'smg-bar-btn smg-bar-cur smg-bar-pager-goto';
            compact.textContent = `${curNum} / ${maxNum}`;
            g.appendChild(compact);
        }

        g.appendChild(smgBarBtn({ icon: ICONS.pageNext, title: 'Next page', href: nextHref, disabled: curNum >= maxNum || !nextHref, cls: 'smg-bar-pager-btn' }));
        g.appendChild(smgBarBtn({ icon: ICONS.pageLast, title: 'Last page', href: tpl ? tpl.replace('%page%', String(maxNum)) : null, disabled: curNum >= maxNum, cls: 'smg-bar-pager-btn' }));
        return g;
    }

    // a página VISÍVEL mudou (scroll infinito): toda barra de pager mostra a mesma página que a dock e a URL,
    // com os links do template do XF — antes a barra ficava na página do servidor e divergia da dock
    function smgPagerShow(n) {
        document.querySelectorAll('.smg-bar-pager[data-tpl]').forEach(g => {
            const max = Math.max(n, parseInt(g.dataset.max, 10) || n);
            g.replaceWith(smgPagerBuild(g.dataset.tpl, n, max, null, null));
        });
    }

    // GRUPO 2 — ordenar (data ⇄ reações): dois <a> reais, ativo = knob branco. só thread.
    function smgSortGroup(bo) {
        const wrap = bo.querySelector('.tabs--standalone');
        if (!wrap) return null;
        // acha os 2 links por HREF (independe de idioma): reação tem ?order=reaction_score; data é a sem order=
        let dateLink = null, reactLink = null;
        wrap.querySelectorAll('.tabs-tab').forEach(t => {
            const h = t.getAttribute('href') || '';
            if (/order=reaction/i.test(h)) reactLink = t;
            else if (!/order=/i.test(h)) dateLink = t;
        });
        if (!dateLink || !reactLink) return null;
        const onReactions = /[?&]order=reaction/i.test(location.search) || reactLink.classList.contains('is-active');
        // TOGGLE ÚNICO (igual a dock): ícone de ORDENAÇÃO (⇅) + critério atual; clicar leva pro outro
        const curLabel = onReactions ? i18n('Reactions') : i18n('Date');
        const g = document.createElement('div'); g.className = 'smg-bar-group';
        const btn = smgBarBtn({
            icon: ICONS.sort,
            label: curLabel,
            href: (onReactions ? dateLink : reactLink).getAttribute('href'),
            cls: 'smg-bar-sorttoggle',
        });
        // tooltip (botão tem label, então o auto-tooltip não pega → adiciono manual)
        const tip = onReactions
            ? (IS_PT ? 'Ordenação atual: por reações. Clique para ordenar por data' : 'Current sort: by reactions. Click to sort by date')
            : (IS_PT ? 'Ordenação atual: por data. Clique para ordenar por reações' : 'Current sort: by date. Click to sort by reactions');
        btn.title = tip; btn.setAttribute('aria-label', tip);
        btn.addEventListener('mouseenter', () => smgShowTip(btn, tip));
        btn.addEventListener('mouseleave', smgHideTip);
        btn.addEventListener('click', smgHideTip);
        g.appendChild(btn);
        return g;
    }

    // GRUPO 3 — ações (ícones que PROXY-CLICAM o nativo escondido)
    function smgProxyConfirm(nativeEl) { // watch/mark-read: clica + auto-confirma o overlay
        nativeEl.click();
        waitForElement('.overlay button[type="submit"].button--primary, .overlay .button--cta', 4000).then(c => c && c.click());
    }

    // GRUPO 3 — ações PRIMÁRIAS (ícones que PROXY-CLICAM o nativo): ir-pra-nova · seguir · marcar lido · traduzir
    function smgPrimaryActions(bo) {
        const g = document.createElement('div'); g.className = 'smg-bar-group';
        let n = 0;
        const jumpNew = bo.querySelector('[data-xf-click="scroll-to"]');
        if (jumpNew) { g.appendChild(smgBarBtn({ icon: ICONS.postDown, title: 'Go to new', onClick: () => jumpNew.click() })); n++; }
        const watch = bo.querySelector('[data-sk-watch]');
        if (watch) {
            // ICONS.watch/unwatch JÁ são <svg> completos → usar direto. Estado por idioma-neutro + destaque.
            const b = smgBarBtn({ icon: ICONS.watch, title: 'Watch' });
            const paint = on => {
                b.querySelector('.smg-bar-ic').innerHTML = on ? ICONS.unwatch : ICONS.watch;
                b.title = on ? 'Unwatch' : 'Watch';
                b.classList.toggle('smg-bar-btn--on', on);   // destaca quando seguindo
            };
            paint(smgIsWatching(watch));
            b.addEventListener('click', () => {
                const wasWatching = smgIsWatching(watch);
                paint(!wasWatching);                // REATIVO: vira na hora (otimista)
                smgProxyConfirm(watch);
                setTimeout(() => {
                    const nowWatching = smgIsWatching(watch);
                    paint(nowWatching);  // re-sincroniza
                    if (nowWatching && !wasWatching) safe(ingestCurrentThreadPageIfFollowed);
                    else if (!nowWatching && wasWatching) safe(feedRemoveCurrentThread);
                }, 1500);
            });
            g.appendChild(b); n++;
        }
        const markRead = bo.querySelector('a[href*="mark-read"]');
        if (markRead) { g.appendChild(smgBarBtn({ icon: ICONS.shareDone, title: 'Mark read', onClick: () => smgProxyConfirm(markRead) })); n++; }
        const tr = bo.querySelector('.smgTranslator-globalBtn');
        if (tr) { g.appendChild(smgBarBtn({ icon: svgIcon(SMG_ICO.globe), title: 'Translate', onClick: () => tr.click() })); n++; }
        // HIDE/SHOW DISCUSSIONS (addon do site): vira ícone na barra (proxy-click no nativo escondido), junto do translate.
        // ESPELHA o nativo: ícone eye/eye-slash + texto + contagem vêm dele (sem assumir semântica/idioma). bo.querySelector
        // primeiro (1 nativo por block-outer, igual translate); fallback no document se vier solto. Guard 1×/elemento:
        // 2 barras (topo+rodapé) compartilhando UM nativo → 1 proxy só (evita dessincronizar); natives por-barra → 1 cada.
        const disc = bo.querySelector('.smg-discussion-toggle') || document.querySelector('.smg-discussion-toggle');
        if (disc && !disc.dataset.smgDiscProxied) {
            disc.dataset.smgDiscProxied = '1';
            const txtEl = disc.querySelector('.smg-toggle-text');
            const cntEl = disc.querySelector('.smg-discussion-count');
            const b = smgBarBtn({ icon: svgIcon(SMG_ICO.eyeOff), title: 'Hide Discussions' });
            const paint = () => {
                const slash = !!disc.querySelector('.fa-eye-slash');   // espelha o ícone nativo (eye-slash = mostrando → clicar esconde)
                b.querySelector('.smg-bar-ic').innerHTML = svgIcon(slash ? SMG_ICO.eyeOff : SMG_ICO.eye);
                const txt = (txtEl && txtEl.textContent.trim()) || i18n('Discussions');
                const cnt = (cntEl && cntEl.textContent.trim()) || '';
                const lbl = txt + (cnt ? ' ' + cnt : '');
                b.title = lbl; b.setAttribute('aria-label', lbl);   // tooltip = texto+contagem vivos do nativo
                b.classList.toggle('smg-bar-btn--on', !slash);   // destaca quando as discussões estão ESCONDIDAS
            };
            paint();
            b.addEventListener('click', () => { disc.click(); setTimeout(paint, 60); });   // proxy-click + re-sincroniza
            g.appendChild(b); n++;   // o nativo é escondido por CSS (.smg-discussion-toggle-container, em 05) — robusto a múltiplas instâncias + re-render do addon
        }
        return n ? g : null;
    }

    // GRUPO 4 — "Mais" (•••): menu nativo + botões diretos não-primários (ex.: Bump), deduplicados.
    // Cada linha PROXY-CLICA o nativo (preserva overlay/menu do XF) → nada some.
    function smgMoreButton(bo) {
        const moreTrigger = bo.querySelector('.menuTrigger, button[data-xf-click="menu"]');
        const moreMenu = moreTrigger && (moreTrigger.parentElement?.querySelector('.menu .menu-content')
            || (moreTrigger.closest('.buttonGroup-buttonWrapper') || {}).querySelector?.('.menu-content'));
        const items = [], seen = new Set();
        const push = (el, label) => {
            const key = (label || '').toLowerCase().replace(/\s+/g, ' ').trim();
            if (!key || seen.has(key)) return; seen.add(key);
            items.push({ label: (label || '').trim(), el });
        };
        if (moreMenu) moreMenu.querySelectorAll('.menu-linkRow').forEach(r => push(r, r.textContent));
        bo.querySelectorAll('.buttonGroup .button--link, .buttonGroup a.button, .buttonGroup button.button').forEach(b => {
            if (b.classList.contains('menuTrigger') || b.hasAttribute('data-sk-watch') || b.classList.contains('smgTranslator-globalBtn')
                || b.getAttribute('data-xf-click') === 'scroll-to' || (b.getAttribute('href') || '').indexOf('mark-read') >= 0) return;
            push(b, (b.querySelector('.button-text') || b).textContent);
        });
        if (!items.length) return null;
        const g = document.createElement('div'); g.className = 'smg-bar-group';
        const btn = smgBarBtn({ label: '⋯', title: 'More' });
        const pop = document.createElement('div'); pop.className = 'smg-bar-pop';
        items.forEach(it => {
            const row = document.createElement('button'); row.type = 'button'; row.className = 'smg-bar-poprow'; row.textContent = it.label;
            row.addEventListener('click', e => { e.stopPropagation(); btn.closest('.smg-bar-pophost').classList.remove('open'); it.el.click(); });
            pop.appendChild(row);
        });
        g.appendChild(smgPopHost(btn, pop));
        return g;
    }

    function smgDivider() { const d = document.createElement('span'); d.className = 'smg-bar-div'; return d; }

    // XenForo themes render the tag glyph in two shapes: inside `.tagList` or as a
    // sibling of it in the description list. Normalize both to one visual row so
    // the glyph cannot become a lonely line above the badges on narrow screens.
    function groupThreadTags(desc) {
        if (!desc || desc.dataset.smgTagsGrouped) return;
        const tagList = desc.querySelector('.tagList');
        const tagIcon = desc.querySelector('.tagList-icon');
        if (!tagList && !tagIcon) return;

        const row = document.createElement('div');
        row.className = 'smg-thead-tags-row';
        const directChild = node => {
            let current = node;
            while (current && current.parentNode !== desc) current = current.parentNode;
            return current;
        };
        const grouped = new Set();
        [tagIcon, tagList].filter(Boolean).map(directChild).filter(Boolean).forEach(node => {
            if (!grouped.has(node)) { grouped.add(node); row.appendChild(node); }
        });

        // Keep any non-tag text/nodes that a theme placed in the description,
        // while making the grouped row the sole layout owner of the tags.
        Array.from(desc.childNodes).forEach(node => {
            if (node !== row && !grouped.has(node) && (node.nodeType !== 3 || node.textContent.trim())) row.appendChild(node);
        });
        desc.replaceChildren(row);
        desc.dataset.smgTagsGrouped = '1';
    }

    // HEADER DA THREAD (.p-body-header): move a thumb para cima do título e das tags, e remove
    // autor + data da descrição. O header fica estático; só a faixa compacta de título é fixa.
    function buildThreadHeader() {
        if (!document.documentElement.classList.contains('smg-thread')) return;   // só em thread (fórum tem .p-body-header também)
        const header = document.querySelector('.p-body-header');
        if (!header) return;
        // The filter bar can arrive after the server-rendered header. Keep retrying
        // the unification without rebuilding the actions already mounted on it.
        if (header.dataset.smgThead) {
            if (!header.dataset.smgUnified) unifyThreadHeader(header);
            return;
        }
        header.setAttribute('data-smg-thead', '1');
        // tira autor + data da .p-description (mantém as tags)
        const desc = header.querySelector('.p-description');
        if (desc) {
            const u = desc.querySelector('a.username'); const ul = u && u.closest('li'); if (ul) ul.remove();
            const t = desc.querySelector('time'); const tl = t && t.closest('li'); if (tl) tl.remove();
            groupThreadTags(desc);
        }
        unifyThreadHeader(header);
    }

    /* THREAD HEADER — the title, image and tags stay in normal document flow. A separate fixed
     * title strip appears after the header passes the topbar, so scroll state cannot change layout. */
    function unifyThreadHeader(header) {
        if (!header || header.dataset.smgUnified) return;
        header.dataset.smgUnified = '1';

        const title = header.querySelector('.p-title');
        if (title) {
            const tv = title.querySelector('.p-title-value');
            let badges = [];
            if (tv) {
                // Coleta badges/labels/prefixes para mover para uma linha própria acima do título
                const badgeNodes = Array.from(tv.children).filter(child =>
                    child.matches('.label, .prefix, [class*="label--"], a[class*="prefix"]') ||
                    child.querySelector('.label, .prefix, [class*="label--"]')
                );
                badges = badgeNodes;

                // Extrai o texto do título limpando todo e qualquer espaço ou nós residuais
                const clone = tv.cloneNode(true);
                clone.querySelectorAll('.label, .prefix, [class*="label--"], [class*="prefix--"], a[class*="prefix"], .smg-notices, .p-title-pageAction').forEach(n => n.remove());
                let cleanTitle = (clone.textContent || '')
                    .replace(/[\s\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/g, ' ')
                    .trim();
                if (/^(forum list|lista de fóruns|forums|fóruns)$/i.test(cleanTitle)) {
                    const generic = /^(forum list|lista de fóruns|forums|fóruns)$/i;
                    const pageBit = /^(page|página)\s+\d+/i;
                    const meta = document.querySelector('meta[property="og:title"], meta[name="twitter:title"]');
                    const metaTitle = meta ? (meta.getAttribute('content') || '').trim() : '';
                    const fromMeta = metaTitle.split(/\s*[|\-–—]\s*/).map(s => s.trim()).find(p => p && !generic.test(p) && !pageBit.test(p));
                    const parts = (document.title || '').split(/\s*[|\-–—]\s*/).map(s => s.trim()).filter(Boolean);
                    const site = parts.length > 1 ? parts[parts.length - 1] : '';
                    const specific = fromMeta || parts.find(p => p && p !== site && !generic.test(p) && !pageBit.test(p));
                    if (specific) cleanTitle = specific;
                }

                tv.replaceChildren();
                if (cleanTitle) {
                    const sp = document.createElement('span');
                    sp.className = 'smg-thead-title-text';
                    sp.textContent = cleanTitle;
                    tv.appendChild(sp);
                }
            }
            const pageTitleText = (tv ? tv.textContent : '').replace(/\s+/g, ' ').trim();
            const thumbUrl = (() => {
                let u = (thumbCacheGet(location.href, pageTitleText) || '');
                if (!u) {
                    const holder = document.querySelector('.dcThumbnail img, .dtt-thread-thumbnail img');
                    if (holder) {
                        const bg = (holder.style.backgroundImage || '').match(/url\(\s*["']?([^"')]+)/i);
                        u = (bg && bg[1]) || holder.getAttribute('data-src') || holder.getAttribute('src') || '';
                    }
                }
                if (!u) {
                    const firstPostImg = document.querySelector('.message-inner .message-body img.bbImage, .message-inner .message-body img[src*="attachment"], .message-inner .message-body img:not(.smg-emoji):not(.smilie):not(.avatar)');
                    if (firstPostImg) {
                        u = firstPostImg.getAttribute('data-src') || firstPostImg.getAttribute('data-url') || firstPostImg.getAttribute('src') || '';
                    }
                }
                if (u && /^data:/i.test(u)) u = '';
                return u;
            })();

            const hero = document.createElement('div');
            hero.className = 'smg-thead-hero';

            if (thumbUrl) {
                const thumbSpan = document.createElement('span');
                thumbSpan.className = 'smg-thead-thumb';
                const thumbImg = document.createElement('img');
                thumbImg.src = thumbUrl;
                thumbImg.alt = '';
                thumbImg.onerror = () => { thumbSpan.remove(); };
                thumbSpan.appendChild(thumbImg);
                hero.appendChild(thumbSpan);
                thumbCachePut(location.href, thumbUrl, pageTitleText);
            }

            const info = document.createElement('div');
            info.className = 'smg-thead-info';

            if (badges.length > 0) {
                const badgesRow = document.createElement('div');
                badgesRow.className = 'smg-thead-badges-row';
                badges.forEach(b => badgesRow.appendChild(b));
                info.appendChild(badgesRow);
            }

            const line = document.createElement('div');
            line.className = 'smg-thead-titleline';
            if (tv) line.appendChild(tv);
            info.appendChild(line);

            // Tags da thread: inseridas em .smg-thead-info ao lado da imagem e do título
            const desc = header.querySelector('.p-description');
            if (desc) {
                const tagsBox = document.createElement('div');
                tagsBox.className = 'smg-thead-tags smg-thead-tags-bar';
                tagsBox.appendChild(desc);
                info.appendChild(tagsBox);
            }

            hero.appendChild(info);
            title.insertBefore(hero, title.firstChild);

            const oldTagsBar = header.parentNode ? header.parentNode.querySelector('.smg-thead-tags-bar') : null;
            if (oldTagsBar && !header.contains(oldTagsBar)) {
                oldTagsBar.remove();
            }
        }

        header.classList.add('smg-thead-unified');

        let sentinel = Array.from(header.parentNode.children).find(node => node.classList.contains('smg-thead-sentinel'));
        if (!sentinel) {
            sentinel = document.createElement('div');
            sentinel.className = 'smg-thead-sentinel';
        }
        header.parentNode.insertBefore(sentinel, header);

        const stickyTitle = createStickyTitle(header);
        createStickySync(header, sentinel, stickyTitle);
        header.dataset.smgStructureRecorded = '1';
    }

    function createStickyTitle(header) {
        const source = header.querySelector('.smg-thead-title-text, .p-title-value');
        if (!source) return null;
        const sticky = document.createElement('div');
        sticky.className = 'smg-thead-sticky';
        sticky.setAttribute('aria-hidden', 'true');
        const inner = document.createElement('div');
        inner.className = 'smg-thead-sticky-inner';
        const title = document.createElement('span');
        title.className = 'smg-thead-sticky-title';
        title.textContent = (source.textContent || '').replace(/\s+/g, ' ').trim();
        inner.appendChild(title);
        sticky.appendChild(inner);
        document.body.appendChild(sticky);
        return sticky;
    }

    // disposers das stickies vivas: o soft-nav troca o header, e os listeners de scroll/resize do header
    // velho ficavam no window pra sempre (um par a mais por página navegada).
    const stickySyncDisposers = new Set();
    function disposeStickySyncs() {
        stickySyncDisposers.forEach(off => off());
        stickySyncDisposers.clear();
    }

    function createStickySync(header, sentinel, stickyTitle) {
        let topOff = null;
        let ticking = false;

        const setVisible = on => {
            if (stickyTitle && stickyTitle.classList.contains('is-visible') !== on) stickyTitle.classList.toggle('is-visible', on);
        };
        const measure = () => {
            if (!header.isConnected || !stickyTitle) return;
            const top = parseFloat(getComputedStyle(stickyTitle).top);
            topOff = Number.isFinite(top) ? top : (window.innerWidth <= 800 ? 48 : 72);
        };

        const syncStuck = () => {
            if (!header.isConnected || !stickyTitle) return;
            if (window.matchMedia && window.matchMedia('(max-width: 600px)').matches) {
                setVisible(false);
                topOff = null;
                return;
            }
            if (topOff == null) measure();

            const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
            const y = sentinel ? sentinel.getBoundingClientRect().top : 100;
            const visible = stickyTitle.classList.contains('is-visible');

            if (!visible) {
                if (scrollY > 40 && y <= topOff - 4) setVisible(true);
            } else {
                if (scrollY <= 20 || y >= topOff + 48) setVisible(false);
            }
        };

        const onScroll = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(() => {
                    ticking = false;
                    syncStuck();
                });
            }
        };

        const onResize = () => { topOff = null; measure(); syncStuck(); };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });
        const dispose = () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
            if (stickyTitle) stickyTitle.remove();
            stickySyncDisposers.delete(dispose);
        };
        stickySyncDisposers.add(dispose);
        syncStuck();
        setTimeout(() => { measure(); syncStuck(); }, 150);
        setTimeout(() => { measure(); syncStuck(); }, 400);
        return syncStuck;
    }

    // botão seguir/deixar de seguir sobre a thumb de uma linha de listagem (fórum e /watched/threads: o MESMO botão).
    // opts: isFollowed, threadIdsUnwatch (unwatch pelo form da lista de seguidos), onUnfollowed.
    function threadFollowButton(row, opts) {
        const thumb = row.querySelector('.structItem-cell--icon') || row.querySelector('.dcThumbnail') || row.firstElementChild;
        if (!thumb) return;
        thumb.style.setProperty('position', 'relative', 'important');
        const titleA = row.querySelector('.structItem-title a[href*="/threads/"]') || row.querySelector('.structItem-title a');
        const path = titleA ? canonicalThreadPath(titleA.getAttribute('href')) : '';
        const btn = document.createElement('button');
        btn.type = 'button';
        const paint = following => {
            btn.className = 'smg-thread-unwatch-btn' + (following ? ' is-following' : '');
            btn.title = following ? (IS_PT ? 'Deixar de seguir' : 'Unwatch') : (IS_PT ? 'Seguir tópico' : 'Watch thread');
            btn.innerHTML = following ? ICONS.unwatch : (ICONS.watch || ICONS.star);
        };
        paint(!!opts.isFollowed);
        const post = (url, body) => fetch(url, { method: 'POST', body: body, credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } }).catch(() => {});
        btn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            const token = document.querySelector('input[name="_xfToken"]')?.value || (window.XF && window.XF.config && window.XF.config.csrf) || '';
            const title = (titleA?.textContent || '').trim();
            if (btn.classList.contains('is-following')) {
                paint(false);
                const cb = row.querySelector('input[name="thread_ids[]"]');
                const threadId = opts.threadIdsUnwatch ? (cb ? cb.value : ((path.match(/\.(\d+)\/?$/) || [])[1])) : '';
                if (threadId) {
                    const fd = new FormData();
                    fd.append('_xfToken', token);
                    fd.append('state', 'delete');
                    fd.append('thread_ids[]', threadId);
                    post('/watched/threads/update', fd);
                } else if (path) {
                    post(path + 'watch', new URLSearchParams({ _xfToken: token, stop: '1' }));
                }
                if (path) {
                    dbFollowedDelete(path);
                    followedSet.delete(path);
                }
                toast((IS_PT ? 'Deixou de seguir: ' : 'Unfollowed: ') + (title || (IS_PT ? 'Tópico' : 'Thread')));
                if (opts.onUnfollowed) opts.onUnfollowed();
            } else {
                paint(true);
                if (path) {
                    post(path + 'watch', new URLSearchParams({ _xfToken: token, email_subscribe: '0' }));
                    // registro COMPLETO (mesmo formato da lista de seguidos), tempos em segundos
                    const now = Math.floor(Date.now() / 1000);
                    dbFollowedGet(path).then(prev => {
                        const rec = followedRecordFromRow(row, path, prev, now);
                        if (!rec.updated_at) rec.updated_at = now;
                        return dbFollowedUpsert(rec);
                    });
                    followedSet.add(path);
                }
                toast((IS_PT ? 'Seguindo: ' : 'Following: ') + title);
            }
        });
        thumb.appendChild(btn);
    }

    let cardTagsResizeObserver = null;
    function updateCardTags(track) {
        if (!track || !track.isConnected) return;
        const tags = track.closest('.smg-card-tags');
        if (!tags) return;
        const maxScroll = track.scrollWidth - track.clientWidth;
        const overflowing = maxScroll > 1;
        const showPrev = overflowing && track.scrollLeft > 1;
        const showNext = overflowing && track.scrollLeft < maxScroll - 1;
        const prev = tags.querySelector('.smg-card-tags-prev');
        const next = tags.querySelector('.smg-card-tags-next');
        tags.classList.toggle('has-prev', showPrev);
        tags.classList.toggle('has-next', showNext);
        if (prev) prev.hidden = !showPrev;
        if (next) next.hidden = !showNext;
    }

    function buildCardTags(title) {
        const candidates = Array.from(title.querySelectorAll('.label, .prefix, .labelLink, .label-append'));
        const items = [];
        candidates.forEach(node => {
            const direct = node;
            let child = direct;
            while (child.parentElement && child.parentElement !== title) child = child.parentElement;
            if (child.parentElement === title && !items.includes(child)) items.push(child);
        });
        const labels = items.filter(node => !node.matches('.label-append'));
        if (!labels.length) return;

        items.filter(node => node.matches('.label-append')).forEach(node => node.remove());
        const tags = document.createElement('div');
        tags.className = 'smg-card-tags';
        const prev = document.createElement('button');
        prev.type = 'button';
        prev.className = 'smg-card-tags-prev';
        prev.setAttribute('aria-label', IS_PT ? 'Rolar etiquetas para a esquerda' : 'Scroll tags left');
        prev.innerHTML = ICONS.pagePrev;
        const track = document.createElement('div');
        track.className = 'smg-card-tags-track';
        const next = document.createElement('button');
        next.type = 'button';
        next.className = 'smg-card-tags-next';
        next.setAttribute('aria-label', IS_PT ? 'Rolar etiquetas para a direita' : 'Scroll tags right');
        next.innerHTML = ICONS.pageNext;
        labels.forEach(node => track.appendChild(node));
        tags.append(prev, track, next);

        const scroll = direction => event => {
            event.preventDefault();
            event.stopPropagation();
            track.scrollBy({ left: Math.max(1, Math.round(track.clientWidth * 0.8)) * direction, behavior: 'smooth' });
            updateCardTags(track);
        };
        prev.addEventListener('click', scroll(-1));
        next.addEventListener('click', scroll(1));
        track.addEventListener('scroll', () => updateCardTags(track), { passive: true });
        if (typeof ResizeObserver !== 'undefined') {
            if (!cardTagsResizeObserver) {
                cardTagsResizeObserver = trackObserver(new ResizeObserver(entries => entries.forEach(entry => updateCardTags(entry.target))));
            }
            cardTagsResizeObserver.observe(track);
        }
        const titleLink = Array.from(title.children).find(node => node.matches('a:not(.label):not(.labelLink)'));
        title.insertBefore(tags, titleLink || title.firstChild);
        updateCardTags(track);
    }

    function decorateThreadCard(row) {
        if (!row || row.dataset.smgDecorated) return;
        row.dataset.smgDecorated = '1';
        const title = row.querySelector('.structItem-title');
        const thumb = row.querySelector('.structItem-cell--icon:not(.structItem-cell--iconEnd)');
        if (row.classList.contains('is-unread') && thumb && !thumb.querySelector('.smg-card-new')) {
            const badge = document.createElement('span');
            badge.className = 'smg-card-new';
            badge.textContent = IS_PT ? 'NOVO' : 'NEW';
            thumb.appendChild(badge);
        }
        if (title && !title.querySelector('.smg-card-tags')) buildCardTags(title);
        const createdEl = row.querySelector('.structItem-startDate time');
        const latestEl = row.querySelector('.structItem-cell--latest time, .structItem-latestDate time');

        let datesRow = row.querySelector('.smg-card-dates');
        if (!datesRow && (createdEl || latestEl)) {
            datesRow = document.createElement('div');
            datesRow.className = 'smg-card-dates';
            const mainCell = row.querySelector('.structItem-cell--main');
            const minor = row.querySelector('.structItem-minor');
            if (minor) minor.style.setProperty('display', 'none', 'important');

            const crText = createdEl ? (createdEl.textContent || '').trim() : '';
            const upText = latestEl ? (latestEl.textContent || '').trim() : '';

            if (upText || crText) {
                datesRow.innerHTML = `
                    ${upText ? `<span class="smg-card-date-item"><span>${IS_PT ? 'Último update às' : 'Updated at'}</span> <span class="smg-card-date-val">${upText}</span></span>` : ''}
                    ${crText ? `<span class="smg-card-date-item"><span>${IS_PT ? 'Criado em' : 'Created'}</span> <span class="smg-card-date-val">${crText}</span></span>` : ''}
                `;
                if (mainCell) mainCell.appendChild(datesRow);
            }
        }

        const pageJump = row.querySelector('.structItem-pageJump');
        const mainCell = row.querySelector('.structItem-cell--main');
        if (pageJump && mainCell && pageJump.parentElement !== mainCell) {
            mainCell.appendChild(pageJump);
        }

        const lastJumpA = row.querySelector('.structItem-pageJump a:last-child');
        const lastPageHref = lastJumpA ? lastJumpA.getAttribute('href') : null;
        if (lastPageHref) {
            const titleA = row.querySelector('.structItem-title a[href*="/threads/"]');
            if (titleA) titleA.href = lastPageHref;
            const thumbA = row.querySelector('.structItem-cell--icon a, .dcThumbnail');
            if (thumbA) thumbA.href = lastPageHref;
        }

        if (!location.pathname.includes('/watched/threads') && !row.querySelector('.smg-thread-unwatch-btn')) {
            const titleA = row.querySelector('.structItem-title a[href*="/threads/"]') || row.querySelector('.structItem-title a');
            const path = titleA ? canonicalThreadPath(titleA.getAttribute('href')) : '';
            const isWatchedNative = row.classList.contains('is-watched') || !!row.querySelector('.structItem-status--watched');
            threadFollowButton(row, { isFollowed: isWatchedNative || (!!path && followedSet.has(path)) });
        }
        row.dataset.smgDecoratedReady = '1';
    }
