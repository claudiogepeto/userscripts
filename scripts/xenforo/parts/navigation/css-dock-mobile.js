    // navigation/css-dock-mobile.js
    // Owns: CSS for mobile navbar dock.
    // Exposes: CSS_DOCK_MOBILE.
    // Depends on: --smg-* tokens from styles/01-base.js; composed by core/05-styles.js (order matters).
    // ── CSS: mobile navbar dock ──
    const CSS_DOCK_MOBILE = `
            /* ---- mobile: a dock vira uma navbar full-width colada embaixo ---- */
            @media (max-width: 600px) {
                .smg-side--desktop-only { display: none !important; }
                html { --smg-navh: 54px; }
                /* Thread/list docks add a second mobile row. Use page classes already
                   detected at document-start instead of :has(), which invalidates the
                   root style on every DOM mutation. */
                html.smg-thread, html.smg-threadlist { --smg-navh: 92px; }
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

                /* Linha 1 (Controles de Thread / Lista no Mobile) */
                /* Linha 1 (Controles de Thread / Lista no Mobile) */
                .smg-dock-thread-bar {
                    display: flex !important;
                    flex-direction: row !important;
                    width: 100% !important;
                    height: 38px !important;
                    align-items: center !important;
                    justify-content: space-around !important;
                    padding: 0 var(--smg-sp-4) !important;
                    box-sizing: border-box !important;
                    border-bottom: 1px solid var(--smg-w-06) !important;
                    background: var(--smg-w-02) !important;
                    gap: 0 !important;
                }
                .smg-dock-thread-bar .smg-nav-btn {
                    flex: 1 1 0 !important;
                    min-width: 0 !important;
                    width: auto !important;
                    height: 34px !important;
                    min-height: 34px !important;
                    max-height: 34px !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    background: transparent !important;
                    border: none !important;
                    border-radius: var(--smg-r-8) !important;
                    padding: 0 var(--smg-sp-2) !important;
                    margin: 0 !important;
                    box-shadow: none !important;
                    vertical-align: middle !important;
                    transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease;
                }
                .smg-dock-thread-bar .smg-nav-btn .smg-nav-ico {
                    font-size: var(--smg-fs-20) !important;
                    line-height: 1 !important;
                    height: 19px !important;
                    width: 19px !important;
                    color: var(--smg-w-85) !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                .smg-dock-thread-bar .smg-nav-btn .smg-nav-ico svg {
                    width: 19px !important;
                    height: 19px !important;
                    stroke-width: 2 !important;
                    display: block !important;
                    margin: 0 auto !important;
                }

                /* Botões com texto no Mobile (Sort e Pages) - Flex uniforme com espaçamento padrão */
                .smg-dock-thread-bar #smg-post-sort-toggle,
                .smg-dock-thread-bar #smg-list-sort-m,
                .smg-dock-thread-bar .smg-sort-pill,
                .smg-dock-thread-bar #smg-mobile-page-btn {
                    flex: 1 1 0 !important;
                    width: auto !important;
                    min-width: 0 !important;
                    height: 34px !important;
                    min-height: 34px !important;
                    max-height: 34px !important;
                    align-self: center !important;
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    padding: 0 var(--smg-sp-2) !important;
                    gap: var(--smg-sp-4) !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                .smg-dock-thread-bar #smg-post-sort-toggle .smg-nav-ico svg,
                .smg-dock-thread-bar #smg-list-sort-m .smg-nav-ico svg,
                .smg-dock-thread-bar .smg-sort-pill .smg-nav-ico svg,
                .smg-dock-thread-bar #smg-mobile-page-btn .smg-nav-ico svg {
                    width: 14px !important;
                    height: 14px !important;
                    flex-shrink: 0 !important;
                }
                .smg-dock-thread-bar #smg-post-sort-toggle .smg-nav-btn-text,
                .smg-dock-thread-bar #smg-list-sort-m .smg-nav-btn-text,
                .smg-dock-thread-bar .smg-sort-pill .smg-nav-btn-text,
                .smg-dock-thread-bar #smg-mobile-page-btn .smg-nav-btn-text {
                    display: inline-block !important;
                    font-size: var(--smg-fs-12) !important;
                    font-weight: 700 !important;
                    color: var(--smg-w-85) !important;
                    line-height: 1 !important;
                    white-space: nowrap !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                }
                .smg-dock-thread-bar #smg-post-sort-toggle.smg-active,
                .smg-dock-thread-bar #smg-list-sort-m.smg-active,
                .smg-dock-thread-bar .smg-sort-pill.smg-active,
                .smg-dock-thread-bar #smg-mobile-page-btn.smg-active {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                }
                .smg-dock-thread-bar #smg-post-sort-toggle.smg-active .smg-nav-ico,
                .smg-dock-thread-bar #smg-post-sort-toggle.smg-active .smg-nav-btn-text,
                .smg-dock-thread-bar #smg-list-sort-m.smg-active .smg-nav-ico,
                .smg-dock-thread-bar #smg-list-sort-m.smg-active .smg-nav-btn-text,
                .smg-dock-thread-bar .smg-sort-pill.smg-active .smg-nav-ico,
                .smg-dock-thread-bar .smg-sort-pill.smg-active .smg-nav-btn-text,
                .smg-dock-thread-bar #smg-mobile-page-btn.smg-active .smg-nav-ico,
                .smg-dock-thread-bar #smg-mobile-page-btn.smg-active .smg-nav-btn-text {
                    color: var(--smg-link) !important;
                }

                /* Botão de Notificação no Mobile: ganha cor de destaque quando seguindo */
                .smg-dock-thread-bar #smg-thread-watch.smg-active {
                    background: rgba(255, 119, 178, 0.12) !important;
                    border-radius: var(--smg-r-8) !important;
                }
                .smg-dock-thread-bar #smg-thread-watch.smg-active .smg-nav-ico,
                .smg-dock-thread-bar #smg-thread-watch.smg-active .smg-nav-ico svg {
                    color: var(--smg-link) !important;
                    stroke: var(--smg-link) !important;
                }

                /* Linha 2 (Navbar Global do Fórum no Mobile) */
                #smg-post-nav-panel > .smg-nav-center {
                    display: flex !important;
                    flex-direction: row !important;
                    width: 100% !important;
                    height: 48px !important;
                    align-items: center !important;
                    justify-content: space-around !important;
                    padding: 0 var(--smg-sp-6) !important;
                    box-sizing: border-box !important;
                    border-top: none !important;
                    gap: 0 !important;
                }
                #smg-post-nav-panel > .smg-nav-center .smg-nav-btn {
                    flex: 1 1 0 !important;
                    height: 44px !important;
                    width: auto !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    background: transparent !important;
                    border: none !important;
                }
                #smg-post-nav-panel > .smg-nav-center .smg-nav-ico {
                    font-size: var(--smg-fs-22) !important;
                    color: #fff !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                #smg-post-nav-panel > .smg-nav-center .smg-nav-ico svg {
                    width: 22px !important;
                    height: 22px !important;
                }
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