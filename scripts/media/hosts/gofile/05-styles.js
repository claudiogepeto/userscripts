
(function () {
    "use strict";
    if (window.top !== window.self) return;

    document.documentElement.classList.add("gf");
    const ACCENT = "#f5c400";

    // Não chamar de CSS: a const sombrearia window.CSS e quebraria CSS.escape.
    const GF_CSS = `
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
        html.gf .gf-card { content-visibility: auto; contain-intrinsic-block-size: auto 319px; }
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
        /* Itens fora da tela não são renderizados (o item atual fica sempre renderizado). */
        .gf-playlist-item:not(.is-current) { content-visibility: auto; flex-shrink: 0; contain-intrinsic-block-size: auto 99px; }
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

    addCSS(GF_CSS);

    const keepRoot = () => { if (!document.documentElement.classList.contains("gf")) document.documentElement.classList.add("gf"); };
    try { new MutationObserver(keepRoot).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] }); } catch (e) {}
