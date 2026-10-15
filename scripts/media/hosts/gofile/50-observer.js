    /* ===================== OBSERVER & SPA ===================== */
    let scanQueued = false;
    function requestScan() {
        if (scanQueued) return;
        scanQueued = true;
        requestAnimationFrame(() => {
            scanQueued = false;
            buildTopbar();
            scan();
        });
    }

    // Observa só o container do app (não o <html> inteiro) e ignora mutações
    // causadas pelos próprios nós do script (stage, barra, cabeçalhos de grupo).
    // Um card já processado que continua no documento só foi movido pelo agrupamento.
    const isOwnNode = n => n.nodeType !== 1 || (n.classList && (n.classList.contains("gf-gallery-group-header") || (n.classList.contains("gf-card") && !!n._gf && n.isConnected)));
    const isOwnRecord = r => {
        if ((stage && stage.contains(r.target)) || (bulkBar && bulkBar.contains(r.target))) return true;
        if (!r.addedNodes.length && !r.removedNodes.length) return false;
        for (const n of r.addedNodes) if (!isOwnNode(n)) return false;
        for (const n of r.removedNodes) if (!isOwnNode(n)) return false;
        return true;
    };
    let rootObserver = null, observedRoot = null;
    function appRoot() {
        return document.getElementById("app") || document.getElementById("index_app") || document.body;
    }
    function observeRoot() {
        try {
            const rootTarget = appRoot();
            if (!rootTarget || (rootTarget === observedRoot && rootTarget.isConnected)) return;
            if (rootObserver) rootObserver.disconnect();
            observedRoot = rootTarget;
            rootObserver = new MutationObserver(recs => {
                for (const r of recs) {
                    if (isOwnRecord(r)) continue;
                    requestScan();
                    return;
                }
            });
            rootObserver.observe(rootTarget, { childList: true, subtree: true });
        } catch (e) {}
    }

    function routeKey(href) {
        try { const u = new URL(href); u.searchParams.delete("position"); return u.pathname + u.search + u.hash; } catch { return href; }
    }
    let lastHref = routeKey(location.href);
    function onRoute() {
        const key = routeKey(location.href);
        if (key === lastHref) return;
        lastHref = key;
        autoDismissedRoute = null;
        closeStage({ fromRoute: true });
        observeRoot();
        requestScan();
    }
    // Rotas SPA: envolve pushState/replaceState (+ popstate) em vez de checar a URL por intervalo.
    function onHistoryChange(fn) {
        const w = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
        const h = w.history;
        const fire = () => setTimeout(fn, 0);
        for (const m of ["pushState", "replaceState"]) {
            const orig = h[m];
            if (typeof orig !== "function") continue;
            const wrapped = function () { const r = orig.apply(this, arguments); fire(); return r; };
            try { h[m] = typeof exportFunction === "function" ? exportFunction(wrapped, w) : wrapped; } catch (e) {}
        }
        window.addEventListener("popstate", fire);
    }
    onHistoryChange(onRoute);
    window.addEventListener("hashchange", onRoute);

    function start() {
        buildTopbar();
        observeRoot();
        scan();
    }

    function onReady(fn) {
        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
        else fn();
    }
    onReady(() => {
        start();
        let n = 0;
        const id = setInterval(() => {
            observeRoot();
            buildTopbar();
            scan();
            if (++n > 30) clearInterval(id);
        }, 300);
    });
})();
