    /* ===================== ORDEM E AGRUPAMENTO POR TIPO NA GALERIA ===================== */
    let isGroupByType = localStorage.getItem("gf_group_by_type") === "1";
    const gallerySort = { mode: prefs.gallerySort || "default", dir: prefs.gallerySortDir || "desc" };
    const GF_SORT_ACC = { name: c => c._gf.name, upload: c => c._gf.uploadTs, size: c => c._gf.sizeBytes };

    function galleryGrid() {
        return document.querySelector("#fm-list > div, #fm-list [role='list'], #filemanager_itemslist, [role='list'][aria-label*='Folder' i]");
    }

    function groupGalleryByType(enable, persist) {
        isGroupByType = enable;
        if (persist) { try { localStorage.setItem("gf_group_by_type", enable ? "1" : "0"); } catch (e) {} }
        arrangeGallery();
    }

    function setGallerySort(mode, dir) {
        gallerySort.mode = mode; gallerySort.dir = dir;
        prefs.gallerySort = mode; prefs.gallerySortDir = dir; saveP();
        arrangeGallery();
    }

    // Põe os cards na ordem das fichas (a do gofile em "Padrão") e, com o agrupamento ligado, sob os
    // cabeçalhos de tipo. Só reanexa quando a ordem atual difere: reanexar a cada scan geraria
    // mutações que disparam o observer de novo.
    function arrangeGallery() {
        const grid = galleryGrid();
        if (!grid) return;
        const items = Array.from(grid.querySelectorAll(".gf-card"));
        if (!items.length) {
            grid.querySelectorAll(".gf-group-header").forEach(h => h.remove());
            return;
        }
        if (!isGroupByType && gallerySort.mode === "default" && !grid.querySelector(".gf-group-header")) {
            const sorted = items.every((it, i) => !i || (+items[i - 1].dataset.gfOrigIdx || 0) <= (+it.dataset.gfOrigIdx || 0));
            if (sorted) return;
        }
        const base = items.slice().sort((a, b) => (+a.dataset.gfOrigIdx || 0) - (+b.dataset.gfOrigIdx || 0));
        const ordered = mediaSortItems(base, gallerySort.mode, gallerySort.dir, GF_SORT_ACC);

        const want = [];
        const defs = [
            { key: "video", title: "Vídeos", icon: IC.video, unit: "vídeos", list: [] },
            { key: "image", title: "Fotos", icon: IC.image, unit: "fotos", list: [] },
            { key: "text", title: "Documentos & Textos", icon: IC.doc, unit: "textos", list: [] },
            { key: "other", title: "Outros Arquivos", icon: IC.archive, unit: "arquivos", list: [] },
        ];
        if (isGroupByType) {
            ordered.forEach(it => {
                const k = it._gf ? it._gf.kind : "other";
                (defs.find(d => d.key === k) || defs[3]).list.push(it);
            });
            defs.forEach(def => {
                if (!def.list.length) return;
                want.push(def.key + ":" + def.list.length);
                def.list.forEach(it => want.push(it));
            });
        } else {
            ordered.forEach(it => want.push(it));
        }

        const have = Array.from(grid.children).filter(c => c.classList.contains("gf-card") || c.classList.contains("gf-group-header"));
        const inOrder = have.length === want.length && have.every((c, i) => typeof want[i] === "string" ? c.dataset.gfGroup === want[i] : c === want[i]);
        if (inOrder) return;

        grid.querySelectorAll(".gf-group-header").forEach(h => h.remove());
        if (!isGroupByType) {
            ordered.forEach(it => grid.appendChild(it));
            return;
        }
        defs.forEach(def => {
            if (!def.list.length) return;
            const n = def.list.length;
            const hdr = el("div", { class: "gf-group-header" },
                el("div", { class: "gf-group-header-left" },
                    el("span", { html: def.icon }),
                    el("span", null, def.title),
                    el("span", { class: "gf-group-count" }, `${n} ${n === 1 ? "arquivo" : def.unit}`)
                ),
                el("div", { class: "gf-group-line" })
            );
            hdr.dataset.gfGroup = def.key + ":" + n;
            grid.appendChild(hdr);
            def.list.forEach(it => grid.appendChild(it));
        });
    }
