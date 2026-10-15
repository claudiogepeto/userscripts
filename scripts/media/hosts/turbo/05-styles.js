
(function () {
    "use strict";
    if (window.top !== window.self) return;

    const PATH = location.pathname;
    const isVideo = /\/(?:v|embed)\//.test(PATH);
    const isAlbum = /\/a\//.test(PATH);
    document.documentElement.classList.add("tb");
    if (isVideo) document.documentElement.classList.add("tb-file");
    if (isAlbum) document.documentElement.classList.add("tb-album");

    const ACCENT = "#f97316";
    const THUMB_BASE = "https://thumbs.saint2.cr/thumbs/";

    const CSS = `
        /* ===================== TEMA AMOLED ===================== */
        html.tb, html.tb body { background: #0b0c0f !important; color: #e9e9ee !important; }
        html.tb ::selection { background: rgba(249,115,22,0.35); }
        html.tb ::-webkit-scrollbar { width: 8px; height: 8px; }
        html.tb ::-webkit-scrollbar-thumb { background: #262930; border-radius: 8px; }

        /* ===================== EARLY PAINT (vídeo): tampa preta até o stage montar ===================== */
        html.tb-file::before { content: ""; position: fixed; inset: 0; background: #0b0c0f; z-index: 98000; pointer-events: none; }
        html.tb-file.tb-fallback::before { display: none; }
        html.tb-has-stage, html.tb-has-stage body { overflow: hidden !important; }

        /* ===================== STAGE THEATER EM 2 COLUNAS ===================== */
        .tb-stage { position: fixed; inset: 0; z-index: 99000; display: flex; flex-direction: row; background: #0b0c0f; color: #fff; font-family: Inter, system-ui, sans-serif; }
        .tb-stage * { box-sizing: border-box; }

        /* Coluna Principal (Esquerda) */
        .tb-stage-main { flex: 1 1 auto; min-width: 0; height: 100%; display: flex; flex-direction: column; overflow: hidden; position: relative; }
        .tb-stage-mid { position: relative; flex: 1 1 auto; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 0 !important; overflow: hidden; background: #000; }

        /* Topbar VROW */
        .tb-vrow {
            flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 8px;
            padding: 8px 14px; background: #0e0f13; border-bottom: 1px solid rgba(255,255,255,.08);
            overflow-x: auto; white-space: nowrap; scrollbar-width: thin;
        }
        .tb-vrow-top { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1 1 auto; }
        .tb-vrow-sub { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }

        .tb-top-logo { display: inline-flex; align-items: center; gap: 7px; color: #fff; text-decoration: none; font-weight: 800; font-size: 15px; padding: 4px 6px; border-radius: 6px; transition: opacity .12s; flex: 0 0 auto; }
        .tb-top-logo:hover { opacity: 0.85; }
        .tb-logo-img { height: 22px; width: 22px; display: block; object-fit: contain; }

        .tb-name { flex: 0 1 auto; min-width: 60px; max-width: 44vw; display: inline-flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13.5px; color: #fff; }
        .tb-name svg { color: var(--tb-accent, #f97316); flex: 0 0 auto; width: 16px; height: 16px; }
        .tb-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .tb-stats { display: flex; align-items: center; gap: 12px; padding: 0 6px; flex: 0 0 auto; }
        .tb-stat { font-size: 12px; color: rgba(255,255,255,.62); font-weight: 600; }
        .tb-spacer { flex: 1 1 auto; min-width: 8px; }

        .tb-item {
            display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 11px;
            border: 1px solid rgba(255,255,255,.1); border-radius: 8px; background: rgba(255,255,255,.05);
            color: #fff; font: 600 12.5px/1 Inter, system-ui, sans-serif; cursor: pointer; text-decoration: none;
            transition: background .12s, border-color .12s; white-space: nowrap;
        }
        .tb-item:hover { background: rgba(255,255,255,.1); border-color: rgba(249,115,22,0.45); }
        .tb-item svg { width: 15px; height: 15px; color: var(--tb-accent, #f97316); }
        .tb-item.is-primary { background: var(--tb-accent, #f97316); border-color: var(--tb-accent, #f97316); color: #1c0a00 !important; font-weight: 700; }
        .tb-item.is-primary svg { color: #1c0a00 !important; }
        .tb-vrow-playlist.is-active { background: rgba(249,115,22,0.2); border-color: var(--tb-accent, #f97316); color: #fdba74; }
        .tb-vsep { flex: 0 0 auto; width: 1px; height: 20px; margin: 0 2px; background: rgba(255,255,255,.1); }

        /* ===================== PLAYER ESTILO YOUTUBE ===================== */
        :root { --tb-accent: ${ACCENT}; }
        .tb-host, .tb-img-host { position: relative; width: 100%; height: 100%; max-width: 100%; max-height: 100%; background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .tb-image { display: block; max-width: 100%; max-height: 100%; object-fit: contain; cursor: zoom-in; user-select: none; -webkit-user-drag: none; transform-origin: center center; touch-action: none; }
        .tb-img-host.is-zoomed .tb-image { cursor: grab; }
        .tb-img-host.is-zoomed .tb-image:active { cursor: grabbing; }
        .tb-video { width: 100% !important; height: 100% !important; max-width: 100% !important; max-height: 100% !important; object-fit: contain !important; background: #000 !important; outline: none; cursor: pointer; display: block; }
        .tb-stage-mid > iframe { width: 100% !important; height: 100% !important; border: 0; background: #000; }

        .tb-spin { position: absolute; top: 50%; left: 50%; width: 42px; height: 42px; margin: -21px 0 0 -21px; border-radius: 50%; border: 3px solid rgba(255,255,255,.22); border-top-color: var(--tb-accent, #f97316); animation: tb-spin .8s linear infinite; z-index: 4; pointer-events: none; }
        @keyframes tb-spin { to { transform: rotate(360deg); } }

        .tb-plc-flash { position: absolute; inset: 0; z-index: 2; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .2s ease; }
        .tb-pl:not(.is-playing):not(.is-buffering) .tb-plc-flash { opacity: 1; pointer-events: auto; cursor: pointer; }
        .tb-plc-flash button { border: 0; border-radius: 50%; cursor: pointer; padding: 0; background: rgba(0,0,0,.6); color: #fff; display: flex; align-items: center; justify-content: center; transition: transform .12s ease, background .12s ease; pointer-events: auto; }
        .tb-plc-flash button:hover { transform: scale(1.08); background: rgba(0,0,0,.8); }
        .tb-plc-play { width: 64px; height: 64px; }
        .tb-plc-play svg { width: 28px; height: 28px; display: block; margin-left: 3px; }

        .tb-plc-seekflash { position: absolute; top: 50%; transform: translate(-50%, -50%); z-index: 3; padding: 9px 18px; border-radius: 24px; background: rgba(0,0,0,.75); color: #fff; font: 700 15px/1 Inter, sans-serif; pointer-events: none; opacity: 0; transition: opacity .15s ease; }
        .tb-plc-seekflash.on { opacity: 1; }

        .tb-pl.is-buffering::after { content: ""; position: absolute; top: 50%; left: 50%; width: 42px; height: 42px; margin: -21px 0 0 -21px; border-radius: 50%; border: 3px solid rgba(255,255,255,.22); border-top-color: var(--tb-accent, #f97316); animation: tb-spin .8s linear infinite; z-index: 4; pointer-events: none; }

        .tb-plc-bottom {
            position: absolute; left: 0; right: 0; bottom: 0; z-index: 4; display: flex; flex-direction: column;
            padding: 0 14px 10px; background: linear-gradient(to top, rgba(0,0,0,.9) 0%, rgba(0,0,0,.45) 65%, transparent 100%);
            opacity: 0; pointer-events: none; transition: opacity .18s ease; gap: 4px;
        }
        .tb-host:hover .tb-plc-bottom, .tb-pl:not(.is-playing) .tb-plc-bottom, .tb-img-host:hover .tb-plc-bottom, .tb-img-host:focus-within .tb-plc-bottom { opacity: 1; pointer-events: auto; }
        @media (hover: none) { .tb-plc-bottom { opacity: 1; pointer-events: auto; } }

        .tb-plc-prog { position: relative; width: 100%; height: 16px; display: flex; align-items: center; cursor: pointer; touch-action: none; }
        .tb-plc-bar { position: relative; width: 100%; height: 3.5px; background: rgba(255,255,255,.25); border-radius: 2px; transition: height .1s ease; }
        .tb-plc-prog:hover .tb-plc-bar { height: 5px; }
        .tb-plc-buf { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: rgba(255,255,255,.38); border-radius: 2px; pointer-events: none; }
        .tb-plc-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: var(--tb-accent, #f97316); border-radius: 2px; pointer-events: none; }
        .tb-plc-knob { position: absolute; right: -6px; top: 50%; transform: translateY(-50%) scale(0); width: 12px; height: 12px; border-radius: 50%; background: var(--tb-accent, #f97316); box-shadow: 0 0 4px rgba(0,0,0,.5); transition: transform .1s ease; }
        .tb-plc-prog:hover .tb-plc-knob { transform: translateY(-50%) scale(1); }

        .tb-plc-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
        .tb-plc-left, .tb-plc-right { display: flex; align-items: center; gap: 3px; }
        .tb-plc-act { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: 0; background: transparent; color: #fff; cursor: pointer; border-radius: 50%; font: 600 13px/1 Inter, sans-serif; transition: background .12s, color .12s; }
        .tb-plc-act:hover { background: rgba(255,255,255,.14); color: var(--tb-accent, #f97316); }
        .tb-plc-act.is-active { color: var(--tb-accent, #f97316); }
        .tb-plc-act svg { width: 22px; height: 22px; display: block; }
        .tb-plc-skip { position: relative; }
        .tb-plc-skipn { position: absolute; font-size: 8.5px; font-weight: 800; top: 52%; left: 50%; transform: translate(-50%, -50%); color: #fff; text-shadow: 0 0 2px rgba(0,0,0,.5); }
        .tb-plc-time { font-size: 12px; font-weight: 600; color: rgba(255,255,255,.88); padding: 0 6px; font-variant-numeric: tabular-nums; white-space: nowrap; }

        .tb-plc-vol { display: flex; align-items: center; gap: 2px; }
        .tb-plc-volbar { width: 0; height: 28px; display: flex; align-items: center; cursor: pointer; overflow: hidden; transition: width .18s ease, margin .18s ease; touch-action: none; }
        .tb-plc-vol:hover .tb-plc-volbar, .tb-plc-volbar:hover { width: 62px; margin-right: 4px; }
        .tb-plc-volfill { width: 100%; height: 4px; background: #fff; border-radius: 2px; position: relative; }

        /* Velocidade plana (sem botão pill pesado) */
        .tb-plc-autoplay { width: auto; height: 30px; padding: 0 8px 0 10px; border-radius: 15px; gap: 8px; font: 600 12px/1 Inter, system-ui, sans-serif; color: rgba(255,255,255,.85); background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); }
        .tb-plc-autoplay.is-active { background: rgba(249,115,22,.16); border-color: rgba(249,115,22,.45); color: #fff; }
        .tb-plc-ap-pill { position: relative; width: 28px; height: 16px; border-radius: 9px; background: rgba(255,255,255,.24); display: block; flex: 0 0 28px; }
        .tb-plc-ap-knob { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: #fff; display: block; transition: transform .18s ease; }
        .tb-plc-autoplay.is-active .tb-plc-ap-pill { background: var(--tb-accent, #f97316); }
        .tb-plc-autoplay.is-active .tb-plc-ap-knob { transform: translateX(12px); background: #1c0a00; }
        .tb-plc-speed { width: auto !important; min-width: 32px; padding: 0 6px; color: #fff; font: 700 13px/1 Inter, sans-serif; font-variant-numeric: tabular-nums; background: transparent !important; }
        .tb-plc-speedwrap { position: relative; }
        .tb-plc-speedmenu { position: absolute; bottom: 42px; right: 0; background: rgba(18,20,26,.96); border: 1px solid rgba(255,255,255,.12); border-radius: 10px; padding: 6px; display: none; flex-direction: column; gap: 2px; min-width: 86px; max-height: 240px; overflow-y: auto; box-shadow: 0 10px 28px rgba(0,0,0,.6); z-index: 10; }
        .tb-plc-speedmenu.open { display: flex; }
        .tb-plc-speeditem { border: 0; background: transparent; color: #fff; padding: 6px 10px; font: 600 12.5px/1 Inter, sans-serif; border-radius: 6px; cursor: pointer; text-align: left; }
        .tb-plc-speeditem:hover { background: rgba(255,255,255,.1); }
        .tb-plc-speeditem.on { color: var(--tb-accent, #f97316); font-weight: 800; }

        /* ===================== SIDEBAR DA PLAYLIST ===================== */
        .tb-sidebar {
            width: 380px; flex: 0 0 380px; height: 100%; display: flex; flex-direction: column;
            background: #08090b; border-left: 1px solid rgba(255,255,255,.08); overflow: hidden; z-index: 25;
            transition: width .18s ease, margin .18s ease;
        }
        .tb-stage.is-sidebar-collapsed .tb-sidebar { display: none !important; }

        .tb-sidebar-header {
            display: flex; align-items: center; justify-content: space-between; padding: 12px 14px 8px;
            border-bottom: 1px solid rgba(255,255,255,.06); flex: 0 0 auto;
        }
        .tb-sidebar-title-wrap { display: flex; align-items: center; gap: 8px; }
        .tb-sidebar-icon svg { width: 18px; height: 18px; color: var(--tb-accent, #f97316); }
        .tb-sidebar-title { font-size: 14.5px; font-weight: 700; color: #fff; }
        .tb-sidebar-count { font-size: 11.5px; font-weight: 600; color: rgba(255,255,255,.5); background: rgba(255,255,255,.06); padding: 2px 7px; border-radius: 999px; }
        .tb-sidebar-collapse-btn { background: transparent; border: 0; color: rgba(255,255,255,.5); cursor: pointer; display: flex; padding: 4px; border-radius: 6px; }
        .tb-sidebar-collapse-btn:hover { background: rgba(255,255,255,.08); color: #fff; }
        .tb-sidebar-collapse-btn svg { width: 16px; height: 16px; }

        .tb-sidebar-search {
            position: relative; display: flex; align-items: center; margin: 8px 12px 6px; background: rgba(255,255,255,.05);
            border: 1px solid rgba(255,255,255,.08); border-radius: 8px; padding: 0 8px; flex: 0 0 auto;
        }
        .tb-sidebar-search:focus-within { border-color: var(--tb-accent, #f97316); background: rgba(255,255,255,.08); }
        .tb-sidebar-search-icon svg { width: 14px; height: 14px; color: rgba(255,255,255,.4); margin-right: 6px; }
        .tb-sidebar-search-in { width: 100%; height: 32px; background: transparent; border: 0; outline: none; color: #fff; font: 12.5px Inter, sans-serif; }
        .tb-sidebar-search-in::placeholder { color: rgba(255,255,255,.4); }

        .tb-sidebar-tabs { display: flex; align-items: center; gap: 5px; padding: 4px 12px 6px; overflow-x: auto; scrollbar-width: none; flex: 0 0 auto; }
        .tb-sidebar-tabs::-webkit-scrollbar { display: none; }
        .tb-tab-chip {
            display: inline-flex; align-items: center; gap: 5px; height: 26px; padding: 0 9px; border-radius: 6px;
            background: rgba(255,255,255,.05); border: 1px solid transparent; color: rgba(255,255,255,.6); font: 600 11.5px/1 Inter, sans-serif;
            cursor: pointer; transition: all .12s; white-space: nowrap;
        }
        .tb-tab-chip:hover { background: rgba(255,255,255,.09); color: #fff; }
        .tb-tab-chip.is-active { background: rgba(249,115,22,0.2); border-color: var(--tb-accent, #f97316); color: #fdba74; }
        .tb-tab-count { font-size: 10px; opacity: .75; }

        .tb-sidebar-sort { display: flex; align-items: center; gap: 6px; padding: 4px 12px 6px; font-size: 11px; color: rgba(255,255,255,.5); flex: 0 0 auto; }
        .tb-sort-label { text-transform: uppercase; letter-spacing: .04em; }
        .tb-sort-chip {
            background: transparent; border: 0; color: rgba(255,255,255,.5); font: 600 11px Inter, sans-serif; cursor: pointer; padding: 2px 5px; border-radius: 4px;
        }
        .tb-sort-chip:hover { color: #fff; }
        .tb-sort-chip.is-active { color: var(--tb-accent, #f97316); font-weight: 700; text-decoration: underline; }

        .tb-playlist-list { flex: 1 1 auto; overflow-y: auto; padding: 6px 10px 40px; display: flex; flex-direction: column; gap: 6px; scrollbar-width: thin; }
        .tb-playlist-list::-webkit-scrollbar { width: 5px; }
        .tb-playlist-list::-webkit-scrollbar-thumb { background: #332121; border-radius: 4px; }

        .tb-playlist-item {
            display: flex; gap: 10px; padding: 7px; border-radius: 10px; background: rgba(255,255,255,.03);
            border: 1px solid rgba(255,255,255,.05); cursor: pointer; transition: background .12s, border-color .12s, transform .12s; text-decoration: none; color: inherit;
        }
        .tb-playlist-item:hover { background: rgba(255,255,255,.07); border-color: rgba(249,115,22,.4); transform: translateY(-1px); }
        .tb-playlist-item.is-current { background: rgba(249,115,22,0.14); border-color: var(--tb-accent, #f97316); }
        /* Itens fora da tela não são renderizados (o item atual fica sempre renderizado). */
        .tb-playlist-item:not(.is-current) { content-visibility: auto; flex-shrink: 0; contain-intrinsic-block-size: auto 99px; }

        .tb-playlist-thumb-wrap {
            position: relative; flex: 0 0 176px; width: 176px; height: 99px; border-radius: 8px;
            overflow: hidden; background: #000; display: flex; align-items: center; justify-content: center;
        }
        .tb-playlist-thumb, .tb-playlist-thumb-wrap video { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; background: #000; pointer-events: none; }
        .tb-playlist-kind { position: absolute; top: 6px; left: 6px; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.78); color: #fff; font: 700 10px/1.2 Inter, system-ui, sans-serif; }
        .tb-playlist-num { position: absolute; top: 6px; right: 6px; z-index: 1; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.8); color: #fff; font: 700 11px/1 Inter, system-ui, sans-serif; }
        .tb-playlist-dur { position: absolute; bottom: 5px; right: 6px; z-index: 1; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.8); color: #fff; font: 700 11px/1 Inter, system-ui, sans-serif; }
        .tb-playlist-dur[hidden] { display: none !important; }
        .tb-now-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--tb-accent, #f97316); animation: tb-pulse 1.2s infinite; }

        .tb-playlist-placeholder { width: 100%; height: 100%; background: #0a0505; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
        .tb-playlist-ph-icon svg { width: 22px; height: 22px; color: var(--tb-accent, #f97316); opacity: .75; }
        .tb-playlist-ph-ext { font: 800 9px Inter; letter-spacing: .06em; color: rgba(255,255,255,.5); background: rgba(255,255,255,.08); padding: 1px 5px; border-radius: 3px; }

        .tb-playlist-info { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
        .tb-playlist-name {
            font-size: 14.5px; font-weight: 500; color: rgba(255,255,255,.9); line-height: 1.35; display: -webkit-box;
            -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word;
        }
        .tb-playlist-item.is-current .tb-playlist-name { color: #fdba74; }
        .tb-playlist-meta { font-size: 12.5px; color: rgba(255,255,255,.55); display: flex; align-items: center; gap: 8px; }
        .tb-playlist-meta-active { color: var(--tb-accent, #f97316); font-weight: 700; }
        .tb-playlist-empty { padding: 32px 16px; text-align: center; color: rgba(255,255,255,.5); font-size: 13px; }

        /* Setas laterais do Stage */
        .tb-nav-side { position: absolute; top: 50%; transform: translateY(-50%); z-index: 6; width: 44px; height: 44px; border: 0; border-radius: 50%; background: rgba(0,0,0,.5); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .18s ease, background .12s ease; }
        .tb-nav-prev { left: 16px; } .tb-nav-next { right: 16px; }
        .tb-stage.has-nav .tb-stage-mid:hover .tb-nav-side { opacity: 1; pointer-events: auto; }
        @media (hover: none) { .tb-stage.has-nav .tb-nav-side { opacity: .85; pointer-events: auto; } }
        .tb-nav-side:hover { background: rgba(0,0,0,.74); } .tb-nav-side:active { transform: translateY(-50%) scale(.92); }
        .tb-nav-side svg { width: 24px; height: 24px; display: block; }

        /* ===================== ÁLBUM (/a/): TABELA → GRADE AMOLED ===================== */
        html.tb-album .max-w-6xl { max-width: min(100% - 32px, 1800px) !important; }
        html.tb-album #searchInput, html.tb-album #sortSelect { background: #14161a !important; border-color: rgba(255,255,255,.12) !important; color: #fff !important; }
        html.tb-album #btnDownloadAlbum { background: var(--tb-accent, #f97316) !important; border-color: var(--tb-accent, #f97316) !important; color: #1c0a00 !important; }
        html.tb-album .thumb img { width: 100% !important; height: 100% !important; object-fit: cover !important; background: #000 !important; }
        html.tb-album .thumb:has(img)::after { display: none !important; }
        .tb-sidebar-gallery { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.06); color: #fff; font: 600 12px/1 Inter, system-ui, sans-serif; text-decoration: none; }
        .tb-sidebar-gallery:hover { background: rgba(255,255,255,.12); }
        .tb-sidebar-gallery svg { width: 14px; height: 14px; }
        .tb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 32px 24px; padding: 18px 0; }
        @media (min-width: 1600px) { .tb-grid { grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 36px 28px; } }
        @media (max-width: 768px) { .tb-grid { grid-template-columns: 1fr; gap: 20px 16px; padding: 12px 0; } }

        .tb-card { position: relative; border: 0; border-radius: 14px; overflow: visible; background: transparent; transition: transform .12s ease, border-color .12s ease, box-shadow .12s ease; }
        .tb-card:hover { transform: translateY(-3px); border-color: rgba(249,115,22,0.55); box-shadow: 0 10px 26px rgba(0,0,0,0.5); }
        .tb-card-link { display: block; color: inherit; text-decoration: none; }
        .tb-card-thumb { position: relative; width: 100%; aspect-ratio: 16 / 9; background: #000; overflow: hidden; }
        .tb-card-thumb img, .tb-card-thumb video { width: 100%; height: 100%; object-fit: cover; display: block; background: #000; pointer-events: none; }
        .tb-card-play { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .12s ease; }
        .tb-card:hover .tb-card-play { opacity: 1; }
        .tb-card-play span { width: 48px; height: 48px; border-radius: 50%; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; }
        .tb-card-play svg { width: 22px; height: 22px; color: #fff; }
        .tb-card-body { padding: 10px 12px; }
        .tb-card-name { font-size: 13px; font-weight: 600; color: #e9e9ee; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .tb-card-meta { font-size: 11.5px; color: rgba(255,255,255,0.5); margin-top: 4px; }
        .tb-card-dl { position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; border-radius: 9px; background: rgba(0,0,0,.6); color: #fff; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .12s ease, background .12s ease; text-decoration: none; }
        .tb-card:hover .tb-card-dl { opacity: 1; }
        .tb-card-dl svg { width: 16px; height: 16px; }
        .tb-card-dl:hover { background: var(--tb-accent, #f97316); color: #1c0a00; }
        @media (hover: none) { .tb-card-dl, .tb-card-play { opacity: 1; } }
        .tb-empty { grid-column: 1 / -1; padding: 30px; text-align: center; color: rgba(255,255,255,0.5); }

        /* Datas em texto simples na playlist e galeria */
        .tb-playlist-dates, .tb-card-dates { display: flex; flex-direction: column; gap: 2px; margin-top: 3px; font-size: 11px; color: rgba(255,255,255,.5); }
        .tb-playlist-dates, .tb-card-dates { min-width: 0; }
        .tb-playlist-date-row, .tb-card-date-row { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 12px; line-height: 1.3; white-space: nowrap; overflow: hidden; }
        .tb-playlist-date-lbl, .tb-card-date-lbl { flex: 0 0 auto; white-space: nowrap; }
        .tb-playlist-date-val, .tb-card-date-val { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tb-playlist-date-lbl, .tb-card-date-lbl { color: rgba(255,255,255,.55); font-weight: 600; font-size: 11.5px; }
        .tb-playlist-date-val, .tb-card-date-val { color: rgba(255,255,255,.9); font-weight: 600; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; }

        /* Tooltip sutil e ícone em Data Extraída */
        .tb-has-tip { cursor: help !important; display: inline-flex !important; align-items: center !important; gap: 3px !important; }
        .tb-tip-icon { display: inline-flex; align-items: center; justify-content: center; font-size: 9.5px; line-height: 1; color: rgba(255,255,255,.5); border-radius: 50%; width: 13px; height: 13px; background: rgba(255,255,255,.08); transition: color .15s ease, background .15s ease; user-select: none; }
        .tb-has-tip:hover .tb-tip-icon { color: #fff; background: var(--tb-accent, #f97316); }

        /* Botão playlist na topbar visível apenas quando sidebar fechada */
        .tb-vrow-playlist { display: none !important; }
        .tb-stage.is-sidebar-collapsed .tb-vrow-playlist { display: inline-flex !important; }

        /* Divisores de seção para Agrupamento por Tipo no Álbum */
        .tb-album-group-header { grid-column: 1 / -1 !important; display: flex !important; align-items: center; justify-content: space-between; padding: 18px 4px 8px; margin-top: 14px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .tb-album-group-title { font-size: 15px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px; }
        .tb-album-group-title svg { color: var(--tb-accent, #f97316); width: 18px; height: 18px; }
        .tb-album-group-count { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.08); padding: 3px 9px; border-radius: 999px; }
        .tb-group-toggle-btn { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: #fff; font: 600 13px Inter; cursor: pointer; transition: all .12s; }
        .tb-group-toggle-btn.is-active { background: rgba(249,115,22,0.2); border-color: var(--tb-accent, #f97316); color: #fdba74; }

        /* Toast */
        .tb-toast { position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%) translateY(12px); z-index: 100001; padding: 10px 18px; border-radius: 20px; background: #14161a; border: 1px solid rgba(249,115,22,0.4); color: #fff; font: 13px Inter, system-ui, sans-serif; box-shadow: 0 6px 22px rgba(0,0,0,.6); opacity: 0; pointer-events: none; transition: opacity .2s, transform .2s; }
        .tb-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

        @keyframes tb-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }

        /* ===================== RESPONSIVIDADE MOBILE ===================== */
        @media (max-width: 900px) {
            .tb-vrow-playlist { display: inline-flex !important; }
            .tb-stage { flex-direction: column !important; overflow-y: auto !important; }
            .tb-stage-main { height: auto !important; min-height: 0 !important; flex: 0 0 auto !important; }
            .tb-stage-mid { height: 55vh !important; min-height: 270px !important; }
            .tb-sidebar { width: 100% !important; flex: 1 1 auto !important; height: auto !important; border-left: none !important; border-top: 1px solid rgba(255,255,255,.08) !important; }
            .tb-playlist-list { max-height: 65vh !important; overflow-y: auto !important; }
            .tb-playlist-thumb-wrap { flex: 0 0 132px !important; width: 132px !important; height: 74px !important; }
            .tb-playlist-name { font-size: 13.5px !important; }
            .tb-playlist-meta, .tb-playlist-date-lbl, .tb-playlist-date-val { font-size: 12px !important; }
            .tb-plc-row { flex-direction: column !important; align-items: stretch !important; gap: 3px !important; }
            .tb-plc-left, .tb-plc-right { width: 100% !important; height: 34px !important; }
            .tb-plc-left .tb-plc-time { margin-left: auto !important; }
            .tb-plc-right { justify-content: flex-end !important; padding-top: 3px !important; border-top: 1px solid rgba(255,255,255,.08) !important; }
            .tb-plc-autoplay { margin-right: auto !important; width: auto !important; }
            .tb-vrow { flex-wrap: wrap !important; height: auto !important; padding: 8px 10px !important; }
            .tb-vrow-top { width: 100% !important; justify-content: space-between !important; }
            .tb-vrow-sub { width: 100% !important; justify-content: flex-start !important; overflow-x: auto !important; }
            .tb-name { max-width: 75vw !important; }
        }
        @media (max-width: 600px) {
            .tb-plc-act { width: 30px; height: 30px; }
            .tb-plc-act svg { width: 20px; height: 20px; }
        }
    `;

    function addCSS(css) {
        if (typeof GM_addStyle === "function") { GM_addStyle(css); return; }
        const s = document.createElement("style"); s.textContent = css;
        (document.head || document.documentElement).appendChild(s);
    }
    addCSS(CSS);

    const keepRoot = () => {
        const c = document.documentElement.classList;
        if (!c.contains("tb")) c.add("tb");
        if (isVideo && !c.contains("tb-file")) c.add("tb-file");
        if (isAlbum && !c.contains("tb-album")) c.add("tb-album");
    };
    try { new MutationObserver(keepRoot).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] }); } catch (e) {}
