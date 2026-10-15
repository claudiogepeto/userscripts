    /* ==================================================================== * (3) VISUALIZADOR DE TEXTO INTEGRADO (.txt, .md, .nfo) */
    function loadTextContent(host, file) {
        const textPre = host.querySelector(".pdx-txt-body");
        const statLines = host.querySelector(".pdx-txt-stat-lines");
        const statChars = host.querySelector(".pdx-txt-stat-chars");
        if (!textPre) return;
        textPre.textContent = "Carregando conteúdo do arquivo...";

        const url = M().file(file.id);

        const applyText = text => {
            if (!cur || cur.id !== file.id) return;
            cur.alive = true;
            clearTimeout(cur.watchdog);
            setMirrorLoading(false);
            textPre.textContent = text;
            const lines = text.split("\n").length;
            const chars = text.length;
            if (statLines) statLines.textContent = `${lines} ${lines === 1 ? "linha" : "linhas"}`;
            if (statChars) statChars.textContent = `${chars.toLocaleString()} caracteres`;
        };

        if (typeof GM_xmlhttpRequest === "function") {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                onload: res => {
                    if (res.status >= 200 && res.status < 300) {
                        applyText(res.responseText || "(Arquivo vazio)");
                    } else {
                        nextMirror(`Falha HTTP ${res.status}`);
                    }
                },
                onerror: () => nextMirror("Erro de rede ao ler texto")
            });
        } else {
            fetch(url)
                .then(r => {
                    if (!r.ok) throw new Error("HTTP " + r.status);
                    return r.text();
                })
                .then(t => applyText(t || "(Arquivo vazio)"))
                .catch(err => nextMirror(err.message || "Erro no fetch"));
        }
    }

    function mountTextViewer(f) {
        const preview = document.querySelector(".file_preview");
        if (!preview) return;
        if (cur && cur.kind === "text" && cur.id === f.id && cur.host.isConnected) { hideNative(preview); return; }
        teardownPlayer();
        hideNative(preview);
        gIdx = prefIdx;

        const ac = new AbortController();
        const host = el("div", { class: "pdx-host pdx-txt-host" });

        const header = el("div", { class: "pdx-txt-header" });
        header.innerHTML = `
            <div class="pdx-txt-title">
                <span class="pdx-txt-icon">${PL_ICONS.fileText}</span>
                <span class="pdx-txt-name">${f.name || f.id}</span>
                <span class="pdx-txt-badge">TEXTO</span>
            </div>
            <div class="pdx-txt-meta">
                <span class="pdx-txt-stat-lines">— linhas</span>
                <span class="pdx-txt-bullet">·</span>
                <span class="pdx-txt-stat-chars">— caracteres</span>
                <span class="pdx-txt-bullet">·</span>
                <span>${f.size ? fmtSize(f.size) : ""}</span>
            </div>
        `;

        const tools = el("div", { class: "pdx-txt-tools" });
        const copyBtn = el("button", { class: "pdx-item", type: "button", title: "Copiar conteúdo" });
        copyBtn.innerHTML = `${PL_ICONS.copy} <span>Copiar</span>`;
        copyBtn.addEventListener("click", () => {
            const body = host.querySelector(".pdx-txt-body");
            if (body) copyText(body.textContent).then(() => toast("Conteúdo copiado!"));
        });

        const dlBtn = el("button", { class: "pdx-item pdx-primary", type: "button", title: "Baixar arquivo" });
        dlBtn.innerHTML = `${PL_ICONS.download} <span>Download</span>`;
        dlBtn.addEventListener("click", () => window.open(M().dl(f.id), "_blank"));

        tools.append(copyBtn, dlBtn);
        header.appendChild(tools);

        const fail = el("div", { class: "pdx-fail" },
            el("div", null, "Todos os mirrors falharam para este arquivo."),
            el("div", { class: "pdx-failrow" },
                el("button", { class: "pdx-mini", onClick: () => { gIdx = prefIdx; loadTextContent(host, f); } }, "↻ Tentar de novo"),
                el("a", { class: "pdx-mini", href: "https://pixeldrain.com/api/file/" + f.id, target: "_blank", rel: "noopener" }, "Abrir no oficial")));
        fail.style.display = "none";

        const pre = el("pre", { class: "pdx-txt-body" }, "Carregando conteúdo do arquivo...");
        host.append(header, pre, fail);

        // Widget de Mirror no canto superior direito
        const playerMirror = buildPlayerMirrorWidget();
        host.appendChild(playerMirror);

        preview.appendChild(host);
        cur = { id: f.id, kind: "text", preview, host, media: host, fail, ac, alive: false, watchdog: null, file: f };
        loadTextContent(host, f);
    }
