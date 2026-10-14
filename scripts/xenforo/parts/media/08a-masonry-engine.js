    // =========================================================
    // MASONRY ENGINE: one layout for every media mosaic (in-post groups, gallery overlay)
    //
    // Shortest-column placement with absolute positioning. Each item is placed in the column that
    // is currently shortest, ties going left, so the order reads left to right, top to bottom as far
    // as a masonry allows (CSS columns would read top-down instead).
    //
    // Why absolute positioning and not grid-auto-rows spans: every item height comes from a known
    // aspect ratio times the column width, so a layout needs ONE number from the page (the container
    // width, delivered by ResizeObserver) and then only writes. The row-span grid would need the same
    // math plus hundreds of 1px implicit rows per group for the grid algorithm to resolve, and it
    // still places by row, not by shortest column. Nothing runs on scroll in either case.
    //
    // Cost model: one ResizeObserver for all containers (one observation per container, never per
    // item), one requestAnimationFrame for all dirty containers, reads batched before writes, and
    // each write skipped when the value did not change.
    // =========================================================
    const MASONRY_GAP = 8;                 // = --smg-sp-8
    const MASONRY_BP_TWO = 600;            // <= 600px wide: 2 columns
    const MASONRY_BP_THREE = 1100;         // <= 1100px wide: 3 columns, above: 4
    const MASONRY_PH_RELH = 1.3;           // placeholder height/width until the real ratio is known
    function masonryColsFor(width) {
        if (width <= MASONRY_BP_TWO) return 2;
        if (width <= MASONRY_BP_THREE) return 3;
        return 4;
    }
    // pure placement: ratios (h/w) + width -> boxes. No DOM, so it is testable and costs nothing to read.
    // opts.spans[i] = columns item i wants (a horizontal video wants 2), clamped to the column count. An item
    // spanning k columns starts at the column c that minimises max(height[c..c+k-1]), ties going left, sits at
    // that top, and pushes those k columns to its bottom. With every span at 1 this is plain shortest-column.
    function masonryPlace(ratios, width, opts) {
        const gap = (opts && opts.gap != null) ? opts.gap : MASONRY_GAP;
        const want = (opts && opts.cols) || masonryColsFor(width);
        const spansIn = (opts && opts.spans) || [];
        const spanOf = i => Math.max(1, Math.min(want, Math.floor(+spansIn[i]) || 1));
        let need = 0;
        for (let i = 0; i < ratios.length; i++) need += spanOf(i);
        const cols = Math.max(1, Math.min(want, need || 1));   // a small group uses only the columns its spans fill
        const colW = Math.max(0, (width - gap * (cols - 1)) / cols);
        const heights = new Array(cols).fill(0);
        const boxes = ratios.map((r, i) => {
            const k = Math.min(spanOf(i), cols);
            let c = 0, top = Infinity;
            for (let s = 0; s + k <= cols; s++) {
                let m = 0;
                for (let j = s; j < s + k; j++) if (heights[j] > m) m = heights[j];
                if (m < top - 0.5) { top = m; c = s; }
            }
            const w = colW * k + gap * (k - 1);
            const h = Math.max(1, Math.round(w * (r > 0 ? r : MASONRY_PH_RELH)));
            const box = { col: c, span: k, x: Math.round(c * (colW + gap)), y: Math.round(top), w: Math.round(w), h };
            for (let j = c; j < c + k; j++) heights[j] = top + h + gap;
            return box;
        });
        const height = Math.max(0, Math.round(Math.max.apply(null, heights) - gap));
        return { cols, colW, boxes, height };
    }

    // a video tile's span from its h/w: horizontal (wider than tall) takes 2 columns, vertical or square 1.
    // 0.98 and not 1: a "square" upload is often a few pixels off (1080x1072) and must not go wide.
    function masonryVideoSpan(relH) {
        return (relH > 0 && relH < 0.98) ? 2 : 1;
    }

    const masonryState = new WeakMap();    // container -> { width, getRatio, getSpan, gap }
    let masonryRO = null, masonRaf = 0, masonDirty = new Set();
    function masonryObserver() {
        if (masonryRO || typeof ResizeObserver === 'undefined') return masonryRO;
        masonryRO = new ResizeObserver(entries => {
            entries.forEach(en => {
                const st = masonryState.get(en.target);
                if (!st) return;
                const w = Math.round(en.contentRect.width);
                if (w === st.width) return;   // a height change (our own write) or nothing new
                st.width = w;
                masonryLayout(en.target);     // width is known here: lay out now, no extra frame of a stale grid
            });
        });
        return masonryRO;
    }
    // registers a container (idempotent). opts.getRatio(item) -> height/width of that item;
    // opts.getSpan(item) -> columns it wants (default 1).
    function masonryMount(container, opts) {
        if (!container) return;
        let st = masonryState.get(container);
        if (!st) {
            st = { width: 0 };
            masonryState.set(container, st);
            container.classList.add('smg-mason');
            const ro = masonryObserver();
            if (ro) ro.observe(container);
        }
        st.getRatio = (opts && opts.getRatio) || st.getRatio || (() => MASONRY_PH_RELH);
        st.getSpan = (opts && opts.getSpan) || st.getSpan || null;
        st.gap = (opts && opts.gap != null) ? opts.gap : (st.gap != null ? st.gap : MASONRY_GAP);
        masonrySchedule(container);
    }
    function masonryUnmount(container) {
        if (!container || !masonryState.has(container)) return;
        masonryState.delete(container);
        masonDirty.delete(container);
        if (masonryRO) masonryRO.unobserve(container);
    }
    // ratio changed / item added or removed -> one rAF for every dirty container
    function masonrySchedule(container) {
        if (!container || !masonryState.has(container)) return;
        masonDirty.add(container);
        if (masonRaf) return;
        masonRaf = requestAnimationFrame(() => {
            masonRaf = 0;
            const list = Array.from(masonDirty); masonDirty = new Set();
            // READS first (only containers that never got a width from the observer), then WRITES
            list.forEach(c => { const st = masonryState.get(c); if (st && !st.width && c.isConnected) st.width = Math.round(c.clientWidth || 0); });
            list.forEach(c => { if (c.isConnected) masonryLayout(c); });
        });
    }
    // writes only: positions from the cached width. A hidden container (width 0, e.g. a closed
    // spoiler) keeps its structure and is laid out when the observer reports a real width.
    function masonryLayout(container) {
        const st = masonryState.get(container);
        if (!st) return null;
        const items = Array.prototype.filter.call(container.children, c => c.nodeType === 1);
        const ratios = items.map(it => { try { return st.getRatio(it); } catch (e) { return MASONRY_PH_RELH; } });
        const spans = st.getSpan ? items.map((it, i) => { try { return st.getSpan(it, ratios[i]); } catch (e) { return 1; } }) : null;
        const res = masonryPlace(ratios, st.width, { gap: st.gap, spans });
        if (container.dataset.smgCols !== String(res.cols)) container.dataset.smgCols = res.cols;
        container.dataset.smgRelayoutDone = '1';
        if (!st.width) return res;
        items.forEach((it, i) => {
            const b = res.boxes[i];
            const key = b.x + ',' + b.y + ',' + b.w + ',' + b.h;
            if (it._smgMason === key) return;
            it._smgMason = key;
            it.style.setProperty('transform', 'translate(' + b.x + 'px,' + b.y + 'px)', 'important');
            it.style.setProperty('width', b.w + 'px', 'important');
            it.style.setProperty('height', b.h + 'px', 'important');
        });
        const hv = res.height + 'px';
        if (container.style.height !== hv) container.style.setProperty('height', hv, 'important');
        return res;
    }
    // ratio of an image-like item: loaded pixels, then pipeline/attribute dimensions, then the placeholder
    function masonryImgRatio(img) {
        if (!img) return MASONRY_PH_RELH;
        if (img.naturalWidth && img.naturalHeight) return img.naturalHeight / img.naturalWidth;
        const m = (img.style && img.style.aspectRatio || '').match(/([\d.]+)\D+([\d.]+)/);
        if (m && +m[1] && +m[2]) return (+m[2]) / (+m[1]);
        const w = +(img.getAttribute('width') || (img.dataset && img.dataset.width) || 0);
        const h = +(img.getAttribute('height') || (img.dataset && img.dataset.height) || 0);
        if (w > 0 && h > 0) return h / w;
        return MASONRY_PH_RELH;
    }
    if (typeof window !== 'undefined' && window.__TEST_MODE__) {
        window.__masonryEngine = { masonryPlace, masonryColsFor, masonryMount, masonryUnmount, masonryLayout, masonrySchedule, masonryImgRatio, setWidth: (c, w) => { const st = masonryState.get(c); if (st) st.width = w; } };
    }
