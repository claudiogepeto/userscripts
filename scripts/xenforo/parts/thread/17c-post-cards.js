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
        const word = document.createElement('span'); word.className = 'smg-react-w'; word.textContent = w;
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
                toast(i18n('Link copied'));
                a.classList.add('smg-pc-act--copied');
                smgSwapIcon(a, ICONS.shareDone);
                if (lbl) lbl.textContent = i18n('Copied!');
                setTimeout(() => {
                    a.classList.remove('smg-pc-act--copied');
                    smgSwapIcon(a, ICONS.share);
                    if (lbl) lbl.textContent = i18n('Share');
                }, 1200);
            };
            copyText(url, ok);
        }, true);
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
    // "⋯": botão (classe do post ou do comentário) + popover com as ações nativas MOVIDAS (preserva AJAX)
    function smgMoreMenu(items, actCls) {
        const wrap = document.createElement('div'); wrap.className = 'smg-pc-morewrap';
        const btn = document.createElement('button'); btn.type = 'button'; btn.className = actCls + ' ' + actCls + '--more'; btn.setAttribute('aria-label', i18n('More')); btn.textContent = '⋯';
        const pop = document.createElement('div'); pop.className = 'smg-pc-morepop';
        items.forEach(el => { el.classList.add('smg-pc-morerow'); pop.appendChild(el); });
        btn.addEventListener('click', e => { e.stopPropagation(); smgToggleMore(wrap); });
        wrap.append(btn, pop);
        return wrap;
    }
    // inner/main: achados por buildPostCards (post padrão; deletado/placeholder fica nativo lá)
    function buildPostCard(post, inner, main) {
        post.dataset.smgCard = '1';
        delete post.dataset.smgCardReady;
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
        const react = (footerBar && footerBar.querySelector('.actionBar-action--reaction, .actionBar-action--like, [data-xf-click="reaction"], a.reaction, a[href*="/react"]'))
            || post.querySelector('.message-footer .actionBar-action--reaction, .message-actionBar [data-xf-click="reaction"], a[href*="/react"]');
        if (react && !react.closest('.bbWrapper, .comment, .message-responses')) {
            react.classList.remove('u-hidden', 'is-hidden');
            react.hidden = false;
            react.style.removeProperty('display');
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
        // XF 2.2+ coloca o bookmark na action bar (.actionBar-action--bookmark). A action bar
        // inteira é escondida depois, então procurar só em .message-attribution deixa o botão
        // invisível. UI.X antigo ainda usa a.bookmarkLink na atribuição — os dois entram.
        const saveSel = 'a.bookmarkLink, .actionBar-action--bookmark, [data-xf-click="bookmark-click"]';
        let save = (footerBar && footerBar.querySelector(saveSel))
            || (attribution && attribution.querySelector(saveSel));
        if (!save) {
            const extra = post.querySelector(saveSel);
            if (extra && !extra.closest('.bbWrapper, .menu, .overlay')) save = extra;
        }
        if (save) {
            save.classList.add('smg-pc-act', 'smg-pc-act--save');
            smgSwapIcon(save, ICONS.save);
            smgActLabel(save, 'Save');
            save.title = IS_PT ? 'Salvar post nos favoritos' : 'Bookmark this post';
            save.setAttribute('aria-label', save.title);
            const paintSaved = () => {
                const on = save.classList.contains('is-bookmarked');
                const svg = save.querySelector('svg');
                if (svg) svg.style.setProperty('fill', on ? 'currentColor' : 'none', 'important');
                const lbl = save.querySelector('.smg-pc-act-lbl');
                if (lbl) lbl.textContent = i18n(on ? 'Saved state' : 'Save');
                const tip = on
                    ? (IS_PT ? 'Post salvo' : 'Post saved')
                    : (IS_PT ? 'Salvar post nos favoritos' : 'Bookmark this post');
                save.title = tip;
                save.setAttribute('aria-label', tip);
            };
            paintSaved();
            save._smgPaintSaved = paintSaved;
            savedButtonObserver().observe(save, { attributes: true, attributeFilter: ['class'] });
            bar.appendChild(save);
        }
        const translate = footerBar && footerBar.querySelector('.smgTranslator-btn');
        if (translate) { translate.classList.add('smg-pc-act'); bar.appendChild(translate); }
        const share = attribution && attribution.querySelector('a.message-attribution-gadget[data-xf-init="share-tooltip"]');   // Share = ÚLTIMO (depois do translate)
        if (share) {
            share.classList.add('smg-pc-act', 'smg-pc-act--share');
            smgSwapIcon(share, ICONS.share);
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
        if (moreItems.length) bar.appendChild(smgMoreMenu(moreItems, 'smg-pc-act'));
        const content = messageMain.querySelector('.message-content');
        if (content) content.insertAdjacentElement('afterend', bar); else messageMain.appendChild(bar);
        post.dataset.smgCardReady = '1';
    }
    function buildPostCards(roots) {
        if (!document.documentElement.classList.contains('smg-thread')) return;   // só em thread (onde há posts)
        eachIn(roots, 'article.message:not([data-smg-card]), article.message[data-smg-card-ready="skip"]', post => {
            const inner = post.querySelector(':scope > .message-inner, .message-inner');
            const main = inner && (inner.querySelector(':scope > .message-cell--main, .message-cell--main') || post.querySelector('.message-cell--main'));
            if (inner && main) {
                buildPostCard(post, inner, main);
            } else if (document.readyState === 'complete' || document.readyState === 'interactive') {
                post.dataset.smgCard = '1';
                post.dataset.smgCardReady = 'skip';
            }
        });
    }

    // COMENTÁRIOS (uw_fcs, só no SMG): mesmo modelo do post — header compacto (avatar · user · tempo · #N),
    // body, action bar leve (react · responder · ⋯ citar/denunciar/traduzir/share). Indentação (thread-line) via CSS.
    // MOVE os nativos (preserva AJAX); reusa o popover ⋯ do post (smg-pc-more*). 1×/comentário via data-smg-cc.
    // cinner: achado por buildCommentCards (comentário sem ele fica nativo lá)
    function buildCommentCard(comment, cinner) {
        comment.dataset.smgCc = '1';
        delete comment.dataset.smgCcReady;
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
        const react = footerBar && footerBar.querySelector('.actionBar-action--reaction, .actionBar-action--like, [data-xf-click="reaction"], a.reaction, a[href*="/react"]');
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
        if (moreItems.length) bar.appendChild(smgMoreMenu(moreItems, 'smg-cc-act'));
        const body = comment.querySelector('.comment-body');
        if (body) body.insertAdjacentElement('afterend', bar); else (comment.querySelector('.js-quickEditTargetComment') || cinner).appendChild(bar);
        comment.dataset.smgCcReady = '1';
    }
    function buildCommentCards(roots) {
        if (!document.documentElement.classList.contains('smg-thread')) return;
        eachIn(roots, '.message-responses .comment:not([data-smg-cc]), .message-responses .comment[data-smg-cc-ready="skip"]', comment => {
            const cinner = comment.querySelector(':scope > .comment-inner, .comment-inner');
            if (cinner) {
                buildCommentCard(comment, cinner);
            } else if (document.readyState === 'complete' || document.readyState === 'interactive') {
                comment.dataset.smgCc = '1';
                comment.dataset.smgCcReady = 'skip';
            }
        });
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
            buildThreadHeader,
            unifyThreadHeader,
            createStickySync,
            decorateThreadCard,
            decorateWatchedThreadRow,
            buildPostCard,
            buildPostCards,
            buildCommentCard,
            buildCommentCards,
            get isStreamingWatched() { return isStreamingWatched; },
            set isStreamingWatched(v) { isStreamingWatched = v; },
            get syncStuck() { return window.syncStuck; }
        };
        window.syncStuck = window.syncStuck || null;
        window.createStickySync = createStickySync;
        window.unifyThreadHeader = unifyThreadHeader;
        window.buildThreadHeader = buildThreadHeader;
    }
