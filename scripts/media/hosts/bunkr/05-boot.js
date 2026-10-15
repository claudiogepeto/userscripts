
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
