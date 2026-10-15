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
            kind: IMAGE_NAME.test(f.name || "") ? "image" : (/\.(txt|md|nfo|log)$/i.test(f.name || "") ? "text" : "video"),
            dur: Number(f.dur) || 0,
            views: Number(f.views) || 0
        })) : parseSidebarItems()).filter(it => {
            if (!it.id || seen.has(it.id)) return false;
            seen.add(it.id);
            return true;
        });
        listEl.textContent = "";
        playlistItems = allItems;
        playlistKey = itemsKey(allItems);
        applyListPosition(allItems);
        const q = (stSidebarEl.querySelector(".tb-sidebar-search input")?.value || "").trim().toLowerCase();
        const activeTab = prefs.sidebarTab || "all";
        const stage = stSidebarEl.closest(".tb-stage");
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

        filtered = mediaSortItems(filtered, sidebarSortMode(), prefs.sidebarSortDir || "desc", { name: it => it.name, views: it => it.views });

        const countEl = stSidebarEl.querySelector(".tb-sidebar-count");
        if (countEl) countEl.textContent = `${filtered.length} vídeos`;

        const tabs = stSidebarEl._tabs;
        if (tabs) tabs.update({
            all: allItems.length,
            video: allItems.filter(i => i.kind === "video").length,
            image: allItems.filter(i => i.kind === "image").length,
            text: allItems.filter(i => i.kind === "text").length
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

    // Modo salvo de versões antigas ("az") vira o A-Z das fichas do bunkr.
    function sidebarSortMode() {
        const m = prefs.sidebarSort || "default";
        return m === "az" ? "name" : m;
    }

    // Abas de tipo e fichas de ordenação da sidebar (sem "Data de Envio": o turbo não informa a data de upload).
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
                { key: "name", label: "A-Z", dir: true, title: "Ordenar por nome" },
                { key: "views", label: "Views", dir: true, title: "Ordenar por visualizações" }
            ],
            onChange: (mode, dir) => { prefs.sidebarSort = mode; prefs.sidebarSortDir = dir; saveP(); renderPlaylist(); }
        });
        return { tabs, sort };
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

