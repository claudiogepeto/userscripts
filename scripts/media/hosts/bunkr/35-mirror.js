    // ===== TROCAR MIRROR = trocar de DOMÍNIO (pós-migração do Bunkr, cada domínio aponta pra um mirror diferente:
    // às vezes o arquivo falha num e funciona noutro). Botão no canto sup-direito do player → menu de domínios →
    // abre o MESMO caminho/arquivo no domínio escolhido. Edite MIRRORS conforme os domínios ativos do Bunkr. =====
    const MIRRORS = [
        "bunkr.cr", "bunkr.ph", "bunkr.ru", "bunkr.si", "bunkr.fi", "bunkr.ws", "bunkr.ax",
        "bunkr.black", "bunkr.media", "bunkr.site", "bunkr.pk", "bunkr.la", "bunkr.su", "bunkr.ci",
        "bunkr.is", "bunkr.sk", "bunkr.red", "bunkr.cat", "bunkr.nl", "bunkr.ac", "bunkr.se",
        "bunkr.cc", "bunkr.to", "bunkr.ps", "bunkr.pm", "bunkrr.su", "bunkrr.red", "bunkrr.ru",
        "bunkrr.ax", "bunkrr.ws", "bunkrr.si", "bunkrr.to", "bunkrr.sk", "bunkrr.pm", "bunkrr.la",
        "bunkrr.cr", "bunkrr.is", "bunkrr.ac", "bunkrr.cat", "bunkrr.nl", "bunkrr.se", "bunkrr.cc",
        "bunkrr.black", "bunkrr.media", "bunkrr.site", "bunkrr.pk", "bunkrr.ci", "bunkrr.ph",
        "bunkrr.fi", "bunkrr.ps", "bunkr.lv", "bunkrr.lv",
        "bunkr.at", "bunkrr.at", "bunkr.bi", "bunkrr.bi", "bunkr.by", "bunkrr.by",
        "bunkr.bz", "bunkrr.bz", "bunkr.cm", "bunkrr.cm", "bunkr.cx", "bunkrr.cx",
        "bunkr.li", "bunkrr.li", "bunkr.my", "bunkrr.my", "bunkr.sx", "bunkrr.sx",
        "bunkr.tv", "bunkrr.tv", "bunkr.space", "bunkrr.space", "bunkr.fit", "bunkrr.fit",
        "bunkr.click", "bunkrr.click"
    ];
    const MIRROR_HEALTH_KEY = "bunkr-mirror-health";
    const MIRROR_HEALTH_TTL = 30 * 60 * 1000;
    const mirrorHealth = (() => {
        try {
            const saved = JSON.parse(localStorage.getItem(MIRROR_HEALTH_KEY) || "{}");
            return saved && typeof saved === "object" ? saved : {};
        } catch { return {}; }
    })();
    const mirrorMissingByFile = new Map();
    const testingMirrors = new Set();
    let mirrorMenuOpen = false;
    let mirrorProgress = null;
    function saveMirrorHealth() {
        try {
            const persistent = {};
            for (const [domain, entry] of Object.entries(mirrorHealth)) if (entry.state !== "missing") persistent[domain] = entry;
            localStorage.setItem(MIRROR_HEALTH_KEY, JSON.stringify(persistent));
        } catch {}
    }
    function setMirrorHealth(domain, state) {
        if (state === "missing") mirrorMissingByFile.set(domain + location.pathname, true);
        else { mirrorHealth[domain] = { state, checkedAt: Date.now() }; saveMirrorHealth(); }
        if (mirrorProgress) mirrorProgress();
    }
    function freshMirrorHealth(domain) {
        if (mirrorMissingByFile.has(domain + location.pathname)) return { state: "missing", checkedAt: 0 };
        const entry = mirrorHealth[domain];
        if (entry && Date.now() - (entry.checkedAt || 0) > MIRROR_HEALTH_TTL) delete mirrorHealth[domain];
        return mirrorHealth[domain] || null;
    }
    function requestText(url, options = {}) {
        return new Promise(resolve => {
            if (typeof GM_xmlhttpRequest !== "function") return resolve({ error: new Error("GM_xmlhttpRequest unavailable") });
            let done = false;
            const finish = value => { if (done) return; done = true; resolve(value); };
            try {
                GM_xmlhttpRequest({
                    method: options.method || "GET", url, timeout: options.timeout || 6000,
                    headers: options.headers || {}, data: options.data,
                    onload: response => finish({ status: response.status, finalUrl: response.finalUrl || url, responseText: response.responseText || "", contentType: response.responseHeaders?.match(/^content-type:\s*([^\r\n]+)/im)?.[1] || "" }),
                    onerror: error => finish({ error }),
                    ontimeout: () => finish({ timedOut: true }),
                });
            } catch (error) { finish({ error }); }
        });
    }
    async function probeMirror(domain, pathAndSearch = location.pathname + location.search) {
        const response = await requestText("https://" + domain + pathAndSearch, { timeout: 6000 });
        const result = classifyMirrorPage({ requestedHost: domain, status: response.status, finalUrl: response.finalUrl, html: response.responseText, error: response.error, timedOut: response.timedOut });
        setMirrorHealth(domain, result.state);
        return Object.assign({ domain }, result);
    }
    function currentMirrorHealth() {
        const health = {};
        for (const domain of MIRRORS) health[domain] = freshMirrorHealth(domain) || { state: "unknown", checkedAt: 0 };
        return health;
    }
    async function findWorking(path, options = {}) {
        const want = Math.max(1, options.want || 1), exclude = new Set(options.exclude || []);
        const candidates = orderMirrors(MIRRORS.filter(domain => !exclude.has(domain)), currentMirrorHealth(), "");
        let cursor = 0, active = 0, found = [], settled = false;
        return new Promise(resolve => {
            const finishIfDone = () => {
                if (!settled && active === 0 && cursor >= candidates.length) { settled = true; resolve(found); }
            };
            const run = () => {
                while (active < 8 && cursor < candidates.length && (found.length < want || mirrorMenuOpen)) {
                    const domain = candidates[cursor++];
                    const known = freshMirrorHealth(domain);
                    if (known?.state === "down" && Date.now() - known.checkedAt < MIRROR_HEALTH_TTL) { options.onUpdate?.({ domain, state: "down", found: found.slice() }); continue; }
                    active++;
                    testingMirrors.add(domain); options.onTesting?.(domain);
                    probeMirror(domain, path).then(result => {
                        if (result.state === "ok" && !found.includes(domain)) found.push(domain);
                        options.onUpdate?.(Object.assign({ found: found.slice() }, result));
                    }).finally(() => { testingMirrors.delete(domain); options.onSettled?.(domain); active--; run(); finishIfDone(); });
                }
                if (!settled && found.length >= want && !mirrorMenuOpen) { settled = true; resolve(found); }
                finishIfDone();
            };
            run();
        });
    }
    async function signedMediaUrl(domain, slug, sign) {
        if (!sign) return null;
        if (sign.type === "api") {
            const response = await requestText("https://" + domain + "/api/sign/" + encodeURIComponent(slug), { timeout: 6000 });
            if (response.error || response.timedOut || response.status !== 200) return null;
            try { const data = JSON.parse(response.responseText); return data.ok && data.url ? data.url : null; } catch { return null; }
        }
        if (sign.type === "inline") {
            const response = await requestText(sign.signUrl + "?path=" + encodeURIComponent(decodeURIComponent(new URL(sign.cdn).pathname)), { timeout: 6000 });
            if (response.error || response.timedOut || response.status < 200 || response.status >= 300) return null;
            try {
                const data = JSON.parse(response.responseText), url = new URL(sign.cdn);
                for (const [key, value] of Object.entries(data)) if (["token", "ex"].includes(key)) url.searchParams.set(key, value);
                return url.href;
            } catch { return null; }
        }
        return null;
    }
    async function checkMedia(url) {
        const response = await requestText(url, { timeout: 8000, headers: { Range: "bytes=0-0" } });
        return classifyMediaProbe({ status: response.status, contentType: response.contentType, error: response.error, timedOut: response.timedOut });
    }
    function isMirrorFilePage() {
        // dl.bunkr.* is the direct download host, not a page mirror to fail over.
        if (/^dl\.bunkr\./i.test(location.hostname)) return false;
        return location.pathname !== "/" && location.pathname !== "";
    }
    function showMirrorSearchPanel(text) {
        let panel = document.querySelector(".bunkr-mirror-search");
        if (!panel) {
            panel = document.createElement("div"); panel.className = "bunkr-mirror-search";
            (document.body || document.documentElement).appendChild(panel);
        }
        panel.textContent = text;
        return panel;
    }
    async function handleCurrentMirrorPage() {
        const result = classifyMirrorPage({ requestedHost: location.hostname, status: 200, finalUrl: location.href, html: document.documentElement.outerHTML });
        let tried = [];
        try { tried = JSON.parse(sessionStorage.getItem("bunkr-mirror-tried:" + location.pathname) || "[]"); } catch {}
        if (!Array.isArray(tried)) tried = [];
        const current = location.hostname.replace(/^www\./, "");
        if (result.state === "ok") {
            try { sessionStorage.removeItem("bunkr-mirror-tried:" + location.pathname); } catch {}
            return true;
        }
        if (!tried.includes(current)) tried.push(current);
        try { sessionStorage.setItem("bunkr-mirror-tried:" + location.pathname, JSON.stringify(tried)); } catch {}
        const panel = showMirrorSearchPanel("Procurando este arquivo em outros mirrors… 0 testados · 0 funcionando");
        const counts = { ok: 0, missing: 0, down: 0 };
        for (const domain of tried) {
            const state = domain === current ? result.state : freshMirrorHealth(domain)?.state;
            if (state && counts[state] !== undefined) counts[state]++;
        }
        let tested = tried.length;
        const results = await findWorking(location.pathname + location.search, {
            want: 1, exclude: tried,
            onUpdate: result => {
                if (result.state) { tested++; counts[result.state] = (counts[result.state] || 0) + 1; }
                panel.textContent = "Procurando este arquivo em outros mirrors… " + tested + " testados · " + counts.ok + " funcionando";
            },
        });
        mirrorProgress = null;
        if (results.length) {
            const target = results[0];
            tried.push(target);
            try { sessionStorage.setItem("bunkr-mirror-tried:" + location.pathname, JSON.stringify(tried)); } catch {}
            location.replace(location.protocol + "//" + target + location.pathname + location.search + location.hash);
            return false;
        }
        panel.textContent = "Este arquivo não existe em nenhum mirror ativo · " + counts.ok + " funcionando, " + counts.missing + " sem arquivo, " + counts.down + " indisponíveis. Tentados: " + tried.join(", ");
        return false;
    }
    function mediaBox() {
        return document.querySelector("#video-container")
            || document.querySelector(".rounded-lg section > div.mx-auto")
            || [...document.querySelectorAll(".rounded-lg")].find(b => !b.closest("header"));   // ignora a nav do header (tbm é .rounded-lg)
    }
    function nextMirror() { return nextWorking(MIRRORS, currentMirrorHealth(), location.hostname.replace(/^www\./, ""), 1); }
    function isVideoWorking() {
        const v = document.querySelector(".bunkr-video") || document.querySelector(".bunkr-stage video, #video-wrapper video, #player");
        return !!(v && (v.currentTime > 0 || v.readyState >= 2 || !v.paused));
    }
    function dismissMirrorWarn() {
        document.querySelectorAll(".bunkr-mirror-warn").forEach(w => w.remove());
        setMirrorTesting(false);
    }
    // aviso "mirror fora" no topo do player + botão pro próximo mirror
    function suggestMirror(reason, target = nextMirror()) {
        if (isVideoWorking()) {
            dismissMirrorWarn();
            return;
        }
        const box = document.querySelector(".bunkr-stage .bunkr-stage-mid") || mediaBox();   // no stage o aviso vai sobre a mídia; senão, no box antigo
        if (!box || box.querySelector(".bunkr-mirror-warn")) return;
        if (getComputedStyle(box).position === "static") box.style.position = "relative";
        const nd = target;
        if (!nd) return;
        const warn = document.createElement("div"); warn.className = "bunkr-mirror-warn";
        warn.innerHTML = "<div><b>⚠ Esse mirror pode estar fora</b> " + (reason ? "<span>· " + reason + "</span>" : "") + "</div>";
        const a = document.createElement("a"); a.className = "bunkr-mirror-warn-btn"; a.textContent = "Tentar " + nd + " →";
        a.href = location.protocol + "//" + nd + location.pathname + location.search + location.hash;
        warn.appendChild(a);
        const x = document.createElement("button"); x.className = "bunkr-mirror-warn-x"; x.type = "button";
        x.setAttribute("aria-label", "Dispensar"); x.title = "Dispensar"; x.innerHTML = svgi('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>');
        x.addEventListener("click", () => warn.remove());
        warn.appendChild(x);
        box.appendChild(warn);
    }
    let playerRecovery = null, errorHooksBound = false, recoverySwaps = 0, recoveryRunning = false, recoveryExhausted = false;
    function cancelRecovery() {
        if (playerRecovery) clearTimeout(playerRecovery);
        playerRecovery = null;
        dismissMirrorWarn();
    }
    function realVideo() { return document.querySelector(".bunkr-video") || document.querySelector(".bunkr-stage video, #video-wrapper video, #player"); }
    function bindPlayerRecovery() {
        if (errorHooksBound) return;
        const video = realVideo();
        if (!video) return;
        errorHooksBound = true;
        ["play", "playing", "timeupdate", "loadeddata"].forEach(event => video.addEventListener(event, cancelRecovery));
        video.addEventListener("error", () => {
            if (!video.error || isVideoWorking() || recoveryRunning || recoveryExhausted) return;
            recoverPlayerSource(video);
        });
    }
    function swapPlayerSource(video, url) {
        const currentTime = video.currentTime || 0, wasPaused = video.paused;
        video.src = url;
        try { video.load(); if (!wasPaused) video.play().catch(() => {}); else video.currentTime = currentTime; } catch {}
        video.addEventListener("loadedmetadata", () => { try { video.currentTime = currentTime; if (!wasPaused) video.play().catch(() => {}); } catch {} }, { once: true });
    }
    async function recoverPlayerSource(video) {
        recoveryRunning = true;
        try {
            const page = classifyMirrorPage({ requestedHost: location.hostname, status: 200, finalUrl: location.href, html: document.documentElement.outerHTML });
            const slug = (location.pathname.match(/\/(?:f|v|i)\/([^/]+)/) || [])[1];
            if (!slug || !page.sign) {
                recoveryExhausted = true;
                suggestMirror("erro ao reproduzir");
                return;
            }

            const current = location.hostname.replace(/^www\./, "");
            if (recoverySwaps >= 2) {
                recoveryExhausted = true;
                suggestMirror("a fonte continua indisponível");
                return;
            }

            if (recoverySwaps === 0) {
                const sameMirrorUrl = await signedMediaUrl(current, slug, page.sign);
                if (sameMirrorUrl) {
                    const status = await checkMedia(sameMirrorUrl);
                    if (status === "missing") { showMediaMissing(); recoveryExhausted = true; return; }
                    if (status === "ok") {
                        recoverySwaps++;
                        swapPlayerSource(video, sameMirrorUrl);
                        toast("Fonte recarregada");
                        return;
                    }
                }
            }

            const working = await findWorking(location.pathname + location.search, { want: 1, exclude: [current] });
            const mirror = working[0];
            if (mirror) {
                const result = await probeMirror(mirror);
                const url = await signedMediaUrl(mirror, slug, result.sign || page.sign);
                if (url) {
                    const media = await checkMedia(url);
                    if (media === "missing") { showMediaMissing(); recoveryExhausted = true; return; }
                    if (media === "ok") {
                        recoverySwaps++;
                        swapPlayerSource(video, url);
                        toast("Fonte recarregada");
                        return;
                    }
                }
            }
            recoveryExhausted = true;
            suggestMirror("a fonte continua indisponível", nextWorking(MIRRORS, currentMirrorHealth(), current, 1));
        } finally {
            recoveryRunning = false;
        }
    }
    function showMediaMissing() {
        const box = document.querySelector(".bunkr-stage .bunkr-stage-mid") || mediaBox();
        if (!box || box.querySelector(".bunkr-mirror-warn")) return;
        const warn = document.createElement("div"); warn.className = "bunkr-mirror-warn";
        warn.textContent = "Arquivo indisponível no CDN — trocar de mirror não resolve";
        box.appendChild(warn);
    }
    function testMirror() {
        bindPlayerRecovery();
    }

