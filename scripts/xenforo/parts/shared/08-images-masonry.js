    // =========================================================
    // FEATURE: auto full images + portrait grid
    // =========================================================

    // 2 tiers de preload (anti-CLS no scroll rápido):
    //  · thumbIO (alcance GRANDE, 3000px): força a THUMB a carregar bem antes da viewport. Thumb é
    //    pequena/barata → fixa o tamanho da caixa cedo, então mesmo num fling a imagem já entra dimensionada.
    //  · fullIO (alcance médio, 1800px): troca pra full mais perto (qualidade). Como a thumb já carregou
    //    e tem a MESMA proporção, o swap não mexe no layout.
    let thumbIO = null, medIO = null, fullIO = null;
    function getThumbIO() {   // tira a THUMB do lazy nativo (loading=eager) bem antes da viewport (3000px)
        return thumbIO || (thumbIO = makeLazyIO(el => { el.loading = 'eager'; }, { rootMargin: '1200px 0px' }));
    }
    function getMedIO() {     // troca pra MÉDIA (.md.) mais perto da tela (thumb já dá o tamanho → swap sem flash)
        return medIO || (medIO = makeLazyIO(img => {
            const med = img.dataset.smgMed;
            if (med && img.getAttribute('src') !== med) img.src = med;
        }, { rootMargin: '2000px 0px' }));   // 2000px: troca bem antes de aparecer (mesma proporção da thumb → não desloca nada)
    }
    function getFullIO() {    // troca pra FULL (.jpg) em imagens standalone/sheets perto da tela (qualidade cristalina)
        return fullIO || (fullIO = makeLazyIO(img => {
            if (img.closest && img.closest('.auto-image-grid')) return;
            const full = img.dataset.smgFull;
            if (full && img.getAttribute('src') !== full) {
                if (!img.style.aspectRatio && img.naturalWidth && img.naturalHeight) {
                    img.style.aspectRatio = img.naturalWidth + ' / ' + img.naturalHeight;
                }
                img.src = full;
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
        const raw = img.dataset.smgLink || img.currentSrc || img.getAttribute('src') || '';
        if (!raw || /^data:/.test(raw)) { img.classList.add('smg-img-ready'); return; }   // sem destino útil → só tira o shimmer
        const href = resolveProxyHref(raw);   // mostra/abre a URL final, não o /goto/...&s=hash
        // proporção JÁ conhecida (a thumb tinha pintado antes de a full morrer) → a caixa fica do tamanho que a
        // mídia tinha, sem pulo de layout. Sem isso, cai no tamanho compacto padrão da CSS.
        // ABRIR = a página do host (smgLink, quando existe) · SONDAR = o arquivo que de fato não renderizou
        const direct = img.currentSrc || img.getAttribute('src') || '';
        const box = buildDeadBox(href, {
            aspect: img.style.aspectRatio || '',
            probeUrl: /^https?:/i.test(direct) ? direct : href,
        });
        // se a img é o ÚNICO conteúdo do <a> wrapper (jpg6), troca o <a> INTEIRO — a caixa já é um <a>, e <a>
        // aninhado é inválido (o browser desmonta a árvore e o clique para de funcionar).
        const wrap = img.parentNode;
        if (wrap.tagName === 'A' && wrap.childElementCount === 1 && !(wrap.textContent || '').trim()) wrap.replaceWith(box);
        else img.replaceWith(box);
        dropChipBreaks(box);
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
            img.addEventListener('load', () => {
                const g = img.closest('.auto-image-grid');
                if (g) scheduleRelayout(g);
            }, { once: true });
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
                if (feed && feed.classList.contains('open')) {
                    feed.querySelectorAll('img.smg-feed-media').forEach(fi => {
                        if (fi.dataset.src === res.medium || fi.src === res.medium) {
                            fi.dataset.src = res.original;
                            fi.src = res.original;
                        }
                    });
                }
            }, img);
        }
        let src = img.currentSrc || img.getAttribute('src') || img.src || '';
        if (!/^https?:/i.test(src)) {                // placeholder lazy ainda sem URL real
            const realSrc = img.getAttribute('data-url') || img.getAttribute('data-src') || img.getAttribute('data-original');
            if (realSrc && /^https?:/i.test(realSrc)) {
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

        // ao ganhar dimensão (thumb ou full), trava a proporção e tira o shimmer → caixa estável
        const onReady = () => {
            if (img.complete && !img.naturalWidth) { imgFailLink(img); return; }   // completou QUEBRADA (404/hotlink/host fora) → mostra o link no lugar
            if (img.naturalWidth && img.naturalHeight) {
                const currentRatio = img.style.aspectRatio;
                if (!currentRatio || currentRatio === '100 / 100' || (currentRatio === '1 / 1' && img.naturalWidth !== img.naturalHeight)) {
                    img.style.aspectRatio = img.naturalWidth + ' / ' + img.naturalHeight;
                }
            }
            markWide(img, img.naturalWidth, img.naturalHeight);   // deitada → largura limitada fora do mosaico
            const grid = img.closest('.auto-image-grid');
            if (grid) {
                if (img.style.aspectRatio && !grid.style.getPropertyValue('--smg-grid-img-ph')) {
                    grid.style.setProperty('--smg-grid-img-ph', img.style.aspectRatio);
                }
                scheduleRelayout(grid);
            } else if (img.classList.contains('smg-wide') || img.dataset.smgFull) {
                if (img.dataset.smgFull && img.dataset.smgFull !== img.src) {
                    const fio = getFullIO();
                    if (fio) fio.observe(img);
                }
            }
            img.classList.add('smg-img-ready');
        };
        if (img.complete) onReady();                 // já resolvida (ok ou quebrada) → sem shimmer preso
        else {
            img.addEventListener('load', onReady, { once: true });
            img.addEventListener('error', () => imgFailLink(img), { once: true });   // não renderizou → caixa de mídia morta
            armImgWatchdog(img);   // nem load nem error (host pendurado) → a caixa entra por tempo, não por evento
        }

        const tio = getThumbIO(); if (tio) tio.observe(img);   // thumb carrega bem cedo → tamanho fixo antes de aparecer

        // ANTI-PULO: NÃO troca a thumb pela full na hora. Mantém a thumb (carrega rápido e fixa
        // o tamanho) e só troca pra full perto da viewport (IO). Como a full tem a MESMA proporção,
        // subir/descer um thread enorme não reflui o layout — era o swap imediato + lazy que blankava
        // a imagem e fazia ela "estourar" de tamanho ao carregar.
        const imgbox = isImgboxThumb(src);   // imgbox: thumb `_t` → original `_o` (sem tier médio próprio → exibe o original no post)
        const big = getBigUrl(src);          // sobe pra FULL nos hosts conhecidos (.md/.th, imgbox, pixhost, …)
        const convMd = src.includes('.md.'), convTh = src.includes('.th.');
        // ANTES só entrava .md/.th/imgbox → hosts com padrão próprio de thumb (pixhost & cia) ficavam na BAIXA.
        // Agora qualquer host que o getBigUrl saiba subir (big !== src) também entra no upgrade.
        if (convMd || convTh || imgbox || big !== src) {
            const full = big;
            const med = convMd ? src : (convTh ? src.replace('.th.', '.md.') : full);   // tier MÉDIO só p/ convenção .md/.th; resto (pixhost/imgbox) exibe o FULL direto
            img.dataset.smgFull = full;
            img.dataset.smgMed = med;
            img.removeAttribute('srcset');
            const link = img.closest('a');
            if (link) link.href = full;              // maximizar (feed/lightbox) abre o FULL (alta)
            if (img.title) img.title = cleanText(img.title);
            if (img.alt) img.alt = cleanText(img.alt);
            const tio = getThumbIO(); if (tio) tio.observe(img);   // thumb carrega bem cedo → tamanho fixo antes de aparecer
            if (med !== src) {                       // src é .th. → sobe pra .md. perto da viewport; .md. já exibido FICA (nunca vai pro full no post)
                const mio = getMedIO();
                if (mio) mio.observe(img); else img.src = med;     // sem IO → troca direto (fallback)
            }
            if (!img.closest('.auto-image-grid') && full !== img.src) {
                const fio = getFullIO();
                if (fio) fio.observe(img);
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
            img.addEventListener('load', () => {
                const g = img.closest('.auto-image-grid');
                if (g) scheduleRelayout(g);
            }, { once: true });   // tem dimensões → masonry re-grida
            img.addEventListener('error', () => {}, { once: true });   // CDN fora → deixa o que estiver (card já foi removido; vira img quebrada rara)
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
                img.addEventListener('load', () => {
                    const g = img.closest('.auto-image-grid');
                    if (g) scheduleRelayout(g);
                }, { once: true });
                a.appendChild(img); img.src = u; frag.appendChild(a);
            });
            card.replaceWith(frag);
            if (typeof scheduleRun === 'function') scheduleRun();
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
                if (typeof fhCard !== 'function' || typeof pdPlace !== 'function' || typeof fhLogoChain !== 'function') return false;
                if (typeof fhProvider === 'function' && fhProvider(href)) return false;   // file-host → aquele pass monta (com thumbs/contagem)
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
                if (typeof fhLinkFavicon === 'function') fhLinkFavicon(a, href);   // ícone do site no lugar do 🔗 genérico
                dropChipBreaks(a);
            };
            const linkChip = () => {
                const lk = document.createElement('a');
                lk.href = href; lk.target = '_blank'; lk.rel = 'noopener noreferrer';
                lk.className = 'link link--external smg-imglink-fallback'; lk.appendChild(chipText());
                if (typeof fhLinkFavicon === 'function') fhLinkFavicon(lk, href);
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
                if (a.isConnected) showLink();                          // img ainda no <a> → vira texto-link
                else if (img.parentNode) { const c = linkChip(); img.replaceWith(c); dropChipBreaks(c); }   // a masonry moveu pro grid → chip de link no lugar
            }, { once: true });
            a.innerHTML = '';   // limpa o noscript + whitespace
            a.appendChild(img);
        });
    }

    // GALERIA NO POST (html.smg-masonry-on): agrupa TODA a mídia do post — imagens E vídeos/embeds —
    // num .auto-image-grid (masonry por CSS). Roda DEPOIS dos passes de embed (turbo/saint/redgifs/direta)
    // pra os wrappers já existirem. Incremental: embed lazy que aparecer depois entra no grid já existente.
    function collectGalleryBlocks(scope) {
        const out = [];
        // imagens + TODOS os embeds: wrappers conhecidos (turbo/saint/redgifs/s9e/mídia direta) + iframe/video SOLTOS (imagepond, vídeo nativo, outros hosts)
        scope.querySelectorAll('img.bbImage, .generic2wide-iframe-div, .smg-dm-wrap, span[data-s9e-mediaembed], iframe[src*="imagepond.net"]').forEach(el => {   // só tipos conhecidos + imagepond (bare video/iframe puxava vídeo nativo preto/thumb quebrada)
            if (el.closest('.bbCodeQuote, .smg-post-links, .message-signature')) return;
            const sp = el.closest('.bbCodeSpoiler-content, .bbCodeBlock--spoiler .bbCodeBlock-content');
            if (sp && sp !== scope && scope.contains(sp)) return;
            if (!scope.classList.contains('bbCodeSpoiler-content') && !scope.classList.contains('bbCodeBlock-content') && sp) return;
            // img/iframe/video que JÁ está dentro de um wrapper coletado → representado por ele (evita duplicar)
            if (/^(IMG|IFRAME|VIDEO)$/.test(el.tagName) && el.closest('.generic2wide-iframe-div, .smg-dm-wrap, span[data-s9e-mediaembed]')) return;
            // s9e dentro de um .generic2wide-iframe-div (redgifs do Simp) → o DIV pai é o bloco (senão conta 2x: o span + o div)
            if (el.matches('span[data-s9e-mediaembed]') && el.closest('.generic2wide-iframe-div')) return;
            // s9e CONSUMIDO (saint/turbo/redgifs tiraram o iframe e montaram o player num generic2wide-iframe-div IRMÃO →
            // sobrou só o .url-below vazio): FANTASMA. Sem isto ele virava um bloco a mais → grid com coluna(s) vazia(s).
            if (el.matches('span[data-s9e-mediaembed]') && !el.querySelector('iframe, video, img')) return;
            // .generic2wide-iframe-div VAZIO NÃO conta como mídia (loader pós-autoload esvazia: iframe vai pra s9e separado).
            // basta o teste de conteúdo: o loader que ASSUMIMOS tem .smg-rg>video → entra; o esvaziado (sem iframe/slot/video) → sai.
            if (el.matches('.generic2wide-iframe-div') && !el.querySelector('iframe, .smg-turbo-slot, video, .smg-rg-fail')) return;
            out.push(el);
        });
        return out;
    }
    // proporção PROVISÓRIA das imagens (altura/largura) enquanto a real não chega. Uma constante só,
    // espelhada no CSS via --smg-img-ph: o espaço pintado e as linhas reservadas no grid TÊM que ser o
    // mesmo, senão todo item nasce torto e o grid se rearranja quando a imagem carrega.
    const IMG_PH_RELH = 1.3;
    try { document.documentElement.style.setProperty('--smg-img-ph', '1 / ' + IMG_PH_RELH); } catch (e) {}
    function blockRelH(b) {   // altura relativa (h/w) p/ distribuir no masonry, SEM reflow (usa dimensões extraídas do HTML/metadados)
        const dim = extractMediaDimensions(b);
        if (dim) return dim.relH;
        // embed: usa o aspect-ratio REAL se o player já souber (redgifs/turbo setam no .smg-rg após carregar — muitos são retrato, não 16:9)
        const rg = (b.matches && b.matches('.smg-rg')) ? b : (b.querySelector && b.querySelector('.smg-rg'));
        const am = rg && rg.style.aspectRatio && rg.style.aspectRatio.match(/([\d.]+)\D+([\d.]+)/);
        if (am && +am[1]) return (+am[2]) / (+am[1]);
        if (isVideoBlock(b)) return 0.5625;   // embeds/vídeo 16:9 (default até o player saber a proporção)
        return IMG_PH_RELH;   // fotos/imagens default para 1.3 (retrato)
    }
    function getEffectiveWidth() {
        let w = (typeof window !== 'undefined' && window.innerWidth) || 1200;
        if (typeof document !== 'undefined' && document.documentElement && document.documentElement.classList.contains('smg-aldock-on')) {
            const dock = document.getElementById('smg-aldock');
            const dockW = (dock && dock.offsetWidth) ? dock.offsetWidth : 360;
            w -= dockW;
        }
        return w;
    }
    function gridCols() {
        const w = getEffectiveWidth();
        if (w < 600) return 1;
        if (w <= 1400) return 2;
        return 3;
    }
    // nº de colunas pela quantidade E orientação:
    //   · mobile (< 600px) → 1
    //   · 1 item → 1 coluna
    //   · 2 itens horizontais (h/w < 0.9) → 1 coluna; qualquer vertical → 2 colunas
    //   · 3 itens com pelo menos 2 verticais (h/w >= 0.9) → 3 colunas; caso contrário → 2
    //   · 4 itens com maioria vertical (3+) → 3 colunas; caso contrário → 2
    //   · 5 ou mais → 3 colunas
    const WIDE_RELH = 0.9;   // h/w < 0.9 = horizontal (16:9, 21:9, 16:10, 4:3)
    const TALL_RELH = 1.35;  // h/w > 1.35 = muito vertical (stories/prints 9:16, 2:3)
    const SMG_MEDIA_MAX_VH = 70;
    const SMG_MEDIA_MAX_PX = 750;
    function setVerticalMaxWidth(el, w, h, vertical) {
        if (!el || !el.style || !w || !h) return;
        // No masonry (.auto-image-grid), a largura é rigorosamente 100% da coluna (gap de 8px).
        // NUNCA aplica max-width inline em itens de grid, pois causaria encolhimento e vãos horizontais gigantes!
        if (el.closest && el.closest('.auto-image-grid')) {
            el.style.removeProperty('max-width');
            return;
        }
        if (!vertical) { el.style.removeProperty('max-width'); return; }
        const ratio = w / h;
        const maxWidth = 'min(75%, 880px, calc(var(--smg-media-h, min(70vh, 750px)) * ' + ratio.toFixed(4) + '))';
        el.style.setProperty('max-width', maxWidth, 'important');
    }
    function markWide(el, w, h) {
        if (!el || !w || !h) return;
        const wide = (h / w) < WIDE_RELH;
        el.classList.toggle('smg-wide', wide);
        el.classList.toggle('smg-vert', !wide);
        setVerticalMaxWidth(el, w, h, !wide);
        const wrap = el.closest && el.closest('.smg-dm-wrap');
        if (wrap) {
            wrap.classList.toggle('smg-wide', wide);
            wrap.classList.toggle('smg-vert', !wide);
            setVerticalMaxWidth(wrap, w, h, !wide);
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
    function isVideoBlock(b) {
        if (!b) return false;
        if (b.tagName === 'IMG') return false;
        return true;
    }
    function isWideMedia(b) {
        if (!b) return false;
        return blockRelH(b) < WIDE_RELH;
    }
    function gridColsFor(blocks) {
        const w = getEffectiveWidth();
        if (w < 600) return 1;
        if (blocks.length <= 1) return 1;

        const isCompact = w <= 1400;
        const videoCount = blocks.filter(isVideoBlock).length;
        const photoCount = blocks.length - videoCount;
        const wideCount = blocks.filter(isWideMedia).length;
        const tallCount = blocks.length - wideCount;

        if (blocks.length === 2) {
            // 2 itens (sejam vídeos, fotos horizontais, verticais ou misto) sempre em 2 colunas (1 row só)
            return 2;
        }
        if (blocks.length === 3) {
            if (w < 600) return 1;
            // Se houver vídeo (misto ou 3 vídeos): 2 colunas para acomodar players
            if (videoCount > 0) return 2;
            // 3 fotos horizontais: 2 colunas (2 no topo + 1 embaixo span-all)
            if (wideCount === 3) return 2;
            // 1 foto vertical + 2 fotos horizontais (caso do usuário): 2 COLUNAS (50% cada)!
            // Coluna 1: 1 vertical | Coluna 2: 2 horizontais empilhadas.
            // As alturas coincidem (~1.78 vs ~1.50) e preenchem 100% da largura útil sem coluna vazia!
            if (tallCount === 1 && wideCount === 2) return 2;
            // 2 fotos verticais + 1 foto horizontal: 2 colunas (linha 1: 2 verticais, linha 2: 1 horizontal span-all)
            if (tallCount === 2 && wideCount === 1) return 2;
            // 3 fotos verticais/quadradas puras (tallCount === 3):
            // Em telas compactas (<= 1400px): 2 colunas
            // Em telas amplas (> 1400px): 3 colunas (1 única linha equilibrada com 1 foto por coluna)
            if (isCompact) return 2;
            return 3;
        }
        if (blocks.length === 4) {
            // 4 itens: 2x2 equilibrado
            return 2;
        }
        if (blocks.length === 5) {
            // Caso 3: 2 fotos + 3 vídeos -> 6 trilhas (2x span 3 + 3x span 2) apenas em telas amplas
            if (!isCompact && photoCount === 2 && videoCount === 3) return 6;
            // 5 mídias wide -> 2 colunas (2 + 2 + 1)
            if (wideCount === 5) return 2;
            return isCompact ? 2 : 3;
        }
        if (blocks.length === 6) {
            // Caso 4: 4 fotos + 2 vídeos -> 2 colunas (3 linhas perfeitas de 2 itens)
            if (photoCount === 4 && videoCount === 2) return 2;
            // 6 mídias wide -> 2 colunas (3 linhas perfeitas de 2 itens)
            if (wideCount === 6) return 2;
            return isCompact ? 2 : 3;
        }
        // Se todas as mídias forem wide (vídeos e/ou fotos horizontais), mantém 2 colunas para preservar a largura
        if (wideCount === blocks.length) return 2;
        return isCompact ? 2 : 3;
    }
    // ===== MASONRY por CSS Grid =====
    // The grid keeps uniform columns, row-major order, and one consistent gap. Each item keeps its
    // natural height; without row-span calculations in JS, late proportions cannot crop, distort, or
    // overlap neighboring media. CSS Grid recomputes row geometry as content changes.
    // Relayout is needed only when structure or column count changes; CSS Grid handles the rest.
    let masonryDirty = new Set(), masonryRaf = 0;
    function scheduleRelayout(grid) {
        masonryDirty.add(grid);
        if (masonryRaf) return;
        masonryRaf = requestAnimationFrame(() => {
            masonryRaf = 0;
            const gs = masonryDirty; masonryDirty = new Set();
            gs.forEach(g => { if (g.isConnected) relayoutGrid(g); });
        });
    }
    // (uma pré-medição com new Image() foi testada aqui e NÃO ajudou: o Image() usa o mesmo download da
    //  <img> real, então a proporção chega no mesmo instante — não antes. O que reduz o pulo é o
    //  relayout local acima.)
    // embed lazy (turbo/saint/imagepond/cyberdrop/etc.): ativa IMEDIATAMENTE ao entrar no grid
    function activateLazyEmbed(b) {
        if (!b) return;
        const slot = (b._smgActivate ? b : null) || (b.querySelector && (b.querySelector('.smg-turbo-slot') || b.querySelector('video')));
        if (slot && slot._smgActivate) {
            const fn = slot._smgActivate;
            slot._smgActivate = null;
            if (typeof lazyEmbedIO !== 'undefined' && lazyEmbedIO) lazyEmbedIO.unobserve(slot);
            fn();
        }
    }
    function hasTextBetweenMedia(scope) {
        if (!scope) return false;
        const grids = scope.querySelectorAll('.auto-image-grid');
        if (grids.length > 1) return true;   // múltiplas galerias separadas por conteúdo no mesmo post

        const blocks = collectGalleryBlocks(scope);
        if (blocks.length < 2) return false;

        const first = (blocks[0].tagName === 'IMG') ? (blocks[0].closest('.bbImageWrapper, a') || blocks[0]) : blocks[0];
        const last = (blocks[blocks.length - 1].tagName === 'IMG') ? (blocks[blocks.length - 1].closest('.bbImageWrapper, a') || blocks[blocks.length - 1]) : blocks[blocks.length - 1];
        if (!first || !last || first === last) return false;
        if (!first.parentNode || !last.parentNode) return false;

        // Se ambos estão dentro do mesmo auto-image-grid, todo o conteúdo entre eles é puramente mídia
        const g1 = first.closest && first.closest('.auto-image-grid');
        const g2 = last.closest && last.closest('.auto-image-grid');
        if (g1 && g1 === g2) return false;

        try {
            const range = document.createRange();
            range.setStartAfter(first);
            range.setEndBefore(last);
            const frag = range.cloneContents();
            if (frag.querySelectorAll) {
                frag.querySelectorAll('.bbCodeQuote, .bbCodeSpoiler, .message-signature, .smg-post-links, .smg-fhcard, .bbCodeBlock--unfurl, .auto-image-grid, a.link--external, a.smg-imglink, script, style, noscript').forEach(el => el.remove());
            }
            const between = (frag.textContent || '').replace(/\s+/g, ' ').trim();
            return between.length >= 15;
        } catch (e) {
            return false;
        }
    }

    // Recalculate the column count and center a lone item on the last row of a three-column grid.
    function relayoutGrid(grid) {
        const items = Array.prototype.filter.call(grid.children, c => c.nodeType === 1);
        if (!items.length) return;

        const isTrueMasonry = grid.classList.contains('smg-true-masonry');
        const establishedCols = +(grid.dataset.smgCols || 0);
        const prevCount = +(grid.dataset.smgItemCount || 0);
        const prevBucket = +(grid.dataset.smgBucket || 0);
        const currentWideCount = items.filter(isWideMedia).length;
        const prevWideCount = +(grid.dataset.smgWideCount || -1);
        if (isTrueMasonry && establishedCols && prevCount === items.length && prevBucket === gridCols() && prevWideCount === currentWideCount) {
            // Em True Masonry estável com mesmo bucket e mesma orientação de mídias, atualiza apenas proporções individuais
            items.forEach(it => {
                const rh = blockRelH(it);
                const r = rh > 0 ? (1 / rh) : 1;
                it.style.setProperty('--smg-ratio', r.toFixed(4));
            });
            return;
        }
        grid.dataset.smgWideCount = currentWideCount;

        grid.classList.remove('smg-grid-2', 'smg-grid-2-tall', 'smg-grid-2-asym', 'smg-grid-pair-tall', 'smg-grid-6', 'smg-grid-orphan', 'smg-justified-grid', 'smg-true-masonry');
        grid.style.removeProperty('--smg-col1-w');
        grid.style.removeProperty('--smg-col2-w');

        items.forEach(it => {
            it.classList.remove('smg-span-all', 'smg-item-centered', 'smg-span-2', 'smg-span-3');
            const rh = blockRelH(it);
            const r = rh > 0 ? (1 / rh) : 1;
            it.style.setProperty('--smg-ratio', r.toFixed(4));
            if (it.style) {
                if (it.style.maxWidth) it.style.removeProperty('max-width');
                if (it.style.width) it.style.removeProperty('width');
            }
            const innerImg = it.tagName === 'IMG' ? it : (it.querySelector && it.querySelector('img.bbImage'));
            if (innerImg && innerImg.style) {
                if (innerImg.style.maxWidth) innerImg.style.removeProperty('max-width');
                if (innerImg.style.width) innerImg.style.removeProperty('width');
            }
        });

        const videoCount = items.filter(isVideoBlock).length;
        const photoCount = items.length - videoCount;
        const hasVideo = videoCount > 0;
        const wideCount = items.filter(isWideMedia).length;
        const tallCount = items.length - wideCount;
        const isAllWide = wideCount === items.length;

        // ESTABILIDADE DE COLUNAS (Anti-CLS): se a grade já teve suas colunas calculadas
        // e a quantidade de itens é a mesma para o mesmo bucket de tela, não altera o número de colunas (N) por causa
        // do término do carregamento de imagem individual para evitar que o layout pule!
        let N;
        const currentBucket = gridCols();
        if (establishedCols && prevBucket === currentBucket && prevCount === items.length) {
            N = establishedCols;
        } else {
            N = Math.min(6, Math.max(1, gridColsFor(items)));
            grid.dataset.smgCols = N;
            grid.dataset.smgBucket = currentBucket;
            grid.dataset.smgItemCount = items.length;
        }
        grid.style.setProperty('--smg-mcols', N);
        masonryBucket = currentBucket;

        if (items.length === 2) {
            grid.classList.add('smg-grid-2');
            const r0 = blockRelH(items[0]), r1 = blockRelH(items[1]);
            // Se as duas fotos/mídias forem verticais ou quadradas (h/w >= 0.9):
            // restringe o container (.smg-grid-2-tall) para não estourar em telas ultrawide
            const isTwoTall = N === 2 && r0 >= 0.9 && r1 >= 0.9;
            if (isTwoTall) {
                grid.classList.add('smg-grid-2-tall');
            } else if (r0 > 0 && r1 > 0 && Math.abs(r0 - r1) > 0.15) {
                grid.classList.add('smg-grid-2-asym');
                const w0 = r1 / (r0 + r1);
                const w1 = r0 / (r0 + r1);
                grid.style.setProperty('--smg-col1-w', 'calc((100% - 8px) * ' + w0.toFixed(4) + ')');
                grid.style.setProperty('--smg-col2-w', 'calc((100% - 8px) * ' + w1.toFixed(4) + ')');
            }
        } else if (isAllWide && items.length >= 3) {
            // GRADE PURA DE MÍDIAS HORIZONTAIS (vídeos e/ou fotos 16:9, 4:3):
            // Usa CSS Grid em 2 colunas para preservar a largura ampla de cada item sem espremer.
            // Se houver item ímpar no final de uma grade de 2 colunas, ele é centralizado ou recebe span-all
            if (N === 2 && items.length % 2 === 1) {
                const lastItem = items[items.length - 1];
                if (lastItem) lastItem.classList.add('smg-span-all');
            }
        } else if (!hasVideo && items.length === 3 && N === 2 && wideCount === 1 && tallCount === 2) {
            // 2 verticais + 1 horizontal:
            // CSS Grid 2 colunas — linha 1: 2 verticais (50% cada) | linha 2: 1 horizontal (span-all 100%)
            const wideItem = items.find(isWideMedia);
            if (wideItem) wideItem.classList.add('smg-span-all');
        } else if (!hasVideo && items.length === 3 && N === 2 && tallCount === 1 && wideCount === 2) {
            // 1 vertical + 2 horizontais (caso do usuário):
            // True Masonry 2 colunas (50% cada) — Coluna 1: 1 vertical | Coluna 2: 2 horizontais empilhadas
            // As alturas coincidem (~1.78 vs ~1.50) e ocupam 100% da largura útil sem coluna 3 vazia!
            const tallItem = items.find(it => !isWideMedia(it));
            if (tallItem && items.indexOf(tallItem) === 1) {
                // Se a foto vertical estiver no meio (wide, tall, wide), move para o início para que as 2 wide fiquem juntas
                grid.insertBefore(tallItem, grid.firstChild);
            }
            grid.classList.add('smg-true-masonry');
        } else if (hasVideo) {
            // Se houver vídeo (Casos 1, 2, 3, 4): utiliza o CSS Grid com spans estruturados
            if (items.length === 3 && N === 2) {
                const videoItem = items.find(isVideoBlock);
                const photoItems = items.filter(it => !isVideoBlock(it));
                if (videoItem && photoItems.length === 2) {
                    videoItem.classList.add('smg-span-all');
                } else {
                    const photoItem = items.find(it => !isVideoBlock(it));
                    if (photoItem) photoItem.classList.add('smg-item-centered');
                }
            } else if (items.length === 5 && N === 6) {
                grid.classList.add('smg-grid-6');
                items.forEach(it => {
                    if (isVideoBlock(it)) it.classList.add('smg-span-2');
                    else it.classList.add('smg-span-3');
                });
            }
            grid.classList.toggle('smg-grid-orphan', N === 3 && items.length % N === 1);
        } else if (items.length >= 3) {
            // Toda galeria de fotos (seja o post inteiro ou cada bloco entre textos no modo row)
            // é o seu próprio True Masonry local, sem cortes e sem vãos vazios!
            grid.classList.add('smg-true-masonry');
            if (items.length === 4 && N === 2) {
                const allTallOrSquare = items.every(it => blockRelH(it) >= 0.9);
                if (allTallOrSquare) grid.classList.add('smg-grid-pair-tall');
            }
        }
    }
    // move os novos blocos pra serem filhos DIRETOS do grid e deixa o CSS Grid recalcular as linhas.
    function fillGrid(grid, newBlocks) {
        grid.style.removeProperty('grid-template-columns');   // limpa eventual template inline do modo legado
        let insertRef = grid.firstChild;
        newBlocks.forEach(b => {
            if (b.parentNode === grid) return;
            const unfurl = b.closest('.bbCodeBlock--unfurl');   // ANTES de mover: o card de link vira caixa vazia → esconde
            const followingMask = (typeof Node !== 'undefined' && Node.DOCUMENT_POSITION_FOLLOWING) || 4;
            if (b.compareDocumentPosition && (b.compareDocumentPosition(grid) & followingMask)) {
                if (insertRef) grid.insertBefore(b, insertRef);
                else grid.appendChild(b);
            } else {
                grid.appendChild(b);
            }
            b.dataset.smgGridded = '1';
            if (unfurl) unfurl.style.display = 'none';
            // CSS Grid updates row geometry when the item changes height; JS only handles classification.
            activateLazyEmbed(b);
        });
        relayoutGrid(grid);
    }
    // remove os <a> esvaziados (a img foi pro grid) + os <br> separadores, no PARENT do grid — sem tocar em texto/links reais.
    function cleanupGhosts(grid) {
        const parent = grid.parentNode; if (!parent) return;
        parent.querySelectorAll(':scope > a, :scope > .bbImageWrapper').forEach(a => {
            let real = false;   // conteúdo PRÓPRIO do <a> (ignora <noscript>, que vaza como texto OU vira DOM dependendo do parse)
            a.childNodes.forEach(n => { if (n.nodeType === 1 && n.tagName !== 'NOSCRIPT') real = true; else if (n.nodeType === 3 && n.textContent.trim()) real = true; });
            if (real) return;   // <a> com texto/mídia real → mantém SEMPRE
            let sib = a.nextSibling; a.remove();
            while (sib && sib.nodeType === 3 && !sib.textContent.trim()) { const nx = sib.nextSibling; sib.remove(); sib = nx; }
            if (sib && sib.nodeName === 'BR') sib.remove();   // o <br> que separava esta imagem da próxima
        });
        let p = grid.previousSibling;   // <br>/ws colado ANTES do grid (sobra dos breaks das imagens movidas) → senão empurra o grid pra baixo
        while (p && (p.nodeName === 'BR' || (p.nodeType === 3 && !p.textContent.trim()))) { const pv = p.previousSibling; p.remove(); p = pv; }
    }
    function unwrapEmptyMediaFormatting(scope) {
        if (!scope || !scope.querySelectorAll) return;
        const sel = 'b, strong, i, em, u, s, span:not([data-s9e-mediaembed]), font, center';
        const hasAuthorText = node => {
            if (!node) return false;
            if (node.nodeType === 3) return node.textContent.trim().length > 0;
            if (node.nodeType !== 1) return false;
            const tag = node.tagName;
            if (/^(IMG|IFRAME|VIDEO|BR|NOSCRIPT|SCRIPT|STYLE)$/i.test(tag)) return false;
            if (node.classList && (node.classList.contains('generic2wide-iframe-div') || node.classList.contains('smg-dm-wrap') || node.classList.contains('auto-image-grid'))) return false;
            if (node.hasAttribute && node.hasAttribute('data-s9e-mediaembed')) return false;
            for (let child = node.firstChild; child; child = child.nextSibling) {
                if (hasAuthorText(child)) return true;
            }
            return false;
        };

        let changed = true;
        let passes = 0;
        while (changed && passes < 10) {
            changed = false;
            passes++;
            const candidates = scope.querySelectorAll(sel);
            for (let i = candidates.length - 1; i >= 0; i--) {
                const el = candidates[i];
                if (!el.parentNode) continue;
                // Contém mídia ou grid?
                const hasMedia = el.querySelector('img.bbImage, .generic2wide-iframe-div, .smg-dm-wrap, span[data-s9e-mediaembed], iframe[src*="imagepond.net"], .auto-image-grid');
                if (!hasMedia) continue;

                // Verifica se há texto autoral real dentro de el sem clonar o nó
                if (!hasAuthorText(el)) {
                    // É puramente um wrapper de formatação ao redor de mídias sem nenhum texto:
                    // dissolve o wrapper no parent para que as mídias fiquem no mesmo nível das demais mídias
                    el.replaceWith(...el.childNodes);
                    changed = true;
                }
            }
        }
    }

    function mergeAdjacentGrids(scope) {
        if (!scope || !scope.querySelectorAll) return;
        const grids = Array.from(scope.querySelectorAll('.auto-image-grid'));
        for (let i = 0; i < grids.length; i++) {
            const grid = grids[i];
            if (!grid.parentNode) continue;
            let next = grid.nextSibling;
            // Pula nós de texto vazios/whitespace, comentários e quebras <br>
            while (next && (
                (next.nodeType === 3 && !next.textContent.trim()) ||
                (next.nodeType === 8) ||
                (next.nodeType === 1 && next.tagName === 'BR')
            )) {
                next = next.nextSibling;
            }
            if (next && next.nodeType === 1 && next.classList.contains('auto-image-grid')) {
                const grid1IsWide = Array.from(grid.children).every(isWideMedia);
                const grid2IsWide = Array.from(next.children).every(isWideMedia);
                // Não mescla se um grid for wide (2 colunas) e o outro for tall (True Masonry 3 colunas)
                if (grid1IsWide !== grid2IsWide) {
                    continue;
                }
                // Encontrou grid adjacente sem texto entre eles do mesmo tipo: mescla os itens do segundo grid no primeiro!
                while (next.firstChild) {
                    grid.appendChild(next.firstChild);
                }
                const nextToRemove = next;
                let between = grid.nextSibling;
                while (between && between !== nextToRemove) {
                    const nb = between.nextSibling;
                    between.remove();
                    between = nb;
                }
                nextToRemove.remove();
                relayoutGrid(grid);
                cleanupGhosts(grid);
                i--; // Reavalia este mesmo grid caso haja outro grid em seguida
            }
        }
    }

    // GALERIA EM CONTEXTO (era: UM grid no fim do post → quebrava o contexto quando havia texto entre as mídias). Agora agrupa
    // só RUNS de mídia CONTÍGUA (separadas apenas por <br>/espaço); texto OU card/elemento não-mídia entre mídias QUEBRA a run →
    // vira um grid à parte NO LUGAR de origem, então o texto fica junto da mídia a que se refere. Run de 1 mídia → fica inline.
    function buildPostGallery(scope) {
        unwrapEmptyMediaFormatting(scope);
        // 1. Desaninhar grids acidentais prévios (auto-image-grid dentro de auto-image-grid)
        scope.querySelectorAll('.auto-image-grid .auto-image-grid').forEach(innerGrid => {
            const outer = innerGrid.parentElement;
            if (!outer) return;
            while (innerGrid.firstChild) {
                outer.insertBefore(innerGrid.firstChild, innerGrid);
            }
            innerGrid.remove();
            relayoutGrid(outer);
        });

        const byParent = new Map();   // parent-do-fluxo → Map(flowEl → [blocks]); flowEl = o nó que senta no fluxo (o <a> da img, ou o próprio wrapper)
        collectGalleryBlocks(scope).forEach(b => {
            if (b.dataset.smgGridded) return;   // já gridada (filho direto do grid)
            const flow = (b.tagName === 'IMG') ? (b.closest('.bbImageWrapper, a') || b) : b;
            const parent = flow.parentNode; if (!parent) return;
            if (!byParent.has(parent)) byParent.set(parent, new Map());
            const m = byParent.get(parent); if (!m.has(flow)) m.set(flow, []); m.get(flow).push(b);
        });
        byParent.forEach((flowMap, parent) => {
            if (parent.classList && parent.classList.contains('auto-image-grid')) {
                // O próprio parent já é um grid! Não cria outro grid filho dentro dele.
                const ungridded = [];
                flowMap.forEach(blocks => ungridded.push.apply(ungridded, blocks));
                if (ungridded.length) {
                    fillGrid(parent, ungridded);
                    cleanupGhosts(parent);
                }
                return;
            }
            let run = [];   // itens contíguos: {flow,blocks} (mídia nova) | {grid} (grid já existente → mídia nova adjacente entra nele)
            const mountSubRun = (subItems, subUngri) => {
                if (!subUngri.length) return;
                let grid = (subItems.find(it => it.grid) || {}).grid;
                const have = grid ? grid.children.length : 0;
                if (subUngri.length + have < 2) return;   // 1 mídia isolada → fica inline no fluxo
                if (!grid) {
                    const firstFlow = (subItems.find(it => it.flow) || {}).flow;
                    if (!firstFlow || !firstFlow.parentNode) return;
                    grid = document.createElement('div'); grid.className = 'auto-image-grid';
                    firstFlow.parentNode.insertBefore(grid, firstFlow);
                }
                fillGrid(grid, subUngri);
                cleanupGhosts(grid);
            };

            const flush = () => {
                const items = run; run = [];
                const ungridded = []; items.forEach(it => { if (it.blocks) ungridded.push.apply(ungridded, it.blocks); });
                if (!ungridded.length) return;

                const wideBlocks = ungridded.filter(isWideMedia);
                const tallBlocks = ungridded.filter(b => !isWideMedia(b));
                const isMixed = wideBlocks.length > 0 && tallBlocks.length > 0;
                const isSmallSpecialCase = ungridded.length <= 2
                    || (wideBlocks.length === 1 && tallBlocks.length === 2)
                    || (wideBlocks.length === 2 && tallBlocks.length === 1)
                    || (wideBlocks.length === 3 && tallBlocks.length === 2)
                    || (wideBlocks.length === 2 && tallBlocks.length === 4);

                if (!isMixed || isSmallSpecialCase || items.some(it => it.grid)) {
                    mountSubRun(items, ungridded);
                    return;
                }

                // PARTIÇÃO INTELIGENTE POR ORIENTAÇÃO (Mídias Wide vs Tall):
                // Particiona itens contíguos de mesmo tipo (mídias wide: vídeos e fotos horizontais vs fotos verticais).
                // - Corridas de mídia wide ficam no seu grid de 2 colunas amplas (50% cada).
                // - Corridas de fotos verticais ficam no seu grid de 3 colunas em True Masonry contínuo!
                // Isso elimina 100% os buracos vazios e garante que fotos horizontais tenham tamanho nobre.
                const subRuns = [];
                let currentType = null;
                let curSub = [];
                items.forEach(it => {
                    const isW = it.blocks ? it.blocks.some(isWideMedia) : false;
                    const type = isW ? 'wide' : 'tall';
                    if (type !== currentType) {
                        if (curSub.length) subRuns.push(curSub);
                        curSub = [];
                        currentType = type;
                    }
                    curSub.push(it);
                });
                if (curSub.length) subRuns.push(curSub);

                subRuns.forEach(sub => {
                    const subUngri = []; sub.forEach(it => { if (it.blocks) subUngri.push.apply(subUngri, it.blocks); });
                    mountSubRun(sub, subUngri);
                });
            };
            Array.from(parent.childNodes).forEach(node => {
                if (node.nodeType === 3) { if (node.textContent.trim()) flush(); return; }   // texto real → quebra a run; whitespace → mantém
                if (node.nodeType !== 1) return;
                if (/^(BR|SCRIPT|STYLE|NOSCRIPT|META|LINK|TEMPLATE)$/i.test(node.tagName)) return;   // separador ou metadados sem impacto visual → mantém a run
                if (node.classList && node.classList.contains('auto-image-grid')) { run.push({ grid: node }); return; }   // grid existente
                if (flowMap.has(node)) { run.push({ flow: node, blocks: flowMap.get(node) }); return; }   // mídia ainda não gridada
                flush();   // card/parágrafo/qualquer outro elemento → quebra a run (preserva o contexto texto↔mídia)
            });
            flush();
        });
        mergeAdjacentGrids(scope);
    }
    // Resize/rotation changes fluid column widths automatically. Only crossing the mobile/desktop
    // breakpoint changes the column count, so existing grids need a new classification then.
    let masonryResizeBound = false, masonryBucket = -1;
    function bindMasonryResize() {
        if (masonryResizeBound) return;
        masonryResizeBound = true;
        masonryBucket = gridCols();
        let t;
        window.addEventListener('resize', () => {
            clearTimeout(t);
            t = setTimeout(() => {
                const b = gridCols();
                if (b === masonryBucket) return;   // mesma faixa → o RO já cuida da largura
                masonryBucket = b;
                document.querySelectorAll('.auto-image-grid').forEach(relayoutGrid);   // recalculate columns + orphan alignment
            }, 200);
        }, { passive: true });
        if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined' && document.documentElement) {
            let dockWasOn = document.documentElement.classList.contains('smg-aldock-on');
            const mo = new MutationObserver(() => {
                const dockIsOn = document.documentElement.classList.contains('smg-aldock-on');
                if (dockIsOn !== dockWasOn) {
                    dockWasOn = dockIsOn;
                    const b = gridCols();
                    if (b !== masonryBucket) {
                        masonryBucket = b;
                        document.querySelectorAll('.auto-image-grid').forEach(relayoutGrid);
                    }
                }
            });
            mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        }
    }
    function buildPostGalleries(roots) {
        if (!document.documentElement.classList.contains('smg-masonry-on')) return;   // só com a Galeria ligada
        bindMasonryResize();
        roots.forEach(r => {
            if (!r || !r.querySelectorAll) return;
            const innerGrids = (r.matches && r.matches('.auto-image-grid'))
                ? r.querySelectorAll('.auto-image-grid')
                : r.querySelectorAll('.auto-image-grid .auto-image-grid');
            innerGrids.forEach(innerGrid => {
                const outer = innerGrid.parentElement;
                if (!outer) return;
                while (innerGrid.firstChild) {
                    outer.insertBefore(innerGrid.firstChild, innerGrid);
                }
                innerGrid.remove();
                relayoutGrid(outer);
            });
        });
        // gate barato (data-smg-galseen marca cada item 1x → steady-state ~0). Escopo = CORPO do post (.message-userContent)
        // inteiro, NÃO só dentro do .bbWrapper: no SMG nosso embed às vezes entra como IRMÃO do .bbWrapper (fora dele) e ficava de fora.
        // corpo do post = .message-userContent · comentário (profile post / SMG) = .comment-body
        // Seletores diretos de mídia — busca indexada rápida sem caminhar 20 combinações descendentes
        const mediaSelector = 'img.bbImage:not([data-smg-galseen]), .generic2wide-iframe-div:not([data-smg-galseen]), .smg-dm-wrap:not([data-smg-galseen]), span[data-s9e-mediaembed]:not([data-smg-galseen]), iframe[src*="imagepond.net"]:not([data-smg-galseen])';
        const bodies = new Set();
        eachIn(roots, mediaSelector, el => {
            el.dataset.smgGalseen = '1';
            if (el.closest('.bbCodeQuote, .message-signature')) return;
            const b = el.closest('.bbCodeSpoiler-content, .bbCodeBlock--spoiler .bbCodeBlock-content, .message-userContent, .comment-body');
            if (b) {
                const post = b.closest('article.message, .message--post') || b;
                if (document.readyState !== 'complete' && document.readyState !== 'interactive') {
                    if (!post.querySelector('.js-selectToQuoteEnd, .message-footer, .message-actionBar, .message-cell--user')) {
                        delete el.dataset.smgGalseen;
                        return;
                    }
                }
                bodies.add(b);
            }
        });
        bodies.forEach(buildPostGallery);
        // Marcação de prontidão das galerias nos posts processados (para sincronismo com o paint gate)
        roots.forEach(r => {
            if (!r || !r.querySelectorAll) return;
            const ps = (r.matches && r.matches('article.message, .message--post')) ? [r] : r.querySelectorAll('article.message, .message--post');
            ps.forEach(p => { p.dataset.smgGalReady = '1'; });
        });
    }

    if (typeof window !== 'undefined' && window.__TEST_MODE__) {
        window.buildPostGalleries = buildPostGalleries;
        window.__buildPostGalleries = buildPostGalleries;
        window.__masonryExports = { isWideMedia, extractMediaDimensions, blockRelH, getEffectiveWidth, gridCols, gridColsFor, relayoutGrid, bindMasonryResize, goonboxViewer, goonboxResolve, gbxCache, gbxInflight, gbxTasks, processOneImage, processImages, goonboxEmbed, hasTextBetweenMedia, isTextPost: hasTextBetweenMedia, unwrapEmptyMediaFormatting, mergeAdjacentGrids };
        window.processOneImage = processOneImage;
        window.processImages = processImages;
        window.goonboxEmbed = goonboxEmbed;
    }
