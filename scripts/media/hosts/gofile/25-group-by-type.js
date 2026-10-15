    /* ===================== AGRUPAMENTO POR TIPO NA GALERIA ===================== */
    let isGroupByType = localStorage.getItem("gf_group_by_type") === "1";

    function groupGalleryByType(enable, persist) {
        isGroupByType = enable;
        if (persist) { try { localStorage.setItem("gf_group_by_type", enable ? "1" : "0"); } catch (e) {} }

        const grid = document.querySelector("#fm-list > div, #fm-list [role='list'], #filemanager_itemslist, [role='list'][aria-label*='Folder' i]");
        if (!grid) return;

        const items = Array.from(grid.querySelectorAll(".gf-card"));
        if (!items.length) {
            grid.querySelectorAll(".gf-gallery-group-header").forEach(h => h.remove());
            return;
        }

        if (!enable) {
            grid.querySelectorAll(".gf-gallery-group-header").forEach(h => h.remove());
            items.sort((a, b) => (+a.dataset.gfOrigIdx || 0) - (+b.dataset.gfOrigIdx || 0));
            items.forEach(it => grid.appendChild(it));
            return;
        }

        // Salva índice original se ainda não tiver
        items.forEach((it, i) => {
            if (!it.dataset.gfOrigIdx) it.dataset.gfOrigIdx = String(i);
        });

        const groups = {
            video: [],
            image: [],
            other: []
        };

        items.forEach(it => {
            const k = it._gf ? it._gf.kind : "other";
            if (k === "video") groups.video.push(it);
            else if (k === "image") groups.image.push(it);
            else groups.other.push(it);
        });

        const defs = [
            { key: "video", title: "Vídeos", icon: IC.video, list: groups.video },
            { key: "image", title: "Fotos", icon: IC.image, list: groups.image },
            { key: "other", title: "Documentos & Outros", icon: IC.file, list: groups.other },
        ];

        // Só reordena quando chegaram cards novos ou a ordem atual difere da agrupada:
        // reanexar tudo a cada scan gera mutações que disparam o observer de novo.
        const want = [];
        defs.forEach(def => {
            if (!def.list.length) return;
            want.push(def.key + ":" + def.list.length);
            def.list.forEach(it => want.push(it));
        });
        const have = Array.from(grid.children).filter(c => c.classList.contains("gf-card") || c.classList.contains("gf-gallery-group-header"));
        const inOrder = have.length === want.length && have.every((c, i) => typeof want[i] === "string" ? c.dataset.gfGroup === want[i] : c === want[i]);
        if (inOrder) return;

        grid.querySelectorAll(".gf-gallery-group-header").forEach(h => h.remove());
        defs.forEach(def => {
            if (!def.list.length) return;
            const hdr = el("div", { class: "gf-gallery-group-header" },
                el("div", { class: "gf-gallery-group-title" },
                    el("span", { html: def.icon }),
                    el("span", null, def.title)
                ),
                el("span", { class: "gf-gallery-group-count" }, `${def.list.length} ${def.list.length === 1 ? "item" : "itens"}`)
            );
            hdr.dataset.gfGroup = def.key + ":" + def.list.length;
            grid.appendChild(hdr);
            def.list.forEach(it => grid.appendChild(it));
        });
    }
