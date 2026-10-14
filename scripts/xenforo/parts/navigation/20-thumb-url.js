    // navigation/20-thumb-url.js
    // Owns: the large thumbnail URL rule.
    // Exposes: dcThumbUrl.
    // Depends on: core/06-helpers.
    // =========================================================
    // HOVER preview: dcThumbUrl (URL grande da thumb de uma lista/grade; usado pela navegação)
    // =========================================================
    function dcThumbUrl(thumb) {
        if (!thumb) return '';
        const im = thumb.tagName === 'IMG' ? thumb : thumb.querySelector('img');
        const el = im || thumb;   // background-image da <img> ou, sem <img>, do próprio container
        const bg = (el.style && el.style.backgroundImage) || '';
        const m = bg.match(/url\(["']?(.*?)["']?\)/i);
        const url = m ? m[1] : (im ? (im.getAttribute('src') || im.currentSrc || im.getAttribute('data-src') || '') : '');
        if (!url || url.startsWith('data:')) return '';
        return getBigUrl(url); // tenta a versão maior (.md/.th → full)
    }
