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
        buildPlayerControls(host, video, src, ac);
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
        const ZOOMS = [1, 2, 4]; let zi = 0, z = 1, tx = 0, ty = 0;
        const clampPan = () => {
            const stageW = mid.clientWidth || window.innerWidth;
            const stageH = mid.clientHeight || (window.innerHeight - 190);
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
        newImg.addEventListener("pointerdown", e => { if (e.button) return; e.preventDefault(); drag = { x: e.clientX, y: e.clientY, tx, ty, moved: false }; try { newImg.setPointerCapture(e.pointerId); } catch (er) {} });
        newImg.addEventListener("pointermove", e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true; if (z !== 1 && drag.moved) { tx = drag.tx + dx; ty = drag.ty + dy; clampPan(); applyTf(); } });
        const end = e => { if (!drag) return; const click = !drag.moved; drag = null; try { newImg.releasePointerCapture(e.pointerId); } catch (er) {} if (click) setZoomIdx(zi + 1); };
        newImg.addEventListener("pointerup", end); newImg.addEventListener("pointercancel", end);
    }
