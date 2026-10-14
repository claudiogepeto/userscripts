    // =========================================================
    // FEATURE: auto full images + portrait grid
    // =========================================================

    // 2 tiers de preload (anti-CLS no scroll rápido):
    //  · thumbIO (alcance GRANDE, 3000px): força a THUMB a carregar bem antes da viewport. Thumb é
    //    pequena/barata → fixa o tamanho da caixa cedo, então mesmo num fling a imagem já entra dimensionada.
    //  · fullIO (alcance médio, 1800px): troca pra full mais perto (qualidade). Como a thumb já carregou
    //    e tem a MESMA proporção, o swap não mexe no layout.
    let thumbIO = null, medIO = null, fullIO = null;
    // Swaps in a higher-quality file only once it is downloaded and decoded, so the thumbnail stays visible until
    // the replacement can paint in one frame (no blank/flash). The box size never depends on the file (see
    // setVerticalMaxWidth / the wide rules), so the swap cannot move the page. A failed upgrade keeps the thumbnail.
    function swapImgSrc(img, url) {
        if (!img || !url) return;
        const targetAbs = absUrl(url);
        const currentAbs = absUrl(img.currentSrc || img.src || img.getAttribute('src') || '');
        if (!targetAbs || currentAbs === targetAbs || img.dataset.smgSwapping === targetAbs) return;
        img.dataset.smgSwapping = targetAbs;
        if (!img.style.aspectRatio && img.naturalWidth && img.naturalHeight) {
            img.style.aspectRatio = img.naturalWidth + ' / ' + img.naturalHeight;
        }
        const initialPolicy = img.getAttribute('referrerpolicy') || img.referrerPolicy || '';
        const loadWithPolicy = (policy, canRetry) => {
            const pre = new Image();
            if (policy) pre.referrerPolicy = policy;
            pre.decoding = 'async';
            const apply = () => {
                if (img.dataset.smgSwapping === targetAbs) {
                    delete img.dataset.smgSwapping;
                    if (img.isConnected !== false) {
                        if (policy) img.referrerPolicy = policy;
                        else img.removeAttribute('referrerpolicy');
                        img.src = targetAbs;
                        relayoutPostGroupOf(img);
                    }
                }
            };
            pre.onload = () => {
                (pre.decode ? pre.decode().catch(() => {}) : Promise.resolve()).then(apply);
            };
            pre.onerror = () => {
                if (canRetry) {
                    // CDNs com proteção anti-hotlink podem rejeitar o Referer do fórum. Tenta fallback sem referrer.
                    loadWithPolicy('no-referrer', false);
                } else {
                    if (img.dataset.smgSwapping === targetAbs) delete img.dataset.smgSwapping;
                }
            };
            pre.src = targetAbs;
            if (pre.complete && pre.naturalWidth) {
                apply();
            }
        };
        loadWithPolicy(initialPolicy, !initialPolicy);
    }
    function getThumbIO() {   // tira a THUMB do lazy nativo (loading=eager) bem antes da viewport (3000px)
        return thumbIO || (thumbIO = makeLazyIO(el => { el.loading = 'eager'; }, { rootMargin: '1200px 0px' }));
    }
    function getMedIO() {     // troca pra MÉDIA (.md.) mais perto da tela (thumb já dá o tamanho → swap sem flash)
        return medIO || (medIO = makeLazyIO(img => {
            const target = (FEATURES.replaceThumbsWithFull && img.dataset.smgFull) ? img.dataset.smgFull : img.dataset.smgMed;
            if (target && img.getAttribute('src') !== target) swapImgSrc(img, target);
        }, { rootMargin: '2000px 0px' }));   // 2000px: troca bem antes de aparecer (mesma proporção da thumb → não desloca nada)
    }
    function getFullIO() {    // troca pra FULL (.jpg) em imagens standalone/sheets perto da tela (ou em todas se replaceThumbsWithFull estiver ativo)
        return fullIO || (fullIO = makeLazyIO(img => {
            if (!FEATURES.replaceThumbsWithFull && img.closest && img.closest('.auto-image-grid')) return;
            const full = img.dataset.smgFull;
            if (full) {
                const targetAbs = absUrl(full);
                const currentAbs = absUrl(img.currentSrc || img.src || img.getAttribute('src') || '');
                if (targetAbs && targetAbs !== currentAbs) {
                    if (!img.style.aspectRatio && img.naturalWidth && img.naturalHeight) {
                        img.style.aspectRatio = img.naturalWidth + ' / ' + img.naturalHeight;
                    }
                    swapImgSrc(img, targetAbs);
                }
            }
        }, { rootMargin: '1200px 0px' }));
    }

    // remove os <br> (+ whitespace) que separam DOIS chips de link adjacentes — post que é só lista de links (jpg6/jpg5 &
    // afins, sem img renderizável) ficava com um <br> entre cada → cascata de linhas vazias. Conservador: só colapsa o <br>
    // que tem um chip dos DOIS lados (não encosta em <br> que separa chip de TEXTO real). Cada chip limpa as próprias bordas →
    // a run inteira colapsa conforme os chips nascem (sync no unlazy, async no onerror): a borda comum é removida pelo chip mais tardio do par.
    function dropChipBreaks(chip) {
        if (!chip || !chip.parentNode) return;
        const isChip = n => n && n.nodeType === 1 && n.classList && (n.classList.contains('smg-imglink-fallback') || n.classList.contains('smg-fhcard') || n.classList.contains('smg-dead'));   // card e caixa-404 contam como chip: run de links soltos colapsa os <br> igual
        const skipWs = (n, dir) => { while (n && n.nodeType === 3 && !n.textContent.trim()) n = n[dir]; return n; };
        ['nextSibling', 'previousSibling'].forEach(dir => {
            for (;;) {
                const br = skipWs(chip[dir], dir);
                if (!(br && br.nodeType === 1 && br.tagName === 'BR')) break;
                if (!isChip(skipWs(br[dir], dir))) break;   // só remove <br> com chip dos dois lados
                let w = chip[dir];                          // do chip até o <br>: tira whitespace + o próprio <br>
                while (w && w !== br) { const nx = w[dir]; if (w.nodeType === 3 && !w.textContent.trim()) w.remove(); w = nx; }
                br.remove();
            }
        });
    }
    // resolveProxyHref centralizado em 06-helpers.js
    // imagem que NÃO renderiza (host fora / hotlink / 404) → caixa de mídia morta NO LUGAR dela (buildDeadBox).
    // Era um chip com a URL crua em texto: num post de 40 imagens mortas virava uma parede de URLs iguais, e não
    // dava pra saber se o arquivo foi apagado ou se o host bloqueou o hotlink. A caixa mantém o lugar/proporção
    // da mídia, é clicável inteira e mostra o código HTTP de verdade quando a sonda volta.
    function imgFailLink(img) {
        if (!img || img.dataset.smgFailed || !img.parentNode) return;
        img.dataset.smgFailed = '1';
        const direct = img.currentSrc || img.getAttribute('src') || '';
        const parentA = img.closest('a[href]');
        const parentHref = parentA ? resolveProxyHref(parentA.getAttribute('href') || '') : '';
        const stored = img.dataset.smgLink ? resolveProxyHref(img.dataset.smgLink) : '';
        const isFile = u => /\.(?:jpe?g|png|gif|webp|avif|mp4|webm|mov|m4v)(?:$|\?)/i.test(u || '');
        let href = '';
        if (stored && /^https?:/i.test(stored) && !isFile(stored)) href = stored;
        else if (parentHref && /^https?:/i.test(parentHref) && !isFile(parentHref)) href = parentHref;
        else href = resolveProxyHref(stored || direct);
        if (!href || /^data:/.test(href)) { img.classList.add('smg-img-ready'); return; }
        const box = buildDeadBox(href, {
            probeUrl: /^https?:/i.test(direct) ? direct : href,
        });
        // caixa de IMAGEM morta: conta como item de mídia na run (o mosaico guarda o lugar dela) e herda a
        // proporção que a imagem já tinha, pra o grupo não pular
        box.classList.add('smg-dead--img');
        const relH = masonryImgRatio(img);
        if (relH !== MASONRY_PH_RELH) box.dataset.smgRatio = relH.toFixed(4);
        // Troca o nó que só embrulha esta imagem (o item inteiro, dentro de um grupo). <a> dentro de <a> é
        // inválido e o clique deixa de navegar.
        const flow = mediaFlowNode(img);
        const wrap = img.closest('a');
        if (flow !== img && flow.parentElement && isPostGroup(flow.parentElement)) flow.replaceWith(box);
        else if (wrap && wrap.querySelectorAll('img').length === 1) wrap.replaceWith(box);
        else img.replaceWith(box);
        if (isPostGroup(box.parentElement)) box.dataset.smgGridded = '1';
        dropChipBreaks(box);
        relayoutPostGroupOf(box);
    }
    // WATCHDOG do "loading eterno": alguns hosts aceitam a conexão e nunca respondem — a <img> não dispara load
    // NEM error, então nem o onReady nem o imgFailLink rodam e o shimmer gira pra sempre.
    // ⚠️ O relógio só começa quando a imagem CHEGA PERTO DA TELA. Um timeout global mataria toda imagem lá
    // embaixo, que sequer começou a baixar (loading=lazy) — foi exatamente o bug do timeout de 7s que já foi
    // revertido aqui uma vez ("imagem não aparece no nosso mod"). Perto da tela, 15s sem um pixel = morta.
    const IMG_DEAD_MS = 15000;   // mesmo teto que o iframe do turbo já usa
    let imgWatchIO = null;
    function armImgWatchdog(img) {
        if (!imgWatchIO) imgWatchIO = makeLazyIO(el => setTimeout(() => {
            if (!el.isConnected || el.dataset.smgFailed) return;
            if (el.complete && el.naturalWidth) return;   // pintou → nada a fazer
            imgFailLink(el);
        }, IMG_DEAD_MS), { rootMargin: '300px 0px' });
        if (imgWatchIO) imgWatchIO.observe(img);
    }
    function goonboxViewer(url) {
        if (!url || typeof url !== 'string') return null;
        let u; try { u = new URL(url, location.href); } catch (e) { return null; }
        if (!/(?:^|\.)goonbox\.[a-z]{2,}$/i.test(u.hostname)) return null;
        const m = u.pathname.match(/^\/img\/([a-zA-Z0-9]+)/i);
        if (!m) return null;
        return { host: u.hostname, id: m[1] };
    }
    const gbxCache = new Map();      // id → { original, medium, thumb, width, height } | null
    const gbxInflight = new Map();   // id → [cbs]
    const gbxTasks = makeTaskQueue(4);
    function goonboxResolve(viewerUrl, cb, anchor) {
        const info = goonboxViewer(viewerUrl);
        if (!info) { if (cb) cb(null); return; }
        const id = info.id;
        if (gbxCache.has(id)) { if (cb) cb(gbxCache.get(id)); return; }
        if (gbxInflight.has(id)) { if (cb) gbxInflight.get(id).push(cb); return; }
        if (!GMX) { if (cb) cb(null); return; }
        if (cb) gbxInflight.set(id, [cb]);
        else gbxInflight.set(id, []);
        const done = res => {
            gbxCache.set(id, res || null);
            const cbs = gbxInflight.get(id) || [];
            gbxInflight.delete(id);
            cbs.forEach(f => { try { f(res || null); } catch (e) {} });
        };
        const apiUrl = 'https://' + info.host + '/api/images/' + id;
        gbxTasks.push(() => new Promise(release => {
            GMX({
                method: 'GET',
                url: apiUrl,
                timeout: 12000,
                headers: { Accept: 'application/json, text/plain, */*' },
                onload: r => {
                    let data = null;
                    try { data = JSON.parse(r.responseText || ''); } catch (e) {}
                    const img = data && data.image;
                    if (img && (img.original_url || img.medium_url)) {
                        done({
                            original: img.original_url || img.medium_url,
                            medium: img.medium_url || img.original_url,
                            thumb: img.thumb_url || img.medium_url || img.original_url,
                            width: img.width,
                            height: img.height
                        });
                    } else {
                        done(null);
                    }
                    release();
                },
                onerror: () => { done(null); release(); },
                ontimeout: () => { done(null); release(); }
            });
        }), anchor, () => done(null));
    }
    function goonboxEmbed(linkEl, href, gbx) {
        let card; try { card = fhCard({ label: gbx.host, href: href, sub: i18n('Image'), logo: fhLogoChain({ key: 'goonbox' }, href, null) }); } catch (e) { return; }
        linkEl.replaceWith(card);
        goonboxResolve(href, res => {
            if (!res || !res.original || !card.isConnected) return;
            const full = res.original;
            const med = res.medium || full;
            const img = document.createElement('img');
            img.className = 'bbImage';
            img.loading = 'lazy';
            img.alt = '';
            img.dataset.smgLink = href;
            img.dataset.smgFull = full;
            img.dataset.smgMed = med;
            if (res.width && res.height) img.style.aspectRatio = res.width + ' / ' + res.height;
            img.addEventListener('load', () => relayoutPostGroupOf(img), { once: true });
            const link = document.createElement('a');
            link.href = full;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.appendChild(img);
            card.replaceWith(link);
            img.src = med;
        }, card);
    }
    // EXTRAÇÃO SÍNCRONA DE DIMENSÕES (Anti-CLS no loading):
    // XenForo, wrappers, links e URLs de imagens frequentemente já trazem largura/altura
    // no HTML ou nos parâmetros da URL. Extrair isso síncronamente na descoberta do post
    // permite travar o aspect-ratio exato antes de qualquer byte ser baixado da rede,
    // garantindo que os posts já nasçam na altura final e a página não fique se mexendo.
    function extractMediaDimensions(el) {
        if (!el) return null;
        const img = el.tagName === 'IMG' ? el : (el.querySelector && el.querySelector('img.bbImage'));
        if (!img) {
            if (el.classList && (el.classList.contains('generic2wide-iframe-div') || el.classList.contains('smg-dm-wrap') || el.hasAttribute('data-s9e-mediaembed') || (el.tagName === 'IFRAME' && /turbo|saint|imagepond/i.test(el.src || '')))) {
                return { w: 16, h: 9, ratio: 16 / 9, relH: 9 / 16 };
            }
            return null;
        }

        // 1. aspect-ratio inline já estabelecido
        const styleRatio = img.style && img.style.aspectRatio;
        if (styleRatio) {
            const m = styleRatio.match(/([\d.]+)\D+([\d.]+)/);
            if (m && +m[1] && +m[2] && (+m[1] !== 100 || +m[2] !== 100)) {
                const w = +m[1], h = +m[2];
                return { w, h, ratio: w / h, relH: h / w };
            }
        }

        // 2. naturalWidth já carregada no cache do navegador
        if (img.naturalWidth && img.naturalHeight) {
            const w = img.naturalWidth, h = img.naturalHeight;
            return { w, h, ratio: w / h, relH: h / w };
        }

        // 3. Atributos HTML diretos na tag <img> (width, height, data-width, data-height)
        let w = +(img.getAttribute('width') || (img.dataset && img.dataset.width) || 0);
        let h = +(img.getAttribute('height') || (img.dataset && img.dataset.height) || 0);
        if (w > 0 && h > 0) return { w, h, ratio: w / h, relH: h / w };

        // 4. Elementos pais (.bbImageWrapper, a.js-lbImage, a.link--external)
        const wrap = img.closest && img.closest('.bbImageWrapper, a.js-lbImage, a.link--external, [data-width]');
        if (wrap) {
            w = +(wrap.getAttribute('data-width') || wrap.getAttribute('width') || (wrap.dataset && wrap.dataset.width) || 0);
            h = +(wrap.getAttribute('data-height') || wrap.getAttribute('height') || (wrap.dataset && wrap.dataset.height) || 0);
            if (w > 0 && h > 0) return { w, h, ratio: w / h, relH: h / w };
            const wrapStyle = wrap.getAttribute('style') || '';
            const sm = wrapStyle.match(/aspect-ratio:\s*([\d.]+)\s*\/\s*([\d.]+)/i);
            if (sm && +sm[1] && +sm[2]) return { w: +sm[1], h: +sm[2], ratio: (+sm[1]) / (+sm[2]), relH: (+sm[2]) / (+sm[1]) };
        }

        // 5. Parâmetros e padrões de dimensão na URL (query params ?w=1920&h=1080 ou /1920x1080/)
        const url = img.currentSrc || img.getAttribute('src') || img.src || img.getAttribute('data-url') || img.getAttribute('data-src') || (img.dataset && img.dataset.smgLink) || '';
        if (url) {
            const qm = url.match(/[?&](?:w|width)=(\d{2,5})&[^#]*?(?:h|height)=(\d{2,5})/i) || url.match(/[?&](?:h|height)=(\d{2,5})&[^#]*?(?:w|width)=(\d{2,5})/i);
            if (qm) {
                const isWFirst = /[?&](?:w|width)=/i.test(qm[0]);
                const qw = isWFirst ? +qm[1] : +qm[2];
                const qh = isWFirst ? +qm[2] : +qm[1];
                if (qw > 50 && qh > 50) return { w: qw, h: qh, ratio: qw / qh, relH: qh / qw };
            }
            const fm = url.match(/[-_/](\d{3,4})x(\d{3,4})[.-]/i);
            if (fm && +fm[1] > 50 && +fm[2] > 50) {
                return { w: +fm[1], h: +fm[2], ratio: (+fm[1]) / (+fm[2]), relH: (+fm[2]) / (+fm[1]) };
            }
        }

        return null;
    }

    function resolveFullImageUrl(img) {
        if (!img) return '';
        if (img.dataset && img.dataset.smgFull) return absUrl(img.dataset.smgFull);

        const rawSrc = img.currentSrc || img.getAttribute('src') || img.src || '';
        let src = rawSrc;
        if (!/^https?:/i.test(src) && !/^\//.test(src)) {
            src = img.getAttribute('data-url') || img.getAttribute('data-src') || img.getAttribute('data-original') || src;
        }

        // 1. Hosts e padrões reconhecidos pelo getBigUrl (.md., .th., imgbox _t->_o, pixhost thumbs->images)
        const big = getBigUrl(src);
        if (big && absUrl(big) !== absUrl(src)) return absUrl(big);

        // 2. Parâmetros de query de thumbnail (ex.: ?thumb=1, ?thumbnail=1)
        if (/[?&](?:thumb|thumbnail)=\d+/i.test(src)) {
            const cleaned = src.replace(/([?&])(?:thumb|thumbnail)=\d+(&|$)/i, (m, p1, p2) => (p2 === '&' ? p1 : '')).replace(/[?&]$/, '');
            if (cleaned && absUrl(cleaned) !== absUrl(src)) return absUrl(cleaned);
        }

        // 3. Link pai <a> (XenForo attachments ou link direto para arquivo de imagem)
        const parentLink = img.closest && img.closest('a');
        if (parentLink) {
            const rawHref = parentLink.getAttribute('href') || parentLink.href || '';
            const lh = resolveProxyHref(rawHref);
            if (lh && lh !== '#' && !/^javascript:/i.test(lh)) {
                if (/\.(?:jpe?g|png|gif|webp|avif|bmp)(?:[?#]|$)/i.test(lh)) {
                    const bigLh = getBigUrl(lh);
                    if (absUrl(bigLh) !== absUrl(src)) return absUrl(bigLh);
                }
                if (/\/attachments\/[^\s"'>]+/i.test(lh)) {
                    if (absUrl(lh) !== absUrl(src)) return absUrl(lh);
                }
            }
        }

        // 4. Elemento wrapper (.bbImageWrapper, [data-src], [data-url])
        const wrap = img.closest && img.closest('.bbImageWrapper, [data-src], [data-url]');
        if (wrap && wrap !== img) {
            const wrapSrc = wrap.getAttribute('data-src') || wrap.getAttribute('data-url') || (wrap.dataset && (wrap.dataset.src || wrap.dataset.url)) || '';
            const resolvedWrap = resolveProxyHref(wrapSrc);
            if (resolvedWrap && absUrl(resolvedWrap) !== absUrl(src)) {
                if (/\.(?:jpe?g|png|gif|webp|avif|bmp)(?:[?#]|$)/i.test(resolvedWrap) || /\/attachments\/[^\s"'>]+/i.test(resolvedWrap)) {
                    return absUrl(getBigUrl(resolvedWrap));
                }
            }
        }

        // 5. Atributo data-url / data-src na própria tag <img>
        const imgDataUrl = img.getAttribute('data-url') || img.getAttribute('data-src');
        if (imgDataUrl && absUrl(imgDataUrl) !== absUrl(src)) {
            const resolvedData = resolveProxyHref(imgDataUrl);
            if (resolvedData && absUrl(resolvedData) !== absUrl(src)) {
                return absUrl(getBigUrl(resolvedData));
            }
        }

        // 6. Goonbox resolvido em cache
        const smgLink = (img.dataset && img.dataset.smgLink) || '';
        const gbx = goonboxViewer(smgLink);
        if (gbx && gbxCache.has(gbx.id)) {
            const cached = gbxCache.get(gbx.id);
            if (cached && cached.original && absUrl(cached.original) !== absUrl(src)) return absUrl(cached.original);
        }

        return '';
    }

    function applyReplaceThumbsWithFull(enabled, roots) {
        if (!enabled) return;
        const selector = 'img.bbImage';
        const imgs = [];
        if (roots && Array.isArray(roots)) {
            roots.forEach(r => {
                if (!r || !r.querySelectorAll) return;
                if (r.matches && r.matches(selector)) imgs.push(r);
                r.querySelectorAll(selector).forEach(im => imgs.push(im));
            });
        } else {
            document.querySelectorAll(selector).forEach(im => imgs.push(im));
        }
        imgs.forEach(img => {
            let full = img.dataset.smgFull;
            if (!full) {
                full = resolveFullImageUrl(img);
                if (full) img.dataset.smgFull = full;
            }
            if (full) {
                const targetAbs = absUrl(full);
                const currentAbs = absUrl(img.currentSrc || img.src || img.getAttribute('src') || '');
                if (targetAbs && targetAbs !== currentAbs) {
                    if (!img.style.aspectRatio && img.naturalWidth && img.naturalHeight) {
                        img.style.aspectRatio = img.naturalWidth + ' / ' + img.naturalHeight;
                    }
                    swapImgSrc(img, targetAbs);
                }
            }
        });
    }

    function processOneImage(img) {
        // guarda o link do host (jpg6.su/jpg5/…) ENQUANTO a img ainda está no <a> — ANTES do lazy-swap e da masonry mover (depois closest('a') falha) → fallback de link
        if (!img.dataset.smgLink) {
            const la = img.closest('a.link--external[href]');
            if (la) img.dataset.smgLink = resolveProxyHref(la.getAttribute('href') || la.href || '');
        }
        const gbx = goonboxViewer(img.dataset.smgLink);
        if (gbx) {
            goonboxResolve(img.dataset.smgLink, res => {
                if (!res || !res.original || !img.isConnected) return;
                img.dataset.smgFull = res.original;
                img.dataset.smgMed = res.medium || res.original;
                const link = img.closest('a') || (img.parentElement && img.parentElement.tagName === 'A' ? img.parentElement : null);
                if (link) link.href = res.original;
                if (img.dataset.url) img.dataset.url = res.original;
                if (res.width && res.height && !img.style.aspectRatio) {
                    img.style.aspectRatio = res.width + ' / ' + res.height;
                }
                // Se o feed lightbox estiver aberto com este slide, atualiza o slide para alta resolução
                const feed = document.getElementById('smg-feed');
                if (feed && mediaView() === 'feed') {
                    feed.querySelectorAll('img.smg-feed-media').forEach(fi => {
                        if (fi.dataset.src === res.medium || fi.src === res.medium) {
                            fi.dataset.src = res.original;
                            fi.src = res.original;
                        }
                    });
                }
                if (FEATURES.replaceThumbsWithFull && res.original !== img.src) {
                    swapImgSrc(img, res.original);
                }
            }, img);
        }
        let src = img.currentSrc || img.getAttribute('src') || img.src || '';
        if (!/^https?:/i.test(src) && !/^\//.test(src)) {                // placeholder lazy ainda sem URL real
            const realSrc = img.getAttribute('data-url') || img.getAttribute('data-src') || img.getAttribute('data-original');
            if (realSrc && (/^https?:/i.test(realSrc) || /^\//.test(realSrc))) {
                src = realSrc;
                img.src = realSrc;
            } else {
                if (!img.dataset.smgLazyWait) {
                    img.dataset.smgLazyWait = '1';
                    const reproc = () => { if (!img.dataset.smgLazyWait) return; delete img.dataset.smgLazyWait; processOneImage(img); };
                    img.addEventListener('load', reproc, { once: true });
                    img.addEventListener('error', reproc, { once: true });
                }
                return;
            }
        }
        delete img.dataset.smgLazyWait;
        img.dataset.fullProcessed = 'true';          // EXAMINADA → fora das próximas varreduras
        img.decoding = 'async';                      // decode fora da thread principal (menos jank)
        // âncora que embrulha a imagem: marca p/ o CSS encolhê-la até a imagem. A <img> é display:block,
        // então um <a> inline gera caixas de bloco na LARGURA INTEIRA do post — clicar na faixa vazia
        // ao lado (ou acima/abaixo) da imagem abria o link sem querer.
        if (img.parentElement && img.parentElement.tagName === 'A') img.parentElement.classList.add('smg-imglink');
        img.classList.remove('lazyload', 'lazyloading');   // o FÓRUM faz .lazyload/.lazyloading{opacity:0} até revelar; a img já tem src http → tira senão fica invisível esperando o reveal
        // NADA de timeout-de-link: a img carrega nativa igual ao site padrão (que carrega de boa). Link de fallback SÓ em erro real (onerror) ou complete sem dimensão (404/hotlink) — abaixo. O timeout de 7s trocava imagem offscreen (naturalWidth 0 pq ainda não rolou até ela) por chip de link → "imagem não aparece" no nosso mod.

        const dim = extractMediaDimensions(img);
        if (dim && !img.style.aspectRatio) {
            img.style.aspectRatio = dim.w + ' / ' + dim.h;
            markWide(img, dim.w, dim.h);
            img.classList.add('smg-img-ready');
        }

        // Determina antecipadamente a URL full e média antes do onReady
        const full = resolveFullImageUrl(img);
        if (full) {
            const convMd = src.includes('.md.'), convTh = src.includes('.th.');
            const med = convMd ? src : (convTh ? src.replace('.th.', '.md.') : full);   // tier MÉDIO só p/ convenção .md/.th; resto exibe o FULL direto
            img.dataset.smgFull = full;
            img.dataset.smgMed = med;
            img.removeAttribute('srcset');
            const link = img.closest('a');
            if (link) link.href = full;              // maximizar (feed/lightbox) abre o FULL (alta)
            if (img.title) img.title = cleanText(img.title);
            if (img.alt) img.alt = cleanText(img.alt);
            if (med !== src) {                       // src é .th. → sobe pra .md. perto da viewport; .md. já exibido FICA
                const mio = getMedIO();
                if (mio) mio.observe(img); else img.src = (FEATURES.replaceThumbsWithFull ? (full || med) : med);     // sem IO → troca direto (fallback)
            }
        }

        // ao ganhar dimensão (thumb ou full), trava a proporção e tira o shimmer → caixa estável
        const onReady = () => {
            if (img.complete && !img.naturalWidth) { imgFailLink(img); return; }   // completou QUEBRADA (404/hotlink/host fora) → mostra o link no lugar
            if (img.naturalWidth && img.naturalHeight) {
                const currentRatio = img.style.aspectRatio;
                if (!currentRatio || currentRatio === '100 / 100' || (currentRatio === '1 / 1' && img.naturalWidth !== img.naturalHeight)) {
                    img.style.aspectRatio = img.naturalWidth + ' / ' + img.naturalHeight;
                }
            }
            // solta: o tamanho natural só limita a caixa quando este já é o arquivo FINAL (a thumb é menor que ele)
            const finalSrc = !img.dataset.smgFull || absUrl(img.dataset.smgFull) === absUrl(img.currentSrc || img.src || '');
            markWide(img, img.naturalWidth, img.naturalHeight, finalSrc ? img.naturalWidth : 0);
            const grid = img.closest('.auto-image-grid');
            if (grid) masonrySchedule(grid);
            img.classList.add('smg-img-ready');

            const fullTarget = img.dataset.smgFull;
            if (fullTarget) {
                const targetAbs = absUrl(fullTarget);
                const currentAbs = absUrl(img.currentSrc || img.src || img.getAttribute('src') || '');
                if (targetAbs && targetAbs !== currentAbs) {
                    if (FEATURES.replaceThumbsWithFull) {
                        swapImgSrc(img, targetAbs);
                    } else if (!grid || img.classList.contains('smg-wide')) {
                        const fio = getFullIO();
                        if (fio) fio.observe(img);
                    }
                }
            }
        };
        if (img.complete) onReady();                 // já resolvida (ok ou quebrada) → sem shimmer preso
        else {
            img.addEventListener('load', onReady, { once: true });
            img.addEventListener('error', () => imgFailLink(img), { once: true });   // não renderizou → caixa de mídia morta
            armImgWatchdog(img);   // nem load nem error (host pendurado) → a caixa entra por tempo, não por evento
        }

        const tio = getThumbIO(); if (tio) tio.observe(img);   // thumb carrega bem cedo → tamanho fixo antes de aparecer
        if (img.dataset.smgFull) {
            const targetAbs = absUrl(img.dataset.smgFull);
            const currentAbs = absUrl(img.currentSrc || img.src || img.getAttribute('src') || '');
            if (targetAbs && targetAbs !== currentAbs) {
                if (FEATURES.replaceThumbsWithFull || !img.closest('.auto-image-grid')) {
                    const fio = getFullIO();
                    if (fio) fio.observe(img);
                }
            }
        }
    }
    function processImages(roots) {
        // o seletor exclui examinadas (data-full-processed) E placeholders sem src (data-smg-lazy-wait,
        // que voltam via seu próprio load). Scope: no boot roots=[body] (full), numa mutação só os subtrees novos.
        eachIn(roots, 'img.bbImage:not([data-full-processed]):not([data-smg-lazy-wait])', processOneImage);
    }

    // hosts de imagem estilo chevereto (jpg6.su / jpg5.su / jpg.church & afins): a página /img/{slug} "cozinha" a URL real
    // (data-src = base64 de hex, XOR com uma CHAVE ESTÁTICA branded — anti-scraper). Recuperei a chave por criptanálise
    // (2 amostras, crib "https://" + prefixo comum) → decode puro, sem depender de estado do browser. A imagem é do mesmo
    // CDN cuckcapital que os jpg6 EMBEDADOS já carregam, então um <img> normal exibe inline (sem 403 de hotlink).
    function cheveretoViewer(url) {
        let u; try { u = new URL(url); } catch (e) { return null; }
        if (!/^(?:jpg\d*\.\w{2,}|host\.church)$/i.test(u.hostname)) return null;   // jpg6.su / jpg.church / jpg5.fish / host.church …
        if (!/\/(?:img|image|i|a|album)\//i.test(u.pathname)) return null;          // só páginas de viewer/galeria (não imagem direta)
        return { host: u.hostname, gallery: /\/(?:a|album)\//i.test(u.pathname) };
    }
    const CHV_KEY = 'seltilovessimpcity@simpcityhatesscrapers';   // chave XOR estática (período 40) do "cooked" do chevereto
    function cheveretoDecode(b64) {
        let hex; try { hex = atob(b64); } catch (e) { return ''; }
        if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2) return '';
        let out = '';
        for (let i = 0; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.substr(i, 2), 16) ^ CHV_KEY.charCodeAt((i / 2) % CHV_KEY.length));
        return /^https?:\/\/\S+\.(?:jpe?g|png|webp|gif|avif)/i.test(out) ? out : '';
    }
    const chvCache = new Map();      // viewerUrl → directUrl|null (1× por sessão)
    const chvInflight = new Map();   // dedup de fetches simultâneos do mesmo viewer
    // throttle (galeria de N links pelados não estoura a rede). Era FIFO puro: como o unlazyImageLinks varre o
    // documento inteiro no boot, os links jpg6/jpg5 entravam em ordem de DOM e viravam imagem de cima pra baixo,
    // 4 por vez — mesmo com o usuário lendo o fim da thread. A makeTaskQueue reordena por distância da viewport
    // a cada slot livre, então resolve primeiro o que está sendo lido. Âncora = o card que vai virar a imagem.
    const chvTasks = makeTaskQueue(4);
    // busca a página de viewer (GMX, fura CORS), extrai o data-src cooked e decodifica → URL direta da imagem. cb(url|null).
    function cheveretoResolve(viewerUrl, cb, anchor) {
        if (chvCache.has(viewerUrl)) { cb(chvCache.get(viewerUrl)); return; }
        if (chvInflight.has(viewerUrl)) { chvInflight.get(viewerUrl).push(cb); return; }
        if (!GMX) { cb(null); return; }
        chvInflight.set(viewerUrl, [cb]);
        const done = url => { chvCache.set(viewerUrl, url || null); const cbs = chvInflight.get(viewerUrl) || []; chvInflight.delete(viewerUrl); cbs.forEach(f => { try { f(url || null); } catch (e) {} }); };
        chvTasks.push(() => new Promise(release => {
            GMX({ method: 'GET', url: viewerUrl, timeout: 12000, headers: { Referer: location.origin + '/', Accept: 'text/html,*/*' },
                onload: r => { const t = r.responseText || ''; const m = t.match(/<img[^>]*\bcooked="true"[^>]*\bdata-src="([A-Za-z0-9+/=]+)"/i) || t.match(/\bdata-src="([A-Za-z0-9+/=]{40,})"/i); done(m ? cheveretoDecode(m[1]) : ''); release(); },
                onerror: () => { done(''); release(); }, ontimeout: () => { done(''); release(); } });
        }), anchor, () => done(''));   // card removido antes da vez → resolve o in-flight (senão o mesmo link nunca mais resolve nesta sessão)
    }
    // link pelado de viewer → card (estado de loading) → resolve a imagem → troca por <img bbImage> (masonry/lightbox pegam).
    // Falha (rede/decode/host fora) → o card fica. Galeria (/a/): só card (resolver N imagens é outra fase).
    function cheveretoEmbed(linkEl, href, chv) {
        // fhCard recebe um OBJETO {label,href,sub,logo} — a chamada posicional antiga deixava o.label=undefined ("?")
        // e o.sub caía no String.prototype.sub ("function sub() { [native code] }").
        let card; try { card = fhCard({ label: chv.host, href: href, sub: i18n(chv.gallery ? 'Gallery' : 'Image'), logo: fhLogoChain({ key: 'chevereto' }, href, null) }); } catch (e) { return; }
        linkEl.replaceWith(card);
        if (chv.gallery) { cheveretoGallery(card, href, chv.host); return; }   // galeria → embeda TODAS as imagens (1 fetch por página)
        cheveretoResolve(href, url => {
            if (!url || !card.isConnected) return;   // falhou → fica o card
            const full = getBigUrl(url);   // a viewer do chevereto serve a versão .md (MÉDIA) → sobe pro ORIGINAL (resolução cheia)
            const img = document.createElement('img'); img.className = 'bbImage'; img.loading = 'lazy'; img.alt = ''; img.dataset.smgLink = href; img.dataset.smgFull = full;
            img.addEventListener('load', () => relayoutPostGroupOf(img), { once: true });   // tem dimensões → o grupo reflui
            const link = document.createElement('a'); link.href = full; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.appendChild(img);
            card.replaceWith(link);
            img.src = full;
        }, card);   // card = âncora de prioridade: resolve primeiro os links que estão perto do que o usuário lê
    }
    // GALERIA chevereto (/a/ /album/): embeda TODAS as imagens. 1 fetch por PÁGINA (não por imagem) — extrai os thumbs
    // da listagem e sobe pro ORIGINAL com getBigUrl (os thumbs seguem a convenção .md). Teto de páginas + nº de imagens
    // p/ não martelar o host (≠ gofile: aqui é 1 request por página, throttle de 4, e sem token/anti-bot).
    const CHV_GAL_MAX_PAGES = 12, CHV_GAL_MAX_IMGS = 600;
    function chvImgUrlsFrom(doc, host) {
        const out = [];
        // itens da listagem chevereto: <a href=".../img/{slug}"><img src="...md.jpg" data-src="..."></a>
        doc.querySelectorAll('.list-item-image img, .image-container img, a[href*="/img/"] img, [class*="list-item"] img').forEach(im => {
            let s = im.getAttribute('data-src') || im.getAttribute('src') || '';
            if (!s) return;
            if (/^[A-Za-z0-9+/=]{40,}$/.test(s) && s.indexOf('/') === -1) s = cheveretoDecode(s);   // thumb "cooked" (base64) → decodifica
            try { s = new URL(s, 'https://' + host).href; } catch (e) { return; }
            if (!/\.(jpe?g|png|gif|webp|avif)(\?|#|$)/i.test(s)) return;
            if (/avatar|\/logo|favicon|placeholder|\/cover|loading/i.test(s)) return;   // descarta UI
            out.push(getBigUrl(s));   // .md/.th → ORIGINAL
        });
        return out;
    }
    function chvNextPageHref(doc, curUrl) {
        const a = doc.querySelector('[data-pagination="next"], a[rel="next"], .pagination-next a, li.pagination-next a, a[href*="?page="][rel~="next"]');
        let h = a && a.getAttribute('href'); if (!h) return '';
        try { return new URL(h, curUrl).href; } catch (e) { return ''; }
    }
    function cheveretoGallery(card, href, host) {
        if (!GMX) return;   // sem GMX → fica o card
        const all = [], seen = new Set(); let pages = 0, finished = false;
        const finish = () => {
            if (finished) return; finished = true;
            if (!card.isConnected || !all.length) return;   // nada extraído → fica o card
            const frag = document.createDocumentFragment();
            all.forEach(u => {
                const a = document.createElement('a'); a.href = u; a.target = '_blank'; a.rel = 'noopener noreferrer';
                const img = document.createElement('img'); img.className = 'bbImage'; img.loading = 'lazy'; img.alt = ''; img.dataset.smgLink = href; img.dataset.smgFull = u;
                img.addEventListener('load', () => relayoutPostGroupOf(img), { once: true });
                a.appendChild(img); img.src = u; frag.appendChild(a);
            });
            const host = card.parentElement;
            card.replaceWith(frag);
            scheduleRun(host);
        };
        const fetchPage = url => {
            chvTasks.push(() => new Promise(release => {
                GMX({ method: 'GET', url: url, timeout: 15000, headers: { Referer: location.origin + '/', Accept: 'text/html,*/*' },
                    onload: r => {
                        let doc; try { doc = new DOMParser().parseFromString(r.responseText || '', 'text/html'); } catch (e) { release(); finish(); return; }
                        chvImgUrlsFrom(doc, host).forEach(u => { if (!seen.has(u) && all.length < CHV_GAL_MAX_IMGS) { seen.add(u); all.push(u); } });
                        pages++;
                        const next = chvNextPageHref(doc, url);
                        release();
                        if (next && pages < CHV_GAL_MAX_PAGES && all.length < CHV_GAL_MAX_IMGS) fetchPage(next);
                        else finish();
                    },
                    onerror: () => { release(); finish(); }, ontimeout: () => { release(); finish(); } });
            }), card);
        };
        fetchPage(href);
    }
    // LINKS de imagem (jpg6.su / jpg5 / jpg.church & afins): a img mora SÓ no <noscript> (inerte com JS) → o <a> fica
    // vazio e a limpeza de "espaço fantasma" o removia (sumia tudo). Materializa a img do noscript pro <a> (vira bbImage →
    // a masonry grida). Se a img falhar (host caiu/hotlink) OU não houver URL → mostra o LINK clicável no lugar.
    function unlazyImageLinks(roots) {
        eachIn(roots, 'a.link--external[href]:not([data-smg-imglink])', a => {
            a.dataset.smgImglink = '1';
            if (a.closest('.generic2wide-iframe-div, .smg-rg, .bbCodeBlock--unfurl, .smg-fhcard, .smg-tw-card, .smg-post-links, .bbCodeBlock, .bbCodeQuote, .message-signature')) return;   // virou player, card ou bloco protegido → não mexe
            // pula SÓ se já existe uma img REAL (fora de <noscript>). ⚠️ o querySelector('img') cru casava com a img INERTE
            // do <noscript> (no XF via AJAX o noscript vira DOM) e abortava → o <a> ficava vazio e a masonry o removia.
            if ([].some.call(a.querySelectorAll('img'), im => !im.closest('noscript'))) return;
            const href = resolveProxyHref(a.getAttribute('href') || '');   // chip/fallback mostra a URL final, não o /goto/ redirect
            // mostra o LINK como texto clicável DENTRO do próprio <a href> (usado quando não há img OU a img falha) → nunca fica vazio
            // TÍTULO PRÓPRIO do link ("ASMR - Ear Licking"), lido ANTES de mexermos no <a>: trocá-lo pela URL
            // apagava a única descrição do item — uma lista de 80 links virava 80 URLs iguais na tela.
            // Só cai pra URL quando o <a> não tinha texto (era só a imagem) ou o texto já era a própria URL.
            const own = (a.textContent || '').replace(/\s+/g, ' ').trim();
            const label = (own && !/^https?:\/\//i.test(own)) ? own : (href || a.href);
            // o texto vai num <span> (não solto no <a>): é ele que ganha o corte com reticências — URL
            // gigante virava um bloco de 3 linhas quebrado no meio da palavra.
            const chipText = () => { const t = document.createElement('span'); t.className = 'smg-linktext'; t.textContent = label; return t; };
            // MESMO CARD dos file-hosts pro link SOLTO (URL colada no post): ícone do site + host + caminho
            // + copiar/abrir, na variante compacta. Só quando o texto do <a> É a própria URL — link com
            // texto próprio no meio de uma frase continua chip inline, senão a frase quebraria em duas.
            const asCard = () => {
                if (fhProvider(href)) return false;   // file-host → aquele pass monta (com thumbs/contagem)
                if (!/^https?:\/\//i.test(label)) return false;
                let u; try { u = new URL(href, location.href); } catch (e) { return false; }
                const host = u.hostname.replace(/^www\./, '');
                if (!host || u.hostname === location.hostname) return false;   // link interno do fórum fica texto
                const path = (u.pathname + u.search).replace(/\/$/, '');
                const prov = { key: 'host:' + host };
                const card = fhCard({ key: prov.key, label: host, href: href, sub: path && path !== '/' ? decodeURIComponent(path) : i18n('Link'), logo: fhLogoChain(prov, href, null) });
                card.classList.add('smg-fhcard--inline');
                pdPlace(a, card);
                dropChipBreaks(card);   // sem isso o <br> entre um link e outro deixava uma linha vazia entre os cards
                return true;
            };
            const showLink = () => {
                if (!a.isConnected) return;
                if (asCard()) return;
                a.innerHTML = ''; a.classList.add('smg-imglink-fallback'); a.appendChild(chipText());
                fhLinkFavicon(a, href);   // ícone do site no lugar do 🔗 genérico
                dropChipBreaks(a);
            };
            const linkChip = () => {
                const lk = document.createElement('a');
                lk.href = href; lk.target = '_blank'; lk.rel = 'noopener noreferrer';
                lk.className = 'link link--external smg-imglink-fallback'; lk.appendChild(chipText());
                fhLinkFavicon(lk, href);
                return lk;
            };
            // URL da img: do <noscript> — seja ele DOM (querySelector) ou texto cru (regex)
            const ns = a.querySelector('noscript');
            let url = '';
            if (ns) {
                const ni = ns.querySelector && ns.querySelector('img');
                if (ni) url = ni.getAttribute('data-url') || ni.getAttribute('data-src') || ni.getAttribute('src') || '';
                if (!url || /^data:/.test(url)) (ns.textContent || '').replace(/(?:data-url|data-src|src)\s*=\s*["']([^"']+)["']/gi, (m, u) => { if ((!url || /^data:/.test(url)) && !/^data:/.test(u)) url = u; return m; });
            }
            if (!url || /^data:/.test(url)) {   // sem URL extraível
                const chv = cheveretoViewer(href);   // jpg6.su & afins → resolve a imagem REAL (decode do cooked) e exibe inline; fallback = card
                if (chv) { cheveretoEmbed(a, href, chv); return; }
                const gbx = goonboxViewer(href);
                if (gbx) { goonboxEmbed(a, href, gbx); return; }
                showLink(); return;   // resto → link em texto
            }
            const img = document.createElement('img');
            img.className = 'bbImage'; img.src = url; img.loading = 'eager'; img.alt = '';   // EAGER: força resolver (lazy + sem aspect-ratio = célula vazia, e o onerror nunca dispara)
            img.dataset.smgLink = href;
            img.addEventListener('error', () => {
                if (a.closest('.auto-image-grid')) imgFailLink(img);      // dentro de um mosaico → caixa morta (guarda o lugar)
                else if (a.isConnected) showLink();                     // img ainda no <a> → vira texto-link
            }, { once: true });
            a.innerHTML = '';   // limpa o noscript + whitespace
            a.appendChild(img);
        });
    }

    // MOSAICO NO POST (html.smg-masonry-on). O corpo do post é uma sequência de blocos, lida em ordem:
    //   · RUN de mídia = imagens e vídeos consecutivos (img.bbImage, o <a>/.bbImageWrapper que só embrulha uma,
    //     a caixa de imagem morta, a caixa de um player de vídeo). <br>, espaço em branco e nós invisíveis entre
    //     dois itens NÃO quebram a run.
    //   · qualquer outra coisa (texto, citação, spoiler, card de file-host, card de link) é um bloco de LARGURA
    //     TOTAL e fica exatamente onde o autor pôs.
    // Run de 2+ → um .auto-image-grid (motor masonry, 08a); vídeo deitado ocupa 2 colunas, em pé/quadrado 1.
    // Run de 1 → mídia solta (imagem: markWide, largura do conteúdo, altura limitada; vídeo: o player como já é).
    // Incremental: mídia que nasce depois (chevereto/goonbox/imagepond) ao lado de um grupo entra nele.
    const MEDIA_ITEM_SEL = 'img.bbImage, .smg-dead--img';
    // caixa de player de vídeo que o script monta ou reestiliza: direto (.smg-dm-wrap), redgifs/turbo/saint/
    // imagepond/cyberdrop (.generic2wide-iframe-div), embed s9e de vídeo, ou o nosso player solto (.smg-rg)
    const VIDEO_BOX_SEL = '.generic2wide-iframe-div, .smg-dm-wrap, span[data-s9e-mediaembed], .smg-rg';
    const VIDEO_S9E_RE = /^(redgifs|gifs|youtube|vimeo|streamable|dailymotion|tiktok|twitch)$/i;
    const VIDEO_SKIP_SEL = '.bbCodeQuote, .bbCodeBlock--quote, .message-signature, .smg-post-links, .smg-fhcard, .smg-tw-card, .bbCodeBlock--unfurl';
    const MEDIA_SKIP_SEL = '.bbCodeQuote, .bbCodeBlock--quote, .message-signature, .smg-post-links, .smg-fhcard, .smg-tw-card, .generic2wide-iframe-div, .smg-rg, span[data-s9e-mediaembed], .bbCodeBlock--unfurl';
    // filho "vazio" de um wrapper de imagem: espaço, comentário, <noscript>/<br> → não conta como conteúdo
    function isInertNode(n) {
        if (!n) return true;
        if (n.nodeType === 3) return !n.textContent.trim();
        if (n.nodeType !== 1) return true;
        return /^(BR|NOSCRIPT|SCRIPT|STYLE|META|LINK|TEMPLATE)$/i.test(n.tagName);
    }
    // separador que NÃO quebra uma run (pula entre duas imagens): o inerte acima + nó escondido inline
    // (o link cru que a mídia direta substituiu fica display:none no lugar)
    function isRunSeparator(n) {
        if (isInertNode(n)) return true;
        return !!(n.style && n.style.display === 'none');
    }
    // o nó que senta no fluxo do texto por esta imagem: sobe pelos wrappers que só a embrulham
    function mediaFlowNode(el) {
        let flow = el;
        for (;;) {
            const p = flow.parentElement;
            if (!p || !p.matches('a, .bbImageWrapper, .smg-dm-wrap')) return flow;
            const others = Array.prototype.some.call(p.childNodes, n => n !== flow && !isInertNode(n));
            if (others) return flow;
            flow = p;
        }
    }
    // MÍDIA SOLTA (run de 1, fora de grupo): imagem na largura do conteúdo, altura até --smg-solo-h (~80vh),
    // centrada, e nunca maior que o próprio arquivo quando o tamanho natural do arquivo FINAL é conhecido (natW).
    // STABLE BOX: a largura é uma expressão (proporção × teto), não `auto` — com `auto` a caixa seguia os pixels
    // do arquivo e a troca thumb→original (mesma proporção, mais pixels) empurrava a página.
    // Vídeo direto (.smg-dm-wrap) mantém a regra antiga: só o vertical ganha teto.
    const WIDE_RELH = 0.9;   // h/w < 0.9 = horizontal (16:9, 21:9, 16:10, 4:3)
    function setSoloSize(el, w, h, vertical, natW) {
        if (!el || !el.style || !w || !h) return;
        const grid = el.closest && el.closest('.auto-image-grid');
        if (grid) {   // no grupo o motor manda no tamanho (o item em si guarda o width do motor: não mexe)
            if (el.parentElement !== grid) { el.style.removeProperty('max-width'); el.style.removeProperty('width'); }
            return;
        }
        const ratio = (w / h).toFixed(4);
        let size;
        if (el.tagName === 'IMG') size = 'min(100%, calc(var(--smg-solo-h, 80vh) * ' + ratio + ')' + (natW > 0 ? ', ' + Math.round(natW) + 'px' : '') + ')';
        else if (vertical) size = 'min(75%, 880px, calc(var(--smg-media-h, min(70vh, 750px)) * ' + ratio + '))';
        else { el.style.removeProperty('max-width'); el.style.removeProperty('width'); return; }
        el.style.setProperty('max-width', size, 'important');
        el.style.setProperty('width', size, 'important');
    }
    function markWide(el, w, h, natW) {
        if (!el || !w || !h) return;
        const wide = (h / w) < WIDE_RELH;
        el.classList.toggle('smg-wide', wide);
        el.classList.toggle('smg-vert', !wide);
        setSoloSize(el, w, h, !wide, natW);
        const wrap = el.closest && el.closest('.smg-dm-wrap');
        if (wrap) {
            wrap.classList.toggle('smg-wide', wide);
            wrap.classList.toggle('smg-vert', !wide);
            setSoloSize(wrap, w, h, !wide);
        }
        const link = el.closest && (el.closest('a.smg-imglink') || (el.parentElement && el.parentElement.tagName === 'A' ? el.parentElement : null));
        if (link) {
            link.classList.toggle('smg-wide-link', wide);
            link.classList.toggle('smg-vert-link', !wide);
        }
        const bbWrap = el.closest && el.closest('.bbImageWrapper');
        if (bbWrap) {
            bbWrap.classList.toggle('smg-wide-link', wide);
            bbWrap.classList.toggle('smg-vert-link', !wide);
        }
    }
    function isPostGroup(n) {
        return !!(n && n.nodeType === 1 && n.classList.contains('auto-image-grid'));
    }
    // esta caixa é um player de VÍDEO? (.smg-dm-wrap de imagem e embed s9e que não é vídeo ficam de fora)
    function isVideoBox(el) {
        if (!el || el.nodeType !== 1) return false;
        if (el.classList.contains('smg-rg')) return true;
        if (el.classList.contains('smg-dm-wrap')) return !!el.querySelector('.smg-rg, video');
        if (el.hasAttribute('data-s9e-mediaembed')) return VIDEO_S9E_RE.test(el.getAttribute('data-s9e-mediaembed') || '') || !!el.querySelector('.smg-rg');
        if (el.classList.contains('generic2wide-iframe-div')) return !!el.querySelector('.smg-rg, .smg-turbo-slot, video, iframe') || /redgifs/i.test(el.getAttribute('onclick') || '');
        return false;
    }
    // o nó que senta no fluxo por este player: a caixa de vídeo MAIS EXTERNA (o .smg-rg dentro do slot dentro
    // do .generic2wide é um item só), depois os wrappers que só a embrulham
    function videoFlowNode(el) {
        let box = el;
        for (let up = box.parentElement && box.parentElement.closest(VIDEO_BOX_SEL); up; up = up.parentElement && up.parentElement.closest(VIDEO_BOX_SEL)) {
            if (isPostGroup(up)) break;
            box = up;
        }
        return mediaFlowNode(box);
    }
    // h/w de "a / b" (style.aspectRatio)
    function relHOfAspect(s) {
        const m = (s || '').match(/([\d.]+)\D+([\d.]+)/);
        return (m && +m[1] && +m[2]) ? (+m[2]) / (+m[1]) : 0;
    }
    // altura/largura de um vídeo: o que o player já sabe (rgAspect: API do redgifs, metadata, poster), o
    // <video> com metadata, o tamanho que o embed declara (data-width/height, width/height do iframe, o
    // padding-bottom do s9e); senão 16:9. O motor re-coloca quando o player descobre (rgAspect → relayout).
    function videoBoxRatio(box) {
        const rg = box.classList.contains('smg-rg') ? box : box.querySelector('.smg-rg');
        const fromPlayer = rg ? relHOfAspect(rg.style.aspectRatio) : 0;
        if (fromPlayer) return fromPlayer;
        const v = box.querySelector('video');
        if (v && v.videoWidth && v.videoHeight) return v.videoHeight / v.videoWidth;
        const plausible = r => r > 1 / 2.8 && r < 1 / 0.3;
        const ifr = box.querySelector('iframe');
        for (const el of [box, ifr]) {
            if (!el) continue;
            const w = +(el.getAttribute('data-width') || el.getAttribute('width') || 0);
            const h = +(el.getAttribute('data-height') || el.getAttribute('height') || 0);
            if (w > 0 && h > 0 && plausible(h / w)) return h / w;
        }
        const pad = box.querySelector('span[style*="padding-bottom"]');
        const pm = pad && (pad.getAttribute('style') || '').match(/padding-bottom:\s*([\d.]+)%/i);
        if (pm && plausible(+pm[1] / 100)) return +pm[1] / 100;
        return 9 / 16;
    }
    // altura/largura de um item do grupo: o vídeo, a imagem dele, ou a proporção guardada na caixa morta
    function postItemRatio(item) {
        if (item.classList.contains('smg-mvid')) return videoBoxRatio(item);
        if (item.classList.contains('smg-dead')) return +item.dataset.smgRatio || 0.75;
        const img = item.tagName === 'IMG' ? item : item.querySelector('img.bbImage, img');
        if (!img) return MASONRY_PH_RELH;
        const r = masonryImgRatio(img);
        if (r !== MASONRY_PH_RELH) return r;
        const dim = extractMediaDimensions(img);
        return dim ? dim.relH : MASONRY_PH_RELH;
    }
    // colunas do item: vídeo ou imagem deitada 2, em pé/quadrado 1; caixa morta 1
    function postItemSpan(item, relH) {
        return item.classList.contains('smg-dead') ? 1 : masonryOrientSpan(relH);
    }
    function mountPostGroup(grid) {
        masonryMount(grid, { getRatio: postItemRatio, getSpan: postItemSpan });
    }
    // dissolve formatação SEM texto em volta de imagens (<b><img><img></b>, <span>…) → as imagens ficam
    // irmãs do texto em volta e a run enxerga todas
    function unwrapEmptyMediaFormatting(scope) {
        if (!scope || !scope.querySelectorAll) return;
        const hasAuthorText = node => {
            if (node.nodeType === 3) return node.textContent.trim().length > 0;
            if (node.nodeType !== 1) return false;
            if (/^(IMG|IFRAME|VIDEO|BR|NOSCRIPT|SCRIPT|STYLE)$/i.test(node.tagName)) return false;
            if (node.classList && (node.classList.contains('auto-image-grid') || node.classList.contains('smg-dead'))) return false;
            if (node.matches && node.matches(VIDEO_BOX_SEL) && isVideoBox(node)) return false;   // o texto do placeholder do player não é do autor
            for (let c = node.firstChild; c; c = c.nextSibling) if (hasAuthorText(c)) return true;
            return false;
        };
        const sel = 'b, strong, i, em, u, s, span:not([data-s9e-mediaembed]), font, center';
        for (let pass = 0; pass < 10; pass++) {
            let changed = false;
            const cands = scope.querySelectorAll(sel);
            for (let i = cands.length - 1; i >= 0; i--) {
                const el = cands[i];
                if (!el.parentNode || el.closest(MEDIA_SKIP_SEL)) continue;
                if (!el.querySelector(MEDIA_ITEM_SEL + ', .auto-image-grid, ' + VIDEO_BOX_SEL) || hasAuthorText(el)) continue;
                el.replaceWith(...el.childNodes);
                changed = true;
            }
            if (!changed) break;
        }
    }
    // agrupa as runs de UM pai. Devolve os grupos montados/alterados.
    function groupRunsIn(parent, flows) {
        const touched = [];
        let run = [];   // { flow } | { grid }
        const flush = () => {
            const items = run; run = [];
            let count = 0;
            items.forEach(it => { count += it.grid ? it.grid.children.length : 1; });
            if (count < 2 || !items.some(it => it.flow)) return;   // nada novo, ou 1 imagem só → fica solta
            // alvo = um grupo já existente; de preferência o que tem player (mover iframe recarrega, mover vídeo pausa)
            const grids = items.filter(it => it.grid).map(it => it.grid);
            const target = grids.find(g => g.querySelector(':scope > .smg-mvid')) || grids[0] || document.createElement('div');
            if (!target.parentNode) {
                target.className = 'auto-image-grid';
                parent.insertBefore(target, items[0].flow);
            }
            // tudo que está entre o 1º e o último item da run e não é item (só <br>/espaço) sai do fluxo
            const first = items[0].flow || items[0].grid, last = items[items.length - 1].flow || items[items.length - 1].grid;
            for (let n = first; n && n !== last;) {
                const nx = n.nextSibling;
                if (n !== target && !items.some(it => it.flow === n || it.grid === n) && isInertNode(n)) n.remove();
                n = nx;
            }
            // ordem do documento: cada item (ou o conteúdo de cada grupo) vai pra sua posição no alvo. Só MOVE
            // quem não está lá: os itens que o alvo já tinha ficam parados (um player não é tirado do DOM).
            const ordered = [];
            items.forEach(it => { if (it.grid) ordered.push.apply(ordered, Array.from(it.grid.children)); else ordered.push(it.flow); });
            const kids = target.children;
            ordered.forEach((n, i) => {
                if (n.dataset.smgGridded !== '1') {
                    n.dataset.smgGridded = '1';
                    // o tamanho de mídia SOLTA (inline !important) brigaria com o do motor
                    [n].concat(Array.from(n.querySelectorAll ? n.querySelectorAll('img') : [])).forEach(el => {
                        if (el.style) { el.style.removeProperty('width'); el.style.removeProperty('max-width'); }
                    });
                }
                if (kids[i] !== n) target.insertBefore(n, kids[i] || null);
            });
            items.forEach(it => { if (it.grid && it.grid !== target) { masonryUnmount(it.grid); it.grid.remove(); } });
            // separadores que sobraram colados ANTES do grupo empurravam o grupo pra baixo
            // <br>/espaço colados nas bordas do grupo (sobra das quebras entre as imagens) viravam linhas vazias
            const isBreak = n => n && (n.nodeType === 3 ? !n.textContent.trim() : (n.nodeType === 1 && n.tagName === 'BR'));
            for (let p = target.previousSibling; isBreak(p);) { const pv = p.previousSibling; p.remove(); p = pv; }
            for (let nx = target.nextSibling; isBreak(nx);) { const nn = nx.nextSibling; nx.remove(); nx = nn; }
            touched.push(target);
        };
        Array.from(parent.childNodes).forEach(node => {
            if (flows.has(node)) { run.push({ flow: node }); return; }
            if (isPostGroup(node)) { run.push({ grid: node }); return; }
            if (isRunSeparator(node)) return;
            flush();
        });
        flush();
        return touched;
    }
    function buildPostGallery(scope) {
        unwrapEmptyMediaFormatting(scope);
        const byParent = new Map();   // pai no fluxo → Set(flow nodes ainda fora de grupo)
        const add = flow => {
            const parent = flow.parentElement;
            if (!parent || isPostGroup(parent)) return;   // já está num grupo
            if (!byParent.has(parent)) byParent.set(parent, new Set());
            byParent.get(parent).add(flow);
        };
        scope.querySelectorAll(MEDIA_ITEM_SEL).forEach(el => {
            if (el.closest(MEDIA_SKIP_SEL)) return;
            add(mediaFlowNode(el));
        });
        scope.querySelectorAll(VIDEO_BOX_SEL).forEach(el => {
            if (el.closest(VIDEO_SKIP_SEL) || !isVideoBox(el)) return;
            const flow = videoFlowNode(el);
            if (flow.closest(VIDEO_SKIP_SEL)) return;
            if (!flow.classList.contains('smg-mvid')) flow.classList.add('smg-mvid');
            add(flow);
        });
        byParent.forEach((flows, parent) => groupRunsIn(parent, flows).forEach(mountPostGroup));
    }
    function buildPostGalleries(roots) {
        if (!document.documentElement.classList.contains('smg-masonry-on')) return;   // só com a Galeria ligada
        // gate barato (data-smg-galseen marca cada item 1x → steady-state ~0). Escopo = CORPO do post (.message-userContent)
        // inteiro, NÃO só o .bbWrapper: no SMG o embed às vezes entra como IRMÃO do .bbWrapper.
        // corpo do post = .message-userContent · comentário (profile post / SMG) = .comment-body
        const bodies = new Set();
        const imgSeen = 'img.bbImage:not([data-smg-galseen]), .smg-dead--img:not([data-smg-galseen])';
        const videoSeen = '.generic2wide-iframe-div:not([data-smg-galseen]), .smg-dm-wrap:not([data-smg-galseen]), span[data-s9e-mediaembed]:not([data-smg-galseen]), .smg-rg:not([data-smg-galseen])';
        eachIn(roots, imgSeen + ', ' + videoSeen, el => {
            el.dataset.smgGalseen = '1';
            if (el.closest('.bbCodeQuote, .message-signature')) return;
            const b = el.closest('.message-userContent, .comment-body, .bbWrapper');
            if (!b) return;
            const post = b.closest('article.message, .message--post') || b;
            if (document.readyState !== 'complete' && document.readyState !== 'interactive'
                && !post.querySelector('.js-selectToQuoteEnd, .message-footer, .message-actionBar, .message-cell--user')) {
                delete el.dataset.smgGalseen;   // post ainda chegando no parse → volta no próximo pass
                return;
            }
            bodies.add(b);
        });
        bodies.forEach(buildPostGallery);
        // prontidão das galerias nos posts processados (o paint gate espera por ela)
        roots.forEach(r => {
            if (!r || !r.querySelectorAll) return;
            const ps = (r.matches && r.matches('article.message, .message--post')) ? [r] : r.querySelectorAll('article.message, .message--post');
            ps.forEach(p => { p.dataset.smgGalReady = '1'; });
        });
    }
    // item mudou de proporção (imagem carregou, virou caixa morta) → relayout do grupo dele no próximo frame
    function relayoutPostGroupOf(el) {
        const g = el && el.closest && el.closest('.auto-image-grid');
        if (g) masonrySchedule(g);
    }

