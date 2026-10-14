    // ── CSS: thread list placeholders and article view ──
    const CSS_THREAD_CARDS = `
            /* PLACEHOLDER (marca SMG) nos cards sem thumb real — no lugar do avatar/thumb-quebrada/vazio.
               esconde avatar + thumb (quebrada) em QUALQUER modo; o tamanho do placeholder muda por modo. */
            .smg-thumb-ph { display: none; }
            html.smg-threadlist .structItem--thread.smg-no-thumb .structItem-cell--icon:not(.structItem-cell--iconEnd) .avatar,
            html.smg-threadlist .structItem--thread.smg-no-thumb .structItem-cell--icon:not(.structItem-cell--iconEnd) .structItem-iconContainer,
            html.smg-threadlist .structItem--thread.smg-no-thumb .dcThumbnail,
            html.smg-threadlist .structItem--thread.smg-no-thumb .dtt-thread-thumbnail { display: none !important; }
            .smg-thumb-ph { align-items: center; justify-content: center; box-sizing: border-box;
                background: var(--smg-s2) !important; color: rgba(255,255,255,0.38) !important; }
            .smg-thumb-ph .smg-ph-inner { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
            html.smg-smg.smg-threadlist .block-container,
            html.smg-smg.smg-threadlist .structItemContainer,
            html.smg-smg.smg-threadlist .uix_stickyContainerOuter {
                background: var(--smg-bg) !important;
                border-color: rgba(255,255,255,0.06) !important;
            }
            /* GRID: quadrado, ocupa a célula toda */
            html.smg-threadlist.smg-tv-grid .structItem--thread.smg-no-thumb .smg-thumb-ph {
                display: flex !important; width: 100% !important; aspect-ratio: 1 / 1;
            }
            /* LISTA (sem grid): no tamanho do thumb da lista (210×132 desktop) */
            html.smg-threadlist:not(.smg-tv-grid) .structItem--thread.smg-no-thumb .smg-thumb-ph {
                display: flex !important; width: 210px; height: 132px; flex: 0 0 auto; border-radius: 8px;
            }
            @media (max-width: 600px) {
                /* LISTA mobile: thumb 92×70 + marca menor */
                html.smg-threadlist:not(.smg-tv-grid) .structItem--thread.smg-no-thumb .smg-thumb-ph { width: 92px; height: 70px; border-radius: 7px; }
                html.smg-threadlist:not(.smg-tv-grid) .structItem--thread.smg-no-thumb .smg-ph-word { font-size: 13px; letter-spacing: 1px; }
            }
            .smg-ph-inner { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; color: rgba(255,255,255,0.25); text-align: center; }
            .smg-ph-ico { width: 34px; height: 34px; opacity: 0.55; }
            .smg-ph-word { font-size: 14px; font-weight: 800; letter-spacing: 2px; color: rgba(255,255,255,0.3); line-height: 1; user-select: none; }

            /* ===== forum_view_type_article (ex.: /forums/games.91/): threads = .message--articlePreview (NÃO .structItem--thread).
               Vira o MESMO grid de cards das outras páginas (imagem 1:1 + título + meta), sem o excerpt.
               .smg-article-grid é marcado via JS no container (pega sticky/featured fora do .block-body). ===== */
            /* GRADE (modo grade): gated em smg-tv-grid → o toggle lista/grade da dock vale aqui também */
            html.smg-threadlist.smg-tv-grid .smg-article-grid {
                display: grid !important;
                grid-template-columns: repeat(auto-fill, minmax(max(var(--smg-card-min), calc((100% - 70px) / 6)), 1fr)) !important;
                gap: 14px !important; padding: 14px !important; background: transparent !important; align-items: start !important;
            }
            html.smg-threadlist.smg-tv-grid .smg-article-grid > .smg-inf-sep { grid-column: 1 / -1 !important; }
            /* LISTA (modo lista): card horizontal (imagem à esquerda + texto à direita) */
            html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid { display: flex !important; flex-direction: column !important; gap: 10px !important; padding: 12px 0 !important; }
            html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid .message--articlePreview { flex-direction: row !important; }
            html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid .articlePreview-main { flex-direction: row !important; align-items: stretch !important; gap: 0 !important; }
            html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid .articlePreview-image,
            html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid .smg-art-ph { flex: 0 0 210px !important; width: 210px !important; aspect-ratio: 16 / 10 !important; }
            html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid .articlePreview-text { flex: 1 1 auto !important; justify-content: center !important; padding: 10px 16px !important; }
            @media (max-width: 600px) {
                html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid .articlePreview-image,
                html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid .smg-art-ph { flex-basis: 116px !important; width: 116px !important; }
            }
            html.smg-threadlist .message--articlePreview {
                display: flex !important; flex-direction: column !important; margin: 0 !important; padding: 0 !important;
                width: auto !important; max-width: none !important; min-width: 0 !important; float: none !important;   /* item de grid limpo */
                background: var(--smg-s1) !important; border: 1px solid var(--smg-bd) !important;
                border-radius: 12px !important; overflow: hidden !important;
                transition: border-color .14s ease, transform .14s ease;
            }
            html.smg-threadlist .message--articlePreview:hover { border-color: var(--smg-bd2) !important; transform: translateY(-2px); }
            html.smg-threadlist .articlePreview-main { display: flex !important; flex-direction: column !important; align-items: stretch !important; gap: 0 !important; padding: 0 !important; }
            /* imagem (ou placeholder) 1:1 no topo — igual ao grid de structItem.
               img em position:absolute → quebra a dependência circular (height:auto + img 100%) que fazia
               o aspect-ratio ser ignorado (imagem gigante/colapsada → grid torto) */
            html.smg-threadlist .articlePreview-image,
            html.smg-threadlist .message--articlePreview .smg-art-ph {
                position: relative !important; display: block !important;
                width: 100% !important; aspect-ratio: 1 / 1 !important; height: auto !important; margin: 0 !important;
                overflow: hidden !important; background: var(--smg-s2); border-radius: 0 !important; box-sizing: border-box;
            }
            html.smg-threadlist .articlePreview-image img {
                position: absolute !important; inset: 0 !important;
                width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important;
                object-fit: cover !important; display: block !important; border-radius: 0 !important;
            }
            html.smg-threadlist .message--articlePreview .smg-art-ph {
                display: flex !important; align-items: center !important; justify-content: center !important;
                background: radial-gradient(circle at 50% 40%, var(--smg-s3), var(--smg-s1)) !important; text-decoration: none;
            }
            /* embeds/jogos do trecho que escapam (ex.: Virtualfem) — NÃO renderiza dentro do card */
            html.smg-threadlist .message--articlePreview iframe,
            html.smg-threadlist .message--articlePreview .generic2wide-iframe-div,
            html.smg-threadlist .message--articlePreview .smg-turbo-slot,
            html.smg-threadlist .message--articlePreview [data-s9e-mediaembed],
            html.smg-threadlist .message--articlePreview .bbImageWrapper { display: none !important; }
            html.smg-threadlist .articlePreview-text { display: flex !important; flex-direction: column !important; gap: 6px !important; padding: 9px 12px 0 !important; min-width: 0 !important; }
            html.smg-threadlist .articlePreview-headline { margin: 0 !important; }
            html.smg-threadlist .articlePreview-title { font-size: 14.5px !important; font-weight: 600 !important; line-height: 1.3 !important; margin: 0 !important; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            html.smg-threadlist .articlePreview-title a { color: #fff !important; }
            html.smg-threadlist .articlePreview-title .label { font-size: 9.5px !important; padding: 1.5px 5px !important; border-radius: 4px !important; }
            /* excerpt + "view full article" saem (igual ao grid de structItem = só thumb+título+meta) */
            html.smg-threadlist .articlePreview-content,
            html.smg-threadlist .articlePreview-links { display: none !important; }
            /* rodapé enxuto: avatar · autor · data · respostas (sem share/embed) */
            html.smg-threadlist .articlePreview-footer { margin-top: auto !important; padding: 7px 12px 11px !important; border: 0 !important; background: transparent !important; }
            html.smg-threadlist .articlePreview-meta { display: flex !important; align-items: center !important; gap: 7px !important; flex-wrap: nowrap !important; margin: 0 !important; padding: 0 !important; list-style: none !important; font-size: 11.5px !important; color: rgba(255,255,255,0.5) !important; overflow: hidden; }
            html.smg-threadlist .articlePreview-meta > li { display: inline-flex !important; align-items: center; margin: 0 !important; min-width: 0; }
            html.smg-threadlist .articlePreview-meta > li.js-embedCopy,
            /* (li do "share" no meta dos article cards: escondido pelo JS no styleArticleCards — era o último :has por-li em grid com infinite scroll) */
            html.smg-threadlist .articlePreview-by { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            html.smg-threadlist .articlePreview-by a { color: rgba(255,255,255,0.72) !important; }
            html.smg-threadlist .articlePreview-meta .simp-avatar-border-wrap, html.smg-threadlist .articlePreview-meta .avatar { width: 20px !important; height: 20px !important; flex: 0 0 auto; }
            html.smg-threadlist .articlePreview-meta .avatar { border-radius: 50% !important; overflow: hidden; }
            html.smg-threadlist .articlePreview-meta .avatar img, html.smg-threadlist .articlePreview-meta .avatar span { width: 20px !important; height: 20px !important; font-size: 10px !important; line-height: 20px !important; }
            html.smg-threadlist .articlePreview-meta .simp-avatar-border { display: none !important; }   /* tira a moldura decorativa */
            html.smg-threadlist .articlePreview-replies { margin-left: auto !important; flex: 0 0 auto; }
            html.smg-threadlist .articlePreview-replies a { color: rgba(255,255,255,0.6) !important; }
            @media (max-width: 600px) {
                html.smg-threadlist .block--articles .block-body,
                html.smg-threadlist .smg-article-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px !important; padding: 11px !important; }
                html.smg-threadlist .articlePreview-title { font-size: 13px !important; }
            }

            /* ---- feed: barra de ferramentas (filtro / mudo) ---- */
            .smg-feed-tools { position: absolute; top: 18px; right: 84px; z-index: 6; display: flex; gap: 10px; }
            .smg-feed-tool {
                width: 46px; height: 46px; font-size: 21px;
                display: flex; align-items: center; justify-content: center;
                border-radius: 50%; cursor: pointer; color: #fff;
                border: 1px solid rgba(255,255,255,0.15);
                background: rgba(20,20,24,0.82);   /* PERF: sem backdrop-filter (repintava no scroll do reel) */
                transition: background .15s ease, transform .12s ease;
            }
            .smg-feed-tool:hover { background: rgba(42,42,50,0.85); }
            .smg-feed-tool:active { transform: scale(0.9); }
            .smg-feed-tool.smg-active { background: var(--smg-link-strong); border-color: var(--smg-link-strong); color: #fff; }
            .smg-feed-tool svg { width: 1em; height: 1em; display: block; }
            @media (max-width: 600px) {
                .smg-feed-tools { right: 70px; gap: 7px; }
                .smg-feed-tool { width: 40px; height: 40px; font-size: 18px; }
            }
            /* o CSS do fórum enche os SVGs (fill); força outline em tudo dentro do feed */
            #smg-feed svg { fill: none !important; }
            #smg-feed .smg-rgc-play svg, #smg-feed .smg-rgc-barplay svg, #smg-feed .smg-gallery-play svg { fill: currentColor !important; }   /* play/pause + play da galeria são PREENCHIDOS (não outline) → re-afirma o fill, senão somem com a regra acima */

            /* ---- feed: filmstrip (tira de thumbnails) ---- */
            .smg-feed-media { transform-origin: center center; }
            .smg-feed-strip {
                position: absolute; left: 0; right: 0; bottom: 0; height: 92px;
                display: flex; align-items: center; gap: 8px;
                padding: 10px 14px; overflow-x: auto; overflow-y: hidden; z-index: 6;
                background: linear-gradient(0deg, rgba(0,0,0,0.88), rgba(0,0,0,0));
                transform: translateY(110%);
                transition: transform .26s cubic-bezier(.2,.8,.3,1);
                scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.3) transparent;
            }
            .smg-feed-strip::-webkit-scrollbar { height: 7px; }
            .smg-feed-strip::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.25); border-radius: 4px; }
            #smg-feed.strip-open .smg-feed-strip { transform: translateY(0); }
            /* setas < > de navegação do filmstrip (sobre as pontas, com gradiente; somem nas extremidades) */
            .smg-feed-striparrow {
                position: absolute; bottom: 0; height: 92px; width: 54px; z-index: 7;
                display: none; align-items: center; border: 0; color: #fff; cursor: pointer; padding: 0;
                transition: opacity .2s ease;
            }
            #smg-feed.strip-open .smg-feed-striparrow { display: flex; }
            #smg-feed.strip-open .smg-feed-striparrow.is-hidden { opacity: 0; pointer-events: none; }
            .smg-feed-striparrow--prev { left: 0; justify-content: flex-start; padding-left: 10px; background: linear-gradient(90deg, rgba(0,0,0,0.92), rgba(0,0,0,0)); }
            .smg-feed-striparrow--next { right: 0; justify-content: flex-end; padding-right: 10px; background: linear-gradient(270deg, rgba(0,0,0,0.92), rgba(0,0,0,0)); }
            .smg-feed-striparrow svg { width: 26px; height: 26px; filter: drop-shadow(0 1px 3px rgba(0,0,0,0.8)); transition: transform .12s ease; }
            .smg-feed-striparrow:hover svg { transform: scale(1.18); }
            @media (max-width: 600px) { .smg-feed-striparrow { display: none !important; } }   /* mobile: rola por swipe */
            /* thumbs SEMPRE abertas → imagem/iframe/player sobem ~92px pra não ficar atrás do filmstrip */
            #smg-feed.strip-open .smg-feed-media,
            #smg-feed.strip-open .smg-feed-embed iframe { max-height: calc(100vh - 104px); margin-bottom: 92px; }
            #smg-feed.strip-open .smg-feed-embed .smg-rg { max-height: calc(100vh - 104px) !important; margin-bottom: 92px !important; }
            .smg-feed-thumb {
                flex: 0 0 auto; width: 64px; height: 64px; border-radius: 8px; overflow: hidden;
                border: 2px solid transparent; background: #1c1c22; cursor: pointer; padding: 0;
                position: relative; opacity: .6;
                transition: opacity .15s ease, border-color .15s ease, transform .12s ease;
            }
            .smg-feed-thumb:hover { opacity: 1; transform: translateY(-2px); }
            .smg-feed-thumb.active { opacity: 1; border-color: rgba(255,255,255,0.7); }
            .smg-feed-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .smg-feed-thumb-embed { display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.8); font-size: 22px; }
            .smg-feed-thumb-embed svg { width: 1em; height: 1em; }

            /* ITENS ativos/atuais/primários seguem o ACENTO do tema (eram BRANCOS nos 2 sites → agora verde/rosa por site) */
            /* (a aba ativa da home saiu daqui: agora é sublinhado-accent, não fill — ver .smg-feed-tab::after) */
            .smg-search-go,
            .smg-search-author-btn.has-value,
            .smg-bar-btn--current,
            .smg-bar-go,
            html.smg-thread .pageNav-page--current > a,
            html.smg-threadlist .pageNav-page--current > a {
                background: var(--smg-link-strong) !important;
                color: #fff !important;
                border-color: var(--smg-link-strong) !important;
            }
`;