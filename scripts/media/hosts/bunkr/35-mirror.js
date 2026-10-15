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
    function mediaBox() {
        return document.querySelector("#video-container")
            || document.querySelector(".rounded-lg section > div.mx-auto")
            || [...document.querySelectorAll(".rounded-lg")].find(b => !b.closest("header"));   // ignora a nav do header (tbm é .rounded-lg)
    }
    function nextMirror() {
        const cur = location.hostname.replace(/^www\./, "");
        const i = MIRRORS.indexOf(cur);
        return MIRRORS[((i >= 0 ? i : -1) + 1) % MIRRORS.length] || MIRRORS[0];
    }
    function isVideoWorking() {
        const v = document.querySelector(".bunkr-video, .bunkr-stage video, #video-wrapper video, #player");
        return !!(v && (v.currentTime > 0 || v.readyState >= 2 || !v.paused));
    }
    function dismissMirrorWarn() {
        document.querySelectorAll(".bunkr-mirror-warn").forEach(w => w.remove());
        setMirrorTesting(false);
    }
    // aviso "mirror fora" no topo do player + botão pro próximo mirror
    function suggestMirror(reason) {
        if (isVideoWorking()) {
            dismissMirrorWarn();
            return;
        }
        const box = document.querySelector(".bunkr-stage .bunkr-stage-mid") || mediaBox();   // no stage o aviso vai sobre a mídia; senão, no box antigo
        if (!box || box.querySelector(".bunkr-mirror-warn")) return;
        if (getComputedStyle(box).position === "static") box.style.position = "relative";
        const nd = nextMirror();
        const warn = document.createElement("div"); warn.className = "bunkr-mirror-warn";
        warn.innerHTML = "<div><b>⚠ Esse mirror pode estar fora</b> " + (reason ? "<span>· " + reason + "</span>" : "") + "</div>";
        const a = document.createElement("a"); a.className = "bunkr-mirror-warn-btn"; a.textContent = "Tentar " + nd + " →";
        a.href = location.protocol + "//" + nd + location.pathname + location.search;
        warn.appendChild(a);
        const x = document.createElement("button"); x.className = "bunkr-mirror-warn-x"; x.type = "button";
        x.setAttribute("aria-label", "Dispensar"); x.title = "Dispensar"; x.innerHTML = svgi('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>');
        x.addEventListener("click", () => warn.remove());
        warn.appendChild(x);
        box.appendChild(warn);
    }
    // TESTE DO PLAYER: probe ESCONDIDO do mp4 que o Bunkr assinou (sem CORS — <video> toca cross-origin; testa rede E
    // decode). loadedmetadata = vai rodar; error/timeout = mirror fora → sugere trocar. + escuta erro no player real.
    let probed = false;
    function testMirror() {
        if (probed) return;
        const el = document.querySelector("#video-wrapper video source[src], #player source[src], #video-wrapper video[src], #player[src]");
        const src = el && (el.getAttribute("src") || el.src);
        if (!src) return;   // o Bunkr ainda não montou o player → tenta de novo
        probed = true;
        setMirrorTesting(true);   // spinner "testando" no botão de mirror enquanto o probe roda
        const real = document.querySelector("#video-wrapper video, #player");
        if (real) real.addEventListener("error", () => suggestMirror("erro ao reproduzir"), { once: true });
        const v = document.createElement("video");
        v.muted = true; v.preload = "metadata"; v.playsInline = true;
        v.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none";
        let done = false;
        const finish = ok => {
            if (done) return;
            done = true;
            clearTimeout(to);
            v.removeAttribute("src");
            v.load && v.load();
            v.remove();
            setMirrorTesting(false);
            if (isVideoWorking()) {
                dismissMirrorWarn();
                return;
            }
            if (!ok) suggestMirror("o vídeo não carregou");
        };
        v.addEventListener("loadedmetadata", () => finish(true), { once: true });
        v.addEventListener("error", () => finish(false), { once: true });
        const to = setTimeout(() => finish(false), 10000);   // lento demais → trata como fora
        v.src = src; (document.body || document.documentElement).appendChild(v); v.load();
    }

