    /* ===================== STAGE BUILDER ===================== */
    let mediaMounted = false;
    function buildStage() {
        if (document.querySelector(".fl-stage")) return document.querySelector(".fl-stage");
        const h1 = document.querySelector("main h1") || Array.from(document.querySelectorAll("h1")).find(h => !h.closest("header"));
        if (!h1) return null;

        const name = (h1.textContent || "").trim();
        const sizeEl = document.querySelector("main .text-neutral-400") || (h1.parentElement && h1.parentElement.querySelector(".text-neutral-400"));
        const size = sizeEl ? (sizeEl.textContent || "").replace(/\s+/g, " ").trim() : "";
        const reportA = document.querySelector('a[href*="/report"], a[href*="report?file"]');
        const dlBtn = document.getElementById("downloadButton") || document.querySelector('a[id*="download" i], .download-btn');
        const kind = findMediaKind();
        const isVid = kind === "video", isTxt = kind === "text";

        const mark = el("span", { class: "fl-logo-img" });
        mark.innerHTML = LOGO_SVG;
        const logo = el("a", { class: "fl-top-logo", href: "/", title: "Filester" }, mark, el("span", { class: "fl-logo-text" }, "Filester"));
        const galleryA = document.querySelector('a[href*="/f/"]');
        const { tabs, sort } = sidebarControls();
        const parts = buildMediaStage({
            kind,
            name,
            stats: [size, isVid ? "Vídeo" : isTxt ? "Texto" : "Imagem"],
            logo,
            nav: navFile,
            collapsed: isSidebarCollapsed,
            galleryHref: galleryA ? galleryA.href : "",
            tabs,
            sort,
            onSearch: () => renderPlaylist()
        });
        const stage = parts.stage;
        parts.sidebar._tabs = tabs;
        stSidebarEl = parts.sidebar;
        const typeStat = Array.from(stage.querySelectorAll(".fl-stat")).pop();
        if (typeStat) typeStat.classList.add("fl-stat-type");

        let uuid = "";
        if (reportA) { const m = reportA.href.match(/file=([a-f0-9-]{8,})/i); if (m) uuid = m[1]; }
        if (!uuid) { const u = Array.from(document.querySelectorAll("main .font-mono")).map(e => (e.textContent || "").trim()).find(t => /^[a-f0-9-]{32,}$/i.test(t)); if (u) uuid = u; }
        stage._cur = { name, href: location.pathname + location.search, thumb: uuid ? (location.origin + "/t/" + uuid) : "", isVid, kind };

        document.body.insertBefore(stage, document.body.firstChild);
        document.documentElement.classList.add("fl-has-stage");

        renderPlaylist();

        const grid = document.querySelector(".related-files-grid");
        if (grid) { try { new MutationObserver(() => renderPlaylist()).observe(grid, { childList: true }); } catch (e) {} }
        return stage;
    }
