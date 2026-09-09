    // =========================================================
    // FEED (river de posts) — modo "feed" da /watched/threads (?view=feed).
    // Arquitetura em 3 camadas: 21-feed-db.js (IndexedDB) · 22-feed-sync.js (busca/escreve) ·
    // ESTE (parse serializável + render). O render LÊ DO BANCO (cursor por ts desc, instantâneo)
    // e dispara o sync no fundo; o sync busca raso/incremental e escreve no banco.
    //   ⚠️ riverParsePost devolve só strings/números (vai pro IndexedDB → nada de nós do DOM).
    // =========================================================
    function isHomePage() { return (document.documentElement.getAttribute('data-template') || '') === 'forum_list' || document.documentElement.classList.contains('smg-home-page'); }
    // o feed mora SÓ na HOME agora (removido o modo da /watched/threads). Acesso exclusivo pela topbar (?view=feed).
    function feedContext() {
        return isHomePage() ? { key: 'smg-homeview' } : null;
    }
    // modo feed: ligado só com ?view=feed na URL (sem sticky — o caminho de entrada é sempre o link da topbar).
    function feedViewWanted() {
        return !!feedContext() && new URLSearchParams(location.search).get('view') === 'feed';
    }

    // janela de BUSCA: até quantos dias atrás paginamos por thread (≠ o que fica guardado). 14d → 1º contato traz mais história;
    // quem acessa sempre cai no delta (só o último dia, barato). Tunável: gmSet('smg-feed-window-days','21').
    const RIVER_WINDOW_DAYS = (parseInt(gmGet('smg-feed-window-days', ''), 10) || 14);
    // RETENÇÃO (≠ janela de busca): quanto tempo o post FICA no banco. Maior que a janela → não joga fora o que já buscamos
    // (posts > 1 semana que vieram de brinde nas páginas recentes ficam visíveis no feed, scroll abaixo). Tunável: gmSet('smg-feed-retention-days','60').
    const RIVER_RETENTION_DAYS = (parseInt(gmGet('smg-feed-retention-days', ''), 10) || 30);
    // SELF-HEAL do cache: BUMP isto sempre que o formato do post serializado (riverParsePost) ou a lógica de sync mudar.
    // Na próxima abertura, dataVersion != FEED_DATA_VERSION → o IDB é descartado e reconstruído sozinho (o usuário NÃO precisa limpar cache na mão).
    const FEED_DATA_VERSION = 12;
    // versão da LÓGICA DE SYNC: bumpar aqui re-varre tudo (zera os marcadores de "thread coberta") SEM apagar
    // os posts já guardados. Use este quando mudar como/até onde buscamos; o DATA_VERSION só quando o FORMATO
    // do post serializado mudar (aí não tem jeito, o cache velho é ilegível).
    const FEED_SYNC_VERSION = 7;

    // fila throttled p/ as buscas (não estoura o flood control do fórum) — usada pelo sync
    const RIVER_CONCURRENCY = 2;
    const RIVER_DELAY_MS = 600;
    let riverActive = 0;
    const riverQueue = [];
    let riverPauseUntil = 0;
    let riverAborted = false;

    function riverAbortSync(reason) {
        riverAborted = true;
        if (typeof window !== 'undefined') window.__riverAborted = true;
        const dropped = riverQueue.length;
        riverQueue.length = 0; // Esvazia IMEDIATAMENTE todas as requisições restantes da fila
        console.warn(`[SMG Timeline] Sincronização interrompida imediatamente (${reason || 'Rate Limit'}). ${dropped} requisições canceladas.`);
    }

    function riverHandle429(retryAfterSec) {
        if (riverAborted) return;
        riverAbortSync('HTTP 429 Too Many Requests');
        const cooldownMs = Math.max(300000, (parseInt(retryAfterSec, 10) || 300) * 1000);
        riverPauseUntil = Math.max(riverPauseUntil, Date.now() + cooldownMs);
        if (typeof window !== 'undefined') {
            window.__lastRateLimitTs = Date.now();
            if (typeof window.applyCronBackoff === 'function') {
                window.applyCronBackoff('HTTP 429');
            }
        }
    }

    function riverPump() {
        if (riverAborted) {
            riverQueue.length = 0;
            return;
        }
        if (Date.now() < riverPauseUntil) {
            setTimeout(riverPump, Math.max(50, riverPauseUntil - Date.now()));
            return;
        }
        while (riverActive < RIVER_CONCURRENCY && riverQueue.length) {
            const job = riverQueue.shift();
            riverActive++;
            Promise.resolve().then(job)
                .then(() => {
                    setTimeout(() => {
                        riverActive--;
                        riverPump();
                    }, RIVER_DELAY_MS);
                }, () => {
                    setTimeout(() => {
                        riverActive--;
                        riverPump();
                    }, RIVER_DELAY_MS);
                });
        }
    }

    if (typeof window !== 'undefined') {
        window.riverHandle429 = riverHandle429;
        window.riverAbortSync = riverAbortSync;
    }

    function riverEnqueue(job) {
        if (riverAborted) return Promise.resolve(null);
        return new Promise(resolve => { riverQueue.push(() => job().then(resolve, () => resolve(null))); riverPump(); });
    }

    // watermark por host: na próxima visita só os posts mais novos que ISSO ganham o destaque "novo"
    const RIVER_WM_KEY = 'smg-river-wm-' + location.hostname;
    function riverWatermark() { return parseInt(gmGet(RIVER_WM_KEY, '0'), 10) || 0; }
    function riverSetWatermark(ts) { if (ts) gmSet(RIVER_WM_KEY, String(ts)); }

    // título = h1 SEM os prefixos e avisos; prefixos viram HTML de chips à parte
    function riverThreadMeta(doc, t) {
        const titleEl = doc.querySelector('h1.p-title-value, .p-title-value, h1.contentRow-header, .p-body-header .p-title');
        const meta = extractCleanTitleAndPrefixes(titleEl, t.fallbackTitle);
        return { title: meta.title, prefixesHtml: meta.prefixesHtml, thumb: t.thumb || '' };
    }
    // des-lazya as imagens do conteúdo (SMG usa lazyload: data-src + <noscript>). A JS de lazyload do fórum NÃO
    // roda no feed → sem isso as imagens ficam placeholder. Roda no doc PARSEADO (scripting off → o img do
    // <noscript> é DOM real) ANTES de serializar; injetado na página viva, o noscript viraria TEXTO e a img sumiria.
    function riverUnlazy(root) {
        if (!root || !root.querySelectorAll) return;
        const realOf = el => { const u = (el.getAttribute('data-src') || el.getAttribute('data-url') || el.getAttribute('data-original') || el.getAttribute('src') || ''); return /^data:/.test(u) ? '' : u; };
        root.querySelectorAll('img').forEach(img => {
            const cur = img.getAttribute('src') || '';
            const real = img.getAttribute('data-src') || img.getAttribute('data-url') || img.getAttribute('data-original') || '';
            if (real && !/^data:/.test(real) && (!cur || /^data:/.test(cur))) img.setAttribute('src', real);
            const ss = img.getAttribute('data-srcset'); if (ss) img.setAttribute('srcset', ss);
            // loading=lazy NATIVO (não depende da JS de lazyload do fórum, que é o que não roda aqui):
            // difere o fetch das offscreen. Remover o attr deixava TODA img do chunk eager — baixava/decodificava
            // mídia que o freeze (±1500px) descartava logo em seguida.
            img.setAttribute('loading', 'lazy'); img.classList.remove('lazyload', 'lazyloading', 'lazyloaded');
        });
        root.querySelectorAll('noscript').forEach(ns => {
            let inner = ns.querySelector && ns.querySelector('img');   // captura (DOMParser): noscript é DOM
            if (!inner && ns.textContent && /<img/i.test(ns.textContent)) {   // render (página viva): noscript virou TEXTO → re-parseia o HTML
                try { inner = new DOMParser().parseFromString(ns.textContent, 'text/html').querySelector('img'); } catch (e) {}
            }
            if (!inner) { ns.remove(); return; }   // noscript sem img → remove (senão vira texto no inject)
            const real = (ns.ownerDocument || document).importNode(inner, true);
            const r = realOf(real); if (r) real.setAttribute('src', r);
            real.setAttribute('loading', 'lazy'); real.classList.remove('lazyload', 'lazyloading', 'lazyloaded');
            const prev = ns.previousElementSibling;
            if (prev && prev.tagName === 'IMG') { prev.replaceWith(real); ns.remove(); } else ns.replaceWith(real);
        });
        // WRAPPERS lazyload (ex.: .bbImageWrapper do SMG): o CSS do fórum faz `.lazyload{opacity:0}` até a JS
        // de lazyload marcar `lazyloaded` — JS que NÃO roda no feed. Tirar a classe de TODO elemento (não só
        // img) revela o pixel; sem isso a img tem src real mas o wrapper fica opacity:0 e some.
        if (root.classList) root.classList.remove('lazyload', 'lazyloading');
        root.querySelectorAll('.lazyload, .lazyloading').forEach(el => el.classList.remove('lazyload', 'lazyloading'));
    }
    // extrai um post → objeto SERIALIZÁVEL (vai pro IndexedDB): nada de nós do DOM, só strings/números
    function riverParsePost(post, meta, threadUrl) {
        if (!post || !isThreadPostElement(post)) return null;
        const body = post.querySelector('.message-userContent .bbWrapper')
            || post.querySelector('.message-userContent')
            || post.querySelector('.message-body')
            || post.querySelector('.message-content')
            || post.querySelector('.bbWrapper')
            || post.querySelector('.articlePreview-text');
        if (!body) return null;
        riverUnlazy(body);   // resolve as imagens lazy ANTES de serializar (senão somem no feed do SMG)
        body.querySelectorAll('.comment, .message-responseRow, .message-responses, .js-messageResponses, .smg-cc, .js-quickEditTargetComment').forEach(c => c.remove());
        const dc = post.getAttribute('data-content') || post.getAttribute('data-lb-id') || '';
        const m = dc.match(/^post-(\d+)$/i)
            || (post.id || '').match(/^(?:js-)?post-(\d+)$/i)
            || (post.getAttribute('data-lb-id') || '').match(/^post-(\d+)$/i)
            || (post.querySelector('.message-attribution a[href*="/post-"], a.message-attribution-gadget[href*="/post-"], .message-attribution a[href*="posts/"], a.message-attribution-gadget[href*="posts/"]')?.getAttribute('href') || '').match(/(?:posts\/|post-)(\d+)/i);
        const postId = m ? m[1] : '';
        if (!postId) return null;
        let ts = 0;
        const postTimeEl = post.querySelector('.message-attribution time, .message-attribution-main time, header.message-attribution time, .message-date time')
            || Array.from(post.querySelectorAll('time.u-dt, time')).find(t => !t.closest('.bbCodeQuote, .message-signature'));
        if (postTimeEl) {
            ts = parseInt(postTimeEl.getAttribute('data-timestamp') || postTimeEl.getAttribute('data-time') || '0', 10) || 0;
            if (!ts) {
                const dt = postTimeEl.getAttribute('datetime');
                if (dt) { const ms = Date.parse(dt); if (!isNaN(ms)) ts = Math.floor(ms / 1000); }
            }
        }
        if (!ts) {
            const wrapTs = post.getAttribute('data-timestamp') || post.getAttribute('data-time');
            if (wrapTs) ts = parseInt(wrapTs, 10) || 0;
        }
        let finalTs = Math.floor(Number(ts));
        if (!finalTs || isNaN(finalTs) || finalTs <= 0) {
            finalTs = Math.floor(Number(meta && meta.lastTs)) || Math.floor(Date.now() / 1000);
        }
        const author = (post.getAttribute('data-author') || '').trim()
            || (((post.querySelector('.message-name .username, .message-name') || {}).textContent) || '').trim();
        const authorA = post.querySelector('.message-name a[href*="/members/"], .message-avatar a[href*="/members/"]');
        let permalink = threadUrl;
        const permA = post.querySelector('.message-attribution a[href*="/post-"], a.message-attribution-gadget[href*="/post-"]');
        if (permA) { try { permalink = new URL(permA.getAttribute('href'), location.href).href; } catch (e) {} }
        else permalink = threadUrl.replace(/[#?].*$/, '').replace(/\/(latest|unread|page-\d+|post-\d+)$/, '') + '#post-' + postId;
        return {
            postId: postId, ts: finalTs, author: author, authorHref: authorA ? authorA.getAttribute('href') : '',
            threadTitle: meta.title, prefixesHtml: meta.prefixesHtml || '', threadThumb: meta.thumb || '',
            permalink: permalink, contentHtml: body.outerHTML || '', mediaUrls: extractPostMediaUrls(body)
        };
    }

    function buildFeedOpen(href) {
        const a = document.createElement('a');
        a.className = 'smg-fp-open'; a.href = href;
        const t = document.createElement('span'); t.textContent = i18n('Open in thread');
        a.appendChild(t);
        a.insertAdjacentHTML('beforeend', ICONS.arrowRight);
        return a;
    }
    // card: [foto da thread] · tags / nome do tópico / postado por autor · tempo · conteúdo · footer
    function riverCard(p, wm) {
        if (!p) return null;
        const postId = p.post_id || p.postId || '';
        if (!postId || (!p.content_html && !p.contentHtml)) return null;
        const ts = p.created_at || p.ts || 0;
        let threadTitle = (p.thread_name || p.threadTitle || '').replace(/\s+/g, ' ').trim();
        threadTitle = threadTitle.replace(/Avisos.*$/i, '').trim();
        if (/^Editar$/i.test(threadTitle) || !threadTitle) {
            const slug = (p.thread_path || p.permalink || '').match(/\/threads\/([^/]+)\./);
            threadTitle = (slug ? slug[1].replace(/[-_]/g, ' ') : '') || i18n('Thread');
        }
        const author = p.author || '';
        const authorHref = p.author_href || p.authorHref || '';
        const contentHtml = p.content_html || p.contentHtml || '';
        const permalink = p.permalink || '#';
        const prefixesHtml = p.prefixes_html || p.prefixesHtml || '';
        const threadThumb = p.thread_thumb || p.threadThumb || '';

        const card = document.createElement('div');
        card.className = 'smg-fp-card' + (ts && ts > wm ? ' is-unread' : '');
        card.dataset.ts = String(ts || 0);
        card.dataset.postId = String(postId);

        const head = document.createElement('div'); head.className = 'smg-fp-head';
        const thumbA = document.createElement('a'); thumbA.className = 'smg-fp-thumb'; thumbA.href = permalink;
        const tLetter = ((threadTitle || '?').trim().charAt(0) || '?').toUpperCase();
        if (threadThumb) {
            const im = document.createElement('img'); im.src = threadThumb; im.loading = 'lazy'; im.referrerPolicy = 'no-referrer'; im.alt = '';
            im.addEventListener('error', () => { im.remove(); thumbA.classList.add('smg-fp-thumb--letter'); thumbA.textContent = tLetter; });
            thumbA.appendChild(im);
        } else { thumbA.classList.add('smg-fp-thumb--letter'); thumbA.textContent = tLetter; }
        head.appendChild(thumbA);

        const meta = document.createElement('div'); meta.className = 'smg-fp-meta';
        if (prefixesHtml) {
            const tags = document.createElement('div');
            tags.className = 'smg-fp-tags';
            tags.innerHTML = prefixesHtml;
            const seenTags = new Set();
            tags.querySelectorAll('a.labelLink, .label, .prefix, [class*="label--"], [class*="prefix"]').forEach(el => {
                if (el.parentElement && el.parentElement.closest('a.labelLink, .label, .prefix, [class*="label--"], [class*="prefix"]')) return;
                const txt = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
                if (!txt || seenTags.has(txt)) {
                    el.remove();
                    return;
                }
                seenTags.add(txt);
            });
            if (tags.firstElementChild || tags.textContent.trim()) {
                meta.appendChild(tags);
            }
        }
        const tname = document.createElement('a'); tname.className = 'smg-fp-tname'; tname.href = permalink; tname.textContent = threadTitle; meta.appendChild(tname);
        const by = document.createElement('div'); by.className = 'smg-fp-by';
        by.appendChild(document.createTextNode(i18n('post by') + ' '));
        if (author) { const au = document.createElement(authorHref ? 'a' : 'span'); au.className = 'smg-fp-byname'; if (authorHref) au.href = authorHref; au.textContent = author; by.appendChild(au); }
        if (ts) { const dot = document.createElement('span'); dot.className = 'smg-fp-dot'; dot.textContent = ' · '; by.appendChild(dot); const tm = document.createElement('span'); tm.className = 'smg-fp-time'; tm.textContent = smgRelTime(ts); by.appendChild(tm); }
        meta.appendChild(by);
        head.appendChild(meta);
        // botão de compartilhar (copia o permalink do post) — canto sup-direito do card
        const share = document.createElement('button');
        share.type = 'button'; share.className = 'smg-fp-share'; share.setAttribute('aria-label', 'Share'); share.title = i18n('Copy link');
        share.innerHTML = ICONS.share;
        share.addEventListener('click', e => {
            e.preventDefault(); e.stopPropagation();
            const url = permalink || location.href;
            const done = () => { share.innerHTML = ICONS.shareDone; share.classList.add('is-done'); setTimeout(() => { share.innerHTML = ICONS.share; share.classList.remove('is-done'); }, 1400); };
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, () => window.prompt('Copy link:', url));
            else window.prompt('Copy link:', url);
        });
        head.appendChild(share);
        card.appendChild(head);

        const c = document.createElement('div'); c.className = 'smg-fp-content message-userContent';
        if (contentHtml) { c.innerHTML = contentHtml; riverUnlazy(c); }   // injeta + des-lazya (cache velho/noscript-virou-texto) → o observer global embeda mídia + masonry
        card.appendChild(c);

        card.appendChild(buildFeedOpen(permalink));
        return card;
    }

    let riverHost = null;
    function riverContainer() {
        if (riverHost && riverHost.isConnected) return riverHost;
        const pageContent = document.querySelector('.p-body-pageContent');
        if (pageContent) {
            riverHost = pageContent;
            return riverHost;
        }
        const content = document.querySelector('.p-body-content');
        if (content) {
            riverHost = content;
            return riverHost;
        }
        const item = document.querySelector('.structItem--thread');
        const block = item && item.closest('.block');
        riverHost = (block && block.parentElement)
            || document.querySelector('.p-body-main')
            || document.querySelector('.p-body-inner') || document.querySelector('.p-body') || document.body;
        return riverHost;
    }

    // ---- RENDER (lê do banco; o sync enche em background) ----
    const RIVER_CHUNK = 15;   // posts pintados por bloco (scroll)
    let feedSyncRunning = false;
    let riverBuilt = false, riverList = null, riverSeen = null, riverLastTs = null, riverOldWm = 0,
        riverMoreEl = null, riverMoreIO = null, riverNoMore = false, riverRendering = false,
        riverPill = null, riverFirstPainted = false, riverSortDirty = true;

    function markRiverPaintReady() {
        const river = document.getElementById('smg-river');
        if (river) river.dataset.smgPaintReady = '1';
    }

    // pílula "N novos posts" (estilo Twitter): aparece quando o sync traz coisa nova e você NÃO está no topo
    function riverNearTop() { return (window.scrollY || document.documentElement.scrollTop || 0) <= 600; }
    function showPill(n) {
        if (!riverPill || !n) return;
        riverPill.querySelector('.smg-river-pill-t').textContent = n + ' ' + i18n(n === 1 ? 'new post' : 'new posts');
        riverPill.hidden = false;
    }
    function hidePill() { if (riverPill) riverPill.hidden = true; }

    function riverEmptyState(msg) {
        if (riverMoreIO) { riverMoreIO.disconnect(); riverMoreIO = null; }
        if (riverMoreEl) { riverMoreEl.remove(); riverMoreEl = null; }
        if (riverList) riverList.innerHTML = '<div class="smg-fp-empty">' + msg + '</div>';
    }
    // 1ª pintura real: troca o spinner grande (.smg-fp-loading) pela lista + monta a sentinela. Idempotente.
    // Enquanto não há post pra mostrar (cache frio + sync na rede), o spinner FICA — sem isso a lista some.
    function firstPaint() {
        if (riverFirstPainted || !riverList) return;
        riverFirstPainted = true;
        riverList.innerHTML = '';   // remove o .smg-fp-loading
        mountSentinel();
    }
    function markRiverSortDirty() { riverSortDirty = true; }
    function ensureRiverSorted() {
        if (!riverList || !riverSortDirty) return;
        const cards = Array.from(riverList.querySelectorAll('.smg-fp-card'));
        if (cards.length < 2) {
            riverSortDirty = false;
            if (cards.length) riverLastTs = +cards[0].dataset.ts || riverLastTs;
            return;
        }
        let outOfOrder = false;
        for (let i = 0; i < cards.length - 1; i++) {
            if ((+cards[i].dataset.ts || 0) < (+cards[i + 1].dataset.ts || 0)) {
                outOfOrder = true; break;
            }
        }
        if (outOfOrder) {
            cards.sort((a, b) => (+b.dataset.ts || 0) - (+a.dataset.ts || 0));
            const frag = document.createDocumentFragment();
            cards.forEach(c => frag.appendChild(c));
            if (riverMoreEl && riverMoreEl.parentNode === riverList) riverList.insertBefore(frag, riverMoreEl);
            else riverList.appendChild(frag);
        }
        const lastCard = cards[cards.length - 1];
        if (lastCard) riverLastTs = +lastCard.dataset.ts || riverLastTs;
        riverSortDirty = false;
    }

    // pinta o próximo bloco do BANCO. >0 = pintou; 0 = banco esgotado; -1 = pulado (já renderizando/fim)
    function renderNextChunk() {
        if (riverRendering || riverNoMore || !riverList) return Promise.resolve(-1);
        riverRendering = true;
        return dbTimelineGetRecent(RIVER_CHUNK, riverLastTs, null, riverSeen).then(posts => {
            riverRendering = false;
            if (!posts.length) return 0;
            firstPaint();   // só limpa o loader QUANDO há conteúdo de fato (senão o spinner segue girando)
            const frag = document.createDocumentFragment();
            const cards = [];
            posts.forEach(p => {
                const pid = p.post_id || p.postId;
                riverSeen.add(pid);
                try { const card = riverCard(p, riverOldWm); if (card) { cards.push(card); frag.appendChild(card); } } catch (e) {}
            });
            if (riverMoreEl && riverMoreEl.parentNode === riverList) riverList.insertBefore(frag, riverMoreEl); else riverList.appendChild(frag);
            markRiverSortDirty();
            ensureRiverSorted();
            const lastP = posts[posts.length - 1];
            riverLastTs = lastP.created_at || lastP.ts || 0;
            return posts.length;
        }, () => { riverRendering = false; return 0; });
    }
    // NOVIDADES (otimização de novos itens): pega os posts UNSEEN que pertencem à janela já renderizada
    function fetchFreshPosts() {
        if (!riverList || !riverSeen) return Promise.resolve([]);
        const floor = riverLastTs || 0;
        return dbTimelineGetRecent(80, null, floor || null, riverSeen).then(
            posts => posts.filter(p => !floor || (p.created_at || p.ts || 0) > floor),
            () => []
        );
    }
    // insere cada post novo na POSIÇÃO CERTA (ts desc), não só no topo → respeita captura fora de ordem.
    function insertFreshPosts(posts) {
        if (!posts || !posts.length || !riverList) return;
        const existing = riverList.querySelectorAll('.smg-fp-card');
        let inserted = false;
        posts.forEach(p => {
            const pid = p.post_id || p.postId;
            if (!pid) return;
            const pts = p.created_at || p.ts || 0;
            if (riverSeen && riverSeen.has(pid)) return;
            if (riverList.querySelector('[data-post-id="' + pid + '"]')) return;
            if (riverSeen) riverSeen.add(pid);
            let card; try { card = riverCard(p, riverOldWm); } catch (e) { return; }
            if (!card) return;
            card.classList.add('smg-fp-enter');   // entrada animada (só os recém-chegados; some após a animação)
            setTimeout(() => card.classList.remove('smg-fp-enter'), 1300);
            let ref = null;
            for (let i = 0; i < existing.length; i++) { if ((+existing[i].dataset.ts || 0) < pts) { ref = existing[i]; break; } }
            if (ref) riverList.insertBefore(card, ref);
            else if (riverMoreEl && riverMoreEl.parentNode === riverList) riverList.insertBefore(card, riverMoreEl);
            else riverList.appendChild(card);
            inserted = true;
        });
        if (inserted) { markRiverSortDirty(); ensureRiverSorted(); }
    }
    function renderMore() {
        return renderNextChunk().then(n => {
            if (n === 0) {
                if (!feedSyncRunning) { riverNoMore = true; if (riverMoreIO) { riverMoreIO.disconnect(); riverMoreIO = null; } if (riverMoreEl) { riverMoreEl.remove(); riverMoreEl = null; } }
            } else if (n > 0 && riverMoreEl && riverMoreIO) {
                riverMoreIO.unobserve(riverMoreEl); riverMoreIO.observe(riverMoreEl);   // re-observa: enche até passar a viewport (render local = barato)
            }
            return n;
        });
    }
    function mountSentinel() {
        riverMoreEl = document.createElement('button'); riverMoreEl.type = 'button'; riverMoreEl.className = 'smg-river-more';
        riverMoreEl.innerHTML = '<span class="smg-loading"></span><span class="smg-river-more-t">' + i18n('Load more') + '</span>';
        if (feedSyncRunning) riverMoreEl.classList.add('is-loading');   // montou DURANTE o sync (firstPaint roda após o kickSync) → já nasce girando
        riverMoreEl.addEventListener('click', renderMore);
        riverList.appendChild(riverMoreEl);
        riverMoreIO = new IntersectionObserver(ents => {
            ents.forEach(e => {
                if (e.isIntersecting) {
                    if (!FEATURES.infiniteScroll || !FEATURES.infiniteScrollTimeline) return;
                    renderMore();
                }
            });
        }, { rootMargin: '1200px 0px' });
        riverMoreIO.observe(riverMoreEl);
    }
    // recarrega o topo do banco (após o sync trazer novidades) — só se o usuário está perto do topo
    function refreshTop(force) {
        if (!riverList || (!force && (window.scrollY || document.documentElement.scrollTop || 0) > 600)) return;
        Array.prototype.slice.call(riverList.querySelectorAll('.smg-fp-card')).forEach(el => el.remove());
        markRiverSortDirty();
        riverSeen = new Set(); riverLastTs = null; riverNoMore = false;
        hidePill();
        if (!riverMoreEl) mountSentinel();
        renderMore();
        saveNewestWatermark();   // o usuário está vendo o topo → marca os novos como vistos
    }
    // 1ª vez (cache vazio): em vez de um spinner mudo, mostra "Configurando seu feed" + progresso enquanto o sync
    function showSetupState() {
        if (!riverList || riverFirstPainted) return;
        riverList.innerHTML =
            '<div class="smg-fp-setup">' +
                '<span class="smg-fp-setup-spin"></span>' +
                '<div class="smg-fp-setup-title">' + i18n('Setting up your feed') + '</div>' +
                '<div class="smg-fp-setup-sub">' + i18n('Reading the threads you follow…') + '</div>' +
                '<div class="smg-fp-setup-bar"><span class="smg-fp-setup-barfill"></span></div>' +
            '</div>';
        markRiverPaintReady();
    }
    // atualiza o aviso de setup ao vivo: "{done}/{total} tópicos · {added} posts" + barra de progresso. No-op após a 1ª pintura.
    function setupProgress(p) {
        if (!riverList || riverFirstPainted || !p) return;
        const sub = riverList.querySelector('.smg-fp-setup-sub');
        const fill = riverList.querySelector('.smg-fp-setup-barfill');
        if (!sub) return;
        if (p.step === 'following' || (!p.total && p.page)) {
            sub.textContent = (IS_PT
                ? 'Sincronizando tópicos seguidos… (pág ' + (p.page || 1) + ' · ' + (p.count || 0) + ' tópicos)'
                : 'Syncing followed threads… (page ' + (p.page || 1) + ' · ' + (p.count || 0) + ' threads)');
            if (fill) fill.style.width = '20%';
            return;
        }
        if (p.total) {
            sub.textContent = p.done + '/' + p.total + ' ' + (IS_PT ? 'tópicos' : 'threads') + ' · ' + (p.added || 0) + ' ' + (IS_PT ? 'posts' : 'posts');
            if (fill) fill.style.width = Math.round((p.done / p.total) * 100) + '%';
        }
    }
    function buildRiver() {
        if (riverBuilt || document.getElementById('smg-river')) return;
        riverBuilt = true;

        const wrap = document.createElement('div'); wrap.id = 'smg-river'; wrap.dataset.smgPaintReady = '0';
        const fhead = document.createElement('div'); fhead.className = 'smg-river-head';
        fhead.innerHTML = '<h1 class="smg-river-title">Timeline</h1><div class="smg-river-head-actions"></div>';
        const refBtn = document.createElement('button');
        refBtn.type = 'button';
        refBtn.className = 'smg-river-refresh smg-btn smg-btn--ghost';
        refBtn.title = (typeof IS_PT !== 'undefined' && IS_PT) ? 'Atualizar timeline' : 'Refresh timeline';
        refBtn.setAttribute('aria-label', refBtn.title);
        refBtn.innerHTML = (typeof ICONS !== 'undefined' && ICONS.refresh) ? ICONS.refresh : '↻';
        refBtn.addEventListener('click', () => {
            console.log('[SMG Timeline] Botão de atualizar clicado.');
            kickSync(null, true);
        });
        const actions = fhead.querySelector('.smg-river-head-actions');
        if (actions) {
            const markAllBtn = document.createElement('button');
            markAllBtn.type = 'button';
            markAllBtn.className = 'smg-river-markread smg-btn smg-btn--ghost';
            markAllBtn.title = (typeof IS_PT !== 'undefined' && IS_PT) ? 'Marcar tudo como lido' : 'Mark all as read';
            markAllBtn.setAttribute('aria-label', markAllBtn.title);
            markAllBtn.innerHTML = (typeof ICONS !== 'undefined' && ICONS.checkAll) ? ICONS.checkAll : '✓✓';
            markAllBtn.addEventListener('click', () => {
                saveNewestWatermark();
                if (riverList) riverList.querySelectorAll('.smg-fp-card.is-unread').forEach(c => c.classList.remove('is-unread'));
                if (typeof dbFollowedMarkAllSeen === 'function') {
                    dbFollowedMarkAllSeen();
                }
            });
            actions.appendChild(markAllBtn);
            actions.appendChild(refBtn);
        }
        wrap.appendChild(fhead);
        riverList = document.createElement('div'); riverList.className = 'smg-fp-list';
        wrap.appendChild(riverList);
        riverPill = document.createElement('button'); riverPill.type = 'button'; riverPill.className = 'smg-river-pill'; riverPill.hidden = true;
        riverPill.innerHTML = ICONS.show + '<span class="smg-river-pill-t"></span>';
        riverPill.addEventListener('click', () => {
            refreshTop(true);
            window.scrollTo(0, 0);
            if (typeof syncTimeline === 'function') {
                syncTimeline().catch(() => {});
            }
        });
        wrap.appendChild(riverPill);
        const host = riverContainer();
        host.appendChild(wrap);

        riverSeen = new Set(); riverLastTs = null; riverNoMore = false; riverOldWm = riverWatermark();
        const cutoff = Math.floor(Date.now() / 1000) - RIVER_WINDOW_DAYS * 86400;

        showSetupState();

        // SELF-HEAL: se o formato do cache mudou (FEED_DATA_VERSION bumpado), descarta e reconstrói ANTES de ler → a mudança reflete sozinha
        fdbEnsureVersion(FEED_DATA_VERSION).then(() => fdbEnsureSyncVersion(FEED_SYNC_VERSION)).then(() => dbTimelineCount()).then(count => {
            if (count > 0) {
                renderMore().then(() => {
                    const cardsCount = riverList ? riverList.querySelectorAll('.smg-fp-card').length : 0;
                    if (cardsCount === 0) {
                        showSetupState();
                        kickSync(cutoff, true);
                    } else {
                        markRiverPaintReady();
                        kickSync(cutoff, false);
                    }
                });
            } else {
                showSetupState();
                kickSync(cutoff, true);
            }
        }).catch(() => {
            showSetupState();
            kickSync(cutoff, true);
        });
    }
    function saveNewestWatermark() { dbTimelineGetRecent(1, null, null).then(top => { if (top.length) riverSetWatermark(top[0].created_at || top[0].ts || 0); }); }
    // depois de cada sync: pinta o cache se estava vazio; senão detecta NOVIDADES
    function afterSync() {
        return dbTimelineCount().catch(() => 0).then(count => {
            const emptyMsg = IS_PT
                ? 'Nenhum post recente encontrado nos seus tópicos seguidos'
                : 'No recent posts found in your followed threads';

            if (!count) {
                riverEmptyState(emptyMsg);
                markRiverPaintReady();
                return;
            }
            if (!riverSeen || !riverSeen.size) {
                return renderMore().then(() => {
                    const cardsCount = riverList ? riverList.querySelectorAll('.smg-fp-card').length : 0;
                    if (cardsCount === 0) {
                        riverEmptyState(emptyMsg);
                    } else {
                        ensureRiverSorted();
                        saveNewestWatermark();
                    }
                    markRiverPaintReady();
                });
            }
            return fetchFreshPosts().then(fresh => {
                const cardsCount = riverList ? riverList.querySelectorAll('.smg-fp-card').length : 0;
                if (!fresh.length) {
                    if (cardsCount === 0) {
                        riverEmptyState(emptyMsg);
                    }
                    ensureRiverSorted();
                    if (cardsCount > 0 || riverList?.querySelector('.smg-fp-empty')) markRiverPaintReady();
                    return;
                }
                if (riverNearTop()) { insertFreshPosts(fresh); saveNewestWatermark(); }   // insere em ordem (preserva scroll + cards de baixo)
                else showPill(fresh.length);   // longe do topo → pílula (não marca visto → highlight preservado)
                ensureRiverSorted();
            });
        });
    }
    // base canônica + título da thread ABERTA (página de thread). '' se não for uma thread.
    function feedCurrentThread() {
        if (!/\/threads\//.test(location.pathname)) return null;
        const canon = document.querySelector('link[rel="canonical"]');
        let raw = (canon && canon.getAttribute('href')) || location.href;
        const base = canonicalThreadPath(raw);
        if (!base) return null;
        const titleEl = document.querySelector('h1.p-title-value, .p-title-value, h1.contentRow-header, .p-body-header .p-title');
        const title = titleEl ? extractCleanTitleAndPrefixes(titleEl).title : '';
        return { base: base, title: title };
    }
    function harvestCurrentThreadPage() {
        return ingestCurrentThreadPageIfFollowed();
    }

    function feedAddCurrentThread() {
        return ingestCurrentThreadPageIfFollowed();
    }
    // DEIXAR DE SEGUIR → tira a thread (e os posts dela) do banco
    function feedRemoveCurrentThread() {
        const c = feedCurrentThread(); if (!c) return Promise.resolve();
        return dbFollowedDelete(c.base);
    }
    let lastTimelineSyncTime = 0;

    function kickSync(cutoff, cold) {
        if (cutoff == null) {
            cutoff = Math.floor(Date.now() / 1000) - RIVER_WINDOW_DAYS * 86400;
        }
        lastTimelineSyncTime = Date.now();
        feedSyncRunning = true;
        if (riverMoreEl) riverMoreEl.classList.add('is-loading');
        const opts = {
            force: cold,
            onProgress: cold ? setupProgress : null,
            onBatch: addedCount => {
                if (riverList && addedCount > 0 && riverList.querySelector('.smg-fp-setup')) {
                    firstPaint();
                    renderMore();
                } else if (riverList && (!riverSeen || !riverSeen.size)) {
                    renderMore();
                } else if (riverList && addedCount) {
                    fetchFreshPosts().then(fresh => {
                        if (fresh.length && riverNearTop()) insertFreshPosts(fresh);
                    });
                }
            }
        };
        const doSync = () => {
            return syncTimeline(opts)
                .then(() => {
                    feedSyncRunning = false;
                    if (riverMoreEl) riverMoreEl.classList.remove('is-loading');
                    return afterSync();
                })
                .catch(() => {
                    feedSyncRunning = false;
                    if (riverMoreEl) riverMoreEl.classList.remove('is-loading');
                    // The custom setup state is a valid terminal view when the
                    // network is unavailable; never fall back to the native page.
                    markRiverPaintReady();
                });
        };

        if (cold) {
            if (typeof fetchAndIngestFollowed === 'function') {
                fetchAndIngestFollowed(false, false).catch(() => 0).finally(doSync);
            } else {
                doSync();
            }
        } else {
            const getFollowed = (typeof dbFollowedGetAll === 'function') ? dbFollowedGetAll() : Promise.resolve([]);
            getFollowed.then(items => {
                if (!items || !items.length) {
                    if (typeof fetchAndIngestFollowed === 'function') {
                        return fetchAndIngestFollowed(false, false).catch(() => 0).finally(doSync);
                    }
                }
                doSync();
            }).catch(() => {
                doSync();
            });
        }
    }
    // POLLING: enquanto o feed está visível, re-sincroniza
    const FEED_POLL_INTERVAL_MS = 300000; // 5 minutos (evita sobrecarga e HTTP 429)
    let feedPollTimer = null;
    function feedPoll() {
        if (typeof riverPauseUntil !== 'undefined' && Date.now() < riverPauseUntil) return;
        if (typeof riverAborted !== 'undefined' && riverAborted) return;
        if (document.hidden || !riverList || !riverList.isConnected || feedSyncRunning) return;
        feedSyncRunning = true;
        lastTimelineSyncTime = Date.now();
        syncTimeline({
            onBatch: addedCount => {
                if (riverList && addedCount > 0 && riverList.querySelector('.smg-fp-setup')) {
                    firstPaint();
                    renderMore();
                } else if (riverList && (!riverSeen || !riverSeen.size)) {
                    renderMore();
                } else if (riverList && addedCount) {
                    fetchFreshPosts().then(fresh => {
                        if (fresh.length && riverNearTop()) insertFreshPosts(fresh);
                    });
                }
            }
        }).then(() => afterSync()).catch(() => {}).finally(() => {
            feedSyncRunning = false;
        });
    }
    function feedVisPoll() {
        if (document.hidden) return;
        if (typeof riverPauseUntil !== 'undefined' && Date.now() < riverPauseUntil) return;
        if (typeof riverAborted !== 'undefined' && riverAborted) return;
        feedPoll();
    }
    function feedStartPoll() {
        if (feedPollTimer) return;
        feedPollTimer = setInterval(() => {
            if (typeof riverPauseUntil !== 'undefined' && Date.now() < riverPauseUntil) return;
            if (typeof riverAborted !== 'undefined' && riverAborted) return;
            feedPoll();
        }, FEED_POLL_INTERVAL_MS);
        document.addEventListener('visibilitychange', feedVisPoll);
    }
    function feedStopPoll() {
        if (feedPollTimer) { clearInterval(feedPollTimer); feedPollTimer = null; }
        document.removeEventListener('visibilitychange', feedVisPoll);
    }

    // ---- ativa o modo feed (home ?view=feed) ----  (sem tabbar: a saída é o logo/Home da topbar)
    function applyRiverMode(mode) {
        const feed = mode === 'feed';
        document.documentElement.classList.toggle('smg-watched-feed', feed);
        const host = riverContainer();
        if (host && host.children) {
            Array.prototype.forEach.call(host.children, ch => {
                if (ch.id === 'smg-river') return;
                ch.classList.toggle('smg-river-hide', feed);
            });
        }
        const content = document.querySelector('.p-body-content');
        if (content && content !== host) {
            Array.prototype.forEach.call(content.children, ch => {
                if (ch.contains(host) || ch.id === 'smg-river') return;
                ch.classList.toggle('smg-river-hide', feed);
            });
        }
        const pageContent = document.querySelector('.p-body-pageContent');
        if (pageContent && pageContent !== host) {
            Array.prototype.forEach.call(pageContent.children, ch => {
                if (ch.contains(host) || ch.id === 'smg-river') return;
                ch.classList.toggle('smg-river-hide', feed);
            });
        }
        if (feed) { buildRiver(); feedStartPoll(); } else feedStopPoll();
    }
    let riverSetupDone = false;
    function setupFeedView() {
        if (riverSetupDone) return;
        if (!feedContext()) return;
        riverSetupDone = true;
        if (feedViewWanted()) applyRiverMode('feed');   // home + ?view=feed → monta o river; senão home normal (nada)
    }

    function handleTimelineFocusOrVisibility() {
        if (document.hidden) return;
        const onTimeline = (riverList && riverList.isConnected && document.documentElement.classList.contains('smg-watched-feed')) || (typeof feedViewWanted === 'function' && feedViewWanted());
        if (!onTimeline) return;
        const now = Date.now();
        if (now - lastTimelineSyncTime > 30000) {
            kickSync();
        }
    }
    document.addEventListener('visibilitychange', handleTimelineFocusOrVisibility);
    window.addEventListener('focus', handleTimelineFocusOrVisibility);


    window.addEventListener('smg-timeline-sync-done', () => {
        if (!riverList) return;
        if (!riverSeen || !riverSeen.size) {
            afterSync();
            return;
        }
        fetchFreshPosts().then(fresh => {
            if (!fresh || !fresh.length) return;
            if (riverNearTop()) {
                insertFreshPosts(fresh);
                saveNewestWatermark();
            } else {
                showPill(fresh.length);
            }
            ensureRiverSorted();
        });
    });

    if (typeof window !== 'undefined' && window.__TEST_MODE__) {
        window.__feedExports = {
            get feedSyncRunning() { return feedSyncRunning; },
            set feedSyncRunning(v) { feedSyncRunning = v; },
            mountSentinel,
            firstPaint,
            showSetupState,
            markRiverPaintReady,
            ensureRiverSorted,
            insertFreshPosts,
            fetchFreshPosts,
            showPill,
            afterSync,
            riverNearTop,
            get riverList() { return riverList; },
            set riverList(v) { riverList = v; riverSortDirty = true; },
            get riverSortDirty() { return riverSortDirty; },
            set riverSortDirty(v) { riverSortDirty = !!v; },
            markRiverSortDirty,
            get riverSeen() { return riverSeen; },
            set riverSeen(v) { riverSeen = v; },
            get riverMoreEl() { return riverMoreEl; },
            set riverMoreEl(v) { riverMoreEl = v; },
            get riverLastTs() { return riverLastTs; },
            set riverLastTs(v) { riverLastTs = v; },
            renderMore,
            kickSync,
            feedPoll,
            FEED_DATA_VERSION,
            FEED_SYNC_VERSION,
            RIVER_CONCURRENCY,
            RIVER_DELAY_MS,
            riverHandle429,
            riverAbortSync,
            get riverAborted() { return riverAborted; },
            set riverAborted(v) { riverAborted = v; if (typeof window !== 'undefined') window.__riverAborted = v; },
            get riverQueue() { return riverQueue; },
            get riverPauseUntil() { return riverPauseUntil; },
            set riverPauseUntil(v) { riverPauseUntil = v; },
            get riverFirstPainted() { return riverFirstPainted; },
            set riverFirstPainted(v) { riverFirstPainted = v; },
            get lastTimelineSyncTime() { return lastTimelineSyncTime; },
            set lastTimelineSyncTime(v) { lastTimelineSyncTime = v; },
            handleTimelineFocusOrVisibility,
            riverCard,
            riverThreadMeta,
            riverParsePost,
            isThreadPostElement,
            buildRiver
        };
    }
