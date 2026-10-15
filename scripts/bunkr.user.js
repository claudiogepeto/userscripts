// ==UserScript==
// @name         Bunkr — Theater Player, Gallery, Mirror & Downloader
// @namespace    bunkr-youtube-player
// @version      2.13.6
// @description  Camada visual sobre as páginas de arquivo do Bunkr (vídeo · foto · galeria), aproximando do YouTube. (1) PLAYER GRANDE: tira o cap de 1000px e usa o maior 16:9 que cabe na largura E na altura da viewport (theater), centralizado/arredondado. (2) Player, título e header na MESMA coluna → o título alinha com o vídeo (flush-left). (3) Topbar padronizada: logo direcionando para home do Bunkr, botões Search Albums (balbums.st), Upload e Stats na ponta direita. (4) Respiro maior no rodapé. @include por regex (o TLD do Bunkr muda toda hora). v2.0: Player próprio estilo YouTube, zoom/pan em foto, mirror probe. v2.1: Stage overlay. v2.2: Tema AMOLED. v2.3: Força Advanced View (?advanced=1). v2.4: Carregamento do álbum completo e filtro ?q=. v2.7: Playlist em sidebar lateral. v2.8: Refinamentos no player (controles reordenados, arcos de skip circulares, logo na topbar, fix no falso-positivo de mirror). v2.9: Galeria de álbum redesenhada estilo YouTube com Actionbar integrada, cards nítidos e sanitização de links. v2.9.1: Topbar padronizada e grade ampla. v2.9.2: Preservação do master.css, botão Report alinhado ao lado das informações do álbum, topbar com Search Albums/Upload/Stats na ponta direita e logo apontando para a home do Bunkr (/), e revamp AMOLED completo da homepage. v2.10.0: Identificação de datas no título, ordenação por Data de Envio e Data Extraída (⬇/⬆) na Galeria e na Sidebar, títulos limpos sem data com exibição em texto simples abaixo (sem badges/ícones), botões anterior/próximo lado a lado e botão 1x plano no player. v2.10.1: Correção do congelamento/crash em álbuns (eliminação de loop infinito no MutationObserver com observação restrita a childList sem subtree, proteção contra reentrância e renderização idempotente com chave de cache nos cards), decodificação segura e rápida de entidades HTML para títulos duplamente escapados pelo Bunkr. v2.11.0: Agrupamento inteligente por tipo de arquivo com seções dedicadas, visualizador integrado de texto no Stage, e layout mobile responsivo. v2.11.1: Correção do carregamento do leitor de arquivos .txt no Stage com detecção e bypass de CORS via GM_xmlhttpRequest, botão de download direto de arquivos de texto, e placeholders temáticos AMOLED na barra de playlist para arquivos sem thumbnail ou com erro de imagem.
// @author       claudiogepeto
// @match        *://bunkr.cr/*
// @match        *://*.bunkr.cr/*
// @match        *://bunkr.ph/*
// @match        *://*.bunkr.ph/*
// @match        *://bunkr.ru/*
// @match        *://*.bunkr.ru/*
// @match        *://bunkr.si/*
// @match        *://*.bunkr.si/*
// @match        *://bunkr.fi/*
// @match        *://*.bunkr.fi/*
// @match        *://bunkr.ws/*
// @match        *://*.bunkr.ws/*
// @match        *://bunkr.ax/*
// @match        *://*.bunkr.ax/*
// @match        *://bunkr.black/*
// @match        *://*.bunkr.black/*
// @match        *://bunkr.media/*
// @match        *://*.bunkr.media/*
// @match        *://bunkr.site/*
// @match        *://*.bunkr.site/*
// @match        *://bunkr.pk/*
// @match        *://*.bunkr.pk/*
// @match        *://bunkr.la/*
// @match        *://*.bunkr.la/*
// @match        *://bunkr.su/*
// @match        *://*.bunkr.su/*
// @match        *://bunkr.ci/*
// @match        *://*.bunkr.ci/*
// @match        *://bunkr.is/*
// @match        *://*.bunkr.is/*
// @match        *://bunkr.sk/*
// @match        *://*.bunkr.sk/*
// @match        *://bunkr.red/*
// @match        *://*.bunkr.red/*
// @match        *://bunkr.cat/*
// @match        *://*.bunkr.cat/*
// @match        *://bunkr.nl/*
// @match        *://*.bunkr.nl/*
// @match        *://bunkr.ac/*
// @match        *://*.bunkr.ac/*
// @match        *://bunkr.se/*
// @match        *://*.bunkr.se/*
// @match        *://bunkr.cc/*
// @match        *://*.bunkr.cc/*
// @match        *://bunkr.to/*
// @match        *://*.bunkr.to/*
// @match        *://bunkr.ps/*
// @match        *://*.bunkr.ps/*
// @match        *://bunkr.pm/*
// @match        *://*.bunkr.pm/*
// @match        *://bunkr.lv/*
// @match        *://*.bunkr.lv/*
// @match        *://bunkr.at/*
// @match        *://*.bunkr.at/*
// @match        *://bunkr.bi/*
// @match        *://*.bunkr.bi/*
// @match        *://bunkr.by/*
// @match        *://*.bunkr.by/*
// @match        *://bunkr.bz/*
// @match        *://*.bunkr.bz/*
// @match        *://bunkr.cm/*
// @match        *://*.bunkr.cm/*
// @match        *://bunkr.cx/*
// @match        *://*.bunkr.cx/*
// @match        *://bunkr.li/*
// @match        *://*.bunkr.li/*
// @match        *://bunkr.my/*
// @match        *://*.bunkr.my/*
// @match        *://bunkr.sx/*
// @match        *://*.bunkr.sx/*
// @match        *://bunkr.tv/*
// @match        *://*.bunkr.tv/*
// @match        *://bunkr.space/*
// @match        *://*.bunkr.space/*
// @match        *://bunkr.fit/*
// @match        *://*.bunkr.fit/*
// @match        *://bunkr.click/*
// @match        *://*.bunkr.click/*
// @match        *://bunkrr.su/*
// @match        *://*.bunkrr.su/*
// @match        *://bunkrr.red/*
// @match        *://*.bunkrr.red/*
// @match        *://bunkrr.ru/*
// @match        *://*.bunkrr.ru/*
// @match        *://bunkrr.ax/*
// @match        *://*.bunkrr.ax/*
// @match        *://bunkrr.ws/*
// @match        *://*.bunkrr.ws/*
// @match        *://bunkrr.si/*
// @match        *://*.bunkrr.si/*
// @match        *://bunkrr.to/*
// @match        *://*.bunkrr.to/*
// @match        *://bunkrr.sk/*
// @match        *://*.bunkrr.sk/*
// @match        *://bunkrr.pm/*
// @match        *://*.bunkrr.pm/*
// @match        *://bunkrr.la/*
// @match        *://*.bunkrr.la/*
// @match        *://bunkrr.cr/*
// @match        *://*.bunkrr.cr/*
// @match        *://bunkrr.is/*
// @match        *://*.bunkrr.is/*
// @match        *://bunkrr.ac/*
// @match        *://*.bunkrr.ac/*
// @match        *://bunkrr.cat/*
// @match        *://*.bunkrr.cat/*
// @match        *://bunkrr.nl/*
// @match        *://*.bunkrr.nl/*
// @match        *://bunkrr.se/*
// @match        *://*.bunkrr.se/*
// @match        *://bunkrr.cc/*
// @match        *://*.bunkrr.cc/*
// @match        *://bunkrr.black/*
// @match        *://*.bunkrr.black/*
// @match        *://bunkrr.media/*
// @match        *://*.bunkrr.media/*
// @match        *://bunkrr.site/*
// @match        *://*.bunkrr.site/*
// @match        *://bunkrr.pk/*
// @match        *://*.bunkrr.pk/*
// @match        *://bunkrr.ci/*
// @match        *://*.bunkrr.ci/*
// @match        *://bunkrr.ph/*
// @match        *://*.bunkrr.ph/*
// @match        *://bunkrr.fi/*
// @match        *://*.bunkrr.fi/*
// @match        *://bunkrr.ps/*
// @match        *://*.bunkrr.ps/*
// @match        *://bunkrr.lv/*
// @match        *://*.bunkrr.lv/*
// @match        *://bunkrr.at/*
// @match        *://*.bunkrr.at/*
// @match        *://bunkrr.bi/*
// @match        *://*.bunkrr.bi/*
// @match        *://bunkrr.by/*
// @match        *://*.bunkrr.by/*
// @match        *://bunkrr.bz/*
// @match        *://*.bunkrr.bz/*
// @match        *://bunkrr.cm/*
// @match        *://*.bunkrr.cm/*
// @match        *://bunkrr.cx/*
// @match        *://*.bunkrr.cx/*
// @match        *://bunkrr.li/*
// @match        *://*.bunkrr.li/*
// @match        *://bunkrr.my/*
// @match        *://*.bunkrr.my/*
// @match        *://bunkrr.sx/*
// @match        *://*.bunkrr.sx/*
// @match        *://bunkrr.tv/*
// @match        *://*.bunkrr.tv/*
// @match        *://bunkrr.space/*
// @match        *://*.bunkrr.space/*
// @match        *://bunkrr.fit/*
// @match        *://*.bunkrr.fit/*
// @match        *://bunkrr.click/*
// @match        *://*.bunkrr.click/*
// @noframes
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      *
// ==/UserScript==
// GENERATED by scripts/media/build.js from scripts/media/ (core + hosts/bunkr) — edit the parts, not this file. sha256:fb05fc49e747974bc578c198614d544c0c780ac56b4e9403182875695b03bdaf

(function () {
    "use strict";

    if (window.top !== window.self) return;   // ignora iframes (players/embeds)

    // ÁLBUM: força a "Advanced View" do bunkr (carrega TODOS os arquivos de uma vez, SEM paginador). Redireciona 1× se ainda não estiver nela (guard evita loop).
    if (/\/a\//.test(location.pathname) && !/[?&]advanced=1\b/.test(location.search)) {
        location.replace(location.pathname + (location.search ? location.search + "&" : "?") + "advanced=1" + location.hash);
        return;
    }

    // tipo de página pela URL (já no document-start → sem flash): /a/ = ÁLBUM; / = HOMEPAGE; resto = ARQUIVO (vídeo/foto)
    const isAlbumPage = /\/a\//.test(location.pathname);
    const isHomePage = (location.pathname === "/" || location.pathname === "") && !isAlbumPage;
    if (isAlbumPage) {
        document.documentElement.classList.remove("bunkr-file", "bunkr-home");
        document.documentElement.classList.add("bunkr-album");
    } else if (isHomePage) {
        document.documentElement.classList.remove("bunkr-file", "bunkr-album");
        document.documentElement.classList.add("bunkr-home");
    } else {
        document.documentElement.classList.remove("bunkr-album", "bunkr-home");
        document.documentElement.classList.add("bunkr-file");
    }

    // força o tema ESCURO do bunkr (.dark) e MANTÉM forçado — a página pode vir no claro / o JS do bunkr re-aplica o tema
    (function () {
        const c = document.documentElement.classList;
        const forceDark = () => { if (!c.contains("dark") || c.contains("light")) { c.add("dark"); c.remove("light"); } };   // idempotente → o observer converge (não loopa)
        forceDark();
        try { new MutationObserver(forceDark).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] }); } catch {}
    })();

    // Prefixo de classe deste host (core/toast.js e demais partes do core).
    const MEDIA_PREFIX = "bunkr";
    const MEDIA_THEME = { p: MEDIA_PREFIX, accent: "#a78bfa", accentRgb: "167,139,250", accentLight: "#c4b5fd", onAccent: "#120e1e" };
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

    /* ===================== CORE: CSS DE COMPONENTES (scripts/media/core/css.js) ===================== */
    // CSS dos componentes compartilhados (player, foto, stage, sidebar/playlist, mobile, actionbar, datas,
    // grupos, placeholders, texto, toast), vindo do bunkr e parametrizado por prefixo de classe e accent.
    // t = { p, accent, accentRgb ("r,g,b"), accentLight, onAccent }. Cada host interpola os segmentos no
    // seu próprio CSS (mantendo a ordem da cascata) e acrescenta só os overrides dele.
    function mediaComponentCSS(t) {
        const P = t.p, rgbS = t.accentRgb.replace(/,/g, ", ");
        const plc = `        /* ===== v2.7 — PLAYER MODERNO (accent roxo, estilo YouTube Pro) + SIDEBAR PLAYLIST ===== */
        :root { --${P}-accent: ${t.accent}; --${P}-accent-rgb: ${rgbS}; }
        .${P}-host { position: relative; width: 100%; height: 100%; max-width: 100%; max-height: 100%; background: #000; border-radius: 0 !important; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .${P}-video { width: 100% !important; height: 100% !important; max-width: 100% !important; max-height: 100% !important; object-fit: contain !important; background: #000 !important; border-radius: 0 !important; outline: none; cursor: pointer; display: block; }
        
        /* Big Play central */
        .${P}-plc-flash { position: absolute; inset: 0; z-index: 2; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .2s ease; }
        .${P}-pl:not(.is-playing):not(.is-buffering) .${P}-plc-flash { opacity: 1; }
        .${P}-plc-play { width: 68px; height: 68px; border: 1px solid rgba(255,255,255,.18); border-radius: 50%; cursor: pointer; padding: 0; background: rgba(14,16,22,.75); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(0,0,0,.5); transition: transform .14s cubic-bezier(0.4, 0, 0.2, 1), background .14s ease, border-color .14s ease; pointer-events: none; }
        .${P}-plc-play svg { width: 28px; height: 28px; margin-left: 3px; fill: currentColor; }
        .${P}-pl:not(.is-playing) .${P}-plc-play { pointer-events: auto; }
        .${P}-plc-play:hover { transform: scale(1.1); background: rgba(22,24,34,.9); border-color: var(--${P}-accent, ${t.accent}); }
        .${P}-plc-play:active { transform: scale(.95); }
        @media (max-width: 600px) { .${P}-plc-play { width: 54px; height: 54px; } .${P}-plc-play svg { width: 22px; height: 22px; } }

        /* Barra inferior de controles */
        .${P}-plc-bottom { position: absolute; left: 0; right: 0; bottom: 0; z-index: 4; padding: 0 14px 10px; background: linear-gradient(to top, rgba(0,0,0,.88) 0%, rgba(0,0,0,.45) 55%, transparent 100%); opacity: 0; pointer-events: none; transition: opacity .2s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; gap: 4px; }
        .${P}-pl:hover .${P}-plc-bottom, .${P}-pl:not(.is-playing) .${P}-plc-bottom, .${P}-pl.is-menu-open .${P}-plc-bottom, .${P}-img-host:hover .${P}-plc-bottom, .${P}-img-host:focus-within .${P}-plc-bottom { opacity: 1; pointer-events: auto; }
        @media (hover: none) { .${P}-plc-bottom { opacity: 1; pointer-events: auto; } }

        /* Linha de progresso / scrubber com tooltip de tempo */
        .${P}-plc-prog { position: relative; width: 100%; height: 16px; display: flex; align-items: center; cursor: pointer; touch-action: none; }
        .${P}-plc-bar { position: relative; width: 100%; height: 3.5px; background: rgba(255,255,255,.24); border-radius: 4px; transition: height .12s cubic-bezier(0.4, 0, 0.2, 1); }
        .${P}-plc-prog:hover .${P}-plc-bar { height: 6px; }
        .${P}-plc-buf { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: rgba(255,255,255,.34); border-radius: 4px; pointer-events: none; }
        .${P}-plc-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: var(--${P}-accent, ${t.accent}); border-radius: 4px; pointer-events: none; }
        .${P}-plc-knob { position: absolute; right: -6px; top: 50%; width: 12px; height: 12px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.5); transform: translateY(-50%) scale(0); transition: transform .12s ease; }
        .${P}-plc-prog:hover .${P}-plc-knob { transform: translateY(-50%) scale(1); }
        .${P}-plc-timetip { position: absolute; bottom: calc(100% + 7px); transform: translateX(-50%); background: rgba(14,15,19,.95); border: 1px solid rgba(255,255,255,.16); color: #fff; font: 600 11px/1 Inter, system-ui, sans-serif; font-variant-numeric: tabular-nums; padding: 4px 7px; border-radius: 6px; pointer-events: none; opacity: 0; white-space: nowrap; transition: opacity .1s ease; box-shadow: 0 4px 14px rgba(0,0,0,.5); z-index: 10; }
        .${P}-plc-prog:hover .${P}-plc-timetip { opacity: 1; }

        /* Linha de botões */
        .${P}-plc-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 40px; }
        .${P}-plc-left, .${P}-plc-right { display: flex; align-items: center; gap: 3px; }

        /* Botões de controle universais */
        .${P}-plc-act { position: relative; width: 36px; height: 36px; border: 0; border-radius: 50%; cursor: pointer; padding: 0; background: transparent; color: rgba(255,255,255,.9); display: flex; align-items: center; justify-content: center; transition: background .12s, color .12s, transform .1s, opacity .12s; flex: 0 0 auto; }
        .${P}-plc-act:hover { background: rgba(255,255,255,.12); color: #fff; }
        .${P}-plc-act:active { transform: scale(.9); }
        .${P}-plc-act.is-active { color: var(--${P}-accent, ${t.accent}); background: rgba(${t.accentRgb},.18); }
        .${P}-plc-act.is-disabled { opacity: .35 !important; pointer-events: none !important; }
        .${P}-plc-act svg { width: 20px; height: 20px; display: block; filter: drop-shadow(0 0 1px rgba(0,0,0,.4)); }

        /* Play/pause na barra */
        .${P}-plc-barplay { width: 38px; height: 38px; }
        .${P}-plc-barplay svg { width: 22px; height: 22px; fill: currentColor; }

        /* Pular 5s (arcos arredondados quase completos) */
        .${P}-plc-skip { position: relative; width: 36px; height: 36px; border-radius: 50%; }
        .${P}-plc-skip svg { width: 22px; height: 22px; display: block; }
        .${P}-plc-skip .${P}-plc-skipn { position: absolute; left: 0; right: 0; top: 51%; transform: translateY(-50%); text-align: center; font: 800 8.5px/1 Inter, system-ui, sans-serif; color: currentColor; pointer-events: none; }

        /* Grupo de Volume */
        .${P}-plc-vol { display: flex; align-items: center; gap: 2px; }
        .${P}-plc-volbar { position: relative; width: 0; height: 4px; border-radius: 4px; background: rgba(255,255,255,.28); cursor: pointer; opacity: 0; transition: width .18s ease, opacity .18s ease, margin .18s ease; touch-action: none; }
        .${P}-plc-vol:hover .${P}-plc-volbar, .${P}-plc-vol.is-sliding .${P}-plc-volbar { width: 62px; opacity: 1; margin: 0 6px 0 2px; }
        .${P}-plc-volfill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: #fff; border-radius: 4px; pointer-events: none; }

        /* Tempo */
        .${P}-plc-time { color: rgba(255,255,255,.88); font: 600 12px/1 Inter, system-ui, sans-serif; font-variant-numeric: tabular-nums; padding: 0 8px; white-space: nowrap; user-select: none; flex: 0 0 auto; }
        @media (max-width: 600px) { .${P}-plc-act { width: 30px; height: 30px; } .${P}-plc-act svg { width: 17px; height: 17px; } .${P}-plc-time { font-size: 11px; padding: 0 4px; } }

        /* Feedback do seek flash */
        .${P}-plc-seekflash { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); z-index: 3; color: #fff; font: 700 15px/1 Inter, system-ui, sans-serif; background: rgba(0,0,0,.65); padding: 9px 15px; border-radius: 999px; opacity: 0; transition: opacity .15s ease; pointer-events: none; white-space: nowrap; }
        .${P}-plc-seekflash.on { opacity: 1; }
        .${P}-pl.is-buffering::after { content: ""; position: absolute; top: 50%; left: 50%; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%; border: 3px solid rgba(255,255,255,.22); border-top-color: var(--${P}-accent, ${t.accent}); animation: ${P}-spin .8s linear infinite; z-index: 4; pointer-events: none; }
        @keyframes ${P}-spin { to { transform: rotate(360deg); } }

        /* Switch moderno de Autoplay com label */
        .${P}-plc-autoplay { width: auto; height: 30px; padding: 0 8px 0 10px; border-radius: 15px; gap: 8px; font: 600 12px/1 Inter, system-ui, sans-serif; color: rgba(255,255,255,.8); background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); transition: background .12s, border-color .12s, color .12s; }
        .${P}-plc-autoplay:hover { background: rgba(255,255,255,.12); color: #fff; }
        .${P}-plc-autoplay.is-active { background: rgba(${t.accentRgb},.14); border-color: rgba(${t.accentRgb},.35); color: #fff; }
        .${P}-plc-ap-label { font-size: 11.5px; font-weight: 600; letter-spacing: -0.01em; user-select: none; }
        .${P}-plc-ap-pill { position: relative; width: 28px; height: 16px; border-radius: 9px; background: rgba(255,255,255,.24); transition: background .18s ease; display: block; flex: 0 0 28px; }
        .${P}-plc-ap-knob { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: #fff; transition: transform .18s cubic-bezier(0.4, 0, 0.2, 1), background .18s ease; box-shadow: 0 1px 3px rgba(0,0,0,.4); display: block; }
        .${P}-plc-autoplay.is-active .${P}-plc-ap-pill { background: var(--${P}-accent, ${t.accent}); }
        .${P}-plc-autoplay.is-active .${P}-plc-ap-knob { transform: translateX(12px); background: ${t.onAccent}; }

        /* Seletor de Velocidade moderno (texto limpo + popup) */
        .${P}-plc-speedwrap { position: relative; display: flex; align-items: center; }
        .${P}-plc-speed { width: auto; height: 38px; padding: 0 6px; border: 0; background: transparent; color: rgba(255,255,255,.9); font: 700 15px/1 Inter, system-ui, sans-serif; font-variant-numeric: tabular-nums; cursor: pointer; transition: color .12s, transform .1s; display: inline-flex; align-items: center; justify-content: center; }
        .${P}-plc-speed:hover { background: transparent; color: #fff; transform: scale(1.08); }
        .${P}-plc-speedmenu { position: absolute; bottom: calc(100% + 10px); right: 0; z-index: 10; display: none; flex-direction: column; padding: 6px; min-width: 140px; max-height: 280px; overflow-y: auto; background: rgba(16,18,25,.96); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,.14); border-radius: 12px; box-shadow: 0 16px 36px rgba(0,0,0,.65); scrollbar-width: thin; }
        .${P}-plc-speedmenu.open { display: flex; animation: ${P}-fadein .15s ease; }
        @keyframes ${P}-fadein { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .${P}-plc-speedhead { display: flex; align-items: center; justify-content: space-between; padding: 4px 8px 8px; border-bottom: 1px solid rgba(255,255,255,.08); margin-bottom: 4px; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: rgba(255,255,255,.45); }
        .${P}-plc-speedreset { border: 0; background: rgba(255,255,255,.08); color: rgba(255,255,255,.75); font: 700 10.5px Inter, system-ui, sans-serif; padding: 2px 6px; border-radius: 4px; cursor: pointer; transition: background .1s, color .1s; }
        .${P}-plc-speedreset:hover { background: rgba(255,255,255,.16); color: #fff; }
        .${P}-plc-speeditem { display: flex; align-items: center; justify-content: space-between; gap: 8px; border: 0; background: transparent; color: rgba(255,255,255,.88); font: 600 12.5px/1 Inter, system-ui, sans-serif; padding: 7px 10px; border-radius: 7px; cursor: pointer; text-align: left; white-space: nowrap; transition: background .1s, color .1s; }
        .${P}-plc-speeditem:hover { background: rgba(255,255,255,.1); color: #fff; }
        .${P}-plc-speeditem.on { color: var(--${P}-accent, ${t.accent}); font-weight: 700; background: rgba(${t.accentRgb},.12); }
        .${P}-plc-speeditem svg { width: 14px; height: 14px; opacity: 0; color: var(--${P}-accent, ${t.accent}); flex: 0 0 auto; }
        .${P}-plc-speeditem.on svg { opacity: 1; }

`;
        const photo = `        /* ===== FOTO: ZOOM + PAN ===== */
        .${P}-img-host { position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; max-width: 100%; max-height: 100%; margin: 0; overflow: visible; }
        .${P}-image { display: block !important; max-width: 100% !important; max-height: 100% !important; width: auto !important; height: auto !important; object-fit: contain !important; opacity: 1 !important; filter: none !important; position: static !important; background: transparent !important; border-radius: 0 !important; box-shadow: none !important; cursor: zoom-in; user-select: none; -webkit-user-drag: none; transform-origin: center center; will-change: transform; touch-action: none; }
        .${P}-stage-mid.is-zoomed .${P}-image, .${P}-img-host.is-zoomed .${P}-image { cursor: grab; }
        .${P}-stage-mid.is-zoomed .${P}-image:active, .${P}-img-host.is-zoomed .${P}-image:active { cursor: grabbing; }

        /* Spinner de mirror */
        .${P}-mirror.is-testing { opacity: 1 !important; pointer-events: auto !important; }
        .${P}-mirror-spin { display: none; width: 15px; height: 15px; flex: 0 0 auto; border-radius: 50%; border: 2px solid rgba(255,255,255,.35); border-top-color: var(--${P}-accent, ${t.accent}); animation: ${P}-spin .7s linear infinite; }
        .${P}-mirror.is-testing .${P}-mirror-btn svg { display: none; }
        .${P}-mirror.is-testing .${P}-mirror-spin { display: inline-block; }

`;
        const stage = `        /* ===== STAGE: LAYOUT COM SIDEBAR INTEGRADA AO LADO DA TOPBAR E DO PLAYER ===== */
        html.${P}-has-stage, html.${P}-has-stage body { overflow: hidden !important; }
        html.${P}-file::before { content: ""; position: fixed; inset: 0; background: #0b0c0f; z-index: 98000; pointer-events: none; }
        html.${P}-file.${P}-fallback::before { display: none; }
        .${P}-stage { position: fixed; inset: 0; z-index: 99000; display: flex; flex-direction: row; background: #0b0c0f; color: #fff; font-family: Inter, system-ui, sans-serif; overflow: hidden; }
        .${P}-stage * { box-sizing: border-box; }

        /* Coluna principal da esquerda (Topbar + Mídia) */
        .${P}-stage-main { flex: 1 1 0%; min-width: 0; height: 100%; display: flex; flex-direction: column; position: relative; overflow: hidden; background: #000; }

        /* Topbar info (vrow) modernizada */
        .${P}-vrow { flex: 0 0 52px; min-height: 52px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 16px; background: #0e0f13; border-bottom: 1px solid rgba(255,255,255,.07); white-space: nowrap; }
        .${P}-vrow-top { display: flex; align-items: center; gap: 8px; flex: 1 1 auto; min-width: 0; }
        .${P}-top-logo { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; padding: 4px 6px; border-radius: 8px; transition: background .12s, opacity .12s; flex: 0 0 auto; }
        .${P}-top-logo:hover { background: rgba(255,255,255,.06); }
        .${P}-logo-badge { display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 7px; background: linear-gradient(135deg, ${t.accentLight} 0%, #8b5cf6 100%); color: #0e0f13; box-shadow: 0 2px 8px rgba(139,92,246,.35); overflow: hidden; flex: 0 0 26px; }
        .${P}-logo-badge img { width: 100%; height: 100%; object-fit: contain; }
        .${P}-logo-badge svg { width: 15px; height: 15px; fill: #0e0f13; }
        .${P}-logo-text { font: 800 15px/1 Inter, system-ui, sans-serif; letter-spacing: -0.03em; color: #fff; }
        .${P}-logo-dot { color: var(--${P}-accent, ${t.accent}); }
        .${P}-vrow .b-name { flex: 0 1 auto; min-width: 60px; max-width: 38vw; display: inline-flex; align-items: center; gap: 8px; padding: 0 4px; font-weight: 600; font-size: 13px; color: #f1f3f7; }
        .${P}-vrow .b-name svg { color: var(--${P}-accent, ${t.accent}); flex: 0 0 auto; width: 16px; height: 16px; }
        .${P}-vrow .b-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .${P}-vrow-sub { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
        .${P}-stats { display: flex; align-items: center; gap: 6px; padding: 0 4px; flex: 0 0 auto; }
        .${P}-stat { font-size: 11.5px; color: rgba(255,255,255,.7); font-weight: 600; padding: 3px 8px; border-radius: 6px; background: rgba(255,255,255,.06); }
        .${P}-stat-type { background: rgba(${t.accentRgb},.12); color: var(--${P}-accent, ${t.accent}); }
        .b-spacer { flex: 1 1 auto; min-width: 8px; }
        .b-vsep { flex: 0 0 auto; width: 1px; height: 20px; margin: 0 4px; background: rgba(255,255,255,.1); }

        .${P}-item { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 7px; padding: 6px 11px; border: 1px solid rgba(255,255,255,.1); border-radius: 9px; background: rgba(255,255,255,.05); color: #fff; font: 12.5px/1 Inter, system-ui, sans-serif; cursor: pointer; text-decoration: none; transition: background .12s, border-color .12s, color .12s; }
        .${P}-item:hover { background: rgba(255,255,255,.1); border-color: ${t.accent}66; }
        .${P}-item svg { width: 16px; height: 16px; color: var(--${P}-accent, ${t.accent}); }

        /* Botão de Playlist no canto direito da topbar (visível somente quando a sidebar estiver fechada) */
        .${P}-vrow-playlist { display: none; }
        .${P}-stage.is-sidebar-collapsed .${P}-vrow-playlist { display: inline-flex !important; }

        /* Mirror dropdown */
        .${P}-mirror-vrow { position: relative; flex: 0 0 auto; }
        .${P}-mirror-vrow.is-testing .${P}-item svg { display: none; }
        .${P}-mirror-vrow.is-testing .${P}-mirror-spin { display: inline-block; }
        .${P}-mirror-vrow .${P}-mirror-menu { position: fixed; z-index: 100002; }

        /* Mídia no centro */
        .${P}-stage-mid { position: relative; flex: 1 1 0%; min-width: 0; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 0 !important; overflow: hidden; background: #000; }
        .${P}-stage.is-video .${P}-stage-mid > .${P}-host { width: 100%; height: 100%; aspect-ratio: auto; border-radius: 0 !important; }
        .${P}-stage-mid > .${P}-img-host { max-height: 100%; max-width: 100%; margin: 0; display: flex; align-items: center; justify-content: center; overflow: visible; }

        /* Setas laterais de navegação sobre a mídia */
        .${P}-nav-side { position: absolute; top: 50%; transform: translateY(-50%); z-index: 6; width: 46px; height: 46px; border: 0; border-radius: 50%; background: rgba(0,0,0,.5); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .18s ease, background .12s ease; }
        .${P}-nav-prev { left: 16px; } .${P}-nav-next { right: 16px; }
        .${P}-stage.has-nav .${P}-stage-mid:hover .${P}-nav-side { opacity: 1; pointer-events: auto; }
        @media (hover: none) { .${P}-stage.has-nav .${P}-nav-side { opacity: .85; pointer-events: auto; } }
        .${P}-nav-side:hover { background: rgba(0,0,0,.78); } .${P}-nav-side:active { transform: translateY(-50%) scale(.92); }
        .${P}-nav-side svg { width: 26px; height: 26px; display: block; }
        .${P}-nav-side.is-disabled { display: none !important; }

        /* ===== SIDEBAR PLAYLIST (à direita, altura 100vh ao lado da topbar) ===== */
        .${P}-sidebar { position: relative; flex: 0 0 420px; width: 420px; max-width: 45vw; height: 100%; min-height: 0; display: flex; flex-direction: column; background: #0e0f13; border-left: 1px solid rgba(255,255,255,.08); z-index: 20; transition: width .22s cubic-bezier(0.4, 0, 0.2, 1), flex-basis .22s cubic-bezier(0.4, 0, 0.2, 1); }
        .${P}-stage.is-sidebar-collapsed .${P}-sidebar { width: 0 !important; flex-basis: 0 !important; min-width: 0 !important; border-left-width: 0 !important; overflow: hidden !important; pointer-events: none !important; }
        .${P}-stage:not(.has-playlist) .${P}-sidebar { display: none !important; }

        /* Header da sidebar */
        .${P}-sidebar-header { flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,.08); background: #111318; gap: 8px; }
        .${P}-sidebar-title { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 700; color: #fff; letter-spacing: -0.01em; min-width: 0; }
        .${P}-sidebar-title svg { width: 18px; height: 18px; color: var(--${P}-accent, ${t.accent}); flex: 0 0 auto; }
        .${P}-sidebar-count { font-size: 11.5px; font-weight: 600; color: rgba(255,255,255,.55); background: rgba(255,255,255,.08); padding: 2px 7px; border-radius: 999px; white-space: nowrap; }

        /* Ações do header da sidebar (Ver Galeria + Fechar) */
        .${P}-sidebar-actions { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; }
        .${P}-sidebar-gallery-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; border-radius: 8px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); color: #fff; font: 600 12px/1 Inter, system-ui, sans-serif; cursor: pointer; text-decoration: none; transition: background .12s, border-color .12s, color .12s; }
        .${P}-sidebar-gallery-btn:hover { background: rgba(${t.accentRgb},.18); border-color: var(--${P}-accent, ${t.accent}); color: #fff; }
        .${P}-sidebar-gallery-btn svg { width: 14px; height: 14px; color: var(--${P}-accent, ${t.accent}); }

        .${P}-sidebar-btn { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 8px; border: 0; background: transparent; color: rgba(255,255,255,.7); cursor: pointer; transition: background .12s, color .12s; flex: 0 0 auto; }
        .${P}-sidebar-btn:hover { background: rgba(255,255,255,.1); color: #fff; }
        .${P}-sidebar-btn svg { width: 17px; height: 17px; }

        /* Campo de busca sutil na sidebar */
        .${P}-sidebar-search { flex: 0 0 auto; padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,.06); background: #0e0f13; }
        .${P}-sidebar-search input { width: 100%; height: 32px; border-radius: 8px; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.04); color: #fff; font-size: 12.5px; padding: 0 10px; outline: none; transition: border-color .12s, background .12s; }
        .${P}-sidebar-search input:focus { border-color: var(--${P}-accent, ${t.accent}); background: rgba(255,255,255,.07); }

        /* Lista vertical de itens */
        .${P}-playlist-list { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 8px 10px; display: flex; flex-direction: column; gap: 8px; scrollbar-width: thin; scrollbar-color: rgba(${t.accentRgb},.35) transparent; }
        .${P}-playlist-list::-webkit-scrollbar { width: 6px; }
        .${P}-playlist-list::-webkit-scrollbar-thumb { background: rgba(${t.accentRgb},.35); border-radius: 4px; }
        .${P}-playlist-list::-webkit-scrollbar-thumb:hover { background: rgba(${t.accentRgb},.6); }

        /* Item de playlist com thumbnails aumentadas */
        .${P}-playlist-item { display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 10px; background: rgba(255,255,255,.02); border: 1px solid transparent; color: #fff; text-decoration: none; transition: background .12s, border-color .12s, transform .1s; position: relative; }
        .${P}-playlist-item:hover { background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.08); transform: translateX(2px); }
        .${P}-playlist-item.is-current { background: rgba(${t.accentRgb},.13); border-color: rgba(${t.accentRgb},.38); }
        /* Itens fora da tela não são renderizados (o item atual fica sempre renderizado). */
        .${P}-playlist-item:not(.is-current) { content-visibility: auto; flex-shrink: 0; contain-intrinsic-block-size: auto 99px; }
        .${P}-playlist-item.is-current::before { content: none; }
        .${P}-playlist-thumb-wrap { position: relative; flex: 0 0 176px; width: 176px; height: 99px; border-radius: 8px; overflow: hidden; background: #181920; }
        .${P}-playlist-thumb { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; }
        .${P}-playlist-thumb-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; background: linear-gradient(135deg, #13151f 0%, #0d0e14 100%); border: 1px solid rgba(255, 255, 255, 0.06); box-sizing: border-box; }
        .${P}-playlist-thumb-placeholder svg { width: 22px; height: 22px; color: var(--${P}-accent, ${t.accent}); opacity: 0.9; }
        .${P}-playlist-ph-ext { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 9.5px; font-weight: 700; line-height: 1; letter-spacing: 0.05em; padding: 2px 5px; border-radius: 4px; background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.85); border: 1px solid rgba(255, 255, 255, 0.08); }
        .${P}-playlist-kind { position: absolute; top: 6px; left: 6px; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.78); color: #fff; font: 700 10px/1.2 Inter, system-ui, sans-serif; letter-spacing: .02em; }
        .${P}-playlist-num { position: absolute; top: 6px; right: 6px; z-index: 1; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.8); color: #fff; font: 700 11px/1 Inter, system-ui, sans-serif; }
        .${P}-playlist-dur { position: absolute; bottom: 5px; right: 6px; z-index: 1; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.8); color: #fff; font: 700 11px/1 Inter, system-ui, sans-serif; }
        .${P}-playlist-dur[hidden] { display: none !important; }
        .${P}-playlist-info { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .${P}-playlist-name { font-size: 14.5px; font-weight: 500; line-height: 1.35; color: rgba(255,255,255,.9); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; word-break: break-word; }
        .${P}-playlist-item.is-current .${P}-playlist-name { color: #fff; font-weight: 700; }
        .${P}-playlist-meta { font-size: 12.5px; color: rgba(255,255,255,.5); display: flex; align-items: center; gap: 8px; }
        .${P}-playlist-meta-active { color: var(--${P}-accent, ${t.accent}); font-weight: 600; }
        @media (max-width: 1024px) {
            .${P}-sidebar { flex: 0 0 340px; width: 340px; }
            .${P}-playlist-thumb-wrap { flex: 0 0 110px; width: 110px; height: 62px; }
        }

`;
        const mobileA = `        /* ===== ADAPTAÇÃO MOBILE (<= 768px) ESTILO YOUTUBE ===== */
        @media (max-width: 768px) {
            /* 1. O Stage não prende a tela: flui verticalmente com scroll natural */
            html.${P}-has-stage, html.${P}-has-stage body { overflow: auto !important; height: 100% !important; }
            .${P}-stage {
                position: fixed !important;
                inset: 0 !important;
                width: 100% !important;
                height: 100% !important;
                flex-direction: column !important;
                overflow-y: auto !important;
                overflow-x: hidden !important;
                -webkit-overflow-scrolling: touch !important;
            }
            .${P}-stage-main {
                flex: 0 0 auto !important;
                width: 100% !important;
                height: auto !important;
                min-height: auto !important;
                overflow: visible !important;
            }

            /* 2. Topbar em 2 Linhas:
               Linha 1: Logo [B bunkr.] + Título completo (.b-name com flex: 1 1 auto)
               Linha 2: Metadados (.${P}-stats), [Mirror] e atalho [Playlist] */
            .${P}-vrow {
                flex: 0 0 auto !important;
                flex-direction: column !important;
                height: auto !important;
                min-height: 80px !important;
                padding: 8px 12px !important;
                gap: 6px !important;
                align-items: stretch !important;
                position: sticky !important;
                top: 0 !important;
                z-index: 50 !important;
                background: #0e0f13 !important;
            }
            .${P}-vrow-top {
                width: 100% !important;
                height: 32px !important;
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                min-width: 0 !important;
            }
            .${P}-vrow-top .b-name {
                flex: 1 1 auto !important;
                max-width: none !important;
                font-size: 13.5px !important;
                min-width: 0 !important;
            }
            .${P}-vrow-top .b-name span {
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
            }
            .${P}-vrow-sub {
                width: 100% !important;
                height: 32px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: flex-start !important;
                gap: 6px !important;
            }
            .${P}-vrow-sub .b-spacer {
                flex: 1 1 auto !important;
            }
            .${P}-vrow-playlist {
                display: inline-flex !important;
                padding: 4px 9px !important;
                font-size: 11.5px !important;
            }

            /* 3. Mídia central no topo (proporção de vídeo 16:9) */
            .${P}-stage-mid {
                flex: 0 0 auto !important;
                width: 100% !important;
                height: auto !important;
                min-height: 210px !important;
            }
            .${P}-stage.is-video .${P}-stage-mid {
                aspect-ratio: 16 / 9 !important;
                max-height: 56.25vw !important;
            }
            .${P}-stage.is-video .${P}-stage-mid > .${P}-host {
                width: 100% !important;
                height: 100% !important;
                aspect-ratio: 16 / 9 !important;
            }
            .${P}-stage.is-image .${P}-stage-mid {
                min-height: 280px !important;
                max-height: 70vh !important;
            }
            .${P}-stage.is-text .${P}-stage-mid {
                min-height: 320px !important;
                max-height: 60vh !important;
            }

`;
        const plcMobile = `            /* 4. Base do player em 2 Linhas:
               Linha 1: Controles de reprodução (Play, Repeat, Prev, Next, Skips, Vol, Tempo à direita)
               Linha 2: Ações secundárias (Autoplay à esquerda, Velocidade 1x, Report, Download, Share, PiP, Fullscreen à direita) */
            .${P}-plc-bottom {
                padding: 0 8px 6px !important;
            }
            .${P}-plc-row {
                flex-direction: column !important;
                align-items: stretch !important;
                gap: 3px !important;
                min-height: auto !important;
            }
            .${P}-plc-left {
                display: flex !important;
                align-items: center !important;
                justify-content: flex-start !important;
                width: 100% !important;
                height: 34px !important;
                gap: 1px !important;
            }
            .${P}-plc-left .${P}-plc-time {
                margin-left: auto !important;
                padding: 0 2px !important;
                font-size: 11px !important;
            }
            .${P}-plc-right {
                display: flex !important;
                align-items: center !important;
                justify-content: flex-end !important;
                width: 100% !important;
                height: 34px !important;
                padding-top: 3px !important;
                border-top: 1px solid rgba(255,255,255,.08) !important;
                gap: 3px !important;
            }
            .${P}-plc-act:not(.${P}-plc-autoplay):not(.${P}-plc-speed) {
                width: 30px !important;
                height: 30px !important;
            }
            .${P}-plc-act svg {
                width: 17px !important;
                height: 17px !important;
            }
            .${P}-plc-autoplay {
                width: auto !important;
                min-width: 86px !important;
                flex: 0 0 auto !important;
                margin-right: auto !important;
                height: 28px !important;
                padding: 0 8px 0 10px !important;
                gap: 6px !important;
                white-space: nowrap !important;
            }
            .${P}-plc-ap-label {
                font-size: 11px !important;
                white-space: nowrap !important;
            }
            .${P}-plc-ap-pill {
                width: 24px !important;
                height: 14px !important;
                flex: 0 0 24px !important;
            }
            .${P}-plc-ap-knob {
                width: 10px !important;
                height: 10px !important;
            }
            .${P}-plc-autoplay.is-active .${P}-plc-ap-knob {
                transform: translateX(10px) !important;
            }
            .${P}-plc-speed {
                width: auto !important;
                height: 30px !important;
                font-size: 13.5px !important;
                padding: 0 3px !important;
            }

`;
        const mobileB = `            /* 5. Próximos vídeos (Sidebar de Playlist) aparecem abaixo do player */
            .${P}-sidebar {
                flex: 1 0 auto !important;
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                min-height: 400px !important;
                border-left: 0 !important;
                border-top: 1px solid rgba(255,255,255,.08) !important;
                display: flex !important;
            }
            .${P}-stage.is-sidebar-collapsed .${P}-sidebar {
                width: 100% !important;
                flex-basis: auto !important;
                min-width: 100% !important;
                pointer-events: auto !important;
                display: flex !important;
                overflow: visible !important;
            }
            .${P}-sidebar-close {
                display: none !important;
            }
            .${P}-playlist-list {
                flex: 0 0 auto !important;
                max-height: none !important;
                overflow: visible !important;
                height: auto !important;
                padding: 8px 10px 48px !important;
            }
            .${P}-playlist-thumb-wrap {
                flex: 0 0 132px !important;
                width: 132px !important;
                height: 74px !important;
            }
            .${P}-playlist-name { font-size: 13.5px !important; }
            .${P}-playlist-date-lbl, .${P}-playlist-date-val, .${P}-playlist-meta { font-size: 12px !important; }
        }
`;
        const misc = `        .${P}-thumb-placeholder { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 35%, #181b24 0%, #0e1017 100%) !important; border-radius: 14px; gap: 8px; z-index: 1; user-select: none; pointer-events: none; border: 1px solid rgba(255,255,255,0.06); }
        .${P}-ph-icon { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 12px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.06); }
        .${P}-ph-icon svg { width: 22px; height: 22px; stroke: currentColor; fill: none; }
        .${P}-ph-badge { font-family: Inter, system-ui, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: rgba(255,255,255,0.75); background: rgba(255,255,255,0.07); padding: 2px 7px; border-radius: 5px; border: 1px solid rgba(255,255,255,0.08); }

        /* Preview do conteúdo de arquivo .txt no card da galeria */
        .${P}-txt-preview { position: absolute; inset: 0; display: flex; flex-direction: column; background: #0f1118 !important; border-radius: 14px; padding: 10px 12px; overflow: hidden; z-index: 1; pointer-events: none; border: 1px solid rgba(255,255,255,0.08); }
        .${P}-txt-head { display: flex; align-items: center; gap: 7px; padding-bottom: 6px; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.08); flex: 0 0 auto; }
        .${P}-txt-head-tag { font: 700 9.5px/1 Inter, monospace; background: rgba(${t.accentRgb},0.18); color: ${t.accentLight}; padding: 2.5px 6px; border-radius: 4px; border: 1px solid rgba(${t.accentRgb},0.3); letter-spacing: 0.03em; }
        .${P}-txt-head-title { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.65); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .${P}-txt-body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace !important; font-size: 10.5px !important; line-height: 1.45 !important; color: #cbd5e1 !important; white-space: pre-wrap !important; word-break: break-all !important; overflow: hidden !important; flex: 1 1 auto; margin: 0 !important; opacity: 0.9; }
        .${P}-txt-fade { position: absolute; left: 0; right: 0; bottom: 0; height: 38px; background: linear-gradient(to top, #0f1118 15%, transparent 100%); pointer-events: none; }

        /* Visualizador de texto no Stage da página de arquivo (.is-text) */
        .${P}-txt-stage-host { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 24px; box-sizing: border-box; overflow: hidden; }
        .${P}-txt-stage-card { width: 100%; max-width: 960px; height: 85vh; max-height: 820px; background: #11131a; border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; display: flex; flex-direction: column; box-shadow: 0 16px 40px rgba(0,0,0,0.6); overflow: hidden; }
        .${P}-txt-stage-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; background: #161822; border-bottom: 1px solid rgba(255,255,255,0.08); flex: 0 0 auto; }
        .${P}-txt-stage-info { display: flex; align-items: center; gap: 10px; }
        .${P}-txt-tag { font: 700 10.5px/1 Inter, monospace; letter-spacing: 0.05em; background: rgba(${t.accentRgb},0.2); color: ${t.accentLight}; padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(${t.accentRgb},0.35); }
        .${P}-txt-meta { font-size: 12px; color: rgba(255,255,255,0.6); }
        .${P}-txt-stage-actions { display: flex; align-items: center; gap: 8px; }
        .${P}-txt-btn { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #fff; font: 600 12px/1 Inter, sans-serif; cursor: pointer; text-decoration: none; transition: background .12s, border-color .12s; }
        .${P}-txt-btn:hover { background: rgba(${t.accentRgb},0.15); border-color: rgba(${t.accentRgb},0.4); color: #fff; text-decoration: none; }
        .${P}-txt-btn[disabled] { opacity: 0.45; cursor: not-allowed; pointer-events: none; }
        .${P}-txt-btn svg { width: 14px; height: 14px; }
        .${P}-txt-stage-content { flex: 1 1 auto; overflow-y: auto; padding: 18px 20px; margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace !important; font-size: 13px !important; line-height: 1.6 !important; color: #e2e8f0 !important; white-space: pre-wrap !important; word-break: break-word !important; background: transparent !important; }

        /* toast (feedback de copiar etc.) — acima do stage */
        .${P}-toast { position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%) translateY(12px); z-index: 100001; padding: 10px 18px; border-radius: 20px; background: #14161a; border: 1px solid ${t.accent}66; color: #fff; font: 13px Inter, system-ui, sans-serif; box-shadow: 0 6px 22px rgba(0,0,0,.6); opacity: 0; pointer-events: none; transition: opacity .2s, transform .2s; }
        .${P}-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }`;
        return {
            player: plc + photo + stage + mobileA + plcMobile + mobileB,
            // Só o player (hosts que ainda têm stage próprio): controles + regras mobile dos controles.
            plc: plc + "        @media (max-width: 768px) {\n" + plcMobile + "        }\n",
            photo,
            actionbar: `        /* Nova Actionbar Integrada com busca, chips e ações */
        .${P}-gallery-actionbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #111318; border: 1px solid rgba(255,255,255,.08); border-radius: 16px; padding: 8px 12px; margin: 16px 0 24px; box-shadow: 0 4px 20px rgba(0,0,0,.25); flex-wrap: wrap; }
        .${P}-actionbar-search { position: relative; flex: 1 1 320px; min-width: 240px; max-width: 480px; }
        .${P}-actionbar-search input { width: 100%; height: 38px; border-radius: 10px; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.04); color: #fff; font-size: 13px; font-family: inherit; padding: 0 34px 0 36px; outline: none; transition: border-color .14s, background .14s, box-shadow .14s; }
        .${P}-actionbar-search input:focus { border-color: var(--${P}-accent, ${t.accent}); background: rgba(255,255,255,.07); box-shadow: 0 0 0 3px rgba(${t.accentRgb},.15); }
        .${P}-actionbar-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: rgba(255,255,255,.45); pointer-events: none; }
        .${P}-actionbar-search-clear { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; border-radius: 50%; border: 0; background: rgba(255,255,255,.1); color: rgba(255,255,255,.7); font-size: 13px; display: none; align-items: center; justify-content: center; cursor: pointer; transition: background .12s, color .12s; }
        .${P}-actionbar-search-clear:hover { background: rgba(255,255,255,.2); color: #fff; }
        .${P}-actionbar-search.has-text .${P}-actionbar-search-clear { display: flex; }

        .${P}-actionbar-chips { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .${P}-actionbar-label { font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: rgba(255,255,255,.4); margin-right: 4px; user-select: none; }
        .${P}-chip { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; border-radius: 9999px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); color: rgba(255,255,255,.8); font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all .14s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; }
        .${P}-chip:hover { background: rgba(255,255,255,.1); color: #fff; border-color: rgba(255,255,255,.15); }
        .${P}-chip.is-active { background: var(--${P}-accent, ${t.accent}); color: ${t.onAccent}; border-color: var(--${P}-accent, ${t.accent}); font-weight: 700; box-shadow: 0 2px 10px rgba(${t.accentRgb},.3); }
        .${P}-chip svg { width: 14px; height: 14px; flex-shrink: 0; }

        .${P}-actionbar-divider { width: 1px; height: 24px; background: rgba(255,255,255,.1); margin: 0 4px; }

        .${P}-actionbar-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-left: auto; }
        .${P}-act-btn { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 11px; border-radius: 8px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); color: rgba(255,255,255,.75); font-size: 12px; font-weight: 600; cursor: pointer; transition: all .12s ease; }
        .${P}-act-btn:hover { background: rgba(${t.accentRgb},.12); border-color: rgba(${t.accentRgb},.35); color: #fff; }
        .${P}-act-btn.is-active { background: rgba(${t.accentRgb},.2); border-color: var(--${P}-accent, ${t.accent}); color: var(--${P}-accent, ${t.accent}); }
        .${P}-act-btn svg { width: 14px; height: 14px; flex-shrink: 0; }

        .${P}-actionbar-count { font-size: 12px; font-weight: 600; color: rgba(255,255,255,.45); background: rgba(255,255,255,.05); padding: 4px 10px; border-radius: 999px; white-space: nowrap; margin-left: 6px; }
        .${P}-sort-direction { font-size: 11px; margin-left: 2px; opacity: .85; }

        /* Controles de ordenação na Sidebar da Playlist (maiores e rounded-full) */
        .${P}-sidebar-sort { display: flex; align-items: center; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
        .${P}-sidebar-sort-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: rgba(255,255,255,.45); margin-right: 2px; user-select: none; }
        .${P}-sb-chip { display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 12px; border-radius: 9999px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); color: rgba(255,255,255,.75); font: 600 12px/1 Inter, system-ui, sans-serif; cursor: pointer; transition: all .14s ease; user-select: none; }
        .${P}-sb-chip:hover { background: rgba(255,255,255,.12); color: #fff; border-color: rgba(255,255,255,.18); }
        .${P}-sb-chip.is-active { background: var(--${P}-accent, ${t.accent}); border-color: var(--${P}-accent, ${t.accent}); color: ${t.onAccent}; font-weight: 700; box-shadow: 0 2px 8px rgba(${t.accentRgb},.3); }
        .${P}-sb-dir { font-size: 10px; }
`,
            dates: `        /* Datas em texto simples nos itens da playlist da sidebar (sem badge, sem ícones) */
        .${P}-playlist-dates { display: flex; flex-direction: column; gap: 2px; margin-top: 3px; }
        .${P}-playlist-dates { min-width: 0; }
        .${P}-playlist-date-row { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 12px; line-height: 1.3; color: rgba(255,255,255,.5); white-space: nowrap; overflow: hidden; }
        .${P}-playlist-date-lbl { flex: 0 0 auto; white-space: nowrap; }
        .${P}-playlist-date-val { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .${P}-playlist-date-lbl { color: rgba(255,255,255,.55); font-weight: 600; font-size: 12.5px; }
        .${P}-playlist-date-val { color: rgba(255,255,255,.9); font-weight: 600; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; }

        /* Tooltip sutil e ícone em Data Extraída */
        .${P}-has-tip { cursor: help !important; display: inline-flex !important; align-items: center !important; gap: 3px !important; }
        .${P}-tip-icon { display: inline-flex; align-items: center; justify-content: center; font-size: 9.5px; line-height: 1; color: rgba(255,255,255,.5); border-radius: 50%; width: 13px; height: 13px; background: rgba(255,255,255,.08); transition: color .15s ease, background .15s ease; user-select: none; }
        .${P}-has-tip:hover .${P}-tip-icon { color: #fff; background: var(--${P}-accent, ${t.accent}); }

        /* Cabeçalhos de seção quando Agrupar por Tipo está ativo */
        .${P}-group-header { grid-column: 1 / -1 !important; display: flex !important; align-items: center !important; gap: 14px !important; margin-top: 24px !important; margin-bottom: 4px !important; padding-top: 14px !important; user-select: none !important; }
        .${P}-group-header:first-of-type { margin-top: 0 !important; padding-top: 0 !important; }
        .${P}-group-header-left { display: flex; align-items: center; gap: 8px; font-size: 15.5px; font-weight: 700; color: #f3f4f6; white-space: nowrap; }
        .${P}-group-header-left svg { width: 18px; height: 18px; color: var(--${P}-accent, ${t.accent}); flex-shrink: 0; }
        .${P}-group-count { font-size: 11.5px; font-weight: 600; color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.08); padding: 2.5px 8.5px; border-radius: 999px; }
        .${P}-group-line { flex: 1; height: 1px; background: rgba(255,255,255,0.08); }
`,
            misc,
            // Só o leitor de texto do stage (.X-txt-stage-*), para hosts que ainda têm CSS próprio no resto.
            textStage: misc.slice(misc.indexOf("        /* Visualizador de texto no Stage"), misc.indexOf("        /* toast")),
        };
    }

    /* ===================== CORE: PLAYER (scripts/media/core/player.js) ===================== */
    const MEDIA_ICONS = {
        play: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M7 4.5v15a1 1 0 0 0 1.52.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>',
        pause: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><rect x="6" y="4.5" width="4" height="15" rx="1.5"/><rect x="14" y="4.5" width="4" height="15" rx="1.5"/></svg>',
        prev: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M6 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1zm12.44 1.34a1 1 0 0 0-1.44-.88l-9 5.5a1 1 0 0 0 0 1.72l9 5.5A1 1 0 0 0 19 17.5v-11a1 1 0 0 0-.56-.86z"/></svg>',
        next: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" style="display:block"><path d="M18 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1zM5.56 6.66a1 1 0 0 0-1.56.84v11a1 1 0 0 0 1.56.84l9-5.5a1 1 0 0 0 0-1.68l-9-5.5z"/></svg>',
        repeat: svgi('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'),
        playlist: svgi('<line x1="3" y1="6" x2="15" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="11" y2="18"/><polygon points="17,14 22,17 17,20" fill="currentColor" stroke="none"/>'),
        volume: svgi('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>'),
        volumeLow: svgi('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>'),
        mute: svgi('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>'),
        expand: svgi('<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>'),
        download: svgi('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
        skipBack: svgi('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>'),
        skipFwd: svgi('<path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>'),
        chevL: svgi('<path d="m15 18-6-6 6-6"/>'),
        chevR: svgi('<path d="m9 18 6-6-6-6"/>'),
        chevDown: svgi('<path d="m6 9 6 6 6-6"/>'),
        grid: svgi('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
        image: svgi('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'),
        video: svgi('<rect x="2" y="5" width="14" height="14" rx="2"/><path d="m22 8-6 4 6 4V8z"/>'),
        copy: svgi('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
        share: svgi('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>'),
        flag: svgi('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>'),
        dns: svgi('<rect x="2" y="3" width="20" height="6" rx="1"/><rect x="2" y="15" width="20" height="6" rx="1"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>'),
        check: svgi('<polyline points="20 6 9 17 4 12"/>'),
        close: svgi('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
        pip: svgi('<rect x="2" y="4" width="20" height="16" rx="2"/><rect x="12" y="10" width="8" height="8" rx="1"/>'),
        doc: svgi('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>'),
        archive: svgi('<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>'),
        audio: svgi('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
        file: svgi('<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>'),
        group: svgi('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>'),
    };

    /* controles estilo YouTube Pro (core: player do bunkr, usado por todos os hosts).
     * hooks: nav(dir) álbum anterior/próximo · download(src) + downloadTitle · report() · sideNav (setas laterais
     * sobre o vídeo) · extraRight: [elementos] antes do PiP/tela cheia · overlay: [elementos] sobre
     * o vídeo · ignoreKeys() true = atalhos desligados · quietSeek() true = seek sem spinner. Usa os globais do host:
     * prefs, saveP, toggleSidebar e MEDIA_PREFIX. */
    function buildPlayerControls(wrap, video, src, ac, hooks) {
        hooks = hooks || {};
        const P = MEDIA_PREFIX;
        const navFile = dir => { if (hooks.nav) hooks.nav(dir); };
        const on = (e, ev, fn) => e.addEventListener(ev, fn, ac ? { signal: ac.signal } : undefined);
        const mkAct = (ic, label, cb) => { const b = el("button", { type: "button", class: `${P}-plc-act`, title: label, "aria-label": label }); b.innerHTML = ic; b.addEventListener("click", cb); return b; };
        // play() recusado (autoplay com som bloqueado) → tenta de novo mudo
        const toggle = () => {
            if (!video.paused && !video.ended) { video.pause(); return; }
            const p = video.play();
            if (p && p.catch) p.catch(() => { if (video.muted) return; video.muted = true; const q = video.play(); if (q && q.catch) q.catch(() => {}); });
        };
        const sflash = el("div", { class: `${P}-plc-seekflash` }); let sft;
        const seek = d => { if (!video.duration) return; video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + d)); sflash.textContent = d < 0 ? `« ${-d}s` : `${d}s »`; sflash.classList.add("on"); clearTimeout(sft); sft = setTimeout(() => sflash.classList.remove("on"), 480); };
        let clickT = null;
        on(video, "click", e => { e.preventDefault(); e.stopPropagation(); if (clickT) return; clickT = setTimeout(() => { clickT = null; toggle(); }, 230); });
        on(video, "dblclick", e => { e.preventDefault(); e.stopPropagation(); if (clickT) { clearTimeout(clickT); clickT = null; } const r = video.getBoundingClientRect(); seek((e.clientX - r.left) < r.width / 2 ? -5 : 5); });
        
        const playBtn = el("button", { type: "button", class: `${P}-plc-play`, "aria-label": "Play/Pause" }); playBtn.innerHTML = MEDIA_ICONS.play;
        playBtn.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); toggle(); });
        const flash = el("div", { class: `${P}-plc-flash` }, playBtn);
        
        // Timeline com tooltip de tempo flutuante
        const buf = el("div", { class: `${P}-plc-buf` });
        const knob = el("div", { class: `${P}-plc-knob` });
        const fill = el("div", { class: `${P}-plc-fill` }, knob);
        const bar = el("div", { class: `${P}-plc-bar` }, buf, fill);
        const timeTip = el("div", { class: `${P}-plc-timetip` }, "0:00");
        const prog = el("div", { class: `${P}-plc-prog` }, bar, timeTip);
        
        const seekTo = (cx, r) => { if (!video.duration || !r.width) return; video.currentTime = Math.max(0, Math.min(1, (cx - r.left) / r.width)) * video.duration; };
        prog.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); const r = bar.getBoundingClientRect(); seekTo(e.clientX, r); const mv = ev => seekTo(ev.clientX, r); const up = () => { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); }; document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up); });
        prog.addEventListener("pointermove", ev => {
            const r = bar.getBoundingClientRect();
            if (!r.width || !video.duration) return;
            const ratio = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
            timeTip.textContent = fmtT(ratio * video.duration);
            timeTip.style.left = (ratio * 100) + "%";
        });

        const tEl = el("span", { class: `${P}-plc-time` }, "0:00 / 0:00");
        const syncTime = () => { const s = fmtT(video.currentTime) + (video.duration ? " / " + fmtT(video.duration) : ""); if (tEl.firstChild.data !== s) tEl.firstChild.data = s; };
        on(video, "timeupdate", () => { if (video.duration) fill.style.width = (video.currentTime / video.duration * 100) + "%"; syncTime(); });
        on(video, "loadedmetadata", syncTime);
        on(video, "progress", () => { try { if (video.buffered.length && video.duration) buf.style.width = (video.buffered.end(video.buffered.length - 1) / video.duration * 100) + "%"; } catch {} });

        // Volume com ícones dinâmicos
        const mute = mkAct(MEDIA_ICONS.mute, "Mudo (m)", e => { e.stopPropagation(); video.muted = !video.muted; if (!video.muted && !video.volume) video.volume = 1; syncVol(); });
        const volfill = el("div", { class: `${P}-plc-volfill` });
        const volbar = el("div", { class: `${P}-plc-volbar`, role: "slider", "aria-label": "Volume" }, volfill);
        const syncVol = () => {
            if (video.muted || !video.volume) mute.innerHTML = MEDIA_ICONS.mute;
            else if (video.volume < 0.5) mute.innerHTML = MEDIA_ICONS.volumeLow;
            else mute.innerHTML = MEDIA_ICONS.volume;
            volfill.style.width = ((video.muted ? 0 : video.volume) * 100) + "%";
        };
        const setVolX = (cx, r) => { if (!r.width) return; const v = Math.max(0, Math.min(1, (cx - r.left) / r.width)); video.volume = v; video.muted = (v === 0); syncVol(); };
        volbar.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); const r = volbar.getBoundingClientRect(); setVolX(e.clientX, r); const mv = ev => setVolX(ev.clientX, r); const up = () => { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); }; document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up); });
        const volgrp = el("div", { class: `${P}-plc-vol` }, mute, volbar);

        const goFs = () => { try { const target = document.querySelector(`.${P}-stage`) || wrap; document.fullscreenElement ? document.exitFullscreen() : target.requestFullscreen(); } catch {} };

        // 1º botão da esquerda: Play/Pause
        const barPlay = mkAct(MEDIA_ICONS.play, "Play/Pause (espaço / k)", e => { e.stopPropagation(); toggle(); });
        barPlay.classList.add(`${P}-plc-barplay`);

        // 2º botão da esquerda: Loop / Repetir (ao lado direito do play/pause)
        const loopBtn = mkAct(MEDIA_ICONS.repeat, prefs.loop ? "Repetir vídeo (ativado)" : "Repetir vídeo", e => {
            e.stopPropagation();
            video.loop = !video.loop;
            prefs.loop = video.loop;
            saveP();
            syncLoop();
            toast(video.loop ? "Repetir ativado" : "Repetir desativado");
        });
        loopBtn.classList.add(`${P}-plc-loop`);
        const syncLoop = () => {
            loopBtn.classList.toggle("is-active", !!video.loop);
            loopBtn.title = video.loop ? "Repetir vídeo (ativado)" : "Repetir vídeo";
        };

        // Botões de navegação no álbum e saltos de 5s
        const prevBtn = mkAct(MEDIA_ICONS.prev, "Anterior no álbum (Shift+P)", e => { e.stopPropagation(); navFile(-1); });
        prevBtn.classList.add(`${P}-plc-prev`);

        const mkSkip = (ic, label, cb) => {
            const b = el("button", { type: "button", class: `${P}-plc-act ${P}-plc-skip`, title: label, "aria-label": label });
            b.innerHTML = ic;
            b.appendChild(el("span", { class: `${P}-plc-skipn` }, "5"));
            b.addEventListener("click", cb);
            return b;
        };
        const skipBack = mkSkip(MEDIA_ICONS.skipBack, "Voltar 5s (←) · 10s (j)", e => { e.stopPropagation(); seek(-5); });
        const skipFwd = mkSkip(MEDIA_ICONS.skipFwd, "Avançar 5s (→) · 10s (l)", e => { e.stopPropagation(); seek(5); });

        const nextBtn = mkAct(MEDIA_ICONS.next, "Próximo no álbum (Shift+N)", e => { e.stopPropagation(); navFile(1); });
        nextBtn.classList.add(`${P}-plc-next`);

        // 1º da direita: Autoplay com label textual
        const apBtn = el("button", {
            type: "button",
            class: `${P}-plc-act ${P}-plc-autoplay` + (prefs.autoplay ? " is-active" : ""),
            title: prefs.autoplay ? "Reprodução automática ativada" : "Reprodução automática desativada",
            "aria-label": "Reprodução automática"
        },
            el("span", { class: `${P}-plc-ap-label` }, "Autoplay"),
            el("span", { class: `${P}-plc-ap-pill` }, el("span", { class: `${P}-plc-ap-knob` }))
        );
        const syncAutoplay = () => {
            apBtn.classList.toggle("is-active", !!prefs.autoplay);
            apBtn.title = prefs.autoplay ? "Reprodução automática ativada" : "Reprodução automática desativada";
        };
        apBtn.addEventListener("click", e => {
            e.stopPropagation();
            prefs.autoplay = !prefs.autoplay;
            saveP();
            syncAutoplay();
            toast(prefs.autoplay ? "Autoplay ativado" : "Autoplay desativado");
        });

        // Autoplay ao término do vídeo
        on(video, "ended", () => {
            if (!video.loop && prefs.autoplay) {
                toast("Próximo vídeo...");
                setTimeout(() => navFile(1), 600);
            }
        });

        // 2º da direita: Seletor de velocidade moderno (pill + popup blur)
        const RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];
        const speedMenu = el("div", { class: `${P}-plc-speedmenu` });
        const speedBtn = el("button", { type: "button", class: `${P}-plc-act ${P}-plc-speed`, title: "Velocidade", "aria-label": "Velocidade" }, "1x");
        const speedWrap = el("div", { class: `${P}-plc-speedwrap` }, speedMenu, speedBtn);
        
        const speedHead = el("div", { class: `${P}-plc-speedhead` },
            el("span", null, "Velocidade"),
            el("button", {
                type: "button",
                class: `${P}-plc-speedreset`,
                title: "Restaurar 1x",
                onClick: ev => { ev.stopPropagation(); try { video.playbackRate = 1; } catch {} closeSpeed(); }
            }, "1x")
        );
        speedMenu.appendChild(speedHead);

        let speedCloser = null;
        const closeSpeed = () => {
            speedMenu.classList.remove("open");
            wrap.classList.remove("is-menu-open");
            if (speedCloser) { document.removeEventListener("pointerdown", speedCloser, true); speedCloser = null; }
        };
        const openSpeed = () => {
            speedMenu.classList.add("open");
            wrap.classList.add("is-menu-open");
            speedCloser = ev => { if (!speedWrap.contains(ev.target)) closeSpeed(); };
            document.addEventListener("pointerdown", speedCloser, true);
        };
        RATES.forEach(r => {
            const it = el("button", { type: "button", class: `${P}-plc-speeditem` },
                el("span", null, r === 1 ? "1x (Normal)" : r + "x")
            );
            it.insertAdjacentHTML("beforeend", MEDIA_ICONS.check);
            it.dataset.r = r;
            it.addEventListener("click", e => {
                e.stopPropagation();
                try { video.playbackRate = r; } catch {}
                closeSpeed();
            });
            speedMenu.appendChild(it);
        });
        speedBtn.addEventListener("click", e => { e.stopPropagation(); speedMenu.classList.contains("open") ? closeSpeed() : openSpeed(); });
        const syncSpeed = () => {
            const r = video.playbackRate;
            speedBtn.textContent = r + "x";
            speedMenu.querySelectorAll(`.${P}-plc-speeditem`).forEach(it => it.classList.toggle("on", +it.dataset.r === r));
        };
        on(video, "ratechange", () => { prefs.rate = video.playbackRate; saveP(); syncSpeed(); });
        on(video, "loadedmetadata", () => {
            try { video.playbackRate = prefs.rate || 1; } catch {}
            video.loop = !!prefs.loop;
            syncLoop();
        });

        // 3º da direita: Report (hook do host; padrão: link de denúncia da página)
        const reportBtn = mkAct(MEDIA_ICONS.flag, "Reportar abuso", e => {
            e.stopPropagation();
            if (hooks.report) { hooks.report(); return; }
            const a = document.querySelector('a[href*="report"], a[href*="abuse"]');
            if (a && a.href) window.open(a.href, "_blank");
            else toast("Sem página de denúncia neste site");
        });

        // 4º da direita: Download (hook do host; padrão: baixa o próprio src)
        const dlb = mkAct(MEDIA_ICONS.download, hooks.downloadTitle || "Baixar vídeo", e => {
            e.stopPropagation();
            if (hooks.download) { hooks.download(src); return; }
            const a = document.createElement("a");
            a.href = src;
            a.download = "";
            a.rel = "noopener";
            a.click();
        });

        // 5º da direita: Share / Copiar link com feedback visual
        const shareBtn = mkAct(MEDIA_ICONS.share, "Compartilhar / Copiar link", e => {
            e.stopPropagation();
            copyText(location.href).then(ok => {
                toast(ok ? "Link copiado!" : "Falha ao copiar link");
                if (ok) {
                    shareBtn.innerHTML = MEDIA_ICONS.check;
                    setTimeout(() => { shareBtn.innerHTML = MEDIA_ICONS.share; }, 1600);
                }
            });
        });

        // 6º da direita: Picture-in-Picture (se suportado pelo browser)
        let pipBtn = null;
        if (document.pictureInPictureEnabled) {
            pipBtn = mkAct(MEDIA_ICONS.pip, "Picture-in-Picture", async e => {
                e.stopPropagation();
                try {
                    if (document.pictureInPictureElement) await document.exitPictureInPicture();
                    else if (video.requestPictureInPicture) await video.requestPictureInPicture();
                } catch {}
            });
        }

        // 7º da direita: Tela cheia
        const fsb = mkAct(MEDIA_ICONS.expand, "Tela cheia (f)", e => { e.stopPropagation(); goFs(); });

        const leftc = el("div", { class: `${P}-plc-left` }, barPlay, loopBtn, prevBtn, nextBtn, skipBack, skipFwd, volgrp, tEl);
        const rightc = el("div", { class: `${P}-plc-right` }, apBtn, speedWrap, reportBtn, dlb, shareBtn);
        (hooks.extraRight || []).forEach(x => rightc.appendChild(x));
        if (pipBtn) rightc.appendChild(pipBtn);
        rightc.appendChild(fsb);

        const row = el("div", { class: `${P}-plc-row` }, leftc, rightc);
        const bottom = el("div", { class: `${P}-plc-bottom` }, prog, row);

        on(video, "play", () => { wrap.classList.add("is-playing"); playBtn.innerHTML = MEDIA_ICONS.pause; barPlay.innerHTML = MEDIA_ICONS.pause; });
        on(video, "pause", () => { wrap.classList.remove("is-playing"); playBtn.innerHTML = MEDIA_ICONS.play; barPlay.innerHTML = MEDIA_ICONS.play; });
        on(video, "volumechange", syncVol);
        on(video, "seeking", () => { if (hooks.quietSeek && hooks.quietSeek()) return; wrap.classList.add("is-buffering"); });
        ["seeked", "canplay", "playing", "loadeddata", "pause", "suspend", "error", "abort"].forEach(ev => on(video, ev, () => wrap.classList.remove("is-buffering")));
        const setRate = dir => { const i = RATES.indexOf(video.playbackRate); const ni = Math.max(0, Math.min(RATES.length - 1, (i < 0 ? 3 : i) + dir)); try { video.playbackRate = RATES[ni]; } catch {} };
        const onKey = e => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const t = e.target;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable || (t.closest && t.closest(`.${P}-sidebar-search, .${P}-search`)))) return;
            if (hooks.ignoreKeys && hooks.ignoreKeys()) return;
            const k = e.key; let h = true;
            if (k === " " || k === "k") toggle();
            else if (k === "ArrowLeft") seek(-5);
            else if (k === "ArrowRight") seek(5);
            else if (k === "j") seek(-10);
            else if (k === "l") seek(10);
            else if (e.shiftKey && (k === "N" || k === "n")) navFile(1);
            else if (e.shiftKey && (k === "P" || k === "p")) navFile(-1);
            else if (k === "p" || k === "P") toggleSidebar();
            else if (k === "r" || k === "R") { video.loop = !video.loop; prefs.loop = video.loop; saveP(); syncLoop(); toast(video.loop ? "Repetir ativado" : "Repetir desativado"); }
            else if (k === "ArrowUp") { video.muted = false; video.volume = Math.min(1, video.volume + 0.05); }
            else if (k === "ArrowDown") video.volume = Math.max(0, video.volume - 0.05);
            else if (k === "m") { video.muted = !video.muted; if (!video.muted && !video.volume) video.volume = 1; }
            else if (k === "f") goFs();
            else if (k === "<") setRate(-1);
            else if (k === ">") setRate(1);
            else if (k >= "0" && k <= "9" && video.duration) video.currentTime = video.duration * (+k) / 10;
            else h = false;
            if (h) { e.preventDefault(); e.stopPropagation(); }
        };
        if (ac) document.addEventListener("keydown", onKey, { capture: true, signal: ac.signal });
        // Setas laterais sobre o vídeo (hooks.sideNav) e extras que o host sobrepõe ao player (hooks.overlay)
        const side = [];
        if (hooks.sideNav) {
            const prevA = el("button", { type: "button", class: `${P}-plc-side ${P}-plc-sprev`, title: "Mídia anterior", "aria-label": "Mídia anterior" });
            prevA.innerHTML = MEDIA_ICONS.chevL; prevA.addEventListener("click", e => { e.stopPropagation(); navFile(-1); });
            const nextA = el("button", { type: "button", class: `${P}-plc-side ${P}-plc-snext`, title: "Próxima mídia", "aria-label": "Próxima mídia" });
            nextA.innerHTML = MEDIA_ICONS.chevR; nextA.addEventListener("click", e => { e.stopPropagation(); navFile(1); });
            side.push(prevA, nextA);
        }
        wrap.append(flash, sflash, bottom, ...side, ...(hooks.overlay || []));
        try { video.playbackRate = prefs.rate || 1; video.loop = !!prefs.loop; } catch {}
        syncVol(); syncTime(); syncSpeed(); syncLoop(); syncAutoplay();
    }

    /* ===================== CORE: DOM HELPERS (scripts/media/core/dom.js) ===================== */
    function el(tag, props, ...kids) {
        const n = document.createElement(tag);
        if (props) for (const [k, v] of Object.entries(props)) {
            if (v == null) continue;
            if (k === "class") n.className = v;
            else if (k === "html") n.innerHTML = v;
            else if (k === "style" && typeof v === "object") Object.assign(n.style, v);
            else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2).toLowerCase(), v);
            else n.setAttribute(k, v);
        }
        for (const kid of kids) if (kid != null && kid !== false) n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
        return n;
    }
    function svgi(inner) {
        return `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block">${inner}</svg>`;
    }
    function addCSS(css) {
        if (typeof GM_addStyle === "function") { GM_addStyle(css); return; }
        const s = document.createElement("style"); s.textContent = css;
        (document.head || document.documentElement).appendChild(s);
    }
    function onReady(fn) {
        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
        else fn();
    }
    function debounce(fn, ms) { let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; }
    function fmtT(s) {
        s = Math.max(0, Math.floor(s || 0));
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
        const p = n => String(n).padStart(2, "0");
        return h ? h + ":" + p(m) + ":" + p(ss) : m + ":" + p(ss);
    }

    /* ===================== CORE: CLIPBOARD + TOAST (scripts/media/core/clipboard.js) ===================== */
    function fallbackCopy(s) { try { const t = el("textarea", { style: { position: "fixed", opacity: "0", left: "-9999px" } }); t.value = s; document.body.appendChild(t); t.select(); const ok = document.execCommand("copy"); t.remove(); return ok; } catch { return false; } }
    function copyText(s) {   // clipboard API (assíncrono) com fallback p/ execCommand; resolve booleano de sucesso
        if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(s).then(() => true, () => fallbackCopy(s));
        return Promise.resolve(fallbackCopy(s));
    }

    /* ===================== CORE: TOAST (scripts/media/core/toast.js) — classe <MEDIA_PREFIX>-toast ===================== */
    let toastT;
    function toast(msg) {
        const cls = MEDIA_PREFIX + "-toast";
        let t = document.querySelector("." + cls);
        if (!t) { t = el("div", { class: cls }); (document.body || document.documentElement).appendChild(t); }
        t.textContent = msg; t.classList.add("show");
        clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 1800);
    }

    /* ===================== CORE: DATAS E TÍTULOS (scripts/media/core/dates.js) ===================== */
    function cleanHtmlText(str) {
        if (!str || typeof str !== "string") return "";
        let cur = str;
        for (let i = 0; i < 3; i++) {
            if (!/&[a-zA-Z0-9#]+;/.test(cur)) break;
            const txt = document.createElement("textarea");
            txt.innerHTML = cur;
            cur = txt.value;
        }
        return cur.trim();
    }

    function extractDateFromTitle(title) {
        if (!title || typeof title !== "string") return null;
        title = cleanHtmlText(title).trim();

        // 1. ISO: YYYY[-._]MM[-._]DD
        const mIso = title.match(/(?:^|[\[(_\s])(20\d\d|19\d\d)[.\-_](0[1-9]|1[0-2])[.\-_](0[1-9]|[12]\d|3[01])\b/);
        if (mIso) {
            const y = parseInt(mIso[1], 10), m = parseInt(mIso[2], 10), d = parseInt(mIso[3], 10);
            return {
                timestamp: Date.UTC(y, m - 1, d),
                formatted: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
                displayDate: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`,
                year: y, month: m, day: d,
                raw: mIso[0].trim().replace(/^[\[(_\s]+|[\])_\s]+$/g, "")
            };
        }

        // 2. Compacto: YYYYMMDD
        const mCompact = title.match(/(?:^|[\[(_\s])(20\d\d|19\d\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\b/);
        if (mCompact) {
            const y = parseInt(mCompact[1], 10), m = parseInt(mCompact[2], 10), d = parseInt(mCompact[3], 10);
            return {
                timestamp: Date.UTC(y, m - 1, d),
                formatted: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
                displayDate: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`,
                year: y, month: m, day: d,
                raw: mCompact[0].trim().replace(/^[\[(_\s]+|[\])_\s]+$/g, "")
            };
        }

        // 3. BR/EU: DD[-._]MM[-._]YYYY
        const mDmy = title.match(/(?:^|[\[(_\s])(0[1-9]|[12]\d|3[01])[.\-_](0[1-9]|1[0-2])[.\-_](20\d\d|19\d\d)\b/);
        if (mDmy) {
            const d = parseInt(mDmy[1], 10), m = parseInt(mDmy[2], 10), y = parseInt(mDmy[3], 10);
            return {
                timestamp: Date.UTC(y, m - 1, d),
                formatted: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
                displayDate: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`,
                year: y, month: m, day: d,
                raw: mDmy[0].trim().replace(/^[\[(_\s]+|[\])_\s]+$/g, "")
            };
        }

        // 4. Mês e Ano: YYYY[-._]MM
        const mYm = title.match(/(?:^|[\[(_\s])(20\d\d|19\d\d)[.\-_](0[1-9]|1[0-2])\b/);
        if (mYm) {
            const y = parseInt(mYm[1], 10), m = parseInt(mYm[2], 10);
            return {
                timestamp: Date.UTC(y, m - 1, 1),
                formatted: `${y}-${String(m).padStart(2, "0")}`,
                displayDate: `${String(m).padStart(2, "0")}/${y}`,
                year: y, month: m, day: 1,
                raw: mYm[0].trim().replace(/^[\[(_\s]+|[\])_\s]+$/g, "")
            };
        }

        return null;
    }

    // keepExt: bunkr mostra o nome com extensão; os outros hosts tiram.
    function cleanTitleWithoutDate(title, dt, keepExt) {
        if (!title || typeof title !== "string") return "";
        title = cleanHtmlText(title).trim();
        const target = keepExt ? title : (title.replace(/\.[a-zA-Z0-9]{2,5}$/i, "").trim() || title);
        if (!dt || !dt.raw) return target;
        const esc = dt.raw.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        let cleaned = target.replace(new RegExp("^[\\s\\[(_-]*" + esc + "[\\s\\])_–—-]*(?:[-–—_]\\s*)?", "i"), "");
        cleaned = cleaned.replace(/^[\s\-_–—.]+\s*/, "").trim();
        return cleaned || target;
    }

    function formatDisplayDate(isoOrDate) {
        if (!isoOrDate) return "";
        try {
            const d = new Date(isoOrDate);
            if (isNaN(d.getTime())) return String(isoOrDate);
            const pad = n => String(n).padStart(2, "0");
            const dia = pad(d.getDate()), mes = pad(d.getMonth() + 1), ano = d.getFullYear();
            const hora = pad(d.getHours()), min = pad(d.getMinutes());
            return `${dia}/${mes}/${ano} ${hora}:${min}`;   // mesmo formato do bunkr (formatUploadDate)
        } catch {
            return String(isoOrDate);
        }
    }

    /* ===================== CORE: ?position= NA URL (scripts/media/core/position.js) ===================== */
    function readPosition() {
        try { const n = parseInt(new URL(location.href).searchParams.get("position") || "", 10); return Number.isFinite(n) && n > 0 ? n : 0; } catch { return 0; }
    }
    function writePosition(n) {
        try {
            const u = new URL(location.href);
            if (String(u.searchParams.get("position") || "") === String(n)) return;
            u.searchParams.set("position", String(n));
            history.replaceState(history.state, "", u.pathname + u.search + u.hash);
        } catch {}
    }
    function hrefWithPosition(href, n) {
        try { const u = new URL(href, location.origin); u.searchParams.set("position", String(n)); return u.pathname + u.search + u.hash; } catch { return href; }
    }
    // Lista de arquivos com href: ?position=N manda para o N-ésimo; sem ?position grava a posição atual.
    function applyListPosition(items) {
        if (!items || !items.length) return;
        const want = readPosition();
        const curPath = location.pathname;
        const i = items.findIndex(it => {
            try { return new URL(it.href, location.origin).pathname === curPath; } catch (e) { return false; }
        });
        if (want && items[want - 1]) {
            let targetPath = "";
            try { targetPath = new URL(items[want - 1].href, location.origin).pathname; } catch (e) {}
            if (targetPath && targetPath !== curPath) {
                location.replace(hrefWithPosition(items[want - 1].href, want));
                return;
            }
        }
        if (i >= 0 && !want) history.replaceState(history.state, "", hrefWithPosition(location.href, i + 1));
    }

    /* ====================================================================
     * FILOSOFIA — só ESTILO + um reorder/limpeza leve do header. NÃO toco na
     * engine do Bunkr (o Plyr é montado por id #video-wrapper → continua intacto)
     * nem nos scripts de anúncio/anti-adblock (WASM) → não quebra a página.
     * ==================================================================== */

    const COL = "min(100% - 32px, 1800px, calc((100vh - 120px) * 16 / 9))";   // coluna = maior 16:9 que cabe (mais larga; sobra p/ topbar+gap)

    const MEDIA_CSS = mediaComponentCSS(MEDIA_THEME);
    const CSS = `
        /* ===== TIPOGRAFIA SEM SERIFA NATIVA E RESET GLOBAL ===== */
        html, body {
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif !important;
            background: #0b0c0f !important;
            color: #fff !important;
        }
        h1, h2, h3, h4, .font-cabinet {
            font-family: Cabinet Grotesk, Inter, ui-sans-serif, system-ui, sans-serif !important;
        }

        /* ===== HOMEPAGE ESTILO AMOLED MODERNO ===== */
        html.bunkr-home, html.bunkr-home body { background: #0b0c0f !important; min-height: 100vh; }
        html.bunkr-home .ttwp { min-height: calc(100vh - 70px); display: flex; align-items: center; justify-content: center; }
        html.bunkr-home .bg-mute {
            background: #111318 !important; border: 1px solid rgba(255, 255, 255, 0.08) !important;
            border-radius: 20px !important; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45) !important;
        }
        html.bunkr-home h1 { font-family: Cabinet Grotesk, Inter, system-ui, sans-serif !important; color: #fff !important; }
        html.bunkr-home .btn-main {
            background: linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 100%) !important; color: #0e0f13 !important;
            font-weight: 700 !important; border: 0 !important; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.35) !important;
            transition: transform .12s, box-shadow .12s !important;
        }
        html.bunkr-home .btn-main:hover { transform: translateY(-2px) !important; box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5) !important; }
        html.bunkr-home .btn-main-light {
            background: rgba(255, 255, 255, 0.06) !important; border: 1px solid rgba(255, 255, 255, 0.1) !important;
            color: rgba(255, 255, 255, 0.8) !important;
        }
        html.bunkr-home .text-subs { color: rgba(255, 255, 255, 0.6) !important; }

        /* ===== COLUNA COMPARTILHADA: player + título (info) na MESMA largura/posição → alinhados ===== */
        html.bunkr-file main.cont,
        .rounded-lg section > div.mx-auto,
        .rounded-lg section > div[class*="max-w"],
        .rounded-lg section > div:has(#video-container) {
            max-width: ${COL} !important;
            max-height: none !important;
            margin-left: auto !important;
            margin-right: auto !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
        }
        /* ÁLBUM: conteúdo LARGO e ALINHADO com a topbar (mesma largura 1800) + respiro maior pra topbar */
        html.bunkr-album main.cont { max-width: min(100% - 24px, 2560px) !important; padding-top: 28px !important; margin-left: auto !important; margin-right: auto !important; }   /* v2.3: usa quase toda a largura (mais colunas no grid) */
        /* header alinhado (mesmo cap) */
        header .cont { max-width: min(100% - 24px, 2560px) !important; margin-inline: auto !important; }
        #video-container { max-width: 100% !important; }

        /* ===== PLAYER: enche a coluna, 16:9, arredondado (sem o cap de 1000px nem o height:100% do tema) ===== */
        #video-wrapper .plyr,
        #video-wrapper .plyr--video,
        #video-container .plyr {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            border-radius: 14px;
            overflow: hidden;
        }
        .plyr__video-wrapper, .plyr__video-wrapper--fixed-ratio { aspect-ratio: 16 / 9 !important; max-height: none !important; }
        #loading-background { max-height: none !important; }

        /* ===== PÁGINA DE FOTO — imagem grande/centralizada ===== */
        .rounded-lg img:not(.grid-images_box-img) {
            display: block;
            max-width: 100% !important;
            max-height: calc(100vh - 120px);
            width: auto;
            margin-inline: auto;
            border-radius: 14px;
        }
        /* (grade de arquivos estilizada lá embaixo, vale pro álbum E a section "More files") */

        /* ===== TÍTULO/INFO = barra de título do YouTube, flush-left (escondo o círculo de tipo) ===== */
        main.cont { padding-top: 16px !important; }
        main span.icon.w-12, main .flex.items-center.gap-3 > span.icon { display: none !important; }
        main h1 { font-size: 1.35rem !important; line-height: 1.3 !important; }
        @media (min-width: 768px) { main h1 { font-size: 1.6rem !important; } }

        /* ===== TOPBAR PADRONIZADA (IDÊNTICA À DA PLAYLIST/PLAYER) ===== */
        header.bunkr-global-header, header {
            position: sticky; top: 0; z-index: 50; background: #0e0f13 !important;
            border-bottom: 1px solid rgba(255,255,255,.07) !important;
            transition: padding .22s cubic-bezier(0.4, 0, 0.2, 1), background .22s ease, box-shadow .22s ease;
        }
        .bunkr-header-cont {
            max-width: min(100% - 32px, 2560px) !important; margin: 0 auto !important;
            padding: 8px 16px !important; display: flex !important; align-items: center !important;
            justify-content: space-between !important; gap: 16px !important; height: 52px !important;
            transition: height .22s ease, padding .22s ease;
        }
        /* Comportamento na homepage: mais alta no topo, encolhe no scroll */
        html.bunkr-home header.is-home-expanded .bunkr-header-cont { height: 68px !important; padding: 12px 24px !important; }
        html.bunkr-home header.is-home-expanded { background: rgba(14, 15, 19, 0.95) !important; backdrop-filter: blur(16px); }

        .bunkr-header-right { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .bunkr-header-btn {
            display: inline-flex; align-items: center; gap: 7px; height: 32px; padding: 0 11px;
            border-radius: 8px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
            color: rgba(255,255,255,.8); font: 600 12.5px/1 Inter, system-ui, sans-serif; cursor: pointer;
            text-decoration: none; transition: background .12s, border-color .12s, color .12s; user-select: none;
        }
        html.bunkr-home header.is-home-expanded .bunkr-header-btn { height: 36px; padding: 0 14px; font-size: 13px; }
        .bunkr-header-btn:hover { background: rgba(167,139,250,.14); border-color: rgba(167,139,250,.35); color: #fff; }
        .bunkr-header-btn svg { width: 14px; height: 14px; flex-shrink: 0; color: var(--bunkr-accent, #a78bfa); }

        /* ===== ESPAÇAMENTO: player↔título PEQUENO (YouTube); respiro só no fim ===== */
        .rounded-lg section > div.mx-auto { padding-top: 6px !important; padding-bottom: 6px !important; }   /* era py-8 (32px) → gap enorme até o título */
        .bunkr-player-block { margin-top: 18px !important; padding-bottom: 0 !important; }                    /* respiro ABAIXO da topbar + zera o respiro que caía entre player e título (pós-reorder) */
        main.cont { padding-top: 12px !important; padding-bottom: 64px !important; }                          /* título colado no player + respiro no fim da página */
        body { padding-bottom: 40px !important; }
        footer { padding-top: 28px !important; }

        /* ===== banner VERMELHO de troca de domínio → fora (fallback; o JS remove de fato) ===== */
        body > div[style*="red"] { display: none !important; }

        /* ===== BOTÃO DE MIRROR (canto sup-direito do player) — VISÍVEL SÓ NO HOVER do player (igual controles do YT) ===== */
        .bunkr-mirror { position: absolute; top: 12px; right: 12px; z-index: 50; font-family: Inter, system-ui, sans-serif; opacity: 0; pointer-events: none; transition: opacity .18s ease; }
        .bunkr-has-mirror:hover .bunkr-mirror, .bunkr-mirror.is-open { opacity: 1; pointer-events: auto; }   /* hover do player OU menu aberto */
        .bunkr-mirror-btn { display: inline-flex; align-items: center; gap: 7px; height: 36px; padding: 0 14px; border: 1px solid rgba(255,255,255,0.2); border-radius: 11px; background: rgba(14,14,19,0.8); color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); box-shadow: 0 4px 16px rgba(0,0,0,0.42); transition: background .14s ease, border-color .14s ease, color .14s ease; }
        .bunkr-mirror-btn svg { width: 16px; height: 16px; }
        .bunkr-mirror-btn:hover, .bunkr-mirror.is-open .bunkr-mirror-btn { background: #a78bfa; border-color: #a78bfa; color: #160f24; }
        /* DROPDOWN em GRID 2-colunas (compacto, em vez da lista alta) */
        .bunkr-mirror-menu { position: absolute; top: calc(100% + 8px); right: 0; width: 300px; max-width: 78vw; max-height: 60vh; overflow-y: auto; padding: 10px; border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; background: rgba(18,19,24,0.97); box-shadow: 0 18px 46px rgba(0,0,0,0.62); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); }
        .bunkr-mirror-menu[hidden] { display: none; }
        .bunkr-mirror-head { padding: 2px 4px 9px; font-size: 11px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: rgba(255,255,255,0.45); }
        .bunkr-mirror-head b { color: #a78bfa; font-weight: 700; }
        .bunkr-mirror-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
        .bunkr-mirror-item { display: flex; align-items: center; justify-content: center; padding: 10px 8px; border-radius: 10px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.86); font-size: 12.5px; font-weight: 600; text-decoration: none; white-space: nowrap; transition: background .12s ease, color .12s ease; }
        .bunkr-mirror-item:hover { background: #a78bfa; color: #160f24; }
        .bunkr-mirror-item.is-current { background: rgba(167,139,250,0.18); color: #a78bfa; cursor: default; }
        .bunkr-mirror-item.is-current:hover { background: rgba(167,139,250,0.18); color: #a78bfa; }

        /* ===== aviso "mirror pode estar fora" (overlay no topo do player, após o teste falhar) ===== */
        .bunkr-mirror-warn { position: absolute; left: 50%; top: 14px; transform: translateX(-50%); z-index: 55; display: flex; align-items: center; gap: 14px; max-width: calc(100% - 24px); padding: 10px 16px; border-radius: 12px; background: rgba(176,32,32,0.94); color: #fff; font: 600 13.5px/1.3 Inter, system-ui, sans-serif; box-shadow: 0 12px 34px rgba(0,0,0,0.55); }
        .bunkr-mirror-warn span { font-weight: 400; opacity: .85; }
        .bunkr-mirror-warn-btn { flex: 0 0 auto; padding: 7px 12px; border-radius: 9px; background: #fff; color: #b02020; font-weight: 700; text-decoration: none; white-space: nowrap; }
        .bunkr-mirror-warn-btn:hover { filter: brightness(0.94); }
        .bunkr-mirror-warn-x { flex: 0 0 auto; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 8px; background: rgba(255,255,255,0.16); color: #fff; cursor: pointer; transition: background .12s ease; }
        .bunkr-mirror-warn-x:hover { background: rgba(255,255,255,0.3); }
        .bunkr-mirror-warn-x svg { width: 16px; height: 16px; }

        /* ===== GRADE DE ARQUIVOS ESTILO YOUTUBE (ÁLBUM E MORE FILES) ===== */
        .grid-images, #galleryGrid, #related-files-grid { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)) !important; gap: 32px 24px !important; }
        @media (min-width: 1600px) { .grid-images, #galleryGrid, #related-files-grid { grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)) !important; gap: 36px 28px !important; } }
        @media (max-width: 768px) { .grid-images, #galleryGrid, #related-files-grid { grid-template-columns: 1fr !important; gap: 20px 16px !important; } }

        /* Card estilo YouTube (.theItem) */
        .theItem { position: relative !important; display: flex !important; flex-direction: column !important; background: transparent !important; border: 0 !important; padding: 0 !important; border-radius: 14px !important; cursor: pointer !important; transition: transform .14s cubic-bezier(0.4, 0, 0.2, 1) !important; box-shadow: none !important; }
        .theItem:hover { transform: translateY(-4px) !important; box-shadow: none !important; }

        /* Box da thumbnail (16:9, cantos arredondados, fundo escuro) */
        .theItem .grid-images_box-txt { order: 1 !important; position: relative !important; width: 100% !important; aspect-ratio: 16 / 9 !important; border-radius: 14px !important; overflow: hidden !important; background: #14161f !important; box-shadow: 0 4px 16px rgba(0,0,0,.4) !important; margin: 0 !important; padding: 0 !important; }
        .theItem .grid-images_box-img { width: 100% !important; height: 100% !important; aspect-ratio: 16 / 9 !important; object-fit: cover !important; display: block !important; border-radius: 14px !important; transition: transform .24s cubic-bezier(0.4, 0, 0.2, 1) !important; }
        .theItem:hover .grid-images_box-img { transform: scale(1.04) !important; }

        /* Badges sobre a thumbnail */
        .theItem > span[class*="type-"] { position: absolute !important; top: 8px !important; right: 8px !important; z-index: 2 !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; width: 26px !important; height: 26px !important; padding: 0 !important; border-radius: 8px !important; background: rgba(14, 16, 22, 0.9) !important; border: 1px solid rgba(255,255,255,.14) !important; box-shadow: 0 2px 8px rgba(0,0,0,.5) !important; }
        .theItem > span[class*="type-"] img { width: 14px !important; height: 14px !important; filter: brightness(1.2) !important; }
        .theItem-size-badge { position: absolute; bottom: 8px; right: 8px; z-index: 2; background: rgba(0, 0, 0, 0.86); color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 0.02em; padding: 2.5px 6px; border-radius: 5px; pointer-events: none; box-shadow: 0 2px 6px rgba(0,0,0,.6); }

        /* Metadados abaixo da thumbnail (estilo YouTube alinhado à esquerda) */
        .theItem > div.mt-2 { order: 2 !important; display: flex !important; flex-direction: column !important; gap: 4px !important; background: transparent !important; background-color: transparent !important; padding: 10px 2px 4px !important; margin: 0 !important; border-radius: 0 !important; text-align: left !important; }
        .theItem .theName { margin: 0 !important; font-size: 13.5px !important; font-weight: 600 !important; line-height: 1.35 !important; color: #f3f4f6 !important; text-align: left !important; display: -webkit-box !important; -webkit-line-clamp: 2 !important; -webkit-box-orient: vertical !important; overflow: hidden !important; word-break: break-word !important; transition: color .12s ease !important; }
        .theItem:hover .theName { color: var(--bunkr-accent, #a78bfa) !important; }
        .grid-images.full-filename .theItem .theName, #galleryGrid.full-filename .theItem .theName { -webkit-line-clamp: unset !important; display: block !important; }
        .theItem .theDate, .theItem .theSize, .theItem-title-date-badge { display: none !important; }
        .theItem .text-subs { display: block !important; margin: 0 !important; color: inherit !important; }
        .theItem a[aria-label="download"], .theItem a[href] { position: absolute !important; inset: 0 !important; z-index: 5 !important; cursor: pointer !important; }
        html.bunkr-album .album-toolbar, html.bunkr-album .album-adv { margin-left: 0 !important; margin-right: 0 !important; }
        /* heading "More files…" + botão Load More (cards no fim do arquivo) */
        .files-album { font-size: 1.2rem !important; margin: 6px 0 14px !important; }
        #load-more-btn, .ld-more { display: block !important; width: 100% !important; margin: 22px 0 0 !important; padding: 13px !important; border-radius: 12px !important; border: 1px solid rgba(167,139,250,0.5) !important; background: rgba(167,139,250,0.08) !important; color: #c9b8ff !important; font-weight: 700 !important; transition: background .14s ease, color .14s ease; }
        #load-more-btn:hover, .ld-more:hover { background: rgba(167,139,250,0.18) !important; color: #fff !important; }
        /* a section "More files" do ARQUIVO alinha com a coluna do player/título + respiro */
        html.bunkr-file .cont:has(#related-files-grid) { max-width: ${COL} !important; margin-left: auto !important; margin-right: auto !important; padding-top: 8px !important; }

${MEDIA_CSS.player}
        /* ===== v2.9 — GALERIA DO ÁLBUM YOUTUBE STYLE + ACTIONBAR INTEGRADA ===== */
        html.dark { --color-body: 11 12 15; --color-fore: 14 15 19; --color-mute: 16 18 23; --color-soft: 22 24 30; --color-line: 34 38 48; --color-main: 167 139 250; --color-lead: 255 255 255; --color-subs: 226 226 232; }
        html.bunkr-album, html.bunkr-album body { background: #0b0c0f !important; }
        html.bunkr-album header { background: #0e0f13 !important; border-bottom: 1px solid rgba(255,255,255,.08) !important; }

        /* Header do Álbum: layout horizontal limpo com Report alinhado à direita */
        html.bunkr-album main > div.flex.items-center.flex-wrap:first-child,
        html.bunkr-album main > div.flex:first-child {
            display: flex !important; align-items: center !important; justify-content: space-between !important;
            flex-wrap: nowrap !important; gap: 16px !important; margin-bottom: 8px !important;
        }
        html.bunkr-album main > div.flex:first-child > div:first-child { flex: 1 1 auto !important; min-width: 0 !important; }
        html.bunkr-album main > div.flex:first-child > div:last-child { flex: 0 0 auto !important; width: auto !important; margin: 0 !important; }

        html.bunkr-album main h1 {
            font-family: Cabinet Grotesk, Inter, ui-sans-serif, system-ui, sans-serif !important;
            color: #fff !important; font-size: 1.55rem !important; font-weight: 700 !important;
            letter-spacing: -0.015em !important; line-height: 1.3 !important;
        }
        html.bunkr-album .ic-albums { background: rgba(167,139,250,.14) !important; color: #a78bfa !important; border-radius: 14px !important; border: 1px solid rgba(167,139,250,.3) !important; }
        html.bunkr-album .visitors, html.bunkr-album .text-xs {
            color: rgba(255,255,255,.62) !important; font-size: 12.5px !important;
            font-family: Inter, ui-sans-serif, system-ui, sans-serif !important;
        }
        html.bunkr-album .live-indicator-container { display: inline-flex !important; align-items: center !important; gap: 6px !important; margin-left: 8px !important; }

        /* Botão Report moderno ao lado */
        .bunkr-album-report-btn {
            display: inline-flex !important; align-items: center !important; gap: 6px !important;
            height: 34px !important; padding: 0 14px !important; border-radius: 8px !important;
            background: rgba(255,255,255,.05) !important; border: 1px solid rgba(255,255,255,.1) !important;
            color: rgba(255,255,255,.75) !important; font: 600 12.5px/1 Inter, ui-sans-serif, system-ui, sans-serif !important;
            text-decoration: none !important; cursor: pointer !important; white-space: nowrap !important;
            transition: background .12s, border-color .12s, color .12s !important;
        }
        .bunkr-album-report-btn:hover { background: rgba(239,68,68,.12) !important; border-color: rgba(239,68,68,.3) !important; color: #f87171 !important; }
        .bunkr-album-report-btn svg { width: 14px !important; height: 14px !important; color: currentColor !important; flex-shrink: 0 !important; }

        /* Oculta interface legada, paginação, contador nativo e tooltips residuais */
        html.bunkr-album .mode-toggle-btn, html.bunkr-album #advToggle, html.bunkr-album .adv-btn, html.bunkr-album .pagination,
        html.bunkr-album .album-toolbar, html.bunkr-album .advanced-notice, html.bunkr-album .album-adv,
        html.bunkr-album .floating-detailed-thumb, html.bunkr-album #floatingThumb,
        html.bunkr-album #resultsCounter, html.bunkr-album .results-counter,
        html.bunkr-album main > p:has(#resultsCounter), html.bunkr-album main > div:has(#resultsCounter),
        html.bunkr-album main .flex.bg-soft.p-1.rounded-lg.items-center { display: none !important; }

${MEDIA_CSS.actionbar}
        /* Datas em texto simples no card da galeria (sem badge, sem ícones) */
        .theItem-dates { display: flex; flex-direction: column; gap: 3px; font-size: 11.5px; text-align: left; margin-top: 5px; }
        .theItem-date-row { display: flex; align-items: center; justify-content: flex-start; gap: 4px; font-size: 11.5px; line-height: 1.35; margin: 0; color: rgba(255,255,255,.55); }
        .theItem-date-lbl { color: rgba(255,255,255,.45); font-weight: 500; font-size: 11px; }
        .theItem-date-val { color: rgba(255,255,255,.85); font-weight: 500; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; }

${MEDIA_CSS.dates}
        /* Placeholder genérico para thumbnails quebradas ou inexistentes */
        .grid-images_box-txt.has-placeholder .grid-images_box-img { display: none !important; }
${MEDIA_CSS.misc}
    `;

    addCSS(CSS);   // document-start → sem flash do layout antigo

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
        bindZoom(mid, newImg, { host, padH: 130, keys: { nav: navFile, fullscreenTarget: () => document.querySelector(".bunkr-stage") } });
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


    /* ====================================================================
     * v2.1 — STAGE estilo pixeldrain p/ página de vídeo/imagem: vrow (info) +
     * mídia FIXA no meio + strip collapsável dos outros arquivos do álbum.
     * ==================================================================== */
    // mirror inline no vrow (mesmo dropdown de domínios, agora como botão da topbar)
    function buildMirrorControl() {
        const cur = location.hostname.replace(/^www\./, "");
        const wrap = el("div", { class: "bunkr-mirror-vrow" });
        const btn = el("button", { type: "button", class: "bunkr-item", title: "Trocar de mirror (domínio)" }, el("span", { class: "bunkr-mirror-spin", "aria-hidden": "true" }));
        btn.insertAdjacentHTML("beforeend", PL_ICONS.dns); btn.append(el("span", null, "Mirror"));
        const menu = el("div", { class: "bunkr-mirror-menu", hidden: "" });
        menu.innerHTML = '<div class="bunkr-mirror-head">Trocar de mirror · <b>' + cur + '</b></div><div class="bunkr-mirror-grid"></div>';
        const grid = menu.querySelector(".bunkr-mirror-grid");
        MIRRORS.forEach(d => {
            const a = el("a", { class: "bunkr-mirror-item" + (d === cur ? " is-current" : "") }, d);
            if (d === cur) a.addEventListener("click", e => e.preventDefault());
            else a.href = location.protocol + "//" + d + location.pathname + location.search;
            grid.appendChild(a);
        });
        const setOpen = open => {   // menu em position:FIXED → calcula a posição no open (a vrow tem overflow:hidden, absolute era CORTADO)
            menu.hidden = !open;
            if (!open) return;
            const r = btn.getBoundingClientRect(), w = menu.offsetWidth || 300;
            menu.style.left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8)) + "px";
            const mh = menu.offsetHeight;
            menu.style.top = ((r.bottom + 8 + mh > window.innerHeight) ? Math.max(8, r.top - 8 - mh) : r.bottom + 8) + "px";
        };
        btn.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); setOpen(menu.hidden); });
        document.addEventListener("click", e => { if (!wrap.contains(e.target)) setOpen(false); });
        wrap.append(btn, menu);
        return wrap;
    }
    // monta o stage 1× (precisa do <main h1> server-rendered). Cobre a página (fixed) como o pixeldrain.
    function toggleSidebar(forceState) {
        const stage = document.querySelector(".bunkr-stage");
        if (!stage) return;
        const isCollapsed = typeof forceState === "boolean"
            ? forceState
            : !stage.classList.contains("is-sidebar-collapsed");
        stage.classList.toggle("is-sidebar-collapsed", isCollapsed);
        try { localStorage.setItem("bunkr_sidebar_collapsed", isCollapsed ? "1" : "0"); } catch {}
    }

    // monta o stage 1× (precisa do <main h1> server-rendered). Cobre a página (fixed) como o pixeldrain.
    function buildStage() {
        const existing = document.querySelector(".bunkr-stage");
        if (existing) return existing;
        const h1 = document.querySelector("main h1, h1, .file-name");
        if (!h1) return null;                          // main ainda não pronto
        const name = cleanHtmlText(h1.innerHTML || h1.textContent || "");
        const sizeEl = document.querySelector("main p.text-xs, p.text-xs, .file-size, .text-muted");
        const size = sizeEl ? (sizeEl.textContent || "").replace(/\s+/g, " ").trim() : "";
        const finfo = getFileInfo(name);
        const albumA = document.querySelector('a[href*="/a/"]');
        const isTxt = finfo.category === "text" || /\.txt$/i.test(name) || /\.md$/i.test(name) || /\.nfo$/i.test(name) || /\.log$/i.test(name);
        const isVid = !isTxt && !!document.querySelector("#video-container, #video-wrapper, video, #player");
        const stageType = isVid ? "is-video" : (isTxt ? "is-text" : "is-image");

        const stage = el("div", { class: "bunkr-stage " + stageType });
        
        // Coluna principal da esquerda (Topbar + Mídia)
        const stageMain = el("div", { class: "bunkr-stage-main" });

        // Topbar info (vrow)
        const vrow = el("div", { class: "bunkr-vrow" });

        // Row 1 (desktop esquerda, mobile linha 1): Logo + Título
        const vrowTop = el("div", { class: "bunkr-vrow-top" });

        // Logo no canto esquerdo da topbar (direciona para a home do Bunkr)
        const topLogo = el("a", { class: "bunkr-top-logo", href: "/", title: "Bunkr" });
        const logoBadge = el("span", { class: "bunkr-logo-badge" });
        logoBadge.insertAdjacentHTML("beforeend", PL_ICONS.bunkrMark);
        topLogo.append(logoBadge, el("span", { class: "bunkr-logo-text" }, "bunkr", el("span", { class: "bunkr-logo-dot" }, ".")));
        vrowTop.append(topLogo, el("div", { class: "b-vsep" }));

        // Título do arquivo
        const nameEl = el("div", { class: "b-name", title: name });
        nameEl.insertAdjacentHTML("beforeend", isVid ? PL_ICONS.video : (isTxt ? PL_ICONS.doc : PL_ICONS.image));
        nameEl.append(el("span", null, name));
        vrowTop.append(nameEl);

        // Row 2 (desktop direita, mobile linha 2): Stats, Mirror e Playlist
        const vrowSub = el("div", { class: "bunkr-vrow-sub" });

        // Stats: tamanho e tipo de arquivo
        const stats = el("div", { class: "bunkr-stats" });
        if (size) stats.append(el("span", { class: "bunkr-stat bunkr-stat-size" }, size));
        stats.append(el("span", { class: "bunkr-stat bunkr-stat-type" }, isVid ? "Vídeo" : (isTxt ? "Texto" : "Imagem")));
        vrowSub.append(stats);

        // Mirror switcher e espaçador
        vrowSub.append(el("div", { class: "b-vsep" }), buildMirrorControl(), el("div", { class: "b-spacer" }));

        // Botão de Playlist no canto direito da topbar (visível somente quando a sidebar estiver fechada ou no mobile)
        const vrowPl = el("button", {
            type: "button",
            class: "bunkr-item bunkr-vrow-playlist",
            title: "Abrir playlist do álbum (p)",
            onClick: () => {
                const sb = document.querySelector(".bunkr-sidebar");
                if (window.innerWidth <= 768 && sb) {
                    sb.scrollIntoView({ behavior: "smooth" });
                } else {
                    toggleSidebar(false);
                }
            }
        });
        vrowPl.insertAdjacentHTML("beforeend", PL_ICONS.playlist);
        vrowPl.append(el("span", null, "Playlist"));
        vrowSub.append(vrowPl);

        vrow.append(vrowTop, vrowSub);

        // Mídia central
        const mid = el("div", { class: "bunkr-stage-mid" });
        const navPrev = el("button", { class: "bunkr-nav-side bunkr-nav-prev", title: "Anterior no álbum (Shift+P)", "aria-label": "Anterior", onClick: e => { e.stopPropagation(); navFile(-1); } });
        navPrev.insertAdjacentHTML("beforeend", PL_ICONS.chevL);
        const navNext = el("button", { class: "bunkr-nav-side bunkr-nav-next", title: "Próximo no álbum (Shift+N)", "aria-label": "Próximo", onClick: e => { e.stopPropagation(); navFile(1); } });
        navNext.insertAdjacentHTML("beforeend", PL_ICONS.chevR);
        mid.append(navPrev, navNext);

        stageMain.append(vrow, mid);

        // Sidebar Playlist à direita (altura 100vh, ao lado de stageMain)
        const sidebar = el("aside", { class: "bunkr-sidebar" });
        const sbHead = el("div", { class: "bunkr-sidebar-header" });
        const sbTitle = el("div", { class: "bunkr-sidebar-title" });
        sbTitle.insertAdjacentHTML("beforeend", PL_ICONS.playlist);
        const sbCount = el("span", { class: "bunkr-sidebar-count" }, "");
        sbTitle.append(el("span", null, "Arquivos do álbum"), sbCount);

        const sbActions = el("div", { class: "bunkr-sidebar-actions" });
        const galleryBtn = el("a", {
            class: "bunkr-sidebar-gallery-btn",
            href: (albumA && albumA.href) || "#",
            title: "Ver galeria completa do álbum"
        });
        galleryBtn.insertAdjacentHTML("beforeend", PL_ICONS.grid);
        galleryBtn.append(el("span", null, "Galeria"));
        if (!albumA) galleryBtn.style.display = "none";

        const sbClose = el("button", {
            type: "button",
            class: "bunkr-sidebar-btn bunkr-sidebar-close",
            title: "Recolher playlist (p)",
            "aria-label": "Recolher playlist",
            onClick: () => toggleSidebar(true)
        });
        sbClose.insertAdjacentHTML("beforeend", PL_ICONS.close);
        sbActions.append(galleryBtn, sbClose);
        sbHead.append(sbTitle, sbActions);

        const sbSearch = el("div", { class: "bunkr-sidebar-search" });
        const sbInput = el("input", {
            type: "text",
            placeholder: "Filtrar no álbum…",
            value: getQ(),
            "aria-label": "Filtrar arquivos no álbum"
        });
        let sbSearchT;
        sbInput.addEventListener("input", () => {
            clearTimeout(sbSearchT);
            sbSearchT = setTimeout(() => {
                setQ(sbInput.value.trim());
                if (albumFilesCache) renderPlaylist(sidebarList, albumFilesCache, sbCount);
                else renderRelatedToPlaylist(sidebarList, sbCount);
            }, 180);
        });
        sbSearch.appendChild(sbInput);

        const sbSortBar = el("div", { class: "bunkr-sidebar-sort" });
        sbSortBar.innerHTML = `
            <span class="bunkr-sidebar-sort-label">Ordem:</span>
            <button type="button" class="bunkr-sb-chip is-active" data-pl-sort="default">Padrão</button>
            <button type="button" class="bunkr-sb-chip" data-pl-sort="upload-date" title="Ordenar por data de envio">
                <span>Data de Envio</span>
                <span class="bunkr-sb-dir">⬇</span>
            </button>
            <button type="button" class="bunkr-sb-chip" data-pl-sort="title-date" title="Ordenar por data extraída do nome">
                <span>Data Extraída</span>
                <span class="bunkr-sb-dir">⬇</span>
            </button>
            <button type="button" class="bunkr-sb-chip" data-pl-sort="name">A-Z</button>
        `;
        sbSearch.appendChild(sbSortBar);

        const updateSbChips = () => {
            sbSortBar.querySelectorAll(".bunkr-sb-chip").forEach(c => {
                const sm = c.dataset.plSort;
                c.classList.toggle("is-active", sm === plSortMode);
                if (sm === "upload-date") {
                    const dirEl = c.querySelector(".bunkr-sb-dir");
                    if (dirEl) dirEl.textContent = plUploadDateDir === "desc" ? "⬇" : "⬆";
                } else if (sm === "title-date") {
                    const dirEl = c.querySelector(".bunkr-sb-dir");
                    if (dirEl) dirEl.textContent = plTitleDateDir === "desc" ? "⬇" : "⬆";
                }
            });
        };
        updateSbChips();

        sbSortBar.querySelectorAll(".bunkr-sb-chip").forEach(c => {
            c.addEventListener("click", () => {
                const sm = c.dataset.plSort;
                if (sm === "upload-date") {
                    if (plSortMode === "upload-date") {
                        plUploadDateDir = plUploadDateDir === "desc" ? "asc" : "desc";
                    } else {
                        plSortMode = "upload-date";
                    }
                } else if (sm === "title-date") {
                    if (plSortMode === "title-date") {
                        plTitleDateDir = plTitleDateDir === "desc" ? "asc" : "desc";
                    } else {
                        plSortMode = "title-date";
                    }
                } else {
                    plSortMode = sm;
                }
                safeSetStorage("bunkr_pl_sort", plSortMode);
                safeSetStorage("bunkr_pl_upload_dir", plUploadDateDir);
                safeSetStorage("bunkr_pl_sort_dir", plTitleDateDir);
                updateSbChips();
                if (albumFilesCache) renderPlaylist(sidebarList, albumFilesCache, sbCount);
                else renderRelatedToPlaylist(sidebarList, sbCount);
            });
        });

        const sidebarList = el("div", { class: "bunkr-playlist-list" });
        sidebar.append(sbHead, sbSearch, sidebarList);

        stage.append(stageMain, sidebar);

        stage._sidebarList = sidebarList;
        stage._sbCount = sbCount;
        stage._galleryBtn = galleryBtn;

        const isCollapsed = safeGetStorage("bunkr_sidebar_collapsed") === "1";
        let singleOpen = "";
        try { singleOpen = sessionStorage.getItem(SINGLE_OPEN_KEY) || ""; if (singleOpen) sessionStorage.removeItem(SINGLE_OPEN_KEY); } catch {}
        if (isCollapsed || (singleOpen && singleOpen === fileSlug())) stage.classList.add("is-sidebar-collapsed");

        document.body.insertBefore(stage, document.body.firstChild);
        document.documentElement.classList.add("bunkr-has-stage");

        populatePlaylist(sidebar, sidebarList, sbCount);
        const grid = document.querySelector("#related-files-grid");
        if (grid) { try { new MutationObserver(() => renderRelatedToPlaylist(sidebarList, sbCount)).observe(grid, { childList: true }); } catch {} }
        return stage;
    }
    /* ---- FILTRO via ?q= (igual pixeldrain): persiste na URL, filtra a galeria do álbum E a strip do vídeo, e se propaga no clique ---- */
    function getQ() { try { return (new URLSearchParams(location.search).get("q") || "").trim(); } catch { return ""; } }
    function setQ(q) { try { const u = new URL(location.href); if (q) u.searchParams.set("q", q); else u.searchParams.delete("q"); history.replaceState(history.state, "", u.pathname + u.search + u.hash); } catch {} }
    function fileSlug() { return (location.pathname.match(/\/(?:f|i|v|d)\/([^/?#]+)/) || [])[1] || ""; }
    function isVidFile(f) {
        const ext = (f.extension || f.ext || "").toLowerCase();
        const type = (f.type || "").toLowerCase();
        const name = (f.original || f.name || "").toLowerCase();
        return /video/i.test(type) || /^(mp4|mkv|mov|webm|avi|flv|m4v|wmv|ts)$/i.test(ext) || /\.(mp4|mkv|mov|webm|avi|flv|m4v|wmv|ts)$/i.test(name);
    }
    function isImgFile(f) {
        const ext = (f.extension || f.ext || "").toLowerCase();
        const type = (f.type || "").toLowerCase();
        const name = (f.original || f.name || "").toLowerCase();
        return /image|photo/i.test(type) || /^(jpg|jpeg|png|gif|webp|bmp|svg|avif|heic)$/i.test(ext) || /\.(jpg|jpeg|png|gif|webp|bmp|svg|avif|heic)$/i.test(name);
    }
    function fileHref(f) {
        const slug = typeof f === "string" ? f : (f.slug || f.id || "");
        const isV = typeof f === "object" ? isVidFile(f) : false;
        const isI = typeof f === "object" ? isImgFile(f) : false;
        const prefix = isV ? "/v/" : (isI ? "/i/" : "/f/");
        const u = prefix + slug + (getQ() ? "?q=" + encodeURIComponent(getQ()) : "");
        return u;
    }
    function sortedAlbumList() {
        if (!albumFilesCache || !albumFilesCache.length) return [];
        const q = getQ().toLowerCase();
        let list = q ? albumFilesCache.filter(f => (f.original || f.name || "").toLowerCase().indexOf(q) !== -1) : albumFilesCache.slice();
        const activeDir = plSortMode === "upload-date" ? plUploadDateDir : plTitleDateDir;
        return sortFileList(list, plSortMode, activeDir);
    }
    /* ÁLBUM com UM arquivo: pula a grade e abre o arquivo direto no player, com a playlist recolhida SÓ nessa
       abertura (marca one-shot em sessionStorage; bunkr_sidebar_collapsed não é gravado). location.replace tira o
       álbum do histórico, e o álbum só abre sozinho 1× por aba: quem volta pela Galeria / voltar vê a grade → sem loop.
       (O referrer não basta: o botão Galeria passa pelo redirect do ?advanced=1, que troca o referrer pelo próprio álbum.) */
    const SINGLE_OPEN_KEY = "bunkr_single_open";
    const SINGLE_DONE_KEY = "bunkr_single_done:";
    const slugOfPath = p => (String(p || "").match(/\/(?:f|i|v|d)\/([^/?#]+)/) || [])[1] || "";
    function openSingleItemAlbum() {
        const albumId = (location.pathname.match(/\/a\/([^/?#]+)/) || [])[1];
        if (!albumId) return false;
        try { if (sessionStorage.getItem(SINGLE_DONE_KEY + albumId)) return false; } catch {}
        try { const nav = performance.getEntriesByType("navigation")[0]; if (nav && nav.type === "back_forward") return false; } catch {}
        const cards = document.querySelectorAll(".theItem");
        const files = Array.isArray(window.albumFiles) ? window.albumFiles : null;
        let href = "";
        if (files) {
            if (files.length !== 1 || cards.length > 1) return false;
            href = fileHref(files[0]);
        } else {
            if (cards.length !== 1) return false;
            const a = cards[0].querySelector('a[href*="/f/"], a[href*="/v/"], a[href*="/i/"]');
            href = a ? a.getAttribute("href") || "" : "";
        }
        let target;
        try { target = new URL(hrefWithPosition(href, 1), location.origin); } catch { return false; }
        const slug = slugOfPath(target.pathname);
        if (!slug || target.origin !== location.origin) return false;
        try {
            const ref = document.referrer ? new URL(document.referrer) : null;
            if (ref && ref.origin === location.origin && slugOfPath(ref.pathname) === slug) return false;
        } catch {}
        try { sessionStorage.setItem(SINGLE_OPEN_KEY, slug); sessionStorage.setItem(SINGLE_DONE_KEY + albumId, "1"); } catch {}
        location.replace(target.pathname + target.search + target.hash);
        return true;
    }
    function applyAlbumPosition() {
        const list = sortedAlbumList();
        if (!list.length) return;
        const slug = fileSlug();
        const i = list.findIndex(f => f.slug === slug);
        const want = readPosition();
        if (want && list[want - 1] && list[want - 1].slug !== slug) {
            location.replace(hrefWithPosition(fileHref(list[want - 1]), want));
            return;
        }
        if (i >= 0) writePosition(i + 1);
    }

    /* a página de ARQUIVO só tem o #related-files-grid (poucos). Pra strip INTEIRA: fetch /a/{id}?advanced=1 → extrai window.albumFiles (array literal da própria bunkr). Cache em sessionStorage por álbum (navegação fica rápida). */
    let albumFilesCache = null;
    async function loadAlbumFiles() {
        if (albumFilesCache) return albumFilesCache;
        const a = document.querySelector('a[href*="/a/"]'); if (!a) return null;
        const id = (a.href.match(/\/a\/([A-Za-z0-9]+)/) || [])[1]; if (!id) return null;
        const ck = "bunkr_album_" + id;
        try { const c = sessionStorage.getItem(ck); if (c) { albumFilesCache = JSON.parse(c); applyAlbumPosition(); return albumFilesCache; } } catch {}
        try {
            const base = a.href.split("#")[0].split("?")[0];
            const html = await (await fetch(base + "?advanced=1", { credentials: "include" })).text();
            const m = html.match(/window\.albumFiles\s*=\s*(\[[\s\S]*?\n\]);/);   // âncora no \n]; (fim do array) — os NOMES contêm ] (ex.: [uuid]), então não dá pra parar no 1º ]
            if (!m) return null;
            const files = (new Function("return " + m[1]))();   // eval do array literal da PRÓPRIA bunkr (mesmo trust da página; só os dados, não os scripts dela)
            if (!Array.isArray(files) || !files.length) return null;
            const slim = files.map(f => ({
                slug: f.slug,
                original: f.original || f.name || "",
                thumbnail: f.thumbnail || "",
                extension: f.extension || "",
                type: f.type || "",
                size: f.size || 0,
                timestamp: f.timestamp || ""
            }));
            albumFilesCache = slim; try { sessionStorage.setItem(ck, JSON.stringify(slim)); } catch {}
            applyAlbumPosition();
            return slim;
        } catch { return null; }
    }

    let plSortMode = safeGetStorage("bunkr_pl_sort", "default");
    let plUploadDateDir = safeGetStorage("bunkr_pl_upload_dir", "desc");
    let plTitleDateDir = safeGetStorage("bunkr_pl_sort_dir", "desc");

    function sortFileList(files, mode, dir) {
        if (!files || !files.length || mode === "default") return files;
        const sorted = [...files];
        if (mode === "upload-date") {
            sorted.sort((a, b) => {
                const tA = parseUploadTimestamp(a.timestamp || a.date);
                const tB = parseUploadTimestamp(b.timestamp || b.date);
                return dir === "desc" ? (tB - tA) : (tA - tB);
            });
        } else if (mode === "title-date") {
            sorted.sort((a, b) => {
                const nameA = (a.original || a.name || "").trim();
                const nameB = (b.original || b.name || "").trim();
                const dtA = extractDateFromTitle(nameA);
                const dtB = extractDateFromTitle(nameB);
                const tA = dtA ? dtA.timestamp : (dir === "desc" ? -Infinity : Infinity);
                const tB = dtB ? dtB.timestamp : (dir === "desc" ? -Infinity : Infinity);
                return dir === "desc" ? (tB - tA) : (tA - tB);
            });
        } else if (mode === "name") {
            sorted.sort((a, b) => {
                const dtA = extractDateFromTitle(a.original || a.name);
                const dtB = extractDateFromTitle(b.original || b.name);
                const nameA = cleanTitleWithoutDate((a.original || a.name || "").trim(), dtA, true);
                const nameB = cleanTitleWithoutDate((b.original || b.name || "").trim(), dtB, true);
                return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" });
            });
        }
        return sorted;
    }

    function makePlaylistThumbPlaceholder(finfo) {
        const ph = el("div", { class: "bunkr-playlist-thumb-placeholder" });
        let ic = PL_ICONS.image;
        if (finfo.category === "video") ic = PL_ICONS.video;
        else if (finfo.category === "text" || finfo.category === "doc") ic = PL_ICONS.doc;
        else if (finfo.category === "archive") ic = PL_ICONS.archive;
        else if (finfo.category === "audio") ic = PL_ICONS.audio;
        else if (finfo.category === "other") ic = PL_ICONS.file;

        const iconSpan = el("span", { class: "bunkr-playlist-ph-icon" });
        iconSpan.innerHTML = ic;
        const extName = (finfo.ext || finfo.category || "FILE").toUpperCase().slice(0, 5);
        const badge = el("span", { class: "bunkr-playlist-ph-ext" }, extName);
        ph.append(iconSpan, badge);
        return ph;
    }

    function playlistCard(name, href, thumb, isV, current, idx, uploadTs) {
        name = cleanHtmlText(name);
        const dt = extractDateFromTitle(name);
        const cleanName = cleanTitleWithoutDate(name, dt, true);
        const finfo = getFileInfo(name);
        if (isV) finfo.category = "video";

        const card = el("a", { class: "bunkr-playlist-item" + (current ? " is-current" : ""), href: typeof idx === "number" ? hrefWithPosition(href, idx + 1) : href, title: cleanName });
        const thumbWrap = el("div", { class: "bunkr-playlist-thumb-wrap" });

        const isKnownMedia = (finfo.category === "video" || finfo.category === "image") && !!thumb;
        if (isKnownMedia) {
            const img = el("img", { class: "bunkr-playlist-thumb", src: thumb, alt: "", loading: "lazy" });
            img.onerror = () => {
                img.remove();
                if (!thumbWrap.querySelector(".bunkr-playlist-thumb-placeholder")) {
                    thumbWrap.prepend(makePlaylistThumbPlaceholder(finfo));
                }
            };
            thumbWrap.appendChild(img);
        } else {
            thumbWrap.appendChild(makePlaylistThumbPlaceholder(finfo));
        }
        
        const kindLabel = finfo.category === "video" ? "Video" : finfo.category === "image" ? "Imagem" : finfo.category === "audio" ? "Audio" : finfo.category === "archive" ? "Arquivo" : "Arquivo";
        thumbWrap.appendChild(el("span", { class: "bunkr-playlist-kind" }, kindLabel));
        if (typeof idx === "number") thumbWrap.appendChild(el("span", { class: "bunkr-playlist-num" }, String(idx + 1)));
        if (finfo.category === "video") {
            let known = "";
            try { known = sessionStorage.getItem("bunkrdur:" + (href || "").split("?")[0]) || ""; } catch {}
            const durEl = el("span", { class: "bunkr-playlist-dur" }, known);
            durEl.hidden = !known;
            thumbWrap.appendChild(durEl);
        }

        const info = el("div", { class: "bunkr-playlist-info" });
        info.append(el("span", { class: "bunkr-playlist-name" }, cleanName));

        // Datas em texto simples abaixo do título (sem badges, sem ícones)
        const datesBox = el("div", { class: "bunkr-playlist-dates" });
        const upFmt = formatUploadDate(uploadTs);
        if (upFmt) {
            datesBox.append(el("div", { class: "bunkr-playlist-date-row" },
                el("span", { class: "bunkr-playlist-date-lbl" }, "Data de envio:"),
                el("span", { class: "bunkr-playlist-date-val" }, upFmt)
            ));
        }
        if (dt && dt.displayDate) {
            const lbl = el("span", {
                class: "bunkr-playlist-date-lbl bunkr-has-tip",
                title: "Data identificada e extraída do nome do arquivo (definida no upload)"
            }, "Data extraída:");
            lbl.appendChild(el("span", { class: "bunkr-tip-icon", title: "Data identificada e extraída do nome do arquivo (definida no upload)" }, "ⓘ"));
            datesBox.append(el("div", { class: "bunkr-playlist-date-row" },
                lbl,
                el("span", { class: "bunkr-playlist-date-val" }, dt.displayDate)
            ));
        }
        if (datesBox.childNodes.length) info.append(datesBox);

        if (current) {
            const meta = el("div", { class: "bunkr-playlist-meta" });
            meta.append(el("span", { class: "bunkr-playlist-meta-active" }, finfo.category === "video" ? "Reproduzindo agora" : "Visualizando agora"));
            info.append(meta);
        }
        card.append(thumbWrap, info);
        return card;
    }

    function syncNavButtons(hasMultiple) {
        document.querySelectorAll(".bunkr-plc-prev, .bunkr-plc-next, .bunkr-nav-side").forEach(b => {
            b.classList.toggle("is-disabled", !hasMultiple);
        });
    }

    let playlistFull = false;
    /* playlist COMPLETA do álbum buscado (filtrada por ?q=; item atual marcado + centralizado; cada link leva o ?q= adiante) */
    function renderPlaylist(list, files, countEl) {
        if (!list || !files) return;
        const q = getQ().toLowerCase(), cur = fileSlug();
        list.textContent = "";
        let curBtn = null;
        let count = 0;
        const activeDir = plSortMode === "upload-date" ? plUploadDateDir : plTitleDateDir;
        const sortedFiles = sortFileList(files, plSortMode, activeDir);
        sortedFiles.forEach(f => {
            const name = (f.original || f.name || "").trim();
            if (q && name.toLowerCase().indexOf(q) === -1) return;
            const href = fileHref(f);
            const isV = isVidFile(f);
            const isCur = f.slug === cur;
            const card = playlistCard(name, href, f.thumbnail, isV, isCur, count, f.timestamp);
            list.appendChild(card);
            if (isCur) curBtn = card;
            count++;
        });
        if (countEl) countEl.textContent = count ? `(${count})` : "";
        const stage = list.closest(".bunkr-stage");
        if (stage) {
            stage.classList.toggle("has-playlist", count > 0);
            stage.classList.toggle("has-nav", count > 1);
        }
        syncNavButtons(count > 1);
        if (curBtn && window.innerWidth > 768) {
            setTimeout(() => {
                try { curBtn.scrollIntoView({ block: "center", behavior: "smooth" }); } catch {}
            }, 100);
        }
    }

    /* fallback rápido enquanto o álbum não baixou: a partir do #related-files-grid (poucos), também filtrado por ?q= */
    function renderRelatedToPlaylist(list, countEl) {
        if (!list || playlistFull) return;
        const grid = document.querySelector("#related-files-grid");
        let items = grid ? Array.from(grid.querySelectorAll(":scope > .theItem")) : [];
        const activeDir = plSortMode === "upload-date" ? plUploadDateDir : plTitleDateDir;
        const sig = items.length + "|" + getQ() + "|" + plSortMode + "|" + activeDir;
        if (list.dataset.sig === sig) return;
        list.dataset.sig = sig;
        const q = getQ().toLowerCase(), cur = fileSlug();
        list.textContent = "";
        let curBtn = null;
        let count = 0;

        if (plSortMode === "upload-date") {
            items.sort((a, b) => {
                const tA = parseUploadTimestamp(a.querySelector(".theDate")?.textContent);
                const tB = parseUploadTimestamp(b.querySelector(".theDate")?.textContent);
                return plUploadDateDir === "desc" ? (tB - tA) : (tA - tB);
            });
        } else if (plSortMode === "title-date") {
            items.sort((a, b) => {
                const nmA = (a.getAttribute("title") || a.querySelector(".theName")?.textContent || "").trim();
                const nmB = (b.getAttribute("title") || b.querySelector(".theName")?.textContent || "").trim();
                const dtA = extractDateFromTitle(nmA);
                const dtB = extractDateFromTitle(nmB);
                const tA = dtA ? dtA.timestamp : (plTitleDateDir === "desc" ? -Infinity : Infinity);
                const tB = dtB ? dtB.timestamp : (plTitleDateDir === "desc" ? -Infinity : Infinity);
                return plTitleDateDir === "desc" ? (tB - tA) : (tA - tB);
            });
        } else if (plSortMode === "name") {
            items.sort((a, b) => {
                const nmA = (a.getAttribute("title") || a.querySelector(".theName")?.textContent || "").trim();
                const nmB = (b.getAttribute("title") || b.querySelector(".theName")?.textContent || "").trim();
                const dtA = extractDateFromTitle(nmA);
                const dtB = extractDateFromTitle(nmB);
                const nameA = cleanTitleWithoutDate(nmA, dtA, true);
                const nameB = cleanTitleWithoutDate(nmB, dtB, true);
                return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" });
            });
        }

        items.forEach(it => {
            const a = it.querySelector("a[href]"), thumb = it.querySelector(".grid-images_box-img"), theName = it.querySelector(".theName");
            const nm = (it.getAttribute("title") || (theName ? theName.textContent : "") || "").trim();
            if (q && nm.toLowerCase().indexOf(q) === -1) return;
            const isV = !!(it.querySelector(".type-Video") || it.querySelector('img[src*="video.svg"]'));
            let href = a ? a.href : "#";
            if (getQ() && a) {
                try { const u = new URL(a.href); u.searchParams.set("q", getQ()); href = u.toString(); } catch {}
            }
            const isCur = a && a.href && a.href.includes("/" + cur);
            const uploadTs = it.querySelector(".theDate")?.textContent || "";
            const card = playlistCard(nm, href, thumb ? (thumb.getAttribute("src") || thumb.src) : "", isV, isCur, count, uploadTs);
            list.appendChild(card);
            if (isCur) curBtn = card;
            count++;
        });
        if (countEl) countEl.textContent = count ? `(${count})` : "";
        const stage = list.closest(".bunkr-stage");
        if (stage) {
            stage.classList.toggle("has-playlist", count > 0);
            stage.classList.toggle("has-nav", count > 1);
        }
        syncNavButtons(count > 1);
        if (curBtn && window.innerWidth > 768) {
            setTimeout(() => {
                try { curBtn.scrollIntoView({ block: "center", behavior: "smooth" }); } catch {}
            }, 100);
        }
    }

    function populatePlaylist(sidebar, list, countEl) {
        renderRelatedToPlaylist(list, countEl);
        const stage = document.querySelector(".bunkr-stage");
        const syncGallery = () => {
            if (!stage || !stage._galleryBtn) return;
            const albumA = document.querySelector('a[href*="/a/"]');
            if (albumA && albumA.href) {
                stage._galleryBtn.href = albumA.href;
                stage._galleryBtn.style.display = "inline-flex";
            }
        };
        syncGallery();
        loadAlbumFiles().then(files => {
            syncGallery();
            if (files && files.length) {
                playlistFull = true;
                renderPlaylist(list, files, countEl);
                syncGallery();
            }
        });
    }

    /* prev/próxima mídia DENTRO do álbum filtrado (navega por página: /f/{slug}?q=). Lê albumFilesCache no clique (carrega async). */
    function navFile(dir) {
        let list = [];
        if (albumFilesCache && albumFilesCache.length) {
            const q = getQ().toLowerCase();
            list = q ? albumFilesCache.filter(f => (f.original || f.name || "").toLowerCase().indexOf(q) !== -1) : albumFilesCache;
            const activeDir = plSortMode === "upload-date" ? plUploadDateDir : plTitleDateDir;
            list = sortFileList(list, plSortMode, activeDir);
            if (list.length >= 2) {
                const cur = fileSlug();
                let i = list.findIndex(f => f.slug === cur);
                if (i === -1) i = dir > 0 ? -1 : 0;   // atual fora do filtro → começa do vizinho na direção
                const ni = ((i + dir) % list.length + list.length) % list.length;
                const f = list[ni];
                if (f) { location.href = hrefWithPosition(fileHref(f), ni + 1); return; }
            }
        }
        // Fallback: se albumFilesCache não tiver carregado ainda, usa os links renderizados na playlist
        const items = Array.from(document.querySelectorAll(".bunkr-playlist-item[href]"));
        if (items.length >= 2) {
            let i = items.findIndex(it => it.classList.contains("is-current"));
            if (i === -1) i = dir > 0 ? -1 : 0;
            const ni = ((i + dir) % items.length + items.length) % items.length;
            const target = items[ni];
            if (target && target.href) location.href = hrefWithPosition(target.href, ni + 1);
        }
    }
    /* liga o filtro ?q=: clique em qualquer /f/ leva o ?q= adiante; no ÁLBUM, espelha a busca nativa no ?q= (persiste + reaplica no F5) */
    function initFilter() {
        document.addEventListener("click", e => {
            const q = getQ(); if (!q) return;
            const a = e.target.closest && e.target.closest('a[href*="/f/"], a[href*="/i/"], a[href*="/v/"], a[href*="/d/"]'); if (!a) return;
            try { const u = new URL(a.href); if (!u.searchParams.get("q")) { u.searchParams.set("q", q); a.href = u.toString(); } } catch {}
        }, true);
        if (document.documentElement.classList.contains("bunkr-file")) return;   // resto é só no álbum
        const hook = () => {
            const inp = document.querySelector("#advFilterInput"); if (!inp || inp.dataset.qHook) return !!inp;
            inp.dataset.qHook = "1";
            const q = getQ(); if (q && !inp.value) { inp.value = q; inp.dispatchEvent(new Event("input", { bubbles: true })); }
            let t; inp.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => setQ(inp.value.trim()), 200); });
            return true;
        };
        if (!hook()) { let n = 0; const id = setInterval(() => { if (hook() || ++n > 40) clearInterval(id); }, 250); }   // o input do advanced view aparece com o JS da bunkr
    }

    // ===== TOPBAR PADRONIZADA: logo (home bunkr) + direita (Search Albums, Upload, Stats) =====
    function simplifyHeader() {
        const h = document.querySelector("header");
        if (!h || h.dataset.bunkrDone) return;
        h.dataset.bunkrDone = "1";
        h.classList.add("bunkr-global-header");

        // PRESERVA QUALQUER STYLESHEET (ex: /css/master.css) movendo para o <head>
        h.querySelectorAll('link[rel="stylesheet"], style').forEach(el => {
            (document.head || document.documentElement).appendChild(el);
        });

        // Garante que o master.css esteja presente no head se o bunkr não tiver injetado
        if (location.protocol.startsWith("http") && !document.querySelector('link[href*="master.css"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "/css/master.css";
            (document.head || document.documentElement).appendChild(link);
        }

        // Na homepage a barra inicia maior e encolhe com scroll > 30px
        if (document.documentElement.classList.contains("bunkr-home")) {
            const syncHomeScroll = () => {
                h.classList.toggle("is-home-expanded", window.scrollY < 30);
            };
            syncHomeScroll();
            if (!h.dataset.bunkrScrollHook) {
                h.dataset.bunkrScrollHook = "1";
                window.addEventListener("scroll", syncHomeScroll, { passive: true });
            }
        }

        h.innerHTML = `
            <div class="bunkr-header-cont">
                <a class="bunkr-top-logo" href="/" title="Bunkr">
                    <span class="bunkr-logo-badge">${PL_ICONS.bunkrMark}</span>
                    <span class="bunkr-logo-text">bunkr<span class="bunkr-logo-dot">.</span></span>
                </a>
                <div class="bunkr-header-right">
                    <a class="bunkr-header-btn" href="https://balbums.st" target="_blank" rel="noopener noreferrer" title="Buscar álbuns em balbums.st">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
                        </svg>
                        <span>Search Albums</span>
                    </a>
                    <a class="bunkr-header-btn" href="/upload" title="Fazer upload">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        <span>Upload</span>
                    </a>
                    <a class="bunkr-header-btn" href="https://status.bunkr.is" target="_blank" rel="noopener noreferrer" title="Status dos serviços">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10"/>
                            <line x1="12" y1="20" x2="12" y2="4"/>
                            <line x1="6" y1="20" x2="6" y2="14"/>
                        </svg>
                        <span>Stats</span>
                    </a>
                </div>
            </div>
        `;
    }

    // ===== ORDEM DO YOUTUBE: o bloco do player/mídia sobe pra CIMA do <main> (título/tamanho/download). Só em arquivo. =====
    function reorder() {
        try {
            const main = document.querySelector("main.cont") || document.querySelector("main");
            if (!main || !main.parentNode) return;
            const media = document.querySelector("#video-container") || document.querySelector("#video-wrapper");
            let block = media ? media.closest(".rounded-lg") : null;
            if (!block) block = [...document.querySelectorAll(".rounded-lg")].find(b => !b.closest("header") && b.querySelector("img, video, #video-container"));   // foto: o bloco com a mídia (NÃO a nav do header, que tbm é .rounded-lg)
            if (!block || block === main || block.contains(main) || main.contains(block)) return;
            block.classList.add("bunkr-player-block");   // pega o margin-top (respiro abaixo da topbar)
            if (main.compareDocumentPosition(block) & Node.DOCUMENT_POSITION_FOLLOWING) main.parentNode.insertBefore(block, main);
        } catch (e) {}
    }

    // remove o banner vermelho de troca de domínio (é uma <div> curta com fundo vermelho / texto "balbums")
    function killBanner() {
        document.querySelectorAll("body > div").forEach(d => {
            const st = (d.getAttribute("style") || "").toLowerCase();
            if (/background:\s*(red|#f|rgb\(2)/.test(st) || (/balbums\.st|old domain|isn.?t working/i.test(d.textContent || "") && d.children.length <= 2)) d.remove();
        });
    }

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


    // ===== v2.9 — GALERIA MODERNA ESTILO YOUTUBE (ÁLBUM) =====
    function killOldCounter() {
        const counter = document.getElementById("resultsCounter");
        if (counter) {
            const p = counter.closest("p, div.text-center, .results-counter");
            if (p) p.style.display = "none";
            else counter.style.display = "none";
        }
        document.querySelectorAll(".results-counter, .advanced-notice, main > p:has(#resultsCounter)").forEach(el => el.style.display = "none");
    }

    let galleryObserver = null;
    let albumCountUpdate = null;
    let isEnhancingCards = false;

    function fixAlbumHeader() {
        const h1 = document.querySelector("main h1, .bunkr-album-title, h1.truncate");
        if (h1) {
            const raw = h1.textContent || h1.innerText || "";
            const cleaned = cleanHtmlText(raw);
            if (cleaned && h1.textContent !== cleaned) {
                h1.textContent = cleaned;
            }
            const cleanedDocTitle = cleanHtmlText(document.title);
            if (cleanedDocTitle && document.title !== cleanedDocTitle) {
                document.title = cleanedDocTitle;
            }
        }

        // Estiliza o botão de report e garante alinhamento ao lado
        const rep = document.querySelector('main a[href*="report"], main a.ic-flag-01');
        if (rep && !rep.dataset.bunkrStyled) {
            rep.dataset.bunkrStyled = "1";
            rep.className = "bunkr-album-report-btn";
            rep.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                    <line x1="4" y1="22" x2="4" y2="15"/>
                </svg>
                <span>Report</span>
            `;
            const rightCol = document.querySelector("main > div.flex:first-child > div:last-child");
            if (rightCol && rep.parentNode !== rightCol) {
                rightCol.appendChild(rep);
            }
        }
    }

    function getFileInfo(itemOrName) {
        let name = "";
        if (typeof itemOrName === "string") name = itemOrName;
        else if (itemOrName) {
            name = itemOrName.dataset?.origTitle || itemOrName.title || itemOrName.querySelector?.(".theName")?.textContent || "";
        }
        const clean = cleanHtmlText(name).trim();
        const m = clean.match(/\.([a-zA-Z0-9]{2,5})(?:\?|#|$)/);
        const ext = m ? m[1].toLowerCase() : "";

        let category = "other";
        if (["mp4", "mkv", "mov", "webm", "avi", "flv", "m4v", "wmv", "ts"].includes(ext)) category = "video";
        else if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "avif", "heic"].includes(ext)) category = "image";
        else if (["txt", "md", "nfo", "log", "json", "csv"].includes(ext)) category = "text";
        else if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(ext)) category = "archive";
        else if (["mp3", "wav", "flac", "m4a", "ogg", "aac", "opus"].includes(ext)) category = "audio";
        else if (["pdf", "doc", "docx", "epub"].includes(ext)) category = "doc";

        // Fallback pelas classes nativas do Bunkr se não tiver extensão explícita
        if (category === "other" && itemOrName && itemOrName.querySelector) {
            if (itemOrName.querySelector(".type-Video, span[class*='type-Video']")) category = "video";
            else if (itemOrName.querySelector(".type-Image, span[class*='type-Image']")) category = "image";
            else if (itemOrName.querySelector(".type-Audio, span[class*='type-Audio']")) category = "audio";
        }

        return { name: clean, ext, category };
    }

    const txtPreviewCache = new Map();
    // Preview de .txt nos cards: só quando o card fica visível, 2 por vez, 2 KB por arquivo.
    const TXT_PREVIEW_BYTES = 2048;
    const txtPreviewQueue = [];
    let txtPreviewBusy = 0;
    let txtPreviewIO = null;
    function pumpTxtPreviews() {
        while (txtPreviewBusy < 2 && txtPreviewQueue.length) {
            const job = txtPreviewQueue.shift();
            if (!job.body.isConnected) continue;
            txtPreviewBusy++;
            loadCardTextPreview(job.link, job.body).finally(() => { txtPreviewBusy--; pumpTxtPreviews(); });
        }
    }
    function queueCardTextPreview(link, body) {
        if (!link || txtPreviewCache.has(link) || !("IntersectionObserver" in window)) { loadCardTextPreview(link, body); return; }
        if (!txtPreviewIO) {
            txtPreviewIO = new IntersectionObserver(entries => {
                for (const e of entries) {
                    if (!e.isIntersecting) continue;
                    txtPreviewIO.unobserve(e.target);
                    txtPreviewQueue.push({ link: e.target._bunkrTxtLink, body: e.target });
                }
                pumpTxtPreviews();
            }, { rootMargin: "200px" });
        }
        body._bunkrTxtLink = link;
        txtPreviewIO.observe(body);
    }

    async function loadCardTextPreview(link, bodyEl) {
        if (!link) {
            bodyEl.textContent = "Arquivo de texto. Clique para visualizar.";
            return;
        }
        if (txtPreviewCache.has(link)) {
            bodyEl.textContent = txtPreviewCache.get(link);
            return;
        }
        try {
            const html = await httpGet(link);
            const m = html.match(/href="([^"]*(?:storage\/media|\/d\/|get-download|media-files)[^"]*)"/i) ||
                      html.match(/href="([^"]*\.txt(?:\?[^"]*)?)"/i);
            let text = "";
            if (m && m[1]) {
                let dlUrl = m[1];
                if (dlUrl.startsWith("/")) dlUrl = location.origin + dlUrl;
                try {
                    const M2 = /href="([^"]*(?:storage\/media|media-files|\.txt)[^"]*)"/i;
                    let fileData = await httpGet(dlUrl, TXT_PREVIEW_BYTES);
                    if (/^\s*<!DOCTYPE|^\s*<html/i.test(fileData)) {
                        // Página intermediária: o recorte pode ter cortado o link, então busca inteira.
                        if (!M2.test(fileData)) fileData = await httpGet(dlUrl);
                        const m2 = fileData.match(M2);
                        if (m2 && m2[1]) {
                            let dlUrl2 = m2[1];
                            if (dlUrl2.startsWith("/")) dlUrl2 = location.origin + dlUrl2;
                            fileData = await httpGet(dlUrl2, TXT_PREVIEW_BYTES);
                        }
                    }
                    if (!/^\s*<!DOCTYPE|^\s*<html/i.test(fileData)) {
                        text = fileData;
                    }
                } catch {}
            }
            if (!text) {
                const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
                if (preMatch && preMatch[1]) {
                    text = cleanHtmlText(preMatch[1]);
                }
            }
            if (text) {
                const preview = text.trim().slice(0, 1200);
                txtPreviewCache.set(link, preview);
                bodyEl.textContent = preview;
            } else {
                bodyEl.textContent = "Arquivo de texto. Clique para abrir e visualizar o conteúdo completo.";
            }
        } catch {
            bodyEl.textContent = "Arquivo de texto. Clique para visualizar.";
        }
    }

    function applyCardThumbnailAndPreview(item, thumbBox, fileInfo) {
        const isTxt = ["txt", "md", "nfo", "log"].includes(fileInfo.ext);
        const img = thumbBox.querySelector(".grid-images_box-img");

        // 1. Arquivos de texto (.txt, etc.): renderiza preview do conteúdo
        if (isTxt) {
            if (img) img.style.display = "none";
            thumbBox.classList.add("has-placeholder");
            if (!thumbBox.querySelector(".bunkr-txt-preview")) {
                const prev = el("div", { class: "bunkr-txt-preview" });
                const head = el("div", { class: "bunkr-txt-head" },
                    el("span", { class: "bunkr-txt-head-tag" }, fileInfo.ext.toUpperCase()),
                    el("span", { class: "bunkr-txt-head-title" }, fileInfo.name)
                );
                const body = el("pre", { class: "bunkr-txt-body" }, "Carregando conteúdo…");
                const fade = el("div", { class: "bunkr-txt-fade" });
                prev.append(head, body, fade);
                thumbBox.appendChild(prev);

                const link = item.querySelector("a[href]")?.getAttribute("href") || "";
                queueCardTextPreview(link, body);
            }
            return;
        }

        // 2. Imagens com erro de carregamento ou arquivos sem thumbnail válida (.zip, .rar, etc.)
        const isArchive = ["zip", "rar", "7z", "tar", "gz"].includes(fileInfo.ext);
        const isAudio = ["mp3", "wav", "flac", "m4a", "ogg"].includes(fileInfo.ext);
        const isDoc = ["pdf", "doc", "docx", "xls", "xlsx"].includes(fileInfo.ext);
        const isKnownNonMedia = isArchive || isAudio || isDoc;

        const renderPlaceholder = () => {
            if (img) img.style.display = "none";
            thumbBox.classList.add("has-placeholder");
            if (thumbBox.querySelector(".bunkr-thumb-placeholder")) return;

            let iconSvg = PL_ICONS.file;
            let badgeText = fileInfo.ext ? fileInfo.ext.toUpperCase() : "FILE";
            if (fileInfo.category === "video") { iconSvg = PL_ICONS.video; badgeText = "VÍDEO"; }
            else if (fileInfo.category === "image") { iconSvg = PL_ICONS.image; badgeText = "IMAGEM"; }
            else if (isArchive) { iconSvg = PL_ICONS.archive; badgeText = fileInfo.ext.toUpperCase(); }
            else if (isAudio) { iconSvg = PL_ICONS.audio; badgeText = fileInfo.ext.toUpperCase(); }
            else if (isDoc) { iconSvg = PL_ICONS.doc; badgeText = fileInfo.ext.toUpperCase(); }

            const ph = el("div", { class: "bunkr-thumb-placeholder" });
            const iconWrap = el("div", { class: "bunkr-ph-icon" });
            iconWrap.innerHTML = iconSvg;
            const badge = el("span", { class: "bunkr-ph-badge" }, badgeText);
            ph.append(iconWrap, badge);
            thumbBox.appendChild(ph);
        };

        if (isKnownNonMedia) {
            renderPlaceholder();
        } else if (img) {
            if (img.complete && img.naturalWidth === 0) {
                renderPlaceholder();
            } else {
                img.addEventListener("error", renderPlaceholder, { once: true });
            }
        }
    }

    function enhanceCards() {
        if (isEnhancingCards) return;
        isEnhancingCards = true;
        try {
            const items = document.querySelectorAll(".theItem");
            items.forEach(item => {
                // Garante que o link não abre em nova aba
                const a = item.querySelector("a[href]");
                if (a && a.target !== "_self") {
                    a.removeAttribute("target");
                    a.target = "_self";
                }

                // Preserva e limpa título original do arquivo
                const theName = item.querySelector(".theName");
                if (!item.dataset.origTitle) {
                    const raw = theName ? (theName.textContent || theName.innerText || "") : (item.title || "");
                    const cleaned = cleanHtmlText(raw).trim();
                    if (cleaned) item.dataset.origTitle = cleaned;
                }
                const cleanRaw = item.dataset.origTitle || "";
                if (!cleanRaw) return;

                // Identifica data no nome do arquivo
                const titleDate = extractDateFromTitle(cleanRaw);

                // Título limpo sem o prefixo/ocorrência de data
                const displayTitle = cleanTitleWithoutDate(cleanRaw, titleDate, true);

                if (theName && theName.textContent !== displayTitle) {
                    theName.textContent = displayTitle;
                    theName.title = cleanRaw;
                }
                if (item.title !== cleanRaw) {
                    item.title = cleanRaw;
                }

                const fileInfo = getFileInfo(item);

                // Injeta badge de tamanho no canto inferior direito da thumbnail se ainda não tiver
                const thumbBox = item.querySelector(".grid-images_box-txt");
                if (thumbBox && !thumbBox.querySelector(".theItem-size-badge")) {
                    const sizeEl = item.querySelector(".theSize");
                    const txt = sizeEl ? sizeEl.textContent.trim() : "";
                    if (txt) {
                        const badge = el("span", { class: "theItem-size-badge" }, txt);
                        thumbBox.appendChild(badge);
                    }
                }

                // Aplica guard de thumbnail: preview para .txt ou placeholder para thumbs quebradas
                if (thumbBox) {
                    applyCardThumbnailAndPreview(item, thumbBox, fileInfo);
                }

                // Remove badge antiga roxa com ícone caso ainda exista
                const oldBadges = item.querySelectorAll(".theItem-title-date-badge");
                if (oldBadges.length) oldBadges.forEach(b => b.remove());

                // Datas em texto simples: Data de envio e Data extraída (sem badges, sem ícones)
                const rawUploadTs = item.querySelector(".theDate")?.textContent || "";
                const upFmt = formatUploadDate(rawUploadTs);
                const titleDateDisplay = (titleDate && titleDate.displayDate) || "";
                const dateKey = `${upFmt}|${titleDateDisplay}`;

                let datesBox = item.querySelector(".theItem-dates");
                if (datesBox && datesBox.dataset.renderedKey === dateKey) {
                    return; // Já renderizado e idêntico, zero mutações no DOM
                }

                if (!datesBox) {
                    datesBox = el("div", { class: "theItem-dates" });
                    const mt2 = item.querySelector("div.mt-2") || item;
                    mt2.appendChild(datesBox);
                }

                datesBox.dataset.renderedKey = dateKey;
                datesBox.textContent = "";
                if (upFmt) {
                    datesBox.append(el("div", { class: "theItem-date-row" },
                        el("span", { class: "theItem-date-lbl" }, "Data de envio:"),
                        el("span", { class: "theItem-date-val" }, upFmt)
                    ));
                }
                if (titleDateDisplay) {
                    const lbl = el("span", {
                        class: "theItem-date-lbl bunkr-has-tip",
                        title: "Data identificada e extraída do nome do arquivo (definida no upload)"
                    }, "Data extraída:");
                    lbl.appendChild(el("span", { class: "bunkr-tip-icon", title: "Data identificada e extraída do nome do arquivo (definida no upload)" }, "ⓘ"));
                    datesBox.append(el("div", { class: "theItem-date-row" },
                        lbl,
                        el("span", { class: "theItem-date-val" }, titleDateDisplay)
                    ));
                }
            });
        } finally {
            isEnhancingCards = false;
        }
    }

    let isGroupByType = safeGetStorage("bunkr_group_by_type") === "1";

    function groupGalleryByType(forceState) {
        if (typeof forceState === "boolean") isGroupByType = forceState;
        safeSetStorage("bunkr_group_by_type", isGroupByType ? "1" : "0");

        const btn = document.querySelector("#bunkrToggleGroup");
        if (btn) {
            btn.classList.toggle("is-active", isGroupByType);
            const label = btn.querySelector(".label");
            if (label) label.textContent = isGroupByType ? "Desagrupar" : "Agrupar por Tipo";
        }

        const grid = document.querySelector("#galleryGrid, .grid-images");
        if (!grid) return;

        grid.querySelectorAll(".bunkr-group-header").forEach(h => h.remove());

        if (!isGroupByType) {
            return;
        }

        const items = Array.from(grid.querySelectorAll(":scope > .theItem"));
        if (!items.length) return;

        const groups = {
            video: [],
            image: [],
            text: [],
            other: []
        };

        items.forEach(it => {
            const info = getFileInfo(it);
            if (info.category === "video") groups.video.push(it);
            else if (info.category === "image") groups.image.push(it);
            else if (info.category === "text") groups.text.push(it);
            else groups.other.push(it);
        });

        const groupDefs = [
            { key: "video", title: "Vídeos", icon: PL_ICONS.video, unit: "vídeos", list: groups.video },
            { key: "image", title: "Fotos", icon: PL_ICONS.image, unit: "fotos", list: groups.image },
            { key: "text", title: "Documentos & Textos", icon: PL_ICONS.doc, unit: "textos", list: groups.text },
            { key: "other", title: "Outros Arquivos", icon: PL_ICONS.archive, unit: "arquivos", list: groups.other },
        ];

        if (galleryObserver) galleryObserver.disconnect();

        groupDefs.forEach(g => {
            if (!g.list.length) return;
            const hdr = el("div", { class: "bunkr-group-header", "data-group": g.key });
            const left = el("div", { class: "bunkr-group-header-left" });
            const iconSpan = el("span", null);
            iconSpan.innerHTML = g.icon;
            const titleSpan = el("span", null, g.title);
            const countSpan = el("span", { class: "bunkr-group-count" }, `${g.list.length} ${g.list.length === 1 ? 'arquivo' : g.unit}`);
            left.append(iconSpan, titleSpan, countSpan);
            const line = el("div", { class: "bunkr-group-line" });
            hdr.append(left, line);

            grid.appendChild(hdr);
            g.list.forEach(it => grid.appendChild(it));
        });

        if (galleryObserver && grid) {
            galleryObserver.observe(grid, { childList: true, subtree: false });
        }
    }

    function updateGroupHeadersVisibility() {
        if (!isGroupByType) return;
        const grid = document.querySelector("#galleryGrid, .grid-images");
        if (!grid) return;
        const headers = grid.querySelectorAll(".bunkr-group-header");
        headers.forEach(hdr => {
            let count = 0;
            let next = hdr.nextElementSibling;
            while (next && !next.classList.contains("bunkr-group-header")) {
                if (next.classList.contains("theItem") && next.style.display !== "none") {
                    count++;
                }
                next = next.nextElementSibling;
            }
            hdr.style.display = count === 0 ? "none" : "";
            const countEl = hdr.querySelector(".bunkr-group-count");
            if (countEl && count > 0) {
                countEl.textContent = `${count} ${count === 1 ? 'arquivo' : 'arquivos'}`;
            }
        });
    }

    function sortGalleryByUploadDate(dir = "desc") {
        const grid = document.querySelector("#galleryGrid, .grid-images");
        if (!grid) return;
        const items = Array.from(grid.querySelectorAll(":scope > .theItem"));
        if (!items.length) return;
        items.sort((a, b) => {
            const dateA = a.querySelector(".theDate")?.textContent || "";
            const dateB = b.querySelector(".theDate")?.textContent || "";
            const tA = parseUploadTimestamp(dateA);
            const tB = parseUploadTimestamp(dateB);
            return dir === "desc" ? (tB - tA) : (tA - tB);
        });
        if (galleryObserver) galleryObserver.disconnect();
        items.forEach(it => grid.appendChild(it));
        enhanceCards();
        if (isGroupByType) groupGalleryByType(true);
        if (galleryObserver && grid) galleryObserver.observe(grid, { childList: true, subtree: false });
        if (window.albumFiles && Array.isArray(window.albumFiles)) {
            window.albumFiles.sort((a, b) => {
                const tA = parseUploadTimestamp(a.timestamp || a.date);
                const tB = parseUploadTimestamp(b.timestamp || b.date);
                return dir === "desc" ? (tB - tA) : (tA - tB);
            });
        }
    }

    function sortGalleryByTitleDate(dir = "desc") {
        const grid = document.querySelector("#galleryGrid, .grid-images");
        if (!grid) return;
        const items = Array.from(grid.querySelectorAll(":scope > .theItem"));
        if (!items.length) return;
        items.sort((a, b) => {
            const nameA = a.dataset.origTitle || a.title || a.querySelector(".theName")?.textContent || "";
            const nameB = b.dataset.origTitle || b.title || b.querySelector(".theName")?.textContent || "";
            const dtA = extractDateFromTitle(nameA);
            const dtB = extractDateFromTitle(nameB);
            const tA = dtA ? dtA.timestamp : (dir === "desc" ? -Infinity : Infinity);
            const tB = dtB ? dtB.timestamp : (dir === "desc" ? -Infinity : Infinity);
            return dir === "desc" ? (tB - tA) : (tA - tB);
        });
        if (galleryObserver) galleryObserver.disconnect();
        items.forEach(it => grid.appendChild(it));
        enhanceCards();
        if (isGroupByType) groupGalleryByType(true);
        if (galleryObserver && grid) galleryObserver.observe(grid, { childList: true, subtree: false });
        if (window.albumFiles && Array.isArray(window.albumFiles)) {
            window.albumFiles.sort((a, b) => {
                const nameA = (a.original || a.name || "").trim();
                const nameB = (b.original || b.name || "").trim();
                const dtA = extractDateFromTitle(nameA);
                const dtB = extractDateFromTitle(nameB);
                const tA = dtA ? dtA.timestamp : (dir === "desc" ? -Infinity : Infinity);
                const tB = dtB ? dtB.timestamp : (dir === "desc" ? -Infinity : Infinity);
                return dir === "desc" ? (tB - tA) : (tA - tB);
            });
        }
    }

    function sortGalleryByName(dir = "asc") {
        const grid = document.querySelector("#galleryGrid, .grid-images");
        if (!grid) return;
        const items = Array.from(grid.querySelectorAll(":scope > .theItem"));
        if (!items.length) return;
        items.sort((a, b) => {
            const rawA = a.dataset.origTitle || a.querySelector(".theName")?.textContent || a.title || "";
            const rawB = b.dataset.origTitle || b.querySelector(".theName")?.textContent || b.title || "";
            const dtA = extractDateFromTitle(rawA);
            const dtB = extractDateFromTitle(rawB);
            const nA = cleanTitleWithoutDate(rawA, dtA, true);
            const nB = cleanTitleWithoutDate(rawB, dtB, true);
            const res = nA.localeCompare(nB, undefined, { numeric: true, sensitivity: "base" });
            return dir === "desc" ? -res : res;
        });
        if (galleryObserver) galleryObserver.disconnect();
        items.forEach(it => grid.appendChild(it));
        enhanceCards();
        if (isGroupByType) groupGalleryByType(true);
        if (galleryObserver && grid) galleryObserver.observe(grid, { childList: true, subtree: false });
    }

    function setupModernGallery() {
        const grid = document.querySelector("#galleryGrid, .grid-images");
        if (!grid) return;
        document.documentElement.classList.remove("bunkr-file");
        document.documentElement.classList.add("bunkr-album");
        fixAlbumHeader();

        // Oculta blocos legados de toolbar, paginação e ordenação isolada
        const oldSortWrap = document.querySelector("main .flex.bg-soft.p-1.rounded-lg.items-center");
        if (oldSortWrap) oldSortWrap.style.display = "none";
        document.querySelectorAll(".floating-detailed-thumb, #floatingThumb, .album-toolbar, .album-adv, .advanced-notice").forEach(el => el.style.display = "none");

        // Monta a Actionbar Integrada se ainda não existir
        if (!document.querySelector(".bunkr-gallery-actionbar")) {
            const bar = el("div", { class: "bunkr-gallery-actionbar" });

            // 1. Busca
            const searchWrap = el("div", { class: "bunkr-actionbar-search", id: "bunkrSearchWrap" });
            searchWrap.innerHTML = `
                <svg class="bunkr-actionbar-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="7"/>
                    <path d="m21 21-4.3-4.3"/>
                </svg>
                <input type="text" id="bunkrGallerySearch" placeholder="Buscar nos arquivos… (atalho /)" autocomplete="off">
                <button type="button" class="bunkr-actionbar-search-clear" id="bunkrSearchClear" title="Limpar busca">&times;</button>
            `;

            // 2. Divisor
            const div1 = el("div", { class: "bunkr-actionbar-divider" });

            // 3. Chips de Ordenação estilo YouTube (rounded-full)
            const chipsWrap = el("div", { class: "bunkr-actionbar-chips" });
            chipsWrap.innerHTML = `
                <span class="bunkr-actionbar-label">Ordenar:</span>
                <button type="button" class="bunkr-chip is-active" data-sort="upload-date" id="bunkrChipUploadDate" title="Ordenar por data de envio">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>Data de Envio</span>
                    <span class="bunkr-sort-direction" id="bunkrUploadDateDir">⬇</span>
                </button>
                <button type="button" class="bunkr-chip" data-sort="title-date" id="bunkrChipTitleDate" title="Ordenar por data extraída do nome do arquivo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span>Data Extraída</span>
                    <span class="bunkr-sort-direction" id="bunkrTitleDateDir">⬇</span>
                </button>
                <button type="button" class="bunkr-chip" data-sort="name" id="bunkrChipName" title="Ordenar por nome alfabético">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="8" y2="18"/></svg>
                    <span>A-Z</span>
                </button>
                <button type="button" class="bunkr-chip" data-sort="size" id="bunkrChipSize" title="Ordenar por tamanho de arquivo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                    <span>Tamanho</span>
                </button>
            `;

            // 4. Divisor
            const div2 = el("div", { class: "bunkr-actionbar-divider" });

            // 5. Ações Rápidas & Contador
            const actionsWrap = el("div", { class: "bunkr-actionbar-actions" });
            actionsWrap.innerHTML = `
                <button type="button" class="bunkr-act-btn${isGroupByType ? ' is-active' : ''}" id="bunkrToggleGroup" title="Agrupar arquivos por tipo (Vídeos, Fotos, Textos, Outros)">
                    ${PL_ICONS.group}
                    <span class="label">${isGroupByType ? 'Desagrupar' : 'Agrupar por Tipo'}</span>
                </button>
                <button type="button" class="bunkr-act-btn" id="bunkrToggleNames" title="Alternar nome completo/truncado">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
                    <span class="label">Nomes Completos</span>
                </button>
                <button type="button" class="bunkr-act-btn" id="bunkrCopyNames" title="Copiar nomes dos arquivos visíveis">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    <span class="label">Copiar Nomes</span>
                </button>
                <button type="button" class="bunkr-act-btn" id="bunkrCopyUrls" title="Copiar URLs diretas dos arquivos">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    <span class="label">Copiar URLs</span>
                </button>
                <span class="bunkr-actionbar-count" id="bunkrGalleryCount"></span>
            `;

            bar.append(searchWrap, div1, chipsWrap, div2, actionsWrap);
            grid.parentNode.insertBefore(bar, grid);

            const searchInp = bar.querySelector("#bunkrGallerySearch");
            const searchClear = bar.querySelector("#bunkrSearchClear");
            const countEl = bar.querySelector("#bunkrGalleryCount");

            // Atalho "/" para focar busca
            document.addEventListener("keydown", e => {
                if (e.key === "/" && document.activeElement !== searchInp && !e.target.matches("input, textarea")) {
                    e.preventDefault();
                    searchInp.focus();
                }
            });

            // Sincroniza busca com #advFilterInput nativo do Bunkr
            const syncSearch = () => {
                const val = searchInp.value.trim();
                searchWrap.classList.toggle("has-text", !!val);
                const nativeInp = document.querySelector("#advFilterInput");
                if (nativeInp) {
                    nativeInp.value = val;
                    nativeInp.dispatchEvent(new Event("input", { bubbles: true }));
                }
                setTimeout(() => {
                    enhanceCards();
                    updateCount();
                }, 150);
            };
            searchInp.addEventListener("input", syncSearch);
            searchClear.addEventListener("click", () => {
                searchInp.value = "";
                syncSearch();
                searchInp.focus();
            });

            // Preenche busca se já houver parâmetro ?q=
            const q = getQ();
            if (q) {
                searchInp.value = q;
                searchWrap.classList.add("has-text");
            }

            // Sincroniza chips de ordenação
            let uploadDateDir = "desc";
            let titleDateSortDir = "desc";
            const chips = bar.querySelectorAll(".bunkr-chip");
            chips.forEach(chip => {
                chip.addEventListener("click", () => {
                    const st = chip.dataset.sort;
                    if (st === "upload-date") {
                        if (chip.classList.contains("is-active")) {
                            uploadDateDir = uploadDateDir === "desc" ? "asc" : "desc";
                        }
                        const dirEl = chip.querySelector("#bunkrUploadDateDir");
                        if (dirEl) dirEl.textContent = uploadDateDir === "desc" ? "⬇" : "⬆";
                        chips.forEach(c => c.classList.remove("is-active"));
                        chip.classList.add("is-active");
                        sortGalleryByUploadDate(uploadDateDir);
                        return;
                    }

                    if (st === "title-date") {
                        if (chip.classList.contains("is-active")) {
                            titleDateSortDir = titleDateSortDir === "desc" ? "asc" : "desc";
                        }
                        const dirEl = chip.querySelector("#bunkrTitleDateDir");
                        if (dirEl) dirEl.textContent = titleDateSortDir === "desc" ? "⬇" : "⬆";
                        chips.forEach(c => c.classList.remove("is-active"));
                        chip.classList.add("is-active");
                        sortGalleryByTitleDate(titleDateSortDir);
                        return;
                    }

                    chips.forEach(c => c.classList.remove("is-active"));
                    chip.classList.add("is-active");
                    if (st === "name") {
                        sortGalleryByName("asc");
                        document.querySelector(".btnName")?.click();
                    } else if (st === "size") {
                        document.querySelector(".btnSize")?.click();
                    }
                    setTimeout(() => {
                        enhanceCards();
                        if (isGroupByType) groupGalleryByType(true);
                        updateCount();
                    }, 200);
                });
            });

            // Sincroniza toggle de agrupamento por tipo
            const btnGroupToggle = bar.querySelector("#bunkrToggleGroup");
            btnGroupToggle.addEventListener("click", () => {
                groupGalleryByType(!isGroupByType);
                updateCount();
            });

            // Sincroniza toggle de nomes completos
            const btnNamesToggle = bar.querySelector("#bunkrToggleNames");
            btnNamesToggle.addEventListener("click", () => {
                document.querySelector("#advToggleNames")?.click();
                grid.classList.toggle("full-filename");
                const active = grid.classList.contains("full-filename");
                btnNamesToggle.classList.toggle("is-active", active);
                btnNamesToggle.querySelector(".label").textContent = active ? "Nomes Truncados" : "Nomes Completos";
            });

            // Sincroniza botões de cópia
            bar.querySelector("#bunkrCopyNames").addEventListener("click", () => {
                document.querySelector("#advCopyNames")?.click();
                toast("Nomes copiados!");
            });
            bar.querySelector("#bunkrCopyUrls").addEventListener("click", () => {
                document.querySelector("#advCopyURLs")?.click();
                toast("URLs copiadas!");
            });

            // Contador de arquivos
            const updateCount = () => {
                killOldCounter();
                const totalFiles = (window.albumFiles && window.albumFiles.length) || document.querySelectorAll(".theItem").length;
                const counter = document.getElementById("resultsCounter");
                if (counter && counter.textContent) {
                    countEl.textContent = cleanHtmlText(counter.textContent).replace(/Showing\s*all/i, "Total:").replace(/files/i, "arquivos");
                } else {
                    const visible = document.querySelectorAll('.theItem:not([style*="display: none"])').length;
                    countEl.textContent = visible === totalFiles ? `Total: ${totalFiles} arquivos` : `${visible} de ${totalFiles} arquivos`;
                }
                if (isGroupByType) updateGroupHeadersVisibility();
            };
            updateCount();
            albumCountUpdate = updateCount;
            // Contagem por evento (filtro/ordem/grupo/novos cards e o contador nativo),
            // em vez de um setInterval de 1 s que forçava layout para sempre.
            const counterEl = document.getElementById("resultsCounter");
            if (counterEl && !counterEl.dataset.bunkrCountObs) {
                counterEl.dataset.bunkrCountObs = "1";
                let queued = false;
                new MutationObserver(() => {
                    if (queued) return;
                    queued = true;
                    requestAnimationFrame(() => { queued = false; if (albumCountUpdate) albumCountUpdate(); });
                }).observe(counterEl, { childList: true, characterData: true, subtree: true });
            }
        }

        // Executa enhance inicial nos cards existentes
        enhanceCards();
        if (isGroupByType) {
            groupGalleryByType(true);
        }

        // Observa novos cards carregados via infinite scroll (apenas adições diretas de nós .theItem no grid, sem subtree para evitar qualquer loop)
        if (!galleryObserver) {
            galleryObserver = new MutationObserver(mutations => {
                let hasNewCards = false;
                for (const m of mutations) {
                    if (m.addedNodes && m.addedNodes.length) {
                        for (const node of m.addedNodes) {
                            if (node.nodeType === 1 && (node.classList?.contains("theItem") || node.querySelector?.(".theItem"))) {
                                hasNewCards = true;
                                break;
                            }
                        }
                    }
                    if (hasNewCards) break;
                }
                if (hasNewCards) {
                    enhanceCards();
                    if (albumCountUpdate) albumCountUpdate();
                }
            });
            galleryObserver.observe(grid, { childList: true, subtree: false });
        }
    }

    // Interceptor global: NENHUM link de card deve abrir em nova aba
    document.addEventListener("click", e => {
        const a = e.target.closest && e.target.closest(".theItem a[href]");
        if (a) {
            a.removeAttribute("target");
            a.target = "_self";
        }
    }, true);

    function checkPageType() {
        if (/\/a\//.test(location.pathname)) {
            document.documentElement.classList.remove("bunkr-file", "bunkr-home");
            document.documentElement.classList.add("bunkr-album");
        } else if (location.pathname === "/" || location.pathname === "") {
            document.documentElement.classList.remove("bunkr-file", "bunkr-album");
            document.documentElement.classList.add("bunkr-home");
        } else {
            document.documentElement.classList.remove("bunkr-album", "bunkr-home");
            document.documentElement.classList.add("bunkr-file");
        }
    }

    const isFile = () => !/\/a\//.test(location.pathname) && location.pathname !== "/" && location.pathname !== "";
    function apply() {
        checkPageType();
        simplifyHeader(); killBanner();   // header/busca valem pro ÁLBUM; na página de arquivo o stage cobre por cima
        if (!isFile()) setupModernGallery();
    }
    onReady(() => {
        if (!isFile() && openSingleItemAlbum()) return;
        checkPageType();
        apply(); setTimeout(apply, 700); initFilter();
        if (!isFile()) {
            setupModernGallery();
            setTimeout(setupModernGallery, 600);
            setTimeout(setupModernGallery, 1500);
        }
        if (isFile()) {   // página de arquivo: monta o STAGE (vrow + mídia fixa + strip do álbum) e a mídia assim que o src/img aparecer
            let n = 0, done = false, id = null;
            const stop = () => { done = true; if (id) clearInterval(id); };
            const tick = () => {
                const stage = buildStage();
                if (stage) {
                    if (stage.classList.contains("is-video")) mountOwnPlayer();
                    else if (stage.classList.contains("is-text")) mountTextViewer();
                    else mountPhotoZoom();
                    if (stage._sidebarList) renderRelatedToPlaylist(stage._sidebarList, stage._sbCount);   // mantém o fallback fresco até o álbum baixar (renderPlaylist assume quando playlistFull)
                    testMirror();
                }
                const noProbe = !document.querySelector("#video-container, #video-wrapper") || (stage && stage.classList.contains("is-text"));   // imagem/não-vídeo/texto → não há probe de mirror (probed nunca vira true)
                if (mediaMounted && (probed || noProbe)) stop();
                else if (++n > 30) {   // ~12s de segurança
                    stop();
                    if (!mediaMounted) { document.documentElement.classList.add("bunkr-fallback"); const st = document.querySelector(".bunkr-stage"); if (st) st.remove(); document.documentElement.classList.remove("bunkr-has-stage"); }
                }
            };
            tick();   // JÁ no DOMContentLoaded (não espera o 1º intervalo de 400ms) → o stage cobre o placeholder ASAP, sem flash da interface antiga
            if (!done) id = setInterval(tick, 400);
        }
    });
})();
