    // ── CSS: header notices and the account dialog ──
    const CSS_NOTICES = `
            /* ========================================================= */
            /* AVISOS / NOTICES COLLAPSE                                 */
            /* ========================================================= */
            .smg-notices-collapse {
                margin: var(--smg-sp-16) 0 !important;
                border-radius: var(--smg-r-14) !important;
                background: var(--smg-s1) !important;
                border: 1px solid var(--smg-w-08) !important;
                box-shadow: var(--smg-shadow-2) !important;
                overflow: hidden !important;
                transition: background var(--smg-dur-20) ease, border-color var(--smg-dur-20) ease, opacity var(--smg-dur-30) ease, transform var(--smg-dur-30) ease !important;
            }
            .smg-notices-collapse:hover {
                border-color: var(--smg-w-14) !important;
            }
            .smg-notices-collapse-head {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                padding: var(--smg-sp-10) var(--smg-sp-14) !important;
                cursor: pointer !important;
                user-select: none !important;
                background: transparent !important;
                transition: background var(--smg-dur-15) ease !important;
            }
            .smg-notices-collapse-head:hover {
                background: var(--smg-w-04) !important;
            }
            .smg-notices-collapse-left {
                display: flex !important;
                align-items: center !important;
                gap: var(--smg-sp-10) !important;
                min-width: 0 !important;
            }
            .smg-notices-collapse-ico {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                color: var(--smg-link) !important;
                font-size: var(--smg-fs-16) !important;
                flex-shrink: 0 !important;
            }
            .smg-notices-collapse-title {
                font-size: var(--smg-fs-14) !important;
                font-weight: 700 !important;
                letter-spacing: 0.01em !important;
                color: var(--smg-w-95) !important;
            }
            .smg-notices-collapse-badge {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                min-width: 18px !important;
                height: 18px !important;
                padding: 0 var(--smg-sp-6) !important;
                border-radius: var(--smg-badge-r) !important;
                font-size: var(--smg-fs-11) !important;
                font-weight: 700 !important;
                background: var(--smg-link) !important;
                color: #fff !important;
                line-height: 1 !important;
            }
            .smg-notices-collapse-right {
                display: flex !important;
                align-items: center !important;
                gap: var(--smg-sp-6) !important;
                flex-shrink: 0 !important;
            }
            .smg-notices-collapse-chevron {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: var(--smg-fs-16) !important;
                color: var(--smg-w-50) !important;
                transition: transform var(--smg-dur-30) cubic-bezier(0.4, 0, 0.2, 1), color var(--smg-dur-15) ease !important;
            }
            .smg-notices-collapse.is-expanded .smg-notices-collapse-chevron {
                transform: rotate(180deg) !important;
                color: var(--smg-w-85) !important;
            }
            .smg-notices-collapse-dismiss {
                background: var(--smg-w-06) !important;
                border: none !important;
                width: 24px !important;
                height: 24px !important;
                border-radius: var(--smg-r-round) !important;
                color: var(--smg-w-50) !important;
                cursor: pointer !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: var(--smg-fs-13) !important;
                padding: 0 !important;
                transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease, transform var(--smg-dur-12) ease !important;
            }
            .smg-notices-collapse-dismiss:hover {
                background: var(--smg-w-14) !important;
                color: #fff !important;
                transform: scale(1.08) !important;
            }
            .smg-notices-collapse-body {
                display: flex !important;
                flex-direction: column !important;
                gap: var(--smg-sp-6) !important;
                padding: var(--smg-sp-6) var(--smg-sp-12) var(--smg-sp-10) !important;
                border-top: 1px solid var(--smg-w-06) !important;
                background: var(--smg-k-25) !important;
            }
            .smg-notices-collapse-body[hidden] {
                display: none !important;
            }
            .smg-notices-collapse-item {
                position: relative !important;
                display: flex !important;
                align-items: center !important;
                gap: var(--smg-sp-10) !important;
                padding: var(--smg-sp-8) var(--smg-sp-12) !important;
                border-radius: var(--smg-r-10) !important;
                background: var(--smg-w-04) !important;
                border: 1px solid var(--smg-w-06) !important;
                font-size: var(--smg-fs-13) !important;
                line-height: 1.45 !important;
                color: var(--smg-w-85) !important;
                transition: opacity var(--smg-dur-20) ease, transform var(--smg-dur-20) ease !important;
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
                border-radius: var(--smg-r-4) !important;
                display: block !important;
            }
            .smg-notices-item-content {
                flex: 1 1 auto !important;
                min-width: 0 !important;
                display: flex !important;
                align-items: center !important;
                flex-wrap: wrap !important;
                gap: var(--smg-sp-6) !important;
                color: var(--smg-w-85) !important;
            }
            .smg-notices-item-content a {
                color: var(--smg-link) !important;
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
                border-radius: var(--smg-r-round) !important;
                background: transparent !important;
                border: none !important;
                color: var(--smg-w-40) !important;
                cursor: pointer !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: var(--smg-fs-12) !important;
                padding: 0 !important;
                transition: background var(--smg-dur-12) ease, color var(--smg-dur-12) ease, transform var(--smg-dur-12) ease !important;
            }
            .smg-notices-item-dismiss:hover {
                background: var(--smg-w-12) !important;
                color: #fff !important;
                transform: scale(1.08) !important;
            }
            @media (max-width: 600px) {
                .smg-notices-collapse {
                    margin: var(--smg-sp-12) 0 !important;
                    border-radius: var(--smg-r-12) !important;
                }
                .smg-notices-collapse-head {
                    padding: var(--smg-sp-8) var(--smg-sp-10) !important;
                }
                .smg-notices-collapse-title {
                    font-size: var(--smg-fs-13) !important;
                }
                .smg-notices-collapse-body {
                    padding: var(--smg-sp-6) var(--smg-sp-8) var(--smg-sp-8) !important;
                    gap: var(--smg-sp-6) !important;
                }
                .smg-notices-collapse-item {
                    padding: var(--smg-sp-6) var(--smg-sp-8) !important;
                    font-size: var(--smg-fs-12) !important;
                }
            }

            /* trava do fundo enquanto um sheet está aberto (ver smgSheetOpen). position:fixed no
               body, não overflow:hidden: no Safari iOS o overflow no html é ignorado quando já há
               scroll em curso, e a página continuava rolando atrás do sheet. O top negativo
               preserva a posição, restaurada no fechamento. */
            html.smg-sheet-lock, html.smg-sheet-lock body { overflow: hidden !important; overscroll-behavior: none; }
            html.smg-sheet-lock body { position: fixed !important; left: 0; right: 0; width: 100%; }

            /* bottom sheets (mobile) — alertas / discover / conta. mesmo conteúdo dos dropdowns da topbar */
            .smg-sheet { position: fixed; inset: 0; z-index: var(--smg-z-sheet); display: none; opacity: 0; background: var(--smg-k-55); -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); transition: opacity var(--smg-dur-20) ease; }
            .smg-sheet.open { display: block; opacity: 1; }
            .smg-sheet .smg-csheet-panel {
                position: absolute; left: 0; right: 0; bottom: 0;
                padding: var(--smg-sp-8) var(--smg-sp-14) calc(14px + env(safe-area-inset-bottom));
                /* dvh, não vh: no celular vh é a altura com a barra de URL RETRAÍDA, então o sheet
                   nascia mais alto que a tela e o rodapé ficava embaixo da barra do navegador */
                max-height: 80vh; max-height: 80dvh; display: flex; flex-direction: column;
                background: var(--smg-s1);
                border-radius: var(--smg-sheet-r) var(--smg-sheet-r) 0 0; border-top: 1px solid var(--smg-w-10);
                box-shadow: var(--smg-sheet-shadow);
                transform: translateY(100%); transition: transform var(--smg-dur-30) cubic-bezier(.2,.8,.3,1);
            }
            .smg-sheet.open .smg-csheet-panel { transform: translateY(0); }
            /* DIALOG DE TELA CHEIA (conta): mesma animação de subida, mas ocupa tudo — lista longa
               num drawer de 80vh mostrava metade e o arrasto-pra-fechar brigava com a rolagem dela */
            .smg-sheet--full .smg-csheet-panel {
                top: 0; height: 100%; max-height: none; border-radius: 0; border-top: 0;
                padding: calc(6px + env(safe-area-inset-top)) var(--smg-sp-14) calc(14px + env(safe-area-inset-bottom));
            }
            .smg-csheet-x {
                width: 40px; height: 40px; margin-right: -6px; flex: none; align-self: flex-start;
                display: inline-flex; align-items: center; justify-content: center;
                border: 0; border-radius: var(--smg-r-round); background: transparent; color: var(--smg-w-72);
                font-size: var(--smg-fs-22); cursor: pointer; -webkit-tap-highlight-color: transparent;
            }
            .smg-csheet-x:active { background: var(--smg-w-10); }
            /* uma linha só: identidade à esquerda, X no canto superior direito */
            .smg-csheet-head--id { flex-direction: row; align-items: flex-start; justify-content: space-between; gap: var(--smg-sp-12); padding: var(--smg-sp-2) 0 var(--smg-sp-14); }
            .smg-csheet-id { display: flex; align-items: center; gap: var(--smg-sp-14); padding: var(--smg-sp-2); min-width: 0; color: #fff; text-decoration: none; }
            .smg-csheet-id .avatar, .smg-csheet-id .avatar > img, .smg-csheet-id .avatar > span {
                width: 52px !important; height: 52px !important; border-radius: var(--smg-r-round) !important;
                font-size: var(--smg-fs-22) !important; line-height: 52px !important; text-align: center;
            }
            .smg-csheet-idtxt { display: flex; flex-direction: column; gap: var(--smg-sp-2); min-width: 0; }
            .smg-csheet-idtxt strong { font-size: var(--smg-fs-20); font-weight: 800; line-height: 1.2; }
            .smg-csheet-idtxt span { font-size: var(--smg-fs-13); font-weight: 600; color: var(--smg-link); }
            .smg-csheet-head { display: flex; align-items: center; justify-content: space-between; padding: var(--smg-sp-4) var(--smg-sp-4) var(--smg-sp-8); font-size: var(--smg-fs-15); font-weight: 700; color: #fff; }
            .smg-csheet-head a { font-size: var(--smg-fs-13); font-weight: 600; color: var(--smg-w-60); text-decoration: none; }
            .smg-csheet-body { overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }   /* contain = chegar no fim da lista não "vaza" o scroll pro fundo */
            /* sheets (mobile): cabeçalho maior que o dropdown do desktop */
            .smg-sheet .smg-csheet-head { font-size: var(--smg-fs-18); padding: var(--smg-sp-6) var(--smg-sp-6) var(--smg-sp-12); }
            .smg-sheet .smg-csheet-head a { font-size: var(--smg-fs-14); }
`;