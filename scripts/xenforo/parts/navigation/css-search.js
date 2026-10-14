    // ── CSS: search dialog, results page, advanced search and dropdown ──
    const CSS_SEARCH = `
            /* ---- search: dialog modal (command palette) + backdrop escuro ---- */
            #smg-search-overlay {
                position: fixed;
                inset: 0;
                z-index: var(--smg-z-sheet-1);
                display: none;
                opacity: 0;
                background: var(--smg-scrim);
                -webkit-backdrop-filter: blur(6px) saturate(120%);
                backdrop-filter: blur(6px) saturate(120%);
                transition: opacity var(--smg-dur-20) ease;
            }
            #smg-search-overlay.open { display: block; opacity: 1; }
            #smg-search-pop {
                position: absolute;
                top: max(32px, 4vh);
                left: 50%;
                transform: translateX(-50%) scale(0.98);
                width: 780px;
                max-width: calc(100vw - 32px);
                max-height: calc(94vh - 32px);
                overflow: visible !important;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                gap: var(--smg-sp-12);
                padding: var(--smg-sp-24) var(--smg-sp-24) var(--smg-sp-24);
                border-radius: var(--smg-r-20);
                background: var(--smg-s1);
                border: 1px solid var(--smg-w-12);
                box-shadow:
                    var(--smg-hl),
                    var(--smg-shadow-4);
                opacity: 0;
                transition: opacity var(--smg-dur-20) ease, transform var(--smg-dur-30) cubic-bezier(.2,.9,.3,1);
            }
            #smg-search-pop .smg-search-results,
            #smg-search-pop .smg-search-history {
                flex: 1 1 auto !important;
                /* min-height:0 fazia o flex item colapsar com overflow:auto e a 1ª linha
                   (chips + prefixos do resultado) nascia cortada na base */
                min-height: min(240px, 36vh) !important;
                max-height: min(62vh, 560px) !important;
                overflow-y: auto !important;
                overscroll-behavior: contain !important;
                padding-right: var(--smg-sp-4);
            }
            .smg-search-sentinel {
                position: relative !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: var(--smg-sp-16) 0 !important;
                width: 100% !important;
                min-height: 48px !important;
                box-sizing: border-box !important;
            }
            .smg-search-sentinel .smg-loading {
                position: static !important;
                inset: auto !important;
                display: none !important;
                width: auto !important;
                height: auto !important;
                z-index: var(--smg-z-1) !important;
            }
            .smg-search-sentinel.is-loading .smg-loading {
                display: flex !important;
            }
            .smg-search-sentinel .smg-loading::after {
                width: 22px !important;
                height: 22px !important;
                border-width: 2.5px !important;
                border-color: var(--smg-w-14) !important;
                border-top-color: var(--smg-link) !important;
            }
            .smg-search-results[hidden],
            .smg-search-empty[hidden],
            .smg-search-history[hidden],
            [hidden] {
                display: none !important;
                margin: 0 !important;
                padding: 0 !important;
                height: 0 !important;
            }
            #smg-search-overlay.open #smg-search-pop {
                opacity: 1;
                transform: translateX(-50%) scale(1);
            }
            #smg-search-pop::-webkit-scrollbar { width: 8px; }
            #smg-search-pop::-webkit-scrollbar-thumb { background: var(--smg-w-14); border-radius: var(--smg-r-4); }
            /* topbar: lupa + input + atalho + fechar (command palette, sem botão) */
            .smg-search-bar {
                display: flex; align-items: center; gap: var(--smg-sp-12);
                height: 56px; padding: 0 var(--smg-sp-8) 0 var(--smg-sp-16);
                border-radius: var(--smg-r-14);
                background: var(--smg-w-06);
                border: 1px solid var(--smg-w-10);
                transition: border-color var(--smg-dur-15) ease, background var(--smg-dur-15) ease;
                flex-shrink: 0 !important;
                overflow: visible !important;
            }
            .smg-search-bar:focus-within { border-color: var(--smg-link); background: var(--smg-w-08); }   /* foco na cor do tema = mesmo focus da pílula da topbar */
            .smg-search-lupa { flex: 0 0 auto; display: flex; align-items: center; color: var(--smg-w-50); }
            .smg-search-lupa svg { width: 20px; height: 20px; fill: none; }
            .smg-search-input {
                flex: 1 1 auto; min-width: 0; height: 100%;
                border: none; background: transparent; outline: none;
                color: #fff; font-size: var(--smg-fs-18); padding: 0;
            }
            .smg-search-input::placeholder { color: var(--smg-w-40); }
            .smg-search-global-toolbar {
                position: relative !important;
                z-index: var(--smg-z-10000) !important;
                display: flex;
                flex-direction: column;
                gap: var(--smg-sp-10);
                padding: var(--smg-sp-10) 0;
                border-bottom: 1px solid var(--smg-w-06);
                flex-shrink: 0 !important;
                min-height: fit-content !important;
                overflow: visible !important;
            }
            .smg-search-tb-row {
                display: flex;
                align-items: center;
                gap: var(--smg-sp-8);
                width: 100%;
                flex-wrap: wrap;
                flex-shrink: 0 !important;
                overflow: visible !important;
            }
            .smg-search-tb-spacer {
                flex: 1 1 auto;
            }
            .smg-search-select-wrap {
                position: relative;
                display: inline-flex;
                align-items: center;
            }
            .smg-search-select-wrap .smg-search-select-ic {
                position: absolute;
                left: 10px;
                pointer-events: none;
                z-index: var(--smg-z-1);
                display: flex;
                align-items: center;
                justify-content: center;
                width: 15px;
                height: 15px;
                color: var(--smg-w-72);
            }
            .smg-search-select-wrap .smg-search-select-ic svg {
                width: 15px;
                height: 15px;
                fill: none !important;
            }
            .smg-search-select-wrap select {
                appearance: none;
                -webkit-appearance: none;
                height: 34px;
                padding: 0 var(--smg-sp-28) 0 var(--smg-sp-32);
                border-radius: var(--smg-r-10);
                background-color: var(--smg-w-06);
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='var(--smg-w-60)' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 9px center;
                border: 1px solid var(--smg-w-12);
                color: var(--smg-w-95);
                font-size: var(--smg-fs-13);
                font-weight: 600;
                cursor: pointer;
                outline: none;
                transition: all var(--smg-dur-15) ease;
            }
            .smg-search-select-wrap select:hover {
                background-color: var(--smg-w-10);
                border-color: var(--smg-w-22);
                color: #fff;
            }
            .smg-search-select-wrap select:focus {
                border-color: var(--smg-link);
                box-shadow: 0 0 0 1px var(--smg-link);
            }
            .smg-search-select-wrap select option {
                background: #18181b;
                color: #fff;
            }
            /* AUTOR: trigger icon-only compacto e row expansível no lugar da toolbar */
            .smg-search-author-trigger {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 34px;
                height: 34px;
                box-sizing: border-box;
                border-radius: var(--smg-r-10);
                background: var(--smg-w-06);
                border: 1px solid var(--smg-w-12);
                color: var(--smg-w-72);
                cursor: pointer;
                transition: all var(--smg-dur-15) ease;
            }
            .smg-search-author-trigger:hover {
                background: var(--smg-w-10);
                border-color: var(--smg-w-22);
                color: #fff;
            }
            .smg-search-author-trigger svg {
                width: 15px;
                height: 15px;
                fill: none !important;
            }
            .smg-search-global-toolbar.author-open .smg-search-tb-row {
                display: none !important;
            }
            .smg-search-author-row {
                display: flex;
                align-items: center;
                gap: var(--smg-sp-10);
                width: 100%;
                height: 34px;
                box-sizing: border-box;
                border-radius: var(--smg-r-10);
                background: var(--smg-w-08);
                border: 1px solid var(--smg-link);
                padding: 0 var(--smg-sp-8) 0 var(--smg-sp-10);
                box-shadow: 0 0 0 1px var(--smg-link);
                transition: all var(--smg-dur-15) ease;
            }
            .smg-search-author-row[hidden] {
                display: none !important;
            }
            .smg-search-author-row .smg-search-author-ic {
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--smg-link);
                flex-shrink: 0;
            }
            .smg-search-author-row .smg-search-author-ic svg {
                width: 15px;
                height: 15px;
                fill: none !important;
            }
            .smg-search-author-row .smg-search-author-inp {
                flex: 1 1 auto;
                min-width: 0;
                width: 100%;
                height: 100%;
                border: none;
                background: transparent;
                outline: none;
                color: #fff;
                font-size: var(--smg-fs-13);
                font-weight: 500;
                font-family: inherit;
                padding: 0;
                margin: 0;
            }
            .smg-search-author-row .smg-search-author-inp::placeholder {
                color: var(--smg-w-40);
            }
            .smg-search-author-row .smg-search-author-clear,
            .smg-search-author-row .smg-search-author-close {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                border: none;
                background: transparent;
                transition: all var(--smg-dur-15) ease;
            }
            .smg-search-author-row .smg-search-author-clear {
                width: 24px;
                height: 24px;
                border-radius: var(--smg-r-6);
                color: var(--smg-w-50);
                padding: 0;
            }
            .smg-search-author-row .smg-search-author-clear:hover {
                background: var(--smg-w-12);
                color: #fff;
            }
            .smg-search-author-row .smg-search-author-clear svg,
            .smg-search-author-row .smg-search-author-close svg {
                width: 13px;
                height: 13px;
                fill: none !important;
            }
            .smg-search-author-row .smg-search-author-close {
                width: 24px;
                height: 24px;
                border-radius: var(--smg-r-6);
                background: var(--smg-w-08);
                color: var(--smg-w-72);
                padding: 0;
            }
            .smg-search-author-row .smg-search-author-close:hover {
                background: var(--smg-w-18);
                color: #fff;
            }
            .smg-search-tb-row .smg-search-cfg {
                width: 34px;
                height: 34px;
                padding: 0;
                border-radius: var(--smg-r-10);
                background: var(--smg-w-06);
                border: 1px solid var(--smg-w-12);
                color: var(--smg-w-72);
                display: inline-flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all var(--smg-dur-15) ease;
            }
            .smg-search-tb-row .smg-search-cfg:hover {
                background: var(--smg-w-10);
                border-color: var(--smg-w-22);
                color: #fff;
            }
            .smg-search-tb-row .smg-search-adv, .smg-search-tb-right .smg-search-adv {
                display: inline-flex;
                align-items: center;
                gap: var(--smg-sp-8);
                height: 34px;
                padding: 0 var(--smg-sp-12);
                border-radius: var(--smg-r-10);
                border: 1px solid var(--smg-w-12);
                background: var(--smg-w-06);
                color: var(--smg-w-72);
                font-size: var(--smg-fs-13);
                font-weight: 600;
                text-decoration: none;
                cursor: pointer;
                transition: all var(--smg-dur-15) ease;
            }
            .smg-search-tb-row .smg-search-adv:hover {
                background: var(--smg-w-10);
                border-color: var(--smg-w-22);
                color: #fff;
            }
            .smg-search-tb-row .smg-search-adv .smg-ext-ic {
                display: inline-flex;
                align-items: center;
            }
            .smg-search-tb-row .smg-search-adv .smg-ext-ic svg {
                width: 12px;
                height: 12px;
                opacity: 0.7;
            }
            .smg-search-global-toolbar .smg-multiselect-btn {
                height: 34px;
                padding: 0 var(--smg-sp-12);
                font-size: var(--smg-fs-13);
                font-weight: 600;
                border-radius: var(--smg-r-10);
                background: var(--smg-w-06);
                border: 1px solid var(--smg-w-12);
                color: var(--smg-w-95);
                gap: var(--smg-sp-8);
                transition: all var(--smg-dur-15) ease;
            }
            .smg-search-global-toolbar .smg-multiselect-btn:hover {
                background: var(--smg-w-10);
                border-color: var(--smg-w-22);
                color: #fff;
            }
            .smg-search-global-toolbar .smg-multiselect-btn.has-active {
                background: var(--smg-link-soft);
                border-color: var(--smg-link);
                color: #fff;
            }

            .smg-ios-toggle {
                display: inline-flex;
                align-items: center;
                gap: var(--smg-sp-8);
                height: 34px;
                padding: 0 var(--smg-sp-10);
                border-radius: var(--smg-r-10);
                background: var(--smg-w-04);
                border: 1px solid var(--smg-w-10);
                cursor: pointer;
                user-select: none;
                box-sizing: border-box;
                transition: all var(--smg-dur-15) ease;
            }
            .smg-ios-toggle:hover {
                background: var(--smg-w-08);
                border-color: var(--smg-w-18);
            }
            .smg-ios-toggle input { display: none; }
            .smg-ios-switch {
                width: 32px;
                height: 18px;
                border-radius: var(--smg-r-pill);
                background: var(--smg-w-18);
                position: relative;
                transition: background var(--smg-dur-20) ease;
                flex-shrink: 0;
            }
            .smg-ios-switch::before {
                content: "";
                position: absolute;
                width: 14px;
                height: 14px;
                border-radius: var(--smg-r-round);
                background: #fff;
                top: 2px;
                left: 2px;
                transition: transform var(--smg-dur-20) cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: var(--smg-shadow-1);
            }
            .smg-ios-toggle input:checked + .smg-ios-switch {
                background: var(--smg-link);
            }
            .smg-ios-toggle input:checked + .smg-ios-switch::before {
                transform: translateX(14px);
            }
            .smg-ios-label {
                font-size: var(--smg-fs-13);
                font-weight: 600;
                color: var(--smg-w-85);
            }

            .smg-chip {
                display: inline-flex; align-items: center; gap: var(--smg-sp-8);
                height: 40px; padding: 0 var(--smg-sp-18); box-sizing: border-box;
                border-radius: var(--smg-r-pill); border: 1px solid var(--smg-w-10);
                background: var(--smg-w-04); color: var(--smg-w-72);
                font-size: var(--smg-fs-14); font-weight: 600; cursor: pointer; white-space: nowrap;
                transition: background var(--smg-dur-15) ease, border-color var(--smg-dur-15) ease, color var(--smg-dur-15) ease, transform var(--smg-dur-12) ease;
            }
            .smg-chip:hover { background: var(--smg-w-08); color: #fff; }
            .smg-chip:active { transform: scale(0.96); }
            .smg-chip.active {
                background: var(--smg-w-18);
                border-color: var(--smg-w-30); color: #fff;
            }
            .smg-chip-check { display: none; align-items: center; }
            .smg-chip-check svg { width: 15px; height: 15px; fill: none; }
            .smg-chip-toggle.active .smg-chip-check { display: inline-flex; }
            .smg-search-by {
                flex: 0 0 auto; width: 100%; min-width: 0; height: 44px; padding: 0 var(--smg-sp-16); box-sizing: border-box;
                border-radius: var(--smg-r-12); border: 1px solid var(--smg-w-14);
                background: var(--smg-w-06); color: #fff; font-size: var(--smg-fs-14); outline: none;
                transition: border-color var(--smg-dur-15) ease, background var(--smg-dur-15) ease;
            }
            .smg-search-by::placeholder { color: var(--smg-w-40); }
            .smg-search-by:focus { border-color: var(--smg-w-50); background: var(--smg-w-08); }
            /* toolbar de filtros (1 linha): escopo (menu) · só-títulos (switch) · autor (ícone) */
            .smg-search-toolbar { display: flex; align-items: center; gap: var(--smg-sp-10); flex-wrap: wrap; }
            /* ESCOPO — botão + menu dropdown */
            .smg-search-scope { position: relative; }
            .smg-search-scope-btn {
                display: inline-flex; align-items: center; gap: var(--smg-sp-6);
                height: 36px; padding: 0 var(--smg-sp-10) 0 var(--smg-sp-14); box-sizing: border-box;
                border-radius: var(--smg-r-10); border: 1px solid var(--smg-w-14);
                background: var(--smg-w-06); color: #fff;
                font-size: var(--smg-fs-14); font-weight: 600; cursor: pointer; white-space: nowrap;
                transition: background var(--smg-dur-15) ease, border-color var(--smg-dur-15) ease;
            }
            .smg-search-scope-btn:hover { background: var(--smg-w-10); }
            .smg-search-scope-btn.open { background: var(--smg-w-10); border-color: var(--smg-w-30); }
            .smg-search-scope-chev { display: inline-flex; opacity: 0.55; transition: transform var(--smg-dur-20) ease; }
            .smg-search-scope-chev svg { width: 14px; height: 14px; fill: none; }
            .smg-search-scope-btn.open .smg-search-scope-chev { transform: rotate(180deg); }
            .smg-search-scope-list {
                position: absolute; top: calc(100% + 6px); left: 0; z-index: var(--smg-z-50);
                min-width: 180px; padding: var(--smg-sp-6);
                display: flex; flex-direction: column; gap: var(--smg-sp-2);
                background: var(--smg-s1); border: 1px solid var(--smg-w-14); border-radius: var(--smg-r-12);
                box-shadow: var(--smg-shadow-4);
            }
            .smg-search-scope-list[hidden] { display: none; }
            .smg-search-scope-list button {
                display: flex; align-items: center; height: 36px; padding: 0 var(--smg-sp-12);
                border: 0; border-radius: var(--smg-r-8); background: transparent; color: var(--smg-w-72);
                font-size: var(--smg-fs-14); font-weight: 500; cursor: pointer; text-align: left; white-space: nowrap;
                transition: background var(--smg-dur-12) ease, color var(--smg-dur-12) ease;
            }
            .smg-search-scope-list button:hover { background: var(--smg-w-08); color: #fff; }
            .smg-search-scope-list button.active { background: var(--smg-w-14); color: #fff; }
            /* ORDENAR — chip-toggle relevância ⇄ data (padrão do sort da thread: mostra o critério ATUAL, clique alterna).
               Vira order=date no POST da busca (= &o=date na URL de resultados). */
            .smg-search-order-btn {
                display: inline-flex; align-items: center; gap: var(--smg-sp-8);
                height: 36px; padding: 0 var(--smg-sp-12); box-sizing: border-box;
                border-radius: var(--smg-r-10); border: 1px solid var(--smg-w-14);
                background: var(--smg-w-06); color: #fff;
                font-size: var(--smg-fs-14); font-weight: 600; cursor: pointer; white-space: nowrap;
                transition: background var(--smg-dur-15) ease, border-color var(--smg-dur-15) ease;
            }
            .smg-search-order-btn:hover { background: var(--smg-w-10); }
            .smg-search-order-ic { display: inline-flex; opacity: 0.7; }
            .smg-search-order-ic svg { width: 15px; height: 15px; fill: none; }
            .smg-search-pop--drop .smg-search-toolbar { gap: var(--smg-sp-8); }   /* dropdown (480px): toolbar ganhou o chip de ordenar → gap menor pra caber numa linha */
            /* SÓ TÍTULOS — switch */
            .smg-search-switch {
                display: inline-flex; align-items: center; gap: var(--smg-sp-10); margin-left: auto;   /* empurra Só-títulos + autor pra DIREITA (escopo fica na esquerda) */
                height: 36px; padding: 0 var(--smg-sp-4); border: 0; background: transparent;
                color: var(--smg-w-85); font-size: var(--smg-fs-14); font-weight: 600; cursor: pointer;
                transition: color var(--smg-dur-15) ease;
            }
            .smg-search-switch:hover { color: #fff; }
            .smg-search-switch-track {
                position: relative; flex: 0 0 auto; width: 38px; height: 22px; border-radius: var(--smg-r-pill);
                background: var(--smg-w-18); transition: background var(--smg-dur-20) ease;
            }
            .smg-search-switch-thumb {
                position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: var(--smg-r-round);
                background: #fff; box-shadow: var(--smg-shadow-1);
                transition: transform var(--smg-dur-20) cubic-bezier(.3,.8,.3,1);
            }
            .smg-search-switch.on .smg-search-switch-track { background: #34c759; }
            .smg-search-switch.on .smg-search-switch-thumb { transform: translateX(16px); }
            /* AUTOR — ícone que revela o campo (.smg-search-by reusa o estilo existente) */
            .smg-search-author-btn {
                display: inline-flex; align-items: center; justify-content: center;
                width: 36px; height: 36px; box-sizing: border-box;
                border-radius: var(--smg-r-10); border: 1px solid var(--smg-w-14);
                background: var(--smg-w-06); color: var(--smg-w-72); cursor: pointer;
                transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease, border-color var(--smg-dur-15) ease;
            }
            .smg-search-author-btn:hover { background: var(--smg-w-10); color: #fff; }
            .smg-search-author-btn.open { background: var(--smg-w-10); border-color: var(--smg-w-30); color: #fff; }
            .smg-search-author-btn svg { width: 17px; height: 17px; fill: none; }
            .smg-search-author-wrap[hidden] { display: none; }
            /* AÇÕES DA BARRA — ⇥ (comandos) · funil (avançada) · sliders (defaults) · esc · × têm UM desenho só:
               30px, raio 9, mesma borda/fundo/hover. Antes cada um tinha altura, raio e borda próprios (24/30/36px). */
            .smg-search-acts { flex: 0 0 auto; display: inline-flex; align-items: center; gap: var(--smg-sp-4); }
            .smg-search-adv, .smg-search-cfg, .smg-search-close, .smg-search-kbd {
                flex: 0 0 auto; box-sizing: border-box;
                display: inline-flex; align-items: center; justify-content: center;
                min-width: 30px; height: 30px; padding: 0 var(--smg-sp-8); margin: 0;
                border-radius: var(--smg-r-10); border: 1px solid var(--smg-w-12);
                background: var(--smg-w-06); color: var(--smg-w-55);
                font: 600 13px/1 -apple-system, system-ui, sans-serif; text-decoration: none; cursor: pointer;
                transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease, border-color var(--smg-dur-15) ease, transform var(--smg-dur-12) ease;
            }
            .smg-search-adv:hover, .smg-search-cfg:hover, .smg-search-close:hover { background: var(--smg-w-12); border-color: var(--smg-w-22); color: #fff; }
            .smg-search-adv:active, .smg-search-cfg:active, .smg-search-close:active { transform: scale(0.93); }
            .smg-search-author-trigger.has-value, .smg-search-cfg.open { background: var(--smg-link-soft); border-color: var(--smg-link); color: var(--smg-link); }
            .smg-search-adv svg, .smg-search-cfg svg, .smg-search-close svg { width: 16px; height: 16px; fill: none !important; }
            .smg-search-kbd { cursor: default; font: 600 11.5px/1 ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--smg-w-40); }
            .smg-search-foot { display: none; }   /* rodapé (botão "Search") removido: digitar já busca (debounce) + "See all results" + Enter; o botão é redundante. Desktop já escondia; agora some no mobile tb. */
            .smg-search-go {
                flex: 0 0 auto; display: inline-flex; align-items: center; gap: var(--smg-sp-8);
                height: 42px; padding: 0 var(--smg-sp-18); box-sizing: border-box;
                border-radius: var(--smg-r-12); border: none;
                background: #fff; color: #141414;
                font-size: var(--smg-fs-14); font-weight: 700; cursor: pointer;
                transition: filter var(--smg-dur-15) ease, transform var(--smg-dur-12) ease;
            }
            .smg-search-go-ic { display: inline-flex; }
            .smg-search-go-ic svg { width: 17px; height: 17px; fill: none; stroke-width: 2.4; }
            .smg-search-go:hover { filter: brightness(0.9); }
            .smg-search-go:active { transform: scale(0.97); }

            /* ---- painel de busca INLINE na página de RESULTADOS (search_results): input pra edição
               rápida da query + filtros (escopo · ordenar · só-títulos · autor) direto no header.
               Reusa os componentes do dialog (.smg-search-bar/-toolbar/-scope/-switch/-author).
               Largura TOTAL do conteúdo (alinha com a lista de resultados abaixo). ---- */
            #smg-rs-panel { display: flex; flex-direction: column; gap: var(--smg-sp-10); margin: var(--smg-sp-14) 0 var(--smg-sp-2); }
            #smg-rs-panel .smg-search-bar { height: 50px; }
            #smg-rs-panel .smg-search-toolbar {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: var(--smg-sp-8);
            }
            #smg-rs-panel .smg-multiselect-btn {
                height: 32px;
                padding: 0 var(--smg-sp-10);
                font-size: var(--smg-fs-13);
                border-radius: var(--smg-r-10);
            }

            /* ===== página de RESULTADOS da busca: lista nativa re-tematizada (cards no padrão do tema) =====
               Os .contentRow do XF (avatar · título · snippet · meta) seguem server-render — só a CASCA muda:
               o painelão nativo (.block-container) vira transparente e cada linha vira um card --smg-s1,
               mesma linguagem dos cards do resto do script. Vale pro scroll infinito (CSS pega as linhas novas).
               Seletores ancorados em .block-row → vencem as regras genéricas de .contentRow do smg-threadlist
               (que vêm DEPOIS na folha) por especificidade, não por ordem. */
            html.smg-search-page .p-body-pageContent .block .block-container { background: transparent !important; border: 0 !important; box-shadow: none !important; border-radius: 0 !important; overflow: visible !important; }
            html.smg-search-page .p-body-pageContent .block .block-body { display: flex; flex-direction: column; gap: var(--smg-sp-10); padding: 0 !important; background: transparent !important; border: 0 !important; }
            html.smg-search-page .block-row.block-row--separated {
                margin: 0 !important; padding: var(--smg-sp-16) var(--smg-sp-18) !important;
                background: var(--smg-s1) !important; border: 1px solid var(--smg-bd) !important; border-radius: var(--smg-r-14) !important;
                transition: border-color var(--smg-dur-15) ease, box-shadow var(--smg-dur-15) ease;
            }
            html.smg-smg.smg-search-page .block-row.block-row--separated { --smg-s1: hsl(0 0% 12.5%); }   /* SMG: mesma superfície dos cards de post (.smg-pc) */
            html.smg-search-page .block-row.block-row--separated:hover { border-color: var(--smg-bd2) !important; box-shadow: var(--smg-shadow-2); }
            html.smg-search-page .block-row .contentRow { align-items: flex-start !important; gap: var(--smg-sp-14) !important; }
            html.smg-search-page .block-row .contentRow-figure { flex: 0 0 auto; }
            html.smg-search-page .block-row .contentRow-main { min-width: 0 !important; }
            /* título: branco + bold; o termo buscado (em.textHighlight) ganha o ACENTO do tema */
            html.smg-search-page .block-row .contentRow-title { font-size: var(--smg-fs-16) !important; font-weight: 700 !important; line-height: 1.5 !important; margin: var(--smg-sp-2) 0 var(--smg-sp-4) !important; overflow: visible !important; }
            html.smg-search-page .block-row .contentRow-title .label,
            html.smg-search-page .block-row .contentRow-title .prefix,
            html.smg-search-page .block-row .contentRow-title .labelLink { overflow: visible !important; vertical-align: middle !important; }
            html.smg-search-page .block-row .contentRow-title a { color: #fff !important; text-decoration: none !important; }
            html.smg-search-page .block-row .contentRow-title a:hover { color: var(--smg-link) !important; }
            html.smg-search-page .block-row .textHighlight { color: var(--smg-link) !important; font-style: normal !important; background: none !important; }
            /* snippet: no máx 2 linhas, texto suave (URL crua não estoura o card) */
            html.smg-search-page .block-row .contentRow-snippet {
                font-size: var(--smg-fs-13) !important; line-height: 1.5 !important; color: var(--smg-w-60) !important;
                display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word;
                margin: 0 0 var(--smg-sp-8) !important;
            }
            /* meta (autor · nº do post · data · fórum/tópico): discreto, links sutis */
            html.smg-search-page .block-row .contentRow-minor { font-size: var(--smg-fs-12) !important; color: var(--smg-w-40) !important; margin-top: var(--smg-sp-6) !important; }
            html.smg-search-page .block-row .contentRow-minor a { color: var(--smg-w-60) !important; text-decoration: none !important; }
            html.smg-search-page .block-row .contentRow-minor a:hover { color: #fff !important; text-decoration: underline !important; }
            html.smg-search-page .block-row .contentRow-minor time { color: var(--smg-w-55); }
            html.smg-search-page .block-row .contentRow-minor .tagItem { font-size: var(--smg-fs-11) !important; padding: var(--smg-sp-2) var(--smg-sp-8) !important; border-radius: var(--smg-r-6) !important; }

            /* ===== página de BUSCA AVANÇADA (search_form): form nativo re-tematizado =====
               Só a CASCA muda (CSS) — os widgets do XF (tagify, autocomplete, datas, abas, sticky submit)
               seguem 100% nativos, sem JS nosso. Card único, labels EMPILHADOS (acima do campo, como nos
               nossos sheets), abas com sublinhado-accent (linguagem das abas da home), inputs no padrão. */
            html.smg-search-form form.block { color-scheme: dark; }   /* date picker/ícones nativos em claro */
            html.smg-search-form form.block .block-container {
                background: var(--smg-s1) !important; border: 1px solid var(--smg-bd) !important;
                border-radius: var(--smg-r-18) !important; box-shadow: none !important; overflow: hidden;
            }
            html.smg-smg.smg-search-form form.block .block-container { --smg-s1: hsl(0 0% 12.5%); --smg-s2: hsl(0 0% 16%); --smg-s3: hsl(0 0% 21%); }   /* mesma superfície dos cards (.smg-pc) */
            /* abas (Search everything / threads / …): texto neutro + sublinhado-accent no ativo */
            html.smg-search-form .block-tabHeader {
                margin: 0 !important; padding: var(--smg-sp-4) var(--smg-sp-12) 0 !important;
                background: transparent !important; border: 0 !important; border-bottom: 1px solid var(--smg-bd) !important; box-shadow: none !important;
            }
            html.smg-search-form .block-tabHeader .hScroller-action { display: none !important; }   /* setas com gradiente do tema destoam do card; as abas rolam por swipe/scroll */
            html.smg-search-form .block-tabHeader .tabs-tab {
                position: relative; display: inline-flex; align-items: center; height: 48px; padding: 0 var(--smg-sp-14);
                background: transparent !important; border: 0 !important; box-shadow: none !important;
                color: var(--smg-w-55) !important; font-size: var(--smg-fs-14) !important; font-weight: 600 !important;
                text-decoration: none !important; white-space: nowrap; transition: color var(--smg-dur-15) ease;
            }
            html.smg-search-form .block-tabHeader .tabs-tab:hover { color: #fff !important; }
            html.smg-search-form .block-tabHeader .tabs-tab.is-active { color: #fff !important; font-weight: 700 !important; }
            html.smg-search-form .block-tabHeader .tabs-tab::before { content: none !important; }
            html.smg-search-form .block-tabHeader .tabs-tab::after {   /* substitui QUALQUER indicador nativo pelo nosso sublinhado */
                content: "" !important; position: absolute; left: 11px; right: 11px; bottom: -1px; height: 2.5px;
                border-radius: var(--smg-r-4) var(--smg-r-4) 0 0; background: var(--smg-link); border: 0 !important; box-shadow: none !important;
                transform: scaleX(0); transition: transform var(--smg-dur-20) ease;
            }
            html.smg-search-form .block-tabHeader .tabs-tab.is-active::after { transform: scaleX(1); }
            /* corpo: form na LARGURA TOTAL do conteúdo — GRID de 2 colunas no desktop (Keywords, a 1ª
               row, atravessa as duas = campo principal); 1 coluna no estreito. Vale pra qualquer aba
               (threads/profile/DMs): a 1ª row é sempre Keywords e o resto flui no grid. */
            html.smg-search-form form.block .block-body {
                display: grid; grid-template-columns: 1fr; gap: var(--smg-sp-20);
                padding: var(--smg-sp-24) var(--smg-sp-24) var(--smg-sp-24) !important; background: transparent !important; border: 0 !important;
            }
            @media (min-width: 801px) {
                html.smg-search-form form.block .block-body { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--smg-sp-24) 40px; padding: var(--smg-sp-28) var(--smg-sp-32) var(--smg-sp-28) !important; }
                html.smg-search-form form.block .block-body > .formRow:first-child { grid-column: 1 / -1; }
            }
            html.smg-search-form form.block .block-body > .formRow {
                display: flex !important; flex-direction: column !important; gap: var(--smg-sp-8);
                margin: 0 !important; padding: 0 !important; border: 0 !important; background: transparent !important;
            }
            html.smg-search-form form.block .block-body > .formRow > dt {
                display: block !important; width: auto !important; max-width: none !important;
                padding: 0 !important; margin: 0 !important; text-align: left !important; border: 0 !important; background: transparent !important;
            }
            html.smg-search-form form.block .formRow-labelWrapper { padding: 0 !important; margin: 0 !important; }
            html.smg-search-form form.block .formRow-label { font-size: var(--smg-fs-12) !important; font-weight: 700 !important; letter-spacing: .07em; text-transform: uppercase; color: var(--smg-w-50) !important; }
            html.smg-search-form form.block .block-body > .formRow > dd { display: block !important; width: auto !important; padding: 0 !important; margin: 0 !important; border: 0 !important; background: transparent !important; }
            html.smg-search-form form.block .formRow-explain { font-size: var(--smg-fs-12) !important; color: var(--smg-w-40) !important; margin-top: var(--smg-sp-6) !important; }
            /* inputs (texto, busca, data, select, tagify — todos têm .input) no padrão do tema */
            html.smg-search-form form.block .input {
                min-height: 44px; padding: var(--smg-sp-10) var(--smg-sp-14); box-sizing: border-box;
                background: var(--smg-w-06) !important; border: 1px solid var(--smg-w-14) !important;
                border-radius: var(--smg-r-12) !important; color: #fff !important; font-size: var(--smg-fs-15) !important; box-shadow: none !important;
            }
            html.smg-search-form form.block .input:focus, html.smg-search-form form.block .input:focus-within {
                border-color: var(--smg-link) !important; background: var(--smg-w-08) !important; outline: none !important;
            }
            html.smg-search-form form.block select.input option { background: #1b1c20; color: #fff; }
            /* tagify (Tags / Without tags): chips no padrão (o tile do chip nativo vem de um ::before com box-shadow) */
            html.smg-search-form form.block .tagify__input { color: #fff; }
            html.smg-search-form form.block .tagify__tag > div::before { box-shadow: none !important; background: var(--smg-s3) !important; border-radius: var(--smg-r-8); }
            html.smg-search-form form.block .tagify__tag-text { color: #fff !important; }
            /* datas (Newer/Older than): linha flex limpa, rótulo do meio vira label pequeno */
            html.smg-search-form form.block .inputGroup { display: flex !important; align-items: center; gap: var(--smg-sp-10); flex-wrap: wrap; }
            html.smg-search-form form.block .inputGroup .input--date { flex: 0 1 190px; width: auto !important; }
            html.smg-search-form form.block .inputGroup-text {
                display: inline-flex; padding: 0 !important; background: transparent !important; border: 0 !important; box-shadow: none !important;
                color: var(--smg-w-50) !important; font-size: var(--smg-fs-12) !important; font-weight: 700 !important; letter-spacing: .07em; text-transform: uppercase;
            }
            html.smg-search-form form.block .inputGroup-splitter { display: none !important; }
            /* lista do campo Keywords (input + 2 checkboxes) com respiro */
            html.smg-search-form form.block .inputList { display: flex; flex-direction: column; gap: var(--smg-sp-12); margin: 0 !important; }
            html.smg-search-form form.block .inputList > li { margin: 0 !important; }
            /* checkboxes/radios (.iconic): caixinha própria + ACENTO quando marcado (o glifo nativo do XF é mantido) */
            html.smg-search-form form.block label.iconic {
                display: inline-flex !important; align-items: center; gap: var(--smg-sp-10); padding: 0 !important; margin: 0 !important;
                color: var(--smg-w-72) !important; font-size: var(--smg-fs-14) !important; cursor: pointer;
            }
            html.smg-search-form form.block label.iconic > i {
                position: static !important; flex: 0 0 auto; width: 19px; height: 19px; margin: 0 !important; box-sizing: border-box;
                display: inline-flex !important; align-items: center; justify-content: center;
                border: 1px solid var(--smg-w-22) !important; border-radius: var(--smg-r-6) !important;
                background: var(--smg-w-06) !important; box-shadow: none !important;
                transition: background var(--smg-dur-15) ease, border-color var(--smg-dur-15) ease;
            }
            html.smg-search-form form.block label.iconic--radio > i { border-radius: var(--smg-r-round) !important; }
            html.smg-search-form form.block label.iconic > i::after { position: static !important; margin: 0 !important; font-size: var(--smg-fs-11) !important; line-height: 1 !important; }
            html.smg-search-form form.block label.iconic input:checked + i { background: var(--smg-link-strong) !important; border-color: var(--smg-link-strong) !important; }
            html.smg-search-form form.block label.iconic input:checked + i::after { color: #fff !important; }
            /* Order by (Relevance/Date): radios na HORIZONTAL */
            html.smg-search-form form.block .inputChoices { display: flex !important; flex-wrap: wrap; gap: var(--smg-sp-8) var(--smg-sp-24); margin: 0 !important; padding: 0 !important; }
            html.smg-search-form form.block .inputChoices-choice { margin: 0 !important; padding: 0 !important; }
            /* rodapé (sticky submit): faixa integrada ao card + botão Search no acento, à direita */
            html.smg-search-form form.block .formSubmitRow { display: block !important; margin: 0 !important; border: 0 !important; }
            html.smg-search-form form.block .formSubmitRow > dt { display: none !important; }
            html.smg-search-form form.block .formSubmitRow > dd { display: block !important; padding: 0 !important; margin: 0 !important; }
            html.smg-search-form form.block .formSubmitRow-bar { background: var(--smg-s1) !important; border-top: 1px solid var(--smg-bd) !important; box-shadow: none !important; }
            html.smg-smg.smg-search-form form.block .formSubmitRow-bar { background: hsl(0 0% 12.5%) !important; }
            html.smg-search-form form.block .formSubmitRow-controls { display: flex; justify-content: flex-end; padding: var(--smg-sp-12) var(--smg-sp-24) !important; }
            html.smg-search-form form.block .formSubmitRow .button--primary {
                display: inline-flex !important; align-items: center; gap: var(--smg-sp-8); height: 44px; padding: 0 var(--smg-sp-24) !important;
                border: 0 !important; border-radius: var(--smg-r-12) !important; box-shadow: none !important;
                background: var(--smg-link-strong) !important; color: #fff !important;
                font-size: var(--smg-fs-14) !important; font-weight: 700 !important;
                transition: filter var(--smg-dur-15) ease, transform var(--smg-dur-12) ease;
            }
            html.smg-search-form form.block .formSubmitRow .button--primary:hover { filter: brightness(1.1); }
            html.smg-search-form form.block .formSubmitRow .button--primary:active { transform: scale(0.97); }
            @media (max-width: 600px) {
                .smg-search-bar { gap: var(--smg-sp-6); }   /* barra mais apertada com os ícones */
                #smg-rs-panel { margin-top: var(--smg-sp-10); }
                #smg-rs-panel .smg-search-bar { height: 48px; }
                html.smg-search-page .block-row.block-row--separated { padding: var(--smg-sp-12) var(--smg-sp-14) !important; border-radius: var(--smg-r-12) !important; }
                html.smg-search-page .block-row .contentRow { gap: var(--smg-sp-10) !important; }
                html.smg-search-form form.block .block-body { padding: var(--smg-sp-16) var(--smg-sp-16) var(--smg-sp-18) !important; gap: var(--smg-sp-18); }
                html.smg-search-form .block-tabHeader { padding: var(--smg-sp-2) var(--smg-sp-6) 0 !important; }
                html.smg-search-form .block-tabHeader .tabs-tab { height: 44px; padding: 0 var(--smg-sp-10); font-size: var(--smg-fs-13) !important; }
                html.smg-search-form form.block .formSubmitRow-controls { padding: var(--smg-sp-12) var(--smg-sp-16) !important; }
                html.smg-search-form form.block .formSubmitRow .button--primary { flex: 1 1 auto; justify-content: center; }   /* botão full-width (alvo de toque) */
            }

            /* ---- search em modo DROPDOWN (desktop): ancorado abaixo do input REAL da topbar, sem backdrop escuro ---- */
            #smg-search-overlay.smg-search-overlay--drop {
                background: transparent; -webkit-backdrop-filter: none; backdrop-filter: none; pointer-events: none;   /* não bloqueia a página nem o input da topbar */
            }
            #smg-search-pop.smg-search-pop--drop {
                position: fixed; transform: none; margin: 0;   /* top/left/width vêm inline do JS (ancorado ao input) */
                width: 480px; max-width: calc(100vw - 16px); max-height: min(85vh, 760px);
                padding: var(--smg-sp-16) var(--smg-sp-18) 0; gap: var(--smg-sp-14); border-radius: var(--smg-r-16);   /* sem padding-bottom: o footer "Ver todos" cola no fundo (sticky) */
                pointer-events: auto;
            }
            #smg-search-overlay.open #smg-search-pop.smg-search-pop--drop { transform: none; }   /* sem o scale do modal; só o fade de opacity */
            .smg-search-pop--drop .smg-search-bar { display: none; }   /* no dropdown o input fica na topbar, não no pop */
            .smg-search-pop--drop .smg-search-go { display: none; }    /* o Buscar foi pro input da topbar (sobra Avançado + dica no rodapé) */

            /* histórico de buscas */
            .smg-search-history { display: flex; flex-direction: column; gap: var(--smg-sp-6); padding-top: var(--smg-sp-2); }
            .smg-search-history[hidden] { display: none !important; margin: 0 !important; padding: 0 !important; height: 0 !important; }
            /* estado vazio (sem histórico): evita o dropdown virar um toco só com a toolbar */
            .smg-search-empty { display: flex; flex-direction: column; align-items: center; gap: var(--smg-sp-8); padding: var(--smg-sp-32) var(--smg-sp-16) var(--smg-sp-32); text-align: center; }
            .smg-search-empty-ic { display: flex; align-items: center; justify-content: center; width: 46px; height: 46px; border-radius: var(--smg-r-14); background: var(--smg-w-06); color: var(--smg-w-40); margin-bottom: var(--smg-sp-2); }
            .smg-search-empty-ic svg { width: 22px; height: 22px; fill: none; }
            .smg-search-empty-t { font-size: var(--smg-fs-15); font-weight: 600; color: var(--smg-w-72); }
            .smg-search-empty-s { font-size: var(--smg-fs-13); color: var(--smg-w-40); }
            .smg-search-empty-hint { display: flex; gap: var(--smg-sp-6); flex-wrap: wrap; justify-content: center; margin-top: var(--smg-sp-12); }
            .smg-search-empty-hint code { padding: var(--smg-sp-4) var(--smg-sp-8); border-radius: var(--smg-r-6); background: var(--smg-w-08); color: var(--smg-link); font: 600 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; }
            .smg-search-hist-head { display: flex; align-items: center; gap: var(--smg-sp-8); margin-bottom: var(--smg-sp-4); }
            .smg-search-hist-title { font-size: var(--smg-fs-11); font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: var(--smg-w-40); }
            .smg-search-hist-badge { padding: var(--smg-sp-2) var(--smg-sp-8); border-radius: var(--smg-r-pill); background: var(--smg-w-08); color: var(--smg-w-50); font-size: var(--smg-fs-11); font-weight: 700; font-variant-numeric: tabular-nums; }
            .smg-search-hist-clear {
                margin-left: auto; padding: var(--smg-sp-6) var(--smg-sp-10); border-radius: var(--smg-r-8); border: none;
                background: transparent; color: var(--smg-w-55); font-size: var(--smg-fs-12); font-weight: 600; cursor: pointer;
                transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease;
            }
            .smg-search-hist-clear:hover { background: var(--smg-w-08); color: #fff; }
            .smg-search-hist-list { display: flex; flex-direction: column; gap: var(--smg-sp-2); }
            .smg-search-hist-item {
                display: flex; align-items: center; gap: var(--smg-sp-12); width: 100%;
                padding: var(--smg-sp-8) var(--smg-sp-10); border-radius: var(--smg-r-12); border: none; cursor: pointer; text-align: left;
                background: transparent; color: #fff; transition: background var(--smg-dur-12) ease;
            }
            .smg-search-hist-item:hover { background: var(--smg-w-08); }
            .smg-search-hist-ico {
                flex: 0 0 auto; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
                border-radius: var(--smg-r-10); background: var(--smg-w-06); color: var(--smg-w-55);
            }
            .smg-search-hist-ico svg { width: 16px; height: 16px; fill: none; }
            .smg-search-hist-q { flex: 1 1 auto; min-width: 0; font-size: var(--smg-fs-14); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .smg-search-hist-meta { flex: 0 0 auto; font-size: var(--smg-fs-12); color: var(--smg-w-40); white-space: nowrap; }
            .smg-search-hist-remove {
                flex: 0 0 auto; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
                border-radius: var(--smg-r-8); border: none; background: transparent; color: var(--smg-w-40); cursor: pointer;
                opacity: 0; transition: opacity var(--smg-dur-12) ease, background var(--smg-dur-12) ease, color var(--smg-dur-12) ease;
            }
            .smg-search-hist-item:hover .smg-search-hist-remove { opacity: 1; }
            .smg-search-hist-remove:hover { background: var(--smg-w-14); color: #fff; }
            .smg-search-hist-remove svg { width: 14px; height: 14px; fill: none; }
            /* ações por linha do histórico: ↖ mandar pra barra · ↗ abrir no outro fórum · × remover (aparecem no hover da linha) */
            .smg-search-hist-acts { flex: 0 0 auto; display: flex; align-items: center; gap: var(--smg-sp-2); }
            .smg-search-hist-act {
                flex: 0 0 auto; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
                border-radius: var(--smg-r-8); border: none; background: transparent; color: var(--smg-w-40); cursor: pointer;
                opacity: 0; transition: opacity var(--smg-dur-12) ease, background var(--smg-dur-12) ease, color var(--smg-dur-12) ease;
            }
            .smg-search-hist-item:hover .smg-search-hist-act { opacity: 1; }
            .smg-search-hist-act:hover { background: var(--smg-w-14); color: #fff; }
            .smg-search-hist-act svg { width: 14px; height: 14px; fill: none; }
            /* resultados da busca INLINE (mostrados no próprio dropdown) */
            .smg-search-results { display: flex; flex-direction: column; gap: var(--smg-sp-2); }
            .smg-search-results-list { display: flex; flex-direction: column; gap: var(--smg-sp-2); width: 100%; }
            .smg-search-chips-row {
                display: flex; flex-wrap: nowrap; align-items: center; gap: var(--smg-sp-6);
                flex: 0 0 auto; min-height: 44px; box-sizing: border-box;
                overflow-x: auto; overflow-y: hidden; padding: var(--smg-sp-8) var(--smg-sp-6);
                margin-bottom: var(--smg-sp-4);
                border-bottom: 1px solid var(--smg-w-06);
                scrollbar-width: none; -webkit-overflow-scrolling: touch;
            }
            .smg-search-chips-row::-webkit-scrollbar { display: none; }
            .smg-search-result-chip {
                flex: 0 0 auto; display: inline-flex; align-items: center; gap: var(--smg-sp-6);
                height: 28px; padding: 0 var(--smg-sp-10); border-radius: var(--smg-r-pill);
                border: 1px solid var(--smg-w-10); background: var(--smg-w-06);
                color: var(--smg-w-72); font-size: var(--smg-fs-12); font-weight: 600;
                cursor: pointer; white-space: nowrap; transition: all var(--smg-dur-15) ease;
            }
            .smg-search-result-chip:hover { background: var(--smg-w-12); color: #fff; border-color: var(--smg-w-22); }
            .smg-search-result-chip.is-active {
                background: var(--smg-link); color: #fff;
                border-color: var(--smg-link); font-weight: 700;
                box-shadow: 0 2px 8px rgba(255,119,178,0.3);
            }
            .smg-search-result-chip .smg-chip-count {
                padding: var(--smg-sp-2) var(--smg-sp-6); border-radius: var(--smg-r-pill);
                background: var(--smg-k-25); font-size: var(--smg-fs-11); font-weight: 700; line-height: 1;
            }
            .smg-search-result-chip.is-active .smg-chip-count { background: var(--smg-w-22); color: #fff; }
            .smg-search-rloading { display: flex; align-items: center; justify-content: center; padding: var(--smg-sp-28) 0; }
            .smg-search-noresults { padding: var(--smg-sp-18) var(--smg-sp-4); text-align: center; font-size: var(--smg-fs-14); color: var(--smg-w-50); }
            .smg-search-result {
                display: flex; flex-direction: row; align-items: flex-start; gap: var(--smg-sp-12);
                padding: var(--smg-sp-10) var(--smg-sp-12); border-radius: var(--smg-r-12); text-decoration: none; color: #fff;
                transition: background var(--smg-dur-12) ease;
            }
            .smg-search-result:hover { background: var(--smg-w-08); }
            /* mata o underline FEIO do hover: o XF tem a:hover{text-decoration:underline} global → vazava na linha
               inteira do resultado E nos itens da nav central (Timeline/Following também são <a>). Escopado aos 2 containers. */
            #smg-topbar-wrap a, #smg-topbar-wrap a:hover, #smg-topbar-wrap a:focus,
            #smg-search-pop a, #smg-search-pop a:hover, #smg-search-pop a:focus { text-decoration: none !important; }
            .smg-search-result-fig { flex: 0 0 auto; width: 110px; height: 74px; border-radius: var(--smg-r-10); overflow: hidden; background: var(--smg-w-06); }
            .smg-search-result-fig img { width: 100% !important; height: 100% !important; object-fit: cover; display: block; transition: transform var(--smg-dur-30) cubic-bezier(.2,.7,.3,1); }
            .smg-search-result:hover .smg-search-result-fig img { transform: scale(1.06); }   /* zoom sutil da thumb no hover (igual aos cards da home) */
            .smg-search-result-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: var(--smg-sp-4); }
            .smg-search-result-titlerow { display: flex; align-items: center; gap: var(--smg-sp-6); min-width: 0; flex-wrap: wrap; overflow: visible; padding: var(--smg-sp-2) 0 var(--smg-sp-2); }
            .smg-search-result-titlerow .label,
            .smg-search-result-titlerow .prefix,
            .smg-search-result-titlerow .labelLink { flex: 0 0 auto; overflow: visible !important; line-height: 1.25 !important; }
            .smg-search-result-title { font-size: var(--smg-fs-16); font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
            .smg-search-result-snippet { font-size: var(--smg-fs-14); line-height: 1.45; color: var(--smg-w-72); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            .smg-search-result-meta { font-size: var(--smg-fs-13); color: var(--smg-w-40); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            /* highlight do termo buscado (title + snippet) */
            .smg-search-result mark.smg-search-hl { background: rgba(255,205,70,0.30); color: #fff; border-radius: var(--smg-r-4); padding: 0 var(--smg-sp-2); font-weight: 700; }
            .smg-search-pop--drop .smg-search-history { padding-bottom: var(--smg-sp-12); }   /* sem footer (mostrando histórico) → respiro no fundo */
            /* lista SEMPRE scrollável (substituiu o "Show all" e a paginação ‹ ›) — chunks renderizam conforme rola */
            .smg-search-hist-list--scroll {
                max-height: min(46vh, 340px); overflow-y: auto;
                overflow-x: hidden !important; width: 100%; box-sizing: border-box;
                overscroll-behavior: contain;   /* o fim da lista não rola a página/pop por trás */
                padding-right: var(--smg-sp-4);
            }
            .smg-search-hist-list--scroll::-webkit-scrollbar { width: 8px; }
            .smg-search-hist-list--scroll::-webkit-scrollbar-thumb { background: var(--smg-w-14); border-radius: var(--smg-r-4); }

            #smg-search-pop .smg-search-results,
            #smg-search-pop .smg-search-history,
            .smg-search-history,
            .smg-search-hist-list {
                overflow-x: hidden !important;
                max-width: 100% !important;
                box-sizing: border-box !important;
            }
            /* lupa: ringue um tico mais fino + garante sem preenchimento */
            #smg-thread-search .smg-nav-ico svg {
                fill: none;
                stroke-width: 2;
            }
`;