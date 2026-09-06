    // STYLE CONTEXT: Mobile navigation, search and responsive controls
    const CSS_MOBILE = `/* ============================================================
               MOBILE: search + filtros viram BOTTOM SHEETS (modernos)
               ============================================================ */
            @media (max-width: 600px) {
                /* scrim aparece quando um popover do dock está aberto */
                #smg-post-nav-wrapper.settings-open .smg-dock-backdrop,
                #smg-post-nav-wrapper.filter-open .smg-dock-backdrop,
                #smg-post-nav-wrapper.listfilter-open .smg-dock-backdrop,
                #smg-post-nav-wrapper.listsort-open .smg-dock-backdrop {
                    opacity: 1; visibility: visible; pointer-events: auto;
                }

                /* config / filtro por autor / filtro da listagem: ancorados embaixo, full-width.
                   opacity fixa em 1 → slide puro (sem fade ao fechar); show/hide via transform + pointer-events */
                #smg-settings-pop, #smg-filter-pop, #smg-listfilter-pop, #smg-listsort-pop {
                    position: fixed; left: 0; right: 0; bottom: 0; top: auto;
                    width: 100%; max-width: 100%; max-height: 86vh; max-height: 86dvh; z-index: 20;
                    border: none; border-top: 1px solid rgba(255,255,255,0.1);
                    border-radius: 24px 24px 0 0;
                    padding: 10px 18px calc(20px + env(safe-area-inset-bottom));
                    gap: 14px; opacity: 1;
                    transform: translateY(100%);
                    transition: transform .32s cubic-bezier(.2,.85,.25,1);
                    box-shadow: 0 -16px 50px rgba(0,0,0,0.6);
                }
                #smg-post-nav-wrapper.settings-open #smg-settings-pop,
                #smg-post-nav-wrapper.filter-open #smg-filter-pop,
                #smg-post-nav-wrapper.listfilter-open #smg-listfilter-pop,
                #smg-post-nav-wrapper.listsort-open #smg-listsort-pop {
                    transform: translateY(0);
                }

                /* search: bottom sheet com uma barra de entrada única e filtros em grid.
                   A primeira versão deixava os controles quebrarem dentro do input, o que
                   criava uma segunda linha instável em telas estreitas. */
                #smg-search-pop {
                    top: auto; bottom: 0; left: 0; right: 0;
                    width: 100%; max-width: 100%; max-height: min(90vh, 760px); max-height: min(90dvh, 760px);
                    padding: 0 16px calc(16px + env(safe-area-inset-bottom));
                    border: none; border-top: 1px solid rgba(255,255,255,0.1);
                    border-radius: 24px 24px 0 0;
                    transform: translateY(100%);
                    transition: transform .32s cubic-bezier(.2,.85,.25,1), opacity .2s ease;
                }
                #smg-search-overlay.open #smg-search-pop { opacity: 1; transform: translateY(0); }

                #smg-search-pop .smg-search-bar {
                    flex: 0 0 54px !important; height: 54px !important; min-height: 54px !important;
                    display: flex !important; flex-wrap: nowrap !important; align-items: center !important;
                    gap: 9px; margin: 0; padding: 0 7px 0 14px;
                    border-radius: 16px; background: rgba(255,255,255,0.07);
                    border-color: rgba(255,255,255,0.14);
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
                }
                #smg-search-pop .smg-search-lupa { flex: 0 0 auto; color: var(--smg-link, #ff77b2); }
                #smg-search-pop .smg-search-lupa svg { width: 19px; height: 19px; }
                #smg-search-pop .smg-search-input {
                    flex: 1 1 auto !important; min-width: 0 !important; width: auto !important;
                    height: 100% !important; font-size: 17px; font-weight: 500;
                }
                #smg-search-pop .smg-search-chip {
                    flex: 0 1 42%; max-width: 42%; min-width: 0; height: 32px;
                    margin: 0; padding: 0 5px 0 8px; border-radius: 9px;
                }
                #smg-search-pop .smg-search-chip-t { min-width: 0; font-size: 12px; }
                #smg-search-pop .smg-search-acts {
                    flex: 0 0 auto !important; width: auto !important; padding: 0 !important;
                    border-top: 0 !important; gap: 0;
                }
                #smg-search-pop .smg-search-close {
                    width: 40px; height: 40px; min-width: 40px; padding: 0;
                    border: 0; border-radius: 12px; background: transparent;
                    color: rgba(255,255,255,0.62);
                }
                #smg-search-pop .smg-search-close:hover { background: rgba(255,255,255,0.1); color: #fff; }

                #smg-search-pop .smg-search-global-toolbar {
                    flex: 0 0 auto !important; min-height: 0 !important; width: auto; height: auto;
                    margin: 0; padding: 12px 0 14px; border-bottom: 1px solid rgba(255,255,255,0.08);
                    gap: 0; overflow: visible !important;
                }
                #smg-search-pop .smg-search-tb-row {
                    display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr));
                    align-items: center; gap: 8px; width: 100%; flex-wrap: nowrap;
                }
                #smg-search-pop .smg-search-select-wrap { min-width: 0; width: 100%; }
                #smg-search-pop .smg-search-select-wrap select {
                    width: 100%; min-width: 0; height: 44px; padding: 0 28px 0 11px;
                    border-radius: 12px; font-size: 13px; font-weight: 650;
                    background-color: rgba(255,255,255,0.055); border-color: rgba(255,255,255,0.13);
                    text-overflow: ellipsis;
                }
                #smg-search-pop .smg-search-badges-slot {
                    grid-column: 1 / -1; width: 100%; min-width: 0; margin-top: 0;
                }
                #smg-search-pop .smg-search-badges-slot .smg-multiselect-container { display: flex; width: 100%; }
                #smg-search-pop .smg-search-badges-slot .smg-multiselect-btn {
                    width: 100%; height: 44px; justify-content: flex-start; padding: 0 12px;
                    border-radius: 12px; font-size: 13.5px; background: rgba(255,255,255,0.055);
                    border-color: rgba(255,255,255,0.13);
                }
                #smg-search-pop .smg-search-badges-slot .smg-multiselect-btn-arrow { margin-left: auto; }
                #smg-search-pop .smg-ios-toggle {
                    min-width: 0; width: 100%; min-height: 44px; height: 44px; justify-content: center;
                    gap: 8px; padding: 0 8px; border: 1px solid rgba(255,255,255,0.13);
                    border-radius: 12px; background: rgba(255,255,255,0.04);
                }
                #smg-search-pop .smg-ios-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; }
                #smg-search-pop .smg-search-author-box {
                    min-width: 0; width: 100%; height: 44px; padding: 0 11px; border-radius: 12px;
                    gap: 7px; background: rgba(255,255,255,0.055); border-color: rgba(255,255,255,0.13);
                }
                #smg-search-pop .smg-search-author-inp {
                    flex: 1 1 auto; min-width: 0; width: auto; font-size: 13.5px;
                }
                #smg-search-pop .smg-search-tb-spacer { display: none; }
                #smg-search-pop .smg-search-tb-row .smg-search-cfg,
                #smg-search-pop .smg-search-tb-row .smg-search-adv {
                    width: 100%; min-width: 0; height: 44px; justify-content: center;
                    border-radius: 12px; font-size: 13px;
                }
                #smg-search-pop .smg-search-results,
                #smg-search-pop .smg-search-history {
                    flex: 1 1 auto !important; min-height: 0 !important;
                    max-height: none !important; padding-top: 6px;
                }
                #smg-search-pop .smg-search-result { padding: 10px 6px; gap: 9px; border-radius: 12px; }
                #smg-search-pop .smg-search-result-fig { flex-basis: 78px; width: 78px; height: 58px; }
                #smg-search-pop .smg-search-result-title { font-size: 14px; }
                #smg-search-pop .smg-search-result-snippet { font-size: 12.5px; }
                #smg-search-pop .smg-search-result-meta { font-size: 11px; }
                #smg-search-pop .smg-search-hist-head { padding: 0 4px; }
                #smg-search-pop .smg-search-hist-item { min-height: 44px; padding: 8px 6px; }

                /* grip (puxador) no topo de cada sheet */
                #smg-search-pop::before, #smg-settings-pop::before,
                #smg-filter-pop::before, #smg-listfilter-pop::before, #smg-listsort-pop::before {
                    content: ''; flex: 0 0 auto; width: 40px; height: 5px;
                    border-radius: 999px; background: rgba(255,255,255,0.25);
                    margin: 2px auto 10px;
                }

                /* alvos de toque maiores + cantos mais macios */
                .smg-lf-select, .smg-lf-input { height: 48px; font-size: 16px; border-radius: 13px; }
                .smg-lf-apply { padding: 15px; font-size: 16px; border-radius: 14px; }
                .smg-filter-input { height: 48px; font-size: 16px; border-radius: 13px; }
                .smg-filter-apply, .smg-filter-clear { height: 48px; font-size: 15px; border-radius: 13px; }
                .smg-chip, .smg-filter-chip { height: 40px; font-size: 14px; }
                .smg-set-list { max-height: 60vh; }
            }
            /* botão da dock "ativo" (filtro/escolha ligada) */
            .smg-nav-btn.smg-active { background: var(--smg-link-strong, #d14d8f); border-color: var(--smg-link-strong, #d14d8f); color: #fff; }   /* toggle ativo (watch/filtro): acento fundo + texto branco */

            /* ---- scroll infinito: separador de página ---- */
            .smg-inf-sep { display: flex; align-items: center; justify-content: center; gap: 10px; margin: 10px 0; color: rgba(127,127,127,0.85); font-size: 12px; letter-spacing: .05em; text-transform: uppercase; }
            .smg-inf-sep::before, .smg-inf-sep::after { content: ""; height: 1px; flex: 1; background: linear-gradient(90deg, transparent, rgba(127,127,127,.4), transparent); }

            /* ---- listas (fórum / seguidas / busca): thumb maior + alinhamento ---- */
            .structItem--thread.smg-hidden, .smg-watched-card.smg-hidden, .smg-hidden { display: none !important; }
            html.smg-threadlist .structItem--thread,
            html.smg-threadlist .contentRow {
                display: flex !important;
                align-items: center !important;
                gap: 14px !important;
            }
            /* .dcThumbnail = simpcity (bg-image) · .dtt-thread-thumbnail = socialmediagirls (<img> real) */
            html.smg-threadlist .dcThumbnail,
            html.smg-threadlist .dtt-thread-thumbnail { width: 210px !important; height: 132px !important; border-radius: 8px !important; flex: 0 0 auto !important; overflow: hidden !important; }
            html.smg-threadlist .dtt-thread-thumbnail img,
            html.smg-threadlist .dcThumbnail img { width: 100% !important; height: 100% !important; object-fit: cover !important; }
            html.smg-threadlist .structItem-cell--icon:not(.structItem-cell--iconEnd) { flex: 0 0 auto !important; width: auto !important; height: auto !important; }
            html.smg-threadlist .structItem-cell--main,
            html.smg-threadlist .contentRow-main { flex: 1 1 auto !important; min-width: 0 !important; text-align: left !important; }
            html.smg-threadlist .structItem-title,
            html.smg-threadlist .contentRow-title { font-size: 16px !important; line-height: 1.3 !important; }
            /* divisores internos das células (verticais) sem cor — mantém só o divisor entre os cards */
            html.smg-threadlist .structItem--thread .structItem-cell { border-color: transparent !important; }
            /* MOBILE: lista compacta — thumb menor, esconde a coluna de "último post" (espremia o título a ~0) */
            @media (max-width: 600px) {
                html.smg-threadlist .structItem--thread,
                html.smg-threadlist .contentRow { gap: 11px !important; align-items: flex-start !important; }
                html.smg-threadlist .dcThumbnail,
                html.smg-threadlist .dtt-thread-thumbnail { width: 92px !important; height: 70px !important; }
                html.smg-threadlist .structItem-cell--latest { display: none !important; }
                html.smg-threadlist .structItem-cell--main,
                html.smg-threadlist .contentRow-main { flex: 1 1 auto !important; min-width: 0 !important; width: auto !important; }
                html.smg-threadlist .structItem-title,
                html.smg-threadlist .structItem-title a,
                html.smg-threadlist .contentRow-title {
                    font-size: 14.5px !important; white-space: normal !important;
                    word-break: normal !important; overflow-wrap: break-word !important;
                }
            }

            /* ---- barra de paginação + ações: 1 linha, justify-between, no nosso estilo ---- */
            html.smg-threadlist .block-outer {
                display: flex !important; align-items: center !important;
                justify-content: space-between !important; flex-wrap: wrap !important; gap: 10px !important;
                margin-bottom: 12px !important;
            }
            html.smg-threadlist .block-outer-main { flex: 1 1 auto !important; min-width: 0 !important; }
            html.smg-threadlist .block-outer-opposite { flex: 0 0 auto !important; margin: 0 !important; }
            /* mobile: quebra em 2 linhas (paginação em cima, ações tipo "Mark Forums Read" embaixo) */
            @media (max-width: 600px) {
                html.smg-threadlist .block-outer { row-gap: 12px !important; }
                html.smg-threadlist .block-outer-main,
                html.smg-threadlist .block-outer-opposite {
                    flex: 1 1 100% !important; width: 100% !important; min-width: 0 !important;
                    display: flex !important; flex-wrap: wrap !important; justify-content: flex-start !important;
                }
                /* paginador: esconde o completo, mostra só o simples (evita duplicação) */
                html.smg-threadlist .pageNavWrapper .pageNav { display: none !important; }
                html.smg-threadlist .pageNavWrapper .pageNavSimple { display: flex !important; }
            }
            /* pager encostado à esquerda (o XF centraliza por padrão) */
            html.smg-threadlist .pageNavWrapper,
            html.smg-threadlist .pageNav,
            html.smg-threadlist .pageNavSimple { justify-content: flex-start !important; margin: 0 !important; }
            html.smg-threadlist .pageNav { display: flex !important; align-items: center; gap: 6px; }
            /* mostra só UM paginador (completo no desktop) — evita o pager completo + o "1 of N" juntos */
            html.smg-threadlist .pageNavWrapper .pageNavSimple { display: none !important; }
            html.smg-threadlist .pageNav-main {
                display: flex !important; flex-wrap: wrap; align-items: center;
                gap: 6px !important; margin: 0 !important; padding: 0 !important; list-style: none !important;
            }
            html.smg-threadlist .pageNav-page, html.smg-threadlist .pageNav-jump { margin: 0 !important; }
            /* pílulas no nosso estilo */
            html.smg-threadlist .pageNav-page > a,
            html.smg-threadlist .pageNav-jump,
            html.smg-threadlist .pageNavSimple-el {
                display: inline-flex !important; align-items: center; justify-content: center;
                min-width: 34px; height: 34px; padding: 0 11px; box-sizing: border-box;
                border-radius: 9px !important; border: 1px solid rgba(255,255,255,0.08) !important;
                background: rgba(255,255,255,0.05) !important; color: rgba(255,255,255,0.85) !important;
                font-size: 14px; font-weight: 600; text-decoration: none !important; line-height: 1;
                transition: background .14s ease, color .14s ease, border-color .14s ease;
            }
            html.smg-threadlist .pageNav-page > a:hover,
            html.smg-threadlist .pageNav-jump:hover,
            html.smg-threadlist .pageNavSimple-el:hover {
                background: rgba(255,255,255,0.12) !important; color: #fff !important; border-color: rgba(255,255,255,0.2) !important;
            }
            html.smg-threadlist .pageNav-page--current > a {
                background: var(--smg-s3) !important;
                border-color: var(--smg-bd2) !important; color: #fff !important;
            }
            html.smg-threadlist .pageNav-page--skip > a { background: transparent !important; border-color: transparent !important; }
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
            html.smg-threadlist .block-outer-opposite .buttonGroup { display: flex !important; gap: 6px !important; }
            html.smg-threadlist .block-outer-opposite .button {
                border-radius: 9px !important; border: 1px solid rgba(255,255,255,0.1) !important;
                background: rgba(255,255,255,0.05) !important; color: rgba(255,255,255,0.85) !important; box-shadow: none !important;
                min-height: 34px;
            }
            html.smg-threadlist .block-outer-opposite .button:hover { background: rgba(255,255,255,0.12) !important; color: #fff !important; border-color: rgba(255,255,255,0.2) !important; }

            /* ---- SMG: paginador/barra do fórum = MESMO visual da thread ----
               (pílula 36/raio 10 · página atual BRANCA · setas viram ícone · números alinhados)
               scoped em .smg-smg (3 classes) → vence o .smg-threadlist genérico sem mexer no simpcity */
            html.smg-threadlist .pageNav-page > a,
            html.smg-threadlist .pageNav-jump,
            html.smg-threadlist .pageNavSimple-el {
                min-width: 36px !important; height: 36px !important; min-height: 36px !important; padding: 0 13px !important;
                border-radius: 10px !important; border: 1px solid var(--smg-bd) !important;
                background: var(--smg-s1) !important; color: rgba(255,255,255,0.85) !important; font-size: 14px !important;
            }
            html.smg-threadlist .pageNav-page > a:hover,
            html.smg-threadlist .pageNav-jump:hover,
            html.smg-threadlist .pageNavSimple-el:hover {
                background: var(--smg-s2) !important; border-color: var(--smg-bd2) !important; color: #fff !important;
            }
            html.smg-threadlist .pageNav-page--current > a {
                background: #fff !important; color: #141414 !important; border-color: #fff !important;
            }
            html.smg-threadlist .pageNav-page--skip > a { background: var(--smg-s1) !important; border-color: var(--smg-bd) !important; }
            /* alinhamento vertical: números e seta centrados na mesma linha (mata o offset do <li>/<ul>) */
            html.smg-threadlist .pageNav { align-items: center !important; }
            html.smg-threadlist .pageNav-page { display: flex !important; align-items: center !important; margin: 0 !important; padding: 0 !important; line-height: 1 !important; }
            /* setas ‹ › em ícone (igual thread): quadrado 36, esconde texto/ícone nativo */
            html.smg-threadlist .smg-iconified {
                width: 36px !important; min-width: 36px !important; max-width: 36px !important; flex: 0 0 36px !important;
                height: 36px !important; min-height: 36px !important; padding: 0 !important; gap: 0 !important;
                display: inline-flex !important; align-items: center !important; justify-content: center !important;
            }
            html.smg-threadlist .smg-iconified .smg-ic { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; }
            html.smg-threadlist .smg-iconified .smg-ic svg { width: 18px !important; height: 18px !important; display: block; fill: none !important; }
            html.smg-threadlist .smg-iconified .button-text,
            html.smg-threadlist .smg-iconified > i { display: none !important; }
            /* botões de ação (Mark read / Watch) no MESMO tamanho/raio da thread */
            html.smg-threadlist .block-outer-opposite .button {
                min-height: 36px !important; border-radius: 10px !important;
                border: 1px solid var(--smg-bd) !important; background: var(--smg-s1) !important;
            }
            html.smg-threadlist .block-outer-opposite .button:hover { background: var(--smg-s2) !important; border-color: var(--smg-bd2) !important; }
            @media (max-width: 600px) {
                /* mobile: pager simples sem primeiro/último (evita pílula vazia do «/») */
                html.smg-threadlist .pageNavSimple-el--first,
                html.smg-threadlist .pageNavSimple-el--last { display: none !important; }
            }

            `;
