    if (BypassBR.hostIs('spankbang.com', 'spankbang.party')) {
        BypassBR.addStyle('bypassbr-spankbang', `
            .strong-blur {
                filter: none !important;
                -webkit-filter: none !important;
                backdrop-filter: none !important;
            }
            div[class*="fixed"][class*="z-[1201]"],
            #cookie-consent,
            [data-testid="simple-av-banner"],
            [data-testid="cookie-consent-banner"] {
                display: none !important;
                visibility: hidden !important;
                pointer-events: none !important;
            }
            html, body { overflow: auto !important; }
        `);

        const clean = () => {
            BypassBR.removeAll([
                '#safety-blur',
                '#av-wrapper',
                '[data-testid="simple-av-banner"]',
                '[data-testid="cookie-consent-banner"]',
                'div[aria-label="Explicit content locked"]',
                '.i_icon-lock-18',
                'svg .i_icon-lock-18',
                'div[class*="bg-surface-black/"]',
            ]);
            document.querySelectorAll('img.strong-blur').forEach(image => image.classList.remove('strong-blur'));
            document.documentElement?.classList.remove('overflow-hidden');
            document.body?.classList.remove('overflow-hidden');
        };

        BypassBR.onReady(clean);
        BypassBR.observeDocument(clean);
    }
