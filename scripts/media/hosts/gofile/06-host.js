    // Prefixo de classe deste host (core/toast.js e demais partes do core).
    const MEDIA_PREFIX = "gf";
    // Tema do core (core/css.js): função (hoisted) porque o CSS do host é montado antes desta parte.
    function mediaTheme() { return { p: "gf", accent: "#f5c400", accentRgb: "245,196,0", accentLight: "#ffe066", onAccent: "#1a1400" }; }