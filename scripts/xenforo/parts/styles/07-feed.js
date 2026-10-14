    // STYLE CONTEXT: Timeline and bookmark feed
    const CSS_FEED = `/* ============ river de posts (modo Feed da /watched/threads) ============ */
            /* modo feed: o JS marca .smg-river-hide nos irmãos do river (lista nativa + filtro + paginação) → robusto, independe da classe do bloco do tema */
            .smg-river-hide { display: none !important; }
            html.smg-watched-feed .structItemContainer { display: none !important; }   /* flash-kill: a lista some já no document-start, antes do JS rodar (no-op na home) */
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
            /* Timeline view: hide old homepage / native categories, notices, headers, and sibling blocks */
            html.smg-watched-feed .block--category,
            html.smg-watched-feed .uix_nodeList,
            html.smg-watched-feed .node-list,
            html.smg-watched-feed .p-body-header,
            html.smg-watched-feed .notices--block,
            html.smg-watched-feed .block:not(#smg-river),
            html.smg-page-timeline .block--category,
            html.smg-page-timeline .uix_nodeList,
            html.smg-page-timeline .node-list,
            html.smg-page-timeline .p-body-header,
            html.smg-page-timeline .notices--block,
            html.smg-page-timeline .block:not(#smg-river) {
                display: none !important;
            }

            html.smg-watched-feed .p-body-pageContent > *:not(#smg-river),
            html.smg-watched-feed .p-body-content > *:not(.p-body-pageContent):not(#smg-river),
            html.smg-page-timeline .p-body-pageContent > *:not(#smg-river):not(.smg-page-skeleton),
            html.smg-page-timeline .p-body-content > *:not(.p-body-pageContent):not(#smg-river):not(.smg-page-skeleton) {
                display: none !important;
            }
            #smg-river { display: none; }
            html.smg-watched-feed #smg-river,
            html.smg-page-timeline #smg-river {
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
            }
            /* header do feed: título grande "Feed" + slot de ações (ícone de notices) à direita. Substitui a antiga tabbar. */
            .smg-river-head { display: flex; align-items: center; justify-content: space-between; gap: var(--smg-sp-12); margin: var(--smg-sp-28) 0 var(--smg-sp-18); padding: 0 0 var(--smg-sp-14); border-bottom: 1px solid var(--smg-bd); }   /* margin-top 26px = respiro abaixo da topbar (casa com .p-body-header) */
            .smg-river-title { margin: 0; padding: 0; font-size: var(--smg-fs-28); font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; color: #fff; }
            .smg-river-head-actions { display: flex; align-items: center; gap: var(--smg-sp-8); flex: 0 0 auto; }
            .smg-fp-empty { padding: 60px var(--smg-sp-16); text-align: center; font-size: var(--smg-fs-15); color: var(--smg-w-50); }
            /* 1ª configuração do feed (cache vazio): estado rico (spinner rosa + título + subtítulo) em vez de spinner mudo */
            .smg-fp-setup { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--smg-sp-18); min-height: 72vh; padding: 64px var(--smg-sp-28); text-align: center; }
            .smg-fp-setup-spin { width: 64px; height: 64px; border-radius: var(--smg-r-round); border: 4px solid var(--smg-w-12); border-top-color: var(--smg-w-72); animation: smg-spin 0.8s linear infinite; }
            .smg-fp-setup-title { font-size: var(--smg-fs-32); font-weight: 800; letter-spacing: -0.03em; color: #fff; }
            .smg-fp-setup-sub { font-size: var(--smg-fs-16); line-height: 1.45; color: var(--smg-w-60); max-width: 520px; font-variant-numeric: tabular-nums; }
            .smg-fp-setup-detail { min-height: 1.4em; font-size: var(--smg-fs-14); line-height: 1.4; color: var(--smg-w-40); max-width: 560px; }
            .smg-fp-setup-bar { width: min(460px, 78vw); height: 6px; border-radius: var(--smg-r-pill); background: var(--smg-w-10); overflow: hidden; }
            .smg-fp-list { display: flex; flex-direction: column; gap: var(--smg-sp-24); }
            .smg-fp-card { margin: 0; }
            .smg-fp-setup-barfill { display: block; width: 0; height: 100%; border-radius: var(--smg-r-4); background: var(--smg-link); transition: width var(--smg-dur-30) ease; }
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
            html.smg-bm-feed-on .p-body-header,
            html.smg-bm-feed-on .p-title,
            html.smg-bm-feed-on .p-description,
            html.smg-bm-feed-on .notices,
            html.smg-bm-feed-on .notices--block,
            html.smg-bm-feed-on .block:not(#smg-bm-feed) {
                display: none !important;
            }
            html.smg-bm-feed-on .p-body-pageContent > *:not(#smg-bm-feed),
            html.smg-bm-feed-on .p-body-content > *:not(.p-body-pageContent):not(#smg-bm-feed) {
                display: none !important;
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
                padding-right: 0 !important;
                margin: 0 !important;
            }
            #smg-bm-feed {
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
            }
            #smg-bm-feed .smg-fp-list {
                width: 100% !important;
                max-width: 100% !important;
            }
            .smg-bm-remove { flex: 0 0 auto; width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; margin: -2px 0 0 0; border: 0; border-radius: var(--smg-r-10); background: transparent; color: var(--smg-w-50); cursor: pointer; transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease, opacity var(--smg-dur-15) ease; }
            .smg-bm-remove:hover { background: rgba(244,63,94,0.14); color: #fb7185; }
            .smg-bm-remove svg { width: 18px; height: 18px; fill: none !important; }
            .smg-bm-remove.is-busy { opacity: 0.5; pointer-events: none; }
            .smg-fp-card.smg-bm-leaving { opacity: 0; transform: scale(0.97); transition: opacity var(--smg-dur-20) ease, transform var(--smg-dur-20) ease; }
            .smg-bm-note { margin: 0 0 var(--smg-sp-10); padding: var(--smg-sp-8) var(--smg-sp-12); border-left: 3px solid var(--smg-link); background: var(--smg-link-soft); border-radius: var(--smg-r-6); font-size: var(--smg-fs-14); line-height: 1.4; color: var(--smg-tx); }
            .smg-bm-skel { width: 100%; min-height: 180px; margin: 0 0 var(--smg-sp-14); border-radius: var(--smg-r-12); background: var(--smg-s2); position: relative; overflow: hidden; }
            .smg-river-more { position: relative; display: flex; align-items: center; justify-content: center; gap: var(--smg-sp-8); width: 100%; min-height: 22px; margin: var(--smg-sp-6) 0 0; padding: var(--smg-sp-14) 0; border: 1px solid var(--smg-bd); border-radius: var(--smg-r-12); background: var(--smg-s1); color: var(--smg-w-72); font: inherit; font-size: var(--smg-fs-14); font-weight: 600; cursor: pointer; transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease; }
            .smg-river-more:hover { color: #fff; background: var(--smg-s2); }
            .smg-river-more .smg-loading { position: static; inset: auto; display: none; }   /* dentro do botão o spinner é INLINE (não overlay), oculto até is-loading */
            .smg-river-more .smg-loading::after { width: 18px; height: 18px; border-width: 2px; }   /* menor: cabe no botão */
            .smg-river-more.is-loading { cursor: default; }
            .smg-river-more.is-loading .smg-loading { display: flex; }
            .smg-river-more.is-loading .smg-river-more-t { display: none; }
            /* pílula "N novos posts" (flutua no topo, estilo Twitter) */
            .smg-river-pill { position: fixed; top: 72px; left: 50%; transform: translateX(-50%); z-index: var(--smg-z-60); display: inline-flex; align-items: center; gap: var(--smg-sp-6); padding: var(--smg-sp-8) var(--smg-sp-16) var(--smg-sp-8) var(--smg-sp-12); border: 0; border-radius: var(--smg-chip-r); background: var(--smg-link); color: #fff; font: inherit; font-size: var(--smg-fs-13); font-weight: 700; cursor: pointer; box-shadow: var(--smg-shadow-2); }
            .smg-river-pill[hidden] { display: none; }
            .smg-river-pill:hover { filter: brightness(1.08); }
            .smg-river-pill svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
            /* card do Feed/Salvos = a pele do post (.smg-pc, em css-post-cards); aqui só o que é do feed */
            .smg-fp-card {
                content-visibility: auto !important;
                contain-intrinsic-size: 500px !important;
                overflow: hidden;
            }
            @keyframes smg-fp-in { from { opacity: 0; transform: translateY(-10px) scale(.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
            @keyframes smg-fp-glow { 0% { box-shadow: 0 0 0 1px var(--smg-w-18); } 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); } }
            .smg-fp-card.smg-fp-enter { animation: smg-fp-in .42s cubic-bezier(.2,.7,.3,1) both, smg-fp-glow 1.2s ease-out; }
            @media (prefers-reduced-motion: reduce) { .smg-fp-card.smg-fp-enter { animation: none; } }
            /* HEADER: [foto da thread]  ·  tags / nome do tópico / postado por — divisor border-b */
            .smg-fp-thumb { flex: 0 0 auto; width: 54px; height: 54px; border-radius: var(--smg-r-12); overflow: hidden; background: var(--smg-w-06); display: block; }
            .smg-fp-thumb img { width: 100% !important; height: 100% !important; object-fit: cover; display: block; }
            .smg-fp-tags { display: flex; flex-wrap: wrap; gap: var(--smg-sp-6); align-items: center; }
            .smg-fp-tags > * { font-size: var(--smg-fs-11) !important; line-height: 1; vertical-align: middle; }   /* prefixo = chip (mantém a cor nativa do label, injetado via innerHTML) */
            .smg-fp-tname { font-size: var(--smg-fs-16); font-weight: 700; color: #fff; text-decoration: none; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .smg-fp-tname:hover { text-decoration: underline; }
            .smg-fp-share { flex: 0 0 auto; width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; margin: -2px -6px 0 var(--smg-sp-4); border: 0; border-radius: var(--smg-r-10); background: transparent; color: var(--smg-w-50); cursor: pointer; transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease; }
            .smg-fp-share:hover { background: var(--smg-link-soft); color: #fff; }
            .smg-fp-share.is-done { color: var(--smg-link); }
            .smg-fp-share svg { width: 17px; height: 17px; fill: none !important; }
            .smg-fp-byname { color: var(--smg-w-72); font-weight: 600; text-decoration: none; }
            .smg-fp-byname:hover { color: #fff; text-decoration: underline; }
            .smg-fp-time { white-space: nowrap; }
            /* CONTEÚDO: full-width, sem caixa escura, texto 15px (= .smg-pc .message-content) */
            .smg-fp-content { color: var(--smg-w-95); word-break: break-word; }
            /* Não forçar display: o card de file-host esconde o unfurl nativo
               com style inline. display:block !important trazia a URL e o preview
               de volta, duplicados em cima do nosso card. */
            .smg-fp-content .bbCodeBlock--unfurl .contentRow {
                display: flex !important;
                align-items: flex-start !important;
                height: auto !important;
                max-height: none !important;
                overflow: visible !important;
                white-space: normal !important;
            }
            .smg-fp-content .bbCodeBlock--unfurl .contentRow-main,
            .smg-fp-content .bbCodeBlock--unfurl .contentRow-header,
            .smg-fp-content .bbCodeBlock--unfurl .contentRow-snippet {
                height: auto !important;
                max-height: none !important;
                overflow: visible !important;
                white-space: normal !important;
            }
            .smg-fp-content .bbCodeBlock--unfurl:has(~ .smg-fhcard),
            .smg-fp-content a.link--external:has(+ .smg-fhcard),
            .smg-fp-content a.link--external:has(+ .bbCodeBlock--unfurl + .smg-fhcard) {
                display: none !important;
            }
            .smg-fp-content img { max-width: 100% !important; height: auto; border-radius: var(--smg-r-8); }
            .smg-fp-content iframe {
                width: 100% !important;
                max-width: 100% !important;
                aspect-ratio: 16 / 9 !important;
                height: auto !important;
                border: none !important;
                border-radius: var(--smg-r-8) !important;
                display: block !important;
            }
            /* FOOTER: "abrir no tópico" com divisor em cima (= action bar do post) */
            .smg-fp-open { display: flex; align-items: center; gap: var(--smg-sp-6); margin: var(--smg-sp-6) 0 0; padding: var(--smg-sp-12) var(--smg-sp-24) var(--smg-sp-14); border-top: 1px solid var(--smg-bd); font-size: var(--smg-fs-13); font-weight: 600; text-decoration: none; color: var(--smg-link); transition: gap var(--smg-dur-15) ease; }
            .smg-fp-open:hover { gap: var(--smg-sp-10); }
            .smg-fp-open svg { width: 15px; height: 15px; fill: none; }
            @media (max-width: 600px) { .smg-river-head { margin-top: var(--smg-sp-16); }
                .smg-fp-card { border-radius: var(--smg-card-r); }
                .smg-fp-head { padding: var(--smg-sp-14) var(--smg-sp-16) var(--smg-sp-12); }
                .smg-fp-content { padding: var(--smg-sp-14) var(--smg-sp-16) var(--smg-sp-8); }
                .smg-fp-open { padding: var(--smg-sp-12) var(--smg-sp-16) var(--smg-sp-14); }
                .smg-river-title { font-size: var(--smg-fs-22); }
            }

            /* ===== Componente: Dropdown Multiselect de Badges ===== */
            .smg-multiselect-container { position: relative; display: inline-flex; }
            .smg-lf-row .smg-multiselect-container { width: 100%; display: flex; flex-direction: column; }
            .smg-multiselect-btn {
                display: inline-flex; align-items: center; gap: var(--smg-sp-8); height: 36px; padding: 0 var(--smg-sp-12);
                background: var(--smg-s1); border: 1px solid var(--smg-bd);
                border-radius: var(--smg-input-r); color: var(--smg-w-85); font-size: var(--smg-fs-13); font-weight: 600;
                cursor: pointer; transition: all var(--smg-dur-15) ease; box-sizing: border-box;
            }
            .smg-lf-row .smg-multiselect-btn { width: 100%; justify-content: space-between; }
            .smg-multiselect-btn:hover { background: var(--smg-s2); border-color: var(--smg-bd2); color: #fff; }
            .smg-multiselect-btn.is-open { border-color: var(--smg-link); background: var(--smg-s2); color: #fff; }
            .smg-multiselect-btn.has-active { border-color: var(--smg-link); }
            .smg-multiselect-btn-icon { display: inline-flex; align-items: center; justify-content: center; }
            .smg-multiselect-btn-icon svg { width: 14px; height: 14px; fill: none; stroke: currentColor; }
            .smg-multiselect-btn-badge {
                display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px;
                padding: 0 var(--smg-sp-6); border-radius: var(--smg-badge-r); background: var(--smg-link); color: #fff;
                font-size: var(--smg-fs-11); font-weight: 700; line-height: 1;
            }
            .smg-multiselect-btn-arrow { margin-left: auto; display: inline-flex; align-items: center; }
            .smg-multiselect-btn-arrow svg { width: 12px; height: 12px; fill: none; stroke: currentColor; transition: transform var(--smg-dur-20) ease; }
            .smg-multiselect-btn.is-open .smg-multiselect-btn-arrow svg { transform: rotate(180deg); }

            .smg-multiselect-pop {
                position: absolute; top: calc(100% + 6px); left: 0; z-index: var(--smg-z-sheet-top) !important; width: 340px; max-width: 90vw;
                max-height: 480px; display: flex; flex-direction: column; background: var(--smg-s1);
                border: 1px solid var(--smg-bd2); border-radius: var(--smg-pop-r);
                box-shadow: var(--smg-pop-shadow); overflow: hidden;
            }
            .smg-lf-row .smg-multiselect-pop { width: 100%; max-width: 100%; box-sizing: border-box; }
            .smg-multiselect-pop[hidden] { display: none !important; }
            .smg-multiselect-search-wrap {
                display: flex; align-items: center; gap: var(--smg-sp-8); padding: var(--smg-sp-10) var(--smg-sp-12); border-bottom: 1px solid var(--smg-bd);
            }
            .smg-multiselect-search-icon { display: inline-flex; color: var(--smg-w-40); }
            .smg-multiselect-search-icon svg { width: 15px; height: 15px; fill: none; stroke: currentColor; }
            .smg-multiselect-search {
                flex: 1 1 auto; background: transparent; border: 0; outline: 0; color: #fff; font-size: var(--smg-fs-13);
            }
            .smg-multiselect-search::placeholder { color: var(--smg-w-40); }
            .smg-multiselect-clear-search {
                background: transparent; border: 0; color: var(--smg-w-40); cursor: pointer; font-size: var(--smg-fs-12); padding: var(--smg-sp-2) var(--smg-sp-4); border-radius: var(--smg-r-4);
            }
            .smg-multiselect-clear-search:hover { color: #fff; background: var(--smg-w-10); }
            .smg-multiselect-clear-search[hidden] { display: none !important; }

            .smg-multiselect-pills-bar {
                display: flex; align-items: center; justify-content: space-between; gap: var(--smg-sp-6); padding: var(--smg-sp-6) var(--smg-sp-12);
                background: var(--smg-k-25); border-bottom: 1px solid var(--smg-bd);
            }
            .smg-multiselect-pills-bar[hidden] { display: none !important; }
            .smg-multiselect-pills { display: flex; flex-wrap: wrap; gap: var(--smg-sp-4); max-height: 70px; overflow-y: auto; }
            .smg-multiselect-pill {
                display: inline-flex; align-items: center; gap: var(--smg-sp-4); padding: var(--smg-sp-2) var(--smg-sp-8); border-radius: var(--smg-chip-r);
                background: var(--smg-link-soft); border: 1px solid var(--smg-link);
                color: #fff; font-size: var(--smg-fs-11); font-weight: 600;
            }
            .smg-multiselect-pill-del {
                background: transparent; border: 0; padding: 0; color: var(--smg-w-60); cursor: pointer; font-size: var(--smg-fs-10); line-height: 1;
            }
            .smg-multiselect-pill-del:hover { color: #fff; }
            .smg-multiselect-clear-all {
                flex: 0 0 auto; background: transparent; border: 0; color: var(--smg-link); font-size: var(--smg-fs-12); font-weight: 700; cursor: pointer; padding: var(--smg-sp-2) var(--smg-sp-4);
            }
            .smg-multiselect-clear-all:hover { text-decoration: underline; }

            .smg-multiselect-list { flex: 1 1 auto; overflow-y: auto; padding: var(--smg-sp-6) 0; }
            .smg-multiselect-group { border-bottom: 1px solid var(--smg-w-04); }
            .smg-multiselect-group:last-child { border-bottom: 0; }
            .smg-multiselect-group-header {
                display: flex; align-items: center; justify-content: space-between; padding: var(--smg-sp-8) var(--smg-sp-12); cursor: pointer; user-select: none;
            }
            .smg-multiselect-group-header:hover { background: var(--smg-w-04); }
            .smg-multiselect-group-title { font-size: var(--smg-fs-12); font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--smg-w-50); }
            .smg-multiselect-group.is-collapsed .smg-multiselect-group-items { display: none; }
            .smg-multiselect-group-items { display: flex; flex-direction: column; padding: var(--smg-sp-2) 0; }

            .smg-multiselect-item {
                display: flex; align-items: center; gap: var(--smg-sp-8); padding: var(--smg-sp-6) var(--smg-sp-12); cursor: pointer; transition: background var(--smg-dur-12) ease;
            }
            .smg-multiselect-item:hover { background: var(--smg-w-06); }
            .smg-multiselect-item.is-checked { background: var(--smg-link-soft); }
            .smg-multiselect-item input[type="checkbox"] {
                accent-color: var(--smg-link); width: 14px; height: 14px; margin: 0; cursor: pointer;
            }
            .smg-multiselect-item .smg-badge-chip { font-size: var(--smg-fs-10) !important; padding: var(--smg-sp-2) var(--smg-sp-6) !important; border-radius: var(--smg-r-4) !important; }
            .smg-multiselect-empty { padding: var(--smg-sp-24); text-align: center; color: var(--smg-w-40); font-size: var(--smg-fs-13); }

            /* ===== Paginação em /watched/threads (gerenciada via scroll infinito) ===== */
            html.smg-threadlist[data-template*="watched_threads"] .pageNavWrapper,
            html.smg-threadlist[data-template*="watched_threads"] .pageNav,
            html.smg-threadlist[data-template*="watched_threads"] .block-outer--after,
            html.smg-threadlist[data-template*="watched_threads"] .block-outer--top {
                display: none !important;
            }
            .smg-watched-empty { grid-column: 1 / -1; padding: 60px var(--smg-sp-16); text-align: center; font-size: var(--smg-fs-14); color: var(--smg-w-50); }
        `;
