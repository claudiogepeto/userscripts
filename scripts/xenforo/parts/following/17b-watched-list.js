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

            if (path) dbFollowedDelete(path);

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

    function ingestWatchedPageToFollowed(doc, syncPages = false) {
        if (!doc) return Promise.resolve(0);
        const rows = doc.querySelectorAll('.structItem--thread');
        const signature = watchedPageSignature(doc, rows);
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
                const path = canonicalThreadPath(titleA.getAttribute('href'));
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
                if (!thumb) thumb = feedThumbUrl(it);
                if (!thumb) thumb = thumbCacheGet(path, title) || '';

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
                    unread: domUnread,
                    timeline_skip: timeline_skip
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
                    || prev.unread !== item.unread
                    || prev.timeline_skip !== item.timeline_skip;
                if (changed) itemsToUpsert.push(item);
                if (typeof followedSet !== 'undefined' && followedSet) {
                    followedSet.add(path);
                }

                if (syncPages) {
                    if (!timeline_skip && (forum_activity_ts > ((prev && prev.last_sync_at) || 0) || domUnread || last_page > ((prev && prev.last_page) || 1) || !(prev && prev.updated_at))) {
                        syncCandidates.push({ thread: item, page: last_page });
                    }
                }
            });

            const upsertPromise = itemsToUpsert.length ? dbFollowedBulkUpsert(itemsToUpsert).then(() => {
                indexFollowedThumbs(itemsToUpsert);
                return itemsToUpsert.length;
            }) : Promise.resolve(0);

            return upsertPromise.then(count => {
                if (syncPages && syncCandidates.length) {
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
                if (doc) {
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
    let watchedStreamScroll = null;
    const onWatchedPage = () => /\/watched\/threads(?:\/|$|\?)/.test(location.pathname) || /\/watched\/threads(?:\/|$|\?)/.test(location.href);
    function stopWatchedStream() {
        if (watchedStreamScroll) {
            window.removeEventListener('scroll', watchedStreamScroll);
            watchedStreamScroll = null;
        }
        isStreamingWatched = false;
        document.querySelectorAll('.js-replyNewMessageContainer > .structItem--thread, .block--messages .structItem--thread').forEach(el => el.remove());
    }
    async function streamAllWatchedPages() {
        if (isStreamingWatched) return;
        if (!onWatchedPage()) return;
        isStreamingWatched = true;

        // Só a lista de seguidos. .block-body também é o miolo do post, e o fallback
        // jogava as threads seguidas no fim da publicação depois de sair da página.
        const getContainer = () => {
            if (!onWatchedPage()) return null;
            return document.querySelector('.p-body-content .structItemContainer')
                || document.querySelector('.structItemContainer');
        };
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
                if (!onWatchedPage()) { stopWatchedStream(); return; }
                const curContainer = getContainer();
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
            if (!onWatchedPage()) { stopWatchedStream(); return; }
            if (isFetching || nextPage > maxPages || nextPage > 100) return;
            const scrollBottom = (window.innerHeight || (document.documentElement && document.documentElement.clientHeight) || 0) + (window.scrollY || window.pageYOffset || 0);
            const docHeight = Math.max((document.documentElement && document.documentElement.scrollHeight) || 0, (document.body && document.body.scrollHeight) || 0);
            if (docHeight - scrollBottom <= 600) {
                loadNextWatchedPage();
            }
        }

        watchedStreamScroll = onScrollWatched;
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
