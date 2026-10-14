'use strict';
// In-memory IndexedDB for the jsdom pages. Implements the subset the userscript uses:
// open/upgrade, object stores with keyPath, indexes, get/put/delete/clear/count, cursors
// (continue/update/delete) over stores and indexes, key ranges and transaction completion.
// A Backing object outlives a page, so two pages (tabs) or a reload can share one database.

const clone = v => (v === undefined ? undefined : structuredClone(v));

function cmp(a, b) {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    const sa = String(a), sb = String(b);
    return sa < sb ? -1 : sa > sb ? 1 : 0;
}

class KeyRange {
    constructor(lower, upper, lowerOpen, upperOpen) {
        this.lower = lower; this.upper = upper; this.lowerOpen = !!lowerOpen; this.upperOpen = !!upperOpen;
    }
    includes(key) {
        if (this.lower !== undefined) {
            const c = cmp(key, this.lower);
            if (c < 0 || (c === 0 && this.lowerOpen)) return false;
        }
        if (this.upper !== undefined) {
            const c = cmp(key, this.upper);
            if (c > 0 || (c === 0 && this.upperOpen)) return false;
        }
        return true;
    }
    static only(v) { return new KeyRange(v, v, false, false); }
    static bound(l, u, lo, uo) { return new KeyRange(l, u, lo, uo); }
    static upperBound(u, open) { return new KeyRange(undefined, u, false, open); }
    static lowerBound(l, open) { return new KeyRange(l, undefined, open, false); }
}

class Backing {
    constructor() { this.dbs = new Map(); this.pending = new Map(); }
    db(name) {
        if (!this.dbs.has(name)) this.dbs.set(name, { version: 0, stores: new Map() });
        return this.dbs.get(name);
    }
    // test helpers: read or seed a store without going through the page
    rows(dbName, store) {
        const st = this.db(dbName).stores.get(store);
        return st ? Array.from(st.data.values()).map(clone) : [];
    }
    // rows for a store: written now if the page already created it, else as soon as the page's
    // own upgrade creates it (so the store gets the page's real keyPath and indexes)
    seed(dbName, store, rows) {
        const st = this.db(dbName).stores.get(store);
        if (st) { rows.forEach(r => st.data.set(r[st.keyPath], clone(r))); return; }
        const key = dbName + '/' + store;
        this.pending.set(key, (this.pending.get(key) || []).concat(rows));
    }
    _created(dbName, store, raw) {
        const key = dbName + '/' + store;
        (this.pending.get(key) || []).forEach(r => raw.data.set(r[raw.keyPath], clone(r)));
        this.pending.delete(key);
    }
}

function install(window, backing) {
    const later = fn => window.setTimeout(fn, 0);

    class Request {
        constructor(tx) { this.tx = tx; this.result = undefined; this.error = null; this.onsuccess = null; this.onerror = null; if (tx) tx._pending++; }
        _succeed(value) {
            later(() => {
                this.result = value;
                try { if (this.onsuccess) this.onsuccess({ target: this, type: 'success' }); } catch (e) { /* page code error */ }
                if (this.tx) this.tx._done();
            });
        }
    }

    class Transaction {
        constructor(db, names, mode) {
            this.db = db; this.names = names; this.mode = mode;
            this._pending = 0; this._finished = false;
            this.oncomplete = null; this.onerror = null; this.onabort = null;
            later(() => this._maybeComplete());
        }
        objectStore(name) {
            const st = this.db._raw.stores.get(name);
            if (!st) throw new Error('NotFoundError: ' + name);
            return new ObjectStore(this, name, st);
        }
        _done() { this._pending--; later(() => this._maybeComplete()); }
        _maybeComplete() {
            if (this._finished || this._pending > 0) return;
            this._finished = true;
            try { if (this.oncomplete) this.oncomplete({ target: this }); } catch (e) { /* page code error */ }
        }
        abort() { this._finished = true; if (this.onabort) this.onabort({ target: this }); }
    }

    // A cursor keeps its transaction alive only while the page asks for the next row: when the
    // success handler returns without continue(), the request is settled, as in a real browser.
    function makeCursor(req, entries, store, dir) {
        let i = 0;
        const list = dir === 'prev' || dir === 'prevunique' ? entries.slice().reverse() : entries;
        const step = () => {
            while (i < list.length && store.data.get(list[i].pk) === undefined) i++;
            if (i >= list.length) { req._succeed(null); return; }
            const { pk } = list[i++];
            let continued = false;
            const cursor = {
                key: pk, primaryKey: pk, value: clone(store.data.get(pk)),
                continue: () => { continued = true; step(); },
                update: v => { store.data.set(v[store.keyPath], clone(v)); return new Request(null); },
                delete: () => { store.data.delete(pk); return new Request(null); },
            };
            later(() => {
                req.result = cursor;
                try { if (req.onsuccess) req.onsuccess({ target: req, type: 'success' }); } catch (e) { /* page code error */ }
                if (!continued && req.tx) req.tx._done();
            });
        };
        return step;
    }

    class ObjectStore {
        constructor(tx, name, raw) { this.tx = tx; this.name = name; this._raw = raw; this.keyPath = raw.keyPath; }
        get indexNames() { const raw = this._raw; return { contains: n => raw.indexes.has(n), length: raw.indexes.size }; }
        createIndex(name, keyPath) { this._raw.indexes.set(name, keyPath); return {}; }
        deleteIndex(name) { this._raw.indexes.delete(name); }
        get(key) { const r = new Request(this.tx); r._succeed(clone(this._raw.data.get(key))); return r; }
        getAll() { const r = new Request(this.tx); r._succeed(Array.from(this._raw.data.values()).map(clone)); return r; }
        put(value) {
            const key = value[this._raw.keyPath];
            this._raw.data.set(key, clone(value));
            const r = new Request(this.tx); r._succeed(key); return r;
        }
        add(value) { return this.put(value); }
        delete(key) {
            if (key instanceof KeyRange) { for (const k of Array.from(this._raw.data.keys())) if (key.includes(k)) this._raw.data.delete(k); }
            else this._raw.data.delete(key);
            const r = new Request(this.tx); r._succeed(undefined); return r;
        }
        clear() { this._raw.data.clear(); const r = new Request(this.tx); r._succeed(undefined); return r; }
        count() { const r = new Request(this.tx); r._succeed(this._raw.data.size); return r; }
        openCursor(range, dir) {
            const keys = Array.from(this._raw.data.keys()).filter(k => !range || (range instanceof KeyRange ? range.includes(k) : cmp(k, range) === 0)).sort(cmp);
            const r = new Request(this.tx);
            makeCursor(r, keys.map(pk => ({ pk })), this._raw, dir)();
            return r;
        }
        index(name) {
            const keyPath = this._raw.indexes.get(name);
            if (keyPath === undefined) throw new Error('NotFoundError: index ' + name);
            const raw = this._raw, tx = this.tx;
            const entries = range => Array.from(raw.data.entries())
                .map(([pk, v]) => ({ pk, ik: v[keyPath] }))
                .filter(e => e.ik !== undefined && e.ik !== null && (!range || (range instanceof KeyRange ? range.includes(e.ik) : cmp(e.ik, range) === 0)))
                .sort((a, b) => cmp(a.ik, b.ik) || cmp(a.pk, b.pk));
            return {
                openCursor: (range, dir) => { const r = new Request(tx); makeCursor(r, entries(range), raw, dir)(); return r; },
                count: range => { const r = new Request(tx); r._succeed(entries(range).length); return r; },
                get: key => { const r = new Request(tx); const e = entries(KeyRange.only(key))[0]; r._succeed(e ? clone(raw.data.get(e.pk)) : undefined); return r; },
                getAll: range => { const r = new Request(tx); r._succeed(entries(range).map(e => clone(raw.data.get(e.pk)))); return r; },
            };
        }
    }

    class Database {
        constructor(name, raw) { this.name = name; this._raw = raw; this.onversionchange = null; }
        get version() { return this._raw.version; }
        get objectStoreNames() { const raw = this._raw; return { contains: n => raw.stores.has(n), length: raw.stores.size }; }
        createObjectStore(name, opts) {
            const raw = { keyPath: (opts && opts.keyPath) || 'id', indexes: new Map(), data: new Map() };
            this._raw.stores.set(name, raw);
            backing._created(this.name, name, raw);
            return new ObjectStore(this._upgradeTx, name, raw);
        }
        deleteObjectStore(name) { this._raw.stores.delete(name); }
        transaction(names, mode) { return new Transaction(this, [].concat(names), mode || 'readonly'); }
        close() {}
    }

    window.IDBKeyRange = KeyRange;
    window.indexedDB = {
        open(name, version) {
            const req = new Request(null);
            req.onupgradeneeded = null; req.onblocked = null;
            later(() => {
                const raw = backing.db(name);
                const db = new Database(name, raw);
                const oldVersion = raw.version;
                if (version && version > oldVersion) {
                    raw.version = version;
                    const tx = new Transaction(db, Array.from(raw.stores.keys()), 'versionchange');
                    db._upgradeTx = tx;
                    req.transaction = tx;
                    req.result = db;
                    try { if (req.onupgradeneeded) req.onupgradeneeded({ target: req, oldVersion, newVersion: version }); } catch (e) { /* page code error */ }
                }
                req.result = db;
                later(() => { try { if (req.onsuccess) req.onsuccess({ target: req }); } catch (e) { /* page code error */ } });
            });
            return req;
        },
        deleteDatabase(name) { backing.dbs.delete(name); const r = new Request(null); r._succeed(undefined); return r; },
    };
}

module.exports = { Backing, install };
