    /* ===================== ÁLBUM COM 1 ARQUIVO → PLAYER ===================== */
    // Pula a grade e abre o único arquivo direto no player, com a playlist recolhida SÓ nessa abertura
    // (marca one-shot em sessionStorage; prefs.sidebarCollapsed não é gravado). location.replace tira o álbum
    // do histórico, e o álbum só abre sozinho 1× por aba: quem volta pela Galeria / voltar vê a grade → sem loop.
    const SINGLE_OPEN_KEY = "tb_single_open";
    const SINGLE_DONE_KEY = "tb_single_done:";
    function openSingleItemAlbum() {
        const albumId = (PATH.match(/\/a\/([^/?#]+)/) || [])[1];
        if (!albumId) return false;
        try { if (sessionStorage.getItem(SINGLE_DONE_KEY + albumId)) return false; } catch {}
        try { const nav = performance.getEntriesByType("navigation")[0]; if (nav && nav.type === "back_forward") return false; } catch {}
        const files = readPageFiles();
        const tbody = document.getElementById("fileTbody");
        const rows = tbody ? tbody.querySelectorAll("tr.file-row") : [];
        let href = "";
        if (files.length) {
            if (files.length !== 1 || rows.length > 1 || !files[0].id) return false;
            href = "/v/" + files[0].id;
        } else {
            if (rows.length !== 1) return false;
            const a = rows[0].querySelector('a[href*="/v/"]');
            href = a ? a.getAttribute("href") || "" : "";
        }
        let target;
        try { target = new URL(hrefWithPosition(href, 1), location.origin); } catch { return false; }
        const id = (target.pathname.match(/\/v\/([^/?#]+)/) || [])[1];
        if (!id || target.origin !== location.origin) return false;
        try { sessionStorage.setItem(SINGLE_OPEN_KEY, id); sessionStorage.setItem(SINGLE_DONE_KEY + albumId, "1"); } catch {}
        location.replace(target.pathname + target.search + target.hash);
        return true;
    }
    // Página de vídeo aberta por um álbum de 1 arquivo: recolhe a sidebar só em memória (consome a marca).
    function takeSingleOpen() {
        try {
            const id = sessionStorage.getItem(SINGLE_OPEN_KEY);
            if (!id) return;
            sessionStorage.removeItem(SINGLE_OPEN_KEY);
            if (id === vidId()) isSidebarCollapsed = true;
        } catch {}
    }
