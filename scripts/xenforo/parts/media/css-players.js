    // ── CSS: embeds, native video player, dead media and post links ──
    const CSS_MEDIA_PLAYERS = `
            /* ---- turbo/saint embeds (iframe nativo) ---- */
            .generic2wide-iframe-div {
                position: relative;
                width: 100% !important;
                max-width: min(920px, calc(min(42vh, 420px) * 16 / 9)) !important;
                max-height: min(42vh, 420px) !important;
                margin: var(--smg-sp-16) auto !important;
                display: block !important;
                aspect-ratio: 16 / 9;
                overflow: hidden;
                border-radius: var(--smg-r-10);
                background: #000;
            }
            .bbCodeBlock--unfurl .contentRow-figure,
            .bbCodeBlock--unfurl .contentRow-figure img,
            .bbCodeBlock--unfurl img.bbImage {
                max-width: 88px !important;
                max-height: 88px !important;
                aspect-ratio: 1 !important;
                object-fit: cover !important;
            }
            .generic2wide-iframe-div.smg-player-loaded,
            span[data-s9e-mediaembed].smg-player-loaded,
            .generic2wide-iframe-div:has(.smg-rg),
            .generic2wide-iframe-div:has(.smg-turbo-slot--filled) {
                aspect-ratio: auto !important;
                overflow: visible !important;
                background: transparent !important;
                border-radius: 0 !important;
                display: block !important;
                max-width: 100% !important;
                max-height: none !important;
                height: auto !important;
            }
            html.smg-thread .smg-pc-head { position: relative; z-index: var(--smg-z-1); background: var(--smg-s1); }
            /* iframes nativos dentro de .generic2wide-iframe-div preenchem o container 16:9 perfeitamente */
            .generic2wide-iframe-div > iframe,
            .generic2wide-iframe-div iframe.saint-iframe {
                position: absolute !important;
                inset: 0 !important;
                width: 100% !important;
                height: 100% !important;
                max-width: 100% !important;
                max-height: 100% !important;
                aspect-ratio: auto !important;
                border: none !important;
                border-radius: 0 !important;
                background: #000 !important;
                display: block !important;
            }

            /* ---- turbo: slot (loading), fallback link, error card ---- */
            .smg-turbo-slot {
                position: relative;
                display: block;
                width: 100%;
                aspect-ratio: 16 / 9;
                min-height: 220px;
                border-radius: var(--smg-r-10);
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
                z-index: var(--smg-z-2);
            }
            .smg-loading::after {
                content: "";
                width: 42px;
                height: 42px;
                border-radius: var(--smg-r-round);
                border: 3px solid var(--smg-w-14);
                border-top-color: var(--smg-w-85);
                animation: smg-spin 0.8s linear infinite;
            }
            @keyframes smg-spin {
                to { transform: rotate(360deg); }
            }
            /* ---- reveal: spinner do post travado por like/medalha (in-flow, não overlay) ---- */
            .smg-reveal-spin { position: static !important; inset: auto !important; min-height: 56px; margin: var(--smg-sp-14) auto; }
            /* ---- mídia direta (susercontent/Shopee, .mp4/.webm/.webp em link cru) ---- */
            .smg-dm-wrap { margin: var(--smg-sp-14) auto !important; max-width: min(75%, 880px) !important; }
            /* Container de imagem horizontal/sheet standalone (fora de grid) */
            a.smg-imglink.smg-wide-link,
            a.smg-imglink:has(> img.bbImage.smg-wide),
            a.smg-imglink:has(> .bbImage.smg-wide),
            .bbImageWrapper.smg-wide-link,
            .bbImageWrapper:has(> a.smg-wide-link),
            .bbImageWrapper:has(> img.smg-wide) {
                display: block !important;
                width: 100% !important;
                max-width: min(100%, 1080px) !important;
                margin-left: auto !important;
                margin-right: auto !important;
                margin-top: var(--smg-sp-14) !important;
                margin-bottom: var(--smg-sp-14) !important;
                text-align: center !important;
            }
            /* Imagens widescreen/sheets fora de grid: preenchem nobremente até 100% da largura útil (máx 1080px) */
            .smg-dm-wrap.smg-wide,
            img.bbImage.smg-wide,
            a.smg-wide-link > img.bbImage,
            .smg-wide-link img.bbImage {
                width: 100% !important;
                max-width: min(100%, 1080px) !important;
                height: auto !important;
                max-height: none !important;
                display: block !important;
                margin-left: auto !important;
                margin-right: auto !important;
                object-fit: contain !important;
            }
            /* Citações: imagens mantêm teto compacto */
            .bbCodeBlock--quote a.smg-wide-link,
            .bbCodeBlock--quote img.bbImage.smg-wide {
                max-height: 280px !important;
                width: auto !important;
                max-width: 100% !important;
            }
            /* Preview de link: a regra .smg-wide (100% / height auto) vinha depois e
               estourava a thumb do unfurl. A figura fica 88px e o texto ao lado. */
            .bbCodeBlock--unfurl {
                max-width: 100% !important;
                overflow: hidden !important;
            }
            .bbCodeBlock--unfurl .contentRow {
                display: flex !important;
                flex-direction: row !important;
                align-items: flex-start !important;
                gap: var(--smg-sp-12) !important;
                min-width: 0 !important;
            }
            .bbCodeBlock--unfurl .contentRow-figure {
                flex: 0 0 88px !important;
                width: 88px !important;
                height: 88px !important;
                overflow: hidden !important;
            }
            .bbCodeBlock--unfurl .contentRow-figure img,
            .bbCodeBlock--unfurl img,
            .bbCodeBlock--unfurl img.bbImage,
            .bbCodeBlock--unfurl img.bbImage.smg-wide {
                width: 88px !important;
                height: 88px !important;
                max-width: 88px !important;
                max-height: 88px !important;
                object-fit: cover !important;
                margin: 0 !important;
            }
            .bbCodeBlock--unfurl .contentRow-main {
                flex: 1 1 auto !important;
                min-width: 0 !important;
                overflow: hidden !important;
            }
            /* Standalone images (a run of one): wrapper is a full-width block so the img width (a % of it) resolves
               from the post column, not from the file's pixels. Only the <img> takes clicks (no dead strip beside it). */
            a.smg-imglink.smg-vert-link:not(.auto-image-grid *),
            .bbImageWrapper.smg-vert-link:not(.auto-image-grid *),
            a.smg-imglink.smg-wide-link:not(.auto-image-grid *),
            .bbImageWrapper.smg-wide-link:not(.auto-image-grid *) {
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
                pointer-events: none;
            }
            a.smg-imglink.smg-vert-link:not(.auto-image-grid *) > img.bbImage,
            .bbImageWrapper.smg-vert-link:not(.auto-image-grid *) img.bbImage,
            a.smg-imglink.smg-wide-link:not(.auto-image-grid *) > img.bbImage,
            .bbImageWrapper.smg-wide-link:not(.auto-image-grid *) img.bbImage { pointer-events: auto; }
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

            .smg-dm-wrap img.bbImage { border-radius: var(--smg-r-10); }
            .smg-dm-video {
                display: block; width: 100%;
                max-width: min(1400px, calc(var(--smg-media-h) * 16 / 9));
                max-height: var(--smg-media-h);
                margin: 0 auto; border-radius: var(--smg-r-10); background: #000;
            }
            /* ---- barra de chips dos links de file-host (GoFile/Bunkr/…) no fim do post ---- */
            .smg-post-links { display: flex; flex-wrap: wrap; gap: var(--smg-sp-8); margin: var(--smg-sp-12) 0 var(--smg-sp-2); padding-top: var(--smg-sp-12); border-top: 1px solid var(--smg-bd); }
            .smg-link-chip {
                display: inline-flex; align-items: center; gap: var(--smg-sp-6); max-width: 100%;
                padding: var(--smg-sp-6) var(--smg-sp-12); border-radius: var(--smg-chip-r); background: var(--smg-s2); border: 1px solid var(--smg-bd);
                color: var(--smg-w-85) !important; font-size: var(--smg-fs-13); font-weight: 600;
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
                margin: var(--smg-sp-16) auto !important;
                border: none !important;
                border-radius: var(--smg-r-10) !important;
                background: #000 !important;
            }

            /* ---- redgifs / gifs / youtube: full width igual aos outros ---- */
            span[data-s9e-mediaembed="youtube"],
            span[data-s9e-mediaembed="gifs"],
            span[data-s9e-mediaembed="redgifs"] {
                display: block !important;
                width: 100% !important;
                max-width: min(1400px, calc(var(--smg-media-h) * 16 / 9)) !important;  /* 16:9 não passa de --smg-media-h de altura */
                margin: var(--smg-sp-16) auto !important;
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
                border-radius: var(--smg-r-10) !important;
                background: #000 !important;
            }

            /* defensivo: o conteúdo do embed NUNCA passa da largura do container.
               alguns players (ex.: redgifs) injetam iframe/wrapper aninhado com
               largura fixa que escapava dos seletores acima e estourava a página
               no mobile (scroll horizontal). */
            .generic2wide-iframe-div:not(.smg-player-loaded):not(:has(.smg-rg)):not(:has(.smg-turbo-slot--filled)),
            span[data-s9e-mediaembed]:not(.smg-player-loaded):not(:has(.smg-rg)) {
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
                max-width: min(1400px, calc(var(--smg-media-h, min(70vh, 750px)) * var(--smg-rg-ratio, 1.7778)));
                max-height: var(--smg-media-h, min(70vh, 750px));   /* TETO: não estoura o viewport (vale no masonry) */
                margin: var(--smg-sp-16) auto;
                aspect-ratio: 16 / 9;             /* placeholder; o JS troca pelo aspect REAL (videoWidth/Height ou API do redgifs) e MANTÉM (não some no clearSkel) */
                background: #000;
                border-radius: var(--smg-r-10);
                overflow: hidden;
                /* CRO antigo NÃO volta: o site forçava aspect/overflow no .generic2wide-iframe-div (já destravado); e o vídeo é
                   position:absolute+inset:0 (preenche a caixa SEM depender de %-height resolver). object-fit:contain = nunca corta. */
            }
            span[data-s9e-mediaembed] .smg-rg,
            .generic2wide-iframe-div .smg-rg { margin: 0 auto !important; }   /* container já dá a margem → não dobra */
            .smg-rg-fail {   /* gif morto: placeholder discreto no lugar do iframe de erro do redgifs */
                display: flex; align-items: center; justify-content: center;
                width: 100%; aspect-ratio: 16 / 9; max-height: var(--smg-media-h);
                background: #161616; color: var(--smg-w-50);
                border-radius: var(--smg-r-10); font-size: var(--smg-fs-13); text-align: center; padding: var(--smg-sp-8);
            }
            /* ---- MÍDIA MORTA (buildDeadBox): um estado de falha só p/ imagem/vídeo/embed 404 ----
               Fica DEPOIS de .smg-rg-fail e .smg-turbo-error de propósito: a caixa acumula essas classes (outros
               passes as usam como marcador de "este slot já resolveu") e, com a mesma especificidade, quem vem
               por último vence. */
            .smg-dead {
                position: relative;
                display: flex !important;
                flex-direction: row !important;
                align-items: center !important;
                justify-content: flex-start !important;
                gap: var(--smg-sp-10) !important;
                box-sizing: border-box !important;
                width: 100% !important;
                max-width: 100% !important;
                min-height: 42px !important;
                margin: var(--smg-sp-4) 0 !important;
                padding: var(--smg-sp-10) var(--smg-sp-16) !important;
                border: 1px solid rgba(255, 75, 75, 0.32) !important;
                border-radius: var(--smg-r-10) !important;
                background: linear-gradient(180deg, rgba(255, 75, 75, 0.08), rgba(255, 75, 75, 0.03)) var(--smg-s1) !important;
                color: var(--smg-tx) !important;
                text-align: left !important;
                overflow: hidden !important;
                aspect-ratio: auto !important;
                cursor: pointer !important;
                pointer-events: auto !important;
                transition: border-color var(--smg-dur-15) ease, background var(--smg-dur-15) ease, box-shadow var(--smg-dur-15) ease !important;
            }
            .smg-dead:hover {
                background: linear-gradient(180deg, rgba(255, 75, 75, 0.14), rgba(255, 75, 75, 0.06)) var(--smg-s2) !important;
                border-color: rgba(255, 95, 95, 0.55) !important;
                box-shadow: 0 4px 16px rgba(255, 60, 60, 0.14) !important;
            }
            .smg-dead--media { max-width: none !important; min-height: 0 !important; aspect-ratio: 16 / 9 !important; max-height: var(--smg-media-h) !important; margin: var(--smg-sp-16) auto !important; }
            .smg-turbo-slot > .smg-dead { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important; margin: 0 !important; aspect-ratio: auto !important; border-radius: 0 !important; }
            .smg-dead-code {
                display: inline-flex !important;
                align-items: center !important;
                gap: var(--smg-sp-6) !important;
                padding: var(--smg-sp-2) var(--smg-sp-8) !important;
                border-radius: var(--smg-r-6) !important;
                background: rgba(255, 75, 75, 0.2) !important;
                border: 1px solid rgba(255, 75, 75, 0.4) !important;
                font-size: var(--smg-fs-13) !important;
                font-weight: 800 !important;
                color: #ff6b6b !important;
                flex-shrink: 0 !important;
                white-space: nowrap !important;
            }
            .smg-dead-code svg { width: 15px !important; height: 15px !important; flex: 0 0 auto !important; fill: none !important; stroke: currentColor !important; opacity: 0.95 !important; }
            .smg-dead-code b:empty { display: none; }
            .smg-dead-sep { color: var(--smg-w-30) !important; font-weight: 700 !important; flex-shrink: 0 !important; }
            .smg-dead-sub { font-size: var(--smg-fs-13) !important; font-weight: 500 !important; color: var(--smg-w-72) !important; overflow-wrap: anywhere !important; flex: 1 1 auto !important; }
            /* Nunca aplica efeito de loading/shimmer sobre containers de vídeo iframe / turbo.cr */
            .generic2wide-iframe-div::before,
            .generic2wide-iframe-div::after,
            .generic2wide-iframe-div > iframe::before,
            .generic2wide-iframe-div > iframe::after,
            iframe.saint-iframe::before,
            iframe.saint-iframe::after,
            iframe[src*="turbo.cr"]::before,
            iframe[src*="turbo.cr"]::after,
            .smg-turbo-slot::before,
            .smg-turbo-slot::after,
            .tb-fallback::before,
            .tb-fallback::after,
            [data-url*="turbo.cr"]::before,
            [data-url*="turbo.cr"]::after {
                display: none !important;
                content: none !important;
                animation: none !important;
            }
            /* ---- LINKS EM POSTS E TEXTOS (.bbWrapper, .message-body, etc.): contraste limpo e legível (sem neon/drop-shadow) ---- */
            .message-body a:not(.smg-imglink):not(.bbImageWrapper):not(.smg-dead):not(.smg-wide-link):not(.smg-link-chip):not(.button):not(.tabs-tab):not(.menu-linkRow):not(.smg-rg-error-btn):not([class*="smg-fhcard"]):not([class*="smg-dead"]),
            .message-userContent a:not(.smg-imglink):not(.bbImageWrapper):not(.smg-dead):not(.smg-wide-link):not(.smg-link-chip):not(.button):not(.tabs-tab):not(.menu-linkRow):not(.smg-rg-error-btn):not([class*="smg-fhcard"]):not([class*="smg-dead"]),
            .bbWrapper a:not(.smg-imglink):not(.bbImageWrapper):not(.smg-dead):not(.smg-wide-link):not(.smg-link-chip):not(.button):not(.tabs-tab):not(.menu-linkRow):not(.smg-rg-error-btn):not([class*="smg-fhcard"]):not([class*="smg-dead"]) {
                color: color-mix(in srgb, var(--smg-link) 42%, #e9e9ec) !important;
                font-weight: 500;
                text-decoration: underline !important;
                text-decoration-color: color-mix(in srgb, var(--smg-link) 55%, transparent) !important;
                text-underline-offset: 3px !important;
                text-decoration-thickness: 1px !important;
                transition: color var(--smg-dur-15) ease, text-decoration-color var(--smg-dur-15) ease;
            }
            .message-body a:not(.smg-imglink):not(.bbImageWrapper):not(.smg-dead):not(.smg-wide-link):not(.smg-link-chip):not(.button):not(.tabs-tab):not(.menu-linkRow):not(.smg-rg-error-btn):not([class*="smg-fhcard"]):not([class*="smg-dead"]):hover,
            .message-userContent a:not(.smg-imglink):not(.bbImageWrapper):not(.smg-dead):not(.smg-wide-link):not(.smg-link-chip):not(.button):not(.tabs-tab):not(.menu-linkRow):not(.smg-rg-error-btn):not([class*="smg-fhcard"]):not([class*="smg-dead"]):hover,
            .bbWrapper a:not(.smg-imglink):not(.bbImageWrapper):not(.smg-dead):not(.smg-wide-link):not(.smg-link-chip):not(.button):not(.tabs-tab):not(.menu-linkRow):not(.smg-rg-error-btn):not([class*="smg-fhcard"]):not([class*="smg-dead"]):hover {
                color: #fff !important;
                text-decoration-color: #fff !important;
                filter: none !important;
            }
            .smg-fhcard, .smg-fhcard *,
            .smg-dead, .smg-dead *,
            .smg-link-chip, .smg-link-chip * {
                text-decoration: none !important;
                filter: none !important;
            }
            .smg-rg-v {
                position: absolute; inset: 0;    /* preenche a CAIXA (aspect-ratio do .smg-rg); inset:0 evita o bug de %-height não resolver com max-height */
                display: block; width: 100%; height: 100%;
                object-fit: contain;             /* nunca corta — letterbox só se o teto (max-height) mudar o aspect da caixa */
                background: #000;
                cursor: pointer;
            }
            /* LOADING NO PLAYER: o vídeo e seu poster NUNCA somem com opacity 0! Mostra spinner central sobre o poster */
            .smg-rg.smg-rg-loading { background: #141414; overflow: hidden; }
            .smg-rg.smg-rg-loading > .smg-rg-v { opacity: 1 !important; pointer-events: auto; }
            .smg-rg.smg-rg-loading > .smg-rgc-flash { opacity: 0 !important; pointer-events: none !important; }
            .smg-rg.smg-rg-loading > .smg-rgc-bottom { opacity: 0.6; pointer-events: none; }
            .smg-rg.smg-rg-loading::after {
                content: "";
                position: absolute;
                top: 50%; left: 50%;
                width: 46px; height: 46px;
                margin: -23px 0 0 -23px;
                border-radius: var(--smg-r-round);
                border: 3px solid var(--smg-w-22);
                border-top-color: var(--smg-link);
                animation: smg-spin 0.8s linear infinite;
                z-index: var(--smg-z-5);
                pointer-events: none;
            }
            /* ESTADO DE ERRO DIRETO NO PLAYER (.smg-rg-error) — PERF: fundo sólido, sem blur por trás
               (sob 94% de opacidade o blur mal aparecia e repintava a página a cada frame de scroll) */
            .smg-rg-error {
                position: absolute; inset: 0; z-index: var(--smg-z-8);
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                gap: var(--smg-sp-12); padding: var(--smg-sp-20);
                background: rgba(18, 19, 24, 0.94);
                color: #fff; text-align: center; box-sizing: border-box;
            }
            .smg-rg-error-badge {
                display: inline-flex; align-items: center; gap: var(--smg-sp-8);
                padding: var(--smg-sp-6) var(--smg-sp-14); border-radius: var(--smg-badge-r);
                background: rgba(255, 75, 75, 0.18);
                border: 1px solid rgba(255, 75, 75, 0.45);
                color: #ff5e5e; font-size: var(--smg-fs-14); font-weight: 800; letter-spacing: 0.4px;
            }
            .smg-rg-error-badge svg { width: 17px; height: 17px; fill: none !important; stroke: currentColor; }
            .smg-rg-error-msg { font-size: var(--smg-fs-13); color: var(--smg-w-72); max-width: 85%; line-height: 1.4; overflow-wrap: anywhere; }
            .smg-rg-error-acts { display: flex; align-items: center; gap: var(--smg-sp-10); margin-top: var(--smg-sp-4); }
            .smg-rg-error-btn {
                display: inline-flex; align-items: center; gap: var(--smg-sp-6);
                padding: var(--smg-sp-6) var(--smg-sp-14); border-radius: var(--smg-btn-r);
                font-size: var(--smg-fs-13); font-weight: 600; text-decoration: none !important;
                cursor: pointer; transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease;
            }
            .smg-rg-error-btn--open { background: var(--smg-link); color: #fff !important; border: 0; }
            .smg-rg-error-btn--open:hover { background: var(--smg-link-strong); }
            .smg-rg-error-btn--retry { background: var(--smg-w-08); color: #e7e7ea !important; border: 1px solid var(--smg-w-18); }
            .smg-rg-error-btn--retry:hover { background: var(--smg-w-14); color: #fff !important; }
            /* PRONTO (defer de host-blob, autoplay-off): sem spinner, play central FIXO ("clique pra tocar").
               poster (redgifs) ou fundo preto (turbo/saint) atrás → NUNCA caixa preta sem affordance (era o bug do deferBlob desligado). */
            .smg-rg.smg-rg-ready .smg-rgc-flash { opacity: 1; }
            .smg-rg.smg-rg-ready .smg-rgc-play { pointer-events: auto; }
            /* ---- controles estilo YouTube: play CENTRAL (no pausado) + BARRA INFERIOR com gradiente:
               scrubber em cima e linha [play · volume · tempo ··· visualizador · tela cheia]. Accent = tema. ---- */
            /* CENTRO: play grande — só no pausado/pronto (tocando, o controle é a barra). Seek = duplo-clique no vídeo. */
            .smg-rgc-flash {
                position: absolute; inset: 0; z-index: var(--smg-z-2);
                display: flex; align-items: center; justify-content: center;
                opacity: 0; pointer-events: none; transition: opacity var(--smg-dur-20) ease;
            }
            .smg-rg:hover:not(.smg-rg-loading):not(.smg-rg-buffering):not(.smg-rgc-playing) .smg-rgc-flash { opacity: 1; }
            .smg-rgc-flash button {
                border: 0; border-radius: var(--smg-r-round); cursor: pointer; padding: 0;
                background: var(--smg-k-55); color: #fff;
                display: flex; align-items: center; justify-content: center;
                transition: transform var(--smg-dur-12) ease, background var(--smg-dur-12) ease; pointer-events: none;   /* só interativo quando o flash aparece (regras abaixo) — senão capturaria cliques invisível */
            }
            .smg-rgc-flash button:hover { transform: scale(1.08); background: var(--smg-k-72); }
            .smg-rg:hover:not(.smg-rg-loading):not(.smg-rg-buffering):not(.smg-rgc-playing) .smg-rgc-flash button { pointer-events: auto; }
            .smg-rgc-play { width: 64px; height: 64px; }
            .smg-rgc-play svg { width: 30px; height: 30px; display: block; margin-left: var(--smg-sp-4); }
            @media (max-width: 600px) { .smg-rgc-play { width: 54px; height: 54px; } .smg-rgc-play svg { width: 26px; height: 26px; } }
            /* BARRA INFERIOR: gradiente; some fora do hover; visível no pausado-carregado e no touch (NÃO no pronto/poster) */
            .smg-rgc-bottom {
                position: absolute; left: 0; right: 0; bottom: 0; z-index: var(--smg-z-3);
                padding: var(--smg-sp-8) var(--smg-sp-4) var(--smg-sp-2);
                background: linear-gradient(to top, var(--smg-k-82) 0%, var(--smg-k-35) 62%, transparent 100%);
                opacity: 0; pointer-events: none; transition: opacity var(--smg-dur-20) ease;
            }
            .smg-rg:hover:not(.smg-rg-loading):not(.smg-rg-ready) .smg-rgc-bottom,
            .smg-rg:not(.smg-rgc-playing):not(.smg-rg-ready):not(.smg-rg-loading):not(.smg-rg-buffering) .smg-rgc-bottom { opacity: 1; pointer-events: auto; }
            /* SCRUBBER (no topo da barra) */
            .smg-rgc-prog { position: relative; width: 100%; height: 14px; display: flex; align-items: center; cursor: pointer; touch-action: none; }
            .smg-rgc-bar { position: relative; width: 100%; height: 3px; background: var(--smg-w-30); border-radius: var(--smg-r-4); transition: height var(--smg-dur-12) ease; }
            .smg-rgc-prog:hover .smg-rgc-bar { height: 5px; }
            .smg-rgc-buf { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: var(--smg-w-30); border-radius: var(--smg-r-4); pointer-events: none; }
            .smg-rgc-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: var(--smg-link); border-radius: var(--smg-r-4); pointer-events: none; }
            .smg-rgc-knob { position: absolute; right: -6px; top: 50%; width: 12px; height: 12px; border-radius: var(--smg-r-round); background: var(--smg-link); transform: translateY(-50%) scale(0); transition: transform var(--smg-dur-12) ease; }
            .smg-rgc-prog:hover .smg-rgc-knob { transform: translateY(-50%) scale(1); }
            /* LINHA de controles */
            .smg-rgc-row { display: flex; align-items: center; justify-content: space-between; gap: var(--smg-sp-4); padding: var(--smg-sp-2) var(--smg-sp-4) var(--smg-sp-2); }
            .smg-rgc-left, .smg-rgc-right { display: flex; align-items: center; gap: var(--smg-sp-2); }
            .smg-rgc-act {
                width: 34px; height: 34px; border: 0; border-radius: var(--smg-r-round); cursor: pointer; padding: 0;
                background: transparent; color: #fff;
                display: flex; align-items: center; justify-content: center;
                transition: background var(--smg-dur-12) ease, transform var(--smg-dur-12) ease;
            }
            .smg-rgc-act:hover { background: var(--smg-w-18); }
            .smg-rgc-act:active { transform: scale(0.9); }
            .smg-rgc-act svg { width: 21px; height: 21px; display: block; }
            .smg-rgc-speed {
                height: 24px; min-width: 32px; padding: 0 var(--smg-sp-6);
                border: 0; border-radius: var(--smg-r-6); cursor: pointer;
                background: var(--smg-w-12); color: var(--smg-w-95);
                font: 700 11.5px/1 var(--smg-mono);
                letter-spacing: -0.2px;
                display: flex; align-items: center; justify-content: center;
                transition: background var(--smg-dur-12) ease, transform var(--smg-dur-12) ease, color var(--smg-dur-12) ease;
                user-select: none;
            }
            .smg-rgc-speed:hover { background: var(--smg-w-22); color: #fff; }
            .smg-rgc-speed:active { transform: scale(0.92); }
            .smg-rgc-speed.is-custom-speed { background: var(--smg-ac); color: #fff; font-weight: 800; }
            /* PADRONIZA os ícones do player = OUTLINE limpo, igual ao visualizador (o CSS do fórum PREENCHE svg → vira blob; o #smg-feed já se protege, o inline não). Play/pause é a exceção (preenchido). */
            .smg-rg .smg-rgc-act svg, .smg-rg .smg-rgc-src svg { fill: none !important; }
            .smg-rg .smg-rgc-play svg, .smg-rg .smg-rgc-barplay svg { fill: currentColor !important; }
            /* VOLUME: mute + barra que expande no hover (YouTube) */
            .smg-rgc-volbar { position: relative; width: 0; height: 4px; border-radius: var(--smg-r-4); background: var(--smg-w-40); cursor: pointer; opacity: 0; transition: width var(--smg-dur-20) ease, opacity var(--smg-dur-20) ease, margin var(--smg-dur-20) ease; touch-action: none; }
            .smg-rgc-volbar::before { content: ""; position: absolute; left: 0; right: 0; top: -9px; bottom: -9px; }   /* área de clique alta */
            .smg-rgc-volfill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: #fff; border-radius: var(--smg-r-4); pointer-events: none; }
            /* TEMPO (atual / duração) */
            .smg-rgc-time { color: #fff; font: 600 12px/1 -apple-system, system-ui, sans-serif; font-variant-numeric: tabular-nums; padding: 0 var(--smg-sp-6); white-space: nowrap; flex: 0 0 auto; }
            @media (max-width: 600px) { .smg-rgc-act { width: 30px; height: 30px; } .smg-rgc-act svg { width: 19px; height: 19px; } .smg-rgc-time { font-size: var(--smg-fs-11); padding: 0 var(--smg-sp-4); } }
            /* indicador "« 5s" / "5s »" no duplo-clique p/ voltar/avançar */
            .smg-rgc-seekflash {
                position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: var(--smg-z-3);
                color: #fff; font: 700 15px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background: var(--smg-k-55); padding: var(--smg-sp-10) var(--smg-sp-16); border-radius: var(--smg-r-pill);
                opacity: 0; transition: opacity var(--smg-dur-15) ease; pointer-events: none; white-space: nowrap;
            }
            .smg-rgc-seekflash.on { opacity: 1; }
            /* FONTE + abrir EXTERNO num só: badge clicável no canto SUP-DIREITO do player ("Turbo ↗"). É a marca-dágua da fonte E o "abrir no host" (substituiu o ↗ do rail). */
            .smg-rgc-src {
                position: absolute; top: 10px; right: 10px; z-index: var(--smg-z-4);
                display: inline-flex; align-items: center; gap: var(--smg-sp-6); max-width: calc(100% - 20px);
                padding: var(--smg-sp-4) var(--smg-sp-10); border-radius: var(--smg-r-8);
                background: var(--smg-k-62); color: #fff; text-decoration: none;
                font: 800 12px/1.2 -apple-system, system-ui, "Segoe UI", sans-serif; letter-spacing: 0.01em;
                cursor: pointer; opacity: 0; pointer-events: none;
                transition: opacity var(--smg-dur-15) ease, background var(--smg-dur-15) ease; box-shadow: var(--smg-shadow-1);
            }
            .smg-rg:hover .smg-rgc-src { opacity: 1; pointer-events: auto; }
            .smg-rgc-src:hover { background: var(--smg-k-82); }
            .smg-rgc-src:active { transform: scale(0.96); }
            .smg-rgc-src .smg-rgc-src-t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .smg-rgc-src svg { width: 13px; height: 13px; display: block; flex: 0 0 auto; }
            @media (hover: none) { .smg-rg:not(.smg-rg-loading):not(.smg-rg-ready) .smg-rgc-bottom { opacity: 1; pointer-events: auto; } .smg-rgc-src { opacity: 0.72; pointer-events: auto; } }
            /* BUFFERING (loading ao avançar/voltar): spinner por cima, SEM esconder o vídeo (diferente do skeleton) */
            .smg-rg.smg-rg-buffering::after {
                content: ""; position: absolute; top: 50%; left: 50%; width: 42px; height: 42px; margin: -21px 0 0 -21px;
                border-radius: var(--smg-r-round); border: 3px solid var(--smg-w-22); border-top-color: var(--smg-w-95);
                animation: smg-spin 0.8s linear infinite; z-index: var(--smg-z-4); pointer-events: none;
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
                display: flex !important; justify-content: center !important; align-items: center !important;
            }
            /* (o fallback .smg-turbo-slot:has(.smg-rg) foi REMOVIDO: todo caminho que põe .smg-rg num slot chama
               fillSlot() → a classe acima sempre vale, e o :has custava re-validação upward a cada mutação) */
            .smg-turbo-slot > .smg-rg { margin: 0 auto !important; }

            /* ---- site a 80% da largura disponível (desktop), CENTRALIZADO ---- */
            @media (min-width: 801px) {
                .p-header-inner,
                .p-nav-inner,
                .p-sectionLinks-inner,
                .p-body-inner,
                .p-footer-inner,
                /* o socialmediagirls usa .pageContent (fora do .p-body-inner) no header/breadcrumb;
                   alinha com o conteúdo (mesma largura) pra não ficar torto */
                .p-body-header > .pageContent,
                .breadcrumb > .pageContent,
                .smg-thead-tags-bar > .pageContent {
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
            html:not(.smg-thread) .p-body-header { padding-top: var(--smg-sp-28) !important; padding-bottom: var(--smg-sp-10) !important; }
            @media (max-width: 600px) { html:not(.smg-thread) .p-body-header { padding-top: var(--smg-sp-16) !important; } }   /* mobile já tem gap (topbar 52 < body 76) → não empilha demais */
            .p-body-header .p-title { text-align: left !important; }
            .p-body-header .p-title-value { font-size: var(--smg-fs-32) !important; font-weight: 800 !important; line-height: 1.2 !important; }

            /* ---- remove banners de anúncio (striply etc.) ---- */
            a[href*="striply.com"],
            body > a[href*="striply"] { display: none !important; }


            `;
