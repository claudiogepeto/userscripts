    if (BypassBR.hostIs('sex.com')) {
        const AGE_COOKIE = 'sx_age_verified=1; path=/; max-age=31536000; SameSite=Lax';
        const AGE_MARKERS = '[data-testid="guest-blocker-modal"], [data-testid="guest-blocker-cta"]';
        let ageGateWasRequired = Boolean(document.documentElement?.hasAttribute('data-age-verification-required'));

        const setAgeCookie = () => {
            try {
                document.cookie = AGE_COOKIE;
                document.cookie = `${AGE_COOKIE}; domain=.sex.com`;
            } catch (error) {}
        };

        const unlockBody = () => {
            const body = document.body;
            if (!body) return;
            body.style.removeProperty('pointer-events');
            body.removeAttribute('data-scroll-locked');
        };

        const clearAgeRequirement = () => {
            const root = document.documentElement;
            if (!root) return;
            ageGateWasRequired ||= root.hasAttribute('data-age-verification-required');
            root.removeAttribute('data-age-verification-required');
        };

        const findAgeGateLayer = marker => {
            let node = marker.parentElement;
            while (node && node !== document.body) {
                if (node.matches?.('[data-state="open"].fixed.inset-0')) return node;
                node = node.parentElement;
            }

            const dialog = marker.closest?.('[role="dialog"]');
            const parent = dialog?.parentElement;
            if (parent?.matches?.('[data-state="open"]') && parent.contains(marker)) return parent;
            return null;
        };

        const removeAgeGate = () => {
            let removed = false;
            document.querySelectorAll(AGE_MARKERS).forEach(marker => {
                const layer = findAgeGateLayer(marker);
                if (!layer || !layer.isConnected) return;
                layer.remove();
                removed = true;
            });
            return removed;
        };

        const clean = () => {
            const hasAgeMarker = Boolean(document.querySelector(AGE_MARKERS));
            clearAgeRequirement();
            if (ageGateWasRequired || hasAgeMarker) unlockBody();
            return removeAgeGate();
        };

        setAgeCookie();
        clearAgeRequirement();

        let observer = null;
        const stopWatching = () => {
            observer?.disconnect();
            observer = null;
        };

        observer = BypassBR.observeDocument(() => {
            // The age gate is rendered only once during hydration. Stop observing
            // after removing it so React cannot be forced into a mutation loop.
            if (clean()) stopWatching();
        }, {
            childList: true,
            subtree: true,
        });

        BypassBR.onReady(() => {
            if (clean()) stopWatching();
            else if (!document.querySelector(AGE_MARKERS)) stopWatching();
        });
    }
