    // =========================================================
    // FEATURE: player nativo de RedGifs (substitui o iframe por <video> com o mp4 da API — reaproveitado do reddit.js)
    // À PROVA DE FALHA: qualquer erro (sem GM / API / blob) RESTAURA o embed nativo (iframe). Nunca deixa buraco.
    //
    // Mapa interno (ver "PIPELINE DE VÍDEO" no índice do topo do arquivo):
    //   API redgifs .. GMX · rgIdFrom · gmGetJSON · rgToken · rgVideo (id → urls.hd/sd + poster)
    //   infra ........ rgBlob · getRgLoadIO/getRgPlayIO · rgTasks (fila por viewport, máx 3) · rgHost/rgDirect
    //   carga ........ rgLoad → rgViaDirect (streaming) | rgViaBlob (download) · rgRestore (falha → iframe)
    //   player UI .... rgBuild · rgControls (controles próprios) · rgStart · buildNativeVideo
    //   aplica ....... applyRedgifsPlayer (loaders/iframes do fórum → nosso player) · rgHidePlaceholder
    // =========================================================
    const GMX = (typeof GM_xmlhttpRequest === 'function') ? GM_xmlhttpRequest
              : (typeof GM !== 'undefined' && GM.xmlHttpRequest ? GM.xmlHttpRequest.bind(GM) : null);

    function rgIdFrom(s) {   // id do redgifs em qualquer url (/ifr/ /watch/ /gifs/ /i/)
        const m = (s || '').match(/redgifs\.com\/(?:ifr|watch|gifs|i)\/([A-Za-z0-9]+)/i);
        return m ? m[1] : null;
    }
    function gmGetJSON(url, headers) {
        return new Promise((resolve, reject) => {
            if (!GMX) { reject(new Error('no GM_xmlhttpRequest')); return; }
            GMX({ method: 'GET', url, headers: headers || {}, timeout: 12000,
                onload: r => { if (r.status >= 200 && r.status < 300) { try { resolve(JSON.parse(r.responseText)); } catch (e) { reject(e); } } else reject(new Error('HTTP ' + r.status)); },
                onerror: () => reject(new Error('neterror')), ontimeout: () => reject(new Error('timeout')) });
        });
    }
    let rgTok = null, rgTokAt = 0, rgTokP = null;
    function rgToken() {   // token temporário (~reuso 50min). Dedup: N redgifs ao mesmo tempo reusam UM fetch (evita rate-limit)
        if (rgTok && (Date.now() - rgTokAt) < 3e6) return Promise.resolve(rgTok);
        if (rgTokP) return rgTokP;
        rgTokP = gmGetJSON('https://api.redgifs.com/v2/auth/temporary').then(j => {
            rgTokP = null; rgTok = j && j.token; rgTokAt = Date.now();
            if (!rgTok) throw new Error('no token');
            return rgTok;
        }, e => { rgTokP = null; throw e; });
        return rgTokP;
    }
    const RG_CACHE_MAX = 128;
    const RG_POSTER_CACHE_MAX = 48;
    const rgCache = new Map();
    const rgPosterCache = new Map();
    const rgVideoInflight = new Map();
    function rgCacheSet(cache, key, value, limit) {
        limit = limit || (cache === rgPosterCache ? RG_POSTER_CACHE_MAX : RG_CACHE_MAX);
        if (cache.has(key)) cache.delete(key);
        cache.set(key, value);
        while (cache.size > limit) cache.delete(cache.keys().next().value);
        return value;
    }
    function rgVideo(id) {
        const key = id.toLowerCase();
        if (rgCache.has(key)) return Promise.resolve(rgCache.get(key));
        if (rgVideoInflight.has(key)) return rgVideoInflight.get(key);
        const pending = rgToken()
            .then(tok => gmGetJSON('https://api.redgifs.com/v2/gifs/' + key, { Authorization: 'Bearer ' + tok }))
            .then(j => {
                const gif = j && j.gif, u = gif && gif.urls;
                if (!u || !(u.hd || u.sd)) throw new Error('no urls');
                // poster SEMPRE: api → senão constrói do id em CamelCase (gif.id) — padrão media.redgifs.com/{Id}-poster.jpg
                const poster = u.poster || u.thumbnail || (gif.id ? 'https://media.redgifs.com/' + gif.id + '-poster.jpg' : '');
                return rgCacheSet(rgCache, key, { hd: u.hd || u.sd, sd: u.sd || u.hd, poster: poster, w: gif.width || 0, h: gif.height || 0 }, RG_CACHE_MAX);
            });
        const result = pending.finally(() => rgVideoInflight.delete(key));
        rgVideoInflight.set(key, result);
        return result;
    }
    function rgBlob(url, referer) {   // baixa o mp4 forjando o Referer do host → fura hotlink/CORS (<video> direto às vezes dá tela preta)
        const ref = referer || 'https://www.redgifs.com/';
        return new Promise((resolve, reject) => {
            if (!GMX) { reject(new Error('no GMX')); return; }
            GMX({ method: 'GET', url, responseType: 'blob', timeout: 30000, headers: { Referer: ref, Origin: ref.replace(/\/$/, '') },
                onload: r => {
                    if (!(r.status >= 200 && r.status < 300) || !r.response) { reject(new Error('HTTP ' + r.status)); return; }
                    // 200 NÃO garante vídeo: host com anti-hotlink/anti-bot responde 200 com uma PÁGINA HTML.
                    // Esse blob vira src de um <video> que não decodifica nada — e o skeleton girava pra sempre.
                    const t = (r.response.type || '').toLowerCase();
                    if (/^(text|application\/(x?html|json))/.test(t) || r.response.size < 1024) { reject(new Error('not video: ' + (t || '?') + ' ' + r.response.size + 'B')); return; }
                    resolve(r.response);
                },
                onerror: () => reject(new Error('neterror')), ontimeout: () => reject(new Error('timeout')) });
        });
    }

    const rgBlobs = [];   // LRU dos objectURLs (libera memória; o vídeo recarrega ao revisitar)
    const rgLiveVideos = new Set();   // todos os <video> smg-rg-v vivos — rgSolo muta os outros sem varrer o doc
    let rgLoadIO = null;
    function getRgLoadIO() {   // PREPARO: ~2 telas antes da viewport, enfileira (rgTasks, máx 3) só o POSTER do redgifs (rgPrepare — sem baixar vídeo). O play (rgLoad) é no clique.
        // 200% (era 100%): o poster precisa resolver a API ANTES de aparecer, senão rolando rápido a capa
        // chega depois do vídeo já estar na tela. A fila (máx 3) segura a rajada.
        return rgLoadIO || (rgLoadIO = makeLazyIO(el => { if (!el.dataset.rgLoaded && !el.dataset.rgPrepared) rgEnqueue(() => rgPrepare(el), el); }, { rootMargin: '200% 0px' }));
    }
    function rgAutoOK(v) { return !(v.duration > 60) || v._rgUserPlayed; }   // vídeo >1min NÃO toca sozinho (só no clique); curto (gif/loop) autoplay normal
    function getRgPlayIO() { return { observe: () => {}, unobserve: () => {} }; }
    // só um com áudio: muta os OUTROS players vivos. O Set self-poda nós detached → sem querySelectorAll no doc a cada play/unmute.
    function rgSolo(video) { rgLiveVideos.forEach(o => { if (!o.isConnected) rgLiveVideos.delete(o); else if (o !== video) o.muted = true; }); }
    // libera os objectURLs dos vídeos que saíram do DOM (ex.: ao fechar o feed) — senão os ≤6 blobs ficam até a próxima evicção da LRU.
    function rgReleaseDetachedBlobs() {
        for (let i = rgBlobs.length - 1; i >= 0; i--) {
            const e = rgBlobs[i];
            if (!e.video || !e.video.isConnected) { try { URL.revokeObjectURL(e.url); } catch (x) {} rgBlobs.splice(i, 1); }
        }
    }

    let rgSpeedGlobalBound = false;
    function bindRgSpeedGlobal() {
        if (rgSpeedGlobalBound) return;
        rgSpeedGlobalBound = true;
        document.addEventListener('keydown', e => {
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
            if (e.key !== '>' && e.key !== '<' && !(e.shiftKey && (e.key === '.' || e.key === ','))) return;
            const activeWrap = document.querySelector('.smg-rgc-wrap:hover, .smg-rgc-wrap:focus-within, .smg-feed-slide.active .smg-rgc-wrap, .smg-rg:hover, .smg-rg:focus-within, .smg-feed-slide.active .smg-rg');
            if (!activeWrap) return;
            const v = activeWrap.querySelector('video.smg-rg-v');
            if (!v) return;
            e.preventDefault(); e.stopPropagation();
            const cur = v.playbackRate || 1;
            const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
            if (e.key === '>' || (e.key === '.' && e.shiftKey)) {
                const next = SPEEDS.find(s => s > cur + 0.05) || SPEEDS[SPEEDS.length - 1];
                v.playbackRate = next;
                if (typeof toast === 'function') toast(next + 'x');
            } else {
                const prev = [...SPEEDS].reverse().find(s => s < cur - 0.05) || SPEEDS[0];
                v.playbackRate = prev;
                if (typeof toast === 'function') toast(prev + 'x');
            }
        });
    }

    // FILA: serializa o carregamento (rgLoad/rgLoadUrl) em máx RG_MAX_CONCURRENT. O streaming direto libera o slot no
    // metadata (rápido); o blob segura o slot o download inteiro — por isso o inline-autoplay-off adia o blob (deferBlob).
    // Era FIFO puro: quem entrou primeiro (= mais ACIMA na página) ganhava o slot mesmo com o usuário já lá embaixo.
    // Agora a ordem sai da makeTaskQueue, recalculada por distância da viewport a cada slot livre → passa a
    // carregar a partir de onde o usuário está. Por isso todo rgEnqueue passa o <video>/elemento como âncora.
    const RG_MAX_CONCURRENT = 3;   // máx de vídeos carregando ao mesmo tempo (2 serializava demais a fila → "demora muito no próximo lote")
    const rgTasks = makeTaskQueue(RG_MAX_CONCURRENT);
    function rgEnqueue(fn, el) { rgTasks.push(fn, el); }

    function rgPlayIfVisible(video, wrap) {
        // NÃO tira o skeleton aqui (isso é no 'loadeddata', quando há frame). Aqui só decide o autoplay.
        if (!video._rgInFeed && !video._rgUserPlayed) return;   // INLINE não-clicado: só prepara, NÃO toca (autoplay off). Feed (_rgInFeed) ou já-clicado (_rgUserPlayed) → toca.
        if (!rgAutoOK(video)) return;   // >1min → não autoplay
        const rect = video.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < (window.innerHeight || 0)) { const p = video.play(); if (p && p.catch) p.catch(() => {}); }
    }

    // O reddit.js baixa o mp4 INTEIRO em blob só pra DE-TAINT (normalizar áudio via Web Audio) — feature que NÃO temos.
    // Logo: streaming DIRETO (toca enquanto baixa = instantâneo). Os hosts bloqueiam hotlink por Referer → usamos
    // referrerPolicy=no-referrer. Se der tela-preta/erro, cai pro blob (Referer forjado). rgDirect memoriza POR HOST
    // (redgifs e turbo têm hotlink diferente → não pode ser um flag só).
    const rgDirect = {};   // host → true (streaming direto funciona) | false (precisa de blob) | undefined (desconhecido)
    function rgHost(url) { try { return new URL(url, location.href).hostname.split('.').slice(-2).join('.'); } catch (e) { return '?'; } }

    // INLINE com autoplay off (não-feed, não-clicado): NÃO baixa o blob (mp4 INTEIRO) à toa — isso segurava o slot da
    // fila (rgTasks) o download todo e fazia o "próximo lote demorar muito" + pesava a página. Guarda a URL e adia pro
    // play; mostra o estado PRONTO (.smg-rg-ready = poster/preto + play central fixo, SEM spinner). No play, o toggle()
    // baixa via rgViaBlob com a URL guardada. (O bug antigo da "caixa preta" era faltar o .smg-rg-ready: tirava o
    // skeleton e ficava preto sem affordance — agora mostra o play. Feed e tiles clicados baixam de verdade na hora.)
    function deferBlob(video, url, wrap) {
        if (video._rgInFeed || video._rgUserPlayed) return false;   // feed / já clicado → baixa o blob de verdade agora
        if (video._rgSource === 'Turbo' || video._rgSource === 'Saint' || /turbocdn\.st/i.test(url) || (!video.poster && !video.dataset.rgid)) return false;
        video._rgDeferUrl = url;                                     // guarda a URL; o toggle() baixa no clique
        if (wrap) { wrap.classList.remove('smg-rg-loading'); wrap.classList.add('smg-rg-ready'); }
        return true;
    }

    // INLINE (autoplay-off): PREPARA só o poster + aspect REAL via API — SEM baixar nenhum byte de vídeo. O <video> fica
    // sem src até o clique (toggle → rgLoad). RedGifs tem poster + dimensões na API → preview rico e aspect certo (zero
    // CLS) de graça, e nenhum stream de metadata por vídeo na tela. (turbo/saint NÃO têm dimensões na API → seguem no
    // metadata leve, senão a caixa viria 16:9 e pularia pro aspect real no play.)
    // POSTER do redgifs via GM (blob): o media.redgifs.com/{Id}-poster.jpg é referer-locked (403 com o referer do fórum) E o
    // <video poster> NÃO respeita o referrerPolicy do elemento → tentamos o blob com Referer redgifs, mantendo a URL direta como fallback.
    // PROPORÇÃO PLAUSÍVEL: a API às vezes devolve as dimensões de um SPRITE de miniaturas (visto:
    // 11956x480, ~25:1) em vez das do vídeo. Aplicar isso na caixa transformava o player numa tarja
    // preta de ~20px de altura no meio do post. Vídeo real vive entre retrato 9:21 e ultrawide 21:9;
    // fora dessa faixa a medida não é do vídeo → mantém o 16/9 do CSS e deixa o object-fit resolver.
    function rgAspect(wrap, w, h) {
        if (!wrap || !w || !h) return false;
        const r = w / h;
        if (!(r > 0.3 && r < 2.8)) return false;
        wrap.style.aspectRatio = w + ' / ' + h;
        wrap.style.setProperty('--smg-rg-ratio', String(r));
        const isVertical = (h / w) >= 0.9;
        wrap.classList.toggle('smg-rg-vert', isVertical);
        wrap.classList.toggle('smg-rg-wide', !isVertical);
        // Quando o teto de altura é atingido, reduz a largura do wrapper na mesma proporção.
        // Em masonry o !important da regra geral de coluna é sobrescrito apenas neste player real.
        const maxWidth = 'min(1400px, ' + (SMG_MEDIA_MAX_VH * r).toFixed(4) + 'vh)';
        if (wrap.closest && wrap.closest('.auto-image-grid')) wrap.style.setProperty('max-width', 'min(100%, ' + (SMG_MEDIA_MAX_VH * r).toFixed(4) + 'vh)', 'important');
        else wrap.style.maxWidth = maxWidth;
        return true;
    }
    function rgSetPoster(video, url) {
        if (!video || !url) return;
        const key = (video.dataset.rgid || '').toLowerCase();
        const cached = key && rgPosterCache.get(key);
        if (cached) {
            rgApplyCachedPoster(video, key, cached);
            video._rgPosterFallback = false;
            return;
        }

        // A URL direta é um fallback visual síncrono. O blob via GM continua sendo tentado para
        // contornar hotlink, mas nunca pode deixar a capa preta enquanto a requisição está pendente.
        if (!video.poster) {
            video.poster = url;
            video._rgPosterFallback = true;
        }
        if (!GMX || (!video._rgPosterFallback && !video._rgPosterUrl)) return;   // sem GM, mantém o fallback direto
        if (video._rgPosterPendingUrl === url) return;                            // evita requests duplicadas (rgPrepare → rgLoad)

        video._rgPosterPendingUrl = url;
        rgBlob(url).then(b => {
            if (video._rgPosterPendingUrl !== url) return;
            video._rgPosterPendingUrl = null;
            rgCacheSet(rgPosterCache, key, { blob: b }, RG_POSTER_CACHE_MAX);
            if (!video.isConnected) return;
            try {
                rgApplyPosterBlob(video, key, b);
                video._rgPosterFallback = false;
            } catch (e) {}   // o fallback direto continua visível
        }, () => {
            if (video._rgPosterPendingUrl === url) video._rgPosterPendingUrl = null;
        });   // GM falhou → mantém o fallback direto
    }
    function rgReleasePosterUrl(video) {
        if (!video || !video._rgPosterUrl) return;
        try { URL.revokeObjectURL(video._rgPosterUrl); } catch (e) {}
        video._rgPosterUrl = null;
        video._rgPosterCacheKey = null;
    }
    function rgApplyPosterBlob(video, key, blob) {
        rgReleasePosterUrl(video);
        const objectUrl = URL.createObjectURL(blob);
        video.poster = video._rgPosterUrl = objectUrl;
        video._rgPosterCacheKey = key;
        return objectUrl;
    }
    function rgApplyCachedPoster(video, key, cached) {
        if (!cached) return false;
        if (video._rgPosterCacheKey === key && video._rgPosterUrl) return true;
        if (cached.blob) { rgApplyPosterBlob(video, key, cached.blob); return true; }
        if (cached.url) { video.poster = cached.url; return true; }
        return false;
    }
    async function rgPrepare(video) {
        if (!video || video.dataset.rgLoaded || video.dataset.rgPrepared || !video.dataset.rgid) return;
        video.dataset.rgPrepared = '1';
        const rgidKey = (video.dataset.rgid || '').toLowerCase();
        const cachedPoster = rgPosterCache.get(rgidKey);
        if (cachedPoster && !video.poster) {
            rgApplyCachedPoster(video, rgidKey, cachedPoster);
        } else if (!video.poster) {
            // FAST PATH: tenta carregar o poster direto por URL construída (sem esperar API)
            const fastPosterUrl = 'https://media.redgifs.com/' + video.dataset.rgid.charAt(0).toUpperCase() + video.dataset.rgid.slice(1) + '-poster.jpg';
            rgSetPoster(video, fastPosterUrl);  // fallback direto imediato; blob melhora a capa quando chegar
        }
        const wrap = video.closest('.smg-rg');
        let r;
        try { r = await rgVideo(video.dataset.rgid); }
        catch (e) {
            // gif MORTO (sem urls / 404 / 410 / 403) → "RedGifs unavailable" NA HORA (não fica em spinner pra sempre).
            // transiente (rede / 429 / 5xx / timeout) → re-tenta com backoff; após 3 falhas, desiste e mostra o erro.
            const msg = (e && e.message) || '';
            const tries = (+video.dataset.rgTries || 0) + 1; video.dataset.rgTries = String(tries);
            if (/no urls|HTTP 4(0[34]|10)/i.test(msg) || tries >= 3) { rgRestore(video, true); return; }
            video.dataset.rgPrepared = '';
            setTimeout(() => { if (video.isConnected && !video.dataset.rgPrepared && !video.dataset.rgLoaded) rgEnqueue(() => rgPrepare(video), video); }, 1500 * tries);
            return;
        }
        if (!video.isConnected) return;
        const cached = rgPosterCache.get((video.dataset.rgid || '').toLowerCase());
        if (cached && !video.poster) {
            rgApplyCachedPoster(video, (video.dataset.rgid || '').toLowerCase(), cached);
        } else if (r.poster) {
            rgSetPoster(video, r.poster);
        }
        if (wrap) rgAspect(wrap, r.w, r.h);
        if (wrap) { wrap.classList.remove('smg-rg-loading'); wrap.classList.add('smg-rg-ready'); }   // poster + play central, sem spinner
    }

    async function rgLoad(video) {
        if (!video || video.dataset.rgLoaded || !video.dataset.rgid) return;
        video.dataset.rgLoaded = '1';
        const wrap = video.closest('.smg-rg');
        if (wrap) wrap.classList.add('smg-rg-loading');
        let r;
        try { r = await rgVideo(video.dataset.rgid); }
        catch (e) {
            const msg = (e && e.message) || '';
            console.warn('[smg-rg] API redgifs falhou:', video.dataset.rgid, msg);
            // gif MORTO (API sem urls, ou 404/410/403) → placeholder limpo (o iframe do redgifs só mostraria "Error loading this gif").
            // erro transitório (rede/429/5xx) → iframe nativo (pode recuperar).
            rgRestore(video, /no urls|HTTP 4(0[34]|10)/i.test(msg));
            return;
        }
        if (!video.isConnected) return;   // removido (ex.: navegou no feed) durante o fetch da API → não monta src/blob num nó detached
        const cached = rgPosterCache.get((video.dataset.rgid || '').toLowerCase());
        if (cached && !video.poster) {
            rgApplyCachedPoster(video, (video.dataset.rgid || '').toLowerCase(), cached);
        } else if (r.poster) {
            rgSetPoster(video, r.poster);
        }
        if (wrap) rgAspect(wrap, r.w, r.h);   // proporção REAL (se for plausível)
        const pick = video._rgSd ? r.sd : r.hd;   // post = SD (menor/rápido); feed = HD
        video._rgUrl = pick;   // guarda a URL resolvida → botão de download
        if (rgDirect[rgHost(pick)] === false) {   // host precisa de blob (download inteiro, pesado)
            if (deferBlob(video, pick, wrap)) return;   // INLINE autoplay-off: adia pro play (não trava a fila baixando o mp4 inteiro à toa)
            return rgViaBlob(video, pick, wrap);
        }
        return rgViaDirect(video, pick, wrap);                                        // streaming direto (rápido)
    }

    // mesma URL ignorando o fragmento: `arquivo.mp4` e `arquivo.mp4#t=0.1` são O MESMO arquivo
    function rgSameFile(a, b) {
        try { const x = new URL(a, location.href), y = new URL(b, location.href); x.hash = ''; y.hash = ''; return x.href === y.href; } catch (e) { return false; }
    }
    function rgViaDirect(video, url, wrap) {   // STREAMING progressivo (no-referrer) — começa a tocar em ~1s, sem baixar tudo
        const host = rgHost(url);
        // O ARQUIVO JÁ ESTÁ CARREGADO/CARREGANDO AQUI: a thumb do 1º frame (mídia direta/fileditch) usa esta
        // MESMA URL com '#t=0.1'. Reatribuir o src dispara abort+emptied e recomeça o download do ZERO,
        // jogando fora tudo o que a thumb já baixou — em arquivo grande isso é o play que "nunca acontece",
        // só spinner. Se já temos metadata, o acesso está provado: é só tocar.
        // ...desde que a carga anterior esteja viva: com erro (video.error) ou sem fonte (networkState 3)
        // não há nada pra aproveitar, e esperar o watchdog seria travar 8s à toa — reatribui e tenta.
        const already = !!video.currentSrc && rgSameFile(video.currentSrc, url) && !video.error && video.networkState !== 3;
        if (already && video.readyState >= 1 && video.videoWidth > 0) {   // 0x0 = decodificou nada → segue o caminho normal (probe + blob)
            rgDirect[host] = true;
            if (wrap) wrap.classList.remove('smg-rg-loading', 'smg-rg-ready');   // sem novo loadeddata/canplay, o clearSkel não roda → tira o skeleton aqui
            rgPlayIfVisible(video, wrap);
            return Promise.resolve();
        }
        return new Promise(resolve => {
            let settled = false;
            const cleanup = () => { video.removeEventListener('loadedmetadata', onData); video.removeEventListener('error', onErr); clearTimeout(wd); };
            const ok = () => { if (settled) return; settled = true; rgDirect[host] = true; cleanup(); rgPlayIfVisible(video, wrap); resolve(); };
            // hard = falha REAL (erro/0x0) → memoriza que o host precisa de blob (próximos vão direto pro blob, sem perder tempo no probe).
            // soft = só timeout de rede lenta → cai pro blob SÓ neste vídeo, sem condenar o host inteiro: 1 vídeo lento não vira sessão toda em full-download.
            const toBlob = hard => { if (settled) return; settled = true; if (hard) rgDirect[host] = false; cleanup(); try { video.removeAttribute('src'); video.load(); } catch (x) {} if (deferBlob(video, url, wrap)) { resolve(); return; } rgViaBlob(video, url, wrap).then(resolve); };
            const onData = () => { if (video.videoWidth > 0) ok(); else toBlob(true); };
            const onErr = () => toBlob(true);
            video.addEventListener('loadedmetadata', onData, { once: true });   // metadata basta p/ confirmar acesso + pegar duração/proporção
            video.addEventListener('error', onErr, { once: true });
            // no fim do prazo, se já HÁ metadata (o loadedmetadata veio antes de a gente escutar), resolve como sucesso
            // em vez de ficar pendurado pra sempre — pendurado = spinner eterno, que é como o bug aparece.
            const wd = setTimeout(() => { if (video.readyState >= 1) ok(); else toBlob(false); }, rgDirect[host] === true ? 15000 : 8000);   // tolerante: o 206 funciona; só cai pro blob (que é + lento) em lentidão EXTREMA. Erro real cai na hora pelo onErr.
            if (already) { video.preload = 'metadata'; return; }   // MESMO arquivo já baixando (a thumb) → deixa terminar; reatribuir o src reiniciaria do zero
            if (video._rgKeepRef) video.referrerPolicy = video._rgKeepRef;
            else if (video.dataset.rgid) video.referrerPolicy = 'no-referrer';   // host referer-locked (imagepond): preserva o referer da origem (senão 403); redgifs = no-referrer; outros (turbo/saint) = referer padrão do navegador
            video.preload = 'metadata';   // só metadata (não baixa o vídeo inteiro à toa — economiza banda em vídeo longo); toca/bufferiza no play
            video.src = url;
        });
    }

    function rgViaBlob(video, url, wrap) {   // baixa o mp4 inteiro (Referer forjado) — confiável mas sem streaming. Já roda DENTRO do slot do rgLoad (não enfileira de novo: daria deadlock).
        if (wrap) { wrap.classList.add('smg-rg-loading'); rgArmStall(video, wrap); }
        return rgBlob(url, video._rgRef).then(blob => {
            if (!video.isConnected) return;   // detached durante o download (ex.: navegou no feed) → não cria objectURL órfão
            const u = URL.createObjectURL(blob);
            rgBlobs.push({ url: u, video });
            // LRU: evicta o objectURL mais antigo que NÃO está tocando — revogar/limpar um vídeo em loop visível o apagaria na cara do usuário
            while (rgBlobs.length > 6) {
                const idx = rgBlobs.findIndex(e => e.video !== video && (!e.video || e.video.paused));
                if (idx < 0) break;   // todos os outros estão tocando → deixa passar de 6 por ora (eviccionam quando pausarem)
                const old = rgBlobs.splice(idx, 1)[0];
                try { URL.revokeObjectURL(old.url); } catch (x) {}
                if (old.video) { old.video.removeAttribute('src'); old.video.load(); old.video.dataset.rgLoaded = ''; }
            }
            video.referrerPolicy = '';
            // blob que NÃO decodifica (ex.: o host devolveu HTML com 200) não dispara mais nada: sem este
            // handler o skeleton ficava girando pra sempre com um src blob: já setado.
            video.addEventListener('error', () => { try { URL.revokeObjectURL(u); } catch (x) {} rgRestore(video); }, { once: true });
            video.src = u;
            rgPlayIfVisible(video, wrap);
        }).catch(() => {   // blob tbm falhou → último recurso: mp4 direto; se falhar, volta o iframe
            video.addEventListener('error', () => rgRestore(video), { once: true });
            if (video._rgKeepRef) video.referrerPolicy = video._rgKeepRef;
            else if (video.dataset.rgid) video.referrerPolicy = 'no-referrer';
            video.src = url;
            rgPlayIfVisible(video, wrap);
        });
    }
    // teardown COMPLETO de um player que vai sair do DOM (feed troca de slide / fecha / fallback):
    // pausa, solta o src (decoder/buffer), revoga poster blob + mp4 blob, desregistra dos 3 IOs e
    // tira do rgLiveVideos. Sem isto o feed acumulava um <video> ZUMBI por slide visitado (o Set só
    // se auto-podava dentro do rgSolo, que roda apenas em play COM som — sessão muda nunca podava).
    function rgDispose(video) {
        if (!video) return;
        try { video.pause(); } catch (e) {}
        if (rgLoadIO) rgLoadIO.unobserve(video);
        rgReleasePosterUrl(video);
        for (let i = rgBlobs.length - 1; i >= 0; i--) if (rgBlobs[i].video === video) { try { URL.revokeObjectURL(rgBlobs[i].url); } catch (e) {} rgBlobs.splice(i, 1); }
        if (video.getAttribute('src')) { video.removeAttribute('src'); try { video.load(); } catch (e) {} }
        rgLiveVideos.delete(video);
    }
    function rgRestore(video, dead) {
        const wrap = video.closest('.smg-rg'); if (!wrap) return;
        // todo branch abaixo tira o <video> do DOM → teardown completo primeiro,
        // senão o IO/Set retém o nó detached (vaza o elemento + decoder).
        rgDispose(video);
        // gif MORTO (redgifs): em vez do iframe que mostra "Error loading this gif", um placeholder discreto
        if (dead && video.dataset.rgid && !wrap._rgFallback) {
            // MESMA caixa do resto (buildDeadBox) — clicável, com o host. noProbe: a /watch/{id} do redgifs é SPA
            // e responde 200 mesmo com o gif apagado, então sondar ali só daria um "200 · indisponível" mentiroso.
            const ph = buildDeadBox('https://www.redgifs.com/watch/' + video.dataset.rgid, { media: true, noProbe: true });
            ph.classList.add('smg-rg-fail');   // outros passes usam a classe como marcador de "este embed já resolveu"
            if (wrap.parentNode) wrap.parentNode.insertBefore(ph, wrap);
            wrap.remove(); return;
        }
        if (wrap._rgFallback) { const fb = wrap._rgFallback; wrap.remove(); fb(); return; }   // turbo/saint → monta o iframe nativo
        if (wrap._rgIframe) { if (wrap.parentNode) wrap.parentNode.insertBefore(wrap._rgIframe, wrap); wrap._rgIframe.style.display = ''; wrap.remove(); return; }   // tínhamos REMOVIDO o iframe (parar o áudio) → recoloca no lugar
        const id = video.dataset.rgid;
        if (wrap._rgFeedHost && id) {   // feed/overlay → volta o iframe nativo do feed (com autoplay)
            const f = document.createElement('iframe');
            f.src = feedEmbedUrl('https://www.redgifs.com/ifr/' + id, true);
            f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
            f.allowFullscreen = true;
            wrap._rgFeedHost.appendChild(f);
            wrap.remove(); return;
        }
        const host = wrap._rgLoader;   // veio de um loader (sem iframe) → monta o iframe nativo do redgifs no lugar
        if (host && id) {
            const ifr = document.createElement('iframe');
            ifr.src = 'https://www.redgifs.com/ifr/' + id;
            ifr.setAttribute('allow', 'autoplay; fullscreen');
            ifr.allowFullscreen = true; ifr.loading = 'lazy';
            ifr.dataset.rgDone = '1';   // não re-processar
            host.appendChild(ifr);
        }
        wrap.remove();
    }
    function rgBuild(rgid) {   // <video> mudo+loop com NOSSOS controles (não o nativo do HTML5); autoplay só em vista; object-fit:contain
        const wrap = document.createElement('div'); wrap.className = 'smg-rg smg-rg-loading';   // skeleton já no build (escondido até o frame chegar)
        const video = document.createElement('video');
        video.className = 'smg-rg-v';
        video.loop = true; video.muted = true; video.playsInline = true; video.preload = 'none';   // SEM controls nativo
        video.referrerPolicy = 'no-referrer';   // o POSTER do redgifs (media.redgifs.com/{Id}-poster.jpg) é referer-locked: 403 com o referer do fórum, 200 sem → precisa estar setado ANTES de setar o poster (rgPrepare/rgLoad)
        video.dataset.rgid = rgid;
        video._rgSource = 'RedGifs';   // marca dágua da fonte (watermark no hover)
        rgLiveVideos.add(video);
        video._rgExt = 'https://www.redgifs.com/watch/' + rgid;   // botão "abrir em nova guia"
        video._rgFeed = 'https://www.redgifs.com/ifr/' + rgid;    // botão "abrir no visualizador" (bate com collectMediaFrom)
        wrap.appendChild(video);
        rgControls(wrap, video);   // play/pause + flash · progresso seekável · volume flyout · tempo · externo · visualizador · auto-hide
        return { wrap, video };
    }
    if (typeof window !== 'undefined' && window.__TEST_MODE__) {
        window.__redgifsExports = { rgBuild, rgSetPoster, rgCache, rgPosterCache, cacheSet: rgCacheSet, RG_CACHE_MAX, RG_POSTER_CACHE_MAX, rgDispose };
    }
    function rgFmt(t) {   // M:SS; ≥ 1h vira H:MM:SS (vídeo longo mostrava "160:19" em vez de "2:40:19")
        t = Math.max(0, t | 0);
        const h = t / 3600 | 0, m = (t / 60 | 0) % 60, s = t % 60, ss = (s < 10 ? '0' : '') + s;
        return h ? h + ':' + (m < 10 ? '0' : '') + m + ':' + ss : m + ':' + ss;
    }
    // nome do arquivo p/ o download: usa o ?fn= (turbo) ou o último segmento; senão genérico
    function rgDownloadName(url, source) {
        try { const u = new URL(url, location.href); const fn = u.searchParams.get('fn'); if (fn) return fn.replace(/[\\/:*?"<>|]+/g, '_'); const seg = decodeURIComponent((u.pathname.split('/').pop() || '')); if (/\.\w{2,5}$/.test(seg)) return seg; } catch (e) {}
        return (source || 'video').toLowerCase().replace(/[^a-z0-9]+/g, '') + '.mp4';
    }
    function rgControls(wrap, video) {   // controles próprios: play central + progresso embaixo + rail vertical (volume · overlay · tela cheia · externo)
        const mkAct = (icon, label, on) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'smg-rgc-act'; b.innerHTML = icon; b.title = i18n(label); b.setAttribute('aria-label', i18n(label)); b.addEventListener('click', on); return b; };
        const toggle = () => {
            if (!video.paused) { video.pause(); return; }
            video._rgUserPlayed = true;
            if (video._rgDeferUrl) {   // o blob foi adiado (inline autoplay-off) → baixa AGORA + toca (rgViaBlob → rgPlayIfVisible; _rgUserPlayed já é true)
                const u = video._rgDeferUrl; video._rgDeferUrl = null;
                wrap.classList.remove('smg-rg-ready'); wrap.classList.add('smg-rg-loading');
                rgViaBlob(video, u, wrap);
                return;
            }
            if (video._rgUrl && !video.dataset.rgLoaded) {   // turbo/saint preparado (só poster) → AGORA faz o stream + toca
                wrap.classList.remove('smg-rg-ready'); wrap.classList.add('smg-rg-loading');
                rgLoadUrl(video, video._rgUrl, wrap);
                return;
            }
            if (video.dataset.rgid && !video.dataset.rgLoaded) {   // redgifs preparado (só poster) → AGORA baixa o vídeo de verdade + toca (rgLoad → rgViaDirect/Blob → rgPlayIfVisible; _rgUserPlayed já é true)
                wrap.classList.remove('smg-rg-ready'); wrap.classList.add('smg-rg-loading');
                rgLoad(video);
                return;
            }
            const p = video.play(); if (p && p.catch) p.catch(() => {});
        };
        // Clique no wrap enquanto estiver em loading: força início do carregamento/play imediatamente
        wrap.addEventListener('click', e => {
            if (wrap.classList.contains('smg-rg-loading') && !e.target.closest('.smg-rgc-act, .smg-rgc-prog, .smg-rgc-volbar, .smg-rgc-speed')) {
                e.preventDefault(); e.stopPropagation();
                toggle();
            }
        });
        // SEEK ±5s + flash "« 5s" / "5s »"
        const sflash = document.createElement('div'); sflash.className = 'smg-rgc-seekflash';
        let sflashT;
        const seek = d => {
            if (!video.duration) return;
            video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + d));
            sflash.textContent = d < 0 ? '« 5s' : '5s »';
            sflash.classList.add('on'); clearTimeout(sflashT); sflashT = setTimeout(() => sflash.classList.remove('on'), 480);
        };
        // CLIQUE no vídeo: 1× = play/pause · 2× = ±5s (metade esquerda/direita). timer separa single de double-click.
        let clickT = null;
        video.addEventListener('click', e => {
            e.preventDefault(); e.stopPropagation();
            if (clickT) return;   // já há um clique pendente → este é o 2º (o dblclick cuida do seek)
            clickT = setTimeout(() => { clickT = null; toggle(); }, 230);
        });
        video.addEventListener('dblclick', e => {
            e.preventDefault(); e.stopPropagation();
            if (clickT) { clearTimeout(clickT); clickT = null; }   // cancela o play/pause pendente
            const r = video.getBoundingClientRect();
            seek((e.clientX - r.left) < r.width / 2 ? -5 : 5);
        });
        // CENTRO: play grande (só no pausado/pronto) — seek é por DUPLO-CLIQUE no vídeo (estilo YouTube)
        const flash = document.createElement('div'); flash.className = 'smg-rgc-flash';
        const playBtn = document.createElement('button'); playBtn.type = 'button'; playBtn.className = 'smg-rgc-play'; playBtn.setAttribute('aria-label', i18n('Play/Pause')); playBtn.innerHTML = ICONS.rgPlay;
        playBtn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); toggle(); });
        flash.appendChild(playBtn);
        // SCRUBBER (no topo da barra): buffer + preenchido + knob; seekável por drag
        const buf = document.createElement('div'); buf.className = 'smg-rgc-buf';
        const fill = document.createElement('div'); fill.className = 'smg-rgc-fill';
        const knob = document.createElement('div'); knob.className = 'smg-rgc-knob'; fill.appendChild(knob);
        const bar = document.createElement('div'); bar.className = 'smg-rgc-bar'; bar.append(buf, fill);
        const prog = document.createElement('div'); prog.className = 'smg-rgc-prog'; prog.appendChild(bar);
        // rect CACHEADO no pointerdown (não muda durante o drag): getBoundingClientRect por pointermove
        // forçava layout síncrono a cada move (o write do 'seeking'/fill suja o layout entre moves)
        const seekTo = (cx, r) => { if (!video.duration || !r.width) return; video.currentTime = Math.max(0, Math.min(1, (cx - r.left) / r.width)) * video.duration; };
        prog.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const r = bar.getBoundingClientRect(); seekTo(e.clientX, r); const mv = ev => seekTo(ev.clientX, r); const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); }; document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); });
        // TEMPO (atual / duração)
        const tEl = document.createElement('span'); tEl.className = 'smg-rgc-time'; tEl.textContent = '0:00';
        // PERF: escreve no text node (.data = characterData, que o observer global NÃO escuta). textContent
        // recriava o text node a cada timeupdate (~4Hz/vídeo) → mutação childList → processAll com dirtyRoots
        // vazio = FULL-SCAN do body a cada tick. Skip-if-same corta os ticks dentro do mesmo segundo.
        const syncTime = () => { const s = rgFmt(video.currentTime) + (video.duration ? ' / ' + rgFmt(video.duration) : ''); if (tEl.firstChild.data !== s) tEl.firstChild.data = s; };
        video.addEventListener('timeupdate', () => { if (video.duration) fill.style.width = (video.currentTime / video.duration * 100) + '%'; syncTime(); });
        video.addEventListener('loadedmetadata', syncTime);
        video.addEventListener('progress', () => { try { if (video.buffered.length && video.duration) buf.style.width = (video.buffered.end(video.buffered.length - 1) / video.duration * 100) + '%'; } catch (x) {} });
        // VOLUME: barra DIV (igual a de progresso, que SEMPRE renderiza — o <input range> vinha só como um PONTO).
        // Linha no canto inferior-ESQUERDO [mudo][======barra======], sempre visível no hover (sem flyout).
        const mute = mkAct(ICONS.volumeMute, 'Mute', e => { e.stopPropagation(); video.muted = !video.muted; if (!video.muted) { if (!video.volume) video.volume = 1; rgSolo(video); } syncVol(); });
        const volfill = document.createElement('div'); volfill.className = 'smg-rgc-volfill';
        const volbar = document.createElement('div'); volbar.className = 'smg-rgc-volbar'; volbar.setAttribute('role', 'slider'); volbar.setAttribute('aria-label', i18n('Volume')); volbar.appendChild(volfill);
        const volgrp = document.createElement('div');
        volgrp.className = 'smg-rgc-volgrp';
        volgrp.append(mute, volbar);
        const syncVol = () => { mute.innerHTML = (video.muted || !video.volume) ? ICONS.volumeMute : ICONS.volume; volfill.style.width = ((video.muted ? 0 : video.volume) * 100) + '%'; };
        const setVolFromX = (cx, r) => { if (!r.width) return; const v = Math.max(0, Math.min(1, (cx - r.left) / r.width)); video.volume = v; video.muted = (v === 0); if (v > 0) rgSolo(video); syncVol(); };
        volbar.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const r = volbar.getBoundingClientRect(); setVolFromX(e.clientX, r); const mv = ev => setVolFromX(ev.clientX, r); const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); }; document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); });
        // VELOCIDADE: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x (cicla no clique ou atalhos < e >)
        const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
        const speedBtn = document.createElement('button');
        speedBtn.type = 'button';
        speedBtn.className = 'smg-rgc-btn smg-rgc-speed';
        speedBtn.title = i18n('Playback speed');
        speedBtn.setAttribute('aria-label', i18n('Playback speed'));
        speedBtn.textContent = '1x';
        const setSpeed = rate => {
            video.playbackRate = rate;
            speedBtn.textContent = (rate === 1 ? '1x' : (rate + 'x'));
            speedBtn.classList.toggle('is-custom-speed', rate !== 1);
        };
        video.addEventListener('ratechange', () => {
            const cur = video.playbackRate || 1;
            speedBtn.textContent = (cur === 1 ? '1x' : (cur + 'x'));
            speedBtn.classList.toggle('is-custom-speed', cur !== 1);
        });
        speedBtn.addEventListener('click', e => {
            e.stopPropagation();
            const cur = video.playbackRate || 1;
            let nextIdx = SPEEDS.findIndex(s => Math.abs(s - cur) < 0.05) + 1;
            if (nextIdx >= SPEEDS.length || nextIdx < 0) nextIdx = 0;
            setSpeed(SPEEDS[nextIdx]);
        });
        bindRgSpeedGlobal();

        const upgradeToHd = () => {
            if (video.dataset.rgid && video._rgSd && rgCache.has(video.dataset.rgid.toLowerCase())) {
                const info = rgCache.get(video.dataset.rgid.toLowerCase());
                if (info && info.hd && info.hd !== video._rgUrl) {
                    const curT = video.currentTime;
                    const playing = !video.paused;
                    video._rgSd = false;
                    video._rgUrl = info.hd;
                    video.src = info.hd;
                    video.currentTime = curT;
                    if (playing) video.play().catch(() => {});
                }
            }
        };

        // rail: velocidade · download · visualizador · tela cheia
        const over = mkAct(ICONS.gallery, 'Open in viewer', e => { e.stopPropagation(); document.querySelectorAll('video.smg-rg-v').forEach(v => { try { v.pause(); } catch (x) {} }); if (video._rgFeed) { try { openMediaFeed(video._rgFeed); } catch (x) {} } });   // grid (galeria) ≠ cantos (fullscreen)
        over.classList.add('smg-rgc-over');   // escondido no feed (lá já É o visualizador) — ver CSS
        const fs = mkAct(ICONS.rgExpand, 'Fullscreen', e => {
            e.stopPropagation();
            try {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    wrap.requestFullscreen();
                    upgradeToHd();
                }
            } catch (x) {}
        });
        const dl = mkAct(ICONS.download, 'Download', e => { e.stopPropagation(); const u = video._rgUrl; if (u) smgDownload(u, rgDownloadName(u, video._rgSource)); else if (video._rgExt) window.open(video._rgExt, '_blank', 'noopener'); });
        // BARRA INFERIOR (YouTube): scrubber em cima + linha [play · volume · tempo ··· velocidade · download · visualizador · tela cheia]
        const barPlay = mkAct(ICONS.rgPlay, 'Play/Pause', e => { e.stopPropagation(); toggle(); }); barPlay.classList.add('smg-rgc-barplay');   // ícone PREENCHIDO → isenta do fill:none do #smg-feed
        const bottom = document.createElement('div'); bottom.className = 'smg-rgc-bottom';
        const row = document.createElement('div'); row.className = 'smg-rgc-row';
        const leftc = document.createElement('div'); leftc.className = 'smg-rgc-left'; leftc.append(barPlay, volgrp, tEl);
        const rightc = document.createElement('div'); rightc.className = 'smg-rgc-right'; rightc.append(speedBtn, dl, over, fs);
        row.append(leftc, rightc);
        bottom.append(prog, row);
        // FONTE + abrir EXTERNO num só: badge clicável no canto SUP-DIREITO ("Turbo ↗"). É a marca-dágua da fonte E o "abrir no host".
        const src = document.createElement('a'); src.className = 'smg-rgc-src'; src.target = '_blank'; src.rel = 'noopener noreferrer'; src.title = i18n('Open in new tab');
        src.innerHTML = '<span class="smg-rgc-src-t">' + (video._rgSource || '') + '</span>' + ICONS.rgExternal;
        const syncSrcHref = () => { if (video._rgExt) src.href = video._rgExt; };   // redgifs já tem _rgExt aqui; turbo/saint setam logo após o build → sincroniza no hover
        syncSrcHref(); src.addEventListener('pointerenter', syncSrcHref);
        src.addEventListener('click', e => { e.stopPropagation(); if (!video._rgExt) e.preventDefault(); });   // não dispara o play/pause do player; sem _rgExt → não navega
        // estado play/pause → classe (o CSS mostra/esconde o play central)
        video.addEventListener('play', () => { wrap.classList.add('smg-rgc-playing'); playBtn.innerHTML = ICONS.rgPause; barPlay.innerHTML = ICONS.rgPause; if (!video.muted) rgSolo(video); });
        video.addEventListener('pause', () => { wrap.classList.remove('smg-rgc-playing'); playBtn.innerHTML = ICONS.rgPlay; barPlay.innerHTML = ICONS.rgPlay; });
        video.addEventListener('volumechange', syncVol);
        // LOADING ao avançar/voltar: spinner por cima SÓ no SEEK do usuário (era o pedido). NÃO usa 'waiting':
        // vídeo PAUSADO + preload=metadata (inline, autoplay off) dispara 'waiting' no load mas NUNCA 'canplay'/'playing'
        // → dava spinner ETERNO. 'seeking' NÃO dispara no load (só quando o usuário muda o currentTime). Remoção redundante p/ garantir.
        video.addEventListener('seeking', () => wrap.classList.add('smg-rg-buffering'));
        ['seeked', 'canplay', 'playing', 'loadeddata', 'pause', 'suspend', 'error', 'abort'].forEach(ev => video.addEventListener(ev, () => wrap.classList.remove('smg-rg-buffering')));
        // SKELETON: revela o player só quando o vídeo TEM frame de verdade (loadeddata/canplay). Persistente (não 'once').
        const clearSkel = () => wrap.classList.remove('smg-rg-loading', 'smg-rg-ready');   // carregou de verdade → tira skeleton E o estado "pronto". MANTÉM o aspect-ratio: a caixa fica no aspect REAL (setado no metadata/API) → revela já no tamanho certo, sem "ajustar no play"
        video.addEventListener('loadeddata', clearSkel);
        video.addEventListener('canplay', () => { clearSkel(); wrap.classList.remove('smg-rg-buffering'); });
        wrap.append(flash, sflash, bottom, src);
        syncVol(); syncTime();
    }
    function rgStart(video, preferSd) {   // preferSd: post = SD (rápido); feed = HD
        video._rgSd = !!preferSd;
        const lio = getRgLoadIO();
        if (lio) lio.observe(video); else rgLoad(video);   // sem IO → carrega já
    }

    // ---- player nativo p/ um mp4 JÁ conhecido (turbo/saint via scrape): reusa rgControls + streaming direto→blob ----
    function buildNativeVideo(mp4Url, blobReferer, fallback, source) {
        const wrap = document.createElement('div'); wrap.className = 'smg-rg smg-rg-ready';   // pronto p/ exibir capa + play central desde o 1º frame
        const video = document.createElement('video'); video.className = 'smg-rg-v';
        video.loop = true; video.muted = true; video.playsInline = true; video.preload = 'none';
        video._rgRef = blobReferer || '';                 // Referer p/ o blob (host hotlink-protected)
        if (source) video._rgSource = source;             // marca dágua da fonte (watermark no hover)
        rgLiveVideos.add(video);
        if (fallback) wrap._rgFallback = fallback;         // falha total do vídeo → volta o iframe
        video.addEventListener('loadedmetadata', () => {
            if (video.videoWidth && video.videoHeight) rgAspect(wrap, video.videoWidth, video.videoHeight);
        });
        wrap.appendChild(video);
        rgControls(wrap, video);
        return { wrap, video };
    }
    // SPINNER NUNCA ETERNO: todo caminho de carga pode morrer calado (blob que não decodifica, host que
    // engoliu a request, promise que nunca resolve). Se em 25s não houver NENHUM frame, volta pro estado
    // PRONTO — play central de volta, com o link externo — e libera um novo clique pra tentar de novo.
    function rgArmStall(video, wrap) {
        if (!wrap || video._rgStallT) return;
        const done = () => {
            clearTimeout(video._rgStallT); video._rgStallT = null;
            ['loadeddata', 'canplay', 'error'].forEach(e => video.removeEventListener(e, done));
        };
        ['loadeddata', 'canplay', 'error'].forEach(e => video.addEventListener(e, done));
        video._rgStallT = setTimeout(() => {
            done();
            if (video.readyState >= 2 || !video.isConnected) return;   // tem frame (ou saiu do DOM) → nada a fazer
            wrap.classList.remove('smg-rg-loading', 'smg-rg-buffering');
            wrap.classList.add('smg-rg-ready');
            video.dataset.rgLoaded = '';                                // destrava: o próximo clique tenta de novo
        }, 25000);
    }
    function rgLoadUrl(video, url, wrap) {   // = rgLoad, mas com a URL pronta (sem a API do redgifs)
        if (!video || video.dataset.rgLoaded) return;
        video.dataset.rgLoaded = '1';
        if (wrap) { wrap.classList.add('smg-rg-loading'); rgArmStall(video, wrap); }
        if (rgDirect[rgHost(url)] === false) {   // host conhecido-blob
            if (deferBlob(video, url, wrap)) return;   // inline autoplay-off → adia o blob pro play
            return rgViaBlob(video, url, wrap);
        }
        return rgViaDirect(video, url, wrap);
    }
    function rgStartUrl(video, url, wrap) {   // carrega já (na fila, máx 3, junto do redgifs)
        rgEnqueue(() => rgLoadUrl(video, url, wrap), video);
    }
    // PREPARO p/ URL conhecida (turbo/saint/direct): mostra o poster (se houver) ou configura thumbnail
    // nativa (#t=0.1) com preload='metadata' + estado PRONTO (.smg-rg-ready), sem baixar o vídeo inteiro.
    // O stream completo ocorre no PLAY (toggle → rgLoadUrl) → capa instantânea visível sem travar a navegação.
    function rgPrepareUrl(video, url, wrap, poster) {
        if (!video || !url) return;
        video._rgUrl = url;
        if (video._rgKeepRef) video.referrerPolicy = video._rgKeepRef;
        else if (video.dataset.rgid) video.referrerPolicy = 'no-referrer';
        if (wrap) { wrap.classList.remove('smg-rg-loading'); wrap.classList.add('smg-rg-ready'); }

        video.addEventListener('error', () => {
            if (!video._rgUserPlayed && wrap && wrap._rgFallback) {
                wrap._rgFallback();
            }
        }, { once: true });

        const setNativeThumb = () => {
            if (video.dataset.rgLoaded) return;
            try {
                video.preload = 'metadata';
                video.src = url + (/#/.test(url) ? '' : '#t=0.1');
            } catch (e) {}
        };

        const onMeta = () => {
            if (wrap && video.videoWidth && video.videoHeight) rgAspect(wrap, video.videoWidth, video.videoHeight);
        };
        if (video.readyState >= 1 && video.videoWidth) onMeta();
        else video.addEventListener('loadedmetadata', onMeta, { once: true });

        if (poster) {
            // Mostra a thumb nativa (#t=0.1) imediatamente enquanto confirma o poster
            setNativeThumb();
            const im = new Image();
            im.onload = () => {
                if (!video.isConnected) return;
                // Substitui a thumb nativa pelo poster real (melhor qualidade) quando carregado
                video.poster = poster;
                // Remove o src nativo para evitar conflito poster vs src
                if (!video.dataset.rgLoaded && video.currentSrc) {
                    video.removeAttribute('src');
                    try { video.load(); } catch (e) {}
                }
                if (wrap) rgAspect(wrap, im.naturalWidth, im.naturalHeight);
            };
            im.onerror = () => { /* setNativeThumb já foi chamado, nada a fazer */ };
            im.src = poster;
        } else {
            setNativeThumb();
        }
    }

    // libera o slot do turbo/saint do aspect 16:9 + overflow:hidden quando montamos NOSSO player dentro dele.
    // INLINE (setProperty important) de propósito: à prova de :has não-aplicado/cascata → vídeo vertical NUNCA é cortado.
    function fillSlot(slot) {
        if (!slot) return;
        slot.classList.add('smg-turbo-slot--filled');
        slot.style.setProperty('aspect-ratio', 'auto', 'important');
        slot.style.setProperty('overflow', 'visible', 'important');
    }
    // desfaz o fillSlot: volta o slot ao 16:9. Necessário se o player nativo MONTOU e depois FALHOU (cai pro iframe):
    // o iframe é position:absolute → precisa do slot com altura (16:9), senão colapsa (altura 0) e some.
    function unfillSlot(slot) {
        if (!slot) return;
        slot.classList.remove('smg-turbo-slot--filled');
        slot.style.removeProperty('aspect-ratio');
        slot.style.removeProperty('overflow');
    }

    // SMG: imagepond vem como IFRAME nativo (iframe[src*=imagepond.net/videos/{id}], solto no .bbWrapper) → troca pelo nosso player.
    // O mp4 (referer-locked à ORIGEM do fórum: 403 sem Referer, 206 com) sai do scrape da página /videos/{id} (a id do iframe
    // não mapeia direto pro nome do arquivo). Tocamos DIRETO (streaming, referer preservado via _rgKeepRef), blob como rede de segurança.
    function imagepondPoster(mp4) {
        if (!mp4) return '';
        try {
            const u = new URL(mp4);
            u.pathname = u.pathname.replace(/\.(?:mp4|mov|m4v|webm)$/i, '_thumb.jpg');
            u.search = '';
            return u.toString();
        } catch(e) {
            return mp4.replace(/\.(?:mp4|mov|m4v|webm)(\?.*)?$/i, '_thumb.jpg');
        }
    }
    // → { mp4, img }: a página /videos/{id} do imagepond pode ser VÍDEO ou IMAGEM. O ARQUIVO de vídeo (media.imagepond.net/media/videos/…)
    // NÃO está no HTML estático da /videos/{id} (carrega por JS) — ele aparece na página /i/{slug} que a /videos/ LINKA. Então: tenta achar
    // a mídia direta nesta página; se não, segue UMA vez pro link /i/ e procura lá. `mp4` pode ser .mp4/.mov/.m4v/.webm (o player nativo toca todos).
    function imagepondResolve(pageUrl, cb) {
        if (!GMX || !pageUrl) { cb(null); return; }
        const VEXT = '(?:mp4|mov|m4v|webm)';
        const grabVid = t => {
            let m = t.match(new RegExp('<source[^>]+src=["\']([^"\']+\\.' + VEXT + '[^"\']*)["\']', 'i'));   // <source> direto (não HLS .m3u8)
            let v = m ? m[1] : null;
            if (!v) { const g = t.match(new RegExp('https?://[^"\'\\s)]*media\\.imagepond\\.net/media/videos/[^"\'\\s)]+\\.' + VEXT + '[^"\'\\s)]*', 'i')); v = g ? g[0] : null; }
            return v ? v.replace(/&amp;/g, '&') : null;
        };
        const grabImg = t => {   // imagem de CONTEÚDO (/media/images/) EXCLUINDO ícones do site (android-chrome/favicon/apple-touch/mstile/logo)
            const re = /https?:\/\/[^"'\s)]*media\.imagepond\.net\/media\/images\/[^"'\s)]+\.(?:jpe?g|png|webp|gif|avif)[^"'\s)]*/ig;
            for (let mm; (mm = re.exec(t));) { if (!/android-chrome|apple-touch-icon|favicon|mstile|safari-pinned-tab|site[-_]?icon|app[-_]?icon|(?:^|[/_-])logo(?:[/_.-]|$)/i.test(mm[0])) return mm[0].replace(/&amp;/g, '&'); }
            return null;
        };
        GMX({ method: 'GET', url: pageUrl, timeout: 12000,
            headers: { Referer: location.origin + '/', Accept: 'text/html,application/xhtml+xml,*/*' },
            onload: r => {
                const t = r.responseText || '';
                const vid = grabVid(t);
                if (vid) { cb({ mp4: vid, img: null }); return; }
                const img = grabImg(t);
                if (img) { cb({ mp4: null, img }); return; }
                // /videos/{id}: o arquivo mora na página /i/{slug} (linkada aqui). Segue UMA vez (não a partir de uma /i/, evita loop), pulando o /i/{id}/download.
                if (!/\/i\//.test(pageUrl)) {
                    const re = /https?:\/\/[^"'\s)]*imagepond\.net\/i\/[^"'\s)]+/ig;
                    for (let mm; (mm = re.exec(t));) { const u = mm[0].replace(/&amp;/g, '&'); if (!/\/download\b/i.test(u)) { imagepondResolve(u, cb); return; } }
                }
                cb(null);
            },
            onerror: () => cb(null), ontimeout: () => cb(null) });
    }
    function processImagepondNativeEmbeds(roots) {
        if (!(FEATURES.imagepondEmbeds && GMX)) return;
        eachIn(roots, 'iframe[src*="imagepond.net/videos/"]:not([data-ip-done]), iframe[src*="imagepond.net/video/"]:not([data-ip-done])', ifr => {
            ifr.dataset.ipDone = '1';
            if (ifr.closest('.smg-rg')) return;   // já é o iframe de fallback que NÓS montamos
            const pageUrl = ifr.getAttribute('src') || '';
            const id = (pageUrl.match(/\/videos?\/([^/?#]+)/) || [])[1];
            if (!id) return;
            // PARA O PLAYER VELHO JÁ: detacha o iframe nativo (mata rede/áudio do imagepond) e põe spinner no lugar.
            const wrapper = document.createElement('div'); wrapper.className = 'generic2wide-iframe-div'; wrapper.dataset.ipId = id;
            const slot = document.createElement('div'); slot.className = 'smg-turbo-slot';
            const loading = document.createElement('div'); loading.className = 'smg-loading';
            slot.appendChild(loading);
            wrapper.appendChild(slot);
            ifr.replaceWith(wrapper);
            const restoreIframe = () => { if (slot.querySelector('iframe')) return; unfillSlot(slot); loading.remove(); ifr.classList.add('saint-iframe'); ifr.removeAttribute('style'); slot.appendChild(ifr); };   // falha total → iframe nativo PREENCHENDO o slot 16:9 (saint-iframe + tira o style inline height:360px que quebrava na coluna)
            const activate = () => {
                if (slot.dataset.ipActivated) return;   // run-once (turboIO E o masonry podem chamar)
                slot.dataset.ipActivated = '1'; slot._smgActivate = null;
                imagepondResolve(pageUrl, res => {
                    if (wrapper.querySelector('.smg-rg')) return;
                    if (res && res.mp4) {                                   // VÍDEO → nosso player
                        const { wrap, video } = buildNativeVideo(res.mp4, location.origin + '/', restoreIframe, 'ImagePond');
                        video._rgKeepRef = 'origin';                        // mp4 referer-locked → streaming direto PRESERVANDO o referer (senão 403); blob (com _rgRef) é o backup
                        video._rgExt = pageUrl; video._rgFeed = pageUrl;
                        loading.remove();
                        slot.appendChild(wrap);
                        fillSlot(slot);                                    // solta o 16:9/overflow do slot → não corta vídeo vertical
                        rgPrepareUrl(video, res.mp4, wrap, imagepondPoster(res.mp4));   // poster + pronto; stream só no play
                        return;
                    }
                    if (res && res.img) {                                   // IMAGEM (o /videos/ do imagepond às vezes é foto) → troca o embed por <img> (entra no pipeline de img + masonry)
                        const a = document.createElement('a'); a.href = res.img; a.target = '_blank'; a.rel = 'noopener noreferrer';
                        const img = document.createElement('img'); img.className = 'bbImage'; img.src = res.img; img.loading = 'lazy'; img.alt = ''; img.dataset.smgLink = pageUrl;
                        a.appendChild(img);
                        wrapper.replaceWith(a);
                        scheduleRun();
                        return;
                    }
                    restoreIframe();                                        // sem mp4 nem img → iframe nativo
                });
            };
            const io = FEATURES.lazyEmbeds ? getLazyEmbedIO() : null;
            if (io) {
                const rect = slot.getBoundingClientRect();
                if (!rect.top || rect.top < (window.innerHeight || 1000) * 4) {
                    activate();
                } else {
                    slot._smgActivate = activate;
                    io.observe(slot);
                    setTimeout(() => { if (!slot.dataset.ipActivated) activate(); }, 250);
                }
            } else {
                activate();
            }
        });
        // LINK direto do imagepond: <a href="imagepond.net/video/{numId}.{hash}"><div>media.imagepond.net/media/{numId}.mp4</div></a>
        // o mp4 vem no texto (ou é derivável do href) e NÃO é referer-locked → toca direto. Vira nosso player no lugar do link.
        eachIn(roots, 'a[href*="imagepond.net/video/"]:not([data-ip-done])', link => {
            link.dataset.ipDone = '1';
            if (link.closest('.smg-rg, .smg-turbo-slot')) return;
            const href = link.getAttribute('href') || '';
            let mp4 = (link.textContent.match(/https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/i) || [])[0];
            if (!mp4) { const m = href.match(/\/video\/(\d+)/); if (m) mp4 = 'https://media.imagepond.net/media/' + m[1] + '.mp4'; }
            if (!mp4) return;
            const wrapper = document.createElement('div'); wrapper.className = 'generic2wide-iframe-div';
            const slot = document.createElement('div'); slot.className = 'smg-turbo-slot';
            wrapper.appendChild(slot);
            link.replaceWith(wrapper);
            const { wrap, video } = buildNativeVideo(mp4, location.origin + '/', null, 'ImagePond');
            video._rgExt = href || mp4;
            slot.appendChild(wrap);
            fillSlot(slot);
            rgPrepareUrl(video, mp4, wrap, imagepondPoster(mp4));   // poster = {id}_thumb.jpg (mesmo padrão do /videos/; não é referer-locked)
        });
    }

    // CYBERDROP: o embed chega como IFRAME do próprio host (.generic2wide-iframe-div > iframe[src*="cyberdrop.…/e/{slug}"]).
    // Na prática ele ficava EM BRANCO e o post parecia vazio — nem vídeo, nem link pra abrir ("o script sumiu com o
    // link do cyberdrop"). Motivo: o host está atrás do DDoS-Guard e a página /e/ só monta o player DEPOIS de bater na
    // API dele; como iframe de terceiro (cookie particionado / bloqueio de cookie de terceiros) essa chamada morre e
    // sobra um retângulo preto. Resolvemos de PRIMEIRA PARTE, igual turbo/imagepond:
    //   GET api.{host}/api/file/info/{slug} → { type, thumbnail_url, auth_url }
    //   GET auth_url                        → { url }  = mp4 direto (token JWT, sem referer-lock → toca direto)
    // Qualquer etapa que falhe → volta o iframe nativo E revela o link de escape: nunca fica buraco no post.
    const CD_EMBED_RE = /^https?:\/\/(?:[a-z0-9-]+\.)?(cyberdrop\.[a-z]+)\/e\/([a-zA-Z0-9_-]+)/i;
    function cyberdropPageUrl(host, slug) { return 'https://' + host + '/f/' + slug; }   // página do arquivo (com download) — o /e/ é só o player
    // espelho sem API própria (api.cyberdrop.me nem resolve DNS) → cai no canônico, que serve o mesmo acervo
    function cyberdropApiHosts(host) {
        const first = 'api.' + String(host || '').replace(/^www\./, '');
        return first === 'api.cyberdrop.cr' ? [first] : [first, 'api.cyberdrop.cr'];
    }
    function cyberdropResolve(host, slug, cb) {
        if (!GMX || !slug) { cb(null); return; }
        const getJson = (url, ok) => GMX({ method: 'GET', url: url, timeout: 15000,
            headers: { Referer: 'https://' + host + '/', Accept: 'application/json,*/*' },
            onload: r => { let j = null; try { j = JSON.parse(r.responseText || ''); } catch (e) {} ok(j); },
            onerror: () => ok(null), ontimeout: () => ok(null) });
        const hosts = cyberdropApiHosts(host);
        const tryHost = i => {
            if (i >= hosts.length) { cb(null); return; }
            getJson('https://' + hosts[i] + '/api/file/info/' + encodeURIComponent(slug), info => {
                if (!info || !info.auth_url) { tryHost(i + 1); return; }
                if (info.type && !/^video\//i.test(info.type)) { cb(null); return; }   // /e/ de não-vídeo: o próprio host redireciona pro /f/ → deixa como está
                getJson(info.auth_url, auth => cb(auth && auth.url ? { mp4: auth.url, poster: info.thumbnail_url || '' } : null));
            });
        };
        tryHost(0);
    }
    // monta o slot (+ link de escape) no lugar de `node` e devolve o que o activate precisa. Reusa o
    // .generic2wide-iframe-div do site quando o iframe já está dentro de um (não aninha wrapper).
    function cyberdropSlot(node, host, slug, origHref) {
        const parent = node.parentElement;
        const inG2w = !!(parent && parent.classList.contains('generic2wide-iframe-div'));
        const wrapper = inG2w ? parent : document.createElement('div');
        if (!inG2w) wrapper.className = 'generic2wide-iframe-div';
        if (wrapper.querySelector('.smg-rg, .smg-turbo-slot')) return null;   // já tem player/slot nosso aqui
        wrapper.dataset.cdId = slug;
        const slot = document.createElement('div'); slot.className = 'smg-turbo-slot';
        const loading = document.createElement('div'); loading.className = 'smg-loading';
        slot.appendChild(loading);
        const esc = document.createElement('a');
        esc.className = 'smg-turbo-fallback'; esc.dataset.cdDone = '1';   // :not([data-cd-done]) → o próprio escape não re-entra no pass
        esc.href = origHref || cyberdropPageUrl(host, slug); esc.target = '_blank'; esc.rel = 'noopener noreferrer';
        esc.textContent = '↗ ' + i18n('Open on cyberdrop') + ' (' + slug + ')';
        esc.style.display = 'none';   // só aparece se cairmos pro iframe/erro (o player tem botão próprio de abrir)
        if (inG2w) { node.replaceWith(slot); wrapper.appendChild(esc); }
        else { node.replaceWith(wrapper); wrapper.append(slot, esc); }
        return { wrapper, slot, loading, esc };
    }
    function cyberdropMount(ctx, host, slug, origHref, restore) {
        cyberdropResolve(host, slug, res => {
            if (ctx.wrapper.querySelector('.smg-rg')) return;
            if (!res) { restore(); return; }
            const { wrap, video } = buildNativeVideo(res.mp4, 'https://' + host + '/', restore, 'Cyberdrop');
            video._rgExt = cyberdropPageUrl(host, slug);   // "abrir em nova guia" → página do arquivo (tem download)
            video._rgFeed = origHref || video._rgExt;
            ctx.loading.remove();
            ctx.slot.appendChild(wrap);
            fillSlot(ctx.slot);   // solta o 16:9 do slot → vídeo vertical não é cortado
            rgPrepareUrl(video, res.mp4, wrap, res.poster);   // poster da API; stream só no play
        });
    }
    function processCyberdropEmbeds(roots) {
        if (!(FEATURES.cyberdropEmbeds && GMX)) return;
        eachIn(roots, 'iframe[src*="cyberdrop."]:not([data-cd-done])', ifr => {
            ifr.dataset.cdDone = '1';
            if (ifr.closest('.smg-rg, .smg-turbo-slot')) return;   // é o iframe de fallback que NÓS montamos
            const m = (ifr.src || ifr.getAttribute('src') || '').match(CD_EMBED_RE);
            if (!m) return;
            const host = m[1], slug = m[2], origHref = ifr.src || ifr.getAttribute('src');
            const ctx = cyberdropSlot(ifr, host, slug, origHref);
            if (!ctx) return;
            // o iframe nativo já saiu do DOM (para de tentar carregar); guardado pra voltar se a API falhar
            const restore = () => {
                if (ctx.slot.querySelector('iframe')) return;
                unfillSlot(ctx.slot); ctx.loading.remove();
                ifr.classList.add('saint-iframe'); ifr.removeAttribute('style');   // preenche o slot 16:9 (o width/height="auto" do site quebrava na coluna)
                ctx.slot.appendChild(ifr);
                ctx.esc.style.removeProperty('display');
            };
            const activate = () => {
                if (ctx.slot.dataset.cdActivated) return;   // run-once (lazyEmbedIO E o masonry podem chamar)
                ctx.slot.dataset.cdActivated = '1'; ctx.slot._smgActivate = null;
                cyberdropMount(ctx, host, slug, origHref, restore);
            };
            const io = FEATURES.lazyEmbeds ? getLazyEmbedIO() : null;
            if (io) {
                const rect = ctx.slot.getBoundingClientRect();
                if (!rect.top || rect.top < (window.innerHeight || 1000) * 4) {
                    activate();
                } else {
                    ctx.slot._smgActivate = activate;
                    io.observe(ctx.slot);
                    setTimeout(() => { if (!ctx.slot.dataset.cdActivated) activate(); }, 250);
                }
            } else {
                activate();
            }
        });
        // LINK cru do /e/ (o XF não embeda quando há 2 URLs na mesma linha) → mesmo player. Sem iframe pra restaurar:
        // a falha revela o link de escape, que é o próprio link original de volta.
        eachIn(roots, 'a[href*="cyberdrop."]:not([data-cd-done])', link => {
            link.dataset.cdDone = '1';
            if (link.closest('.smg-rg, .smg-turbo-slot, .smg-fhcard, .bbCodeBlock--unfurl, .bbCodeQuote, .message-signature')) return;
            if (link.querySelector('img')) return;   // link de imagem (lightbox)
            const m = (link.href || '').match(CD_EMBED_RE);
            if (!m) return;
            const host = m[1], slug = m[2], origHref = link.href;
            const ctx = cyberdropSlot(link, host, slug, origHref);
            if (!ctx) return;
            const restore = () => { unfillSlot(ctx.slot); ctx.loading.remove(); ctx.esc.style.removeProperty('display'); };
            const activate = () => {
                if (ctx.slot.dataset.cdActivated) return;
                ctx.slot.dataset.cdActivated = '1'; ctx.slot._smgActivate = null;
                cyberdropMount(ctx, host, slug, origHref, restore);
            };
            const io = FEATURES.lazyEmbeds ? getLazyEmbedIO() : null;
            if (io) {
                const rect = ctx.slot.getBoundingClientRect();
                if (!rect.top || rect.top < (window.innerHeight || 1000) * 4) {
                    activate();
                } else {
                    ctx.slot._smgActivate = activate;
                    io.observe(ctx.slot);
                    setTimeout(() => { if (!ctx.slot.dataset.cdActivated) activate(); }, 250);
                }
            } else {
                activate();
            }
        });
    }

    // esconde o placeholder nativo ("Click here to load redgifs media" / botão de expand) ao montar o player num .generic2wide-iframe-div (Simp)
    // ⚠️ setProperty(...,'important'): a CSS tem `span[data-s9e-mediaembed=redgifs]{display:block !important}` → display:none inline NÃO vence sem o !important.
    function rgHidePlaceholder(wrap) {
        const div = wrap.closest('.generic2wide-iframe-div');
        if (div) Array.from(div.children).forEach(c => { if (!c.classList.contains('smg-rg')) c.style.setProperty('display', 'none', 'important'); });
    }

    function applyRedgifsPlayer(roots) {
        if (!GMX) return;   // sem GM_xmlhttpRequest não dá pra furar o CORS da API → deixa o iframe nativo (autoLoadRedgifs cuida)
        // 1) LOADER ainda sem iframe → monta direto pelo id do onclick (não chega a baixar o iframe nativo)
        eachIn(roots, 'div.generic2wide-iframe-div[onclick*="redgifs"]:not([data-rg-done])', div => {
            // já virou iframe → o caso 2 assume. MARCA: sem isso o div ficava no loop (re-checado todo
            // full-scan) e, depois que o caso 2 trocava o iframe pelo player, voltava aqui SEM iframe e
            // montava um SEGUNDO player pelo onclick remanescente (vídeo duplicado).
            if (div.querySelector('iframe')) { div.dataset.rgDone = '1'; return; }
            const id = rgIdFrom(div.getAttribute('onclick') || '');
            if (!id) return;
            div.dataset.rgDone = '1';
            div.dataset.redgifsAutoloaded = 'true';   // autoLoadRedgifs não clica mais nele
            div.removeAttribute('onclick');            // mata o loadMedia nativo (clique no nosso player não injeta iframe duplicado)
            const { wrap, video } = rgBuild(id);
            wrap._rgLoader = div;
            div.appendChild(wrap);
            rgHidePlaceholder(wrap);   // esconde o placeholder nativo ("Click here to load…") — Simp
            rgStart(video, true);   // post = SD
        });
        // 2) IFRAME de redgifs (s9e OU já injetado) → troca por <video>, REMOVE o iframe (restaura na falha).
        // ⚠️ REMOVE, não esconde: iframe com display:none CONTINUA TOCANDO (o áudio do "duplicado" que tocava 20s).
        eachIn(roots, 'iframe[src*="redgifs.com"]:not([data-rg-done]), iframe[data-src*="redgifs.com"]:not([data-rg-done])', ifr => {
            ifr.dataset.rgDone = '1';
            if (ifr.closest('.smg-rg')) return;   // é o iframe de fallback que NÓS montamos → não mexer
            // ANTI-DUP: já existe player nesse embed (loader assumido no caso 1, ou 2ª injeção do site) → REMOVE o iframe (parar áudio), sem 2º player
            const box = ifr.closest('span[data-s9e-mediaembed], .generic2wide-iframe-div') || ifr.parentNode;
            if (box && box.querySelector('.smg-rg')) { ifr.remove(); return; }
            const id = rgIdFrom(ifr.getAttribute('src') || ifr.getAttribute('data-src') || '');
            if (!id) return;
            const { wrap, video } = rgBuild(id);
            wrap._rgIframe = ifr;
            ifr.parentNode.insertBefore(wrap, ifr);   // wrap entra no lugar do iframe
            ifr.remove();                              // mata o iframe (e o áudio) — guardado em wrap._rgIframe p/ restaurar na falha
            rgHidePlaceholder(wrap);   // Simp: se o site auto-carregou o redgifs como iframe DENTRO do .generic2wide-iframe-div, esconde o placeholder ("Click here to load…")
            rgStart(video, true);   // post = SD
        });
        // 3) CATCH-ALL (Simp): assim que um .generic2wide-iframe-div ganha nosso player/fail, esconde o placeholder nativo
        //    ("Click here to load redgifs media"), seja qual for a estrutura/timing. MARCA O DIV (não o placeholder):
        //    antes o seletor varria TODO span[data-s9e-mediaembed] do doc a cada frame e nunca marcava os sem player (leak).
        //    Agora só os divs SEM player ainda (conjunto pequeno) são re-checados; o div com player é marcado e sai do loop.
        eachIn(roots, '.generic2wide-iframe-div:not([data-rg-ph])', div => {
            if (!div.querySelector('.smg-rg, .smg-rg-fail')) {
                // div SEM traço de redgifs (turbo/saint/iframe-fallback) nunca vai ganhar este placeholder →
                // marca e sai do loop. Antes ficava re-checado em TODO full-scan pra sempre (centenas de
                // querySelector à toa em thread grande). Só continua re-checando quem é redgifs pendente.
                if (!/redgifs/i.test(div.getAttribute('onclick') || '') && !div.querySelector('span[data-s9e-mediaembed="redgifs"], .iframe-wrapper-redgifs, iframe[src*="redgifs"], iframe[data-src*="redgifs"]')) div.dataset.rgPh = '1';
                return;   // redgifs ainda sem player → re-checa no próximo frame (não marca)
            }
            div.dataset.rgPh = '1';
            div.querySelectorAll('span[data-s9e-mediaembed], .iframe-wrapper-redgifs').forEach(ph => {
                if (!ph.querySelector('.smg-rg, .smg-rg-fail')) ph.style.setProperty('display', 'none', 'important');   // !important vence a CSS `display:block !important` do s9e
            });
        });
    }
