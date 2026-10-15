    // Prefixo de classe deste host (core/toast.js e demais partes do core).
    const MEDIA_PREFIX = "pdx";
    // Tema do core (core/css.js): função (hoisted) porque o CSS do host é montado antes desta parte.
    function mediaTheme() { return { p: "pdx", accent: "#ffffff", accentRgb: "255,255,255", accentLight: "#ffffff", onAccent: "#000000" }; }