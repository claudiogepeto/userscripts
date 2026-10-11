    // =========================================================
    // HOVER preview: popover com a imagem maior ao passar o mouse na thumb (lista/grade)
    // =========================================================
    let thumbPreviewBound = false;
    function dcThumbUrl(thumb) {
        if (!thumb) return '';
        const im = thumb.tagName === 'IMG' ? thumb : thumb.querySelector('img');
        if (!im) {
            const bg = (thumb.style && thumb.style.backgroundImage) || '';
            const m = bg.match(/url\(["']?(.*?)["']?\)/i);
            const url = m ? m[1] : '';
            if (!url || url.startsWith('data:')) return '';
            return getBigUrl(url);
        }
        const bg = (im.style && im.style.backgroundImage) || '';
        const m = bg.match(/url\(["']?(.*?)["']?\)/i);
        const url = m ? m[1] : (im.getAttribute('src') || im.currentSrc || im.getAttribute('data-src') || '');
        if (!url || url.startsWith('data:')) return '';
        return getBigUrl(url); // tenta a versão maior (.md/.th → full)
    }
    function setupThumbPreview() {
        if (thumbPreviewBound) return;
        if (!window.matchMedia || !matchMedia('(hover: hover)').matches) return; // só em desktop
        thumbPreviewBound = true;

        const pop = document.createElement('div');
        pop.id = 'smg-thumb-pop';
        const img = document.createElement('img');
        pop.appendChild(img);
        document.body.appendChild(pop);

        let cur = null, timer = null;
        const place = () => {
            if (!cur) return;
            const r = cur.getBoundingClientRect();
            const pw = pop.offsetWidth || 400, ph = pop.offsetHeight || 300;
            let left = r.right + 12;
            if (left + pw > window.innerWidth - 8) left = r.left - pw - 12; // sem espaço à direita → esquerda
            if (left < 8) left = 8;
            let top = Math.max(8, Math.min(r.top + r.height / 2 - ph / 2, window.innerHeight - ph - 8));
            pop.style.left = left + 'px';
            pop.style.top = top + 'px';
        };
        const hide = () => { clearTimeout(timer); cur = null; pop.style.display = 'none'; };

        // Vale apenas no MODO LISTA e no hover estrito da IMAGEM (nunca no texto e nunca na grade)
        const PREV_SEL = '.dcThumbnail, .dtt-thread-thumbnail, .smg-watched-card-thumb, .structItem-cell--icon .avatar, .structItem-iconContainer .avatar, #smg-aldock .smg-al-icon--thumb, #smg-aldock .smg-rail-wt-thumb, .articlePreview-image';
        const HOVER_MS = 300;
        document.addEventListener('mouseover', e => {
            // Se estiver no modo grade global ou local, não dispara preview
            if (document.documentElement.classList.contains('smg-tv-grid')) return;
            // Se o mouse estiver sobre texto, títulos ou links de conteúdo, ignora
            if (e.target.closest && e.target.closest('.structItem-title, .structItem-cell--main, .smg-card-dates, .structItem-pageJump, .articlePreview-main, .articlePreview-title, .structItem-parts')) return;
            const thumb = e.target.closest && e.target.closest(PREV_SEL);
            if (!thumb || thumb === cur) return;
            if (thumb.closest && thumb.closest('.smg-tl-grid, .smg-article-grid, .is-grid')) return;
            const url = dcThumbUrl(thumb);
            if (!url) return;
            cur = thumb;
            clearTimeout(timer);
            timer = setTimeout(() => { // só mostra depois de parado sobre a thumb
                if (cur !== thumb) return;
                pop.style.display = 'none'; // esconde enquanto a nova carrega (evita flash da imagem anterior)
                const show = () => {
                    if (cur !== thumb) return; // trocou de thumb durante o carregamento → ignora
                    pop.style.display = 'block';
                    place();
                };
                img.onload = show;
                img.onerror = () => { if (cur === thumb) hide(); };
                if (img.src !== url) img.src = url; else if (img.complete) show();
                if (img.complete && img.naturalWidth) show(); // cache: onload pode não disparar
            }, HOVER_MS);
        });
        document.addEventListener('mouseout', e => {
            if (!cur) return;   // preview nem está aberto → não paga o closest() em todo mouseout da página
            const thumb = e.target.closest && e.target.closest(PREV_SEL);
            if (thumb && thumb === cur && !thumb.contains(e.relatedTarget)) hide();
        });
        window.addEventListener('scroll', hide, { passive: true });
        // o painel rola por dentro (não dispara scroll da janela) → fecha o popover junto
        document.addEventListener('scroll', e => { if (cur && e.target && e.target.classList && e.target.classList.contains('smg-aldock-body')) hide(); }, true);
    }
