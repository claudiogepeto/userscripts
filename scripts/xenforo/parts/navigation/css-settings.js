    // ── CSS: settings panel ──
    const CSS_SETTINGS = `
            /* ===== painel de settings (estilo painel do Twitter): header + busca + rail de categorias + seções + footer ===== */
            #smg-settings-pop { width: 460px; max-height: 86vh; padding: 0 !important; gap: 0 !important; overflow: hidden; }
            #smg-settings-pop .smg-set-body { min-height: 0; }
            .smg-set-head { display: flex; align-items: center; gap: 10px; padding: 14px 16px 12px; border-bottom: 1px solid rgba(255,255,255,0.08); }
            .smg-set-logo { flex: 0 0 auto; width: 30px; height: 30px; border-radius: 9px; background: var(--smg-link, #ff77b2); display: flex; align-items: center; justify-content: center; }
            .smg-set-logo svg { width: 17px; height: 17px; fill: none !important; color: #fff; }
            .smg-set-title { flex: 1; min-width: 0; font-size: 16px; font-weight: 800; color: #fff; }
            .smg-set-x { flex: 0 0 auto; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 8px; background: transparent; color: rgba(255,255,255,0.55); cursor: pointer; }
            .smg-set-x:hover { background: rgba(255,255,255,0.12); color: #fff; }
            .smg-set-x svg { width: 16px; height: 16px; fill: none !important; }
            .smg-set-search { display: flex; align-items: center; gap: 8px; margin: 11px 14px; padding: 8px 12px; border-radius: 999px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); }
            .smg-set-search:focus-within { border-color: var(--smg-link, #ff77b2); }
            .smg-set-searchic { flex: 0 0 auto; display: inline-flex; color: rgba(255,255,255,0.5); }
            .smg-set-searchic svg { width: 16px; height: 16px; fill: none !important; }
            .smg-set-q { flex: 1; min-width: 0; border: 0; background: transparent; outline: none; color: #fff; font: inherit; font-size: 14px; }
            .smg-set-q::placeholder { color: rgba(255,255,255,0.45); }
            .smg-set-body { display: flex; min-height: 0; flex: 1; }
            .smg-set-rail { display: flex; flex-direction: column; gap: 4px; padding: 10px 8px; border-right: 1px solid rgba(255,255,255,0.08); flex: 0 0 auto; }
            .smg-set-tab { width: 40px; height: 40px; border: 0; border-radius: 11px; display: inline-flex; align-items: center; justify-content: center; background: transparent; color: rgba(255,255,255,0.5); cursor: pointer; transition: background .14s ease, color .14s ease; }
            .smg-set-tab svg { width: 20px; height: 20px; fill: none !important; }
            .smg-set-tab:hover { background: rgba(255,255,255,0.07); color: #fff; }
            .smg-set-tab.active { background: var(--smg-link-soft, rgba(255,119,178,0.16)); color: var(--smg-link, #ff77b2); }
            .smg-set-content { flex: 1; min-width: 0; overflow-y: auto; max-height: 58vh; padding: 2px 10px 12px; }
            .smg-set-sectitle { font-size: 10.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,0.45); padding: 12px 6px 6px; }
            .smg-set-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; padding: 9px 6px; border-radius: 9px; cursor: pointer; }
            .smg-set-row:hover { background: rgba(255,255,255,0.05); }
            .smg-set-text { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
            .smg-set-label { font-size: 13.5px; font-weight: 600; color: rgba(255,255,255,0.92); line-height: 1.3; }
            .smg-set-desc { font-size: 11.5px; color: rgba(255,255,255,0.5); line-height: 1.4; }
            .smg-set-row .smg-switch { margin-top: 1px; }
            .smg-switch { position: relative; flex: 0 0 auto; width: 40px; height: 23px; border-radius: 999px; background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.12); transition: background .16s ease; }
            .smg-switch::after { content: ""; position: absolute; top: 2px; left: 2px; width: 17px; height: 17px; border-radius: 50%; background: #fff; transition: transform .18s cubic-bezier(.2,.8,.3,1); box-shadow: 0 1px 3px rgba(0,0,0,.4); }
            .smg-set-row input { position: absolute; opacity: 0; pointer-events: none; }
            .smg-set-row input:checked + .smg-switch { background: var(--smg-link, #ff77b2); border-color: var(--smg-link, #ff77b2); }
            .smg-set-row input:checked + .smg-switch::after { transform: translateX(17px); }
            .smg-set-slider { display: flex; flex-direction: column; gap: 9px; padding: 11px 6px; }
            .smg-set-slidertop { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
            .smg-set-val { flex: 0 0 auto; color: var(--smg-link, #ff77b2); font-weight: 700; background: var(--smg-link-soft, rgba(255,119,178,0.12)); border-radius: 6px; padding: 1px 8px; font-size: 13px; min-width: 38px; text-align: center; font-variant-numeric: tabular-nums; }
            .smg-set-slider input[type=range] { width: 100%; accent-color: var(--smg-link, #ff77b2); cursor: pointer; }
            .smg-set-action-card {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 10px 8px;
                border-radius: 10px;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.06);
                margin-top: 6px;
            }
            .smg-set-action-card:hover {
                background: rgba(255,255,255,0.05);
                border-color: rgba(255,255,255,0.1);
            }
            .smg-set-btn-danger {
                flex: 0 0 auto;
                padding: 6px 12px;
                border-radius: 8px;
                border: 1px solid rgba(244,63,94,0.3);
                background: rgba(244,63,94,0.12);
                color: #fb7185;
                font: inherit;
                font-size: 12.5px;
                font-weight: 700;
                cursor: pointer;
                transition: background .12s, border-color .12s, color .12s;
            }
            .smg-set-btn-danger:hover {
                background: rgba(244,63,94,0.22);
                border-color: rgba(244,63,94,0.5);
                color: #fff;
            }
            .smg-set-btn-danger:active {
                transform: scale(0.96);
            }
            .smg-set-empty { padding: 30px 16px; text-align: center; color: rgba(255,255,255,0.45); font-size: 13.5px; }
            .smg-set-foot { display: flex; align-items: center; gap: 10px; padding: 11px 16px; border-top: 1px solid rgba(255,255,255,0.08); }
            .smg-set-reset { border: 0; background: transparent; color: rgba(255,255,255,0.55); font: inherit; font-size: 13px; font-weight: 600; padding: 5px 9px; border-radius: 7px; cursor: pointer; }
            .smg-set-reset:hover { color: #fb7185; background: rgba(244,63,94,0.1); }
            .smg-set-reload { border: 1px solid var(--smg-bd2); background: var(--smg-s3); color: #fff; font: inherit; font-size: 13px; font-weight: 600; padding: 6px 12px; border-radius: 9px; cursor: pointer; }
            .smg-set-reload:hover { filter: brightness(1.12); }
            .smg-set-ver { margin-left: auto; color: rgba(255,255,255,0.35); font-size: 12px; }

            /* ---- backdrop dos popovers do dock (vira o scrim do bottom sheet no mobile) ---- */
            .smg-dock-backdrop {
                position: fixed; inset: 0; z-index: 15;
                background: var(--smg-scrim);
                -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
                opacity: 0; visibility: hidden; pointer-events: none;
                transition: opacity .22s ease, visibility .22s;
            }

            `;
