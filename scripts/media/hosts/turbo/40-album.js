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
            kind: "video"
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

        // Botão Agrupar por Tipo na barra do álbum
        const albumControls = document.querySelector(".flex.flex-wrap.items-center.gap-4, .mb-6.flex, .max-w-6xl .flex");
        if (albumControls && !albumControls.querySelector(".tb-group-toggle-btn")) {
            const grpBtn = el("button", {
                type: "button",
                class: "tb-group-toggle-btn" + (isAlbumGrouped ? " is-active" : ""),
                onClick: () => {
                    isAlbumGrouped = !isAlbumGrouped;
                    prefs.groupByType = isAlbumGrouped;
                    saveP();
                    grpBtn.classList.toggle("is-active", isAlbumGrouped);
                    render();
                }
            });
            grpBtn.innerHTML = `${IC.playlist} <span>Agrupar por Tipo</span>`;
            albumControls.appendChild(grpBtn);
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
        // Ordenação e agrupamento remontam a grade; a busca só esconde cards.
        function render() {
            const sort = ((document.getElementById("sortSelect") || {}).value) || "name_asc";
            let list = cards;
            const cmp = {
                name_asc: (a, b) => a.d.name.localeCompare(b.d.name),
                name_desc: (a, b) => b.d.name.localeCompare(a.d.name),
                size_asc: (a, b) => a.d.size - b.d.size,
                size_desc: (a, b) => b.d.size - a.d.size,
                views_asc: (a, b) => a.d.views - b.d.views,
                views_desc: (a, b) => b.d.views - a.d.views,
            }[sort];
            if (cmp) list = list.slice().sort(cmp);
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
                { key: "video", title: "Vídeos", icon: IC.video, items: groups.video },
                { key: "image", title: "Fotos", icon: IC.image, items: groups.image },
                { key: "text", title: "Textos & Documentos", icon: IC.fileText, items: groups.text },
                { key: "other", title: "Outros", icon: IC.grid, items: groups.other }
            ];

            defs.forEach(def => {
                if (!def.items.length) return;
                const countEl = el("span", { class: "tb-album-group-count" });
                const hdr = el("div", { class: "tb-album-group-header" },
                    el("div", { class: "tb-album-group-title" },
                        el("span", { html: def.icon }),
                        el("span", null, def.title)
                    ),
                    countEl
                );
                groupHeaders.push({ hdr, countEl, items: def.items });
                grid.appendChild(hdr);
                def.items.forEach(c => grid.appendChild(c.card));
            });
            grid.append(empty);
            applySearch();
        }
        function applySearch() {
            const q = (((document.getElementById("searchInput") || {}).value) || "").toLowerCase().trim();
            let shown = 0;
            cards.forEach(c => {
                c.match = !q || c.d.name.toLowerCase().indexOf(q) !== -1;
                c.card.style.display = c.match ? "" : "none";
                if (c.match) shown++;
            });
            groupHeaders.forEach(g => {
                const n = g.items.filter(c => c.match).length;
                g.countEl.textContent = `${n} ${n === 1 ? "item" : "itens"}`;
                g.hdr.style.display = n ? "" : "none";
            });
            empty.style.display = shown ? "none" : "";
        }

        const si = document.getElementById("searchInput"); if (si) si.addEventListener("input", debounce(applySearch, 150));
        const ss = document.getElementById("sortSelect"); if (ss) ss.addEventListener("change", render);
        render();
        return true;
    }
