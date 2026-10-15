    /* ===================== MULTISELECT: BARRA FLUTUANTE ===================== */
    let bulkBar, bulkCount;
    function selectedCards() {
        return Array.from(document.querySelectorAll(".gf-card.is-selected"));
    }
    // Modo seleção (botão "Selecionar" da barra): o clique no card marca em vez de abrir o stage.
    let selectMode = false;
    function setSelectMode(on) {
        selectMode = on;
        document.documentElement.classList.toggle("gf-selecting", on);
        if (!on) clearSelection();
    }
    function toggleCardSelected(card) {
        const nowSelected = !card.classList.contains("is-selected");
        card.classList.toggle("is-selected", nowSelected);
        const sel = card.querySelector(".gf-card-select");
        if (sel) sel.classList.toggle("is-selected", nowSelected);
        // O botão nativo fica dentro do card: sem a marca, o listener de captura do card trataria
        // esse clique como "abrir" (ou, no modo seleção, desmarcaria de novo).
        const nativeSel = card._gf && card._gf.selectBtn;
        if (nativeSel) {
            firingNativeClick++;
            try { nativeSel.click(); } catch (err) {} finally { firingNativeClick--; }
        }
        updateBulk();
    }
    function clearSelection() {
        selectedCards().forEach(c => {
            c.classList.remove("is-selected");
            const sel = c.querySelector(".gf-card-select");
            if (sel) sel.classList.remove("is-selected");
        });
        updateBulk();
    }
    function bulkDownload() {
        selectedCards().forEach((card, i) => {
            const b = card._gf && card._gf.downloadBtn;
            if (b) setTimeout(() => { try { b.click(); } catch (e) {} }, i * 450);
        });
    }
    function ensureBulkBar() {
        if (bulkBar) return;
        bulkBar = el("div", { class: "gf-bulk" });
        bulkCount = el("span", { class: "gf-bulk-count" }, "0 selecionados");
        const dl = vbtn(IC.download, "Baixar selecionados", { class: "gf-item is-primary", onClick: bulkDownload });
        const clear = vbtn(IC.close, "Limpar", { onClick: clearSelection });
        bulkBar.append(bulkCount, el("div", { class: "gf-spacer" }), dl, clear);
        (document.body || document.documentElement).appendChild(bulkBar);
    }
    function updateBulk() {
        ensureBulkBar();
        const n = selectedCards().length;
        bulkCount.textContent = n + (n === 1 ? " selecionado" : " selecionados");
        bulkBar.classList.toggle("open", n > 0);
    }
