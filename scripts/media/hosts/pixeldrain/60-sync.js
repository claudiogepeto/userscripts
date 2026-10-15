    /* ==================================================================== * (7) ORQUESTRAÇÃO & SYNC */
    let lastSig = null;
    const sync = debounce(() => {
        const fv = document.querySelector(".file_viewer");
        const row = document.querySelector(".file_preview_row");
        if (!fv || !row) return;

        hideForeign(fv, ["file_preview_row"]);
        hideForeign(row, ["file_preview", "pdx-sidebar"]);
        const preview = row.querySelector(".file_preview");
        if (preview) preview.style.left = "0";

        buildGlobalTopbar(fv);

        const gal = inGallery();
        const f = gal ? null : currentFile();
        const sig = (gal ? "G" : "C") + "|" + location.hash + "|" + (f ? f.id : "");

        if (sig === lastSig) {
            if (gal) {
                clearPlayerOverlay();
            } else if (f) {
                if (isVideoFile(f)) mountPlayer(f);
                else if (isImageFile(f)) mountImage(f);
                else if (isTextFile(f)) mountTextViewer(f);
            }
            return;
        }
        lastSig = sig;

        if (gal) {
            if (openSingleItemList()) return;
            clearPlayerOverlay();
            buildGalbar(fv);
            fv.classList.add("pdx-mode-gallery");
            fv.classList.remove("pdx-mode-content");
            row.classList.remove("pdx-has-sidebar");
            if (stSidebarEl) { stSidebarEl.remove(); stSidebarEl = null; }
            const sm = row.querySelector(":scope > .pdx-stage-main");
            if (sm) {
                if (preview && preview.parentNode === sm) row.appendChild(preview);
                sm.remove();
            }
            const galbar = fv.querySelector(":scope > .pdx-galbar");
            if (galbar) galbar.style.display = "";
            const vrow = fv.querySelector(":scope > .pdx-vrow");
            if (vrow) vrow.style.display = "none";
            const gtop = fv.querySelector(":scope > .pdx-gtop");
            if (gtop) gtop.style.display = "none";
            decorateGalleryCards();
            applyGalleryFilter(state.filter);
            if (isGalleryGrouped || gallerySort !== "default") setTimeout(renderGalleryGroups, 100);
            return;
        }

        fv.classList.add("pdx-mode-content");
        fv.classList.remove("pdx-mode-gallery");
        const galbar = fv.querySelector(":scope > .pdx-galbar");
        if (galbar) galbar.style.display = "none";
        const gtop = fv.querySelector(":scope > .pdx-gtop");
        if (gtop) gtop.style.display = "none";

        if (!f) { teardownPlayer(); return; }

        // Estrutura Bunkr: coluna principal da esquerda (pdx-stage-main) contendo Topbar (pdx-vrow) + Mídia (file_preview)
        let stageMain = row.querySelector(":scope > .pdx-stage-main");
        if (!stageMain) {
            stageMain = el("div", { class: "pdx-stage-main" });
            row.insertBefore(stageMain, row.firstChild);
            if (preview && preview.parentNode !== stageMain) {
                stageMain.appendChild(preview);
            }
        } else if (preview && preview.parentNode !== stageMain) {
            stageMain.appendChild(preview);
        }

        let vrow = stageMain.querySelector(":scope > .pdx-vrow");
        if (!vrow) {
            // Remove qualquer vrow antigo solto no fv se existir
            fv.querySelectorAll(":scope > .pdx-vrow").forEach(v => v.remove());
            vrow = el("div", { class: "pdx-vrow" });
            stageMain.insertBefore(vrow, preview);
            buildVideoRowOnce(vrow);
        }
        vrow.style.display = "";
        updateVideoRow(vrow, f);

        // Sidebar Playlist ao lado da coluna principal (stageMain) com 100vh
        setupSidebar(row);

        // Monta o visualizador apropriado
        if (isVideoFile(f)) mountPlayer(f);
        else if (isImageFile(f)) mountImage(f);
        else if (isTextFile(f)) mountTextViewer(f);
        else teardownPlayer();
    }, 100);
