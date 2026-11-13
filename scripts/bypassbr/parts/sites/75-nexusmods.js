    if (BypassBR.hostIs('nexusmods.com')) {
        const AGE_GATE_SELECTOR = 'iframe[src*="k-id" i], iframe[src*="agekey" i], [data-testid*="age-verification" i], [class*="age-verification" i], [id*="age-verification" i]';
        const AGE_GATE_TEXT_RE = /age verification|verify (?:your )?age|k-id|agekey|must be 18|18 years old/i;

        const hideLegalAgeVerification = () => {
            document.querySelectorAll(AGE_GATE_SELECTOR).forEach(element => {
                const dialog = element.closest('[role="dialog"], [aria-modal="true"]');
                (dialog || element).style.setProperty('display', 'none', 'important');
            });
            document.querySelectorAll('[role="dialog"], [aria-modal="true"]').forEach(dialog => {
                if (AGE_GATE_TEXT_RE.test(dialog.textContent || '')) {
                    dialog.style.setProperty('display', 'none', 'important');
                }
            });
        };

        BypassBR.onReady(hideLegalAgeVerification);
        BypassBR.observeDocument(hideLegalAgeVerification);
    }
