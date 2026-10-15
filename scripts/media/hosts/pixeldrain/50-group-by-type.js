    /* ==================================================================== * (5) AGRUPAMENTO POR TIPO NA GALERIA */
    let isGalleryGrouped = !!prefs.groupByType;
    let gallerySort = prefs.gallerySort || "default";
    let gallerySortDir = prefs.gallerySortDir === "asc" ? "asc" : "desc";

    function galleryFileMeta(card) {
        const al = albumInfo();
        if (!al || !al.files) return null;
        const name = card.dataset.pdxName || "";
        return al.files.find(f => f.name === name) || al.files[+card.dataset.pdxOrigIdx] || null;
    }
    function compareGalleryCards(a, b) {
        if (gallerySort === "name") {
            const d = (a.dataset.pdxName || "").localeCompare(b.dataset.pdxName || "", undefined, { numeric: true, sensitivity: "base" });
            return gallerySortDir === "asc" ? d : -d;
        }
        const fa = galleryFileMeta(a) || {};
        const fb = galleryFileMeta(b) || {};
        const dir = gallerySortDir === "asc" ? 1 : -1;
        if (gallerySort === "size") return ((fa.size || 0) - (fb.size || 0)) * dir;
        if (gallerySort === "date") return (new Date(fa.date_upload || 0).getTime() - new Date(fb.date_upload || 0).getTime()) * dir;
        return (+a.dataset.pdxOrigIdx || 0) - (+b.dataset.pdxOrigIdx || 0);
    }

    function renderGalleryGroups() {
        const gal = document.querySelector(".file_viewer .gallery") || document.querySelector(".file_preview .gallery");
        if (!gal) return;
        const cards = Array.from(gal.querySelectorAll(":scope > .file"));
        if (!cards.length) return;

        gal.querySelectorAll(".pdx-gal-group-header").forEach(h => h.remove());

        if (!isGalleryGrouped) {
            cards.sort(compareGalleryCards);
            cards.forEach(c => gal.appendChild(c));
            return;
        }

        cards.forEach((c, idx) => {
            if (!c.dataset.pdxOrigIdx) c.dataset.pdxOrigIdx = String(idx);
        });

        const groups = { video: [], image: [], text: [], other: [] };
        cards.forEach(c => {
            const name = (c.dataset.pdxName || c.textContent || "").trim();
            const f = { name };
            const k = getFileKind(f);
            if (groups[k]) groups[k].push(c);
            else groups.other.push(c);
        });

        const defs = [
            { key: "video", title: "Vídeos", icon: PL_ICONS.film, list: groups.video },
            { key: "image", title: "Fotos", icon: PL_ICONS.image, list: groups.image },
            { key: "text", title: "Textos & Documentos", icon: PL_ICONS.fileText, list: groups.text },
            { key: "other", title: "Arquivos & Outros", icon: PL_ICONS.archive, list: groups.other }
        ];

        defs.forEach(def => {
            if (!def.list.length) return;
            def.list.sort(compareGalleryCards);
            const hdr = el("div", { class: "pdx-gal-group-header" },
                el("div", { class: "pdx-gal-group-title" },
                    el("span", { class: "pdx-gal-group-icon", html: def.icon }),
                    el("span", null, def.title)
                ),
                el("span", { class: "pdx-gal-group-count" }, `${def.list.length} ${def.list.length === 1 ? "item" : "itens"}`)
            );
            gal.appendChild(hdr);
            def.list.forEach(c => gal.appendChild(c));
        });
    }
