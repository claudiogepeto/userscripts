// ==UserScript==
// @name         GoFile — Card Grid, Search, Custom Player & Theater Stage
// @namespace    gofile-grid
// @version      3.2.4
// @description  Card grid, search, custom player, theater stage, gallery strip, and AMOLED styling for GoFile.
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
    const ACCENT = "#3b82f6";

    const CSS = `
        /* ===================== TEMA AMOLED ===================== */
        html.gf, html.gf body, html.gf #app, html.gf .bg-surface-base { background: #0b0c0f !important; color: #e9e9ee !important; }
        html.gf .bg-surface-raised, html.gf .panel, html.gf .bg-gray-800 { background: #12141a !important; border-color: rgba(255,255,255,0.08) !important; }
        html.gf ::selection { background: rgba(59,130,246,0.35); }
        html.gf ::-webkit-scrollbar { width: 10px; height: 10px; }
        html.gf ::-webkit-scrollbar-thumb { background: #2a2c33; border-radius: 8px; border: 2px solid #0b0c0f; }

        /* ===================== SEM SIDEBAR + SEM ADS + LARGURA TOTAL ===================== */
        html.gf #sidebar, html.gf #sidebar-overlay, html.gf #index_sidebar, html.gf #index_sidebarOverlay { display: none !important; }
        html.gf #ad-slot, html.gf #index_ads, html.gf iframe[data-aa] { display: none !important; }
        html.gf #app, html.gf #page, html.gf #fm-root, html.gf #index_app, html.gf #index_content, html.gf #index_main { max-width: none !important; width: 100% !important; padding-left: clamp(12px, 2.5vw, 32px) !important; padding-right: clamp(12px, 2.5vw, 32px) !important; box-sizing: border-box !important; }
        html.gf .max-w-6xl { max-width: none !important; }

        /* ===================== TOPBAR MODERNA ===================== */
        html.gf #app-header, html.gf #index_header { position: sticky; top: 0; z-index: 50; display: flex !important; align-items: center; justify-content: space-between; gap: 16px; background: #0e0f13 !important; border: 0 !important; border-bottom: 1px solid rgba(255,255,255,0.08) !important; border-radius: 0 !important; padding: 10px 20px !important; }
        html.gf #sidebar-toggle, html.gf #index_toggleSidebar { display: none !important; }
        html.gf .gf-brand { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 18px; color: #fff; text-decoration: none; flex: 0 0 auto; }
        html.gf .gf-brand img { height: 26px; width: auto; }
        html.gf .gf-topsearch { flex: 1 1 540px; max-width: 540px; margin: 0 auto; }
        html.gf .gf-topsearch input { width: 100%; height: 38px; box-sizing: border-box; padding: 0 16px 0 40px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a3a3ad' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m21 21-4.3-4.3'/%3E%3C/svg%3E") no-repeat 14px center; background-size: 16px; color: #fff; font-size: 14px; outline: none; transition: border-color .15s, background-color .15s; }
        html.gf .gf-topsearch input:focus { border-color: ${ACCENT}; background-color: rgba(255,255,255,0.1); }

        /* ===================== GRADE DE CARDS AMOLED ===================== */
        html.gf #fm-list > div, html.gf #filemanager_itemslist { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)) !important; gap: 14px !important; padding: 14px 0 !important; background: transparent !important; border: 0 !important; align-items: start !important; }
        @media (max-width: 700px) { html.gf #fm-list > div, html.gf #filemanager_itemslist { grid-template-columns: repeat(auto-fill, minmax(46vw, 1fr)) !important; gap: 10px !important; } }

        html.gf .gf-card { position: relative !important; display: flex !important; flex-direction: column !important; border: 1px solid rgba(255,255,255,0.08) !important; border-radius: 14px !important; background: #12141a !important; overflow: hidden !important; transition: transform .12s ease, border-color .12s ease, box-shadow .12s ease; cursor: pointer; }
        html.gf .gf-card.gf-filtered { display: none !important; }
        html.gf .gf-card:hover { transform: translateY(-3px); border-color: ${ACCENT}88 !important; box-shadow: 0 10px 26px rgba(0,0,0,0.5) !important; }

        html.gf .gf-media { position: relative; width: 100%; aspect-ratio: 16 / 9; background: #07080a; display: flex; align-items: center; justify-content: center; overflow: hidden; cursor: pointer; }
        html.gf .gf-media img { width: 100% !important; height: 100% !important; max-height: none !important; object-fit: cover !important; display: block; border-radius: 0 !important; }
        html.gf .gf-media-ic svg { width: 36px; height: 36px; color: ${ACCENT}; opacity: .75; }
        html.gf .gf-media-play { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; background: rgba(0,0,0,0.3); transition: opacity .12s ease; }
        html.gf .gf-card:hover .gf-media-play { opacity: 1; }
        html.gf .gf-media-play span { width: 46px; height: 46px; border-radius: 50%; background: rgba(0,0,0,.65); display: flex; align-items: center; justify-content: center; color: #fff; }
        html.gf .gf-media-play svg { width: 22px; height: 22px; margin-left: 2px; }

        html.gf .gf-card-body { padding: 10px 12px 12px !important; display: flex; flex-direction: column; gap: 4px; }
        html.gf .gf-card-name { font-size: 13px !important; font-weight: 600 !important; color: #e9e9ee !important; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; }
        html.gf .gf-card:hover .gf-card-name { color: ${ACCENT} !important; }
        html.gf .gf-card-meta { font-size: 11px !important; color: rgba(255,255,255,0.5) !important; display: flex; align-items: center; gap: 6px; }

        html.gf .gf-card-select { position: absolute !important; top: 8px; left: 8px; z-index: 3; width: 22px; height: 22px; border-radius: 6px; border: 2px solid rgba(255,255,255,0.4); background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .12s, border-color .12s; }
        html.gf .gf-card-select.is-selected { background: ${ACCENT}; border-color: ${ACCENT}; }
        html.gf .gf-card-select.is-selected svg { display: block; }
        html.gf .gf-card-select svg { display: none; width: 14px; height: 14px; color: #fff; }

        /* Oculta os layouts nativos de linha quando transformados em card */
        html.gf .fm-row > button[data-action="toggle-select"] { display: none !important; }
        html.gf .fm-row > button[data-action="open-file"] { display: none !important; }
        html.gf .fm-row > .flex.shrink-0 { display: none !important; }

        /* ===================== BARRA DE MULTISELECT FLUTUANTE ===================== */
        .gf-bulk { position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%) translateY(20px); z-index: 2147482000; display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-radius: 14px; background: #14161a; border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 12px 34px rgba(0,0,0,0.6); opacity: 0; pointer-events: none; transition: opacity .18s ease, transform .18s ease; min-width: 320px; font-family: Inter, system-ui, sans-serif; }
        .gf-bulk.open { opacity: 1; pointer-events: auto; transform: translateX(-50%) translateY(0); }
        .gf-bulk-count { font: 600 13px Inter, system-ui, sans-serif; color: #fff; white-space: nowrap; }

        /* ===================== STAGE THEATER ===================== */
        html.gf.gf-has-stage, html.gf.gf-has-stage body { overflow: hidden !important; }
        .gf-stage { position: fixed; inset: 0; z-index: 2147483000; display: none; flex-direction: column; background: #0b0c0f; color: #fff; font-family: Inter, system-ui, sans-serif; }
        .gf-stage.open { display: flex; }
        .gf-stage * { box-sizing: border-box; }
        .gf-stage-mid { position: relative; flex: 1 1 auto; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 0 !important; overflow: hidden; }

        /* ===================== NOSSO PLAYER ESTILO YOUTUBE (Accent Azul) ===================== */
        :root { --gf-accent: ${ACCENT}; }
        .gf-host { position: relative; width: 100%; height: 100%; max-width: 100%; max-height: 100%; background: #000; border-radius: 0 !important; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .gf-video { width: 100% !important; height: 100% !important; max-width: 100% !important; max-height: 100% !important; object-fit: contain !important; background: #000 !important; border-radius: 0 !important; outline: none; cursor: pointer; display: block; }
        .gf-plc-flash { position: absolute; inset: 0; z-index: 2; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .2s ease; }
        .gf-pl:not(.is-playing):not(.is-buffering) .gf-plc-flash { opacity: 1; pointer-events: auto; cursor: pointer; }
        .gf-plc-flash button { border: 0; border-radius: 50%; cursor: pointer; padding: 0; background: rgba(0,0,0,.55); color: #fff; display: flex; align-items: center; justify-content: center; transition: transform .12s ease, background .12s ease; pointer-events: auto; }
        .gf-plc-flash button:hover { transform: scale(1.08); background: rgba(0,0,0,.72); }
        .gf-plc-play { width: 64px; height: 64px; } .gf-plc-play svg { width: 30px; height: 30px; display: block; margin-left: 3px; }
        @media (max-width: 600px) { .gf-plc-play { width: 54px; height: 54px; } .gf-plc-play svg { width: 26px; height: 26px; } }
        .gf-plc-seekflash { position: absolute; top: 50%; transform: translate(-50%, -50%); z-index: 3; padding: 10px 18px; border-radius: 24px; background: rgba(0,0,0,.75); color: #fff; font: 700 15px/1 Inter, sans-serif; pointer-events: none; opacity: 0; transition: opacity .15s ease; }
        .gf-plc-seekflash.on { opacity: 1; }
        .gf-plc-bottom { position: absolute; left: 0; right: 0; bottom: 0; z-index: 4; display: flex; flex-direction: column; padding: 0 14px 10px; background: linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.4) 65%, transparent 100%); opacity: 0; pointer-events: none; transition: opacity .18s ease; }
        .gf-host:hover .gf-plc-bottom, .gf-pl:not(.is-playing) .gf-plc-bottom { opacity: 1; pointer-events: auto; }
        .gf-plc-prog { position: relative; width: 100%; height: 16px; display: flex; align-items: center; cursor: pointer; touch-action: none; }
        .gf-plc-bar { position: relative; width: 100%; height: 4px; background: rgba(255,255,255,.25); border-radius: 2px; transition: height .1s ease; }
        .gf-plc-prog:hover .gf-plc-bar { height: 6px; }
        .gf-plc-buf { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: rgba(255,255,255,.4); border-radius: 2px; pointer-events: none; }
        .gf-plc-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: var(--gf-accent, #3b82f6); border-radius: 2px; pointer-events: none; }
        .gf-plc-knob { position: absolute; right: -6px; top: 50%; transform: translateY(-50%) scale(0); width: 13px; height: 13px; border-radius: 50%; background: var(--gf-accent, #3b82f6); box-shadow: 0 0 4px rgba(0,0,0,.5); transition: transform .1s ease; }
        .gf-plc-prog:hover .gf-plc-knob { transform: translateY(-50%) scale(1); }
        .gf-plc-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 2px; }
        .gf-plc-left, .gf-plc-right { display: flex; align-items: center; gap: 6px; }
        .gf-plc-act { display: inline-flex; align-items: center; justify-content: center; min-width: 34px; height: 34px; padding: 0 7px; border: 0; background: transparent; color: #fff; cursor: pointer; border-radius: 8px; font: 600 13px/1 Inter, sans-serif; transition: background .12s, color .12s; }
        .gf-plc-act:hover { background: rgba(255,255,255,.14); color: var(--gf-accent, #3b82f6); }
        .gf-plc-act svg { width: 20px; height: 20px; display: block; }
        .gf-plc-barplay svg { width: 22px; height: 22px; }
        .gf-plc-skip { position: relative; }
        .gf-plc-skipn { position: absolute; font-size: 9px; font-weight: 800; top: 52%; left: 50%; transform: translate(-50%, -50%); color: #fff; }
        .gf-plc-time { font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,.88); padding: 0 6px; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .gf-plc-vol { display: flex; align-items: center; gap: 4px; }
        .gf-plc-volbar { width: 0; height: 28px; display: flex; align-items: center; cursor: pointer; overflow: hidden; transition: width .18s ease, margin .18s ease; }
        .gf-plc-vol:hover .gf-plc-volbar, .gf-plc-volbar:hover { width: 62px; margin-right: 4px; }
        .gf-plc-volfill { width: 100%; height: 4px; background: #fff; border-radius: 2px; position: relative; }
        .gf-plc-speedwrap { position: relative; }
        .gf-plc-speedmenu { position: absolute; bottom: 42px; right: 0; background: rgba(18,20,26,.96); border: 1px solid rgba(255,255,255,.12); border-radius: 10px; padding: 6px; display: none; flex-direction: column; gap: 2px; min-width: 86px; max-height: 240px; overflow-y: auto; box-shadow: 0 10px 28px rgba(0,0,0,.6); z-index: 10; }
        .gf-plc-speedmenu.open { display: flex; }
        .gf-plc-speeditem { border: 0; background: transparent; color: #fff; padding: 6px 10px; font: 600 12.5px/1 Inter, sans-serif; border-radius: 6px; cursor: pointer; text-align: left; }
        .gf-plc-speeditem:hover { background: rgba(255,255,255,.1); }
        .gf-plc-speeditem.on { color: var(--gf-accent, #3b82f6); font-weight: 800; }

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

        /* ===================== VROW ===================== */
        .gf-vrow { flex: 0 0 auto; display: flex; align-items: center; gap: 6px; padding: 9px 14px; background: #0e0f13; border-bottom: 1px solid rgba(255,255,255,.08); overflow-x: auto; white-space: nowrap; }
        .gf-vrow .gf-name { flex: 0 1 auto; min-width: 60px; max-width: 40vw; display: inline-flex; align-items: center; gap: 8px; padding: 0 4px; font-weight: 600; }
        .gf-vrow .gf-name svg { color: ${ACCENT}; flex: 0 0 auto; }
        .gf-vrow .gf-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .gf-stats { display: flex; align-items: center; gap: 14px; padding: 0 8px; flex: 0 0 auto; }
        .gf-stat { font-size: 12px; color: rgba(255,255,255,.62); font-weight: 600; }
        .gf-spacer { flex: 1 1 auto; min-width: 8px; }
        .gf-item { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 7px; padding: 8px 12px; border: 1px solid rgba(255,255,255,.1); border-radius: 9px; background: rgba(255,255,255,.05); color: #fff; font: 13px/1 Inter, system-ui, sans-serif; cursor: pointer; text-decoration: none; transition: background .12s, border-color .12s; }
        .gf-item:hover { background: rgba(255,255,255,.1); border-color: ${ACCENT}66; }
        .gf-item.is-primary { background: ${ACCENT}; border-color: ${ACCENT}; color: #06101f; font-weight: 700; }
        .gf-item.is-primary svg { color: #06101f; }
        .gf-vsep { flex: 0 0 auto; width: 1px; height: 22px; margin: 0 3px; background: rgba(255,255,255,.1); }

        /* ===================== STRIP ===================== */
        .gf-stripwrap { flex: 0 0 auto; display: flex; flex-direction: column; background: #0e0f13; border-top: 1px solid rgba(255,255,255,.08); }
        .gf-stripbar { display: flex; align-items: center; gap: 8px; padding: 6px 12px; }
        .gf-striplabel { font-size: 12px; font-weight: 600; color: rgba(255,255,255,.55); }
        .gf-sbtn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 28px; border: 1px solid rgba(255,255,255,.1); border-radius: 8px; background: rgba(255,255,255,.05); color: #fff; cursor: pointer; font-size: 16px; transition: background .12s, border-color .12s; }
        .gf-sbtn:hover { background: rgba(255,255,255,.1); border-color: ${ACCENT}66; }
        .gf-sbtn svg { width: 18px; height: 18px; color: ${ACCENT}; }
        .gf-stripwrap.is-collapsed .gf-strip { display: none; }
        .gf-stripwrap.is-collapsed .gf-collapse svg { transform: rotate(180deg); }
        .gf-strip { display: flex; gap: 8px; overflow-x: auto; padding: 4px 12px 12px; scrollbar-width: none; }
        .gf-strip::-webkit-scrollbar { display: none; height: 0; }
        .gf-strip-item { flex: 0 0 auto; width: 158px; display: flex; flex-direction: column; border: 1px solid rgba(255,255,255,.08); border-radius: 10px; overflow: hidden; background: rgba(255,255,255,.03); color: #fff; cursor: pointer; transition: border-color .12s, transform .12s; }
        .gf-strip-item:hover { border-color: ${ACCENT}88; transform: translateY(-2px); }
        .gf-strip-item.is-current { border-color: ${ACCENT} !important; box-shadow: 0 0 0 2px ${ACCENT}, 0 0 14px -2px ${ACCENT}; }
        .gf-strip-thumb { width: 100%; aspect-ratio: 16/9; object-fit: cover; background: #000; display: flex; align-items: center; justify-content: center; color: ${ACCENT}; }
        .gf-strip-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .gf-strip-meta { display: flex; align-items: center; gap: 5px; padding: 7px 8px; }
        .gf-strip-meta svg { width: 13px; height: 13px; color: ${ACCENT}; flex: 0 0 auto; }
        .gf-strip-name { font-size: 11px; line-height: 1.25; color: rgba(255,255,255,.82); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; word-break: break-word; }
        .gf-strip-item.is-current .gf-strip-name { color: #fff; font-weight: 700; }
        @media (max-width: 600px) { .gf-strip-item { width: 120px; } .gf-vrow .gf-name { max-width: 50vw; } }

        /* ===================== SETAS LATERAIS ===================== */
        .gf-nav-side { position: absolute; top: 50%; transform: translateY(-50%); z-index: 6; width: 46px; height: 46px; border: 0; border-radius: 50%; background: rgba(0,0,0,.5); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .18s, background .12s; }
        .gf-nav-prev { left: 16px; } .gf-nav-next { right: 16px; }
        .gf-stage.has-nav .gf-stage-mid:hover .gf-nav-side { opacity: 1; pointer-events: auto; }
        @media (hover: none) { .gf-stage.has-nav .gf-nav-side { opacity: .85; pointer-events: auto; } }
        .gf-nav-side:hover { background: rgba(0,0,0,.74); }
        .gf-nav-side svg { width: 26px; height: 26px; display: block; }
        @keyframes gf-spin { to { transform: rotate(360deg); } }
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
    const prefs = Object.assign({ volume: 1, muted: false, rate: 1 }, (() => { try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; } })());
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

    const svgi = inner => `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block">${inner}</svg>`;
    const IC = {
        download: svgi('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
        copy: svgi('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
        expand: svgi('<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>'),
        close: svgi('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
        grid: svgi('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
        video: svgi('<rect x="2" y="5" width="14" height="14" rx="2"/><path d="m22 8-6 4 6 4V8z"/>'),
        image: svgi('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'),
        file: svgi('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'),
        check: svgi('<polyline points="20 6 9 17 4 12"/>'),
        chevL: svgi('<path d="m15 18-6-6 6-6"/>'),
        chevR: svgi('<path d="m9 18 6-6-6-6"/>'),
        chevDown: svgi('<path d="m6 9 6 6 6-6"/>'),
        play: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M7 4.5v15a1 1 0 0 0 1.52.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>',
        pause: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>',
        volume: svgi('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>'),
        mute: svgi('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>'),
        skipBack: svgi('<path d="M3 2v6h6"/><path d="M21 12A9 9 0 0 0 6 5.3L3 8"/>'),
        skipFwd: svgi('<path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>'),
    };
    const fmtT = s => { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60; const p = n => String(n).padStart(2, "0"); return h ? h + ":" + p(m) + ":" + p(ss) : m + ":" + p(ss); };

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
        const prog = el("div", { class: "gf-plc-prog" }, bar);
        const seekTo = (cx, r) => { if (!video.duration || !r.width) return; video.currentTime = Math.max(0, Math.min(1, (cx - r.left) / r.width)) * video.duration; };
        prog.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); const r = bar.getBoundingClientRect(); seekTo(e.clientX, r); const mv = ev => seekTo(ev.clientX, r); const up = () => { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); }; document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up); });

        const tEl = el("span", { class: "gf-plc-time" }, "0:00");
        const syncTime = () => { const s = fmtT(video.currentTime) + (video.duration ? " / " + fmtT(video.duration) : ""); if (tEl.firstChild.data !== s) tEl.firstChild.data = s; };
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
        const fsb = mkAct(IC.expand, "Tela cheia (f)", e => { e.stopPropagation(); goFs(); });
        const barPlay = mkAct(IC.play, "Play/Pause (espaço)", e => { e.stopPropagation(); toggle(); }); barPlay.classList.add("gf-plc-barplay");

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

        const leftc = el("div", { class: "gf-plc-left" }, barPlay, skipBack, skipFwd, volgrp, tEl);
        const rightc = el("div", { class: "gf-plc-right" }, speedWrap, dlb, fsb);
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
    let stage, stMid, stName, stSize, stDl, stStrip, stIcon, stCur = null;
    const kindIcon = k => k === "image" ? IC.image : (k === "other" ? IC.file : IC.video);

    function buildStage() {
        if (stage) return;
        stage = el("div", { class: "gf-stage" });
        const vrow = el("div", { class: "gf-vrow" });
        const back = vbtn(IC.grid, "Galeria", { title: "Voltar pra galeria", onClick: closeStage });
        stIcon = el("span", { class: "gf-nameic" }); stIcon.insertAdjacentHTML("beforeend", IC.video);
        stName = el("span", null, "");
        const nameWrap = el("div", { class: "gf-name" }, stIcon, stName);
        const stats = el("div", { class: "gf-stats" });
        stSize = el("span", { class: "gf-stat" }, "");
        stats.append(stSize);
        stDl = vbtn(IC.download, "Download", { class: "gf-item is-primary", title: "Baixar" });
        const copy = vbtn(IC.copy, "Copiar", { title: "Copiar link da pasta", onClick: () => { try { navigator.clipboard && navigator.clipboard.writeText(location.href); } catch (e) {} } });
        const fs = vbtn(IC.expand, "", { title: "Tela cheia", onClick: () => { try { document.fullscreenElement ? document.exitFullscreen() : stage.requestFullscreen(); } catch (e) {} } });
        const close = vbtn(IC.close, "", { title: "Fechar (Esc)", onClick: closeStage });
        vrow.append(back, el("div", { class: "gf-vsep" }), nameWrap, stats, el("div", { class: "gf-spacer" }), stDl, copy, fs, el("div", { class: "gf-vsep" }), close);

        stMid = el("div", { class: "gf-stage-mid" });
        const navPrev = el("button", { class: "gf-nav-side gf-nav-prev", type: "button", title: "Anterior", onClick: e => { e.stopPropagation(); navStage(-1); } }); navPrev.insertAdjacentHTML("beforeend", IC.chevL);
        const navNext = el("button", { class: "gf-nav-side gf-nav-next", type: "button", title: "Próximo", onClick: e => { e.stopPropagation(); navStage(1); } }); navNext.insertAdjacentHTML("beforeend", IC.chevR);
        stMid.append(navPrev, navNext);

        const stripwrap = el("div", { class: "gf-stripwrap" });
        stStrip = el("div", { class: "gf-strip" });
        if (localStorage.getItem("gf_strip_collapsed") === "1") stripwrap.classList.add("is-collapsed");
        const collapse = el("button", { class: "gf-sbtn gf-collapse", type: "button", title: "Recolher / expandir", onClick: () => { stripwrap.classList.toggle("is-collapsed"); try { localStorage.setItem("gf_strip_collapsed", stripwrap.classList.contains("is-collapsed") ? "1" : "0"); } catch (e) {} } }); collapse.insertAdjacentHTML("beforeend", IC.chevDown);
        const prev = el("button", { class: "gf-sbtn", type: "button", title: "Rolar", onClick: () => stStrip.scrollBy({ left: -stStrip.clientWidth * 0.8, behavior: "smooth" }) }); prev.insertAdjacentHTML("beforeend", IC.chevL);
        const next = el("button", { class: "gf-sbtn", type: "button", title: "Rolar", onClick: () => stStrip.scrollBy({ left: stStrip.clientWidth * 0.8, behavior: "smooth" }) }); next.insertAdjacentHTML("beforeend", IC.chevR);
        stripwrap.append(el("div", { class: "gf-stripbar" }, collapse, el("span", { class: "gf-striplabel" }, "Arquivos da pasta"), el("div", { class: "gf-spacer" }), prev, next), stStrip);

        stage.append(vrow, stMid, stripwrap);
        (document.body || document.documentElement).appendChild(stage);
        document.addEventListener("keydown", e => { if (e.key === "Escape" && stage.classList.contains("open")) closeStage(); });
    }

    function playableCards() {
        return Array.from(document.querySelectorAll(".gf-card")).filter(c => c._gf && c._gf.playable && !c.classList.contains("gf-filtered"));
    }

    function renderStrip() {
        const cards = playableCards();
        stStrip.textContent = "";
        stage.classList.toggle("has-nav", cards.length > 1);
        cards.forEach(card => {
            const d = card._gf;
            const it = el("div", { class: "gf-strip-item" + (card === stCur ? " is-current" : ""), title: d.name });
            const th = el("div", { class: "gf-strip-thumb" });
            if (d.thumb) th.append(el("img", { src: d.thumb, alt: "", loading: "lazy" }));
            else th.insertAdjacentHTML("beforeend", kindIcon(d.kind));
            const meta = el("div", { class: "gf-strip-meta" }); meta.insertAdjacentHTML("beforeend", kindIcon(d.kind)); meta.append(el("span", { class: "gf-strip-name" }, d.name));
            it.append(th, meta);
            it.addEventListener("click", () => loadStageItem(card));
            it._card = card;
            stStrip.appendChild(it);
        });
        const cur = stStrip.querySelector(".is-current");
        if (cur) setTimeout(() => { try { const br = cur.getBoundingClientRect(), sr = stStrip.getBoundingClientRect(); stStrip.scrollBy({ left: (br.left + br.width / 2) - (sr.left + sr.width / 2), behavior: "smooth" }); } catch (e) {} }, 80);
    }

    function navStage(dir) {
        const cards = playableCards(); if (cards.length < 2) return;
        let i = cards.indexOf(stCur); if (i < 0) i = 0;
        loadStageItem(cards[(i + dir + cards.length) % cards.length]);
    }

    const IMAGE_SOURCE_ATTRS = ["data-src", "data-original", "data-url", "data-lazy-src", "data-original-src", "src"];
    const UI_IMAGE_RE = /\b(?:favicon|logo|icon|avatar|spinner|placeholder|loading|loader|sprite|transparent)\b/i;
    const IMAGE_MODAL_SELECTOR = ".fixed, dialog, [role='dialog'], .media-viewer, #modal-root";

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

    function normalizedAssetName(value) {
        return decodedImageText(value)
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "");
    }

    function imageSourceLooksUsable(src) {
        return !!src && !/^(?:about:blank|javascript:)/i.test(src) && !UI_IMAGE_RE.test(decodedImageText(src));
    }

    function mediaImageSource(img) {
        return imageSourceCandidates(img).find(imageSourceLooksUsable) || "";
    }

    function imageMatchesName(img, fileName, src) {
        const wanted = normalizedAssetName(fileName);
        if (!wanted) return false;
        const haystack = [
            src,
            img.alt,
            img.title,
            img.getAttribute("data-name"),
            img.getAttribute("aria-label"),
        ].map(normalizedAssetName).join(" ");
        return haystack.includes(wanted);
    }

    function isMediaImage(img, fileName = "") {
        if (!img || (stage && stage.contains(img))) return false;
        const src = mediaImageSource(img);
        if (!src) return false;

        const metadata = [
            img.alt,
            img.title,
            img.id,
            img.getAttribute("class"),
            img.getAttribute("aria-label"),
        ].join(" ");
        const matchesName = imageMatchesName(img, fileName, src);
        if (UI_IMAGE_RE.test(metadata) && !matchesName) return false;

        // Tiny, already-loaded assets are almost always UI icons. Keep a real
        // file with the expected name, even when the user uploaded a small one.
        if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0 &&
            img.naturalWidth <= 64 && img.naturalHeight <= 64 && !matchesName) return false;
        return true;
    }

    function findNativeImage(fileName) {
        const candidates = Array.from(document.querySelectorAll("img"))
            .filter(img => img.closest(IMAGE_MODAL_SELECTOR))
            .filter(img => isMediaImage(img, fileName));
        if (!candidates.length) return null;

        const score = img => {
            const src = mediaImageSource(img);
            const matchesName = imageMatchesName(img, fileName, src);
            const width = img.naturalWidth || img.width || 0;
            const height = img.naturalHeight || img.height || 0;
            let value = matchesName ? 1000 : 0;
            if (img.closest(".media-viewer, #modal-root")) value += 100;
            if (width > 0 && height > 0) value += Math.min(100, Math.round(Math.log2(width * height)));
            if (/\/thumbs?\//i.test(decodedImageText(src))) value -= 30;
            return value;
        };
        return candidates.sort((a, b) => score(b) - score(a))[0];
    }

    let curAc = null;
    function mountPhotoZoom(mid, imgUrl) {
        const host = el("div", { class: "gf-img-host" });
        mid.appendChild(host);
        const newImg = el("img", { class: "gf-image", src: imgUrl, alt: "" });
        host.appendChild(newImg);
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

    function loadStageItem(card) {
        if (curAc) { curAc.abort(); curAc = null; }
        stCur = card;
        const d = card._gf || {};
        stName.textContent = d.name || "";
        stSize.textContent = d.size || "";
        if (stIcon) stIcon.innerHTML = kindIcon(d.kind);
        stDl.onclick = () => { if (d.downloadBtn) d.downloadBtn.click(); };

        Array.from(stStrip.children).forEach(ch => ch.classList.toggle("is-current", ch._card === card));
        const cur = stStrip.querySelector(".is-current");
        if (cur) { try { const br = cur.getBoundingClientRect(), sr = stStrip.getBoundingClientRect(); stStrip.scrollBy({ left: (br.left + br.width / 2) - (sr.left + sr.width / 2), behavior: "smooth" }); } catch (e) {} }

        // Limpa mídia anterior do stage
        stMid.querySelectorAll(".gf-host, .gf-img-host, .gf-spin, .gf-stage-msg, .item-mediaplayer, video, audio").forEach(e => {
            if (e.tagName === "VIDEO" || e.tagName === "AUDIO") { try { e.pause(); } catch (err) {} }
            e.remove();
        });

        // Dispara o preview nativo do GoFile
        if (d.previewBtn) {
            try { d.previewBtn.click(); } catch (e) {}
        } else if (d.openBtn) {
            try { d.openBtn.click(); } catch (e) {}
        }

        const spin = el("div", { class: "gf-spin", style: "width:42px; height:42px; border-radius:50%; border:3px solid rgba(255,255,255,0.2); border-top-color:#3b82f6; animation:gf-spin .8s linear infinite;" });
        stMid.appendChild(spin);

        let tries = 0;
        const iv = setInterval(() => {
            // Busca qualquer tag <video> ou <img> no documento fora do stage
            const nativeVid = Array.from(document.querySelectorAll("video")).find(v => !stage || !stage.contains(v));
            const nativeImg = findNativeImage(d.name);

            if (nativeVid) {
                clearInterval(iv);
                spin.remove();

                const src = nativeVid.currentSrc || nativeVid.src || (nativeVid.querySelector("source") ? (nativeVid.querySelector("source").getAttribute("src") || nativeVid.querySelector("source").src) : "");

                // Oculta modal/backdrop nativo do GoFile
                const nativeModal = nativeVid.closest(".fixed, [role='dialog'], dialog, .modal");
                if (nativeModal && (!stage || !stage.contains(nativeModal))) {
                    nativeModal.style.opacity = "0";
                    nativeModal.style.pointerEvents = "none";
                }

                curAc = new AbortController();
                nativeVid.removeAttribute("controls");
                nativeVid.className = "gf-video";
                nativeVid.style.cssText = "width:100%!important; height:100%!important; object-fit:contain!important; background:#000!important; outline:none!important;";

                nativeVid.volume = prefs.volume ?? 1;
                nativeVid.muted = prefs.muted ?? false;
                nativeVid.addEventListener("volumechange", () => {
                    prefs.volume = nativeVid.volume;
                    prefs.muted = nativeVid.muted;
                    saveP();
                }, { signal: curAc.signal });

                const host = el("div", { class: "gf-host gf-pl" }, nativeVid);
                buildPlayerControls(host, nativeVid, src, curAc);
                stMid.appendChild(host);

                const p = nativeVid.play && nativeVid.play();
                if (p && p.catch) p.catch(() => {});
            } else if (nativeImg) {
                clearInterval(iv);
                spin.remove();
                const nativeModal = nativeImg.closest(".fixed, [role='dialog'], dialog, .modal");
                if (nativeModal && (!stage || !stage.contains(nativeModal))) {
                    nativeModal.style.opacity = "0";
                    nativeModal.style.pointerEvents = "none";
                }
                mountPhotoZoom(stMid, mediaImageSource(nativeImg));
            } else if (++tries > 50) {
                clearInterval(iv);
                spin.remove();
                if (d.thumb && d.kind === "image") {
                    mountPhotoZoom(stMid, d.thumb);
                } else {
                    const anyVid = document.querySelector("video");
                    if (anyVid && (!stage || !stage.contains(anyVid))) {
                        anyVid.removeAttribute("controls");
                        anyVid.className = "gf-video";
                        const host = el("div", { class: "gf-host gf-pl" }, anyVid);
                        buildPlayerControls(host, anyVid, anyVid.currentSrc || anyVid.src, curAc);
                        stMid.appendChild(host);
                    } else {
                        stMid.appendChild(el("div", { class: "gf-stage-msg", style: "color:rgba(255,255,255,0.6); font-size:14px;" }, "Pré-visualização carregada. Clique em Download para baixar o arquivo completo."));
                    }
                }
            }
        }, 80);
    }

    function openStage(card) {
        buildStage();
        stCur = card;
        stage.classList.add("open");
        document.documentElement.classList.add("gf-has-stage");
        renderStrip();
        loadStageItem(card);
    }

    function closeStage() {
        if (!stage) return;
        if (curAc) { curAc.abort(); curAc = null; }
        stMid.querySelectorAll("video, audio").forEach(v => {
            try { v.pause(); v.muted = true; } catch (err) {}
            v.remove();
        });
        stMid.innerHTML = "";

        // 1. Fecha qualquer modal nativo do GoFile via clique
        document.querySelectorAll("dialog[open], [data-action='close'], [data-action='back'], #modal-close, button[aria-label*='Close' i], [class*='fixed'] button[aria-label*='close' i]").forEach(b => {
            try { b.click(); } catch (e) {}
        });

        // 2. Dispara Escape nativo no window e document
        try {
            const escEv = new KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, which: 27, bubbles: true, cancelable: true });
            document.dispatchEvent(escEv);
            window.dispatchEvent(escEv);
        } catch (e) {}

        // 3. Remove quaisquer modais/backdrops nativos residuais
        document.querySelectorAll("dialog[open], [role='dialog'], #modal-root > div, body > div.fixed.inset-0:not(#sidebar-overlay):not(.gf-stage):not(.gf-bulk)").forEach(m => {
            try { m.remove(); } catch (e) {}
        });

        stage.classList.remove("open");
        document.documentElement.classList.remove("gf-has-stage");
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
        stCur = null;

        // 4. Re-garante a visibilidade e integridade da grade
        requestAnimationFrame(() => {
            buildStage();
            scan();
        });
    }

    /* ===================== PROCESSAMENTO DE CARDS ===================== */
    const SIZE_RE = /\b\d+(?:\.\d+)?\s?(?:B|KB|MB|GB|TB)\b/i;

    function processItem(it) {
        if (it.dataset.gfDone) return;
        it.dataset.gfDone = "1";
        it.classList.add("gf-card");

        // Extrai dados da linha
        const nameEl = it.querySelector("p.truncate, a.item_open, .item-name, [data-action='open-file'] p");
        const name = nameEl ? (nameEl.textContent || "").trim() : "";
        const sizeText = Array.from(it.querySelectorAll("span, p, div")).map(e => (e.textContent || "").trim()).find(t => SIZE_RE.test(t)) || "";
        const img = Array.from(it.querySelectorAll("img")).find(candidate => isMediaImage(candidate, name));
        const thumbSrc = img ? mediaImageSource(img) : "";
        const isVid = /\.(mp4|m4v|mov|webm|mkv|avi|ts|flv)$/i.test(name) || !!it.querySelector(".lucide-file-video, .fa-video, .item_play");
        const isImg = /\.(jpe?g|png|gif|webp|avif|bmp|svg)$/i.test(name) || !!it.querySelector(".lucide-image, .fa-image");
        const kind = isImg ? "image" : (isVid ? "video" : "other");
        const playable = isVid || isImg;

        const openBtn = it.querySelector("[data-action='open-file'], a.item_open");
        const previewBtn = it.querySelector("[data-action='preview'], .item_play");
        const downloadBtn = it.querySelector("[data-action='download'], .item_download");
        const selectBtn = it.querySelector("[data-action='toggle-select'], .item_checkbox");

        it._gf = { name, size: sizeText, thumb: thumbSrc, kind, playable, openBtn, previewBtn, downloadBtn, selectBtn };

        // Constrói o DOM do Card
        const media = el("div", { class: "gf-media" });
        if (thumbSrc) {
            media.appendChild(el("img", { src: thumbSrc, alt: "", loading: "lazy" }));
        } else {
            const icWrap = el("span", { class: "gf-media-ic" });
            icWrap.insertAdjacentHTML("beforeend", isVid ? IC.video : (isImg ? IC.image : IC.file));
            media.appendChild(icWrap);
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

        const body = el("div", { class: "gf-card-body" },
            el("div", { class: "gf-card-name", title: name }, name),
            el("div", { class: "gf-card-meta" }, sizeText ? el("span", null, sizeText) : null)
        );

        it.append(media, checkEl, body);

        const onClick = e => {
            e.preventDefault();
            e.stopPropagation();
            if (playable) openStage(it);
            else if (openBtn) openBtn.click();
        };
        media.addEventListener("click", onClick);
        body.addEventListener("click", onClick);
    }

    function scan() {
        const rows = document.querySelectorAll(".fm-row:not([data-gf-done]), #filemanager_itemslist > [data-item-id]:not([data-gf-done]), [data-type='file']:not([data-gf-done])");
        rows.forEach(processItem);
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

    /* ===================== TOPBAR BUSCA ===================== */
    function applyFilter(q) {
        q = (q || "").toLowerCase().trim();
        document.querySelectorAll(".gf-card").forEach(c => {
            const n = (c._gf && c._gf.name || "").toLowerCase();
            c.classList.toggle("gf-filtered", !!q && n.indexOf(q) === -1);
        });
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

    function observeRoot() {
        try {
            new MutationObserver(recs => {
                for (const r of recs) {
                    if (stage && stage.contains(r.target)) continue;
                    requestScan();
                    return;
                }
            }).observe(document.body, { childList: true, subtree: true });
        } catch (e) {}
    }

    let lastHref = location.href;
    function onRoute() {
        if (location.href === lastHref) return;
        lastHref = location.href;
        closeStage();
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
            buildTopbar();
            scan();
            if (++n > 30) clearInterval(id);
        }, 300);
    });
})();
