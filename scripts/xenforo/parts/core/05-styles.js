    // =========================================================
    // STYLES: compose context-owned CSS fragments in one deterministic style node.
    // The fragments live in parts/styles/ so a page change does not require editing
    // this runtime composer or searching through a monolithic template literal.
    // =========================================================
    function injectStyles() {
        const css = CSS_BASE + CSS_HOME + CSS_TOPBAR + CSS_MOBILE + CSS_FILTERBAR + CSS_THREAD + CSS_FEED + CSS_ALERTDOCK + CSS_PAINT;
        const style = document.createElement('style');
        style.id = 'smg-styles';
        style.textContent = css;

        // document-start: <head> pode ainda não existir → cai pro documentElement (o <style> aplica igual)
        (document.head || document.documentElement).appendChild(style);
    }
