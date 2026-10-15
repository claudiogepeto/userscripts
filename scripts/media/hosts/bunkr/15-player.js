    /* ====================================================================
     * v2.0 — PORT do pixeldrain: PLAYER PRÓPRIO (substitui o Plyr), ZOOM+PAN na
     * foto, e LOADING no botão de mirror. Helpers + ícones + builders abaixo.
     * ==================================================================== */
    function safeGetStorage(k, fallback = null) {
        try { const v = localStorage.getItem(k); return v != null ? v : fallback; } catch { return fallback; }
    }
    function safeSetStorage(k, v) {
        try { localStorage.setItem(k, v); } catch {}
    }

    const PREFS_KEY = "bunkr_prefs";
    const prefs = Object.assign({ volume: 1, muted: false, rate: 1, loop: false, autoplay: true },
        (() => { try { return JSON.parse(safeGetStorage(PREFS_KEY)) || {}; } catch { return {}; } })());
    let saveT; const saveP = () => { clearTimeout(saveT); saveT = setTimeout(() => { safeSetStorage(PREFS_KEY, JSON.stringify(prefs)); }, 250); };

    /* Formata data de envio do Bunkr ("HH:mm:ss DD/MM/YYYY") para "DD/MM/YYYY HH:mm" (sem segundos) */
    function formatUploadDate(ts) {
        if (!ts || typeof ts !== "string") return "";
        ts = ts.trim();
        const m = ts.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s+(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/);
        if (m) {
            const hh = m[1].padStart(2, "0"), mm = m[2];
            const day = m[3].padStart(2, "0"), month = m[4].padStart(2, "0"), year = m[5];
            return `${day}/${month}/${year} ${hh}:${mm}`;
        }
        const m2 = ts.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})\s+(\d{1,2}):(\d{2})/);
        if (m2) {
            return `${m2[1].padStart(2, "0")}/${m2[2].padStart(2, "0")}/${m2[3]} ${m2[4].padStart(2, "0")}:${m2[5]}`;
        }
        return ts;
    }

    /* Retorna timestamp numérico em ms para ordenação precisa por data de envio */
    function parseUploadTimestamp(ts) {
        if (!ts || typeof ts !== "string") return 0;
        ts = ts.trim();
        const m = ts.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s+(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
        if (m) {
            const hh = parseInt(m[1], 10), mm = parseInt(m[2], 10), ss = parseInt(m[3] || "0", 10);
            const day = parseInt(m[4], 10), month = parseInt(m[5], 10), year = parseInt(m[6], 10);
            return Date.UTC(year, month - 1, day, hh, mm, ss);
        }
        const d = new Date(ts);
        return isNaN(d.getTime()) ? 0 : d.getTime();
    }

    /* Extrai com precisão datas embutidas no nome do arquivo (ex.: 2026-08-16, 2026.07.26, 2026_05_26, [20260816], etc.) */

    /* Remove o prefixo/ocorrência de data do título deixando apenas o nome limpo do arquivo */

    const PL_ICONS = {
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
        bunkrMark: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true" style="display:block"><path d="M5 4h8a5 5 0 0 1 0 10H5V4zm0 8h8.5a5 5 0 0 1 0 10H5v-10zm3-5v4h5a2 2 0 1 0 0-4H8zm0 8v4h5.5a2 2 0 1 0 0-4H8z"/></svg>',
    };

    /* controles estilo YouTube Pro com revamp visual completo */
    function buildPlayerControls(wrap, video, src, ac) {
        const on = (e, ev, fn) => e.addEventListener(ev, fn, ac ? { signal: ac.signal } : undefined);
        const mkAct = (ic, label, cb) => { const b = el("button", { type: "button", class: "bunkr-plc-act", title: label, "aria-label": label }); b.innerHTML = ic; b.addEventListener("click", cb); return b; };
        const toggle = () => { if (!video.paused) { video.pause(); return; } const p = video.play(); if (p && p.catch) p.catch(() => {}); };
        const sflash = el("div", { class: "bunkr-plc-seekflash" }); let sft;
        const seek = d => { if (!video.duration) return; video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + d)); sflash.textContent = d < 0 ? `« ${-d}s` : `${d}s »`; sflash.classList.add("on"); clearTimeout(sft); sft = setTimeout(() => sflash.classList.remove("on"), 480); };
        let clickT = null;
        on(video, "click", e => { e.preventDefault(); e.stopPropagation(); if (clickT) return; clickT = setTimeout(() => { clickT = null; toggle(); }, 230); });
        on(video, "dblclick", e => { e.preventDefault(); e.stopPropagation(); if (clickT) { clearTimeout(clickT); clickT = null; } const r = video.getBoundingClientRect(); seek((e.clientX - r.left) < r.width / 2 ? -5 : 5); });
        
        const playBtn = el("button", { type: "button", class: "bunkr-plc-play", "aria-label": "Play/Pause" }); playBtn.innerHTML = PL_ICONS.play;
        playBtn.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); toggle(); });
        const flash = el("div", { class: "bunkr-plc-flash" }, playBtn);
        
        // Timeline com tooltip de tempo flutuante
        const buf = el("div", { class: "bunkr-plc-buf" });
        const knob = el("div", { class: "bunkr-plc-knob" });
        const fill = el("div", { class: "bunkr-plc-fill" }, knob);
        const bar = el("div", { class: "bunkr-plc-bar" }, buf, fill);
        const timeTip = el("div", { class: "bunkr-plc-timetip" }, "0:00");
        const prog = el("div", { class: "bunkr-plc-prog" }, bar, timeTip);
        
        const seekTo = (cx, r) => { if (!video.duration || !r.width) return; video.currentTime = Math.max(0, Math.min(1, (cx - r.left) / r.width)) * video.duration; };
        prog.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); const r = bar.getBoundingClientRect(); seekTo(e.clientX, r); const mv = ev => seekTo(ev.clientX, r); const up = () => { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); }; document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up); });
        prog.addEventListener("pointermove", ev => {
            const r = bar.getBoundingClientRect();
            if (!r.width || !video.duration) return;
            const ratio = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
            timeTip.textContent = fmtT(ratio * video.duration);
            timeTip.style.left = (ratio * 100) + "%";
        });

        const tEl = el("span", { class: "bunkr-plc-time" }, "0:00 / 0:00");
        const syncTime = () => { const s = fmtT(video.currentTime) + (video.duration ? " / " + fmtT(video.duration) : ""); if (tEl.firstChild.data !== s) tEl.firstChild.data = s; };
        on(video, "timeupdate", () => { if (video.duration) fill.style.width = (video.currentTime / video.duration * 100) + "%"; syncTime(); });
        on(video, "loadedmetadata", syncTime);
        on(video, "progress", () => { try { if (video.buffered.length && video.duration) buf.style.width = (video.buffered.end(video.buffered.length - 1) / video.duration * 100) + "%"; } catch {} });

        // Volume com ícones dinâmicos
        const mute = mkAct(PL_ICONS.mute, "Mudo (m)", e => { e.stopPropagation(); video.muted = !video.muted; if (!video.muted && !video.volume) video.volume = 1; syncVol(); });
        const volfill = el("div", { class: "bunkr-plc-volfill" });
        const volbar = el("div", { class: "bunkr-plc-volbar", role: "slider", "aria-label": "Volume" }, volfill);
        const syncVol = () => {
            if (video.muted || !video.volume) mute.innerHTML = PL_ICONS.mute;
            else if (video.volume < 0.5) mute.innerHTML = PL_ICONS.volumeLow;
            else mute.innerHTML = PL_ICONS.volume;
            volfill.style.width = ((video.muted ? 0 : video.volume) * 100) + "%";
        };
        const setVolX = (cx, r) => { if (!r.width) return; const v = Math.max(0, Math.min(1, (cx - r.left) / r.width)); video.volume = v; video.muted = (v === 0); syncVol(); };
        volbar.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); const r = volbar.getBoundingClientRect(); setVolX(e.clientX, r); const mv = ev => setVolX(ev.clientX, r); const up = () => { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); }; document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up); });
        const volgrp = el("div", { class: "bunkr-plc-vol" }, mute, volbar);

        const goFs = () => { try { const target = document.querySelector(".bunkr-stage") || wrap; document.fullscreenElement ? document.exitFullscreen() : target.requestFullscreen(); } catch {} };

        // 1º botão da esquerda: Play/Pause
        const barPlay = mkAct(PL_ICONS.play, "Play/Pause (espaço / k)", e => { e.stopPropagation(); toggle(); });
        barPlay.classList.add("bunkr-plc-barplay");

        // 2º botão da esquerda: Loop / Repetir (ao lado direito do play/pause)
        const loopBtn = mkAct(PL_ICONS.repeat, prefs.loop ? "Repetir vídeo (ativado)" : "Repetir vídeo", e => {
            e.stopPropagation();
            video.loop = !video.loop;
            prefs.loop = video.loop;
            saveP();
            syncLoop();
            toast(video.loop ? "Repetir ativado" : "Repetir desativado");
        });
        loopBtn.classList.add("bunkr-plc-loop");
        const syncLoop = () => {
            loopBtn.classList.toggle("is-active", !!video.loop);
            loopBtn.title = video.loop ? "Repetir vídeo (ativado)" : "Repetir vídeo";
        };

        // Botões de navegação no álbum e saltos de 5s
        const prevBtn = mkAct(PL_ICONS.prev, "Anterior no álbum (Shift+P)", e => { e.stopPropagation(); navFile(-1); });
        prevBtn.classList.add("bunkr-plc-prev");

        const mkSkip = (ic, label, cb) => {
            const b = el("button", { type: "button", class: "bunkr-plc-act bunkr-plc-skip", title: label, "aria-label": label });
            b.innerHTML = ic;
            b.appendChild(el("span", { class: "bunkr-plc-skipn" }, "5"));
            b.addEventListener("click", cb);
            return b;
        };
        const skipBack = mkSkip(PL_ICONS.skipBack, "Voltar 5s (←) · 10s (j)", e => { e.stopPropagation(); seek(-5); });
        const skipFwd = mkSkip(PL_ICONS.skipFwd, "Avançar 5s (→) · 10s (l)", e => { e.stopPropagation(); seek(5); });

        const nextBtn = mkAct(PL_ICONS.next, "Próximo no álbum (Shift+N)", e => { e.stopPropagation(); navFile(1); });
        nextBtn.classList.add("bunkr-plc-next");

        // 1º da direita: Autoplay com label textual
        const apBtn = el("button", {
            type: "button",
            class: "bunkr-plc-act bunkr-plc-autoplay" + (prefs.autoplay ? " is-active" : ""),
            title: prefs.autoplay ? "Reprodução automática ativada" : "Reprodução automática desativada",
            "aria-label": "Reprodução automática"
        },
            el("span", { class: "bunkr-plc-ap-label" }, "Autoplay"),
            el("span", { class: "bunkr-plc-ap-pill" }, el("span", { class: "bunkr-plc-ap-knob" }))
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
        const RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
        const speedMenu = el("div", { class: "bunkr-plc-speedmenu" });
        const speedBtn = el("button", { type: "button", class: "bunkr-plc-act bunkr-plc-speed", title: "Velocidade", "aria-label": "Velocidade" }, "1x");
        const speedWrap = el("div", { class: "bunkr-plc-speedwrap" }, speedMenu, speedBtn);
        
        const speedHead = el("div", { class: "bunkr-plc-speedhead" },
            el("span", null, "Velocidade"),
            el("button", {
                type: "button",
                class: "bunkr-plc-speedreset",
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
        };
        const openSpeed = () => {
            speedMenu.classList.add("open");
            wrap.classList.add("is-menu-open");
            speedCloser = ev => { if (!speedWrap.contains(ev.target)) closeSpeed(); };
            document.addEventListener("pointerdown", speedCloser, true);
        };
        RATES.forEach(r => {
            const it = el("button", { type: "button", class: "bunkr-plc-speeditem" },
                el("span", null, r === 1 ? "1x (Normal)" : r + "x")
            );
            it.insertAdjacentHTML("beforeend", PL_ICONS.check);
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
            speedMenu.querySelectorAll(".bunkr-plc-speeditem").forEach(it => it.classList.toggle("on", +it.dataset.r === r));
        };
        on(video, "ratechange", () => { prefs.rate = video.playbackRate; saveP(); syncSpeed(); });
        on(video, "loadedmetadata", () => {
            try { video.playbackRate = prefs.rate || 1; } catch {}
            video.loop = !!prefs.loop;
            syncLoop();
        });

        // 3º da direita: Report
        const reportA = document.querySelector('main a[href*="abuse"], a[href*="report"]');
        const reportBtn = mkAct(PL_ICONS.flag, "Reportar abuso", e => {
            e.stopPropagation();
            if (reportA && reportA.href) window.open(reportA.href, "_blank");
            else window.open(location.origin + "/report", "_blank");
        });

        // 4º da direita: Download
        const dlA = document.querySelector('main a[href*="/file/"], a[href*="dl.bunkr"], a[href*="/d/"], a[download]');
        const dlb = mkAct(PL_ICONS.download, "Baixar vídeo", e => {
            e.stopPropagation();
            const targetUrl = (dlA && dlA.href) || src;
            const a = document.createElement("a");
            a.href = targetUrl;
            a.download = "";
            a.rel = "noopener";
            a.click();
        });

        // 5º da direita: Share / Copiar link com feedback visual
        const shareBtn = mkAct(PL_ICONS.share, "Compartilhar / Copiar link", e => {
            e.stopPropagation();
            copyText(location.href).then(ok => {
                toast(ok ? "Link copiado!" : "Falha ao copiar link");
                if (ok) {
                    shareBtn.innerHTML = PL_ICONS.check;
                    setTimeout(() => { shareBtn.innerHTML = PL_ICONS.share; }, 1600);
                }
            });
        });

        // 6º da direita: Picture-in-Picture (se suportado pelo browser)
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

        // 7º da direita: Tela cheia
        const fsb = mkAct(PL_ICONS.expand, "Tela cheia (f)", e => { e.stopPropagation(); goFs(); });

        const leftc = el("div", { class: "bunkr-plc-left" }, barPlay, loopBtn, prevBtn, nextBtn, skipBack, skipFwd, volgrp, tEl);
        const rightc = el("div", { class: "bunkr-plc-right" }, apBtn, speedWrap, reportBtn, dlb, shareBtn);
        if (pipBtn) rightc.appendChild(pipBtn);
        rightc.appendChild(fsb);

        const row = el("div", { class: "bunkr-plc-row" }, leftc, rightc);
        const bottom = el("div", { class: "bunkr-plc-bottom" }, prog, row);

        on(video, "play", () => { wrap.classList.add("is-playing"); playBtn.innerHTML = PL_ICONS.pause; barPlay.innerHTML = PL_ICONS.pause; });
        on(video, "pause", () => { wrap.classList.remove("is-playing"); playBtn.innerHTML = PL_ICONS.play; barPlay.innerHTML = PL_ICONS.play; });
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
        wrap.append(flash, sflash, bottom);
        try { video.playbackRate = prefs.rate || 1; video.loop = !!prefs.loop; } catch {}
        syncVol(); syncTime(); syncSpeed(); syncLoop(); syncAutoplay();
    }

    /* substitui o Plyr pelo nosso player (lê o mp4 assinado que o Bunkr expõe; fallback: sem src, mantém o Plyr) */
    function getSrc() { const e = document.querySelector("#video-wrapper video source[src], #player source[src], #video-wrapper video[src], #player[src], #video-wrapper source[src]"); return (e && (e.getAttribute("src") || e.src)) || ""; }
    let playerMounted = false, mediaMounted = false;
    function mountOwnPlayer() {
        if (playerMounted) return;
        const mid = document.querySelector(".bunkr-stage.is-video .bunkr-stage-mid");
        if (!mid) return;                              // stage ainda não montado
        const src = getSrc();
        if (!src) return;                              // Plyr ainda não expôs o src (async) → tenta de novo no poll
        playerMounted = true; mediaMounted = true;
        const plyrV = document.querySelector("#video-wrapper video, #player");
        if (plyrV) { try { plyrV.pause(); plyrV.muted = true; } catch {} }   // mata o áudio do Plyr (engine vivo, atrás do stage)
        const ac = new AbortController();
        const video = el("video", { class: "bunkr-video", playsinline: "", preload: "metadata" });
        video.volume = prefs.volume; video.muted = prefs.muted;
        video.addEventListener("volumechange", () => { prefs.volume = video.volume; prefs.muted = video.muted; saveP(); }, { signal: ac.signal });
        video.addEventListener("error", () => suggestMirror("erro ao reproduzir"), { once: true });
        ["loadedmetadata", "loadeddata", "canplay", "playing", "timeupdate"].forEach(ev => {
            video.addEventListener(ev, dismissMirrorWarn, { signal: ac.signal });
        });
        const host = el("div", { class: "bunkr-host bunkr-pl" }, video);
        buildPlayerControls(host, video, src, ac);
        mid.appendChild(host);
        video.addEventListener("loadedmetadata", () => {
            if (!Number.isFinite(video.duration)) return;
            const text = fmtT(video.duration);
            const key = location.pathname;
            try { sessionStorage.setItem("bunkrdur:" + location.origin + key, text); sessionStorage.setItem("bunkrdur:" + key, text); } catch {}
            const badge = document.querySelector(".bunkr-playlist-item.is-current .bunkr-playlist-dur");
            if (badge) { badge.textContent = text; badge.hidden = false; }
        }, { signal: ac.signal });
        video.src = src; try { video.load(); } catch {}
    }

    /* foto: busca robusta da imagem principal da página (suporta .rounded-lg, #image-container, picture, data-src, etc.) */
    function findPageImage() {
        const imgs = Array.from(document.querySelectorAll("img")).filter(img => {
            if (img.closest("header, .bunkr-strip, .bunkr-sidebar, .bunkr-playlist-list, #related-files-grid, .grid-images, #galleryGrid")) return false;
            if (img.classList.contains("bunkr-strip-thumb") || img.classList.contains("bunkr-playlist-thumb") || img.classList.contains("grid-images_box-img")) return false;
            const src = img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("src") || img.src || "";
            if (!src || /logo|icon|avatar|favicon/i.test(src)) return false;
            return true;
        });

        // 1. Prioridade máxima: imagem de alta resolução (storage/media, cdn, token, sem /thumbs/)
        const fullRes = imgs.find(img => {
            const src = img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("src") || img.src || "";
            return !/\/thumbs\//i.test(src) && (/storage\/media/i.test(src) || /token=/i.test(src) || /cdn/i.test(src));
        });
        if (fullRes) return fullRes;

        // 2. Segunda prioridade: qualquer imagem que NÃO contenha /thumbs/
        const nonThumb = imgs.find(img => {
            const src = img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("src") || img.src || "";
            return !/\/thumbs\//i.test(src);
        });
        if (nonThumb) return nonThumb;

        // 3. Fallback: primeira imagem encontrada
        return imgs[0] || null;
    }

    /* barra de hover da foto: os mesmos atos do vídeo, sem timeline nem controles de playback */
    function appendImageChrome(host) {
        const mkAct = (ic, label, cb) => {
            const b = el("button", { type: "button", class: "bunkr-plc-act", title: label, "aria-label": label });
            b.innerHTML = ic;
            b.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); cb(); });
            return b;
        };
        const prevBtn = mkAct(PL_ICONS.prev, "Anterior no álbum", () => navFile(-1));
        const nextBtn = mkAct(PL_ICONS.next, "Próximo no álbum", () => navFile(1));
        const reportBtn = mkAct(PL_ICONS.flag, "Reportar abuso", () => {
            const reportA = document.querySelector('main a[href*="abuse"], a[href*="report"]');
            if (reportA && reportA.href) window.open(reportA.href, "_blank", "noopener");
            else window.open(location.origin + "/report", "_blank", "noopener");
        });
        const dlb = mkAct(PL_ICONS.download, "Baixar", () => {
            const dlA = document.querySelector('main a[href*="/file/"], a[href*="dl.bunkr"], a[href*="/d/"], a[download]');
            const img = host.querySelector(".bunkr-image");
            const targetUrl = (dlA && dlA.href) || (img && (img.currentSrc || img.src)) || "";
            if (!targetUrl) return;
            const a = document.createElement("a");
            a.href = targetUrl;
            a.download = "";
            a.rel = "noopener";
            a.target = "_blank";
            a.click();
        });
        const shareBtn = mkAct(PL_ICONS.share, "Compartilhar / Copiar link", () => {
            copyText(location.href).then(ok => {
                toast(ok ? "Link copiado!" : "Falha ao copiar link");
                if (ok) {
                    shareBtn.innerHTML = PL_ICONS.check;
                    setTimeout(() => { shareBtn.innerHTML = PL_ICONS.share; }, 1600);
                }
            });
        });
        const fsb = mkAct(PL_ICONS.expand, "Tela cheia (f)", () => {
            try {
                const target = document.querySelector(".bunkr-stage") || host;
                if (document.fullscreenElement) document.exitFullscreen();
                else target.requestFullscreen();
            } catch {}
        });
        const row = el("div", { class: "bunkr-plc-row" },
            el("div", { class: "bunkr-plc-left" }, prevBtn, nextBtn),
            el("div", { class: "bunkr-plc-right" }, reportBtn, dlb, shareBtn, fsb)
        );
        host.append(el("div", { class: "bunkr-plc-bottom" }, row));
    }

    /* foto: zoom em níveis (1x→2x→4x no clique) + drag pan (só a <img> é transformada; stage-mid clipa) */
    let zoomMounted = false;
    function mountPhotoZoom() {
        if (zoomMounted) return;
        const mid = document.querySelector(".bunkr-stage.is-image .bunkr-stage-mid");
        if (!mid) return;
        const img = findPageImage();
        if (!img) return;
        const realSrc = img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("data-url") || img.getAttribute("src") || img.src || "";
        if (!realSrc) return;
        zoomMounted = true; mediaMounted = true;
        const host = el("div", { class: "bunkr-img-host" });
        mid.appendChild(host);
        const newImg = el("img", {
            class: "bunkr-image",
            src: realSrc,
            alt: "",
            style: "opacity: 1 !important; filter: none !important; position: static !important; display: block !important;"
        });
        host.appendChild(newImg);
        appendImageChrome(host);
        const ZOOMS = [1, 2, 4]; let zi = 0, z = 1, tx = 0, ty = 0;
        const clampPan = () => {
            const stageW = mid.clientWidth || window.innerWidth;
            const stageH = mid.clientHeight || (window.innerHeight - 130);
            const imgW = newImg.clientWidth * z;
            const imgH = newImg.clientHeight * z;
            const mx = Math.max(0, (imgW - stageW) / 2);
            const my = Math.max(0, (imgH - stageH) / 2);
            tx = Math.max(-mx, Math.min(mx, tx));
            ty = Math.max(-my, Math.min(my, ty));
        };
        const applyTf = () => {
            newImg.style.transform = z === 1 ? "" : `translate(${tx}px,${ty}px) scale(${z})`;
            mid.classList.toggle("is-zoomed", z !== 1);
            host.classList.toggle("is-zoomed", z !== 1);
        };
        const setZoomIdx = i => { zi = ((i % ZOOMS.length) + ZOOMS.length) % ZOOMS.length; z = ZOOMS[zi]; if (z === 1) { tx = ty = 0; } else clampPan(); applyTf(); };
        let drag = null;
        newImg.addEventListener("pointerdown", e => { if (e.button) return; e.preventDefault(); drag = { x: e.clientX, y: e.clientY, tx, ty, moved: false }; try { newImg.setPointerCapture(e.pointerId); } catch {} });
        newImg.addEventListener("pointermove", e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true; if (z !== 1 && drag.moved) { tx = drag.tx + dx; ty = drag.ty + dy; clampPan(); applyTf(); } });
        const end = e => { if (!drag) return; const click = !drag.moved; drag = null; try { newImg.releasePointerCapture(e.pointerId); } catch {} if (click) setZoomIdx(zi + 1); };
        newImg.addEventListener("pointerup", end); newImg.addEventListener("pointercancel", end);
    }

    // maxBytes: pede só o começo do arquivo (Range) e nunca devolve mais que isso,
    // mesmo quando o servidor ignora o Range e manda o arquivo inteiro.
    function httpGet(url, maxBytes) {
        const headers = maxBytes ? { Range: `bytes=0-${maxBytes - 1}` } : undefined;
        const cap = text => (maxBytes && text.length > maxBytes ? text.slice(0, maxBytes) : text);
        return new Promise((resolve, reject) => {
            if (typeof GM_xmlhttpRequest === "function") {
                try {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: url,
                        headers,
                        timeout: 15000,
                        onload: res => {
                            if (res.status >= 200 && res.status < 400) resolve(cap(res.responseText || ""));
                            else reject(new Error("HTTP " + res.status));
                        },
                        onerror: err => reject(err),
                        ontimeout: () => reject(new Error("Timeout"))
                    });
                    return;
                } catch {}
            }
            fetch(url, { credentials: "omit", headers })
                .then(async res => {
                    if (!res.ok) throw new Error("HTTP " + res.status);
                    if (!maxBytes || !res.body || !res.body.getReader) return cap(await res.text());
                    const reader = res.body.getReader();
                    const chunks = [];
                    let total = 0;
                    while (total < maxBytes) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        chunks.push(value);
                        total += value.length;
                    }
                    reader.cancel().catch(() => {});
                    const buf = new Uint8Array(Math.min(total, maxBytes));
                    let off = 0;
                    for (const c of chunks) {
                        const part = c.subarray(0, buf.length - off);
                        buf.set(part, off);
                        off += part.length;
                        if (off >= buf.length) break;
                    }
                    return new TextDecoder().decode(buf);
                })
                .then(resolve)
                .catch(reject);
        });
    }

    function findFileDownloadUrl() {
        // 1. Links diretos no DOM fora do Stage
        const anchors = Array.from(document.querySelectorAll("a[href]")).filter(a => !a.closest(".bunkr-stage, .bunkr-topbar"));
        for (const a of anchors) {
            const href = (a.getAttribute("href") || "").trim();
            const text = (a.textContent || "").trim().toLowerCase();
            if (!href || href.startsWith("#") || href.startsWith("javascript:")) continue;
            if (/storage\/media|\/d\/|get-download|media-files|\.txt(?:\?|$)/i.test(href)) {
                return href.startsWith("/") ? location.origin + href : href;
            }
            if (a.hasAttribute("download") || a.classList.contains("btn-download") || text.includes("download") || text.includes("baixar")) {
                return href.startsWith("/") ? location.origin + href : href;
            }
        }
        // 2. Busca no HTML nativo da página
        try {
            const html = document.documentElement.innerHTML;
            const m = html.match(/href="([^"]*(?:storage\/media|\/d\/|get-download|media-files|\.txt)[^"]*)"/i) ||
                      html.match(/["'](https?:\/\/[^"']*(?:storage\/media|\/d\/|get-download|media-files|\.txt)[^"]*)["']/i);
            if (m && m[1]) {
                const u = m[1];
                return u.startsWith("/") ? location.origin + u : u;
            }
        } catch {}
        return "";
    }

    function findNativeText() {
        const candidates = document.querySelectorAll("main pre, main textarea, main code, #content pre, .file-content pre");
        for (const el of candidates) {
            if (el.closest(".bunkr-stage")) continue;
            const txt = el.textContent || "";
            if (txt.trim()) return txt;
        }
        return "";
    }

    /* visualizador de arquivos .txt dentro do Stage */
    let textMounted = false;
    async function mountTextViewer() {
        if (textMounted) return;
        const mid = document.querySelector(".bunkr-stage.is-text .bunkr-stage-mid");
        if (!mid) return;
        textMounted = true; mediaMounted = true;

        const h1 = document.querySelector("main h1, h1, .file-name");
        const titleName = h1 ? cleanHtmlText(h1.innerHTML || h1.textContent || "") : "";
        const finfo = getFileInfo(titleName);

        const host = el("div", { class: "bunkr-txt-stage-host" });
        host.innerHTML = `
            <div class="bunkr-txt-stage-card">
                <div class="bunkr-txt-stage-bar">
                    <div class="bunkr-txt-stage-info">
                        <span class="bunkr-txt-tag">${(finfo.ext || "TXT").toUpperCase()}</span>
                        <span class="bunkr-txt-meta" id="bunkrTxtMeta">Carregando…</span>
                    </div>
                    <div class="bunkr-txt-stage-actions">
                        <a class="bunkr-txt-btn" id="bunkrDlTxtBtn" href="#" download target="_blank" style="display:none;">
                            ${PL_ICONS.download}
                            <span>Baixar</span>
                        </a>
                        <button type="button" class="bunkr-txt-btn" id="bunkrCopyTxtBtn" disabled>
                            ${PL_ICONS.copy}
                            <span>Copiar Texto</span>
                        </button>
                    </div>
                </div>
                <pre class="bunkr-txt-stage-content" id="bunkrTxtContent">Carregando conteúdo do arquivo…</pre>
            </div>
        `;
        mid.appendChild(host);

        const contentEl = host.querySelector("#bunkrTxtContent");
        const metaEl = host.querySelector("#bunkrTxtMeta");
        const copyBtn = host.querySelector("#bunkrCopyTxtBtn");
        const dlBtn = host.querySelector("#bunkrDlTxtBtn");

        let loadedTxt = "";
        let dlUrl = "";

        // Procura link de download no DOM com polling de até 3.5s
        for (let attempt = 0; attempt < 10; attempt++) {
            dlUrl = findFileDownloadUrl();
            if (dlUrl) break;
            await new Promise(r => setTimeout(r, 350));
        }

        if (dlUrl) {
            dlBtn.href = dlUrl;
            dlBtn.style.display = "inline-flex";
            try {
                let resText = await httpGet(dlUrl);
                if (/^\s*<!DOCTYPE|^\s*<html/i.test(resText)) {
                    const m2 = resText.match(/href="([^"]*(?:storage\/media|media-files|\.txt)[^"]*)"/i);
                    if (m2 && m2[1]) {
                        let finalUrl = m2[1];
                        if (finalUrl.startsWith("/")) finalUrl = location.origin + finalUrl;
                        dlBtn.href = finalUrl;
                        resText = await httpGet(finalUrl);
                    }
                }
                if (!/^\s*<!DOCTYPE|^\s*<html/i.test(resText)) {
                    loadedTxt = resText;
                }
            } catch (err) {
                console.warn("[Bunkr] Falha ao carregar texto via httpGet:", err);
            }
        }

        if (!loadedTxt) {
            const nativeTxt = findNativeText();
            if (nativeTxt) loadedTxt = nativeTxt;
        }

        if (loadedTxt) {
            contentEl.textContent = loadedTxt;
            const lines = loadedTxt.split("\n").length;
            metaEl.textContent = `${lines} linhas · ${loadedTxt.length} caracteres`;
            copyBtn.disabled = false;
        } else {
            contentEl.textContent = "Não foi possível carregar o conteúdo do texto diretamente no navegador. Use o botão 'Baixar' acima para abrir ou salvar o arquivo.";
            metaEl.textContent = "Texto indisponível para prévia direta";
            if (dlUrl) {
                dlBtn.style.display = "inline-flex";
            }
        }

        copyBtn.addEventListener("click", () => {
            if (loadedTxt) {
                copyText(loadedTxt).then(() => toast("Texto copiado para a área de transferência!"));
            }
        });
    }

    function setMirrorTesting(on) { document.querySelectorAll(".bunkr-mirror, .bunkr-mirror-vrow").forEach(w => w.classList.toggle("is-testing", !!on)); }   // spinner "testando" no(s) botão(ões) de mirror

