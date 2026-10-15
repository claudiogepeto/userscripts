    /* ===================== PASTA COM 1 ARQUIVO → PLAYER ===================== */
    // Pula a lista e abre o único arquivo (/d/) direto no player, com a playlist recolhida SÓ nessa abertura
    // (marca one-shot em sessionStorage; prefs.sidebarCollapsed não é gravado). location.replace tira a pasta
    // do histórico, e a pasta só abre sozinha 1× por aba: quem volta pela Galeria / voltar vê a lista → sem loop.
    // Só age sem query string e sem links de paginação, para não confundir a última página de uma pasta grande.
    const SINGLE_OPEN_KEY = "fl_single_open";
    const SINGLE_DONE_KEY = "fl_single_done:";
    const fileSlugOf = p => (String(p || "").match(/\/d\/([^/?#]+)/) || [])[1] || "";
    function openSingleItemFolder() {
        const folderId = (PATH.match(/\/f\/([^/?#]+)/) || [])[1];
        if (!folderId || location.search) return false;
        try { if (sessionStorage.getItem(SINGLE_DONE_KEY + folderId)) return false; } catch {}
        try { const nav = performance.getEntriesByType("navigation")[0]; if (nav && nav.type === "back_forward") return false; } catch {}
        const list = document.querySelector(".files-list");
        if (!list || document.querySelector('a[href*="page="]')) return false;
        const items = list.querySelectorAll(".file-item");
        if (items.length !== 1) return false;
        const it = items[0];
        const a = it.matches('a[href*="/d/"]') ? it : it.querySelector('a[href*="/d/"]');
        if (!a) return false;
        let target;
        try { target = new URL(hrefWithPosition(a.getAttribute("href") || "", 1), location.origin); } catch { return false; }
        const slug = fileSlugOf(target.pathname);
        if (!slug || target.origin !== location.origin) return false;
        try { sessionStorage.setItem(SINGLE_OPEN_KEY, slug); sessionStorage.setItem(SINGLE_DONE_KEY + folderId, "1"); } catch {}
        location.replace(target.pathname + target.search + target.hash);
        return true;
    }
    // Página /d/ aberta por uma pasta de 1 arquivo: recolhe a sidebar só em memória (consome a marca).
    function takeSingleOpen() {
        try {
            const slug = sessionStorage.getItem(SINGLE_OPEN_KEY);
            if (!slug) return;
            sessionStorage.removeItem(SINGLE_OPEN_KEY);
            if (slug === fileSlugOf(PATH)) isSidebarCollapsed = true;
        } catch {}
    }
