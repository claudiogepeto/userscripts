    // =========================================================
    // HOVER preview: dcThumbUrl (URL grande da thumb de uma lista/grade; usado pela navegação)
    // =========================================================
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
