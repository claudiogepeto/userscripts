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

        const stage = el("div", { class: "fl-stage " + (isVid ? "is-video" : isTxt ? "is-text" : "is-image") + (isSidebarCollapsed ? " is-sidebar-collapsed" : "") });
        const main = el("div", { class: "fl-stage-main" });

        // ---- vrow (topbar) ----
        const vrow = el("div", { class: "fl-vrow" });
        const vtop = el("div", { class: "fl-vrow-top" });
        const mark = el("span", { class: "fl-logo-img" });
        mark.innerHTML = LOGO_SVG;
        const logo = el("a", { class: "fl-top-logo", href: "/", title: "Filester" },
            mark,
            el("span", null, "Filester")
        );
        const nameEl = el("div", { class: "fl-name", title: name });
        nameEl.insertAdjacentHTML("beforeend", isVid ? PL_ICONS.video : isTxt ? PL_ICONS.fileText : PL_ICONS.image);
        nameEl.append(el("span", null, name));
        vtop.append(logo, nameEl);

        const vsub = el("div", { class: "fl-vrow-sub" });
        const stats = el("div", { class: "fl-stats" });
        if (size) stats.append(el("span", { class: "fl-stat" }, size));
        stats.append(el("span", { class: "fl-stat" }, isVid ? "Vídeo" : isTxt ? "Texto" : "Imagem"));
        vsub.append(stats, el("div", { class: "fl-spacer" }));

        // Botão Playlist (visível apenas quando a sidebar estiver fechada)
        const plBtn = el("button", {
            type: "button",
            class: "fl-item fl-vrow-playlist" + (!isSidebarCollapsed ? " is-active" : ""),
            title: "Abrir / fechar playlist (p)",
            onClick: () => toggleSidebar()
        });
        plBtn.insertAdjacentHTML("beforeend", PL_ICONS.playlist);
        plBtn.append(el("span", null, "Playlist"));
        vsub.append(plBtn);

        vrow.append(vtop, vsub);

        // ---- mid (mídia) ----
        const mid = el("div", { class: "fl-stage-mid" });
        const navPrev = el("button", { class: "fl-nav-side fl-nav-prev", title: "Anterior", onClick: e => { e.stopPropagation(); navFile(-1); } });
        navPrev.insertAdjacentHTML("beforeend", PL_ICONS.chevL);
        const navNext = el("button", { class: "fl-nav-side fl-nav-next", title: "Próximo", onClick: e => { e.stopPropagation(); navFile(1); } });
        navNext.insertAdjacentHTML("beforeend", PL_ICONS.chevR);
        mid.append(navPrev, navNext);

        main.append(vrow, mid);
        stage.appendChild(main);

        let uuid = "";
        if (reportA) { const m = reportA.href.match(/file=([a-f0-9-]{8,})/i); if (m) uuid = m[1]; }
        if (!uuid) { const u = Array.from(document.querySelectorAll("main .font-mono")).map(e => (e.textContent || "").trim()).find(t => /^[a-f0-9-]{32,}$/i.test(t)); if (u) uuid = u; }
        stage._cur = { name, href: location.pathname + location.search, thumb: uuid ? (location.origin + "/t/" + uuid) : "", isVid };

        document.body.insertBefore(stage, document.body.firstChild);
        document.documentElement.classList.add("fl-has-stage");

        // Monta Sidebar da Playlist
        setupSidebar(stage);

        const grid = document.querySelector(".related-files-grid");
        if (grid) { try { new MutationObserver(() => renderPlaylist()).observe(grid, { childList: true }); } catch (e) {} }
        return stage;
    }
