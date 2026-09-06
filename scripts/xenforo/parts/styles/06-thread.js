    // STYLE CONTEXT: Thread header, posts and comments
    const CSS_THREAD = `/* ============================================================
               THREAD: header no nosso modelo (sem breadcrumb · botões de ação)
               ============================================================ */
            /* breadcrumb removido por completo */
            html.smg-thread .breadcrumb,
            html.smg-thread .p-breadcrumbs,
            html.smg-thread .smg-thread-back { display: none !important; }
            /* tags da thread (tamanho médio) */
            html.smg-thread .p-description .tagList .tagItem,
            html.smg-thread .p-description .tagItem {
                font-size: 11.5px !important; padding: 2px 8px !important; line-height: 1.35 !important;
                border-radius: 7px !important;
            }
            /* título da thread: menor e mais leve — ele divide a linha com badges, pager e ações */
            html.smg-thread .p-body-header .p-title-value { font-size: 20px !important; font-weight: 650 !important; }
            /* prefixos (ASMR/Patreon/Twitch): pílulas pequenas, não retângulos grandes */
            html.smg-thread .p-title-value .label {
                font-size: 9.5px !important; padding: 1.5px 5.5px !important; border-radius: 4px !important;
                font-weight: 700 !important; letter-spacing: .02em; line-height: 1.3 !important; vertical-align: middle;
            }
            /* AÇÕES (feed · galeria · download) NA LINHA DO TÍTULO, fixas à direita (dentro do .p-title centralizado).
               Segmented control: UM bloco coeso (borda/fundo únicos) com divisores entre os ícones — junta os 3 num só. */
            html.smg-thread .p-body-header .p-title { display: flex !important; align-items: center !important; gap: 14px !important; flex-wrap: wrap !important; }
            /* ===== THREAD HEADER: one block, sticky on desktop and in-flow on mobile =====
               Antes eram três pedaços soltos (título+ações, tags, e a barra de paginação que ficava no
               .block-outer acima dos posts). Agora é um header único e sticky: numa thread de 300 páginas
               dá pra trocar de página, abrir a galeria ou o feed sem voltar ao topo.
               Ao grudar ele COMPACTA (tags somem, título encolhe) — senão ocuparia meia tela. */
            html.smg-thread .p-body-header.smg-thead-unified {
                position: sticky; top: 50px; z-index: 30;
                background: var(--smg-bg); margin: 0 0 12px !important; padding: 14px 0 0 !important;
                min-height: 52px; display: flex; align-items: center;   /* conteúdo centralizado na faixa */
                transition: min-height .16s ease, padding .16s ease;
            }
            /* The thread header no longer forms a second fixed bar on mobile; the global topbar
               keeps its own divider for the content that starts below it. */
            html.smg-thread.smg-topbar-on #smg-topbar {
                border-bottom-color: rgba(255,255,255,0.08) !important;
                box-shadow: 0 1px 0 rgba(255,255,255,0.02) !important;
            }
            html.smg-thread .p-body-header.smg-thead-unified > * { width: 100%; }
            /* FUNDO DE PONTA A PONTA sem 100vw: o header é capado na largura do conteúdo, mas o fundo
               precisa cobrir a janela inteira (senão os posts aparecem passando por baixo nas laterais).
               A versão anterior usava um ::before de 100vw — e 100vw INCLUI a barra de rolagem, o que
               criava ~8px de scroll horizontal na thread. box-shadow com spread pinta além das bordas
               SEM ocupar espaço no layout; o clip-path corta o vazamento vertical.
               A 2ª sombra (atrás da 1ª) sobra 1px embaixo = a linha divisória, também de ponta a ponta. */
            html.smg-thread .p-body-header.smg-thead-unified {
                box-shadow: 0 0 0 100vmax var(--smg-bg), 0 1px 0 100vmax rgba(255,255,255,0.08);
                clip-path: inset(0 -100vmax -1px);
            }
            html.smg-thread .p-body-header.smg-thead-unified.is-stuck {
                padding: 0 !important;
                /* sombra CURTA: 22px de desfoque sobre fundo escuro viravam uma faixa cinza grossa,
                   que lia como uma borda enorme embaixo da barra. 6px só destacam a barra do conteúdo. */
                clip-path: inset(0 -100vmax -8px);
                box-shadow: 0 0 0 100vmax var(--smg-bg), 0 1px 0 100vmax rgba(255,255,255,0.08), 0 3px 6px rgba(0,0,0,0.35);
            }
            @media (max-width: 800px) { html.smg-thread .p-body-header.smg-thead-unified { top: 48px; } }
            /* LINHA ÚNICA: título/badges à esquerda; pager · ordenar · ações coladas à direita.
               O .p-title do XF é a própria linha — só viramos flex e deixamos o conteúdo quebrar em
               telas estreitas. As tags ficam numa faixa abaixo, que é o primeiro a sumir ao grudar. */
            html.smg-thread .smg-thead-unified .p-title {
                display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 0 !important;
            }
            html.smg-thread .smg-thead-unified .p-title-value { min-width: 0; margin: 0; }
            html.smg-thread .smg-thead-unified .p-title > .smg-bar { flex: 0 0 auto; margin-left: auto; }
            html.smg-thread .smg-thead-unified .p-title > .smg-thead-actions { flex: 0 0 auto; margin-left: 0; }
            html.smg-thread .smg-thead-unified .smg-bar { padding: 3px; border-radius: 12px; }
            html.smg-thread .smg-thead-unified .smg-bar-btn { height: 30px; padding: 0 9px; font-size: 13px; }
            html.smg-thread .smg-thead-unified .smg-bar-btn--icon { width: 32px; padding: 0; }
            /* COMPACTO (header grudado): a faixa de tags some, título e botões encolhem — a barra fica
               fina o bastante pra não comer a leitura, mantendo pager e ações sempre à mão. */
            .smg-thead-unified.is-stuck { min-height: 44px; }
            .smg-thead-unified.is-stuck .p-title-value { font-size: 17px !important; }
            .smg-thead-unified.is-stuck .p-title-value .label,
            .smg-thead-unified.is-stuck .p-title-value .prefix {
                display: inline-block !important;
                font-size: 9px !important;
                padding: 1px 5px !important;
                border-radius: 4px !important;
                vertical-align: middle;
            }
            .smg-thead-unified.is-stuck .smg-bar-btn { height: 28px; }
            .smg-thead-sentinel { height: 0; margin: 0; padding: 0; }
            /* barra do header: mais apertada que a versão solta — cada px conta numa faixa fixa */
            html.smg-thread .smg-thead-unified .smg-bar { height: 36px; padding: 0; }
            html.smg-thread .smg-thead-unified .smg-bar-group { gap: 2px; padding: 2px 4px; }
            html.smg-thread .smg-thead-unified .smg-bar-div { margin: 9px 2px; }
            html.smg-thread .smg-thead-unified .smg-bar-btn { padding: 0 8px; gap: 5px; }
            html.smg-thread .smg-thead-unified .smg-bar-btn--icon { width: 30px; padding: 0; }
            html.smg-thread .smg-thead-unified .smg-bar-cur { min-width: 60px !important; padding: 0 10px !important; }
            html.smg-thread .smg-thead-unified .smg-bar-pager { gap: 2px; padding: 2px 4px; }
            html.smg-thread .smg-thead-unified .smg-bar-pager .smg-bar-btn,
            .smg-thead-unified.is-stuck .smg-bar-pager .smg-bar-btn {
                width: 28px !important; height: 28px !important; min-width: 28px !important; padding: 0 !important;
                border-radius: 50% !important; font-size: 12.5px;
            }
            html.smg-thread .smg-thead-unified .smg-bar-pager .smg-bar-cur,
            .smg-thead-unified.is-stuck .smg-bar-pager .smg-bar-cur {
                height: 28px !important; min-width: 60px !important; padding: 0 10px !important;
                border-radius: 10px !important; font-size: 12px !important; font-weight: 700 !important;
                white-space: nowrap !important;
            }
            html.smg-thread .smg-thead-unified .smg-bar-pager .smg-bar-cur.smg-bar-pager-goto,
            .smg-thead-unified.is-stuck .smg-bar-pager .smg-bar-cur.smg-bar-pager-goto {
                font-size: 12px !important; font-weight: 700 !important;
            }
            html.smg-thread .smg-thead-unified .smg-bar-pager svg,
            .smg-thead-unified.is-stuck .smg-bar-pager svg {
                width: 14px !important; height: 14px !important;
            }
            /* AÇÕES (feed · galeria · download) com o MESMO desenho do paginador: mesma caixa (fundo,
               borda, raio, altura) e botões-pílula sem borda própria, em vez do bloco com gradiente e
               divisórias que tinham antes. Assim as duas metades da direita parecem o mesmo componente. */
            html.smg-thread .smg-thead-unified .smg-thead-actions {
                height: 36px; box-sizing: border-box; padding: 2px 4px; align-items: center; gap: 2px;
                background: var(--smg-s1) !important; border: 1px solid var(--smg-bd) !important;
                border-radius: 12px !important; box-shadow: none !important; overflow: visible;
            }
            html.smg-thread .smg-thead-unified .smg-thead-btn {
                width: 30px; height: 30px; min-width: 30px; padding: 0; font-size: 16px;
                border: 0 !important; border-radius: 8px !important; background: transparent !important;
                color: rgba(255,255,255,0.9);
                transition: background .14s ease, color .14s ease;
            }
            html.smg-thread .smg-thead-unified .smg-thead-btn:hover { background: var(--smg-s3) !important; color: #fff; }
            html.smg-thread .smg-thead-unified .smg-thead-btn + .smg-thead-btn { border-left: 0 !important; }
            html.smg-thread .smg-thead-unified .smg-thead-ic svg { width: 17px; height: 17px; }
            .smg-thead-unified.is-stuck .smg-bar { height: 32px; }
            .smg-thead-unified.is-stuck .smg-thead-actions { height: 32px; box-sizing: border-box; }
            .smg-thead-unified.is-stuck .smg-thead-btn { width: 28px; height: 28px; }
            /* hero agrupando thumbnail + info (titleline + tags) */
            .smg-thead-hero {
                display: flex;
                align-items: flex-end;
                gap: 16px;
                min-width: 0;
                flex: 1 1 auto;
            }
            .smg-thead-info {
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
                align-self: flex-end;
                min-width: 0;
                flex: 1 1 auto;
                gap: 6px;
            }
            .smg-thead-titleline { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1 1 auto; }
            .smg-thead-titleline .p-title-value { flex: 1 1 auto; min-width: 0; }
            .smg-thead-thumb {
                flex: 0 0 auto;
                width: 76px;
                height: 76px;
                border-radius: 14px;
                overflow: hidden;
                background: rgba(255,255,255,0.06);
                box-shadow: 0 4px 14px rgba(0,0,0,0.3);
            }
            .smg-thead-thumb img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }
            .smg-thead-unified.is-stuck .smg-thead-hero {
                align-items: center;
                gap: 0;
            }
            .smg-thead-unified.is-stuck .smg-thead-info {
                justify-content: center;
                align-self: center;
                gap: 0;
            }
            .smg-thead-unified.is-stuck .smg-thead-thumb {
                display: none !important;
            }
            .smg-thead-unified.is-stuck .smg-thead-tags {
                display: none !important;
            }
            .smg-thead-tags { margin: 0; }
            .smg-thead-tags .p-description { margin: 0 !important; }
            /* O ícone de tags e a lista são uma unidade de layout. Alguns skins colocam
               o ícone fora de .tagList; o JS normaliza os pais diretos nesta linha. */
            html.smg-thread .smg-thead-tags-row {
                display: flex !important; align-items: center !important; flex-wrap: wrap;
                gap: 4px; min-width: 0; width: 100%; margin: 0 !important; padding: 0 !important;
            }
            html.smg-thread .smg-thead-tags-row > .listInline,
            html.smg-thread .smg-thead-tags-row > .tagList,
            html.smg-thread .smg-thead-tags-row > .tagList-icon {
                display: inline-flex !important; align-items: center !important; flex-wrap: wrap;
                gap: 4px; min-width: 0; margin: 0 !important; padding: 0 !important;
            }
            html.smg-thread .smg-thead-tags-row .tagList-icon {
                flex: 0 0 auto; line-height: 1; white-space: nowrap;
            }
            html.smg-thread .smg-thead-tags-row .tagList {
                flex: 0 1 auto; max-width: 100%;
            }
            @media (max-width: 700px) {
                html.smg-thread .smg-thead-unified .p-title > .smg-bar { margin-left: 0; width: 100%; }
                html.smg-thread .smg-thead-unified .p-title-value { flex: 1 1 100%; }
            }

            .smg-thead-actions {
                display: inline-flex; align-items: stretch; margin-left: auto;
                border: 1px solid var(--smg-bd2); border-radius: 13px; overflow: hidden;
                background: linear-gradient(180deg, var(--smg-s2), var(--smg-s1));
                box-shadow: 0 4px 16px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.06);
            }
            .smg-thead-btn {
                width: 48px; height: 42px; font-size: 21px; padding: 0; cursor: pointer;
                display: inline-flex; align-items: center; justify-content: center;
                border: 0; background: transparent; color: rgba(255,255,255,0.94);
                transition: background .16s ease, color .16s ease, transform .12s ease;
            }
            .smg-thead-btn svg { fill: none !important; }   /* ícones outline (o CSS do fórum tentava preencher → play virava blob/sumia) */
            .smg-thead-ic { display: inline-flex; align-items: center; justify-content: center; }
            .smg-thead-lbl { display: none; }   /* desktop: só ícone (compacto na linha do título); label aparece no mobile */
            .smg-thead-btn + .smg-thead-btn { border-left: 1px solid var(--smg-bd); }   /* divisor entre os segmentos */
            .smg-thead-btn:hover { background: var(--smg-link, #ff77b2); color: #fff; }   /* hover de marca: destaca o propósito “maior” */
            .smg-thead-btn:active { transform: scale(0.9); }
            /* título + descrição alinhados à esquerda (sem centralizar nada) */
            html.smg-thread .p-body-header .p-title,
            html.smg-thread .p-body-header .p-description,
            html.smg-thread .uix_headerInner,
            html.smg-thread .uix_headerInner--opposite { text-align: left !important; }
            html.smg-thread .uix_headerInner--opposite { justify-content: flex-start !important; align-items: flex-start !important; }
            html.smg-thread .p-title-pageAction { display: none !important; }   /* botão Quote/responder do header — removido */
            /* MOBILE: header UNIFICADO — título → tags (coladas, mesmo bloco visual) → ações full-width →
               barra de navegação esticada. O JS (buildThreadHeader) move a barra de ações pra DEPOIS das
               tags no mobile; antes ela entrava no meio e as tags ficavam órfãs depois dos botões. */
            @media (max-width: 600px) {
                /* Header da thread normal (topo) no mobile */
                html.smg-thread .p-body-header {
                    padding-top: 6px !important;
                    padding-left: 4px !important;
                    padding-right: 4px !important;
                    margin-bottom: 2px !important;
                }
                html.smg-thread .p-body-header.smg-thead-unified {
                    position: static !important;
                    top: auto !important;
                    min-height: 0 !important;
                    height: auto !important;
                    padding: 3px 4px !important;
                    margin-bottom: 4px !important;
                    box-shadow: none !important;
                    clip-path: none !important;
                }
                html.smg-thread .p-body-header.smg-thead-unified.is-stuck {
                    position: static !important; top: auto !important; min-height: 0 !important;
                    height: auto !important; box-shadow: none !important; clip-path: none !important;
                }
                html.smg-thread .smg-thead-hero {
                    display: flex !important;
                    align-items: flex-start !important;
                    gap: 8px !important;
                    min-width: 0 !important;
                    flex: 1 1 auto !important;
                    padding-left: 0 !important;
                }
                html.smg-thread .smg-thead-thumb {
                    flex: 0 0 50px !important;
                    width: 50px !important;
                    height: 50px !important;
                    border-radius: 10px !important;
                    margin-right: 0 !important;
                    align-self: flex-start !important;
                }
                html.smg-thread .smg-thead-info {
                    display: flex !important;
                    flex-direction: column !important;
                    align-self: flex-start !important;
                    justify-content: flex-start !important;
                    min-width: 0 !important;
                    flex: 1 1 auto !important;
                    gap: 2px !important;
                    padding-left: 0 !important;
                }
                html.smg-thread .smg-thead-unified .p-title {
                    gap: 2px !important;
                    row-gap: 2px !important;
                }
                html.smg-thread .smg-thead-unified .smg-thead-titleline {
                    flex: 1 1 100% !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 4px !important;
                    padding-left: 0 !important;
                }
                html.smg-thread .smg-thead-unified .p-title-value {
                    display: inline-flex !important;
                    align-items: center !important;
                    font-size: 15px !important;
                    line-height: 1 !important;
                    font-weight: 700 !important;
                    gap: 3px !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }

                /* UNIFICAÇÃO DE TODAS AS BADGES (Labels e Prefixos) */
                html.smg-thread .smg-thead-unified .p-title-value .label,
                html.smg-thread .smg-thead-unified .p-title-value .prefix,
                html.smg-thread .smg-thead-unified .label,
                html.smg-thread .smg-thead-unified .prefix,
                html.smg-thread .smg-thead-unified [class*="label--"],
                html.smg-thread .smg-thead-unified [class*="prefix--"] {
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    height: 18px !important;
                    min-height: 18px !important;
                    max-height: 18px !important;
                    padding: 0 5px !important;
                    margin: 0 !important;
                    font-size: 9.5px !important;
                    font-weight: 700 !important;
                    line-height: 1 !important;
                    border-radius: 4px !important;
                    vertical-align: middle !important;
                    box-sizing: border-box !important;
                    flex-shrink: 0 !important;
                    transform: none !important;
                }
                html.smg-thread .smg-thead-unified .smg-thead-title-text {
                    display: inline-flex !important;
                    align-items: center !important;
                    font-size: 14px !important;
                    font-weight: 700 !important;
                    line-height: 1 !important;
                    color: #fff !important;
                    margin: 0 !important;
                    padding: 0 0 0 2px !important;
                    white-space: nowrap !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    flex-shrink: 1 !important;
                }
                html.smg-thread .smg-thead-tags {
                    margin: 1px 0 2px !important;
                    padding-left: 0 !important;
                }
                html.smg-thread .p-description .listInline,
                html.smg-thread .p-description .tagList {
                    display: inline-flex !important;
                    flex-wrap: wrap !important;
                    gap: 2px !important;
                    row-gap: 2px !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                html.smg-thread .p-description .listInline > li {
                    display: inline-flex !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                html.smg-thread .p-description .tagList .tagItem,
                html.smg-thread .p-description .tagItem,
                html.smg-thread .tagItem {
                    font-size: 10px !important;
                    padding: 1px 5px !important;
                    border-radius: 4px !important;
                    margin: 0 !important;
                    line-height: 1.25 !important;
                }
                html.smg-thread .p-description .tagList .tagList-icon,
                html.smg-thread .p-description .tagList-icon {
                    margin-right: 1px !important;
                    padding: 0 !important;
                    font-size: 11px !important;
                    align-self: center !important;
                }

                /* Ocultar a linha de ações (.smg-thead-actions) e o paginador (.smg-bar) do header no mobile */
                html.smg-thread .smg-thead-actions,
                html.smg-thread .smg-thead-unified .smg-thead-actions,
                html.smg-thread .smg-thead-unified .p-title > .smg-thead-actions,
                html.smg-thread .smg-thead-unified .p-title > .smg-bar {
                    display: none !important;
                }
                .smg-notices,
                .smg-thead-unified .smg-notices,
                html.smg-thread .smg-notices {
                    display: none !important;
                }
                /* AÇÕES DO POST no celular: salvar e compartilhar viram só ícone e as reações
                   perdem a palavra (fica "joinha 283"). Com os três rótulos a barra quebrava em
                   duas linhas — e "Salvar"/"Compartilhar" são ícones universais, o texto só
                   ocupava espaço. Comentar mantém o rótulo: é a ação principal. */
                html.smg-thread .smg-pc-act--save .smg-pc-act-lbl,
                html.smg-thread .smg-pc-act--share .smg-pc-act-lbl,
                html.smg-thread .smg-pc-act--comment .smg-pc-act-lbl,
                html.smg-thread .smg-cc-act--comment .smg-pc-act-lbl,
                html.smg-thread .smg-react-w { display: none !important; }
                html.smg-thread .smg-pc-act--save,
                html.smg-thread .smg-pc-act--share,
                html.smg-thread .smg-pc-act--comment { padding: 0 10px !important; }
                html.smg-thread .smg-pc-actions { gap: 2px; flex-wrap: nowrap; padding: 10px 14px 12px; }
                html.smg-thread .smg-pc-act { padding: 0 11px !important; }
                html.smg-thread .smg-pc-morewrap { margin-left: auto; }   /* ⋯ encostado na direita */

            }

            /* barra de navegação/ações: paginação colada à ESQUERDA, ações/ordenação empurradas
               pra DIREITA (preenche a largura toda); mobile = empilhado */
            html.smg-thread .block-outer {
                display: flex !important; align-items: center !important; justify-content: flex-start !important;
                flex-wrap: wrap !important; gap: 0 !important; margin: 0 !important; padding-bottom: 0 !important;
            }
            /* espaçamento vertical enxuto: cola título→barra→posts */
            html.smg-thread .p-body-header { padding-top: 26px !important; padding-bottom: 4px !important; margin-bottom: 0 !important; }
            html.smg-thread .p-body-header .p-description { margin-bottom: 0 !important; }
            html.smg-thread .block-outer + * { margin-top: 4px !important; }
            html.smg-thread .block.block--messages,
            html.smg-thread .block-body--messages,
            html.smg-thread .js-replyNewMessageContainer { margin-top: 4px !important; }
            html.smg-thread .block-outer-main { flex: 0 1 auto !important; margin: 0 auto 0 0 !important; min-width: 0 !important; }
            html.smg-thread .block-outer-opposite { flex: 0 0 auto !important; margin: 0 !important; }
            /* mata o centramento nativo do pager (era o que indentava a paginação) */
            html.smg-thread .pageNavWrapper { justify-content: flex-start !important; align-items: center !important; text-align: left !important; margin: 0 !important; }
            html.smg-thread .pageNav { display: flex !important; align-items: center !important; justify-content: flex-start !important; margin: 0 !important; gap: 6px !important; }
            html.smg-thread .pageNav-main { display: flex !important; align-items: center; gap: 6px !important; flex-wrap: wrap; margin: 0 !important; padding: 0 !important; }
            /* o <li> (pageNav-page) era o que deslocava os números pra baixo: zera padding/line-height e centra */
            html.smg-thread .pageNav-page { display: flex !important; align-items: center !important; margin: 0 !important; padding: 0 !important; line-height: 1 !important; }
            html.smg-thread .pageNavSimple { justify-content: flex-start !important; margin: 0 !important; gap: 6px !important; align-items: center; }
            /* mostra só UM paginador (evita o pager completo + o "1 of N" juntos): completo no desktop */
            html.smg-thread .pageNavWrapper .pageNavSimple { display: none !important; }
            /* === BARRA ÚNICA: MESMO estilo de botão pra TODOS (pager · ações · ordenar) === */
            html.smg-thread .block-outer-opposite .buttonGroup { display: flex !important; gap: 6px !important; flex-wrap: wrap !important; align-items: center; }
            html.smg-thread .block-outer-opposite .tabs { justify-content: flex-start !important; border: 0 !important; box-shadow: none !important; gap: 6px !important; display: flex !important; }
            html.smg-thread .pageNavSimple-el,
            html.smg-thread .pageNav-jump,
            html.smg-thread .pageNav-page > a,
            html.smg-thread .block-outer-opposite .button,
            html.smg-thread .block-outer-opposite .button--link,
            html.smg-thread .block-outer-opposite .smgTranslator-globalBtn,
            html.smg-thread .block-outer-opposite .tabs-tab {
                border-radius: 10px !important; border: 1px solid var(--smg-bd) !important;
                background: var(--smg-s1) !important; color: rgba(255,255,255,0.85) !important; box-shadow: none !important;
                min-height: 36px !important; padding: 0 14px !important; margin: 0 !important;
                font-weight: 600; display: inline-flex !important; align-items: center; justify-content: center;
            }
            html.smg-thread .pageNavSimple-el:hover,
            html.smg-thread .pageNav-jump:hover,
            html.smg-thread .pageNav-page > a:hover,
            html.smg-thread .block-outer-opposite .button:hover,
            html.smg-thread .block-outer-opposite .button--link:hover,
            html.smg-thread .block-outer-opposite .smgTranslator-globalBtn:hover,
            html.smg-thread .block-outer-opposite .tabs-tab:hover {
                background: var(--smg-s2) !important; border-color: var(--smg-bd2) !important; color: #fff !important;
            }
            /* SELECIONADO (página atual · ordenação ativa) = BRANCO */
            html.smg-thread .pageNav-page--current > a,
            html.smg-thread .block-outer-opposite .tabs-tab.is-active {
                background: #fff !important; color: #141414 !important; border-color: #fff !important; box-shadow: none !important;
            }
            /* mata TODOS os pseudos nativos do pager: a SETA dupla (XF desenha ‹ › via ::before/::after
               no .pageNav-jump — meu ícone vinha por cima) e o INDICADOR VERDE da página atual */
            html.smg-thread .pageNavWrapper::before, html.smg-thread .pageNavWrapper::after,
            html.smg-thread .pageNav::before, html.smg-thread .pageNav::after,
            html.smg-thread .pageNav-main::before, html.smg-thread .pageNav-main::after,
            html.smg-thread .pageNav-jump::before, html.smg-thread .pageNav-jump::after,
            html.smg-thread .pageNavSimple::before, html.smg-thread .pageNavSimple::after,
            html.smg-thread .pageNavSimple-el::before, html.smg-thread .pageNavSimple-el::after,
            html.smg-thread .pageNav-page::before, html.smg-thread .pageNav-page::after,
            html.smg-thread .pageNav-page > a::before, html.smg-thread .pageNav-page > a::after,
            html.smg-thread .pageNav-page--current::before, html.smg-thread .pageNav-page--current::after,
            html.smg-thread .pageNav-page--current > a::before, html.smg-thread .pageNav-page--current > a::after { content: none !important; display: none !important; border: 0 !important; background: none !important; box-shadow: none !important; }
            /* o "verde abaixo" pode vir das bordas/box-shadow nativos dos containers e do <li> current */
            html.smg-thread .pageNavWrapper, html.smg-thread .pageNav, html.smg-thread .pageNav-main,
            html.smg-thread .pageNav-page, html.smg-thread .pageNav-page--current { border: 0 !important; box-shadow: none !important; background: none !important; }
            html.smg-thread .pageNav-page--current > a { text-decoration: none !important; }
            html.smg-thread .block-outer a:focus, html.smg-thread .block-outer a:focus-visible,
            html.smg-thread .block-outer button:focus, html.smg-thread .block-outer button:focus-visible { outline: none !important; box-shadow: none !important; }
            /* CTA de responder (SMG) em destaque (botão branco) */
            html.smg-thread .p-title-pageAction .button--cta {
                border-radius: 10px !important; border: none !important;
                background: #fff !important; color: #141414 !important;
            }
            /* PADRONIZA botões de ÍCONE (sino · calendário · estrela): quadrados idênticos, ícone 18px centralizado */
            html.smg-thread .smg-iconified {
                width: 36px !important; min-width: 36px !important; max-width: 36px !important; flex: 0 0 36px !important;
                height: 36px !important; min-height: 36px !important; padding: 0 !important; gap: 0 !important;
                display: inline-flex !important; align-items: center !important; justify-content: center !important;
            }
            html.smg-thread .smg-iconified .smg-ic { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; }
            html.smg-thread .smg-iconified .smg-ic svg { width: 18px !important; height: 18px !important; display: block; fill: none !important; }
            html.smg-thread .smg-iconified .button-text { display: none !important; }
            /* mata baseline/borda/pseudo nativos das tabs (o "1px fantasma" na barra) */
            html.smg-thread .block-outer-opposite .tabs { border: 0 !important; box-shadow: none !important; background: transparent !important; padding: 0 !important; margin: 0 !important; }
            html.smg-thread .block-outer-opposite .tabs::before,
            html.smg-thread .block-outer-opposite .tabs::after,
            html.smg-thread .block-outer-opposite .tabs-tab::before,
            html.smg-thread .block-outer-opposite .tabs-tab::after { content: none !important; display: none !important; border: 0 !important; }

            /* ORDENAR (data ⇄ reações): SWITCH segmentado — container = pílula; opção ATIVA = knob
               branco (o "indicador q dá pra mudar"); cada opção tem ícone + label (não é só ícone).
               scoped com .block-outer-opposite p/ vencer o estilo de pílula genérico das .tabs-tab */
            html.smg-thread .block-outer-opposite .smg-sortseg {
                display: inline-flex !important; align-items: center !important; gap: 3px !important;
                height: 36px !important; min-height: 36px !important; box-sizing: border-box !important;
                padding: 3px !important; margin: 0 !important;
                background: var(--smg-s1) !important; border: 1px solid var(--smg-bd) !important;
                border-radius: 10px !important; box-shadow: none !important;
            }
            html.smg-thread .block-outer-opposite .smg-sortseg .tabs-tab {
                display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 6px !important;
                height: 28px !important; min-height: 28px !important; padding: 0 12px !important; margin: 0 !important;
                border: 0 !important; border-radius: 7px !important; background: transparent !important;
                color: rgba(255,255,255,0.6) !important; font-size: 13px !important; font-weight: 600 !important;
                box-shadow: none !important; transition: background .15s ease, color .15s ease;
            }
            html.smg-thread .block-outer-opposite .smg-sortseg .tabs-tab:hover { color: #fff !important; background: var(--smg-s3) !important; }
            html.smg-thread .block-outer-opposite .smg-sortseg .tabs-tab.is-active { background: #fff !important; color: #141414 !important; }
            html.smg-thread .smg-sortseg .smg-ic { display: inline-flex; align-items: center; justify-content: center; width: 15px; height: 15px; }
            html.smg-thread .smg-sortseg .smg-ic svg { width: 15px !important; height: 15px !important; display: block; fill: none !important; }
            html.smg-thread .smg-sortseg .smg-seg-label { line-height: 1; white-space: nowrap; }

            /* mobile: TUDO numa linha só, alinhado à direita; paginador compacto */
            @media (max-width: 600px) {
                html.smg-thread .block-outer {
                    flex-direction: row !important; flex-wrap: nowrap !important;
                    justify-content: flex-end !important; align-items: center !important;
                    gap: 0 !important; overflow-x: auto; -webkit-overflow-scrolling: touch;
                }
                html.smg-thread .block-outer::-webkit-scrollbar { display: none; }
                html.smg-thread .block-outer-main { margin: 0 !important; flex: 0 0 auto !important; }
                html.smg-thread .block-outer-opposite { width: auto !important; flex: 0 0 auto !important; }
                html.smg-thread .block-outer-opposite .tabs { width: auto !important; overflow: visible; }
                html.smg-thread .smg-thread-back { display: inline-flex; }
                /* paginador: só o simples e SEM ‹‹ ›› (primeiro/último), bem compacto */
                html.smg-thread .pageNavWrapper .pageNav { display: none !important; }
                html.smg-thread .pageNavWrapper .pageNavSimple { display: flex !important; }
                html.smg-thread .pageNavSimple-el--first, html.smg-thread .pageNavSimple-el--last { display: none !important; }
                /* todos os botões da barra com o MESMO tamanho compacto no mobile */
                html.smg-thread .pageNavSimple-el,
                html.smg-thread .pageNav-jump,
                html.smg-thread .block-outer-opposite .button,
                html.smg-thread .block-outer-opposite .button--link,
                html.smg-thread .block-outer-opposite .smgTranslator-globalBtn,
                html.smg-thread .block-outer-opposite .tabs-tab { min-height: 34px !important; padding: 0 11px !important; font-size: 13px !important; }
                /* botões de ícone quadrados 34x34 (mesmo tamanho dos demais) */
                html.smg-thread .smg-iconified { width: 34px !important; min-width: 34px !important; max-width: 34px !important; flex: 0 0 34px !important; height: 34px !important; min-height: 34px !important; padding: 0 !important; }
                /* switch de ordenação: 34px (bate com os outros) */
                html.smg-thread .block-outer-opposite .smg-sortseg { height: 34px !important; min-height: 34px !important; }
                html.smg-thread .block-outer-opposite .smg-sortseg .tabs-tab { height: 26px !important; min-height: 26px !important; padding: 0 10px !important; font-size: 12.5px !important; }
            }

            /* ---- preview da thumbnail no hover ---- */
            #smg-thumb-pop {
                position: fixed; z-index: 1000002; display: none; pointer-events: none;
                border-radius: 12px; overflow: hidden; background: #0d0e12;
                border: 1px solid rgba(255,255,255,0.18);
                box-shadow: 0 20px 55px rgba(0,0,0,0.65);
            }
            #smg-thumb-pop img { display: block; max-width: min(620px, 46vw); max-height: 84vh; object-fit: contain; }

            /* ---- modo grade (cards, máx 6 colunas) — .smg-tl-grid é marcado via JS no
               container real dos itens (varia entre fórum e watched) ---- */
            html.smg-threadlist.smg-tv-grid .smg-tl-grid {
                display: grid !important;
                grid-template-columns: repeat(auto-fill, minmax(max(170px, calc((100% - 56px) / 5)), 1fr)) !important;
                gap: 14px !important;
                padding: 14px !important;
                align-items: start !important;
            }
            html.smg-threadlist.smg-tv-grid .smg-tl-grid > .smg-inf-sep { grid-column: 1 / -1 !important; }
            html.smg-threadlist.smg-tv-grid .stickySeparatortop,
            html.smg-threadlist.smg-tv-grid .stickySeparatorbottom { display: none !important; }
            /* ---- GRID DE TÓPICOS IDENTICO AO NOSSO MODELO ---- */
            html.smg-threadlist.smg-tv-grid .structItem--thread {
                display: flex !important;
                flex-direction: column !important;
                align-items: stretch !important;
                gap: 0 !important;
                padding: 0 !important;
                border: 1px solid rgba(127,127,127,0.18) !important;
                border-radius: 12px !important;
                overflow: hidden !important;
                background: rgba(127,127,127,0.06) !important;
                position: relative !important;
                transition: border-color .14s ease, transform .14s ease, box-shadow .14s ease !important;
                content-visibility: auto;
                contain-intrinsic-size: auto 320px;
            }
            html.smg-threadlist.smg-tv-grid .structItem--thread:hover {
                border-color: var(--smg-bd2, rgba(255,255,255,0.22)) !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important;
            }
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-cell--icon:not(.structItem-cell--iconEnd),
            html.smg-threadlist.smg-tv-grid .structItem--thread .dcThumbnail,
            html.smg-threadlist.smg-tv-grid .structItem--thread .dtt-thread-thumbnail {
                width: 100% !important;
                aspect-ratio: 1 / 1 !important;
                height: auto !important;
                border-radius: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                flex: 0 0 auto !important;
                position: relative !important;
            }
            html.smg-threadlist.smg-tv-grid .structItem--thread .dcThumbnail img,
            html.smg-threadlist.smg-tv-grid .structItem--thread .dtt-thread-thumbnail img {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                border-radius: 0 !important;
                display: block !important;
            }

            /* Ocultar status nativos dentro de .structItem--thread (mantém apenas o pontinho ciano inline ao lado do título) */
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-statuses,
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-status,
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-status--unread {
                display: none !important;
            }

            .smg-thread-unwatch-btn {
                position: absolute !important;
                top: 6px !important;
                right: 6px !important;
                z-index: 5 !important;
                width: 28px !important;
                height: 28px !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                background: rgba(0,0,0,0.65) !important;
                border: 0 !important;
                border-radius: 8px !important;
                color: rgba(255,255,255,0.8) !important;
                cursor: pointer !important;
                opacity: 0 !important;
                transition: opacity .14s ease, background .14s ease, color .14s ease, transform .14s ease !important;
            }
            .structItem--thread:hover .smg-thread-unwatch-btn,
            .structItem-cell--icon:hover .smg-thread-unwatch-btn {
                opacity: 1 !important;
            }
            .smg-thread-unwatch-btn.is-following {
                opacity: 0.85 !important;
                color: var(--smg-link, #ff77b2) !important;
                background: rgba(0,0,0,0.75) !important;
            }
            .smg-thread-unwatch-btn.is-following:hover {
                background: rgba(244,63,94,0.9) !important;
                color: #fff !important;
            }
            .smg-thread-unwatch-btn:not(.is-following):hover {
                background: var(--smg-link, #ff77b2) !important;
                color: #fff !important;
            }
            .smg-thread-unwatch-btn:hover {
                transform: scale(1.08) !important;
            }
            .smg-thread-unwatch-btn svg {
                width: 15px !important;
                height: 15px !important;
                fill: none !important;
                stroke: currentColor !important;
                stroke-width: 2px !important;
            }

            /* Corpo do Card */
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-cell--main {
                width: 100% !important;
                box-sizing: border-box !important;
                padding: 8px 12px 12px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 0 !important;
                flex: 1 1 auto !important;
            }

            /* Row 1 (Badges em Linha Única) e Row 2 (Título) */
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-title {
                display: flex !important;
                flex-direction: row !important;
                flex-wrap: wrap !important;
                align-items: center !important;
                gap: 4px !important;
                font-size: 14.5px !important;
                font-weight: 700 !important;
                line-height: 1.3 !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .structItem--thread .structItem-title .label,
            .structItem-title .label,
            .structItem-title .prefix,
            .structItem .label,
            .labelLink .label {
                font-size: 9.5px !important;
                padding: 1.5px 5.5px !important;
                border-radius: 4px !important;
                line-height: 1.2 !important;
            }
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-title a[href*="/threads/"],
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-title a:not(.label):not(.labelLink) {
                width: 100% !important;
                display: block !important;
                margin-top: 5px !important;
                color: #fff !important;
                text-decoration: none !important;
                word-break: break-word !important;
            }
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-title a:hover {
                color: var(--smg-link, #ff77b2) !important;
                text-decoration: underline !important;
            }

            /* Row 3 (Data Discreta) */
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-minor {
                display: flex !important;
                flex-direction: column !important;
                gap: 0 !important;
                margin-top: 4px !important;
                padding: 0 !important;
            }
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-parts {
                display: flex !important;
                align-items: center !important;
                margin: 0 !important;
                padding: 0 !important;
                list-style: none !important;
            }
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-parts li:not(.structItem-startDate) {
                display: none !important;
            }
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-startDate,
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-startDate time {
                color: rgba(255,255,255,0.45) !important;
                font-size: 11.5px !important;
                font-weight: 500 !important;
                margin: 0 !important;
                padding: 0 !important;
            }

            .smg-card-dates {
                display: flex !important;
                flex-wrap: wrap !important;
                align-items: center !important;
                gap: 5px !important;
                margin-top: 6px !important;
                font-size: 11.5px !important;
                color: rgba(255,255,255,0.45) !important;
                line-height: 1.3 !important;
            }
            .smg-card-date-val { color: rgba(255,255,255,0.7) !important; font-weight: 600 !important; }
            .smg-card-date-sep { color: rgba(255,255,255,0.25) !important; }

            /* Row 4 (Chips de Paginação) */
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-pageJump {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 3px !important;
                margin-top: 7px !important;
                width: 100% !important;
                padding: 0 !important;
            }
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-pageJump a {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 11px !important;
                font-weight: 700 !important;
                padding: 2px 6px !important;
                border-radius: 4px !important;
                background: rgba(255,255,255,0.08) !important;
                color: rgba(255,255,255,0.65) !important;
                text-decoration: none !important;
            }
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-pageJump a:hover {
                background: var(--smg-link, #ff77b2) !important;
                color: #000 !important;
            }
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-cell--meta,
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-cell--latest,
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-cell--iconEnd,
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-extraInfo,
            html.smg-threadlist.smg-tv-grid .structItem--thread input[name="thread_ids[]"],
            html.smg-threadlist.smg-tv-grid .structItem--thread .structItem-minor .structItem-statuses {
                display: none !important;
            }
            html.smg-threadlist.smg-tv-grid .structItem--thread.is-unread .structItem-title a[href*="/threads/"]::after,
            html.smg-threadlist.smg-tv-grid .structItem--thread.is-unread .structItem-title a[data-tp-primary]::after {
                content: "" !important;
                display: inline-block !important;
                width: 7px !important;
                height: 7px !important;
                border-radius: 50% !important;
                background: #00d2ff !important;
                box-shadow: 0 0 6px rgba(0, 210, 255, 0.8) !important;
                margin-left: 6px !important;
                vertical-align: middle !important;
            }
            html.smg-threadlist:not(.smg-tv-grid) .structItem--thread { content-visibility: auto; contain-intrinsic-size: auto 112px; }
            html.smg-threadlist .message--articlePreview { content-visibility: auto; contain-intrinsic-size: auto 360px; }
            /* ads injetados na lista (samUnitWrapper) são .structItem--thread → viram célula VAZIA
               no grid. Some de vez (no grid e na lista) — corrige os "buracos" do grid. */
            html.smg-threadlist .structItem--thread.samUnitWrapper { display: none !important; }
            /* PLACEHOLDER (marca SMG) nos cards sem thumb real — no lugar do avatar/thumb-quebrada/vazio.
               esconde avatar + thumb (quebrada) em QUALQUER modo; o tamanho do placeholder muda por modo. */
            .smg-thumb-ph { display: none; }
            html.smg-threadlist .structItem--thread.smg-no-thumb .structItem-cell--icon:not(.structItem-cell--iconEnd) .avatar,
            html.smg-threadlist .structItem--thread.smg-no-thumb .dcThumbnail,
            html.smg-threadlist .structItem--thread.smg-no-thumb .dtt-thread-thumbnail { display: none !important; }
            .smg-thumb-ph { align-items: center; justify-content: center; box-sizing: border-box;
                background: radial-gradient(circle at 50% 40%, var(--smg-s3), var(--smg-s1)); }
            /* GRID: quadrado, ocupa a célula toda */
            html.smg-threadlist.smg-tv-grid .structItem--thread.smg-no-thumb .smg-thumb-ph {
                display: flex !important; width: 100% !important; aspect-ratio: 1 / 1;
            }
            /* LISTA (sem grid): no tamanho do thumb da lista (210×132 desktop) */
            html.smg-threadlist:not(.smg-tv-grid) .structItem--thread.smg-no-thumb .smg-thumb-ph {
                display: flex !important; width: 210px; height: 132px; flex: 0 0 auto; border-radius: 8px;
            }
            @media (max-width: 600px) {
                /* LISTA mobile: thumb 92×70 + marca menor */
                html.smg-threadlist:not(.smg-tv-grid) .structItem--thread.smg-no-thumb .smg-thumb-ph { width: 92px; height: 70px; border-radius: 7px; }
                html.smg-threadlist:not(.smg-tv-grid) .structItem--thread.smg-no-thumb .smg-ph-word { font-size: 15px; letter-spacing: 1px; }
            }
            .smg-ph-word { font-size: 34px; font-weight: 800; letter-spacing: 2px; color: rgba(255,255,255,0.2); line-height: 1; user-select: none; }
            .smg-ph-g { color: rgba(255,77,141,0.45); }

            /* ===== forum_view_type_article (ex.: /forums/games.91/): threads = .message--articlePreview (NÃO .structItem--thread).
               Vira o MESMO grid de cards das outras páginas (imagem 1:1 + título + meta), sem o excerpt.
               .smg-article-grid é marcado via JS no container (pega sticky/featured fora do .block-body). ===== */
            /* GRADE (modo grade): gated em smg-tv-grid → o toggle lista/grade da dock vale aqui também */
            html.smg-threadlist.smg-tv-grid .smg-article-grid {
                display: grid !important;
                grid-template-columns: repeat(auto-fill, minmax(max(170px, calc((100% - 56px) / 5)), 1fr)) !important;
                gap: 14px !important; padding: 14px !important; background: transparent !important; align-items: start !important;
            }
            html.smg-threadlist.smg-tv-grid .smg-article-grid > .smg-inf-sep { grid-column: 1 / -1 !important; }
            /* LISTA (modo lista): card horizontal (imagem à esquerda + texto à direita) */
            html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid { display: flex !important; flex-direction: column !important; gap: 10px !important; padding: 12px 0 !important; }
            html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid .message--articlePreview { flex-direction: row !important; }
            html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid .articlePreview-main { flex-direction: row !important; align-items: stretch !important; gap: 0 !important; }
            html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid .articlePreview-image,
            html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid .smg-art-ph { flex: 0 0 210px !important; width: 210px !important; aspect-ratio: 16 / 10 !important; }
            html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid .articlePreview-text { flex: 1 1 auto !important; justify-content: center !important; padding: 10px 16px !important; }
            @media (max-width: 600px) {
                html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid .articlePreview-image,
                html.smg-threadlist:not(.smg-tv-grid) .smg-article-grid .smg-art-ph { flex-basis: 116px !important; width: 116px !important; }
            }
            html.smg-threadlist .message--articlePreview {
                display: flex !important; flex-direction: column !important; margin: 0 !important; padding: 0 !important;
                width: auto !important; max-width: none !important; min-width: 0 !important; float: none !important;   /* item de grid limpo */
                background: var(--smg-s1) !important; border: 1px solid var(--smg-bd) !important;
                border-radius: 12px !important; overflow: hidden !important;
                transition: border-color .14s ease, transform .14s ease;
            }
            html.smg-threadlist .message--articlePreview:hover { border-color: var(--smg-bd2) !important; transform: translateY(-2px); }
            html.smg-threadlist .articlePreview-main { display: flex !important; flex-direction: column !important; align-items: stretch !important; gap: 0 !important; padding: 0 !important; }
            /* imagem (ou placeholder) 1:1 no topo — igual ao grid de structItem.
               img em position:absolute → quebra a dependência circular (height:auto + img 100%) que fazia
               o aspect-ratio ser ignorado (imagem gigante/colapsada → grid torto) */
            html.smg-threadlist .articlePreview-image,
            html.smg-threadlist .message--articlePreview .smg-art-ph {
                position: relative !important; display: block !important;
                width: 100% !important; aspect-ratio: 1 / 1 !important; height: auto !important; margin: 0 !important;
                overflow: hidden !important; background: var(--smg-s2); border-radius: 0 !important; box-sizing: border-box;
            }
            html.smg-threadlist .articlePreview-image img {
                position: absolute !important; inset: 0 !important;
                width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important;
                object-fit: cover !important; display: block !important; border-radius: 0 !important;
            }
            html.smg-threadlist .message--articlePreview .smg-art-ph {
                display: flex !important; align-items: center !important; justify-content: center !important;
                background: radial-gradient(circle at 50% 40%, var(--smg-s3), var(--smg-s1)) !important; text-decoration: none;
            }
            /* embeds/jogos do trecho que escapam (ex.: Virtualfem) — NÃO renderiza dentro do card */
            html.smg-threadlist .message--articlePreview iframe,
            html.smg-threadlist .message--articlePreview .generic2wide-iframe-div,
            html.smg-threadlist .message--articlePreview .smg-turbo-slot,
            html.smg-threadlist .message--articlePreview [data-s9e-mediaembed],
            html.smg-threadlist .message--articlePreview .bbImageWrapper { display: none !important; }
            html.smg-threadlist .articlePreview-text { display: flex !important; flex-direction: column !important; gap: 6px !important; padding: 9px 12px 0 !important; min-width: 0 !important; }
            html.smg-threadlist .articlePreview-headline { margin: 0 !important; }
            html.smg-threadlist .articlePreview-title { font-size: 14.5px !important; font-weight: 600 !important; line-height: 1.3 !important; margin: 0 !important; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            html.smg-threadlist .articlePreview-title a { color: #fff !important; }
            html.smg-threadlist .articlePreview-title .label { font-size: 9.5px !important; padding: 1.5px 5px !important; border-radius: 4px !important; }
            /* excerpt + "view full article" saem (igual ao grid de structItem = só thumb+título+meta) */
            html.smg-threadlist .articlePreview-content,
            html.smg-threadlist .articlePreview-links { display: none !important; }
            /* rodapé enxuto: avatar · autor · data · respostas (sem share/embed) */
            html.smg-threadlist .articlePreview-footer { margin-top: auto !important; padding: 7px 12px 11px !important; border: 0 !important; background: transparent !important; }
            html.smg-threadlist .articlePreview-meta { display: flex !important; align-items: center !important; gap: 7px !important; flex-wrap: nowrap !important; margin: 0 !important; padding: 0 !important; list-style: none !important; font-size: 11.5px !important; color: rgba(255,255,255,0.5) !important; overflow: hidden; }
            html.smg-threadlist .articlePreview-meta > li { display: inline-flex !important; align-items: center; margin: 0 !important; min-width: 0; }
            html.smg-threadlist .articlePreview-meta > li.js-embedCopy,
            /* (li do "share" no meta dos article cards: escondido pelo JS no styleArticleCards — era o último :has por-li em grid com infinite scroll) */
            html.smg-threadlist .articlePreview-by { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            html.smg-threadlist .articlePreview-by a { color: rgba(255,255,255,0.72) !important; }
            html.smg-threadlist .articlePreview-meta .simp-avatar-border-wrap, html.smg-threadlist .articlePreview-meta .avatar { width: 20px !important; height: 20px !important; flex: 0 0 auto; }
            html.smg-threadlist .articlePreview-meta .avatar { border-radius: 50% !important; overflow: hidden; }
            html.smg-threadlist .articlePreview-meta .avatar img, html.smg-threadlist .articlePreview-meta .avatar span { width: 20px !important; height: 20px !important; font-size: 10px !important; line-height: 20px !important; }
            html.smg-threadlist .articlePreview-meta .simp-avatar-border { display: none !important; }   /* tira a moldura decorativa */
            html.smg-threadlist .articlePreview-replies { margin-left: auto !important; flex: 0 0 auto; }
            html.smg-threadlist .articlePreview-replies a { color: rgba(255,255,255,0.6) !important; }
            @media (max-width: 600px) {
                html.smg-threadlist .block--articles .block-body,
                html.smg-threadlist .smg-article-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px !important; padding: 11px !important; }
                html.smg-threadlist .articlePreview-title { font-size: 13px !important; }
            }

            /* ---- feed: barra de ferramentas (download / galeria / filtro / mudo) ---- */
            .smg-feed-tools { position: absolute; top: 18px; right: 84px; z-index: 6; display: flex; gap: 10px; }
            .smg-feed-tool {
                width: 46px; height: 46px; font-size: 21px;
                display: flex; align-items: center; justify-content: center;
                border-radius: 50%; cursor: pointer; color: #fff;
                border: 1px solid rgba(255,255,255,0.15);
                background: rgba(20,20,24,0.82);   /* PERF: sem backdrop-filter (repintava no scroll do reel) */
                transition: background .15s ease, transform .12s ease;
            }
            .smg-feed-tool:hover { background: rgba(42,42,50,0.85); }
            .smg-feed-tool:active { transform: scale(0.9); }
            .smg-feed-tool.smg-active { background: var(--smg-link-strong, #d14d8f); border-color: var(--smg-link-strong, #d14d8f); color: #fff; }
            .smg-feed-tool svg { width: 1em; height: 1em; display: block; }
            /* o CSS do fórum enche os SVGs (fill); força outline em tudo dentro do feed */
            #smg-feed svg { fill: none !important; }
            #smg-feed .smg-rgc-play svg, #smg-feed .smg-rgc-barplay svg, #smg-feed .smg-gallery-play svg { fill: currentColor !important; }   /* play/pause + play da galeria são PREENCHIDOS (não outline) → re-afirma o fill, senão somem com a regra acima */

            /* ---- feed: filmstrip (tira de thumbnails) ---- */
            .smg-feed-media { transform-origin: center center; }
            .smg-feed-strip {
                position: absolute; left: 0; right: 0; bottom: 0; height: 92px;
                display: flex; align-items: center; gap: 8px;
                padding: 10px 14px; overflow-x: auto; overflow-y: hidden; z-index: 6;
                background: linear-gradient(0deg, rgba(0,0,0,0.88), rgba(0,0,0,0));
                transform: translateY(110%);
                transition: transform .26s cubic-bezier(.2,.8,.3,1);
                scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.3) transparent;
            }
            .smg-feed-strip::-webkit-scrollbar { height: 7px; }
            .smg-feed-strip::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.25); border-radius: 4px; }
            #smg-feed.strip-open .smg-feed-strip { transform: translateY(0); }
            /* setas < > de navegação do filmstrip (sobre as pontas, com gradiente; somem nas extremidades) */
            .smg-feed-striparrow {
                position: absolute; bottom: 0; height: 92px; width: 54px; z-index: 7;
                display: none; align-items: center; border: 0; color: #fff; cursor: pointer; padding: 0;
                transition: opacity .2s ease;
            }
            #smg-feed.strip-open .smg-feed-striparrow { display: flex; }
            #smg-feed.strip-open .smg-feed-striparrow.is-hidden { opacity: 0; pointer-events: none; }
            .smg-feed-striparrow--prev { left: 0; justify-content: flex-start; padding-left: 10px; background: linear-gradient(90deg, rgba(0,0,0,0.92), rgba(0,0,0,0)); }
            .smg-feed-striparrow--next { right: 0; justify-content: flex-end; padding-right: 10px; background: linear-gradient(270deg, rgba(0,0,0,0.92), rgba(0,0,0,0)); }
            .smg-feed-striparrow svg { width: 26px; height: 26px; filter: drop-shadow(0 1px 3px rgba(0,0,0,0.8)); transition: transform .12s ease; }
            .smg-feed-striparrow:hover svg { transform: scale(1.18); }
            @media (max-width: 600px) { .smg-feed-striparrow { display: none !important; } }   /* mobile: rola por swipe */
            /* thumbs SEMPRE abertas → imagem/iframe/player sobem ~92px pra não ficar atrás do filmstrip */
            #smg-feed.strip-open .smg-feed-media,
            #smg-feed.strip-open .smg-feed-embed iframe { max-height: calc(100vh - 104px); margin-bottom: 92px; }
            #smg-feed.strip-open .smg-feed-embed .smg-rg { max-height: calc(100vh - 104px) !important; margin-bottom: 92px !important; }
            .smg-feed-thumb {
                flex: 0 0 auto; width: 64px; height: 64px; border-radius: 8px; overflow: hidden;
                border: 2px solid transparent; background: #1c1c22; cursor: pointer; padding: 0;
                position: relative; opacity: .6;
                transition: opacity .15s ease, border-color .15s ease, transform .12s ease;
            }
            .smg-feed-thumb:hover { opacity: 1; transform: translateY(-2px); }
            .smg-feed-thumb.active { opacity: 1; border-color: rgba(255,255,255,0.7); }
            .smg-feed-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .smg-feed-thumb-embed { display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.8); font-size: 22px; }
            .smg-feed-thumb-embed svg { width: 1em; height: 1em; }

            /* ITENS ativos/atuais/primários seguem o ACENTO do tema (eram BRANCOS nos 2 sites → agora verde/rosa por site) */
            /* (a aba ativa da home saiu daqui: agora é sublinhado-accent, não fill — ver .smg-feed-tab::after) */
            .smg-tb-search-go,
            .smg-search-go,
            .smg-search-author-btn.has-value,
            .smg-bar-btn--current,
            .smg-bar-go,
            html.smg-thread .pageNav-page--current > a,
            html.smg-threadlist .pageNav-page--current > a,
            html.smg-thread .block-outer-opposite .smg-sortseg .tabs-tab.is-active {
                background: var(--smg-link-strong, #d14d8f) !important;
                color: #fff !important;
                border-color: var(--smg-link-strong, #d14d8f) !important;
            }

            /* ===== modal de DOWNLOAD ===== */
            #smg-dl-modal [hidden] { display: none !important; }   /* nossas seções têm display próprio → [hidden] precisa vencer (era o "tudo junto") */
            #smg-dl-modal { position: fixed; inset: 0; z-index: 2147483640; display: flex; align-items: center; justify-content: center; padding: 16px; background: var(--smg-scrim, rgba(0,0,0,0.66)); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }
            .smg-dl-card { width: min(440px, 100%); max-height: 86vh; display: flex; flex-direction: column; background: var(--smg-s1); border: 1px solid var(--smg-bd2); border-radius: 16px; box-shadow: 0 24px 64px rgba(0,0,0,0.62); overflow: hidden; }
            .smg-dl-head { display: flex; align-items: center; justify-content: space-between; padding: 15px 18px; border-bottom: 1px solid var(--smg-bd); }
            .smg-dl-title { font-size: 16px; font-weight: 800; color: #fff; }
            .smg-dl-x { width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 9px; background: transparent; color: rgba(255,255,255,0.65); cursor: pointer; font-size: 18px; }
            .smg-dl-x:hover { background: var(--smg-s2); color: #fff; }
            .smg-dl-x svg { fill: none !important; }
            .smg-dl-body { padding: 18px; overflow-y: auto; }
            .smg-dl-scan { display: flex; align-items: center; gap: 11px; color: rgba(255,255,255,0.82); font-size: 14px; }
            .smg-dl-spin { flex: 0 0 auto; width: 18px; height: 18px; border-radius: 50%; border: 2.5px solid rgba(255,255,255,0.18); border-top-color: var(--smg-link, #ff77b2); animation: smg-dl-spin .7s linear infinite; }
            @keyframes smg-dl-spin { to { transform: rotate(360deg); } }
            .smg-dl-summary { display: flex; flex-direction: column; gap: 9px; }
            .smg-dl-stat { font-size: 14px; color: rgba(255,255,255,0.78); }
            .smg-dl-stat b { color: #fff; font-size: 19px; font-weight: 800; margin-right: 5px; }
            .smg-dl-hosts { color: rgba(255,255,255,0.5); font-size: 12px; }
            .smg-dl-warn { margin-top: 4px; font-size: 12px; color: rgba(255,200,120,0.85); }
            .smg-dl-empty { color: rgba(255,255,255,0.6); font-size: 14px; }
            .smg-dl-progress { display: flex; flex-direction: column; gap: 9px; }
            .smg-dl-bar { height: 8px; border-radius: 999px; background: var(--smg-s3); overflow: hidden; }
            .smg-dl-bar span { display: block; height: 100%; width: 0; background: var(--smg-link-strong, var(--smg-link, #ff77b2)); transition: width .2s ease; }
            .smg-dl-progtxt { font-size: 12.5px; color: rgba(255,255,255,0.6); font-variant-numeric: tabular-nums; }
            .smg-dl-foot { display: flex; gap: 10px; padding: 14px 18px; border-top: 1px solid var(--smg-bd); }
            .smg-dl-btn { flex: 1; padding: 11px; border: 1px solid var(--smg-bd2); border-radius: 11px; background: var(--smg-s2); color: #fff; font-size: 13.5px; font-weight: 700; cursor: pointer; transition: background .14s ease, filter .14s ease; }
            .smg-dl-btn:hover { background: var(--smg-s3); }
            .smg-dl-btn.smg-dl-zip { background: var(--smg-link-strong, #d14d8f); border-color: var(--smg-link-strong, #d14d8f); }
            .smg-dl-btn.smg-dl-zip:hover { background: var(--smg-link-strong, #d14d8f); filter: brightness(1.1); }

            /* ============================================================
               POST estilo REDDIT (.smg-pc no <article>): 1 coluna · header · conteúdo · action bar.
               O JS moveu os nativos pro card; aqui esconde os containers esvaziados e estiliza.
               ============================================================ */
            /* contain layout+style (SEM paint/size): mutação intra-post (player montando, masonry, smg-img-ready)
               não invalida o layout dos outros N posts. abs/fixed: nada dentro do post ancora fora dele
               (morepop é absolute no morewrap relative); medidas via getBoundingClientRect seguem normais. */
            html.smg-thread .smg-pc { background: var(--smg-s1, #16171b) !important; border: 1px solid rgba(255,255,255,0.11) !important; border-radius: 18px !important; margin: 0 0 14px; overflow: visible; transition: border-color .16s ease, box-shadow .16s ease; contain: layout style; }
            html.smg-thread .smg-pc:hover { border-color: rgba(255,255,255,0.22) !important; box-shadow: 0 4px 18px rgba(0,0,0,0.35) !important; }   /* realce no hover (estilo Reddit) — !important p/ vencer o tema do SMG */
            /* SMG: o card usa as superfícies (cinzas) do SimpCity — mais escuras que o tema SMG (s1 12.5 vs 13.5 etc.). Escopo .smg-pc → só os cards/posts; o resto do SMG mantém o tema dele. (escolha do user) */
            html.smg-smg .smg-pc { --smg-s1: hsl(0 0% 12.5%); --smg-s2: hsl(0 0% 16%); --smg-s3: hsl(0 0% 21%); }
            /* QUOTES / unfurl dentro do post: inset escuro (recuado) + border + rounded — !important p/ vencer o cinza claro do tema */
            html.smg-thread .smg-pc .bbCodeBlock { background: rgba(0,0,0,0.22) !important; border: 1px solid rgba(255,255,255,0.08) !important; border-radius: 12px !important; }
            html.smg-thread .smg-pc .bbCodeBlock .contentRow, html.smg-thread .smg-pc .bbCodeBlock-content { background: transparent !important; }

            /* ---- QUOTES MODERNAS (Citações nos posts) ---- */
            .bbCodeBlock--quote,
            blockquote.bbCodeBlock--quote,
            html.smg-thread .smg-pc .bbCodeBlock--quote {
                margin: 16px 0 20px !important;
                padding: 0 !important;
                border: 1px solid rgba(255,255,255,0.09) !important;
                border-left: 4px solid var(--smg-link, #ff77b2) !important;
                border-radius: 12px !important;
                background: var(--smg-s2, rgba(255,255,255,0.04)) !important;
                overflow: hidden !important;
                box-shadow: 0 2px 10px rgba(0,0,0,0.25) !important;
            }
            .bbCodeBlock--quote .bbCodeBlock-title,
            html.smg-thread .smg-pc .bbCodeBlock--quote .bbCodeBlock-title {
                display: flex !important;
                align-items: center !important;
                padding: 10px 16px 8px !important;
                font-size: 13px !important;
                font-weight: 700 !important;
                color: var(--smg-link, #ff77b2) !important;
                background: rgba(0,0,0,0.22) !important;
                border-bottom: 1px solid rgba(255,255,255,0.06) !important;
            }
            .bbCodeBlock--quote .bbCodeBlock-title a,
            .bbCodeBlock--quote .bbCodeBlock-sourceJump {
                color: inherit !important;
                text-decoration: none !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 6px !important;
            }
            .bbCodeBlock--quote .bbCodeBlock-title a:hover {
                text-decoration: underline !important;
            }
            .bbCodeBlock--quote .bbCodeBlock-content,
            html.smg-thread .smg-pc .bbCodeBlock--quote .bbCodeBlock-content {
                padding: 14px 18px 16px !important;
                font-size: 14px !important;
                line-height: 1.65 !important;
                color: var(--smg-tx, #e7e7ea) !important;
                background: transparent !important;
            }
            .bbCodeBlock--quote .bbCodeBlock-expandContent {
                padding: 0 !important;
            }
            /* Gradiente e link "Clique para expandir..." suave e elegante */
            .bbCodeBlock--quote .bbCodeBlock-expandLink,
            .bbCodeBlock--expandable.is-expandable .bbCodeBlock-expandLink {
                background: linear-gradient(to bottom, transparent, var(--smg-s1, #16171b) 90%) !important;
                padding: 28px 0 10px !important;
                text-align: center !important;
            }
            .bbCodeBlock--quote .bbCodeBlock-expandLink a,
            .bbCodeBlock--expandable.is-expandable .bbCodeBlock-expandLink a {
                display: inline-block !important;
                padding: 5px 16px !important;
                border-radius: 999px !important;
                background: var(--smg-s3, rgba(255,255,255,0.08)) !important;
                border: 1px solid rgba(255,255,255,0.12) !important;
                color: var(--smg-link, #ff77b2) !important;
                font-size: 12px !important;
                font-weight: 700 !important;
                cursor: pointer !important;
                transition: background .15s ease, transform .12s ease !important;
            }
            .bbCodeBlock--quote .bbCodeBlock-expandLink a:hover,
            .bbCodeBlock--expandable.is-expandable .bbCodeBlock-expandLink a:hover {
                background: var(--smg-link, #ff77b2) !important;
                color: #fff !important;
            }
            /* Mídias / imagens dentro da citação */
            .bbCodeBlock--quote .auto-image-grid {
                margin: 10px 0 !important;
            }
            .bbCodeBlock--quote img.bbImage {
                max-height: 280px !important;
                object-fit: contain !important;
            }

            /* ---- Spoilers Redesign com Arrow de Collapse ---- */
            .bbCodeSpoiler {
                margin: 10px 0 !important;
                border-radius: 12px !important;
                overflow: hidden !important;
                border: 1px solid var(--smg-bd, rgba(255,255,255,0.12)) !important;
                background: var(--smg-s1, #16171b) !important;
                box-shadow: 0 4px 14px rgba(0,0,0,0.25) !important;
            }
            .bbCodeSpoiler-button {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                width: 100% !important;
                padding: 10px 14px !important;
                background: var(--smg-s2, rgba(255,255,255,0.05)) !important;
                border: none !important;
                border-radius: 0 !important;
                color: var(--smg-tx, #e7e7ea) !important;
                font-size: 13.5px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                transition: background .15s ease, color .15s ease !important;
                box-sizing: border-box !important;
            }
            .bbCodeSpoiler-button:hover {
                background: rgba(255,255,255,0.09) !important;
                color: #fff !important;
            }
            .bbCodeSpoiler-button .button-text {
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
            }
            .bbCodeSpoiler-button .bbCodeSpoiler-button-title {
                color: var(--smg-link, #ff77b2) !important;
                font-weight: 700 !important;
            }
            .smg-spoiler-arrow {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 20px !important;
                height: 20px !important;
                flex-shrink: 0 !important;
                color: var(--smg-tx2, rgba(255,255,255,0.6)) !important;
                transition: transform .2s ease, color .15s ease !important;
            }
            .bbCodeSpoiler-button.is-active .smg-spoiler-arrow,
            .bbCodeSpoiler.is-active .smg-spoiler-arrow,
            .bbCodeSpoiler-button[aria-expanded="true"] .smg-spoiler-arrow {
                transform: rotate(180deg) !important;
                color: var(--smg-link, #ff77b2) !important;
            }
            .bbCodeSpoiler-content {
                padding: 12px 14px !important;
                border-top: 1px solid var(--smg-bd, rgba(255,255,255,0.08)) !important;
                background: var(--smg-s1, #16171b) !important;
                text-align: left !important;
            }
            .bbCodeSpoiler-content .bbCodeBlock--spoiler {
                margin: 0 !important;
                border: none !important;
                background: transparent !important;
                padding: 0 !important;
                text-align: left !important;
            }
            .bbCodeSpoiler-content .bbCodeBlock-content {
                padding: 0 !important;
                text-align: left !important;
            }
            html.smg-thread .smg-pc .message-inner, html.smg-thread .smg-pc .message-cell--main, html.smg-thread .smg-pc .message-main { background: transparent !important; }   /* sem bg quadrado do tema cobrindo os cantos arredondados */
            html.smg-thread .smg-pc .message-inner { display: block; }                                  /* mata o flex de 2 colunas */
            html.smg-thread .smg-pc .message-cell--user { display: none !important; }                   /* avatar/nome/título/stats movidos pro header */
            html.smg-thread .smg-pc .message-cell--main { width: 100%; max-width: none; border: 0 !important; padding: 0 !important; }
            html.smg-thread .smg-pc .message-attribution { display: none !important; }                  /* tempo/#/share/bookmark movidos */
            html.smg-thread .smg-pc .message-actionBar { display: none !important; }                    /* react/comentar/quote/report movidos */
            html.smg-thread .smg-pc .message-content { padding: 18px 22px 10px; }
            /* HEADER (com divisor border-b) */
            html.smg-thread .smg-pc-head { display: flex; align-items: flex-start; gap: 12px; padding: 18px 22px 14px; border-bottom: 1px solid var(--smg-bd, rgba(255,255,255,0.08)); }
            html.smg-thread .smg-pc-avatar { flex: 0 0 auto; width: 40px; height: 40px; border-radius: 50%; overflow: hidden; }
            html.smg-thread .smg-pc-avatar img, html.smg-thread .smg-pc-avatar span { width: 100% !important; height: 100% !important; object-fit: cover; display: flex; align-items: center; justify-content: center; }
            html.smg-thread .smg-pc-meta { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
            html.smg-thread .smg-pc-row1 { display: flex; align-items: center; gap: 8px; }
            html.smg-thread .smg-pc-idline { display: flex; align-items: baseline; gap: 6px; min-width: 0; flex-wrap: wrap; }
            html.smg-thread .smg-pc-name { margin: 0; font-size: 14px; font-weight: 700; }
            html.smg-thread .smg-pc-name a { text-decoration: none; }                                   /* mantém a cor nativa do username (identidade) */
            html.smg-thread .smg-pc-name a:hover { text-decoration: underline; }
            html.smg-thread .smg-pc-dot { color: rgba(255,255,255,0.35); }
            html.smg-thread .smg-pc-time { color: rgba(255,255,255,0.5); font-size: 12.5px; }
            html.smg-thread .smg-pc-num { margin-left: auto; flex: 0 0 auto; color: rgba(255,255,255,0.4); font-size: 12.5px; text-decoration: none; }
            html.smg-thread .smg-pc-num:hover { color: rgba(255,255,255,0.75); }
            html.smg-thread .smg-pc-row2 { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 8px; }
            html.smg-thread .smg-pc-utitle { margin: 0; font-size: 11.5px; color: rgba(255,255,255,0.42); font-weight: 500; }
            html.smg-thread .smg-pc-row2 .userBanner { margin: 0; font-size: 10px; padding: 1px 6px; }
            html.smg-thread .smg-pc-row2 .featuredBadges { display: inline-flex; flex-wrap: wrap; gap: 3px; margin: 0; }
            html.smg-thread .smg-pc-row2 .badgeIcon { width: 16px; height: 16px; }
            html.smg-thread .smg-pc-stats { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 4px 0 0; }
            html.smg-thread .smg-pc-stats dl { display: inline-flex; align-items: center; gap: 4px; margin: 0; padding: 0; font-size: 11px; color: rgba(255,255,255,0.38); }
            html.smg-thread .smg-pc-stats dt, html.smg-thread .smg-pc-stats dd { margin: 0; }
            html.smg-thread .smg-pc-stats svg, html.smg-thread .smg-pc-stats .fa--xf { width: 11px; height: 11px; opacity: 0.55; }
            /* ACTION BAR */
            html.smg-thread .smg-pc-actions { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; padding: 12px 18px 14px; margin-top: 8px; border-top: 1px solid var(--smg-bd, rgba(255,255,255,0.07)); }
            html.smg-thread .smg-pc-act { display: inline-flex !important; align-items: center; gap: 7px; height: 34px; margin: 0 !important; padding: 0 13px !important; border-radius: 9px; border: 0; background: transparent; color: rgba(255,255,255,0.72); font-size: 13px; font-weight: 600; line-height: 1; cursor: pointer; text-decoration: none; white-space: nowrap; transition: background .12s ease, color .12s ease; }
            html.smg-thread .smg-pc-act:hover { background: var(--smg-s3, rgba(255,255,255,0.08)); color: #fff; }
            /* MÉTRICA ÚNICA dos ícones da action bar (post e comentário). Cada ação trazia a sua:
               o <i> da fonte do XF em 15px, o nosso react em 16, o bookmark/share nativos em outra
               — tamanhos, pesos e espaçamentos diferentes na mesma fila. Aqui todos passam a ter
               17px, o mesmo traço, a cor do botão (não a nativa) e o mesmo gap até o texto. */
            html.smg-thread :is(.smg-pc-act, .smg-cc-act) { gap: 6px; }
            html.smg-thread :is(.smg-pc-act, .smg-cc-act)::before,
            html.smg-thread :is(.smg-pc-act, .smg-cc-act)::after,
            html.smg-thread :is(.smg-pc-act, .smg-cc-act) > i:not(.reaction-sprite):not(.reaction-image),
            html.smg-thread :is(.smg-pc-act, .smg-cc-act) > .fa--xf,
            html.smg-thread :is(.smg-pc-act, .smg-cc-act) > .uix_icon {
                display: none !important;
                content: none !important;
            }
            /* os NOSSOS (react + o que substituiu o glifo nativo): traço e preenchimento também */
            html.smg-thread :is(.smg-pc-act-ic, .smg-pc-react-ic, .smg-cc-react-ic) { display: inline-flex; align-items: center; font-size: 17px; }
            html.smg-thread :is(.smg-pc-act-ic, .smg-pc-react-ic, .smg-cc-react-ic) svg {
                width: 1em !important; height: 1em !important; fill: none !important; stroke-width: 1.9 !important;
            }
            html.smg-thread .smg-pc-act svg { width: 16px; height: 16px; }
            html.smg-thread .smg-pc-act .reaction-sprite, html.smg-thread .smg-pc-act .reaction-image { width: 18px; height: 18px; }
            html.smg-thread .smg-pc-act--save .js-bookmarkText { display: none; }   /* texto nativo "Adicionar aos favoritos" fica escondido → o rótulo "Salvar" (smg-pc-act-lbl) é o visível (sem duplicar) */
            html.smg-thread .smg-pc-react-n { font-weight: 600; font-variant-numeric: tabular-nums; }
            /* ESTADO ATIVO (#3): salvo = bookmark (is-bookmarked, nativo) · reagido = classe do XF (is-reacted/reaction--active) → cor do tema + fundinho */
            html.smg-thread .smg-pc-act--save.is-bookmarked { color: var(--smg-link, #ff77b2) !important; background: var(--smg-link-soft, rgba(255,119,178,0.13)); }
            /* Compartilhar copiou o link: confirmação de ~1,2s no próprio botão (não abre menu nenhum) */
            html.smg-thread .smg-pc-act--copied { color: #46d369 !important; background: rgba(70,211,105,0.12); }
            html.smg-thread .smg-pc-act--react.is-reacted, html.smg-thread .smg-pc-act--react.reaction--active, html.smg-thread .smg-cc-act--react.is-reacted, html.smg-thread .smg-cc-act--react.reaction--active { color: var(--smg-link, #ff77b2) !important; background: var(--smg-link-soft, rgba(255,119,178,0.13)); }
            /* REACT: cor NEUTRA (ícone + número + texto iguais aos outros) — o azul nativo fazia parecer "já reagi" */
            html.smg-thread .smg-pc-act--react { color: rgba(255,255,255,0.72) !important; }
            html.smg-thread .smg-cc-act--react { color: rgba(255,255,255,0.65) !important; }
            html.smg-thread .smg-pc-act--react *, html.smg-thread .smg-cc-act--react * { color: inherit !important; }
            html.smg-thread .smg-pc-act--react:hover, html.smg-thread .smg-cc-act--react:hover { color: #fff !important; }
            /* react = CONTADOR: esconde o visual nativo (sprite/<i>/emoji/"React" = a "asa" torta), usa ícone limpo + "N reações" */
            html.smg-thread .smg-pc-act--react > i, html.smg-thread .smg-pc-act--react .reaction-sprite, html.smg-thread .smg-pc-act--react .reaction-image, html.smg-thread .smg-pc-act--react .reaction-text,
            html.smg-thread .smg-cc-act--react > i, html.smg-thread .smg-cc-act--react .reaction-sprite, html.smg-thread .smg-cc-act--react .reaction-image, html.smg-thread .smg-cc-act--react .reaction-text { display: none !important; }
            html.smg-thread .smg-pc-react-ic, html.smg-thread .smg-cc-react-ic { display: inline-flex; align-items: center; }
            html.smg-thread .smg-pc-react-ic svg, html.smg-thread .smg-cc-react-ic svg { width: 16px; height: 16px; }
            /* CONTENT: texto maior que a action bar (hierarquia) */
            html.smg-thread .smg-pc .message-content, html.smg-thread .smg-pc .message-content .bbWrapper { font-size: 15px; line-height: 1.55; }
            /* PILLS de reação ESCONDIDAS (escolha do user): misturam joypixels + emojione (medal) = impossível alinhar a arte.
               O contador "N reações" na action bar já mostra o total (lê as contagens do DOM, que continua aqui em display:none). */
            html.smg-thread .smg-pc .reactionsBar, html.smg-thread .smg-pc .comment-reactions { display: none !important; }
            /* PILLS de reação (addon do site, post E comentário): chip limpo, emoji + contagem CENTRALIZADOS (estavam tortos: img inline na baseline) */
            html.smg-thread .smg-pc :is(.reactionsBar, .comment-reactions) .smgReactionPills { display: flex !important; flex-wrap: wrap; align-items: center !important; gap: 6px !important; margin: 0 !important; }
            html.smg-thread .smg-pc :is(.reactionsBar, .comment-reactions) .smgReactionPill { display: inline-flex !important; align-items: center !important; gap: 5px !important; margin: 0 !important; height: 26px !important; padding: 0 10px !important; border-radius: 999px !important; background: var(--smg-s3, rgba(255,255,255,0.08)) !important; text-decoration: none !important; line-height: 1 !important; box-sizing: border-box !important; }
            html.smg-thread .smg-pc :is(.reactionsBar, .comment-reactions) .smgReactionPill:hover { background: var(--smg-s2, rgba(255,255,255,0.16)) !important; }
            html.smg-thread .smg-pc :is(.reactionsBar, .comment-reactions) .smgReactionPill-img { width: 18px !important; height: 18px !important; min-width: 18px !important; max-width: 18px !important; display: block !important; flex: 0 0 auto !important; margin: 0 !important; padding: 0 !important; object-fit: contain !important; vertical-align: middle !important; }
            html.smg-thread .smg-pc :is(.reactionsBar, .comment-reactions) .smgReactionPill-count { font-size: 12px !important; font-weight: 700 !important; color: rgba(255,255,255,0.85) !important; font-variant-numeric: tabular-nums; line-height: 1 !important; }
            /* ⋯ overflow */
            html.smg-thread .smg-pc-morewrap { position: relative; margin-left: auto; }
            html.smg-thread .smg-pc-act--more { font-size: 18px; padding: 0 12px; }
            html.smg-thread .smg-pc-morepop { position: absolute; right: 0; bottom: calc(100% + 6px); display: none; flex-direction: column; gap: 2px; min-width: 168px; padding: 6px; z-index: 50; background: var(--smg-s2, #1c1d22); border: 1px solid var(--smg-bd2, rgba(255,255,255,0.12)); border-radius: 12px; box-shadow: 0 14px 38px rgba(0,0,0,0.55); }
            html.smg-thread .smg-pc-morewrap.open .smg-pc-morepop { display: flex; }
            html.smg-thread .smg-pc-morerow { display: flex !important; align-items: center; gap: 8px; height: 36px; padding: 0 10px; border-radius: 8px; background: transparent; color: rgba(255,255,255,0.85); font-size: 13.5px; font-weight: 600; text-align: left; text-decoration: none; white-space: nowrap; cursor: pointer; }
            html.smg-thread .smg-pc-morerow:hover { background: var(--smg-s3, rgba(255,255,255,0.08)); color: #fff; }
            /* DISCUSSÃO (social): badge + indicador "silent" no header do post */
            html.smg-thread .smg-pc-idline .smg-discussion-badge { font-size: 10px; font-weight: 800; letter-spacing: .04em; padding: 1px 6px; border-radius: 5px; background: var(--smg-link-soft, rgba(255,119,178,0.18)); color: var(--smg-link, #ff77b2); }
            html.smg-thread .smg-pc-idline .smg-silent-indicator { font-size: 11px; color: rgba(255,255,255,0.4); display: inline-flex; align-items: center; gap: 3px; }

            /* ============================================================
               COMENTÁRIOS (uw_fcs, SMG): modernos, indentados sob o post (thread-line). Mesmo modelo do card.
               ============================================================ */
            html.smg-thread .smg-pc .message-responses { margin-top: 4px; padding: 4px 22px 18px; }
            /* HEADER da seção de comentários: faixa destacada (full-width via margin negativa que cancela o padding da section) + dividers em cima/embaixo.
               !important + escopo .smg-pc → ganha do neutralize/tema. align-items:center + line-height:1 centralizam ícone · nº · "Comments". */
            html.smg-thread .smg-pc .uw-comment-count { display: flex !important; flex-wrap: wrap; align-items: center !important; gap: 8px; margin: 6px -22px 12px !important; padding: 13px 22px !important; font-size: 14px; font-weight: 800; line-height: 1; color: #fff; background: var(--smg-s2, rgba(255,255,255,0.05)) !important; border-top: 1px solid var(--smg-bd2, rgba(255,255,255,0.12)) !important; border-bottom: 1px solid var(--smg-bd2, rgba(255,255,255,0.12)) !important; }
            html.smg-thread .smg-pc .uw-comment-count .mdi { font-size: 16px; line-height: 1; display: inline-flex; align-items: center; opacity: 0.85; }
            html.smg-thread .smg-pc .uw-comment-count .comment-count { color: var(--smg-link, #ff77b2); line-height: 1; }   /* nº em destaque (cor do tema) */
            html.smg-thread .smg-pc .uw-fcs-sort-toggle { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; }   /* sort no canto DIREITO do header */
            html.smg-thread .smg-pc .uw-fcs-sort-sep { display: none; }   /* tira o "|" separador */
            html.smg-thread .smg-pc .smg-cbar-sortlbl { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); white-space: nowrap; }   /* label "Sort:" antes do chip */
            /* "Top reacted" → chip de sort à direita */
            html.smg-thread .smg-pc .uw-fcs-sort-btn { display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border: 1px solid var(--smg-bd2, rgba(255,255,255,0.14)); border-radius: 999px; background: var(--smg-s1, #16171b); color: rgba(255,255,255,0.78); font-size: 12px; font-weight: 700; line-height: 1; text-decoration: none !important; white-space: nowrap; }
            html.smg-thread .smg-pc .uw-fcs-sort-btn:hover { background: var(--smg-s3, rgba(255,255,255,0.08)); color: #fff; border-color: var(--smg-bd2, rgba(255,255,255,0.25)); }
            html.smg-thread .smg-pc .uw-fcs-sort-btn i { font-size: 12px; opacity: .85; }
            /* "Previous comments" → botão paginador (linha própria, full-width — flex-basis 100% quebra a linha) */
            html.smg-thread .smg-pc .uw_load_prev { flex: 0 0 100%; display: block; box-sizing: border-box; margin: 11px 0 1px; padding: 9px; border: 1px solid var(--smg-bd2, rgba(255,255,255,0.12)); border-radius: 10px; background: var(--smg-s1, #16171b); color: var(--smg-link, #ff77b2); font-size: 13px; font-weight: 700; text-align: center; text-decoration: none !important; }
            html.smg-thread .smg-pc .uw_load_prev:hover { background: var(--smg-s3, rgba(255,255,255,0.08)); border-color: var(--smg-bd2, rgba(255,255,255,0.22)); }
            html.smg-thread .smg-cc { position: relative; margin: 0; padding: 13px 0 13px 16px; border-left: 2px solid var(--smg-bd2, rgba(255,255,255,0.12)); border-bottom: 1px solid var(--smg-bd, rgba(255,255,255,0.07)); }
            html.smg-thread .smg-cc .comment-inner { display: block; }
            html.smg-thread .smg-cc .comment-avatar { display: none; }                              /* movido pro head */
            html.smg-thread .smg-cc .comment-content { display: none; }                             /* user/tempo/# movidos */
            html.smg-thread .smg-cc .comment-footer .comment-actionBar { display: none; }            /* movido p/ smg-cc-actions (pills .comment-reactions ficam) */
            html.smg-thread .smg-cc .comment-footer .js-historyTarget { display: none; }
            html.smg-thread .smg-cc-head { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
            html.smg-thread .smg-cc-avatar { width: 28px; height: 28px; border-radius: 50%; overflow: hidden; flex: 0 0 auto; }
            html.smg-thread .smg-cc-avatar img, html.smg-thread .smg-cc-avatar span { width: 100% !important; height: 100% !important; object-fit: cover; display: flex; align-items: center; justify-content: center; }
            html.smg-thread .smg-cc-idline { display: flex; align-items: baseline; gap: 6px; min-width: 0; flex-wrap: wrap; flex: 1 1 auto; }
            html.smg-thread .smg-cc-name { font-size: 13px; font-weight: 700; text-decoration: none; }
            html.smg-thread .smg-cc-name:hover { text-decoration: underline; }
            html.smg-thread .smg-cc-time { color: rgba(255,255,255,0.5); font-size: 12px; }
            html.smg-thread .smg-cc-num { margin-left: auto; color: rgba(255,255,255,0.4); font-size: 12px; text-decoration: none; }
            html.smg-thread .smg-cc-num:hover { color: rgba(255,255,255,0.72); }
            html.smg-thread .smg-cc .comment-body { font-size: 14px; line-height: 1.5; }
            html.smg-thread .smg-cc-actions { display: flex; align-items: center; gap: 3px; flex-wrap: wrap; margin-top: 6px; }
            html.smg-thread .smg-cc-act { display: inline-flex !important; align-items: center; gap: 6px; height: 30px; margin: 0 !important; padding: 0 10px !important; border-radius: 8px; background: transparent; border: 0; color: rgba(255,255,255,0.65); font-size: 12.5px; font-weight: 600; line-height: 1; cursor: pointer; text-decoration: none; white-space: nowrap; transition: background .12s ease, color .12s ease; }
            html.smg-thread .smg-cc-act:hover { background: var(--smg-s3, rgba(255,255,255,0.08)); color: #fff; }
            html.smg-thread .smg-cc-act svg { width: 14px; height: 14px; }
            html.smg-thread .smg-cc-act > i { font-size: 14px; }
            html.smg-thread .smg-cc-act .reaction-image, html.smg-thread .smg-cc-act .reaction-sprite { width: 16px; height: 16px; }
            html.smg-thread .smg-cc-act--more { margin-left: auto; font-size: 16px; }
            html.smg-thread .smg-cc-react-n { font-weight: 600; font-variant-numeric: tabular-nums; }
            html.smg-thread .smg-cc .comment-reactions { margin-top: 7px; }
            /* matar o "quadrado cinza" do tema nos comentários → integra no card; mantém só o thread-line do .smg-cc */
            html.smg-thread .smg-pc .message-responses, html.smg-thread .smg-pc .message-responseRow:not(.uw-comment-count), html.smg-thread .smg-pc .uw_fcs_comment_section,
            html.smg-thread .smg-cc, html.smg-thread .smg-cc .comment-inner, html.smg-thread .smg-cc .comment-main, html.smg-thread .smg-cc .comment-content { background: transparent !important; box-shadow: none !important; }
            html.smg-thread .smg-pc .message-responseRow:not(.uw-comment-count), html.smg-thread .smg-cc .comment-inner, html.smg-thread .smg-cc .comment-main, html.smg-thread .smg-cc .comment-content { border: 0 !important; }
            /* editor "escrever comentário": blend escuro (era um quadrado claro do tema) */
            html.smg-thread .smg-pc .editorPlaceholder-placeholder .input { background: var(--smg-s2, #1c1d22) !important; border: 1px solid var(--smg-bd2, rgba(255,255,255,0.1)) !important; border-radius: 10px !important; color: rgba(255,255,255,0.6) !important; }
            /* ---- editor Froala (reply / comentário / conversa): vinha CLARO (destoava do tema escuro) → escurece toolbar, área de edição e dropdowns ---- */
            /* RING ÚNICO: a borda do editor vive SÓ no .fr-box (filhos com border 0) — o tema desenhava
               border-top azul no toolbar + border-bottom azul no second-toolbar, parecendo um anel quebrado.
               SEM overflow:hidden no box (clipava os dropdowns absolutos do toolbar) → cantos arredondados
               explícitos nos filhos das pontas. */
            :is(html.smg-sc, html.smg-smg) .fr-box.fr-basic {
                border: 1px solid var(--smg-bd2, rgba(255,255,255,0.14)) !important;
                border-radius: 12px !important; box-shadow: none !important;
                transition: border-color .15s ease;
            }
            :is(html.smg-sc, html.smg-smg) .fr-box.fr-basic .fr-toolbar {
                background: var(--smg-s2, #1c1d22) !important; color: var(--smg-tx, #e7e7ea) !important;
                border: 0 !important; border-bottom: 1px solid var(--smg-bd, rgba(255,255,255,0.1)) !important;
                border-radius: 11px 11px 0 0 !important; box-shadow: none !important;
            }
            :is(html.smg-sc, html.smg-smg) .fr-box.fr-basic .fr-toolbar .fr-more-toolbar { background: var(--smg-s2, #1c1d22) !important; border: 0 !important; box-shadow: none !important; }
            :is(html.smg-sc, html.smg-smg) .fr-box.fr-basic .fr-second-toolbar {
                background: var(--smg-s2, #1c1d22) !important; color: var(--smg-tx, #e7e7ea) !important;
                border: 0 !important; border-radius: 0 0 11px 11px !important; box-shadow: none !important;
            }
            :is(html.smg-sc, html.smg-smg) .fr-box.fr-basic .fr-wrapper { background: var(--smg-s1, #16171b) !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
            :is(html.smg-sc, html.smg-smg) .fr-box.fr-basic .fr-element.fr-view { color: var(--smg-tx, #e7e7ea) !important; }
            :is(html.smg-sc, html.smg-smg) .fr-box.fr-basic .fr-placeholder { color: rgba(255,255,255,0.38) !important; }
            :is(html.smg-sc, html.smg-smg) .fr-toolbar .fr-btn, :is(html.smg-sc, html.smg-smg) .fr-toolbar .fr-btn i, :is(html.smg-sc, html.smg-smg) .fr-toolbar .fr-btn svg { color: rgba(255,255,255,0.72) !important; }
            :is(html.smg-sc, html.smg-smg) .fr-toolbar .fr-btn.fr-disabled, :is(html.smg-sc, html.smg-smg) .fr-toolbar .fr-btn.fr-disabled i { color: rgba(255,255,255,0.28) !important; }
            :is(html.smg-sc, html.smg-smg) .fr-toolbar .fr-btn:not(.fr-disabled):hover { background: var(--smg-s3, rgba(255,255,255,0.08)) !important; }
            :is(html.smg-sc, html.smg-smg) .fr-toolbar .fr-btn.fr-active { color: var(--smg-link, #ff77b2) !important; }
            :is(html.smg-sc, html.smg-smg) .fr-dropdown-menu { background: var(--smg-s1, #16171b) !important; box-shadow: 0 6px 20px rgba(0,0,0,0.45) !important; }
            :is(html.smg-sc, html.smg-smg) .fr-dropdown-menu .fr-dropdown-wrapper { background: transparent !important; }
            :is(html.smg-sc, html.smg-smg) .fr-dropdown-menu .fr-dropdown-list a, :is(html.smg-sc, html.smg-smg) .fr-dropdown-menu .fr-dropdown-list a * { color: var(--smg-tx, #e7e7ea) !important; }
            :is(html.smg-sc, html.smg-smg) .fr-dropdown-menu .fr-dropdown-list a:hover { background: var(--smg-s3, rgba(255,255,255,0.08)) !important; }
            /* foco no editor: o RING (borda do .fr-box) acende no acento — mesma linguagem dos inputs */
            :is(html.smg-sc, html.smg-smg) .fr-box.fr-basic:focus-within { border-color: var(--smg-link, #ff77b2) !important; }
            /* QUOTE dentro do EDITOR (blockquote do Froala ao citar um post): mesmo visual dos quotes
               renderizados no post (.smg-pc .bbCodeBlock) — inset escuro + filete no ACENTO. O caixote
               azul-claro com borda azul era o estilo nativo do editor do XF. */
            :is(html.smg-sc, html.smg-smg) .fr-element blockquote {
                background: rgba(0,0,0,0.22) !important;
                border: 1px solid rgba(255,255,255,0.08) !important;
                border-left: 3px solid var(--smg-link, #ff77b2) !important;
                border-radius: 12px !important;
                margin: 10px 0 !important; padding: 11px 15px !important;
                color: rgba(255,255,255,0.85) !important;
            }
            /* nome do autor citado (o XF desenha via ::before com attr(data-quote)) → acento + peso */
            :is(html.smg-sc, html.smg-smg) .fr-element blockquote::before {
                color: var(--smg-link, #ff77b2) !important;
                font-weight: 700 !important; font-size: 12.5px !important; opacity: 1 !important;
            }
            :is(html.smg-sc, html.smg-smg) .fr-element blockquote img { border-radius: 8px; }
            /* PREVIEW do editor (aba de pré-visualização): quote renderizado ganha o MESMO inset dos posts
               (o .smg-pc não alcança aqui — o preview vive dentro do form, fora do card de post) */
            :is(html.smg-sc, html.smg-smg) .xfPreview .bbCodeBlock {
                background: rgba(0,0,0,0.22) !important; border: 1px solid rgba(255,255,255,0.08) !important; border-radius: 12px !important;
            }
            :is(html.smg-sc, html.smg-smg) .xfPreview .bbCodeBlock .contentRow, :is(html.smg-sc, html.smg-smg) .xfPreview .bbCodeBlock-content { background: transparent !important; }

            /* ===== QUICK REPLY (rodapé da thread): card no padrão dos posts (.smg-pc) =====
               Sai a coluna cinza do avatar (decoração — é o seu próprio), o editor ocupa o card todo
               e a botoeira entra no tema: Post Content = acento · Add Discussion = secundário ·
               extras (.button--link, ex. ImagePond) = chip fantasma à ESQUERDA. */
            html.smg-thread form.js-quickReply .block-container {
                background: var(--smg-s1, #16171b) !important; border: 1px solid rgba(255,255,255,0.11) !important;
                border-radius: 18px !important; box-shadow: none !important; overflow: hidden;
            }
            html.smg-smg.smg-thread form.js-quickReply .block-container { --smg-s1: hsl(0 0% 12.5%); --smg-s2: hsl(0 0% 16%); --smg-s3: hsl(0 0% 21%); }   /* mesmas superfícies dos cards (.smg-pc) */
            html.smg-thread form.js-quickReply .block-body { background: transparent !important; border: 0 !important; padding: 0 !important; }
            html.smg-thread .message--quickReply { background: transparent !important; border: 0 !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; }
            html.smg-thread .message--quickReply .message-inner { display: block !important; }
            html.smg-thread .message--quickReply .message-cell--user { display: none !important; }
            html.smg-thread .message--quickReply .message-cell--main {
                width: 100% !important; max-width: none !important; padding: 16px 18px !important;
                border: 0 !important; background: transparent !important;
            }
            /* botoeira: extras à esquerda, ações primárias empurradas pra DIREITA */
            html.smg-thread form.js-quickReply .formButtonGroup { display: flex !important; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 12px; float: none !important; }
            html.smg-thread form.js-quickReply .formButtonGroup-primary { display: flex !important; gap: 8px; order: 9; margin-left: auto; float: none !important; }
            html.smg-thread form.js-quickReply .formButtonGroup .button {
                min-height: 40px; padding: 0 18px; margin: 0 !important;
                border-radius: 11px !important; box-shadow: none !important;
                font-size: 13.5px !important; font-weight: 600 !important;
                display: inline-flex !important; align-items: center; gap: 7px;
                background: var(--smg-s2) !important; border: 1px solid var(--smg-bd2) !important; color: rgba(255,255,255,0.85) !important;
                transition: background .14s ease, color .14s ease, filter .14s ease, transform .12s ease;
            }
            html.smg-thread form.js-quickReply .formButtonGroup .button:hover { background: var(--smg-s3) !important; color: #fff !important; }
            html.smg-thread form.js-quickReply .formButtonGroup .button:active { transform: scale(0.97); }
            html.smg-thread form.js-quickReply .formButtonGroup .button--primary {
                background: var(--smg-link-strong, #d14d8f) !important; border: 0 !important; color: #fff !important; font-weight: 700 !important; padding: 0 22px;
            }
            html.smg-thread form.js-quickReply .formButtonGroup .button--primary:hover { background: var(--smg-link-strong, #d14d8f) !important; filter: brightness(1.12); }
            html.smg-thread form.js-quickReply .formButtonGroup .button--link {
                background: transparent !important; border: 1px solid var(--smg-bd) !important; color: rgba(255,255,255,0.55) !important;
            }
            html.smg-thread form.js-quickReply .formButtonGroup .button--link:hover { background: var(--smg-s2) !important; color: #fff !important; }
            @media (max-width: 600px) {
                html.smg-thread form.js-quickReply .block-container { border-radius: 14px !important; }
                html.smg-thread .message--quickReply .message-cell--main { padding: 12px 13px !important; }
            }
        `;
