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
