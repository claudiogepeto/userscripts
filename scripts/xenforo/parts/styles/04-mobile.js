    // STYLE CONTEXT: Mobile navigation, search and responsive controls
    const CSS_MOBILE = `/* ============================================================
               MOBILE: search + filtros viram BOTTOM SHEETS (modernos)
               ============================================================ */
            @media (max-width: 600px) {
                /* scrim aparece quando um popover do dock está aberto */
                #smg-post-nav-wrapper.settings-open .smg-dock-backdrop,
                #smg-post-nav-wrapper.listfilter-open .smg-dock-backdrop,
                #smg-post-nav-wrapper.listsort-open .smg-dock-backdrop {
                    opacity: 1; visibility: visible; pointer-events: auto;
                }

                /* config / filtro por autor / filtro da listagem: ancorados embaixo, full-width.
                   opacity fixa em 1 → slide puro (sem fade ao fechar); show/hide via transform + pointer-events */
                #smg-settings-pop, #smg-listfilter-pop, #smg-listsort-pop {
                    position: fixed; left: 0; right: 0; bottom: 0; top: auto;
                    width: 100%; max-width: 100%; max-height: 86vh; max-height: 86dvh; z-index: var(--smg-z-20);
                    border: none; border-top: 1px solid var(--smg-w-10);
                    border-radius: var(--smg-r-20) var(--smg-r-20) 0 0;
                    padding: var(--smg-sp-10) var(--smg-sp-18) calc(20px + env(safe-area-inset-bottom));
                    gap: var(--smg-sp-14); opacity: 1;
                    transform: translateY(100%);
                    transition: transform var(--smg-dur-30) cubic-bezier(.2,.85,.25,1);
                    box-shadow: 0 -16px 50px var(--smg-k-62);
                }
                #smg-post-nav-wrapper.settings-open #smg-settings-pop,
                #smg-post-nav-wrapper.listfilter-open #smg-listfilter-pop,
                #smg-post-nav-wrapper.listsort-open #smg-listsort-pop {
                    transform: translateY(0);
                }

                /* search: bottom sheet com uma barra de entrada única e filtros em grid.
                   A primeira versão deixava os controles quebrarem dentro do input, o que
                   criava uma segunda linha instável em telas estreitas. */
                #smg-search-pop {
                    position: fixed !important; inset: auto !important;
                    top: var(--smg-kb-top, 0px) !important; bottom: auto !important; left: 0 !important; right: 0 !important;
                    width: 100vw !important; max-width: 100vw !important;
                    /* --smg-kb-h vem do visualViewport: com o teclado aberto o sheet encolhe
                       até a área visível e o input (order 3) fica acima do teclado */
                    height: var(--smg-kb-h, 100dvh) !important; max-height: var(--smg-kb-h, 100dvh) !important;
                    padding: calc(10px + env(safe-area-inset-top)) var(--smg-sp-16) calc(12px + env(safe-area-inset-bottom)) var(--smg-sp-16) !important;
                    border: none !important; border-radius: 0 !important;
                    box-sizing: border-box !important;
                    display: flex !important; flex-direction: column !important; justify-content: flex-end !important;
                    transform: translateY(100%);
                    transition: transform var(--smg-dur-30) cubic-bezier(.2,.85,.25,1), opacity var(--smg-dur-20) ease;
                }
                #smg-search-overlay.open #smg-search-pop { opacity: 1; transform: translateY(0); }
                #smg-search-pop.is-kb { padding-bottom: var(--smg-sp-12) !important; }
                #smg-search-pop::before { display: none !important; }

                /* Barra de busca na BASE (thumb-friendly) colada aos filtros */
                #smg-search-pop .smg-search-bar {
                    order: 3 !important;
                    flex: 0 0 50px !important; height: 50px !important; min-height: 50px !important;
                    width: 100% !important;
                    display: flex !important; flex-wrap: nowrap !important; align-items: center !important;
                    gap: var(--smg-sp-10); margin: var(--smg-sp-2) 0 0 0 !important; padding: 0 var(--smg-sp-8) 0 var(--smg-sp-14);
                    border-radius: var(--smg-r-16); background: var(--smg-w-08);
                    border-color: var(--smg-w-14);
                    box-shadow: var(--smg-hl);
                }
                #smg-search-pop .smg-search-lupa { flex: 0 0 auto; color: var(--smg-link); }
                #smg-search-pop .smg-search-lupa svg { width: 19px; height: 19px; }
                #smg-search-pop .smg-search-input {
                    flex: 1 1 auto !important; min-width: 0 !important; width: auto !important;
                    height: 100% !important; font-size: var(--smg-fs-16); font-weight: 500;
                }
                #smg-search-pop .smg-search-chip {
                    flex: 0 1 42%; max-width: 42%; min-width: 0; height: 32px;
                    margin: 0; padding: 0 var(--smg-sp-6) 0 var(--smg-sp-8); border-radius: var(--smg-r-10);
                }
                #smg-search-pop .smg-search-chip-t { min-width: 0; font-size: var(--smg-fs-12); }
                #smg-search-pop .smg-search-acts {
                    flex: 0 0 auto !important; width: auto !important; padding: 0 !important;
                    border-top: 0 !important; gap: 0;
                }
                #smg-search-pop .smg-search-close {
                    width: 40px; height: 40px; min-width: 40px; padding: 0;
                    border: 0; border-radius: var(--smg-r-12); background: transparent;
                    color: var(--smg-w-60);
                }
                #smg-search-pop .smg-search-close:hover { background: var(--smg-w-10); color: #fff; }

                /* Toolbar de filtros ACIMA da barra de busca, coladinha */
                #smg-search-pop .smg-search-global-toolbar {
                    order: 2 !important;
                    flex: 0 0 auto !important; min-height: 0 !important; width: 100% !important; height: auto;
                    margin: auto 0 0 0 !important; padding: var(--smg-sp-6) 0 var(--smg-sp-4) !important;
                    border-top: 1px solid var(--smg-w-08) !important;
                    border-bottom: none !important;
                    gap: 0; overflow: visible !important;
                }
                #smg-search-pop .smg-search-tb-row {
                    display: flex !important; flex-wrap: nowrap !important;
                    align-items: center !important; gap: var(--smg-sp-6) !important; width: 100%;
                }
                /* Dropdowns viram ICON ONLY monocromáticos no mobile */
                #smg-search-pop .smg-search-select-wrap {
                    position: relative !important; flex: 0 0 38px !important;
                    width: 38px !important; height: 38px !important; min-width: 38px !important; max-width: 38px !important;
                    border-radius: var(--smg-r-10) !important; background: var(--smg-w-06) !important;
                    border: 1px solid var(--smg-w-14) !important;
                    display: flex !important; align-items: center !important; justify-content: center !important;
                    box-sizing: border-box !important;
                }
                #smg-search-pop .smg-search-select-wrap .smg-search-select-ic {
                    position: static !important;
                    display: flex !important; align-items: center; justify-content: center;
                    width: 100% !important; height: 100% !important;
                    pointer-events: none; color: var(--smg-w-85) !important;
                }
                #smg-search-pop .smg-search-select-wrap .smg-search-select-ic svg {
                    width: 17px !important; height: 17px !important; fill: none !important;
                }
                #smg-search-pop .smg-search-select-wrap select {
                    position: absolute !important; inset: 0 !important;
                    width: 100% !important; height: 100% !important; opacity: 0 !important;
                    cursor: pointer !important; -webkit-appearance: none !important; appearance: none !important;
                    z-index: var(--smg-z-2) !important; padding: 0 !important; margin: 0 !important;
                }
                #smg-search-pop .smg-ios-toggle {
                    flex: 0 0 auto !important; width: auto !important; min-width: 0 !important;
                    height: 38px !important; min-height: 38px !important; padding: 0 var(--smg-sp-8) !important;
                    gap: var(--smg-sp-6) !important; border-radius: var(--smg-r-10) !important;
                    background: var(--smg-w-04) !important; border: 1px solid var(--smg-w-14) !important;
                }
                #smg-search-pop .smg-ios-label {
                    font-size: var(--smg-fs-12) !important; white-space: nowrap !important;
                }
                /* Autor icon-only trigger e row expansível no mobile */
                #smg-search-pop .smg-search-author-trigger {
                    flex: 0 0 38px !important; width: 38px !important; height: 38px !important;
                    min-width: 38px !important; max-width: 38px !important; border-radius: var(--smg-r-10) !important;
                    background: var(--smg-w-06) !important; border: 1px solid var(--smg-w-14) !important;
                    padding: 0 !important; display: inline-flex !important; align-items: center !important; justify-content: center !important;
                }
                #smg-search-pop .smg-search-author-trigger.has-value {
                    background: var(--smg-link-soft) !important;
                    border-color: var(--smg-link) !important;
                    color: var(--smg-link) !important;
                }
                #smg-search-pop .smg-search-author-trigger svg {
                    width: 17px !important; height: 17px !important; fill: none !important;
                }
                #smg-search-pop .smg-search-global-toolbar.author-open .smg-search-author-row {
                    height: 40px !important; border-radius: var(--smg-r-12) !important;
                    padding: 0 var(--smg-sp-10) !important;
                }
                #smg-search-pop .smg-search-global-toolbar.author-open .smg-search-author-row .smg-search-author-inp {
                    font-size: var(--smg-fs-14) !important;
                }
                /* Spacer empurra os botões de config e avançado para a direita da tela (igual desktop) */
                #smg-search-pop .smg-search-tb-spacer {
                    display: block !important;
                    flex: 1 1 auto !important;
                    min-width: 4px !important;
                }
                #smg-search-pop .smg-search-tb-row .smg-search-cfg {
                    margin-left: auto !important;
                    flex: 0 0 38px !important; width: 38px !important; height: 38px !important;
                    min-width: 38px !important; max-width: 38px !important; border-radius: var(--smg-r-10) !important;
                    padding: 0 !important; display: inline-flex !important; align-items: center !important; justify-content: center !important;
                }
                #smg-search-pop .smg-search-tb-row .smg-search-adv {
                    flex: 0 0 38px !important; width: 38px !important; height: 38px !important;
                    min-width: 38px !important; max-width: 38px !important; border-radius: var(--smg-r-10) !important;
                    padding: 0 !important; display: inline-flex !important; align-items: center !important; justify-content: center !important;
                }
                #smg-search-pop .smg-search-tb-row .smg-search-adv span:first-child {
                    display: none !important;
                }
                #smg-search-pop .smg-search-tb-row .smg-search-adv .smg-ext-ic {
                    margin: 0 !important; display: flex !important; align-items: center; justify-content: center;
                }
                #smg-search-pop .smg-search-tb-row .smg-search-adv .smg-ext-ic svg {
                    width: 15px; height: 15px;
                }
                /* Resultados e histórico no TOPO (order: 1) rolando livremente */
                #smg-search-pop .smg-search-results,
                #smg-search-pop .smg-search-history,
                #smg-search-pop .smg-search-empty {
                    order: 1 !important;
                    flex: 1 1 auto !important; min-height: 0 !important;
                    max-height: none !important; padding-top: var(--smg-sp-6);
                    overflow-y: auto !important;
                }
                #smg-search-pop .smg-search-result { padding: var(--smg-sp-10) var(--smg-sp-6); gap: var(--smg-sp-10); border-radius: var(--smg-r-12); }
                #smg-search-pop .smg-search-result-fig { flex-basis: 78px; width: 78px; height: 58px; }
                #smg-search-pop .smg-search-result-title { font-size: var(--smg-fs-14); }
                #smg-search-pop .smg-search-result-snippet { font-size: var(--smg-fs-13); }
                #smg-search-pop .smg-search-result-meta { font-size: var(--smg-fs-11); }
                #smg-search-pop .smg-search-hist-head { padding: 0 var(--smg-sp-4); }
                #smg-search-pop .smg-search-hist-item { min-height: 44px; padding: var(--smg-sp-8) var(--smg-sp-6); }

                /* grip (puxador) no topo dos demais sheets (settings, filtro, ordenar) */
                #smg-settings-pop::before, #smg-listfilter-pop::before, #smg-listsort-pop::before {
                    content: ''; flex: 0 0 auto; width: 40px; height: 5px;
                    border-radius: var(--smg-r-pill); background: var(--smg-w-22);
                    margin: var(--smg-sp-2) auto var(--smg-sp-10);
                }

                /* alvos de toque maiores + cantos mais macios */
                .smg-lf-select, .smg-lf-input { height: 48px; font-size: var(--smg-fs-16); border-radius: var(--smg-r-14); }
                .smg-lf-apply { padding: var(--smg-sp-16); font-size: var(--smg-fs-16); border-radius: var(--smg-r-14); }
                .smg-chip { height: 40px; font-size: var(--smg-fs-14); }
            }
            /* botão da dock "ativo" (filtro/escolha ligada) */
            .smg-nav-btn.smg-active { background: var(--smg-link-strong); border-color: var(--smg-link-strong); color: #fff; }   /* toggle ativo (watch/filtro): acento fundo + texto branco */

            /* ---- scroll infinito: separador de página ---- */
            .smg-inf-sep { display: flex; align-items: center; justify-content: center; gap: var(--smg-sp-10); margin: var(--smg-sp-10) 0; color: rgba(127,127,127,0.85); font-size: var(--smg-fs-12); letter-spacing: .05em; text-transform: uppercase; }
            .smg-inf-sep::before, .smg-inf-sep::after { content: ""; height: 1px; flex: 1; background: linear-gradient(90deg, transparent, rgba(127,127,127,.4), transparent); }

            /* ---- listas (fórum / seguidas / busca): thumb maior + alinhamento ---- */
            .structItem--thread.smg-hidden, .smg-hidden { display: none !important; }
            html.smg-threadlist .structItem--thread,
            html.smg-threadlist .contentRow {
                display: flex !important;
                align-items: center !important;
                gap: var(--smg-sp-14) !important;
            }
            /* .dcThumbnail = simpcity (bg-image) · .dtt-thread-thumbnail = socialmediagirls (<img> real) */
            html.smg-threadlist .dcThumbnail,
            html.smg-threadlist .dtt-thread-thumbnail { width: 210px !important; height: 132px !important; border-radius: var(--smg-r-8) !important; flex: 0 0 auto !important; overflow: hidden !important; }
            html.smg-threadlist .dtt-thread-thumbnail img,
            html.smg-threadlist .dcThumbnail img { width: 100% !important; height: 100% !important; object-fit: cover !important; }
            html.smg-threadlist .structItem-cell--icon:not(.structItem-cell--iconEnd) { flex: 0 0 auto !important; width: auto !important; height: auto !important; }
            html.smg-threadlist .structItem-cell--main,
            html.smg-threadlist .contentRow-main { flex: 1 1 auto !important; min-width: 0 !important; text-align: left !important; }
            html.smg-threadlist .structItem-title,
            html.smg-threadlist .contentRow-title { font-size: var(--smg-fs-16) !important; line-height: 1.3 !important; }
            /* divisores internos das células (verticais) sem cor — mantém só o divisor entre os cards */
            html.smg-threadlist .structItem--thread .structItem-cell { border-color: transparent !important; }
            /* MOBILE: lista compacta — thumb menor, esconde a coluna de "último post" (espremia o título a ~0) */
            @media (max-width: 600px) {
                html.smg-threadlist .structItem--thread,
                html.smg-threadlist .contentRow { gap: var(--smg-sp-12) !important; align-items: flex-start !important; }
                html.smg-threadlist .dcThumbnail,
                html.smg-threadlist .dtt-thread-thumbnail { width: 92px !important; height: 70px !important; }
                html.smg-threadlist .structItem-cell--latest { display: none !important; }
                html.smg-threadlist .structItem-cell--main,
                html.smg-threadlist .contentRow-main { flex: 1 1 auto !important; min-width: 0 !important; width: auto !important; }
                html.smg-threadlist .structItem-title,
                html.smg-threadlist .structItem-title a,
                html.smg-threadlist .contentRow-title {
                    font-size: var(--smg-fs-15) !important; white-space: normal !important;
                    word-break: normal !important; overflow-wrap: break-word !important;
                }
            }

            /* ---- barra de paginação + ações: 1 linha, justify-between, no nosso estilo ---- */
            html.smg-threadlist .block-outer {
                display: flex !important; align-items: center !important;
                justify-content: space-between !important; flex-wrap: wrap !important; gap: var(--smg-sp-10) !important;
                margin-bottom: var(--smg-sp-12) !important;
            }
            html.smg-threadlist .block-outer-main { flex: 1 1 auto !important; min-width: 0 !important; }
            html.smg-threadlist .block-outer-opposite { flex: 0 0 auto !important; margin: 0 !important; }
            /* mobile: quebra em 2 linhas (paginação em cima, ações tipo "Mark Forums Read" embaixo) */
            @media (max-width: 600px) {
                html.smg-threadlist .block-outer { row-gap: var(--smg-sp-12) !important; }
                html.smg-threadlist .block-outer-main,
                html.smg-threadlist .block-outer-opposite {
                    flex: 1 1 100% !important; width: 100% !important; min-width: 0 !important;
                    display: flex !important; flex-wrap: wrap !important; justify-content: flex-start !important;
                }
                /* paginador: esconde o completo, mostra só o simples (evita duplicação) */
                html.smg-threadlist .pageNavWrapper .pageNav { display: none !important; }
            }
            /* pager encostado à esquerda (o XF centraliza por padrão) */
            html.smg-threadlist .pageNavWrapper,
            html.smg-threadlist .pageNav,
            html.smg-threadlist .pageNavSimple { justify-content: flex-start !important; margin: 0 !important; }
            html.smg-threadlist .pageNav { display: flex !important; gap: var(--smg-sp-6); }
            /* mostra só UM paginador (completo no desktop) — evita o pager completo + o "1 of N" juntos */
            html.smg-threadlist .pageNavWrapper .pageNavSimple { display: none !important; }
            html.smg-threadlist .pageNav-main {
                display: flex !important; flex-wrap: wrap; align-items: center;
                gap: var(--smg-sp-6) !important; margin: 0 !important; padding: 0 !important; list-style: none !important;
            }
            html.smg-threadlist .pageNav-page, html.smg-threadlist .pageNav-jump { margin: 0 !important; }
            /* pílulas no nosso estilo */
            html.smg-threadlist .pageNav-page > a,
            html.smg-threadlist .pageNav-jump,
            html.smg-threadlist .pageNavSimple-el {
                display: inline-flex !important; align-items: center; justify-content: center;
                box-sizing: border-box;
                font-weight: 600; text-decoration: none !important; line-height: 1;
                transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease, border-color var(--smg-dur-15) ease;
            }
            /* mata o "tracinho/indicador verde" do tema na página atual (fica no <li>, ::after e/ou borda) */
            html.smg-threadlist .pageNavWrapper .pageNav-page,
            html.smg-threadlist .pageNavWrapper .pageNav-page--current,
            html.smg-threadlist .pageNavWrapper .pageNav-page > a,
            html.smg-threadlist .pageNavWrapper .pageNav-page--current > a { box-shadow: none !important; }
            html.smg-threadlist .pageNavWrapper .pageNav-page--current { border: 0 !important; background: none !important; }
            html.smg-threadlist .pageNavWrapper .pageNav-page::before,
            html.smg-threadlist .pageNavWrapper .pageNav-page::after,
            html.smg-threadlist .pageNavWrapper .pageNav-page--current::before,
            html.smg-threadlist .pageNavWrapper .pageNav-page--current::after,
            html.smg-threadlist .pageNavWrapper .pageNav-page > a::before,
            html.smg-threadlist .pageNavWrapper .pageNav-page > a::after,
            html.smg-threadlist .pageNavWrapper .pageNav-page--current > a::before,
            html.smg-threadlist .pageNavWrapper .pageNav-page--current > a::after { content: none !important; display: none !important; border: 0 !important; background: none !important; }
            /* botões de ação (Mark Read / Watch / Manage…) no nosso estilo */
            html.smg-threadlist .block-outer-opposite .buttonGroup { display: flex !important; gap: var(--smg-sp-6) !important; }
            html.smg-threadlist .block-outer-opposite .button { color: var(--smg-w-85) !important; box-shadow: none !important; }
            html.smg-threadlist .block-outer-opposite .button:hover { color: #fff !important; }

            /* ---- SMG: paginador/barra do fórum = MESMO visual da thread ----
               (pílula 36/raio 10 · página atual BRANCA · setas viram ícone · números alinhados)
               scoped em .smg-smg (3 classes) → vence o .smg-threadlist genérico sem mexer no simpcity */
            html.smg-threadlist .pageNav-page > a,
            html.smg-threadlist .pageNav-jump,
            html.smg-threadlist .pageNavSimple-el {
                min-width: 36px !important; height: 36px !important; min-height: 36px !important; padding: 0 var(--smg-sp-14) !important;
                border-radius: var(--smg-r-10) !important; border: 1px solid var(--smg-bd) !important;
                background: var(--smg-s1) !important; color: var(--smg-w-85) !important; font-size: var(--smg-fs-14) !important;
            }
            html.smg-threadlist .pageNav-page > a:hover,
            html.smg-threadlist .pageNav-jump:hover,
            html.smg-threadlist .pageNavSimple-el:hover {
                background: var(--smg-s2) !important; border-color: var(--smg-bd2) !important; color: #fff !important;
            }
            html.smg-threadlist .pageNav-page--skip > a { background: var(--smg-s1) !important; border-color: var(--smg-bd) !important; }
            /* alinhamento vertical: números e seta centrados na mesma linha (mata o offset do <li>/<ul>) */
            html.smg-threadlist .pageNav { align-items: center !important; }
            html.smg-threadlist .pageNav-page { display: flex !important; align-items: center !important; margin: 0 !important; padding: 0 !important; line-height: 1 !important; }
            /* botões de ação (Mark read / Watch) no MESMO tamanho/raio da thread */
            html.smg-threadlist .block-outer-opposite .button {
                min-height: 36px !important; border-radius: var(--smg-r-10) !important;
                border: 1px solid var(--smg-bd) !important; background: var(--smg-s1) !important;
            }
            html.smg-threadlist .block-outer-opposite .button:hover { background: var(--smg-s2) !important; border-color: var(--smg-bd2) !important; }
            @media (max-width: 600px) {
                /* mobile: só o pager simples (depois do "none" do desktop, senão nunca aparece) */
                html.smg-threadlist .pageNavWrapper .pageNavSimple { display: flex !important; }
                /* mobile: pager simples sem primeiro/último (evita pílula vazia do «/») */
                html.smg-threadlist .pageNavSimple-el--first,
                html.smg-threadlist .pageNavSimple-el--last { display: none !important; }
            }

            `;
