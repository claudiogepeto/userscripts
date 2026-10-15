    /* ===================== CORE: ?position= NA URL (scripts/media/core/position.js) ===================== */
    function readPosition() {
        try { const n = parseInt(new URL(location.href).searchParams.get("position") || "", 10); return Number.isFinite(n) && n > 0 ? n : 0; } catch { return 0; }
    }
    function writePosition(n) {
        try {
            const u = new URL(location.href);
            if (String(u.searchParams.get("position") || "") === String(n)) return;
            u.searchParams.set("position", String(n));
            history.replaceState(history.state, "", u.pathname + u.search + u.hash);
        } catch {}
    }
    function hrefWithPosition(href, n) {
        try { const u = new URL(href, location.origin); u.searchParams.set("position", String(n)); return u.pathname + u.search + u.hash; } catch { return href; }
    }
    // Lista de arquivos com href: ?position=N manda para o N-ésimo; sem ?position grava a posição atual.
    function applyListPosition(items) {
        if (!items || !items.length) return;
        const want = readPosition();
        const curPath = location.pathname;
        const i = items.findIndex(it => {
            try { return new URL(it.href, location.origin).pathname === curPath; } catch (e) { return false; }
        });
        if (want && items[want - 1]) {
            let targetPath = "";
            try { targetPath = new URL(items[want - 1].href, location.origin).pathname; } catch (e) {}
            if (targetPath && targetPath !== curPath) {
                location.replace(hrefWithPosition(items[want - 1].href, want));
                return;
            }
        }
        if (i >= 0 && !want) history.replaceState(history.state, "", hrefWithPosition(location.href, i + 1));
    }
