    /* ===================== ÁLBUM (/a/): TABELA → GRADE COM AGRUPAMENTO ===================== */
    let isAlbumGrouped = !!prefs.groupByType;

    function buildAlbumGrid() {
        if (document.querySelector(".tb-grid")) return true;
        const files = readPageFiles();
        const tbody = document.getElementById("fileTbody");
        const rows = tbody ? Array.from(tbody.querySelectorAll("tr.file-row")) : [];
        if (!files.length && !rows.length) return false;

        const data = files.length ? files.map((f, idx) => ({
            id: f.id,
            origIdx: idx,
            name: f.name || f.id,
            size: f.size || 0,
            sizeText: "",
            views: f.views || 0,
            href: "/v/" + f.id,
            thumb: f.thumb || "",
            type: ((f.name || "").split(".").pop() || "mp4"),
            kind: IMAGE_NAME.test(f.name || "") ? "image" : (/\.(txt|md|nfo|log)$/i.test(f.name || "") ? "text" : "video")
        })) : rows.map((row, idx) => {
            const a = row.querySelector("a[data-thumb]") || row.querySelector('a[href*="/v/"]');
            const id = row.dataset.id || "";
            const sizeTd = row.querySelector(".file-size");
            const rawType = (row.children[2] && (row.children[2].textContent || "").trim().toLowerCase()) || "mp4";
            let kind = "video";
            if (/\.(jpe?g|png|gif|webp|avif)$/i.test(rawType) || rawType === "image") kind = "image";
            else if (/\.(txt|md|nfo|log)$/i.test(rawType) || rawType === "text") kind = "text";

            return {
                id,
                origIdx: idx,
                name: row.dataset.name || (a ? a.textContent.replace(/\s+/g, " ").trim() : "") || id,
                size: parseInt(row.dataset.size || "0", 10) || 0,
                sizeText: sizeTd ? (sizeTd.textContent || "").trim() : "",
                views: parseInt(row.dataset.views || "0", 10) || 0,
                href: (a && a.getAttribute("href")) || ("/v/" + id),
                thumb: (a && a.getAttribute("data-thumb")) || (id ? THUMB_BASE + id + ".jpg" : ""),
                type: rawType,
                kind
            };
        });

        const grid = el("div", { class: "tb-grid" });
        if (tbody) {
            const table = tbody.closest("table") || tbody;
            const wrap = table.closest(".overflow-x-auto") || table;
            wrap.style.display = "none";
            wrap.insertAdjacentElement("afterend", grid);
        } else {
            const native = document.getElementById("grid");
            const list = document.getElementById("list");
            if (native) native.style.display = "none";
            if (list) list.style.display = "none";
            const anchor = native || document.getElementById("rows") || document.querySelector("main") || document.body;
            anchor.insertAdjacentElement("afterend", grid);
        }

        const cards = data.map(d => {
            const dt = extractDateFromTitle(d.name);
            const cleanTitle = cleanTitleWithoutDate(d.name, dt);

            const card = el("div", { class: "tb-card" });
            const link = el("a", { class: "tb-card-link", href: d.href });
            const th = el("div", { class: "tb-card-thumb" });

            if (d.thumb || d.id) {
                const img = el("img", { alt: "", loading: "lazy" });
                attachThumb(img, d.id, d.thumb);
                th.appendChild(img);
            } else {
                th.appendChild(makeThumbPlaceholder(d.kind, d.type));
            }

            const play = el("div", { class: "tb-card-play" });
            play.insertAdjacentHTML("beforeend", "<span>" + IC.video + "</span>");
            th.appendChild(play);

            const body = el("div", { class: "tb-card-body" });
            body.append(el("div", { class: "tb-card-name", title: d.name }, cleanTitle));

            // Metadados de data
            const datesWrap = el("div", { class: "tb-card-dates" });
            if (dt && dt.displayDate) {
                const tipEl = el("span", {
                    class: "tb-has-tip",
                    title: "Data identificada e extraída do nome do arquivo (definida no upload)"
                }, el("span", { class: "tb-tip-icon" }, "ⓘ"));
                datesWrap.appendChild(el("div", { class: "tb-card-date-row" },
                    el("span", { class: "tb-card-date-lbl" }, "Data extraída:"),
                    el("span", { class: "tb-card-date-val" }, dt.displayDate),
                    tipEl
                ));
            }
            if (datesWrap.childNodes.length) body.appendChild(datesWrap);

            body.append(el("div", { class: "tb-card-meta" }, [d.type.toUpperCase(), d.sizeText, d.views ? (d.views + " views") : ""].filter(Boolean).join(" · ")));
            link.append(th, body);
            card.append(link);

            const dl = el("a", { class: "tb-card-dl", href: "/d/" + d.id, title: "Download" });
            dl.insertAdjacentHTML("beforeend", IC.download);
            card.append(dl);
            return { d, card };
        });

        const empty = el("div", { class: "tb-empty" }, "Nenhum arquivo encontrado");
        let groupHeaders = [];
        let query = mediaGetQ().toLowerCase();
        const sortState = { mode: prefs.albumSort || "default", dir: prefs.albumSortDir || "desc" };
        const sortAcc = { name: c => c.d.name, size: c => c.d.size, views: c => c.d.views };

        // Barra de ações do bunkr: busca (/ e ?q=), fichas, agrupar, nomes completos, copiar e contador.
        // O turbo não informa a data de envio, então não há ficha "Data de Envio".
        const sortChips = mediaSortChips({
            kind: "bar",
            mode: sortState.mode,
            dirs: { [sortState.mode]: sortState.dir },
            chips: [
                { key: "default", label: "Padrão", title: "Ordem original do álbum" },
                { key: "title", label: "Data Extraída", dir: true, title: "Ordenar por data extraída do nome do arquivo", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
                { key: "name", label: "A-Z", dir: true, title: "Ordenar por nome alfabético", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="8" y2="18"/></svg>' },
                { key: "size", label: "Tamanho", dir: true, title: "Ordenar por tamanho de arquivo", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>' },
                { key: "views", label: "Views", dir: true, title: "Ordenar por visualizações", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' }
            ],
            onChange: (mode, dir) => {
                sortState.mode = mode; sortState.dir = dir;
                prefs.albumSort = mode; prefs.albumSortDir = dir; saveP();
                render();
            }
        });
        const visible = () => cards.filter(c => c.match !== false);
        const bar = buildActionBar({
            sort: sortChips,
            grouped: isAlbumGrouped,
            onGroup: on => { isAlbumGrouped = on; prefs.groupByType = on; saveP(); render(); },
            onFullNames: on => grid.classList.toggle("is-full-names", on),
            names: () => visible().map(c => c.d.name),
            urls: () => visible().map(c => location.origin + c.d.href),
            onSearch: q => { query = q.toLowerCase(); applySearch(); }
        });
        grid.insertAdjacentElement("beforebegin", bar.bar);

        // Ordenação e agrupamento remontam a grade; a busca só esconde cards.
        function render() {
            const list = mediaSortItems(cards, sortState.mode, sortState.dir, sortAcc);
            grid.textContent = "";
            groupHeaders = [];

            if (!isAlbumGrouped) {
                list.forEach(c => grid.append(c.card));
                grid.append(empty);
                applySearch();
                return;
            }

            const groups = { video: [], image: [], text: [], other: [] };
            list.forEach(c => {
                if (groups[c.d.kind]) groups[c.d.kind].push(c);
                else groups.other.push(c);
            });

            const defs = [
                { key: "video", title: "Vídeos", icon: IC.video, unit: "vídeos", items: groups.video },
                { key: "image", title: "Fotos", icon: IC.image, unit: "fotos", items: groups.image },
                { key: "text", title: "Documentos & Textos", icon: IC.fileText, unit: "textos", items: groups.text },
                { key: "other", title: "Outros Arquivos", icon: IC.grid, unit: "arquivos", items: groups.other }
            ];

            defs.forEach(def => {
                if (!def.items.length) return;
                const countEl = el("span", { class: "tb-group-count" });
                const hdr = el("div", { class: "tb-group-header", "data-group": def.key },
                    el("div", { class: "tb-group-header-left" },
                        el("span", { html: def.icon }),
                        el("span", null, def.title),
                        countEl
                    ),
                    el("div", { class: "tb-group-line" })
                );
                groupHeaders.push({ hdr, countEl, unit: def.unit, items: def.items });
                grid.appendChild(hdr);
                def.items.forEach(c => grid.appendChild(c.card));
            });
            grid.append(empty);
            applySearch();
        }
        function applySearch() {
            let shown = 0;
            cards.forEach(c => {
                c.match = !query || c.d.name.toLowerCase().indexOf(query) !== -1;
                c.card.style.display = c.match ? "" : "none";
                if (c.match) shown++;
            });
            groupHeaders.forEach(g => {
                const n = g.items.filter(c => c.match).length;
                g.countEl.textContent = `${n} ${n === 1 ? "arquivo" : g.unit}`;
                g.hdr.style.display = n ? "" : "none";
            });
            empty.style.display = shown ? "none" : "";
            bar.setCount(shown === cards.length ? `Total: ${cards.length} arquivos` : `${shown} de ${cards.length} arquivos`);
        }

        render();
        return true;
    }
