    // STYLE CONTEXT: Thread header, posts and comments
    const CSS_THREAD = `/* ============================================================
               THREAD: header no nosso modelo (sem breadcrumb · botões de ação)
               ============================================================ */
            /* breadcrumb removido por completo */
            html.smg-thread .breadcrumb,
            html.smg-thread .p-breadcrumbs { display: none !important; }
            /* tags da thread (tamanho médio) */
            html.smg-thread .p-description .tagList .tagItem,
            html.smg-thread .p-description .tagItem {
                font-size: 11.5px !important; padding: 2px 8px !important; line-height: 1.35 !important;
                border-radius: 7px !important;
            }
            /* título da thread */
            html.smg-thread .p-body-header .p-title-value,
            html.smg-thread .smg-thead-unified .p-title-value {
                font-size: 24px !important;
                font-weight: 700 !important;
                color: #fff !important;
                line-height: 1.25 !important;
                letter-spacing: -0.01em;
                margin: 0 !important;
                padding: 0 !important;
                padding-left: 0 !important;
                margin-left: 0 !important;
                text-indent: 0 !important;
                min-width: 0;
                display: -webkit-box !important;
                -webkit-line-clamp: 2 !important;
                -webkit-box-orient: vertical !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: normal !important;
                word-break: break-word !important;
            }
            html.smg-thread .smg-thead-unified .p-title-value::before,
            html.smg-thread .smg-thead-unified .p-title-value::after {
                display: none !important;
                content: none !important;
            }
            /* prefixos (ASMR/Patreon/Twitch): pílulas pequenas, não retângulos grandes */
            html.smg-thread .p-title-value .label {
                font-size: 9.5px !important; padding: 1.5px 5.5px !important; border-radius: 4px !important;
                font-weight: 700 !important; letter-spacing: .02em; line-height: 1.3 !important; vertical-align: middle;
            }
            /* AÇÕES (feed · galeria) NA LINHA DO TÍTULO, fixas à direita (dentro do .p-title centralizado).
               Segmented control: UM bloco coeso (borda/fundo únicos) com divisores entre os ícones — junta os 3 num só. */
            html.smg-thread .p-body-header .p-title,
            html.smg-thread .smg-thead-unified .p-title {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                flex-wrap: nowrap !important;
                gap: 16px !important;
                margin: 0 !important;
                width: 100% !important;
            }
            /* ===== THREAD HEADER: one block, sticky on desktop and in-flow on mobile =====
               Antes eram três pedaços soltos (título+ações, tags, e a barra de paginação que ficava no
               .block-outer acima dos posts). Agora é um header único e sticky: numa thread de 300 páginas
               dá pra trocar de página, abrir a galeria ou o feed sem voltar ao topo.
               Ao grudar ele COMPACTA (tags somem, título encolhe) — senão ocuparia meia tela. */
            /* ===== THREAD HEADER: one block, sticky on desktop and in-flow on mobile =====
               Quando abre a página: Hero amplo, thumbnail 120x120px à esquerda, título + tags
               alinhados à esquerda ao lado da imagem, e barra de paginação + botões à direita.
               Ao fazer scroll: vira barra fixa compacta (48px) abaixo da topbar com o nome da
               thread à esquerda, botões à direita e padding superior/inferior rigorosamente idênticos. */
            html.smg-thread .p-body-header.smg-thead-unified {
                position: sticky; top: 60px; z-index: 30;
                background: var(--smg-bg);
                margin: 0 0 16px !important;
                padding: 18px 0 !important;
                min-height: unset !important;
                height: auto !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                box-sizing: border-box !important;
                overflow-anchor: none !important;
                box-shadow: 0 0 0 100vmax var(--smg-bg), 0 1px 0 100vmax rgba(255,255,255,0.08);
                clip-path: inset(0 -100vmax 0);
                transition: padding 0.18s cubic-bezier(0.2, 0, 0, 1), height 0.18s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.18s ease;
            }
            /* The thread header no longer forms a second fixed bar on mobile; the global topbar
               keeps its own divider for the content that starts below it. */
            html.smg-thread.smg-topbar-on #smg-topbar {
                border-bottom-color: rgba(255,255,255,0.08) !important;
                box-shadow: 0 1px 0 rgba(255,255,255,0.02) !important;
            }
            html.smg-thread .p-body-header.smg-thead-unified > *,
            html.smg-thread .p-body-header.smg-thead-unified .pageContent,
            html.smg-thread .p-body-header.smg-thead-unified .uix_headerInner {
                width: 100% !important;
                height: auto !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                margin: 0 auto !important;
                padding: 0 !important;
                box-sizing: border-box !important;
            }
            html.smg-thread .p-body-header.smg-thead-unified.is-stuck {
                top: 60px;
                margin: 0 !important;
                padding: 8px 0 !important;   /* PADDING SIMÉTRICO: 8px no topo e 8px na base */
                min-height: 48px !important;
                height: 48px !important;
                max-height: 48px !important;
                box-sizing: border-box !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                clip-path: inset(0 -100vmax 0) !important;
                box-shadow: 0 0 0 100vmax var(--smg-bg), 0 1px 0 100vmax rgba(255,255,255,0.08) !important;
            }
            @media (max-width: 800px) {
                html.smg-thread .p-body-header.smg-thead-unified { top: 48px; }
                html.smg-thread .p-body-header.smg-thead-unified.is-stuck { top: 48px; }
            }
            /* Lado ESQUERDO: hero (thumb + info [badges + título + tags]) */
            html.smg-thread .p-body-header.smg-thead-unified .smg-thead-hero {
                display: flex !important;
                align-items: center !important;
                gap: 18px !important;
                min-width: 0 !important;
                flex: 1 1 auto !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
            }
            html.smg-thread .p-body-header.smg-thead-unified .smg-thead-info {
                display: flex !important;
                flex-direction: column !important;
                align-items: flex-start !important;
                justify-content: center !important;
                gap: 7px !important;
                min-width: 0 !important;
                flex: 1 1 auto !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
            }
            html.smg-thread .p-body-header.smg-thead-unified .smg-thead-titleline {
                display: flex !important;
                align-items: center !important;
                min-width: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
            }
            html.smg-thread .p-body-header.smg-thead-unified:not(.is-stuck) .p-title-value {
                font-size: 26px !important;
                font-weight: 800 !important;
                line-height: 1.25 !important;
                letter-spacing: -0.01em !important;
                color: #fff !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            /* Lado DIREITO: controles (.smg-thead-controls) alinhados à direita */
            html.smg-thread .smg-thead-controls {
                display: flex !important;
                align-items: center !important;
                gap: 10px !important;
                margin-left: auto !important;
                margin-top: 0 !important;
                margin-bottom: 0 !important;
                padding: 0 !important;
                flex: 0 0 auto !important;
                flex-shrink: 0 !important;
                white-space: nowrap !important;
            }
            html.smg-thread .smg-thead-unified .smg-bar { padding: 3px; border-radius: 12px; }
            html.smg-thread .smg-thead-unified .smg-bar-btn { height: 30px; padding: 0 9px; font-size: 13px; }
            /* COMPACTO (barra fixa ao rolar a página):
               Some a imagem grande, badges e tags. Fica apenas o nome da thread à esquerda,
               e os botões à direita, ambos com 32px de altura centralizados na barra de 48px. */
            .smg-thead-unified.is-stuck .smg-thead-tags,
            .smg-thead-unified.is-stuck .p-description,
            .smg-thead-unified.is-stuck .smg-thead-tags-bar { display: none !important; }
            .smg-thead-unified.is-stuck .smg-thead-hero {
                display: flex !important;
                align-items: center !important;
                gap: 0 !important;
                height: 32px !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .smg-thead-unified.is-stuck .smg-thead-info {
                display: flex !important;
                flex-direction: row !important;
                align-items: center !important;
                justify-content: flex-start !important;
                gap: 0 !important;
                height: 32px !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .smg-thead-unified.is-stuck .smg-thead-titleline {
                display: flex !important;
                align-items: center !important;
                height: 32px !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .smg-thead-unified.is-stuck .p-title-value {
                font-size: 14.5px !important;
                font-weight: 700 !important;
                line-height: 32px !important;
                height: 32px !important;
                display: flex !important;
                align-items: center !important;
                -webkit-line-clamp: 1 !important;
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .smg-thead-unified.is-stuck .smg-thead-titleline .smg-thead-title-text {
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                display: block !important;
            }
            .smg-thead-unified.is-stuck .p-title-value .label,
            .smg-thead-unified.is-stuck .p-title-value .prefix {
                display: none !important;
            }
            .smg-thead-unified.is-stuck .smg-thead-controls {
                height: 32px !important;
                display: flex !important;
                align-items: center !important;
                gap: 10px !important;
                margin-left: auto !important;
                margin-top: 0 !important;
                margin-bottom: 0 !important;
                padding: 0 !important;
                flex: 0 0 auto !important;
                flex-shrink: 0 !important;
            }
            .smg-thead-unified.is-stuck .smg-bar { height: 32px !important; display: flex !important; align-items: center !important; margin: 0 !important; padding: 0 !important; }
            .smg-thead-unified.is-stuck .smg-bar-pager { height: 32px !important; display: flex !important; align-items: center !important; margin: 0 !important; padding: 0 !important; }
            .smg-thead-unified.is-stuck .smg-bar-btn { height: 28px !important; display: flex !important; align-items: center !important; justify-content: center !important; }
            .smg-thead-unified.is-stuck .smg-thead-actions { height: 32px !important; display: flex !important; align-items: center !important; margin: 0 !important; padding: 0 !important; }
            .smg-thead-unified.is-stuck .smg-thead-btn { width: 28px !important; height: 28px !important; display: flex !important; align-items: center !important; justify-content: center !important; }
            .smg-thead-unified.is-stuck .smg-bar-btn { height: 28px; }
            .smg-thead-spacer {
                display: none;
                width: 100%;
                margin: 0 !important;
                padding: 0 !important;
                overflow-anchor: none !important;
            }
            .smg-thead-sentinel { height: 0; margin: 0; padding: 0; overflow-anchor: none !important; }
            /* barra do header: mais apertada que a versão solta — cada px conta numa faixa fixa */
            html.smg-thread .smg-thead-unified .smg-bar { height: 36px; padding: 0; }
            html.smg-thread .smg-thead-unified .smg-bar-group { gap: 2px; padding: 2px 4px; }
            html.smg-thread .smg-thead-unified .smg-bar-div { margin: 9px 2px; }
            html.smg-thread .smg-thead-unified .smg-bar-btn { padding: 0 8px; gap: 5px; }
            html.smg-thread .smg-thead-unified .smg-bar-btn--icon { width: 30px; padding: 0; }
            html.smg-thread .smg-thead-unified .smg-bar-cur { min-width: 60px !important; padding: 0 10px !important; }
            html.smg-thread .smg-thead-unified .smg-bar-pager { gap: 2px; padding: 2px 4px; }
            html.smg-thread .smg-thead-unified .smg-bar-pager .smg-bar-btn,
            .smg-thead-unified.is-stuck .smg-bar-pager .smg-bar-btn {
                width: 28px !important; height: 28px !important; min-width: 28px !important; padding: 0 !important;
                border-radius: 50% !important; font-size: 12.5px;
            }
            html.smg-thread .smg-thead-unified .smg-bar-pager .smg-bar-cur,
            .smg-thead-unified.is-stuck .smg-bar-pager .smg-bar-cur {
                height: 28px !important; min-width: 60px !important; padding: 0 10px !important;
                border-radius: 10px !important; font-size: 12px !important; font-weight: 700 !important;
                white-space: nowrap !important;
            }
            html.smg-thread .smg-thead-unified .smg-bar-pager .smg-bar-cur.smg-bar-pager-goto,
            .smg-thead-unified.is-stuck .smg-bar-pager .smg-bar-cur.smg-bar-pager-goto {
                font-size: 12px !important; font-weight: 700 !important;
            }
            html.smg-thread .smg-thead-unified .smg-bar-pager svg,
            .smg-thead-unified.is-stuck .smg-bar-pager svg {
                width: 14px !important; height: 14px !important;
            }
            /* AÇÕES (feed · galeria) com o MESMO desenho do paginador: mesma caixa (fundo,
               borda, raio, altura) e botões-pílula sem borda própria, em vez do bloco com gradiente e
               divisórias que tinham antes. Assim as duas metades da direita parecem o mesmo componente. */
            html.smg-thread .smg-thead-unified .smg-thead-actions {
                height: 36px; box-sizing: border-box; padding: 2px 4px; align-items: center; gap: 2px;
                background: var(--smg-s1) !important; border: 1px solid var(--smg-bd) !important;
                border-radius: 12px !important; box-shadow: none !important; overflow: visible;
            }
            html.smg-thread .smg-thead-unified .smg-thead-btn {
                width: 30px; height: 30px; min-width: 30px; padding: 0; font-size: 16px;
                border: 0 !important; border-radius: 8px !important; background: transparent !important;
                color: rgba(255,255,255,0.9);
                transition: background .14s ease, color .14s ease;
            }
            html.smg-thread .smg-thead-unified .smg-thead-btn:hover { background: var(--smg-s3) !important; color: #fff; }
            html.smg-thread .smg-thead-unified .smg-thead-btn + .smg-thead-btn { border-left: 0 !important; }
            html.smg-thread .smg-thead-unified .smg-thead-ic svg { width: 17px; height: 17px; }
            .smg-thead-unified.is-stuck .smg-bar { height: 32px; }
            .smg-thead-unified.is-stuck .smg-thead-actions { height: 32px; box-sizing: border-box; }
            .smg-thead-unified.is-stuck .smg-thead-btn { width: 28px; height: 28px; }
            /* hero agrupando thumbnail + info (badges + titleline) */
            .smg-thead-hero {
                display: flex;
                align-items: center;
                gap: 16px;
                min-width: 0;
                flex: 1 1 auto;
            }
            .smg-thead-info {
                display: flex;
                flex-direction: column;
                justify-content: center;
                min-width: 0;
                flex: 1 1 auto;
                gap: 6px;
                padding: 0 !important;
                padding-left: 0 !important;
                margin: 0 !important;
                margin-left: 0 !important;
            }
            .smg-thead-badges-row {
                display: flex !important;
                align-items: center !important;
                flex-wrap: wrap !important;
                gap: 6px !important;
                margin: 0 !important;
                padding: 0 !important;
                padding-left: 0 !important;
                margin-left: 0 !important;
            }
            .smg-thead-badges-row .label,
            .smg-thead-badges-row .prefix {
                font-size: 11px !important;
                padding: 2px 7px !important;
                border-radius: 5px !important;
                font-weight: 700 !important;
                letter-spacing: .02em;
                line-height: 1.3 !important;
                vertical-align: middle;
            }
            .smg-thead-titleline {
                display: flex;
                align-items: flex-start;
                gap: 0;
                min-width: 0;
                flex: 1 1 auto;
                overflow: hidden;
                padding: 0 !important;
                padding-left: 0 !important;
                margin: 0 !important;
                margin-left: 0 !important;
            }
            .smg-thead-titleline .p-title-value {
                flex: 1 1 auto;
                min-width: 0;
            }
            .smg-thead-titleline .smg-thead-title-text {
                display: inline;
                white-space: normal;
                word-break: break-word;
                padding: 0 !important;
                padding-left: 0 !important;
                margin: 0 !important;
                margin-left: 0 !important;
            }
            .smg-thead-thumb {
                flex: 0 0 120px !important;
                width: 120px !important;
                height: 120px !important;
                border-radius: 16px !important;
                overflow: hidden !important;
                background: rgba(255,255,255,0.06) !important;
                border: 1px solid rgba(255,255,255,0.08) !important;
                box-shadow: 0 8px 24px rgba(0,0,0,0.45) !important;
                display: block !important;
            }
            .smg-thead-thumb img {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                display: block !important;
            }
            .smg-thead-unified.is-stuck .smg-thead-hero {
                align-items: center;
                gap: 0;
            }
            .smg-thead-unified.is-stuck .smg-thead-info {
                justify-content: center;
                align-self: center;
                gap: 0;
            }
            .smg-thead-unified.is-stuck .smg-thead-thumb {
                display: none !important;
            }
            .smg-thead-unified.is-stuck .smg-thead-badges-row {
                display: none !important;
            }
            .smg-thead-unified.is-stuck .smg-thead-tags {
                display: none !important;
            }
            html.smg-thread .smg-thead-tags-bar {
                margin: 6px 0 14px 0 !important;
                padding: 0 !important;
                width: 100%;
                display: block;
            }
            html.smg-smg.smg-thread .smg-thead-tags-bar {
                margin: 6px auto 14px auto !important;
            }
            html.smg-smg.smg-thread .smg-thead-tags-bar > .pageContent {
                width: 100%;
                box-sizing: border-box;
            }
            html.smg-smg.smg-thread .smg-thead-tags-bar:not(:has(.pageContent)) {
                max-width: var(--smg-cw) !important;
                margin-left: auto !important;
                margin-right: auto !important;
                padding-left: 10px !important;
                padding-right: 10px !important;
                box-sizing: border-box;
            }
            html.smg-thread .smg-thead-tags-bar .p-description {
                margin: 0 !important;
            }
            .smg-thead-tags { margin: 0; }
            .smg-thead-tags .p-description { margin: 0 !important; }
            /* O ícone de tags e a lista são uma unidade de layout. Alguns skins colocam
               o ícone fora de .tagList; o JS normaliza os pais diretos nesta linha. */
            html.smg-thread .smg-thead-tags-row {
                display: flex !important;
                align-items: center !important;
                flex-wrap: wrap !important;
                gap: 6px !important;
                min-width: 0;
                width: 100%;
                margin: 0 !important;
                padding: 0 !important;
            }
            html.smg-thread .smg-thead-tags-row .tagItem {
                font-size: 12px !important;
                font-weight: 500 !important;
                padding: 3px 10px !important;
                border-radius: 8px !important;
                background: rgba(255,255,255,0.06) !important;
                border: 1px solid rgba(255,255,255,0.08) !important;
                color: rgba(255,255,255,0.85) !important;
                text-decoration: none !important;
                transition: background .14s ease, color .14s ease, border-color .14s ease;
            }
            html.smg-thread .smg-thead-tags-row .tagItem:hover {
                background: rgba(255,255,255,0.12) !important;
                border-color: rgba(255,255,255,0.18) !important;
                color: #fff !important;
            }
            html.smg-thread .smg-thead-tags-row > .listInline,
            html.smg-thread .smg-thead-tags-row > .tagList,
            html.smg-thread .smg-thead-tags-row > .tagList-icon {
                display: inline-flex !important; align-items: center !important; flex-wrap: wrap;
                gap: 4px; min-width: 0; margin: 0 !important; padding: 0 !important;
            }
            html.smg-thread .smg-thead-tags-row .tagList-icon {
                flex: 0 0 auto; line-height: 1; white-space: nowrap;
            }
            html.smg-thread .smg-thead-tags-row .tagList {
                flex: 0 1 auto; max-width: 100%;
            }
            @media (max-width: 700px) {
                html.smg-thread .smg-thead-unified .p-title { flex-wrap: wrap !important; }
                html.smg-thread .smg-thead-unified .smg-thead-controls { margin-left: 0; width: 100%; justify-content: space-between; }
                html.smg-thread .smg-thead-unified .p-title-value { flex: 1 1 100%; }
                .smg-thead-thumb { width: 64px; height: 64px; border-radius: 12px; }
                html.smg-thread .p-body-header .p-title-value { font-size: 19px !important; }
            }

            .smg-thead-actions {
                display: inline-flex; align-items: stretch; margin-left: auto;
                border: 1px solid var(--smg-bd2); border-radius: 13px; overflow: hidden;
                background: linear-gradient(180deg, var(--smg-s2), var(--smg-s1));
                box-shadow: 0 4px 16px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.06);
            }
            .smg-thead-btn {
                width: 48px; height: 42px; font-size: 21px; padding: 0; cursor: pointer;
                display: inline-flex; align-items: center; justify-content: center;
                border: 0; background: transparent; color: rgba(255,255,255,0.94);
                transition: background .16s ease, color .16s ease, transform .12s ease;
            }
            .smg-thead-btn svg { fill: none !important; }   /* ícones outline (o CSS do fórum tentava preencher → play virava blob/sumia) */
            .smg-thead-ic { display: inline-flex; align-items: center; justify-content: center; }
            .smg-thead-lbl { display: none; }   /* desktop: só ícone (compacto na linha do título); label aparece no mobile */
            .smg-thead-btn + .smg-thead-btn { border-left: 1px solid var(--smg-bd); }   /* divisor entre os segmentos */
            .smg-thead-btn:hover { background: var(--smg-link, #ff77b2); color: #fff; }   /* hover de marca: destaca o propósito “maior” */
            .smg-thead-btn:active { transform: scale(0.9); }
            /* título + descrição alinhados à esquerda (sem centralizar nada) */
            html.smg-thread .p-body-header .p-title,
            html.smg-thread .p-body-header .p-description,
            html.smg-thread .uix_headerInner,
            html.smg-thread .uix_headerInner--opposite { text-align: left !important; }
            html.smg-thread .uix_headerInner--opposite { justify-content: flex-start !important; align-items: flex-start !important; }
            html.smg-thread .p-title-pageAction { display: none !important; }   /* botão Quote/responder do header — removido */
            /* MOBILE: header UNIFICADO — título → tags (coladas, mesmo bloco visual) → ações full-width →
               barra de navegação esticada. O JS (buildThreadHeader) move a barra de ações pra DEPOIS das
               tags no mobile; antes ela entrava no meio e as tags ficavam órfãs depois dos botões. */
            @media (max-width: 600px) {
                /* Header da thread normal (topo) no mobile */
                html.smg-thread .p-body-header {
                    padding-top: 6px !important;
                    padding-left: 4px !important;
                    padding-right: 4px !important;
                    margin-bottom: 2px !important;
                }
                html.smg-thread .p-body-header.smg-thead-unified {
                    position: static !important;
                    top: auto !important;
                    min-height: 0 !important;
                    height: auto !important;
                    padding: 3px 4px !important;
                    margin-bottom: 4px !important;
                    box-shadow: none !important;
                    clip-path: none !important;
                }
                html.smg-thread .p-body-header.smg-thead-unified.is-stuck {
                    position: static !important; top: auto !important; min-height: 0 !important;
                    height: auto !important; box-shadow: none !important; clip-path: none !important;
                }
                html.smg-thread .smg-thead-hero {
                    display: flex !important;
                    align-items: center !important;
                    gap: 12px !important;
                    min-width: 0 !important;
                    flex: 1 1 auto !important;
                    padding-left: 0 !important;
                }
                html.smg-thread .smg-thead-thumb {
                    flex: 0 0 88px !important;
                    width: 88px !important;
                    min-width: 88px !important;
                    height: 88px !important;
                    border-radius: 16px !important;
                    margin-right: 0 !important;
                    align-self: center !important;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.42) !important;
                }
                html.smg-thread .smg-thead-thumb img {
                    width: 100% !important;
                    height: 100% !important;
                    border-radius: 16px !important;
                    object-fit: cover !important;
                }
                html.smg-thread .smg-thead-info {
                    display: flex !important;
                    flex-direction: column !important;
                    align-self: center !important;
                    justify-content: center !important;
                    min-width: 0 !important;
                    flex: 1 1 auto !important;
                    gap: 4px !important;
                    padding-left: 0 !important;
                }
                html.smg-thread .smg-thead-unified .p-title {
                    gap: 2px !important;
                    row-gap: 2px !important;
                }
                html.smg-thread .smg-thead-unified .smg-thead-titleline {
                    flex: 1 1 100% !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 4px !important;
                    padding-left: 0 !important;
                }
                html.smg-thread .smg-thead-unified .p-title-value {
                    display: block !important;
                    font-size: 16px !important;
                    line-height: 1.25 !important;
                    font-weight: 750 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }

                /* UNIFICAÇÃO DE TODAS AS BADGES (Labels e Prefixos) */
                html.smg-thread .smg-thead-unified .p-title-value .label,
                html.smg-thread .smg-thead-unified .p-title-value .prefix,
                html.smg-thread .smg-thead-unified .label,
                html.smg-thread .smg-thead-unified .prefix,
                html.smg-thread .smg-thead-unified [class*="label--"],
                html.smg-thread .smg-thead-unified [class*="prefix--"] {
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    height: 18px !important;
                    min-height: 18px !important;
                    max-height: 18px !important;
                    padding: 0 5px !important;
                    margin: 0 !important;
                    font-size: 9.5px !important;
                    font-weight: 700 !important;
                    line-height: 1 !important;
                    border-radius: 4px !important;
                    vertical-align: middle !important;
                    box-sizing: border-box !important;
                    flex-shrink: 0 !important;
                    transform: none !important;
                }
                html.smg-thread .smg-thead-unified .smg-thead-title-text {
                    display: inline !important;
                    font-size: 16px !important;
                    font-weight: 750 !important;
                    line-height: 1.25 !important;
                    color: #fff !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    white-space: normal !important;
                    word-break: break-word !important;
                    overflow: visible !important;
                    text-overflow: clip !important;
                }
                html.smg-thread .smg-thead-tags {
                    margin: 1px 0 2px !important;
                    padding-left: 0 !important;
                }
                html.smg-thread .p-description .listInline,
                html.smg-thread .p-description .tagList {
                    display: inline-flex !important;
                    flex-wrap: wrap !important;
                    gap: 2px !important;
                    row-gap: 2px !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                html.smg-thread .p-description .listInline > li {
                    display: inline-flex !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                html.smg-thread .p-description .tagList .tagItem,
                html.smg-thread .p-description .tagItem,
                html.smg-thread .tagItem {
                    font-size: 10px !important;
                    padding: 1px 5px !important;
                    border-radius: 4px !important;
                    margin: 0 !important;
                    line-height: 1.25 !important;
                }
                html.smg-thread .p-description .tagList .tagList-icon,
                html.smg-thread .p-description .tagList-icon {
                    margin-right: 1px !important;
                    padding: 0 !important;
                    font-size: 11px !important;
                    align-self: center !important;
                }

                /* Ocultar do topo no mobile: barra duplicada de páginas/follow/sort e ações */
                html.smg-thread .smg-thead-controls,
                html.smg-thread .smg-thead-unified .smg-thead-controls,
                html.smg-thread .smg-thead-unified .smg-bar,
                html.smg-thread .smg-thead-actions,
                html.smg-thread .smg-thead-unified .smg-thead-actions,
                html.smg-thread .p-body-header .smg-bar,
                html.smg-thread .p-body-header .smg-thead-controls,
                html.smg-thread .p-body-header > .smg-thead-controls,
                html.smg-thread .block-outer--top,
                html.smg-thread .block-outer:first-of-type {
                    display: none !important;
                }
                /* AÇÕES DO POST no celular: salvar e compartilhar viram só ícone e as reações
                   perdem a palavra (fica "joinha 283"). Com os três rótulos a barra quebrava em
                   duas linhas — e "Salvar"/"Compartilhar" são ícones universais, o texto só
                   ocupava espaço. Comentar mantém o rótulo: é a ação principal. */
                html.smg-thread .smg-pc-act--save .smg-pc-act-lbl,
                html.smg-thread .smg-pc-act--share .smg-pc-act-lbl,
                html.smg-thread .smg-pc-act--comment .smg-pc-act-lbl,
                html.smg-thread .smg-cc-act--comment .smg-pc-act-lbl,
                html.smg-thread .smg-react-w { display: none !important; }
                html.smg-thread .smg-pc-act--save,
                html.smg-thread .smg-pc-act--share,
                html.smg-thread .smg-pc-act--comment { padding: 0 10px !important; }
                html.smg-thread .smg-pc-actions { gap: 2px; flex-wrap: nowrap; padding: 10px 14px 12px; }
                html.smg-thread .smg-pc-act { padding: 0 11px !important; }
                html.smg-thread .smg-pc-morewrap { margin-left: auto; }   /* ⋯ encostado na direita */

            }

            /* barra de navegação/ações: paginação colada à ESQUERDA, ações/ordenação empurradas
               pra DIREITA (preenche a largura toda); mobile = empilhado */
            html.smg-thread .block-outer {
                display: flex !important; align-items: center !important; justify-content: flex-start !important;
                flex-wrap: wrap !important; gap: 0 !important; margin: 0 !important; padding-bottom: 0 !important;
            }
            /* espaçamento vertical enxuto: cola título→barra→posts */
            html.smg-thread .p-body-header:not(.smg-thead-unified) { padding-top: 26px !important; padding-bottom: 4px !important; margin-bottom: 0 !important; }
            html.smg-thread .p-body-header .p-description { margin-bottom: 0 !important; }
            html.smg-thread .block-outer + * { margin-top: 4px !important; }
            html.smg-thread .block.block--messages,
            html.smg-thread .block-body--messages,
            html.smg-thread .js-replyNewMessageContainer { margin-top: 4px !important; }
            html.smg-thread .block-outer-main { flex: 0 1 auto !important; margin: 0 auto 0 0 !important; min-width: 0 !important; }
            html.smg-thread .block-outer-opposite { flex: 0 0 auto !important; margin: 0 !important; }
            /* mata o centramento nativo do pager (era o que indentava a paginação) */
            html.smg-thread .pageNavWrapper { justify-content: flex-start !important; align-items: center !important; text-align: left !important; margin: 0 !important; }
            html.smg-thread .pageNav { display: flex !important; align-items: center !important; justify-content: flex-start !important; margin: 0 !important; gap: 6px !important; }
            html.smg-thread .pageNav-main { display: flex !important; align-items: center; gap: 6px !important; flex-wrap: wrap; margin: 0 !important; padding: 0 !important; }
            /* o <li> (pageNav-page) era o que deslocava os números pra baixo: zera padding/line-height e centra */
            html.smg-thread .pageNav-page { display: flex !important; align-items: center !important; margin: 0 !important; padding: 0 !important; line-height: 1 !important; }
            html.smg-thread .pageNavSimple { justify-content: flex-start !important; margin: 0 !important; gap: 6px !important; align-items: center; }
            /* mostra só UM paginador (evita o pager completo + o "1 of N" juntos): completo no desktop */
            html.smg-thread .pageNavWrapper .pageNavSimple { display: none !important; }
            /* === BARRA ÚNICA: MESMO estilo de botão pra TODOS (pager · ações · ordenar) === */
            html.smg-thread .block-outer-opposite .buttonGroup { display: flex !important; gap: 6px !important; flex-wrap: wrap !important; align-items: center; }
            html.smg-thread .block-outer-opposite .tabs { justify-content: flex-start !important; border: 0 !important; box-shadow: none !important; gap: 6px !important; display: flex !important; }
            html.smg-thread .pageNavSimple-el,
            html.smg-thread .pageNav-jump,
            html.smg-thread .pageNav-page > a,
            html.smg-thread .block-outer-opposite .button,
            html.smg-thread .block-outer-opposite .button--link,
            html.smg-thread .block-outer-opposite .smgTranslator-globalBtn,
            html.smg-thread .block-outer-opposite .tabs-tab {
                border-radius: 10px !important; border: 1px solid var(--smg-bd) !important;
                background: var(--smg-s1) !important; color: rgba(255,255,255,0.85) !important; box-shadow: none !important;
                min-height: 36px !important; padding: 0 14px !important; margin: 0 !important;
                font-weight: 600; display: inline-flex !important; align-items: center; justify-content: center;
            }
            html.smg-thread .pageNavSimple-el:hover,
            html.smg-thread .pageNav-jump:hover,
            html.smg-thread .pageNav-page > a:hover,
            html.smg-thread .block-outer-opposite .button:hover,
            html.smg-thread .block-outer-opposite .button--link:hover,
            html.smg-thread .block-outer-opposite .smgTranslator-globalBtn:hover,
            html.smg-thread .block-outer-opposite .tabs-tab:hover {
                background: var(--smg-s2) !important; border-color: var(--smg-bd2) !important; color: #fff !important;
            }
            /* SELECIONADO (página atual · ordenação ativa) = BRANCO */
            html.smg-thread .pageNav-page--current > a,
            html.smg-thread .block-outer-opposite .tabs-tab.is-active {
                background: #fff !important; color: #141414 !important; border-color: #fff !important; box-shadow: none !important;
            }
            /* mata TODOS os pseudos nativos do pager: a SETA dupla (XF desenha ‹ › via ::before/::after
               no .pageNav-jump — meu ícone vinha por cima) e o INDICADOR VERDE da página atual */
            html.smg-thread .pageNavWrapper::before, html.smg-thread .pageNavWrapper::after,
            html.smg-thread .pageNav::before, html.smg-thread .pageNav::after,
            html.smg-thread .pageNav-main::before, html.smg-thread .pageNav-main::after,
            html.smg-thread .pageNav-jump::before, html.smg-thread .pageNav-jump::after,
            html.smg-thread .pageNavSimple::before, html.smg-thread .pageNavSimple::after,
            html.smg-thread .pageNavSimple-el::before, html.smg-thread .pageNavSimple-el::after,
            html.smg-thread .pageNav-page::before, html.smg-thread .pageNav-page::after,
            html.smg-thread .pageNav-page > a::before, html.smg-thread .pageNav-page > a::after,
            html.smg-thread .pageNav-page--current::before, html.smg-thread .pageNav-page--current::after,
            html.smg-thread .pageNav-page--current > a::before, html.smg-thread .pageNav-page--current > a::after { content: none !important; display: none !important; border: 0 !important; background: none !important; box-shadow: none !important; }
            /* o "verde abaixo" pode vir das bordas/box-shadow nativos dos containers e do <li> current */
            html.smg-thread .pageNavWrapper, html.smg-thread .pageNav, html.smg-thread .pageNav-main,
            html.smg-thread .pageNav-page, html.smg-thread .pageNav-page--current { border: 0 !important; box-shadow: none !important; background: none !important; }
            html.smg-thread .pageNav-page--current > a { text-decoration: none !important; }
            html.smg-thread .block-outer a:focus, html.smg-thread .block-outer a:focus-visible,
            html.smg-thread .block-outer button:focus, html.smg-thread .block-outer button:focus-visible { outline: none !important; box-shadow: none !important; }
            /* CTA de responder (SMG) em destaque (botão branco) */
            html.smg-thread .p-title-pageAction .button--cta {
                border-radius: 10px !important; border: none !important;
                background: #fff !important; color: #141414 !important;
            }
            /* mata baseline/borda/pseudo nativos das tabs (o "1px fantasma" na barra) */
            html.smg-thread .block-outer-opposite .tabs { border: 0 !important; box-shadow: none !important; background: transparent !important; padding: 0 !important; margin: 0 !important; }
            html.smg-thread .block-outer-opposite .tabs::before,
            html.smg-thread .block-outer-opposite .tabs::after,
            html.smg-thread .block-outer-opposite .tabs-tab::before,
            html.smg-thread .block-outer-opposite .tabs-tab::after { content: none !important; display: none !important; border: 0 !important; }

            /* mobile: TUDO numa linha só, alinhado à direita; paginador compacto */
            @media (max-width: 600px) {
                html.smg-thread .block-outer {
                    flex-direction: row !important; flex-wrap: nowrap !important;
                    justify-content: flex-end !important; align-items: center !important;
                    gap: 0 !important; overflow-x: auto; -webkit-overflow-scrolling: touch;
                }
                html.smg-thread .block-outer::-webkit-scrollbar { display: none; }
                html.smg-thread .block-outer-main { margin: 0 !important; flex: 0 0 auto !important; }
                html.smg-thread .block-outer-opposite { width: auto !important; flex: 0 0 auto !important; }
                html.smg-thread .block-outer-opposite .tabs { width: auto !important; overflow: visible; }
                /* paginador: só o simples e SEM ‹‹ ›› (primeiro/último), bem compacto */
                html.smg-thread .pageNavWrapper .pageNav { display: none !important; }
                html.smg-thread .pageNavWrapper .pageNavSimple { display: flex !important; }
                html.smg-thread .pageNavSimple-el--first, html.smg-thread .pageNavSimple-el--last { display: none !important; }
                /* todos os botões da barra com o MESMO tamanho compacto no mobile */
                html.smg-thread .pageNavSimple-el,
                html.smg-thread .pageNav-jump,
                html.smg-thread .block-outer-opposite .button,
                html.smg-thread .block-outer-opposite .button--link,
                html.smg-thread .block-outer-opposite .smgTranslator-globalBtn,
                html.smg-thread .block-outer-opposite .tabs-tab { min-height: 34px !important; padding: 0 11px !important; font-size: 13px !important; }
            }

            /* Ocultar preview tooltip nativo do XenForo que abre no hover de textos/títulos */
            .tooltip--preview { display: none !important; }

            /* ---- LISTINHA COMPACTA DE TÓPICOS FIXOS / LINKS DE AJUDA NO TOPO ---- */
            html.smg-threadlist .smg-sticky-compact-list,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list {
                display: flex !important;
                flex-direction: column !important;
                gap: 3px !important;
                margin: 0 0 16px 0 !important;
                padding: 6px 10px !important;
                background: var(--smg-s1, #16171b) !important;
                border: 1px solid var(--smg-bd, rgba(255,255,255,0.08)) !important;
                border-radius: 12px !important;
                list-style: none !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread {
                display: flex !important;
                flex-direction: row !important;
                align-items: center !important;
                justify-content: flex-start !important;
                text-align: left !important;
                gap: 10px !important;
                padding: 6px 10px !important;
                border: 0 !important;
                border-radius: 8px !important;
                background: transparent !important;
                min-height: 38px !important;
                height: auto !important;
                max-height: none !important;
                width: 100% !important;
                box-sizing: border-box !important;
                transition: background 0.14s ease !important;
                transform: none !important;
                box-shadow: none !important;
            }
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread:hover,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread:hover {
                background: rgba(255,255,255,0.06) !important;
                border-color: transparent !important;
                transform: none !important;
                box-shadow: none !important;
            }
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread + .structItem--thread,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread + .structItem--thread {
                border-top: 1px solid rgba(255,255,255,0.05) !important;
            }
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread .structItem-cell--icon,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread .structItem-cell--icon,
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread .dcThumbnail,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread .dcThumbnail,
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread .dtt-thread-thumbnail,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread .dtt-thread-thumbnail {
                width: 26px !important;
                height: 26px !important;
                min-width: 26px !important;
                max-width: 26px !important;
                flex: 0 0 26px !important;
                aspect-ratio: 1 / 1 !important;
                border-radius: 6px !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread .structItem-cell--icon img,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread .structItem-cell--icon img,
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread .dcThumbnail img,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread .dcThumbnail img,
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread .dtt-thread-thumbnail img,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread .dtt-thread-thumbnail img {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                border-radius: 6px !important;
                display: block !important;
            }
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread .structItem-cell--main,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread .structItem-cell--main {
                flex: 1 1 auto !important;
                display: flex !important;
                flex-direction: row !important;
                align-items: center !important;
                justify-content: flex-start !important;
                text-align: left !important;
                gap: 8px !important;
                padding: 0 !important;
                margin: 0 !important;
                min-width: 0 !important;
                width: auto !important;
                overflow: hidden !important;
            }
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread .structItem-statuses,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread .structItem-statuses {
                display: none !important;
            }
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread .structItem-title,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread .structItem-title {
                display: inline-flex !important;
                flex-direction: row !important;
                align-items: center !important;
                justify-content: flex-start !important;
                text-align: left !important;
                flex-wrap: nowrap !important;
                gap: 6px !important;
                font-size: 13.5px !important;
                font-weight: 600 !important;
                min-width: 0 !important;
                white-space: nowrap !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
            }
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread .structItem-title .label,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread .structItem-title .label,
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread .structItem-title .labelLink,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread .structItem-title .labelLink {
                display: inline-flex !important;
                align-items: center !important;
                margin: 0 !important;
                font-size: 9.5px !important;
                padding: 1.5px 5.5px !important;
                border-radius: 4px !important;
                line-height: 1.2 !important;
                flex-shrink: 0 !important;
            }
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread .structItem-title a[href*="/threads/"],
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread .structItem-title a[href*="/threads/"],
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread .structItem-title a:not(.label):not(.labelLink),
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread .structItem-title a:not(.label):not(.labelLink) {
                display: inline !important;
                width: auto !important;
                min-height: 0 !important;
                line-height: 1.3 !important;
                margin: 0 !important;
                padding: 0 !important;
                color: #fff !important;
                text-decoration: none !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
                text-align: left !important;
                -webkit-line-clamp: unset !important;
                -webkit-box-orient: unset !important;
            }
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread .structItem-title a:hover,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread .structItem-title a:hover {
                color: var(--smg-link, #ff77b2) !important;
                text-decoration: underline !important;
            }
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread .structItem-pageJump,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread .structItem-pageJump {
                display: inline-flex !important;
                flex-direction: row !important;
                align-items: center !important;
                gap: 3px !important;
                margin: 0 0 0 6px !important;
                padding: 0 !important;
                flex-shrink: 0 !important;
                width: auto !important;
            }
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread .structItem-pageJump a,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread .structItem-pageJump a {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 10px !important;
                font-weight: 700 !important;
                padding: 1px 5px !important;
                border-radius: 3px !important;
                background: rgba(255,255,255,0.08) !important;
                color: rgba(255,255,255,0.6) !important;
                text-decoration: none !important;
            }
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread .smg-card-dates,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread .smg-card-dates {
                margin-left: auto !important;
                margin-top: 0 !important;
                padding: 0 !important;
                flex-shrink: 0 !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 5px !important;
                font-size: 11px !important;
                color: rgba(255,255,255,0.4) !important;
                white-space: nowrap !important;
            }
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread .structItem-minor,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread .structItem-minor,
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread .structItem-cell--meta,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread .structItem-cell--meta,
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread .structItem-cell--latest,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread .structItem-cell--latest,
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread .structItem-cell--iconEnd,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread .structItem-cell--iconEnd,
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread .structItem-extraInfo,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread .structItem-extraInfo,
            html.smg-threadlist .smg-sticky-compact-list .structItem--thread .smg-thread-unwatch-btn,
            html.smg-threadlist.smg-tv-grid .smg-sticky-compact-list .structItem--thread .smg-thread-unwatch-btn {
                display: none !important;
            }

            /* ---- FIXADOS COMO TABELA: foto · badges+título (juntos) · atualizado em · paginação ---- */
            html.smg-threadlist:is(.smg-tv-grid,:not(.smg-tv-grid)) .smg-sticky-compact-list .structItem--thread {
                display: grid !important;
                grid-template-columns: 30px minmax(0, 1fr) 230px 128px !important;
                align-items: center !important;
                column-gap: 14px !important;
            }
            html.smg-threadlist:is(.smg-tv-grid,:not(.smg-tv-grid)) .smg-sticky-compact-list .structItem--thread .structItem-cell--main,
            html.smg-threadlist:is(.smg-tv-grid,:not(.smg-tv-grid)) .smg-sticky-compact-list .structItem--thread .smg-card-dates { display: contents !important; }
            html.smg-threadlist:is(.smg-tv-grid,:not(.smg-tv-grid)) .smg-sticky-compact-list .structItem--thread > .structItem-cell--icon { grid-column: 1 !important; grid-row: 1 !important; }
            html.smg-threadlist:is(.smg-tv-grid,:not(.smg-tv-grid)) .smg-sticky-compact-list .structItem--thread .structItem-title {
                grid-column: 2 !important; grid-row: 1 !important; min-width: 0 !important;
                display: flex !important; flex-wrap: nowrap !important; align-items: center !important; gap: 6px !important;
            }
            html.smg-threadlist:is(.smg-tv-grid,:not(.smg-tv-grid)) .smg-sticky-compact-list .structItem--thread .label-append { display: none !important; }
            html.smg-threadlist:is(.smg-tv-grid,:not(.smg-tv-grid)) .smg-sticky-compact-list .structItem--thread .structItem-title a:not(.label):not(.labelLink) {
                display: block !important; min-width: 0 !important; margin-left: 2px !important;
            }
            html.smg-threadlist:is(.smg-tv-grid,:not(.smg-tv-grid)) .smg-sticky-compact-list .structItem--thread .smg-card-date-item:nth-of-type(1) { grid-column: 3 !important; grid-row: 1 !important; text-align: right !important; white-space: nowrap !important; }
            html.smg-threadlist:is(.smg-tv-grid,:not(.smg-tv-grid)) .smg-sticky-compact-list .structItem--thread .smg-card-date-item:not(:first-of-type),
            html.smg-threadlist:is(.smg-tv-grid,:not(.smg-tv-grid)) .smg-sticky-compact-list .structItem--thread .smg-card-date-sep { display: none !important; }
            html.smg-threadlist:is(.smg-tv-grid,:not(.smg-tv-grid)) .smg-sticky-compact-list .structItem--thread .structItem-pageJump { grid-column: 4 !important; grid-row: 1 !important; justify-self: end !important; margin: 0 !important; }

            /* ---- modo grade (cards, máx 6 colunas) — .smg-tl-grid é marcado via JS no
               container real dos itens (varia entre fórum e watched) ---- */
            html.smg-threadlist.smg-tv-grid .smg-tl-grid {
                display: grid !important;
                grid-template-columns: repeat(auto-fill, minmax(max(var(--smg-card-min, 230px), calc((100% - 70px) / 6)), 1fr)) !important;
                gap: 14px !important;
                padding: 14px !important;
                align-items: stretch !important;
            }
            html.smg-threadlist.smg-tv-grid .smg-tl-grid > .smg-inf-sep { grid-column: 1 / -1 !important; }
            html.smg-threadlist.smg-tv-grid .stickySeparatortop,
            html.smg-threadlist.smg-tv-grid .stickySeparatorbottom { display: none !important; }
            /* ---- GRID DE TÓPICOS IDENTICO AO NOSSO MODELO ---- */
            html.smg-threadlist.smg-tv-grid .smg-tl-grid > .structItem--thread,
            html.smg-threadlist.smg-tv-grid :not(.smg-sticky-compact-list) > .structItem--thread {
                display: flex !important;
                flex-direction: column !important;
                align-items: stretch !important;
                height: 100% !important;
                box-sizing: border-box !important;
                gap: 0 !important;
                padding: 0 !important;
                border: 1px solid rgba(127,127,127,0.18) !important;
                border-radius: 12px !important;
                overflow: hidden !important;
                background: var(--smg-s1, #1b1c21) !important;
                position: relative !important;
                transition: border-color .14s ease, transform .14s ease, box-shadow .14s ease !important;
            }
            html.smg-threadlist .structItem--thread.samUnitWrapper,
            html.smg-threadlist .structItem--thread.smg-card-empty,
            html.smg-threadlist.smg-tv-grid .smg-tl-grid > .structItem--thread.samUnitWrapper,
            html.smg-threadlist.smg-tv-grid .smg-tl-grid > .structItem--thread.smg-card-empty,
            html.smg-threadlist.smg-tv-grid :not(.smg-sticky-compact-list) > .structItem--thread.samUnitWrapper,
            html.smg-threadlist.smg-tv-grid :not(.smg-sticky-compact-list) > .structItem--thread.smg-card-empty {
                display: none !important;
            }
            html.smg-threadlist.smg-tv-grid :not(.smg-sticky-compact-list) > .structItem--thread:hover {
                border-color: var(--smg-bd2, rgba(255,255,255,0.22)) !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important;
            }
            html.smg-threadlist.smg-tv-grid :not(.smg-sticky-compact-list) > .structItem--thread .structItem-cell--icon:not(.structItem-cell--iconEnd),
            html.smg-threadlist.smg-tv-grid :not(.smg-sticky-compact-list) > .structItem--thread .dcThumbnail,
            html.smg-threadlist.smg-tv-grid :not(.smg-sticky-compact-list) > .structItem--thread .dtt-thread-thumbnail {
                width: 100% !important;
                aspect-ratio: 1 / 1 !important;
                height: auto !important;
                border-radius: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                flex: 0 0 auto !important;
                position: relative !important;
            }
            html.smg-threadlist.smg-tv-grid :not(.smg-sticky-compact-list) > .structItem--thread .dcThumbnail img,
            html.smg-threadlist.smg-tv-grid :not(.smg-sticky-compact-list) > .structItem--thread .dtt-thread-thumbnail img {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                border-radius: 0 !important;
                display: block !important;
            }

            /* Ocultar status nativos dentro de .structItem--thread (mantém apenas o pontinho ciano inline ao lado do título) */
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-statuses,
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-status,
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-status--unread {
                display: none !important;
            }

            .smg-thread-unwatch-btn {
                position: absolute !important;
                top: 6px !important;
                right: 6px !important;
                z-index: 5 !important;
                width: 28px !important;
                height: 28px !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                background: rgba(0,0,0,0.65) !important;
                border: 0 !important;
                border-radius: 8px !important;
                color: rgba(255,255,255,0.8) !important;
                cursor: pointer !important;
                opacity: 0 !important;
                transition: opacity .14s ease, background .14s ease, color .14s ease, transform .14s ease !important;
            }
            .structItem--thread:hover .smg-thread-unwatch-btn,
            .structItem-cell--icon:hover .smg-thread-unwatch-btn {
                opacity: 1 !important;
            }
            .smg-thread-unwatch-btn.is-following {
                opacity: 0.85 !important;
                color: var(--smg-link, #ff77b2) !important;
                background: rgba(0,0,0,0.75) !important;
            }
            .smg-thread-unwatch-btn.is-following:hover {
                background: rgba(244,63,94,0.9) !important;
                color: #fff !important;
            }
            .smg-thread-unwatch-btn:not(.is-following):hover {
                background: var(--smg-link, #ff77b2) !important;
                color: #fff !important;
            }
            .smg-thread-unwatch-btn:hover {
                transform: scale(1.08) !important;
            }
            .smg-thread-unwatch-btn svg {
                width: 15px !important;
                height: 15px !important;
                fill: none !important;
                stroke: currentColor !important;
                stroke-width: 2px !important;
            }

            /* Corpo do Card */
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-cell--main {
                width: 100% !important;
                box-sizing: border-box !important;
                padding: 8px 12px 12px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 0 !important;
                flex: 1 1 auto !important;
            }

            /* Row 1 (Badges em Linha Única) e Row 2 (Título) */
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-title {
                display: flex !important;
                flex-direction: row !important;
                flex-wrap: wrap !important;
                align-items: center !important;
                gap: 4px !important;
                font-size: 14.5px !important;
                font-weight: 700 !important;
                line-height: 1.3 !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .structItem--thread .structItem-title .label,
            .structItem-title .label,
            .structItem-title .prefix,
            .structItem .label,
            .labelLink .label {
                font-size: 9.5px !important;
                padding: 1.5px 5.5px !important;
                border-radius: 4px !important;
                line-height: 1.2 !important;
            }
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-title a[href*="/threads/"],
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-title a:not(.label):not(.labelLink) {
                width: 100% !important;
                display: -webkit-box !important;
                -webkit-line-clamp: 2 !important;
                -webkit-box-orient: vertical !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                min-height: 2.6em !important;
                line-height: 1.3 !important;
                margin-top: 5px !important;
                color: #fff !important;
                text-decoration: none !important;
                word-break: break-word !important;
            }
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-title a:hover {
                color: var(--smg-link, #ff77b2) !important;
                text-decoration: underline !important;
            }

            /* Row 3 (Data Discreta) */
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-minor {
                display: flex !important;
                flex-direction: column !important;
                gap: 0 !important;
                margin-top: 4px !important;
                padding: 0 !important;
            }
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-parts {
                display: flex !important;
                align-items: center !important;
                margin: 0 !important;
                padding: 0 !important;
                list-style: none !important;
            }
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-parts li:not(.structItem-startDate) {
                display: none !important;
            }
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-startDate,
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-startDate time {
                color: rgba(255,255,255,0.45) !important;
                font-size: 11.5px !important;
                font-weight: 500 !important;
                margin: 0 !important;
                padding: 0 !important;
            }

            .smg-card-dates {
                display: flex !important;
                flex-wrap: wrap !important;
                align-items: center !important;
                gap: 5px !important;
                margin-top: auto !important;
                padding-top: 8px !important;
                font-size: 11.5px !important;
                color: rgba(255,255,255,0.45) !important;
                line-height: 1.3 !important;
            }
            .smg-card-date-val { color: rgba(255,255,255,0.7) !important; font-weight: 600 !important; }
            .smg-card-date-sep { color: rgba(255,255,255,0.25) !important; }

            /* Row 4 (Chips de Paginação) */
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-pageJump {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 3px !important;
                margin-top: 7px !important;
                width: 100% !important;
                padding: 0 !important;
            }
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-pageJump a {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 11px !important;
                font-weight: 700 !important;
                padding: 2px 6px !important;
                border-radius: 4px !important;
                background: rgba(255,255,255,0.08) !important;
                color: rgba(255,255,255,0.65) !important;
                text-decoration: none !important;
            }
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-pageJump a:hover {
                background: var(--smg-link, #ff77b2) !important;
                color: #000 !important;
            }
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-cell--meta,
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-cell--latest,
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-cell--iconEnd,
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-extraInfo,
            html.smg-threadlist.smg-tv-grid .structItem--thread input[name="thread_ids[]"],
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-minor .structItem-statuses {
                display: none !important;
            }
            html.smg-threadlist.smg-tv-grid .structItem--thread.is-unread .structItem-title a[href*="/threads/"]::after,
            html.smg-threadlist.smg-tv-grid .structItem--thread.is-unread .structItem-title a[data-tp-primary]::after {
                content: "" !important;
                display: inline-block !important;
                width: 7px !important;
                height: 7px !important;
                border-radius: 50% !important;
                background: var(--smg-link, #ff77b2) !important;
                box-shadow: 0 0 6px var(--smg-link-soft, rgba(255,119,178,0.45)) !important;
                margin-left: 6px !important;
                vertical-align: middle !important;
            }
            html.smg-threadlist .structItem--thread.smg-card-empty,
            html.smg-threadlist .structItem--quickCreate,
            html.smg-threadlist .block-filterBar { display: none !important; }
            html.smg-threadlist .uix_threadListSeparator {
                background: transparent !important;
                color: rgba(255,255,255,0.62) !important;
                font-size: 12px !important;
                font-weight: 700 !important;
                letter-spacing: .08em !important;
                text-transform: uppercase !important;
                border: 0 !important;
                padding: 18px 16px 4px !important;
                margin: 0 !important;
            }
            html.smg-threadlist .uix_threadListSeparator .uix_threadCollapseTrigger { color: rgba(255,255,255,0.45) !important; }
            html.smg-threadlist.smg-tv-grid .structItem--thread:not([data-smg-ph-ready]) .structItem-cell--icon:not(.structItem-cell--iconEnd) {
                position: relative !important;
                overflow: hidden !important;
                background: var(--smg-s2, #2a2a2a) !important;
                min-height: 160px;
            }
            html.smg-threadlist.smg-tv-grid .structItem--thread:not([data-smg-ph-ready]) .structItem-cell--icon:not(.structItem-cell--iconEnd)::after {
                content: "";
                position: absolute;
                inset: 0;
                transform: translateX(-100%);
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
                animation: smg-skel-shimmer 1.3s ease-in-out infinite;
                pointer-events: none;
            }
            /* ads injetados na lista (samUnitWrapper) são .structItem--thread → viram célula VAZIA
               no grid. Some de vez (no grid e na lista) — corrige os "buracos" do grid. */
            html.smg-threadlist .structItem--thread.samUnitWrapper { display: none !important; }`;