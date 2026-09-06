    const BypassBR = (() => {
        const host = location.hostname.toLowerCase();

        const schedule = fn => {
            if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(fn);
            else window.setTimeout(fn, 0);
        };

        const onReady = fn => {
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
            else fn();
        };

        const hostIs = (...domains) => domains.some(domain => host === domain || host.endsWith(`.${domain}`));

        const addStyle = (id, css) => {
            const mount = () => {
                if (document.getElementById(id)) return;
                const style = document.createElement('style');
                style.id = id;
                style.textContent = css;
                (document.head || document.documentElement)?.appendChild(style);
            };
            if (document.head || document.documentElement) mount();
            else new MutationObserver((_, observer) => {
                if (!document.documentElement) return;
                mount();
                observer.disconnect();
            }).observe(document, { childList: true, subtree: true });
        };

        const observeDocument = (callback, options = { childList: true, subtree: true }) => {
            let queued = false;
            const run = () => {
                if (queued) return;
                queued = true;
                schedule(() => {
                    queued = false;
                    try { callback(); } catch (error) { console.warn('[BypassBR]', error); }
                });
            };
            const target = document.documentElement || document;
            const observer = new MutationObserver(run);
            observer.observe(target, options);
            run();
            return observer;
        };

        const removeAll = (selectors, root = document) => {
            let removed = 0;
            selectors.forEach(selector => root.querySelectorAll(selector).forEach(node => {
                node.remove();
                removed++;
            }));
            return removed;
        };

        const safeJson = text => {
            try { return JSON.parse(text); } catch (error) { return null; }
        };

        const decodeCookieValue = value => {
            try { return decodeURIComponent(value); } catch (error) { return value; }
        };

        return { host, hostIs, onReady, addStyle, observeDocument, removeAll, safeJson, decodeCookieValue };
    })();
