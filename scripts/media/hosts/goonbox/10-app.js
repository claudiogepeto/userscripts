    const PAGE = 100;
    const MAX_PAGES = 100;
    const FRESH_MS = 120000;
    const ACCENT = "#10b981";

    const nativePush = history.pushState.bind(history);
    const nativeReplace = history.replaceState.bind(history);

    const albums = new Map();
    const imageAlbum = new Map();

    let albumJob = 0;
    let imageJob = 0;
    let pushedImage = false;
    let app = null;
    let galleryPanel = null;
    let stagePanel = null;
    // Preferências do goonbox (ordem, agrupar, proporção real, sidebar recolhida).
    const GBX_PREFS_KEY = "gbx_prefs";
    const gbxPrefs = Object.assign({ sort: "default", dir: "desc", grouped: false, realAspect: true, sidebarCollapsed: false }, (() => {
        try { return JSON.parse(localStorage.getItem(GBX_PREFS_KEY)) || {}; } catch { return {}; }
    })());
    const saveGbxPrefs = () => { try { localStorage.setItem(GBX_PREFS_KEY, JSON.stringify(gbxPrefs)); } catch { /* storage blocked */ } };
    let uiQuery = "";
    let uiSort = gbxPrefs.sort || "default";
    let uiDir = gbxPrefs.dir || "desc";
    let zoomCtl = null;

    function canonicalId(segment) {
        let id = segment;
        try { id = decodeURIComponent(segment); } catch { id = segment; }
        const dot = id.lastIndexOf(".");
        if (dot !== -1) {
            const tail = id.slice(dot + 1);
            if (/^[A-Za-z0-9]+$/.test(tail)) return tail;
        }
        return id;
    }

    function parseAlbum(path) {
        const match = path.match(/^\/a\/([^/]+)/);
        return match ? canonicalId(match[1]) : null;
    }

    function parseImage(path) {
        const match = path.match(/^\/img\/([^/]+)/);
        return match ? canonicalId(match[1]) : null;
    }

    function currentRoute() {
        return { albumId: parseAlbum(location.pathname), imageId: parseImage(location.pathname) };
    }


    function svg(path) {
        const wrap = el("span", { class: "gbx-ico", "aria-hidden": "true" });
        wrap.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
        return wrap;
    }

    const ICON = {
        download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
        copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
        full: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
        flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
        grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
        prev: '<polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/>',
        next: '<polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/>',
        chevL: '<path d="m15 18-6-6 6-6"/>',
        chevR: '<path d="m9 18 6-6-6-6"/>',
    };

    function formatBytes(bytes) {
        const n = Number(bytes);
        if (!n || n < 0) return "";
        const units = ["B", "KB", "MB", "GB"];
        let value = n;
        let index = 0;
        while (value >= 1024 && index < units.length - 1) {
            value /= 1024;
            index += 1;
        }
        const shown = index === 0 || value >= 10 ? value.toFixed(0) : value.toFixed(1);
        return `${shown} ${units[index]}`;
    }

    function norm(raw) {
        if (!raw || typeof raw !== "object") return null;
        const id = raw.encoded_id ?? raw.id;
        if (!id || raw.deleted_at) return null;
        const original = raw.original_url ?? "";
        const medium = raw.medium_url ?? original;
        const thumb = raw.thumb_url ?? medium ?? original;
        if (!original && !medium && !thumb) return null;
        return {
            id: String(id),
            name: raw.original_filename || String(id),
            mime: raw.mime || "",
            width: Number(raw.width) || 0,
            height: Number(raw.height) || 0,
            bytes: Number(raw.size_bytes) || 0,
            created: raw.created_at || "",
            original,
            medium: medium || original || thumb,
            thumb: thumb || medium || original,
        };
    }

    async function api(path) {
        const headers = { Accept: "application/json" };
        try {
            const token = localStorage.getItem("authToken");
            if (token) headers.Authorization = `Bearer ${token}`;
        } catch { /* storage blocked */ }
        const res = await fetch(path, { credentials: "include", headers });
        let data = null;
        try { data = await res.json(); } catch { data = null; }
        if (!res.ok) {
            const message = data && typeof data.message === "string" && data.message
                ? data.message
                : `Falha na requisição (${res.status})`;
            const err = new Error(message);
            err.status = res.status;
            throw err;
        }
        return data ?? {};
    }

    // Ids cujo índice gbx-img:<id> já foi gravado nesta sessão (evita regravar a cada visita).
    const storedImageKeys = new Set();
    function rememberAlbum(model, persist = true) {
        albums.set(model.albumId, model);
        for (const image of model.images) imageAlbum.set(image.id, model.albumId);
        if (!persist) return;
        try {
            const slim = {
                albumId: model.albumId,
                title: model.album?.title ?? "",
                username: model.album?.user?.username ?? "",
                at: model.at,
                images: model.images.map(image => ({
                    id: image.id,
                    name: image.name,
                    mime: image.mime,
                    width: image.width,
                    height: image.height,
                    bytes: image.bytes,
                    created: image.created,
                    original: image.original,
                    medium: image.medium,
                    thumb: image.thumb,
                })),
            };
            const json = JSON.stringify(slim);
            if (json.length < 1500000) {
                sessionStorage.setItem(`gbx-album:${model.albumId}`, json);
                for (const image of model.images) {
                    const key = `${model.albumId}:${image.id}`;
                    if (storedImageKeys.has(key)) continue;
                    sessionStorage.setItem(`gbx-img:${image.id}`, model.albumId);
                    storedImageKeys.add(key);
                }
            }
        } catch { /* quota or private mode */ }
    }

    function albumIdForImage(imageId) {
        const mem = imageAlbum.get(imageId);
        if (mem) return mem;
        try { return sessionStorage.getItem(`gbx-img:${imageId}`) || null; } catch { return null; }
    }

    function readStoredAlbum(albumId) {
        try {
            const raw = sessionStorage.getItem(`gbx-album:${albumId}`);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (!data || data.albumId !== albumId || !Array.isArray(data.images)) return null;
            const images = data.images.map(norm).filter(Boolean);
            images.forEach((image, index) => { image.order = index; });
            return {
                albumId,
                album: { title: data.title || "Álbum", user: data.username ? { username: data.username } : null },
                images,
                total: images.length,
                at: data.at || 0,
                viewIds: null,
            };
        } catch {
            return null;
        }
    }

    function displayName(user) {
        if (!user) return "";
        return user.display_name || user.username || "";
    }

    const CSS = `
        html.gbx-on #root { display: none !important; }
        html.gbx-on, html.gbx-on body { background: #0b0c0f !important; color: #fff !important; overflow: hidden !important; }
        #gbx-app, #gbx-app * { box-sizing: border-box; }
        #gbx-app {
            position: fixed; inset: 0; z-index: 2147483000; display: flex; background: #0b0c0f; color: #fff;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
        }
        .gbx-panel { display: flex; flex-direction: column; min-width: 0; min-height: 0; flex: 1 1 auto; }
        .gbx-panel.is-hidden { display: none !important; }
        .gbx-top {
            flex: 0 0 auto; display: flex; align-items: center; gap: 10px; padding: 0 16px;
            background: #0e0f13; border-bottom: 1px solid rgba(255,255,255,.08); min-height: 52px;
        }
        .gbx-logo { display: inline-flex; align-items: center; gap: 8px; color: #fff; text-decoration: none; font-weight: 800; letter-spacing: -0.03em; flex: 0 0 auto; }
        .gbx-mark {
            width: 26px; height: 26px; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center;
            background: linear-gradient(135deg, #6ee7b7, ${ACCENT}); color: #052e22; font: 800 14px/1 Inter, system-ui, sans-serif;
        }
        .gbx-logo b { color: ${ACCENT}; font-weight: 800; }
        .gbx-title { min-width: 0; display: flex; flex-direction: column; gap: 2px; flex: 1 1 auto; }
        .gbx-title strong { font-size: 15px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .gbx-title span, .gbx-sub { color: rgba(255,255,255,.62); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .gbx-title a, .gbx-profile { color: #6ee7b7; text-decoration: none; }
        .gbx-title a:hover, .gbx-profile:hover { text-decoration: underline; }
        .gbx-ico { display: inline-flex; width: 16px; height: 16px; }
        .gbx-ico svg { width: 16px; height: 16px; }
        .gbx-scroll { flex: 1 1 auto; min-height: 0; overflow: auto; }
        .gbx-scroll > .gbx-gallery-actionbar { margin: 18px 18px 0; }
        .gbx-gallery-actionbar, .gbx-gallery-actionbar input, .gbx-gallery-actionbar button { font-family: Inter, system-ui, sans-serif; }
        .gbx-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px;
            padding: 18px; align-items: start;
        }
        .gbx-card {
            display: flex; flex-direction: column; gap: 8px; padding: 0; border: 0; background: transparent; color: inherit;
            text-align: left; cursor: pointer; min-width: 0;
        }
        .gbx-card-media {
            background: #111318; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,.06);
        }
        .gbx-card-media img { width: 100%; height: auto; display: block; }
        /* Proporção real desligada: cards uniformes 16:9 recortados */
        .gbx-grid.is-uniform .gbx-card-media { aspect-ratio: 16 / 9 !important; }
        .gbx-grid.is-uniform .gbx-card-media img { height: 100%; object-fit: cover; }
        .gbx-card:hover .gbx-card-media { border-color: rgba(16,185,129,.55); }
        .gbx-card-name { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .gbx-grid.is-full-names .gbx-card-name { white-space: normal; word-break: break-all; }
        .gbx-card-sub { color: rgba(255,255,255,.55); font-size: 12px; }
        .gbx-note { padding: 28px 18px; color: rgba(255,255,255,.7); }

        /* Foto no stage do bunkr: barra de ações sobre a imagem */
        .gbx-stage-mid > .gbx-img-host { width: 100%; height: 100%; touch-action: none; }
        .gbx-image { cursor: zoom-in; user-select: none; -webkit-user-drag: none; touch-action: none; }
        .gbx-bar {
            position: absolute; left: 0; right: 0; bottom: 0; z-index: 5; display: flex; align-items: center; justify-content: space-between; gap: 8px;
            padding: 28px 12px 10px; background: linear-gradient(to top, rgba(0,0,0,.9) 0%, rgba(0,0,0,.45) 62%, transparent 100%);
            opacity: 0; pointer-events: none; transition: opacity .18s ease;
        }
        .gbx-stage-mid:hover .gbx-bar, .gbx-stage-mid:focus-within .gbx-bar { opacity: 1; pointer-events: auto; }
        .gbx-bar-side { display: flex; align-items: center; gap: 2px; }
        .gbx-act {
            width: 36px; height: 36px; border: 0; border-radius: 50%; background: transparent; color: #fff;
            display: inline-flex; align-items: center; justify-content: center; cursor: pointer; padding: 0;
        }
        .gbx-act:hover { background: rgba(255,255,255,.14); }
        .gbx-act:disabled { opacity: .35; cursor: default; }
        .gbx-act .gbx-ico, .gbx-act .gbx-ico svg { width: 20px; height: 20px; }
        .gbx-nav-side:disabled { display: none; }
        @media (hover: none) { .gbx-bar { opacity: 1; pointer-events: auto; } }
        .gbx-stage-mid > .gbx-note { position: absolute; z-index: 3; }
        @media (max-width: 768px) {
            .gbx-top { flex-wrap: wrap; padding: 8px 12px; }
        }

${mediaComponentCSS(mediaTheme()).player}
${mediaComponentCSS(mediaTheme()).actionbar}
${mediaComponentCSS(mediaTheme()).dates}
${mediaComponentCSS(mediaTheme()).misc}
    `;

    function ensureStyle() {
        if (document.getElementById("gbx-style")) return;
        const style = document.createElement("style");
        style.id = "gbx-style";
        style.textContent = CSS;
        (document.head || document.documentElement).append(style);
    }

    function ensureApp() {
        document.documentElement.classList.add("gbx-on");
        if (app && app.isConnected) return;
        ensureStyle();
        app = el("div", { id: "gbx-app" });
        galleryPanel = el("div", { class: "gbx-panel" });
        stagePanel = el("div", { class: "gbx-panel is-hidden" });
        app.append(galleryPanel, stagePanel);
        const mount = () => {
            if (!document.body) return;
            document.body.append(app);
        };
        if (document.body) mount();
        else document.addEventListener("DOMContentLoaded", mount, { once: true });
    }

    function teardown() {
        albumJob += 1;
        imageJob += 1;
        document.documentElement.classList.remove("gbx-on");
        if (app) app.remove();
        app = null;
        galleryPanel = null;
        stagePanel = null;
        zoomCtl = null;
    }

    function showPanel(which) {
        if (!galleryPanel || !stagePanel) return;
        galleryPanel.classList.toggle("is-hidden", which !== "gallery");
        stagePanel.classList.toggle("is-hidden", which !== "stage");
    }

    function logoLink() {
        const link = el("a", { class: "gbx-logo", href: "/" });
        link.append(el("span", { class: "gbx-mark" }, "G"), el("span", null, "goon", el("b", null, "box")));
        link.addEventListener("click", event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
            event.preventDefault();
            location.assign("/");
        });
        return link;
    }

    function goAlbum(albumId, replace) {
        const url = `/a/${albumId}${location.search}${location.hash}`;
        if (replace) nativeReplace({ gbx: 1 }, "", url);
        else nativePush({ gbx: 1 }, "", url);
        queueRender();
    }

    function leaveStage(albumId) {
        if (pushedImage) {
            pushedImage = false;
            history.back();
            return;
        }
        if (albumId) goAlbum(albumId, false);
        else location.assign("/");
    }

    function goImage(imageId, replace) {
        const url = `/img/${imageId}`;
        if (replace) nativeReplace({ gbx: 1 }, "", url);
        else {
            pushedImage = true;
            nativePush({ gbx: 1 }, "", url);
        }
        queueRender();
    }

    // Busca (?q=) e fichas de ordenação valem para a grade e para a lista lateral do stage:
    // as setas e o teclado seguem a mesma ordem que se vê.
    function orderedImages(model) {
        const query = uiQuery.trim().toLowerCase();
        const list = query
            ? model.images.filter(image => image.name.toLowerCase().includes(query) || image.id.toLowerCase().includes(query))
            : model.images;
        return orderedSort(list);
    }

    const SORT_ACC = { name: image => image.name, upload: image => new Date(image.created || 0).getTime() || 0, size: image => image.bytes };
    function orderedSort(images) {
        const base = images.slice().sort((a, b) => a.order - b.order);
        return mediaSortItems(base, uiSort, uiDir, SORT_ACC);
    }
    function setSort(mode, dir) {
        uiSort = mode; uiDir = dir;
        gbxPrefs.sort = mode; gbxPrefs.dir = dir; saveGbxPrefs();
    }
    function sortChips(kind, onChange) {
        const icon = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${d}</svg>`;
        const side = kind === "sidebar";
        return mediaSortChips({
            kind,
            mode: uiSort,
            dirs: { [uiSort]: uiDir },
            chips: [
                { key: "default", label: "Padrão", title: "Ordem do álbum" },
                { key: "upload", label: "Data de Envio", dir: true, title: "Ordenar por data de envio", icon: side ? "" : icon('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>') },
                { key: "title", label: "Data Extraída", dir: true, title: "Ordenar por data extraída do nome do arquivo", icon: side ? "" : icon('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>') },
                { key: "name", label: "A-Z", dir: true, title: "Ordenar por nome alfabético", icon: side ? "" : icon('<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="8" y2="18"/>') },
                { key: "size", label: "Tamanho", dir: true, title: "Ordenar por tamanho de arquivo", icon: side ? "" : icon('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>') }
            ],
            onChange: (mode, dir) => { setSort(mode, dir); onChange(); }
        });
    }
    function kindOf(image) {
        const mime = image.mime || "";
        if (mime.startsWith("video/")) return "video";
        if (mime.startsWith("text/")) return "text";
        if (mime.startsWith("image/") || /\.(jpe?g|png|gif|webp|avif|bmp)$/i.test(image.name)) return "image";
        return "other";
    }

    function paintStatus(panel, text) {
        panel.replaceChildren(el("div", { class: "gbx-top" }, logoLink()), el("p", { class: "gbx-note", role: "status" }, text));
    }

    function galleryCard(model, image) {
        if (!model.cards) model.cards = new Map();
        let card = model.cards.get(image.id);
        if (card) return card;
        const media = el("span", { class: "gbx-card-media" });
        if (image.width && image.height) media.style.aspectRatio = `${image.width} / ${image.height}`;
        const pic = el("img", { src: image.thumb, alt: "", loading: "lazy" });
        media.append(pic);
        const subParts = [formatBytes(image.bytes), image.width && image.height ? `${image.width}×${image.height}` : ""].filter(Boolean);
        card = el("button", { class: "gbx-card", type: "button", "aria-label": `Abrir ${image.name}` },
            media,
            el("span", { class: "gbx-card-name", title: image.name }, image.name),
            el("span", { class: "gbx-card-sub" }, subParts.join(" · "))
        );
        card.addEventListener("click", () => goImage(image.id, false));
        model.cards.set(image.id, card);
        return card;
    }

    function galleryCountLabel(model) {
        const loaded = model.images.length;
        const total = model.total || loaded;
        return loaded === total ? `${total} ${total === 1 ? "imagem" : "imagens"}` : `${loaded} / ${total} imagens`;
    }

    // Filtro sem reconstruir a grade: só alterna a visibilidade dos cards já montados.
    function applyGalleryFilter(model) {
        const view = galleryPanel && galleryPanel._gbxView;
        if (!view || view.model !== model) return;
        const list = orderedImages(model);
        model.viewIds = list.map(image => image.id);
        const visible = new Set(model.viewIds);
        for (const image of model.images) {
            const card = model.cards && model.cards.get(image.id);
            if (card) card.style.display = visible.has(image.id) ? "" : "none";
        }
        for (const group of view.headers) {
            const n = group.images.filter(image => visible.has(image.id)).length;
            group.count.textContent = `${n} ${n === 1 ? "arquivo" : group.unit}`;
            group.hdr.style.display = n ? "" : "none";
        }
        view.empty.textContent = list.length ? "" : (model.images.length ? "Nenhuma imagem corresponde ao filtro." : "Este álbum não tem imagens.");
        view.empty.style.display = list.length ? "none" : "";
        const total = model.images.length;
        view.bar.setCount(list.length === total ? `Total: ${total} arquivos` : `${list.length} de ${total} arquivos`);
    }

    // Põe os cards na ordem das fichas e, com o agrupamento ligado, sob os cabeçalhos de tipo.
    function arrangeGallery(model) {
        const view = galleryPanel && galleryPanel._gbxView;
        if (!view || view.model !== model) return;
        view.headers.forEach(group => group.hdr.remove());
        view.headers = [];
        const ordered = orderedSort(model.images);
        const frag = document.createDocumentFragment();
        if (!gbxPrefs.grouped) {
            for (const image of ordered) frag.append(galleryCard(model, image));
        } else {
            const defs = [
                { key: "video", title: "Vídeos", unit: "vídeos", icon: MEDIA_ICONS.video },
                { key: "image", title: "Fotos", unit: "fotos", icon: MEDIA_ICONS.image },
                { key: "text", title: "Documentos & Textos", unit: "textos", icon: MEDIA_ICONS.doc },
                { key: "other", title: "Outros Arquivos", unit: "arquivos", icon: MEDIA_ICONS.archive },
            ];
            for (const def of defs) {
                const images = ordered.filter(image => kindOf(image) === def.key);
                if (!images.length) continue;
                const count = el("span", { class: "gbx-group-count" });
                const hdr = el("div", { class: "gbx-group-header", "data-group": def.key },
                    el("div", { class: "gbx-group-header-left" }, el("span", { html: def.icon }), el("span", null, def.title), count),
                    el("div", { class: "gbx-group-line" })
                );
                view.headers.push({ hdr, count, unit: def.unit, images });
                frag.append(hdr);
                for (const image of images) frag.append(galleryCard(model, image));
            }
        }
        view.grid.append(frag);
        applyGalleryFilter(model);
    }

    // Página nova da API: acrescenta só os cards novos à grade já pintada.
    function growGallery(model, added) {
        const view = galleryPanel && galleryPanel._gbxView;
        if (!view || view.model !== model || !view.grid.isConnected || parseAlbum(location.pathname) !== model.albumId) {
            paintGallery(model);
            return;
        }
        view.count.textContent = galleryCountLabel(model);
        // Em "Padrão" sem agrupar basta anexar os novos no fim; nas outras ordens os cards
        // existentes são movidos (não recriados) para a posição ordenada.
        if (uiSort === "default" && !gbxPrefs.grouped) {
            const frag = document.createDocumentFragment();
            for (const image of added) frag.append(galleryCard(model, image));
            view.grid.append(frag);
            applyGalleryFilter(model);
        } else {
            arrangeGallery(model);
        }
    }

    function profileLink(user) {
        const username = user?.username || "";
        if (!username) return null;
        const profile = el("a", { class: "gbx-profile", href: `/u/${encodeURIComponent(username)}`, title: "Perfil de quem enviou" }, displayName(user));
        profile.addEventListener("click", event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
            event.preventDefault();
            location.assign(profile.href);
        });
        return profile;
    }

    // Grade do álbum: cabeçalho (título, contagem, perfil) e a barra de ações do bunkr com
    // "Proporção real" (cards no formato da imagem ou uniformes 16:9).
    function paintGallery(model) {
        if (!galleryPanel) return;
        if (parseAlbum(location.pathname) !== model.albumId) return;
        uiQuery = mediaGetQ();
        const album = model.album ?? {};
        const title = album.title || "Álbum";

        const heading = el("div", { class: "gbx-title" });
        heading.append(el("strong", { title: title }, title));
        const meta = el("span");
        const count = document.createTextNode(galleryCountLabel(model));
        meta.append(count);
        const profile = profileLink(album.user ?? null);
        if (profile) meta.append(document.createTextNode(" · "), profile);
        heading.append(meta);

        const grid = el("div", { class: "gbx-grid" + (gbxPrefs.realAspect ? "" : " is-uniform") });
        const aspect = el("button", { type: "button", class: "gbx-act-btn" + (gbxPrefs.realAspect ? " is-active" : ""), title: "Cards no formato real de cada imagem (desligado: 16:9 uniforme)" });
        aspect.insertAdjacentHTML("beforeend", MEDIA_ICONS.image);
        aspect.append(el("span", { class: "label" }, "Proporção real"));
        aspect.addEventListener("click", () => {
            gbxPrefs.realAspect = !gbxPrefs.realAspect; saveGbxPrefs();
            aspect.classList.toggle("is-active", gbxPrefs.realAspect);
            grid.classList.toggle("is-uniform", !gbxPrefs.realAspect);
        });
        const visibleImages = () => (model.viewIds || []).map(id => model.images.find(image => image.id === id)).filter(Boolean);
        const bar = buildActionBar({
            sort: sortChips("bar", () => arrangeGallery(model)),
            grouped: gbxPrefs.grouped,
            onGroup: on => { gbxPrefs.grouped = on; saveGbxPrefs(); arrangeGallery(model); },
            onFullNames: on => grid.classList.toggle("is-full-names", on),
            names: () => visibleImages().map(image => image.name),
            urls: () => visibleImages().map(image => image.original || image.medium),
            onSearch: q => { uiQuery = q; applyGalleryFilter(model); },
            extra: [aspect]
        });

        const top = el("div", { class: "gbx-top" }, logoLink(), heading);
        const previousScroll = galleryPanel.querySelector(".gbx-scroll");
        const scrollTop = previousScroll ? previousScroll.scrollTop : 0;
        const empty = el("p", { class: "gbx-note" });
        grid.append(empty);
        const scroll = el("div", { class: "gbx-scroll" }, bar.bar, grid);
        // Cards montados com a grade ainda fora do documento (um só layout ao anexar).
        galleryPanel._gbxView = { model, grid, empty, count, bar, headers: [] };
        arrangeGallery(model);
        if (album.description) galleryPanel.replaceChildren(top, el("p", { class: "gbx-note" }, album.description), scroll);
        else galleryPanel.replaceChildren(top, scroll);
        scroll.scrollTop = scrollTop;
        showPanel("gallery");
    }

    function neighbors(model, imageId) {
        const source = model.viewIds && model.viewIds.includes(imageId)
            ? model.viewIds
            : model.images.map(image => image.id);
        const index = source.indexOf(imageId);
        if (index !== -1 && source.length > 1) {
            return {
                prev: index > 0 ? source[index - 1] : null,
                next: index < source.length - 1 ? source[index + 1] : null,
                position: index + 1,
                total: source.length,
            };
        }
        const nav = model.nav;
        if (nav) {
            return {
                prev: nav.prev_id || null,
                next: nav.next_id || null,
                position: nav.position || null,
                total: nav.total || null,
            };
        }
        return { prev: null, next: null, position: index === -1 ? null : 1, total: source.length || 1 };
    }

    function stageSrc(image) {
        if (image.mime === "image/gif") return image.original || image.medium;
        return image.medium || image.original;
    }

    // Sidebar recolhível do stage (tecla p). A abertura automática de álbum com 1 imagem recolhe
    // só aquela abertura (singleCollapseId), sem gravar a preferência.
    let singleCollapseId = null;
    function toggleSidebar(forceState) {
        const stage = stagePanel && stagePanel.querySelector(".gbx-stage");
        if (!stage) return;
        const collapsed = typeof forceState === "boolean" ? forceState : !stage.classList.contains("is-sidebar-collapsed");
        stage.classList.toggle("is-sidebar-collapsed", collapsed);
        singleCollapseId = null;
        gbxPrefs.sidebarCollapsed = collapsed; saveGbxPrefs();
    }

    function sidebarCard(image, index, current) {
        const thumbWrap = el("div", { class: "gbx-playlist-thumb-wrap" },
            el("img", { class: "gbx-playlist-thumb", src: image.thumb, alt: "", loading: "lazy" }),
            el("span", { class: "gbx-playlist-kind" }, image.mime === "image/gif" ? "GIF" : "Imagem"),
            el("span", { class: "gbx-playlist-num" }, String(index + 1))
        );
        const info = el("div", { class: "gbx-playlist-info" }, el("span", { class: "gbx-playlist-name" }, cleanTitleWithoutDate(image.name, extractDateFromTitle(image.name), true)));
        const dates = el("div", { class: "gbx-playlist-dates" });
        if (image.created) dates.append(el("div", { class: "gbx-playlist-date-row", title: "Data de envio" }, el("span", { class: "gbx-playlist-date-val" }, formatDisplayDate(image.created))));
        const dt = extractDateFromTitle(image.name);
        if (dt && dt.displayDate) dates.append(el("div", { class: "gbx-playlist-date-row", title: "Data extraída do nome do arquivo" }, el("span", { class: "gbx-playlist-date-val" }, dt.displayDate)));
        if (dates.childNodes.length) info.append(dates);
        if (current) info.append(el("div", { class: "gbx-playlist-meta" }, el("span", { class: "gbx-playlist-meta-active" }, "Visualizando agora")));
        const item = el("a", { class: "gbx-playlist-item" + (current ? " is-current" : ""), href: `/img/${image.id}`, title: image.name }, thumbWrap, info);
        item.addEventListener("click", event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
            event.preventDefault();
            if (!current) goImage(image.id, true);
        });
        return item;
    }

    // Zoom 1x/2x/4x + arrastar: core/viewers.js (bindZoom); o teclado da foto fica no keydown abaixo.

    // Stage do bunkr: topbar (logo, nome, posição/tamanho/dimensões/data, perfil), foto com setas
    // laterais e barra de ações, e a sidebar com busca, abas de tipo, fichas e a lista do álbum.
    function paintStage(model, imageId) {
        if (!stagePanel) return;
        if (parseImage(location.pathname) !== imageId) return;
        const image = model.images.find(item => item.id === imageId) || model.images[0];
        if (!image) {
            paintStatus(stagePanel, "Imagem não encontrada.");
            showPanel("stage");
            return;
        }
        uiQuery = mediaGetQ();
        if (!model.viewIds) model.viewIds = orderedImages(model).map(item => item.id);
        const albumId = model.albumId;
        const near = neighbors(model, image.id);
        const pos = near.position ? `${near.position} / ${near.total}` : "";
        const goNear = dir => {
            const n = neighbors(model, image.id);
            const id = dir < 0 ? n.prev : n.next;
            if (id) goImage(id, true);
        };

        const tabs = mediaTypeTabs({ active: "all", onChange: () => renderList() });
        const sort = sortChips("sidebar", () => refreshList());
        const profile = profileLink(model.album?.user ?? null);
        const parts = buildMediaStage({
            kind: "image",
            name: image.name,
            stats: [pos, formatBytes(image.bytes), image.width && image.height ? `${image.width}×${image.height}` : "", formatDisplayDate(image.created)],
            logo: logoLink(),
            vrowExtra: profile ? [profile] : null,
            nav: goNear,
            collapsed: singleCollapseId === image.id || !!gbxPrefs.sidebarCollapsed,
            galleryHref: albumId ? `/a/${albumId}` : "",
            sidebarTitle: "Imagens do álbum",
            tabs,
            sort,
            onSearch: q => { uiQuery = q; refreshList(); }
        });
        const stage = parts.stage;
        parts.gallery.addEventListener("click", event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
            event.preventDefault();
            leaveStage(albumId);
        });

        const act = (label, icon, onClick, nav) => {
            const button = el("button", { class: "gbx-act", type: "button", title: label, "aria-label": label });
            if (nav) button.dataset.gbxNav = nav;
            button.append(svg(icon));
            button.addEventListener("click", event => {
                event.preventDefault();
                event.stopPropagation();
                onClick();
            });
            return button;
        };
        const prev = act("Anterior", ICON.prev, () => goNear(-1), "prev");
        const next = act("Próximo", ICON.next, () => goNear(1), "next");
        const report = act("Reportar", ICON.flag, () => window.open(`${location.origin}/removals`, "_blank", "noopener"));
        const download = act("Baixar", ICON.download, () => {
            const link = el("a", { href: image.original || image.medium, download: image.name, target: "_blank", rel: "noopener" });
            link.click();
        });
        const copy = act("Copiar link", ICON.copy, () => {
            copyText(`${location.origin}/img/${image.id}`).then(ok => toast(ok ? "Link copiado!" : "Falha ao copiar link"));
        });
        const full = act("Tela cheia (f)", ICON.full, () => {
            const target = app || document.documentElement;
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
            else target.requestFullscreen?.().catch(() => {});
        });
        const bar = el("div", { class: "gbx-bar" },
            el("div", { class: "gbx-bar-side" }, prev, next),
            el("div", { class: "gbx-bar-side" }, report, download, copy, full)
        );

        const host = el("div", { class: "gbx-img-host" });
        const pic = el("img", { class: "gbx-image", src: stageSrc(image), alt: image.name, draggable: "false" });
        host.append(pic);
        parts.mid.append(host, bar);
        // Troca progressiva: mostra a versão média e passa para a original quando ela termina de baixar.
        if (image.mime !== "image/gif" && image.original && image.original !== pic.src) {
            const fullImage = new Image();
            fullImage.onload = () => { if (pic.isConnected) pic.src = image.original; };
            fullImage.src = image.original;
        }
        pic.addEventListener("error", () => {
            if (!parts.mid.querySelector(".gbx-note")) parts.mid.append(el("p", { class: "gbx-note" }, "Não foi possível carregar esta imagem."));
        });

        const sideNav = Array.from(parts.mid.querySelectorAll(".gbx-nav-side"));
        sideNav.forEach(button => { button.dataset.gbxNav = button.classList.contains("gbx-nav-prev") ? "prev" : "next"; });
        const refreshNav = () => {
            const n = neighbors(model, image.id);
            prev.disabled = !n.prev; next.disabled = !n.next;
            sideNav.forEach(button => { button.disabled = button.dataset.gbxNav === "prev" ? !n.prev : !n.next; });
            stage.classList.toggle("has-nav", !!(n.prev || n.next));
        };
        let currentItem = null;
        const renderList = () => {
            const tab = (tabs.querySelector(".is-active") || {}).dataset?.tab || "all";
            const byId = new Map(model.images.map(item => [item.id, item]));
            const strip = (model.viewIds || []).map(id => byId.get(id)).filter(Boolean);
            const shown = tab === "all" ? strip : strip.filter(item => kindOf(item) === tab);
            const counts = { all: strip.length, video: 0, image: 0, text: 0 };
            strip.forEach(item => { const k = kindOf(item); if (k in counts) counts[k] += 1; });
            tabs.update(counts);
            parts.count.textContent = String(strip.length);
            const frag = document.createDocumentFragment();
            currentItem = null;
            shown.forEach((item, index) => {
                const card = sidebarCard(item, index, item.id === image.id);
                if (item.id === image.id) currentItem = card;
                frag.append(card);
            });
            parts.list.replaceChildren(frag);
        };
        const refreshList = () => {
            model.viewIds = orderedImages(model).map(item => item.id);
            renderList();
            refreshNav();
        };
        renderList();
        refreshNav();
        stage.classList.toggle("has-playlist", !!albumId || model.images.length > 1);

        stagePanel.replaceChildren(stage);
        showPanel("stage");
        if (currentItem && currentItem.scrollIntoView) {
            requestAnimationFrame(() => currentItem.scrollIntoView({ block: "nearest", inline: "nearest" }));
        }
        zoomCtl = bindZoom(host, pic);
    }

    function takeImages(model, rows) {
        let added = 0;
        for (const raw of rows || []) {
            const image = norm(raw);
            if (!image || model.seen.has(image.id)) continue;
            image.order = model.images.length;
            model.seen.add(image.id);
            model.images.push(image);
            added += 1;
        }
        return added;
    }

    // Álbum com UMA imagem: pula a grade e abre direto no stage (replace → o álbum não fica no histórico).
    // Só 1× por álbum por aba: quem volta pela Galeria / voltar vê a grade → sem loop.
    // A sidebar abre recolhida só nessa abertura (singleCollapseId); a preferência salva não muda.
    const singleOpened = new Set();
    function openSingleImage(model) {
        if (!model || model.images.length !== 1 || (model.total || 0) > 1) return false;
        const key = `gbx-single:${model.albumId}`;
        if (singleOpened.has(model.albumId)) return false;
        try { if (sessionStorage.getItem(key)) return false; } catch {}
        try { const nav = performance.getEntriesByType("navigation")[0]; if (nav && nav.type === "back_forward") return false; } catch {}
        singleOpened.add(model.albumId);
        try { sessionStorage.setItem(key, "1"); } catch {}
        rememberAlbum(model);
        singleCollapseId = model.images[0].id;
        goImage(model.images[0].id, true);
        return true;
    }

    async function showAlbum(albumId) {
        const job = ++albumJob;
        imageJob += 1;
        ensureApp();
        const cached = albums.get(albumId) || readStoredAlbum(albumId);
        if (cached && Date.now() - cached.at < FRESH_MS && cached.images.length) {
            albums.set(albumId, cached);
            if (openSingleImage(cached)) return;
            paintGallery(cached);
            return;
        }
        if (galleryPanel) paintStatus(galleryPanel, "Carregando álbum…");
        showPanel("gallery");
        try {
            const [meta, first] = await Promise.all([
                api(`/api/albums/${encodeURIComponent(albumId)}?per_page=1`),
                api(`/api/albums/${encodeURIComponent(albumId)}/images?page=1&per_page=${PAGE}`),
            ]);
            if (job !== albumJob) return;
            const model = {
                albumId,
                album: meta.album || { title: "Álbum" },
                images: [],
                seen: new Set(),
                total: first.pagination?.total || meta.album?.images_count || 0,
                viewIds: null,
                nav: null,
                at: Date.now(),
            };
            takeImages(model, first.images);
            if (openSingleImage(model)) return;
            let last = Math.min(first.pagination?.last_page || 1, MAX_PAGES);
            rememberAlbum(model, false);
            paintGallery(model);
            // Páginas restantes com até 3 requisições em paralelo, aplicadas na ordem;
            // sessionStorage é gravado uma vez só, quando o álbum termina de carregar.
            const pending = new Map();
            let nextFetch = 2, nextApply = 2, stop = false, failure = null;
            const applyReady = () => {
                while (!stop && pending.has(nextApply)) {
                    const data = pending.get(nextApply);
                    pending.delete(nextApply);
                    nextApply += 1;
                    last = Math.min(data.pagination?.last_page || last, MAX_PAGES);
                    model.total = data.pagination?.total || model.total;
                    const before = model.images.length;
                    const added = takeImages(model, data.images);
                    model.at = Date.now();
                    rememberAlbum(model, false);
                    growGallery(model, model.images.slice(before));
                    if (added === 0) stop = true;
                }
            };
            const worker = async () => {
                while (!stop && !failure && nextFetch <= last) {
                    const page = nextFetch++;
                    try {
                        const data = await api(`/api/albums/${encodeURIComponent(albumId)}/images?page=${page}&per_page=${PAGE}`);
                        if (job !== albumJob) { stop = true; return; }
                        pending.set(page, data);
                        applyReady();
                    } catch (error) {
                        failure = failure || error;
                    }
                }
            };
            await Promise.all([worker(), worker(), worker()]);
            if (job !== albumJob) return;
            if (failure) throw failure;
            rememberAlbum(model);
        } catch (error) {
            if (job !== albumJob) return;
            const missing = error.status === 404;
            paintStatus(galleryPanel, missing ? "Este álbum não está disponível." : (error.message || "Não foi possível carregar o álbum."));
            showPanel("gallery");
        }
    }

    async function showImage(imageId) {
        const job = ++imageJob;
        ensureApp();
        const knownAlbum = albumIdForImage(imageId);
        const cached = knownAlbum ? (albums.get(knownAlbum) || readStoredAlbum(knownAlbum)) : null;
        if (cached && cached.images.some(image => image.id === imageId)) {
            albums.set(cached.albumId, cached);
            paintStage(cached, imageId);
        } else if (stagePanel) {
            paintStatus(stagePanel, "Carregando imagem…");
            showPanel("stage");
        }
        try {
            const data = await api(`/api/images/${encodeURIComponent(imageId)}`);
            if (job !== imageJob) return;
            const fresh = norm(data.image);
            if (!fresh) throw Object.assign(new Error("Imagem não encontrada."), { status: 404 });
            if (cached && cached.images.some(image => image.id === fresh.id)) {
                const item = cached.images.find(image => image.id === fresh.id);
                Object.assign(item, fresh);
                cached.at = Date.now();
                rememberAlbum(cached);
                paintStage(cached, fresh.id);
                return;
            }
            const siblings = (data.album_images || []).map(norm).filter(Boolean);
            let images = siblings.length ? siblings : [fresh];
            if (!images.some(image => image.id === fresh.id)) images = [fresh, ...images];
            images = images.map((image, index) => ({ ...image, ...(image.id === fresh.id ? fresh : {}), order: index }));
            const uploader = data.uploader || data.image?.user || null;
            const model = {
                albumId: knownAlbum,
                album: { title: fresh.name, user: uploader, description: null },
                images,
                total: data.album_nav?.total || images.length,
                viewIds: null,
                nav: data.album_nav || null,
                at: Date.now(),
            };
            if (knownAlbum) rememberAlbum(model);
            paintStage(model, fresh.id);
        } catch (error) {
            if (job !== imageJob) return;
            if (cached && cached.images.some(image => image.id === imageId)) return;
            const missing = error.status === 404;
            paintStatus(stagePanel, missing ? "Esta imagem não está disponível." : (error.message || "Não foi possível carregar a imagem."));
            showPanel("stage");
        }
    }

    function render() {
        lastPath = location.pathname;
        const albumId = parseAlbum(location.pathname);
        if (albumId && location.pathname !== `/a/${albumId}`) {
            nativeReplace(history.state, "", `/a/${albumId}${location.search}${location.hash}`);
        }
        const imageId = parseImage(location.pathname);
        if (!albumId && imageId && location.pathname !== `/img/${imageId}`) {
            nativeReplace(history.state, "", `/img/${imageId}${location.search}${location.hash}`);
        }
        lastPath = location.pathname;
        const route = currentRoute();
        if (!route.albumId && !route.imageId) {
            if (app) teardown();
            return;
        }
        if (!document.body) {
            document.addEventListener("DOMContentLoaded", queueRender, { once: true });
            document.documentElement.classList.add("gbx-on");
            ensureStyle();
            return;
        }
        if (route.albumId) showAlbum(route.albumId);
        else showImage(route.imageId);
    }

    let scheduled = false;
    function queueRender() {
        if (scheduled) return;
        scheduled = true;
        queueMicrotask(() => {
            scheduled = false;
            render();
        });
    }

    window.addEventListener("popstate", queueRender);

    window.addEventListener("keydown", event => {
        if (!app || !app.isConnected) return;
        const target = event.target;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
        const route = currentRoute();
        if (!route.imageId || stagePanel?.classList.contains("is-hidden")) return;
        if (event.key === "Escape") {
            if (zoomCtl && zoomCtl.isZoomed()) { zoomCtl.reset(); return; }
            event.preventDefault();
            leaveStage(albumIdForImage(route.imageId));
            return;
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            const button = stagePanel.querySelector(`[data-gbx-nav="${event.key === "ArrowLeft" ? "prev" : "next"}"]`);
            if (!button || button.disabled) return;
            event.preventDefault();
            button.click();
            return;
        }
        if (event.shiftKey && (event.key === "N" || event.key === "P")) {
            const button = stagePanel.querySelector(`[data-gbx-nav="${event.key === "P" ? "prev" : "next"}"]`);
            if (button && !button.disabled) { event.preventDefault(); button.click(); }
            return;
        }
        if (event.key === "p") { event.preventDefault(); toggleSidebar(); return; }
        if (event.key === "+" || event.key === "=") { if (zoomCtl) zoomCtl.zoomIn(); return; }
        if (event.key === "-" || event.key === "_") { if (zoomCtl) zoomCtl.zoomOut(); return; }
        if (event.key === "0") { if (zoomCtl) zoomCtl.reset(); return; }
        if (event.key === "f" || event.key === "F") {
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
            else app.requestFullscreen?.().catch(() => {});
        }
    });

    let lastPath = location.pathname;
    // Rotas SPA: envolve pushState/replaceState (+ popstate) em vez de checar a URL por intervalo.
    onHistoryChange(() => {
        if (location.pathname === lastPath) return;
        lastPath = location.pathname;
        queueRender();
    });

    if (currentRoute().albumId || currentRoute().imageId) {
        document.documentElement.classList.add("gbx-on");
        ensureStyle();
    }
    queueRender();
})();
