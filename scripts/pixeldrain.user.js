// ==UserScript==
// @name         Pixeldrain — Mirror Bypass & Theater Player (AMOLED)
// @namespace    pixeldrain-mirror-player
// @version      14.16.1
// @description  Refaz o pixeldrain.com em cima de MIRRORS (proxy Cloudflare/espelho), contornando o limite de 6 GB/dia (que é por IP), e redesenha a interface com Stage estilo YouTube AMOLED, Sidebar de Playlist lateral com abas e placeholders, visualizador de texto integrado, controles modernizados no player e agrupamento por tipo de mídia.
// @author       claudiogepeto
// @match        https://pixeldrain.com/*
// @noframes
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// ==/UserScript==

(function () {
    "use strict";
    if (window.top !== window.self) return;

    /* ==================================================================== * MIRRORS POOL & CONFIG */
    /* Ordem = prioridade:
       1º Oficial (pixeldrain.com): dentro da cota serve direto, com velocidade máxima; ao estourar 6 GB/dia, dá 403 instantâneo.
       2º Worker próprio (localStorage pdx_worker): roda no IP da Cloudflare → contorna o bloqueio por IP.
       3º Load-balancer Cloudflare (cdn.pixeldrain.eu.cc) e nós dinâmicos via proxy.json.
       4º pixeldra.in (mesmo backend, alternativo). */
    const OFFICIAL = {
        name: "Oficial",
        file: id => `https://pixeldrain.com/api/file/${id}`,
        dl: id => `https://pixeldrain.com/api/file/${id}?download`,
        zip: lid => `https://pixeldrain.com/api/list/${lid}/zip`
    };
    const CF_LB = {
        name: "cdn.pixeldrain.eu.cc",
        file: id => `https://cdn.pixeldrain.eu.cc/${id}`,
        dl: id => `https://cdn.pixeldrain.eu.cc/${id}?download`,
        zip: lid => `https://cdn.pixeldrain.eu.cc/zip/${lid}`
    };
    const STATIC_MIRRORS = [
        CF_LB,
        {
            name: "pixeldra.in",
            file: id => `https://pixeldra.in/api/file/${id}`,
            dl: id => `https://pixeldra.in/api/file/${id}?download`,
            zip: lid => `https://pixeldra.in/api/list/${lid}/zip`
        }
    ];

    const PROXY_JSON = "https://pixeldrain-bypass.gamedrive.org/api/proxy.json";
    const PCACHE_KEY = "pdx_proxies", PCACHE_TS = "pdx_proxies_ts", PCACHE_TTL = 24 * 3600 * 1000;
    const VIDEO_EXT = /\.(mp4|m4v|webm|mkv|mov|avi|flv|f4v|wmv|mpe?g|m2ts|ts|ogv|3gp|divx|qt)$/i;
    const IMAGE_EXT = /\.(jpe?g|jfif|png|gif|webp|avif|bmp|svg|heic|heif|tiff?|ico)$/i;
    const TEXT_EXT = /\.(txt|md|nfo|log|json|csv|py|js|html|xml|css|sh|bat)$/i;
    const ALIVE = ["loadedmetadata", "loadeddata", "canplay", "progress", "playing"];
    const WATCHDOG_MS = 12000;
    const PREFS_KEY = "pdx_prefs";

    /* Links padrão do site */
    const SITE_LINKS = [
        { href: "/home", label: "Home", icon: "home" },
        { href: "/user/filemanager#files", label: "Meus arquivos", icon: "image" },
        { href: "/user/filemanager#lists", label: "Meus álbuns", icon: "photo_library" },
        { href: "/home#pro", label: "Premium", icon: "star" },
        { href: "/api", label: "API", icon: "code" }
    ];

    /* ------------------------------------------------------------------ * Helpers */
    function addStyle(css) {
        if (typeof GM_addStyle === "function") return GM_addStyle(css);
        const s = document.createElement("style"); s.textContent = css;
        (document.head || document.documentElement).appendChild(s); return s;
    }
    function debounce(fn, ms) { let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; }
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
    const icon = name => el("i", { class: "icon" }, name);
    const hide = n => { if (n && n.style && n.style.display !== "none") { n.dataset.pdxHidden = "1"; n.style.display = "none"; } };
    function hideForeign(parent, keep) {
        if (!parent) return;
        for (const c of Array.from(parent.children)) {
            if (!c.classList) { hide(c); continue; }
            let mine = false;
            for (const k of c.classList) { if (k.indexOf("pdx-") === 0) { mine = true; break; } }
            if (mine) continue;
            if (keep && keep.some(s => c.classList.contains(s))) continue;
            hide(c);
        }
    }
    const log = (...a) => { try { console.info("[pdx]", ...a); } catch {} };
    function fmtSize(b) {
        b = +b || 0;
        const u = ["B", "KB", "MB", "GB", "TB"];
        let i = 0;
        while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
        return (i === 0 ? b : b.toFixed(b < 10 ? 2 : b < 100 ? 1 : 0)) + " " + u[i];
    }
    function copyText(s) {
        try { return navigator.clipboard.writeText(s); } catch {}
        try { const t = el("textarea", { style: { position: "fixed", opacity: "0" } }); t.value = s; document.body.append(t); t.select(); document.execCommand("copy"); t.remove(); } catch {}
        return Promise.resolve();
    }
    function downloadText(name, content) {
        const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
        const a = el("a", { href: url, download: name }); document.body.append(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
    }
    let toastT;
    function toast(msg) {
        let t = document.querySelector(".pdx-toast");
        if (!t) { t = el("div", { class: "pdx-toast" }); document.body.append(t); }
        t.textContent = msg; t.classList.add("show");
        clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 1800);
    }
    function goFullscreen() {
        const target = (cur && cur.host) || document.querySelector(".pdx-host") || document.querySelector(".file_preview") || document.documentElement;
        const req = target.requestFullscreen || target.webkitRequestFullscreen || target.webkitEnterFullscreen || target.mozRequestFullScreen || target.msRequestFullscreen;
        if (!req) return toast("Tela cheia indisponível");
        try { const p = req.call(target); if (p && p.catch) p.catch(() => {}); } catch {}
    }

    /* ------------------------------------------------------------------ * Prefs */
    const prefs = Object.assign({
        volume: 1,
        muted: false,
        rate: 1,
        loop: false,
        autoplay: true,
        sidebarCollapsed: false,
        groupByType: false,
        sidebarTab: "all",
        sidebarSort: "default",
        gallerySort: "default",
        gallerySortDir: "desc"
    }, (() => {
        try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; }
    })());
    const saveP = debounce(() => { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {} }, 250);

    /* ------------------------------------------------------------------ * Mirrors Pool */
    let MIRRORS = [OFFICIAL, ...STATIC_MIRRORS];
    let prefIdx = 0, gIdx = 0, dynBases = [];
    const at = i => MIRRORS[((i % MIRRORS.length) + MIRRORS.length) % MIRRORS.length];
    const M = () => at(gIdx);

    function userMirror() {
        try {
            const b = (localStorage.getItem("pdx_worker") || "").trim().replace(/\/+$/, "");
            if (!/^https?:\/\//.test(b)) return [];
            return [{
                name: "Worker Pessoal",
                file: id => `${b}/api/file/${id}`,
                dl: id => `${b}/api/file/${id}?download`,
                zip: lid => `${b}/api/list/${lid}/zip`
            }];
        } catch { return []; }
    }

    function rebuildMirrors() {
        const dyn = dynBases.filter(Boolean).map(b => ({
            name: b,
            file: id => `https://${b}/${id}`,
            dl: id => `https://${b}/${id}?download`,
            zip: lid => `https://${b}/zip/${lid}`
        }));
        MIRRORS = [OFFICIAL, ...userMirror(), ...STATIC_MIRRORS, ...dyn];
    }
    function setDynamic(bases) { dynBases = (bases || []).filter(Boolean); rebuildMirrors(); }
    rebuildMirrors();

    async function loadProxies() {
        let cached = []; try { cached = JSON.parse(localStorage.getItem(PCACHE_KEY) || "[]"); } catch {}
        const ts = +localStorage.getItem(PCACHE_TS) || 0;
        if (cached.length && Date.now() - ts < PCACHE_TTL) { setDynamic(cached); }
        else try {
            const r = await fetch(PROXY_JSON, { cache: "no-store" });
            const list = ((await r.json()).proxies || []).map(p => String(p).replace(/^https?:\/\//, "").replace(/\/+$/, "")).filter(Boolean);
            if (list.length) {
                localStorage.setItem(PCACHE_KEY, JSON.stringify(list));
                localStorage.setItem(PCACHE_TS, String(Date.now()));
                setDynamic(list);
            } else if (cached.length) setDynamic(cached);
        } catch (e) {
            if (cached.length) setDynamic(cached);
            log("proxy.json falhou", e);
        }
        refreshChips();
    }

    /* ------------------------------------------------------------------ * Parser de Datas e Títulos */
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
            return `${dia}/${mes}/${ano} ${hora}:${min}`;
        } catch {
            return String(isoOrDate);
        }
    }

    /* ------------------------------------------------------------------ * Alvo / Álbum / Metadados */
    function viewerData() {
        try { if (typeof unsafeWindow !== "undefined" && unsafeWindow.viewer_data) return unsafeWindow.viewer_data; } catch {}
        try { return window.viewer_data || null; } catch { return null; }
    }
    function currentIndex() { const m = location.hash.match(/item=(\d+)/); return m ? +m[1] : 0; }
    function currentFile() {
        const vd = viewerData();
        if (vd && vd.api_response) {
            let f = null;
            if (Array.isArray(vd.api_response.files)) f = vd.api_response.files[currentIndex()] || vd.api_response.files[0] || null;
            else if (vd.api_response.id) f = vd.api_response;
            if (f) {
                const fname = f.name || f.id;
                const extractedDate = extractDateFromTitle(fname);
                const displayTitle = cleanTitleWithoutDate(fname, extractedDate);
                return Object.assign({}, f, { name: fname, displayTitle, extractedDate });
            }
        }
        let id = null, name = "", mime = "";
        const img = document.querySelector('.file_selected img[src*="/api/file/"]') || document.querySelector('.file_preview img[src*="/api/file/"]');
        if (img) { const mm = (img.getAttribute("src") || "").match(/\/api\/file\/([A-Za-z0-9]+)/); if (mm) id = mm[1]; name = img.getAttribute("alt") || ""; }
        if (!id) { const mu = location.pathname.match(/\/(?:u|d|file|api\/file)\/([A-Za-z0-9]+)/); if (mu) id = mu[1]; }
        if (!id) return null;
        if (!name) { const h = document.querySelector(".file_viewer_headerbar_title"); if (h) name = h.textContent.trim().split("\n").pop().trim(); }
        document.querySelectorAll(".file_preview td").forEach(td => { const mm = (td.textContent || "").match(/[a-z]+\/[a-z0-9.+-]+/i); if (mm) mime = mm[0]; });
        const fname = name || id;
        const extractedDate = extractDateFromTitle(fname);
        const displayTitle = cleanTitleWithoutDate(fname, extractedDate);
        return { id, name: fname, displayTitle, extractedDate, mime_type: mime };
    }

    const isImageFile = f => !!f && ((f.mime_type && /^image\//i.test(f.mime_type)) || (IMAGE_EXT.test(f.name || "") && !(f.mime_type && /^video\//i.test(f.mime_type))));
    const isVideoFile = f => !!f && !isImageFile(f) && ((f.mime_type && /^video\//i.test(f.mime_type)) || VIDEO_EXT.test(f.name || "") || f.allow_video_player === true);
    const isTextFile = f => !!f && (TEXT_EXT.test(f.name || "") || (f.mime_type && /^text\//i.test(f.mime_type)));

    function getFileKind(f) {
        if (!f) return "other";
        if (isVideoFile(f)) return "video";
        if (isImageFile(f)) return "image";
        if (isTextFile(f)) return "text";
        const name = (f.name || "").toLowerCase();
        if (/\.(zip|rar|7z|tar|gz|bz2|iso)$/i.test(name)) return "archive";
        if (/\.(mp3|flac|wav|m4a|ogg|aac|opus)$/i.test(name) || (f.mime_type && /^audio\//i.test(f.mime_type))) return "audio";
        return "other";
    }

    function albumInfo() {
        const vd = viewerData();
        if (vd && vd.type === "list" && vd.api_response && Array.isArray(vd.api_response.files)) {
            return {
                lid: vd.api_response.id || (location.pathname.match(/\/l\/([A-Za-z0-9]+)/) || [])[1],
                title: vd.api_response.title || "",
                files: vd.api_response.files.map((f, idx) => {
                    const fname = f.name || f.id;
                    const extractedDate = extractDateFromTitle(fname);
                    const displayTitle = cleanTitleWithoutDate(fname, extractedDate);
                    return {
                        id: f.id,
                        name: fname,
                        displayTitle,
                        extractedDate,
                        size: f.size || 0,
                        views: f.views ?? null,
                        downloads: f.downloads ?? null,
                        date_upload: f.date_upload || "",
                        mime_type: f.mime_type || "",
                        allow_video_player: f.allow_video_player,
                        origIdx: idx
                    };
                })
            };
        }
        return null;
    }

    function inGallery() { return !!document.querySelector(".file_viewer .gallery") || location.hash.replace(/^#/, "") === "gallery"; }

    /* ==================================================================== * SVG ICONS */
    const svgi = inner => `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block">${inner}</svg>`;
    const PL_ICONS = {
        play: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M7 4.5v15a1 1 0 0 0 1.52.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>',
        pause: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>',
        volume: svgi('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>'),
        mute: svgi('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>'),
        expand: svgi('<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>'),
        download: svgi('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
        chevL: svgi('<path d="m15 18-6-6 6-6"/>'),
        chevR: svgi('<path d="m9 18 6-6-6-6"/>'),
        skipBack: svgi('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>'),
        skipFwd: svgi('<path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>'),
        prevTrack: svgi('<polygon points="19 20 9 12 19 4 19 20" fill="currentColor"/><line x1="5" y1="19" x2="5" y2="5" stroke-width="2.5"/>'),
        nextTrack: svgi('<polygon points="5 4 15 12 5 20 5 4" fill="currentColor"/><line x1="19" y1="5" x2="19" y2="19" stroke-width="2.5"/>'),
        playlist: svgi('<line x1="3" y1="6" x2="15" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="11" y2="18"/><polygon points="17,14 22,17 17,20" fill="currentColor" stroke="none"/>'),
        mirror: svgi('<path d="m17 2 4 4-4 4"/><path d="M3 6h18"/><path d="m7 22-4-4 4-4"/><path d="M21 18H3"/>'),
        check: svgi('<polyline points="20 6 9 17 4 12"/>'),
        close: svgi('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
        copy: svgi('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'),
        share: svgi('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>'),
        flag: svgi('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>'),
        pip: svgi('<rect x="2" y="4" width="20" height="16" rx="2"/><rect x="12" y="10" width="8" height="8" rx="1"/>'),
        prev: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M6 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1zm12.44 1.34a1 1 0 0 0-1.44-.88l-9 5.5a1 1 0 0 0 0 1.72l9 5.5A1 1 0 0 0 19 17.5v-11a1 1 0 0 0-.56-.86z"/></svg>',
        next: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M18 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1zM5.56 6.66a1 1 0 0 0-1.56.84v11a1 1 0 0 0 1.56.84l9-5.5a1 1 0 0 0 0-1.68l-9-5.5z"/></svg>',
        repeat: svgi('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'),
        fileText: svgi('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>'),
        film: svgi('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/>'),
        image: svgi('<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>'),
        archive: svgi('<polyline points="21 8 21 21 3 21 3 8"/><rect width="22" height="5" x="1" y="3" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/>'),
        search: svgi('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
        grid: svgi('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>')
    };

    function kindSvg(k) {
        if (k === "video") return PL_ICONS.film;
        if (k === "image") return PL_ICONS.image;
        if (k === "text") return PL_ICONS.fileText;
        if (k === "archive") return PL_ICONS.archive;
        return PL_ICONS.fileText;
    }

    /* ==================================================================== * REVISÃO DO MIRROR: GERENCIADOR E NOTIFICAÇÕES */
    function showMirrorWarn(msg, autoCloseMs = 4500) {
        let w = document.querySelector(".pdx-mirror-warn");
        if (!w) {
            w = el("div", { class: "pdx-mirror-warn" });
            document.body.appendChild(w);
        }
        w.innerHTML = `<span class="pdx-mirror-warn-t">${msg}</span>`;
        const btn = el("button", { class: "pdx-mirror-warn-x", title: "Fechar", onClick: () => w.classList.remove("show") });
        btn.innerHTML = PL_ICONS.close;
        w.appendChild(btn);
        w.classList.add("show");
        clearTimeout(w._t);
        if (autoCloseMs) w._t = setTimeout(() => w.classList.remove("show"), autoCloseMs);
    }

    function applyMirror(media) {
        if (!cur || cur.media !== media) return;
        cur.fail.style.display = "none";
        const mirror = M();
        log("→ Aplicando mirror:", mirror.name, cur.id);

        if (cur.kind === "video") {
            const t = media.currentTime, paused = media.paused;
            media.src = mirror.file(cur.id);
            try { media.load(); } catch {}
            if (t > 0) {
                media.addEventListener("loadedmetadata", function once() {
                    if (cur) cur.restoring = true;
                    try {
                        media.currentTime = t;
                        if (!paused) media.play().catch(() => {});
                    } catch {}
                    media.addEventListener("seeked", () => { if (cur) cur.restoring = false; }, { once: true });
                }, { once: true });
            }
        } else if (cur.kind === "image") {
            media.src = mirror.file(cur.id);
        } else if (cur.kind === "text") {
            loadTextContent(cur.host, cur.file);
        }

        armWatchdog();
        refreshChips();
        setMirrorLoading(true);
    }

    function armWatchdog() {
        if (!cur) return;
        clearTimeout(cur.watchdog);
        cur.alive = false;
        cur.watchdog = setTimeout(() => {
            if (cur && !cur.alive) {
                log("Watchdog disparou para", M().name);
                nextMirror("Tempo limite excedido");
            }
        }, WATCHDOG_MS);
    }

    function nextMirror(reason = "Erro no carregamento") {
        if (!cur) return;
        const oldName = M().name;
        if (gIdx < MIRRORS.length - 1) {
            gIdx++;
            showMirrorWarn(`${reason} em ${oldName}. Alternando para mirror: <b>${M().name}</b>`);
            applyMirror(cur.media);
        } else {
            clearTimeout(cur.watchdog);
            cur.fail.style.display = "flex";
            setMirrorLoading(false);
            showMirrorWarn("Todos os mirrors falharam para este arquivo.", 6000);
        }
    }

    function pickMirror(i) {
        prefIdx = gIdx = ((i % MIRRORS.length) + MIRRORS.length) % MIRRORS.length;
        if (cur) applyMirror(cur.media);
        refreshChips();
        toast("Mirror: " + M().name);
    }

    function promptCustomWorker() {
        const curW = localStorage.getItem("pdx_worker") || "";
        const val = prompt("URL do seu Cloudflare Worker pessoal (ex: https://meu-worker.usuario.workers.dev):", curW);
        if (val !== null) {
            const clean = val.trim().replace(/\/+$/, "");
            if (clean) localStorage.setItem("pdx_worker", clean);
            else localStorage.removeItem("pdx_worker");
            rebuildMirrors();
            refreshChips();
            toast(clean ? "Worker configurado!" : "Worker removido.");
            if (cur) applyMirror(cur.media);
        }
    }

    function refreshChips() {
        document.querySelectorAll(".pdx-mirror-name").forEach(m => { m.textContent = "Mirror"; });
        document.querySelectorAll(".pdx-player-mirror-name").forEach(m => { m.textContent = "Mirror"; });
    }
    function setMirrorLoading(on) {
        document.querySelectorAll(".pdx-mirror, .pdx-player-mirror-btn").forEach(c => c.classList.toggle("pdx-loading", !!on));
    }

    /* DROPDOWN DE MIRROR MODERNO (estilo Bunkr) */
    let mirrorCloser = null;
    function closeMirrorMenu() {
        document.querySelectorAll(".pdx-mirror-wrap, .pdx-player-mirror").forEach(w => w.classList.remove("is-open"));
        document.querySelectorAll(".pdx-mirror-menu").forEach(m => { m.hidden = true; });
        if (mirrorCloser) { document.removeEventListener("pointerdown", mirrorCloser, true); mirrorCloser = null; }
    }

    function openMirrorMenu(wrap, alignRight = false) {
        const btn = wrap.querySelector(".pdx-mirror, .pdx-player-mirror-btn");
        const menu = wrap.querySelector(".pdx-mirror-menu");
        if (!btn || !menu) return;
        menu.textContent = "";

        const head = el("div", { class: "pdx-mirror-menu-h" });
        head.innerHTML = `Mirrors disponíveis · <b>${M().name}</b>`;
        menu.appendChild(head);

        const grid = el("div", { class: "pdx-mirror-grid" });
        MIRRORS.forEach((mir, i) => {
            const isCur = i === gIdx;
            const item = el("button", {
                type: "button",
                class: "pdx-mirror-grid-item" + (isCur ? " is-current" : ""),
                title: mir.name,
                onClick: e => { e.stopPropagation(); pickMirror(i); closeMirrorMenu(); }
            });
            item.innerHTML = `<span class="pdx-mirror-item-icon">${isCur ? PL_ICONS.check : PL_ICONS.mirror}</span><span class="pdx-mirror-item-title">${mir.name}</span>`;
            grid.appendChild(item);
        });
        menu.appendChild(grid);

        // Ações extras
        const actions = el("div", { class: "pdx-mirror-actions" });
        const nextBtn = el("button", {
            type: "button",
            class: "pdx-mirror-action-btn",
            onClick: e => { e.stopPropagation(); nextMirror("Troca manual"); closeMirrorMenu(); }
        });
        nextBtn.innerHTML = `${PL_ICONS.chevR} <span>Próximo mirror (failover)</span>`;

        const workerBtn = el("button", {
            type: "button",
            class: "pdx-mirror-action-btn",
            onClick: e => { e.stopPropagation(); closeMirrorMenu(); promptCustomWorker(); }
        });
        workerBtn.innerHTML = `<i>⚙</i> <span>Configurar Worker Cloudflare...</span>`;
        actions.append(nextBtn, workerBtn);
        menu.appendChild(actions);

        menu.hidden = false;
        wrap.classList.add("is-open");

        const r = btn.getBoundingClientRect();
        menu.style.minWidth = "280px";
        if (alignRight) {
            menu.style.right = (window.innerWidth - r.right) + "px";
            menu.style.left = "auto";
        } else {
            menu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 300)) + "px";
            menu.style.right = "auto";
        }
        const mh = menu.offsetHeight || 260;
        menu.style.top = ((r.bottom + 6 + mh > window.innerHeight) ? Math.max(8, r.top - 6 - mh) : r.bottom + 6) + "px";

        mirrorCloser = ev => { if (!wrap.contains(ev.target)) closeMirrorMenu(); };
        document.addEventListener("pointerdown", mirrorCloser, true);
    }

    function toggleMirrorMenu(wrap, alignRight = false) {
        const m = wrap.querySelector(".pdx-mirror-menu");
        if (m && m.hidden) openMirrorMenu(wrap, alignRight); else closeMirrorMenu();
    }

    function buildMirrorChip() {
        const chev = icon("expand_more"); chev.classList.add("pdx-mirror-chev");
        const wrap = el("div", { class: "pdx-mirror-wrap" });
        const btn = el("button", {
            type: "button",
            class: "pdx-item pdx-mirror",
            title: "Mirror atual (origem do stream) — clique para escolher ou configurar",
            onClick: e => { e.stopPropagation(); toggleMirrorMenu(wrap, false); }
        },
            el("span", { class: "pdx-mirror-spin", "aria-hidden": "true" }),
            icon("dns"),
            el("span", { class: "pdx-mirror-name" }, "Mirror"),
            chev
        );
        wrap.append(btn, el("div", { class: "pdx-mirror-menu", hidden: "" }));
        return wrap;
    }

    function buildPlayerMirrorWidget() {
        const wrap = el("div", { class: "pdx-player-mirror" });
        const btn = el("button", {
            type: "button",
            class: "pdx-player-mirror-btn",
            title: "Trocar de mirror (Cloudflare / Oficial)",
            onClick: e => { e.stopPropagation(); toggleMirrorMenu(wrap, true); }
        });
        btn.innerHTML = `<span class="pdx-mirror-spin" aria-hidden="true"></span>${PL_ICONS.mirror}<span class="pdx-player-mirror-name">Mirror</span>`;
        const menu = el("div", { class: "pdx-mirror-menu", hidden: "" });
        wrap.append(btn, menu);
        return wrap;
    }

    /* ==================================================================== * (1) PLAYER MODERNO ESTILO YOUTUBE */
    function hideNative(preview) {
        for (const c of Array.from(preview.children)) {
            if (c.classList && c.classList.contains("pdx-host")) continue;
            if (c.style.display !== "none") { c.dataset.pdxHidden = "1"; c.style.display = "none"; }
        }
        preview.querySelectorAll("video:not(.pdx-video)").forEach(v => { try { v.pause(); v.muted = true; } catch {} });
    }
    function showNative(preview) {
        if (!preview) return;
        preview.querySelectorAll("[data-pdx-hidden]").forEach(c => { c.style.display = ""; delete c.dataset.pdxHidden; });
    }

    let cur = null;
    const state = { file: null, filter: "", stripShown: 0, stripTotal: 0 };
    try { state.filter = (new URLSearchParams(location.search).get("q") || "").trim().toLowerCase(); } catch {}

    function teardownPlayer() {
        if (!cur) return;
        try { cur.ac.abort(); } catch {}
        clearTimeout(cur.watchdog);
        if (cur.kind === "video") { try { cur.media.pause(); } catch {} }
        try { cur.media.removeAttribute("src"); if (cur.kind === "video") cur.media.load(); } catch {}
        try { cur.host.remove(); } catch {}
        showNative(cur.preview); cur = null; setMirrorLoading(false);
    }
    function clearPlayerOverlay() {
        teardownPlayer();
        document.querySelectorAll(".pdx-host").forEach(h => { try { h.remove(); } catch {} });
        const prev = document.querySelector(".file_preview"); showNative(prev);
    }

    function fmtT(s) {
        s = Math.max(0, Math.floor(s || 0));
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
        const p = n => String(n).padStart(2, "0");
        return h ? h + ":" + p(m) + ":" + p(ss) : m + ":" + p(ss);
    }

    const durKnown = new Map();
    const durPending = new Set();
    const durQueue = [];
    let durBusy = 0;
    function cachedDur(key) {
        if (!key) return "";
        if (durKnown.has(key)) return durKnown.get(key);
        try {
            const v = sessionStorage.getItem("pdxdur:" + key);
            if (v) { durKnown.set(key, v); return v; }
        } catch {}
        return "";
    }
    function rememberDur(key, text) {
        if (!key || !text) return;
        durKnown.set(key, text);
        try { sessionStorage.setItem("pdxdur:" + key, text); } catch {}
        document.querySelectorAll('.pdx-playlist-dur[data-dur-key="' + CSS.escape(key) + '"]').forEach(node => {
            node.textContent = text;
            node.hidden = false;
        });
    }
    function pumpDur() {
        while (durBusy < 2 && durQueue.length) {
            const job = durQueue.shift();
            durBusy++;
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
                durBusy--;
                if (text) rememberDur(job.key, text);
                pumpDur();
            };
            v.addEventListener("loadedmetadata", () => finish(Number.isFinite(v.duration) ? fmtT(v.duration) : ""), { once: true });
            v.addEventListener("error", () => finish(""), { once: true });
            setTimeout(() => finish(""), 12000);
            v.src = job.url;
        }
    }
    // Sonda a duração só quando o item fica visível (watchEl = elemento observado).
    let probeDurIO = null;
    function probeDurNow(key, url) {
        if (!key || !url || cachedDur(key) || durPending.has(key)) return;
        durPending.add(key);
        durQueue.push({ key, url });
        pumpDur();
    }
    function probeDur(key, url, watchEl) {
        if (!key || !url || cachedDur(key) || durPending.has(key)) return;
        if (!watchEl || !("IntersectionObserver" in window)) { probeDurNow(key, url); return; }
        if (!probeDurIO) {
            probeDurIO = new IntersectionObserver(entries => {
                for (const e of entries) {
                    if (!e.isIntersecting) continue;
                    probeDurIO.unobserve(e.target);
                    probeDurNow(e.target._durKey, e.target._durUrl);
                }
            }, { rootMargin: "200px" });
        }
        watchEl._durKey = key;
        watchEl._durUrl = url;
        probeDurIO.observe(watchEl);
    }

    function buildPlayerControls(wrap, video, ac) {
        const mkAct = (ic, label, on) => {
            const b = el("button", { type: "button", class: "pdx-plc-act", title: label, "aria-label": label });
            b.innerHTML = ic; b.addEventListener("click", on); return b;
        };
        const toggle = () => {
            if (!video.paused) { video.pause(); return; }
            const p = video.play(); if (p && p.catch) p.catch(() => {});
        };

        // SEEK ±5s + flash
        const sflash = el("div", { class: "pdx-plc-seekflash" }); let sflashT;
        const seek = d => {
            if (!video.duration) return;
            video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + d));
            sflash.textContent = d < 0 ? "« 5s" : "5s »";
            sflash.classList.add("on");
            clearTimeout(sflashT);
            sflashT = setTimeout(() => sflash.classList.remove("on"), 480);
        };

        let clickT = null;
        video.addEventListener("click", e => {
            e.preventDefault(); e.stopPropagation();
            if (clickT) return;
            clickT = setTimeout(() => { clickT = null; toggle(); }, 230);
        });
        video.addEventListener("dblclick", e => {
            e.preventDefault(); e.stopPropagation();
            if (clickT) { clearTimeout(clickT); clickT = null; }
            const r = video.getBoundingClientRect();
            seek((e.clientX - r.left) < r.width / 2 ? -5 : 5);
        });

        // Play central grande
        const playBtn = el("button", { type: "button", class: "pdx-plc-play", "aria-label": "Play/Pause" });
        playBtn.innerHTML = PL_ICONS.play;
        playBtn.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); toggle(); });
        const flash = el("div", { class: "pdx-plc-flash" }, playBtn);

        // Barra de progresso com scrubber
        const buf = el("div", { class: "pdx-plc-buf" });
        const knob = el("div", { class: "pdx-plc-knob" });
        const fill = el("div", { class: "pdx-plc-fill" }, knob);
        const bar = el("div", { class: "pdx-plc-bar" }, buf, fill);
        const prog = el("div", { class: "pdx-plc-prog" }, bar);
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

        // Tempo
        const tEl = el("span", { class: "pdx-plc-time" }, "0:00");
        const syncTime = () => {
            const s = fmtT(video.currentTime) + (video.duration ? " / " + fmtT(video.duration) : "");
            if (tEl.firstChild.data !== s) tEl.firstChild.data = s;
        };
        video.addEventListener("timeupdate", () => {
            if (video.duration) fill.style.width = (video.currentTime / video.duration * 100) + "%";
            syncTime();
        });
        video.addEventListener("loadedmetadata", syncTime);
        video.addEventListener("progress", () => {
            try {
                if (video.buffered.length && video.duration) buf.style.width = (video.buffered.end(video.buffered.length - 1) / video.duration * 100) + "%";
            } catch {}
        });

        // Volume
        const mute = mkAct(PL_ICONS.mute, "Mudo (m)", e => {
            e.stopPropagation(); video.muted = !video.muted;
            if (!video.muted && !video.volume) video.volume = 1;
            syncVol();
        });
        const volfill = el("div", { class: "pdx-plc-volfill" });
        const volbar = el("div", { class: "pdx-plc-volbar", role: "slider", "aria-label": "Volume" }, volfill);
        const syncVol = () => {
            mute.innerHTML = (video.muted || !video.volume) ? PL_ICONS.mute : PL_ICONS.volume;
            volfill.style.width = ((video.muted ? 0 : video.volume) * 100) + "%";
        };
        const setVolFromX = (cx, r) => {
            if (!r.width) return;
            const v = Math.max(0, Math.min(1, (cx - r.left) / r.width));
            video.volume = v; video.muted = (v === 0); syncVol();
        };
        volbar.addEventListener("pointerdown", e => {
            e.preventDefault(); e.stopPropagation();
            const r = volbar.getBoundingClientRect(); setVolFromX(e.clientX, r);
            const mv = ev => setVolFromX(ev.clientX, r);
            const up = () => { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); };
            document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
        });
        const volgrp = el("div", { class: "pdx-plc-vol" }, mute, volbar);

        // Controles Lado a Lado: Play, Anterior, Próximo, Skip -5s, Skip +5s
        const barPlay = mkAct(PL_ICONS.play, "Play/Pause (espaço)", e => { e.stopPropagation(); toggle(); });
        barPlay.classList.add("pdx-plc-barplay");

        const navPrevBtn = mkAct(PL_ICONS.prev, "Mídia anterior (Shift+P)", e => { e.stopPropagation(); navItem(-1); });
        const navNextBtn = mkAct(PL_ICONS.next, "Próxima mídia (Shift+N)", e => { e.stopPropagation(); navItem(1); });

        const mkSkip = (ic, label, on) => {
            const b = el("button", { type: "button", class: "pdx-plc-act pdx-plc-skip", title: label, "aria-label": label });
            b.innerHTML = ic; b.appendChild(el("span", { class: "pdx-plc-skipn" }, "5"));
            b.addEventListener("click", on); return b;
        };
        const skipBack = mkSkip(PL_ICONS.skipBack, "Voltar 5s (←)", e => { e.stopPropagation(); seek(-5); });
        const skipFwd = mkSkip(PL_ICONS.skipFwd, "Avançar 5s (→)", e => { e.stopPropagation(); seek(5); });

        // VELOCIDADE (texto plano, sem pill pesado)
        const RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];
        const speedMenu = el("div", { class: "pdx-plc-speedmenu" });
        const speedBtn = el("button", { type: "button", class: "pdx-plc-act pdx-plc-speed", title: "Velocidade", "aria-label": "Velocidade" }, "1x");
        const speedWrap = el("div", { class: "pdx-plc-speedwrap" }, speedMenu, speedBtn);
        let speedCloser = null;
        const closeSpeed = () => { speedMenu.classList.remove("open"); if (speedCloser) { document.removeEventListener("pointerdown", speedCloser, true); speedCloser = null; } };
        const openSpeed = () => { speedMenu.classList.add("open"); speedCloser = ev => { if (!speedWrap.contains(ev.target)) closeSpeed(); }; document.addEventListener("pointerdown", speedCloser, true); };
        RATES.forEach(r => {
            const it = el("button", { type: "button", class: "pdx-plc-speeditem" }, r + "x");
            it.dataset.r = r;
            it.addEventListener("click", e => { e.stopPropagation(); try { video.playbackRate = r; } catch {} closeSpeed(); });
            speedMenu.appendChild(it);
        });
        speedBtn.addEventListener("click", e => { e.stopPropagation(); speedMenu.classList.contains("open") ? closeSpeed() : openSpeed(); });
        const syncSpeed = () => {
            const r = video.playbackRate;
            speedBtn.textContent = r + "x";
            speedMenu.querySelectorAll(".pdx-plc-speeditem").forEach(it => it.classList.toggle("on", +it.dataset.r === r));
        };
        video.addEventListener("ratechange", () => { prefs.rate = video.playbackRate; saveP(); syncSpeed(); });
        video.addEventListener("loadedmetadata", () => {
            try { video.playbackRate = prefs.rate || 1; } catch {}
            const f = state.file;
            if (f && f.id && Number.isFinite(video.duration)) rememberDur(f.id, fmtT(video.duration));
        });

        // Download, Copiar Link & Fullscreen
        const goFs = () => { try { document.fullscreenElement ? document.exitFullscreen() : wrap.requestFullscreen(); } catch {} };
        const dlb = mkAct(PL_ICONS.download, "Baixar via mirror", e => { e.stopPropagation(); const f = state.file; if (f) window.open(M().dl(f.id), "_blank"); });
        const shareBtn = mkAct(PL_ICONS.share, "Compartilhar / Copiar link", e => {
            e.stopPropagation();
            const f = state.file;
            const link = f ? M().dl(f.id) : location.href;
            copyText(link).then(ok => {
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

        const apBtn = el("button", {
            type: "button",
            class: "pdx-plc-act pdx-plc-autoplay" + (prefs.autoplay ? " is-active" : ""),
            title: prefs.autoplay ? "Reprodução automática ativada" : "Reprodução automática desativada",
            "aria-label": "Reprodução automática"
        },
            el("span", { class: "pdx-plc-ap-label" }, "Autoplay"),
            el("span", { class: "pdx-plc-ap-pill" }, el("span", { class: "pdx-plc-ap-knob" }))
        );
        apBtn.addEventListener("click", e => {
            e.stopPropagation();
            prefs.autoplay = !prefs.autoplay;
            saveP();
            apBtn.classList.toggle("is-active", !!prefs.autoplay);
            toast(prefs.autoplay ? "Autoplay ativado" : "Autoplay desativado");
        });
        video.addEventListener("ended", () => {
            if (prefs.autoplay) setTimeout(() => navItem(1), 600);
        });

        const loopBtn = mkAct(PL_ICONS.repeat, prefs.loop ? "Repetição ativada" : "Repetição desativada", e => {
            e.stopPropagation();
            video.loop = !video.loop;
            prefs.loop = video.loop;
            saveP();
            loopBtn.classList.toggle("is-active", video.loop);
            toast(video.loop ? "Repetição ativada" : "Repetição desativada");
        });
        if (prefs.loop) { video.loop = true; loopBtn.classList.add("is-active"); }

        // Montagem das Linhas
        const leftc = el("div", { class: "pdx-plc-left" }, barPlay, loopBtn, navPrevBtn, navNextBtn, skipBack, skipFwd, volgrp, tEl);
        const rightc = el("div", { class: "pdx-plc-right" }, apBtn, speedWrap, reportBtn, dlb, shareBtn);
        if (pipBtn) rightc.appendChild(pipBtn);
        rightc.appendChild(fsb);
        const row = el("div", { class: "pdx-plc-row" }, leftc, rightc);
        const bottom = el("div", { class: "pdx-plc-bottom" }, prog, row);

        // Setas laterais grandes (hover nas pontas)
        const al = albumInfo(), multi = !!(al && al.files.length > 1);
        const sideArrows = [];
        if (multi) {
            const prevA = el("button", { type: "button", class: "pdx-plc-side pdx-plc-sprev", title: "Mídia anterior", "aria-label": "Mídia anterior" });
            prevA.innerHTML = PL_ICONS.chevL; prevA.addEventListener("click", e => { e.stopPropagation(); navItem(-1); });
            const nextA = el("button", { type: "button", class: "pdx-plc-side pdx-plc-snext", title: "Próxima mídia", "aria-label": "Próxima mídia" });
            nextA.innerHTML = PL_ICONS.chevR; nextA.addEventListener("click", e => { e.stopPropagation(); navItem(1); });
            sideArrows.push(prevA, nextA);
        }

        // Widget de Mirror no canto superior direito do player (hover reveal estilo Bunkr)
        const playerMirror = buildPlayerMirrorWidget();

        video.addEventListener("play", () => { wrap.classList.add("pdx-pl-playing"); playBtn.innerHTML = PL_ICONS.pause; barPlay.innerHTML = PL_ICONS.pause; });
        video.addEventListener("pause", () => { wrap.classList.remove("pdx-pl-playing"); playBtn.innerHTML = PL_ICONS.play; barPlay.innerHTML = PL_ICONS.play; });
        video.addEventListener("volumechange", syncVol);
        video.addEventListener("seeking", () => { if (cur && cur.restoring) return; wrap.classList.add("pdx-pl-buffering"); });
        ["seeked", "canplay", "playing", "loadeddata", "pause", "suspend", "error", "abort"].forEach(ev => video.addEventListener(ev, () => wrap.classList.remove("pdx-pl-buffering")));

        // Atalhos de teclado
        const setRate = dir => { const i = RATES.indexOf(video.playbackRate); const ni = Math.max(0, Math.min(RATES.length - 1, (i < 0 ? 3 : i) + dir)); try { video.playbackRate = RATES[ni]; } catch {} };
        const onKey = e => {
            if (e.ctrlKey || e.metaKey || e.altKey || inGallery()) return;
            const t = e.target;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable || (t.closest && t.closest(".pdx-search, .pdx-sidebar-search")))) return;
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
            else if (e.shiftKey && (k === "N" || k === "n")) navItem(1);
            else if (e.shiftKey && (k === "P" || k === "p")) navItem(-1);
            else if (k === "p" || k === "P") toggleSidebar();
            else if (k >= "0" && k <= "9" && video.duration) video.currentTime = video.duration * (+k) / 10;
            else h = false;
            if (h) { e.preventDefault(); e.stopPropagation(); }
        };
        if (ac) document.addEventListener("keydown", onKey, { capture: true, signal: ac.signal });

        wrap.append(flash, sflash, bottom, playerMirror, ...sideArrows);
        try { video.playbackRate = prefs.rate || 1; } catch {}
        syncVol(); syncTime(); syncSpeed();
    }

    function mountPlayer(f) {
        const preview = document.querySelector(".file_preview");
        if (!preview) return;
        if (cur && cur.kind === "video" && cur.id === f.id && cur.host.isConnected) { hideNative(preview); return; }
        teardownPlayer();
        hideNative(preview);
        gIdx = prefIdx;

        const ac = new AbortController();
        const on = (e, ev, fn) => e.addEventListener(ev, fn, { signal: ac.signal });
        const video = el("video", { class: "pdx-video", playsinline: "", preload: "metadata" });
        video.volume = prefs.volume; video.muted = prefs.muted;
        on(video, "volumechange", () => { prefs.volume = video.volume; prefs.muted = video.muted; saveP(); });
        ALIVE.forEach(ev => on(video, ev, () => { if (cur) { cur.alive = true; clearTimeout(cur.watchdog); cur.fail.style.display = "none"; } setMirrorLoading(false); }));
        on(video, "error", () => nextMirror("Erro no player"));

        const fail = el("div", { class: "pdx-fail" },
            el("div", null, "Todos os mirrors falharam para este arquivo."),
            el("div", { class: "pdx-failrow" },
                el("button", { class: "pdx-mini", onClick: () => { gIdx = prefIdx; applyMirror(cur.media); } }, "↻ Tentar de novo"),
                el("a", { class: "pdx-mini", href: "https://pixeldrain.com/api/file/" + f.id, target: "_blank", rel: "noopener" }, "Abrir no oficial")));
        fail.style.display = "none";

        const host = el("div", { class: "pdx-host pdx-pl" }, video, fail);
        buildPlayerControls(host, video, ac);
        preview.appendChild(host);
        cur = { id: f.id, kind: "video", preview, host, media: video, fail, ac, alive: false, watchdog: null, file: f };
        applyMirror(video);
    }

    function appendImageChrome(host, f) {
        const mkAct = (ic, label, cb) => {
            const b = el("button", { type: "button", class: "pdx-plc-act", title: label, "aria-label": label });
            b.innerHTML = ic;
            b.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); cb(); });
            return b;
        };
        const prevBtn = mkAct(PL_ICONS.prev, "Mídia anterior", () => navItem(-1));
        const nextBtn = mkAct(PL_ICONS.next, "Próxima mídia", () => navItem(1));
        const reportBtn = mkAct(PL_ICONS.flag, "Reportar", () => {
            const a = document.querySelector('a[href*="report"], a[href*="abuse"]');
            if (a && a.href) window.open(a.href, "_blank", "noopener");
            else toast("Sem página de denúncia neste site");
        });
        const dlb = mkAct(PL_ICONS.download, "Baixar via mirror", () => { if (f) window.open(M().dl(f.id), "_blank", "noopener"); });
        const shareBtn = mkAct(PL_ICONS.share, "Compartilhar / Copiar link", () => {
            const link = f ? M().dl(f.id) : location.href;
            copyText(link).then(ok => {
                toast(ok ? "Link copiado!" : "Falha ao copiar link");
                if (ok) { shareBtn.innerHTML = PL_ICONS.check; setTimeout(() => { shareBtn.innerHTML = PL_ICONS.share; }, 1600); }
            });
        });
        const fsb = mkAct(PL_ICONS.expand, "Tela cheia (f)", () => goFullscreen());
        const row = el("div", { class: "pdx-plc-row" },
            el("div", { class: "pdx-plc-left" }, prevBtn, nextBtn),
            el("div", { class: "pdx-plc-right" }, reportBtn, dlb, shareBtn, fsb)
        );
        host.append(el("div", { class: "pdx-plc-bottom" }, row));
    }

    /* ==================================================================== * (2) IMAGEM COM ZOOM, PAN E MIRROR */
    function mountImage(f) {
        const preview = document.querySelector(".file_preview");
        if (!preview) return;
        if (cur && cur.kind === "image" && cur.id === f.id && cur.host.isConnected) { hideNative(preview); return; }
        teardownPlayer();
        hideNative(preview);
        gIdx = prefIdx;

        const ac = new AbortController();
        const on = (e, ev, fn) => e.addEventListener(ev, fn, { signal: ac.signal });
        const img = el("img", { class: "pdx-image", alt: f.name || "", draggable: "false" });
        on(img, "load", () => { if (cur) { cur.alive = true; clearTimeout(cur.watchdog); cur.fail.style.display = "none"; } setMirrorLoading(false); });
        on(img, "error", () => nextMirror("Erro na imagem"));

        const fail = el("div", { class: "pdx-fail" },
            el("div", null, "Todos os mirrors falharam para esta imagem."),
            el("div", { class: "pdx-failrow" },
                el("button", { class: "pdx-mini", onClick: () => { gIdx = prefIdx; applyMirror(cur.media); } }, "↻ Tentar de novo"),
                el("a", { class: "pdx-mini", href: "https://pixeldrain.com/api/file/" + f.id, target: "_blank", rel: "noopener" }, "Abrir no oficial")));
        fail.style.display = "none";

        const host = el("div", { class: "pdx-host pdx-img-host" }, img, fail);
        appendImageChrome(host, f);

        // Zoom 1x → 2x → 4x com Drag
        const ZOOMS = [1, 2, 4]; let zi = 0, z = 1, tx = 0, ty = 0;
        const clampPan = () => {
            const stageW = host.clientWidth || window.innerWidth;
            const stageH = host.clientHeight || (window.innerHeight - 120);
            const imgW = img.clientWidth * z;
            const imgH = img.clientHeight * z;
            const mx = Math.max(0, (imgW - stageW) / 2);
            const my = Math.max(0, (imgH - stageH) / 2);
            tx = Math.max(-mx, Math.min(mx, tx));
            ty = Math.max(-my, Math.min(my, ty));
        };
        const applyTf = () => { img.style.transform = z === 1 ? "" : `translate(${tx}px,${ty}px) scale(${z})`; host.classList.toggle("pdx-zoomed", z !== 1); };
        const setZoomIdx = i => { zi = ((i % ZOOMS.length) + ZOOMS.length) % ZOOMS.length; z = ZOOMS[zi]; if (z === 1) { tx = ty = 0; } else clampPan(); applyTf(); };
        let drag = null;
        on(img, "pointerdown", e => { if (e.button) return; e.preventDefault(); e.stopPropagation(); drag = { x: e.clientX, y: e.clientY, tx, ty, moved: false }; try { img.setPointerCapture(e.pointerId); } catch {} });
        on(img, "pointermove", e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true; if (z !== 1 && drag.moved) { tx = drag.tx + dx; ty = drag.ty + dy; clampPan(); applyTf(); } });
        const endDrag = e => { if (!drag) return; const click = !drag.moved; drag = null; try { img.releasePointerCapture(e.pointerId); } catch {} if (click) setZoomIdx(zi + 1); };
        on(img, "pointerup", endDrag); on(img, "pointercancel", endDrag);

        // Setas laterais grandes
        const al = albumInfo(), multi = !!(al && al.files.length > 1);
        if (multi) {
            const prevA = el("button", { type: "button", class: "pdx-plc-side pdx-plc-sprev", title: "Mídia anterior", "aria-label": "Mídia anterior" });
            prevA.innerHTML = PL_ICONS.chevL; prevA.addEventListener("click", e => { e.stopPropagation(); navItem(-1); });
            const nextA = el("button", { type: "button", class: "pdx-plc-side pdx-plc-snext", title: "Próxima mídia", "aria-label": "Próxima mídia" });
            nextA.innerHTML = PL_ICONS.chevR; nextA.addEventListener("click", e => { e.stopPropagation(); navItem(1); });
            host.append(prevA, nextA);
        }

        // Widget de Mirror no canto superior direito do player
        const playerMirror = buildPlayerMirrorWidget();
        host.appendChild(playerMirror);

        // Atalhos de teclado
        const onKey = e => {
            if (e.ctrlKey || e.metaKey || e.altKey || inGallery()) return;
            const t = e.target;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable || (t.closest && t.closest(".pdx-search, .pdx-sidebar-search")))) return;
            let h = true;
            if (e.key === "ArrowLeft") navItem(-1);
            else if (e.key === "ArrowRight") navItem(1);
            else if (e.key === "f") goFullscreen();
            else if (e.shiftKey && (e.key === "N" || e.key === "n")) navItem(1);
            else if (e.shiftKey && (e.key === "P" || e.key === "p")) navItem(-1);
            else if (e.key === "p" || e.key === "P") toggleSidebar();
            else h = false;
            if (h) { e.preventDefault(); e.stopPropagation(); }
        };
        document.addEventListener("keydown", onKey, { capture: true, signal: ac.signal });

        preview.appendChild(host);
        cur = { id: f.id, kind: "image", preview, host, media: img, fail, ac, alive: false, watchdog: null, file: f };
        applyMirror(img);
    }

    /* ==================================================================== * (3) VISUALIZADOR DE TEXTO INTEGRADO (.txt, .md, .nfo) */
    function loadTextContent(host, file) {
        const textPre = host.querySelector(".pdx-txt-body");
        const statLines = host.querySelector(".pdx-txt-stat-lines");
        const statChars = host.querySelector(".pdx-txt-stat-chars");
        if (!textPre) return;
        textPre.textContent = "Carregando conteúdo do arquivo...";

        const url = M().file(file.id);

        const applyText = text => {
            if (!cur || cur.id !== file.id) return;
            cur.alive = true;
            clearTimeout(cur.watchdog);
            setMirrorLoading(false);
            textPre.textContent = text;
            const lines = text.split("\n").length;
            const chars = text.length;
            if (statLines) statLines.textContent = `${lines} ${lines === 1 ? "linha" : "linhas"}`;
            if (statChars) statChars.textContent = `${chars.toLocaleString()} caracteres`;
        };

        if (typeof GM_xmlhttpRequest === "function") {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                onload: res => {
                    if (res.status >= 200 && res.status < 300) {
                        applyText(res.responseText || "(Arquivo vazio)");
                    } else {
                        nextMirror(`Falha HTTP ${res.status}`);
                    }
                },
                onerror: () => nextMirror("Erro de rede ao ler texto")
            });
        } else {
            fetch(url)
                .then(r => {
                    if (!r.ok) throw new Error("HTTP " + r.status);
                    return r.text();
                })
                .then(t => applyText(t || "(Arquivo vazio)"))
                .catch(err => nextMirror(err.message || "Erro no fetch"));
        }
    }

    function mountTextViewer(f) {
        const preview = document.querySelector(".file_preview");
        if (!preview) return;
        if (cur && cur.kind === "text" && cur.id === f.id && cur.host.isConnected) { hideNative(preview); return; }
        teardownPlayer();
        hideNative(preview);
        gIdx = prefIdx;

        const ac = new AbortController();
        const host = el("div", { class: "pdx-host pdx-txt-host" });

        const header = el("div", { class: "pdx-txt-header" });
        header.innerHTML = `
            <div class="pdx-txt-title">
                <span class="pdx-txt-icon">${PL_ICONS.fileText}</span>
                <span class="pdx-txt-name">${f.name || f.id}</span>
                <span class="pdx-txt-badge">TEXTO</span>
            </div>
            <div class="pdx-txt-meta">
                <span class="pdx-txt-stat-lines">— linhas</span>
                <span class="pdx-txt-bullet">·</span>
                <span class="pdx-txt-stat-chars">— caracteres</span>
                <span class="pdx-txt-bullet">·</span>
                <span>${f.size ? fmtSize(f.size) : ""}</span>
            </div>
        `;

        const tools = el("div", { class: "pdx-txt-tools" });
        const copyBtn = el("button", { class: "pdx-item", type: "button", title: "Copiar conteúdo" });
        copyBtn.innerHTML = `${PL_ICONS.copy} <span>Copiar</span>`;
        copyBtn.addEventListener("click", () => {
            const body = host.querySelector(".pdx-txt-body");
            if (body) copyText(body.textContent).then(() => toast("Conteúdo copiado!"));
        });

        const dlBtn = el("button", { class: "pdx-item pdx-primary", type: "button", title: "Baixar arquivo" });
        dlBtn.innerHTML = `${PL_ICONS.download} <span>Download</span>`;
        dlBtn.addEventListener("click", () => window.open(M().dl(f.id), "_blank"));

        tools.append(copyBtn, dlBtn);
        header.appendChild(tools);

        const fail = el("div", { class: "pdx-fail" },
            el("div", null, "Todos os mirrors falharam para este arquivo."),
            el("div", { class: "pdx-failrow" },
                el("button", { class: "pdx-mini", onClick: () => { gIdx = prefIdx; loadTextContent(host, f); } }, "↻ Tentar de novo"),
                el("a", { class: "pdx-mini", href: "https://pixeldrain.com/api/file/" + f.id, target: "_blank", rel: "noopener" }, "Abrir no oficial")));
        fail.style.display = "none";

        const pre = el("pre", { class: "pdx-txt-body" }, "Carregando conteúdo do arquivo...");
        host.append(header, pre, fail);

        // Widget de Mirror no canto superior direito
        const playerMirror = buildPlayerMirrorWidget();
        host.appendChild(playerMirror);

        preview.appendChild(host);
        cur = { id: f.id, kind: "text", preview, host, media: host, fail, ac, alive: false, watchdog: null, file: f };
        loadTextContent(host, f);
    }

    /* ==================================================================== * (4) SIDEBAR DA PLAYLIST (Estilo YouTube AMOLED) */
    let stSidebarEl = null;
    let isSidebarCollapsed = !!prefs.sidebarCollapsed;

    function toggleSidebar(forceState) {
        isSidebarCollapsed = typeof forceState === "boolean" ? forceState : !isSidebarCollapsed;
        prefs.sidebarCollapsed = isSidebarCollapsed;
        saveP();
        const row = document.querySelector(".file_preview_row");
        if (row) row.classList.toggle("pdx-sidebar-collapsed", isSidebarCollapsed);
        const btn = document.querySelector(".pdx-vrow-playlist");
        if (btn) btn.style.display = isSidebarCollapsed ? "inline-flex" : "none";
    }

    function makeThumbPlaceholder(kind, ext) {
        const ph = el("div", { class: "pdx-playlist-placeholder" });
        const iconSpan = el("span", { class: "pdx-playlist-ph-icon" });
        iconSpan.innerHTML = kindSvg(kind);
        const badge = el("span", { class: "pdx-playlist-ph-ext" }, (ext || kind || "FILE").toUpperCase().slice(0, 5));
        ph.append(iconSpan, badge);
        return ph;
    }

    function renderPlaylistCard(f, displayIdx) {
        const al = albumInfo();
        const curIdx = currentIndex();
        const isCurrent = f.origIdx === curIdx;
        const kind = getFileKind(f);
        const extMatch = (f.name || "").match(/\.([a-z0-9]{1,6})$/i);
        const ext = extMatch ? extMatch[1] : kind;

        const itemEl = el("div", {
            class: "pdx-playlist-item" + (isCurrent ? " is-current" : ""),
            title: f.name
        });

        // Thumbnail Wrap 16:9
        const thumbWrap = el("div", { class: "pdx-playlist-thumb-wrap" });
        const relThumb = `/api/file/${f.id}/thumbnail`;
        const absThumb = `https://pixeldrain.com/api/file/${f.id}/thumbnail`;

        if (kind === "video" || kind === "image") {
            const img = el("img", { class: "pdx-playlist-thumb", src: relThumb, alt: "", loading: "lazy" });
            img.onerror = () => {
                if (img.src !== absThumb) {
                    img.src = absThumb;
                    return;
                }
                img.remove();
                if (!thumbWrap.querySelector(".pdx-playlist-placeholder")) {
                    thumbWrap.prepend(makeThumbPlaceholder(kind, ext));
                }
            };
            thumbWrap.appendChild(img);
        } else {
            thumbWrap.appendChild(makeThumbPlaceholder(kind, ext));
        }

        const kindLabel = kind === "video" ? "Video" : kind === "image" ? "Imagem" : "Arquivo";
        thumbWrap.appendChild(el("span", { class: "pdx-playlist-kind" }, kindLabel));
        if (typeof displayIdx === "number") thumbWrap.appendChild(el("span", { class: "pdx-playlist-num" }, String(displayIdx + 1)));
        if (kind === "video" && f.id) {
            const known = cachedDur(f.id);
            const durEl = el("span", { class: "pdx-playlist-dur", hidden: known ? null : "" }, known || "");
            durEl.dataset.durKey = f.id;
            if (!known) durEl.hidden = true;
            thumbWrap.appendChild(durEl);
            probeDur(f.id, M().file(f.id), thumbWrap);
        }

        // Info: Título Limpo e Datas Formatadas
        const info = el("div", { class: "pdx-playlist-info" });
        const displayTitle = f.displayTitle || f.name;
        info.append(el("span", { class: "pdx-playlist-name", title: f.name }, displayTitle));

        const datesBox = el("div", { class: "pdx-playlist-dates" });
        if (f.date_upload) {
            datesBox.append(el("div", { class: "pdx-playlist-date-row", title: "Data de envio" },
                el("span", { class: "pdx-playlist-date-val" }, formatDisplayDate(f.date_upload))
            ));
        }
        if (f.extractedDate && f.extractedDate.displayDate) {
            datesBox.append(el("div", { class: "pdx-playlist-date-row", title: "Data extraída do nome do arquivo" },
                el("span", { class: "pdx-playlist-date-val" }, f.extractedDate.displayDate)
            ));
        }
        if (datesBox.childNodes.length) info.appendChild(datesBox);

        if (isCurrent) {
            const meta = el("div", { class: "pdx-playlist-meta" });
            meta.append(el("span", { class: "pdx-playlist-meta-active" }, kind === "video" ? "Reproduzindo agora" : "Visualizando agora"));
            info.appendChild(meta);
        }

        itemEl.append(thumbWrap, info);
        itemEl.addEventListener("click", () => {
            location.hash = "#item=" + f.origIdx;
        });

        return itemEl;
    }

    function renderPlaylist() {
        if (!stSidebarEl) return;
        const listEl = stSidebarEl.querySelector(".pdx-playlist-list");
        if (!listEl) return;
        listEl.textContent = "";

        const al = albumInfo();
        if (!al || !al.files.length) {
            listEl.innerHTML = `<div class="pdx-playlist-empty">Nenhum arquivo no álbum.</div>`;
            return;
        }

        const q = (stSidebarEl.querySelector(".pdx-sidebar-search-in")?.value || "").trim().toLowerCase();
        const activeTab = prefs.sidebarTab || "all";
        const sortMode = prefs.sidebarSort || "default";

        let filtered = al.files.filter(f => {
            if (q && (f.name || "").toLowerCase().indexOf(q) === -1) return false;
            const k = getFileKind(f);
            if (activeTab === "video") return k === "video";
            if (activeTab === "image") return k === "image";
            if (activeTab === "text") return k === "text";
            return true;
        });

        if (sortMode === "az") {
            filtered.sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { numeric: true, sensitivity: "base" }));
        }

        // Atualiza contadores das abas
        const countAll = al.files.length;
        const countVideos = al.files.filter(f => getFileKind(f) === "video").length;
        const countImages = al.files.filter(f => getFileKind(f) === "image").length;
        const countTexts = al.files.filter(f => getFileKind(f) === "text").length;

        stSidebarEl.querySelectorAll(".pdx-tab-chip").forEach(tab => {
            const t = tab.dataset.tab;
            let n = countAll;
            if (t === "video") n = countVideos;
            else if (t === "image") n = countImages;
            else if (t === "text") n = countTexts;
            const cEl = tab.querySelector(".pdx-tab-count");
            if (cEl) cEl.textContent = n;
            tab.style.display = (t !== "all" && n === 0) ? "none" : "";
        });

        const subTitle = stSidebarEl.querySelector(".pdx-sidebar-count");
        if (subTitle) subTitle.textContent = `${filtered.length} de ${al.files.length} arquivos`;

        if (!filtered.length) {
            listEl.innerHTML = `<div class="pdx-playlist-empty">Nenhum item encontrado.</div>`;
            return;
        }

        filtered.forEach((f, idx) => {
            listEl.appendChild(renderPlaylistCard(f, idx));
        });

        // Scroll auto para o item atual
        setTimeout(() => {
            const curItem = listEl.querySelector(".is-current");
            if (curItem) {
                try { curItem.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch { curItem.scrollIntoView(); }
            }
        }, 50);
    }

    function setupSidebar(row) {
        const al = albumInfo();
        if (!al || al.files.length <= 1) {
            if (stSidebarEl) { stSidebarEl.remove(); stSidebarEl = null; }
            row.classList.remove("pdx-has-sidebar");
            return;
        }

        row.classList.add("pdx-has-sidebar");
        row.classList.toggle("pdx-sidebar-collapsed", isSidebarCollapsed);

        if (stSidebarEl && stSidebarEl.parentNode === row) {
            renderPlaylist();
            return;
        }

        if (stSidebarEl) stSidebarEl.remove();

        const sb = el("div", { class: "pdx-sidebar" });

        // Header
        const header = el("div", { class: "pdx-sidebar-header" });
        header.innerHTML = `
            <div class="pdx-sidebar-title-wrap">
                <span class="pdx-sidebar-icon">${PL_ICONS.playlist}</span>
                <span class="pdx-sidebar-title">Playlist</span>
                <span class="pdx-sidebar-count">${al.files.length} arquivos</span>
            </div>
        `;
        const collapseBtn = el("button", {
            type: "button",
            class: "pdx-sidebar-collapse-btn",
            title: "Recolher playlist (p)",
            onClick: () => toggleSidebar()
        });
        collapseBtn.innerHTML = PL_ICONS.close;
        const galBtn = el("button", {
            type: "button",
            class: "pdx-sidebar-gallery-btn",
            title: "Voltar para a galeria",
            onClick: () => { location.hash = "gallery"; }
        });
        galBtn.innerHTML = `${PL_ICONS.grid} <span>Galeria</span>`;
        const actions = el("div", { class: "pdx-sidebar-actions" }, galBtn, collapseBtn);
        header.appendChild(actions);

        // Busca
        const searchWrap = el("div", { class: "pdx-sidebar-search" });
        searchWrap.innerHTML = `<span class="pdx-sidebar-search-icon">${PL_ICONS.search}</span>`;
        const searchIn = el("input", {
            type: "search",
            class: "pdx-sidebar-search-in",
            placeholder: "Buscar na playlist...",
            value: ""
        });
        searchIn.addEventListener("input", debounce(() => renderPlaylist(), 140));
        searchIn.addEventListener("keydown", e => e.stopPropagation());
        searchWrap.appendChild(searchIn);

        // Abas
        const tabsWrap = el("div", { class: "pdx-sidebar-tabs" });
        const makeTab = (key, label) => {
            const b = el("button", {
                type: "button",
                class: "pdx-tab-chip" + (prefs.sidebarTab === key ? " is-active" : "")
            });
            b.dataset.tab = key;
            b.innerHTML = `<span>${label}</span> <span class="pdx-tab-count">0</span>`;
            b.addEventListener("click", () => {
                prefs.sidebarTab = key; saveP();
                tabsWrap.querySelectorAll(".pdx-tab-chip").forEach(t => t.classList.remove("is-active"));
                b.classList.add("is-active");
                renderPlaylist();
            });
            return b;
        };
        tabsWrap.append(
            makeTab("all", "Todos"),
            makeTab("video", "Vídeos"),
            makeTab("image", "Fotos"),
            makeTab("text", "Textos")
        );

        // Ordenação
        const sortWrap = el("div", { class: "pdx-sidebar-sort" });
        const makeSort = (key, label) => {
            const b = el("button", {
                type: "button",
                class: "pdx-sort-chip" + (prefs.sidebarSort === key ? " is-active" : "")
            });
            b.dataset.sort = key;
            b.textContent = label;
            b.addEventListener("click", () => {
                prefs.sidebarSort = key; saveP();
                sortWrap.querySelectorAll(".pdx-sort-chip").forEach(s => s.classList.remove("is-active"));
                b.classList.add("is-active");
                renderPlaylist();
            });
            return b;
        };
        sortWrap.append(
            el("span", { class: "pdx-sort-label" }, "Ordem:"),
            makeSort("default", "Padrão"),
            makeSort("az", "A-Z")
        );

        // Lista
        const listEl = el("div", { class: "pdx-playlist-list" });

        sb.append(header, searchWrap, tabsWrap, sortWrap, listEl);
        row.appendChild(sb);
        stSidebarEl = sb;
        renderPlaylist();
    }

    /* ===================== DECORAÇÃO DOS CARDS NA GALERIA ===================== */
    function decorateGalleryCards() {
        const gal = document.querySelector(".file_viewer .gallery") || document.querySelector(".file_preview .gallery");
        if (!gal) return;
        const al = albumInfo();
        const filesMap = new Map();
        if (al && al.files) {
            al.files.forEach(f => {
                filesMap.set(f.id, f);
                filesMap.set(f.name, f);
            });
        }

        const cards = Array.from(gal.querySelectorAll(".file"));
        cards.forEach((card, idx) => {
            if (card.dataset.pdxDecorated) return;
            card.dataset.pdxDecorated = "1";
            card.dataset.pdxOrigIdx = String(idx);

            let fid = null;
            const href = card.getAttribute("href") || "";
            const mh = href.match(/\/u\/([A-Za-z0-9]+)/) || href.match(/item=(\d+)/);
            if (mh && mh[1]) {
                if (href.includes("/u/")) fid = mh[1];
                else if (al && al.files[+mh[1]]) fid = al.files[+mh[1]].id;
            }
            const f = (fid && filesMap.get(fid)) || (al && al.files[idx]) || null;
            const fname = (f && f.name) || (card.getAttribute("title") || card.textContent || "").trim();
            const extractedDate = (f && f.extractedDate) || extractDateFromTitle(fname);
            const displayTitle = (f && f.displayTitle) || cleanTitleWithoutDate(fname, extractedDate);
            const kind = f ? getFileKind(f) : (VIDEO_EXT.test(fname) ? "video" : (IMAGE_EXT.test(fname) ? "image" : "other"));

            card.dataset.pdxName = fname;
            card.classList.add("pdx-card-item");
            Array.from(card.childNodes).forEach(n => {
                if (n.nodeType === 3 && (n.textContent || "").trim()) n.remove();
            });

            const img = card.querySelector("img");
            if (img) {
                img.referrerPolicy = "no-referrer";
                img.loading = "lazy";
            }

            const imageBox = card.querySelector(".icon_container, .image");
            if (kind === "video" && imageBox && !imageBox.querySelector(".pdx-card-play-overlay")) {
                const playOv = el("div", { class: "pdx-card-play-overlay" });
                playOv.innerHTML = PL_ICONS.play;
                imageBox.appendChild(playOv);
            }

            let body = card.querySelector(".pdx-card-body");
            if (!body) {
                body = el("div", { class: "pdx-card-body" });
                body.appendChild(el("div", { class: "pdx-card-name", title: fname }, displayTitle || fname));

                if (f && f.date_upload) {
                    body.appendChild(el("div", { class: "pdx-card-date-val", title: "Data de envio" }, formatDisplayDate(f.date_upload)));
                }
                if (extractedDate && extractedDate.displayDate) {
                    body.appendChild(el("div", { class: "pdx-card-date-val", title: "Data extraída do nome do arquivo" }, extractedDate.displayDate));
                }
                if (f && f.size) body.appendChild(el("div", { class: "pdx-card-foot" }, fmtSize(f.size)));
                card.appendChild(body);
            }
        });
    }

    /* ==================================================================== * (5) AGRUPAMENTO POR TIPO NA GALERIA */
    let isGalleryGrouped = !!prefs.groupByType;
    let gallerySort = prefs.gallerySort || "default";
    let gallerySortDir = prefs.gallerySortDir === "asc" ? "asc" : "desc";

    function galleryFileMeta(card) {
        const al = albumInfo();
        if (!al || !al.files) return null;
        const name = card.dataset.pdxName || "";
        return al.files.find(f => f.name === name) || al.files[+card.dataset.pdxOrigIdx] || null;
    }
    function compareGalleryCards(a, b) {
        if (gallerySort === "name") {
            const d = (a.dataset.pdxName || "").localeCompare(b.dataset.pdxName || "", undefined, { numeric: true, sensitivity: "base" });
            return gallerySortDir === "asc" ? d : -d;
        }
        const fa = galleryFileMeta(a) || {};
        const fb = galleryFileMeta(b) || {};
        const dir = gallerySortDir === "asc" ? 1 : -1;
        if (gallerySort === "size") return ((fa.size || 0) - (fb.size || 0)) * dir;
        if (gallerySort === "date") return (new Date(fa.date_upload || 0).getTime() - new Date(fb.date_upload || 0).getTime()) * dir;
        return (+a.dataset.pdxOrigIdx || 0) - (+b.dataset.pdxOrigIdx || 0);
    }

    function renderGalleryGroups() {
        const gal = document.querySelector(".file_viewer .gallery") || document.querySelector(".file_preview .gallery");
        if (!gal) return;
        const cards = Array.from(gal.querySelectorAll(":scope > .file"));
        if (!cards.length) return;

        gal.querySelectorAll(".pdx-gal-group-header").forEach(h => h.remove());

        if (!isGalleryGrouped) {
            cards.sort(compareGalleryCards);
            cards.forEach(c => gal.appendChild(c));
            return;
        }

        cards.forEach((c, idx) => {
            if (!c.dataset.pdxOrigIdx) c.dataset.pdxOrigIdx = String(idx);
        });

        const groups = { video: [], image: [], text: [], other: [] };
        cards.forEach(c => {
            const name = (c.dataset.pdxName || c.textContent || "").trim();
            const f = { name };
            const k = getFileKind(f);
            if (groups[k]) groups[k].push(c);
            else groups.other.push(c);
        });

        const defs = [
            { key: "video", title: "Vídeos", icon: PL_ICONS.film, list: groups.video },
            { key: "image", title: "Fotos", icon: PL_ICONS.image, list: groups.image },
            { key: "text", title: "Textos & Documentos", icon: PL_ICONS.fileText, list: groups.text },
            { key: "other", title: "Arquivos & Outros", icon: PL_ICONS.archive, list: groups.other }
        ];

        defs.forEach(def => {
            if (!def.list.length) return;
            def.list.sort(compareGalleryCards);
            const hdr = el("div", { class: "pdx-gal-group-header" },
                el("div", { class: "pdx-gal-group-title" },
                    el("span", { class: "pdx-gal-group-icon", html: def.icon }),
                    el("span", null, def.title)
                ),
                el("span", { class: "pdx-gal-group-count" }, `${def.list.length} ${def.list.length === 1 ? "item" : "itens"}`)
            );
            gal.appendChild(hdr);
            def.list.forEach(c => gal.appendChild(c));
        });
    }

    /* ==================================================================== * (6) UI: TOPBAR, VROW E NAVEGAÇÃO */
    function tbtn(ic, label, title, onClick, extra) {
        return el("button", { class: "pdx-item" + (extra ? " " + extra : ""), title: title || label, onClick }, icon(ic), label ? el("span", null, label) : null);
    }
    const vsep = () => el("div", { class: "pdx-vsep" });
    const statCell = (label, cls = "") => el("div", { class: "pdx-stat " + cls }, el("span", { class: "pdx-k" }, label), el("b", { class: "pdx-statv" }, "—"));

    function popup(title, body) {
        document.querySelectorAll(".pdx-modal").forEach(m => m.remove());
        const card = el("div", { class: "pdx-card" },
            el("div", { class: "pdx-card-h" }, el("span", null, title), el("button", { class: "pdx-x", title: "Fechar", onClick: () => modal.remove() }, icon("close"))),
            el("div", { class: "pdx-card-b" }, body));
        const modal = el("div", { class: "pdx-modal", onClick: e => { if (e.target === modal) modal.remove(); } }, card);
        document.body.append(modal); return modal;
    }

    function detailsPopup(f) {
        const rows = [
            ["Nome", f.name], ["Tipo", f.mime_type || "—"], ["Tamanho", f.size ? fmtSize(f.size) : "—"],
            ["Views", f.views ?? "—"], ["Downloads", f.downloads ?? "—"],
            ["Enviado", f.date_upload ? new Date(f.date_upload).toLocaleString() : "—"], ["SHA-256", f.hash_sha256 || "—"]
        ];
        popup("Detalhes do Arquivo", el("div", null,
            el("table", { class: "pdx-tbl" }, ...rows.map(([k, v]) => el("tr", null, el("td", null, k), el("td", null, String(v))))),
            el("div", { class: "pdx-links" },
                el("a", { href: M().dl(f.id), target: "_blank", rel: "noopener" }, "↓ Baixar via Mirror (" + M().name + ")"),
                el("a", { href: "https://pixeldrain.com/u/" + f.id, target: "_blank", rel: "noopener" }, "↗ Página oficial"),
                el("a", { href: "https://pixeldrain.com/api/file/" + f.id + "/info", target: "_blank", rel: "noopener" }, "ℹ API info"))));
    }

    function qrPopup(f) {
        popup("QR Code para Download", el("div", { style: { textAlign: "center" } },
            el("img", { class: "pdx-qr", src: "https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=" + encodeURIComponent(M().dl(f.id)), alt: "QR" }),
            el("div", { class: "pdx-qrcap" }, "Baixe direto no celular via " + M().name + ", sem gastar cota local.")));
    }

    function buildGlobalTopbar(fv) {
        if (fv.querySelector(":scope > .pdx-gtop")) return;
        const uname = (document.querySelector(".button_username") || {}).textContent;
        const gtop = el("div", { class: "pdx-gtop" },
            el("a", { class: "pdx-logo", href: "/", title: "Pixeldrain" }, el("img", { src: "/res/img/pixeldrain_32.png", alt: "pd" })),
            ...SITE_LINKS.map(l => el("a", { class: "pdx-glink", href: l.href, title: l.label }, icon(l.icon), el("span", null, l.label))),
            el("div", { class: "pdx-spacer" }),
            el("a", { class: "pdx-account", href: "/user", title: "Dashboard / Minha conta" }, icon("account_circle"), el("span", null, (uname || "Conta").trim() || "Conta")),
            el("a", { class: "pdx-glink pdx-icononly", href: "/user/settings", title: "Configurações da conta" }, icon("settings"))
        );
        fv.insertBefore(gtop, fv.firstChild);
    }

    function buildGalbar(fv) {
        let bar = fv.querySelector(":scope > .pdx-galbar");
        if (bar) return;
        const al = albumInfo(); if (!al) return;
        const links = () => al.files.map(x => M().dl(x.id)).join("\n") + "\n";
        const stop = e => e.stopPropagation();

        bar = el("div", { class: "pdx-galbar" });

        const topRow = el("div", { class: "pdx-galbar-top" });
        const logoLink = el("a", { class: "pdx-logo-link", href: "/", title: "Pixeldrain" },
            el("img", { src: "/res/img/pixeldrain_32.png", alt: "pd" }),
            el("span", { class: "pdx-logo-title" }, "Pixeldrain")
        );
        const titleEl = el("div", { class: "pdx-galtitle" }, (al.title || "Álbum") + " · " + al.files.length + " arquivos");
        topRow.append(logoLink, titleEl);

        const actsRow = el("div", { class: "pdx-galbar-actions" });
        const searchLabel = el("label", { class: "pdx-search" }, icon("search"));
        const searchInput = el("input", {
            class: "pdx-search-in",
            type: "search",
            placeholder: "Filtrar arquivos...",
            value: state.filter,
            "aria-label": "Filtrar arquivos",
            onInput: debounce(e => applyGalleryFilter(e.target.value), 140),
            onKeydown: stop, onKeyup: stop, onKeypress: stop
        });
        searchLabel.appendChild(searchInput);

        const sortWrap = el("div", { class: "pdx-gal-sort" });
        [
            { key: "default", label: "Original" },
            { key: "date", label: "Data" },
            { key: "name", label: "A–Z" },
            { key: "size", label: "Tamanho" }
        ].forEach(s => {
            const b = el("button", {
                type: "button",
                class: "pdx-gal-chip" + (gallerySort === s.key ? " is-active" : ""),
                onClick: () => {
                    if (gallerySort === s.key && s.key !== "default") {
                        gallerySortDir = gallerySortDir === "desc" ? "asc" : "desc";
                    } else {
                        gallerySort = s.key;
                        gallerySortDir = s.key === "name" ? "asc" : "desc";
                    }
                    prefs.gallerySort = gallerySort;
                    prefs.gallerySortDir = gallerySortDir;
                    saveP();
                    sortWrap.querySelectorAll(".pdx-gal-chip").forEach(c => {
                        c.classList.toggle("is-active", c.dataset.sort === gallerySort);
                        const dir = c.querySelector(".pdx-gal-dir");
                        if (dir) dir.remove();
                    });
                    const active = sortWrap.querySelector(".pdx-gal-chip.is-active");
                    if (active && gallerySort !== "default") {
                        active.append(el("span", { class: "pdx-gal-dir" }, gallerySortDir === "desc" ? "↓" : "↑"));
                    }
                    renderGalleryGroups();
                }
            }, s.label);
            b.dataset.sort = s.key;
            if (gallerySort === s.key && s.key !== "default") {
                b.append(el("span", { class: "pdx-gal-dir" }, gallerySortDir === "desc" ? "↓" : "↑"));
            }
            sortWrap.append(b);
        });

        const groupToggle = el("button", {
            type: "button",
            class: "pdx-item pdx-gal-group-btn" + (isGalleryGrouped ? " is-active" : ""),
            title: "Agrupar arquivos por tipo de mídia (Vídeos, Fotos, etc.)",
            onClick: () => {
                isGalleryGrouped = !isGalleryGrouped;
                prefs.groupByType = isGalleryGrouped;
                saveP();
                groupToggle.classList.toggle("is-active", isGalleryGrouped);
                const txt = groupToggle.querySelector("span");
                if (txt) txt.textContent = isGalleryGrouped ? "Desagrupar" : "Agrupar por Tipo";
                renderGalleryGroups();
            }
        });
        groupToggle.innerHTML = `${PL_ICONS.playlist} <span>${isGalleryGrouped ? "Desagrupar" : "Agrupar por Tipo"}</span>`;

        actsRow.append(
            searchLabel,
            sortWrap,
            groupToggle,
            el("div", { class: "pdx-spacer" }),
            tbtn("folder_zip", "Baixar tudo (.zip)", "Baixar o álbum inteiro via mirror", () => window.open(M().zip(al.lid), "_blank")),
            tbtn("content_copy", "Copiar todos", al.files.length + " links — cola no gerenciador", () => copyText(links()).then(() => toast(al.files.length + " links copiados"))),
            tbtn("description", "Exportar .txt", "Lista aria2 -i", () => { downloadText((al.lid || "album") + ".txt", links()); toast("Lista exportada"); })
        );

        bar.append(topRow, actsRow);
        fv.insertBefore(bar, fv.firstChild);
    }

    function applyGalleryFilter(q) {
        state.filter = (q || "").trim().toLowerCase();
        try {
            const u = new URL(location.href);
            if (state.filter) u.searchParams.set("q", state.filter); else u.searchParams.delete("q");
            history.replaceState(history.state, "", u.pathname + u.search + u.hash);
        } catch {}

        const cards = document.querySelectorAll(".file_viewer .gallery > .file, .file_preview .gallery > .file");
        let shown = 0;
        cards.forEach(c => {
            const name = (c.dataset.pdxName || c.textContent || "").trim().toLowerCase();
            const vis = !state.filter || name.indexOf(state.filter) !== -1;
            c.style.display = vis ? "" : "none";
            if (vis) shown++;
        });

        const al = albumInfo();
        const t = document.querySelector(".pdx-galtitle");
        if (t && al) {
            t.textContent = (al.title || "Álbum") + " · " + (state.filter ? `${shown} de ${cards.length}` : `${cards.length} arquivos`);
        }
    }

    /* TOPBAR DO MODO CONTEÚDO (1 ROW NO DESKTOP ESTILO BUNKR) */
    function buildVideoRowOnce(vrow) {
        const al = albumInfo();
        const multi = !!(al && al.files.length > 1);

        // Lado Esquerdo: Galeria, Logo e Nome do arquivo
        const topRow = el("div", { class: "pdx-vrow-top" });
        const logoLink = el("a", { class: "pdx-logo-link", href: "/", title: "Pixeldrain" },
            el("img", { src: "/res/img/pixeldrain_32.png", alt: "pd" }),
            el("span", { class: "pdx-logo-title" }, "Pixeldrain")
        );
        const nameEl = el("div", { class: "pdx-name", title: "" }, icon("movie"), el("span"));
        topRow.append(logoLink, vsep(), nameEl);

        // Lado Direito: Stats, Mirror e Playlist Toggle (só quando fechada)
        const actsRow = el("div", { class: "pdx-vrow-actions" });
        const statsEl = el("div", { class: "pdx-stats" }, statCell("Views"), statCell("Downloads"), statCell("Tamanho"));

        let plBtn = null;
        if (multi) {
            plBtn = el("button", {
                type: "button",
                class: "pdx-item pdx-vrow-playlist",
                style: { display: isSidebarCollapsed ? "inline-flex" : "none" },
                title: "Abrir playlist (p)",
                onClick: () => toggleSidebar()
            });
            plBtn.innerHTML = `${PL_ICONS.playlist} <span>Playlist</span> <span class="pdx-pl-count-badge">${al.files.length}</span>`;
        }

        actsRow.append(
            statsEl,
            vsep(),
            buildMirrorChip()
        );
        if (plBtn) {
            actsRow.append(vsep(), plBtn);
        }

        vrow.append(topRow, el("div", { class: "pdx-spacer" }), actsRow);
    }

    function updateVideoRow(vrow, f) {
        state.file = f;
        if (vrow.dataset.fid === String(f.id)) return;
        vrow.dataset.fid = String(f.id);

        const nameEl = vrow.querySelector(".pdx-name");
        if (nameEl) {
            const displayTitle = f.displayTitle || f.name;
            nameEl.title = f.name;
            const ic = nameEl.querySelector(".icon");
            if (ic) ic.textContent = isVideoFile(f) ? "movie" : isImageFile(f) ? "image" : "draft";
            const sp = nameEl.querySelector("span");
            if (sp) sp.textContent = displayTitle;
        }

        const sv = vrow.querySelectorAll(".pdx-statv");
        if (sv[0]) sv[0].textContent = String(f.views ?? "—");
        if (sv[1]) sv[1].textContent = String(f.downloads ?? "—");
        if (sv[2]) sv[2].textContent = f.size ? fmtSize(f.size) : "—";

        // Sincroniza estado visual do botão de playlist (só visível se sidebar fechada)
        const plBtn = vrow.querySelector(".pdx-vrow-playlist");
        if (plBtn) plBtn.style.display = isSidebarCollapsed ? "inline-flex" : "none";
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
    function navItem(d) {
        const a = albumInfo();
        if (!a || !a.files.length) return;
        const curIdx = currentIndex();
        const nextIdx = ((curIdx + d) % a.files.length + a.files.length) % a.files.length;
        writePosition(nextIdx + 1);
        location.hash = "#item=" + nextIdx;
    }

    /* ==================================================================== * (7) ORQUESTRAÇÃO & SYNC */
    let lastSig = null;
    const sync = debounce(() => {
        const fv = document.querySelector(".file_viewer");
        const row = document.querySelector(".file_preview_row");
        if (!fv || !row) return;

        hideForeign(fv, ["file_preview_row"]);
        hideForeign(row, ["file_preview", "pdx-sidebar"]);
        const preview = row.querySelector(".file_preview");
        if (preview) preview.style.left = "0";

        buildGlobalTopbar(fv);

        const gal = inGallery();
        const f = gal ? null : currentFile();
        const sig = (gal ? "G" : "C") + "|" + location.hash + "|" + (f ? f.id : "");

        if (sig === lastSig) {
            if (gal) {
                clearPlayerOverlay();
            } else if (f) {
                if (isVideoFile(f)) mountPlayer(f);
                else if (isImageFile(f)) mountImage(f);
                else if (isTextFile(f)) mountTextViewer(f);
            }
            return;
        }
        lastSig = sig;

        if (gal) {
            clearPlayerOverlay();
            buildGalbar(fv);
            fv.classList.add("pdx-mode-gallery");
            fv.classList.remove("pdx-mode-content");
            row.classList.remove("pdx-has-sidebar");
            if (stSidebarEl) { stSidebarEl.remove(); stSidebarEl = null; }
            const sm = row.querySelector(":scope > .pdx-stage-main");
            if (sm) {
                if (preview && preview.parentNode === sm) row.appendChild(preview);
                sm.remove();
            }
            const galbar = fv.querySelector(":scope > .pdx-galbar");
            if (galbar) galbar.style.display = "";
            const vrow = fv.querySelector(":scope > .pdx-vrow");
            if (vrow) vrow.style.display = "none";
            const gtop = fv.querySelector(":scope > .pdx-gtop");
            if (gtop) gtop.style.display = "none";
            decorateGalleryCards();
            if (state.filter) { applyGalleryFilter(state.filter); }
            if (isGalleryGrouped) setTimeout(renderGalleryGroups, 100);
            return;
        }

        fv.classList.add("pdx-mode-content");
        fv.classList.remove("pdx-mode-gallery");
        const galbar = fv.querySelector(":scope > .pdx-galbar");
        if (galbar) galbar.style.display = "none";
        const gtop = fv.querySelector(":scope > .pdx-gtop");
        if (gtop) gtop.style.display = "none";

        if (!f) { teardownPlayer(); return; }

        // Estrutura Bunkr: coluna principal da esquerda (pdx-stage-main) contendo Topbar (pdx-vrow) + Mídia (file_preview)
        let stageMain = row.querySelector(":scope > .pdx-stage-main");
        if (!stageMain) {
            stageMain = el("div", { class: "pdx-stage-main" });
            row.insertBefore(stageMain, row.firstChild);
            if (preview && preview.parentNode !== stageMain) {
                stageMain.appendChild(preview);
            }
        } else if (preview && preview.parentNode !== stageMain) {
            stageMain.appendChild(preview);
        }

        let vrow = stageMain.querySelector(":scope > .pdx-vrow");
        if (!vrow) {
            // Remove qualquer vrow antigo solto no fv se existir
            fv.querySelectorAll(":scope > .pdx-vrow").forEach(v => v.remove());
            vrow = el("div", { class: "pdx-vrow" });
            stageMain.insertBefore(vrow, preview);
            buildVideoRowOnce(vrow);
        }
        vrow.style.display = "";
        updateVideoRow(vrow, f);

        // Sidebar Playlist ao lado da coluna principal (stageMain) com 100vh
        setupSidebar(row);

        // Monta o visualizador apropriado
        if (isVideoFile(f)) mountPlayer(f);
        else if (isImageFile(f)) mountImage(f);
        else if (isTextFile(f)) mountTextViewer(f);
        else teardownPlayer();
    }, 100);

    /* ==================================================================== * TEMA & CSS AMOLED */
    addStyle(`
        :root {
            --pdx-green: #ffffff;
            --pdx-green-2: #ffffff;
            --pdx-text: #f2f2f2;
            --pdx-muted: #9a9a9a;
            --pdx-surface: #0a0a0a;
            --pdx-surface-2: #121212;
            --pdx-line: #1c1c1c;
        }
        :root, html, body {
            --body_background: #000 !important;
            --body_color: #000 !important;
            --background_color: #000 !important;
            --background: #000 !important;
            --background_pattern: none !important;
            --background_text_color: #f2f2f2 !important;
            --body_text_color: #f2f2f2 !important;
            --card_color: #0a0a0a !important;
            --shaded_background: rgba(0,0,0,.9) !important;
            --separator: #1c1c1c !important;
            --highlight_color: #ffffff !important;
            --highlight_background: rgba(255,255,255,.12) !important;
            --input_background: #0e0e0e !important;
            --input_hover_background: #171717 !important;
            --input_text: #f2f2f2 !important;
        }
        body { background: #000 !important; font-family: Inter, system-ui, -apple-system, sans-serif !important; }

        /* Early paint hide */
        .file_viewer > .headerbar, .file_viewer > .progress_bar_outer, .file_preview_row > .toolbar, .file_viewer > .nav_container { display: none !important; }
        .file_preview { padding: 0 !important; border: none !important; background: #000 !important; }
        .file_preview .block { background: #000 !important; border: none !important; }

        /* MODO CONTEÚDO: Stage Flex com Sidebar 100vh ao lado de tudo (Estilo Bunkr) */
        .file_viewer.pdx-mode-content { display: flex !important; flex-direction: column !important; height: 100vh !important; overflow: hidden !important; }
        .file_viewer.pdx-mode-content .pdx-gtop,
        .file_viewer.pdx-mode-content .pdx-galbar {
            display: none !important;
        }
        .file_viewer.pdx-mode-content .file_preview_row {
            display: flex !important;
            flex-direction: row !important;
            height: 100vh !important;
            flex: 1 1 100vh !important;
            min-height: 0 !important;
            overflow: hidden !important;
            background: #000 !important;
            position: relative !important;
        }
        .pdx-stage-main {
            flex: 1 1 0% !important;
            min-width: 0 !important;
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            position: relative !important;
            overflow: hidden !important;
            background: #000 !important;
        }
        .file_viewer.pdx-mode-content .file_preview {
            flex: 1 1 auto !important;
            min-width: 0 !important;
            height: 100% !important;
            position: relative !important;
            background: #000 !important;
            overflow: hidden !important;
        }

        /* TOPBAR DA GALERIA */
        .pdx-galbar {
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px;
            padding: 10px 16px 12px;
            background: #0a0a0a;
            border-bottom: 1px solid #1c1c1c;
            flex: 0 0 auto;
            box-sizing: border-box;
        }
        .pdx-galbar-top { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .pdx-galtitle { font-size: 14px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pdx-galbar-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0; }
        .pdx-search {
            display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 12px;
            border-radius: 10px; border: 1px solid rgba(255,255,255,.12); background: #141414; color: rgba(255,255,255,.55);
            flex: 1 1 220px; max-width: 340px; min-width: 180px; box-sizing: border-box;
        }
        .pdx-search .icon { font-size: 18px; color: rgba(255,255,255,.45); }
        .pdx-search-in {
            flex: 1 1 auto; min-width: 0; width: 100%; height: 100%; border: 0; outline: none;
            background: transparent; color: #fff; font: 500 13px/1 Inter, system-ui, sans-serif;
            -webkit-appearance: none; appearance: none;
        }
        .pdx-search-in::placeholder { color: rgba(255,255,255,.38); }
        .pdx-gal-sort { display: inline-flex; align-items: center; gap: 6px; flex: 0 1 auto; flex-wrap: wrap; }
        .pdx-gal-chip {
            display: inline-flex; align-items: center; gap: 4px; height: 32px; padding: 0 12px;
            border-radius: 999px; border: 1px solid rgba(255,255,255,.12); background: #141414;
            color: rgba(255,255,255,.78); font: 600 12.5px/1 Inter, system-ui, sans-serif; cursor: pointer;
        }
        .pdx-gal-chip:hover { border-color: rgba(255,255,255,.28); color: #fff; }
        .pdx-gal-chip.is-active { background: #fff; border-color: #fff; color: #111; }
        .pdx-gal-dir { font-size: 11px; }

        /* ===================== GRADE DE CARDS NA GALERIA ===================== */
        .file_viewer .gallery,
        .file_preview .gallery {
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
            gap: 28px 20px !important;
            padding: 18px 20px 48px !important;
            background: #000 !important;
            box-sizing: border-box !important;
            width: 100% !important;
            max-width: none !important;
            justify-items: stretch !important;
            align-items: start !important;
        }
        @media (min-width: 1600px) {
            .file_viewer .gallery,
            .file_preview .gallery { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)) !important; gap: 32px 24px !important; }
        }
        @media (max-width: 768px) {
            .file_viewer .gallery,
            .file_preview .gallery { grid-template-columns: 1fr !important; gap: 20px 16px !important; }
        }
        .file_viewer .gallery > a.file,
        .file_preview .gallery > a.file {
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            justify-content: flex-start !important;
            background: transparent !important;
            border: 0 !important;
            outline: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            text-decoration: none !important;
            color: #fff !important;
            position: relative !important;
            width: 100% !important;
            max-width: none !important;
            min-width: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 0 !important;
            float: none !important;
        }
        .file_viewer .gallery > a.file > .icon_container,
        .file_preview .gallery > a.file > .icon_container {
            display: block !important;
            width: 100% !important;
            aspect-ratio: 16 / 9 !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            border-radius: 12px !important;
            overflow: hidden !important;
            background-size: cover !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            background-color: #111 !important;
            position: relative !important;
            font-size: 14px !important;
        }
        .file_viewer .gallery > a.file:hover .icon_container,
        .file_preview .gallery > a.file:hover .icon_container {
            box-shadow: 0 8px 24px rgba(0,0,0,.55) !important;
        }
        .file_preview .gallery .file .image {
            width: 100% !important;
            aspect-ratio: 16 / 9 !important;
            height: auto !important;
            background: #050605 !important;
            position: relative !important;
            overflow: hidden !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
        .file_preview .gallery .file .image img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            display: block !important;
        }
        .pdx-card-play-overlay {
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 44px !important;
            height: 44px !important;
            border-radius: 50% !important;
            background: rgba(0,0,0,.7) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            pointer-events: none !important;
            opacity: 0.85 !important;
            z-index: 2 !important;
        }
        .file:hover .pdx-card-play-overlay { opacity: 1 !important; }
        .pdx-card-play-overlay svg { width: 22px !important; height: 22px !important; color: #fff !important; }
        .pdx-card-body {
            width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
            padding: 8px 2px 0 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 2px !important;
            background: transparent !important;
            position: static !important;
            overflow: visible !important;
            font-size: 14px !important;
            text-align: left !important;
        }
        .pdx-card-name {
            width: 100% !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            color: #f3f4f6 !important;
            line-height: 1.35 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            word-break: break-word !important;
            white-space: normal !important;
        }
        .pdx-card-date-val {
            display: block !important;
            width: auto !important;
            max-width: 100% !important;
            overflow: visible !important;
            text-overflow: clip !important;
            white-space: nowrap !important;
            color: rgba(255,255,255,.72) !important;
            font-weight: 500 !important;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;
            font-size: 12.5px !important;
            line-height: 1.35 !important;
        }
        .pdx-card-foot {
            font-size: 12px !important;
            font-weight: 500 !important;
            color: rgba(255,255,255,.45) !important;
            white-space: nowrap !important;
            line-height: 1.35 !important;
        }

        /* TOPBAR VROW (1 ROW NO DESKTOP ESTILO BUNKR) */
        .pdx-vrow {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            height: 52px;
            min-height: 52px;
            padding: 0 16px;
            background: var(--pdx-surface, #0a0a0a);
            border-bottom: 1px solid var(--pdx-line, #1c1c1c);
            flex: 0 0 auto;
            white-space: nowrap;
            box-sizing: border-box;
        }
        .pdx-vrow-top { display: flex; align-items: center; gap: 8px; flex: 1 1 auto; min-width: 0; }
        .pdx-vrow-actions { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }

        .pdx-logo-link { display: inline-flex; align-items: center; gap: 6px; text-decoration: none; color: #fff; font-weight: 700; font-size: 14px; padding: 4px 6px; border-radius: 6px; flex: 0 0 auto; }
        .pdx-logo-link img { width: 20px; height: 20px; display: block; }
        .pdx-logo-title { font-weight: 800; letter-spacing: -0.02em; }

        .pdx-name { display: inline-flex; align-items: center; gap: 7px; color: #fff; font-weight: 600; font-size: 13.5px; flex: 0 1 auto; min-width: 60px; max-width: 38vw; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pdx-name .icon { color: var(--pdx-green); font-size: 18px; flex: 0 0 auto; }
        .pdx-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .pdx-stats { display: flex; align-items: center; gap: 14px; flex: 0 0 auto; }
        .pdx-stat { display: inline-flex; align-items: baseline; gap: 5px; }
        .pdx-stat .pdx-k { font-size: 10px; color: var(--pdx-muted); text-transform: uppercase; letter-spacing: .05em; }
        .pdx-stat .pdx-statv { font-size: 12px; color: #fff; font-weight: 700; }
        .pdx-spacer { flex: 1 1 auto; min-width: 8px; }
        .pdx-vsep { width: 1px; height: 20px; background: var(--pdx-line); margin: 0 2px; }

        .pdx-item {
            display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 10px; border: 1px solid var(--pdx-line, #1c1c1c);
            border-radius: 8px; background: var(--input_background, #0e0e0e); color: var(--pdx-text, #f2f2f2); font: 600 12.5px/1 Inter, system-ui, sans-serif;
            cursor: pointer; text-decoration: none; transition: background .12s, border-color .12s; white-space: nowrap;
        }
        .pdx-item:hover { background: var(--input_hover_background, #171717); border-color: #ffffff66; }
        .pdx-item .icon { font-size: 17px; color: var(--pdx-green); }
        .pdx-item svg { width: 14px; height: 14px; }
        .pdx-primary { background: var(--pdx-green); border-color: var(--pdx-green); color: #111111 !important; font-weight: 700; }
        .pdx-primary .icon, .pdx-primary svg { color: #111111 !important; }
        .pdx-primary:hover { background: var(--pdx-green-2); border-color: var(--pdx-green-2); }
        .pdx-vrow-playlist.is-active { background: rgba(255,255,255,.18); border-color: var(--pdx-green); color: #ffffff; }
        .pdx-pl-count-badge { font-size: 11px; font-weight: 700; background: rgba(255,255,255,.14); padding: 2px 6px; border-radius: 999px; margin-left: 2px; }

        /* MIRROR DROPDOWN & WIDGET */
        .pdx-mirror-wrap, .pdx-player-mirror { position: relative; display: inline-flex; }
        .pdx-mirror-chev { font-size: 15px !important; margin-left: -2px; opacity: .7; transition: transform .12s; }
        .pdx-mirror-wrap.is-open .pdx-mirror-chev { transform: rotate(180deg); }
        .pdx-mirror-spin { display: none; width: 13px; height: 13px; border-radius: 50%; border: 2px solid #ffffff44; border-top-color: var(--pdx-green); animation: pdx-spin .7s linear infinite; }
        .pdx-loading .pdx-mirror-spin { display: inline-block; }
        .pdx-loading > svg:not(.pdx-mirror-chev), .pdx-loading > .icon:not(.pdx-mirror-chev) { display: none; }

        .pdx-player-mirror { display: none !important; }
        .pdx-host:hover .pdx-player-mirror, .pdx-player-mirror.is-open { opacity: 1; pointer-events: auto; }
        .pdx-player-mirror-btn {
            display: inline-flex; align-items: center; gap: 7px; height: 34px; padding: 0 12px; border-radius: 10px;
            border: 1px solid rgba(255,255,255,.18); background: rgba(14,16,14,.8); color: #fff; font: 700 12.5px/1 Inter, sans-serif;
            cursor: pointer; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); box-shadow: 0 4px 16px rgba(0,0,0,.5);
            transition: all .14s ease;
        }
        .pdx-player-mirror-btn svg { width: 15px; height: 15px; color: var(--pdx-green); }
        .pdx-player-mirror-btn:hover, .pdx-player-mirror.is-open .pdx-player-mirror-btn { background: var(--pdx-green); color: #111111; border-color: var(--pdx-green); }
        .pdx-player-mirror-btn:hover svg, .pdx-player-mirror.is-open .pdx-player-mirror-btn svg { color: #111111; }

        .pdx-mirror-menu {
            position: fixed; z-index: 10002; width: 290px; max-width: 85vw; background: rgba(14,16,14,.98);
            border: 1px solid var(--pdx-line); border-radius: 12px; box-shadow: 0 16px 42px rgba(0,0,0,.7);
            padding: 8px; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: flex; flex-direction: column; gap: 6px;
        }
        .pdx-mirror-menu[hidden] { display: none; }
        .pdx-mirror-menu-h { font-size: 11px; font-weight: 700; color: var(--pdx-muted); text-transform: uppercase; letter-spacing: .05em; padding: 4px 6px; }
        .pdx-mirror-menu-h b { color: var(--pdx-green); }
        .pdx-mirror-grid { display: flex; flex-direction: column; gap: 3px; max-height: 240px; overflow-y: auto; }
        .pdx-mirror-grid-item {
            display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 8px; border: 0; background: transparent;
            color: var(--pdx-text); font: 600 12.5px Inter, sans-serif; cursor: pointer; text-align: left; transition: background .12s;
        }
        .pdx-mirror-grid-item:hover { background: rgba(255,255,255,.08); }
        .pdx-mirror-grid-item.is-current { background: rgba(255,255,255,.16); color: var(--pdx-green); font-weight: 700; }
        .pdx-mirror-item-icon svg { width: 14px; height: 14px; color: inherit; }
        .pdx-mirror-item-title { flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pdx-mirror-actions { border-top: 1px solid var(--pdx-line); padding-top: 6px; display: flex; flex-direction: column; gap: 3px; }
        .pdx-mirror-action-btn {
            display: flex; align-items: center; gap: 8px; padding: 7px 10px; border: 0; border-radius: 7px; background: transparent;
            color: var(--pdx-muted); font: 500 12px Inter, sans-serif; cursor: pointer; text-align: left; transition: all .12s;
        }
        .pdx-mirror-action-btn:hover { background: rgba(255,255,255,.06); color: #fff; }
        .pdx-mirror-action-btn svg { width: 14px; height: 14px; }

        /* MIRROR WARN BANNER FLUTUANTE */
        .pdx-mirror-warn {
            position: fixed; top: 18px; left: 50%; transform: translateX(-50%) translateY(-20px); z-index: 10005;
            display: flex; align-items: center; gap: 12px; max-width: calc(100% - 32px); padding: 10px 18px;
            border-radius: 12px; background: rgba(176, 32, 32, 0.94); color: #fff; font: 600 13px Inter, sans-serif;
            box-shadow: 0 12px 34px rgba(0,0,0,0.6); opacity: 0; pointer-events: none; transition: all .2s ease;
        }
        .pdx-mirror-warn.show { transform: translateX(-50%) translateY(0); opacity: 1; pointer-events: auto; }
        .pdx-mirror-warn-t b { font-weight: 800; text-decoration: underline; }
        .pdx-mirror-warn-x { background: transparent; border: 0; color: #fff; cursor: pointer; display: flex; opacity: .8; padding: 2px; }
        .pdx-mirror-warn-x:hover { opacity: 1; }
        .pdx-mirror-warn-x svg { width: 15px; height: 15px; }

        /* ===================== SIDEBAR DA PLAYLIST ===================== */
        .pdx-sidebar {
            width: 380px; flex: 0 0 380px; height: 100%; display: flex; flex-direction: column;
            background: #080908; border-left: 1px solid var(--pdx-line, #1c1c1c); overflow: hidden; z-index: 25;
            transition: width .18s ease, margin .18s ease;
        }
        .pdx-sidebar-collapsed .pdx-sidebar { display: none !important; }

        .pdx-sidebar-header {
            display: flex; align-items: center; justify-content: space-between; padding: 12px 14px 8px;
            border-bottom: 1px solid rgba(255,255,255,.06); flex: 0 0 auto;
        }
        .pdx-sidebar-title-wrap { display: flex; align-items: center; gap: 8px; }
        .pdx-sidebar-icon svg { width: 18px; height: 18px; color: var(--pdx-green); }
        .pdx-sidebar-title { font-size: 14.5px; font-weight: 700; color: #fff; }
        .pdx-sidebar-count { font-size: 11.5px; font-weight: 600; color: var(--pdx-muted); background: rgba(255,255,255,.06); padding: 2px 7px; border-radius: 999px; }
        .pdx-sidebar-collapse-btn { background: transparent; border: 0; color: var(--pdx-muted); cursor: pointer; display: flex; padding: 4px; border-radius: 6px; }
        .pdx-sidebar-collapse-btn:hover { background: rgba(255,255,255,.08); color: #fff; }
        .pdx-sidebar-collapse-btn svg { width: 16px; height: 16px; }
        .pdx-sidebar-actions { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; }
        .pdx-sidebar-gallery-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; border-radius: 8px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); color: #fff; font: 600 12px/1 Inter, system-ui, sans-serif; cursor: pointer; }
        .pdx-sidebar-gallery-btn:hover { background: rgba(255,255,255,.12); }
        .pdx-sidebar-gallery-btn svg { width: 14px; height: 14px; }
        .pdx-playlist-dates { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .pdx-playlist-dates { min-width: 0; }
        .pdx-playlist-date-row { display: block; min-width: 0; font-size: 12.5px; line-height: 1.3; white-space: nowrap; }
        .pdx-playlist-date-val { display: block; overflow: visible; white-space: nowrap; color: rgba(255,255,255,.72); font-weight: 500; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; }
        .pdx-playlist-now-playing { position: absolute; top: 5px; left: 5px; width: 22px; height: 22px; border-radius: 50%; background: #fff; color: #111; display: flex; align-items: center; justify-content: center; }
        .pdx-playlist-now-playing svg { width: 12px; height: 12px; }

        .pdx-sidebar-search {
            position: relative; display: flex; align-items: center; margin: 8px 12px 6px; background: rgba(255,255,255,.05);
            border: 1px solid rgba(255,255,255,.08); border-radius: 8px; padding: 0 8px; flex: 0 0 auto;
        }
        .pdx-sidebar-search:focus-within { border-color: var(--pdx-green); background: rgba(255,255,255,.08); }
        .pdx-sidebar-search-icon svg { width: 14px; height: 14px; color: var(--pdx-muted); margin-right: 6px; }
        .pdx-sidebar-search-in { width: 100%; height: 32px; background: transparent; border: 0; outline: none; color: #fff; font: 12.5px Inter, sans-serif; }
        .pdx-sidebar-search-in::placeholder { color: var(--pdx-muted); }

        .pdx-sidebar-tabs { display: flex; align-items: center; gap: 5px; padding: 4px 12px 6px; overflow-x: auto; scrollbar-width: none; flex: 0 0 auto; }
        .pdx-sidebar-tabs::-webkit-scrollbar { display: none; }
        .pdx-tab-chip {
            display: inline-flex; align-items: center; gap: 5px; height: 26px; padding: 0 9px; border-radius: 6px;
            background: rgba(255,255,255,.05); border: 1px solid transparent; color: var(--pdx-muted); font: 600 11.5px/1 Inter, sans-serif;
            cursor: pointer; transition: all .12s; white-space: nowrap;
        }
        .pdx-tab-chip:hover { background: rgba(255,255,255,.09); color: #fff; }
        .pdx-tab-chip.is-active { background: rgba(255,255,255,.18); border-color: var(--pdx-green); color: #ffffff; }
        .pdx-tab-count { font-size: 10px; opacity: .75; }

        .pdx-sidebar-sort { display: flex; align-items: center; gap: 6px; padding: 4px 12px 6px; font-size: 11px; color: var(--pdx-muted); flex: 0 0 auto; }
        .pdx-sort-label { text-transform: uppercase; letter-spacing: .04em; }
        .pdx-sort-chip {
            background: transparent; border: 0; color: var(--pdx-muted); font: 600 11px Inter, sans-serif; cursor: pointer; padding: 2px 5px; border-radius: 4px;
        }
        .pdx-sort-chip:hover { color: #fff; }
        .pdx-sort-chip.is-active { color: var(--pdx-green); font-weight: 700; text-decoration: underline; }

        .pdx-playlist-list { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 8px 10px; display: flex; flex-direction: column; gap: 8px; scrollbar-width: thin; }
        .pdx-playlist-list::-webkit-scrollbar { width: 6px; }
        .pdx-playlist-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,.28); border-radius: 4px; }

        .pdx-playlist-item {
            display: flex; align-items: flex-start; gap: 12px; padding: 8px; border-radius: 10px; background: rgba(255,255,255,.02);
            border: 1px solid transparent; cursor: pointer; transition: background .12s, border-color .12s, transform .1s; position: relative;
        }
        .pdx-playlist-item:hover { background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.08); transform: translateX(2px); }
        .pdx-playlist-item.is-current { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.38); }

        .pdx-playlist-thumb-wrap {
            position: relative; flex: 0 0 176px; width: 176px; height: 99px; border-radius: 8px;
            overflow: hidden; background: #181920;
        }
        .pdx-playlist-kind { position: absolute; top: 6px; left: 6px; z-index: 1; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.78); color: #fff; font: 700 10px/1.2 Inter, system-ui, sans-serif; letter-spacing: .02em; }
        .pdx-playlist-num { position: absolute; top: 6px; right: 6px; z-index: 1; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.8); color: #fff; font: 700 11px/1 Inter, system-ui, sans-serif; }
        .pdx-playlist-dur { position: absolute; bottom: 5px; right: 6px; z-index: 1; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.8); color: #fff; font: 700 11px/1 Inter, system-ui, sans-serif; }
        .pdx-playlist-dur[hidden] { display: none !important; }
        .pdx-playlist-thumb, .pdx-playlist-thumb-wrap > img { position: absolute; inset: 0; width: 100%; height: 100%; max-width: none; object-fit: cover; object-position: center; display: block; }
        .pdx-playlist-thumb-idx { position: absolute; top: 4px; left: 4px; background: rgba(0,0,0,.75); color: #fff; font: 700 9.5px Inter; padding: 1.5px 5px; border-radius: 4px; }
        .pdx-playlist-now-playing { position: absolute; top: 5px; left: 5px; right: auto; bottom: auto; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 50%; background: #fff; color: #111; display: flex; align-items: center; justify-content: center; }
        .pdx-now-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--pdx-green); animation: pdx-pulse 1.2s infinite; }

        .pdx-playlist-placeholder { width: 100%; height: 100%; background: #070707; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
        .pdx-playlist-ph-icon svg { width: 22px; height: 22px; color: var(--pdx-green); opacity: .75; }
        .pdx-playlist-ph-ext { font: 800 9px Inter; letter-spacing: .06em; color: rgba(255,255,255,.5); background: rgba(255,255,255,.08); padding: 1px 5px; border-radius: 3px; }

        .pdx-playlist-info { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .pdx-playlist-name {
            font-size: 14.5px; font-weight: 500; color: rgba(255,255,255,.9); line-height: 1.35; display: -webkit-box;
            -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word;
        }
        .pdx-playlist-item.is-current .pdx-playlist-name { color: var(--pdx-green-2); }
        .pdx-playlist-meta { font-size: 12.5px; color: rgba(255,255,255,.55); display: flex; align-items: center; gap: 8px; }
        .pdx-playlist-meta-active { color: var(--pdx-green); font-weight: 700; }
        .pdx-playlist-empty { padding: 32px 16px; text-align: center; color: var(--pdx-muted); font-size: 13px; }

        /* ===================== VISUALIZADOR DE TEXTO ===================== */
        .pdx-txt-host { display: flex; flex-direction: column; background: #070707; }
        .pdx-txt-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; background: #0d0d0d; border-bottom: 1px solid var(--pdx-line); flex: 0 0 auto; gap: 12px; }
        .pdx-txt-title { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .pdx-txt-icon svg { width: 18px; height: 18px; color: var(--pdx-green); }
        .pdx-txt-name { font-size: 14px; font-weight: 700; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pdx-txt-badge { font-size: 10px; font-weight: 800; color: var(--pdx-green); background: rgba(255,255,255,.16); padding: 2px 6px; border-radius: 4px; }
        .pdx-txt-meta { font-size: 12px; color: var(--pdx-muted); display: flex; align-items: center; gap: 6px; }
        .pdx-txt-bullet { opacity: .4; }
        .pdx-txt-tools { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
        .pdx-txt-body {
            flex: 1 1 auto; margin: 0; padding: 18px; background: #050605; color: #d4d4d8; font: 13px/1.65 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            overflow: auto; white-space: pre-wrap; word-break: break-word; tab-size: 4;
        }

        /* ===================== AGRUPAMENTO NA GALERIA ===================== */
        .pdx-gal-group-header {
            grid-column: 1 / -1 !important; display: flex !important; align-items: center; justify-content: space-between;
            padding: 18px 4px 8px; margin-top: 14px; border-bottom: 1px solid var(--pdx-line);
        }
        .pdx-gal-group-title { font-size: 15px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px; }
        .pdx-gal-group-icon svg { width: 18px; height: 18px; color: var(--pdx-green); }
        .pdx-gal-group-count { font-size: 11.5px; font-weight: 600; color: var(--pdx-muted); background: rgba(255,255,255,.08); padding: 3px 9px; border-radius: 999px; }
        .pdx-gal-group-btn.is-active { background: rgba(255,255,255,.18); border-color: var(--pdx-green); color: #ffffff; }

        /* ===================== CONTROLES DO PLAYER ===================== */
        .pdx-host { position: absolute; inset: 0; z-index: 30; background: #000; overflow: hidden; }
        .pdx-video { position: absolute; inset: 0; width: 100% !important; height: 100% !important; object-fit: contain !important; background: #000 !important; outline: none; cursor: pointer; display: block; }
        .pdx-img-host { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; overflow: visible; }
        .pdx-image { max-width: 100% !important; max-height: 100% !important; object-fit: contain !important; background: #000 !important; cursor: zoom-in; user-select: none; will-change: transform; touch-action: none; }
        .pdx-img-host.pdx-zoomed .pdx-image { cursor: grab; }
        .pdx-img-host.pdx-zoomed .pdx-image:active { cursor: grabbing; }

        .pdx-plc-flash { position: absolute; inset: 0; z-index: 2; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .2s ease; }
        .pdx-pl:not(.pdx-pl-playing):not(.pdx-pl-buffering) .pdx-plc-flash { opacity: 1; }
        .pdx-plc-play { width: 66px; height: 66px; border: 0; border-radius: 50%; cursor: pointer; padding: 0; background: rgba(0,0,0,.65); color: #fff; display: flex; align-items: center; justify-content: center; transition: transform .12s, background .12s; pointer-events: auto; }
        .pdx-plc-play:hover { transform: scale(1.08); background: rgba(0,0,0,.85); }
        .pdx-plc-play svg { width: 28px; height: 28px; margin-left: 3px; }

        .pdx-plc-bottom {
            position: absolute; left: 0; right: 0; bottom: 0; z-index: 4; padding: 12px 10px 4px;
            background: linear-gradient(to top, rgba(0,0,0,.92) 0%, rgba(0,0,0,.4) 65%, transparent 100%);
            opacity: 0; pointer-events: none; transition: opacity .18s ease; display: flex; flex-direction: column; gap: 4px;
        }
        .pdx-pl:hover .pdx-plc-bottom, .pdx-pl:not(.pdx-pl-playing) .pdx-plc-bottom, .pdx-img-host:hover .pdx-plc-bottom, .pdx-img-host:focus-within .pdx-plc-bottom { opacity: 1; pointer-events: auto; }
        @media (hover:none) { .pdx-plc-bottom { opacity: 1; pointer-events: auto; } }

        .pdx-plc-prog { position: relative; width: 100%; height: 16px; display: flex; align-items: center; cursor: pointer; touch-action: none; }
        .pdx-plc-bar { position: relative; width: 100%; height: 3.5px; background: rgba(255,255,255,.28); border-radius: 3px; transition: height .1s ease; }
        .pdx-plc-prog:hover .pdx-plc-bar { height: 5px; }
        .pdx-plc-buf { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: rgba(255,255,255,.32); border-radius: 3px; }
        .pdx-plc-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: var(--pdx-green); border-radius: 3px; }
        .pdx-plc-knob { position: absolute; right: -6px; top: 50%; width: 12px; height: 12px; border-radius: 50%; background: var(--pdx-green); transform: translateY(-50%) scale(0); transition: transform .1s ease; }
        .pdx-plc-prog:hover .pdx-plc-knob { transform: translateY(-50%) scale(1); }

        .pdx-plc-row { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
        .pdx-plc-left, .pdx-plc-right { display: flex; align-items: center; gap: 3px; }
        .pdx-plc-act { width: 36px; height: 36px; border: 0; border-radius: 50%; cursor: pointer; padding: 0; background: transparent; color: #fff; display: flex; align-items: center; justify-content: center; transition: opacity .1s, transform .1s; }
        .pdx-plc-act:hover { opacity: 1; } .pdx-plc-act:active { transform: scale(.9); }
        .pdx-plc-act.is-active { color: #fff; background: rgba(255,255,255,.16); }
        .pdx-plc-act svg { width: 22px; height: 22px; display: block; }

        .pdx-plc-vol { display: flex; align-items: center; }
        .pdx-plc-volbar { position: relative; width: 0; height: 4px; border-radius: 3px; background: rgba(255,255,255,.35); cursor: pointer; opacity: 0; transition: width .18s, opacity .18s; touch-action: none; }
        .pdx-plc-vol:hover .pdx-plc-volbar { width: 62px; opacity: 1; margin: 0 6px 0 2px; }
        .pdx-plc-volfill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: #fff; border-radius: 3px; }
        .pdx-plc-time { color: #fff; font: 600 12px/1 Inter, sans-serif; font-variant-numeric: tabular-nums; padding: 0 6px; white-space: nowrap; flex: 0 0 auto; }

        /* Velocidade limpa (sem pill pesado) */
        .pdx-plc-autoplay { width: auto; height: 30px; padding: 0 8px 0 10px; border-radius: 15px; gap: 8px; font: 600 12px/1 Inter, system-ui, sans-serif; color: rgba(255,255,255,.85); background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); }
        .pdx-plc-autoplay.is-active { background: rgba(255,255,255,.16); border-color: rgba(255,255,255,.45); color: #fff; }
        .pdx-plc-ap-pill { position: relative; width: 28px; height: 16px; border-radius: 9px; background: rgba(255,255,255,.24); display: block; flex: 0 0 28px; }
        .pdx-plc-ap-knob { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: #fff; display: block; transition: transform .18s ease; }
        .pdx-plc-autoplay.is-active .pdx-plc-ap-pill { background: #fff; }
        .pdx-plc-autoplay.is-active .pdx-plc-ap-knob { transform: translateX(12px); background: #111; }
        .pdx-plc-speed { width: auto !important; min-width: 34px; padding: 0 6px; color: #fff; font: 700 13px/1 Inter, sans-serif; font-variant-numeric: tabular-nums; background: transparent !important; }
        .pdx-plc-skip { position: relative; }
        .pdx-plc-skip .pdx-plc-skipn { position: absolute; left: 0; right: 0; top: 53%; transform: translateY(-50%); text-align: center; font: 800 8.5px Inter; color: #fff; pointer-events: none; }
        .pdx-plc-speedwrap { position: relative; display: flex; align-items: center; }
        .pdx-plc-speedmenu { position: absolute; bottom: calc(100% + 8px); right: 0; z-index: 5; display: none; flex-direction: column; gap: 2px; padding: 6px; max-height: 240px; overflow: auto; background: rgba(14,16,14,.97); border: 1px solid var(--pdx-line); border-radius: 9px; box-shadow: 0 8px 24px rgba(0,0,0,.6); }
        .pdx-plc-speedmenu.open { display: flex; }
        .pdx-plc-speeditem { border: 0; background: transparent; color: #fff; font: 600 13px Inter; padding: 7px 16px; border-radius: 6px; cursor: pointer; text-align: right; }
        .pdx-plc-speeditem:hover { background: rgba(255,255,255,.12); }
        .pdx-plc-speeditem.on { color: var(--pdx-green); font-weight: 800; }

        .pdx-plc-side { position: absolute; top: 50%; transform: translateY(-50%); z-index: 4; width: 44px; height: 44px; border: 0; border-radius: 50%; background: rgba(0,0,0,.5); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .18s; }
        .pdx-plc-sprev { left: 12px; } .pdx-plc-snext { right: 12px; }
        .pdx-pl:hover .pdx-plc-side, .pdx-img-host:hover .pdx-plc-side { opacity: 1; pointer-events: auto; }
        @media (hover:none) { .pdx-plc-side { opacity: .85; pointer-events: auto; } }
        .pdx-plc-side:hover { background: rgba(0,0,0,.75); }
        .pdx-plc-side svg { width: 24px; height: 24px; }

        .pdx-plc-seekflash { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); z-index: 3; color: #fff; font: 700 15px Inter; background: rgba(0,0,0,.6); padding: 9px 16px; border-radius: 999px; opacity: 0; transition: opacity .15s; pointer-events: none; }
        .pdx-plc-seekflash.on { opacity: 1; }
        .pdx-pl.pdx-pl-buffering::after { content: ""; position: absolute; top: 50%; left: 50%; width: 42px; height: 42px; margin: -21px 0 0 -21px; border-radius: 50%; border: 3px solid rgba(255,255,255,.2); border-top-color: var(--pdx-green); animation: pdx-spin .8s linear infinite; z-index: 4; }

        .pdx-fail { position: absolute; inset: 0; z-index: 6; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 24px; text-align: center; color: #fff; background: rgba(0,0,0,.92); font: 14px Inter; }
        .pdx-failrow { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
        .pdx-mini { padding: 6px 12px; border: 1px solid var(--pdx-line); border-radius: 7px; background: #0e0e0e; color: #fff; cursor: pointer; text-decoration: none; font: 600 12.5px Inter; }
        .pdx-mini:hover { background: #171717; border-color: var(--pdx-green); }

        .pdx-toast { position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%) translateY(12px); z-index: 10000; padding: 9px 18px; border-radius: 20px; background: #0e0e0e; border: 1px solid var(--pdx-green); color: #fff; font: 600 13px Inter; box-shadow: 0 6px 20px rgba(0,0,0,.7); opacity: 0; pointer-events: none; transition: all .2s; }
        .pdx-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

        .pdx-modal { position: fixed; inset: 0; z-index: 10001; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.8); backdrop-filter: blur(4px); }
        .pdx-card { background: var(--pdx-surface); color: #fff; border: 1px solid var(--pdx-line); border-radius: 12px; min-width: 320px; max-width: 90vw; max-height: 88vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 16px 48px #000; }
        .pdx-card-h { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 16px; background: #000; font-weight: 700; border-bottom: 1px solid var(--pdx-line); }
        .pdx-x { background: none; border: none; color: var(--pdx-muted); cursor: pointer; display: flex; } .pdx-x:hover { color: #fff; }
        .pdx-card-b { padding: 16px; overflow: auto; }
        .pdx-tbl { width: 100%; border-collapse: collapse; font-size: 13px; } .pdx-tbl td { padding: 6px 8px; border-bottom: 1px solid var(--pdx-line); vertical-align: top; } .pdx-tbl td:first-child { color: var(--pdx-muted); white-space: nowrap; width: 1%; }
        .pdx-links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; } .pdx-links a { padding: 6px 10px; border-radius: 6px; background: #0e0e0e; color: var(--pdx-green); text-decoration: none; font-size: 12px; border: 1px solid var(--pdx-line); font-weight: 600; } .pdx-links a:hover { background: #171717; border-color: var(--pdx-green); }
        .pdx-qr { width: 240px; height: 240px; border-radius: 8px; background: #fff; } .pdx-qrcap { margin-top: 10px; font-size: 12px; color: var(--pdx-muted); max-width: 240px; margin-inline: auto; }

        @keyframes pdx-spin { to { transform: rotate(360deg); } }
        @keyframes pdx-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }

        /* ===================== RESPONSIVIDADE MOBILE ===================== */
        @media (max-width: 900px) {
            .file_viewer.pdx-mode-content { height: auto !important; min-height: 100vh !important; overflow-y: auto !important; }
            .file_viewer.pdx-mode-content .file_preview_row {
                flex-direction: column !important; height: auto !important; min-height: 0 !important; overflow: visible !important;
            }
            .pdx-stage-main {
                flex: 0 0 auto !important; width: 100% !important; height: auto !important; min-height: 0 !important;
            }
            .file_viewer.pdx-mode-content .file_preview {
                flex: 0 0 auto !important; width: 100% !important; height: 55vh !important; min-height: 270px !important;
            }
            .pdx-sidebar {
                width: 100% !important; flex: 1 1 auto !important; height: auto !important; max-height: none !important;
                border-left: none !important; border-top: 1px solid var(--pdx-line) !important;
            }
            .pdx-playlist-list { max-height: 65vh !important; overflow-y: auto !important; }
            .pdx-playlist-thumb-wrap { flex: 0 0 132px !important; width: 132px !important; height: 74px !important; }
            .pdx-playlist-name { font-size: 13.5px !important; }
            .pdx-playlist-meta, .pdx-playlist-date-lbl, .pdx-playlist-date-val { font-size: 12px !important; }
            .pdx-plc-row { flex-direction: column !important; align-items: stretch !important; gap: 3px !important; }
            .pdx-plc-left, .pdx-plc-right { width: 100% !important; height: 34px !important; }
            .pdx-plc-left .pdx-plc-time { margin-left: auto !important; }
            .pdx-plc-right { justify-content: flex-end !important; padding-top: 3px !important; border-top: 1px solid rgba(255,255,255,.08) !important; }
            .pdx-plc-autoplay { margin-right: auto !important; width: auto !important; }
            .pdx-vrow {
                flex-direction: column !important;
                height: auto !important;
                min-height: auto !important;
                padding: 8px 12px !important;
                gap: 6px !important;
                align-items: stretch !important;
            }
            .pdx-vrow-top { width: 100% !important; justify-content: flex-start !important; }
            .pdx-vrow-actions { width: 100% !important; justify-content: space-between !important; overflow-x: auto !important; }
            .pdx-name { max-width: calc(100vw - 120px) !important; }
        }
        @media (max-width: 600px) {
            .pdx-plc-act { width: 32px; height: 32px; }
            .pdx-plc-act svg { width: 20px; height: 20px; }
            .pdx-plc-play { width: 54px; height: 54px; }
            .pdx-plc-play svg { width: 24px; height: 24px; }
            .pdx-plc-time { font-size: 11px; padding: 0 3px; }
            .pdx-plc-act { width: 30px; height: 30px; }
        }
    `);

    /* Observer & Boot */
    const OURS = ".pdx-gtop,.pdx-vrow,.pdx-galbar,.pdx-sidebar,.pdx-host,.pdx-toast,.pdx-modal,.gallery";
    function relevant(muts) {
        for (const m of muts) { const t = m.target; if (t && t.nodeType === 1 && t.closest && t.closest(OURS)) continue; return true; }
        return false;
    }
    function boot() {
        window.addEventListener("hashchange", () => { writePosition(currentIndex() + 1); sync(); });
        const bootPos = readPosition();
        if (bootPos > 0) {
            const want = bootPos - 1;
            if (currentIndex() !== want) location.hash = "#item=" + want;
            else writePosition(bootPos);
        }
        new MutationObserver(muts => { if (relevant(muts)) sync(); }).observe(document.body, { childList: true, subtree: true });
        loadProxies();
        sync();
    }
    if (document.body) boot();
    else document.addEventListener("DOMContentLoaded", boot, { once: true });
})();
