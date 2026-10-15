    // Prefixo de classe deste host (core/toast.js e demais partes do core).
    const MEDIA_PREFIX = "tb";
    // Tema do core (core/css.js): função (hoisted) porque o CSS do host é montado antes desta parte.
    function mediaTheme() { return { p: "tb", accent: "#f97316", accentRgb: "249,115,22", accentLight: "#fdba74", onAccent: "#1c0a00" }; }