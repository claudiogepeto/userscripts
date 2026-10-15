    /* ===================== CONTROLES DO PLAYER (Estilo YouTube) ===================== */
    function buildPlayerControls(wrap, video, src, ac) {
        const on = (e, ev, fn) => e.addEventListener(ev, fn, ac ? { signal: ac.signal } : undefined);
        const mkAct = (ic, label, cb) => { const b = el("button", { type: "button", class: "gf-plc-act", title: label, "aria-label": label }); b.innerHTML = ic; b.addEventListener("click", cb); return b; };

        const toggle = () => {
            if (video.paused || video.ended) {
                const p = video.play();
                if (p && p.catch) {
                    p.catch(err => {
                        console.warn("[gofile] play rejected, tentando mudo:", err);
                        video.muted = true;
                        video.play().catch(e => console.error("[gofile] play mudo falhou:", e));
                    });
                }
            } else {
                video.pause();
            }
        };

        const sflash = el("div", { class: "gf-plc-seekflash" }); let sft;
        const seek = d => { if (!video.duration) return; video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + d)); sflash.textContent = d < 0 ? "« 5s" : "5s »"; sflash.classList.add("on"); clearTimeout(sft); sft = setTimeout(() => sflash.classList.remove("on"), 480); };

        let clickT = null;
        on(video, "click", e => { e.preventDefault(); e.stopPropagation(); if (clickT) return; clickT = setTimeout(() => { clickT = null; toggle(); }, 230); });
        on(video, "dblclick", e => { e.preventDefault(); e.stopPropagation(); if (clickT) { clearTimeout(clickT); clickT = null; } const r = video.getBoundingClientRect(); seek((e.clientX - r.left) < r.width / 2 ? -5 : 5); });

        const playBtn = el("button", { type: "button", class: "gf-plc-play", "aria-label": "Play/Pause" }); playBtn.innerHTML = IC.play;
        playBtn.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); toggle(); });

        const flash = el("div", { class: "gf-plc-flash" }, playBtn);
        flash.addEventListener("click", e => {
            if (e.target !== flash && !flash.contains(e.target)) return;
            e.preventDefault(); e.stopPropagation(); toggle();
        });

        const buf = el("div", { class: "gf-plc-buf" });
        const knob = el("div", { class: "gf-plc-knob" });
        const fill = el("div", { class: "gf-plc-fill" }, knob);
        const bar = el("div", { class: "gf-plc-bar" }, buf, fill);
        const timeTip = el("div", { class: "gf-plc-timetip" }, "0:00");
        const prog = el("div", { class: "gf-plc-prog" }, bar, timeTip);
        const seekTo = (cx, r) => { if (!video.duration || !r.width) return; video.currentTime = Math.max(0, Math.min(1, (cx - r.left) / r.width)) * video.duration; };
        prog.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); const r = bar.getBoundingClientRect(); seekTo(e.clientX, r); const mv = ev => seekTo(ev.clientX, r); const up = () => { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); }; document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up); });
        prog.addEventListener("pointermove", ev => {
            const r = bar.getBoundingClientRect();
            if (!r.width || !video.duration) return;
            const ratio = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
            timeTip.textContent = fmtT(ratio * video.duration);
            timeTip.style.left = (ratio * 100) + "%";
        });

        const tEl = el("span", { class: "gf-plc-time" }, "0:00");
        const syncTime = () => { const s = fmtT(video.currentTime) + (video.duration ? " / " + fmtT(video.duration) : ""); if (tEl.firstChild && tEl.firstChild.data !== s) tEl.firstChild.data = s; };
        on(video, "timeupdate", () => { if (video.duration) fill.style.width = (video.currentTime / video.duration * 100) + "%"; syncTime(); });
        on(video, "loadedmetadata", syncTime);
        on(video, "progress", () => { try { if (video.buffered.length && video.duration) buf.style.width = (video.buffered.end(video.buffered.length - 1) / video.duration * 100) + "%"; } catch {} });

        const mute = mkAct(IC.mute, "Mudo (m)", e => { e.stopPropagation(); video.muted = !video.muted; if (!video.muted && !video.volume) video.volume = 1; syncVol(); });
        const volfill = el("div", { class: "gf-plc-volfill" });
        const volbar = el("div", { class: "gf-plc-volbar", role: "slider", "aria-label": "Volume" }, volfill);
        const syncVol = () => { mute.innerHTML = (video.muted || !video.volume) ? IC.mute : IC.volume; volfill.style.width = ((video.muted ? 0 : video.volume) * 100) + "%"; };
        const setVolX = (cx, r) => { if (!r.width) return; const v = Math.max(0, Math.min(1, (cx - r.left) / r.width)); video.volume = v; video.muted = (v === 0); syncVol(); };
        volbar.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); const r = volbar.getBoundingClientRect(); setVolX(e.clientX, r); const mv = ev => setVolX(ev.clientX, r); const up = () => { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); }; document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up); });
        const volgrp = el("div", { class: "gf-plc-vol" }, mute, volbar);

        const goFs = () => { try { document.fullscreenElement ? document.exitFullscreen() : wrap.requestFullscreen(); } catch {} };
        const dlb = mkAct(IC.download, "Baixar", e => { e.stopPropagation(); if (stCur && stCur._gf && stCur._gf.downloadBtn) stCur._gf.downloadBtn.click(); else if (src) window.open(src, "_blank"); });
        const shareBtn = mkAct(IC.share, "Compartilhar / Copiar link", e => {
            e.stopPropagation();
            copyText(location.href).then(ok => {
                toast(ok ? "Link copiado!" : "Falha ao copiar link");
                if (ok) { shareBtn.innerHTML = IC.check; setTimeout(() => { shareBtn.innerHTML = IC.share; }, 1600); }
            });
        });
        const reportBtn = mkAct(IC.flag, "Reportar", e => {
            e.stopPropagation();
            const a = document.querySelector('a[href*="report"], a[href*="abuse"]');
            if (a && a.href) window.open(a.href, "_blank");
            else toast("Sem página de denúncia neste site");
        });
        let pipBtn = null;
        if (document.pictureInPictureEnabled) {
            pipBtn = mkAct(IC.pip, "Picture-in-Picture", async e => {
                e.stopPropagation();
                try {
                    if (document.pictureInPictureElement) await document.exitPictureInPicture();
                    else if (video.requestPictureInPicture) await video.requestPictureInPicture();
                } catch {}
            });
        }
        const fsb = mkAct(IC.expand, "Tela cheia (f)", e => { e.stopPropagation(); goFs(); });
        const barPlay = mkAct(IC.play, "Play/Pause (espaço)", e => { e.stopPropagation(); toggle(); }); barPlay.classList.add("gf-plc-barplay");

        const prevBtn = mkAct(IC.prev, "Anterior (Shift+P)", e => { e.stopPropagation(); navStage(-1); });
        const nextBtn = mkAct(IC.next, "Próximo (Shift+N)", e => { e.stopPropagation(); navStage(1); });

        const loopBtn = mkAct(IC.repeat, prefs.loop ? "Repetir vídeo (ativado)" : "Repetir vídeo", e => {
            e.stopPropagation();
            video.loop = !video.loop;
            prefs.loop = video.loop;
            saveP();
            loopBtn.classList.toggle("is-active", !!video.loop);
            toast(video.loop ? "Repetir ativado" : "Repetir desativado");
        });
        loopBtn.classList.toggle("is-active", !!prefs.loop);
        const apBtn = el("button", {
            type: "button",
            class: "gf-plc-act gf-plc-autoplay" + (prefs.autoplay ? " is-active" : ""),
            title: prefs.autoplay ? "Reprodução automática ativada" : "Reprodução automática desativada",
            "aria-label": "Reprodução automática"
        },
            el("span", null, "Autoplay"),
            el("span", { class: "gf-plc-ap-pill" }, el("span", { class: "gf-plc-ap-knob" }))
        );
        apBtn.addEventListener("click", e => {
            e.stopPropagation();
            prefs.autoplay = !prefs.autoplay;
            saveP();
            apBtn.classList.toggle("is-active", !!prefs.autoplay);
            toast(prefs.autoplay ? "Autoplay ativado" : "Autoplay desativado");
        });
        on(video, "ended", () => {
            if (!video.loop && prefs.autoplay) setTimeout(() => navStage(1), 600);
        });
        on(video, "loadedmetadata", () => { video.loop = !!prefs.loop; });

        const mkSkip = (ic, label, cb) => { const b = el("button", { type: "button", class: "gf-plc-act gf-plc-skip", title: label, "aria-label": label }); b.innerHTML = ic; b.appendChild(el("span", { class: "gf-plc-skipn" }, "5")); b.addEventListener("click", cb); return b; };
        const skipBack = mkSkip(IC.skipBack, "Voltar 5s (←)", e => { e.stopPropagation(); seek(-5); });
        const skipFwd = mkSkip(IC.skipFwd, "Avançar 5s (→)", e => { e.stopPropagation(); seek(5); });

        const RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];
        const speedMenu = el("div", { class: "gf-plc-speedmenu" });
        const speedBtn = el("button", { type: "button", class: "gf-plc-act gf-plc-speed", title: "Velocidade", "aria-label": "Velocidade" }, "1x");
        const speedWrap = el("div", { class: "gf-plc-speedwrap" }, speedMenu, speedBtn);
        let speedCloser = null;
        const closeSpeed = () => { speedMenu.classList.remove("open"); if (speedCloser) { document.removeEventListener("pointerdown", speedCloser, true); speedCloser = null; } };
        const openSpeed = () => { speedMenu.classList.add("open"); speedCloser = ev => { if (!speedWrap.contains(ev.target)) closeSpeed(); }; document.addEventListener("pointerdown", speedCloser, true); };
        RATES.forEach(r => { const it = el("button", { type: "button", class: "gf-plc-speeditem" }, r + "x"); it.dataset.r = r; it.addEventListener("click", e => { e.stopPropagation(); try { video.playbackRate = r; } catch {} closeSpeed(); }); speedMenu.appendChild(it); });
        speedBtn.addEventListener("click", e => { e.stopPropagation(); speedMenu.classList.contains("open") ? closeSpeed() : openSpeed(); });
        const syncSpeed = () => { const r = video.playbackRate; speedBtn.textContent = r + "x"; speedMenu.querySelectorAll(".gf-plc-speeditem").forEach(it => it.classList.toggle("on", +it.dataset.r === r)); };
        on(video, "ratechange", () => { prefs.rate = video.playbackRate; saveP(); syncSpeed(); });
        on(video, "loadedmetadata", () => { try { video.playbackRate = prefs.rate || 1; } catch {} });

        const leftc = el("div", { class: "gf-plc-left" }, barPlay, loopBtn, prevBtn, nextBtn, skipBack, skipFwd, volgrp, tEl);
        const rightc = el("div", { class: "gf-plc-right" }, apBtn, speedWrap, reportBtn, dlb, shareBtn);
        if (pipBtn) rightc.appendChild(pipBtn);
        rightc.appendChild(fsb);
        const row = el("div", { class: "gf-plc-row" }, leftc, rightc);
        const bottom = el("div", { class: "gf-plc-bottom" }, prog, row);

        on(video, "play", () => { wrap.classList.add("is-playing"); playBtn.innerHTML = IC.pause; barPlay.innerHTML = IC.pause; });
        on(video, "pause", () => { wrap.classList.remove("is-playing"); playBtn.innerHTML = IC.play; barPlay.innerHTML = IC.play; });
        on(video, "volumechange", syncVol);
        on(video, "seeking", () => wrap.classList.add("is-buffering"));
        ["seeked", "canplay", "playing", "loadeddata", "pause", "suspend", "error", "abort"].forEach(ev => on(video, ev, () => wrap.classList.remove("is-buffering")));

        const setRate = dir => { const i = RATES.indexOf(video.playbackRate); const ni = Math.max(0, Math.min(RATES.length - 1, (i < 0 ? 3 : i) + dir)); try { video.playbackRate = RATES[ni]; } catch {} };
        const onKey = e => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const t = e.target;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
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
            else if (k >= "0" && k <= "9" && video.duration) video.currentTime = video.duration * (+k) / 10;
            else h = false;
            if (h) { e.preventDefault(); e.stopPropagation(); }
        };
        if (ac) document.addEventListener("keydown", onKey, { capture: true, signal: ac.signal });
        wrap.append(flash, sflash, bottom);
        try { video.playbackRate = prefs.rate || 1; } catch {}
        syncVol(); syncTime(); syncSpeed();
    }
