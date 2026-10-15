    /* ==================================================================== * (4) SIDEBAR DA PLAYLIST (Estilo YouTube AMOLED) */
    let stSidebarEl = null;
    let isSidebarCollapsed = !!prefs.sidebarCollapsed;

    function toggleSidebar(forceState) {
        isSidebarCollapsed = typeof forceState === "boolean" ? forceState : !isSidebarCollapsed;
        prefs.sidebarCollapsed = isSidebarCollapsed;
        saveP();
        const row = document.querySelector(".file_preview_row");
        if (row) row.classList.toggle("pdx-sidebar-collapsed", isSidebarCollapsed);
        const btn = document.querySelector(".pdx-vrow-playlist");
        if (btn) btn.style.display = isSidebarCollapsed ? "inline-flex" : "none";
    }

    function makeThumbPlaceholder(kind, ext) {
        const ph = el("div", { class: "pdx-playlist-placeholder" });
        const iconSpan = el("span", { class: "pdx-playlist-ph-icon" });
        iconSpan.innerHTML = kindSvg(kind);
        const badge = el("span", { class: "pdx-playlist-ph-ext" }, (ext || kind || "FILE").toUpperCase().slice(0, 5));
        ph.append(iconSpan, badge);
        return ph;
    }

    function renderPlaylistCard(f, displayIdx) {
        const al = albumInfo();
        const curIdx = currentIndex();
        const isCurrent = f.origIdx === curIdx;
        const kind = getFileKind(f);
        const extMatch = (f.name || "").match(/\.([a-z0-9]{1,6})$/i);
        const ext = extMatch ? extMatch[1] : kind;

        const itemEl = el("div", {
            class: "pdx-playlist-item" + (isCurrent ? " is-current" : ""),
            title: f.name
        });

        // Thumbnail Wrap 16:9
        const thumbWrap = el("div", { class: "pdx-playlist-thumb-wrap" });
        const relThumb = `/api/file/${f.id}/thumbnail`;
        const absThumb = `https://pixeldrain.com/api/file/${f.id}/thumbnail`;

        if (kind === "video" || kind === "image") {
            const img = el("img", { class: "pdx-playlist-thumb", src: relThumb, alt: "", loading: "lazy" });
            img.onerror = () => {
                if (img.src !== absThumb) {
                    img.src = absThumb;
                    return;
                }
                img.remove();
                if (!thumbWrap.querySelector(".pdx-playlist-placeholder")) {
                    thumbWrap.prepend(makeThumbPlaceholder(kind, ext));
                }
            };
            thumbWrap.appendChild(img);
        } else {
            thumbWrap.appendChild(makeThumbPlaceholder(kind, ext));
        }

        const kindLabel = kind === "video" ? "Video" : kind === "image" ? "Imagem" : "Arquivo";
        thumbWrap.appendChild(el("span", { class: "pdx-playlist-kind" }, kindLabel));
        if (typeof displayIdx === "number") thumbWrap.appendChild(el("span", { class: "pdx-playlist-num" }, String(displayIdx + 1)));
        if (kind === "video" && f.id) {
            const known = cachedDur(f.id);
            const durEl = el("span", { class: "pdx-playlist-dur", hidden: known ? null : "" }, known || "");
            durEl.dataset.durKey = f.id;
            if (!known) durEl.hidden = true;
            thumbWrap.appendChild(durEl);
            probeDur(f.id, M().file(f.id), thumbWrap);
        }

        // Info: Título Limpo e Datas Formatadas
        const info = el("div", { class: "pdx-playlist-info" });
        const displayTitle = f.displayTitle || f.name;
        info.append(el("span", { class: "pdx-playlist-name", title: f.name }, displayTitle));

        const datesBox = el("div", { class: "pdx-playlist-dates" });
        if (f.date_upload) {
            datesBox.append(el("div", { class: "pdx-playlist-date-row", title: "Data de envio" },
                el("span", { class: "pdx-playlist-date-val" }, formatDisplayDate(f.date_upload))
            ));
        }
        if (f.extractedDate && f.extractedDate.displayDate) {
            datesBox.append(el("div", { class: "pdx-playlist-date-row", title: "Data extraída do nome do arquivo" },
                el("span", { class: "pdx-playlist-date-val" }, f.extractedDate.displayDate)
            ));
        }
        if (datesBox.childNodes.length) info.appendChild(datesBox);

        if (isCurrent) {
            const meta = el("div", { class: "pdx-playlist-meta" });
            meta.append(el("span", { class: "pdx-playlist-meta-active" }, kind === "video" ? "Reproduzindo agora" : "Visualizando agora"));
            info.appendChild(meta);
        }

        itemEl.append(thumbWrap, info);
        itemEl.addEventListener("click", () => {
            location.hash = "#item=" + f.origIdx;
        });

        return itemEl;
    }

    function renderPlaylist() {
        if (!stSidebarEl) return;
        const listEl = stSidebarEl.querySelector(".pdx-playlist-list");
        if (!listEl) return;
        listEl.textContent = "";

        const al = albumInfo();
        if (!al || !al.files.length) {
            listEl.innerHTML = `<div class="pdx-playlist-empty">Nenhum arquivo no álbum.</div>`;
            return;
        }

        const q = (stSidebarEl.querySelector(".pdx-sidebar-search-in")?.value || "").trim().toLowerCase();
        const activeTab = prefs.sidebarTab || "all";
        const sortMode = prefs.sidebarSort || "default";

        let filtered = al.files.filter(f => {
            if (q && (f.name || "").toLowerCase().indexOf(q) === -1) return false;
            const k = getFileKind(f);
            if (activeTab === "video") return k === "video";
            if (activeTab === "image") return k === "image";
            if (activeTab === "text") return k === "text";
            return true;
        });

        if (sortMode === "az") {
            filtered.sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { numeric: true, sensitivity: "base" }));
        }

        // Atualiza contadores das abas
        const countAll = al.files.length;
        const countVideos = al.files.filter(f => getFileKind(f) === "video").length;
        const countImages = al.files.filter(f => getFileKind(f) === "image").length;
        const countTexts = al.files.filter(f => getFileKind(f) === "text").length;

        stSidebarEl.querySelectorAll(".pdx-tab-chip").forEach(tab => {
            const t = tab.dataset.tab;
            let n = countAll;
            if (t === "video") n = countVideos;
            else if (t === "image") n = countImages;
            else if (t === "text") n = countTexts;
            const cEl = tab.querySelector(".pdx-tab-count");
            if (cEl) cEl.textContent = n;
            tab.style.display = (t !== "all" && n === 0) ? "none" : "";
        });

        const subTitle = stSidebarEl.querySelector(".pdx-sidebar-count");
        if (subTitle) subTitle.textContent = `${filtered.length} de ${al.files.length} arquivos`;

        if (!filtered.length) {
            listEl.innerHTML = `<div class="pdx-playlist-empty">Nenhum item encontrado.</div>`;
            return;
        }

        filtered.forEach((f, idx) => {
            listEl.appendChild(renderPlaylistCard(f, idx));
        });

        // Scroll auto para o item atual
        setTimeout(() => {
            const curItem = listEl.querySelector(".is-current");
            if (curItem) {
                try { curItem.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch { curItem.scrollIntoView(); }
            }
        }, 50);
    }

    function setupSidebar(row) {
        const al = albumInfo();
        if (!al || al.files.length <= 1) {
            if (stSidebarEl) { stSidebarEl.remove(); stSidebarEl = null; }
            row.classList.remove("pdx-has-sidebar");
            return;
        }

        row.classList.add("pdx-has-sidebar");
        row.classList.toggle("pdx-sidebar-collapsed", isSidebarCollapsed);

        if (stSidebarEl && stSidebarEl.parentNode === row) {
            renderPlaylist();
            return;
        }

        if (stSidebarEl) stSidebarEl.remove();

        const sb = el("div", { class: "pdx-sidebar" });

        // Header
        const header = el("div", { class: "pdx-sidebar-header" });
        header.innerHTML = `
            <div class="pdx-sidebar-title-wrap">
                <span class="pdx-sidebar-icon">${PL_ICONS.playlist}</span>
                <span class="pdx-sidebar-title">Playlist</span>
                <span class="pdx-sidebar-count">${al.files.length} arquivos</span>
            </div>
        `;
        const collapseBtn = el("button", {
            type: "button",
            class: "pdx-sidebar-collapse-btn",
            title: "Recolher playlist (p)",
            onClick: () => toggleSidebar()
        });
        collapseBtn.innerHTML = PL_ICONS.close;
        const galBtn = el("button", {
            type: "button",
            class: "pdx-sidebar-gallery-btn",
            title: "Voltar para a galeria",
            onClick: () => { location.hash = "gallery"; }
        });
        galBtn.innerHTML = `${PL_ICONS.grid} <span>Galeria</span>`;
        const actions = el("div", { class: "pdx-sidebar-actions" }, galBtn, collapseBtn);
        header.appendChild(actions);

        // Busca
        const searchWrap = el("div", { class: "pdx-sidebar-search" });
        searchWrap.innerHTML = `<span class="pdx-sidebar-search-icon">${PL_ICONS.search}</span>`;
        const searchIn = el("input", {
            type: "search",
            class: "pdx-sidebar-search-in",
            placeholder: "Buscar na playlist...",
            value: ""
        });
        searchIn.addEventListener("input", debounce(() => renderPlaylist(), 140));
        searchIn.addEventListener("keydown", e => e.stopPropagation());
        searchWrap.appendChild(searchIn);

        // Abas
        const tabsWrap = el("div", { class: "pdx-sidebar-tabs" });
        const makeTab = (key, label) => {
            const b = el("button", {
                type: "button",
                class: "pdx-tab-chip" + (prefs.sidebarTab === key ? " is-active" : "")
            });
            b.dataset.tab = key;
            b.innerHTML = `<span>${label}</span> <span class="pdx-tab-count">0</span>`;
            b.addEventListener("click", () => {
                prefs.sidebarTab = key; saveP();
                tabsWrap.querySelectorAll(".pdx-tab-chip").forEach(t => t.classList.remove("is-active"));
                b.classList.add("is-active");
                renderPlaylist();
            });
            return b;
        };
        tabsWrap.append(
            makeTab("all", "Todos"),
            makeTab("video", "Vídeos"),
            makeTab("image", "Fotos"),
            makeTab("text", "Textos")
        );

        // Ordenação
        const sortWrap = el("div", { class: "pdx-sidebar-sort" });
        const makeSort = (key, label) => {
            const b = el("button", {
                type: "button",
                class: "pdx-sort-chip" + (prefs.sidebarSort === key ? " is-active" : "")
            });
            b.dataset.sort = key;
            b.textContent = label;
            b.addEventListener("click", () => {
                prefs.sidebarSort = key; saveP();
                sortWrap.querySelectorAll(".pdx-sort-chip").forEach(s => s.classList.remove("is-active"));
                b.classList.add("is-active");
                renderPlaylist();
            });
            return b;
        };
        sortWrap.append(
            el("span", { class: "pdx-sort-label" }, "Ordem:"),
            makeSort("default", "Padrão"),
            makeSort("az", "A-Z")
        );

        // Lista
        const listEl = el("div", { class: "pdx-playlist-list" });

        sb.append(header, searchWrap, tabsWrap, sortWrap, listEl);
        row.appendChild(sb);
        stSidebarEl = sb;
        renderPlaylist();
    }
