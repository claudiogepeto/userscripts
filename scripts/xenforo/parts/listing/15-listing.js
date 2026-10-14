    // listing/15-listing.js
    // Owns: forum listing grid marks, native alert/inbox badges and thumbnail placeholders.
    // Exposes: markThreadGridContainer, markGridPlaceholders, syncReactiveBadges, alertsBadgeCount, ALERTS_COUNT_KEY.
    // Depends on: core/06-helpers, core/04-icons, thread/17a-filterbar.
    // =========================================================
    // LISTAGEM (modo lista/grade): marca o container REAL dos itens (.structItem--thread)
    // que o modo grade transforma em grid (o toggle lista/grade vive no dock)
    // =========================================================

    function markThreadGridContainer(roots) {
        if (!document.documentElement.classList.contains('smg-threadlist')) return;   // structItem só existe em listagem; evita varrer o DOM em toda página/tick
        eachIn(roots, '.structItem--thread:not([data-smg-tl])', it => {
            it.dataset.smgTl = '1';   // guard: NodeList vazia uma vez marcados (não varre todo frame)
            const parent = it.parentElement;
            const stickyGroup = it.closest('.structItemContainer-group--sticky');
            if (stickyGroup) {
                stickyGroup.classList.remove('smg-tl-grid');
                stickyGroup.classList.add('smg-sticky-compact-list');
            } else if (parent && !parent.classList.contains('smg-sticky-compact-list')) {
                parent.classList.add('smg-tl-grid');
            }
            it.querySelectorAll('a[data-xf-init*="preview-tooltip"], a[data-preview-url]').forEach(a => {
                a.removeAttribute('data-xf-init');
                a.removeAttribute('data-preview-url');
            });
            decorateThreadCard(it);
        });
    }

    // marca .smg-has-nodes no .block--category que lista sub-fóruns — o CSS casa a classe estática
    // no lugar de .block--category:has(.node) (re-validado a cada mutação da listagem)
    function markCategoryNodeBlocks(roots) {
        if (!document.documentElement.classList.contains('smg-threadlist')) return;
        eachIn(roots, '.block--category:not([data-smg-nodechk])', b => {
            b.dataset.smgNodechk = '1';
            if (b.querySelector('.node')) b.classList.add('smg-has-nodes');
        });
    }

    // ===== badges REATIVOS: topbar + dock acompanham o contador nativo do XF (alertas) AO VIVO =====
    // o XF muda data-badge em .p-navgroup-link--alerts ao marcar lido / chegar alerta; observamos e re-sincronizamos
    // os badges da topbar e da dock — sem precisar de F5.
    let badgeObsBound = false;
    // último contador que APRENDEMOS abrindo o painel (18-alerts) — vale quando o tema não expõe o número.
    const ALERTS_COUNT_KEY = 'smg-alerts-count';
    // O socialmediagirls (UI.X) NÃO popula o data-badge do link nativo: o sino ficava sem número nenhum
    // até o usuário abrir o painel (era o fetch da popup que recontava e escrevia o atributo) — daí o
    // "só aparece às vezes". Agora lemos o contador de ONDE ELE ESTIVER: atributo no próprio link, em
    // qualquer descendente, ou o número dentro do elemento de badge do tema.
    // O retorno distingue DESCONHECIDO de ZERO: sem nenhuma dessas pistas o tema simplesmente não conta,
    // e aí vale o último valor conhecido — zerar seria apagar informação boa.
    function nativeBadgeInfo(sel) {
        const el = document.querySelector(sel);
        if (!el) return { known: false, n: 0 };
        const holder = el.hasAttribute('data-badge') ? el : el.querySelector('[data-badge]');
        if (holder) return { known: true, n: Math.max(0, parseInt(holder.getAttribute('data-badge') || '0', 10) || 0) };
        const b = el.querySelector('.badgeContainer, .badge, [class*="badge"], [class*="Badge"]');
        const t = b && (b.textContent || '').trim();
        if (t && /^\d+\+?$/.test(t)) return { known: true, n: parseInt(t, 10) || 0 };
        return { known: false, n: 0 };
    }
    // contador de alertas RESOLVIDO (tema → último conhecido): fonte única pra topbar, dock e painel
    function alertsBadgeCount() {
        const info = nativeBadgeInfo('.p-navgroup-link--alerts');
        return info.known ? info.n : (parseInt(gmGet(ALERTS_COUNT_KEY, '0'), 10) || 0);
    }
    function setReactiveBadge(host, n, cls) {
        if (!host) return;
        let b = host.querySelector(':scope > .' + cls);
        if (n > 0) {
            const t = n > 99 ? '99+' : String(n);
            if (!b) { b = document.createElement('span'); b.className = cls; host.appendChild(b); }
            if (b.textContent !== t) b.textContent = t;   // só muta se mudou (senão o observer entra em loop)
        } else if (b) { b.remove(); }
    }
    function syncReactiveBadges() {
        const alerts = alertsBadgeCount();
        setReactiveBadge(document.querySelector('#smg-topbar .smg-rt-alerts'), alerts, 'smg-tb-badge');     // topbar (ícone do sino)
        setReactiveBadge(document.querySelector('#smg-nav-bell .smg-nav-ico'), alerts, 'smg-nav-badge');  // dock / navbar mobile
        aldockSyncCount();   // contador do rail de notificações (se estiver docked)
    }
    function watchNativeBadges() {
        if (badgeObsBound) return;   // o MutationObserver já mantém os badges em sync ao vivo — não varre todo frame
        const target = document.querySelector('.p-navgroup-link--alerts');
        if (!target) return;     // sem nav nativa (logout/página sem nav) → nem sincroniza badge à toa todo frame
        syncReactiveBadges();
        badgeObsBound = true;
        const obs = new MutationObserver(syncReactiveBadges);
        // subtree + texto: em tema que renderiza o contador como ELEMENTO (não atributo), a troca do
        // número não mexe em nenhum atributo do link — só observar o data-badge dele nunca dispararia.
        obs.observe(target, { attributes: true, attributeFilter: ['data-badge'], childList: true, subtree: true, characterData: true });
    }

    // cards sem thumb real (XF mostra o avatar do autor, ou nada) ganham o NOSSO placeholder
    // (smgThumbPh: ícone pelo tipo do post). Vale no grid E na lista (o CSS ajusta o tamanho por modo). Idempotente.
    // forum_view_type_article (ex.: games.91): marca o container dos .message--articlePreview como grid
    // (pega também sticky/featured que ficam fora do .block-body) + placeholder nos cards sem imagem.
    function styleArticleCards(roots) {
        if (!document.documentElement.classList.contains('smg-threadlist')) return;
        const arts = [];
        eachIn(roots, '.message--articlePreview:not([data-smg-art])', art => arts.push(art));
        if (!arts.length) return;
        const wantPh = FEATURES.thumbPlaceholders;

        // RECONSTRÓI: o XF (article view) usa um grid "magazine" com grid-template-areas + grid-area por
        // :nth-of-type (o 1º card ocupa a linha toda). Trocar grid-template-columns não resolve. Solução:
        // mover os cards pra um container NOSSO (.smg-article-grid), onde aquelas regras :nth-of-type NÃO casam.
        // O grid/lista é controlado por CSS (gated em smg-tv-grid) → o toggle lista/grade da dock funciona aqui também.
        const origs = new Set();
        arts.forEach(a => { const p = a.parentElement; if (p && !p.classList.contains('smg-article-grid')) origs.add(p); });
        origs.forEach(orig => {
            if (!orig.parentElement) return;
            // O XenForo pode anexar novos cards ao container nativo depois da primeira pintura. Reutiliza
            // a grade que já foi criada ao lado dele, evitando uma grade nova para cada lote transmitido.
            let grid = orig.nextElementSibling;
            if (!grid || !grid.classList.contains('smg-article-grid')) {
                grid = document.createElement('div');
                grid.className = 'smg-article-grid';
                orig.parentElement.insertBefore(grid, orig.nextSibling);
            }
            orig.querySelectorAll(':scope > .message--articlePreview').forEach(a => grid.appendChild(a));
            orig.style.setProperty('display', 'none', 'important');   // esconde o container original (vazio)
        });

        arts.forEach(art => {
            if (art.dataset.smgArt) return;
            art.dataset.smgArt = '1';
            // meta: esconde o li do "share" aqui (substitui o li:has(.fa-share-alt) do CSS — era por-li em todo recalc)
            const shareIco = art.querySelector('.articlePreview-meta .fa-share-alt');
            const shareLi = shareIco && shareIco.closest('li');
            if (shareLi) shareLi.style.setProperty('display', 'none', 'important');
            if (!wantPh) {
                art.dataset.smgArtReady = '1';
                return;
            }
            const main = art.querySelector('.articlePreview-main');
            if (!main) {
                art.dataset.smgArtReady = '1';
                return;
            }
            const imgLink = art.querySelector('.articlePreview-image');
            const img = imgLink && imgLink.querySelector('img');
            const addPh = () => {
                if (main.querySelector('.smg-art-ph')) {
                    art.dataset.smgArtReady = '1';
                    return;
                }
                const ph = document.createElement('a');
                ph.className = 'smg-art-ph smg-ph';
                const tl = art.querySelector('.articlePreview-title a[href*="/threads/"]');
                if (tl) ph.href = tl.getAttribute('href');
                ph.innerHTML = smgThumbPh(smgThreadKind((art.querySelector('.articlePreview-title') || art).textContent));
                main.insertBefore(ph, main.firstChild);
                if (imgLink) imgLink.style.setProperty('display', 'none', 'important');
                art.dataset.smgArtReady = '1';
            };
            if (!img) { addPh(); return; }
            const verify = () => {
                if (img.naturalWidth === 0) addPh();
                else art.dataset.smgArtReady = '1';
            };   // carregou mas veio vazio/quebrado
            if (img.complete) verify();
            else { img.addEventListener('load', verify, { once: true }); img.addEventListener('error', addPh, { once: true }); }
        });
    }

    const thumbProbeCache = new Map();
    function probeThumb(url, callback) {
        if (!url) return;
        const cached = thumbProbeCache.get(url);
        if (cached) {
            if (cached.status === 'pending') cached.callbacks.push(callback);
            else callback(cached.status === 'ok');
            return;
        }
        const state = { status: 'pending', callbacks: [callback] };
        thumbProbeCache.set(url, state);
        const probe = document.createElement('img');
        const finish = ok => {
            state.status = ok ? 'ok' : 'failed';
            const callbacks = state.callbacks.splice(0);
            callbacks.forEach(cb => { try { cb(ok); } catch (e) {} });
            while (thumbProbeCache.size > 128) {
                const first = thumbProbeCache.entries().next().value;
                if (!first || first[1].status === 'pending') break;
                thumbProbeCache.delete(first[0]);
            }
        };
        probe.onload = () => finish(!!probe.naturalWidth);
        probe.onerror = () => finish(false);
        probe.src = url;
    }

    function markGridPlaceholders(roots) {
        if (!document.documentElement.classList.contains('smg-threadlist')) return;  // os 2 sites
        eachIn(roots, '.structItem--thread:not([data-smg-ph])', it => {
            it.setAttribute('data-smg-ph', '1');   // marca ANTES dos guards (REGRA DE OURO): ad/linha sem ícone ficava fora da marca e era re-varrida em todo full-scan
            const cell = it.querySelector('.structItem-cell--icon:not(.structItem-cell--iconEnd)');
            const hasTitle = !!it.querySelector('.structItem-title a, .structItem-title');
            if (it.classList.contains('samUnitWrapper') || it.classList.contains('structItem--quickCreate') || (!cell && !hasTitle)) {
                it.classList.add('smg-card-empty');
                it.dataset.smgPhReady = '1';
                return;
            }
            if (!cell) {
                it.dataset.smgPhReady = '1';
                return;
            }
            const addPh = () => {
                if (it.classList.contains('smg-no-thumb')) {
                    it.dataset.smgPhReady = '1';
                    return;
                }
                it.classList.add('smg-no-thumb');
                const ph = document.createElement('div');
                ph.className = 'smg-thumb-ph smg-ph';
                ph.innerHTML = smgThumbPh(smgThreadKind((it.querySelector('.structItem-title') || it).textContent));
                cell.insertBefore(ph, cell.firstChild);
                it.dataset.smgPhReady = '1';
            };
            const thumb = cell.querySelector('.dcThumbnail, .dtt-thread-thumbnail');
            if (!thumb) { addPh(); return; }              // sem thumb (avatar/vazio) → placeholder
            const img = thumb.querySelector('img');
            if (!img) { addPh(); return; }
            // simpcity (.dcThumbnail): o thumb REAL vem no background-image do <img> (src é 1x1).
            if (thumb.classList.contains('dcThumbnail')) {
                const m = (img.style.backgroundImage || thumb.style.backgroundImage || '').match(/url\(\s*["']?([^"')]+)/i);
                const url = m && m[1];
                if (!url || /^data:/i.test(url) || /defaultThumbnailImage|no_image/i.test(url)) { addPh(); return; }   // sem bg real ou no_image padrão do fórum → nosso placeholder
                // bg-image não tem onerror → testa o carregamento (ex.: thumbs do domínio .su morto → 404)
                probeThumb(url, ok => { if (!ok) addPh(); else it.dataset.smgPhReady = '1'; });
                return;
            }
            // SMG (.dtt-thread-thumbnail): <img src> real → placeholder se quebrar ou se for no_image
            const src = img.getAttribute('src') || img.src || '';
            if (/defaultThumbnailImage|no_image/i.test(src)) { addPh(); return; }
            if (img.complete) {
                if (img.naturalWidth === 0) addPh();
                else it.dataset.smgPhReady = '1';
            } else {
                img.addEventListener('load', () => { it.dataset.smgPhReady = '1'; }, { once: true });
                img.addEventListener('error', addPh, { once: true });
            }
        });
    }
