    // media/14-feed-lightbox.js
    // Owns: the media overlay: one media list per thread, gallery and feed views, gestures, ?view= URL state.
    // Exposes: openMedia, openMediaFeed, closeMedia, setMediaView, collectMediaFrom, restoreNavMode, smgSetNavParam.
    // Depends on: media/08a-masonry-engine (gallery), media/08-images-masonry (mediaResizeKeep), media/10-redgifs-player, runtime/21-init-features (turboThumbSize, at call time), core/06-helpers.
    // =========================================================
    // FEATURE: modo mídia — a mídia da thread num overlay com DUAS vistas sobre UMA lista
    //
    // Mapa interno:
    //   coleta ....... feedEmbedUrl · collectMediaFrom (acha imgs/vídeos/embeds num root)
    //   lista ........ mediaState + galFetch/galRenderPage (páginas da thread → itens, em ordem de post)
    //   galeria ...... gal* (galPageUrl/Observe/Tile/RenderPage/JumpTo/…) — vista padrão, mosaico por página
    //   overlay ...... mediaRoot (root + dock + Esc) · openMedia/openMediaFeed/closeMedia · setMediaView
    //   feed ......... feedBuildShell + feedMount() ← GRANDE: slides, zoom, nav (nextVisible/goTo/advance),
    //                  buildSlide, addItems, mute/filtro
    // =========================================================

    // autoplay + mudo nos players suportados (param na URL; o iframe já tem allow="autoplay")
    function feedEmbedUrl(url, muted) {
        try {
            const u = new URL(url);
            const q = new URLSearchParams(u.search);
            if (/redgifs/i.test(u.hostname)) { q.set('autoplay', '1'); q.set('muted', muted ? '1' : '0'); }
            else if (/turbo\.cr/i.test(u.hostname)) { q.set('autoplay', '1'); }      // mute: sem param conhecido
            else if (/imagepond\.net/i.test(u.hostname)) { q.set('autoplay', '1'); } // mute: sem param conhecido
            else if (/youtube|youtu\.be/i.test(u.hostname)) { q.set('autoplay', '1'); q.set('mute', muted ? '1' : '0'); }
            else return url;
            u.search = q.toString();
            return u.toString();
        } catch { return url; }
    }



    // extrai mídia (imagens + embeds) de um documento/elemento — vale na página viva e em páginas buscadas
    function collectMediaFrom(root) {
        const items = [];
        const local = new Set();
        const add = (type, url) => { if (url && !local.has(url)) { local.add(url); items.push({ type, url }); } };

        root.querySelectorAll('img.bbImage, video.smg-rg-v, iframe.saint-iframe, iframe[src*="turbo.cr"], iframe[src*="saint"], iframe[src*="imagepond.net"], span[data-s9e-mediaembed] iframe, span[data-s9e-mediaembed-iframe], .generic2wide-iframe-div iframe, .generic2wide-iframe-div[onclick*="redgifs"], .bbCodeBlock--unfurl[data-url], a[href*="turbo.cr/"]:not(.smg-turbo-fallback), a[href*="saint.cr/"]:not(.smg-turbo-fallback), a[href*="saint2.cr/"]:not(.smg-turbo-fallback), a[href*="saint.su/"]:not(.smg-turbo-fallback), a[href*="saint2.su/"]:not(.smg-turbo-fallback)').forEach(el => {
            // FORMA CRUA (a galeria re-busca a página do servidor, SEM nosso processamento):
            if (el.matches('span[data-s9e-mediaembed-iframe]')) {   // redgifs = <span data-s9e-mediaembed-iframe='[...,"src","https:\/\/…/ifr/ID"]'> (sem <iframe> nem .generic2wide)
                let arr; try { arr = JSON.parse(el.getAttribute('data-s9e-mediaembed-iframe') || '[]'); } catch (e) { return; }
                const si = arr.indexOf('src'); let src = si >= 0 ? arr[si + 1] : '';
                if (/redgifs\.com\/ifr\/|turbo\.cr\/embed\/|saint2?\.(?:su|to|cr)/i.test(src)) {
                    src = src.replace(/(?:https?:)?\/\/(?:[a-z0-9-]+\.)?(?:saint2?\.(?:su|to|cr))\b/i, 'https://turbo.cr');
                    add('embed', src);
                }
                return;
            }
            if (el.matches('.bbCodeBlock--unfurl[data-url]')) {   // turbo/saint = card unfurl com data-url REAL (o <a> é um /goto base64). bunkr/pixeldrain caem aqui e são IGNORADOS (regex só turbo/saint).
                const u = el.getAttribute('data-url') || '';
                const id = turboMediaId(u);
                if (id) add('embed', 'https://turbo.cr/embed/' + id);
                return;
            }
            if (el.tagName === 'IMG') {
                add('image', imageUrlOf(el));
            } else if (el.tagName === 'VIDEO') {   // nosso player já montado: redgifs pelo id; turbo (Simp nativo) pelo _rgFeed
                if (el.dataset.rgid) add('embed', 'https://www.redgifs.com/ifr/' + el.dataset.rgid);
                else if (el._rgFeed) add('embed', el._rgFeed);
            } else if (el.tagName === 'IFRAME') {
                let src = absUrl(el.getAttribute('src') || '');
                if (src) {
                    src = src.replace(/(?:https?:)?\/\/(?:[a-z0-9-]+\.)?(?:saint2?\.(?:su|to|cr))\b/i, 'https://turbo.cr');
                    add('embed', src);
                }
            } else if (el.tagName === 'A') {   // link cru de saint/turbo (ex.: páginas buscadas pela galeria, onde o iframe ainda não foi montado)
                const href = el.getAttribute('href') || '';
                const id = turboMediaId(href);
                if (id) add('embed', 'https://turbo.cr/embed/' + id);
            } else { // div de redgifs ainda não carregado: pega o id do onclick
                if (el.querySelector('iframe')) return;
                const m = (el.getAttribute('onclick') || '').match(/redgifs\.com\/ifr\/([a-zA-Z0-9_-]+)/i);
                if (m) add('embed', 'https://www.redgifs.com/ifr/' + m[1]);
            }
        });
        return items;
    }

    // AVISO ÚNICO (1ª vez que abre galeria/feed pela dock/header): esses modos têm navegação PRÓPRIA —
    // começam na página 1 da thread e paginam toda a mídia, separados de onde você está lendo.
    // Salva a flag no GM/localStorage → nunca mais reaparece.
    function showNavModeNotice() {
        if (gmGet('smg-navmode-notice', '0') === '1') return;
        if (document.getElementById('smg-navnotice')) return;
        const ov = document.createElement('div');
        ov.id = 'smg-navnotice';
        ov.innerHTML =
            '<div class="smg-navnotice-card">' +
                '<div class="smg-navnotice-title">' + i18n('Gallery and Feed') + '</div>' +
                '<div class="smg-navnotice-text">' + i18n('Gallery and Feed browse the whole thread with their own pagination — they start at page 1 and page through all the media, independently of where you are reading. Use their own pager and sort.') + '</div>' +
                '<button type="button" class="smg-navnotice-ok">' + i18n('Got it') + '</button>' +
            '</div>';
        document.body.appendChild(ov);
        const close = () => { gmSet('smg-navmode-notice', '1'); ov.remove(); };
        ov.querySelector('.smg-navnotice-ok').addEventListener('click', close);
        ov.addEventListener('click', e => { if (e.target === ov) close(); });   // clicar no scrim também fecha
    }

    // MODO MÍDIA: UM overlay (#smg-media) com DUAS vistas sobre UMA lista de mídia (mediaState):
    //   Galeria (padrão) — mosaico por página (motor 08a), scroll infinito, sort e paginação próprios na dock
    //   Feed — slides em tela cheia + fita de miniaturas, montado da MESMA lista ao entrar na vista e
    //          desmontado (players incluídos) ao sair
    // A lista só cresce por galFetch (página da thread → collectMediaFrom → itens novos); trocar de vista
    // nunca busca nem coleta de novo.
    let mediaState = null;
    let galDockSortBtn = null, galDockGotoBtn = null;   // botões da dock do overlay (criados 1x) — re-sincronizados a cada abertura
    // sort = UM botão toggle, IGUAL ao btnSort da thread: o ícone alterna data⇄reações conforme mediaState.order
    function galSyncSortBtn() {
        if (!galDockSortBtn || !mediaState) return;
        const isDate = mediaState.order === 'date';
        setBtnIcon(galDockSortBtn, ICONS.sort);   // idem btnSort: glifo de ordenação fixo
        const sortTip = isDate
            ? (IS_PT ? 'Ordenação atual: por data. Clique para ordenar por reações' : 'Current sort: by date. Click to sort by reactions')
            : (IS_PT ? 'Ordenação atual: por reações. Clique para ordenar por data' : 'Current sort: by reactions. Click to sort by date');
        setBtnLabel(galDockSortBtn, sortTip);
        const t = galDockSortBtn.querySelector('.smg-nav-btn-text');   // texto visível: deixa claro PELO QUÊ está ordenado
        if (t) t.textContent = i18n(isDate ? 'Date' : 'Reactions');
    }
    // PERSISTÊNCIA do modo na URL (query param) → F5 reabre galeria/feed em vez de cair na thread.
    // replaceState (não polui o histórico). Params: view=gallery|feed · order=date|reaction (sort da galeria).
    // SEM página: a galeria sempre reabre na página 1 (restaurar página quebrava a paginação no F5).
    function smgSetNavParam(view, order) {
        try {
            const u = new URL(location.href);
            if (view) {
                u.searchParams.set('view', view);
                if (order) u.searchParams.set('order', order); else u.searchParams.delete('order');
            } else {
                u.searchParams.delete('view'); u.searchParams.delete('order');
            }
            history.replaceState(history.state, '', u.toString());
        } catch (e) {}
    }
    // no boot (e em cada pass até a thread montar): se a URL pede uma vista, reabre o overlay nela. Roda 1x só.
    let smgNavRestored = false;
    function restoreNavMode() {
        if (smgNavRestored || !document.documentElement.classList.contains('smg-thread')) return;
        smgNavRestored = true;
        const p = new URLSearchParams(location.search);
        const v = p.get('view');
        if (v === 'gallery' || v === 'feed') openMedia(v, p.get('order'));
    }
    function galPageUrl(n, order) {
        let b = location.pathname.replace(/\/page-\d+/, '').replace(/\/(unread|latest)$/, '');
        if (!b.endsWith('/')) b += '/';
        return b + (n > 1 ? 'page-' + n : '') + (order === 'reaction' ? '?order=reaction_score' : '');
    }
    let galIO = null;
    function galObserve(tile) {   // carrega o preview do tile (iframe c/ poster) só quando entra na viewport
        // 1400px (era 600): a grade da galeria é rolada rápido — 600px dava tempo de ver o tile vazio.
        // Miniatura é barata, o IO é "once" e a grade é finita → antecipar não vira carga extra.
        if (!galIO) galIO = makeLazyIO(el => { if (el._galLoad) el._galLoad(); }, { rootMargin: '1400px 0px' });
        if (galIO) galIO.observe(tile); else if (tile._galLoad) tile._galLoad();   // sem IO no browser → carrega na hora
    }
    function galTile(it, page) {
        const tile = document.createElement('div');
        tile.className = 'smg-gallery-tile smg-gallery-tile--' + it.type;
        tile.dataset.page = page;
        tile.dataset.url = it.url;
        if (it.type === 'image') {
            tile.classList.add('is-loading');   // shimmer até a imagem pintar (some no load/erro)
            const img = document.createElement('img');
            img.loading = 'lazy'; img.alt = '';
            const full = it.url, med = getMedUrl(full);   // TILE = médio (perf); o feed abre o FULL no clique (alta)
            const done = () => tile.classList.remove('is-loading');
            img.addEventListener('load', () => { done(); masonrySchedule(tile.parentElement); });   // proporção real → a seção reflui
            img.addEventListener('error', () => { if (med !== full && img.src !== full) img.src = full; else done(); });   // médio 404 → tenta o full; full falhou → tira o shimmer
            img.src = med;
            if (img.complete && img.naturalWidth) done();   // já em cache → sem shimmer preso
            tile.appendChild(img);
            tile.addEventListener('click', () => setMediaView('feed', { at: full }));   // tile → Feed naquele item
        } else {
            // vídeo: placeholder → carrega o player (preview/poster) ao entrar na viewport · toca inline · botão maximizar abre no feed
            tile.innerHTML = '<span class="smg-gallery-play">' + svgIcon('<polygon points="6 3 20 12 6 21 6 3"/>') + '</span>';
            const maxBtn = document.createElement('button');
            maxBtn.type = 'button'; maxBtn.className = 'smg-gallery-max';
            maxBtn.title = i18n('Expand'); maxBtn.setAttribute('aria-label', i18n('Expand'));
            maxBtn.innerHTML = svgIcon('<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>');
            maxBtn.addEventListener('click', e => { e.stopPropagation(); setMediaView('feed', { at: it.url }); });
            tile.appendChild(maxBtn);
            tile._galLoad = () => {
                if (tile.dataset.loaded) return;
                tile.dataset.loaded = '1';
                const ph = tile.querySelector('.smg-gallery-play'); if (ph) ph.remove();
                const toIframe = () => {
                    if (!tile.isConnected || tile.querySelector('.smg-rg, iframe')) return;
                    const iframe = document.createElement('iframe');
                    iframe.src = it.url;
                    iframe.style.cssText = 'width:100%;height:100%;border:0;display:block;';
                    iframe.allowFullscreen = true;
                    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen');
                    tile.insertBefore(iframe, maxBtn);
                };
                // tile ganha o aspect REAL do vídeo (vertical = tile alto, não esmagado em 16:9)
                // (acima da tela a grade devolve a diferença no scroll: mediaResizeKeep, 08-images-masonry)
                const setRelh = (w, h) => {
                    const relh = (h / w).toFixed(4);
                    if (!tile.isConnected || tile.dataset.relh === relh) return;
                    mediaResizeKeep(tile);
                    tile.dataset.relh = relh;
                    masonrySchedule(tile.parentElement);
                };
                const fitTile = video => video.addEventListener('loadedmetadata', () => {
                    if (video.videoWidth && video.videoHeight) setRelh(video.videoWidth, video.videoHeight);
                }, { once: true });
                const rid = (FEATURES.redgifsPlayer && GMX) ? rgIdFrom(it.url) : null;
                if (rid) {   // redgifs → NOSSO player (autoplay-off, igual ao inline)
                    const { wrap, video } = rgBuild(rid);
                    tile.insertBefore(wrap, maxBtn);
                    fitTile(video);
                    rgStart(video, true);
                } else {   // imagepond/youtube/etc → iframe (não temos player nativo)
                    toIframe();
                    // turbo: o iframe nasce 16:9; a thumb do og:image da /embed/ tem a proporção do vídeo (a MESMA
                    // busca do turbo no post, turboThumbSize, com cache por id) → tile vertical sem tarjas
                    const tid = GMX && (it.url.match(/turbo\.cr\/embed\/([a-zA-Z0-9_-]+)/) || [])[1];
                    if (tid) turboThumbSize(tid, size => { if (size && size.w / size.h > 0.3 && size.w / size.h < 2.8) setRelh(size.w, size.h); });
                }
            };
            galObserve(tile);
        }
        return tile;
    }
    // tiles-fantasma (shimmer) com alturas variadas — reservam espaço enquanto a página carrega
    const GAL_SKEL_H = [115, 70, 145, 95, 62, 128, 88, 108, 78];
    function galSkelTile(i) {
        const t = document.createElement('div');
        t.className = 'smg-gallery-skel smg-skeleton-shimmer';
        t.dataset.relh = String(GAL_SKEL_H[i % GAL_SKEL_H.length] / 100);   // altura/largura do tile-fantasma
        return t;
    }
    // altura/largura de um tile pro motor masonry (08a): imagem carregada → pixels; vídeo → proporção do player
    // (ou 16:9 até ele saber); tile-fantasma e imagem ainda sem pixels → a proporção guardada / o placeholder
    function galTileRatio(tile) {
        if (tile.dataset.relh) return +tile.dataset.relh;
        if (tile.classList.contains('smg-gallery-tile--image')) return masonryImgRatio(tile.querySelector('img'));
        return 9 / 16;
    }
    // colunas do tile: vídeo (ou ainda sem proporção = 16:9) ou imagem deitada 2, em pé/quadrado 1; fantasma 1
    function galTileSpan(tile, relH) {
        return tile.classList.contains('smg-gallery-skel') ? 1 : masonryOrientSpan(relH);
    }
    // esvazia o scroller soltando cada seção do ResizeObserver do motor
    function galClearScroller(sc) {
        sc.querySelectorAll('.smg-gallery-cols').forEach(masonryUnmount);
        sc.innerHTML = '';
    }
    function galMakeSection(n, skel) {
        const sec = document.createElement('div');
        sec.className = 'smg-gallery-page' + (skel ? ' is-skel' : '');
        sec.dataset.page = n;
        sec.innerHTML = '<div class="smg-gallery-pagehdr"><span>' + i18n('Page') + ' ' + n + '</span></div>';   // separador "Page N" — rola junto (NÃO é sticky)
        const cols = document.createElement('div');
        cols.className = 'smg-gallery-cols';
        sec.appendChild(cols);
        masonryMount(cols, { getRatio: galTileRatio, getSpan: galTileSpan });   // mosaico: o mesmo motor do post
        return sec;
    }
    // muta o scroller mantendo `keep` visualmente fixo (corrige scrollTop pela variação de altura acima dele) → sem "pulo"
    function galKeepStable(keep, mutate) {
        const sc = mediaState.scroller;
        if (!keep || !keep.isConnected) { mutate(); return; }
        const before = keep.getBoundingClientRect().top;
        mutate();
        sc.scrollTop += keep.getBoundingClientRect().top - before;
    }
    // retorna true se ADICIONOU mídia nova (o galFetch usa isso: página vazia → pula direto pra próxima)
    function galRenderPage(doc, n, where, sec) {
        if (!mediaState || !sec || !sec.isConnected) return false;   // jump/close cancelou esta busca
        const fresh = collectMediaFrom(doc).filter(it => !mediaState.seen.has(it.url));
        fresh.forEach(it => { mediaState.seen.add(it.url); it.page = n; });
        if (!fresh.length) {   // página sem mídia nova → tira o skeleton (preservando a posição)
            galKeepStable(where === 'prepend' ? sec.nextElementSibling : null, () => { masonryUnmount(sec.querySelector('.smg-gallery-cols')); sec.remove(); });
            if (!mediaState.scroller.querySelector('.smg-gallery-page'))
                mediaState.scroller.innerHTML = '<div class="smg-gallery-empty">' + i18n('No media on this page') + '</div>';
            return false;
        }
        const cols = sec.querySelector('.smg-gallery-cols');
        const frag = document.createDocumentFragment();
        fresh.forEach(it => frag.appendChild(galTile(it, n)));
        // troca skeleton → real sem "pulo": no append ancora no topo da própria seção (preenche p/ baixo);
        // no prepend a seção está ACIMA da viewport → ancora no que vem ABAIXO dela (o que se está lendo)
        const keep = where === 'prepend' ? sec.nextElementSibling : sec;
        // layout SÍNCRONO dentro do mutate: o galKeepStable mede a altura nova logo depois
        galKeepStable(keep, () => { cols.innerHTML = ''; cols.appendChild(frag); sec.classList.remove('is-skel'); masonryLayout(cols); });
        mediaState.items = where === 'prepend' ? fresh.concat(mediaState.items) : mediaState.items.concat(fresh);
        // a vista Feed (se montada) recebe o que entrou no FIM da lista; um prepend ela pega ao ser remontada
        const fd = where === 'append' && document.getElementById('smg-feed');
        if (fd && fd._ctrl) fd._ctrl.addItems(fresh);
        return true;
    }
    // carrega a PRÓXIMA página enquanto o paginador disser que tem (hasMore). Encadeado no .then do galFetch →
    // percorre TODAS as páginas da thread automaticamente (páginas vazias no meio são atravessadas). Sem piso por
    // itens nem por altura (heurísticas que travavam): a fonte de verdade é o "Next" do paginador.
    function galEnsureFilledDown() {
        if (!mediaState || mediaState.loading || !mediaState.hasMore || mediaState.hi >= 300) return;   // 300 = backstop anti-runaway
        galFetch(mediaState.hi + 1, 'append');
    }
    // ainda não há ~3 telas de conteúdo abaixo do ponto de leitura → vale pré-buscar a próxima página
    function galNeedMoreBelow() {
        const sc = mediaState && mediaState.scroller;
        return !!sc && (sc.scrollHeight - sc.scrollTop - sc.clientHeight) < sc.clientHeight * 3;
    }
    // tem próxima página? segue o link "Next" do paginador (IGUAL ao infinite scroll da thread) — presente em
    // toda página menos a última. É a fonte de verdade pra "pode buscar mais": NÃO depende de parsear o total
    // (que vinha errado e travava). Funciona em /page-N, ?page=N, etc.
    function galHasNext(doc) {
        return !!doc.querySelector('.pageNav-jump--next, .pageNavSimple-el--next');
    }
    function galFetch(n, where) {
        if (!mediaState || mediaState.loading || n < 1) return;   // sem teto por max: quem decide "tem mais" é o paginador (hasMore)
        mediaState.loading = true;
        const gen = mediaState.gen;
        const sc = mediaState.scroller;
        const empty = sc.querySelector('.smg-gallery-empty'); if (empty) empty.remove();
        // skeleton imediato, na MESMA posição da seção real → reserva espaço + dá feedback durante o fetch
        const sec = galMakeSection(n, true);
        const cols = sec.querySelector('.smg-gallery-cols');
        for (let i = 0; i < 9; i++) cols.appendChild(galSkelTile(i));
        if (where === 'prepend') { galKeepStable(sc.firstElementChild, () => sc.insertBefore(sec, sc.firstChild)); mediaState.lo = n; }
        else { sc.appendChild(sec); mediaState.hi = Math.max(mediaState.hi, n); }
        galUpdatePager();
        fetchDoc(galPageUrl(n, mediaState.order), { credentials: 'same-origin' })   // SEM X-Requested-With: garante a página COMPLETA (com paginador), igual ao infinite scroll
            .then(doc => {
                if (!mediaState || mediaState.gen !== gen) return;   // jump/close no meio do caminho
                mediaState.hasMore = galHasNext(doc);   // FONTE DE VERDADE: o paginador desta página tem "Next"?
                // max é só pro display do goto: o maior entre paginação do doc, DOM vivo e a página atual descoberta.
                mediaState.max = Math.max(mediaState.max, pagerMax(doc), (readPageJump() || {}).max || 0, mediaState.hi + (mediaState.hasMore ? 1 : 0));
                const added = galRenderPage(doc, n, where, sec);   // renderiza (ou remove a seção se a página não tiver mídia nova)
                mediaState.loading = false;
                galUpdatePager();
                feedSyncEmpty();
                // append → encadeia a PRÓXIMA: SEMPRE através de página vazia (não adiciona altura, o scroll
                // não retomaria), e com mídia só enquanto faltar ~3 telas abaixo — o handler de scroll (<900px)
                // retoma sob demanda. Antes encadeava INCONDICIONAL: abrir a galeria baixava+parseava a thread
                // INTEIRA (até 300 fetches sequenciais, centenas de MB), com o usuário parado na página 1.
                if (where === 'append' && (!added || galNeedMoreBelow())) galEnsureFilledDown();
            })
            .catch(() => {
                if (!mediaState || mediaState.gen !== gen) return;
                mediaState.loading = false;
                feedSyncEmpty();
                if (sec.isConnected) galKeepStable(where === 'prepend' ? sec.nextElementSibling : null, () => { masonryUnmount(cols); sec.remove(); });
                if (where === 'prepend') mediaState.lo = n + 1; else if (mediaState.hi === n) mediaState.hi = n - 1;   // libera p/ tentar de novo no próximo scroll
            });
    }
    function galJumpTo(n) {
        if (!mediaState) return;
        n = Math.max(1, Math.min(mediaState.max, n));
        if (galIO) galIO.disconnect();   // larga os tiles de vídeo observados (evita refs presas a nós removidos)
        mediaState.gen++; mediaState.seen = new Set(); mediaState.items = []; mediaState.loading = false; mediaState.hasMore = true;
        galClearScroller(mediaState.scroller); mediaState.scroller.scrollTop = 0;
        mediaState.lo = n; mediaState.hi = n - 1;   // hi = n-1 → galFetch(n,'append') seta hi=n
        galFetch(n, 'append');
    }
    function galUpdatePager() {
        if (!mediaState) return;
        // página real = a última seção cujo cabeçalho está no topo (ou acima) da viewport
        const ref = mediaState.scroller.getBoundingClientRect().top + 56;
        let page = mediaState.lo;
        // seções em ordem no DOM (top crescente) → a 1ª cujo top passa de ref fixa a página: corta cedo
        // em vez de medir as seções abaixo da viewport a cada frame de scroll da galeria.
        const secs = mediaState.scroller.querySelectorAll('.smg-gallery-page');
        for (let i = 0; i < secs.length; i++) {
            if (secs[i].getBoundingClientRect().top <= ref) page = parseInt(secs[i].dataset.page, 10) || page;
            else break;
        }
        mediaState.viewPage = page;
        if (galDockGotoBtn) setBtnIcon(galDockGotoBtn, `${page} / ${(mediaState && mediaState.max) || page}`);
    }
    function feedSyncEmpty() {
        const fd = document.getElementById('smg-feed');
        if (fd && fd._ctrl) fd._ctrl.syncEmpty();
    }
    function galSetOrder(order) {
        if (!mediaState || mediaState.order === order) return;
        mediaState.order = order;
        galSyncSortBtn();   // troca o ícone/label do botão toggle (data⇄reações)
        smgSetNavParam('gallery', order);   // persiste a ordem na URL (F5 mantém) — o sort só existe na vista Galeria
        galJumpTo(1);   // nova ordem → volta pra página 1 e pro topo (não faz sentido manter a página atual numa ordem diferente)
    }
    // ---- overlay: UM root, UMA dock, UM Esc ----
    // #smg-media > #smg-gallery (vista Galeria) + #smg-feed (vista Feed) + .smg-media-dock (flutuante, comum às duas).
    // Criado 1x; os listeners persistentes falam com mediaState / feed._ctrl (trocados a cada sessão/vista).
    function mediaView() {
        const root = document.getElementById('smg-media');
        return root && root.classList.contains('open') ? (root.dataset.view === 'feed' ? 'feed' : 'gallery') : null;
    }
    function mediaRoot() {
        let root = document.getElementById('smg-media');
        if (root) return root;
        root = document.createElement('div');
        root.id = 'smg-media';
        root.dataset.view = 'gallery';
        const gal = document.createElement('div');
        gal.id = 'smg-gallery';
        gal.innerHTML = '<div class="smg-gallery-grid"></div>';
        const feed = feedBuildShell();
        const gdock = document.createElement('div'); gdock.className = 'smg-media-dock';
        const gpanel = document.createElement('div'); gpanel.className = 'smg-media-dock-panel';

        // seletor de vista: DOIS botões da dock (segmentado), o da vista atual com aria-pressed + .smg-active
        const vGal = makeDockButton({ id: 'smg-media-view-gallery', icon: ICONS.gallery, label: 'Gallery' });
        const vFeed = makeDockButton({ id: 'smg-media-view-feed', icon: ICONS.feed, label: 'Feed' });
        const views = makeGroup(vGal, vFeed);
        views.classList.add('smg-media-views');
        views.setAttribute('role', 'group');
        views.setAttribute('aria-label', i18n('View mode'));
        vGal.addEventListener('click', () => setMediaView('gallery'));
        vFeed.addEventListener('click', () => setMediaView('feed'));

        // controles SÓ da galeria — idênticos à dock da thread: sort TOGGLE (data⇄reações) + paginação
        // (prev · goto-com-nº · next) + o mesmo stepper de "ir pra página". Somem na vista Feed.
        const gSortTip = IS_PT ? 'Ordenação atual: por data. Clique para ordenar por reações' : 'Current sort: by date. Click to sort by reactions';
        const gSort = makeDockButton({ id: 'smg-gal-sort', icon: ICONS.sort, label: gSortTip });
        gSort.classList.add('smg-nav-labeled');
        gSort.appendChild(Object.assign(document.createElement('span'), { className: 'smg-nav-btn-text', textContent: i18n('Date') }));
        const gPrev = makeDockButton({ id: 'smg-gal-prev', icon: ICONS.pagePrev, label: IS_PT ? 'Página anterior' : 'Previous page' });
        const gGoto = makeDockButton({ id: 'smg-gal-goto', icon: '1', label: IS_PT ? 'Pular para página específica' : 'Jump to specific page' });
        const gNext = makeDockButton({ id: 'smg-gal-next', icon: ICONS.pageNext, label: IS_PT ? 'Próxima página' : 'Next page' });
        galDockSortBtn = gSort; galDockGotoBtn = gGoto;
        const gnav = makeGroup(gSort, gPrev, gGoto, gNext);
        gnav.classList.add('smg-media-gal-only');
        const gnavDiv = makeDivider();
        gnavDiv.classList.add('smg-media-gal-only');

        // fechar = .smg-nav-btn com label VISÍVEL (pílula) — o ÚNICO caminho de fechar (botão, Esc, puxar no feed)
        const gClose = makeDockButton({ id: 'smg-media-close', icon: ICONS.close, label: 'Close' });
        gClose.classList.add('smg-media-close'); gClose.removeAttribute('data-label');
        gClose.appendChild(Object.assign(document.createElement('span'), { className: 'smg-media-close-label', textContent: i18n('Close') }));

        gpanel.append(views, makeDivider(), gnav, gnavDiv, gClose);

        const gGotoPop = document.createElement('div');
        gGotoPop.className = 'smg-gallery-goto-pop';
        gGotoPop.innerHTML =
            '<span class="smg-goto-title">Go to page</span>' +
            '<div class="smg-goto-stepper">' +
                '<button type="button" class="smg-goto-step" data-dir="-1" aria-label="Decrease">−</button>' +
                '<input type="number" class="smg-goto-input" min="1" value="1">' +
                '<button type="button" class="smg-goto-step" data-dir="1" aria-label="Increase">+</button>' +
            '</div>' +
            '<span class="smg-goto-max"></span>' +
            '<button type="button" class="smg-goto-btn">Go</button>';
        gdock.append(gpanel, gGotoPop);

        root.append(gal, feed, gdock);
        document.body.appendChild(root);
        i18nDom(root);

        gSort.addEventListener('click', () => { if (mediaState) galSetOrder(mediaState.order === 'date' ? 'reaction' : 'date'); });
        gPrev.addEventListener('click', () => galJumpTo((mediaState ? (mediaState.viewPage || mediaState.lo) : 1) - 1));
        gNext.addEventListener('click', () => galJumpTo((mediaState ? (mediaState.viewPage || mediaState.lo) : 1) + 1));

        const gIn = gGotoPop.querySelector('.smg-goto-input');
        const gMax = gGotoPop.querySelector('.smg-goto-max');
        const galClamp = n => { if (!n || n < 1) n = 1; const mx = mediaState ? mediaState.max : 1; if (mx && n > mx) n = mx; return n; };
        const galCloseGoto = () => gdock.classList.remove('goto-open');
        const galOpenGoto = () => {
            const mx = mediaState ? mediaState.max : 1;
            gIn.max = mx || '';
            gIn.value = mediaState ? (mediaState.viewPage || mediaState.lo) : 1;
            gMax.textContent = mx ? 'of ' + mx + ' pages' : '';
            gdock.classList.add('goto-open');
            setTimeout(() => { gIn.focus(); gIn.select(); }, 0);
        };
        const galDoGoto = () => { galJumpTo(galClamp(parseInt(gIn.value, 10))); galCloseGoto(); };
        gGoto.addEventListener('click', e => { e.stopPropagation(); if (gdock.classList.contains('goto-open')) galCloseGoto(); else galOpenGoto(); });
        gGotoPop.querySelectorAll('.smg-goto-step').forEach(b => b.addEventListener('click', () => { gIn.value = galClamp((parseInt(gIn.value, 10) || 1) + parseInt(b.dataset.dir, 10)); }));
        gIn.addEventListener('change', () => { gIn.value = galClamp(parseInt(gIn.value, 10)); });
        gGotoPop.querySelector('.smg-goto-btn').addEventListener('click', galDoGoto);
        gIn.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); galDoGoto(); }
            else if (e.key === 'Escape') { e.stopPropagation(); galCloseGoto(); }
        });
        smgPopover({   // clique-fora fecha o goto; o Esc fica com o handler do overlay (goto primeiro, depois o overlay)
            inside: [gGotoPop, gGoto], escape: false,
            isOpen: () => gdock.classList.contains('goto-open'),
            close: galCloseGoto,
        });
        gClose.addEventListener('click', closeMedia);

        // TECLADO do overlay inteiro (o da thread se cala enquanto ele está aberto, ver 07-posts-misc):
        // Esc fecha o goto e depois o overlay · v alterna Galeria/Feed · no Feed: setas/PageUp/PageDown/espaço navegam, m = mudo
        document.addEventListener('keydown', e => {
            if (!root.classList.contains('open')) return;
            if (e.key === 'Escape') {
                if (gdock.classList.contains('goto-open')) { galCloseGoto(); return; }
                closeMedia();
                return;
            }
            const t = e.target;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            if (e.key === 'v') { setMediaView(root.dataset.view === 'feed' ? 'gallery' : 'feed'); return; }
            if (root.dataset.view !== 'feed' || !feed._ctrl) return;
            if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); feed._ctrl.step(1); }
            else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); feed._ctrl.step(-1); }
            else if (e.key === 'm') feed._ctrl.toggleMute();
        });

        const sc = gal.querySelector('.smg-gallery-grid');
        let galRaf = 0;
        sc.addEventListener('scroll', () => {
            if (galRaf) return;
            galRaf = requestAnimationFrame(() => {
                galRaf = 0;
                if (!mediaState) return;
                if (mediaState.hasMore && sc.scrollHeight - (sc.scrollTop + sc.clientHeight) < 900) galFetch(mediaState.hi + 1, 'append');   // desce → próxima (se houver)
                if (sc.scrollTop < 500 && mediaState.lo > 1) galFetch(mediaState.lo - 1, 'prepend');                     // sobe → anterior
                galUpdatePager();
            });
        }, { passive: true });
        return root;
    }
    // desmonta a sessão: players do feed e da galeria, tiles, IO, blobs. Fechar E abrir de novo passam por aqui.
    function mediaTeardown(root) {
        feedUnmount();
        if (galIO) galIO.disconnect();   // solta os tiles de vídeo observados (sem isso, nós removidos ficam presos no IO)
        // esvazia a grade AGORA: manter milhares de tiles + <video> com src vivo num DOM escondido segurava
        // dezenas/centenas de MB até a próxima abertura
        const grid = root.querySelector('.smg-gallery-grid');
        grid.querySelectorAll('video.smg-rg-v').forEach(rgDispose);
        galClearScroller(grid);
        const dock = root.querySelector('.smg-media-dock');
        if (dock) dock.classList.remove('goto-open');
        rgReleaseDetachedBlobs();
        mediaState = null;
    }
    function mediaBegin(root, st) {
        mediaTeardown(root);
        mediaState = Object.assign({ scroller: root.querySelector('.smg-gallery-grid'), seen: new Set(), items: [], loading: false, gen: 0 }, st);
        galSyncSortBtn();   // a dock é criada 1x → sincroniza o toggle com a ordem (data/reações) a cada abertura
        if (galDockGotoBtn) setBtnIcon(galDockGotoBtn, `${mediaState.lo} / ${mediaState.max}`);
        root.classList.add('open');
        document.documentElement.style.overflow = 'hidden';
    }
    // header, dock, atalho f e ?view= → a thread INTEIRA desde a página 1, na vista pedida (Galeria por padrão)
    function openMedia(view, order) {
        showNavModeNotice();   // aviso único: o modo mídia tem navegação própria (página 1, sort próprio)
        const root = mediaRoot();
        const pj = readPageJump();
        order = (order === 'reaction') ? 'reaction' : 'date';
        // SEMPRE página 1 (restaurar a página quebrava a paginação no F5 → percorre tudo desde o começo);
        // pagerMax + readPageJump corrigem o max no 1º fetch
        mediaBegin(root, { hasMore: true, order, lo: 1, hi: 0, max: pj ? pj.max : 1, viewPage: 1 });
        setMediaView(view === 'feed' ? 'feed' : 'gallery');
        galFetch(1, 'append');   // página 1; o scroll da galeria / o fim do feed puxam as próximas
    }
    // clique numa imagem/vídeo do post → a mídia da PÁGINA ATUAL (já no DOM, sem buscar), na vista Feed, naquele
    // item. Transitório: não grava ?view= (trocar de vista depois grava). Com o overlay aberto só leva ao item.
    function openMediaFeed(startUrl) {
        if (mediaView() && mediaState) { setMediaView('feed', { at: startUrl }); return; }
        const root = mediaRoot();
        const pj = readPageJump();
        const cur = pj ? pj.cur : 1;
        mediaBegin(root, { hasMore: !!pj && cur < pj.max, order: 'date', lo: cur, hi: cur, max: pj ? pj.max : 1, viewPage: cur });
        const sec = galMakeSection(cur, false);
        mediaState.scroller.appendChild(sec);
        galRenderPage(document, cur, 'append', sec);
        setMediaView('feed', { at: startUrl, persist: false });
    }
    function closeMedia() {
        const root = document.getElementById('smg-media');
        if (!root) return;
        const wasOpen = root.classList.contains('open');
        root.classList.remove('open');
        mediaTeardown(root);
        if (!wasOpen) return;
        document.documentElement.style.overflow = '';
        smgSetNavParam(null);   // saiu pra thread → limpa a URL
    }
    // tile da galeria por URL de mídia (só na troca de vista → varrer é barato)
    function galTileFor(url) {
        if (!url || !mediaState) return null;
        const tiles = mediaState.scroller.querySelectorAll('.smg-gallery-tile');
        for (let i = 0; i < tiles.length; i++) if (tiles[i].dataset.url === url) return tiles[i];
        return null;
    }
    // 1º tile visível no topo da galeria → onde o Feed começa quando se troca pelo seletor (não por um tile)
    function galFirstVisibleUrl() {
        if (!mediaState) return null;
        const top = mediaState.scroller.getBoundingClientRect().top;
        const tiles = mediaState.scroller.querySelectorAll('.smg-gallery-tile');
        for (let i = 0; i < tiles.length; i++) if (tiles[i].getBoundingClientRect().bottom > top + 1) return tiles[i].dataset.url || null;
        return null;
    }
    // troca de vista sem tocar na lista: Feed é montado dela (no item `at`, ou no 1º visível da galeria) e
    // desmontado ao sair (players parados); a Galeria fica montada e volta rolada até o item em que o Feed estava.
    function setMediaView(view, opts) {
        opts = opts || {};
        const root = document.getElementById('smg-media');
        if (!root || !mediaState) return;
        view = view === 'feed' ? 'feed' : 'gallery';
        const from = root.dataset.view;
        const feed = root.querySelector('#smg-feed');
        const at = opts.at || (view === 'feed' ? (from === 'feed' ? null : galFirstVisibleUrl()) : (feed._ctrl ? feed._ctrl.curUrl() : null));
        root.dataset.view = view;
        [['gallery', 'smg-media-view-gallery'], ['feed', 'smg-media-view-feed']].forEach(([v, id]) => {
            const b = document.getElementById(id);
            if (!b) return;
            b.setAttribute('aria-pressed', v === view ? 'true' : 'false');
            b.classList.toggle('smg-active', v === view);
        });
        const dock = root.querySelector('.smg-media-dock');
        if (dock) dock.classList.remove('goto-open');
        if (view === 'feed') {
            root.querySelectorAll('#smg-gallery video').forEach(v => { try { v.pause(); } catch (e) {} });   // o inline da galeria não toca por baixo
            feedMount(at);
        } else {
            feedUnmount();   // sai do feed → players dele param e são soltos
            const sc = mediaState.scroller;
            sc.querySelectorAll('.smg-gallery-cols').forEach(masonryRefresh);   // seções anexadas com a galeria escondida
            const tile = galTileFor(at);
            if (tile) sc.scrollTop += tile.getBoundingClientRect().top - sc.getBoundingClientRect().top - sc.clientHeight / 3;
            galUpdatePager();
        }
        if (opts.persist !== false) smgSetNavParam(view, mediaState.order);   // F5 reabre na mesma vista e ordem
    }

    // zoom/pan de uma imagem do feed: UM lugar escreve o transform (pinça, arrasto e clique usavam 3 cópias)
    function feedZoomTransform(img, z) { img.style.transform = 'translate(' + z.x + 'px,' + z.y + 'px) scale(' + z.scale + ')'; }
    // esvazia os slides e a fita, desmontando os players antes (sair do feed, fechar e reabrir passam por aqui)
    function feedClearReel(feed) {
        const reelEl = feed.querySelector('.smg-feed-reel');
        reelEl.querySelectorAll('video.smg-rg-v').forEach(rgDispose);
        reelEl.innerHTML = '';
        feed.querySelector('.smg-feed-strip').innerHTML = '';
    }
    function feedUnmount() {
        const feed = document.getElementById('smg-feed');
        if (!feed || !feed._ctrl) return;
        feed._ctrl = null;
        feedClearReel(feed);   // teardown completo dos players antes do wipe
        rgReleaseDetachedBlobs();   // os <video> do feed saíram do DOM → libera os objectURLs de blob agora
    }
    // casca da vista Feed (1x, dentro do #smg-media): sem botão de fechar próprio — fecha pela dock do overlay
    function feedBuildShell() {
        const feed = document.createElement('div');
        feed.id = 'smg-feed';
        feed.innerHTML =
            '<div class="smg-feed-tools">' +
                '<button class="smg-feed-tool smg-feed-filter" type="button" aria-label="Filter media">' + ICONS.layers + '</button>' +
                '<button class="smg-feed-tool smg-feed-mute" type="button" aria-label="Sound">' + ICONS.volumeMute + '</button>' +
            '</div>' +
            '<button class="smg-feed-nav smg-feed-prev" type="button" aria-label="Previous">' + svgIcon('<path d="m18 15-6-6-6 6"/>') + '</button>' +
            '<button class="smg-feed-nav smg-feed-next" type="button" aria-label="Next">' + svgIcon('<path d="m6 9 6 6 6-6"/>') + '</button>' +
            '<div class="smg-feed-counter"></div>' +
            '<div class="smg-feed-track"><div class="smg-feed-reel"></div><div class="smg-feed-empty" hidden></div></div>' +
            '<button class="smg-feed-striparrow smg-feed-striparrow--prev" type="button" aria-label="Previous">' + svgIcon('<path d="m15 18-6-6 6-6"/>') + '</button>' +
            '<div class="smg-feed-strip"></div>' +
            '<button class="smg-feed-striparrow smg-feed-striparrow--next" type="button" aria-label="Next">' + svgIcon('<path d="m9 18 6-6-6-6"/>') + '</button>';

        const trackEl = feed.querySelector('.smg-feed-track');
        feed.querySelector('.smg-feed-prev').addEventListener('click', () => feed._ctrl && feed._ctrl.step(-1));
        feed.querySelector('.smg-feed-next').addEventListener('click', () => feed._ctrl && feed._ctrl.step(1));
        feed.querySelector('.smg-feed-mute').addEventListener('click', () => feed._ctrl && feed._ctrl.toggleMute());
        feed.querySelector('.smg-feed-filter').addEventListener('click', () => feed._ctrl && feed._ctrl.cycleFilter());

        // filmstrip (miniaturas) SEMPRE visível por padrão (toggle removido)
        feed.classList.add('strip-open');

        // setas < > de navegação do filmstrip: rolam a fita ~70% da largura; somem nas pontas
        const stripEl = feed.querySelector('.smg-feed-strip');
        const stripPrev = feed.querySelector('.smg-feed-striparrow--prev');
        const stripNext = feed.querySelector('.smg-feed-striparrow--next');
        const updateStripArrows = () => {
            const max = stripEl.scrollWidth - stripEl.clientWidth;
            stripPrev.classList.toggle('is-hidden', stripEl.scrollLeft <= 2);
            stripNext.classList.toggle('is-hidden', max <= 2 || stripEl.scrollLeft >= max - 2);
        };
        feed._updateStripArrows = updateStripArrows;   // o per-open chama após montar os thumbs (setActive)
        stripPrev.addEventListener('click', () => stripEl.scrollBy({ left: -stripEl.clientWidth * 0.7, behavior: 'smooth' }));
        stripNext.addEventListener('click', () => stripEl.scrollBy({ left: stripEl.clientWidth * 0.7, behavior: 'smooth' }));
        let stripRaf = 0;
        stripEl.addEventListener('scroll', () => { if (stripRaf) return; stripRaf = requestAnimationFrame(() => { stripRaf = 0; updateStripArrows(); }); }, { passive: true });

        // roda do mouse → 1 slide por vez, suave
        trackEl.addEventListener('wheel', e => {
            if (!feed._ctrl) return;
            e.preventDefault();
            if (Math.abs(e.deltaY) < 6) return;
            feed._ctrl.step(e.deltaY > 0 ? 1 : -1);
        }, { passive: false });

        const setupFeedGestures = () => {
            // gestos touch: pinça (zoom em imagem) · arrasto p/ pan quando ampliada ·
            // swipe vertical p/ navegar · puxar pra baixo no topo fecha
            const dist2 = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
            let mode = null, dragStartY = 0, dragDy = 0, moved = false;
            let pinchStart = 0, pinchBase = 1, panSX = 0, panSY = 0, panBX = 0, panBY = 0;

            trackEl.addEventListener('touchstart', e => {
                if (!feed._ctrl) return;
                const img = feed._ctrl.activeImg();
                const z = img && (img._zoom || (img._zoom = { scale: 1, x: 0, y: 0 }));
                if (img) img.style.transition = 'none';   // pinch/pan em tempo real (sem o ease do clique)
                if (e.touches.length === 2 && img) {
                    mode = 'pinch';
                    pinchStart = dist2(e.touches);
                    pinchBase = z.scale;
                } else if (e.touches.length === 1 && img && z.scale > 1) {
                    mode = 'pan';
                    panSX = e.touches[0].clientX; panSY = e.touches[0].clientY;
                    panBX = z.x; panBY = z.y;
                } else if (e.touches.length === 1) {
                    mode = 'nav';
                    dragStartY = e.touches[0].clientY; dragDy = 0; moved = false;
                    feed._ctrl.reel.style.transition = 'none';
                } else {
                    mode = null;
                }
            }, { passive: true });

            trackEl.addEventListener('touchmove', e => {
                if (!feed._ctrl || !mode) return;
                const c = feed._ctrl;
                if (mode === 'pinch') {
                    const img = c.activeImg();
                    if (!img || e.touches.length < 2) return;
                    const z = img._zoom;
                    z.scale = Math.max(1, Math.min(5, pinchBase * dist2(e.touches) / (pinchStart || 1)));
                    feedZoomTransform(img, z);
                    e.preventDefault();
                } else if (mode === 'pan') {
                    const img = c.activeImg();
                    if (!img) return;
                    const z = img._zoom;
                    z.x = panBX + (e.touches[0].clientX - panSX);
                    z.y = panBY + (e.touches[0].clientY - panSY);
                    feedZoomTransform(img, z);
                    e.preventDefault();
                } else { // nav
                    dragDy = e.touches[0].clientY - dragStartY;
                    if (Math.abs(dragDy) > 8) moved = true;
                    let dy = dragDy;
                    if ((c.cur() === 0 && dy > 0) || (c.cur() === c.len() - 1 && dy < 0)) dy *= 0.3; // resistência nas pontas
                    c.reel.style.transform = 'translateY(calc(' + (-c.cur() * 100) + 'vh + ' + dy + 'px))';
                    e.preventDefault();
                }
            }, { passive: false });

            trackEl.addEventListener('touchend', e => {
                if (!feed._ctrl) return;
                const c = feed._ctrl;
                if (mode === 'pinch' || mode === 'pan') {
                    const img = c.activeImg();
                    if (img && img._zoom && img._zoom.scale <= 1.02) { img._zoom = { scale: 1, x: 0, y: 0 }; img.style.transform = ''; }
                    if (e.touches.length === 0) mode = null;
                    return;
                }
                if (mode === 'nav') {
                    mode = null;
                    if (c.cur() === 0 && dragDy >= 110) { closeMedia(); return; } // puxar pra baixo no topo → fecha o overlay
                    if (dragDy <= -45) c.advance(1);
                    else if (dragDy >= 45) c.advance(-1);
                    else c.goTo(c.cur());
                }
            });

            // GRAB (desktop): arrasta a imagem AMPLIADA pra deslizar. Limiar distingue drag de clique → não togla zoom no fim do arrasto.
            let grabbing = false, gMoved = false, gSX = 0, gSY = 0, gBX = 0, gBY = 0, suppressClick = false;
            trackEl.addEventListener('mousedown', e => {
                if (e.button !== 0) return;
                suppressClick = false;
                if (!feed._ctrl) return;
                const img = feed._ctrl.activeImg(), z = img && img._zoom;
                if (!img || !z || z.scale <= 1.02) return;   // só desliza quando ampliada
                grabbing = true; gMoved = false; gSX = e.clientX; gSY = e.clientY; gBX = z.x; gBY = z.y;
                img.style.transition = 'none'; img.classList.add('smg-grabbing');
                e.preventDefault();
            });
            window.addEventListener('mousemove', e => {
                if (!grabbing || !feed._ctrl) return;
                const img = feed._ctrl.activeImg(), z = img && img._zoom;
                if (!img || !z) return;
                const dx = e.clientX - gSX, dy = e.clientY - gSY;
                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) gMoved = true;
                z.x = gBX + dx; z.y = gBY + dy;
                feedZoomTransform(img, z);
            });
            window.addEventListener('mouseup', () => {
                if (!grabbing) return;
                grabbing = false;
                const img = feed._ctrl && feed._ctrl.activeImg();
                if (img) img.classList.remove('smg-grabbing');
                if (gMoved) suppressClick = true;   // arrastou → o click seguinte é ignorado (não togla zoom)
            });

            // tap/click: IMAGEM → cicla zoom no ponto clicado · VÍDEO → libera os controles do player
            trackEl.addEventListener('click', e => {
                if (!feed._ctrl) return;
                if (moved) { moved = false; return; }                   // foi swipe (touch)
                if (suppressClick) { suppressClick = false; return; }   // foi grab (mouse)
                if (!feed._ctrl.toggleZoom(e.clientX, e.clientY)) feed._ctrl.toggleLive();
            });
        };
        setupFeedGestures();
        return feed;
    }

    // monta a vista Feed a partir da lista do overlay (mediaState.items), começando em startUrl. Novas páginas
    // chegam pela MESMA lista: perto do fim o feed pede galFetch(próxima) e o galRenderPage entrega os itens via addItems.
    function feedMount(startUrl) {
        const feed = document.getElementById('smg-feed');
        feedUnmount();
        const reel = feed.querySelector('.smg-feed-reel');
        const counter = feed.querySelector('.smg-feed-counter');
        const prevBtn = feed.querySelector('.smg-feed-prev');
        const strip = feed.querySelector('.smg-feed-strip');
        const muteBtn = feed.querySelector('.smg-feed-mute');
        const filterBtn = feed.querySelector('.smg-feed-filter');
        const emptyEl = feed.querySelector('.smg-feed-empty');

        feedClearReel(feed);
        reel.style.transition = 'none';
        reel.style.transform = 'translateY(0)';

        let muted = gmGet('smg-feed-muted', '1') === '1';
        let filterMode = 'all'; // all | image | embed
        const FILTERS = ['all', 'image', 'embed'];
        const FILTER_ICON = { all: ICONS.layers, image: ICONS.typeImage, embed: ICONS.playCircle };
        const FILTER_LABEL = { all: i18n('Filter: all'), image: i18n('Filter: images'), embed: i18n('Filter: videos') };
        setMuteIcon();
        setFilterIcon();

        const seen = new Set();
        const slides = [];
        const thumbs = [];
        const urls = [];
        let startSlideIdx = -1;   // índice do startUrl, capturado no buildSlide
        let current = 0;
        let lastActive = -1;   // último slide ativado: setActive só mexe nele + no novo + vizinhos (não em todos os N)
        let animating = false;
        let navTimer;
        // ---- filtro de mídia (tudo / imagens / vídeos) ----
        const mtypeOf = idx => slides[idx] && slides[idx].dataset.mtype; // 'image' | 'embed'
        let visibleIndices = [], visiblePositions = new Map(), visibleCacheDirty = true;
        const isVisible = idx => filterMode === 'all' || mtypeOf(idx) === filterMode;
        function rebuildVisibleCache() {
            if (!visibleCacheDirty) return;
            visibleIndices = [];
            visiblePositions = new Map();
            slides.forEach((slide, idx) => {
                if (!isVisible(idx)) return;
                visibleIndices.push(idx);
                visiblePositions.set(idx, visibleIndices.length);
            });
            visibleCacheDirty = false;
        }
        function invalidateVisibleCache() { visibleCacheDirty = true; }
        function nextVisible(from, dir) {
            rebuildVisibleCache();
            if (dir > 0) {
                for (let i = 0; i < visibleIndices.length; i++) if (visibleIndices[i] > from) return visibleIndices[i];
            } else {
                for (let i = visibleIndices.length - 1; i >= 0; i--) if (visibleIndices[i] < from) return visibleIndices[i];
            }
            return -1;
        }
        function firstVisible() { rebuildVisibleCache(); return visibleIndices.length ? visibleIndices[0] : -1; }
        function visibleCount() { rebuildVisibleCache(); return visibleIndices.length; }
        function visiblePos(idx) { rebuildVisibleCache(); return visiblePositions.get(idx) || 0; }

        // só o slide ativo tem o iframe (perf + autoplay/stop); imagens carregam ±1 slide.
        // toca SÓ os slides afetados — o anterior (limpa embed/is-live/zoom) + o novo + vizinhos do novo —
        // em vez de iterar os N slides a cada navegação. Invariante: só o slide ativo tem conteúdo no embed.
        function setActive(idx) {
            if (!slides.length) return;
            current = Math.max(0, Math.min(slides.length - 1, idx));
            const prev = lastActive;
            lastActive = current;
            [prev, current - 1, current, current + 1].forEach((j, k, arr) => {
                if (j < 0 || j >= slides.length || arr.indexOf(j) !== k) return;   // fora do range, ou índice repetido (já tratado)
                const s = slides[j];
                const emb = s.querySelector('.smg-feed-embed');
                const img = s.querySelector('.smg-feed-media');
                if (emb) {
                    emb.classList.remove('is-live'); // ao navegar, volta pro modo swipe
                    if (j === current && !emb.firstChild) {
                        const rid = (FEATURES.redgifsPlayer && GMX) ? rgIdFrom(emb.dataset.src) : null;
                        if (rid) {   // redgifs → player NOSSO (mp4 HD da API), não o iframe; fallback p/ iframe na falha (rgRestore via _rgFeedHost)
                            const { wrap, video } = rgBuild(rid);
                            wrap._rgFeedHost = emb;
                            video._rgSd = false;   // feed = HD
                            video._rgInFeed = true;   // feed = slide ativo TOCA (autoplay off vale só pro inline)
                            video.muted = muted;
                            emb.appendChild(wrap);
                            rgLoad(video);   // slide ativo → carrega e toca já (sem IO)
                        } else {
                            const f = document.createElement('iframe');
                            f.src = feedEmbedUrl(emb.dataset.src, muted);
                            f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
                            f.allowFullscreen = true;
                            emb.appendChild(f);
                        }
                    } else if (j !== current && emb.firstChild) {
                        emb.querySelectorAll('video.smg-rg-v').forEach(rgDispose);   // teardown (pausa/solta src/poster blob/IOs/Set) ANTES de descartar — senão cada slide visitado deixava um <video> zumbi retido a sessão toda
                        emb.innerHTML = '';
                    }
                }
                if (img) {
                    if (!img.src && Math.abs(j - current) <= 1) img.src = img.dataset.src;
                    if (j !== current && img._zoom) { img._zoom = { scale: 1, x: 0, y: 0 }; img.style.transform = ''; } // reseta zoom ao sair
                }
            });
            if (thumbs[prev]) thumbs[prev].classList.remove('active');
            if (thumbs[current]) thumbs[current].classList.add('active');
            revealActiveThumb();
            if (feed._updateStripArrows) feed._updateStripArrows();   // atualiza as setas < > do filmstrip
            const vc = visibleCount();
            counter.textContent = vc ? (visiblePos(current) + ' / ' + vc) : '0 / 0';
            prevBtn.style.visibility = nextVisible(current, -1) >= 0 ? '' : 'hidden';
            if (current >= slides.length - 3) loadNextPage();
        }

        function revealActiveThumb() {
            const t = thumbs[current];
            if (t && feed.classList.contains('strip-open')) t.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
        }

        function buildSlide(it) {
            if (seen.has(it.url)) return;
            seen.add(it.url);
            const idx = slides.length;
            urls.push(it.url);
            if (startUrl && startSlideIdx < 0 && it.url === startUrl) startSlideIdx = idx;   // captura aqui → sem o findIndex+querySelector por slide depois (galeria pode semear MILHARES)

            const slide = document.createElement('div');
            slide.className = 'smg-feed-slide';
            slide.dataset.mtype = it.type; // 'image' | 'embed'

            const thumb = document.createElement('button');
            thumb.type = 'button';
            thumb.className = 'smg-feed-thumb';
            thumb.addEventListener('click', () => goTo(idx));

            if (it.type === 'image') {
                const img = document.createElement('img');
                img.className = 'smg-feed-media';
                img.dataset.src = it.url; // lazy: src setado no setActive
                slide.appendChild(img);

                const ti = document.createElement('img');
                ti.loading = 'lazy';
                ti.src = getMedUrl(it.url);   // tier MÉDIO num tile de 64px (igual galTile): full-res aqui baixava+decodificava MBs por thumb, no meio da transição de slide
                ti.addEventListener('error', () => { if (ti.src !== it.url) ti.src = it.url; }, { once: true });   // host sem .md. → full
                thumb.appendChild(ti);
            } else {
                const emb = document.createElement('div');
                emb.className = 'smg-feed-embed';
                emb.dataset.src = it.url;
                slide.appendChild(emb);

                const badge = document.createElement('span');
                badge.className = 'smg-feed-thumb-embed';
                badge.innerHTML = ICONS.typeVideo;
                thumb.appendChild(badge);
            }

            reel.appendChild(slide);
            slides.push(slide);
            strip.appendChild(thumb);
            thumbs.push(thumb);
            invalidateVisibleCache();
            thumb.style.display = isVisible(idx) ? '' : 'none';
        }

        // perto do fim → a PRÓXIMA página da thread entra na lista do overlay (galFetch); os itens voltam por addItems
        function loadNextPage() {
            if (!mediaState || mediaState.loading || !mediaState.hasMore || mediaState.hi >= 300) return;   // 300 = backstop anti-runaway (= galeria)
            galFetch(mediaState.hi + 1, 'append');
        }
        // itens novos da lista (página anexada): viram slides; o 1º lote de um feed vazio já ativa o slide inicial
        function addItems(items) {
            const had = slides.length;
            items.forEach(buildSlide);
            if (!had && slides.length) { syncEmpty(); goStart(); return; }
            if (slides.length !== had) setActive(current);   // contador/seta/próxima página com o total novo
        }
        // feed sem slide: "carregando" enquanto a lista busca, "sem mídia" quando acabou
        function syncEmpty() {
            const none = !slides.length;
            emptyEl.hidden = !none;
            if (none) {
                emptyEl.textContent = i18n(mediaState && (mediaState.loading || mediaState.hasMore) ? 'Loading…' : 'No media on this page');
                counter.textContent = '0 / 0';
            }
        }
        function goStart() {
            current = startSlideIdx >= 0 ? startSlideIdx : 0;   // começa no item pedido (índice capturado no próprio build)
            reel.style.transition = 'none';
            reel.style.transform = 'translateY(' + (-current * 100) + 'vh)';
            setActive(current);
        }

        function goTo(i) {
            current = Math.max(0, Math.min(slides.length - 1, i));
            reel.style.transition = 'transform .34s cubic-bezier(.22,.61,.36,1)';
            reel.style.transform = 'translateY(' + (-current * 100) + 'vh)';
            setActive(current);
        }

        // avança respeitando o filtro (usado por swipe/wheel/teclado)
        function advance(d) {
            const t = nextVisible(current, d);
            goTo(t < 0 ? current : t);
        }

        function step(d) {
            if (animating) return;
            const t = nextVisible(current, d);
            if (t < 0) return;
            animating = true;
            goTo(t);
            clearTimeout(navTimer);
            navTimer = setTimeout(() => { animating = false; }, 380);
        }

        function toggleLive() {
            const emb = slides[current] && slides[current].querySelector('.smg-feed-embed');
            if (emb) emb.classList.toggle('is-live');
        }

        function activeImg() {
            return slides[current] ? slides[current].querySelector('.smg-feed-media') : null;
        }

        // ZOOM por clique (desktop): 2 níveis (2× → 3.5×) e o 3º clique reseta. Sempre mira o ponto clicado (mantém-no
        // sob o cursor, mesmo subindo de nível). Reusa img._zoom (mesmo objeto do pinch). Retorna false se o slide NÃO
        // for imagem → o caller cai no toggleLive (vídeo).
        const ZOOM_STEPS = [2, 3.5];   // até 2 níveis
        function toggleZoom(clientX, clientY) {
            const img = activeImg();
            if (!img) return false;
            const z = img._zoom || (img._zoom = { scale: 1, x: 0, y: 0, level: 0 });
            if (z.level == null) z.level = z.scale > 1.02 ? 1 : 0;   // compat com estado vindo do pinch
            img.style.transition = 'transform .22s ease';            // suave no clique (o pinch/drag zera isso)
            z.level = (z.level + 1) % 3;                             // 0 → 1 → 2 → 0
            if (z.level === 0) {                                    // 3º clique → reseta
                img._zoom = { scale: 1, x: 0, y: 0, level: 0 };
                img.style.transform = '';
                img.classList.remove('smg-zoomed');
                return true;
            }
            const s = ZOOM_STEPS[z.level - 1];
            const r = img.getBoundingClientRect();                  // box JÁ transformado → mantém o ponto fixo mesmo ampliando de novo
            const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
            z.x += (clientX - cx) * (1 - s / z.scale);
            z.y += (clientY - cy) * (1 - s / z.scale);
            z.scale = s;
            feedZoomTransform(img, z);
            img.classList.add('smg-zoomed');
            return true;
        }

        // ---- mudo (redgifs/youtube; turbo/imagepond não têm param conhecido) ----
        function setMuteIcon() {
            muteBtn.innerHTML = muted ? ICONS.volumeMute : ICONS.volume;
            muteBtn.title = muted ? i18n('Unmute') : i18n('Mute');
            muteBtn.classList.toggle('smg-active', !muted);
        }
        function toggleMute() {
            muted = !muted;
            gmSet('smg-feed-muted', muted ? '1' : '0');
            setMuteIcon();
            const emb = slides[current] && slides[current].querySelector('.smg-feed-embed');
            if (emb) { emb.innerHTML = ''; setActive(current); } // recarrega o player com o novo parâmetro
        }

        // ---- filtro de mídia ----
        function setFilterIcon() {
            filterBtn.innerHTML = FILTER_ICON[filterMode];
            filterBtn.title = FILTER_LABEL[filterMode];
            filterBtn.classList.toggle('smg-active', filterMode !== 'all');
        }
        function cycleFilter() {
            filterMode = FILTERS[(FILTERS.indexOf(filterMode) + 1) % FILTERS.length];
            setFilterIcon();
            invalidateVisibleCache();
            thumbs.forEach((t, j) => t.style.display = isVisible(j) ? '' : 'none');
            if (!isVisible(current)) {
                const v = firstVisible();
                if (v >= 0) goTo(v);
                else { counter.textContent = '0 / 0'; } // nada nesse filtro
            } else {
                setActive(current);
            }
        }

        feed._ctrl = {
            cur: () => current, len: () => slides.length, reel,
            goTo, step, advance, toggleLive, toggleZoom, activeImg,
            toggleMute, cycleFilter, addItems, syncEmpty,
            curUrl: () => urls[current] || null,
        };

        (mediaState ? mediaState.items : []).forEach(buildSlide);
        syncEmpty();
        if (slides.length) goStart();
    }
