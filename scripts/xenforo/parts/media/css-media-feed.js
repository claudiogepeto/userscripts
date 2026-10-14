    // ── CSS: media feed (tiktok mode) ──
    const CSS_MEDIA_FEED = `
            /* ---- modo feed (tiktok) ---- */
            #smg-feed {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100vh;
                z-index: var(--smg-z-overlay-1);
                display: none;
                background: #000;
            }
            #smg-feed.open { display: block; }

            /* aviso único: galeria/feed têm navegação própria. z-index ACIMA do feed/galeria (scrim cobre tudo). */
            #smg-navnotice { position: fixed; inset: 0; z-index: var(--smg-z-max-1); display: flex; align-items: center; justify-content: center; padding: var(--smg-sp-24); background: var(--smg-k-62); -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); }
            .smg-navnotice-card { max-width: 420px; width: 100%; background: var(--smg-s1); border: 1px solid var(--smg-bd); border-radius: var(--smg-r-16); padding: var(--smg-sp-24) var(--smg-sp-24) var(--smg-sp-18); box-shadow: var(--smg-shadow-4); }
            .smg-navnotice-title { font-size: var(--smg-fs-18); font-weight: 700; color: var(--smg-w-95); margin: 0 0 var(--smg-sp-10); }
            .smg-navnotice-text { font-size: var(--smg-fs-14); line-height: 1.5; color: var(--smg-w-60); margin: 0 0 var(--smg-sp-18); }
            .smg-navnotice-ok { display: block; width: 100%; padding: var(--smg-sp-12); border: 0; border-radius: var(--smg-r-10); background: var(--smg-link); color: #fff; font-size: var(--smg-fs-14); font-weight: 650; cursor: pointer; }
            .smg-navnotice-ok:hover { filter: brightness(1.06); }
            .smg-feed-track {
                height: 100%;
                width: 100%;
                overflow: hidden;
                position: relative;
                touch-action: none;
            }
            .smg-feed-reel {
                display: flex;
                flex-direction: column;
                will-change: transform;
            }
            .smg-feed-slide {
                height: 100vh;
                width: 100%;
                flex: 0 0 auto;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .smg-feed-media {
                max-width: 100vw;
                max-height: 100vh;
                object-fit: contain;
                user-select: none;
                -webkit-user-drag: none;
                cursor: zoom-in;
            }
            .smg-feed-media.smg-zoomed { cursor: grab; }
            .smg-feed-media.smg-grabbing { cursor: grabbing; }
            .smg-feed-embed {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .smg-feed-embed iframe {
                width: 95vw;
                max-width: 95vw;
                aspect-ratio: 16 / 9;
                max-height: 95vh;
                border: 0;
                border-radius: var(--smg-r-8);
                background: #000;
                pointer-events: none; /* deixa wheel/touch passarem pro feed (senão o iframe engole o scroll) */
            }
            .smg-feed-embed.is-live iframe { pointer-events: auto; } /* tap/click libera os controles do player */
            /* redgifs no feed = nosso <video> (mesmo padrão de pointer-events do iframe) */
            .smg-feed-embed .smg-rg {
                height: 90vh !important;
                width: auto !important;
                max-width: 95vw !important;
                max-height: 90vh !important;
                margin: 0 !important;
                pointer-events: none;
            }
            .smg-feed-embed.is-live .smg-rg { pointer-events: auto; }
            /* no feed, os CONTROLES sempre clicáveis (mesmo sem is-live) — senão os botões não funcionam lá */
            .smg-feed-embed .smg-rgc-bottom, .smg-feed-embed .smg-rgc-flash button, .smg-feed-embed .smg-rgc-src { pointer-events: auto; }
            .smg-feed-embed .smg-rgc-over { display: none; }   /* no feed já é o visualizador → esconde o botão "abrir no visualizador" */
            /* no feed o player enche a caixa de 90vh (sizing por ALTURA) — sobrepõe o height:auto/max-height do inline */
            .smg-feed-embed .smg-rg-v { height: 100% !important; max-height: none !important; }
            .smg-feed-empty {
                color: var(--smg-w-60);
                font-size: var(--smg-fs-16);
            }
            .smg-feed-nav {
                position: absolute;
                right: 18px;
                z-index: var(--smg-z-5);
                width: 48px;
                height: 48px;
                font-size: var(--smg-fs-22);
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: var(--smg-r-round);
                cursor: pointer;
                color: #fff;
                border: 1px solid var(--smg-w-14);
                background: rgba(20,20,24,0.82);   /* PERF: era backdrop-filter blur(6px) (repintava a cada frame de scroll do reel) — sólido semi-opaco fica visualmente igual sobre mídia escura */
                transition: background var(--smg-dur-15) ease, transform var(--smg-dur-12) ease;
            }
            .smg-feed-nav:hover { background: rgba(42,42,50,0.85); }
            .smg-feed-nav:active { transform: scale(0.9); }
            .smg-feed-nav svg { width: 1em; height: 1em; display: block; }
            .smg-feed-prev { top: calc(50% - 56px); }
            .smg-feed-next { top: calc(50% + 8px); }
            .smg-feed-close {
                position: absolute;
                top: 16px;
                right: 18px;
                z-index: var(--smg-z-5);
                width: 54px;
                height: 54px;
                font-size: var(--smg-fs-28);
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: var(--smg-r-round);
                cursor: pointer;
                color: #fff;
                border: 1px solid var(--smg-w-14);
                background: rgba(20,20,24,0.82);   /* PERF: era backdrop-filter blur(6px) (repintava a cada frame de scroll do reel) — sólido semi-opaco fica visualmente igual sobre mídia escura */
                transition: background var(--smg-dur-15) ease, transform var(--smg-dur-12) ease;
            }
            .smg-feed-close:hover { background: rgba(42,42,50,0.85); }
            .smg-feed-close:active { transform: scale(0.92); }
            .smg-feed-close svg { width: 1em; height: 1em; display: block; }
            .smg-feed-counter {
                position: absolute;
                top: 20px;
                left: 18px;
                z-index: var(--smg-z-5);
                padding: var(--smg-sp-6) var(--smg-sp-14);
                border-radius: var(--smg-r-pill);
                background: rgba(20,20,24,0.82);   /* PERF: sem backdrop-filter (repintava no scroll do reel) */
                border: 1px solid var(--smg-w-12);
                color: #fff;
                font-size: var(--smg-fs-13);
                font-weight: 600;
            }
`;