    /* ====================================================================
     * v2.0 — PORT do pixeldrain: PLAYER PRÓPRIO (substitui o Plyr), ZOOM+PAN na
     * foto, e LOADING no botão de mirror. Helpers + ícones + builders abaixo.
     * ==================================================================== */
    function safeGetStorage(k, fallback = null) {
        try { const v = localStorage.getItem(k); return v != null ? v : fallback; } catch { return fallback; }
    }
    function safeSetStorage(k, v) {
        try { localStorage.setItem(k, v); } catch {}
    }

    const PREFS_KEY = "bunkr_prefs";
    const prefs = Object.assign({ volume: 1, muted: false, rate: 1, loop: false, autoplay: true },
        (() => { try { return JSON.parse(safeGetStorage(PREFS_KEY)) || {}; } catch { return {}; } })());
    let saveT; const saveP = () => { clearTimeout(saveT); saveT = setTimeout(() => { safeSetStorage(PREFS_KEY, JSON.stringify(prefs)); }, 250); };

    /* Formata data de envio do Bunkr ("HH:mm:ss DD/MM/YYYY") para "DD/MM/YYYY HH:mm" (sem segundos) */
    function formatUploadDate(ts) {
        if (!ts || typeof ts !== "string") return "";
        ts = ts.trim();
        const m = ts.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s+(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/);
        if (m) {
            const hh = m[1].padStart(2, "0"), mm = m[2];
            const day = m[3].padStart(2, "0"), month = m[4].padStart(2, "0"), year = m[5];
            return `${day}/${month}/${year} ${hh}:${mm}`;
        }
        const m2 = ts.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})\s+(\d{1,2}):(\d{2})/);
        if (m2) {
            return `${m2[1].padStart(2, "0")}/${m2[2].padStart(2, "0")}/${m2[3]} ${m2[4].padStart(2, "0")}:${m2[5]}`;
        }
        return ts;
    }

    /* Retorna timestamp numérico em ms para ordenação precisa por data de envio */
    function parseUploadTimestamp(ts) {
        if (!ts || typeof ts !== "string") return 0;
        ts = ts.trim();
        const m = ts.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s+(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
        if (m) {
            const hh = parseInt(m[1], 10), mm = parseInt(m[2], 10), ss = parseInt(m[3] || "0", 10);
            const day = parseInt(m[4], 10), month = parseInt(m[5], 10), year = parseInt(m[6], 10);
            return Date.UTC(year, month - 1, day, hh, mm, ss);
        }
        const d = new Date(ts);
        return isNaN(d.getTime()) ? 0 : d.getTime();
    }

    /* Extrai com precisão datas embutidas no nome do arquivo (ex.: 2026-08-16, 2026.07.26, 2026_05_26, [20260816], etc.) */

    /* Remove o prefixo/ocorrência de data do título deixando apenas o nome limpo do arquivo */

    // Ícones e controles do player vêm do core (core/player.js); o bunkr só acrescenta a marca.
    const PL_ICONS = Object.assign({}, MEDIA_ICONS, {
        bunkrMark: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true" style="display:block"><path d="M5 4h8a5 5 0 0 1 0 10H5V4zm0 8h8.5a5 5 0 0 1 0 10H5v-10zm3-5v4h5a2 2 0 1 0 0-4H8zm0 8v4h5.5a2 2 0 1 0 0-4H8z"/></svg>',
    });

    // Ganchos do bunkr para o player do core: navegação no álbum, download e denúncia da página.
    const BUNKR_PLAYER_HOOKS = {
        nav: dir => navFile(dir),
        download: src => {
            const dlA = document.querySelector('main a[href*="/file/"], a[href*="dl.bunkr"], a[href*="/d/"], a[download]');
            const a = document.createElement("a");
            a.href = (dlA && dlA.href) || src;
            a.download = "";
            a.rel = "noopener";
            a.click();
        },
        report: () => {
            const reportA = document.querySelector('main a[href*="abuse"], a[href*="report"]');
            if (reportA && reportA.href) window.open(reportA.href, "_blank");
            else window.open(location.origin + "/report", "_blank");
        },
    };

    /* substitui o Plyr pelo nosso player (lê o mp4 assinado que o Bunkr expõe; fallback: sem src, mantém o Plyr) */
    function getSrc() { const e = document.querySelector("#video-wrapper video source[src], #player source[src], #video-wrapper video[src], #player[src], #video-wrapper source[src]"); return (e && (e.getAttribute("src") || e.src)) || ""; }
    let playerMounted = false, mediaMounted = false;
    function mountOwnPlayer() {
        if (playerMounted) return;
        const mid = document.querySelector(".bunkr-stage.is-video .bunkr-stage-mid");
        if (!mid) return;                              // stage ainda não montado
        const src = getSrc();
        if (!src) return;                              // Plyr ainda não expôs o src (async) → tenta de novo no poll
        playerMounted = true; mediaMounted = true;
        const plyrV = document.querySelector("#video-wrapper video, #player");
        if (plyrV) { try { plyrV.pause(); plyrV.muted = true; } catch {} }   // mata o áudio do Plyr (engine vivo, atrás do stage)
        const ac = new AbortController();
        const video = el("video", { class: "bunkr-video", playsinline: "", preload: "metadata" });
        video.volume = prefs.volume; video.muted = prefs.muted;
        video.addEventListener("volumechange", () => { prefs.volume = video.volume; prefs.muted = video.muted; saveP(); }, { signal: ac.signal });
        video.addEventListener("error", () => suggestMirror("erro ao reproduzir"), { once: true });
        ["loadedmetadata", "loadeddata", "canplay", "playing", "timeupdate"].forEach(ev => {
            video.addEventListener(ev, dismissMirrorWarn, { signal: ac.signal });
        });
        const host = el("div", { class: "bunkr-host bunkr-pl" }, video);
        buildPlayerControls(host, video, src, ac, BUNKR_PLAYER_HOOKS);
        mid.appendChild(host);
        video.addEventListener("loadedmetadata", () => {
            if (!Number.isFinite(video.duration)) return;
            const text = fmtT(video.duration);
            const key = location.pathname;
            try { sessionStorage.setItem("bunkrdur:" + location.origin + key, text); sessionStorage.setItem("bunkrdur:" + key, text); } catch {}
            const badge = document.querySelector(".bunkr-playlist-item.is-current .bunkr-playlist-dur");
            if (badge) { badge.textContent = text; badge.hidden = false; }
        }, { signal: ac.signal });
        video.src = src; try { video.load(); } catch {}
    }

    /* foto: busca robusta da imagem principal da página (suporta .rounded-lg, #image-container, picture, data-src, etc.) */
    function findPageImage() {
        const imgs = Array.from(document.querySelectorAll("img")).filter(img => {
            if (img.closest("header, .bunkr-strip, .bunkr-sidebar, .bunkr-playlist-list, #related-files-grid, .grid-images, #galleryGrid")) return false;
            if (img.classList.contains("bunkr-strip-thumb") || img.classList.contains("bunkr-playlist-thumb") || img.classList.contains("grid-images_box-img")) return false;
            const src = img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("src") || img.src || "";
            if (!src || /logo|icon|avatar|favicon/i.test(src)) return false;
            return true;
        });

        // 1. Prioridade máxima: imagem de alta resolução (storage/media, cdn, token, sem /thumbs/)
        const fullRes = imgs.find(img => {
            const src = img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("src") || img.src || "";
            return !/\/thumbs\//i.test(src) && (/storage\/media/i.test(src) || /token=/i.test(src) || /cdn/i.test(src));
        });
        if (fullRes) return fullRes;

        // 2. Segunda prioridade: qualquer imagem que NÃO contenha /thumbs/
        const nonThumb = imgs.find(img => {
            const src = img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("src") || img.src || "";
            return !/\/thumbs\//i.test(src);
        });
        if (nonThumb) return nonThumb;

        // 3. Fallback: primeira imagem encontrada
        return imgs[0] || null;
    }

    /* barra de hover da foto: os mesmos atos do vídeo, sem timeline nem controles de playback */
    function appendImageChrome(host) {
        const mkAct = (ic, label, cb) => {
            const b = el("button", { type: "button", class: "bunkr-plc-act", title: label, "aria-label": label });
            b.innerHTML = ic;
            b.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); cb(); });
            return b;
        };
        const prevBtn = mkAct(PL_ICONS.prev, "Anterior no álbum", () => navFile(-1));
        const nextBtn = mkAct(PL_ICONS.next, "Próximo no álbum", () => navFile(1));
        const reportBtn = mkAct(PL_ICONS.flag, "Reportar abuso", () => {
            const reportA = document.querySelector('main a[href*="abuse"], a[href*="report"]');
            if (reportA && reportA.href) window.open(reportA.href, "_blank", "noopener");
            else window.open(location.origin + "/report", "_blank", "noopener");
        });
        const dlb = mkAct(PL_ICONS.download, "Baixar", () => {
            const dlA = document.querySelector('main a[href*="/file/"], a[href*="dl.bunkr"], a[href*="/d/"], a[download]');
            const img = host.querySelector(".bunkr-image");
            const targetUrl = (dlA && dlA.href) || (img && (img.currentSrc || img.src)) || "";
            if (!targetUrl) return;
            const a = document.createElement("a");
            a.href = targetUrl;
            a.download = "";
            a.rel = "noopener";
            a.target = "_blank";
            a.click();
        });
        const shareBtn = mkAct(PL_ICONS.share, "Compartilhar / Copiar link", () => {
            copyText(location.href).then(ok => {
                toast(ok ? "Link copiado!" : "Falha ao copiar link");
                if (ok) {
                    shareBtn.innerHTML = PL_ICONS.check;
                    setTimeout(() => { shareBtn.innerHTML = PL_ICONS.share; }, 1600);
                }
            });
        });
        const fsb = mkAct(PL_ICONS.expand, "Tela cheia (f)", () => {
            try {
                const target = document.querySelector(".bunkr-stage") || host;
                if (document.fullscreenElement) document.exitFullscreen();
                else target.requestFullscreen();
            } catch {}
        });
        const row = el("div", { class: "bunkr-plc-row" },
            el("div", { class: "bunkr-plc-left" }, prevBtn, nextBtn),
            el("div", { class: "bunkr-plc-right" }, reportBtn, dlb, shareBtn, fsb)
        );
        host.append(el("div", { class: "bunkr-plc-bottom" }, row));
    }

    /* foto: zoom em níveis (1x→2x→4x no clique) + drag pan (só a <img> é transformada; stage-mid clipa) */
    let zoomMounted = false;
    function mountPhotoZoom() {
        if (zoomMounted) return;
        const mid = document.querySelector(".bunkr-stage.is-image .bunkr-stage-mid");
        if (!mid) return;
        const img = findPageImage();
        if (!img) return;
        const realSrc = img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("data-url") || img.getAttribute("src") || img.src || "";
        if (!realSrc) return;
        zoomMounted = true; mediaMounted = true;
        const host = el("div", { class: "bunkr-img-host" });
        mid.appendChild(host);
        const newImg = el("img", {
            class: "bunkr-image",
            src: realSrc,
            alt: "",
            style: "opacity: 1 !important; filter: none !important; position: static !important; display: block !important;"
        });
        host.appendChild(newImg);
        appendImageChrome(host);
        const ZOOMS = [1, 2, 4]; let zi = 0, z = 1, tx = 0, ty = 0;
        const clampPan = () => {
            const stageW = mid.clientWidth || window.innerWidth;
            const stageH = mid.clientHeight || (window.innerHeight - 130);
            const imgW = newImg.clientWidth * z;
            const imgH = newImg.clientHeight * z;
            const mx = Math.max(0, (imgW - stageW) / 2);
            const my = Math.max(0, (imgH - stageH) / 2);
            tx = Math.max(-mx, Math.min(mx, tx));
            ty = Math.max(-my, Math.min(my, ty));
        };
        const applyTf = () => {
            newImg.style.transform = z === 1 ? "" : `translate(${tx}px,${ty}px) scale(${z})`;
            mid.classList.toggle("is-zoomed", z !== 1);
            host.classList.toggle("is-zoomed", z !== 1);
        };
        const setZoomIdx = i => { zi = ((i % ZOOMS.length) + ZOOMS.length) % ZOOMS.length; z = ZOOMS[zi]; if (z === 1) { tx = ty = 0; } else clampPan(); applyTf(); };
        let drag = null;
        newImg.addEventListener("pointerdown", e => { if (e.button) return; e.preventDefault(); drag = { x: e.clientX, y: e.clientY, tx, ty, moved: false }; try { newImg.setPointerCapture(e.pointerId); } catch {} });
        newImg.addEventListener("pointermove", e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true; if (z !== 1 && drag.moved) { tx = drag.tx + dx; ty = drag.ty + dy; clampPan(); applyTf(); } });
        const end = e => { if (!drag) return; const click = !drag.moved; drag = null; try { newImg.releasePointerCapture(e.pointerId); } catch {} if (click) setZoomIdx(zi + 1); };
        newImg.addEventListener("pointerup", end); newImg.addEventListener("pointercancel", end);
    }

    // maxBytes: pede só o começo do arquivo (Range) e nunca devolve mais que isso,
    // mesmo quando o servidor ignora o Range e manda o arquivo inteiro.
    function httpGet(url, maxBytes) {
        const headers = maxBytes ? { Range: `bytes=0-${maxBytes - 1}` } : undefined;
        const cap = text => (maxBytes && text.length > maxBytes ? text.slice(0, maxBytes) : text);
        return new Promise((resolve, reject) => {
            if (typeof GM_xmlhttpRequest === "function") {
                try {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: url,
                        headers,
                        timeout: 15000,
                        onload: res => {
                            if (res.status >= 200 && res.status < 400) resolve(cap(res.responseText || ""));
                            else reject(new Error("HTTP " + res.status));
                        },
                        onerror: err => reject(err),
                        ontimeout: () => reject(new Error("Timeout"))
                    });
                    return;
                } catch {}
            }
            fetch(url, { credentials: "omit", headers })
                .then(async res => {
                    if (!res.ok) throw new Error("HTTP " + res.status);
                    if (!maxBytes || !res.body || !res.body.getReader) return cap(await res.text());
                    const reader = res.body.getReader();
                    const chunks = [];
                    let total = 0;
                    while (total < maxBytes) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        chunks.push(value);
                        total += value.length;
                    }
                    reader.cancel().catch(() => {});
                    const buf = new Uint8Array(Math.min(total, maxBytes));
                    let off = 0;
                    for (const c of chunks) {
                        const part = c.subarray(0, buf.length - off);
                        buf.set(part, off);
                        off += part.length;
                        if (off >= buf.length) break;
                    }
                    return new TextDecoder().decode(buf);
                })
                .then(resolve)
                .catch(reject);
        });
    }

    function findFileDownloadUrl() {
        // 1. Links diretos no DOM fora do Stage
        const anchors = Array.from(document.querySelectorAll("a[href]")).filter(a => !a.closest(".bunkr-stage, .bunkr-topbar"));
        for (const a of anchors) {
            const href = (a.getAttribute("href") || "").trim();
            const text = (a.textContent || "").trim().toLowerCase();
            if (!href || href.startsWith("#") || href.startsWith("javascript:")) continue;
            if (/storage\/media|\/d\/|get-download|media-files|\.txt(?:\?|$)/i.test(href)) {
                return href.startsWith("/") ? location.origin + href : href;
            }
            if (a.hasAttribute("download") || a.classList.contains("btn-download") || text.includes("download") || text.includes("baixar")) {
                return href.startsWith("/") ? location.origin + href : href;
            }
        }
        // 2. Busca no HTML nativo da página
        try {
            const html = document.documentElement.innerHTML;
            const m = html.match(/href="([^"]*(?:storage\/media|\/d\/|get-download|media-files|\.txt)[^"]*)"/i) ||
                      html.match(/["'](https?:\/\/[^"']*(?:storage\/media|\/d\/|get-download|media-files|\.txt)[^"]*)["']/i);
            if (m && m[1]) {
                const u = m[1];
                return u.startsWith("/") ? location.origin + u : u;
            }
        } catch {}
        return "";
    }

    function findNativeText() {
        const candidates = document.querySelectorAll("main pre, main textarea, main code, #content pre, .file-content pre");
        for (const el of candidates) {
            if (el.closest(".bunkr-stage")) continue;
            const txt = el.textContent || "";
            if (txt.trim()) return txt;
        }
        return "";
    }

    /* visualizador de arquivos .txt dentro do Stage */
    let textMounted = false;
    async function mountTextViewer() {
        if (textMounted) return;
        const mid = document.querySelector(".bunkr-stage.is-text .bunkr-stage-mid");
        if (!mid) return;
        textMounted = true; mediaMounted = true;

        const h1 = document.querySelector("main h1, h1, .file-name");
        const titleName = h1 ? cleanHtmlText(h1.innerHTML || h1.textContent || "") : "";
        const finfo = getFileInfo(titleName);

        const host = el("div", { class: "bunkr-txt-stage-host" });
        host.innerHTML = `
            <div class="bunkr-txt-stage-card">
                <div class="bunkr-txt-stage-bar">
                    <div class="bunkr-txt-stage-info">
                        <span class="bunkr-txt-tag">${(finfo.ext || "TXT").toUpperCase()}</span>
                        <span class="bunkr-txt-meta" id="bunkrTxtMeta">Carregando…</span>
                    </div>
                    <div class="bunkr-txt-stage-actions">
                        <a class="bunkr-txt-btn" id="bunkrDlTxtBtn" href="#" download target="_blank" style="display:none;">
                            ${PL_ICONS.download}
                            <span>Baixar</span>
                        </a>
                        <button type="button" class="bunkr-txt-btn" id="bunkrCopyTxtBtn" disabled>
                            ${PL_ICONS.copy}
                            <span>Copiar Texto</span>
                        </button>
                    </div>
                </div>
                <pre class="bunkr-txt-stage-content" id="bunkrTxtContent">Carregando conteúdo do arquivo…</pre>
            </div>
        `;
        mid.appendChild(host);

        const contentEl = host.querySelector("#bunkrTxtContent");
        const metaEl = host.querySelector("#bunkrTxtMeta");
        const copyBtn = host.querySelector("#bunkrCopyTxtBtn");
        const dlBtn = host.querySelector("#bunkrDlTxtBtn");

        let loadedTxt = "";
        let dlUrl = "";

        // Procura link de download no DOM com polling de até 3.5s
        for (let attempt = 0; attempt < 10; attempt++) {
            dlUrl = findFileDownloadUrl();
            if (dlUrl) break;
            await new Promise(r => setTimeout(r, 350));
        }

        if (dlUrl) {
            dlBtn.href = dlUrl;
            dlBtn.style.display = "inline-flex";
            try {
                let resText = await httpGet(dlUrl);
                if (/^\s*<!DOCTYPE|^\s*<html/i.test(resText)) {
                    const m2 = resText.match(/href="([^"]*(?:storage\/media|media-files|\.txt)[^"]*)"/i);
                    if (m2 && m2[1]) {
                        let finalUrl = m2[1];
                        if (finalUrl.startsWith("/")) finalUrl = location.origin + finalUrl;
                        dlBtn.href = finalUrl;
                        resText = await httpGet(finalUrl);
                    }
                }
                if (!/^\s*<!DOCTYPE|^\s*<html/i.test(resText)) {
                    loadedTxt = resText;
                }
            } catch (err) {
                console.warn("[Bunkr] Falha ao carregar texto via httpGet:", err);
            }
        }

        if (!loadedTxt) {
            const nativeTxt = findNativeText();
            if (nativeTxt) loadedTxt = nativeTxt;
        }

        if (loadedTxt) {
            contentEl.textContent = loadedTxt;
            const lines = loadedTxt.split("\n").length;
            metaEl.textContent = `${lines} linhas · ${loadedTxt.length} caracteres`;
            copyBtn.disabled = false;
        } else {
            contentEl.textContent = "Não foi possível carregar o conteúdo do texto diretamente no navegador. Use o botão 'Baixar' acima para abrir ou salvar o arquivo.";
            metaEl.textContent = "Texto indisponível para prévia direta";
            if (dlUrl) {
                dlBtn.style.display = "inline-flex";
            }
        }

        copyBtn.addEventListener("click", () => {
            if (loadedTxt) {
                copyText(loadedTxt).then(() => toast("Texto copiado para a área de transferência!"));
            }
        });
    }

    function setMirrorTesting(on) { document.querySelectorAll(".bunkr-mirror, .bunkr-mirror-vrow").forEach(w => w.classList.toggle("is-testing", !!on)); }   // spinner "testando" no(s) botão(ões) de mirror

