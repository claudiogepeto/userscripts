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
                    transition: transform .22s cubic-bezier(.2,.8,.3,1);
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
                    border-top: 1px solid rgba(255,255,255,0.08) !important;
                    border-radius: 0 !important;
                    background: var(--smg-bg, #16171b) !important;
                    box-shadow: 0 -4px 20px rgba(0,0,0,0.4) !important;
                    overflow: visible !important;
                }
                /* navbar = 5 itens (espelha a topbar c/ Timeline): Discover sai da barra; Following (Watched) fica visível */
                #smg-nav-discover { display: none !important; }
                #smg-post-nav-panel::-webkit-scrollbar {
                    display: none;
                }
                .smg-nav-group {
                    gap: 4px;
                    flex: 0 0 auto;
                }
                .smg-nav-divider {
                    margin: 0 9px;
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
                    font-size: 24px;   /* tamanho de ícone de navbar (era 26 — pesava junto com a barra alta) */
                    filter: none;
                    color: #fff;                             /* ícones brancos (ativo = preenchido, inativo = contorno) */
                    transition: transform .12s ease;
                }
                .smg-nav-ico svg { stroke-width: 1.9; }       /* traço mais leve na navbar */
                /* item da página atual: ícone na COR DO TEMA (verde/rosa), em CONTORNO (sem preencher → sem "blob"/gradiente) */
                .smg-nav-btn.smg-nav-active .smg-nav-ico { color: var(--smg-link, #ff77b2); }
                /* profile = avatar circular (24px, idêntico aos outros ícones da navbar) */
                .smg-nav-ico--avatar {
                    width: 24px !important;
                    height: 24px !important;
                    border-radius: 50% !important;
                    overflow: visible !important;
                    box-shadow: 0 0 0 1px rgba(255,255,255,0.4) !important;
                }
                .smg-nav-ico--avatar .avatar,
                .smg-nav-ico--avatar img,
                .smg-nav-ico--avatar .avatar > img,
                .smg-nav-ico--avatar .avatar > span {
                    width: 24px !important;
                    height: 24px !important;
                    min-width: 0 !important;
                    border-radius: 50% !important;
                    overflow: hidden !important;
                    display: block !important;
                    font-size: 11px !important;
                    line-height: 24px !important;
                    text-align: center !important;
                }
                .smg-nav-active .smg-nav-ico--avatar {
                    box-shadow: 0 0 0 1.5px var(--smg-bg), 0 0 0 2.5px var(--smg-link, #ff77b2) !important;
                }
                .smg-nav-btn[data-label]::after {
                    display: none;
                }
                #smg-dock-handle {
                    width: 56px;
                    height: 26px;
                    font-size: 15px;
                }
                /* search no mobile */
                #smg-search-pop { gap: 14px; padding: 16px; border-radius: 18px; }
                #smg-search-pop .smg-search-input {
                    flex: 1 1 160px;
                    min-width: 120px;
                    font-size: 16px;
                }
                #smg-search-pop .smg-search-acts {
                    width: 100% !important;
                    justify-content: flex-end;
                    padding-top: 6px;
                    border-top: 1px solid rgba(255,255,255,0.08);
                }
                .smg-search-kbd { display: none; }
                .smg-search-hint { display: none; } /* no touch, Enter/botão basta */
                .smg-search-go { height: 46px; padding: 0 22px; } /* compacto (não ocupa a linha toda) */
                .smg-search-hist-remove, .smg-search-hist-act { opacity: 1; } /* sem hover no touch */
                .smg-feed-tools { right: 70px; gap: 7px; }
                .smg-feed-tool { width: 40px; height: 40px; font-size: 18px; }

                /* Linha 1 (Controles de Thread / Lista no Mobile) */
                /* Linha 1 (Controles de Thread / Lista no Mobile) */
                .smg-dock-thread-bar {
                    display: flex !important;
                    flex-direction: row !important;
                    width: 100% !important;
                    height: 38px !important;
                    align-items: center !important;
                    justify-content: space-around !important;
                    padding: 0 4px !important;
                    box-sizing: border-box !important;
                    border-bottom: 1px solid rgba(255,255,255,0.06) !important;
                    background: rgba(255,255,255,0.025) !important;
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
                    border-radius: 8px !important;
                    padding: 0 2px !important;
                    margin: 0 !important;
                    box-shadow: none !important;
                    vertical-align: middle !important;
                    transition: background .15s ease, color .15s ease;
                }
                .smg-dock-thread-bar .smg-nav-btn .smg-nav-ico {
                    font-size: 19px !important;
                    line-height: 1 !important;
                    height: 19px !important;
                    width: 19px !important;
                    color: rgba(255,255,255,0.85) !important;
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
                    padding: 0 2px !important;
                    gap: 3px !important;
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
                    font-size: 11.5px !important;
                    font-weight: 700 !important;
                    color: rgba(255,255,255,0.88) !important;
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
                    color: var(--smg-link, #ff77b2) !important;
                }

                /* Botão de View Mode no Mobile */
                .smg-dock-thread-bar #smg-thread-view-mode.smg-active .smg-nav-ico,
                .smg-dock-thread-bar #smg-thread-view-mode.smg-active .smg-nav-ico svg {
                    color: var(--smg-link, #ff77b2) !important;
                    stroke: var(--smg-link, #ff77b2) !important;
                }

                /* Botão de Notificação no Mobile: ganha cor de destaque quando seguindo */
                .smg-dock-thread-bar #smg-thread-watch.smg-active {
                    background: rgba(255, 119, 178, 0.12) !important;
                    border-radius: 8px !important;
                }
                .smg-dock-thread-bar #smg-thread-watch.smg-active .smg-nav-ico,
                .smg-dock-thread-bar #smg-thread-watch.smg-active .smg-nav-ico svg {
                    color: var(--smg-link, #ff77b2) !important;
                    stroke: var(--smg-link, #ff77b2) !important;
                }

                /* Linha 2 (Navbar Global do Fórum no Mobile) */
                #smg-post-nav-panel > .smg-nav-center {
                    display: flex !important;
                    flex-direction: row !important;
                    width: 100% !important;
                    height: 48px !important;
                    align-items: center !important;
                    justify-content: space-around !important;
                    padding: 0 6px !important;
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
                    font-size: 22px !important;
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
                z-index: 50;
                background: var(--smg-s2, #1c1c1f);
                border: 1px solid var(--smg-bd, rgba(255,255,255,0.12));
                border-radius: 16px;
                padding: 6px 10px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.5);
                align-items: center;
                gap: 6px;
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
                border-radius: 8px;
                background: rgba(255,255,255,0.06);
                color: #fff;
                text-decoration: none;
                border: 0;
                cursor: pointer;
                transition: background .14s ease;
            }
            .smg-mp-btn:hover {
                background: var(--smg-s3, rgba(255,255,255,0.15));
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
                gap: 4px;
                background: rgba(255,255,255,0.04);
                border: 1px solid var(--smg-bd, rgba(255,255,255,0.12));
                border-radius: 8px;
                padding: 2px 6px;
            }
            .smg-mobile-page-input {
                width: 42px;
                height: 28px;
                background: transparent;
                border: 0;
                color: #fff;
                font-size: 13px;
                font-weight: 700;
                text-align: center;
                outline: none;
            }
            .smg-mp-sep, .smg-mp-max {
                font-size: 12px;
                color: rgba(255,255,255,0.6);
                font-weight: 600;
            }
            .smg-mp-go {
                height: 28px;
                padding: 0 8px;
                border-radius: 6px;
                background: var(--smg-link, #ff77b2);
                color: #fff;
                border: 0;
                font-weight: 700;
                font-size: 12px;
                cursor: pointer;
            }
            .smg-mp-close {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: transparent;
                border: 0;
                color: rgba(255,255,255,0.6);
                cursor: pointer;
                margin-left: 2px;
            }
            .smg-mp-close:hover {
                color: #fff;
                background: rgba(255,255,255,0.1);
            }
            .smg-mp-close svg {
                width: 14px;
                height: 14px;
            }
            #smg-viewmode-pop {
                display: none;
                position: fixed;
                bottom: calc(var(--smg-navh) + 12px);
                left: 50%;
                transform: translateX(-50%);
                z-index: 50;
                background: var(--smg-s2, #1c1c1f);
                border: 1px solid var(--smg-bd, rgba(255,255,255,0.12));
                border-radius: 16px;
                padding: 6px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.5);
                align-items: center;
                gap: 4px;
            }
            #smg-viewmode-pop.open {
                display: flex !important;
            }
            .smg-vm-opt {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                height: 34px;
                padding: 0 12px;
                border-radius: 10px;
                background: rgba(255,255,255,0.06);
                color: #fff;
                border: 0;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: background .14s ease;
            }
            .smg-vm-opt:hover {
                background: var(--smg-s3, rgba(255,255,255,0.15));
            }
            .smg-vm-ic svg {
                width: 16px;
                height: 16px;
                display: block;
            }
`;