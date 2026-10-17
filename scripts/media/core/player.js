    /* ===================== CORE: PLAYER (scripts/media/core/player.js) ===================== */
    const MEDIA_ICONS = {
        play: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M7 4.5v15a1 1 0 0 0 1.52.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>',
        pause: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><rect x="6" y="4.5" width="4" height="15" rx="1.5"/><rect x="14" y="4.5" width="4" height="15" rx="1.5"/></svg>',
        prev: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M6 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1zm12.44 1.34a1 1 0 0 0-1.44-.88l-9 5.5a1 1 0 0 0 0 1.72l9 5.5A1 1 0 0 0 19 17.5v-11a1 1 0 0 0-.56-.86z"/></svg>',
        next: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M18 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1zM5.56 6.66a1 1 0 0 0-1.56.84v11a1 1 0 0 0 1.56.84l9-5.5a1 1 0 0 0 0-1.68l-9-5.5z"/></svg>',
        repeat: svgi('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'),
        playlist: svgi('<line x1="3" y1="6" x2="15" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="11" y2="18"/><polygon points="17,14 22,17 17,20" fill="currentColor" stroke="none"/>'),
        volume: svgi('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>'),
        volumeLow: svgi('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>'),
        mute: svgi('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>'),
        expand: svgi('<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>'),
        download: svgi('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
        skipBack: svgi('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>'),
        skipFwd: svgi('<path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>'),
        chevL: svgi('<path d="m15 18-6-6 6-6"/>'),
        chevR: svgi('<path d="m9 18 6-6-6-6"/>'),
        chevDown: svgi('<path d="m6 9 6 6 6-6"/>'),
        grid: svgi('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
        image: svgi('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'),
        video: svgi('<rect x="2" y="5" width="14" height="14" rx="2"/><path d="m22 8-6 4 6 4V8z"/>'),
        copy: svgi('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
        share: svgi('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>'),
        flag: svgi('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>'),
        dns: svgi('<rect x="2" y="3" width="20" height="6" rx="1"/><rect x="2" y="15" width="20" height="6" rx="1"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>'),
        check: svgi('<polyline points="20 6 9 17 4 12"/>'),
        close: svgi('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
        pip: svgi('<rect x="2" y="4" width="20" height="16" rx="2"/><rect x="12" y="10" width="8" height="8" rx="1"/>'),
        doc: svgi('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>'),
        archive: svgi('<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>'),
        audio: svgi('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
        file: svgi('<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>'),
        group: svgi('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>'),
    };

    /* controles estilo YouTube Pro (core: player do bunkr, usado por todos os hosts).
     * hooks: nav(dir) álbum anterior/próximo · download(src) + downloadTitle · report() · sideNav (setas laterais
     * sobre o vídeo) · extraRight: [elementos] antes do PiP/tela cheia · overlay: [elementos] sobre
     * o vídeo · ignoreKeys() true = atalhos desligados · quietSeek() true = seek sem spinner. Usa os globais do host:
     * prefs, saveP, toggleSidebar e MEDIA_PREFIX. */
    let mediaFullscreenExitBound = false;
    async function toggleMediaFullscreen(target, video) {
        if (!mediaFullscreenExitBound) {
            document.addEventListener("fullscreenchange", () => {
                if (!document.fullscreenElement && screen.orientation && screen.orientation.unlock) {
                    try { screen.orientation.unlock(); } catch {}
                }
            });
            mediaFullscreenExitBound = true;
        }
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
                return;
            }
            const request = target.requestFullscreen || target.webkitRequestFullscreen;
            if (!request) return;
            await request.call(target);
            if (video && screen.orientation && screen.orientation.lock) {
                try {
                    await screen.orientation.lock(video.videoHeight > video.videoWidth ? "portrait" : "landscape");
                } catch {}
            }
        } catch {}
    }

    function buildPlayerControls(wrap, video, src, ac, hooks) {
        hooks = hooks || {};
        const P = MEDIA_PREFIX;
        const navFile = dir => { if (hooks.nav) hooks.nav(dir); };
        const on = (e, ev, fn) => e.addEventListener(ev, fn, ac ? { signal: ac.signal } : undefined);
        const mkAct = (ic, label, cb) => { const b = el("button", { type: "button", class: `${P}-plc-act`, title: label, "aria-label": label }); b.innerHTML = ic; b.addEventListener("click", cb); return b; };
        // play() recusado (autoplay com som bloqueado) → tenta de novo mudo
        const toggle = () => {
            if (!video.paused && !video.ended) { video.pause(); return; }
            const p = video.play();
            if (p && p.catch) p.catch(() => { if (video.muted) return; video.muted = true; const q = video.play(); if (q && q.catch) q.catch(() => {}); });
        };
        const sflash = el("div", { class: `${P}-plc-seekflash` }); let sft;
        const seek = d => { if (!video.duration) return; video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + d)); sflash.textContent = d < 0 ? `« ${-d}s` : `${d}s »`; sflash.classList.add("on"); clearTimeout(sft); sft = setTimeout(() => sflash.classList.remove("on"), 480); };
        let clickT = null, revealOnlyTouchTap = false;
        on(video, "click", e => {
            e.preventDefault(); e.stopPropagation();
            if (e.pointerType === "touch" && revealOnlyTouchTap) { revealOnlyTouchTap = false; return; }
            if (clickT) return;
            clickT = setTimeout(() => { clickT = null; toggle(); }, 230);
        });
        on(video, "dblclick", e => { e.preventDefault(); e.stopPropagation(); if (clickT) { clearTimeout(clickT); clickT = null; } const r = video.getBoundingClientRect(); seek((e.clientX - r.left) < r.width / 2 ? -5 : 5); });
        
        const playBtn = el("button", { type: "button", class: `${P}-plc-play`, "aria-label": "Play/Pause" }); playBtn.innerHTML = MEDIA_ICONS.play;
        playBtn.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); toggle(); });
        const flash = el("div", { class: `${P}-plc-flash` }, playBtn);
        
        // Timeline com tooltip de tempo flutuante
        const buf = el("div", { class: `${P}-plc-buf` });
        const knob = el("div", { class: `${P}-plc-knob` });
        const fill = el("div", { class: `${P}-plc-fill` }, knob);
        const bar = el("div", { class: `${P}-plc-bar` }, buf, fill);
        const timeTip = el("div", { class: `${P}-plc-timetip` }, "0:00");
        const prog = el("div", { class: `${P}-plc-prog` }, bar, timeTip);
        
        const seekTo = (cx, r) => { if (!video.duration || !r.width) return; video.currentTime = Math.max(0, Math.min(1, (cx - r.left) / r.width)) * video.duration; };
        prog.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); beginControlInteraction(); const r = bar.getBoundingClientRect(); seekTo(e.clientX, r); const mv = ev => seekTo(ev.clientX, r); const up = () => { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", up); endControlInteraction(); }; document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up); document.addEventListener("pointercancel", up); });
        prog.addEventListener("pointermove", ev => {
            const r = bar.getBoundingClientRect();
            if (!r.width || !video.duration) return;
            const ratio = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
            timeTip.textContent = fmtT(ratio * video.duration);
            timeTip.style.left = (ratio * 100) + "%";
        });

        const tEl = el("span", { class: `${P}-plc-time` }, "0:00 / 0:00");
        const syncTime = () => { const s = fmtT(video.currentTime) + (video.duration ? " / " + fmtT(video.duration) : ""); if (tEl.firstChild.data !== s) tEl.firstChild.data = s; };
        on(video, "timeupdate", () => { if (video.duration) fill.style.width = (video.currentTime / video.duration * 100) + "%"; syncTime(); });
        on(video, "loadedmetadata", syncTime);
        on(video, "progress", () => { try { if (video.buffered.length && video.duration) buf.style.width = (video.buffered.end(video.buffered.length - 1) / video.duration * 100) + "%"; } catch {} });

        // Volume com ícones dinâmicos
        const mute = mkAct(MEDIA_ICONS.mute, "Mudo (m)", e => { e.stopPropagation(); video.muted = !video.muted; if (!video.muted && !video.volume) video.volume = 1; syncVol(); });
        const volfill = el("div", { class: `${P}-plc-volfill` });
        const volbar = el("div", { class: `${P}-plc-volbar`, role: "slider", "aria-label": "Volume" }, volfill);
        const syncVol = () => {
            if (video.muted || !video.volume) mute.innerHTML = MEDIA_ICONS.mute;
            else if (video.volume < 0.5) mute.innerHTML = MEDIA_ICONS.volumeLow;
            else mute.innerHTML = MEDIA_ICONS.volume;
            volfill.style.width = ((video.muted ? 0 : video.volume) * 100) + "%";
        };
        const setVolX = (cx, r) => { if (!r.width) return; const v = Math.max(0, Math.min(1, (cx - r.left) / r.width)); video.volume = v; video.muted = (v === 0); syncVol(); };
        volbar.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); beginControlInteraction(); const r = volbar.getBoundingClientRect(); setVolX(e.clientX, r); const mv = ev => setVolX(ev.clientX, r); const up = () => { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", up); endControlInteraction(); }; document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up); document.addEventListener("pointercancel", up); });
        const volgrp = el("div", { class: `${P}-plc-vol` }, mute, volbar);

        const goFs = () => { const target = document.querySelector(`.${P}-stage`) || wrap; toggleMediaFullscreen(target, video); };

        // 1º botão da esquerda: Play/Pause
        const barPlay = mkAct(MEDIA_ICONS.play, "Play/Pause (espaço / k)", e => { e.stopPropagation(); toggle(); });
        barPlay.classList.add(`${P}-plc-barplay`);

        // 2º botão da esquerda: Loop / Repetir (ao lado direito do play/pause)
        const loopBtn = mkAct(MEDIA_ICONS.repeat, prefs.loop ? "Repetir vídeo (ativado)" : "Repetir vídeo", e => {
            e.stopPropagation();
            video.loop = !video.loop;
            prefs.loop = video.loop;
            saveP();
            syncLoop();
            toast(video.loop ? "Repetir ativado" : "Repetir desativado");
        });
        loopBtn.classList.add(`${P}-plc-loop`);
        const syncLoop = () => {
            loopBtn.classList.toggle("is-active", !!video.loop);
            loopBtn.title = video.loop ? "Repetir vídeo (ativado)" : "Repetir vídeo";
        };

        // Botões de navegação no álbum e saltos de 5s
        const prevBtn = mkAct(MEDIA_ICONS.prev, "Anterior no álbum (Shift+P)", e => { e.stopPropagation(); navFile(-1); });
        prevBtn.classList.add(`${P}-plc-prev`);

        const mkSkip = (ic, label, cb) => {
            const b = el("button", { type: "button", class: `${P}-plc-act ${P}-plc-skip`, title: label, "aria-label": label });
            b.innerHTML = ic;
            b.appendChild(el("span", { class: `${P}-plc-skipn` }, "5"));
            b.addEventListener("click", cb);
            return b;
        };
        const skipBack = mkSkip(MEDIA_ICONS.skipBack, "Voltar 5s (←) · 10s (j)", e => { e.stopPropagation(); seek(-5); });
        const skipFwd = mkSkip(MEDIA_ICONS.skipFwd, "Avançar 5s (→) · 10s (l)", e => { e.stopPropagation(); seek(5); });

        const nextBtn = mkAct(MEDIA_ICONS.next, "Próximo no álbum (Shift+N)", e => { e.stopPropagation(); navFile(1); });
        nextBtn.classList.add(`${P}-plc-next`);

        // 1º da direita: Autoplay com label textual
        const apBtn = el("button", {
            type: "button",
            class: `${P}-plc-act ${P}-plc-autoplay` + (prefs.autoplay ? " is-active" : ""),
            title: prefs.autoplay ? "Reprodução automática ativada" : "Reprodução automática desativada",
            "aria-label": "Reprodução automática"
        },
            el("span", { class: `${P}-plc-ap-label` }, "Autoplay"),
            el("span", { class: `${P}-plc-ap-pill` }, el("span", { class: `${P}-plc-ap-knob` }))
        );
        const syncAutoplay = () => {
            apBtn.classList.toggle("is-active", !!prefs.autoplay);
            apBtn.title = prefs.autoplay ? "Reprodução automática ativada" : "Reprodução automática desativada";
        };
        apBtn.addEventListener("click", e => {
            e.stopPropagation();
            prefs.autoplay = !prefs.autoplay;
            saveP();
            syncAutoplay();
            toast(prefs.autoplay ? "Autoplay ativado" : "Autoplay desativado");
        });

        // Autoplay ao término do vídeo
        on(video, "ended", () => {
            if (!video.loop && prefs.autoplay) {
                toast("Próximo vídeo...");
                setTimeout(() => navFile(1), 600);
            }
        });

        // 2º da direita: Seletor de velocidade moderno (pill + popup blur)
        const RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];
        const speedMenu = el("div", { class: `${P}-plc-speedmenu` });
        const speedBtn = el("button", { type: "button", class: `${P}-plc-act ${P}-plc-speed`, title: "Velocidade", "aria-label": "Velocidade" }, "1x");
        const speedWrap = el("div", { class: `${P}-plc-speedwrap` }, speedMenu, speedBtn);
        
        const speedHead = el("div", { class: `${P}-plc-speedhead` },
            el("span", null, "Velocidade"),
            el("button", {
                type: "button",
                class: `${P}-plc-speedreset`,
                title: "Restaurar 1x",
                onClick: ev => { ev.stopPropagation(); try { video.playbackRate = 1; } catch {} closeSpeed(); }
            }, "1x")
        );
        speedMenu.appendChild(speedHead);

        let speedCloser = null;
        const closeSpeed = () => {
            speedMenu.classList.remove("open");
            wrap.classList.remove("is-menu-open");
            if (speedCloser) { document.removeEventListener("pointerdown", speedCloser, true); speedCloser = null; }
            scheduleControlsHide();
        };
        const openSpeed = () => {
            speedMenu.classList.add("open");
            wrap.classList.add("is-menu-open");
            speedCloser = ev => { if (!speedWrap.contains(ev.target)) closeSpeed(); };
            document.addEventListener("pointerdown", speedCloser, true);
        };
        RATES.forEach(r => {
            const it = el("button", { type: "button", class: `${P}-plc-speeditem` },
                el("span", null, r === 1 ? "1x (Normal)" : r + "x")
            );
            it.insertAdjacentHTML("beforeend", MEDIA_ICONS.check);
            it.dataset.r = r;
            it.addEventListener("click", e => {
                e.stopPropagation();
                try { video.playbackRate = r; } catch {}
                closeSpeed();
            });
            speedMenu.appendChild(it);
        });
        speedBtn.addEventListener("click", e => { e.stopPropagation(); speedMenu.classList.contains("open") ? closeSpeed() : openSpeed(); });
        const syncSpeed = () => {
            const r = video.playbackRate;
            speedBtn.textContent = r + "x";
            speedMenu.querySelectorAll(`.${P}-plc-speeditem`).forEach(it => it.classList.toggle("on", +it.dataset.r === r));
        };
        on(video, "ratechange", () => { prefs.rate = video.playbackRate; saveP(); syncSpeed(); });
        on(video, "loadedmetadata", () => {
            try { video.playbackRate = prefs.rate || 1; } catch {}
            video.loop = !!prefs.loop;
            syncLoop();
        });

        // 3º da direita: Report (hook do host; padrão: link de denúncia da página)
        const reportBtn = mkAct(MEDIA_ICONS.flag, "Reportar abuso", e => {
            e.stopPropagation();
            if (hooks.report) { hooks.report(); return; }
            const a = document.querySelector('a[href*="report"], a[href*="abuse"]');
            if (a && a.href) window.open(a.href, "_blank");
            else toast("Sem página de denúncia neste site");
        });

        // 4º da direita: Download (hook do host; padrão: baixa o próprio src)
        const dlb = mkAct(MEDIA_ICONS.download, hooks.downloadTitle || "Baixar vídeo", e => {
            e.stopPropagation();
            if (hooks.download) { hooks.download(src); return; }
            const a = document.createElement("a");
            a.href = src;
            a.download = "";
            a.rel = "noopener";
            a.click();
        });

        // 5º da direita: Share / Copiar link com feedback visual
        const shareBtn = mkAct(MEDIA_ICONS.share, "Compartilhar / Copiar link", e => {
            e.stopPropagation();
            copyText(location.href).then(ok => {
                toast(ok ? "Link copiado!" : "Falha ao copiar link");
                if (ok) {
                    shareBtn.innerHTML = MEDIA_ICONS.check;
                    setTimeout(() => { shareBtn.innerHTML = MEDIA_ICONS.share; }, 1600);
                }
            });
        });

        // 6º da direita: Picture-in-Picture (se suportado pelo browser)
        let pipBtn = null;
        if (document.pictureInPictureEnabled) {
            pipBtn = mkAct(MEDIA_ICONS.pip, "Picture-in-Picture", async e => {
                e.stopPropagation();
                try {
                    if (document.pictureInPictureElement) await document.exitPictureInPicture();
                    else if (video.requestPictureInPicture) await video.requestPictureInPicture();
                } catch {}
            });
        }

        // 7º da direita: Tela cheia
        const fsb = mkAct(MEDIA_ICONS.expand, "Tela cheia (f)", e => { e.stopPropagation(); goFs(); });

        const leftc = el("div", { class: `${P}-plc-left` }, barPlay, loopBtn, prevBtn, nextBtn, skipBack, skipFwd, volgrp, tEl);
        const rightc = el("div", { class: `${P}-plc-right` }, apBtn, speedWrap, reportBtn, dlb, shareBtn);
        (hooks.extraRight || []).forEach(x => rightc.appendChild(x));
        if (pipBtn) rightc.appendChild(pipBtn);
        rightc.appendChild(fsb);

        const row = el("div", { class: `${P}-plc-row` }, leftc, rightc);
        const bottom = el("div", { class: `${P}-plc-bottom` }, prog, row);

        let controlsTimer = null;
        const scheduleControlsHide = () => {
            clearTimeout(controlsTimer);
            if (video.paused || wrap.classList.contains("is-menu-open") || wrap.classList.contains("is-interacting") || bottom.matches(":focus-within")) return;
            controlsTimer = setTimeout(() => {
                if (video.paused || wrap.classList.contains("is-menu-open") || wrap.classList.contains("is-interacting") || bottom.matches(":focus-within")) return;
                wrap.classList.add("is-controls-hidden");
            }, 3000);
        };
        const showControls = () => { clearTimeout(controlsTimer); wrap.classList.remove("is-controls-hidden"); scheduleControlsHide(); };
        const beginControlInteraction = () => { wrap.classList.add("is-interacting"); showControls(); };
        const endControlInteraction = () => { wrap.classList.remove("is-interacting"); scheduleControlsHide(); };
        wrap.addEventListener("pointerdown", e => {
            revealOnlyTouchTap = e.pointerType === "touch" && e.target === video && (revealOnlyTouchTap || wrap.classList.contains("is-controls-hidden"));
            showControls();
        });
        wrap.addEventListener("pointermove", showControls);
        wrap.addEventListener("touchstart", e => {
            if (e.target === video && wrap.classList.contains("is-controls-hidden")) revealOnlyTouchTap = true;
            showControls();
        }, { passive: true });
        wrap.addEventListener("keydown", showControls);
        bottom.addEventListener("focusin", showControls);
        bottom.addEventListener("focusout", e => { if (!bottom.contains(e.relatedTarget)) scheduleControlsHide(); });

        on(video, "play", () => { wrap.classList.add("is-playing"); playBtn.innerHTML = MEDIA_ICONS.pause; barPlay.innerHTML = MEDIA_ICONS.pause; showControls(); });
        on(video, "pause", () => { wrap.classList.remove("is-playing", "is-controls-hidden"); clearTimeout(controlsTimer); playBtn.innerHTML = MEDIA_ICONS.play; barPlay.innerHTML = MEDIA_ICONS.play; });
        on(video, "volumechange", syncVol);
        on(video, "seeking", () => { if (hooks.quietSeek && hooks.quietSeek()) return; wrap.classList.add("is-buffering"); });
        ["seeked", "canplay", "playing", "loadeddata", "pause", "suspend", "error", "abort"].forEach(ev => on(video, ev, () => wrap.classList.remove("is-buffering")));
        const setRate = dir => { const i = RATES.indexOf(video.playbackRate); const ni = Math.max(0, Math.min(RATES.length - 1, (i < 0 ? 3 : i) + dir)); try { video.playbackRate = RATES[ni]; } catch {} };
        const onKey = e => {
            if (wrap.contains(e.target)) showControls();
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const t = e.target;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable || (t.closest && t.closest(`.${P}-sidebar-search, .${P}-search`)))) return;
            if (hooks.ignoreKeys && hooks.ignoreKeys()) return;
            const k = e.key; let h = true;
            if (k === " " || k === "k") toggle();
            else if (k === "ArrowLeft") seek(-5);
            else if (k === "ArrowRight") seek(5);
            else if (k === "j") seek(-10);
            else if (k === "l") seek(10);
            else if (e.shiftKey && (k === "N" || k === "n")) navFile(1);
            else if (e.shiftKey && (k === "P" || k === "p")) navFile(-1);
            else if (k === "p" || k === "P") toggleSidebar();
            else if (k === "r" || k === "R") { video.loop = !video.loop; prefs.loop = video.loop; saveP(); syncLoop(); toast(video.loop ? "Repetir ativado" : "Repetir desativado"); }
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
        // Setas laterais sobre o vídeo (hooks.sideNav) e extras que o host sobrepõe ao player (hooks.overlay)
        const side = [];
        if (hooks.sideNav) {
            const prevA = el("button", { type: "button", class: `${P}-plc-side ${P}-plc-sprev`, title: "Mídia anterior", "aria-label": "Mídia anterior" });
            prevA.innerHTML = MEDIA_ICONS.chevL; prevA.addEventListener("click", e => { e.stopPropagation(); navFile(-1); });
            const nextA = el("button", { type: "button", class: `${P}-plc-side ${P}-plc-snext`, title: "Próxima mídia", "aria-label": "Próxima mídia" });
            nextA.innerHTML = MEDIA_ICONS.chevR; nextA.addEventListener("click", e => { e.stopPropagation(); navFile(1); });
            side.push(prevA, nextA);
        }
        wrap.append(flash, sflash, bottom, ...side, ...(hooks.overlay || []));
        try { video.playbackRate = prefs.rate || 1; video.loop = !!prefs.loop; } catch {}
        syncVol(); syncTime(); syncSpeed(); syncLoop(); syncAutoplay();
    }
