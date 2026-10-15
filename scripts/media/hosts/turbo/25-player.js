    /* ===================== PLAYER PRÓPRIO ===================== */
    function expOf(u) { try { return parseInt(new URL(u, location.origin).searchParams.get("exp"), 10) || 0; } catch (e) { return 0; } }
    async function signUrl(id) {
        const r = await fetch("/api/sign?v=" + encodeURIComponent(id), { credentials: "include" });
        const d = await r.json();
        if (!d || !d.success || !d.url) throw new Error("sign falhou");
        return d.url;
    }
    function scheduleRefresh(video, id) {
        const exp = expOf(video.src); if (!exp) return;
        const ms = Math.max((exp - Math.floor(Date.now() / 1000) - 60) * 1000, 10000);
        clearTimeout(video._refT);
        video._refT = setTimeout(() => {
            signUrl(id).then(u => {
                const t = video.currentTime || 0, playing = !video.paused;
                video.src = u; try { video.load(); } catch (e) {}
                if (t) { video.currentTime = t; if (playing) video.play().catch(() => {}); }
                scheduleRefresh(video, id);
            }).catch(() => { video._refT = setTimeout(() => scheduleRefresh(video, id), 30000); });
        }, ms);
    }
    const IMAGE_NAME = /\.(jpe?g|png|gif|webp|avif|bmp)(?:$|\?)/i;
    function appendImageChrome(host, id, src) {
        const mkAct = (ic, label, cb) => {
            const b = el("button", { type: "button", class: "tb-plc-act", title: label, "aria-label": label });
            b.innerHTML = ic;
            b.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); cb(); });
            return b;
        };
        const prevBtn = mkAct(IC.prev, "Anterior", () => navFile(-1));
        const nextBtn = mkAct(IC.next, "Próximo", () => navFile(1));
        const reportBtn = mkAct(IC.flag, "Reportar", () => {
            const a = document.querySelector('a[href*="report"], a[href*="abuse"]');
            if (a && a.href) window.open(a.href, "_blank", "noopener");
            else toast("Sem página de denúncia neste site");
        });
        const dlb = mkAct(IC.download, "Baixar", () => {
            const dlBtn = document.getElementById("btnDownload") || document.querySelector('a[href*="/d/"]');
            if (dlBtn && dlBtn.href) window.open(dlBtn.href, "_blank", "noopener");
            else if (id) window.open("/d/" + id, "_blank", "noopener");
            else if (src) window.open(src, "_blank", "noopener");
        });
        const shareBtn = mkAct(IC.share, "Compartilhar / Copiar link", () => {
            copyText(location.href).then(ok => {
                toast(ok ? "Link copiado!" : "Falha ao copiar link");
                if (ok) { shareBtn.innerHTML = IC.check; setTimeout(() => { shareBtn.innerHTML = IC.share; }, 1600); }
            });
        });
        const fsb = mkAct(IC.expand, "Tela cheia (f)", () => {
            try {
                if (document.fullscreenElement) document.exitFullscreen();
                else host.requestFullscreen();
            } catch { /* fullscreen blocked */ }
        });
        const row = el("div", { class: "tb-plc-row" },
            el("div", { class: "tb-plc-left" }, prevBtn, nextBtn),
            el("div", { class: "tb-plc-right" }, reportBtn, dlb, shareBtn, fsb)
        );
        host.append(el("div", { class: "tb-plc-bottom" }, row));
    }
    function mountPhotoFromSrc(mid, src, id) {
        if (mid.querySelector(".tb-img-host")) return;
        mediaMounted = true;
        const host = el("div", { class: "tb-img-host" });
        const img = el("img", { class: "tb-image", src: src || "", alt: "", draggable: "false" });
        host.append(img);
        appendImageChrome(host, id, src);
        const ZOOMS = [1, 2, 4];
        let zi = 0, z = 1, tx = 0, ty = 0;
        const clampPan = () => {
            const stageW = host.clientWidth || mid.clientWidth || window.innerWidth;
            const stageH = host.clientHeight || mid.clientHeight || window.innerHeight;
            const imgW = img.clientWidth * z;
            const imgH = img.clientHeight * z;
            const mx = Math.max(0, (imgW - stageW) / 2);
            const my = Math.max(0, (imgH - stageH) / 2);
            tx = Math.max(-mx, Math.min(mx, tx));
            ty = Math.max(-my, Math.min(my, ty));
        };
        const applyTf = () => {
            img.style.transform = z === 1 ? "" : `translate(${tx}px,${ty}px) scale(${z})`;
            host.classList.toggle("is-zoomed", z !== 1);
        };
        const setZoomIdx = i => {
            zi = ((i % ZOOMS.length) + ZOOMS.length) % ZOOMS.length;
            z = ZOOMS[zi];
            if (z === 1) { tx = 0; ty = 0; }
            else clampPan();
            applyTf();
        };
        let drag = null;
        img.addEventListener("pointerdown", e => {
            if (e.button) return;
            e.preventDefault();
            drag = { x: e.clientX, y: e.clientY, tx, ty, moved: false };
            try { img.setPointerCapture(e.pointerId); } catch { /* pointer already released */ }
        });
        img.addEventListener("pointermove", e => {
            if (!drag) return;
            const dx = e.clientX - drag.x;
            const dy = e.clientY - drag.y;
            if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
            if (z !== 1 && drag.moved) { tx = drag.tx + dx; ty = drag.ty + dy; clampPan(); applyTf(); }
        });
        const end = e => {
            if (!drag) return;
            const click = !drag.moved;
            drag = null;
            try { img.releasePointerCapture(e.pointerId); } catch { /* capture already gone */ }
            if (click) setZoomIdx(zi + 1);
        };
        img.addEventListener("pointerup", end);
        img.addEventListener("pointercancel", end);
        mid.appendChild(host);
        const stage = mid.closest(".tb-stage");
        if (stage) stage.classList.add("is-image");
    }
    function mountPhoto(mid, id) {
        const spin = el("div", { class: "tb-spin" });
        mid.appendChild(spin);
        signUrl(id).then(u => {
            spin.remove();
            mountPhotoFromSrc(mid, u, id);
        }).catch(() => {
            spin.remove();
            toast("Falha ao carregar a imagem");
        });
    }
    function mountIframe(mid) {
        document.documentElement.classList.add("tb-fallback");
        mid.querySelectorAll(".tb-spin").forEach(s => s.remove());
        const ifr = document.querySelector("iframe.saint-iframe, iframe[src*='/embed/']");
        if (ifr) {
            ifr.style.borderRadius = "0 !important";
            mid.appendChild(ifr);
            return true;
        }
        const id = vidId();
        if (id) {
            const newIfr = el("iframe", { src: "/embed/" + id, allowfullscreen: "true", style: { width: "100%", height: "100%", border: "0", background: "#000" } });
            mid.appendChild(newIfr);
            return true;
        }
        return false;
    }
    function mountVideo(mid, id) {
        const spin = el("div", { class: "tb-spin" });
        mid.appendChild(spin);

        let recovering = false;
        let ac = new AbortController();

        signUrl(id).then(u => {
            if (IMAGE_NAME.test(u)) {
                spin.remove();
                mountPhotoFromSrc(mid, u, id);
                return;
            }
            spin.remove();
            mediaMounted = true;
            const video = el("video", { class: "tb-video", playsinline: "", preload: "metadata" });
            video.volume = prefs.volume ?? 1;
            video.muted = prefs.muted ?? false;
            video.addEventListener("volumechange", () => {
                prefs.volume = video.volume;
                prefs.muted = video.muted;
                saveP();
            }, { signal: ac.signal });

            // Erro de mídia → re-assina no máximo MAX_RESIGNS vezes (com backoff);
            // depois cai para o iframe nativo em vez de entrar em loop de /api/sign.
            const MAX_RESIGNS = 2;
            let resigns = 0, dead = false;
            const giveUp = () => {
                dead = true;
                clearTimeout(video._refT);
                try { video.pause(); video.removeAttribute("src"); video.load(); } catch (e) {}
                if (mountIframe(mid)) { ac.abort(); host.remove(); }
                else toast("Falha ao carregar o vídeo");
            };
            const resetResigns = () => { resigns = 0; };
            video.addEventListener("loadeddata", resetResigns, { signal: ac.signal });
            video.addEventListener("playing", resetResigns, { signal: ac.signal });
            video.addEventListener("error", () => {
                if (recovering || dead) return;
                if (resigns >= MAX_RESIGNS) { giveUp(); return; }
                recovering = true;
                const delay = 1000 * 2 ** resigns;
                resigns++;
                setTimeout(() => {
                    if (!video.isConnected) { recovering = false; return; }
                    signUrl(id).then(newU => {
                        recovering = false;
                        const t = video.currentTime || 0, playing = !video.paused;
                        video.src = newU;
                        try { video.load(); } catch (e) {}
                        if (t) {
                            video.currentTime = t;
                            if (playing) video.play().catch(() => {});
                        }
                        scheduleRefresh(video, id);
                    }).catch(() => {
                        recovering = false;
                        giveUp();
                    });
                }, delay);
            }, { signal: ac.signal });

            const host = el("div", { class: "tb-host tb-pl" }, video);
            buildPlayerControls(host, video, u, id, ac);
            mid.appendChild(host);

            video.addEventListener("loadedmetadata", () => {
                if (!Number.isFinite(video.duration)) return;
                const text = fmtT(video.duration);
                const id = vidId();
                try { if (id) sessionStorage.setItem("tbdur:" + id, text); } catch {}
                const badge = document.querySelector(".tb-playlist-item.is-current .tb-playlist-dur");
                if (badge) { badge.textContent = text; badge.hidden = false; }
            }, { signal: ac.signal });
            video.src = u;
            try { video.load(); } catch (e) {}
            scheduleRefresh(video, id);
        }).catch(() => {
            spin.remove();
            if (mountIframe(mid)) {
                mediaMounted = true;
            } else {
                toast("Falha ao carregar o vídeo");
            }
        });
    }
