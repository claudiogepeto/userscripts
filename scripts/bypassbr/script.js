// ==UserScript==
// @name         BypassBR
// @namespace    claudiogepeto-bypassbr
// @version      1.1.0
// @description  Site-specific adapters for age gates and sensitive media restrictions.
// @author       claudiogepeto
// @match        *://x.com/*
// @match        *://twitter.com/*
// @match        *://mobile.twitter.com/*
// @match        *://spankbang.com/*
// @match        *://*.spankbang.com/*
// @match        *://spankbang.party/*
// @match        *://*.spankbang.party/*
// @match        *://chaturbate.com/*
// @match        *://*.chaturbate.com/*
// @match        *://erome.com/*
// @match        *://*.erome.com/*
// @match        *://pornhub.com/*
// @match        *://*.pornhub.com/*
// @match        *://sex.com/*
// @match        *://*.sex.com/*
// @run-at       document-start
// @noframes
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';
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
    if (BypassBR.hostIs('x.com', 'twitter.com')) {
        const SENSITIVE_RE = /TweetWithVisibilityResults|TweetTombstone|TweetPreviewDisplay|possibly_sensitive|sensitive_media|media_availability|limited_action|withheld|soft_interventions/i;
        const WRAPPER_TYPES = new Set(['TweetWithVisibilityResults', 'TweetTombstone', 'TweetPreviewDisplay']);
        const getUrl = resource => typeof resource === 'string'
            ? resource
            : resource?.url || resource?.href || String(resource || '');
        const isGraphQL = url => getUrl(url).includes('/graphql/');
        const CLEAR_KEYS = new Set([
            'interstitial',
            'tweet_visibility_info',
            'visibility_reason',
            'profile_interstitial',
            'limited_actions',
            'limited_action_results',
            'tweetInterstitials',
            'soft_interventions',
        ]);

        const isObject = value => value !== null && typeof value === 'object';
        const isTweet = value => isObject(value) && (
            value.__typename === 'Tweet'
            || value.__typename === undefined && isObject(value.legacy) && 'full_text' in value.legacy
        );

        const unwrap = value => {
            let current = value;
            const visited = new Set();
            while (isObject(current) && WRAPPER_TYPES.has(current.__typename)) {
                if (visited.has(current)) return value;
                visited.add(current);
                const next = current.tweet || current.tweet_results?.result || current.quoted_status_result?.result;
                if (!isObject(next)) return value;
                current = next;
            }
            if (!isTweet(current)) return value;
            if (!current.__typename) current.__typename = 'Tweet';
            return current;
        };

        const sanitizeMediaItem = item => {
            if (!isObject(item)) return;
            if (isObject(item.media_availability)) item.media_availability.status = 'available';
            if (isObject(item.media_availability_v2)) {
                item.media_availability_v2.status = 'Available';
                item.media_availability_v2.reason = null;
            }
            if ('sensitive_media_warning' in item) item.sensitive_media_warning = null;
            if ('ext_sensitive_media_warning' in item) item.ext_sensitive_media_warning = null;
            if (isObject(item.features) && 'sensitive_media_warning' in item.features) {
                item.features.sensitive_media_warning = null;
            }
        };

        const sanitizeMediaList = list => {
            if (Array.isArray(list)) list.forEach(sanitizeMediaItem);
        };

        const sanitizeLegacy = legacy => {
            if (!isObject(legacy)) return;
            if ('possibly_sensitive' in legacy) legacy.possibly_sensitive = false;
            if ('possibly_sensitive_editable' in legacy) legacy.possibly_sensitive_editable = false;
            if ('sensitive_media_warning' in legacy) legacy.sensitive_media_warning = null;
            if ('ext_sensitive_media_warning' in legacy) legacy.ext_sensitive_media_warning = null;
            if ('withheld_in_countries' in legacy) legacy.withheld_in_countries = null;
            if ('withheld_scope' in legacy) legacy.withheld_scope = null;
            sanitizeMediaList(legacy.extended_entities?.media);
            sanitizeMediaList(legacy.entities?.media);
        };

        const sanitizeTweet = tweet => {
            if (!isObject(tweet)) return;
            sanitizeLegacy(tweet.legacy);
            if ('possibly_sensitive' in tweet) tweet.possibly_sensitive = false;
            if ('possibly_sensitive_editable' in tweet) tweet.possibly_sensitive_editable = false;
            CLEAR_KEYS.forEach(key => {
                if (key in tweet) delete tweet[key];
            });
            sanitizeMediaItem(tweet);
            sanitizeMediaItem(tweet.media_results?.result);
            sanitizeMediaList(tweet.media_entities);
        };

        const sanitizeUser = user => {
            if (!isObject(user)) return;
            user.has_graduated_access = true;
            user.safety_mode = false;
            delete user.profile_interstitial;
        };

        const processNode = node => {
            if (!isObject(node)) return node;
            if (WRAPPER_TYPES.has(node.__typename)) return unwrap(node);
            if (node.__typename === 'Tweet' || isTweet(node)) sanitizeTweet(node);
            else if (node.__typename === 'User') sanitizeUser(node);
            return node;
        };

        const sanitizeGraph = root => {
            if (!isObject(root)) return root;
            const actualRoot = processNode(root);
            const seen = new WeakSet();
            const stack = [actualRoot];

            while (stack.length) {
                const node = stack.pop();
                if (!isObject(node) || seen.has(node)) continue;
                seen.add(node);
                processNode(node);

                if (Array.isArray(node)) {
                    node.forEach((value, index) => {
                        if (!isObject(value)) return;
                        const processed = processNode(value);
                        if (processed !== value) node[index] = processed;
                        stack.push(processed);
                    });
                    continue;
                }

                Object.keys(node).forEach(key => {
                    const value = node[key];
                    if (!isObject(value)) return;
                    const processed = processNode(value);
                    if (processed !== value) node[key] = processed;
                    stack.push(processed);
                });
            }
            return actualRoot;
        };

        const transformText = text => {
            if (typeof text !== 'string' || !SENSITIVE_RE.test(text)) return text;
            try { return JSON.stringify(sanitizeGraph(JSON.parse(text))); } catch (error) { return text; }
        };

        if (typeof window.fetch === 'function' && !window.__bypassBrTwitterFetch) {
            window.__bypassBrTwitterFetch = true;
            const nativeFetch = window.fetch;
            window.fetch = function (...args) {
                const resource = args[0];
                const url = getUrl(resource);
                return Promise.resolve(Reflect.apply(nativeFetch, this, args)).then(response => {
                    if (!response || !response.ok || !isGraphQL(url)) return response;

                    const originalJson = typeof response.json === 'function' ? response.json.bind(response) : null;
                    const originalText = typeof response.text === 'function' ? response.text.bind(response) : null;
                    if (originalJson) response.json = async () => sanitizeGraph(await originalJson());
                    if (originalText) response.text = async () => transformText(await originalText());
                    return response;
                });
            };
        }

        if (typeof XMLHttpRequest !== 'undefined' && !XMLHttpRequest.prototype.__bypassBrTwitterXHR) {
            const proto = XMLHttpRequest.prototype;
            proto.__bypassBrTwitterXHR = true;
            const nativeOpen = proto.open;
            const xhrCache = new WeakMap();
            nativeOpen && (proto.open = function (method, url, ...rest) {
                this.__bypassBrTwitterGraph = isGraphQL(url);
                xhrCache.delete(this);
                return nativeOpen.call(this, method, url, ...rest);
            });

            ['responseText', 'response'].forEach(property => {
                const descriptor = Object.getOwnPropertyDescriptor(proto, property);
                if (!descriptor?.get) return;
                Object.defineProperty(proto, property, {
                    ...descriptor,
                    get() {
                        const raw = descriptor.get.call(this);
                        if (!this.__bypassBrTwitterGraph || this.readyState !== 4) return raw;
                        let values = xhrCache.get(this);
                        if (!values) {
                            values = new Map();
                            xhrCache.set(this, values);
                        }
                        if (values.has(property)) return values.get(property);

                        let transformed = raw;
                        if (property === 'responseText') {
                            if (this.responseType === '' || this.responseType === 'text') transformed = transformText(raw);
                        } else if (this.responseType === 'json' && isObject(raw)) {
                            transformed = sanitizeGraph(raw);
                        } else if ((this.responseType === '' || this.responseType === 'text') && typeof raw === 'string') {
                            transformed = transformText(raw);
                        }
                        values.set(property, transformed);
                        return transformed;
                    },
                });
            });
        }

        BypassBR.addStyle('bypassbr-twitter', `
            [data-testid="tweetPhoto"] img,
            [data-testid="videoPlayer"] video,
            [data-testid="videoComponent"] video,
            img[style*="blur"], video[style*="blur"] {
                filter: none !important;
                -webkit-filter: none !important;
            }
            div[style*="backdrop-filter: blur"],
            div[style*="backdrop-filter:blur"] {
                display: none !important;
            }
        `);

        try {
            const opts = 'max-age=31536000; path=/; SameSite=Lax';
            document.cookie = `opt_in_to_sensitive_media=true; domain=.x.com; ${opts}`;
            document.cookie = `opt_in_to_sensitive_media=true; domain=.twitter.com; ${opts}`;
            localStorage.setItem('has_seen_sensitive_warning', 'true');
        } catch (error) {}
    }
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
    if (BypassBR.hostIs('chaturbate.com')) {
        const isObject = value => value !== null && typeof value === 'object';
        const AGE_KEYS = new Set([
            'user_age_gated',
            'age_gated',
            'age_restricted',
            'requires_age_verification',
        ]);

        const mutateAgeFlags = root => {
            if (!root || typeof root !== 'object') return root;
            const seen = new WeakSet();
            const stack = [root];
            while (stack.length) {
                const node = stack.pop();
                if (!node || typeof node !== 'object' || seen.has(node)) continue;
                seen.add(node);
                Object.keys(node).forEach(key => {
                    if (AGE_KEYS.has(key)) node[key] = false;
                    else if (node[key] && typeof node[key] === 'object') stack.push(node[key]);
                });
            }
            return root;
        };

        const transformText = text => {
            if (typeof text !== 'string') return text;
            try { return JSON.stringify(mutateAgeFlags(JSON.parse(text))); } catch (error) { return text; }
        };

        try {
            const currentContext = window.$reactAppContext;
            let reactContext = isObject(currentContext) ? mutateAgeFlags(currentContext) : currentContext;
            Object.defineProperty(window, 'hide_entrance_terms', {
                get: () => true,
                set: () => {},
                configurable: true,
            });
            Object.defineProperty(window, '$reactAppContext', {
                get: () => reactContext,
                set: value => { reactContext = mutateAgeFlags(value); },
                configurable: true,
            });
        } catch (error) {}

        const syncReactContext = () => {
            try {
                const context = window.$reactAppContext;
                if (!isObject(context)) return false;
                mutateAgeFlags(context);
                return context.user_age_gated === false;
            } catch (error) {
                return false;
            }
        };

        if (typeof window.setInterval === 'function') {
            let attempts = 0;
            const contextTimer = window.setInterval(() => {
                if (syncReactContext() || ++attempts >= 200) window.clearInterval?.(contextTimer);
            }, 10);
        }

        const chatContext = url => String(url || '').match(/\/api\/chatvideocontext\/([^/?#]+)/i);
        const isAgeGate = text => /age-gate-required|age_gate_required/i.test(String(text || ''));
        const CHAT_CONTEXT_DEFAULTS = {
            room_pass: '',
            last_pass: '',
            chat_rules: '',
            is_supporter: false,
            needs_supporter_to_pm: false,
            apps_running: '',
            allow_private_shows: false,
            private_show_price: 0,
            private_min_minutes: 0,
            allow_show_recordings: false,
            allow_anonymous_tipping: false,
            spy_private_show_price: 0,
            private_show_id: '',
            low_satisfaction_score: false,
            is_age_verified: false,
            hidden_message: '',
            following: false,
            follow_notification_frequency: '',
            is_moderator: false,
            token_balance: 0,
            has_studio: false,
            is_mobile: false,
            ignored_emoticons: [],
            hide_satisfaction_score: false,
            tips_in_past_24_hours: 0,
            last_vote_in_past_90_days_down: false,
            dismissible_messages: [],
            show_mobile_site_banner_link: false,
            fan_club_is_member: false,
            performer_has_fanclub: false,
            fan_club_paid_with_tokens: false,
            satisfaction_score: { up_votes: 0, down_votes: 0, percent: 0 },
            tfa_enabled: false,
            chat_settings: {
                font_color: '',
                font_family: '',
                font_size: '',
                show_emoticons: true,
                emoticon_autocomplete_delay: 0,
                highest_token_color: '',
                sort_users_key: 'alphabetical',
                mod_expire: 0,
                room_entry_for: 'all',
                room_leave_for: 'all',
                c2c_notify_limit: 0,
                silence_broadcasters: '',
                ignored_users: '',
                allowed_chat: '',
                tip_volume: 50,
                collapse_notices: false,
            },
            asp_auth_url: '',
            asp_app_directory_v3_enabled: false,
            browser_id: '',
            userlist_color: '',
            active_password: false,
            is_tip_menu_enabled: false,
        };

        const buildChatContext = (preview, room) => {
            const source = isObject(preview) ? preview : {};
            const context = {
                ...CHAT_CONTEXT_DEFAULTS,
                ...source,
                chat_settings: {
                    ...CHAT_CONTEXT_DEFAULTS.chat_settings,
                    ...(isObject(source.chat_settings) ? source.chat_settings : {}),
                },
                broadcaster_username: source.broadcaster_username || room,
                room_uid: source.room_uid || '',
                room_title: source.room_title || '',
                room_status: source.room_status || 'offline',
                viewer_username: source.viewer_username || '',
                broadcaster_gender: source.broadcaster_gender || '',
                hls_source: source.hls_source || '',
                is_widescreen: Boolean(source.is_widescreen),
                is_portrait: Boolean(source.is_portrait),
                edge_region: source.edge_region || '',
                exploring_hashtag: source.exploring_hashtag || '',
                source_name: source.source_name || '',
                age: source.age || 0,
                num_viewers: source.num_viewers || 0,
                cmaf_edge: Boolean(source.cmaf_edge),
                user_age_gated: false,
                age_gated: false,
            };
            return mutateAgeFlags(context);
        };

        const responseWithPayload = (payload, room) => new Response(JSON.stringify(buildChatContext(payload, room)), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        });

        if (typeof window.fetch === 'function' && !window.__bypassBrChaturbateFetch) {
            window.__bypassBrChaturbateFetch = true;
            const nativeFetch = window.fetch.bind(window);
            const wrapResponse = response => {
                const originalJson = typeof response.json === 'function' ? response.json.bind(response) : null;
                const originalText = typeof response.text === 'function' ? response.text.bind(response) : null;
                if (originalJson) response.json = async () => mutateAgeFlags(await originalJson());
                if (originalText) response.text = async () => transformText(await originalText());
                return response;
            };

            window.fetch = function (resource, init) {
                const url = typeof resource === 'string' ? resource : resource?.url || '';
                return nativeFetch(resource, init).then(async response => {
                    const match = chatContext(url);
                    if (match && response.status === 403) {
                        const body = await response.clone().text();
                        if (isAgeGate(body)) {
                            try {
                                const fallback = await nativeFetch(`/api/livecampreviewcontext/${match[1]}/`, {
                                    credentials: 'include',
                                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                                });
                                if (fallback.ok) return responseWithPayload(await fallback.json(), match[1]);
                            } catch (error) {}
                        }
                    }
                    return match ? wrapResponse(response) : response;
                });
            };
        }

        if (typeof XMLHttpRequest !== 'undefined' && !XMLHttpRequest.prototype.__bypassBrChaturbateXHR) {
            const proto = XMLHttpRequest.prototype;
            proto.__bypassBrChaturbateXHR = true;
            const nativeOpen = proto.open;
            const nativeSend = proto.send;

            proto.open = function (method, url, ...rest) {
                const match = chatContext(url);
                this.__bypassBrChatUrl = match ? String(url) : '';
                this.__bypassBrChatRoom = match?.[1] || '';
                this.__bypassBrChatMethod = method || 'GET';
                return nativeOpen.call(this, method, url, ...rest);
            };

            proto.send = function (...args) {
                if (!this.__bypassBrChatUrl || typeof window.fetch !== 'function') return nativeSend.apply(this, args);
                const xhr = this;
                const requestArgs = args;
                const finish = (status, body) => {
                    const transformed = transformText(body);
                    const parsed = xhr.responseType === 'json' ? BypassBR.safeJson(transformed) : transformed;
                    try {
                        Object.defineProperties(xhr, {
                            readyState: { value: 4, configurable: true },
                            status: { value: status, configurable: true },
                            statusText: { value: status === 200 ? 'OK' : 'Error', configurable: true },
                            responseText: { value: transformed, configurable: true },
                            response: { value: parsed, configurable: true },
                        });
                    } catch (error) {}
                    if (status >= 200 && status < 400) xhr.onload?.();
                    else xhr.onerror?.();
                };

                window.fetch(xhr.__bypassBrChatUrl, {
                    method: xhr.__bypassBrChatMethod,
                    credentials: 'include',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                }).then(async response => {
                    let status = response.status;
                    let body = await response.text();
                    if (status === 403 && isAgeGate(body)) {
                        try {
                            const fallback = await window.fetch(`/api/livecampreviewcontext/${xhr.__bypassBrChatRoom}/`, {
                                credentials: 'include',
                                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                            });
                            if (fallback.ok) {
                                status = 200;
                                body = JSON.stringify(buildChatContext(await fallback.json(), xhr.__bypassBrChatRoom));
                            }
                        } catch (error) {}
                    }
                    finish(status, body);
                }).catch(() => {
                    xhr.__bypassBrChatUrl = '';
                    nativeSend.apply(xhr, requestArgs);
                });
            };
        }

        BypassBR.addStyle('bypassbr-chaturbate', `
            #age_gate_overlay,
            .overlay[aria-modal="true"],
            [data-testid="age-gate"] {
                display: none !important;
                visibility: hidden !important;
                pointer-events: none !important;
                position: fixed !important;
                left: -10000px !important;
                z-index: -9999 !important;
            }
            html.age-gate--shown *,
            body.entrance-terms--shown *,
            [class*="blur"] {
                filter: none !important;
                -webkit-filter: none !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
            }
            img, video, canvas {
                filter: none !important;
                -webkit-filter: none !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
            }
            html, body { overflow: auto !important; }
            .ad, .vote-banner, #ad_unit, .ad-unit, .ad-container, .ad-wrapper,
            [class*="ad-slot"], [class*="ads-container"],
            iframe[src*="doubleclick"], iframe[src*="googlesyndication"] {
                display: none !important;
            }
        `);

        const GATE_CLASSES = ['age-gate--shown', 'entrance-terms--shown'];
        const stripGateClasses = node => GATE_CLASSES.forEach(className => node?.classList.remove(className));
        const clean = () => {
            stripGateClasses(document.documentElement);
            stripGateClasses(document.body);
        };

        const isRoomPage = () => /^\/[a-z0-9_-]+\/?$/i.test(location.pathname);
        const upgradeImage = image => {
            if (!isRoomPage()) return;
            const source = image.currentSrc || image.src;
            if (!source || !source.includes('thumb.live.mmcdn.com') || source.includes('/minifwap/')) return;
            try {
                const url = new URL(source, location.href);
                const filename = url.pathname.split('/').pop();
                if (!filename) return;
                image.src = `https://thumb.live.mmcdn.com/minifwap/${filename}`;
                image.removeAttribute('srcset');
                image.removeAttribute('data-src');
            } catch (error) {}
        };

        const upgradeImages = root => {
            if (root?.matches?.('img')) upgradeImage(root);
            root?.querySelectorAll?.('img').forEach(upgradeImage);
        };

        const watchBodyClasses = () => {
            if (!document.body) return;
            stripGateClasses(document.body);
            new MutationObserver(() => stripGateClasses(document.body)).observe(document.body, {
                attributes: true,
                attributeFilter: ['class'],
            });
        };

        BypassBR.onReady(() => {
            clean();
            watchBodyClasses();
            if (isRoomPage()) upgradeImages(document);
        });

        if (isRoomPage()) {
            const imageObserver = new MutationObserver(mutations => mutations.forEach(mutation => {
                if (mutation.type === 'attributes') upgradeImage(mutation.target);
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) upgradeImages(node);
                });
            }));
            const imageObserverTarget = document.documentElement || document;
            imageObserver.observe(imageObserverTarget, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['src', 'srcset'],
            });
        }
    }
    if (BypassBR.hostIs('erome.com')) {
        const getCookie = name => {
            const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
            return match ? BypassBR.decodeCookieValue(match[1]) : null;
        };

        const clearDisclaimer = () => {
            const disclaimer = document.getElementById('disclaimer');
            const enterButton = document.querySelector('.enter');
            if (!disclaimer || !enterButton || window.__bypassBrEromeBusy) return;
            window.__bypassBrEromeBusy = true;

            const csrf = document.querySelector('meta[name="csrf-token"]')?.content
                || document.querySelector('input[name="_token"]')?.value
                || getCookie('XSRF-TOKEN');
            const headers = { 'X-Requested-With': 'XMLHttpRequest' };
            if (csrf) headers['X-CSRF-TOKEN'] = csrf;

            fetch('/user/disclaimer', {
                method: 'POST',
                credentials: 'same-origin',
                headers,
            }).then(response => {
                if (!response.ok) throw new Error(`Erome disclaimer request failed: ${response.status}`);
                disclaimer.remove();
                if (document.body) document.body.style.overflow = 'visible';
                location.reload();
            }).catch(() => {
                window.__bypassBrEromeBusy = false;
                enterButton.click();
            });
        };

        BypassBR.onReady(clearDisclaimer);
        BypassBR.observeDocument(clearDisclaimer);
    }
    if (BypassBR.hostIs('pornhub.com')) {
        const COOKIE = 'accessAgeDisclaimerPH=2';
        const EXPIRES = 'expires=Fri, 31 Dec 2038 23:59:59 GMT';

        try {
            if (!document.cookie.includes(COOKIE)) {
                document.cookie = `${COOKIE}; path=/; domain=.pornhub.com; ${EXPIRES}`;
                document.cookie = `${COOKIE}; path=/; ${EXPIRES}`;
                if (!sessionStorage.getItem('bypassbr-ph-age-reload')) {
                    sessionStorage.setItem('bypassbr-ph-age-reload', '1');
                    location.reload();
                }
            }
        } catch (error) {}
    }
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
})();
