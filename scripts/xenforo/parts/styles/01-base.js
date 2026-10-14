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
                --smg-bd: rgba(255,255,255,0.10);  /* borda padrão */
                --smg-bd2: rgba(255,255,255,0.17); /* borda em destaque/ativo */
                --smg-scrim: rgba(0,0,0,0.66);      /* backdrop de overlays */
                --smg-media-h: min(70vh, 750px);    /* altura MÁX de imagem/vídeo/skeleton no post (teto p/ não estourar o viewport, inclusive no masonry) */
                --smg-tx: #e7e7ea;                  /* texto principal */
                --smg-tx2: rgba(255,255,255,0.5);   /* texto secundário */
                --smg-ac: #ff77b2;                  /* acento fixo (rosa) */
                --smg-mono: -apple-system, monospace;
                --smg-target-h: 320px;              /* altura-alvo da linha justificada (flex-basis) */
            }
            html.smg-smg {
                --smg-bg: #1a1a1a;                  /* cor da topbar do socialmediagirls */
                --smg-s1: hsl(0 0% 13.5%);
                --smg-s2: hsl(0 0% 17%);
                --smg-s3: hsl(0 0% 22%);
            }
            /* ACENTO do tema, POR SITE: VERDE no SimpCity, ROSA no SocialMediaGirls. Usa o linkColor real do
               fórum quando exposto; senão cai no fallback da marca. Todo var(--smg-link, ...) passa a seguir isto. */
            html.smg-sc  { --smg-link: hsl(var(--xf-linkColor--h, 145), var(--xf-linkColor--s, 58%), var(--xf-linkColor--l, 50%)); --smg-link-soft: hsla(var(--xf-linkColor--h, 145), var(--xf-linkColor--s, 58%), var(--xf-linkColor--l, 50%), 0.10); --smg-link-strong: hsl(var(--xf-linkColor--h, 145), var(--xf-linkColor--s, 58%), 38%); }
            /* SMG: rosa institucional da marca (#ff3d84 / hue 334) */
            html.smg-smg { --smg-link: hsl(var(--xf-linkColor--h, 334), 85%, 68%); --smg-link-soft: hsla(var(--xf-linkColor--h, 334), 85%, 68%, 0.12); --smg-link-strong: hsl(var(--xf-linkColor--h, 334), 75%, 52%); }
            /* O tema do SMG pinta .block-container de rosa (#ff77b2). A superfície do script é neutra. */
            html.smg-smg .block-container {
                background: var(--smg-s1, #222) !important;
                color: #fff !important;
            }
            /* SMG: o tema pinta a página de cinza-azulado. A superfície do script é cinza neutro. */
            html.smg-smg body,
            html.smg-smg .p-pageWrapper,
            html.smg-smg .p-body,
            html.smg-smg .p-body-inner,
            html.smg-smg .p-body-pageContent,
            html.smg-smg .p-body-main,
            html.smg-smg .block,
            html.smg-smg .block-header,
            html.smg-smg .block-minorHeader,
            html.smg-smg .block-body,
            html.smg-smg .block-footer,
            html.smg-smg .filterBar,
            html.smg-smg .structItemContainer,
            html.smg-smg .p-nav,
            html.smg-smg .p-header,
            html.smg-smg .p-sectionLinks,
            html.smg-smg .p-footer {
                background-color: var(--smg-bg, #1a1a1a) !important;
                border-color: rgba(255,255,255,0.06) !important;
            }
            /* --smg-link-strong = acento mais FUNDO p/ fundos preenchidos (texto branco lê bem nos 2 sites) */
            /* largura do conteúdo (e da topbar): 80% no desktop, 75% em telas >= 3xl (1920px).
               no mobile NÃO se aplica (a regra que usa isto fica num @media min-width:800px) */
            html.smg-sc, html.smg-smg { --smg-cw: 80%; --smg-card-min: 230px; }   /* largura mínima de card em QUALQUER grid: nº de colunas segue o espaço do container (auto-fill), nunca o viewport */
            @media (min-width: 1920px) { html.smg-sc, html.smg-smg { --smg-cw: 75%; } }
            @media (max-width: 1400px) and (min-width: 800px) {
                html.smg-sc, html.smg-smg { --smg-cw: 92%; }
            }
            /* rail lateral aberto: a coluna do fórum ESTICA (80→94%). O rail já levou ~380px; manter
               20% de margem vazia em cima disso desperdiçaria duas vezes a mesma tela. Especificidade
               maior (2 classes) que a regra base, e o override de 1920px vem DEPOIS → os dois valem. */
            html.smg-aldock-on.smg-sc, html.smg-aldock-on.smg-smg { --smg-cw: 94%; }
            @media (min-width: 1920px) { html.smg-aldock-on.smg-sc, html.smg-aldock-on.smg-smg { --smg-cw: 92%; } }
            @media (max-width: 1400px) and (min-width: 800px) {
                html.smg-aldock-on.smg-sc, html.smg-aldock-on.smg-smg { --smg-cw: 96%; }
            }

            /* Anti-CLS para posts e galerias da thread:
               O post (leitura) é a âncora primária (overflow-anchor: auto). Mídias mutáveis (imagens,
               embeds, vídeos) têm overflow-anchor: none para não disputarem a âncora enquanto carregam. */
            article.message.smg-pc,
            .block--messages,
            .block-body--messages {
                overflow-anchor: auto !important;
            }
            .auto-image-grid,
            .auto-image-grid > *,
            .auto-image-grid img.bbImage,
            .smg-dm-wrap,
            .smg-rg,
            .generic2wide-iframe-div {
                overflow-anchor: none !important;
            }
            img.bbImage[style*="aspect-ratio"] {
                width: 100% !important;
                height: auto !important;
                object-fit: contain;
            }
`;