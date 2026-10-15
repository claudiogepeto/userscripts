    /* ====================================================================
     * v2.1 — STAGE estilo pixeldrain p/ página de vídeo/imagem: vrow (info) +
     * mídia FIXA no meio + strip collapsável dos outros arquivos do álbum.
     * ==================================================================== */
    // mirror inline no vrow (mesmo dropdown de domínios, agora como botão da topbar)
    function buildMirrorControl() {
        const cur = location.hostname.replace(/^www\./, "");
        const wrap = el("div", { class: "bunkr-mirror-vrow" });
        const btn = el("button", { type: "button", class: "bunkr-item", title: "Trocar de mirror (domínio)" }, el("span", { class: "bunkr-mirror-spin", "aria-hidden": "true" }));
        btn.insertAdjacentHTML("beforeend", PL_ICONS.dns); btn.append(el("span", null, "Mirror"));
        const menu = el("div", { class: "bunkr-mirror-menu", hidden: "" });
        menu.innerHTML = '<div class="bunkr-mirror-head">Trocar de mirror · <b>' + cur + '</b></div><div class="bunkr-mirror-grid"></div>';
        const grid = menu.querySelector(".bunkr-mirror-grid");
        MIRRORS.forEach(d => {
            const a = el("a", { class: "bunkr-mirror-item" + (d === cur ? " is-current" : "") }, d);
            if (d === cur) a.addEventListener("click", e => e.preventDefault());
            else a.href = location.protocol + "//" + d + location.pathname + location.search;
            grid.appendChild(a);
        });
        const setOpen = open => {   // menu em position:FIXED → calcula a posição no open (a vrow tem overflow:hidden, absolute era CORTADO)
            menu.hidden = !open;
            if (!open) return;
            const r = btn.getBoundingClientRect(), w = menu.offsetWidth || 300;
            menu.style.left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8)) + "px";
            const mh = menu.offsetHeight;
            menu.style.top = ((r.bottom + 8 + mh > window.innerHeight) ? Math.max(8, r.top - 8 - mh) : r.bottom + 8) + "px";
        };
        btn.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); setOpen(menu.hidden); });
        document.addEventListener("click", e => { if (!wrap.contains(e.target)) setOpen(false); });
        wrap.append(btn, menu);
        return wrap;
    }
    // monta o stage 1× (precisa do <main h1> server-rendered). Cobre a página (fixed) como o pixeldrain.
    function toggleSidebar(forceState) {
        const stage = document.querySelector(".bunkr-stage");
        if (!stage) return;
        const isCollapsed = typeof forceState === "boolean"
            ? forceState
            : !stage.classList.contains("is-sidebar-collapsed");
        stage.classList.toggle("is-sidebar-collapsed", isCollapsed);
        try { localStorage.setItem("bunkr_sidebar_collapsed", isCollapsed ? "1" : "0"); } catch {}
    }

    // monta o stage 1× (precisa do <main h1> server-rendered). Cobre a página (fixed) como o pixeldrain.
    function buildStage() {
        const existing = document.querySelector(".bunkr-stage");
        if (existing) return existing;
        const h1 = document.querySelector("main h1, h1, .file-name");
        if (!h1) return null;                          // main ainda não pronto
        const name = cleanHtmlText(h1.innerHTML || h1.textContent || "");
        const sizeEl = document.querySelector("main p.text-xs, p.text-xs, .file-size, .text-muted");
        const size = sizeEl ? (sizeEl.textContent || "").replace(/\s+/g, " ").trim() : "";
        const finfo = getFileInfo(name);
        const albumA = document.querySelector('a[href*="/a/"]');
        const isTxt = finfo.category === "text" || /\.txt$/i.test(name) || /\.md$/i.test(name) || /\.nfo$/i.test(name) || /\.log$/i.test(name);
        const isVid = !isTxt && !!document.querySelector("#video-container, #video-wrapper, video, #player");
        const stageType = isVid ? "is-video" : (isTxt ? "is-text" : "is-image");

        const stage = el("div", { class: "bunkr-stage " + stageType });
        
        // Coluna principal da esquerda (Topbar + Mídia)
        const stageMain = el("div", { class: "bunkr-stage-main" });

        // Topbar info (vrow)
        const vrow = el("div", { class: "bunkr-vrow" });

        // Row 1 (desktop esquerda, mobile linha 1): Logo + Título
        const vrowTop = el("div", { class: "bunkr-vrow-top" });

        // Logo no canto esquerdo da topbar (direciona para a home do Bunkr)
        const topLogo = el("a", { class: "bunkr-top-logo", href: "/", title: "Bunkr" });
        const logoBadge = el("span", { class: "bunkr-logo-badge" });
        logoBadge.insertAdjacentHTML("beforeend", PL_ICONS.bunkrMark);
        topLogo.append(logoBadge, el("span", { class: "bunkr-logo-text" }, "bunkr", el("span", { class: "bunkr-logo-dot" }, ".")));
        vrowTop.append(topLogo, el("div", { class: "b-vsep" }));

        // Título do arquivo
        const nameEl = el("div", { class: "b-name", title: name });
        nameEl.insertAdjacentHTML("beforeend", isVid ? PL_ICONS.video : (isTxt ? PL_ICONS.doc : PL_ICONS.image));
        nameEl.append(el("span", null, name));
        vrowTop.append(nameEl);

        // Row 2 (desktop direita, mobile linha 2): Stats, Mirror e Playlist
        const vrowSub = el("div", { class: "bunkr-vrow-sub" });

        // Stats: tamanho e tipo de arquivo
        const stats = el("div", { class: "bunkr-stats" });
        if (size) stats.append(el("span", { class: "bunkr-stat bunkr-stat-size" }, size));
        stats.append(el("span", { class: "bunkr-stat bunkr-stat-type" }, isVid ? "Vídeo" : (isTxt ? "Texto" : "Imagem")));
        vrowSub.append(stats);

        // Mirror switcher e espaçador
        vrowSub.append(el("div", { class: "b-vsep" }), buildMirrorControl(), el("div", { class: "b-spacer" }));

        // Botão de Playlist no canto direito da topbar (visível somente quando a sidebar estiver fechada ou no mobile)
        const vrowPl = el("button", {
            type: "button",
            class: "bunkr-item bunkr-vrow-playlist",
            title: "Abrir playlist do álbum (p)",
            onClick: () => {
                const sb = document.querySelector(".bunkr-sidebar");
                if (window.innerWidth <= 768 && sb) {
                    sb.scrollIntoView({ behavior: "smooth" });
                } else {
                    toggleSidebar(false);
                }
            }
        });
        vrowPl.insertAdjacentHTML("beforeend", PL_ICONS.playlist);
        vrowPl.append(el("span", null, "Playlist"));
        vrowSub.append(vrowPl);

        vrow.append(vrowTop, vrowSub);

        // Mídia central
        const mid = el("div", { class: "bunkr-stage-mid" });
        const navPrev = el("button", { class: "bunkr-nav-side bunkr-nav-prev", title: "Anterior no álbum (Shift+P)", "aria-label": "Anterior", onClick: e => { e.stopPropagation(); navFile(-1); } });
        navPrev.insertAdjacentHTML("beforeend", PL_ICONS.chevL);
        const navNext = el("button", { class: "bunkr-nav-side bunkr-nav-next", title: "Próximo no álbum (Shift+N)", "aria-label": "Próximo", onClick: e => { e.stopPropagation(); navFile(1); } });
        navNext.insertAdjacentHTML("beforeend", PL_ICONS.chevR);
        mid.append(navPrev, navNext);

        stageMain.append(vrow, mid);

        // Sidebar Playlist à direita (altura 100vh, ao lado de stageMain)
        const sidebar = el("aside", { class: "bunkr-sidebar" });
        const sbHead = el("div", { class: "bunkr-sidebar-header" });
        const sbTitle = el("div", { class: "bunkr-sidebar-title" });
        sbTitle.insertAdjacentHTML("beforeend", PL_ICONS.playlist);
        const sbCount = el("span", { class: "bunkr-sidebar-count" }, "");
        sbTitle.append(el("span", null, "Arquivos do álbum"), sbCount);

        const sbActions = el("div", { class: "bunkr-sidebar-actions" });
        const galleryBtn = el("a", {
            class: "bunkr-sidebar-gallery-btn",
            href: (albumA && albumA.href) || "#",
            title: "Ver galeria completa do álbum"
        });
        galleryBtn.insertAdjacentHTML("beforeend", PL_ICONS.grid);
        galleryBtn.append(el("span", null, "Galeria"));
        if (!albumA) galleryBtn.style.display = "none";

        const sbClose = el("button", {
            type: "button",
            class: "bunkr-sidebar-btn bunkr-sidebar-close",
            title: "Recolher playlist (p)",
            "aria-label": "Recolher playlist",
            onClick: () => toggleSidebar(true)
        });
        sbClose.insertAdjacentHTML("beforeend", PL_ICONS.close);
        sbActions.append(galleryBtn, sbClose);
        sbHead.append(sbTitle, sbActions);

        const sbSearch = el("div", { class: "bunkr-sidebar-search" });
        const sbInput = el("input", {
            type: "text",
            placeholder: "Filtrar no álbum…",
            value: getQ(),
            "aria-label": "Filtrar arquivos no álbum"
        });
        let sbSearchT;
        sbInput.addEventListener("input", () => {
            clearTimeout(sbSearchT);
            sbSearchT = setTimeout(() => {
                setQ(sbInput.value.trim());
                if (albumFilesCache) renderPlaylist(sidebarList, albumFilesCache, sbCount);
                else renderRelatedToPlaylist(sidebarList, sbCount);
            }, 180);
        });
        sbSearch.appendChild(sbInput);

        const sbSortBar = el("div", { class: "bunkr-sidebar-sort" });
        sbSortBar.innerHTML = `
            <span class="bunkr-sidebar-sort-label">Ordem:</span>
            <button type="button" class="bunkr-sb-chip is-active" data-pl-sort="default">Padrão</button>
            <button type="button" class="bunkr-sb-chip" data-pl-sort="upload-date" title="Ordenar por data de envio">
                <span>Data de Envio</span>
                <span class="bunkr-sb-dir">⬇</span>
            </button>
            <button type="button" class="bunkr-sb-chip" data-pl-sort="title-date" title="Ordenar por data extraída do nome">
                <span>Data Extraída</span>
                <span class="bunkr-sb-dir">⬇</span>
            </button>
            <button type="button" class="bunkr-sb-chip" data-pl-sort="name">A-Z</button>
        `;
        sbSearch.appendChild(sbSortBar);

        const updateSbChips = () => {
            sbSortBar.querySelectorAll(".bunkr-sb-chip").forEach(c => {
                const sm = c.dataset.plSort;
                c.classList.toggle("is-active", sm === plSortMode);
                if (sm === "upload-date") {
                    const dirEl = c.querySelector(".bunkr-sb-dir");
                    if (dirEl) dirEl.textContent = plUploadDateDir === "desc" ? "⬇" : "⬆";
                } else if (sm === "title-date") {
                    const dirEl = c.querySelector(".bunkr-sb-dir");
                    if (dirEl) dirEl.textContent = plTitleDateDir === "desc" ? "⬇" : "⬆";
                }
            });
        };
        updateSbChips();

        sbSortBar.querySelectorAll(".bunkr-sb-chip").forEach(c => {
            c.addEventListener("click", () => {
                const sm = c.dataset.plSort;
                if (sm === "upload-date") {
                    if (plSortMode === "upload-date") {
                        plUploadDateDir = plUploadDateDir === "desc" ? "asc" : "desc";
                    } else {
                        plSortMode = "upload-date";
                    }
                } else if (sm === "title-date") {
                    if (plSortMode === "title-date") {
                        plTitleDateDir = plTitleDateDir === "desc" ? "asc" : "desc";
                    } else {
                        plSortMode = "title-date";
                    }
                } else {
                    plSortMode = sm;
                }
                safeSetStorage("bunkr_pl_sort", plSortMode);
                safeSetStorage("bunkr_pl_upload_dir", plUploadDateDir);
                safeSetStorage("bunkr_pl_sort_dir", plTitleDateDir);
                updateSbChips();
                if (albumFilesCache) renderPlaylist(sidebarList, albumFilesCache, sbCount);
                else renderRelatedToPlaylist(sidebarList, sbCount);
            });
        });

        const sidebarList = el("div", { class: "bunkr-playlist-list" });
        sidebar.append(sbHead, sbSearch, sidebarList);

        stage.append(stageMain, sidebar);

        stage._sidebarList = sidebarList;
        stage._sbCount = sbCount;
        stage._galleryBtn = galleryBtn;

        const isCollapsed = safeGetStorage("bunkr_sidebar_collapsed") === "1";
        let singleOpen = "";
        try { singleOpen = sessionStorage.getItem(SINGLE_OPEN_KEY) || ""; if (singleOpen) sessionStorage.removeItem(SINGLE_OPEN_KEY); } catch {}
        if (isCollapsed || (singleOpen && singleOpen === fileSlug())) stage.classList.add("is-sidebar-collapsed");

        document.body.insertBefore(stage, document.body.firstChild);
        document.documentElement.classList.add("bunkr-has-stage");

        populatePlaylist(sidebar, sidebarList, sbCount);
        const grid = document.querySelector("#related-files-grid");
        if (grid) { try { new MutationObserver(() => renderRelatedToPlaylist(sidebarList, sbCount)).observe(grid, { childList: true }); } catch {} }
        return stage;
    }
    /* ---- FILTRO via ?q= (igual pixeldrain): persiste na URL, filtra a galeria do álbum E a strip do vídeo, e se propaga no clique ---- */
    function getQ() { try { return (new URLSearchParams(location.search).get("q") || "").trim(); } catch { return ""; } }
    function setQ(q) { try { const u = new URL(location.href); if (q) u.searchParams.set("q", q); else u.searchParams.delete("q"); history.replaceState(history.state, "", u.pathname + u.search + u.hash); } catch {} }
    function fileSlug() { return (location.pathname.match(/\/(?:f|i|v|d)\/([^/?#]+)/) || [])[1] || ""; }
    function isVidFile(f) {
        const ext = (f.extension || f.ext || "").toLowerCase();
        const type = (f.type || "").toLowerCase();
        const name = (f.original || f.name || "").toLowerCase();
        return /video/i.test(type) || /^(mp4|mkv|mov|webm|avi|flv|m4v|wmv|ts)$/i.test(ext) || /\.(mp4|mkv|mov|webm|avi|flv|m4v|wmv|ts)$/i.test(name);
    }
    function isImgFile(f) {
        const ext = (f.extension || f.ext || "").toLowerCase();
        const type = (f.type || "").toLowerCase();
        const name = (f.original || f.name || "").toLowerCase();
        return /image|photo/i.test(type) || /^(jpg|jpeg|png|gif|webp|bmp|svg|avif|heic)$/i.test(ext) || /\.(jpg|jpeg|png|gif|webp|bmp|svg|avif|heic)$/i.test(name);
    }
    function fileHref(f) {
        const slug = typeof f === "string" ? f : (f.slug || f.id || "");
        const isV = typeof f === "object" ? isVidFile(f) : false;
        const isI = typeof f === "object" ? isImgFile(f) : false;
        const prefix = isV ? "/v/" : (isI ? "/i/" : "/f/");
        const u = prefix + slug + (getQ() ? "?q=" + encodeURIComponent(getQ()) : "");
        return u;
    }
    function readPosition() {
        try { const n = parseInt(new URL(location.href).searchParams.get("position") || "", 10); return Number.isFinite(n) && n > 0 ? n : 0; } catch { return 0; }
    }
    function writePosition(n) {
        try {
            const u = new URL(location.href);
            if (String(u.searchParams.get("position") || "") === String(n)) return;
            u.searchParams.set("position", String(n));
            history.replaceState(history.state, "", u.pathname + u.search + u.hash);
        } catch {}
    }
    function hrefWithPosition(href, n) {
        try { const u = new URL(href, location.origin); u.searchParams.set("position", String(n)); return u.pathname + u.search + u.hash; } catch { return href; }
    }
    function sortedAlbumList() {
        if (!albumFilesCache || !albumFilesCache.length) return [];
        const q = getQ().toLowerCase();
        let list = q ? albumFilesCache.filter(f => (f.original || f.name || "").toLowerCase().indexOf(q) !== -1) : albumFilesCache.slice();
        const activeDir = plSortMode === "upload-date" ? plUploadDateDir : plTitleDateDir;
        return sortFileList(list, plSortMode, activeDir);
    }
    /* ÁLBUM com UM arquivo: pula a grade e abre o arquivo direto no player, com a playlist recolhida SÓ nessa
       abertura (marca one-shot em sessionStorage; bunkr_sidebar_collapsed não é gravado). location.replace tira o
       álbum do histórico, e o álbum só abre sozinho 1× por aba: quem volta pela Galeria / voltar vê a grade → sem loop.
       (O referrer não basta: o botão Galeria passa pelo redirect do ?advanced=1, que troca o referrer pelo próprio álbum.) */
    const SINGLE_OPEN_KEY = "bunkr_single_open";
    const SINGLE_DONE_KEY = "bunkr_single_done:";
    const slugOfPath = p => (String(p || "").match(/\/(?:f|i|v|d)\/([^/?#]+)/) || [])[1] || "";
    function openSingleItemAlbum() {
        const albumId = (location.pathname.match(/\/a\/([^/?#]+)/) || [])[1];
        if (!albumId) return false;
        try { if (sessionStorage.getItem(SINGLE_DONE_KEY + albumId)) return false; } catch {}
        try { const nav = performance.getEntriesByType("navigation")[0]; if (nav && nav.type === "back_forward") return false; } catch {}
        const cards = document.querySelectorAll(".theItem");
        const files = Array.isArray(window.albumFiles) ? window.albumFiles : null;
        let href = "";
        if (files) {
            if (files.length !== 1 || cards.length > 1) return false;
            href = fileHref(files[0]);
        } else {
            if (cards.length !== 1) return false;
            const a = cards[0].querySelector('a[href*="/f/"], a[href*="/v/"], a[href*="/i/"]');
            href = a ? a.getAttribute("href") || "" : "";
        }
        let target;
        try { target = new URL(hrefWithPosition(href, 1), location.origin); } catch { return false; }
        const slug = slugOfPath(target.pathname);
        if (!slug || target.origin !== location.origin) return false;
        try {
            const ref = document.referrer ? new URL(document.referrer) : null;
            if (ref && ref.origin === location.origin && slugOfPath(ref.pathname) === slug) return false;
        } catch {}
        try { sessionStorage.setItem(SINGLE_OPEN_KEY, slug); sessionStorage.setItem(SINGLE_DONE_KEY + albumId, "1"); } catch {}
        location.replace(target.pathname + target.search + target.hash);
        return true;
    }
    function applyAlbumPosition() {
        const list = sortedAlbumList();
        if (!list.length) return;
        const slug = fileSlug();
        const i = list.findIndex(f => f.slug === slug);
        const want = readPosition();
        if (want && list[want - 1] && list[want - 1].slug !== slug) {
            location.replace(hrefWithPosition(fileHref(list[want - 1]), want));
            return;
        }
        if (i >= 0) writePosition(i + 1);
    }

    /* a página de ARQUIVO só tem o #related-files-grid (poucos). Pra strip INTEIRA: fetch /a/{id}?advanced=1 → extrai window.albumFiles (array literal da própria bunkr). Cache em sessionStorage por álbum (navegação fica rápida). */
    let albumFilesCache = null;
    async function loadAlbumFiles() {
        if (albumFilesCache) return albumFilesCache;
        const a = document.querySelector('a[href*="/a/"]'); if (!a) return null;
        const id = (a.href.match(/\/a\/([A-Za-z0-9]+)/) || [])[1]; if (!id) return null;
        const ck = "bunkr_album_" + id;
        try { const c = sessionStorage.getItem(ck); if (c) { albumFilesCache = JSON.parse(c); applyAlbumPosition(); return albumFilesCache; } } catch {}
        try {
            const base = a.href.split("#")[0].split("?")[0];
            const html = await (await fetch(base + "?advanced=1", { credentials: "include" })).text();
            const m = html.match(/window\.albumFiles\s*=\s*(\[[\s\S]*?\n\]);/);   // âncora no \n]; (fim do array) — os NOMES contêm ] (ex.: [uuid]), então não dá pra parar no 1º ]
            if (!m) return null;
            const files = (new Function("return " + m[1]))();   // eval do array literal da PRÓPRIA bunkr (mesmo trust da página; só os dados, não os scripts dela)
            if (!Array.isArray(files) || !files.length) return null;
            const slim = files.map(f => ({
                slug: f.slug,
                original: f.original || f.name || "",
                thumbnail: f.thumbnail || "",
                extension: f.extension || "",
                type: f.type || "",
                size: f.size || 0,
                timestamp: f.timestamp || ""
            }));
            albumFilesCache = slim; try { sessionStorage.setItem(ck, JSON.stringify(slim)); } catch {}
            applyAlbumPosition();
            return slim;
        } catch { return null; }
    }

    let plSortMode = safeGetStorage("bunkr_pl_sort", "default");
    let plUploadDateDir = safeGetStorage("bunkr_pl_upload_dir", "desc");
    let plTitleDateDir = safeGetStorage("bunkr_pl_sort_dir", "desc");

    function sortFileList(files, mode, dir) {
        if (!files || !files.length || mode === "default") return files;
        const sorted = [...files];
        if (mode === "upload-date") {
            sorted.sort((a, b) => {
                const tA = parseUploadTimestamp(a.timestamp || a.date);
                const tB = parseUploadTimestamp(b.timestamp || b.date);
                return dir === "desc" ? (tB - tA) : (tA - tB);
            });
        } else if (mode === "title-date") {
            sorted.sort((a, b) => {
                const nameA = (a.original || a.name || "").trim();
                const nameB = (b.original || b.name || "").trim();
                const dtA = extractDateFromTitle(nameA);
                const dtB = extractDateFromTitle(nameB);
                const tA = dtA ? dtA.timestamp : (dir === "desc" ? -Infinity : Infinity);
                const tB = dtB ? dtB.timestamp : (dir === "desc" ? -Infinity : Infinity);
                return dir === "desc" ? (tB - tA) : (tA - tB);
            });
        } else if (mode === "name") {
            sorted.sort((a, b) => {
                const dtA = extractDateFromTitle(a.original || a.name);
                const dtB = extractDateFromTitle(b.original || b.name);
                const nameA = cleanTitleWithoutDate((a.original || a.name || "").trim(), dtA);
                const nameB = cleanTitleWithoutDate((b.original || b.name || "").trim(), dtB);
                return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" });
            });
        }
        return sorted;
    }

    function makePlaylistThumbPlaceholder(finfo) {
        const ph = el("div", { class: "bunkr-playlist-thumb-placeholder" });
        let ic = PL_ICONS.image;
        if (finfo.category === "video") ic = PL_ICONS.video;
        else if (finfo.category === "text" || finfo.category === "doc") ic = PL_ICONS.doc;
        else if (finfo.category === "archive") ic = PL_ICONS.archive;
        else if (finfo.category === "audio") ic = PL_ICONS.audio;
        else if (finfo.category === "other") ic = PL_ICONS.file;

        const iconSpan = el("span", { class: "bunkr-playlist-ph-icon" });
        iconSpan.innerHTML = ic;
        const extName = (finfo.ext || finfo.category || "FILE").toUpperCase().slice(0, 5);
        const badge = el("span", { class: "bunkr-playlist-ph-ext" }, extName);
        ph.append(iconSpan, badge);
        return ph;
    }

    function playlistCard(name, href, thumb, isV, current, idx, uploadTs) {
        name = cleanHtmlText(name);
        const dt = extractDateFromTitle(name);
        const cleanName = cleanTitleWithoutDate(name, dt);
        const finfo = getFileInfo(name);
        if (isV) finfo.category = "video";

        const card = el("a", { class: "bunkr-playlist-item" + (current ? " is-current" : ""), href: typeof idx === "number" ? hrefWithPosition(href, idx + 1) : href, title: cleanName });
        const thumbWrap = el("div", { class: "bunkr-playlist-thumb-wrap" });

        const isKnownMedia = (finfo.category === "video" || finfo.category === "image") && !!thumb;
        if (isKnownMedia) {
            const img = el("img", { class: "bunkr-playlist-thumb", src: thumb, alt: "", loading: "lazy" });
            img.onerror = () => {
                img.remove();
                if (!thumbWrap.querySelector(".bunkr-playlist-thumb-placeholder")) {
                    thumbWrap.prepend(makePlaylistThumbPlaceholder(finfo));
                }
            };
            thumbWrap.appendChild(img);
        } else {
            thumbWrap.appendChild(makePlaylistThumbPlaceholder(finfo));
        }
        
        const kindLabel = finfo.category === "video" ? "Video" : finfo.category === "image" ? "Imagem" : finfo.category === "audio" ? "Audio" : finfo.category === "archive" ? "Arquivo" : "Arquivo";
        thumbWrap.appendChild(el("span", { class: "bunkr-playlist-kind" }, kindLabel));
        if (typeof idx === "number") thumbWrap.appendChild(el("span", { class: "bunkr-playlist-num" }, String(idx + 1)));
        if (finfo.category === "video") {
            let known = "";
            try { known = sessionStorage.getItem("bunkrdur:" + (href || "").split("?")[0]) || ""; } catch {}
            const durEl = el("span", { class: "bunkr-playlist-dur" }, known);
            durEl.hidden = !known;
            thumbWrap.appendChild(durEl);
        }

        const info = el("div", { class: "bunkr-playlist-info" });
        info.append(el("span", { class: "bunkr-playlist-name" }, cleanName));

        // Datas em texto simples abaixo do título (sem badges, sem ícones)
        const datesBox = el("div", { class: "bunkr-playlist-dates" });
        const upFmt = formatUploadDate(uploadTs);
        if (upFmt) {
            datesBox.append(el("div", { class: "bunkr-playlist-date-row" },
                el("span", { class: "bunkr-playlist-date-lbl" }, "Data de envio:"),
                el("span", { class: "bunkr-playlist-date-val" }, upFmt)
            ));
        }
        if (dt && dt.displayDate) {
            const lbl = el("span", {
                class: "bunkr-playlist-date-lbl bunkr-has-tip",
                title: "Data identificada e extraída do nome do arquivo (definida no upload)"
            }, "Data extraída:");
            lbl.appendChild(el("span", { class: "bunkr-tip-icon", title: "Data identificada e extraída do nome do arquivo (definida no upload)" }, "ⓘ"));
            datesBox.append(el("div", { class: "bunkr-playlist-date-row" },
                lbl,
                el("span", { class: "bunkr-playlist-date-val" }, dt.displayDate)
            ));
        }
        if (datesBox.childNodes.length) info.append(datesBox);

        if (current) {
            const meta = el("div", { class: "bunkr-playlist-meta" });
            meta.append(el("span", { class: "bunkr-playlist-meta-active" }, finfo.category === "video" ? "Reproduzindo agora" : "Visualizando agora"));
            info.append(meta);
        }
        card.append(thumbWrap, info);
        return card;
    }

    function syncNavButtons(hasMultiple) {
        document.querySelectorAll(".bunkr-plc-prev, .bunkr-plc-next, .bunkr-nav-side").forEach(b => {
            b.classList.toggle("is-disabled", !hasMultiple);
        });
    }

    let playlistFull = false;
    /* playlist COMPLETA do álbum buscado (filtrada por ?q=; item atual marcado + centralizado; cada link leva o ?q= adiante) */
    function renderPlaylist(list, files, countEl) {
        if (!list || !files) return;
        const q = getQ().toLowerCase(), cur = fileSlug();
        list.textContent = "";
        let curBtn = null;
        let count = 0;
        const activeDir = plSortMode === "upload-date" ? plUploadDateDir : plTitleDateDir;
        const sortedFiles = sortFileList(files, plSortMode, activeDir);
        sortedFiles.forEach(f => {
            const name = (f.original || f.name || "").trim();
            if (q && name.toLowerCase().indexOf(q) === -1) return;
            const href = fileHref(f);
            const isV = isVidFile(f);
            const isCur = f.slug === cur;
            const card = playlistCard(name, href, f.thumbnail, isV, isCur, count, f.timestamp);
            list.appendChild(card);
            if (isCur) curBtn = card;
            count++;
        });
        if (countEl) countEl.textContent = count ? `(${count})` : "";
        const stage = list.closest(".bunkr-stage");
        if (stage) {
            stage.classList.toggle("has-playlist", count > 0);
            stage.classList.toggle("has-nav", count > 1);
        }
        syncNavButtons(count > 1);
        if (curBtn && window.innerWidth > 768) {
            setTimeout(() => {
                try { curBtn.scrollIntoView({ block: "center", behavior: "smooth" }); } catch {}
            }, 100);
        }
    }

    /* fallback rápido enquanto o álbum não baixou: a partir do #related-files-grid (poucos), também filtrado por ?q= */
    function renderRelatedToPlaylist(list, countEl) {
        if (!list || playlistFull) return;
        const grid = document.querySelector("#related-files-grid");
        let items = grid ? Array.from(grid.querySelectorAll(":scope > .theItem")) : [];
        const activeDir = plSortMode === "upload-date" ? plUploadDateDir : plTitleDateDir;
        const sig = items.length + "|" + getQ() + "|" + plSortMode + "|" + activeDir;
        if (list.dataset.sig === sig) return;
        list.dataset.sig = sig;
        const q = getQ().toLowerCase(), cur = fileSlug();
        list.textContent = "";
        let curBtn = null;
        let count = 0;

        if (plSortMode === "upload-date") {
            items.sort((a, b) => {
                const tA = parseUploadTimestamp(a.querySelector(".theDate")?.textContent);
                const tB = parseUploadTimestamp(b.querySelector(".theDate")?.textContent);
                return plUploadDateDir === "desc" ? (tB - tA) : (tA - tB);
            });
        } else if (plSortMode === "title-date") {
            items.sort((a, b) => {
                const nmA = (a.getAttribute("title") || a.querySelector(".theName")?.textContent || "").trim();
                const nmB = (b.getAttribute("title") || b.querySelector(".theName")?.textContent || "").trim();
                const dtA = extractDateFromTitle(nmA);
                const dtB = extractDateFromTitle(nmB);
                const tA = dtA ? dtA.timestamp : (plTitleDateDir === "desc" ? -Infinity : Infinity);
                const tB = dtB ? dtB.timestamp : (plTitleDateDir === "desc" ? -Infinity : Infinity);
                return plTitleDateDir === "desc" ? (tB - tA) : (tA - tB);
            });
        } else if (plSortMode === "name") {
            items.sort((a, b) => {
                const nmA = (a.getAttribute("title") || a.querySelector(".theName")?.textContent || "").trim();
                const nmB = (b.getAttribute("title") || b.querySelector(".theName")?.textContent || "").trim();
                const dtA = extractDateFromTitle(nmA);
                const dtB = extractDateFromTitle(nmB);
                const nameA = cleanTitleWithoutDate(nmA, dtA);
                const nameB = cleanTitleWithoutDate(nmB, dtB);
                return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" });
            });
        }

        items.forEach(it => {
            const a = it.querySelector("a[href]"), thumb = it.querySelector(".grid-images_box-img"), theName = it.querySelector(".theName");
            const nm = (it.getAttribute("title") || (theName ? theName.textContent : "") || "").trim();
            if (q && nm.toLowerCase().indexOf(q) === -1) return;
            const isV = !!(it.querySelector(".type-Video") || it.querySelector('img[src*="video.svg"]'));
            let href = a ? a.href : "#";
            if (getQ() && a) {
                try { const u = new URL(a.href); u.searchParams.set("q", getQ()); href = u.toString(); } catch {}
            }
            const isCur = a && a.href && a.href.includes("/" + cur);
            const uploadTs = it.querySelector(".theDate")?.textContent || "";
            const card = playlistCard(nm, href, thumb ? (thumb.getAttribute("src") || thumb.src) : "", isV, isCur, count, uploadTs);
            list.appendChild(card);
            if (isCur) curBtn = card;
            count++;
        });
        if (countEl) countEl.textContent = count ? `(${count})` : "";
        const stage = list.closest(".bunkr-stage");
        if (stage) {
            stage.classList.toggle("has-playlist", count > 0);
            stage.classList.toggle("has-nav", count > 1);
        }
        syncNavButtons(count > 1);
        if (curBtn && window.innerWidth > 768) {
            setTimeout(() => {
                try { curBtn.scrollIntoView({ block: "center", behavior: "smooth" }); } catch {}
            }, 100);
        }
    }

    function populatePlaylist(sidebar, list, countEl) {
        renderRelatedToPlaylist(list, countEl);
        const stage = document.querySelector(".bunkr-stage");
        const syncGallery = () => {
            if (!stage || !stage._galleryBtn) return;
            const albumA = document.querySelector('a[href*="/a/"]');
            if (albumA && albumA.href) {
                stage._galleryBtn.href = albumA.href;
                stage._galleryBtn.style.display = "inline-flex";
            }
        };
        syncGallery();
        loadAlbumFiles().then(files => {
            syncGallery();
            if (files && files.length) {
                playlistFull = true;
                renderPlaylist(list, files, countEl);
                syncGallery();
            }
        });
    }

    /* prev/próxima mídia DENTRO do álbum filtrado (navega por página: /f/{slug}?q=). Lê albumFilesCache no clique (carrega async). */
    function navFile(dir) {
        let list = [];
        if (albumFilesCache && albumFilesCache.length) {
            const q = getQ().toLowerCase();
            list = q ? albumFilesCache.filter(f => (f.original || f.name || "").toLowerCase().indexOf(q) !== -1) : albumFilesCache;
            const activeDir = plSortMode === "upload-date" ? plUploadDateDir : plTitleDateDir;
            list = sortFileList(list, plSortMode, activeDir);
            if (list.length >= 2) {
                const cur = fileSlug();
                let i = list.findIndex(f => f.slug === cur);
                if (i === -1) i = dir > 0 ? -1 : 0;   // atual fora do filtro → começa do vizinho na direção
                const ni = ((i + dir) % list.length + list.length) % list.length;
                const f = list[ni];
                if (f) { location.href = hrefWithPosition(fileHref(f), ni + 1); return; }
            }
        }
        // Fallback: se albumFilesCache não tiver carregado ainda, usa os links renderizados na playlist
        const items = Array.from(document.querySelectorAll(".bunkr-playlist-item[href]"));
        if (items.length >= 2) {
            let i = items.findIndex(it => it.classList.contains("is-current"));
            if (i === -1) i = dir > 0 ? -1 : 0;
            const ni = ((i + dir) % items.length + items.length) % items.length;
            const target = items[ni];
            if (target && target.href) location.href = hrefWithPosition(target.href, ni + 1);
        }
    }
    /* liga o filtro ?q=: clique em qualquer /f/ leva o ?q= adiante; no ÁLBUM, espelha a busca nativa no ?q= (persiste + reaplica no F5) */
    function initFilter() {
        document.addEventListener("click", e => {
            const q = getQ(); if (!q) return;
            const a = e.target.closest && e.target.closest('a[href*="/f/"], a[href*="/i/"], a[href*="/v/"], a[href*="/d/"]'); if (!a) return;
            try { const u = new URL(a.href); if (!u.searchParams.get("q")) { u.searchParams.set("q", q); a.href = u.toString(); } } catch {}
        }, true);
        if (document.documentElement.classList.contains("bunkr-file")) return;   // resto é só no álbum
        const hook = () => {
            const inp = document.querySelector("#advFilterInput"); if (!inp || inp.dataset.qHook) return !!inp;
            inp.dataset.qHook = "1";
            const q = getQ(); if (q && !inp.value) { inp.value = q; inp.dispatchEvent(new Event("input", { bubbles: true })); }
            let t; inp.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => setQ(inp.value.trim()), 200); });
            return true;
        };
        if (!hook()) { let n = 0; const id = setInterval(() => { if (hook() || ++n > 40) clearInterval(id); }, 250); }   // o input do advanced view aparece com o JS da bunkr
    }
