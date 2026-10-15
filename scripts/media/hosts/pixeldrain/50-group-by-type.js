    /* ==================================================================== * (5) AGRUPAMENTO POR TIPO NA GALERIA */
    let isGalleryGrouped = !!prefs.groupByType;
    // Fichas do bunkr; "date" era a ficha de data de envio das versões anteriores.
    let gallerySort = prefs.gallerySort === "date" ? "upload" : (prefs.gallerySort || "default");
    let gallerySortDir = prefs.gallerySortDir === "asc" ? "asc" : "desc";

    function galleryFileMeta(card) {
        const al = albumInfo();
        if (!al || !al.files) return null;
        const name = card.dataset.pdxName || "";
        return al.files.find(f => f.name === name) || al.files[+card.dataset.pdxOrigIdx] || null;
    }
    const GALLERY_SORT_ACC = {
        name: c => c.dataset.pdxName || "",
        upload: c => new Date((galleryFileMeta(c) || {}).date_upload || 0).getTime() || 0,
        size: c => (galleryFileMeta(c) || {}).size || 0
    };

    // Ordena pelas fichas (a ordem da lista em "Padrão") e, com o agrupamento ligado, põe sob os cabeçalhos de tipo.
    function renderGalleryGroups() {
        const gal = document.querySelector(".file_viewer .gallery") || document.querySelector(".file_preview .gallery");
        if (!gal) return;
        const cards = Array.from(gal.querySelectorAll(":scope > .file"));
        if (!cards.length) return;
        cards.forEach((c, idx) => {
            if (!c.dataset.pdxOrigIdx) c.dataset.pdxOrigIdx = String(idx);
        });

        gal.querySelectorAll(".pdx-group-header").forEach(h => h.remove());
        const base = cards.slice().sort((a, b) => (+a.dataset.pdxOrigIdx || 0) - (+b.dataset.pdxOrigIdx || 0));
        const ordered = mediaSortItems(base, gallerySort, gallerySortDir, GALLERY_SORT_ACC);

        if (!isGalleryGrouped) {
            ordered.forEach(c => gal.appendChild(c));
            return;
        }

        const defs = [
            { key: "video", title: "Vídeos", icon: PL_ICONS.film, unit: "vídeos", list: [] },
            { key: "image", title: "Fotos", icon: PL_ICONS.image, unit: "fotos", list: [] },
            { key: "text", title: "Documentos & Textos", icon: PL_ICONS.fileText, unit: "textos", list: [] },
            { key: "other", title: "Outros Arquivos", icon: PL_ICONS.archive, unit: "arquivos", list: [] }
        ];
        ordered.forEach(c => {
            const k = getFileKind({ name: (c.dataset.pdxName || c.textContent || "").trim() });
            (defs.find(d => d.key === k) || defs[3]).list.push(c);
        });
        defs.forEach(def => {
            if (!def.list.length) return;
            const n = def.list.length;
            const hdr = el("div", { class: "pdx-group-header", "data-group": def.key },
                el("div", { class: "pdx-group-header-left" },
                    el("span", { html: def.icon }),
                    el("span", null, def.title),
                    el("span", { class: "pdx-group-count" }, `${n} ${n === 1 ? "arquivo" : def.unit}`)
                ),
                el("div", { class: "pdx-group-line" })
            );
            gal.appendChild(hdr);
            def.list.forEach(c => gal.appendChild(c));
        });
    }
