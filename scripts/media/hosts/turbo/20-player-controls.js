    /* ===================== CONTROLES DO PLAYER (Estilo YouTube) ===================== */
    function buildPlayerControls(wrap, video, src, id, ac) {
        const on = (e, ev, fn) => e.addEventListener(ev, fn, ac ? { signal: ac.signal } : undefined);
        const mkAct = (ic, label, cb) => {
            const b = el("button", { type: "button", class: "tb-plc-act", title: label, "aria-label": label });
            b.innerHTML = ic;
            b.addEventListener("click", cb);
            return b;
        };

        const toggle = () => {
            if (video.paused || video.ended) {
                const p = video.play();
                if (p && p.catch) {
                    p.catch(err => {
                        console.warn("[turbo] play rejected, tentando mudo:", err);
                        video.muted = true;
                        video.play().catch(e => console.error("[turbo] play com mudo falhou:", e));
                    });
                }
            } else {
                video.pause();
            }
        };

        const sflash = el("div", { class: "tb-plc-seekflash" });
        let sft;
        const seek = d => {
            if (!video.duration) return;
            video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + d));
            sflash.textContent = d < 0 ? "« 5s" : "5s »";
            sflash.classList.add("on");
            clearTimeout(sft);
            sft = setTimeout(() => sflash.classList.remove("on"), 480);
        };

        let clickT = null;
        on(video, "click", e => {
            e.preventDefault(); e.stopPropagation();
            if (clickT) return;
            clickT = setTimeout(() => { clickT = null; toggle(); }, 230);
        });
        on(video, "dblclick", e => {
            e.preventDefault(); e.stopPropagation();
            if (clickT) { clearTimeout(clickT); clickT = null; }
            const r = video.getBoundingClientRect();
            seek((e.clientX - r.left) < r.width / 2 ? -5 : 5);
        });

        const playBtn = el("button", { type: "button", class: "tb-plc-play", "aria-label": "Play/Pause" });
        playBtn.innerHTML = IC.play;
        playBtn.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); toggle(); });

        const flash = el("div", { class: "tb-plc-flash" }, playBtn);
        flash.addEventListener("click", e => {
            if (e.target !== flash && !flash.contains(e.target)) return;
            e.preventDefault(); e.stopPropagation();
            toggle();
        });

        const buf = el("div", { class: "tb-plc-buf" });
        const knob = el("div", { class: "tb-plc-knob" });
        const fill = el("div", { class: "tb-plc-fill" }, knob);
        const bar = el("div", { class: "tb-plc-bar" }, buf, fill);
        const prog = el("div", { class: "tb-plc-prog" }, bar);

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

        const tEl = el("span", { class: "tb-plc-time" }, "00:00 / 00:00");
        const syncTime = () => {
            const s = fmtT(video.currentTime) + (video.duration ? " / " + fmtT(video.duration) : " / 00:00");
            if (tEl.firstChild && tEl.firstChild.data !== s) tEl.firstChild.data = s;
            else if (!tEl.firstChild) tEl.textContent = s;
        };
        on(video, "timeupdate", () => {
            if (video.duration) fill.style.width = (video.currentTime / video.duration * 100) + "%";
            syncTime();
        });
        on(video, "loadedmetadata", syncTime);
        on(video, "progress", () => {
            try {
                if (video.buffered.length && video.duration) {
                    buf.style.width = (video.buffered.end(video.buffered.length - 1) / video.duration * 100) + "%";
                }
            } catch {}
        });

        const mute = mkAct(IC.mute, "Mudo (m)", e => {
            e.stopPropagation();
            video.muted = !video.muted;
            if (!video.muted && !video.volume) video.volume = 1;
            syncVol();
        });
        const volfill = el("div", { class: "tb-plc-volfill" });
        const volbar = el("div", { class: "tb-plc-volbar", role: "slider", "aria-label": "Volume" }, volfill);
        const syncVol = () => {
            mute.innerHTML = (video.muted || !video.volume) ? IC.mute : IC.volume;
            volfill.style.width = ((video.muted ? 0 : video.volume) * 100) + "%";
        };
        const setVolX = (cx, r) => {
            if (!r.width) return;
            const v = Math.max(0, Math.min(1, (cx - r.left) / r.width));
            video.volume = v; video.muted = (v === 0);
            syncVol();
        };
        volbar.addEventListener("pointerdown", e => {
            e.preventDefault(); e.stopPropagation();
            const r = volbar.getBoundingClientRect(); setVolX(e.clientX, r);
            const mv = ev => setVolX(ev.clientX, r);
            const up = () => { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); };
            document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
        });
        const volgrp = el("div", { class: "tb-plc-vol" }, mute, volbar);

        const goFs = () => {
            try {
                document.fullscreenElement ? document.exitFullscreen() : wrap.requestFullscreen();
            } catch {}
        };
        const dlb = mkAct(IC.download, "Baixar", e => {
            e.stopPropagation();
            const dlBtn = document.getElementById("btnDownload") || document.querySelector('a[href*="/d/"]');
            if (dlBtn && dlBtn.href) window.open(dlBtn.href, "_blank");
            else if (id) window.open("/d/" + id, "_blank");
            else if (src) window.open(src, "_blank");
        });
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
        const barPlay = mkAct(IC.play, "Play/Pause (espaço)", e => { e.stopPropagation(); toggle(); });
        barPlay.classList.add("tb-plc-barplay");

        const apBtn = el("button", {
            type: "button",
            class: "tb-plc-act tb-plc-autoplay" + (prefs.autoplay ? " is-active" : ""),
            title: prefs.autoplay ? "Reprodução automática ativada" : "Reprodução automática desativada",
            "aria-label": "Reprodução automática"
        },
            el("span", { class: "tb-plc-ap-label" }, "Autoplay"),
            el("span", { class: "tb-plc-ap-pill" }, el("span", { class: "tb-plc-ap-knob" }))
        );
        apBtn.addEventListener("click", e => {
            e.stopPropagation();
            prefs.autoplay = !prefs.autoplay;
            saveP();
            apBtn.classList.toggle("is-active", !!prefs.autoplay);
            toast(prefs.autoplay ? "Autoplay ativado" : "Autoplay desativado");
        });

        // Loop toggle
        const loopBtn = mkAct(IC.repeat, "Repetir (r)", e => {
            e.stopPropagation();
            prefs.loop = !prefs.loop;
            saveP();
            video.loop = prefs.loop;
            loopBtn.classList.toggle("is-active", !!prefs.loop);
            toast(prefs.loop ? "Repetição ativada" : "Repetição desativada");
        });
        video.loop = !!prefs.loop;
        loopBtn.classList.toggle("is-active", !!prefs.loop);

        // Próximo vídeo ao terminar
        on(video, "ended", () => {
            if (!video.loop && prefs.autoplay) {
                navFile(1);
            }
        });

        // Anterior e Próximo lado a lado
        const navPrevBtn = mkAct(IC.prev, "Anterior (Shift+P)", e => { e.stopPropagation(); navFile(-1); });
        const navNextBtn = mkAct(IC.next, "Próximo (Shift+N)", e => { e.stopPropagation(); navFile(1); });

        const mkSkip = (ic, label, cb) => {
            const b = el("button", { type: "button", class: "tb-plc-act tb-plc-skip", title: label, "aria-label": label });
            b.innerHTML = ic;
            b.appendChild(el("span", { class: "tb-plc-skipn" }, "5"));
            b.addEventListener("click", cb);
            return b;
        };
        const skipBack = mkSkip(IC.skipBack, "Voltar 5s (←)", e => { e.stopPropagation(); seek(-5); });
        const skipFwd = mkSkip(IC.skipFwd, "Avançar 5s (→)", e => { e.stopPropagation(); seek(5); });

        // Velocidade plana (sem pill pesado)
        const RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];
        const speedMenu = el("div", { class: "tb-plc-speedmenu" });
        const speedBtn = el("button", { type: "button", class: "tb-plc-act tb-plc-speed", title: "Velocidade", "aria-label": "Velocidade" }, "1x");
        const speedWrap = el("div", { class: "tb-plc-speedwrap" }, speedMenu, speedBtn);
        let speedCloser = null;
        const closeSpeed = () => {
            speedMenu.classList.remove("open");
            if (speedCloser) { document.removeEventListener("pointerdown", speedCloser, true); speedCloser = null; }
        };
        const openSpeed = () => {
            speedMenu.classList.add("open");
            speedCloser = ev => { if (!speedWrap.contains(ev.target)) closeSpeed(); };
            document.addEventListener("pointerdown", speedCloser, true);
        };
        RATES.forEach(r => {
            const it = el("button", { type: "button", class: "tb-plc-speeditem" }, r + "x");
            it.dataset.r = r;
            it.addEventListener("click", e => {
                e.stopPropagation();
                try { video.playbackRate = r; } catch {}
                closeSpeed();
            });
            speedMenu.appendChild(it);
        });
        speedBtn.addEventListener("click", e => {
            e.stopPropagation();
            speedMenu.classList.contains("open") ? closeSpeed() : openSpeed();
        });
        const syncSpeed = () => {
            const r = video.playbackRate;
            speedBtn.textContent = r + "x";
            speedMenu.querySelectorAll(".tb-plc-speeditem").forEach(it => it.classList.toggle("on", +it.dataset.r === r));
        };
        on(video, "ratechange", () => { prefs.rate = video.playbackRate; saveP(); syncSpeed(); });
        on(video, "loadedmetadata", () => { try { video.playbackRate = prefs.rate || 1; } catch {} });

        const leftc = el("div", { class: "tb-plc-left" }, barPlay, loopBtn, navPrevBtn, navNextBtn, skipBack, skipFwd, volgrp, tEl);
        const rightc = el("div", { class: "tb-plc-right" }, apBtn, speedWrap, reportBtn, dlb, shareBtn);
        if (pipBtn) rightc.appendChild(pipBtn);
        rightc.appendChild(fsb);
        const row = el("div", { class: "tb-plc-row" }, leftc, rightc);
        const bottom = el("div", { class: "tb-plc-bottom" }, prog, row);

        on(video, "play", () => { wrap.classList.add("is-playing"); playBtn.innerHTML = IC.pause; barPlay.innerHTML = IC.pause; });
        on(video, "pause", () => { wrap.classList.remove("is-playing"); playBtn.innerHTML = IC.play; barPlay.innerHTML = IC.play; });
        on(video, "volumechange", syncVol);
        on(video, "seeking", () => wrap.classList.add("is-buffering"));
        ["seeked", "canplay", "playing", "loadeddata", "pause", "suspend", "error", "abort"].forEach(ev => on(video, ev, () => wrap.classList.remove("is-buffering")));

        const setRate = dir => {
            const i = RATES.indexOf(video.playbackRate);
            const ni = Math.max(0, Math.min(RATES.length - 1, (i < 0 ? 3 : i) + dir));
            try { video.playbackRate = RATES[ni]; } catch {}
        };

        const onKey = e => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const t = e.target;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable || (t.closest && t.closest(".tb-sidebar-search")))) return;
            const k = e.key;
            let h = true;
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
            else if (e.shiftKey && (k === "N" || k === "n")) navFile(1);
            else if (e.shiftKey && (k === "P" || k === "p")) navFile(-1);
            else if (k === "p" || k === "P") toggleSidebar();
            else if (k >= "0" && k <= "9" && video.duration) video.currentTime = video.duration * (+k) / 10;
            else h = false;

            if (h) { e.preventDefault(); e.stopPropagation(); }
        };
        if (ac) document.addEventListener("keydown", onKey, { capture: true, signal: ac.signal });

        wrap.append(flash, sflash, bottom);
        try { video.playbackRate = prefs.rate || 1; } catch {}
        syncVol();
        syncTime();
        syncSpeed();
    }
