    /* ===================== DISPARO E EXTRAÇÃO DA CDN FILESTER ===================== */
    function triggerNativeLoad() {
        try {
            if (typeof window.loadVideo === "function") {
                window.loadVideo();
                return;
            }
            const ov = document.querySelector("#videoPlayOverlay, [onclick*='loadVideo']");
            if (ov) ov.click();
        } catch (e) {}
    }

    function getFilesterVideoSrc() {
        const v = document.querySelector("#videoContainer video, #videoPlayer, .plyr video, video");
        if (v) {
            const s = v.getAttribute("src") || v.src || "";
            if (s && /^https?:\/\//i.test(s) && !s.endsWith("#") && (/token=/i.test(s) || /\.mp4/i.test(s) || /cdn/i.test(s))) {
                return s;
            }
            const source = v.querySelector("source[src]");
            if (source) {
                const ss = source.getAttribute("src") || source.src || "";
                if (ss && /^https?:\/\//i.test(ss) && !ss.endsWith("#") && (/token=/i.test(ss) || /\.mp4/i.test(ss) || /cdn/i.test(ss))) return ss;
            }
        }
        return null;
    }

    let playerMounted = false;
    function mountOwnPlayer(mid, src) {
        if (playerMounted || !src) return;
        playerMounted = true; mediaMounted = true;
        document.querySelectorAll("#videoContainer video, .plyr video, video").forEach(v => {
            try { v.pause(); v.muted = true; } catch {}
        });

        const ac = new AbortController();
        const video = el("video", { class: "fl-video", playsinline: "", preload: "metadata" });
        video.volume = prefs.volume ?? 1;
        video.muted = prefs.muted ?? false;
        video.addEventListener("volumechange", () => {
            prefs.volume = video.volume; prefs.muted = video.muted; saveP();
        }, { signal: ac.signal });

        const host = el("div", { class: "fl-host fl-pl" }, video);
        buildPlayerControls(host, video, src, ac, {
            nav: navFile,
            // botão Baixar: o botão de download da própria página, senão o src
            download: () => {
                const dlBtn = document.getElementById("downloadButton") || document.querySelector('a[id*="download" i], .download-btn');
                if (dlBtn) dlBtn.click(); else if (src) window.open(src, "_blank");
            },
        });
        mid.appendChild(host);

        video.addEventListener("loadedmetadata", () => {
            if (!Number.isFinite(video.duration)) return;
            const text = fmtT(video.duration);
            try { sessionStorage.setItem("fldur:" + location.origin + location.pathname, text); sessionStorage.setItem("fldur:" + location.pathname, text); } catch {}
            const badge = document.querySelector(".fl-playlist-item.is-current .fl-playlist-dur");
            if (badge) { badge.textContent = text; badge.hidden = false; }
        }, { signal: ac.signal });
        video.src = src;
        try { video.load(); } catch (e) {}
        document.querySelectorAll("#videoPlayOverlay, .video-play-overlay").forEach(ov => ov.style.display = "none");
    }

    function findPageImage() {
        const imgs = Array.from(document.querySelectorAll("img")).filter(img => {
            if (img.closest("header, .fl-sidebar, .related-files-grid, .files-list")) return false;
            if (img.classList.contains("fl-playlist-thumb")) return false;
            const src = img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("src") || img.src || "";
            if (!src || /logo|icon|avatar|favicon/i.test(src)) return false;
            return true;
        });
        const fullRes = imgs.find(img => {
            const src = img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("src") || img.src || "";
            return !/\/thumbs\//i.test(src);
        });
        return fullRes || imgs[0] || null;
    }

    function appendImageChrome(host) {
        const mkAct = (ic, label, cb) => {
            const b = el("button", { type: "button", class: "fl-plc-act", title: label, "aria-label": label });
            b.innerHTML = ic;
            b.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); cb(); });
            return b;
        };
        const prevBtn = mkAct(PL_ICONS.prev, "Anterior", () => navFile(-1));
        const nextBtn = mkAct(PL_ICONS.next, "Próximo", () => navFile(1));
        const reportBtn = mkAct(PL_ICONS.flag, "Reportar", () => {
            const a = document.querySelector('a[href*="report"], a[href*="abuse"]');
            if (a && a.href) window.open(a.href, "_blank", "noopener");
            else toast("Sem página de denúncia neste site");
        });
        const dlb = mkAct(PL_ICONS.download, "Baixar", () => {
            const dlBtn = document.getElementById("downloadButton") || document.querySelector('a[id*="download" i], .download-btn');
            const img = host.querySelector(".fl-image");
            if (dlBtn) dlBtn.click();
            else if (img && (img.currentSrc || img.src)) window.open(img.currentSrc || img.src, "_blank", "noopener");
        });
        const shareBtn = mkAct(PL_ICONS.share, "Compartilhar / Copiar link", () => {
            copyText(location.href).then(ok => {
                toast(ok ? "Link copiado!" : "Falha ao copiar link");
                if (ok) { shareBtn.innerHTML = PL_ICONS.check; setTimeout(() => { shareBtn.innerHTML = PL_ICONS.share; }, 1600); }
            });
        });
        const fsb = mkAct(PL_ICONS.expand, "Tela cheia (f)", () => {
            try {
                if (document.fullscreenElement) document.exitFullscreen();
                else host.requestFullscreen();
            } catch { /* fullscreen blocked */ }
        });
        const row = el("div", { class: "fl-plc-row" },
            el("div", { class: "fl-plc-left" }, prevBtn, nextBtn),
            el("div", { class: "fl-plc-right" }, reportBtn, dlb, shareBtn, fsb)
        );
        host.append(el("div", { class: "fl-plc-bottom" }, row));
    }

    let zoomMounted = false;
    function mountPhotoZoom(mid) {
        if (zoomMounted) return;
        const img = findPageImage();
        if (!img) return;
        const realSrc = img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("src") || img.src || "";
        if (!realSrc) return;
        zoomMounted = true; mediaMounted = true;
        const host = el("div", { class: "fl-img-host" });
        mid.appendChild(host);
        const newImg = el("img", {
            class: "fl-image",
            src: realSrc,
            alt: "",
            style: "opacity: 1 !important; filter: none !important; position: static !important; display: block !important;"
        });
        host.appendChild(newImg);
        appendImageChrome(host);
        bindZoom(mid, newImg, { host, padH: 190, keys: { nav: navFile, fullscreenTarget: () => document.querySelector(".fl-stage") } });
    }

    /* ===================== ARQUIVO DE TEXTO (.txt/.md/.nfo/.log/.json/.csv) ===================== */
    // Leitor de texto do core (core/viewers.js). Conteúdo: texto já presente na página, senão o link de
    // download (mesma origem, até 1 MB); se nada der certo o cartão mostra o aviso e o botão Baixar.
    function filesterTextUrl() {
        const a = document.querySelector('a#downloadButton[href], a[id*="download" i][href], a.download-btn[href], a[download][href], a[href*="/download"]');
        const href = a ? (a.getAttribute("href") || "") : "";
        if (!href || href === "#" || /^javascript:/i.test(href)) return "";
        try { return new URL(href, location.href).href; } catch { return ""; }
    }
    function fetchText(url, maxBytes) {
        return new Promise(resolve => {
            const done = t => resolve(typeof t === "string" && !/^\s*<(?:!DOCTYPE|html)/i.test(t) ? t.slice(0, maxBytes) : "");
            if (typeof GM_xmlhttpRequest === "function") {
                GM_xmlhttpRequest({ method: "GET", url, headers: { Range: `bytes=0-${maxBytes - 1}` }, onload: r => done(r.status < 400 ? r.responseText : ""), onerror: () => done(""), ontimeout: () => done(""), timeout: 15000 });
            } else {
                fetch(url, { headers: { Range: `bytes=0-${maxBytes - 1}` } }).then(r => (r.ok ? r.text() : "")).then(done, () => done(""));
            }
        });
    }
    let textMounted = false;
    function mountFilesterText(mid) {
        if (textMounted) return;
        textMounted = true; mediaMounted = true;
        const h1 = document.querySelector("main h1") || Array.from(document.querySelectorAll("h1")).find(h => !h.closest("header"));
        const name = h1 ? (h1.textContent || "").trim() : "";
        const url = filesterTextUrl();
        mountTextCard(mid, {
            ext: (name.match(/\.([a-z0-9]{1,5})$/i) || [0, "txt"])[1],
            downloadUrl: url,
            load: async () => {
                const native = Array.from(document.querySelectorAll("main pre, main textarea, main code")).find(n => !n.closest(".fl-stage") && (n.textContent || "").trim());
                if (native) return native.tagName === "TEXTAREA" ? native.value : native.textContent;
                return url ? fetchText(url, 1048576) : "";
            },
        });
    }