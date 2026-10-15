    /* ==================================================================== * (6) UI: TOPBAR, VROW E NAVEGAÇÃO */
    function tbtn(ic, label, title, onClick, extra) {
        return el("button", { class: "pdx-item" + (extra ? " " + extra : ""), title: title || label, onClick }, icon(ic), label ? el("span", null, label) : null);
    }
    const vsep = () => el("div", { class: "pdx-vsep" });
    const statCell = (label, cls = "") => el("div", { class: "pdx-stat " + cls }, el("span", { class: "pdx-k" }, label), el("b", { class: "pdx-statv" }, "—"));

    function buildGlobalTopbar(fv) {
        if (fv.querySelector(":scope > .pdx-gtop")) return;
        const uname = (document.querySelector(".button_username") || {}).textContent;
        const gtop = el("div", { class: "pdx-gtop" },
            el("a", { class: "pdx-logo", href: "/", title: "Pixeldrain" }, el("img", { src: "/res/img/pixeldrain_32.png", alt: "pd" })),
            ...SITE_LINKS.map(l => el("a", { class: "pdx-glink", href: l.href, title: l.label }, icon(l.icon), el("span", null, l.label))),
            el("div", { class: "pdx-spacer" }),
            el("a", { class: "pdx-account", href: "/user", title: "Dashboard / Minha conta" }, icon("account_circle"), el("span", null, (uname || "Conta").trim() || "Conta")),
            el("a", { class: "pdx-glink pdx-icononly", href: "/user/settings", title: "Configurações da conta" }, icon("settings"))
        );
        fv.insertBefore(gtop, fv.firstChild);
    }

    function buildGalbar(fv) {
        let bar = fv.querySelector(":scope > .pdx-galbar");
        if (bar) return;
        const al = albumInfo(); if (!al) return;
        const links = () => al.files.map(x => M().dl(x.id)).join("\n") + "\n";
        const stop = e => e.stopPropagation();

        bar = el("div", { class: "pdx-galbar" });

        const topRow = el("div", { class: "pdx-galbar-top" });
        const logoLink = el("a", { class: "pdx-logo-link", href: "/", title: "Pixeldrain" },
            el("img", { src: "/res/img/pixeldrain_32.png", alt: "pd" }),
            el("span", { class: "pdx-logo-title" }, "Pixeldrain")
        );
        const titleEl = el("div", { class: "pdx-galtitle" }, (al.title || "Álbum") + " · " + al.files.length + " arquivos");
        topRow.append(logoLink, titleEl);

        const actsRow = el("div", { class: "pdx-galbar-actions" });
        const searchLabel = el("label", { class: "pdx-search" }, icon("search"));
        const searchInput = el("input", {
            class: "pdx-search-in",
            type: "search",
            placeholder: "Filtrar arquivos...",
            value: state.filter,
            "aria-label": "Filtrar arquivos",
            onInput: debounce(e => applyGalleryFilter(e.target.value), 140),
            onKeydown: stop, onKeyup: stop, onKeypress: stop
        });
        searchLabel.appendChild(searchInput);

        const sortWrap = el("div", { class: "pdx-gal-sort" });
        [
            { key: "default", label: "Original" },
            { key: "date", label: "Data" },
            { key: "name", label: "A–Z" },
            { key: "size", label: "Tamanho" }
        ].forEach(s => {
            const b = el("button", {
                type: "button",
                class: "pdx-gal-chip" + (gallerySort === s.key ? " is-active" : ""),
                onClick: () => {
                    if (gallerySort === s.key && s.key !== "default") {
                        gallerySortDir = gallerySortDir === "desc" ? "asc" : "desc";
                    } else {
                        gallerySort = s.key;
                        gallerySortDir = s.key === "name" ? "asc" : "desc";
                    }
                    prefs.gallerySort = gallerySort;
                    prefs.gallerySortDir = gallerySortDir;
                    saveP();
                    sortWrap.querySelectorAll(".pdx-gal-chip").forEach(c => {
                        c.classList.toggle("is-active", c.dataset.sort === gallerySort);
                        const dir = c.querySelector(".pdx-gal-dir");
                        if (dir) dir.remove();
                    });
                    const active = sortWrap.querySelector(".pdx-gal-chip.is-active");
                    if (active && gallerySort !== "default") {
                        active.append(el("span", { class: "pdx-gal-dir" }, gallerySortDir === "desc" ? "↓" : "↑"));
                    }
                    renderGalleryGroups();
                }
            }, s.label);
            b.dataset.sort = s.key;
            if (gallerySort === s.key && s.key !== "default") {
                b.append(el("span", { class: "pdx-gal-dir" }, gallerySortDir === "desc" ? "↓" : "↑"));
            }
            sortWrap.append(b);
        });

        const groupToggle = el("button", {
            type: "button",
            class: "pdx-item pdx-gal-group-btn" + (isGalleryGrouped ? " is-active" : ""),
            title: "Agrupar arquivos por tipo de mídia (Vídeos, Fotos, etc.)",
            onClick: () => {
                isGalleryGrouped = !isGalleryGrouped;
                prefs.groupByType = isGalleryGrouped;
                saveP();
                groupToggle.classList.toggle("is-active", isGalleryGrouped);
                const txt = groupToggle.querySelector("span");
                if (txt) txt.textContent = isGalleryGrouped ? "Desagrupar" : "Agrupar por Tipo";
                renderGalleryGroups();
            }
        });
        groupToggle.innerHTML = `${PL_ICONS.playlist} <span>${isGalleryGrouped ? "Desagrupar" : "Agrupar por Tipo"}</span>`;

        actsRow.append(
            searchLabel,
            sortWrap,
            groupToggle,
            el("div", { class: "pdx-spacer" }),
            tbtn("folder_zip", "Baixar tudo (.zip)", "Baixar o álbum inteiro via mirror", () => window.open(M().zip(al.lid), "_blank")),
            tbtn("content_copy", "Copiar todos", al.files.length + " links — cola no gerenciador", () => copyText(links()).then(() => toast(al.files.length + " links copiados"))),
            tbtn("description", "Exportar .txt", "Lista aria2 -i", () => { downloadText((al.lid || "album") + ".txt", links()); toast("Lista exportada"); })
        );

        bar.append(topRow, actsRow);
        fv.insertBefore(bar, fv.firstChild);
    }

    function applyGalleryFilter(q) {
        state.filter = (q || "").trim().toLowerCase();
        try {
            const u = new URL(location.href);
            if (state.filter) u.searchParams.set("q", state.filter); else u.searchParams.delete("q");
            history.replaceState(history.state, "", u.pathname + u.search + u.hash);
        } catch {}

        const cards = document.querySelectorAll(".file_viewer .gallery > .file, .file_preview .gallery > .file");
        let shown = 0;
        cards.forEach(c => {
            const name = (c.dataset.pdxName || c.textContent || "").trim().toLowerCase();
            const vis = !state.filter || name.indexOf(state.filter) !== -1;
            c.style.display = vis ? "" : "none";
            if (vis) shown++;
        });

        const al = albumInfo();
        const t = document.querySelector(".pdx-galtitle");
        if (t && al) {
            t.textContent = (al.title || "Álbum") + " · " + (state.filter ? `${shown} de ${cards.length}` : `${cards.length} arquivos`);
        }
    }

    /* TOPBAR DO MODO CONTEÚDO (1 ROW NO DESKTOP ESTILO BUNKR) */
    function buildVideoRowOnce(vrow) {
        const al = albumInfo();
        const multi = !!(al && al.files.length > 1);

        // Lado Esquerdo: Galeria, Logo e Nome do arquivo
        const topRow = el("div", { class: "pdx-vrow-top" });
        const logoLink = el("a", { class: "pdx-logo-link", href: "/", title: "Pixeldrain" },
            el("img", { src: "/res/img/pixeldrain_32.png", alt: "pd" }),
            el("span", { class: "pdx-logo-title" }, "Pixeldrain")
        );
        const nameEl = el("div", { class: "pdx-name", title: "" }, icon("movie"), el("span"));
        topRow.append(logoLink, vsep(), nameEl);

        // Lado Direito: Stats, Mirror e Playlist Toggle (só quando fechada)
        const actsRow = el("div", { class: "pdx-vrow-actions" });
        const statsEl = el("div", { class: "pdx-stats" }, statCell("Views"), statCell("Downloads"), statCell("Tamanho"));

        let plBtn = null;
        if (multi) {
            plBtn = el("button", {
                type: "button",
                class: "pdx-item pdx-vrow-playlist",
                style: { display: isSidebarCollapsed ? "inline-flex" : "none" },
                title: "Abrir playlist (p)",
                onClick: () => toggleSidebar()
            });
            plBtn.innerHTML = `${PL_ICONS.playlist} <span>Playlist</span> <span class="pdx-pl-count-badge">${al.files.length}</span>`;
        }

        actsRow.append(
            statsEl,
            vsep(),
            buildMirrorChip()
        );
        if (plBtn) {
            actsRow.append(vsep(), plBtn);
        }

        vrow.append(topRow, el("div", { class: "pdx-spacer" }), actsRow);
    }

    function updateVideoRow(vrow, f) {
        state.file = f;
        if (vrow.dataset.fid === String(f.id)) return;
        vrow.dataset.fid = String(f.id);

        const nameEl = vrow.querySelector(".pdx-name");
        if (nameEl) {
            const displayTitle = f.displayTitle || f.name;
            nameEl.title = f.name;
            const ic = nameEl.querySelector(".icon");
            if (ic) ic.textContent = isVideoFile(f) ? "movie" : isImageFile(f) ? "image" : "draft";
            const sp = nameEl.querySelector("span");
            if (sp) sp.textContent = displayTitle;
        }

        const sv = vrow.querySelectorAll(".pdx-statv");
        if (sv[0]) sv[0].textContent = String(f.views ?? "—");
        if (sv[1]) sv[1].textContent = String(f.downloads ?? "—");
        if (sv[2]) sv[2].textContent = f.size ? fmtSize(f.size) : "—";

        // Sincroniza estado visual do botão de playlist (só visível se sidebar fechada)
        const plBtn = vrow.querySelector(".pdx-vrow-playlist");
        if (plBtn) plBtn.style.display = isSidebarCollapsed ? "inline-flex" : "none";
    }

    function navItem(d) {
        const a = albumInfo();
        if (!a || !a.files.length) return;
        const curIdx = currentIndex();
        const nextIdx = ((curIdx + d) % a.files.length + a.files.length) % a.files.length;
        writePosition(nextIdx + 1);
        location.hash = "#item=" + nextIdx;
    }

    /* Lista com UM arquivo: sai da galeria e abre o item direto no player. location.replace troca só o hash
       (sem entrada nova no histórico) e roda 1× por lista por aba, então voltar à galeria (#gallery / voltar) não
       re-abre → sem loop. Com 1 arquivo setupSidebar já não monta a sidebar, e prefs.sidebarCollapsed não é tocado. */
    const SINGLE_DONE_KEY = "pdx_single_done:";
    let singleTried = false;
    function openSingleItemList() {
        if (singleTried) return false;
        if (location.hash.replace(/^#/, "") === "gallery") { singleTried = true; return false; }
        const al = albumInfo();
        if (!al) return false;   // viewer_data ainda não chegou
        singleTried = true;
        if (al.files.length !== 1) return false;
        try { const nav = performance.getEntriesByType("navigation")[0]; if (nav && nav.type === "back_forward") return false; } catch {}
        const key = SINGLE_DONE_KEY + (al.lid || location.pathname);
        try { if (sessionStorage.getItem(key)) return false; sessionStorage.setItem(key, "1"); } catch {}
        location.replace(location.pathname + location.search + "#item=0");
        return true;
    }
