    // =========================================================
    // FEATURE: auto-load redgifs
    // =========================================================

    function autoLoadRedgifs(roots) {
        eachIn(roots, 'div.generic2wide-iframe-div[onclick*="redgifs"]:not([data-redgifs-autoloaded]):not([data-rg-done])', el => {
            if (el.querySelector('iframe')) { el.dataset.redgifsAutoloaded = 'true'; return; }
            el.dataset.redgifsAutoloaded = 'true';
            el.click();
        });
    }

    // =========================================================
    // FEATURE: auto-expand spoilers & spoiler enhancements
    // =========================================================

    function autoExpandSpoilers(roots) {
        // 1. Sempre decora os botões de spoiler com a seta
        eachIn(roots, '.bbCodeSpoiler-button:not([data-smg-arrow])', btn => {
            btn.dataset.smgArrow = '1';
            const arrow = document.createElement('span');
            arrow.className = 'smg-spoiler-arrow';
            arrow.innerHTML = ICONS.chevDown || `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;
            btn.appendChild(arrow);
        });

        // 2. Se a flag de auto-expand estiver desativada, não clica
        if (!FEATURES.autoExpandSpoilers) return;

        // 3. Auto-expande via clique nativo do Xenforo
        eachIn(roots, '.bbCodeSpoiler:not([data-auto-expanded])', spoiler => {
            const btn = spoiler.querySelector('.bbCodeSpoiler-button');
            const content = spoiler.querySelector('.bbCodeSpoiler-content');
            if (!btn || !content) return;

            spoiler.dataset.autoExpanded = 'true';

            const tryClick = () => {
                if (spoiler.classList.contains('is-open')) return;
                if (content.style.display && content.style.display !== 'none') return;
                btn.click();
            };

            tryClick();
            // Retentativa para cobrir timing de inicialização do JS do Xenforo
            setTimeout(tryClick, 250);
            setTimeout(tryClick, 750);
        });
    }

    if (typeof window !== 'undefined' && window.__TEST_MODE__) {
        window.__autoExpandSpoilers = autoExpandSpoilers;
    }
