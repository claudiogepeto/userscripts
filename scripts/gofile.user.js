// ==UserScript==
// @name         GoFile — Card Grid, Search, Custom Player & Theater Stage
// @namespace    gofile-grid
// @version      3.5.1
// @description  Card grid, search, custom player, YouTube-style theater stage with sidebar playlist, media grouping (Videos & Photos), instant photo zoom, and AMOLED styling for GoFile.
// @author       claudiogepeto
// @run-at       document-start
// @match        *://gofile.io/*
// @match        *://*.gofile.io/*
// @match        *://gofile.to/*
// @match        *://*.gofile.to/*
// @noframes
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    "use strict";
    if (window.top !== window.self) return;

    document.documentElement.classList.add("gf");
    const ACCENT = "#f5c400";

    const CSS = `
        /* ===================== TEMA AMOLED ===================== */
        html.gf, html.gf body, html.gf #app, html.gf .bg-surface-base { background: #0b0c0f !important; color: #e9e9ee !important; }
        html.gf .bg-surface-raised, html.gf .panel, html.gf .bg-gray-800 { background: #12141a !important; border-color: rgba(255,255,255,0.08) !important; }
        html.gf ::selection { background: rgba(245,196,0,0.35); }
        html.gf ::-webkit-scrollbar { width: 10px; height: 10px; }
        html.gf ::-webkit-scrollbar-thumb { background: #2a2c33; border-radius: 8px; border: 2px solid #0b0c0f; }

        /* ===================== SEM SIDEBAR + SEM ADS + LARGURA TOTAL ===================== */
        html.gf #sidebar, html.gf #sidebar-overlay, html.gf #index_sidebar, html.gf #index_sidebarOverlay { display: none !important; }
        html.gf #ad-slot, html.gf #index_ads, html.gf iframe[data-aa] { display: none !important; }
        html.gf #app, html.gf #page, html.gf #fm-root, html.gf #index_app, html.gf #index_content, html.gf #index_main { max-width: none !important; width: 100% !important; padding-left: clamp(12px, 2.5vw, 32px) !important; padding-right: clamp(12px, 2.5vw, 32px) !important; box-sizing: border-box !important; }
        html.gf .max-w-6xl { max-width: none !important; }

        /* ===================== SUPRESSÃO DE MODAIS NATIVOS QUANDO O STAGE ESTIVER ABERTO ===================== */
        html.gf.gf-has-stage [role="dialog"]:not(.gf-stage),
        html.gf.gf-has-stage dialog[open]:not(.gf-stage),
        html.gf.gf-has-stage [data-dialog]:not(.gf-stage),
        html.gf.gf-has-stage .media-viewer:not(.gf-stage),
        html.gf.gf-has-stage #modal-root > div:not(.gf-stage) {
            position: fixed !important;
            left: -9999px !important;
            top: -9999px !important;
            width: 1px !important;
            height: 1px !important;
            opacity: 0 !important;
            pointer-events: none !important;
            z-index: -1 !important;
        }

        /* ===================== TOPBAR MODERNA ===================== */
        html.gf #app-header, html.gf #index_header { position: sticky; top: 0; z-index: 50; display: flex !important; align-items: center; justify-content: space-between; gap: 16px; background: #0e0f13 !important; border: 0 !important; border-bottom: 1px solid rgba(255,255,255,0.08) !important; border-radius: 0 !important; padding: 10px 20px !important; }
        html.gf #sidebar-toggle, html.gf #index_toggleSidebar { display: none !important; }
        html.gf .gf-brand { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 18px; color: #fff; text-decoration: none; flex: 0 0 auto; }
        html.gf .gf-brand img { height: 26px; width: auto; }
        html.gf .gf-topsearch { flex: 1 1 480px; max-width: 480px; margin: 0 auto; }
        html.gf .gf-topsearch input { width: 100%; height: 38px; box-sizing: border-box; padding: 0 16px 0 40px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a3a3ad' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m21 21-4.3-4.3'/%3E%3C/svg%3E") no-repeat 14px center; background-size: 16px; color: #fff; font-size: 14px; outline: none; transition: border-color .15s, background-color .15s; }
        html.gf .gf-topsearch input:focus { border-color: ${ACCENT}; background-color: rgba(255,255,255,0.1); }

        /* Botão de Agrupar por Tipo junto da barra de ações/filtros da pasta */
        .gf-folder-btn { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: #fff; font: 600 12px/1 Inter, sans-serif; cursor: pointer; transition: all .12s; margin-left: 8px; }
        .gf-folder-btn:hover { background: rgba(245,196,0,0.15); border-color: ${ACCENT}88; }
        .gf-folder-btn.is-active { background: rgba(245,196,0,0.22); border-color: ${ACCENT}; color: #f5c400; }
        .gf-folder-btn svg { width: 14px; height: 14px; color: ${ACCENT}; }

        /* ===================== GRADE DE CARDS AMOLED (Estilo YouTube/Bunkr) ===================== */
        html.gf #fm-list > div,
        html.gf #fm-list [role="list"],
        html.gf #filemanager_itemslist,
        html.gf [role="list"][aria-label*="Folder" i] {
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)) !important;
            gap: 32px 24px !important;
            padding: 16px 0 !important;
            background: transparent !important;
            border: 0 !important;
            box-shadow: none !important;
            align-items: start !important;
        }
        html.gf #fm-list > div.divide-y > *,
        html.gf [role="list"][aria-label*="Folder" i].divide-y > * {
            border: 0 !important;
        }
        @media (min-width: 1600px) {
            html.gf #fm-list > div,
            html.gf #fm-list [role="list"],
            html.gf #filemanager_itemslist,
            html.gf [role="list"][aria-label*="Folder" i] {
                grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)) !important;
                gap: 36px 28px !important;
            }
        }
        @media (max-width: 768px) {
            html.gf #fm-list > div,
            html.gf #fm-list [role="list"],
            html.gf #filemanager_itemslist,
            html.gf [role="list"][aria-label*="Folder" i] {
                grid-template-columns: 1fr !important;
                gap: 20px 16px !important;
            }
        }

        html.gf .gf-card { position: relative !important; display: flex !important; flex-direction: column !important; border: 1px solid rgba(255,255,255,0.08) !important; border-radius: 14px !important; background: #12141a !important; overflow: hidden !important; transition: transform .12s ease, border-color .12s ease, box-shadow .12s ease; cursor: pointer; }
        html.gf .gf-card.gf-filtered { display: none !important; }
        html.gf .gf-card:hover { transform: translateY(-3px); border-color: ${ACCENT}88 !important; box-shadow: 0 10px 26px rgba(0,0,0,0.5) !important; }

        /* Oculta nós nativos internos preservando-os acessíveis para eventos */
        html.gf .gf-card > *:not(.gf-media):not(.gf-card-select):not(.gf-card-body) {
            position: absolute !important;
            opacity: 0 !important;
            left: -9999px !important;
            top: -9999px !important;
            width: 1px !important;
            height: 1px !important;
            overflow: hidden !important;
            pointer-events: auto !important;
        }

        html.gf .gf-media { position: relative; width: 100%; aspect-ratio: 16 / 9; background: #07080a; display: flex; align-items: center; justify-content: center; overflow: hidden; cursor: pointer; }
        html.gf .gf-media img { width: 100% !important; height: 100% !important; max-height: none !important; object-fit: cover !important; display: block; border-radius: 0 !important; }
        html.gf .gf-media-ic svg { width: 36px; height: 36px; color: ${ACCENT}; opacity: .75; }
        html.gf .gf-card-size-badge { position: absolute; bottom: 6px; right: 6px; background: rgba(0,0,0,0.75); color: #fff; font: 600 11px Inter, sans-serif; padding: 2px 6px; border-radius: 4px; pointer-events: none; z-index: 2; }
        html.gf .gf-media-play { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; background: rgba(0,0,0,0.3); transition: opacity .12s ease; }
        html.gf .gf-card:hover .gf-media-play { opacity: 1; }
        html.gf .gf-media-play span { width: 46px; height: 46px; border-radius: 50%; background: rgba(0,0,0,.65); display: flex; align-items: center; justify-content: center; color: #fff; }
        html.gf .gf-media-play svg { width: 22px; height: 22px; margin-left: 2px; }

        html.gf .gf-card-body { padding: 10px 12px 12px !important; display: flex !important; flex-direction: column !important; gap: 4px; }
        html.gf .gf-card-name { font-size: 13.5px !important; font-weight: 600 !important; color: #e9e9ee !important; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; }
        html.gf .gf-card:hover .gf-card-name { color: ${ACCENT} !important; }
        html.gf .gf-card-dates { display: flex; flex-direction: column; gap: 2px; margin-top: 2px; font-size: 11.5px; color: rgba(255,255,255,0.7); }
        html.gf .gf-card-date-row { display: flex; align-items: center; gap: 4px; }
        html.gf .gf-card-date-lbl { color: rgba(255,255,255,0.45); }
        html.gf .gf-tip-icon { font-size: 11px; color: ${ACCENT}; cursor: help; margin-left: 2px; opacity: 0.85; }

        html.gf .gf-card-select { position: absolute !important; top: 8px; left: 8px; z-index: 3; width: 22px; height: 22px; border-radius: 6px; border: 2px solid rgba(255,255,255,0.4); background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .12s, border-color .12s; }
        html.gf .gf-card-select.is-selected { background: ${ACCENT}; border-color: ${ACCENT}; }
        html.gf .gf-card-select.is-selected svg { display: block; }
        html.gf .gf-card-select svg { display: none; width: 14px; height: 14px; color: #1a1400; }

        /* Divisores de seção para Agrupamento por Tipo na Galeria */
        .gf-gallery-group-header { grid-column: 1 / -1 !important; display: flex !important; align-items: center; justify-content: space-between; padding: 16px 4px 8px; margin-top: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .gf-gallery-group-title { font-size: 15px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px; }
        .gf-gallery-group-title svg { color: ${ACCENT}; width: 18px; height: 18px; }
        .gf-gallery-group-count { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.08); padding: 3px 9px; border-radius: 999px; }

        /* Single file page */
        html.gf #fm-root section.panel { background: #12141a !important; border: 1px solid rgba(255,255,255,0.08) !important; border-radius: 14px !important; }
        html.gf #fm-file-preview { border-radius: 14px !important; border: 1px solid rgba(255,255,255,0.08) !important; background: #000 !important; max-width: min(100%, 1200px) !important; margin: 16px auto !important; cursor: pointer; }
        html.gf #fm-file-preview video { border-radius: 12px !important; max-height: min(75vh, 800px) !important; margin: 0 auto !important; display: block !important; }

        /* ===================== STAGE THEATER EM 2 COLUNAS ===================== */
        html.gf.gf-has-stage, html.gf.gf-has-stage body { overflow: hidden !important; }
        .gf-stage { position: fixed; inset: 0; z-index: 2147483000; display: none; background: #0b0c0f; color: #fff; font-family: Inter, system-ui, sans-serif; }
        .gf-stage.open { display: flex; flex-direction: row; }
        .gf-stage * { box-sizing: border-box; }

        /* Coluna Principal da Esquerda (Topbar + Mídia) */
        .gf-stage-main { flex: 1 1 auto; min-width: 0; height: 100%; display: flex; flex-direction: column; overflow: hidden; position: relative; }
        .gf-stage-mid { position: relative; flex: 1 1 auto; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 0 !important; overflow: hidden; background: #000; }

        /* Topbar VROW (1 Linha no Desktop, 52px fixo, estilo Bunkr) */
        .gf-vrow { flex: 0 0 52px; height: 52px; min-height: 52px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 16px; background: #0e0f13; border-bottom: 1px solid rgba(255,255,255,.08); white-space: nowrap; box-sizing: border-box; }
        .gf-vrow-top { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1 1 auto; }
        .gf-vrow-sub { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
        .gf-top-logo { display: inline-flex; align-items: center; gap: 8px; color: #fff; text-decoration: none; font-weight: 800; font-size: 16px; letter-spacing: -0.02em; padding: 4px 6px; border-radius: 6px; transition: opacity .12s; flex: 0 0 auto; }
        .gf-top-logo:hover { opacity: 0.85; }
        .gf-logo-img { height: 26px; width: auto; display: block; }
        .gf-vrow .gf-name { flex: 0 1 auto; min-width: 60px; max-width: 45vw; display: inline-flex; align-items: center; gap: 8px; padding: 0 4px; font-weight: 600; font-size: 13.5px; }
        .gf-vrow .gf-name svg { color: ${ACCENT}; flex: 0 0 auto; width: 16px; height: 16px; }
        .gf-vrow .gf-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .gf-stats { display: flex; align-items: center; gap: 8px; padding: 0 4px; flex: 0 0 auto; }
        .gf-stat { font-size: 12px; color: rgba(255,255,255,.62); font-weight: 600; background: rgba(255,255,255,0.06); padding: 3px 7px; border-radius: 5px; }
        .gf-stat-type { color: ${ACCENT}; background: rgba(245,196,0,0.15); border: 1px solid rgba(245,196,0,0.3); }

        .gf-spacer { flex: 1 1 auto; min-width: 8px; }
        .gf-item { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 7px; padding: 7px 12px; border: 1px solid rgba(255,255,255,.1); border-radius: 8px; background: rgba(255,255,255,.05); color: #fff; font: 600 12.5px/1 Inter, system-ui, sans-serif; cursor: pointer; text-decoration: none; transition: background .12s, border-color .12s; }
        .gf-item:hover { background: rgba(255,255,255,.1); border-color: ${ACCENT}66; }
        .gf-item.is-primary { background: ${ACCENT}; border-color: ${ACCENT}; color: #1a1400; font-weight: 700; }
        .gf-item.is-primary svg { color: #1a1400; }
        .gf-vsep { flex: 0 0 auto; width: 1px; height: 20px; margin: 0 3px; background: rgba(255,255,255,.1); }

        /* ===================== SIDEBAR DE PLAYLIST ===================== */
        .gf-sidebar { flex: 0 0 420px; width: 420px; height: 100%; background: #0e0f13; border-left: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; overflow: hidden; z-index: 20; transition: width .2s ease, transform .2s ease; }
        .gf-stage.is-sidebar-collapsed .gf-sidebar { display: none !important; }
        .gf-vrow-playlist { display: none !important; }
        .gf-stage.is-sidebar-collapsed .gf-vrow-playlist { display: inline-flex !important; }
        @media (max-width: 768px) {
            .gf-vrow-playlist { display: inline-flex !important; }
            .gf-stage.open { flex-direction: column !important; }
            .gf-stage-main { height: auto !important; min-height: 45vh !important; }
            .gf-sidebar { width: 100% !important; flex: 1 1 auto !important; height: auto !important; max-height: none !important; border-left: none !important; border-top: 1px solid rgba(255,255,255,0.08) !important; }
            .gf-playlist-list { max-height: 55vh !important; }
        }

        .gf-sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); flex: 0 0 auto; }
        .gf-sidebar-title { font-size: 14px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px; }
        .gf-sidebar-title span { color: rgba(255,255,255,0.5); font-weight: 500; font-size: 13px; }
        .gf-sidebar-actions { display: flex; align-items: center; gap: 8px; }
        .gf-sidebar-btn { display: inline-flex; align-items: center; justify-content: center; height: 30px; padding: 0 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #fff; font: 600 12.5px/1 Inter, sans-serif; cursor: pointer; transition: background .12s, border-color .12s; }
        .gf-sidebar-btn:hover { background: rgba(255,255,255,0.12); border-color: ${ACCENT}66; }
        .gf-sidebar-search { padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); flex: 0 0 auto; }
        .gf-sidebar-input { width: 100%; height: 36px; box-sizing: border-box; padding: 0 12px 0 36px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a3a3ad' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m21 21-4.3-4.3'/%3E%3C/svg%3E") no-repeat 11px center; background-size: 15px; color: #fff; font-size: 13px; outline: none; }
        .gf-sidebar-input:focus { border-color: ${ACCENT}; background-color: rgba(255,255,255,0.08); }
        .gf-sidebar-filter-tabs { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); flex: 0 0 auto; overflow-x: auto; scrollbar-width: none; }
        .gf-sidebar-filter-tabs::-webkit-scrollbar { display: none; }
        .gf-tab-chip { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 999px; font: 600 12px/1 Inter, sans-serif; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); border: 1px solid transparent; cursor: pointer; transition: all .12s; white-space: nowrap; flex: 0 0 auto; }
        .gf-tab-chip:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .gf-tab-chip.is-active { background: rgba(245,196,0,0.18); color: ${ACCENT}; border-color: rgba(245,196,0,0.4); font-weight: 700; }
        .gf-sidebar-sort-bar { display: flex; align-items: center; gap: 8px; padding: 8px 14px; font-size: 11.5px; color: rgba(255,255,255,0.5); flex: 0 0 auto; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .gf-sort-chip { background: transparent; border: 0; color: rgba(255,255,255,0.6); font: 600 11.5px/1 Inter, sans-serif; padding: 3px 8px; border-radius: 4px; cursor: pointer; transition: color .12s; }
        .gf-sort-chip:hover { color: #fff; }
        .gf-sort-chip.is-active { color: ${ACCENT}; font-weight: 700; background: rgba(245,196,0,0.12); }
        .gf-playlist-list { flex: 1 1 auto; overflow-y: auto; padding: 8px 10px; display: flex; flex-direction: column; gap: 8px; scrollbar-width: thin; scrollbar-color: rgba(245,196,0,.35) transparent; }
        .gf-playlist-list::-webkit-scrollbar { width: 6px; }
        .gf-playlist-list::-webkit-scrollbar-thumb { background: rgba(245,196,0,.35); border-radius: 4px; }
        .gf-playlist-item { display: flex; align-items: flex-start; gap: 12px; padding: 8px; border-radius: 10px; background: rgba(255,255,255,.02); border: 1px solid transparent; color: #fff; text-decoration: none; transition: background .12s, border-color .12s, transform .1s; position: relative; cursor: pointer; }
        .gf-playlist-item:hover { background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.08); transform: translateX(2px); }
        .gf-playlist-item.is-current { background: rgba(245,196,0,.13); border-color: rgba(245,196,0,.38); }
        .gf-playlist-item.is-current::before { content: none; }
        .gf-playlist-thumb-wrap { position: relative; flex: 0 0 176px; width: 176px; height: 99px; border-radius: 8px; overflow: hidden; background: #181920; }
        .gf-playlist-thumb, .gf-playlist-thumb-wrap > img { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important; object-fit: cover !important; object-position: center !important; display: block !important; }
        .gf-playlist-thumb-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; background: linear-gradient(135deg, #13151f 0%, #0d0e14 100%); border: 1px solid rgba(255,255,255,0.06); box-sizing: border-box; }
        .gf-playlist-thumb-placeholder svg { width: 24px; height: 24px; color: ${ACCENT}; opacity: 0.9; }
        .gf-playlist-ph-ext { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; font-weight: 700; line-height: 1; letter-spacing: 0.05em; padding: 2.5px 6px; border-radius: 4px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.85); border: 1px solid rgba(255,255,255,0.08); }
        .gf-playlist-kind { position: absolute; top: 6px; left: 6px; z-index: 1; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.78); color: #fff; font: 700 10px/1.2 Inter, system-ui, sans-serif; letter-spacing: .02em; }
        .gf-playlist-num { position: absolute; top: 6px; right: 6px; z-index: 1; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.8); color: #fff; font: 700 11px/1 Inter, system-ui, sans-serif; }
        .gf-playlist-dur { position: absolute; bottom: 5px; right: 6px; z-index: 1; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.8); color: #fff; font: 700 11px/1 Inter, system-ui, sans-serif; }
        .gf-playlist-dur[hidden] { display: none !important; }
        .gf-playlist-info { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .gf-playlist-name { font-size: 14.5px !important; font-weight: 500 !important; line-height: 1.35; color: #fff !important; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; word-break: break-word; }
        .gf-playlist-item.is-current .gf-playlist-name { color: #fff; font-weight: 700; }
        .gf-playlist-dates { display: flex; flex-direction: column; gap: 2px; margin-top: 3px; min-width: 0; }
        .gf-playlist-date-row { display: block; min-width: 0; font-size: 12.5px; line-height: 1.3; color: rgba(255,255,255,.72); white-space: nowrap; }
        .gf-playlist-date-val { display: block; overflow: visible; text-overflow: clip; white-space: nowrap; color: rgba(255,255,255,.72); font-weight: 500; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; }
        .gf-playlist-meta { font-size: 12.5px; color: rgba(255,255,255,.5); display: flex; align-items: center; gap: 8px; }
        .gf-playlist-meta-active { color: ${ACCENT}; font-weight: 600; }

        /* ===================== PLAYER DE VÍDEO ===================== */
        :root { --gf-accent: ${ACCENT}; }
        .gf-host { position: relative; width: 100%; height: 100%; max-width: 100%; max-height: 100%; background: #000; border-radius: 0 !important; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .gf-video { width: 100% !important; height: 100% !important; max-width: 100% !important; max-height: 100% !important; object-fit: contain !important; background: #000 !important; border-radius: 0 !important; outline: none; cursor: pointer; display: block; }
        .gf-plc-flash { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }
        .gf-plc-play { pointer-events: auto; width: 68px; height: 68px; border-radius: 50%; border: 1px solid rgba(255,255,255,.18); background: rgba(14,16,22,.75); backdrop-filter: blur(14px); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 10px 30px rgba(0,0,0,.5); transition: transform .15s, background .15s, opacity .15s, border-color .15s; }
        .gf-plc-play:hover { transform: scale(1.08); background: rgba(22,24,34,.9); border-color: var(--gf-accent, #f5c400); }
        .gf-plc-play svg { width: 34px; height: 34px; margin-left: 3px; }
        .gf-host.is-playing .gf-plc-play { opacity: 0; pointer-events: none; transform: scale(.9); }
        .gf-host:hover .gf-plc-play { opacity: 1; pointer-events: auto; transform: scale(1); }
        .gf-plc-seekflash { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,.75); color: #fff; padding: 10px 18px; border-radius: 20px; font-weight: 700; font-size: 15px; pointer-events: none; opacity: 0; transition: opacity .15s; }
        .gf-plc-seekflash.on { opacity: 1; }
        .gf-plc-bottom { position: absolute; left: 0; right: 0; bottom: 0; z-index: 5; padding: 0 14px 10px; background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,.85) 100%); opacity: 0; transition: opacity .18s; pointer-events: none; }
        .gf-host:hover .gf-plc-bottom, .gf-host:not(.is-playing) .gf-plc-bottom, .gf-img-host:hover .gf-plc-bottom, .gf-img-host:focus-within .gf-plc-bottom { opacity: 1; pointer-events: auto; }
        @media (hover: none) { .gf-plc-bottom { opacity: 1; pointer-events: auto; } }
        .gf-plc-prog { position: relative; height: 16px; display: flex; align-items: center; cursor: pointer; }
        .gf-plc-bar { position: relative; width: 100%; height: 4px; background: rgba(255,255,255,.25); border-radius: 2px; transition: height .1s; }
        .gf-plc-prog:hover .gf-plc-bar { height: 6px; }
        .gf-plc-buf { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: rgba(255,255,255,.4); border-radius: 2px; }
        .gf-plc-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: var(--gf-accent, #f5c400); border-radius: 2px; }
        .gf-plc-knob { position: absolute; right: -6px; top: 50%; transform: translateY(-50%) scale(0); width: 13px; height: 13px; border-radius: 50%; background: #fff; transition: transform .1s; box-shadow: 0 0 4px rgba(0,0,0,.5); }
        .gf-plc-prog:hover .gf-plc-knob { transform: translateY(-50%) scale(1); }
        .gf-plc-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px; flex-wrap: wrap; }
        .gf-plc-left, .gf-plc-right { display: flex; align-items: center; gap: 6px; }
        @media (max-width: 900px) {
            .gf-plc-row { flex-direction: column !important; align-items: stretch !important; gap: 3px !important; }
            .gf-plc-left, .gf-plc-right { width: 100% !important; height: 34px !important; gap: 1px !important; }
            .gf-plc-left .gf-plc-time { margin-left: auto !important; }
            .gf-plc-right { justify-content: flex-end !important; padding-top: 3px !important; border-top: 1px solid rgba(255,255,255,.08) !important; }
            .gf-plc-autoplay { margin-right: auto !important; }
        }
        .gf-plc-timetip { position: absolute; bottom: calc(100% + 7px); transform: translateX(-50%); background: rgba(14,15,19,.95); border: 1px solid rgba(255,255,255,.16); color: #fff; font: 600 11px/1 Inter, system-ui, sans-serif; font-variant-numeric: tabular-nums; padding: 4px 7px; border-radius: 6px; pointer-events: none; opacity: 0; white-space: nowrap; z-index: 10; }
        .gf-plc-prog:hover .gf-plc-timetip { opacity: 1; }
        .gf-plc-act { position: relative; border: 0; background: transparent; color: #fff; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; transition: background .12s, color .12s; font-size: 13px; flex: 0 0 auto; }
        .gf-plc-act:hover { background: rgba(255,255,255,.12); }
        .gf-plc-act.is-active { color: var(--gf-accent, #f5c400); background: rgba(245,196,0,.16); }
        .gf-plc-act svg { width: 20px; height: 20px; }
        .gf-plc-time { font-size: 12px; font-weight: 600; color: rgba(255,255,255,.88); margin-left: 4px; font-variant-numeric: tabular-nums; }
        .gf-plc-skip { position: relative; border-radius: 50%; }
        .gf-plc-skipn { position: absolute; left: 0; right: 0; top: 51%; transform: translateY(-50%); text-align: center; font: 800 8.5px/1 Inter, system-ui, sans-serif; pointer-events: none; }
        .gf-plc-autoplay { width: auto; height: 30px; padding: 0 8px 0 10px; border-radius: 15px; gap: 8px; font: 600 12px/1 Inter, system-ui, sans-serif; color: rgba(255,255,255,.85); background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); }
        .gf-plc-autoplay:hover { background: rgba(255,255,255,.12); }
        .gf-plc-autoplay.is-active { background: rgba(245,196,0,.16); border-color: rgba(245,196,0,.4); color: #fff; }
        .gf-plc-ap-pill { position: relative; width: 28px; height: 16px; border-radius: 9px; background: rgba(255,255,255,.24); display: block; flex: 0 0 28px; }
        .gf-plc-ap-knob { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: #fff; display: block; transition: transform .18s ease; }
        .gf-plc-autoplay.is-active .gf-plc-ap-pill { background: var(--gf-accent, #f5c400); }
        .gf-plc-autoplay.is-active .gf-plc-ap-knob { transform: translateX(12px); background: #1a1400; }
        .gf-plc-vol { display: flex; align-items: center; gap: 4px; }
        .gf-plc-volbar { width: 0; height: 28px; display: flex; align-items: center; cursor: pointer; overflow: hidden; transition: width .18s ease, margin .18s ease; }
        .gf-plc-vol:hover .gf-plc-volbar, .gf-plc-volbar:hover { width: 62px; margin-right: 4px; }
        .gf-plc-volfill { width: 100%; height: 4px; background: #fff; border-radius: 2px; position: relative; }
        .gf-plc-speedwrap { position: relative; }
        .gf-plc-speedmenu { position: absolute; bottom: 42px; right: 0; background: rgba(18,20,26,.96); border: 1px solid rgba(255,255,255,.12); border-radius: 10px; padding: 6px; display: none; flex-direction: column; gap: 2px; min-width: 86px; max-height: 240px; overflow-y: auto; box-shadow: 0 10px 28px rgba(0,0,0,.6); z-index: 10; }
        .gf-plc-speedmenu.open { display: flex; }
        .gf-plc-speeditem { border: 0; background: transparent; color: #fff; padding: 6px 10px; font: 600 12.5px/1 Inter, sans-serif; border-radius: 6px; cursor: pointer; text-align: left; }
        .gf-plc-speeditem:hover { background: rgba(255,255,255,.1); }
        .gf-plc-speeditem.on { color: var(--gf-accent, #f5c400); font-weight: 800; }

        /* ===================== FOTO ZOOM/PAN ===================== */
        .gf-img-host { position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; max-width: 100%; max-height: 100%; margin: 0; overflow: visible; }
        .gf-image {
            display: block !important;
            max-width: 100% !important;
            max-height: 100% !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain !important;
            opacity: 1 !important;
            filter: none !important;
            position: static !important;
            background: transparent !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            cursor: zoom-in;
            user-select: none;
            -webkit-user-drag: none;
            transform-origin: center center;
            will-change: transform;
            touch-action: none;
        }
        .gf-stage-mid.is-zoomed .gf-image, .gf-img-host.is-zoomed .gf-image { cursor: grab; }
        .gf-stage-mid.is-zoomed .gf-image:active, .gf-img-host.is-zoomed .gf-image:active { cursor: grabbing; }

        /* ===================== TEXT VIEWER NO STAGE ===================== */
        .gf-txt-stage-host { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 24px; box-sizing: border-box; overflow: hidden; }
        .gf-txt-stage-card { width: 100%; max-width: 960px; height: 85vh; max-height: 820px; background: #11131a; border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; display: flex; flex-direction: column; box-shadow: 0 16px 40px rgba(0,0,0,0.6); overflow: hidden; }
        .gf-txt-stage-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; background: #161822; border-bottom: 1px solid rgba(255,255,255,0.08); flex: 0 0 auto; }
        .gf-txt-stage-info { display: flex; align-items: center; gap: 10px; }
        .gf-txt-tag { font: 700 10.5px/1 Inter, monospace; letter-spacing: 0.05em; background: rgba(245,196,0,0.2); color: #f5c400; padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(245,196,0,0.35); }
        .gf-txt-meta { font-size: 12px; color: rgba(255,255,255,0.6); }
        .gf-txt-stage-actions { display: flex; align-items: center; gap: 8px; }
        .gf-txt-btn { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #fff; font: 600 12px/1 Inter, sans-serif; cursor: pointer; text-decoration: none; transition: background .12s, border-color .12s; }
        .gf-txt-btn:hover { background: rgba(245,196,0,0.15); border-color: rgba(245,196,0,0.4); color: #fff; text-decoration: none; }
        .gf-txt-btn[disabled] { opacity: 0.45; cursor: not-allowed; pointer-events: none; }
        .gf-txt-btn svg { width: 14px; height: 14px; }
        .gf-txt-stage-content { flex: 1 1 auto; overflow-y: auto; padding: 18px 20px; margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace !important; font-size: 13px !important; line-height: 1.6 !important; color: #e2e8f0 !important; white-space: pre-wrap !important; word-break: break-word !important; background: transparent !important; }

        /* ===================== SETAS LATERAIS ===================== */
        .gf-nav-side { position: absolute; top: 50%; transform: translateY(-50%); z-index: 6; width: 46px; height: 46px; border: 0; border-radius: 50%; background: rgba(0,0,0,.5); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .18s, background .12s; }
        .gf-nav-prev { left: 16px; } .gf-nav-next { right: 16px; }
        .gf-stage.has-nav .gf-stage-mid:hover .gf-nav-side { opacity: 1; pointer-events: auto; }
        @media (hover: none) { .gf-stage.has-nav .gf-nav-side { opacity: .85; pointer-events: auto; } }
        .gf-nav-side:hover { background: rgba(0,0,0,.74); }
        .gf-nav-side svg { width: 26px; height: 26px; display: block; }
        @keyframes gf-spin { to { transform: rotate(360deg); } }

        /* ===================== ADAPTAÇÃO MOBILE (<= 768px) ===================== */
        @media (max-width: 768px) {
            html.gf.gf-has-stage, html.gf.gf-has-stage body { overflow: auto !important; height: 100% !important; }
            .gf-stage { position: fixed !important; inset: 0 !important; width: 100% !important; height: 100% !important; overflow-y: auto !important; overflow-x: hidden !important; display: none; flex-direction: column !important; -webkit-overflow-scrolling: touch; }
            .gf-stage.open { display: flex !important; }
            .gf-stage-main { flex: 0 0 auto !important; width: 100% !important; height: auto !important; min-height: 0 !important; }
            .gf-vrow { flex-direction: column !important; align-items: stretch !important; gap: 8px !important; padding: 10px 12px !important; }
            .gf-vrow-top { width: 100% !important; justify-content: flex-start !important; }
            .gf-vrow-top .gf-name { max-width: calc(100vw - 110px) !important; font-size: 13px !important; }
            .gf-vrow-sub { width: 100% !important; justify-content: space-between !important; overflow-x: auto !important; padding-top: 4px !important; border-top: 1px solid rgba(255,255,255,0.06) !important; }
            .gf-stage-mid { width: 100% !important; height: 56.25vw !important; min-height: 220px !important; max-height: 440px !important; }
            .gf-sidebar { width: 100% !important; height: auto !important; border-left: 0 !important; border-top: 1px solid rgba(255,255,255,0.08) !important; flex: 0 0 auto !important; }
            .gf-sidebar-header .gf-sidebar-close { display: none !important; }
            .gf-playlist-list { overflow: visible !important; height: auto !important; max-height: none !important; padding-bottom: 40px !important; }
            .gf-playlist-thumb-wrap { flex: 0 0 132px !important; width: 132px !important; height: 74px !important; }
            .gf-playlist-name { font-size: 13.5px !important; }
            .gf-playlist-meta, .gf-playlist-date-lbl, .gf-playlist-date-val { font-size: 12px !important; }
        }
    `;

    function addCSS(css) {
        if (typeof GM_addStyle === "function") { GM_addStyle(css); return; }
        const s = document.createElement("style"); s.textContent = css;
        (document.head || document.documentElement).appendChild(s);
    }
    addCSS(CSS);

    const keepRoot = () => { if (!document.documentElement.classList.contains("gf")) document.documentElement.classList.add("gf"); };
    try { new MutationObserver(keepRoot).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] }); } catch (e) {}

    /* ===================== HELPERS ===================== */
    const PREFS_KEY = "gofile_prefs";
    const prefs = Object.assign({ volume: 1, muted: false, rate: 1, loop: false, autoplay: true }, (() => { try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; } })());
    let saveT; const saveP = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {} }, 250); };

    function el(tag, props, ...kids) {
        const n = document.createElement(tag);
        if (props) for (const [k, v] of Object.entries(props)) {
            if (v == null) continue;
            if (k === "class") n.className = v; else if (k === "html") n.innerHTML = v;
            else if (k === "style" && typeof v === "object") Object.assign(n.style, v);
            else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2).toLowerCase(), v);
            else n.setAttribute(k, v);
        }
        for (const kid of kids) if (kid != null) n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
        return n;
    }

    function fireNativeClick(target) {
        if (!target) return;
        try {
            const rect = target.getBoundingClientRect();
            const clientX = rect.left + (rect.width ? rect.width / 2 : 10);
            const clientY = rect.top + (rect.height ? rect.height / 2 : 10);
            const opts = { bubbles: true, cancelable: true, composed: true, view: window, clientX, clientY };
            target.dispatchEvent(new PointerEvent("pointerdown", opts));
            target.dispatchEvent(new MouseEvent("mousedown", opts));
            target.dispatchEvent(new PointerEvent("pointerup", opts));
            target.dispatchEvent(new MouseEvent("mouseup", opts));
            target.dispatchEvent(new MouseEvent("click", opts));
        } catch (e) {
            try { target.click(); } catch (err) {}
        }
    }

    const svgi = inner => `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block">${inner}</svg>`;
    const IC = {
        download: svgi('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
        copy: svgi('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
        expand: svgi('<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>'),
        close: svgi('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
        grid: svgi('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
        video: svgi('<rect x="2" y="5" width="14" height="14" rx="2"/><path d="m22 8-6 4 6 4V8z"/>'),
        image: svgi('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'),
        file: svgi('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'),
        doc: svgi('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>'),
        archive: svgi('<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>'),
        audio: svgi('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
        check: svgi('<polyline points="20 6 9 17 4 12"/>'),
        prev: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M6 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1zm12.44 1.34a1 1 0 0 0-1.44-.88l-9 5.5a1 1 0 0 0 0 1.72l9 5.5A1 1 0 0 0 19 17.5v-11a1 1 0 0 0-.56-.86z"/></svg>',
        next: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M18 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1zM5.56 6.66a1 1 0 0 0-1.56.84v11a1 1 0 0 0 1.56.84l9-5.5a1 1 0 0 0 0-1.68l-9-5.5z"/></svg>',
        share: svgi('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>'),
        flag: svgi('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>'),
        pip: svgi('<rect x="2" y="4" width="20" height="16" rx="2"/><rect x="12" y="10" width="8" height="8" rx="1"/>'),
        chevL: svgi('<path d="m15 18-6-6 6-6"/>'),
        chevR: svgi('<path d="m9 18 6-6-6-6"/>'),
        chevDown: svgi('<path d="m6 9 6 6 6-6"/>'),
        playlist: svgi('<line x1="3" y1="6" x2="15" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="11" y2="18"/><polygon points="17,14 22,17 17,20" fill="currentColor" stroke="none"/>'),
        group: svgi('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>'),
        play: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M7 4.5v15a1 1 0 0 0 1.52.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>',
        pause: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>',
        volume: svgi('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>'),
        mute: svgi('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>'),
        skipBack: svgi('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>'),
        skipFwd: svgi('<path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>'),
        repeat: svgi('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'),
        logoMark: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true" style="display:block"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>',
    };
    const fmtT = s => { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60; const p = n => String(n).padStart(2, "0"); return h ? h + ":" + p(m) + ":" + p(ss) : m + ":" + p(ss); };
    const gfDurKnown = new Map();
    const gfDurPending = new Set();
    const gfDurQueue = [];
    let gfDurBusy = 0;
    function gfCachedDur(key) {
        if (!key) return "";
        if (gfDurKnown.has(key)) return gfDurKnown.get(key);
        try { const v = sessionStorage.getItem("gfdur:" + key); if (v) { gfDurKnown.set(key, v); return v; } } catch {}
        return "";
    }
    function gfRememberDur(key, text) {
        if (!key || !text) return;
        gfDurKnown.set(key, text);
        try { sessionStorage.setItem("gfdur:" + key, text); } catch {}
        document.querySelectorAll('.gf-playlist-dur[data-dur-key="' + CSS.escape(key) + '"]').forEach(node => { node.textContent = text; node.hidden = false; });
    }
    function gfPumpDur() {
        while (gfDurBusy < 2 && gfDurQueue.length) {
            const job = gfDurQueue.shift();
            gfDurBusy++;
            const v = document.createElement("video");
            v.preload = "metadata";
            v.muted = true;
            v.playsInline = true;
            let settled = false;
            const finish = (text) => {
                if (settled) return;
                settled = true;
                v.removeAttribute("src");
                try { v.load(); } catch {}
                gfDurBusy--;
                if (text) gfRememberDur(job.key, text);
                gfPumpDur();
            };
            v.addEventListener("loadedmetadata", () => finish(Number.isFinite(v.duration) ? fmtT(v.duration) : ""), { once: true });
            v.addEventListener("error", () => finish(""), { once: true });
            setTimeout(() => finish(""), 12000);
            v.src = job.url;
        }
    }
    function gfProbeDur(key, url) {
        if (!key || !url || gfCachedDur(key) || gfDurPending.has(key)) return;
        gfDurPending.add(key);
        gfDurQueue.push({ key, url });
        gfPumpDur();
    }

    function vbtn(icon, label, opts) {
        const b = el("button", Object.assign({ class: "gf-item", type: "button" }, opts || {}));
        b.insertAdjacentHTML("beforeend", icon);
        if (label) b.append(el("span", null, label));
        return b;
    }

    /* ===================== CONTROLES DO PLAYER (Estilo YouTube) ===================== */
    function buildPlayerControls(wrap, video, src, ac) {
        const on = (e, ev, fn) => e.addEventListener(ev, fn, ac ? { signal: ac.signal } : undefined);
        const mkAct = (ic, label, cb) => { const b = el("button", { type: "button", class: "gf-plc-act", title: label, "aria-label": label }); b.innerHTML = ic; b.addEventListener("click", cb); return b; };

        const toggle = () => {
            if (video.paused || video.ended) {
                const p = video.play();
                if (p && p.catch) {
                    p.catch(err => {
                        console.warn("[gofile] play rejected, tentando mudo:", err);
                        video.muted = true;
                        video.play().catch(e => console.error("[gofile] play mudo falhou:", e));
                    });
                }
            } else {
                video.pause();
            }
        };

        const sflash = el("div", { class: "gf-plc-seekflash" }); let sft;
        const seek = d => { if (!video.duration) return; video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + d)); sflash.textContent = d < 0 ? "« 5s" : "5s »"; sflash.classList.add("on"); clearTimeout(sft); sft = setTimeout(() => sflash.classList.remove("on"), 480); };

        let clickT = null;
        on(video, "click", e => { e.preventDefault(); e.stopPropagation(); if (clickT) return; clickT = setTimeout(() => { clickT = null; toggle(); }, 230); });
        on(video, "dblclick", e => { e.preventDefault(); e.stopPropagation(); if (clickT) { clearTimeout(clickT); clickT = null; } const r = video.getBoundingClientRect(); seek((e.clientX - r.left) < r.width / 2 ? -5 : 5); });

        const playBtn = el("button", { type: "button", class: "gf-plc-play", "aria-label": "Play/Pause" }); playBtn.innerHTML = IC.play;
        playBtn.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); toggle(); });

        const flash = el("div", { class: "gf-plc-flash" }, playBtn);
        flash.addEventListener("click", e => {
            if (e.target !== flash && !flash.contains(e.target)) return;
            e.preventDefault(); e.stopPropagation(); toggle();
        });

        const buf = el("div", { class: "gf-plc-buf" });
        const knob = el("div", { class: "gf-plc-knob" });
        const fill = el("div", { class: "gf-plc-fill" }, knob);
        const bar = el("div", { class: "gf-plc-bar" }, buf, fill);
        const timeTip = el("div", { class: "gf-plc-timetip" }, "0:00");
        const prog = el("div", { class: "gf-plc-prog" }, bar, timeTip);
        const seekTo = (cx, r) => { if (!video.duration || !r.width) return; video.currentTime = Math.max(0, Math.min(1, (cx - r.left) / r.width)) * video.duration; };
        prog.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); const r = bar.getBoundingClientRect(); seekTo(e.clientX, r); const mv = ev => seekTo(ev.clientX, r); const up = () => { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); }; document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up); });
        prog.addEventListener("pointermove", ev => {
            const r = bar.getBoundingClientRect();
            if (!r.width || !video.duration) return;
            const ratio = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
            timeTip.textContent = fmtT(ratio * video.duration);
            timeTip.style.left = (ratio * 100) + "%";
        });

        const tEl = el("span", { class: "gf-plc-time" }, "0:00");
        const syncTime = () => { const s = fmtT(video.currentTime) + (video.duration ? " / " + fmtT(video.duration) : ""); if (tEl.firstChild && tEl.firstChild.data !== s) tEl.firstChild.data = s; };
        on(video, "timeupdate", () => { if (video.duration) fill.style.width = (video.currentTime / video.duration * 100) + "%"; syncTime(); });
        on(video, "loadedmetadata", syncTime);
        on(video, "progress", () => { try { if (video.buffered.length && video.duration) buf.style.width = (video.buffered.end(video.buffered.length - 1) / video.duration * 100) + "%"; } catch {} });

        const mute = mkAct(IC.mute, "Mudo (m)", e => { e.stopPropagation(); video.muted = !video.muted; if (!video.muted && !video.volume) video.volume = 1; syncVol(); });
        const volfill = el("div", { class: "gf-plc-volfill" });
        const volbar = el("div", { class: "gf-plc-volbar", role: "slider", "aria-label": "Volume" }, volfill);
        const syncVol = () => { mute.innerHTML = (video.muted || !video.volume) ? IC.mute : IC.volume; volfill.style.width = ((video.muted ? 0 : video.volume) * 100) + "%"; };
        const setVolX = (cx, r) => { if (!r.width) return; const v = Math.max(0, Math.min(1, (cx - r.left) / r.width)); video.volume = v; video.muted = (v === 0); syncVol(); };
        volbar.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); const r = volbar.getBoundingClientRect(); setVolX(e.clientX, r); const mv = ev => setVolX(ev.clientX, r); const up = () => { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); }; document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up); });
        const volgrp = el("div", { class: "gf-plc-vol" }, mute, volbar);

        const goFs = () => { try { document.fullscreenElement ? document.exitFullscreen() : wrap.requestFullscreen(); } catch {} };
        const dlb = mkAct(IC.download, "Baixar", e => { e.stopPropagation(); if (stCur && stCur._gf && stCur._gf.downloadBtn) stCur._gf.downloadBtn.click(); else if (src) window.open(src, "_blank"); });
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
        const barPlay = mkAct(IC.play, "Play/Pause (espaço)", e => { e.stopPropagation(); toggle(); }); barPlay.classList.add("gf-plc-barplay");

        const prevBtn = mkAct(IC.prev, "Anterior (Shift+P)", e => { e.stopPropagation(); navStage(-1); });
        const nextBtn = mkAct(IC.next, "Próximo (Shift+N)", e => { e.stopPropagation(); navStage(1); });

        const loopBtn = mkAct(IC.repeat, prefs.loop ? "Repetir vídeo (ativado)" : "Repetir vídeo", e => {
            e.stopPropagation();
            video.loop = !video.loop;
            prefs.loop = video.loop;
            saveP();
            loopBtn.classList.toggle("is-active", !!video.loop);
            toast(video.loop ? "Repetir ativado" : "Repetir desativado");
        });
        loopBtn.classList.toggle("is-active", !!prefs.loop);
        const apBtn = el("button", {
            type: "button",
            class: "gf-plc-act gf-plc-autoplay" + (prefs.autoplay ? " is-active" : ""),
            title: prefs.autoplay ? "Reprodução automática ativada" : "Reprodução automática desativada",
            "aria-label": "Reprodução automática"
        },
            el("span", null, "Autoplay"),
            el("span", { class: "gf-plc-ap-pill" }, el("span", { class: "gf-plc-ap-knob" }))
        );
        apBtn.addEventListener("click", e => {
            e.stopPropagation();
            prefs.autoplay = !prefs.autoplay;
            saveP();
            apBtn.classList.toggle("is-active", !!prefs.autoplay);
            toast(prefs.autoplay ? "Autoplay ativado" : "Autoplay desativado");
        });
        on(video, "ended", () => {
            if (!video.loop && prefs.autoplay) setTimeout(() => navStage(1), 600);
        });
        on(video, "loadedmetadata", () => { video.loop = !!prefs.loop; });

        const mkSkip = (ic, label, cb) => { const b = el("button", { type: "button", class: "gf-plc-act gf-plc-skip", title: label, "aria-label": label }); b.innerHTML = ic; b.appendChild(el("span", { class: "gf-plc-skipn" }, "5")); b.addEventListener("click", cb); return b; };
        const skipBack = mkSkip(IC.skipBack, "Voltar 5s (←)", e => { e.stopPropagation(); seek(-5); });
        const skipFwd = mkSkip(IC.skipFwd, "Avançar 5s (→)", e => { e.stopPropagation(); seek(5); });

        const RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];
        const speedMenu = el("div", { class: "gf-plc-speedmenu" });
        const speedBtn = el("button", { type: "button", class: "gf-plc-act gf-plc-speed", title: "Velocidade", "aria-label": "Velocidade" }, "1x");
        const speedWrap = el("div", { class: "gf-plc-speedwrap" }, speedMenu, speedBtn);
        let speedCloser = null;
        const closeSpeed = () => { speedMenu.classList.remove("open"); if (speedCloser) { document.removeEventListener("pointerdown", speedCloser, true); speedCloser = null; } };
        const openSpeed = () => { speedMenu.classList.add("open"); speedCloser = ev => { if (!speedWrap.contains(ev.target)) closeSpeed(); }; document.addEventListener("pointerdown", speedCloser, true); };
        RATES.forEach(r => { const it = el("button", { type: "button", class: "gf-plc-speeditem" }, r + "x"); it.dataset.r = r; it.addEventListener("click", e => { e.stopPropagation(); try { video.playbackRate = r; } catch {} closeSpeed(); }); speedMenu.appendChild(it); });
        speedBtn.addEventListener("click", e => { e.stopPropagation(); speedMenu.classList.contains("open") ? closeSpeed() : openSpeed(); });
        const syncSpeed = () => { const r = video.playbackRate; speedBtn.textContent = r + "x"; speedMenu.querySelectorAll(".gf-plc-speeditem").forEach(it => it.classList.toggle("on", +it.dataset.r === r)); };
        on(video, "ratechange", () => { prefs.rate = video.playbackRate; saveP(); syncSpeed(); });
        on(video, "loadedmetadata", () => { try { video.playbackRate = prefs.rate || 1; } catch {} });

        const leftc = el("div", { class: "gf-plc-left" }, barPlay, loopBtn, prevBtn, nextBtn, skipBack, skipFwd, volgrp, tEl);
        const rightc = el("div", { class: "gf-plc-right" }, apBtn, speedWrap, reportBtn, dlb, shareBtn);
        if (pipBtn) rightc.appendChild(pipBtn);
        rightc.appendChild(fsb);
        const row = el("div", { class: "gf-plc-row" }, leftc, rightc);
        const bottom = el("div", { class: "gf-plc-bottom" }, prog, row);

        on(video, "play", () => { wrap.classList.add("is-playing"); playBtn.innerHTML = IC.pause; barPlay.innerHTML = IC.pause; });
        on(video, "pause", () => { wrap.classList.remove("is-playing"); playBtn.innerHTML = IC.play; barPlay.innerHTML = IC.play; });
        on(video, "volumechange", syncVol);
        on(video, "seeking", () => wrap.classList.add("is-buffering"));
        ["seeked", "canplay", "playing", "loadeddata", "pause", "suspend", "error", "abort"].forEach(ev => on(video, ev, () => wrap.classList.remove("is-buffering")));

        const setRate = dir => { const i = RATES.indexOf(video.playbackRate); const ni = Math.max(0, Math.min(RATES.length - 1, (i < 0 ? 3 : i) + dir)); try { video.playbackRate = RATES[ni]; } catch {} };
        const onKey = e => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const t = e.target;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
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
            else if (k >= "0" && k <= "9" && video.duration) video.currentTime = video.duration * (+k) / 10;
            else h = false;
            if (h) { e.preventDefault(); e.stopPropagation(); }
        };
        if (ac) document.addEventListener("keydown", onKey, { capture: true, signal: ac.signal });
        wrap.append(flash, sflash, bottom);
        try { video.playbackRate = prefs.rate || 1; } catch {}
        syncVol(); syncTime(); syncSpeed();
    }

    /* ===================== STAGE BUILDER ===================== */
    let stage, stMid, stName, stSize, stDl, stIcon, stCur = null;
    let stSidebarList, stSbCount, stPlBtn, stTypeStat;
    let isSidebarCollapsed = localStorage.getItem("gf_sidebar_collapsed") === "1";
    let plGroupFilter = "all"; // "all" | "video" | "image" | "text"
    let plSortMode = "default"; // "default" | "name"
    let plSearchQuery = "";

    const kindIcon = k => {
        if (k === "video") return IC.video;
        if (k === "image") return IC.image;
        if (k === "text") return IC.doc;
        if (k === "archive") return IC.archive;
        if (k === "audio") return IC.audio;
        return IC.file;
    };

    function toggleSidebar(forceState) {
        if (!stage) return;
        isSidebarCollapsed = typeof forceState === "boolean" ? forceState : !stage.classList.contains("is-sidebar-collapsed");
        stage.classList.toggle("is-sidebar-collapsed", isSidebarCollapsed);
        try { localStorage.setItem("gf_sidebar_collapsed", isSidebarCollapsed ? "1" : "0"); } catch {}
    }

    function buildStage() {
        if (stage) return;
        stage = el("div", { class: "gf-stage" + (isSidebarCollapsed ? " is-sidebar-collapsed" : "") });

        // Coluna Principal da Esquerda (Topbar + Mídia)
        const stageMain = el("div", { class: "gf-stage-main" });

        // Topbar
        const vrow = el("div", { class: "gf-vrow" });

        // Linha 1 (Desktop Esquerda, Mobile Linha 1): Logo + Nome
        const vrowTop = el("div", { class: "gf-vrow-top" });
        const topLogo = el("a", { class: "gf-top-logo", href: "https://gofile.io/", title: "Gofile" },
            el("img", { class: "gf-logo-img", src: "https://gofile.io/assets/img/logo-small-70.png", alt: "Gofile" }),
            el("span", null, "Gofile")
        );
        stIcon = el("span", { class: "gf-nameic" }); stIcon.insertAdjacentHTML("beforeend", IC.video);
        stName = el("span", null, "");
        const nameWrap = el("div", { class: "gf-name" }, stIcon, stName);
        vrowTop.append(topLogo, el("div", { class: "gf-vsep" }), nameWrap);

        // Linha 2 (Desktop Direita, Mobile Linha 2): Stats, Playlist e Ações
        const vrowSub = el("div", { class: "gf-vrow-sub" });
        const stats = el("div", { class: "gf-stats" });
        stSize = el("span", { class: "gf-stat" }, "");
        stTypeStat = el("span", { class: "gf-stat gf-stat-type" }, "Vídeo");
        stats.append(stSize, stTypeStat);

        stPlBtn = el("button", {
            class: "gf-item gf-vrow-playlist",
            type: "button",
            title: "Abrir playlist da pasta (p)",
            onClick: () => {
                const sb = document.querySelector(".gf-sidebar");
                if (window.innerWidth <= 768 && sb) {
                    sb.scrollIntoView({ behavior: "smooth" });
                } else {
                    toggleSidebar();
                }
            }
        });
        stPlBtn.insertAdjacentHTML("beforeend", IC.playlist);
        stPlBtn.append(el("span", null, "Playlist"));

        const close = vbtn(IC.close, "", { title: "Fechar (Esc)", onClick: closeStage });

        vrowSub.append(stats, el("div", { class: "gf-spacer" }), stPlBtn, el("div", { class: "gf-vsep" }), close);
        vrow.append(vrowTop, vrowSub);

        // Área Central de Mídia
        stMid = el("div", { class: "gf-stage-mid" });
        const navPrev = el("button", { class: "gf-nav-side gf-nav-prev", type: "button", title: "Anterior (Shift+P)", onClick: e => { e.stopPropagation(); navStage(-1); } }); navPrev.insertAdjacentHTML("beforeend", IC.chevL);
        const navNext = el("button", { class: "gf-nav-side gf-nav-next", type: "button", title: "Próximo (Shift+N)", onClick: e => { e.stopPropagation(); navStage(1); } }); navNext.insertAdjacentHTML("beforeend", IC.chevR);
        stMid.append(navPrev, navNext);

        stageMain.append(vrow, stMid);

        // Sidebar da Playlist
        const sidebar = el("aside", { class: "gf-sidebar" });
        const sbHeader = el("div", { class: "gf-sidebar-header" });
        stSbCount = el("span", null, "(0)");
        const sbTitle = el("div", { class: "gf-sidebar-title" }, el("span", null, "Arquivos da pasta"), stSbCount);
        const sbActions = el("div", { class: "gf-sidebar-actions" });
        const galleryBtn = el("button", { class: "gf-sidebar-btn", type: "button", title: "Abrir a galeria", onClick: closeStage }, "Galeria");
        const closeSb = el("button", { class: "gf-sidebar-btn gf-sidebar-close", type: "button", title: "Recolher sidebar (p)", onClick: () => toggleSidebar(true) }); closeSb.innerHTML = IC.close;
        sbActions.append(galleryBtn, closeSb);
        sbHeader.append(sbTitle, sbActions);

        // Barra de Busca na Sidebar
        const sbSearch = el("div", { class: "gf-sidebar-search" });
        const sbInput = el("input", { type: "text", class: "gf-sidebar-input", placeholder: "Filtrar na pasta…", autocomplete: "off", spellcheck: "false" });
        sbInput.addEventListener("input", () => {
            plSearchQuery = sbInput.value.trim().toLowerCase();
            renderPlaylist();
        });
        sbSearch.appendChild(sbInput);

        // Abas de Agrupamento por Tipo
        const sbTabs = el("div", { class: "gf-sidebar-filter-tabs" });
        const tabAll = el("button", { class: "gf-tab-chip is-active", type: "button", dataset: { group: "all" } }, "Todos");
        const tabVideos = el("button", { class: "gf-tab-chip", type: "button", dataset: { group: "video" } }, "Vídeos");
        const tabImages = el("button", { class: "gf-tab-chip", type: "button", dataset: { group: "image" } }, "Fotos");
        const tabTexts = el("button", { class: "gf-tab-chip", type: "button", dataset: { group: "text" }, style: "display:none;" }, "Textos");
        [tabAll, tabVideos, tabImages, tabTexts].forEach(tab => {
            tab.addEventListener("click", () => {
                sbTabs.querySelectorAll(".gf-tab-chip").forEach(t => t.classList.remove("is-active"));
                tab.classList.add("is-active");
                plGroupFilter = tab.dataset.group;
                renderPlaylist();
            });
            sbTabs.appendChild(tab);
        });

        // Barra de Ordenação na Sidebar
        const sbSortBar = el("div", { class: "gf-sidebar-sort-bar" },
            el("span", null, "ORDEM:"),
            el("button", { class: "gf-sort-chip is-active", type: "button", onClick: (e) => {
                sbSortBar.querySelectorAll(".gf-sort-chip").forEach(c => c.classList.remove("is-active"));
                e.target.classList.add("is-active");
                plSortMode = "default";
                renderPlaylist();
            }}, "Padrão"),
            el("button", { class: "gf-sort-chip", type: "button", onClick: (e) => {
                sbSortBar.querySelectorAll(".gf-sort-chip").forEach(c => c.classList.remove("is-active"));
                e.target.classList.add("is-active");
                plSortMode = "name";
                renderPlaylist();
            }}, "A-Z")
        );

        // Lista de Cards da Playlist
        stSidebarList = el("div", { class: "gf-playlist-list" });

        sidebar.append(sbHeader, sbSearch, sbTabs, sbSortBar, stSidebarList);

        stage.append(stageMain, sidebar);
        (document.body || document.documentElement).appendChild(stage);

        document.addEventListener("keydown", e => {
            if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable)) return;
            if (e.key === "Escape" && stage.classList.contains("open")) closeStage();
            else if ((e.key === "p" || e.key === "P") && stage.classList.contains("open")) {
                e.preventDefault();
                toggleSidebar();
            } else if (e.shiftKey && (e.key === "N" || e.key === "n") && stage.classList.contains("open")) {
                e.preventDefault();
                navStage(1);
            } else if (e.shiftKey && (e.key === "P" || e.key === "p") && stage.classList.contains("open")) {
                e.preventDefault();
                navStage(-1);
            }
        });
    }

    function playableCards() {
        return Array.from(document.querySelectorAll(".gf-card")).filter(c => c._gf && c._gf.playable && !c.classList.contains("gf-filtered"));
    }

    function makePlaylistThumbPlaceholder(kind, ext) {
        const ph = el("div", { class: "gf-playlist-thumb-placeholder" });
        let ic = IC.image;
        if (kind === "video") ic = IC.video;
        else if (kind === "text") ic = IC.doc;
        else if (kind === "archive") ic = IC.archive;
        else if (kind === "audio") ic = IC.audio;
        else if (kind === "other") ic = IC.file;

        const iconSpan = el("span", { class: "gf-playlist-ph-icon" });
        iconSpan.innerHTML = ic;
        const badge = el("span", { class: "gf-playlist-ph-ext" }, (ext || kind || "FILE").toUpperCase().slice(0, 5));
        ph.append(iconSpan, badge);
        return ph;
    }

    function playlistCard(card, idx) {
        const d = card._gf || {};
        const isCurrent = card === stCur;
        const extMatch = (d.name || "").match(/\.([a-zA-Z0-9]{2,5})(?:\?|#|$)/);
        const ext = extMatch ? extMatch[1].toLowerCase() : "";

        const itemEl = el("div", {
            class: "gf-playlist-item" + (isCurrent ? " is-current" : ""),
            title: d.name
        });

        const thumbWrap = el("div", { class: "gf-playlist-thumb-wrap" });
        const isMedia = (d.kind === "video" || d.kind === "image") && !!d.thumb;
        if (isMedia) {
            const img = el("img", { class: "gf-playlist-thumb", src: d.thumb, alt: "", loading: "lazy" });
            img.onerror = () => {
                img.remove();
                if (!thumbWrap.querySelector(".gf-playlist-thumb-placeholder")) {
                    thumbWrap.prepend(makePlaylistThumbPlaceholder(d.kind, ext));
                }
            };
            thumbWrap.appendChild(img);
        } else {
            thumbWrap.appendChild(makePlaylistThumbPlaceholder(d.kind, ext));
        }

        const kindLabel = d.kind === "video" ? "Video" : d.kind === "image" ? "Imagem" : d.kind === "audio" ? "Audio" : "Arquivo";
        thumbWrap.appendChild(el("span", { class: "gf-playlist-kind" }, kindLabel));
        if (typeof idx === "number") thumbWrap.appendChild(el("span", { class: "gf-playlist-num" }, String(idx + 1)));
        if (d.kind === "video") {
            const durUrl = resolveDirectGofileUrl(d);
            const durKey = d.directUrl || d.name || "";
            const known = gfCachedDur(durKey);
            const durEl = el("span", { class: "gf-playlist-dur" }, known || "");
            durEl.dataset.durKey = durKey;
            durEl.hidden = !known;
            thumbWrap.appendChild(durEl);
            gfProbeDur(durKey, durUrl);
        }

        const info = el("div", { class: "gf-playlist-info" });
        info.append(el("span", { class: "gf-playlist-name" }, d.displayTitle || d.name));

        const datesBox = el("div", { class: "gf-playlist-dates" });
        if (d.uploadDate) {
            datesBox.append(el("div", { class: "gf-playlist-date-row", title: "Data de envio" },
                el("span", { class: "gf-playlist-date-val" }, d.uploadDate)
            ));
        }
        if (d.extractedDate && d.extractedDate.displayDate) {
            datesBox.append(el("div", { class: "gf-playlist-date-row", title: "Data extraída do nome do arquivo" },
                el("span", { class: "gf-playlist-date-val" }, d.extractedDate.displayDate)
            ));
        }
        if (datesBox.childNodes.length) info.append(datesBox);

        if (isCurrent) {
            const meta = el("div", { class: "gf-playlist-meta" });
            meta.append(el("span", { class: "gf-playlist-meta-active" }, d.kind === "video" ? "Reproduzindo agora" : "Visualizando agora"));
            info.append(meta);
        }

        itemEl.append(thumbWrap, info);
        itemEl.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); loadStageItem(card); });
        itemEl._card = card;
        return itemEl;
    }

    function renderPlaylist() {
        if (!stSidebarList) return;
        const allCards = playableCards();
        stSidebarList.textContent = "";

        const numVideos = allCards.filter(c => c._gf && c._gf.kind === "video").length;
        const numImages = allCards.filter(c => c._gf && c._gf.kind === "image").length;
        const numTexts = allCards.filter(c => c._gf && c._gf.kind === "text").length;

        // Atualiza contadores nas abas
        const tabs = stage.querySelectorAll(".gf-tab-chip");
        tabs.forEach(t => {
            const grp = t.dataset.group;
            if (grp === "all") t.textContent = `Todos (${allCards.length})`;
            else if (grp === "video") t.textContent = `Vídeos (${numVideos})`;
            else if (grp === "image") t.textContent = `Fotos (${numImages})`;
            else if (grp === "text") {
                t.textContent = `Textos (${numTexts})`;
                t.style.display = numTexts ? "inline-flex" : "none";
            }
        });

        if (stSbCount) stSbCount.textContent = `(${allCards.length})`;

        // Filtra por busca e por aba
        let filtered = allCards.filter(c => {
            const d = c._gf || {};
            if (plSearchQuery && (d.name || "").toLowerCase().indexOf(plSearchQuery) === -1) return false;
            if (plGroupFilter !== "all" && d.kind !== plGroupFilter) return false;
            return true;
        });

        // Ordenação
        if (plSortMode === "name") {
            filtered = filtered.slice().sort((a, b) => (a._gf?.name || "").localeCompare(b._gf?.name || "", undefined, { numeric: true, sensitivity: "base" }));
        }

        stage.classList.toggle("has-nav", allCards.length > 1);

        filtered.forEach((card, idx) => {
            stSidebarList.appendChild(playlistCard(card, idx));
        });

        const curItem = stSidebarList.querySelector(".is-current");
        if (curItem && window.innerWidth > 768) {
            setTimeout(() => {
                try { curItem.scrollIntoView({ block: "center", behavior: "smooth" }); } catch {}
            }, 80);
        }
    }

    function compactPtDate(text) {
        const raw = String(text || "").replace(/\s+/g, " ").trim();
        if (!raw) return "";
        const months = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };
        const m = raw.match(/(\d{1,2})\s+de\s+([a-zç]{3})\.?\s+de\s+(\d{4})(?:(?:,|\s)+(\d{1,2}:\d{2}))?/i);
        if (!m) return raw;
        const mo = months[m[2].slice(0, 3).toLowerCase()];
        if (!mo) return raw;
        const pad = n => String(n).padStart(2, "0");
        return pad(m[1]) + "/" + pad(mo) + "/" + m[3] + (m[4] ? " " + m[4] : "");
    }
    function readPosition() {
        try { const n = parseInt(new URL(location.href).searchParams.get("position") || "", 10); return Number.isFinite(n) && n > 0 ? n : 0; } catch { return 0; }
    }
    function writePosition(n) {
        try {
            const u = new URL(location.href);
            if (String(u.searchParams.get("position") || "") === String(n)) return;
            u.searchParams.set("position", String(n));
            history.replaceState(history.state, "", u.pathname + u.search + u.hash);
        } catch {}
    }
    function navStage(dir) {
        const cards = playableCards(); if (cards.length < 2) return;
        let i = cards.indexOf(stCur); if (i < 0) i = 0;
        const ni = (i + dir + cards.length) % cards.length;
        writePosition(ni + 1);
        loadStageItem(cards[ni]);
    }

    const IMAGE_SOURCE_ATTRS = ["data-src", "data-original", "data-url", "data-lazy-src", "data-original-src", "src"];
    const UI_IMAGE_RE = /\b(?:favicon|logo|icon|avatar|spinner|placeholder|loading|loader|sprite|transparent)\b/i;

    function imageSourceCandidates(img) {
        const out = [];
        const add = value => {
            if (!value || typeof value !== "string") return;
            const src = value.trim();
            if (src && src !== "about:blank" && !out.includes(src)) out.push(src);
        };
        IMAGE_SOURCE_ATTRS.forEach(attr => add(img.getAttribute(attr)));
        add(img.currentSrc);
        add(img.src);
        return out;
    }

    function decodedImageText(value) {
        try { return decodeURIComponent(String(value || "")); } catch (e) { return String(value || ""); }
    }

    function imageSourceLooksUsable(src) {
        return !!src && !/^(?:about:blank|javascript:)/i.test(src) && !UI_IMAGE_RE.test(decodedImageText(src));
    }

    function mediaImageSource(img) {
        return imageSourceCandidates(img).find(imageSourceLooksUsable) || "";
    }

    function isMediaImage(img, fileName = "") {
        if (!img || (stage && stage.contains(img))) return false;
        const src = mediaImageSource(img);
        if (!src) return false;
        const metadata = [img.alt, img.title, img.id, img.getAttribute("class"), img.getAttribute("aria-label")].join(" ");
        if (UI_IMAGE_RE.test(metadata)) return false;
        if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0 && img.naturalWidth <= 64 && img.naturalHeight <= 64) return false;
        return true;
    }

    function findNativeModalImage() {
        const modals = Array.from(document.querySelectorAll(".fixed, dialog, [role='dialog'], .media-viewer, #modal-root, body > div[class*='fixed']"));
        for (const m of modals) {
            if (stage && stage.contains(m)) continue;
            const imgs = Array.from(m.querySelectorAll("img")).filter(i => {
                const src = i.currentSrc || i.src || i.getAttribute("src") || "";
                return src && !/logo|icon|avatar|favicon/i.test(src);
            });
            if (imgs.length) return imgs[0];
        }
        return null;
    }

    function copyText(s) {
        try { return navigator.clipboard.writeText(s); } catch { /* clipboard blocked */ }
        try {
            const t = document.createElement("textarea");
            t.value = s;
            t.style.position = "fixed";
            t.style.opacity = "0";
            document.body.append(t);
            t.select();
            document.execCommand("copy");
            t.remove();
        } catch { /* fallback blocked */ }
        return Promise.resolve();
    }
    let gfToastT;
    function toast(msg) {
        let t = document.querySelector(".gf-toast");
        if (!t) {
            t = document.createElement("div");
            t.className = "gf-toast";
            t.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483000;background:#111;color:#fff;padding:8px 14px;border-radius:8px;font:600 13px/1 Inter,system-ui,sans-serif;opacity:0;transition:opacity .15s;pointer-events:none";
            document.body.append(t);
        }
        t.textContent = msg;
        t.style.opacity = "1";
        clearTimeout(gfToastT);
        gfToastT = setTimeout(() => { t.style.opacity = "0"; }, 1600);
    }
    function appendImageChrome(host, imgUrl) {
        const mkAct = (ic, label, cb) => {
            const b = el("button", { type: "button", class: "gf-plc-act", title: label, "aria-label": label });
            b.innerHTML = ic;
            b.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); cb(); });
            return b;
        };
        const prevBtn = mkAct(IC.prev, "Anterior", () => navStage(-1));
        const nextBtn = mkAct(IC.next, "Próximo", () => navStage(1));
        const reportBtn = mkAct(IC.flag, "Reportar", () => {
            const a = document.querySelector('a[href*="report"], a[href*="abuse"]');
            if (a && a.href) window.open(a.href, "_blank", "noopener");
            else toast("Sem página de denúncia neste site");
        });
        const dlb = mkAct(IC.download, "Baixar", () => {
            const d = stCur && stCur._gf;
            if (d && d.downloadBtn) d.downloadBtn.click();
            else if (imgUrl) window.open(imgUrl, "_blank", "noopener");
        });
        const shareBtn = mkAct(IC.share, "Compartilhar / Copiar link", () => {
            copyText(location.href).then(ok => {
                toast(ok ? "Link copiado!" : "Falha ao copiar link");
                if (ok) { shareBtn.innerHTML = IC.check; setTimeout(() => { shareBtn.innerHTML = IC.share; }, 1600); }
            });
        });
        const fsb = mkAct(IC.expand, "Tela cheia (f)", () => {
            try {
                const target = host;
                if (document.fullscreenElement) document.exitFullscreen();
                else target.requestFullscreen();
            } catch { /* fullscreen blocked */ }
        });
        const row = el("div", { class: "gf-plc-row" },
            el("div", { class: "gf-plc-left" }, prevBtn, nextBtn),
            el("div", { class: "gf-plc-right" }, reportBtn, dlb, shareBtn, fsb)
        );
        host.append(el("div", { class: "gf-plc-bottom" }, row));
    }

    let curAc = null;
    function mountPhotoZoom(mid, imgUrl, fallbackUrl) {
        const existingHost = mid.querySelector(".gf-img-host");
        if (existingHost) {
            const existingImg = existingHost.querySelector(".gf-image");
            if (existingImg && imgUrl && existingImg.src !== imgUrl) {
                if (fallbackUrl) {
                    existingImg.onerror = () => {
                        existingImg.onerror = null;
                        if (fallbackUrl && existingImg.src !== fallbackUrl) existingImg.src = fallbackUrl;
                    };
                }
                existingImg.src = imgUrl;
            }
            return;
        }

        const host = el("div", { class: "gf-img-host" });
        mid.appendChild(host);
        const newImg = el("img", { class: "gf-image", src: imgUrl || "", alt: "" });
        if (fallbackUrl) {
            newImg.onerror = () => {
                newImg.onerror = null;
                if (fallbackUrl && newImg.src !== fallbackUrl) newImg.src = fallbackUrl;
            };
        }
        host.appendChild(newImg);
        appendImageChrome(host, imgUrl);
        const ZOOMS = [1, 2, 4]; let zi = 0, z = 1, tx = 0, ty = 0;
        const clampPan = () => {
            const stageW = mid.clientWidth || window.innerWidth;
            const stageH = mid.clientHeight || (window.innerHeight - 80);
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

    async function mountTextViewer(mid, d) {
        const extMatch = (d.name || "").match(/\.([a-zA-Z0-9]{2,5})(?:\?|#|$)/);
        const ext = extMatch ? extMatch[1].toUpperCase() : "TXT";

        const host = el("div", { class: "gf-txt-stage-host" });
        host.innerHTML = `
            <div class="gf-txt-stage-card">
                <div class="gf-txt-stage-bar">
                    <div class="gf-txt-stage-info">
                        <span class="gf-txt-tag">${ext}</span>
                        <span class="gf-txt-meta" id="gfTxtMeta">Carregando conteúdo…</span>
                    </div>
                    <div class="gf-txt-stage-actions">
                        <a class="gf-txt-btn" id="gfDlTxtBtn" href="#" download target="_blank" style="display:none;">
                            ${IC.download}
                            <span>Baixar</span>
                        </a>
                        <button type="button" class="gf-txt-btn" id="gfCopyTxtBtn" disabled>
                            ${IC.copy}
                            <span>Copiar Texto</span>
                        </button>
                    </div>
                </div>
                <pre class="gf-txt-stage-content" id="gfTxtContent">Carregando conteúdo do arquivo…</pre>
            </div>
        `;
        mid.appendChild(host);

        const contentEl = host.querySelector("#gfTxtContent");
        const metaEl = host.querySelector("#gfTxtMeta");
        const copyBtn = host.querySelector("#gfCopyTxtBtn");
        const dlBtn = host.querySelector("#gfDlTxtBtn");

        let loadedTxt = "";

        if (d.downloadBtn) {
            dlBtn.style.display = "inline-flex";
            dlBtn.onclick = () => { d.downloadBtn.click(); };
        }

        if (d.previewBtn) {
            try { d.previewBtn.click(); } catch (e) {}
        }

        let tries = 0;
        const iv = setInterval(() => {
            const preEl = Array.from(document.querySelectorAll("pre, code, textarea")).find(p => !stage || !stage.contains(p));
            if (preEl && preEl.textContent) {
                clearInterval(iv);
                loadedTxt = preEl.textContent;
                contentEl.textContent = loadedTxt;
                const lines = loadedTxt.split("\n").length;
                metaEl.textContent = `${lines} linhas · ${loadedTxt.length} caracteres`;
                copyBtn.disabled = false;
            } else if (++tries > 25) {
                clearInterval(iv);
                if (!loadedTxt) {
                    contentEl.textContent = "Prévia de texto carregada. Use o botão Baixar acima para abrir ou salvar o arquivo completo.";
                    metaEl.textContent = "Texto pronto para download";
                }
            }
        }, 120);

        copyBtn.addEventListener("click", () => {
            if (loadedTxt) {
                try { navigator.clipboard.writeText(loadedTxt); } catch (e) {
                    const ta = document.createElement("textarea"); ta.value = loadedTxt; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
                }
                metaEl.textContent = "Copiado para a área de transferência!";
                setTimeout(() => {
                    const lines = loadedTxt.split("\n").length;
                    metaEl.textContent = `${lines} linhas · ${loadedTxt.length} caracteres`;
                }, 1500);
            }
        });
    }

    function loadStageItem(card) {
        if (curAc) { curAc.abort(); curAc = null; }
        stCur = card;
        const posCards = typeof playableCards === "function" ? playableCards() : [];
        const posIdx = posCards.indexOf(card);
        if (posIdx >= 0) writePosition(posIdx + 1);
        const d = card._gf || {};
        stName.textContent = d.name || "";
        stSize.textContent = d.size || "";
        if (stIcon) stIcon.innerHTML = kindIcon(d.kind);
        if (stTypeStat) {
            let typeLabel = "Arquivo";
            if (d.kind === "video") typeLabel = "Vídeo";
            else if (d.kind === "image") typeLabel = "Foto";
            else if (d.kind === "text") typeLabel = "Texto";
            stTypeStat.textContent = typeLabel;
        }
        if (typeof stDl !== "undefined" && stDl) {
            stDl.onclick = () => { if (d.downloadBtn) d.downloadBtn.click(); };
        }

        // Atualiza item ativo na sidebar e dá scroll suave
        if (stSidebarList) {
            Array.from(stSidebarList.children).forEach(ch => ch.classList.toggle("is-current", ch._card === card));
            const cur = stSidebarList.querySelector(".is-current");
            if (cur && window.innerWidth > 768) {
                try { cur.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {}
            }
        }

        // Limpa mídia anterior do stage
        stMid.querySelectorAll(".gf-host, .gf-img-host, .gf-txt-stage-host, .gf-spin, .gf-stage-msg, .item-mediaplayer, video, audio").forEach(e => {
            if (e.tagName === "VIDEO" || e.tagName === "AUDIO") { try { e.pause(); } catch (err) {} }
            e.remove();
        });

        // 1. Single File View: se o vídeo/imagem nativo já estiver no DOM
        if (d.isSingleFile) {
            const nativeVid = d.nativeVid || document.querySelector("#fm-file-preview video, #fm-root video");
            const nativeImg = d.nativeImg || (document.getElementById("fm-file-preview") ? document.getElementById("fm-file-preview").querySelector("img") : null);

            if (nativeVid) {
                const src = nativeVid.currentSrc || nativeVid.src || (nativeVid.querySelector("source") ? (nativeVid.querySelector("source").getAttribute("src") || nativeVid.querySelector("source").src) : "");
                if (src) {
                    try { nativeVid.pause(); } catch (e) {}
                    curAc = new AbortController();
                    const playerVid = document.createElement("video");
                    playerVid.className = "gf-video";
                    playerVid.src = src;
                    playerVid.addEventListener("loadedmetadata", () => {
                        const key = (stCur && stCur._gf && (stCur._gf.directUrl || stCur._gf.name)) || "";
                        if (key && Number.isFinite(playerVid.duration)) gfRememberDur(key, fmtT(playerVid.duration));
                    }, { once: true });
                    if (nativeVid.poster) playerVid.poster = nativeVid.poster;
                    playerVid.preload = "auto";
                    playerVid.playsInline = true;

                    playerVid.volume = prefs.volume ?? 1;
                    playerVid.muted = prefs.muted ?? false;
                    playerVid.addEventListener("volumechange", () => {
                        prefs.volume = playerVid.volume;
                        prefs.muted = playerVid.muted;
                        saveP();
                    }, { signal: curAc.signal });

                    const host = el("div", { class: "gf-host gf-pl" }, playerVid);
                    buildPlayerControls(host, playerVid, src, curAc);
                    stMid.appendChild(host);

                    const p = playerVid.play();
                    if (p && p.catch) p.catch(() => {});
                    return;
                }
            } else if (nativeImg) {
                mountPhotoZoom(stMid, mediaImageSource(nativeImg) || d.thumb);
                return;
            }
        }

        // 2. Se for IMAGEM: carrega a imagem em alta resolução diretamente
        if (d.kind === "image") {
            const direct = resolveDirectGofileUrl(d);
            const highRes = direct || d.mediaUrl || d.thumb || "";
            mountPhotoZoom(stMid, highRes, d.thumb);
            return;
        }

        // 3. Se for TEXTO: monta o leitor integrado
        if (d.kind === "text") {
            mountTextViewer(stMid, d);
            return;
        }

        // 4. Se for VÍDEO:
        const videoSrc = resolveDirectGofileUrl(d) || d.mediaUrl;
        if (videoSrc) {
            d.mediaUrl = videoSrc;
            curAc = new AbortController();
            const playerVid = document.createElement("video");
            playerVid.className = "gf-video";
            playerVid.src = videoSrc;
            if (d.thumb) playerVid.poster = d.thumb;
            playerVid.preload = "auto";
            playerVid.playsInline = true;
            playerVid.volume = prefs.volume ?? 1;
            playerVid.muted = prefs.muted ?? false;
            playerVid.addEventListener("volumechange", () => {
                prefs.volume = playerVid.volume;
                prefs.muted = playerVid.muted;
                saveP();
            }, { signal: curAc.signal });

            const host = el("div", { class: "gf-host gf-pl" }, playerVid);
            buildPlayerControls(host, playerVid, videoSrc, curAc);
            stMid.appendChild(host);

            const p = playerVid.play();
            if (p && p.catch) p.catch(() => {});
            return;
        }

        const spin = el("div", { class: "gf-spin", style: "width:42px; height:42px; border-radius:50%; border:3px solid rgba(255,255,255,0.2); border-top-color:#f5c400; animation:gf-spin .8s linear infinite;" });
        stMid.appendChild(spin);

        fireNativeClick(d.openBtn || d.previewBtn);

        let tries = 0;
        const iv = setInterval(() => {
            const nativeVid = Array.from(document.querySelectorAll("video")).find(v => !stage || !stage.contains(v));
            const src = nativeVid ? (nativeVid.currentSrc || nativeVid.src || (nativeVid.querySelector("source") ? (nativeVid.querySelector("source").getAttribute("src") || nativeVid.querySelector("source").src) : "")) : "";

            if (src) {
                clearInterval(iv);
                spin.remove();
                d.mediaUrl = src;

                curAc = new AbortController();
                const playerVid = document.createElement("video");
                playerVid.className = "gf-video";
                playerVid.src = src;
                playerVid.addEventListener("loadedmetadata", () => {
                    const key = d.directUrl || d.name || "";
                    if (key && Number.isFinite(playerVid.duration)) gfRememberDur(key, fmtT(playerVid.duration));
                }, { once: true });
                if ((nativeVid && nativeVid.poster) || d.thumb) playerVid.poster = (nativeVid && nativeVid.poster) || d.thumb;
                playerVid.preload = "auto";
                playerVid.playsInline = true;
                playerVid.volume = prefs.volume ?? 1;
                playerVid.muted = prefs.muted ?? false;
                playerVid.addEventListener("volumechange", () => {
                    prefs.volume = playerVid.volume;
                    prefs.muted = playerVid.muted;
                    saveP();
                }, { signal: curAc.signal });

                const host = el("div", { class: "gf-host gf-pl" }, playerVid);
                buildPlayerControls(host, playerVid, src, curAc);
                stMid.appendChild(host);

                const p = playerVid.play();
                if (p && p.catch) p.catch(() => {});

                try { if (nativeVid) nativeVid.pause(); } catch (e) {}
                const closeBtn = document.querySelector('[data-dialog] [data-close], [role="dialog"] [data-close], [data-dialog] button[aria-label*="Close" i]');
                if (closeBtn) closeBtn.click();
            } else if (++tries > 60) {
                clearInterval(iv);
                spin.remove();
                stMid.appendChild(el("div", { class: "gf-stage-msg", style: "color:rgba(255,255,255,0.6); font-size:14px;" }, "Não foi possível carregar o vídeo. Tente clicar no botão de Download."));
            }
        }, 80);
    }

    function openStage(card) {
        buildStage();
        stCur = card;
        stage.classList.add("open");
        document.documentElement.classList.add("gf-has-stage");
        renderPlaylist();
        const cards = playableCards();
        const p = readPosition();
        loadStageItem((p && cards[p - 1]) || card);
    }

    function closeStage() {
        if (!stage) return;
        if (curAc) { curAc.abort(); curAc = null; }
        stMid.querySelectorAll("video, audio").forEach(v => {
            try { v.pause(); v.muted = true; } catch (err) {}
            v.remove();
        });
        stMid.innerHTML = "";

        // Fecha qualquer modal nativo do GoFile via clique
        document.querySelectorAll("dialog[open], [data-action='close'], [data-action='back'], #modal-close, button[aria-label*='Close' i], [class*='fixed'] button[aria-label*='close' i]").forEach(b => {
            try { b.click(); } catch (e) {}
        });

        // Dispara Escape nativo no window e document
        try {
            const escEv = new KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, which: 27, bubbles: true, cancelable: true });
            document.dispatchEvent(escEv);
            window.dispatchEvent(escEv);
        } catch (e) {}

        // Remove quaisquer modais/backdrops nativos residuais
        document.querySelectorAll("dialog[open], [role='dialog'], #modal-root > div, body > div.fixed.inset-0:not(#sidebar-overlay):not(.gf-stage):not(.gf-bulk)").forEach(m => {
            try { m.remove(); } catch (e) {}
        });

        stage.classList.remove("open");
        document.documentElement.classList.remove("gf-has-stage");
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
        stCur = null;

        requestAnimationFrame(() => {
            buildStage();
            scan();
            if (isGroupByType) groupGalleryByType(true);
        });
    }

    /* ===================== AGRUPAMENTO POR TIPO NA GALERIA ===================== */
    let isGroupByType = localStorage.getItem("gf_group_by_type") === "1";

    function groupGalleryByType(enable, persist) {
        isGroupByType = enable;
        if (persist) { try { localStorage.setItem("gf_group_by_type", enable ? "1" : "0"); } catch (e) {} }

        const grid = document.querySelector("#fm-list > div, #fm-list [role='list'], #filemanager_itemslist, [role='list'][aria-label*='Folder' i]");
        if (!grid) return;

        const items = Array.from(grid.querySelectorAll(".gf-card"));
        if (!items.length) {
            grid.querySelectorAll(".gf-gallery-group-header").forEach(h => h.remove());
            return;
        }

        if (!enable) {
            grid.querySelectorAll(".gf-gallery-group-header").forEach(h => h.remove());
            items.sort((a, b) => (+a.dataset.gfOrigIdx || 0) - (+b.dataset.gfOrigIdx || 0));
            items.forEach(it => grid.appendChild(it));
            return;
        }

        // Salva índice original se ainda não tiver
        items.forEach((it, i) => {
            if (!it.dataset.gfOrigIdx) it.dataset.gfOrigIdx = String(i);
        });

        const groups = {
            video: [],
            image: [],
            other: []
        };

        items.forEach(it => {
            const k = it._gf ? it._gf.kind : "other";
            if (k === "video") groups.video.push(it);
            else if (k === "image") groups.image.push(it);
            else groups.other.push(it);
        });

        const defs = [
            { key: "video", title: "Vídeos", icon: IC.video, list: groups.video },
            { key: "image", title: "Fotos", icon: IC.image, list: groups.image },
            { key: "other", title: "Documentos & Outros", icon: IC.file, list: groups.other },
        ];

        // Só reordena quando chegaram cards novos ou a ordem atual difere da agrupada:
        // reanexar tudo a cada scan gera mutações que disparam o observer de novo.
        const want = [];
        defs.forEach(def => {
            if (!def.list.length) return;
            want.push(def.key + ":" + def.list.length);
            def.list.forEach(it => want.push(it));
        });
        const have = Array.from(grid.children).filter(c => c.classList.contains("gf-card") || c.classList.contains("gf-gallery-group-header"));
        const inOrder = have.length === want.length && have.every((c, i) => typeof want[i] === "string" ? c.dataset.gfGroup === want[i] : c === want[i]);
        if (inOrder) return;

        grid.querySelectorAll(".gf-gallery-group-header").forEach(h => h.remove());
        defs.forEach(def => {
            if (!def.list.length) return;
            const hdr = el("div", { class: "gf-gallery-group-header" },
                el("div", { class: "gf-gallery-group-title" },
                    el("span", { html: def.icon }),
                    el("span", null, def.title)
                ),
                el("span", { class: "gf-gallery-group-count" }, `${def.list.length} ${def.list.length === 1 ? "item" : "itens"}`)
            );
            hdr.dataset.gfGroup = def.key + ":" + def.list.length;
            grid.appendChild(hdr);
            def.list.forEach(it => grid.appendChild(it));
        });
    }

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

    /* ===================== PROCESSAMENTO DE CARDS ===================== */
    const SIZE_RE = /\b\d+(?:\.\d+)?\s?(?:B|KB|MB|GB|TB)\b/i;

    function resolveDirectGofileUrl(d) {
        if (!d) return "";
        if (d.directUrl) return d.directUrl;
        const name = d.name;
        const thumb = d.thumb;
        if (thumb && name) {
            const m = thumb.match(/^(https?:\/\/[^\/]+\/download\/web\/[^\/]+\/)/i);
            if (m) {
                const url = m[1] + encodeURIComponent(name);
                d.directUrl = url;
                return url;
            }
        }
        return "";
    }

    function extractGofileItemData(it) {
        let cleanName = "";
        const nameP = it.querySelector('[data-action="open-file"] p.truncate, [data-action="open-file"] p, p.truncate');
        if (nameP) {
            cleanName = (nameP.textContent || "").trim();
        }
        if (!cleanName) {
            const titleAttrEl = it.querySelector("[title]");
            if (titleAttrEl && titleAttrEl.getAttribute("title")) {
                const t = titleAttrEl.getAttribute("title").trim();
                if (/\.[a-zA-Z0-9]{2,5}$/i.test(t)) cleanName = t;
            }
        }
        if (!cleanName) {
            const leaves = it.querySelectorAll("p, span, a");
            for (const el of leaves) {
                if (el.children.length === 0) {
                    const txt = (el.textContent || "").trim();
                    if (/\.[a-zA-Z0-9]{2,5}$/i.test(txt) && !SIZE_RE.test(txt)) {
                        cleanName = txt;
                        break;
                    }
                }
            }
        }
        if (!cleanName) {
            const nameEl = it.querySelector("a.item_open, .item-name, [data-action='open-file']");
            const raw = nameEl ? (nameEl.textContent || "").trim() : "";
            cleanName = raw.replace(/\s*\d+(?:\.\d+)?\s*(?:B|KB|MB|GB|TB).*$/i, "").trim();
        }

        let uploadDate = "";
        const calEl = it.querySelector('[data-lucide="calendar"], .lucide-calendar');
        if (calEl) {
            const calWrap = calEl.closest("span, p, div");
            if (calWrap) uploadDate = (calWrap.textContent || "").trim();
        }
        if (!uploadDate) {
            const dateCandidates = Array.from(it.querySelectorAll("span, p"))
                .filter(e => e.children.length === 0)
                .map(e => (e.textContent || "").trim());
            uploadDate = dateCandidates.find(t => /\b\d{1,2}\s+de\s+[a-z]{3}\.|\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/i.test(t)) || "";
        }
        uploadDate = compactPtDate(uploadDate);

        let sizeText = "";
        const sizeCandidates = Array.from(it.querySelectorAll("span, p"))
            .filter(e => e.children.length === 0)
            .map(e => (e.textContent || "").trim());
        sizeText = sizeCandidates.find(t => SIZE_RE.test(t) && t !== cleanName) || "";

        const extractedDate = extractDateFromTitle(cleanName);
        const displayTitle = cleanTitleWithoutDate(cleanName, extractedDate);

        return {
            cleanName,
            displayTitle,
            sizeText,
            uploadDate,
            extractedDate
        };
    }

    function processItem(it) {
        if (it.dataset.gfDone) return;

        const data = extractGofileItemData(it);
        const name = data.cleanName;
        if (!name) return;

        it.dataset.gfDone = "1";
        it.classList.add("gf-card");

        const sizeText = data.sizeText;
        const img = Array.from(it.querySelectorAll("img")).find(candidate => isMediaImage(candidate, name));
        const thumbSrc = img ? mediaImageSource(img) : "";
        let isVid = /\.(mp4|m4v|mov|webm|mkv|avi|ts|flv|wmv|m4p)$/i.test(name) || !!it.querySelector('[data-lucide="file-video"], .lucide-file-video, .fa-video, .item_play');
        let isImg = /\.(jpe?g|png|gif|webp|avif|bmp|svg|tiff?)$/i.test(name) || !!it.querySelector('[data-lucide="file-image"], .lucide-file-image, .fa-image');
        const isTxt = /\.(txt|md|nfo|log|json|csv)$/i.test(name) || !!it.querySelector('[data-lucide="file-text"], .lucide-file-text');
        const isArchive = /\.(zip|rar|7z|tar|gz|bz2)$/i.test(name);
        const isAudio = /\.(mp3|wav|flac|m4a|ogg|aac|opus)$/i.test(name);

        if (!isVid && !isTxt && !isArchive && !isAudio && (isImg || thumbSrc)) {
            isImg = true;
        }

        let kind = "other";
        if (isVid) kind = "video";
        else if (isImg) kind = "image";
        else if (isTxt) kind = "text";
        else if (isArchive) kind = "archive";
        else if (isAudio) kind = "audio";

        const playable = isVid || isImg || isTxt;

        const openBtn = it.querySelector("[data-action='open-file'], a.item_open");
        const previewBtn = it.querySelector("[data-action='preview'], .item_play");
        const downloadBtn = it.querySelector("[data-action='download'], .item_download");
        const selectBtn = it.querySelector("[data-action='toggle-select'], .item_checkbox");

        it._gf = {
            name,
            displayTitle: data.displayTitle,
            size: sizeText,
            uploadDate: data.uploadDate,
            extractedDate: data.extractedDate,
            thumb: thumbSrc,
            kind,
            playable,
            openBtn,
            previewBtn,
            downloadBtn,
            selectBtn
        };
        resolveDirectGofileUrl(it._gf);

        // Constrói o DOM do Card
        const media = el("div", { class: "gf-media" });
        if (thumbSrc) {
            const mImg = el("img", { src: thumbSrc, alt: "", loading: "lazy" });
            mImg.onerror = () => {
                mImg.remove();
                if (!media.querySelector(".gf-media-ic")) {
                    const icWrap = el("span", { class: "gf-media-ic" });
                    icWrap.insertAdjacentHTML("beforeend", kindIcon(kind));
                    media.appendChild(icWrap);
                }
            };
            media.appendChild(mImg);
        } else {
            const icWrap = el("span", { class: "gf-media-ic" });
            icWrap.insertAdjacentHTML("beforeend", kindIcon(kind));
            media.appendChild(icWrap);
        }

        if (sizeText) {
            media.appendChild(el("span", { class: "gf-card-size-badge" }, sizeText));
        }

        if (isVid) {
            const playOv = el("div", { class: "gf-media-play" });
            const sp = el("span"); sp.insertAdjacentHTML("beforeend", IC.play);
            playOv.appendChild(sp);
            media.appendChild(playOv);
        }

        // Checkbox de multiselect
        const checkEl = el("div", { class: "gf-card-select" });
        checkEl.insertAdjacentHTML("beforeend", IC.check);
        checkEl.addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();
            const nowSelected = !it.classList.contains("is-selected");
            it.classList.toggle("is-selected", nowSelected);
            checkEl.classList.toggle("is-selected", nowSelected);
            if (selectBtn) {
                try { selectBtn.click(); } catch (err) {}
            }
            updateBulk();
        });

        // Informações e datas no corpo do card
        const body = el("div", { class: "gf-card-body" },
            el("div", { class: "gf-card-name", title: name }, data.displayTitle)
        );

        const datesBox = el("div", { class: "gf-card-dates" });
        if (data.uploadDate) {
            datesBox.append(el("div", { class: "gf-card-date-row" },
                el("span", { class: "gf-card-date-lbl" }, "Data de envio:"),
                el("span", null, data.uploadDate)
            ));
        }
        if (data.extractedDate && data.extractedDate.displayDate) {
            datesBox.append(el("div", { class: "gf-card-date-row" },
                el("span", { class: "gf-card-date-lbl", title: "Data identificada e extraída do nome do arquivo (definida no upload)" }, "Data extraída:"),
                el("span", null, data.extractedDate.displayDate),
                el("span", { class: "gf-tip-icon", title: "Data identificada e extraída do nome do arquivo (definida no upload)" }, "ⓘ")
            ));
        }
        if (datesBox.childNodes.length) body.appendChild(datesBox);

        it.append(media, checkEl, body);

        // Intercepta clique no card inteiro
        it.addEventListener("click", e => {
            if (e.target.closest(".gf-card-select")) return;
            e.preventDefault();
            e.stopPropagation();
            if (playable) openStage(it);
            else if (openBtn) openBtn.click();
        }, true);
    }

    let autoExpandedUrl = null;
    let autoExpandTimer = null;

    function getSingleFileCard() {
        const previewSection = document.getElementById("fm-file-preview");
        const vid = previewSection ? previewSection.querySelector("video") : document.querySelector("#fm-root video, #page video");
        const img = previewSection ? previewSection.querySelector("img") : null;
        const fileSection = document.querySelector("#fm-root .max-w-3xl section.panel, #fm-root section.panel");
        if (!fileSection && !previewSection && !vid && !img) return null;

        const h1 = (fileSection && fileSection.querySelector("h1")) || document.querySelector("#header-title");
        const name = (h1 ? h1.textContent : document.title).replace(/\s*·\s*Gofile.*$/i, "").trim();
        if (!name) return null;

        const sizeText = Array.from(document.querySelectorAll("#fm-root p, #fm-root span"))
            .map(e => (e.textContent || "").trim())
            .find(t => SIZE_RE.test(t)) || "";

        const downloadBtn = document.querySelector("#fm-root button[data-action='download']");
        const previewBtn = document.querySelector("#fm-root button[data-action='preview']");
        const isVid = !!vid || /\.(mp4|m4v|mov|webm|mkv|avi|ts|flv)$/i.test(name);
        const isImg = !!img || /\.(jpe?g|png|gif|webp|avif|bmp|svg)$/i.test(name);
        const isTxt = /\.(txt|md|nfo|log|json|csv)$/i.test(name);
        let kind = "other";
        if (isVid) kind = "video";
        else if (isImg) kind = "image";
        else if (isTxt) kind = "text";

        const thumb = vid ? (vid.getAttribute("poster") || "") : (img ? (img.getAttribute("src") || img.src) : "");

        const card = fileSection || previewSection || document.getElementById("fm-root");
        card._gf = {
            name,
            size: sizeText,
            thumb,
            kind,
            playable: isVid || isImg || isTxt,
            downloadBtn,
            previewBtn,
            openBtn: previewBtn,
            nativeVid: vid,
            nativeImg: img,
            isSingleFile: true
        };

        if (fileSection && !fileSection.querySelector(".gf-open-stage-btn")) {
            const acts = fileSection.querySelector(".mt-5, [class*='gap-2']");
            if (acts) {
                const btn = el("button", {
                    type: "button",
                    class: "btn-primary gf-open-stage-btn w-full sm:w-auto",
                    style: "background:#f5c400!important; border-color:#f5c400!important; color:#1a1400!important; font-weight:700!important;"
                });
                btn.insertAdjacentHTML("beforeend", IC.play + " <span style='margin-left:6px'>Assistir no Player (Theater)</span>");
                btn.addEventListener("click", e => {
                    e.preventDefault();
                    e.stopPropagation();
                    openStage(card);
                });
                acts.prepend(btn);
            }
        }

        if (previewSection && !previewSection.dataset.gfClickBound) {
            previewSection.dataset.gfClickBound = "1";
            previewSection.addEventListener("click", e => {
                e.preventDefault();
                e.stopPropagation();
                openStage(card);
            });
        }

        return card;
    }

    function checkAutoExpandSingleItem() {
        if (autoExpandedUrl === location.href) return;
        const allCards = Array.from(document.querySelectorAll(".gf-card")).filter(c => c._gf);
        let targetCard = null;

        if (allCards.length === 1) {
            targetCard = allCards[0];
        } else if (allCards.length === 0) {
            targetCard = getSingleFileCard();
        } else {
            autoExpandedUrl = location.href;
            if (autoExpandTimer) { clearTimeout(autoExpandTimer); autoExpandTimer = null; }
            return;
        }

        if (targetCard && targetCard._gf && targetCard._gf.playable) {
            if (autoExpandTimer) clearTimeout(autoExpandTimer);
            autoExpandTimer = setTimeout(() => {
                autoExpandTimer = null;
                if (autoExpandedUrl !== location.href) {
                    autoExpandedUrl = location.href;
                    buildStage();
                    if (!stage || !stage.classList.contains("open")) {
                        openStage(targetCard);
                    }
                }
            }, 80);
        }
    }

    function scan() {
        const rows = document.querySelectorAll(".fm-row:not([data-gf-done]), #filemanager_itemslist > [data-item-id]:not([data-gf-done]), [data-type='file']:not([data-gf-done]), [role='list'][aria-label*='Folder' i] > [data-id]:not([data-gf-done])");
        rows.forEach(processItem);
        injectFolderActions();
        checkAutoExpandSingleItem();
        if (isGroupByType) groupGalleryByType(true);
    }

    /* ===================== MULTISELECT: BARRA FLUTUANTE ===================== */
    let bulkBar, bulkCount;
    function selectedCards() {
        return Array.from(document.querySelectorAll(".gf-card.is-selected"));
    }
    function bulkDownload() {
        selectedCards().forEach((card, i) => {
            const b = card._gf && card._gf.downloadBtn;
            if (b) setTimeout(() => { try { b.click(); } catch (e) {} }, i * 450);
        });
    }
    function ensureBulkBar() {
        if (bulkBar) return;
        bulkBar = el("div", { class: "gf-bulk" });
        bulkCount = el("span", { class: "gf-bulk-count" }, "0 selecionados");
        const dl = vbtn(IC.download, "Baixar selecionados", { class: "gf-item is-primary", onClick: bulkDownload });
        const clear = vbtn(IC.close, "Limpar", { onClick: () => {
            selectedCards().forEach(c => {
                c.classList.remove("is-selected");
                const sel = c.querySelector(".gf-card-select");
                if (sel) sel.classList.remove("is-selected");
            });
            updateBulk();
        }});
        bulkBar.append(bulkCount, el("div", { class: "gf-spacer" }), dl, clear);
        (document.body || document.documentElement).appendChild(bulkBar);
    }
    function updateBulk() {
        ensureBulkBar();
        const n = selectedCards().length;
        bulkCount.textContent = n + (n === 1 ? " selecionado" : " selecionados");
        bulkBar.classList.toggle("open", n > 0);
    }

    /* ===================== TOPBAR BUSCA & FERRAMENTAS ===================== */
    function applyFilter(q) {
        q = (q || "").toLowerCase().trim();
        document.querySelectorAll(".gf-card").forEach(c => {
            const n = (c._gf && c._gf.name || "").toLowerCase();
            c.classList.toggle("gf-filtered", !!q && n.indexOf(q) === -1);
        });
        if (stage && stage.classList.contains("open")) renderPlaylist();
    }

    function injectFolderActions() {
        // Remove qualquer botão antigo da topbar global
        document.querySelectorAll("#app-header .gf-group-btn, #index_header .gf-group-btn").forEach(b => b.remove());

        const toolbar = document.querySelector("#fm-toolbar .flex.items-center, #fm-toolbar");
        if (!toolbar || toolbar.querySelector(".gf-group-btn")) return;

        const btn = el("button", {
            class: "gf-folder-btn gf-group-btn" + (isGroupByType ? " is-active" : ""),
            type: "button",
            title: "Agrupar arquivos por tipo (Vídeos, Fotos, etc.)",
            onClick: () => {
                groupGalleryByType(!isGroupByType, true);
                btn.classList.toggle("is-active", isGroupByType);
                const lbl = btn.querySelector("span");
                if (lbl) lbl.textContent = isGroupByType ? "Desagrupar" : "Agrupar por Tipo";
            }
        });
        btn.insertAdjacentHTML("beforeend", IC.group);
        btn.append(el("span", null, isGroupByType ? "Desagrupar" : "Agrupar por Tipo"));

        const searchBtn = toolbar.querySelector("[data-action='search'], [data-action='toggle-filter']");
        if (searchBtn) {
            toolbar.insertBefore(btn, searchBtn);
        } else {
            toolbar.appendChild(btn);
        }
    }

    function buildTopbar() {
        const header = document.getElementById("app-header") || document.getElementById("index_header");
        if (!header || header.dataset.gfTop) return;
        header.dataset.gfTop = "1";

        const brand = el("a", { class: "gf-brand", href: "https://gofile.io/" },
            el("img", { src: "https://gofile.io/assets/img/logo-small-70.png", alt: "Gofile" }),
            el("span", null, "Gofile")
        );

        const search = el("div", { class: "gf-topsearch" });
        const inp = el("input", { type: "text", placeholder: "Buscar nesta pasta…", autocomplete: "off", spellcheck: "false" });
        inp.addEventListener("input", () => applyFilter(inp.value));
        search.appendChild(inp);

        header.prepend(search);
        header.prepend(brand);
    }

    /* ===================== OBSERVER & SPA ===================== */
    let scanQueued = false;
    function requestScan() {
        if (scanQueued) return;
        scanQueued = true;
        requestAnimationFrame(() => {
            scanQueued = false;
            buildTopbar();
            scan();
        });
    }

    // Observa só o container do app (não o <html> inteiro) e ignora mutações
    // causadas pelos próprios nós do script (stage, barra, cabeçalhos de grupo).
    // Um card já processado que continua no documento só foi movido pelo agrupamento.
    const isOwnNode = n => n.nodeType !== 1 || (n.classList && (n.classList.contains("gf-gallery-group-header") || (n.classList.contains("gf-card") && !!n._gf && n.isConnected)));
    const isOwnRecord = r => {
        if ((stage && stage.contains(r.target)) || (bulkBar && bulkBar.contains(r.target))) return true;
        if (!r.addedNodes.length && !r.removedNodes.length) return false;
        for (const n of r.addedNodes) if (!isOwnNode(n)) return false;
        for (const n of r.removedNodes) if (!isOwnNode(n)) return false;
        return true;
    };
    let rootObserver = null, observedRoot = null;
    function appRoot() {
        return document.getElementById("app") || document.getElementById("index_app") || document.body;
    }
    function observeRoot() {
        try {
            const rootTarget = appRoot();
            if (!rootTarget || (rootTarget === observedRoot && rootTarget.isConnected)) return;
            if (rootObserver) rootObserver.disconnect();
            observedRoot = rootTarget;
            rootObserver = new MutationObserver(recs => {
                for (const r of recs) {
                    if (isOwnRecord(r)) continue;
                    requestScan();
                    return;
                }
            });
            rootObserver.observe(rootTarget, { childList: true, subtree: true });
        } catch (e) {}
    }

    function routeKey(href) {
        try { const u = new URL(href); u.searchParams.delete("position"); return u.pathname + u.search + u.hash; } catch { return href; }
    }
    let lastHref = routeKey(location.href);
    function onRoute() {
        const key = routeKey(location.href);
        if (key === lastHref) return;
        lastHref = key;
        autoExpandedUrl = null;
        if (autoExpandTimer) { clearTimeout(autoExpandTimer); autoExpandTimer = null; }
        closeStage();
        observeRoot();
        requestScan();
    }
    window.addEventListener("popstate", onRoute);
    window.addEventListener("hashchange", onRoute);
    setInterval(onRoute, 700);

    function start() {
        buildTopbar();
        observeRoot();
        scan();
    }

    function onReady(fn) {
        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
        else fn();
    }
    onReady(() => {
        start();
        let n = 0;
        const id = setInterval(() => {
            observeRoot();
            buildTopbar();
            scan();
            if (++n > 30) clearInterval(id);
        }, 300);
    });
})();
