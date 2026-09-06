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
