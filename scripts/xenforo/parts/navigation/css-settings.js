    // ── CSS: settings panel ──
    const CSS_SETTINGS = `
            /* ===== painel de settings (estilo painel do Twitter): header + busca + rail de categorias + seções + footer ===== */
            #smg-settings-pop { width: 460px; max-height: 86vh; padding: 0 !important; gap: 0 !important; overflow: hidden; }
            #smg-settings-pop .smg-set-body { min-height: 0; }
            .smg-set-head { display: flex; align-items: center; gap: var(--smg-sp-10); padding: var(--smg-sp-14) var(--smg-sp-16) var(--smg-sp-12); border-bottom: 1px solid var(--smg-w-08); }
            .smg-set-logo { flex: 0 0 auto; width: 30px; height: 30px; border-radius: var(--smg-r-10); background: var(--smg-link); display: flex; align-items: center; justify-content: center; }
            .smg-set-logo svg { width: 17px; height: 17px; fill: none !important; color: #fff; }
            .smg-set-title { flex: 1; min-width: 0; font-size: var(--smg-fs-16); font-weight: 800; color: #fff; }
            .smg-set-x { flex: 0 0 auto; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: var(--smg-r-8); background: transparent; color: var(--smg-w-55); cursor: pointer; }
            .smg-set-x:hover { background: var(--smg-w-12); color: #fff; }
            .smg-set-x svg { width: 16px; height: 16px; fill: none !important; }
            .smg-set-search { display: flex; align-items: center; gap: var(--smg-sp-8); margin: var(--smg-sp-12) var(--smg-sp-14); padding: var(--smg-sp-8) var(--smg-sp-12); border-radius: var(--smg-r-pill); background: var(--smg-w-06); border: 1px solid var(--smg-w-10); }
            .smg-set-search:focus-within { border-color: var(--smg-link); }
            .smg-set-searchic { flex: 0 0 auto; display: inline-flex; color: var(--smg-w-50); }
            .smg-set-searchic svg { width: 16px; height: 16px; fill: none !important; }
            .smg-set-q { flex: 1; min-width: 0; border: 0; background: transparent; outline: none; color: #fff; font: inherit; font-size: var(--smg-fs-14); }
            .smg-set-q::placeholder { color: var(--smg-w-50); }
            .smg-set-body { display: flex; min-height: 0; flex: 1; }
            .smg-set-rail { display: flex; flex-direction: column; gap: var(--smg-sp-4); padding: var(--smg-sp-10) var(--smg-sp-8); border-right: 1px solid var(--smg-w-08); flex: 0 0 auto; }
            .smg-set-tab { width: 40px; height: 40px; border: 0; border-radius: var(--smg-r-12); display: inline-flex; align-items: center; justify-content: center; background: transparent; color: var(--smg-w-50); cursor: pointer; transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease; }
            .smg-set-tab svg { width: 20px; height: 20px; fill: none !important; }
            .smg-set-tab:hover { background: var(--smg-w-08); color: #fff; }
            .smg-set-tab.active { background: var(--smg-link-soft); color: var(--smg-link); }
            .smg-set-content { flex: 1; min-width: 0; overflow-y: auto; max-height: 58vh; padding: var(--smg-sp-2) var(--smg-sp-10) var(--smg-sp-12); }
            .smg-set-sectitle { font-size: var(--smg-fs-11); font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--smg-w-50); padding: var(--smg-sp-12) var(--smg-sp-6) var(--smg-sp-6); }
            .smg-set-row { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--smg-sp-14); padding: var(--smg-sp-10) var(--smg-sp-6); border-radius: var(--smg-r-10); cursor: pointer; }
            .smg-set-row:hover { background: var(--smg-w-06); }
            .smg-set-text { display: flex; flex-direction: column; gap: var(--smg-sp-4); min-width: 0; }
            .smg-set-label { font-size: var(--smg-fs-14); font-weight: 600; color: var(--smg-w-95); line-height: 1.3; }
            .smg-set-desc { font-size: var(--smg-fs-12); color: var(--smg-w-50); line-height: 1.4; }
            .smg-set-row .smg-switch { margin-top: var(--smg-sp-2); }
            .smg-switch { position: relative; flex: 0 0 auto; width: 40px; height: 23px; border-radius: var(--smg-r-pill); background: var(--smg-w-14); border: 1px solid var(--smg-w-12); transition: background var(--smg-dur-15) ease; }
            .smg-switch::after { content: ""; position: absolute; top: 2px; left: 2px; width: 17px; height: 17px; border-radius: var(--smg-r-round); background: #fff; transition: transform var(--smg-dur-20) cubic-bezier(.2,.8,.3,1); box-shadow: var(--smg-shadow-1); }
            .smg-set-row input { position: absolute; opacity: 0; pointer-events: none; }
            .smg-set-row input:checked + .smg-switch { background: var(--smg-link); border-color: var(--smg-link); }
            .smg-set-row input:checked + .smg-switch::after { transform: translateX(17px); }
            .smg-set-slider { display: flex; flex-direction: column; gap: var(--smg-sp-10); padding: var(--smg-sp-12) var(--smg-sp-6); }
            .smg-set-slidertop { display: flex; align-items: center; justify-content: space-between; gap: var(--smg-sp-10); }
            .smg-set-val { flex: 0 0 auto; color: var(--smg-link); font-weight: 700; background: var(--smg-link-soft); border-radius: var(--smg-r-6); padding: var(--smg-sp-2) var(--smg-sp-8); font-size: var(--smg-fs-13); min-width: 38px; text-align: center; font-variant-numeric: tabular-nums; }
            .smg-set-slider input[type=range] { width: 100%; accent-color: var(--smg-link); cursor: pointer; }
            .smg-set-action-card {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: var(--smg-sp-12);
                padding: var(--smg-sp-10) var(--smg-sp-8);
                border-radius: var(--smg-r-10);
                background: var(--smg-w-04);
                border: 1px solid var(--smg-w-06);
                margin-top: var(--smg-sp-6);
            }
            .smg-set-action-card:hover {
                background: var(--smg-w-06);
                border-color: var(--smg-w-10);
            }
            .smg-set-btn-danger {
                flex: 0 0 auto;
                padding: var(--smg-sp-6) var(--smg-sp-12);
                border-radius: var(--smg-r-8);
                border: 1px solid rgba(244,63,94,0.3);
                background: rgba(244,63,94,0.12);
                color: #fb7185;
                font: inherit;
                font-size: var(--smg-fs-13);
                font-weight: 700;
                cursor: pointer;
                transition: background var(--smg-dur-12), border-color var(--smg-dur-12), color var(--smg-dur-12);
            }
            .smg-set-btn-danger:hover {
                background: rgba(244,63,94,0.22);
                border-color: rgba(244,63,94,0.5);
                color: #fff;
            }
            .smg-set-btn-danger:active {
                transform: scale(0.96);
            }
            .smg-set-empty { padding: var(--smg-sp-32) var(--smg-sp-16); text-align: center; color: var(--smg-w-50); font-size: var(--smg-fs-14); }
            .smg-set-foot { display: flex; align-items: center; gap: var(--smg-sp-10); padding: var(--smg-sp-12) var(--smg-sp-16); border-top: 1px solid var(--smg-w-08); }
            .smg-set-reset { border: 0; background: transparent; color: var(--smg-w-55); font: inherit; font-size: var(--smg-fs-13); font-weight: 600; padding: var(--smg-sp-6) var(--smg-sp-10); border-radius: var(--smg-r-8); cursor: pointer; }
            .smg-set-reset:hover { color: #fb7185; background: rgba(244,63,94,0.1); }
            .smg-set-reload { border: 1px solid var(--smg-bd2); background: var(--smg-s3); color: #fff; font: inherit; font-size: var(--smg-fs-13); font-weight: 600; padding: var(--smg-sp-6) var(--smg-sp-12); border-radius: var(--smg-r-10); cursor: pointer; }
            .smg-set-reload:hover { filter: brightness(1.12); }
            .smg-set-ver { margin-left: auto; color: var(--smg-w-40); font-size: var(--smg-fs-12); }

            /* ---- backdrop dos popovers do dock (vira o scrim do bottom sheet no mobile) ---- */
            .smg-dock-backdrop {
                position: fixed; inset: 0; z-index: var(--smg-z-15);
                background: var(--smg-scrim);
                -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
                opacity: 0; visibility: hidden; pointer-events: none;
                transition: opacity var(--smg-dur-20) ease, visibility var(--smg-dur-20);
            }

            `;
