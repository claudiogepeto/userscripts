    /* ===================== HELPERS ===================== */
    const PREFS_KEY = "gofile_prefs";
    const prefs = Object.assign({ volume: 1, muted: false, rate: 1, loop: false, autoplay: true }, (() => { try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; } })());
    let saveT; const saveP = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {} }, 250); };


    // Cliques sintéticos que o próprio script dispara no botão nativo: o listener de captura
    // do card (e o do preview) deixam passar, senão openStage -> fireNativeClick -> listener
    // -> openStage recursa até estourar a pilha e o botão nativo nunca recebe o clique.
    let firingNativeClick = 0;
    function fireNativeClick(target) {
        if (!target) return;
        firingNativeClick++;
        try {
            const rect = target.getBoundingClientRect();
            const clientX = rect.left + (rect.width ? rect.width / 2 : 10);
            const clientY = rect.top + (rect.height ? rect.height / 2 : 10);
            const opts = { bubbles: true, cancelable: true, composed: true, view: window, clientX, clientY };
            target.dispatchEvent(new PointerEvent("pointerdown", opts));
            target.dispatchEvent(new MouseEvent("mousedown", opts));
            target.dispatchEvent(new PointerEvent("pointerup", opts));
            target.dispatchEvent(new MouseEvent("mouseup", opts));
            target.dispatchEvent(new MouseEvent("click", opts));
        } catch (e) {
            try { target.click(); } catch (err) {}
        } finally {
            firingNativeClick--;
        }
    }

    const IC = {
        download: svgi('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
        copy: svgi('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
        expand: svgi('<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>'),
        close: svgi('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
        grid: svgi('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
        video: svgi('<rect x="2" y="5" width="14" height="14" rx="2"/><path d="m22 8-6 4 6 4V8z"/>'),
        image: svgi('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'),
        file: svgi('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'),
        doc: svgi('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>'),
        archive: svgi('<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>'),
        audio: svgi('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
        check: svgi('<polyline points="20 6 9 17 4 12"/>'),
        prev: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M6 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1zm12.44 1.34a1 1 0 0 0-1.44-.88l-9 5.5a1 1 0 0 0 0 1.72l9 5.5A1 1 0 0 0 19 17.5v-11a1 1 0 0 0-.56-.86z"/></svg>',
        next: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M18 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1zM5.56 6.66a1 1 0 0 0-1.56.84v11a1 1 0 0 0 1.56.84l9-5.5a1 1 0 0 0 0-1.68l-9-5.5z"/></svg>',
        share: svgi('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>'),
        flag: svgi('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>'),
        pip: svgi('<rect x="2" y="4" width="20" height="16" rx="2"/><rect x="12" y="10" width="8" height="8" rx="1"/>'),
        chevL: svgi('<path d="m15 18-6-6 6-6"/>'),
        chevR: svgi('<path d="m9 18 6-6-6-6"/>'),
        chevDown: svgi('<path d="m6 9 6 6 6-6"/>'),
        playlist: svgi('<line x1="3" y1="6" x2="15" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="11" y2="18"/><polygon points="17,14 22,17 17,20" fill="currentColor" stroke="none"/>'),
        group: svgi('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>'),
        play: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M7 4.5v15a1 1 0 0 0 1.52.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>',
        pause: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>',
        volume: svgi('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>'),
        mute: svgi('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>'),
        skipBack: svgi('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>'),
        skipFwd: svgi('<path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>'),
        repeat: svgi('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'),
        logoMark: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true" style="display:block"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>',
    };
    const gfDurKnown = new Map();
    const gfDurPending = new Set();
    const gfDurQueue = [];
    let gfDurBusy = 0;
    function gfCachedDur(key) {
        if (!key) return "";
        if (gfDurKnown.has(key)) return gfDurKnown.get(key);
        try { const v = sessionStorage.getItem("gfdur:" + key); if (v) { gfDurKnown.set(key, v); return v; } } catch {}
        return "";
    }
    function gfRememberDur(key, text) {
        if (!key || !text) return;
        gfDurKnown.set(key, text);
        try { sessionStorage.setItem("gfdur:" + key, text); } catch {}
        document.querySelectorAll('.gf-playlist-dur[data-dur-key="' + CSS.escape(key) + '"]').forEach(node => { node.textContent = text; node.hidden = false; });
    }
    function gfPumpDur() {
        while (gfDurBusy < 2 && gfDurQueue.length) {
            const job = gfDurQueue.shift();
            gfDurBusy++;
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
                gfDurBusy--;
                if (text) gfRememberDur(job.key, text);
                gfPumpDur();
            };
            v.addEventListener("loadedmetadata", () => finish(Number.isFinite(v.duration) ? fmtT(v.duration) : ""), { once: true });
            v.addEventListener("error", () => finish(""), { once: true });
            setTimeout(() => finish(""), 12000);
            v.src = job.url;
        }
    }
    // Sonda a duração só quando o item fica visível (watchEl = elemento observado).
    let gfProbeDurIO = null;
    function gfProbeDurNow(key, url) {
        if (!key || !url || gfCachedDur(key) || gfDurPending.has(key)) return;
        gfDurPending.add(key);
        gfDurQueue.push({ key, url });
        gfPumpDur();
    }
    function gfProbeDur(key, url, watchEl) {
        if (!key || !url || gfCachedDur(key) || gfDurPending.has(key)) return;
        if (!watchEl || !("IntersectionObserver" in window)) { gfProbeDurNow(key, url); return; }
        if (!gfProbeDurIO) {
            gfProbeDurIO = new IntersectionObserver(entries => {
                for (const e of entries) {
                    if (!e.isIntersecting) continue;
                    gfProbeDurIO.unobserve(e.target);
                    gfProbeDurNow(e.target._durKey, e.target._durUrl);
                }
            }, { rootMargin: "200px" });
        }
        watchEl._durKey = key;
        watchEl._durUrl = url;
        gfProbeDurIO.observe(watchEl);
    }

    function vbtn(icon, label, opts) {
        const b = el("button", Object.assign({ class: "gf-item", type: "button" }, opts || {}));
        b.insertAdjacentHTML("beforeend", icon);
        if (label) b.append(el("span", null, label));
        return b;
    }
