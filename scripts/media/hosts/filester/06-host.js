    // Prefixo de classe deste host (core/toast.js e demais partes do core).
    const MEDIA_PREFIX = "fl";
    // Tema do core (core/css.js): função (hoisted) porque o CSS do host é montado antes desta parte.
    function mediaTheme() { return { p: "fl", accent: "#14b8a6", accentRgb: "20,184,166", accentLight: "#99f6e4", onAccent: "#04221e" }; }