    /* ===================== SIDEBAR PLAYLIST (Estilo YouTube AMOLED) ===================== */
    let stSidebarEl = null;
    let isSidebarCollapsed = !!prefs.sidebarCollapsed;

    function toggleSidebar(forceState) {
        const stage = document.querySelector(".fl-stage");
        if (!stage) return;
        isSidebarCollapsed = typeof forceState === "boolean" ? forceState : !isSidebarCollapsed;
        prefs.sidebarCollapsed = isSidebarCollapsed;
        saveP();
        stage.classList.toggle("is-sidebar-collapsed", isSidebarCollapsed);
        const btn = stage.querySelector(".fl-vrow-playlist");
        if (btn) btn.classList.toggle("is-active", !isSidebarCollapsed);
    }

    function makeThumbPlaceholder(kind, ext) {
        const ph = el("div", { class: "fl-playlist-placeholder" });
        const iconSpan = el("span", { class: "fl-playlist-ph-icon" });
        iconSpan.innerHTML = kindSvg(kind);
        const badge = el("span", { class: "fl-playlist-ph-ext" }, (ext || kind || "FILE").toUpperCase().slice(0, 5));
        ph.append(iconSpan, badge);
        return ph;
    }

    function parseSidebarItems() {
        const stage = document.querySelector(".fl-stage");
        const cur = stage && stage._cur;
        const grid = document.querySelector(".related-files-grid");
        const related = grid ? Array.from(grid.querySelectorAll(":scope > .related-file-item, :scope > a.related-file-item")) : [];

        const items = [];
        if (cur) {
            items.push({
                name: cur.name,
                href: cur.href,
                thumb: cur.thumb,
                isCurrent: true,
                kind: cur.kind || (cur.isVid ? "video" : "image")
            });
        }
        related.forEach(it => {
            const href = it.getAttribute("href") || "#";
            const img = it.querySelector("img");
            const nameEl = it.querySelector(".related-file-name");
            const name = (nameEl ? nameEl.textContent : (img ? img.getAttribute("alt") : "") || "").trim();
            if (cur && cur.href && (href === cur.href || href === location.pathname)) return;
            const kind = getMediaKind(name);
            items.push({
                name,
                href,
                thumb: (img && (img.getAttribute("src") || img.src)) || "",
                isCurrent: false,
                kind
            });
        });
        return items;
    }

    function renderPlaylist() {
        if (!stSidebarEl) return;
        const listEl = stSidebarEl.querySelector(".fl-playlist-list");
        if (!listEl) return;
        listEl.textContent = "";

        const allItems = parseSidebarItems();
        applyListPosition(allItems);
        const q = (stSidebarEl.querySelector(".fl-sidebar-search input")?.value || "").trim().toLowerCase();
        const activeTab = prefs.sidebarTab || "all";
        const stage = stSidebarEl.closest(".fl-stage");
        if (stage) {
            stage.classList.toggle("has-playlist", allItems.length > 0);
            stage.classList.toggle("has-nav", allItems.length > 1);
        }

        let filtered = allItems.filter(item => {
            if (q && item.name.toLowerCase().indexOf(q) === -1) return false;
            if (activeTab === "video" && item.kind !== "video") return false;
            if (activeTab === "image" && item.kind !== "image") return false;
            if (activeTab === "text" && item.kind !== "text") return false;
            return true;
        });

        filtered = mediaSortItems(filtered, sidebarSortMode(), prefs.sidebarSortDir || "desc", { name: it => it.name });

        const countEl = stSidebarEl.querySelector(".fl-sidebar-count");
        if (countEl) countEl.textContent = `${filtered.length} arquivos`;

        const tabs = stSidebarEl._tabs;
        if (tabs) tabs.update({
            all: allItems.length,
            video: allItems.filter(i => i.kind === "video").length,
            image: allItems.filter(i => i.kind === "image").length,
            text: allItems.filter(i => i.kind === "text").length
        });

        if (!filtered.length) {
            listEl.innerHTML = `<div class="fl-playlist-empty">Nenhum item encontrado.</div>`;
            return;
        }

        filtered.forEach((item, idx) => {
            const dt = extractDateFromTitle(item.name);
            const cleanTitle = cleanTitleWithoutDate(item.name, dt);

            const card = el("a", {
                class: "fl-playlist-item" + (item.isCurrent ? " is-current" : ""),
                href: hrefWithPosition(item.href, idx + 1),
                title: item.name
            });

            const thumbWrap = el("div", { class: "fl-playlist-thumb-wrap" });
            const extMatch = (item.name || "").match(/\.([a-z0-9]{1,5})$/i);
            const ext = extMatch ? extMatch[1] : item.kind;

            if (item.thumb) {
                const img = el("img", { class: "fl-playlist-thumb", src: item.thumb, alt: "", loading: "lazy" });
                img.onerror = () => {
                    img.remove();
                    if (!thumbWrap.querySelector(".fl-playlist-placeholder")) {
                        thumbWrap.prepend(makeThumbPlaceholder(item.kind, ext));
                    }
                };
                thumbWrap.appendChild(img);
            } else {
                thumbWrap.appendChild(makeThumbPlaceholder(item.kind, ext));
            }

            const kindLabel = item.kind === "video" ? "Video" : item.kind === "image" ? "Imagem" : "Arquivo";
            thumbWrap.appendChild(el("span", { class: "fl-playlist-kind" }, kindLabel));
            thumbWrap.appendChild(el("span", { class: "fl-playlist-num" }, String(idx + 1)));
            if (item.kind === "video") {
                let known = "";
                try { known = sessionStorage.getItem("fldur:" + (item.href || "").split("?")[0]) || ""; } catch {}
                const durEl = el("span", { class: "fl-playlist-dur" }, known);
                durEl.hidden = !known;
                thumbWrap.appendChild(durEl);
            }

            const info = el("div", { class: "fl-playlist-info" });
            info.append(el("span", { class: "fl-playlist-name" }, cleanTitle));

            // Metadados de data
            const datesWrap = el("div", { class: "fl-playlist-dates" });
            if (dt && dt.displayDate) {
                const tipEl = el("span", {
                    class: "fl-has-tip",
                    title: "Data identificada e extraída do nome do arquivo (definida no upload)"
                }, el("span", { class: "fl-tip-icon" }, "ⓘ"));
                datesWrap.appendChild(el("div", { class: "fl-playlist-date-row" },
                    el("span", { class: "fl-playlist-date-lbl" }, "Data extraída:"),
                    el("span", { class: "fl-playlist-date-val" }, dt.displayDate),
                    tipEl
                ));
            }
            if (datesWrap.childNodes.length) info.appendChild(datesWrap);

            if (item.isCurrent) {
                const meta = el("div", { class: "fl-playlist-meta" });
                meta.append(el("span", { class: "fl-playlist-meta-active" }, item.kind === "video" ? "Reproduzindo agora" : "Visualizando agora"));
                info.appendChild(meta);
            }

            card.append(thumbWrap, info);
            listEl.appendChild(card);
        });

        // Scroll auto para o item atual
        setTimeout(() => {
            const curItem = listEl.querySelector(".is-current");
            if (curItem) {
                try { curItem.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch { curItem.scrollIntoView(); }
            }
        }, 50);
    }

    // Modo salvo de versões antigas ("az") vira o A-Z das fichas do bunkr.
    function sidebarSortMode() {
        const m = prefs.sidebarSort || "default";
        return m === "az" ? "name" : m;
    }

    // Abas de tipo e fichas de ordenação da sidebar (sem "Data de Envio": o filester não informa a data de upload).
    function sidebarControls() {
        const tabs = mediaTypeTabs({
            active: prefs.sidebarTab || "all",
            onChange: key => { prefs.sidebarTab = key; saveP(); renderPlaylist(); }
        });
        const sort = mediaSortChips({
            kind: "sidebar",
            mode: sidebarSortMode(),
            dirs: { [sidebarSortMode()]: prefs.sidebarSortDir || "desc" },
            chips: [
                { key: "default", label: "Padrão" },
                { key: "title", label: "Data Extraída", dir: true, title: "Ordenar por data extraída do nome" },
                { key: "name", label: "A-Z", dir: true, title: "Ordenar por nome" }
            ],
            onChange: (mode, dir) => { prefs.sidebarSort = mode; prefs.sidebarSortDir = dir; saveP(); renderPlaylist(); }
        });
        return { tabs, sort };
    }

    function navFile(dir) {
        const items = parseSidebarItems();
        if (items.length < 2) return;
        const curPath = location.pathname;
        let i = items.findIndex(it => {
            try { return new URL(it.href, location.origin).pathname === curPath; } catch (e) { return it.href === curPath; }
        });
        if (i < 0) i = 0;
        const ni = (i + dir + items.length) % items.length;
        const next = items[ni];
        if (next && next.href) location.href = hrefWithPosition(next.href, ni + 1);
    }

    function findMediaKind() {
        const v = document.querySelector("#videoContainer, .media-container, .video-container, video, #videoPlayer, #videoPlayOverlay");
        if (v) return "video";
        const i = document.querySelector(".image-container, .image-preview");
        if (i) return "image";
        const h1 = document.querySelector("main h1") || Array.from(document.querySelectorAll("h1")).find(h => !h.closest("header"));
        if (h1 && isVidName(h1.textContent)) return "video";
        if (h1 && isTxtName((h1.textContent || "").trim())) return "text";
        return "image";
    }
