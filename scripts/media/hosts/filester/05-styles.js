
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

        /* Logo do filester na topbar do stage (marca própria, sem o selo do bunkr) */
        .fl-logo-img { height: 22px; width: 22px; display: block; flex: 0 0 22px; }
        .fl-logo-img svg { width: 22px; height: 22px; display: block; }
        .fl-logo-text { font: 800 15px/1 Inter, system-ui, sans-serif; letter-spacing: -0.03em; color: #fff; }

        .fl-playlist-placeholder { width: 100%; height: 100%; background: #060912; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
        .fl-playlist-ph-icon svg { width: 22px; height: 22px; color: ${ACCENT}; opacity: .75; }
        .fl-playlist-ph-ext { font: 800 9px Inter; letter-spacing: .06em; color: rgba(255,255,255,.5); background: rgba(255,255,255,.08); padding: 1px 5px; border-radius: 3px; }
        .fl-playlist-empty { padding: 32px 16px; text-align: center; color: rgba(255,255,255,.5); font-size: 13px; }
        /* Datas em texto simples na playlist e galeria */
        .fl-card-dates { display: flex; flex-direction: column; gap: 2px; margin-top: 3px; font-size: 11px; color: rgba(255,255,255,.5); }
        .fl-card-dates { min-width: 0; }
        .fl-card-date-row { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 12px; line-height: 1.3; white-space: nowrap; overflow: hidden; }
        .fl-card-date-lbl { flex: 0 0 auto; white-space: nowrap; }
        .fl-card-date-val { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .fl-card-date-lbl { color: rgba(255,255,255,.55); font-weight: 600; font-size: 11.5px; }
        .fl-card-date-val { color: rgba(255,255,255,.9); font-weight: 600; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; }

        html.fl-album .files-list.grid-view { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)) !important; gap: 32px 24px !important; }
        @media (min-width: 1600px) { html.fl-album .files-list.grid-view { grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)) !important; gap: 36px 28px !important; } }
        @media (max-width: 768px) { html.fl-album .files-list.grid-view { grid-template-columns: 1fr !important; gap: 20px 16px !important; } }
        html.fl-album .file-item { border-radius: 14px !important; background: transparent !important; }
        html.fl-album .file-item img { width: 100% !important; aspect-ratio: 16 / 9 !important; object-fit: cover !important; border-radius: 14px !important; }

        html.fl-album .files-list.grid-view.is-full-names .file-name { white-space: normal !important; overflow: visible !important; text-overflow: clip !important; -webkit-line-clamp: unset !important; display: block !important; word-break: break-all; }
        .fl-gallery-actionbar, .fl-gallery-actionbar input, .fl-gallery-actionbar button { font-family: Inter, system-ui, sans-serif; box-sizing: border-box; }
        .fl-gallery-actionbar { margin: 12px 0 16px; }
        /* Toast */
        .fl-toast { position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%) translateY(12px); z-index: 100001; padding: 10px 18px; border-radius: 20px; background: #14161a; border: 1px solid ${ACCENT}66; color: #fff; font: 13px Inter, system-ui, sans-serif; box-shadow: 0 6px 22px rgba(0,0,0,.6); opacity: 0; pointer-events: none; transition: opacity .2s, transform .2s; }
        .fl-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

        
${mediaComponentCSS(mediaTheme()).player}
${mediaComponentCSS(mediaTheme()).actionbar}
${mediaComponentCSS(mediaTheme()).dates}
${mediaComponentCSS(mediaTheme()).textStage}
    `;

    addCSS(CSS);

    const keepRoot = () => { const c = document.documentElement.classList; if (!c.contains("fl")) c.add("fl"); if (isFile && !c.contains("fl-file")) c.add("fl-file"); if (isAlbum && !c.contains("fl-album")) c.add("fl-album"); };
    try { new MutationObserver(keepRoot).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] }); } catch (e) {}
