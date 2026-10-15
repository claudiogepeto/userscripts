    /* ====================================================================
     * FILOSOFIA — só ESTILO + um reorder/limpeza leve do header. NÃO toco na
     * engine do Bunkr (o Plyr é montado por id #video-wrapper → continua intacto)
     * nem nos scripts de anúncio/anti-adblock (WASM) → não quebra a página.
     * ==================================================================== */

    const COL = "min(100% - 32px, 1800px, calc((100vh - 120px) * 16 / 9))";   // coluna = maior 16:9 que cabe (mais larga; sobra p/ topbar+gap)

    const MEDIA_CSS = mediaComponentCSS(MEDIA_THEME);
    const CSS = `
        /* ===== TIPOGRAFIA SEM SERIFA NATIVA E RESET GLOBAL ===== */
        html, body {
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif !important;
            background: #0b0c0f !important;
            color: #fff !important;
        }
        h1, h2, h3, h4, .font-cabinet {
            font-family: Cabinet Grotesk, Inter, ui-sans-serif, system-ui, sans-serif !important;
        }

        /* ===== HOMEPAGE ESTILO AMOLED MODERNO ===== */
        html.bunkr-home, html.bunkr-home body { background: #0b0c0f !important; min-height: 100vh; }
        html.bunkr-home .ttwp { min-height: calc(100vh - 70px); display: flex; align-items: center; justify-content: center; }
        html.bunkr-home .bg-mute {
            background: #111318 !important; border: 1px solid rgba(255, 255, 255, 0.08) !important;
            border-radius: 20px !important; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45) !important;
        }
        html.bunkr-home h1 { font-family: Cabinet Grotesk, Inter, system-ui, sans-serif !important; color: #fff !important; }
        html.bunkr-home .btn-main {
            background: linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 100%) !important; color: #0e0f13 !important;
            font-weight: 700 !important; border: 0 !important; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.35) !important;
            transition: transform .12s, box-shadow .12s !important;
        }
        html.bunkr-home .btn-main:hover { transform: translateY(-2px) !important; box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5) !important; }
        html.bunkr-home .btn-main-light {
            background: rgba(255, 255, 255, 0.06) !important; border: 1px solid rgba(255, 255, 255, 0.1) !important;
            color: rgba(255, 255, 255, 0.8) !important;
        }
        html.bunkr-home .text-subs { color: rgba(255, 255, 255, 0.6) !important; }

        /* ===== COLUNA COMPARTILHADA: player + título (info) na MESMA largura/posição → alinhados ===== */
        html.bunkr-file main.cont,
        .rounded-lg section > div.mx-auto,
        .rounded-lg section > div[class*="max-w"],
        .rounded-lg section > div:has(#video-container) {
            max-width: ${COL} !important;
            max-height: none !important;
            margin-left: auto !important;
            margin-right: auto !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
        }
        /* ÁLBUM: conteúdo LARGO e ALINHADO com a topbar (mesma largura 1800) + respiro maior pra topbar */
        html.bunkr-album main.cont { max-width: min(100% - 24px, 2560px) !important; padding-top: 28px !important; margin-left: auto !important; margin-right: auto !important; }   /* v2.3: usa quase toda a largura (mais colunas no grid) */
        /* header alinhado (mesmo cap) */
        header .cont { max-width: min(100% - 24px, 2560px) !important; margin-inline: auto !important; }
        #video-container { max-width: 100% !important; }

        /* ===== PLAYER: enche a coluna, 16:9, arredondado (sem o cap de 1000px nem o height:100% do tema) ===== */
        #video-wrapper .plyr,
        #video-wrapper .plyr--video,
        #video-container .plyr {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            border-radius: 14px;
            overflow: hidden;
        }
        .plyr__video-wrapper, .plyr__video-wrapper--fixed-ratio { aspect-ratio: 16 / 9 !important; max-height: none !important; }
        #loading-background { max-height: none !important; }

        /* ===== PÁGINA DE FOTO — imagem grande/centralizada ===== */
        .rounded-lg img:not(.grid-images_box-img) {
            display: block;
            max-width: 100% !important;
            max-height: calc(100vh - 120px);
            width: auto;
            margin-inline: auto;
            border-radius: 14px;
        }
        /* (grade de arquivos estilizada lá embaixo, vale pro álbum E a section "More files") */

        /* ===== TÍTULO/INFO = barra de título do YouTube, flush-left (escondo o círculo de tipo) ===== */
        main.cont { padding-top: 16px !important; }
        main span.icon.w-12, main .flex.items-center.gap-3 > span.icon { display: none !important; }
        main h1 { font-size: 1.35rem !important; line-height: 1.3 !important; }
        @media (min-width: 768px) { main h1 { font-size: 1.6rem !important; } }

        /* ===== TOPBAR PADRONIZADA (IDÊNTICA À DA PLAYLIST/PLAYER) ===== */
        header.bunkr-global-header, header {
            position: sticky; top: 0; z-index: 50; background: #0e0f13 !important;
            border-bottom: 1px solid rgba(255,255,255,.07) !important;
            transition: padding .22s cubic-bezier(0.4, 0, 0.2, 1), background .22s ease, box-shadow .22s ease;
        }
        .bunkr-header-cont {
            max-width: min(100% - 32px, 2560px) !important; margin: 0 auto !important;
            padding: 8px 16px !important; display: flex !important; align-items: center !important;
            justify-content: space-between !important; gap: 16px !important; height: 52px !important;
            transition: height .22s ease, padding .22s ease;
        }
        /* Comportamento na homepage: mais alta no topo, encolhe no scroll */
        html.bunkr-home header.is-home-expanded .bunkr-header-cont { height: 68px !important; padding: 12px 24px !important; }
        html.bunkr-home header.is-home-expanded { background: rgba(14, 15, 19, 0.95) !important; backdrop-filter: blur(16px); }

        .bunkr-header-right { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .bunkr-header-btn {
            display: inline-flex; align-items: center; gap: 7px; height: 32px; padding: 0 11px;
            border-radius: 8px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
            color: rgba(255,255,255,.8); font: 600 12.5px/1 Inter, system-ui, sans-serif; cursor: pointer;
            text-decoration: none; transition: background .12s, border-color .12s, color .12s; user-select: none;
        }
        html.bunkr-home header.is-home-expanded .bunkr-header-btn { height: 36px; padding: 0 14px; font-size: 13px; }
        .bunkr-header-btn:hover { background: rgba(167,139,250,.14); border-color: rgba(167,139,250,.35); color: #fff; }
        .bunkr-header-btn svg { width: 14px; height: 14px; flex-shrink: 0; color: var(--bunkr-accent, #a78bfa); }

        /* ===== ESPAÇAMENTO: player↔título PEQUENO (YouTube); respiro só no fim ===== */
        .rounded-lg section > div.mx-auto { padding-top: 6px !important; padding-bottom: 6px !important; }   /* era py-8 (32px) → gap enorme até o título */
        .bunkr-player-block { margin-top: 18px !important; padding-bottom: 0 !important; }                    /* respiro ABAIXO da topbar + zera o respiro que caía entre player e título (pós-reorder) */
        main.cont { padding-top: 12px !important; padding-bottom: 64px !important; }                          /* título colado no player + respiro no fim da página */
        body { padding-bottom: 40px !important; }
        footer { padding-top: 28px !important; }

        /* ===== banner VERMELHO de troca de domínio → fora (fallback; o JS remove de fato) ===== */
        body > div[style*="red"] { display: none !important; }

        /* ===== BOTÃO DE MIRROR (canto sup-direito do player) — VISÍVEL SÓ NO HOVER do player (igual controles do YT) ===== */
        .bunkr-mirror { position: absolute; top: 12px; right: 12px; z-index: 50; font-family: Inter, system-ui, sans-serif; opacity: 0; pointer-events: none; transition: opacity .18s ease; }
        .bunkr-has-mirror:hover .bunkr-mirror, .bunkr-mirror.is-open { opacity: 1; pointer-events: auto; }   /* hover do player OU menu aberto */
        .bunkr-mirror-btn { display: inline-flex; align-items: center; gap: 7px; height: 36px; padding: 0 14px; border: 1px solid rgba(255,255,255,0.2); border-radius: 11px; background: rgba(14,14,19,0.8); color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); box-shadow: 0 4px 16px rgba(0,0,0,0.42); transition: background .14s ease, border-color .14s ease, color .14s ease; }
        .bunkr-mirror-btn svg { width: 16px; height: 16px; }
        .bunkr-mirror-btn:hover, .bunkr-mirror.is-open .bunkr-mirror-btn { background: #a78bfa; border-color: #a78bfa; color: #160f24; }
        /* DROPDOWN em GRID 2-colunas (compacto, em vez da lista alta) */
        .bunkr-mirror-menu { position: absolute; top: calc(100% + 8px); right: 0; width: 300px; max-width: 78vw; max-height: 60vh; overflow-y: auto; padding: 10px; border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; background: rgba(18,19,24,0.97); box-shadow: 0 18px 46px rgba(0,0,0,0.62); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); }
        .bunkr-mirror-menu[hidden] { display: none; }
        .bunkr-mirror-head { padding: 2px 4px 9px; font-size: 11px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: rgba(255,255,255,0.45); }
        .bunkr-mirror-head b { color: #a78bfa; font-weight: 700; }
        .bunkr-mirror-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
        .bunkr-mirror-item { display: flex; align-items: center; justify-content: center; padding: 10px 8px; border-radius: 10px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.86); font-size: 12.5px; font-weight: 600; text-decoration: none; white-space: nowrap; transition: background .12s ease, color .12s ease; }
        .bunkr-mirror-item:hover { background: #a78bfa; color: #160f24; }
        .bunkr-mirror-item.is-current { background: rgba(167,139,250,0.18); color: #a78bfa; cursor: default; }
        .bunkr-mirror-item.is-current:hover { background: rgba(167,139,250,0.18); color: #a78bfa; }

        /* ===== aviso "mirror pode estar fora" (overlay no topo do player, após o teste falhar) ===== */
        .bunkr-mirror-warn { position: absolute; left: 50%; top: 14px; transform: translateX(-50%); z-index: 55; display: flex; align-items: center; gap: 14px; max-width: calc(100% - 24px); padding: 10px 16px; border-radius: 12px; background: rgba(176,32,32,0.94); color: #fff; font: 600 13.5px/1.3 Inter, system-ui, sans-serif; box-shadow: 0 12px 34px rgba(0,0,0,0.55); }
        .bunkr-mirror-warn span { font-weight: 400; opacity: .85; }
        .bunkr-mirror-warn-btn { flex: 0 0 auto; padding: 7px 12px; border-radius: 9px; background: #fff; color: #b02020; font-weight: 700; text-decoration: none; white-space: nowrap; }
        .bunkr-mirror-warn-btn:hover { filter: brightness(0.94); }
        .bunkr-mirror-warn-x { flex: 0 0 auto; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 8px; background: rgba(255,255,255,0.16); color: #fff; cursor: pointer; transition: background .12s ease; }
        .bunkr-mirror-warn-x:hover { background: rgba(255,255,255,0.3); }
        .bunkr-mirror-warn-x svg { width: 16px; height: 16px; }

        /* ===== GRADE DE ARQUIVOS ESTILO YOUTUBE (ÁLBUM E MORE FILES) ===== */
        .grid-images, #galleryGrid, #related-files-grid { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)) !important; gap: 32px 24px !important; }
        @media (min-width: 1600px) { .grid-images, #galleryGrid, #related-files-grid { grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)) !important; gap: 36px 28px !important; } }
        @media (max-width: 768px) { .grid-images, #galleryGrid, #related-files-grid { grid-template-columns: 1fr !important; gap: 20px 16px !important; } }

        /* Card estilo YouTube (.theItem) */
        .theItem { position: relative !important; display: flex !important; flex-direction: column !important; background: transparent !important; border: 0 !important; padding: 0 !important; border-radius: 14px !important; cursor: pointer !important; transition: transform .14s cubic-bezier(0.4, 0, 0.2, 1) !important; box-shadow: none !important; }
        .theItem:hover { transform: translateY(-4px) !important; box-shadow: none !important; }

        /* Box da thumbnail (16:9, cantos arredondados, fundo escuro) */
        .theItem .grid-images_box-txt { order: 1 !important; position: relative !important; width: 100% !important; aspect-ratio: 16 / 9 !important; border-radius: 14px !important; overflow: hidden !important; background: #14161f !important; box-shadow: 0 4px 16px rgba(0,0,0,.4) !important; margin: 0 !important; padding: 0 !important; }
        .theItem .grid-images_box-img { width: 100% !important; height: 100% !important; aspect-ratio: 16 / 9 !important; object-fit: cover !important; display: block !important; border-radius: 14px !important; transition: transform .24s cubic-bezier(0.4, 0, 0.2, 1) !important; }
        .theItem:hover .grid-images_box-img { transform: scale(1.04) !important; }

        /* Badges sobre a thumbnail */
        .theItem > span[class*="type-"] { position: absolute !important; top: 8px !important; right: 8px !important; z-index: 2 !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; width: 26px !important; height: 26px !important; padding: 0 !important; border-radius: 8px !important; background: rgba(14, 16, 22, 0.9) !important; border: 1px solid rgba(255,255,255,.14) !important; box-shadow: 0 2px 8px rgba(0,0,0,.5) !important; }
        .theItem > span[class*="type-"] img { width: 14px !important; height: 14px !important; filter: brightness(1.2) !important; }
        .theItem-size-badge { position: absolute; bottom: 8px; right: 8px; z-index: 2; background: rgba(0, 0, 0, 0.86); color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 0.02em; padding: 2.5px 6px; border-radius: 5px; pointer-events: none; box-shadow: 0 2px 6px rgba(0,0,0,.6); }

        /* Metadados abaixo da thumbnail (estilo YouTube alinhado à esquerda) */
        .theItem > div.mt-2 { order: 2 !important; display: flex !important; flex-direction: column !important; gap: 4px !important; background: transparent !important; background-color: transparent !important; padding: 10px 2px 4px !important; margin: 0 !important; border-radius: 0 !important; text-align: left !important; }
        .theItem .theName { margin: 0 !important; font-size: 13.5px !important; font-weight: 600 !important; line-height: 1.35 !important; color: #f3f4f6 !important; text-align: left !important; display: -webkit-box !important; -webkit-line-clamp: 2 !important; -webkit-box-orient: vertical !important; overflow: hidden !important; word-break: break-word !important; transition: color .12s ease !important; }
        .theItem:hover .theName { color: var(--bunkr-accent, #a78bfa) !important; }
        .grid-images.full-filename .theItem .theName, #galleryGrid.full-filename .theItem .theName { -webkit-line-clamp: unset !important; display: block !important; }
        .theItem .theDate, .theItem .theSize, .theItem-title-date-badge { display: none !important; }
        .theItem .text-subs { display: block !important; margin: 0 !important; color: inherit !important; }
        .theItem a[aria-label="download"], .theItem a[href] { position: absolute !important; inset: 0 !important; z-index: 5 !important; cursor: pointer !important; }
        html.bunkr-album .album-toolbar, html.bunkr-album .album-adv { margin-left: 0 !important; margin-right: 0 !important; }
        /* heading "More files…" + botão Load More (cards no fim do arquivo) */
        .files-album { font-size: 1.2rem !important; margin: 6px 0 14px !important; }
        #load-more-btn, .ld-more { display: block !important; width: 100% !important; margin: 22px 0 0 !important; padding: 13px !important; border-radius: 12px !important; border: 1px solid rgba(167,139,250,0.5) !important; background: rgba(167,139,250,0.08) !important; color: #c9b8ff !important; font-weight: 700 !important; transition: background .14s ease, color .14s ease; }
        #load-more-btn:hover, .ld-more:hover { background: rgba(167,139,250,0.18) !important; color: #fff !important; }
        /* a section "More files" do ARQUIVO alinha com a coluna do player/título + respiro */
        html.bunkr-file .cont:has(#related-files-grid) { max-width: ${COL} !important; margin-left: auto !important; margin-right: auto !important; padding-top: 8px !important; }

${MEDIA_CSS.player}
        /* ===== v2.9 — GALERIA DO ÁLBUM YOUTUBE STYLE + ACTIONBAR INTEGRADA ===== */
        html.dark { --color-body: 11 12 15; --color-fore: 14 15 19; --color-mute: 16 18 23; --color-soft: 22 24 30; --color-line: 34 38 48; --color-main: 167 139 250; --color-lead: 255 255 255; --color-subs: 226 226 232; }
        html.bunkr-album, html.bunkr-album body { background: #0b0c0f !important; }
        html.bunkr-album header { background: #0e0f13 !important; border-bottom: 1px solid rgba(255,255,255,.08) !important; }

        /* Header do Álbum: layout horizontal limpo com Report alinhado à direita */
        html.bunkr-album main > div.flex.items-center.flex-wrap:first-child,
        html.bunkr-album main > div.flex:first-child {
            display: flex !important; align-items: center !important; justify-content: space-between !important;
            flex-wrap: nowrap !important; gap: 16px !important; margin-bottom: 8px !important;
        }
        html.bunkr-album main > div.flex:first-child > div:first-child { flex: 1 1 auto !important; min-width: 0 !important; }
        html.bunkr-album main > div.flex:first-child > div:last-child { flex: 0 0 auto !important; width: auto !important; margin: 0 !important; }

        html.bunkr-album main h1 {
            font-family: Cabinet Grotesk, Inter, ui-sans-serif, system-ui, sans-serif !important;
            color: #fff !important; font-size: 1.55rem !important; font-weight: 700 !important;
            letter-spacing: -0.015em !important; line-height: 1.3 !important;
        }
        html.bunkr-album .ic-albums { background: rgba(167,139,250,.14) !important; color: #a78bfa !important; border-radius: 14px !important; border: 1px solid rgba(167,139,250,.3) !important; }
        html.bunkr-album .visitors, html.bunkr-album .text-xs {
            color: rgba(255,255,255,.62) !important; font-size: 12.5px !important;
            font-family: Inter, ui-sans-serif, system-ui, sans-serif !important;
        }
        html.bunkr-album .live-indicator-container { display: inline-flex !important; align-items: center !important; gap: 6px !important; margin-left: 8px !important; }

        /* Botão Report moderno ao lado */
        .bunkr-album-report-btn {
            display: inline-flex !important; align-items: center !important; gap: 6px !important;
            height: 34px !important; padding: 0 14px !important; border-radius: 8px !important;
            background: rgba(255,255,255,.05) !important; border: 1px solid rgba(255,255,255,.1) !important;
            color: rgba(255,255,255,.75) !important; font: 600 12.5px/1 Inter, ui-sans-serif, system-ui, sans-serif !important;
            text-decoration: none !important; cursor: pointer !important; white-space: nowrap !important;
            transition: background .12s, border-color .12s, color .12s !important;
        }
        .bunkr-album-report-btn:hover { background: rgba(239,68,68,.12) !important; border-color: rgba(239,68,68,.3) !important; color: #f87171 !important; }
        .bunkr-album-report-btn svg { width: 14px !important; height: 14px !important; color: currentColor !important; flex-shrink: 0 !important; }

        /* Oculta interface legada, paginação, contador nativo e tooltips residuais */
        html.bunkr-album .mode-toggle-btn, html.bunkr-album #advToggle, html.bunkr-album .adv-btn, html.bunkr-album .pagination,
        html.bunkr-album .album-toolbar, html.bunkr-album .advanced-notice, html.bunkr-album .album-adv,
        html.bunkr-album .floating-detailed-thumb, html.bunkr-album #floatingThumb,
        html.bunkr-album #resultsCounter, html.bunkr-album .results-counter,
        html.bunkr-album main > p:has(#resultsCounter), html.bunkr-album main > div:has(#resultsCounter),
        html.bunkr-album main .flex.bg-soft.p-1.rounded-lg.items-center { display: none !important; }

${MEDIA_CSS.actionbar}
        /* Datas em texto simples no card da galeria (sem badge, sem ícones) */
        .theItem-dates { display: flex; flex-direction: column; gap: 3px; font-size: 11.5px; text-align: left; margin-top: 5px; }
        .theItem-date-row { display: flex; align-items: center; justify-content: flex-start; gap: 4px; font-size: 11.5px; line-height: 1.35; margin: 0; color: rgba(255,255,255,.55); }
        .theItem-date-lbl { color: rgba(255,255,255,.45); font-weight: 500; font-size: 11px; }
        .theItem-date-val { color: rgba(255,255,255,.85); font-weight: 500; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; }

${MEDIA_CSS.dates}
        /* Placeholder genérico para thumbnails quebradas ou inexistentes */
        .grid-images_box-txt.has-placeholder .grid-images_box-img { display: none !important; }
${MEDIA_CSS.misc}
    `;

    addCSS(CSS);   // document-start → sem flash do layout antigo
