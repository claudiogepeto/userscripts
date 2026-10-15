    /* ===================== TOPBAR BUSCA & FERRAMENTAS ===================== */
    function applyFilter(q) {
        q = (q || "").toLowerCase().trim();
        document.querySelectorAll(".gf-card").forEach(c => {
            const n = (c._gf && c._gf.name || "").toLowerCase();
            c.classList.toggle("gf-filtered", !!q && n.indexOf(q) === -1);
        });
        if (stage && stage.classList.contains("open")) renderPlaylist();
    }

    function injectFolderActions() {
        // Remove qualquer botão antigo da topbar global
        document.querySelectorAll("#app-header .gf-group-btn, #index_header .gf-group-btn").forEach(b => b.remove());

        const toolbar = document.querySelector("#fm-toolbar .flex.items-center, #fm-toolbar");
        if (!toolbar || toolbar.querySelector(".gf-group-btn")) return;

        const btn = el("button", {
            class: "gf-folder-btn gf-group-btn" + (isGroupByType ? " is-active" : ""),
            type: "button",
            title: "Agrupar arquivos por tipo (Vídeos, Fotos, etc.)",
            onClick: () => {
                groupGalleryByType(!isGroupByType, true);
                btn.classList.toggle("is-active", isGroupByType);
                const lbl = btn.querySelector("span");
                if (lbl) lbl.textContent = isGroupByType ? "Desagrupar" : "Agrupar por Tipo";
            }
        });
        btn.insertAdjacentHTML("beforeend", IC.group);
        btn.append(el("span", null, isGroupByType ? "Desagrupar" : "Agrupar por Tipo"));

        const searchBtn = toolbar.querySelector("[data-action='search'], [data-action='toggle-filter']");
        if (searchBtn) {
            toolbar.insertBefore(btn, searchBtn);
        } else {
            toolbar.appendChild(btn);
        }
    }

    function buildTopbar() {
        const header = document.getElementById("app-header") || document.getElementById("index_header");
        if (!header || header.dataset.gfTop) return;
        header.dataset.gfTop = "1";

        const brand = el("a", { class: "gf-brand", href: "https://gofile.io/" },
            el("img", { src: "https://gofile.io/assets/img/logo-small-70.png", alt: "Gofile" }),
            el("span", null, "Gofile")
        );

        const search = el("div", { class: "gf-topsearch" });
        const inp = el("input", { type: "text", placeholder: "Buscar nesta pasta…", autocomplete: "off", spellcheck: "false" });
        inp.addEventListener("input", () => applyFilter(inp.value));
        search.appendChild(inp);

        header.prepend(search);
        header.prepend(brand);
    }
