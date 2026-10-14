    // core/05-styles.js
    // Owns: the one <style id="smg-styles"> node, composed from the CSS_* fragments in a fixed order.
    // Exposes: injectStyles.
    // Depends on: every CSS_* constant (styles/*.js and */css-*.js).
    // =========================================================
    // STYLES: compose context-owned CSS fragments in one deterministic style node.
    // Shared contexts live in parts/styles/, feature-owned ones in parts/<feature>/css-*.js,
    // so a page change does not require searching through a monolithic template literal.
    // =========================================================
    function injectStyles() {
        const css = CSS_BASE + CSS_MEDIA_GRIDS + CSS_MEDIA_IMAGES + CSS_SOCIAL_EMBEDS + CSS_MEDIA_PLAYERS + CSS_HOME + CSS_TOPBAR + CSS_NOTICES + CSS_ALERTS + CSS_DOCK + CSS_SEARCH + CSS_MEDIA_FEED + CSS_DOCK_MOBILE + CSS_LISTING_CONTROLS + CSS_SETTINGS + CSS_MOBILE + CSS_FILTERBAR + CSS_THREAD + CSS_THREAD_CARDS + CSS_POST_CARDS + CSS_COMMENTS + CSS_FEED + CSS_ALERTDOCK + CSS_PAINT;
        const style = document.createElement('style');
        style.id = 'smg-styles';
        style.textContent = css;

        // document-start: <head> pode ainda não existir → cai pro documentElement (o <style> aplica igual)
        (document.head || document.documentElement).appendChild(style);
    }
