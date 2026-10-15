    // styles/02-home.js
    // Owns: CSS for home layout and home feed carousel.
    // Exposes: CSS_HOME.
    // Depends on: --smg-* tokens from styles/01-base.js; composed by core/05-styles.js (order matters).
    // STYLE CONTEXT: Home layout and home-specific components
    const CSS_HOME = `/* ================= HOME (forum_list) reformulada ================= */
            /* sidebar vai pro topo · conteúdo em coluna única, FULL WIDTH (nada na lateral) */
            html.smg-home .p-body-main--withSidebar {
                display: flex !important; flex-direction: column !important; align-items: stretch !important;
                grid-template-columns: none !important; gap: 0 !important;
            }
            html.smg-home .p-body-contentCol, html.smg-home .p-body-sidebarCol, html.smg-home .p-body-sidebar { display: none !important; }
            html.smg-home .p-body-content {
                width: 100% !important; max-width: 100% !important; min-width: 0 !important;
                flex: 0 0 auto !important; float: none !important; position: static !important;
                grid-column: auto !important; grid-area: auto !important; min-height: 0 !important;
                box-sizing: border-box !important;
            }
            /* Paint barrier: a home é transmitida em chunks e precisa de alguns frames para a
               reorganização terminar. O shell fica acima do conteúdo nativo e já reserva as
               proporções de todas as regiões visíveis; o DOM real só aparece quando a composição
               está pronta. */
            /* Hide the native body tree while the shell is active. Hiding only .p-body-main
               still lets the original header/stream flash through before the first composed frame;
               keep our already-built topbar/dock visible because they are stable custom chrome. */
            .smg-home-skeleton *, .smg-home-skeleton *::before, .smg-home-skeleton *::after { box-sizing: border-box; }
            .smg-home-skeleton-feed-head i,
            .smg-home-skeleton-feed-head span,
            .smg-home-skeleton-section-divider,
            .smg-home-skeleton-section-title,
            .smg-home-skeleton-notices-title,
            .smg-home-skeleton-notices-badge,
            .smg-home-skeleton-notices-line {
                position: relative; overflow: hidden; background: var(--smg-w-10);
            }
            .smg-home-skeleton-main {
                width: var(--smg-cw); margin: 0 auto; padding: var(--smg-sp-16) 0 44px;
            }
            .smg-home-skeleton-notices {
                margin-bottom: var(--smg-sp-24); border: 1px solid var(--smg-w-08); border-radius: var(--smg-r-16);
                background: var(--smg-w-04); overflow: hidden;
            }
            .smg-home-skeleton-notices-head {
                position: relative; display: flex; align-items: center; gap: var(--smg-sp-10); height: 48px;
                padding: 0 var(--smg-sp-16); overflow: hidden;
            }
            .smg-home-skeleton-notices-head i { display: block; flex: 0 0 auto; width: 20px; height: 20px; border-radius: var(--smg-r-round); background: var(--smg-w-10); }
            .smg-home-skeleton-notices-title { display: block; width: 82px; height: 13px; border-radius: var(--smg-r-6); background: var(--smg-w-10); }
            .smg-home-skeleton-notices-badge { display: block; width: 20px; height: 18px; border-radius: var(--smg-r-10); background: var(--smg-w-10); }
            .smg-home-skeleton-notices-actions { display: flex; align-items: center; gap: var(--smg-sp-8); margin-left: auto; }
            .smg-home-skeleton-notices-actions i { width: 17px; height: 17px; }
            .smg-home-skeleton-notices-actions i:last-child { width: 22px; height: 22px; }
            .smg-home-skeleton-notices-body { display: grid; gap: var(--smg-sp-6); padding: var(--smg-sp-8) var(--smg-sp-12) var(--smg-sp-12); border-top: 1px solid var(--smg-w-08); }
            .smg-home-skeleton-notices-line { display: block; width: 76%; height: 11px; border-radius: var(--smg-r-6); background: var(--smg-w-10); }
            .smg-home-skeleton-notices-line.short { width: 48%; }
            .smg-home-skeleton-notices:not(.is-expanded) .smg-home-skeleton-notices-body { display: none; }
            .smg-home-skeleton-feed {
                position: relative; margin-bottom: 38px; padding: 0;
                border: 0; border-radius: 0; background: transparent;
                overflow: hidden;
            }
            .smg-home-skeleton-feed-head { display: flex; align-items: center; gap: var(--smg-sp-12); height: 44px; margin-bottom: var(--smg-sp-18); border-bottom: 1px solid var(--smg-w-08); }
            .smg-home-skeleton-feed-head i { display: block; width: 116px; height: 14px; border-radius: var(--smg-r-6); }
            .smg-home-skeleton-feed-head i:nth-child(2) { width: 78px; opacity: .65; }
            .smg-home-skeleton-feed-head span { width: 62px; height: 11px; border-radius: var(--smg-r-6); margin-left: auto; }
            .smg-home-skeleton-feed-cards { display: flex; gap: var(--smg-sp-14); overflow: hidden; }
            .smg-home-skeleton-card { position: relative; flex: 0 0 295px; width: 295px; height: 395px; aspect-ratio: 3 / 4.02; border: 1px solid var(--smg-w-08); border-radius: var(--smg-r-16); background: var(--smg-w-06); overflow: hidden; }
            .smg-home-skeleton-card-badges { position: absolute; top: 12px; left: 12px; z-index: var(--smg-z-2); display: flex; gap: var(--smg-sp-6); }
            .smg-home-skeleton-card-badges i { display: block; width: 48px; height: 16px; border-radius: var(--smg-r-4); background: var(--smg-w-12); }
            .smg-home-skeleton-card-badges i:nth-child(2) { width: 38px; }
            .smg-home-skeleton-card-thumb { position: absolute; inset: 0 0 34%; background: var(--smg-w-04); }
            .smg-home-skeleton-card-body { position: absolute; left: 0; right: 0; bottom: 0; padding: var(--smg-sp-28) var(--smg-sp-14) var(--smg-sp-14); background: linear-gradient(to top, var(--smg-k-62), transparent); }
            .smg-home-skeleton-line { position: relative; width: 88%; height: 11px; margin-bottom: var(--smg-sp-8); border-radius: var(--smg-r-6); background: var(--smg-w-10); overflow: hidden; }
            .smg-home-skeleton-line.short { width: 62%; margin-bottom: 0; }
            .smg-home-skeleton-sections { display: grid; gap: 36px; padding-bottom: 10vh; }
            .smg-home-skeleton-section-head { display: flex; align-items: center; gap: var(--smg-sp-16); margin: 0 var(--smg-sp-2) var(--smg-sp-16); }
            .smg-home-skeleton-section-title { flex: 0 0 190px; position: relative; width: 190px; height: 16px; margin: 0; border-radius: var(--smg-r-6); background: var(--smg-w-12); overflow: hidden; }
            .smg-home-skeleton-section-badge { margin-left: auto; width: 56px; height: 18px; border-radius: var(--smg-r-pill); background: var(--smg-w-08); }
            .smg-home-skeleton-section-divider { position: relative; flex: 1 1 auto; height: 1px; min-width: 0; background: var(--smg-w-10); overflow: hidden; }
            .smg-home-skeleton-list { display: flex; flex-direction: column; gap: var(--smg-sp-8); }
            .smg-home-skeleton-row { position: relative; display: flex; align-items: center; gap: var(--smg-sp-14); min-height: 58px; padding: var(--smg-sp-10) var(--smg-sp-14); border: 1px solid var(--smg-w-08); border-radius: var(--smg-r-12); background: var(--smg-w-04); overflow: hidden; }
            .smg-home-skeleton-row-icon { flex: 0 0 38px; width: 38px; height: 38px; border-radius: var(--smg-r-10); background: var(--smg-w-08); }
            .smg-home-skeleton-row-copy { flex: 1 1 auto; min-width: 0; }
            .smg-home-skeleton-row-meta { margin-left: auto; width: 140px; height: 12px; border-radius: var(--smg-r-6); background: var(--smg-w-06); }
            .smg-home-skeleton-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: var(--smg-sp-14); }
            .smg-home-skeleton-tile { position: relative; min-height: 158px; border: 1px solid var(--smg-w-08); border-radius: var(--smg-r-14); background: var(--smg-w-06); overflow: hidden; }
            .smg-home-skeleton-tile::before { content: ""; position: absolute; top: 24px; left: 50%; width: 58px; height: 58px; border-radius: var(--smg-r-16); transform: translateX(-50%); background: var(--smg-w-08); }
            .smg-home-skeleton-tile .smg-home-skeleton-line { position: absolute; top: 101px; left: 20%; width: 60%; margin: 0; }
            .smg-home-skeleton-tile .smg-home-skeleton-line.short { top: 124px; left: 30%; width: 40%; }
            @media (max-width: 1100px) { .smg-home-skeleton-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
            @media (max-width: 800px) { .smg-home-skeleton-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
            @media (max-width: 800px) {
                .smg-home-skeleton-main { width: 100%; max-width: none; padding-left: var(--smg-sp-16); padding-right: var(--smg-sp-16); }
            }
            @media (max-width: 600px) {
                .smg-home-skeleton-main { width: 100%; padding: var(--smg-sp-12) var(--smg-sp-12) var(--smg-sp-32); }
                .smg-home-skeleton-main { padding-bottom: calc(32px + 54px + env(safe-area-inset-bottom)); }
                .smg-home-skeleton-notices { margin-bottom: var(--smg-sp-16); border-radius: var(--smg-r-12); }
                .smg-home-skeleton-notices-head { height: 42px; padding: 0 var(--smg-sp-12); }
                .smg-home-skeleton-notices-body { padding: var(--smg-sp-8) var(--smg-sp-10) var(--smg-sp-10); }
                .smg-home-skeleton-feed { margin-bottom: var(--smg-sp-28); }
                .smg-home-skeleton-feed-head { margin-bottom: var(--smg-sp-12); }
                .smg-home-skeleton-card { flex-basis: 210px; }
                .smg-home-skeleton-sections { gap: var(--smg-sp-28); padding-bottom: 8vh; }
                .smg-home-skeleton-section-head { gap: var(--smg-sp-10); margin-bottom: var(--smg-sp-12); }
                .smg-home-skeleton-section-title { flex-basis: 132px; width: 132px; }
                .smg-home-skeleton-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--smg-sp-10); }
                .smg-home-skeleton-tile { min-height: 136px; }
                .smg-home-skeleton-tile::before { top: 16px; width: 50px; height: 50px; border-radius: var(--smg-r-14); }
                .smg-home-skeleton-tile .smg-home-skeleton-line { top: 82px; }
                .smg-home-skeleton-tile .smg-home-skeleton-line.short { top: 105px; }
            }
            html.smg-home .p-body-content { order: 2 !important; padding-left: 0 !important; padding-right: 0 !important; }   /* mata o padding-right:20px do tema (.p-body-main--withSidebar) que desalinhava a home */
            /* ---- home: FEED com abas (Latest posts · Trending) — scroll horizontal, painel em DESTAQUE ---- */
            /* hero shelf: surface elevada com gradiente sutil e highlight superior */
            /* sem caixa em volta: os cards já são superfícies (caixa dentro de caixa era ruído) */
            html.smg-home .smg-feed-block {
                margin: var(--smg-sp-28) 0 46px !important; padding: 0;
                background: transparent; border: 0; border-radius: 0; box-shadow: none;
                overflow: visible;
            }
            /* tabbar = header da section com segmented control moderno */
            html.smg-home .smg-feed-tabs { display: flex; align-items: center; justify-content: space-between; gap: var(--smg-sp-12); padding: 0; margin: 0 0 var(--smg-sp-20); background: transparent; border-bottom: 0 !important; }
            /* tabs scrollam aqui; o "See all" fica fixo à direita */
            html.smg-home .smg-feed-tablist { display: inline-flex; align-items: center; gap: var(--smg-sp-4); padding: var(--smg-sp-4); border-radius: var(--smg-r-14); background: var(--smg-k-35); border: 1px solid var(--smg-w-08); overflow-x: auto; overflow-y: hidden; scrollbar-width: none; }
            html.smg-home .smg-feed-tablist::-webkit-scrollbar { display: none; }
            /* abas em cápsula moderna com realce no item ativo */
            html.smg-home .smg-feed-tab {
                position: relative;
                display: inline-flex; align-items: center; gap: var(--smg-sp-8); flex: 0 0 auto; height: 36px; padding: 0 var(--smg-sp-16);
                border: 0; border-radius: var(--smg-tab-r); background: transparent; color: var(--smg-w-55);
                font-size: var(--smg-fs-14); font-weight: 700; letter-spacing: .01em; cursor: pointer; white-space: nowrap;
                transition: color var(--smg-dur-20) ease, background var(--smg-dur-20) ease, box-shadow var(--smg-dur-20) ease;
            }
            html.smg-home .smg-feed-tab:hover { color: #fff; background: var(--smg-w-06); }
            html.smg-home .smg-feed-tab.is-active {
                color: #fff;
                background: linear-gradient(135deg, var(--smg-w-14) 0%, var(--smg-w-06) 100%);
                box-shadow: var(--smg-shadow-1), var(--smg-hl);
            }
            html.smg-home .smg-feed-tab::after { display: none !important; }
            html.smg-home .smg-feed-tab-ic { display: inline-flex; }
            html.smg-home .smg-feed-tab-ic svg { width: 15px; height: 15px; fill: none !important; }
            html.smg-home .smg-feed-tab[data-feed="trending"] .smg-feed-tab-ic { color: #ff8a3d; }
            /* "See all" pill moderno */
            html.smg-home .smg-feed-seeall {
                flex: 0 0 auto; align-self: center; display: inline-flex; align-items: center; gap: var(--smg-sp-6);
                height: 36px; padding: 0 var(--smg-sp-14); border-radius: var(--smg-r-12); background: var(--smg-w-04);
                border: 1px solid var(--smg-w-08);
                color: var(--smg-w-72); font-size: var(--smg-fs-13); font-weight: 600; text-decoration: none;
                white-space: nowrap; transition: all var(--smg-dur-15) ease;
            }
            html.smg-home .smg-feed-seeall:hover {
                background: var(--smg-w-10); border-color: var(--smg-w-18); color: #fff; transform: translateY(-1px);
            }
            html.smg-home .smg-feed-seeall svg { display: block; }
            /* corpo: scroll horizontal de cards, com setas flutuantes no desktop */
            html.smg-home .smg-feed-scroll { position: relative; }
            html.smg-home .smg-feed-panel { display: none; }
            html.smg-home .smg-feed-panel.is-active {
                --smg-feed-card-w: calc((100% - 42px) / 4);
                display: flex; align-items: stretch; gap: var(--smg-sp-14); padding: var(--smg-sp-2);
                overflow-x: auto; overflow-y: hidden; scroll-snap-type: x proximity; scrollbar-width: none; -ms-overflow-style: none;
            }
            html.smg-home .smg-feed-panel::-webkit-scrollbar { display: none; }
            /* CARD IMERSIVO AMPLIADO (largura & altura expandidas, presença visual nobre) */
            html.smg-home .smg-feed-card,
            html.smg-home .smg-feed-skel {
                position: relative; flex: 0 0 var(--smg-feed-card-w) !important;
                width: var(--smg-feed-card-w) !important; min-width: var(--smg-feed-card-w) !important; max-width: var(--smg-feed-card-w) !important;
                height: auto !important; aspect-ratio: 3 / 4 !important; scroll-snap-align: start;
                display: block; border-radius: var(--smg-r-18); overflow: hidden;
                background: var(--smg-s2); border: 1px solid var(--smg-w-08); text-decoration: none;
                box-shadow: 0 8px 24px -6px var(--smg-k-55);
            }
            html.smg-home .smg-feed-card-thumb { position: absolute; inset: 0; width: 100%; height: 100%; background: var(--smg-s2); overflow: hidden; display: block; }
            html.smg-home .smg-feed-card-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
            html.smg-home .smg-feed-card-thumb.smg-feed-noimg { display: flex; align-items: center; justify-content: center; }
            /* Scrim gradiente cinematográfico */
            html.smg-home .smg-feed-card-body {
                position: absolute; left: 0; right: 0; bottom: 0; z-index: var(--smg-z-2); padding: 56px var(--smg-sp-16) var(--smg-sp-16);
                display: flex; flex-direction: column; gap: var(--smg-sp-6); min-width: 0;
                background: linear-gradient(to top, rgba(8,9,12,0.96) 0%, rgba(8,9,12,0.85) 45%, rgba(8,9,12,0.3) 78%, transparent 100%);
            }
            html.smg-home .smg-feed-skel .smg-feed-card-body { background: none; }
            /* Linha de badges/tags */
            html.smg-home .smg-feed-card-badges { display: flex; flex-wrap: wrap; gap: var(--smg-sp-6); margin-bottom: var(--smg-sp-6); }
            html.smg-home .smg-feed-card-badges .label,
            html.smg-home .smg-feed-card-badges .prefix {
                margin: 0 !important;
                font-size: var(--smg-fs-10) !important;
                font-weight: 700 !important;
                letter-spacing: .02em !important;
                text-transform: uppercase !important;
                padding: var(--smg-sp-2) var(--smg-sp-6) !important;
                border-radius: var(--smg-r-6) !important;
                line-height: 1.2 !important;
                backdrop-filter: blur(8px);
                border: 1px solid var(--smg-w-12);
                box-shadow: var(--smg-shadow-1);
            }
            html.smg-home .smg-feed-card-title {
                font-size: var(--smg-fs-16); font-weight: 750; color: #fff; line-height: 1.3; letter-spacing: -0.015em;
                display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
                text-shadow: 0 1px 4px var(--smg-k-82);
            }
            html.smg-home .smg-feed-card-meta {
                font-size: var(--smg-fs-12); color: var(--smg-w-72); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                text-shadow: 0 1px 2px var(--smg-k-62); display: flex; align-items: center; gap: var(--smg-sp-6); margin-top: var(--smg-sp-4);
            }
            html.smg-home .smg-feed-card-meta .smg-feed-user { color: var(--smg-w-95); font-weight: 600; }
            html.smg-home .smg-feed-card-meta .smg-feed-dot { opacity: 0.5; }
            html.smg-home .smg-feed-card-meta .smg-feed-time { opacity: 0.75; }
            html.smg-home .smg-feed-loading { width: 100%; padding: 40px; text-align: center; color: var(--smg-w-50); font-size: var(--smg-fs-13); }
            /* skeletons de loading */
            html.smg-home .smg-feed-skel { pointer-events: none; }
            html.smg-home .smg-skel-box, html.smg-home .smg-skel-line { position: relative; overflow: hidden; background: var(--smg-s2); }
            html.smg-home .smg-feed-skel .smg-feed-card-thumb { background: var(--smg-s2); }
            html.smg-home .smg-skel-line { height: 11px; border-radius: var(--smg-r-6); margin-bottom: var(--smg-sp-8); }
            html.smg-home .smg-skel-line--short { width: 60%; }
            html.smg-home .smg-skel-line--meta { width: 45%; height: 9px; margin-top: var(--smg-sp-6); margin-bottom: 0; }
            /* Setas flutuantes glass */
            html.smg-home .smg-feed-nav {
                position: absolute; top: 50%; transform: translateY(-50%); z-index: var(--smg-z-4);
                width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
                border-radius: var(--smg-r-round); cursor: pointer; color: #fff; line-height: 0;
                border: 1px solid var(--smg-w-18); background: rgba(20,21,26,0.88);
                backdrop-filter: blur(12px);
                box-shadow: var(--smg-shadow-2);
                transition: background var(--smg-dur-15) ease, transform var(--smg-dur-15) ease, border-color var(--smg-dur-15) ease, opacity var(--smg-dur-20) ease, visibility var(--smg-dur-20);
            }
            html.smg-home .smg-feed-nav:hover { background: rgba(35,37,45,0.96); border-color: var(--smg-w-30); transform: translateY(-50%) scale(1.08); }
            html.smg-home .smg-feed-nav:active { transform: translateY(-50%) scale(0.95); }
            html.smg-home .smg-feed-nav svg { width: 20px; height: 20px; fill: none !important; }
            html.smg-home .smg-feed-prev { left: var(--smg-sp-8); }   /* setas por dentro da borda do conteúdo */
            html.smg-home .smg-feed-next { right: var(--smg-sp-8); }
            html.smg-home .smg-feed-nav.smg-nav-hidden { opacity: 0; visibility: hidden; pointer-events: none; }
            @media (max-width: 1100px) {
                html.smg-home .smg-feed-panel.is-active { --smg-feed-card-w: calc((100% - 14px) / 2); }
            }
            @media (max-width: 800px) {
                html.smg-home .smg-feed-panel.is-active { --smg-feed-card-w: 92%; scroll-snap-type: x mandatory; gap: var(--smg-sp-10); }
                html.smg-home .smg-feed-card { scroll-snap-align: center; }
                html.smg-home .smg-feed-nav { display: none; }
            }

            /* ================= CATEGORY HUB ================= */
            /* sections: Grupo Hub limpo e moderno */
            html.smg-home .block--category {
                margin-bottom: 38px !important; border-radius: 0 !important;
                background: transparent !important;
                border: 0 !important; box-shadow: none !important; overflow: visible !important;
            }
            html.smg-home .block--category .block-container,
            html.smg-home .block--category > .block-container,
            html.smg-home .block--category .uix_block-body--outer {
                background: transparent !important; border: 0 !important; box-shadow: none !important;
            }
            html.smg-home .block--category .block-header {
                display: flex !important; align-items: center; justify-content: flex-start; position: relative;
                background: transparent !important;
                padding: 0 var(--smg-sp-4) var(--smg-sp-14) !important; margin: 0 0 var(--smg-sp-18) !important;
                font-size: var(--smg-fs-13) !important; font-weight: 800 !important; letter-spacing: .12em; text-transform: uppercase;
                color: var(--smg-w-60) !important;
                border: 0 !important; border-bottom: 1px solid var(--smg-w-08) !important;
            }
            html.smg-home .block--category .block-header a,
            html.smg-home .block--category .uix_categoryTitle { color: #fff !important; }
            html.smg-home .block--category .categoryCollapse--trigger { position: absolute !important; right: 16px; top: 50%; transform: translateY(-50%); margin: 0 !important; }

            /* Badge de contagem de fóruns no header da seção */
            html.smg-home .smg-hub-badge {
                display: inline-flex; align-items: center;
                padding: var(--smg-sp-2) var(--smg-sp-8); border-radius: var(--smg-badge-r);
                font-size: var(--smg-fs-11); font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase;
                background: var(--smg-w-06); border: 1px solid var(--smg-w-08);
                color: var(--smg-w-50); margin-left: var(--smg-sp-10);
            }
            html.smg-smg.smg-home .smg-hub-badge {
                background: var(--smg-link-soft);
                border-color: rgba(255, 61, 132, 0.25);
                color: var(--smg-link);
            }

            html.smg-home .block--category .block-body,
            html.smg-smg.smg-home .block--category .block-body {
                display: flex !important;
                flex-direction: column !important;
                gap: var(--smg-sp-8) !important;
                padding: 0 !important;
                background: transparent !important;
                border: 0 !important;
            }
            @media (max-width: 600px) {
                html.smg-home .block--category .block-header { padding-left: var(--smg-sp-6) !important; }
            }
            /* home: remove a linha do header da página (título + New Posts/Post Thread) */
            html.smg-home .p-body-header { display: none !important; }

            /* HUB LIST ITEM: Superfície limpa com feixe lateral interativo */
            html.smg-home .block--category .node {
                position: relative !important;
                display: flex !important; flex-direction: row !important; align-items: center !important;
                cursor: pointer;
                border: 1px solid var(--smg-w-08) !important;
                border-radius: var(--smg-r-14) !important;
                background: linear-gradient(160deg, var(--smg-w-04) 0%, var(--smg-w-02) 100%), var(--smg-s1) !important;
                overflow: hidden !important;
                min-height: 64px !important;
                box-shadow: var(--smg-shadow-1) !important;
            }
            /* Sem feixe lateral (o tema desenha um ::before na linha) */
            html.smg-home .block--category .node::before { display: none !important; }

            html.smg-smg.smg-home .block--category .node {
                border: 1px solid var(--smg-w-08) !important;
            }

            /* Node body e alinhamento horizontal */
            html.smg-home .node-body {
                position: relative !important;
                flex: 1 1 auto !important;
                display: flex !important; flex-direction: row !important;
                align-items: center !important; justify-content: flex-start !important;
                text-align: left !important; gap: var(--smg-sp-16) !important; padding: var(--smg-sp-10) var(--smg-sp-18) !important;
                background: transparent !important; box-sizing: border-box !important;
            }

            /* Ícone / Logo puro (sem moldura rounded) */
            html.smg-home .node-icon {
                width: 38px !important; height: 38px !important; margin: 0 !important; padding: 0 !important; box-sizing: border-box !important;
                flex: 0 0 auto !important;
                display: flex !important; align-items: center; justify-content: center;
                background: transparent !important;
                border: 0 !important; border-radius: 0 !important;
                box-shadow: none !important;
            }
            html.smg-home .node-icon img {
                width: 38px !important; height: 38px !important; max-width: 38px !important; max-height: 38px !important;
                border-radius: var(--smg-r-8) !important; object-fit: contain !important;
                filter: drop-shadow(0 2px 6px var(--smg-k-45)) !important;
            }
            html.smg-home .node-icon i { font-size: var(--smg-fs-24); display: inline-flex; }
            html.smg-home .node-icon i svg, html.smg-home .node-icon > svg {
                width: 24px !important; height: 24px !important; color: var(--smg-w-85);
                filter: drop-shadow(0 2px 6px var(--smg-k-45)) !important;
            }
            html.smg-home .node-icon .node-icon-fix-verti { width: auto !important; height: auto !important; }
            html.smg-home .node-icon .node-icon-fix-verti img { width: 38px !important; height: 38px !important; max-width: 38px !important; max-height: 38px !important; }
            html.smg-home .node-main { min-width: 0 !important; width: auto !important; flex: 1 1 auto !important; display: flex !important; flex-direction: column !important; justify-content: center !important; }
            html.smg-home .node-title {
                font-size: var(--smg-fs-15) !important; font-weight: 700 !important; letter-spacing: -0.01em !important;
                justify-content: flex-start !important; text-align: left !important; line-height: 1.3 !important;
            }
            html.smg-home .node-title a { color: #fff !important; text-decoration: none !important; transition: color var(--smg-dur-15) ease; }
            html.smg-home .node-description {
                font-size: var(--smg-fs-13) !important; line-height: 1.4 !important;
                color: var(--smg-w-55) !important; margin-top: var(--smg-sp-2) !important;
                display: -webkit-box !important; -webkit-line-clamp: 2 !important; -webkit-box-orient: vertical !important; overflow: hidden !important;
                white-space: normal !important;
            }

            /* Divisor entre categorias principais e restantes */
            html.smg-home .smg-hub-category-divider {
                display: flex !important; align-items: center !important; gap: var(--smg-sp-14) !important;
                margin: var(--smg-sp-16) var(--smg-sp-4) var(--smg-sp-10) !important; width: calc(100% - 8px) !important;
            }
            html.smg-home .smg-hub-divider-line {
                flex: 1 1 auto !important; height: 1px !important;
                background: linear-gradient(90deg, var(--smg-w-08), var(--smg-w-02)) !important;
            }
            html.smg-smg.smg-home .smg-hub-divider-line {
                background: linear-gradient(90deg, rgba(255, 61, 132, 0.25), var(--smg-w-04)) !important;
            }
            html.smg-home .smg-hub-divider-text {
                font-size: var(--smg-fs-11) !important; font-weight: 750 !important; letter-spacing: 0.08em !important;
                text-transform: uppercase !important; color: var(--smg-w-40) !important; white-space: nowrap !important;
            }
            html.smg-smg.smg-home .smg-hub-divider-text {
                color: var(--smg-link) !important;
            }

            /* Últimos posts (.node-extra) à direita no layout de lista */
            html.smg-home .node-extra {
                display: flex !important; flex-direction: column !important;
                align-items: flex-end !important; justify-content: center !important;
                flex: 0 0 auto !important; max-width: 380px !important; min-width: 180px !important;
                text-align: right !important; gap: var(--smg-sp-4) !important; margin-left: auto !important;
                padding: var(--smg-sp-4) 0 !important; border-radius: 0 !important;
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
                position: relative; z-index: var(--smg-z-2);
            }
            html.smg-home .node-extra:hover {
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
            }
            html.smg-home .node-extra-icon { display: none !important; }
            html.smg-home .node-extra-row {
                display: block !important; max-width: 100% !important;
                white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important;
            }
            html.smg-home .node-extra-title {
                display: inline-block !important; max-width: 100% !important;
                color: var(--smg-w-95) !important; font-size: var(--smg-fs-13) !important; font-weight: 600 !important;
                white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important;
                text-decoration: none !important; transition: color var(--smg-dur-15) ease !important;
            }
            html.smg-home .node-extra-title .prefix {
                margin-right: var(--smg-sp-6) !important;
                font-size: var(--smg-fs-10) !important; font-weight: 700 !important; letter-spacing: .02em !important;
                text-transform: uppercase !important; padding: var(--smg-sp-2) var(--smg-sp-6) !important; border-radius: var(--smg-r-6) !important;
                line-height: 1.2 !important; display: inline-block !important; vertical-align: middle !important;
            }
            html.smg-home .node-title a:hover {
                color: var(--smg-link) !important;
            }
            html.smg-home .node-title .uix_newIndicator {
                margin-left: var(--smg-sp-8) !important;
                font-size: var(--smg-fs-10) !important; font-weight: 700 !important; letter-spacing: 0.04em !important;
                text-transform: uppercase !important; padding: var(--smg-sp-2) var(--smg-sp-6) !important; border-radius: var(--smg-r-6) !important;
                line-height: 1.2 !important; display: inline-block !important; vertical-align: middle !important;
                background: var(--smg-link-soft) !important;
                color: var(--smg-link) !important;
                border: 1px solid var(--smg-link-soft) !important;
            }
            html.smg-home .node-extra:hover .node-extra-title {
                color: var(--smg-link) !important;
                text-decoration: underline !important;
            }
            html.smg-smg.smg-home .node-extra-title:hover {
                color: var(--smg-link) !important;
            }
            html.smg-home .node-extra .listInline {
                display: inline-flex !important; align-items: center !important; justify-content: flex-end !important;
                gap: var(--smg-sp-6) !important; margin: 0 !important; padding: 0 !important;
                list-style: none !important; font-size: var(--smg-fs-12) !important; color: var(--smg-w-50) !important;
            }
            html.smg-home .node-extra .username {
                color: var(--smg-w-72) !important; font-weight: 600 !important;
            }
            html.smg-home .node-extra time,
            html.smg-home .node-extra .node-extra-date {
                color: var(--smg-w-50) !important;
            }

            @media (max-width: 600px) {
                html.smg-home .block--category .node { min-height: 60px !important; }
                html.smg-home .block--category .node-body {
                    flex-wrap: wrap !important; padding: var(--smg-sp-10) var(--smg-sp-14) !important; gap: var(--smg-sp-8) var(--smg-sp-12) !important;
                }
                html.smg-home .node-icon { width: 38px !important; height: 38px !important; }
                html.smg-home .node-icon img { max-width: 26px !important; max-height: 26px !important; }
                html.smg-home .node-icon svg { width: 18px !important; height: 18px !important; }
                html.smg-home .node-main { flex: 1 1 calc(100% - 54px) !important; }
                html.smg-home .node-title { font-size: var(--smg-fs-14) !important; }
                html.smg-home .node-extra {
                    flex: 0 0 100% !important; max-width: 100% !important; min-width: 0 !important;
                    align-items: flex-start !important; text-align: left !important;
                    border-top: 1px solid var(--smg-w-06) !important; padding-top: var(--smg-sp-6) !important; margin-left: 0 !important;
                }
                html.smg-home .node-extra .listInline { justify-content: flex-start !important; }
            }

            /* tira estatísticas e a lista de subitems (viram cards próprios) */
            html.smg-home .node-meta,
            html.smg-home .node-stats,
            html.smg-home .node-subNodesFlat { display: none !important; }

            /* controle de truncamento/quebra */
            html.smg-home .node-title, html.smg-home .node-title a {
                white-space: normal !important; overflow: visible !important; text-overflow: clip !important;
            }

            /* remove ads/links promocionais e blocos de anúncio na home
               PERF: .smg-ad-block é marcado pelo JS (markHomeAdBlocks, 16-home) — substitui o
               :has(> .block-container > .block-body > .node--link), reavaliado a cada mutação da home */
            html.smg-home .node--link { display: none !important; }
            html.smg-home .block.smg-ad-block { display: none !important; }
            html.smg-home .samLinkUnit, html.smg-home .samCodeUnit { display: none !important; }

            /* daily login streak (SMG): o bloco é REMOVIDO pelo JS (layoutHomeSidebar) — as regras
               :has(.streakStats) que estilizavam o flash pré-boot foram deletadas (custavam invalidação
               por mutação na home inteira p/ um bloco que some no DOMContentLoaded). */
            html.smg-home .streakStats { display: flex !important; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--smg-sp-10) var(--smg-sp-28) !important; }
            html.smg-home .streakStats > .pairs { text-align: center; margin: 0 !important; }
            html.smg-home .streakStats > .pairs dd strong { font-size: var(--smg-fs-24) !important; font-weight: 800 !important; line-height: 1; }
            html.smg-home .streakStats > .pairs dt { font-size: var(--smg-fs-12) !important; color: var(--smg-w-55) !important; margin-top: var(--smg-sp-4); }
            html.smg-home .streakCounters { display: flex !important; gap: var(--smg-sp-6) !important; margin: 0 !important; }
            html.smg-home .streakCounters .pairs {
                display: flex !important; flex-direction: column; align-items: center; justify-content: center;
                width: 40px; height: 48px; margin: 0 !important;
                border-radius: var(--smg-r-12); background: var(--smg-w-06); border: 1px solid var(--smg-w-10);
            }
            html.smg-home .streakCounters .pairs dt { font-size: var(--smg-fs-11) !important; color: var(--smg-w-60) !important; }
            html.smg-home .dailyLogin-burningStreak { color: #ff8a3d !important; }
            html.smg-home .dailyLogin-bestStreak { color: #ffd24a !important; }

            /* ===== páginas de FÓRUM (forum_view) que listam SUB-FÓRUNS: mesmos cards da home ===== */
            /* escopado em .block--category → só pega o bloco de sub-fóruns; a lista de threads é estilizada à parte */
            html.smg-threadlist .block--category {
                margin-bottom: var(--smg-sp-28) !important; border: 0 !important; background: transparent !important;
                box-shadow: none !important; border-radius: 0 !important; overflow: visible !important;
            }
            html.smg-threadlist .block--category .block-container,
            html.smg-threadlist .block--category .uix_block-body--outer {
                background: transparent !important; border: 0 !important; box-shadow: none !important;
            }
            html.smg-threadlist .block--category .block-header {
                display: flex !important; align-items: center; position: relative;
                background: transparent !important; padding: 0 var(--smg-sp-2) var(--smg-sp-12) !important; margin: 0 0 var(--smg-sp-16) !important;
                font-size: var(--smg-fs-13) !important; font-weight: 700 !important; letter-spacing: .14em; text-transform: uppercase;
                color: var(--smg-w-55) !important; border: 0 !important; border-bottom: 1px solid var(--smg-bd) !important;
            }
            html.smg-threadlist .block--category .block-header a,
            html.smg-threadlist .block--category .uix_categoryTitle { color: #fff !important; }
            html.smg-threadlist .block--category .categoryCollapse--trigger { position: absolute !important; right: 16px; top: 50%; transform: translateY(-50%); margin: 0 !important; }
            /* .smg-has-nodes marcado pelo JS (markCategoryNodeBlocks, 15-listing) no lugar do :has(.node) */
            html.smg-threadlist .block--category.smg-has-nodes .block-body {
                display: grid !important; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
                gap: var(--smg-sp-14) !important; padding: 0 !important; background: transparent !important; border: 0 !important;
            }
            html.smg-threadlist .block--category .node {
                display: flex !important; cursor: pointer; border: 1px solid var(--smg-bd) !important;
                border-radius: var(--smg-r-14) !important; background: var(--smg-s1) !important; overflow: visible !important;
            }
            html.smg-threadlist .block--category .node-body {
                flex: 1 1 auto !important; display: flex !important; flex-direction: column !important;
                align-items: center !important; justify-content: center !important; text-align: center !important;
                gap: var(--smg-sp-10) !important; padding: var(--smg-sp-20) var(--smg-sp-14) !important;
            }
            html.smg-threadlist .block--category .node-icon {
                width: 66px !important; height: 66px !important; margin: 0 0 var(--smg-sp-2) !important; padding: var(--smg-sp-10) !important; box-sizing: border-box !important;
                display: flex !important; align-items: center; justify-content: center;
                background: var(--smg-w-06); border: 1px solid var(--smg-w-08); border-radius: var(--smg-r-18);
            }
            html.smg-threadlist .block--category .node-icon img { width: auto !important; height: auto !important; max-width: 100% !important; max-height: 100% !important; border-radius: var(--smg-r-10) !important; object-fit: contain !important; }
            html.smg-threadlist .block--category .node-icon i { font-size: var(--smg-fs-28); display: inline-flex; }
            html.smg-threadlist .block--category .node-icon i svg,
            html.smg-threadlist .block--category .node-icon > svg { width: 28px !important; height: 28px !important; color: var(--smg-w-72); }
            html.smg-threadlist .block--category .node-main { min-width: 0 !important; width: 100% !important; }
            html.smg-threadlist .block--category .node-title { font-size: var(--smg-fs-15) !important; font-weight: 700 !important; justify-content: center !important; line-height: 1.3 !important; white-space: normal !important; }
            html.smg-threadlist .block--category .node-title a { color: #fff !important; }
            html.smg-threadlist .block--category .node-description { font-size: var(--smg-fs-13) !important; color: var(--smg-w-50) !important; margin-top: var(--smg-sp-4); white-space: normal !important; }
            html.smg-threadlist .block--category .node-meta,
            html.smg-threadlist .block--category .node-stats,
            html.smg-threadlist .block--category .node-extra,
            html.smg-threadlist .block--category .node-subNodesFlat { display: none !important; }
            @media (max-width: 600px) {
                html.smg-threadlist .block--category.smg-has-nodes .block-body { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: var(--smg-sp-10) !important; }
                html.smg-threadlist .block--category .node-body { padding: var(--smg-sp-14) var(--smg-sp-10) !important; gap: var(--smg-sp-8) !important; }
                html.smg-threadlist .block--category .node-icon { width: 50px !important; height: 50px !important; padding: var(--smg-sp-8) !important; }
                html.smg-threadlist .block--category .node-title { font-size: var(--smg-fs-14) !important; }
            }
            /* ---- SEÇÃO SITES: layout em lista elegante com exibição dos últimos posts ---- */
            html.smg-threadlist .block--category.smg-home-section-sites .block-body {
                display: flex !important;
                flex-direction: column !important;
                gap: var(--smg-sp-8) !important;
            }
            html.smg-threadlist .block--category.smg-home-section-sites .node {
                display: flex !important;
                align-items: center !important;
                padding: var(--smg-sp-10) var(--smg-sp-16) !important;
                border-radius: var(--smg-r-12) !important;
                min-height: 60px !important;
            }
            html.smg-threadlist .block--category.smg-home-section-sites .node-body {
                flex-direction: row !important;
                align-items: center !important;
                justify-content: flex-start !important;
                text-align: left !important;
                padding: 0 !important;
                gap: var(--smg-sp-14) !important;
                width: 100% !important;
            }
            html.smg-threadlist .block--category.smg-home-section-sites .node-icon {
                width: 42px !important;
                height: 42px !important;
                margin: 0 !important;
                padding: var(--smg-sp-6) !important;
                border-radius: var(--smg-r-12) !important;
                flex: 0 0 42px !important;
            }
            html.smg-threadlist .block--category.smg-home-section-sites .node-main {
                flex: 1 1 auto !important;
                min-width: 0 !important;
                width: auto !important;
            }
            html.smg-threadlist .block--category.smg-home-section-sites .node-title {
                font-size: var(--smg-fs-15) !important;
                font-weight: 700 !important;
                justify-content: flex-start !important;
            }
            html.smg-threadlist .block--category.smg-home-section-sites .node-extra {
                display: flex !important;
                flex-direction: column !important;
                align-items: flex-end !important;
                justify-content: center !important;
                margin-left: auto !important;
                max-width: 380px !important;
                text-align: right !important;
                flex-shrink: 0 !important;
                gap: var(--smg-sp-4) !important;
            }
            html.smg-threadlist .block--category.smg-home-section-sites .node-extra-row {
                font-size: var(--smg-fs-12) !important;
                color: var(--smg-w-72) !important;
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                max-width: 100% !important;
            }
            html.smg-threadlist .block--category.smg-home-section-sites .node-extra-title {
                color: #fff !important;
                font-weight: 600 !important;
                text-decoration: none !important;
            }
            html.smg-threadlist .block--category.smg-home-section-sites .node-extra-title:hover {
                color: var(--smg-link) !important;
                text-decoration: underline !important;
            }
            html.smg-threadlist .block--category.smg-home-section-sites .node-extra-date {
                font-size: var(--smg-fs-11) !important;
                color: var(--smg-w-40) !important;
            }
            html.smg-threadlist .block--category.smg-home-section-sites .node-extra-user {
                color: var(--smg-w-55) !important;
            }
            @media (max-width: 600px) { html.smg-home .smg-feed-block { margin-top: var(--smg-sp-16) !important; margin-bottom: var(--smg-sp-32) !important; }
                html.smg-threadlist .block--category.smg-home-section-sites .node-extra {
                    display: none !important;
                }
            }

            `;
