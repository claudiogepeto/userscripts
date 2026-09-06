    // STYLE CONTEXT: Home layout and home-specific components
    const CSS_HOME = `/* ================= HOME (forum_list) reformulada ================= */
            /* sidebar vai pro topo · conteúdo em coluna única, FULL WIDTH (nada na lateral) */
            html.smg-home .p-body-main--withSidebar {
                display: flex !important; flex-direction: column !important; align-items: stretch !important;
                grid-template-columns: none !important; gap: 0 !important;
            }
            html.smg-home .p-body-contentCol, html.smg-home .p-body-sidebarCol { display: none !important; }
            html.smg-home .p-body-content,
            html.smg-home .p-body-sidebar {
                width: 100% !important; max-width: 100% !important; min-width: 0 !important;
                flex: 0 0 auto !important; float: none !important; position: static !important;
                grid-column: auto !important; grid-area: auto !important; min-height: 0 !important;
                box-sizing: border-box !important;
            }
            /* A home usa o feed próprio e as categorias como fonte única. A sidebar nativa pode chegar
               depois do primeiro paint (ou ser recriada pelo XF), então não pode piscar nem reaparecer
               ao lado do conteúdo novo durante o streaming. */
            html.smg-home .p-body-sidebar { display: none !important; }
            /* Paint barrier: a home é transmitida em chunks e precisa de alguns frames para a
               reorganização terminar. O shell fica acima do conteúdo nativo e já reserva as
               proporções de todas as regiões visíveis; o DOM real só aparece quando a composição
               está pronta. */
            /* Hide the native body tree while the shell is active. Hiding only .p-body-main
               still lets the original header/stream flash through before the first composed frame;
               keep our already-built topbar/dock visible because they are stable custom chrome. */
            #smg-home-skeleton {
                position: fixed; inset: 0; z-index: 1000; min-height: 100vh; min-height: 100dvh; overflow: hidden; pointer-events: none;
                background: var(--smg-bg, #101113); visibility: visible;
            }
            html.smg-aldock-on #smg-home-skeleton { right: var(--smg-ald-w, 360px); }
            .smg-home-skeleton *, .smg-home-skeleton *::before, .smg-home-skeleton *::after { box-sizing: border-box; }
            .smg-home-skeleton-topbar {
                display: flex; align-items: center; justify-content: space-between; gap: 24px;
                height: 62px; padding: 0 max(18px, calc((100% - var(--smg-cw, 80%)) / 2));
                border-bottom: 1px solid rgba(255,255,255,0.08); background: var(--smg-bg, #101113);
            }
            .smg-home-skeleton-topbar-logo { width: 142px; height: 28px; border-radius: 7px; }
            .smg-home-skeleton-topbar-nav { display: flex; align-items: center; gap: 30px; margin-left: auto; }
            .smg-home-skeleton-topbar-logo,
            .smg-home-skeleton-topbar-nav i,
            .smg-home-skeleton-topbar-actions i,
            .smg-home-skeleton-feed-head i,
            .smg-home-skeleton-feed-head span,
            .smg-home-skeleton-section-divider,
            .smg-home-skeleton-section-title,
            .smg-home-skeleton-notices-title,
            .smg-home-skeleton-notices-badge,
            .smg-home-skeleton-notices-line {
                position: relative; overflow: hidden; background: rgba(255,255,255,0.10);
            }
            .smg-home-skeleton-topbar-nav i { display: block; width: 88px; height: 13px; border-radius: 6px; }
            .smg-home-skeleton-topbar-nav i:nth-child(2) { width: 76px; }
            .smg-home-skeleton-topbar-nav i:nth-child(3) { width: 84px; }
            .smg-home-skeleton-topbar-actions { display: flex; align-items: center; gap: 14px; margin-left: 30px; }
            .smg-home-skeleton-topbar-actions i { display: block; width: 24px; height: 24px; border-radius: 50%; }
            .smg-home-skeleton-topbar-actions i:last-child { width: 34px; height: 34px; }
            .smg-home-skeleton-main {
                width: var(--smg-cw, 80%); margin: 0 auto; padding: 16px 0 44px;
            }
            .smg-home-skeleton-notices {
                margin-bottom: 22px; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px;
                background: rgba(255,255,255,0.045); overflow: hidden;
            }
            .smg-home-skeleton-notices-head {
                position: relative; display: flex; align-items: center; gap: 10px; height: 48px;
                padding: 0 16px; overflow: hidden;
            }
            .smg-home-skeleton-notices-head i { display: block; flex: 0 0 auto; width: 20px; height: 20px; border-radius: 50%; background: rgba(255,255,255,0.10); }
            .smg-home-skeleton-notices-title { display: block; width: 82px; height: 13px; border-radius: 6px; background: rgba(255,255,255,0.10); }
            .smg-home-skeleton-notices-badge { display: block; width: 20px; height: 18px; border-radius: 9px; background: rgba(255,255,255,0.10); }
            .smg-home-skeleton-notices-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
            .smg-home-skeleton-notices-actions i { width: 17px; height: 17px; }
            .smg-home-skeleton-notices-actions i:last-child { width: 22px; height: 22px; }
            .smg-home-skeleton-notices-body { display: grid; gap: 6px; padding: 8px 12px 12px; border-top: 1px solid rgba(255,255,255,0.08); }
            .smg-home-skeleton-notices-line { display: block; width: 76%; height: 11px; border-radius: 5px; background: rgba(255,255,255,0.09); }
            .smg-home-skeleton-notices-line.short { width: 48%; }
            .smg-home-skeleton-notices:not(.is-expanded) .smg-home-skeleton-notices-body { display: none; }
            .smg-home-skeleton-feed {
                position: relative; margin-bottom: 38px; padding: 14px 18px 20px;
                border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; background: rgba(255,255,255,0.045);
                overflow: hidden;
            }
            .smg-home-skeleton-feed-head { display: flex; align-items: center; gap: 12px; height: 44px; margin-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,0.08); }
            .smg-home-skeleton-feed-head i { display: block; width: 116px; height: 14px; border-radius: 6px; }
            .smg-home-skeleton-feed-head i:nth-child(2) { width: 78px; opacity: .65; }
            .smg-home-skeleton-feed-head span { width: 62px; height: 11px; border-radius: 5px; margin-left: auto; }
            .smg-home-skeleton-feed-cards { display: flex; gap: 14px; overflow: hidden; }
            .smg-home-skeleton-card { position: relative; flex: 0 0 230px; aspect-ratio: 3 / 4; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; background: rgba(255,255,255,0.06); overflow: hidden; }
            .smg-home-skeleton-card::after,
            .smg-home-skeleton-tile::after,
            .smg-home-skeleton-notices-head::after,
            .smg-home-skeleton-topbar-logo::after,
            .smg-home-skeleton-topbar-nav i::after,
            .smg-home-skeleton-topbar-actions i::after,
            .smg-home-skeleton-feed-head i::after,
            .smg-home-skeleton-feed-head span::after,
            .smg-home-skeleton-section-divider::after,
            .smg-home-skeleton-section-title::after,
            .smg-home-skeleton-line::after,
            .smg-home-skeleton-notices-head i::after,
            .smg-home-skeleton-notices-title::after,
            .smg-home-skeleton-notices-badge::after,
            .smg-home-skeleton-notices-line::after {
                content: ""; position: absolute; inset: 0; transform: translateX(-100%);
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.075), transparent);
                animation: smg-skel-shimmer 1.3s ease-in-out infinite;
            }
            .smg-home-skeleton-card-thumb { position: absolute; inset: 0 0 34%; background: rgba(255,255,255,0.045); }
            .smg-home-skeleton-card-body { position: absolute; left: 0; right: 0; bottom: 0; padding: 28px 13px 13px; background: linear-gradient(to top, rgba(0,0,0,0.62), transparent); }
            .smg-home-skeleton-line { position: relative; width: 88%; height: 11px; margin-bottom: 8px; border-radius: 5px; background: rgba(255,255,255,0.10); overflow: hidden; }
            .smg-home-skeleton-line.short { width: 62%; margin-bottom: 0; }
            .smg-home-skeleton-sections { display: grid; gap: 36px; padding-bottom: 10vh; }
            .smg-home-skeleton-section-head { display: flex; align-items: center; gap: 16px; margin: 0 2px 16px; }
            .smg-home-skeleton-section-title { flex: 0 0 190px; position: relative; width: 190px; height: 13px; margin: 0; border-radius: 6px; background: rgba(255,255,255,0.12); overflow: hidden; }
            .smg-home-skeleton-section-divider { position: relative; flex: 1 1 auto; height: 1px; min-width: 0; background: rgba(255,255,255,0.10); overflow: hidden; }
            .smg-home-skeleton-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; }
            .smg-home-skeleton-tile { position: relative; min-height: 158px; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; background: rgba(255,255,255,0.055); overflow: hidden; }
            .smg-home-skeleton-tile::before { content: ""; position: absolute; top: 24px; left: 50%; width: 58px; height: 58px; border-radius: 16px; transform: translateX(-50%); background: rgba(255,255,255,0.08); }
            .smg-home-skeleton-tile .smg-home-skeleton-line { position: absolute; top: 101px; left: 20%; width: 60%; margin: 0; }
            .smg-home-skeleton-tile .smg-home-skeleton-line.short { top: 124px; left: 30%; width: 40%; }
            .smg-home-skeleton-bottom-nav { display: none; }
            @media (max-width: 1180px) { .smg-home-skeleton-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
            @media (max-width: 820px) { .smg-home-skeleton-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
            @media (max-width: 992px) {
                .smg-home-skeleton-topbar { height: 52px; padding: 0 14px; }
                .smg-home-skeleton-topbar-logo { width: 100px; height: 24px; }
                .smg-home-skeleton-topbar-nav { display: none; }
                .smg-home-skeleton-topbar-actions { margin-left: auto; gap: 10px; }
            }
            @media (max-width: 800px) {
                .smg-home-skeleton-main { width: 100%; max-width: none; padding-left: 16px; padding-right: 16px; }
            }
            @media (max-width: 600px) {
                .smg-home-skeleton-topbar { height: calc(54px + env(safe-area-inset-top)); padding: env(safe-area-inset-top) 14px 0; }
                .smg-home-skeleton-topbar-logo { width: 100px; height: 24px; }
                .smg-home-skeleton-topbar-nav { display: none; }
                .smg-home-skeleton-topbar-actions { margin-left: auto; gap: 10px; }
                .smg-home-skeleton-main { width: 100%; padding: 12px 12px 32px; }
                .smg-home-skeleton-main { padding-bottom: calc(32px + 54px + env(safe-area-inset-bottom)); }
                .smg-home-skeleton-notices { margin-bottom: 16px; border-radius: 12px; }
                .smg-home-skeleton-notices-head { height: 42px; padding: 0 11px; }
                .smg-home-skeleton-notices-body { padding: 7px 9px 9px; }
                .smg-home-skeleton-feed { margin-bottom: 28px; padding: 10px 12px 14px; border-radius: 16px; }
                .smg-home-skeleton-feed-head { margin-bottom: 12px; }
                .smg-home-skeleton-card { flex-basis: 210px; }
                .smg-home-skeleton-sections { gap: 26px; padding-bottom: 8vh; }
                .smg-home-skeleton-section-head { gap: 10px; margin-bottom: 12px; }
                .smg-home-skeleton-section-title { flex-basis: 132px; width: 132px; }
                .smg-home-skeleton-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
                .smg-home-skeleton-tile { min-height: 136px; }
                .smg-home-skeleton-tile::before { top: 16px; width: 50px; height: 50px; border-radius: 14px; }
                .smg-home-skeleton-tile .smg-home-skeleton-line { top: 82px; }
                .smg-home-skeleton-tile .smg-home-skeleton-line.short { top: 105px; }
                .smg-home-skeleton-bottom-nav {
                    position: absolute; left: 0; right: 0; bottom: 0; z-index: 2;
                    display: flex; align-items: center; justify-content: space-around; gap: 2px;
                    height: calc(54px + env(safe-area-inset-bottom)); padding: 0 6px env(safe-area-inset-bottom);
                    border-top: 1px solid rgba(255,255,255,0.08); background: var(--smg-bg, #101113);
                }
                .smg-home-skeleton-bottom-nav i {
                    position: relative; display: block; width: 22px; height: 22px; border-radius: 7px; overflow: hidden;
                    background: rgba(255,255,255,0.09);
                }
                .smg-home-skeleton-bottom-nav i::after {
                    content: ""; position: absolute; inset: 0; transform: translateX(-100%);
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.075), transparent);
                    animation: smg-skel-shimmer 1.3s ease-in-out infinite;
                }
            }
            html.smg-home .p-body-content { order: 2 !important; padding-left: 0 !important; padding-right: 0 !important; }   /* mata o padding-right:20px do tema (.p-body-main--withSidebar) que desalinhava a home */
            html.smg-home .p-body-sidebar { order: 1 !important; margin: 0 0 22px !important; padding: 0 !important; }
            html.smg-home .p-body-sidebar .block { margin: 0 !important; }
            html.smg-home .p-body-sidebar .uix_sidebarInner { margin: 0 !important; }
            /* todo widget da sidebar vira card rounded com destaque */
            html.smg-home .p-body-sidebar .block .block-container {
                background: rgba(255,255,255,0.035) !important; border: 1px solid rgba(255,255,255,0.09) !important;
                border-radius: 16px !important; overflow: hidden;
            }
            html.smg-home .p-body-sidebar .block-minorHeader,
            html.smg-home .p-body-sidebar .block-header {
                background: rgba(255,255,255,0.03) !important; border-bottom: 1px solid rgba(255,255,255,0.07) !important;
                padding: 12px 16px !important; font-size: 14px !important; font-weight: 700 !important;
            }
            /* ---- home: FEED com abas (Latest posts · Trending) — scroll horizontal, painel em DESTAQUE ---- */
            /* hero shelf: surface elevada NEUTRA (sem tingir de rosa) → destaca das sections (transparentes) só pela elevação */
            html.smg-home .smg-feed-block { margin: 8px 0 40px !important; padding: 14px 18px 20px; background: var(--smg-s1, #16171b); border: 1px solid var(--smg-bd); border-radius: 20px; box-shadow: 0 10px 34px rgba(0,0,0,0.34); overflow: visible; }
            @media (max-width: 600px) { html.smg-home .smg-feed-block { padding: 10px 12px 14px; border-radius: 16px; margin-bottom: 30px !important; } }
            /* tabbar = "header" da section (pills + borda inferior, igual às outras sections) */
            html.smg-home .smg-feed-tabs { display: flex; align-items: center; gap: 8px; padding: 0 2px; margin: 0 0 18px; background: transparent; border-bottom: 1px solid var(--smg-bd); }
            /* tabs scrollam aqui; o "See all" + notices ficam fora desse scroll, à direita */
            html.smg-home .smg-feed-tablist { display: flex; gap: 2px; flex: 1 1 auto; min-width: 0; overflow-x: auto; overflow-y: hidden; scrollbar-width: none; }
            html.smg-home .smg-feed-tablist::-webkit-scrollbar { display: none; }
            /* abas = sublinhado-accent (mesma linguagem do header do Feed): chrome neutro, rosa SÓ no item ativo */
            html.smg-home .smg-feed-tab {
                position: relative;
                display: inline-flex; align-items: center; gap: 7px; flex: 0 0 auto; height: 44px; padding: 0 13px;
                border: 0; background: transparent; color: rgba(255,255,255,0.5);
                font-size: 14px; font-weight: 700; letter-spacing: .005em; cursor: pointer; white-space: nowrap; transition: color .15s ease;
            }
            html.smg-home .smg-feed-tab:hover { color: rgba(255,255,255,0.86); }
            html.smg-home .smg-feed-tab.is-active { color: #fff; }
            html.smg-home .smg-feed-tab::after { content: ""; position: absolute; left: 11px; right: 11px; bottom: -1px; height: 2.5px; border-radius: 3px 3px 0 0; background: var(--smg-link, #ff77b2); transform: scaleX(0); transition: transform .2s ease; }
            html.smg-home .smg-feed-tab.is-active::after { transform: scaleX(1); }
            html.smg-home .smg-feed-tab-ic { display: inline-flex; }
            html.smg-home .smg-feed-tab-ic svg { width: 16px; height: 16px; fill: none !important; }
            /* "See all" → empurrado pra direita da tabbar; vai pra página da aba ativa */
            html.smg-home .smg-feed-seeall { flex: 0 0 auto; align-self: center; display: inline-flex; align-items: center; gap: 5px; padding: 0 2px 0 8px; color: rgba(255,255,255,0.6); font-size: 12.5px; font-weight: 600; text-decoration: none; white-space: nowrap; transition: color .14s ease; }
            html.smg-home .smg-feed-seeall:hover { color: #fff; }
            html.smg-home .smg-feed-seeall svg { display: block; }
            /* corpo: scroll horizontal de cards (mobile-friendly), com setas ‹ › no desktop */
            html.smg-home .smg-feed-scroll { position: relative; }
            html.smg-home .smg-feed-panel { display: none; }
            html.smg-home .smg-feed-panel.is-active { display: flex; gap: 14px; padding: 2px; overflow-x: auto; overflow-y: hidden; scroll-snap-type: x proximity; scrollbar-width: none; -ms-overflow-style: none; }
            html.smg-home .smg-feed-panel::-webkit-scrollbar { display: none; }
            /* CARD IMERSIVO: a imagem preenche o tile (3:4); título/meta flutuam no rodapé sobre um scrim. Imagem em 1º plano, menos chrome. */
            html.smg-home .smg-feed-card {
                position: relative; flex: 0 0 230px; width: 230px; aspect-ratio: 3 / 4; scroll-snap-align: start;
                display: block; border-radius: 16px; overflow: hidden;
                background: var(--smg-s2); border: 1px solid var(--smg-bd); text-decoration: none;
                transition: transform .16s ease, border-color .16s ease, box-shadow .16s ease;
            }
            html.smg-home .smg-feed-card:hover { transform: translateY(-4px); border-color: var(--smg-bd2); box-shadow: 0 16px 36px rgba(0,0,0,0.5); }
            html.smg-home .smg-feed-card-thumb { position: absolute; inset: 0; width: 100%; height: 100%; background: var(--smg-s2); overflow: hidden; display: block; }
            html.smg-home .smg-feed-card-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .45s cubic-bezier(.2,.7,.3,1); }
            html.smg-home .smg-feed-card:hover .smg-feed-card-thumb img { transform: scale(1.07); }   /* zoom suave da mídia no hover */
            html.smg-home .smg-feed-card-thumb.smg-feed-noimg { display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 38%, var(--smg-s3), var(--smg-s1)); }
            html.smg-home .smg-feed-card-thumb.smg-feed-noimg .smg-ph-word { font-size: 32px; opacity: .5; }
            html.smg-home .smg-feed-card-body { position: absolute; left: 0; right: 0; bottom: 0; z-index: 2; padding: 28px 13px 13px; display: flex; flex-direction: column; gap: 5px; min-width: 0; background: linear-gradient(to top, rgba(0,0,0,0.94) 6%, rgba(0,0,0,0.7) 38%, rgba(0,0,0,0.18) 78%, transparent 100%); }
            html.smg-home .smg-feed-skel .smg-feed-card-body { background: none; }
            html.smg-home .smg-feed-card-title { font-size: 13.5px; font-weight: 600; color: #fff; line-height: 1.32; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-shadow: 0 1px 3px rgba(0,0,0,0.55); }
            html.smg-home .smg-feed-card-title .label,
            html.smg-home .smg-feed-card-title .prefix {
                margin-right: 3px !important;
                font-size: 9px !important;
                padding: 1px 4.5px !important;
                border-radius: 3.5px !important;
                line-height: 1.2 !important;
            }
            html.smg-home .smg-feed-card-meta { font-size: 11.5px; color: rgba(255,255,255,0.78); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
            html.smg-home .smg-feed-loading { width: 100%; padding: 40px; text-align: center; color: rgba(255,255,255,0.45); font-size: 13px; }
            /* skeletons de loading (cards-fantasma com shimmer) */
            html.smg-home .smg-feed-skel { pointer-events: none; }
            html.smg-home .smg-skel-box, html.smg-home .smg-skel-line { position: relative; overflow: hidden; background: var(--smg-s2); }
            html.smg-home .smg-feed-skel .smg-feed-card-thumb { background: var(--smg-s2); }
            html.smg-home .smg-skel-line { height: 11px; border-radius: 5px; margin-bottom: 7px; }
            html.smg-home .smg-skel-line--short { width: 60%; }
            html.smg-home .smg-skel-line--meta { width: 45%; height: 9px; margin-top: 5px; margin-bottom: 0; }
            html.smg-home .smg-skel-box::after, html.smg-home .smg-skel-line::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent); animation: smg-skel-shimmer 1.3s ease-in-out infinite; }
            @keyframes smg-skel-shimmer { 100% { transform: translateX(100%); } }
            html.smg-home .smg-feed-nav { position: absolute; top: 50%; transform: translateY(-50%); z-index: 4; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; cursor: pointer; color: #fff; line-height: 0; border: 1px solid var(--smg-bd2); background: rgba(20,20,20,0.94); box-shadow: 0 6px 18px rgba(0,0,0,0.5); transition: background .15s ease, transform .12s ease, opacity .18s ease, visibility .18s; }   /* PERF: removido backdrop-filter blur(8px) — botão flutua sobre o carrossel que rola; bg 0.94 já é legível sem o blur */
            html.smg-home .smg-feed-nav:hover { background: rgba(46,46,46,0.96); }
            html.smg-home .smg-feed-nav:active { transform: translateY(-50%) scale(0.9); }
            html.smg-home .smg-feed-nav svg { width: 18px; height: 18px; fill: none !important; }
            html.smg-home .smg-feed-prev { left: -7px; }
            html.smg-home .smg-feed-next { right: -7px; }
            html.smg-home .smg-feed-nav.smg-nav-hidden { opacity: 0; visibility: hidden; pointer-events: none; }
            @media (max-width: 600px) {
                html.smg-home .smg-feed-card { flex-basis: 210px; width: 210px; }
                html.smg-home .smg-feed-nav { display: none; }
            }

            /* sections: minimalistas — grupo transparente, sem caixa pesada (cards é que têm presença) */
            html.smg-home .block--category {
                margin-bottom: 34px !important; border-radius: 0 !important;
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
                padding: 0 2px 12px !important; margin: 0 0 16px !important;
                font-size: 12.5px !important; font-weight: 700 !important; letter-spacing: .14em; text-transform: uppercase;
                color: rgba(255,255,255,0.55) !important;
                border: 0 !important; border-bottom: 1px solid var(--smg-bd) !important;
            }
            html.smg-home .block--category .block-header a,
            html.smg-home .block--category .uix_categoryTitle { color: #fff !important; }
            html.smg-home .block--category .categoryCollapse--trigger { position: absolute !important; right: 16px; top: 50%; transform: translateY(-50%); margin: 0 !important; }
            html.smg-home .block--category .block-body {
                display: grid !important;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) !important;
                gap: 14px !important; padding: 0 !important; background: transparent !important; border: 0 !important;
            }
            /* SMG: 5 colunas (igual SimpCity), caindo de 1 em 1 por breakpoint */
            html.smg-smg.smg-home .block--category .block-body { grid-template-columns: repeat(5, minmax(0, 1fr)) !important; }
            @media (max-width: 1180px) { html.smg-smg.smg-home .block--category .block-body { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; } }
            @media (max-width: 820px)  { html.smg-smg.smg-home .block--category .block-body { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; } }
            /* mobile: 2 colunas nas sections (os dois sites) */
            @media (max-width: 600px) {
                html.smg-home .block--category .block-body,
                html.smg-smg.smg-home .block--category .block-body {
                    grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 9px !important; padding: 10px !important;
                }
                /* divider: dá um respiro no texto pra alinhar com os cards (inset de 10px no mobile) */
                html.smg-home .block--category .block-header { padding-left: 12px !important; }
                html.smg-home .block--category .node { min-height: 136px !important; }
                html.smg-home .node-body { padding: 14px 10px !important; gap: 7px !important; }
                html.smg-home .node-icon { width: 50px !important; height: 50px !important; padding: 7px !important; }
                html.smg-home .node-title { font-size: 13.5px !important; }
            }
            /* home: remove a linha do header da página (título + New Posts/Post Thread) — vai pro botão "Novo" da topbar */
            html.smg-home .p-body-header { display: none !important; }
            html.smg-home .block--category .node {
                border: 1px solid var(--smg-bd) !important;
                border-radius: 14px !important;
                background: var(--smg-s1) !important;
                overflow: visible !important;
                min-height: 180px !important;
                transition: background .16s ease, border-color .16s ease, transform .16s ease, box-shadow .16s ease;
            }
            /* SMG: cards da home na MESMA cor/rounding do SimpCity (o tema SMG deixava mais claro e o --smg-s1 é 13.5%). Especificidade alta + !important. */
            /* XADREZ (igual SimpCity): card sim/card não. ímpar = 12.5%, par = 9.5%. 5 colunas (ímpar) → alterna em 2D.
               node-body transparente → o bg do node aparece; overflow:hidden corta o vazamento do canto arredondado. */
            html.smg-smg.smg-home .block--category .node { background-color: hsl(0 0% 12.5%) !important; border-radius: 14px !important; overflow: hidden !important; }
            html.smg-smg.smg-home .block--category .block-body > .node:nth-child(even) { background-color: hsl(0 0% 11%) !important; }
            html.smg-smg.smg-home .block--category .node-body { background: transparent !important; }
            html.smg-smg.smg-home .block--category .block-body > .node:hover { background-color: hsl(0 0% 16%) !important; }
            /* nada de truncar/cortar conteúdo dentro do card */
            html.smg-home .node-title, html.smg-home .node-title a,
            html.smg-home .node-description, html.smg-home .node-extra-title {
                white-space: normal !important; overflow: visible !important; text-overflow: clip !important;
            }
            html.smg-home .block--category .node:hover {
                background: var(--smg-s2) !important;
                border-color: var(--smg-bd2) !important; transform: translateY(-3px);
                box-shadow: 0 12px 28px rgba(0,0,0,0.42) !important;   /* elevação no hover (best-practice dark: profundidade na interação, não só borda) */
            }
            /* card centralizado: ÍCONE / NOME / subtítulo · card inteiro clicável */
            html.smg-home .block--category .node { display: flex !important; cursor: pointer; }
            html.smg-home .node-body {
                flex: 1 1 auto !important;
                display: flex !important; flex-direction: column !important;
                align-items: center !important; justify-content: center !important;
                text-align: center !important; gap: 9px !important; padding: 16px 12px !important;   /* densificado: menos espaço morto, card mais "app tile" */
            }
            html.smg-home .node-icon {
                width: 60px !important; height: 60px !important; margin: 0 0 2px !important; padding: 8px !important; box-sizing: border-box !important;
                display: flex !important; align-items: center; justify-content: center;
                background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px;
                transition: transform .18s ease, border-color .18s ease, background .18s ease;
            }
            html.smg-home .block--category .node:hover .node-icon { transform: scale(1.08) translateY(-1px); background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.16); }   /* microinteração: ícone "salta" no hover */
            html.smg-home .node-icon img { width: auto !important; height: auto !important; max-width: 100% !important; max-height: 100% !important; border-radius: 9px !important; object-fit: contain !important; }
            html.smg-home .node-icon i { font-size: 28px; display: inline-flex; }
            html.smg-home .node-icon i svg, html.smg-home .node-icon > svg { width: 28px !important; height: 28px !important; color: rgba(255,255,255,0.75); }
            html.smg-home .node-icon .node-icon-fix-verti { width: auto !important; height: auto !important; }
            html.smg-home .node-icon .node-icon-fix-verti img { width: 46px !important; height: 46px !important; max-width: 46px !important; max-height: 46px !important; }
            html.smg-home .node-main { min-width: 0 !important; width: 100% !important; }
            html.smg-home .node-title { font-size: 15px !important; font-weight: 700 !important; justify-content: center !important; line-height: 1.3 !important; }
            html.smg-home .node-title a { color: #fff !important; }
            html.smg-home .node-description { font-size: 12.5px !important; color: rgba(255,255,255,0.5) !important; margin-top: 3px; }
            /* tira último post, estatísticas e a lista de subitems (viram cards próprios) */
            html.smg-home .node-meta,
            html.smg-home .node-stats,
            html.smg-home .node-extra,
            html.smg-home .node-subNodesFlat { display: none !important; }

            /* remove ads/links promocionais e blocos de anúncio na home
               PERF: .smg-ad-block é marcado pelo JS (markHomeAdBlocks, 16-home) — substitui o
               :has(> .block-container > .block-body > .node--link), reavaliado a cada mutação da home */
            html.smg-home .node--link { display: none !important; }
            html.smg-home .block.smg-ad-block { display: none !important; }
            html.smg-home .samLinkUnit, html.smg-home .samCodeUnit { display: none !important; }

            /* daily login streak (SMG): o bloco é REMOVIDO pelo JS (layoutHomeSidebar) — as regras
               :has(.streakStats) que estilizavam o flash pré-boot foram deletadas (custavam invalidação
               por mutação na home inteira p/ um bloco que some no DOMContentLoaded). */
            html.smg-home .streakStats { display: flex !important; flex-wrap: wrap; align-items: center; justify-content: center; gap: 10px 26px !important; }
            html.smg-home .streakStats > .pairs { text-align: center; margin: 0 !important; }
            html.smg-home .streakStats > .pairs dd strong { font-size: 23px !important; font-weight: 800 !important; line-height: 1; }
            html.smg-home .streakStats > .pairs dt { font-size: 11.5px !important; color: rgba(255,255,255,0.55) !important; margin-top: 3px; }
            html.smg-home .streakCounters { display: flex !important; gap: 6px !important; margin: 0 !important; }
            html.smg-home .streakCounters .pairs {
                display: flex !important; flex-direction: column; align-items: center; justify-content: center;
                width: 40px; height: 48px; margin: 0 !important;
                border-radius: 11px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            }
            html.smg-home .streakCounters .pairs dt { font-size: 11px !important; color: rgba(255,255,255,0.6) !important; }
            html.smg-home .dailyLogin-burningStreak { color: #ff8a3d !important; }
            html.smg-home .dailyLogin-bestStreak { color: #ffd24a !important; }

            /* ===== páginas de FÓRUM (forum_view) que listam SUB-FÓRUNS: mesmos cards da home ===== */
            /* escopado em .block--category → só pega o bloco de sub-fóruns; a lista de threads é estilizada à parte */
            html.smg-threadlist .block--category {
                margin-bottom: 28px !important; border: 0 !important; background: transparent !important;
                box-shadow: none !important; border-radius: 0 !important; overflow: visible !important;
            }
            html.smg-threadlist .block--category .block-container,
            html.smg-threadlist .block--category .uix_block-body--outer {
                background: transparent !important; border: 0 !important; box-shadow: none !important;
            }
            html.smg-threadlist .block--category .block-header {
                display: flex !important; align-items: center; position: relative;
                background: transparent !important; padding: 0 2px 12px !important; margin: 0 0 16px !important;
                font-size: 12.5px !important; font-weight: 700 !important; letter-spacing: .14em; text-transform: uppercase;
                color: rgba(255,255,255,0.55) !important; border: 0 !important; border-bottom: 1px solid var(--smg-bd) !important;
            }
            html.smg-threadlist .block--category .block-header a,
            html.smg-threadlist .block--category .uix_categoryTitle { color: #fff !important; }
            html.smg-threadlist .block--category .categoryCollapse--trigger { position: absolute !important; right: 16px; top: 50%; transform: translateY(-50%); margin: 0 !important; }
            /* .smg-has-nodes marcado pelo JS (markCategoryNodeBlocks, 15-listing) no lugar do :has(.node) */
            html.smg-threadlist .block--category.smg-has-nodes .block-body {
                display: grid !important; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
                gap: 14px !important; padding: 0 !important; background: transparent !important; border: 0 !important;
            }
            html.smg-threadlist .block--category .node {
                display: flex !important; cursor: pointer; border: 1px solid var(--smg-bd) !important;
                border-radius: 14px !important; background: var(--smg-s1) !important; overflow: visible !important;
                transition: background .16s ease, border-color .16s ease, transform .14s ease;
            }
            html.smg-threadlist .block--category .node:hover {
                background: var(--smg-s2) !important; border-color: var(--smg-bd2) !important; transform: translateY(-2px);
            }
            html.smg-threadlist .block--category .node-body {
                flex: 1 1 auto !important; display: flex !important; flex-direction: column !important;
                align-items: center !important; justify-content: center !important; text-align: center !important;
                gap: 9px !important; padding: 20px 14px !important;
            }
            html.smg-threadlist .block--category .node-icon {
                width: 66px !important; height: 66px !important; margin: 0 0 2px !important; padding: 9px !important; box-sizing: border-box !important;
                display: flex !important; align-items: center; justify-content: center;
                background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px;
            }
            html.smg-threadlist .block--category .node-icon img { width: auto !important; height: auto !important; max-width: 100% !important; max-height: 100% !important; border-radius: 9px !important; object-fit: contain !important; }
            html.smg-threadlist .block--category .node-icon i { font-size: 28px; display: inline-flex; }
            html.smg-threadlist .block--category .node-icon i svg,
            html.smg-threadlist .block--category .node-icon > svg { width: 28px !important; height: 28px !important; color: rgba(255,255,255,0.75); }
            html.smg-threadlist .block--category .node-main { min-width: 0 !important; width: 100% !important; }
            html.smg-threadlist .block--category .node-title { font-size: 15px !important; font-weight: 700 !important; justify-content: center !important; line-height: 1.3 !important; white-space: normal !important; }
            html.smg-threadlist .block--category .node-title a { color: #fff !important; }
            html.smg-threadlist .block--category .node-description { font-size: 12.5px !important; color: rgba(255,255,255,0.5) !important; margin-top: 3px; white-space: normal !important; }
            html.smg-threadlist .block--category .node-meta,
            html.smg-threadlist .block--category .node-stats,
            html.smg-threadlist .block--category .node-extra,
            html.smg-threadlist .block--category .node-subNodesFlat { display: none !important; }
            @media (max-width: 600px) {
                html.smg-threadlist .block--category.smg-has-nodes .block-body { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 9px !important; }
                html.smg-threadlist .block--category .node-body { padding: 14px 10px !important; gap: 7px !important; }
                html.smg-threadlist .block--category .node-icon { width: 50px !important; height: 50px !important; padding: 7px !important; }
                html.smg-threadlist .block--category .node-title { font-size: 13.5px !important; }
            }

            `;
