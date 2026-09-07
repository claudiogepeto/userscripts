    // =========================================================
    // FEED SYNC — modern, relational & anti-rate-limit sync engine.
    // Reads `followed` table and feeds `timeline`
    // following the 3 strict rules.
    // =========================================================
    let timelineSyncRunning = false;
    const currentThreadIngestInflight = new Map();
    const currentThreadIngestSignatures = new Map();

    function extractPostMediaUrls(body) {
        if (!body || !body.querySelectorAll) return [];
        const urls = new Set();
        body.querySelectorAll('img, video, video source, source').forEach(media => {
            const u = media.getAttribute('data-src') || media.getAttribute('data-url') || media.getAttribute('data-original') || media.getAttribute('src') || '';
            if (u && !/^data:/i.test(u) && /^https?:/i.test(u)) urls.add(u);
        });
        return Array.from(urls);
    }

    function currentThreadDomSignature(path, page) {
        const posts = Array.from(document.querySelectorAll('article.message--post, .message--post')).filter(isThreadPostElement);
        const title = document.querySelector('h1.p-title-value, .p-title-value, h1.contentRow-header, .p-body-header .p-title');
        const parts = ['title:' + (title ? (title.textContent || '').replace(/\s+/g, ' ').trim() : '')];
        posts.forEach(post => {
            const body = post.querySelector('.message-userContent, .bbWrapper, .message-body');
            if (!body) return;
            const id = post.getAttribute('data-content') || post.id || '';
            const time = post.querySelector('.message-attribution time, .message-date time, time.u-dt') || null;
            const stamp = time ? (time.getAttribute('data-timestamp') || time.getAttribute('data-time') || time.getAttribute('datetime') || '') : '';
            const text = (body.textContent || '').replace(/\s+/g, ' ').trim();
            const media = extractPostMediaUrls(body);
            parts.push(id + ':' + stamp + ':' + text.length + ':' + text.slice(0, 48) + ':' + text.slice(-48) + ':' + media.join(','));
        });
        return path + '|' + page + '|' + parts.join('|');
    }

    // =========================================================
    // 2. INGEST CURRENT THREAD PAGE (Rule 1: Organic Browsing)
    // =========================================================
    function ingestCurrentThreadPageIfFollowed() {
        if (!/\/threads\//.test(location.pathname)) return Promise.resolve(0);

        const canon = document.querySelector('link[rel="canonical"]');
        let rawHref = (canon && canon.getAttribute('href')) || location.href;
        const path = canonicalThreadPath(rawHref);
        if (!path) return Promise.resolve(0);

        if (typeof dbFollowedMarkSeen === 'function') {
            dbFollowedMarkSeen(path).catch(() => {});
        }

        // Check date order: skip if user is sorting by reactions
        const isDateOrder = !/[?&]order=reaction/i.test(location.search);
        if (!isDateOrder) return Promise.resolve(0);

        // Determine current page
        let currentPage = 1;
        const pageMatch = location.pathname.match(/\/page-(\d+)/) || rawHref.match(/\/page-(\d+)/);
        if (pageMatch) {
            currentPage = parseInt(pageMatch[1], 10) || 1;
        } else if (typeof readPageJump === 'function') {
            const pj = readPageJump();
            if (pj && pj.cur) currentPage = pj.cur;
        }

        // Max page on DOM
        let maxPageOnDom = currentPage;
        document.querySelectorAll('a[href*="/page-"]').forEach(a => {
            const m = (a.getAttribute('href') || '').match(/\/page-(\d+)/);
            if (m) maxPageOnDom = Math.max(maxPageOnDom, parseInt(m[1], 10) || 1);
        });

        // Watch status
        const watchBtn = typeof getWatchButton === 'function' ? getWatchButton() : document.querySelector('.buttonGroup a[data-sk-watch][data-sk-unwatch]');
        const isWatching = (typeof smgIsWatching === 'function' && watchBtn) ? smgIsWatching(watchBtn) : false;
        const ingestKey = path + '|page:' + currentPage;
        if (currentThreadIngestInflight.has(ingestKey)) return currentThreadIngestInflight.get(ingestKey);
        const domSignature = currentThreadDomSignature(path, currentPage) + '|watch:' + (isWatching ? '1' : '0');
        if (currentThreadIngestSignatures.get(ingestKey) === domSignature) return Promise.resolve(0);

        const run = dbFollowedGet(path).then(stored => {
            if (!stored && !isWatching) return 0;

            const savedPages = (stored && Array.isArray(stored.saved_pages)) ? stored.saved_pages : [];
            const lastPage = (stored && stored.last_page) || 1;
            const isNewPage = !savedPages.includes(currentPage);
            const isAtOrBeyondLast = currentPage >= lastPage;

            if (!isNewPage && !isAtOrBeyondLast) {
                return 0; // Already ingested and not at/beyond last page
            }

            // Extract thread title and prefixes
            const titleEl = document.querySelector('h1.p-title-value, .p-title-value, h1.contentRow-header, .p-body-header .p-title');
            const fallbackTitle = (stored && stored.thread_name) || '';
            const titleMeta = extractCleanTitleAndPrefixes(titleEl, fallbackTitle);
            const threadTitle = titleMeta.title;
            const prefixesHtml = titleMeta.prefixesHtml;

            // Extract thumbnail
            let thumb = (stored && stored.thumbnail_url) || '';
            if (!thumb) {
                const thEl = document.querySelector('.dcThumbnail img, .dtt-thread-thumbnail img');
                if (thEl) {
                    const bg = (thEl.style.backgroundImage || '').match(/url\(\s*["']?([^"')]+)/i);
                    thumb = (bg && bg[1]) || thEl.getAttribute('data-src') || thEl.getAttribute('src') || '';
                }
            }
            if (!thumb && typeof thumbCacheGet === 'function') {
                thumb = thumbCacheGet(path, threadTitle) || '';
            }

            const meta = { title: threadTitle, prefixesHtml: prefixesHtml, thumb: thumb, lastTs: Math.floor(Date.now() / 1000) };

            const postEls = Array.from(document.querySelectorAll('article.message--post, .message--post'))
                .filter(p => isThreadPostElement(p) && p.querySelector && (p.querySelector('.message-userContent') || p.querySelector('.bbWrapper') || p.querySelector('.message-body')));

            const parsed = postEls.map(p => riverParsePost(p, meta, location.href)).filter(Boolean);
            if (!parsed.length) return 0;

            const now = Math.floor(Date.now() / 1000);
            let maxPostTs = (stored && stored.updated_at) || 0;

            const seenPostIds = new Set();
            const timelinePosts = [];
            parsed.forEach(p => {
                const pid = String(p.postId);
                if (!pid || seenPostIds.has(pid)) return;
                seenPostIds.add(pid);

                let finalTs = Math.floor(Number(p.ts));
                if (!finalTs || isNaN(finalTs) || finalTs <= 0) finalTs = now;
                if (finalTs > maxPostTs) maxPostTs = finalTs;

                const mediaUrls = p.mediaUrls || [];

                timelinePosts.push({
                    post_id: pid,
                    thread_path: path,
                    thread_name: p.threadTitle || threadTitle,
                    author: p.author || '',
                    author_href: p.authorHref || '',
                    created_at: finalTs,
                    content_html: p.contentHtml || '',
                    permalink: p.permalink || (path + '#post-' + p.postId),
                    media_urls: mediaUrls,
                    prefixes_html: p.prefixesHtml || prefixesHtml,
                    thread_thumb: p.threadThumb || thumb
                });
            });

            // Update saved_pages
            const nextSavedPages = Array.from(new Set([...savedPages, currentPage])).sort((a, b) => a - b);
            const nextLastPage = Math.max(lastPage, currentPage, maxPageOnDom);

            const followedRec = {
                path: path,
                thread_name: threadTitle || (stored && stored.thread_name) || '',
                thumbnail_url: thumb || (stored && stored.thumbnail_url) || '',
                tags: (stored && stored.tags) || ((typeof extractRowBadges === 'function') ? extractRowBadges(document).map(b => ({ name: b.name, className: b.className })) : []),
                followed_at: (stored && stored.followed_at) || now,
                forum_activity_ts: (stored && stored.forum_activity_ts) || 0,
                last_seen_at: Math.max((stored && stored.last_seen_at) || 0, maxPostTs, now),
                updated_at: Math.max((stored && stored.updated_at) || 0, maxPostTs),
                created_at: (stored && stored.created_at) || 0,
                author: (stored && stored.author) || '',
                last_page: nextLastPage,
                saved_pages: nextSavedPages,
                last_sync_at: now,
                unread: false
            };

            return dbTimelinePutPosts(timelinePosts)
                .then(() => dbFollowedUpsert(followedRec))
                .then(() => timelinePosts.length);
        }).catch(() => 0);
        currentThreadIngestInflight.set(ingestKey, run);
        return run.then(result => {
            currentThreadIngestSignatures.set(ingestKey, domSignature);
            return result;
        }).finally(() => currentThreadIngestInflight.delete(ingestKey));
    }

    // =========================================================
    // 3. SMART TIMELINE SYNC (Rules A, B, C & D)
    // =========================================================
    function syncThreadPage(thread, pageNum) {
        const url = thread.path + (pageNum > 1 ? `page-${pageNum}` : '');
        return fetchDoc(url, { credentials: 'same-origin' }).then(doc => {
            if (!doc) return 0;
            const meta = riverThreadMeta(doc, { fallbackTitle: thread.thread_name, thumb: thread.thumbnail_url });
            const postEls = Array.from(doc.querySelectorAll('article.message--post, .message--post'))
                .filter(p => isThreadPostElement(p) && p.querySelector && (p.querySelector('.message-userContent') || p.querySelector('.bbWrapper') || p.querySelector('.message-body')));

            const parsed = postEls.map(p => riverParsePost(p, meta, url)).filter(Boolean);
            if (!parsed.length) return 0;

            const now = Math.floor(Date.now() / 1000);
            let maxPostTs = thread.updated_at || 0;

            const seenPostIds = new Set();
            const timelinePosts = [];

            parsed.forEach(p => {
                const pid = String(p.postId);
                if (!pid || seenPostIds.has(pid)) return;
                seenPostIds.add(pid);

                let finalTs = Math.floor(Number(p.ts));
                if (!finalTs || isNaN(finalTs) || finalTs <= 0) finalTs = thread.updated_at || now;
                if (finalTs > maxPostTs) maxPostTs = finalTs;

                const mediaUrls = p.mediaUrls || [];

                timelinePosts.push({
                    post_id: pid,
                    thread_path: thread.path,
                    thread_name: p.threadTitle || thread.thread_name,
                    author: p.author || '',
                    author_href: p.authorHref || '',
                    created_at: finalTs,
                    content_html: p.contentHtml || '',
                    permalink: p.permalink || (thread.path + '#post-' + p.postId),
                    media_urls: mediaUrls,
                    prefixes_html: p.prefixesHtml || '',
                    thread_thumb: p.threadThumb || thread.thumbnail_url || ''
                });
            });

            // Detect max page
            let docMaxPage = pageNum;
            doc.querySelectorAll('a[href*="/page-"]').forEach(a => {
                const m = (a.getAttribute('href') || '').match(/\/page-(\d+)/);
                if (m) docMaxPage = Math.max(docMaxPage, parseInt(m[1], 10) || 1);
            });

            const nextSavedPages = Array.from(new Set([...(thread.saved_pages || []), pageNum])).sort((a, b) => a - b);
            const nextLastPage = Math.max(thread.last_page || 1, pageNum, docMaxPage);

            thread.saved_pages = nextSavedPages;
            thread.last_page = nextLastPage;
            thread.last_sync_at = Math.max(thread.last_sync_at || 0, maxPostTs, thread.forum_activity_ts || 0, thread.updated_at || 0);
            thread.updated_at = Math.max(thread.updated_at || 0, maxPostTs);
            if (!thread.last_seen_at) {
                thread.last_seen_at = thread.updated_at;
                thread.unread = false;
            } else {
                thread.unread = Boolean(thread.updated_at > thread.last_seen_at);
            }

            return dbTimelinePutPosts(timelinePosts)
                .then(() => dbFollowedUpsert(thread))
                .then(() => timelinePosts.length);
        }).catch(() => 0);
    }

    function decideThreadFetch(thread, lastTimelineRunTs) {
        if (!thread) return null;
        const saved = Array.isArray(thread.saved_pages) ? thread.saved_pages : [];
        const maxSaved = saved.length ? Math.max(...saved) : 0;
        const lastPage = thread.last_page || 1;
        const lastActivity = thread.forum_activity_ts || thread.updated_at || 0;
        const lastSync = thread.last_sync_at || 0;
        const isUnread = Boolean(thread.unread || (thread.last_seen_at !== undefined && (thread.updated_at || 0) > 0 && (thread.last_seen_at || 0) < (thread.updated_at || 0)));

        const isNew = maxSaved === 0;
        const hasNewPage = lastPage > maxSaved;
        const hasSamePageUpdates = isUnread || (lastActivity > lastSync) || (lastActivity > (lastTimelineRunTs || 0));

        if (isNew || hasNewPage || hasSamePageUpdates) {
            return {
                thread: thread,
                targetPage: lastPage,
                reason: isNew ? 'new' : (hasNewPage ? 'newPage' : (isUnread ? 'unread' : 'updatedPage'))
            };
        }
        return null;
    }

    const CRON_MIN_INTERVAL_MS = 5 * 60 * 1000;   // 5 minutos (300.000 ms)
    const CRON_MAX_INTERVAL_MS = 15 * 60 * 1000;  // 15 minutos (900.000 ms)
    let currentCronIntervalMs = CRON_MIN_INTERVAL_MS;
    let cronConsecutive429 = 0;
    let lastBackoffAppliedTs = 0;

    function applyCronBackoff(reason) {
        const now = Date.now();
        if (now - lastBackoffAppliedTs < 60000) {
            scheduleNextCron(currentCronIntervalMs);
            return;
        }
        lastBackoffAppliedTs = now;
        cronConsecutive429++;
        if (cronConsecutive429 === 1) {
            currentCronIntervalMs = 10 * 60 * 1000; // 10 min
        } else {
            currentCronIntervalMs = CRON_MAX_INTERVAL_MS; // 15 min teto
        }
        console.warn(`[SMG Timeline] HTTP 429 detectado. Processo de sincronização interrompido imediatamente. Próxima tentativa em ${Math.round(currentCronIntervalMs / 60000)} minutos.`);
        scheduleNextCron(currentCronIntervalMs);
    }

    function resetCronBackoff() {
        cronConsecutive429 = 0;
        currentCronIntervalMs = CRON_MIN_INTERVAL_MS;
        lastBackoffAppliedTs = 0;
    }

    function scheduleNextCron(delayMs) {
        if (timelineCronTimer) {
            clearTimeout(timelineCronTimer);
            timelineCronTimer = null;
        }
        timelineCronTimer = setTimeout(cronRefreshFollowedAndTimeline, delayMs);
    }

    if (typeof window !== 'undefined') {
        window.applyCronBackoff = applyCronBackoff;
        window.resetCronBackoff = resetCronBackoff;
    }

    let isCronRunning = false;
    let timelineCronTimer = null;

    function cronRefreshFollowedAndTimeline() {
        if (isCronRunning || timelineSyncRunning) {
            scheduleNextCron(currentCronIntervalMs);
            return Promise.resolve(0);
        }
        isCronRunning = true;
        const cycleStartTs = Date.now();

        const refreshFollowed = (typeof fetchAndIngestFollowed === 'function')
            ? fetchAndIngestFollowed()
            : Promise.resolve(0);

        return refreshFollowed.catch(() => 0).then(() => {
            return syncTimeline().then(added => {
                const n = added || 0;
                try {
                    window.dispatchEvent(new CustomEvent('smg-timeline-sync-done', { detail: { added: n } }));
                } catch (e) {}
                return n;
            });
        }).catch(() => 0).finally(() => {
            isCronRunning = false;
            const had429 = (typeof window !== 'undefined' && window.__lastRateLimitTs && window.__lastRateLimitTs >= cycleStartTs);
            if (had429) {
                applyCronBackoff('rate-limit');
            } else {
                resetCronBackoff();
            }
            scheduleNextCron(currentCronIntervalMs);
        });
    }

    const TIMELINE_CRON_INTERVAL_MS = CRON_MIN_INTERVAL_MS;

    function startTimelineCron() {
        if (timelineCronTimer) return;
        timelineCronTimer = setTimeout(cronRefreshFollowedAndTimeline, currentCronIntervalMs);
    }

    function syncTimeline(opts) {
        opts = opts || {};
        if (typeof riverPauseUntil !== 'undefined' && Date.now() < riverPauseUntil) {
            const waitSec = Math.ceil((riverPauseUntil - Date.now()) / 1000);
            console.warn(`[SMG Timeline] Cooldown de rate limit ativo. Próxima sincronização bloqueada por mais ${waitSec}s.`);
            return Promise.resolve(0);
        }
        if (typeof riverAborted !== 'undefined') riverAborted = false;
        if (typeof window !== 'undefined') window.__riverAborted = false;

        if (timelineSyncRunning) return Promise.resolve(0);
        timelineSyncRunning = true;
        const now = Math.floor(Date.now() / 1000);

        return dbMetaGet('lastTimelineRunTs').then(lastRunTs => {
            const lastTimelineRunTs = lastRunTs || 0;

            return dbFollowedGetAll().then(allFollowed => {
                if (!allFollowed || !allFollowed.length) {
                    if (typeof riverEmptyState === 'function') {
                        const emptyMsg = (typeof IS_PT !== 'undefined' && IS_PT)
                            ? 'Nenhum tópico seguido cadastrado na tabela'
                            : 'No followed threads found in database';
                        riverEmptyState(emptyMsg);
                    }
                    return 0;
                }

                // Ordena por atividade recente decrescente
                allFollowed.sort((a, b) => ((b.forum_activity_ts || b.updated_at || 0) - (a.forum_activity_ts || a.updated_at || 0)));

                // Filtra segundo as Regras A, B, C e D
                const threadsToFetch = [];
                allFollowed.forEach(thread => {
                    const decision = decideThreadFetch(thread, lastTimelineRunTs);
                    if (decision) {
                        threadsToFetch.push(decision);
                    }
                });

                const queue = threadsToFetch.slice(0, 8);
                console.log('[SMG Timeline] ' + allFollowed.length + ' seguidos no banco | ' + queue.length + ' tópicos com atualizações para buscar');
                if (!queue.length) {
                    return dbMetaSet('lastTimelineRunTs', now).then(() => 0);
                }

                let added = 0;
                let done = 0;
                let timelineSyncAborted = false;
                const total = queue.length;

                if (opts.onProgress) {
                    try { opts.onProgress({ step: 'posts', added: 0, done: 0, total: total }); } catch (e) {}
                }

                const delayMs = (typeof window !== 'undefined' && window.__TEST_MODE__) ? 10 : 1200;
                let p = Promise.resolve();
                queue.forEach((item, idx) => {
                    p = p.then(() => {
                        if ((typeof riverAborted !== 'undefined' && riverAborted) || timelineSyncAborted) return 0;
                        return syncThreadPage(item.thread, item.targetPage).then(n => {
                            if ((typeof riverAborted !== 'undefined' && riverAborted) || timelineSyncAborted) return 0;
                            added += (n || 0);
                            done++;
                            if (opts.onProgress) {
                                try { opts.onProgress({ step: 'posts', added: added, done: done, total: total }); } catch (e) {}
                            }
                            if (opts.onBatch) {
                                try { opts.onBatch(n || 0); } catch (e) {}
                            }
                            // Respiro calmo de 1.2s antes do próximo tópico
                            if (idx < queue.length - 1 && !riverAborted && !timelineSyncAborted) {
                                return new Promise(res => setTimeout(res, delayMs));
                            }
                            return n;
                        }).catch(() => 0);
                    });
                });
                return p.then(() => {
                    if (!riverAborted && !timelineSyncAborted) {
                        return dbMetaSet('lastTimelineRunTs', now);
                    }
                }).then(() => {
                    console.log('[SMG Timeline] Sincronização finalizada! Total de novos posts adicionados: ' + added);
                    try {
                        window.dispatchEvent(new CustomEvent('smg-timeline-sync-done', { detail: { added: added } }));
                    } catch (e) {}
                    return added;
                });
            });
        }).then(added => {
            const cutoff = Math.floor(Date.now() / 1000) - RIVER_RETENTION_DAYS * 86400;
            return dbTimelinePrune(cutoff).then(() => added);
        }).finally(() => {
            timelineSyncRunning = false;
        });
    }

    if (typeof window !== 'undefined' && window.__TEST_MODE__) {
        window.__feedSyncExports = {
            decideThreadFetch,
            extractPostMediaUrls,
            syncTimeline,
            syncThreadPage,
            cronRefreshFollowedAndTimeline,
            startTimelineCron,
            TIMELINE_CRON_INTERVAL_MS,
            CRON_MIN_INTERVAL_MS,
            CRON_MAX_INTERVAL_MS,
            applyCronBackoff,
            resetCronBackoff,
            scheduleNextCron,
            get currentCronIntervalMs() { return currentCronIntervalMs; },
            set currentCronIntervalMs(v) { currentCronIntervalMs = v; },
            get cronConsecutive429() { return cronConsecutive429; },
            set cronConsecutive429(v) { cronConsecutive429 = v; },
            get lastBackoffAppliedTs() { return lastBackoffAppliedTs; },
            set lastBackoffAppliedTs(v) { lastBackoffAppliedTs = v; },
            get isCronRunning() { return isCronRunning; },
            set isCronRunning(v) { isCronRunning = v; },
            get timelineSyncRunning() { return timelineSyncRunning; },
            set timelineSyncRunning(v) { timelineSyncRunning = v; },
            get timelineCronTimer() { return timelineCronTimer; },
            set timelineCronTimer(v) { timelineCronTimer = v; }
        };
    }
