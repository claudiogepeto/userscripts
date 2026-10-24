    // styles/01-base.js
    // Owns: THE token palette (--smg-* colours, alpha ladders, radius, font, spacing, shadow, z-index), reset and anti-CLS rules.
    // Exposes: CSS_BASE. The only CSS part allowed raw colour literals (build.js check).
    // Depends on: composed first by core/05-styles.js.
    // STYLE CONTEXT: Global tokens, reset, media and shared components
    const CSS_BASE = `
            /* ===== ÍNDICE DO CSS (grep os rótulos abaixo) =====
               paleta (--smg-*) · image grids · images · turbo embeds · redgifs
               · site a 80% (largura) · header das páginas
               · page chrome: sidebar e breadcrumb somem (conteúdo a 100%)
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
                --smg-bd: var(--smg-w-10);         /* borda padrão */
                --smg-bd2: rgba(255,255,255,0.17); /* borda em destaque/ativo */
                --smg-scrim: rgba(0,0,0,0.66);      /* backdrop de overlays */
                --smg-media-h: min(70vh, 750px);    /* altura MÁX de imagem/vídeo/skeleton no post (teto p/ não estourar o viewport, inclusive no masonry) */
                --smg-tx: #e7e7ea;                  /* texto principal */
                --smg-tx2: var(--smg-w-50);         /* texto secundário */
                --smg-ac: #ff77b2;                  /* acento fixo (rosa) */
                --smg-mono: -apple-system, monospace;
                --smg-solo-h: 80vh;                 /* altura MÁX de uma imagem sozinha no post (run de 1, fora do mosaico) */
                --smg-img-r: var(--smg-r-8);        /* raio das imagens do post e dos itens do mosaico */
            }
            /* ===== escalas (definidas UMA vez; todo valor cru do CSS cai num degrau destas) ===== */
            html.smg-sc, html.smg-smg {
                /* branco e preto com alfa: escada única (antes eram 54 e 26 níveis soltos) */
                --smg-w-02: rgba(255,255,255,0.02); --smg-w-04: rgba(255,255,255,0.04); --smg-w-06: rgba(255,255,255,0.06); --smg-w-08: rgba(255,255,255,0.08); --smg-w-10: rgba(255,255,255,0.1);
                --smg-w-12: rgba(255,255,255,0.12); --smg-w-14: rgba(255,255,255,0.14); --smg-w-18: rgba(255,255,255,0.18); --smg-w-22: rgba(255,255,255,0.22);
                --smg-w-30: rgba(255,255,255,0.3); --smg-w-40: rgba(255,255,255,0.4); --smg-w-50: rgba(255,255,255,0.5); --smg-w-55: rgba(255,255,255,0.55); --smg-w-60: rgba(255,255,255,0.6);
                --smg-w-72: rgba(255,255,255,0.72); --smg-w-85: rgba(255,255,255,0.85); --smg-w-95: rgba(255,255,255,0.95);
                --smg-k-25: rgba(0,0,0,0.25); --smg-k-35: rgba(0,0,0,0.35); --smg-k-45: rgba(0,0,0,0.45); --smg-k-55: rgba(0,0,0,0.55); --smg-k-62: rgba(0,0,0,0.62);
                --smg-k-72: rgba(0,0,0,0.72); --smg-k-82: rgba(0,0,0,0.82); --smg-k-92: rgba(0,0,0,0.92);
                /* raio · fonte · espaçamento (px) */
                --smg-r-4: 4px; --smg-r-6: 6px; --smg-r-8: 8px; --smg-r-10: 10px; --smg-r-12: 12px;
                --smg-r-14: 14px; --smg-r-16: 16px; --smg-r-18: 18px; --smg-r-20: 20px; --smg-r-pill: 999px;
                --smg-r-round: 50%;
                --smg-fs-10: 10px; --smg-fs-11: 11px; --smg-fs-12: 12px; --smg-fs-13: 13px; --smg-fs-14: 14px;
                --smg-fs-15: 15px; --smg-fs-16: 16px; --smg-fs-18: 18px; --smg-fs-20: 20px; --smg-fs-22: 22px;
                --smg-fs-24: 24px; --smg-fs-28: 28px; --smg-fs-32: 32px;
                --smg-sp-2: 2px; --smg-sp-4: 4px; --smg-sp-6: 6px; --smg-sp-8: 8px; --smg-sp-10: 10px;
                --smg-sp-12: 12px; --smg-sp-14: 14px; --smg-sp-16: 16px; --smg-sp-18: 18px; --smg-sp-20: 20px;
                --smg-sp-24: 24px; --smg-sp-28: 28px; --smg-sp-32: 32px;
                /* sombras (4 alturas) + realce interno do topo · durações de transição */
                --smg-shadow-1: 0 2px 8px var(--smg-k-25); --smg-shadow-2: 0 8px 24px var(--smg-k-45);
                --smg-shadow-3: 0 14px 38px var(--smg-k-55); --smg-shadow-4: 0 18px 44px var(--smg-k-62);
                --smg-hl: inset 0 1px 0 var(--smg-w-08);
                --smg-dur-12: .12s; --smg-dur-15: .15s; --smg-dur-20: .2s; --smg-dur-30: .3s;
                /* DONO de cada componente: um raio e uma sombra por componente; as regras de feature só referenciam */
                --smg-pop-r: var(--smg-r-16); --smg-pop-shadow: var(--smg-hl), var(--smg-shadow-4);
                --smg-sheet-r: var(--smg-r-20); --smg-sheet-shadow: 0 -12px 44px var(--smg-k-62);
                --smg-card-r: var(--smg-r-16); --smg-card-shadow: var(--smg-shadow-2);
                --smg-btn-r: var(--smg-r-10); --smg-input-r: var(--smg-r-10); --smg-tab-r: var(--smg-r-10);
                --smg-chip-r: var(--smg-r-pill); --smg-badge-r: var(--smg-r-pill);
                /* camadas de z-index (mesmos números de antes, agora com nome) */
                --smg-z-1: 1; --smg-z-2: 2; --smg-z-3: 3; --smg-z-4: 4; --smg-z-5: 5; --smg-z-6: 6;
                --smg-z-7: 7; --smg-z-8: 8; --smg-z-pop: 11; --smg-z-pop-up: 12; --smg-z-15: 15; --smg-z-20: 20;
                --smg-z-30: 30; --smg-z-40: 40; --smg-z-50: 50; --smg-z-60: 60; --smg-z-thead: 100; --smg-z-aldock: 101; --smg-z-topbar: 1000;
                --smg-z-topbar-up: 1001; --smg-z-gate: 1100; --smg-z-gate-1: 1101; --smg-z-gate-2: 1102; --smg-z-9999: 9999; --smg-z-10000: 10000;
                --smg-z-dock-under: 999990; --smg-z-dock: 999999; --smg-z-sheet: 1000000; --smg-z-sheet-1: 1000001; --smg-z-sheet-3: 1000003; --smg-z-sheet-4: 1000004;
                --smg-z-sheet-5: 1000005; --smg-z-sheet-top: 9999999; --smg-z-overlay: 2147483600; --smg-z-overlay-1: 2147483601; --smg-z-max-1: 2147483646;
                --smg-z-max: 2147483647;
            }
            html.smg-smg {
                --smg-bg: #1a1a1a;                  /* cor da topbar do socialmediagirls */
                --smg-s1: hsl(0 0% 13.5%);
                --smg-s2: hsl(0 0% 17%);
                --smg-s3: hsl(0 0% 22%);
            }
            /* ACENTO do tema, POR SITE: VERDE no SimpCity, ROSA no SocialMediaGirls. Usa o linkColor real do
               fórum quando exposto; senão cai no fallback da marca. Todo var(--smg-link) passa a seguir isto. */
            html.smg-sc  { --smg-link: hsl(var(--xf-linkColor--h, 145), var(--xf-linkColor--s, 58%), var(--xf-linkColor--l, 50%)); --smg-link-soft: hsla(var(--xf-linkColor--h, 145), var(--xf-linkColor--s, 58%), var(--xf-linkColor--l, 50%), 0.10); --smg-link-strong: hsl(var(--xf-linkColor--h, 145), var(--xf-linkColor--s, 58%), 38%); }
            /* SMG: rosa institucional da marca (#ff3d84 / hue 334) */
            html.smg-smg { --smg-link: hsl(var(--xf-linkColor--h, 334), 85%, 68%); --smg-link-soft: hsla(var(--xf-linkColor--h, 334), 85%, 68%, 0.12); --smg-link-strong: hsl(var(--xf-linkColor--h, 334), 75%, 52%); }
            /* O tema do SMG pinta .block-container de rosa (#ff77b2). A superfície do script é neutra. */
            html.smg-smg .block-container {
                background: var(--smg-s1) !important;
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
                background-color: var(--smg-bg) !important;
                border-color: var(--smg-w-06) !important;
            }
            /* --smg-link-strong = acento mais FUNDO p/ fundos preenchidos (texto branco lê bem nos 2 sites) */
            /* largura do conteúdo (e da topbar): 80% no desktop, 75% em telas >= 3xl (1920px).
               no mobile NÃO se aplica (a regra que usa isto fica num @media min-width:800px) */
            html.smg-sc, html.smg-smg { --smg-cw: 80%; --smg-card-min: 230px; }   /* largura mínima de card em QUALQUER grid: nº de colunas segue o espaço do container (auto-fill), nunca o viewport */
            @media (min-width: 1920px) { html.smg-sc, html.smg-smg { --smg-cw: 75%; } }
            @media (max-width: 1400px) and (min-width: 801px) {
                html.smg-sc, html.smg-smg { --smg-cw: 92%; }
            }
            /* rail lateral aberto: a coluna do fórum ESTICA (80→94%). O rail já levou ~380px; manter
               20% de margem vazia em cima disso desperdiçaria duas vezes a mesma tela. Especificidade
               maior (2 classes) que a regra base, e o override de 1920px vem DEPOIS → os dois valem. */
            html.smg-aldock-on.smg-sc, html.smg-aldock-on.smg-smg { --smg-cw: 94%; }
            @media (min-width: 1920px) { html.smg-aldock-on.smg-sc, html.smg-aldock-on.smg-smg { --smg-cw: 92%; } }
            @media (max-width: 1400px) and (min-width: 801px) {
                html.smg-aldock-on.smg-sc, html.smg-aldock-on.smg-smg { --smg-cw: 96%; }
            }

            /* ---- REMOVE a sidebar fora da home · conteúdo a 100% ----
               a sidebar nativa some em todas as páginas (a home esconde a dela no bloco HOME);
               fora da home o .p-body-content passa a ocupar todo o espaço (mata grid/flex/float de 2 colunas).
               EXCEÇÃO: páginas com .p-body-sideNav (conta/settings) usam um menu LATERAL legítimo —
               ali NÃO mexemos na largura do conteúdo (senão o layout de 2 colunas quebra/empilha). */
            html:not(.smg-home) .p-body-sidebar,
            html:not(.smg-home) .p-body-sidebarCol { display: none !important; }
            /* PERF: html.smg-has-sidenav (setado 1× no detectPageClasses) no lugar de :not(:has(.p-body-sideNav)):
               o :has ancorado no .p-body-main (ancestral da stream de posts INTEIRA) re-validava a cada
               mutação de subtree — e o processAll muta quase todo frame. Mesmo padrão do smg-has-g2w. */
            html:not(.smg-home):not(.smg-has-sidenav) .p-body-main--withSidebar {
                display: block !important; grid-template-columns: none !important; gap: 0 !important;
            }
            html:not(.smg-home):not(.smg-has-sidenav) .p-body-main .p-body-content,
            html:not(.smg-home):not(.smg-has-sidenav) .p-body-main .p-body-contentCol {
                width: 100% !important; max-width: 100% !important; min-width: 0 !important;
                flex: 1 1 100% !important; grid-column: 1 / -1 !important; float: none !important;
            }
            /* ---- breadcrumb some por completo nos 2 sites (fórum · thread · busca…) ----
               só esconde (não remove do DOM): o JS ainda lê o link /forums/ pra achar o fórum pai */
            html.smg-sc .breadcrumb, html.smg-smg .breadcrumb,
            html.smg-sc .p-breadcrumbs, html.smg-smg .p-breadcrumbs { display: none !important; }

            /* ===== TOAST (toast() em core/06-helpers.js): superfície AMOLED, ícone por tipo, empilha no
               centro de baixo, acima da dock (desktop: pílula da thread · mobile: navbar) ===== */
            .smg-toasts {
                position: fixed; left: 50%; bottom: var(--smg-sp-24); transform: translateX(-50%);
                z-index: var(--smg-z-max-1); display: flex; flex-direction: column; align-items: center;
                gap: var(--smg-sp-8); width: max-content; max-width: min(420px, calc(100vw - 32px));
                pointer-events: none;
            }
            .smg-toasts.is-over-dock { bottom: 96px; }
            @media (max-width: 600px) {
                .smg-toasts, .smg-toasts.is-over-dock { bottom: calc(var(--smg-navh) + var(--smg-sp-12) + env(safe-area-inset-bottom)); }
            }
            .smg-toast {
                display: flex; align-items: center; gap: var(--smg-sp-10); max-width: 100%;
                padding: var(--smg-sp-10) var(--smg-sp-16) var(--smg-sp-10) var(--smg-sp-12);
                border-radius: var(--smg-pop-r); border: 1px solid var(--smg-bd);
                background: var(--smg-s1); color: var(--smg-tx); box-shadow: var(--smg-pop-shadow);
                font-size: var(--smg-fs-14); font-weight: 600; line-height: 1.35;
                pointer-events: auto; opacity: 0; transform: translateY(8px) scale(0.98);
                transition: opacity var(--smg-dur-20) ease, transform var(--smg-dur-20) ease;
            }
            .smg-toast.is-in { opacity: 1; transform: none; }
            .smg-toast.is-out { opacity: 0; transform: translateY(4px) scale(0.98); }
            .smg-toast-ic { display: inline-flex; flex: 0 0 auto; font-size: var(--smg-fs-18); color: var(--smg-link); }
            .smg-toast--info .smg-toast-ic { color: var(--smg-w-72); }
            .smg-toast--error { border-color: rgba(244,63,94,0.45); }
            .smg-toast--error .smg-toast-ic { color: #f43f5e; }
            .smg-toast-msg { min-width: 0; overflow-wrap: anywhere; }
            @media (prefers-reduced-motion: reduce) {
                .smg-toast, .smg-toast.is-out { transform: none; transition: opacity var(--smg-dur-12) linear; }
            }

            /* Anti-CLS para posts e galerias da thread:
               O post (leitura) é a âncora primária (overflow-anchor: auto). Mídias mutáveis (imagens,
               embeds, vídeos) têm overflow-anchor: none para não disputarem a âncora enquanto carregam. */
            article.message.smg-pc,
            .block--messages,
            .block-body--messages {
                overflow-anchor: auto !important;
            }
            /* o que fica depois da lista com scroll infinito (markAfterList) nunca é âncora: senão o rodapé
               "segura" a tela no fim enquanto as páginas novas entram acima dele */
            [data-smg-after-list] { overflow-anchor: none !important; }
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