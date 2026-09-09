    // =========================================================
    // HELPERS: text / url
    // =========================================================

    function absUrl(u) {
        if (!u || !String(u).trim()) return '';
        try { return new URL(u, location.href).href; } catch (e) { return u; }
    }

    function b64decode(s) {
        if (!s) return null;
        let str = String(s).trim().replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) str += '=';
        for (const t of [str, s]) {
            try {
                const r = atob(t);
                if (r) return r;
            } catch (e) {}
        }
        return null;
    }

    function rawParam(href, key) {
        if (!href) return null;
        const m = (href || '').match(new RegExp('[?&]' + key + '=([^&#]+)'));
        if (m) {
            try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; }
        }
        try {
            const u = new URL(href, location.href);
            return u.searchParams.get(key);
        } catch (e) {}
        return null;
    }

    function decodeProxyHref(href) {
        if (!href || typeof href !== 'string') return null;
        let target = null;
        if (/\/goto\/link-confirmation/i.test(href)) {
            target = rawParam(href, 'url') || rawParam(href, 'to');
        } else if (/\/redirect\/?/i.test(href)) {
            target = rawParam(href, 'to') || rawParam(href, 'url') || rawParam(href, 'link');
        } else if (/\/proxy\.php/i.test(href)) {
            target = rawParam(href, 'link') || rawParam(href, 'url');
        } else if (/\/link-proxy\/?/i.test(href)) {
            target = rawParam(href, 'url') || rawParam(href, 'link') || rawParam(href, 'to');
        } else if (/[\/?](goto\/link-confirmation|redirect|link-proxy|proxy\.php)/i.test(href)) {
            target = rawParam(href, 'url') || rawParam(href, 'to') || rawParam(href, 'link');
        }
        if (!target) return null;
        target = target.trim();
        if (/^https?:\/\//i.test(target)) return target;
        const decoded = b64decode(target);
        if (decoded && /^https?:\/\//i.test(decoded.trim())) return decoded.trim();
        return decoded || target;
    }

    function resolveProxyHref(href) {
        if (!href || typeof href !== 'string') return '';
        const trimmed = href.trim();
        if (!trimmed) return '';
        const decoded = decodeProxyHref(trimmed);
        if (decoded && /^https?:/i.test(decoded)) return decoded;
        if (/^https?:/i.test(trimmed)) return trimmed;
        if (decoded) return decoded;
        return trimmed;
    }

    function getBigUrl(url) {
        // imgbox NÃO segue a convenção .md/.th: thumb = thumbs2.imgbox.com/.../HASH_t.jpg,
        // original = images2.imgbox.com/.../HASH_o.jpg (o `_b` é um CROP quadrado, não serve). Sobe pro original.
        if (/\bimgbox\.com\//i.test(url) && /_t\.(?:jpe?g|png|gif|webp)(?:$|[?#])/i.test(url))
            return url.replace(/\/\/thumbs(\d*)\.imgbox\.com\//i, '//images$1.imgbox.com/').replace(/_t(\.(?:jpe?g|png|gif|webp))(?=$|[?#])/i, '_o$1');
        // pixhost: thumb = t{N}.pixhost.{tld}/thumbs/{gal}/{file}  →  full = img{N}.pixhost.{tld}/images/{gal}/{file}
        // TLD solto de propósito: o host migrou de .to pra .cc e a regra presa em .to deixava de subir
        // a imagem — o post ficava com a thumb de 150px e o link apontando pra página /show/.
        if (/\/\/t\d*\.pixhost\.[a-z.]+\/thumbs\//i.test(url))
            return url.replace(/\/\/t(\d*)\.pixhost\.([a-z.]+)\/thumbs\//i, '//img$1.pixhost.$2/images/');
        return url.replace('.md.', '.').replace('.th.', '.');
    }
    function isImgboxThumb(url) { return /\bimgbox\.com\//i.test(url) && /_t\.(?:jpe?g|png|gif|webp)(?:$|[?#])/i.test(url); }

    // inverso do getBigUrl: insere `.md.` antes da extensão → tier MÉDIO dos hosts que seguem a convenção
    // (imgbox/pixhost/…). Usado nos previews da galeria (tile = médio, perf; o feed abre o full no clique).
    // URL sem extensão de imagem reconhecida (ou que já é .md./.th.) volta intacta → quem usa cai no full por fallback.
    function getMedUrl(url) {
        if (!url || /\.(?:md|th)\./i.test(url)) return url;
        return url.replace(/(\.(?:jpe?g|png|gif|webp|avif|bmp))(\?|#|$)/i, '.md$1$2');
    }

    function cleanText(text) {
        return text.replace('.md', '').replace('.th', '');
    }

    function canonicalThreadPath(str) {
        if (!str) return '';
        try {
            const u = new URL(str, location.href);
            let p = u.pathname;
            p = p.replace(/\/(unread|latest|page-\d+|post-\d+).*$/, '').replace(/\/+$/, '') + '/';
            return p;
        } catch (e) {
            return (str || '').replace(/\/(unread|latest|page-\d+|post-\d+).*$/, '').replace(/\/+$/, '') + '/';
        }
    }

    function structItemTs(it) {
        if (!it || !it.querySelector) return 0;
        const t = it.querySelector('.structItem-latestDate, .structItem-cell--latest time, .structItem-latestDate time, .structItem-cell--latest .u-dt');
        if (!t) return 0;
        let ts = parseInt(t.getAttribute('data-timestamp') || t.getAttribute('data-time') || '0', 10) || 0;
        if (!ts) { const dt = t.getAttribute('datetime'); if (dt) { const ms = Date.parse(dt); if (!isNaN(ms)) ts = Math.floor(ms / 1000); } }
        return ts;
    }

    const KNOWN_XF_PREFIXES = {
        'oficial': 'label label--green',
        'trans': 'label label--trans',
        'femboy': 'label label--trans',
        'ftm': 'label label--misc',
        'mtf': 'label label--misc',
        'post-op': 'label label--misc',
        'vtuber': 'label label--vtuber',
        'asmr': 'label label--asmr',
        'celeb': 'label label--celeb',
        'patreon': 'label label--patreon',
        'twitch': 'label label--twitch',
        'youtube': 'label label--youtube',
        'kick': 'label label--kick',
        'onlyfans': 'label label--onlyfans',
        'tiktok': 'label label--tiktok',
        'instagram': 'label label--insta',
        'insta': 'label label--insta',
        'professional sites': 'label label--professional-modelling-sites',
        'manyvids': 'label label--manyvids',
        'reddit': 'label label--reddit',
        'fantrie': 'label label--fantrie',
        'fanfix': 'label label--fanfix',
        'boosty': 'label label--boosty',
        'cam girls': 'label label--camgirls',
        'camgirls': 'label label--camgirls',
        'gumroad': 'label label--gumroad',
        'snapchat': 'label label--snapchat',
        '𝕏': 'label label--x',
        'x': 'label label--x',
        'fansly': 'label label--fansly',
        'xxx': 'label label--xxx',
        'tumblr': 'label label--asian',
        'pornhub': 'label label--pornhub',
        'cosplay': 'label label--cosplay',
        'asian': 'label label--NEWasian',
        'indian': 'label label--NEWasian',
        't h i c c': 'label label--thicc',
        'thicc': 'label label--thicc',
        'h u n g': 'label label--thicc',
        'hung': 'label label--thicc',
        'bbw': 'label label--thicc',
        'milf': 'label label--thicc',
        'petite': 'label label--thicc',
        'teen': 'label label--asian',
        'ebony': 'label label--asian',
        'latina': 'label label--asian',
        'feet': 'label label--asian',
        'retired': 'label label--misc',
        // Novos Mapeados
        'passes': 'label label--passes',
        'playboy': 'label label--playboy',
        'kofi': 'label label--kofi',
        'ko-fi': 'label label--kofi',
        'fantia': 'label label--fantia',
        'jvid': 'label label--jvid',
        'afreecatv': 'label label--afreecatv',
        'afreeca tv': 'label label--afreecatv',
        'afreecaᵀⱽ': 'label label--afreecatv',
        'twitter': 'label label--twitter',
        'pixiv': 'label label--twitter',
        'request': 'label label--requests',
        'requests': 'label label--requests',
        'brasil': 'label label--brazil',
        'brazil': 'label label--brazil',
        'brasileiras': 'label label--brazil',
        'brasileira': 'label label--brazil',
        'hentai': 'label label--hentai',
        'doujin': 'label label--hentai',
        'doujinshi': 'label label--hentai',
        '3d': 'label label--3d',
        'ai': 'label label--ai',
        'ai audio': 'label label--ai',
        'privacy': 'label label--privacylogo',
        'xvideos': 'label label--xvideoslogo',
        // Países Asiáticos
        'japan': 'label label--japan',
        'japão': 'label label--japan',
        'japao': 'label label--japan',
        'korea': 'label label--korea',
        'coréia': 'label label--korea',
        'coreia': 'label label--korea',
        'south korea': 'label label--korea',
        'china': 'label label--china',
        'thailand': 'label label--thailand',
        'tailândia': 'label label--thailand',
        'tailandia': 'label label--thailand',
        'philippines': 'label label--philippines',
        'filipinas': 'label label--philippines',
        'indonesia': 'label label--indonesia',
        'indonésia': 'label label--indonesia',
        'taiwan': 'label label--taiwan',
        'vietnam': 'label label--vietnam',
        'vietnã': 'label label--vietnam',
        'vietna': 'label label--vietnam',
        'hong kong': 'label label--hong_kong',
        'hong_kong': 'label label--hong_kong',
        'hongkong': 'label label--hong_kong',
        'singapore': 'label label--singapore',
        'singapura': 'label label--singapore',
        'malaysia': 'label label--malaysia',
        'malásia': 'label label--malaysia',
        'malasia': 'label label--malaysia',
    };

    function extractRowBadges(row) {
        if (!row) return [];
        const badges = [];
        const seen = new Set();
        // 1. Prefixes / Labels nativos (ignora container labelLink pra pegar o span interno com a classe real)
        row.querySelectorAll('.label, .prefix, [class*="label--"], [class*="prefix--"]').forEach(el => {
            if (el.classList.contains('labelLink') && el.querySelector('.label, .prefix')) return;
            if (el.closest('.smg-watched-chips, .smg-lf-chips, .smg-thead-tags, .smg-search-chips')) return;
            const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
            const k = txt.toLowerCase();
            if (txt && txt.length > 0 && txt.length < 40 && !seen.has(k)) {
                seen.add(k);
                let cls = KNOWN_XF_PREFIXES[k] || Array.from(el.classList).filter(c => !c.startsWith('smg-') && c !== 'labelLink').join(' ');
                if (!cls.includes('label')) cls = 'label ' + cls;
                badges.push({ name: txt, type: 'prefix', className: cls, style: el.getAttribute('style') || '' });
            }
        });
        // 2. Tags (#tag, .tagItem, a[href*="/tags/"])
        row.querySelectorAll('.tagItem, a[href*="/tags/"], .structItem-tags a, .tagList a').forEach(el => {
            if (el.closest('.smg-watched-chips, .smg-lf-chips, .smg-thead-tags, .smg-search-chips')) return;
            const raw = (el.textContent || '').replace(/\s+/g, ' ').trim();
            const txt = raw.replace(/^#/, '').trim();
            const k = txt.toLowerCase();
            if (txt && txt.length > 0 && txt.length < 40 && !seen.has(k)) {
                seen.add(k);
                badges.push({ name: txt, type: 'tag', className: 'tagItem', style: '' });
            }
        });
        return badges;
    }

    function extractCleanTitleAndPrefixes(rootEl, fallbackTitle) {
        if (!rootEl) return { title: fallbackTitle || '', prefixesHtml: '' };
        const clone = rootEl.cloneNode(true);
        // Remove avisos injetados, botões de ação e scripts
        clone.querySelectorAll('.smg-notices, .smg-notices-collapse, .p-title-pageAction, .button, .action, .menu, .contentRow-badge, .contentRow-extra, .contentRow-actions, script, style, noscript').forEach(el => el.remove());

        const PREFIX_SEL = 'a.labelLink, .label, .prefix, [class*="label--"], [class*="prefix"]';
        const seenTexts = new Set();
        const cleanLabels = [];
        clone.querySelectorAll(PREFIX_SEL).forEach(el => {
            // Se o elemento estiver dentro de outro label correspondente, ignora
            if (el.parentElement && el.parentElement.closest(PREFIX_SEL)) return;
            const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
            if (!txt || seenTexts.has(txt.toLowerCase())) {
                el.remove();
                return;
            }
            seenTexts.add(txt.toLowerCase());
            cleanLabels.push(el.cloneNode(true));
            el.remove();
        });
        const prefixesHtml = cleanLabels.map(l => l.outerHTML).join(' ');
        let title = (clone.textContent || '').replace(/\s+/g, ' ').trim();
        // Remove prefixos acidentais ou ações vazadas
        title = title.replace(/^(?:Post in thread\s*|Mensagem no tópico\s*|Post no tópico\s*|Mensagem\s*|Tópico\s*|Thread\s*|Edit\s*|Editar\s*)+/i, '')
                     .replace(/Avisos.*$/i, '')
                     .replace(/^['"‘’“”]+|['"‘’“”]+$/g, '')
                     .trim();
        return { title: title || fallbackTitle || '', prefixesHtml: prefixesHtml };
    }

    const PREFIX_CATEGORY_MAP = {
        // Brasileiras
        'brasil': 'Brasileiras', 'brazil': 'Brasileiras', 'brasileiras': 'Brasileiras', 'brasileira': 'Brasileiras',
        // Sites & Plataformas
        'onlyfans': 'Sites & Plataformas', 'fansly': 'Sites & Plataformas', 'patreon': 'Sites & Plataformas',
        'tiktok': 'Sites & Plataformas', 'instagram': 'Sites & Plataformas', 'insta': 'Sites & Plataformas',
        'twitch': 'Sites & Plataformas', 'youtube': 'Sites & Plataformas', 'kick': 'Sites & Plataformas',
        'reddit': 'Sites & Plataformas', 'snapchat': 'Sites & Plataformas', 'x': 'Sites & Plataformas',
        '𝕏': 'Sites & Plataformas', 'twitter': 'Sites & Plataformas', 'manyvids': 'Sites & Plataformas',
        'fanfix': 'Sites & Plataformas', 'fantrie': 'Sites & Plataformas', 'boosty': 'Sites & Plataformas',
        'gumroad': 'Sites & Plataformas', 'cam girls': 'Sites & Plataformas', 'camgirls': 'Sites & Plataformas',
        'pornhub': 'Sites & Plataformas', 'xxx': 'Sites & Plataformas', 'tumblr': 'Sites & Plataformas',
        'professional sites': 'Sites & Plataformas', 'passes': 'Sites & Plataformas', 'playboy': 'Sites & Plataformas',
        'kofi': 'Sites & Plataformas', 'ko-fi': 'Sites & Plataformas', 'fantia': 'Sites & Plataformas',
        'jvid': 'Sites & Plataformas', 'afreecatv': 'Sites & Plataformas', 'afreeca tv': 'Sites & Plataformas',
        'afreecaᵀⱽ': 'Sites & Plataformas', 'pixiv': 'Sites & Plataformas', 'privacy': 'Sites & Plataformas',
        'xvideos': 'Sites & Plataformas',
        // Trans
        'trans': 'Trans', 'femboy': 'Trans', 'ftm': 'Trans', 'mtf': 'Trans', 'post-op': 'Trans', 'trap': 'Trans',
        // Animação & Arte
        'hentai': 'Animação & Arte', 'doujin': 'Animação & Arte', 'doujinshi': 'Animação & Arte',
        '3d': 'Animação & Arte', 'ai': 'Animação & Arte', 'ai audio': 'Animação & Arte',
        // Gênero e Tipo
        'cosplay': 'Gênero e Tipo', 'asian': 'Gênero e Tipo', 'indian': 'Gênero e Tipo',
        't h i c c': 'Gênero e Tipo', 'thicc': 'Gênero e Tipo', 'h u n g': 'Gênero e Tipo', 'hung': 'Gênero e Tipo',
        'bbw': 'Gênero e Tipo', 'milf': 'Gênero e Tipo', 'petite': 'Gênero e Tipo', 'teen': 'Gênero e Tipo',
        'ebony': 'Gênero e Tipo', 'latina': 'Gênero e Tipo', 'feet': 'Gênero e Tipo', 'retired': 'Gênero e Tipo',
        // Países Asiáticos
        'japan': 'Países Asiáticos', 'japão': 'Países Asiáticos', 'japao': 'Países Asiáticos',
        'korea': 'Países Asiáticos', 'coréia': 'Países Asiáticos', 'coreia': 'Países Asiáticos', 'south korea': 'Países Asiáticos',
        'china': 'Países Asiáticos',
        'thailand': 'Países Asiáticos', 'tailândia': 'Países Asiáticos', 'tailandia': 'Países Asiáticos',
        'philippines': 'Países Asiáticos', 'filipinas': 'Países Asiáticos',
        'indonesia': 'Países Asiáticos', 'indonésia': 'Países Asiáticos',
        'taiwan': 'Países Asiáticos',
        'vietnam': 'Países Asiáticos', 'vietnã': 'Países Asiáticos', 'vietna': 'Países Asiáticos',
        'hong kong': 'Países Asiáticos', 'hong_kong': 'Países Asiáticos', 'hongkong': 'Países Asiáticos',
        'singapore': 'Países Asiáticos', 'singapura': 'Países Asiáticos',
        'malaysia': 'Países Asiáticos', 'malásia': 'Países Asiáticos', 'malasia': 'Países Asiáticos',
        // Criadores & Mídia
        'vtuber': 'Criadores & Mídia', 'asmr': 'Criadores & Mídia', 'celeb': 'Criadores & Mídia',
        // Outros & Tags
        'oficial': 'Outros & Tags', 'request': 'Outros & Tags', 'requests': 'Outros & Tags'
    };

    function getBadgeCategory(name, type) {
        if (type === 'tag') return 'Outros & Tags';
        const k = (name || '').toLowerCase().trim();
        return PREFIX_CATEGORY_MAP[k] || 'Outros & Tags';
    }

    // =========================================================
    // HELPERS: dom
    // =========================================================

    // estado de "seguindo" SEM depender de idioma: a label atual === data-sk-unwatch ⇒ seguindo
    // (o XF alterna o texto do botão entre data-sk-watch e data-sk-unwatch; comparamos com o attr)
    function smgIsWatching(w) {
        if (!w) return false;
        const label = ((w.querySelector('.button-text') || w).textContent || '').trim().toLowerCase();
        const un = (w.getAttribute('data-sk-unwatch') || '').trim().toLowerCase();
        return !!un && label === un;
    }

    function waitForElement(selector, timeout = 5000) {
        return new Promise(resolve => {
            const existing = document.querySelector(selector);

            if (existing) {
                resolve(existing);
                return;
            }

            const observer = new MutationObserver(() => {
                const el = document.querySelector(selector);

                if (el) {
                    observer.disconnect();
                    resolve(el);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, timeout);
        });
    }

    // GET same-origin → parseia a resposta HTML num Document. `opts` passam direto pro fetch:
    // alguns callers OMITEM X-Requested-With de propósito (querem a página inteira, não o parcial
    // AJAX do XF); outros mandam (querem o parcial). O .text()→parse é que era repetido em toda parte.
    function fetchDoc(url, opts) {
        return fetch(url, opts)
            .then(r => {
                if (r.status === 429) {
                    const retryHeader = r.headers && r.headers.get ? r.headers.get('Retry-After') : null;
                    const retrySec = parseInt(retryHeader || '0', 10) || 0;
                    if (typeof riverHandle429 === 'function') {
                        riverHandle429(retrySec);
                    } else if (typeof window !== 'undefined' && typeof window.riverHandle429 === 'function') {
                        window.riverHandle429(retrySec);
                    }
                    return null;
                }
                if (!r.ok) return null;
                return r.text().then(html => new DOMParser().parseFromString(html, 'text/html'));
            })
            .catch(err => {
                console.warn('[SMG] Erro de rede em fetchDoc:', err);
                return null;
            });
    }

    // monta um <form> POST oculto com os campos [nome, valor] e submete (navega p/ o resultado).
    // usado pela busca e pelo filtro da listagem — ambos POSTam pro endpoint nativo do XenForo.
    function postForm(action, fields) {
        const f = document.createElement('form');
        f.method = 'post';
        f.action = action;
        f.style.display = 'none';
        fields.forEach(([n, v]) => { const i = document.createElement('input'); i.type = 'hidden'; i.name = n; i.value = v; f.appendChild(i); });
        document.body.appendChild(f);
        f.submit();
    }

    // href "seguro": neutraliza esquemas perigosos (javascript:/data:/vbscript:) vindos de href lidos
    // da página, deixando passar http(s)/relativo/âncora. Defesa contra href poisoned (servidor comprometido/XSS armazenado).
    function safeHref(url) {
        return /^\s*(javascript|data|vbscript):/i.test(url || '') ? '#' : (url || '#');
    }

    // Normaliza o escopo de um pass incremental. O observer pode entregar um pai e vários filhos na
    // mesma leva; manter todos faz a mesma subárvore ser percorrida repetidamente. A raiz mais externa
    // cobre os descendentes e, portanto, torna o custo previsível mesmo quando o XF injeta lotes aninhados.
    function normalizeRoots(roots) {
        const raw = roots == null ? [document.body] : (roots.nodeType ? [roots] : Array.from(roots));
        const valid = raw.filter(root => root && root.nodeType === 1);
        const depthOf = node => { let depth = 0; for (let p = node.parentElement; p; p = p.parentElement) depth++; return depth; };
        valid.sort((a, b) => depthOf(a) - depthOf(b));
        const result = [];
        valid.forEach(root => {
            if (result.some(parent => parent === root || parent.contains(root))) return;
            result.push(root);
        });
        return result;
    }

    // roda fn em cada elemento que casa `selector` DENTRO dos roots dados (incluindo cada root, se ele
    // mesmo casar). Também considera o ancestral que contém uma mutação: se um span novo foi inserido
    // dentro de um card, o card ainda pode ser o dono do pass. `seen` fecha a última possibilidade de
    // duplicação quando dois seletores/raízes apontam para o mesmo elemento.
    function eachIn(roots, selector, fn) {
        const seen = new Set();
        normalizeRoots(roots).forEach(root => {
            const ancestor = root.closest && root.closest(selector);
            if (ancestor && !seen.has(ancestor)) { seen.add(ancestor); fn(ancestor); }
            if (root.matches(selector) && !seen.has(root)) { seen.add(root); fn(root); }
            root.querySelectorAll(selector).forEach(node => {
                if (seen.has(node)) return;
                seen.add(node);
                fn(node);
            });
        });
    }

    // listener de scroll throttled por requestAnimationFrame (no máx 1 fn por frame; passive).
    // o flag de "já agendado" fica encapsulado aqui (era repetido na dock/topbar/scroll infinito).
    function onScrollRaf(fn) {
        let tick = false;
        window.addEventListener('scroll', () => {
            if (tick) return;
            tick = true;
            requestAnimationFrame(() => { tick = false; fn(); });
        }, { passive: true });
    }

    // =========================================================
    // HELPERS: ui builders
    // =========================================================

    // base dos botões da dock: <button> ou <a> com o MESMO visual (id · classe · tamanho · ícone · tooltip).
    function makeDockEl(tag, { id, icon, label = '', fontSize = 20 }) {
        const el = document.createElement(tag);
        el.id = id;
        if (tag === 'button') el.type = 'button';
        el.className = 'smg-nav-btn';
        el.style.setProperty('--smg-btn-fs', fontSize + 'px');

        // icon-only: label vira tooltip (data-label) + aria-label + title
        if (label) {
            label = i18n(label);
            el.dataset.label = label;
            el.setAttribute('aria-label', label);
            el.setAttribute('title', label);
        }

        const ico = document.createElement('span');
        ico.className = 'smg-nav-ico';
        ico.innerHTML = icon;
        el.appendChild(ico);

        return el;
    }
    function makeDockButton(opts) { return makeDockEl('button', opts); }
    // botão que é link de navegação (mesmo visual da dock, mas <a>)
    function makeDockLink(opts) { const a = makeDockEl('a', opts); a.href = opts.href; return a; }

    function setBtnIcon(btn, icon) {
        const ico = btn.querySelector('.smg-nav-ico');
        if (ico) ico.innerHTML = icon;
    }

    // atualiza o tooltip/aria/title
    function setBtnLabel(btn, label) {
        if (!btn) return;
        label = i18n(label);
        btn.dataset.label = label;
        btn.setAttribute('aria-label', label);
        btn.setAttribute('title', label);
    }

    function makeDivider() {
        const divider = document.createElement('div');
        divider.className = 'smg-nav-divider';
        return divider;
    }

    function makeGroup(...buttons) {
        const group = document.createElement('div');
        group.className = 'smg-nav-group';
        buttons.filter(Boolean).forEach(btn => group.appendChild(btn));
        return group;
    }

    // arrastar pra baixo fecha (bottom sheets / modais mobile). Engata SÓ no topo (~64px = grip/header) → não
    // conflita com o scroll do conteúdo. isActive() opcional gate (ex.: só quando o sheet está aberto + mobile).
    function addSwipeClose(panel, closeFn, isActive) {
        if (!panel || typeof closeFn !== 'function') return;
        let y0 = 0, dy = 0, drag = false;
        panel.addEventListener('touchstart', e => {
            drag = false;
            if (e.touches.length !== 1) return;
            if (isActive && !isActive()) return;
            const r = panel.getBoundingClientRect();
            if (e.touches[0].clientY - r.top > 64) return;   // toque fora da zona do grip/header → deixa o scroll rolar
            drag = true; y0 = e.touches[0].clientY; dy = 0;
            panel.style.transition = 'none';
        }, { passive: true });
        panel.addEventListener('touchmove', e => {
            if (!drag) return;
            dy = e.touches[0].clientY - y0;
            if (dy > 0) panel.style.transform = 'translateY(' + dy + 'px)';
        }, { passive: true });
        panel.addEventListener('touchend', () => {
            if (!drag) return;
            drag = false;
            panel.style.transition = '';
            panel.style.transform = '';
            if (dy > 90) closeFn();   // passou do limiar → fecha (a transição do CSS leva pro translateY(100%))
        });
    }

    // ---- bottom sheets (mobile): abrir/fechar com as garantias que faltavam ----
    // Cada sheet fazia só classList.add('open'), e faltavam as duas coisas que um bottom sheet
    // precisa ter no celular:
    //   • TRAVA DO FUNDO — sem ela a página atrás rolava junto (o arrasto no sheet e o toque no
    //     scrim iam pro documento), e ao fechar você voltava num lugar diferente de onde estava.
    //     A trava é position:fixed + top negativo, não overflow:hidden: no Safari iOS o
    //     overflow:hidden no html é ignorado quando já existe scroll em curso.
    //   • BOTÃO VOLTAR — com o sheet aberto, o "voltar" do Android saía da página. Empurramos um
    //     estado no history por abertura; o popstate fecha o sheet no lugar de navegar. Quem
    //     fecha por gesto/scrim consome esse estado (history.back) pra não deixar lixo.
    // Os três sheets (opções da dock, discover/conta, alertas) passam por aqui.
    const smgSheets = { open: [], scrollY: 0, locks: 0 };
    // trava/destrava contadas: o modal de busca também usa (ele não é um .smg-sheet, mas no
    // mobile é um bottom sheet igual) e sobreposições não podem destravar uma à outra
    function smgLockScroll() {
        if (smgSheets.locks++) return;
        smgSheets.scrollY = window.scrollY || window.pageYOffset || 0;
        document.body.style.top = (-smgSheets.scrollY) + 'px';
        document.documentElement.classList.add('smg-sheet-lock');
    }
    function smgUnlockScroll() {
        if (!smgSheets.locks || --smgSheets.locks) return;
        document.documentElement.classList.remove('smg-sheet-lock');
        document.body.style.top = '';
        window.scrollTo(0, smgSheets.scrollY);       // devolve exatamente onde estava
    }
    function smgSheetOpen(sheet) {
        if (!sheet || smgSheets.open.indexOf(sheet) !== -1) return;
        smgLockScroll();
        smgSheets.open.push(sheet);
        sheet.classList.add('open');
        try { history.pushState({ smgSheet: true }, ''); } catch (e) {}
    }
    function smgSheetClose(sheet, fromPop) {
        const i = sheet ? smgSheets.open.indexOf(sheet) : -1;
        if (i === -1) return;                       // já fechado → nada a desfazer (corta o eco do popstate)
        smgSheets.open.splice(i, 1);
        sheet.classList.remove('open');
        smgUnlockScroll();
        if (!fromPop) { try { history.back(); } catch (e) {} }
    }
    window.addEventListener('popstate', () => {
        const top = smgSheets.open[smgSheets.open.length - 1];
        if (top) smgSheetClose(top, true);
    });
    // liga scrim (toque no fundo), arrasto pra baixo e Esc de uma vez — todo sheet quer os três
    function wireSheetClose(sheet, panel) {
        if (!sheet) return;
        sheet.addEventListener('click', e => { if (e.target === sheet) smgSheetClose(sheet); });
        addSwipeClose(panel || sheet.firstElementChild, () => smgSheetClose(sheet), () => sheet.classList.contains('open'));
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheet.classList.contains('open')) smgSheetClose(sheet); });
    }

    // =========================================================
    // HELPERS: paginação + estado compartilhado entre features
    // =========================================================

    // template de URL + página atual/total (dock goto, scroll infinito da thread e do feed).
    // A página atual vem da URL (/page-N) — confiável; o input do page-jump costuma vir
    // vazio/errado no document-end, o que bagunçava a dock e o ponto de partida do scroll.
    // Retorna null em thread de página única.
    function readPageJump() {
        const row = document.querySelector('[data-xf-init="page-jump"][data-page-url]');
        let tpl = row ? row.getAttribute('data-page-url') : null; // .../page-%page%
        if (!tpl) {
            // tema sem o menu page-jump: deriva o template de um link de paginação
            const href = Array.from(document.querySelectorAll('.pageNav a[href], .pageNavSimple a[href]'))
                .map(a => a.getAttribute('href') || '')
                .find(h => /\/page-\d+/.test(h));
            if (href) tpl = href.replace(/\/page-\d+/, '/page-%page%');
        }
        if (!tpl) return null; // página única

        const um = location.pathname.match(/\/page-(\d+)/) || location.search.match(/[?&]page=(\d+)/);
        let cur = um ? parseInt(um[1], 10) : 1;

        // total: a maior página vista (links de paginação + "X of Y" + atributo max do input)
        let max = cur;
        document.querySelectorAll('.pageNav a[href], .pageNavSimple a[href], a[href*="page-"], a[href*="page="]').forEach(a => {
            const h = a.getAttribute('href') || '';
            const m = h.match(/(?:page-|[?&]page=)(\d+)/);
            if (m) max = Math.max(max, parseInt(m[1], 10));
        });
        const simple = document.querySelector('.pageNavSimple-el--current')?.textContent.match(/(\d+)\s*of\s*(\d+)/i);
        if (simple) max = Math.max(max, parseInt(simple[2], 10) || 0);
        const im = parseInt(row?.querySelector('input[type="number"]')?.getAttribute('max') || '', 10);
        if (im) max = Math.max(max, im);

        return { tpl, cur: cur || 1, max: max || 1 };
    }

    // =========================================================
    // CACHE de THUMBNAIL por thread (sem request extra)
    // A página de alertas do XF não traz foto da thread, e buscar a thread de cada alerta seria
    // 1 request POR ITEM. Só que toda listagem que já passa pela tela (fórum, seguidas, busca,
    // what's new — e a aba Seguindo do painel) tem .structItem--thread COM a thumb: colhemos dali,
    // de graça, e guardamos por ID de thread. O alerta então pinta a foto direto do cache.
    // Chave = ID numérico (o slug muda quando renomeiam a thread; o id não).
    // =========================================================
    // POR SITE: o GM storage é do SCRIPT, não da origem — simpcity e socialmediagirls dividiriam o mesmo
    // mapa e a thread 12345 de um viraria a foto da thread 12345 do outro. Cada fórum tem o seu.
    const THUMBC_SITE = /socialmediagirls/i.test(location.hostname) ? 'smg' : 'sc';
    const THUMBC_KEY = 'smg-thumb-cache-' + THUMBC_SITE;
    const THUMBTPL_KEY = 'smg-thumb-tpl-' + THUMBC_SITE;
    const THUMBC_MAX = 1400, THUMBC_KEEP = 1000;   // ~2 chaves por thread (id + título) → teto em ~700 threads
    let thumbCache = null, thumbCacheT = 0, thumbCacheBound = false;
    const followedThumbsMap = new Map();

    // URL da thumb da THREAD (não do avatar do autor): simpcity põe no background-image de um <img>
    // 1x1 (.dcThumbnail), SMG usa <img src> real (.dtt-thread-thumbnail). Só esses dois holders contam
    // — um "qualquer <img> da célula" cacheria o avatar do autor como se fosse foto da thread.
    function threadThumbUrl(it) {
        const cell = it.querySelector('.structItem-cell--icon:not(.structItem-cell--iconEnd)') || it;
        const holder = cell.querySelector('.dcThumbnail, .dtt-thread-thumbnail');
        const img = holder && holder.querySelector('img');
        if (!img) return '';
        const bg = (img.style.backgroundImage || '').match(/url\(\s*["']?([^"')]+)/i);
        const u = (bg && bg[1]) || img.getAttribute('data-src') || img.getAttribute('src') || '';
        return /^data:/i.test(u) ? '' : u;
    }
    // chave da thread: o ID quando a URL tem (o normal no XF: /threads/slug.123/). O SLUG só entra
    // quando NÃO há id — usá-lo como reserva geral seria pior que perder a foto: dois tópicos de
    // mesmo título (comum) colidiriam e um mostraria a foto do outro.
    function threadIdOf(href) {
        const seg = String(href || '').match(/\/threads\/([^/?#]+)/);
        const id = seg && seg[1].match(/(\d+)$/);
        return id ? id[1] : '';
    }
    function threadSlugOf(href) {
        const seg = String(href || '').match(/\/threads\/([^/?#]+)/);
        if (!seg) return '';
        const slug = seg[1].replace(/\.\d+$/, '').toLowerCase();
        return (slug && !/^\d+$/.test(slug)) ? 's:' + slug : '';
    }
    // chave por TÍTULO. Os alertas do XF linkam pro POST (/posts/50320449/) e não dizem em lugar
    // nenhum de que thread se trata — o único elo com a listagem é o texto do título. Normalizado
    // igual dos dois lados (o limpador de alertas troca | e / por vírgula), casa alerta × listagem.
    // Ressalva: dois tópicos de MESMO título dividem a chave; na prática são a mesma modelo em
    // fóruns diferentes, então a foto sai plausível — e é melhor que linha nenhuma ter foto.
    function threadTitleKey(t) {
        const s = String(t || '').replace(/ /g, ' ')   // &nbsp; (o alerta separa os chips com ele)
            .replace(/[|/]/g, ',').replace(/\s*,\s*/g, ', ')
            .replace(/\s+/g, ' ').trim().toLowerCase();
        return s.length >= 3 ? 't:' + s : '';
    }
    function thumbCacheAll() {
        if (thumbCache) return thumbCache;
        try { thumbCache = JSON.parse(gmGet(THUMBC_KEY, '{}')) || {}; } catch (e) { thumbCache = {}; }
        return thumbCache;
    }
    // ordem: id da thread (exato) → título (único elo quando o link é de /posts/N) → padrão de URL
    function thumbCacheGet(href, title) {
        const id = (typeof threadIdOf === 'function') ? threadIdOf(href) : '';
        const slug = (typeof threadSlugOf === 'function') ? (!id && threadSlugOf(href)) : '';
        const titleK = (typeof threadTitleKey === 'function') ? threadTitleKey(title) : '';
        const canon = (typeof canonicalThreadPath === 'function' && href) ? canonicalThreadPath(href) : '';

        // 1. In-memory followed thumbs (IndexedDB)
        if (typeof followedThumbsMap !== 'undefined' && followedThumbsMap.size) {
            if (id && followedThumbsMap.has(id)) return followedThumbsMap.get(id);
            if (canon && followedThumbsMap.has(canon)) return followedThumbsMap.get(canon);
            if (slug && followedThumbsMap.has(slug)) return followedThumbsMap.get(slug);
            if (titleK && followedThumbsMap.has(titleK)) return followedThumbsMap.get(titleK);
        }

        // 2. Persistent thumbCache (localStorage)
        const all = thumbCacheAll();
        const keys = [id, slug, titleK].filter(Boolean);
        for (const k of keys) { const rec = all[k]; if (rec && rec.u) return rec.u; }
        return id ? thumbTplApply(id) : '';
    }

    // PADRÃO de URL das thumbs. Nos dois fóruns a thumb é um arquivo derivado do ID da thread
    // (ex.: /data/thread_thumbnails/12/12345.jpg). Aprendendo esse formato a partir do que já foi
    // colhido, dá pra montar a URL de QUALQUER thread — inclusive as que nunca apareceram numa
    // listagem, que é o caso da maioria dos alertas quando se está lendo uma thread.
    // Só vale depois de CONFERIDO contra outras entradas do cache: se a URL tiver hash/assinatura
    // (não derivável), nenhum padrão passa na conferência e tudo segue como antes (glifo).
    // Errar é barato: a imagem 404 cai no onerror e a linha volta pro glifo.
    let thumbTpl = null;   // null = ainda não tentei · '' = não derivável
    const thumbTplFill = (tpl, id) =>
        tpl.split('%id%').join(id).split('%b%').join(String(Math.floor(parseInt(id, 10) / 1000)));
    function thumbTplLearn() {
        const all = thumbCacheAll();
        const ids = Object.keys(all).filter(k => /^\d+$/.test(k) && all[k] && all[k].u);   // só as chaves de ID (as de slug não derivam nada)
        if (ids.length < 4) return '';   // amostra pequena demais pra conferir
        for (const id of ids.slice(0, 10)) {
            const url = all[id].u;
            let tpl = url.split(id).join('%id%');
            if (tpl === url) continue;                       // o id nem aparece na URL → não é derivável
            const bucket = String(Math.floor(parseInt(id, 10) / 1000));
            tpl = tpl.replace('/' + bucket + '/', '/%b%/');   // pasta de "milhar", quando o host usa uma
            const hits = ids.filter(x => x !== id && thumbTplFill(tpl, x) === all[x].u).length;
            if (hits >= 3) return tpl;                        // reproduziu outras 3 → é o padrão da casa
        }
        return '';
    }
    function thumbTplApply(id) {
        if (thumbTpl === null) {
            thumbTpl = gmGet(THUMBTPL_KEY, '') || '';
            const learned = thumbTplLearn();                  // re-aprende quando o cache cresce (padrão pode mudar)
            if (learned && learned !== thumbTpl) { thumbTpl = learned; gmSet(THUMBTPL_KEY, learned); }
        }
        return thumbTpl ? thumbTplFill(thumbTpl, id) : '';
    }
    function thumbCachePut(href, url, title) {
        if (!url) return false;
        const keys = [threadIdOf(href) || threadSlugOf(href), threadTitleKey(title)].filter(Boolean);
        if (!keys.length) return false;
        const all = thumbCacheAll();
        if (keys.every(k => all[k] && all[k].u === url)) return false;   // nada mudou → não suja o cache nem agenda gravação
        const rec = { u: url, t: Date.now() };
        keys.forEach(k => { all[k] = rec; });
        thumbTpl = null;   // amostra nova → o padrão é re-aprendido no próximo lookup
        if (!thumbCacheBound) {   // sair da página antes do debounce não pode jogar fora o que já foi colhido
            thumbCacheBound = true;
            window.addEventListener('pagehide', () => { if (thumbCacheT) { clearTimeout(thumbCacheT); thumbCacheFlush(); } });
        }
        if (!thumbCacheT) thumbCacheT = setTimeout(thumbCacheFlush, 1500);   // grava em lote (uma listagem inteira = 1 escrita)
        return true;
    }
    function thumbCacheFlush() {
        thumbCacheT = 0;
        const all = thumbCacheAll();
        const keys = Object.keys(all);
        if (keys.length > THUMBC_MAX) {   // LRU simples: mantém os KEEP mais recentes
            keys.sort((a, b) => (all[b].t || 0) - (all[a].t || 0)).slice(THUMBC_KEEP).forEach(k => { delete all[k]; });
        }
        gmSet(THUMBC_KEY, JSON.stringify(all));
    }

    function indexFollowedThumbs(items) {
        if (!Array.isArray(items)) return;
        let fresh = 0;
        items.forEach(it => {
            if (!it || !it.thumbnail_url) return;
            const thumb = it.thumbnail_url;
            const path = it.path || '';
            const title = it.thread_name || '';
            const id = (typeof threadIdOf === 'function') ? threadIdOf(path) : '';
            const slug = (typeof threadSlugOf === 'function') ? threadSlugOf(path) : '';
            const titleK = (typeof threadTitleKey === 'function') ? threadTitleKey(title) : '';
            const canon = (typeof canonicalThreadPath === 'function' && path) ? canonicalThreadPath(path) : path;

            if (id) followedThumbsMap.set(id, thumb);
            if (slug) followedThumbsMap.set(slug, thumb);
            if (canon) followedThumbsMap.set(canon, thumb);
            if (titleK) followedThumbsMap.set(titleK, thumb);
            if (typeof thumbCachePut === 'function' && thumbCachePut(path, thumb, title)) fresh++;
        });
        if (fresh) {
            [document.getElementById('smg-aldock'), document.getElementById('smg-alerts-sheet')]
                .forEach(r => { if (r && typeof repaintAlertThumbs === 'function') repaintAlertThumbs(r); });
        }
    }
    // pass do processAll: colhe as thumbs das listagens que aparecerem (guard por elemento → idle é NodeList vazia)
    function harvestThreadThumbs(roots) {
        let fresh = 0;
        eachIn(roots, '.structItem--thread:not([data-smg-tc])', it => {
            it.setAttribute('data-smg-tc', '1');   // marca ANTES dos guards (REGRA DE OURO)
            const a = it.querySelector('.structItem-title a[href*="/threads/"]');
            if (!a) return;
            const u = threadThumbUrl(it);
            if (u && thumbCachePut(a.getAttribute('href'), u, a.textContent)) fresh++;
        });
        // colheu foto nova → os alertas JÁ na tela que esperavam por ela pintam agora (sem refresh).
        // Escopado no painel/sheet: é onde alerta mora, e evita varrer o documento a cada pass.
        if (!fresh) return;
        [document.getElementById('smg-aldock'), document.getElementById('smg-alerts-sheet')]
            .forEach(r => { if (r) repaintAlertThumbs(r); });
    }

    // IntersectionObserver "once": ao entrar na viewport (rootMargin/threshold em opts), des-observa o
    // alvo e roda onEnter(alvo) UMA vez. Centraliza o padrão repetido (thumb/full/turbo/galeria/redgifs-load).
    // Retorna null se o browser não tiver IO → o caller cai no fallback de carregar na hora.
    function makeLazyIO(onEnter, opts) {
        if (!('IntersectionObserver' in window)) return null;
        return new IntersectionObserver((entries, obs) => {
            entries.forEach(en => { if (en.isIntersecting) { obs.unobserve(en.target); onEnter(en.target); } });
        }, opts || {});
    }

    // =========================================================
    // FILA DE TRABALHO por PROXIMIDADE DA VIEWPORT (N slots)
    // =========================================================
    // O QUE ELA CONSERTA. Todo pass varre o documento em ORDEM DE DOM, então o trabalho de rede (resolver
    // card de file-host, poster de vídeo, raspar álbum) saía de cima pra baixo: abrir a thread no post #200
    // carregava primeiro os 199 de cima. Pior, disparado tudo de uma vez o gargalo real vira o limite de
    // conexões POR HOST do browser — que é FIFO, ou seja, DE NOVO de cima pra baixo, uma de cada vez.
    // (Era o "carrega do topo até o fim, 1 thumb por vez".)
    //
    // AQUI A ORDEM É DECIDIDA NA HORA DE RODAR, não na hora de enfileirar: sai primeiro o item mais perto da
    // viewport AGORA. Rolar muda a prioridade do que ainda não rodou → o carregamento se propaga a partir de
    // onde o usuário está, pros dois lados. E `limit` slots correm de verdade em paralelo (o browser só
    // serializa por host o que a gente deixar solto ao mesmo tempo).
    //
    // CUSTO: um getBoundingClientRect por item pendente a cada slot liberado. A fila é alimentada por IO com
    // margem de ~1,5-2 telas, então "pendente" é dezenas, não a thread inteira — a varredura é leitura pura
    // (sem escrita no meio) = 1 reflow, na casa do µs. Item que saiu do DOM é descartado na mesma passada.
    function makeTaskQueue(limit) {
        const items = [];   // { fn, el }
        let active = 0;
        const distOf = el => {
            if (!el) return 0;                       // sem âncora → prioridade neutra (nunca descartado)
            const r = el.getBoundingClientRect();
            const vh = window.innerHeight || 0;
            if (!r.width && !r.height) return 1e7;                     // caixa 0×0 (escondido/ainda sem layout): rect é 0,0 e passaria por "no topo da tela" → vai pro fim
            if (r.bottom >= 0 && r.top <= vh) return 0;               // na tela = máxima
            return r.top > vh ? (r.top - vh) : -r.bottom;             // distância até a borda mais próxima
        };
        // O pump NÃO roda no push: sai num microtask. Sem isso, enquanto houvesse slot livre cada item corria
        // na ordem em que chegou — e como quem alimenta a fila é um IntersectionObserver (que entrega o lote
        // inteiro numa tacada) ou um pass que varre o DOM, "ordem que chegou" = de cima pra baixo, exatamente
        // o que a fila existe pra evitar. Coalescendo o lote, a 1ª escolha já é feita com todos na mão.
        let scheduled = false;
        function schedulePump() {
            if (scheduled) return;
            scheduled = true;
            Promise.resolve().then(() => { scheduled = false; pump(); });
        }
        function pump() {
            if (active >= limit || !items.length) return;
            // Remove detached nodes e ordena uma vez por lote. O algoritmo anterior procurava o mínimo
            // novamente para cada slot, fazendo O(n²) leituras de layout quando muitos embeds entravam juntos.
            for (let i = items.length - 1; i >= 0; i--) {
                const it = items[i];
                if (!it.el || it.el.isConnected) continue;
                items.splice(i, 1);
                if (it.onDrop) { try { it.onDrop(); } catch (e) {} }
            }
            if (!items.length) return;
            // Materializa a distância antes do sort: o comparador pode ser chamado várias vezes pelo
            // motor JS, e cada chamada a getBoundingClientRect() pode forçar uma leitura de layout.
            items.forEach(it => { it.distance = distOf(it.el); });
            items.sort((a, b) => a.distance - b.distance);
            const capacity = limit - active;
            const batch = items.splice(0, capacity);
            batch.forEach(it => {
                active++;
                delete it.distance;
                Promise.resolve().then(it.fn).catch(() => {}).finally(() => { active--; pump(); });
            });
        }
        // el = âncora de prioridade (o nó que o trabalho vai preencher). Sem el, o item corre em ordem de chegada.
        // onDrop = chamado se o item for descartado por o el ter saído do DOM (nunca junto com fn).
        return {
            push(fn, el, onDrop) { items.push({ fn: fn, el: el || null, onDrop: onDrop || null }); schedulePump(); },
            pending() { return items.length; },
        };
    }

    // =========================================================
    // MÍDIA MORTA: uma caixa de 404 no lugar da mídia (buildDeadBox)
    // =========================================================
    // Antes cada caminho falhava do seu jeito: imagem quebrada virava um chip de texto com a URL crua,
    // redgifs morto virava a faixa "RedGifs unavailable", turbo 404 tinha card próprio. E o pior caso não
    // virava NADA: host que aceita a conexão e nunca responde não dispara load nem error na <img>, então o
    // shimmer girava pra sempre. Agora todos convergem pra esta caixa, no lugar da mídia e do tamanho dela.
    //
    // O CÓDIGO É REAL. O onerror da <img> não informa status nenhum, então quem já falhou leva um HEAD
    // (fila própria, 3 slots, priorizada por viewport igual ao resto) e a caixa troca de "indisponível" pro
    // 404/403/502 de verdade quando a sonda volta. Só sonda o que JÁ morreu — é um conjunto pequeno, e o
    // request não disputa banda com mídia viva.
    const deadProbeCache = new Map();   // url → status (0 = sem resposta); 1× por sessão
    const deadTasks = makeTaskQueue(3);
    function deadReason(st) {
        if (st === 404 || st === 410) return { code: String(st), why: 'file deleted' };
        if (st === 401 || st === 403) return { code: String(st), why: 'hotlink blocked' };
        if (st === 429) return { code: '429', why: 'rate limited' };
        if (st >= 500) return { code: String(st), why: 'host down' };
        if (st > 0) return { code: String(st), why: 'unavailable' };
        return { code: '—', why: 'no response' };
    }
    function deadProbe(url, box, paint) {
        if (deadProbeCache.has(url)) { paint(deadProbeCache.get(url)); return; }
        if (typeof GM_xmlhttpRequest !== 'function') return;   // sem GM_* não dá pra saber o status → fica o selo genérico
        deadTasks.push(() => new Promise(release => {
            let settled = false;
            const done = st => {
                if (settled) return; settled = true;
                deadProbeCache.set(url, st); release();
                if (box.isConnected) paint(st);
            };
            const ask = (method, headers) => GM_xmlhttpRequest({
                method: method, url: url, timeout: 10000, headers: headers,
                onload: r => {
                    // host que não implementa HEAD responde 405/501 pra QUALQUER caminho — inútil pra diagnóstico.
                    // Repete pedindo 1 byte por GET (Range), que é o mínimo pra ler o status verdadeiro.
                    if (method === 'HEAD' && (r.status === 405 || r.status === 501)) { ask('GET', { Range: 'bytes=0-0' }); return; }
                    done(r.status || 0);
                },
                onerror: () => done(0), ontimeout: () => done(0),
            });
            ask('HEAD', {});
        }), box, () => {});
    }
    // url = destino real (a caixa INTEIRA é o link) · opts.aspect = "W / H" p/ manter o tamanho que a mídia tinha
    // · opts.media = true → ocupa a largura do bloco (lugar de player/embed) em vez do tamanho compacto de imagem solta
    // · opts.probeUrl = o que SONDAR, quando difere do que abrir: em jpg6 & cia o link é a PÁGINA do host (que
    //   responde 200 mesmo com a imagem apagada) e quem morreu é o arquivo — sondar a página daria um 200 mentiroso.
    function buildDeadBox(url, opts) {
        opts = opts || {};
        const a = document.createElement('a');
        a.className = 'smg-dead' + (opts.media ? ' smg-dead--media' : '');
        a.href = url || '#'; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.title = url || '';
        if (opts.aspect) a.style.aspectRatio = opts.aspect;
        let host = '';
        try { host = new URL(url, location.href).hostname.replace(/^www\./, ''); } catch (e) {}
        const code = document.createElement('span'); code.className = 'smg-dead-code';
        code.innerHTML = ICONS.warn;
        const num = document.createElement('b'); code.appendChild(num);
        const sub = document.createElement('span'); sub.className = 'smg-dead-sub';
        a.append(code, sub);
        const paint = st => {
            const r = (st === undefined) ? { code: '', why: 'unavailable' } : deadReason(st);
            num.textContent = r.code;
            sub.textContent = i18n(r.why) + (host ? ' · ' + host + ' ↗' : '');
        };
        paint(opts.status);   // pinta JÁ: com o status quando o caller já sabe (turbo confirma 404 por GET), genérico senão
        // opts.noProbe: quem já sabe que morreu mas cuja URL de destino responde 200 (redgifs = SPA, a página do
        // gif carrega mesmo com o gif apagado) — sondar ali só produziria um "200 · indisponível" mentiroso.
        const probeUrl = opts.probeUrl || url;
        if (opts.status === undefined && !opts.noProbe && probeUrl && /^https?:/i.test(probeUrl)) deadProbe(probeUrl, a, paint);
        return a;
    }

    // =========================================================
    // COMPONENTE: DROPDOWN MULTISELECT DE BADGES COM BUSCA INTERNA
    // Compacto, com pesquisa instantânea, categorias agrupadas/colapsáveis e pills
    // =========================================================
    function createBadgeMultiselect(opts) {
        opts = opts || {};
        const container = document.createElement('div');
        container.className = 'smg-multiselect-container';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'smg-multiselect-btn';
        btn.innerHTML =
            `<span class="smg-multiselect-btn-icon">${ICONS.filter || ICONS.sliders}</span>` +
            `<span class="smg-multiselect-btn-text">${opts.buttonLabel || i18n('Tags')}</span>` +
            `<span class="smg-multiselect-btn-badge" hidden>0</span>` +
            `<span class="smg-multiselect-btn-arrow">${svgIcon('<path d="m6 9 6 6 6-6"/>')}</span>`;
        container.appendChild(btn);

        const pop = document.createElement('div');
        pop.className = 'smg-multiselect-pop';
        pop.hidden = true;

        pop.innerHTML =
            `<div class="smg-multiselect-search-wrap">` +
                `<span class="smg-multiselect-search-icon">${ICONS.search}</span>` +
                `<input type="text" class="smg-multiselect-search" placeholder="${opts.placeholder || i18n('Search tags…')}" autocomplete="off" spellcheck="false">` +
                `<button type="button" class="smg-multiselect-clear-search" hidden>✕</button>` +
            `</div>` +
            `<div class="smg-multiselect-pills-bar" hidden>` +
                `<div class="smg-multiselect-pills"></div>` +
                `<button type="button" class="smg-multiselect-clear-all">${i18n('Clear all')}</button>` +
            `</div>` +
            `<div class="smg-multiselect-list"></div>`;
        container.appendChild(pop);

        const searchInput = pop.querySelector('.smg-multiselect-search');
        const clearSearchBtn = pop.querySelector('.smg-multiselect-clear-search');
        const pillsBar = pop.querySelector('.smg-multiselect-pills-bar');
        const pillsContainer = pop.querySelector('.smg-multiselect-pills');
        const clearAllBtn = pop.querySelector('.smg-multiselect-clear-all');
        const listContainer = pop.querySelector('.smg-multiselect-list');
        const btnBadge = btn.querySelector('.smg-multiselect-btn-badge');

        let currentBadges = opts.badges || [];
        const activeSet = opts.activeBadges || new Set();

        const updateBadgeCount = () => {
            const sz = activeSet.size;
            if (sz > 0) {
                btnBadge.textContent = String(sz);
                btnBadge.hidden = false;
                btn.classList.add('has-active');
                pillsBar.hidden = false;
            } else {
                btnBadge.hidden = true;
                btn.classList.remove('has-active');
                pillsBar.hidden = true;
            }
            renderPills();
        };

        const renderPills = () => {
            pillsContainer.innerHTML = '';
            activeSet.forEach(tagKey => {
                const b = currentBadges.find(x => (x.name || '').toLowerCase() === tagKey) || { name: tagKey, type: 'prefix' };
                const pill = document.createElement('span');
                pill.className = 'smg-multiselect-pill';
                pill.innerHTML = `<span>${(b.type === 'tag' ? '#' : '') + b.name}</span><button type="button" class="smg-multiselect-pill-del" data-tag="${tagKey}">✕</button>`;
                pill.querySelector('.smg-multiselect-pill-del').addEventListener('click', (e) => {
                    e.stopPropagation();
                    activeSet.delete(tagKey);
                    updateBadgeCount();
                    renderList();
                    if (opts.onChange) opts.onChange(activeSet);
                });
                pillsContainer.appendChild(pill);
            });
        };

        const renderList = () => {
            const q = (searchInput.value || '').trim().toLowerCase();
            listContainer.innerHTML = '';

            const groups = new Map();
            currentBadges.forEach(b => {
                const cat = (typeof getBadgeCategory === 'function') ? getBadgeCategory(b.name, b.type) : 'Outros & Tags';
                if (!groups.has(cat)) groups.set(cat, []);
                groups.get(cat).push(b);
            });

            let totalMatching = 0;

            groups.forEach((badgeList, catName) => {
                const filtered = badgeList.filter(b => !q || (b.name || '').toLowerCase().includes(q));
                if (!filtered.length) return;
                totalMatching += filtered.length;

                const grp = document.createElement('div');
                grp.className = 'smg-multiselect-group';

                const grpHeader = document.createElement('div');
                grpHeader.className = 'smg-multiselect-group-header';
                grpHeader.innerHTML = `<span class="smg-multiselect-group-title">${catName}</span>`;
                grpHeader.addEventListener('click', () => {
                    grp.classList.toggle('is-collapsed');
                });
                grp.appendChild(grpHeader);

                const grpItems = document.createElement('div');
                grpItems.className = 'smg-multiselect-group-items';

                filtered.forEach(b => {
                    const k = (b.name || '').toLowerCase();
                    const isChecked = activeSet.has(k);

                    const itemLabel = document.createElement('label');
                    itemLabel.className = 'smg-multiselect-item' + (isChecked ? ' is-checked' : '');

                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.checked = isChecked;
                    cb.addEventListener('change', () => {
                        if (cb.checked) activeSet.add(k);
                        else activeSet.delete(k);
                        itemLabel.classList.toggle('is-checked', cb.checked);
                        updateBadgeCount();
                        if (opts.onChange) opts.onChange(activeSet);
                    });

                    const chip = document.createElement('span');
                    chip.className = `smg-badge-chip ${b.className || ''}`;
                    if (b.style) chip.style.cssText = b.style;
                    chip.textContent = (b.type === 'tag' ? '#' : '') + b.name;

                    itemLabel.appendChild(cb);
                    itemLabel.appendChild(chip);
                    grpItems.appendChild(itemLabel);
                });

                grp.appendChild(grpItems);
                listContainer.appendChild(grp);
            });

            if (totalMatching === 0) {
                const empty = document.createElement('div');
                empty.className = 'smg-multiselect-empty';
                empty.textContent = i18n('No badges found.');
                listContainer.appendChild(empty);
            }
        };

        const toggleOpen = (open) => {
            const willOpen = open != null ? open : pop.hidden;
            pop.hidden = !willOpen;
            btn.classList.toggle('is-open', willOpen);
            if (willOpen) {
                renderList();
                updateBadgeCount();
                setTimeout(() => searchInput.focus(), 50);
            }
        };

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleOpen();
        });

        pop.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        searchInput.addEventListener('input', () => {
            clearSearchBtn.hidden = !searchInput.value;
            renderList();
        });

        clearSearchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            searchInput.value = '';
            clearSearchBtn.hidden = true;
            renderList();
            searchInput.focus();
        });

        clearAllBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            activeSet.clear();
            updateBadgeCount();
            renderList();
            if (opts.onChange) opts.onChange(activeSet);
        });

        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                toggleOpen(false);
            }
        });

        updateBadgeCount();

        container.container = container;
        container.updateBadges = (newBadges) => {
            currentBadges = newBadges || [];
            updateBadgeCount();
            if (!pop.hidden) renderList();
        };
        container.getActive = () => activeSet;
        container.reset = () => {
            activeSet.clear();
            updateBadgeCount();
            renderList();
        };

        return container;
    }

    // =========================================================
    // EMBED HELPERS (lazy IO, wrappers)
    // =========================================================
    let lazyEmbedIO = null;
    function getLazyEmbedIO() {
        return lazyEmbedIO || (lazyEmbedIO = makeLazyIO(el => { if (el._smgActivate) el._smgActivate(); }, { rootMargin: '4000px 0px' }));
    }

    function markG2wWrappers(roots) {
        eachIn(roots, '.generic2wide-iframe-div:not([data-g2w-up])', div => {
            div.dataset.g2wUp = '1';
            const w = div.closest('.bbWrapper, .message-userContent, .message-content');
            if (w) w.classList.add('smg-has-g2w');
        });
    }

    function isThreadPostElement(el) {
        if (!el || el.nodeType !== 1) return false;

        // 1. Rejeitar se for comentário ou estiver dentro de container de comentários
        if (el.closest && el.closest('.comment, .message-responseRow, .message-responses, .js-messageResponses, .js-commentsList, .smg-cc, .js-quickEditTargetComment')) {
            return false;
        }
        if (el.classList) {
            if (el.classList.contains('comment') ||
                el.classList.contains('message-responseRow') ||
                el.classList.contains('smg-cc') ||
                el.classList.contains('js-quickEditTargetComment') ||
                el.classList.contains('message-responses') ||
                el.classList.contains('comment-body')) {
                return false;
            }
        }

        // 2. Rejeitar se o ID ou data-content indicar comentário
        const dc = el.getAttribute ? (el.getAttribute('data-content') || '') : '';
        if (/comment/i.test(dc)) return false;
        const id = el.id || '';
        if (/comment/i.test(id)) return false;

        // 3. Rejeitar se estiver dentro de assinatura ou citação
        if (el.closest && el.closest('.message-signature, .bbCodeBlock--quote, .bbCodeQuote')) {
            return false;
        }

        // 4. Deve ser um post legítimo do XenForo
        const hasPostClass = el.classList && (el.classList.contains('message--post') || el.classList.contains('js-post'));
        const isArticleMessage = el.tagName === 'ARTICLE' && el.classList && el.classList.contains('message');
        const hasPostContent = /^post-\d+$/i.test(dc);

        // Se tiver js-post, precisa ser um container de mensagem de post real, não um wrapper genérico
        if (el.classList && el.classList.contains('js-post') && !el.classList.contains('message--post') && !isArticleMessage && !hasPostContent) {
            return false;
        }

        return !!(hasPostClass || isArticleMessage || hasPostContent);
    }

    if (typeof window !== 'undefined' && window.__TEST_MODE__) {
        window.__extractCleanTitleAndPrefixes = extractCleanTitleAndPrefixes;
        window.__structItemTs = structItemTs;
        window.__fetchDoc = fetchDoc;
        window.__b64decode = b64decode;
        window.__rawParam = rawParam;
        window.__decodeProxyHref = decodeProxyHref;
        window.__resolveProxyHref = resolveProxyHref;
        window.__absUrl = absUrl;
        window.isThreadPostElement = isThreadPostElement;
        window.indexFollowedThumbs = indexFollowedThumbs;
        window.followedThumbsMap = followedThumbsMap;
        window.thumbCacheGet = thumbCacheGet;
        window.__helpersExports = Object.assign(window.__helpersExports || {}, {
            indexFollowedThumbs,
            followedThumbsMap,
            thumbCacheGet
        });
    }
