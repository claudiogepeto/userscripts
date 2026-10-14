// ==UserScript==
// @name         Filester — Theater Stage, Custom Player, Album Strip & Gallery
// @namespace    filester-theater
// @version      2.5.2
// @updateURL    https://raw.githubusercontent.com/claudiogepeto/userscripts/main/dist/filester.user.js
// @downloadURL  https://raw.githubusercontent.com/claudiogepeto/userscripts/main/dist/filester.user.js
// @description  Theater stage, custom player, YouTube-style playlist sidebar with tabs and placeholders, adjacent prev/next controls, flat 1x speed, gallery grouping, text viewer, zoomable images, and AMOLED styling for Filester.
// @author       claudiogepeto
// @match        *://filester.me/*
// @match        *://*.filester.me/*
// @match        *://filester.sh/*
// @match        *://*.filester.sh/*
// @match        *://filester.gg/*
// @match        *://*.filester.gg/*
// @match        *://filester.to/*
// @match        *://*.filester.to/*
// @match        *://filester.is/*
// @match        *://*.filester.is/*
// @match        *://filester.si/*
// @match        *://*.filester.si/*
// @noframes
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// ==/UserScript==
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

        .fl-plc-flash { position: absolute; inset: 0; z-index: 2; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .2s ease; }
        .fl-pl:not(.is-playing):not(.is-buffering) .fl-plc-flash { opacity: 1; pointer-events: auto; cursor: pointer; }
        .fl-plc-flash button { border: 0; border-radius: 50%; cursor: pointer; padding: 0; background: rgba(0,0,0,.6); color: #fff; display: flex; align-items: center; justify-content: center; transition: transform .12s ease, background .12s ease; pointer-events: auto; }
        .fl-plc-flash button:hover { transform: scale(1.08); background: rgba(0,0,0,.8); }
        .fl-plc-play { width: 64px; height: 64px; }
        .fl-plc-play svg { width: 28px; height: 28px; display: block; margin-left: 3px; }

        .fl-plc-seekflash { position: absolute; top: 50%; transform: translate(-50%, -50%); z-index: 3; padding: 9px 18px; border-radius: 24px; background: rgba(0,0,0,.75); color: #fff; font: 700 15px/1 Inter, sans-serif; pointer-events: none; opacity: 0; transition: opacity .15s ease; }
        .fl-plc-seekflash.on { opacity: 1; }

        .fl-plc-bottom {
            position: absolute; left: 0; right: 0; bottom: 0; z-index: 4; display: flex; flex-direction: column;
            padding: 0 14px 10px; background: linear-gradient(to top, rgba(0,0,0,.9) 0%, rgba(0,0,0,.45) 65%, transparent 100%);
            opacity: 0; pointer-events: none; transition: opacity .18s ease; gap: 4px;
        }
        .fl-host:hover .fl-plc-bottom, .fl-pl:not(.is-playing) .fl-plc-bottom, .fl-img-host:hover .fl-plc-bottom, .fl-img-host:focus-within .fl-plc-bottom { opacity: 1; pointer-events: auto; }
        @media (hover: none) { .fl-plc-bottom { opacity: 1; pointer-events: auto; } }

        .fl-plc-prog { position: relative; width: 100%; height: 16px; display: flex; align-items: center; cursor: pointer; touch-action: none; }
        .fl-plc-bar { position: relative; width: 100%; height: 3.5px; background: rgba(255,255,255,.25); border-radius: 2px; transition: height .1s ease; }
        .fl-plc-prog:hover .fl-plc-bar { height: 5px; }
        .fl-plc-buf { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: rgba(255,255,255,.38); border-radius: 2px; pointer-events: none; }
        .fl-plc-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: var(--fl-accent, #14b8a6); border-radius: 2px; pointer-events: none; }
        .fl-plc-knob { position: absolute; right: -6px; top: 50%; transform: translateY(-50%) scale(0); width: 12px; height: 12px; border-radius: 50%; background: var(--fl-accent, #14b8a6); box-shadow: 0 0 4px rgba(0,0,0,.5); transition: transform .1s ease; }
        .fl-plc-prog:hover .fl-plc-knob { transform: translateY(-50%) scale(1); }

        .fl-plc-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
        .fl-plc-left, .fl-plc-right { display: flex; align-items: center; gap: 3px; }
        .fl-plc-act { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: 0; background: transparent; color: #fff; cursor: pointer; border-radius: 50%; font: 600 13px/1 Inter, sans-serif; transition: background .12s, color .12s; }
        .fl-plc-act:hover { background: rgba(255,255,255,.14); color: var(--fl-accent, #14b8a6); }
        .fl-plc-act svg { width: 22px; height: 22px; display: block; }
        .fl-plc-skip { position: relative; }
        .fl-plc-skipn { position: absolute; font-size: 8.5px; font-weight: 800; top: 52%; left: 50%; transform: translate(-50%, -50%); color: #fff; }
        .fl-plc-time { font-size: 12px; font-weight: 600; color: rgba(255,255,255,.88); padding: 0 6px; font-variant-numeric: tabular-nums; white-space: nowrap; }

        .fl-plc-vol { display: flex; align-items: center; gap: 2px; }
        .fl-plc-volbar { width: 0; height: 28px; display: flex; align-items: center; cursor: pointer; overflow: hidden; transition: width .18s ease, margin .18s ease; touch-action: none; }
        .fl-plc-vol:hover .fl-plc-volbar, .fl-plc-volbar:hover { width: 62px; margin-right: 4px; }
        .fl-plc-volfill { width: 100%; height: 4px; background: #fff; border-radius: 2px; position: relative; }

        /* Velocidade plana (sem pill pesado) */
        .fl-plc-act.is-active { color: ${ACCENT}; }
        .fl-plc-autoplay { width: auto; height: 30px; padding: 0 8px 0 10px; border-radius: 15px; gap: 8px; font: 600 12px/1 Inter, system-ui, sans-serif; color: rgba(255,255,255,.85); background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); }
        .fl-plc-autoplay.is-active { background: rgba(20,184,166,.16); border-color: rgba(20,184,166,.45); color: #fff; }
        .fl-plc-ap-pill { position: relative; width: 28px; height: 16px; border-radius: 9px; background: rgba(255,255,255,.24); display: block; flex: 0 0 28px; }
        .fl-plc-ap-knob { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: #fff; display: block; transition: transform .18s ease; }
        .fl-plc-autoplay.is-active .fl-plc-ap-pill { background: ${ACCENT}; }
        .fl-plc-autoplay.is-active .fl-plc-ap-knob { transform: translateX(12px); background: #04221e; }
        .fl-plc-speed { width: auto !important; min-width: 32px; padding: 0 6px; color: #fff; font: 700 13px/1 Inter, sans-serif; font-variant-numeric: tabular-nums; background: transparent !important; }
        .fl-plc-speedwrap { position: relative; }
        .fl-plc-speedmenu { position: absolute; bottom: 42px; right: 0; background: rgba(18,20,26,.96); border: 1px solid rgba(255,255,255,.12); border-radius: 10px; padding: 6px; display: none; flex-direction: column; gap: 2px; min-width: 86px; max-height: 240px; overflow-y: auto; box-shadow: 0 10px 28px rgba(0,0,0,.6); z-index: 10; }
        .fl-plc-speedmenu.open { display: flex; }
        .fl-plc-speeditem { border: 0; background: transparent; color: #fff; padding: 6px 10px; font: 600 12.5px/1 Inter, sans-serif; border-radius: 6px; cursor: pointer; text-align: left; }
        .fl-plc-speeditem:hover { background: rgba(255,255,255,.1); }
        .fl-plc-speeditem.on { color: var(--fl-accent, #14b8a6); font-weight: 800; }

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
            .fl-plc-row { flex-direction: column !important; align-items: stretch !important; gap: 3px !important; }
            .fl-plc-left, .fl-plc-right { width: 100% !important; height: 34px !important; }
            .fl-plc-left .fl-plc-time { margin-left: auto !important; }
            .fl-plc-right { justify-content: flex-end !important; padding-top: 3px !important; border-top: 1px solid rgba(255,255,255,.08) !important; }
            .fl-plc-autoplay { margin-right: auto !important; width: auto !important; }
            .fl-vrow { flex-wrap: wrap !important; height: auto !important; padding: 8px 10px !important; }
            .fl-vrow-top { width: 100% !important; justify-content: space-between !important; }
            .fl-vrow-sub { width: 100% !important; justify-content: flex-start !important; overflow-x: auto !important; }
            .fl-name { max-width: 75vw !important; }
        }
        @media (max-width: 600px) {
            .fl-plc-act { width: 30px; height: 30px; }
            .fl-plc-act svg { width: 20px; height: 20px; }
        }
    `;

    function addCSS(css) {
        if (typeof GM_addStyle === "function") { GM_addStyle(css); return; }
        const s = document.createElement("style"); s.textContent = css;
        (document.head || document.documentElement).appendChild(s);
    }
    addCSS(CSS);

    const keepRoot = () => { const c = document.documentElement.classList; if (!c.contains("fl")) c.add("fl"); if (isFile && !c.contains("fl-file")) c.add("fl-file"); if (isAlbum && !c.contains("fl-album")) c.add("fl-album"); };
    try { new MutationObserver(keepRoot).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] }); } catch (e) {}

    /* ===================== HELPERS ===================== */
    const PREFS_KEY = "filester_prefs";
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
    const PL_ICONS = {
        play: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M7 4.5v15a1 1 0 0 0 1.52.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>',
        pause: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>',
        volume: svgi('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>'),
        mute: svgi('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>'),
        expand: svgi('<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>'),
        download: svgi('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
        skipBack: svgi('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>'),
        skipFwd: svgi('<path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>'),
        prevTrack: svgi('<polygon points="19 20 9 12 19 4 19 20" fill="currentColor"/><line x1="5" y1="19" x2="5" y2="5" stroke-width="2.5"/>'),
        nextTrack: svgi('<polygon points="5 4 15 12 5 20 5 4" fill="currentColor"/><line x1="19" y1="5" x2="19" y2="19" stroke-width="2.5"/>'),
        playlist: svgi('<line x1="3" y1="6" x2="15" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="11" y2="18"/><polygon points="17,14 22,17 17,20" fill="currentColor" stroke="none"/>'),
        chevL: svgi('<path d="m15 18-6-6 6-6"/>'),
        chevR: svgi('<path d="m9 18 6-6-6-6"/>'),
        grid: svgi('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
        image: svgi('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'),
        video: svgi('<rect x="2" y="5" width="14" height="14" rx="2"/><path d="m22 8-6 4 6 4V8z"/>'),
        fileText: svgi('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'),
        copy: svgi('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
        repeat: svgi('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'),
        flag: svgi('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>'),
        close: svgi('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
        search: svgi('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
        check: svgi('<polyline points="20 6 9 17 4 12"/>'),
        share: svgi('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>'),
        pip: svgi('<rect x="2" y="4" width="20" height="16" rx="2"/><rect x="12" y="10" width="8" height="8" rx="1"/>'),
        prev: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M6 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1zm12.44 1.34a1 1 0 0 0-1.44-.88l-9 5.5a1 1 0 0 0 0 1.72l9 5.5A1 1 0 0 0 19 17.5v-11a1 1 0 0 0-.56-.86z"/></svg>',
        next: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M18 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1zM5.56 6.66a1 1 0 0 0-1.56.84v11a1 1 0 0 0 1.56.84l9-5.5a1 1 0 0 0 0-1.68l-9-5.5z"/></svg>'
    };

    function kindSvg(k) {
        if (k === "video") return PL_ICONS.video;
        if (k === "image") return PL_ICONS.image;
        if (k === "text") return PL_ICONS.fileText;
        return PL_ICONS.fileText;
    }

    const fmtT = s => { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60; const p = n => String(n).padStart(2, "0"); return h ? h + ":" + p(m) + ":" + p(ss) : m + ":" + p(ss); };

    let toastT;
    function toast(msg) {
        let t = document.querySelector(".fl-toast");
        if (!t) { t = el("div", { class: "fl-toast" }); (document.body || document.documentElement).appendChild(t); }
        t.textContent = msg; t.classList.add("show");
        clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 1800);
    }
    function fallbackCopy(s) { try { const t = el("textarea", { style: { position: "fixed", opacity: "0", left: "-9999px" } }); t.value = s; document.body.appendChild(t); t.select(); const ok = document.execCommand("copy"); t.remove(); return ok; } catch { return false; } }
    function copyText(s) {
        if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(s).then(() => true, () => fallbackCopy(s));
        return Promise.resolve(fallbackCopy(s));
    }

    function isVidName(n) { return /\.(mp4|m4v|mov|webm|mkv|avi|ts|flv)$/i.test(n || ""); }
    function isImgName(n) { return /\.(jpe?g|png|gif|webp|avif|bmp|svg)$/i.test(n || ""); }
    function isTxtName(n) { return /\.(txt|md|nfo|log|json|csv)$/i.test(n || ""); }

    function getMediaKind(name) {
        if (isVidName(name)) return "video";
        if (isImgName(name)) return "image";
        if (isTxtName(name)) return "text";
        return "other";
    }

    function debounce(fn, ms) { let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; }

    /* ===================== CONTROLES DO PLAYER (estilo YouTube) ===================== */
    function buildPlayerControls(wrap, video, src, ac) {
        const on = (e, ev, fn) => e.addEventListener(ev, fn, ac ? { signal: ac.signal } : undefined);
        const mkAct = (ic, label, cb) => { const b = el("button", { type: "button", class: "fl-plc-act", title: label, "aria-label": label }); b.innerHTML = ic; b.addEventListener("click", cb); return b; };
        const toggle = () => {
            if (video.paused || video.ended) {
                const p = video.play();
                if (p && p.catch) {
                    p.catch(err => {
                        console.warn("[filester] play rejected, tentando mudo:", err);
                        video.muted = true;
                        video.play().catch(e => console.error("[filester] play com mudo falhou:", e));
                    });
                }
            } else {
                video.pause();
            }
        };
        const sflash = el("div", { class: "fl-plc-seekflash" }); let sft;
        const seek = d => { if (!video.duration) return; video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + d)); sflash.textContent = d < 0 ? "« 5s" : "5s »"; sflash.classList.add("on"); clearTimeout(sft); sft = setTimeout(() => sflash.classList.remove("on"), 480); };
        let clickT = null;
        on(video, "click", e => { e.preventDefault(); e.stopPropagation(); if (clickT) return; clickT = setTimeout(() => { clickT = null; toggle(); }, 230); });
        on(video, "dblclick", e => { e.preventDefault(); e.stopPropagation(); if (clickT) { clearTimeout(clickT); clickT = null; } const r = video.getBoundingClientRect(); seek((e.clientX - r.left) < r.width / 2 ? -5 : 5); });
        const playBtn = el("button", { type: "button", class: "fl-plc-play", "aria-label": "Play/Pause" }); playBtn.innerHTML = PL_ICONS.play;
        playBtn.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); toggle(); });
        const flash = el("div", { class: "fl-plc-flash" }, playBtn);
        flash.addEventListener("click", e => {
            if (e.target !== flash && !flash.contains(e.target)) return;
            e.preventDefault(); e.stopPropagation(); toggle();
        });
        const buf = el("div", { class: "fl-plc-buf" });
        const knob = el("div", { class: "fl-plc-knob" });
        const fill = el("div", { class: "fl-plc-fill" }, knob);
        const bar = el("div", { class: "fl-plc-bar" }, buf, fill);
        const prog = el("div", { class: "fl-plc-prog" }, bar);
        const seekTo = (cx, r) => { if (!video.duration || !r.width) return; video.currentTime = Math.max(0, Math.min(1, (cx - r.left) / r.width)) * video.duration; };
        prog.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); const r = bar.getBoundingClientRect(); seekTo(e.clientX, r); const mv = ev => seekTo(ev.clientX, r); const up = () => { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); }; document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up); });
        const tEl = el("span", { class: "fl-plc-time" }, "0:00");
        const syncTime = () => { const s = fmtT(video.currentTime) + (video.duration ? " / " + fmtT(video.duration) : ""); if (tEl.firstChild.data !== s) tEl.firstChild.data = s; };
        on(video, "timeupdate", () => { if (video.duration) fill.style.width = (video.currentTime / video.duration * 100) + "%"; syncTime(); });
        on(video, "loadedmetadata", syncTime);
        on(video, "progress", () => { try { if (video.buffered.length && video.duration) buf.style.width = (video.buffered.end(video.buffered.length - 1) / video.duration * 100) + "%"; } catch {} });
        const mute = mkAct(PL_ICONS.mute, "Mudo (m)", e => { e.stopPropagation(); video.muted = !video.muted; if (!video.muted && !video.volume) video.volume = 1; syncVol(); });
        const volfill = el("div", { class: "fl-plc-volfill" });
        const volbar = el("div", { class: "fl-plc-volbar", role: "slider", "aria-label": "Volume" }, volfill);
        const syncVol = () => { mute.innerHTML = (video.muted || !video.volume) ? PL_ICONS.mute : PL_ICONS.volume; volfill.style.width = ((video.muted ? 0 : video.volume) * 100) + "%"; };
        const setVolX = (cx, r) => { if (!r.width) return; const v = Math.max(0, Math.min(1, (cx - r.left) / r.width)); video.volume = v; video.muted = (v === 0); syncVol(); };
        volbar.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); const r = volbar.getBoundingClientRect(); setVolX(e.clientX, r); const mv = ev => setVolX(ev.clientX, r); const up = () => { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); }; document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up); });
        const volgrp = el("div", { class: "fl-plc-vol" }, mute, volbar);
        const goFs = () => { try { document.fullscreenElement ? document.exitFullscreen() : wrap.requestFullscreen(); } catch {} };
        const dlb = mkAct(PL_ICONS.download, "Baixar", e => { e.stopPropagation(); const dlBtn = document.getElementById("downloadButton") || document.querySelector('a[id*="download" i], .download-btn'); if (dlBtn) dlBtn.click(); else if (src) window.open(src, "_blank"); });
        const shareBtn = mkAct(PL_ICONS.share, "Compartilhar / Copiar link", e => {
            e.stopPropagation();
            copyText(location.href).then(ok => {
                toast(ok ? "Link copiado!" : "Falha ao copiar link");
                if (ok) { shareBtn.innerHTML = PL_ICONS.check; setTimeout(() => { shareBtn.innerHTML = PL_ICONS.share; }, 1600); }
            });
        });
        const reportBtn = mkAct(PL_ICONS.flag, "Reportar", e => {
            e.stopPropagation();
            const a = document.querySelector('a[href*="report"], a[href*="abuse"]');
            if (a && a.href) window.open(a.href, "_blank");
            else toast("Sem página de denúncia neste site");
        });
        let pipBtn = null;
        if (document.pictureInPictureEnabled) {
            pipBtn = mkAct(PL_ICONS.pip, "Picture-in-Picture", async e => {
                e.stopPropagation();
                try {
                    if (document.pictureInPictureElement) await document.exitPictureInPicture();
                    else if (video.requestPictureInPicture) await video.requestPictureInPicture();
                } catch {}
            });
        }
        const fsb = mkAct(PL_ICONS.expand, "Tela cheia (f)", e => { e.stopPropagation(); goFs(); });
        const barPlay = mkAct(PL_ICONS.play, "Play/Pause (espaço)", e => { e.stopPropagation(); toggle(); }); barPlay.classList.add("fl-plc-barplay");

        const apBtn = el("button", {
            type: "button",
            class: "fl-plc-act fl-plc-autoplay" + (prefs.autoplay ? " is-active" : ""),
            title: prefs.autoplay ? "Reprodução automática ativada" : "Reprodução automática desativada",
            "aria-label": "Reprodução automática"
        },
            el("span", { class: "fl-plc-ap-label" }, "Autoplay"),
            el("span", { class: "fl-plc-ap-pill" }, el("span", { class: "fl-plc-ap-knob" }))
        );
        apBtn.addEventListener("click", e => {
            e.stopPropagation();
            prefs.autoplay = !prefs.autoplay;
            saveP();
            apBtn.classList.toggle("is-active", !!prefs.autoplay);
            toast(prefs.autoplay ? "Autoplay ativado" : "Autoplay desativado");
        });

        // Loop toggle
        const loopBtn = mkAct(PL_ICONS.repeat, "Repetir (r)", e => {
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
        const navPrevBtn = mkAct(PL_ICONS.prev, "Anterior (Shift+P)", e => { e.stopPropagation(); navFile(-1); });
        const navNextBtn = mkAct(PL_ICONS.next, "Próximo (Shift+N)", e => { e.stopPropagation(); navFile(1); });

        const mkSkip = (ic, label, cb) => { const b = el("button", { type: "button", class: "fl-plc-act fl-plc-skip", title: label, "aria-label": label }); b.innerHTML = ic; b.appendChild(el("span", { class: "fl-plc-skipn" }, "5")); b.addEventListener("click", cb); return b; };
        const skipBack = mkSkip(PL_ICONS.skipBack, "Voltar 5s (←)", e => { e.stopPropagation(); seek(-5); });
        const skipFwd = mkSkip(PL_ICONS.skipFwd, "Avançar 5s (→)", e => { e.stopPropagation(); seek(5); });

        // Velocidade plana (sem pill pesado)
        const RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];
        const speedMenu = el("div", { class: "fl-plc-speedmenu" });
        const speedBtn = el("button", { type: "button", class: "fl-plc-act fl-plc-speed", title: "Velocidade", "aria-label": "Velocidade" }, "1x");
        const speedWrap = el("div", { class: "fl-plc-speedwrap" }, speedMenu, speedBtn);
        let speedCloser = null;
        const closeSpeed = () => { speedMenu.classList.remove("open"); if (speedCloser) { document.removeEventListener("pointerdown", speedCloser, true); speedCloser = null; } };
        const openSpeed = () => { speedMenu.classList.add("open"); speedCloser = ev => { if (!speedWrap.contains(ev.target)) closeSpeed(); }; document.addEventListener("pointerdown", speedCloser, true); };
        RATES.forEach(r => { const it = el("button", { type: "button", class: "fl-plc-speeditem" }, r + "x"); it.dataset.r = r; it.addEventListener("click", e => { e.stopPropagation(); try { video.playbackRate = r; } catch {} closeSpeed(); }); speedMenu.appendChild(it); });
        speedBtn.addEventListener("click", e => { e.stopPropagation(); speedMenu.classList.contains("open") ? closeSpeed() : openSpeed(); });
        const syncSpeed = () => { const r = video.playbackRate; speedBtn.textContent = r + "x"; speedMenu.querySelectorAll(".fl-plc-speeditem").forEach(it => it.classList.toggle("on", +it.dataset.r === r)); };
        on(video, "ratechange", () => { prefs.rate = video.playbackRate; saveP(); syncSpeed(); });
        on(video, "loadedmetadata", () => { try { video.playbackRate = prefs.rate || 1; } catch {} });

        const leftc = el("div", { class: "fl-plc-left" }, barPlay, loopBtn, navPrevBtn, navNextBtn, skipBack, skipFwd, volgrp, tEl);
        const rightc = el("div", { class: "fl-plc-right" }, apBtn, speedWrap, reportBtn, dlb, shareBtn);
        if (pipBtn) rightc.appendChild(pipBtn);
        rightc.appendChild(fsb);
        const row = el("div", { class: "fl-plc-row" }, leftc, rightc);
        const bottom = el("div", { class: "fl-plc-bottom" }, prog, row);

        on(video, "play", () => { wrap.classList.add("is-playing"); playBtn.innerHTML = PL_ICONS.pause; barPlay.innerHTML = PL_ICONS.pause; });
        on(video, "pause", () => { wrap.classList.remove("is-playing"); playBtn.innerHTML = PL_ICONS.play; barPlay.innerHTML = PL_ICONS.play; });
        on(video, "volumechange", syncVol);
        on(video, "seeking", () => wrap.classList.add("is-buffering"));
        ["seeked", "canplay", "playing", "loadeddata", "pause", "suspend", "error", "abort"].forEach(ev => on(video, ev, () => wrap.classList.remove("is-buffering")));

        const setRate = dir => { const i = RATES.indexOf(video.playbackRate); const ni = Math.max(0, Math.min(RATES.length - 1, (i < 0 ? 3 : i) + dir)); try { video.playbackRate = RATES[ni]; } catch {} };
        const onKey = e => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const t = e.target;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable || (t.closest && t.closest(".fl-sidebar-search")))) return;
            const k = e.key; let h = true;
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
        syncVol(); syncTime(); syncSpeed();
    }

    /* ===================== DISPARO E EXTRAÇÃO DA CDN FILESTER ===================== */
    function triggerNativeLoad() {
        try {
            if (typeof window.loadVideo === "function") {
                window.loadVideo();
                return;
            }
            const ov = document.querySelector("#videoPlayOverlay, [onclick*='loadVideo']");
            if (ov) ov.click();
        } catch (e) {}
    }

    function getFilesterVideoSrc() {
        const v = document.querySelector("#videoContainer video, #videoPlayer, .plyr video, video");
        if (v) {
            const s = v.getAttribute("src") || v.src || "";
            if (s && /^https?:\/\//i.test(s) && !s.endsWith("#") && (/token=/i.test(s) || /\.mp4/i.test(s) || /cdn/i.test(s))) {
                return s;
            }
            const source = v.querySelector("source[src]");
            if (source) {
                const ss = source.getAttribute("src") || source.src || "";
                if (ss && /^https?:\/\//i.test(ss) && !ss.endsWith("#") && (/token=/i.test(ss) || /\.mp4/i.test(ss) || /cdn/i.test(ss))) return ss;
            }
        }
        return null;
    }

    let playerMounted = false;
    function mountOwnPlayer(mid, src) {
        if (playerMounted || !src) return;
        playerMounted = true; mediaMounted = true;
        document.querySelectorAll("#videoContainer video, .plyr video, video").forEach(v => {
            try { v.pause(); v.muted = true; } catch {}
        });

        const ac = new AbortController();
        const video = el("video", { class: "fl-video", playsinline: "", preload: "metadata" });
        video.volume = prefs.volume ?? 1;
        video.muted = prefs.muted ?? false;
        video.addEventListener("volumechange", () => {
            prefs.volume = video.volume; prefs.muted = video.muted; saveP();
        }, { signal: ac.signal });

        const host = el("div", { class: "fl-host fl-pl" }, video);
        buildPlayerControls(host, video, src, ac);
        mid.appendChild(host);

        video.addEventListener("loadedmetadata", () => {
            if (!Number.isFinite(video.duration)) return;
            const text = fmtT(video.duration);
            try { sessionStorage.setItem("fldur:" + location.origin + location.pathname, text); sessionStorage.setItem("fldur:" + location.pathname, text); } catch {}
            const badge = document.querySelector(".fl-playlist-item.is-current .fl-playlist-dur");
            if (badge) { badge.textContent = text; badge.hidden = false; }
        }, { signal: ac.signal });
        video.src = src;
        try { video.load(); } catch (e) {}
        document.querySelectorAll("#videoPlayOverlay, .video-play-overlay").forEach(ov => ov.style.display = "none");
    }

    function findPageImage() {
        const imgs = Array.from(document.querySelectorAll("img")).filter(img => {
            if (img.closest("header, .fl-sidebar, .related-files-grid, .files-list")) return false;
            if (img.classList.contains("fl-playlist-thumb")) return false;
            const src = img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("src") || img.src || "";
            if (!src || /logo|icon|avatar|favicon/i.test(src)) return false;
            return true;
        });
        const fullRes = imgs.find(img => {
            const src = img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("src") || img.src || "";
            return !/\/thumbs\//i.test(src);
        });
        return fullRes || imgs[0] || null;
    }

    function appendImageChrome(host) {
        const mkAct = (ic, label, cb) => {
            const b = el("button", { type: "button", class: "fl-plc-act", title: label, "aria-label": label });
            b.innerHTML = ic;
            b.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); cb(); });
            return b;
        };
        const prevBtn = mkAct(PL_ICONS.prev, "Anterior", () => navFile(-1));
        const nextBtn = mkAct(PL_ICONS.next, "Próximo", () => navFile(1));
        const reportBtn = mkAct(PL_ICONS.flag, "Reportar", () => {
            const a = document.querySelector('a[href*="report"], a[href*="abuse"]');
            if (a && a.href) window.open(a.href, "_blank", "noopener");
            else toast("Sem página de denúncia neste site");
        });
        const dlb = mkAct(PL_ICONS.download, "Baixar", () => {
            const dlBtn = document.getElementById("downloadButton") || document.querySelector('a[id*="download" i], .download-btn');
            const img = host.querySelector(".fl-image");
            if (dlBtn) dlBtn.click();
            else if (img && (img.currentSrc || img.src)) window.open(img.currentSrc || img.src, "_blank", "noopener");
        });
        const shareBtn = mkAct(PL_ICONS.share, "Compartilhar / Copiar link", () => {
            copyText(location.href).then(ok => {
                toast(ok ? "Link copiado!" : "Falha ao copiar link");
                if (ok) { shareBtn.innerHTML = PL_ICONS.check; setTimeout(() => { shareBtn.innerHTML = PL_ICONS.share; }, 1600); }
            });
        });
        const fsb = mkAct(PL_ICONS.expand, "Tela cheia (f)", () => {
            try {
                if (document.fullscreenElement) document.exitFullscreen();
                else host.requestFullscreen();
            } catch { /* fullscreen blocked */ }
        });
        const row = el("div", { class: "fl-plc-row" },
            el("div", { class: "fl-plc-left" }, prevBtn, nextBtn),
            el("div", { class: "fl-plc-right" }, reportBtn, dlb, shareBtn, fsb)
        );
        host.append(el("div", { class: "fl-plc-bottom" }, row));
    }

    let zoomMounted = false;
    function mountPhotoZoom(mid) {
        if (zoomMounted) return;
        const img = findPageImage();
        if (!img) return;
        const realSrc = img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("src") || img.src || "";
        if (!realSrc) return;
        zoomMounted = true; mediaMounted = true;
        const host = el("div", { class: "fl-img-host" });
        mid.appendChild(host);
        const newImg = el("img", {
            class: "fl-image",
            src: realSrc,
            alt: "",
            style: "opacity: 1 !important; filter: none !important; position: static !important; display: block !important;"
        });
        host.appendChild(newImg);
        appendImageChrome(host);
        const ZOOMS = [1, 2, 4]; let zi = 0, z = 1, tx = 0, ty = 0;
        const clampPan = () => {
            const stageW = mid.clientWidth || window.innerWidth;
            const stageH = mid.clientHeight || (window.innerHeight - 190);
            const imgW = newImg.clientWidth * z;
            const imgH = newImg.clientHeight * z;
            const mx = Math.max(0, (imgW - stageW) / 2);
            const my = Math.max(0, (imgH - stageH) / 2);
            tx = Math.max(-mx, Math.min(mx, tx));
            ty = Math.max(-my, Math.min(my, ty));
        };
        const applyTf = () => {
            newImg.style.transform = z === 1 ? "" : `translate(${tx}px,${ty}px) scale(${z})`;
            mid.classList.toggle("is-zoomed", z !== 1);
            host.classList.toggle("is-zoomed", z !== 1);
        };
        const setZoomIdx = i => { zi = ((i % ZOOMS.length) + ZOOMS.length) % ZOOMS.length; z = ZOOMS[zi]; if (z === 1) { tx = ty = 0; } else clampPan(); applyTf(); };
        let drag = null;
        newImg.addEventListener("pointerdown", e => { if (e.button) return; e.preventDefault(); drag = { x: e.clientX, y: e.clientY, tx, ty, moved: false }; try { newImg.setPointerCapture(e.pointerId); } catch (er) {} });
        newImg.addEventListener("pointermove", e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true; if (z !== 1 && drag.moved) { tx = drag.tx + dx; ty = drag.ty + dy; clampPan(); applyTf(); } });
        const end = e => { if (!drag) return; const click = !drag.moved; drag = null; try { newImg.releasePointerCapture(e.pointerId); } catch (er) {} if (click) setZoomIdx(zi + 1); };
        newImg.addEventListener("pointerup", end); newImg.addEventListener("pointercancel", end);
    }

    /* ===================== SIDEBAR PLAYLIST (Estilo YouTube AMOLED) ===================== */
    let stSidebarEl = null;
    let isSidebarCollapsed = !!prefs.sidebarCollapsed;

    function toggleSidebar(forceState) {
        const stage = document.querySelector(".fl-stage");
        if (!stage) return;
        isSidebarCollapsed = typeof forceState === "boolean" ? forceState : !isSidebarCollapsed;
        prefs.sidebarCollapsed = isSidebarCollapsed;
        saveP();
        stage.classList.toggle("is-sidebar-collapsed", isSidebarCollapsed);
        const btn = stage.querySelector(".fl-vrow-playlist");
        if (btn) btn.classList.toggle("is-active", !isSidebarCollapsed);
    }

    function makeThumbPlaceholder(kind, ext) {
        const ph = el("div", { class: "fl-playlist-placeholder" });
        const iconSpan = el("span", { class: "fl-playlist-ph-icon" });
        iconSpan.innerHTML = kindSvg(kind);
        const badge = el("span", { class: "fl-playlist-ph-ext" }, (ext || kind || "FILE").toUpperCase().slice(0, 5));
        ph.append(iconSpan, badge);
        return ph;
    }

    function parseSidebarItems() {
        const stage = document.querySelector(".fl-stage");
        const cur = stage && stage._cur;
        const grid = document.querySelector(".related-files-grid");
        const related = grid ? Array.from(grid.querySelectorAll(":scope > .related-file-item, :scope > a.related-file-item")) : [];

        const items = [];
        if (cur) {
            items.push({
                name: cur.name,
                href: cur.href,
                thumb: cur.thumb,
                isCurrent: true,
                kind: cur.isVid ? "video" : "image"
            });
        }
        related.forEach(it => {
            const href = it.getAttribute("href") || "#";
            const img = it.querySelector("img");
            const nameEl = it.querySelector(".related-file-name");
            const name = (nameEl ? nameEl.textContent : (img ? img.getAttribute("alt") : "") || "").trim();
            if (cur && cur.href && (href === cur.href || href === location.pathname)) return;
            const kind = getMediaKind(name);
            items.push({
                name,
                href,
                thumb: (img && (img.getAttribute("src") || img.src)) || "",
                isCurrent: false,
                kind
            });
        });
        return items;
    }

    function renderPlaylist() {
        if (!stSidebarEl) return;
        const listEl = stSidebarEl.querySelector(".fl-playlist-list");
        if (!listEl) return;
        listEl.textContent = "";

        const allItems = parseSidebarItems();
        applyListPosition(allItems);
        const q = (stSidebarEl.querySelector(".fl-sidebar-search-in")?.value || "").trim().toLowerCase();
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

        const countEl = stSidebarEl.querySelector(".fl-sidebar-count");
        if (countEl) countEl.textContent = `${filtered.length} arquivos`;

        stSidebarEl.querySelectorAll(".fl-tab-chip").forEach(tab => {
            const t = tab.dataset.tab;
            let n = allItems.length;
            if (t === "video") n = allItems.filter(i => i.kind === "video").length;
            else if (t === "image") n = allItems.filter(i => i.kind === "image").length;
            else if (t === "text") n = allItems.filter(i => i.kind === "text").length;
            const c = tab.querySelector(".fl-tab-count");
            if (c) c.textContent = n;
            tab.style.display = (t !== "all" && n === 0) ? "none" : "";
        });

        if (!filtered.length) {
            listEl.innerHTML = `<div class="fl-playlist-empty">Nenhum item encontrado.</div>`;
            return;
        }

        filtered.forEach((item, idx) => {
            const dt = extractDateFromTitle(item.name);
            const cleanTitle = cleanTitleWithoutDate(item.name, dt);

            const card = el("a", {
                class: "fl-playlist-item" + (item.isCurrent ? " is-current" : ""),
                href: hrefWithPosition(item.href, idx + 1),
                title: item.name
            });

            const thumbWrap = el("div", { class: "fl-playlist-thumb-wrap" });
            const extMatch = (item.name || "").match(/\.([a-z0-9]{1,5})$/i);
            const ext = extMatch ? extMatch[1] : item.kind;

            if (item.thumb) {
                const img = el("img", { class: "fl-playlist-thumb", src: item.thumb, alt: "", loading: "lazy" });
                img.onerror = () => {
                    img.remove();
                    if (!thumbWrap.querySelector(".fl-playlist-placeholder")) {
                        thumbWrap.prepend(makeThumbPlaceholder(item.kind, ext));
                    }
                };
                thumbWrap.appendChild(img);
            } else {
                thumbWrap.appendChild(makeThumbPlaceholder(item.kind, ext));
            }

            const kindLabel = item.kind === "video" ? "Video" : item.kind === "image" ? "Imagem" : "Arquivo";
            thumbWrap.appendChild(el("span", { class: "fl-playlist-kind" }, kindLabel));
            thumbWrap.appendChild(el("span", { class: "fl-playlist-num" }, String(idx + 1)));
            if (item.kind === "video") {
                let known = "";
                try { known = sessionStorage.getItem("fldur:" + (item.href || "").split("?")[0]) || ""; } catch {}
                const durEl = el("span", { class: "fl-playlist-dur" }, known);
                durEl.hidden = !known;
                thumbWrap.appendChild(durEl);
            }

            const info = el("div", { class: "fl-playlist-info" });
            info.append(el("span", { class: "fl-playlist-name" }, cleanTitle));

            // Metadados de data
            const datesWrap = el("div", { class: "fl-playlist-dates" });
            if (dt && dt.displayDate) {
                const tipEl = el("span", {
                    class: "fl-has-tip",
                    title: "Data identificada e extraída do nome do arquivo (definida no upload)"
                }, el("span", { class: "fl-tip-icon" }, "ⓘ"));
                datesWrap.appendChild(el("div", { class: "fl-playlist-date-row" },
                    el("span", { class: "fl-playlist-date-lbl" }, "Data extraída:"),
                    el("span", { class: "fl-playlist-date-val" }, dt.displayDate),
                    tipEl
                ));
            }
            if (datesWrap.childNodes.length) info.appendChild(datesWrap);

            if (item.isCurrent) {
                const meta = el("div", { class: "fl-playlist-meta" });
                meta.append(el("span", { class: "fl-playlist-meta-active" }, item.kind === "video" ? "Reproduzindo agora" : "Visualizando agora"));
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

        const sb = el("div", { class: "fl-sidebar" });

        const header = el("div", { class: "fl-sidebar-header" });
        header.innerHTML = `
            <div class="fl-sidebar-title-wrap">
                <span class="fl-sidebar-icon">${PL_ICONS.playlist}</span>
                <span class="fl-sidebar-title">Playlist</span>
                <span class="fl-sidebar-count">0 arquivos</span>
            </div>
        `;
        const collapseBtn = el("button", {
            type: "button",
            class: "fl-sidebar-collapse-btn",
            title: "Recolher playlist (p)",
            onClick: () => toggleSidebar()
        });
        collapseBtn.innerHTML = PL_ICONS.close;
        const galleryA = document.querySelector('a[href*="/f/"]');
        const actions = el("div", { class: "fl-sidebar-actions" });
        if (galleryA) {
            const gal = el("a", { class: "fl-sidebar-gallery", href: galleryA.href, title: "Abrir a galeria da pasta" });
            gal.insertAdjacentHTML("beforeend", PL_ICONS.grid);
            gal.append(el("span", null, "Galeria"));
            actions.append(gal);
        }
        actions.append(collapseBtn);
        header.appendChild(actions);

        const searchWrap = el("div", { class: "fl-sidebar-search" });
        searchWrap.innerHTML = `<span class="fl-sidebar-search-icon">${PL_ICONS.search}</span>`;
        const searchIn = el("input", {
            type: "search",
            class: "fl-sidebar-search-in",
            placeholder: "Buscar na playlist...",
            value: ""
        });
        searchIn.addEventListener("input", debounce(() => renderPlaylist(), 140));
        searchIn.addEventListener("keydown", e => e.stopPropagation());
        searchWrap.appendChild(searchIn);

        const tabsWrap = el("div", { class: "fl-sidebar-tabs" });
        const makeTab = (key, label) => {
            const b = el("button", {
                type: "button",
                class: "fl-tab-chip" + (prefs.sidebarTab === key ? " is-active" : "")
            });
            b.dataset.tab = key;
            b.innerHTML = `<span>${label}</span> <span class="fl-tab-count">0</span>`;
            b.addEventListener("click", () => {
                prefs.sidebarTab = key; saveP();
                tabsWrap.querySelectorAll(".fl-tab-chip").forEach(t => t.classList.remove("is-active"));
                b.classList.add("is-active");
                renderPlaylist();
            });
            return b;
        };
        tabsWrap.append(
            makeTab("all", "Todos"),
            makeTab("video", "Vídeos"),
            makeTab("image", "Fotos")
        );

        const sortWrap = el("div", { class: "fl-sidebar-sort" });
        const makeSort = (key, label) => {
            const b = el("button", {
                type: "button",
                class: "fl-sort-chip" + (prefs.sidebarSort === key ? " is-active" : "")
            });
            b.dataset.sort = key;
            b.textContent = label;
            b.addEventListener("click", () => {
                prefs.sidebarSort = key; saveP();
                sortWrap.querySelectorAll(".fl-sort-chip").forEach(s => s.classList.remove("is-active"));
                b.classList.add("is-active");
                renderPlaylist();
            });
            return b;
        };
        sortWrap.append(
            el("span", { class: "fl-sort-label" }, "Ordem:"),
            makeSort("default", "Padrão"),
            makeSort("az", "A-Z")
        );

        const listEl = el("div", { class: "fl-playlist-list" });

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
    function navFile(dir) {
        const items = parseSidebarItems();
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

    function findMediaKind() {
        const v = document.querySelector("#videoContainer, .media-container, .video-container, video, #videoPlayer, #videoPlayOverlay");
        if (v) return "video";
        const i = document.querySelector(".image-container, .image-preview");
        if (i) return "image";
        const h1 = document.querySelector("main h1") || Array.from(document.querySelectorAll("h1")).find(h => !h.closest("header"));
        if (h1 && isVidName(h1.textContent)) return "video";
        return "image";
    }

    /* ===================== STAGE BUILDER ===================== */
    let mediaMounted = false;
    function buildStage() {
        if (document.querySelector(".fl-stage")) return document.querySelector(".fl-stage");
        const h1 = document.querySelector("main h1") || Array.from(document.querySelectorAll("h1")).find(h => !h.closest("header"));
        if (!h1) return null;

        const name = (h1.textContent || "").trim();
        const sizeEl = document.querySelector("main .text-neutral-400") || (h1.parentElement && h1.parentElement.querySelector(".text-neutral-400"));
        const size = sizeEl ? (sizeEl.textContent || "").replace(/\s+/g, " ").trim() : "";
        const reportA = document.querySelector('a[href*="/report"], a[href*="report?file"]');
        const dlBtn = document.getElementById("downloadButton") || document.querySelector('a[id*="download" i], .download-btn');
        const isVid = findMediaKind() === "video";

        const stage = el("div", { class: "fl-stage " + (isVid ? "is-video" : "is-image") + (isSidebarCollapsed ? " is-sidebar-collapsed" : "") });
        const main = el("div", { class: "fl-stage-main" });

        // ---- vrow (topbar) ----
        const vrow = el("div", { class: "fl-vrow" });
        const vtop = el("div", { class: "fl-vrow-top" });
        const mark = el("span", { class: "fl-logo-img" });
        mark.innerHTML = LOGO_SVG;
        const logo = el("a", { class: "fl-top-logo", href: "/", title: "Filester" },
            mark,
            el("span", null, "Filester")
        );
        const nameEl = el("div", { class: "fl-name", title: name });
        nameEl.insertAdjacentHTML("beforeend", isVid ? PL_ICONS.video : PL_ICONS.image);
        nameEl.append(el("span", null, name));
        vtop.append(logo, nameEl);

        const vsub = el("div", { class: "fl-vrow-sub" });
        const stats = el("div", { class: "fl-stats" });
        if (size) stats.append(el("span", { class: "fl-stat" }, size));
        stats.append(el("span", { class: "fl-stat" }, isVid ? "Vídeo" : "Imagem"));
        vsub.append(stats, el("div", { class: "fl-spacer" }));

        // Botão Playlist (visível apenas quando a sidebar estiver fechada)
        const plBtn = el("button", {
            type: "button",
            class: "fl-item fl-vrow-playlist" + (!isSidebarCollapsed ? " is-active" : ""),
            title: "Abrir / fechar playlist (p)",
            onClick: () => toggleSidebar()
        });
        plBtn.insertAdjacentHTML("beforeend", PL_ICONS.playlist);
        plBtn.append(el("span", null, "Playlist"));
        vsub.append(plBtn);

        vrow.append(vtop, vsub);

        // ---- mid (mídia) ----
        const mid = el("div", { class: "fl-stage-mid" });
        const navPrev = el("button", { class: "fl-nav-side fl-nav-prev", title: "Anterior", onClick: e => { e.stopPropagation(); navFile(-1); } });
        navPrev.insertAdjacentHTML("beforeend", PL_ICONS.chevL);
        const navNext = el("button", { class: "fl-nav-side fl-nav-next", title: "Próximo", onClick: e => { e.stopPropagation(); navFile(1); } });
        navNext.insertAdjacentHTML("beforeend", PL_ICONS.chevR);
        mid.append(navPrev, navNext);

        main.append(vrow, mid);
        stage.appendChild(main);

        let uuid = "";
        if (reportA) { const m = reportA.href.match(/file=([a-f0-9-]{8,})/i); if (m) uuid = m[1]; }
        if (!uuid) { const u = Array.from(document.querySelectorAll("main .font-mono")).map(e => (e.textContent || "").trim()).find(t => /^[a-f0-9-]{32,}$/i.test(t)); if (u) uuid = u; }
        stage._cur = { name, href: location.pathname + location.search, thumb: uuid ? (location.origin + "/t/" + uuid) : "", isVid };

        document.body.insertBefore(stage, document.body.firstChild);
        document.documentElement.classList.add("fl-has-stage");

        // Monta Sidebar da Playlist
        setupSidebar(stage);

        const grid = document.querySelector(".related-files-grid");
        if (grid) { try { new MutationObserver(() => renderPlaylist()).observe(grid, { childList: true }); } catch (e) {} }
        return stage;
    }

    /* ===================== GALERIA (/f/): AGRUPAMENTO POR TIPO ===================== */
    let isGalleryGrouped = !!prefs.groupByType;

    function setupGalleryGrouping() {
        const list = document.querySelector(".files-list.grid-view");
        if (!list || list.dataset.tbGroupDone) return;
        list.dataset.tbGroupDone = "1";

        const filterBar = document.querySelector(".filters-bar");
        if (filterBar && !filterBar.querySelector(".fl-group-toggle-btn")) {
            const btn = el("button", {
                type: "button",
                class: "fl-group-toggle-btn" + (isGalleryGrouped ? " is-active" : ""),
                onClick: () => {
                    isGalleryGrouped = !isGalleryGrouped;
                    prefs.groupByType = isGalleryGrouped;
                    saveP();
                    btn.classList.toggle("is-active", isGalleryGrouped);
                    renderGalGroups();
                }
            });
            btn.innerHTML = `${PL_ICONS.playlist} <span>Agrupar por Tipo</span>`;
            filterBar.appendChild(btn);
        }

        function renderGalGroups() {
            const items = Array.from(list.querySelectorAll(".file-item"));
            if (!items.length) return;

            list.querySelectorAll(".fl-album-group-header").forEach(h => h.remove());

            if (!isGalleryGrouped) {
                items.sort((a, b) => (+a.dataset.flOrigIdx || 0) - (+b.dataset.flOrigIdx || 0));
                items.forEach(it => list.appendChild(it));
                return;
            }

            items.forEach((it, idx) => {
                if (!it.dataset.flOrigIdx) it.dataset.flOrigIdx = String(idx);
            });

            const groups = { video: [], image: [], text: [], other: [] };
            items.forEach(it => {
                const nameEl = it.querySelector(".file-name");
                const name = (nameEl ? nameEl.textContent : "").trim();
                const k = getMediaKind(name);
                if (groups[k]) groups[k].push(it);
                else groups.other.push(it);
            });

            const defs = [
                { key: "video", title: "Vídeos", icon: PL_ICONS.video, list: groups.video },
                { key: "image", title: "Fotos", icon: PL_ICONS.image, list: groups.image },
                { key: "text", title: "Textos & Documentos", icon: PL_ICONS.fileText, list: groups.text },
                { key: "other", title: "Outros", icon: PL_ICONS.grid, list: groups.other }
            ];

            defs.forEach(def => {
                if (!def.list.length) return;
                const hdr = el("div", { class: "fl-album-group-header" },
                    el("div", { class: "fl-album-group-title" },
                        el("span", { html: def.icon }),
                        el("span", null, def.title)
                    ),
                    el("span", { class: "fl-album-group-count" }, `${def.list.length} ${def.list.length === 1 ? "item" : "itens"}`)
                );
                list.appendChild(hdr);
                def.list.forEach(it => {
                    const nameEl = it.querySelector(".file-name");
                    if (nameEl && !it.dataset.flTitled) {
                        it.dataset.flTitled = "1";
                        const rawName = nameEl.textContent.trim();
                        const dt = extractDateFromTitle(rawName);
                        const cleanName = cleanTitleWithoutDate(rawName, dt);
                        nameEl.textContent = cleanName;
                        nameEl.title = rawName;

                        if (dt && dt.displayDate && !it.querySelector(".fl-card-dates")) {
                            const tipEl = el("span", {
                                class: "fl-has-tip",
                                title: "Data identificada e extraída do nome do arquivo (definida no upload)"
                            }, el("span", { class: "fl-tip-icon" }, "ⓘ"));
                            const datesWrap = el("div", { class: "fl-card-dates" },
                                el("div", { class: "fl-card-date-row" },
                                    el("span", { class: "fl-card-date-lbl" }, "Data extraída:"),
                                    el("span", { class: "fl-card-date-val" }, dt.displayDate),
                                    tipEl
                                )
                            );
                            const infoCont = it.querySelector(".file-info") || nameEl.parentElement;
                            if (infoCont) infoCont.appendChild(datesWrap);
                        }
                    }
                    list.appendChild(it);
                });
            });
        }

        // Decora os itens inicialmente mesmo sem agrupar
        const initItems = Array.from(list.querySelectorAll(".file-item"));
        initItems.forEach(it => {
            const nameEl = it.querySelector(".file-name");
            if (nameEl && !it.dataset.flTitled) {
                it.dataset.flTitled = "1";
                const rawName = nameEl.textContent.trim();
                const dt = extractDateFromTitle(rawName);
                const cleanName = cleanTitleWithoutDate(rawName, dt);
                nameEl.textContent = cleanName;
                nameEl.title = rawName;

                if (dt && dt.displayDate && !it.querySelector(".fl-card-dates")) {
                    const tipEl = el("span", {
                        class: "fl-has-tip",
                        title: "Data identificada e extraída do nome do arquivo (definida no upload)"
                    }, el("span", { class: "fl-tip-icon" }, "ⓘ"));
                    const datesWrap = el("div", { class: "fl-card-dates" },
                        el("div", { class: "fl-card-date-row" },
                            el("span", { class: "fl-card-date-lbl" }, "Data extraída:"),
                            el("span", { class: "fl-card-date-val" }, dt.displayDate),
                            tipEl
                        )
                    );
                    const infoCont = it.querySelector(".file-info") || nameEl.parentElement;
                    if (infoCont) infoCont.appendChild(datesWrap);
                }
            }
        });

        if (isGalleryGrouped) setTimeout(renderGalGroups, 150);
    }

    /* ===================== BOOT ===================== */
    function onReady(fn) {
        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
        else fn();
    }
    onReady(() => {
        if (isAlbum) {
            setupGalleryGrouping();
            return;
        }
        if (!isFile) return;
        let n = 0, id = null;
        const stop = () => { if (id) clearInterval(id); };
        const tick = () => {
            const stage = buildStage();
            const mid = stage && stage.querySelector(".fl-stage-mid");
            if (stage && mid) {
                if (stage.classList.contains("is-video")) {
                    triggerNativeLoad();
                    const src = getFilesterVideoSrc();
                    if (src) {
                        mountOwnPlayer(mid, src);
                    }
                } else {
                    mountPhotoZoom(mid);
                }
            }
            if (mediaMounted) { stop(); return; }
            if (++n > 25) {
                stop();
                if (!mediaMounted) {
                    document.documentElement.classList.add("fl-fallback");
                    const st = document.querySelector(".fl-stage");
                    if (st) st.remove();
                    document.documentElement.classList.remove("fl-has-stage");
                }
            }
        };
        tick();
        id = setInterval(tick, 200);
    });
})();
