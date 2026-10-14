    // ── CSS: header notices and the account dialog ──
    const CSS_NOTICES = `
            /* ========================================================= */
            /* AVISOS / NOTICES COLLAPSE                                 */
            /* ========================================================= */
            .smg-notices-collapse {
                margin: 16px 0 !important;
                border-radius: 14px !important;
                background: var(--smg-s1, #1a1a1a) !important;
                border: 1px solid rgba(255, 255, 255, 0.08) !important;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25) !important;
                overflow: hidden !important;
                transition: background .2s ease, border-color .2s ease, opacity .25s ease, transform .25s ease !important;
            }
            .smg-notices-collapse:hover {
                border-color: rgba(255, 255, 255, 0.14) !important;
            }
            .smg-notices-collapse-head {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                padding: 10px 14px !important;
                cursor: pointer !important;
                user-select: none !important;
                background: transparent !important;
                transition: background .15s ease !important;
            }
            .smg-notices-collapse-head:hover {
                background: rgba(255, 255, 255, 0.035) !important;
            }
            .smg-notices-collapse-left {
                display: flex !important;
                align-items: center !important;
                gap: 10px !important;
                min-width: 0 !important;
            }
            .smg-notices-collapse-ico {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                color: var(--smg-link, #ff77b2) !important;
                font-size: 16px !important;
                flex-shrink: 0 !important;
            }
            .smg-notices-collapse-title {
                font-size: 13.5px !important;
                font-weight: 700 !important;
                letter-spacing: 0.01em !important;
                color: rgba(255, 255, 255, 0.95) !important;
            }
            .smg-notices-collapse-badge {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                min-width: 18px !important;
                height: 18px !important;
                padding: 0 5px !important;
                border-radius: 999px !important;
                font-size: 11px !important;
                font-weight: 700 !important;
                background: var(--smg-link, #ff77b2) !important;
                color: #fff !important;
                line-height: 1 !important;
            }
            .smg-notices-collapse-right {
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
                flex-shrink: 0 !important;
            }
            .smg-notices-collapse-chevron {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 16px !important;
                color: rgba(255, 255, 255, 0.45) !important;
                transition: transform .25s cubic-bezier(0.4, 0, 0.2, 1), color .15s ease !important;
            }
            .smg-notices-collapse.is-expanded .smg-notices-collapse-chevron {
                transform: rotate(180deg) !important;
                color: rgba(255, 255, 255, 0.85) !important;
            }
            .smg-notices-collapse-dismiss {
                background: rgba(255, 255, 255, 0.05) !important;
                border: none !important;
                width: 24px !important;
                height: 24px !important;
                border-radius: 50% !important;
                color: rgba(255, 255, 255, 0.45) !important;
                cursor: pointer !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 13px !important;
                padding: 0 !important;
                transition: background .15s ease, color .15s ease, transform .12s ease !important;
            }
            .smg-notices-collapse-dismiss:hover {
                background: rgba(255, 255, 255, 0.15) !important;
                color: #fff !important;
                transform: scale(1.08) !important;
            }
            .smg-notices-collapse-body {
                display: flex !important;
                flex-direction: column !important;
                gap: 6px !important;
                padding: 6px 12px 10px !important;
                border-top: 1px solid rgba(255, 255, 255, 0.06) !important;
                background: rgba(0, 0, 0, 0.15) !important;
            }
            .smg-notices-collapse-body[hidden] {
                display: none !important;
            }
            .smg-notices-collapse-item {
                position: relative !important;
                display: flex !important;
                align-items: center !important;
                gap: 10px !important;
                padding: 8px 12px !important;
                border-radius: 10px !important;
                background: rgba(255, 255, 255, 0.03) !important;
                border: 1px solid rgba(255, 255, 255, 0.05) !important;
                font-size: 12.5px !important;
                line-height: 1.45 !important;
                color: rgba(255, 255, 255, 0.88) !important;
                transition: background .15s ease, border-color .15s ease, opacity .2s ease, transform .2s ease !important;
            }
            .smg-notices-collapse-item:hover {
                background: rgba(255, 255, 255, 0.05) !important;
                border-color: rgba(255, 255, 255, 0.09) !important;
            }
            .smg-notices-item-emote {
                flex-shrink: 0 !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            .smg-notices-item-emote img {
                max-height: 22px !important;
                max-width: 28px !important;
                width: auto !important;
                height: auto !important;
                border-radius: 4px !important;
                display: block !important;
            }
            .smg-notices-item-content {
                flex: 1 1 auto !important;
                min-width: 0 !important;
                display: flex !important;
                align-items: center !important;
                flex-wrap: wrap !important;
                gap: 6px !important;
                color: rgba(255, 255, 255, 0.88) !important;
            }
            .smg-notices-item-content a {
                color: var(--smg-link, #ff77b2) !important;
                font-weight: 600 !important;
                text-decoration: underline !important;
                text-underline-offset: 2px !important;
            }
            .smg-notices-item-content a:hover {
                color: #fff !important;
            }
            .smg-notices-item-dismiss {
                flex-shrink: 0 !important;
                width: 22px !important;
                height: 22px !important;
                border-radius: 50% !important;
                background: transparent !important;
                border: none !important;
                color: rgba(255, 255, 255, 0.35) !important;
                cursor: pointer !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 12px !important;
                padding: 0 !important;
                transition: background .12s ease, color .12s ease, transform .1s ease !important;
            }
            .smg-notices-item-dismiss:hover {
                background: rgba(255, 255, 255, 0.12) !important;
                color: #fff !important;
                transform: scale(1.08) !important;
            }
            @media (max-width: 600px) {
                .smg-notices-collapse {
                    margin: 12px 0 !important;
                    border-radius: 12px !important;
                }
                .smg-notices-collapse-head {
                    padding: 8px 10px !important;
                }
                .smg-notices-collapse-title {
                    font-size: 13px !important;
                }
                .smg-notices-collapse-body {
                    padding: 5px 8px 8px !important;
                    gap: 5px !important;
                }
                .smg-notices-collapse-item {
                    padding: 6px 8px !important;
                    font-size: 12px !important;
                }
            }

            /* trava do fundo enquanto um sheet está aberto (ver smgSheetOpen). position:fixed no
               body, não overflow:hidden: no Safari iOS o overflow no html é ignorado quando já há
               scroll em curso, e a página continuava rolando atrás do sheet. O top negativo
               preserva a posição, restaurada no fechamento. */
            html.smg-sheet-lock, html.smg-sheet-lock body { overflow: hidden !important; overscroll-behavior: none; }
            html.smg-sheet-lock body { position: fixed !important; left: 0; right: 0; width: 100%; }

            /* bottom sheets (mobile) — alertas / discover / conta. mesmo conteúdo dos dropdowns da topbar */
            .smg-sheet { position: fixed; inset: 0; z-index: 1000000; display: none; opacity: 0; background: rgba(0,0,0,0.5); -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); transition: opacity .2s ease; }
            .smg-sheet.open { display: block; opacity: 1; }
            .smg-sheet .smg-csheet-panel {
                position: absolute; left: 0; right: 0; bottom: 0;
                padding: 8px 14px calc(14px + env(safe-area-inset-bottom));
                /* dvh, não vh: no celular vh é a altura com a barra de URL RETRAÍDA, então o sheet
                   nascia mais alto que a tela e o rodapé ficava embaixo da barra do navegador */
                max-height: 80vh; max-height: 80dvh; display: flex; flex-direction: column;
                background: var(--smg-s1);
                border-radius: 20px 20px 0 0; border-top: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 -12px 44px rgba(0,0,0,0.62);
                transform: translateY(100%); transition: transform .28s cubic-bezier(.2,.8,.3,1);
            }
            .smg-sheet.open .smg-csheet-panel { transform: translateY(0); }
            /* DIALOG DE TELA CHEIA (conta): mesma animação de subida, mas ocupa tudo — lista longa
               num drawer de 80vh mostrava metade e o arrasto-pra-fechar brigava com a rolagem dela */
            .smg-sheet--full .smg-csheet-panel {
                top: 0; height: 100%; max-height: none; border-radius: 0; border-top: 0;
                padding: calc(6px + env(safe-area-inset-top)) 14px calc(14px + env(safe-area-inset-bottom));
            }
            .smg-csheet-x {
                width: 40px; height: 40px; margin-right: -6px; flex: none; align-self: flex-start;
                display: inline-flex; align-items: center; justify-content: center;
                border: 0; border-radius: 50%; background: transparent; color: rgba(255,255,255,0.75);
                font-size: 22px; cursor: pointer; -webkit-tap-highlight-color: transparent;
            }
            .smg-csheet-x:active { background: rgba(255,255,255,0.09); }
            /* uma linha só: identidade à esquerda, X no canto superior direito */
            .smg-csheet-head--id { flex-direction: row; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 2px 0 14px; }
            .smg-csheet-id { display: flex; align-items: center; gap: 13px; padding: 2px; min-width: 0; color: #fff; text-decoration: none; }
            .smg-csheet-id .avatar, .smg-csheet-id .avatar > img, .smg-csheet-id .avatar > span {
                width: 52px !important; height: 52px !important; border-radius: 50% !important;
                font-size: 22px !important; line-height: 52px !important; text-align: center;
            }
            .smg-csheet-idtxt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
            .smg-csheet-idtxt strong { font-size: 19px; font-weight: 800; line-height: 1.2; }
            .smg-csheet-idtxt span { font-size: 13px; font-weight: 600; color: var(--smg-link, #ff77b2); }
            .smg-csheet-head { display: flex; align-items: center; justify-content: space-between; padding: 4px 4px 8px; font-size: 15px; font-weight: 700; color: #fff; }
            .smg-csheet-head a { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.6); text-decoration: none; }
            .smg-csheet-body { overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }   /* contain = chegar no fim da lista não "vaza" o scroll pro fundo */
            /* sheets (mobile): cabeçalho maior que o dropdown do desktop */
            .smg-sheet .smg-csheet-head { font-size: 18px; padding: 6px 6px 12px; }
            .smg-sheet .smg-csheet-head a { font-size: 14px; }
`;