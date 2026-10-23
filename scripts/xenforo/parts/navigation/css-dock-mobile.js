    // navigation/css-dock-mobile.js
    // Owns: CSS for mobile navbar dock.
    // Exposes: CSS_DOCK_MOBILE.
    // Depends on: --smg-* tokens from styles/01-base.js; composed by core/05-styles.js (order matters).
    // ── CSS: mobile navbar dock ──
    const CSS_DOCK_MOBILE = `
            /* ---- mobile: a dock vira uma navbar full-width colada embaixo ---- */
            @media (max-width: 600px) {
                .smg-side--desktop-only { display: none !important; }
                html { --smg-navh: 54px; }   /* navbar 52 + borda */
                /* Thread/list docks add a second mobile row. Use page classes already
                   detected at document-start instead of :has(), which invalidates the
                   root style on every DOM mutation. */
                html.smg-thread, html.smg-threadlist { --smg-navh: 100px; }
                #smg-post-nav-wrapper {
                    left: 0;
                    right: 0;
                    bottom: 0;
                    transform: none;
                    width: 100%;
                    transition: transform var(--smg-dur-20) cubic-bezier(.2,.8,.3,1);
                }
                /* auto-hide no scroll (ver syncNavAway): desce = some, sobe = volta. O botão de
                   opções é fixed DENTRO do wrapper, então o transform leva ele junto — que é o
                   que se quer: os dois somem e voltam como uma peça só. */
                #smg-post-nav-wrapper.smg-nav-away { transform: translateY(115%); }
                /* respiro pra navbar fixa não cobrir o fim do conteúdo */
                body { padding-bottom: calc(var(--smg-navh) + env(safe-area-inset-bottom)) !important; }
                /* rede de segurança: conteúdo largo (embed/tabela) no post não vira scroll horizontal da página */
                .bbWrapper, .message-userContent { overflow-x: hidden; }
                #smg-post-nav-panel {
                    display: flex !important;
                    flex-direction: column !important;
                    width: 100% !important;
                    max-width: none !important;
                    box-sizing: border-box !important;
                    padding: 0 !important;
                    padding-bottom: env(safe-area-inset-bottom) !important;
                    border: none !important;
                    border-top: 1px solid var(--smg-w-08) !important;
                    border-radius: 0 !important;
                    background: var(--smg-bg) !important;
                    box-shadow: 0 -4px 20px var(--smg-k-45) !important;
                    overflow: visible !important;
                }
                /* navbar = 5 itens (espelha a topbar c/ Timeline): Discover sai da barra; Following (Watched) fica visível */
                #smg-nav-discover { display: none !important; }
                #smg-post-nav-panel::-webkit-scrollbar {
                    display: none;
                }
                .smg-nav-group {
                    gap: var(--smg-sp-4);
                    flex: 0 0 auto;
                }
                .smg-nav-divider {
                    margin: 0 var(--smg-sp-10);
                }
                /* ícones flat estilo Instagram: sem fundo/borda; cada item ocupa fatia igual da barra */
                .smg-nav-btn {
                    flex: 1 1 0;
                    width: auto;
                    min-width: 0;
                    height: 44px;   /* alvo de toque mínimo — abaixo disso erra o dedo */
                    padding: 0;
                    background: transparent;
                    border: none;
                    border-radius: 0;
                    box-shadow: none;
                }
                .smg-nav-btn:not(:disabled):hover {
                    background: transparent;
                    border-color: transparent;
                    box-shadow: none;
                    transform: none;
                    color: #fff;
                }
                .smg-nav-btn:not(:disabled):active {
                    transform: scale(0.86);
                }
                .smg-nav-ico {
                    font-size: var(--smg-fs-24);   /* tamanho de ícone de navbar (era 26 — pesava junto com a barra alta) */
                    filter: none;
                    color: #fff;                             /* ícones brancos (ativo = preenchido, inativo = contorno) */
                    transition: transform var(--smg-dur-12) ease;
                }
                /* item da página atual: ícone na COR DO TEMA (verde/rosa), em CONTORNO (sem preencher → sem "blob"/gradiente) */
                .smg-nav-btn.smg-nav-active .smg-nav-ico { color: var(--smg-link); }
                /* profile = avatar circular (24px, idêntico aos outros ícones da navbar) */
                .smg-nav-ico--avatar {
                    width: 24px !important;
                    height: 24px !important;
                    border-radius: var(--smg-r-round) !important;
                    overflow: visible !important;
                    box-shadow: 0 0 0 1px var(--smg-w-40) !important;
                }
                .smg-nav-ico--avatar .avatar,
                .smg-nav-ico--avatar img,
                .smg-nav-ico--avatar .avatar > img,
                .smg-nav-ico--avatar .avatar > span {
                    width: 24px !important;
                    height: 24px !important;
                    min-width: 0 !important;
                    border-radius: var(--smg-r-round) !important;
                    overflow: hidden !important;
                    display: block !important;
                    font-size: var(--smg-fs-11) !important;
                    line-height: 24px !important;
                    text-align: center !important;
                }
                .smg-nav-active .smg-nav-ico--avatar {
                    box-shadow: 0 0 0 1.5px var(--smg-bg), 0 0 0 2.5px var(--smg-link) !important;
                }
                .smg-nav-btn[data-label]::after {
                    display: none;
                }
                #smg-dock-handle {
                    width: 56px;
                    height: 26px;
                    font-size: var(--smg-fs-15);
                }
                /* search no mobile */
                #smg-search-pop { gap: var(--smg-sp-14); padding: var(--smg-sp-16); border-radius: var(--smg-r-18); }
                #smg-search-pop .smg-search-input {
                    flex: 1 1 160px;
                    min-width: 120px;
                    font-size: var(--smg-fs-16);
                }
                #smg-search-pop .smg-search-acts {
                    width: 100% !important;
                    justify-content: flex-end;
                    padding-top: var(--smg-sp-6);
                    border-top: 1px solid var(--smg-w-08);
                }
                .smg-search-kbd { display: none; }
                .smg-search-go { height: 46px; padding: 0 var(--smg-sp-24); } /* compacto (não ocupa a linha toda) */
                .smg-search-hist-remove, .smg-search-hist-act { opacity: 1; } /* sem hover no touch */

                /* ---- Linha 1: barra de contexto (tópico / lista) ----
                   Uma cápsula acima da navbar. Todo botão tem o mesmo alvo (36px), o mesmo ícone (20px,
                   traço 1.9) e a mesma cor; as pílulas com texto (página, ordenação) usam ícone 16px +
                   texto 13px. Ativo = cor do tema, sem fundo extra. */
                .smg-dock-thread-bar {
                    display: flex !important;
                    flex-direction: row !important;
                    align-items: center !important;
                    gap: var(--smg-sp-2) !important;
                    align-self: stretch !important;
                    width: auto !important;
                    height: 40px !important;
                    margin: var(--smg-sp-6) var(--smg-sp-8) 0 !important;
                    padding: 0 var(--smg-sp-2) !important;
                    box-sizing: border-box !important;
                    border: 1px solid var(--smg-w-06) !important;
                    border-radius: var(--smg-r-12) !important;
                    background: var(--smg-w-04) !important;
                }
                /* páginas sem controles próprios (home, conta…): só a navbar */
                html:not(.smg-thread):not(.smg-threadlist) .smg-dock-thread-bar { display: none !important; }
                .smg-dock-thread-bar .smg-nav-btn {
                    flex: 1 1 0 !important;
                    min-width: 0 !important;
                    width: auto !important;
                    height: 36px !important;
                    min-height: 36px !important;
                    max-height: 36px !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: var(--smg-sp-6) !important;
                    margin: 0 !important;
                    padding: 0 var(--smg-sp-4) !important;
                    background: transparent !important;
                    border: none !important;
                    border-radius: var(--smg-r-8) !important;
                    box-shadow: none !important;
                    color: var(--smg-w-72) !important;
                    transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease;
                }
                .smg-dock-thread-bar .smg-nav-btn:not(:disabled):active { background: var(--smg-w-08) !important; transform: none; }
                .smg-dock-thread-bar .smg-nav-btn .smg-nav-ico {
                    width: 20px !important;
                    height: 20px !important;
                    font-size: var(--smg-fs-20) !important;
                    line-height: 1 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    flex: 0 0 auto !important;
                    color: inherit !important;
                }
                .smg-dock-thread-bar .smg-nav-btn .smg-nav-ico svg {
                    width: 20px !important;
                    height: 20px !important;
                    stroke-width: 1.9 !important;
                    display: block !important;
                }
                /* pílulas com texto: página (1 / 4) e ordenação (Data / Curtidas) */
                .smg-dock-thread-bar .smg-nav-labeled { flex: 1.4 1 0 !important; }
                .smg-dock-thread-bar .smg-nav-labeled .smg-nav-ico,
                .smg-dock-thread-bar .smg-nav-labeled .smg-nav-ico svg {
                    width: 16px !important;
                    height: 16px !important;
                }
                .smg-dock-thread-bar .smg-nav-labeled .smg-nav-btn-text {
                    display: inline-block !important;
                    min-width: 0 !important;
                    font-size: var(--smg-fs-13) !important;
                    font-weight: 650 !important;
                    font-variant-numeric: tabular-nums;
                    line-height: 1 !important;
                    color: inherit !important;
                    white-space: nowrap !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                }
                /* pager desligado (página sem paginação) some de verdade: a regra de display acima vence o .is-off genérico */
                .smg-dock-thread-bar #smg-mobile-page-btn.is-off { display: none !important; }
                /* mesma linguagem da dock do desktop: ativo = fundo suave + tinta do tema; a página (n / N) é uma
                   pílula própria, como a cápsula do paginador; o sort é o segmentado só com ícones (calendário | chama) */
                .smg-dock-thread-bar .smg-nav-btn.smg-active { background: var(--smg-link-soft) !important; color: var(--smg-link) !important; }
                .smg-dock-thread-bar #smg-mobile-page-btn { background: var(--smg-w-06) !important; color: #fff !important; margin: 0 var(--smg-sp-2) !important; }
                .smg-dock-thread-bar .smg-nav-btn.smg-sort-seg {
                    flex: 0 0 auto !important; height: 32px !important; min-height: 32px !important; max-height: 32px !important;
                    padding: var(--smg-sp-2) !important; margin: 0 var(--smg-sp-2) !important;
                    background: var(--smg-w-06) !important; border-radius: var(--smg-r-10) !important;
                }
                .smg-dock-thread-bar .smg-sort-txt { display: none; }
                .smg-dock-thread-bar .smg-nav-btn.smg-sort-seg > .smg-nav-ico { display: none !important; }
                .smg-dock-thread-bar .smg-sort-opt { height: 26px; padding: 0 var(--smg-sp-10); border-radius: var(--smg-r-8); }
                .smg-dock-thread-bar .smg-sort-segs::before { border-radius: var(--smg-r-8); }
                .smg-dock-thread-bar .smg-sort-ic svg { width: 16px; height: 16px; }

                /* ---- Linha 2: navbar global (5 itens, estilo tab bar) ---- */
                #smg-post-nav-panel > .smg-nav-center {
                    display: flex !important;
                    flex-direction: row !important;
                    align-items: center !important;
                    width: 100% !important;
                    height: 52px !important;
                    padding: 0 var(--smg-sp-8) !important;
                    box-sizing: border-box !important;
                    gap: 0 !important;
                    border-top: none !important;
                }
                #smg-post-nav-panel > .smg-nav-center .smg-nav-btn {
                    flex: 1 1 0 !important;
                    width: auto !important;
                    height: 48px !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    background: transparent !important;
                    border: none !important;
                    color: var(--smg-w-85) !important;
                }
                #smg-post-nav-panel > .smg-nav-center .smg-nav-ico {
                    width: 24px !important;
                    height: 24px !important;
                    font-size: var(--smg-fs-24) !important;
                    color: inherit !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                #smg-post-nav-panel > .smg-nav-center .smg-nav-ico svg {
                    width: 24px !important;
                    height: 24px !important;
                    stroke-width: 1.9 !important;
                }
                #smg-post-nav-panel > .smg-nav-center .smg-nav-btn.smg-nav-active { color: var(--smg-link) !important; }
                #smg-post-nav-panel > .smg-nav-divider,
                #smg-dock-sheet-btn,
                #smg-nav-settings {
                    display: none !important;
                }
            }

            /* Popover flutuante de paginação mobile (#smg-mobile-page-pop) */
            #smg-mobile-page-pop {
                display: none;
                position: fixed;
                bottom: calc(var(--smg-navh) + 12px);
                left: 50%;
                transform: translateX(-50%);
                z-index: var(--smg-z-50);
                background: var(--smg-s2);
                border: 1px solid var(--smg-bd);
                border-radius: var(--smg-pop-r);
                padding: var(--smg-sp-6) var(--smg-sp-10);
                box-shadow: var(--smg-pop-shadow);
                align-items: center;
                gap: var(--smg-sp-6);
            }
            #smg-mobile-page-pop.open {
                display: flex !important;
            }
            .smg-mp-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                border-radius: var(--smg-btn-r);
                background: var(--smg-w-06);
                color: #fff;
                text-decoration: none;
                border: 0;
                cursor: pointer;
                transition: background var(--smg-dur-15) ease;
            }
            .smg-mp-btn:hover {
                background: var(--smg-s3);
                color: #fff;
            }
            .smg-mp-btn[disabled] {
                opacity: 0.3;
                pointer-events: none;
            }
            .smg-mp-btn svg {
                width: 16px;
                height: 16px;
            }
            .smg-mp-goto {
                display: flex;
                align-items: center;
                gap: var(--smg-sp-4);
                background: var(--smg-w-04);
                border: 1px solid var(--smg-bd);
                border-radius: var(--smg-r-8);
                padding: var(--smg-sp-2) var(--smg-sp-6);
            }
            .smg-mobile-page-input {
                width: 42px;
                height: 28px;
                background: transparent;
                border: 0;
                color: #fff;
                font-size: var(--smg-fs-13);
                font-weight: 700;
                text-align: center;
                outline: none;
            }
            .smg-mp-sep, .smg-mp-max {
                font-size: var(--smg-fs-12);
                color: var(--smg-w-60);
                font-weight: 600;
            }
            .smg-mp-go {
                height: 28px;
                padding: 0 var(--smg-sp-8);
                border-radius: var(--smg-btn-r);
                background: var(--smg-link);
                color: #fff;
                border: 0;
                font-weight: 700;
                font-size: var(--smg-fs-12);
                cursor: pointer;
            }
            .smg-mp-close {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                border-radius: var(--smg-r-round);
                background: transparent;
                border: 0;
                color: var(--smg-w-60);
                cursor: pointer;
                margin-left: var(--smg-sp-2);
            }
            .smg-mp-close:hover {
                color: #fff;
                background: var(--smg-w-10);
            }
            .smg-mp-close svg {
                width: 14px;
                height: 14px;
            }
`;