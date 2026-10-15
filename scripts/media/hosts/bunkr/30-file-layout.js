    // ===== ORDEM DO YOUTUBE: o bloco do player/mídia sobe pra CIMA do <main> (título/tamanho/download). Só em arquivo. =====
    function reorder() {
        try {
            const main = document.querySelector("main.cont") || document.querySelector("main");
            if (!main || !main.parentNode) return;
            const media = document.querySelector("#video-container") || document.querySelector("#video-wrapper");
            let block = media ? media.closest(".rounded-lg") : null;
            if (!block) block = [...document.querySelectorAll(".rounded-lg")].find(b => !b.closest("header") && b.querySelector("img, video, #video-container"));   // foto: o bloco com a mídia (NÃO a nav do header, que tbm é .rounded-lg)
            if (!block || block === main || block.contains(main) || main.contains(block)) return;
            block.classList.add("bunkr-player-block");   // pega o margin-top (respiro abaixo da topbar)
            if (main.compareDocumentPosition(block) & Node.DOCUMENT_POSITION_FOLLOWING) main.parentNode.insertBefore(block, main);
        } catch (e) {}
    }

    // remove o banner vermelho de troca de domínio (é uma <div> curta com fundo vermelho / texto "balbums")
    function killBanner() {
        document.querySelectorAll("body > div").forEach(d => {
            const st = (d.getAttribute("style") || "").toLowerCase();
            if (/background:\s*(red|#f|rgb\(2)/.test(st) || (/balbums\.st|old domain|isn.?t working/i.test(d.textContent || "") && d.children.length <= 2)) d.remove();
        });
    }
