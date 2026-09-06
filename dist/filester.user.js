// ==UserScript==
// @name         Filester — Theater Stage, Custom Player, Album Strip & Gallery
// @namespace    filester-theater
// @version      2.2.1
// @updateURL    https://raw.githubusercontent.com/claudiogepeto/userscripts/main/dist/filester.user.js
// @downloadURL  https://raw.githubusercontent.com/claudiogepeto/userscripts/main/dist/filester.user.js
// @description  Theater stage, custom player, album strip, gallery grid, zoomable images, and AMOLED styling for Filester.
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
// @noframes
// @run-at       document-start
// @grant        GM_addStyle
// ==/UserScript==
(function () {
    "use strict";
    if (window.top !== window.self) return;   // ignora iframes/embeds

    const PATH = location.pathname;
    const isFile = /\/d\//.test(PATH);
    const isAlbum = /\/f\//.test(PATH);
    document.documentElement.classList.add("fl");
    if (isFile) document.documentElement.classList.add("fl-file");
    if (isAlbum) document.documentElement.classList.add("fl-album");

    const ACCENT = "#4f8cff";

    const CSS = `
        /* ===================== TEMA AMOLED ===================== */
        html.fl, html.fl body, html.fl #filehub, html.fl .min-h-screen { background: #0b0c0f !important; color: #e9e9ee !important; }
        html.fl ::selection { background: rgba(79,140,255,0.35); }
        html.fl a { color: #8ab4ff; }
        html.fl ::-webkit-scrollbar { width: 10px; height: 10px; }
        html.fl ::-webkit-scrollbar-thumb { background: #2a2c33; border-radius: 8px; border: 2px solid #0b0c0f; }

        /* ===================== EARLY PAINT ===================== */
        html.fl-file::before { content: ""; position: fixed; inset: 0; background: #0b0c0f; z-index: 98000; pointer-events: none; }
        html.fl-file.fl-fallback::before { display: none; }
        html.fl-has-stage, html.fl-has-stage body { overflow: hidden !important; }

        /* ===================== STAGE ===================== */
        .fl-stage { position: fixed; inset: 0; z-index: 99000; display: flex; flex-direction: column; background: #0b0c0f; color: #fff; font-family: Inter, system-ui, sans-serif; }
        .fl-stage * { box-sizing: border-box; }
        .fl-stage-mid { position: relative; flex: 1 1 auto; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 0 !important; overflow: hidden; }

        /* ===================== NOSSO PLAYER (estilo YouTube, accent azul) ===================== */
        :root { --fl-accent: ${ACCENT}; }
        .fl-host { position: relative; width: 100%; height: 100%; max-width: 100%; max-height: 100%; background: #000; border-radius: 0 !important; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .fl-video { width: 100% !important; height: 100% !important; max-width: 100% !important; max-height: 100% !important; object-fit: contain !important; background: #000 !important; border-radius: 0 !important; outline: none; cursor: pointer; display: block; }
        .fl-plc-flash { position: absolute; inset: 0; z-index: 2; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .2s ease; }
        .fl-pl:not(.is-playing):not(.is-buffering) .fl-plc-flash { opacity: 1; pointer-events: auto; cursor: pointer; }
        .fl-plc-flash button { border: 0; border-radius: 50%; cursor: pointer; padding: 0; background: rgba(0,0,0,.55); color: #fff; display: flex; align-items: center; justify-content: center; transition: transform .12s ease, background .12s ease; pointer-events: auto; }
        .fl-plc-flash button:hover { transform: scale(1.08); background: rgba(0,0,0,.72); }
        .fl-plc-play { width: 64px; height: 64px; } .fl-plc-play svg { width: 30px; height: 30px; display: block; margin-left: 3px; }
        @media (max-width: 600px) { .fl-plc-play { width: 54px; height: 54px; } .fl-plc-play svg { width: 26px; height: 26px; } }
        .fl-plc-seekflash { position: absolute; top: 50%; transform: translate(-50%, -50%); z-index: 3; padding: 10px 18px; border-radius: 24px; background: rgba(0,0,0,.75); color: #fff; font: 700 15px/1 Inter, sans-serif; pointer-events: none; opacity: 0; transition: opacity .15s ease; }
        .fl-plc-seekflash.on { opacity: 1; }
        .fl-plc-bottom { position: absolute; left: 0; right: 0; bottom: 0; z-index: 4; display: flex; flex-direction: column; padding: 0 14px 10px; background: linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.4) 65%, transparent 100%); opacity: 0; pointer-events: none; transition: opacity .18s ease; }
        .fl-host:hover .fl-plc-bottom, .fl-pl:not(.is-playing) .fl-plc-bottom { opacity: 1; pointer-events: auto; }
        .fl-plc-prog { position: relative; width: 100%; height: 16px; display: flex; align-items: center; cursor: pointer; touch-action: none; }
        .fl-plc-bar { position: relative; width: 100%; height: 4px; background: rgba(255,255,255,.25); border-radius: 2px; transition: height .1s ease; }
        .fl-plc-prog:hover .fl-plc-bar { height: 6px; }
        .fl-plc-buf { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: rgba(255,255,255,.4); border-radius: 2px; pointer-events: none; }
        .fl-plc-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: var(--fl-accent, #4f8cff); border-radius: 2px; pointer-events: none; }
        .fl-plc-knob { position: absolute; right: -6px; top: 50%; transform: translateY(-50%) scale(0); width: 13px; height: 13px; border-radius: 50%; background: var(--fl-accent, #4f8cff); box-shadow: 0 0 4px rgba(0,0,0,.5); transition: transform .1s ease; }
        .fl-plc-prog:hover .fl-plc-knob { transform: translateY(-50%) scale(1); }
        .fl-plc-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 2px; }
        .fl-plc-left, .fl-plc-right { display: flex; align-items: center; gap: 6px; }
        .fl-plc-act { display: inline-flex; align-items: center; justify-content: center; min-width: 34px; height: 34px; padding: 0 7px; border: 0; background: transparent; color: #fff; cursor: pointer; border-radius: 8px; font: 600 13px/1 Inter, sans-serif; transition: background .12s, color .12s; }
        .fl-plc-act:hover { background: rgba(255,255,255,.14); color: var(--fl-accent, #4f8cff); }
        .fl-plc-act svg { width: 20px; height: 20px; display: block; }
        .fl-plc-barplay svg { width: 22px; height: 22px; }
        .fl-plc-skip { position: relative; }
        .fl-plc-skipn { position: absolute; font-size: 9px; font-weight: 800; top: 52%; left: 50%; transform: translate(-50%, -50%); color: #fff; }
        .fl-plc-time { font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,.88); padding: 0 6px; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .fl-plc-vol { display: flex; align-items: center; gap: 4px; }
        .fl-plc-volbar { width: 0; height: 28px; display: flex; align-items: center; cursor: pointer; overflow: hidden; transition: width .18s ease, margin .18s ease; }
        .fl-plc-vol:hover .fl-plc-volbar, .fl-plc-volbar:hover { width: 62px; margin-right: 4px; }
        .fl-plc-volfill { width: 100%; height: 4px; background: #fff; border-radius: 2px; position: relative; }
        .fl-plc-speedwrap { position: relative; }
        .fl-plc-speedmenu { position: absolute; bottom: 42px; right: 0; background: rgba(18,20,26,.96); border: 1px solid rgba(255,255,255,.12); border-radius: 10px; padding: 6px; display: none; flex-direction: column; gap: 2px; min-width: 86px; max-height: 240px; overflow-y: auto; box-shadow: 0 10px 28px rgba(0,0,0,.6); z-index: 10; }
        .fl-plc-speedmenu.open { display: flex; }
        .fl-plc-speeditem { border: 0; background: transparent; color: #fff; padding: 6px 10px; font: 600 12.5px/1 Inter, sans-serif; border-radius: 6px; cursor: pointer; text-align: left; }
        .fl-plc-speeditem:hover { background: rgba(255,255,255,.1); }
        .fl-plc-speeditem.on { color: var(--fl-accent, #4f8cff); font-weight: 800; }

        /* ===================== FOTO ZOOM/PAN REFINADO ===================== */
        .fl-img-host { position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; max-width: 100%; max-height: 100%; margin: 0; overflow: visible; }
        .fl-image {
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
        .fl-stage-mid.is-zoomed .fl-image, .fl-img-host.is-zoomed .fl-image { cursor: grab; }
        .fl-stage-mid.is-zoomed .fl-image:active, .fl-img-host.is-zoomed .fl-image:active { cursor: grabbing; }

        /* ===================== VROW ===================== */
        .fl-vrow { flex: 0 0 auto; display: flex; align-items: center; gap: 6px; padding: 9px 14px; background: #0e0f13; border-bottom: 1px solid rgba(255,255,255,.08); overflow-x: auto; overflow-y: hidden; white-space: nowrap; scrollbar-width: thin; }
        .fl-vrow::-webkit-scrollbar { height: 6px; } .fl-vrow::-webkit-scrollbar-thumb { background: ${ACCENT}55; border-radius: 4px; }
        .fl-name { flex: 0 1 auto; min-width: 60px; max-width: 36vw; display: inline-flex; align-items: center; gap: 8px; padding: 0 4px; font-weight: 600; }
        .fl-name svg { color: ${ACCENT}; flex: 0 0 auto; }
        .fl-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .fl-stats { display: flex; align-items: center; gap: 14px; padding: 0 8px; flex: 0 0 auto; }
        .fl-stat { font-size: 12px; color: rgba(255,255,255,.62); font-weight: 600; }
        .fl-spacer { flex: 1 1 auto; min-width: 8px; }
        .fl-item { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 7px; padding: 8px 12px; border: 1px solid rgba(255,255,255,.1); border-radius: 9px; background: rgba(255,255,255,.05); color: #fff; font: 13px/1 Inter, system-ui, sans-serif; cursor: pointer; text-decoration: none; transition: background .12s, border-color .12s; }
        .fl-item:hover { background: rgba(255,255,255,.1); border-color: ${ACCENT}66; }
        .fl-item svg { width: 18px; height: 18px; color: ${ACCENT}; }
        .fl-item.is-primary { background: ${ACCENT}; border-color: ${ACCENT}; color: #07101f; font-weight: 700; }
        .fl-item.is-primary svg { color: #07101f; } .fl-item.is-primary:hover { filter: brightness(1.07); }
        .fl-vsep { flex: 0 0 auto; width: 1px; height: 22px; margin: 0 3px; background: rgba(255,255,255,.1); }

        /* ===================== STRIP ===================== */
        .fl-stripwrap { flex: 0 0 auto; display: flex; flex-direction: column; background: #0e0f13; border-top: 1px solid rgba(255,255,255,.08); }
        .fl-stripbar { display: flex; align-items: center; gap: 8px; padding: 6px 12px; }
        .fl-striplabel { font-size: 12px; font-weight: 600; color: rgba(255,255,255,.55); white-space: nowrap; }
        .fl-sbtn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 28px; padding: 0; flex: 0 0 auto; border: 1px solid rgba(255,255,255,.1); border-radius: 8px; background: rgba(255,255,255,.05); color: #fff; cursor: pointer; transition: background .12s, border-color .12s; }
        .fl-sbtn:hover { background: rgba(255,255,255,.1); border-color: ${ACCENT}66; } .fl-sbtn svg { width: 18px; height: 18px; color: ${ACCENT}; }
        .fl-stripwrap.is-collapsed .fl-strip { display: none; }
        .fl-stripwrap.is-collapsed .fl-collapse svg { transform: rotate(180deg); }
        .fl-strip { display: flex; gap: 8px; overflow-x: auto; overflow-y: hidden; padding: 4px 12px 12px; scrollbar-width: none; }
        .fl-strip::-webkit-scrollbar { display: none; height: 0; }
        .fl-strip-item { flex: 0 0 auto; width: 158px; display: flex; flex-direction: column; border: 1px solid rgba(255,255,255,.08); border-radius: 10px; overflow: hidden; background: rgba(255,255,255,.03); color: #fff; text-decoration: none; transition: border-color .12s, transform .12s; }
        .fl-strip-item:hover { border-color: ${ACCENT}88; transform: translateY(-2px); }
        .fl-strip-item.is-current { border-color: ${ACCENT} !important; box-shadow: 0 0 0 2px ${ACCENT}, 0 0 14px -2px ${ACCENT}; }
        .fl-strip-item.is-current .fl-strip-name { color: #fff; font-weight: 700; }
        .fl-strip-thumb { width: 100%; height: 92px; object-fit: cover; background: #000; display: block; }
        .fl-strip-meta { display: flex; align-items: center; gap: 5px; padding: 7px 8px; }
        .fl-strip-meta svg { width: 13px; height: 13px; flex: 0 0 auto; color: ${ACCENT}; }
        .fl-strip-name { font-size: 11px; line-height: 1.25; color: rgba(255,255,255,.82); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; word-break: break-word; }
        @media (max-width: 600px) { .fl-strip-item { width: 120px; } .fl-strip-thumb { height: 70px; } .fl-name { max-width: 50vw; } }

        /* ===================== SETAS ===================== */
        .fl-nav-side { position: absolute; top: 50%; transform: translateY(-50%); z-index: 6; width: 46px; height: 46px; border: 0; border-radius: 50%; background: rgba(0,0,0,.5); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .18s ease, background .12s ease; }
        .fl-nav-prev { left: 16px; } .fl-nav-next { right: 16px; }
        .fl-stage.has-nav .fl-stage-mid:hover .fl-nav-side { opacity: 1; pointer-events: auto; }
        @media (hover: none) { .fl-stage.has-nav .fl-nav-side { opacity: .85; pointer-events: auto; } }
        .fl-nav-side:hover { background: rgba(0,0,0,.74); } .fl-nav-side:active { transform: translateY(-50%) scale(.92); }
        .fl-nav-side svg { width: 26px; height: 26px; display: block; }

        /* ===================== TOAST ===================== */
        .fl-toast { position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%) translateY(12px); z-index: 100001; padding: 10px 18px; border-radius: 20px; background: #14161a; border: 1px solid ${ACCENT}66; color: #fff; font: 13px Inter, system-ui, sans-serif; box-shadow: 0 6px 22px rgba(0,0,0,.6); opacity: 0; pointer-events: none; transition: opacity .2s, transform .2s; }
        .fl-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

        /* ===================== GALERIA (/f/) ===================== */
        html.fl .container, html.fl .files-section { max-width: min(100% - 28px, 1800px) !important; width: 100% !important; }
        html.fl .files-list.grid-view { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)) !important; gap: 14px !important; }
        @media (max-width: 700px) { html.fl .files-list.grid-view { grid-template-columns: repeat(auto-fill, minmax(46vw, 1fr)) !important; gap: 10px !important; } }
        html.fl .file-item { display: flex !important; flex-direction: column !important; border-radius: 14px !important; overflow: hidden !important; background: #111317 !important; border: 1px solid rgba(255,255,255,0.07) !important; cursor: pointer; transition: transform .12s ease, border-color .12s ease, box-shadow .12s ease; }
        html.fl .file-item:hover { transform: translateY(-3px); border-color: ${ACCENT}88 !important; box-shadow: 0 10px 26px rgba(0,0,0,0.5) !important; }
        html.fl .file-preview { position: relative; width: 100% !important; aspect-ratio: 1 / 1; background: #0a0a0c !important; overflow: hidden !important; }
        html.fl .file-preview img { width: 100% !important; height: 100% !important; object-fit: cover !important; display: block; }
        html.fl .file-info { padding: 9px 11px !important; }
        html.fl .file-name { font-size: 12.5px !important; font-weight: 600 !important; color: #e9e9ee !important; line-height: 1.35 !important; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        html.fl .file-meta { font-size: 11px !important; color: rgba(255,255,255,0.5) !important; margin-top: 3px !important; }
        html.fl-album header.text-center { max-width: min(100% - 28px, 1800px) !important; margin: 0 auto !important; padding: 12px 0 8px !important; }
        html.fl-album header svg { width: 40px !important; height: 40px !important; }
        html.fl .folder-header { border-bottom: 1px solid rgba(255,255,255,.08) !important; padding-bottom: 16px !important; margin-bottom: 18px !important; }
        html.fl .folder-title { font-size: 26px !important; font-weight: 800 !important; color: #fff !important; }
        html.fl .folder-meta { color: rgba(255,255,255,.55) !important; font-size: 13px !important; display: flex !important; gap: 8px !important; flex-wrap: wrap !important; }
        html.fl .folder-meta .separator { color: rgba(255,255,255,.25) !important; }
        html.fl .filters-bar { display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 12px !important; flex-wrap: wrap !important; margin-bottom: 18px !important; }
        html.fl .filter-group { display: flex !important; gap: 6px !important; flex-wrap: wrap !important; }
        html.fl .filter-btn { padding: 8px 16px !important; border-radius: 999px !important; border: 1px solid rgba(255,255,255,.12) !important; background: rgba(255,255,255,.04) !important; color: rgba(255,255,255,.7) !important; font-size: 13px !important; font-weight: 600 !important; cursor: pointer !important; transition: background .12s, color .12s, border-color .12s !important; }
        html.fl .filter-btn:hover { background: rgba(255,255,255,.09) !important; color: #fff !important; }
        html.fl .filter-btn.active { background: ${ACCENT} !important; border-color: ${ACCENT} !important; color: #07101f !important; }
        html.fl .view-btn { border-radius: 10px !important; border: 1px solid rgba(255,255,255,.12) !important; background: rgba(255,255,255,.04) !important; color: rgba(255,255,255,.7) !important; }
        html.fl .view-btn.active { background: ${ACCENT}22 !important; border-color: ${ACCENT} !important; color: #fff !important; }
        html.fl .sort-select { padding: 8px 12px !important; border-radius: 10px !important; border: 1px solid rgba(255,255,255,.12) !important; background: #14161a !important; color: #fff !important; font-size: 13px !important; cursor: pointer !important; }
        html.fl .section-header { display: flex !important; align-items: center !important; justify-content: space-between !important; margin-bottom: 14px !important; }
        html.fl .file-count { font-size: 14px !important; font-weight: 700 !important; color: rgba(255,255,255,.8) !important; }
        html.fl .pagination { display: flex !important; align-items: center !important; gap: 8px !important; }
        html.fl .page-info { font-size: 13px !important; color: rgba(255,255,255,.55) !important; }
        html.fl .pagination .page-link { display: inline-flex !important; align-items: center !important; justify-content: center !important; min-width: 34px !important; height: 34px !important; padding: 0 10px !important; border-radius: 9px !important; border: 1px solid rgba(255,255,255,.12) !important; background: rgba(255,255,255,.04) !important; color: #cbd9ff !important; text-decoration: none !important; font-weight: 700 !important; transition: background .12s, border-color .12s !important; }
        html.fl .pagination .page-link:hover { background: ${ACCENT} !important; border-color: ${ACCENT} !important; color: #07101f !important; }
        html.fl .file-item .download-btn { position: absolute !important; top: 8px !important; right: 8px !important; width: 30px !important; height: 30px !important; border-radius: 9px !important; border: 0 !important; background: rgba(0,0,0,.6) !important; color: #fff !important; cursor: pointer !important; opacity: 0; transition: opacity .12s, background .12s; z-index: 2; }
        html.fl .file-item { position: relative !important; }
        html.fl .file-item:hover .download-btn { opacity: 1; }
        html.fl .file-item .download-btn:hover { background: ${ACCENT} !important; color: #07101f !important; }
        @media (hover: none) { html.fl .file-item .download-btn { opacity: 1; } }
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
    const prefs = Object.assign({ volume: 1, muted: false, rate: 1 }, (() => { try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; } })());
    let saveT; const saveP = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {} }, 250); };

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

    const svgi = inner => `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block">${inner}</svg>`;
    const PL_ICONS = {
        play: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M7 4.5v15a1 1 0 0 0 1.52.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>',
        pause: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>',
        volume: svgi('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>'),
        mute: svgi('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>'),
        expand: svgi('<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>'),
        download: svgi('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
        skipBack: svgi('<path d="M3 2v6h6"/><path d="M21 12A9 9 0 0 0 6 5.3L3 8"/>'),
        skipFwd: svgi('<path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>'),
        chevL: svgi('<path d="m15 18-6-6 6-6"/>'),
        chevR: svgi('<path d="m9 18 6-6-6-6"/>'),
        chevDown: svgi('<path d="m6 9 6 6 6-6"/>'),
        grid: svgi('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
        image: svgi('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'),
        video: svgi('<rect x="2" y="5" width="14" height="14" rx="2"/><path d="m22 8-6 4 6 4V8z"/>'),
        copy: svgi('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
        flag: svgi('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>'),
    };
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
        const fsb = mkAct(PL_ICONS.expand, "Tela cheia (f)", e => { e.stopPropagation(); goFs(); });
        const barPlay = mkAct(PL_ICONS.play, "Play/Pause (espaço)", e => { e.stopPropagation(); toggle(); }); barPlay.classList.add("fl-plc-barplay");
        const mkSkip = (ic, label, cb) => { const b = el("button", { type: "button", class: "fl-plc-act fl-plc-skip", title: label, "aria-label": label }); b.innerHTML = ic; b.appendChild(el("span", { class: "fl-plc-skipn" }, "5")); b.addEventListener("click", cb); return b; };
        const skipBack = mkSkip(PL_ICONS.skipBack, "Voltar 5s (←)", e => { e.stopPropagation(); seek(-5); });
        const skipFwd = mkSkip(PL_ICONS.skipFwd, "Avançar 5s (→)", e => { e.stopPropagation(); seek(5); });
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
        const leftc = el("div", { class: "fl-plc-left" }, barPlay, skipBack, skipFwd, volgrp, tEl);
        const rightc = el("div", { class: "fl-plc-right" }, speedWrap, dlb, fsb);
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

    /* ===================== MONTAGEM DO PLAYER NO STAGE ===================== */
    let playerMounted = false;
    function mountOwnPlayer(mid, src) {
        if (playerMounted || !src) return;
        playerMounted = true;
        mediaMounted = true;

        // Pausa qualquer player nativo em segundo plano
        document.querySelectorAll("#videoContainer video, .plyr video, video").forEach(v => {
            try { v.pause(); v.muted = true; } catch {}
        });

        const ac = new AbortController();
        const video = el("video", { class: "fl-video", playsinline: "", preload: "metadata" });
        video.volume = prefs.volume ?? 1;
        video.muted = prefs.muted ?? false;
        video.addEventListener("volumechange", () => {
            prefs.volume = video.volume;
            prefs.muted = video.muted;
            saveP();
        }, { signal: ac.signal });

        const host = el("div", { class: "fl-host fl-pl" }, video);
        buildPlayerControls(host, video, src, ac);
        mid.appendChild(host);

        video.src = src;
        try { video.load(); } catch (e) {}

        // Esconde o overlay nativo
        document.querySelectorAll("#videoPlayOverlay, .video-play-overlay").forEach(ov => ov.style.display = "none");
    }

    /* ===================== FOTO ZOOM/PAN REFINADO ===================== */
    function findPageImage() {
        const imgs = Array.from(document.querySelectorAll("img")).filter(img => {
            if (img.closest("header, .fl-stripwrap, .related-files-grid, .files-list")) return false;
            if (img.classList.contains("fl-strip-thumb")) return false;
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

    /* ===================== STAGE BUILDER ===================== */
    let mediaMounted = false;
    function relatedItems() {
        const grid = document.querySelector(".related-files-grid");
        return grid ? Array.from(grid.querySelectorAll(":scope > .related-file-item, :scope > a.related-file-item")) : [];
    }
    const isVidName = n => /\.(mp4|m4v|mov|webm|mkv|avi|ts|flv)$/i.test(n || "");
    function stripCard(name, href, thumb, isV, current) {
        const card = el("a", { class: "fl-strip-item" + (current ? " is-current" : ""), href, title: name });
        card.append(el("img", { class: "fl-strip-thumb", src: thumb || "", alt: "", loading: "lazy" }));
        const meta = el("div", { class: "fl-strip-meta" }); meta.insertAdjacentHTML("beforeend", isV ? PL_ICONS.video : PL_ICONS.image); meta.append(el("span", { class: "fl-strip-name" }, name));
        card.append(meta); return card;
    }
    function renderStrip(strip) {
        const items = relatedItems();
        const stage = strip.closest(".fl-stage");
        const cur = stage && stage._cur;
        const wrap = strip.closest(".fl-stripwrap");
        const sig = items.length + "|" + (cur ? "1" : "0");
        if (strip.dataset.sig === sig) return; strip.dataset.sig = sig;
        strip.textContent = "";
        const hrefs = [];
        let curCard = null;
        if (cur) { curCard = stripCard(cur.name, cur.href, cur.thumb, cur.isVid, true); strip.appendChild(curCard); if (cur.href) hrefs.push(cur.href); }
        items.forEach(it => {
            const href = it.getAttribute("href") || "#";
            const img = it.querySelector("img");
            const nameEl = it.querySelector(".related-file-name");
            const name = (nameEl ? nameEl.textContent : (img ? img.getAttribute("alt") : "") || "").trim();
            strip.appendChild(stripCard(name, href, (img && (img.getAttribute("src") || img.src)) || "", isVidName(name), false));
            if (href && href !== "#") hrefs.push(href);
        });
        if (wrap) wrap.style.display = strip.children.length ? "" : "none";
        if (stage) stage.classList.toggle("has-nav", hrefs.length > 1);
        strip._hrefs = hrefs;
        if (curCard) setTimeout(() => { try { const br = curCard.getBoundingClientRect(), sr = strip.getBoundingClientRect(); strip.scrollBy({ left: (br.left + br.width / 2) - (sr.left + sr.width / 2), behavior: "smooth" }); } catch (e) {} }, 80);
    }
    function navFile(strip, dir) {
        const hrefs = strip && strip._hrefs; if (!hrefs || hrefs.length < 2) return;
        const curPath = location.pathname;
        let i = hrefs.findIndex(h => { try { return new URL(h, location.origin).pathname === curPath; } catch (e) { return h === curPath; } });
        if (i < 0) i = 0;
        const next = hrefs[(i + dir + hrefs.length) % hrefs.length];
        if (next) location.href = next;
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

    function buildStage() {
        if (document.querySelector(".fl-stage")) return document.querySelector(".fl-stage");
        const h1 = document.querySelector("main h1") || Array.from(document.querySelectorAll("h1")).find(h => !h.closest("header"));
        if (!h1) return null;

        const name = (h1.textContent || "").trim();
        const sizeEl = document.querySelector("main .text-neutral-400") || (h1.parentElement && h1.parentElement.querySelector(".text-neutral-400"));
        const size = sizeEl ? (sizeEl.textContent || "").replace(/\s+/g, " ").trim() : "";
        const galleryA = document.querySelector('a[href*="/f/"]');
        const reportA = document.querySelector('a[href*="/report"], a[href*="report?file"]');
        const dlBtn = document.getElementById("downloadButton") || document.querySelector('a[id*="download" i], .download-btn');
        const isVid = findMediaKind() === "video";

        const stage = el("div", { class: "fl-stage " + (isVid ? "is-video" : "is-image") });

        // vrow
        const vrow = el("div", { class: "fl-vrow" });
        if (galleryA) { const b = el("a", { class: "fl-item", href: galleryA.href, title: "Ver a galeria do uploader" }); b.insertAdjacentHTML("beforeend", PL_ICONS.grid); b.append(el("span", null, "Galeria")); vrow.append(b, el("div", { class: "fl-vsep" })); }
        const nameEl = el("div", { class: "fl-name", title: name }); nameEl.insertAdjacentHTML("beforeend", isVid ? PL_ICONS.video : PL_ICONS.image); nameEl.append(el("span", null, name)); vrow.append(nameEl);
        const stats = el("div", { class: "fl-stats" });
        if (size) stats.append(el("span", { class: "fl-stat" }, size));
        stats.append(el("span", { class: "fl-stat" }, isVid ? "Vídeo" : "Imagem"));
        vrow.append(stats, el("div", { class: "fl-spacer" }));
        const dl = el("button", { class: "fl-item is-primary", title: "Baixar", onClick: () => { if (dlBtn) dlBtn.click(); else toast("Botão de download não encontrado"); } });
        dl.insertAdjacentHTML("beforeend", PL_ICONS.download); dl.append(el("span", null, "Download")); vrow.append(dl);
        const copyBtn = el("button", { class: "fl-item", title: "Copiar link", onClick: () => copyText(location.href).then(ok => toast(ok ? "Link copiado" : "Falha ao copiar")) }); copyBtn.insertAdjacentHTML("beforeend", PL_ICONS.copy); copyBtn.append(el("span", null, "Copiar")); vrow.append(copyBtn);
        const fsBtn = el("button", { class: "fl-item", title: "Tela cheia", onClick: () => { try { document.fullscreenElement ? document.exitFullscreen() : stage.requestFullscreen(); } catch (e) {} } }); fsBtn.insertAdjacentHTML("beforeend", PL_ICONS.expand); vrow.append(fsBtn);
        if (reportA) { vrow.append(el("div", { class: "fl-vsep" })); const b = el("a", { class: "fl-item", href: reportA.href, title: "Reportar" }); b.insertAdjacentHTML("beforeend", PL_ICONS.flag); vrow.append(b); }

        // mid
        const mid = el("div", { class: "fl-stage-mid" });
        const navPrev = el("button", { class: "fl-nav-side fl-nav-prev", title: "Anterior", onClick: e => { e.stopPropagation(); navFile(stage._strip, -1); } }); navPrev.insertAdjacentHTML("beforeend", PL_ICONS.chevL);
        const navNext = el("button", { class: "fl-nav-side fl-nav-next", title: "Próximo", onClick: e => { e.stopPropagation(); navFile(stage._strip, 1); } }); navNext.insertAdjacentHTML("beforeend", PL_ICONS.chevR);
        mid.append(navPrev, navNext);

        // strip
        const stripwrap = el("div", { class: "fl-stripwrap" });
        const strip = el("div", { class: "fl-strip" });
        if (localStorage.getItem("fl_strip_collapsed") === "1") stripwrap.classList.add("is-collapsed");
        const collapseBtn = el("button", { class: "fl-sbtn fl-collapse", title: "Recolher / expandir", onClick: () => { stripwrap.classList.toggle("is-collapsed"); try { localStorage.setItem("fl_strip_collapsed", stripwrap.classList.contains("is-collapsed") ? "1" : "0"); } catch (e) {} } }); collapseBtn.insertAdjacentHTML("beforeend", PL_ICONS.chevDown);
        const prevBtn = el("button", { class: "fl-sbtn", title: "Rolar p/ trás", onClick: () => strip.scrollBy({ left: -strip.clientWidth * 0.8, behavior: "smooth" }) }); prevBtn.insertAdjacentHTML("beforeend", PL_ICONS.chevL);
        const nextBtn = el("button", { class: "fl-sbtn", title: "Rolar p/ frente", onClick: () => strip.scrollBy({ left: strip.clientWidth * 0.8, behavior: "smooth" }) }); nextBtn.insertAdjacentHTML("beforeend", PL_ICONS.chevR);
        stripwrap.append(el("div", { class: "fl-stripbar" }, collapseBtn, el("span", { class: "fl-striplabel" }, "Arquivos do álbum"), el("div", { class: "fl-spacer" }), prevBtn, nextBtn), strip);
        stage._strip = strip;

        let uuid = "";
        if (reportA) { const m = reportA.href.match(/file=([a-f0-9-]{8,})/i); if (m) uuid = m[1]; }
        if (!uuid) { const u = Array.from(document.querySelectorAll("main .font-mono")).map(e => (e.textContent || "").trim()).find(t => /^[a-f0-9-]{32,}$/i.test(t)); if (u) uuid = u; }
        stage._cur = { name, href: location.pathname + location.search, thumb: uuid ? (location.origin + "/t/" + uuid) : "", isVid };

        stage.append(vrow, mid, stripwrap);
        document.body.insertBefore(stage, document.body.firstChild);
        document.documentElement.classList.add("fl-has-stage");

        renderStrip(strip);
        const grid = document.querySelector(".related-files-grid");
        if (grid) { try { new MutationObserver(() => renderStrip(strip)).observe(grid, { childList: true }); } catch (e) {} }
        return stage;
    }

    /* ===================== BOOT ===================== */
    function onReady(fn) {
        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
        else fn();
    }
    onReady(() => {
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
            if (++n > 25) {   // ~5s sem mídia → fallback
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
