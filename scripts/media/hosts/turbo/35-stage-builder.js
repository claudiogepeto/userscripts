    /* ===================== STAGE BUILDER ===================== */
    let mediaMounted = false;
    function buildStage() {
        if (document.querySelector(".tb-stage")) return document.querySelector(".tb-stage");
        const id = vidId();
        const titleEl = document.getElementById("videoTitle");
        if (!id || !titleEl) return null;
        const name = (titleEl.textContent || "").replace(/\s+/g, " ").trim();
        const imagePage = IMAGE_NAME.test(name);
        const sizeEl = document.getElementById("videoSize");
        const viewsEl = document.getElementById("videoViews");
        const size = sizeEl ? (sizeEl.textContent || "").trim() : "";
        const views = viewsEl ? (viewsEl.textContent || "").trim() : "";
        const albumA = document.querySelector('a[href*="/a/"]');
        const dlA = document.getElementById("btnDownload") || document.querySelector('a[href*="/d/"]');

        const stage = el("div", { class: "tb-stage " + (imagePage ? "is-image" : "is-video") + (isSidebarCollapsed ? " is-sidebar-collapsed" : "") });
        const main = el("div", { class: "tb-stage-main" });

        // ---- vrow (topbar) ----
        const vrow = el("div", { class: "tb-vrow" });
        const vtop = el("div", { class: "tb-vrow-top" });
        const logo = el("a", { class: "tb-top-logo", href: "/", title: "Turbo" },
            el("img", { class: "tb-logo-img", src: location.origin + "/static/favicon.svg", alt: "Turbo" }),
            el("span", null, "Turbo")
        );
        const nameEl = el("div", { class: "tb-name", title: name });
        nameEl.insertAdjacentHTML("beforeend", imagePage ? IC.image : IC.video);
        nameEl.append(el("span", null, name));
        vtop.append(logo, nameEl);

        const vsub = el("div", { class: "tb-vrow-sub" });
        const stats = el("div", { class: "tb-stats" });
        if (size) stats.append(el("span", { class: "tb-stat" }, size));
        if (views) stats.append(el("span", { class: "tb-stat" }, views));
        vsub.append(stats, el("div", { class: "tb-spacer" }));

        // Botão Playlist (visível apenas quando a sidebar estiver fechada)
        const plBtn = el("button", {
            type: "button",
            class: "tb-item tb-vrow-playlist" + (!isSidebarCollapsed ? " is-active" : ""),
            title: "Abrir / fechar playlist (p)",
            onClick: () => toggleSidebar()
        });
        plBtn.insertAdjacentHTML("beforeend", IC.playlist);
        plBtn.append(el("span", null, "Playlist"));
        vsub.append(plBtn);

        vrow.append(vtop, vsub);

        // ---- mid (player) ----
        const mid = el("div", { class: "tb-stage-mid" });
        const navPrev = el("button", { class: "tb-nav-side tb-nav-prev", title: "Anterior", onClick: e => { e.stopPropagation(); navFile(-1); } });
        navPrev.insertAdjacentHTML("beforeend", IC.chevL);
        const navNext = el("button", { class: "tb-nav-side tb-nav-next", title: "Próximo", onClick: e => { e.stopPropagation(); navFile(1); } });
        navNext.insertAdjacentHTML("beforeend", IC.chevR);
        mid.append(navPrev, navNext);

        main.append(vrow, mid);
        stage.appendChild(main);

        stage._cur = { name, href: location.pathname + location.search, thumb: "" };

        document.body.insertBefore(stage, document.body.firstChild);
        document.documentElement.classList.add("tb-has-stage");

        if (imagePage) mountPhoto(mid, id);
        else mountVideo(mid, id);

        // Monta Sidebar da Playlist
        setupSidebar(stage);

        watchRelated();
        return stage;
    }
