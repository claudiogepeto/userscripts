    // styles/08-alertpopover.js
    // Owns: CSS for the alerts popover and its phone drawer.
    // Exposes: CSS_ALERTPOPOVER.
    // Depends on: --smg-* tokens from styles/01-base.js; composed by core/05-styles.js (order matters).
    // STYLE CONTEXT: alerts popover
    const CSS_ALERTPOPOVER = `
            #smg-alpop {
                position: fixed; z-index: var(--smg-z-topbar-up); display: none; flex-direction: column;
                box-sizing: border-box; max-height: 70vh; max-height: 70dvh; overflow: hidden;
                border: 1px solid var(--smg-bd2); border-radius: var(--smg-pop-r);
                background: var(--smg-s1); color: var(--smg-tx); box-shadow: var(--smg-pop-shadow);
            }
            #smg-alpop.open { display: flex; }
            .smg-alpop-head {
                flex: 0 0 auto; display: flex; align-items: center; gap: var(--smg-sp-8);
                min-height: 52px; padding: 0 var(--smg-sp-10) 0 var(--smg-sp-16); box-sizing: border-box;
                border-bottom: 1px solid var(--smg-w-08);
            }
            .smg-alpop-title { display: flex; align-items: center; gap: var(--smg-sp-8); margin-right: auto; font-size: var(--smg-fs-16); font-weight: 800; color: var(--smg-tx); }
            .smg-alpop-n { padding: var(--smg-sp-2) var(--smg-sp-8); border-radius: var(--smg-badge-r); font-size: var(--smg-fs-11); font-weight: 800; font-variant-numeric: tabular-nums; background: var(--smg-link-soft); color: var(--smg-link); }
            .smg-alpop-n[hidden] { display: none; }
            .smg-alpop-acts { display: flex; align-items: center; gap: var(--smg-sp-6); }
            .smg-alpop-btn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; padding: 0; border: 0; border-radius: var(--smg-btn-r); background: var(--smg-w-06); color: var(--smg-w-72); cursor: pointer; appearance: none; transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease; }
            .smg-alpop-btn:hover { background: var(--smg-w-12); color: var(--smg-tx); }
            .smg-alpop-btn[data-busy] { opacity: .45; pointer-events: none; }
            .smg-alpop-btn svg, .smg-alpop-btn svg * { width: 16px; height: 16px; fill: none !important; stroke: currentColor !important; stroke-width: 2px !important; }
            #smg-alpop.smg-alpop--refreshing .smg-alpop-refresh svg { animation: smg-alpop-spin .9s linear infinite; }
            @keyframes smg-alpop-spin { to { transform: rotate(360deg); } }
            .smg-alpop-body { flex: 1 1 auto; min-height: 0; max-height: none !important; margin: 0 !important; overflow-y: auto; overscroll-behavior: contain; }
            .smg-alpop-list { list-style: none; margin: 0; padding: 0; }
            .smg-alpop-skel-row { min-height: 74px; border-bottom: 1px solid var(--smg-w-08); }
            .smg-alpop-status { padding: var(--smg-sp-16) var(--smg-sp-14) var(--smg-sp-24); text-align: center; font-size: var(--smg-fs-13); color: var(--smg-w-40); }
            .smg-alpop-status--busy { color: var(--smg-w-55); }
            .smg-alpop-foot { flex: 0 0 auto; display: flex; justify-content: flex-start; padding: var(--smg-sp-8) var(--smg-sp-10); border-top: 1px solid var(--smg-w-08); }
            .smg-alpop-foot a { padding: var(--smg-sp-6) var(--smg-sp-10); border-radius: var(--smg-r-8); color: var(--smg-w-60); font-size: var(--smg-fs-13); font-weight: 600; text-decoration: none; }
            .smg-alpop-foot a:hover { background: var(--smg-w-10); color: var(--smg-tx); }
            .smg-tb-bellbtn.active { color: var(--smg-link); }
            .smg-alpop-scrim { display: none; }
            .smg-alpop-handle { display: none; }
            @media (max-width: 600px) {
                #smg-alpop { top: auto !important; right: 0 !important; bottom: 0; left: 0 !important; width: 100% !important; height: var(--smg-drawer-half); max-height: var(--smg-drawer-full); z-index: var(--smg-z-sheet-1); border: 0; border-top: 1px solid var(--smg-w-10); border-radius: var(--smg-sheet-r) var(--smg-sheet-r) 0 0; background: var(--smg-s1); box-shadow: var(--smg-sheet-shadow); transition: height var(--smg-dur-30) cubic-bezier(.2,.8,.3,1), transform var(--smg-dur-30) cubic-bezier(.2,.8,.3,1); }
                #smg-alpop.is-full { height: var(--smg-drawer-full); }
                .smg-alpop-handle { display: block; margin: var(--smg-sp-8) auto 0; }
                .smg-alpop-scrim.open { display: block; position: fixed; inset: 0; z-index: var(--smg-z-sheet); background: var(--smg-k-55); -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); }
                .smg-tb-bellbtn { display: none !important; }
                .smg-alpop-head { min-height: 52px; }
                .smg-alpop-foot { padding-bottom: calc(var(--smg-sp-8) + env(safe-area-inset-bottom)); }
            }
        `;
