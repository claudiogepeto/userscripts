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
        bindZoom(host, img, { zoomClass: "pdx-zoomed", stopPointer: true, padH: 120, keys: { nav: navItem, fullscreen: goFullscreen } });

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
            // ← → f (e + − 0 Esc) ficam no teclado da foto do core (bindZoom acima)
            if (e.shiftKey && (e.key === "N" || e.key === "n")) navItem(1);
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
