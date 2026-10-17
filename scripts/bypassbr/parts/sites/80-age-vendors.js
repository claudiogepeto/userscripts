    if (!window.__bypassbrAgeVendorsInstalled) {
        window.__bypassbrAgeVendorsInstalled = true;

        const warn = error => console.warn('[BypassBR]', error);
        let agegoOptions = null;
        let agecheckerConfig = null;
        const ageverifHandlers = new Map();
        const ageverifCallbacks = new Set();

        const completeAgego = options => {
            const events = options?.events;
            if (!events) return;
            for (const name of ['onVerifiedBefore', 'onAgeVerify', 'onAPIVerify', 'onVerificationFlowEnd']) {
                if (typeof events[name] !== 'function') continue;
                events[name](name === 'onVerificationFlowEnd' ? {} : undefined);
                break;
            }
        };

        const processAgegoCall = call => {
            if (!Array.isArray(call) || !['configure', 'init'].includes(call[0])) return;
            const options = call[1];
            if (options && typeof options === 'object') agegoOptions = options;
            completeAgego(options);
        };

        const agegoStub = (...args) => processAgegoCall(args);
        const agegoSetter = value => {
            if (value && Array.isArray(value.e)) value.e.forEach(processAgegoCall);
        };

        const uniqueUuid = () => {
            try {
                if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID();
            } catch (error) { warn(error); }
            return `bypassbr-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        };

        const completeAgechecker = () => {
            const config = agecheckerConfig;
            if (!config) return;
            if (typeof config.onready === 'function') config.onready();
            if (typeof config.onstatuschanged === 'function') config.onstatuschanged({ status: 'accepted', uuid: uniqueUuid() });
            if (typeof config.redirect_url === 'string' && config.redirect_url.length > 0) {
                location.href = config.redirect_url;
                return;
            }
            if (typeof config.onclose === 'function') config.onclose();
            if (typeof config.onclosed === 'function') config.onclosed();
        };

        const agecheckerApi = {
            show: completeAgechecker,
            close: completeAgechecker,
        };

        const emitAgeverif = () => {
            const payload = { verified: true };
            ageverifHandlers.get('success')?.forEach(handler => handler(payload));
            ageverifCallbacks.forEach(callback => callback(payload));
        };

        const ageverifStub = {
            verified: true,
            requiresVerification: false,
            blur: () => {},
            unblur: () => {
                [document.documentElement, document.body].filter(Boolean).forEach(element => {
                    element.style.removeProperty('overflow');
                    element.style.removeProperty('filter');
                });
            },
            start: emitAgeverif,
            on: (event, handler) => {
                if (typeof handler !== 'function') return;
                if (!ageverifHandlers.has(event)) ageverifHandlers.set(event, new Set());
                ageverifHandlers.get(event).add(handler);
            },
            off: (event, handler) => ageverifHandlers.get(event)?.delete(handler),
            redirect: () => {},
            getRedirectUrl: () => '',
            getPortableVerification: () => null,
            setLanguage: () => {},
            clear: () => {},
            destroy: () => {},
        };

        const installWindowValue = (name, value, setter) => {
            try {
                Object.defineProperty(window, name, {
                    configurable: true,
                    enumerable: true,
                    get: () => value,
                    set: setter ?? (() => {}),
                });
            } catch (error) { warn(error); }
        };

        installWindowValue('AGEGO', agegoStub, agegoSetter);
        installWindowValue('AgeCheckerConfig', {}, value => {
            agecheckerConfig = value && typeof value === 'object' ? value : {};
            completeAgechecker();
        });
        installWindowValue('AgeCheckerAPI', agecheckerApi);
        installWindowValue('ageverif', ageverifStub);

        const classifyScript = source => {
            try {
                const url = new URL(source, location.href);
                const host = url.hostname.toLowerCase();
                const pathname = url.pathname.toLowerCase();
                const hostIs = domain => host === domain || host.endsWith(`.${domain}`);
                if (host === 'verifycdn.agego.com' || (host !== 'myapi.agego.com' && hostIs('agego.com') && pathname.includes('verify.js'))) return 'agego';
                if (host === 'cdn.agechecker.net') return 'agechecker';
                if (hostIs('ageverif.com') && pathname.includes('checker.js') && !pathname.includes('oauth') && !pathname.includes('authorize')) return 'ageverif';
            } catch (error) { warn(error); }
            return null;
        };

        const runAgeverifCallbacks = source => {
            try {
                const url = new URL(source, location.href);
                const payload = { verified: true };
                const pending = [];
                for (const key of ['onload', 'onready', 'onsuccess', 'onclose']) {
                    const name = url.searchParams.get(key);
                    if (!name) continue;
                    const call = () => {
                        if (typeof window[name] !== 'function') return false;
                        window[name](payload);
                        return true;
                    };
                    ageverifCallbacks.add(() => { call(); });
                    if (!call()) pending.push(call);
                }
                if (pending.length === 0) return;
                const retry = () => pending.forEach(call => call());
                if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', retry, { once: true });
                else retry();
            } catch (error) { warn(error); }
        };

        const neutralizeScript = (script, source) => {
            const vendor = classifyScript(source);
            if (!vendor) return false;
            try {
                script.type = 'text/plain';
                script.removeAttribute('src');
                script.textContent = '';
                if (vendor === 'agego') completeAgego(agegoOptions);
                if (vendor === 'agechecker') completeAgechecker();
                if (vendor === 'ageverif') {
                    runAgeverifCallbacks(source);
                    ageverifStub.unblur();
                }
            } catch (error) { warn(error); }
            return true;
        };

        const elementPrototype = Element.prototype;
        for (const method of ['appendChild', 'insertBefore', 'replaceChild']) {
            try {
                const original = elementPrototype[method];
                if (typeof original !== 'function') continue;
                Object.defineProperty(elementPrototype, method, {
                    configurable: true,
                    writable: true,
                    value: function (...args) {
                        const node = args[0];
                        if (node instanceof HTMLScriptElement) {
                            const source = node.getAttribute('src') ?? node.src;
                            if (source) neutralizeScript(node, source);
                        }
                        return original.apply(this, args);
                    },
                });
            } catch (error) { warn(error); }
        }

        try {
            const descriptor = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
            if (descriptor?.get && descriptor?.set) {
                Object.defineProperty(HTMLScriptElement.prototype, 'src', {
                    configurable: true,
                    enumerable: descriptor.enumerable,
                    get: descriptor.get,
                    set(value) {
                        if (!neutralizeScript(this, String(value))) descriptor.set.call(this, value);
                    },
                });
            }
        } catch (error) { warn(error); }
    }
