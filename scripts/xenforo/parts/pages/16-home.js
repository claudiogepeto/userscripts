    // =========================================================
    // HOME (forum_list): cards · sections · sub-fóruns · atalhos · sidebar
    // (obs: buildFilterBars=THREAD/barra e buildTopbar=TOPBAR ficam logo abaixo deste grupo)
    //
    // Mapa: mergeSmallHomeSections · relocateSimpcityNodes(SC)/relocateSmgNodes(SMG) · expandSubForums ·
    //   splitTransSection(SC) · sortHomeCards · reorderHomeSections · makeHomeCardsClickable ·
    //   buildHomeFeed (+feedThumbUrl/feedCard/loadFeed) · layoutHomeSidebar
    // =========================================================

    // Assinatura barata da estrutura que as passagens de layout realmente usam. O INIT compara esse valor
    // antes de disparar os scans/movimentos globais; mutações de widgets, players e textos fora das categorias
    // não reexecutam a organização da home.
    function homeLayoutSignature() {
        return Array.from(document.querySelectorAll('.p-body-content .block--category')).map(category => {
            const title = (category.querySelector('.block-header') || {}).textContent || '';
            const nodes = Array.from(category.querySelectorAll(':scope > .block-container > .block-body > .node')).map(node => {
                const link = node.querySelector('.node-title a, a[href]');
                const subLinks = Array.from(node.querySelectorAll('.node-subNodesFlat .subNodeLink')).map(sub => (sub.getAttribute('href') || '') + ':' + sub.textContent.trim()).join(',');
                return (link ? link.getAttribute('href') : '') + ':' + ((node.querySelector('.node-title') || {}).textContent || '').trim() + '{' + subLinks + '}';
            });
            return title.replace(/\s+/g, ' ').trim() + '[' + nodes.join('|') + ']';
        }).join('||');
    }

    // home: junta sections pequenas (≤3 cards reais) consecutivas numa só
    // (ex.: Info/Promoção/Requests do simpcity, cada uma com 1 card → 1 section)
    function mergeSmallHomeSections(roots) {
        if (!document.documentElement.classList.contains('smg-home')) return;
        const cats = Array.prototype.slice.call(
            document.querySelectorAll('.p-body-content .block--category'));
        if (cats.length < 2) return;
        // conta só nós "reais" (fórum/categoria), ignora os .node--link (ads, já escondidos)
        const realCount = b => b.querySelectorAll('.block-body .node:not(.node--link)').length;
        let i = 0;
        while (i < cats.length) {
            if (realCount(cats[i]) === 0 || realCount(cats[i]) > 3) { i++; continue; }
            const baseBody = cats[i].querySelector('.block-body');
            let j = i + 1;
            while (j < cats.length && realCount(cats[j]) > 0 && realCount(cats[j]) <= 3) {
                const body = cats[j].querySelector('.block-body');
                if (baseBody && body) {
                    const moved = document.createDocumentFragment();
                    while (body.firstChild) moved.appendChild(body.firstChild);
                    baseBody.appendChild(moved);
                }
                cats[j].remove();
                j++;
            }
            i = j;
        }
    }

    // simpcity: move OnlyFans / Patreon / ManyVids pra dentro da section "Social Media"
    function relocateSimpcityNodes(roots) {
        if (!document.documentElement.classList.contains('smg-sc')
            || !document.documentElement.classList.contains('smg-home')) return;
        const cats = document.querySelectorAll('.p-body-content .block--category');
        if (!cats.length) return;
        let social = null;
        cats.forEach(c => {
            const h = c.querySelector('.block-header');
            if (h && /social\s*media/i.test(h.textContent || '')) social = c;
        });
        if (!social) return;
        const socialBody = social.querySelector('.block-body');
        if (!socialBody) return;
        const moved = document.createDocumentFragment();
        document.querySelectorAll('.p-body-content .block--category .node:not([data-smg-sc-reloc-checked])').forEach(node => {
            if (social.contains(node)) return;
            const a = node.querySelector('.node-title a') || node.querySelector('a[href]');
            const href = a ? (a.getAttribute('href') || '') : '';
            // A streamed node can exist before its title/link. Leave it eligible for
            // the next pass instead of permanently checking an incomplete shell.
            if (!a || !href) return;
            node.dataset.smgScRelocChecked = '1';
            if (/onlyfans|patreon|manyvids/i.test(href)) {
                node.dataset.smgScRelocated = '1';
                moved.appendChild(node);
            }
        });
        if (moved.childNodes.length) socialBody.appendChild(moved);
    }

    // home: promove sub-fóruns (node-subNodesFlat) a cards próprios na grade (SMG + simpcity)
    function expandSubForums(roots) {
        if (!document.documentElement.classList.contains('smg-home')) return;
        const flats = document.querySelectorAll('.p-body-content .block--category .node .node-subNodesFlat:not([data-smg-expanded])');
        if (!flats.length) return;
        const isSc = document.documentElement.classList.contains('smg-sc');
        // svg de fallback (balão) — inline, sempre renderiza (o <i> da FA usa <use> externo e falhava)
        const fallbackSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
        flats.forEach(flat => {
            const parentNode = flat.closest('.node');
            if (!parentNode || !parentNode.parentElement) return;
            const links = Array.from(flat.querySelectorAll('.subNodeLink'));
            // The forum list is streamed. An empty shell is not an expanded list yet.
            if (!links.length) return;
            flat.dataset.smgExpanded = '1';
            const parentTitleEl = parentNode.querySelector('.node-title');
            const parentTitle = parentTitleEl ? (parentTitleEl.textContent || '').trim() : '';
            const cards = document.createDocumentFragment();
            links.forEach(link => {
                const href = link.getAttribute('href') || '';
                const img = link.querySelector('img');
                // só o texto do sub-fórum (sem o ícone)
                let text = '';
                link.childNodes.forEach(n => { if (n.nodeType === 3) text += n.textContent; });
                text = (text || link.textContent || '').trim();
                const card = document.createElement('div');
                card.className = 'node node--forum smg-subcard';
                card.dataset.smgParentTitle = parentTitle; // origem (p/ split trans/brasil)
                card.innerHTML = '<div class="node-body"><span class="node-icon" aria-hidden="true"></span>'
                    + '<div class="node-main"><h3 class="node-title"></h3></div></div>';
                // ícone: logo real (img) · no simpcity tenta o ícone do nó (/static/icons/nodes/ID.png) · fallback balão
                const iconSpan = card.querySelector('.node-icon');
                const setFallback = () => { iconSpan.innerHTML = fallbackSvg; };
                const addImg = src => { const im = document.createElement('img'); im.alt = ''; im.onerror = setFallback; im.src = src; iconSpan.appendChild(im); };
                const imgSrc = img ? (img.getAttribute('data-src') || img.getAttribute('src') || '') : '';
                const idMatch = href.match(/\.(\d+)\/?(?:[?#]|$)/);
                if (imgSrc) addImg(imgSrc);
                else if (isSc && idMatch) addImg('/static/icons/nodes/' + idMatch[1] + '.png');
                else setFallback();
                const a = document.createElement('a');
                a.href = href; a.textContent = text;
                card.querySelector('.node-title').appendChild(a);
                cards.appendChild(card);
            });
            parentNode.parentNode.insertBefore(cards, parentNode.nextSibling);
            flat.remove(); // tira a lista de subitems do card pai
        });
    }

    // simpcity: separa a section "Transgender" por ORIGEM →
    //   fica: o nó Transgender + os sub-fóruns DELE
    //   vai pro "Brasil": o nó Brasileiras + sub-fóruns dele (inclui "Trans" e "Trans (Área de Pedidos)")
    function splitTransSection(roots) {
        if (!document.documentElement.classList.contains('smg-sc')
            || !document.documentElement.classList.contains('smg-home')) return;
        const cats = document.querySelectorAll('.p-body-content .block--category');
        let transCat = null;
        cats.forEach(c => {
            const h = c.querySelector('.block-header');
            if (h && /trans(gender)?/i.test(h.textContent || '')) transCat = c;
        });
        if (!transCat) return;
        const body = transCat.querySelector('.block-body');
        if (!body) return;
        const allNodes = Array.prototype.slice.call(body.querySelectorAll('.node'));
        // nó pai "Transgender" (real, não subcard)
        const transNode = allNodes.find(n => !n.classList.contains('smg-subcard')
            && /transgender/i.test((n.querySelector('.node-title') || {}).textContent || ''));
        const keepTitle = transNode ? (transNode.querySelector('.node-title').textContent || '').trim() : '';
        const nonTrans = allNodes.filter(n => {
            if (n === transNode) return false;                                   // mantém o nó Transgender
            if (n.classList.contains('smg-subcard')) return n.dataset.smgParentTitle !== keepTitle; // mantém sub-fóruns do Transgender
            return true;                                                          // outros nós reais (Brasileiras) → Brasil
        });
        if (!nonTrans.length) return;
        let brasil = document.querySelector('.p-body-content .block--category[data-smg-trans-split]');
        if (!brasil) {
            brasil = document.createElement('div');
            brasil.className = 'block block--category';
            brasil.dataset.smgTransSplit = '1';
            brasil.innerHTML = '<h2 class="block-header"><div class="uix_categoryStrip-content">'
                + '<span class="uix_categoryTitle">Brasil</span></div></h2>'
                + '<div class="block-container"><div class="block-body"></div></div>';
        }
        const brasilBody = brasil.querySelector('.block-body');
        const moved = document.createDocumentFragment();
        nonTrans.forEach(n => moved.appendChild(n));
        brasilBody.appendChild(moved);
        if (!brasil.parentNode) transCat.insertAdjacentElement('afterend', brasil);
    }

    // home: ordena os cards de cada section em ordem alfabética
    let homeSortSignature = '';
    function sortHomeCards(roots) {
        if (!document.documentElement.classList.contains('smg-home')) return;
        const bodies = document.querySelectorAll('.p-body-content .block--category .block-body');
        if (!bodies.length) return;
        const key = n => ((n.querySelector('.node-title') || {}).textContent || '').trim().toLowerCase();
        const signature = Array.from(bodies).map(body => Array.from(body.querySelectorAll(':scope > .node')).map(key).join('|')).join('||');
        if (signature === homeSortSignature) return;
        homeSortSignature = signature;
        bodies.forEach(body => {
            const nodes = Array.prototype.slice.call(body.querySelectorAll(':scope > .node'));
            if (nodes.length < 2) return;
            nodes.sort((a, b) => key(a).localeCompare(key(b), 'pt', { numeric: true, sensitivity: 'base' }));
            const sorted = document.createDocumentFragment();
            nodes.forEach(n => sorted.appendChild(n));
            body.appendChild(sorted);
        });
    }

    // home: manda "Info and Links" e "Announcements" pro fim (penúltimas sections)
    let homeSectionOrder = '';
    function reorderHomeSections(roots) {
        if (!document.documentElement.classList.contains('smg-home')) return;
        const cats = Array.prototype.slice.call(document.querySelectorAll('.p-body-content .block--category'));
        if (cats.length < 2) return;
        const titleOf = c => ((c.querySelector('.block-header') || {}).textContent || '').trim();
        const moveRe = /info and links|announcements|informações e links|anúncios/i;
        const toMove = cats.filter(c => moveRe.test(titleOf(c)));
        const keep = cats.filter(c => !moveRe.test(titleOf(c)));
        if (!toMove.length || !keep.length) return;
        const order = cats.map(c => titleOf(c)).join('|');
        const desired = keep.concat(toMove).map(c => titleOf(c)).join('|');
        if (order === desired || homeSectionOrder === desired) return;
        homeSectionOrder = desired;
        // manda as sections "Info and links / Announcements" pro FIM (depois da última section normal),
        // preservando a ordem entre elas — o anchor avança a cada inserção.
        const anchor = keep[keep.length - 1]; // âncora: última section "normal"
        const moved = document.createDocumentFragment();
        toMove.forEach(m => moved.appendChild(m));
        anchor.parentNode.insertBefore(moved, anchor.nextSibling);
    }

    // home: card inteiro clicável (navega pro link do título)
    function makeHomeCardsClickable(roots) {
        if (!document.documentElement.classList.contains('smg-home')) return;
        document.querySelectorAll('.p-body-content .block--category .node:not([data-smg-click])').forEach(node => {
            const a = node.querySelector('.node-title a');
            const href = a ? a.getAttribute('href') : '';
            if (!href) return;
            node.dataset.smgClick = '1';   // guard no seletor: NodeList vazia uma vez processados
            node.addEventListener('click', e => {
                if (e.target.closest('a')) return; // links reais funcionam normal
                window.location.href = href;
            });
        });
    }

    let homeSidebarDone = false;

    // home: FEED com abas (Latest posts · Trending). Cada aba busca sua fonte
    // (/whats-new/posts/, trending), parseia .structItem--thread e monta
    // um grid de cards verticais (thumb + título + último autor · data). Lazy: só busca a aba ativa.
    let homeFeedDone = false;
    let homeFeedReady = false;

    function markHomeFeedReady() {
        homeFeedReady = true;
    }

    function homeComponentsReady() {
        return homeSidebarDone && homeFeedDone && homeFeedReady;
    }
    // URL da thumbnail da THREAD (não do avatar): dcThumbnail tem em background-image; dtt no src.
    function feedThumbUrl(it) {
        const ic = it.querySelector('.structItem-cell--icon:not(.structItem-cell--iconEnd)');
        if (!ic) return '';
        const img = ic.querySelector('.dcThumbnail img, .dtt-thread-thumbnail img, img');
        if (!img) return '';
        const bg = (img.style.backgroundImage || '').match(/url\(['"]?([^'")]+)['"]?\)/i);
        const u = (bg && bg[1]) || img.getAttribute('data-src') || img.getAttribute('src') || '';
        return /^data:/.test(u) ? '' : u;
    }
    // monta 1 card vertical a partir de um .structItem--thread
    function feedCard(it, phMark) {
        const titleCell = it.querySelector('.structItem-title');
        const titleLink = titleCell && titleCell.querySelector('a[href*="/threads/"]');
        if (!titleLink) return null;
        const card = document.createElement('a');
        card.className = 'smg-feed-card';
        // href → último post (newest) p/ cair na última página da thread; cai pro /latest se não achar o link da data
        const lastA = it.querySelector('a.structItem-latestDate[href], .structItem-cell--latest a[href*="/post-"]');
        card.href = safeHref((lastA && lastA.getAttribute('href'))
            || (titleLink.getAttribute('href').replace(/\/(unread|latest|page-\d+|post-\d+).*$/, '').replace(/\/$/, '') + '/latest'));
        // thumb: imagem real (com onerror → placeholder da marca, p/ cobrir .su morto)
        const thumb = document.createElement('div'); thumb.className = 'smg-feed-card-thumb';
        const url = feedThumbUrl(it);
        if (url) {
            const im = document.createElement('img'); im.loading = 'lazy'; im.src = url;
            im.addEventListener('error', () => { thumb.classList.add('smg-feed-noimg'); thumb.innerHTML = phMark; });
            thumb.appendChild(im);
        } else { thumb.classList.add('smg-feed-noimg'); thumb.innerHTML = phMark; }
        // título: prefixos (spans) + texto
        const body = document.createElement('div'); body.className = 'smg-feed-card-body';
        const title = document.createElement('div'); title.className = 'smg-feed-card-title';
        titleCell.querySelectorAll('.label, .prefix').forEach(s => { title.appendChild(s.cloneNode(true)); title.appendChild(document.createTextNode(' ')); });
        title.appendChild(document.createTextNode(titleLink.textContent.trim()));
        body.appendChild(title);
        // meta: último autor · data (.structItem-latestDate mantém o texto PT do site)
        const lastUser = it.querySelector('.structItem-cell--latest .username');
        const time = it.querySelector('.structItem-latestDate') || it.querySelector('.structItem-cell--latest time');
        const metaTxt = [lastUser && lastUser.textContent.trim(), time && time.textContent.trim()].filter(Boolean).join(' · ');
        if (metaTxt) { const meta = document.createElement('div'); meta.className = 'smg-feed-card-meta'; meta.textContent = metaTxt; body.appendChild(meta); }
        card.append(thumb, body);
        return card;
    }
    // threads "ruído" p/ um carrossel VISUAL: chat/bate-papo, guias, pedidos de identificação, discussões, perguntas (sem mídia própria).
    // Filtra pelo PREFIXO (chip do título) OU pelo FÓRUM de origem — nunca pelo texto do título (senão tira post legítimo).
    function isIgnoredThread(it) {
        if (!it) return false;
        // \bchat\b casa "Simp Chat" mas NÃO "Chaturbate"; bate-papo = chat em PT; guide(s); identi(fy/ty); discuss(ion); question(s); tool(s)
        const IGNORE_RE = /\bchat\b|bate[-\s]?papo|\bguides?\b|\bidenti|\bdiscuss|\bquestions?\b|\btools?\b/i;
        const titleCell = it.querySelector('.structItem-title');
        if (titleCell) {
            const labels = titleCell.querySelectorAll('.label, .labelLink, .prefix, [class*="label--"]');
            for (let i = 0; i < labels.length; i++) if (IGNORE_RE.test(labels[i].textContent || '')) return true;
        }
        const forumA = it.querySelector('a[href*="/forums/"]');   // link do fórum de origem (onde quer que o tema o ponha)
        if (forumA && IGNORE_RE.test((forumA.textContent || '') + ' ' + (forumA.getAttribute('href') || ''))) return true;
        return false;
    }
    // ---- carrossel: 1ª carga + PAGINAÇÃO por scroll (busca a próxima página ao chegar perto da borda direita) ----
    const FEED_SKEL_CARD = '<div class="smg-feed-card smg-feed-skel"><div class="smg-feed-card-thumb smg-skel-box"></div><div class="smg-feed-card-body"><div class="smg-skel-line"></div><div class="smg-skel-line"></div><div class="smg-skel-line smg-skel-line--short"></div><div class="smg-skel-line smg-skel-line--meta"></div></div></div>';
    const FEED_MAX = 120;   // teto de cards por aba (evita DOM/imagens crescendo sem fim)
    const feedKeyOf = a => (a.getAttribute('href') || '').replace(/\/(unread|latest|post-\d+|page-\d+).*$/, '').replace(/\/$/, '');
    // URL da PRÓXIMA página (paginação XF): rel=next no <head> ou o anchor "próxima" do pageNav. Absolutiza.
    function feedNextUrl(doc) {
        const ln = doc.querySelector('link[rel="next"]');
        let href = ln ? ln.getAttribute('href') : '';
        if (!href) { const nx = doc.querySelector('.pageNav-jump--next'); href = nx ? nx.getAttribute('href') : ''; }
        if (!href) return '';
        try { return new URL(href, location.href).href; } catch (e) { return ''; }
    }
    // renderiza UMA página de structItems no painel (dedup por feed._seen, sem chat). append=false limpa antes.
    // devolve o nº de cards ADICIONADOS nesta página.
    function feedRenderPage(doc, feed, panel, phMark, append) {
        const frag = document.createDocumentFragment();
        let n = 0;
        doc.querySelectorAll('.structItem--thread').forEach(it => {
            const tl = it.querySelector('.structItem-title a[href*="/threads/"]');
            if (!tl) return;
            if (isIgnoredThread(it)) return;   // pula chat/bate-papo, guia, identify, discussão
            const k = feedKeyOf(tl); if (feed._seen.has(k)) return; feed._seen.add(k);
            const c = feedCard(it, phMark); if (c) { frag.appendChild(c); n++; }
        });
        if (!append) panel.innerHTML = '';
        if (n) panel.appendChild(frag);
        return n;
    }
    // 1ª carga da aba: skeletons → página 1 → renderiza + guarda a próxima URL. Idempotente.
    function loadFeed(feed, panel, phMark, onDone) {
        if (panel.dataset.loaded) { if (onDone) onDone(); return; }
        panel.dataset.loaded = '1';
        feed._seen = new Set(); feed._nextUrl = ''; feed._loadingMore = false;
        panel.innerHTML = FEED_SKEL_CARD.repeat(8);
        const loadToken = (feed._loadToken || 0) + 1;
        feed._loadToken = loadToken;
        const isCurrentLoad = () => feed._loadToken === loadToken;
        const finish = () => {
            if (feed._readyTimer) clearTimeout(feed._readyTimer);
            feed._readyTimer = 0;
            markHomeFeedReady();
            if (onDone) onDone();
        };
        // A failed or stalled endpoint must not leave the whole home behind the
        // first-paint barrier forever. Turn the local skeleton into an explicit
        // error state, then let the rest of the composition be revealed.
        const timeout = setTimeout(() => {
            if (!isCurrentLoad() || !panel.dataset.loaded) return;
            // Invalidate the request before exposing the page. A slow response may still
            // resolve after the timeout; it must not repaint this panel over the settled
            // composition or call the ready callback a second time.
            feed._loadToken++;
            panel.dataset.loaded = '';
            panel.innerHTML = '<div class="smg-feed-loading">' + i18n('Couldn’t load.') + '</div>';
            finish();
        }, 3200);
        feed._readyTimer = timeout;
        fetchDoc(feed.url, { credentials: 'same-origin' })
            .then(doc => {
                if (!isCurrentLoad()) return;
                const n = feedRenderPage(doc, feed, panel, phMark, false);
                feed._nextUrl = n ? feedNextUrl(doc) : '';
                if (!n) panel.innerHTML = '<div class="smg-feed-loading">' + i18n('Nothing here yet.') + '</div>';
                finish();
            })
            .catch(() => {
                if (!isCurrentLoad()) return;
                panel.dataset.loaded = '';
                panel.innerHTML = '<div class="smg-feed-loading">' + i18n('Couldn’t load.') + '</div>';
                finish();
            });
    }
    // PAGINAÇÃO: busca a próxima página e dá APPEND (chamada ao chegar perto da borda direita do scroll).
    function loadMoreFeed(feed, panel, phMark, onDone) {
        if (!feed || !feed._nextUrl || feed._loadingMore) return;
        if (panel.querySelectorAll('.smg-feed-card:not(.smg-feed-skel)').length >= FEED_MAX) { feed._nextUrl = ''; return; }   // teto: para de paginar
        feed._loadingMore = true;
        const url = feed._nextUrl;
        const skels = [];   // skeletons à direita enquanto busca
        for (let i = 0; i < 4; i++) { const d = document.createElement('div'); d.innerHTML = FEED_SKEL_CARD; const el = d.firstChild; panel.appendChild(el); skels.push(el); }
        fetchDoc(url, { credentials: 'same-origin' }).then(doc => {
            skels.forEach(s => s.remove());
            const n = feedRenderPage(doc, feed, panel, phMark, true);
            feed._nextUrl = n ? feedNextUrl(doc) : '';   // página sem itens novos → para (anti-loop)
            feed._loadingMore = false;
            if (onDone) onDone();
        }, () => { skels.forEach(s => s.remove()); feed._loadingMore = false; if (onDone) onDone(); });
    }
    // cria o bloco (abas + painéis), insere antes das categorias e carrega a 1ª aba
    function buildHomeFeed(parent, ref) {
        if (homeFeedDone) return;
        const feeds = [
            { key: 'latest', label: 'Latest posts', icon: ICONS.layers, url: navHref('whatsNewPosts', 'newPosts', 'whatsNewPosts2') || '/whats-new/posts/' },
            { key: 'trending', label: 'Trending', icon: ICONS.flame, url: navHref('trending', 'smgtrending', 'trending2') },
            // "Following" REMOVIDO daqui: a Timeline (topbar → ?view=feed) já é o feed das seguidas.
        ].filter(f => f.url);
        if (!feeds.length) {
            homeFeedDone = true;
            markHomeFeedReady();
            return;
        }
        homeFeedDone = true;
        const phMark = document.documentElement.classList.contains('smg-smg') ? SMG_PH_MARK : SC_PH_MARK;
        const block = document.createElement('div'); block.className = 'smg-feed-block';
        const tabsEl = document.createElement('div'); tabsEl.className = 'smg-feed-tabs';
        const tablist = document.createElement('div'); tablist.className = 'smg-feed-tablist';
        const scrollWrap = document.createElement('div'); scrollWrap.className = 'smg-feed-scroll';
        const panelsEl = document.createElement('div'); panelsEl.className = 'smg-feed-panels';
        scrollWrap.appendChild(panelsEl);

        // setas ‹ › (desktop) — rolam o painel ATIVO; somem nas bordas
        const chevron = dir => svgIcon(dir < 0 ? '<path d="m15 18-6-6 6-6"/>' : '<path d="m9 18 6-6-6-6"/>');
        const navBtns = {};
        const activePanel = () => panelsEl.querySelector('.smg-feed-panel.is-active');
        const updateNav = () => {
            const p = activePanel(); if (!p) return;
            const max = p.scrollWidth - p.clientWidth - 2;
            navBtns[-1].classList.toggle('smg-nav-hidden', p.scrollLeft <= 2);
            navBtns[1].classList.toggle('smg-nav-hidden', p.scrollLeft >= max || max <= 0);
        };
        // scroll do painel: atualiza as setas E, perto da borda direita, pré-busca a próxima página (append).
        // SÓ aqui (não no updateNav, que roda pós-load) → sem loop: o append cresce o scrollWidth e a condição volta a ser falsa.
        const onPanelScroll = () => {
            updateNav();
            const p = activePanel(); if (!p || !p._feed) return;
            if (p.scrollWidth - p.clientWidth - p.scrollLeft <= 700) loadMoreFeed(p._feed, p, phMark, updateNav);
        };
        [-1, 1].forEach(dir => {
            const b = document.createElement('button'); b.type = 'button';
            b.className = 'smg-feed-nav ' + (dir < 0 ? 'smg-feed-prev' : 'smg-feed-next');
            b.setAttribute('aria-label', dir < 0 ? 'Previous' : 'Next');
            b.innerHTML = chevron(dir);
            b.addEventListener('click', () => { const p = activePanel(); if (p) p.scrollBy({ left: dir * Math.round(p.clientWidth * 0.85), behavior: 'smooth' }); });
            scrollWrap.appendChild(b); navBtns[dir] = b;
        });
        let feedNavRaf = 0;   // rAF-throttle: updateNav lê scrollWidth/clientWidth (layout) — não roda por evento de resize
        window.addEventListener('resize', () => { if (feedNavRaf) return; feedNavRaf = requestAnimationFrame(() => { feedNavRaf = 0; updateNav(); }); }, { passive: true });

        // link "See all" → leva direto pra página da aba ATIVA (atualiza ao trocar de aba)
        const seeAll = document.createElement('a');
        seeAll.className = 'smg-feed-seeall';
        seeAll.innerHTML = i18n('See all') + ' ' + ICONS.arrowRight;

        feeds.forEach((f, i) => {
            const tab = document.createElement('button'); tab.type = 'button';
            tab.className = 'smg-feed-tab' + (i === 0 ? ' is-active' : '');
            tab.innerHTML = '<span class="smg-feed-tab-ic">' + f.icon + '</span><span>' + f.label + '</span>';
            const panel = document.createElement('div'); panel.className = 'smg-feed-panel' + (i === 0 ? ' is-active' : '');
            panel.addEventListener('scroll', onPanelScroll, { passive: true });
            f._panel = panel; panel._feed = f;   // panel→feed: o onPanelScroll sabe qual fonte paginar
            tab.addEventListener('click', () => {
                tabsEl.querySelectorAll('.smg-feed-tab').forEach(t => t.classList.remove('is-active'));
                panelsEl.querySelectorAll('.smg-feed-panel').forEach(p => p.classList.remove('is-active'));
                tab.classList.add('is-active'); panel.classList.add('is-active');
                seeAll.href = f.url;
                loadFeed(f, panel, phMark, updateNav);
                updateNav();
            });
            tablist.appendChild(tab); panelsEl.appendChild(panel);
        });
        tabsEl.append(tablist, seeAll);   // tabs (scrolláveis) + See all fixado à direita
        seeAll.href = feeds[0].url;
        block.append(tabsEl, scrollWrap);
        i18nDom(block);
        parent.insertBefore(block, ref);
        loadFeed(feeds[0], feeds[0]._panel, phMark, updateNav);
    }

    function layoutHomeSidebar() {
        if (!document.documentElement.classList.contains('smg-home')) return;
        if (homeSidebarDone) return;
        const content = document.querySelector('.p-body-content .p-body-pageContent')
            || document.querySelector('.p-body-content');
        if (!content) return;
        const firstCat = content.querySelector('.block--category');
        // The home is streamed progressively. Do not lock the layout while the
        // first category is still absent, otherwise the feed lands at the end
        // and later sections remain in the native partial layout.
        if (!firstCat) return;
        homeSidebarDone = true;
        const parent = firstCat ? firstCat.parentElement : content;
        const ref = firstCat || null; // insere ANTES da primeira section (mesmo pai)
        // FEED com abas (Latest posts · Trending) no topo da home.
        // (substitui o antigo carousel do widget new_posts + a linha de atalhos; widget fica oculto na sidebar.)
        buildHomeFeed(parent, ref);
        // streak (SMG): REMOVIDO. Ao mover pra dentro do .uix_nodeList (que tem class "block"),
        // o seletor .block:has(.streakStats) pintava o nodeList inteiro de laranja. Removendo, some o laranja.
        const streak = document.querySelector('.streakStats');
        const streakBlock = streak ? streak.closest('.block') : null;
        if (streakBlock) streakBlock.remove();
    }

    // marca .smg-ad-block no bloco promocional (só .node--link dentro) — o CSS esconde pela classe
    // estática no lugar do :has(> .block-container > .block-body > .node--link), reavaliado por mutação.
    // Blocos já identificados saem da busca; wrappers ainda vazios continuam elegíveis para streaming.
    function markHomeAdBlocks() {
        // Keep unmatched blocks eligible: the ad node may arrive after its wrapper
        // during XenForo streaming. Once matched, the class is stable and the selector
        // skips it on subsequent passes.
        document.querySelectorAll('.block:not(.block--category):not(.smg-ad-block)').forEach(b => {
            if (b.querySelector(':scope > .block-container > .block-body > .node--link')) b.classList.add('smg-ad-block');
        });
    }

    // SMG home: move "ASMR" de "Social Media" para "More Categories" e renomeia a section pra "Categories"
    function relocateSmgNodes(roots) {
        if (!document.documentElement.classList.contains('smg-smg')
            || !document.documentElement.classList.contains('smg-home')) return;
        const cats = document.querySelectorAll('.p-body-content .block--category');
        if (!cats.length) return;
        let moreCat = null;
        cats.forEach(c => {
            const h = c.querySelector('.block-header');
            if (h && /more\s*categories/i.test(h.textContent || '')) moreCat = c;
        });
        if (!moreCat) return;
        const moreBody = moreCat.querySelector('.block-body');
        if (!moreBody) return;
        // move ASMR (de qualquer outra section) pra "More Categories"
        const moved = document.createDocumentFragment();
        document.querySelectorAll('.p-body-content .block--category .node:not([data-smg-smg-reloc-checked])').forEach(node => {
            if (moreCat.contains(node)) return;
            const title = ((node.querySelector('.node-title') || {}).textContent || '').trim();
            const a = node.querySelector('.node-title a') || node.querySelector('a[href]');
            const href = a ? (a.getAttribute('href') || '') : '';
            // Do not consume an incomplete streamed node; its title or href can be
            // appended in the following mutation batch.
            if (!title && !href) return;
            node.dataset.smgSmgRelocChecked = '1';
            if (/\basmr\b/i.test(title) || /asmr/i.test(href)) {
                node.dataset.smgSmgRelocated = '1';
                moved.appendChild(node);
            }
        });
        if (moved.childNodes.length) moreBody.appendChild(moved);
        // renomeia "More Categories" -> "Categories" (preservando o trigger de collapse)
        const head = moreCat.querySelector('.block-header');
        if (head) {
            const titleEl = head.querySelector('a, .uix_categoryTitle, .block-header-title');
            if (titleEl) titleEl.textContent = i18n('Categories');
            else {
                let done = false;
                head.childNodes.forEach(n => { if (!done && n.nodeType === 3 && n.textContent.trim()) { n.textContent = i18n('Categories'); done = true; } });
                if (!done) head.insertBefore(document.createTextNode(i18n('Categories')), head.firstChild);
            }
        }
    }
