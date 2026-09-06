    // =========================================================
    // FEATURES definidas tarde no arquivo + safe(). O INIT de verdade
    // (processAll / scheduleRun / boot) está logo abaixo, no part 22-init.
    //
    // Mapa: safe · setFavicon(SMG) · redirect-unwrap (b64decode/decodeProxyHref/bindProxyClick) ·
    //   reveal-liked(SMG) · saint embeds · download (smgDownload/downloadAllMedia) ·
    //   direct-media (processDirectMedia) · group-links (groupPostLinks)
    // =========================================================
    // RESILIÊNCIA: roda um passo sem deixar um erro de UMA feature derrubar as outras
    // (se o XF/UIX mudar um seletor, só aquela feature falha — o resto da página segue de pé).
    function safe(fn, roots) { try { fn(roots); } catch (e) { if (window.console && console.warn) console.warn('[smg] feature error:', (fn && fn.name) || '', e); } }

    // troca a favicon nativa pela marca SMG (remove os <link rel=icon> nativos e põe o nosso).
    // idempotente + auto-cura: se sumir o nosso, recoloca (e tira os nativos de novo).
    function setFavicon() {
        if (!document.documentElement.classList.contains('smg-smg')) return; // SMG only por enquanto
        if (!document.head || document.getElementById('smg-favicon')) return;
        document.querySelectorAll('link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').forEach(l => l.remove());
        const link = document.createElement('link');
        link.id = 'smg-favicon'; link.rel = 'icon'; link.type = 'image/svg+xml'; link.href = SMG_FAVICON;
        document.head.appendChild(link);
    }

    // =========================================================
    // FEATURE: pular o aviso de link externo (URL real direto)
    // SMG: /goto/link-confirmation?url=<base64> · Simp: /redirect/?to=<base64url>&m=b64
    // =========================================================
    // base64 std OU url-safe → string (tolerante); e leitura de query SEM o +→espaço do URLSearchParams
    function b64decode(s) {
        if (!s) return null;
        for (const t of [s, s.replace(/-/g, '+').replace(/_/g, '/')]) { try { const r = atob(t); if (r) return r; } catch (e) {} }
        return null;
    }
    function rawParam(href, key) {
        const m = (href || '').match(new RegExp('[?&]' + key + '=([^&]+)'));
        if (!m) return null;
        try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; }
    }
    function decodeProxyHref(href) {
        if (/\/goto\/link-confirmation/.test(href)) return b64decode(rawParam(href, 'url'));
        let to = rawParam(href, 'to');
        if (to && /[?&]m=b64/.test(href)) to = b64decode(to);
        return to;
    }
    // VISUAL: no TEXTO mostrado (título de unfurl / link cru), troca a URL-proxy (/goto/link-confirmation?url=.. ou
    // /redirect/?to=..) pelo DESTINO real. O unwrap só reescrevia o href; o texto continuava com o /goto/...&s=hash feio.
    // Decodifica CADA ocorrência (decodeProxyHref) → vários links no mesmo nó OK; o que não decodifica fica intacto.
    function unproxyText(root) {
        if (!root || root.nodeType !== 1) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        const hits = [];
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            const v = n.nodeValue || '';
            if (v.indexOf('/goto/link-confirmation?url=') >= 0 || v.indexOf('/redirect/?to=') >= 0) hits.push(n);
        }
        if (!hits.length) return;
        const rx = /(?:https?:\/\/[^\s"'<>]*)?\/(?:goto\/link-confirmation\?url=|redirect\/\?to=)[^\s"'<>]+/g;
        hits.forEach(t => { t.nodeValue = t.nodeValue.replace(rx, m => { const r = decodeProxyHref(m); return (r && /^https?:/i.test(r)) ? r : m; }); });
    }
    // clique em CAPTURE phase: roda ANTES do handler do XF (link proxy) e força a navegação com
    // stopImmediatePropagation → o handler do XF que matava o clique nunca dispara. Não depende de
    // remover attrs/listener (frágil); o reescrever do href abaixo é só pro hover/"copiar link".
    // desarma o link-proxy do XF num <a>: se o destino real só existe no data-proxy-href, ele passa a ser
    // o href; depois o atributo sai (é o gatilho do handler nativo que abre/fecha a guia).
    function unproxyAttr(a) {
        const p = a.getAttribute('data-proxy-href') || '';
        const cur = a.getAttribute('href') || '';
        if (!/^https?:/i.test(cur)) {                       // href não é o destino → tenta o do atributo
            const real = /^https?:/i.test(p) ? p : decodeProxyHref(p);
            if (real && /^https?:/i.test(real)) a.setAttribute('href', real);
        }
        a.removeAttribute('data-proxy-href');
    }
    let proxyClickBound = false;
    function bindProxyClick() {
        if (proxyClickBound) return;
        proxyClickBound = true;
        // no WINDOW em capture: roda ANTES de qualquer listener de document (o XF tem um handler de
        // capture no document que dá preventDefault e matava o clique). NÃO checamos e.defaultPrevented
        // de propósito — navegamos mesmo que o XF já tenha dado preventDefault.
        window.addEventListener('click', e => {
            if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;  // deixa ctrl/⌘/middle-clique abrir aba nativamente
            const a = e.target.closest && e.target.closest('a[data-smg-unwrap], a[data-proxy-href], a[href*="/goto/link-confirmation?url="], a[href*="/redirect/?to="]');
            if (!a) return;
            // data-proxy-href: é POR ELE que a JS de link-proxy do XF sequestra o clique e abre o destino
            // noutra guia. Quando vem VAZIO (visto no SMG), ela abre uma guia em branco — que fecha sozinha
            // logo depois. Tirar o atributo devolve o clique pro href real e mata o sintoma na origem.
            if (a.hasAttribute('data-proxy-href')) unproxyAttr(a);
            const real = a.dataset.smgUnwrap ? a.href : decodeProxyHref(a.getAttribute('href') || '');  // já reescrito → href é o real
            if (!real || !/^https?:/i.test(real)) return;
            // garante o href real e MATA o handler do XF — mas NÃO damos preventDefault: a navegação NATIVA
            // do link segue (abre target=_blank sem popup-block, que era o que travava no SMG).
            if (a.getAttribute('href') !== real) a.setAttribute('href', real);
            a.dataset.smgUnwrap = '1';
            e.stopImmediatePropagation();
            if (e.defaultPrevented) {   // se algo já barrou o default antes de nós, aí sim navega na mão
                if (a.target === '_blank') window.open(real, '_blank', 'noopener'); else location.assign(real);
            }
        }, true);
    }
    function unwrapRedirectLinks(roots) {
        bindProxyClick();
        // PERF: `a[href*=...]` é seletor de substring de atributo (NÃO indexado) → varrer o doc inteiro todo frame
        // percorre TODOS os <a>. Escopado nos subtrees mutados (eachIn) sai ~0 no steady-state. O clique em link
        // não-reescrito ainda é garantido pelo capture do bindProxyClick; o full-scan periódico pega o que faltar.
        eachIn(roots, 'a[href*="/goto/link-confirmation?url="]:not([data-smg-unwrap]), a[href*="/redirect/?to="]:not([data-smg-unwrap]), a[data-proxy-href]:not([data-smg-unwrap])', a => {
            a.dataset.smgUnwrap = '1';
            const real = decodeProxyHref(a.getAttribute('href') || '');
            if (real && /^https?:/i.test(real)) a.href = real;   // hover/"copiar link" mostram a URL real; o clique é garantido pelo capture
            if (a.hasAttribute('data-proxy-href')) unproxyAttr(a);   // desarma o link-proxy do XF (guia em branco que abre e fecha)
            unproxyText(a);   // VISUAL: título do unfurl / texto = /goto/...&s=hash → mostra a URL real decodificada
        });
    }
    // se o usuário CAIR direto na página de aviso, pula pro destino na hora
    function handleRedirectPage() {
        try {
            if (/\/redirect\//.test(location.pathname)) {
                const t = document.querySelector('.simpLinkProxy-targetLink');
                if (t && t.href) { location.replace(t.href); return; }
            }
            if (/\/goto\/link-confirmation/.test(location.pathname)) {
                const real = b64decode(rawParam(location.search, 'url'));
                if (real && /^https?:/i.test(real)) location.replace(real);
            }
        } catch (e) {}
    }

    // =========================================================
    // FEATURE (SMG): posts travados por "React with Like/Medal" — após reagir, re-busca a
    // página e troca o conteúdo escondido pelo real. Espera a reação registrar (retry curto)
    // → corrige o race do setTimeout(1,...) do script original + match de texto frágil.
    // =========================================================
    function mainBody(scope) {
        return scope && (scope.querySelector('.message-userContent .bbWrapper') || scope.querySelector('.message-body .bbWrapper') || scope.querySelector('.bbWrapper'));
    }
    function revealLikedPosts(roots) {
        if (!document.documentElement.classList.contains('smg-smg')) return;   // padrão é do SMG
        eachIn(roots, '.message[data-content]:not([data-smg-reveal])', post => {
            post.dataset.smgReveal = '1';   // marca ANTES dos checks (REGRA DE OURO): post sem .hidethanks (maioria) saía sem marca e era re-varrido em todo full-scan
            const hide = post.querySelector('.hidethanks');
            if (!hide || !/react|like|medal|refresh/i.test(hide.textContent || '')) return;
            const reaction = post.querySelector('.message-actionBar .reaction, .actionBar-action.reaction');
            if (!reaction) return;
            reaction.addEventListener('click', () => revealPost(post, 0));
        });
    }
    function revealPost(post, attempt) {
        if (attempt === 0) {
            if (post.dataset.smgRevealing) return;
            post.dataset.smgRevealing = '1';
            markRevealing(post, true);
        }
        const dc = post.getAttribute('data-content') || '';
        const sel = '[data-content="' + (window.CSS && CSS.escape ? CSS.escape(dc) : dc) + '"]';
        setTimeout(() => {
            if (!post.isConnected) return;   // usuário navegou / o post sumiu durante a espera → não busca a página (já é outra) nem re-tenta
            fetchDoc(location.href, { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
                .then(doc => {
                    const fresh = mainBody(doc.querySelector(sel));
                    const stillHidden = !fresh || fresh.querySelector('.hidethanks');
                    if (!stillHidden) {
                        const cur = mainBody(post);
                        if (cur) { cur.replaceWith(fresh); scheduleRun(); }   // reprocessa imagens/embeds do conteúdo novo
                        markRevealing(post, false); delete post.dataset.smgRevealing;
                    } else if (attempt < 3) {
                        revealPost(post, attempt + 1);
                    } else {
                        markRevealing(post, false); delete post.dataset.smgRevealing;
                    }
                })
                .catch(() => { markRevealing(post, false); delete post.dataset.smgRevealing; });
        }, 1400);
    }
    function markRevealing(post, on) {
        const host = post.querySelector('.hidethanks') || mainBody(post) || post;
        let s = post.querySelector('.smg-reveal-spin');
        if (on && !s) { s = document.createElement('div'); s.className = 'smg-loading smg-reveal-spin'; host.appendChild(s); }
        else if (!on && s) s.remove();
    }

    // =========================================================
    // CROSS-SITE search: ao abrir o outro fórum com #smg-xsearch={json}, roda a MESMA busca aqui (POST com o token DESTE site).
    //   (o botão ↗ de cada linha do histórico abre simpcity ↔ socialmediagirls passando esse hash)
    // =========================================================
    function handleCrossSiteSearch() {
        const m = (location.hash || '').match(/[#&]smg-xsearch=([^&]+)/);
        if (!m) return;
        let p; try { p = JSON.parse(decodeURIComponent(m[1])); } catch (e) { return; }
        if (!p || (!p.q && !p.by)) return;
        try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}   // limpa o hash da URL
        const qsForm = document.querySelector('form[data-xf-init="quick-search"]');
        const action = qsForm?.getAttribute('action') || '/search/search';
        const token = qsForm?.querySelector('input[name="_xfToken"]')?.value
            || document.querySelector('input[name="_xfToken"]')?.value || '';
        const fields = [['keywords', p.q || ''], ['_xfToken', token]];
        if (p.threads) fields.push(['search_type', 'thread']);
        if (p.titles) fields.push(['c[title_only]', '1']);
        if (p.by) fields.push(['c[users]', p.by]);
        if (p.order === 'date') fields.push(['order', 'date']);
        postForm(action, fields);
    }



    // =========================================================
    // FEATURE: botão "baixar toda a mídia do post" na action bar (GM_download + fallback)
    // =========================================================
    function smgDownload(url, name) {
        if (typeof GM_download === 'function') {
            try { GM_download({ url, name, onerror: () => window.open(url, '_blank', 'noopener'), ontimeout: () => window.open(url, '_blank', 'noopener') }); return; } catch (e) {}
        }
        window.open(url, '_blank', 'noopener');
    }
    function collectPostMedia(body) {
        const urls = new Set();
        body.querySelectorAll('img.bbImage').forEach(img => {
            const a = img.closest('a[href]');
            const linkUrl = a && a.getAttribute('href');
            const u = (linkUrl && /\.(jpe?g|png|gif|webp|avif)(\?|#|$)/i.test(linkUrl)) ? a.href : (img.dataset.smgFull || img.currentSrc || img.src);
            if (u && /^https?:/i.test(u)) urls.add(getBigUrl(u));
        });
        body.querySelectorAll('video[src], video source[src]').forEach(v => {
            const u = v.src || v.getAttribute('src');
            if (u && /^https?:/i.test(u)) urls.add(u);
        });
        return [...urls];
    }
    function filenameFromUrl(url) {
        let n = (url.split('/').pop() || 'media').split(/[?#]/)[0] || 'media';
        try { n = decodeURIComponent(n); } catch (e) {}
        if (!/\.[a-z0-9]{2,4}$/i.test(n)) n += '.jpg';
        return n;
    }
    // baixa TODA a mídia carregada na página (todos os posts) — acionado pelo botão central da dock
    function downloadAllMedia(btn) {
        if (btn.dataset.busy) return;
        const urls = collectPostMedia(document.body);
        if (!urls.length) { dockBadge(btn, '0'); setTimeout(() => dockBadge(btn, ''), 1500); return; }
        const list = urls.slice(0, 100);   // cap p/ não martelar o host
        if (list.length > 30 && !confirm(i18n('Download media') + ' (' + list.length + ')?')) return;
        btn.dataset.busy = '1'; btn.classList.add('smg-dl-busy');
        let i = 0;
        const step = () => {
            if (i >= list.length) { btn.classList.remove('smg-dl-busy'); delete btn.dataset.busy; dockBadge(btn, '✓'); setTimeout(() => dockBadge(btn, ''), 2200); return; }
            smgDownload(list[i], filenameFromUrl(list[i]));
            i++;
            dockBadge(btn, String(list.length - i));   // contagem regressiva do que falta
            setTimeout(step, 350);   // ~3/s
        };
        step();
    }
    function dockBadge(btn, text) {
        const host = btn.querySelector('.smg-nav-ico') || btn;
        let b = host.querySelector(':scope > .smg-nav-badge');
        if (!text) { if (b) b.remove(); return; }
        if (!b) { b = document.createElement('span'); b.className = 'smg-nav-badge'; host.appendChild(b); }
        b.textContent = text;
    }

    // =========================================================
    // DOWNLOADER: modal de confirmação · varre a THREAD INTEIRA (segue o "Next" do paginador) · ZIP (JS puro) ·
    // resolve pixeldrain pela API · gofile/bunkr/cyberdrop/etc. vão num links.txt (resolver por host = próximo passo).
    // =========================================================
    function dlGmGet(opts) {   // GM_xmlhttpRequest → Promise, com BACKSTOP manual (nunca deixa um worker travar)
        return new Promise((resolve, reject) => {
            if (typeof GM_xmlhttpRequest !== 'function') { reject(new Error('GMX off')); return; }
            const tmo = opts.timeout || 30000;
            let settled = false;
            const ok = r => { if (settled) return; settled = true; clearTimeout(guard); resolve(r); };
            const bad = m => { if (settled) return; settled = true; clearTimeout(guard); reject(new Error(m)); };
            const guard = setTimeout(() => bad('stall'), tmo + 3000);   // se o GMX não disparar callback nenhum (CDN gotejando), aborta aqui
            try { GM_xmlhttpRequest(Object.assign({ method: 'GET', timeout: tmo }, opts, { onload: ok, onerror: () => bad('net'), ontimeout: () => bad('timeout') })); }
            catch (e) { bad((e && e.message) || 'err'); }
        });
    }
    // Referer correto por host (hotlink): redgifs/turbo precisam do próprio; imagem do fórum usa o fórum
    function dlReferer(url) {
        if (/redgifs/i.test(url)) return 'https://www.redgifs.com/';
        if (/turbo|turbocdn|saint/i.test(url)) return 'https://turbo.cr/';
        return location.origin + '/';
    }
    // ZIP em JS PURO (STORE, sem compressão) — o generateAsync do JSZip travava no sandbox do Tampermonkey.
    const DL_CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
    function dlCrc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = DL_CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
    function dlBuildZip(entries) {   // entries: [{ name, bytes:Uint8Array }] → Blob (síncrono)
        const enc = new TextEncoder();
        const u16 = n => [n & 255, (n >>> 8) & 255];
        const u32 = n => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
        const parts = [], central = []; let offset = 0; const FLAGS = 0x0800;   // nome UTF-8
        entries.forEach(e => {
            const nm = enc.encode(e.name), crc = dlCrc32(e.bytes), sz = e.bytes.length;
            const lfh = new Uint8Array([].concat(u32(0x04034b50), u16(20), u16(FLAGS), u16(0), u16(0), u16(0x21), u32(crc), u32(sz), u32(sz), u16(nm.length), u16(0)));
            parts.push(lfh, nm, e.bytes);
            central.push(new Uint8Array([].concat(u32(0x02014b50), u16(20), u16(20), u16(FLAGS), u16(0), u16(0), u16(0x21), u32(crc), u32(sz), u32(sz), u16(nm.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset))), nm);
            offset += lfh.length + nm.length + sz;
        });
        let cdSize = 0; central.forEach(c => cdSize += c.length);
        const eocd = new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length), u32(cdSize), u32(offset), u16(0)));
        return new Blob(parts.concat(central, [eocd]), { type: 'application/zip' });
    }
    // hosts de arquivo/galeria reconhecidos (casa o host EM QUALQUER LUGAR da URL decodificada — robusto a parse)
    const DL_EXT = [
        { key: 'pixeldrain', label: 'Pixeldrain', re: /\/\/(?:[a-z0-9-]+\.)?pixeldrain\.com\b/i },
        { key: 'gofile', label: 'GoFile', re: /\/\/(?:[a-z0-9-]+\.)?gofile\.io\b/i },
        { key: 'filester', label: 'Filester', re: /\/\/(?:[a-z0-9-]+\.)?filester\.[a-z]+\b/i },
        { key: 'bunkr', label: 'Bunkr', re: /\/\/(?:[a-z0-9-]+\.)?bunkr[a-z]*\.[a-z]+\b/i },
        { key: 'cyberdrop', label: 'Cyberdrop', re: /\/\/(?:[a-z0-9-]+\.)?cyberdrop\.[a-z]+\b/i },
        { key: 'cyberfile', label: 'Cyberfile', re: /\/\/(?:[a-z0-9-]+\.)?cyberfile\.[a-z]+\b/i },
        { key: 'saint', label: 'Saint/Turbo', re: /\/\/(?:[a-z0-9-]+\.)?(saint2?\.(su|to)|turbo\.cr)\b/i },
        { key: 'erome', label: 'Erome', re: /\/\/(?:[a-z0-9-]+\.)?erome\.com\b/i },
        { key: 'jpghost', label: 'JPG host', re: /\/\/(?:[a-z0-9-]+\.)?(jpg\d?\.(church|su|fish|pet|fishing|homes)|jpeg\.pet|host\.church)\b/i },
        { key: 'imgbox', label: 'ImgBox', re: /\/\/(?:[a-z0-9-]+\.)?imgbox\.com\b/i },
        { key: 'pixhost', label: 'PixHost', re: /\/\/(?:[a-z0-9-]+\.)?pixhost\.(?:to|cc|se|st)\b/i },
        { key: 'imagebam', label: 'ImageBam', re: /\/\/(?:[a-z0-9-]+\.)?imagebam\.com\b/i },
        { key: 'ibb', label: 'ImgBB', re: /\/\/(?:[a-z0-9-]+\.)?ibb\.co\b/i },
        { key: 'pixl', label: 'Pixl', re: /\/\/(?:[a-z0-9-]+\.)?pixl\.(is|li)\b/i },
        { key: 'imgkiwi', label: 'Img.Kiwi', re: /\/\/(?:[a-z0-9-]+\.)?img\.kiwi\b/i },
        { key: 'mega', label: 'MEGA', re: /\/\/(?:[a-z0-9-]+\.)?mega\.(nz|io)\b/i },
    ];
    // links que NÃO são arquivo (socials/nav) → ignora no balde "Outros"
    const DL_SKIP = /(^|\.)(onlyfans\.com|fansly\.com|fans\.ly|twitter\.com|x\.com|instagram\.com|tiktok\.com|reddit\.com|youtube\.com|youtu\.be|patreon\.com|t\.me|telegram\.me|telegram\.org|discord\.(gg|com)|google\.com|facebook\.com|linktr\.ee|beacons\.ai|throne\.com|amazon\.|wikipedia\.org|imdb\.com)$/i;
    function dlScanDoc(doc, acc, seen) {
        const skip = el => el.closest('.bbCodeQuote, .message-signature');
        const fh = location.hostname.toLowerCase();
        const isMedia = u => /\.(jpe?g|png|gif|webp|avif|bmp|mp4|webm|mov|m4v|mkv)(\?|#|$)/i.test(u);
        const addImg = u => { u = getBigUrl(absUrl(u)); if (/^https?:/i.test(u) && !seen.has(u)) { seen.add(u); acc.images.push(u); } };
        const addVid = u => { u = absUrl(u); if (/^https?:/i.test(u) && !seen.has(u)) { seen.add(u); acc.videos.push(u); } };
        const addLink = raw => {
            const u = absUrl(decodeProxyHref(raw) || raw);   // DECODIFICA o proxy do fórum (/goto, /redirect) → URL real
            if (!/^https?:/i.test(u)) return;
            let host; try { host = new URL(u).hostname.toLowerCase(); } catch (e) { return; }
            if (host && (host === fh || host.endsWith('.' + fh) || fh.endsWith('.' + host))) return;   // link interno do fórum
            if (isMedia(u)) return;                                                            // imagem/vídeo DIRETO → já entra como mídia
            if (seen.has(u)) return;
            const k = DL_EXT.find(h => h.re.test(u));                                          // casa o host de arquivo na URL TODA
            if (!k && (!host || DL_SKIP.test(host))) return;                                   // social/nav OU host inválido → ignora
            seen.add(u);
            acc.links.push({ host: k ? k.key : 'other', label: k ? k.label : (IS_PT ? 'Outros' : 'Other'), url: u });
        };
        doc.querySelectorAll('img.bbImage').forEach(img => {
            if (skip(img)) return;
            const a = img.closest('a[href]'); const href = a && a.getAttribute('href');
            if (href && /\.(jpe?g|png|gif|webp|avif|bmp)(\?|#|$)/i.test(href)) addImg(href);
            else addImg(img.getAttribute('data-src') || img.getAttribute('data-url') || img.getAttribute('src') || '');
        });
        doc.querySelectorAll('video[src], video source[src]').forEach(el => { if (!skip(el)) addVid(el.getAttribute('src')); });
        doc.querySelectorAll('a[href$=".mp4"], a[href$=".webm"], a[href$=".mov"]').forEach(el => { if (!skip(el)) addVid(el.getAttribute('href')); });
        // links externos: cards unfurl (data-url REAL) + TODAS as âncoras (decodificando o proxy)
        doc.querySelectorAll('.bbCodeBlock--unfurl[data-url]').forEach(c => { if (!skip(c)) addLink(c.getAttribute('data-url') || ''); });
        doc.querySelectorAll('a[href]').forEach(a => { if (!skip(a)) addLink(a.getAttribute('href') || ''); });
        // embeds de vídeo (redgifs/turbo/saint): NÓS já resolvemos pro player → dá pra baixar o mp4. Reusa collectMediaFrom.
        try { collectMediaFrom(doc).forEach(it => { if (it.type === 'embed' && /redgifs\.com|turbo\.cr|saint2?\.su/i.test(it.url) && !seen.has(it.url)) { seen.add(it.url); acc.embeds.push(it.url); } }); } catch (e) {}
    }
    async function dlScanThread(onProgress) {
        const acc = { images: [], videos: [], links: [], embeds: [] };
        const seen = new Set();
        const pj = readPageJump();
        if (!pj) { dlScanDoc(document, acc, seen); return acc; }   // thread de página única
        let url = pj.tpl.replace('%page%', '1'), guard = 0;        // começa da pág. 1 e segue o Next (robusto)
        while (url && guard++ < 600) {
            let doc;
            try { doc = await fetchDoc(url, { credentials: 'same-origin' }); } catch (e) { break; }
            dlScanDoc(doc, acc, seen);
            if (onProgress) onProgress(guard, pj.max || guard);
            const nx = doc.querySelector('.pageNav-jump--next, .pageNavSimple-el--next');
            url = nx ? absUrl(nx.getAttribute('href')) : null;
        }
        return acc;
    }
    async function dlResolvePixeldrain(link) {   // lista (/l/, /api/list/) ou arquivo (/u/ /d/ /file/ /api/file/ ou id solto) → [{url, name}]
        const l = link.match(/pixeldrain\.com\/(?:l|api\/list)\/([a-z0-9]+)/i);
        if (l) { try { const r = await dlGmGet({ url: 'https://pixeldrain.com/api/list/' + l[1] }); const j = JSON.parse(r.responseText || '{}'); const fs = (j.files || []).map(x => ({ url: 'https://pixeldrain.com/api/file/' + x.id + '?download', name: x.name || null })); if (fs.length) return fs; } catch (e) {} }
        const f = link.match(/pixeldrain\.com\/(?:u|d|file|api\/file)\/([a-z0-9]+)/i) || link.match(/pixeldrain\.com\/([a-z0-9]{6,})(?:[/?#]|$)/i);
        if (f) return [{ url: 'https://pixeldrain.com/api/file/' + f[1] + '?download', name: null }];
        return [];
    }
    function dlThreadName() {
        const t = ((document.querySelector('.p-title-value') || {}).textContent || document.title || 'thread');
        return (t.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)) || 'thread';
    }
    function dlSaveBlob(blob, name) {
        try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = name; a.rel = 'noopener'; a.style.display = 'none';
            document.body.appendChild(a); a.click();
            setTimeout(() => { try { a.remove(); URL.revokeObjectURL(url); } catch (e) {} }, 20000);   // NÃO remover/revogar na hora (cancela o download)
        } catch (e) {
            try { window.open(URL.createObjectURL(blob), '_blank'); } catch (e2) {}   // fallback: abre o blob (salva manual)
        }
    }
    async function dlRunZip(files, unresolved, setProg) {
        const used = new Set();
        const nameFor = (url, name) => { let n = name || filenameFromUrl(url); const base = n; let i = 1; while (used.has(n)) n = base.replace(/(\.[^.]+)?$/, '_' + (i++) + '$1'); used.add(n); return n; };
        const entries = []; let done = 0, added = 0; const total = files.length; const queue = files.slice();
        const worker = async () => { while (queue.length) { const it = queue.shift(); try { const r = await dlGmGet({ url: it.url, responseType: 'arraybuffer', headers: { Referer: dlReferer(it.url) } }); const buf = r.response; if (buf && buf.byteLength > 200) { entries.push({ name: nameFor(it.url, it.name), bytes: new Uint8Array(buf) }); added++; } } catch (e) {} setProg(++done, total, i18n('Fetching…')); } };
        await Promise.all(Array.from({ length: 4 }, worker));
        if (unresolved.length) entries.push({ name: 'links.txt', bytes: new TextEncoder().encode(unresolved.join('\n')) });
        if (!entries.length) throw new Error('0 baixados (fetch falhou)');
        setProg(total, total, i18n('Zipping…'));
        dlSaveBlob(dlBuildZip(entries), dlThreadName() + '.zip');   // monta o zip SÍNCRONO (sem JSZip) + baixa
        return added;
    }
    async function dlRunFiles(files, unresolved, setProg) {
        let done = 0; const total = files.length;
        for (const it of files) { smgDownload(it.url, it.name || filenameFromUrl(it.url)); setProg(++done, total); await new Promise(r => setTimeout(r, 400)); }
        if (unresolved.length) dlSaveBlob(new Blob([unresolved.join('\n')], { type: 'text/plain' }), dlThreadName() + '_links.txt');
        return total;
    }
    function openDownloadModal() {
        if (document.getElementById('smg-dl-modal')) return;
        const ov = document.createElement('div'); ov.id = 'smg-dl-modal';
        ov.innerHTML =
            '<div class="smg-dl-card">' +
                '<div class="smg-dl-head"><span class="smg-dl-title">' + i18n('Download media') + '</span>' +
                    '<button type="button" class="smg-dl-x" aria-label="Close">' + ICONS.close + '</button></div>' +
                '<div class="smg-dl-body">' +
                    '<div class="smg-dl-scan"><span class="smg-dl-spin"></span><span class="smg-dl-scantxt">' + i18n('Scanning thread…') + '</span></div>' +
                    '<div class="smg-dl-summary" hidden></div>' +
                    '<div class="smg-dl-progress" hidden><div class="smg-dl-bar"><span></span></div><div class="smg-dl-progtxt"></div></div>' +
                '</div>' +
                '<div class="smg-dl-foot" hidden>' +
                    '<button type="button" class="smg-dl-btn smg-dl-files">' + i18n('Download files') + '</button>' +
                    '<button type="button" class="smg-dl-btn smg-dl-zip">' + i18n('Download ZIP') + '</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(ov);
        const close = () => ov.remove();
        ov.querySelector('.smg-dl-x').addEventListener('click', close);
        ov.addEventListener('click', e => { if (e.target === ov) close(); });
        document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { if (document.getElementById('smg-dl-modal')) close(); document.removeEventListener('keydown', esc); } });

        const $ = s => ov.querySelector(s);
        let media = null;
        dlScanThread((page, total) => { $('.smg-dl-scantxt').textContent = i18n('Scanning thread…') + ' (' + page + '/' + total + ')'; })
            .then(acc => {
                media = acc; $('.smg-dl-scan').hidden = true;
                const byHost = {}; acc.links.forEach(l => { byHost[l.label] = (byHost[l.label] || 0) + 1; });
                const hostStr = Object.keys(byHost).map(k => k + ': ' + byHost[k]).join(' · ');
                const sum = $('.smg-dl-summary'); sum.hidden = false;
                const nVid = acc.videos.length + acc.embeds.length;   // vídeos diretos + embeds (redgifs/turbo/saint) que resolvemos
                if (!acc.images.length && !nVid && !acc.links.length) { sum.innerHTML = '<div class="smg-dl-empty">' + i18n('Nothing to download') + '</div>'; return; }
                sum.innerHTML =
                    '<div class="smg-dl-stat"><b>' + acc.images.length + '</b> ' + i18n('images') + '</div>' +
                    '<div class="smg-dl-stat"><b>' + nVid + '</b> ' + i18n('videos') + '</div>' +
                    (acc.links.length ? '<div class="smg-dl-stat"><b>' + acc.links.length + '</b> ' + i18n('external links') + (hostStr ? ' <span class="smg-dl-hosts">(' + hostStr + ')</span>' : '') + '</div>' : '') +
                    (acc.images.length + nVid > 350 ? '<div class="smg-dl-warn">' + i18n('Many files — ZIP may be heavy; "Download files" is lighter.') + '</div>' : '');
                $('.smg-dl-foot').hidden = false;
            })
            .catch(() => { $('.smg-dl-scan').hidden = true; const sum = $('.smg-dl-summary'); sum.hidden = false; sum.innerHTML = '<div class="smg-dl-empty">' + i18n('Scan failed') + '</div>'; });

        const run = async asZip => {
            if (!media) return;
            $('.smg-dl-foot').hidden = true; $('.smg-dl-summary').hidden = true; $('.smg-dl-progress').hidden = false;
            const bar = $('.smg-dl-bar span'), txt = $('.smg-dl-progtxt');
            const setProg = (done, total, label) => { bar.style.width = (total ? Math.round(done / total * 100) : 0) + '%'; txt.textContent = (label || i18n('Downloading…')) + ' ' + done + '/' + total; };
            txt.textContent = i18n('Resolving…');
            const files = []; const unresolved = [];
            media.images.forEach(u => files.push({ url: u, name: null }));
            media.videos.forEach(u => files.push({ url: u, name: null }));
            // resolve os embeds (redgifs) pro mp4 — reusa os resolvers do nosso player
            for (let i = 0; i < media.embeds.length; i++) {
                txt.textContent = i18n('Resolving videos…') + ' ' + (i + 1) + '/' + media.embeds.length;
                const emb = media.embeds[i];
                try {
                    let mp4 = null;
                    if (/redgifs/i.test(emb)) { const id = rgIdFrom(emb); if (id) { const r = await rgVideo(id); mp4 = r && (r.hd || r.sd); } }
                    else { mp4 = null; }
                    if (mp4) { const id = (/redgifs/i.test(emb) ? rgIdFrom(emb) : (emb.match(/\/embed\/([^/?#]+)/) || [])[1]) || 'video'; files.push({ url: mp4, name: id + '.mp4' }); }
                    else unresolved.push(emb);
                } catch (e) { unresolved.push(emb); }
            }
            for (const l of media.links) {
                if (l.host === 'pixeldrain') { const r = await dlResolvePixeldrain(l.url); if (r.length) r.forEach(x => files.push(x)); else unresolved.push(l.url); }
                else unresolved.push(l.url);
            }
            try {
                const n = asZip ? await dlRunZip(files, unresolved, setProg) : await dlRunFiles(files, unresolved, setProg);
                txt.textContent = i18n('Done') + ' ✓ — ' + (n != null ? n : files.length) + ' ' + i18n('files');
            } catch (e) { txt.textContent = i18n('Download failed') + (e && e.message ? ' — ' + e.message : ''); $('.smg-dl-foot').hidden = false; }
        };
        $('.smg-dl-zip').addEventListener('click', () => run(true));
        $('.smg-dl-files').addEventListener('click', () => run(false));
    }

    // =========================================================
    // FEATURE: embed de mídia DIRETA (susercontent/Shopee e afins). .mp4/.webm → <video>; imagem → <img>.
    // São URLs diretas (sem página) → só envolve no elemento certo. Imagem entra no pipeline.
    // =========================================================
    // FILEDITCH: NÃO tem mais player. Tentamos os dois caminhos — raspar a página-viewer pelo <source> temp
    // assinado e tocar o arquivo direto — e os dois morrem no host: ele responde 200 com uma PÁGINA HTML no
    // lugar do vídeo (anti-hotlink) e às vezes 502, então sobrava spinner eterno ou download do arquivo
    // inteiro à toa. Agora o link vira CARD (FH_PROVIDERS: 'fileditch'), igual filester/gofile: visível e
    // clicável. Se um dia o host liberar o hotlink, o caminho de volta é reinstalar este pass.
    function processDirectMedia(roots) {
        eachIn(roots, 'a[href*="susercontent.com"]:not([data-dm-processed]), a[href$=".mp4"]:not([data-dm-processed]), a[href$=".webm"]:not([data-dm-processed]), a[href$=".mov"]:not([data-dm-processed])', link => {
            link.dataset.dmProcessed = '1';   // marca ANTES de qualquer return (senão re-scaneia o link todo frame)
            if (link.closest('.bbCodeQuote, .bbCodeSpoiler, .bbCodeBlock--spoiler, .bbCodeBlock--unfurl, .message-signature, .smg-fhcard, .smg-tw-card')) return;   // não embeda mídia citada / de assinatura (igual o groupPostLinks faz)
            // NÃO embedar links que são PARTE de um embed nosso: o "↗ Open on …" (.smg-turbo-fallback) tem
            // href do arquivo e caía aqui, gerando um segundo player logo abaixo do primeiro. Mesma coisa
            // pro que já está dentro de um wrapper/card montado por outro pass.
            if (link.classList.contains('smg-turbo-fallback')
                || link.closest('.generic2wide-iframe-div, .smg-dm-wrap, .smg-fhcard, .smg-rg')) return;
            const href = link.href;
            // bunkr/pixeldrain REMOVIDOS: o vídeo do bunkr vem como .mp4 DIRETO do CDN (ex.: cdn9.bunkr.ru/…​.mp4) e caía aqui pelo a[href$=".mp4"].
            // NÃO embeda esses hosts — fica como link/card (era o "ainda processando" reclamado).
            let dmHost = ''; try { dmHost = new URL(href).hostname.toLowerCase(); } catch (e) {}
            if (/(^|\.)(bunkr|pixeldrain)\./i.test(dmHost)) return;
            // FILEDITCH: mesmo motivo — o host bloqueia o hotlink (200 com HTML / 502) e o player só girava.
            // O processFileHostCards (que roda ANTES) já pôs o card com o link; aqui é só não embedar por cima.
            if (/fileditch/i.test(dmHost)) return;
            const isVideo = /\.(mp4|webm|m4v|mov)(\?|#|$)/i.test(href);
            const isImg = /\.(webp|jpe?g|png|gif|avif)(\?|#|$)/i.test(href);
            if (!isVideo && !isImg) return;
            // LIMITE (evita players quebrados em hosts novos): só ARQUIVO direto de verdade — o PATHNAME termina na
            // extensão. Páginas-viewer com a ext só na QUERY (ex.: file.php?f=…mp4) NÃO entram aqui: são HTML,
            // não vídeo — viram card de file-host. Exceção: host allowlisted (susercontent).
            let pathMedia = false; try { pathMedia = /\.(mp4|webm|m4v|mov|webp|jpe?g|png|gif|avif)$/i.test(new URL(href).pathname); } catch (e) {}
            if (!pathMedia && !/susercontent\.com/i.test(dmHost)) return;
            const wrap = document.createElement('div');
            wrap.className = 'smg-dm-wrap';
            if (isVideo) {
                // MESMO player do turbo/saint/filester (controles próprios, botão de abrir, pausa ao sair
                // da tela). O <video controls> cru aparecia como um retângulo escuro sem thumb, destoando
                // do resto do fórum. Isto já tinha sido tentado e revertido porque quebrava o mosaico: o
                // player revela a proporção real DEPOIS de posicionado, e o motor antigo (grid de linhas
                // com row-span calculado em JS) não tolerava item maior que as linhas reservadas. Com o
                // mosaico em multicol não existe altura reservada — a coluna reflui —, então voltou a ser
                // seguro. Se um dia o grid de spans voltar, este caminho precisa voltar pro <video> cru.
                let vlabel = ''; try { vlabel = new URL(href).hostname.replace(/^www\./, ''); } catch (e) {}
                // FALHA TOTAL (host fora do ar / anti-hotlink): em vez de sumir com tudo (o link cru fica
                // display:none quando embedamos), devolve o link — sempre sobra algo clicável no post.
                const revive = () => { try { link.style.removeProperty('display'); wrap.remove(); } catch (e) {} };
                const nv = (typeof buildNativeVideo === 'function') ? buildNativeVideo(href, location.origin + '/', revive, vlabel) : null;
                const v = nv ? nv.video : document.createElement('video');
                if (nv) {
                    v._rgExt = href;                        // botão "abrir em nova guia" → o arquivo
                    wrap.appendChild(nv.wrap);
                    if (typeof rgStartUrl === 'function') rgStartUrl(v, href, nv.wrap);
                } else {
                    v.src = href; v.controls = true; v.playsInline = true; v.className = 'smg-dm-video';
                    wrap.appendChild(v);
                }
                v.preload = 'none';
                // THUMB: arquivo direto não tem poster no host, então a capa é o 1º frame — `#t=0.1` faz o
                // browser pintá-lo ao ler os metadados. PERF: só quando o item se aproxima (lazyEmbedIO).
                v._smgActivate = () => {
                    v._smgActivate = null;
                    if (v.dataset.rgLoaded || v.currentSrc) return;   // o play já assumiu o carregamento
                    try { v.preload = 'metadata'; v.src = href + (/#/.test(href) ? '' : '#t=0.1'); } catch (e) {}
                };
                const dio = (FEATURES.lazyEmbeds && typeof getLazyEmbedIO === 'function') ? getLazyEmbedIO() : null;
                if (dio) {
                    const rect = v.getBoundingClientRect();
                    if (!rect.top || rect.top < (window.innerHeight || 1000) * 4) {
                        v._smgActivate();
                    } else {
                        dio.observe(v);
                        setTimeout(() => { if (v._smgActivate) v._smgActivate(); }, 250);
                    }
                } else {
                    v._smgActivate();
                }
                // ao saber as dimensões: vídeo deitado ganha .smg-wide → não estica no post inteiro
                v.addEventListener('loadedmetadata', () => {
                    if (typeof markWide === 'function') markWide(v, v.videoWidth, v.videoHeight);
                }, { once: true });
            } else {
                const a = document.createElement('a');
                a.href = href; a.target = '_blank'; a.rel = 'noopener';
                const img = document.createElement('img');
                img.className = 'bbImage'; img.src = href; img.alt = ''; img.loading = 'lazy';
                a.appendChild(img);
                wrap.appendChild(a);
            }
            const bb = link.closest('.bbWrapper');   // iça pro nível do bbWrapper
            let anchor = link;
            if (bb) while (anchor.parentElement && anchor.parentElement !== bb) anchor = anchor.parentElement;
            anchor.insertAdjacentElement('afterend', wrap);
            link.style.display = 'none';   // some com a URL crua (a mídia a substitui)
            // o XF às vezes já tinha virado esse MESMO link num card de unfurl ("fileditchfiles.st — Free and
            // simple file hosting"): ao lado do player ele só repete o link e come espaço. Mesma regra do
            // pdPlace — quem embeda, esconde o cru.
            if (bb) {
                for (const uf of bb.querySelectorAll('.bbCodeBlock--unfurl[data-url]')) {
                    if (absUrl(uf.getAttribute('data-url') || '') === absUrl(href)) uf.style.display = 'none';
                }
            }
            if (isImg) scheduleRun();
        });
    }

    // =========================================================
    // FEATURE: cards de link p/ FILE-HOSTS (Pixeldrain, Bunkr, GoFile, Cyberdrop, MEGA, …) — SEM player inline. Card CLARO e
    // CONSISTENTE: thumb/logo à ESQUERDA + host + tipo (Arquivo/Galeria, com contagem onde dá) + ↗. Clicar abre no host.
    // Provider casado por SUBSTRING do host (robusto ao TLD que muda, ex.: bunkr). Substitui o link cru OU o unfurl do XF.
    //   Pixeldrain: API → galeria (contagem + cluster de thumbs) / arquivo (thumbnail). Bunkr: foto do figure do unfurl.
    //   Demais: logo do host (favicon do unfurl, senão {origin}/favicon.ico) + tipo pelo padrão da URL.
    // =========================================================
    const FH_PROVIDERS = [
        { key: 'pixeldrain', label: 'Pixeldrain', sub: 'pixeldrain.com', re: /pixeldrain\.com/i, logo: 'https://pixeldrain.com/res/img/pixeldrain_128.png', gallery: /\/(?:l|api\/list)\//i },
        { key: 'bunkr', label: 'Bunkr', sub: 'bunkr', re: /bunkr/i, gallery: /\/a\//i, home: 'bunkr.cr' },   // dezenas de espelhos: o ícone vem do canônico quando o espelho não serve
        { key: 'gofile', label: 'GoFile', sub: 'gofile.io', re: /gofile\.io/i, gallery: /\/d\//i, logo: 'https://gofile.io/dist/img/favicon96.png' },   // favicon oficial do gofile (não tem /favicon.ico)
        { key: 'filester', label: 'Filester', sub: 'filester', re: /filester\./i, gallery: /\/f\//i, logo: 'https://filester.me/img/favicon.ico', home: 'filester.me' },   // favicon mora em /img/ (NÃO /favicon.ico); /f/ = galeria, /d/ = arquivo (fhFilester)
        // FILEDITCH = CARD, não player. O host derruba o hotlink (responde 200 com HTML no lugar do vídeo,
        // e às vezes 502): o player ficava girando pra sempre ou baixava o arquivo inteiro à toa. Card = o
        // link fica visível e clicável, que é o que dá pra garantir aqui.
        { key: 'fileditch', label: 'Fileditch', sub: 'fileditch', re: /fileditch/i, logo: 'https://fileditch.com/favicon.ico', home: 'fileditch.com' },
        { key: 'turbo', label: 'Turbo', sub: 'turbo.cr/a/', re: /turbo\.cr\/a\//i, gallery: /\/a\//i },   // ÁLBUM do turbo (galeria) — o vídeo único já vai pro player (09-turbo)
        { key: 'cyberdrop', label: 'Cyberdrop', sub: 'cyberdrop', re: /cyberdrop\./i, gallery: /\/a\//i, home: 'cyberdrop.me', skip: /cyberdrop\.[a-z]+\/e\//i },   // /e/ = embed de vídeo → vira PLAYER (processCyberdropEmbeds), não card
        { key: 'cyberfile', label: 'Cyberfile', sub: 'cyberfile', re: /cyberfile\./i, gallery: /\/folder\//i, home: 'cyberfile.me' },
        { key: 'mega', label: 'MEGA', sub: 'mega.', re: /(?:^|[/.])mega\.(?:nz|io)/i, gallery: /\/folder\//i },
        { key: 'mediafire', label: 'MediaFire', sub: 'mediafire', re: /mediafire\.com/i, gallery: /\/folder\//i },
        { key: 'k2s', label: 'K2S', sub: 'k2s.cc', re: /k2s\.cc|keep2share/i },
        { key: 'rapidgator', label: 'Rapidgator', sub: 'rapidgator', re: /rapidgator\./i, home: 'rapidgator.net' },
        { key: 'fikper', label: 'Fikper', sub: 'fikper', re: /fikper\./i, home: 'fikper.com' },
        { key: 'instagram', label: 'Instagram', sub: 'instagram.com', re: /instagram\.com/i, logo: 'https://www.instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png', home: 'instagram.com' },
        { key: 'x', label: 'X (Twitter)', sub: 'x.com', re: /(?:twitter|x)\.com/i, logo: 'https://abs.twimg.com/favicons/twitter.3.ico', home: 'x.com' },
        { key: 'twitter', label: 'Twitter', sub: 'twitter.com', re: /twitter\.com/i, logo: 'https://abs.twimg.com/favicons/twitter.3.ico', home: 'x.com' },
    ];
    const FH_BARE_SEL = FH_PROVIDERS.map(p => 'a[href*="' + p.sub + '"]:not([data-fh-done])').join(', ');
    function fhProvider(url, dataHost) { const s = (url || '') + ' ' + (dataHost || ''); return FH_PROVIDERS.find(p => p.re.test(s)) || null; }
    // RESOLUÇÃO ADIADA. Três rotas de card fazem REDE (pixeldrain = API da lista · bunkr = raspa a página do
    // álbum · filester = API do arquivo). Elas rodavam no boot, para a THREAD INTEIRA, em ordem de DOM: abrir
    // no post #200 disparava 200 requests começando pelo topo, e o limite de conexões por host do browser
    // (FIFO) fazia o resto — carregava de cima pra baixo, um por vez. Agora: só perto da tela (IO) e pela fila
    // com prioridade por distância da viewport (makeTaskQueue), 6 em paralelo.
    // A âncora é o PRÓPRIO link/unfurl cru: ele está no lugar certo do documento e fica visível enquanto não
    // resolve — nada some da página esperando a vez.
    let fhIO = null;
    const fhTasks = makeTaskQueue(6);   // metadado é leve (JSON/HTML pequeno) → mais paralelo que vídeo (3)
    function fhLater(node, fn) {
        if (!fhIO) fhIO = makeLazyIO(el => { const f = el._fhLoad; el._fhLoad = null; if (f) fhTasks.push(f, el); }, { rootMargin: '150% 0px' });
        if (!fhIO) { fhTasks.push(fn, node); return; }   // sem IntersectionObserver → fila mesmo assim (só sem o gate de viewport)
        node._fhLoad = fn;
        fhIO.observe(node);
    }
    // só as rotas que REALMENTE batem na rede entram no adiamento — card sem request continua instantâneo
    // (adiar esses só trocaria link por card na cara do usuário, com pulo de layout, sem ganhar nada).
    function fhNeedsNet(prov, url) {
        if (!GMX) return false;
        if (prov.key === 'pixeldrain') return /pixeldrain\.com\/(?:l|api\/list)\//i.test(url);
        if (prov.key === 'bunkr') return /\/a\//i.test(url);
        return false;
    }
    function pdPlace(node, card) {   // troca o link/card cru (o unfurl inteiro, se houver) pelo nosso card
        const host = node.closest('.bbCodeBlock--unfurl') || node;
        // TÍTULO DO LINK: quando o <a> tem TEXTO próprio (não a URL crua), ele é a única descrição do
        // item. Esconder o link jogava esse texto fora e uma lista de 80 links virava 80 cards
        // "Bunkr · Arquivo" idênticos. Título vira a linha de cima; host/tipo descem pra secundária.
        if (node.tagName === 'A') {
            const txt = (node.textContent || '').replace(/\s+/g, ' ').trim();
            const h = card.querySelector('.smg-fhcard-host'), s = card.querySelector('.smg-fhcard-sub');
            if (h && s && txt.length > 2 && !/^https?:\/\//i.test(txt)) {
                s.textContent = h.textContent + ' · ' + s.textContent;
                h.textContent = txt;
            }
        }
        // Encaixa o card exatamente onde o host (unfurl ou link) estava no DOM
        host.insertAdjacentElement('afterend', card);
        host.style.display = 'none';   // some o cru → groupPostLinks pula
    }
    // CADEIA de logo: tenta cada URL e, no erro, vai pra próxima → NUNCA fica sem ícone. (favicon do host falha às vezes;
    // o serviço DDG/Google quase sempre devolve algo.) O serviço some o host (não o arquivo) — leak mínimo.
    // FAVICON QUE JÁ FUNCIONOU: hosts com dezenas de espelhos (bunkr.ws/.si/.pk/.black/…) só publicam o
    // ícone em alguns deles — nos outros a cadeia estourava e sobrava o tile com a inicial. Guardamos o
    // primeiro URL que CARREGOU por provider (memória + storage) e ele passa a ser a 1ª tentativa,
    // inclusive pros espelhos que não servem ícone nenhum.
    const FH_LOGO_KEY = 'smg-fh-logos';
    let fhLogoMemo = null;
    function fhLogoMem() {
        if (!fhLogoMemo) { try { fhLogoMemo = JSON.parse(gmGet(FH_LOGO_KEY, '{}')) || {}; } catch (e) { fhLogoMemo = {}; } }
        return fhLogoMemo;
    }
    function fhLogoLearn(key, url) {
        if (!key || !url || /^data:/.test(url)) return;
        const m = fhLogoMem(); if (m[key] === url) return;
        m[key] = url; try { gmSet(FH_LOGO_KEY, JSON.stringify(m)); } catch (e) {}
    }
    function fhLogoChain(prov, url, unfurlEl) {
        const out = [];
        const learned = fhLogoMem()[prov.key];
        if (learned) out.push(learned);          // já provado neste ou em outro post
        if (prov.logo) out.push(prov.logo);
        let host = ''; try { host = new URL(url).hostname; } catch (e) {}
        if (prov.key === 'bunkr' && host) out.push('https://' + host + '/images/fav.ico');   // logo roxo do bunkr
        if (unfurlEl) { const fav = unfurlEl.querySelector('.js-unfurl-favicon img, .bbCodeBlockUnfurl-icon'); const s = fav && fav.getAttribute('src'); if (s) out.push(s); }
        // caminhos usuais do host, do mais específico pro mais genérico
        if (host) ['/favicon.ico', '/favicon.png', '/apple-touch-icon.png', '/images/fav.ico', '/img/favicon.ico']
            .forEach(p => out.push('https://' + host + p));
        // espelho canônico do provider (bunkr.black não serve ícone, bunkr.cr serve — é o mesmo site)
        if (prov.home) ['/favicon.ico', '/images/fav.ico', '/img/favicon.ico'].forEach(p => out.push('https://' + prov.home + p));
        // NÃO usamos icons.duckduckgo.com / google s2: p/ hosts que eles não conhecem devolvem um ícone GENÉRICO
        // (globo/play) que carrega com sucesso → a cadeia TRAVA nele e nunca chega no tile com a inicial. Sem eles,
        // favicon real (provider/host) quando existe; senão → fhLetterTile (tile colorido com a inicial do host).
        return out;
    }
    function fhLetterTile(th, label) {   // fallback final: tile colorido com a inicial do host (nunca fica ícone genérico/quebrado)
        th.className = 'smg-fhcard-thumb smg-fhcard-thumb--letter';
        th.textContent = ((label || '?').trim().charAt(0) || '?').toUpperCase();
    }
    function fhFillLogo(th, chain, label, key) {   // sem foto de conteúdo → logo do host (contain). Cadeia até carregar; exausta → tile com a inicial.
        th.className = 'smg-fhcard-thumb smg-fhcard-thumb--logo';
        chain = (chain || []).filter(Boolean).filter((u, i, a) => a.indexOf(u) === i);   // sem repetir tentativa
        if (!chain.length) { fhLetterTile(th, label); return; }
        const im = document.createElement('img'); im.className = 'smg-fhcard-logo'; im.alt = ''; im.loading = 'lazy';   // idem: favicon de card fora da tela não disputa conexão com o que está sendo lido
        let i = 0, cur = '';
        const next = () => { if (i >= chain.length) { im.remove(); fhLetterTile(th, label); return; } cur = chain[i++]; im.src = cur; };
        im.addEventListener('error', next);   // SEM once: cada falha tenta a próxima da cadeia
        // 1x1 / ícone quebrado carrega "com sucesso" → só aprende (e mantém) o que tem tamanho de ícone
        im.addEventListener('load', () => { if (im.naturalWidth >= 8) fhLogoLearn(key, cur); else next(); });
        th.appendChild(im); next();
    }
    // FAVICON EM LINK SOLTO: o chip do fallback de imagem (08-images-masonry) mostrava o mesmo emoji 🔗
    // pra qualquer site. Reusa a cadeia/memória dos cards, chaveada pelo HOST — onlyfans, manyvids e
    // afins passam a aparecer com o ícone do próprio site, no mesmo idioma visual dos cards.
    function fhLinkFavicon(a, url) {
        if (!a || a.querySelector('.smg-linkfav')) return;
        let host = ''; try { host = new URL(url || a.href, location.href).hostname; } catch (e) {}
        if (!host) return;
        const key = 'host:' + host;
        const chain = [fhLogoMem()[key], 'https://' + host + '/favicon.ico', 'https://' + host + '/favicon.png',
            'https://' + host + '/apple-touch-icon.png'].filter(Boolean).filter((u, i, arr) => arr.indexOf(u) === i);
        const im = document.createElement('img');
        im.className = 'smg-linkfav'; im.alt = ''; im.loading = 'lazy'; im.referrerPolicy = 'no-referrer';
        let i = 0, cur = '';
        const next = () => { if (i >= chain.length) { im.remove(); return; } cur = chain[i++]; im.src = cur; };   // esgotou → volta o emoji do CSS
        im.addEventListener('error', next);
        im.addEventListener('load', () => { if (im.naturalWidth >= 8) { a.classList.add('smg-has-fav'); fhLogoLearn(key, cur); } else next(); });
        a.insertBefore(im, a.firstChild);
        next();
    }
    function fhCopyFallback(text, done) {
        try { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.focus(); ta.select(); document.execCommand('copy'); ta.remove(); done(); } catch (e) {}
    }
    function fhCopy(text, btn) {   // copia o link + feedback visual (✓ por ~1.4s) — usa o par share/shareDone que já existe
        const done = () => { btn.classList.add('smg-fhcard-copied'); btn.innerHTML = ICONS.shareDone; setTimeout(() => { btn.classList.remove('smg-fhcard-copied'); btn.innerHTML = ICONS.share; }, 1400); };
        if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, () => fhCopyFallback(text, done)); return; }
        fhCopyFallback(text, done);
    }
    // contagem → texto "Galeria · N itens" / "Arquivo"
    function fhSub(kind, count) { return count > 1 ? (i18n('Gallery') + ' · ' + count + ' ' + i18n(count === 1 ? 'item' : 'items')) : kind; }
    function fhExtractUnfurlThumb(unfurlEl) {
        if (!unfurlEl) return [];
        const img = unfurlEl.querySelector('.js-unfurl-figure img, .contentRow-figure img, .bbCodeBlockUnfurl-image, .contentRow-figure--fixedSmall img');
        if (!img) return [];
        let src = img.getAttribute('data-url') || img.getAttribute('src') || img.src || '';
        if (!src || /^data:|\/favicon\.ico|\/fav\.ico/i.test(src)) return [];
        return [src];
    }
    // card RICO: [mosaico de thumbs (até 4) c/ badge de contagem + "+N" no último | logo do host] + host + sub | [copiar] [abrir↗].
    // o = { label, href, sub, thumbs:[], logo:[], count:0 }
    function fhCard(o) {
        const href = o.href, logoChain = o.logo || [];
        const thumbs = (o.thumbs || []).filter(Boolean).slice(0, 4);
        const count = o.count || 0;
        const card = document.createElement('div'); card.className = 'smg-fhcard'; card.dataset.fhDone = '1';
        const main = document.createElement('a'); main.className = 'smg-fhcard-main'; main.href = href; main.target = '_blank'; main.rel = 'noopener noreferrer'; main.dataset.fhDone = '1';
        const th = document.createElement('div');
        th.className = 'smg-fhcard-thumb smg-fhcard-thumb--loading' + (thumbs.length > 1 ? ' smg-fhcard-thumb--multi' : '');
        if (thumbs.length) {
            let pending = thumbs.length;
            thumbs.forEach((u, i) => {
                const cell = document.createElement('span'); cell.className = 'smg-fhcard-cell';
                const im = document.createElement('img'); im.loading = 'lazy'; im.src = u; im.alt = ''; im.referrerPolicy = 'no-referrer';   // lazy: o browser resolve por proximidade da tela (eager fazia a thread inteira baixar thumb de cima pra baixo)
                im.addEventListener('load', () => th.classList.remove('smg-fhcard-thumb--loading'), { once: true });
                im.addEventListener('error', () => { cell.remove(); if (!--pending && !th.querySelector('img')) fhFillLogo(th, logoChain, o.label, o.key); }, { once: true });
                cell.appendChild(im);
                if (i === thumbs.length - 1 && count > thumbs.length) { const more = document.createElement('span'); more.className = 'smg-fhcard-more'; more.textContent = '+' + (count - thumbs.length); cell.appendChild(more); }
                th.appendChild(cell);
            });
        } else { fhFillLogo(th, logoChain, o.label, o.key); }
        if (count > 1) { const b = document.createElement('span'); b.className = 'smg-fhcard-count'; b.innerHTML = ICONS.layers + '<b>' + count + '</b>'; th.appendChild(b); }
        main.appendChild(th);
        const body = document.createElement('div'); body.className = 'smg-fhcard-body';
        const t = document.createElement('span'); t.className = 'smg-fhcard-host'; t.textContent = o.label;
        const s = document.createElement('span'); s.className = 'smg-fhcard-sub'; s.textContent = o.sub;
        body.append(t, s);
        main.appendChild(body);
        const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'smg-fhcard-btn smg-fhcard-copy'; copy.title = i18n('Copy link'); copy.setAttribute('aria-label', i18n('Copy link')); copy.innerHTML = ICONS.share;
        copy.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); fhCopy(href, copy); });
        const open = document.createElement('a'); open.className = 'smg-fhcard-btn smg-fhcard-open'; open.href = href; open.target = '_blank'; open.rel = 'noopener noreferrer'; open.dataset.fhDone = '1'; open.title = i18n('Open'); open.setAttribute('aria-label', i18n('Open')); open.innerHTML = ICONS.rgExternal;
        card.append(main, copy, open);
        return card;
    }
    function fhPixeldrain(node, url) {   // API: galeria (contagem + cluster) / arquivo (thumbnail)
        const logo = ['https://pixeldrain.com/res/img/pixeldrain_128.png'];   // sem DDG (devolve genérico que trava); falha → tile "P"
        const lid = url.match(/pixeldrain\.com\/(?:l|api\/list)\/([a-z0-9]+)/i);
        if (lid) {
            if (!GMX) { pdPlace(node, fhCard({ key: 'pixeldrain', label: 'Pixeldrain', href: url, sub: i18n('Gallery'), logo: logo })); return; }
            gmGetJSON('https://pixeldrain.com/api/list/' + lid[1]).then(j => {
                const files = (j && j.files) || [];
                pdPlace(node, fhCard({ key: 'pixeldrain', label: 'Pixeldrain', href: url, sub: fhSub(i18n('Gallery'), files.length), count: files.length, logo: logo, thumbs: files.slice(0, 4).map(f => 'https://pixeldrain.com/api/file/' + f.id + '/thumbnail') }));
            }, () => pdPlace(node, fhCard({ key: 'pixeldrain', label: 'Pixeldrain', href: url, sub: i18n('Gallery'), logo: logo })));
            return;
        }
        const fid = url.match(/pixeldrain\.com\/(?:u|d|file|api\/file)\/([a-z0-9]+)/i) || url.match(/pixeldrain\.com\/([a-z0-9]{6,})(?:[/?#]|$)/i);
        pdPlace(node, fhCard({ key: 'pixeldrain', label: 'Pixeldrain', href: url, sub: i18n('File'), logo: logo, thumbs: fid ? ['https://pixeldrain.com/api/file/' + fid[1] + '/thumbnail'] : [] }));
    }
    // GOFILE: NÃO fazemos NENHUM request (a API/token/wt do gofile dá rate-limit e bloqueio temporário).
    // Cai no card genérico do fhBuildCard (label + logo + "Gallery"), zero chamadas → impossível tomar rate limit.
    // BUNKR: álbum (/a/) → raspa a página por thumbs + contagem. Arquivo único → foto do figure do unfurl.
    function fhBunkr(node, url, unfurlEl) {
        const logo = fhLogoChain({ key: 'bunkr', home: 'bunkr.cr' }, url, unfurlEl);
        const fallback = () => pdPlace(node, fhCard({ key: 'bunkr', label: 'Bunkr', href: url, sub: /\/a\//i.test(url) ? i18n('Gallery') : i18n('File'), logo: logo, thumbs: fhExtractUnfurlThumb(unfurlEl) }));
        if (!GMX || !/\/a\//i.test(url)) { fallback(); return; }
        // GMX (não fetchDoc): a página do bunkr é cross-origin → o fetch normal bate no CORS; GM_xmlhttpRequest fura.
        GMX({ method: 'GET', url: url, timeout: 12000, onload: r => {
            let doc; try { doc = new DOMParser().parseFromString(r.responseText || '', 'text/html'); } catch (e) { fallback(); return; }
            const seen = new Set(), thumbs = [];
            doc.querySelectorAll('img[src*="thumb"], img[data-src*="thumb"], [class*="grid"] img').forEach(im => {
                let s = im.getAttribute('data-src') || im.getAttribute('src') || ''; if (!s || /^data:|\.svg|sprite|logo|fav/i.test(s)) return;
                try { s = new URL(s, url).href; } catch (e) { return; } if (!seen.has(s)) { seen.add(s); thumbs.push(s); }
            });
            const count = doc.querySelectorAll('[class*="grid"] a[href*="/f/"], a[href*="/f/"], a[href*="/i/"], a[href*="/v/"]').length || thumbs.length;
            if (!thumbs.length) { fallback(); return; }
            pdPlace(node, fhCard({ key: 'bunkr', label: 'Bunkr', href: url, sub: fhSub(i18n('Gallery'), count), count: count, logo: logo, thumbs: thumbs.slice(0, 4) }));
        }, onerror: fallback, ontimeout: fallback });
    }
    // FILESTER: arquivo único (/d/{slug}). A página HTML toma Cloudflare 403, MAS a API pública JSON responde —
    // POST /api/public/view {file_slug} → view_url; mp4 = https://cn1.filester.me{view_url} (mesma engine do site).
    // VÍDEO → embeda o player nativo (igual saint/turbo); imagem/galeria/falha → card. (galeria = /f/, arquivo = /d/)
    function fhFilester(node, url, prov, unfurlEl) {
        const logo = fhLogoChain(prov, url, unfurlEl);
        const isFile = /\/d\//i.test(url);
        const thumbs = fhExtractUnfurlThumb(unfurlEl);
        pdPlace(node, fhCard({ key: 'filester', label: 'Filester', href: url, sub: isFile ? i18n('File') : i18n('Gallery'), logo: logo, thumbs: thumbs }));
    }
    function makeInstagramCard(url, id, rawLabel) {
        const href = url || (id ? ('https://www.instagram.com/p/' + id + '/') : 'https://www.instagram.com/');
        const isReel = /\/reel\//i.test(href);
        const isUser = !id && /instagram\.com\/([A-Za-z0-9_.-]+)\/?$/i.test(href);
        let sub = isReel ? (i18n('Reel') + (id ? ' · ' + id : '')) : (id ? (i18n('Post') + ' · ' + id) : i18n('Instagram'));
        let label = 'Instagram';
        if (rawLabel && !/^https?:\/\//i.test(rawLabel)) {
            label = rawLabel;
        } else if (isUser) {
            const um = href.match(/instagram\.com\/([A-Za-z0-9_.-]+)\/?$/i);
            if (um && !/^(p|reel|reels|stories|explore|direct)$/i.test(um[1])) {
                label = '@' + um[1];
                sub = i18n('Profile');
            }
        }
        const card = fhCard({
            key: 'instagram',
            label: label,
            href: href,
            sub: sub,
            logo: ['https://www.instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png', 'https://instagram.com/favicon.ico']
        });
        card.dataset.key = 'instagram';
        const th = card.querySelector('.smg-fhcard-thumb');
        if (th) {
            th.className = 'smg-fhcard-thumb smg-fhcard-thumb--instagram';
            th.innerHTML = ICONS.instagram;
        }
        return card;
    }
    function makeTwitterCard(url, id, user, rawLabel) {
        const href = url || (id ? ('https://x.com/i/status/' + id) : 'https://x.com/');
        let sub = id ? ('Post · ' + id) : i18n('Post');
        let label = 'X (Twitter)';
        if (user && user !== 'i') {
            label = '@' + user;
        } else if (rawLabel && !/^https?:\/\//i.test(rawLabel) && rawLabel.trim().length > 1) {
            label = rawLabel.trim();
        }
        const card = fhCard({
            key: 'x',
            label: label,
            href: href,
            sub: sub,
            logo: ['https://abs.twimg.com/favicons/twitter.3.ico', 'https://x.com/favicon.ico']
        });
        card.dataset.key = 'x';
        const th = card.querySelector('.smg-fhcard-thumb');
        if (th) {
            th.className = 'smg-fhcard-thumb smg-fhcard-thumb--x';
            th.innerHTML = ICONS.x;
        }
        return card;
    }
    let twitterSdkLoading = false;
    function loadTwitterSdk(cb) {
        if (window.twttr && window.twttr.widgets) { cb(); return; }
        if (!twitterSdkLoading) {
            twitterSdkLoading = true;
            const s = document.createElement('script');
            s.src = 'https://platform.twitter.com/widgets.js';
            s.async = true;
            s.charset = 'utf-8';
            s.onload = () => { if (window.twttr && window.twttr.widgets) cb(); };
            (document.head || document.documentElement).appendChild(s);
        } else {
            const check = setInterval(() => {
                if (window.twttr && window.twttr.widgets) { clearInterval(check); cb(); }
            }, 100);
            setTimeout(() => clearInterval(check), 10000);
        }
    }

    function buildTwitterCardDom(tweet, tweetUrl) {
        const card = document.createElement('div');
        card.className = 'smg-tw-card';
        card.dataset.twDone = '1';
        card.dataset.fhDone = '1';

        // Header
        const head = document.createElement('div');
        head.className = 'smg-tw-head';

        const avatar = document.createElement('div');
        avatar.className = 'smg-tw-avatar';
        if (tweet.author && tweet.author.avatar_url) {
            const avImg = document.createElement('img');
            avImg.src = tweet.author.avatar_url;
            avImg.loading = 'lazy';
            avImg.alt = '';
            avatar.appendChild(avImg);
        }

        const author = document.createElement('div');
        author.className = 'smg-tw-author';
        const name = document.createElement('a');
        name.className = 'smg-tw-name';
        name.href = (tweet.author && tweet.author.url) || tweetUrl;
        name.target = '_blank';
        name.rel = 'noopener noreferrer';
        name.dataset.fhDone = '1';
        name.dataset.twDone = '1';
        name.textContent = (tweet.author && tweet.author.name) || 'X User';

        const user = document.createElement('a');
        user.className = 'smg-tw-user';
        user.href = (tweet.author && tweet.author.url) || tweetUrl;
        user.target = '_blank';
        user.rel = 'noopener noreferrer';
        user.dataset.fhDone = '1';
        user.dataset.twDone = '1';
        user.textContent = (tweet.author && tweet.author.screen_name) ? ('@' + tweet.author.screen_name) : '';

        author.append(name, user);

        const xlogo = document.createElement('a');
        xlogo.className = 'smg-tw-xlogo';
        xlogo.href = tweetUrl;
        xlogo.target = '_blank';
        xlogo.rel = 'noopener noreferrer';
        xlogo.title = 'Open on X';
        xlogo.dataset.fhDone = '1';
        xlogo.dataset.twDone = '1';
        xlogo.innerHTML = ICONS.x || '';

        head.append(avatar, author, xlogo);
        card.appendChild(head);

        // Text
        if (tweet.text) {
            const text = document.createElement('div');
            text.className = 'smg-tw-text';
            text.textContent = tweet.text;
            card.appendChild(text);
        }

        // Media (Video / Photos)
        const mediaList = (tweet.media && tweet.media.all) || [];
        const videos = (tweet.media && tweet.media.videos) || mediaList.filter(m => m.type === 'video');
        const photos = (tweet.media && tweet.media.photos) || mediaList.filter(m => m.type === 'photo');

        if (videos.length) {
            const mwrap = document.createElement('div');
            mwrap.className = 'smg-tw-media';
            const vid = document.createElement('video');
            vid.controls = true;
            vid.playsInline = true;
            vid.preload = 'metadata';
            if (videos[0].thumbnail_url) vid.poster = videos[0].thumbnail_url;
            vid.src = videos[0].url;
            mwrap.appendChild(vid);
            card.appendChild(mwrap);
        } else if (photos.length === 1) {
            const mwrap = document.createElement('div');
            mwrap.className = 'smg-tw-media';
            const img = document.createElement('img');
            img.src = photos[0].url;
            img.loading = 'lazy';
            mwrap.appendChild(img);
            card.appendChild(mwrap);
        } else if (photos.length > 1) {
            const mwrap = document.createElement('div');
            mwrap.className = 'smg-tw-media smg-tw-media-grid';
            photos.slice(0, 4).forEach(p => {
                const img = document.createElement('img');
                img.src = p.url;
                img.loading = 'lazy';
                mwrap.appendChild(img);
            });
            card.appendChild(mwrap);
        }

        // Footer
        const foot = document.createElement('div');
        foot.className = 'smg-tw-foot';

        const stats = document.createElement('div');
        stats.className = 'smg-tw-stats';
        if (tweet.likes) {
            const lk = document.createElement('span');
            lk.textContent = '❤️ ' + (tweet.likes >= 1000 ? (tweet.likes / 1000).toFixed(1) + 'K' : tweet.likes);
            stats.appendChild(lk);
        }
        if (tweet.retweets) {
            const rt = document.createElement('span');
            rt.textContent = '🔁 ' + (tweet.retweets >= 1000 ? (tweet.retweets / 1000).toFixed(1) + 'K' : tweet.retweets);
            stats.appendChild(rt);
        }
        foot.appendChild(stats);

        const open = document.createElement('a');
        open.className = 'smg-tw-open';
        open.href = tweetUrl;
        open.target = '_blank';
        open.rel = 'noopener noreferrer';
        open.dataset.fhDone = '1';
        open.dataset.twDone = '1';
        open.innerHTML = 'Open on 𝕏 ' + (ICONS.rgExternal || '↗');
        foot.appendChild(open);

        card.appendChild(foot);
        card.querySelectorAll('a').forEach(a => { a.dataset.fhDone = '1'; a.dataset.twDone = '1'; });
        return card;
    }

    function renderTwitterOfficialEmbed(container, tweetId, fallbackUrl, rawLabel) {
        if (!container || container.dataset.twEmbedDone || container.closest('.smg-twitter-embed, .smg-tw-card')) return;
        container.dataset.twEmbedDone = '1';
        container.dataset.twDone = '1';
        container.dataset.fhDone = '1';
        container.innerHTML = '';
        container.className = 'smg-twitter-embed';
        container.style.cssText = 'min-height: 80px; display: flex; justify-content: center; margin: 14px auto; max-width: 560px; width: 100%;';

        const tweetUrl = fallbackUrl || ('https://x.com/i/status/' + tweetId);
        const skel = makeTwitterCard(tweetUrl, tweetId, '', rawLabel);
        skel.dataset.fhDone = '1';
        skel.dataset.twDone = '1';
        container.appendChild(skel);

        // 1. Tenta API do FxTwitter (suporta NSFW, vídeos diretos, fotos e texto)
        gmGetJSON('https://api.fxtwitter.com/status/' + tweetId).then(data => {
            if (data && data.tweet) {
                const cardDom = buildTwitterCardDom(data.tweet, tweetUrl);
                container.replaceWith(cardDom);
            }
        }, () => {
            // Fallback se FxTwitter falhar: tenta widgets.js oficial
            loadTwitterSdk(() => {
                if (!window.twttr || !window.twttr.widgets) return;
                window.twttr.widgets.createTweet(tweetId, container, {
                    theme: 'dark',
                    dnt: true,
                    align: 'center'
                }).then(el => {
                    if (el) {
                        skel.remove();
                        container.style.minHeight = '0';
                    }
                }).catch(() => {});
            });
        });
    }

    function fhBuildCard(node, url, prov, unfurlEl) {
        if (fhNeedsNet(prov, url)) { fhLater(node, () => fhBuildCardNow(node, url, prov, unfurlEl)); return; }
        fhBuildCardNow(node, url, prov, unfurlEl);
    }
    function fhBuildCardNow(node, url, prov, unfurlEl) {
        if (!node.isConnected) return;   // o post saiu do DOM (feed paginou) enquanto esperava a vez
        if (!unfurlEl && node.closest) {
            unfurlEl = node.closest('.bbCodeBlock--unfurl');
        }
        if (prov.key === 'pixeldrain') { fhPixeldrain(node, url); return; }
        if (prov.key === 'bunkr') { fhBunkr(node, url, unfurlEl); return; }   // gofile cai no card genérico abaixo (ZERO requests → sem rate limit)
        if (prov.key === 'filester') { fhFilester(node, url, prov, unfurlEl); return; }
        if (prov.key === 'instagram') {
            const rawHref = absUrl(decodeProxyHref(node.getAttribute('href') || node.getAttribute('data-url') || '') || node.href || '');
            let id = '';
            const im = rawHref.match(/instagram\.com\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/i);
            if (im) id = im[1];
            const card = makeInstagramCard(rawHref, id, node.textContent);
            pdPlace(node, card);
            return;
        }
        if (prov.key === 'x' || prov.key === 'twitter') {
            const rawHref = absUrl(decodeProxyHref(node.getAttribute('href') || node.getAttribute('data-url') || '') || node.href || '');
            let id = '', user = '';
            const sm = rawHref.match(/(?:twitter|x)\.com\/(?:([A-Za-z0-9_]+)\/status|i\/status)\/([0-9]+)/i);
            if (sm) { user = sm[1] || ''; id = sm[2]; }
            const target = node.closest('.bbCodeBlock--unfurl') || node;
            target.dataset.fhDone = '1';
            target.dataset.twDone = '1';
            if (id) {
                const container = document.createElement('div');
                pdPlace(node, container);
                renderTwitterOfficialEmbed(container, id, rawHref, node.textContent);
            } else {
                const card = makeTwitterCard(rawHref, id, user, node.textContent);
                pdPlace(node, card);
            }
            return;
        }
        // link que aponta pra um vídeo → diz "Vídeo" (sem player, o card é a única pista do que tem ali)
        const sub = (prov.gallery && prov.gallery.test(url)) ? i18n('Gallery')
            : (/\.(mp4|webm|m4v|mov|mkv)(\?|#|$)/i.test(url) ? i18n('Video') : i18n('File'));
        const thumbs = fhExtractUnfurlThumb(unfurlEl);
        pdPlace(node, fhCard({ key: prov.key, label: prov.label, href: url, sub: sub, logo: fhLogoChain(prov, url, unfurlEl), thumbs: thumbs }));
    }
    function processInstagramEmbeds(roots) {
        eachIn(roots, 'iframe[data-s9e-mediaembed="instagram"], iframe[src*="instagram.min.html"], span[data-s9e-mediaembed="instagram"], span[data-s9e-mediaembed*="instagram"], .smg-ig-embed-wrap, blockquote.instagram-media', el => {
            if (el.dataset.igDone) return;
            el.dataset.igDone = '1';
            let src = el.getAttribute('src') || el.getAttribute('data-src') || el.getAttribute('data-instgrm-permalink') || '';
            let id = '';
            const hm = src.match(/instagram\.min\.html#([A-Za-z0-9_-]+)/i) || src.match(/instagram\.com\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/i);
            if (hm) id = hm[1];
            if (!id && el.getAttribute('data-s9e-mediaembed-iframe')) {
                const raw = el.getAttribute('data-s9e-mediaembed-iframe') || '';
                const m = raw.match(/instagram\.min\.html#([A-Za-z0-9_-]+)/i) || raw.match(/instagram\.com\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/i);
                if (m) id = m[1];
            }
            const url = id ? ('https://www.instagram.com/p/' + id + '/') : (src || 'https://www.instagram.com/');
            const card = makeInstagramCard(url, id);
            const target = el.closest('.smg-ig-embed-wrap, span[data-s9e-mediaembed], .generic2wide-iframe-div') || el;
            target.dataset.igDone = '1';
            target.dataset.fhDone = '1';
            target.replaceWith(card);
        });
    }
    function processTwitterEmbeds(roots) {
        eachIn(roots, 'iframe[data-s9e-mediaembed="twitter"], iframe[src*="twitter.min.html"], span[data-s9e-mediaembed="twitter"], span[data-s9e-mediaembed*="twitter"]', el => {
            if (el.dataset.twDone || el.closest('.smg-twitter-embed')) return;
            el.dataset.twDone = '1';
            let src = el.getAttribute('src') || el.getAttribute('data-src') || '';
            let id = '';
            const hm = src.match(/twitter\.min\.html#([0-9]+)/i) || src.match(/(?:twitter|x)\.com\/(?:[A-Za-z0-9_]+\/status|i\/status)\/([0-9]+)/i);
            if (hm) id = hm[1];
            if (!id && el.getAttribute('data-s9e-mediaembed-iframe')) {
                const raw = el.getAttribute('data-s9e-mediaembed-iframe') || '';
                const m = raw.match(/twitter\.min\.html#([0-9]+)/i);
                if (m) id = m[1];
            }
            const url = id ? ('https://x.com/i/status/' + id) : 'https://x.com/';
            const target = el.closest('span[data-s9e-mediaembed], .generic2wide-iframe-div') || el;
            target.dataset.twDone = '1';
            if (id) {
                const container = document.createElement('div');
                target.replaceWith(container);
                renderTwitterOfficialEmbed(container, id, url);
            } else {
                const card = makeTwitterCard(url, id, '');
                target.replaceWith(card);
            }
        });
    }
    function processFileHostCards(roots) {
        if (!FEATURES.fileHostCards) return;
        // UNFURLS do XF (têm favicon/figure de graça) → card consistente. Marca TODOS (mesmo os não-provider) p/ não re-checar.
        eachIn(roots, '.bbCodeBlock--unfurl[data-url]:not([data-fh-done])', card => {
            card.dataset.fhDone = '1';   // marca ANTES de qualquer return (REGRA DE OURO)
            if (card.closest('.bbCodeQuote, .message-signature')) return;
            const url = card.getAttribute('data-url') || '';
            const prov = fhProvider(url, card.getAttribute('data-host'));
            if (prov) fhBuildCard(card, url, prov, card);
        });
        // LINKS crus (sem unfurl) dos providers
        eachIn(roots, FH_BARE_SEL, a => {
            a.dataset.fhDone = '1';
            if (a.closest('.bbCodeQuote, .message-signature, .smg-post-links, .smg-fhcard, .smg-tw-card, .generic2wide-iframe-div, .smg-dm-wrap, .bbCodeBlock--unfurl, .smg-ig-embed-wrap, .smg-twitter-embed, blockquote.instagram-media')) return;
            if (a.querySelector('img.bbImage')) return;   // link de imagem (lightbox)
            const url = absUrl(decodeProxyHref(a.getAttribute('href') || '') || a.href);
            const prov = fhProvider(url);
            if (prov && prov.skip && prov.skip.test(url)) return;   // esse padrão de URL é tratado por outro pass (ex.: cyberdrop /e/ → player)
            if (prov) fhBuildCard(a, url, prov, null);
        });
    }

    // =========================================================
    // FEATURE: agrupa os links NÃO-embedados (file hosts: GoFile/Bunkr/Pixeldrain/…) numa barra de chips
    // no fim do post, SEM tirar nada do texto. Pula internos (menção/thread/quote), imagens e embeds.
    // =========================================================
    const LINK_HOST_LABEL = {
        gofile: 'GoFile', bunkr: 'Bunkr', pixeldrain: 'Pixeldrain', cyberdrop: 'Cyberdrop',
        cyberfile: 'Cyberfile', filester: 'Filester', fileditch: 'Fileditch', 'mega.nz': 'MEGA', mediafire: 'MediaFire',
        k2s: 'K2S', keep2share: 'K2S', fikper: 'Fikper', rapidgator: 'Rapidgator',
        saint: 'Saint', 'turbo.cr': 'Turbo', imagebam: 'ImageBam', imgbox: 'imgbox',
        pixhost: 'PixHost', jpg: 'jpg.su', redgifs: 'RedGIFs',
    };
    function linkLabel(a) {
        const txt = (a.textContent || '').trim();   // texto descritivo do link ("Filester - Part 1") é melhor que o host
        if (txt && txt.length <= 30 && !/^https?:\/\//i.test(txt) && !/^[a-z0-9.-]+\.[a-z]{2,}\/?$/i.test(txt)) return txt;
        const host = (a.hostname || '').toLowerCase().replace(/^www\./, '');
        for (const k in LINK_HOST_LABEL) if (host.indexOf(k) >= 0) return LINK_HOST_LABEL[k];
        return host.split('.')[0] || 'link';
    }
    function groupPostLinks(roots) {
        if (!document.documentElement.classList.contains('smg-thread')) return;   // só em thread (classList em vez de querySelector todo frame)
        const forumHost = location.hostname;
        eachIn(roots, '.message--post .message-body > .bbWrapper:not([data-smg-links])', bb => {   // .bbWrapper fica em article.message-body (não é filho direto de .message-userContent)
            bb.dataset.smgLinks = '1';
            const links = Array.from(bb.querySelectorAll('a[href^="http"]')).filter(a =>
                a.hostname !== forumHost                              // externo (pula menção/thread/quote do fórum)
                && !a.querySelector('img')                           // não é link de imagem (lightbox)
                && !a.classList.contains('smg-turbo-fallback')       // não é o fallback de embed
                && a.style.display !== 'none'                        // não foi escondido pelo directMedia
                && !a.closest('.bbCodeBlock, .bbCodeSpoiler, .bbCodeBlock--spoiler, .bbCodeQuote, .smg-post-links, .smg-fhcard, .smg-tw-card, .generic2wide-iframe-div, .smg-dm-wrap'));
            if (links.length < 2) return;   // só agrupa quando há vários pra juntar
            const bar = document.createElement('div');
            bar.className = 'smg-post-links';
            const seen = new Set();
            links.forEach(a => {
                if (seen.has(a.href)) return;
                seen.add(a.href);
                const chip = document.createElement('a');
                chip.className = 'smg-link-chip';
                chip.href = a.href; chip.target = '_blank'; chip.rel = 'noopener noreferrer';
                chip.innerHTML = ICONS.link;
                const lbl = document.createElement('span');
                lbl.textContent = linkLabel(a);
                chip.appendChild(lbl);
                bar.appendChild(chip);
            });
            if (bar.children.length >= 2) bb.appendChild(bar);
        });
    }
