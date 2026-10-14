    // STYLE CONTEXT: Listing and thread filter bars
    const CSS_FILTERBAR = `/* ============================================================
               BARRA ÚNICA SEGMENTADA (filter bar) — SMG · thread + fórum
               pager · ordenar · ações numa superfície só, grupos com divisor.
               Substitui o .block-outer nativo (escondido = fonte de dados/proxy-click).
               ============================================================ */
            .smg-bar {
                display: inline-flex; align-items: stretch; flex-wrap: nowrap; vertical-align: middle;
                height: 40px; box-sizing: border-box; margin: 0 0 0 auto; max-width: 100%;  /* margin-left:auto = alinha à DIREITA */
                background: var(--smg-s1); border: 1px solid var(--smg-bd); border-radius: var(--smg-r-12); overflow: hidden;
            }
            .smg-bar-group { display: inline-flex; align-items: center; gap: var(--smg-sp-4); padding: var(--smg-sp-4) var(--smg-sp-6); min-width: 0; }
            .smg-bar-div { flex: 0 0 1px; width: 1px; align-self: stretch; margin: var(--smg-sp-8) 0; background: var(--smg-bd2); }
            /* botão base: pílula interna SEM borda própria (a borda é da barra) */
            .smg-bar-btn {
                display: inline-flex; align-items: center; justify-content: center; gap: var(--smg-sp-6); box-sizing: border-box;
                height: 30px; min-width: 30px; padding: 0 var(--smg-sp-10);
                border: 0; border-radius: var(--smg-btn-r); background: transparent; color: var(--smg-w-72);
                font-size: var(--smg-fs-14); font-weight: 600; line-height: 1; text-decoration: none; cursor: pointer; white-space: nowrap;
                transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease, transform var(--smg-dur-12) ease;
            }
            .smg-bar-btn:hover { background: var(--smg-s3); color: #fff; }
            .smg-bar-btn:active { transform: scale(0.92); }
            .smg-bar-btn:disabled, .smg-bar-btn.disabled { opacity: 0.32; pointer-events: none; cursor: default; }
            /* ícones: mais brilho (o sino tava quase invisível) + traço mais grosso */
            .smg-bar-btn--icon { padding: 0; width: 32px; color: var(--smg-w-95); }
            .smg-bar-btn--current { background: #fff !important; color: #141414 !important; cursor: default; }
            /* watch ATIVO (seguindo): destaque pra mostrar o estado atual */
            .smg-bar-btn--on { background: var(--smg-s3) !important; color: #fff !important; }
            /* HIDE/SHOW DISCUSSIONS (addon do site) — virou ícone na filter bar (smgPrimaryActions). Esconde o nativo por CSS
               (não inline): pega TODAS as instâncias (topo/rodapé) e as que o addon re-renderiza depois. O proxy lê o estado
               (.fa-eye-slash) e dá .click() no nó escondido normalmente. Escopo = só onde a barra existe (thread/threadlist). */
            html.smg-thread .smg-discussion-toggle-container, html.smg-thread .smg-discussion-toggle,
            html.smg-threadlist .smg-discussion-toggle-container, html.smg-threadlist .smg-discussion-toggle { display: none !important; }
            /* tooltip dos ícones (fixed → escapa o overflow da barra) */
            .smg-bar-tip {
                position: fixed; transform: translate(-50%, -100%); z-index: var(--smg-z-sheet-4);
                padding: var(--smg-sp-6) var(--smg-sp-10); border-radius: var(--smg-r-8); background: rgba(20,21,25,0.97); color: #fff;
                font-size: var(--smg-fs-12); font-weight: 500; line-height: 1; white-space: nowrap; pointer-events: none;
                border: 1px solid var(--smg-w-10); box-shadow: var(--smg-shadow-2);
                opacity: 0; transition: opacity var(--smg-dur-15) ease;
            }
            .smg-bar-tip.show { opacity: 1; }
            .smg-bar-ic { display: inline-flex; align-items: center; justify-content: center; }
            .smg-bar-btn svg, .smg-bar-ic svg { width: 18px; height: 18px; display: block; fill: none; stroke-width: 2.1; }
            /* Pager circular/compacto de 5 botões: [|<] [<<] [ 1 ] [>>] [>|] */
            .smg-bar-pager { display: inline-flex; align-items: center; gap: var(--smg-sp-2); padding: var(--smg-sp-2) var(--smg-sp-4); min-width: 0; }
            .smg-bar-pager .smg-bar-btn,
            .smg-bar-pager-btn {
                width: 28px; height: 28px; min-width: 28px; padding: 0;
                border-radius: var(--smg-r-round) !important;
                display: inline-flex; align-items: center; justify-content: center;
                font-size: var(--smg-fs-13); font-weight: 800; text-align: center;
                background: transparent; color: var(--smg-w-85);
                box-sizing: border-box; text-decoration: none; cursor: pointer;
                transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease, transform var(--smg-dur-12) ease, opacity var(--smg-dur-15) ease;
            }
            .smg-bar-pager .smg-bar-btn:hover,
            .smg-bar-pager-btn:hover {
                background: var(--smg-w-12); color: #fff;
            }
            .smg-bar-pager .smg-bar-btn:active,
            .smg-bar-pager-btn:active {
                transform: scale(0.92);
            }
            .smg-bar-pager .smg-bar-btn:disabled,
            .smg-bar-pager .smg-bar-btn.disabled,
            .smg-bar-pager-btn:disabled,
            .smg-bar-pager-btn.disabled {
                opacity: 0.32; pointer-events: none; cursor: default;
            }
            .smg-bar-pager .smg-bar-btn svg,
            .smg-bar-pager .smg-bar-ic svg,
            .smg-bar-pager-btn svg {
                width: 14px; height: 14px; display: block; fill: none; stroke-width: 2.1; margin: auto;
            }
            .smg-bar-cur {
                border-radius: var(--smg-r-10) !important;
                min-width: 60px !important;
                padding: 0 var(--smg-sp-10) !important;
                font-size: var(--smg-fs-12) !important;
                font-weight: 700 !important;
                white-space: nowrap !important;
            }
            .smg-bar-cur.smg-bar-pager-goto {
                height: 28px; min-width: 60px !important; padding: 0 var(--smg-sp-10) !important;
                border-radius: var(--smg-r-10) !important;
                display: inline-flex; align-items: center; justify-content: center;
                font-weight: 700 !important; font-size: var(--smg-fs-12) !important; color: #fff;
                font-variant-numeric: tabular-nums; text-align: center;
                white-space: nowrap !important;
                background: var(--smg-w-08);
                transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease, transform var(--smg-dur-12) ease;
            }
            .smg-bar-cur.smg-bar-pager-goto:hover {
                background: var(--smg-w-18); color: #fff;
            }
            .smg-bar-cur.smg-bar-pager-goto:active {
                transform: scale(0.92);
            }
            .smg-bar-curhost { display: inline-flex; }
            /* popover (ir pra página / mais): position FIXED — escapa o overflow:hidden da barra
               (era por isso que o •••/… não apareciam). Coords setadas no JS (acima do botão). */
            .smg-bar-pophost { display: inline-flex; }
            .smg-bar-pop {
                position: fixed; transform: translate(-50%, 0);   /* ABAIXO do botão (o header fica no topo da tela) */
                display: none; flex-direction: column; gap: var(--smg-sp-4); z-index: var(--smg-z-sheet-3); min-width: 160px; padding: var(--smg-sp-6);
                background: var(--smg-s2); border: 1px solid var(--smg-bd2); border-radius: var(--smg-pop-r); box-shadow: var(--smg-pop-shadow);
            }
            .smg-bar-pop.open { display: flex; }   /* o popover vive no <body> (fora do clip-path do header) */
            .smg-bar-pop--jump { flex-direction: row; align-items: center; gap: var(--smg-sp-6); min-width: 0; }
            .smg-bar-pop input { width: 66px; height: 34px; box-sizing: border-box; text-align: center; border-radius: var(--smg-r-8); border: 1px solid var(--smg-bd2); background: var(--smg-s1); color: #fff; font-size: var(--smg-fs-14); font-weight: 600; }
            .smg-bar-go { height: 34px; padding: 0 var(--smg-sp-14); border-radius: var(--smg-btn-r); border: 0; background: #fff; color: #141414; font-weight: 700; cursor: pointer; }
            .smg-bar-poprow { display: flex; align-items: center; gap: var(--smg-sp-8); height: 36px; padding: 0 var(--smg-sp-10); border-radius: var(--smg-r-8); border: 0; background: transparent; color: var(--smg-w-85); font-size: var(--smg-fs-14); font-weight: 600; text-align: left; text-decoration: none; cursor: pointer; white-space: nowrap; }
            .smg-bar-poprow:hover { background: var(--smg-s3); color: #fff; }
            /* mobile: barra full-width · números viram compacto cur/max · ações à direita
               rola na horizontal se não couber (não clipa botão em tela estreita) */
            @media (max-width: 600px) {
                /* pílula AGRUPADA (sem justify-between): encolhe pro conteúdo, à ESQUERDA, rola na horizontal se não couber */
                .smg-bar { display: flex; width: max-content; max-width: 100%; height: 38px; margin: 0 !important; overflow-x: auto; overflow-y: hidden; scrollbar-width: none; }
                .smg-bar::-webkit-scrollbar { display: none; }
                /* NÃO espremer os grupos (era o que clipava "3/39" → "/"): mantêm o tamanho e a barra ROLA */
                .smg-bar > * { flex: 0 0 auto; }
                .smg-bar-btn { height: 28px; font-size: var(--smg-fs-13); gap: var(--smg-sp-4); }
            }

            `;
