    /* ===================== MULTISELECT: BARRA FLUTUANTE ===================== */
    let bulkBar, bulkCount;
    function selectedCards() {
        return Array.from(document.querySelectorAll(".gf-card.is-selected"));
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
        const clear = vbtn(IC.close, "Limpar", { onClick: () => {
            selectedCards().forEach(c => {
                c.classList.remove("is-selected");
                const sel = c.querySelector(".gf-card-select");
                if (sel) sel.classList.remove("is-selected");
            });
            updateBulk();
        }});
        bulkBar.append(bulkCount, el("div", { class: "gf-spacer" }), dl, clear);
        (document.body || document.documentElement).appendChild(bulkBar);
    }
    function updateBulk() {
        ensureBulkBar();
        const n = selectedCards().length;
        bulkCount.textContent = n + (n === 1 ? " selecionado" : " selecionados");
        bulkBar.classList.toggle("open", n > 0);
    }
