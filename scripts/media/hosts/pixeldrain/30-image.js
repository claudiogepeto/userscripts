    /* ==================================================================== * (2) IMAGEM COM ZOOM, PAN E MIRROR */
    function mountImage(f) {
        const preview = document.querySelector(".file_preview");
        if (!preview) return;
        if (cur && cur.kind === "image" && cur.id === f.id && cur.host.isConnected) { hideNative(preview); return; }
        teardownPlayer();
        hideNative(preview);
        gIdx = prefIdx;

        const ac = new AbortController();
        const on = (e, ev, fn) => e.addEventListener(ev, fn, { signal: ac.signal });
        const img = el("img", { class: "pdx-image", alt: f.name || "", draggable: "false" });
        on(img, "load", () => { if (cur) { cur.alive = true; clearTimeout(cur.watchdog); cur.fail.style.display = "none"; } setMirrorLoading(false); });
        on(img, "error", () => nextMirror("Erro na imagem"));

        const fail = el("div", { class: "pdx-fail" },
            el("div", null, "Todos os mirrors falharam para esta imagem."),
            el("div", { class: "pdx-failrow" },
                el("button", { class: "pdx-mini", onClick: () => { gIdx = prefIdx; applyMirror(cur.media); } }, "↻ Tentar de novo"),
                el("a", { class: "pdx-mini", href: "https://pixeldrain.com/api/file/" + f.id, target: "_blank", rel: "noopener" }, "Abrir no oficial")));
        fail.style.display = "none";

        const host = el("div", { class: "pdx-host pdx-img-host" }, img, fail);
        appendImageChrome(host, f);

        // Zoom 1x → 2x → 4x com Drag
        const ZOOMS = [1, 2, 4]; let zi = 0, z = 1, tx = 0, ty = 0;
        const clampPan = () => {
            const stageW = host.clientWidth || window.innerWidth;
            const stageH = host.clientHeight || (window.innerHeight - 120);
            const imgW = img.clientWidth * z;
            const imgH = img.clientHeight * z;
            const mx = Math.max(0, (imgW - stageW) / 2);
            const my = Math.max(0, (imgH - stageH) / 2);
            tx = Math.max(-mx, Math.min(mx, tx));
            ty = Math.max(-my, Math.min(my, ty));
        };
        const applyTf = () => { img.style.transform = z === 1 ? "" : `translate(${tx}px,${ty}px) scale(${z})`; host.classList.toggle("pdx-zoomed", z !== 1); };
        const setZoomIdx = i => { zi = ((i % ZOOMS.length) + ZOOMS.length) % ZOOMS.length; z = ZOOMS[zi]; if (z === 1) { tx = ty = 0; } else clampPan(); applyTf(); };
        let drag = null;
        on(img, "pointerdown", e => { if (e.button) return; e.preventDefault(); e.stopPropagation(); drag = { x: e.clientX, y: e.clientY, tx, ty, moved: false }; try { img.setPointerCapture(e.pointerId); } catch {} });
        on(img, "pointermove", e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true; if (z !== 1 && drag.moved) { tx = drag.tx + dx; ty = drag.ty + dy; clampPan(); applyTf(); } });
        const endDrag = e => { if (!drag) return; const click = !drag.moved; drag = null; try { img.releasePointerCapture(e.pointerId); } catch {} if (click) setZoomIdx(zi + 1); };
        on(img, "pointerup", endDrag); on(img, "pointercancel", endDrag);

        // Setas laterais grandes
        const al = albumInfo(), multi = !!(al && al.files.length > 1);
        if (multi) {
            const prevA = el("button", { type: "button", class: "pdx-plc-side pdx-plc-sprev", title: "Mídia anterior", "aria-label": "Mídia anterior" });
            prevA.innerHTML = PL_ICONS.chevL; prevA.addEventListener("click", e => { e.stopPropagation(); navItem(-1); });
            const nextA = el("button", { type: "button", class: "pdx-plc-side pdx-plc-snext", title: "Próxima mídia", "aria-label": "Próxima mídia" });
            nextA.innerHTML = PL_ICONS.chevR; nextA.addEventListener("click", e => { e.stopPropagation(); navItem(1); });
            host.append(prevA, nextA);
        }

        // Widget de Mirror no canto superior direito do player
        const playerMirror = buildPlayerMirrorWidget();
        host.appendChild(playerMirror);

        // Atalhos de teclado
        const onKey = e => {
            if (e.ctrlKey || e.metaKey || e.altKey || inGallery()) return;
            const t = e.target;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable || (t.closest && t.closest(".pdx-search, .pdx-sidebar-search")))) return;
            let h = true;
            if (e.key === "ArrowLeft") navItem(-1);
            else if (e.key === "ArrowRight") navItem(1);
            else if (e.key === "f") goFullscreen();
            else if (e.shiftKey && (e.key === "N" || e.key === "n")) navItem(1);
            else if (e.shiftKey && (e.key === "P" || e.key === "p")) navItem(-1);
            else if (e.key === "p" || e.key === "P") toggleSidebar();
            else h = false;
            if (h) { e.preventDefault(); e.stopPropagation(); }
        };
        document.addEventListener("keydown", onKey, { capture: true, signal: ac.signal });

        preview.appendChild(host);
        cur = { id: f.id, kind: "image", preview, host, media: img, fail, ac, alive: false, watchdog: null, file: f };
        applyMirror(img);
    }
