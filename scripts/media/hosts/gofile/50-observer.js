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
    const isOwnNode = n => n.nodeType !== 1 || (n.classList && (n.classList.contains("gf-group-header") || n.classList.contains("gf-gallery-actionbar") || (n.classList.contains("gf-card") && !!n._gf && n.isConnected)));
    const isOwnRecord = r => {
        if ((stage && stage.contains(r.target)) || (bulkBar && bulkBar.contains(r.target)) || (folderBar && folderBar.bar.contains(r.target))) return true;
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
        // ?q= é a busca da barra de ações (replaceState a cada tecla), não uma rota nova.
        try { const u = new URL(href); u.searchParams.delete("position"); u.searchParams.delete("q"); return u.pathname + u.search + u.hash; } catch { return href; }
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
    onHistoryChange(onRoute);
    window.addEventListener("hashchange", onRoute);

    function start() {
        buildTopbar();
        observeRoot();
        scan();
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
