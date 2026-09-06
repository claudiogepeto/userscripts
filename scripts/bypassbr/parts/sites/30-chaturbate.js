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
