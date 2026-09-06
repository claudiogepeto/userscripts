    // STYLE CONTEXT: Listing and thread filter bars
    const CSS_FILTERBAR = `/* ============================================================
               BARRA ÚNICA SEGMENTADA (filter bar) — SMG · thread + fórum
               pager · ordenar · ações numa superfície só, grupos com divisor.
               Substitui o .block-outer nativo (escondido = fonte de dados/proxy-click).
               ============================================================ */
            .smg-bar {
                display: inline-flex; align-items: stretch; flex-wrap: nowrap; vertical-align: middle;
                height: 40px; box-sizing: border-box; margin: 0 0 0 auto; max-width: 100%;  /* margin-left:auto = alinha à DIREITA */
                background: var(--smg-s1); border: 1px solid var(--smg-bd); border-radius: 12px; overflow: hidden;
            }
            .smg-bar-group { display: inline-flex; align-items: center; gap: 3px; padding: 3px 6px; min-width: 0; }
            .smg-bar-div { flex: 0 0 1px; width: 1px; align-self: stretch; margin: 7px 0; background: var(--smg-bd2); }
            /* botão base: pílula interna SEM borda própria (a borda é da barra) */
            .smg-bar-btn {
                display: inline-flex; align-items: center; justify-content: center; gap: 6px; box-sizing: border-box;
                height: 30px; min-width: 30px; padding: 0 9px;
                border: 0; border-radius: 8px; background: transparent; color: rgba(255,255,255,0.74);
                font-size: 13.5px; font-weight: 600; line-height: 1; text-decoration: none; cursor: pointer; white-space: nowrap;
                transition: background .14s ease, color .14s ease, transform .12s ease;
            }
            .smg-bar-btn:hover { background: var(--smg-s3); color: #fff; }
            .smg-bar-btn:active { transform: scale(0.92); }
            .smg-bar-btn:disabled, .smg-bar-btn.disabled { opacity: 0.32; pointer-events: none; cursor: default; }
            /* ícones: mais brilho (o sino tava quase invisível) + traço mais grosso */
            .smg-bar-btn--icon { padding: 0; width: 32px; color: rgba(255,255,255,0.9); }
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
                position: fixed; transform: translate(-50%, -100%); z-index: 1000004;
                padding: 5px 9px; border-radius: 8px; background: rgba(20,21,25,0.97); color: #fff;
                font-size: 12px; font-weight: 500; line-height: 1; white-space: nowrap; pointer-events: none;
                border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 8px 22px rgba(0,0,0,0.5);
                opacity: 0; transition: opacity .14s ease;
            }
            .smg-bar-tip.show { opacity: 1; }
            .smg-bar-ic { display: inline-flex; align-items: center; justify-content: center; }
            .smg-bar-btn svg, .smg-bar-ic svg { width: 18px; height: 18px; display: block; fill: none; stroke-width: 2.1; }
            .smg-bar-pages { display: inline-flex; align-items: center; gap: 4px; }
            .smg-bar-compact { display: inline-flex; align-items: center; height: 30px; padding: 0 6px; color: rgba(255,255,255,0.85); font-size: 13.5px; font-weight: 700; }
            /* Pager circular/compacto de 5 botões: [|<] [<<] [ 1 ] [>>] [>|] */
            .smg-bar-pager { display: inline-flex; align-items: center; gap: 2px; padding: 2px 4px; min-width: 0; }
            .smg-bar-pager .smg-bar-btn,
            .smg-bar-pager-btn {
                width: 28px; height: 28px; min-width: 28px; padding: 0;
                border-radius: 50% !important;
                display: inline-flex; align-items: center; justify-content: center;
                font-size: 12.5px; font-weight: 800; text-align: center;
                background: transparent; color: rgba(255,255,255,0.85);
                box-sizing: border-box; text-decoration: none; cursor: pointer;
                transition: background .14s ease, color .14s ease, transform .12s ease, opacity .14s ease;
            }
            .smg-bar-pager .smg-bar-btn:hover,
            .smg-bar-pager-btn:hover {
                background: rgba(255,255,255,0.12); color: #fff;
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
                border-radius: 10px !important;
                min-width: 60px !important;
                padding: 0 10px !important;
                font-size: 12px !important;
                font-weight: 700 !important;
                white-space: nowrap !important;
            }
            .smg-bar-cur.smg-bar-pager-goto {
                height: 28px; min-width: 60px !important; padding: 0 10px !important;
                border-radius: 10px !important;
                display: inline-flex; align-items: center; justify-content: center;
                font-weight: 700 !important; font-size: 12px !important; color: #fff;
                font-variant-numeric: tabular-nums; text-align: center;
                white-space: nowrap !important;
                background: rgba(255,255,255,0.08);
                transition: background .14s ease, color .14s ease, transform .12s ease;
            }
            .smg-bar-cur.smg-bar-pager-goto:hover {
                background: rgba(255,255,255,0.18); color: #fff;
            }
            .smg-bar-cur.smg-bar-pager-goto:active {
                transform: scale(0.92);
            }
            .smg-bar-curhost { display: inline-flex; }
            .smg-bar-jump { letter-spacing: 1px; font-weight: 700; }
            /* popover (ir pra página / mais): position FIXED — escapa o overflow:hidden da barra
               (era por isso que o •••/… não apareciam). Coords setadas no JS (acima do botão). */
            .smg-bar-pophost { display: inline-flex; }
            .smg-bar-pop {
                position: fixed; transform: translate(-50%, 0);   /* ABAIXO do botão (o header fica no topo da tela) */
                display: none; flex-direction: column; gap: 4px; z-index: 1000003; min-width: 160px; padding: 6px;
                background: var(--smg-s2); border: 1px solid var(--smg-bd2); border-radius: 12px; box-shadow: 0 14px 38px rgba(0,0,0,0.55);
            }
            .smg-bar-pop.open { display: flex; }   /* o popover vive no <body> (fora do clip-path do header) */
            .smg-bar-pop--jump { flex-direction: row; align-items: center; gap: 6px; min-width: 0; }
            .smg-bar-pop input { width: 66px; height: 34px; box-sizing: border-box; text-align: center; border-radius: 8px; border: 1px solid var(--smg-bd2); background: var(--smg-s1); color: #fff; font-size: 14px; font-weight: 600; }
            .smg-bar-go { height: 34px; padding: 0 13px; border-radius: 8px; border: 0; background: #fff; color: #141414; font-weight: 700; cursor: pointer; }
            .smg-bar-poprow { display: flex; align-items: center; gap: 8px; height: 36px; padding: 0 10px; border-radius: 8px; border: 0; background: transparent; color: rgba(255,255,255,0.85); font-size: 13.5px; font-weight: 600; text-align: left; text-decoration: none; cursor: pointer; white-space: nowrap; }
            .smg-bar-poprow:hover { background: var(--smg-s3); color: #fff; }
            /* mobile: barra full-width · números viram compacto cur/max · ações à direita
               rola na horizontal se não couber (não clipa botão em tela estreita) */
            @media (max-width: 600px) {
                /* pílula AGRUPADA (sem justify-between): encolhe pro conteúdo, à ESQUERDA, rola na horizontal se não couber */
                .smg-bar { display: flex; width: max-content; max-width: 100%; height: 38px; margin: 0 !important; overflow-x: auto; overflow-y: hidden; scrollbar-width: none; }
                .smg-bar::-webkit-scrollbar { display: none; }
                /* NÃO espremer os grupos (era o que clipava "3/39" → "/"): mantêm o tamanho e a barra ROLA */
                .smg-bar > * { flex: 0 0 auto; }
                .smg-bar-compact { white-space: nowrap; }
                .smg-bar-btn { height: 28px; font-size: 12.5px; gap: 4px; }
            }

            /* BARRA DE FILTRO DE THREADS SEGUIDAS (/watched/threads) */
            .smg-watched-bar {
                display: flex; flex-direction: column; gap: 10px;
                padding: 12px 14px; margin: 0 0 14px 0;
                background: var(--smg-s1); border: 1px solid var(--smg-bd);
                border-radius: 12px; box-sizing: border-box;
            }
            .smg-watched-top { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
            .smg-watched-search {
                display: flex; align-items: center; position: relative;
                flex: 1 1 240px; min-width: 200px; height: 34px;
                background: var(--smg-s2); border: 1px solid var(--smg-bd);
                border-radius: 8px; padding: 0 8px;
                transition: border-color .15s ease, box-shadow .15s ease;
            }
            .smg-watched-search:focus-within {
                border-color: var(--smg-ac, #ff77b2);
                box-shadow: 0 0 0 2px rgba(255,119,178,0.18);
            }
            .smg-watched-search-ic {
                display: flex; align-items: center; justify-content: center;
                width: 18px; height: 18px; color: rgba(255,255,255,0.45);
                margin-right: 6px; flex-shrink: 0;
            }
            .smg-watched-search-ic svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 2; }
            .smg-watched-search-input {
                flex: 1 1 auto; min-width: 0;
                background: transparent !important; border: 0 !important; outline: 0 !important;
                box-shadow: none !important; color: #fff !important; font-size: 13px !important;
                padding: 0 !important; height: 100% !important;
            }
            .smg-watched-search-clear {
                display: none; background: transparent; border: 0; color: rgba(255,255,255,0.4);
                cursor: pointer; padding: 2px 4px; font-size: 12px; border-radius: 4px; line-height: 1;
            }
            .smg-watched-search-clear:hover { color: #fff; }
            .smg-watched-search.has-val .smg-watched-search-clear { display: block; }
            .smg-watched-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: rgba(255,255,255,0.55); margin-left: auto; }
            .smg-watched-chips {
                display: flex; align-items: center; gap: 6px; overflow-x: auto;
                padding-bottom: 2px; scrollbar-width: thin;
            }
            .smg-watched-empty {
                text-align: center; padding: 36px 16px; color: rgba(255,255,255,0.5); font-size: 14px;
            }

            `;
