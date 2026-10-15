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

        const logo = el("a", { class: "tb-top-logo", href: "/", title: "Turbo" },
            el("img", { class: "tb-logo-img", src: location.origin + "/static/favicon.svg", alt: "Turbo" }),
            el("span", { class: "tb-logo-text" }, "Turbo")
        );
        const { tabs, sort } = sidebarControls();
        const parts = buildMediaStage({
            kind: imagePage ? "image" : "video",
            name,
            stats: [size, views],
            logo,
            nav: navFile,
            collapsed: isSidebarCollapsed,
            galleryHref: albumA ? albumA.href : "",
            tabs,
            sort,
            onSearch: () => renderPlaylist()
        });
        const stage = parts.stage, mid = parts.mid;
        parts.sidebar._tabs = tabs;
        stSidebarEl = parts.sidebar;

        stage._cur = { name, href: location.pathname + location.search, thumb: "" };

        document.body.insertBefore(stage, document.body.firstChild);
        document.documentElement.classList.add("tb-has-stage");

        if (imagePage) mountPhoto(mid, id);
        else mountVideo(mid, id);

        renderPlaylist();

        watchRelated();
        return stage;
    }
