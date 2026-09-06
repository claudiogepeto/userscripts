    // =========================================================
    // FEED DB (IndexedDB) — v5 moderno, relacional e anti-rate-limit.
    // Stores:
    //   - followed: keyPath 'path' (PK), indices: updated_at, created_at, author, thread_name
    //   - timeline: keyPath 'post_id' (PK), indices: thread_path, created_at
    //   - meta: keyPath 'key'
    //   - bookmarks: keyPath 'postId'
    // =========================================================
    const FDB_NAME = 'smg-feed';
    const FDB_VERSION = 6;
    let fdbPromise = null;

    function fdbOpen() {
        if (fdbPromise) return fdbPromise;
        fdbPromise = new Promise((resolve, reject) => {
            if (typeof indexedDB === 'undefined') { reject(new Error('no-indexeddb')); return; }
            const req = indexedDB.open(FDB_NAME, FDB_VERSION);
            req.onupgradeneeded = (e) => {
                const db = req.result;
                ['threads', 'posts'].forEach(oldStore => {
                    if (db.objectStoreNames.contains(oldStore)) {
                        try { db.deleteObjectStore(oldStore); } catch (err) {}
                    }
                });
                // Store followed
                if (!db.objectStoreNames.contains('followed')) {
                    const s = db.createObjectStore('followed', { keyPath: 'path' });
                    s.createIndex('updated_at', 'updated_at');
                    s.createIndex('created_at', 'created_at');
                    s.createIndex('author', 'author');
                    s.createIndex('thread_name', 'thread_name');
                }
                // Store timeline
                if (!db.objectStoreNames.contains('timeline')) {
                    const s = db.createObjectStore('timeline', { keyPath: 'post_id' });
                    s.createIndex('thread_path', 'thread_path');
                    s.createIndex('created_at', 'created_at');
                }
                // Store meta
                if (!db.objectStoreNames.contains('meta')) {
                    db.createObjectStore('meta', { keyPath: 'key' });
                }
                // Store bookmarks
                if (!db.objectStoreNames.contains('bookmarks')) {
                    db.createObjectStore('bookmarks', { keyPath: 'postId' });
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => {
                if (req.error && req.error.name === 'VersionError') {
                    try { indexedDB.deleteDatabase(FDB_NAME); } catch (e) {}
                }
                reject(req.error);
            };
        });
        return fdbPromise;
    }

    function fdbReq(r) { return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
    function fdbStore(name, mode) { return fdbOpen().then(db => db.transaction(name, mode).objectStore(name)); }

    // =========================================================
    // FOLLOWED STORE FUNCTIONS
    // =========================================================
    function dbFollowedGet(path) {
        if (!path) return Promise.resolve(null);
        return fdbStore('followed', 'readonly').then(st => fdbReq(st.get(path))).catch(() => null);
    }

    function dbFollowedGetAll() {
        return fdbOpen().then(db => new Promise((resolve, reject) => {
            const out = [];
            const tx = db.transaction('followed', 'readonly');
            const cur = tx.objectStore('followed').openCursor();
            cur.onsuccess = () => {
                const c = cur.result;
                if (!c) { resolve(out); return; }
                out.push(c.value);
                c.continue();
            };
            cur.onerror = () => reject(cur.error);
        })).catch(() => []);
    }

    function dbFollowedUpsert(item) {
        if (!item || !item.path) return Promise.resolve();
        return fdbStore('followed', 'readwrite').then(st => fdbReq(st.put(item))).catch(() => {});
    }

    function dbFollowedBulkUpsert(items) {
        if (!items || !items.length) return Promise.resolve(0);
        return fdbOpen().then(db => new Promise((resolve, reject) => {
            const tx = db.transaction('followed', 'readwrite');
            const st = tx.objectStore('followed');
            items.forEach(it => { if (it && it.path) st.put(it); });
            tx.oncomplete = () => resolve(items.length);
            tx.onerror = () => reject(tx.error);
        })).catch(() => 0);
    }

    function dbFollowedDelete(path) {
        if (!path) return Promise.resolve();
        return fdbOpen().then(db => new Promise(resolve => {
            const tx = db.transaction(['followed', 'timeline'], 'readwrite');
            tx.objectStore('followed').delete(path);
            const cur = tx.objectStore('timeline').index('thread_path').openCursor(IDBKeyRange.only(path));
            cur.onsuccess = () => {
                const c = cur.result;
                if (!c) return;
                c.delete();
                c.continue();
            };
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
        })).catch(() => {});
    }

    // =========================================================
    // TIMELINE STORE FUNCTIONS
    // =========================================================
    function dbTimelineGetRecent(limit, beforeTs, afterTs, seen) {
        return fdbOpen().then(db => new Promise((resolve, reject) => {
            const out = [];
            const idx = db.transaction('timeline', 'readonly').objectStore('timeline').index('created_at');
            const hasBefore = beforeTs != null && beforeTs > 0;
            const hasAfter = afterTs != null && afterTs > 0;
            const range = hasBefore && hasAfter ? IDBKeyRange.bound(afterTs, beforeTs, true, false)
                : hasBefore ? IDBKeyRange.upperBound(beforeTs)
                : hasAfter ? IDBKeyRange.lowerBound(afterTs, true)
                : null;
            const cur = idx.openCursor(range, 'prev');
            cur.onsuccess = () => {
                const c = cur.result;
                if (!c || (limit && out.length >= limit)) { resolve(out); return; }
                const val = c.value;
                const pid = val.post_id || val.postId;
                if (!(seen && seen.has(pid))) out.push(val);
                c.continue();
            };
            cur.onerror = () => reject(cur.error);
        })).catch(() => []);
    }

    function dbTimelinePutPosts(posts) {
        if (!posts || !posts.length) return Promise.resolve(0);
        return fdbOpen().then(db => new Promise((resolve, reject) => {
            const tx = db.transaction('timeline', 'readwrite');
            const st = tx.objectStore('timeline');
            posts.forEach(p => {
                if (p && (p.post_id || p.postId)) {
                    if (!p.post_id) p.post_id = p.postId;
                    if (!p.created_at) p.created_at = p.ts || 0;
                    st.put(p);
                }
            });
            tx.oncomplete = () => resolve(posts.length);
            tx.onerror = () => reject(tx.error);
        })).catch(() => 0);
    }

    function dbTimelineCount() {
        return fdbStore('timeline', 'readonly').then(st => fdbReq(st.count())).catch(() => 0);
    }

    function dbTimelinePrune(cutoff) {
        if (!cutoff) return Promise.resolve();
        return fdbOpen().then(db => new Promise(resolve => {
            const tx = db.transaction('timeline', 'readwrite');
            const cur = tx.objectStore('timeline').index('created_at').openCursor(IDBKeyRange.upperBound(cutoff, true));
            cur.onsuccess = () => {
                const c = cur.result;
                if (!c) return;
                c.delete();
                c.continue();
            };
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
        })).catch(() => {});
    }

    // =========================================================
    // META STORE FUNCTIONS
    // =========================================================
    function dbMetaGet(key) {
        return fdbStore('meta', 'readonly').then(st => fdbReq(st.get(key))).then(r => r ? r.val : undefined).catch(() => undefined);
    }

    function dbMetaSet(key, val) {
        return fdbStore('meta', 'readwrite').then(st => fdbReq(st.put({ key: key, val: val }))).catch(() => {});
    }

    // =========================================================
    // BOOKMARKS STORE FUNCTIONS
    // =========================================================
    function dbBookmarksGet() {
        return fdbOpen().then(db => new Promise((res, rej) => {
            const out = [];
            const cur = db.transaction('bookmarks', 'readonly').objectStore('bookmarks').openCursor();
            cur.onsuccess = () => { const c = cur.result; if (!c) { res(out); return; } out.push(c.value); c.continue(); };
            cur.onerror = () => rej(cur.error);
        })).catch(() => []);
    }

    function dbBookmarksPut(rec) {
        return fdbStore('bookmarks', 'readwrite').then(st => fdbReq(st.put(rec))).catch(() => {});
    }

    function dbBookmarksDelete(postId) {
        return fdbStore('bookmarks', 'readwrite').then(st => fdbReq(st.delete(String(postId)))).catch(() => {});
    }

    // =========================================================
    // RESET & VERSION HEAL
    // =========================================================
    function dbClearTimeline() {
        return fdbOpen().then(db => new Promise((resolve, reject) => {
            const tx = db.transaction(['timeline', 'meta', 'followed'], 'readwrite');
            tx.objectStore('timeline').clear();
            tx.objectStore('meta').delete('lastSync');
            const folStore = tx.objectStore('followed');
            const req = folStore.openCursor();
            req.onsuccess = () => {
                const cur = req.result;
                if (cur) {
                    const item = cur.value;
                    item.saved_pages = [];
                    cur.update(item);
                    cur.continue();
                }
            };
            tx.oncomplete = () => {
                try { gmSet('smg-river-wm-' + location.hostname, '0'); } catch (e) {}
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        }));
    }

    function dbClearFollowed() {
        return fdbOpen().then(db => new Promise((resolve, reject) => {
            const tx = db.transaction(['followed', 'meta'], 'readwrite');
            tx.objectStore('followed').clear();
            tx.objectStore('meta').delete('lastFollowedFullSync');
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        }));
    }

    function dbClearAllData() {
        return fdbOpen().then(db => new Promise(resolve => {
            const tx = db.transaction(['timeline', 'followed', 'meta'], 'readwrite');
            tx.objectStore('timeline').clear();
            const fStore = tx.objectStore('followed');
            const cur = fStore.openCursor();
            cur.onsuccess = () => {
                const c = cur.result;
                if (c) {
                    const rec = c.value;
                    rec.saved_pages = [];
                    rec.last_sync_at = 0;
                    c.update(rec);
                    c.continue();
                }
            };
            ['lastSync', 'lastDeepSync', 'backfillDone', 'lastTimelineRunTs'].forEach(k => tx.objectStore('meta').delete(k));
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
        })).catch(() => {});
    }

    function fdbEnsureVersion(version) {
        return dbMetaGet('dataVersion').then(v => {
            if (v === version) return false;
            return dbClearAllData().then(() => dbMetaSet('dataVersion', version)).then(() => true);
        }).catch(() => false);
    }

    function fdbResetSyncMarks() {
        return fdbOpen().then(db => new Promise(resolve => {
            const tx = db.transaction(['followed', 'meta'], 'readwrite');
            const fStore = tx.objectStore('followed');
            const cur = fStore.openCursor();
            cur.onsuccess = () => {
                const c = cur.result;
                if (c) {
                    const rec = c.value;
                    rec.saved_pages = [];
                    rec.last_sync_at = 0;
                    c.update(rec);
                    c.continue();
                }
            };
            ['lastSync', 'lastDeepSync', 'lastFollowedFullSync', 'backfillDone', 'lastTimelineRunTs'].forEach(k => tx.objectStore('meta').delete(k));
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
        })).catch(() => {});
    }

    function fdbEnsureSyncVersion(version) {
        return dbMetaGet('syncVersion').then(v => {
            if (v === version) return false;
            return fdbResetSyncMarks().then(() => dbMetaSet('syncVersion', version)).then(() => true);
        }).catch(() => false);
    }

    if (typeof window !== 'undefined' && window.__TEST_MODE__) {
        window.__feedDbExports = {
            fdbOpen,
            dbClearAllData,
            fdbResetSyncMarks,
            dbClearTimeline,
            dbClearFollowed,
            fdbEnsureVersion,
            dbFollowedGet,
            dbFollowedGetAll,
            dbFollowedUpsert,
            dbFollowedBulkUpsert,
            dbTimelinePutPosts,
            dbTimelineGetRecent,
            dbTimelineCount,
            dbMetaGet,
            dbMetaSet
        };
    }
