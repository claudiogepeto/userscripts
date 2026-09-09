// ==UserScript==
// @name         NHentai 2.0
// @namespace    nhentai-dark-gallery
// @version      1.1.11
// @updateURL    https://raw.githubusercontent.com/claudiogepeto/userscripts/main/dist/nhentai.user.js
// @downloadURL  https://raw.githubusercontent.com/claudiogepeto/userscripts/main/dist/nhentai.user.js
// @author       claudiogepeto
// @description  Modern dark AMOLED theme, unified topbar command search, responsive gallery grid, multi-mode reader, non-English filter, and infinite scroll for NHentai
// @match        https://nhentai.net/*
// @match        https://*.nhentai.net/*
// @match        https://nhentai.xxx/*
// @match        https://*.nhentai.xxx/*
// @match        https://nhentai.to/*
// @match        https://*.nhentai.to/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      nhentai.net
// @connect      *.nhentai.net
// @connect      nhentai.xxx
// @connect      *.nhentai.xxx
// @connect      nhentai.to
// @connect      *.nhentai.to
// @connect      *
// ==/UserScript==
(function () {
    "use strict";

    const CURRENT_HOST = String(location.hostname || "").toLowerCase();
    const isNhentaiNetHost = () => CURRENT_HOST === "nhentai.net" || CURRENT_HOST.endsWith(".nhentai.net");
    const isNhentaiXxxHost = () => CURRENT_HOST === "nhentai.xxx" || CURRENT_HOST.endsWith(".nhentai.xxx");
    const isNhentaiToHost = () => CURRENT_HOST === "nhentai.to" || CURRENT_HOST.endsWith(".nhentai.to");
    const isSupportedMirrorHost = () => isNhentaiNetHost() || isNhentaiXxxHost() || isNhentaiToHost();

    if (document.documentElement) {
        document.documentElement.classList.toggle("nh-mirror-xxx", isNhentaiXxxHost());
        document.documentElement.classList.toggle("nh-mirror-to", isNhentaiToHost());
    }

    // ===================================================================== //
    //  Configuration & Constants                                            //
    // ===================================================================== //
    const ACCENT = "#ed2553";
    const ACCENT_HOVER = "#ff3b68";
    const ACCENT_DARK = "#c01e43";
    const ACCENT_GRAD = "linear-gradient(135deg, #c01e43, #ed2553)";

    // Storage Keys
    const KEY_LANG_FILTER = "nh_lang_filter";         // 'all' | 'dim' | 'hide'
    const KEY_MEDIA_MODE = "nh_media_mode";           // 'continuous' | 'fullscreen'
    const KEY_READER_WIDTH = "nh_reader_width";       // percentage preset or 'viewport-height'
    const KEY_READER_ORIENTATION = "nh_reader_orientation"; // 'vertical' | 'horizontal'
    const KEY_MANHWA_MODE = "nh_manhwa_mode";         // 'true' | 'false'
    const KEY_FULLSCREEN_LAYOUT = "nh_fullscreen_layout"; // 'single' | 'double'
    const KEY_FULLSCREEN_REVERSED = "nh_fullscreen_reversed"; // 'true' | 'false'
    const KEY_FULLSCREEN_ZOOM = "nh_fullscreen_zoom"; // '1' | '1.25' | '1.5' | '2'
    const KEY_RECENT_SEARCHES = "nh_recent_searches"; // array of { q, url, time }
    const KEY_LEARNED_TAGS = "nh_learned_tags";       // array of tags

    // Tag namespaces & colors (consistent with modern manga/booru standards)
    const TAG_COLORS = {
        artist: "#ff708d",
        character: "#4cc9f0",
        parody: "#c77dff",
        group: "#f77f00",
        language: "#48cae4",
        category: "#06d6a0",
        tag: "#9d4edd",
        female: "#f0709a",
        male: "#6aa8ff",
    };

    const TAG_SEED = [
        "language:english", "language:japanese", "language:chinese",
        "category:doujinshi", "category:manga", "category:artistcg", "category:gamecg", "category:western", "category:non-h",
        "tag:sole female", "tag:sole male", "tag:big breasts", "tag:nakadashi", "tag:blowjob",
        "tag:stockings", "tag:schoolgirl uniform", "tag:bondage", "tag:ahegao", "tag:netorare",
        "tag:milf", "tag:dilf", "tag:paizuri", "tag:maid", "tag:yuri", "tag:yaoi",
        "tag:full color", "tag:uncensored", "tag:mosaic censorship", "tag:swimsuit", "tag:glasses",
        "tag:cheating", "tag:rape", "tag:anal", "tag:females only", "tag:males only",
        "tag:mind break", "tag:dark skin", "tag:tanlines", "tag:tentacles", "tag:defloration",
        "tag:impregnation", "tag:x-ray", "tag:urination", "tag:sweat", "tag:twins",
        "tag:crossdressing", "tag:tomoy", "tag:garter belt", "tag:collar", "tag:footjob"
    ];

    // ===================================================================== //
    //  DOM & Utility Helpers                                                //
    // ===================================================================== //
    const addStyle = (css) => {
        if (typeof GM_addStyle === "function") return GM_addStyle(css);
        const s = document.createElement("style");
        s.textContent = css;
        (document.head || document.documentElement).appendChild(s);
    };

    // Safe element builder (does not crash on read-only dataset / style properties)
    const el = (tag, props = {}, html) => {
        const { dataset, style, ...rest } = props;
        const node = Object.assign(document.createElement(tag), rest);
        if (dataset && typeof dataset === "object") Object.assign(node.dataset, dataset);
        if (style && typeof style === "object") Object.assign(node.style, style);
        if (html != null) node.innerHTML = html;
        return node;
    };

    const debounce = (fn, ms) => {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), ms);
        };
    };

    const slugify = (text) =>
        (text || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

    const escapeHtml = (text) =>
        (text || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    // SVG Icons
    const svg = (inner) =>
        `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

    const ICON = {
        search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
        close: svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
        book: svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>'),
        grid: svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
        arrowUp: svg('<path d="m18 15-6-6-6 6"/>'),
        arrowDown: svg('<path d="m6 9 6 6 6-6"/>'),
        chevronRight: svg('<path d="m9 18 6-6-6-6"/>'),
        chevronLeft: svg('<path d="m15 18-6-6 6-6"/>'),
        plus: svg('<path d="M12 5v14M5 12h14"/>'),
        minus: svg('<path d="M5 12h14"/>'),
        sparkles: svg('<path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15l-1.8-4.2L5.5 9l4.7-1.3L12 3Z"/>'),
        filter: svg('<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>'),
        refresh: svg('<path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>'),
        globe: svg('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
        external: svg('<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>'),
        eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'),
        settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
        home: svg('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
        heart: svg('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'),
        popular: svg('<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>'),
        menu: svg('<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>'),
        random: svg('<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4h3l4 4"/>'),
        tags: svg('<path d="M20.59 13.41 11 3.83V3H4v7h.83l9.58 9.59a2 2 0 0 0 2.83 0l3.35-3.35a2 2 0 0 0 0-2.83Z"/><circle cx="7.5" cy="6.5" r=".75" fill="currentColor" stroke="none"/>'),
        fullscreen: svg('<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5"/>'),
        manhwa: svg('<rect x="4" y="3" width="16" height="4" rx="1"/><rect x="4" y="10" width="16" height="4" rx="1"/><rect x="4" y="17" width="16" height="4" rx="1"/>'),
        vertical: svg('<path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4"/>'),
        horizontal: svg('<path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4"/>'),
    };

    // ===================================================================== //
    //  Tag Store & Dynamic Learning                                         //
    // ===================================================================== //
    const tagStore = (() => {
        let set = new Set(TAG_SEED);
        try {
            const loaded = JSON.parse(localStorage.getItem(KEY_LEARNED_TAGS) || "[]");
            if (Array.isArray(loaded)) {
                loaded.forEach((t) => t && set.add(t));
            }
        } catch (e) {}

        let dirty = false;
        const persist = debounce(() => {
            if (!dirty) return;
            try {
                localStorage.setItem(KEY_LEARNED_TAGS, JSON.stringify([...set].slice(-3000)));
                dirty = false;
            } catch (e) {}
        }, 2000);

        return {
            add: (tag) => {
                tag = (tag || "").trim().toLowerCase();
                if (tag && !set.has(tag)) {
                    set.add(tag);
                    dirty = true;
                    persist();
                }
            },
            all: () => [...set],
        };
    })();

    const harvestedTags = new Set();

    function getTagColor(rawTag) {
        const clean = rawTag.replace(/^[-+]/, "").toLowerCase();
        const colon = clean.indexOf(":");
        if (colon > 0) {
            const ns = clean.slice(0, colon);
            if (TAG_COLORS[ns]) return TAG_COLORS[ns];
        }
        return TAG_COLORS.tag;
    }

    // ===================================================================== //
    //  API Helper & Gallery Metadata Cache                                  //
    // ===================================================================== //
    const galleryMetaCache = new Map();

    function getGalleryCacheKey(id) {
        return `nh_g_${CURRENT_HOST}_${id}`;
    }

    function getCachedGalleryMeta(id) {
        if (!id) return null;
        if (galleryMetaCache.has(id)) return galleryMetaCache.get(id);
        try {
            const keys = [getGalleryCacheKey(id)];
            // Keep existing .net cache entries usable after the mirror-aware
            // cache key was introduced.
            if (isNhentaiNetHost()) keys.push(`nh_g_${id}`);
            for (const key of keys) {
                const raw = sessionStorage.getItem(key);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    galleryMetaCache.set(id, parsed);
                    return parsed;
                }
            }
        } catch (e) {}
        return null;
    }

    function setCachedGalleryMeta(id, data) {
        if (!id || !data) return;
        galleryMetaCache.set(id, data);
        try {
            sessionStorage.setItem(getGalleryCacheKey(id), JSON.stringify(data));
        } catch (e) {}
    }

    function apiGet(url) {
        return new Promise((resolve, reject) => {
            if (typeof GM_xmlhttpRequest === "function") {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: url.startsWith("http") ? url : location.origin + url,
                    onload: (res) => {
                        if (res.status >= 400) {
                            const err = new Error("HTTP " + res.status);
                            err.status = res.status;
                            reject(err);
                            return;
                        }
                        try {
                            resolve(JSON.parse(res.responseText));
                        } catch (e) {
                            reject(e);
                        }
                    },
                    onerror: reject,
                });
            } else {
                fetch(url, { credentials: "same-origin" })
                    .then((r) => {
                        if (!r.ok) {
                            const err = new Error("HTTP " + r.status);
                            err.status = r.status;
                            throw err;
                        }
                        return r.json();
                    })
                    .then(resolve)
                    .catch(reject);
            }
        });
    }

    const apiQueue = [];
    let isQueueProcessing = false;

    function getPageCountFromDocument(root) {
        if (!root) return 0;

        const directValue = root.querySelector("#load_pages");
        if (directValue) {
            const value = parseInt(directValue.value || directValue.textContent || "", 10);
            if (Number.isFinite(value) && value > 0) return value;
        }

        const pageElements = root.querySelectorAll(
            ".gallery_top .pages, #tags .pages, #tags .tag-container, .gallery_top li"
        );
        for (const element of pageElements) {
            const text = (element.textContent || "").replace(/\s+/g, " ").trim();
            if (!/^pages?\s*:?\s*\d+/i.test(text) && !/^pages?\s*:?/i.test(text)) continue;
            const match = text.match(/pages?\s*:?\s*(\d+)/i);
            if (match) return parseInt(match[1], 10);
            const nested = element.querySelector(".pages, .name");
            const nestedValue = parseInt(nested?.textContent || "", 10);
            if (Number.isFinite(nestedValue) && nestedValue > 0) return nestedValue;
        }

        const pagesElement = root.querySelector(".gallery_top .pages, #tags .pages");
        const pagesValue = parseInt(pagesElement?.textContent || "", 10);
        return Number.isFinite(pagesValue) && pagesValue > 0 ? pagesValue : 0;
    }

    async function fetchMirrorGalleryMeta(galleryId) {
        const url = new URL(`/g/${encodeURIComponent(galleryId)}/`, location.origin);
        const response = await fetch(url.href, { credentials: "same-origin" });
        if (!response.ok) {
            const err = new Error(`Gallery metadata HTTP ${response.status}`);
            err.status = response.status;
            throw err;
        }
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        return {
            id: galleryId,
            num_pages: getPageCountFromDocument(doc),
            tags: [],
        };
    }

    function queueGalleryFetch(galleryId, onComplete) {
        if (!galleryId) return;
        const cached = getCachedGalleryMeta(galleryId);
        if (cached) {
            onComplete(cached);
            return;
        }
        apiQueue.push({ galleryId, onComplete });
        processApiQueue();
    }

    async function processApiQueue() {
        if (isQueueProcessing || apiQueue.length === 0) return;
        isQueueProcessing = true;

        while (apiQueue.length > 0) {
            const item = apiQueue.shift();
            const { galleryId, onComplete } = item;

            const cached = getCachedGalleryMeta(galleryId);
            if (cached) {
                onComplete(cached);
                continue;
            }

            try {
                let data = null;
                if (isNhentaiNetHost()) {
                    try {
                        data = await apiGet(`/api/v2/galleries/${galleryId}`);
                    } catch (e1) {
                        if (e1?.status === 429 || String(e1?.message).includes("429")) {
                            throw e1;
                        }
                        try {
                            data = await apiGet(`/api/gallery/${galleryId}`);
                        } catch (e2) {
                            if (e2?.status === 429 || String(e2?.message).includes("429")) {
                                throw e2;
                            }
                        }
                    }
                } else if (isNhentaiXxxHost() || isNhentaiToHost()) {
                    data = await fetchMirrorGalleryMeta(galleryId);
                }

                if (data) {
                    setCachedGalleryMeta(galleryId, data);
                    onComplete(data);
                }
            } catch (err) {
                if (err?.status === 429 || String(err?.message).includes("429")) {
                    console.warn("[NHentai] Rate limit (HTTP 429) hit. Pausing API queue for 30s and clearing queue.");
                    apiQueue.length = 0;
                    await new Promise((r) => setTimeout(r, 30000));
                    break;
                }
            }

            await new Promise((r) => setTimeout(r, 160));
        }

        isQueueProcessing = false;
    }

    // ===================================================================== //
    //  Language Detection & Filter                                          //
    // ===================================================================== //
    function getGalleryLangMeta(card) {
        const cls = String(card.className || "");
        const dataTags = String(card.getAttribute("data-tags") || "").split(/\s+/);
        const caption = (card.querySelector(".caption")?.textContent || "").toLowerCase();

        if (isNhentaiXxxHost()) {
            const mirrorLanguage = String(card.getAttribute("data-languages") || "");
            if (mirrorLanguage === "1") return { isEnglish: true, lang: "en" };
            if (mirrorLanguage === "2") return { isEnglish: false, lang: "jp" };
            if (mirrorLanguage === "3") return { isEnglish: false, lang: "cn" };
        }

        // Language classes and IDs
        if (/\blang-(gb|us|en)\b/i.test(cls) || dataTags.includes("12227")) {
            return { isEnglish: true, lang: "en" };
        }
        if (/\blang-(jp|ja)\b/i.test(cls) || dataTags.includes("6346")) {
            return { isEnglish: false, lang: "jp" };
        }
        if (/\blang-(cn|zh)\b/i.test(cls) || dataTags.includes("29963")) {
            return { isEnglish: false, lang: "cn" };
        }

        // Caption heuristics
        if (/\[(?:english|translated)\]|\((?:english|translated)\)/i.test(caption)) {
            return { isEnglish: true, lang: "en" };
        }
        if (/\[(?:japanese|chinese|korean|español|spanish|russian)\]/i.test(caption)) {
            return { isEnglish: false, lang: "other" };
        }

        return { isEnglish: false, lang: "unknown" };
    }

    function getGalleryCards(root = document) {
        if (isNhentaiXxxHost()) {
            return Array.from(root.querySelectorAll(".gallery_item:not(.nh-skeleton-card)"));
        }
        const cards = Array.from(root.querySelectorAll(".gallery:not(.nh-skeleton-card)"));
        if (cards.length) return cards;
        return Array.from(root.querySelectorAll(".index-container .gallery:not(.nh-skeleton-card), .gallery-grid .gallery:not(.nh-skeleton-card), .gallery_item:not(.nh-skeleton-card)"));
    }

    function getGalleryCardCover(card) {
        return card?.querySelector("a.cover, .cover, a[href*='/g/']") || null;
    }

    function getGalleryCardLink(card) {
        return getGalleryCardCover(card)?.closest("a[href]") || getGalleryCardCover(card);
    }

    function syncCardLanguageFlag(card, meta) {
        const cover = getGalleryCardCover(card);
        if (!cover) return;

        if (meta.lang === "unknown") {
            cover.querySelector(".nh-card-lang-flag")?.remove();
            return;
        }

        let flag = cover.querySelector(".nh-card-lang-flag");
        if (!flag) {
            flag = el("span", { className: "nh-card-lang-flag" });
            flag.setAttribute("aria-hidden", "true");
            cover.appendChild(flag);
        }

        const flagData = {
            en: ["🇬🇧", "English"],
            jp: ["🇯🇵", "Japanese"],
            cn: ["🇨🇳", "Chinese"],
            other: ["🌐", "Other language"],
            unknown: ["🌐", "Language unknown"],
        }[meta.lang] || ["🌐", "Language unknown"];
        flag.textContent = flagData[0];
        flag.title = flagData[1];
        flag.className = `nh-card-lang-flag nh-card-lang-${meta.lang || "unknown"}`;
    }

    let currentLangFilter = (() => {
        try {
            return localStorage.getItem(KEY_LANG_FILTER) || "all";
        } catch (e) {
            return "all";
        }
    })();

    function applyLangFilterToCard(card, mode = currentLangFilter) {
        const meta = getGalleryLangMeta(card);
        syncCardCoverBackdrop(card);
        syncCardLanguageFlag(card, meta);
        card.classList.toggle("nh-is-en", meta.isEnglish);
        card.classList.toggle("nh-is-non-en", !meta.isEnglish);

        if (mode === "dim") {
            card.classList.toggle("nh-dimmed", !meta.isEnglish);
            card.classList.remove("nh-hidden");
        } else if (mode === "hide") {
            card.classList.remove("nh-dimmed");
            card.classList.toggle("nh-hidden", !meta.isEnglish);
        } else {
            // all
            card.classList.remove("nh-dimmed", "nh-hidden");
        }

        card.dataset.nhLangProcessed = "true";
    }

    function applyLangFilterToAll(mode = currentLangFilter) {
        currentLangFilter = mode;
        try {
            localStorage.setItem(KEY_LANG_FILTER, mode);
        } catch (e) {}

        getGalleryCards().forEach((card) => applyLangFilterToCard(card, mode));

        // Sync all active toggle buttons
        document.querySelectorAll(".nh-lang-toggle").forEach((group) => {
            group.querySelectorAll("button").forEach((btn) => {
                btn.classList.toggle("active", btn.dataset.mode === mode);
            });
        });
    }

    // ===================================================================== //
    //  Unified Modern Topbar & Integrated Command Search                     //
    // ===================================================================== //
    const HOME_NAV_HREF = isNhentaiToHost() ? "/home/" : "/";
    const POPULAR_NAV_HREF = isNhentaiToHost()
        ? "/popular/"
        : (isNhentaiXxxHost() ? "/search/?sort=popular" : "/search/?q=language%3Aenglish&sort=popular");
    const LANGUAGE_FILTER_MODES = [
        { id: "all", label: "All" },
        { id: "dim", label: "Dim Non-EN" },
        { id: "hide", label: "EN Only" },
    ];
    const MORE_NAV_LINKS = [
        { href: "/artists/", label: "Artists" },
        { href: "/characters/", label: "Characters" },
        { href: "/parodies/", label: "Parodies" },
        { href: "/groups/", label: "Groups" },
        { href: "/community/taxonomy/", label: "Taxonomy" },
        { href: "/community/gts-backlog/", label: "GTS Backlog" },
        { href: "/info/", label: "Info" },
    ];

    function getMoreNavLinks() {
        if (isNhentaiXxxHost()) {
            return [
                { href: "/artists/", label: "Artists" },
                { href: "/characters/", label: "Characters" },
                { href: "/parodies/", label: "Parodies" },
                { href: "/groups/", label: "Groups" },
            ];
        }
        return MORE_NAV_LINKS;
    }

    const getDirectNavLink = (item) =>
        Array.from(item?.children || []).find((child) => child.matches("a[href]")) || null;

    const getNavPath = (link) => {
        const href = typeof link === "string" ? link : (link?.getAttribute("href") || "");
        try {
            return new URL(href, location.origin).pathname.replace(/\/+$/, "").toLowerCase() || "/";
        } catch (e) {
            return href.replace(/\/+$/, "").toLowerCase();
        }
    };

    const isPrimaryNavItem = (item) => {
        // A dropdown contains Random and Tags as nested links. Only a direct
        // link can be a primary item; otherwise the whole dropdown is moved
        // into the drawer and disappears from the topbar.
        if (!item || item.classList.contains("dropdown") || item.classList.contains("nh-nav-dropdown")) return false;
        const link = getDirectNavLink(item);
        if (!link) return false;
        const href = getNavPath(link);
        const label = (link.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
        return href === "/random" || href === "/tags" || /^(random|tags?)\b/.test(label);
    };

    function createLanguageFilterGroup(className = "") {
        const group = el("div", {
            className: `nh-lang-toggle nh-segmented ${className}`.trim(),
            title: "Language Filter",
        });

        LANGUAGE_FILTER_MODES.forEach((mode) => {
            const button = el(
                "button",
                {
                    type: "button",
                    className: `nh-seg-btn ${mode.id === currentLangFilter ? "active" : ""}`,
                    title: mode.label,
                },
                mode.label
            );
            button.dataset.mode = mode.id;
            button.addEventListener("click", (event) => {
                event.stopPropagation();
                applyLangFilterToAll(mode.id);
            });
            group.appendChild(button);
        });

        return group;
    }

    function getNavDropdown(menuLeft) {
        return Array.from(menuLeft?.children || []).find((item) => {
            const directButton = Array.from(item.children || []).find((child) => child.matches("button"));
            const directMenu = Array.from(item.children || []).find((child) => child.matches("ul.dropdown-menu"));
            return item.classList.contains("dropdown") || (directButton && directMenu);
        }) || null;
    }

    function ensureTopbarDropdown(menuLeft) {
        if (!menuLeft) return null;

        let dropdown = getNavDropdown(menuLeft);
        if (!dropdown) {
            dropdown = el("li", { className: "dropdown nh-nav-dropdown" });
            dropdown.innerHTML = `
                <button type="button" class="btn btn-secondary btn-square" aria-label="More links" aria-expanded="false">
                    ${ICON.arrowDown}<span class="nh-sr-only">More links</span>
                </button>
                <ul class="dropdown-menu"></ul>
            `;
            menuLeft.appendChild(dropdown);
        }

        dropdown.classList.add("nh-nav-dropdown");
        dropdown.classList.remove("nh-nav-primary");

        let trigger = Array.from(dropdown.children).find((child) => child.matches("button"));
        if (!trigger) {
            trigger = el("button", {
                type: "button",
                className: "btn btn-secondary btn-square",
                "aria-label": "More links",
                "aria-expanded": "false",
            }, `${ICON.arrowDown}<span class="nh-sr-only">More links</span>`);
            dropdown.prepend(trigger);
        }
        trigger.setAttribute("aria-label", "More links");
        trigger.setAttribute("aria-expanded", dropdown.classList.contains("open") ? "true" : "false");

        let menu = Array.from(dropdown.children).find((child) => child.matches("ul.dropdown-menu"));
        if (!menu) {
            menu = el("ul", { className: "dropdown-menu" });
            dropdown.appendChild(menu);
        }

        getMoreNavLinks().forEach(({ href, label }) => {
            const exists = Array.from(menu.children).some((item) => getNavPath(getDirectNavLink(item)) === getNavPath(href));
            if (!exists) {
                const item = el("li");
                item.appendChild(el("a", { href }, label));
                menu.appendChild(item);
            }
        });

        Array.from(menu.children).forEach((item) => {
            const link = getDirectNavLink(item);
            const path = getNavPath(link);
            item.classList.toggle("nh-dropdown-duplicate", path === "/random" || path === "/tags");
        });

        if (!trigger.dataset.nhDropdownBound) {
            trigger.dataset.nhDropdownBound = "true";
            trigger.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                const open = !dropdown.classList.contains("open");
                dropdown.classList.toggle("open", open);
                trigger.setAttribute("aria-expanded", String(open));
            });
        }
        if (!menu.dataset.nhDropdownBound) {
            menu.dataset.nhDropdownBound = "true";
            menu.addEventListener("click", () => {
                dropdown.classList.remove("open");
                trigger.setAttribute("aria-expanded", "false");
            });
        }

        const tagsItem = Array.from(menuLeft.children).find((item) => getNavPath(getDirectNavLink(item)) === "/tags");
        if (tagsItem && dropdown !== tagsItem.nextElementSibling) {
            tagsItem.insertAdjacentElement("afterend", dropdown);
        }

        return dropdown;
    }

    function setNavMenuOpen(open) {
        const drawer = document.querySelector("#nh-nav-drawer");
        if (!drawer) return;

        drawer.hidden = !open;
        document.body.classList.toggle("nh-menu-open", open);
        document.querySelectorAll(".nh-menu-toggle").forEach((button) => {
            button.setAttribute("aria-expanded", String(open));
        });
    }

    function ensureNavDrawer() {
        let drawer = document.querySelector("#nh-nav-drawer");
        if (drawer) return drawer;

        drawer = el("div", {
            id: "nh-nav-drawer",
            hidden: true,
            role: "dialog",
            "aria-modal": "true",
            "aria-label": "Navigation menu",
        });
        drawer.setAttribute("role", "dialog");
        drawer.setAttribute("aria-modal", "true");
        drawer.setAttribute("aria-label", "Navigation menu");
        drawer.innerHTML = `
            <div class="nh-nav-drawer-panel">
                <div class="nh-nav-drawer-head">
                    <span class="nh-nav-drawer-title">Menu</span>
                    <button type="button" class="nh-nav-drawer-close" aria-label="Close menu">${ICON.close}</button>
                </div>
                <ul class="nh-nav-drawer-list"></ul>
            </div>
        `;

        drawer.addEventListener("click", (event) => {
            if (event.target === drawer) setNavMenuOpen(false);
        });
        drawer.querySelector(".nh-nav-drawer-close").addEventListener("click", () => setNavMenuOpen(false));
        document.body.appendChild(drawer);

        if (!window.__nhNavMenuEscapeBound) {
            window.__nhNavMenuEscapeBound = true;
            window.addEventListener("keydown", (event) => {
                if (event.key === "Escape") setNavMenuOpen(false);
            });
        }

        return drawer;
    }

    function appendStaticDrawerItem(list, key, href, label, icon) {
        if (list.querySelector(`[data-nh-static="${key}"]`)) return;
        const item = el("li", { dataset: { nhStatic: key } });
        item.innerHTML = `<a href="${href}">${icon}<span>${label}</span></a>`;
        list.appendChild(item);
    }

    function syncSecondaryDrawerItems(list, dropdown) {
        const existing = list.querySelector("[data-nh-secondary-items]");
        const menu = dropdown && Array.from(dropdown.children).find((child) => child.matches("ul.dropdown-menu"));
        const links = menu
            ? Array.from(menu.children)
                .map((item) => getDirectNavLink(item))
                .filter((link) => link && !["/random", "/tags"].includes(getNavPath(link)) && !link.matches("[href*='tsyndicate'], [href*='twitter']"))
            : [];

        if (!links.length) {
            if (existing) existing.remove();
            return;
        }

        const group = existing || el("li", { dataset: { nhSecondaryItems: "true" }, className: "nh-nav-drawer-secondary" });
        group.innerHTML = "";
        links.forEach((link) => {
            const item = el("li", { className: "nh-nav-drawer-item" });
            item.appendChild(link.cloneNode(true));
            group.appendChild(item);
        });
        if (!existing) list.appendChild(group);
    }

    function syncNavDrawer(menuLeft, menuRight, dropdown) {
        const drawer = ensureNavDrawer();
        const list = drawer.querySelector(".nh-nav-drawer-list");

        // Keep Home and Popular in the drawer as well as in the compact bottom
        // bar, so the same navigation remains available on every viewport.
        appendStaticDrawerItem(list, "home", HOME_NAV_HREF, "Home", ICON.home);
        appendStaticDrawerItem(list, "popular", POPULAR_NAV_HREF, "Popular", ICON.popular);
        syncSecondaryDrawerItems(list, dropdown);

        if (menuLeft) {
            Array.from(menuLeft.children).forEach((item) => {
                if (item.classList.contains("dropdown") || item.classList.contains("nh-nav-dropdown")) return;
                if (isPrimaryNavItem(item)) {
                    item.classList.add("nh-nav-primary");
                    return;
                }
                item.classList.add("nh-nav-drawer-item");
                if (item.parentNode !== list) list.appendChild(item);
            });
        }

        // Authentication remains visible on the wide layout and is also
        // available from the mobile menu.
        if (menuRight && !list.querySelector("[data-nh-auth-items]")) {
            const authItems = el("li", { dataset: { nhAuthItems: "true" }, className: "nh-nav-drawer-auth" });
            Array.from(menuRight.children).forEach((item) => authItems.appendChild(item.cloneNode(true)));
            if (authItems.children.length) list.appendChild(authItems);
        }
    }

    function bindNavMenuToggle(button) {
        if (!button || button.dataset.nhMenuBound) return;
        button.dataset.nhMenuBound = "true";
        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const drawer = ensureNavDrawer();
            setNavMenuOpen(drawer.hidden);
        });
    }

    function bindMobileChromeScroll() {
        if (window.__nhMobileChromeScrollBound) return;
        window.__nhMobileChromeScrollBound = true;

        let lastScrollY = Math.max(window.scrollY || 0, 0);
        window.addEventListener("scroll", () => {
            const currentScrollY = Math.max(window.scrollY || 0, 0);
            const delta = currentScrollY - lastScrollY;
            lastScrollY = currentScrollY;

            if (Math.abs(delta) < 8 || document.body.classList.contains("nh-menu-open")) return;
            document.body.classList.toggle(
                "nh-mobile-chrome-hidden",
                delta > 0 && currentScrollY > 56
            );
        }, { passive: true });
    }

    function ensureMirrorNav() {
        if (isNhentaiXxxHost()) {
            document.querySelectorAll(".hd_dt, .hd_mb").forEach((header) => {
                header.style.setProperty("display", "none", "important");
            });
        }

        let nav = document.querySelector("#nh-mirror-nav");
        if (nav || !document.body) return nav;

        nav = el("nav", { id: "nh-mirror-nav", role: "navigation" });
        const logoSource = isNhentaiToHost() ? "/img/logo.svg" : "/images/logo.svg";
        nav.innerHTML = `
            <a class="logo" href="/" aria-label="NHentai">
                <img src="${logoSource}" alt="NHentai" width="46" height="30">
            </a>
            <div class="collapse">
                <ul class="menu left">
                    <li><a href="/random/">Random</a></li>
                    <li><a href="/tags/">Tags</a></li>
                    <li><a href="/artists/">Artists</a></li>
                    <li><a href="/characters/">Characters</a></li>
                    <li><a href="/parodies/">Parodies</a></li>
                    <li><a href="/groups/">Groups</a></li>
                </ul>
                <ul class="menu right">
                    <li class="menu-sign-in"><a href="/login/"><i class="fa fa-sign-in-alt"></i> Sign in</a></li>
                    <li class="menu-register"><a href="/register/"><i class="fa fa-edit"></i> Register</a></li>
                </ul>
            </div>
        `;
        document.body.insertBefore(nav, document.body.firstChild);
        return nav;
    }

    function setupModernTopbar() {
        const nav = (isNhentaiXxxHost() || (isNhentaiToHost() && !document.querySelector("nav")))
            ? ensureMirrorNav()
            : document.querySelector("nav");
        if (!nav) return;

        // Remove any old separated toolbar if it was injected
        const oldToolbar = document.querySelector("#nh-listing-toolbar");
        if (oldToolbar) oldToolbar.remove();

        // Use a direct child as the layout root. The native page can render the
        // logo beside .collapse; normalizing both into one root prevents it from
        // visually escaping the navbar.
        let collapse = Array.from(nav.children).find((child) => child.matches(".collapse, #nh-topbar-inner"));
        if (!collapse) {
            collapse = el("div", { id: "nh-topbar-inner" });
            while (nav.firstChild) collapse.appendChild(nav.firstChild);
            nav.appendChild(collapse);
        } else {
            Array.from(nav.children).forEach((child) => {
                if (child !== collapse) collapse.appendChild(child);
            });
        }

        // Logo may be anywhere inside nav — grab it and ensure it's in leftCluster
        const logo = nav.querySelector(".logo");
        if (logo) logo.setAttribute("href", HOME_NAV_HREF);
        const menuLeft = nav.querySelector(".menu.left");
        const menuRight = nav.querySelector(".menu.right");
        const dropdown = ensureTopbarDropdown(menuLeft);

        syncNavDrawer(menuLeft, menuRight, dropdown);

        // Group Logo + Menu Left cleanly on the left side inside collapse container
        let leftCluster = collapse.querySelector(".nh-topbar-left");
        if (!leftCluster) {
            leftCluster = el("div", { className: "nh-topbar-left" });
            if (logo) leftCluster.appendChild(logo);
            if (menuLeft) leftCluster.appendChild(menuLeft);
            collapse.prepend(leftCluster);
        } else {
            if (logo && logo.parentNode !== leftCluster) leftCluster.prepend(logo);
            if (menuLeft && menuLeft.parentNode !== leftCluster) leftCluster.appendChild(menuLeft);
        }

        let menuToggle = leftCluster.querySelector(".nh-menu-toggle");
        if (!menuToggle) {
            menuToggle = el(
                "button",
                {
                    type: "button",
                    className: "nh-menu-toggle",
                    "aria-label": "Open menu",
                    "aria-controls": "nh-nav-drawer",
                    "aria-expanded": "false",
                },
                `${ICON.menu}<span class="nh-sr-only">Open menu</span>`
            );
            menuToggle.setAttribute("aria-label", "Open menu");
            menuToggle.setAttribute("aria-controls", "nh-nav-drawer");
            menuToggle.setAttribute("aria-expanded", "false");
            leftCluster.prepend(menuToggle);
        }
        bindNavMenuToggle(menuToggle);

        // Check if topbar center already exists
        let center = collapse.querySelector("#nh-topbar-center");
        if (!center) {
            center = el("div", { id: "nh-topbar-center", className: "nh-topbar-center" });

            // 1. Central command search bar
            const searchBtn = el(
                "button",
                {
                    type: "button",
                    className: "nh-topbar-search",
                    title: "Search doujins, tags, artists... (⌘K)",
                },
                `
                    <span class="nh-tbs-ico">${ICON.search}</span>
                    <span class="nh-tbs-txt">Search doujins, tags, artists...</span>
                    <kbd class="nh-kbd">⌘K</kbd>
                `
            );
            searchBtn.addEventListener("click", () => {
                if (window.__nhOpenSearch) window.__nhOpenSearch();
            });

            // 2. Integrated language filter selector
            const filterGroup = createLanguageFilterGroup("nh-topbar-lang");

            center.append(searchBtn, filterGroup);

            // Insert into collapse between left cluster and right menu
            if (menuRight && menuRight.parentNode === collapse) {
                collapse.insertBefore(center, menuRight);
            } else {
                collapse.appendChild(center);
            }
        }
    }

    function injectMobileTopbar() {
        if (!document.body) return;

        ensureNavDrawer();

        let topbar = document.querySelector("#nh-mobile-topbar");
        if (!topbar) {
            topbar = el("header", { id: "nh-mobile-topbar" });
            topbar.innerHTML = `
                <button type="button" class="nh-menu-toggle" aria-label="Open menu" aria-controls="nh-nav-drawer" aria-expanded="false">
                    ${ICON.menu}<span class="nh-sr-only">Open menu</span>
                </button>
                <a class="nh-mobile-logo" href="/" aria-label="NHentai"></a>
                <div class="nh-mobile-lang-slot"></div>
            `;
            topbar.querySelector(".nh-menu-toggle").setAttribute("aria-label", "Open menu");
            topbar.querySelector(".nh-menu-toggle").setAttribute("aria-controls", "nh-nav-drawer");
            topbar.querySelector(".nh-menu-toggle").setAttribute("aria-expanded", "false");
            document.body.insertBefore(topbar, document.body.firstChild);
        }

        bindNavMenuToggle(topbar.querySelector(".nh-menu-toggle"));

        const logoSource = document.querySelector("nav .logo");
        const logoSlot = topbar.querySelector(".nh-mobile-logo");
        if (logoSource && logoSlot && !topbar.dataset.nhLogoCopied) {
            const logoClone = logoSource.cloneNode(true);
            logoClone.classList.add("nh-mobile-logo");
            logoClone.removeAttribute("id");
            logoClone.setAttribute("href", HOME_NAV_HREF);
            logoClone.setAttribute("aria-label", "NHentai");
            logoSlot.replaceWith(logoClone);
            topbar.dataset.nhLogoCopied = "true";
        } else if (!logoSource && logoSlot && !logoSlot.textContent) {
            logoSlot.textContent = "nhentai";
        }

        const langSlot = topbar.querySelector(".nh-mobile-lang-slot");
        if (langSlot && !langSlot.querySelector(".nh-mobile-lang")) {
            langSlot.appendChild(createLanguageFilterGroup("nh-mobile-lang"));
        }
        bindMobileChromeScroll();
    }

    // ===================================================================== //
    //  Card Title Parser & Tag Enrichment                                   //
    // ===================================================================== //
    function parseTitleMeta(rawTitle) {
        let title = (rawTitle || "").trim();
        let artist = null;
        let circle = null;
        let parody = null;

        // Leading [Circle (Artist)] or [Artist] or (Circle)
        const leadMatch = title.match(/^\[([^\]]+)\]/) || title.match(/^\(([^\)]+)\)/);
        if (leadMatch) {
            const inside = leadMatch[1].trim();
            const subMatch = inside.match(/^([^(]+)\s*\(([^)]+)\)/);
            if (subMatch) {
                circle = subMatch[1].trim();
                artist = subMatch[2].trim();
            } else {
                artist = inside;
            }
            title = title.substring(leadMatch[0].length).trim();
        }

        // Clean trailing tags like [English], [Digital], etc.
        title = title.replace(/\s*\[(?:english|japanese|chinese|korean|translated|rewrite|digital|colorized|uncensored|complete|team[^\]]+)\]\s*/gi, " ").trim();

        // Parody in parentheses e.g. (Original) or (Ensemble Stars!)
        const parodyMatch = title.match(/\(([^\)]+)\)(?!.*\(.*\))/);
        if (parodyMatch) {
            const pCandidate = parodyMatch[1].trim();
            if (!/^c\d+|^comic/i.test(pCandidate)) {
                parody = pCandidate;
            }
        }

        return { artist, circle, parody, cleanTitle: title || rawTitle };
    }

    function createNativeTagChip({ type = "", typeLabel = "", name = "", href = "", count = "", title = "", className = "" }) {
        const tag = el(href ? "a" : "span", {
            className: `tagchip variant-pill state-normal nh-card-tag ${className}`.trim(),
            title,
        });

        if (href) tag.href = href;
        if (type) {
            tag.appendChild(el("span", { className: `type type-${type}` }, typeLabel || type));
        }
        if (name) tag.appendChild(el("span", { className: "name" }, name));
        if (count) tag.appendChild(el("span", { className: "count" }, count));
        return tag;
    }

    function getGalleryIdFromCard(card) {
        const coverLink = getGalleryCardLink(card);
        const href = coverLink ? coverLink.getAttribute("href") : "";
        const idMatch = href ? href.match(/\/g\/(\d+)\/?/) : null;
        return idMatch ? idMatch[1] : null;
    }

    function getCardGalleryKey(card) {
        if (!card || card.classList.contains("nh-skeleton-card")) return "";
        const id = getGalleryIdFromCard(card);
        if (id) return id;
        const href = card.querySelector("a[href*='/g/']")?.getAttribute("href") || "";
        const m = href.match(/\/g\/(\d+)(?:\/|$)/);
        return m ? m[1] : href;
    }

    function syncCardPageCount(card, data) {
        const cover = getGalleryCardCover(card);
        if (!cover) return;

        const pageCount = Number(data?.num_pages);
        if (!Number.isFinite(pageCount) || pageCount <= 0) {
            cover.querySelector(".nh-card-pages")?.remove();
            return;
        }

        let badge = cover.querySelector(".nh-card-pages");
        if (!badge) {
            badge = el("span", { className: "nh-card-pages" });
            badge.setAttribute("aria-hidden", "true");
            cover.appendChild(badge);
        }
        badge.textContent = `${pageCount}p`;
        badge.title = `${pageCount} pages`;
    }

    function observeCardPageCount(card) {
        if (!card || card.dataset.nhPageCountObserved === "true") return;
        if (!getGalleryCardCover(card)) return;

        const galleryId = getGalleryIdFromCard(card);
        if (!galleryId) return;

        card.dataset.nhPageCountObserved = "true";

        const cached = getCachedGalleryMeta(galleryId);
        if (cached) {
            syncCardPageCount(card, cached);
            return;
        }

        let hoverTimer = null;
        card.addEventListener("mouseenter", () => {
            if (card.querySelector(".nh-card-pages")) return;
            const currentCached = getCachedGalleryMeta(galleryId);
            if (currentCached) {
                syncCardPageCount(card, currentCached);
                return;
            }
            hoverTimer = setTimeout(() => {
                queueGalleryFetch(galleryId, (data) => {
                    syncCardPageCount(card, data);
                });
            }, 350);
        });

        card.addEventListener("mouseleave", () => {
            if (hoverTimer) {
                clearTimeout(hoverTimer);
                hoverTimer = null;
            }
        });
    }

    const cardTagsObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const card = entry.target;
                    cardTagsObserver.unobserve(card);

                    const galleryId = getGalleryIdFromCard(card);

                    if (!galleryId) return;

                    queueGalleryFetch(galleryId, (data) => {
                        renderFullTagsForCard(card, data);
                    });
                }
            });
        },
        { rootMargin: "500px 0px 500px 0px" }
    );

    function enrichCardWithTags(card) {
        if (card.querySelector(".nh-card-tags")) return;

        const galleryId = getGalleryIdFromCard(card);

        const captionEl = card.querySelector(".caption");
        const rawTitle = captionEl ? captionEl.textContent : "";
        const parsed = parseTitleMeta(rawTitle);

        // Create tags container
        const tagsBox = el("div", { className: "nh-card-tags" });

        // 1. Instant Language badge
        const langMeta = getGalleryLangMeta(card);
        const langBadge = createNativeTagChip({
            type: "language",
            typeLabel: langMeta.isEnglish ? "EN" : (langMeta.lang === "jp" ? "JA" : (langMeta.lang === "cn" ? "ZH" : "RAW")),
            title: langMeta.isEnglish ? "English" : (langMeta.lang === "jp" ? "Japanese" : "Raw / Other"),
            className: `nh-tag-lang ${langMeta.isEnglish ? "nh-is-en" : ""}`,
        });
        tagsBox.appendChild(langBadge);

        // 2. Instant Artist chip (if parsed from title)
        if (parsed.artist) {
            const artistChip = createNativeTagChip({
                type: "artist",
                name: parsed.artist,
                href: `/artist/${slugify(parsed.artist)}/`,
                title: `Artist: ${parsed.artist}`,
                className: "nh-tag-artist",
            });
            artistChip.addEventListener("click", (e) => e.stopPropagation());
            tagsBox.appendChild(artistChip);
        }

        // 3. Instant Parody chip (if parsed from title)
        if (parsed.parody) {
            const parodyChip = createNativeTagChip({
                type: "parody",
                name: parsed.parody,
                href: `/parody/${slugify(parsed.parody)}/`,
                title: `Parody: ${parsed.parody}`,
                className: "nh-tag-parody",
            });
            parodyChip.addEventListener("click", (e) => e.stopPropagation());
            tagsBox.appendChild(parodyChip);
        }

        // Check if already cached in memory / sessionStorage
        const cached = getCachedGalleryMeta(galleryId);
        if (cached) {
            card.appendChild(tagsBox);
            renderFullTagsForCard(card, cached);
        } else {
            card.appendChild(tagsBox);
            if (galleryId) {
                cardTagsObserver.observe(card);
            }
        }
    }

    function renderFullTagsForCard(card, data) {
        const tagsBox = card.querySelector(".nh-card-tags");
        if (!tagsBox || !data || !data.tags) return;

        const artists = data.tags.filter((t) => t.type === "artist");
        const parodies = data.tags.filter((t) => t.type === "parody" && t.name !== "original");
        const characters = data.tags.filter((t) => t.type === "character");
        const generalTags = data.tags.filter(
            (t) => t.type === "tag" && !["translated", "full color", "rewrite"].includes(t.name)
        );

        // Learn all tags dynamically
        data.tags.forEach((t) => {
            tagStore.add(`${t.type}:${t.name}`);
            if (t.type === "tag" && t.name) {
                harvestedTags.add(t.name.toLowerCase());
            }
        });

        // Rebuild dynamic tag chips cleanly
        const langBadge = tagsBox.querySelector(".nh-tag-lang");
        tagsBox.innerHTML = "";
        if (langBadge) tagsBox.appendChild(langBadge);

        // Add artists
        artists.slice(0, 1).forEach((a) => {
            const chip = createNativeTagChip({
                type: "artist",
                name: a.name,
                href: `/artist/${slugify(a.name)}/`,
                title: `Artist: ${a.name}`,
                className: "nh-tag-artist",
            });
            chip.addEventListener("click", (e) => e.stopPropagation());
            tagsBox.appendChild(chip);
        });

        // Add parodies
        parodies.slice(0, 1).forEach((p) => {
            const chip = createNativeTagChip({
                type: "parody",
                name: p.name,
                href: `/parody/${slugify(p.name)}/`,
                title: `Parody: ${p.name}`,
                className: "nh-tag-parody",
            });
            chip.addEventListener("click", (e) => e.stopPropagation());
            tagsBox.appendChild(chip);
        });

        // Add characters
        characters.slice(0, 1).forEach((c) => {
            const chip = createNativeTagChip({
                type: "character",
                name: c.name,
                href: `/character/${slugify(c.name)}/`,
                title: `Character: ${c.name}`,
                className: "nh-tag-character",
            });
            chip.addEventListener("click", (e) => e.stopPropagation());
            tagsBox.appendChild(chip);
        });

        // Add top 3-4 content tags
        generalTags.slice(0, 3).forEach((t) => {
            const chip = createNativeTagChip({
                type: "tag",
                name: t.name,
                href: `/tag/${slugify(t.name)}/`,
                title: `Tag: ${t.name}`,
                className: "nh-tag-general",
            });
            chip.addEventListener("click", (e) => e.stopPropagation());
            tagsBox.appendChild(chip);
        });

    }

    function enhanceSortBar() {
        const sort = document.querySelector(".sort");
        if (!sort || sort.dataset.nhEnhanced) return;
        if (document.querySelector("#tag-container")) return;

        const links = Array.from(sort.querySelectorAll("a"));
        if (!links.length) return;

        const recentLink = sort.querySelector('a[href*="sort=date"]') || links[0];
        const todayLink = sort.querySelector('a[href*="sort=popular-today"]');
        const weekLink = sort.querySelector('a[href*="sort=popular-week"]');
        const allTimeLink = links.find((a) => a.href.includes("sort=popular") && !a.href.includes("popular-today") && !a.href.includes("popular-week"));

        if (!todayLink && !weekLink && !allTimeLink && !sort.querySelector('a[href*="sort="]')) return;

        const currentUrl = new URL(location.href);
        const currentSort = currentUrl.searchParams.get("sort") || "";

        const buildHref = (link, sortVal) => {
            if (link && link.getAttribute("href")) return link.getAttribute("href");
            const u = new URL(location.href);
            if (sortVal) u.searchParams.set("sort", sortVal);
            else u.searchParams.delete("sort");
            u.searchParams.delete("page");
            return u.pathname + u.search;
        };

        const recentHref = buildHref(recentLink, "date");
        const todayHref = buildHref(todayLink, "popular-today");
        const weekHref = buildHref(weekLink, "popular-week");
        const allTimeHref = buildHref(allTimeLink, "popular");

        const isTodayActive = currentSort === "popular-today" || !!todayLink?.classList.contains("current");
        const isWeekActive = currentSort === "popular-week" || !!weekLink?.classList.contains("current");
        const isAllTimeActive = currentSort === "popular" || !!allTimeLink?.classList.contains("current");
        const isPopularActive = isTodayActive || isWeekActive || isAllTimeActive;
        const isRecentActive = currentSort === "date" || (!isPopularActive && (!!recentLink?.classList.contains("current") || !currentSort));

        let currentDateMode = "Week";
        if (isTodayActive) currentDateMode = "Today";
        else if (isAllTimeActive) currentDateMode = "All Time";
        else if (isWeekActive) currentDateMode = "Week";

        let popularHref = weekHref;
        if (isTodayActive) popularHref = todayHref;
        else if (isAllTimeActive) popularHref = allTimeHref;
        else popularHref = weekHref;

        const currentSortMode = isPopularActive ? "Popular" : "Recent";

        sort.dataset.nhEnhanced = "true";
        sort.innerHTML = `
            <div class="nh-sort-inner">
                <div class="nh-sort-group">
                    <div class="nh-sort-dropdown nh-sort-dropdown-mode">
                        <button type="button" class="nh-sort-item nh-sort-drop-toggle current">
                            <span>Sort: ${currentSortMode}</span>
                            ${ICON.arrowDown}
                        </button>
                        <div class="nh-sort-menu">
                            <a href="${recentHref}" class="nh-sort-menu-item ${isRecentActive ? 'current' : ''}">Recent</a>
                            <a href="${popularHref}" class="nh-sort-menu-item ${isPopularActive ? 'current' : ''}">Popular</a>
                        </div>
                    </div>
                    <div class="nh-sort-dropdown nh-sort-dropdown-date ${isRecentActive ? 'nh-sort-inactive-date' : ''}">
                        <button type="button" class="nh-sort-item nh-sort-drop-toggle ${isPopularActive ? 'current' : ''}">
                            <span>Date: ${currentDateMode}</span>
                            ${ICON.arrowDown}
                        </button>
                        <div class="nh-sort-menu">
                            <a href="${todayHref}" class="nh-sort-menu-item ${isTodayActive ? 'current' : ''}">Today</a>
                            <a href="${weekHref}" class="nh-sort-menu-item ${isWeekActive ? 'current' : ''}">Week</a>
                            <a href="${allTimeHref}" class="nh-sort-menu-item ${isAllTimeActive ? 'current' : ''}">All Time</a>
                        </div>
                    </div>
                </div>
                <button type="button" class="nh-sort-filter-btn" title="Filtros de pesquisa">
                    ${ICON.filter}
                    <span>Filtros</span>
                </button>
            </div>
        `;

        const dropdowns = sort.querySelectorAll(".nh-sort-dropdown");
        dropdowns.forEach((dropdown) => {
            const toggleBtn = dropdown.querySelector(".nh-sort-drop-toggle");
            if (toggleBtn) {
                toggleBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const wasOpen = dropdown.classList.contains("open");
                    dropdowns.forEach((d) => d.classList.remove("open"));
                    if (!wasOpen) {
                        dropdown.classList.add("open");
                    }
                });
            }
        });
        sort.querySelectorAll(".nh-sort-menu").forEach((menu) => {
            menu.addEventListener("click", (e) => e.stopPropagation());
        });

        if (!window.__nhSortDocClickBound) {
            window.__nhSortDocClickBound = true;
            document.addEventListener("click", (e) => {
                document.querySelectorAll(".nh-sort-dropdown.open").forEach((d) => {
                    if (!d.contains(e.target)) {
                        d.classList.remove("open");
                    }
                });
            });
        }

        const filterBtn = sort.querySelector(".nh-sort-filter-btn");
        if (filterBtn) {
            filterBtn.addEventListener("click", () => {
                const u = new URL(location.href);
                const q = u.searchParams.get(isNhentaiXxxHost() ? "key" : "q") || "";
                const s = u.searchParams.get("sort") || "";
                if (window.__nhOpenSearch) {
                    window.__nhOpenSearch(q, s);
                }
            });
        }
    }

    function syncAllGalleryCards() {
        enhanceSortBar();
        getGalleryCards().forEach((card) => {
            applyLangFilterToCard(card);
            observeCardPageCount(card);
        });
    }

    function isGalleryListingRoute(pathname = location.pathname) {
        if (isNhentaiToHost()) {
            return pathname === "/" || /^\/(home|go|search|popular|tag|artist|character|parody|group|language|category|favorites)(?:\/|$)/.test(pathname);
        }
        return pathname === "/" || /^\/(search|tag|artist|character|parody|group|language|category|favorites)(?:\/|$)/.test(pathname);
    }

    function isGalleryPostRoute(pathname = location.pathname) {
        return /^\/g\/\d+\/?$/.test(pathname);
    }

    function createSkeletonCard(isXxx = false) {
        const card = el("div", {
            className: isXxx ? "gallery_item nh-skeleton-card" : "gallery nh-skeleton-card",
            "aria-hidden": "true"
        });
        card.innerHTML = `
            <div class="cover nh-skeleton-cover">
                <div class="nh-skeleton-media"></div>
            </div>
            <div class="caption nh-skeleton-caption">
                <div class="nh-skeleton-line nh-skeleton-line-title"></div>
                <div class="nh-skeleton-line nh-skeleton-line-sub"></div>
            </div>
        `;
        return card;
    }

    function showSkeletonCards(count = 8) {
        const container = findGalleryContainer();
        if (!container) return;
        hideSkeletonCards();
        const isXxx = isNhentaiXxxHost();
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < count; i++) {
            fragment.appendChild(createSkeletonCard(isXxx));
        }
        container.appendChild(fragment);
    }

    function hideSkeletonCards() {
        const container = findGalleryContainer();
        if (!container) return;
        container.querySelectorAll(".nh-skeleton-card").forEach((card) => card.remove());
    }

    function findGalleryContainer(root = document) {
        const selector = ".gallery-grid, .index-container";
        const classicContainers = Array.from(root.querySelectorAll(selector)).filter((container) => {
            return getGalleryCards(container).length > 0;
        });

        if (classicContainers.length) {
            const pagination = root.querySelector(".pagination, section.pagination");
            const nonPopular = classicContainers.filter((container) => !container.classList.contains("index-popular"));

            // On .to/home, Popular and New Uploads are separate containers,
            // while the pagination is associated with New Uploads. Prefer the
            // container that directly owns it or is immediately before it in
            // the document so popular cards are never used as the append root.
            if (pagination) {
                const directOwner = nonPopular.find((container) => container.contains(pagination));
                if (directOwner) return directOwner;

                const beforePagination = nonPopular.filter((container) => {
                    // DOCUMENT_POSITION_FOLLOWING (4): container precedes the
                    // pagination node in document order.
                    return Boolean(container.compareDocumentPosition(pagination) & 4);
                });
                if (beforePagination.length) return beforePagination[beforePagination.length - 1];
            }

            return nonPopular[0] || classicContainers[0];
        }

        return Array.from(root.querySelectorAll(".galleries_box"))
            .find((container) => container.querySelector(".gallery_item")) || null;
    }

    // ===================================================================== //
    //  Infinite Scroll                                                      //
    // ===================================================================== //
    let infiniteScrollActive = false;
    let infiniteScrollObserver = null;
    let infiniteScrollSentinel = null;
    let nextPageUrl = null;
    let isFetchingPage = false;
    let currentPageNum = 1;
    let listingGeneration = 0;
    let lastPageFetchTime = 0;
    const MIN_PAGE_COOLDOWN_MS = 1200; // minimum 1.2s between page requests
    const MIN_SKELETON_DWELL_MS = 450;
    let rateLimitBackoffUntil = 0;

    function detectNextPageUrl(root = document, baseHref = location.href) {
        const baseUrl = new URL(baseHref, location.origin);
        currentPageNum = parseInt(baseUrl.searchParams.get("page") || "1", 10);

        const paginationLinks = Array.from(root.querySelectorAll(".pagination a, section.pagination a"));
        const nextLink = paginationLinks.find((link) => {
            const label = (link.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
            const parentDisabled = link.closest(".disabled, [aria-disabled='true']");
            const ariaLabel = (link.getAttribute("aria-label") || "").toLowerCase();
            return !parentDisabled && (
                link.matches("[rel='next'], .next") ||
                ariaLabel.includes("next") ||
                /^(next|›|»|→)$/.test(label)
            );
        });
        if (nextLink && nextLink.href) {
            const nextUrl = new URL(nextLink.getAttribute("href") || nextLink.href, baseHref);
            return nextUrl.href;
        }

        // Listings without pagination (for example the home page) do not have
        // a reliable next URL. Wait for the real pagination to be rendered
        // instead of inventing a `page=2` request.
        const pagination = root.querySelector(".pagination, section.pagination");
        if (!pagination) return null;

        const currentUrl = baseUrl;
        const pageParam = currentPageNum;

        const lastLink = root.querySelector(".pagination a.last, section.pagination a.last, .pagination a[aria-label*='Last' i], section.pagination a[aria-label*='Last' i]");
        let maxPage = pageParam;
        if (lastLink && lastLink.href) {
            const m = (lastLink.getAttribute("href") || lastLink.href).match(/[?&]page=(\d+)/);
            if (m) maxPage = parseInt(m[1], 10);
        }

        if (pageParam < maxPage) {
            currentUrl.searchParams.set("page", String(pageParam + 1));
            return currentUrl.href;
        }
        return null;
    }

    function initInfiniteScroll() {
        const container = findGalleryContainer();
        if (!container) return;

        nextPageUrl = detectNextPageUrl();
        if (!nextPageUrl) return;

        infiniteScrollActive = true;

        // Hide native pagination
        document.querySelectorAll(".pagination, section.pagination").forEach((p) => {
            p.style.setProperty("display", "none", "important");
        });

        // Setup Sentinel
        if (!infiniteScrollSentinel) {
            infiniteScrollSentinel = el("div", { id: "nh-scroll-sentinel", "aria-hidden": "true" });
        }
        if (!infiniteScrollSentinel.isConnected || infiniteScrollSentinel.previousElementSibling !== container) {
            container.after(infiniteScrollSentinel);
        }

        // Setup Status
        let status = document.querySelector("#nh-scroll-status");
        if (!status) {
            status = el("div", {
                id: "nh-scroll-status",
                className: "nh-scroll-status",
            });
            status.innerHTML = `
                <div class="nh-spinner"></div>
                <span class="nh-scroll-txt"></span>
                <button class="nh-btn nh-btn-retry" style="display:none;">Retry</button>
            `;
            infiniteScrollSentinel.after(status);

            status.addEventListener("click", () => {
                rateLimitBackoffUntil = 0;
                if (nextPageUrl && !isFetchingPage) loadNextPage();
            });
        } else if (!status.isConnected) {
            infiniteScrollSentinel.after(status);
        }

        // Status is hidden by default when idle
        status.style.display = "none";

        // Setup IntersectionObserver on the sentinel
        if (infiniteScrollObserver) infiniteScrollObserver.disconnect();

        infiniteScrollObserver = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry && entry.isIntersecting && nextPageUrl && !isFetchingPage) {
                    if (Date.now() < rateLimitBackoffUntil) return;
                    if (Date.now() - lastPageFetchTime < MIN_PAGE_COOLDOWN_MS) {
                        setTimeout(() => {
                            if (nextPageUrl && !isFetchingPage && Date.now() >= rateLimitBackoffUntil) loadNextPage();
                        }, MIN_PAGE_COOLDOWN_MS);
                        return;
                    }
                    loadNextPage();
                }
            },
            { rootMargin: "80px 0px" }
        );

        infiniteScrollObserver.observe(infiniteScrollSentinel);

        // Add continuous check & viewport scroll fallback
        if (!window.__nhScrollFallbackBound) {
            window.__nhScrollFallbackBound = true;
            let scrollCheckFrame = 0;
            const checkAndLoad = () => {
                if (scrollCheckFrame) return;
                scrollCheckFrame = requestAnimationFrame(() => {
                    scrollCheckFrame = 0;
                    if (!nextPageUrl || isFetchingPage || !infiniteScrollActive) return;
                    if (Date.now() < rateLimitBackoffUntil) return;
                    if (Date.now() - lastPageFetchTime < MIN_PAGE_COOLDOWN_MS) return;
                    const sentinel = document.querySelector("#nh-scroll-sentinel");
                    if (!sentinel?.isConnected) return;
                    const rect = sentinel.getBoundingClientRect();
                    const vh = window.innerHeight || document.documentElement.clientHeight;
                    if (rect.top <= vh + 80) {
                        loadNextPage();
                    }
                });
            };
            window.addEventListener("scroll", checkAndLoad, { passive: true });
            window.addEventListener("resize", checkAndLoad, { passive: true });
        }
    }

    async function fetchPageHtml(url) {
        try {
            const res = await fetch(url, { credentials: "same-origin" });
            if (res.ok) return await res.text();
            throw new Error("HTTP " + res.status);
        } catch (fetchErr) {
            if (typeof GM_xmlhttpRequest === "function") {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: url.startsWith("http") ? url : location.origin + url,
                        onload: (r) => {
                            if (r.status >= 400) reject(new Error("HTTP " + r.status));
                            else resolve(r.responseText);
                        },
                        onerror: () => reject(fetchErr)
                    });
                });
            }
            throw fetchErr;
        }
    }

    async function loadNextPage() {
        if (!nextPageUrl || isFetchingPage) return;
        if (Date.now() < rateLimitBackoffUntil) return;
        if (Date.now() - lastPageFetchTime < MIN_PAGE_COOLDOWN_MS) return;
        isFetchingPage = true;
        showSkeletonCards(8);
        lastPageFetchTime = Date.now();
        const requestGeneration = listingGeneration;
        const requestedPageUrl = nextPageUrl;

        const status = document.querySelector("#nh-scroll-status");
        if (status) {
            status.style.display = "flex";
            status.className = "nh-scroll-status is-loading";
            status.querySelector(".nh-scroll-txt").textContent = "Loading more galleries...";
            status.querySelector(".nh-btn-retry").style.display = "none";
        }

        try {
            const [html] = await Promise.all([
                fetchPageHtml(requestedPageUrl),
                new Promise((resolve) => setTimeout(resolve, MIN_SKELETON_DWELL_MS))
            ]);

            // A fast navigation can finish while this request is in flight.
            // Never append cards belonging to the previous route.
            if (requestGeneration !== listingGeneration) return;

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            const mainContainer = findGalleryContainer();
            if (!mainContainer) throw new Error("Gallery container disappeared");

            const existingKeys = new Set(
                getGalleryCards(mainContainer).map(getCardGalleryKey).filter(Boolean)
            );

            // Extract new galleries
            const targetContainer = findGalleryContainer(doc);
            if (!targetContainer) throw new Error("Next page has no gallery container");
            const rawCards = getGalleryCards(targetContainer);

            // Filter out any duplicate cards
            const newCards = [];
            rawCards.forEach((card) => {
                const key = getCardGalleryKey(card);
                if (key && existingKeys.has(key)) return; // Skip duplicate!
                if (key) existingKeys.add(key);
                newCards.push(card);
            });

            if (newCards.length === 0) {
                hideSkeletonCards();
                nextPageUrl = null;
                if (status) {
                    status.className = "nh-scroll-status is-done";
                    status.style.display = "flex";
                    status.querySelector(".nh-scroll-txt").textContent = "All galleries loaded";
                }
                return;
            }

            // Append cards
            hideSkeletonCards();
            const fragment = document.createDocumentFragment();
            newCards.forEach((card) => {
                const img = card.querySelector("img");
                if (img) {
                    const dataSrc = img.getAttribute("data-src");
                    if (dataSrc) img.src = dataSrc;
                    img.loading = "lazy";
                    img.classList.remove("lazyload");
                    img.classList.add("loaded");
                }
                applyLangFilterToCard(card);
                observeCardPageCount(card);
                card.classList.add("nh-card-in");
                fragment.appendChild(card);
            });
            mainContainer.appendChild(fragment);

            // Update page number reference without mutating URL history
            const prevPageNum = currentPageNum;
            const loadedUrl = new URL(requestedPageUrl);
            const loadedPage = parseInt(loadedUrl.searchParams.get("page") || "1", 10);
            currentPageNum = loadedPage;

            // Harvest new tags
            harvestTags(newCards);

            const detectedNext = detectNextPageUrl(doc, requestedPageUrl);
            if (detectedNext) {
                const nextNum = parseInt(new URL(detectedNext).searchParams.get("page") || "0", 10);
                if (nextNum > currentPageNum) {
                    nextPageUrl = detectedNext;
                } else {
                    nextPageUrl = null;
                }
            } else {
                nextPageUrl = null;
            }

            if (nextPageUrl) {
                if (status) {
                    status.className = "nh-scroll-status";
                    status.style.display = "none";
                }
                const mainContainer = findGalleryContainer();
                const sentinel = document.querySelector("#nh-scroll-sentinel");
                if (mainContainer && sentinel) {
                    mainContainer.after(sentinel);
                    if (status) sentinel.after(status);
                }
            } else {
                nextPageUrl = null;
                if (status) {
                    status.className = "nh-scroll-status is-done";
                    status.style.display = "flex";
                    status.querySelector(".nh-scroll-txt").textContent = "All galleries loaded";
                }
            }
        } catch (err) {
            hideSkeletonCards();
            if (requestGeneration !== listingGeneration) return;
            console.error("Infinite scroll error:", err);
            const is429 = err?.status === 429 || String(err?.message || "").includes("429");
            if (is429) {
                rateLimitBackoffUntil = Date.now() + 15000; // 15s backoff
                if (status) {
                    status.className = "nh-scroll-status is-error";
                    status.style.display = "flex";
                    status.querySelector(".nh-scroll-txt").textContent = "Rate limit (429). Waiting 15s... Click to retry.";
                    status.querySelector(".nh-btn-retry").style.display = "inline-flex";
                }
            } else if (status) {
                status.className = "nh-scroll-status is-error";
                status.style.display = "flex";
                status.querySelector(".nh-scroll-txt").textContent = "Could not load more galleries. Click to retry.";
                status.querySelector(".nh-btn-retry").style.display = "inline-flex";
            }
        } finally {
            if (requestGeneration === listingGeneration) isFetchingPage = false;
        }
    }

    // ===================================================================== //
    //  Media Reader (Post Page: /g/{id}/)                                  //
    // ===================================================================== //
    let readerActive = false;
    let readerImgObserver = null;
    const FORMAT_FALLBACKS = ["webp", "jpg", "png", "gif"];
    const READER_WIDTH_PRESETS = ["60%", "75%", "90%", "100%", "viewport-height"];
    const LEGACY_READER_WIDTHS = {
        "900px": "60%",
        "1200px": "75%",
        "1600px": "90%",
        "100%": "100%",
    };
    const READER_ORIENTATIONS = ["vertical", "horizontal"];
    const FULLSCREEN_ZOOM_PRESETS = ["1", "1.25", "1.5", "2"];

    function normalizeReaderWidth(width) {
        const normalized = LEGACY_READER_WIDTHS[width] || width;
        return READER_WIDTH_PRESETS.includes(normalized) ? normalized : "100%";
    }

    function getPreferredReaderWidth() {
        try {
            return normalizeReaderWidth(localStorage.getItem(KEY_READER_WIDTH));
        } catch (e) {
            return "100%";
        }
    }

    function getPreferredReaderOrientation() {
        try {
            const saved = localStorage.getItem(KEY_READER_ORIENTATION);
            return READER_ORIENTATIONS.includes(saved) ? saved : "vertical";
        } catch (e) {
            return "vertical";
        }
    }

    function getPreferredManhwaMode() {
        try {
            const saved = localStorage.getItem(KEY_MANHWA_MODE);
            if (saved === "true" || saved === "false") return saved === "true";
            // Migrate the previous version, where Manhwa was a standalone
            // media mode, to the new modifier-based model.
            return localStorage.getItem(KEY_MEDIA_MODE) === "manhwa";
        } catch (e) {
            return false;
        }
    }

    function getPreferredFullscreenLayout() {
        try {
            const saved = localStorage.getItem(KEY_FULLSCREEN_LAYOUT);
            return saved === "double" ? "double" : "single";
        } catch (e) {
            return "single";
        }
    }

    function getPreferredFullscreenReversed() {
        try {
            return localStorage.getItem(KEY_FULLSCREEN_REVERSED) === "true";
        } catch (e) {
            return false;
        }
    }

    function getPreferredFullscreenZoom() {
        try {
            const saved = localStorage.getItem(KEY_FULLSCREEN_ZOOM);
            return FULLSCREEN_ZOOM_PRESETS.includes(saved) ? saved : "1";
        } catch (e) {
            return "1";
        }
    }

    function getPreferredMediaMode() {
        try {
            const saved = localStorage.getItem(KEY_MEDIA_MODE);
            if (saved === "manhwa") return "continuous";
            if (saved === "thumbnails") return "continuous";
            if (["continuous", "fullscreen"].includes(saved)) return saved;
        } catch (e) {}
        return "continuous";
    }

    function getImageSource(image) {
        return image
            ? (image.getAttribute("data-src") || image.getAttribute("src") || image.currentSrc || "")
            : "";
    }

    function setCoverBackdrop(cover, image) {
        if (!cover || !image) return;
        const source = getImageSource(image);
        if (!source || /^data:/i.test(source)) return;

        // Clean up any stale, empty, or duplicate cover frames in this cover
        const existingFrames = Array.from(cover.querySelectorAll(".nh-cover-media"));
        let frame = existingFrames.find((f) => f.contains(image)) || null;

        if (!frame && existingFrames.length > 0) {
            frame = existingFrames[0];
            frame.appendChild(image);
        } else if (!frame) {
            frame = el("span", { className: "nh-cover-media" });
            const parent = image.parentElement || cover;
            parent.insertBefore(frame, image);
            frame.appendChild(image);
        }

        // Remove any duplicate or orphaned frames that do not contain the active image
        existingFrames.forEach((f) => {
            if (f !== frame) f.remove();
        });

        const escaped = source.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        const background = `url("${escaped}")`;
        cover.classList.add("nh-cover-backdrop");
        cover.style.setProperty("--nh-cover-image", background);
        frame.classList.add("nh-cover-media--backdrop");
        frame.style.setProperty("--nh-cover-image", background);

        if (!image.complete && !image.dataset.nhBackdropBound) {
            image.dataset.nhBackdropBound = "true";
            image.addEventListener("load", () => setCoverBackdrop(cover, image), { once: true });
        }
    }

    function syncCardCoverBackdrop(card) {
        const cover = getGalleryCardCover(card);
        const image = cover?.querySelector("img");
        setCoverBackdrop(cover, image);
    }

    function syncHeroCoverBackdrop() {
        const cover = document.querySelector("#bigcontainer #cover, .gallery_top .cover");
        const image = cover?.querySelector("img");
        setCoverBackdrop(cover, image);
    }

    function getPageImageTemplate(source) {
        if (!source || /^data:/i.test(source)) return null;
        const cleanSource = source.split(/[?#]/, 1)[0];
        if (/\/\d+t?\.[a-z0-9]+$/i.test(cleanSource)) {
            return cleanSource.replace(/\/\d+t?(\.[a-z0-9]+)$/i, "/{page}$1");
        }
        if (/\/cover\.[a-z0-9]+$/i.test(cleanSource)) {
            return cleanSource.replace(/\/cover(\.[a-z0-9]+)$/i, "/{page}$1");
        }
        return null;
    }

    function getPageNumberFromImage(image, fallback) {
        const href = image?.closest("a[href]")?.getAttribute("href") || "";
        const match = href.match(/\/g\/\d+\/(\d+)\/?$/i);
        return match ? parseInt(match[1], 10) : fallback;
    }

    function extractGalleryMediaInfo() {
        let cdnHost = "i3.nhentai.net";
        let mid = null;
        let sourceTemplate = null;
        const pagesByNumber = new Map();
        const isXxx = isNhentaiXxxHost();
        const isTo = isNhentaiToHost();

        const coverSelector = isXxx
            ? ".gallery_top .cover img"
            : "#cover img, meta[itemprop='image'], meta[property='og:image']";
        const coverImg = document.querySelector(coverSelector);
        const coverSrc = getImageSource(coverImg) || coverImg?.content || "";
        if (coverSrc) {
            const galleryMatch = coverSrc.match(/\/galleries\/([^/]+)\//i);
            if (galleryMatch) mid = galleryMatch[1];
            const hostMatch = coverSrc.match(/https?:\/\/(t\d?)\.nhentai\.net/i);
            if (hostMatch) {
                cdnHost = "i" + (hostMatch[1].substring(1) || "") + ".nhentai.net";
            }
            if (isXxx || isTo) sourceTemplate = getPageImageTemplate(coverSrc) || sourceTemplate;
        }

        const thumbSelector = isXxx
            ? "#thumbs_append img"
            : (isTo ? "#thumbnail-container .gallerythumb img, #thumbnail-container .thumb-container img" : "#thumbnail-container .gallerythumb img, #thumbnail-container .thumb-container img");
        const thumbs = Array.from(document.querySelectorAll(thumbSelector));
        thumbs.forEach((img, index) => {
            const src = getImageSource(img);
            const pageNum = getPageNumberFromImage(img, index + 1);
            const extMatch = src.match(/\/\d+t?\.([a-z0-9]+)(?:[?#]|$)/i);
            const ext = extMatch ? extMatch[1].toLowerCase() : "webp";
            const template = getPageImageTemplate(src);
            if (template && (isXxx || isTo)) sourceTemplate = template;
            if (pageNum > 0) pagesByNumber.set(pageNum, { pageNum, ext });

            const hostMatch = src.match(/https?:\/\/(t\d?)\.nhentai\.net/i);
            if (hostMatch) {
                cdnHost = "i" + (hostMatch[1].substring(1) || "") + ".nhentai.net";
            }
            if (!mid) {
                const galleryMatch = src.match(/\/galleries\/([^/]+)\//i);
                if (galleryMatch) mid = galleryMatch[1];
            }
        });

        // .xxx exposes the CDN pieces as hidden fields even when thumbnails
        // have not been rendered yet.
        if (isXxx && !sourceTemplate) {
            const server = document.querySelector("#load_server")?.value;
            const directory = document.querySelector("#load_dir")?.value;
            const loadId = document.querySelector("#load_id")?.value;
            if (server && directory && loadId) {
                mid = loadId;
                sourceTemplate = `https://i${server}.nhentaimg.com/${directory}/${loadId}/{page}.webp`;
            }
        }

        const pageCount = getPageCountFromDocument(document);
        const totalPages = Math.max(pageCount, ...pagesByNumber.keys(), 0);
        const pages = [];
        const defaultExt = sourceTemplate?.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() || "webp";
        for (let pageNum = 1; pageNum <= totalPages; pageNum += 1) {
            pages.push(pagesByNumber.get(pageNum) || { pageNum, ext: defaultExt });
        }

        return {
            cdnHost: cdnHost || "i3.nhentai.net",
            mid,
            sourceTemplate,
            totalPages: pages.length,
            pages,
        };
    }

    function buildCandidateUrls(cdnHost, mid, pageNum, detectedExt, sourceTemplate) {
        const originalExt = (detectedExt || "webp").toLowerCase();
        const tryExts = [originalExt, ...FORMAT_FALLBACKS.filter((f) => f !== originalExt)];
        const urls = [];

        if (sourceTemplate) {
            tryExts.forEach((ext) => {
                const pageUrl = sourceTemplate
                    .replace("{page}", String(pageNum))
                    .replace(/\.[a-z0-9]+$/i, `.${ext}`);
                if (!urls.includes(pageUrl)) urls.push(pageUrl);
            });
            return urls;
        }

        const hosts = [cdnHost, "i.nhentai.net", "i3.nhentai.net", "i2.nhentai.net", "i1.nhentai.net"].filter(
            (v, i, a) => a.indexOf(v) === i
        );
        for (const h of hosts) {
            for (const e of tryExts) {
                urls.push(`https://${h}/galleries/${mid}/${pageNum}.${e}`);
            }
        }
        return urls;
    }

    function setupPostMediaView() {
        const isGallery = isGalleryPostRoute();
        if (!isGallery) return;

        const bigcontainer = document.querySelector("#bigcontainer, .gallery_top");
        const thumbContainer = document.querySelector(
            "#thumbnail-container, .outer_thumbs, #thumbs_append"
        );
        if (!bigcontainer && !thumbContainer) return;

        const mediaInfo = extractGalleryMediaInfo();
        syncHeroCoverBackdrop();

        let toolbar = document.querySelector("#nh-media-toolbar");
        if (!toolbar) {
            toolbar = el("div", { id: "nh-media-toolbar", className: "nh-media-toolbar" });
            if (bigcontainer && bigcontainer.parentNode) {
                bigcontainer.parentNode.insertBefore(toolbar, bigcontainer.nextSibling);
            } else if (thumbContainer && thumbContainer.parentNode) {
                thumbContainer.parentNode.insertBefore(toolbar, thumbContainer);
            }
        }

        const currentMode = getPreferredMediaMode();
        const currentWidth = getPreferredReaderWidth();
        const manhwaMode = getPreferredManhwaMode();

        toolbar.innerHTML = `
            <div class="nh-mt-left">
                <div class="nh-segmented nh-mt-mode" title="Media View Mode">
                    <button type="button" class="nh-seg-btn ${currentMode === "continuous" ? "active" : ""}" data-mode="continuous">
                        ${ICON.book} <span>Contínuo</span>
                    </button>
                    <button type="button" class="nh-seg-btn ${currentMode === "fullscreen" ? "active" : ""}" data-mode="fullscreen">
                        ${ICON.fullscreen} <span>Tela cheia</span>
                    </button>
                </div>
                <span class="nh-mt-stat">📄 <b>${mediaInfo.totalPages || 0}</b> Pages</span>
            </div>
            <div class="nh-mt-right ${currentMode === "continuous" ? "" : "is-hidden"}">
                <div class="nh-mt-control nh-mt-width-control">
                    <span class="nh-mt-lbl">Width:</span>
                    <div class="nh-segmented nh-mt-width" title="Reader Width">
                        <button type="button" class="nh-seg-btn ${currentWidth === "60%" ? "active" : ""}" data-w="60%">60%</button>
                        <button type="button" class="nh-seg-btn ${currentWidth === "75%" ? "active" : ""}" data-w="75%">75%</button>
                        <button type="button" class="nh-seg-btn ${currentWidth === "90%" ? "active" : ""}" data-w="90%">90%</button>
                        <button type="button" class="nh-seg-btn ${currentWidth === "100%" ? "active" : ""}" data-w="100%">100%</button>
                        <button type="button" class="nh-seg-btn ${currentWidth === "viewport-height" ? "active" : ""}" data-w="viewport-height">Altura</button>
                    </div>
                </div>
                <button type="button" class="nh-seg-btn nh-manhwa-toggle ${manhwaMode ? "active" : ""}" data-manhwa="true" aria-pressed="${manhwaMode}" title="Toggle Manhwa reading">
                    ${ICON.manhwa} <span>Manhwa</span>
                </button>
            </div>
        `;

        // Event listeners for toolbar mode buttons
        toolbar.querySelectorAll(".nh-mt-mode button").forEach((b) => {
            b.addEventListener("click", () => {
                setMediaMode(b.dataset.mode);
            });
        });

        // Event listeners for toolbar width buttons
        toolbar.querySelectorAll(".nh-mt-width button").forEach((b) => {
            b.addEventListener("click", () => {
                setReaderWidth(b.dataset.w);
            });
        });

        toolbar.querySelectorAll("[data-manhwa]").forEach((b) => {
            b.addEventListener("click", () => {
                setManhwaMode(!getPreferredManhwaMode());
            });
        });

        // Apply preferred mode
        setMediaMode(currentMode, false);
    }

    function setMediaMode(mode, save = true) {
        // The old thumbnail/grid view is no longer an exposed reader mode.
        // Treat stale callers or saved values as the continuous reader.
        if (!["continuous", "fullscreen"].includes(mode)) {
            mode = "continuous";
        }

        if (save) {
            try {
                localStorage.setItem(KEY_MEDIA_MODE, mode);
            } catch (e) {}
        }

        const thumbContainer = document.querySelector(
            "#thumbnail-container, .outer_thumbs, #thumbs_append"
        );
        const toolbar = document.querySelector("#nh-media-toolbar");
        let reader = document.querySelector("#nh-reader");

        if (toolbar) {
            toolbar.querySelectorAll(".nh-mt-mode button").forEach((b) => {
                b.classList.toggle("active", b.dataset.mode === mode);
            });
            const rightWrap = toolbar.querySelector(".nh-mt-right");
            if (rightWrap) {
                rightWrap.classList.toggle("is-hidden", mode !== "continuous");
            }
        }

        readerActive = true;
        if (thumbContainer) thumbContainer.style.display = "none";

        if (!reader) {
            reader = createReaderElement();
            if (thumbContainer && thumbContainer.parentNode) {
                thumbContainer.parentNode.insertBefore(reader, thumbContainer);
            } else if (toolbar && toolbar.parentNode) {
                toolbar.parentNode.insertBefore(reader, toolbar.nextSibling);
            }
        } else {
            reader.style.display = "flex";
            const pagesList = reader.querySelector(".nh-reader-pages");
            if (pagesList) setupReaderObservers(pagesList);
        }

        const isFullscreen = mode === "fullscreen";
        const manhwaMode = getPreferredManhwaMode();
        const currentOrientation = getPreferredReaderOrientation();
        const currentLayout = getPreferredFullscreenLayout();
        const reversed = getPreferredFullscreenReversed();
        reader.dataset.mediaMode = mode;
        reader.classList.toggle("nh-reader-fullscreen", isFullscreen);
        reader.classList.toggle("nh-reader-manhwa", manhwaMode);
        reader.classList.toggle("nh-reader-reversed", isFullscreen && reversed);
        reader.classList.toggle("nh-reader-orientation-vertical", isFullscreen && currentOrientation === "vertical");
        reader.classList.toggle("nh-reader-orientation-horizontal", isFullscreen && currentOrientation === "horizontal");
        reader.classList.toggle("nh-reader-spread", isFullscreen && !manhwaMode && currentLayout === "double");
        applyReaderWidth(reader, isFullscreen ? "100%" : getPreferredReaderWidth(), !isFullscreen);
        reader.style.setProperty("--nh-fullscreen-zoom", getPreferredFullscreenZoom());
        syncFullscreenSpread(reader, isFullscreen && !manhwaMode && currentLayout === "double");
        document.body.classList.toggle("nh-reader-fullscreen-active", isFullscreen);

        ensureFloatingPill();
        if (isFullscreen) {
            ensureFullscreenControls();
        } else {
            syncFullscreenControls();
        }
    }

    function setReaderWidth(w) {
        w = normalizeReaderWidth(w);
        try {
            localStorage.setItem(KEY_READER_WIDTH, w);
        } catch (e) {}

        const toolbar = document.querySelector("#nh-media-toolbar");
        if (toolbar) {
            toolbar.querySelectorAll(".nh-mt-width button").forEach((b) => {
                b.classList.toggle("active", b.dataset.w === w);
            });
        }

        const reader = document.querySelector("#nh-reader");
        if (reader && reader.dataset.mediaMode === "continuous") {
            applyReaderWidth(reader, w);
        }
    }

    function applyReaderWidth(reader, width, allowFitHeight = true) {
        const normalized = normalizeReaderWidth(width);
        reader.style.setProperty("--nh-reader-width", normalized);
        reader.classList.toggle("nh-reader-fit-height", allowFitHeight && normalized === "viewport-height");
    }

    function setFullscreenOrientation(orientation, save = true) {
        if (!READER_ORIENTATIONS.includes(orientation)) orientation = "vertical";

        if (save) {
            try {
                localStorage.setItem(KEY_READER_ORIENTATION, orientation);
            } catch (e) {}
        }

        const reader = document.querySelector("#nh-reader");
        if (reader) {
            const isFullscreen = reader.classList.contains("nh-reader-fullscreen");
            reader.classList.toggle("nh-reader-orientation-vertical", isFullscreen && orientation === "vertical");
            reader.classList.toggle("nh-reader-orientation-horizontal", isFullscreen && orientation === "horizontal");
            if (isFullscreen) {
                const pagesList = reader.querySelector(".nh-reader-pages");
                pagesList?.scrollTo({ top: 0, left: 0, behavior: "auto" });
            }
        }
        syncFullscreenControls();
    }

    function syncFullscreenSpread(reader, enabled) {
        const pagesList = reader?.querySelector(".nh-reader-pages");
        if (!pagesList) return;

        const slides = Array.from(pagesList.children).filter((child) => child.classList.contains("nh-reader-slide"));
        if (!enabled) {
            slides.forEach((slide) => {
                Array.from(slide.children).forEach((page) => pagesList.insertBefore(page, slide));
                slide.remove();
            });
            return;
        }

        if (slides.length) return;

        const pages = Array.from(pagesList.children).filter((child) => child.classList.contains("nh-reader-page"));
        for (let i = 0; i < pages.length; i += 2) {
            const slide = el("div", { className: "nh-reader-slide" });
            pagesList.appendChild(slide);
            slide.appendChild(pages[i]);
            if (pages[i + 1]) slide.appendChild(pages[i + 1]);
        }
    }

    function setFullscreenLayout(layout, save = true) {
        layout = layout === "double" ? "double" : "single";
        if (save) {
            try {
                localStorage.setItem(KEY_FULLSCREEN_LAYOUT, layout);
            } catch (e) {}
        }

        const reader = document.querySelector("#nh-reader");
        if (reader?.classList.contains("nh-reader-fullscreen")) {
            const enabled = layout === "double" && !getPreferredManhwaMode();
            reader.classList.toggle("nh-reader-spread", enabled);
            syncFullscreenSpread(reader, enabled);
        }
        syncFullscreenControls();
    }

    function setFullscreenReversed(reversed, save = true) {
        reversed = Boolean(reversed);
        if (save) {
            try {
                localStorage.setItem(KEY_FULLSCREEN_REVERSED, String(reversed));
            } catch (e) {}
        }

        const reader = document.querySelector("#nh-reader");
        if (reader?.classList.contains("nh-reader-fullscreen")) {
            reader.classList.toggle("nh-reader-reversed", reversed);
        }
        syncFullscreenControls();
    }

    function setFullscreenZoom(zoom, save = true) {
        zoom = String(zoom);
        if (!FULLSCREEN_ZOOM_PRESETS.includes(zoom)) zoom = "1";

        if (save) {
            try {
                localStorage.setItem(KEY_FULLSCREEN_ZOOM, zoom);
            } catch (e) {}
        }

        const reader = document.querySelector("#nh-reader");
        if (reader) reader.style.setProperty("--nh-fullscreen-zoom", zoom);
        document.querySelectorAll(".nh-reader-page[data-zoom-level]").forEach((page) => {
            page.removeAttribute("data-zoom-level");
            page.style.removeProperty("--nh-page-zoom");
            page.classList.remove("is-zoomed");
        });
        syncFullscreenControls();
    }

    function setManhwaMode(enabled, save = true) {
        enabled = Boolean(enabled);
        if (save) {
            try {
                localStorage.setItem(KEY_MANHWA_MODE, String(enabled));
            } catch (e) {}
        }

        document.querySelectorAll("[data-manhwa], [data-fs-manhwa]").forEach((button) => {
            button.classList.toggle("active", enabled);
            button.setAttribute("aria-pressed", String(enabled));
        });

        const reader = document.querySelector("#nh-reader");
        if (reader) {
            const isFullscreen = reader.classList.contains("nh-reader-fullscreen");
            reader.classList.toggle("nh-reader-manhwa", enabled);
            const spreadEnabled = isFullscreen && !enabled && getPreferredFullscreenLayout() === "double";
            reader.classList.toggle("nh-reader-spread", spreadEnabled);
            syncFullscreenSpread(reader, spreadEnabled);
        }
        syncFullscreenControls();
    }

    function scrollReaderToTop() {
        const reader = document.querySelector("#nh-reader");
        const pagesList = reader?.querySelector(".nh-reader-pages");
        if (reader?.classList.contains("nh-reader-fullscreen") && pagesList) {
            const reversed = reader.classList.contains("nh-reader-reversed");
            const horizontal = reader.classList.contains("nh-reader-orientation-horizontal");
            pagesList.scrollTo({
                top: horizontal ? 0 : (reversed ? pagesList.scrollHeight : 0),
                left: horizontal ? (reversed ? pagesList.scrollWidth : 0) : 0,
                behavior: "smooth",
            });
            return;
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function setPageZoom(page, level) {
        level = Number(level);
        if (![1, 1.5, 2].includes(level)) level = 1;

        if (level === 1) {
            const reader = page.closest("#nh-reader");
            const fullscreenZoom = reader?.style.getPropertyValue("--nh-fullscreen-zoom") || "1";
            if (reader?.classList.contains("nh-reader-fullscreen") && fullscreenZoom !== "1") {
                page.dataset.zoomLevel = "1";
                page.style.setProperty("--nh-page-zoom", "1");
            } else {
                page.removeAttribute("data-zoom-level");
                page.style.removeProperty("--nh-page-zoom");
            }
        } else {
            page.dataset.zoomLevel = String(level);
            page.style.setProperty("--nh-page-zoom", String(level));
        }
        page.classList.toggle("is-zoomed", level > 1);
    }

    function cyclePageZoom(page) {
        const reader = page.closest("#nh-reader");
        const defaultZoom = reader?.classList.contains("nh-reader-fullscreen")
            ? Number(reader.style.getPropertyValue("--nh-fullscreen-zoom") || "1")
            : 1;
        const current = Number(page.dataset.zoomLevel || defaultZoom);
        const next = current === 1 ? 1.5 : (current === 1.5 ? 2 : 1);
        setPageZoom(page, next);
    }

    function navigateReaderPage(delta) {
        const reader = document.querySelector("#nh-reader");
        if (!reader || reader.style.display === "none") return;

        if (!reader.classList.contains("nh-reader-fullscreen")) {
            window.scrollBy({
                top: delta * Math.max(240, window.innerHeight * 0.84),
                behavior: "smooth",
            });
            return;
        }

        const pagesList = reader.querySelector(".nh-reader-pages");
        if (!pagesList) return;
        const items = Array.from(pagesList.children).filter((child) => child.matches(".nh-reader-page, .nh-reader-slide"));
        if (!items.length) return;

        const horizontal = reader.classList.contains("nh-reader-orientation-horizontal");
        const listRect = pagesList.getBoundingClientRect();
        const center = horizontal ? listRect.left + listRect.width / 2 : listRect.top + listRect.height / 2;
        let currentIndex = items.findIndex((item) => {
            const rect = item.getBoundingClientRect();
            return horizontal ? rect.left <= center && rect.right >= center : rect.top <= center && rect.bottom >= center;
        });
        if (currentIndex < 0) currentIndex = delta > 0 ? 0 : items.length - 1;

        // Pages are kept in reading order in the DOM. Reversed mode changes
        // their visual direction, so applying a second index inversion here
        // would make the next control stop at the first page.
        const targetIndex = Math.max(0, Math.min(items.length - 1, currentIndex + delta));
        items[targetIndex].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }

    function ensureFullscreenControls() {
        let controls = document.querySelector("#nh-fullscreen-controls");
        if (!controls) {
            controls = el("div", { id: "nh-fullscreen-controls", className: "nh-fullscreen-controls", hidden: true });
            controls.innerHTML = `
                <div class="nh-fullscreen-menu" hidden>
                    <div class="nh-fs-control-group">
                        <span class="nh-fs-control-label">Direção</span>
                        <div class="nh-segmented">
                            <button type="button" class="nh-seg-btn" data-fs-orientation="vertical">${ICON.vertical}<span>Vertical</span></button>
                            <button type="button" class="nh-seg-btn" data-fs-orientation="horizontal">${ICON.horizontal}<span>Horizontal</span></button>
                        </div>
                    </div>
                    <div class="nh-fs-control-group">
                        <span class="nh-fs-control-label">Zoom padrão</span>
                        <div class="nh-segmented">
                            <button type="button" class="nh-seg-btn" data-fs-zoom="1">100%</button>
                            <button type="button" class="nh-seg-btn" data-fs-zoom="1.25">125%</button>
                            <button type="button" class="nh-seg-btn" data-fs-zoom="1.5">150%</button>
                            <button type="button" class="nh-seg-btn" data-fs-zoom="2">200%</button>
                        </div>
                    </div>
                    <div class="nh-fs-control-group">
                        <span class="nh-fs-control-label">Páginas</span>
                        <div class="nh-segmented">
                            <button type="button" class="nh-seg-btn" data-fs-layout="single">Única</button>
                            <button type="button" class="nh-seg-btn" data-fs-layout="double">Dupla</button>
                        </div>
                    </div>
                    <button type="button" class="nh-seg-btn nh-fs-toggle" data-fs-manhwa="true">${ICON.manhwa}<span>Manhwa</span></button>
                    <button type="button" class="nh-seg-btn nh-fs-toggle" data-fs-reversed="true">${ICON.refresh}<span>Invertido</span></button>
                    <button type="button" class="nh-seg-btn nh-fs-action" data-fs-top="true">${ICON.arrowUp}<span>Voltar ao topo</span></button>
                    <button type="button" class="nh-seg-btn nh-fs-action" data-fs-exit="true">${ICON.close}<span>Sair da tela cheia</span></button>
                </div>
                <button type="button" class="nh-fs-control-toggle" title="Reader settings" aria-label="Reader settings" aria-expanded="false">
                    ${ICON.settings}<span class="nh-sr-only">Configurações do leitor</span>
                </button>
            `;
            document.body.appendChild(controls);

            const menu = controls.querySelector(".nh-fullscreen-menu");
            const toggle = controls.querySelector(".nh-fs-control-toggle");
            toggle.addEventListener("click", (event) => {
                event.stopPropagation();
                menu.hidden = !menu.hidden;
                toggle.setAttribute("aria-expanded", String(!menu.hidden));
            });
            menu.addEventListener("click", (event) => event.stopPropagation());
            controls.querySelectorAll("[data-fs-orientation]").forEach((button) => {
                button.addEventListener("click", () => setFullscreenOrientation(button.dataset.fsOrientation));
            });
            controls.querySelectorAll("[data-fs-zoom]").forEach((button) => {
                button.addEventListener("click", () => setFullscreenZoom(button.dataset.fsZoom));
            });
            controls.querySelectorAll("[data-fs-layout]").forEach((button) => {
                button.addEventListener("click", () => setFullscreenLayout(button.dataset.fsLayout));
            });
            controls.querySelector("[data-fs-manhwa]").addEventListener("click", () => setManhwaMode(!getPreferredManhwaMode()));
            controls.querySelector("[data-fs-reversed]").addEventListener("click", () => setFullscreenReversed(!getPreferredFullscreenReversed()));
            controls.querySelector("[data-fs-top]").addEventListener("click", scrollReaderToTop);
            controls.querySelector("[data-fs-exit]").addEventListener("click", () => setMediaMode("continuous"));

            if (!window.__nhFullscreenControlsOutsideClickBound) {
                window.__nhFullscreenControlsOutsideClickBound = true;
                document.addEventListener("click", () => {
                    const current = document.querySelector("#nh-fullscreen-controls");
                    const currentMenu = current?.querySelector(".nh-fullscreen-menu");
                    const currentToggle = current?.querySelector(".nh-fs-control-toggle");
                    if (currentMenu && currentToggle) {
                        currentMenu.hidden = true;
                        currentToggle.setAttribute("aria-expanded", "false");
                    }
                });
            }
        }

        let navigation = document.querySelector("#nh-fullscreen-navigation");
        if (!navigation) {
            navigation = el("div", { id: "nh-fullscreen-navigation", className: "nh-fullscreen-navigation", hidden: true });
            navigation.innerHTML = `
                <button type="button" class="nh-fs-nav-btn nh-fs-nav-prev" data-fs-prev="true" title="Página anterior" aria-label="Página anterior">
                    ${ICON.chevronLeft}
                </button>
                <button type="button" class="nh-fs-nav-btn nh-fs-nav-next" data-fs-next="true" title="Próxima página" aria-label="Próxima página">
                    ${ICON.chevronRight}
                </button>
            `;
            document.body.appendChild(navigation);
            navigation.querySelector("[data-fs-prev]").addEventListener("click", () => navigateReaderPage(-1));
            navigation.querySelector("[data-fs-next]").addEventListener("click", () => navigateReaderPage(1));
        }

        syncFullscreenControls();
    }

    function syncFullscreenControls() {
        const controls = document.querySelector("#nh-fullscreen-controls");
        const active = document.body.classList.contains("nh-reader-fullscreen-active");
        const navigation = document.querySelector("#nh-fullscreen-navigation");
        if (controls) controls.hidden = !active;
        if (navigation) navigation.hidden = !active;
        if (!controls) return;
        if (!active) return;

        const orientation = getPreferredReaderOrientation();
        const layout = getPreferredFullscreenLayout();
        const zoom = getPreferredFullscreenZoom();
        const manhwa = getPreferredManhwaMode();
        const reversed = getPreferredFullscreenReversed();
        const previousButton = navigation?.querySelector("[data-fs-prev]");
        const nextButton = navigation?.querySelector("[data-fs-next]");
        const horizontal = orientation === "horizontal";
        navigation?.classList.toggle("is-vertical", !horizontal);
        navigation?.classList.toggle("is-horizontal", horizontal);
        if (previousButton && nextButton) {
            previousButton.innerHTML = horizontal
                ? (reversed ? ICON.chevronRight : ICON.chevronLeft)
                : (reversed ? ICON.arrowDown : ICON.arrowUp);
            nextButton.innerHTML = horizontal
                ? (reversed ? ICON.chevronLeft : ICON.chevronRight)
                : (reversed ? ICON.arrowUp : ICON.arrowDown);
        }
        controls.querySelectorAll("[data-fs-orientation]").forEach((button) => {
            button.classList.toggle("active", button.dataset.fsOrientation === orientation);
        });
        controls.querySelectorAll("[data-fs-layout]").forEach((button) => {
            button.classList.toggle("active", button.dataset.fsLayout === layout && !(manhwa && button.dataset.fsLayout === "double"));
        });
        const doubleButton = controls.querySelector("[data-fs-layout='double']");
        if (doubleButton) doubleButton.disabled = manhwa;
        controls.querySelectorAll("[data-fs-zoom]").forEach((button) => {
            button.classList.toggle("active", button.dataset.fsZoom === zoom);
        });
        const manhwaButton = controls.querySelector("[data-fs-manhwa]");
        if (manhwaButton) {
            manhwaButton.classList.toggle("active", manhwa);
            manhwaButton.setAttribute("aria-pressed", String(manhwa));
        }
        const reversedButton = controls.querySelector("[data-fs-reversed]");
        if (reversedButton) {
            reversedButton.classList.toggle("active", reversed);
            reversedButton.setAttribute("aria-pressed", String(reversed));
        }
    }

    function bindReaderKeyboard() {
        if (window.__nhReaderKeyboardBound) return;
        window.__nhReaderKeyboardBound = true;

        document.addEventListener("keydown", (event) => {
            const target = event.target;
            if (target && ((typeof target.matches === "function" && target.matches("input, textarea, select, button, [contenteditable='true']")) || target.isContentEditable)) return;

            const reader = document.querySelector("#nh-reader");
            if (!reader || reader.style.display === "none") return;

            const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
            const isFullscreen = reader.classList.contains("nh-reader-fullscreen");

            if (key === "Escape" && isFullscreen) {
                event.preventDefault();
                setMediaMode("continuous");
                return;
            }

            if (key === "Home") {
                event.preventDefault();
                scrollReaderToTop();
                return;
            }

            if (key === "End") {
                event.preventDefault();
                if (isFullscreen) {
                    const pagesList = reader.querySelector(".nh-reader-pages");
                    if (pagesList) {
                        const reversed = reader.classList.contains("nh-reader-reversed");
                        const horizontal = reader.classList.contains("nh-reader-orientation-horizontal");
                        pagesList.scrollTo({
                            top: horizontal ? 0 : (reversed ? 0 : pagesList.scrollHeight),
                            left: horizontal ? (reversed ? 0 : pagesList.scrollWidth) : 0,
                            behavior: "smooth",
                        });
                    }
                } else {
                    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
                }
                return;
            }

            const horizontal = reader.classList.contains("nh-reader-orientation-horizontal");
            const previousKeys = horizontal ? ["ArrowLeft", "a", "w"] : ["ArrowUp", "w", "a"];
            const nextKeys = horizontal ? ["ArrowRight", "d", "s"] : ["ArrowDown", "s", "d"];
            if (previousKeys.includes(key)) {
                event.preventDefault();
                navigateReaderPage(-1);
            } else if (nextKeys.includes(key)) {
                event.preventDefault();
                navigateReaderPage(1);
            }
        });
    }

    function toggleContinuousReader(forceOpen = null) {
        const next = forceOpen !== null ? (forceOpen ? "continuous" : "thumbnails") : (readerActive ? "thumbnails" : "continuous");
        setMediaMode(next);
    }

    const setupContinuousReader = setupPostMediaView;

    function createReaderElement() {
        const { cdnHost, mid, sourceTemplate, totalPages, pages } = extractGalleryMediaInfo();

        const reader = el("div", { id: "nh-reader", className: "nh-reader" });
        applyReaderWidth(reader, getPreferredReaderWidth());

        // Container of pages
        const pagesList = el("div", { className: "nh-reader-pages" });

        for (let i = 0; i < totalPages; i++) {
            const pageNum = i + 1;
            const detectedExt = pages[i]?.ext || "webp";
            const candidates = buildCandidateUrls(cdnHost, mid, pageNum, detectedExt, sourceTemplate);

            const pageWrap = el("div", {
                className: "nh-reader-page",
                dataset: {
                    page: String(pageNum),
                    candidates: JSON.stringify(candidates),
                },
            });

            pageWrap.innerHTML = `
                <div class="nh-page-badge">${pageNum}</div>
                <img class="nh-page-img" alt="Page ${pageNum}">
            `;

            pageWrap.querySelector(".nh-page-img").addEventListener("click", () => cyclePageZoom(pageWrap));

            pagesList.appendChild(pageWrap);
        }

        reader.appendChild(pagesList);
        setupReaderObservers(pagesList);

        return reader;
    }

    function setupReaderObservers(pagesList) {
        if (readerImgObserver) readerImgObserver.disconnect();

        // Lazy load images with generous viewport margin
        readerImgObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        loadReaderSlot(entry.target);
                    }
                });
            },
            { rootMargin: "1200px 0px 1200px 0px" }
        );

        pagesList.querySelectorAll(".nh-reader-page").forEach((p) => {
            readerImgObserver.observe(p);
        });
    }

    function loadReaderSlot(slot) {
        if (slot.dataset.loading === "true" || slot.classList.contains("is-done")) return;
        slot.dataset.loading = "true";

        let candidates = [];
        try {
            candidates = JSON.parse(slot.dataset.candidates || "[]");
        } catch (e) {}
        if (!candidates.length) return;

        let index = 0;
        const img = slot.querySelector("img");

        function tryNext() {
            if (index >= candidates.length) {
                slot.classList.add("is-error");
                slot.dataset.loading = "false";
                // Allow click to retry
                slot.style.cursor = "pointer";
                slot.onclick = () => {
                    slot.classList.remove("is-error");
                    slot.style.cursor = "";
                    slot.onclick = null;
                    index = 0;
                    tryNext();
                };
                return;
            }

            const url = candidates[index++];
            const temp = new Image();
            temp.onload = () => {
                img.src = url;
                slot.classList.add("is-done");
                slot.dataset.loading = "false";
            };
            temp.onerror = () => {
                tryNext();
            };
            temp.src = url;
        }

        tryNext();
    }

    function ensureFloatingPill() {
        let pill = document.querySelector("#nh-reader-floating-pill");
        const scrollTopButton = `
            <button type="button" class="nh-pill-btn nh-pill-top" title="Scroll to top" aria-label="Scroll to top">${ICON.arrowUp}</button>
        `;

        if (!pill) {
            pill = el("div", {
                id: "nh-reader-floating-pill",
                className: "nh-floating-pill",
            });
            document.body.appendChild(pill);
        }

        // Replace the old page indicator/close control if it came from an
        // earlier script instance. This pill is intentionally scroll-to-top
        // only; reader mode remains available from the media toolbar.
        if (!pill.querySelector(".nh-pill-top") || pill.querySelector(".nh-pill-text, .nh-pill-close")) {
            pill.innerHTML = scrollTopButton;
            delete pill.dataset.nhTopBound;
        }

        const topButton = pill.querySelector(".nh-pill-top");
        if (topButton && !pill.dataset.nhTopBound) {
            pill.dataset.nhTopBound = "true";
            topButton.addEventListener("click", scrollReaderToTop);
        }
        pill.style.display = "inline-flex";
    }

    // ===================================================================== //
    //  Command Palette & Enhanced Search (⌘K / Ctrl+K)                     //
    // ===================================================================== //
    function buildSearchModal() {
        if (document.querySelector("#nh-search-modal")) return;

        const modal = el("div", { id: "nh-search-modal", className: "nh-search-overlay", hidden: true });
        modal.innerHTML = `
            <div class="nh-search-box" role="dialog" aria-modal="true">
                <div class="nh-sb-head">
                    <div class="nh-sb-field-wrap">
                        ${ICON.search}
                        <input class="nh-sb-input" type="text" placeholder="Search galleries, tags, artists, characters..." autocomplete="off" spellcheck="false">
                        <button type="button" class="nh-sb-clear" title="Clear input">${ICON.close}</button>
                        <kbd class="nh-kbd">esc</kbd>
                    </div>
                </div>

                <!-- Quick Filters Bar -->
                <div class="nh-sb-quick-bar">
                    <div class="nh-sb-quick-group">
                        <span class="nh-quick-lbl">Languages:</span>
                        <button type="button" class="nh-quick-chip" data-token="language:english">English</button>
                        <button type="button" class="nh-quick-chip" data-token="language:japanese">Japanese</button>
                        <button type="button" class="nh-quick-chip" data-token="language:chinese">Chinese</button>
                    </div>
                    <div class="nh-sb-quick-group">
                        <span class="nh-quick-lbl">Sort:</span>
                        <button type="button" class="nh-quick-chip" data-sort="">Newest</button>
                        <button type="button" class="nh-quick-chip" data-sort="popular">Popular All Time</button>
                        <button type="button" class="nh-quick-chip" data-sort="popular-today">Today</button>
                        <button type="button" class="nh-quick-chip" data-sort="popular-week">This Week</button>
                    </div>
                </div>

                <!-- Query Chips -->
                <div class="nh-sb-chips" hidden></div>

                <!-- Body (Autocomplete Suggestions & Recent Searches) -->
                <div class="nh-sb-body">
                    <div class="nh-sb-harvested" hidden>
                        <div class="nh-harvested-title">Tags nos resultados:</div>
                        <div class="nh-harvested-list"></div>
                    </div>
                    <div class="nh-sb-suggestions" hidden></div>
                    <div class="nh-sb-recents"></div>
                </div>

                <!-- Footer -->
                <div class="nh-sb-foot">
                    <div class="nh-sb-hints">
                        <span><kbd class="nh-kbd">↵</kbd> Search</span>
                        <span><kbd class="nh-kbd">↑</kbd><kbd class="nh-kbd">↓</kbd> Navigate</span>
                        <span><kbd class="nh-kbd">esc</kbd> Close</span>
                    </div>
                    <button type="button" class="nh-btn nh-btn-primary nh-sb-go">Search</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const input = modal.querySelector(".nh-sb-input");
        const clearBtn = modal.querySelector(".nh-sb-clear");
        const chipsContainer = modal.querySelector(".nh-sb-chips");
        const suggestionsBox = modal.querySelector(".nh-sb-suggestions");
        const recentsBox = modal.querySelector(".nh-sb-recents");
        const harvestedBox = modal.querySelector(".nh-sb-harvested");
        const harvestedList = modal.querySelector(".nh-harvested-list");
        const goBtn = modal.querySelector(".nh-sb-go");

        let activeTokens = new Set();
        let selectedSort = "";
        let focusedIndex = -1;

        function updateHarvestedTagsUI() {
            if (!harvestedTags.size) {
                if (harvestedBox) harvestedBox.hidden = true;
                return;
            }
            if (harvestedBox) harvestedBox.hidden = !suggestionsBox.hidden;
            if (!harvestedList) return;
            harvestedList.innerHTML = "";

            const topTags = Array.from(harvestedTags).slice(0, 30);
            topTags.forEach((name) => {
                const incToken = `tag:"${name}"`;
                const excToken = `-tag:"${name}"`;
                const isInc = activeTokens.has(incToken) || activeTokens.has(`tag:${name}`) || activeTokens.has(name) || activeTokens.has(`"${name}"`);
                const isExc = activeTokens.has(excToken) || activeTokens.has(`-tag:${name}`) || activeTokens.has(`-${name}`) || activeTokens.has(`-"${name}"`);

                const chip = el("button", {
                    type: "button",
                    className: `nh-harvested-chip ${isInc ? "is-included" : ""} ${isExc ? "is-excluded" : ""}`.trim()
                });
                chip.innerHTML = `${isExc ? "−" : (isInc ? "+" : "")}<span>${escapeHtml(name)}</span>`;
                chip.addEventListener("click", () => {
                    if (!isInc && !isExc) {
                        activeTokens.add(incToken);
                    } else if (isInc) {
                        activeTokens.delete(incToken);
                        activeTokens.delete(`tag:${name}`);
                        activeTokens.delete(name);
                        activeTokens.delete(`"${name}"`);
                        activeTokens.add(excToken);
                    } else {
                        activeTokens.delete(excToken);
                        activeTokens.delete(`-tag:${name}`);
                        activeTokens.delete(`-${name}`);
                        activeTokens.delete(`-"${name}"`);
                    }
                    renderChips();
                    updateHarvestedTagsUI();
                    modal.querySelectorAll(".nh-quick-chip[data-token]").forEach((btn) => {
                        btn.classList.toggle("active", activeTokens.has(btn.dataset.token));
                    });
                    input.focus();
                });
                harvestedList.appendChild(chip);
            });
        }

        window.__nhOpenSearch = (initialQuery = null, initialSort = null) => {
            modal.hidden = false;
            document.documentElement.style.overflow = "hidden";
            input.value = "";

            if (initialQuery !== null) {
                activeTokens.clear();
                if (initialQuery.trim()) {
                    const tokens = initialQuery.match(/(-?[\w]+:"[^"]*"|-?"[^"]*"|[^\s"]+)/g) || initialQuery.trim().split(/\s+/);
                    tokens.forEach((t) => activeTokens.add(t));
                }
            }

            if (initialSort !== null) {
                selectedSort = initialSort;
                modal.querySelectorAll(".nh-quick-chip[data-sort]").forEach((b) => {
                    b.classList.toggle("active", b.dataset.sort === selectedSort);
                });
            }

            modal.querySelectorAll(".nh-quick-chip[data-token]").forEach((btn) => {
                btn.classList.toggle("active", activeTokens.has(btn.dataset.token));
            });

            renderRecents();
            renderChips();
            updateHarvestedTagsUI();
            renderSuggestions("");
            setTimeout(() => input.focus(), 50);
        };

        const closeModal = () => {
            modal.hidden = true;
            document.documentElement.style.overflow = "";
        };

        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });

        clearBtn.addEventListener("click", () => {
            input.value = "";
            input.focus();
            renderSuggestions("");
        });

        modal.querySelectorAll(".nh-quick-chip[data-token]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const token = btn.dataset.token;
                if (activeTokens.has(token)) {
                    activeTokens.delete(token);
                    btn.classList.remove("active");
                } else {
                    activeTokens.add(token);
                    btn.classList.add("active");
                }
                renderChips();
                input.focus();
            });
        });

        modal.querySelectorAll(".nh-quick-chip[data-sort]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const sort = btn.dataset.sort;
                selectedSort = sort;
                modal.querySelectorAll(".nh-quick-chip[data-sort]").forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
                input.focus();
            });
        });

        input.addEventListener("input", () => {
            const val = input.value;
            clearBtn.style.display = val ? "block" : "none";
            renderSuggestions(val);
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                closeModal();
            } else if (e.key === "Enter") {
                e.preventDefault();
                const visibleRows = suggestionsBox.querySelectorAll(".nh-tag-row");
                if (focusedIndex >= 0 && visibleRows[focusedIndex]) {
                    visibleRows[focusedIndex].click();
                } else {
                    commitSearch();
                }
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                moveFocus(1);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                moveFocus(-1);
            }
        });

        goBtn.addEventListener("click", commitSearch);

        function moveFocus(delta) {
            const rows = suggestionsBox.querySelectorAll(".nh-tag-row");
            if (!rows.length) return;
            focusedIndex = Math.max(0, Math.min(rows.length - 1, focusedIndex + delta));
            rows.forEach((r, i) => r.classList.toggle("is-focused", i === focusedIndex));
            rows[focusedIndex].scrollIntoView({ block: "nearest" });
        }

        function renderChips() {
            chipsContainer.innerHTML = "";
            chipsContainer.hidden = activeTokens.size === 0;

            activeTokens.forEach((token) => {
                const chip = el("span", { className: "nh-sb-chip" });
                chip.style.setProperty("--tc", getTagColor(token));

                const isExcluded = token.startsWith("-");
                chip.innerHTML = `
                    <span class="nh-chip-txt">${isExcluded ? "−" : ""}${token.replace(/^[-+]/, "")}</span>
                    <button type="button" class="nh-chip-del">${ICON.close}</button>
                `;

                chip.querySelector(".nh-chip-del").addEventListener("click", () => {
                    activeTokens.delete(token);
                    renderChips();
                    updateHarvestedTagsUI();
                    modal.querySelectorAll(`.nh-quick-chip[data-token="${token}"]`).forEach((b) => b.classList.remove("active"));
                });

                chipsContainer.appendChild(chip);
            });
        }

        function renderSuggestions(query) {
            query = query.trim().toLowerCase();
            focusedIndex = -1;

            if (!query) {
                suggestionsBox.hidden = true;
                recentsBox.hidden = false;
                updateHarvestedTagsUI();
                return;
            }

            suggestionsBox.hidden = false;
            recentsBox.hidden = true;
            if (harvestedBox) harvestedBox.hidden = true;
            suggestionsBox.innerHTML = "";

            const allTags = tagStore.all();
            const startsWith = [];
            const contains = [];

            for (const t of allTags) {
                const lower = t.toLowerCase();
                if (lower.startsWith(query)) startsWith.push(t);
                else if (lower.includes(query)) contains.push(t);
                if (startsWith.length + contains.length >= 60) break;
            }

            const matched = [...startsWith, ...contains].slice(0, 40);

            if (!matched.length) {
                suggestionsBox.innerHTML = `
                    <div class="nh-sb-empty">Press <b>Enter</b> to search "<b>${query}</b>"</div>
                `;
                return;
            }

            matched.forEach((t) => {
                const row = el("div", { className: "nh-tag-row" });
                row.style.setProperty("--tc", getTagColor(t));

                row.innerHTML = `
                    <span class="nh-tr-name">${t}</span>
                    <div class="nh-tr-actions">
                        <button type="button" class="nh-tr-btn nh-tr-inc" title="Include tag">${ICON.plus}</button>
                        <button type="button" class="nh-tr-btn nh-tr-exc" title="Exclude tag">${ICON.minus}</button>
                    </div>
                `;

                row.querySelector(".nh-tr-inc").addEventListener("click", (e) => {
                    e.stopPropagation();
                    activeTokens.delete("-" + t);
                    activeTokens.add(t);
                    input.value = "";
                    renderChips();
                    renderSuggestions("");
                    input.focus();
                });

                row.querySelector(".nh-tr-exc").addEventListener("click", (e) => {
                    e.stopPropagation();
                    activeTokens.delete(t);
                    activeTokens.add("-" + t);
                    input.value = "";
                    renderChips();
                    renderSuggestions("");
                    input.focus();
                });

                row.addEventListener("click", () => {
                    activeTokens.add(t);
                    input.value = "";
                    renderChips();
                    commitSearch();
                });

                suggestionsBox.appendChild(row);
            });
        }

        function renderRecents() {
            recentsBox.innerHTML = "";
            let hist = [];
            try {
                hist = JSON.parse(localStorage.getItem(KEY_RECENT_SEARCHES) || "[]");
            } catch (e) {}

            if (!hist.length) {
                recentsBox.innerHTML = `
                    <div class="nh-recents-head">
                        <span>Recent Searches</span>
                    </div>
                    <div class="nh-recents-empty">No recent searches</div>
                `;
                return;
            }

            const head = el("div", { className: "nh-recents-head" });
            head.innerHTML = `
                <span>Recent Searches</span>
                <button type="button" class="nh-recents-clear">Clear all</button>
            `;
            head.querySelector(".nh-recents-clear").addEventListener("click", () => {
                try {
                    localStorage.removeItem(KEY_RECENT_SEARCHES);
                } catch (e) {}
                renderRecents();
            });
            recentsBox.appendChild(head);

            const list = el("div", { className: "nh-recents-list" });
            hist.slice(0, 10).forEach((item) => {
                const it = el("button", { type: "button", className: "nh-recent-item" });
                it.innerHTML = `
                    ${ICON.search}
                    <span class="nh-recent-q">${item.q}</span>
                    <span class="nh-recent-arrow">${ICON.chevronRight}</span>
                `;
                it.addEventListener("click", () => {
                    location.href = item.url;
                });
                list.appendChild(it);
            });
            recentsBox.appendChild(list);
        }

        function commitSearch() {
            const rawVal = input.value.trim();
            if (rawVal) {
                rawVal.split(/\s+/).forEach((t) => activeTokens.add(t));
            }

            const q = [...activeTokens].join(" ").trim();
            if (!q) return;

            const url = new URL("/search/", location.origin);
            url.searchParams.set(isNhentaiXxxHost() ? "key" : "q", q);
            if (selectedSort) {
                url.searchParams.set("sort", selectedSort);
            }

            try {
                const hist = JSON.parse(localStorage.getItem(KEY_RECENT_SEARCHES) || "[]").filter((x) => x.q !== q);
                hist.unshift({ q, url: url.href, time: Date.now() });
                localStorage.setItem(KEY_RECENT_SEARCHES, JSON.stringify(hist.slice(0, 30)));
            } catch (e) {}

            location.href = url.href;
        }

        // Global shortcuts: ⌘K, Ctrl+K, or '/'
        window.addEventListener("keydown", (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                window.__nhOpenSearch();
            } else if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
                e.preventDefault();
                window.__nhOpenSearch();
            }
        });
    }

    function harvestTags(cards) {
        cards.forEach((card) => {
            const caption = card.querySelector(".caption")?.textContent || "";
            const matches = caption.match(/\[(.*?)\]|\((.*?)\)/g);
            if (matches) {
                matches.forEach((m) => {
                    const clean = m.replace(/^[\[\(]|[\]\)]$/g, "").trim();
                    if (clean && clean.length > 2 && clean.length < 30) {
                        tagStore.add(clean);
                        harvestedTags.add(clean.toLowerCase());
                    }
                });
            }
            card.querySelectorAll(".nh-tag-chip, .nh-tag-general, a[href*='/tag/']").forEach((t) => {
                const txt = t.textContent.trim().replace(/^Tag:\s*/i, "").replace(/^[#\s]+/, "");
                if (txt && txt.length > 2 && txt.length < 30) {
                    tagStore.add(`tag:${txt}`);
                    harvestedTags.add(txt.toLowerCase());
                }
            });
            const link = getGalleryCardLink(card);
            const m = link?.getAttribute("href")?.match(/\/g\/(\d+)/);
            if (m) {
                const cached = getCachedGalleryMeta(m[1]);
                if (cached && Array.isArray(cached.tags)) {
                    cached.tags.forEach((t) => {
                        if (t.type === "tag" && t.name) {
                            harvestedTags.add(t.name.toLowerCase());
                        }
                    });
                }
            }
        });
    }

    function harvestPostTags() {
        const tagContainers = document.querySelectorAll("#tags .tag-container, #tags .tags a, .tagchip");
        tagContainers.forEach((a) => {
            const nameEl = a.querySelector(".name");
            const tagText = (nameEl ? nameEl.textContent : a.textContent).trim();
            const href = a.getAttribute("href") || "";
            const m = href.match(/\/(tag|artist|character|parody|group|language|category)\/([^/]+)\//);
            if (m) {
                const ns = m[1];
                const val = decodeURIComponent(m[2]).replace(/-/g, " ");
                tagStore.add(`${ns}:${val}`);
            } else if (tagText) {
                tagStore.add(tagText);
            }
        });
    }

    // ===================================================================== //
    //  Modern AMOLED Dark Theme & Responsive CSS Styles                     //
    // ===================================================================== //
    function injectModernStyles() {
        const css = `
        /* ===== Root Variables & AMOLED Base ===== */
        :root {
            --nh-accent: ${ACCENT};
            --nh-accent-hover: ${ACCENT_HOVER};
            --nh-accent-dark: ${ACCENT_DARK};
            --nh-grad: ${ACCENT_GRAD};
            --nh-bg: #0c0c0f;
            --nh-surface: #14141a;
            --nh-surface-elevated: #1a1a24;
            --nh-card: #14141d;
            --nh-card-hover: #1b1b26;
            --nh-border: #22222e;
            --nh-border-light: #2e2e3e;
            --nh-text-primary: #f2f2f8;
            --nh-text-secondary: #9ea0b0;
            --nh-text-muted: #66687a;
            --nh-radius: 12px;
            --nh-radius-sm: 8px;
            --nh-reader-width: 100%;
        }

        /* ===== Dark Body & Full-Width Container Overrides ===== */
        html, body {
            background-color: var(--nh-bg) !important;
            color: var(--nh-text-primary) !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            min-height: 100vh;
            margin: 0;
            padding: 0;
        }

        .container, #content, .index-container, .gallery-grid, #favcontainer, #bigcontainer, #thumbnail-container, #nh-media-toolbar, #app, main, .content {
            width: 95vw !important;
            max-width: 1600px !important;
            margin-left: auto !important;
            margin-right: auto !important;
            box-sizing: border-box !important;
        }

        .container, .index-container, .gallery-grid, .index-popular, #favcontainer {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* Hide Ads and Bloat */
        .ad-wrapper, .advertisement, [id^="ts_ad"], iframe[src*="ad"],
        .commercial, [class*="banner-ad"], div[id*="ad_"], .fake-ad, .ts-root {
            display: none !important;
            height: 0 !important;
            opacity: 0 !important;
            pointer-events: none !important;
        }

        /* Native pagination stays available on the Tags page. Gallery
           listings hide it only after infinite scroll has been initialized. */
        .pagination,
        section.pagination {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-wrap: wrap !important;
            gap: 6px !important;
            margin: 24px auto 40px !important;
            padding: 8px !important;
            color: var(--nh-text-secondary) !important;
        }

        .pagination .page,
        .pagination .next,
        .pagination .first,
        .pagination .last,
        .pagination .previous {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-width: 36px !important;
            height: 36px !important;
            box-sizing: border-box !important;
            padding: 0 10px !important;
            border: 1px solid var(--nh-border) !important;
            border-radius: 8px !important;
            background: var(--nh-surface) !important;
            color: var(--nh-text-secondary) !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            text-decoration: none !important;
            transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease !important;
        }

        .pagination .page.current {
            border-color: var(--nh-accent) !important;
            background: var(--nh-grad) !important;
            color: #fff !important;
        }

        .pagination .page:hover,
        .pagination .next:hover,
        .pagination .first:hover,
        .pagination .last:hover,
        .pagination .previous:hover {
            border-color: var(--nh-accent) !important;
            background: var(--nh-surface-elevated) !important;
            color: #fff !important;
        }

        .pagination .page:not(a) {
            border-color: transparent !important;
            background: transparent !important;
        }

        .pagination.mobile-pagination {
            display: none !important;
        }

        /* ===== Tags directory ================================================= */
        #content:has(#tag-container) {
            padding-top: 12px !important;
            padding-bottom: 32px !important;
        }

        #content:has(#tag-container) > h1 {
            width: 95vw !important;
            max-width: 1600px !important;
            margin: 22px auto 10px !important;
            color: var(--nh-text-primary) !important;
            font-size: clamp(24px, 3vw, 34px) !important;
            font-weight: 800 !important;
            letter-spacing: -0.02em !important;
            text-align: left !important;
        }

        /* Enhanced Single-Row Sort Bar */
        .sort,
        .sort:not(:has(#tag-container)) {
            position: relative !important;
            z-index: 100 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            width: 100% !important;
            max-width: 1200px !important;
            margin: 12px auto 16px !important;
            padding: 0 16px !important;
            background: transparent !important;
            box-sizing: border-box !important;
        }

        .nh-sort-inner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            width: 100%;
            max-width: 600px;
            padding: 6px 8px;
            background: rgba(18, 18, 24, 0.75);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid var(--nh-border);
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
            box-sizing: border-box;
        }

        .nh-sort-group {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }

        .nh-sort-item {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            height: 34px;
            padding: 0 14px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--nh-border);
            border-radius: 8px;
            color: var(--nh-text-secondary);
            font-size: 13px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.15s ease;
            white-space: nowrap;
            user-select: none;
        }

        .nh-sort-item:hover {
            background: var(--nh-surface-elevated);
            color: #fff;
            border-color: var(--nh-border-light);
        }

        .nh-sort-item.current {
            background: var(--nh-grad) !important;
            color: #fff !important;
            border-color: transparent !important;
            box-shadow: 0 2px 10px rgba(237, 37, 83, 0.35);
        }

        .nh-sort-dropdown {
            position: relative !important;
        }

        .nh-sort-dropdown.open {
            z-index: 1000 !important;
        }

        .nh-sort-dropdown.nh-sort-inactive-date .nh-sort-drop-toggle {
            opacity: 0.8;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--nh-border);
            color: var(--nh-text-secondary);
        }

        .nh-sort-dropdown.nh-sort-inactive-date:hover .nh-sort-drop-toggle,
        .nh-sort-dropdown.nh-sort-inactive-date.open .nh-sort-drop-toggle {
            opacity: 1;
            border-color: var(--nh-border-light);
            color: #fff;
        }

        .nh-sort-drop-toggle {
            appearance: none;
            -webkit-appearance: none;
            font-family: inherit;
        }

        .nh-sort-drop-toggle svg {
            width: 14px;
            height: 14px;
            transition: transform 0.2s ease;
        }

        .nh-sort-dropdown.open .nh-sort-drop-toggle svg,
        .nh-sort-dropdown:hover .nh-sort-drop-toggle svg {
            transform: rotate(180deg);
        }

        .nh-sort-menu {
            position: absolute !important;
            top: calc(100% + 4px) !important;
            left: 0;
            min-width: 150px;
            padding: 6px;
            background: #14141c;
            border: 1px solid var(--nh-border-light);
            border-radius: 10px;
            box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
            display: flex;
            flex-direction: column;
            gap: 3px;
            z-index: 99999 !important;
            opacity: 0;
            pointer-events: none;
            transform: translateY(-6px);
            transition: opacity 0.15s ease, transform 0.15s ease;
        }

        .nh-sort-menu::before {
            content: "" !important;
            position: absolute !important;
            top: -8px !important;
            left: 0 !important;
            right: 0 !important;
            height: 8px !important;
        }

        .nh-sort-dropdown.open .nh-sort-menu,
        .nh-sort-dropdown:hover .nh-sort-menu {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(0);
        }

        .nh-sort-menu-item {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            border-radius: 6px;
            color: var(--nh-text-secondary);
            font-size: 12.5px;
            font-weight: 550;
            text-decoration: none;
            transition: all 0.12s ease;
        }

        .nh-sort-menu-item:hover {
            background: var(--nh-surface-elevated);
            color: #fff;
        }

        .nh-sort-menu-item.current {
            background: rgba(237, 37, 83, 0.18);
            color: var(--nh-accent);
            font-weight: 650;
        }

        .nh-sort-filter-btn {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            height: 34px;
            padding: 0 14px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--nh-border);
            border-radius: 8px;
            color: var(--nh-text-primary);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
            white-space: nowrap;
        }

        .nh-sort-filter-btn:hover {
            background: var(--nh-surface-elevated);
            border-color: var(--nh-accent);
            color: var(--nh-accent);
            box-shadow: 0 2px 12px rgba(237, 37, 83, 0.2);
        }

        .nh-sort-filter-btn svg {
            width: 15px;
            height: 15px;
        }

        #content:has(#tag-container) > .sort {
            width: 95vw !important;
            max-width: 1600px !important;
            margin: 0 auto 18px !important;
            text-align: left !important;
            font-size: 13px !important;
        }

        #content:has(#tag-container) > .sort .sort-type {
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            margin: 0 !important;
            padding: 4px !important;
            overflow: visible !important;
            border: 1px solid var(--nh-border) !important;
            border-radius: 10px !important;
            background: var(--nh-surface) !important;
        }

        #content:has(#tag-container) > .sort .sort-type > a {
            display: inline-flex !important;
            align-items: center !important;
            min-height: 34px !important;
            padding: 0 14px !important;
            border-radius: 7px !important;
            color: var(--nh-text-secondary) !important;
            font-weight: 700 !important;
            text-decoration: none !important;
        }

        #content:has(#tag-container) > .sort .sort-type > a.current,
        #content:has(#tag-container) > .sort .sort-type > a:hover {
            background: var(--nh-surface-elevated) !important;
            color: #fff !important;
        }

        #content:has(#tag-container) > .sort .sort-type > a.current {
            background: var(--nh-grad) !important;
        }

        #tag-container {
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)) !important;
            columns: auto !important;
            column-count: auto !important;
            column-width: auto !important;
            column-rule: none !important;
            gap: 10px !important;
            width: 95vw !important;
            max-width: 1600px !important;
            margin: 0 auto !important;
            padding: 18px !important;
            border: 1px solid var(--nh-border) !important;
            border-radius: 16px !important;
            background: rgba(20, 20, 26, 0.72) !important;
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25) !important;
            box-sizing: border-box !important;
            grid-auto-flow: row dense !important;
            align-items: start !important;
        }

        #tag-container > .tagchip.variant-pill {
            width: 100% !important;
            min-width: 0 !important;
            margin: 0 !important;
        }

        #tag-container > section {
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)) !important;
            align-content: start !important;
            gap: 6px !important;
            min-width: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10px !important;
            border: 1px solid var(--nh-border) !important;
            border-radius: 10px !important;
            background: rgba(14, 14, 20, 0.7) !important;
        }

        /* A-Z may group chips inside a wrapper per letter. Flatten only those
           wrappers so each section gets a real, fully populated grid. */
        #tag-container > section > .tags,
        #tag-container > section > .tag-list,
        #tag-container > section > .tag-items,
        #tag-container > section > div {
            display: contents !important;
        }

        #tag-container:has(> section) {
            display: block !important;
        }

        #tag-container:has(> section) > section {
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)) !important;
            margin-bottom: 10px !important;
        }

        #tag-container:has(> section) > section .tagchip.variant-pill {
            width: auto !important;
            min-width: 0 !important;
            margin: 0 !important;
        }

        #tag-container > section:target {
            border-color: var(--nh-border-light) !important;
            background: rgba(14, 14, 20, 0.7) !important;
        }

        #tag-container > section > h2 {
            margin: 0 0 2px !important;
            padding: 0 4px 6px !important;
            border-bottom: 1px solid var(--nh-border) !important;
            color: var(--nh-text-primary) !important;
            font-size: 18px !important;
            line-height: 1.2 !important;
            text-align: left !important;
        }

        #tag-container > section .tagchip.variant-pill {
            width: 100% !important;
        }

        #tag-container .tagchip.variant-pill {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 10px !important;
            min-width: 0 !important;
            min-height: 42px !important;
            margin: 0 !important;
            padding: 8px 11px !important;
            border: 1px solid var(--nh-border) !important;
            border-radius: 9px !important;
            background: #171720 !important;
            color: var(--nh-text-primary) !important;
            text-align: left !important;
            text-decoration: none !important;
            transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease !important;
        }

        #tag-container .tagchip.variant-pill:hover {
            transform: translateY(-2px) !important;
            border-color: var(--nh-accent) !important;
            background: #20202c !important;
        }

        #tag-container .tagchip.variant-pill .name {
            min-width: 0 !important;
            padding: 0 !important;
            overflow-wrap: anywhere !important;
            background: transparent !important;
            color: var(--nh-text-primary) !important;
            font-size: 13px !important;
            font-weight: 650 !important;
            line-height: 1.3 !important;
        }

        #tag-container .tagchip.variant-pill .count {
            flex: 0 0 auto !important;
            padding: 3px 7px !important;
            border: 1px solid var(--nh-border-light) !important;
            border-radius: 999px !important;
            background: #101016 !important;
            color: var(--nh-text-muted) !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            line-height: 1 !important;
        }

        /* Force-reset native nhentai left padding from nav offset */
        #content {
            padding-left: 0 !important;
            padding-right: 0 !important;
        }

        /* ===== Unified Modern Topbar (<nav>) ===== */
        nav {
            position: relative !important;
            top: auto !important;
            z-index: 1000 !important;
            background: rgba(12, 12, 16, 0.88) !important;
            backdrop-filter: blur(16px) saturate(180%) !important;
            -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
            border-bottom: 1px solid var(--nh-border) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 !important;
            padding-left: 0 !important;
            min-height: 58px !important;
            height: 58px !important;
            box-sizing: border-box !important;
            width: 100% !important;
        }

        /* Hide old clutter in nav */
        nav form.search,
        nav #hamburger,
        nav a[href*="tsyndicate"],
        nav a[href*="twitter"],
        nav li:has(a[href*="tsyndicate"]),
        nav li:has(a[href*="twitter"]) {
            display: none !important;
        }

        nav > .collapse,
        nav > .nh-topbar-inner,
        nav > #nh-topbar-inner {
            width: 95vw !important;
            max-width: 1600px !important;
            margin: 0 auto !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 16px !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            height: 100% !important;
        }

        .nh-topbar-left {
            display: flex !important;
            align-items: center !important;
            gap: 14px !important;
            flex: 0 0 auto !important;
        }

        nav .logo {
            position: static !important;
            left: auto !important;
            right: auto !important;
            float: none !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            flex: 0 0 auto !important;
            margin-right: 6px !important;
            text-decoration: none !important;
            transition: opacity 0.15s ease !important;
        }

        nav .logo img {
            display: block !important;
            width: auto !important;
            max-width: 132px !important;
            max-height: 38px !important;
        }

        nav .logo:hover {
            opacity: 0.85 !important;
        }

        nav .menu.left {
            display: flex !important;
            align-items: center !important;
            gap: 4px !important;
            list-style: none !important;
            margin: 0 !important;
            padding: 0 !important;
            flex: 0 0 auto !important;
        }

        nav .menu.left li a,
        nav .menu.left li button {
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
            padding: 7px 11px !important;
            border-radius: var(--nh-radius-sm) !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            color: var(--nh-text-secondary) !important;
            text-decoration: none !important;
            transition: all 0.15s ease !important;
            background: transparent !important;
            border: none !important;
        }

        nav .menu.left li a:hover,
        nav .menu.left li button:hover {
            color: #fff !important;
            background: var(--nh-surface-elevated) !important;
        }

        /* More links is a real topbar item. Its nested Random/Tags entries are
           redundant because those destinations already have primary slots. */
        nav .menu.left > li.nh-nav-dropdown {
            position: relative !important;
            display: inline-block !important;
        }

        nav .menu.left > li.nh-nav-dropdown > button {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 36px !important;
            height: 36px !important;
            min-height: 36px !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 1px solid var(--nh-border) !important;
            border-radius: var(--nh-radius-sm) !important;
            background: transparent !important;
            color: var(--nh-text-secondary) !important;
            cursor: pointer !important;
        }

        nav .menu.left > li.nh-nav-dropdown > button svg {
            width: 17px !important;
            height: 17px !important;
        }

        nav .menu.left > li.nh-nav-dropdown > button[aria-expanded="true"],
        nav .menu.left > li.nh-nav-dropdown > button:hover {
            border-color: var(--nh-accent) !important;
            background: rgba(237, 37, 83, 0.12) !important;
            color: #fff !important;
        }

        nav .menu.left > li.nh-nav-dropdown > .dropdown-menu {
            position: absolute !important;
            top: calc(100% + 8px) !important;
            left: 0 !important;
            z-index: 1001 !important;
            display: none !important;
            min-width: 190px !important;
            margin: 0 !important;
            padding: 6px !important;
            border: 1px solid var(--nh-border-light) !important;
            border-radius: 10px !important;
            background: var(--nh-surface) !important;
            box-shadow: 0 16px 36px rgba(0, 0, 0, 0.65) !important;
        }

        nav .menu.left > li.nh-nav-dropdown.open > .dropdown-menu {
            display: block !important;
        }

        nav .menu.left > li.nh-nav-dropdown > .dropdown-menu > li {
            display: block !important;
            margin: 0 !important;
        }

        nav .menu.left > li.nh-nav-dropdown > .dropdown-menu > li > a {
            display: flex !important;
            align-items: center !important;
            width: 100% !important;
            height: auto !important;
            min-height: 36px !important;
            box-sizing: border-box !important;
            padding: 8px 10px !important;
            border-radius: 7px !important;
            color: var(--nh-text-secondary) !important;
            line-height: 1.2 !important;
            white-space: nowrap !important;
        }

        nav .menu.left > li.nh-nav-dropdown > .dropdown-menu > li > a:hover {
            background: var(--nh-surface-elevated) !important;
            color: #fff !important;
        }

        nav .menu.left > li.nh-nav-dropdown > .dropdown-menu > li.nh-dropdown-duplicate {
            display: none !important;
        }

        .nh-menu-toggle {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 36px !important;
            height: 36px !important;
            flex: 0 0 36px !important;
            padding: 0 !important;
            border: 1px solid var(--nh-border) !important;
            border-radius: var(--nh-radius-sm) !important;
            background: transparent !important;
            color: var(--nh-text-secondary) !important;
            cursor: pointer !important;
            transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease !important;
        }

        .nh-menu-toggle:hover,
        .nh-menu-toggle[aria-expanded="true"] {
            color: #fff !important;
            border-color: var(--nh-accent) !important;
            background: rgba(237, 37, 83, 0.12) !important;
        }

        .nh-menu-toggle svg {
            width: 19px !important;
            height: 19px !important;
        }

        .nh-sr-only {
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            padding: 0 !important;
            margin: -1px !important;
            overflow: hidden !important;
            clip: rect(0, 0, 0, 0) !important;
            white-space: nowrap !important;
            border: 0 !important;
        }

        /* Topbar Center Cluster: Command Search + Language Filter */
        .nh-topbar-center {
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
            flex: 1 1 auto !important;
            justify-content: center !important;
            max-width: 680px !important;
            margin: 0 16px !important;
        }

        .nh-topbar-search {
            flex: 1 1 320px !important;
            max-width: 440px !important;
            height: 38px !important;
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            padding: 0 12px !important;
            background: #111116 !important;
            border: 1px solid var(--nh-border) !important;
            border-radius: 10px !important;
            color: var(--nh-text-secondary) !important;
            cursor: pointer !important;
            transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease !important;
        }

        .nh-topbar-search:hover {
            border-color: var(--nh-accent) !important;
            background: #15151c !important;
            color: #fff !important;
            box-shadow: 0 0 0 3px rgba(237, 37, 83, 0.15) !important;
        }

        .nh-tbs-ico {
            display: inline-flex !important;
            align-items: center !important;
            color: var(--nh-text-muted) !important;
        }

        .nh-topbar-search:hover .nh-tbs-ico {
            color: var(--nh-accent) !important;
        }

        .nh-tbs-txt {
            flex: 1 1 auto !important;
            text-align: left !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            color: var(--nh-text-muted) !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
        }

        .nh-topbar-search:hover .nh-tbs-txt {
            color: var(--nh-text-secondary) !important;
        }

        .nh-topbar-lang {
            flex: 0 0 auto !important;
        }

        /* Right Nav: Sign in / Register */
        nav .menu.right {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            list-style: none !important;
            margin: 0 !important;
            padding: 0 !important;
            flex: 0 0 auto !important;
        }

        nav .menu.right li a {
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            padding: 5px 8px !important;
            border-radius: var(--nh-radius-sm) !important;
            font-size: 11px !important;
            font-weight: 600 !important;
            opacity: 0.78 !important;
            text-decoration: none !important;
            transition: all 0.15s ease !important;
        }

        nav .menu.right .menu-sign-in a {
            background: transparent !important;
            color: var(--nh-text-secondary) !important;
            border: 1px solid var(--nh-border) !important;
        }

        nav .menu.right .menu-sign-in a:hover {
            color: #fff !important;
            border-color: var(--nh-text-muted) !important;
            background: var(--nh-surface-elevated) !important;
        }

        nav .menu.right .menu-register a {
            background: var(--nh-grad) !important;
            color: #fff !important;
            border: none !important;
            box-shadow: 0 2px 8px rgba(237, 37, 83, 0.3) !important;
        }

        nav .menu.right .menu-register a:hover {
            filter: brightness(1.1) !important;
            transform: translateY(-1px) !important;
        }

        /* Shared hamburger drawer for desktop and mobile */
        #nh-nav-drawer {
            position: fixed !important;
            inset: 0 !important;
            z-index: 100000 !important;
            background: rgba(0, 0, 0, 0.66) !important;
            backdrop-filter: blur(4px) !important;
            -webkit-backdrop-filter: blur(4px) !important;
        }

        #nh-nav-drawer[hidden] {
            display: none !important;
        }

        .nh-nav-drawer-panel {
            position: absolute !important;
            top: 58px !important;
            left: max(2.5vw, 16px) !important;
            width: min(340px, calc(100vw - 32px)) !important;
            max-height: calc(100vh - 74px) !important;
            overflow-y: auto !important;
            padding: 8px !important;
            background: var(--nh-surface) !important;
            border: 1px solid var(--nh-border-light) !important;
            border-radius: var(--nh-radius) !important;
            box-shadow: 0 18px 50px rgba(0, 0, 0, 0.72) !important;
            animation: nhDrawerIn 0.16s ease-out !important;
        }

        @keyframes nhDrawerIn {
            from { opacity: 0; transform: translateY(-6px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .nh-nav-drawer-head {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding: 8px 8px 10px !important;
            border-bottom: 1px solid var(--nh-border) !important;
        }

        .nh-nav-drawer-title {
            color: var(--nh-text-primary) !important;
            font-size: 14px !important;
            font-weight: 700 !important;
        }

        .nh-nav-drawer-close {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 32px !important;
            height: 32px !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 6px !important;
            background: transparent !important;
            color: var(--nh-text-muted) !important;
            cursor: pointer !important;
        }

        .nh-nav-drawer-close:hover {
            color: #fff !important;
            background: var(--nh-surface-elevated) !important;
        }

        .nh-nav-drawer-close svg {
            width: 18px !important;
            height: 18px !important;
        }

        .nh-nav-drawer-list,
        .nh-nav-drawer-list ul {
            list-style: none !important;
            margin: 0 !important;
            padding: 4px 0 0 !important;
        }

        .nh-nav-drawer-list > li {
            display: block !important;
            float: none !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        .nh-nav-drawer-list a,
        .nh-nav-drawer-list button {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            width: 100% !important;
            min-height: 40px !important;
            box-sizing: border-box !important;
            padding: 8px 10px !important;
            border: 0 !important;
            border-radius: 7px !important;
            background: transparent !important;
            color: var(--nh-text-secondary) !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            text-decoration: none !important;
            text-align: left !important;
            cursor: pointer !important;
        }

        .nh-nav-drawer-list a:hover,
        .nh-nav-drawer-list button:hover {
            color: #fff !important;
            background: var(--nh-surface-elevated) !important;
        }

        .nh-nav-drawer-list a svg {
            width: 18px !important;
            height: 18px !important;
            flex: 0 0 18px !important;
        }

        .nh-nav-drawer-auth {
            margin-top: 6px !important;
            padding-top: 6px !important;
            border-top: 1px solid var(--nh-border) !important;
        }

        .nh-nav-drawer-secondary {
            margin-top: 6px !important;
            padding-top: 6px !important;
            border-top: 1px solid var(--nh-border) !important;
        }

        /* ===== Mirror: nhentai.xxx ======================================== */
        html.nh-mirror-xxx .hd_dt,
        html.nh-mirror-xxx .hd_mb {
            display: none !important;
        }

        html.nh-mirror-xxx .main_cnt,
        html.nh-mirror-xxx .main_wrap,
        html.nh-mirror-xxx .content_box,
        html.nh-mirror-xxx .gallery_top,
        html.nh-mirror-xxx .outer_thumbs {
            width: 95vw !important;
            max-width: 1600px !important;
            margin-left: auto !important;
            margin-right: auto !important;
            box-sizing: border-box !important;
        }

        html.nh-mirror-xxx .main_wrap {
            padding: 0 !important;
        }

        html.nh-mirror-xxx .content_box {
            background: transparent !important;
            border: 0 !important;
            box-shadow: none !important;
        }

        html.nh-mirror-xxx .content_box > h2 {
            margin: 20px 0 12px !important;
            padding-bottom: 8px !important;
            border-bottom: 1px solid var(--nh-border) !important;
            color: var(--nh-text-primary) !important;
            font-size: 20px !important;
        }

        html.nh-mirror-xxx .galleries_box {
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)) !important;
            gap: 16px !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 0 24px !important;
            box-sizing: border-box !important;
        }

        html.nh-mirror-xxx .gallery_item {
            position: relative !important;
            display: flex !important;
            min-width: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            overflow: hidden !important;
            border: 1px solid var(--nh-border) !important;
            border-radius: var(--nh-radius) !important;
            background: var(--nh-card) !important;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4) !important;
            transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease !important;
        }

        html.nh-mirror-xxx .gallery_item:hover {
            transform: translateY(-4px) !important;
            border-color: var(--nh-accent) !important;
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.62) !important;
        }

        html.nh-mirror-xxx .gallery_item > a {
            position: relative !important;
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            min-width: 0 !important;
            color: inherit !important;
            text-decoration: none !important;
            background: var(--nh-card) !important;
        }

        html.nh-mirror-xxx .gallery_item > a > img {
            display: block !important;
            width: 100% !important;
            height: auto !important;
            aspect-ratio: 250 / 353 !important;
            object-fit: cover !important;
            background: #08080a !important;
        }

        html.nh-mirror-xxx .gallery_item .caption {
            position: static !important;
            display: -webkit-box !important;
            width: 100% !important;
            max-height: none !important;
            box-sizing: border-box !important;
            padding: 8px 10px 7px !important;
            overflow: hidden !important;
            color: var(--nh-text-primary) !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            line-height: 1.35 !important;
            text-align: left !important;
            text-overflow: ellipsis !important;
            -webkit-box-orient: vertical !important;
            -webkit-line-clamp: 5 !important;
            word-break: break-word !important;
            background: var(--nh-card) !important;
        }

        html.nh-mirror-xxx .gallery_item > a > .nh-card-lang-flag,
        html.nh-mirror-xxx .gallery_item > a > .nh-card-pages {
            position: absolute !important;
            z-index: 3 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-sizing: border-box !important;
            height: 20px !important;
            padding: 0 6px !important;
            border: 1px solid rgba(255, 255, 255, 0.28) !important;
            border-radius: 5px !important;
            background: rgba(8, 8, 10, 0.78) !important;
            color: #fff !important;
            font-size: 12px !important;
            font-weight: 700 !important;
            line-height: 1 !important;
            pointer-events: none !important;
        }

        html.nh-mirror-xxx .gallery_item > a > .nh-card-lang-flag {
            top: 7px !important;
            left: 7px !important;
            width: 24px !important;
            padding: 0 !important;
        }

        html.nh-mirror-xxx .gallery_item > a > .nh-card-pages {
            top: 7px !important;
            right: 7px !important;
            min-width: 28px !important;
        }

        html.nh-mirror-xxx .gallery_top {
            display: flex !important;
            align-items: flex-start !important;
            gap: 24px !important;
            padding: 24px 0 !important;
        }

        html.nh-mirror-xxx .gallery_top .cover {
            position: relative !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex: 0 0 min(350px, 30vw) !important;
            width: min(350px, 30vw) !important;
            aspect-ratio: 1 / 1.41 !important;
            overflow: hidden !important;
            isolation: isolate !important;
            background: #08080a !important;
        }

        html.nh-mirror-xxx .gallery_top .cover.nh-cover-backdrop::before {
            position: absolute !important;
            inset: -10% !important;
            z-index: 0 !important;
            content: "" !important;
            background-image: var(--nh-cover-image) !important;
            background-position: center !important;
            background-size: cover !important;
            filter: blur(26px) saturate(1.08) !important;
            opacity: 0.76 !important;
            transform: scale(1.08) !important;
        }

        html.nh-mirror-xxx .gallery_top .cover > a {
            position: relative !important;
            z-index: 1 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            height: 100% !important;
        }

        html.nh-mirror-xxx .gallery_top .cover.nh-cover-backdrop > .nh-cover-media,
        html.nh-mirror-xxx .gallery_top .cover.nh-cover-backdrop > a > .nh-cover-media {
            position: relative !important;
            z-index: 1 !important;
            display: block !important;
            width: 100% !important;
            height: 100% !important;
            aspect-ratio: auto !important;
        }

        html.nh-mirror-xxx .gallery_top .cover img {
            display: block !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: contain !important;
        }

        html.nh-mirror-xxx .gallery_top .info {
            flex: 1 1 auto !important;
            min-width: 0 !important;
        }

        html.nh-mirror-xxx #thumbs_append {
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
            gap: 10px !important;
        }

        /* The .xxx native reader has its own page route; the injected reader
           uses the gallery metadata page and is available from the gallery. */
        html.nh-mirror-xxx .outer_thumbs {
            max-width: 1600px !important;
        }

        @media (min-width: 769px) {
            nav {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
            }

            body {
                padding-top: 58px !important;
            }
        }

        /* ===== Responsive Fluid Grid & Section Headers ===== */
        .index-container,
        .gallery-grid {
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(min(215px, 100%), 1fr)) !important;
            gap: 18px !important;
            padding: 16px 0 28px 0 !important;
            width: 100% !important;
            min-width: 0 !important;
            grid-auto-flow: row !important;
        }

        /* Fix: Section titles MUST span full grid columns and stay ABOVE cards */
        .index-container > h2,
        .index-popular > h2,
        .index-container > .section-header,
        .gallery-grid > h2,
        .gallery-grid > .section-header {
            grid-column: 1 / -1 !important;
            width: 100% !important;
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            margin: 16px 0 10px 0 !important;
            padding-bottom: 8px !important;
            font-size: 20px !important;
            font-weight: 700 !important;
            color: var(--nh-text-primary) !important;
            border-bottom: 1px solid var(--nh-border) !important;
        }

        .index-container > h2 i.color-icon,
        .index-popular > h2 i.color-icon {
            color: var(--nh-accent) !important;
        }

        /* ===== Gallery Cards: Thumbnail, Title, and Tags ===== */
        .gallery {
            position: relative !important;
            display: flex !important;
            flex-direction: column !important;
            background: var(--nh-card) !important;
            border: 1px solid var(--nh-border) !important;
            border-radius: var(--nh-radius) !important;
            overflow: hidden !important;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4) !important;
            transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1),
                        box-shadow 0.22s cubic-bezier(0.2, 0.8, 0.2, 1),
                        border-color 0.22s ease,
                        opacity 0.22s ease !important;
            width: 100% !important;
            margin: 0 !important;
            box-sizing: border-box !important;
        }

        .gallery:hover {
            transform: translateY(-5px) !important;
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.65) !important;
            border-color: var(--nh-accent) !important;
        }

        .gallery .cover {
            position: relative !important;
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
            overflow: hidden !important;
            isolation: isolate !important;
            padding: 0 !important;
            background: #08080a !important;
            text-decoration: none !important;
        }

        .gallery .cover img {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            aspect-ratio: 1 / 1.41 !important;
            object-fit: cover !important;
            transition: transform 0.3s ease !important;
        }

        /* Preserve the complete cover while using its own pixels to fill the
           portrait slot. This removes the empty bars without cropping the
           artwork on cards or on the gallery header. */
        .gallery .cover.nh-cover-backdrop,
        html.nh-mirror-xxx .gallery_item > a.nh-cover-backdrop {
            isolation: isolate !important;
        }

        .gallery .cover .nh-cover-media.nh-cover-media--backdrop,
        html.nh-mirror-xxx .gallery_item > a .nh-cover-media.nh-cover-media--backdrop {
            isolation: isolate !important;
        }

        .gallery .cover .nh-cover-media.nh-cover-media--backdrop::before,
        html.nh-mirror-xxx .gallery_item > a .nh-cover-media.nh-cover-media--backdrop::before {
            position: absolute !important;
            inset: -10% !important;
            z-index: 0 !important;
            content: "" !important;
            background-image: var(--nh-cover-image) !important;
            background-position: center !important;
            background-size: cover !important;
            filter: blur(22px) saturate(1.08) !important;
            opacity: 0.72 !important;
            transform: scale(1.08) !important;
        }

        .nh-cover-media {
            position: relative !important;
            z-index: 1 !important;
            display: block !important;
            flex: 0 0 auto !important;
            width: 100% !important;
            aspect-ratio: 1 / 1.41 !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: 100% !important;
            overflow: hidden !important;
            isolation: isolate !important;
            background: #08080a !important;
        }

        .gallery .cover.nh-cover-backdrop .nh-cover-media img,
        html.nh-mirror-xxx .gallery_item > a.nh-cover-backdrop .nh-cover-media img {
            position: relative !important;
            z-index: 1 !important;
            width: 100% !important;
            height: 100% !important;
            aspect-ratio: auto !important;
            object-fit: contain !important;
            background: rgba(8, 8, 10, 0.18) !important;
        }

        .gallery:hover .cover img {
            transform: scale(1.03) !important;
        }

        /* Card Title Below Cover (Restored and Visible) */
        .gallery .caption {
            position: static !important;
            top: auto !important;
            left: auto !important;
            width: 100% !important;
            max-height: none !important;
            box-sizing: border-box !important;
            padding: 8px 10px 4px 10px !important;
            font-size: 13px !important;
            line-height: 1.35 !important;
            font-weight: 600 !important;
            color: var(--nh-text-primary) !important;
            background: var(--nh-card) !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 5 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            text-align: left !important;
            text-decoration: none !important;
            word-break: break-word !important;
        }

        /* Language flags live on the cover, keeping titles clean and aligned. */
        .gallery.lang-gb .caption:before,
        .gallery.lang-en .caption:before,
        .gallery.lang-jp .caption:before,
        .gallery.lang-ja .caption:before,
        .gallery.lang-cn .caption:before,
        .gallery.lang-zh .caption:before {
            content: none !important;
            display: none !important;
        }

        .gallery .cover .nh-card-lang-flag {
            position: absolute !important;
            top: 8px !important;
            left: 8px !important;
            z-index: 2 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 24px !important;
            height: 20px !important;
            padding: 0 !important;
            border: 1px solid rgba(255, 255, 255, 0.28) !important;
            border-radius: 5px !important;
            background: rgba(8, 8, 10, 0.78) !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45) !important;
            font-size: 14px !important;
            line-height: 1 !important;
            pointer-events: none !important;
        }

        .gallery .cover .nh-card-pages {
            position: absolute !important;
            top: 8px !important;
            right: 8px !important;
            z-index: 2 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-width: 28px !important;
            height: 20px !important;
            box-sizing: border-box !important;
            padding: 0 6px !important;
            border: 1px solid rgba(255, 255, 255, 0.28) !important;
            border-radius: 5px !important;
            background: rgba(8, 8, 10, 0.78) !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45) !important;
            color: #fff !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            line-height: 1 !important;
            font-variant-numeric: tabular-nums !important;
            pointer-events: none !important;
        }

        /* Cards intentionally contain only the native title. Keep this guard
           for cards created by an older script instance during SPA navigation. */
        .nh-card-tags {
            display: none !important;
        }

        /* Card tags use the same pill structure and namespace colors as the
           site's native tagchip component. */
        .nh-card-tags .nh-card-tag {
            display: inline-flex !important;
            align-items: center !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            font-size: 11px !important;
            font-weight: 600 !important;
            line-height: 1.25 !important;
            text-decoration: none !important;
            max-width: 100% !important;
            min-width: 0 !important;
            white-space: normal !important;
            background: transparent !important;
            color: var(--nh-text-primary) !important;
            overflow: hidden !important;
            transition: filter 0.14s ease, transform 0.14s ease !important;
        }

        .nh-card-tags .nh-card-tag > .type,
        .nh-card-tags .nh-card-tag > .name,
        .nh-card-tags .nh-card-tag > .count {
            display: flex !important;
            align-items: center !important;
            min-width: 0 !important;
            padding: 2px 5px !important;
            line-height: 1.2 !important;
        }

        .nh-card-tags .nh-card-tag > .type {
            flex: 0 0 auto !important;
            color: #fff !important;
            font-size: 0.85em !important;
            font-weight: 600 !important;
            letter-spacing: 0.04em !important;
            text-transform: uppercase !important;
            background: var(--nh-surface-elevated) !important;
        }

        .nh-card-tags .nh-card-tag > .type-artist { background: #592673 !important; }
        .nh-card-tags .nh-card-tag > .type-character { background: #265973 !important; }
        .nh-card-tags .nh-card-tag > .type-parody { background: #20604a !important; }
        .nh-card-tags .nh-card-tag > .type-group { background: #735926 !important; }
        .nh-card-tags .nh-card-tag > .type-language { background: #364563 !important; }
        .nh-card-tags .nh-card-tag > .type-category { background: #862d2d !important; }

        .nh-card-tags .nh-card-tag > .name {
            flex: 0 1 auto !important;
            overflow: hidden !important;
            overflow-wrap: anywhere !important;
            text-overflow: ellipsis !important;
            background: #111116 !important;
            color: var(--nh-text-primary) !important;
        }

        .nh-card-tags .nh-card-tag > .count {
            flex: 0 0 auto !important;
            background: var(--nh-border) !important;
            color: var(--nh-text-primary) !important;
            font-size: 0.9em !important;
            font-variant-numeric: tabular-nums !important;
            font-weight: 400 !important;
        }

        .nh-card-tags .nh-card-tag:hover {
            filter: brightness(1.25) !important;
            transform: translateY(-1px) !important;
        }

        /* Non-English Filter Dim & Hide States */
        .gallery.nh-dimmed {
            opacity: 0.22 !important;
            filter: grayscale(60%) !important;
        }
        .gallery.nh-dimmed:hover {
            opacity: 0.95 !important;
            filter: none !important;
        }
        .gallery.nh-hidden {
            display: none !important;
        }

        /* Segmented Button Group */
        .nh-segmented {
            display: inline-flex;
            background: #0e0e14;
            padding: 3px;
            border-radius: var(--nh-radius-sm);
            border: 1px solid var(--nh-border);
        }

        .nh-seg-btn {
            background: transparent !important;
            color: var(--nh-text-secondary) !important;
            border: none !important;
            padding: 5px 12px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            transition: all 0.15s ease !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 6px !important;
            min-height: 28px !important;
            box-sizing: border-box !important;
            line-height: 1 !important;
            vertical-align: middle !important;
        }

        .nh-seg-btn svg {
            display: block !important;
            width: 16px !important;
            height: 16px !important;
            flex: 0 0 16px !important;
        }

        .nh-mt-mode .nh-seg-btn {
            min-height: 36px !important;
        }

        .nh-mt-mode .nh-seg-btn svg {
            width: 18px !important;
            height: 18px !important;
            flex-basis: 18px !important;
        }

        .nh-seg-btn > span {
            display: inline-flex !important;
            align-items: center !important;
            line-height: 1 !important;
        }

        .nh-seg-btn:hover {
            color: #fff !important;
        }

        .nh-seg-btn.active {
            background: var(--nh-grad) !important;
            color: #fff !important;
            box-shadow: 0 2px 8px rgba(237, 37, 83, 0.4) !important;
        }

        /* General Buttons */
        .nh-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 600;
            border-radius: var(--nh-radius-sm);
            border: 1px solid var(--nh-border);
            cursor: pointer;
            background: var(--nh-surface-elevated);
            color: var(--nh-text-primary);
            transition: all 0.16s ease;
            text-decoration: none;
        }

        .nh-btn:hover {
            border-color: var(--nh-accent);
            color: #fff;
        }

        .nh-btn-primary {
            background: var(--nh-grad);
            border-color: transparent;
            color: #fff;
            box-shadow: 0 4px 14px rgba(237, 37, 83, 0.35);
        }

        .nh-btn-primary:hover {
            background: linear-gradient(135deg, #d32049, #ff3b68);
            box-shadow: 0 6px 20px rgba(237, 37, 83, 0.5);
        }

        .nh-kbd {
            font-family: inherit;
            font-size: 10px;
            font-weight: 700;
            background: #242432;
            color: #9ea0b0;
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid #333346;
        }

        /* ===== Modern Post Header Hero Card (#bigcontainer) ===== */
        #bigcontainer {
            display: flex !important;
            flex-direction: row !important;
            align-items: flex-start !important;
            gap: 32px !important;
            background: var(--nh-surface) !important;
            border: 1px solid var(--nh-border) !important;
            border-radius: 16px !important;
            padding: 28px !important;
            margin: 20px auto 24px auto !important;
            box-shadow: 0 10px 36px rgba(0, 0, 0, 0.45) !important;
            box-sizing: border-box !important;
            width: 95vw !important;
            max-width: 1600px !important;
        }

        @media (max-width: 850px) {
            #bigcontainer {
                flex-direction: column !important;
                align-items: center !important;
                padding: 20px !important;
                gap: 20px !important;
            }
        }

        #bigcontainer #cover {
            flex: 0 0 320px !important;
            max-width: 320px !important;
            width: 100% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            position: relative !important;
            aspect-ratio: 1 / 1.41 !important;
            overflow: hidden !important;
            isolation: isolate !important;
            background: #08080a !important;
        }

        #bigcontainer #cover.nh-cover-backdrop::before,
        html.nh-mirror-xxx .gallery_top .cover.nh-cover-backdrop::before {
            position: absolute !important;
            inset: -10% !important;
            z-index: 0 !important;
            content: "" !important;
            background-image: var(--nh-cover-image) !important;
            background-position: center !important;
            background-size: cover !important;
            filter: blur(26px) saturate(1.08) !important;
            opacity: 0.76 !important;
            transform: scale(1.08) !important;
        }

        #bigcontainer #cover a {
            position: relative !important;
            z-index: 1 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            height: 100% !important;
            border-radius: 12px !important;
            overflow: hidden !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6) !important;
            border: 1px solid var(--nh-border) !important;
            transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease !important;
        }

        #bigcontainer #cover a:hover {
            transform: translateY(-3px) !important;
            box-shadow: 0 14px 32px rgba(0, 0, 0, 0.75) !important;
            border-color: var(--nh-accent) !important;
        }

        #bigcontainer #cover > a > .nh-cover-media,
        #bigcontainer #cover > .nh-cover-media {
            position: relative !important;
            z-index: 1 !important;
            display: block !important;
            width: 100% !important;
            height: 100% !important;
            aspect-ratio: auto !important;
        }

        #bigcontainer #cover img {
            position: relative !important;
            z-index: 1 !important;
            display: block !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: contain !important;
            background: rgba(8, 8, 10, 0.18) !important;
            border-radius: 11px !important;
        }

        #bigcontainer #info-block {
            flex: 1 1 0% !important;
            min-width: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 14px !important;
        }

        #bigcontainer #info {
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
        }

        #bigcontainer h1.title {
            font-size: 22px !important;
            font-weight: 700 !important;
            line-height: 1.35 !important;
            color: #fff !important;
            margin: 0 !important;
            word-break: break-word !important;
        }

        #bigcontainer h2.title {
            font-size: 15px !important;
            font-weight: 500 !important;
            color: var(--nh-text-secondary) !important;
            margin: 0 0 4px 0 !important;
            word-break: break-word !important;
        }

        #bigcontainer #gallery_id {
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            background: #0e0e14 !important;
            border: 1px solid var(--nh-border) !important;
            border-radius: 6px !important;
            padding: 3px 9px !important;
            font-size: 13px !important;
            font-weight: 700 !important;
            color: var(--nh-accent) !important;
            width: fit-content !important;
            margin: 0 !important;
        }

        #bigcontainer #tags {
            display: flex !important;
            flex-direction: column !important;
            gap: 10px !important;
            margin: 10px 0 !important;
            padding: 16px 0 !important;
            border-top: 1px solid var(--nh-border) !important;
            border-bottom: 1px solid var(--nh-border) !important;
        }

        #bigcontainer .tag-container {
            display: flex !important;
            align-items: flex-start !important;
            min-width: 0 !important;
            gap: 12px !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            color: var(--nh-text-muted) !important;
            line-height: 1.6 !important;
        }

        #bigcontainer .tag-container .tags {
            display: flex !important;
            flex-wrap: wrap !important;
            align-items: center !important;
            min-width: 0 !important;
            gap: 6px !important;
            flex: 1 1 0% !important;
        }

        /* Media-page tag chips intentionally keep the site's native variant
           and state colors. Do not style .tagchip or .tags a.tag here. */

        #bigcontainer .buttons {
            display: flex !important;
            align-items: center !important;
            flex-wrap: nowrap !important;
            gap: 6px !important;
            width: 100% !important;
            margin-top: 4px !important;
            padding: 6px !important;
            border: 1px solid var(--nh-border) !important;
            border-radius: 9px !important;
            background: rgba(14, 14, 20, 0.72) !important;
        }

        #bigcontainer .btn,
        #bigcontainer .nh-btn {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-width: 0 !important;
            min-height: 31px !important;
            gap: 5px !important;
            padding: 6px 10px !important;
            border-radius: var(--nh-radius-sm) !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            line-height: 1 !important;
            cursor: pointer !important;
            text-decoration: none !important;
            transition: all 0.16s ease !important;
        }

        #bigcontainer .buttons .btn i,
        #bigcontainer .buttons .btn svg {
            width: 14px !important;
            height: 14px !important;
            font-size: 13px !important;
            flex: 0 0 14px !important;
        }

        #bigcontainer .buttons .btn-disabled {
            opacity: 0.62 !important;
        }

        @media (max-width: 850px) {
            #bigcontainer .buttons {
                flex-wrap: wrap !important;
                justify-content: stretch !important;
            }

            #bigcontainer .buttons .btn,
            #bigcontainer .buttons .nh-btn {
                flex: 1 1 auto !important;
            }
        }

        /* ===== Fixed Normal-Flow Media Toolbar (#nh-media-toolbar) ===== */
        #nh-media-toolbar {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 95vw !important;
            max-width: 1600px !important;
            margin: 0 auto 24px auto !important;
            padding: 12px 20px !important;
            background: var(--nh-surface) !important;
            border: 1px solid var(--nh-border) !important;
            border-radius: var(--nh-radius) !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35) !important;
            box-sizing: border-box !important;
            gap: 16px !important;
        }

        #nh-media-toolbar .nh-mt-left,
        #nh-media-toolbar .nh-mt-right {
            display: flex !important;
            align-items: center !important;
            gap: 14px !important;
        }

        #nh-media-toolbar .nh-mt-control {
            display: inline-flex !important;
            align-items: center !important;
            gap: 8px !important;
        }

        #nh-media-toolbar .nh-mt-mode {
            flex-wrap: wrap !important;
        }

        #nh-media-toolbar .nh-mt-stat {
            font-size: 13px !important;
            font-weight: 600 !important;
            color: var(--nh-text-secondary) !important;
            background: #0e0e14 !important;
            border: 1px solid var(--nh-border) !important;
            border-radius: 6px !important;
            padding: 5px 12px !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
        }

        #nh-media-toolbar .nh-mt-lbl {
            font-size: 12px !important;
            font-weight: 600 !important;
            color: var(--nh-text-muted) !important;
        }

        #nh-media-toolbar .nh-mt-right.is-hidden {
            display: none !important;
        }

        @media (max-width: 768px) {
            #nh-media-toolbar {
                flex-direction: column !important;
                align-items: stretch !important;
                gap: 12px !important;
            }
            #nh-media-toolbar .nh-mt-left,
            #nh-media-toolbar .nh-mt-right {
                justify-content: space-between !important;
                flex-wrap: wrap !important;
                width: 100% !important;
            }

            #nh-media-toolbar .nh-mt-left {
                align-items: stretch !important;
                flex-direction: column !important;
            }

            #nh-media-toolbar .nh-mt-mode {
                display: flex !important;
                width: 100% !important;
                max-width: 100% !important;
            }

            #nh-media-toolbar .nh-mt-mode .nh-seg-btn {
                flex: 1 1 auto !important;
                min-width: 0 !important;
                padding: 5px 7px !important;
                gap: 4px !important;
                font-size: 11px !important;
            }

            #nh-media-toolbar .nh-mt-mode .nh-seg-btn svg {
                width: 16px !important;
                height: 16px !important;
                flex-basis: 16px !important;
            }

            #nh-media-toolbar .nh-mt-control {
                flex-wrap: wrap !important;
                justify-content: flex-start !important;
                max-width: 100% !important;
            }
        }

        #thumbnail-container {
            width: 95vw !important;
            max-width: 1600px !important;
            margin: 0 auto 40px auto !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* Continuous Reader Base */
        .nh-reader {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            margin: 0 0 60px 0;
        }

        .nh-reader-pages {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            width: 100%;
        }

        /* Zero-Layout Shift Page Slot */
        .nh-reader-page {
            position: relative;
            width: min(var(--nh-reader-width), 98vw);
            display: block;
            background: #111116;
            border: 1px solid var(--nh-border);
            border-radius: 8px;
            box-shadow: 0 6px 24px rgba(0,0,0,0.5);
            overflow: hidden;
        }

        .nh-reader-page::before {
            content: "";
            display: block;
            padding-top: 141.4%; /* Manga aspect ratio placeholder */
        }

        .nh-reader-page.is-done::before {
            display: none;
        }

        .nh-reader-page img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
            opacity: 0;
            transition: opacity 0.22s ease;
        }

        .nh-reader-page.is-done img {
            position: static;
            height: auto;
            opacity: 1;
            transform: scale(var(--nh-page-zoom, 1));
            transform-origin: center center;
            cursor: zoom-in;
        }

        .nh-reader-page.is-zoomed {
            overflow: auto;
        }

        .nh-reader-page.is-zoomed .nh-page-img {
            cursor: zoom-out;
        }

        /* Fit one page to the available viewport height. The explicit
           aspect-ratio keeps unloaded pages from collapsing before the image
           dimensions are known. */
        .nh-reader-fit-height .nh-reader-page {
            width: auto;
            height: min(calc(100vh - 140px), 1000px);
            height: min(calc(100dvh - 140px), 1000px);
            max-width: 98vw;
            aspect-ratio: 0.707 / 1;
        }

        .nh-reader-fit-height .nh-reader-page::before {
            display: none;
        }

        .nh-reader-fit-height .nh-reader-page img,
        .nh-reader-fit-height .nh-reader-page.is-done img {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        /* Manhwa mode turns the individual pages into one uninterrupted
           vertical strip while retaining lazy loading per image. */
        .nh-reader.nh-reader-manhwa {
            align-items: stretch;
        }

        .nh-reader-manhwa .nh-reader-pages {
            width: min(var(--nh-reader-width), 98vw);
            margin: 0 auto;
            gap: 0;
            align-items: stretch;
        }

        .nh-reader-manhwa .nh-reader-page {
            width: 100%;
            border: 0;
            border-radius: 0;
            box-shadow: none;
            background: transparent;
        }

        .nh-reader-manhwa .nh-reader-page .nh-page-badge {
            display: none;
        }

        .nh-reader-manhwa.nh-reader-fit-height .nh-reader-pages {
            width: 100%;
        }

        .nh-reader-manhwa.nh-reader-fit-height .nh-reader-page {
            width: auto;
            height: min(calc(100vh - 140px), 1000px);
            height: min(calc(100dvh - 140px), 1000px);
            margin-right: auto;
            margin-left: auto;
            aspect-ratio: 0.707 / 1;
        }

        /* Fullscreen mode uses a viewport-sized page rail. Vertical mode
           scrolls one slide at a time; horizontal mode pages through a
           side-scrolling rail. */
        body.nh-reader-fullscreen-active {
            overflow: hidden !important;
        }

        body.nh-reader-fullscreen-active #nh-media-toolbar,
        body.nh-reader-fullscreen-active nav,
        body.nh-reader-fullscreen-active #nh-mobile-topbar,
        body.nh-reader-fullscreen-active #nh-bottom-nav,
        body.nh-reader-fullscreen-active #nh-reader-floating-pill {
            display: none !important;
        }

        .nh-reader.nh-reader-fullscreen {
            position: fixed;
            inset: 0;
            z-index: 10000;
            width: 100vw;
            height: 100vh;
            height: 100dvh;
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            background: #000;
            overflow: hidden;
        }

        .nh-reader-fullscreen .nh-reader-pages {
            width: 100%;
            height: 100%;
            gap: 0;
            align-items: stretch;
            overflow-x: hidden;
            overflow-y: auto;
            scroll-snap-type: y mandatory;
        }

        .nh-reader-fullscreen.nh-reader-orientation-horizontal .nh-reader-pages {
            flex-direction: row;
            overflow-x: auto;
            overflow-y: hidden;
            scroll-snap-type: x mandatory;
        }

        .nh-reader-fullscreen.nh-reader-reversed .nh-reader-pages {
            direction: rtl;
        }

        .nh-reader-fullscreen.nh-reader-reversed .nh-reader-page,
        .nh-reader-fullscreen.nh-reader-reversed .nh-reader-slide {
            direction: ltr;
        }

        .nh-reader-fullscreen.nh-reader-reversed.nh-reader-orientation-vertical .nh-reader-pages {
            flex-direction: column-reverse;
        }

        .nh-reader-fullscreen .nh-reader-page {
            flex: 0 0 100%;
            width: 100%;
            height: 100%;
            max-width: none;
            background: #000;
            border: 0;
            border-radius: 0;
            box-shadow: none;
            scroll-snap-align: start;
            overflow: auto;
        }

        .nh-reader-fullscreen .nh-reader-page::before {
            display: none;
        }

        .nh-reader-fullscreen .nh-reader-page img,
        .nh-reader-fullscreen .nh-reader-page.is-done img {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            transform: scale(var(--nh-page-zoom, var(--nh-fullscreen-zoom, 1)));
            transform-origin: center center;
            cursor: zoom-in;
        }

        .nh-reader-fullscreen .nh-reader-page.is-zoomed .nh-page-img {
            cursor: zoom-out;
        }

        .nh-reader-slide {
            display: flex;
            flex: 0 0 100%;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            overflow: hidden;
            scroll-snap-align: start;
        }

        .nh-reader-fullscreen.nh-reader-spread .nh-reader-page {
            flex: 1 1 50%;
            width: 50%;
            min-width: 0;
            scroll-snap-align: none;
            margin: 0;
            border-radius: 0;
        }

        .nh-reader-fullscreen.nh-reader-spread .nh-reader-slide {
            flex-direction: row;
            gap: 0;
        }

        .nh-reader-fullscreen.nh-reader-reversed.nh-reader-spread .nh-reader-slide {
            flex-direction: row-reverse;
        }

        .nh-reader-fullscreen.nh-reader-spread .nh-reader-slide .nh-reader-page:only-child {
            flex-basis: 100%;
            width: 100%;
        }

        /* Manhwa is intentionally the continuous exception inside the
           fullscreen reader: pages touch with no slide boundaries. */
        .nh-reader-fullscreen.nh-reader-manhwa .nh-reader-pages {
            flex-direction: column;
            align-items: center;
            width: min(86vw, 900px);
            max-width: 100%;
            margin: 0 auto;
            overflow-x: hidden;
            overflow-y: auto;
            scroll-snap-type: none;
            direction: ltr;
        }

        .nh-reader-fullscreen.nh-reader-manhwa .nh-reader-page {
            flex: 0 0 auto;
            width: 100%;
            height: auto;
            min-height: 0;
            overflow: hidden;
            scroll-snap-align: none;
        }

        .nh-reader-fullscreen.nh-reader-manhwa .nh-reader-page::before {
            display: block;
        }

        .nh-reader-fullscreen.nh-reader-manhwa .nh-reader-page.is-done::before {
            display: none;
        }

        .nh-reader-fullscreen.nh-reader-manhwa .nh-reader-page.is-done .nh-page-img {
            position: static;
            width: 100%;
            height: auto;
            transform: scale(var(--nh-page-zoom, var(--nh-fullscreen-zoom, 1)));
            transform-origin: top center;
        }

        .nh-reader-fullscreen.nh-reader-manhwa .nh-reader-page.is-zoomed {
            overflow: auto;
        }

        /* Fullscreen navigation stays available independently of the settings
           button so page changes remain easy with a mouse or touch. */
        #nh-fullscreen-navigation {
            position: fixed;
            inset: 0;
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 18px;
            pointer-events: none;
        }

        #nh-fullscreen-navigation[hidden] {
            display: none !important;
        }

        #nh-fullscreen-navigation.is-vertical {
            inset: auto 18px auto auto;
            top: 50%;
            flex-direction: column;
            gap: 8px;
            padding: 0;
            transform: translateY(-50%);
        }

        .nh-fs-nav-btn {
            width: 48px;
            height: 76px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            background: rgba(18, 18, 24, 0.58);
            color: rgba(255, 255, 255, 0.82);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            cursor: pointer;
            pointer-events: auto;
            transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
        }

        .nh-fs-nav-btn:hover,
        .nh-fs-nav-btn:focus-visible {
            border-color: var(--nh-accent);
            background: rgba(237, 37, 83, 0.78);
            color: #fff;
            outline: none;
        }

        .nh-fs-nav-btn svg {
            width: 26px;
            height: 26px;
        }

        /* Floating fullscreen settings */
        #nh-fullscreen-controls {
            position: fixed;
            right: 20px;
            bottom: 20px;
            z-index: 10002;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 8px;
        }

        #nh-fullscreen-controls[hidden] {
            display: none !important;
        }

        .nh-fs-control-toggle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            padding: 0;
            border: 1px solid var(--nh-border-light);
            border-radius: 50%;
            background: rgba(18, 18, 24, 0.92);
            color: var(--nh-text-secondary);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.65);
            cursor: pointer;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }

        .nh-fs-control-toggle:hover,
        .nh-fs-control-toggle[aria-expanded="true"] {
            border-color: var(--nh-accent);
            color: #fff;
        }

        .nh-fs-control-toggle svg {
            width: 20px;
            height: 20px;
        }

        .nh-fullscreen-menu {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
            min-width: 250px;
            max-width: min(92vw, 330px);
            padding: 12px;
            border: 1px solid var(--nh-border-light);
            border-radius: var(--nh-radius);
            background: rgba(20, 20, 26, 0.96);
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
        }

        .nh-fullscreen-menu[hidden] {
            display: none !important;
        }

        .nh-fs-control-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .nh-fs-control-label {
            color: var(--nh-text-muted);
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .nh-fullscreen-menu .nh-segmented {
            display: flex;
            width: 100%;
        }

        .nh-fullscreen-menu .nh-seg-btn {
            flex: 1 1 auto;
            min-width: 0;
            padding: 6px 8px !important;
            font-size: 11px !important;
        }

        .nh-fullscreen-menu .nh-seg-btn svg {
            width: 15px;
            height: 15px;
            flex: 0 0 15px;
        }

        .nh-fullscreen-menu .nh-fs-toggle,
        .nh-fullscreen-menu .nh-fs-action {
            width: 100%;
            justify-content: flex-start;
            border: 1px solid var(--nh-border) !important;
            background: rgba(14, 14, 20, 0.8) !important;
        }

        .nh-fullscreen-menu .nh-fs-toggle.active {
            background: var(--nh-grad) !important;
            color: #fff !important;
        }

        .nh-fullscreen-menu .nh-seg-btn:disabled {
            cursor: not-allowed !important;
            opacity: 0.4 !important;
        }

        .nh-page-badge {
            position: absolute;
            top: 8px;
            left: 8px;
            background: rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(4px);
            color: #fff;
            font-size: 11px;
            font-weight: 700;
            font-family: monospace;
            padding: 2px 7px;
            border-radius: 4px;
            pointer-events: none;
            z-index: 2;
            line-height: 1.4;
            opacity: 0.8;
        }

        .nh-reader-page.is-done .nh-page-badge {
            opacity: 0.5;
        }

        /* Floating Navigation Pill */
        .nh-floating-pill {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 9999;
            display: none;
            align-items: center;
            gap: 0;
            padding: 6px;
            background: rgba(18, 18, 24, 0.92);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid var(--nh-border);
            border-radius: 999px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.7);
            animation: nhSlideUp 0.25s ease;
        }

        @keyframes nhSlideUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .nh-pill-btn {
            width: 36px;
            height: 36px;
            background: transparent;
            border: none;
            color: var(--nh-text-secondary);
            cursor: pointer;
            padding: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: color 0.15s;
        }

        .nh-pill-btn svg {
            width: 20px;
            height: 20px;
        }

        .nh-pill-btn:hover {
            color: #fff;
        }

        /* Infinite Scroll Sentinel & Status */
        #nh-scroll-sentinel {
            display: block !important;
            width: 100% !important;
            height: 24px !important;
            min-height: 24px !important;
            margin: 12px 0 !important;
            clear: both !important;
        }

        /* Skeleton Loading Placeholders */
        .nh-skeleton-card {
            pointer-events: none !important;
            cursor: default !important;
            user-select: none !important;
            border-color: rgba(255, 255, 255, 0.06) !important;
            background: var(--nh-card, #111116) !important;
            animation: nhSkelPulse 1.8s ease-in-out infinite !important;
        }

        .nh-skeleton-cover {
            position: relative !important;
            width: 100% !important;
            aspect-ratio: 1 / 1.41 !important;
            background: rgba(255, 255, 255, 0.04) !important;
            overflow: hidden !important;
        }

        .nh-skeleton-media {
            width: 100% !important;
            height: 100% !important;
            position: relative !important;
            overflow: hidden !important;
        }

        .nh-skeleton-media::after,
        .nh-skeleton-line::after {
            content: "" !important;
            position: absolute !important;
            inset: 0 !important;
            transform: translateX(-100%) !important;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.075), transparent) !important;
            animation: nhSkelShimmer 1.4s ease-in-out infinite !important;
        }

        .nh-skeleton-caption {
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
            padding: 12px 10px 14px 10px !important;
            min-height: 52px !important;
        }

        .nh-skeleton-line {
            position: relative !important;
            overflow: hidden !important;
            border-radius: 4px !important;
            background: rgba(255, 255, 255, 0.05) !important;
            height: 12px !important;
        }

        .nh-skeleton-line-title {
            width: 85% !important;
        }

        .nh-skeleton-line-sub {
            width: 55% !important;
            height: 10px !important;
            opacity: 0.7 !important;
        }

        @keyframes nhSkelShimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }

        @keyframes nhSkelPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.72; }
        }

        .nh-card-in {
            animation: nhCardFadeIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        @keyframes nhCardFadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Polished Scroll Status Pill */
        .nh-scroll-status {
            display: none;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 14px 24px;
            margin: 20px auto;
            max-width: 360px;
            border-radius: 9999px;
            background: rgba(20, 20, 25, 0.85);
            border: 1px solid var(--nh-border, rgba(255, 255, 255, 0.08));
            color: var(--nh-text-secondary, #a0a0a5);
            font-size: 13.5px;
            font-weight: 500;
            letter-spacing: 0.2px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            cursor: pointer;
            transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .nh-scroll-status:hover {
            transform: translateY(-2px);
            border-color: var(--nh-accent, #ed2553);
        }

        .nh-scroll-status.is-loading,
        .nh-scroll-status.is-error,
        .nh-scroll-status.is-done {
            display: flex;
        }

        .nh-spinner {
            display: none;
            width: 20px;
            height: 20px;
            border: 2.5px solid var(--nh-border);
            border-top-color: var(--nh-accent);
            border-radius: 50%;
            animation: nhSpin 0.7s linear infinite;
        }

        .nh-scroll-status.is-loading .nh-spinner {
            display: inline-block;
        }

        .nh-scroll-status.is-error {
            color: var(--nh-accent);
        }

        @keyframes nhSpin {
            to { transform: rotate(360deg); }
        }

        /* ===== Command Palette (Search Modal) ===== */
        .nh-search-overlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 8vh 16px;
            background: rgba(0, 0, 0, 0.72);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }

        .nh-search-overlay[hidden] {
            display: none !important;
        }

        .nh-search-box {
            position: relative;
            display: flex;
            flex-direction: column;
            width: min(780px, 95vw);
            max-height: 82vh;
            background: var(--nh-surface);
            border: 1px solid var(--nh-border-light);
            border-radius: var(--nh-radius);
            box-shadow: 0 24px 70px rgba(0, 0, 0, 0.85);
            overflow: hidden;
            animation: nhPopIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes nhPopIn {
            from { opacity: 0; transform: scale(0.97) translateY(-10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .nh-sb-head {
            padding: 14px 16px;
            border-bottom: 1px solid var(--nh-border);
        }

        .nh-sb-field-wrap {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 14px;
            background: #0a0a0e;
            border: 1px solid var(--nh-border);
            border-radius: var(--nh-radius-sm);
            transition: border-color 0.14s ease, box-shadow 0.14s ease;
        }

        .nh-sb-field-wrap:focus-within {
            border-color: var(--nh-accent);
            box-shadow: 0 0 0 3px rgba(237, 37, 83, 0.2);
        }

        .nh-sb-field-wrap svg {
            color: var(--nh-text-muted);
            flex-shrink: 0;
        }

        .nh-sb-input {
            flex: 1;
            background: transparent !important;
            border: none !important;
            outline: none !important;
            color: var(--nh-text-primary) !important;
            font-size: 15px !important;
            padding: 0 !important;
        }

        .nh-sb-clear {
            background: transparent;
            border: none;
            color: var(--nh-text-muted);
            cursor: pointer;
            padding: 2px;
            display: none;
        }

        .nh-sb-clear:hover {
            color: #fff;
        }

        .nh-sb-quick-bar {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 10px 16px;
            background: #0f0f15;
            border-bottom: 1px solid var(--nh-border);
        }

        .nh-sb-quick-group {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 6px;
        }

        .nh-quick-lbl {
            font-size: 11px;
            font-weight: 700;
            color: var(--nh-text-muted);
            margin-right: 4px;
        }

        .nh-quick-chip {
            background: var(--nh-surface);
            color: var(--nh-text-secondary);
            border: 1px solid var(--nh-border);
            border-radius: 999px;
            padding: 3px 10px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.14s ease;
        }

        .nh-quick-chip:hover {
            color: #fff;
            border-color: var(--nh-accent);
        }

        .nh-quick-chip.active {
            background: var(--nh-grad);
            border-color: transparent;
            color: #fff;
        }

        .nh-sb-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            padding: 10px 16px;
            border-bottom: 1px solid var(--nh-border);
            background: #111118;
        }

        .nh-sb-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
            color: color-mix(in srgb, var(--tc, #9ea0b0) 85%, #fff);
            background: color-mix(in srgb, var(--tc, #9ea0b0) 18%, #161620);
            border: 1px solid color-mix(in srgb, var(--tc, #9ea0b0) 45%, #2a2a38);
        }

        .nh-chip-del {
            background: transparent;
            border: none;
            color: inherit;
            cursor: pointer;
            padding: 0;
            display: inline-flex;
            opacity: 0.7;
        }
        .nh-chip-del:hover {
            opacity: 1;
        }

        .nh-sb-body {
            flex: 1;
            overflow-y: auto;
            max-height: 48vh;
            padding: 8px 12px;
        }

        .nh-sb-harvested {
            padding: 10px 14px;
            border-bottom: 1px solid var(--nh-border);
            background: #0d0d12;
            border-radius: var(--nh-radius-sm);
            margin-bottom: 8px;
        }

        .nh-harvested-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--nh-text-muted);
            margin-bottom: 8px;
        }

        .nh-harvested-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            max-height: 120px;
            overflow-y: auto;
        }

        .nh-harvested-chip {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 550;
            color: var(--nh-text-secondary);
            background: var(--nh-surface);
            border: 1px solid var(--nh-border);
            cursor: pointer;
            transition: all 0.12s ease;
            user-select: none;
        }

        .nh-harvested-chip:hover {
            border-color: var(--nh-border-light);
            color: #fff;
            background: var(--nh-surface-elevated);
        }

        .nh-harvested-chip.is-included {
            background: rgba(34, 197, 94, 0.18) !important;
            border-color: rgba(34, 197, 94, 0.5) !important;
            color: #4ade80 !important;
            font-weight: 650;
        }

        .nh-harvested-chip.is-excluded {
            background: rgba(239, 68, 68, 0.18) !important;
            border-color: rgba(239, 68, 68, 0.5) !important;
            color: #f87171 !important;
            font-weight: 650;
        }

        .nh-tag-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            border-radius: var(--nh-radius-sm);
            cursor: pointer;
            transition: background 0.12s;
        }

        .nh-tag-row:hover, .nh-tag-row.is-focused {
            background: var(--nh-surface-elevated);
        }

        .nh-tr-name {
            font-size: 14px;
            font-weight: 500;
            color: color-mix(in srgb, var(--tc, #9ea0b0) 80%, #fff);
        }

        .nh-tr-actions {
            display: inline-flex;
            gap: 4px;
        }

        .nh-tr-btn {
            background: #20202c;
            border: 1px solid var(--nh-border);
            color: var(--nh-text-secondary);
            border-radius: 6px;
            width: 26px;
            height: 26px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.14s;
        }

        .nh-tr-inc:hover {
            background: rgba(6, 214, 160, 0.2);
            color: #06d6a0;
            border-color: #06d6a0;
        }

        .nh-tr-exc:hover {
            background: rgba(237, 37, 83, 0.2);
            color: var(--nh-accent);
            border-color: var(--nh-accent);
        }

        .nh-recents-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 6px;
            font-size: 12px;
            font-weight: 700;
            color: var(--nh-text-muted);
        }

        .nh-recents-clear {
            background: transparent;
            border: none;
            color: var(--nh-text-muted);
            cursor: pointer;
            font-size: 11px;
        }

        .nh-recents-clear:hover {
            color: var(--nh-accent);
        }

        .nh-recents-list {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .nh-recent-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px;
            background: transparent;
            border: none;
            border-radius: var(--nh-radius-sm);
            color: var(--nh-text-primary);
            cursor: pointer;
            text-align: left;
            width: 100%;
            transition: background 0.12s;
        }

        .nh-recent-item:hover {
            background: var(--nh-surface-elevated);
        }

        .nh-recent-q {
            flex: 1;
            font-size: 13px;
            font-weight: 500;
        }

        .nh-recent-arrow {
            color: var(--nh-text-muted);
        }

        .nh-recents-empty, .nh-sb-empty {
            padding: 24px;
            text-align: center;
            color: var(--nh-text-muted);
            font-size: 13px;
        }

        .nh-sb-foot {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            border-top: 1px solid var(--nh-border);
            background: #0f0f15;
        }

        .nh-sb-hints {
            display: flex;
            gap: 14px;
            font-size: 11px;
            color: var(--nh-text-muted);
        }

        .nh-sb-hints span {
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }

        /* The mobile palette is a bottom sheet: it is wider, taller and keeps
           the primary action close to the user's thumb. */
        @media (max-width: 768px) {
            .sort:not(:has(#tag-container)) {
                margin: 8px auto 12px !important;
                padding: 0 10px !important;
            }
            .nh-sort-inner {
                gap: 8px;
                padding: 5px 6px;
            }
            .nh-sort-item {
                height: 30px;
                padding: 0 10px;
                font-size: 12px;
            }
            .nh-sort-filter-btn {
                height: 30px;
                padding: 0 10px;
                font-size: 12px;
                gap: 5px;
            }

            .nh-search-overlay {
                align-items: flex-end !important;
                justify-content: stretch !important;
                padding: 0 !important;
            }

            .nh-search-box {
                width: 100vw !important;
                max-width: none !important;
                max-height: 96vh !important;
                max-height: 96dvh !important;
                border-radius: 18px 18px 0 0 !important;
                border-bottom: 0 !important;
                animation: nhSheetIn 0.2s ease-out !important;
            }

            @keyframes nhSheetIn {
                from { opacity: 0; transform: translateY(18px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .nh-sb-head {
                padding: 14px 12px !important;
            }

            .nh-sb-field-wrap {
                min-height: 72px !important;
                padding: 16px 17px !important;
                border-radius: 12px !important;
            }

            .nh-sb-field-wrap svg {
                width: 22px !important;
                height: 22px !important;
            }

            .nh-sb-input {
                min-width: 0 !important;
                font-size: 19px !important;
            }

            .nh-sb-quick-bar {
                padding: 12px !important;
            }

            .nh-sb-body {
                max-height: 58vh !important;
            }

            .nh-sb-foot {
                padding: 12px !important;
                padding-bottom: calc(12px + env(safe-area-inset-bottom)) !important;
            }

            .nh-sb-hints {
                display: none !important;
            }

            .nh-sb-go {
                min-height: 64px !important;
                flex: 1 1 auto !important;
                font-size: 15px !important;
            }

            .pagination.desktop-pagination {
                display: none !important;
            }

            .pagination.mobile-pagination {
                display: flex !important;
                margin: 16px auto 28px !important;
            }

            #tag-container {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                gap: 8px !important;
                padding: 10px !important;
            }

            #tag-container .tagchip.variant-pill {
                min-height: 40px !important;
                padding: 7px 8px !important;
            }

            #tag-container .tagchip.variant-pill .name {
                font-size: 12px !important;
            }

            #tag-container .tagchip.variant-pill .count {
                padding: 2px 5px !important;
                font-size: 10px !important;
            }

            #tag-container:has(> section) > section {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .nh-floating-pill,
            .nh-mt-mode,
            .nh-mt-right {
                display: none !important;
            }

            #content:has(#nh-reader),
            .container:has(#nh-reader) {
                padding-left: 0 !important;
                padding-right: 0 !important;
            }

            #nh-media-toolbar .nh-mt-width-control,
            #nh-media-toolbar .nh-mt-width {
                display: none !important;
            }

            #nh-reader:not(.nh-reader-fullscreen) {
                width: 100vw !important;
                max-width: none !important;
                margin-left: calc(50% - 50vw) !important;
                margin-right: calc(50% - 50vw) !important;
            }

            #nh-reader:not(.nh-reader-fullscreen) .nh-reader-pages {
                width: 100vw !important;
                max-width: none !important;
            }

            #nh-reader:not(.nh-reader-fullscreen) .nh-reader-page {
                width: 100% !important;
                max-width: none !important;
                border-right: 0 !important;
                border-left: 0 !important;
                border-radius: 0 !important;
            }

            #nh-reader:not(.nh-reader-fullscreen).nh-reader-fit-height .nh-reader-page {
                width: 100% !important;
                height: auto !important;
                max-width: none !important;
                aspect-ratio: auto !important;
            }

            #nh-reader:not(.nh-reader-fullscreen).nh-reader-fit-height .nh-reader-page img,
            #nh-reader:not(.nh-reader-fullscreen).nh-reader-fit-height .nh-reader-page.is-done img {
                position: static !important;
                width: 100% !important;
                height: auto !important;
                object-fit: contain !important;
            }

            #nh-reader:not(.nh-reader-fullscreen).nh-reader-manhwa .nh-reader-pages {
                width: 100vw !important;
                max-width: none !important;
            }

            body.nh-reader-fullscreen-active #nh-fullscreen-controls {
                right: 12px !important;
                bottom: calc(12px + env(safe-area-inset-bottom)) !important;
            }

            body.nh-reader-fullscreen-active #nh-fullscreen-navigation {
                display: none !important;
                padding-left: 8px !important;
                padding-right: 8px !important;
            }

            body.nh-reader-fullscreen-active #nh-fullscreen-navigation.is-vertical {
                right: 8px !important;
                padding: 0 !important;
                gap: 6px !important;
            }

            .nh-fs-nav-btn {
                width: 40px !important;
                height: 58px !important;
                border-radius: 10px !important;
            }

            .nh-fs-nav-btn svg {
                width: 22px !important;
                height: 22px !important;
            }

            body.nh-reader-fullscreen-active .nh-fullscreen-menu {
                min-width: min(250px, calc(100vw - 24px)) !important;
            }
        }

        /* ===== Mobile: 2 columns grid ===== */
        @media (max-width: 768px) {
            .index-container,
            .gallery-grid {
                display: grid !important;
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                gap: 10px !important;
                padding: 10px 0 20px 0 !important;
                min-width: 0 !important;
            }

            .index-container > .gallery,
            .gallery-grid > .gallery {
                min-width: 0 !important;
            }

            .gallery .cover,
            html.nh-mirror-xxx .gallery_item > a {
                display: flex !important;
                flex-direction: column !important;
                width: 100% !important;
                height: auto !important;
                min-height: 0 !important;
                aspect-ratio: auto !important;
                padding: 0 !important;
            }

            .gallery .nh-cover-media,
            html.nh-mirror-xxx .gallery_item > a .nh-cover-media {
                flex: 0 0 auto !important;
                width: 100% !important;
                aspect-ratio: 1 / 1.41 !important;
                height: auto !important;
                min-height: 0 !important;
                max-height: 100% !important;
                overflow: hidden !important;
                isolation: isolate !important;
            }
            .gallery .cover .nh-cover-media.nh-cover-media--backdrop::before,
            .gallery .cover.nh-cover-backdrop::before,
            html.nh-mirror-xxx .gallery_item > a .nh-cover-media.nh-cover-media--backdrop::before {
                max-height: 120% !important;
            }

            .gallery .caption {
                font-size: 11px !important;
                -webkit-line-clamp: 5 !important;
                padding: 6px 8px 3px 8px !important;
            }

            .gallery .cover .nh-card-lang-flag {
                top: 6px !important;
                left: 6px !important;
                width: 22px !important;
                height: 18px !important;
                font-size: 12px !important;
            }

            .gallery .cover .nh-card-pages {
                top: 6px !important;
                right: 6px !important;
                min-width: 24px !important;
                height: 18px !important;
                padding: 0 5px !important;
                font-size: 10px !important;
            }

            html.nh-mirror-xxx .galleries_box {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                gap: 10px !important;
            }

            html.nh-mirror-xxx .gallery_item .caption {
                padding: 6px 8px 5px !important;
                font-size: 11px !important;
                line-height: 1.3 !important;
            }

            html.nh-mirror-xxx .gallery_top {
                flex-direction: column !important;
                gap: 16px !important;
                padding-top: 12px !important;
            }

            html.nh-mirror-xxx .gallery_top .cover {
                flex-basis: auto !important;
                width: min(260px, 70vw) !important;
                margin: 0 auto !important;
            }

            html.nh-mirror-xxx #thumbs_append {
                grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            }

            .nh-card-tags {
                padding: 3px 8px 8px 8px !important;
                gap: 4px !important;
            }

            .nh-card-tag {
                font-size: 10px !important;
                padding: 1px 5px !important;
            }
        }

        /* ===== Related Galleries (More Like This) Grid ===== */
        #related-container,
        #related-container > .container,
        #related-container > .index-container {
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)) !important;
            gap: 14px !important;
            width: 95vw !important;
            max-width: 1600px !important;
            margin: 0 auto 48px auto !important;
            box-sizing: border-box !important;
            padding: 0 !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        #related-container h2 {
            grid-column: 1 / -1 !important;
            font-size: 18px !important;
            font-weight: 700 !important;
            color: var(--nh-text-primary) !important;
            margin: 0 0 16px 0 !important;
            padding-bottom: 8px !important;
            border-bottom: 1px solid var(--nh-border) !important;
        }

        #related-container .gallery {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
        }

        @media (max-width: 768px) {
            #related-container,
            #related-container > .container,
            #related-container > .index-container {
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 10px !important;
            }
        }

        /* ===== Mobile Bottom Navbar ===== */
        #nh-mobile-topbar {
            display: none;
            transition: transform 0.22s ease !important;
        }

        #nh-bottom-nav {
            display: none;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 10000;
            height: 58px;
            background: rgba(10, 10, 14, 0.97);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            border-top: 1px solid var(--nh-border);
            align-items: stretch;
            justify-content: space-around;
            transition: transform 0.22s ease;
        }

        @media (max-width: 768px) {
            nav {
                display: none !important;
            }

            #nh-mobile-topbar {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                z-index: 10001 !important;
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                width: 100% !important;
                min-height: 56px !important;
                height: auto !important;
                box-sizing: border-box !important;
                padding: max(5px, env(safe-area-inset-top)) 10px 5px !important;
                background: rgba(12, 12, 16, 0.96) !important;
                border-bottom: 1px solid var(--nh-border) !important;
            }

            #nh-mobile-topbar .nh-menu-toggle {
                width: 40px !important;
                height: 40px !important;
                flex-basis: 40px !important;
            }

            #nh-mobile-topbar .nh-mobile-logo {
                display: flex !important;
                align-items: center !important;
                flex: 0 0 auto !important;
                min-width: 0 !important;
                min-height: 40px !important;
                margin: 0 !important;
                color: var(--nh-text-primary) !important;
                font-size: 18px !important;
                font-weight: 800 !important;
                line-height: 1 !important;
                text-decoration: none !important;
            }

            #nh-mobile-topbar .nh-mobile-logo img {
                display: block !important;
                width: auto !important;
                max-width: 150px !important;
                max-height: 34px !important;
            }

            #nh-mobile-topbar .nh-mobile-lang-slot {
                display: flex !important;
                align-items: center !important;
                justify-content: flex-end !important;
                min-width: 0 !important;
                margin-left: auto !important;
                overflow: hidden !important;
            }

            #nh-mobile-topbar .nh-mobile-lang {
                display: inline-flex !important;
                flex: 0 1 auto !important;
                min-width: 0 !important;
                max-width: 100% !important;
                padding: 2px !important;
                gap: 0 !important;
                border-radius: 9px !important;
            }

            #nh-mobile-topbar .nh-mobile-lang .nh-seg-btn {
                min-width: 0 !important;
                min-height: 30px !important;
                padding: 5px 7px !important;
                font-size: 10px !important;
                white-space: nowrap !important;
            }

            body.nh-mobile-chrome-hidden #nh-mobile-topbar {
                transform: translateY(-110%) !important;
            }

            body {
                padding-top: calc(56px + env(safe-area-inset-top)) !important;
                padding-bottom: calc(68px + env(safe-area-inset-bottom)) !important;
            }

            #nh-bottom-nav {
                display: flex !important;
                height: calc(60px + env(safe-area-inset-bottom)) !important;
                padding-bottom: env(safe-area-inset-bottom) !important;
            }

            body.nh-mobile-chrome-hidden #nh-bottom-nav {
                transform: translateY(110%) !important;
            }

            .nh-bnav-item {
                min-width: 0 !important;
                padding: 6px 2px !important;
            }

            .nh-bnav-item svg {
                width: 21px !important;
                height: 21px !important;
            }
        }

        @media (max-width: 768px) {
            .nh-nav-drawer-panel {
                top: 0 !important;
                left: 0 !important;
                width: min(340px, 88vw) !important;
                height: 100% !important;
                max-height: none !important;
                box-sizing: border-box !important;
                border-radius: 0 var(--nh-radius) var(--nh-radius) 0 !important;
                padding-top: max(8px, env(safe-area-inset-top)) !important;
            }
        }

        body.nh-menu-open {
            overflow: hidden !important;
        }

        .nh-bnav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            flex: 1;
            background: transparent;
            border: none;
            color: var(--nh-text-muted);
            font-size: 10px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            padding: 6px 0;
            transition: color 0.15s ease;
            -webkit-tap-highlight-color: transparent;
        }

        .nh-bnav-item:hover,
        .nh-bnav-item.active {
            color: var(--nh-accent);
        }

        .nh-bnav-item svg {
            width: 22px;
            height: 22px;
            flex-shrink: 0;
        }

        .nh-bnav-item span {
            line-height: 1;
        }
        `;

        addStyle(css);
    }

    // ===================================================================== //
    //  SPA Route Watcher & Mutation Observer                                //
    // ===================================================================== //
    let lastUrl = location.href;

    function handleRouteChange() {
        const currentUrl = location.href;
        if (currentUrl === lastUrl && document.querySelector("#nh-topbar-center")) return;
        lastUrl = currentUrl;

        listingGeneration += 1;
        infiniteScrollActive = false;
        nextPageUrl = null;
        isFetchingPage = false;
        if (infiniteScrollObserver) infiniteScrollObserver.disconnect();
        infiniteScrollObserver = null;
        infiniteScrollSentinel?.remove();
        infiniteScrollSentinel = null;
        hideSkeletonCards();
        const oldStatus = document.querySelector("#nh-scroll-status");
        if (oldStatus) oldStatus.remove();

        const oldToolbar = document.querySelector("#nh-media-toolbar");
        if (oldToolbar) oldToolbar.remove();
        const oldReader = document.querySelector("#nh-reader");
        if (oldReader) oldReader.remove();

        harvestedTags.clear();
        const oldSort = document.querySelector(".sort");
        if (oldSort) delete oldSort.dataset.nhEnhanced;

        // Re-inject bottom nav to update active state
        const oldBottomNav = document.querySelector("#nh-bottom-nav");
        if (oldBottomNav) oldBottomNav.remove();

        runEnhancements();
    }

    function hookHistoryEvents() {
        if (window.__nhHistoryHooked) return;
        window.__nhHistoryHooked = true;

        const origPush = history.pushState;
        history.pushState = function (...args) {
            const res = origPush.apply(this, args);
            window.dispatchEvent(new Event("nh_route_change"));
            return res;
        };

        const origReplace = history.replaceState;
        history.replaceState = function (...args) {
            const res = origReplace.apply(this, args);
            const newUrl = new URL(location.href);
            const oldUrl = new URL(lastUrl);
            if (newUrl.pathname === oldUrl.pathname && newUrl.searchParams.get("page") !== oldUrl.searchParams.get("page")) {
                lastUrl = location.href;
                return res;
            }
            window.dispatchEvent(new Event("nh_route_change"));
            return res;
        };

        window.addEventListener("popstate", () => {
            window.dispatchEvent(new Event("nh_route_change"));
        });

        window.addEventListener("nh_route_change", debounce(handleRouteChange, 80));

        // MutationObserver to watch SvelteKit DOM changes
        const observer = new MutationObserver(() => {
            if (location.href !== lastUrl) {
                handleRouteChange();
            } else {
                // Ensure topbar and card enhancements stay intact
                const currentNav = document.querySelector("nav");
                const navLogo = currentNav?.querySelector(".logo");
                const navLeftLogo = currentNav?.querySelector(".nh-topbar-left .logo");
                const needsTopbarRepair = currentNav && (
                    !currentNav.querySelector("#nh-topbar-center") ||
                    (navLogo && navLogo !== navLeftLogo) ||
                    !currentNav.querySelector(".nh-topbar-left .nh-menu-toggle") ||
                    !!currentNav.querySelector(".menu.left > li:not(.nh-nav-primary):not(.nh-nav-dropdown)")
                );
                if (needsTopbarRepair) {
                    setupModernTopbar();
                }
                enhanceSortBar();
                if (!document.querySelector("#nh-mobile-topbar")) injectMobileTopbar();
                const cardsWithoutLanguage = getGalleryCards().find((card) => !card.dataset.nhLangProcessed);
                if (cardsWithoutLanguage) {
                    syncAllGalleryCards();
                }
                const sentinelEl = document.querySelector("#nh-scroll-sentinel");
                if (isGalleryListingRoute() && findGalleryContainer() && (!infiniteScrollActive || !sentinelEl?.isConnected)) {
                    infiniteScrollActive = false;
                    initInfiniteScroll();
                }
                if (infiniteScrollActive) {
                    document.querySelectorAll(".pagination, section.pagination").forEach((p) => {
                        p.style.setProperty("display", "none", "important");
                    });
                }
                if (isGalleryPostRoute() && !document.querySelector("#nh-media-toolbar")) {
                    setupPostMediaView();
                }
            }
        });

        observer.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true,
        });
    }

    // ===================================================================== //
    //  Main Execution / Enhancement Runner                                  //
    // ===================================================================== //
    function injectBottomNav() {
        if (document.querySelector("#nh-bottom-nav")) return;

        const nav = el("div", { id: "nh-bottom-nav" });
        const currentPath = location.pathname;

        const items = [
            { href: HOME_NAV_HREF, label: "Home", icon: ICON.home },
            { href: POPULAR_NAV_HREF, label: "Popular", icon: ICON.popular },
            { href: "/random/", label: "Random", icon: ICON.random },
            { action: () => { if (window.__nhOpenSearch) window.__nhOpenSearch(); }, label: "Buscar", icon: ICON.search, className: "nh-bnav-search" },
            { href: "/tags/", label: "Tags", icon: ICON.tags },
            { href: "/favorites/", label: "Favoritos", icon: ICON.heart },
        ];

        items.forEach(({ href, label, icon, action, className = "" }) => {
            let item;
            if (action) {
                item = el("button", { type: "button", className: `nh-bnav-item ${className}`.trim() }, `${icon}<span>${label}</span>`);
                item.addEventListener("click", action);
            } else {
                const target = new URL(href, location.origin);
                const targetPath = target.pathname.replace(/\/+$/, "") || "/";
                const isHome = targetPath === "/";
                const isPopular = label === "Popular" && currentPath.startsWith("/search");
                const isActive = isHome ? currentPath === "/" : (isPopular ? new URL(location.href).searchParams.get("sort") === "popular" : currentPath.startsWith(targetPath + "/") || currentPath === targetPath);
                item = el("a", { href, className: `nh-bnav-item ${className} ${isActive ? "active" : ""}`.trim() }, `${icon}<span>${label}</span>`);
            }
            nav.appendChild(item);
        });

        document.body.appendChild(nav);
    }

    function runEnhancements() {
        const isGalleryPost = isGalleryPostRoute();
        const isListing =
            document.querySelector(".index-container, .gallery-grid") !== null ||
            isGalleryListingRoute();

        // Always ensure search modal is built & topbar is enhanced
        buildSearchModal();
        setupModernTopbar();
        injectMobileTopbar();
        injectBottomNav();

        if (isListing) {
            enhanceSortBar();
            // Apply language flags and filters to every gallery card.
            syncAllGalleryCards();
            // Setup infinite scroll
            initInfiniteScroll();
            // Harvest tags from cards
            const cards = getGalleryCards();
            harvestTags(cards);
        }

        if (isGalleryPost) {
            // Setup media toolbar & continuous reader
            setupPostMediaView();
            // Harvest post tags for autocomplete
            harvestPostTags();
        }
    }

    // ===================================================================== //
    //  Initialization                                                       //
    // ===================================================================== //
    function init() {
        document.documentElement?.classList.toggle("nh-mirror-xxx", isNhentaiXxxHost());
        document.documentElement?.classList.toggle("nh-mirror-to", isNhentaiToHost());
        injectModernStyles();
        bindReaderKeyboard();

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => {
                hookHistoryEvents();
                runEnhancements();
            });
        } else {
            hookHistoryEvents();
            runEnhancements();
        }
    }

    init();
})();
