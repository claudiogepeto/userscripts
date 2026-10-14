    // ── CSS: mobile bar, dock, bottom sheet and goto popover ──
    const CSS_DOCK = `
            /* Mobile: fixed topbar with one height (matching the bottom navbar). Threads swap
               in the context shell; other pages keep the logo and actions. */
            @media (max-width: 600px) {
                :root { --smg-mobile-topbar-h: 54px; }
                #smg-topbar-wrap {
                    position: fixed !important; top: 0; left: 0; right: 0; width: 100%;
                    height: calc(var(--smg-mobile-topbar-h) + env(safe-area-inset-top));
                    padding-top: env(safe-area-inset-top); box-sizing: border-box;
                    z-index: 1000;
                }
                #smg-topbar {
                    height: var(--smg-mobile-topbar-h); border-bottom-color: rgba(255,255,255,0.08);
                }
                #smg-tb-inner {
                    display: flex; width: 100%; max-width: none; height: var(--smg-mobile-topbar-h);
                    padding: 0 12px; gap: 8px; justify-content: space-between;
                }
                .smg-tb-left { flex: 1 1 auto; min-width: 0; gap: 0; }
                .smg-tb-logo { height: 40px; min-width: 0; max-width: 100%; margin-right: 0; }
                .smg-tb-logo img { height: 30px; max-width: 100%; }
                .smg-logo-word { font-size: 22px; }
                .smg-tb-center { display: none; }
                .smg-tb-actions { display: flex !important; flex: 0 0 auto; gap: 2px; }
                .smg-tb-actions > * { display: none !important; }
                .smg-tb-actions > .smg-tb-searchbtn,
                .smg-tb-actions > .smg-tb-account,
                html.smg-guest .smg-tb-actions > .smg-tb-loginbtn { display: inline-flex !important; }
                .smg-tb-act, .smg-tb-account { width: 44px; height: 44px; }
                .smg-tb-act svg { width: 21px; height: 21px; }
                html.smg-topbar-on body { padding-top: calc(var(--smg-mobile-topbar-h) + env(safe-area-inset-top)) !important; }
                html.smg-topbar-on :target { scroll-margin-top: calc(var(--smg-mobile-topbar-h) + env(safe-area-inset-top)); }

                /* Thread no mobile: topbar fixa completamente removida (no topo ficam apenas as infos da thread e os avisos) */
                html.smg-thread #smg-topbar-wrap,
                html.smg-thread .smg-mobile-threadbar {
                    display: none !important;
                }
                html.smg-thread.smg-topbar-on body {
                    padding-top: max(0px, env(safe-area-inset-top)) !important;
                }
                html.smg-thread.smg-topbar-on :target {
                    scroll-margin-top: 10px !important;
                }
                html.smg-thread #smg-tb-inner { display: none !important; }
                .smg-mobile-threadbar-back {
                    width: 44px; height: 44px; padding: 0; border: 0; border-radius: 999px;
                    display: inline-flex; align-items: center; justify-content: center;
                    background: transparent; color: rgba(255,255,255,0.95); cursor: pointer;
                    -webkit-tap-highlight-color: transparent; touch-action: manipulation;
                    transition: background .14s ease, transform .12s ease;
                }
                .smg-mobile-threadbar-back:hover { background: rgba(255,255,255,0.09); }
                .smg-mobile-threadbar-back:active { transform: scale(.91); }
                .smg-mobile-threadbar-back svg {
                    display: block; width: 23px; height: 23px; fill: none !important;
                    stroke: currentColor !important; stroke-width: 2 !important;
                }
                .smg-mobile-threadbar-title {
                    display: flex; align-items: center; justify-content: center; gap: 5px;
                    min-width: 0; width: 100%; overflow: hidden; white-space: nowrap;
                    color: #fff; font-size: 15px; font-weight: 750; line-height: 1.2;
                    text-align: center; letter-spacing: -.01em;
                }
                /* Prefixos copiados do título nativo continuam compactos e mantêm a cor
                   própria (Twitch, Patreon, etc.) sem empurrar o texto para outra linha. */
                .smg-mobile-threadbar-title > .label,
                .smg-mobile-threadbar-title > .prefix,
                .smg-mobile-threadbar-title > [class*="label--"],
                .smg-mobile-threadbar-title > [class*="prefix--"] {
                    position: static !important; display: inline-flex !important; align-items: center;
                    justify-content: center; flex: 0 0 auto; max-width: 42%; height: 20px;
                    min-height: 20px; padding: 0 7px !important; margin: 0 !important;
                    border-radius: 6px !important; font-size: 10px !important;
                    font-weight: 800 !important; line-height: 1 !important; letter-spacing: .02em;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    pointer-events: none; cursor: default !important; box-sizing: border-box;
                }
                .smg-mobile-threadbar-title-text {
                    display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .smg-mobile-threadbar-end { width: 44px; height: 44px; }

            }
            @media (max-width: 480px) {
            }

            /* no desktop a navegação principal vive na topbar; some da dock (mantém engrenagem + ações).
               no mobile esses botões continuam (viram a navbar inferior) */

            @media (min-width: 601px) {
                #smg-nav-home, #smg-nav-discover, #smg-nav-timeline, #smg-thread-search,
                #smg-nav-bell, #smg-nav-user, #smg-mobile-page-btn, #smg-thread-view-mode { display: none !important; }
                .smg-dock-thread-bar { display: none !important; }
                /* a engrenagem foi pra ESQUERDA → o grupo central (só nav, escondida no desktop) fica vazio: some ele + o divisor seguinte */
                #smg-post-nav-panel > .smg-nav-center,
                #smg-post-nav-panel > .smg-nav-center + .smg-nav-divider { display: none !important; }
                /* páginas sem ações (sobraria só a engrenagem): esconde a dock inteira no desktop */
                #smg-post-nav-wrapper.smg-dock-baronly { display: none !important; }
                #smg-post-nav-wrapper.smg-dock-baronly.smg-dock-show { display: block !important; }   /* reaberta pelo FAB */
                html.smg-threadlist:not(.smg-thread) #smg-post-nav-wrapper.smg-dock-as-list { display: block !important; }
            }
            /* FAB de configurações (canto inferior direito) — só é criado nas páginas baronly (JS),
               então é inline-flex por padrão; escondemos no mobile (navbar já tem a engrenagem) e quando a dock é reaberta */
            #smg-settings-fab {
                position: fixed; right: 18px; bottom: 18px; z-index: 999990;
                width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--smg-bd);
                background: var(--smg-s1); color: rgba(255,255,255,0.72); cursor: pointer;
                display: inline-flex; align-items: center; justify-content: center;
                box-shadow: 0 6px 20px rgba(0,0,0,0.45); transition: color .14s ease, background .14s ease, transform .12s ease;
            }
            #smg-settings-fab .smg-nav-ico { font-size: 21px; }   /* o svg é 1em → gear de 21px, igual a dock (com fill:none) */
            #smg-settings-fab:hover { color: #fff; background: var(--smg-s2); }
            #smg-settings-fab:active { transform: scale(0.92); }
            #smg-post-nav-wrapper.smg-dock-show ~ #smg-settings-fab { display: none !important; }
            @media (max-width: 600px) { #smg-settings-fab { display: none !important; } }   /* mobile: a navbar inferior já tem a engrenagem */
            /* filtro/ordem/grade da LISTA existem sempre (a dock nasce uma vez). Só aparecem numa listagem. */
            html:not(.smg-threadlist) #smg-list-filter,
            html:not(.smg-threadlist) #smg-list-sort,
            html:not(.smg-threadlist) #smg-view-toggle,
            html:not(.smg-threadlist) #smg-list-filter-m,
            html:not(.smg-threadlist) #smg-list-sort-m,
            html:not(.smg-threadlist) #smg-view-toggle-m { display: none !important; }
            html.smg-thread #smg-list-filter,
            html.smg-thread #smg-list-sort,
            html.smg-thread #smg-view-toggle,
            html.smg-thread #smg-list-filter-m,
            html.smg-thread #smg-list-sort-m,
            html.smg-thread #smg-view-toggle-m { display: none !important; }
            html:not(.smg-thread) #smg-post-sort-toggle,
            html:not(.smg-thread) #smg-thread-watch,
            html:not(.smg-thread) #smg-thread-view-mode { display: none !important; }
            #smg-mobile-page-btn.is-off { display: none !important; }

            /* ---- dock: container ---- */
            #smg-post-nav-wrapper {
                position: fixed;
                left: 50%;
                bottom: 20px;
                transform: translateX(-50%);
                z-index: 999999;
            }
            #smg-post-nav-panel {
                position: relative;
                z-index: 12; /* acima dos popovers (z 11) p/ os tooltips do hover aparecerem */
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 5px;
                padding: 9px 10px;
                border-radius: 999px;
                background: rgba(26, 26, 26, 0.95); /* PERF: bg quase-opaco no lugar do backdrop-filter (blur 22px re-amostrava a página a CADA frame de scroll — dock fixa sobre a thread; mesmo fix já aplicado na topbar/feed) */
                border: 1px solid rgba(255,255,255,0.09);
                box-shadow:
                    inset 0 1px 0 rgba(255,255,255,0.08),
                    0 12px 34px rgba(0,0,0,0.5),
                    0 2px 8px rgba(0,0,0,0.35);
                transition: transform .3s cubic-bezier(.2,.8,.3,1), opacity .3s ease;
            }
            #smg-post-nav-wrapper.manual-hidden #smg-post-nav-panel {
                transform: translateY(230%);
                opacity: 0;
                pointer-events: none;
            }
            .smg-nav-group {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 5px;
            }
            .smg-nav-divider {
                width: 1px;
                height: 28px;
                margin: 0 6px;
                flex: 0 0 auto;
                background: linear-gradient(180deg, transparent, rgba(255,255,255,0.22) 50%, transparent);
            }

            /* botão que abre o sheet — escondido no desktop, aparece no mobile */
            #smg-dock-sheet-btn { display: none; }

            /* ---- bottom sheet de opções (mobile) ---- */
            #smg-sheet { position: fixed; inset: 0; z-index: 1000000; display: none; opacity: 0; background: rgba(0,0,0,0.5); -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); transition: opacity .2s ease; }
            #smg-sheet.open { display: block; opacity: 1; }
            .smg-sheet-panel {
                position: absolute; left: 0; right: 0; bottom: 0;
                padding: 10px 16px calc(20px + env(safe-area-inset-bottom));
                /* o painel NÃO rola: quem rola é o .smg-sheet-body. Com o overflow aqui, a alça
                   (grip) subia junto com a lista e o gesto de arrastar-pra-fechar sumia. dvh pelo
                   mesmo motivo do sheet da topbar. */
                max-height: 82vh; max-height: 82dvh;
                display: flex; flex-direction: column; overflow: hidden;
                background: var(--smg-s1);
                border-radius: 20px 20px 0 0;
                border-top: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 -12px 44px rgba(0,0,0,0.62);
                transform: translateY(100%);
                transition: transform .28s cubic-bezier(.2,.8,.3,1);
            }
            #smg-sheet.open .smg-sheet-panel { transform: translateY(0); }
            .smg-sheet-grip { width: 40px; height: 5px; border-radius: 999px; background: rgba(255,255,255,0.25); margin: 4px auto 14px; flex: none; }
            .smg-sheet-body { overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
            .smg-sheet-title { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,0.45); margin: 18px 4px 12px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.07); }
            .smg-sheet-body > .smg-sheet-title:first-child { margin-top: 2px; padding-top: 0; border-top: none; }
            .smg-sheet-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px 6px; }
            /* item = coluna transparente: botão CIRCULAR (mesma linguagem do dock desktop) + label embaixo */
            .smg-sheet-item { display: flex; flex-direction: column; align-items: center; gap: 7px; padding: 0; border: 0; background: transparent; color: #fff; cursor: pointer; -webkit-tap-highlight-color: transparent; }
            .smg-sheet-item.smg-sheet-disabled { opacity: .32; pointer-events: none; }
            .smg-sheet-ico {
                width: 46px; height: 46px; border-radius: 50%; box-sizing: border-box;
                display: flex; align-items: center; justify-content: center;
                border: 1px solid rgba(255,255,255,0.09); background: rgba(255,255,255,0.05);
                color: rgba(255,255,255,0.95); font-size: 20px; line-height: 1;
                transition: background .15s ease, border-color .15s ease, transform .12s ease;
            }
            .smg-sheet-ico svg { width: 1em; height: 1em; fill: none !important; }
            .smg-sheet-item:active .smg-sheet-ico { transform: scale(0.9); background: rgba(255,255,255,0.14); }
            /* estado ativo — espelha o .smg-active do dock (watch on, filtro on, etc.) */
            .smg-sheet-item.smg-active .smg-sheet-ico { background: var(--smg-link-strong); border-color: var(--smg-link-strong); color: #fff; }
            .smg-sheet-lbl { font-size: 10.5px; line-height: 1.2; text-align: center; color: rgba(255,255,255,0.7); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

            /* ---- dock: botões circulares (icon-only) ---- */
            .smg-nav-btn {
                position: relative;
                width: 44px;
                height: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                border: 1px solid rgba(255,255,255,0.07);
                background: rgba(255,255,255,0.045);
                color: rgba(255,255,255,0.95);
                box-sizing: border-box;
                text-decoration: none;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                transition: transform .18s cubic-bezier(.2,.8,.3,1), background .16s ease, color .16s ease, border-color .16s ease, box-shadow .16s ease;
            }
            .smg-nav-ico {
                position: relative;   /* âncora do badge reativo (alertas) */
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 22px;
                height: 22px;
                font-size: var(--smg-btn-fs, 20px);
                line-height: 1;
                filter: drop-shadow(0 1px 2px rgba(0,0,0,0.6));
            }
            /* badge reativo na dock/navbar (contador de alertas) */
            .smg-nav-badge {
                position: absolute; top: -6px; right: -9px; z-index: 2;
                min-width: 16px; height: 16px; padding: 0 4px; box-sizing: border-box;
                border-radius: 999px; background: #e0245e; color: #fff;
                font-size: 10px; font-weight: 700; line-height: 1;
                display: flex; align-items: center; justify-content: center;
                font-variant-numeric: tabular-nums; pointer-events: none;
            }
            /* o CSS do fórum sobrescreve o atributo fill="none" e "enche" os SVGs;
               força outline em todos (o ponto do sino tem fill próprio e sobrevive) */
            .smg-nav-ico svg {
                width: 20px;
                height: 20px;
                fill: none !important;
                display: block;
                margin: 0 auto;
            }
            .smg-nav-btn:not(:disabled):hover {
                background: rgba(255,255,255,0.13);
                color: #fff;
                border-color: rgba(255,255,255,0.2);
                transform: translateY(-4px) scale(1.07);
                box-shadow: 0 10px 20px rgba(0,0,0,0.45);
            }
            .smg-nav-btn:not(:disabled):active {
                transform: translateY(-1px) scale(0.96);
            }
            .smg-nav-btn:disabled {
                opacity: 0.3;
                cursor: default;
            }

            /* ---- dock: tooltip (label só no hover) ---- */
            .smg-nav-btn[data-label]::after,
            #smg-dock-handle[data-label]::after {
                content: attr(data-label);
                position: absolute;
                bottom: calc(100% + 12px);
                left: 50%;
                transform: translateX(-50%) translateY(5px);
                padding: 5px 9px;
                border-radius: 8px;
                background: rgba(20,21,25,0.97);
                color: #fff;
                font-size: 12px;
                font-weight: 500;
                line-height: 1;
                white-space: nowrap;
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 8px 22px rgba(0,0,0,0.5);
                opacity: 0;
                pointer-events: none;
                transition: opacity .18s ease, transform .18s ease;
                z-index: 9999;
            }
            .smg-nav-btn[data-label]:not(:disabled):hover::after,
            #smg-dock-handle[data-label]:not(:disabled):hover::after {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }

            /* ---- dock: botão com label VISÍVEL (pílula) — ex.: sort mostrando "Data"/"Reações" nas 2 docks ---- */
            .smg-nav-btn.smg-nav-labeled { width: auto !important; height: 44px !important; border-radius: 22px !important; padding: 0 14px 0 12px !important; gap: 6px; }
            .smg-nav-btn-text { font-size: 13px; font-weight: 600; white-space: nowrap; letter-spacing: .01em; line-height: 1; }

            /* ---- dock: handle/aba pra reabrir quando oculta ---- */
            #smg-dock-handle {
                display: none;
                position: absolute;
                left: 50%;
                bottom: 0;
                transform: translateX(-50%);
                width: 60px;
                height: 28px;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                border: 1px solid rgba(255,255,255,0.12);
                background: var(--smg-s2);
                color: rgba(255,255,255,0.9);
                font-size: 16px;
                cursor: pointer;
                box-shadow:
                    inset 0 1px 0 rgba(255,255,255,0.1),
                    0 10px 26px rgba(0,0,0,0.55);
                transition: transform .2s cubic-bezier(.2,.8,.3,1), color .15s ease, background .15s ease, border-color .15s ease, box-shadow .15s ease;
            }
            #smg-dock-handle:hover {
                color: #fff;
                background: var(--smg-s3);
                border-color: rgba(255,255,255,0.22);
                transform: translateX(-50%) translateY(-3px);
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 14px 30px rgba(0,0,0,0.6);
            }
            #smg-dock-handle:active {
                transform: translateX(-50%) translateY(-1px) scale(0.97);
            }
            #smg-post-nav-wrapper.manual-hidden #smg-dock-handle {
                display: flex;
            }

            /* ---- goto: número da página dentro do botão (thread + galeria) ---- */
            #smg-post-goto, #smg-gal-goto {
                border-radius: 12px !important; /* rounded-2xl */
                min-width: 64px !important;
                height: 34px !important;
                padding: 0 10px !important;
            }
            #smg-post-goto .smg-nav-ico,
            #smg-gal-goto .smg-nav-ico {
                font-size: 13px !important;
                font-weight: 700 !important;
                letter-spacing: 0 !important;
                white-space: nowrap !important;
            }

            /* ---- goto: popover de pular pra uma página ---- */
            #smg-goto-pop {
                position: absolute;
                bottom: calc(100% + 12px);
                left: 50%;
                transform: translateX(-50%) translateY(6px);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 11px;
                min-width: 232px;
                padding: 16px 18px;
                border-radius: 18px;
                background: var(--smg-s1);
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 44px rgba(0,0,0,0.62);
                backdrop-filter: blur(20px) saturate(170%);
                -webkit-backdrop-filter: blur(20px) saturate(170%);
                visibility: hidden;
                opacity: 0;
                pointer-events: none;
                transition: opacity .18s ease, transform .18s ease, visibility .18s;
                z-index: 11;
            }
            #smg-post-nav-wrapper.goto-open #smg-goto-pop {
                visibility: visible;
                opacity: 1;
                pointer-events: auto;
                transform: translateX(-50%) translateY(0);
            }
            .smg-goto-title {
                font-size: 11px;
                font-weight: 600;
                letter-spacing: .06em;
                text-transform: uppercase;
                color: rgba(255,255,255,0.55);
            }
            .smg-goto-stepper {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .smg-goto-step {
                flex: 0 0 auto;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 11px;
                border: 1px solid rgba(255,255,255,0.14);
                background: rgba(255,255,255,0.07);
                color: #fff;
                font-size: 22px;
                line-height: 1;
                cursor: pointer;
                user-select: none;
                transition: background .15s ease, border-color .15s ease, transform .12s ease;
            }
            .smg-goto-step:hover {
                background: rgba(255,255,255,0.16);
                border-color: rgba(255,255,255,0.28);
            }
            .smg-goto-step:active {
                transform: scale(0.9);
            }
            .smg-goto-input {
                width: 78px;
                height: 40px;
                padding: 0 8px;
                border-radius: 11px;
                border: 1px solid rgba(255,255,255,0.16);
                background: rgba(255,255,255,0.07);
                color: #fff;
                font-size: 19px;
                font-weight: 700;
                text-align: center;
                outline: none;
                font-variant-numeric: tabular-nums;
                -moz-appearance: textfield;
                appearance: textfield;
                transition: border-color .15s ease, background .15s ease;
            }
            /* esconde os spinners nativos (usamos os botões − / +) */
            .smg-goto-input::-webkit-outer-spin-button,
            .smg-goto-input::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
            .smg-goto-input:focus {
                border-color: rgba(255,255,255,0.45);
                background: rgba(255,255,255,0.1);
            }
            .smg-goto-max {
                font-size: 12px;
                color: rgba(255,255,255,0.5);
                white-space: nowrap;
            }
            .smg-goto-btn {
                width: 100%;
                padding: 10px 0;
                border-radius: 11px;
                border: 1px solid rgba(255,255,255,0.16);
                background: rgba(255,255,255,0.13);
                color: #fff;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: background .15s ease, border-color .15s ease, transform .12s ease;
            }
            .smg-goto-btn:hover {
                background: rgba(255,255,255,0.22);
                border-color: rgba(255,255,255,0.3);
            }
            .smg-goto-btn:active {
                transform: scale(0.98);
            }
`;