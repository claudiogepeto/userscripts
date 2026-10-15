    /* ===================== CORE: ROTAS SPA (scripts/media/core/history.js) ===================== */
    // Envolve pushState/replaceState (+ popstate) em vez de checar a URL por intervalo.
    function onHistoryChange(fn) {
        const w = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
        const h = w.history;
        const fire = () => setTimeout(fn, 0);
        for (const m of ["pushState", "replaceState"]) {
            const orig = h[m];
            if (typeof orig !== "function") continue;
            const wrapped = function () { const r = orig.apply(this, arguments); fire(); return r; };
            try { h[m] = typeof exportFunction === "function" ? exportFunction(wrapped, w) : wrapped; } catch (e) {}
        }
        window.addEventListener("popstate", fire);
    }
