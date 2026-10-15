
(function () {
    "use strict";
    if (window.top !== window.self) return;

    const PATH = location.pathname;
    const isFile = /\/d\//.test(PATH);
    const isAlbum = /\/f\//.test(PATH);
    document.documentElement.classList.add("fl");
    if (isFile) document.documentElement.classList.add("fl-file");
    if (isAlbum) document.documentElement.classList.add("fl-album");

    const ACCENT = "#14b8a6";
    const LOGO_SVG = '<svg fill="#fff" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g><path d="M475.3571,413.24a69.9,69.9,0,0,0-39.8845-57.4407l-39.9287-18.7987,21.5791-44.5621a89.4527,89.4527,0,0,0,.0025-77.9684L359.7988,96.0682C317.7933,9.3105,194.2088,9.31,152.2019,96.0666L94.87,214.4745a89.445,89.445,0,0,0,.0049,77.9692l21.581,44.5569L76.5256,355.8a69.898,69.898,0,0,0-39.8831,57.439l-3.612,43.3773a22.5157,22.5157,0,0,0,22.4381,24.3842H456.5337A22.5134,22.5134,0,0,0,478.97,456.6187ZM364,260.1205a107.9746,107.9746,0,0,1-98.1035,107.5V341.1249a9.8965,9.8965,0,0,0-19.793,0v26.4957A107.9746,107.9746,0,0,1,148,260.1205V203.44a28.8192,28.8192,0,0,1,28.8193-28.8193H335.1806A28.8193,28.8193,0,0,1,364,203.44Z"/><path d="M321.8213,275.9979a9.91,9.91,0,0,0-12.3135,6.6709,13.5776,13.5776,0,0,1-26.0156,0,9.9026,9.9026,0,1,0-18.9844,5.6426,33.3877,33.3877,0,0,0,63.9844,0A9.9125,9.9125,0,0,0,321.8213,275.9979Z"/><path d="M240.8213,275.9979a9.8908,9.8908,0,0,0-12.3135,6.6709,13.5776,13.5776,0,0,1-26.0156,0,9.9026,9.9026,0,1,0-18.9844,5.6426,33.3877,33.3877,0,0,0,63.9844,0A9.9125,9.9125,0,0,0,240.8213,275.9979Z"/><path d="M319,227.4384H283a9.8965,9.8965,0,1,0,0,19.7929h36a9.8965,9.8965,0,1,0,0-19.7929Z"/><path d="M193,247.2313h36a9.8965,9.8965,0,1,0,0-19.7929H193a9.8965,9.8965,0,1,0,0,19.7929Z"/></g></svg>';

    const CSS = `
        /* ===================== TEMA AMOLED ===================== */
        html.fl, html.fl body, html.fl #filehub, html.fl .min-h-screen { background: #0b0c0f !important; color: #e9e9ee !important; }
        html.fl ::selection { background: rgba(20,184,166,0.35); }
        html.fl a { color: #5eead4; }
        html.fl ::-webkit-scrollbar { width: 8px; height: 8px; }
        html.fl ::-webkit-scrollbar-thumb { background: #262933; border-radius: 8px; }

        /* ===================== EARLY PAINT ===================== */
        html.fl-file::before { content: ""; position: fixed; inset: 0; background: #0b0c0f; z-index: 98000; pointer-events: none; }
        html.fl-file.fl-fallback::before { display: none; }
        html.fl-has-stage, html.fl-has-stage body { overflow: hidden !important; }

        /* ===================== STAGE THEATER EM 2 COLUNAS ===================== */
        .fl-stage { position: fixed; inset: 0; z-index: 99000; display: flex; flex-direction: row; background: #0b0c0f; color: #fff; font-family: Inter, system-ui, sans-serif; }
        .fl-stage * { box-sizing: border-box; }

        /* Coluna Principal da Esquerda (Topbar + Mídia) */
        .fl-stage-main { flex: 1 1 auto; min-width: 0; height: 100%; display: flex; flex-direction: column; overflow: hidden; position: relative; }
        .fl-stage-mid { position: relative; flex: 1 1 auto; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 0 !important; overflow: hidden; background: #000; }

        /* Topbar VROW */
        .fl-vrow {
            flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 8px;
            padding: 8px 14px; background: #0e0f13; border-bottom: 1px solid rgba(255,255,255,.08);
            overflow-x: auto; white-space: nowrap; scrollbar-width: thin;
        }
        .fl-vrow-top { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1 1 auto; }
        .fl-vrow-sub { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }

        .fl-top-logo { display: inline-flex; align-items: center; gap: 7px; color: #fff; text-decoration: none; font-weight: 800; font-size: 15px; padding: 4px 6px; border-radius: 6px; transition: opacity .12s; flex: 0 0 auto; }
        .fl-top-logo:hover { opacity: 0.85; }
        .fl-logo-img { height: 22px; width: 22px; display: block; flex: 0 0 22px; }
        .fl-logo-img svg { width: 22px; height: 22px; display: block; }
        .fl-sidebar-actions { display: flex; align-items: center; gap: 8px; }
        .fl-sidebar-gallery { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.06); color: #fff; font: 600 12px/1 Inter, system-ui, sans-serif; text-decoration: none; }
        .fl-sidebar-gallery:hover { background: rgba(255,255,255,.12); }
        .fl-sidebar-gallery svg { width: 14px; height: 14px; }

        .fl-name { flex: 0 1 auto; min-width: 60px; max-width: 44vw; display: inline-flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13.5px; color: #fff; }
        .fl-name svg { color: ${ACCENT}; flex: 0 0 auto; width: 16px; height: 16px; }
        .fl-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .fl-stats { display: flex; align-items: center; gap: 12px; padding: 0 6px; flex: 0 0 auto; }
        .fl-stat { font-size: 12px; color: rgba(255,255,255,.62); font-weight: 600; }
        .fl-spacer { flex: 1 1 auto; min-width: 8px; }

        .fl-item {
            display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 11px;
            border: 1px solid rgba(255,255,255,.1); border-radius: 8px; background: rgba(255,255,255,.05);
            color: #fff; font: 600 12.5px/1 Inter, system-ui, sans-serif; cursor: pointer; text-decoration: none;
            transition: background .12s, border-color .12s; white-space: nowrap;
        }
        .fl-item:hover { background: rgba(255,255,255,.1); border-color: ${ACCENT}66; }
        .fl-item svg { width: 15px; height: 15px; color: ${ACCENT}; }
        .fl-item.is-primary { background: ${ACCENT}; border-color: ${ACCENT}; color: #04221e !important; font-weight: 700; }
        .fl-item.is-primary svg { color: #04221e !important; }
        .fl-vrow-playlist.is-active { background: rgba(20,184,166,0.2); border-color: ${ACCENT}; color: #99f6e4; }
        .fl-vsep { flex: 0 0 auto; width: 1px; height: 20px; margin: 0 2px; background: rgba(255,255,255,.1); }

        /* ===================== PLAYER ESTILO YOUTUBE ===================== */
        :root { --fl-accent: ${ACCENT}; }
        .fl-host { position: relative; width: 100%; height: 100%; max-width: 100%; max-height: 100%; background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .fl-video { width: 100% !important; height: 100% !important; max-width: 100% !important; max-height: 100% !important; object-fit: contain !important; background: #000 !important; outline: none; cursor: pointer; display: block; }

        /* Velocidade plana (sem pill pesado) */

        /* ===================== FOTO ZOOM/PAN REFINADO ===================== */
        .fl-img-host { position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; max-width: 100%; max-height: 100%; margin: 0; overflow: visible; }
        .fl-image {
            display: block !important; max-width: 100% !important; max-height: 100% !important; width: auto !important; height: auto !important;
            object-fit: contain !important; opacity: 1 !important; filter: none !important; position: static !important; background: transparent !important;
            border-radius: 0 !important; box-shadow: none !important; cursor: zoom-in; user-select: none; -webkit-user-drag: none; transform-origin: center center;
            will-change: transform; touch-action: none;
        }
        .fl-stage-mid.is-zoomed .fl-image, .fl-img-host.is-zoomed .fl-image { cursor: grab; }
        .fl-stage-mid.is-zoomed .fl-image:active, .fl-img-host.is-zoomed .fl-image:active { cursor: grabbing; }

        /* ===================== SIDEBAR DA PLAYLIST ===================== */
        .fl-sidebar {
            width: 380px; flex: 0 0 380px; height: 100%; display: flex; flex-direction: column;
            background: #08090b; border-left: 1px solid rgba(255,255,255,.08); overflow: hidden; z-index: 25;
            transition: width .18s ease, margin .18s ease;
        }
        .fl-stage.is-sidebar-collapsed .fl-sidebar { display: none !important; }

        .fl-sidebar-header {
            display: flex; align-items: center; justify-content: space-between; padding: 12px 14px 8px;
            border-bottom: 1px solid rgba(255,255,255,.06); flex: 0 0 auto;
        }
        .fl-sidebar-title-wrap { display: flex; align-items: center; gap: 8px; }
        .fl-sidebar-icon svg { width: 18px; height: 18px; color: ${ACCENT}; }
        .fl-sidebar-title { font-size: 14.5px; font-weight: 700; color: #fff; }
        .fl-sidebar-count { font-size: 11.5px; font-weight: 600; color: rgba(255,255,255,.5); background: rgba(255,255,255,.06); padding: 2px 7px; border-radius: 999px; }
        .fl-sidebar-collapse-btn { background: transparent; border: 0; color: rgba(255,255,255,.5); cursor: pointer; display: flex; padding: 4px; border-radius: 6px; }
        .fl-sidebar-collapse-btn:hover { background: rgba(255,255,255,.08); color: #fff; }
        .fl-sidebar-collapse-btn svg { width: 16px; height: 16px; }

        .fl-sidebar-search {
            position: relative; display: flex; align-items: center; margin: 8px 12px 6px; background: rgba(255,255,255,.05);
            border: 1px solid rgba(255,255,255,.08); border-radius: 8px; padding: 0 8px; flex: 0 0 auto;
        }
        .fl-sidebar-search:focus-within { border-color: ${ACCENT}; background: rgba(255,255,255,.08); }
        .fl-sidebar-search-icon svg { width: 14px; height: 14px; color: rgba(255,255,255,.4); margin-right: 6px; }
        .fl-sidebar-search-in { width: 100%; height: 32px; background: transparent; border: 0; outline: none; color: #fff; font: 12.5px Inter, sans-serif; }
        .fl-sidebar-search-in::placeholder { color: rgba(255,255,255,.4); }

        .fl-sidebar-tabs { display: flex; align-items: center; gap: 5px; padding: 4px 12px 6px; overflow-x: auto; scrollbar-width: none; flex: 0 0 auto; }
        .fl-sidebar-tabs::-webkit-scrollbar { display: none; }
        .fl-tab-chip {
            display: inline-flex; align-items: center; gap: 5px; height: 26px; padding: 0 9px; border-radius: 6px;
            background: rgba(255,255,255,.05); border: 1px solid transparent; color: rgba(255,255,255,.6); font: 600 11.5px/1 Inter, sans-serif;
            cursor: pointer; transition: all .12s; white-space: nowrap;
        }
        .fl-tab-chip:hover { background: rgba(255,255,255,.09); color: #fff; }
        .fl-tab-chip.is-active { background: rgba(20,184,166,0.2); border-color: ${ACCENT}; color: #99f6e4; }
        .fl-tab-count { font-size: 10px; opacity: .75; }

        .fl-sidebar-sort { display: flex; align-items: center; gap: 6px; padding: 4px 12px 6px; font-size: 11px; color: rgba(255,255,255,.5); flex: 0 0 auto; }
        .fl-sort-label { text-transform: uppercase; letter-spacing: .04em; }
        .fl-sort-chip { background: transparent; border: 0; color: rgba(255,255,255,.5); font: 600 11px Inter, sans-serif; cursor: pointer; padding: 2px 5px; border-radius: 4px; }
        .fl-sort-chip:hover { color: #fff; }
        .fl-sort-chip.is-active { color: ${ACCENT}; font-weight: 700; text-decoration: underline; }

        .fl-playlist-list { flex: 1 1 auto; overflow-y: auto; padding: 6px 10px 40px; display: flex; flex-direction: column; gap: 6px; scrollbar-width: thin; }
        .fl-playlist-list::-webkit-scrollbar { width: 5px; }
        .fl-playlist-list::-webkit-scrollbar-thumb { background: #1c2738; border-radius: 4px; }

        .fl-playlist-item {
            display: flex; gap: 10px; padding: 7px; border-radius: 10px; background: rgba(255,255,255,.03);
            border: 1px solid rgba(255,255,255,.05); cursor: pointer; transition: background .12s, border-color .12s, transform .12s; text-decoration: none; color: inherit;
        }
        .fl-playlist-item:hover { background: rgba(255,255,255,.07); border-color: ${ACCENT}88; transform: translateY(-1px); }
        .fl-playlist-item.is-current { background: rgba(20,184,166,0.14); border-color: ${ACCENT}; }
        /* Itens fora da tela não são renderizados (o item atual fica sempre renderizado). */
        .fl-playlist-item:not(.is-current) { content-visibility: auto; flex-shrink: 0; contain-intrinsic-block-size: auto 99px; }

        .fl-playlist-thumb-wrap {
            position: relative; flex: 0 0 176px; width: 176px; height: 99px; border-radius: 8px;
            overflow: hidden; background: #000; display: flex; align-items: center; justify-content: center;
        }
        .fl-playlist-thumb { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; }
        .fl-playlist-kind { position: absolute; top: 6px; left: 6px; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.78); color: #fff; font: 700 10px/1.2 Inter, system-ui, sans-serif; }
        .fl-playlist-num { position: absolute; top: 6px; right: 6px; z-index: 1; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.8); color: #fff; font: 700 11px/1 Inter, system-ui, sans-serif; }
        .fl-playlist-dur { position: absolute; bottom: 5px; right: 6px; z-index: 1; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.8); color: #fff; font: 700 11px/1 Inter, system-ui, sans-serif; }
        .fl-playlist-dur[hidden] { display: none !important; }
        .fl-now-dot { width: 6px; height: 6px; border-radius: 50%; background: ${ACCENT}; animation: fl-pulse 1.2s infinite; }

        .fl-playlist-placeholder { width: 100%; height: 100%; background: #060912; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
        .fl-playlist-ph-icon svg { width: 22px; height: 22px; color: ${ACCENT}; opacity: .75; }
        .fl-playlist-ph-ext { font: 800 9px Inter; letter-spacing: .06em; color: rgba(255,255,255,.5); background: rgba(255,255,255,.08); padding: 1px 5px; border-radius: 3px; }

        .fl-playlist-info { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
        .fl-playlist-name {
            font-size: 14.5px; font-weight: 500; color: rgba(255,255,255,.9); line-height: 1.35; display: -webkit-box;
            -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word;
        }
        .fl-playlist-item.is-current .fl-playlist-name { color: #fff; font-weight: 700; }
        .fl-playlist-meta { font-size: 12.5px; color: rgba(255,255,255,.55); display: flex; align-items: center; gap: 8px; }
        .fl-playlist-meta-active { color: ${ACCENT}; font-weight: 700; }
        .fl-playlist-empty { padding: 32px 16px; text-align: center; color: rgba(255,255,255,.5); font-size: 13px; }

        /* Setas laterais do Stage */
        .fl-nav-side { position: absolute; top: 50%; transform: translateY(-50%); z-index: 6; width: 44px; height: 44px; border: 0; border-radius: 50%; background: rgba(0,0,0,.5); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .18s ease, background .12s ease; }
        .fl-nav-prev { left: 16px; } .fl-nav-next { right: 16px; }
        .fl-stage.has-nav .fl-stage-mid:hover .fl-nav-side { opacity: 1; pointer-events: auto; }
        @media (hover: none) { .fl-stage.has-nav .fl-nav-side { opacity: .85; pointer-events: auto; } }
        .fl-nav-side:hover { background: rgba(0,0,0,.74); } .fl-nav-side:active { transform: translateY(-50%) scale(.92); }
        .fl-nav-side svg { width: 24px; height: 24px; display: block; }

        /* Datas em texto simples na playlist e galeria */
        .fl-playlist-dates, .fl-card-dates { display: flex; flex-direction: column; gap: 2px; margin-top: 3px; font-size: 11px; color: rgba(255,255,255,.5); }
        .fl-playlist-dates, .fl-card-dates { min-width: 0; }
        .fl-playlist-date-row, .fl-card-date-row { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 12px; line-height: 1.3; white-space: nowrap; overflow: hidden; }
        .fl-playlist-date-lbl, .fl-card-date-lbl { flex: 0 0 auto; white-space: nowrap; }
        .fl-playlist-date-val, .fl-card-date-val { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .fl-playlist-date-lbl, .fl-card-date-lbl { color: rgba(255,255,255,.55); font-weight: 600; font-size: 11.5px; }
        .fl-playlist-date-val, .fl-card-date-val { color: rgba(255,255,255,.9); font-weight: 600; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; }

        /* Tooltip sutil e ícone em Data Extraída */
        .fl-has-tip { cursor: help !important; display: inline-flex !important; align-items: center !important; gap: 3px !important; }
        .fl-tip-icon { display: inline-flex; align-items: center; justify-content: center; font-size: 9.5px; line-height: 1; color: rgba(255,255,255,.5); border-radius: 50%; width: 13px; height: 13px; background: rgba(255,255,255,.08); transition: color .15s ease, background .15s ease; user-select: none; }
        .fl-has-tip:hover .fl-tip-icon { color: #fff; background: var(--fl-accent, #14b8a6); }

        /* Botão playlist na topbar visível apenas quando sidebar fechada */
        .fl-vrow-playlist { display: none !important; }
        .fl-stage.is-sidebar-collapsed .fl-vrow-playlist { display: inline-flex !important; }

        html.fl-album .files-list.grid-view { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)) !important; gap: 32px 24px !important; }
        @media (min-width: 1600px) { html.fl-album .files-list.grid-view { grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)) !important; gap: 36px 28px !important; } }
        @media (max-width: 768px) { html.fl-album .files-list.grid-view { grid-template-columns: 1fr !important; gap: 20px 16px !important; } }
        html.fl-album .file-item { border-radius: 14px !important; background: transparent !important; }
        html.fl-album .file-item img { width: 100% !important; aspect-ratio: 16 / 9 !important; object-fit: cover !important; border-radius: 14px !important; }

        /* ===================== GALERIA (/f/): AGRUPAMENTO POR TIPO ===================== */
        .fl-album-group-header { grid-column: 1 / -1 !important; display: flex !important; align-items: center; justify-content: space-between; padding: 18px 4px 8px; margin-top: 14px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .fl-album-group-title { font-size: 15px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px; }
        .fl-album-group-title svg { color: ${ACCENT}; width: 18px; height: 18px; }
        .fl-album-group-count { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.08); padding: 3px 9px; border-radius: 999px; }
        .fl-group-toggle-btn { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 14px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: #fff; font: 600 13px Inter; cursor: pointer; transition: all .12s; }
        .fl-group-toggle-btn.is-active { background: rgba(20,184,166,0.2); border-color: ${ACCENT}; color: #99f6e4; }

        /* Toast */
        .fl-toast { position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%) translateY(12px); z-index: 100001; padding: 10px 18px; border-radius: 20px; background: #14161a; border: 1px solid ${ACCENT}66; color: #fff; font: 13px Inter, system-ui, sans-serif; box-shadow: 0 6px 22px rgba(0,0,0,.6); opacity: 0; pointer-events: none; transition: opacity .2s, transform .2s; }
        .fl-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

        @keyframes fl-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }

        /* ===================== RESPONSIVIDADE MOBILE ===================== */
        @media (max-width: 900px) {
            .fl-vrow-playlist { display: inline-flex !important; }
            .fl-stage { flex-direction: column !important; overflow-y: auto !important; }
            .fl-stage-main { height: auto !important; min-height: 0 !important; flex: 0 0 auto !important; }
            .fl-stage-mid { height: 55vh !important; min-height: 270px !important; }
            .fl-sidebar { width: 100% !important; flex: 1 1 auto !important; height: auto !important; border-left: none !important; border-top: 1px solid rgba(255,255,255,.08) !important; }
            .fl-playlist-list { max-height: 65vh !important; overflow-y: auto !important; }
            .fl-playlist-thumb-wrap { flex: 0 0 132px !important; width: 132px !important; height: 74px !important; }
            .fl-playlist-name { font-size: 13.5px !important; }
            .fl-playlist-meta, .fl-playlist-date-lbl, .fl-playlist-date-val { font-size: 12px !important; }

            .fl-vrow { flex-wrap: wrap !important; height: auto !important; padding: 8px 10px !important; }
            .fl-vrow-top { width: 100% !important; justify-content: space-between !important; }
            .fl-vrow-sub { width: 100% !important; justify-content: flex-start !important; overflow-x: auto !important; }
            .fl-name { max-width: 75vw !important; }
        }
        
${mediaComponentCSS(mediaTheme()).plc}
    `;

    addCSS(CSS);

    const keepRoot = () => { const c = document.documentElement.classList; if (!c.contains("fl")) c.add("fl"); if (isFile && !c.contains("fl-file")) c.add("fl-file"); if (isAlbum && !c.contains("fl-album")) c.add("fl-album"); };
    try { new MutationObserver(keepRoot).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] }); } catch (e) {}
