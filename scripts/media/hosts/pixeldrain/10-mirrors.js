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
