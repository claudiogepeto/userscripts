    /* ===================== CORE: VISUALIZADORES DE FOTO E TEXTO (scripts/media/core/viewers.js) ===================== */
    // Zoom de foto: clique alterna 1x → 2x → 4x, arrastar move a foto ampliada (só a <img> é transformada;
    // o viewport recorta). opts.host recebe .is-zoomed junto com o viewport; opts.padH desconta a topbar
    // quando o viewport ainda não tem altura. opts.keys liga o teclado da foto (ver bindImageKeys).
    // opts.zoomClass troca a classe de zoom (padrão is-zoomed); opts.stopPointer não deixa o pointerdown subir.
    function bindZoom(viewport, pic, opts) {
        opts = opts || {};
        const levels = [1, 2, 4];
        let index = 0, scale = 1, x = 0, y = 0, drag = null;
        const clamp = () => {
            const stageW = viewport.clientWidth || window.innerWidth;
            const stageH = viewport.clientHeight || (window.innerHeight - (opts.padH || 0));
            const maxX = Math.max(0, (pic.clientWidth * scale - stageW) / 2);
            const maxY = Math.max(0, (pic.clientHeight * scale - stageH) / 2);
            x = Math.max(-maxX, Math.min(maxX, x));
            y = Math.max(-maxY, Math.min(maxY, y));
        };
        const apply = () => {
            pic.style.transform = scale === 1 ? "" : `translate(${x}px,${y}px) scale(${scale})`;
            const cls = opts.zoomClass || "is-zoomed";
            viewport.classList.toggle(cls, scale !== 1);
            if (opts.host) opts.host.classList.toggle(cls, scale !== 1);
        };
        const setIndex = i => {
            index = Math.max(0, Math.min(levels.length - 1, i));
            scale = levels[index];
            if (scale === 1) { x = 0; y = 0; } else clamp();
            apply();
        };
        pic.addEventListener("pointerdown", e => {
            if (e.button) return;
            e.preventDefault();
            if (opts.stopPointer) e.stopPropagation();
            drag = { px: e.clientX, py: e.clientY, x, y, moved: false };
            try { pic.setPointerCapture(e.pointerId); } catch {}
        });
        pic.addEventListener("pointermove", e => {
            if (!drag) return;
            const dx = e.clientX - drag.px, dy = e.clientY - drag.py;
            if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
            if (scale === 1 || !drag.moved) return;
            x = drag.x + dx; y = drag.y + dy;
            clamp(); apply();
        });
        const end = e => {
            if (!drag) return;
            const click = !drag.moved;
            drag = null;
            try { pic.releasePointerCapture(e.pointerId); } catch {}
            if (click) setIndex(index + 1 < levels.length ? index + 1 : 0);   // clique: 1x → 2x → 4x → 1x
        };
        pic.addEventListener("pointerup", end);
        pic.addEventListener("pointercancel", end);
        apply();
        const ctl = {
            zoomIn: () => setIndex(index + 1),
            zoomOut: () => setIndex(index - 1),
            reset: () => setIndex(0),
            isZoomed: () => scale !== 1,
        };
        if (opts.keys) bindImageKeys(pic, ctl, opts.keys);
        return ctl;
    }

    // Teclado da foto (o do goonbox, para todos os hosts): ← → anterior/próxima, + − zoom, 0 volta a 1x,
    // f tela cheia, Esc tira o zoom (sem zoom, Esc segue para o host: fechar o stage etc.).
    // k = { nav(dir), fullscreenTarget() | fullscreen() }. Um só listener por vez; morre quando a foto sai do DOM.
    let imageKeysAc = null;
    function bindImageKeys(pic, ctl, k) {
        if (imageKeysAc) imageKeysAc.abort();
        const ac = imageKeysAc = new AbortController();
        document.addEventListener("keydown", e => {
            if (!pic.isConnected) { ac.abort(); return; }
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const t = e.target;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
            const key = e.key;
            let handled = true;
            if (key === "Escape") { if (ctl.isZoomed()) ctl.reset(); else handled = false; }
            else if (key === "ArrowLeft" && !e.shiftKey) { if (k.nav) k.nav(-1); else handled = false; }
            else if (key === "ArrowRight" && !e.shiftKey) { if (k.nav) k.nav(1); else handled = false; }
            else if (key === "+" || key === "=") ctl.zoomIn();
            else if (key === "-" || key === "_") ctl.zoomOut();
            else if (key === "0") ctl.reset();
            else if ((key === "f" || key === "F") && !e.shiftKey) {
                if (k.fullscreen) k.fullscreen();
                else try {
                    if (document.fullscreenElement) document.exitFullscreen();
                    else { const target = (k.fullscreenTarget && k.fullscreenTarget()) || pic.parentElement; if (target) target.requestFullscreen(); }
                } catch {}
            }
            else handled = false;
            if (handled) { e.preventDefault(); e.stopImmediatePropagation(); }
        }, { capture: true, signal: ac.signal });
    }

    // Visualizador de texto (o do bunkr): cartão com tipo, linhas/caracteres, Baixar e Copiar texto.
    // opts = { ext, downloadUrl, load: async () => texto | "" }. Devolve o host montado em mid.
    function mountTextCard(mid, opts) {
        const P = MEDIA_PREFIX;
        const icons = typeof MEDIA_ICONS !== "undefined" ? MEDIA_ICONS : {};
        const host = el("div", { class: `${P}-txt-stage-host` });
        const tag = el("span", { class: `${P}-txt-tag` }, String(opts.ext || "TXT").toUpperCase());
        const meta = el("span", { class: `${P}-txt-meta` }, "Carregando…");
        const dlBtn = el("a", { class: `${P}-txt-btn`, href: opts.downloadUrl || "#", download: "", target: "_blank", rel: "noopener", style: opts.downloadUrl ? "" : "display:none;" });
        dlBtn.insertAdjacentHTML("beforeend", (icons.download || "") + "<span>Baixar</span>");
        const copyBtn = el("button", { type: "button", class: `${P}-txt-btn`, disabled: "" });
        copyBtn.insertAdjacentHTML("beforeend", (icons.copy || "") + "<span>Copiar Texto</span>");
        const content = el("pre", { class: `${P}-txt-stage-content` }, "Carregando conteúdo do arquivo…");
        host.append(el("div", { class: `${P}-txt-stage-card` },
            el("div", { class: `${P}-txt-stage-bar` },
                el("div", { class: `${P}-txt-stage-info` }, tag, meta),
                el("div", { class: `${P}-txt-stage-actions` }, dlBtn, copyBtn)),
            content));
        mid.appendChild(host);
        let loaded = "";
        copyBtn.addEventListener("click", () => { if (loaded) copyText(loaded).then(() => toast("Texto copiado para a área de transferência!")); });
        Promise.resolve().then(() => opts.load ? opts.load() : "").catch(() => "").then(txt => {
            loaded = typeof txt === "string" ? txt : "";
            if (loaded) {
                content.textContent = loaded;
                meta.textContent = `${loaded.split("\n").length} linhas · ${loaded.length} caracteres`;
                copyBtn.removeAttribute("disabled");
            } else {
                content.textContent = "Não foi possível carregar o conteúdo do texto diretamente no navegador. Use o botão 'Baixar' acima para abrir ou salvar o arquivo.";
                meta.textContent = "Texto indisponível para prévia direta";
            }
        });
        return host;
    }
