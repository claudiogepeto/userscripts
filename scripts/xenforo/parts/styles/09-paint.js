    // STYLE CONTEXT: shared page paint gate and non-home page skeletons
    const CSS_PAINT = `/* ================= SHARED PAINT GATE ================= */
            /* The native XF tree remains in the DOM for compatibility, but it is never visible
               while a custom page is still being composed. This prevents the original layout from
               flashing underneath the skeleton or dancing during the handoff. */
            html.smg-page-pending {
                background: var(--smg-bg, #101113) !important;
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
            html.smg-page-pending #smg-aldock {
                visibility: hidden !important;
                pointer-events: none !important;
            }
            html.smg-page-pending #smg-topbar-wrap { z-index: 1100 !important; }
            html.smg-page-pending #smg-aldock { z-index: 1101 !important; }
            #smg-page-skeleton {
                position: fixed; inset: 0; z-index: 1000; display: none; min-height: 100vh; min-height: 100dvh; overflow: hidden;
                pointer-events: none; background: var(--smg-bg, #101113); color: #fff;
            }
            html.smg-page-pending #smg-page-skeleton { display: block; }
            html.smg-aldock-on #smg-page-skeleton { right: var(--smg-ald-w, 360px); }
            #smg-page-skeleton-rail {
                position: fixed; top: 0; right: 0; bottom: 0; z-index: 1001; display: none; width: var(--smg-ald-w, 360px);
                overflow: hidden; pointer-events: none; background: var(--smg-bg, #101113); color: #fff;
                border-left: 1px solid rgba(255,255,255,0.09); box-shadow: -10px 0 30px rgba(0,0,0,0.25);
            }
            html.smg-page-pending.smg-aldock-on #smg-page-skeleton-rail { display: block; }
            .smg-page-skeleton *, .smg-page-skeleton *::before, .smg-page-skeleton *::after { box-sizing: border-box; }
            .smg-page-skeleton-chrome {
                display: flex; align-items: center; gap: 24px; height: 62px;
                padding: 0 max(18px, calc((100% - var(--smg-cw, 80%)) / 2));
                border-bottom: 1px solid rgba(255,255,255,0.08); background: var(--smg-bg, #101113);
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
                position: relative; overflow: hidden; background: rgba(255,255,255,0.09);
            }
            .smg-page-skeleton-chrome-logo { flex: 0 0 142px; width: 142px; height: 28px; border-radius: 7px; }
            .smg-page-skeleton-chrome-nav { display: flex; align-items: center; gap: 30px; margin-left: auto; }
            .smg-page-skeleton-chrome-nav i { display: block; width: 82px; height: 13px; border-radius: 6px; }
            .smg-page-skeleton-chrome-nav i:nth-child(2) { width: 72px; }
            .smg-page-skeleton-chrome-nav i:nth-child(3) { width: 78px; }
            .smg-page-skeleton-chrome-actions { display: flex; align-items: center; gap: 14px; margin-left: 30px; }
            .smg-page-skeleton-chrome-actions i { display: block; width: 24px; height: 24px; border-radius: 50%; }
            .smg-page-skeleton-chrome-actions i:last-child { width: 34px; height: 34px; }
            .smg-page-skeleton-main {
                width: var(--smg-cw, 80%); min-height: calc(100vh - 62px); min-height: calc(100dvh - 62px);
                margin: 0 auto; padding: 26px 0 64px;
            }
            .smg-page-skeleton-header { display: flex; align-items: center; gap: 16px; min-height: 94px; padding: 20px 0 16px; border-bottom: 1px solid rgba(255,255,255,0.10); }
            .smg-page-skeleton-header-copy { flex: 1 1 auto; min-width: 0; }
            .smg-page-skeleton-title { width: min(62%, 520px); height: 25px; border-radius: 7px; }
            .smg-page-skeleton-meta { display: flex; align-items: center; gap: 8px; margin-top: 13px; }
            .smg-page-skeleton-meta i { display: block; width: 86px; height: 11px; border-radius: 5px; }
            .smg-page-skeleton-meta i:nth-child(2) { width: 130px; opacity: .72; }
            .smg-page-skeleton-actions { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
            .smg-page-skeleton-action { width: 38px; height: 38px; border-radius: 11px; }
            .smg-page-skeleton-filter { display: flex; align-items: center; gap: 8px; min-height: 48px; margin: 16px 0 18px; padding: 6px 8px; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; background: rgba(255,255,255,0.035); }
            .smg-page-skeleton-filter i { width: 76px; height: 29px; border-radius: 8px; }
            .smg-page-skeleton-filter i:nth-child(2) { width: 94px; }
            .smg-page-skeleton-filter i:nth-child(3) { width: 70px; }
            .smg-page-skeleton-filter i:last-child { margin-left: auto; width: 34px; }
            .smg-page-skeleton-posts, .smg-page-skeleton-feed, .smg-page-skeleton-bookmarks { display: grid; gap: 14px; }
            .smg-page-skeleton-post { overflow: hidden; min-height: 260px; border: 1px solid rgba(255,255,255,0.09); border-radius: 18px; background: rgba(255,255,255,0.045); }
            .smg-page-skeleton-post-head { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); }
            .smg-page-skeleton-avatar { flex: 0 0 auto; width: 42px; height: 42px; border-radius: 50%; }
            .smg-page-skeleton-post-copy { flex: 1 1 auto; min-width: 0; }
            .smg-page-skeleton-post-copy .smg-page-skeleton-line:first-child { width: 132px; }
            .smg-page-skeleton-post-copy .smg-page-skeleton-line:last-child { width: 86px; margin-top: 8px; }
            .smg-page-skeleton-post-body { display: grid; gap: 10px; padding: 22px 20px 28px; }
            .smg-page-skeleton-post-body .smg-page-skeleton-line:nth-child(1) { width: 96%; }
            .smg-page-skeleton-post-body .smg-page-skeleton-line:nth-child(2) { width: 89%; }
            .smg-page-skeleton-post-body .smg-page-skeleton-line:nth-child(3) { width: 76%; }
            .smg-page-skeleton-post-body .smg-page-skeleton-line:nth-child(4) { width: 42%; margin-top: 24px; }
            .smg-page-skeleton-line { display: block; width: 100%; height: 11px; border-radius: 5px; }
            .smg-page-skeleton-feed-card, .smg-page-skeleton-bookmark-card { display: flex; gap: 14px; min-height: 146px; padding: 14px; border: 1px solid rgba(255,255,255,0.09); border-radius: 16px; background: rgba(255,255,255,0.045); }
            .smg-page-skeleton-card-thumb { flex: 0 0 132px; height: 116px; border-radius: 11px; }
            .smg-page-skeleton-card-copy { flex: 1 1 auto; min-width: 0; padding: 8px 0; }
            .smg-page-skeleton-card-copy .smg-page-skeleton-line + .smg-page-skeleton-line { margin-top: 11px; }
            .smg-page-skeleton-card-copy .smg-page-skeleton-line:last-child { width: 45%; margin-top: 22px; }
            .smg-page-skeleton-list { display: grid; gap: 10px; }
            .smg-page-skeleton-row { display: flex; align-items: center; gap: 14px; min-height: 92px; padding: 12px 16px; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; background: rgba(255,255,255,0.04); }
            .smg-page-skeleton-row-thumb { flex: 0 0 72px; width: 72px; height: 60px; border-radius: 10px; }
            .smg-page-skeleton-row-copy { flex: 1 1 auto; min-width: 0; }
            .smg-page-skeleton-row-copy .smg-page-skeleton-line { width: min(70%, 420px); }
            .smg-page-skeleton-row-copy .smg-page-skeleton-line + .smg-page-skeleton-line { width: 38%; margin-top: 11px; }
            .smg-page-skeleton-row-action { flex: 0 0 34px; width: 34px; height: 34px; border-radius: 9px; background: rgba(255,255,255,0.08); }
            .smg-page-skeleton-bottom-nav { display: none; }
            .smg-page-skeleton .smg-skeleton-shimmer,
            .smg-page-skeleton-rail .smg-skeleton-shimmer { position: relative; overflow: hidden; }
            .smg-page-skeleton .smg-skeleton-shimmer::after,
            .smg-page-skeleton-rail .smg-skeleton-shimmer::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgba(255,255,255,0.075), transparent); animation: smg-skel-shimmer 1.3s ease-in-out infinite; }
            .smg-page-skeleton-rail-head { display: flex; align-items: center; gap: 12px; height: 62px; padding: 0 16px; border-bottom: 1px solid rgba(255,255,255,0.08); }
            .smg-page-skeleton-rail-title { display: block; width: 104px; height: 15px; border-radius: 6px; background: rgba(255,255,255,0.10); }
            .smg-page-skeleton-rail-actions { display: flex; gap: 8px; margin-left: auto; }
            .smg-page-skeleton-rail-actions i { display: block; width: 28px; height: 28px; border-radius: 8px; background: rgba(255,255,255,0.08); }
            .smg-page-skeleton-rail-list { display: grid; }
            .smg-page-skeleton-rail-row { display: flex; align-items: center; gap: 12px; min-height: 86px; padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.07); }
            .smg-page-skeleton-rail-thumb { flex: 0 0 58px; width: 58px; height: 58px; border-radius: 11px; background: rgba(255,255,255,0.08); }
            .smg-page-skeleton-rail-copy { display: flex; flex: 1 1 auto; min-width: 0; flex-direction: column; gap: 9px; }
            .smg-page-skeleton-rail-line { display: block; width: 86%; height: 10px; border-radius: 5px; background: rgba(255,255,255,0.09); }
            .smg-page-skeleton-rail-line.short { width: 54%; height: 8px; }
            @media (max-width: 992px) {
                .smg-page-skeleton-chrome { height: 52px; padding: 0 14px; }
                .smg-page-skeleton-chrome-logo { flex-basis: 100px; width: 100px; height: 24px; }
                .smg-page-skeleton-chrome-nav { display: none; }
                .smg-page-skeleton-chrome-actions { margin-left: auto; gap: 10px; }
                .smg-page-skeleton-main { min-height: calc(100vh - 52px); min-height: calc(100dvh - 52px); }
            }
            @media (max-width: 800px) {
                .smg-page-skeleton-main { width: 100%; max-width: none; padding-left: 16px; padding-right: 16px; }
            }
            @media (max-width: 600px) {
                #smg-page-skeleton-rail { display: none !important; }
                .smg-page-skeleton-chrome { height: calc(54px + env(safe-area-inset-top)); padding: env(safe-area-inset-top) 14px 0; }
                .smg-page-skeleton-main { width: 100%; max-width: none; min-height: calc(100vh - 54px); min-height: calc(100dvh - 54px); padding: 14px 12px 38px; }
                .smg-page-skeleton-header { min-height: 82px; padding: 14px 0 12px; }
                .smg-page-skeleton-title { width: 78%; height: 21px; }
                .smg-page-skeleton-action { width: 34px; height: 34px; }
                .smg-page-skeleton-filter { margin: 12px 0 14px; overflow: hidden; }
                .smg-page-skeleton-filter i { flex: 0 0 auto; }
                .smg-page-skeleton-post { min-height: 230px; border-radius: 14px; }
                .smg-page-skeleton-post-head { padding: 13px 14px; }
                .smg-page-skeleton-post-body { padding: 18px 14px 22px; }
                .smg-page-skeleton-feed-card, .smg-page-skeleton-bookmark-card { min-height: 112px; padding: 10px; gap: 10px; }
                .smg-page-skeleton-card-thumb { flex-basis: 92px; width: 92px; height: 90px; }
                .smg-page-skeleton-card-copy { padding: 4px 0; }
                .smg-page-skeleton-row { min-height: 76px; padding: 9px 10px; gap: 10px; }
                .smg-page-skeleton-row-thumb { flex-basis: 58px; width: 58px; height: 50px; }
                .smg-page-skeleton-row-copy .smg-page-skeleton-line { width: 88%; }
                .smg-page-skeleton-main { padding-bottom: calc(38px + 54px + env(safe-area-inset-bottom)); }
                .smg-page-skeleton-bottom-nav {
                    position: absolute; left: 0; right: 0; bottom: 0; z-index: 2;
                    display: flex; align-items: center; justify-content: space-around; gap: 2px;
                    height: calc(54px + env(safe-area-inset-bottom)); padding: 0 6px env(safe-area-inset-bottom);
                    border-top: 1px solid rgba(255,255,255,0.08); background: var(--smg-bg, #101113);
                }
                .smg-page-skeleton-bottom-nav i {
                    display: block; width: 22px; height: 22px; border-radius: 7px;
                    background: rgba(255,255,255,0.09);
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
                    border-bottom: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.025);
                }
            }
            @media (prefers-reduced-motion: reduce) {
                .smg-page-skeleton .smg-skeleton-shimmer::after { animation: none; }
            }
        `;
