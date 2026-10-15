    /* ===================== CORE: STAGE, SIDEBAR E ACTION BAR DO BUNKR (scripts/media/core/stage.js) ===================== */
    // Fichas de ordenação (as do bunkr). spec = { kind: "sidebar" | "bar", label, chips: [{ key, label, dir, title }],
    // mode, dirs: { key: "desc"|"asc" }, onChange(mode, dir) }. Ficha com dir alterna ⬇/⬆ ao clicar de novo.
    // Hosts sem data de envio simplesmente não passam a ficha "upload".
    function mediaSortChips(spec) {
        const P = MEDIA_PREFIX, side = spec.kind === "sidebar";
        const wrap = el("div", { class: side ? `${P}-sidebar-sort` : `${P}-actionbar-chips` });
        wrap.append(el("span", { class: side ? `${P}-sidebar-sort-label` : `${P}-actionbar-label` }, spec.label || (side ? "Ordem:" : "Ordenar:")));
        const state = { mode: spec.mode || "default", dirs: Object.assign({}, spec.dirs || {}) };
        const btns = spec.chips.map(c => {
            const b = el("button", { type: "button", class: side ? `${P}-sb-chip` : `${P}-chip`, title: c.title || c.label });
            b.dataset.sort = c.key;
            if (!side && c.icon) b.insertAdjacentHTML("beforeend", c.icon);
            b.append(el("span", null, c.label));
            if (c.dir) b.append(el("span", { class: side ? `${P}-sb-dir` : `${P}-sort-direction` }, ""));
            b.addEventListener("click", () => {
                if (c.dir && state.mode === c.key) state.dirs[c.key] = state.dirs[c.key] === "asc" ? "desc" : "asc";
                state.mode = c.key;
                if (c.dir && !state.dirs[c.key]) state.dirs[c.key] = c.key === "name" ? "asc" : "desc";
                sync();
                spec.onChange(state.mode, state.dirs[state.mode] || "asc", state);
            });
            return b;
        });
        const sync = () => btns.forEach(b => {
            const k = b.dataset.sort;
            b.classList.toggle("is-active", k === state.mode);
            const d = b.querySelector(side ? `.${P}-sb-dir` : `.${P}-sort-direction`);
            if (d) d.textContent = (state.dirs[k] || "desc") === "desc" ? "⬇" : "⬆";
        });
        wrap.append(...btns);
        sync();
        wrap._state = state;
        return wrap;
    }

    // Ordenação comum às fichas. acc = { name(it), upload(it) → ms, size(it), views(it) }.
    // "title" = data extraída do nome; sem data vai para o fim nas duas direções.
    function mediaSortItems(items, mode, dir, acc) {
        if (!items || mode === "default" || !mode) return items;
        const sgn = dir === "asc" ? 1 : -1;
        const list = items.slice();
        const nameOf = it => String(acc.name(it) || "");
        if (mode === "name") {
            const key = it => { const n = nameOf(it); return cleanTitleWithoutDate(n, extractDateFromTitle(n), true); };
            list.sort((a, b) => key(a).localeCompare(key(b), undefined, { numeric: true, sensitivity: "base" }) * (dir === "desc" ? -1 : 1));
        } else if (mode === "title") {
            const ts = it => { const d = extractDateFromTitle(nameOf(it)); return d ? d.timestamp : null; };
            list.sort((a, b) => { const x = ts(a), y = ts(b); if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return (x - y) * sgn; });
        } else if (acc[mode]) {
            list.sort((a, b) => ((+acc[mode](a) || 0) - (+acc[mode](b) || 0)) * sgn);
        }
        return list;
    }

    // Stage do bunkr: topbar (logo, nome, stats, extras, botão Playlist), mídia com setas laterais e a
    // sidebar recolhível (cabeçalho com Galeria/fechar, busca ligada ao ?q=, abas de tipo e fichas).
    // o = { kind: "video"|"image"|"text", name, stats: [texto], logo: Element, vrowExtra: [Element], nav(dir),
    //       collapsed, galleryHref, sidebarTitle, tabs: Element|null, sort: Element|null, onSearch(q) }
    function buildMediaStage(o) {
        const P = MEDIA_PREFIX;
        const icons = MEDIA_ICONS;
        const stage = el("div", { class: `${P}-stage is-${o.kind || "video"}` + (o.collapsed ? " is-sidebar-collapsed" : "") });
        const main = el("div", { class: `${P}-stage-main` });

        const vrow = el("div", { class: `${P}-vrow` });
        const vtop = el("div", { class: `${P}-vrow-top` });
        if (o.logo) vtop.append(o.logo, el("div", { class: "b-vsep" }));
        const nameEl = el("div", { class: "b-name", title: o.name || "" });
        nameEl.insertAdjacentHTML("beforeend", o.kind === "image" ? icons.image : o.kind === "text" ? icons.doc : icons.video);
        nameEl.append(el("span", null, o.name || ""));
        vtop.append(nameEl);

        const vsub = el("div", { class: `${P}-vrow-sub` });
        const stats = el("div", { class: `${P}-stats` });
        (o.stats || []).filter(Boolean).forEach((s, i) => stats.append(el("span", { class: `${P}-stat` + (i === 0 ? ` ${P}-stat-size` : "") }, s)));
        vsub.append(stats);
        if (o.vrowExtra && o.vrowExtra.length) vsub.append(el("div", { class: "b-vsep" }), ...o.vrowExtra);
        vsub.append(el("div", { class: "b-spacer" }));
        const plBtn = el("button", {
            type: "button", class: `${P}-item ${P}-vrow-playlist`, title: "Abrir playlist do álbum (p)",
            onClick: () => {
                const sb = stage.querySelector(`.${P}-sidebar`);
                if (window.innerWidth <= 768 && sb) sb.scrollIntoView({ behavior: "smooth" });
                else toggleSidebar(false);
            }
        });
        plBtn.insertAdjacentHTML("beforeend", icons.playlist);
        plBtn.append(el("span", null, "Playlist"));
        vsub.append(plBtn);
        vrow.append(vtop, vsub);

        const mid = el("div", { class: `${P}-stage-mid` });
        const navPrev = el("button", { class: `${P}-nav-side ${P}-nav-prev`, title: "Anterior no álbum (Shift+P)", "aria-label": "Anterior", onClick: e => { e.stopPropagation(); o.nav(-1); } });
        navPrev.insertAdjacentHTML("beforeend", icons.chevL);
        const navNext = el("button", { class: `${P}-nav-side ${P}-nav-next`, title: "Próximo no álbum (Shift+N)", "aria-label": "Próximo", onClick: e => { e.stopPropagation(); o.nav(1); } });
        navNext.insertAdjacentHTML("beforeend", icons.chevR);
        mid.append(navPrev, navNext);
        main.append(vrow, mid);

        const sidebar = el("aside", { class: `${P}-sidebar` });
        const head = el("div", { class: `${P}-sidebar-header` });
        const title = el("div", { class: `${P}-sidebar-title` });
        title.insertAdjacentHTML("beforeend", icons.playlist);
        const count = el("span", { class: `${P}-sidebar-count` }, "");
        title.append(el("span", null, o.sidebarTitle || "Arquivos do álbum"), count);
        const actions = el("div", { class: `${P}-sidebar-actions` });
        const gal = el("a", { class: `${P}-sidebar-gallery-btn`, href: o.galleryHref || "#", title: "Ver galeria completa do álbum" });
        gal.insertAdjacentHTML("beforeend", icons.grid);
        gal.append(el("span", null, "Galeria"));
        if (!o.galleryHref) gal.style.display = "none";
        const close = el("button", { type: "button", class: `${P}-sidebar-btn ${P}-sidebar-close`, title: "Recolher playlist (p)", "aria-label": "Recolher playlist", onClick: () => toggleSidebar(true) });
        close.insertAdjacentHTML("beforeend", icons.close);
        actions.append(gal, close);
        head.append(title, actions);

        const search = el("div", { class: `${P}-sidebar-search` });
        const input = el("input", { type: "text", placeholder: "Filtrar no álbum…", value: mediaGetQ(), "aria-label": "Filtrar arquivos no álbum" });
        input.addEventListener("keydown", e => e.stopPropagation());
        let t;
        input.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { mediaSetQ(input.value.trim()); if (o.onSearch) o.onSearch(input.value.trim()); }, 180); });
        search.append(input);
        if (o.tabs) search.append(o.tabs);
        if (o.sort) search.append(o.sort);

        const list = el("div", { class: `${P}-playlist-list` });
        sidebar.append(head, search, list);
        stage.append(main, sidebar);
        return { stage, main, mid, sidebar, list, count, input, gallery: gal };
    }

    // Abas de tipo (Todos/Vídeos/Fotos/Textos) no mesmo visual das fichas; aba sem itens some.
    // spec = { active, onChange(key) }. Devolve o elemento; .update(counts) atualiza números e visibilidade.
    function mediaTypeTabs(spec) {
        const P = MEDIA_PREFIX;
        const wrap = el("div", { class: `${P}-sidebar-sort ${P}-sidebar-tabs` });
        wrap.append(el("span", { class: `${P}-sidebar-sort-label` }, "Tipo:"));
        const defs = [["all", "Todos"], ["video", "Vídeos"], ["image", "Fotos"], ["text", "Textos"]];
        let active = spec.active || "all";
        const btns = defs.map(([key, label]) => {
            const b = el("button", { type: "button", class: `${P}-sb-chip` + (key === active ? " is-active" : "") }, el("span", null, label), el("span", { class: `${P}-sb-dir` }, ""));
            b.dataset.tab = key;
            b.addEventListener("click", () => { active = key; btns.forEach(x => x.classList.toggle("is-active", x === b)); spec.onChange(key); });
            return b;
        });
        wrap.append(...btns);
        wrap.update = counts => btns.forEach(b => {
            const n = counts[b.dataset.tab] || 0;
            b.lastChild.textContent = String(n);
            b.style.display = b.dataset.tab !== "all" && !n ? "none" : "";
        });
        return wrap;
    }

    function mediaGetQ() { try { return (new URLSearchParams(location.search).get("q") || "").trim(); } catch { return ""; } }
    function mediaSetQ(q) {
        try {
            const u = new URL(location.href);
            if (q) u.searchParams.set("q", q); else u.searchParams.delete("q");
            history.replaceState(history.state, "", u.pathname + u.search + u.hash);
        } catch {}
    }

    // Action bar do álbum (a do bunkr): busca com atalho "/" ligada ao ?q=, fichas de ordenação,
    // Agrupar por tipo, Nomes completos, Copiar nomes, Copiar URLs, ações do host e contador.
    // o = { sort: Element (mediaSortChips kind "bar"), grouped, onGroup(on), onFullNames(on), names() → [],
    //       urls() → [], onSearch(q), extra: [Element] }. Devolve { bar, input, setCount(texto) }.
    function buildActionBar(o) {
        const P = MEDIA_PREFIX;
        const icons = MEDIA_ICONS;
        const bar = el("div", { class: `${P}-gallery-actionbar` });
        const searchWrap = el("div", { class: `${P}-actionbar-search` });
        searchWrap.innerHTML = `<svg class="${P}-actionbar-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`;
        const input = el("input", { type: "text", placeholder: "Buscar nos arquivos… (atalho /)", autocomplete: "off", value: mediaGetQ() });
        const clear = el("button", { type: "button", class: `${P}-actionbar-search-clear`, title: "Limpar busca" }, "×");
        searchWrap.append(input, clear);
        const syncSearch = () => {
            const q = input.value.trim();
            searchWrap.classList.toggle("has-text", !!q);
            mediaSetQ(q);
            if (o.onSearch) o.onSearch(q);
        };
        input.addEventListener("input", debounce(syncSearch, 150));
        clear.addEventListener("click", () => { input.value = ""; syncSearch(); input.focus(); });
        searchWrap.classList.toggle("has-text", !!input.value);
        document.addEventListener("keydown", e => {
            if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
            const t = e.target;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
            e.preventDefault();
            input.focus();
        });

        const mkBtn = (icon, label, title, onClick) => {
            const b = el("button", { type: "button", class: `${P}-act-btn`, title });
            b.insertAdjacentHTML("beforeend", icon);
            b.append(el("span", { class: "label" }, label));
            b.addEventListener("click", () => onClick(b));
            return b;
        };
        let grouped = !!o.grouped, full = false;
        const groupBtn = mkBtn(icons.group, grouped ? "Desagrupar" : "Agrupar por Tipo", "Agrupar arquivos por tipo (Vídeos, Fotos, Textos, Outros)", b => {
            grouped = !grouped;
            b.classList.toggle("is-active", grouped);
            b.querySelector(".label").textContent = grouped ? "Desagrupar" : "Agrupar por Tipo";
            o.onGroup(grouped);
        });
        groupBtn.classList.toggle("is-active", grouped);
        const namesBtn = mkBtn('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>', "Nomes Completos", "Alternar nome completo/truncado", b => {
            full = !full;
            b.classList.toggle("is-active", full);
            b.querySelector(".label").textContent = full ? "Nomes Truncados" : "Nomes Completos";
            o.onFullNames(full);
        });
        const copy = (list, what) => {
            if (!list.length) { toast("Nada para copiar"); return; }
            copyText(list.join("\n")).then(ok => toast(ok ? `${list.length} ${what} copiados!` : "Falha ao copiar"));
        };
        const namesCopy = mkBtn(icons.copy, "Copiar Nomes", "Copiar nomes dos arquivos visíveis", () => copy(o.names(), "nomes"));
        const urlsCopy = mkBtn('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>', "Copiar URLs", "Copiar URLs dos arquivos visíveis", () => copy(o.urls(), "URLs"));
        const countEl = el("span", { class: `${P}-actionbar-count` }, "");
        const actions = el("div", { class: `${P}-actionbar-actions` }, groupBtn, namesBtn, namesCopy, urlsCopy, ...(o.extra || []), countEl);
        bar.append(searchWrap, el("div", { class: `${P}-actionbar-divider` }), o.sort, el("div", { class: `${P}-actionbar-divider` }), actions);
        return { bar, input, setCount: s => { countEl.textContent = s; } };
    }
