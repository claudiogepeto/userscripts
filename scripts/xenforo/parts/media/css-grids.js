    // ── CSS: image grids, masonry and the gallery overlay ──
    const CSS_MEDIA_GRIDS = `
            /* ---- image grids ---- */
            .auto-image-grid {
                display: grid !important;
                grid-template-columns: repeat(var(--smg-mcols, 3), minmax(0, 1fr)) !important;
                grid-auto-flow: row dense !important;
                grid-auto-rows: auto !important;
                gap: 8px !important;
                row-gap: 8px !important;
                column-gap: 8px !important;
                margin: 12px auto !important;
                max-width: 100%;
                text-align: center !important;
            }
            .auto-image-grid .auto-image-grid {
                display: contents !important;
            }
            .auto-image-grid.portrait-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                align-items: start !important;
            }
            /* MASONRY UNIFICADO por CSS Grid — linhas explícitas, ordem visual por linha e espaçamento único de 8px */
            html.smg-masonry-on .auto-image-grid {
                display: grid !important;
                grid-template-columns: repeat(var(--smg-mcols, 3), minmax(0, 1fr)) !important;
                grid-auto-flow: row dense !important;
                grid-auto-rows: auto !important;
                gap: 8px !important;
                row-gap: 8px !important;
                column-gap: 8px !important;
                align-items: start !important;
                justify-items: stretch !important;
                margin: 12px auto !important;
                max-width: 100% !important;
                text-align: center !important;
            }
            html.smg-masonry-on .auto-image-grid.smg-grid-6 {
                grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
            }
            html.smg-masonry-on .auto-image-grid.smg-grid-6 > .smg-span-3 {
                grid-column: span 3 !important;
            }
            html.smg-masonry-on .auto-image-grid.smg-grid-6 > .smg-span-2 {
                grid-column: span 2 !important;
            }
            html.smg-masonry-on .auto-image-grid > .smg-span-all {
                grid-column: 1 / -1 !important;
                width: 100% !important;
                max-width: min(100%, calc(var(--smg-media-h, min(70vh, 750px)) * var(--smg-ratio, 1.7778))) !important;
                justify-self: center !important;
                margin: 0 auto !important;
            }
            html.smg-masonry-on .auto-image-grid > .smg-item-centered {
                grid-column: 1 / -1 !important;
                justify-self: center !important;
                width: auto !important;
                max-width: min(calc((100% - 8px) / 2), calc(var(--smg-media-h, min(70vh, 750px)) * var(--smg-ratio, 0.6))) !important;
                margin: 0 auto !important;
            }
            html.smg-masonry-on .auto-image-grid.smg-grid-orphan > :last-child {
                grid-column: 2 !important;
            }
            html.smg-masonry-on .auto-image-grid.smg-grid-2-tall,
            html.smg-masonry-on .auto-image-grid.smg-grid-pair-tall,
            html.smg-masonry-on .auto-image-grid.smg-true-masonry.smg-grid-pair-tall {
                max-width: 100% !important;
                margin: 12px auto !important;
            }
            html.smg-masonry-on .auto-image-grid > * {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                display: block !important;
                box-sizing: border-box !important;
            }


                        html.smg-masonry-on .auto-image-grid:not(.smg-justified-grid) > img.bbImage,
            html.smg-masonry-on .auto-image-grid:not(.smg-justified-grid) > a > img.bbImage,
            html.smg-masonry-on .auto-image-grid:not(.smg-justified-grid) .bbImageWrapper > img.bbImage {
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                max-height: none !important;
                margin: 0 !important;
                display: block !important;
            }

            /* ---- POST DE GALERIA PURA: TRUE MASONRY (Pinterest-style, colunas independentes contínuas) ---- */
            html.smg-masonry-on .auto-image-grid.smg-true-masonry {
                display: block !important;
                column-count: var(--smg-mcols, 3) !important;
                column-gap: 8px !important;
                margin: 12px auto !important;
                max-width: 100% !important;
                text-align: center !important;
            }
            @media (max-width: 1400px) {
                html.smg-masonry-on .auto-image-grid {
                    --smg-mcols: 2;
                }
                html.smg-masonry-on .auto-image-grid.smg-true-masonry {
                    column-count: var(--smg-mcols, 2) !important;
                }
            }
            @media (max-width: 1760px) {
                html.smg-aldock-on.smg-masonry-on .auto-image-grid {
                    --smg-mcols: 2;
                }
                html.smg-aldock-on.smg-masonry-on .auto-image-grid.smg-true-masonry {
                    column-count: var(--smg-mcols, 2) !important;
                }
            }
            @media (max-width: 599px) {
                html.smg-masonry-on .auto-image-grid {
                    --smg-mcols: 1;
                }
                html.smg-masonry-on .auto-image-grid.smg-true-masonry {
                    column-count: var(--smg-mcols, 1) !important;
                }
            }
            html.smg-masonry-on .auto-image-grid.smg-true-masonry > * {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
                display: block !important;
                width: 100% !important;
                margin: 0 0 8px 0 !important;
                box-sizing: border-box !important;
            }
            html.smg-masonry-on .auto-image-grid.smg-true-masonry img.bbImage,
            html.smg-masonry-on .auto-image-grid.smg-true-masonry .smg-dm-wrap > img.bbImage,
            html.smg-masonry-on .auto-image-grid.smg-true-masonry img.bbImage.smg-vert,
            html.smg-masonry-on .auto-image-grid.smg-true-masonry img.bbImage.smg-wide {
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                max-height: none !important;
                display: block !important;
                object-fit: contain !important;
                margin: 0 0 8px 0 !important;
            }
            html.smg-masonry-on .auto-image-grid.smg-true-masonry > * img.bbImage {
                margin: 0 !important;
                display: block !important;
                width: 100% !important;
                height: auto !important;
                max-height: none !important;
            }
            /* ---- POST COM TEXTO: LINHAS JUSTIFICADAS (OPÇÃO A) ---- */
            html.smg-masonry-on .auto-image-grid.smg-justified-grid {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 8px !important;
                row-gap: 8px !important;
                column-gap: 8px !important;
                justify-content: center !important;
                align-items: stretch !important;
                margin: 12px auto !important;
                max-width: 100% !important;
                text-align: center !important;
            }
            html.smg-masonry-on .auto-image-grid.smg-justified-grid > * {
                flex: var(--smg-ratio, 1) 1 calc(var(--smg-target-h) * var(--smg-ratio, 1)) !important;
                min-width: calc((100% - 16px) / var(--smg-mcols, 3)) !important;
                max-height: var(--smg-media-h, min(70vh, 750px)) !important;
                max-width: 100% !important;
                min-height: 160px !important;
                height: auto !important;
                width: auto !important;
                margin: 0 auto !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                overflow: hidden !important;
            }
            html.smg-masonry-on .auto-image-grid.smg-justified-grid img.bbImage,
            html.smg-masonry-on .auto-image-grid.smg-justified-grid img.bbImage.smg-vert,
            html.smg-masonry-on .auto-image-grid.smg-justified-grid .smg-dm-wrap > img.bbImage,
            html.smg-masonry-on .auto-image-grid.smg-justified-grid .smg-dm-wrap.smg-vert > img.bbImage {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                display: block !important;
            }
            html.smg-masonry-on .auto-image-grid.smg-justified-grid .smg-rg,
            html.smg-masonry-on .auto-image-grid.smg-justified-grid .generic2wide-iframe-div {
                width: 100% !important;
                height: 100% !important;
                max-height: var(--smg-media-h, min(70vh, 750px)) !important;
            }

            /* ---- GRID DE EXATAMENTE 2 IMAGENS (REGRAS CLÁSSICAS DO MASONRY) ---- */
            html.smg-masonry-on .auto-image-grid.smg-grid-2 {
                display: grid !important;
                grid-template-columns: repeat(var(--smg-mcols, 2), minmax(0, 1fr)) !important;
                grid-auto-flow: row dense !important;
                grid-auto-rows: auto !important;
                gap: 8px !important;
                row-gap: 8px !important;
                column-gap: 8px !important;
                align-items: start !important;
                justify-items: stretch !important;
                margin: 12px auto !important;
                max-width: 100% !important;
                text-align: center !important;
            }
            html.smg-masonry-on .auto-image-grid.smg-grid-2.smg-grid-2-tall {
                max-width: 100% !important;
                margin: 12px auto !important;
            }
            html.smg-masonry-on .auto-image-grid.smg-grid-2.smg-grid-2-asym {
                grid-template-columns: var(--smg-col1-w, 1fr) var(--smg-col2-w, 1fr) !important;
                max-width: 100% !important;
            }
            html.smg-masonry-on .auto-image-grid.smg-grid-2 > *,
            html.smg-masonry-on .auto-image-grid.smg-grid-2 img.bbImage,
            html.smg-masonry-on .auto-image-grid.smg-grid-2 img.bbImage.smg-vert,
            html.smg-masonry-on .auto-image-grid.smg-grid-2 img.bbImage.smg-wide,
            html.smg-masonry-on .auto-image-grid.smg-grid-2 .smg-dm-wrap,
            html.smg-masonry-on .auto-image-grid.smg-grid-2 .smg-dm-wrap > img.bbImage,
            html.smg-masonry-on .auto-image-grid.smg-grid-2 .smg-dm-wrap.smg-vert > img.bbImage {
                width: 100% !important;
                height: auto !important;
                max-width: 100% !important;
                max-height: none !important;
                object-fit: contain !important;
                margin: 0 !important;
                display: block !important;
            }
            html.smg-masonry-on .auto-image-grid .generic2wide-iframe-div.smg-player-loaded,
            html.smg-masonry-on .auto-image-grid span[data-s9e-mediaembed].smg-player-loaded,
            html.smg-masonry-on .auto-image-grid .generic2wide-iframe-div:has(.smg-turbo-slot--filled),
            html.smg-masonry-on .auto-image-grid .generic2wide-iframe-div:has(.smg-rg) {
                aspect-ratio: auto !important;
                height: auto !important;
                min-height: 0 !important;
                max-height: none !important;
                overflow: visible !important;
                background: transparent !important;
                max-width: 100% !important;
                display: block !important;
            }
            html.smg-masonry-on .auto-image-grid img.bbImage,
            html.smg-masonry-on .auto-image-grid .smg-dm-wrap > img.bbImage {
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                max-height: var(--smg-media-h, min(70vh, 750px)) !important;
                object-fit: contain !important;
                margin: 0 auto !important;
            }
            html.smg-masonry-on .auto-image-grid.smg-grid-2 .smg-rg,
            html.smg-masonry-on .auto-image-grid .smg-rg {
                width: 100% !important;
                max-width: min(100%, calc(var(--smg-media-h, min(70vh, 750px)) * var(--smg-rg-ratio, 1.7778))) !important;
                max-height: var(--smg-media-h, min(70vh, 750px)) !important;
                aspect-ratio: var(--smg-rg-ratio, 16 / 9) !important;
                margin: 0 auto !important;
            }
            html.smg-masonry-on .auto-image-grid .smg-dm-wrap {
                width: 100% !important;
                max-width: min(100%, calc(var(--smg-media-h, min(70vh, 750px)) * var(--smg-ratio, 1.7778))) !important;
                margin: 0 auto !important;
            }
            html.smg-masonry-on .auto-image-grid .smg-dm-wrap > .smg-dm-video {
                max-height: var(--smg-media-h, min(70vh, 750px)) !important;
                width: 100% !important;
                height: auto !important;
                object-fit: contain !important;
                display: block !important;
                margin: 0 auto !important;
            }
            /* Verticais no masonry: preenchem 100% da largura da coluna, garantindo gap de 8px exato */
            html.smg-masonry-on .auto-image-grid .smg-dm-wrap.smg-vert > .smg-dm-video {
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                max-height: var(--smg-media-h, min(70vh, 750px)) !important;
                object-fit: contain !important;
                margin: 0 !important;
            }
            html.smg-masonry-on .auto-image-grid .smg-rg.smg-rg-vert {
                width: 100% !important;
                max-width: 100% !important; /* rgAspect aplica o teto proporcional inline quando a dimensão real chega */
                max-height: var(--smg-media-h) !important;
                margin-left: auto !important;
                margin-right: auto !important;
            }
            /* O bloco e cada item ficam centralizados: quando a mídia é menor que a coluna, as colunas não parecem soltas. */
            html.smg-masonry-on .auto-image-grid > *,
            html.smg-masonry-on .auto-image-grid > iframe,
            html.smg-masonry-on .auto-image-grid .generic2wide-iframe-div,
            html.smg-masonry-on .auto-image-grid .smg-dm-wrap,
            html.smg-masonry-on .auto-image-grid .smg-rg {
                margin-left: auto !important;
                margin-right: auto !important;
            }
            /* GRID de verdade: sem cantos arredondados nos itens (foto/vídeo/iframe/player); os controles do player (.smg-rgc-*) mantêm o raio */
            html.smg-masonry-on .auto-image-grid > *,
            html.smg-masonry-on .auto-image-grid img.bbImage,
            html.smg-masonry-on .auto-image-grid .smg-dm-wrap,
            html.smg-masonry-on .auto-image-grid .smg-dm-wrap > img.bbImage,
            html.smg-masonry-on .auto-image-grid .smg-dm-wrap > .smg-dm-video,
            html.smg-masonry-on .auto-image-grid > iframe,
            html.smg-masonry-on .auto-image-grid .generic2wide-iframe-div,
            html.smg-masonry-on .auto-image-grid .generic2wide-iframe-div iframe,
            html.smg-masonry-on .auto-image-grid .smg-rg,
            html.smg-masonry-on .auto-image-grid .smg-rg-v { border-radius: 0 !important; }
            /* GALERIA: overlay (igual o feed) com a mídia da thread numa grade masonry de POUCAS colunas + scroll infinito */
            #smg-gallery { position: fixed; inset: 0; z-index: 2147483600; display: none; flex-direction: column; background: var(--smg-bg); }
            #smg-gallery.open { display: flex; }
            #smg-gallery svg { fill: none !important; }   /* o CSS do fórum preenche svgs — força outline */
            #smg-gallery .smg-rg svg[fill="currentColor"] { fill: currentColor !important; }   /* EXCEÇÃO: ícones PREENCHIDOS do player (play/pause) — senão o fill:none acima apaga o triângulo de play */
            /* DOCK da galeria: IDÊNTICA à dock da thread — mesma pílula do #smg-post-nav-panel + botões .smg-nav-btn (makeDockButton) */
            .smg-gallery-dock { position: absolute; left: 50%; bottom: 20px; transform: translateX(-50%); z-index: 6; }
            .smg-gallery-dock-panel {
                position: relative; z-index: 12;   /* (= #smg-post-nav-panel) acima do goto-pop (z 11) p/ os tooltips do hover aparecerem */
                display: flex; flex-direction: row; align-items: center; gap: 6px; padding: 8px;
                border-radius: 999px; background: rgba(26,26,26,0.95); border: 1px solid rgba(255,255,255,0.09);   /* PERF: sem backdrop-filter (dock flutua sobre o scroller mais pesado do script) */
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 34px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.35);
            }
            /* botão fechar = .smg-nav-btn com label VISÍVEL (vira pílula, não círculo) */
            .smg-gallery-close { width: auto !important; border-radius: 20px !important; padding: 0 15px !important; gap: 8px; }
            .smg-gallery-close-label { font-size: 13.5px; font-weight: 600; white-space: nowrap; }
            .smg-gallery-close:hover { background: var(--smg-link) !important; border-color: var(--smg-link) !important; }
            /* SCROLLER vertical · as colunas crescem pra baixo (altura auto) — sem scroll horizontal */
            /* SCROLLER vertical · cada PÁGINA é uma seção com seu próprio masonry (anexar não reembaralha as outras) */
            .smg-gallery-grid { flex: 1 1 auto; overflow-y: auto; overflow-x: hidden; padding: 8px 14px 96px; }   /* 96px embaixo: conteúdo passa por trás da dock flutuante */
            /* separador de página "PAGE N" — NÃO sticky (rola junto); linha divisória mais grossa */
            .smg-gallery-pagehdr {
                display: flex; align-items: center; gap: 16px;
                padding: 16px 2px 11px; font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase;
                color: rgba(255,255,255,0.6);
            }
            .smg-gallery-pagehdr::after { content: ""; flex: 1 1 auto; height: 3px; border-radius: 3px; background: var(--smg-bd2); }
            .smg-gallery-page.is-skel .smg-gallery-pagehdr { opacity: 0.55; }
            .smg-gallery-cols { column-width: 440px; column-gap: 12px; }   /* 1 coluna a menos (tiles maiores) */
            @media (max-width: 700px) { .smg-gallery-grid { padding: 8px 10px 92px; } .smg-gallery-cols { column-width: 46vw; column-gap: 8px; } }
            .smg-gallery-tile { position: relative; display: block; width: 100%; margin: 0 0 12px; padding: 0; border: 0; background: var(--smg-s2); border-radius: 10px; overflow: hidden; cursor: pointer; break-inside: avoid; -webkit-column-break-inside: avoid; }
            .smg-gallery-tile img { display: block; width: 100%; height: auto; }
            .smg-gallery-tile--embed { aspect-ratio: 16 / 9; background: #000; }
            .smg-gallery-play { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
            .smg-gallery-play svg { width: 42px; height: 42px; color: rgba(255,255,255,0.9); fill: currentColor !important; }
            .smg-gallery-tile--embed .saint-iframe { position: absolute; inset: 0; width: 100% !important; height: 100% !important; aspect-ratio: auto !important; max-width: none !important; border: 0 !important; border-radius: 0 !important; }
            /* NOSSO player no tile da galeria: preenche o tile (o iframe antigo tinha isso; sem a regra o .smg-rg colapsa = tile preto) */
            .smg-gallery-tile--embed .smg-rg { position: absolute; inset: 0; width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important; margin: 0 !important; border-radius: 0 !important; aspect-ratio: auto !important; }
            .smg-gallery-max { position: absolute; top: 6px; right: 6px; z-index: 3; width: 30px; height: 30px; border: 0; border-radius: 8px; background: rgba(0,0,0,0.55); color: #fff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .15s ease; }
            .smg-gallery-max svg { width: 16px; height: 16px; }
            .smg-gallery-max:hover { background: rgba(0,0,0,0.82); }
            .smg-gallery-tile--embed:hover .smg-gallery-max { opacity: 1; }
            @media (hover: none) { .smg-gallery-max { opacity: 1; } }
            .smg-gallery-tile:hover { outline: 2px solid var(--smg-link); outline-offset: -2px; }
            .smg-gallery-empty { padding: 44px; text-align: center; color: rgba(255,255,255,0.5); }
            /* skeleton da galeria: tiles-fantasma (shimmer) reservam espaço durante o fetch → menos "pulo" da página */
            .smg-gallery-skel { position: relative; width: 100%; margin: 0 0 12px; border-radius: 10px; overflow: hidden; background: var(--smg-s2); break-inside: avoid; -webkit-column-break-inside: avoid; }
            .smg-gallery-skel::after, .smg-gallery-tile.is-loading::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent); animation: smg-skel-shimmer 1.3s ease-in-out infinite; }
            .smg-gallery-tile--image.is-loading { min-height: 150px; background: var(--smg-s2); }
            .smg-gallery-tile--image.is-loading img { opacity: 0; }
            .smg-gallery-tile--image img { transition: opacity .25s ease; }
`;