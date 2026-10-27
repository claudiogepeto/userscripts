    // Bloqueia o loader conhecido e neutraliza as APIs de anúncio no contexto da página.
    const PAGE_GUARD = document.createElement("script");
    PAGE_GUARD.textContent = `
        (() => {
            const noop = () => undefined;
            const stub = Object.freeze(new Proxy({}, { get: () => noop }));
            try { Object.defineProperty(window, "aclib", { value: stub, writable: false, configurable: false }); } catch {}

            const open = window.open;
            window.open = function (url, ...args) {
                try {
                    const host = new URL(url, location.href).hostname.toLowerCase();
                    const isBunkrHost = /^(?:www\.)?bunkrr?\.[a-z0-9.-]+$/i.test(host);
                    if (host === location.hostname.toLowerCase() || (isBunkrHost && !/^ads\./i.test(host))) return open.call(this, url, ...args);
                } catch {}
                return null;
            };
        })();
    `;
    document.documentElement.appendChild(PAGE_GUARD);
    PAGE_GUARD.remove();

    GM_addStyle(`
        [data-bpid], .bunkr-ad-banner, .bunkr-ad-frame, .bunkr-ad-overlay,
        .bunkr-ad-slot, .ad-slot, .adsbybunkr, [id^="ad-slot"], [id^="ad-container"],
        [class^="ad-slot"], [class*=" ad-slot"], [class*="advertisement"] {
            display: none !important;
        }
    `);

    const AD_PLAYER_HOSTS = new Set([
        "youtube.com", "www.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com",
        "vimeo.com", "player.vimeo.com", "dailymotion.com", "www.dailymotion.com",
        "streamtape.com", "streamtape.to", "voe.sx", "doodstream.com", "filemoon.sx",
        "mixdrop.co", "mp4upload.com",
    ]);

    function markOverlay(node) {
        if (!(node instanceof Element) || node.parentElement !== document.body) return;
        if ([...node.classList].some(name => name.startsWith(MEDIA_PREFIX))) return;
        const style = getComputedStyle(node);
        if (style.position !== "fixed" && style.position !== "absolute") return;
        const rect = node.getBoundingClientRect();
        if (rect.width >= innerWidth * 0.9 && rect.height >= innerHeight * 0.9 &&
            rect.left <= innerWidth * 0.1 && rect.top <= innerHeight * 0.1) {
            node.classList.add("bunkr-ad-overlay");
        }
    }

    function inspectAdded(root) {
        if (!(root instanceof Element)) return;
        const candidates = [root, ...root.querySelectorAll("script, iframe, [data-bpid], center, [style*='fixed' i], [style*='absolute' i]")];
        for (const node of candidates) {
            if (node.matches("script")) {
                const src = node.getAttribute("src");
                let isAdLoader = false;
                if (src) {
                    try {
                        const url = new URL(src, location.href);
                        const adHost = /^ads\.(?:www\.)?(?:bunkr|bunkrr)\.[a-z0-9.-]+$/i.test(url.hostname);
                        isAdLoader = ((url.hostname === "b-cdn.net" || url.hostname.endsWith(".b-cdn.net")) && url.pathname.endsWith("/w.js")) || adHost;
                    } catch {}
                }
                const hasAdCall = node.textContent.includes("aclib.");
                if (isAdLoader || hasAdCall) {
                    node.closest("center")?.classList.add("bunkr-ad-banner");
                    node.closest("[id*='ad' i], [class*='ad-slot' i], [class*='banner' i]")?.classList.add("bunkr-ad-slot");
                    node.remove();
                    continue;
                }
            }

            if (node.matches("[data-bpid]")) node.closest("center")?.classList.add("bunkr-ad-banner");

            if (node.matches("iframe")) {
                const src = node.getAttribute("src");
                try {
                    const url = new URL(src || "", location.href);
                    const knownPlayer = AD_PLAYER_HOSTS.has(url.hostname.toLowerCase()) ||
                        !!node.closest("#video-container, #video-wrapper, .plyr");
                    if (url.origin !== location.origin && !knownPlayer) node.classList.add("bunkr-ad-frame");
                } catch {
                    node.classList.add("bunkr-ad-frame");
                }
            }

            markOverlay(node);
        }
    }

    function markExistingAds() {
        document.querySelectorAll("[data-bpid]").forEach(node => node.closest("center")?.classList.add("bunkr-ad-banner"));
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", markExistingAds, { once: true });
    else markExistingAds();

    new MutationObserver(records => {
        for (const record of records) {
            for (const node of record.addedNodes) inspectAdded(node);
        }
    }).observe(document.documentElement, { childList: true, subtree: true });
