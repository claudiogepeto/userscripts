    /* ==================================================================== * (1) PLAYER MODERNO ESTILO YOUTUBE */
    function hideNative(preview) {
        for (const c of Array.from(preview.children)) {
            if (c.classList && c.classList.contains("pdx-host")) continue;
            if (c.style.display !== "none") { c.dataset.pdxHidden = "1"; c.style.display = "none"; }
        }
        preview.querySelectorAll("video:not(.pdx-video)").forEach(v => { try { v.pause(); v.muted = true; } catch {} });
    }
    function showNative(preview) {
        if (!preview) return;
        preview.querySelectorAll("[data-pdx-hidden]").forEach(c => { c.style.display = ""; delete c.dataset.pdxHidden; });
    }

    let cur = null;
    const state = { file: null, filter: "", stripShown: 0, stripTotal: 0 };
    try { state.filter = (new URLSearchParams(location.search).get("q") || "").trim().toLowerCase(); } catch {}

    function teardownPlayer() {
        if (!cur) return;
        try { cur.ac.abort(); } catch {}
        clearTimeout(cur.watchdog);
        if (cur.kind === "video") { try { cur.media.pause(); } catch {} }
        try { cur.media.removeAttribute("src"); if (cur.kind === "video") cur.media.load(); } catch {}
        try { cur.host.remove(); } catch {}
        showNative(cur.preview); cur = null; setMirrorLoading(false);
    }
    function clearPlayerOverlay() {
        teardownPlayer();
        document.querySelectorAll(".pdx-host").forEach(h => { try { h.remove(); } catch {} });
        const prev = document.querySelector(".file_preview"); showNative(prev);
    }


    const durKnown = new Map();
    const durPending = new Set();
    const durQueue = [];
    let durBusy = 0;
    function cachedDur(key) {
        if (!key) return "";
        if (durKnown.has(key)) return durKnown.get(key);
        try {
            const v = sessionStorage.getItem("pdxdur:" + key);
            if (v) { durKnown.set(key, v); return v; }
        } catch {}
        return "";
    }
    function rememberDur(key, text) {
        if (!key || !text) return;
        durKnown.set(key, text);
        try { sessionStorage.setItem("pdxdur:" + key, text); } catch {}
        document.querySelectorAll('.pdx-playlist-dur[data-dur-key="' + CSS.escape(key) + '"]').forEach(node => {
            node.textContent = text;
            node.hidden = false;
        });
    }
    function pumpDur() {
        while (durBusy < 2 && durQueue.length) {
            const job = durQueue.shift();
            durBusy++;
            const v = document.createElement("video");
            v.preload = "metadata";
            v.muted = true;
            v.playsInline = true;
            let settled = false;
            const finish = (text) => {
                if (settled) return;
                settled = true;
                v.removeAttribute("src");
                try { v.load(); } catch {}
                durBusy--;
                if (text) rememberDur(job.key, text);
                pumpDur();
            };
            v.addEventListener("loadedmetadata", () => finish(Number.isFinite(v.duration) ? fmtT(v.duration) : ""), { once: true });
            v.addEventListener("error", () => finish(""), { once: true });
            setTimeout(() => finish(""), 12000);
            v.src = job.url;
        }
    }
    // Sonda a duração só quando o item fica visível (watchEl = elemento observado).
    let probeDurIO = null;
    function probeDurNow(key, url) {
        if (!key || !url || cachedDur(key) || durPending.has(key)) return;
        durPending.add(key);
        durQueue.push({ key, url });
        pumpDur();
    }
    function probeDur(key, url, watchEl) {
        if (!key || !url || cachedDur(key) || durPending.has(key)) return;
        if (!watchEl || !("IntersectionObserver" in window)) { probeDurNow(key, url); return; }
        if (!probeDurIO) {
            probeDurIO = new IntersectionObserver(entries => {
                for (const e of entries) {
                    if (!e.isIntersecting) continue;
                    probeDurIO.unobserve(e.target);
                    probeDurNow(e.target._durKey, e.target._durUrl);
                }
            }, { rootMargin: "200px" });
        }
        watchEl._durKey = key;
        watchEl._durUrl = url;
        probeDurIO.observe(watchEl);
    }

    function mountPlayer(f) {
        const preview = document.querySelector(".file_preview");
        if (!preview) return;
        if (cur && cur.kind === "video" && cur.id === f.id && cur.host.isConnected) { hideNative(preview); return; }
        teardownPlayer();
        hideNative(preview);
        gIdx = prefIdx;

        const ac = new AbortController();
        const on = (e, ev, fn) => e.addEventListener(ev, fn, { signal: ac.signal });
        const video = el("video", { class: "pdx-video", playsinline: "", preload: "metadata" });
        video.volume = prefs.volume; video.muted = prefs.muted;
        on(video, "volumechange", () => { prefs.volume = video.volume; prefs.muted = video.muted; saveP(); });
        ALIVE.forEach(ev => on(video, ev, () => { if (cur) { cur.alive = true; clearTimeout(cur.watchdog); cur.fail.style.display = "none"; } setMirrorLoading(false); }));
        on(video, "error", () => nextMirror("Erro no player"));

        const fail = el("div", { class: "pdx-fail" },
            el("div", null, "Todos os mirrors falharam para este arquivo."),
            el("div", { class: "pdx-failrow" },
                el("button", { class: "pdx-mini", onClick: () => { gIdx = prefIdx; applyMirror(cur.media); } }, "↻ Tentar de novo"),
                el("a", { class: "pdx-mini", href: "https://pixeldrain.com/api/file/" + f.id, target: "_blank", rel: "noopener" }, "Abrir no oficial")));
        fail.style.display = "none";

        const host = el("div", { class: "pdx-host pdx-pl" }, video, fail);
        buildPlayerControls(host, video, "", ac, {
            nav: navItem,
            sideNav: (() => { const al = albumInfo(); return !!(al && al.files.length > 1); })(),
            // download pelo mirror atual; o widget de mirror fica sobre o player
            download: () => { const cf = state.file; if (cf) window.open(M().dl(cf.id), "_blank"); },
            downloadTitle: "Baixar via mirror",
            overlay: [buildPlayerMirrorWidget()],
            ignoreKeys: inGallery,
            quietSeek: () => !!(cur && cur.restoring),
        });
        preview.appendChild(host);
        cur = { id: f.id, kind: "video", preview, host, media: video, fail, ac, alive: false, watchdog: null, file: f };
        applyMirror(video);
    }

    function appendImageChrome(host, f) {
        const mkAct = (ic, label, cb) => {
            const b = el("button", { type: "button", class: "pdx-plc-act", title: label, "aria-label": label });
            b.innerHTML = ic;
            b.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); cb(); });
            return b;
        };
        const prevBtn = mkAct(PL_ICONS.prev, "Mídia anterior", () => navItem(-1));
        const nextBtn = mkAct(PL_ICONS.next, "Próxima mídia", () => navItem(1));
        const reportBtn = mkAct(PL_ICONS.flag, "Reportar", () => {
            const a = document.querySelector('a[href*="report"], a[href*="abuse"]');
            if (a && a.href) window.open(a.href, "_blank", "noopener");
            else toast("Sem página de denúncia neste site");
        });
        const dlb = mkAct(PL_ICONS.download, "Baixar via mirror", () => { if (f) window.open(M().dl(f.id), "_blank", "noopener"); });
        const shareBtn = mkAct(PL_ICONS.share, "Compartilhar / Copiar link", () => {
            const link = f ? M().dl(f.id) : location.href;
            copyText(link).then(ok => {
                toast(ok ? "Link copiado!" : "Falha ao copiar link");
                if (ok) { shareBtn.innerHTML = PL_ICONS.check; setTimeout(() => { shareBtn.innerHTML = PL_ICONS.share; }, 1600); }
            });
        });
        const fsb = mkAct(PL_ICONS.expand, "Tela cheia (f)", () => goFullscreen());
        const row = el("div", { class: "pdx-plc-row" },
            el("div", { class: "pdx-plc-left" }, prevBtn, nextBtn),
            el("div", { class: "pdx-plc-right" }, reportBtn, dlb, shareBtn, fsb)
        );
        host.append(el("div", { class: "pdx-plc-bottom" }, row));
    }
