    // Classificação pura das respostas dos mirrors; mantida sem DOM para teste e uso no probe.
    function classifyMirrorPage(input) {
        const host = String(input.requestedHost || "").replace(/^www\./i, "").toLowerCase();
        const html = String(input.html || input.responseText || "").replace(/\\\//g, "/").replace(/\\u0026/gi, "&");
        const status = Number(input.status) || 0;
        const result = (state, reason, kind = null, sign = null) => ({ state, reason, kind, sign });
        if (input.error || input.timedOut || status === 0 || status >= 500 || status === 403 || status === 429) return result("down", input.timedOut ? "timeout" : (input.error ? "request error" : "server unavailable"));
        let finalHost = "";
        try { finalHost = new URL(input.finalUrl).hostname.replace(/^www\./i, "").toLowerCase(); } catch {}
        if (finalHost && finalHost !== host) return result("down", "offsite redirect");
        if (status === 404 || status === 410 || /<title>\s*(?:404\s*)?(?:file\s+)?not found|file not found|file does not exist/i.test(html)) return result("missing", "file not found");
        if (status < 200 || status >= 400) return result("down", "http " + status);
        const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "";
        if (/redirecting|just a moment|coming soon|is down|cloudflare/i.test(title) || !html.trim()) return result("down", "unavailable page");
        if (/id=["']galleryGrid["']|class=["'][^"']*files-album/i.test(html) && /\/a\//i.test(input.finalUrl || "")) return result("ok", "album page", "album");
        if (/id=["']video-container["']|id=["']video-wrapper["']/.test(html)) {
            const apiSlug = html.match(/\/api\/sign\/['"]\s*\+\s*['"]([\w-]+)/i);
            const api = /\/api\/sign\//i.test(html) && (apiSlug || html.match(/\/api\/sign\/([\w-]+)/i) || html.match(/\/f\/([\w-]+)/i));
            if (api) return result("ok", "media page", "video", { type: "api", path: "/api/sign/" + api[1] });
            const cdnRaw = html.match(/\bjsCDN\s*=\s*['"]([^'"]+)['"]/i);
            const signRaw = html.match(/\bsignUrl\s*=\s*['"]([^'"]+)['"]/i);
            if (cdnRaw && signRaw) {
                const decode = value => value.replace(/\\\\/g, "\\").replace(/\\\//g, "/").replace(/\\u0026/gi, "&");
                return result("ok", "media page", "video", { type: "inline", cdn: decode(cdnRaw[1]), signUrl: decode(signRaw[1]) });
            }
        }
        if (/\/f\//i.test(input.finalUrl || "") && /<main\b/i.test(html)) {
            const image = /(?:og:type["']\s+content=["']image|id=["']image-container["']|var\s+jsCDN\s*=\s*["'][^"']+\.(?:jpe?g|png|gif|webp))/i.test(html);
            return result("ok", "file page", image ? "image" : "file", (() => {
                const cdnRaw = html.match(/\bjsCDN\s*=\s*['"]([^'"]+)['"]/i), signRaw = html.match(/\bsignUrl\s*=\s*['"]([^'"]+)['"]/i);
                return cdnRaw && signRaw ? { type: "inline", cdn: cdnRaw[1].replace(/\\\//g, "/"), signUrl: signRaw[1] } : null;
            })());
        }
        return result("down", "unknown page");
    }

    function classifyMediaProbe(input) {
        if (input.error || input.timedOut) return "inconclusive";
        const status = Number(input.status) || 0;
        if (status === 404 || status === 410 || status === 403) return "missing";
        if ((status === 200 || status === 206) && /^text\/html\b/i.test(String(input.contentType || ""))) return "missing";
        if (status === 200 || status === 206) return "ok";
        return "inconclusive";
    }

    function orderMirrors(domains, health, current) {
        const rank = { ok: 0, unknown: 1, missing: 2, down: 3 };
        return domains.filter(domain => domain !== current).slice().sort((a, b) => {
            const ah = health[a], bh = health[b];
            const ar = rank[ah && ah.state] ?? rank.unknown, br = rank[bh && bh.state] ?? rank.unknown;
            return ar - br || (ar === 0 ? (bh.checkedAt || 0) - (ah.checkedAt || 0) : 0);
        });
    }

    function nextWorking(domains, health, current, direction) {
        if (!domains.length) return null;
        const step = direction < 0 ? -1 : 1;
        let index = domains.indexOf(current);
        for (let i = 0; i < domains.length; i++) {
            index = index < 0 ? (step > 0 ? 0 : domains.length - 1) : (index + step + domains.length) % domains.length;
            if (domains[index] !== current && health[domains[index]] && health[domains[index]].state === "ok") return domains[index];
        }
        return null;
    }
