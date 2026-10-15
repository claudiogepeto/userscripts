    /* ===================== GALERIA (/f/): AGRUPAMENTO POR TIPO ===================== */
    let isGalleryGrouped = !!prefs.groupByType;

    function setupGalleryGrouping() {
        const list = document.querySelector(".files-list.grid-view");
        if (!list || list.dataset.tbGroupDone) return;
        list.dataset.tbGroupDone = "1";

        const filterBar = document.querySelector(".filters-bar");
        if (filterBar && !filterBar.querySelector(".fl-group-toggle-btn")) {
            const btn = el("button", {
                type: "button",
                class: "fl-group-toggle-btn" + (isGalleryGrouped ? " is-active" : ""),
                onClick: () => {
                    isGalleryGrouped = !isGalleryGrouped;
                    prefs.groupByType = isGalleryGrouped;
                    saveP();
                    btn.classList.toggle("is-active", isGalleryGrouped);
                    renderGalGroups();
                }
            });
            btn.innerHTML = `${PL_ICONS.playlist} <span>Agrupar por Tipo</span>`;
            filterBar.appendChild(btn);
        }

        function renderGalGroups() {
            const items = Array.from(list.querySelectorAll(".file-item"));
            if (!items.length) return;

            list.querySelectorAll(".fl-album-group-header").forEach(h => h.remove());

            if (!isGalleryGrouped) {
                items.sort((a, b) => (+a.dataset.flOrigIdx || 0) - (+b.dataset.flOrigIdx || 0));
                items.forEach(it => list.appendChild(it));
                return;
            }

            items.forEach((it, idx) => {
                if (!it.dataset.flOrigIdx) it.dataset.flOrigIdx = String(idx);
            });

            const groups = { video: [], image: [], text: [], other: [] };
            items.forEach(it => {
                const nameEl = it.querySelector(".file-name");
                const name = (nameEl ? nameEl.textContent : "").trim();
                const k = getMediaKind(name);
                if (groups[k]) groups[k].push(it);
                else groups.other.push(it);
            });

            const defs = [
                { key: "video", title: "Vídeos", icon: PL_ICONS.video, list: groups.video },
                { key: "image", title: "Fotos", icon: PL_ICONS.image, list: groups.image },
                { key: "text", title: "Textos & Documentos", icon: PL_ICONS.fileText, list: groups.text },
                { key: "other", title: "Outros", icon: PL_ICONS.grid, list: groups.other }
            ];

            defs.forEach(def => {
                if (!def.list.length) return;
                const hdr = el("div", { class: "fl-album-group-header" },
                    el("div", { class: "fl-album-group-title" },
                        el("span", { html: def.icon }),
                        el("span", null, def.title)
                    ),
                    el("span", { class: "fl-album-group-count" }, `${def.list.length} ${def.list.length === 1 ? "item" : "itens"}`)
                );
                list.appendChild(hdr);
                def.list.forEach(it => {
                    const nameEl = it.querySelector(".file-name");
                    if (nameEl && !it.dataset.flTitled) {
                        it.dataset.flTitled = "1";
                        const rawName = nameEl.textContent.trim();
                        const dt = extractDateFromTitle(rawName);
                        const cleanName = cleanTitleWithoutDate(rawName, dt);
                        nameEl.textContent = cleanName;
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
                    }
                    list.appendChild(it);
                });
            });
        }

        // Decora os itens inicialmente mesmo sem agrupar
        const initItems = Array.from(list.querySelectorAll(".file-item"));
        initItems.forEach(it => {
            const nameEl = it.querySelector(".file-name");
            if (nameEl && !it.dataset.flTitled) {
                it.dataset.flTitled = "1";
                const rawName = nameEl.textContent.trim();
                const dt = extractDateFromTitle(rawName);
                const cleanName = cleanTitleWithoutDate(rawName, dt);
                nameEl.textContent = cleanName;
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
            }
        });

        if (isGalleryGrouped) setTimeout(renderGalGroups, 150);
    }
