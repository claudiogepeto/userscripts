    // STYLE CONTEXT: Timeline and bookmark feed
    const CSS_FEED = `/* ============ river de posts (modo Feed da /watched/threads) ============ */
            /* modo feed: o JS marca .smg-river-hide nos irmãos do river (lista nativa + filtro + paginação) → robusto, independe da classe do bloco do tema */
            .smg-river-hide { display: none !important; }
            html.smg-watched-feed .structItemContainer { display: none !important; }   /* flash-kill: a lista some já no document-start, antes do JS rodar (no-op na home) */
            html.smg-watched-feed .p-body-sidebar,
            html.smg-watched-feed .p-body-sidebarCol {
                display: none !important;
                width: 0 !important;
            }
            html.smg-watched-feed .p-body-main--withSidebar,
            html.smg-watched-feed .p-body-main {
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
                grid-template-columns: none !important;
                gap: 0 !important;
            }
            html.smg-watched-feed .p-body-content,
            html.smg-watched-feed .p-body-contentCol,
            html.smg-watched-feed .p-body-pageContent {
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
                min-width: 0 !important;
                float: none !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
            }
            #smg-river { display: none; }
            html.smg-watched-feed #smg-river {
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
            }
            /* header do feed: título grande "Feed" + slot de ações (ícone de notices) à direita. Substitui a antiga tabbar. */
            .smg-river-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 26px 0 18px; padding: 0 0 14px; border-bottom: 1px solid var(--smg-bd, rgba(255,255,255,0.10)); }   /* margin-top 26px = respiro abaixo da topbar (casa com .p-body-header) */
            @media (max-width: 600px) { .smg-river-head { margin-top: 16px; } }
            .smg-river-title { margin: 0; padding: 0; font-size: 26px; font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; color: #fff; }
            .smg-river-head-actions { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
            .smg-fp-list { display: flex; flex-direction: column; gap: 14px; }
            .smg-fp-loading { position: relative; min-height: 120px; display: flex; align-items: center; justify-content: center; padding: 60px 0; }   /* position:relative → o .smg-loading (absolute/inset:0) centraliza AQUI, não na viewport */
            .smg-fp-empty { padding: 60px 16px; text-align: center; font-size: 14.5px; color: rgba(255,255,255,0.45); }
            /* 1ª configuração do feed (cache vazio): estado rico (spinner rosa + título + subtítulo) em vez de spinner mudo */
            .smg-fp-setup { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; padding: 76px 24px; text-align: center; }
            .smg-fp-setup-spin { width: 42px; height: 42px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.13); border-top-color: var(--smg-link, #ff77b2); animation: smg-spin 0.8s linear infinite; }
            .smg-fp-setup-title { font-size: 18px; font-weight: 800; letter-spacing: -0.01em; color: #fff; }
            .smg-fp-setup-sub { font-size: 13.5px; line-height: 1.45; color: rgba(255,255,255,0.5); max-width: 340px; font-variant-numeric: tabular-nums; }
            .smg-fp-setup-bar { width: 220px; max-width: 70vw; height: 5px; border-radius: 3px; background: rgba(255,255,255,0.1); overflow: hidden; }
            .smg-fp-setup-barfill { display: block; width: 0; height: 100%; border-radius: 3px; background: var(--smg-link, #ff77b2); transition: width .3s ease; }
            /* BOOKMARKS como feed (replace total da lista nativa): some a sidebar da conta + conteúdo a 100% (mata o layout de 2 colunas) */
            html.smg-bm-feed-on .p-body-sideNav,
            html.smg-bm-feed-on .p-body-sideNavCol { display: none !important; width: 0 !important; }
            html.smg-bm-feed-on .p-body-main--withSideNav,
            html.smg-bm-feed-on .p-body-main {
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
                grid-template-columns: none !important;
                gap: 0 !important;
            }
            html.smg-bm-feed-on .p-body-content,
            html.smg-bm-feed-on .p-body-contentCol,
            html.smg-bm-feed-on .p-body-pageContent {
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
                min-width: 0 !important;
                float: none !important;
                padding-left: 0 !important;
                margin: 0 !important;
            }
            #smg-bm-feed {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                margin-top: 14px !important;
            }
            #smg-bm-feed .smg-fp-list {
                width: 100% !important;
                max-width: 100% !important;
            }
            .smg-bm-remove { flex: 0 0 auto; width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; margin: -2px 0 0 0; border: 0; border-radius: 9px; background: transparent; color: rgba(255,255,255,0.45); cursor: pointer; transition: background .14s ease, color .14s ease, opacity .14s ease; }
            .smg-bm-remove:hover { background: rgba(244,63,94,0.14); color: #fb7185; }
            .smg-bm-remove svg { width: 18px; height: 18px; fill: none !important; }
            .smg-bm-remove.is-busy { opacity: 0.5; pointer-events: none; }
            .smg-fp-card.smg-bm-leaving { opacity: 0; transform: scale(0.97); transition: opacity .24s ease, transform .24s ease; }
            .smg-bm-note { margin: 0 0 10px; padding: 8px 12px; border-left: 3px solid var(--smg-link, #ff77b2); background: var(--smg-link-soft, rgba(255,119,178,0.10)); border-radius: 6px; font-size: 13.5px; line-height: 1.4; color: var(--smg-tx, #e7e7ea); }
            .smg-bm-skel { width: 100%; min-height: 180px; margin: 0 0 14px; border-radius: 12px; background: var(--smg-s2, rgba(255,255,255,0.05)); position: relative; overflow: hidden; }
            .smg-bm-skel::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent); animation: smg-skel-shimmer 1.3s ease-in-out infinite; }
            .smg-river-more { position: relative; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; min-height: 22px; margin: 6px 0 0; padding: 14px 0; border: 1px solid var(--smg-bd, rgba(255,255,255,0.1)); border-radius: 12px; background: var(--smg-s1, #16171b); color: rgba(255,255,255,0.72); font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: background .15s ease, color .15s ease; }
            .smg-river-more:hover { color: #fff; background: var(--smg-s2, rgba(255,255,255,0.06)); }
            .smg-river-more .smg-loading { position: static; inset: auto; display: none; }   /* dentro do botão o spinner é INLINE (não overlay), oculto até is-loading */
            .smg-river-more .smg-loading::after { width: 18px; height: 18px; border-width: 2px; }   /* menor: cabe no botão */
            .smg-river-more.is-loading { cursor: default; }
            .smg-river-more.is-loading .smg-loading { display: flex; }
            .smg-river-more.is-loading .smg-river-more-t { display: none; }
            /* pílula "N novos posts" (flutua no topo, estilo Twitter) */
            .smg-river-pill { position: fixed; top: 72px; left: 50%; transform: translateX(-50%); z-index: 60; display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px 8px 12px; border: 0; border-radius: 999px; background: var(--smg-link, #ff77b2); color: #fff; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 6px 20px rgba(0,0,0,0.45); }
            .smg-river-pill[hidden] { display: none; }
            .smg-river-pill:hover { filter: brightness(1.08); }
            .smg-river-pill svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
            /* card = mesmo visual do post (.smg-pc): coluna, surface s1, rounded 18, hover com sombra */
            .smg-feed-post,
            .smg-river-item,
            .smg-fp-card {
                content-visibility: auto !important;
                contain-intrinsic-size: 500px !important;
            }
            .smg-fp-card { background: var(--smg-s1, #16171b); border: 1px solid rgba(255,255,255,0.11); border-radius: 18px; overflow: hidden; transition: border-color .16s ease, box-shadow .16s ease; }
            .smg-fp-card:hover { border-color: rgba(255,255,255,0.22); box-shadow: 0 4px 18px rgba(0,0,0,0.35); }
            .smg-fp-card.is-unread { border-color: var(--smg-link, #ff77b2); }
            /* ENTRADA dos posts novos (insertFreshPosts): fade + slide + glow rosa que esvai → não "pisam do nada" */
            @keyframes smg-fp-in { from { opacity: 0; transform: translateY(-10px) scale(.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
            @keyframes smg-fp-glow { 0% { box-shadow: 0 0 0 1px var(--smg-link, #ff77b2), 0 6px 26px rgba(255,119,178,0.28); } 100% { box-shadow: 0 0 0 0 rgba(255,119,178,0); } }
            .smg-fp-card.smg-fp-enter { animation: smg-fp-in .42s cubic-bezier(.2,.7,.3,1) both, smg-fp-glow 1.2s ease-out; }
            @media (prefers-reduced-motion: reduce) { .smg-fp-card.smg-fp-enter { animation: none; } }
            html.smg-smg .smg-fp-card { --smg-s1: hsl(0 0% 12.5%); }   /* SMG: mesma superfície do SimpCity (igual o post card) */
            /* HEADER: [foto da thread]  ·  tags / nome do tópico / postado por — divisor border-b */
            .smg-fp-head { display: flex; align-items: flex-start; gap: 14px; padding: 16px 22px 14px; border-bottom: 1px solid var(--smg-bd, rgba(255,255,255,0.08)); }
            .smg-fp-thumb { flex: 0 0 auto; width: 54px; height: 54px; border-radius: 12px; overflow: hidden; background: rgba(255,255,255,0.06); display: block; }
            .smg-fp-thumb img { width: 100% !important; height: 100% !important; object-fit: cover; display: block; }
            .smg-fp-thumb--letter { display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; color: #fff; background: linear-gradient(135deg, #7c5cff, #c54b8c); }   /* sem thumb / .su morto → inicial do tópico */
            .smg-fp-meta { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
            .smg-fp-tags { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
            .smg-fp-tags:empty { display: none; }
            .smg-fp-tags > * { font-size: 11px !important; line-height: 1; vertical-align: middle; }   /* prefixo = chip (mantém a cor nativa do label, injetado via innerHTML) */
            .smg-fp-tname { font-size: 15.5px; font-weight: 700; color: #fff; text-decoration: none; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .smg-fp-tname:hover { text-decoration: underline; }
            .smg-fp-by { font-size: 12.5px; color: rgba(255,255,255,0.45); }
            .smg-fp-share { flex: 0 0 auto; width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; margin: -2px -6px 0 4px; border: 0; border-radius: 9px; background: transparent; color: rgba(255,255,255,0.45); cursor: pointer; transition: background .14s ease, color .14s ease; }
            .smg-fp-share:hover { background: var(--smg-link-soft, rgba(255,255,255,0.1)); color: #fff; }
            .smg-fp-share.is-done { color: var(--smg-link, #ff77b2); }
            .smg-fp-share svg { width: 17px; height: 17px; fill: none !important; }
            .smg-fp-byname { color: rgba(255,255,255,0.7); font-weight: 600; text-decoration: none; }
            .smg-fp-byname:hover { color: #fff; text-decoration: underline; }
            .smg-fp-dot { color: rgba(255,255,255,0.3); }
            .smg-fp-time { white-space: nowrap; }
            /* CONTEÚDO: full-width, sem caixa escura, texto 15px (= .smg-pc .message-content) */
            .smg-fp-content { padding: 16px 22px 10px; font-size: 15px; line-height: 1.55; color: rgba(255,255,255,0.9); word-break: break-word; }
            .smg-fp-content--empty { padding: 16px 22px; color: rgba(255,255,255,0.4); font-style: italic; }
            .smg-fp-content img { max-width: 100% !important; height: auto; border-radius: 8px; }
            html.smg-masonry-on .smg-fp-content .auto-image-grid {
                display: grid !important;
                grid-template-columns: repeat(var(--smg-mcols, 3), minmax(0, 1fr)) !important;
                grid-auto-flow: row !important;
                grid-auto-rows: auto !important;
                gap: 8px !important;
                align-items: start !important;
                justify-items: center !important;
                margin: 10px 0 !important;
                max-width: 100% !important;
                text-align: center !important;
            }
            html.smg-masonry-on .smg-fp-content .auto-image-grid.smg-grid-orphan > :last-child { grid-column: 2; }
            html.smg-masonry-on .smg-fp-content .auto-image-grid > * {
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                display: block;
            }
            .smg-fp-content .auto-image-grid img.bbImage,
            .smg-fp-content .auto-image-grid img {
                border-radius: 8px !important;
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
            .smg-fp-cloading { display: flex; align-items: center; justify-content: center; padding: 24px 0; }
            /* FOOTER: "abrir no tópico" com divisor em cima (= action bar do post) */
            .smg-fp-open { display: flex; align-items: center; gap: 6px; margin: 6px 0 0; padding: 12px 22px 14px; border-top: 1px solid var(--smg-bd, rgba(255,255,255,0.07)); font-size: 13px; font-weight: 600; text-decoration: none; color: var(--smg-link, #ff77b2); transition: gap .14s ease; }
            .smg-fp-open:hover { gap: 10px; }
            .smg-fp-open svg { width: 15px; height: 15px; fill: none; }
            @media (max-width: 600px) {
                .smg-fp-card { border-radius: 14px; }
                .smg-fp-head { padding: 13px 16px 11px; }
                .smg-fp-content { padding: 14px 16px 8px; }
                .smg-fp-open { padding: 11px 16px 13px; }
                .smg-river-title { font-size: 22px; }
            }

            /* ===== Componente: Dropdown Multiselect de Badges ===== */
            .smg-multiselect-container { position: relative; display: inline-flex; }
            .smg-lf-row .smg-multiselect-container { width: 100%; display: flex; flex-direction: column; }
            .smg-multiselect-btn {
                display: inline-flex; align-items: center; gap: 7px; height: 36px; padding: 0 12px;
                background: var(--smg-s1, #1e1e24); border: 1px solid var(--smg-bd, rgba(255,255,255,0.12));
                border-radius: 9px; color: rgba(255,255,255,0.85); font-size: 13px; font-weight: 600;
                cursor: pointer; transition: all .15s ease; box-sizing: border-box;
            }
            .smg-lf-row .smg-multiselect-btn { width: 100%; justify-content: space-between; }
            .smg-multiselect-btn:hover { background: var(--smg-s2, #282830); border-color: var(--smg-bd2, rgba(255,255,255,0.2)); color: #fff; }
            .smg-multiselect-btn.is-open { border-color: var(--smg-link, #ff77b2); background: var(--smg-s2, #282830); color: #fff; }
            .smg-multiselect-btn.has-active { border-color: var(--smg-link, #ff77b2); }
            .smg-multiselect-btn-icon { display: inline-flex; align-items: center; justify-content: center; }
            .smg-multiselect-btn-icon svg { width: 14px; height: 14px; fill: none; stroke: currentColor; }
            .smg-multiselect-btn-badge {
                display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px;
                padding: 0 5px; border-radius: 999px; background: var(--smg-link, #ff77b2); color: #fff;
                font-size: 11px; font-weight: 700; line-height: 1;
            }
            .smg-multiselect-btn-arrow { margin-left: auto; display: inline-flex; align-items: center; }
            .smg-multiselect-btn-arrow svg { width: 12px; height: 12px; fill: none; stroke: currentColor; transition: transform .18s ease; }
            .smg-multiselect-btn.is-open .smg-multiselect-btn-arrow svg { transform: rotate(180deg); }

            .smg-multiselect-pop {
                position: absolute; top: calc(100% + 6px); left: 0; z-index: 9999999 !important; width: 340px; max-width: 90vw;
                max-height: 480px; display: flex; flex-direction: column; background: var(--smg-s1, #18181c);
                border: 1px solid var(--smg-bd2, rgba(255,255,255,0.18)); border-radius: 14px;
                box-shadow: 0 12px 36px rgba(0,0,0,0.65); overflow: hidden;
            }
            .smg-lf-row .smg-multiselect-pop { width: 100%; max-width: 100%; box-sizing: border-box; }
            .smg-multiselect-pop[hidden] { display: none !important; }
            .smg-multiselect-search-wrap {
                display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--smg-bd, rgba(255,255,255,0.08));
            }
            .smg-multiselect-search-icon { display: inline-flex; color: rgba(255,255,255,0.4); }
            .smg-multiselect-search-icon svg { width: 15px; height: 15px; fill: none; stroke: currentColor; }
            .smg-multiselect-search {
                flex: 1 1 auto; background: transparent; border: 0; outline: 0; color: #fff; font-size: 13px;
            }
            .smg-multiselect-search::placeholder { color: rgba(255,255,255,0.35); }
            .smg-multiselect-clear-search {
                background: transparent; border: 0; color: rgba(255,255,255,0.4); cursor: pointer; font-size: 12px; padding: 2px 4px; border-radius: 4px;
            }
            .smg-multiselect-clear-search:hover { color: #fff; background: rgba(255,255,255,0.1); }
            .smg-multiselect-clear-search[hidden] { display: none !important; }

            .smg-multiselect-pills-bar {
                display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 6px 12px;
                background: rgba(0,0,0,0.25); border-bottom: 1px solid var(--smg-bd, rgba(255,255,255,0.06));
            }
            .smg-multiselect-pills-bar[hidden] { display: none !important; }
            .smg-multiselect-pills { display: flex; flex-wrap: wrap; gap: 4px; max-height: 70px; overflow-y: auto; }
            .smg-multiselect-pill {
                display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 999px;
                background: var(--smg-link-soft, rgba(255,119,178,0.18)); border: 1px solid var(--smg-link, #ff77b2);
                color: #fff; font-size: 11px; font-weight: 600;
            }
            .smg-multiselect-pill-del {
                background: transparent; border: 0; padding: 0; color: rgba(255,255,255,0.6); cursor: pointer; font-size: 10px; line-height: 1;
            }
            .smg-multiselect-pill-del:hover { color: #fff; }
            .smg-multiselect-clear-all {
                flex: 0 0 auto; background: transparent; border: 0; color: var(--smg-link, #ff77b2); font-size: 11.5px; font-weight: 700; cursor: pointer; padding: 2px 4px;
            }
            .smg-multiselect-clear-all:hover { text-decoration: underline; }

            .smg-multiselect-list { flex: 1 1 auto; overflow-y: auto; padding: 6px 0; }
            .smg-multiselect-group { border-bottom: 1px solid rgba(255,255,255,0.04); }
            .smg-multiselect-group:last-child { border-bottom: 0; }
            .smg-multiselect-group-header {
                display: flex; align-items: center; justify-content: space-between; padding: 7px 12px; cursor: pointer; user-select: none;
            }
            .smg-multiselect-group-header:hover { background: rgba(255,255,255,0.04); }
            .smg-multiselect-group-title { font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: rgba(255,255,255,0.5); }
            .smg-multiselect-group-count { font-size: 10.5px; font-weight: 600; color: rgba(255,255,255,0.3); }
            .smg-multiselect-group.is-collapsed .smg-multiselect-group-items { display: none; }
            .smg-multiselect-group-items { display: flex; flex-direction: column; padding: 2px 0; }

            .smg-multiselect-item {
                display: flex; align-items: center; gap: 8px; padding: 5px 12px; cursor: pointer; transition: background .1s ease;
            }
            .smg-multiselect-item:hover { background: rgba(255,255,255,0.06); }
            .smg-multiselect-item.is-checked { background: var(--smg-link-soft, rgba(255,119,178,0.12)); }
            .smg-multiselect-item input[type="checkbox"] {
                accent-color: var(--smg-link, #ff77b2); width: 14px; height: 14px; margin: 0; cursor: pointer;
            }
            .smg-multiselect-item .smg-badge-chip { font-size: 10px !important; padding: 1.5px 5.5px !important; border-radius: 4px !important; }
            .smg-multiselect-item-count { margin-left: auto; font-size: 11px; color: rgba(255,255,255,0.35); }
            .smg-multiselect-group-count,
            .smg-multiselect-item-count {
                display: none !important;
            }
            .smg-multiselect-empty { padding: 24px; text-align: center; color: rgba(255,255,255,0.4); font-size: 13px; }

            /* ===== Paginação em /watched/threads (gerenciada via scroll infinito) ===== */
            html.smg-threadlist[data-template*="watched_threads"] .pageNavWrapper,
            html.smg-threadlist[data-template*="watched_threads"] .pageNav,
            html.smg-threadlist[data-template*="watched_threads"] .block-outer--after,
            html.smg-threadlist[data-template*="watched_threads"] .block-outer--top,
            .smg-watched-local-root ~ .pageNavWrapper,
            .smg-watched-local-root ~ .pageNav,
            .smg-watched-local-root ~ .block-outer {
                display: none !important;
            }
            .smg-watched-local-root { display: flex; flex-direction: column; gap: 14px; width: 100%; margin-top: 10px; }

            /* GRID VIEW IDÊNTICO AO NATIVO (5-6 colunas, thumb 1:1) */
            html.smg-tv-grid .smg-watched-grid,
            .smg-watched-grid.smg-watched-view--grid {
                display: grid !important;
                grid-template-columns: repeat(auto-fill, minmax(max(170px, calc((100% - 56px) / 5)), 1fr)) !important;
                gap: 14px !important;
                padding: 0 !important;
                align-items: start !important;
            }
            html.smg-tv-grid .smg-watched-grid .smg-watched-card,
            .smg-watched-grid.smg-watched-view--grid .smg-watched-card {
                display: flex !important;
                flex-direction: column !important;
                align-items: stretch !important;
                gap: 0 !important;
                padding: 0 !important;
                border: 1px solid rgba(127,127,127,0.18) !important;
                border-radius: 12px !important;
                overflow: hidden !important;
                background: rgba(127,127,127,0.06) !important;
                position: relative !important;
                transition: border-color .14s ease, transform .14s ease, box-shadow .14s ease !important;
                content-visibility: auto;
                contain-intrinsic-size: auto 320px;
            }
            html.smg-tv-grid .smg-watched-grid .smg-watched-card:hover,
            .smg-watched-grid.smg-watched-view--grid .smg-watched-card:hover {
                border-color: var(--smg-bd2, rgba(255,255,255,0.22)) !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important;
            }
            html.smg-tv-grid .smg-watched-grid .smg-watched-card-thumb,
            .smg-watched-grid.smg-watched-view--grid .smg-watched-card-thumb {
                width: 100% !important;
                aspect-ratio: 1 / 1 !important;
                height: auto !important;
                overflow: hidden !important;
                background: rgba(255,255,255,0.04) !important;
                position: relative !important;
                border-radius: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                flex: 0 0 auto !important;
            }
            html.smg-tv-grid .smg-watched-grid .smg-watched-card-thumb img,
            .smg-watched-grid.smg-watched-view--grid .smg-watched-card-thumb img {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                border-radius: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                display: block !important;
            }
            html.smg-tv-grid .smg-watched-grid .smg-watched-card-thumb.smg-thumb-letter,
            .smg-watched-grid.smg-watched-view--grid .smg-watched-card-thumb.smg-thumb-letter {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 38px !important;
                font-weight: 800 !important;
                color: rgba(255,255,255,0.25) !important;
                background: radial-gradient(circle at 50% 40%, var(--smg-s3), var(--smg-s1)) !important;
            }
            html.smg-tv-grid .smg-watched-grid .smg-watched-card-body,
            .smg-watched-grid.smg-watched-view--grid .smg-watched-card-body {
                width: 100% !important;
                box-sizing: border-box !important;
                padding: 8px 12px 12px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 0 !important;
                flex: 1 1 auto !important;
            }
            /* Row 1 & Row 2: Badges no topo, Título abaixo */
            .smg-watched-card-title-wrap {
                display: flex !important;
                flex-direction: column !important;
                align-items: flex-start !important;
                gap: 0 !important;
                font-size: 14.5px !important;
                font-weight: 700 !important;
                line-height: 1.3 !important;
            }
            .smg-watched-card-badges,
            .smg-watched-card-tags {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 4px !important;
                align-items: center !important;
                margin-bottom: 5px !important;
            }
            .smg-watched-card-badges .label,
            .smg-watched-card-tags .label,
            .smg-watched-card .label {
                font-size: 9.5px !important;
                padding: 1.5px 5.5px !important;
                border-radius: 4px !important;
                line-height: 1.2 !important;
            }
            .smg-watched-card-title {
                font-size: 14.5px !important;
                font-weight: 700 !important;
                color: #fff !important;
                text-decoration: none !important;
                word-break: break-word !important;
                line-height: 1.3 !important;
            }
            .smg-watched-card-title:hover {
                text-decoration: underline !important;
                color: var(--smg-link, #ff77b2) !important;
            }
            /* Row 3: Data (Sem autor, sem nome de fórum) */
            .smg-watched-card-meta,
            .smg-watched-card-date {
                display: flex !important;
                align-items: center !important;
                font-size: 11.5px !important;
                color: rgba(255,255,255,0.45) !important;
                margin-top: 4px !important;
            }
            .smg-watched-card-time {
                color: rgba(255,255,255,0.45) !important;
                font-size: 11.5px !important;
                font-weight: 500 !important;
            }
            /* Row 4: Paginação */
            .smg-watched-card-page-jump {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 3px !important;
                margin-top: 6px !important;
            }
            .smg-watched-card-page-num {
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
                transition: all .12s ease !important;
            }
            .smg-watched-card-page-num:hover {
                background: var(--smg-link, #ff77b2) !important;
                color: #000 !important;
            }
            .smg-watched-card-unwatch {
                position: absolute !important;
                top: 6px !important;
                right: 6px !important;
                z-index: 2 !important;
                width: 28px !important;
                height: 28px !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                background: rgba(0,0,0,0.6) !important;
                border: 0 !important;
                border-radius: 8px !important;
                color: rgba(255,255,255,0.7) !important;
                cursor: pointer !important;
                opacity: 0 !important;
                transition: opacity .14s ease, background .14s ease, color .14s ease !important;
            }
            .smg-watched-card:hover .smg-watched-card-unwatch {
                opacity: 1 !important;
            }
            .smg-watched-card-unwatch:hover {
                background: rgba(244,63,94,0.85) !important;
                color: #fff !important;
            }

            /* MODO LISTA */
            html:not(.smg-tv-grid) .smg-watched-grid,
            .smg-watched-grid.smg-watched-view--list {
                display: flex !important;
                flex-direction: column !important;
                gap: 10px !important;
            }
            html:not(.smg-tv-grid) .smg-watched-grid .smg-watched-card,
            .smg-watched-grid.smg-watched-view--list .smg-watched-card {
                display: flex !important;
                flex-direction: row !important;
                align-items: stretch !important;
                padding: 0 !important;
                gap: 0 !important;
                background: rgba(127,127,127,0.06) !important;
                border: 1px solid rgba(127,127,127,0.18) !important;
                border-radius: 10px !important;
                overflow: hidden !important;
                contain-intrinsic-size: auto 112px !important;
            }
            html:not(.smg-tv-grid) .smg-watched-grid .smg-watched-card-thumb,
            .smg-watched-grid.smg-watched-view--list .smg-watched-card-thumb {
                flex: 0 0 210px !important;
                width: 210px !important;
                height: 132px !important;
                aspect-ratio: auto !important;
            }
            @media (max-width: 600px) {
                html:not(.smg-tv-grid) .smg-watched-grid .smg-watched-card-thumb,
                .smg-watched-grid.smg-watched-view--list .smg-watched-card-thumb {
                    flex: 0 0 92px !important;
                    width: 92px !important;
                    height: 70px !important;
                }
            }
            html:not(.smg-tv-grid) .smg-watched-grid .smg-watched-card-body,
            .smg-watched-grid.smg-watched-view--list .smg-watched-card-body {
                flex: 1 1 auto !important;
                padding: 10px 16px !important;
                justify-content: center !important;
            }
            .smg-watched-empty { grid-column: 1 / -1; padding: 60px 16px; text-align: center; font-size: 14px; color: rgba(255,255,255,0.45); }
        `;
