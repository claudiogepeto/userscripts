    // ── CSS: thread list placeholders and article view ──
    const CSS_THREAD_CARDS = `
            /* FALLBACK DE THUMB (smgThumbPh, .smg-ph): o MESMO em todo card de thread, feed e salvos —
               superfície AMOLED no visual do skeleton + ícone pelo tipo do post. Nunca o avatar do autor. */
            .smg-ph {
                background: linear-gradient(180deg, var(--smg-w-06), var(--smg-w-02)), #000 !important;
                box-shadow: inset 0 0 0 1px var(--smg-w-06); color: var(--smg-w-30) !important; overflow: hidden;
            }
            .smg-ph-inner { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: var(--smg-w-30); }
            .smg-ph-ico { display: inline-flex; font-size: var(--smg-fs-32); }
            .smg-fp-thumb .smg-ph-ico { font-size: var(--smg-fs-22); }
            /* lista/grade: esconde avatar + thumb (quebrada) em QUALQUER modo; o tamanho muda por modo. */
            .smg-thumb-ph { display: none; }
            html.smg-threadlist .structItem--thread.smg-no-thumb .structItem-cell--icon:not(.structItem-cell--iconEnd) .avatar,
            html.smg-threadlist .structItem--thread.smg-no-thumb .structItem-cell--icon:not(.structItem-cell--iconEnd) .structItem-iconContainer,
            html.smg-threadlist .structItem--thread.smg-no-thumb .dcThumbnail,
            html.smg-threadlist .structItem--thread.smg-no-thumb .dtt-thread-thumbnail { display: none !important; }
            .smg-thumb-ph { align-items: center; justify-content: center; box-sizing: border-box; }
            html.smg-smg.smg-threadlist .block-container,
            html.smg-smg.smg-threadlist .structItemContainer,
            html.smg-smg.smg-threadlist .uix_stickyContainerOuter {
                background: var(--smg-bg) !important;
                border-color: var(--smg-w-06) !important;
            }
            /* GRID: quadrado, ocupa a célula toda */
            html.smg-threadlist.smg-tv-grid .structItem--thread.smg-no-thumb .smg-thumb-ph {
                display: flex !important; width: 100% !important; aspect-ratio: 1 / 1;
            }
            /* LISTA (sem grid): no tamanho do thumb da lista (210×132 desktop) */
            html.smg-threadlist:not(.smg-tv-grid) .structItem--thread.smg-no-thumb .smg-thumb-ph {
                display: flex !important; width: 210px; height: 132px; flex: 0 0 auto; border-radius: var(--smg-r-8);
            }
            @media (max-width: 600px) {
                /* LISTA mobile: thumb 92×70 + marca menor */
                html.smg-threadlist:not(.smg-tv-grid) .structItem--thread.smg-no-thumb .smg-thumb-ph { width: 92px; height: 70px; border-radius: var(--smg-r-8); }
                html.smg-threadlist:not(.smg-tv-grid) .structItem--thread.smg-no-thumb .smg-ph-ico { font-size: var(--smg-fs-24); }
            }

            /* ===== forum_view_type_article (ex.: /forums/games.91/): threads = .message--articlePreview (NÃO .structItem--thread).
               Vira o MESMO grid de cards das outras páginas (imagem 1:1 + título + meta), sem o excerpt.
               .smg-article-grid é marcado via JS no container (pega sticky/featured fora do .block-body). ===== */
            /* GRADE (modo grade): gated em smg-tv-grid → o toggle lista/grade da dock vale aqui também */
            html.smg-threadlist.smg-tv-grid .smg-article-grid {
                display: grid !important;
                grid-template-columns: repeat(auto-fill, minmax(max(var(--smg-card-min), calc((100% - 70px) / 6)), 1fr)) !important;
                gap: var(--smg-sp-14) !important; padding: var(--smg-sp-14) !important; background: transparent !important; align-items: start !important;
            }
            html.smg-threadlist.smg-tv-grid .smg-article-grid > .smg-inf-sep { grid-column: 1 / -1 !important; }
            /* LISTA (modo lista): card horizontal (imagem à esquerda + texto à direita) */
            html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid { display: flex !important; flex-direction: column !important; gap: var(--smg-sp-10) !important; padding: var(--smg-sp-12) 0 !important; }
            html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid .message--articlePreview { flex-direction: row !important; }
            html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid .articlePreview-main { flex-direction: row !important; align-items: stretch !important; gap: 0 !important; }
            html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid .articlePreview-image,
            html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid .smg-art-ph { flex: 0 0 210px !important; width: 210px !important; aspect-ratio: 16 / 10 !important; }
            html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid .articlePreview-text { flex: 1 1 auto !important; justify-content: center !important; padding: var(--smg-sp-10) var(--smg-sp-16) !important; }
            @media (max-width: 600px) {
                html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid .articlePreview-image,
                html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid .smg-art-ph { flex-basis: 116px !important; width: 116px !important; }
            }
            html.smg-threadlist .message--articlePreview {
                display: flex !important; flex-direction: column !important; margin: 0 !important; padding: 0 !important;
                width: auto !important; max-width: none !important; min-width: 0 !important; float: none !important;   /* item de grid limpo */
                background: var(--smg-s1) !important; border: 1px solid var(--smg-bd) !important;
                border-radius: var(--smg-r-12) !important; overflow: hidden !important;
                transition: border-color var(--smg-dur-15) ease, transform var(--smg-dur-15) ease;
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
                display: flex !important; align-items: center !important; justify-content: center !important; text-decoration: none;
            }
            /* embeds/jogos do trecho que escapam (ex.: Virtualfem) — NÃO renderiza dentro do card */
            html.smg-threadlist .message--articlePreview iframe,
            html.smg-threadlist .message--articlePreview .generic2wide-iframe-div,
            html.smg-threadlist .message--articlePreview .smg-turbo-slot,
            html.smg-threadlist .message--articlePreview [data-s9e-mediaembed],
            html.smg-threadlist .message--articlePreview .bbImageWrapper { display: none !important; }
            html.smg-threadlist .articlePreview-text { display: flex !important; flex-direction: column !important; gap: var(--smg-sp-6) !important; padding: var(--smg-sp-10) var(--smg-sp-12) 0 !important; min-width: 0 !important; }
            html.smg-threadlist .articlePreview-headline { margin: 0 !important; }
            html.smg-threadlist .articlePreview-title { font-size: var(--smg-fs-15) !important; font-weight: 600 !important; line-height: 1.3 !important; margin: 0 !important; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            html.smg-threadlist .articlePreview-title a { color: #fff !important; }
            html.smg-threadlist .articlePreview-title .label { font-size: var(--smg-fs-10) !important; padding: var(--smg-sp-2) var(--smg-sp-6) !important; border-radius: var(--smg-r-4) !important; }
            /* excerpt + "view full article" saem (igual ao grid de structItem = só thumb+título+meta) */
            html.smg-threadlist .articlePreview-content,
            html.smg-threadlist .articlePreview-links { display: none !important; }
            /* rodapé enxuto: avatar · autor · data · respostas (sem share/embed) */
            html.smg-threadlist .articlePreview-footer { margin-top: auto !important; padding: var(--smg-sp-8) var(--smg-sp-12) var(--smg-sp-12) !important; border: 0 !important; background: transparent !important; }
            html.smg-threadlist .articlePreview-meta { display: flex !important; align-items: center !important; gap: var(--smg-sp-8) !important; flex-wrap: nowrap !important; margin: 0 !important; padding: 0 !important; list-style: none !important; font-size: var(--smg-fs-12) !important; color: var(--smg-w-50) !important; overflow: hidden; }
            html.smg-threadlist .articlePreview-meta > li { display: inline-flex !important; align-items: center; margin: 0 !important; min-width: 0; }
            html.smg-threadlist .articlePreview-meta > li.js-embedCopy,
            /* (li do "share" no meta dos article cards: escondido pelo JS no styleArticleCards — era o último :has por-li em grid com infinite scroll) */
            html.smg-threadlist .articlePreview-by { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            html.smg-threadlist .articlePreview-by a { color: var(--smg-w-72) !important; }
            html.smg-threadlist .articlePreview-meta .simp-avatar-border-wrap, html.smg-threadlist .articlePreview-meta .avatar { width: 20px !important; height: 20px !important; flex: 0 0 auto; }
            html.smg-threadlist .articlePreview-meta .avatar { border-radius: var(--smg-r-round) !important; overflow: hidden; }
            html.smg-threadlist .articlePreview-meta .avatar img, html.smg-threadlist .articlePreview-meta .avatar span { width: 20px !important; height: 20px !important; font-size: var(--smg-fs-10) !important; line-height: 20px !important; }
            html.smg-threadlist .articlePreview-meta .simp-avatar-border { display: none !important; }   /* tira a moldura decorativa */
            html.smg-threadlist .articlePreview-replies { margin-left: auto !important; flex: 0 0 auto; }
            html.smg-threadlist .articlePreview-replies a { color: var(--smg-w-60) !important; }

            /* ---- feed: barra de ferramentas (filtro / mudo) ---- */
            .smg-feed-tools { position: absolute; top: 18px; right: 84px; z-index: var(--smg-z-6); display: flex; gap: var(--smg-sp-10); }
            .smg-feed-tool {
                width: 46px; height: 46px; font-size: var(--smg-fs-22);
                display: flex; align-items: center; justify-content: center;
                border-radius: var(--smg-r-round); cursor: pointer; color: #fff;
                border: 1px solid var(--smg-w-14);
                background: rgba(20,20,24,0.82);   /* PERF: sem backdrop-filter (repintava no scroll do reel) */
                transition: background var(--smg-dur-15) ease, transform var(--smg-dur-12) ease;
            }
            .smg-feed-tool:hover { background: rgba(42,42,50,0.85); }
            .smg-feed-tool:active { transform: scale(0.9); }
            .smg-feed-tool.smg-active { background: var(--smg-link-strong); border-color: var(--smg-link-strong); color: #fff; }
            .smg-feed-tool svg { width: 1em; height: 1em; display: block; }
            /* o CSS do fórum enche os SVGs (fill); força outline em tudo dentro do feed */
            #smg-feed svg { fill: none !important; }
            #smg-feed .smg-rgc-play svg, #smg-feed .smg-rgc-barplay svg, #smg-feed .smg-gallery-play svg { fill: currentColor !important; }   /* play/pause + play da galeria são PREENCHIDOS (não outline) → re-afirma o fill, senão somem com a regra acima */

            /* ---- feed: filmstrip (tira de thumbnails) ---- */
            .smg-feed-media { transform-origin: center center; }
            .smg-feed-strip {
                position: absolute; left: 0; right: 0; bottom: 0; height: 92px;
                display: flex; align-items: center; gap: var(--smg-sp-8);
                padding: var(--smg-sp-10) var(--smg-sp-14); overflow-x: auto; overflow-y: hidden; z-index: var(--smg-z-6);
                background: linear-gradient(0deg, var(--smg-k-92), rgba(0,0,0,0));
                transform: translateY(110%);
                transition: transform var(--smg-dur-30) cubic-bezier(.2,.8,.3,1);
                scrollbar-width: thin; scrollbar-color: var(--smg-w-30) transparent;
            }
            .smg-feed-strip::-webkit-scrollbar { height: 7px; }
            .smg-feed-strip::-webkit-scrollbar-thumb { background: var(--smg-w-22); border-radius: var(--smg-r-4); }
            #smg-feed.strip-open .smg-feed-strip { transform: translateY(0); }
            /* setas < > de navegação do filmstrip (sobre as pontas, com gradiente; somem nas extremidades) */
            .smg-feed-striparrow {
                position: absolute; bottom: 0; height: 92px; width: 54px; z-index: var(--smg-z-7);
                display: none; align-items: center; border: 0; color: #fff; cursor: pointer; padding: 0;
                transition: opacity var(--smg-dur-20) ease;
            }
            #smg-feed.strip-open .smg-feed-striparrow { display: flex; }
            #smg-feed.strip-open .smg-feed-striparrow.is-hidden { opacity: 0; pointer-events: none; }
            .smg-feed-striparrow--prev { left: 0; justify-content: flex-start; padding-left: var(--smg-sp-10); background: linear-gradient(90deg, var(--smg-k-92), rgba(0,0,0,0)); }
            .smg-feed-striparrow--next { right: 0; justify-content: flex-end; padding-right: var(--smg-sp-10); background: linear-gradient(270deg, var(--smg-k-92), rgba(0,0,0,0)); }
            .smg-feed-striparrow svg { width: 26px; height: 26px; filter: drop-shadow(0 1px 3px var(--smg-k-82)); transition: transform var(--smg-dur-12) ease; }
            .smg-feed-striparrow:hover svg { transform: scale(1.18); }
            @media (max-width: 600px) {
                html.smg-threadlist .block--articles .block-body,
                html.smg-threadlist .smg-article-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: var(--smg-sp-10) !important; padding: var(--smg-sp-12) !important; }
                html.smg-threadlist .articlePreview-title { font-size: var(--smg-fs-13) !important; }
                .smg-feed-tools { right: 70px; gap: var(--smg-sp-8); }
                .smg-feed-tool { width: 40px; height: 40px; font-size: var(--smg-fs-18); } .smg-feed-striparrow { display: none !important; } }   /* mobile: rola por swipe */
            /* thumbs SEMPRE abertas → imagem/iframe/player sobem ~92px pra não ficar atrás do filmstrip */
            #smg-feed.strip-open .smg-feed-media,
            #smg-feed.strip-open .smg-feed-embed iframe { max-height: calc(100vh - 104px); margin-bottom: 92px; }
            #smg-feed.strip-open .smg-feed-embed .smg-rg { max-height: calc(100vh - 104px) !important; margin-bottom: 92px !important; }
            .smg-feed-thumb {
                flex: 0 0 auto; width: 64px; height: 64px; border-radius: var(--smg-r-8); overflow: hidden;
                border: 2px solid transparent; background: #1c1c22; cursor: pointer; padding: 0;
                position: relative; opacity: .6;
                transition: opacity var(--smg-dur-15) ease, border-color var(--smg-dur-15) ease, transform var(--smg-dur-12) ease;
            }
            .smg-feed-thumb:hover { opacity: 1; transform: translateY(-2px); }
            .smg-feed-thumb.active { opacity: 1; border-color: var(--smg-w-72); }
            .smg-feed-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .smg-feed-thumb-embed { display: flex; align-items: center; justify-content: center; color: var(--smg-w-85); font-size: var(--smg-fs-22); }
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