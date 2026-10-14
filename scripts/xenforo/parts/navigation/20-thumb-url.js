    // navigation/20-thumb-url.js
    // Owns: the large and the small thumbnail URL rules.
    // Exposes: dcThumbUrl, smallThumbUrl.
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

    // =========================================================
    // CARD pequeno: smallThumbUrl (versão reduzida da thumb, quando o host tem uma)
    // =========================================================
    // A thumb de uma thread é quase sempre o ARQUIVO ORIGINAL no host (1-3 MB num card de ~280px). Só sobe
    // pra versão reduzida onde ela foi confirmada nas URLs que o próprio fórum serve:
    //   · CDN do jpg6 (simpN.cuckcapital.cr, simpN.selti-delivery.ru …, Chevereto): `.md.` antes da extensão
    //     (~500px; o fórum já lista thumbs assim). GIF fica de fora: o .md de GIF não foi confirmado.
    // Sem versão confirmada (imagepond, ibb — o .md do ibb devolve o mesmo arquivo — pixhost, cujo thumb tem
    // ~200px e borra num card de 373px) a URL volta intacta. Quem usa cai no original se a reduzida falhar.
    function smallThumbUrl(url) {
        if (!url || /\.(?:md|th)\.|\.gif(?:$|[?#])/i.test(url)) return url;
        let host = '';
        try { host = new URL(url, location.href).hostname; } catch (e) { return url; }
        if (/^simp\d*\./i.test(host)) return getMedUrl(url);
        return url;
    }
