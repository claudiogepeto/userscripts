    /* ===================== SIDEBAR PLAYLIST (Estilo YouTube AMOLED) ===================== */
    let stSidebarEl = null;
    let isSidebarCollapsed = !!prefs.sidebarCollapsed;

    function toggleSidebar(forceState) {
        const stage = document.querySelector(".tb-stage");
        if (!stage) return;
        isSidebarCollapsed = typeof forceState === "boolean" ? forceState : !isSidebarCollapsed;
        prefs.sidebarCollapsed = isSidebarCollapsed;
        saveP();
        stage.classList.toggle("is-sidebar-collapsed", isSidebarCollapsed);
        const btn = stage.querySelector(".tb-vrow-playlist");
        if (btn) btn.classList.toggle("is-active", !isSidebarCollapsed);
    }

    function makeThumbPlaceholder(kind, ext) {
        const ph = el("div", { class: "tb-playlist-placeholder" });
        const iconSpan = el("span", { class: "tb-playlist-ph-icon" });
        iconSpan.innerHTML = kindSvg(kind);
        const badge = el("span", { class: "tb-playlist-ph-ext" }, (ext || kind || "MP4").toUpperCase().slice(0, 5));
        ph.append(iconSpan, badge);
        return ph;
    }

    function parseFilesText(text) {
        const m = String(text || "").match(/const FILES = (\[[\s\S]*?\n\s*\]);/);
        if (!m) return [];
        try {
            const files = (new Function("return " + m[1]))();
            return Array.isArray(files) ? files : [];
        } catch { return []; }
    }
    // Lê FILES direto do <script> da página (sem serializar o documento inteiro);
    // o resultado é guardado assim que aparece.
    let pageFiles = null;
    function readPageFiles() {
        if (pageFiles) return pageFiles;
        for (const sc of document.scripts) {
            const t = sc.textContent || "";
            if (t.indexOf("const FILES") === -1) continue;
            const files = parseFilesText(t);
            if (files.length) { pageFiles = files; return files; }
        }
        return [];
    }
    let albumFilesPromise = null;
    function loadAlbumFiles() {
        if (albumFilesPromise) return albumFilesPromise;
        albumFilesPromise = (async () => {
            if (isAlbum) return readPageFiles();
            const a = document.querySelector('a[href*="/a/"]');
            if (!a) return [];
            try {
                const html = await (await fetch(a.href, { credentials: "include" })).text();
                return parseFilesText(html);
            } catch { return []; }
        })();
        return albumFilesPromise;
    }
    const previewQueue = [];
    let previewBusy = 0;
    function pumpPreviews() {
        while (previewBusy < 2 && previewQueue.length) {
            const job = previewQueue.shift();
            previewBusy++;
            const done = () => { previewBusy = Math.max(0, previewBusy - 1); pumpPreviews(); };
            fetch("/api/sign?v=" + encodeURIComponent(job.id), { credentials: "include", headers: { Accept: "application/json" } })
                .then(r => r.json())
                .then(j => {
                    if (!j || !j.url || !job.host.isConnected) { done(); return; }
                    const v = document.createElement("video");
                    v.className = job.host.className || "";
                    v.muted = true;
                    v.defaultMuted = true;
                    v.playsInline = true;
                    v.preload = "metadata";
                    v.setAttribute("style", "width:100%;height:100%;object-fit:cover;background:#000;pointer-events:none;display:block");
                    job.host.replaceWith(v);
                    let finished = false;
                    const finish = () => { if (finished) return; finished = true; done(); };
                    v.addEventListener("loadeddata", finish, { once: true });
                    v.addEventListener("error", finish, { once: true });
                    setTimeout(finish, 12000);
                    v.src = j.url + (String(j.url).indexOf("#") === -1 ? "#t=0.8" : "");
                })
                .catch(done);
        }
    }
    // Miniatura: tenta a imagem estática primeiro; só se ela falhar o card entra na
    // fila de preview em vídeo (/api/sign + <video>), e apenas quando estiver visível.
    let previewIO = null;
    function queuePreviewWhenVisible(img, id) {
        if (!("IntersectionObserver" in window)) { previewQueue.push({ id, host: img }); pumpPreviews(); return; }
        if (!previewIO) {
            previewIO = new IntersectionObserver(entries => {
                for (const e of entries) {
                    if (!e.isIntersecting) continue;
                    previewIO.unobserve(e.target);
                    previewQueue.push({ id: e.target.dataset.tbPrevId, host: e.target });
                }
                pumpPreviews();
            }, { rootMargin: "200px" });
        }
        img.dataset.tbPrevId = id;
        previewIO.observe(img);
    }
    function attachThumb(img, id, src) {
        if (!id || img.dataset.tbPrev) return;
        img.dataset.tbPrev = "1";
        img.addEventListener("error", () => queuePreviewWhenVisible(img, id), { once: true });
        img.src = src || (THUMB_BASE + id + ".jpg");
    }

    function parseSidebarItems() {
        const stage = document.querySelector(".tb-stage");
        const cur = stage && stage._cur;
        const asideLinks = Array.from(document.querySelectorAll('a.related[href*="/v/"], a[href*="/v/"]')).filter(a => !a.closest(".tb-stage") && !a.closest(".tb-sidebar"));
        const items = [];
        const seen = new Set();
        const push = (item) => {
            if (!item.id || seen.has(item.id)) return;
            seen.add(item.id);
            items.push(item);
        };
        if (cur) {
            push({
                name: cur.name,
                href: cur.href,
                thumb: cur.thumb,
                id: vidId(),
                isCurrent: true,
                kind: "video",
                dur: 0
            });
        }
        asideLinks.forEach(a => {
            const href = a.getAttribute("href") || "#";
            const img = a.querySelector("img");
            const nameEl = a.querySelector(".truncate, .font-semibold");
            const name = (nameEl ? nameEl.textContent : a.textContent || "").replace(/\s+/g, " ").trim();
            const id = (href.match(/\/v\/([^/?#]+)/) || [])[1] || "";
            push({
                name,
                href,
                thumb: (img && (img.getAttribute("src") || "")) || "",
                id,
                isCurrent: id === vidId(),
                kind: "video",
                dur: 0
            });
        });
        return items;
    }

    let playlistGen = 0;
    let playlistKey = "";
    const itemsKey = items => items.map(it => it.id).join("|");
    // Re-renderiza a playlist quando os relacionados da página mudam — mas só se a
    // lista de itens mudou de fato e nunca por mutações do próprio stage.
    function watchRelated() {
        const rel = document.querySelector("aside") || (document.querySelector("a.related") || {}).parentElement || document.body;
        const check = debounce(async () => {
            const albumFiles = await loadAlbumFiles();
            if (albumFiles.length) return;
            if (itemsKey(parseSidebarItems()) !== playlistKey) renderPlaylist();
        }, 250);
        try {
            new MutationObserver(recs => {
                for (const r of recs) {
                    if (r.target.closest && r.target.closest(".tb-stage")) continue;
                    check();
                    return;
                }
            }).observe(rel, { childList: true, subtree: true });
        } catch (e) {}
    }
    async function renderPlaylist() {
        if (!stSidebarEl) return;
        const listEl = stSidebarEl.querySelector(".tb-playlist-list");
        if (!listEl) return;
        const gen = ++playlistGen;

        const albumFiles = await loadAlbumFiles();
        if (gen !== playlistGen || !listEl.isConnected) return;
        const curId = vidId();
        const seen = new Set();
        let allItems = (albumFiles.length ? albumFiles.map(f => ({
            name: f.name || f.id,
            href: "/v/" + f.id,
            thumb: "",
            id: f.id,
            isCurrent: f.id === curId,
            kind: "video",
            dur: Number(f.dur) || 0
        })) : parseSidebarItems()).filter(it => {
            if (!it.id || seen.has(it.id)) return false;
            seen.add(it.id);
            return true;
        });
        listEl.textContent = "";
        playlistItems = allItems;
        playlistKey = itemsKey(allItems);
        applyListPosition(allItems);
        const q = (stSidebarEl.querySelector(".tb-sidebar-search-in")?.value || "").trim().toLowerCase();
        const activeTab = prefs.sidebarTab || "all";
        const sortMode = prefs.sidebarSort || "default";

        let filtered = allItems.filter(item => {
            if (q && item.name.toLowerCase().indexOf(q) === -1) return false;
            if (activeTab === "video" && item.kind !== "video") return false;
            if (activeTab === "image" && item.kind !== "image") return false;
            if (activeTab === "text" && item.kind !== "text") return false;
            return true;
        });

        if (sortMode === "az") {
            filtered.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
        }

        const countEl = stSidebarEl.querySelector(".tb-sidebar-count");
        if (countEl) countEl.textContent = `${filtered.length} vídeos`;

        stSidebarEl.querySelectorAll(".tb-tab-chip").forEach(tab => {
            const t = tab.dataset.tab;
            let n = allItems.length;
            if (t === "video") n = allItems.filter(i => i.kind === "video").length;
            else if (t === "image") n = allItems.filter(i => i.kind === "image").length;
            else if (t === "text") n = allItems.filter(i => i.kind === "text").length;
            const c = tab.querySelector(".tb-tab-count");
            if (c) c.textContent = n;
            tab.style.display = (t !== "all" && n === 0) ? "none" : "";
        });

        if (!filtered.length) {
            listEl.innerHTML = `<div class="tb-playlist-empty">Nenhum vídeo encontrado.</div>`;
            return;
        }

        filtered.forEach((item, idx) => {
            const dt = extractDateFromTitle(item.name);
            const cleanTitle = cleanTitleWithoutDate(item.name, dt);

            const card = el("a", {
                class: "tb-playlist-item" + (item.isCurrent ? " is-current" : ""),
                href: hrefWithPosition(item.href, idx + 1),
                title: item.name
            });

            const thumbWrap = el("div", { class: "tb-playlist-thumb-wrap" });
            if (item.thumb || item.id) {
                const img = el("img", { class: "tb-playlist-thumb", alt: "", loading: "lazy" });
                attachThumb(img, item.id, item.thumb);
                thumbWrap.appendChild(img);
            } else {
                thumbWrap.appendChild(makeThumbPlaceholder(item.kind, "MP4"));
            }

            const kindLabel = item.kind === "image" ? "Imagem" : "Video";
            thumbWrap.appendChild(el("span", { class: "tb-playlist-kind" }, kindLabel));
            thumbWrap.appendChild(el("span", { class: "tb-playlist-num" }, String(idx + 1)));
            if (item.kind === "video") {
                let known = item.dur > 0 ? fmtT(item.dur) : "";
                if (!known) { try { known = sessionStorage.getItem("tbdur:" + (item.id || "")) || ""; } catch {} }
                const durEl = el("span", { class: "tb-playlist-dur" }, known);
                durEl.hidden = !known;
                thumbWrap.appendChild(durEl);
            }

            const info = el("div", { class: "tb-playlist-info" });
            info.append(el("span", { class: "tb-playlist-name" }, cleanTitle));

            // Metadados de data
            const datesWrap = el("div", { class: "tb-playlist-dates" });
            if (dt && dt.displayDate) {
                const tipEl = el("span", {
                    class: "tb-has-tip",
                    title: "Data identificada e extraída do nome do arquivo (definida no upload)"
                }, el("span", { class: "tb-tip-icon" }, "ⓘ"));
                datesWrap.appendChild(el("div", { class: "tb-playlist-date-row" },
                    el("span", { class: "tb-playlist-date-lbl" }, "Data extraída:"),
                    el("span", { class: "tb-playlist-date-val" }, dt.displayDate),
                    tipEl
                ));
            }
            if (datesWrap.childNodes.length) info.appendChild(datesWrap);

            if (item.isCurrent) {
                const meta = el("div", { class: "tb-playlist-meta" });
                meta.append(el("span", { class: "tb-playlist-meta-active" }, "Reproduzindo agora"));
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

    function setupSidebar(stage) {
        if (stSidebarEl && stSidebarEl.parentNode === stage) {
            renderPlaylist();
            return;
        }

        const sb = el("div", { class: "tb-sidebar" });

        const header = el("div", { class: "tb-sidebar-header" });
        header.innerHTML = `
            <div class="tb-sidebar-title-wrap">
                <span class="tb-sidebar-icon">${IC.playlist}</span>
                <span class="tb-sidebar-title">Playlist</span>
                <span class="tb-sidebar-count">0 vídeos</span>
            </div>
        `;
        const collapseBtn = el("button", {
            type: "button",
            class: "tb-sidebar-collapse-btn",
            title: "Recolher playlist (p)",
            onClick: () => toggleSidebar()
        });
        collapseBtn.innerHTML = IC.close;
        const albumA = document.querySelector('a[href*="/a/"]');
        const actions = el("div", { style: { display: "flex", alignItems: "center", gap: "8px" } });
        if (albumA) {
            const gal = el("a", { class: "tb-sidebar-gallery", href: albumA.href, title: "Abrir a galeria do álbum" });
            gal.insertAdjacentHTML("beforeend", IC.grid);
            gal.append(el("span", null, "Galeria"));
            actions.append(gal);
        }
        actions.append(collapseBtn);
        header.appendChild(actions);

        const searchWrap = el("div", { class: "tb-sidebar-search" });
        searchWrap.innerHTML = `<span class="tb-sidebar-search-icon">${IC.search}</span>`;
        const searchIn = el("input", {
            type: "search",
            class: "tb-sidebar-search-in",
            placeholder: "Buscar na playlist...",
            value: ""
        });
        searchIn.addEventListener("input", debounce(() => renderPlaylist(), 140));
        searchIn.addEventListener("keydown", e => e.stopPropagation());
        searchWrap.appendChild(searchIn);

        const tabsWrap = el("div", { class: "tb-sidebar-tabs" });
        const makeTab = (key, label) => {
            const b = el("button", {
                type: "button",
                class: "tb-tab-chip" + (prefs.sidebarTab === key ? " is-active" : "")
            });
            b.dataset.tab = key;
            b.innerHTML = `<span>${label}</span> <span class="tb-tab-count">0</span>`;
            b.addEventListener("click", () => {
                prefs.sidebarTab = key; saveP();
                tabsWrap.querySelectorAll(".tb-tab-chip").forEach(t => t.classList.remove("is-active"));
                b.classList.add("is-active");
                renderPlaylist();
            });
            return b;
        };
        tabsWrap.append(
            makeTab("all", "Todos"),
            makeTab("video", "Vídeos")
        );

        const sortWrap = el("div", { class: "tb-sidebar-sort" });
        const makeSort = (key, label) => {
            const b = el("button", {
                type: "button",
                class: "tb-sort-chip" + (prefs.sidebarSort === key ? " is-active" : "")
            });
            b.dataset.sort = key;
            b.textContent = label;
            b.addEventListener("click", () => {
                prefs.sidebarSort = key; saveP();
                sortWrap.querySelectorAll(".tb-sort-chip").forEach(s => s.classList.remove("is-active"));
                b.classList.add("is-active");
                renderPlaylist();
            });
            return b;
        };
        sortWrap.append(
            el("span", { class: "tb-sort-label" }, "Ordem:"),
            makeSort("default", "Padrão"),
            makeSort("az", "A-Z")
        );

        const listEl = el("div", { class: "tb-playlist-list" });

        sb.append(header, searchWrap, tabsWrap, sortWrap, listEl);
        stage.appendChild(sb);
        stSidebarEl = sb;
        renderPlaylist();
    }

    function readPosition() {
        try { const n = parseInt(new URL(location.href).searchParams.get("position") || "", 10); return Number.isFinite(n) && n > 0 ? n : 0; } catch { return 0; }
    }
    function hrefWithPosition(href, n) {
        try { const u = new URL(href, location.origin); u.searchParams.set("position", String(n)); return u.pathname + u.search + u.hash; } catch { return href; }
    }
    let playlistItems = [];
    function navFile(dir) {
        const items = playlistItems.length ? playlistItems : parseSidebarItems();
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
    function applyListPosition(items) {
        if (!items || !items.length) return;
        const want = readPosition();
        const curPath = location.pathname;
        const i = items.findIndex(it => {
            try { return new URL(it.href, location.origin).pathname === curPath; } catch (e) { return false; }
        });
        if (want && items[want - 1]) {
            let targetPath = "";
            try { targetPath = new URL(items[want - 1].href, location.origin).pathname; } catch (e) {}
            if (targetPath && targetPath !== curPath) {
                location.replace(hrefWithPosition(items[want - 1].href, want));
                return;
            }
        }
        if (i >= 0 && !want) history.replaceState(history.state, "", hrefWithPosition(location.href, i + 1));
    }

    function debounce(fn, ms) { let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; }
