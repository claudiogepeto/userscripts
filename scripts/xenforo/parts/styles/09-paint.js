    // STYLE CONTEXT: shared page paint gate and non-home page skeletons
    const CSS_PAINT = `/* ================= SHARED PAINT GATE ================= */
            /* The native XF tree remains in the DOM for compatibility, but it is never visible
               while a custom page is still being composed. This prevents the original layout from
               flashing underneath the skeleton or dancing during the handoff. */
            html.smg-page-pending {
                background: var(--smg-bg) !important;
                overflow: hidden !important;
                scrollbar-gutter: stable;
            }
            /* Hide the complete native page tree. Hiding body itself closes the gap between
               document-start and the parser adding the first body child; the direct-child
               rule remains as a belt-and-suspenders guard for themes that create their own
               stacking contexts. The custom chrome stays hidden too and is revealed together
               with the composed page, so mounting it cannot create a second visible handoff. */
            html.smg-page-pending body {
                visibility: hidden !important;
                pointer-events: none !important;
            }
            html.smg-page-pending body > * { visibility: hidden !important; }
            html.smg-page-pending .p-body,
            html.smg-page-pending .p-pageWrapper { visibility: hidden !important; }
            html.smg-page-pending #smg-topbar-wrap,
            html.smg-page-pending #smg-aldock,
            html.smg-page-pending #smg-post-nav-wrapper {
                visibility: hidden !important;
                pointer-events: none !important;
            }
            html.smg-page-pending #smg-topbar-wrap { z-index: var(--smg-z-gate) !important; }
            html.smg-page-pending #smg-aldock { z-index: var(--smg-z-gate-1) !important; }
            html.smg-page-pending #smg-post-nav-wrapper { z-index: var(--smg-z-gate-2) !important; }
            #smg-page-skeleton {
                position: fixed; inset: 0; z-index: var(--smg-z-topbar); display: none; min-height: 100vh; min-height: 100dvh; overflow: hidden;
                pointer-events: none; background: var(--smg-bg); color: #fff;
            }
            /* o fade de saída (120 ms) vale pra TODA página: o skeleton segue visível enquanto smg-skeleton-fade-out */
            html.smg-page-pending #smg-page-skeleton, html.smg-skeleton-fade-out #smg-page-skeleton { display: block; }
            html.smg-aldock-on #smg-page-skeleton { right: var(--smg-ald-w); }
            #smg-page-skeleton-rail {
                position: fixed; top: 0; right: 0; bottom: 0; z-index: var(--smg-z-topbar-up); display: none; width: var(--smg-ald-w);
                overflow: hidden; pointer-events: none; background: var(--smg-bg); color: #fff;
                border-left: 1px solid var(--smg-w-10); box-shadow: -10px 0 30px var(--smg-k-25);
            }
            html.smg-page-pending.smg-aldock-on #smg-page-skeleton-rail,
            html.smg-skeleton-fade-out.smg-aldock-on #smg-page-skeleton-rail { display: block; }
            /* Component-level loading states & decoupling: */
            html.smg-topbar-ready #smg-topbar-wrap {
                visibility: visible !important;
                pointer-events: auto !important;
                z-index: var(--smg-z-gate) !important;
            }
            html.smg-topbar-ready .smg-page-skeleton-chrome {
                display: none !important;
            }
            html.smg-topbar-ready #smg-page-skeleton {
                top: 62px !important;
                min-height: calc(100vh - 62px) !important;
                min-height: calc(100dvh - 62px) !important;
            }
            @media (max-width: 1100px) {
                html.smg-topbar-ready #smg-page-skeleton {
                    top: 52px !important;
                    min-height: calc(100vh - 52px) !important;
                    min-height: calc(100dvh - 52px) !important;
                }
            }
            html.smg-sidebar-ready #smg-aldock {
                visibility: visible !important;
                pointer-events: auto !important;
                z-index: var(--smg-z-gate-1) !important;
            }
            html.smg-sidebar-ready #smg-page-skeleton-rail {
                display: none !important;
            }
            html.smg-navbar-ready #smg-post-nav-wrapper {
                visibility: visible !important;
                pointer-events: auto !important;
                z-index: var(--smg-z-gate-2) !important;
            }
            html.smg-navbar-ready .smg-page-skeleton-bottom-nav {
                display: none !important;
            }
            html.smg-content-ready .p-body-content {
                visibility: visible !important;
                pointer-events: auto !important;
            }
            #smg-page-skeleton, #smg-page-skeleton-rail {
                opacity: 1;
                transition: opacity var(--smg-dur-12) cubic-bezier(0.2, 0, 0, 1);
                will-change: opacity;
            }
            html.smg-skeleton-fade-out #smg-page-skeleton,
            html.smg-skeleton-fade-out #smg-page-skeleton-rail {
                opacity: 0 !important;
                pointer-events: none !important;
            }
            html.smg-content-ready:not(.smg-skeleton-fade-out) #smg-page-skeleton {
                display: none !important;
            }
            html.smg-content-ready #smg-page-skeleton {
                pointer-events: none !important;
            }
            html.smg-thread [data-smg-structure-recorded="1"] {
                overflow-anchor: none;
            }
            .smg-page-skeleton *, .smg-page-skeleton *::before, .smg-page-skeleton *::after { box-sizing: border-box; }
            .smg-page-skeleton-chrome {
                display: flex; align-items: center; gap: var(--smg-sp-24); height: 62px;
                padding: 0 max(18px, calc((100% - var(--smg-cw)) / 2));
                border-bottom: 1px solid var(--smg-w-08); background: var(--smg-bg);
            }
            .smg-page-skeleton-chrome-logo,
            .smg-page-skeleton-chrome-nav i,
            .smg-page-skeleton-chrome-actions i,
            .smg-page-skeleton-title,
            .smg-page-skeleton-meta i,
            .smg-page-skeleton-action,
            .smg-page-skeleton-filter i,
            .smg-page-skeleton-line,
            .smg-page-skeleton-avatar,
            .smg-page-skeleton-card-thumb,
            .smg-page-skeleton-row-thumb {
                position: relative; overflow: hidden; background: var(--smg-w-10);
            }
            .smg-page-skeleton-chrome-logo { flex: 0 0 142px; width: 142px; height: 28px; border-radius: var(--smg-r-8); }
            .smg-page-skeleton-chrome-nav { display: flex; align-items: center; gap: var(--smg-sp-32); margin-left: auto; }
            .smg-page-skeleton-chrome-nav i { display: block; width: 82px; height: 13px; border-radius: var(--smg-r-6); }
            .smg-page-skeleton-chrome-nav i:nth-child(2) { width: 72px; }
            .smg-page-skeleton-chrome-nav i:nth-child(3) { width: 78px; }
            .smg-page-skeleton-chrome-actions { display: flex; align-items: center; gap: var(--smg-sp-14); margin-left: var(--smg-sp-32); }
            .smg-page-skeleton-chrome-actions i { display: block; width: 24px; height: 24px; border-radius: var(--smg-r-round); }
            .smg-page-skeleton-chrome-actions i:last-child { width: 34px; height: 34px; }
            .smg-page-skeleton-main {
                width: var(--smg-cw); min-height: calc(100vh - 62px); min-height: calc(100dvh - 62px);
                margin: 0 auto; padding: var(--smg-sp-28) 0 64px;
            }
            .smg-page-skeleton-header { display: flex; align-items: center; gap: var(--smg-sp-16); min-height: 94px; padding: var(--smg-sp-20) 0 var(--smg-sp-16); border-bottom: 1px solid var(--smg-w-10); }
            .smg-page-skeleton-header-copy { flex: 1 1 auto; min-width: 0; }
            .smg-page-skeleton-title { width: min(62%, 520px); height: 25px; border-radius: var(--smg-r-8); }
            .smg-page-skeleton-meta { display: flex; align-items: center; gap: var(--smg-sp-8); margin-top: var(--smg-sp-14); }
            .smg-page-skeleton-meta i { display: block; width: 86px; height: 11px; border-radius: var(--smg-r-6); }
            .smg-page-skeleton-meta i:nth-child(2) { width: 130px; opacity: .72; }
            .smg-page-skeleton-actions { display: flex; align-items: center; gap: var(--smg-sp-8); flex: 0 0 auto; }
            .smg-page-skeleton-action { width: 38px; height: 38px; border-radius: var(--smg-r-12); }
            .smg-page-skeleton-filter { display: flex; align-items: center; gap: var(--smg-sp-8); min-height: 48px; margin: var(--smg-sp-16) 0 var(--smg-sp-18); padding: var(--smg-sp-6) var(--smg-sp-8); border: 1px solid var(--smg-w-08); border-radius: var(--smg-r-14); background: var(--smg-w-04); }
            .smg-page-skeleton-filter i { width: 76px; height: 29px; border-radius: var(--smg-r-8); }
            .smg-page-skeleton-filter i:nth-child(2) { width: 94px; }
            .smg-page-skeleton-filter i:nth-child(3) { width: 70px; }
            .smg-page-skeleton-filter i:last-child { margin-left: auto; width: 34px; }
            .smg-page-skeleton-posts, .smg-page-skeleton-feed, .smg-page-skeleton-bookmarks { display: grid; gap: var(--smg-sp-14); }
            .smg-page-skeleton-post { overflow: hidden; min-height: 260px; border: 1px solid var(--smg-w-10); border-radius: var(--smg-r-18); background: var(--smg-w-04); }
            .smg-page-skeleton-post-head { display: flex; align-items: center; gap: var(--smg-sp-12); padding: var(--smg-sp-16) var(--smg-sp-20); border-bottom: 1px solid var(--smg-w-08); }
            .smg-page-skeleton-avatar { flex: 0 0 auto; width: 42px; height: 42px; border-radius: var(--smg-r-round); }
            .smg-page-skeleton-post-copy { flex: 1 1 auto; min-width: 0; }
            .smg-page-skeleton-post-copy .smg-page-skeleton-line:first-child { width: 132px; }
            .smg-page-skeleton-post-copy .smg-page-skeleton-line:last-child { width: 86px; margin-top: var(--smg-sp-8); }
            .smg-page-skeleton-post-body { display: grid; gap: var(--smg-sp-10); padding: var(--smg-sp-24) var(--smg-sp-20) var(--smg-sp-28); }
            .smg-page-skeleton-post-body .smg-page-skeleton-line:nth-child(1) { width: 96%; }
            .smg-page-skeleton-post-body .smg-page-skeleton-line:nth-child(2) { width: 89%; }
            .smg-page-skeleton-post-body .smg-page-skeleton-line:nth-child(3) { width: 76%; }
            .smg-page-skeleton-post-body .smg-page-skeleton-line:nth-child(4) { width: 42%; margin-top: var(--smg-sp-24); }
            .smg-page-skeleton-line { display: block; width: 100%; height: 11px; border-radius: var(--smg-r-6); }
            .smg-page-skeleton-feed-card { display: flex; gap: var(--smg-sp-14); min-height: 146px; padding: var(--smg-sp-14); border: 1px solid var(--smg-w-10); border-radius: var(--smg-card-r); background: var(--smg-w-04); }
            .smg-page-skeleton-card-thumb { flex: 0 0 132px; height: 116px; border-radius: var(--smg-r-12); }
            .smg-page-skeleton-card-copy { flex: 1 1 auto; min-width: 0; padding: var(--smg-sp-8) 0; }
            .smg-page-skeleton-card-copy .smg-page-skeleton-line + .smg-page-skeleton-line { margin-top: var(--smg-sp-12); }
            .smg-page-skeleton-card-copy .smg-page-skeleton-line:last-child { width: 45%; margin-top: var(--smg-sp-24); }
            .smg-page-skeleton-list { display: grid; gap: var(--smg-sp-10); }
            .smg-page-skeleton-row { display: flex; align-items: center; gap: var(--smg-sp-14); min-height: 92px; padding: var(--smg-sp-12) var(--smg-sp-16); border: 1px solid var(--smg-w-08); border-radius: var(--smg-r-14); background: var(--smg-w-04); }
            .smg-page-skeleton-row-thumb { flex: 0 0 72px; width: 72px; height: 60px; border-radius: var(--smg-r-10); }
            .smg-page-skeleton-row-copy { flex: 1 1 auto; min-width: 0; }
            .smg-page-skeleton-row-copy .smg-page-skeleton-line { width: min(70%, 420px); }
            .smg-page-skeleton-row-copy .smg-page-skeleton-line + .smg-page-skeleton-line { width: 38%; margin-top: var(--smg-sp-12); }
            .smg-page-skeleton-row-action { flex: 0 0 34px; width: 34px; height: 34px; border-radius: var(--smg-r-10); background: var(--smg-w-08); }
            .smg-page-skeleton-bottom-nav { display: none; }
            /* SHIMMER: UMA regra pra todo skeleton (página, home, carrossel, rail, salvos, galeria). Quem é
               nosso ganha a classe .smg-skeleton-shimmer; os dois estados sem markup próprio (tile da galeria
               carregando, célula de thumb da grade) entram por seletor. */
            .smg-skeleton-shimmer, .smg-gallery-tile.is-loading { position: relative; overflow: hidden; }
            .smg-skeleton-shimmer::after,
            .smg-gallery-tile.is-loading::after,
            html.smg-threadlist.smg-tv-grid .structItem--thread:not([data-smg-ph-ready]) .structItem-cell--icon:not(.structItem-cell--iconEnd)::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, var(--smg-w-08), transparent); animation: smg-skel-shimmer 1.3s ease-in-out infinite; pointer-events: none; }
            @keyframes smg-skel-shimmer { 100% { transform: translateX(100%); } }
            .smg-page-skeleton-rail-head { display: flex; align-items: center; gap: var(--smg-sp-12); height: 62px; padding: 0 var(--smg-sp-16); border-bottom: 1px solid var(--smg-w-08); }
            .smg-page-skeleton-rail-title { display: block; width: 104px; height: 15px; border-radius: var(--smg-r-6); background: var(--smg-w-10); }
            .smg-page-skeleton-rail-actions { display: flex; gap: var(--smg-sp-8); margin-left: auto; }
            .smg-page-skeleton-rail-actions i { display: block; width: 28px; height: 28px; border-radius: var(--smg-r-8); background: var(--smg-w-08); }
            .smg-page-skeleton-rail-list { display: grid; }
            .smg-page-skeleton-rail-row { display: flex; align-items: center; gap: var(--smg-sp-12); min-height: 86px; padding: var(--smg-sp-12) var(--smg-sp-14); border-bottom: 1px solid var(--smg-w-08); }
            .smg-page-skeleton-rail-thumb { flex: 0 0 58px; width: 58px; height: 58px; border-radius: var(--smg-r-12); background: var(--smg-w-08); }
            .smg-page-skeleton-rail-copy { display: flex; flex: 1 1 auto; min-width: 0; flex-direction: column; gap: var(--smg-sp-10); }
            .smg-page-skeleton-rail-line { display: block; width: 86%; height: 10px; border-radius: var(--smg-r-6); background: var(--smg-w-10); }
            .smg-page-skeleton-rail-line.short { width: 54%; height: 8px; }
            @media (max-width: 1100px) {
                .smg-page-skeleton-chrome { height: 52px; padding: 0 var(--smg-sp-14); }
                .smg-page-skeleton-chrome-logo { flex-basis: 100px; width: 100px; height: 24px; }
                .smg-page-skeleton-chrome-nav { display: none; }
                .smg-page-skeleton-chrome-actions { margin-left: auto; gap: var(--smg-sp-10); }
                .smg-page-skeleton-main { min-height: calc(100vh - 52px); min-height: calc(100dvh - 52px); }
            }
            @media (max-width: 800px) {
                .smg-page-skeleton-main { width: 100%; max-width: none; padding-left: var(--smg-sp-16); padding-right: var(--smg-sp-16); }
            }
            @media (max-width: 600px) {
                html.smg-topbar-ready #smg-page-skeleton {
                    top: calc(54px + env(safe-area-inset-top)) !important;
                    min-height: calc(100vh - 54px - env(safe-area-inset-top)) !important;
                    min-height: calc(100dvh - 54px - env(safe-area-inset-top)) !important;
                }
                html.smg-thread.smg-topbar-ready #smg-page-skeleton {
                    top: 0 !important;
                    min-height: 100vh !important;
                    min-height: 100dvh !important;
                }
                #smg-page-skeleton-rail { display: none !important; }
                .smg-page-skeleton-chrome { height: calc(54px + env(safe-area-inset-top)); padding: env(safe-area-inset-top) var(--smg-sp-14) 0; }
                .smg-page-skeleton-main { width: 100%; max-width: none; min-height: calc(100vh - 54px); min-height: calc(100dvh - 54px); padding: var(--smg-sp-14) var(--smg-sp-12) 38px; }
                .smg-page-skeleton-header { min-height: 82px; padding: var(--smg-sp-14) 0 var(--smg-sp-12); }
                .smg-page-skeleton-title { width: 78%; height: 21px; }
                .smg-page-skeleton-action { width: 34px; height: 34px; }
                .smg-page-skeleton-filter { margin: var(--smg-sp-12) 0 var(--smg-sp-14); overflow: hidden; }
                .smg-page-skeleton-filter i { flex: 0 0 auto; }
                .smg-page-skeleton-post { min-height: 230px; border-radius: var(--smg-r-14); }
                .smg-page-skeleton-post-head { padding: var(--smg-sp-14) var(--smg-sp-14); }
                .smg-page-skeleton-post-body { padding: var(--smg-sp-18) var(--smg-sp-14) var(--smg-sp-24); }
                .smg-page-skeleton-feed-card { min-height: 112px; padding: var(--smg-sp-10); gap: var(--smg-sp-10); }
                .smg-page-skeleton-card-thumb { flex-basis: 92px; width: 92px; height: 90px; }
                .smg-page-skeleton-card-copy { padding: var(--smg-sp-4) 0; }
                .smg-page-skeleton-row { min-height: 76px; padding: var(--smg-sp-10) var(--smg-sp-10); gap: var(--smg-sp-10); }
                .smg-page-skeleton-row-thumb { flex-basis: 58px; width: 58px; height: 50px; }
                .smg-page-skeleton-row-copy .smg-page-skeleton-line { width: 88%; }
                .smg-page-skeleton-main { padding-bottom: calc(38px + 54px + env(safe-area-inset-bottom)); }
                .smg-page-skeleton-bottom-nav {
                    position: absolute; left: 0; right: 0; bottom: 0; z-index: var(--smg-z-2);
                    display: flex; align-items: center; justify-content: space-around; gap: var(--smg-sp-2);
                    height: calc(54px + env(safe-area-inset-bottom)); padding: 0 var(--smg-sp-6) env(safe-area-inset-bottom);
                    border-top: 1px solid var(--smg-w-08); background: var(--smg-bg);
                }
                .smg-page-skeleton-bottom-nav i {
                    display: block; width: 22px; height: 22px; border-radius: var(--smg-r-8);
                    background: var(--smg-w-10);
                }
                .smg-page-skeleton--thread .smg-page-skeleton-bottom-nav,
                .smg-page-skeleton--listing .smg-page-skeleton-bottom-nav,
                .smg-page-skeleton--following .smg-page-skeleton-bottom-nav {
                    height: calc(92px + env(safe-area-inset-bottom)); padding-top: 44px;
                }
                .smg-page-skeleton--thread .smg-page-skeleton-bottom-nav::before,
                .smg-page-skeleton--listing .smg-page-skeleton-bottom-nav::before,
                .smg-page-skeleton--following .smg-page-skeleton-bottom-nav::before {
                    content: ""; position: absolute; left: 0; right: 0; top: 0; height: 44px;
                    border-bottom: 1px solid var(--smg-w-08); background: var(--smg-w-02);
                }
            }
            @media (prefers-reduced-motion: reduce) {
                .smg-skeleton-shimmer::after, .smg-gallery-tile.is-loading::after, html.smg-threadlist.smg-tv-grid .structItem--thread:not([data-smg-ph-ready]) .structItem-cell--icon:not(.structItem-cell--iconEnd)::after { animation: none; }
            }
        `;
