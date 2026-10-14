    // ── CSS: masonry mosaic (in-post groups) and the gallery overlay ──
    const CSS_MEDIA_GRIDS = `
            /* ---- MOSAICO (motor masonry, 08a): grupo de imagens no post + overlay da galeria ----
               O motor posiciona cada item (transform + width + height inline) e dá a altura do container;
               o CSS só tira os itens do fluxo e faz a mídia preencher a caixa (a caixa já tem a proporção dela,
               então cover não corta nada depois que a proporção real chega). */
            .smg-mason {
                position: relative !important;
                display: block !important;
                box-sizing: border-box !important;
                overflow-anchor: none;
            }
            .smg-mason > * {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                margin: 0 !important;
                box-sizing: border-box !important;
            }
            html.smg-masonry-on .auto-image-grid.smg-mason {
                width: 100% !important;
                max-width: 100% !important;
                margin: var(--smg-sp-12) 0 !important;
            }
            /* .smg-mason dobrado: vence os wrappers de imagem solta (a.smg-imglink:has(> img.smg-wide) = 0,3,2) */
            html.smg-masonry-on .auto-image-grid.smg-mason.smg-mason > * {
                display: block !important;
                margin: 0 !important;
                padding: 0 !important;
                max-width: none !important;
                max-height: none !important;
                min-height: 0 !important;
                overflow: hidden !important;
                border-radius: var(--smg-img-r) !important;
                background: var(--smg-s2);
            }
            html.smg-masonry-on .auto-image-grid.smg-mason img.bbImage {
                display: block !important;
                width: 100% !important;
                height: 100% !important;
                max-width: none !important;
                max-height: none !important;
                margin: 0 !important;
                object-fit: cover !important;
                border-radius: var(--smg-img-r) !important;
                aspect-ratio: auto !important;
            }
            html.smg-masonry-on .auto-image-grid.smg-mason > :not(.smg-mvid) > * {
                width: 100% !important;
                height: 100% !important;
                margin: 0 !important;
            }
            /* VÍDEO no mosaico (.smg-mvid = a caixa do player): o motor dá a caixa na proporção do vídeo (2 colunas
               se deitado); slot, player, iframe e o span do s9e preenchem ela. Teto de altura/16:9 do player solto
               não valem aqui. O player nunca sai do lugar no DOM: só o motor muda posição e tamanho. */
            html.smg-masonry-on .auto-image-grid.smg-mason.smg-mason > .smg-mvid {
                background: #000 !important;
                aspect-ratio: auto !important;
            }
            html.smg-masonry-on .auto-image-grid.smg-mason > .smg-mvid .smg-turbo-slot,
            html.smg-masonry-on .auto-image-grid.smg-mason > .smg-mvid .smg-rg,
            html.smg-masonry-on .auto-image-grid.smg-mason > .smg-mvid[data-s9e-mediaembed] > span,
            html.smg-masonry-on .auto-image-grid.smg-mason > .smg-mvid iframe {
                position: absolute !important;
                inset: 0 !important;
                width: 100% !important;
                height: 100% !important;
                max-width: none !important;
                max-height: none !important;
                min-height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                aspect-ratio: auto !important;
                border-radius: inherit !important;
            }
            html.smg-masonry-on .auto-image-grid.smg-mason > .smg-mvid .smg-turbo-slot,
            html.smg-masonry-on .auto-image-grid.smg-mason > .smg-mvid .smg-rg { overflow: hidden !important; }
            /* link de escape do turbo/cyberdrop (só aparece na falha): por cima do slot, no canto */
            html.smg-masonry-on .auto-image-grid.smg-mason > .smg-mvid > .smg-turbo-fallback {
                position: absolute !important; left: var(--smg-sp-8); bottom: var(--smg-sp-8); z-index: var(--smg-z-3);
            }
            /* caixa de imagem morta no mosaico: ocupa o lugar da imagem, conteúdo centrado */
            html.smg-masonry-on .auto-image-grid.smg-mason > .smg-dead {
                display: flex !important;
                flex-wrap: wrap !important;
                align-content: center !important;
                justify-content: center !important;
                text-align: center !important;
            }
            html.smg-masonry-on .auto-image-grid.smg-mason > .smg-dead > * { width: auto !important; height: auto !important; }
            /* GALERIA: overlay (igual o feed) com a mídia da thread numa grade masonry de POUCAS colunas + scroll infinito */
            #smg-gallery { position: fixed; inset: 0; z-index: var(--smg-z-overlay); display: none; flex-direction: column; background: var(--smg-bg); }
            #smg-gallery.open { display: flex; }
            #smg-gallery svg { fill: none !important; }   /* o CSS do fórum preenche svgs — força outline */
            #smg-gallery .smg-rg svg[fill="currentColor"] { fill: currentColor !important; }   /* EXCEÇÃO: ícones PREENCHIDOS do player (play/pause) — senão o fill:none acima apaga o triângulo de play */
            /* DOCK da galeria: IDÊNTICA à dock da thread — mesma pílula do #smg-post-nav-panel + botões .smg-nav-btn (makeDockButton) */
            .smg-gallery-dock { position: absolute; left: 50%; bottom: 20px; transform: translateX(-50%); z-index: var(--smg-z-6); }
            .smg-gallery-dock-panel {
                position: relative; z-index: var(--smg-z-pop-up);   /* (= #smg-post-nav-panel) acima do goto-pop (z 11) p/ os tooltips do hover aparecerem */
                display: flex; flex-direction: row; align-items: center; gap: var(--smg-sp-6); padding: var(--smg-sp-8);
                border-radius: var(--smg-r-pill); background: rgba(26,26,26,0.95); border: 1px solid var(--smg-w-10);   /* PERF: sem backdrop-filter (dock flutua sobre o scroller mais pesado do script) */
                box-shadow: var(--smg-hl), var(--smg-shadow-3), var(--smg-shadow-1);
            }
            /* botão fechar = .smg-nav-btn com label VISÍVEL (vira pílula, não círculo) */
            .smg-gallery-close { width: auto !important; border-radius: var(--smg-r-20) !important; padding: 0 var(--smg-sp-16) !important; gap: var(--smg-sp-8); }
            .smg-gallery-close-label { font-size: var(--smg-fs-14); font-weight: 600; white-space: nowrap; }
            .smg-gallery-close:hover { background: var(--smg-link) !important; border-color: var(--smg-link) !important; }
            /* SCROLLER vertical · cada PÁGINA é uma seção com seu próprio mosaico (motor 08a; anexar não reembaralha as outras) */
            .smg-gallery-grid { flex: 1 1 auto; overflow-y: auto; overflow-x: hidden; padding: var(--smg-sp-8) var(--smg-sp-14) 96px; }   /* 96px embaixo: conteúdo passa por trás da dock flutuante */
            /* separador de página "PAGE N" — NÃO sticky (rola junto); linha divisória mais grossa */
            .smg-gallery-pagehdr {
                display: flex; align-items: center; gap: var(--smg-sp-16);
                padding: var(--smg-sp-16) var(--smg-sp-2) var(--smg-sp-12); font-size: var(--smg-fs-12); font-weight: 800; letter-spacing: .08em; text-transform: uppercase;
                color: var(--smg-w-60);
            }
            .smg-gallery-pagehdr::after { content: ""; flex: 1 1 auto; height: 3px; border-radius: var(--smg-r-4); background: var(--smg-bd2); }
            .smg-gallery-page.is-skel .smg-gallery-pagehdr { opacity: 0.55; }
            @media (max-width: 800px) { .smg-gallery-grid { padding: var(--smg-sp-8) var(--smg-sp-10) 92px; } }
            /* tile = item do mosaico: o motor dá posição, largura e altura (proporção da mídia) */
            .smg-gallery-tile { display: block; padding: 0; border: 0; background: var(--smg-s2); border-radius: var(--smg-r-10); overflow: hidden; cursor: pointer; }
            .smg-gallery-tile img { display: block; width: 100%; height: 100%; object-fit: cover; }
            .smg-gallery-tile--embed { background: #000; }
            .smg-gallery-play { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
            .smg-gallery-play svg { width: 42px; height: 42px; color: var(--smg-w-95); fill: currentColor !important; }
            .smg-gallery-tile--embed .saint-iframe { position: absolute; inset: 0; width: 100% !important; height: 100% !important; aspect-ratio: auto !important; max-width: none !important; border: 0 !important; border-radius: 0 !important; }
            /* NOSSO player no tile da galeria: preenche o tile (o iframe antigo tinha isso; sem a regra o .smg-rg colapsa = tile preto) */
            .smg-gallery-tile--embed .smg-rg { position: absolute; inset: 0; width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important; margin: 0 !important; border-radius: 0 !important; aspect-ratio: auto !important; }
            .smg-gallery-max { position: absolute; top: 6px; right: 6px; z-index: var(--smg-z-3); width: 30px; height: 30px; border: 0; border-radius: var(--smg-r-8); background: var(--smg-k-55); color: #fff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; opacity: 0; transition: opacity var(--smg-dur-15) ease; }
            .smg-gallery-max svg { width: 16px; height: 16px; }
            .smg-gallery-max:hover { background: var(--smg-k-82); }
            .smg-gallery-tile--embed:hover .smg-gallery-max { opacity: 1; }
            @media (hover: none) { .smg-gallery-max { opacity: 1; } }
            .smg-gallery-tile:hover { outline: 2px solid var(--smg-link); outline-offset: -2px; }
            .smg-gallery-empty { padding: 44px; text-align: center; color: var(--smg-w-50); }
            /* skeleton da galeria: tiles-fantasma (shimmer) reservam espaço durante o fetch → menos "pulo" da página */
            .smg-gallery-skel { border-radius: var(--smg-r-10); overflow: hidden; background: var(--smg-s2); }
            .smg-gallery-tile--image.is-loading { background: var(--smg-s2); }
            .smg-gallery-tile--image.is-loading img { opacity: 0; }
            .smg-gallery-tile--image img { transition: opacity var(--smg-dur-30) ease; }
`;