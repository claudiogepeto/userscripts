    /* ==================================================================== * REVISÃO DO MIRROR: GERENCIADOR E NOTIFICAÇÕES */
    function showMirrorWarn(msg, autoCloseMs = 4500) {
        let w = document.querySelector(".pdx-mirror-warn");
        if (!w) {
            w = el("div", { class: "pdx-mirror-warn" });
            document.body.appendChild(w);
        }
        w.innerHTML = `<span class="pdx-mirror-warn-t">${msg}</span>`;
        const btn = el("button", { class: "pdx-mirror-warn-x", title: "Fechar", onClick: () => w.classList.remove("show") });
        btn.innerHTML = PL_ICONS.close;
        w.appendChild(btn);
        w.classList.add("show");
        clearTimeout(w._t);
        if (autoCloseMs) w._t = setTimeout(() => w.classList.remove("show"), autoCloseMs);
    }

    function applyMirror(media) {
        if (!cur || cur.media !== media) return;
        cur.fail.style.display = "none";
        const mirror = M();
        log("→ Aplicando mirror:", mirror.name, cur.id);

        if (cur.kind === "video") {
            const t = media.currentTime, paused = media.paused;
            media.src = mirror.file(cur.id);
            try { media.load(); } catch {}
            if (t > 0) {
                media.addEventListener("loadedmetadata", function once() {
                    if (cur) cur.restoring = true;
                    try {
                        media.currentTime = t;
                        if (!paused) media.play().catch(() => {});
                    } catch {}
                    media.addEventListener("seeked", () => { if (cur) cur.restoring = false; }, { once: true });
                }, { once: true });
            }
        } else if (cur.kind === "image") {
            media.src = mirror.file(cur.id);
        } else if (cur.kind === "text") {
            loadTextContent(cur.host, cur.file);
        }

        armWatchdog();
        refreshChips();
        setMirrorLoading(true);
    }

    function armWatchdog() {
        if (!cur) return;
        clearTimeout(cur.watchdog);
        cur.alive = false;
        cur.watchdog = setTimeout(() => {
            if (cur && !cur.alive) {
                log("Watchdog disparou para", M().name);
                nextMirror("Tempo limite excedido");
            }
        }, WATCHDOG_MS);
    }

    function nextMirror(reason = "Erro no carregamento") {
        if (!cur) return;
        const oldName = M().name;
        if (gIdx < MIRRORS.length - 1) {
            gIdx++;
            showMirrorWarn(`${reason} em ${oldName}. Alternando para mirror: <b>${M().name}</b>`);
            applyMirror(cur.media);
        } else {
            clearTimeout(cur.watchdog);
            cur.fail.style.display = "flex";
            setMirrorLoading(false);
            showMirrorWarn("Todos os mirrors falharam para este arquivo.", 6000);
        }
    }

    function pickMirror(i) {
        prefIdx = gIdx = ((i % MIRRORS.length) + MIRRORS.length) % MIRRORS.length;
        if (cur) applyMirror(cur.media);
        refreshChips();
        toast("Mirror: " + M().name);
    }

    function promptCustomWorker() {
        const curW = localStorage.getItem("pdx_worker") || "";
        const val = prompt("URL do seu Cloudflare Worker pessoal (ex: https://meu-worker.usuario.workers.dev):", curW);
        if (val !== null) {
            const clean = val.trim().replace(/\/+$/, "");
            if (clean) localStorage.setItem("pdx_worker", clean);
            else localStorage.removeItem("pdx_worker");
            rebuildMirrors();
            refreshChips();
            toast(clean ? "Worker configurado!" : "Worker removido.");
            if (cur) applyMirror(cur.media);
        }
    }

    function refreshChips() {
        document.querySelectorAll(".pdx-mirror-name").forEach(m => { m.textContent = "Mirror"; });
        document.querySelectorAll(".pdx-player-mirror-name").forEach(m => { m.textContent = "Mirror"; });
    }
    function setMirrorLoading(on) {
        document.querySelectorAll(".pdx-mirror, .pdx-player-mirror-btn").forEach(c => c.classList.toggle("pdx-loading", !!on));
    }

    /* DROPDOWN DE MIRROR MODERNO (estilo Bunkr) */
    let mirrorCloser = null;
    function closeMirrorMenu() {
        document.querySelectorAll(".pdx-mirror-wrap, .pdx-player-mirror").forEach(w => w.classList.remove("is-open"));
        document.querySelectorAll(".pdx-mirror-menu").forEach(m => { m.hidden = true; });
        if (mirrorCloser) { document.removeEventListener("pointerdown", mirrorCloser, true); mirrorCloser = null; }
    }

    function openMirrorMenu(wrap, alignRight = false) {
        const btn = wrap.querySelector(".pdx-mirror, .pdx-player-mirror-btn");
        const menu = wrap.querySelector(".pdx-mirror-menu");
        if (!btn || !menu) return;
        menu.textContent = "";

        const head = el("div", { class: "pdx-mirror-menu-h" });
        head.innerHTML = `Mirrors disponíveis · <b>${M().name}</b>`;
        menu.appendChild(head);

        const grid = el("div", { class: "pdx-mirror-grid" });
        MIRRORS.forEach((mir, i) => {
            const isCur = i === gIdx;
            const item = el("button", {
                type: "button",
                class: "pdx-mirror-grid-item" + (isCur ? " is-current" : ""),
                title: mir.name,
                onClick: e => { e.stopPropagation(); pickMirror(i); closeMirrorMenu(); }
            });
            item.innerHTML = `<span class="pdx-mirror-item-icon">${isCur ? PL_ICONS.check : PL_ICONS.mirror}</span><span class="pdx-mirror-item-title">${mir.name}</span>`;
            grid.appendChild(item);
        });
        menu.appendChild(grid);

        // Ações extras
        const actions = el("div", { class: "pdx-mirror-actions" });
        const nextBtn = el("button", {
            type: "button",
            class: "pdx-mirror-action-btn",
            onClick: e => { e.stopPropagation(); nextMirror("Troca manual"); closeMirrorMenu(); }
        });
        nextBtn.innerHTML = `${PL_ICONS.chevR} <span>Próximo mirror (failover)</span>`;

        const workerBtn = el("button", {
            type: "button",
            class: "pdx-mirror-action-btn",
            onClick: e => { e.stopPropagation(); closeMirrorMenu(); promptCustomWorker(); }
        });
        workerBtn.innerHTML = `<i>⚙</i> <span>Configurar Worker Cloudflare...</span>`;
        actions.append(nextBtn, workerBtn);
        menu.appendChild(actions);

        menu.hidden = false;
        wrap.classList.add("is-open");

        const r = btn.getBoundingClientRect();
        menu.style.minWidth = "280px";
        if (alignRight) {
            menu.style.right = (window.innerWidth - r.right) + "px";
            menu.style.left = "auto";
        } else {
            menu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 300)) + "px";
            menu.style.right = "auto";
        }
        const mh = menu.offsetHeight || 260;
        menu.style.top = ((r.bottom + 6 + mh > window.innerHeight) ? Math.max(8, r.top - 6 - mh) : r.bottom + 6) + "px";

        mirrorCloser = ev => { if (!wrap.contains(ev.target)) closeMirrorMenu(); };
        document.addEventListener("pointerdown", mirrorCloser, true);
    }

    function toggleMirrorMenu(wrap, alignRight = false) {
        const m = wrap.querySelector(".pdx-mirror-menu");
        if (m && m.hidden) openMirrorMenu(wrap, alignRight); else closeMirrorMenu();
    }

    function buildMirrorChip() {
        const chev = icon("expand_more"); chev.classList.add("pdx-mirror-chev");
        const wrap = el("div", { class: "pdx-mirror-wrap" });
        const btn = el("button", {
            type: "button",
            class: "pdx-item pdx-mirror",
            title: "Mirror atual (origem do stream) — clique para escolher ou configurar",
            onClick: e => { e.stopPropagation(); toggleMirrorMenu(wrap, false); }
        },
            el("span", { class: "pdx-mirror-spin", "aria-hidden": "true" }),
            icon("dns"),
            el("span", { class: "pdx-mirror-name" }, "Mirror"),
            chev
        );
        wrap.append(btn, el("div", { class: "pdx-mirror-menu", hidden: "" }));
        return wrap;
    }

    function buildPlayerMirrorWidget() {
        const wrap = el("div", { class: "pdx-player-mirror" });
        const btn = el("button", {
            type: "button",
            class: "pdx-player-mirror-btn",
            title: "Trocar de mirror (Cloudflare / Oficial)",
            onClick: e => { e.stopPropagation(); toggleMirrorMenu(wrap, true); }
        });
        btn.innerHTML = `<span class="pdx-mirror-spin" aria-hidden="true"></span>${PL_ICONS.mirror}<span class="pdx-player-mirror-name">Mirror</span>`;
        const menu = el("div", { class: "pdx-mirror-menu", hidden: "" });
        wrap.append(btn, menu);
        return wrap;
    }
