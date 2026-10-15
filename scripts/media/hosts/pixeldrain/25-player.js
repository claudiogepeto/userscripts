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

    function fmtT(s) {
        s = Math.max(0, Math.floor(s || 0));
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
        const p = n => String(n).padStart(2, "0");
        return h ? h + ":" + p(m) + ":" + p(ss) : m + ":" + p(ss);
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

    function buildPlayerControls(wrap, video, ac) {
        const mkAct = (ic, label, on) => {
            const b = el("button", { type: "button", class: "pdx-plc-act", title: label, "aria-label": label });
            b.innerHTML = ic; b.addEventListener("click", on); return b;
        };
        const toggle = () => {
            if (!video.paused) { video.pause(); return; }
            const p = video.play(); if (p && p.catch) p.catch(() => {});
        };

        // SEEK ±5s + flash
        const sflash = el("div", { class: "pdx-plc-seekflash" }); let sflashT;
        const seek = d => {
            if (!video.duration) return;
            video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + d));
            sflash.textContent = d < 0 ? "« 5s" : "5s »";
            sflash.classList.add("on");
            clearTimeout(sflashT);
            sflashT = setTimeout(() => sflash.classList.remove("on"), 480);
        };

        let clickT = null;
        video.addEventListener("click", e => {
            e.preventDefault(); e.stopPropagation();
            if (clickT) return;
            clickT = setTimeout(() => { clickT = null; toggle(); }, 230);
        });
        video.addEventListener("dblclick", e => {
            e.preventDefault(); e.stopPropagation();
            if (clickT) { clearTimeout(clickT); clickT = null; }
            const r = video.getBoundingClientRect();
            seek((e.clientX - r.left) < r.width / 2 ? -5 : 5);
        });

        // Play central grande
        const playBtn = el("button", { type: "button", class: "pdx-plc-play", "aria-label": "Play/Pause" });
        playBtn.innerHTML = PL_ICONS.play;
        playBtn.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); toggle(); });
        const flash = el("div", { class: "pdx-plc-flash" }, playBtn);

        // Barra de progresso com scrubber
        const buf = el("div", { class: "pdx-plc-buf" });
        const knob = el("div", { class: "pdx-plc-knob" });
        const fill = el("div", { class: "pdx-plc-fill" }, knob);
        const bar = el("div", { class: "pdx-plc-bar" }, buf, fill);
        const prog = el("div", { class: "pdx-plc-prog" }, bar);
        const seekTo = (cx, r) => {
            if (!video.duration || !r.width) return;
            video.currentTime = Math.max(0, Math.min(1, (cx - r.left) / r.width)) * video.duration;
        };
        prog.addEventListener("pointerdown", e => {
            e.preventDefault(); e.stopPropagation();
            const r = bar.getBoundingClientRect();
            seekTo(e.clientX, r);
            const mv = ev => seekTo(ev.clientX, r);
            const up = () => { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); };
            document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
        });

        // Tempo
        const tEl = el("span", { class: "pdx-plc-time" }, "0:00");
        const syncTime = () => {
            const s = fmtT(video.currentTime) + (video.duration ? " / " + fmtT(video.duration) : "");
            if (tEl.firstChild.data !== s) tEl.firstChild.data = s;
        };
        video.addEventListener("timeupdate", () => {
            if (video.duration) fill.style.width = (video.currentTime / video.duration * 100) + "%";
            syncTime();
        });
        video.addEventListener("loadedmetadata", syncTime);
        video.addEventListener("progress", () => {
            try {
                if (video.buffered.length && video.duration) buf.style.width = (video.buffered.end(video.buffered.length - 1) / video.duration * 100) + "%";
            } catch {}
        });

        // Volume
        const mute = mkAct(PL_ICONS.mute, "Mudo (m)", e => {
            e.stopPropagation(); video.muted = !video.muted;
            if (!video.muted && !video.volume) video.volume = 1;
            syncVol();
        });
        const volfill = el("div", { class: "pdx-plc-volfill" });
        const volbar = el("div", { class: "pdx-plc-volbar", role: "slider", "aria-label": "Volume" }, volfill);
        const syncVol = () => {
            mute.innerHTML = (video.muted || !video.volume) ? PL_ICONS.mute : PL_ICONS.volume;
            volfill.style.width = ((video.muted ? 0 : video.volume) * 100) + "%";
        };
        const setVolFromX = (cx, r) => {
            if (!r.width) return;
            const v = Math.max(0, Math.min(1, (cx - r.left) / r.width));
            video.volume = v; video.muted = (v === 0); syncVol();
        };
        volbar.addEventListener("pointerdown", e => {
            e.preventDefault(); e.stopPropagation();
            const r = volbar.getBoundingClientRect(); setVolFromX(e.clientX, r);
            const mv = ev => setVolFromX(ev.clientX, r);
            const up = () => { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); };
            document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
        });
        const volgrp = el("div", { class: "pdx-plc-vol" }, mute, volbar);

        // Controles Lado a Lado: Play, Anterior, Próximo, Skip -5s, Skip +5s
        const barPlay = mkAct(PL_ICONS.play, "Play/Pause (espaço)", e => { e.stopPropagation(); toggle(); });
        barPlay.classList.add("pdx-plc-barplay");

        const navPrevBtn = mkAct(PL_ICONS.prev, "Mídia anterior (Shift+P)", e => { e.stopPropagation(); navItem(-1); });
        const navNextBtn = mkAct(PL_ICONS.next, "Próxima mídia (Shift+N)", e => { e.stopPropagation(); navItem(1); });

        const mkSkip = (ic, label, on) => {
            const b = el("button", { type: "button", class: "pdx-plc-act pdx-plc-skip", title: label, "aria-label": label });
            b.innerHTML = ic; b.appendChild(el("span", { class: "pdx-plc-skipn" }, "5"));
            b.addEventListener("click", on); return b;
        };
        const skipBack = mkSkip(PL_ICONS.skipBack, "Voltar 5s (←)", e => { e.stopPropagation(); seek(-5); });
        const skipFwd = mkSkip(PL_ICONS.skipFwd, "Avançar 5s (→)", e => { e.stopPropagation(); seek(5); });

        // VELOCIDADE (texto plano, sem pill pesado)
        const RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];
        const speedMenu = el("div", { class: "pdx-plc-speedmenu" });
        const speedBtn = el("button", { type: "button", class: "pdx-plc-act pdx-plc-speed", title: "Velocidade", "aria-label": "Velocidade" }, "1x");
        const speedWrap = el("div", { class: "pdx-plc-speedwrap" }, speedMenu, speedBtn);
        let speedCloser = null;
        const closeSpeed = () => { speedMenu.classList.remove("open"); if (speedCloser) { document.removeEventListener("pointerdown", speedCloser, true); speedCloser = null; } };
        const openSpeed = () => { speedMenu.classList.add("open"); speedCloser = ev => { if (!speedWrap.contains(ev.target)) closeSpeed(); }; document.addEventListener("pointerdown", speedCloser, true); };
        RATES.forEach(r => {
            const it = el("button", { type: "button", class: "pdx-plc-speeditem" }, r + "x");
            it.dataset.r = r;
            it.addEventListener("click", e => { e.stopPropagation(); try { video.playbackRate = r; } catch {} closeSpeed(); });
            speedMenu.appendChild(it);
        });
        speedBtn.addEventListener("click", e => { e.stopPropagation(); speedMenu.classList.contains("open") ? closeSpeed() : openSpeed(); });
        const syncSpeed = () => {
            const r = video.playbackRate;
            speedBtn.textContent = r + "x";
            speedMenu.querySelectorAll(".pdx-plc-speeditem").forEach(it => it.classList.toggle("on", +it.dataset.r === r));
        };
        video.addEventListener("ratechange", () => { prefs.rate = video.playbackRate; saveP(); syncSpeed(); });
        video.addEventListener("loadedmetadata", () => {
            try { video.playbackRate = prefs.rate || 1; } catch {}
            const f = state.file;
            if (f && f.id && Number.isFinite(video.duration)) rememberDur(f.id, fmtT(video.duration));
        });

        // Download, Copiar Link & Fullscreen
        const goFs = () => { try { document.fullscreenElement ? document.exitFullscreen() : wrap.requestFullscreen(); } catch {} };
        const dlb = mkAct(PL_ICONS.download, "Baixar via mirror", e => { e.stopPropagation(); const f = state.file; if (f) window.open(M().dl(f.id), "_blank"); });
        const shareBtn = mkAct(PL_ICONS.share, "Compartilhar / Copiar link", e => {
            e.stopPropagation();
            const f = state.file;
            const link = f ? M().dl(f.id) : location.href;
            copyText(link).then(ok => {
                toast(ok ? "Link copiado!" : "Falha ao copiar link");
                if (ok) { shareBtn.innerHTML = PL_ICONS.check; setTimeout(() => { shareBtn.innerHTML = PL_ICONS.share; }, 1600); }
            });
        });
        const reportBtn = mkAct(PL_ICONS.flag, "Reportar", e => {
            e.stopPropagation();
            const a = document.querySelector('a[href*="report"], a[href*="abuse"]');
            if (a && a.href) window.open(a.href, "_blank");
            else toast("Sem página de denúncia neste site");
        });
        let pipBtn = null;
        if (document.pictureInPictureEnabled) {
            pipBtn = mkAct(PL_ICONS.pip, "Picture-in-Picture", async e => {
                e.stopPropagation();
                try {
                    if (document.pictureInPictureElement) await document.exitPictureInPicture();
                    else if (video.requestPictureInPicture) await video.requestPictureInPicture();
                } catch {}
            });
        }
        const fsb = mkAct(PL_ICONS.expand, "Tela cheia (f)", e => { e.stopPropagation(); goFs(); });

        const apBtn = el("button", {
            type: "button",
            class: "pdx-plc-act pdx-plc-autoplay" + (prefs.autoplay ? " is-active" : ""),
            title: prefs.autoplay ? "Reprodução automática ativada" : "Reprodução automática desativada",
            "aria-label": "Reprodução automática"
        },
            el("span", { class: "pdx-plc-ap-label" }, "Autoplay"),
            el("span", { class: "pdx-plc-ap-pill" }, el("span", { class: "pdx-plc-ap-knob" }))
        );
        apBtn.addEventListener("click", e => {
            e.stopPropagation();
            prefs.autoplay = !prefs.autoplay;
            saveP();
            apBtn.classList.toggle("is-active", !!prefs.autoplay);
            toast(prefs.autoplay ? "Autoplay ativado" : "Autoplay desativado");
        });
        video.addEventListener("ended", () => {
            if (prefs.autoplay) setTimeout(() => navItem(1), 600);
        });

        const loopBtn = mkAct(PL_ICONS.repeat, prefs.loop ? "Repetição ativada" : "Repetição desativada", e => {
            e.stopPropagation();
            video.loop = !video.loop;
            prefs.loop = video.loop;
            saveP();
            loopBtn.classList.toggle("is-active", video.loop);
            toast(video.loop ? "Repetição ativada" : "Repetição desativada");
        });
        if (prefs.loop) { video.loop = true; loopBtn.classList.add("is-active"); }

        // Montagem das Linhas
        const leftc = el("div", { class: "pdx-plc-left" }, barPlay, loopBtn, navPrevBtn, navNextBtn, skipBack, skipFwd, volgrp, tEl);
        const rightc = el("div", { class: "pdx-plc-right" }, apBtn, speedWrap, reportBtn, dlb, shareBtn);
        if (pipBtn) rightc.appendChild(pipBtn);
        rightc.appendChild(fsb);
        const row = el("div", { class: "pdx-plc-row" }, leftc, rightc);
        const bottom = el("div", { class: "pdx-plc-bottom" }, prog, row);

        // Setas laterais grandes (hover nas pontas)
        const al = albumInfo(), multi = !!(al && al.files.length > 1);
        const sideArrows = [];
        if (multi) {
            const prevA = el("button", { type: "button", class: "pdx-plc-side pdx-plc-sprev", title: "Mídia anterior", "aria-label": "Mídia anterior" });
            prevA.innerHTML = PL_ICONS.chevL; prevA.addEventListener("click", e => { e.stopPropagation(); navItem(-1); });
            const nextA = el("button", { type: "button", class: "pdx-plc-side pdx-plc-snext", title: "Próxima mídia", "aria-label": "Próxima mídia" });
            nextA.innerHTML = PL_ICONS.chevR; nextA.addEventListener("click", e => { e.stopPropagation(); navItem(1); });
            sideArrows.push(prevA, nextA);
        }

        // Widget de Mirror no canto superior direito do player (hover reveal estilo Bunkr)
        const playerMirror = buildPlayerMirrorWidget();

        video.addEventListener("play", () => { wrap.classList.add("pdx-pl-playing"); playBtn.innerHTML = PL_ICONS.pause; barPlay.innerHTML = PL_ICONS.pause; });
        video.addEventListener("pause", () => { wrap.classList.remove("pdx-pl-playing"); playBtn.innerHTML = PL_ICONS.play; barPlay.innerHTML = PL_ICONS.play; });
        video.addEventListener("volumechange", syncVol);
        video.addEventListener("seeking", () => { if (cur && cur.restoring) return; wrap.classList.add("pdx-pl-buffering"); });
        ["seeked", "canplay", "playing", "loadeddata", "pause", "suspend", "error", "abort"].forEach(ev => video.addEventListener(ev, () => wrap.classList.remove("pdx-pl-buffering")));

        // Atalhos de teclado
        const setRate = dir => { const i = RATES.indexOf(video.playbackRate); const ni = Math.max(0, Math.min(RATES.length - 1, (i < 0 ? 3 : i) + dir)); try { video.playbackRate = RATES[ni]; } catch {} };
        const onKey = e => {
            if (e.ctrlKey || e.metaKey || e.altKey || inGallery()) return;
            const t = e.target;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable || (t.closest && t.closest(".pdx-search, .pdx-sidebar-search")))) return;
            const k = e.key; let h = true;
            if (k === " " || k === "k") toggle();
            else if (k === "ArrowLeft") seek(-5);
            else if (k === "ArrowRight") seek(5);
            else if (k === "j") seek(-10);
            else if (k === "l") seek(10);
            else if (k === "ArrowUp") { video.muted = false; video.volume = Math.min(1, video.volume + 0.05); }
            else if (k === "ArrowDown") video.volume = Math.max(0, video.volume - 0.05);
            else if (k === "m") { video.muted = !video.muted; if (!video.muted && !video.volume) video.volume = 1; }
            else if (k === "f") goFs();
            else if (k === "<") setRate(-1);
            else if (k === ">") setRate(1);
            else if (e.shiftKey && (k === "N" || k === "n")) navItem(1);
            else if (e.shiftKey && (k === "P" || k === "p")) navItem(-1);
            else if (k === "p" || k === "P") toggleSidebar();
            else if (k >= "0" && k <= "9" && video.duration) video.currentTime = video.duration * (+k) / 10;
            else h = false;
            if (h) { e.preventDefault(); e.stopPropagation(); }
        };
        if (ac) document.addEventListener("keydown", onKey, { capture: true, signal: ac.signal });

        wrap.append(flash, sflash, bottom, playerMirror, ...sideArrows);
        try { video.playbackRate = prefs.rate || 1; } catch {}
        syncVol(); syncTime(); syncSpeed();
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
        buildPlayerControls(host, video, ac);
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
