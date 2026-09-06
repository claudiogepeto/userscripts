// ==UserScript==
// @name         Turbo — Native Player & Theater Stage (embed bypass)
// @namespace    turbo-theater
// @version      2.0.0
// @updateURL    https://raw.githubusercontent.com/claudiogepeto/userscripts/main/dist/turbo.user.js
// @downloadURL  https://raw.githubusercontent.com/claudiogepeto/userscripts/main/dist/turbo.user.js
// @description  Native player and theater stage for Turbo with signed-media playback, album navigation, search, and AMOLED styling.
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
// ==/UserScript==
(function () {
    "use strict";
    if (window.top !== window.self) return;   // ignora iframes/embeds (o /embed/ roda dentro de iframe)

    const PATH = location.pathname;
    const isVideo = /\/(?:v|embed)\//.test(PATH);
    const isAlbum = /\/a\//.test(PATH);
    document.documentElement.classList.add("tb");
    if (isVideo) document.documentElement.classList.add("tb-file");
    if (isAlbum) document.documentElement.classList.add("tb-album");

    const ACCENT = "#ef4444";   // vermelho do turbo
    const THUMB_BASE = "https://thumbs.saint2.cr/thumbs/";   // thumb do vídeo = {base}{id}.jpg

    const CSS = `
        /* ===================== TEMA AMOLED ===================== */
        html.tb, html.tb body { background: #0b0c0f !important; color: #e9e9ee !important; }
        html.tb ::selection { background: rgba(239,68,68,0.35); }
        html.tb ::-webkit-scrollbar { width: 10px; height: 10px; }
        html.tb ::-webkit-scrollbar-thumb { background: #2a2c33; border-radius: 8px; border: 2px solid #0b0c0f; }

        /* ===================== EARLY PAINT (vídeo): tampa preta até o stage montar ===================== */
        html.tb-file::before { content: ""; position: fixed; inset: 0; background: #0b0c0f; z-index: 98000; pointer-events: none; }
        html.tb-file.tb-fallback::before { display: none; }
        html.tb-has-stage, html.tb-has-stage body { overflow: hidden !important; }

        /* ===================== STAGE ===================== */
        .tb-stage { position: fixed; inset: 0; z-index: 99000; display: flex; flex-direction: column; background: #0b0c0f; color: #fff; font-family: Inter, system-ui, sans-serif; }
        .tb-stage * { box-sizing: border-box; }
        .tb-stage-mid { position: relative; flex: 1 1 auto; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 0 !important; overflow: hidden; }

        /* ===================== NOSSO PLAYER (estilo YouTube, accent vermelho #ef4444) ===================== */
        :root { --tb-accent: ${ACCENT}; }
        .tb-host { position: relative; width: 100%; height: 100%; max-width: 100%; max-height: 100%; background: #000; border-radius: 0 !important; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .tb-video { width: 100% !important; height: 100% !important; max-width: 100% !important; max-height: 100% !important; object-fit: contain !important; background: #000 !important; border-radius: 0 !important; outline: none; cursor: pointer; display: block; }
        .tb-stage-mid > iframe { width: 100% !important; height: 100% !important; border: 0; border-radius: 0 !important; background: #000; }

        .tb-spin { position: absolute; top: 50%; left: 50%; width: 42px; height: 42px; margin: -21px 0 0 -21px; border-radius: 50%; border: 3px solid rgba(255,255,255,.22); border-top-color: var(--tb-accent, #ef4444); animation: tb-spin .8s linear infinite; z-index: 4; pointer-events: none; }
        @keyframes tb-spin { to { transform: rotate(360deg); } }

        .tb-plc-flash { position: absolute; inset: 0; z-index: 2; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .2s ease; }
        .tb-pl:not(.is-playing):not(.is-buffering) .tb-plc-flash { opacity: 1; pointer-events: auto; cursor: pointer; }
        .tb-plc-flash button { border: 0; border-radius: 50%; cursor: pointer; padding: 0; background: rgba(0,0,0,.55); color: #fff; display: flex; align-items: center; justify-content: center; transition: transform .12s ease, background .12s ease; pointer-events: auto; }
        .tb-plc-flash button:hover { transform: scale(1.08); background: rgba(0,0,0,.72); }
        .tb-plc-play { width: 64px; height: 64px; }
        .tb-plc-play svg { width: 30px; height: 30px; display: block; margin-left: 3px; }
        @media (max-width: 600px) { .tb-plc-play { width: 54px; height: 54px; } .tb-plc-play svg { width: 26px; height: 26px; } }

        .tb-plc-seekflash { position: absolute; top: 50%; transform: translate(-50%, -50%); z-index: 3; padding: 10px 18px; border-radius: 24px; background: rgba(0,0,0,.75); color: #fff; font: 700 15px/1 Inter, sans-serif; pointer-events: none; opacity: 0; transition: opacity .15s ease; }
        .tb-plc-seekflash.on { opacity: 1; }

        .tb-pl.is-buffering::after { content: ""; position: absolute; top: 50%; left: 50%; width: 42px; height: 42px; margin: -21px 0 0 -21px; border-radius: 50%; border: 3px solid rgba(255,255,255,.22); border-top-color: var(--tb-accent, #ef4444); animation: tb-spin .8s linear infinite; z-index: 4; pointer-events: none; }

        .tb-plc-bottom { position: absolute; left: 0; right: 0; bottom: 0; z-index: 4; display: flex; flex-direction: column; padding: 0 14px 10px; background: linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.4) 65%, transparent 100%); opacity: 0; pointer-events: none; transition: opacity .18s ease; }
        .tb-host:hover .tb-plc-bottom, .tb-pl:not(.is-playing) .tb-plc-bottom { opacity: 1; pointer-events: auto; }
        @media (hover: none) { .tb-plc-bottom { opacity: 1; pointer-events: auto; } }

        .tb-plc-prog { position: relative; width: 100%; height: 16px; display: flex; align-items: center; cursor: pointer; touch-action: none; }
        .tb-plc-bar { position: relative; width: 100%; height: 4px; background: rgba(255,255,255,.25); border-radius: 2px; transition: height .1s ease; }
        .tb-plc-prog:hover .tb-plc-bar { height: 6px; }
        .tb-plc-buf { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: rgba(255,255,255,.4); border-radius: 2px; pointer-events: none; }
        .tb-plc-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: var(--tb-accent, #ef4444); border-radius: 2px; pointer-events: none; }
        .tb-plc-knob { position: absolute; right: -6px; top: 50%; transform: translateY(-50%) scale(0); width: 13px; height: 13px; border-radius: 50%; background: var(--tb-accent, #ef4444); box-shadow: 0 0 4px rgba(0,0,0,.5); transition: transform .1s ease; }
        .tb-plc-prog:hover .tb-plc-knob { transform: translateY(-50%) scale(1); }

        .tb-plc-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 2px; }
        .tb-plc-left, .tb-plc-right { display: flex; align-items: center; gap: 6px; }
        .tb-plc-act { display: inline-flex; align-items: center; justify-content: center; min-width: 34px; height: 34px; padding: 0 7px; border: 0; background: transparent; color: #fff; cursor: pointer; border-radius: 8px; font: 600 13px/1 Inter, sans-serif; transition: background .12s, color .12s; }
        .tb-plc-act:hover { background: rgba(255,255,255,.14); color: var(--tb-accent, #ef4444); }
        .tb-plc-act svg { width: 20px; height: 20px; display: block; }
        .tb-plc-barplay svg { width: 22px; height: 22px; }
        .tb-plc-skip { position: relative; }
        .tb-plc-skipn { position: absolute; font-size: 9px; font-weight: 800; top: 52%; left: 50%; transform: translate(-50%, -50%); color: #fff; text-shadow: 0 0 2px rgba(0,0,0,.5); }
        .tb-plc-time { font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,.88); padding: 0 6px; font-variant-numeric: tabular-nums; white-space: nowrap; }

        .tb-plc-vol { display: flex; align-items: center; gap: 4px; }
        .tb-plc-volbar { width: 0; height: 28px; display: flex; align-items: center; cursor: pointer; overflow: hidden; transition: width .18s ease, margin .18s ease; touch-action: none; }
        .tb-plc-vol:hover .tb-plc-volbar, .tb-plc-volbar:hover { width: 62px; margin-right: 4px; }
        .tb-plc-volfill { width: 100%; height: 4px; background: #fff; border-radius: 2px; position: relative; }

        .tb-plc-speedwrap { position: relative; }
        .tb-plc-speedmenu { position: absolute; bottom: 42px; right: 0; background: rgba(18,20,26,.96); border: 1px solid rgba(255,255,255,.12); border-radius: 10px; padding: 6px; display: none; flex-direction: column; gap: 2px; min-width: 86px; max-height: 240px; overflow-y: auto; box-shadow: 0 10px 28px rgba(0,0,0,.6); z-index: 10; }
        .tb-plc-speedmenu.open { display: flex; }
        .tb-plc-speeditem { border: 0; background: transparent; color: #fff; padding: 6px 10px; font: 600 12.5px/1 Inter, sans-serif; border-radius: 6px; cursor: pointer; text-align: left; }
        .tb-plc-speeditem:hover { background: rgba(255,255,255,.1); }
        .tb-plc-speeditem.on { color: var(--tb-accent, #ef4444); font-weight: 800; }

        /* ---- vrow (topbar) ---- */
        .tb-vrow { flex: 0 0 auto; display: flex; align-items: center; gap: 6px; padding: 9px 14px; background: #0e0f13; border-bottom: 1px solid rgba(255,255,255,.08); overflow-x: auto; overflow-y: hidden; white-space: nowrap; scrollbar-width: thin; }
        .tb-vrow::-webkit-scrollbar { height: 6px; } .tb-vrow::-webkit-scrollbar-thumb { background: #ef444455; border-radius: 4px; }
        .tb-name { flex: 0 1 auto; min-width: 60px; max-width: 36vw; display: inline-flex; align-items: center; gap: 8px; padding: 0 4px; font-weight: 600; }
        .tb-name svg { color: var(--tb-accent, #ef4444); flex: 0 0 auto; }
        .tb-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tb-stats { display: flex; align-items: center; gap: 14px; padding: 0 8px; flex: 0 0 auto; }
        .tb-stat { font-size: 12px; color: rgba(255,255,255,.62); font-weight: 600; }
        .tb-spacer { flex: 1 1 auto; min-width: 8px; }
        .tb-item { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 7px; padding: 8px 12px; border: 1px solid rgba(255,255,255,.1); border-radius: 9px; background: rgba(255,255,255,.05); color: #fff; font: 13px/1 Inter, system-ui, sans-serif; cursor: pointer; text-decoration: none; transition: background .12s, border-color .12s; }
        .tb-item:hover { background: rgba(255,255,255,.1); border-color: rgba(239,68,68,0.4); }
        .tb-item svg { width: 18px; height: 18px; color: var(--tb-accent, #ef4444); }
        .tb-item.is-primary { background: var(--tb-accent, #ef4444); border-color: var(--tb-accent, #ef4444); color: #1a0606; font-weight: 700; }
        .tb-item.is-primary svg { color: #1a0606; } .tb-item.is-primary:hover { filter: brightness(1.07); }
        .tb-vsep { flex: 0 0 auto; width: 1px; height: 22px; margin: 0 3px; background: rgba(255,255,255,.1); }

        /* ---- strip (footer) ---- */
        .tb-stripwrap { flex: 0 0 auto; display: flex; flex-direction: column; background: #0e0f13; border-top: 1px solid rgba(255,255,255,.08); }
        .tb-stripbar { display: flex; align-items: center; gap: 8px; padding: 6px 12px; }
        .tb-striplabel { font-size: 12px; font-weight: 600; color: rgba(255,255,255,.55); white-space: nowrap; }
        .tb-sbtn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 28px; padding: 0; flex: 0 0 auto; border: 1px solid rgba(255,255,255,.1); border-radius: 8px; background: rgba(255,255,255,.05); color: #fff; cursor: pointer; transition: background .12s, border-color .12s; }
        .tb-sbtn:hover { background: rgba(255,255,255,.1); border-color: rgba(239,68,68,0.4); } .tb-sbtn svg { width: 18px; height: 18px; color: var(--tb-accent, #ef4444); }
        .tb-stripwrap.is-collapsed .tb-strip { display: none; }
        .tb-stripwrap.is-collapsed .tb-collapse svg { transform: rotate(180deg); }
        .tb-strip { display: flex; gap: 8px; overflow-x: auto; overflow-y: hidden; padding: 4px 12px 12px; scrollbar-width: none; }
        .tb-strip::-webkit-scrollbar { display: none; height: 0; }
        .tb-strip-item { flex: 0 0 auto; width: 168px; display: flex; flex-direction: column; border: 1px solid rgba(255,255,255,.08); border-radius: 10px; overflow: hidden; background: rgba(255,255,255,.03); color: #fff; text-decoration: none; transition: border-color .12s, transform .12s; }
        .tb-strip-item:hover { border-color: rgba(239,68,68,0.55); transform: translateY(-2px); }
        .tb-strip-item.is-current { border-color: var(--tb-accent, #ef4444) !important; box-shadow: 0 0 0 2px var(--tb-accent, #ef4444), 0 0 14px -2px var(--tb-accent, #ef4444); }
        .tb-strip-item.is-current .tb-strip-name { color: #fff; font-weight: 700; }
        .tb-strip-thumb { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; background: #000; display: block; }
        .tb-strip-meta { display: flex; align-items: center; gap: 5px; padding: 7px 8px; }
        .tb-strip-meta svg { width: 13px; height: 13px; flex: 0 0 auto; color: var(--tb-accent, #ef4444); }
        .tb-strip-name { font-size: 11px; line-height: 1.25; color: rgba(255,255,255,.82); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; word-break: break-word; }
        @media (max-width: 600px) { .tb-strip-item { width: 130px; } .tb-name { max-width: 50vw; } }

        /* ---- setas prev/próximo ---- */
        .tb-nav-side { position: absolute; top: 50%; transform: translateY(-50%); z-index: 6; width: 46px; height: 46px; border: 0; border-radius: 50%; background: rgba(0,0,0,.5); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .18s ease, background .12s ease; }
        .tb-nav-prev { left: 16px; } .tb-nav-next { right: 16px; }
        .tb-stage.has-nav .tb-stage-mid:hover .tb-nav-side { opacity: 1; pointer-events: auto; }
        @media (hover: none) { .tb-stage.has-nav .tb-nav-side { opacity: .85; pointer-events: auto; } }
        .tb-nav-side:hover { background: rgba(0,0,0,.74); } .tb-nav-side:active { transform: translateY(-50%) scale(.92); }
        .tb-nav-side svg { width: 26px; height: 26px; display: block; }

        /* toast */
        .tb-toast { position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%) translateY(12px); z-index: 100001; padding: 10px 18px; border-radius: 20px; background: #14161a; border: 1px solid rgba(239,68,68,0.4); color: #fff; font: 13px Inter, system-ui, sans-serif; box-shadow: 0 6px 22px rgba(0,0,0,.6); opacity: 0; pointer-events: none; transition: opacity .2s, transform .2s; }
        .tb-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

        /* ===================== ÁLBUM (/a/): tabela → GRADE de cards ===================== */
        html.tb-album .max-w-6xl { max-width: min(100% - 32px, 1800px) !important; }
        html.tb-album #searchInput, html.tb-album #sortSelect { background: #14161a !important; border-color: rgba(255,255,255,.12) !important; color: #fff !important; }
        html.tb-album #btnDownloadAlbum { background: var(--tb-accent, #ef4444) !important; border-color: var(--tb-accent, #ef4444) !important; color: #1a0606 !important; }
        .tb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 16px; padding: 18px; }
        @media (max-width: 700px) { .tb-grid { grid-template-columns: repeat(auto-fill, minmax(46vw, 1fr)); gap: 12px; padding: 12px; } }
        .tb-card { position: relative; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; background: #111317; transition: transform .12s ease, border-color .12s ease, box-shadow .12s ease; }
        .tb-card:hover { transform: translateY(-3px); border-color: rgba(239,68,68,0.55); box-shadow: 0 10px 26px rgba(0,0,0,0.5); }
        .tb-card-link { display: block; color: inherit; text-decoration: none; }
        .tb-card-thumb { position: relative; width: 100%; aspect-ratio: 16 / 9; background: #000; overflow: hidden; }
        .tb-card-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .tb-card-play { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .12s ease; }
        .tb-card:hover .tb-card-play { opacity: 1; }
        .tb-card-play span { width: 50px; height: 50px; border-radius: 50%; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; }
        .tb-card-play svg { width: 24px; height: 24px; color: #fff; }
        .tb-card-body { padding: 10px 12px; }
        .tb-card-name { font-size: 13px; font-weight: 600; color: #e9e9ee; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .tb-card-meta { font-size: 11.5px; color: rgba(255,255,255,0.5); margin-top: 4px; }
        .tb-card-dl { position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; border-radius: 9px; background: rgba(0,0,0,.6); color: #fff; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .12s ease, background .12s ease; text-decoration: none; }
        .tb-card:hover .tb-card-dl { opacity: 1; }
        .tb-card-dl svg { width: 16px; height: 16px; }
        .tb-card-dl:hover { background: var(--tb-accent, #ef4444); color: #1a0606; }
        @media (hover: none) { .tb-card-dl, .tb-card-play { opacity: 1; } }
        .tb-empty { grid-column: 1 / -1; padding: 30px; text-align: center; color: rgba(255,255,255,0.5); }
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
    const IC = {
        play: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M7 4.5v15a1 1 0 0 0 1.52.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>',
        pause: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>',
        volume: svgi('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>'),
        mute: svgi('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>'),
        expand: svgi('<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>'),
        download: svgi('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
        copy: svgi('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
        flag: svgi('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>'),
        grid: svgi('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
        video: svgi('<rect x="2" y="5" width="14" height="14" rx="2"/><path d="m22 8-6 4 6 4V8z"/>'),
        chevL: svgi('<path d="m15 18-6-6 6-6"/>'),
        chevR: svgi('<path d="m9 18 6-6-6-6"/>'),
        chevDown: svgi('<path d="m6 9 6 6 6-6"/>'),
        skipBack: svgi('<path d="M3 2v6h6"/><path d="M21 12A9 9 0 0 0 6 5.3L3 8"/>'),
        skipFwd: svgi('<path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>'),
    };

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
            e.preventDefault();
            e.stopPropagation();
            if (clickT) return;
            clickT = setTimeout(() => { clickT = null; toggle(); }, 230);
        });
        on(video, "dblclick", e => {
            e.preventDefault();
            e.stopPropagation();
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
            e.preventDefault();
            e.stopPropagation();
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
            e.preventDefault();
            e.stopPropagation();
            const r = bar.getBoundingClientRect();
            seekTo(e.clientX, r);
            const mv = ev => seekTo(ev.clientX, r);
            const up = () => {
                document.removeEventListener("pointermove", mv);
                document.removeEventListener("pointerup", up);
            };
            document.addEventListener("pointermove", mv);
            document.addEventListener("pointerup", up);
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
            video.volume = v;
            video.muted = (v === 0);
            syncVol();
        };
        volbar.addEventListener("pointerdown", e => {
            e.preventDefault();
            e.stopPropagation();
            const r = volbar.getBoundingClientRect();
            setVolX(e.clientX, r);
            const mv = ev => setVolX(ev.clientX, r);
            const up = () => {
                document.removeEventListener("pointermove", mv);
                document.removeEventListener("pointerup", up);
            };
            document.addEventListener("pointermove", mv);
            document.addEventListener("pointerup", up);
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
        const fsb = mkAct(IC.expand, "Tela cheia (f)", e => { e.stopPropagation(); goFs(); });
        const barPlay = mkAct(IC.play, "Play/Pause (espaço)", e => { e.stopPropagation(); toggle(); });
        barPlay.classList.add("tb-plc-barplay");

        const mkSkip = (ic, label, cb) => {
            const b = el("button", { type: "button", class: "tb-plc-act tb-plc-skip", title: label, "aria-label": label });
            b.innerHTML = ic;
            b.appendChild(el("span", { class: "tb-plc-skipn" }, "5"));
            b.addEventListener("click", cb);
            return b;
        };
        const skipBack = mkSkip(IC.skipBack, "Voltar 5s (←)", e => { e.stopPropagation(); seek(-5); });
        const skipFwd = mkSkip(IC.skipFwd, "Avançar 5s (→)", e => { e.stopPropagation(); seek(5); });

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

        const leftc = el("div", { class: "tb-plc-left" }, barPlay, skipBack, skipFwd, volgrp, tEl);
        const rightc = el("div", { class: "tb-plc-right" }, speedWrap, dlb, fsb);
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
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
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

    /* ===================== PLAYER PRÓPRIO (mp4 assinado via /api/sign, com refresh antes do exp) ===================== */
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
    function mountIframe(mid) {   // fallback: usa o <iframe> de embed nativo do turbo
        const ifr = document.querySelector("iframe.saint-iframe, iframe[src*='/embed/']");
        if (ifr) {
            mid.querySelectorAll(".tb-spin").forEach(s => s.remove());
            ifr.style.borderRadius = "0 !important";
            mid.appendChild(ifr);
            return true;
        }
        const id = vidId();
        if (id) {
            mid.querySelectorAll(".tb-spin").forEach(s => s.remove());
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

            video.addEventListener("error", () => {   // url expirou/erro de rede → re-assina 1×
                if (recovering) return;
                recovering = true;
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
                    if (!mountIframe(mid)) toast("Falha ao carregar o vídeo");
                });
            }, { signal: ac.signal });

            const host = el("div", { class: "tb-host tb-pl" }, video);
            buildPlayerControls(host, video, u, id, ac);
            mid.appendChild(host);

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

    /* ===================== STRIP (relacionados "More videos") ===================== */
    function relatedItems() {
        // cards de vídeo relacionados = <a href="/v/{id}"> que contêm uma <img> (no aside "More videos")
        return Array.from(document.querySelectorAll('a[href*="/v/"]')).filter(a => a.querySelector("img") && !a.closest(".tb-stage"));
    }
    function stripCard(name, href, thumb, current) {
        const card = el("a", { class: "tb-strip-item" + (current ? " is-current" : ""), href, title: name });
        card.append(el("img", { class: "tb-strip-thumb", src: thumb || "", alt: "", loading: "lazy", referrerpolicy: "no-referrer" }));
        const meta = el("div", { class: "tb-strip-meta" });
        meta.insertAdjacentHTML("beforeend", IC.video);
        meta.append(el("span", { class: "tb-strip-name" }, name));
        card.append(meta);
        return card;
    }
    function renderStrip(strip) {
        const items = relatedItems();
        const stage = strip.closest(".tb-stage");
        const cur = stage && stage._cur;
        const wrap = strip.closest(".tb-stripwrap");
        const sig = items.length + "|" + (cur ? "1" : "0");
        if (strip.dataset.sig === sig) return;
        strip.dataset.sig = sig;
        strip.textContent = "";
        const hrefs = [];
        let curCard = null;
        if (cur) {
            curCard = stripCard(cur.name, cur.href, cur.thumb, true);
            strip.appendChild(curCard);
            if (cur.href) hrefs.push(cur.href);
        }
        items.forEach(a => {
            const href = a.getAttribute("href") || "#";
            const img = a.querySelector("img");
            const nameEl = a.querySelector(".font-semibold, .truncate");
            const name = (nameEl ? nameEl.textContent : (img ? img.getAttribute("alt") : "") || "").replace(/\s+/g, " ").trim();
            strip.appendChild(stripCard(name, href, (img && (img.getAttribute("src") || img.src)) || "", false));
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

    /* ===================== STAGE ===================== */
    let mediaMounted = false;
    function buildStage() {
        if (document.querySelector(".tb-stage")) return document.querySelector(".tb-stage");
        const id = vidId();
        const titleEl = document.getElementById("videoTitle");
        if (!id || !titleEl) return null;
        const name = (titleEl.textContent || "").replace(/\s+/g, " ").trim();
        const sizeEl = document.getElementById("videoSize");
        const viewsEl = document.getElementById("videoViews");
        const size = sizeEl ? (sizeEl.textContent || "").trim() : "";
        const views = viewsEl ? (viewsEl.textContent || "").trim() : "";
        const albumA = document.querySelector('a[href*="/a/"]');
        const dlA = document.getElementById("btnDownload") || document.querySelector('a[href*="/d/"]');
        const reportBtn = document.getElementById("btnReport");

        const stage = el("div", { class: "tb-stage is-video" });

        // ---- vrow ----
        const vrow = el("div", { class: "tb-vrow" });
        if (albumA) {
            const b = el("a", { class: "tb-item", href: albumA.href, title: "Ver o álbum" });
            b.insertAdjacentHTML("beforeend", IC.grid);
            b.append(el("span", null, "Álbum"));
            vrow.append(b, el("div", { class: "tb-vsep" }));
        }
        const nameEl = el("div", { class: "tb-name", title: name });
        nameEl.insertAdjacentHTML("beforeend", IC.video);
        nameEl.append(el("span", null, name));
        vrow.append(nameEl);

        const stats = el("div", { class: "tb-stats" });
        if (size) stats.append(el("span", { class: "tb-stat" }, size));
        if (views) stats.append(el("span", { class: "tb-stat" }, views));
        vrow.append(stats, el("div", { class: "tb-spacer" }));

        if (dlA) {
            const b = el("a", { class: "tb-item is-primary", href: dlA.href, title: "Baixar" });
            b.insertAdjacentHTML("beforeend", IC.download);
            b.append(el("span", null, "Download"));
            vrow.append(b);
        }
        const copyBtn = el("button", { class: "tb-item", title: "Copiar link", onClick: () => copyText(location.href).then(ok => toast(ok ? "Link copiado" : "Falha ao copiar")) });
        copyBtn.insertAdjacentHTML("beforeend", IC.copy);
        copyBtn.append(el("span", null, "Copiar"));
        vrow.append(copyBtn);

        const fsBtn = el("button", { class: "tb-item", title: "Tela cheia", onClick: () => { try { document.fullscreenElement ? document.exitFullscreen() : stage.requestFullscreen(); } catch (e) {} } });
        fsBtn.insertAdjacentHTML("beforeend", IC.expand);
        vrow.append(fsBtn);

        if (reportBtn) {
            vrow.append(el("div", { class: "tb-vsep" }));
            const b = el("button", { class: "tb-item", title: "Reportar", onClick: () => { try { reportBtn.click(); } catch (e) {} } });
            b.insertAdjacentHTML("beforeend", IC.flag);
            vrow.append(b);
        }

        // ---- mid ----
        const mid = el("div", { class: "tb-stage-mid" });
        const navPrev = el("button", { class: "tb-nav-side tb-nav-prev", title: "Anterior", onClick: e => { e.stopPropagation(); navFile(stage._strip, -1); } });
        navPrev.insertAdjacentHTML("beforeend", IC.chevL);
        const navNext = el("button", { class: "tb-nav-side tb-nav-next", title: "Próximo", onClick: e => { e.stopPropagation(); navFile(stage._strip, 1); } });
        navNext.insertAdjacentHTML("beforeend", IC.chevR);
        mid.append(navPrev, navNext);

        // ---- strip ----
        const stripwrap = el("div", { class: "tb-stripwrap" });
        const strip = el("div", { class: "tb-strip" });
        if (localStorage.getItem("tb_strip_collapsed") === "1") stripwrap.classList.add("is-collapsed");
        const collapseBtn = el("button", { class: "tb-sbtn tb-collapse", title: "Recolher / expandir", onClick: () => { stripwrap.classList.toggle("is-collapsed"); try { localStorage.setItem("tb_strip_collapsed", stripwrap.classList.contains("is-collapsed") ? "1" : "0"); } catch (e) {} } });
        collapseBtn.insertAdjacentHTML("beforeend", IC.chevDown);
        const prevBtn = el("button", { class: "tb-sbtn", title: "Rolar p/ trás", onClick: () => strip.scrollBy({ left: -strip.clientWidth * 0.8, behavior: "smooth" }) });
        prevBtn.insertAdjacentHTML("beforeend", IC.chevL);
        const nextBtn = el("button", { class: "tb-sbtn", title: "Rolar p/ frente", onClick: () => strip.scrollBy({ left: strip.clientWidth * 0.8, behavior: "smooth" }) });
        nextBtn.insertAdjacentHTML("beforeend", IC.chevR);
        stripwrap.append(el("div", { class: "tb-stripbar" }, collapseBtn, el("span", { class: "tb-striplabel" }, "Vídeos do álbum"), el("div", { class: "tb-spacer" }), prevBtn, nextBtn), strip);
        stage._strip = strip;
        stage._cur = { name, href: location.pathname + location.search, thumb: THUMB_BASE + id + ".jpg" };

        stage.append(vrow, mid, stripwrap);
        document.body.insertBefore(stage, document.body.firstChild);
        document.documentElement.classList.add("tb-has-stage");

        mountVideo(mid, id);

        renderStrip(strip);
        const aside = document.querySelector("aside") || document.body;
        try { new MutationObserver(() => renderStrip(strip)).observe(aside, { childList: true, subtree: true }); } catch (e) {}
        return stage;
    }

    /* ===================== ÁLBUM (/a/): tabela → grade de cards (busca/sort reimplementados no grid) ===================== */
    function buildAlbumGrid() {
        const tbody = document.getElementById("fileTbody");
        if (!tbody || document.querySelector(".tb-grid")) return !!document.querySelector(".tb-grid");
        const rows = Array.from(tbody.querySelectorAll("tr.file-row"));
        if (!rows.length) return false;
        const data = rows.map(row => {
            const a = row.querySelector("a[data-thumb]") || row.querySelector('a[href*="/v/"]');
            const id = row.dataset.id || "";
            const sizeTd = row.querySelector(".file-size");
            return {
                id,
                name: row.dataset.name || (a ? a.textContent.replace(/\s+/g, " ").trim() : "") || id,
                size: parseInt(row.dataset.size || "0", 10) || 0,
                sizeText: sizeTd ? (sizeTd.textContent || "").trim() : "",
                views: parseInt(row.dataset.views || "0", 10) || 0,
                href: (a && a.getAttribute("href")) || ("/v/" + id),
                thumb: (a && a.getAttribute("data-thumb")) || (THUMB_BASE + id + ".jpg"),
                type: (row.children[2] && (row.children[2].textContent || "").trim()) || "mp4",
            };
        });
        const grid = el("div", { class: "tb-grid" });
        const table = tbody.closest("table") || tbody;
        const wrap = table.closest(".overflow-x-auto") || table;
        wrap.style.display = "none";
        wrap.insertAdjacentElement("afterend", grid);
        const cards = data.map(d => {
            const card = el("div", { class: "tb-card" });
            const link = el("a", { class: "tb-card-link", href: d.href });
            const th = el("div", { class: "tb-card-thumb" });
            const img = el("img", { src: d.thumb, alt: "", loading: "lazy", referrerpolicy: "no-referrer" });
            img.addEventListener("error", function () { this.style.visibility = "hidden"; }, { once: true });
            const play = el("div", { class: "tb-card-play" });
            play.insertAdjacentHTML("beforeend", "<span>" + IC.video + "</span>");
            th.append(img, play);
            const body = el("div", { class: "tb-card-body" });
            body.append(el("div", { class: "tb-card-name", title: d.name }, d.name));
            body.append(el("div", { class: "tb-card-meta" }, [d.type, d.sizeText, d.views ? (d.views + " views") : ""].filter(Boolean).join(" · ")));
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
            if (!list.length) { grid.append(el("div", { class: "tb-empty" }, "Nada encontrado")); return; }
            list.forEach(c => grid.append(c.card));
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
        if (isAlbum) {   // galeria: tabela → grade de cards (as linhas podem renderizar após o load)
            let n = 0; const aid = setInterval(() => { if (buildAlbumGrid() || ++n > 20) clearInterval(aid); }, 300);
            buildAlbumGrid();
            return;
        }
        if (!isVideo) return;   // home: só tema/CSS
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
