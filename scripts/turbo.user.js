// ==UserScript==
// @name         Turbo — Native Player & Theater Stage (embed bypass)
// @namespace    turbo-theater
// @version      2.4.0
// @description  Native player and theater stage for Turbo with signed-media playback, YouTube-style AMOLED player, playlist sidebar with tabs and placeholders, adjacent prev/next controls, flat 1x speed, responsive mobile layout, and media grouping in albums.
// @author       claudiogepeto
// @match        *://turbo.cr/*
// @match        *://*.turbo.cr/*
// @match        *://saint.cr/*
// @match        *://*.saint.cr/*
// @match        *://saint2.cr/*
// @match        *://*.saint2.cr/*
// @match        *://saint.su/*
// @match        *://*.saint.su/*
// @match        *://saint2.su/*
// @match        *://*.saint2.su/*
// @match        *://turbo.to/*
// @match        *://*.turbo.to/*
// @match        *://turbo.is/*
// @match        *://*.turbo.is/*
// @noframes
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

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

    /* ===================== PREFS & HELPERS ===================== */
    const PREFS_KEY = "turbo_prefs";
    const prefs = Object.assign({
        volume: 1,
        muted: false,
        rate: 1,
        loop: false,
        autoplay: true,
        sidebarCollapsed: false,
        groupByType: false,
        sidebarTab: "all",
        sidebarSort: "default"
    }, (() => {
        try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; }
    })());
    let saveT;
    const saveP = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {} }, 250); };

    /* ===================== PARSER DE DATAS E TÍTULOS ===================== */
    function cleanHtmlText(str) {
        if (!str || typeof str !== "string") return "";
        let cur = str;
        for (let i = 0; i < 3; i++) {
            if (!/&[a-zA-Z0-9#]+;/.test(cur)) break;
            const txt = document.createElement("textarea");
            txt.innerHTML = cur;
            cur = txt.value;
        }
        return cur.trim();
    }

    function extractDateFromTitle(title) {
        if (!title || typeof title !== "string") return null;
        title = cleanHtmlText(title).trim();

        // 1. ISO: YYYY[-._]MM[-._]DD
        const mIso = title.match(/(?:^|[\[(_\s])(20\d\d|19\d\d)[.\-_](0[1-9]|1[0-2])[.\-_](0[1-9]|[12]\d|3[01])\b/);
        if (mIso) {
            const y = parseInt(mIso[1], 10), m = parseInt(mIso[2], 10), d = parseInt(mIso[3], 10);
            return {
                timestamp: Date.UTC(y, m - 1, d),
                formatted: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
                displayDate: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`,
                year: y, month: m, day: d,
                raw: mIso[0].trim().replace(/^[\[(_\s]+|[\])_\s]+$/g, "")
            };
        }

        // 2. Compacto: YYYYMMDD
        const mCompact = title.match(/(?:^|[\[(_\s])(20\d\d|19\d\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\b/);
        if (mCompact) {
            const y = parseInt(mCompact[1], 10), m = parseInt(mCompact[2], 10), d = parseInt(mCompact[3], 10);
            return {
                timestamp: Date.UTC(y, m - 1, d),
                formatted: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
                displayDate: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`,
                year: y, month: m, day: d,
                raw: mCompact[0].trim().replace(/^[\[(_\s]+|[\])_\s]+$/g, "")
            };
        }

        // 3. BR/EU: DD[-._]MM[-._]YYYY
        const mDmy = title.match(/(?:^|[\[(_\s])(0[1-9]|[12]\d|3[01])[.\-_](0[1-9]|1[0-2])[.\-_](20\d\d|19\d\d)\b/);
        if (mDmy) {
            const d = parseInt(mDmy[1], 10), m = parseInt(mDmy[2], 10), y = parseInt(mDmy[3], 10);
            return {
                timestamp: Date.UTC(y, m - 1, d),
                formatted: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
                displayDate: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`,
                year: y, month: m, day: d,
                raw: mDmy[0].trim().replace(/^[\[(_\s]+|[\])_\s]+$/g, "")
            };
        }

        // 4. Mês e Ano: YYYY[-._]MM
        const mYm = title.match(/(?:^|[\[(_\s])(20\d\d|19\d\d)[.\-_](0[1-9]|1[0-2])\b/);
        if (mYm) {
            const y = parseInt(mYm[1], 10), m = parseInt(mYm[2], 10);
            return {
                timestamp: Date.UTC(y, m - 1, 1),
                formatted: `${y}-${String(m).padStart(2, "0")}`,
                displayDate: `${String(m).padStart(2, "0")}/${y}`,
                year: y, month: m, day: 1,
                raw: mYm[0].trim().replace(/^[\[(_\s]+|[\])_\s]+$/g, "")
            };
        }

        return null;
    }

    function cleanTitleWithoutDate(title, dt) {
        if (!title || typeof title !== "string") return "";
        title = cleanHtmlText(title).trim();
        const withoutExt = title.replace(/\.[a-zA-Z0-9]{2,5}$/i, "").trim();
        const target = withoutExt || title;
        if (!dt || !dt.raw) return target;
        const esc = dt.raw.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        let cleaned = target.replace(new RegExp("^[\\s\\[(_-]*" + esc + "[\\s\\])_–—-]*(?:[-–—_]\\s*)?", "i"), "");
        cleaned = cleaned.replace(/^[\s\-_–—.]+\s*/, "").trim();
        return cleaned || target;
    }

    function formatDisplayDate(isoOrDate) {
        if (!isoOrDate) return "";
        try {
            const d = new Date(isoOrDate);
            if (isNaN(d.getTime())) return String(isoOrDate);
            const pad = n => String(n).padStart(2, "0");
            const dia = pad(d.getDate()), mes = pad(d.getMonth() + 1), ano = d.getFullYear();
            const hora = pad(d.getHours()), min = pad(d.getMinutes());
            return `${dia}/${mes}/${ano}, ${hora}:${min}`;
        } catch {
            return String(isoOrDate);
        }
    }

    function el(tag, props, ...kids) {
        const n = document.createElement(tag);
        if (props) for (const [k, v] of Object.entries(props)) {
            if (v == null) continue;
            if (k === "class") n.className = v;
            else if (k === "html") n.innerHTML = v;
            else if (k === "style" && typeof v === "object") Object.assign(n.style, v);
            else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2).toLowerCase(), v);
            else n.setAttribute(k, v);
        }
        for (const kid of kids) if (kid != null) n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
        return n;
    }

    const svgi = inner => `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block">${inner}</svg>`;
    const IC = {
        play: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M7 4.5v15a1 1 0 0 0 1.52.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>',
        pause: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>',
        volume: svgi('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>'),
        mute: svgi('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>'),
        expand: svgi('<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>'),
        download: svgi('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
        copy: svgi('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
        repeat: svgi('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'),
        flag: svgi('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>'),
        grid: svgi('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
        video: svgi('<rect x="2" y="5" width="14" height="14" rx="2"/><path d="m22 8-6 4 6 4V8z"/>'),
        image: svgi('<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>'),
        fileText: svgi('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'),
        chevL: svgi('<path d="m15 18-6-6 6-6"/>'),
        chevR: svgi('<path d="m9 18 6-6-6-6"/>'),
        skipBack: svgi('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>'),
        skipFwd: svgi('<path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>'),
        prevTrack: svgi('<polygon points="19 20 9 12 19 4 19 20" fill="currentColor"/><line x1="5" y1="19" x2="5" y2="5" stroke-width="2.5"/>'),
        nextTrack: svgi('<polygon points="5 4 15 12 5 20 5 4" fill="currentColor"/><line x1="19" y1="5" x2="19" y2="19" stroke-width="2.5"/>'),
        playlist: svgi('<line x1="3" y1="6" x2="15" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="11" y2="18"/><polygon points="17,14 22,17 17,20" fill="currentColor" stroke="none"/>'),
        close: svgi('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
        search: svgi('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
        check: svgi('<polyline points="20 6 9 17 4 12"/>'),
        share: svgi('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>'),
        pip: svgi('<rect x="2" y="4" width="20" height="16" rx="2"/><rect x="12" y="10" width="8" height="8" rx="1"/>'),
        prev: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M6 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1zm12.44 1.34a1 1 0 0 0-1.44-.88l-9 5.5a1 1 0 0 0 0 1.72l9 5.5A1 1 0 0 0 19 17.5v-11a1 1 0 0 0-.56-.86z"/></svg>',
        next: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M18 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1zM5.56 6.66a1 1 0 0 0-1.56.84v11a1 1 0 0 0 1.56.84l9-5.5a1 1 0 0 0 0-1.68l-9-5.5z"/></svg>'
    };

    function kindSvg(k) {
        if (k === "video") return IC.video;
        if (k === "image") return IC.image;
        if (k === "text") return IC.fileText;
        return IC.fileText;
    }

    const fmtT = s => {
        s = Math.max(0, Math.floor(s || 0));
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
        const p = n => String(n).padStart(2, "0");
        return h ? h + ":" + p(m) + ":" + p(ss) : p(m) + ":" + p(ss);
    };

    let toastT;
    function toast(msg) {
        let t = document.querySelector(".tb-toast");
        if (!t) { t = el("div", { class: "tb-toast" }); (document.body || document.documentElement).appendChild(t); }
        t.textContent = msg; t.classList.add("show");
        clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 1800);
    }
    function fallbackCopy(s) { try { const t = el("textarea", { style: { position: "fixed", opacity: "0", left: "-9999px" } }); t.value = s; document.body.appendChild(t); t.select(); const ok = document.execCommand("copy"); t.remove(); return ok; } catch { return false; } }
    function copyText(s) {
        if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(s).then(() => true, () => fallbackCopy(s));
        return Promise.resolve(fallbackCopy(s));
    }

    function vidId() { return (PATH.match(/\/(?:v|embed)\/([^/?#]+)/) || [])[1] || ""; }

    /* ===================== CONTROLES DO PLAYER (Estilo YouTube) ===================== */
    function buildPlayerControls(wrap, video, src, id, ac) {
        const on = (e, ev, fn) => e.addEventListener(ev, fn, ac ? { signal: ac.signal } : undefined);
        const mkAct = (ic, label, cb) => {
            const b = el("button", { type: "button", class: "tb-plc-act", title: label, "aria-label": label });
            b.innerHTML = ic;
            b.addEventListener("click", cb);
            return b;
        };

        const toggle = () => {
            if (video.paused || video.ended) {
                const p = video.play();
                if (p && p.catch) {
                    p.catch(err => {
                        console.warn("[turbo] play rejected, tentando mudo:", err);
                        video.muted = true;
                        video.play().catch(e => console.error("[turbo] play com mudo falhou:", e));
                    });
                }
            } else {
                video.pause();
            }
        };

        const sflash = el("div", { class: "tb-plc-seekflash" });
        let sft;
        const seek = d => {
            if (!video.duration) return;
            video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + d));
            sflash.textContent = d < 0 ? "« 5s" : "5s »";
            sflash.classList.add("on");
            clearTimeout(sft);
            sft = setTimeout(() => sflash.classList.remove("on"), 480);
        };

        let clickT = null;
        on(video, "click", e => {
            e.preventDefault(); e.stopPropagation();
            if (clickT) return;
            clickT = setTimeout(() => { clickT = null; toggle(); }, 230);
        });
        on(video, "dblclick", e => {
            e.preventDefault(); e.stopPropagation();
            if (clickT) { clearTimeout(clickT); clickT = null; }
            const r = video.getBoundingClientRect();
            seek((e.clientX - r.left) < r.width / 2 ? -5 : 5);
        });

        const playBtn = el("button", { type: "button", class: "tb-plc-play", "aria-label": "Play/Pause" });
        playBtn.innerHTML = IC.play;
        playBtn.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); toggle(); });

        const flash = el("div", { class: "tb-plc-flash" }, playBtn);
        flash.addEventListener("click", e => {
            if (e.target !== flash && !flash.contains(e.target)) return;
            e.preventDefault(); e.stopPropagation();
            toggle();
        });

        const buf = el("div", { class: "tb-plc-buf" });
        const knob = el("div", { class: "tb-plc-knob" });
        const fill = el("div", { class: "tb-plc-fill" }, knob);
        const bar = el("div", { class: "tb-plc-bar" }, buf, fill);
        const prog = el("div", { class: "tb-plc-prog" }, bar);

        const seekTo = (cx, r) => {
            if (!video.duration || !r.width) return;
            video.currentTime = Math.max(0, Math.min(1, (cx - r.left) / r.width)) * video.duration;
        };
        prog.addEventListener("pointerdown", e => {
            e.preventDefault(); e.stopPropagation();
            const r = bar.getBoundingClientRect();
            seekTo(e.clientX, r);
            const mv = ev => seekTo(ev.clientX, r);
            const up = () => { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); };
            document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
        });

        const tEl = el("span", { class: "tb-plc-time" }, "00:00 / 00:00");
        const syncTime = () => {
            const s = fmtT(video.currentTime) + (video.duration ? " / " + fmtT(video.duration) : " / 00:00");
            if (tEl.firstChild && tEl.firstChild.data !== s) tEl.firstChild.data = s;
            else if (!tEl.firstChild) tEl.textContent = s;
        };
        on(video, "timeupdate", () => {
            if (video.duration) fill.style.width = (video.currentTime / video.duration * 100) + "%";
            syncTime();
        });
        on(video, "loadedmetadata", syncTime);
        on(video, "progress", () => {
            try {
                if (video.buffered.length && video.duration) {
                    buf.style.width = (video.buffered.end(video.buffered.length - 1) / video.duration * 100) + "%";
                }
            } catch {}
        });

        const mute = mkAct(IC.mute, "Mudo (m)", e => {
            e.stopPropagation();
            video.muted = !video.muted;
            if (!video.muted && !video.volume) video.volume = 1;
            syncVol();
        });
        const volfill = el("div", { class: "tb-plc-volfill" });
        const volbar = el("div", { class: "tb-plc-volbar", role: "slider", "aria-label": "Volume" }, volfill);
        const syncVol = () => {
            mute.innerHTML = (video.muted || !video.volume) ? IC.mute : IC.volume;
            volfill.style.width = ((video.muted ? 0 : video.volume) * 100) + "%";
        };
        const setVolX = (cx, r) => {
            if (!r.width) return;
            const v = Math.max(0, Math.min(1, (cx - r.left) / r.width));
            video.volume = v; video.muted = (v === 0);
            syncVol();
        };
        volbar.addEventListener("pointerdown", e => {
            e.preventDefault(); e.stopPropagation();
            const r = volbar.getBoundingClientRect(); setVolX(e.clientX, r);
            const mv = ev => setVolX(ev.clientX, r);
            const up = () => { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); };
            document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
        });
        const volgrp = el("div", { class: "tb-plc-vol" }, mute, volbar);

        const goFs = () => {
            try {
                document.fullscreenElement ? document.exitFullscreen() : wrap.requestFullscreen();
            } catch {}
        };
        const dlb = mkAct(IC.download, "Baixar", e => {
            e.stopPropagation();
            const dlBtn = document.getElementById("btnDownload") || document.querySelector('a[href*="/d/"]');
            if (dlBtn && dlBtn.href) window.open(dlBtn.href, "_blank");
            else if (id) window.open("/d/" + id, "_blank");
            else if (src) window.open(src, "_blank");
        });
        const shareBtn = mkAct(IC.share, "Compartilhar / Copiar link", e => {
            e.stopPropagation();
            copyText(location.href).then(ok => {
                toast(ok ? "Link copiado!" : "Falha ao copiar link");
                if (ok) { shareBtn.innerHTML = IC.check; setTimeout(() => { shareBtn.innerHTML = IC.share; }, 1600); }
            });
        });
        const reportBtn = mkAct(IC.flag, "Reportar", e => {
            e.stopPropagation();
            const a = document.querySelector('a[href*="report"], a[href*="abuse"]');
            if (a && a.href) window.open(a.href, "_blank");
            else toast("Sem página de denúncia neste site");
        });
        let pipBtn = null;
        if (document.pictureInPictureEnabled) {
            pipBtn = mkAct(IC.pip, "Picture-in-Picture", async e => {
                e.stopPropagation();
                try {
                    if (document.pictureInPictureElement) await document.exitPictureInPicture();
                    else if (video.requestPictureInPicture) await video.requestPictureInPicture();
                } catch {}
            });
        }
        const fsb = mkAct(IC.expand, "Tela cheia (f)", e => { e.stopPropagation(); goFs(); });
        const barPlay = mkAct(IC.play, "Play/Pause (espaço)", e => { e.stopPropagation(); toggle(); });
        barPlay.classList.add("tb-plc-barplay");

        const apBtn = el("button", {
            type: "button",
            class: "tb-plc-act tb-plc-autoplay" + (prefs.autoplay ? " is-active" : ""),
            title: prefs.autoplay ? "Reprodução automática ativada" : "Reprodução automática desativada",
            "aria-label": "Reprodução automática"
        },
            el("span", { class: "tb-plc-ap-label" }, "Autoplay"),
            el("span", { class: "tb-plc-ap-pill" }, el("span", { class: "tb-plc-ap-knob" }))
        );
        apBtn.addEventListener("click", e => {
            e.stopPropagation();
            prefs.autoplay = !prefs.autoplay;
            saveP();
            apBtn.classList.toggle("is-active", !!prefs.autoplay);
            toast(prefs.autoplay ? "Autoplay ativado" : "Autoplay desativado");
        });

        // Loop toggle
        const loopBtn = mkAct(IC.repeat, "Repetir (r)", e => {
            e.stopPropagation();
            prefs.loop = !prefs.loop;
            saveP();
            video.loop = prefs.loop;
            loopBtn.classList.toggle("is-active", !!prefs.loop);
            toast(prefs.loop ? "Repetição ativada" : "Repetição desativada");
        });
        video.loop = !!prefs.loop;
        loopBtn.classList.toggle("is-active", !!prefs.loop);

        // Próximo vídeo ao terminar
        on(video, "ended", () => {
            if (!video.loop && prefs.autoplay) {
                navFile(1);
            }
        });

        // Anterior e Próximo lado a lado
        const navPrevBtn = mkAct(IC.prev, "Anterior (Shift+P)", e => { e.stopPropagation(); navFile(-1); });
        const navNextBtn = mkAct(IC.next, "Próximo (Shift+N)", e => { e.stopPropagation(); navFile(1); });

        const mkSkip = (ic, label, cb) => {
            const b = el("button", { type: "button", class: "tb-plc-act tb-plc-skip", title: label, "aria-label": label });
            b.innerHTML = ic;
            b.appendChild(el("span", { class: "tb-plc-skipn" }, "5"));
            b.addEventListener("click", cb);
            return b;
        };
        const skipBack = mkSkip(IC.skipBack, "Voltar 5s (←)", e => { e.stopPropagation(); seek(-5); });
        const skipFwd = mkSkip(IC.skipFwd, "Avançar 5s (→)", e => { e.stopPropagation(); seek(5); });

        // Velocidade plana (sem pill pesado)
        const RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];
        const speedMenu = el("div", { class: "tb-plc-speedmenu" });
        const speedBtn = el("button", { type: "button", class: "tb-plc-act tb-plc-speed", title: "Velocidade", "aria-label": "Velocidade" }, "1x");
        const speedWrap = el("div", { class: "tb-plc-speedwrap" }, speedMenu, speedBtn);
        let speedCloser = null;
        const closeSpeed = () => {
            speedMenu.classList.remove("open");
            if (speedCloser) { document.removeEventListener("pointerdown", speedCloser, true); speedCloser = null; }
        };
        const openSpeed = () => {
            speedMenu.classList.add("open");
            speedCloser = ev => { if (!speedWrap.contains(ev.target)) closeSpeed(); };
            document.addEventListener("pointerdown", speedCloser, true);
        };
        RATES.forEach(r => {
            const it = el("button", { type: "button", class: "tb-plc-speeditem" }, r + "x");
            it.dataset.r = r;
            it.addEventListener("click", e => {
                e.stopPropagation();
                try { video.playbackRate = r; } catch {}
                closeSpeed();
            });
            speedMenu.appendChild(it);
        });
        speedBtn.addEventListener("click", e => {
            e.stopPropagation();
            speedMenu.classList.contains("open") ? closeSpeed() : openSpeed();
        });
        const syncSpeed = () => {
            const r = video.playbackRate;
            speedBtn.textContent = r + "x";
            speedMenu.querySelectorAll(".tb-plc-speeditem").forEach(it => it.classList.toggle("on", +it.dataset.r === r));
        };
        on(video, "ratechange", () => { prefs.rate = video.playbackRate; saveP(); syncSpeed(); });
        on(video, "loadedmetadata", () => { try { video.playbackRate = prefs.rate || 1; } catch {} });

        const leftc = el("div", { class: "tb-plc-left" }, barPlay, loopBtn, navPrevBtn, navNextBtn, skipBack, skipFwd, volgrp, tEl);
        const rightc = el("div", { class: "tb-plc-right" }, apBtn, speedWrap, reportBtn, dlb, shareBtn);
        if (pipBtn) rightc.appendChild(pipBtn);
        rightc.appendChild(fsb);
        const row = el("div", { class: "tb-plc-row" }, leftc, rightc);
        const bottom = el("div", { class: "tb-plc-bottom" }, prog, row);

        on(video, "play", () => { wrap.classList.add("is-playing"); playBtn.innerHTML = IC.pause; barPlay.innerHTML = IC.pause; });
        on(video, "pause", () => { wrap.classList.remove("is-playing"); playBtn.innerHTML = IC.play; barPlay.innerHTML = IC.play; });
        on(video, "volumechange", syncVol);
        on(video, "seeking", () => wrap.classList.add("is-buffering"));
        ["seeked", "canplay", "playing", "loadeddata", "pause", "suspend", "error", "abort"].forEach(ev => on(video, ev, () => wrap.classList.remove("is-buffering")));

        const setRate = dir => {
            const i = RATES.indexOf(video.playbackRate);
            const ni = Math.max(0, Math.min(RATES.length - 1, (i < 0 ? 3 : i) + dir));
            try { video.playbackRate = RATES[ni]; } catch {}
        };

        const onKey = e => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const t = e.target;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable || (t.closest && t.closest(".tb-sidebar-search")))) return;
            const k = e.key;
            let h = true;
            if (k === " " || k === "k") toggle();
            else if (k === "ArrowLeft") seek(-5);
            else if (k === "ArrowRight") seek(5);
            else if (k === "j") seek(-10);
            else if (k === "l") seek(10);
            else if (k === "ArrowUp") { video.muted = false; video.volume = Math.min(1, video.volume + 0.05); }
            else if (k === "ArrowDown") video.volume = Math.max(0, video.volume - 0.05);
            else if (k === "m") { video.muted = !video.muted; if (!video.muted && !video.volume) video.volume = 1; }
            else if (k === "f") goFs();
            else if (k === "<") setRate(-1);
            else if (k === ">") setRate(1);
            else if (e.shiftKey && (k === "N" || k === "n")) navFile(1);
            else if (e.shiftKey && (k === "P" || k === "p")) navFile(-1);
            else if (k === "p" || k === "P") toggleSidebar();
            else if (k >= "0" && k <= "9" && video.duration) video.currentTime = video.duration * (+k) / 10;
            else h = false;

            if (h) { e.preventDefault(); e.stopPropagation(); }
        };
        if (ac) document.addEventListener("keydown", onKey, { capture: true, signal: ac.signal });

        wrap.append(flash, sflash, bottom);
        try { video.playbackRate = prefs.rate || 1; } catch {}
        syncVol();
        syncTime();
        syncSpeed();
    }

    /* ===================== PLAYER PRÓPRIO ===================== */
    function expOf(u) { try { return parseInt(new URL(u, location.origin).searchParams.get("exp"), 10) || 0; } catch (e) { return 0; } }
    async function signUrl(id) {
        const r = await fetch("/api/sign?v=" + encodeURIComponent(id), { credentials: "include" });
        const d = await r.json();
        if (!d || !d.success || !d.url) throw new Error("sign falhou");
        return d.url;
    }
    function scheduleRefresh(video, id) {
        const exp = expOf(video.src); if (!exp) return;
        const ms = Math.max((exp - Math.floor(Date.now() / 1000) - 60) * 1000, 10000);
        clearTimeout(video._refT);
        video._refT = setTimeout(() => {
            signUrl(id).then(u => {
                const t = video.currentTime || 0, playing = !video.paused;
                video.src = u; try { video.load(); } catch (e) {}
                if (t) { video.currentTime = t; if (playing) video.play().catch(() => {}); }
                scheduleRefresh(video, id);
            }).catch(() => { video._refT = setTimeout(() => scheduleRefresh(video, id), 30000); });
        }, ms);
    }
    const IMAGE_NAME = /\.(jpe?g|png|gif|webp|avif|bmp)(?:$|\?)/i;
    function appendImageChrome(host, id, src) {
        const mkAct = (ic, label, cb) => {
            const b = el("button", { type: "button", class: "tb-plc-act", title: label, "aria-label": label });
            b.innerHTML = ic;
            b.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); cb(); });
            return b;
        };
        const prevBtn = mkAct(IC.prev, "Anterior", () => navFile(-1));
        const nextBtn = mkAct(IC.next, "Próximo", () => navFile(1));
        const reportBtn = mkAct(IC.flag, "Reportar", () => {
            const a = document.querySelector('a[href*="report"], a[href*="abuse"]');
            if (a && a.href) window.open(a.href, "_blank", "noopener");
            else toast("Sem página de denúncia neste site");
        });
        const dlb = mkAct(IC.download, "Baixar", () => {
            const dlBtn = document.getElementById("btnDownload") || document.querySelector('a[href*="/d/"]');
            if (dlBtn && dlBtn.href) window.open(dlBtn.href, "_blank", "noopener");
            else if (id) window.open("/d/" + id, "_blank", "noopener");
            else if (src) window.open(src, "_blank", "noopener");
        });
        const shareBtn = mkAct(IC.share, "Compartilhar / Copiar link", () => {
            copyText(location.href).then(ok => {
                toast(ok ? "Link copiado!" : "Falha ao copiar link");
                if (ok) { shareBtn.innerHTML = IC.check; setTimeout(() => { shareBtn.innerHTML = IC.share; }, 1600); }
            });
        });
        const fsb = mkAct(IC.expand, "Tela cheia (f)", () => {
            try {
                if (document.fullscreenElement) document.exitFullscreen();
                else host.requestFullscreen();
            } catch { /* fullscreen blocked */ }
        });
        const row = el("div", { class: "tb-plc-row" },
            el("div", { class: "tb-plc-left" }, prevBtn, nextBtn),
            el("div", { class: "tb-plc-right" }, reportBtn, dlb, shareBtn, fsb)
        );
        host.append(el("div", { class: "tb-plc-bottom" }, row));
    }
    function mountPhotoFromSrc(mid, src, id) {
        if (mid.querySelector(".tb-img-host")) return;
        mediaMounted = true;
        const host = el("div", { class: "tb-img-host" });
        const img = el("img", { class: "tb-image", src: src || "", alt: "", draggable: "false" });
        host.append(img);
        appendImageChrome(host, id, src);
        const ZOOMS = [1, 2, 4];
        let zi = 0, z = 1, tx = 0, ty = 0;
        const clampPan = () => {
            const stageW = host.clientWidth || mid.clientWidth || window.innerWidth;
            const stageH = host.clientHeight || mid.clientHeight || window.innerHeight;
            const imgW = img.clientWidth * z;
            const imgH = img.clientHeight * z;
            const mx = Math.max(0, (imgW - stageW) / 2);
            const my = Math.max(0, (imgH - stageH) / 2);
            tx = Math.max(-mx, Math.min(mx, tx));
            ty = Math.max(-my, Math.min(my, ty));
        };
        const applyTf = () => {
            img.style.transform = z === 1 ? "" : `translate(${tx}px,${ty}px) scale(${z})`;
            host.classList.toggle("is-zoomed", z !== 1);
        };
        const setZoomIdx = i => {
            zi = ((i % ZOOMS.length) + ZOOMS.length) % ZOOMS.length;
            z = ZOOMS[zi];
            if (z === 1) { tx = 0; ty = 0; }
            else clampPan();
            applyTf();
        };
        let drag = null;
        img.addEventListener("pointerdown", e => {
            if (e.button) return;
            e.preventDefault();
            drag = { x: e.clientX, y: e.clientY, tx, ty, moved: false };
            try { img.setPointerCapture(e.pointerId); } catch { /* pointer already released */ }
        });
        img.addEventListener("pointermove", e => {
            if (!drag) return;
            const dx = e.clientX - drag.x;
            const dy = e.clientY - drag.y;
            if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
            if (z !== 1 && drag.moved) { tx = drag.tx + dx; ty = drag.ty + dy; clampPan(); applyTf(); }
        });
        const end = e => {
            if (!drag) return;
            const click = !drag.moved;
            drag = null;
            try { img.releasePointerCapture(e.pointerId); } catch { /* capture already gone */ }
            if (click) setZoomIdx(zi + 1);
        };
        img.addEventListener("pointerup", end);
        img.addEventListener("pointercancel", end);
        mid.appendChild(host);
        const stage = mid.closest(".tb-stage");
        if (stage) stage.classList.add("is-image");
    }
    function mountPhoto(mid, id) {
        const spin = el("div", { class: "tb-spin" });
        mid.appendChild(spin);
        signUrl(id).then(u => {
            spin.remove();
            mountPhotoFromSrc(mid, u, id);
        }).catch(() => {
            spin.remove();
            toast("Falha ao carregar a imagem");
        });
    }
    function mountIframe(mid) {
        document.documentElement.classList.add("tb-fallback");
        mid.querySelectorAll(".tb-spin").forEach(s => s.remove());
        const ifr = document.querySelector("iframe.saint-iframe, iframe[src*='/embed/']");
        if (ifr) {
            ifr.style.borderRadius = "0 !important";
            mid.appendChild(ifr);
            return true;
        }
        const id = vidId();
        if (id) {
            const newIfr = el("iframe", { src: "/embed/" + id, allowfullscreen: "true", style: { width: "100%", height: "100%", border: "0", background: "#000" } });
            mid.appendChild(newIfr);
            return true;
        }
        return false;
    }
    function mountVideo(mid, id) {
        const spin = el("div", { class: "tb-spin" });
        mid.appendChild(spin);

        let recovering = false;
        let ac = new AbortController();

        signUrl(id).then(u => {
            if (IMAGE_NAME.test(u)) {
                spin.remove();
                mountPhotoFromSrc(mid, u, id);
                return;
            }
            spin.remove();
            mediaMounted = true;
            const video = el("video", { class: "tb-video", playsinline: "", preload: "metadata" });
            video.volume = prefs.volume ?? 1;
            video.muted = prefs.muted ?? false;
            video.addEventListener("volumechange", () => {
                prefs.volume = video.volume;
                prefs.muted = video.muted;
                saveP();
            }, { signal: ac.signal });

            // Erro de mídia → re-assina no máximo MAX_RESIGNS vezes (com backoff);
            // depois cai para o iframe nativo em vez de entrar em loop de /api/sign.
            const MAX_RESIGNS = 2;
            let resigns = 0, dead = false;
            const giveUp = () => {
                dead = true;
                clearTimeout(video._refT);
                try { video.pause(); video.removeAttribute("src"); video.load(); } catch (e) {}
                if (mountIframe(mid)) { ac.abort(); host.remove(); }
                else toast("Falha ao carregar o vídeo");
            };
            const resetResigns = () => { resigns = 0; };
            video.addEventListener("loadeddata", resetResigns, { signal: ac.signal });
            video.addEventListener("playing", resetResigns, { signal: ac.signal });
            video.addEventListener("error", () => {
                if (recovering || dead) return;
                if (resigns >= MAX_RESIGNS) { giveUp(); return; }
                recovering = true;
                const delay = 1000 * 2 ** resigns;
                resigns++;
                setTimeout(() => {
                    if (!video.isConnected) { recovering = false; return; }
                    signUrl(id).then(newU => {
                        recovering = false;
                        const t = video.currentTime || 0, playing = !video.paused;
                        video.src = newU;
                        try { video.load(); } catch (e) {}
                        if (t) {
                            video.currentTime = t;
                            if (playing) video.play().catch(() => {});
                        }
                        scheduleRefresh(video, id);
                    }).catch(() => {
                        recovering = false;
                        giveUp();
                    });
                }, delay);
            }, { signal: ac.signal });

            const host = el("div", { class: "tb-host tb-pl" }, video);
            buildPlayerControls(host, video, u, id, ac);
            mid.appendChild(host);

            video.addEventListener("loadedmetadata", () => {
                if (!Number.isFinite(video.duration)) return;
                const text = fmtT(video.duration);
                const id = vidId();
                try { if (id) sessionStorage.setItem("tbdur:" + id, text); } catch {}
                const badge = document.querySelector(".tb-playlist-item.is-current .tb-playlist-dur");
                if (badge) { badge.textContent = text; badge.hidden = false; }
            }, { signal: ac.signal });
            video.src = u;
            try { video.load(); } catch (e) {}
            scheduleRefresh(video, id);
        }).catch(() => {
            spin.remove();
            if (mountIframe(mid)) {
                mediaMounted = true;
            } else {
                toast("Falha ao carregar o vídeo");
            }
        });
    }

    /* ===================== SIDEBAR PLAYLIST (Estilo YouTube AMOLED) ===================== */
    let stSidebarEl = null;
    let isSidebarCollapsed = !!prefs.sidebarCollapsed;

    function toggleSidebar(forceState) {
        const stage = document.querySelector(".tb-stage");
        if (!stage) return;
        isSidebarCollapsed = typeof forceState === "boolean" ? forceState : !isSidebarCollapsed;
        prefs.sidebarCollapsed = isSidebarCollapsed;
        saveP();
        stage.classList.toggle("is-sidebar-collapsed", isSidebarCollapsed);
        const btn = stage.querySelector(".tb-vrow-playlist");
        if (btn) btn.classList.toggle("is-active", !isSidebarCollapsed);
    }

    function makeThumbPlaceholder(kind, ext) {
        const ph = el("div", { class: "tb-playlist-placeholder" });
        const iconSpan = el("span", { class: "tb-playlist-ph-icon" });
        iconSpan.innerHTML = kindSvg(kind);
        const badge = el("span", { class: "tb-playlist-ph-ext" }, (ext || kind || "MP4").toUpperCase().slice(0, 5));
        ph.append(iconSpan, badge);
        return ph;
    }

    function parseFilesText(text) {
        const m = String(text || "").match(/const FILES = (\[[\s\S]*?\n\s*\]);/);
        if (!m) return [];
        try {
            const files = (new Function("return " + m[1]))();
            return Array.isArray(files) ? files : [];
        } catch { return []; }
    }
    let albumFilesPromise = null;
    function loadAlbumFiles() {
        if (albumFilesPromise) return albumFilesPromise;
        albumFilesPromise = (async () => {
            if (isAlbum) return parseFilesText(document.documentElement.innerHTML);
            const a = document.querySelector('a[href*="/a/"]');
            if (!a) return [];
            try {
                const html = await (await fetch(a.href, { credentials: "include" })).text();
                return parseFilesText(html);
            } catch { return []; }
        })();
        return albumFilesPromise;
    }
    const previewQueue = [];
    let previewBusy = 0;
    function pumpPreviews() {
        while (previewBusy < 2 && previewQueue.length) {
            const job = previewQueue.shift();
            previewBusy++;
            const done = () => { previewBusy = Math.max(0, previewBusy - 1); pumpPreviews(); };
            fetch("/api/sign?v=" + encodeURIComponent(job.id), { credentials: "include", headers: { Accept: "application/json" } })
                .then(r => r.json())
                .then(j => {
                    if (!j || !j.url || !job.host.isConnected) { done(); return; }
                    const v = document.createElement("video");
                    v.className = job.host.className || "";
                    v.muted = true;
                    v.defaultMuted = true;
                    v.playsInline = true;
                    v.preload = "metadata";
                    v.setAttribute("style", "width:100%;height:100%;object-fit:cover;background:#000;pointer-events:none;display:block");
                    job.host.replaceWith(v);
                    const finish = () => done();
                    v.addEventListener("loadeddata", finish, { once: true });
                    v.addEventListener("error", finish, { once: true });
                    setTimeout(finish, 12000);
                    v.src = j.url + (String(j.url).indexOf("#") === -1 ? "#t=0.8" : "");
                })
                .catch(done);
        }
    }
    function attachThumb(img, id) {
        if (!id || img.dataset.tbPrev) return;
        img.dataset.tbPrev = "1";
        previewQueue.push({ id, host: img });
        pumpPreviews();
    }

    function parseSidebarItems() {
        const stage = document.querySelector(".tb-stage");
        const cur = stage && stage._cur;
        const asideLinks = Array.from(document.querySelectorAll('a.related[href*="/v/"], a[href*="/v/"]')).filter(a => !a.closest(".tb-stage") && !a.closest(".tb-sidebar"));
        const items = [];
        const seen = new Set();
        const push = (item) => {
            if (!item.id || seen.has(item.id)) return;
            seen.add(item.id);
            items.push(item);
        };
        if (cur) {
            push({
                name: cur.name,
                href: cur.href,
                thumb: cur.thumb,
                id: vidId(),
                isCurrent: true,
                kind: "video",
                dur: 0
            });
        }
        asideLinks.forEach(a => {
            const href = a.getAttribute("href") || "#";
            const img = a.querySelector("img");
            const nameEl = a.querySelector(".truncate, .font-semibold");
            const name = (nameEl ? nameEl.textContent : a.textContent || "").replace(/\s+/g, " ").trim();
            const id = (href.match(/\/v\/([^/?#]+)/) || [])[1] || "";
            push({
                name,
                href,
                thumb: (img && (img.getAttribute("src") || "")) || "",
                id,
                isCurrent: id === vidId(),
                kind: "video",
                dur: 0
            });
        });
        return items;
    }

    let playlistGen = 0;
    async function renderPlaylist() {
        if (!stSidebarEl) return;
        const listEl = stSidebarEl.querySelector(".tb-playlist-list");
        if (!listEl) return;
        const gen = ++playlistGen;

        const albumFiles = await loadAlbumFiles();
        if (gen !== playlistGen || !listEl.isConnected) return;
        const curId = vidId();
        const seen = new Set();
        let allItems = (albumFiles.length ? albumFiles.map(f => ({
            name: f.name || f.id,
            href: "/v/" + f.id,
            thumb: "",
            id: f.id,
            isCurrent: f.id === curId,
            kind: "video",
            dur: Number(f.dur) || 0
        })) : parseSidebarItems()).filter(it => {
            if (!it.id || seen.has(it.id)) return false;
            seen.add(it.id);
            return true;
        });
        listEl.textContent = "";
        playlistItems = allItems;
        applyListPosition(allItems);
        const q = (stSidebarEl.querySelector(".tb-sidebar-search-in")?.value || "").trim().toLowerCase();
        const activeTab = prefs.sidebarTab || "all";
        const sortMode = prefs.sidebarSort || "default";

        let filtered = allItems.filter(item => {
            if (q && item.name.toLowerCase().indexOf(q) === -1) return false;
            if (activeTab === "video" && item.kind !== "video") return false;
            if (activeTab === "image" && item.kind !== "image") return false;
            if (activeTab === "text" && item.kind !== "text") return false;
            return true;
        });

        if (sortMode === "az") {
            filtered.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
        }

        const countEl = stSidebarEl.querySelector(".tb-sidebar-count");
        if (countEl) countEl.textContent = `${filtered.length} vídeos`;

        stSidebarEl.querySelectorAll(".tb-tab-chip").forEach(tab => {
            const t = tab.dataset.tab;
            let n = allItems.length;
            if (t === "video") n = allItems.filter(i => i.kind === "video").length;
            else if (t === "image") n = allItems.filter(i => i.kind === "image").length;
            else if (t === "text") n = allItems.filter(i => i.kind === "text").length;
            const c = tab.querySelector(".tb-tab-count");
            if (c) c.textContent = n;
            tab.style.display = (t !== "all" && n === 0) ? "none" : "";
        });

        if (!filtered.length) {
            listEl.innerHTML = `<div class="tb-playlist-empty">Nenhum vídeo encontrado.</div>`;
            return;
        }

        filtered.forEach((item, idx) => {
            const dt = extractDateFromTitle(item.name);
            const cleanTitle = cleanTitleWithoutDate(item.name, dt);

            const card = el("a", {
                class: "tb-playlist-item" + (item.isCurrent ? " is-current" : ""),
                href: hrefWithPosition(item.href, idx + 1),
                title: item.name
            });

            const thumbWrap = el("div", { class: "tb-playlist-thumb-wrap" });
            if (item.thumb || item.id) {
                const img = el("img", { class: "tb-playlist-thumb", alt: "", loading: "lazy" });
                attachThumb(img, item.id);
                thumbWrap.appendChild(img);
            } else {
                thumbWrap.appendChild(makeThumbPlaceholder(item.kind, "MP4"));
            }

            const kindLabel = item.kind === "image" ? "Imagem" : "Video";
            thumbWrap.appendChild(el("span", { class: "tb-playlist-kind" }, kindLabel));
            thumbWrap.appendChild(el("span", { class: "tb-playlist-num" }, String(idx + 1)));
            if (item.kind === "video") {
                let known = item.dur > 0 ? fmtT(item.dur) : "";
                if (!known) { try { known = sessionStorage.getItem("tbdur:" + (item.id || "")) || ""; } catch {} }
                const durEl = el("span", { class: "tb-playlist-dur" }, known);
                durEl.hidden = !known;
                thumbWrap.appendChild(durEl);
            }

            const info = el("div", { class: "tb-playlist-info" });
            info.append(el("span", { class: "tb-playlist-name" }, cleanTitle));

            // Metadados de data
            const datesWrap = el("div", { class: "tb-playlist-dates" });
            if (dt && dt.displayDate) {
                const tipEl = el("span", {
                    class: "tb-has-tip",
                    title: "Data identificada e extraída do nome do arquivo (definida no upload)"
                }, el("span", { class: "tb-tip-icon" }, "ⓘ"));
                datesWrap.appendChild(el("div", { class: "tb-playlist-date-row" },
                    el("span", { class: "tb-playlist-date-lbl" }, "Data extraída:"),
                    el("span", { class: "tb-playlist-date-val" }, dt.displayDate),
                    tipEl
                ));
            }
            if (datesWrap.childNodes.length) info.appendChild(datesWrap);

            if (item.isCurrent) {
                const meta = el("div", { class: "tb-playlist-meta" });
                meta.append(el("span", { class: "tb-playlist-meta-active" }, "Reproduzindo agora"));
                info.appendChild(meta);
            }

            card.append(thumbWrap, info);
            listEl.appendChild(card);
        });

        // Scroll auto para o item atual
        setTimeout(() => {
            const curItem = listEl.querySelector(".is-current");
            if (curItem) {
                try { curItem.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch { curItem.scrollIntoView(); }
            }
        }, 50);
    }

    function setupSidebar(stage) {
        if (stSidebarEl && stSidebarEl.parentNode === stage) {
            renderPlaylist();
            return;
        }

        const sb = el("div", { class: "tb-sidebar" });

        const header = el("div", { class: "tb-sidebar-header" });
        header.innerHTML = `
            <div class="tb-sidebar-title-wrap">
                <span class="tb-sidebar-icon">${IC.playlist}</span>
                <span class="tb-sidebar-title">Playlist</span>
                <span class="tb-sidebar-count">0 vídeos</span>
            </div>
        `;
        const collapseBtn = el("button", {
            type: "button",
            class: "tb-sidebar-collapse-btn",
            title: "Recolher playlist (p)",
            onClick: () => toggleSidebar()
        });
        collapseBtn.innerHTML = IC.close;
        const albumA = document.querySelector('a[href*="/a/"]');
        const actions = el("div", { style: { display: "flex", alignItems: "center", gap: "8px" } });
        if (albumA) {
            const gal = el("a", { class: "tb-sidebar-gallery", href: albumA.href, title: "Abrir a galeria do álbum" });
            gal.insertAdjacentHTML("beforeend", IC.grid);
            gal.append(el("span", null, "Galeria"));
            actions.append(gal);
        }
        actions.append(collapseBtn);
        header.appendChild(actions);

        const searchWrap = el("div", { class: "tb-sidebar-search" });
        searchWrap.innerHTML = `<span class="tb-sidebar-search-icon">${IC.search}</span>`;
        const searchIn = el("input", {
            type: "search",
            class: "tb-sidebar-search-in",
            placeholder: "Buscar na playlist...",
            value: ""
        });
        searchIn.addEventListener("input", debounce(() => renderPlaylist(), 140));
        searchIn.addEventListener("keydown", e => e.stopPropagation());
        searchWrap.appendChild(searchIn);

        const tabsWrap = el("div", { class: "tb-sidebar-tabs" });
        const makeTab = (key, label) => {
            const b = el("button", {
                type: "button",
                class: "tb-tab-chip" + (prefs.sidebarTab === key ? " is-active" : "")
            });
            b.dataset.tab = key;
            b.innerHTML = `<span>${label}</span> <span class="tb-tab-count">0</span>`;
            b.addEventListener("click", () => {
                prefs.sidebarTab = key; saveP();
                tabsWrap.querySelectorAll(".tb-tab-chip").forEach(t => t.classList.remove("is-active"));
                b.classList.add("is-active");
                renderPlaylist();
            });
            return b;
        };
        tabsWrap.append(
            makeTab("all", "Todos"),
            makeTab("video", "Vídeos")
        );

        const sortWrap = el("div", { class: "tb-sidebar-sort" });
        const makeSort = (key, label) => {
            const b = el("button", {
                type: "button",
                class: "tb-sort-chip" + (prefs.sidebarSort === key ? " is-active" : "")
            });
            b.dataset.sort = key;
            b.textContent = label;
            b.addEventListener("click", () => {
                prefs.sidebarSort = key; saveP();
                sortWrap.querySelectorAll(".tb-sort-chip").forEach(s => s.classList.remove("is-active"));
                b.classList.add("is-active");
                renderPlaylist();
            });
            return b;
        };
        sortWrap.append(
            el("span", { class: "tb-sort-label" }, "Ordem:"),
            makeSort("default", "Padrão"),
            makeSort("az", "A-Z")
        );

        const listEl = el("div", { class: "tb-playlist-list" });

        sb.append(header, searchWrap, tabsWrap, sortWrap, listEl);
        stage.appendChild(sb);
        stSidebarEl = sb;
        renderPlaylist();
    }

    function readPosition() {
        try { const n = parseInt(new URL(location.href).searchParams.get("position") || "", 10); return Number.isFinite(n) && n > 0 ? n : 0; } catch { return 0; }
    }
    function hrefWithPosition(href, n) {
        try { const u = new URL(href, location.origin); u.searchParams.set("position", String(n)); return u.pathname + u.search + u.hash; } catch { return href; }
    }
    let playlistItems = [];
    function navFile(dir) {
        const items = playlistItems.length ? playlistItems : parseSidebarItems();
        if (items.length < 2) return;
        const curPath = location.pathname;
        let i = items.findIndex(it => {
            try { return new URL(it.href, location.origin).pathname === curPath; } catch (e) { return it.href === curPath; }
        });
        if (i < 0) i = 0;
        const ni = (i + dir + items.length) % items.length;
        const next = items[ni];
        if (next && next.href) location.href = hrefWithPosition(next.href, ni + 1);
    }
    function applyListPosition(items) {
        if (!items || !items.length) return;
        const want = readPosition();
        const curPath = location.pathname;
        const i = items.findIndex(it => {
            try { return new URL(it.href, location.origin).pathname === curPath; } catch (e) { return false; }
        });
        if (want && items[want - 1]) {
            let targetPath = "";
            try { targetPath = new URL(items[want - 1].href, location.origin).pathname; } catch (e) {}
            if (targetPath && targetPath !== curPath) {
                location.replace(hrefWithPosition(items[want - 1].href, want));
                return;
            }
        }
        if (i >= 0 && !want) history.replaceState(history.state, "", hrefWithPosition(location.href, i + 1));
    }

    function debounce(fn, ms) { let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; }

    /* ===================== STAGE BUILDER ===================== */
    let mediaMounted = false;
    function buildStage() {
        if (document.querySelector(".tb-stage")) return document.querySelector(".tb-stage");
        const id = vidId();
        const titleEl = document.getElementById("videoTitle");
        if (!id || !titleEl) return null;
        const name = (titleEl.textContent || "").replace(/\s+/g, " ").trim();
        const imagePage = IMAGE_NAME.test(name);
        const sizeEl = document.getElementById("videoSize");
        const viewsEl = document.getElementById("videoViews");
        const size = sizeEl ? (sizeEl.textContent || "").trim() : "";
        const views = viewsEl ? (viewsEl.textContent || "").trim() : "";
        const albumA = document.querySelector('a[href*="/a/"]');
        const dlA = document.getElementById("btnDownload") || document.querySelector('a[href*="/d/"]');

        const stage = el("div", { class: "tb-stage " + (imagePage ? "is-image" : "is-video") + (isSidebarCollapsed ? " is-sidebar-collapsed" : "") });
        const main = el("div", { class: "tb-stage-main" });

        // ---- vrow (topbar) ----
        const vrow = el("div", { class: "tb-vrow" });
        const vtop = el("div", { class: "tb-vrow-top" });
        const logo = el("a", { class: "tb-top-logo", href: "/", title: "Turbo" },
            el("img", { class: "tb-logo-img", src: location.origin + "/static/favicon.svg", alt: "Turbo" }),
            el("span", null, "Turbo")
        );
        const nameEl = el("div", { class: "tb-name", title: name });
        nameEl.insertAdjacentHTML("beforeend", imagePage ? IC.image : IC.video);
        nameEl.append(el("span", null, name));
        vtop.append(logo, nameEl);

        const vsub = el("div", { class: "tb-vrow-sub" });
        const stats = el("div", { class: "tb-stats" });
        if (size) stats.append(el("span", { class: "tb-stat" }, size));
        if (views) stats.append(el("span", { class: "tb-stat" }, views));
        vsub.append(stats, el("div", { class: "tb-spacer" }));

        // Botão Playlist (visível apenas quando a sidebar estiver fechada)
        const plBtn = el("button", {
            type: "button",
            class: "tb-item tb-vrow-playlist" + (!isSidebarCollapsed ? " is-active" : ""),
            title: "Abrir / fechar playlist (p)",
            onClick: () => toggleSidebar()
        });
        plBtn.insertAdjacentHTML("beforeend", IC.playlist);
        plBtn.append(el("span", null, "Playlist"));
        vsub.append(plBtn);

        vrow.append(vtop, vsub);

        // ---- mid (player) ----
        const mid = el("div", { class: "tb-stage-mid" });
        const navPrev = el("button", { class: "tb-nav-side tb-nav-prev", title: "Anterior", onClick: e => { e.stopPropagation(); navFile(-1); } });
        navPrev.insertAdjacentHTML("beforeend", IC.chevL);
        const navNext = el("button", { class: "tb-nav-side tb-nav-next", title: "Próximo", onClick: e => { e.stopPropagation(); navFile(1); } });
        navNext.insertAdjacentHTML("beforeend", IC.chevR);
        mid.append(navPrev, navNext);

        main.append(vrow, mid);
        stage.appendChild(main);

        stage._cur = { name, href: location.pathname + location.search, thumb: "" };

        document.body.insertBefore(stage, document.body.firstChild);
        document.documentElement.classList.add("tb-has-stage");

        if (imagePage) mountPhoto(mid, id);
        else mountVideo(mid, id);

        // Monta Sidebar da Playlist
        setupSidebar(stage);

        const aside = document.querySelector("aside") || document.body;
        try { new MutationObserver(debounce(() => renderPlaylist(), 250)).observe(aside, { childList: true, subtree: true }); } catch (e) {}
        return stage;
    }

    /* ===================== ÁLBUM (/a/): TABELA → GRADE COM AGRUPAMENTO ===================== */
    let isAlbumGrouped = !!prefs.groupByType;

    function buildAlbumGrid() {
        if (document.querySelector(".tb-grid")) return true;
        const files = parseFilesText(document.documentElement.innerHTML);
        const tbody = document.getElementById("fileTbody");
        const rows = tbody ? Array.from(tbody.querySelectorAll("tr.file-row")) : [];
        if (!files.length && !rows.length) return false;

        const data = files.length ? files.map((f, idx) => ({
            id: f.id,
            origIdx: idx,
            name: f.name || f.id,
            size: f.size || 0,
            sizeText: "",
            views: f.views || 0,
            href: "/v/" + f.id,
            thumb: f.thumb || "",
            type: ((f.name || "").split(".").pop() || "mp4"),
            kind: "video"
        })) : rows.map((row, idx) => {
            const a = row.querySelector("a[data-thumb]") || row.querySelector('a[href*="/v/"]');
            const id = row.dataset.id || "";
            const sizeTd = row.querySelector(".file-size");
            const rawType = (row.children[2] && (row.children[2].textContent || "").trim().toLowerCase()) || "mp4";
            let kind = "video";
            if (/\.(jpe?g|png|gif|webp|avif)$/i.test(rawType) || rawType === "image") kind = "image";
            else if (/\.(txt|md|nfo|log)$/i.test(rawType) || rawType === "text") kind = "text";

            return {
                id,
                origIdx: idx,
                name: row.dataset.name || (a ? a.textContent.replace(/\s+/g, " ").trim() : "") || id,
                size: parseInt(row.dataset.size || "0", 10) || 0,
                sizeText: sizeTd ? (sizeTd.textContent || "").trim() : "",
                views: parseInt(row.dataset.views || "0", 10) || 0,
                href: (a && a.getAttribute("href")) || ("/v/" + id),
                thumb: (a && a.getAttribute("data-thumb")) || (id ? THUMB_BASE + id + ".jpg" : ""),
                type: rawType,
                kind
            };
        });

        const grid = el("div", { class: "tb-grid" });
        if (tbody) {
            const table = tbody.closest("table") || tbody;
            const wrap = table.closest(".overflow-x-auto") || table;
            wrap.style.display = "none";
            wrap.insertAdjacentElement("afterend", grid);
        } else {
            const native = document.getElementById("grid");
            const list = document.getElementById("list");
            if (native) native.style.display = "none";
            if (list) list.style.display = "none";
            const anchor = native || document.getElementById("rows") || document.querySelector("main") || document.body;
            anchor.insertAdjacentElement("afterend", grid);
        }

        // Botão Agrupar por Tipo na barra do álbum
        const albumControls = document.querySelector(".flex.flex-wrap.items-center.gap-4, .mb-6.flex, .max-w-6xl .flex");
        if (albumControls && !albumControls.querySelector(".tb-group-toggle-btn")) {
            const grpBtn = el("button", {
                type: "button",
                class: "tb-group-toggle-btn" + (isAlbumGrouped ? " is-active" : ""),
                onClick: () => {
                    isAlbumGrouped = !isAlbumGrouped;
                    prefs.groupByType = isAlbumGrouped;
                    saveP();
                    grpBtn.classList.toggle("is-active", isAlbumGrouped);
                    render();
                }
            });
            grpBtn.innerHTML = `${IC.playlist} <span>Agrupar por Tipo</span>`;
            albumControls.appendChild(grpBtn);
        }

        const cards = data.map(d => {
            const dt = extractDateFromTitle(d.name);
            const cleanTitle = cleanTitleWithoutDate(d.name, dt);

            const card = el("div", { class: "tb-card" });
            const link = el("a", { class: "tb-card-link", href: d.href });
            const th = el("div", { class: "tb-card-thumb" });

            if (d.thumb || d.id) {
                const img = el("img", { alt: "", loading: "lazy" });
                attachThumb(img, d.id);
                th.appendChild(img);
            } else {
                th.appendChild(makeThumbPlaceholder(d.kind, d.type));
            }

            const play = el("div", { class: "tb-card-play" });
            play.insertAdjacentHTML("beforeend", "<span>" + IC.video + "</span>");
            th.appendChild(play);

            const body = el("div", { class: "tb-card-body" });
            body.append(el("div", { class: "tb-card-name", title: d.name }, cleanTitle));

            // Metadados de data
            const datesWrap = el("div", { class: "tb-card-dates" });
            if (dt && dt.displayDate) {
                const tipEl = el("span", {
                    class: "tb-has-tip",
                    title: "Data identificada e extraída do nome do arquivo (definida no upload)"
                }, el("span", { class: "tb-tip-icon" }, "ⓘ"));
                datesWrap.appendChild(el("div", { class: "tb-card-date-row" },
                    el("span", { class: "tb-card-date-lbl" }, "Data extraída:"),
                    el("span", { class: "tb-card-date-val" }, dt.displayDate),
                    tipEl
                ));
            }
            if (datesWrap.childNodes.length) body.appendChild(datesWrap);

            body.append(el("div", { class: "tb-card-meta" }, [d.type.toUpperCase(), d.sizeText, d.views ? (d.views + " views") : ""].filter(Boolean).join(" · ")));
            link.append(th, body);
            card.append(link);

            const dl = el("a", { class: "tb-card-dl", href: "/d/" + d.id, title: "Download" });
            dl.insertAdjacentHTML("beforeend", IC.download);
            card.append(dl);
            return { d, card };
        });

        function render() {
            const q = (((document.getElementById("searchInput") || {}).value) || "").toLowerCase().trim();
            const sort = ((document.getElementById("sortSelect") || {}).value) || "name_asc";
            let list = cards.filter(c => !q || c.d.name.toLowerCase().indexOf(q) !== -1);
            const cmp = {
                name_asc: (a, b) => a.d.name.localeCompare(b.d.name),
                name_desc: (a, b) => b.d.name.localeCompare(a.d.name),
                size_asc: (a, b) => a.d.size - b.d.size,
                size_desc: (a, b) => b.d.size - a.d.size,
                views_asc: (a, b) => a.d.views - b.d.views,
                views_desc: (a, b) => b.d.views - a.d.views,
            }[sort];
            if (cmp) list = list.slice().sort(cmp);
            grid.textContent = "";

            if (!list.length) { grid.append(el("div", { class: "tb-empty" }, "Nenhum arquivo encontrado")); return; }

            if (!isAlbumGrouped) {
                list.forEach(c => grid.append(c.card));
                return;
            }

            const groups = { video: [], image: [], text: [], other: [] };
            list.forEach(c => {
                if (groups[c.d.kind]) groups[c.d.kind].push(c);
                else groups.other.push(c);
            });

            const defs = [
                { key: "video", title: "Vídeos", icon: IC.video, items: groups.video },
                { key: "image", title: "Fotos", icon: IC.image, items: groups.image },
                { key: "text", title: "Textos & Documentos", icon: IC.fileText, items: groups.text },
                { key: "other", title: "Outros", icon: IC.grid, items: groups.other }
            ];

            defs.forEach(def => {
                if (!def.items.length) return;
                const hdr = el("div", { class: "tb-album-group-header" },
                    el("div", { class: "tb-album-group-title" },
                        el("span", { html: def.icon }),
                        el("span", null, def.title)
                    ),
                    el("span", { class: "tb-album-group-count" }, `${def.items.length} ${def.items.length === 1 ? "item" : "itens"}`)
                );
                grid.appendChild(hdr);
                def.items.forEach(c => grid.appendChild(c.card));
            });
        }

        const si = document.getElementById("searchInput"); if (si) si.addEventListener("input", render);
        const ss = document.getElementById("sortSelect"); if (ss) ss.addEventListener("change", render);
        render();
        return true;
    }

    /* ===================== BOOT ===================== */
    function onReady(fn) {
        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
        else fn();
    }
    onReady(() => {
        if (isAlbum) {
            let n = 0; const aid = setInterval(() => { if (buildAlbumGrid() || ++n > 20) clearInterval(aid); }, 300);
            buildAlbumGrid();
            return;
        }
        if (!isVideo) return;
        let n = 0, id = null;
        const stop = () => { if (id) clearInterval(id); };
        const tick = () => {
            const stage = buildStage();
            if (stage && mediaMounted) { stop(); return; }
            if (++n > 16) {
                stop();
                if (!mediaMounted) {
                    document.documentElement.classList.add("tb-fallback");
                    const st = document.querySelector(".tb-stage");
                    if (st) st.remove();
                    document.documentElement.classList.remove("tb-has-stage");
                }
            }
        };
        tick();
        id = setInterval(tick, 400);
    });
})();
