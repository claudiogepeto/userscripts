    // =========================================================
    // FEATURES definidas tarde no arquivo + safe(). O INIT de verdade
    // (processAll / scheduleRun / boot) está logo abaixo, no part 22-init.
    //
    // Mapa: safe · setFavicon(SMG) · redirect-unwrap (b64decode/decodeProxyHref/bindProxyClick) ·
    //   reveal-liked(SMG) · saint embeds ·
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
    // =========================================================
    // FEATURE: pular o aviso de link externo (URL real direto)
    // SMG: /goto/link-confirmation?url=<base64> · Simp: /redirect/?to=<base64url>&m=b64
    // Centralizado em 06-helpers.js: b64decode, rawParam, decodeProxyHref, resolveProxyHref
    // =========================================================
    // VISUAL: no TEXTO mostrado (título de unfurl / link cru), troca a URL-proxy (/goto/link-confirmation?url=.. ou
    // /redirect/?to=..) pelo DESTINO real. O unwrap só reescrevia o href; o texto continuava com o /goto/...&s=hash feio.
    // Decodifica CADA ocorrência (resolveProxyHref) → vários links no mesmo nó OK; o que não decodifica fica intacto.
    function unproxyText(root) {
        if (!root || root.nodeType !== 1) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        const hits = [];
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            const v = n.nodeValue || '';
            if (v.indexOf('/goto/link-confirmation') >= 0 || v.indexOf('/redirect/?to=') >= 0 || v.indexOf('/link-proxy/') >= 0 || v.indexOf('/proxy.php?link=') >= 0) hits.push(n);
        }
        if (!hits.length) return;
        const rx = /(?:https?:\/\/[^\s"'<>]*)?\/(?:goto\/link-confirmation\?url=|redirect\/\?to=|link-proxy\/\?url=|proxy\.php\?link=)[^\s"'<>]+/g;
        hits.forEach(t => { t.nodeValue = t.nodeValue.replace(rx, m => { const r = resolveProxyHref(m); return (r && /^https?:/i.test(r)) ? r : m; }); });
    }
    // desarma o link-proxy e blank-handler do XF num <a>: garante que a.href aponte para o destino real
    function unproxyAttr(a) {
        if (!a) return;
        const raw = a.getAttribute('href') || a.getAttribute('data-proxy-href') || '';
        let real = resolveProxyHref(raw);
        if (!real || !/^https?:/i.test(real) || (typeof isProxyUrl === 'function' && isProxyUrl(real))) {
            const txt = a.textContent && a.textContent.trim();
            if (txt && /^https?:\/\/[^\s"'<>]+/i.test(txt)) {
                try {
                    const parsed = new URL(txt);
                    if (parsed.hostname && parsed.hostname !== location.hostname) real = txt;
                } catch (e) {}
            }
        }
        if (real && /^https?:/i.test(real) && !(typeof isProxyUrl === 'function' && isProxyUrl(real))) {
            if (a.getAttribute('href') !== real) a.setAttribute('href', real);
            a.href = real;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.dataset.smgUnwrap = '1';
        }
        a.removeAttribute('data-proxy-href');
        a.removeAttribute('data-blank-handler');
    }
    let proxyClickBound = false;
    function bindProxyClick() {
        if (proxyClickBound) return;
        proxyClickBound = true;
        // no WINDOW em capture: roda ANTES de qualquer listener de document (o XF tem um handler de
        // capture no document que dá preventDefault e matava o clique).
        window.addEventListener('click', e => {
            const a = e.target.closest && e.target.closest('a');
            if (!a) return;

            // Se o clique foi em uma imagem ou dentro de um <a> que embrulha uma imagem (ex.: goonbox, imgbox, smg-imglink, etc.):
            // não sequestra o clique — deixa o visualizador/modal (setupImageClickFeed) abrir a imagem!
            if (e.target.closest && (e.target.closest('img.bbImage, .bbImage') || (a && (a.classList.contains('smg-imglink') || a.querySelector('img.bbImage, .bbImage'))))) {
                return;
            }

            const rawHref = a.getAttribute('href') || '';
            const isProxy = a.hasAttribute('data-proxy-href') || (typeof isProxyUrl === 'function' ? (isProxyUrl(rawHref) || isProxyUrl(a.href)) : /[\/?](goto\/link-confirmation|redirect|link-proxy|proxy\.php)/i.test(a.href)) || a.hasAttribute('data-smg-unwrap');
            const isExternal = a.classList.contains('link--external') || a.classList.contains('smg-fhcard-main') || a.classList.contains('smg-fhcard-open') || a.classList.contains('smg-link-chip') || (a.hostname && a.hostname !== location.hostname);

            if (!isProxy && !isExternal) return;

            let real = resolveProxyHref(rawHref) || resolveProxyHref(a.href || '');
            if (!real || !/^https?:/i.test(real) || (typeof isProxyUrl === 'function' && isProxyUrl(real))) {
                const txt = a.textContent && a.textContent.trim();
                if (txt && /^https?:\/\/[^\s"'<>]+/i.test(txt)) {
                    try {
                        const parsed = new URL(txt);
                        if (parsed.hostname && parsed.hostname !== location.hostname) real = txt;
                    } catch (e) {}
                }
            }

            if (real && /^https?:/i.test(real) && !(typeof isProxyUrl === 'function' && isProxyUrl(real))) {
                if (a.getAttribute('href') !== real) a.setAttribute('href', real);
                a.href = real;
                a.dataset.smgUnwrap = '1';
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.removeAttribute('data-proxy-href');
                a.removeAttribute('data-blank-handler');

                if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
                    e.stopImmediatePropagation();
                    if (e.defaultPrevented) {
                        window.open(real, '_blank', 'noopener');
                    }
                }
            }
        }, true);
    }
    function unwrapRedirectLinks(roots) {
        bindProxyClick();
        // PERF: Escopado nos subtrees mutados (eachIn) sai ~0 no steady-state. O clique em link
        // não-reescrito ainda é garantido pelo capture do bindProxyClick; o full-scan periódico pega o que faltar.
        eachIn(roots, 'a[href*="/goto/link-confirmation"], a[href*="/redirect/"], a[href*="/proxy.php?link="], a[href*="/link-proxy/"], a[data-proxy-href]', a => {
            let real = resolveProxyHref(a.getAttribute('href') || a.getAttribute('data-proxy-href') || '');
            if (!real || !/^https?:/i.test(real) || (typeof isProxyUrl === 'function' && isProxyUrl(real))) {
                const txt = a.textContent && a.textContent.trim();
                if (txt && /^https?:\/\/[^\s"'<>]+/i.test(txt)) {
                    try {
                        const parsed = new URL(txt);
                        if (parsed.hostname && parsed.hostname !== location.hostname) real = txt;
                    } catch (e) {}
                }
            }
            if (real && /^https?:/i.test(real) && !(typeof isProxyUrl === 'function' && isProxyUrl(real))) {
                a.href = real;
                a.setAttribute('href', real);
                a.dataset.smgUnwrap = '1';
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.removeAttribute('data-proxy-href');
                a.removeAttribute('data-blank-handler');
                unproxyText(a);
            }
        });
    }
    // se o usuário CAIR direto na página de aviso, pula pro destino na hora
    function handleRedirectPage() {
        try {
            if (!/[\/?](goto\/link-confirmation|redirect|link-proxy)/i.test(location.pathname + location.search)) return;

            const realParam = resolveProxyHref(location.href) || decodeProxyHref(location.href);
            if (realParam && /^https?:/i.test(realParam) && !(typeof isProxyUrl === 'function' && isProxyUrl(realParam)) && realParam !== location.href) {
                location.replace(realParam);
                return;
            }

            const domTarget = document.querySelector('.simpLinkProxy-targetLink, .linkConfirmation-url, a.button--primary[href^="http"], a.button[href^="http"]:not([href*="login"]):not([href*="register"])');
            if (domTarget && domTarget.href && /^https?:/i.test(domTarget.href) && !domTarget.href.includes(location.hostname) && !(typeof isProxyUrl === 'function' && isProxyUrl(domTarget.href))) {
                location.replace(domTarget.href);
                return;
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
            if (link.closest('.bbCodeQuote, .bbCodeBlock--unfurl, .message-signature, .smg-fhcard, .smg-tw-card')) return;   // não embeda mídia citada / de assinatura (igual o groupPostLinks faz)
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
                const dio = getLazyEmbedIO();
                if (dio) {
                    dio.observe(v);
                    setTimeout(() => { if (v._smgActivate) v._smgActivate(); }, 250);
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
    // FEATURE: Turbo / Saint embeds & domain rewrite
    // =========================================================
    function processTurboEmbeds(roots) {
        // 1. IFRAMES nativos com domínios saint
        // Troca só o HOST saint (com borda). Sem isso, "esaint2.cr" vira "eturbo.cr"
        // ou "esaint2.creturbo.cr" porque "saint2.cr" casa no meio do nome.
        function rewriteSaintHost(value) {
            return String(value || '').replace(/(^|[^a-z0-9-])(?:https?:\/\/)?(?:[a-z0-9-]+\.)*saint2?\.(?:su|to|cr)(?![a-z0-9.-])/gi, (m, pre) => {
                const proto = /https?:\/\//i.test(m) ? m.match(/https?:\/\//i)[0] : '';
                return pre + proto + 'turbo.cr';
            });
        }
        eachIn(roots, 'iframe[src*="saint2.su"], iframe[src*="saint.su"], iframe[src*="saint2.cr"], iframe[src*="saint.cr"], iframe[src*="saint.to"], iframe[src*="saint2.to"]', ifr => {
            const src = ifr.getAttribute('src') || ifr.src || '';
            const newSrc = src.replace(/(?:https?:)?\/\/(?:[a-z0-9-]+\.)?(?:saint2?\.(?:su|to|cr))\b/i, 'https://turbo.cr');
            if (newSrc !== src) {
                ifr.setAttribute('src', newSrc);
            }
            if (!ifr.classList.contains('saint-iframe')) {
                ifr.classList.add('saint-iframe');
            }
        });

        // Página /v/ID e embed /embed/ID são o mesmo vídeo. O player é sempre o iframe /embed/.
        const TB_MEDIA_RE = /(?:https?:)?\/\/(?:[a-z0-9-]+\.)?(?:turbo\.cr|saint2?\.(?:su|to|cr))\/(?:embed|v)\/([a-zA-Z0-9_-]+)/i;
        const turboPlayer = id => {
            const wrapper = document.createElement('div');
            wrapper.className = 'generic2wide-iframe-div';
            wrapper.dataset.tbDone = '1';
            wrapper.innerHTML = '<iframe class="saint-iframe" src="https://turbo.cr/embed/' + id + '" loading="lazy" allow="fullscreen;" style="border:none;"></iframe>';
            return wrapper;
        };

        // 2. UNFURL CARDS com /embed/ ou /v/
        eachIn(roots, '.bbCodeBlock--unfurl[data-url*="turbo.cr/"]:not([data-tb-done]), .bbCodeBlock--unfurl[data-url*="saint"]:not([data-tb-done])', unfurl => {
            const dataUrl = unfurl.getAttribute('data-url') || '';
            const m = dataUrl.match(TB_MEDIA_RE);
            if (!m) return;
            unfurl.dataset.tbDone = '1';
            unfurl.replaceWith(turboPlayer(m[1]));
        });

        // 3. LINKS crus com /embed/ ou /v/
        eachIn(roots, 'a[href*="/embed/"]:not([data-tb-done]), a[href*="turbo.cr/v/"]:not([data-tb-done]), a[href*="saint2.su/v/"]:not([data-tb-done]), a[href*="saint.su/v/"]:not([data-tb-done]), a[href*="saint2.cr/v/"]:not([data-tb-done]), a[href*="saint.cr/v/"]:not([data-tb-done]), a[href*="saint.to/v/"]:not([data-tb-done]), a[href*="saint2.to/v/"]:not([data-tb-done])', link => {
            if (link.closest('.bbCodeQuote, .bbCodeBlock--quote, .message-signature, .smg-fhcard, .smg-turbo-fallback, .generic2wide-iframe-div, .smg-rg')) return;
            if (link.querySelector('img')) return;
            const unfurl = link.closest('.bbCodeBlock--unfurl');
            if (unfurl && unfurl.dataset.tbDone === '1') return;
            const href = resolveProxyHref(link.getAttribute('href') || link.href || '');
            const m = href.match(TB_MEDIA_RE);
            if (!m) return;
            link.dataset.tbDone = '1';
            const target = unfurl || link;
            target.dataset.tbDone = '1';
            target.replaceWith(turboPlayer(m[1]));
        });

        // 4. Demais links saint -> turbo.cr
        eachIn(roots, 'a[href*="saint2.su"], a[href*="saint.su"], a[href*="saint2.cr"], a[href*="saint.cr"], a[href*="saint.to"], a[href*="saint2.to"]', a => {
            const raw = a.getAttribute('href') || a.href || '';
            const replaced = rewriteSaintHost(raw);
            if (replaced !== raw) {
                a.setAttribute('href', replaced);
            }
            if (a.textContent && /(?:^|[^a-z0-9-])saint2?\.(?:su|to|cr)(?![a-z0-9.-])/i.test(a.textContent)) {
                a.textContent = rewriteSaintHost(a.textContent);
            }
        });
    }

    // =========================================================
    // FEATURE: cards de link p/ FILE-HOSTS (Pixeldrain, Bunkr, GoFile, Cyberdrop, MEGA, …) — SEM player inline. Card CLARO e
    // CONSISTENTE: thumb/logo à ESQUERDA + host + tipo (Arquivo/Galeria, com contagem onde dá) + ↗. Clicar abre no host.
    // Provider casado por SUBSTRING do host (robusto ao TLD que muda, ex.: bunkr). Substitui o link cru OU o unfurl do XF.
    //   Pixeldrain: API → galeria (contagem + cluster de thumbs) / arquivo (thumbnail). Bunkr: foto do figure do unfurl.
    //   Demais: logo do host (favicon do unfurl, senão {origin}/favicon.ico) + tipo pelo padrão da URL.
    // =========================================================
    const LINK_HOST_LABEL = {
        gofile: 'GoFile', bunkr: 'Bunkr', pixeldrain: 'Pixeldrain', cyberdrop: 'Cyberdrop',
        cyberfile: 'Cyberfile', filester: 'Filester', fileditch: 'Fileditch', goonbox: 'Goonbox', 'mega.nz': 'MEGA', mediafire: 'MediaFire',
        k2s: 'K2S', keep2share: 'K2S', fikper: 'Fikper', rapidgator: 'Rapidgator',
        saint: 'Saint', 'turbo.cr': 'Turbo', imagebam: 'ImageBam', imgbox: 'imgbox',
        pixhost: 'PixHost', jpg: 'jpg.su', redgifs: 'RedGIFs',
    };
    const FH_PROVIDERS = [
        { key: 'pixeldrain', label: 'Pixeldrain', sub: 'pixeldrain.com', re: /pixeldrain\.com/i, logo: 'https://pixeldrain.com/res/img/pixeldrain_128.png', gallery: /\/(?:l|api\/list)\//i },
        { key: 'bunkr', label: 'Bunkr', sub: 'bunkr', re: /bunkr/i, gallery: /\/a\//i, home: 'bunkr.cr' },   // dezenas de espelhos: o ícone vem do canônico quando o espelho não serve
        { key: 'goonbox', label: 'Goonbox', sub: 'goonbox', re: /goonbox\./i, gallery: /\/a\//i, home: 'goonbox.cr', logo: 'https://goonbox.cr/apple-touch-icon.png' },   // /a/ = álbum (galeria), /v/ ou /d/ = arquivo
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
        if (!node || !card) return;
        if (node.classList && node.classList.contains('smg-dead')) return;
        if (node.closest && node.closest('.smg-dead')) return;
        const host = node.closest('.bbCodeBlock--unfurl') || node;
        // TÍTULO DO LINK: quando o <a> tem TEXTO próprio (não a URL crua), ele é a única descrição do
        // item. Esconder o link jogava esse texto fora e uma lista de 80 links virava 80 cards
        // "Bunkr · Arquivo" idênticos. Título vira a linha de cima; host/tipo descem pra secundária.
        if (node.tagName === 'A') {
            const txt = (node.textContent || '').replace(/\s+/g, ' ').trim();
            const h = card.querySelector('.smg-fhcard-host'), s = card.querySelector('.smg-fhcard-sub');
            if (h && s && txt.length > 2 && !/^https?:\/\//i.test(txt) && !/^(?:Error|404|403|502|504|unavailable)/i.test(txt)) {
                let plat = card.querySelector('.smg-fhcard-platform');
                if (!plat && h.textContent && h.textContent.toLowerCase() !== txt.toLowerCase()) {
                    plat = document.createElement('span');
                    plat.className = 'smg-fhcard-platform';
                    plat.textContent = h.textContent;
                    h.parentNode.insertBefore(plat, h);
                }
                h.textContent = txt;
            }
        }
        // Encaixa o card exatamente onde o host (unfurl ou link) estava no DOM
        host.insertAdjacentElement('afterend', card);
        host.style.setProperty('display', 'none', 'important');
        const prev = host.previousElementSibling;
        if (prev) {
            const raw = (prev.textContent || '').replace(/\s+/g, ' ').trim();
            const bare = prev.matches && prev.matches('a, .bbCodeBlock, .bbCodeBlock--unfurl');
            if (bare && /^https?:\/\/\S+$/i.test(raw)) prev.style.setProperty('display', 'none', 'important');
        }
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
    function fhExtractUnfurlMeta(unfurlEl) {
        if (!unfurlEl) return { title: '', snippet: '', thumb: '' };
        const titleEl = unfurlEl.querySelector('.js-unfurl-title, .contentRow-header a, .contentRow-header, .bbCodeBlockUnfurl-title');
        let title = titleEl ? (titleEl.textContent || '').replace(/\s+/g, ' ').trim() : '';
        const snipEl = unfurlEl.querySelector('.contentRow-snippet, .contentRow-minor');
        let snippet = snipEl ? (snipEl.textContent || '').replace(/\s+/g, ' ').trim() : '';
        const img = unfurlEl.querySelector('.js-unfurl-figure img, .contentRow-figure img, .bbCodeBlockUnfurl-image, .contentRow-figure--fixedSmall img');
        let thumb = '';
        if (img) {
            let src = img.getAttribute('data-url') || img.getAttribute('src') || img.src || '';
            if (src && !/^data:|\/favicon\.ico|\/fav\.ico/i.test(src)) thumb = src;
        }
        return { title, snippet, thumb };
    }
    function fhExtractUnfurlThumb(unfurlEl) {
        const m = fhExtractUnfurlMeta(unfurlEl);
        return m.thumb ? [m.thumb] : [];
    }
    function fhUpdateCardThumbs(card, thumbs, count, logoChain, label, key) {
        const th = card.querySelector('.smg-fhcard-thumb');
        if (!th) return;
        th.innerHTML = '';
        th.className = 'smg-fhcard-thumb' + (thumbs.length > 1 ? ' smg-fhcard-thumb--multi' : '');
        thumbs.forEach((u, i) => {
            const cell = document.createElement('span'); cell.className = 'smg-fhcard-cell';
            const im = document.createElement('img'); im.loading = 'lazy'; im.src = u; im.alt = ''; im.referrerPolicy = 'no-referrer';
            cell.appendChild(im);
            if (i === thumbs.length - 1 && count > thumbs.length) {
                const more = document.createElement('span'); more.className = 'smg-fhcard-more';
                more.textContent = '+' + (count - thumbs.length);
                cell.appendChild(more);
            }
            th.appendChild(cell);
        });
        if (count > 1) {
            const b = document.createElement('span'); b.className = 'smg-fhcard-count';
            b.innerHTML = ICONS.layers + '<b>' + count + '</b>';
            th.appendChild(b);
        }
    }
    // card RICO: [mosaico de thumbs (até 4) c/ badge de contagem + "+N" no último | logo do host] + host + sub | [copiar] [abrir↗].
    // o = { label, href, sub, thumbs:[], logo:[], count:0 }
    function fhCard(o) {
        const href = resolveProxyHref(o.href), logoChain = o.logo || [];
        const thumbs = (o.thumbs || []).filter(Boolean).slice(0, 4);
        const count = o.count || 0;
        const platformName = o.platform || (o.key && (LINK_HOST_LABEL[o.key] || o.key.charAt(0).toUpperCase() + o.key.slice(1))) || '';
        const isCustomTitle = Boolean(platformName && o.label && o.label.toLowerCase() !== platformName.toLowerCase());
        const card = document.createElement('div'); card.className = 'smg-fhcard'; card.dataset.fhDone = '1';
        if (o.key) card.dataset.key = o.key;
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
        if (isCustomTitle) {
            const p = document.createElement('span');
            p.className = 'smg-fhcard-platform';
            p.textContent = platformName;
            body.appendChild(p);
        }
        let subText = o.sub || '';
        if (isCustomTitle && subText && platformName) {
            const escPlat = platformName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            subText = subText.replace(new RegExp('^' + escPlat + '\\s*·\\s*', 'i'), '');
        }
        const t = document.createElement('span'); t.className = 'smg-fhcard-host'; t.textContent = o.label;
        const s = document.createElement('span'); s.className = 'smg-fhcard-sub'; s.textContent = subText;
        body.append(t, s);
        main.appendChild(body);
        const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'smg-fhcard-btn smg-fhcard-copy'; copy.title = i18n('Copy link'); copy.setAttribute('aria-label', i18n('Copy link')); copy.innerHTML = ICONS.share;
        copy.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); fhCopy(href, copy); });
        const open = document.createElement('a'); open.className = 'smg-fhcard-btn smg-fhcard-open'; open.href = href; open.target = '_blank'; open.rel = 'noopener noreferrer'; open.dataset.fhDone = '1'; open.title = i18n('Open'); open.setAttribute('aria-label', i18n('Open')); open.innerHTML = ICONS.rgExternal;
        card.append(main, copy, open);
        return card;
    }
    const pdCache = new Map();
    const pdInflight = new Map();
    function fhPixeldrain(node, url, unfurlEl) {
        const logo = ['https://pixeldrain.com/res/img/pixeldrain_128.png'];
        const lid = url.match(/pixeldrain\.com\/(?:l|api\/list)\/([a-z0-9]+)/i);
        const fid = url.match(/pixeldrain\.com\/(?:u|d|file|api\/file)\/([a-z0-9]+)/i) || url.match(/pixeldrain\.com\/([a-z0-9]{6,})(?:[/?#]|$)/i);

        const meta = fhExtractUnfurlMeta(unfurlEl);
        const initialThumb = meta.thumb ? [meta.thumb] : (fid ? ['https://pixeldrain.com/api/file/' + fid[1] + '/thumbnail'] : []);
        const initialLabel = meta.title && !/pixeldrain/i.test(meta.title) ? meta.title : 'Pixeldrain';
        const initialSub = meta.snippet ? ('Pixeldrain · ' + meta.snippet) : (lid ? i18n('Gallery') : i18n('File'));

        const card = fhCard({ key: 'pixeldrain', platform: 'Pixeldrain', label: initialLabel, href: url, sub: initialSub, logo: logo, thumbs: initialThumb });
        pdPlace(node, card);

        if (!lid || !GMX) return;
        const listId = lid[1];
        const updateCard = files => {
            if (!files || !files.length || !card.isConnected) return;
            const subEl = card.querySelector('.smg-fhcard-sub');
            if (subEl) subEl.textContent = fhSub(i18n('Gallery'), files.length);
            const thumbs = files.slice(0, 4).map(f => 'https://pixeldrain.com/api/file/' + f.id + '/thumbnail');
            fhUpdateCardThumbs(card, thumbs, files.length, logo, initialLabel, 'pixeldrain');
        };

        if (pdCache.has(listId)) { updateCard(pdCache.get(listId)); return; }
        if (pdInflight.has(listId)) { pdInflight.get(listId).push(updateCard); return; }
        pdInflight.set(listId, [updateCard]);

        gmGetJSON('https://pixeldrain.com/api/list/' + listId).then(j => {
            const files = (j && j.files) || [];
            pdCache.set(listId, files);
            const cbs = pdInflight.get(listId) || [];
            pdInflight.delete(listId);
            cbs.forEach(cb => { try { cb(files); } catch (e) {} });
        }, () => {
            pdCache.set(listId, []);
            pdInflight.delete(listId);
        });
    }
    // GOFILE: NÃO fazemos NENHUM request (a API/token/wt do gofile dá rate-limit e bloqueio temporário).
    // Cai no card genérico do fhBuildCard (label + logo + "Gallery"), zero chamadas → impossível tomar rate limit.
    // BUNKR: álbum (/a/) → raspa a página por thumbs + contagem. Arquivo único → foto do figure do unfurl.
    const bunkrCache = new Map();
    const bunkrInflight = new Map();
    function fhBunkr(node, url, unfurlEl) {
        const logo = fhLogoChain({ key: 'bunkr', home: 'bunkr.cr' }, url, unfurlEl);
        const meta = fhExtractUnfurlMeta(unfurlEl);
        const isAlbum = /\/a\//i.test(url);
        const initialThumb = meta.thumb ? [meta.thumb] : [];
        const initialLabel = meta.title && !/bunkr/i.test(meta.title) ? meta.title : 'Bunkr';
        const initialSub = meta.snippet ? ('Bunkr · ' + meta.snippet) : (isAlbum ? i18n('Gallery') : i18n('File'));

        const card = fhCard({ key: 'bunkr', platform: 'Bunkr', label: initialLabel, href: url, sub: initialSub, logo: logo, thumbs: initialThumb });
        pdPlace(node, card);

        if (!isAlbum || !GMX) return;
        const albumKey = url;
        const updateCard = data => {
            if (!data || !card.isConnected) return;
            if (data.count) {
                const subEl = card.querySelector('.smg-fhcard-sub');
                if (subEl) subEl.textContent = fhSub(i18n('Gallery'), data.count);
            }
            if (data.thumbs && data.thumbs.length) {
                fhUpdateCardThumbs(card, data.thumbs.slice(0, 4), data.count, logo, initialLabel, 'bunkr');
            }
        };

        if (bunkrCache.has(albumKey)) { updateCard(bunkrCache.get(albumKey)); return; }
        if (bunkrInflight.has(albumKey)) { bunkrInflight.get(albumKey).push(updateCard); return; }
        bunkrInflight.set(albumKey, [updateCard]);

        GMX({ method: 'GET', url: url, timeout: 10000, onload: r => {
            let doc; try { doc = new DOMParser().parseFromString(r.responseText || '', 'text/html'); } catch (e) { return; }
            const seen = new Set(), thumbs = [];
            doc.querySelectorAll('img[src*="thumb"], img[data-src*="thumb"], [class*="grid"] img').forEach(im => {
                let s = im.getAttribute('data-src') || im.getAttribute('src') || '';
                if (!s || /^data:|\.svg|sprite|logo|fav/i.test(s)) return;
                try { s = new URL(s, url).href; } catch (e) { return; }
                if (!seen.has(s)) { seen.add(s); thumbs.push(s); }
            });
            const count = doc.querySelectorAll('[class*="grid"] a[href*="/f/"], a[href*="/f/"], a[href*="/i/"], a[href*="/v/"]').length || thumbs.length;
            const res = { count, thumbs };
            bunkrCache.set(albumKey, res);
            const cbs = bunkrInflight.get(albumKey) || [];
            bunkrInflight.delete(albumKey);
            cbs.forEach(cb => { try { cb(res); } catch (e) {} });
        }, onerror: () => bunkrInflight.delete(albumKey), ontimeout: () => bunkrInflight.delete(albumKey) });
    }
    // GOONBOX: álbum (/a/) → raspa a página por thumbs + contagem (igual bunkr).
    // Arquivo único (/v/, /d/) → foto do figure do unfurl.
    const goonboxCache = new Map();
    const goonboxInflight = new Map();
    function fhGoonbox(node, url, prov, unfurlEl) {
        const logo = fhLogoChain(prov || { key: 'goonbox', home: 'goonbox.cr', logo: 'https://goonbox.cr/apple-touch-icon.png' }, url, unfurlEl);
        const meta = fhExtractUnfurlMeta(unfurlEl);
        const isAlbum = /\/a\//i.test(url);
        const initialThumb = meta.thumb ? [meta.thumb] : [];
        const initialLabel = meta.title && !/goonbox/i.test(meta.title) ? meta.title : 'Goonbox';
        const initialSub = meta.snippet ? ('Goonbox · ' + meta.snippet) : (isAlbum ? i18n('Gallery') : i18n('File'));

        const card = fhCard({ key: 'goonbox', platform: 'Goonbox', label: initialLabel, href: url, sub: initialSub, logo: logo, thumbs: initialThumb });
        pdPlace(node, card);

        if (!isAlbum || !GMX) return;
        const albumKey = url;
        const updateCard = data => {
            if (!data || !card.isConnected) return;
            if (data.count) {
                const subEl = card.querySelector('.smg-fhcard-sub');
                if (subEl) subEl.textContent = fhSub(i18n('Gallery'), data.count);
            }
            if (data.thumbs && data.thumbs.length) {
                fhUpdateCardThumbs(card, data.thumbs.slice(0, 4), data.count, logo, initialLabel, 'goonbox');
            }
        };

        if (goonboxCache.has(albumKey)) { updateCard(goonboxCache.get(albumKey)); return; }
        if (goonboxInflight.has(albumKey)) { goonboxInflight.get(albumKey).push(updateCard); return; }
        goonboxInflight.set(albumKey, [updateCard]);

        GMX({ method: 'GET', url: url, timeout: 10000, onload: r => {
            let doc; try { doc = new DOMParser().parseFromString(r.responseText || '', 'text/html'); } catch (e) { return; }
            const seen = new Set(), thumbs = [];
            doc.querySelectorAll('img[src*="thumb"], img[data-src*="thumb"], [class*="grid"] img, .file-thumb img, .gallery-item img').forEach(im => {
                let s = im.getAttribute('data-src') || im.getAttribute('src') || '';
                if (!s || /^data:|\.svg|sprite|logo|fav/i.test(s)) return;
                try { s = new URL(s, url).href; } catch (e) { return; }
                if (!seen.has(s)) { seen.add(s); thumbs.push(s); }
            });
            const count = doc.querySelectorAll('[class*="grid"] a[href*="/f/"], [class*="grid"] a[href*="/v/"], [class*="grid"] a[href*="/d/"], a[href*="/f/"], a[href*="/i/"], a[href*="/v/"], a[href*="/d/"], .file-row').length || thumbs.length;
            const res = { count, thumbs };
            goonboxCache.set(albumKey, res);
            const cbs = goonboxInflight.get(albumKey) || [];
            goonboxInflight.delete(albumKey);
            cbs.forEach(cb => { try { cb(res); } catch (e) {} });
        }, onerror: () => goonboxInflight.delete(albumKey), ontimeout: () => goonboxInflight.delete(albumKey) });
    }
    // FILESTER: arquivo único (/d/{slug}). A página HTML toma Cloudflare 403, MAS a API pública JSON responde —
    // POST /api/public/view {file_slug} → view_url; mp4 = https://cn1.filester.me{view_url} (mesma engine do site).
    // VÍDEO → embeda o player nativo (igual saint/turbo); imagem/galeria/falha → card. (galeria = /f/, arquivo = /d/)
    function fhFilester(node, url, prov, unfurlEl) {
        const logo = fhLogoChain(prov, url, unfurlEl);
        const isFile = /\/d\//i.test(url);
        const thumbs = fhExtractUnfurlThumb(unfurlEl);
        pdPlace(node, fhCard({ key: 'filester', platform: 'Filester', label: 'Filester', href: url, sub: isFile ? i18n('File') : i18n('Gallery'), logo: logo, thumbs: thumbs }));
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
            platform: 'Instagram',
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
            platform: 'X (Twitter)',
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

    const twBlobs = [];
    function twRegisterBlob(video, blobUrl) {
        twBlobs.push({ video, url: blobUrl });
        while (twBlobs.length > 8) {
            const idx = twBlobs.findIndex(e => e.video !== video && (!e.video || e.video.paused));
            if (idx < 0) break;
            const old = twBlobs.splice(idx, 1)[0];
            try { URL.revokeObjectURL(old.url); } catch (x) {}
            if (old.video) {
                old.video.removeAttribute('src');
                try { old.video.load(); } catch (x) {}
                delete old.video._twBlobLoaded;
            }
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
            avImg.referrerPolicy = 'no-referrer';
            avImg.setAttribute('referrerpolicy', 'no-referrer');
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

            let videoUrl = videos[0].url;
            if (Array.isArray(videos[0].formats)) {
                const mp4s = videos[0].formats.filter(f => f && f.url && f.container === 'mp4' && !/\.m3u8/i.test(f.url));
                if (mp4s.length) {
                    const pref = mp4s.find(f => /1280x720|720/i.test(f.url) || (f.bitrate >= 1500000 && f.bitrate <= 3500000)) || mp4s[mp4s.length - 1];
                    if (pref && pref.url) videoUrl = pref.url;
                }
            } else if (Array.isArray(videos[0].variants)) {
                const mp4s = videos[0].variants.filter(f => f && f.url && (f.content_type === 'video/mp4' || /\.mp4(\?|$)/i.test(f.url)));
                if (mp4s.length) {
                    const pref = mp4s.find(f => /1280x720|720/i.test(f.url) || (f.bitrate >= 1500000 && f.bitrate <= 3500000)) || mp4s[mp4s.length - 1];
                    if (pref && pref.url) videoUrl = pref.url;
                }
            }

            const vid = document.createElement('video');
            vid.controls = true;
            vid.playsInline = true;
            vid.preload = 'metadata';
            vid.referrerPolicy = 'no-referrer';
            vid.setAttribute('referrerpolicy', 'no-referrer');
            if (videos[0].thumbnail_url) {
                vid.poster = videos[0].thumbnail_url;
            }
            vid._twVideoUrl = videoUrl;

            const playOverlay = document.createElement('div');
            playOverlay.className = 'smg-tw-play-overlay';
            playOverlay.innerHTML = '<div class="smg-tw-play-icon"><svg viewBox="0 0 24 24" width="28" height="28" fill="white"><path d="M8 5v14l11-7z"/></svg></div>';

            const loadAndPlay = (autoPlay) => {
                if (vid._twBlobLoaded) {
                    if (autoPlay) vid.play().catch(() => {});
                    if (playOverlay.parentNode) playOverlay.remove();
                    return;
                }
                if (autoPlay) vid._wantPlay = true;
                if (vid._twLoading) {
                    playOverlay.classList.add('loading');
                    playOverlay.innerHTML = '<div class="smg-tw-spinner"></div>';
                    return;
                }
                vid._twLoading = true;
                if (autoPlay) {
                    playOverlay.classList.add('loading');
                    playOverlay.innerHTML = '<div class="smg-tw-spinner"></div>';
                }

                const applySrc = (srcUrl, isBlob) => {
                    vid._twBlobLoaded = true;
                    vid._twLoading = false;
                    vid.src = srcUrl;
                    if (isBlob) twRegisterBlob(vid, srcUrl);
                    if (playOverlay.parentNode) playOverlay.remove();
                    if (vid._wantPlay) {
                        vid.play().catch(() => {});
                    }
                };

                if (typeof rgBlob === 'function') {
                    rgBlob(videoUrl, 'https://x.com/').then(blob => {
                        if (!vid.isConnected) return;
                        const blobUrl = URL.createObjectURL(blob);
                        applySrc(blobUrl, true);
                    }).catch(err => {
                        console.warn('[smg-tw] rgBlob falhou para vídeo do Twitter, tentando fallback:', err);
                        if (!vid.isConnected) return;
                        applySrc(videoUrl, false);
                    });
                } else {
                    applySrc(videoUrl, false);
                }
            };

            playOverlay.addEventListener('click', e => {
                e.stopPropagation();
                loadAndPlay(true);
            });

            vid.addEventListener('play', () => {
                if (typeof rgSolo === 'function') rgSolo(vid);
                if (playOverlay.parentNode) playOverlay.remove();
            });

            // Pré-carregamento lazy ao aproximar 200% da viewport
            if (typeof makeLazyIO === 'function' && !(typeof window !== 'undefined' && window.__TEST_MODE__)) {
                const lazyObs = makeLazyIO(() => {
                    loadAndPlay(false);
                }, { rootMargin: '200% 0px' });
                if (lazyObs) lazyObs.observe(mwrap);
            } else if (typeof window !== 'undefined' && window.__TEST_MODE__) {
                vid.src = videoUrl;
            }

            mwrap.appendChild(vid);
            mwrap.appendChild(playOverlay);
            card.appendChild(mwrap);
        } else if (photos.length === 1) {
            const mwrap = document.createElement('div');
            mwrap.className = 'smg-tw-media';
            const img = document.createElement('img');
            img.referrerPolicy = 'no-referrer';
            img.setAttribute('referrerpolicy', 'no-referrer');
            img.src = photos[0].url;
            img.loading = 'lazy';
            mwrap.appendChild(img);
            card.appendChild(mwrap);
        } else if (photos.length > 1) {
            const mwrap = document.createElement('div');
            mwrap.className = 'smg-tw-media smg-tw-media-grid';
            photos.slice(0, 4).forEach(p => {
                const img = document.createElement('img');
                img.referrerPolicy = 'no-referrer';
                img.setAttribute('referrerpolicy', 'no-referrer');
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

    function renderTwitterOfficialEmbed(container, tweetId, fallbackUrl, rawLabel, user) {
        if (!container || container.dataset.twEmbedDone || container.closest('.smg-twitter-embed, .smg-tw-card')) return;
        container.dataset.twEmbedDone = '1';
        container.dataset.twDone = '1';
        container.dataset.fhDone = '1';
        container.innerHTML = '';
        container.className = 'smg-twitter-embed';
        container.style.cssText = 'min-height: 80px; display: flex; justify-content: center; margin: 14px 0; max-width: 100%; width: 100%;';

        const tweetUrl = fallbackUrl || ('https://x.com/i/status/' + tweetId);
        const skel = makeTwitterCard(tweetUrl, tweetId, user || '', rawLabel);
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
        fhBuildCardNow(node, url, prov, unfurlEl);
    }
    function fhBuildCardNow(node, url, prov, unfurlEl) {
        if (!node.isConnected) return;   // o post saiu do DOM (feed paginou) enquanto esperava a vez
        if (!unfurlEl && node.closest) {
            unfurlEl = node.closest('.bbCodeBlock--unfurl');
        }
        if (prov.key === 'pixeldrain') { fhPixeldrain(node, url, unfurlEl); return; }
        if (prov.key === 'bunkr') { fhBunkr(node, url, unfurlEl); return; }   // gofile cai no card genérico abaixo (ZERO requests → sem rate limit)
        if (prov.key === 'goonbox') { fhGoonbox(node, url, prov, unfurlEl); return; }
        if (prov.key === 'filester') { fhFilester(node, url, prov, unfurlEl); return; }
        if (prov.key === 'instagram') {
            const rawHref = resolveProxyHref(url || (node.getAttribute && (node.getAttribute('data-url') || node.getAttribute('href'))) || node.href || '');
            let id = '';
            const im = rawHref.match(/instagram\.com\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/i);
            if (im) id = im[1];
            const labelText = unfurlEl ? (unfurlEl.querySelector('.js-unfurl-title, .contentRow-header')?.textContent?.trim() || '') : (node.tagName === 'A' ? node.textContent.trim() : '');
            const card = makeInstagramCard(rawHref, id, labelText || node.textContent);
            pdPlace(node, card);
            return;
        }
        if (prov.key === 'x' || prov.key === 'twitter') {
            const rawHref = resolveProxyHref(url || (node.getAttribute && (node.getAttribute('data-url') || node.getAttribute('href'))) || node.href || '');
            let id = '', user = '';
            const sm = rawHref.match(/(?:twitter|x)\.com\/(?:([A-Za-z0-9_]+)\/status|i\/status)\/([0-9]+)/i);
            if (sm) { user = sm[1] || ''; id = sm[2]; }
            const target = node.closest('.bbCodeBlock--unfurl') || node;
            target.dataset.fhDone = '1';
            target.dataset.twDone = '1';
            const labelText = unfurlEl ? (unfurlEl.querySelector('.js-unfurl-title, .contentRow-header')?.textContent?.trim() || '') : (node.tagName === 'A' ? node.textContent.trim() : '');
            if (id) {
                const container = document.createElement('div');
                pdPlace(node, container);
                renderTwitterOfficialEmbed(container, id, rawHref, labelText, user);
            } else {
                const card = makeTwitterCard(rawHref, id, user, labelText || node.textContent);
                pdPlace(node, card);
            }
            return;
        }
        const meta = fhExtractUnfurlMeta(unfurlEl);
        let label = prov.label;
        if (meta.title && !new RegExp(prov.key, 'i').test(meta.title) && meta.title.length > 2) {
            label = meta.title;
        }
        const sub = meta.snippet ? (prov.label + ' · ' + meta.snippet)
            : ((prov.gallery && prov.gallery.test(url)) ? i18n('Gallery') : (/\.(mp4|webm|m4v|mov|mkv)(\?|#|$)/i.test(url) ? i18n('Video') : i18n('File')));
        const thumbs = meta.thumb ? [meta.thumb] : [];
        pdPlace(node, fhCard({ key: prov.key, platform: prov.label, label: label, href: url, sub: sub, logo: fhLogoChain(prov, url, unfurlEl), thumbs: thumbs }));
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
            const url = resolveProxyHref(card.getAttribute('data-url') || '');
            const prov = fhProvider(url, card.getAttribute('data-host'));
            if (prov) fhBuildCard(card, url, prov, card);
        });
        // LINKS crus (sem unfurl) dos providers
        eachIn(roots, FH_BARE_SEL, a => {
            a.dataset.fhDone = '1';
            if (a.classList.contains('smg-dead') || a.closest('.smg-dead, .auto-image-grid')) return;
            if (a.closest('.bbCodeQuote, .message-signature, .smg-post-links, .smg-fhcard, .smg-tw-card, .generic2wide-iframe-div, .smg-dm-wrap, .bbCodeBlock--unfurl, .smg-ig-embed-wrap, .smg-twitter-embed, blockquote.instagram-media')) return;
            if (a.querySelector('img.bbImage')) return;   // link de imagem (lightbox)
            const url = absUrl(resolveProxyHref(a.getAttribute('href') || '') || a.href);
            const prov = fhProvider(url);
            if (prov && prov.skip && prov.skip.test(url)) return;   // esse padrão de URL é tratado por outro pass (ex.: cyberdrop /e/ → player)
            if (prov) fhBuildCard(a, url, prov, null);
        });
    }

    // =========================================================
    // FEATURE: agrupa os links NÃO-embedados (file hosts: GoFile/Bunkr/Pixeldrain/…) numa barra de chips
    // no fim do post, SEM tirar nada do texto. Pula internos (menção/thread/quote), imagens e embeds.
    // =========================================================
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

    if (typeof window !== 'undefined' && window.__TEST_MODE__) {
        window.buildTwitterCardDom = buildTwitterCardDom;
        window.renderTwitterOfficialEmbed = renderTwitterOfficialEmbed;
        window.fhExtractUnfurlMeta = fhExtractUnfurlMeta;
        window.fhExtractUnfurlThumb = fhExtractUnfurlThumb;
        window.fhUpdateCardThumbs = fhUpdateCardThumbs;
        window.fhPixeldrain = fhPixeldrain;
        window.fhBunkr = fhBunkr;
        window.fhGoonbox = fhGoonbox;
        window.pdCache = pdCache;
        window.pdInflight = pdInflight;
        window.bunkrCache = bunkrCache;
        window.bunkrInflight = bunkrInflight;
        window.processFileHostCards = processFileHostCards;
        window.processDirectMedia = processDirectMedia;
        window.__processTurboEmbeds = processTurboEmbeds;
        window.processTurboEmbeds = processTurboEmbeds;
        window.fhCard = fhCard;
        window.pdPlace = pdPlace;
        window.unwrapRedirectLinks = unwrapRedirectLinks;
        window.__unwrapRedirectLinks = unwrapRedirectLinks;
        window.unproxyAttr = unproxyAttr;
        window.handleRedirectPage = handleRedirectPage;
    }
