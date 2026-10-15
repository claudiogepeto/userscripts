
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
        .tb-playlist-placeholder { width: 100%; height: 100%; background: #0a0505; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
        .tb-playlist-ph-icon svg { width: 22px; height: 22px; color: var(--tb-accent, #f97316); opacity: .75; }
        .tb-playlist-ph-ext { font: 800 9px Inter; letter-spacing: .06em; color: rgba(255,255,255,.5); background: rgba(255,255,255,.08); padding: 1px 5px; border-radius: 3px; }
        .tb-playlist-empty { padding: 32px 16px; text-align: center; color: rgba(255,255,255,.5); font-size: 13px; }
        /* ===================== ÁLBUM (/a/): TABELA → GRADE AMOLED ===================== */
        html.tb-album .max-w-6xl { max-width: min(100% - 32px, 1800px) !important; }
        html.tb-album #searchInput, html.tb-album #sortSelect { display: none !important; }
        html.tb-album #btnDownloadAlbum { background: var(--tb-accent, #f97316) !important; border-color: var(--tb-accent, #f97316) !important; color: #1c0a00 !important; }
        html.tb-album .thumb img { width: 100% !important; height: 100% !important; object-fit: cover !important; background: #000 !important; }
        html.tb-album .thumb:has(img)::after { display: none !important; }
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
        .tb-gallery-actionbar, .tb-gallery-actionbar input, .tb-gallery-actionbar button { font-family: Inter, system-ui, sans-serif; box-sizing: border-box; }
        .tb-grid.is-full-names .tb-card-name { display: block; -webkit-line-clamp: unset; overflow: visible; word-break: break-all; }
        .tb-card-dates { display: flex; flex-direction: column; gap: 2px; margin-top: 3px; font-size: 11px; color: rgba(255,255,255,.5); }
        .tb-card-dates { min-width: 0; }
        .tb-card-date-row { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 12px; line-height: 1.3; white-space: nowrap; overflow: hidden; }
        .tb-card-date-lbl { flex: 0 0 auto; white-space: nowrap; }
        .tb-card-date-val { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tb-card-date-lbl { color: rgba(255,255,255,.55); font-weight: 600; font-size: 11.5px; }
        .tb-card-date-val { color: rgba(255,255,255,.9); font-weight: 600; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; }
        /* Toast */
        .tb-toast { position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%) translateY(12px); z-index: 100001; padding: 10px 18px; border-radius: 20px; background: #14161a; border: 1px solid rgba(249,115,22,0.4); color: #fff; font: 13px Inter, system-ui, sans-serif; box-shadow: 0 6px 22px rgba(0,0,0,.6); opacity: 0; pointer-events: none; transition: opacity .2s, transform .2s; }
        .tb-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

        /* Logo do turbo na topbar do stage (imagem própria, sem o selo do bunkr) */
        .tb-logo-img { height: 22px; width: 22px; display: block; object-fit: contain; }
        .tb-logo-text { font: 800 15px/1 Inter, system-ui, sans-serif; letter-spacing: -0.03em; color: #fff; }
        
${mediaComponentCSS(mediaTheme()).player}
${mediaComponentCSS(mediaTheme()).actionbar}
${mediaComponentCSS(mediaTheme()).dates}
    `;

    addCSS(CSS);

    const keepRoot = () => {
        const c = document.documentElement.classList;
        if (!c.contains("tb")) c.add("tb");
        if (isVideo && !c.contains("tb-file")) c.add("tb-file");
        if (isAlbum && !c.contains("tb-album")) c.add("tb-album");
    };
    try { new MutationObserver(keepRoot).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] }); } catch (e) {}