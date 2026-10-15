    /* ===================== PREFS & HELPERS ===================== */
    const PREFS_KEY = "turbo_prefs";
    const prefs = Object.assign({
        volume: 1,
        muted: false,
        rate: 1,
        loop: false,
        autoplay: true,
        sidebarCollapsed: false,
        groupByType: false,
        sidebarTab: "all",
        sidebarSort: "default"
    }, (() => {
        try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; }
    })());
    let saveT;
    const saveP = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {} }, 250); };
