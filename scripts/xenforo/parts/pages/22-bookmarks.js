    // =========================================================
    // BOOKMARKS como FEED — a página /account/bookmarks lista POSTS salvos (.contentRow → /posts/{id}/).
    // REPLACE TOTAL: esconde a visão nativa e mostra um feed com EXATAMENTE esses posts — parseia a lista (todas as
    // páginas), busca o conteúdo de cada post e renderiza com riverCard (mesmo visual do feed da home) + a nota do
    // bookmark. Reusa riverParsePost/riverThreadMeta/riverCard/riverEnqueue/fetchDoc (escopo do IIFE).
    // =========================================================
    function isBookmarksPage() {
        const t = document.documentElement.getAttribute('data-template') || '';
        return t.includes('bookmarks') || /\/account\/bookmarks|\/bookmarks\//i.test(location.pathname);
    }
    function bmNextLink(doc) {
        const a = doc.querySelector('a.pageNav-jump--next[href], link[rel="next"][href], a[rel="next"][href]');
        const h = a && a.getAttribute('href');
        if (!h) return null;
        try { return new URL(h, location.href).href; } catch (e) { return null; }
    }
    function bmCanonicalPostUrl(href) {
        if (!href) return '';
        try {
            const url = new URL(href, location.href);
            if (/\/bookmark\/?$/i.test(url.pathname)) {
                url.pathname = url.pathname.replace(/\/bookmark\/?$/i, '/');
                url.search = '';
                url.hash = '';
            }
            return url.href;
        } catch (e) { return href || ''; }
    }
    function bmIsActionOrBadgeLink(a) {
        if (!a) return true;
        if (a.closest && a.closest('.contentRow-extra, .contentRow-actions, .contentRow-minor')) return true;
        if (a.classList && (a.classList.contains('contentRow-badge') || a.classList.contains('menuTrigger') || a.classList.contains('button'))) return true;
        const h = a.getAttribute('href') || a.href || '';
        if (/\/account\/bookmarks|\/bookmarks\/\d+\/edit|bookmark-edit|bookmark-delete|\/bookmark\?/i.test(h)) return true;
        if (/\/posts\/\d+(?:\/bookmark)?(?:[/?#]|$)|\/threads\/(?:[^/?#\/]+\.)?\d+(?:\/bookmark)?(?:[/?#]|$)|(?:#)?post-\d+/i.test(h)) return false;
        const t = (a.textContent || '').trim().toLowerCase();
        if (/^(?:edit|editar|delete|excluir|salvo|saved|tópico|thread|post|mensagem)$/i.test(t)) return true;
        return false;
    }
    // parseia as linhas de bookmark de um doc → [{postId, postUrl, title, author, authorHref, thumb, note}]
    function bmParseRows(doc) {
        if (!doc) return [];
        const out = [], seen = new Set();
        doc.querySelectorAll('.contentRow, .structItem--bookmark, .structItem, .block-row').forEach(row => {
            const candidateLinks = Array.from(row.querySelectorAll('.contentRow-header a, .contentRow-title a, .structItem-title a, .contentRow-main a, a[href*="/posts/"], a[href*="/threads/"], a[href*="post-"]'))
                .filter(a => !bmIsActionOrBadgeLink(a));
            const titleA = candidateLinks.find(a => {
                const h = a.getAttribute('href') || a.href || '';
                return /\/posts\/|\/threads\/|post-/i.test(h);
            }) || candidateLinks[0];
            if (!titleA) return;

            const href = titleA.getAttribute('href') || titleA.href || '';
            const rawTitleFallback = (titleA.textContent || '').trim();

            let postId = null;
            const pm = href.match(/(?:\/posts\/|post-|#post-)(\d+)/);
            if (pm) {
                postId = pm[1];
            } else {
                const tm = href.match(/\/threads\/(?:[^\/]+\.)?(\d+)/);
                if (tm) postId = 't-' + tm[1];
            }
            if (!postId) return;
            if (seen.has(postId)) return; seen.add(postId);

            const titleContainer = titleA.parentElement || row.querySelector('.contentRow-header, .contentRow-title, .structItem-title');
            const titleMeta = extractCleanTitleAndPrefixes(titleContainer, rawTitleFallback);
            let title = titleMeta.title;
            if (!title || /^(?:tópico|thread|post|mensagem)$/i.test(title.trim())) {
                title = rawTitleFallback;
            }

            const av = row.querySelector('.contentRow-figure .avatar img, .contentRow-figure img, .avatar img, .structItem-cell--icon img');
            const thumb = (av && (av.getAttribute('data-src') || av.getAttribute('src') || '')) || '';
            const authorA = row.querySelector('.contentRow-minor a.username, .contentRow-minor a[href*="/members/"], .structItem-parts a.username, a.username, a[href*="/members/"]');
            const author = (authorA && authorA.textContent.trim()) || (row.querySelector('.contentRow-figure .avatar[title], .avatar[title]') || {}).title || '';
            let note = ((row.querySelector('.contentRow-snippet, .structItem-snippet') || {}).textContent || '').replace(/\s+/g, ' ').trim();
            if (/^no bookmark note\.?$/i.test(note)) note = '';
            const te = row.querySelector('.contentRow-minor time, .structItem-minor time, time');   // data do bookmark → ordenação (desc) e diff
            let bmTs = te ? (parseInt(te.getAttribute('data-timestamp') || te.getAttribute('data-time') || '0', 10) || 0) : 0;
            if (!bmTs && te) { const dt = te.getAttribute('datetime'); if (dt) { const ms = Date.parse(dt); if (!isNaN(ms)) bmTs = Math.floor(ms / 1000); } }
            let postUrl = bmCanonicalPostUrl(href);
            if (!postUrl) postUrl = postId.startsWith('t-') ? ('/threads/' + postId.slice(2) + '/') : ('/posts/' + postId + '/');
            out.push({ postId: postId, postUrl: postUrl, title: title, prefixesHtml: titleMeta.prefixesHtml, author: author, authorHref: authorA ? authorA.getAttribute('href') : '', thumb: /^data:/.test(thumb) ? '' : thumb, note: note, bmTs: bmTs });
        });
        return out;
    }
    // lista COMPLETA de bookmarks: página atual (document) + segue a paginação (sequencial)
    function bmFetchAllRows() {
        const rows = bmParseRows(document);
        const next = bmNextLink(document);
        if (!next) return Promise.resolve(rows);
        const seen = new Set(rows.map(r => r.postId));
        const walk = (url, depth) => fetchDoc(url, { credentials: 'same-origin' }).then(doc => {
            bmParseRows(doc).forEach(r => { if (!seen.has(r.postId)) { seen.add(r.postId); rows.push(r); } });
            const n = bmNextLink(doc);
            return (n && depth < 40) ? walk(n, depth + 1) : rows;
        }, () => rows);
        return walk(next, 1);
    }
    function bmFallbackPost(row) {
        const postUrl = bmCanonicalPostUrl(row.postUrl) || row.postUrl;
        return {
            postId: row.postId,
            ts: row.bmTs || Math.floor(Date.now() / 1000),
            author: row.author || '',
            authorHref: row.authorHref || '',
            threadTitle: row.title || i18n('Saved item'),
            prefixesHtml: '',
            threadThumb: row.thumb || '',
            permalink: postUrl,
            contentHtml: `<div class="smg-bm-fallback-text"><a href="${postUrl}" class="link link--external" target="_blank">${row.title || postUrl}</a></div>`
        };
    }
    // busca o conteúdo do post salvo → objeto serializável do riverParsePost (fallback se sumiu/erro)
    function bmFetchPost(row) {
        const postUrl = bmCanonicalPostUrl(row.postUrl) || row.postUrl;
        return fetchDoc(postUrl, { credentials: 'same-origin' }).then(doc => {
            if (!doc) return bmFallbackPost(row);
            let postEl = null;
            if (row.postId && row.postId.startsWith('t-')) {
                postEl = doc.querySelector('article.message--post, article.message, .message[data-content]');
            } else {
                postEl = doc.querySelector('article[data-content="post-' + row.postId + '"]') || doc.getElementById('js-post-' + row.postId)
                    || doc.querySelector('article.message--post');   // fallback: o /posts/{id}/ cai na página posicionada nesse post
            }
            if (!postEl) return bmFallbackPost(row);
            const meta = riverThreadMeta(doc, { fallbackTitle: row.title, thumb: row.thumb });
            return riverParsePost(postEl, meta, postUrl) || bmFallbackPost(row);
        }, () => bmFallbackPost(row));
    }
    // REMOVE dos salvos: busca o form de confirmação (/posts/{id}/bookmark?delete=1, sem AJAX → HTML) e submete via POST.
    // 2 passos = robusto ao contrato exato do XF (pega _xfToken + campos do próprio form). Resolve true no sucesso.
    function bmUnsave(postId) {
        const u = String(postId).startsWith('t-') ? ('/threads/' + String(postId).slice(2) + '/bookmark?delete=1') : ('/posts/' + postId + '/bookmark?delete=1');
        return fetchDoc(u, { credentials: 'same-origin' }).then(doc => {
            const form = doc.querySelector('form[action*="/bookmark"]') || doc.querySelector('form.block, form');
            if (!form) return false;
            const fd = new FormData();
            form.querySelectorAll('input[name], textarea[name], select[name]').forEach(i => { if (i.type !== 'submit' && i.name) fd.append(i.name, i.value); });
            if (!fd.has('delete')) fd.append('delete', '1');
            fd.set('_xfResponseType', 'json'); fd.append('_xfWithData', '1');
            let action; try { action = new URL(form.getAttribute('action') || u.replace('?delete=1', ''), location.href).href; } catch (e) { action = u.replace('?delete=1', ''); }
            return fetch(action, { method: 'POST', credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' }, body: fd })
                .then(r => r.ok ? r.json().catch(() => ({})) : null)
                .then(j => !!j && !(j.errors && j.errors.length));
        }, () => false).catch(() => false);
    }
    // card do feed (riverCard) + a nota do bookmark por cima do conteúdo + botão "remover dos salvos"
    function bmCard(obj, row) {
        const card = riverCard(obj, 0);   // wm=0 → nunca marca "novo"
        card.dataset.bmId = row.postId; card.dataset.bmTs = String(row.bmTs || 0);
        if (row.note) {
            const n = document.createElement('div'); n.className = 'smg-bm-note'; n.textContent = row.note;
            const c = card.querySelector('.smg-fp-content');
            if (c) card.insertBefore(n, c); else card.appendChild(n);
        }
        const rm = document.createElement('button');
        rm.type = 'button'; rm.className = 'smg-bm-remove'; rm.title = i18n('Remove from saved'); rm.setAttribute('aria-label', i18n('Remove from saved'));
        rm.innerHTML = ICONS.bookmarkRemove;
        rm.addEventListener('click', e => {
            e.preventDefault(); e.stopPropagation();
            if (rm.disabled) return; rm.disabled = true; rm.classList.add('is-busy');
            bmUnsave(row.postId).then(ok => {
                if (!ok) { rm.disabled = false; rm.classList.remove('is-busy'); return; }
                dbBookmarksDelete(row.postId);   // tira do cache → não volta na próxima abertura
                card.classList.add('smg-bm-leaving');   // some com animação e tira do DOM
                setTimeout(() => card.remove(), 260);
            });
        });
        const share = card.querySelector('.smg-fp-share');
        if (share && share.parentNode) share.parentNode.insertBefore(rm, share);   // antes do compartilhar (que fica na borda)
        else (card.querySelector('.smg-fp-head') || card).appendChild(rm);
        return card;
    }
    function bmCardFromRec(rec) {
        const obj = rec.obj && rec.obj.permalink
            ? { ...rec.obj, permalink: bmCanonicalPostUrl(rec.obj.permalink) || rec.obj.permalink }
            : rec.obj;
        return bmCard(obj, { postId: rec.postId, note: rec.note, bmTs: rec.bmTs });
    }
    // insere `node` (tem data-bm-ts) na lista mantendo ordem por bmTs DESC
    function bmPlaceByTs(list, node) {
        const ts = +(node.dataset.bmTs || 0);
        const kids = list.children;
        for (let i = 0; i < kids.length; i++) { if (ts > +(kids[i].dataset.bmTs || 0)) { list.insertBefore(node, kids[i]); return; } }
        list.appendChild(node);
    }
    let bmRendered = false;
    function markBookmarksPaintReady(list) {
        const feed = list && list.closest('#smg-bm-feed');
        if (feed) feed.dataset.smgPaintReady = '1';
    }
    // RENDER: pinta do CACHE na hora (sem "configurando"), depois revalida pela rede e faz o DIFF (remove os que saíram,
    // busca só os NOVOS, atualiza nota/ordem). Sem IndexedDB, dbBookmarksGet→[] e os put/delete viram no-op → cai no
    // comportamento antigo (busca tudo). O "Configurando…" só aparece quando NÃO há nada em cache (1ª vez).
    function renderBookmarksFeed(list) {
        if (bmRendered) return; bmRendered = true;
        dbBookmarksGet().then(cached => {
            if (!list.isConnected) return;
            const byId = Object.create(null); cached.forEach(c => { byId[c.postId] = c; });
            const hadCache = cached.length > 0;
            if (hadCache) {
                list.innerHTML = '';
                cached.slice().sort((a, b) => (b.bmTs || 0) - (a.bmTs || 0)).forEach(rec => { try { list.appendChild(bmCardFromRec(rec)); } catch (e) {} });
                markBookmarksPaintReady(list);
            } else {
                list.innerHTML = '<div class="smg-fp-setup"><span class="smg-fp-setup-spin"></span><div class="smg-fp-setup-title">' + i18n('Setting up your feed') + '</div><div class="smg-fp-setup-sub">' + i18n('Gathering posts…') + '</div></div>';
            }
            bmFetchAllRows().then(rows => {
                if (!list.isConnected) return;
                const live = Object.create(null); rows.forEach(r => { live[r.postId] = r; });
                // removidos dos salvos (em outro dispositivo/aba) → tira do cache e da tela (apenas se rows obtido com sucesso)
                if (rows.length > 0) {
                    cached.forEach(c => {
                        if (!live[c.postId]) {
                            dbBookmarksDelete(c.postId);
                            const el = list.querySelector('[data-bm-id="' + c.postId + '"]');
                            if (el) el.remove();
                        }
                    });
                }
                // atualiza nota/ordem dos já cacheados (barato)
                rows.forEach(r => { const c = byId[r.postId]; if (c && (c.note !== r.note || c.bmTs !== r.bmTs)) { c.note = r.note; c.bmTs = r.bmTs; dbBookmarksPut(c); } });
                const fresh = rows.filter(r => {
                    const c = byId[r.postId];
                    if (!c) return true;
                    // Auto-cura: se o cache foi gravado com erro/tópico quebrado/fallback, re-busca e atualiza
                    if (c.obj && (c.obj.threadTitle === 'Tópico' || c.obj.threadTitle === 'Thread' || !c.obj.threadTitle
                        || /\/bookmark\/?$/i.test(c.obj.permalink || '')
                        || (c.obj.contentHtml && c.obj.contentHtml.includes('smg-bm-fallback-text')))) {
                        return true;
                    }
                    return false;
                });
                if (!hadCache) { if (!rows.length) { list.innerHTML = '<div class="smg-fp-empty">' + i18n('No recent posts') + '</div>'; markBookmarksPaintReady(list); return; } list.innerHTML = ''; }
                if (!hadCache && !fresh.length) { list.innerHTML = '<div class="smg-fp-empty">' + i18n('No recent posts') + '</div>'; markBookmarksPaintReady(list); return; }
                const jobs = fresh.map(r => {
                    let ph = list.querySelector('[data-bm-id="' + r.postId + '"]');
                    if (!ph) {
                        ph = document.createElement('div'); ph.className = 'smg-bm-skel'; ph.dataset.bmId = r.postId; ph.dataset.bmTs = String(r.bmTs || 0);
                        bmPlaceByTs(list, ph);   // posição certa por bmTs (novos salvos = topo)
                    }
                    return riverEnqueue(() => bmFetchPost(r).then(obj => {
                        if (!ph.isConnected) return;
                        const postObj = obj || bmFallbackPost(r);
                        const rec = { postId: r.postId, obj: postObj, note: r.note, bmTs: r.bmTs };
                        dbBookmarksPut(rec);
                        try { ph.replaceWith(bmCardFromRec(rec)); } catch (e) { ph.remove(); }
                    }));
                });
                Promise.all(jobs).finally(() => markBookmarksPaintReady(list));
            }, () => {
                if (!hadCache && list.isConnected) list.innerHTML = '<div class="smg-fp-empty">' + i18n('No recent posts') + '</div>';
                markBookmarksPaintReady(list);
            });
        });
    }
    let bmBuilt = false;
    function setupBookmarksFeed() {
        if (!FEATURES.bookmarksFeed || !isBookmarksPage()) return;
        const contentCol = document.querySelector('.p-body-content, .p-body-main--withSideNav .p-body-content, .p-body-pageContent .p-body-content') || document.querySelector('.p-body-pageContent');
        if (!contentCol) return;
        if (bmBuilt || contentCol.querySelector('#smg-bm-feed')) {
            bmBuilt = true;
            return;
        }
        // REPLACE TOTAL: esconde a visão nativa inteira (barra de filtros + lista) e renderiza o feed no lugar dela.
        document.documentElement.classList.add('smg-bm-feed-on');   // CSS esconde a sidebar da conta + dá largura cheia
        contentCol.querySelectorAll('.block, .tabs, .block-filterBar, .pageNavWrapper, .pageNav').forEach(el => {
            el.style.setProperty('display', 'none', 'important');
        });
        bmBuilt = true;
        const feed = document.createElement('div'); feed.id = 'smg-bm-feed'; feed.dataset.smgPaintReady = '0';
        const list = document.createElement('div'); list.className = 'smg-fp-list'; feed.appendChild(list);
        contentCol.appendChild(feed);
        renderBookmarksFeed(list);
    }

    if (typeof window !== 'undefined' && window.__TEST_MODE__) {
        window.__bookmarkExports = {
            setupBookmarksFeed,
            bmParseRows,
            bmIsActionOrBadgeLink,
            bmFetchAllRows,
            bmFetchPost,
            bmFallbackPost,
            bmUnsave,
            isBookmarksPage,
            get bmBuilt() { return bmBuilt; },
            set bmBuilt(v) { bmBuilt = v; }
        };
    }
