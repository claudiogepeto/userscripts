    /* ====================================================================
     * FILOSOFIA — só ESTILO + um reorder/limpeza leve do header. NÃO toco na
     * engine do Bunkr (o Plyr é montado por id #video-wrapper → continua intacto)
     * nem nos scripts de anúncio/anti-adblock (WASM) → não quebra a página.
     * ==================================================================== */

    const COL = "min(100% - 32px, 1800px, calc((100vh - 120px) * 16 / 9))";   // coluna = maior 16:9 que cabe (mais larga; sobra p/ topbar+gap)

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

        /* ===== v2.7 — PLAYER MODERNO (accent roxo, estilo YouTube Pro) + SIDEBAR PLAYLIST ===== */
        :root { --bunkr-accent: #a78bfa; --bunkr-accent-rgb: 167, 139, 250; }
        .bunkr-host { position: relative; width: 100%; height: 100%; max-width: 100%; max-height: 100%; background: #000; border-radius: 0 !important; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .bunkr-video { width: 100% !important; height: 100% !important; max-width: 100% !important; max-height: 100% !important; object-fit: contain !important; background: #000 !important; border-radius: 0 !important; outline: none; cursor: pointer; display: block; }
        
        /* Big Play central */
        .bunkr-plc-flash { position: absolute; inset: 0; z-index: 2; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .2s ease; }
        .bunkr-pl:not(.is-playing):not(.is-buffering) .bunkr-plc-flash { opacity: 1; }
        .bunkr-plc-play { width: 68px; height: 68px; border: 1px solid rgba(255,255,255,.18); border-radius: 50%; cursor: pointer; padding: 0; background: rgba(14,16,22,.75); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(0,0,0,.5); transition: transform .14s cubic-bezier(0.4, 0, 0.2, 1), background .14s ease, border-color .14s ease; pointer-events: none; }
        .bunkr-plc-play svg { width: 28px; height: 28px; margin-left: 3px; fill: currentColor; }
        .bunkr-pl:not(.is-playing) .bunkr-plc-play { pointer-events: auto; }
        .bunkr-plc-play:hover { transform: scale(1.1); background: rgba(22,24,34,.9); border-color: var(--bunkr-accent, #a78bfa); }
        .bunkr-plc-play:active { transform: scale(.95); }
        @media (max-width: 600px) { .bunkr-plc-play { width: 54px; height: 54px; } .bunkr-plc-play svg { width: 22px; height: 22px; } }

        /* Barra inferior de controles */
        .bunkr-plc-bottom { position: absolute; left: 0; right: 0; bottom: 0; z-index: 4; padding: 0 14px 10px; background: linear-gradient(to top, rgba(0,0,0,.88) 0%, rgba(0,0,0,.45) 55%, transparent 100%); opacity: 0; pointer-events: none; transition: opacity .2s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; gap: 4px; }
        .bunkr-pl:hover .bunkr-plc-bottom, .bunkr-pl:not(.is-playing) .bunkr-plc-bottom, .bunkr-pl.is-menu-open .bunkr-plc-bottom, .bunkr-img-host:hover .bunkr-plc-bottom, .bunkr-img-host:focus-within .bunkr-plc-bottom { opacity: 1; pointer-events: auto; }
        @media (hover: none) { .bunkr-plc-bottom { opacity: 1; pointer-events: auto; } }

        /* Linha de progresso / scrubber com tooltip de tempo */
        .bunkr-plc-prog { position: relative; width: 100%; height: 16px; display: flex; align-items: center; cursor: pointer; touch-action: none; }
        .bunkr-plc-bar { position: relative; width: 100%; height: 3.5px; background: rgba(255,255,255,.24); border-radius: 4px; transition: height .12s cubic-bezier(0.4, 0, 0.2, 1); }
        .bunkr-plc-prog:hover .bunkr-plc-bar { height: 6px; }
        .bunkr-plc-buf { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: rgba(255,255,255,.34); border-radius: 4px; pointer-events: none; }
        .bunkr-plc-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: var(--bunkr-accent, #a78bfa); border-radius: 4px; pointer-events: none; }
        .bunkr-plc-knob { position: absolute; right: -6px; top: 50%; width: 12px; height: 12px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.5); transform: translateY(-50%) scale(0); transition: transform .12s ease; }
        .bunkr-plc-prog:hover .bunkr-plc-knob { transform: translateY(-50%) scale(1); }
        .bunkr-plc-timetip { position: absolute; bottom: calc(100% + 7px); transform: translateX(-50%); background: rgba(14,15,19,.95); border: 1px solid rgba(255,255,255,.16); color: #fff; font: 600 11px/1 Inter, system-ui, sans-serif; font-variant-numeric: tabular-nums; padding: 4px 7px; border-radius: 6px; pointer-events: none; opacity: 0; white-space: nowrap; transition: opacity .1s ease; box-shadow: 0 4px 14px rgba(0,0,0,.5); z-index: 10; }
        .bunkr-plc-prog:hover .bunkr-plc-timetip { opacity: 1; }

        /* Linha de botões */
        .bunkr-plc-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 40px; }
        .bunkr-plc-left, .bunkr-plc-right { display: flex; align-items: center; gap: 3px; }

        /* Botões de controle universais */
        .bunkr-plc-act { position: relative; width: 36px; height: 36px; border: 0; border-radius: 50%; cursor: pointer; padding: 0; background: transparent; color: rgba(255,255,255,.9); display: flex; align-items: center; justify-content: center; transition: background .12s, color .12s, transform .1s, opacity .12s; flex: 0 0 auto; }
        .bunkr-plc-act:hover { background: rgba(255,255,255,.12); color: #fff; }
        .bunkr-plc-act:active { transform: scale(.9); }
        .bunkr-plc-act.is-active { color: var(--bunkr-accent, #a78bfa); background: rgba(167,139,250,.18); }
        .bunkr-plc-act.is-disabled { opacity: .35 !important; pointer-events: none !important; }
        .bunkr-plc-act svg { width: 20px; height: 20px; display: block; filter: drop-shadow(0 0 1px rgba(0,0,0,.4)); }

        /* Play/pause na barra */
        .bunkr-plc-barplay { width: 38px; height: 38px; }
        .bunkr-plc-barplay svg { width: 22px; height: 22px; fill: currentColor; }

        /* Pular 5s (arcos arredondados quase completos) */
        .bunkr-plc-skip { position: relative; width: 36px; height: 36px; border-radius: 50%; }
        .bunkr-plc-skip svg { width: 22px; height: 22px; display: block; }
        .bunkr-plc-skip .bunkr-plc-skipn { position: absolute; left: 0; right: 0; top: 51%; transform: translateY(-50%); text-align: center; font: 800 8.5px/1 Inter, system-ui, sans-serif; color: currentColor; pointer-events: none; }

        /* Grupo de Volume */
        .bunkr-plc-vol { display: flex; align-items: center; gap: 2px; }
        .bunkr-plc-volbar { position: relative; width: 0; height: 4px; border-radius: 4px; background: rgba(255,255,255,.28); cursor: pointer; opacity: 0; transition: width .18s ease, opacity .18s ease, margin .18s ease; touch-action: none; }
        .bunkr-plc-vol:hover .bunkr-plc-volbar, .bunkr-plc-vol.is-sliding .bunkr-plc-volbar { width: 62px; opacity: 1; margin: 0 6px 0 2px; }
        .bunkr-plc-volfill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: #fff; border-radius: 4px; pointer-events: none; }

        /* Tempo */
        .bunkr-plc-time { color: rgba(255,255,255,.88); font: 600 12px/1 Inter, system-ui, sans-serif; font-variant-numeric: tabular-nums; padding: 0 8px; white-space: nowrap; user-select: none; flex: 0 0 auto; }
        @media (max-width: 600px) { .bunkr-plc-act { width: 30px; height: 30px; } .bunkr-plc-act svg { width: 17px; height: 17px; } .bunkr-plc-time { font-size: 11px; padding: 0 4px; } }

        /* Feedback do seek flash */
        .bunkr-plc-seekflash { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); z-index: 3; color: #fff; font: 700 15px/1 Inter, system-ui, sans-serif; background: rgba(0,0,0,.65); padding: 9px 15px; border-radius: 999px; opacity: 0; transition: opacity .15s ease; pointer-events: none; white-space: nowrap; }
        .bunkr-plc-seekflash.on { opacity: 1; }
        .bunkr-pl.is-buffering::after { content: ""; position: absolute; top: 50%; left: 50%; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%; border: 3px solid rgba(255,255,255,.22); border-top-color: var(--bunkr-accent, #a78bfa); animation: bunkr-spin .8s linear infinite; z-index: 4; pointer-events: none; }
        @keyframes bunkr-spin { to { transform: rotate(360deg); } }

        /* Switch moderno de Autoplay com label */
        .bunkr-plc-autoplay { width: auto; height: 30px; padding: 0 8px 0 10px; border-radius: 15px; gap: 8px; font: 600 12px/1 Inter, system-ui, sans-serif; color: rgba(255,255,255,.8); background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); transition: background .12s, border-color .12s, color .12s; }
        .bunkr-plc-autoplay:hover { background: rgba(255,255,255,.12); color: #fff; }
        .bunkr-plc-autoplay.is-active { background: rgba(167,139,250,.14); border-color: rgba(167,139,250,.35); color: #fff; }
        .bunkr-plc-ap-label { font-size: 11.5px; font-weight: 600; letter-spacing: -0.01em; user-select: none; }
        .bunkr-plc-ap-pill { position: relative; width: 28px; height: 16px; border-radius: 9px; background: rgba(255,255,255,.24); transition: background .18s ease; display: block; flex: 0 0 28px; }
        .bunkr-plc-ap-knob { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: #fff; transition: transform .18s cubic-bezier(0.4, 0, 0.2, 1), background .18s ease; box-shadow: 0 1px 3px rgba(0,0,0,.4); display: block; }
        .bunkr-plc-autoplay.is-active .bunkr-plc-ap-pill { background: var(--bunkr-accent, #a78bfa); }
        .bunkr-plc-autoplay.is-active .bunkr-plc-ap-knob { transform: translateX(12px); background: #120e1e; }

        /* Seletor de Velocidade moderno (texto limpo + popup) */
        .bunkr-plc-speedwrap { position: relative; display: flex; align-items: center; }
        .bunkr-plc-speed { width: auto; height: 38px; padding: 0 6px; border: 0; background: transparent; color: rgba(255,255,255,.9); font: 700 15px/1 Inter, system-ui, sans-serif; font-variant-numeric: tabular-nums; cursor: pointer; transition: color .12s, transform .1s; display: inline-flex; align-items: center; justify-content: center; }
        .bunkr-plc-speed:hover { background: transparent; color: #fff; transform: scale(1.08); }
        .bunkr-plc-speedmenu { position: absolute; bottom: calc(100% + 10px); right: 0; z-index: 10; display: none; flex-direction: column; padding: 6px; min-width: 140px; max-height: 280px; overflow-y: auto; background: rgba(16,18,25,.96); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,.14); border-radius: 12px; box-shadow: 0 16px 36px rgba(0,0,0,.65); scrollbar-width: thin; }
        .bunkr-plc-speedmenu.open { display: flex; animation: bunkr-fadein .15s ease; }
        @keyframes bunkr-fadein { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .bunkr-plc-speedhead { display: flex; align-items: center; justify-content: space-between; padding: 4px 8px 8px; border-bottom: 1px solid rgba(255,255,255,.08); margin-bottom: 4px; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: rgba(255,255,255,.45); }
        .bunkr-plc-speedreset { border: 0; background: rgba(255,255,255,.08); color: rgba(255,255,255,.75); font: 700 10.5px Inter, system-ui, sans-serif; padding: 2px 6px; border-radius: 4px; cursor: pointer; transition: background .1s, color .1s; }
        .bunkr-plc-speedreset:hover { background: rgba(255,255,255,.16); color: #fff; }
        .bunkr-plc-speeditem { display: flex; align-items: center; justify-content: space-between; gap: 8px; border: 0; background: transparent; color: rgba(255,255,255,.88); font: 600 12.5px/1 Inter, system-ui, sans-serif; padding: 7px 10px; border-radius: 7px; cursor: pointer; text-align: left; white-space: nowrap; transition: background .1s, color .1s; }
        .bunkr-plc-speeditem:hover { background: rgba(255,255,255,.1); color: #fff; }
        .bunkr-plc-speeditem.on { color: var(--bunkr-accent, #a78bfa); font-weight: 700; background: rgba(167,139,250,.12); }
        .bunkr-plc-speeditem svg { width: 14px; height: 14px; opacity: 0; color: var(--bunkr-accent, #a78bfa); flex: 0 0 auto; }
        .bunkr-plc-speeditem.on svg { opacity: 1; }

        /* ===== FOTO: ZOOM + PAN ===== */
        .bunkr-img-host { position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; max-width: 100%; max-height: 100%; margin: 0; overflow: visible; }
        .bunkr-image { display: block !important; max-width: 100% !important; max-height: 100% !important; width: auto !important; height: auto !important; object-fit: contain !important; opacity: 1 !important; filter: none !important; position: static !important; background: transparent !important; border-radius: 0 !important; box-shadow: none !important; cursor: zoom-in; user-select: none; -webkit-user-drag: none; transform-origin: center center; will-change: transform; touch-action: none; }
        .bunkr-stage-mid.is-zoomed .bunkr-image, .bunkr-img-host.is-zoomed .bunkr-image { cursor: grab; }
        .bunkr-stage-mid.is-zoomed .bunkr-image:active, .bunkr-img-host.is-zoomed .bunkr-image:active { cursor: grabbing; }

        /* Spinner de mirror */
        .bunkr-mirror.is-testing { opacity: 1 !important; pointer-events: auto !important; }
        .bunkr-mirror-spin { display: none; width: 15px; height: 15px; flex: 0 0 auto; border-radius: 50%; border: 2px solid rgba(255,255,255,.35); border-top-color: var(--bunkr-accent, #a78bfa); animation: bunkr-spin .7s linear infinite; }
        .bunkr-mirror.is-testing .bunkr-mirror-btn svg { display: none; }
        .bunkr-mirror.is-testing .bunkr-mirror-spin { display: inline-block; }

        /* ===== STAGE: LAYOUT COM SIDEBAR INTEGRADA AO LADO DA TOPBAR E DO PLAYER ===== */
        html.bunkr-has-stage, html.bunkr-has-stage body { overflow: hidden !important; }
        html.bunkr-file::before { content: ""; position: fixed; inset: 0; background: #0b0c0f; z-index: 98000; pointer-events: none; }
        html.bunkr-file.bunkr-fallback::before { display: none; }
        .bunkr-stage { position: fixed; inset: 0; z-index: 99000; display: flex; flex-direction: row; background: #0b0c0f; color: #fff; font-family: Inter, system-ui, sans-serif; overflow: hidden; }
        .bunkr-stage * { box-sizing: border-box; }

        /* Coluna principal da esquerda (Topbar + Mídia) */
        .bunkr-stage-main { flex: 1 1 0%; min-width: 0; height: 100%; display: flex; flex-direction: column; position: relative; overflow: hidden; background: #000; }

        /* Topbar info (vrow) modernizada */
        .bunkr-vrow { flex: 0 0 52px; min-height: 52px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 16px; background: #0e0f13; border-bottom: 1px solid rgba(255,255,255,.07); white-space: nowrap; }
        .bunkr-vrow-top { display: flex; align-items: center; gap: 8px; flex: 1 1 auto; min-width: 0; }
        .bunkr-top-logo { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; padding: 4px 6px; border-radius: 8px; transition: background .12s, opacity .12s; flex: 0 0 auto; }
        .bunkr-top-logo:hover { background: rgba(255,255,255,.06); }
        .bunkr-logo-badge { display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 7px; background: linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 100%); color: #0e0f13; box-shadow: 0 2px 8px rgba(139,92,246,.35); overflow: hidden; flex: 0 0 26px; }
        .bunkr-logo-badge img { width: 100%; height: 100%; object-fit: contain; }
        .bunkr-logo-badge svg { width: 15px; height: 15px; fill: #0e0f13; }
        .bunkr-logo-text { font: 800 15px/1 Inter, system-ui, sans-serif; letter-spacing: -0.03em; color: #fff; }
        .bunkr-logo-dot { color: var(--bunkr-accent, #a78bfa); }
        .bunkr-vrow .b-name { flex: 0 1 auto; min-width: 60px; max-width: 38vw; display: inline-flex; align-items: center; gap: 8px; padding: 0 4px; font-weight: 600; font-size: 13px; color: #f1f3f7; }
        .bunkr-vrow .b-name svg { color: var(--bunkr-accent, #a78bfa); flex: 0 0 auto; width: 16px; height: 16px; }
        .bunkr-vrow .b-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bunkr-vrow-sub { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
        .bunkr-stats { display: flex; align-items: center; gap: 6px; padding: 0 4px; flex: 0 0 auto; }
        .bunkr-stat { font-size: 11.5px; color: rgba(255,255,255,.7); font-weight: 600; padding: 3px 8px; border-radius: 6px; background: rgba(255,255,255,.06); }
        .bunkr-stat-type { background: rgba(167,139,250,.12); color: var(--bunkr-accent, #a78bfa); }
        .b-spacer { flex: 1 1 auto; min-width: 8px; }
        .b-vsep { flex: 0 0 auto; width: 1px; height: 20px; margin: 0 4px; background: rgba(255,255,255,.1); }

        .bunkr-item { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 7px; padding: 6px 11px; border: 1px solid rgba(255,255,255,.1); border-radius: 9px; background: rgba(255,255,255,.05); color: #fff; font: 12.5px/1 Inter, system-ui, sans-serif; cursor: pointer; text-decoration: none; transition: background .12s, border-color .12s, color .12s; }
        .bunkr-item:hover { background: rgba(255,255,255,.1); border-color: #a78bfa66; }
        .bunkr-item svg { width: 16px; height: 16px; color: var(--bunkr-accent, #a78bfa); }

        /* Botão de Playlist no canto direito da topbar (visível somente quando a sidebar estiver fechada) */
        .bunkr-vrow-playlist { display: none; }
        .bunkr-stage.is-sidebar-collapsed .bunkr-vrow-playlist { display: inline-flex !important; }

        /* Mirror dropdown */
        .bunkr-mirror-vrow { position: relative; flex: 0 0 auto; }
        .bunkr-mirror-vrow.is-testing .bunkr-item svg { display: none; }
        .bunkr-mirror-vrow.is-testing .bunkr-mirror-spin { display: inline-block; }
        .bunkr-mirror-vrow .bunkr-mirror-menu { position: fixed; z-index: 100002; }

        /* Mídia no centro */
        .bunkr-stage-mid { position: relative; flex: 1 1 0%; min-width: 0; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 0 !important; overflow: hidden; background: #000; }
        .bunkr-stage.is-video .bunkr-stage-mid > .bunkr-host { width: 100%; height: 100%; aspect-ratio: auto; border-radius: 0 !important; }
        .bunkr-stage-mid > .bunkr-img-host { max-height: 100%; max-width: 100%; margin: 0; display: flex; align-items: center; justify-content: center; overflow: visible; }

        /* Setas laterais de navegação sobre a mídia */
        .bunkr-nav-side { position: absolute; top: 50%; transform: translateY(-50%); z-index: 6; width: 46px; height: 46px; border: 0; border-radius: 50%; background: rgba(0,0,0,.5); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .18s ease, background .12s ease; }
        .bunkr-nav-prev { left: 16px; } .bunkr-nav-next { right: 16px; }
        .bunkr-stage.has-nav .bunkr-stage-mid:hover .bunkr-nav-side { opacity: 1; pointer-events: auto; }
        @media (hover: none) { .bunkr-stage.has-nav .bunkr-nav-side { opacity: .85; pointer-events: auto; } }
        .bunkr-nav-side:hover { background: rgba(0,0,0,.78); } .bunkr-nav-side:active { transform: translateY(-50%) scale(.92); }
        .bunkr-nav-side svg { width: 26px; height: 26px; display: block; }
        .bunkr-nav-side.is-disabled { display: none !important; }

        /* ===== SIDEBAR PLAYLIST (à direita, altura 100vh ao lado da topbar) ===== */
        .bunkr-sidebar { position: relative; flex: 0 0 420px; width: 420px; max-width: 45vw; height: 100%; min-height: 0; display: flex; flex-direction: column; background: #0e0f13; border-left: 1px solid rgba(255,255,255,.08); z-index: 20; transition: width .22s cubic-bezier(0.4, 0, 0.2, 1), flex-basis .22s cubic-bezier(0.4, 0, 0.2, 1); }
        .bunkr-stage.is-sidebar-collapsed .bunkr-sidebar { width: 0 !important; flex-basis: 0 !important; min-width: 0 !important; border-left-width: 0 !important; overflow: hidden !important; pointer-events: none !important; }
        .bunkr-stage:not(.has-playlist) .bunkr-sidebar { display: none !important; }

        /* Header da sidebar */
        .bunkr-sidebar-header { flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,.08); background: #111318; gap: 8px; }
        .bunkr-sidebar-title { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 700; color: #fff; letter-spacing: -0.01em; min-width: 0; }
        .bunkr-sidebar-title svg { width: 18px; height: 18px; color: var(--bunkr-accent, #a78bfa); flex: 0 0 auto; }
        .bunkr-sidebar-count { font-size: 11.5px; font-weight: 600; color: rgba(255,255,255,.55); background: rgba(255,255,255,.08); padding: 2px 7px; border-radius: 999px; white-space: nowrap; }

        /* Ações do header da sidebar (Ver Galeria + Fechar) */
        .bunkr-sidebar-actions { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; }
        .bunkr-sidebar-gallery-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; border-radius: 8px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); color: #fff; font: 600 12px/1 Inter, system-ui, sans-serif; cursor: pointer; text-decoration: none; transition: background .12s, border-color .12s, color .12s; }
        .bunkr-sidebar-gallery-btn:hover { background: rgba(167,139,250,.18); border-color: var(--bunkr-accent, #a78bfa); color: #fff; }
        .bunkr-sidebar-gallery-btn svg { width: 14px; height: 14px; color: var(--bunkr-accent, #a78bfa); }

        .bunkr-sidebar-btn { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 8px; border: 0; background: transparent; color: rgba(255,255,255,.7); cursor: pointer; transition: background .12s, color .12s; flex: 0 0 auto; }
        .bunkr-sidebar-btn:hover { background: rgba(255,255,255,.1); color: #fff; }
        .bunkr-sidebar-btn svg { width: 17px; height: 17px; }

        /* Campo de busca sutil na sidebar */
        .bunkr-sidebar-search { flex: 0 0 auto; padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,.06); background: #0e0f13; }
        .bunkr-sidebar-search input { width: 100%; height: 32px; border-radius: 8px; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.04); color: #fff; font-size: 12.5px; padding: 0 10px; outline: none; transition: border-color .12s, background .12s; }
        .bunkr-sidebar-search input:focus { border-color: var(--bunkr-accent, #a78bfa); background: rgba(255,255,255,.07); }

        /* Lista vertical de itens */
        .bunkr-playlist-list { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 8px 10px; display: flex; flex-direction: column; gap: 8px; scrollbar-width: thin; scrollbar-color: rgba(167,139,250,.35) transparent; }
        .bunkr-playlist-list::-webkit-scrollbar { width: 6px; }
        .bunkr-playlist-list::-webkit-scrollbar-thumb { background: rgba(167,139,250,.35); border-radius: 4px; }
        .bunkr-playlist-list::-webkit-scrollbar-thumb:hover { background: rgba(167,139,250,.6); }

        /* Item de playlist com thumbnails aumentadas */
        .bunkr-playlist-item { display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 10px; background: rgba(255,255,255,.02); border: 1px solid transparent; color: #fff; text-decoration: none; transition: background .12s, border-color .12s, transform .1s; position: relative; }
        .bunkr-playlist-item:hover { background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.08); transform: translateX(2px); }
        .bunkr-playlist-item.is-current { background: rgba(167,139,250,.13); border-color: rgba(167,139,250,.38); }
        /* Itens fora da tela não são renderizados (o item atual fica sempre renderizado). */
        .bunkr-playlist-item:not(.is-current) { content-visibility: auto; flex-shrink: 0; contain-intrinsic-block-size: auto 99px; }
        .bunkr-playlist-item.is-current::before { content: none; }
        .bunkr-playlist-thumb-wrap { position: relative; flex: 0 0 176px; width: 176px; height: 99px; border-radius: 8px; overflow: hidden; background: #181920; }
        .bunkr-playlist-thumb { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; }
        .bunkr-playlist-thumb-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; background: linear-gradient(135deg, #13151f 0%, #0d0e14 100%); border: 1px solid rgba(255, 255, 255, 0.06); box-sizing: border-box; }
        .bunkr-playlist-thumb-placeholder svg { width: 22px; height: 22px; color: var(--bunkr-accent, #a78bfa); opacity: 0.9; }
        .bunkr-playlist-ph-ext { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 9.5px; font-weight: 700; line-height: 1; letter-spacing: 0.05em; padding: 2px 5px; border-radius: 4px; background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.85); border: 1px solid rgba(255, 255, 255, 0.08); }
        .bunkr-playlist-kind { position: absolute; top: 6px; left: 6px; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.78); color: #fff; font: 700 10px/1.2 Inter, system-ui, sans-serif; letter-spacing: .02em; }
        .bunkr-playlist-num { position: absolute; top: 6px; right: 6px; z-index: 1; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.8); color: #fff; font: 700 11px/1 Inter, system-ui, sans-serif; }
        .bunkr-playlist-dur { position: absolute; bottom: 5px; right: 6px; z-index: 1; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.8); color: #fff; font: 700 11px/1 Inter, system-ui, sans-serif; }
        .bunkr-playlist-dur[hidden] { display: none !important; }
        .bunkr-playlist-info { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .bunkr-playlist-name { font-size: 14.5px; font-weight: 500; line-height: 1.35; color: rgba(255,255,255,.9); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; word-break: break-word; }
        .bunkr-playlist-item.is-current .bunkr-playlist-name { color: #fff; font-weight: 700; }
        .bunkr-playlist-meta { font-size: 12.5px; color: rgba(255,255,255,.5); display: flex; align-items: center; gap: 8px; }
        .bunkr-playlist-meta-active { color: var(--bunkr-accent, #a78bfa); font-weight: 600; }
        @media (max-width: 1024px) {
            .bunkr-sidebar { flex: 0 0 340px; width: 340px; }
            .bunkr-playlist-thumb-wrap { flex: 0 0 110px; width: 110px; height: 62px; }
        }

        /* ===== ADAPTAÇÃO MOBILE (<= 768px) ESTILO YOUTUBE ===== */
        @media (max-width: 768px) {
            /* 1. O Stage não prende a tela: flui verticalmente com scroll natural */
            html.bunkr-has-stage, html.bunkr-has-stage body { overflow: auto !important; height: 100% !important; }
            .bunkr-stage {
                position: fixed !important;
                inset: 0 !important;
                width: 100% !important;
                height: 100% !important;
                flex-direction: column !important;
                overflow-y: auto !important;
                overflow-x: hidden !important;
                -webkit-overflow-scrolling: touch !important;
            }
            .bunkr-stage-main {
                flex: 0 0 auto !important;
                width: 100% !important;
                height: auto !important;
                min-height: auto !important;
                overflow: visible !important;
            }

            /* 2. Topbar em 2 Linhas:
               Linha 1: Logo [B bunkr.] + Título completo (.b-name com flex: 1 1 auto)
               Linha 2: Metadados (.bunkr-stats), [Mirror] e atalho [Playlist] */
            .bunkr-vrow {
                flex: 0 0 auto !important;
                flex-direction: column !important;
                height: auto !important;
                min-height: 80px !important;
                padding: 8px 12px !important;
                gap: 6px !important;
                align-items: stretch !important;
                position: sticky !important;
                top: 0 !important;
                z-index: 50 !important;
                background: #0e0f13 !important;
            }
            .bunkr-vrow-top {
                width: 100% !important;
                height: 32px !important;
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                min-width: 0 !important;
            }
            .bunkr-vrow-top .b-name {
                flex: 1 1 auto !important;
                max-width: none !important;
                font-size: 13.5px !important;
                min-width: 0 !important;
            }
            .bunkr-vrow-top .b-name span {
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
            }
            .bunkr-vrow-sub {
                width: 100% !important;
                height: 32px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: flex-start !important;
                gap: 6px !important;
            }
            .bunkr-vrow-sub .b-spacer {
                flex: 1 1 auto !important;
            }
            .bunkr-vrow-playlist {
                display: inline-flex !important;
                padding: 4px 9px !important;
                font-size: 11.5px !important;
            }

            /* 3. Mídia central no topo (proporção de vídeo 16:9) */
            .bunkr-stage-mid {
                flex: 0 0 auto !important;
                width: 100% !important;
                height: auto !important;
                min-height: 210px !important;
            }
            .bunkr-stage.is-video .bunkr-stage-mid {
                aspect-ratio: 16 / 9 !important;
                max-height: 56.25vw !important;
            }
            .bunkr-stage.is-video .bunkr-stage-mid > .bunkr-host {
                width: 100% !important;
                height: 100% !important;
                aspect-ratio: 16 / 9 !important;
            }
            .bunkr-stage.is-image .bunkr-stage-mid {
                min-height: 280px !important;
                max-height: 70vh !important;
            }
            .bunkr-stage.is-text .bunkr-stage-mid {
                min-height: 320px !important;
                max-height: 60vh !important;
            }

            /* 4. Base do player em 2 Linhas:
               Linha 1: Controles de reprodução (Play, Repeat, Prev, Next, Skips, Vol, Tempo à direita)
               Linha 2: Ações secundárias (Autoplay à esquerda, Velocidade 1x, Report, Download, Share, PiP, Fullscreen à direita) */
            .bunkr-plc-bottom {
                padding: 0 8px 6px !important;
            }
            .bunkr-plc-row {
                flex-direction: column !important;
                align-items: stretch !important;
                gap: 3px !important;
                min-height: auto !important;
            }
            .bunkr-plc-left {
                display: flex !important;
                align-items: center !important;
                justify-content: flex-start !important;
                width: 100% !important;
                height: 34px !important;
                gap: 1px !important;
            }
            .bunkr-plc-left .bunkr-plc-time {
                margin-left: auto !important;
                padding: 0 2px !important;
                font-size: 11px !important;
            }
            .bunkr-plc-right {
                display: flex !important;
                align-items: center !important;
                justify-content: flex-end !important;
                width: 100% !important;
                height: 34px !important;
                padding-top: 3px !important;
                border-top: 1px solid rgba(255,255,255,.08) !important;
                gap: 3px !important;
            }
            .bunkr-plc-act:not(.bunkr-plc-autoplay):not(.bunkr-plc-speed) {
                width: 30px !important;
                height: 30px !important;
            }
            .bunkr-plc-act svg {
                width: 17px !important;
                height: 17px !important;
            }
            .bunkr-plc-autoplay {
                width: auto !important;
                min-width: 86px !important;
                flex: 0 0 auto !important;
                margin-right: auto !important;
                height: 28px !important;
                padding: 0 8px 0 10px !important;
                gap: 6px !important;
                white-space: nowrap !important;
            }
            .bunkr-plc-ap-label {
                font-size: 11px !important;
                white-space: nowrap !important;
            }
            .bunkr-plc-ap-pill {
                width: 24px !important;
                height: 14px !important;
                flex: 0 0 24px !important;
            }
            .bunkr-plc-ap-knob {
                width: 10px !important;
                height: 10px !important;
            }
            .bunkr-plc-autoplay.is-active .bunkr-plc-ap-knob {
                transform: translateX(10px) !important;
            }
            .bunkr-plc-speed {
                width: auto !important;
                height: 30px !important;
                font-size: 13.5px !important;
                padding: 0 3px !important;
            }

            /* 5. Próximos vídeos (Sidebar de Playlist) aparecem abaixo do player */
            .bunkr-sidebar {
                flex: 1 0 auto !important;
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                min-height: 400px !important;
                border-left: 0 !important;
                border-top: 1px solid rgba(255,255,255,.08) !important;
                display: flex !important;
            }
            .bunkr-stage.is-sidebar-collapsed .bunkr-sidebar {
                width: 100% !important;
                flex-basis: auto !important;
                min-width: 100% !important;
                pointer-events: auto !important;
                display: flex !important;
                overflow: visible !important;
            }
            .bunkr-sidebar-close {
                display: none !important;
            }
            .bunkr-playlist-list {
                flex: 0 0 auto !important;
                max-height: none !important;
                overflow: visible !important;
                height: auto !important;
                padding: 8px 10px 48px !important;
            }
            .bunkr-playlist-thumb-wrap {
                flex: 0 0 132px !important;
                width: 132px !important;
                height: 74px !important;
            }
            .bunkr-playlist-name { font-size: 13.5px !important; }
            .bunkr-playlist-date-lbl, .bunkr-playlist-date-val, .bunkr-playlist-meta { font-size: 12px !important; }
        }

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

        /* Nova Actionbar Integrada com busca, chips e ações */
        .bunkr-gallery-actionbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #111318; border: 1px solid rgba(255,255,255,.08); border-radius: 16px; padding: 8px 12px; margin: 16px 0 24px; box-shadow: 0 4px 20px rgba(0,0,0,.25); flex-wrap: wrap; }
        .bunkr-actionbar-search { position: relative; flex: 1 1 320px; min-width: 240px; max-width: 480px; }
        .bunkr-actionbar-search input { width: 100%; height: 38px; border-radius: 10px; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.04); color: #fff; font-size: 13px; font-family: inherit; padding: 0 34px 0 36px; outline: none; transition: border-color .14s, background .14s, box-shadow .14s; }
        .bunkr-actionbar-search input:focus { border-color: var(--bunkr-accent, #a78bfa); background: rgba(255,255,255,.07); box-shadow: 0 0 0 3px rgba(167,139,250,.15); }
        .bunkr-actionbar-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: rgba(255,255,255,.45); pointer-events: none; }
        .bunkr-actionbar-search-clear { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; border-radius: 50%; border: 0; background: rgba(255,255,255,.1); color: rgba(255,255,255,.7); font-size: 13px; display: none; align-items: center; justify-content: center; cursor: pointer; transition: background .12s, color .12s; }
        .bunkr-actionbar-search-clear:hover { background: rgba(255,255,255,.2); color: #fff; }
        .bunkr-actionbar-search.has-text .bunkr-actionbar-search-clear { display: flex; }

        .bunkr-actionbar-chips { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .bunkr-actionbar-label { font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: rgba(255,255,255,.4); margin-right: 4px; user-select: none; }
        .bunkr-chip { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; border-radius: 9999px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); color: rgba(255,255,255,.8); font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all .14s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; }
        .bunkr-chip:hover { background: rgba(255,255,255,.1); color: #fff; border-color: rgba(255,255,255,.15); }
        .bunkr-chip.is-active { background: var(--bunkr-accent, #a78bfa); color: #120e1e; border-color: var(--bunkr-accent, #a78bfa); font-weight: 700; box-shadow: 0 2px 10px rgba(167,139,250,.3); }
        .bunkr-chip svg { width: 14px; height: 14px; flex-shrink: 0; }

        .bunkr-actionbar-divider { width: 1px; height: 24px; background: rgba(255,255,255,.1); margin: 0 4px; }

        .bunkr-actionbar-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-left: auto; }
        .bunkr-act-btn { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 11px; border-radius: 8px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); color: rgba(255,255,255,.75); font-size: 12px; font-weight: 600; cursor: pointer; transition: all .12s ease; }
        .bunkr-act-btn:hover { background: rgba(167,139,250,.12); border-color: rgba(167,139,250,.35); color: #fff; }
        .bunkr-act-btn.is-active { background: rgba(167,139,250,.2); border-color: var(--bunkr-accent, #a78bfa); color: var(--bunkr-accent, #a78bfa); }
        .bunkr-act-btn svg { width: 14px; height: 14px; flex-shrink: 0; }

        .bunkr-actionbar-count { font-size: 12px; font-weight: 600; color: rgba(255,255,255,.45); background: rgba(255,255,255,.05); padding: 4px 10px; border-radius: 999px; white-space: nowrap; margin-left: 6px; }
        .bunkr-sort-direction { font-size: 11px; margin-left: 2px; opacity: .85; }

        /* Controles de ordenação na Sidebar da Playlist (maiores e rounded-full) */
        .bunkr-sidebar-sort { display: flex; align-items: center; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
        .bunkr-sidebar-sort-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: rgba(255,255,255,.45); margin-right: 2px; user-select: none; }
        .bunkr-sb-chip { display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 12px; border-radius: 9999px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); color: rgba(255,255,255,.75); font: 600 12px/1 Inter, system-ui, sans-serif; cursor: pointer; transition: all .14s ease; user-select: none; }
        .bunkr-sb-chip:hover { background: rgba(255,255,255,.12); color: #fff; border-color: rgba(255,255,255,.18); }
        .bunkr-sb-chip.is-active { background: var(--bunkr-accent, #a78bfa); border-color: var(--bunkr-accent, #a78bfa); color: #120e1e; font-weight: 700; box-shadow: 0 2px 8px rgba(167,139,250,.3); }
        .bunkr-sb-dir { font-size: 10px; }

        /* Datas em texto simples no card da galeria (sem badge, sem ícones) */
        .theItem-dates { display: flex; flex-direction: column; gap: 3px; font-size: 11.5px; text-align: left; margin-top: 5px; }
        .theItem-date-row { display: flex; align-items: center; justify-content: flex-start; gap: 4px; font-size: 11.5px; line-height: 1.35; margin: 0; color: rgba(255,255,255,.55); }
        .theItem-date-lbl { color: rgba(255,255,255,.45); font-weight: 500; font-size: 11px; }
        .theItem-date-val { color: rgba(255,255,255,.85); font-weight: 500; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; }

        /* Datas em texto simples nos itens da playlist da sidebar (sem badge, sem ícones) */
        .bunkr-playlist-dates { display: flex; flex-direction: column; gap: 2px; margin-top: 3px; }
        .bunkr-playlist-dates { min-width: 0; }
        .bunkr-playlist-date-row { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 12px; line-height: 1.3; color: rgba(255,255,255,.5); white-space: nowrap; overflow: hidden; }
        .bunkr-playlist-date-lbl { flex: 0 0 auto; white-space: nowrap; }
        .bunkr-playlist-date-val { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bunkr-playlist-date-lbl { color: rgba(255,255,255,.55); font-weight: 600; font-size: 12.5px; }
        .bunkr-playlist-date-val { color: rgba(255,255,255,.9); font-weight: 600; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; }

        /* Tooltip sutil e ícone em Data Extraída */
        .bunkr-has-tip { cursor: help !important; display: inline-flex !important; align-items: center !important; gap: 3px !important; }
        .bunkr-tip-icon { display: inline-flex; align-items: center; justify-content: center; font-size: 9.5px; line-height: 1; color: rgba(255,255,255,.5); border-radius: 50%; width: 13px; height: 13px; background: rgba(255,255,255,.08); transition: color .15s ease, background .15s ease; user-select: none; }
        .bunkr-has-tip:hover .bunkr-tip-icon { color: #fff; background: var(--bunkr-accent, #a78bfa); }

        /* Cabeçalhos de seção quando Agrupar por Tipo está ativo */
        .bunkr-group-header { grid-column: 1 / -1 !important; display: flex !important; align-items: center !important; gap: 14px !important; margin-top: 24px !important; margin-bottom: 4px !important; padding-top: 14px !important; user-select: none !important; }
        .bunkr-group-header:first-of-type { margin-top: 0 !important; padding-top: 0 !important; }
        .bunkr-group-header-left { display: flex; align-items: center; gap: 8px; font-size: 15.5px; font-weight: 700; color: #f3f4f6; white-space: nowrap; }
        .bunkr-group-header-left svg { width: 18px; height: 18px; color: var(--bunkr-accent, #a78bfa); flex-shrink: 0; }
        .bunkr-group-count { font-size: 11.5px; font-weight: 600; color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.08); padding: 2.5px 8.5px; border-radius: 999px; }
        .bunkr-group-line { flex: 1; height: 1px; background: rgba(255,255,255,0.08); }

        /* Placeholder genérico para thumbnails quebradas ou inexistentes */
        .grid-images_box-txt.has-placeholder .grid-images_box-img { display: none !important; }
        .bunkr-thumb-placeholder { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 35%, #181b24 0%, #0e1017 100%) !important; border-radius: 14px; gap: 8px; z-index: 1; user-select: none; pointer-events: none; border: 1px solid rgba(255,255,255,0.06); }
        .bunkr-ph-icon { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 12px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.06); }
        .bunkr-ph-icon svg { width: 22px; height: 22px; stroke: currentColor; fill: none; }
        .bunkr-ph-badge { font-family: Inter, system-ui, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: rgba(255,255,255,0.75); background: rgba(255,255,255,0.07); padding: 2px 7px; border-radius: 5px; border: 1px solid rgba(255,255,255,0.08); }

        /* Preview do conteúdo de arquivo .txt no card da galeria */
        .bunkr-txt-preview { position: absolute; inset: 0; display: flex; flex-direction: column; background: #0f1118 !important; border-radius: 14px; padding: 10px 12px; overflow: hidden; z-index: 1; pointer-events: none; border: 1px solid rgba(255,255,255,0.08); }
        .bunkr-txt-head { display: flex; align-items: center; gap: 7px; padding-bottom: 6px; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.08); flex: 0 0 auto; }
        .bunkr-txt-head-tag { font: 700 9.5px/1 Inter, monospace; background: rgba(167,139,250,0.18); color: #c4b5fd; padding: 2.5px 6px; border-radius: 4px; border: 1px solid rgba(167,139,250,0.3); letter-spacing: 0.03em; }
        .bunkr-txt-head-title { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.65); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .bunkr-txt-body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace !important; font-size: 10.5px !important; line-height: 1.45 !important; color: #cbd5e1 !important; white-space: pre-wrap !important; word-break: break-all !important; overflow: hidden !important; flex: 1 1 auto; margin: 0 !important; opacity: 0.9; }
        .bunkr-txt-fade { position: absolute; left: 0; right: 0; bottom: 0; height: 38px; background: linear-gradient(to top, #0f1118 15%, transparent 100%); pointer-events: none; }

        /* Visualizador de texto no Stage da página de arquivo (.is-text) */
        .bunkr-txt-stage-host { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 24px; box-sizing: border-box; overflow: hidden; }
        .bunkr-txt-stage-card { width: 100%; max-width: 960px; height: 85vh; max-height: 820px; background: #11131a; border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; display: flex; flex-direction: column; box-shadow: 0 16px 40px rgba(0,0,0,0.6); overflow: hidden; }
        .bunkr-txt-stage-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; background: #161822; border-bottom: 1px solid rgba(255,255,255,0.08); flex: 0 0 auto; }
        .bunkr-txt-stage-info { display: flex; align-items: center; gap: 10px; }
        .bunkr-txt-tag { font: 700 10.5px/1 Inter, monospace; letter-spacing: 0.05em; background: rgba(167,139,250,0.2); color: #c4b5fd; padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(167,139,250,0.35); }
        .bunkr-txt-meta { font-size: 12px; color: rgba(255,255,255,0.6); }
        .bunkr-txt-stage-actions { display: flex; align-items: center; gap: 8px; }
        .bunkr-txt-btn { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #fff; font: 600 12px/1 Inter, sans-serif; cursor: pointer; text-decoration: none; transition: background .12s, border-color .12s; }
        .bunkr-txt-btn:hover { background: rgba(167,139,250,0.15); border-color: rgba(167,139,250,0.4); color: #fff; text-decoration: none; }
        .bunkr-txt-btn[disabled] { opacity: 0.45; cursor: not-allowed; pointer-events: none; }
        .bunkr-txt-btn svg { width: 14px; height: 14px; }
        .bunkr-txt-stage-content { flex: 1 1 auto; overflow-y: auto; padding: 18px 20px; margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace !important; font-size: 13px !important; line-height: 1.6 !important; color: #e2e8f0 !important; white-space: pre-wrap !important; word-break: break-word !important; background: transparent !important; }

        /* toast (feedback de copiar etc.) — acima do stage */
        .bunkr-toast { position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%) translateY(12px); z-index: 100001; padding: 10px 18px; border-radius: 20px; background: #14161a; border: 1px solid #a78bfa66; color: #fff; font: 13px Inter, system-ui, sans-serif; box-shadow: 0 6px 22px rgba(0,0,0,.6); opacity: 0; pointer-events: none; transition: opacity .2s, transform .2s; }
        .bunkr-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    `;

    function addCSS(css) {
        if (typeof GM_addStyle === "function") { GM_addStyle(css); return; }
        const s = document.createElement("style"); s.textContent = css;
        (document.head || document.documentElement).appendChild(s);
    }
    addCSS(CSS);   // document-start → sem flash do layout antigo
