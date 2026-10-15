    /* ===================== GALERIA (/f/): BARRA DE AÇÕES, ORDEM E AGRUPAMENTO ===================== */
    let isGalleryGrouped = !!prefs.groupByType;

    // Nome limpo + "Data extraída" no card; devolve o nome original do arquivo.
    function decorateGalleryItem(it) {
        const nameEl = it.querySelector(".file-name");
        if (!nameEl) return "";
        if (it.dataset.flTitled) return nameEl.title || nameEl.textContent.trim();
        it.dataset.flTitled = "1";
        const rawName = nameEl.textContent.trim();
        const dt = extractDateFromTitle(rawName);
        nameEl.textContent = cleanTitleWithoutDate(rawName, dt);
        nameEl.title = rawName;
        if (dt && dt.displayDate && !it.querySelector(".fl-card-dates")) {
            const tipEl = el("span", {
                class: "fl-has-tip",
                title: "Data identificada e extraída do nome do arquivo (definida no upload)"
            }, el("span", { class: "fl-tip-icon" }, "ⓘ"));
            const datesWrap = el("div", { class: "fl-card-dates" },
                el("div", { class: "fl-card-date-row" },
                    el("span", { class: "fl-card-date-lbl" }, "Data extraída:"),
                    el("span", { class: "fl-card-date-val" }, dt.displayDate),
                    tipEl
                )
            );
            const infoCont = it.querySelector(".file-info") || nameEl.parentElement;
            if (infoCont) infoCont.appendChild(datesWrap);
        }
        return rawName;
    }

    // Barra de ações do bunkr sobre a lista: busca (/ e ?q=), fichas (sem "Data de Envio": o filester
    // não informa a data de upload), Agrupar por tipo, Nomes completos, Copiar nomes/URLs e contador.
    function setupGalleryGrouping() {
        const list = document.querySelector(".files-list.grid-view");
        if (!list || list.dataset.tbGroupDone) return;
        list.dataset.tbGroupDone = "1";

        const cards = Array.from(list.querySelectorAll(".file-item")).map((it, idx) => {
            const name = decorateGalleryItem(it);
            return { it, idx, name, kind: getMediaKind(name), href: it.getAttribute("href") || (it.querySelector("a[href]") || {}).href || "" };
        });
        if (!cards.length) return;

        const sortState = { mode: prefs.gallerySort || "default", dir: prefs.gallerySortDir || "desc" };
        let query = mediaGetQ().toLowerCase();
        let headers = [];

        const sort = mediaSortChips({
            kind: "bar",
            mode: sortState.mode,
            dirs: { [sortState.mode]: sortState.dir },
            chips: [
                { key: "default", label: "Padrão", title: "Ordem original da pasta" },
                { key: "title", label: "Data Extraída", dir: true, title: "Ordenar por data extraída do nome do arquivo", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
                { key: "name", label: "A-Z", dir: true, title: "Ordenar por nome alfabético", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="8" y2="18"/></svg>' }
            ],
            onChange: (mode, dir) => {
                sortState.mode = mode; sortState.dir = dir;
                prefs.gallerySort = mode; prefs.gallerySortDir = dir; saveP();
                render();
            }
        });
        const visible = () => cards.filter(c => c.match !== false);
        const bar = buildActionBar({
            sort,
            grouped: isGalleryGrouped,
            onGroup: on => { isGalleryGrouped = on; prefs.groupByType = on; saveP(); render(); },
            onFullNames: on => list.classList.toggle("is-full-names", on),
            names: () => visible().map(c => c.name),
            urls: () => visible().map(c => { try { return new URL(c.href, location.origin).href; } catch { return ""; } }).filter(Boolean),
            onSearch: q => { query = q.toLowerCase(); applySearch(); }
        });
        list.parentNode.insertBefore(bar.bar, list);

        function render() {
            const ordered = mediaSortItems(cards, sortState.mode, sortState.dir, { name: c => c.name });
            headers.forEach(h => h.hdr.remove());
            headers = [];
            if (!isGalleryGrouped) {
                ordered.forEach(c => list.appendChild(c.it));
                applySearch();
                return;
            }
            const defs = [
                { key: "video", title: "Vídeos", icon: PL_ICONS.video, unit: "vídeos", items: [] },
                { key: "image", title: "Fotos", icon: PL_ICONS.image, unit: "fotos", items: [] },
                { key: "text", title: "Documentos & Textos", icon: PL_ICONS.fileText, unit: "textos", items: [] },
                { key: "other", title: "Outros Arquivos", icon: PL_ICONS.grid, unit: "arquivos", items: [] }
            ];
            ordered.forEach(c => (defs.find(d => d.key === c.kind) || defs[3]).items.push(c));
            defs.forEach(def => {
                if (!def.items.length) return;
                const countEl = el("span", { class: "fl-group-count" });
                const hdr = el("div", { class: "fl-group-header", "data-group": def.key },
                    el("div", { class: "fl-group-header-left" }, el("span", { html: def.icon }), el("span", null, def.title), countEl),
                    el("div", { class: "fl-group-line" })
                );
                headers.push({ hdr, countEl, unit: def.unit, items: def.items });
                list.appendChild(hdr);
                def.items.forEach(c => list.appendChild(c.it));
            });
            applySearch();
        }
        function applySearch() {
            let shown = 0;
            cards.forEach(c => {
                c.match = !query || c.name.toLowerCase().indexOf(query) !== -1;
                c.it.style.display = c.match ? "" : "none";
                if (c.match) shown++;
            });
            headers.forEach(g => {
                const n = g.items.filter(c => c.match).length;
                g.countEl.textContent = `${n} ${n === 1 ? "arquivo" : g.unit}`;
                g.hdr.style.display = n ? "" : "none";
            });
            bar.setCount(shown === cards.length ? `Total: ${cards.length} arquivos` : `${shown} de ${cards.length} arquivos`);
        }

        render();
    }
