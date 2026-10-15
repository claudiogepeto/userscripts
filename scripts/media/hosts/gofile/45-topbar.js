    /* ===================== TOPBAR E BARRA DE AÇÕES DA PASTA ===================== */
    function applyFilter(q) {
        q = (q || "").toLowerCase().trim();
        document.querySelectorAll(".gf-card").forEach(c => {
            const n = (c._gf && c._gf.name || "").toLowerCase();
            c.classList.toggle("gf-filtered", !!q && n.indexOf(q) === -1);
        });
        updateFolderCount();
        if (stage && stage.classList.contains("open")) renderPlaylist();
    }

    // Barra de ações do bunkr sobre a lista da pasta: busca (/ e ?q=), fichas de ordenação,
    // Agrupar por tipo, Nomes completos, Copiar nomes/URLs, Selecionar (com a barra de download
    // em lote) e o contador.
    let folderBar = null;
    function visibleFileCards() {
        return Array.from(document.querySelectorAll(".gf-card")).filter(c => isFileCard(c) && !c.classList.contains("gf-filtered"));
    }
    function updateFolderCount() {
        if (!folderBar) return;
        const all = Array.from(document.querySelectorAll(".gf-card")).filter(isFileCard).length;
        const shown = visibleFileCards().length;
        folderBar.setCount(shown === all ? `Total: ${all} arquivos` : `${shown} de ${all} arquivos`);
    }

    function injectFolderActions() {
        const list = document.getElementById("fm-list") || (galleryGrid() || {}).parentElement;
        if (!list || !list.parentNode) return;
        if (folderBar && folderBar.bar.isConnected) {
            if (folderBar.bar.nextElementSibling !== list) list.parentNode.insertBefore(folderBar.bar, list);
            updateFolderCount();
            return;
        }
        const fresh = !folderBar;
        if (fresh) {
            const sort = mediaSortChips({
                kind: "bar",
                mode: gallerySort.mode,
                dirs: { [gallerySort.mode]: gallerySort.dir },
                chips: [
                    { key: "default", label: "Padrão", title: "Ordem do gofile" },
                    { key: "upload", label: "Data de Envio", dir: true, title: "Ordenar por data de envio", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
                    { key: "title", label: "Data Extraída", dir: true, title: "Ordenar por data extraída do nome do arquivo", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
                    { key: "name", label: "A-Z", dir: true, title: "Ordenar por nome alfabético", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="8" y2="18"/></svg>' },
                    { key: "size", label: "Tamanho", dir: true, title: "Ordenar por tamanho de arquivo", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>' }
                ],
                onChange: setGallerySort
            });
            const selectBtn = el("button", { type: "button", class: "gf-act-btn", title: "Selecionar arquivos para baixar em lote" });
            selectBtn.insertAdjacentHTML("beforeend", IC.check);
            selectBtn.append(el("span", { class: "label" }, "Selecionar"));
            selectBtn.addEventListener("click", () => {
                setSelectMode(!selectMode);
                selectBtn.classList.toggle("is-active", selectMode);
                selectBtn.querySelector(".label").textContent = selectMode ? "Cancelar seleção" : "Selecionar";
            });
            folderBar = buildActionBar({
                sort,
                grouped: isGroupByType,
                onGroup: on => groupGalleryByType(on, true),
                onFullNames: on => document.documentElement.classList.toggle("gf-full-names", on),
                names: () => visibleFileCards().map(c => c._gf.name),
                urls: () => visibleFileCards().map(c => resolveDirectGofileUrl(c._gf)).filter(Boolean),
                onSearch: applyFilter,
                extra: [selectBtn]
            });
        }
        list.parentNode.insertBefore(folderBar.bar, list);
        // A busca vem do ?q= da rota (outra pasta, voltar/avançar).
        const q = mediaGetQ();
        if (fresh ? q : folderBar.input.value.trim() !== q) {
            folderBar.input.value = q;
            folderBar.input.parentNode.classList.toggle("has-text", !!q);
            applyFilter(q);
        }
        updateFolderCount();
    }

    function buildTopbar() {
        const header = document.getElementById("app-header") || document.getElementById("index_header");
        if (!header || header.dataset.gfTop) return;
        header.dataset.gfTop = "1";

        const brand = el("a", { class: "gf-brand", href: "https://gofile.io/" },
            el("img", { src: "https://gofile.io/assets/img/logo-small-70.png", alt: "Gofile" }),
            el("span", null, "Gofile")
        );
        header.prepend(brand);
    }
