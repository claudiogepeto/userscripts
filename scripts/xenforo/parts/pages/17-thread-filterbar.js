    // =========================================================
    // BARRA ÚNICA SEGMENTADA (filter bar) — SMG · thread + fórum
    // Um componente só (pager · ordenar · ações). Espelha os links do XF e
    // PROXY-CLICA os botões nativos (que ficam escondidos no DOM, igual a dock faz):
    // watch/mark-read/translate/jump-to-new/menu seguem com o comportamento AJAX do XF.
    // O .block-outer nativo é escondido (fonte de dados pro scroll infinito + page-jump).
    // Mapa: smgBarBtn/smgPopHost/smgJumpHost (blocos) · smgPagerGroup/smgSortGroup/smgPrimaryActions/smgMoreButton (grupos) · buildFilterBars (monta tudo) · fetchXfList (AJAX da listagem).
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
        // fechar clicando fora: o popover não é mais descendente do host, então entra na checagem
        document.addEventListener('click', e => {
            if (host.contains(e.target) || popEl.contains(e.target)) return;
            host.classList.remove('open'); popEl.classList.remove('open');
        });
        window.addEventListener('scroll', () => { if (popEl.classList.contains('open')) place(); }, { passive: true });
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

        const g = document.createElement('div');
        g.className = 'smg-bar-group smg-bar-pager';

        const firstHref = tpl ? tpl.replace(/\/page-%page%/, '/').replace('%page%', '1') : null;
        const prevHref = prev ? prev.getAttribute('href') : (tpl && curNum > 1 ? (curNum - 1 === 1 ? tpl.replace(/\/page-%page%/, '/') : tpl.replace('%page%', String(curNum - 1))) : null);
        const nextHref = next ? next.getAttribute('href') : (tpl && curNum < maxNum ? tpl.replace('%page%', String(curNum + 1)) : null);
        const lastHref = tpl ? tpl.replace('%page%', String(maxNum)) : null;

        // Botão 1: pageFirst
        g.appendChild(smgBarBtn({
            icon: ICONS.pageFirst,
            title: 'First page',
            href: firstHref,
            disabled: curNum <= 1,
            cls: 'smg-bar-pager-btn'
        }));

        // Botão 2: pagePrev
        g.appendChild(smgBarBtn({
            icon: ICONS.pagePrev,
            title: 'Prev page',
            href: prevHref,
            disabled: curNum <= 1 || (!prev && !prevHref),
            cls: 'smg-bar-pager-btn'
        }));

        // Botão 3: Goto (número da página atual compacto)
        if (tpl) {
            const curLabel = `${curNum} / ${maxNum}`;
            const jump = smgJumpHost(tpl, maxNum, curLabel, curNum, 'smg-bar-cur smg-bar-pager-goto');
            jump.classList.add('smg-bar-curhost');
            g.appendChild(jump);
        } else {
            const compact = document.createElement('span');
            compact.className = 'smg-bar-btn smg-bar-cur smg-bar-pager-goto';
            compact.textContent = `${curNum} / ${maxNum}`;
            g.appendChild(compact);
        }

        // Botão 4: pageNext
        g.appendChild(smgBarBtn({
            icon: ICONS.pageNext,
            title: 'Next page',
            href: nextHref,
            disabled: curNum >= maxNum || (!next && !nextHref),
            cls: 'smg-bar-pager-btn'
        }));

        // Botão 5: pageLast
        g.appendChild(smgBarBtn({
            icon: ICONS.pageLast,
            title: 'Last page',
            href: lastHref,
            disabled: curNum >= maxNum,
            cls: 'smg-bar-pager-btn'
        }));

        return g;
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
        const g = document.createElement('div'); g.className = 'smg-bar-group smg-bar-sort';
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
        const g = document.createElement('div'); g.className = 'smg-bar-group smg-bar-actions';
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
                    if (nowWatching && !wasWatching) safe(feedAddCurrentThread);
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
        const g = document.createElement('div'); g.className = 'smg-bar-group smg-bar-more';
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

    // HEADER DA THREAD (.p-body-header): linha de ações (feed · galeria · download, maiores) ACIMA do título,
    // e remove autor + data da linha de descrição (mantém as tags). Roda 1× no boot (header é server-render, estático).
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
        // linha de ações no topo do header (feed/galeria/download), com navegação própria (página 1)
        const bar = document.createElement('div'); bar.className = 'smg-thead-actions';
        const mk = (icon, title, label, onClick) => {
            const b = document.createElement('button'); b.type = 'button'; b.className = 'smg-thead-btn';
            b.title = i18n(title); b.setAttribute('aria-label', i18n(title));
            b.innerHTML = '<span class="smg-thead-ic">' + icon + '</span>';
            const l = document.createElement('span'); l.className = 'smg-thead-lbl'; l.textContent = i18n(label);   // visível só no mobile (CSS)
            b.appendChild(l);
            if (onClick) b.addEventListener('click', onClick);
            b.addEventListener('mouseenter', () => smgShowTip(b, b.title));   // reusa o tooltip fixed da barra
            b.addEventListener('mouseleave', smgHideTip); b.addEventListener('click', smgHideTip);
            return b;
        };
        // ícones outline limpos (sem depender de fill): feed = play · galeria = grade · download = seta. Label só no mobile.
        if (FEATURES.mediaFeed) bar.appendChild(mk(svgIcon('<polygon points="6 3 20 12 6 21 6 3"/>'), 'Feed mode', 'Feed', () => openMediaFeed(null, null, { fromStart: true })));
        bar.appendChild(mk(ICONS.gallery, 'Gallery', 'Gallery', () => openGallery()));
        if (FEATURES.mediaDownload) { const d = mk(ICONS.download, 'Download media', 'Download', null); d.addEventListener('click', () => openDownloadModal()); bar.appendChild(d); }
        // DESKTOP: na linha do título, fixo à direita (dentro do .p-title → coluna centralizada).
        // MOBILE: a barra DESCE pra depois das tags → ordem unificada título → tags → ações
        // (antes a barra full-width entrava no meio e as tags ficavam órfãs DEPOIS dos botões).
        // matchMedia move o nó só ao cruzar o breakpoint (1 listener, zero custo no scroll/resize comum).
        const title = header.querySelector('.p-title');
        // Com o header unificado, as ações ficam SEMPRE na linha de controles (junto do paginador),
        // inclusive no celular — antes elas desciam pra depois das tags, o que criava um terceiro bloco
        // solto e empurrava o conteúdo pra baixo.
        const placeBar = () => {
            if (title) title.appendChild(bar);
            else header.insertBefore(bar, header.firstChild);
        };
        placeBar();
        unifyThreadHeader(header);
    }

    /* SINGLE THREAD HEADER — the thread top used to be three loose blocks: title+actions, tags,
     * and the pagination/sort bar (which lived in .block-outer above the posts). They now form one
     * header: sticky on desktop, in-flow on mobile. When sticky, it compacts (hides tags and shrinks
     * the title) so it does not consume half the viewport. */
    function unifyThreadHeader(header) {
        if (!header || header.dataset.smgUnified) return;
        // a barra do PRIMEIRO block-outer (a de cima) sobe pro header; a de baixo continua onde está
        const firstBar = document.querySelector('.block-outer .smg-bar');
        if (!firstBar) return;   // ainda não montou (buildFilterBars roda depois) → tenta no próximo scan
        header.dataset.smgUnified = '1';
        // UMA linha: título/badges à esquerda; pager · ordenar · ações à direita, tudo no .p-title.
        // (a versão anterior punha o pager numa segunda linha — ficava um header de duas faixas)
        const title = header.querySelector('.p-title');
        if (title) {
            const tv = title.querySelector('.p-title-value');
            if (tv) {
                Array.from(tv.childNodes).forEach(n => {
                    if (n.nodeType === 3 && !n.textContent.trim()) {
                        n.remove();
                    } else if (n.nodeType === 3 && n.textContent.trim()) {
                        const sp = document.createElement('span');
                        sp.className = 'smg-thead-title-text';
                        sp.textContent = n.textContent.trim();
                        n.replaceWith(sp);
                    }
                });
            }
            const pageTitleText = (tv ? tv.textContent : '').replace(/\s+/g, ' ').trim();
            const thumbUrl = (() => {
                let u = (typeof thumbCacheGet === 'function') ? (thumbCacheGet(location.href, pageTitleText) || '') : '';
                if (!u) {
                    const holder = document.querySelector('.dcThumbnail img, .dtt-thread-thumbnail img');
                    if (holder) {
                        const bg = (holder.style.backgroundImage || '').match(/url\(\s*["']?([^"')]+)/i);
                        u = (bg && bg[1]) || holder.getAttribute('data-src') || holder.getAttribute('src') || '';
                    }
                }
                if (!u) {
                    const firstPostImg = document.querySelector('.message-inner .message-body img.bbImage, .message-inner .message-body img[src*="attachment"], .message-inner .message-body img:not(.smg-emoji):not(.avatar)');
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
                if (typeof thumbCachePut === 'function') {
                    thumbCachePut(location.href, thumbUrl, pageTitleText);
                }
            }

            const info = document.createElement('div');
            info.className = 'smg-thead-info';

            const line = document.createElement('div');
            line.className = 'smg-thead-titleline';
            if (tv) line.appendChild(tv);
            info.appendChild(line);

            const desc = header.querySelector('.p-description');
            if (desc) {
                const row = document.createElement('div');
                row.className = 'smg-thead-tags';
                row.appendChild(desc);
                info.appendChild(row);
            }

            hero.appendChild(info);
            title.insertBefore(hero, title.firstChild);
        }
        const actions = header.querySelector('.smg-thead-actions');
        if (title) {
            if (actions) title.insertBefore(firstBar, actions);   // pager ANTES das ações (ações no canto)
            else title.appendChild(firstBar);
        } else header.appendChild(firstBar);
        header.classList.add('smg-thead-unified');
        /* "grudou?" medido por uma SENTINELA de altura zero logo acima do header.
         * Medir o próprio header realimenta: ao grudar ele encolhe (badges somem), a posição de
         * referência muda, o cálculo desmarca, ele volta a crescer, remarca… = as badges PISCANDO.
         * A sentinela não muda de tamanho nem de posição, então a referência é estável.
         * Histerese de 6px por cima disso, para o limiar não vibrar em scroll fino. */
        const sentinel = document.createElement('div');
        sentinel.className = 'smg-thead-sentinel';
        header.parentNode.insertBefore(sentinel, header);
        let topOff = null, lastSync = 0, trailTimer = 0;
        const syncStuck = () => {
            const now = Date.now();
            if (now - lastSync < 60) {
                // TRAILING: o throttle descartava o ÚLTIMO evento da rajada. Como o fim da rajada é
                // justamente onde o scroll PARA (por exemplo, de volta no topo), o estado final ficava
                // com o valor do penúltimo evento — daí as badges às vezes não voltarem no topo.
                if (!trailTimer) trailTimer = setTimeout(() => { trailTimer = 0; lastSync = 0; syncStuck(); }, 70);
                return;
            }
            if (trailTimer) { clearTimeout(trailTimer); trailTimer = 0; }
            lastSync = now;
            if (!header.isConnected) return;
            // On mobile the fixed context is the global topbar. The thread header stays
            // in flow so it cannot create a second overlapping bar or compete for height.
            if (window.matchMedia && window.matchMedia('(max-width: 600px)').matches) {
                header.classList.remove('is-stuck');
                topOff = null;
                return;
            }
            if (topOff == null) topOff = parseFloat(getComputedStyle(header).top) || 0;
            const y = sentinel.getBoundingClientRect().top;
            const scrolled = (window.scrollY || document.documentElement.scrollTop || 0) > 0;
            const stuck = header.classList.contains('is-stuck');
            // com a página NO TOPO nada está grudado — sem esta guarda, um layout em que o header nasce
            // acima do offset do sticky (topbar ainda não montada, por exemplo) o deixaria compacto pra sempre
            if (!stuck && scrolled && y <= topOff - 6) header.classList.add('is-stuck');
            else if (stuck && (!scrolled || y >= topOff + 6)) header.classList.remove('is-stuck');
        };
        window.addEventListener('scroll', syncStuck, { passive: true });
        window.addEventListener('resize', () => { topOff = null; lastSync = 0; syncStuck(); }, { passive: true });
        syncStuck();
        setTimeout(() => { lastSync = 0; syncStuck(); }, 400);   // re-mede com o layout assentado (topbar/fontes)
    }

    function decorateThreadCard(row) {
        if (!row || row.dataset.smgDecorated) return;
        row.dataset.smgDecorated = '1';
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
                    ${upText ? `<span class="smg-card-date-item"><span class="smg-card-date-lbl">${IS_PT ? 'Último update às' : 'Updated at'}</span> <span class="smg-card-date-val">${upText}</span></span>` : ''}
                    ${upText && crText ? `<span class="smg-card-date-sep">·</span>` : ''}
                    ${crText ? `<span class="smg-card-date-item"><span class="smg-card-date-lbl">${IS_PT ? 'Criado em' : 'Created'}</span> <span class="smg-card-date-val">${crText}</span></span>` : ''}
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
            const thumb = row.querySelector('.structItem-cell--icon') || row.querySelector('.dcThumbnail') || row.firstElementChild;
            if (thumb) {
                thumb.style.setProperty('position', 'relative', 'important');
                const titleA = row.querySelector('.structItem-title a[href*="/threads/"]') || row.querySelector('.structItem-title a');
                const path = titleA ? canonicalThreadPath(titleA.getAttribute('href')) : '';

                const isWatchedNative = row.classList.contains('is-watched') || !!row.querySelector('.structItem-status--watched');
                let isFollowed = isWatchedNative;
                if (typeof followedSet !== 'undefined' && followedSet && path) {
                    isFollowed = isFollowed || followedSet.has(path);
                }

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'smg-thread-unwatch-btn' + (isFollowed ? ' is-following' : '');
                btn.title = isFollowed ? (IS_PT ? 'Deixar de seguir' : 'Unwatch') : (IS_PT ? 'Seguir tópico' : 'Watch thread');
                btn.innerHTML = isFollowed ? ICONS.unwatch : (ICONS.watch || ICONS.star);

                btn.addEventListener('click', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    const token = document.querySelector('input[name="_xfToken"]')?.value || (window.XF && window.XF.config && window.XF.config.csrf) || '';
                    if (btn.classList.contains('is-following')) {
                        // Unwatch
                        btn.classList.remove('is-following');
                        btn.innerHTML = ICONS.watch || ICONS.star;
                        btn.title = IS_PT ? 'Seguir tópico' : 'Watch thread';
                        if (path) {
                            fetch(path + 'watch', { method: 'POST', body: new URLSearchParams({ _xfToken: token, stop: '1' }), credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } }).catch(() => {});
                            if (typeof dbFollowedDelete === 'function') dbFollowedDelete(path);
                            if (typeof followedSet !== 'undefined' && followedSet) followedSet.delete(path);
                        }
                        const t = (titleA?.textContent || '').trim();
                        if (typeof toast === 'function') toast((IS_PT ? 'Deixou de seguir: ' : 'Unfollowed: ') + t);
                    } else {
                        // Watch
                        btn.classList.add('is-following');
                        btn.innerHTML = ICONS.unwatch;
                        btn.title = IS_PT ? 'Deixar de seguir' : 'Unwatch';
                        if (path) {
                            fetch(path + 'watch', { method: 'POST', body: new URLSearchParams({ _xfToken: token, email_subscribe: '0' }), credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } }).catch(() => {});
                            const thumbImg = row.querySelector('.structItem-cell--icon img, .dcThumbnail img');
                            const itemData = {
                                path: path,
                                thread_name: (titleA?.textContent || '').trim(),
                                thumbnail_url: thumbImg ? (thumbImg.currentSrc || thumbImg.src) : '',
                                updated_at: Date.now()
                            };
                            if (typeof dbFollowedPut === 'function') {
                                dbFollowedPut(itemData);
                            } else if (typeof dbFollowedUpsert === 'function') {
                                dbFollowedUpsert(itemData);
                            }
                            if (typeof followedSet !== 'undefined' && followedSet) followedSet.add(path);
                        }
                        const t = (titleA?.textContent || '').trim();
                        if (typeof toast === 'function') toast((IS_PT ? 'Seguindo: ' : 'Following: ') + t);
                    }
                });
                thumb.appendChild(btn);
            }
        }
        row.dataset.smgDecoratedReady = '1';
    }

    let followedSet = new Set();
    if (typeof dbFollowedGetAll === 'function') {
        dbFollowedGetAll().then(list => {
            if (Array.isArray(list)) {
                list.forEach(it => { if (it && it.path) followedSet.add(canonicalThreadPath(it.path)); });
                document.querySelectorAll('.structItem--thread').forEach(row => {
                    const btn = row.querySelector('.smg-thread-unwatch-btn');
                    if (!btn) return;
                    const titleA = row.querySelector('.structItem-title a[href*="/threads/"]') || row.querySelector('.structItem-title a');
                    const path = titleA ? canonicalThreadPath(titleA.getAttribute('href')) : '';
                    if (path && followedSet.has(path) && !btn.classList.contains('is-following')) {
                        btn.classList.add('is-following');
                        btn.innerHTML = ICONS.unwatch;
                        btn.title = IS_PT ? 'Deixar de seguir' : 'Unwatch';
                    }
                });
            }
        }).catch(() => {});
    }

    function decorateWatchedThreadRow(row) {
        if (!row) return;
        decorateThreadCard(row);
        if (row.querySelector('.smg-thread-unwatch-btn')) return;
        const thumb = row.querySelector('.structItem-cell--icon') || row.querySelector('.dcThumbnail') || row.firstElementChild;
        if (!thumb) return;
        thumb.style.setProperty('position', 'relative', 'important');

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'smg-thread-unwatch-btn';
        btn.title = IS_PT ? 'Deixar de seguir' : 'Unwatch thread';
        btn.innerHTML = ICONS.unwatch;

        btn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();

            const titleA = row.querySelector('.structItem-title a');
            const path = titleA ? canonicalThreadPath(titleA.getAttribute('href')) : '';
            const cb = row.querySelector('input[name="thread_ids[]"]');
            const threadId = cb ? cb.value : ((path.match(/\.(\d+)\/?$/) || [])[1]);

            const token = document.querySelector('input[name="_xfToken"]')?.value || (window.XF && window.XF.config && window.XF.config.csrf) || '';
            if (threadId) {
                const fd = new FormData();
                fd.append('_xfToken', token);
                fd.append('state', 'delete');
                fd.append('thread_ids[]', threadId);
                fetch('/watched/threads/update', { method: 'POST', body: fd, credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } }).catch(() => {});
            } else if (path) {
                fetch(path + 'watch', { method: 'POST', body: new URLSearchParams({ _xfToken: token, stop: '1' }), credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } }).catch(() => {});
            }

            if (typeof dbFollowedDelete === 'function' && path) dbFollowedDelete(path);

            row.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
            row.style.opacity = '0';
            row.style.transform = 'scale(0.92)';
            setTimeout(() => {
                row.remove();
                if (typeof applyLocalFilter === 'function') applyLocalFilter();
            }, 240);

            const threadTitle = (titleA ? titleA.textContent : '').trim();
            const toastMsg = (IS_PT ? 'Deixou de seguir: ' : 'Unfollowed: ') + (threadTitle || (IS_PT ? 'Tópico' : 'Thread'));
            if (typeof toast === 'function') toast(toastMsg);
            else if (window.XF && typeof XF.flashMessage === 'function') XF.flashMessage(toastMsg, 3000);
        });

        thumb.appendChild(btn);
    }

    const watchedPageStates = new WeakMap();
    const watchedPageInflight = new WeakMap();
    function watchedPageSignature(doc, rows) {
        return Array.from(rows).map(row => {
            const title = row.querySelector('.structItem-title a[href*="/threads/"], .structItem-title a');
            const time = row.querySelector('.structItem-cell--latest time, .structItem-latestDate, .structItem-cell--latest .u-dt');
            const jumps = Array.from(row.querySelectorAll('.structItem-pageJump a')).map(a => (a.textContent || '').trim()).join(',');
            return [title ? title.getAttribute('href') : '', title ? title.textContent.trim() : '',
                time ? (time.getAttribute('data-timestamp') || time.getAttribute('data-time') || time.getAttribute('datetime') || '') : '',
                jumps, row.classList.contains('is-unread') || row.classList.contains('structItem--unread') ? '1' : '0'].join(':');
        }).join('|');
    }
    function ingestWatchedPageToFollowed(doc, syncPages = false) {
        if (!doc) return Promise.resolve(0);
        const rows = doc.querySelectorAll('.structItem--thread');
        const signature = watchedPageSignature(doc, rows);
        if (rows.length) {
            const unreadRows = doc.querySelectorAll('.structItem--thread.is-unread, .structItem--thread.structItem--unread');
            const unreadCount = unreadRows.length;
            gmSet('smg-watched-unread-count', String(unreadCount));
            if (typeof updateWatchedUnreadBadge === 'function') {
                updateWatchedUnreadBadge(unreadCount);
            }
        }
        if (typeof dbFollowedGetAll !== 'function' || typeof dbFollowedBulkUpsert !== 'function') {
            return Promise.resolve(0);
        }
        const now = Math.floor(Date.now() / 1000);
        if (watchedPageInflight.has(doc)) return watchedPageInflight.get(doc);
        if (watchedPageStates.get(doc) === signature && !syncPages) return Promise.resolve(0);
        if (!rows.length) {
            watchedPageStates.set(doc, signature);
            return Promise.resolve(0);
        }

        const run = dbFollowedGetAll().then(existingList => {
            const existingMap = new Map();
            (existingList || []).forEach(e => { if (e && e.path) existingMap.set(e.path, e); });

            const itemsToUpsert = [];
            const seenPaths = new Set();
            const syncCandidates = [];

            rows.forEach(it => {
                const titleA = it.querySelector('.structItem-title a[href*="/threads/"]') || it.querySelector('.structItem-title a');
                if (!titleA) return;
                const path = typeof canonicalThreadPath === 'function' ? canonicalThreadPath(titleA.getAttribute('href')) : (titleA.getAttribute('href') || '');
                if (!path || seenPaths.has(path)) return;
                seenPaths.add(path);

                const title = (titleA.textContent || '').replace(/\s+/g, ' ').trim();

                // thumbnail
                let thumb = '';
                const thEl = it.querySelector('.dcThumbnail img, .dtt-thread-thumbnail img, .structItem-cell--icon img');
                if (thEl) {
                    const bg = (thEl.style.backgroundImage || '').match(/url\(\s*["']?([^"')]+)/i);
                    thumb = (bg && bg[1]) || thEl.getAttribute('data-src') || thEl.getAttribute('src') || '';
                }
                if (!thumb && typeof feedThumbUrl === 'function') thumb = feedThumbUrl(it);
                if (!thumb && typeof thumbCacheGet === 'function') thumb = thumbCacheGet(path, title) || '';

                const domUnread = it.classList.contains('is-unread') || it.classList.contains('structItem--unread');

                // tags / badges
                const badges = (typeof extractRowBadges === 'function') ? extractRowBadges(it) : [];
                const tags = badges.map(b => ({ name: b.name, className: b.className }));

                // forum_activity_ts
                const forum_activity_ts = (typeof structItemTs === 'function') ? structItemTs(it) : 0;

                // created_at
                const crTime = it.querySelector('.structItem-cell--main time, .structItem-startDate time');
                let created_at = 0;
                if (crTime) {
                    created_at = parseInt(crTime.getAttribute('data-timestamp') || crTime.getAttribute('data-time') || '0', 10) || 0;
                    if (!created_at) {
                        const dt = crTime.getAttribute('datetime');
                        if (dt) { const ms = Date.parse(dt); if (!isNaN(ms)) created_at = Math.floor(ms / 1000); }
                    }
                }

                // author
                const authorEl = it.querySelector('.structItem-parts .username, .structItem-parts a, .username');
                const author = (authorEl ? authorEl.textContent : '').replace(/\s+/g, ' ').trim();

                // last_page
                let last_page = 1;
                const pageJumps = it.querySelectorAll('.structItem-pageJump a');
                if (pageJumps.length) {
                    const lastJump = pageJumps[pageJumps.length - 1];
                    const pNum = parseInt((lastJump.textContent || '').trim(), 10);
                    if (pNum && !isNaN(pNum)) last_page = pNum;
                }

                const prev = existingMap.get(path);
                const effectiveUpdatedAt = (prev && prev.updated_at) || forum_activity_ts || 0;
                const item = {
                    path: path,
                    thread_name: title || (prev && prev.thread_name) || '',
                    thumbnail_url: thumb || (prev && prev.thumbnail_url) || '',
                    tags: (tags && tags.length) ? tags : ((prev && prev.tags) || []),
                    followed_at: (prev && prev.followed_at) || now,
                    forum_activity_ts: forum_activity_ts || (prev && prev.forum_activity_ts) || 0,
                    updated_at: effectiveUpdatedAt,
                    created_at: created_at || (prev && prev.created_at) || 0,
                    author: author || (prev && prev.author) || '',
                    last_page: Math.max((prev && prev.last_page) || 1, last_page),
                    saved_pages: (prev && prev.saved_pages) || [],
                    last_sync_at: (prev && prev.last_sync_at) || 0,
                    unread: domUnread
                };

                existingMap.set(path, item);
                const changed = !prev
                    || prev.thread_name !== item.thread_name
                    || prev.thumbnail_url !== item.thumbnail_url
                    || JSON.stringify(prev.tags || []) !== JSON.stringify(item.tags || [])
                    || prev.followed_at !== item.followed_at
                    || prev.forum_activity_ts !== item.forum_activity_ts
                    || prev.updated_at !== item.updated_at
                    || prev.created_at !== item.created_at
                    || prev.author !== item.author
                    || prev.last_page !== item.last_page
                    || JSON.stringify(prev.saved_pages || []) !== JSON.stringify(item.saved_pages || [])
                    || prev.last_sync_at !== item.last_sync_at
                    || prev.unread !== item.unread;
                if (changed) itemsToUpsert.push(item);
                if (typeof followedSet !== 'undefined' && followedSet) {
                    followedSet.add(path);
                }

                if (syncPages) {
                    if (forum_activity_ts > ((prev && prev.last_sync_at) || 0) || domUnread || last_page > ((prev && prev.last_page) || 1) || !(prev && prev.updated_at)) {
                        syncCandidates.push({ thread: item, page: last_page });
                    }
                }
            });

            // Atualiza o badge com a contagem de seguidos não lidos baseada em unread
            const unreadCount = itemsToUpsert.concat((existingList || []).filter(e => e && !seenPaths.has(e.path)))
                .filter(it => it && Boolean(it.unread)).length;
            gmSet('smg-watched-unread-count', String(unreadCount));
            if (typeof updateWatchedUnreadBadge === 'function') {
                updateWatchedUnreadBadge(unreadCount);
            }

            const upsertPromise = itemsToUpsert.length ? dbFollowedBulkUpsert(itemsToUpsert).then(() => {
                if (typeof indexFollowedThumbs === 'function') {
                    indexFollowedThumbs(itemsToUpsert);
                }
                try {
                    window.dispatchEvent(new CustomEvent('smg-followed-updated', { detail: { count: itemsToUpsert.length } }));
                } catch (e) {}
                return itemsToUpsert.length;
            }) : Promise.resolve(0);

            return upsertPromise.then(count => {
                if (syncPages && syncCandidates.length && typeof syncThreadPage === 'function') {
                    return Promise.all(syncCandidates.map(c => syncThreadPage(c.thread, c.page).catch(() => 0))).then(() => count);
                }
                return count;
            });
        }).catch(err => {
            console.error('[SMG] Erro em ingestWatchedPageToFollowed:', err);
            return 0;
        });
        watchedPageInflight.set(doc, run);
        return run.then(count => {
            watchedPageStates.set(doc, signature);
            return count;
        }).finally(() => watchedPageInflight.delete(doc));
    }

    function fetchWatchedDoc() {
        const url = (typeof navHref === 'function' && navHref('watchedThreads', 'watched', 'watchedThreads2')) || '/watched/threads';
        const csrf = (typeof document !== 'undefined' && document.documentElement.getAttribute('data-csrf'))
            || ((typeof document !== 'undefined' && document.querySelector('input[name="_xfToken"]')) || {}).value || '';
        const full = url + (url.indexOf('?') >= 0 ? '&' : '?') + '_xfResponseType=json'
            + (csrf ? '&_xfToken=' + encodeURIComponent(csrf) : '');

        return fetch(full, { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(r => r.text())
            .then(t => {
                let html = t;
                try {
                    const j = JSON.parse(t);
                    html = (j.html && (j.html.content || j.html)) || j.content || t;
                } catch (e) {}
                const doc = new DOMParser().parseFromString(html, 'text/html');
                if (doc.querySelectorAll('.structItem--thread').length > 0) {
                    return doc;
                }
                return fetchDoc(url, { credentials: 'same-origin' });
            })
            .catch(() => fetchDoc(url, { credentials: 'same-origin' }).catch(() => null));
    }

    let lastFollowedFetchTs = 0;
    let followedFetchInFlight = null;
    const FOLLOWED_FETCH_MIN_INTERVAL_MS = 2 * 60 * 1000; // Mínimo de 2 minutos entre buscas automáticas de /watched/threads

    function fetchAndIngestFollowed(syncPages = false, force = false) {
        const now = Date.now();
        if (!force && !(typeof window !== 'undefined' && window.__TEST_MODE__) && (now - lastFollowedFetchTs < FOLLOWED_FETCH_MIN_INTERVAL_MS)) {
            return Promise.resolve(0);
        }
        if (followedFetchInFlight) {
            return followedFetchInFlight;
        }
        lastFollowedFetchTs = now;
        console.log('[SMG Timeline] Buscando tópicos seguidos em segundo plano...');
        followedFetchInFlight = fetchWatchedDoc()
            .then(doc => {
                if (doc && typeof ingestWatchedPageToFollowed === 'function') {
                    return ingestWatchedPageToFollowed(doc, syncPages).then(count => {
                        console.log('[SMG Timeline] Ingestão concluída: ' + count + ' tópicos processados na tabela followed.');
                        return count;
                    });
                }
                return 0;
            })
            .catch(err => {
                console.warn('[SMG Timeline] Erro ao buscar seguidos em background:', err);
                return 0;
            })
            .finally(() => {
                followedFetchInFlight = null;
            });
        return followedFetchInFlight;
    }

    let isStreamingWatched = false;
    async function streamAllWatchedPages() {
        if (isStreamingWatched) return;
        if (!location.pathname.includes('/watched/threads') && !location.href.includes('/watched/threads')) return;
        isStreamingWatched = true;

        const getContainer = () => document.querySelector('.structItemContainer.smg-tl-grid') || document.querySelector('.structItemContainer') || document.querySelector('.block-body');
        let container = getContainer();
        if (!container) { isStreamingWatched = false; return; }

        ingestWatchedPageToFollowed(document);

        let maxPages = 1;
        document.querySelectorAll('.pageNav-page a, .pageNav a, .pageNavSimple, .pageNav-jump--last, a[href*="page="]').forEach(a => {
            const m = (a.getAttribute('href') || a.textContent || '').match(/(?:page-|[?&]page=)(\d+)/);
            if (m) maxPages = Math.max(maxPages, parseInt(m[1], 10) || 1);
        });
        const simple = document.querySelector('.pageNavSimple-el--current')?.textContent.match(/(\d+)\s*of\s*(\d+)/i);
        if (simple) maxPages = Math.max(maxPages, parseInt(simple[2], 10) || 1);

        container.querySelectorAll('.structItem--thread').forEach(decorateWatchedThreadRow);

        if (maxPages <= 1) return;

        const seenHrefs = new Set();
        container.querySelectorAll('.structItem--thread').forEach(row => {
            const a = row.querySelector('.structItem-title a');
            if (a) seenHrefs.add(a.getAttribute('href'));
        });

        let nextPage = 2;
        let isFetching = false;

        async function loadNextWatchedPage() {
            if (isFetching || nextPage > maxPages || nextPage > 100) return;
            isFetching = true;
            const p = nextPage;
            const url = `/watched/threads?page=${p}`;
            try {
                const doc = await fetchDoc(url, { credentials: 'same-origin' });
                if (!doc) {
                    isFetching = false;
                    return;
                }
                ingestWatchedPageToFollowed(doc);
                const rows = doc.querySelectorAll('.structItem--thread');
                if (!rows.length) {
                    nextPage = maxPages + 1;
                    isFetching = false;
                    return;
                }

                const frag = document.createDocumentFragment();
                rows.forEach(r => {
                    const a = r.querySelector('.structItem-title a');
                    const href = a ? a.getAttribute('href') : null;
                    if (href && seenHrefs.has(href)) return;
                    if (href) seenHrefs.add(href);
                    const node = document.importNode(r, true);
                    decorateWatchedThreadRow(node);
                    frag.appendChild(node);
                });
                const curContainer = getContainer() || container;
                if (curContainer) curContainer.appendChild(frag);

                if (typeof window.smgReapplyFilters === 'function') {
                    window.smgReapplyFilters();
                }
                nextPage++;
            } catch (e) {
                console.error('[SMG] Erro no stream sob demanda de seguidos p=' + p, e);
            } finally {
                isFetching = false;
            }
        }

        function onScrollWatched() {
            if (isFetching || nextPage > maxPages || nextPage > 100) return;
            const scrollBottom = (window.innerHeight || (document.documentElement && document.documentElement.clientHeight) || 0) + (window.scrollY || window.pageYOffset || 0);
            const docHeight = Math.max((document.documentElement && document.documentElement.scrollHeight) || 0, (document.body && document.body.scrollHeight) || 0);
            if (docHeight - scrollBottom <= 600) {
                loadNextWatchedPage();
            }
        }

        window.addEventListener('scroll', onScrollWatched, { passive: true });
        if (typeof window !== 'undefined') {
            window.__onWatchedScroll = onScrollWatched;
            window.__loadNextWatchedPage = loadNextWatchedPage;
        }
    }

    function buildFilterBars(roots) {
        if (location.pathname.includes('/watched/threads') || location.href.includes('/watched/threads')) {
            document.querySelectorAll('.pageNavWrapper:not([data-smg-hidden]), .pageNav:not([data-smg-hidden]), nav.pageNavWrapper:not([data-smg-hidden])').forEach(el => {
                el.style.setProperty('display', 'none', 'important');
                el.dataset.smgHidden = '1';
            });
            eachIn(roots, '.structItem--thread', decorateWatchedThreadRow);
            if (!roots || normalizeRoots(roots).some(root => root === document.body || root.closest('.structItemContainer, .block-body, .p-body-content'))) {
                ingestWatchedPageToFollowed(document);
            }
            streamAllWatchedPages();
            return;
        }
        eachIn(roots, '.structItem--thread:not([data-smg-decorated])', decorateThreadCard);
        const cl = document.documentElement.classList;
        if (!cl.contains('smg-thread') && !cl.contains('smg-threadlist')) return;   // os 2 sites (SMG + simpcity)
        eachIn(roots, '.block-outer:not([data-smg-bar])', bo => {
            const wrap = bo.querySelector('.pageNavWrapper');
            const bar = document.createElement('div'); bar.className = 'smg-bar';
            const add = g => { if (!g) return; if (bar.children.length) bar.appendChild(smgDivider()); bar.appendChild(g); };
            // ordem: pager · ações(…sino…traduzir) · ORDENAR · mais(•••)
            add(wrap ? smgPagerGroup(wrap) : null);
            add(smgPrimaryActions(bo));
            add(smgSortGroup(bo));
            add(smgMoreButton(bo));
            bo.setAttribute('data-smg-bar', '1');      // marca SEMPRE (mesmo barra vazia) → não re-varre/reconstrói todo frame
            if (!bar.children.length) return;          // nada útil nessa barra → deixa o nativo
            // esconde os nativos (ficam no DOM: proxy-click + scroll infinito leem deles)
            Array.from(bo.children).forEach(c => c.style.setProperty('display', 'none', 'important'));
            bo.insertBefore(bar, bo.firstChild);
        });
        // a barra de cima pertence ao header unificado — tenta juntar (no boot o header pode ter sido
        // montado antes desta barra existir, e a thread também recarrega barras no scroll infinito)
        unifyThreadHeader(document.querySelector('.p-body-header[data-smg-thead]'));
    }

    // =========================================================
    // POST estilo REDDIT: card de 1 coluna — header (avatar · nome · tempo · #N + título/banners/stats),
    // conteúdo (inalterado) e action bar (React · Comentar · Compartilhar · Salvar · Traduzir · ⋯).
    // MOVE os botões NATIVOS pro card (preserva o AJAX/tooltip/picker do XF — os relative-selectors do XF
    // resolvem porque tudo continua DENTRO do mesmo <article>); o CSS (.smg-pc) esconde os containers vazios
    // (coluna do usuário, attribution, actionBar nativa). Escopado (buildPostCards no processAll) → pega posts
    // do scroll infinito. 1×/post via data-smg-card.
    // =========================================================
    function smgRelTime(tsSec) {   // epoch s → "há 4 meses" / "4mo ago"
        let s = Math.floor(Date.now() / 1000) - tsSec;
        if (s < 45) return IS_PT ? 'agora' : 'now';
        const U = IS_PT
            ? [[31536000, 'ano', 'anos'], [2592000, 'mês', 'meses'], [604800, 'semana', 'semanas'], [86400, 'dia', 'dias'], [3600, 'hora', 'horas'], [60, 'minuto', 'minutos']]
            : [[31536000, 'y', 'y'], [2592000, 'mo', 'mo'], [604800, 'w', 'w'], [86400, 'd', 'd'], [3600, 'h', 'h'], [60, 'm', 'm']];
        for (const [sec, one, many] of U) {
            const n = Math.floor(s / sec);
            if (n >= 1) return IS_PT ? ('há ' + n + ' ' + (n === 1 ? one : many)) : (n + many + ' ago');
        }
        return IS_PT ? 'agora' : 'now';
    }
    function smgKNum(n) { return n >= 1000 ? (n / 1000).toFixed(n < 10000 ? 1 : 0).replace(/\.0$/, '') + 'k' : String(n); }
    // O react é um CONTADOR: "1 reação" / "6 reações" (PT) · "1 reaction" / "6 reactions" (EN).
    // Em DOIS nós: no celular o CSS esconde só a palavra e sobra "joinha 283",
    // que é o que cabe na largura de um telefone (com a palavra, a action bar quebrava em 2 linhas).
    function smgReactionFill(el, n) {
        const w = IS_PT ? (n === 1 ? 'reação' : 'reações') : (n === 1 ? 'reaction' : 'reactions');
        el.textContent = '';
        const num = document.createElement('span'); num.className = 'smg-react-num'; num.textContent = smgKNum(n);
        const word = document.createElement('span'); word.className = 'smg-react-w'; word.textContent = ' ' + w;
        el.append(num, word);
    }
    function smgPostReactionCount(post) {   // SÓ as reações do POST: a .reactionsBar dele. NÃO somar comentários (usam .comment-reactions) — era o "React 6"
        const bar = post.querySelector('.message-cell--main .reactionsBar');
        let n = 0; if (bar) bar.querySelectorAll('.smgReactionPill-count').forEach(c => n += parseInt(c.textContent, 10) || 0);
        if (n) return n;
        const md = post.querySelector('.message-footer .message-microdata meta[itemprop="userInteractionCount"]');
        if (md && +md.getAttribute('content')) return +md.getAttribute('content');
        if (bar) { const names = bar.querySelectorAll('.reactionsBar-link bdi').length; const m = (bar.textContent || '').match(/(\d[\d.,]*)\s*(?:outros|others)/i); return names + (m ? (parseInt(m[1].replace(/[.,]/g, ''), 10) || 0) : 0); }
        return 0;
    }
    // COMPARTILHAR = COPIAR O LINK DIRETO (FEATURES.shareDirectLink, ligado por padrão). O menu nativo do XF
    // é um passo a mais pra chegar no mesmo link: o href do próprio botão JÁ é o permalink do post.
    // Tira o data-xf-init (é ele que o XF usa pra montar o tooltip) e trata o clique em CAPTURE, pra
    // rodar antes de qualquer handler que o XF tenha registrado antes de a gente marcar.
    function smgShareDirect(a) {
        if (!FEATURES.shareDirectLink || !a || a.dataset.smgShareDirect) return;
        a.dataset.smgShareDirect = '1';
        a.removeAttribute('data-xf-init');
        a.addEventListener('click', e => {
            const url = a.href;   // permalink absoluto (/threads/…/post-123)
            if (!url) return;
            e.preventDefault(); e.stopImmediatePropagation();
            const lbl = a.querySelector('.smg-pc-act-lbl');
            const ok = () => {
                a.classList.add('smg-pc-act--copied');
                if (lbl) lbl.textContent = i18n('Copied!');
                setTimeout(() => { a.classList.remove('smg-pc-act--copied'); if (lbl) lbl.textContent = i18n('Share'); }, 1200);
            };
            // clipboard API falha em contexto não-seguro/sem permissão → cai no textarea+execCommand
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, () => smgCopyFallback(url, ok));
            else smgCopyFallback(url, ok);
        }, true);
    }
    function smgCopyFallback(text, done) {
        try {
            const ta = document.createElement('textarea');
            ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
            document.body.appendChild(ta); ta.focus(); ta.select();
            document.execCommand('copy'); ta.remove(); done();
        } catch (e) {}
    }
    function smgActLabel(el, text) {   // garante rótulo de texto no botão movido (share/save são só ícone)
        if (el.querySelector('.smg-pc-act-lbl')) return;
        const s = document.createElement('span'); s.className = 'smg-pc-act-lbl'; s.textContent = i18n(text);
        el.appendChild(s);
    }
    // Botões NATIVOS do XF trazem o texto solto (<i>Responder</i> não existe: é <i class="fa"></i>
    // + text node). Sem um elemento em volta não dá pra escondê-lo por CSS no celular — aqui cada
    // text node vira um .smg-pc-act-lbl, e o botão passa a ser icon-only como os nossos.
    function smgWrapNativeLabel(el) {
        if (!el || el.querySelector('.smg-pc-act-lbl')) return;
        for (const n of [...el.childNodes]) {
            if (n.nodeType !== 3 || !(n.textContent || '').trim()) continue;
            const s = document.createElement('span'); s.className = 'smg-pc-act-lbl'; s.textContent = n.textContent.trim();
            el.replaceChild(s, n);
        }
    }
    // Troca o glifo nativo (fa) pelo nosso SVG, mantendo o botão e o handler do XF.
    // Remove TODOS os glifos (o botão do XF traz mais de um: o <i> da fonte de ícones e, em alguns
    // temas, um <svg> junto — trocar só o primeiro deixava os dois desenhos lado a lado).
    function smgSwapIcon(el, iconHtml) {
        if (!el) return;
        el.querySelectorAll('.smg-pc-act-ic, i:not(.reaction-sprite):not(.reaction-image), .fa--xf, svg:not(.reaction-sprite), .uix_icon').forEach(n => n.remove());
        const ic = document.createElement('span'); ic.className = 'smg-pc-act-ic'; ic.innerHTML = iconHtml;
        el.insertBefore(ic, el.firstChild);
    }
    // popover ⋯ : UM listener de document p/ TODOS os cards (antes era 1 por post/comentário —
    // centenas acumulados no scroll infinito, cada clique na página rodava N contains()).
    // Só um popover fica aberto por vez → fechar é O(1) via referência.
    let openMoreWrap = null, moreCloseBound = false;
    function smgToggleMore(wrap) {
        if (openMoreWrap && openMoreWrap !== wrap) { openMoreWrap.classList.remove('open'); openMoreWrap = null; }
        const on = wrap.classList.toggle('open');
        openMoreWrap = on ? wrap : null;
        if (!moreCloseBound) {
            moreCloseBound = true;
            document.addEventListener('click', e => {
                if (openMoreWrap && !openMoreWrap.contains(e.target)) { openMoreWrap.classList.remove('open'); openMoreWrap = null; }
            });
        }
    }
    function buildPostCard(post) {
        post.dataset.smgCard = '1';   // marca ANTES do guard (REGRA DE OURO): post deletado/placeholder sem marca era re-varrido em todo full-scan
        const inner = post.querySelector(':scope > .message-inner');
        const main = inner && inner.querySelector(':scope > .message-cell--main');
        if (!inner || !main) {
            post.dataset.smgCardReady = 'skip';
            return;   // não é um post padrão (deletado/placeholder) → deixa nativo
        }
        post.classList.add('smg-pc');
        const messageMain = main.querySelector('.message-main') || main;
        const userCell = inner.querySelector(':scope > .message-cell--user');
        const attribution = messageMain.querySelector('.message-attribution');
        const footerBar = messageMain.querySelector('.message-actionBar');

        // ---------- HEADER ----------
        const head = document.createElement('div'); head.className = 'smg-pc-head';
        const avatar = userCell && userCell.querySelector('.message-avatar a.avatar, .message-avatar .avatar');
        if (avatar) { avatar.classList.add('smg-pc-avatar'); head.appendChild(avatar); }
        const meta = document.createElement('div'); meta.className = 'smg-pc-meta';
        const row1 = document.createElement('div'); row1.className = 'smg-pc-row1';
        const idline = document.createElement('div'); idline.className = 'smg-pc-idline';
        const name = userCell && userCell.querySelector('.message-name');
        if (name) { name.classList.add('smg-pc-name'); idline.appendChild(name); }
        const timeEl = attribution && attribution.querySelector('time');
        if (timeEl) {
            const ts = +(timeEl.getAttribute('data-timestamp') || 0);
            const dot = document.createElement('span'); dot.className = 'smg-pc-dot'; dot.textContent = '·';
            const t = document.createElement('span'); t.className = 'smg-pc-time';
            t.textContent = ts ? smgRelTime(ts) : (timeEl.textContent || '').trim();
            t.title = timeEl.getAttribute('title') || (timeEl.textContent || '').trim();
            idline.append(dot, t);
        }
        // DISCUSSÃO (social): badge "DISCUSSION" + indicador "silent" (vivem no attribution) → entram na idline após o tempo
        const discBadge = attribution && attribution.querySelector('.smg-discussion-badge');
        if (discBadge) idline.appendChild(discBadge);
        const silent = attribution && attribution.querySelector('.smg-silent-indicator');
        if (silent) idline.appendChild(silent);
        row1.appendChild(idline);
        let postNum = null;
        if (attribution) attribution.querySelectorAll('a').forEach(a => { if (!postNum && /^D?#\d/.test((a.textContent || '').trim())) postNum = a; });   // #398 (post) ou D#1 (discussão, .smg-discussion-number)
        if (postNum) { postNum.classList.add('smg-pc-num'); row1.appendChild(postNum); }
        meta.appendChild(row1);
        const row2 = document.createElement('div'); row2.className = 'smg-pc-row2';
        const title = userCell && userCell.querySelector('.userTitle');
        if (title) { title.classList.add('smg-pc-utitle'); row2.appendChild(title); }
        if (userCell) userCell.querySelectorAll('.userBanner').forEach(b => row2.appendChild(b));
        const badges = userCell && userCell.querySelector('.featuredBadges');
        if (badges) row2.appendChild(badges);
        if (row2.childNodes.length) meta.appendChild(row2);
        // 3ª linha (stats do usuário: cadastro · mensagens · pontos) removida a pedido — não anexa o .message-userExtras
        head.appendChild(meta);
        messageMain.insertBefore(head, messageMain.firstChild);

        // ---------- ACTION BAR ----------
        const bar = document.createElement('div'); bar.className = 'smg-pc-actions';
        const react = footerBar && footerBar.querySelector('.actionBar-action--reaction');
        if (react) {
            react.classList.add('smg-pc-act', 'smg-pc-act--react');
            // CONTADOR: ícone limpo (thumbs-up) + "N reações". O visual nativo (sprite/<i>/emoji/"React" = a "asa" torta) fica escondido via CSS.
            const ic = document.createElement('span'); ic.className = 'smg-pc-react-ic'; ic.innerHTML = svgIcon(SMG_ICO.thumb);
            const lbl = document.createElement('span'); lbl.className = 'smg-pc-react-n'; smgReactionFill(lbl, smgPostReactionCount(post));
            react.insertBefore(lbl, react.firstChild); react.insertBefore(ic, react.firstChild);
            bar.appendChild(react);
        }
        const comment = footerBar && footerBar.querySelector('.uw_fcs_post_comment');   // social = comentário; simp não tem
        const reply = footerBar && footerBar.querySelector('.actionBar-action--reply');
        const commentBtn = comment || reply;   // sem comentário (simp) → Responder vira o "Comentar". Já tem TEXTO nativo (Comment/Responder/Reply) → NÃO adiciona rótulo (senão duplica: "Responder Reply")
        if (commentBtn) {
            commentBtn.classList.add('smg-pc-act', 'smg-pc-act--comment');
            smgSwapIcon(commentBtn, ICONS.reply);   // o glifo do XF é uma seta curva que em 15px vira gancho
            smgWrapNativeLabel(commentBtn);         // texto solto → span, pra virar icon-only no celular
            bar.appendChild(commentBtn);
        }
        const save = attribution && attribution.querySelector('a.bookmarkLink');
        if (save) {
            save.classList.add('smg-pc-act', 'smg-pc-act--save');
            smgActLabel(save, 'Save');
            save.title = IS_PT ? 'Salvar post nos favoritos' : 'Bookmark this post';
            save.setAttribute('aria-label', save.title);
            bar.appendChild(save);
        }
        const translate = footerBar && footerBar.querySelector('.smgTranslator-btn');
        if (translate) { translate.classList.add('smg-pc-act', 'smg-pc-act--translate'); bar.appendChild(translate); }
        const share = attribution && attribution.querySelector('a.message-attribution-gadget[data-xf-init="share-tooltip"]');   // Share = ÚLTIMO (depois do translate)
        if (share) {
            share.classList.add('smg-pc-act', 'smg-pc-act--share');
            smgActLabel(share, 'Share');
            smgShareDirect(share);
            share.title = IS_PT ? 'Copiar link deste post' : 'Copy link to this post';
            share.setAttribute('aria-label', share.title);
            bar.appendChild(share);
        }
        // ⋯ overflow: multiquote · (reply, se Comentar veio do comentário) · denunciar
        const moreItems = [];
        const mq = footerBar && footerBar.querySelector('.js-multiQuote'); if (mq) moreItems.push(mq);
        if (comment && reply) moreItems.push(reply);
        const report = footerBar && footerBar.querySelector('.actionBar-action--report'); if (report) moreItems.push(report);
        if (moreItems.length) {
            const moreWrap = document.createElement('div'); moreWrap.className = 'smg-pc-morewrap';
            const moreBtn = document.createElement('button'); moreBtn.type = 'button'; moreBtn.className = 'smg-pc-act smg-pc-act--more'; moreBtn.setAttribute('aria-label', i18n('More')); moreBtn.textContent = '⋯';
            const pop = document.createElement('div'); pop.className = 'smg-pc-morepop';
            moreItems.forEach(el => { el.classList.add('smg-pc-morerow'); pop.appendChild(el); });
            moreBtn.addEventListener('click', e => { e.stopPropagation(); smgToggleMore(moreWrap); });
            moreWrap.append(moreBtn, pop); bar.appendChild(moreWrap);
        }
        const content = messageMain.querySelector('.message-content');
        if (content) content.insertAdjacentElement('afterend', bar); else messageMain.appendChild(bar);
        post.dataset.smgCardReady = '1';
    }
    function buildPostCards(roots) {
        if (!document.documentElement.classList.contains('smg-thread')) return;   // só em thread (onde há posts)
        eachIn(roots, 'article.message:not([data-smg-card])', buildPostCard);
    }

    // COMENTÁRIOS (uw_fcs, só no SMG): mesmo modelo do post — header compacto (avatar · user · tempo · #N),
    // body, action bar leve (react · responder · ⋯ citar/denunciar/traduzir/share). Indentação (thread-line) via CSS.
    // MOVE os nativos (preserva AJAX); reusa o popover ⋯ do post (smg-pc-more*). 1×/comentário via data-smg-cc.
    function buildCommentCard(comment) {
        comment.dataset.smgCc = '1';   // marca ANTES do guard (REGRA DE OURO)
        const cinner = comment.querySelector(':scope > .comment-inner');
        if (!cinner) {
            comment.dataset.smgCcReady = 'skip';
            return;
        }
        comment.classList.add('smg-cc');
        const cmain = cinner.querySelector(':scope > .comment-main');
        const cwrap = cmain && cmain.querySelector('.comment-contentWrapper');
        const footerBar = comment.querySelector('.comment-footer .comment-actionBar');

        const head = document.createElement('div'); head.className = 'smg-cc-head';
        const avatar = cinner.querySelector(':scope > .comment-avatar a.avatar, :scope > .comment-avatar .avatar');
        if (avatar) { avatar.classList.add('smg-cc-avatar'); head.appendChild(avatar); }
        const idline = document.createElement('div'); idline.className = 'smg-cc-idline';
        const userLink = cwrap && cwrap.querySelector('a.comment-user');
        if (userLink) { userLink.classList.add('smg-cc-name'); idline.appendChild(userLink); }
        const timeEl = cwrap && cwrap.querySelector('time');
        if (timeEl) {
            const ts = +(timeEl.getAttribute('data-timestamp') || 0);
            const dot = document.createElement('span'); dot.className = 'smg-pc-dot'; dot.textContent = '·';
            const t = document.createElement('span'); t.className = 'smg-cc-time';
            t.textContent = ts ? smgRelTime(ts) : (timeEl.textContent || '').trim();
            t.title = timeEl.getAttribute('title') || '';
            idline.append(dot, t);
        }
        let numA = null;
        const opp = cwrap && cwrap.querySelector('.message-attribution-opposite');
        if (opp) opp.querySelectorAll('a').forEach(a => { if (!numA && /#[\d.]/.test((a.textContent || '').trim())) numA = a; });
        if (numA) { numA.classList.add('smg-cc-num'); idline.appendChild(numA); }
        head.appendChild(idline);
        cinner.insertBefore(head, cinner.firstChild);

        const bar = document.createElement('div'); bar.className = 'smg-cc-actions';
        const react = footerBar && footerBar.querySelector('.actionBar-action--reaction');
        if (react) {
            react.classList.add('smg-cc-act', 'smg-cc-act--react');
            let n = 0; comment.querySelectorAll('.comment-reactions .smgReactionPill-count').forEach(c => n += parseInt(c.textContent, 10) || 0);
            const ic = document.createElement('span'); ic.className = 'smg-cc-react-ic'; ic.innerHTML = svgIcon(SMG_ICO.thumb);
            const lbl = document.createElement('span'); lbl.className = 'smg-cc-react-n'; smgReactionFill(lbl, n);
            react.insertBefore(lbl, react.firstChild); react.insertBefore(ic, react.firstChild);
            bar.appendChild(react);
        }
        const cReply = footerBar && footerBar.querySelector('.uw_cq_btn');   // "Comment" = responder AO comentário (já tem texto nativo)
        if (cReply) { cReply.classList.add('smg-cc-act', 'smg-cc-act--comment'); smgSwapIcon(cReply, ICONS.reply); smgWrapNativeLabel(cReply); bar.appendChild(cReply); }
        // ⋯ : compartilhar · citar · denunciar · traduzir
        const moreItems = [];
        const cShare = cwrap && cwrap.querySelector('.uw_fcs_comment_share'); if (cShare) moreItems.push(cShare);
        [footerBar && footerBar.querySelector('.actionBar-action--reply'), footerBar && footerBar.querySelector('.actionBar-action--report'), footerBar && footerBar.querySelector('.smgTranslator-btn')].forEach(el => { if (el) moreItems.push(el); });
        if (moreItems.length) {
            const mw = document.createElement('div'); mw.className = 'smg-pc-morewrap';
            const mb = document.createElement('button'); mb.type = 'button'; mb.className = 'smg-cc-act smg-cc-act--more'; mb.setAttribute('aria-label', i18n('More')); mb.textContent = '⋯';
            const pop = document.createElement('div'); pop.className = 'smg-pc-morepop';
            moreItems.forEach(el => { el.classList.add('smg-pc-morerow'); pop.appendChild(el); });
            mb.addEventListener('click', e => { e.stopPropagation(); smgToggleMore(mw); });
            mw.append(mb, pop); bar.appendChild(mw);
        }
        const body = comment.querySelector('.comment-body');
        if (body) body.insertAdjacentElement('afterend', bar); else (comment.querySelector('.js-quickEditTargetComment') || cinner).appendChild(bar);
        comment.dataset.smgCcReady = '1';
    }
    function buildCommentCards(roots) {
        if (!document.documentElement.classList.contains('smg-thread')) return;
        eachIn(roots, '.message-responses .comment:not([data-smg-cc])', buildCommentCard);
    }
    // header da seção de comentários (SMG/uw_fcs): label "Sort:" antes do chip + "Previous comments" → "Load more"
    function buildCommentBar(roots) {
        if (!document.documentElement.classList.contains('smg-thread')) return;
        eachIn(roots, '.uw-comment-count .uw-fcs-sort-toggle:not([data-smg-sortlbl])', t => {
            t.dataset.smgSortlbl = '1';
            const lbl = document.createElement('span'); lbl.className = 'smg-cbar-sortlbl'; lbl.textContent = i18n('Sort:');
            t.insertBefore(lbl, t.firstChild);
        });
        eachIn(roots, '.uw_load_prev:not([data-smg-lm])', a => { a.dataset.smgLm = '1'; a.textContent = i18n('Load more'); });   // re-aparece após cada load → pass por-elemento
    }

    // (THREAD header restyle removido — era dead code, nunca chamado; buildFilterBars cobre pager/ordenar/ações nos 2 sites)

    // carrega um popup de lista do XF (alertas/mensagens) e devolve o nó da lista;
    // _xfResponseType=json → só o conteúdo já preenchido · _xfToken → evita "Security error"
    function fetchXfList(fetchUrl) {
        const csrf = document.documentElement.getAttribute('data-csrf')
            || (document.querySelector('input[name="_xfToken"]') || {}).value || '';
        const url = fetchUrl + (fetchUrl.indexOf('?') >= 0 ? '&' : '?') + '_xfResponseType=json'
            + (csrf ? '&_xfToken=' + encodeURIComponent(csrf) : '');
        return fetch(url, { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(r => r.text())
            .then(t => {
                let html = t;
                try { const j = JSON.parse(t); html = (j.html && (j.html.content || j.html)) || j.content || t; } catch (e) {}
                const tmp = document.createElement('div');
                tmp.innerHTML = html;
                return tmp.querySelector('.listPlain') || tmp.querySelector('.js-alertsMenuBody') || tmp.querySelector('.js-convMenuBody') || tmp;
            });
    }

    if (typeof window !== 'undefined') {
        window.fetchWatchedDoc = fetchWatchedDoc;
        window.fetchAndIngestFollowed = fetchAndIngestFollowed;
    }

    if (typeof window !== 'undefined' && window.__TEST_MODE__) {
        window.__filterbarExports = {
            ingestWatchedPageToFollowed,
            fetchWatchedDoc,
            fetchAndIngestFollowed,
            streamAllWatchedPages,
            buildFilterBars,
            decorateThreadCard,
            decorateWatchedThreadRow,
            get isStreamingWatched() { return isStreamingWatched; },
            set isStreamingWatched(v) { isStreamingWatched = v; }
        };
    }
