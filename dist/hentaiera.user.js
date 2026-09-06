// ==UserScript==
// @name         HentaiEra 2.0
// @namespace    hentaiera-dark-gallery
// @version      1.1.0
// @updateURL    https://raw.githubusercontent.com/claudiogepeto/userscripts/main/dist/hentaiera.user.js
// @downloadURL  https://raw.githubusercontent.com/claudiogepeto/userscripts/main/dist/hentaiera.user.js
// @author       claudiogepeto
// @description  Modern dark AMOLED theme, responsive gallery grid, infinite scroll, unified navigation, and multi-mode reader for HentaiEra
// @match        https://hentaiera.com/*
// @match        https://hentaiera.to/*
// @run-at       document-start
// @grant        GM_addStyle
// ==/UserScript==
(function () {
    "use strict";ß

    const ACCENT = "#33b2ef";
    const ACCENT_HOVER = "#5cc8f5";
    const ACCENT_DARK = "#1b80b1";
    const ACCENT_GRAD = "linear-gradient(135deg, #1b80b1, #33b2ef)";

    const KEY_MEDIA_MODE = "he_media_mode";
    const KEY_READER_WIDTH = "he_reader_width";
    const KEY_READER_ORIENTATION = "he_reader_orientation";
    const KEY_MANHWA_MODE = "he_manhwa_mode";
    const KEY_FULLSCREEN_LAYOUT = "he_fullscreen_layout";
    const KEY_FULLSCREEN_REVERSED = "he_fullscreen_reversed";
    const KEY_FULLSCREEN_ZOOM = "he_fullscreen_zoom";
    const KEY_RECENT_SEARCHES = "he_recent_searches";
    const KEY_FILTER_LANGUAGES = "he_filter_languages";

    const READER_WIDTH_PRESETS = ["60%", "75%", "90%", "100%", "viewport-height"];
    const READER_ORIENTATIONS = ["vertical", "horizontal"];
    const FULLSCREEN_ZOOM_PRESETS = ["1", "1.25", "1.5", "2"];
    const PAGE_ZOOM_LEVELS = [1, 1.5, 2];

    const addStyle = (css) => {
        if (typeof GM_addStyle === "function") return GM_addStyle(css);
        const style = document.createElement("style");
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
    };

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

    const escapeHtml = (value) => String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const svg = (inner) =>
        `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

    const ICON = {
        home: svg('<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/>'),
        menu: svg('<path d="M4 6h16M4 12h16M4 18h16"/>'),
        search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
        close: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
        random: svg('<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4h3l4 4"/>'),
        tags: svg('<path d="M20.59 13.41 11 3.83V3H4v7h.83l9.58 9.59a2 2 0 0 0 2.83 0l3.35-3.35a2 2 0 0 0 0-2.83Z"/><circle cx="7.5" cy="6.5" r=".75" fill="currentColor" stroke="none"/>'),
        heart: svg('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'),
        book: svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>'),
        fullscreen: svg('<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5"/>'),
        settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15H4a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 5.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 10 4.6h.09A1.65 1.65 0 0 0 11 3.09V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 16 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.4 9H21a2 2 0 1 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15Z"/>'),
        arrowUp: svg('<path d="m18 15-6-6-6 6"/>'),
        arrowDown: svg('<path d="m6 9 6 6 6-6"/>'),
        chevronLeft: svg('<path d="m15 18-6-6 6-6"/>'),
        chevronRight: svg('<path d="m9 18 6-6-6-6"/>'),
        vertical: svg('<path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4"/>'),
        horizontal: svg('<path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4"/>'),
        manhwa: svg('<rect x="4" y="3" width="16" height="4" rx="1"/><rect x="4" y="10" width="16" height="4" rx="1"/><rect x="4" y="17" width="16" height="4" rx="1"/>'),
        refresh: svg('<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/>'),
        more: svg('<circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none"/>'),
    };

    function getStored(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value == null ? fallback : value;
        } catch (e) {
            return fallback;
        }
    }

    function setStored(key, value) {
        try { localStorage.setItem(key, value); } catch (e) {}
    }

    function getPreferredMediaMode() {
        return getStored(KEY_MEDIA_MODE, "continuous") === "fullscreen" ? "fullscreen" : "continuous";
    }

    function getPreferredReaderWidth() {
        const value = getStored(KEY_READER_WIDTH, "100%");
        return READER_WIDTH_PRESETS.includes(value) ? value : "100%";
    }

    function getPreferredOrientation() {
        const value = getStored(KEY_READER_ORIENTATION, "vertical");
        return READER_ORIENTATIONS.includes(value) ? value : "vertical";
    }

    function getPreferredManhwa() {
        return getStored(KEY_MANHWA_MODE, "false") === "true";
    }

    function getPreferredLayout() {
        return getStored(KEY_FULLSCREEN_LAYOUT, "single") === "double" ? "double" : "single";
    }

    function getPreferredReversed() {
        return getStored(KEY_FULLSCREEN_REVERSED, "false") === "true";
    }

    function getPreferredFullscreenZoom() {
        const value = getStored(KEY_FULLSCREEN_ZOOM, "1");
        return FULLSCREEN_ZOOM_PRESETS.includes(value) ? value : "1";
    }

    function isGalleryRoute(pathname = location.pathname) {
        return /^\/gallery\/\d+(?:\/\d+)?\/?$/.test(pathname);
    }

    function isListingRoute(pathname = location.pathname) {
        if (isGalleryRoute(pathname)) return false;
        return pathname === "/" || /^\/(?:search|tags?|tag|artists?|artist|characters?|character|groups?|group|parodies?|parody|languages?|language|categories?|category)(?:\/|$)/.test(pathname);
    }

    function normalizeSiteUrl(href, base = location.href) {
        try { return new URL(href, base).href; } catch (e) { return href; }
    }

    function pathFromHref(href) {
        try { return new URL(href, location.origin).pathname; } catch (e) { return href || "/"; }
    }

    function nativeLogo() {
        const source = document.querySelector("nav .logo img, nav .logo");
        if (source?.matches("img")) return source.cloneNode(true);
        return source?.querySelector("img")?.cloneNode(true) || null;
    }

    function collectNavigationLinks() {
        const result = new Map();
        document.querySelectorAll("nav a[href]").forEach((anchor) => {
            const href = anchor.getAttribute("href");
            const label = (anchor.textContent || "").replace(/\s+/g, " ").trim();
            if (!href || !label || result.has(href)) return;
            result.set(href, { href, label });
        });
        const fallback = [
            ["/random/", "Random"], ["/tags/", "Tags"], ["/parodies/", "Parodies"],
            ["/artists/", "Artists"], ["/characters/", "Characters"], ["/groups/", "Groups"],
            ["/login/", "Login"], ["/register/", "Register"],
        ];
        fallback.forEach(([href, label]) => {
            if (!result.has(href)) result.set(href, { href, label });
        });
        return [...result.values()];
    }

    function closeNavDrawer() {
        const drawer = document.querySelector("#he-nav-drawer");
        const toggle = document.querySelector("#he-menu-toggle");
        if (!drawer) return;
        drawer.hidden = true;
        document.body.classList.remove("he-drawer-open");
        toggle?.setAttribute("aria-expanded", "false");
    }

    function setupNavigation() {
        if (!document.body) return;
        const links = collectNavigationLinks();
        let topbar = document.querySelector("#he-topbar");
        if (!topbar) {
            topbar = el("header", { id: "he-topbar" });
            document.body.insertBefore(topbar, document.body.firstChild);
        }

        const logo = nativeLogo();
        const logoHtml = logo ? logo.outerHTML : "<span>HentaiEra</span>";
        const primary = [
            { href: "/", label: "Home", icon: ICON.home },
            { href: "/random/", label: "Random", icon: ICON.random },
            { href: "/tags/", label: "Tags", icon: ICON.tags },
        ];
        const primaryHrefs = new Set(primary.map((item) => item.href));
        const extras = links.filter((item) => !primaryHrefs.has(pathFromHref(item.href)) && !/^(login|register)$/i.test(item.label));
        const login = links.find((item) => /login/i.test(item.label)) || { href: "/login/", label: "Login" };
        const register = links.find((item) => /register/i.test(item.label)) || { href: "/register/", label: "Register" };

        topbar.innerHTML = `
            <div class="he-topbar-inner">
                <div class="he-topbar-left">
                    <button type="button" id="he-menu-toggle" class="he-icon-button he-mobile-only" aria-label="Open menu" aria-controls="he-nav-drawer" aria-expanded="false">${ICON.menu}</button>
                    <a class="he-logo" href="/" aria-label="HentaiEra">${logoHtml}</a>
                    <nav class="he-primary-links" aria-label="Primary navigation">
                        ${primary.map((item) => `<a href="${item.href}" class="he-top-link">${item.icon}<span>${item.label}</span></a>`).join("")}
                        <div class="he-link-dropdown">
                            <button type="button" class="he-top-link he-dropdown-toggle" aria-expanded="false">${ICON.arrowDown}<span>Mais</span></button>
                            <div class="he-dropdown-menu">${extras.map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`).join("")}</div>
                        </div>
                    </nav>
                </div>
                <button type="button" class="he-top-search" data-he-open-search="true" aria-label="Open search">${ICON.search}<span>Search galleries</span></button>
                <button type="button" class="he-icon-button he-mobile-search he-mobile-only" data-he-open-search="true" aria-label="Search">${ICON.search}</button>
                <div class="he-auth-links">
                    <a href="${escapeHtml(login.href)}">${escapeHtml(login.label)}</a>
                    <a href="${escapeHtml(register.href)}">${escapeHtml(register.label)}</a>
                </div>
            </div>
        `;

        let drawer = document.querySelector("#he-nav-drawer");
        if (!drawer) {
            drawer = el("aside", { id: "he-nav-drawer", hidden: true });
            document.body.appendChild(drawer);
        }
        drawer.innerHTML = `
            <div class="he-drawer-backdrop"></div>
            <div class="he-drawer-panel" role="dialog" aria-modal="true" aria-label="Site menu">
                <div class="he-drawer-head"><strong>HentaiEra</strong><button type="button" class="he-icon-button he-drawer-close" aria-label="Close menu">${ICON.close}</button></div>
                <div class="he-drawer-links">
                    ${primary.map((item) => `<a href="${item.href}">${item.icon}<span>${item.label}</span></a>`).join("")}
                    ${extras.map((item) => `<a href="${escapeHtml(item.href)}">${ICON.tags}<span>${escapeHtml(item.label)}</span></a>`).join("")}
                    <a href="${escapeHtml(login.href)}">${ICON.heart}<span>${escapeHtml(login.label)}</span></a>
                    <a href="${escapeHtml(register.href)}">${ICON.home}<span>${escapeHtml(register.label)}</span></a>
                </div>
            </div>
        `;

        const toggle = topbar.querySelector("#he-menu-toggle");
        const openDrawer = () => {
            drawer.hidden = false;
            document.body.classList.add("he-drawer-open");
            toggle?.setAttribute("aria-expanded", "true");
        };
        toggle?.addEventListener("click", openDrawer);
        drawer.querySelector(".he-drawer-backdrop")?.addEventListener("click", closeNavDrawer);
        drawer.querySelector(".he-drawer-close")?.addEventListener("click", closeNavDrawer);
        topbar.querySelectorAll("[data-he-open-search]").forEach((button) => button.addEventListener("click", () => window.__heOpenSearch?.()));

        const dropdown = topbar.querySelector(".he-link-dropdown");
        const dropdownToggle = topbar.querySelector(".he-dropdown-toggle");
        dropdownToggle?.addEventListener("click", (event) => {
            event.stopPropagation();
            const open = dropdown.classList.toggle("is-open");
            dropdownToggle.setAttribute("aria-expanded", String(open));
        });
        if (!window.__heDropdownBound) {
            window.__heDropdownBound = true;
            document.addEventListener("click", () => {
                document.querySelectorAll(".he-link-dropdown.is-open").forEach((item) => item.classList.remove("is-open"));
                document.querySelectorAll(".he-dropdown-toggle[aria-expanded='true']").forEach((item) => item.setAttribute("aria-expanded", "false"));
            });
        }
    }

    function injectBottomNav() {
        if (document.querySelector("#he-bottom-nav")) return;
        const nav = el("nav", { id: "he-bottom-nav", "aria-label": "Mobile navigation" });
        const items = [
            ["/", "Home", ICON.home], ["/random/", "Random", ICON.random],
            ["search", "Search", ICON.search], ["/tags/", "Tags", ICON.tags],
            ["/login/", "Account", ICON.heart],
        ];
        items.forEach(([href, label, icon]) => {
            if (href === "search") {
                const button = el("button", { type: "button", className: "he-bottom-item he-bottom-search" }, `${icon}<span>${label}</span>`);
                button.addEventListener("click", () => window.__heOpenSearch?.());
                nav.appendChild(button);
                return;
            }
            const targetPath = pathFromHref(href).replace(/\/+$/, "") || "/";
            const currentPath = location.pathname.replace(/\/+$/, "") || "/";
            const active = targetPath === "/" ? currentPath === "/" : currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
            nav.appendChild(el("a", { href, className: `he-bottom-item${active ? " active" : ""}` }, `${icon}<span>${label}</span>`));
        });
        document.body.appendChild(nav);
    }

    // =====================================================================
    // Listing cards and infinite scroll
    // =====================================================================
    function findListingContainer(root = document) {
        const tagsSection = root.querySelector?.(".tags_section");
        if (tagsSection) {
            return [...tagsSection.querySelectorAll(".row.galleries")].find((node) => node.querySelector(".thumb")) || null;
        }
        const candidates = [...(root.querySelectorAll?.(".row.galleries") || [])];
        return candidates.find((node) => !node.closest(".gallery_fourth, .related_section") && node.querySelector(".thumb")) || null;
    }

    function getListingCards(root = document) {
        const container = findListingContainer(root);
        if (!container) return [];
        return [...container.querySelectorAll(".thumb")].filter((card) => !card.closest(".gallery_fourth, .related_section"));
    }

    const FILTER_CATEGORIES = [
        ["mg", "Manga"], ["dj", "Doujinshi"], ["ws", "Western"],
        ["is", "Image Set"], ["ac", "Artist CG"], ["gc", "Game CG"],
    ];
    const FILTER_LANGUAGES = [
        ["en", "English", "us"], ["jp", "日本語", "jp"], ["es", "Español", "es"], ["fr", "Français", "fr"],
        ["kr", "한국어", "kr"], ["de", "Deutsch", "de"], ["ru", "Русский", "ru"], ["cn", "中文", "cn"],
    ];
    const FILTER_SORTS = [["lt", "Latest"], ["dl", "Downloaded"], ["pp", "Popular"], ["tr", "Top rated"]];
    const FILTER_TAGS = ["big breasts", "anal", "blowjob", "ahegao", "milf", "schoolgirl uniform", "glasses", "nakadashi", "yuri", "yaoi"];

    function nativeFilterForm() {
        const filter = document.querySelector("#filter_form");
        return filter?.closest("form") || document.querySelector("#filter_form_mb") || null;
    }

    function filterInitialValue(name, source) {
        const params = new URLSearchParams(location.search);
        if (params.has(name)) return params.get(name) === "0" ? "0" : "1";
        if (FILTER_LANGUAGES.some(([language]) => language === name)) {
            const preferences = readLanguagePreferences();
            if (preferences[name] === "0" || preferences[name] === "1") return preferences[name];
        }
        return source?.querySelector(`input[name="${name}"]`)?.value === "0" ? "0" : "1";
    }

    function readLanguagePreferences() {
        try {
            const stored = JSON.parse(localStorage.getItem(KEY_FILTER_LANGUAGES) || "{}");
            return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
        } catch (e) {
            return {};
        }
    }

    function saveLanguagePreferences(bar) {
        const preferences = {};
        FILTER_LANGUAGES.forEach(([name]) => {
            const value = bar.querySelector(`input[name="${name}"]`)?.value;
            if (value === "0" || value === "1") preferences[name] = value;
        });
        setStored(KEY_FILTER_LANGUAGES, JSON.stringify(preferences));
    }

    function clearLanguagePreferences() {
        try { localStorage.removeItem(KEY_FILTER_LANGUAGES); } catch (e) {}
    }

    function filterFlagUrl(name, fallbackCode, source) {
        const nativeFlag = source?.querySelector(`[data-toggle-field="${name}"] img.g_flag, .${name} img.g_flag`);
        return nativeFlag?.getAttribute("src") || `/img/flags/${fallbackCode}.svg`;
    }

    function setupFilterBar() {
        if (document.querySelector("#he-filter-bar")) return;
        const searchBox = document.querySelector("#he-search-modal .he-search-box");
        if (!searchBox) return;
        const source = nativeFilterForm();

        const bar = el("div", { id: "he-filter-bar", className: "he-filter-bar" });
        bar.innerHTML = `
            <div class="he-filter-line he-filter-line-secondary">
                <label class="he-filter-sort">Sort <select name="sort" aria-label="Sort galleries">${FILTER_SORTS.map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}</select></label>
                <button type="button" class="he-filter-clear">Clear</button>
            </div>
            <div class="he-filter-line he-filter-line-options">
                <div class="he-filter-group" aria-label="Content type">
                    <span class="he-filter-label">Type</span>
                    ${FILTER_CATEGORIES.map(([name, label]) => `<button type="button" class="he-filter-chip" data-he-filter-field="${name}" aria-pressed="true">${label}</button><input type="hidden" name="${name}" value="1">`).join("")}
                </div>
                <div class="he-filter-group" aria-label="Languages">
                    <span class="he-filter-label">Language</span>
                    ${FILTER_LANGUAGES.map(([name, label, flag]) => `<button type="button" class="he-filter-chip" data-he-filter-field="${name}" aria-pressed="true"><img class="he-filter-flag" src="${escapeHtml(filterFlagUrl(name, flag, source))}" alt="">${label}</button><input type="hidden" name="${name}" value="1">`).join("")}
                </div>
            </div>
            <div class="he-filter-line he-filter-line-tags" aria-label="Popular tags">
                <div class="he-filter-group">
                    <span class="he-filter-label">Tags</span>
                    ${FILTER_TAGS.map((tag) => `<button type="button" class="he-filter-chip he-filter-tag" data-he-search-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join("")}
                </div>
            </div>
        `;

        [...FILTER_CATEGORIES, ...FILTER_LANGUAGES].forEach(([name]) => {
            const value = filterInitialValue(name, source);
            const button = bar.querySelector(`[data-he-filter-field="${name}"]`);
            const hidden = bar.querySelector(`input[name="${name}"]`);
            hidden.value = value;
            button.classList.toggle("is-off", value !== "1");
            button.setAttribute("aria-pressed", String(value === "1"));
            button.addEventListener("click", () => {
                const enabled = hidden.value !== "1";
                hidden.value = enabled ? "1" : "0";
                button.classList.toggle("is-off", !enabled);
                button.setAttribute("aria-pressed", String(enabled));
                if (FILTER_LANGUAGES.some(([language]) => language === name)) saveLanguagePreferences(bar);
            });
        });
        const selectedSort = new URLSearchParams(location.search).get("sort") || "lt";
        bar.querySelector("select[name='sort']").value = FILTER_SORTS.some(([value]) => value === selectedSort) ? selectedSort : "lt";
        bar.querySelectorAll("[data-he-search-tag]").forEach((button) => {
            button.addEventListener("click", () => {
                const input = document.querySelector("#he-search-modal input[name='key']");
                if (!input) return;
                const tag = button.dataset.heSearchTag || "";
                const current = input.value.trim();
                const values = current ? current.split(/\s*,\s*/).filter(Boolean) : [];
                if (!values.some((value) => value.toLowerCase() === tag.toLowerCase())) values.push(tag);
                input.value = values.join(", ");
                input.focus();
            });
        });
        bar.querySelector(".he-filter-clear").addEventListener("click", () => {
            clearLanguagePreferences();
            location.assign("/");
        });

        document.querySelectorAll("#filter_form, #filter_form_mb").forEach((node) => {
            node.classList.add("he-native-filter-hidden");
            node.closest("form")?.classList.add("he-native-filter-hidden");
        });
        searchBox.querySelector(".he-search-filters")?.appendChild(bar);
    }

    function getGalleryIdFromCard(card) {
        const href = card?.querySelector("a.inner_thumb")?.getAttribute("href") || "";
        const match = href.match(/\/gallery\/(\d+)(?:\/|$)/i);
        return match ? match[1] : null;
    }

    function hydrateCardImage(card, { eager = false } = {}) {
        const cover = card?.querySelector("a.inner_thumb");
        const image = cover?.querySelector("img");
        if (!image) return;
        const lazySource = image.getAttribute("data-src") || image.getAttribute("data-lazy-src") || image.getAttribute("data-original");
        const source = lazySource || image.getAttribute("src") || "";
        if (!source) return;

        // HentaiEra's own lazy loader only watches the initial document. Cards
        // fetched by infinite scroll need to complete the same state change
        // themselves, otherwise they keep the preloader state forever.
        const normalizedSource = normalizeSiteUrl(source);
        const fallback = image.getAttribute("data-fallback");
        if (!image.dataset.heLoadBound) {
            image.dataset.heLoadBound = "true";
            image.addEventListener("load", () => {
                image.classList.add("loaded");
                cover.classList.add("loaded");
            });
            image.addEventListener("error", () => {
                const fallbackUrl = fallback && normalizeSiteUrl(fallback);
                if (fallbackUrl && image.src !== fallbackUrl) {
                    image.src = fallbackUrl;
                    return;
                }
                image.classList.add("loaded");
                cover.classList.add("loaded");
            });
        }

        image.removeAttribute("data-src");
        image.removeAttribute("data-lazy-src");
        image.removeAttribute("data-original");
        image.classList.remove("lazy", "preloader");
        image.loading = eager ? "eager" : "lazy";
        image.decoding = "async";
        image.classList.add("loaded");
        cover.classList.add("loaded");
        if (image.getAttribute("src") !== normalizedSource) image.setAttribute("src", normalizedSource);
        if (image.complete && image.naturalWidth > 0) {
            image.classList.add("loaded");
            cover.classList.add("loaded");
        }
    }

    function isChineseCard(card) {
        return Boolean(card?.querySelector(
            ".lang_pages a[href*='/language/chinese/'], .lang_pages a[aria-label='Chinese' i], .lang_pages img[alt='Chinese' i]",
        ));
    }

    function applyLanguageFilter(card) {
        const chineseExcluded = new URLSearchParams(location.search).get("cn") === "0";
        card?.classList.toggle("he-card-language-hidden", chineseExcluded && isChineseCard(card));
    }

    function syncCard(card, options = {}) {
        if (!card) return;
        applyLanguageFilter(card);
        if (card.dataset.heCardProcessed === "true") {
            updateCardPages(card);
            return;
        }

        const cover = card.querySelector("a.inner_thumb");
        if (!cover) return;
        hydrateCardImage(card, options);

        const nativeFlag = card.querySelector(".lang_pages > a:has(.g_flag), .lang_pages .g_flag")?.closest("a");
        if (nativeFlag && !cover.querySelector(".he-card-lang")) {
            const flag = nativeFlag.cloneNode(true);
            flag.className = "he-card-lang";
            flag.setAttribute("aria-label", nativeFlag.getAttribute("aria-label") || nativeFlag.querySelector("img")?.alt || "Language");
            cover.appendChild(flag);
        }

        card.dataset.heCardProcessed = "true";
        updateCardPages(card);
    }

    function updateCardPages(card) {
        const cover = card.querySelector("a.inner_thumb");
        if (!cover) return;
        // Taxonomy cards (for example /tags/) also expose `.g_pages`, but
        // that value is the number of galleries for the tag, not page count.
        if (!getGalleryIdFromCard(card)) {
            cover.querySelector(".he-card-pages")?.remove();
            return;
        }
        const value = card.querySelector(".g_pages .inside_p")?.textContent?.trim();
        const pageCount = Number.parseInt(value || "", 10);
        if (!Number.isFinite(pageCount) || pageCount <= 0) {
            cover.querySelector(".he-card-pages")?.remove();
            return;
        }
        let badge = cover.querySelector(".he-card-pages");
        if (!badge) {
            badge = el("span", { className: "he-card-pages" });
            badge.setAttribute("aria-hidden", "true");
            cover.appendChild(badge);
        }
        badge.textContent = `${pageCount}p`;
        badge.title = `${pageCount} pages`;
    }

    function syncAllCards() {
        getListingCards().forEach(syncCard);
    }

    let infiniteScrollObserver = null;
    let infiniteScrollSentinel = null;
    let nextListingUrl = null;
    let listingFetching = false;
    let listingGeneration = 0;
    let listingContinuationFrame = 0;
    let listingViewportCheckFrame = 0;
    let listingRetryRequired = false;

    function listingPageNumber(href, fallback = 1) {
        try {
            const page = Number.parseInt(new URL(href, location.href).searchParams.get("page") || "1", 10);
            return Number.isFinite(page) && page > 0 ? page : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function preserveListingQuery(href, base = location.href) {
        try {
            const current = new URL(base, location.href);
            const next = new URL(href, base);
            // The .com and .to aliases sometimes emit canonical absolute
            // links for the other hostname. Infinite scroll must stay on the
            // current origin so the request remains same-origin.
            next.protocol = current.protocol;
            next.host = current.host;
            // Pagination links on some HentaiEra responses omit filters that
            // were added by the search form. Carry them forward so client-side
            // language choices (including cn=0) stay effective on every page.
            current.searchParams.forEach((value, key) => {
                if (key !== "page" && !next.searchParams.has(key)) next.searchParams.set(key, value);
            });
            return next.href;
        } catch (e) {
            return normalizeSiteUrl(href, base);
        }
    }

    function detectNextListingUrl(root = document, base = location.href) {
        const currentPage = listingPageNumber(base);
        const links = [...(root.querySelectorAll?.(".pagination a") || [])]
            .filter((link) => link.getAttribute("href"));
        const next = root.querySelector("ul.pagination a[rel='next'], .pagination a.next, .pagination a[aria-label*='Next' i]") ||
            links.find((link) => /^(?:next|next\s*[›»→]|[›»→])$/i.test((link.textContent || "").replace(/\s+/g, " ").trim()));

        if (next?.getAttribute("href")) {
            const nextUrl = preserveListingQuery(next.getAttribute("href"), base);
            // Never let a malformed/stale "next" link request the same page
            // forever. Fall through to the numeric pagination below instead.
            if (listingPageNumber(nextUrl, currentPage + 1) > currentPage) return nextUrl;
        }

        const numericPages = links
            .map((link) => preserveListingQuery(link.getAttribute("href"), base))
            .map((href) => ({ href, page: listingPageNumber(href, 0) }))
            .filter(({ page }) => page > currentPage)
            .sort((a, b) => a.page - b.page);
        if (numericPages.length) return numericPages[0].href;

        // A pager without any greater numbered page is at its end. Do not
        // invent page numbers here: some endpoints keep the pager shell in
        // the response even after the final result.
        return null;
    }

    function setListingStatus(text, type = "loading") {
        let status = document.querySelector("#he-scroll-status");
        if (!status) {
            status = el("div", { id: "he-scroll-status", className: "he-scroll-status" });
            findListingContainer()?.after(status);
        }
        status.className = `he-scroll-status ${type}`;
        status.textContent = text;
        status.hidden = !text;
    }

    function continueListingIfNeeded(generation = listingGeneration) {
        if (generation !== listingGeneration || !nextListingUrl || listingFetching || listingRetryRequired || !infiniteScrollSentinel?.isConnected) return;
        const rect = infiniteScrollSentinel.getBoundingClientRect();
        const viewportBottom = window.innerHeight || document.documentElement.clientHeight;
        if (rect.top > viewportBottom + 1000 || listingContinuationFrame) return;
        listingContinuationFrame = requestAnimationFrame(() => {
            listingContinuationFrame = 0;
            if (generation === listingGeneration && nextListingUrl && !listingFetching) fetchNextListingPage();
        });
    }

    async function fetchNextListingPage() {
        if (listingFetching || !nextListingUrl) return;
        listingFetching = true;
        listingRetryRequired = false;
        const generation = listingGeneration;
        setListingStatus("Loading more galleries…", "loading");
        try {
            const response = await fetch(nextListingUrl, { credentials: "same-origin" });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();
            if (generation !== listingGeneration) return;
            const parsed = new DOMParser().parseFromString(html, "text/html");
            const target = findListingContainer();
            const sourceCards = getListingCards(parsed);
            if (!target || !sourceCards.length) {
                nextListingUrl = null;
                setListingStatus("No more galleries", "done");
                return;
            }

            const existing = new Set(getListingCards().map((card) => card.querySelector("a.inner_thumb")?.getAttribute("href")));
            sourceCards.forEach((card) => {
                const key = card.querySelector("a.inner_thumb")?.getAttribute("href");
                if (key && existing.has(key)) return;
                target.appendChild(card);
                if (key) existing.add(key);
                syncCard(card, { eager: true });
            });
            nextListingUrl = detectNextListingUrl(parsed, nextListingUrl);
            if (!nextListingUrl) {
                setListingStatus("End of results", "done");
                infiniteScrollObserver?.disconnect();
            } else {
                setListingStatus("", "done");
            }
        } catch (error) {
            listingRetryRequired = true;
            setListingStatus("Could not load more galleries. Tap to retry.", "error");
            const status = document.querySelector("#he-scroll-status");
            status?.addEventListener("click", fetchNextListingPage, { once: true });
        } finally {
            listingFetching = false;
            continueListingIfNeeded(generation);
        }
    }

    function initInfiniteScroll() {
        if (!isListingRoute() || !findListingContainer()) return;
        const generation = listingGeneration;
        nextListingUrl = detectNextListingUrl();
        // Keep the browse-all-tags pager available. It is useful as a direct
        // fallback even when the same route also supports infinite scrolling.
        const isTagsIndex = /^\/tags?\/?$/.test(location.pathname);
        document.querySelectorAll(".pagination").forEach((pagination) => {
            pagination.classList.toggle("he-pagination-native", !isTagsIndex);
        });
        if (!nextListingUrl) return;

        if (!infiniteScrollSentinel) {
            infiniteScrollSentinel = el("div", { id: "he-scroll-sentinel", "aria-hidden": "true" });
            findListingContainer()?.after(infiniteScrollSentinel);
        }
        infiniteScrollObserver?.disconnect();
        infiniteScrollObserver = new IntersectionObserver((entries) => {
            if (generation !== listingGeneration) return;
            if (entries.some((entry) => entry.isIntersecting)) fetchNextListingPage();
        }, { rootMargin: "900px 0px" });
        infiniteScrollObserver.observe(infiniteScrollSentinel);

        // IntersectionObserver can miss a transition when hidden language
        // cards are removed from the grid or when the site changes the grid's
        // height after image hydration. Keep a cheap viewport fallback so the
        // sentinel remains live during ordinary scroll/resize events.
        if (!window.__heListingViewportBound) {
            window.__heListingViewportBound = true;
            const check = () => {
                if (listingViewportCheckFrame) return;
                listingViewportCheckFrame = requestAnimationFrame(() => {
                    listingViewportCheckFrame = 0;
                    continueListingIfNeeded();
                });
            };
            window.addEventListener("scroll", check, { passive: true });
            window.addEventListener("resize", check, { passive: true });
        }
        continueListingIfNeeded(generation);
    }

    // =====================================================================
    // Search palette
    // =====================================================================
    function readRecentSearches() {
        try {
            const value = JSON.parse(localStorage.getItem(KEY_RECENT_SEARCHES) || "[]");
            return Array.isArray(value) ? value.filter((item) => item?.q && item?.url) : [];
        } catch (e) {
            return [];
        }
    }

    function buildSearchPalette() {
        if (document.querySelector("#he-search-modal")) return;
        const modal = el("div", { id: "he-search-modal", className: "he-search-overlay", hidden: true });
        modal.innerHTML = `
            <div class="he-search-box" role="dialog" aria-modal="true" aria-labelledby="he-search-title">
                <div class="he-search-head"><strong id="he-search-title">Search HentaiEra</strong><button type="button" class="he-icon-button he-search-close" aria-label="Close search">${ICON.close}</button></div>
                <form class="he-search-form" action="/search/" method="get">
                    <div class="he-search-input-wrap">${ICON.search}<input name="key" type="search" autocomplete="off" autofocus placeholder="Tags, artists, characters…" aria-label="Search"></div>
                    <button class="he-search-submit" type="submit">Search</button>
                </form>
                <div class="he-search-filters" aria-label="Search filters"></div>
                <div class="he-search-recents"></div>
                <div class="he-search-foot"><span>Enter to search</span><kbd>Esc</kbd></div>
            </div>
        `;
        document.body.appendChild(modal);

        const input = modal.querySelector("input");
        const recents = modal.querySelector(".he-search-recents");
        const renderRecents = () => {
            const items = readRecentSearches().slice(0, 8);
            recents.innerHTML = items.length
                ? `<span class="he-recents-label">Recent searches</span>${items.map((item) => `<a href="${escapeHtml(item.url)}">${ICON.search}<span>${escapeHtml(item.q)}</span></a>`).join("")}`
                : "";
        };
        const open = () => {
            modal.hidden = false;
            document.body.classList.add("he-search-open");
            renderRecents();
            setTimeout(() => input.focus(), 0);
        };
        const close = () => {
            modal.hidden = true;
            document.body.classList.remove("he-search-open");
        };
        window.__heOpenSearch = open;
        modal.querySelector(".he-search-close").addEventListener("click", close);
        modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
        modal.querySelector("form").addEventListener("submit", (event) => {
            event.preventDefault();
            const query = input.value.trim();
            const filterBar = modal.querySelector("#he-filter-bar");
            if (filterBar) saveLanguagePreferences(filterBar);
            const params = new URLSearchParams();
            if (query) params.set("key", query);
            filterBar?.querySelectorAll("input[type='hidden'][value='0']").forEach((field) => params.set(field.name, "0"));
            const sort = filterBar?.querySelector("select[name='sort']")?.value || "lt";
            if (sort !== "lt") params.set("sort", sort);
            const url = new URL(query ? "/search/" : "/", location.origin);
            url.search = params.toString();
            if (query) {
                const historyItems = readRecentSearches().filter((item) => item.q !== query);
                historyItems.unshift({ q: query, url: url.href, time: Date.now() });
                setStored(KEY_RECENT_SEARCHES, JSON.stringify(historyItems.slice(0, 20)));
            }
            location.assign(url.href);
        });
        if (!window.__heSearchKeyboardBound) {
            window.__heSearchKeyboardBound = true;
            document.addEventListener("keydown", (event) => {
                if (event.key === "Escape" && !modal.hidden) close();
                if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
                    event.preventDefault();
                    open();
                }
                if (event.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) {
                    event.preventDefault();
                    open();
                }
            });
        }
    }

    // =====================================================================
    // Gallery reader
    // =====================================================================
    let readerImageObserver = null;
    let galleryReaderRetryTimer = null;
    let galleryActionsObserver = null;

    function parseGalleryImageUrl(value) {
        if (!value) return null;
        try {
            const url = new URL(value, location.href);
            const match = url.pathname.match(/\/galleries\/(\d+)\/(?:(\d+)(t)?|(cover|thumb))\.([a-z0-9]+)$/i);
            if (!match) return null;
            const slash = url.pathname.lastIndexOf("/");
            return {
                galleryMediaId: match[1],
                pageNumber: match[2] ? Number(match[2]) : null,
                extension: match[5].toLowerCase(),
                base: `${url.origin}${url.pathname.slice(0, slash + 1)}`,
            };
        } catch (e) {
            return null;
        }
    }

    function extractGalleryMedia() {
        const readerNode = document.querySelector("#reader");
        const thumbs = [...document.querySelectorAll("#append_thumbs img, #thumbs_gallery_div .gthumb img")];
        let structuredGallery = null;
        try {
            structuredGallery = [...document.querySelectorAll("script[type='application/ld+json']")]
                .map((node) => JSON.parse(node.textContent || "{}"))
                .find((data) => data?.["@type"] === "ImageGallery");
        } catch (e) {}
        const sources = [
            document.querySelector("#reader_img")?.getAttribute("src"),
            document.querySelector("meta[property='og:image']")?.getAttribute("content"),
            structuredGallery?.image,
            ...thumbs.flatMap((thumb) => [thumb.getAttribute("data-src"), thumb.getAttribute("src")]),
        ];
        const source = sources.map(parseGalleryImageUrl).find(Boolean);
        if (!source) return null;

        const totalFromDom = readerNode?.dataset.total || document.querySelector("#append_thumbs")?.dataset.total || document.querySelector(".total_pages")?.textContent || structuredGallery?.numberOfItems;
        let total = Number.parseInt(totalFromDom || "", 10);
        if (!total) {
            try {
                const ld = [...document.querySelectorAll("script[type='application/ld+json']")]
                    .map((node) => JSON.parse(node.textContent || "{}"))
                    .find((data) => Number(data?.numberOfItems) > 0);
                total = Number(ld?.numberOfItems || 0);
            } catch (e) {}
        }
        if (!total) total = thumbs.length || 1;

        const extension = source.extension;
        const base = source.base;
        const pageExtensions = new Map();
        thumbs.forEach((thumb, index) => {
            const thumbSrc = thumb.getAttribute("data-src") || thumb.getAttribute("src") || "";
            const parsed = parseGalleryImageUrl(thumbSrc);
            if (parsed?.pageNumber) pageExtensions.set(parsed.pageNumber, parsed.extension);
            else pageExtensions.set(index + 1, extension);
        });
        return { base, total, extension, pageExtensions };
    }

    function pageCandidates(media, pageNumber) {
        const original = media.pageExtensions.get(pageNumber) || media.extension || "webp";
        const extensions = [original, "webp", "jpg", "png"].filter((item, index, all) => all.indexOf(item) === index);
        return extensions.map((extension) => `${media.base}${pageNumber}.${extension}`);
    }

    function loadReaderPage(page) {
        if (page.dataset.heLoading === "true" || page.classList.contains("is-done")) return;
        page.dataset.heLoading = "true";
        let candidates = [];
        try { candidates = JSON.parse(page.dataset.candidates || "[]"); } catch (e) {}
        const image = page.querySelector(".he-page-image");
        let index = 0;
        const tryNext = () => {
            if (index >= candidates.length) {
                page.classList.add("is-error");
                page.dataset.heLoading = "false";
                return;
            }
            const url = candidates[index++];
            const probe = new Image();
            probe.onload = () => {
                image.src = url;
                image.alt = `Page ${page.dataset.page}`;
                page.classList.add("is-done");
                page.dataset.heLoading = "false";
            };
            probe.onerror = tryNext;
            probe.src = url;
        };
        tryNext();
    }

    function setupReaderObserver(pages) {
        readerImageObserver?.disconnect();
        readerImageObserver = new IntersectionObserver((entries) => {
            entries.filter((entry) => entry.isIntersecting).forEach((entry) => loadReaderPage(entry.target));
        }, { rootMargin: "1400px 0px" });
        pages.querySelectorAll(".he-reader-page").forEach((page) => readerImageObserver.observe(page));
    }

    function createReaderElement(media) {
        const reader = el("section", { id: "he-reader", className: "he-reader" });
        const pages = el("div", { className: "he-reader-pages" });
        for (let pageNumber = 1; pageNumber <= media.total; pageNumber += 1) {
            const page = el("div", {
                className: "he-reader-page",
                dataset: { page: String(pageNumber), candidates: JSON.stringify(pageCandidates(media, pageNumber)) },
            });
            page.innerHTML = `<span class="he-page-number">${pageNumber}</span><img class="he-page-image" alt="Page ${pageNumber}" loading="lazy">`;
            page.querySelector(".he-page-image").addEventListener("click", () => cyclePageZoom(page));
            pages.appendChild(page);
        }
        reader.appendChild(pages);
        setupReaderObserver(pages);
        return reader;
    }

    function applyReaderWidth(reader, width, allowHeight = true) {
        const value = READER_WIDTH_PRESETS.includes(width) ? width : "100%";
        reader.style.setProperty("--he-reader-width", value);
        reader.classList.toggle("he-reader-fit-height", allowHeight && value === "viewport-height");
    }

    function syncFullscreenSpread(reader, enabled) {
        const pages = reader?.querySelector(".he-reader-pages");
        if (!pages) return;
        const spreads = [...pages.children].filter((child) => child.classList.contains("he-reader-spread"));
        if (!enabled) {
            const fragment = document.createDocumentFragment();
            spreads.forEach((spread) => [...spread.children].forEach((page) => fragment.appendChild(page)));
            if (spreads.length) pages.replaceChildren(fragment);
            return;
        }
        if (spreads.length) return;
        const pageItems = [...pages.children].filter((child) => child.classList.contains("he-reader-page"));
        const fragment = document.createDocumentFragment();
        for (let index = 0; index < pageItems.length; index += 2) {
            const spread = el("div", { className: "he-reader-spread" });
            spread.appendChild(pageItems[index]);
            if (pageItems[index + 1]) spread.appendChild(pageItems[index + 1]);
            fragment.appendChild(spread);
        }
        pages.replaceChildren(fragment);
    }

    function setReaderOrientation(value) {
        const orientation = READER_ORIENTATIONS.includes(value) ? value : "vertical";
        setStored(KEY_READER_ORIENTATION, orientation);
        const reader = document.querySelector("#he-reader");
        reader?.classList.toggle("he-reader-horizontal", orientation === "horizontal");
        reader?.classList.toggle("he-reader-vertical", orientation === "vertical");
        reader?.querySelector(".he-reader-pages")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
        syncFullscreenControls();
    }

    function setFullscreenLayout(value) {
        const layout = value === "double" ? "double" : "single";
        setStored(KEY_FULLSCREEN_LAYOUT, layout);
        const reader = document.querySelector("#he-reader");
        const enabled = reader?.classList.contains("he-reader-fullscreen") && layout === "double" && !getPreferredManhwa();
        reader?.classList.toggle("he-reader-spread-mode", Boolean(enabled));
        syncFullscreenSpread(reader, Boolean(enabled));
        syncFullscreenControls();
    }

    function setFullscreenReversed(value) {
        const reversed = Boolean(value);
        setStored(KEY_FULLSCREEN_REVERSED, String(reversed));
        const reader = document.querySelector("#he-reader");
        reader?.classList.toggle("he-reader-reversed", reversed);
        syncFullscreenControls();
    }

    function setFullscreenZoom(value) {
        const zoom = FULLSCREEN_ZOOM_PRESETS.includes(String(value)) ? String(value) : "1";
        setStored(KEY_FULLSCREEN_ZOOM, zoom);
        const reader = document.querySelector("#he-reader");
        reader?.style.setProperty("--he-fullscreen-zoom", zoom);
        reader?.querySelectorAll(".he-reader-page[data-zoom-level]").forEach((page) => {
            page.removeAttribute("data-zoom-level");
            page.style.removeProperty("--he-page-zoom");
            page.classList.remove("is-zoomed");
        });
        syncFullscreenControls();
    }

    function setManhwa(value) {
        const enabled = Boolean(value);
        setStored(KEY_MANHWA_MODE, String(enabled));
        document.querySelectorAll("[data-he-manhwa], [data-he-fs-manhwa]").forEach((button) => {
            button.classList.toggle("active", enabled);
            button.setAttribute("aria-pressed", String(enabled));
        });
        const reader = document.querySelector("#he-reader");
        if (reader) {
            reader.classList.toggle("he-reader-manhwa", enabled);
            const spread = reader.classList.contains("he-reader-fullscreen") && !enabled && getPreferredLayout() === "double";
            reader.classList.toggle("he-reader-spread-mode", spread);
            syncFullscreenSpread(reader, spread);
        }
        syncFullscreenControls();
    }

    function scrollReaderStart() {
        const reader = document.querySelector("#he-reader");
        const items = [...(reader?.querySelectorAll(".he-reader-page, .he-reader-spread") || [])];
        if (reader?.classList.contains("he-reader-fullscreen") && items.length) {
            items[0].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }

    function setPageZoom(page, value) {
        const level = PAGE_ZOOM_LEVELS.includes(Number(value)) ? Number(value) : 1;
        if (level === 1) {
            const reader = page.closest("#he-reader");
            if (reader?.classList.contains("he-reader-fullscreen") && getPreferredFullscreenZoom() !== "1") {
                page.dataset.zoomLevel = "1";
                page.style.setProperty("--he-page-zoom", "1");
            } else {
                page.removeAttribute("data-zoom-level");
                page.style.removeProperty("--he-page-zoom");
            }
        } else {
            page.dataset.zoomLevel = String(level);
            page.style.setProperty("--he-page-zoom", String(level));
        }
        page.classList.toggle("is-zoomed", level > 1);
    }

    function cyclePageZoom(page) {
        const reader = page.closest("#he-reader");
        const defaultZoom = reader?.classList.contains("he-reader-fullscreen") ? Number(getPreferredFullscreenZoom()) : 1;
        const current = Number(page.dataset.zoomLevel || defaultZoom);
        const index = PAGE_ZOOM_LEVELS.indexOf(current);
        setPageZoom(page, PAGE_ZOOM_LEVELS[(index + 1) % PAGE_ZOOM_LEVELS.length]);
    }

    function navigateReader(delta) {
        const reader = document.querySelector("#he-reader");
        if (!reader || reader.style.display === "none") return;
        if (!reader.classList.contains("he-reader-fullscreen")) {
            window.scrollBy({ top: delta * Math.max(260, window.innerHeight * 0.84), behavior: "smooth" });
            return;
        }
        const pages = reader.querySelector(".he-reader-pages");
        const items = [...(pages?.children || [])].filter((item) => item.matches(".he-reader-page, .he-reader-spread"));
        if (!items.length) return;
        const horizontal = reader.classList.contains("he-reader-horizontal");
        const rect = pages.getBoundingClientRect();
        const center = horizontal ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
        let current = items.findIndex((item) => {
            const itemRect = item.getBoundingClientRect();
            return horizontal ? itemRect.left <= center && itemRect.right >= center : itemRect.top <= center && itemRect.bottom >= center;
        });
        if (current < 0) current = delta > 0 ? 0 : items.length - 1;
        const target = Math.max(0, Math.min(items.length - 1, current + delta));
        items[target].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }

    function ensureFullscreenControls() {
        let controls = document.querySelector("#he-fullscreen-controls");
        if (!controls) {
            controls = el("div", { id: "he-fullscreen-controls", hidden: true });
            controls.innerHTML = `
                <div class="he-fullscreen-menu" hidden>
                    <div class="he-control-group"><span>Direction</span><div class="he-segmented"><button type="button" class="he-seg" data-he-orientation="vertical">${ICON.vertical}<span>Vertical</span></button><button type="button" class="he-seg" data-he-orientation="horizontal">${ICON.horizontal}<span>Horizontal</span></button></div></div>
                    <div class="he-control-group"><span>Default zoom</span><div class="he-segmented">${FULLSCREEN_ZOOM_PRESETS.map((zoom) => `<button type="button" class="he-seg" data-he-fs-zoom="${zoom}">${Number(zoom) * 100}%</button>`).join("")}</div></div>
                    <div class="he-control-group"><span>Pages</span><div class="he-segmented"><button type="button" class="he-seg" data-he-fs-layout="single">Single</button><button type="button" class="he-seg" data-he-fs-layout="double">Double</button></div></div>
                    <button type="button" class="he-seg he-menu-action" data-he-fs-manhwa="true">${ICON.manhwa}<span>Manhwa</span></button>
                    <button type="button" class="he-seg he-menu-action" data-he-fs-reversed="true">${ICON.refresh}<span>Reversed</span></button>
                    <button type="button" class="he-seg he-menu-action" data-he-fs-top="true">${ICON.arrowUp}<span>Back to top</span></button>
                    <button type="button" class="he-seg he-menu-action" data-he-fs-exit="true">${ICON.close}<span>Exit fullscreen</span></button>
                </div>
                <button type="button" class="he-reader-settings" aria-label="Reader settings" aria-expanded="false">${ICON.settings}</button>
            `;
            document.body.appendChild(controls);
            const menu = controls.querySelector(".he-fullscreen-menu");
            const toggle = controls.querySelector(".he-reader-settings");
            toggle.addEventListener("click", (event) => {
                event.stopPropagation();
                menu.hidden = !menu.hidden;
                toggle.setAttribute("aria-expanded", String(!menu.hidden));
            });
            menu.addEventListener("click", (event) => event.stopPropagation());
            controls.querySelectorAll("[data-he-orientation]").forEach((button) => button.addEventListener("click", () => setReaderOrientation(button.dataset.heOrientation)));
            controls.querySelectorAll("[data-he-fs-zoom]").forEach((button) => button.addEventListener("click", () => setFullscreenZoom(button.dataset.heFsZoom)));
            controls.querySelectorAll("[data-he-fs-layout]").forEach((button) => button.addEventListener("click", () => setFullscreenLayout(button.dataset.heFsLayout)));
            controls.querySelector("[data-he-fs-manhwa]").addEventListener("click", () => setManhwa(!getPreferredManhwa()));
            controls.querySelector("[data-he-fs-reversed]").addEventListener("click", () => setFullscreenReversed(!getPreferredReversed()));
            controls.querySelector("[data-he-fs-top]").addEventListener("click", scrollReaderStart);
            controls.querySelector("[data-he-fs-exit]").addEventListener("click", () => setMediaMode("continuous"));
        }

        let navigation = document.querySelector("#he-fullscreen-navigation");
        if (!navigation) {
            navigation = el("div", { id: "he-fullscreen-navigation", hidden: true });
            navigation.innerHTML = `<button type="button" class="he-nav-arrow" data-he-prev="true" aria-label="Previous page">${ICON.arrowUp}</button><button type="button" class="he-nav-arrow" data-he-next="true" aria-label="Next page">${ICON.arrowDown}</button>`;
            document.body.appendChild(navigation);
            navigation.querySelector("[data-he-prev]").addEventListener("click", () => navigateReader(-1));
            navigation.querySelector("[data-he-next]").addEventListener("click", () => navigateReader(1));
        }
        syncFullscreenControls();
    }

    function syncFullscreenControls() {
        const controls = document.querySelector("#he-fullscreen-controls");
        const navigation = document.querySelector("#he-fullscreen-navigation");
        const active = document.body.classList.contains("he-reader-fullscreen-active");
        if (controls) controls.hidden = !active;
        if (navigation) navigation.hidden = !active;
        if (!controls || !active) return;

        const orientation = getPreferredOrientation();
        const reversed = getPreferredReversed();
        const layout = getPreferredLayout();
        const zoom = getPreferredFullscreenZoom();
        const manhwa = getPreferredManhwa();
        navigation?.classList.toggle("is-horizontal", orientation === "horizontal");
        navigation?.classList.toggle("is-vertical", orientation !== "horizontal");
        const prev = navigation?.querySelector("[data-he-prev]");
        const next = navigation?.querySelector("[data-he-next]");
        if (prev && next) {
            prev.innerHTML = orientation === "horizontal" ? (reversed ? ICON.chevronRight : ICON.chevronLeft) : (reversed ? ICON.arrowDown : ICON.arrowUp);
            next.innerHTML = orientation === "horizontal" ? (reversed ? ICON.chevronLeft : ICON.chevronRight) : (reversed ? ICON.arrowUp : ICON.arrowDown);
        }
        controls.querySelectorAll("[data-he-orientation]").forEach((button) => button.classList.toggle("active", button.dataset.heOrientation === orientation));
        controls.querySelectorAll("[data-he-fs-zoom]").forEach((button) => button.classList.toggle("active", button.dataset.heFsZoom === zoom));
        controls.querySelectorAll("[data-he-fs-layout]").forEach((button) => button.classList.toggle("active", button.dataset.heFsLayout === layout && !(manhwa && button.dataset.heFsLayout === "double")));
        const double = controls.querySelector("[data-he-fs-layout='double']");
        if (double) double.disabled = manhwa;
        const manhwaButton = controls.querySelector("[data-he-fs-manhwa]");
        manhwaButton?.classList.toggle("active", manhwa);
        manhwaButton?.setAttribute("aria-pressed", String(manhwa));
        const reversedButton = controls.querySelector("[data-he-fs-reversed]");
        reversedButton?.classList.toggle("active", reversed);
        reversedButton?.setAttribute("aria-pressed", String(reversed));
    }

    function setMediaMode(value, save = true) {
        const mode = value === "fullscreen" ? "fullscreen" : "continuous";
        if (save) setStored(KEY_MEDIA_MODE, mode);
        const toolbar = document.querySelector("#he-media-toolbar");
        toolbar?.querySelectorAll("[data-he-media-mode]").forEach((button) => button.classList.toggle("active", button.dataset.heMediaMode === mode));
        toolbar?.querySelector(".he-toolbar-options")?.classList.toggle("is-hidden", mode !== "continuous");

        const reader = document.querySelector("#he-reader");
        const pages = reader?.querySelector(".he-reader-pages");
        if (!reader || !pages) return;
        const fullscreen = mode === "fullscreen";
        const manhwa = getPreferredManhwa();
        reader.style.display = "flex";
        reader.dataset.mode = mode;
        reader.classList.toggle("he-reader-fullscreen", fullscreen);
        reader.classList.toggle("he-reader-manhwa", manhwa);
        reader.classList.toggle("he-reader-horizontal", fullscreen && getPreferredOrientation() === "horizontal");
        reader.classList.toggle("he-reader-vertical", fullscreen && getPreferredOrientation() === "vertical");
        reader.classList.toggle("he-reader-reversed", fullscreen && getPreferredReversed());
        reader.classList.toggle("he-reader-spread-mode", fullscreen && !manhwa && getPreferredLayout() === "double");
        applyReaderWidth(reader, fullscreen ? "100%" : getPreferredReaderWidth(), !fullscreen);
        reader.style.setProperty("--he-fullscreen-zoom", getPreferredFullscreenZoom());
        syncFullscreenSpread(reader, fullscreen && !manhwa && getPreferredLayout() === "double");
        document.body.classList.toggle("he-reader-fullscreen-active", fullscreen);
        if (fullscreen) ensureFullscreenControls();
        else syncFullscreenControls();
    }

    function setReaderWidth(value) {
        if (!READER_WIDTH_PRESETS.includes(value)) return;
        setStored(KEY_READER_WIDTH, value);
        document.querySelectorAll("[data-he-width]").forEach((button) => button.classList.toggle("active", button.dataset.heWidth === value));
        const reader = document.querySelector("#he-reader");
        if (reader?.dataset.mode === "continuous") applyReaderWidth(reader, value);
    }

    function reactionCount(buttonId) {
        const value = document.querySelector(`#${buttonId} span[id$='_count']`)?.textContent || "0";
        const number = Number.parseInt(value.replace(/[^0-9-]/g, ""), 10);
        return Number.isFinite(number) ? number : 0;
    }

    function updateGalleryReactionScore(row, score) {
        if (!row || !score) return;
        score.textContent = String(reactionCount("like_btn") - reactionCount("dlike_btn"));
    }

    function closeGalleryActionMenus() {
        document.querySelectorAll(".he-action-more.is-open").forEach((wrapper) => {
            wrapper.classList.remove("is-open");
            wrapper.querySelector(".he-gallery-more-toggle")?.setAttribute("aria-expanded", "false");
            wrapper.querySelector(".he-gallery-actions-menu")?.setAttribute("hidden", "");
        });
    }

    function bindGalleryActionMenu() {
        if (window.__heGalleryActionMenuBound) return;
        window.__heGalleryActionMenuBound = true;
        document.addEventListener("click", (event) => {
            if (!event.target.closest(".he-action-more")) closeGalleryActionMenus();
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") closeGalleryActionMenus();
        });
    }

    function setupGalleryActions() {
        const row = document.querySelector("#react_row");
        if (!row) return;
        const pagesButton = document.querySelector("#pages_btn");
        pagesButton?.closest("li")?.remove();
        pagesButton?.remove();

        const like = row.querySelector("#like_btn");
        const dislike = row.querySelector("#dlike_btn");
        const favorite = row.querySelector("#add_fav_btn");
        const fapped = row.querySelector("#fap_btn");
        const download = row.querySelector("#download_btn");
        const report = row.querySelector("#report_btn");
        if (!like || !dislike || !favorite || !fapped || !download || !report) return;

        bindGalleryActionMenu();
        if (row.dataset.heActionsReady === "true") {
            updateGalleryReactionScore(row, row.querySelector(".he-reaction-score"));
            return;
        }

        const progress = row.querySelector("#dl_progress");
        const score = el("span", { className: "he-reaction-score", title: "Like score" }, "0");
        score.setAttribute("aria-label", "Like score");

        [like, dislike, favorite, fapped].forEach((button) => button.classList.add("he-gallery-action"));
        like.setAttribute("aria-label", "Like");
        dislike.setAttribute("aria-label", "Dislike");
        favorite.setAttribute("aria-label", "Add to favourites");
        fapped.setAttribute("aria-label", "Fapped");

        const reactions = el("div", { className: "he-action-group he-action-reactions" });
        reactions.append(like, score, dislike);

        const more = el("div", { className: "he-action-more" });
        const moreToggle = el("button", { type: "button", className: "he-gallery-more-toggle" }, ICON.more);
        moreToggle.setAttribute("aria-label", "More actions");
        moreToggle.setAttribute("aria-haspopup", "menu");
        moreToggle.setAttribute("aria-expanded", "false");
        const menu = el("div", { className: "he-gallery-actions-menu", hidden: true, role: "menu" });
        download.classList.add("he-gallery-menu-action");
        report.classList.add("he-gallery-menu-action");
        menu.append(download, report);
        if (progress) menu.append(progress);
        more.append(moreToggle, menu);
        moreToggle.addEventListener("click", (event) => {
            event.stopPropagation();
            const open = !more.classList.contains("is-open");
            closeGalleryActionMenus();
            more.classList.toggle("is-open", open);
            moreToggle.setAttribute("aria-expanded", String(open));
            menu.hidden = !open;
        });

        const secondary = el("div", { className: "he-action-group he-action-secondary" });
        secondary.append(favorite, fapped, more);
        row.classList.add("he-gallery-actions");
        row.replaceChildren(reactions, secondary);
        row.dataset.heActionsReady = "true";
        updateGalleryReactionScore(row, score);
        galleryActionsObserver?.disconnect();
        galleryActionsObserver = new MutationObserver(() => updateGalleryReactionScore(row, score));
        ["#like_count", "#dislike_count"].forEach((selector) => {
            const count = row.querySelector(selector);
            if (count) galleryActionsObserver.observe(count, { childList: true, characterData: true, subtree: true });
        });
    }

    function scheduleGalleryReaderSetup() {
        if (galleryReaderRetryTimer || !isGalleryRoute()) return;
        galleryReaderRetryTimer = setTimeout(() => {
            galleryReaderRetryTimer = null;
            setupGalleryReader();
        }, 450);
    }

    function setupGalleryReader() {
        if (!isGalleryRoute()) return;
        setupGalleryActions();
        const media = extractGalleryMedia();
        if (!media) {
            scheduleGalleryReaderSetup();
            return;
        }
        let toolbar = document.querySelector("#he-media-toolbar");
        let reader = document.querySelector("#he-reader");
        if (!reader) reader = createReaderElement(media);

        // The reader belongs immediately after the gallery header/details. The
        // native thumbnail block is kept as a fallback anchor, but ad slots or
        // other blocks between both sections must not push our controls away.
        const galleryHeader = document.querySelector(".gallery_first");
        const insertTarget = galleryHeader || document.querySelector("#thumbs_gallery_div") || document.querySelector(".gallery_view");
        const insertParent = insertTarget?.parentNode || document.querySelector(".container") || document.body;
        const insertBefore = galleryHeader?.nextElementSibling || (insertTarget?.parentNode === insertParent ? insertTarget : null);
        if (!toolbar) {
            toolbar = el("div", { id: "he-media-toolbar", className: "he-media-toolbar" });
            toolbar.innerHTML = `
                <div class="he-toolbar-main"><div class="he-segmented"><button type="button" class="he-seg" data-he-media-mode="continuous">${ICON.book}<span>Continuous</span></button><button type="button" class="he-seg" data-he-media-mode="fullscreen">${ICON.fullscreen}<span>Fullscreen</span></button></div><span class="he-page-stat">${ICON.book}<b>${media.total}</b> pages</span></div>
                <div class="he-toolbar-options"><div class="he-toolbar-control"><span>Width:</span><div class="he-segmented">${["60%", "75%", "90%", "100%", "viewport-height"].map((value) => `<button type="button" class="he-seg" data-he-width="${value}">${value === "viewport-height" ? "Height" : value}</button>`).join("")}</div></div><button type="button" class="he-seg he-manhwa-button" data-he-manhwa="true" aria-pressed="false">${ICON.manhwa}<span>Manhwa</span></button></div>
            `;
            if (insertParent) {
                if (insertBefore) insertParent.insertBefore(toolbar, insertBefore);
                else insertParent.appendChild(toolbar);
            }
        }
        if (!reader.parentNode && insertParent) {
            const readerBefore = toolbar?.parentNode === insertParent ? toolbar.nextSibling : insertBefore;
            if (readerBefore) insertParent.insertBefore(reader, readerBefore);
            else insertParent.appendChild(reader);
        }
        toolbar.querySelectorAll("[data-he-media-mode]").forEach((button) => {
            button.addEventListener("click", () => setMediaMode(button.dataset.heMediaMode));
        });
        toolbar.querySelectorAll("[data-he-width]").forEach((button) => {
            button.addEventListener("click", () => setReaderWidth(button.dataset.heWidth));
        });
        toolbar.querySelector("[data-he-manhwa]")?.addEventListener("click", () => setManhwa(!getPreferredManhwa()));
        document.querySelectorAll("#thumbs_gallery_div, #show_more_row").forEach((node) => node.classList.add("he-reader-source-hidden"));
        document.querySelector(".gallery_view")?.classList.add("he-reader-native-hidden");
        setMediaMode(getPreferredMediaMode(), false);
        document.querySelectorAll("[data-he-width]").forEach((button) => button.classList.toggle("active", button.dataset.heWidth === getPreferredReaderWidth()));
        setManhwa(getPreferredManhwa());
    }

    function bindReaderKeyboard() {
        if (window.__heReaderKeyboardBound) return;
        window.__heReaderKeyboardBound = true;
        document.addEventListener("keydown", (event) => {
            const target = event.target;
            if (target?.matches?.("input, textarea, select, button, [contenteditable='true']") || target?.isContentEditable) return;
            const reader = document.querySelector("#he-reader");
            if (!reader || reader.style.display === "none") return;
            const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
            if (key === "Escape" && reader.classList.contains("he-reader-fullscreen")) {
                event.preventDefault();
                setMediaMode("continuous");
                return;
            }
            if (key === "Home") {
                event.preventDefault();
                scrollReaderStart();
                return;
            }
            const horizontal = reader.classList.contains("he-reader-horizontal");
            const previous = horizontal ? ["ArrowLeft", "a", "w"] : ["ArrowUp", "w", "a"];
            const next = horizontal ? ["ArrowRight", "d", "s"] : ["ArrowDown", "s", "d"];
            if (previous.includes(key)) {
                event.preventDefault();
                navigateReader(-1);
            } else if (next.includes(key)) {
                event.preventDefault();
                navigateReader(1);
            }
        });
    }

    // =====================================================================
    // Styles
    // =====================================================================
    function injectStyles() {
        addStyle(`
            :root {
                --he-accent: ${ACCENT}; --he-accent-hover: ${ACCENT_HOVER}; --he-accent-dark: ${ACCENT_DARK}; --he-grad: ${ACCENT_GRAD};
                --he-bg: #0b0b0f; --he-surface: #14141b; --he-elevated: #1b1b25; --he-card: #15151d; --he-border: #272733; --he-border-light: #383849;
                --he-text: #f4f4f8; --he-secondary: #a3a4b4; --he-muted: #696b7d; --he-radius: 12px; --he-content-width: min(95vw, 1600px);
            }
            html, body { width: 100%; margin: 0 !important; min-height: 100vh; max-width: 100%; overflow-x: clip; background: var(--he-bg) !important; color: var(--he-text) !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important; }
            body { padding-top: 68px !important; padding-bottom: 24px; }
            body.he-search-open { overflow: hidden !important; }
            body > nav.navbar, nav.navbar { display: none !important; }
            *, *::before, *::after { box-sizing: border-box; }
            a { color: inherit; }
            .he-mobile-only { display: none !important; }
            #he-topbar { position: fixed; inset: 0 0 auto 0; z-index: 10000; height: 64px; padding: 0; background: rgba(10,10,14,.96); border-bottom: 1px solid var(--he-border); box-shadow: 0 5px 24px rgba(0,0,0,.35); backdrop-filter: blur(18px); transition: transform .22s ease; }
            .he-topbar-inner { position: relative; width: var(--he-content-width); height: 100%; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 420px) minmax(0, 1fr); align-items: center; gap: 18px; }
            .he-topbar-left { grid-column: 1; min-width: 0; display: flex; align-items: center; gap: 10px; }
            .he-logo { flex: 0 0 auto; display: inline-flex; align-items: center; min-width: 72px; color: var(--he-accent); font-size: 17px; font-weight: 800; text-decoration: none; }
            .he-logo img { display: block; width: auto; height: 42px; max-width: 120px; object-fit: contain; }
            .he-primary-links { display: flex; align-items: center; gap: 2px; min-width: 0; flex: 0 1 auto; }
            .he-top-link { display: inline-flex; align-items: center; gap: 5px; min-height: 36px; padding: 7px 7px; border-radius: 8px; color: var(--he-secondary); font-size: 12px; font-weight: 650; text-decoration: none; white-space: nowrap; }
            .he-top-link:hover, .he-primary-links a[href="${escapeHtml(location.pathname)}"] { color: #fff; background: var(--he-elevated); }
            .he-dropdown-toggle, .he-dropdown-toggle:hover, .he-dropdown-toggle:focus, .he-dropdown-toggle:active, .he-link-dropdown.is-open .he-dropdown-toggle { color: var(--he-secondary) !important; background: var(--he-surface) !important; border: 0 !important; box-shadow: none !important; }
            .he-dropdown-toggle:hover, .he-dropdown-toggle:focus-visible { color: var(--he-accent) !important; background: var(--he-elevated) !important; }
            .he-top-link svg { width: 16px; height: 16px; }
            .he-link-dropdown { position: relative; }
            .he-dropdown-menu { position: absolute; top: calc(100% + 8px); left: 0; display: none; min-width: 180px; padding: 7px; border: 1px solid var(--he-border); border-radius: 10px; color: var(--he-secondary) !important; background: rgba(10,10,14,.98) !important; box-shadow: 0 14px 32px rgba(0,0,0,.65); }
            .he-link-dropdown.is-open .he-dropdown-menu { display: grid; }
            .he-dropdown-menu a { padding: 9px 10px; border-radius: 7px; color: var(--he-secondary) !important; background: transparent !important; font-size: 13px; text-decoration: none; }
            .he-dropdown-menu a:hover { color: var(--he-accent) !important; background: rgba(51,178,239,.12) !important; }
            .he-top-search { grid-column: 2; position: static; display: inline-flex; align-items: center; justify-content: center; justify-self: center; gap: 8px; width: min(34vw, 420px); height: 36px; padding: 0 13px; border: 1px solid var(--he-border); border-radius: 9px; outline: 0; color: var(--he-muted); background: #0f0f14; font: 650 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; cursor: pointer; }
            .he-top-search:hover, .he-top-search:focus-visible { border-color: var(--he-accent); color: var(--he-secondary); box-shadow: 0 0 0 3px rgba(51,178,239,.14); }
            .he-top-search svg { width: 17px; height: 17px; flex: 0 0 17px; }
            .he-auth-links { grid-column: 3; justify-self: end; display: flex; align-items: center; gap: 4px; }
            .he-auth-links a { padding: 5px 7px; color: var(--he-muted); font-size: 10px; opacity: .78; text-decoration: none; }
            .he-auth-links a:hover { color: var(--he-secondary); }
            .he-icon-button { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; padding: 0; border: 1px solid var(--he-border); border-radius: 9px; color: var(--he-secondary); background: transparent; cursor: pointer; }
            .he-icon-button:hover { color: #fff; border-color: var(--he-border-light); }
            #he-nav-drawer[hidden], #he-search-modal[hidden], #he-fullscreen-controls[hidden], #he-fullscreen-navigation[hidden] { display: none !important; }
            #he-nav-drawer { position: fixed; inset: 0; z-index: 10005; }
            .he-drawer-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.68); }
            .he-drawer-panel { position: relative; width: min(82vw, 340px); height: 100%; padding: 18px; background: #131319; box-shadow: 12px 0 32px rgba(0,0,0,.6); animation: heDrawerIn .2s ease-out; }
            @keyframes heDrawerIn { from { transform: translateX(-20px); opacity: .3; } to { transform: none; opacity: 1; } }
            .he-drawer-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; color: var(--he-accent); }
            .he-drawer-links { display: grid; gap: 5px; }
            .he-drawer-links a { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 9px; color: var(--he-secondary); text-decoration: none; }
            .he-drawer-links a:hover { color: #fff; background: var(--he-elevated); }
            .he-drawer-links svg { width: 19px; height: 19px; }
            .container, .tags_section { width: var(--he-content-width) !important; max-width: var(--he-content-width) !important; margin-left: auto !important; margin-right: auto !important; }
            .container > .row, .container .row:not(.galleries) { width: 100% !important; max-width: 100% !important; margin-left: 0 !important; margin-right: 0 !important; }
            .ablocktop, .ad-wrapper, [id^="ts_ad"], iframe[src*="ad"], .commercial { display: none !important; }
            .row.galleries { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 18px; width: 100%; max-width: 100%; margin: 0 !important; padding: 18px 0 32px; }
            .row.galleries::before, .row.galleries::after { display: none !important; content: none !important; }
            .row.galleries > .thumbs_container { display: contents !important; }
            .row.galleries > .thumb, .row.galleries .thumb { display: block !important; grid-column: auto !important; width: auto !important; min-width: 0; margin: 0 !important; padding: 0 !important; }
            .row.galleries .thumb.he-card-language-hidden { display: none !important; }
            .row.galleries .thumbnail { height: 100%; display: flex; flex-direction: column; overflow: hidden; padding: 0 !important; border: 1px solid var(--he-border); border-radius: var(--he-radius); background: var(--he-card) !important; box-shadow: 0 5px 17px rgba(0,0,0,.4); transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease; }
            .row.galleries .thumbnail:hover { transform: translateY(-4px); border-color: var(--he-accent); box-shadow: 0 12px 28px rgba(0,0,0,.62); }
            .row.galleries .cat_text, .row.galleries .lang_pages { display: none !important; }
            .row.galleries > h1, .row.galleries > h2 { grid-column: 1 / -1; width: 100%; margin: 0 0 4px !important; padding: 0 0 10px !important; color: var(--he-text) !important; text-align: left !important; }
            .row.galleries a.inner_thumb { position: relative; display: block; width: 100%; overflow: hidden; padding: 0 !important; background: #08080a; }
            .row.galleries a.inner_thumb img { display: block; width: 100%; height: auto; min-height: 0; aspect-ratio: 1 / 1.41; object-fit: cover; transition: transform .28s ease; }
            .row.galleries .thumbnail:hover a.inner_thumb img { transform: scale(1.035); }
            .he-card-lang { position: absolute !important; top: 8px; left: 8px; z-index: 2; display: inline-flex !important; align-items: center; justify-content: center; width: 25px; height: 19px; padding: 2px !important; border: 1px solid rgba(255,255,255,.28); border-radius: 5px; background: rgba(5,5,8,.8); }
            .he-card-lang img { width: 21px !important; height: 15px !important; min-height: 0 !important; aspect-ratio: auto !important; object-fit: contain !important; }
            .he-card-pages { position: absolute; top: 8px; right: 8px; z-index: 2; display: inline-flex; align-items: center; justify-content: center; min-width: 29px; height: 20px; padding: 0 6px; border: 1px solid rgba(255,255,255,.25); border-radius: 5px; color: #fff; background: rgba(5,5,8,.8); box-shadow: 0 2px 8px rgba(0,0,0,.45); font-size: 11px; font-weight: 750; line-height: 1; }
            .row.galleries .g_text { display: block !important; flex: 1 1 auto; min-width: 0; height: auto !important; max-height: none !important; margin: 0 !important; padding: 0 !important; opacity: 1 !important; visibility: visible !important; }
            .row.galleries .gallery_title { display: block !important; height: auto !important; min-height: 0 !important; max-height: none !important; margin: 0 !important; padding: 8px 9px 10px !important; color: var(--he-text) !important; background: var(--he-card) !important; font-size: 13px !important; line-height: 1.35 !important; font-weight: 650 !important; text-align: left; }
            .row.galleries .gallery_title a, .row.galleries .thumbnail .g_text a, .row.galleries .thumbnail:hover .g_text a { display: -webkit-box !important; -webkit-box-orient: vertical; -webkit-line-clamp: 5; height: auto !important; min-height: 0 !important; max-height: 6.75em !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; color: inherit !important; }
            .gallery_first, .gallery_first .right_details, .gallery_first .left_cover { background: transparent !important; }
            .gallery_first { width: var(--he-content-width) !important; max-width: var(--he-content-width) !important; margin: 18px auto 0 !important; }
            .gallery_first .galleries_info { margin-bottom: 10px !important; }
            .gallery_first .galleries_info > li { margin-bottom: 5px !important; }
            .gallery_first .tags_text { font-size: 11px !important; }
            .gallery_first .info_tags { gap: 3px !important; }
            .gallery_first .info_tags .tag { min-height: 23px !important; height: 23px !important; margin: 1px 2px 1px 0 !important; padding: 2px 7px !important; border-radius: 5px !important; font-size: 10px !important; line-height: 18px !important; }
            .gallery_first .info_tags .tag .g_flag { width: 18px !important; height: 13px !important; }
            .tags_sorting a .ico { display: block; width: 15px !important; height: 15px !important; flex: 0 0 15px; margin-right: 6px; fill: currentColor; }
            .he-gallery-actions { display: flex !important; align-items: center; justify-content: flex-start; flex-wrap: wrap; gap: 10px; width: 100%; margin: 12px 0 0 !important; padding: 10px 0 0 !important; border-top: 1px solid var(--he-border); background: transparent !important; font-size: 1rem !important; }
            .he-action-group { display: inline-flex; align-items: center; gap: 5px; min-width: 0; }
            .he-action-reactions { gap: 2px; }
            .he-action-secondary { margin-left: 0; gap: 5px; }
            .he-gallery-actions .he-gallery-action { display: inline-flex !important; align-items: center; justify-content: center; gap: 5px; min-width: 34px; height: 32px !important; margin: 0 !important; padding: 0 7px !important; border: 1px solid var(--he-border) !important; border-radius: 7px !important; color: var(--he-secondary) !important; background: var(--he-surface) !important; font-size: 0 !important; line-height: 1 !important; }
            .he-gallery-actions .he-gallery-action:hover { color: #fff !important; border-color: var(--he-accent) !important; background: var(--he-elevated) !important; }
            .he-gallery-actions .he-gallery-action .ico { display: block; width: 16px !important; height: 16px !important; margin: 0 !important; fill: currentColor; }
            .he-gallery-actions .he-gallery-action [id$="_count"] { display: inline-block; color: inherit; font-size: 11px !important; font-weight: 750; }
            .he-gallery-actions #fav_label, .he-gallery-actions #download_label { display: none !important; }
            .he-reaction-score { min-width: 30px; color: var(--he-text); font-size: 12px; font-weight: 800; text-align: center; }
            .he-action-more { position: relative; }
            .he-gallery-more-toggle { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; padding: 0; border: 1px solid var(--he-border) !important; border-radius: 7px; color: var(--he-secondary); background: var(--he-surface); cursor: pointer; }
            .he-gallery-more-toggle:hover, .he-action-more.is-open .he-gallery-more-toggle { color: #fff; border-color: var(--he-accent) !important; background: var(--he-elevated); }
            .he-gallery-more-toggle svg { width: 17px; height: 17px; }
            .he-gallery-actions-menu { position: absolute; right: 0; bottom: calc(100% + 7px); z-index: 20; display: grid; gap: 4px; min-width: 150px; padding: 6px; border: 1px solid var(--he-border-light); border-radius: 9px; background: rgba(18,18,24,.98); box-shadow: 0 12px 28px rgba(0,0,0,.65); }
            .he-gallery-actions-menu[hidden] { display: none !important; }
            .he-gallery-actions-menu .he-gallery-menu-action { display: inline-flex !important; align-items: center; justify-content: flex-start; gap: 7px; width: 100%; height: 32px !important; margin: 0 !important; padding: 0 8px !important; border: 0 !important; border-radius: 6px !important; color: var(--he-secondary) !important; background: transparent !important; font-size: 11px !important; line-height: 1 !important; }
            .he-gallery-actions-menu .he-gallery-menu-action:hover { color: #fff !important; background: var(--he-elevated) !important; }
            .he-gallery-actions-menu .he-gallery-menu-action .ico { display: block; width: 14px !important; height: 14px !important; }
            .he-gallery-actions-menu #dl_progress { width: 100%; margin: 4px 0 0; }
            @media (min-width: 992px) {
                .gallery_first .left_cover { flex: 0 0 29% !important; max-width: 29% !important; }
                .gallery_first .right_details { flex: 0 0 71% !important; max-width: 71% !important; }
            }
            .he-native-filter-hidden { display: none !important; }
            #he-filter-bar { width: 100%; max-width: 100%; margin: 0; display: grid; gap: 10px; padding: 12px 0 2px; border-top: 1px solid var(--he-border); background: transparent; }
            .he-filter-line { display: flex; align-items: center; gap: 8px; width: 100%; min-width: 0; }
            .he-filter-line-primary { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; }
            .he-filter-line-options { align-items: flex-start; }
            .he-filter-search { display: flex; flex: 1 1 auto; min-width: 0; }
            .he-filter-search input { width: 100%; min-width: 0; height: 34px; padding: 0 10px; border: 1px solid var(--he-border); border-radius: 7px 0 0 7px; outline: 0; color: var(--he-text); background: #0f0f14; }
            .he-filter-search input:focus { border-color: var(--he-accent); }
            .he-filter-search button { display: inline-flex; align-items: center; justify-content: center; gap: 5px; height: 34px; padding: 0 11px; border: 0; border-radius: 0 7px 7px 0; color: #fff; background: var(--he-grad); font-size: 11px; font-weight: 750; cursor: pointer; }
            .he-filter-search svg { width: 15px; height: 15px; }
            .he-filter-line-options { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; padding-top: 0; border-top: 0; }
            .he-filter-group { display: flex; flex: 1 1 0; align-items: center; flex-wrap: wrap; gap: 4px; min-width: 0; }
            .he-filter-label, .he-filter-sort { color: var(--he-muted); font-size: 11px; font-weight: 750; }
            .he-filter-chip, .he-filter-sort select, .he-filter-clear { height: 30px; padding: 0 8px; border: 1px solid var(--he-border); border-radius: 6px; color: var(--he-secondary); background: var(--he-elevated); font-size: 10px; font-weight: 700; cursor: pointer; }
            .he-filter-chip { display: inline-flex; align-items: center; justify-content: center; gap: 5px; }
            .he-filter-flag { display: block; width: 18px; height: 13px; flex: 0 0 auto; object-fit: contain; }
            .he-filter-chip:hover, .he-filter-chip[aria-pressed="true"] { color: #fff; border-color: var(--he-accent); }
            .he-filter-chip[aria-pressed="true"] { background: rgba(51,178,239,.16); }
            .he-filter-chip.is-off { opacity: .48; }
            .he-filter-sort { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
            .he-filter-sort select { outline: 0; }
            .he-filter-clear { color: var(--he-muted); background: transparent; }
            .he-filter-clear:hover { color: #fff; border-color: var(--he-border-light); }
            .he-filter-line-secondary { justify-content: flex-start; }
            .he-filter-line-secondary .he-filter-sort { flex: 1 1 auto; }
            .he-filter-line-secondary .he-filter-sort select { flex: 1 1 auto; min-width: 0; }
            .he-filter-line-tags { border-top: 1px solid var(--he-border); padding-top: 8px; }
            .he-filter-line-tags .he-filter-group { width: 100%; }
            .he-filter-tag { color: var(--he-secondary); }
            .he-search-filters { padding: 0 16px 4px; }
            .he-search-filters .he-filter-label { margin-right: 2px; }
            .row.galleries .gallery_title a { color: inherit !important; text-decoration: none !important; }
            .container > h1, .container > h2, .tags_section > h1, .row.galleries > h1, .row.galleries > h2 { display: block !important; float: none !important; clear: both !important; width: 100% !important; }
            .tags_section { padding: 20px 0 40px; }
            .tags_section > h1 { color: var(--he-text); font-size: 26px; }
            .tags_sorting { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 12px 0; }
            .row.galleries > .tags_sorting { grid-column: 1 / -1 !important; display: flex !important; align-items: center; flex-wrap: wrap; width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 4px 0 10px !important; }
            .row.galleries > .tags_sorting > [class*="col-"] { flex: 0 0 auto !important; width: auto !important; max-width: none !important; margin: 0 !important; padding: 0 !important; float: none !important; }
            .tags_sorting a, .tags_sorting .btn, .tags_section .btn_az { display: inline-flex; align-items: center; justify-content: center; min-height: 32px; padding: 6px 10px; border: 1px solid var(--he-border); border-radius: 7px; color: var(--he-secondary); background: var(--he-surface); text-decoration: none; }
            .tags_sorting a:hover, .tags_section .btn_az:hover { color: #fff; border-color: var(--he-accent); background: var(--he-elevated); }
            .tags_section .latest_cat_g, .tags_section .latest_pop_g { display: none !important; }
            .pagination { display: flex !important; justify-content: center; flex-wrap: wrap; gap: 6px; margin: 24px auto 40px !important; }
            .pagination.he-pagination-native { display: none !important; }
            .pagination a, .pagination span { display: inline-flex; align-items: center; justify-content: center; min-width: 34px; min-height: 34px; padding: 5px 9px; border: 1px solid var(--he-border); border-radius: 7px; color: var(--he-secondary); background: var(--he-surface); text-decoration: none; }
            .pagination a:hover, .pagination .active span { color: #fff; border-color: var(--he-accent); background: var(--he-grad); }
            #he-scroll-sentinel { height: 2px; }
            .he-scroll-status { width: var(--he-content-width); margin: 8px auto 26px; padding: 12px; color: var(--he-muted); font-size: 13px; text-align: center; }
            .he-scroll-status.error { color: var(--he-accent); cursor: pointer; }
            .he-scroll-status.done { opacity: .7; }
            #he-bottom-nav { display: none; }
            .he-search-overlay { position: fixed; inset: 0; z-index: 10020; display: flex; align-items: flex-start; justify-content: center; padding-top: 13vh; background: rgba(0,0,0,.72); }
            .he-search-box { width: min(620px, 92vw); max-height: min(88dvh, 760px); overflow-y: auto; overflow-x: hidden; border: 1px solid var(--he-border-light); border-radius: 16px; background: #15151c; box-shadow: 0 22px 70px rgba(0,0,0,.8); }
            .he-search-head, .he-search-foot { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; color: var(--he-secondary); }
            .he-search-head { border-bottom: 1px solid var(--he-border); color: var(--he-text); }
            .he-search-form { display: flex; gap: 8px; padding: 16px; }
            .he-search-input-wrap { display: flex; align-items: center; flex: 1; gap: 10px; padding: 0 13px; border: 1px solid var(--he-border); border-radius: 10px; background: #0f0f14; }
            .he-search-input-wrap svg { width: 18px; color: var(--he-muted); }
            .he-search-input-wrap input { width: 100%; height: 48px; border: 0; outline: 0; color: var(--he-text); background: transparent; font-size: 16px; }
            .he-search-submit { min-width: 90px; border: 0; border-radius: 9px; color: #fff; background: var(--he-grad); font-weight: 700; cursor: pointer; }
            .he-search-recents { display: grid; gap: 2px; padding: 0 16px 10px; }
            .he-recents-label { padding: 5px 0; color: var(--he-muted); font-size: 11px; text-transform: uppercase; }
            .he-search-recents a { display: flex; align-items: center; gap: 9px; padding: 8px; border-radius: 7px; color: var(--he-secondary); font-size: 13px; text-decoration: none; }
            .he-search-recents a:hover { color: #fff; background: var(--he-elevated); }
            .he-search-recents svg { width: 15px; }
            .he-search-foot { border-top: 1px solid var(--he-border); font-size: 11px; }
            kbd { padding: 3px 6px; border: 1px solid var(--he-border-light); border-radius: 4px; color: var(--he-muted); }

            /* Reader */
            #he-media-toolbar { width: var(--he-content-width); margin: 18px auto 12px; display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 10px; border: 1px solid var(--he-border); border-radius: 11px; background: rgba(18,18,24,.95); }
            .he-toolbar-main, .he-toolbar-options, .he-toolbar-control { display: flex; align-items: center; gap: 10px; }
            .he-toolbar-options.is-hidden { display: none; }
            .he-page-stat { display: inline-flex; align-items: center; gap: 5px; color: var(--he-secondary); font-size: 12px; }
            .he-page-stat svg { width: 15px; height: 15px; }
            .he-toolbar-control > span { color: var(--he-muted); font-size: 12px; font-weight: 700; }
            .he-segmented { display: inline-flex; gap: 3px; padding: 3px; border: 1px solid var(--he-border); border-radius: 8px; background: #0e0e13; }
            .he-seg { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 29px; padding: 5px 10px; border: 0; border-radius: 6px; color: var(--he-secondary); background: transparent; font-size: 11px; font-weight: 700; line-height: 1; cursor: pointer; }
            .he-seg svg { width: 16px; height: 16px; flex: 0 0 16px; }
            .he-seg:hover { color: #fff; }
            .he-seg.active { color: #fff; background: var(--he-grad); box-shadow: 0 2px 8px rgba(51,178,239,.35); }
            .he-reader { display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 100%; min-width: 0; margin-bottom: 60px; }
            .he-reader-pages { display: flex; flex-direction: column; align-items: center; gap: 16px; width: 100%; max-width: 100%; min-width: 0; }
            .he-reader-page { position: relative; width: min(var(--he-reader-width, 100%), 98vw); max-width: 100%; min-width: 0; overflow: hidden; border: 1px solid var(--he-border); border-radius: 8px; background: #111116; box-shadow: 0 6px 24px rgba(0,0,0,.5); }
            .he-reader-page::before { content: ""; display: block; padding-top: 141.4%; }
            .he-reader-page.is-done::before { display: none; }
            .he-page-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; opacity: 0; cursor: zoom-in; transition: opacity .2s ease; }
            .he-reader-page.is-done .he-page-image { position: static; display: block; width: 100%; height: auto; opacity: 1; transform: scale(var(--he-page-zoom, 1)); transform-origin: center center; }
            .he-reader-page.is-zoomed { overflow: auto; }
            .he-reader-page.is-zoomed .he-page-image { cursor: zoom-out; }
            .he-page-number { position: absolute; top: 8px; left: 8px; z-index: 2; padding: 2px 6px; border-radius: 4px; color: #fff; background: rgba(0,0,0,.55); font: 700 11px monospace; pointer-events: none; }
            .he-reader-fit-height .he-reader-page { width: auto; height: min(calc(100dvh - 140px), 1000px); max-width: 98vw; aspect-ratio: .707 / 1; }
            .he-reader-fit-height .he-reader-page::before { display: none; }
            .he-reader-fit-height .he-page-image, .he-reader-fit-height .he-reader-page.is-done .he-page-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
            .he-reader-manhwa { align-items: stretch; }
            .he-reader-manhwa .he-reader-pages { width: min(var(--he-reader-width, 100%), 98vw); margin: 0 auto; gap: 0; align-items: stretch; }
            .he-reader-manhwa .he-reader-page { width: 100%; border: 0; border-radius: 0; box-shadow: none; background: transparent; }
            .he-reader-manhwa .he-page-number { display: none; }
            .he-reader-manhwa.he-reader-fit-height .he-reader-pages { width: 100%; }
            .he-reader-fullscreen { position: fixed !important; inset: 0; z-index: 10000; width: 100vw; height: 100dvh; margin: 0; padding: 0; background: #000; overflow: hidden; }
            body.he-reader-fullscreen-active { overflow: hidden !important; }
            body.he-reader-fullscreen-active #he-topbar, body.he-reader-fullscreen-active #he-bottom-nav, body.he-reader-fullscreen-active #he-media-toolbar { display: none !important; }
            .he-reader-fullscreen .he-reader-pages { width: 100%; height: 100%; gap: 0; align-items: stretch; overflow-x: hidden; overflow-y: auto; scroll-snap-type: y mandatory; }
            .he-reader-fullscreen.he-reader-horizontal .he-reader-pages { flex-direction: row; overflow-x: auto; overflow-y: hidden; scroll-snap-type: x mandatory; }
            .he-reader-fullscreen.he-reader-reversed .he-reader-pages { direction: rtl; }
            .he-reader-fullscreen.he-reader-reversed .he-reader-page, .he-reader-fullscreen.he-reader-reversed .he-reader-spread { direction: ltr; }
            .he-reader-fullscreen.he-reader-reversed.he-reader-vertical .he-reader-pages { flex-direction: column-reverse; }
            .he-reader-fullscreen .he-reader-page { flex: 0 0 100%; width: 100%; height: 100%; max-width: none; border: 0; border-radius: 0; box-shadow: none; background: #000; scroll-snap-align: start; overflow: auto; }
            .he-reader-fullscreen .he-reader-page::before { display: none; }
            .he-reader-fullscreen .he-page-image, .he-reader-fullscreen .he-reader-page.is-done .he-page-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; transform: scale(var(--he-page-zoom, var(--he-fullscreen-zoom, 1))); transform-origin: center center; }
            .he-reader-spread { display: flex; flex: 0 0 100%; align-items: stretch; justify-content: center; width: 100%; height: 100%; gap: 0; scroll-snap-align: start; overflow: hidden; }
            .he-reader-fullscreen.he-reader-spread-mode .he-reader-page { flex: 1 1 50%; width: 50%; min-width: 0; margin: 0; border-radius: 0; scroll-snap-align: none; }
            .he-reader-fullscreen.he-reader-reversed.he-reader-spread-mode .he-reader-spread { flex-direction: row-reverse; }
            .he-reader-fullscreen.he-reader-spread-mode .he-reader-page:only-child { flex-basis: 100%; width: 100%; }
            .he-reader-fullscreen.he-reader-manhwa .he-reader-pages { flex-direction: column; align-items: center; width: min(86vw, 900px); max-width: 100%; margin: 0 auto; overflow-x: hidden; overflow-y: auto; scroll-snap-type: none; direction: ltr; }
            .he-reader-fullscreen.he-reader-manhwa .he-reader-page { flex: 0 0 auto; width: 100%; height: auto; min-height: 0; overflow: auto; scroll-snap-align: none; }
            .he-reader-fullscreen.he-reader-manhwa .he-reader-page::before { display: block; }
            .he-reader-fullscreen.he-reader-manhwa .he-reader-page.is-done::before { display: none; }
            .he-reader-fullscreen.he-reader-manhwa .he-reader-page.is-done .he-page-image { position: static; width: 100%; height: auto; transform: scale(var(--he-page-zoom, var(--he-fullscreen-zoom, 1))); transform-origin: top center; }
            #he-fullscreen-controls { position: fixed; right: 20px; bottom: 20px; z-index: 10002; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
            .he-reader-settings { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; padding: 0; border: 1px solid var(--he-border-light); border-radius: 50%; color: var(--he-secondary); background: rgba(18,18,24,.92); box-shadow: 0 8px 24px rgba(0,0,0,.65); cursor: pointer; }
            .he-reader-settings:hover, .he-reader-settings[aria-expanded="true"] { color: #fff; border-color: var(--he-accent); }
            .he-reader-settings svg { width: 20px; height: 20px; }
            .he-fullscreen-menu { display: flex; flex-direction: column; gap: 8px; min-width: 250px; max-width: min(92vw,330px); padding: 12px; border: 1px solid var(--he-border-light); border-radius: var(--he-radius); background: rgba(20,20,26,.97); box-shadow: 0 16px 40px rgba(0,0,0,.75); }
            .he-fullscreen-menu[hidden] { display: none !important; }
            .he-control-group { display: flex; flex-direction: column; gap: 5px; }
            .he-control-group > span { color: var(--he-muted); font-size: 11px; font-weight: 750; text-transform: uppercase; }
            .he-fullscreen-menu .he-segmented { width: 100%; }
            .he-fullscreen-menu .he-seg { flex: 1; min-width: 0; padding: 6px 7px; font-size: 10px; }
            .he-menu-action { width: 100%; justify-content: flex-start; border: 1px solid var(--he-border); background: rgba(14,14,20,.8); }
            .he-menu-action.active { color: #fff; background: var(--he-grad); }
            .he-menu-action:disabled, .he-fullscreen-menu .he-seg:disabled { opacity: .4; cursor: not-allowed; }
            #he-fullscreen-navigation { position: fixed; inset: 0; z-index: 10001; display: flex; align-items: center; justify-content: space-between; padding: 0 18px; pointer-events: none; }
            #he-fullscreen-navigation.is-vertical { inset: auto 18px auto auto; top: 50%; flex-direction: column; gap: 8px; padding: 0; transform: translateY(-50%); }
            .he-nav-arrow { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 72px; padding: 0; border: 1px solid rgba(255,255,255,.2); border-radius: 12px; color: rgba(255,255,255,.82); background: rgba(18,18,24,.58); box-shadow: 0 8px 24px rgba(0,0,0,.45); backdrop-filter: blur(8px); cursor: pointer; pointer-events: auto; }
            .he-nav-arrow:hover { color: #fff; border-color: var(--he-accent); background: rgba(51,178,239,.78); }
            .he-nav-arrow svg { width: 26px; height: 26px; }
            .he-reader-native-hidden, .he-reader-source-hidden { display: none !important; }

            @media (min-width: 769px) and (max-width: 1100px) {
                .he-topbar-inner { gap: 8px; }
                .he-topbar-left { gap: 4px; }
                .he-logo { min-width: 72px; }
                .he-logo img { height: 36px; max-width: 90px; }
                .he-top-link { gap: 4px; padding-left: 6px; padding-right: 6px; font-size: 11px; }
                .he-top-link svg { width: 14px; height: 14px; }
                .he-top-search { width: min(24vw, 250px); }
                .he-auth-links { gap: 0; }
                .he-auth-links a { padding-left: 4px; padding-right: 4px; font-size: 9px; }
            }
            @media (min-width: 769px) {
                .container { padding-left: 0 !important; padding-right: 0 !important; }
            }
            @media (min-width: 769px) and (max-width: 900px) {
                .he-primary-links .he-top-link span { display: none; }
                .he-auth-links { display: none; }
            }

            @media (max-width: 768px) {
                body { padding-top: 56px !important; padding-bottom: 70px; }
                .container:has(#he-reader) { padding-left: 0 !important; padding-right: 0 !important; }
                #he-topbar { height: 52px; justify-content: space-between; gap: 8px; padding: 0 10px; }
                .he-topbar-inner { display: flex; width: 100%; gap: 8px; }
                .he-topbar-left { grid-column: auto; flex: 1 1 auto; gap: 8px; }
                .he-mobile-only { display: inline-flex !important; }
                .he-primary-links, .he-top-search, .he-auth-links { display: none; }
                .he-logo { position: absolute; left: 50%; min-width: 0; transform: translateX(-50%); font-size: 14px; }
                .he-logo img { height: 34px; max-width: 100px; }
                .he-icon-button { width: 36px; height: 36px; border: 0; }
                .row.galleries { grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; padding-top: 10px; }
                .row.galleries > h1, .row.galleries > h2 { font-size: 18px !important; }
                .row.galleries .gallery_title { height: auto !important; min-height: 0 !important; max-height: none !important; padding: 7px 8px 9px !important; font-size: 11px !important; line-height: 1.35 !important; }
                .row.galleries .gallery_title a, .row.galleries .thumbnail .g_text a, .row.galleries .thumbnail:hover .g_text a { height: auto !important; max-height: 6.75em !important; padding: 0 !important; }
                #he-filter-bar { width: 100%; margin: 0; padding: 8px 0 2px; gap: 6px; }
                .he-filter-line-primary { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 6px; }
                .he-filter-search { grid-column: 1 / -1; width: 100%; min-width: 0; }
                .he-filter-line-options { display: grid; grid-template-columns: 1fr; gap: 7px; }
                .he-filter-group { width: 100%; flex: none; flex-wrap: nowrap; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
                .he-filter-group::-webkit-scrollbar { display: none; }
                .he-filter-label, .he-filter-chip { flex: 0 0 auto; }
                .he-filter-sort { margin-left: auto; }
                .he-card-lang { top: 6px; left: 6px; width: 23px; height: 18px; }
                .he-card-pages { top: 6px; right: 6px; min-width: 24px; height: 18px; padding: 0 5px; font-size: 10px; }
                #he-topbar { transition: transform .22s ease; }
                body.he-scroll-down #he-topbar { transform: translateY(-110%); }
                #he-bottom-nav { position: fixed; inset: auto 0 0; z-index: 10000; display: flex; height: 60px; align-items: stretch; justify-content: space-around; border-top: 1px solid var(--he-border); background: rgba(10,10,14,.97); backdrop-filter: blur(20px); transition: transform .22s ease; }
                body.he-scroll-down #he-bottom-nav { transform: translateY(110%); }
                .he-bottom-item { display: flex; flex: 1 1 20%; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 5px 2px; border: 0; color: var(--he-muted); background: transparent; font-size: 10px; text-decoration: none; cursor: pointer; }
                .he-bottom-item svg { width: 20px; height: 20px; }
                .he-bottom-item.active, .he-bottom-item:hover, .he-bottom-search { color: var(--he-accent); }
                .he-search-overlay { align-items: flex-end; padding: 0; }
                .he-search-box { width: 100vw; max-height: 96dvh; border-radius: 17px 17px 0 0; }
                .he-search-form { padding: 12px; }
                .he-search-input-wrap { min-height: 68px; }
                .he-search-input-wrap input { height: 68px; font-size: 19px; }
                .he-search-submit { min-width: 78px; min-height: 68px; }
                .he-search-filters { padding: 0 12px 4px; }
                #he-filter-bar { padding-top: 10px; }
                .he-filter-line-options { grid-template-columns: 1fr; gap: 8px; }
                .he-filter-group { flex-wrap: wrap; }
                .he-filter-line-secondary { justify-content: space-between; }
                .gallery_first { width: 100% !important; max-width: 100% !important; margin-top: 10px !important; }
                .he-gallery-actions { gap: 7px; padding-left: 2px !important; padding-right: 2px !important; }
                .he-gallery-actions .he-gallery-action { min-width: 32px; padding-left: 6px !important; padding-right: 6px !important; }
                .he-gallery-actions .he-action-secondary { gap: 3px; }
                #he-media-toolbar { flex-direction: column; align-items: stretch; width: var(--he-content-width); }
                .he-toolbar-main, .he-toolbar-options { justify-content: space-between; flex-wrap: wrap; }
                .he-toolbar-options { display: none; }
                #he-media-toolbar .he-toolbar-control, #he-media-toolbar [data-he-width] { display: none !important; }
                .he-toolbar-main > .he-segmented { width: 100%; }
                .he-toolbar-main > .he-segmented .he-seg { flex: 1; }
                #he-reader:not(.he-reader-fullscreen) { width: 100vw; max-width: none; margin-left: calc(50% - 50vw); margin-right: calc(50% - 50vw); }
                #he-reader:not(.he-reader-fullscreen) .he-reader-pages { width: 100vw; max-width: none; }
                #he-reader:not(.he-reader-fullscreen) .he-reader-page { width: 100%; max-width: none; border-right: 0; border-left: 0; border-radius: 0; }
                #he-reader:not(.he-reader-fullscreen).he-reader-fit-height .he-reader-page { width: 100%; height: auto; max-width: none; aspect-ratio: auto; }
                #he-reader:not(.he-reader-fullscreen).he-reader-fit-height .he-reader-page img,
                #he-reader:not(.he-reader-fullscreen).he-reader-fit-height .he-reader-page.is-done .he-page-image { position: static; width: 100%; height: auto; object-fit: contain; }
                #he-reader:not(.he-reader-fullscreen).he-reader-manhwa .he-reader-pages { width: 100vw; max-width: none; }
                #he-fullscreen-navigation { display: none !important; }
                #he-fullscreen-controls { right: 10px; bottom: calc(70px + env(safe-area-inset-bottom)); }
                .he-fullscreen-menu { min-width: min(250px, calc(100vw - 20px)); }
            }
        `);
    }

    // =====================================================================
    // Route lifecycle
    // =====================================================================
    let lastUrl = location.href;
    let scrollChromeBound = false;

    function bindScrollChrome() {
        if (scrollChromeBound) return;
        scrollChromeBound = true;
        let previousY = Math.max(0, window.scrollY || 0);
        let framePending = false;

        const update = () => {
            framePending = false;
            const currentY = Math.max(0, window.scrollY || 0);
            if (currentY < 16 || currentY < previousY - 5) {
                document.body.classList.remove("he-scroll-down");
            } else if (currentY > previousY + 5) {
                document.body.classList.add("he-scroll-down");
            }
            previousY = currentY;
        };

        window.addEventListener("scroll", () => {
            if (framePending) return;
            framePending = true;
            requestAnimationFrame(update);
        }, { passive: true });
    }

    function resetRouteEnhancements() {
        listingGeneration += 1;
        if (galleryReaderRetryTimer) {
            clearTimeout(galleryReaderRetryTimer);
            galleryReaderRetryTimer = null;
        }
        infiniteScrollObserver?.disconnect();
        infiniteScrollObserver = null;
        nextListingUrl = null;
        listingFetching = false;
        listingRetryRequired = false;
        if (listingContinuationFrame) {
            cancelAnimationFrame(listingContinuationFrame);
            listingContinuationFrame = 0;
        }
        if (listingViewportCheckFrame) {
            cancelAnimationFrame(listingViewportCheckFrame);
            listingViewportCheckFrame = 0;
        }
        infiniteScrollSentinel?.remove();
        infiniteScrollSentinel = null;
        document.querySelector("#he-scroll-status")?.remove();
        document.querySelector("#he-filter-bar")?.remove();
        document.querySelectorAll(".he-native-filter-hidden").forEach((node) => node.classList.remove("he-native-filter-hidden"));
        document.querySelector("#he-media-toolbar")?.remove();
        document.querySelector("#he-reader")?.remove();
        document.querySelector("#he-fullscreen-controls")?.remove();
        document.querySelector("#he-fullscreen-navigation")?.remove();
        document.querySelectorAll("#thumbs_gallery_div, #show_more_row").forEach((node) => node.classList.remove("he-reader-source-hidden"));
        document.querySelector(".gallery_view")?.classList.remove("he-reader-native-hidden");
        document.body.classList.remove("he-reader-fullscreen-active");
        document.body.classList.remove("he-scroll-down");
        readerImageObserver?.disconnect();
        readerImageObserver = null;
        galleryActionsObserver?.disconnect();
        galleryActionsObserver = null;
    }

    function runEnhancements() {
        setupNavigation();
        injectBottomNav();
        buildSearchPalette();
        setupFilterBar();
        if (isListingRoute()) {
            syncAllCards();
            initInfiniteScroll();
        }
        if (isGalleryRoute()) setupGalleryReader();
    }

    function handleRouteChange() {
        if (location.href === lastUrl) return;
        lastUrl = location.href;
        resetRouteEnhancements();
        runEnhancements();
    }

    function bindHistory() {
        if (window.__heHistoryBound) return;
        window.__heHistoryBound = true;
        ["pushState", "replaceState"].forEach((method) => {
            const original = history[method];
            history[method] = function (...args) {
                const result = original.apply(this, args);
                window.dispatchEvent(new Event("he-route-change"));
                return result;
            };
        });
        window.addEventListener("popstate", () => window.dispatchEvent(new Event("he-route-change")));
        window.addEventListener("he-route-change", debounce(handleRouteChange, 80));
        const observer = new MutationObserver(debounce(() => {
            if (location.href !== lastUrl) handleRouteChange();
            else {
                if (!document.querySelector("#he-topbar")) setupNavigation();
                setupFilterBar();
                if (isListingRoute()) {
                    syncAllCards();
                }
                if (isGalleryRoute() && (!document.querySelector("#he-media-toolbar") || !document.querySelector("#react_row.he-gallery-actions"))) setupGalleryReader();
            }
        }, 180));
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    function init() {
        injectStyles();
        bindReaderKeyboard();
        const start = () => { bindScrollChrome(); bindHistory(); runEnhancements(); };
        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
        else start();
    }

    init();
})();
