    // following/17b-watched-list.js
    // Owns: the followed-threads list (/watched/threads): rows, streaming of every page, ingest into the followed store.
    // Exposes: followedSet, fetchWatchedDoc, fetchAndIngestFollowed, streamAllWatchedPages, buildFilterBars.
    // Depends on: feed/06b-feed-db, thread/17a-filterbar, core/06-helpers.
    let followedSet = new Set();
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

    function decorateWatchedThreadRow(row) {
        if (!row) return;
        decorateThreadCard(row);
        if (row.querySelector('.smg-thread-unwatch-btn')) return;
        threadFollowButton(row, {
            isFollowed: true,
            threadIdsUnwatch: true,
            onUnfollowed: () => {
                row.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
                row.style.opacity = '0';
                row.style.transform = 'scale(0.92)';
                setTimeout(() => {
                    row.remove();
                    if (typeof window.smgReapplyFilters === 'function') window.smgReapplyFilters();   // dono do filtro da lista (12c)
                }, 240);
            }
        });
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
    // UM observer pra todos os botões Salvar (antes: um MutationObserver por post, nunca desconectado).
    // Cada botão guarda o próprio repaint em _smgPaintSaved.
    let savedButtonObs = null;
    function savedButtonObserver() {
        if (!savedButtonObs) {
            savedButtonObs = new MutationObserver(records => {
                records.forEach(r => { if (r.target._smgPaintSaved) r.target._smgPaintSaved(); });
            });
        }
        return savedButtonObs;
    }

    // registro do banco `followed` a partir de uma linha de listagem (fórum ou /watched/threads). prev = o já gravado.
    function followedRecordFromRow(it, path, prev, now) {
        const titleA = it.querySelector('.structItem-title a[href*="/threads/"]') || it.querySelector('.structItem-title a');
        const title = ((titleA && titleA.textContent) || '').replace(/\s+/g, ' ').trim();

        // thumbnail
        const thumb = threadThumbUrl(it) || thumbCacheGet(path, title) || '';   // só a da THREAD (nunca o avatar)

        const domUnread = it.classList.contains('is-unread') || it.classList.contains('structItem--unread');

        // tags / badges
        const badges = extractRowBadges(it);
        const tags = badges.map(b => ({ name: b.name, className: b.className }));
        const forumLink = it.querySelector('.structItem-parts a[href*="/forums/"], a[href*="/forums/"]');
        const forumName = forumLink ? (forumLink.textContent || '').replace(/\s+/g, ' ').trim() : '';
        const timeline_skip = timelineContentSkip(tags.map(t => t.name).concat(forumName));

        // forum_activity_ts
        const forum_activity_ts = structItemTs(it);

        // created_at
        const created_at = timeTs(it.querySelector('.structItem-cell--main time, .structItem-startDate time'));

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

        const effectiveUpdatedAt = (prev && prev.updated_at) || forum_activity_ts || 0;
        return {
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
            unread: domUnread,
            timeline_skip: timeline_skip
        };
    }

    function ingestWatchedPageToFollowed(doc) {
        if (!doc) return Promise.resolve(0);
        const rows = doc.querySelectorAll('.structItem--thread');
        const signature = watchedPageSignature(doc, rows);
        const now = Math.floor(Date.now() / 1000);
        if (watchedPageInflight.has(doc)) return watchedPageInflight.get(doc);
        if (watchedPageStates.get(doc) === signature) return Promise.resolve(0);
        if (!rows.length) {
            watchedPageStates.set(doc, signature);
            return Promise.resolve(0);
        }

        const run = dbFollowedGetAll().then(existingList => {
            const existingMap = new Map();
            (existingList || []).forEach(e => { if (e && e.path) existingMap.set(e.path, e); });

            const itemsToUpsert = [];
            const seenPaths = new Set();

            rows.forEach(it => {
                const titleA = it.querySelector('.structItem-title a[href*="/threads/"]') || it.querySelector('.structItem-title a');
                if (!titleA) return;
                const path = canonicalThreadPath(titleA.getAttribute('href'));
                if (!path || seenPaths.has(path)) return;
                seenPaths.add(path);
                const prev = existingMap.get(path);
                const item = followedRecordFromRow(it, path, prev, now);

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
                    || prev.unread !== item.unread
                    || prev.timeline_skip !== item.timeline_skip;
                if (changed) itemsToUpsert.push(item);
                followedSet.add(path);
            });

            return itemsToUpsert.length ? dbFollowedBulkUpsert(itemsToUpsert).then(() => {
                indexFollowedThumbs(itemsToUpsert);
                return itemsToUpsert.length;
            }) : Promise.resolve(0);
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
        const url = (navHref('watchedThreads', 'watched', 'watchedThreads2')) || '/watched/threads';
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

    function fetchAndIngestFollowed() {
        const now = Date.now();
        if (now - lastFollowedFetchTs < FOLLOWED_FETCH_MIN_INTERVAL_MS) {
            return Promise.resolve(0);
        }
        if (followedFetchInFlight) {
            return followedFetchInFlight;
        }
        lastFollowedFetchTs = now;
        console.log('[SMG Timeline] Buscando tópicos seguidos em segundo plano...');
        followedFetchInFlight = fetchWatchedDoc()
            .then(doc => {
                if (doc) {
                    return ingestWatchedPageToFollowed(doc).then(count => {
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
    const onWatchedPage = () => /\/watched\/threads(?:\/|$|\?)/.test(location.pathname) || /\/watched\/threads(?:\/|$|\?)/.test(location.href);
    function stopWatchedStream() {
        isStreamingWatched = false;
        document.querySelectorAll('.js-replyNewMessageContainer > .structItem--thread, .block--messages .structItem--thread').forEach(el => el.remove());
    }
    // /watched/threads: ingere e decora a página aberta. As PRÓXIMAS páginas vêm do loader comum
    // (setupInfiniteScroll, 07-posts-misc): separadores, pré-busca, URL e o toggle infiniteScrollWatched.
    function streamAllWatchedPages() {
        if (isStreamingWatched || !onWatchedPage()) return;
        const container = document.querySelector('.p-body-content .structItemContainer') || document.querySelector('.structItemContainer');
        if (!container) return;
        isStreamingWatched = true;
        ingestWatchedPageToFollowed(document);
        container.querySelectorAll('.structItem--thread').forEach(decorateWatchedThreadRow);
    }

    function buildFilterBars(roots) {
        if (location.pathname.includes('/watched/threads') || location.href.includes('/watched/threads')) {
            document.querySelectorAll('.pageNavWrapper:not([data-smg-hidden]), .pageNav:not([data-smg-hidden]), nav.pageNavWrapper:not([data-smg-hidden])').forEach(el => {
                el.style.setProperty('display', 'none', 'important');
                el.dataset.smgHidden = '1';
            });
            eachIn(roots, '.structItem--thread', decorateWatchedThreadRow);
            // o ingest da lista é do stream (1× pra página aberta + 1× por página buscada), não de cada
            // frame de mutação: as linhas que o stream anexa já foram ingeridas com o doc delas.
            streamAllWatchedPages();
            return;
        }
        document.querySelectorAll('.js-replyNewMessageContainer > .structItem--thread, .block--messages .structItem--thread').forEach(el => el.remove());
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
