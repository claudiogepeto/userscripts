    // STYLE CONTEXT: Global tokens, reset, media and shared components
    const CSS_BASE = `
            /* ===== ÍNDICE DO CSS (grep os rótulos abaixo) =====
               paleta (--smg-*) · image grids · images · turbo embeds · redgifs
               · site a 80% (largura) · header das páginas
               · SMG: remove sidebar+breadcrumb fora da home (conteúdo a 100%)
               · HOME (forum_list) reformulada · TOPBAR REFORMULADA
               · dock (container/botões/sheets/goto) · search dialog · modo feed
               · mobile (navbar) · settings/filtros · backdrop dos popovers
               · SMG: BARRA ÚNICA SEGMENTADA (filter bar: pager·ordenar·ações) → buildFilterBars
               · THREAD (header simpcity nativo) · listas (thumb/grid) · hover preview */
            /* ===== paleta do tema: cores CHAPADAS derivadas da cor da topbar de cada site,
               com pequenos degraus de claridade pra dar legibilidade (sem gradiente) ===== */
            html.smg-sc, html.smg-smg {
                --smg-bg: hsl(0 0% 9%);            /* base = cor da topbar (simpcity) */
                --smg-s1: hsl(0 0% 12.5%);         /* superfície: popovers, sheets, dock, cards */
                --smg-s2: hsl(0 0% 16%);           /* hover / inputs / header de card */
                --smg-s3: hsl(0 0% 21%);           /* ativo / selecionado / botão primário / switch on */
                --smg-s3-hover: hsl(0 0% 26%);     /* hover do estado ativo */
                --smg-bd: rgba(255,255,255,0.10);  /* borda padrão */
                --smg-bd2: rgba(255,255,255,0.17); /* borda em destaque/ativo */
                --smg-card: rgba(255,255,255,0.035); /* superfície sutil sobre o bg do site (cards) */
                --smg-card-head: rgba(255,255,255,0.06);
                --smg-scrim: rgba(0,0,0,0.66);      /* backdrop de overlays */
                --smg-media-h: 75vh;                /* altura MÁX de imagem/vídeo/skeleton no post (teto p/ não estourar o viewport, inclusive no masonry) */
            }
            html.smg-smg {
                --smg-bg: #1a1a1a;                  /* cor da topbar do socialmediagirls */
                --smg-s1: hsl(0 0% 13.5%);
                --smg-s2: hsl(0 0% 17%);
                --smg-s3: hsl(0 0% 22%);
                --smg-s3-hover: hsl(0 0% 27%);
            }
            /* ACENTO do tema, POR SITE: VERDE no SimpCity, ROSA no SocialMediaGirls. Usa o linkColor real do
               fórum quando exposto; senão cai no fallback da marca. Todo var(--smg-link, ...) passa a seguir isto. */
            html.smg-sc  { --smg-link: hsl(var(--xf-linkColor--h, 145), var(--xf-linkColor--s, 58%), var(--xf-linkColor--l, 50%)); --smg-link-soft: hsla(var(--xf-linkColor--h, 145), var(--xf-linkColor--s, 58%), var(--xf-linkColor--l, 50%), 0.10); --smg-link-strong: hsl(var(--xf-linkColor--h, 145), var(--xf-linkColor--s, 58%), 38%); }
            /* SMG: saturação CONTROLADA (a do fórum era neon demais) — hue do fórum, s/l fixos mais suaves */
            html.smg-smg { --smg-link: hsl(var(--xf-linkColor--h, 334), 76%, 70%); --smg-link-soft: hsla(var(--xf-linkColor--h, 334), 76%, 70%, 0.10); --smg-link-strong: hsl(var(--xf-linkColor--h, 334), 64%, 48%); }
            /* --smg-link-strong = acento mais FUNDO p/ fundos preenchidos (texto branco lê bem nos 2 sites) */
            /* largura do conteúdo (e da topbar): 80% no desktop, 75% em telas >= 3xl (1920px).
               no mobile NÃO se aplica (a regra que usa isto fica num @media min-width:800px) */
            html.smg-sc, html.smg-smg { --smg-cw: 80%; }
            @media (min-width: 1920px) { html.smg-sc, html.smg-smg { --smg-cw: 75%; } }
            /* rail lateral aberto: a coluna do fórum ESTICA (80→94%). O rail já levou ~380px; manter
               20% de margem vazia em cima disso desperdiçaria duas vezes a mesma tela. Especificidade
               maior (2 classes) que a regra base, e o override de 1920px vem DEPOIS → os dois valem. */
            html.smg-aldock-on.smg-sc, html.smg-aldock-on.smg-smg { --smg-cw: 94%; }
            @media (min-width: 1920px) { html.smg-aldock-on.smg-sc, html.smg-aldock-on.smg-smg { --smg-cw: 92%; } }

            /* ---- image grids ---- */
            .auto-image-grid {
                display: block !important;
                column-count: var(--smg-mcols, 3) !important;
                column-gap: 8px !important;
                grid-template-columns: none !important; grid-auto-rows: auto !important;
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
            /* MASONRY por CSS Grid — linhas explícitas, ordem visual por linha e espaçamento único.
               Cada item mantém sua altura natural; sem row-span calculado em JS, não há corte nem
               sobreposição quando a proporção real chega. */
            html.smg-masonry-on .auto-image-grid {
                display: grid !important;
                grid-template-columns: repeat(var(--smg-mcols, 3), minmax(0, 1fr)) !important;
                grid-auto-flow: row !important;
                grid-auto-rows: auto !important;
                gap: 8px !important;
                align-items: start !important;
                justify-items: center !important;
                margin: 12px auto !important;
                max-width: 100%;
                text-align: center !important;
            }
            html.smg-masonry-on .auto-image-grid.smg-grid-orphan > :last-child { grid-column: 2; }
            html.smg-masonry-on .auto-image-grid.smg-grid-2-tall {
                max-width: min(720px, 66.6%) !important;
                margin: 12px auto !important;
            }
            html.smg-masonry-on .auto-image-grid > * {
                width: 100% !important; max-width: none !important; margin: 0 !important; display: block;
            }
            html.smg-masonry-on .auto-image-grid .generic2wide-iframe-div {
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                display: block !important;
                aspect-ratio: 16 / 9;
                position: relative;
                border-radius: 0 !important;
                background: #000;
                overflow: hidden;
            }
            html.smg-masonry-on .auto-image-grid .generic2wide-iframe-div:has(.smg-turbo-slot--filled),
            html.smg-masonry-on .auto-image-grid .generic2wide-iframe-div:has(.smg-rg) {
                aspect-ratio: auto !important;
                min-height: 0 !important;
                overflow: visible !important;
                background: transparent !important;
            }
            .smg-fp-content iframe,
            .smg-fp-content .auto-image-grid iframe,
            html.smg-masonry-on .auto-image-grid > iframe,
            html.smg-masonry-on .auto-image-grid .generic2wide-iframe-div iframe {
                width: 100% !important;
                max-width: 100% !important;
                aspect-ratio: 16 / 9 !important;
                height: auto !important;
                border: none !important;
                border-radius: 8px !important;
                display: block !important;
            }
            html.smg-masonry-on .auto-image-grid img.bbImage,
            html.smg-masonry-on .auto-image-grid .smg-dm-wrap > img.bbImage {
                width: 100% !important;
                height: auto !important;
                max-height: none !important;
            }
            html.smg-masonry-on .auto-image-grid .smg-dm-wrap > .smg-dm-video { max-height: var(--smg-media-h) !important; width: 100% !important; object-fit: contain !important; }
            html.smg-masonry-on .auto-image-grid .smg-rg { width: 100% !important; max-width: none !important; max-height: var(--smg-media-h) !important; margin: 0 !important; }   /* player: preenche a coluna mas NÃO passa do teto (o .smg-rg-v já é contain) */
            /* Verticais: o teto reduz a largura proporcionalmente; nunca usa altura fixa em uma mídia de largura cheia. */
            html.smg-masonry-on .auto-image-grid img.bbImage.smg-vert,
            html.smg-masonry-on .auto-image-grid .smg-dm-wrap.smg-vert,
            html.smg-masonry-on .auto-image-grid .smg-dm-wrap.smg-vert > img.bbImage,
            html.smg-masonry-on .auto-image-grid .smg-dm-wrap.smg-vert > .smg-dm-video {
                width: auto !important;
                max-width: 100% !important;
                height: auto !important;
                max-height: var(--smg-media-h) !important;
                object-fit: contain !important;
                margin-left: auto !important;
                margin-right: auto !important;
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
            /* PAR vertical/misto (2 itens, 2 colunas lado a lado): ocupam o máximo de espaço, mas com altura máx de 75vh. O par horizontal cai em 1 coluna (full width) pela lógica do JS. */
            html.smg-masonry-on .auto-image-grid.smg-grid-pair-port .smg-dm-wrap > .smg-dm-video,
            html.smg-masonry-on .auto-image-grid.smg-grid-pair-port .smg-rg { max-height: 75vh !important; }
            /* GALERIA: overlay (igual o feed) com a mídia da thread numa grade masonry de POUCAS colunas + scroll infinito */
            #smg-gallery { position: fixed; inset: 0; z-index: 2147483600; display: none; flex-direction: column; background: var(--smg-bg); }
            #smg-gallery.open { display: flex; }
            #smg-gallery svg { fill: none !important; }   /* o CSS do fórum preenche svgs — força outline */
            #smg-gallery .smg-rg svg[fill="currentColor"] { fill: currentColor !important; }   /* EXCEÇÃO: ícones PREENCHIDOS do player (play/pause) — senão o fill:none acima apaga o triângulo de play */
            /* stepper "ir pra página" da galeria — MESMO visual do #smg-goto-pop da thread (filhos .smg-goto-* já são classes compartilhadas) */
            .smg-gallery-goto-pop {
                position: absolute; bottom: calc(100% + 12px); left: 50%; transform: translateX(-50%) translateY(6px);
                display: flex; flex-direction: column; align-items: center; gap: 11px;
                min-width: 232px; padding: 16px 18px; border-radius: 18px;
                background: var(--smg-s1); border: 1px solid rgba(255,255,255,0.1);
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 44px rgba(0,0,0,0.62);
                -webkit-backdrop-filter: blur(20px) saturate(170%); backdrop-filter: blur(20px) saturate(170%);
                visibility: hidden; opacity: 0; pointer-events: none;
                transition: opacity .18s ease, transform .18s ease, visibility .18s; z-index: 11;
            }
            .smg-gallery-dock.goto-open .smg-gallery-goto-pop { visibility: visible; opacity: 1; pointer-events: auto; transform: translateX(-50%) translateY(0); }
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
            .smg-gallery-close:hover { background: var(--smg-link, #ff77b2) !important; border-color: var(--smg-link, #ff77b2) !important; }
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
            .smg-gallery-tile:hover { outline: 2px solid var(--smg-link, #ff77b2); outline-offset: -2px; }
            .smg-gallery-empty { padding: 44px; text-align: center; color: rgba(255,255,255,0.5); }
            /* skeleton da galeria: tiles-fantasma (shimmer) reservam espaço durante o fetch → menos "pulo" da página */
            .smg-gallery-skel { position: relative; width: 100%; margin: 0 0 12px; border-radius: 10px; overflow: hidden; background: var(--smg-s2); break-inside: avoid; -webkit-column-break-inside: avoid; }
            .smg-gallery-skel::after, .smg-gallery-tile.is-loading::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent); animation: smg-skel-shimmer 1.3s ease-in-out infinite; }
            .smg-gallery-tile--image.is-loading { min-height: 150px; background: var(--smg-s2); }
            .smg-gallery-tile--image.is-loading img { opacity: 0; }
            .smg-gallery-tile--image img { transition: opacity .25s ease; }

            /* ---- images ---- */
            img.bbImage {
                width: auto !important;
                height: auto !important;
                max-width: min(75%, 880px) !important;
                max-height: none !important;
                display: block !important;
                margin: 0 auto !important;
                border-radius: 8px !important;
                cursor: pointer !important;
            }
            a.smg-imglink {
                display: table !important;
                width: fit-content !important;
                max-width: 100% !important;
                margin-left: auto !important;
                margin-right: auto !important;
                margin-top: 8px !important;
                margin-bottom: 8px !important;
                text-align: center !important;
            }
            .bbImageWrapper {
                display: table !important;
                width: fit-content !important;
                max-width: 100% !important;
                margin-left: auto !important;
                margin-right: auto !important;
                margin-top: 8px !important;
                margin-bottom: 8px !important;
                text-align: center !important;
            }
            .auto-image-grid a.smg-imglink, .portrait-grid a.smg-imglink {
                display: block !important;
                width: 100% !important;
                margin: 0 !important;
            }
            /* verticais: NÃO força largura da coluna (era o que estourava a altura). Capa pela
               altura (width:auto) → a vertical nunca passa de --smg-media-h, centrada na coluna. */
            .portrait-grid img.bbImage {
                width: auto !important;
                max-width: 100% !important;
                max-height: none !important;
                object-fit: contain !important;
            }
            /* skeleton: shimmer enquanto a imagem do post não pintou (sem DOM extra — é o bg da própria <img>).
               aspect-ratio (não min-height fixo!) → o box escala com a largura, batendo com a maioria das
               imagens (paisagem). a thumb fica visível e fixa o tamanho real; o JS troca pra inline aspect-ratio
               no load. some no .smg-img-ready. Anti-CLS: a faixa antiga de 160px fixos estourava ao carregar. */
            /* PERF: pulso de OPACITY (composita na GPU) em vez do shimmer por background-position (que repintava
               a caixa INTEIRA a cada frame × dezenas de imgs carregando ao mesmo tempo no burst do scroll infinito).
               O keyframes smg-img-shimmer continua existindo pros consumidores pequenos (fhcard 72px). */
            img.bbImage:not(.smg-img-ready) {
                width: 100% !important;
                /* MESMA proporção provisória que o masonry usa pra reservar as linhas (blockRelH). Estavam
                   divergentes — o CSS pintava 16/10 (paisagem) e o grid reservava 1.3 (retrato), então TODO
                   item nascia com o espaço errado e a página se reorganizava quando a imagem chegava.
                   O JS escreve --smg-img-ph a partir da constante única (IMG_PH_RELH). */
                aspect-ratio: var(--smg-img-ph, 10 / 13);
                object-fit: cover;
                background-color: var(--smg-s2, rgba(255,255,255,0.05));
                border-radius: 8px;
            }
            @keyframes smg-img-shimmer { 0% { background-position: 160% 0; } 100% { background-position: -160% 0; } }
            /* host de imagem (jpg6/cuckcapital) lento/intermitente: o FÓRUM faz .lazyload/.lazyloading{opacity:0} até carregar. Quando o host pendura, a img some (opacity 0). Força visível p/ estas (têm data-smg-link) → aparece o shimmer e depois a img; se travar de vez, o JS troca por link. */
            img.bbImage[data-smg-link] { opacity: 1 !important; }
            /* fallback de imagem que não renderiza (jpg6.su/jpg5 & afins fora do ar) → chip de link clicável */
            /* CHIP de link solto: mesmo idioma visual dos cards (borda, raio, tipografia), só que numa
               linha — antes era uma caixa alta, com fonte grande e a URL quebrada no meio da palavra. */
            .smg-imglink-fallback { display: inline-flex; align-items: center; gap: 8px; max-width: 100%; margin: 3px 0; padding: 5px 10px; border: 1px solid var(--smg-bd, rgba(255,255,255,0.12)); border-radius: 9px; background: var(--smg-s1, #16171b); color: var(--smg-tx, #e7e7ea) !important; font-size: 12.5px; font-weight: 500; text-decoration: none !important; vertical-align: middle; }
            .smg-imglink-fallback::before { content: "🔗"; font-size: 12px; opacity: 0.7; flex: 0 0 auto; }
            .smg-imglink-fallback.smg-has-fav::before { content: none; }   /* achamos o ícone do site → dispensa o emoji */
            .smg-linkfav { flex: 0 0 auto; width: 16px; height: 16px; border-radius: 4px; object-fit: contain; }
            .smg-linktext { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .smg-imglink-fallback:hover { background: var(--smg-s2, rgba(255,255,255,0.06)); border-color: var(--smg-bd2, rgba(255,255,255,0.2)); color: var(--smg-link, #ff77b2) !important; }

            /* card de link de file-host (pixeldrain/bunkr): thumb(s) à ESQUERDA + host + sub (galeria/contagem) + ↗. O card é o próprio <a>. */
            .smg-fhcard { display: flex; align-items: center; gap: 4px; width: 100%; box-sizing: border-box; margin: 8px 0; padding: 6px; border: 1px solid var(--smg-bd, rgba(255,255,255,0.12)); border-radius: 14px; background: var(--smg-s1, #16171b); transition: border-color .15s ease, box-shadow .15s ease, transform .12s ease; }
            .smg-fhcard:hover { border-color: var(--smg-bd2, rgba(255,255,255,0.22)); box-shadow: 0 6px 20px rgba(0,0,0,0.32); }
            .smg-fhcard-main { display: flex; align-items: center; gap: 12px; flex: 1 1 auto; min-width: 0; padding: 4px; border-radius: 10px; text-decoration: none !important; color: var(--smg-tx, #e7e7ea) !important; }
            .smg-fhcard-main:hover { background: var(--smg-s2, rgba(255,255,255,0.06)); }
            .smg-fhcard-btn { flex: 0 0 auto; align-self: center; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 0; border-radius: 9px; background: transparent; color: var(--smg-link, #ff77b2); cursor: pointer; text-decoration: none !important; transition: background .14s ease; }
            .smg-fhcard-btn:hover { background: var(--smg-s2, rgba(255,255,255,0.08)); }
            .smg-fhcard-btn svg { width: 17px; height: 17px; }
            .smg-fhcard-copied { color: #46d369 !important; }
            /* preview RICO: mosaico de até 4 thumbs + badge de contagem + "+N" no último */
            .smg-fhcard-thumb { position: relative; flex: 0 0 auto; width: 96px; height: 96px; border-radius: 11px; overflow: hidden; background: var(--smg-s2, rgba(255,255,255,0.06)); }
            .smg-fhcard-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .smg-fhcard-thumb--multi { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 2px; }
            .smg-fhcard-cell { position: relative; overflow: hidden; background: var(--smg-s2, rgba(255,255,255,0.06)); }
            .smg-fhcard-more { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.56); color: #fff; font-size: 16px; font-weight: 800; }
            .smg-fhcard-count { position: absolute; left: 6px; bottom: 6px; display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px 2px 6px; border-radius: 999px; background: rgba(0,0,0,0.66); color: #fff; font: 700 11.5px/1 -apple-system, system-ui, sans-serif; }
            .smg-fhcard-count svg { width: 12px; height: 12px; fill: none !important; }
            /* skeleton enquanto a thumb carrega (some no load); reusa o @keyframes smg-img-shimmer */
            .smg-fhcard-thumb--loading { background-image: linear-gradient(90deg, transparent, rgba(255,255,255,0.07) 50%, transparent); background-size: 220% 100%; background-repeat: no-repeat; animation: smg-img-shimmer 1.25s ease-in-out infinite; }
            /* sem thumb → logo grande do host centralizado no tile */
            /* SEM preview real (só logo/inicial): tile MENOR. Um favicon de 32px esticado num quadrado de
               96px só gastava altura — o tile grande existe pro mosaico de thumbs, que aí sim mostra algo. */
            .smg-fhcard-thumb--logo, .smg-fhcard-thumb--letter { width: 54px; height: 54px; border-radius: 10px; }
            .smg-fhcard-thumb--logo { display: flex; align-items: center; justify-content: center; }
            .smg-fhcard-thumb--logo img.smg-fhcard-logo { width: 30px; height: 30px; object-fit: contain; }
            .smg-fhcard-thumb--letter { display: flex; align-items: center; justify-content: center; font: 800 22px/1 -apple-system, system-ui, "Segoe UI", sans-serif; color: #fff; background: linear-gradient(135deg, var(--smg-link-strong, #d14d8f), var(--smg-link, #ff77b2)); }
            .smg-fhcard-thumb--instagram {
                background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            .smg-fhcard-thumb--instagram svg {
                width: 30px !important;
                height: 30px !important;
                color: #fff !important;
                stroke: #fff !important;
            }
            .smg-fhcard--inline .smg-fhcard-thumb--instagram svg {
                width: 15px !important;
                height: 15px !important;
            }
            .smg-fhcard-thumb--x, .smg-fhcard-thumb--twitter {
                background: #000 !important;
                border: 1px solid rgba(255,255,255,0.15) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            .smg-fhcard-thumb--x svg, .smg-fhcard-thumb--twitter svg {
                width: 22px !important;
                height: 22px !important;
                color: #fff !important;
                fill: #fff !important;
            }
            .smg-fhcard--inline .smg-fhcard-thumb--x svg, .smg-fhcard--inline .smg-fhcard-thumb--twitter svg {
                width: 13px !important;
                height: 13px !important;
            }
            .smg-fhcard-body { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1 1 auto; }
            .smg-fhcard-host { font-size: 14px; font-weight: 800; color: var(--smg-tx, #e7e7ea); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .smg-fhcard-sub { font-size: 12px; color: var(--smg-tx2, rgba(255,255,255,0.55)); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            /* DENTRO DE LISTA/TABELA: uma linha por item. O card cheio (tile de 96px) repetido em cada
               <li> de uma lista de 80 links viraria uma página quilométrica — aqui ele vira uma pílula. */
            .smg-fhcard--inline { margin: 2px 0; padding: 2px 4px; border-radius: 9px; gap: 2px; }
            .smg-fhcard--inline .smg-fhcard-main { gap: 8px; padding: 2px; }
            .smg-fhcard--inline .smg-fhcard-thumb { width: 24px; height: 24px; border-radius: 7px; }
            .smg-fhcard--inline .smg-fhcard-thumb--letter { font-size: 12px; }
            .smg-fhcard--inline .smg-fhcard-thumb--logo img.smg-fhcard-logo { width: 15px; height: 15px; }
            .smg-fhcard--inline .smg-fhcard-thumb--multi { gap: 1px; }
            .smg-fhcard--inline .smg-fhcard-count { left: 2px; bottom: 2px; padding: 1px 5px 1px 4px; font-size: 9.5px; }
            .smg-fhcard--inline .smg-fhcard-count svg { width: 9px; height: 9px; }
            .smg-fhcard--inline .smg-fhcard-more { font-size: 10px; }
            /* título e host na MESMA linha (o sub vira sufixo discreto): duas linhas por item dobravam a
               altura da lista sem acrescentar nada — o host já aparece no ícone. */
            .smg-fhcard--inline .smg-fhcard-body { flex-direction: row; align-items: baseline; gap: 7px; }
            .smg-fhcard--inline .smg-fhcard-host { font-size: 13px; font-weight: 600; flex: 0 1 auto; }
            .smg-fhcard--inline .smg-fhcard-sub { font-size: 10.5px; flex: 0 0 auto; opacity: 0.75; }
            .smg-fhcard--inline .smg-fhcard-btn { width: 24px; height: 24px; border-radius: 7px; }
            .smg-fhcard--inline .smg-fhcard-btn svg { width: 13px; height: 13px; }
            /* o marcador do <li> some quando o conteúdo vira bloco → mantém a numeração da lista original */
            .bbWrapper li > .smg-fhcard--inline { display: flex; }

            /* ---- socialmediagirls width fix ---- */
            /* PERF: era .bbWrapper:has(.generic2wide-iframe-div) etc — :has é reavaliado pelo engine a cada mutação
               de subtree, e o processAll muta quase todo frame. markG2wWrappers (JS) marca .smg-has-g2w no
               wrapper-pai 1× por embed → casa classe estática. */
            .smg-has-g2w,
            .bbCodeBlock {
                width: 100% !important;
                max-width: none !important;
            }

            /* ---- Embeds Oficiais (Twitter / X e Instagram) ---- */
            .smg-twitter-embed,
            .smg-ig-embed-wrap {
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                margin: 16px auto !important;
                max-width: 550px !important;
                width: 100% !important;
                min-height: 100px;
            }
            .smg-twitter-embed iframe,
            .twitter-tweet {
                margin-left: auto !important;
                margin-right: auto !important;
                max-width: 100% !important;
            }

            /* ---- Twitter / X Rich Card & Video Player ---- */
            .smg-tw-card {
                display: flex !important;
                flex-direction: column !important;
                width: 100% !important;
                max-width: 560px !important;
                margin: 14px auto !important;
                padding: 16px 18px !important;
                background: var(--smg-s1, #16171b) !important;
                border: 1px solid rgba(255,255,255,0.12) !important;
                border-radius: 16px !important;
                box-shadow: 0 4px 16px rgba(0,0,0,0.3) !important;
                color: var(--smg-tx, #e7e7ea) !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
                box-sizing: border-box !important;
            }
            .smg-tw-head {
                display: flex !important;
                align-items: center !important;
                gap: 12px !important;
                margin-bottom: 12px !important;
            }
            .smg-tw-avatar {
                width: 42px !important;
                height: 42px !important;
                border-radius: 50% !important;
                overflow: hidden !important;
                flex-shrink: 0 !important;
                background: var(--smg-s2, rgba(255,255,255,0.06)) !important;
            }
            .smg-tw-avatar img {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                display: block !important;
            }
            .smg-tw-author {
                display: flex !important;
                flex-direction: column !important;
                flex: 1 1 auto !important;
                min-width: 0 !important;
                gap: 2px !important;
            }
            .smg-tw-name {
                font-weight: 700 !important;
                font-size: 14.5px !important;
                color: var(--smg-tx, #e7e7ea) !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
                text-decoration: none !important;
            }
            .smg-tw-name:hover {
                text-decoration: underline !important;
            }
            .smg-tw-user {
                font-size: 12.5px !important;
                color: var(--smg-tx2, rgba(255,255,255,0.5)) !important;
                text-decoration: none !important;
            }
            .smg-tw-xlogo {
                color: #fff !important;
                flex-shrink: 0 !important;
                opacity: 0.85 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                text-decoration: none !important;
            }
            .smg-tw-xlogo svg {
                width: 20px !important;
                height: 20px !important;
            }
            .smg-tw-text {
                font-size: 14.5px !important;
                line-height: 1.55 !important;
                word-break: break-word !important;
                white-space: pre-wrap !important;
                margin-bottom: 12px !important;
                color: var(--smg-tx, #e7e7ea) !important;
            }
            .smg-tw-media {
                margin: 4px 0 12px !important;
                border-radius: 12px !important;
                overflow: hidden !important;
            }
            .smg-tw-media img {
                width: 100% !important;
                max-height: 520px !important;
                object-fit: contain !important;
                display: block !important;
                border-radius: 12px !important;
                background: #000 !important;
            }
            .smg-tw-media video {
                width: 100% !important;
                max-height: 540px !important;
                display: block !important;
                border-radius: 12px !important;
                background: #000 !important;
            }
            .smg-tw-media-grid {
                display: grid !important;
                grid-template-columns: 1fr 1fr !important;
                gap: 6px !important;
            }
            .smg-tw-media-grid img {
                height: 220px !important;
                object-fit: cover !important;
            }
            .smg-tw-foot {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                padding-top: 10px !important;
                border-top: 1px solid rgba(255,255,255,0.08) !important;
                font-size: 12px !important;
                color: var(--smg-tx2, rgba(255,255,255,0.5)) !important;
            }
            .smg-tw-stats {
                display: flex !important;
                align-items: center !important;
                gap: 14px !important;
            }
            .smg-tw-open {
                display: inline-flex !important;
                align-items: center !important;
                gap: 4px !important;
                color: var(--smg-link, #ff77b2) !important;
                text-decoration: none !important;
                font-weight: 600 !important;
            }
            .smg-tw-open:hover {
                text-decoration: underline !important;
            }
            .smg-ig-embed-wrap iframe,
            blockquote.instagram-media {
                margin-left: auto !important;
                margin-right: auto !important;
                max-width: 100% !important;
                border-radius: 14px !important;
            }

            /* ---- turbo/saint embeds (iframe nativo) ---- */
            .generic2wide-iframe-div {
                position: relative;
                width: 100% !important;
                max-width: min(1400px, calc(var(--smg-media-h) * 16 / 9)) !important;
                margin: 16px auto !important;
                display: block !important;
                aspect-ratio: 16 / 9;
                overflow: hidden;
                border-radius: 10px;
                background: #000;
            }
            .generic2wide-iframe-div:has(.smg-rg),
            .generic2wide-iframe-div:has(.smg-turbo-slot--filled) {
                aspect-ratio: auto !important;
                overflow: visible !important;
                background: transparent !important;
                border-radius: 0 !important;
            }
            /* iframes nativos dentro de .generic2wide-iframe-div preenchem o container 16:9 perfeitamente */
            .generic2wide-iframe-div > iframe,
            .generic2wide-iframe-div iframe.saint-iframe {
                position: absolute !important;
                inset: 0 !important;
                width: 100% !important;
                height: 100% !important;
                max-width: 100% !important;
                border: none !important;
                border-radius: 10px !important;
                background: #000 !important;
            }

            /* ---- turbo: slot (loading), fallback link, error card ---- */
            .smg-turbo-slot {
                position: relative;
                display: block;
                width: 100%;
                aspect-ratio: 16 / 9;
                min-height: 220px;
                border-radius: 10px;
                overflow: hidden;
                background: #000;
            }
            .smg-turbo-slot.smg-turbo-slot--filled {
                min-height: 0;
            }
            .smg-turbo-slot .saint-iframe {
                position: absolute !important;
                inset: 0 !important;
                width: 100% !important;
                height: 100% !important;
                aspect-ratio: auto !important;
                max-width: none !important;
                border-radius: 0 !important;
                margin: 0 !important;
            }
            .smg-loading {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2;
            }
            .smg-loading::after {
                content: "";
                width: 42px;
                height: 42px;
                border-radius: 50%;
                border: 3px solid rgba(255,255,255,0.15);
                border-top-color: rgba(255,255,255,0.85);
                animation: smg-spin 0.8s linear infinite;
            }
            @keyframes smg-spin {
                to { transform: rotate(360deg); }
            }
            /* ---- reveal: spinner do post travado por like/medalha (in-flow, não overlay) ---- */
            .smg-reveal-spin { position: static !important; inset: auto !important; min-height: 56px; margin: 14px auto; }
            /* ---- download: botão central da dock (estado ocupado) ---- */
            .smg-nav-btn.smg-dl-busy { opacity: 0.6; pointer-events: none; }
            /* ---- mídia direta (susercontent/Shopee, .mp4/.webm/.webp em link cru) ---- */
            .smg-dm-wrap { margin: 14px auto !important; max-width: min(75%, 880px) !important; }
            .smg-dm-wrap.smg-wide, img.bbImage.smg-wide {
                max-width: min(80%, 950px) !important;
                display: block !important;
                margin-left: auto !important;
                margin-right: auto !important;
            }
            .smg-dm-wrap.smg-vert, img.bbImage.smg-vert {
                max-width: min(75%, 880px) !important;
                max-height: var(--smg-media-h) !important;
                width: auto !important;
                height: auto !important;
                object-fit: contain !important;
                display: block !important;
                margin-left: auto !important;
                margin-right: auto !important;
            }
            .smg-dm-wrap.smg-vert > .smg-dm-video {
                max-width: 100% !important;
                max-height: var(--smg-media-h) !important;
                width: auto !important;
                height: auto !important;
                object-fit: contain !important;
                margin-left: auto !important;
                margin-right: auto !important;
            }
            html.smg-masonry-on .auto-image-grid img.bbImage,
            html.smg-masonry-on .auto-image-grid .smg-dm-wrap > img.bbImage,
            html.smg-masonry-on .auto-image-grid img.bbImage.smg-wide,
            html.smg-masonry-on .auto-image-grid img.bbImage.smg-vert,
            html.smg-masonry-on .auto-image-grid .smg-wide,
            html.smg-masonry-on .auto-image-grid .smg-vert {
                width: 100% !important;
                max-width: none !important;
                height: auto !important;
                max-height: none !important;
                margin: 0 0 8px !important;
            }
            .smg-dm-wrap img.bbImage { border-radius: 10px; }
            .smg-dm-video {
                display: block; width: 100%;
                max-width: min(1400px, calc(var(--smg-media-h) * 16 / 9));
                max-height: var(--smg-media-h);
                margin: 0 auto; border-radius: 10px; background: #000;
            }
            /* ---- barra de chips dos links de file-host (GoFile/Bunkr/…) no fim do post ---- */
            .smg-post-links { display: flex; flex-wrap: wrap; gap: 7px; margin: 12px 0 2px; padding-top: 11px; border-top: 1px solid var(--smg-bd); }
            .smg-link-chip {
                display: inline-flex; align-items: center; gap: 6px; max-width: 100%;
                padding: 6px 11px; border-radius: 8px; background: var(--smg-s2); border: 1px solid var(--smg-bd);
                color: rgba(255,255,255,0.82) !important; font-size: 12.5px; font-weight: 600; text-decoration: none;
            }
            .smg-link-chip svg { width: 14px; height: 14px; flex: 0 0 auto; opacity: 0.65; }
            .smg-link-chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .smg-link-chip:hover { background: var(--smg-s3); color: #fff !important; border-color: var(--smg-bd2); }

            /* ---- imagepond videos: full width igual aos outros ---- */
            iframe[src*="imagepond.net"] {
                display: block !important;
                width: 100% !important;
                max-width: min(1400px, calc(var(--smg-media-h) * 16 / 9)) !important;  /* 16:9 não passa de --smg-media-h de altura */
                height: auto !important;
                aspect-ratio: 16 / 9 !important;
                margin: 16px auto !important;
                border: none !important;
                border-radius: 10px !important;
                background: #000 !important;
            }

            /* ---- redgifs / gifs / youtube: full width igual aos outros ---- */
            span[data-s9e-mediaembed="youtube"],
            span[data-s9e-mediaembed="gifs"],
            span[data-s9e-mediaembed="redgifs"] {
                display: block !important;
                width: 100% !important;
                max-width: min(1400px, calc(var(--smg-media-h) * 16 / 9)) !important;  /* 16:9 não passa de --smg-media-h de altura */
                margin: 16px auto !important;
            }
            span[data-s9e-mediaembed="youtube"] > span,
            span[data-s9e-mediaembed="gifs"] > span,
            span[data-s9e-mediaembed="redgifs"] > span {
                display: block !important;
                width: 100% !important;
                height: auto !important;
                padding: 0 !important;
            }
            span[data-s9e-mediaembed="youtube"] iframe,
            span[data-s9e-mediaembed="gifs"] iframe,
            span[data-s9e-mediaembed="redgifs"] iframe {
                position: static !important;
                display: block !important;
                width: 100% !important;
                height: auto !important;
                aspect-ratio: 16 / 9 !important;
                border: none !important;
                border-radius: 10px !important;
                background: #000 !important;
            }

            /* defensivo: o conteúdo do embed NUNCA passa da largura do container.
               alguns players (ex.: redgifs) injetam iframe/wrapper aninhado com
               largura fixa que escapava dos seletores acima e estourava a página
               no mobile (scroll horizontal). */
            .generic2wide-iframe-div,
            span[data-s9e-mediaembed] {
                overflow: hidden !important;
            }
            .generic2wide-iframe-div *,
            span[data-s9e-mediaembed] * {
                max-width: 100% !important;
            }

            /* ---- player nativo de redgifs (.smg-rg substitui o iframe; mp4 da API num <video>) ---- */
            .smg-rg {
                position: relative;
                display: block;
                width: 100%;
                max-width: min(1400px, calc(var(--smg-media-h) * 16 / 9));
                max-height: var(--smg-media-h);   /* TETO: não estoura o viewport (vale no masonry) */
                margin: 16px auto;
                aspect-ratio: 16 / 9;             /* placeholder; o JS troca pelo aspect REAL (videoWidth/Height ou API do redgifs) e MANTÉM (não some no clearSkel) */
                background: #000;
                border-radius: 10px;
                overflow: hidden;
                /* CRO antigo NÃO volta: o site forçava aspect/overflow no .generic2wide-iframe-div (já destravado); e o vídeo é
                   position:absolute+inset:0 (preenche a caixa SEM depender de %-height resolver). object-fit:contain = nunca corta. */
            }
            span[data-s9e-mediaembed] .smg-rg,
            .generic2wide-iframe-div .smg-rg { margin: 0 !important; }   /* container já dá a margem → não dobra */
            .smg-rg-fail {   /* gif morto: placeholder discreto no lugar do iframe de erro do redgifs */
                display: flex; align-items: center; justify-content: center;
                width: 100%; aspect-ratio: 16 / 9; max-height: var(--smg-media-h);
                background: #161616; color: rgba(255,255,255,0.45);
                border-radius: 10px; font-size: 13px; text-align: center; padding: 8px;
            }
            /* ---- MÍDIA MORTA (buildDeadBox): um estado de falha só p/ imagem/vídeo/embed 404 ----
               Fica DEPOIS de .smg-rg-fail e .smg-turbo-error de propósito: a caixa acumula essas classes (outros
               passes as usam como marcador de "este slot já resolveu") e, com a mesma especificidade, quem vem
               por último vence. Borda tracejada = o vocabulário de "não é conteúdo, é um buraco". */
            .smg-dead {
                position: relative; display: flex !important; flex-direction: column; align-items: center; justify-content: center; gap: 7px;
                box-sizing: border-box; width: 100%; max-width: 320px; min-height: 132px; margin: 3px 0; padding: 16px 14px;
                border: 1px dashed var(--smg-bd2, rgba(255,255,255,0.2)); border-radius: 10px;
                background: var(--smg-s1, #16171b); color: var(--smg-tx, #e7e7ea) !important;
                text-align: center; text-decoration: none !important; overflow: hidden;
                transition: border-color .15s ease, background .15s ease;
            }
            .smg-dead:hover { background: var(--smg-s2, rgba(255,255,255,0.06)); border-color: var(--smg-link, #ff77b2); }
            /* no lugar de player/embed: ocupa o bloco inteiro, não o tamanho compacto de imagem solta */
            .smg-dead--media { max-width: none; min-height: 0; aspect-ratio: 16 / 9; max-height: var(--smg-media-h); margin: 16px auto; }
            .smg-turbo-slot > .smg-dead { position: absolute; inset: 0; width: 100%; height: 100%; max-width: none; max-height: none; margin: 0; aspect-ratio: auto; border-radius: 0; }
            .smg-dead-code { display: inline-flex; align-items: center; gap: 8px; font-size: 19px; font-weight: 800; letter-spacing: .02em; color: rgba(255,255,255,0.82); font-variant-numeric: tabular-nums; }
            .smg-dead-code svg { width: 19px; height: 19px; flex: 0 0 auto; fill: none !important; stroke: currentColor; opacity: 0.75; }
            .smg-dead-code b:empty { display: none; }   /* sonda ainda não voltou (ou não vai): só o triângulo, sem número solto */
            .smg-dead-sub { font-size: 12.5px; font-weight: 500; color: rgba(255,255,255,0.5); overflow-wrap: anywhere; }
            /* dentro do mosaico o item já tem a largura da coluna → o teto de 320px o deixaria estreito no meio da grade */
            html.smg-masonry-on .auto-image-grid .smg-dead { max-width: none; margin: 0; }
            .smg-rg-v {
                position: absolute; inset: 0;    /* preenche a CAIXA (aspect-ratio do .smg-rg); inset:0 evita o bug de %-height não resolver com max-height */
                display: block; width: 100%; height: 100%;
                object-fit: contain;             /* nunca corta — letterbox só se o teto (max-height) mudar o aspect da caixa */
                background: #000;
                cursor: pointer;
            }
            /* SKELETON de verdade: enquanto carrega, a caixa (com aspect-ratio = altura reservada) mostra SÓ
               shimmer + spinner; o player (vídeo + controles + badge) fica ESCONDIDO até o vídeo ter um frame
               real (o JS tira .smg-rg-loading no 'loadeddata'). */
            .smg-rg.smg-rg-loading { background: #141414; overflow: hidden; }   /* overflow: clipa o shimmer transladado (abaixo) */
            .smg-rg.smg-rg-loading > .smg-rg-v,
            .smg-rg.smg-rg-loading > .smg-rgc-flash,
            .smg-rg.smg-rg-loading > .smg-rgc-bottom,
            .smg-rg.smg-rg-loading > .smg-rgc-src { opacity: 0 !important; pointer-events: none !important; }   /* skeleton esconde o vídeo+controles; a caixa (aspect-ratio do .smg-rg) já reserva o espaço */
            .smg-rg.smg-rg-loading::before {
                content: ""; position: absolute; inset: 0; z-index: 1;
                /* PERF: shimmer por TRANSFORM (composita; mesmo padrão do .smg-gallery-skel) — bg-position repintava o skeleton inteiro (até 1400px) por frame */
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 50%, transparent);
                transform: translateX(-100%);
                animation: smg-skel-shimmer 1.25s ease-in-out infinite;
            }
            .smg-rg.smg-rg-loading::after {
                content: "";
                position: absolute;
                top: 50%; left: 50%;
                width: 42px; height: 42px;
                margin: -21px 0 0 -21px;
                border-radius: 50%;
                border: 3px solid rgba(255,255,255,0.15);
                border-top-color: rgba(255,255,255,0.85);
                animation: smg-spin 0.8s linear infinite;
                z-index: 2;
            }
            /* PRONTO (defer de host-blob, autoplay-off): sem spinner, play central FIXO ("clique pra tocar").
               poster (redgifs) ou fundo preto (turbo/saint) atrás → NUNCA caixa preta sem affordance (era o bug do deferBlob desligado). */
            .smg-rg.smg-rg-ready .smg-rgc-flash { opacity: 1; }
            .smg-rg.smg-rg-ready .smg-rgc-play { pointer-events: auto; }
            /* ---- controles estilo YouTube: play CENTRAL (no pausado) + BARRA INFERIOR com gradiente:
               scrubber em cima e linha [play · volume · tempo ··· download · visualizador · tela cheia]. Accent = tema. ---- */
            /* CENTRO: play grande — só no pausado/pronto (tocando, o controle é a barra). Seek = duplo-clique no vídeo. */
            .smg-rgc-flash {
                position: absolute; inset: 0; z-index: 2;
                display: flex; align-items: center; justify-content: center;
                opacity: 0; pointer-events: none; transition: opacity 0.2s ease;
            }
            .smg-rg:hover:not(.smg-rg-loading):not(.smg-rg-buffering):not(.smg-rgc-playing) .smg-rgc-flash { opacity: 1; }
            .smg-rgc-flash button {
                border: 0; border-radius: 50%; cursor: pointer; padding: 0;
                background: rgba(0,0,0,0.55); color: #fff;
                display: flex; align-items: center; justify-content: center;
                transition: transform 0.12s ease, background 0.12s ease; pointer-events: none;   /* só interativo quando o flash aparece (regras abaixo) — senão capturaria cliques invisível */
            }
            .smg-rgc-flash button:hover { transform: scale(1.08); background: rgba(0,0,0,0.72); }
            .smg-rg:hover:not(.smg-rg-loading):not(.smg-rg-buffering):not(.smg-rgc-playing) .smg-rgc-flash button { pointer-events: auto; }
            .smg-rgc-play { width: 64px; height: 64px; }
            .smg-rgc-play svg { width: 30px; height: 30px; display: block; margin-left: 3px; }
            @media (max-width: 600px) { .smg-rgc-play { width: 54px; height: 54px; } .smg-rgc-play svg { width: 26px; height: 26px; } }
            /* BARRA INFERIOR: gradiente; some fora do hover; visível no pausado-carregado e no touch (NÃO no pronto/poster) */
            .smg-rgc-bottom {
                position: absolute; left: 0; right: 0; bottom: 0; z-index: 3;
                padding: 8px 4px 2px;
                background: linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.30) 62%, transparent 100%);
                opacity: 0; pointer-events: none; transition: opacity 0.18s ease;
            }
            .smg-rg:hover:not(.smg-rg-loading):not(.smg-rg-ready) .smg-rgc-bottom,
            .smg-rg:not(.smg-rgc-playing):not(.smg-rg-ready):not(.smg-rg-loading):not(.smg-rg-buffering) .smg-rgc-bottom { opacity: 1; pointer-events: auto; }
            @media (hover: none) { .smg-rg:not(.smg-rg-loading):not(.smg-rg-ready) .smg-rgc-bottom { opacity: 1; pointer-events: auto; } }
            /* SCRUBBER (no topo da barra) */
            .smg-rgc-prog { position: relative; width: 100%; height: 14px; display: flex; align-items: center; cursor: pointer; touch-action: none; }
            .smg-rgc-bar { position: relative; width: 100%; height: 3px; background: rgba(255,255,255,0.28); border-radius: 3px; transition: height 0.1s ease; }
            .smg-rgc-prog:hover .smg-rgc-bar { height: 5px; }
            .smg-rgc-buf { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: rgba(255,255,255,0.30); border-radius: 3px; pointer-events: none; }
            .smg-rgc-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: var(--smg-link, #ff77b2); border-radius: 3px; pointer-events: none; }
            .smg-rgc-knob { position: absolute; right: -6px; top: 50%; width: 12px; height: 12px; border-radius: 50%; background: var(--smg-link, #ff77b2); transform: translateY(-50%) scale(0); transition: transform 0.1s ease; }
            .smg-rgc-prog:hover .smg-rgc-knob { transform: translateY(-50%) scale(1); }
            /* LINHA de controles */
            .smg-rgc-row { display: flex; align-items: center; justify-content: space-between; gap: 4px; padding: 1px 4px 2px; }
            .smg-rgc-left, .smg-rgc-right { display: flex; align-items: center; gap: 1px; }
            .smg-rgc-act {
                width: 34px; height: 34px; border: 0; border-radius: 50%; cursor: pointer; padding: 0;
                background: transparent; color: #fff;
                display: flex; align-items: center; justify-content: center;
                transition: background 0.12s ease, transform 0.12s ease;
            }
            .smg-rgc-act:hover { background: rgba(255,255,255,0.16); }
            .smg-rgc-act:active { transform: scale(0.9); }
            .smg-rgc-act svg { width: 21px; height: 21px; display: block; }
            .smg-rgc-speed {
                height: 24px; min-width: 32px; padding: 0 6px;
                border: 0; border-radius: 6px; cursor: pointer;
                background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.92);
                font: 700 11.5px/1 var(--smg-mono, -apple-system, monospace);
                letter-spacing: -0.2px;
                display: flex; align-items: center; justify-content: center;
                transition: background 0.12s ease, transform 0.12s ease, color 0.12s ease;
                user-select: none;
            }
            .smg-rgc-speed:hover { background: rgba(255,255,255,0.24); color: #fff; }
            .smg-rgc-speed:active { transform: scale(0.92); }
            .smg-rgc-speed.is-custom-speed { background: var(--smg-ac, #ff77b2); color: #fff; font-weight: 800; }
            /* PADRONIZA os ícones do player = OUTLINE limpo, igual ao visualizador (o CSS do fórum PREENCHE svg → vira blob; o #smg-feed já se protege, o inline não). Play/pause é a exceção (preenchido). */
            .smg-rg .smg-rgc-act svg, .smg-rg .smg-rgc-src svg { fill: none !important; }
            .smg-rg .smg-rgc-play svg, .smg-rg .smg-rgc-barplay svg { fill: currentColor !important; }
            /* VOLUME: mute + barra que expande no hover (YouTube) */
            .smg-rgc-vol { display: flex; align-items: center; }
            .smg-rgc-volbar { position: relative; width: 0; height: 4px; border-radius: 3px; background: rgba(255,255,255,0.35); cursor: pointer; opacity: 0; transition: width 0.18s ease, opacity 0.18s ease, margin 0.18s ease; touch-action: none; }
            .smg-rgc-vol:hover .smg-rgc-volbar { width: 60px; opacity: 1; margin: 0 6px 0 2px; }
            .smg-rgc-volbar::before { content: ""; position: absolute; left: 0; right: 0; top: -9px; bottom: -9px; }   /* área de clique alta */
            .smg-rgc-volfill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: #fff; border-radius: 3px; pointer-events: none; }
            /* TEMPO (atual / duração) */
            .smg-rgc-time { color: #fff; font: 600 12px/1 -apple-system, system-ui, sans-serif; font-variant-numeric: tabular-nums; padding: 0 6px; white-space: nowrap; flex: 0 0 auto; }
            @media (max-width: 600px) { .smg-rgc-act { width: 30px; height: 30px; } .smg-rgc-act svg { width: 19px; height: 19px; } .smg-rgc-time { font-size: 11px; padding: 0 4px; } }
            /* indicador "« 5s" / "5s »" no duplo-clique p/ voltar/avançar */
            .smg-rgc-seekflash {
                position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 3;
                color: #fff; font: 700 15px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background: rgba(0,0,0,0.55); padding: 9px 15px; border-radius: 999px;
                opacity: 0; transition: opacity 0.15s ease; pointer-events: none; white-space: nowrap;
            }
            .smg-rgc-seekflash.on { opacity: 1; }
            /* FONTE + abrir EXTERNO num só: badge clicável no canto SUP-DIREITO do player ("Turbo ↗"). É a marca-dágua da fonte E o "abrir no host" (substituiu o ↗ do rail). */
            .smg-rgc-src {
                position: absolute; top: 10px; right: 10px; z-index: 4;
                display: inline-flex; align-items: center; gap: 5px; max-width: calc(100% - 20px);
                padding: 4px 9px; border-radius: 8px;
                background: rgba(0,0,0,0.6); color: #fff; text-decoration: none;
                font: 800 12px/1.2 -apple-system, system-ui, "Segoe UI", sans-serif; letter-spacing: 0.01em;
                cursor: pointer; opacity: 0; pointer-events: none;
                transition: opacity 0.15s ease, background 0.15s ease; box-shadow: 0 1px 5px rgba(0,0,0,0.45);
            }
            .smg-rg:hover .smg-rgc-src { opacity: 1; pointer-events: auto; }
            .smg-rgc-src:hover { background: rgba(0,0,0,0.82); }
            .smg-rgc-src:active { transform: scale(0.96); }
            .smg-rgc-src .smg-rgc-src-t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .smg-rgc-src svg { width: 13px; height: 13px; display: block; flex: 0 0 auto; }
            @media (hover: none) { .smg-rgc-src { opacity: 0.72; pointer-events: auto; } }
            /* BUFFERING (loading ao avançar/voltar): spinner por cima, SEM esconder o vídeo (diferente do skeleton) */
            .smg-rg.smg-rg-buffering::after {
                content: ""; position: absolute; top: 50%; left: 50%; width: 42px; height: 42px; margin: -21px 0 0 -21px;
                border-radius: 50%; border: 3px solid rgba(255,255,255,0.22); border-top-color: rgba(255,255,255,0.9);
                animation: smg-spin 0.8s linear infinite; z-index: 4; pointer-events: none;
            }
            .smg-rg:fullscreen { width: 100vw; height: 100vh; max-width: none; max-height: none; aspect-ratio: auto; margin: 0; background: #000; }
            .smg-rg:fullscreen .smg-rg-v { height: 100%; }
            /* turbo/saint: quando o slot recebe NOSSO player, ele NÃO pode forçar 16:9 nem cortar — a altura
               vem do aspect REAL do .smg-rg (vídeo vertical não vira faixa horizontal). A classe .smg-turbo-slot--filled
               é setada no JS ao montar o player (robusto: não depende do :has, que às vezes não solta o 16:9 a tempo
               e o overflow:hidden do slot recorta o player vertical num pedaço horizontal). */
            /* ⚠️ REGRAS SEPARADAS de propósito: agrupar com :has(...) faz o browser DESCARTAR a regra
               inteira se o :has falhar no contexto (era o bug — o --filled vinha no DOM mas sem efeito,
               o vídeo vertical continuava cortado). A classe .smg-turbo-slot--filled é setada no JS e
               NÃO depende de :has, então sempre vale. */
            .smg-turbo-slot--filled {
                aspect-ratio: auto !important; overflow: visible !important; background: transparent !important;
            }
            /* (o fallback .smg-turbo-slot:has(.smg-rg) foi REMOVIDO: todo caminho que põe .smg-rg num slot chama
               fillSlot() → a classe acima sempre vale, e o :has custava re-validação upward a cada mutação) */
            .smg-turbo-slot > .smg-rg { margin: 0 !important; }

            /* ---- site a 80% da largura disponível (desktop), CENTRALIZADO ---- */
            @media (min-width: 800px) {
                .p-header-inner,
                .p-nav-inner,
                .p-sectionLinks-inner,
                .p-body-inner,
                .p-footer-inner {
                    max-width: var(--smg-cw) !important;
                    margin-left: auto !important;
                    margin-right: auto !important;
                }
                /* o socialmediagirls usa .pageContent (fora do .p-body-inner) no header/breadcrumb;
                   alinha com o conteúdo (mesma largura) pra não ficar torto */
                .p-body-header > .pageContent,
                .breadcrumb > .pageContent {
                    max-width: var(--smg-cw) !important;
                    margin-left: auto !important;
                    margin-right: auto !important;
                }
            }

            /* ---- header das páginas: maior + alinhado à esquerda ---- */
            /* mata o padding-top: 20px que o tema põe em todo filho direto do .p-body */
            .p-body > * { padding-top: 0 !important; }
            /* respiro abaixo da topbar FIXA: o título não cola na barra (era 10px → colava no desktop, onde
               body=topbar=76px e o gap é zero). 26px = mesmo valor já usado nas threads (.smg-thread). */
            .p-body-header { padding-top: 26px !important; padding-bottom: 10px !important; }
            @media (max-width: 600px) { .p-body-header { padding-top: 16px !important; } }   /* mobile já tem gap (topbar 52 < body 76) → não empilha demais */
            .p-body-header .p-title { text-align: left !important; }
            .p-body-header .p-title-value { font-size: 30px !important; font-weight: 800 !important; line-height: 1.2 !important; }

            /* ---- remove banners de anúncio (striply etc.) ---- */
            a[href*="striply.com"],
            body > a[href*="striply"] { display: none !important; }

            /* ---- SMG: REMOVE a sidebar fora da home · conteúdo a 100% ----
               na home a sidebar é reaproveitada (realocada pro topo — ver bloco HOME);
               nas demais páginas (threads, /forums, busca, whats-new) some de vez e o
               .p-body-content passa a ocupar todo o espaço (mata grid/flex/float de 2 colunas).
               EXCEÇÃO: páginas com .p-body-sideNav (conta/settings) usam um menu LATERAL legítimo —
               ali NÃO mexemos na largura do conteúdo (senão o layout de 2 colunas quebra/empilha). */
            html:not(.smg-home-page) .p-body-sidebar,
            html:not(.smg-home-page) .p-body-sidebarCol { display: none !important; }
            /* PERF: html.smg-has-sidenav (setado 1× no detectPageClasses) no lugar de :not(:has(.p-body-sideNav)):
               o :has ancorado no .p-body-main (ancestral da stream de posts INTEIRA) re-validava a cada
               mutação de subtree — e o processAll muta quase todo frame. Mesmo padrão do smg-has-g2w. */
            html:not(.smg-home-page):not(.smg-has-sidenav) .p-body-main--withSidebar {
                display: block !important; grid-template-columns: none !important; gap: 0 !important;
            }
            html:not(.smg-home-page):not(.smg-has-sidenav) .p-body-main .p-body-content,
            html:not(.smg-home-page):not(.smg-has-sidenav) .p-body-main .p-body-contentCol {
                width: 100% !important; max-width: 100% !important; min-width: 0 !important;
                flex: 1 1 100% !important; grid-column: 1 / -1 !important; float: none !important;
            }
            /* ---- breadcrumb some por completo nos 2 sites (fórum · thread · busca…) ----
               só esconde (não remove do DOM): o JS ainda lê o link /forums/ pra achar o fórum pai */
            html.smg-sc .breadcrumb, html.smg-smg .breadcrumb,
            html.smg-sc .p-breadcrumbs, html.smg-smg .p-breadcrumbs { display: none !important; }

            `;
