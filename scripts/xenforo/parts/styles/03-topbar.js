    // STYLE CONTEXT: Topbar, sheets and desktop navigation
    const CSS_TOPBAR = `/* ================= TOPBAR REFORMULADA ================= */
            /* esconde a nav/header nativos e abre espaço pra nossa barra fixa */
            html.smg-topbar-on .p-header,
            html.smg-topbar-on .p-navSticky { display: none !important; }
            .u-scrollButtons, .js-scrollButtons { display: none !important; }   /* esconde os botões de scroll nativos do XF (a dock provê scroll topo/fundo) */
            html.smg-topbar-on body { padding-top: 62px !important; }   /* reserve space for the fixed topbar */
            /* deep-link (#post-X / âncora): cai ABAIXO da topbar fixa, não atrás dela (vale p/ o scroll do browser E o nosso pin) */
            html.smg-topbar-on :target { scroll-margin-top: 76px; }
            @media (max-width: 800px) { html.smg-topbar-on :target { scroll-margin-top: 66px; } }

            /* TOPBAR estilo ehentai: barra FIXA FULL-WIDTH (bg/borda de ponta a ponta),
               com o inner alinhado à MESMA largura do conteúdo (.p-body-inner) via margin:auto. */
            #smg-topbar-wrap {
                position: fixed; top: 0; left: 0; right: 0; width: 100%; z-index: 100;  /* nível de header (XF/UIX) → toasts/overlays ficam ACIMA */
            }
            #smg-topbar {
                position: relative; width: 100%; box-sizing: border-box;
                background: var(--smg-bg);
                border: 0; border-bottom: 1px solid rgba(255,255,255,0.08);
                box-shadow: 0 1px 0 rgba(255,255,255,0.02);
                transition: box-shadow .2s ease, background .2s ease;
            }
            /* leve sombra ao rolar */
            #smg-topbar-wrap.floating #smg-topbar { box-shadow: 0 6px 22px rgba(0,0,0,0.45); border-bottom-color: rgba(255,255,255,0.06); }
            /* inner = largura do conteúdo (80% no desktop), centralizado igual ao .p-body-inner */
            /* 3 zonas (flex: os lados NUNCA cortam): esquerda fit-content · centro cresce (search capada
               e centralizada no espaço livre) · direita fit-content. A search encolhe sozinha conforme
               sobra espaço entre logo/Discover e os ícones → não corta o resto em nenhuma resolução. */
            #smg-tb-inner {
                display: flex; align-items: center; gap: 16px;
                height: 62px; max-width: var(--smg-cw); margin: 0 auto; padding: 0; box-sizing: border-box;
                position: relative;   /* âncora do overlay de busca (ocupa a topbar) */
                transition: height .22s ease;
            }
            /* Mobile threads use a dedicated shell, like an app topbar. */
            .smg-mobile-threadbar { display: none; }
            @media (min-width: 801px) { #smg-topbar-wrap.floating #smg-tb-inner { height: 50px; } }   /* encolhe no scroll down (.floating = scrollY>40); desktop só (mobile já é compacto) */
            @media (max-width: 800px) { #smg-tb-inner { max-width: calc(100% - 24px); height: 48px; } }
            /* SMG: cor da topbar #1a1a1a */
            html.smg-smg #smg-topbar { background: #1a1a1a; }
            .smg-tb-left { display: flex; align-items: center; gap: 4px; flex: 0 0 auto; }
            .smg-tb-center { flex: 1 1 auto; min-width: 0; display: flex; justify-content: center; }
            .smg-tb-logo { display: flex; align-items: center; height: 36px; flex: 0 0 auto; margin-right: 6px; text-decoration: none; color: #fff; font-weight: 800; }
            .smg-tb-logo img { height: 30px; width: auto; max-width: 150px; object-fit: contain; display: block; }
            /* logo custom do SMG: wordmark "SMG" (G em rosa = acento da marca) */
            .smg-logo { display: inline-flex; align-items: center; }
            .smg-logo-word { font-size: 22px; font-weight: 800; letter-spacing: 0.5px; color: #fff; line-height: 1; }
            .smg-logo-accent { color: #ff3d84; }
            .smg-tb-nav { display: flex; align-items: center; gap: 2px; }
            .smg-tb-item {
                position: relative;
                display: flex; align-items: center; gap: 7px; height: 38px; padding: 0 12px;
                border-radius: 10px; border: none; background: transparent; color: rgba(255,255,255,0.82);
                font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; white-space: nowrap;
                transition: background .14s ease, color .14s ease;
            }
            .smg-tb-item:hover, .smg-tb-item.active { background: var(--smg-link-soft, rgba(255,255,255,0.09)); color: #fff; }
            /* badge inline (notificações como item do nav) */
            .smg-tb-badge--inline { position: static; top: auto; right: auto; margin-left: 1px; }
            .smg-tb-ico { display: flex; align-items: center; }
            .smg-tb-ico svg { width: 18px; height: 18px; fill: none !important; }
            .smg-tb-caret { display: flex; align-items: center; margin-left: -2px; }
            .smg-tb-caret svg { width: 14px; height: 14px; opacity: .55; fill: none !important; }
            .smg-tb-item.active .smg-tb-caret { transform: rotate(180deg); }

            .smg-tb-actions { display: flex; align-items: center; gap: 4px; flex: 0 0 auto; }
            .smg-tb-act {
                position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
                border-radius: 10px; border: none; background: transparent; color: rgba(255,255,255,0.85);
                cursor: pointer; text-decoration: none; transition: background .14s ease, color .14s ease;
            }
            .smg-tb-act:hover { background: var(--smg-link-soft, rgba(255,255,255,0.1)); color: #fff; }
            .smg-tb-act svg { width: 20px; height: 20px; fill: none !important; }
            /* search bar CENTRAL: cresce com a zona do meio mas capa em 600px e centraliza */
            .smg-tb-search {
                display: flex; align-items: center; gap: 11px; width: 100%; max-width: 720px; height: 46px; padding: 0 16px; margin: 0;
                box-sizing: border-box; border-radius: 13px;
                border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05);
                color: rgba(255,255,255,0.5); font-size: 15px; font-weight: 500; cursor: text; white-space: nowrap; text-align: left;
                transition: background .15s ease, border-color .15s ease;
            }
            .smg-tb-search:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); }
            .smg-tb-search:focus-within { background: rgba(255,255,255,0.09); border-color: var(--smg-link, #ff77b2); }   /* foco na cor do tema */
            /* ===== experimento: nav CENTRAL + search como OVERLAY que ocupa a topbar ===== */
            .smg-tb-center--nav { justify-content: center; }
            .smg-tb-center--nav .smg-tb-nav { gap: 4px; }
            .smg-tb-search--overlay {
                display: none !important;
                position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%) scale(0.99);
                width: auto; max-width: none; margin: 0; z-index: 20;
                opacity: 0; pointer-events: none;
                transition: opacity .16s ease, transform .16s ease;
            }
            html.smg-search-open .smg-tb-search--overlay {
                display: flex !important;
                opacity: 1; pointer-events: auto; transform: translateY(-50%) scale(1);
            }
            /* ao abrir a busca, recolhe logo/nav/ações atrás do overlay (busca toma a topbar) */
            html.smg-search-open .smg-tb-left,
            html.smg-search-open .smg-tb-center--nav,
            html.smg-search-open .smg-tb-actions { opacity: 0; pointer-events: none; transition: opacity .14s ease; }
            .smg-tb-search-close { flex: 0 0 auto; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; margin: 0 -6px 0 4px; border: 0; border-radius: 8px; background: transparent; color: rgba(255,255,255,0.55); cursor: pointer; transition: background .14s ease, color .14s ease; }
            .smg-tb-search-close:hover { background: rgba(255,255,255,0.12); color: #fff; }
            .smg-tb-search-close svg { width: 17px; height: 17px; fill: none !important; }
            /* SEARCH: chip de contexto (Reddit-style) + tooltip de comandos — valem na barra da topbar E no modal da dock */
            .smg-tb-search-chip, .smg-search-chip { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 5px; max-width: 42%; margin-right: 2px; padding: 4px 5px 4px 11px; border: 0; border-radius: 9px; background: var(--smg-link-soft, rgba(255,119,178,0.16)); color: var(--smg-link, #ff77b2); font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; pointer-events: auto !important; z-index: 2; }
            .smg-tb-search-chip[hidden], .smg-search-chip[hidden] { display: none !important; }   /* o display:inline-flex de autor vencia o [hidden] do browser → chip vazio aparecia fora de tópico/fórum */
            .smg-search-chip-k { flex: 0 0 auto; padding: 1px 6px; border-radius: 5px; background: rgba(255,255,255,0.16); color: rgba(255,255,255,0.78); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; }   /* tag TÓPICO/FÓRUM antes do nome */
            .smg-search-chip-t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .smg-search-chip-x { flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; cursor: pointer; pointer-events: auto !important; z-index: 2; opacity: 0.75; }
            .smg-search-chip-x:hover { background: rgba(255,255,255,0.2); opacity: 1; }
            .smg-search-chip-x svg { width: 12px; height: 12px; fill: none !important; }
            .smg-search-tabkey { flex: 0 0 auto; padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.55); font: 600 12px/1.4 -apple-system, system-ui, sans-serif; }
            /* paleta de comandos (Tab) */
            .smg-search-cmd { position: fixed; z-index: 2147483647; display: none; flex-direction: column; gap: 1px; width: 280px; max-width: calc(100vw - 16px); padding: 6px; border-radius: 12px; background: var(--smg-s1, #1c1d22); border: 1px solid var(--smg-bd, rgba(255,255,255,0.12)); box-shadow: 0 12px 34px rgba(0,0,0,0.6); }
            .smg-search-cmd.open { display: flex; }
            .smg-search-cmd-head { padding: 4px 8px 6px; font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.4); }
            .smg-search-cmd-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px; border: 0; border-radius: 8px; background: transparent; color: var(--smg-tx, #e7e7ea); font: inherit; font-size: 13.5px; text-align: left; cursor: pointer; }
            .smg-search-cmd-item:hover, .smg-search-cmd-item.sel { background: var(--smg-link-soft, rgba(255,119,178,0.14)); }
            .smg-search-cmd-item code { flex: 0 0 auto; min-width: 46px; padding: 2px 7px; border-radius: 6px; background: rgba(255,255,255,0.08); color: var(--smg-link, #ff77b2); font: 600 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; text-align: center; }
            .smg-search-cfg-portal { position: fixed; z-index: 2147483647; display: none; flex-direction: column; gap: 1px; min-width: 244px; max-width: 320px; padding: 7px; border-radius: 12px; background: var(--smg-s1, #1c1d22); border: 1px solid var(--smg-bd, rgba(255,255,255,0.12)); box-shadow: 0 12px 34px rgba(0,0,0,0.6); }
            .smg-search-cfg-portal.open { display: flex; }
            .smg-search-cfg-head { padding: 4px 8px 6px; font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.4); }
            .smg-search-cfg-row { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 8px; font-size: 13.5px; color: var(--smg-tx, #e7e7ea); cursor: pointer; }
            .smg-search-cfg-row:hover { background: rgba(255,255,255,0.06); }
            .smg-search-cfg-row input { flex: 0 0 auto; width: 16px; height: 16px; accent-color: var(--smg-link, #ff77b2); cursor: pointer; }
            @media (max-width: 600px) { .smg-search-bar { gap: 6px; } .smg-search-kbd { display: none; } }   /* mobile: sem o badge "esc" (touch) + barra mais apertada com os ícones */
            @media (max-width: 600px) { .smg-tb-search--overlay, html.smg-search-open .smg-tb-search--overlay { display: none !important; } }   /* mobile usa o modal da dock, não o overlay da topbar */
            .smg-tb-search-ico { display: inline-flex; align-items: center; flex: 0 0 auto; }
            .smg-tb-search-ico svg { width: 18px; height: 18px; opacity: 0.7; fill: none !important; }
            .smg-tb-search-input {
                flex: 1 1 auto; min-width: 0; height: 100%;
                border: 0; background: transparent; outline: none; padding: 0; margin: 0;
                color: #fff; font: inherit;
            }
            .smg-tb-search-input::placeholder { color: rgba(255,255,255,0.5); }
            .smg-tb-search-ph { flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; }
            .smg-tb-search-scan { display: inline-flex; align-items: center; flex: 0 0 auto; opacity: 0.4; }
            .smg-tb-search-scan svg { width: 17px; height: 17px; fill: none !important; }
            /* botão Buscar DENTRO do input — só aparece com o dropdown aberto (substitui o scan) */
            .smg-tb-search-go {
                flex: 0 0 auto; display: none; align-items: center; gap: 6px;
                height: 30px; padding: 0 13px; box-sizing: border-box; margin-right: -4px;
                border: 0; border-radius: 8px; background: #fff; color: #141414;
                font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap;
                transition: filter .15s ease, transform .12s ease;
            }
            .smg-tb-search-go-ic { display: inline-flex; }
            .smg-tb-search-go-ic svg { width: 15px; height: 15px; fill: none !important; stroke-width: 2.4; }
            .smg-tb-search-go:hover { filter: brightness(0.9); }
            .smg-tb-search-go:active { transform: scale(0.96); }
            html.smg-search-open .smg-tb-search-go { display: inline-flex; }
            html.smg-search-open .smg-tb-search-scan { display: none; }
            .smg-tb-badge {
                position: absolute; top: 3px; right: 3px; min-width: 16px; height: 16px; padding: 0 4px;
                border-radius: 999px; background: #e0245e; color: #fff; font-size: 10px; font-weight: 700;
                display: flex; align-items: center; justify-content: center; box-sizing: border-box;
                font-variant-numeric: tabular-nums;
            }
            /* badge de NOTICES: menor e neutro (cinza) — o vermelho fixo dava aparência de erro */
            .smg-tb-notices .smg-tb-badge {
                background: rgba(255,255,255,0.24); color: rgba(255,255,255,0.92);
                min-width: 13px; height: 13px; padding: 0 3px; font-size: 8.5px; top: 1px; right: 1px;
            }
            .smg-tb-divider { width: 1px; height: 26px; background: rgba(255,255,255,0.14); margin: 0 6px; flex: 0 0 auto; }
            /* CONTA: mesma caixa de 40px dos outros ícones da direita (busca/painel), com o avatar
               desenhado a 28px dentro. Antes era um círculo de 38px com anel — do lado de ícones de
               traço de 20px ele lia quase o dobro do tamanho e desalinhava a fileira. */
            .smg-tb-account {
                width: 40px; height: 40px; flex: 0 0 auto; border-radius: 10px; cursor: pointer; padding: 0;
                border: 0; background: transparent;
                display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 13px;
                transition: background .14s ease;
            }
            .smg-tb-account:hover { background: var(--smg-link-soft, rgba(255,255,255,0.1)); }
            .smg-tb-account img { width: 100%; height: 100%; object-fit: cover; }
            .smg-tb-account .avatar,
            .smg-tb-account > img {
                width: 28px !important; height: 28px !important; margin: 0 !important;
                border-radius: 50% !important; display: block; overflow: hidden;
                box-shadow: 0 0 0 1px rgba(255,255,255,0.18);   /* anel fino: separa do fundo sem virar botão */
            }
            .smg-tb-account .avatar > span,
            .smg-tb-account .avatar > img { width: 28px !important; height: 28px !important; display: flex !important; align-items: center; justify-content: center; font-size: 13px !important; line-height: 28px !important; border-radius: 50% !important; }
            /* VISITANTE: Cadastrar (texto) + Entrar (preenchido, na cor da marca) no lugar do avatar/dropdown */
            .smg-tb-authlink {
                display: inline-flex; align-items: center; height: 36px; padding: 0 12px; flex: 0 0 auto;
                border-radius: 10px; color: rgba(255,255,255,0.72); font-size: 14px; font-weight: 700;
                text-decoration: none; white-space: nowrap; transition: background .14s ease, color .14s ease;
            }
            .smg-tb-authlink:hover { background: rgba(255,255,255,0.09); color: #fff; }
            .smg-tb-loginbtn {
                display: inline-flex; align-items: center; gap: 7px; height: 36px; padding: 0 15px; flex: 0 0 auto;
                border-radius: 10px; border: 0; white-space: nowrap;
                background: var(--smg-link-strong, #c2185b); color: #fff !important;
                font-size: 14px; font-weight: 800; text-decoration: none !important;
                transition: filter .14s ease, transform .12s ease;
            }
            .smg-tb-loginbtn:hover { filter: brightness(1.12); }
            .smg-tb-loginbtn:active { transform: scale(0.97); }
            .smg-tb-loginbtn .smg-tb-ico { font-size: 16px; }
            @media (max-width: 700px) { .smg-tb-authlink { display: none; } }   /* espaço curto: sobra o Entrar */
            .smg-tb-cta {
                display: flex; align-items: center; gap: 7px; height: 40px; padding: 0 16px; margin-left: 5px; flex: 0 0 auto;
                border-radius: 11px; background: var(--smg-s3); color: #fff;
                font-size: 14px; font-weight: 700; text-decoration: none; border: 1px solid var(--smg-bd2);
                transition: filter .14s ease, transform .12s ease;
            }
            .smg-tb-cta:hover { filter: brightness(1.08); }
            .smg-tb-cta:active { transform: scale(0.97); }
            .smg-tb-cta svg { width: 17px; height: 17px; fill: none !important; }

            /* popovers agrupados */
            .smg-tb-pop {
                position: absolute; top: calc(100% + 8px); left: 0; min-width: 290px; max-width: 340px;
                padding: 8px; border-radius: 16px;
                background: var(--smg-s1);
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 22px 55px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.06);
                opacity: 0; visibility: hidden; transform: translateY(6px);
                transition: opacity .16s ease, transform .16s ease, visibility .16s;
                z-index: 5;
            }
            .smg-tb-pop.open { opacity: 1; visibility: visible; transform: translateY(0); }
            .smg-tb-pop--account { min-width: 230px; max-width: 280px; }
            .smg-tb-acchead { display: flex; align-items: center; gap: 8px; padding: 8px 10px 8px; font-size: 13px; font-weight: 700; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.07); margin-bottom: 4px; }
            /* pílula com quantas NÃO-LIDAS vieram nesta busca (some quando zera) */
            .smg-tb-poprow { display: flex; align-items: center; gap: 12px; padding: 9px 10px; border-radius: 11px; text-decoration: none; color: #fff; transition: background .12s ease; }
            .smg-tb-poprow:hover { background: var(--smg-link-soft, rgba(255,255,255,0.08)); }
            .smg-tb-poprow--sm { gap: 11px; padding: 8px 10px; }
            .smg-tb-popico { flex: 0 0 auto; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 10px; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.85); }
            .smg-tb-poprow--sm .smg-tb-popico { width: 28px; height: 28px; border-radius: 8px; }
            .smg-tb-popico svg { width: 18px; height: 18px; fill: none !important; }
            .smg-tb-poprow--sm .smg-tb-popico svg { width: 16px; height: 16px; }
            .smg-tb-poptext { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
            .smg-tb-poptitle { font-size: 14px; font-weight: 600; color: #fff; }
            .smg-tb-popdesc { font-size: 12px; color: rgba(255,255,255,0.5); }
            .smg-tb-popdiv { height: 1px; background: rgba(255,255,255,0.08); margin: 5px 8px; }
            /* ===== mega-menu do Discover (grid 2-col + painel destacado, estilo Vimeo) ===== */
            .smg-tb-pop--mega { min-width: 660px; max-width: 720px; padding: 18px; }
            .smg-tb-mega-cols { display: flex; gap: 18px; align-items: stretch; }
            .smg-tb-mega-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
            .smg-tb-mega-label { font-size: 11px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: rgba(255,255,255,0.38); padding: 0 8px 9px; }
            .smg-tb-mega-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2px; }
            .smg-tb-megaitem { display: flex; align-items: center; gap: 11px; padding: 9px 10px; border-radius: 11px; text-decoration: none; color: #fff; transition: background .12s ease; }
            .smg-tb-megaitem:hover { background: var(--smg-link-soft, rgba(255,255,255,0.07)); }
            .smg-tb-megaico { flex: 0 0 auto; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 10px; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.82); transition: background .14s ease, color .14s ease, transform .14s ease; }
            .smg-tb-megaitem:hover .smg-tb-megaico { background: var(--smg-link, #ff77b2); color: #fff; transform: translateY(-1px); }
            .smg-tb-megaico svg { width: 18px; height: 18px; fill: none !important; }
            .smg-tb-megatext { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
            .smg-tb-megatitle { font-size: 13.5px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .smg-tb-megadesc { font-size: 11.5px; color: rgba(255,255,255,0.42); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            /* painel destacado à direita (promove a Timeline) */
            .smg-tb-mega-feat { flex: 0 0 226px; display: flex; flex-direction: column; border-radius: 14px; overflow: hidden; text-decoration: none; background: var(--smg-s2); border: 1px solid var(--smg-bd); transition: border-color .15s ease, transform .15s ease, box-shadow .15s ease; }
            .smg-tb-mega-feat:hover { border-color: var(--smg-bd2); transform: translateY(-2px); box-shadow: 0 14px 30px rgba(0,0,0,0.4); }
            .smg-tb-mega-feat-art { height: 112px; display: flex; align-items: center; justify-content: center; color: #fff; background: radial-gradient(120% 110% at 28% 18%, var(--smg-link, #ff77b2), transparent 62%), linear-gradient(155deg, var(--smg-s3), var(--smg-s1)); }
            .smg-tb-mega-feat-art svg { width: 34px; height: 34px; fill: none !important; opacity: .95; }
            .smg-tb-mega-feat-body { padding: 13px 15px 16px; display: flex; flex-direction: column; gap: 5px; }
            .smg-tb-mega-feat-title { font-size: 15px; font-weight: 800; color: #fff; }
            .smg-tb-mega-feat-desc { font-size: 12px; line-height: 1.45; color: rgba(255,255,255,0.5); }
            .smg-tb-mega-feat-cta { margin-top: 3px; display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 700; color: var(--smg-link, #ff77b2); }
            .smg-tb-mega-feat-cta svg { width: 14px; height: 14px; fill: none !important; }
            @media (max-width: 760px) {
                .smg-tb-pop--mega { min-width: 0; width: calc(100vw - 16px); max-width: calc(100vw - 16px); padding: 14px; }
                .smg-tb-mega-cols { flex-direction: column; gap: 14px; }
                .smg-tb-mega-feat { flex-basis: auto; }
                .smg-tb-mega-feat-art { height: 92px; }
                .smg-tb-mega-grid { grid-template-columns: 1fr; }
            }

            /* lista nativa do XF embutida (sheet mobile de alertas + painel lateral) */
            .smg-tb-listbody { position: relative; max-height: 62vh; overflow-y: auto; margin: 2px 0; }
            /* ATUALIZANDO: reabrir o sino re-busca a lista. Em vez de piscar/esvaziar, a lista atual fica
               na tela, levemente apagada, com uma barrinha correndo no topo até o conteúdo novo chegar. */
            .smg-tb-listbody--refreshing { opacity: 0.55; transition: opacity .15s ease; }
            .smg-tb-listbody--refreshing::before {
                content: ""; position: sticky; top: 0; left: 0; z-index: 3; display: block; height: 2px;
                border-radius: 2px; background: var(--smg-link, #ff77b2);
                animation: smg-al-scan 1s ease-in-out infinite;
            }
            @keyframes smg-al-scan { 0% { margin-left: 0; width: 22%; } 50% { margin-left: 78%; width: 22%; } 100% { margin-left: 0; width: 22%; } }
            .smg-tb-listbody::-webkit-scrollbar { width: 8px; }
            .smg-tb-listbody::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 4px; }
            .smg-tb-loading { padding: 26px; text-align: center; color: rgba(255,255,255,0.5); font-size: 13px; }
            .smg-tb-listbody .listPlain { list-style: none; margin: 0; padding: 0; }
            .smg-tb-listbody .menu-row { display: block; padding: 9px 8px; border: none !important; border-radius: 10px; }
            .smg-tb-listbody .menu-row + .menu-row { border-top: 1px solid rgba(255,255,255,0.06) !important; }
            .smg-tb-listbody .menu-row:hover { background: rgba(255,255,255,0.06); }
            .smg-tb-listbody .contentRow { display: flex; gap: 10px; align-items: flex-start; }
            .smg-tb-listbody .contentRow-main { min-width: 0; font-size: 13px; line-height: 1.45; color: rgba(255,255,255,0.88); }
            .smg-tb-listbody .contentRow-minor { font-size: 11.5px; color: rgba(255,255,255,0.45); margin-top: 2px; }
            .smg-tb-listbody a { color: #cdd6e3; }
            .smg-tb-listbody .fauxBlockLink-blockLink { color: #fff; font-weight: 600; }
            /* notificações/mensagens no DESKTOP (dropdown): itens maiores e mais espaçados */
            /* avisos nativos (.notices, .notices--block) inline com design moderno, compacto e tematizado */
            .notices, .notices--block {
                list-style: none !important;
                padding: 0 !important;
                margin: 0 0 12px 0 !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 8px !important;
            }
            .notice {
                position: relative !important;
                display: flex !important;
                align-items: center !important;
                gap: 12px !important;
                padding: 9px 14px !important;
                border-radius: 12px !important;
                background: rgba(255, 255, 255, 0.04) !important;
                border: 1px solid rgba(255, 255, 255, 0.08) !important;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
                color: rgba(255, 255, 255, 0.88) !important;
                font-size: 13px !important;
                font-weight: 500 !important;
                line-height: 1.45 !important;
                transition: background .15s ease, border-color .15s ease !important;
            }
            .notice:hover {
                background: rgba(255, 255, 255, 0.06) !important;
                border-color: rgba(255, 255, 255, 0.13) !important;
            }
            .notice::before {
                content: "" !important;
                position: absolute !important;
                left: 0 !important;
                top: 6px !important;
                bottom: 6px !important;
                width: 3px !important;
                border-radius: 0 3px 3px 0 !important;
                background: var(--smg-link, #ff77b2) !important;
            }
            .notice-content {
                flex: 1 1 auto !important;
                min-width: 0 !important;
                display: flex !important;
                align-items: center !important;
                flex-wrap: wrap !important;
                gap: 6px !important;
                color: rgba(255, 255, 255, 0.85) !important;
                font-size: 13px !important;
            }
            .notice-content a {
                color: var(--smg-link, #ff77b2) !important;
                font-weight: 600 !important;
                text-decoration: underline !important;
                text-underline-offset: 2px !important;
            }
            .notice-content a:hover {
                color: #fff !important;
            }
            .notice-image {
                flex: 0 0 auto !important;
                display: inline-flex !important;
                align-items: center !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .notice-image img {
                max-height: 24px !important;
                max-width: 30px !important;
                width: auto !important;
                height: auto !important;
                border-radius: 4px !important;
                display: block !important;
            }
            .notice-dismiss, a.notice-dismiss {
                position: static !important;
                margin-left: auto !important;
                flex: 0 0 22px !important;
                width: 22px !important;
                height: 22px !important;
                border-radius: 50% !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                color: rgba(255, 255, 255, 0.4) !important;
                background: rgba(255, 255, 255, 0.05) !important;
                text-decoration: none !important;
                transition: background .12s ease, color .12s ease, transform .1s ease !important;
            }
            .notice-dismiss:hover {
                background: rgba(255, 255, 255, 0.15) !important;
                color: #fff !important;
                transform: scale(1.08) !important;
            }
            .notice-dismiss::before {
                content: "✕" !important;
                font-size: 10px !important;
                font-weight: 700 !important;
                line-height: 1 !important;
            }

            /* ========================================================= */
            /* AVISOS / NOTICES COLLAPSE                                 */
            /* ========================================================= */
            .smg-notices-collapse {
                margin: 16px 0 !important;
                border-radius: 14px !important;
                background: rgba(22, 24, 29, 0.75) !important;
                backdrop-filter: blur(12px) !important;
                -webkit-backdrop-filter: blur(12px) !important;
                border: 1px solid rgba(255, 255, 255, 0.08) !important;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25) !important;
                overflow: hidden !important;
                transition: background .2s ease, border-color .2s ease, opacity .25s ease, transform .25s ease !important;
            }
            .smg-notices-collapse:hover {
                border-color: rgba(255, 255, 255, 0.14) !important;
            }
            .smg-notices-collapse-head {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                padding: 10px 14px !important;
                cursor: pointer !important;
                user-select: none !important;
                background: transparent !important;
                transition: background .15s ease !important;
            }
            .smg-notices-collapse-head:hover {
                background: rgba(255, 255, 255, 0.035) !important;
            }
            .smg-notices-collapse-left {
                display: flex !important;
                align-items: center !important;
                gap: 10px !important;
                min-width: 0 !important;
            }
            .smg-notices-collapse-ico {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                color: var(--smg-link, #ff77b2) !important;
                font-size: 16px !important;
                flex-shrink: 0 !important;
            }
            .smg-notices-collapse-title {
                font-size: 13.5px !important;
                font-weight: 700 !important;
                letter-spacing: 0.01em !important;
                color: rgba(255, 255, 255, 0.95) !important;
            }
            .smg-notices-collapse-badge {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                min-width: 18px !important;
                height: 18px !important;
                padding: 0 5px !important;
                border-radius: 999px !important;
                font-size: 11px !important;
                font-weight: 700 !important;
                background: var(--smg-link, #ff77b2) !important;
                color: #fff !important;
                line-height: 1 !important;
            }
            .smg-notices-collapse-right {
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
                flex-shrink: 0 !important;
            }
            .smg-notices-collapse-chevron {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 16px !important;
                color: rgba(255, 255, 255, 0.45) !important;
                transition: transform .25s cubic-bezier(0.4, 0, 0.2, 1), color .15s ease !important;
            }
            .smg-notices-collapse.is-expanded .smg-notices-collapse-chevron {
                transform: rotate(180deg) !important;
                color: rgba(255, 255, 255, 0.85) !important;
            }
            .smg-notices-collapse-dismiss {
                background: rgba(255, 255, 255, 0.05) !important;
                border: none !important;
                width: 24px !important;
                height: 24px !important;
                border-radius: 50% !important;
                color: rgba(255, 255, 255, 0.45) !important;
                cursor: pointer !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 13px !important;
                padding: 0 !important;
                transition: background .15s ease, color .15s ease, transform .12s ease !important;
            }
            .smg-notices-collapse-dismiss:hover {
                background: rgba(255, 255, 255, 0.15) !important;
                color: #fff !important;
                transform: scale(1.08) !important;
            }
            .smg-notices-collapse-body {
                display: flex !important;
                flex-direction: column !important;
                gap: 6px !important;
                padding: 6px 12px 10px !important;
                border-top: 1px solid rgba(255, 255, 255, 0.06) !important;
                background: rgba(0, 0, 0, 0.15) !important;
            }
            .smg-notices-collapse-body[hidden] {
                display: none !important;
            }
            .smg-notices-collapse-item {
                position: relative !important;
                display: flex !important;
                align-items: center !important;
                gap: 10px !important;
                padding: 8px 12px !important;
                border-radius: 10px !important;
                background: rgba(255, 255, 255, 0.03) !important;
                border: 1px solid rgba(255, 255, 255, 0.05) !important;
                font-size: 12.5px !important;
                line-height: 1.45 !important;
                color: rgba(255, 255, 255, 0.88) !important;
                transition: background .15s ease, border-color .15s ease, opacity .2s ease, transform .2s ease !important;
            }
            .smg-notices-collapse-item:hover {
                background: rgba(255, 255, 255, 0.05) !important;
                border-color: rgba(255, 255, 255, 0.09) !important;
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
                border-radius: 4px !important;
                display: block !important;
            }
            .smg-notices-item-content {
                flex: 1 1 auto !important;
                min-width: 0 !important;
                display: flex !important;
                align-items: center !important;
                flex-wrap: wrap !important;
                gap: 6px !important;
                color: rgba(255, 255, 255, 0.88) !important;
            }
            .smg-notices-item-content a {
                color: var(--smg-link, #ff77b2) !important;
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
                border-radius: 50% !important;
                background: transparent !important;
                border: none !important;
                color: rgba(255, 255, 255, 0.35) !important;
                cursor: pointer !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 12px !important;
                padding: 0 !important;
                transition: background .12s ease, color .12s ease, transform .1s ease !important;
            }
            .smg-notices-item-dismiss:hover {
                background: rgba(255, 255, 255, 0.12) !important;
                color: #fff !important;
                transform: scale(1.08) !important;
            }
            @media (max-width: 600px) {
                .smg-notices-collapse {
                    margin: 12px 0 !important;
                    border-radius: 12px !important;
                }
                .smg-notices-collapse-head {
                    padding: 8px 10px !important;
                }
                .smg-notices-collapse-title {
                    font-size: 13px !important;
                }
                .smg-notices-collapse-body {
                    padding: 5px 8px 8px !important;
                    gap: 5px !important;
                }
                .smg-notices-collapse-item {
                    padding: 6px 8px !important;
                    font-size: 12px !important;
                }
            }

            /* trava do fundo enquanto um sheet está aberto (ver smgSheetOpen). position:fixed no
               body, não overflow:hidden: no Safari iOS o overflow no html é ignorado quando já há
               scroll em curso, e a página continuava rolando atrás do sheet. O top negativo
               preserva a posição, restaurada no fechamento. */
            html.smg-sheet-lock, html.smg-sheet-lock body { overflow: hidden !important; overscroll-behavior: none; }
            html.smg-sheet-lock body { position: fixed !important; left: 0; right: 0; width: 100%; }

            /* bottom sheets (mobile) — alertas / discover / conta. mesmo conteúdo dos dropdowns da topbar */
            .smg-sheet { position: fixed; inset: 0; z-index: 1000000; display: none; opacity: 0; background: rgba(0,0,0,0.5); -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); transition: opacity .2s ease; }
            .smg-sheet.open { display: block; opacity: 1; }
            .smg-sheet .smg-csheet-panel {
                position: absolute; left: 0; right: 0; bottom: 0;
                padding: 8px 14px calc(14px + env(safe-area-inset-bottom));
                /* dvh, não vh: no celular vh é a altura com a barra de URL RETRAÍDA, então o sheet
                   nascia mais alto que a tela e o rodapé ficava embaixo da barra do navegador */
                max-height: 80vh; max-height: 80dvh; display: flex; flex-direction: column;
                background: var(--smg-s1);
                border-radius: 20px 20px 0 0; border-top: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 -12px 44px rgba(0,0,0,0.62);
                transform: translateY(100%); transition: transform .28s cubic-bezier(.2,.8,.3,1);
            }
            .smg-sheet.open .smg-csheet-panel { transform: translateY(0); }
            /* DIALOG DE TELA CHEIA (conta): mesma animação de subida, mas ocupa tudo — lista longa
               num drawer de 80vh mostrava metade e o arrasto-pra-fechar brigava com a rolagem dela */
            .smg-sheet--full .smg-csheet-panel {
                top: 0; height: 100%; max-height: none; border-radius: 0; border-top: 0;
                padding: calc(6px + env(safe-area-inset-top)) 14px calc(14px + env(safe-area-inset-bottom));
            }
            .smg-csheet-x {
                width: 40px; height: 40px; margin-right: -6px; flex: none; align-self: flex-start;
                display: inline-flex; align-items: center; justify-content: center;
                border: 0; border-radius: 50%; background: transparent; color: rgba(255,255,255,0.75);
                font-size: 22px; cursor: pointer; -webkit-tap-highlight-color: transparent;
            }
            .smg-csheet-x:active { background: rgba(255,255,255,0.09); }
            /* uma linha só: identidade à esquerda, X no canto superior direito */
            .smg-csheet-head--id { flex-direction: row; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 2px 0 14px; }
            .smg-csheet-id { display: flex; align-items: center; gap: 13px; padding: 2px; min-width: 0; color: #fff; text-decoration: none; }
            .smg-csheet-id .avatar, .smg-csheet-id .avatar > img, .smg-csheet-id .avatar > span {
                width: 52px !important; height: 52px !important; border-radius: 50% !important;
                font-size: 22px !important; line-height: 52px !important; text-align: center;
            }
            .smg-csheet-idtxt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
            .smg-csheet-idtxt strong { font-size: 19px; font-weight: 800; line-height: 1.2; }
            .smg-csheet-idtxt span { font-size: 13px; font-weight: 600; color: var(--smg-link, #ff77b2); }
            .smg-csheet-head { display: flex; align-items: center; justify-content: space-between; padding: 4px 4px 8px; font-size: 15px; font-weight: 700; color: #fff; }
            .smg-csheet-head a { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.6); text-decoration: none; }
            .smg-csheet-body { overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }   /* contain = chegar no fim da lista não "vaza" o scroll pro fundo */
            .smg-csheet-user { padding: 2px 4px 10px; font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.55); }
            /* alertas dentro do sheet (mobile): fonte e respiro bem maiores que o dropdown do desktop */
            .smg-sheet .smg-csheet-head { font-size: 18px; padding: 6px 6px 12px; }
            .smg-sheet .smg-csheet-head a { font-size: 14px; }
            .smg-sheet .smg-tb-listbody .menu-row { padding: 15px 12px; border-radius: 14px; }
            .smg-sheet .smg-tb-listbody .contentRow { gap: 14px; align-items: flex-start; }
            .smg-sheet .smg-tb-listbody .contentRow-figure .avatar,
            .smg-sheet .smg-tb-listbody .contentRow-figure img { width: 44px !important; height: 44px !important; }
            .smg-sheet .smg-tb-listbody .contentRow-figure .avatar > span,
            .smg-sheet .smg-tb-listbody .contentRow-figure .avatar > img { width: 44px !important; height: 44px !important; font-size: 19px !important; line-height: 44px !important; }
            .smg-sheet .smg-tb-listbody .contentRow-main { font-size: 16px !important; line-height: 1.5; }
            .smg-sheet .smg-tb-listbody .contentRow-main .label { font-size: 9.5px !important; padding: 1.5px 5px !important; border-radius: 4px !important; }
            .smg-sheet .smg-tb-listbody .contentRow-minor { font-size: 13px !important; margin-top: 4px; }

            /* ===== alertas "Limpo" (estilo FB): seções Novas/Anteriores · nome · tags · autor+data · dot ===== */
            /* cor de link do tema do XF (cada fórum tem a sua) — composta dos componentes H/S/L do XF */
            .smg-tb-listbody .smg-alert-clean { --smg-link: hsl(var(--xf-linkColor--h, 330), var(--xf-linkColor--s, 70%), var(--xf-linkColor--l, 60%)); --smg-al-sep: rgba(255,255,255,0.085); }
            .smg-tb-listbody .smg-alert-clean .contentRow-figure { display: none !important; }   /* a foto é do user, não do tópico */
            /* ícone de tipo à esquerda: publicação (cinza, foto) vs comentário (cor do site, balão) */
            .smg-tb-listbody .smg-alert-clean .smg-al-icon {
                flex: 0 0 80px !important; width: 80px !important; min-height: 80px !important; height: auto !important; aspect-ratio: 1 / 1 !important; margin-top: 1px; box-sizing: border-box;
                display: flex; align-items: center; justify-content: center;
                border-radius: 12px !important; border: 1px solid rgba(255,255,255,0.08);
                background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5);
                align-self: stretch !important;
                transition: border-color .15s ease, background .15s ease, color .15s ease;
            }
            .smg-tb-listbody .smg-alert-clean .smg-al-icon svg { width: 24px; height: 24px; }
            .smg-tb-listbody .smg-alert-clean .smg-al-icon--comment { color: var(--smg-link, #ff77b2); }
            /* não-lida: o ícone ganha a tinta do tema (o card inteiro fica mais "vivo" que as lidas) */
            .smg-tb-listbody .smg-alert-clean li.alert.is-unread .smg-al-icon {
                background: var(--smg-link-soft, rgba(255,119,178,0.16)); border-color: rgba(255,255,255,0.14); color: var(--smg-link, #ff77b2);
            }
            /* FOTO da thread no lugar do glifo (quando o cache de thumbs conhece a thread do alerta):
               mesma caixa, então trocar o glifo pela imagem não desloca uma linha sequer. */
            .smg-tb-listbody .smg-alert-clean .smg-al-icon--thumb { width: 80px !important; min-height: 80px !important; height: auto !important; aspect-ratio: 1 / 1 !important; border-radius: 12px !important; flex: 0 0 80px !important; align-self: stretch !important; padding: 0; overflow: hidden; background: rgba(255,255,255,0.05); }
            .smg-tb-listbody .smg-alert-clean .smg-al-icon--thumb img { width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 12px; }
            .smg-tb-listbody .smg-alert-clean li.alert.is-unread .smg-al-icon--thumb { background: rgba(255,255,255,0.05); }   /* com foto, a tinta do tema só polui */
            /* no painel lateral e na folha mobile */
            .smg-tb-listbody .smg-alert-clean .smg-al-icon--thumb,
            #smg-aldock .smg-alert-clean .smg-al-icon--thumb,
            .smg-sheet .smg-alert-clean .smg-al-icon--thumb,
            .smg-tb-listbody .smg-alert-clean .smg-al-icon {
                width: 80px !important;
                min-height: 80px !important;
                height: auto !important;
                aspect-ratio: 1 / 1 !important;
                border-radius: 12px !important;
                flex: 0 0 80px !important;
                align-self: stretch !important;
            }
            .smg-sheet .smg-alert-clean .smg-al-icon svg { width: 24px; height: 24px; }
            .smg-tb-listbody .smg-alert-clean li.alert .contentRow {
                display: flex !important;
                align-items: stretch !important;
                gap: 14px !important;
            }
            /* flex:1 — a coluna de texto ocupa a linha inteira, alinhada com a thumbnail */
            .smg-tb-listbody .smg-alert-clean .contentRow-main {
                flex: 1 1 auto;
                min-width: 0;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                gap: 4px !important;
                position: relative;
                padding-right: 30px;
                min-height: 80px !important;
            }
            /* cabeçalho de seção (Unread / Read) — discreto, em maiúsculas */
            /* fica GRUDADO no topo enquanto a seção rola (o "Lidas" não some de vista numa lista longa) */
            .smg-tb-listbody .smg-alert-clean .smg-al-section {
                position: sticky; top: 0; z-index: 2;
                list-style: none; border: 0 !important;
                background: var(--smg-s1, #1c1d22) !important;
                padding: 13px 14px 7px; font-size: 10.5px; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; color: rgba(255,255,255,0.42);
            }
            .smg-tb-listbody .smg-alert-clean .smg-al-section:first-child { padding-top: 6px; }
            .smg-tb-listbody .smg-alert-clean .smg-al-section:hover { background: transparent !important; }
            /* linha do alerta: SEPARADOR entre todas + não-lida com faixa da cor do tema à esquerda */
            .smg-tb-listbody .smg-alert-clean li.alert {
                position: relative; padding: 13px 14px;
                border-bottom: 1px solid var(--smg-al-sep);
                transition: background .14s ease, opacity .15s ease;
            }
            .smg-tb-listbody .smg-alert-clean li.alert:last-child { border-bottom: 0; }
            .smg-tb-listbody .smg-alert-clean li.alert .fauxBlockLink { position: static !important; }
            .smg-tb-listbody .smg-alert-clean li.alert,
            .smg-tb-listbody .smg-alert-clean li.alert .contentRow { background: transparent !important; box-shadow: none !important; }
            .smg-tb-listbody .smg-alert-clean li.alert:hover { background: rgba(255,255,255,0.055) !important; }
            /* NÃO-LIDA: tinta suave do tema + faixa de 3px na borda esquerda (marcador claro, sem poluir) */
            .smg-tb-listbody .smg-alert-clean li.alert.is-unread { background: var(--smg-link-soft, rgba(255,255,255,0.05)) !important; }
            .smg-tb-listbody .smg-alert-clean li.alert.is-unread::before {
                content: ""; position: absolute; left: 0; top: 7px; bottom: 7px; width: 3px;
                border-radius: 0 3px 3px 0; background: var(--smg-link, #ff77b2);
            }
            .smg-tb-listbody .smg-alert-clean li.alert.is-unread:hover { box-shadow: inset 0 0 0 999px rgba(255,255,255,0.05) !important; }
            /* JÁ VISTAS: bem apagadas (o olho vai direto nas novas) — o hover devolve o contraste inteiro */
            .smg-tb-listbody .smg-alert-clean li.smg-al-old { opacity: 0.4; }
            .smg-tb-listbody .smg-alert-clean li.smg-al-old .smg-al-title { font-weight: 600; color: rgba(255,255,255,0.8) !important; }
            .smg-tb-listbody .smg-alert-clean li.smg-al-old .smg-al-icon { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.06); }
            .smg-tb-listbody .smg-alert-clean li.smg-al-old:hover { opacity: 1; }
            /* nome do tópico */
            .smg-tb-listbody .smg-alert-clean .smg-al-title {
                font-weight: 700; color: #fff !important; line-height: 1.35; font-size: 14px; letter-spacing: -0.01em;
                display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden;
                text-decoration: none !important;   /* sublinhado só no hover (no sheet mobile vinha sublinhado sempre) */
            }
            .smg-tb-listbody .smg-alert-clean li.alert:hover .smg-al-title { text-decoration: underline !important; text-underline-offset: 2px; }
            /* tags: chips nativos coloridos (cor da plataforma) — menores */
            .smg-al-tags { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
            .smg-alert-clean .smg-al-tags .smg-al-chip,
            .smg-alert-clean .smg-al-tags .label,
            .smg-alert-clean .smg-al-tags .prefix,
            #smg-aldock .smg-al-tags .smg-al-chip,
            #smg-aldock .smg-al-tags .label,
            .smg-sheet .smg-al-tags .smg-al-chip,
            .smg-al-tags .smg-al-chip {
                font-size: 9.5px !important;
                font-weight: 600 !important;
                padding: 1px 5px !important;
                border-radius: 4px !important;
                line-height: 1.3 !important;
                letter-spacing: normal !important;
                white-space: nowrap !important;
                display: inline-flex !important;
                align-items: center !important;
            }
            .smg-al-tags .label-append { display: none !important; }
            /* publicado por @autor · data */
            .smg-al-by,
            .smg-alert-clean .smg-al-by {
                display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 11.5px; color: rgba(255,255,255,0.42);
                justify-content: flex-start !important;
                width: 100% !important;
            }
            .smg-al-by .smg-al-user { color: rgba(255,255,255,0.68) !important; font-weight: 600; text-decoration: none; white-space: nowrap; }
            .smg-al-by .smg-al-user:hover { color: #fff !important; text-decoration: underline; }
            .smg-al-time,
            .smg-alert-clean .smg-al-time,
            .smg-tb-listbody .smg-alert-clean .smg-al-time,
            #smg-aldock .smg-alert-clean .smg-al-time,
            .smg-sheet .smg-alert-clean .smg-al-time {
                margin-left: 0 !important;
                margin-right: auto !important;
                text-align: left !important;
                white-space: nowrap !important;
                color: rgba(255,255,255,0.4) !important;
                font-size: 11px !important;
            }
            /* botão "marcar como lido" — SEMPRE visível nas não-lidas: dot rosa que vira ✓ no hover · clique persiste */
            .smg-al-read {
                position: absolute; right: 6px; top: 11px; z-index: 2;
                width: 28px; height: 28px; padding: 0; border: 0; border-radius: 999px;
                background: transparent; cursor: pointer; -webkit-appearance: none; appearance: none;
                display: inline-flex; align-items: center; justify-content: center; transition: background .15s ease;
            }
            .smg-al-read::before {
                content: ""; width: 11px; height: 11px; border-radius: 50%; background: var(--smg-link, #ff77b2);
                line-height: 1; font-size: 0; font-weight: 800; transition: background .12s ease;
            }
            .smg-al-read:hover { background: rgba(255,255,255,0.12); }
            .smg-al-read:hover::before { content: "✓"; width: auto; height: auto; background: transparent; font-size: 17px; color: var(--smg-link, #ff77b2); }
            .smg-al-read:active { transform: scale(0.88); }
            .smg-al-read-txt { display: none; }   /* texto só no mobile (sheet) */
            html.smg-smg .smg-al-read::before { width: 8px; height: 8px; }   /* badge um pouco menor no socialmediagirls */
            html.smg-smg .smg-al-read:hover::before { font-size: 15px; }
            /* mobile (sheet): tudo um tico maior */
            .smg-sheet .smg-alert-clean li.alert { padding: 16px 40px 16px 14px; }
            .smg-sheet .smg-alert-clean .smg-al-section { font-size: 15px; }
            .smg-sheet .smg-al-title { font-size: 16px; }
            .smg-sheet .smg-al-by { font-size: 13.5px; }
            /* mobile (sheet): vira pílula com o texto "Marcar como lido" — mais fácil de tocar */
            .smg-sheet .smg-alert-clean .contentRow-main { padding-right: 14px; }   /* no mobile o botão é pílula em fluxo, não precisa de gutter */
            .smg-sheet .smg-al-read {
                position: static; transform: none; width: auto; height: auto; right: auto; top: auto;
                margin-top: 4px; padding: 9px 16px; border-radius: 10px;
                background: rgba(255,255,255,0.08); align-self: flex-start;
            }
            .smg-sheet .smg-al-read::before { display: none; }
            .smg-sheet .smg-al-read:active { transform: scale(0.96); }
            .smg-sheet .smg-al-read-txt { display: inline; color: var(--smg-link, #ff77b2); font-weight: 700; font-size: 14px; }

            /* Estilização de /account/alerts caso renderizada nativamente */
            html[data-template="account_alerts"] .contentRow,
            .block-body.js-alertList .contentRow {
                display: flex !important;
                flex-direction: row !important;
                align-items: center !important;
                gap: 12px !important;
            }
            html[data-template="account_alerts"] .contentRow-figure,
            .block-body.js-alertList .contentRow-figure {
                flex: 0 0 64px !important;
                width: 64px !important;
                height: 64px !important;
            }
            html[data-template="account_alerts"] .contentRow-figure img,
            .block-body.js-alertList .contentRow-figure img {
                width: 64px !important;
                height: 64px !important;
                object-fit: cover !important;
                border-radius: 12px !important;
            }
            html[data-template="account_alerts"] .contentRow-main,
            .block-body.js-alertList .contentRow-main {
                flex: 1 1 auto !important;
                min-width: 0 !important;
            }

            @media (max-width: 992px) {
                /* tablet: some o Discover do canto, search central continua */
                .smg-tb-nav, .smg-tb-cta { display: none; }
                html.smg-topbar-on body { padding-top: 52px !important; }
            }
            /* Mobile: fixed topbar with one height (matching the bottom navbar). Threads swap
               in the context shell; other pages keep the logo and actions. */
            @media (max-width: 600px) {
                :root { --smg-mobile-topbar-h: 54px; }
                #smg-topbar-wrap {
                    position: fixed !important; top: 0; left: 0; right: 0; width: 100%;
                    height: calc(var(--smg-mobile-topbar-h) + env(safe-area-inset-top));
                    padding-top: env(safe-area-inset-top); box-sizing: border-box;
                    z-index: 1000;
                }
                #smg-topbar {
                    height: var(--smg-mobile-topbar-h); border-bottom-color: rgba(255,255,255,0.08);
                }
                #smg-tb-inner {
                    display: flex; width: 100%; max-width: none; height: var(--smg-mobile-topbar-h);
                    padding: 0 12px; gap: 8px; justify-content: space-between;
                }
                .smg-tb-left { flex: 1 1 auto; min-width: 0; gap: 0; }
                .smg-tb-logo { height: 40px; min-width: 0; max-width: 100%; margin-right: 0; }
                .smg-tb-logo img { height: 30px; max-width: 100%; }
                .smg-logo-word { font-size: 22px; }
                .smg-tb-center { display: none; }
                .smg-tb-actions { display: flex !important; flex: 0 0 auto; gap: 2px; }
                .smg-tb-actions > * { display: none !important; }
                .smg-tb-actions > .smg-tb-searchbtn,
                .smg-tb-actions > .smg-tb-account,
                .smg-tb-actions > .smg-tb-railbtn,
                html.smg-guest .smg-tb-actions > .smg-tb-loginbtn { display: inline-flex !important; }
                .smg-tb-act, .smg-tb-account { width: 44px; height: 44px; }
                .smg-tb-act svg { width: 21px; height: 21px; }
                html.smg-topbar-on body { padding-top: calc(var(--smg-mobile-topbar-h) + env(safe-area-inset-top)) !important; }
                html.smg-topbar-on :target { scroll-margin-top: calc(var(--smg-mobile-topbar-h) + env(safe-area-inset-top)); }

                /* Thread: título centralizado entre duas colunas de 44px, sem overflow do
                   nome para fora da viewport e com alvo de toque confortável no voltar. */
                html.smg-thread #smg-tb-inner { display: none !important; }
                html.smg-thread .smg-mobile-threadbar {
                    display: grid; grid-template-columns: 44px minmax(0, 1fr) 44px;
                    align-items: center; width: 100%; height: var(--smg-mobile-topbar-h);
                    padding: 0 8px; box-sizing: border-box;
                }
                .smg-mobile-threadbar-back {
                    width: 44px; height: 44px; padding: 0; border: 0; border-radius: 999px;
                    display: inline-flex; align-items: center; justify-content: center;
                    background: transparent; color: rgba(255,255,255,0.95); cursor: pointer;
                    -webkit-tap-highlight-color: transparent; touch-action: manipulation;
                    transition: background .14s ease, transform .12s ease;
                }
                .smg-mobile-threadbar-back:hover { background: rgba(255,255,255,0.09); }
                .smg-mobile-threadbar-back:active { transform: scale(.91); }
                .smg-mobile-threadbar-back svg {
                    display: block; width: 23px; height: 23px; fill: none !important;
                    stroke: currentColor !important; stroke-width: 2 !important;
                }
                .smg-mobile-threadbar-title {
                    display: flex; align-items: center; justify-content: center; gap: 5px;
                    min-width: 0; width: 100%; overflow: hidden; white-space: nowrap;
                    color: #fff; font-size: 15px; font-weight: 750; line-height: 1.2;
                    text-align: center; letter-spacing: -.01em;
                }
                /* Prefixos copiados do título nativo continuam compactos e mantêm a cor
                   própria (Twitch, Patreon, etc.) sem empurrar o texto para outra linha. */
                .smg-mobile-threadbar-title > .label,
                .smg-mobile-threadbar-title > .prefix,
                .smg-mobile-threadbar-title > [class*="label--"],
                .smg-mobile-threadbar-title > [class*="prefix--"] {
                    position: static !important; display: inline-flex !important; align-items: center;
                    justify-content: center; flex: 0 0 auto; max-width: 42%; height: 20px;
                    min-height: 20px; padding: 0 7px !important; margin: 0 !important;
                    border-radius: 6px !important; font-size: 10px !important;
                    font-weight: 800 !important; line-height: 1 !important; letter-spacing: .02em;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    pointer-events: none; cursor: default !important; box-sizing: border-box;
                }
                .smg-mobile-threadbar-title-text {
                    display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .smg-mobile-threadbar-end { width: 44px; height: 44px; }

            }
            @media (max-width: 480px) {
            }

            /* no desktop a navegação principal vive na topbar; some da dock (mantém engrenagem + ações).
               no mobile esses botões continuam (viram a navbar inferior) */
            @media (min-width: 601px) {
                #smg-nav-home, #smg-nav-discover, #smg-nav-timeline, #smg-thread-search,
                #smg-nav-watched, #smg-nav-alerts, #smg-nav-user, #smg-mobile-page-btn, #smg-mobile-page-toggle, #smg-thread-view-mode { display: none !important; }
                .smg-dock-thread-bar { display: none !important; }
                /* a engrenagem foi pra ESQUERDA → o grupo central (só nav, escondida no desktop) fica vazio: some ele + o divisor seguinte */
                #smg-post-nav-panel > .smg-nav-center,
                #smg-post-nav-panel > .smg-nav-center + .smg-nav-divider { display: none !important; }
                /* páginas sem ações (sobraria só a engrenagem): esconde a dock inteira no desktop */
                #smg-post-nav-wrapper.smg-dock-baronly { display: none !important; }
                #smg-post-nav-wrapper.smg-dock-baronly.smg-dock-show { display: block !important; }   /* reaberta pelo FAB */
            }
            /* FAB de configurações (canto inferior direito) — só é criado nas páginas baronly (JS),
               então é inline-flex por padrão; escondemos no mobile (navbar já tem a engrenagem) e quando a dock é reaberta */
            #smg-settings-fab {
                position: fixed; right: 18px; bottom: 18px; z-index: 999990;
                width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--smg-bd);
                background: var(--smg-s1); color: rgba(255,255,255,0.72); cursor: pointer;
                display: inline-flex; align-items: center; justify-content: center;
                box-shadow: 0 6px 20px rgba(0,0,0,0.45); transition: color .14s ease, background .14s ease, transform .12s ease;
            }
            #smg-settings-fab .smg-nav-ico { font-size: 21px; }   /* o svg é 1em → gear de 21px, igual a dock (com fill:none) */
            #smg-settings-fab:hover { color: #fff; background: var(--smg-s2); }
            #smg-settings-fab:active { transform: scale(0.92); }
            #smg-post-nav-wrapper.smg-dock-show ~ #smg-settings-fab { display: none !important; }
            @media (max-width: 600px) { #smg-settings-fab { display: none !important; } }   /* mobile: a navbar inferior já tem a engrenagem */

            /* ---- dock: container ---- */
            #smg-post-nav-wrapper {
                position: fixed;
                left: 50%;
                bottom: 20px;
                transform: translateX(-50%);
                z-index: 999999;
            }
            #smg-post-nav-panel {
                position: relative;
                z-index: 12; /* acima dos popovers (z 11) p/ os tooltips do hover aparecerem */
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 6px;
                padding: 8px;
                border-radius: 999px;
                background: rgba(26, 26, 26, 0.95); /* PERF: bg quase-opaco no lugar do backdrop-filter (blur 22px re-amostrava a página a CADA frame de scroll — dock fixa sobre a thread; mesmo fix já aplicado na topbar/feed) */
                border: 1px solid rgba(255,255,255,0.09);
                box-shadow:
                    inset 0 1px 0 rgba(255,255,255,0.08),
                    0 12px 34px rgba(0,0,0,0.5),
                    0 2px 8px rgba(0,0,0,0.35);
                transition: transform .3s cubic-bezier(.2,.8,.3,1), opacity .3s ease;
            }
            #smg-post-nav-wrapper.manual-hidden #smg-post-nav-panel {
                transform: translateY(230%);
                opacity: 0;
                pointer-events: none;
            }
            .smg-nav-group {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 6px;
            }
            .smg-nav-divider {
                width: 1px;
                height: 26px;
                margin: 0 13px;
                flex: 0 0 auto;
                background: linear-gradient(180deg, transparent, rgba(255,255,255,0.22) 50%, transparent);
            }

            /* botão que abre o sheet — escondido no desktop, aparece no mobile */
            #smg-dock-sheet-btn { display: none; }

            /* ---- bottom sheet de opções (mobile) ---- */
            #smg-sheet { position: fixed; inset: 0; z-index: 1000000; display: none; opacity: 0; background: rgba(0,0,0,0.5); -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); transition: opacity .2s ease; }
            #smg-sheet.open { display: block; opacity: 1; }
            .smg-sheet-panel {
                position: absolute; left: 0; right: 0; bottom: 0;
                padding: 10px 16px calc(20px + env(safe-area-inset-bottom));
                /* o painel NÃO rola: quem rola é o .smg-sheet-body. Com o overflow aqui, a alça
                   (grip) subia junto com a lista e o gesto de arrastar-pra-fechar sumia. dvh pelo
                   mesmo motivo do sheet da topbar. */
                max-height: 82vh; max-height: 82dvh;
                display: flex; flex-direction: column; overflow: hidden;
                background: var(--smg-s1);
                border-radius: 20px 20px 0 0;
                border-top: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 -12px 44px rgba(0,0,0,0.62);
                transform: translateY(100%);
                transition: transform .28s cubic-bezier(.2,.8,.3,1);
            }
            #smg-sheet.open .smg-sheet-panel { transform: translateY(0); }
            .smg-sheet-grip { width: 40px; height: 5px; border-radius: 999px; background: rgba(255,255,255,0.25); margin: 4px auto 14px; flex: none; }
            .smg-sheet-body { overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
            .smg-sheet-title { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,0.45); margin: 18px 4px 12px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.07); }
            .smg-sheet-body > .smg-sheet-title:first-child { margin-top: 2px; padding-top: 0; border-top: none; }
            .smg-sheet-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px 6px; }
            /* item = coluna transparente: botão CIRCULAR (mesma linguagem do dock desktop) + label embaixo */
            .smg-sheet-item { display: flex; flex-direction: column; align-items: center; gap: 7px; padding: 0; border: 0; background: transparent; color: #fff; cursor: pointer; -webkit-tap-highlight-color: transparent; }
            .smg-sheet-item.smg-sheet-disabled { opacity: .32; pointer-events: none; }
            .smg-sheet-ico {
                width: 46px; height: 46px; border-radius: 50%; box-sizing: border-box;
                display: flex; align-items: center; justify-content: center;
                border: 1px solid rgba(255,255,255,0.09); background: rgba(255,255,255,0.05);
                color: rgba(255,255,255,0.95); font-size: 20px; line-height: 1;
                transition: background .15s ease, border-color .15s ease, transform .12s ease;
            }
            .smg-sheet-ico svg { width: 1em; height: 1em; fill: none !important; }
            .smg-sheet-item:active .smg-sheet-ico { transform: scale(0.9); background: rgba(255,255,255,0.14); }
            /* estado ativo — espelha o .smg-active do dock (watch on, filtro on, etc.) */
            .smg-sheet-item.smg-active .smg-sheet-ico { background: var(--smg-link-strong, #d14d8f); border-color: var(--smg-link-strong, #d14d8f); color: #fff; }
            .smg-sheet-lbl { font-size: 10.5px; line-height: 1.2; text-align: center; color: rgba(255,255,255,0.7); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

            /* ---- dock: botões circulares (icon-only) ---- */
            .smg-nav-btn {
                position: relative;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                border: 1px solid rgba(255,255,255,0.07);
                background: rgba(255,255,255,0.045);
                color: rgba(255,255,255,0.95);
                box-sizing: border-box;
                text-decoration: none;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                transition: transform .18s cubic-bezier(.2,.8,.3,1), background .16s ease, color .16s ease, border-color .16s ease, box-shadow .16s ease;
            }
            .smg-nav-ico {
                position: relative;   /* âncora do badge reativo (alertas) */
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: var(--smg-btn-fs, 19px);
                line-height: 1;
                filter: drop-shadow(0 1px 2px rgba(0,0,0,0.6));
            }
            /* badge reativo na dock/navbar (contador de alertas) */
            .smg-nav-badge {
                position: absolute; top: -6px; right: -9px; z-index: 2;
                min-width: 16px; height: 16px; padding: 0 4px; box-sizing: border-box;
                border-radius: 999px; background: #e0245e; color: #fff;
                font-size: 10px; font-weight: 700; line-height: 1;
                display: flex; align-items: center; justify-content: center;
                font-variant-numeric: tabular-nums; pointer-events: none;
            }
            /* o CSS do fórum sobrescreve o atributo fill="none" e "enche" os SVGs;
               força outline em todos (o ponto do sino tem fill próprio e sobrevive) */
            .smg-nav-ico svg {
                fill: none !important;
            }
            .smg-nav-btn:not(:disabled):hover {
                background: rgba(255,255,255,0.13);
                color: #fff;
                border-color: rgba(255,255,255,0.2);
                transform: translateY(-4px) scale(1.07);
                box-shadow: 0 10px 20px rgba(0,0,0,0.45);
            }
            .smg-nav-btn:not(:disabled):active {
                transform: translateY(-1px) scale(0.96);
            }
            .smg-nav-btn:disabled {
                opacity: 0.3;
                cursor: default;
            }

            /* ---- dock: tooltip (label só no hover) ---- */
            .smg-nav-btn[data-label]::after,
            #smg-dock-handle[data-label]::after {
                content: attr(data-label);
                position: absolute;
                bottom: calc(100% + 12px);
                left: 50%;
                transform: translateX(-50%) translateY(5px);
                padding: 5px 9px;
                border-radius: 8px;
                background: rgba(20,21,25,0.97);
                color: #fff;
                font-size: 12px;
                font-weight: 500;
                line-height: 1;
                white-space: nowrap;
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 8px 22px rgba(0,0,0,0.5);
                opacity: 0;
                pointer-events: none;
                transition: opacity .18s ease, transform .18s ease;
                z-index: 9999;
            }
            .smg-nav-btn[data-label]:not(:disabled):hover::after,
            #smg-dock-handle[data-label]:not(:disabled):hover::after {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }

            /* ---- dock: botão com label VISÍVEL (pílula) — ex.: sort mostrando "Data"/"Reações" nas 2 docks ---- */
            .smg-nav-btn.smg-nav-labeled { width: auto !important; border-radius: 20px !important; padding: 0 14px 0 12px !important; gap: 7px; }
            .smg-nav-btn-text { font-size: 13px; font-weight: 600; white-space: nowrap; letter-spacing: .01em; line-height: 1; }

            /* ---- dock: botão Ocultar (secundário, mais discreto) ---- */
            #smg-dock-hide {
                background: rgba(255,255,255,0.02);
                color: rgba(255,255,255,0.5);
            }
            #smg-dock-hide:not(:disabled):hover {
                background: rgba(255,255,255,0.13);
                color: #fff;
            }

            /* ---- dock: handle/aba pra reabrir quando oculta ---- */
            #smg-dock-handle {
                display: none;
                position: absolute;
                left: 50%;
                bottom: 0;
                transform: translateX(-50%);
                width: 60px;
                height: 28px;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                border: 1px solid rgba(255,255,255,0.12);
                background: var(--smg-s2);
                color: rgba(255,255,255,0.9);
                font-size: 16px;
                cursor: pointer;
                box-shadow:
                    inset 0 1px 0 rgba(255,255,255,0.1),
                    0 10px 26px rgba(0,0,0,0.55);
                transition: transform .2s cubic-bezier(.2,.8,.3,1), color .15s ease, background .15s ease, border-color .15s ease, box-shadow .15s ease;
            }
            #smg-dock-handle:hover {
                color: #fff;
                background: var(--smg-s3);
                border-color: rgba(255,255,255,0.22);
                transform: translateX(-50%) translateY(-3px);
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 14px 30px rgba(0,0,0,0.6);
            }
            #smg-dock-handle:active {
                transform: translateX(-50%) translateY(-1px) scale(0.97);
            }
            #smg-post-nav-wrapper.manual-hidden #smg-dock-handle {
                display: flex;
            }

            /* ---- goto: número da página dentro do botão (thread + galeria) ---- */
            #smg-post-goto, #smg-gal-goto {
                border-radius: 12px !important; /* rounded-2xl */
                min-width: 64px !important;
                height: 34px !important;
                padding: 0 10px !important;
            }
            #smg-post-goto .smg-nav-ico,
            #smg-gal-goto .smg-nav-ico {
                font-size: 13px !important;
                font-weight: 700 !important;
                letter-spacing: 0 !important;
                white-space: nowrap !important;
            }

            /* ---- goto: popover de pular pra uma página ---- */
            #smg-goto-pop {
                position: absolute;
                bottom: calc(100% + 12px);
                left: 50%;
                transform: translateX(-50%) translateY(6px);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 11px;
                min-width: 232px;
                padding: 16px 18px;
                border-radius: 18px;
                background: var(--smg-s1);
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 44px rgba(0,0,0,0.62);
                backdrop-filter: blur(20px) saturate(170%);
                -webkit-backdrop-filter: blur(20px) saturate(170%);
                visibility: hidden;
                opacity: 0;
                pointer-events: none;
                transition: opacity .18s ease, transform .18s ease, visibility .18s;
                z-index: 11;
            }
            #smg-post-nav-wrapper.goto-open #smg-goto-pop {
                visibility: visible;
                opacity: 1;
                pointer-events: auto;
                transform: translateX(-50%) translateY(0);
            }
            .smg-goto-title {
                font-size: 11px;
                font-weight: 600;
                letter-spacing: .06em;
                text-transform: uppercase;
                color: rgba(255,255,255,0.55);
            }
            .smg-goto-stepper {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .smg-goto-step {
                flex: 0 0 auto;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 11px;
                border: 1px solid rgba(255,255,255,0.14);
                background: rgba(255,255,255,0.07);
                color: #fff;
                font-size: 22px;
                line-height: 1;
                cursor: pointer;
                user-select: none;
                transition: background .15s ease, border-color .15s ease, transform .12s ease;
            }
            .smg-goto-step:hover {
                background: rgba(255,255,255,0.16);
                border-color: rgba(255,255,255,0.28);
            }
            .smg-goto-step:active {
                transform: scale(0.9);
            }
            .smg-goto-input {
                width: 78px;
                height: 40px;
                padding: 0 8px;
                border-radius: 11px;
                border: 1px solid rgba(255,255,255,0.16);
                background: rgba(255,255,255,0.07);
                color: #fff;
                font-size: 19px;
                font-weight: 700;
                text-align: center;
                outline: none;
                font-variant-numeric: tabular-nums;
                -moz-appearance: textfield;
                appearance: textfield;
                transition: border-color .15s ease, background .15s ease;
            }
            /* esconde os spinners nativos (usamos os botões − / +) */
            .smg-goto-input::-webkit-outer-spin-button,
            .smg-goto-input::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
            .smg-goto-input:focus {
                border-color: rgba(255,255,255,0.45);
                background: rgba(255,255,255,0.1);
            }
            .smg-goto-max {
                font-size: 12px;
                color: rgba(255,255,255,0.5);
                white-space: nowrap;
            }
            .smg-goto-btn {
                width: 100%;
                padding: 10px 0;
                border-radius: 11px;
                border: 1px solid rgba(255,255,255,0.16);
                background: rgba(255,255,255,0.13);
                color: #fff;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: background .15s ease, border-color .15s ease, transform .12s ease;
            }
            .smg-goto-btn:hover {
                background: rgba(255,255,255,0.22);
                border-color: rgba(255,255,255,0.3);
            }
            .smg-goto-btn:active {
                transform: scale(0.98);
            }

            /* ---- search: dialog modal (command palette) + backdrop escuro ---- */
            #smg-search-overlay {
                position: fixed;
                inset: 0;
                z-index: 1000001;
                display: none;
                opacity: 0;
                background: var(--smg-scrim);
                -webkit-backdrop-filter: blur(6px) saturate(120%);
                backdrop-filter: blur(6px) saturate(120%);
                transition: opacity .2s ease;
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
                gap: 12px;
                padding: 22px 24px 24px;
                border-radius: 20px;
                background: var(--smg-s1);
                border: 1px solid rgba(255,255,255,0.12);
                box-shadow:
                    inset 0 1px 0 rgba(255,255,255,0.10),
                    0 40px 90px rgba(0,0,0,0.72);
                opacity: 0;
                transition: opacity .22s ease, transform .26s cubic-bezier(.2,.9,.3,1);
            }
            #smg-search-pop .smg-search-results,
            #smg-search-pop .smg-search-history {
                flex: 1 1 auto !important;
                min-height: 0 !important;
                max-height: calc(90vh - 160px) !important;
                overflow-y: auto !important;
                overflow-x: hidden !important;
                overscroll-behavior: contain !important;
                padding-right: 4px;
            }
            .smg-search-sentinel {
                position: relative !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 16px 0 !important;
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
                z-index: 1 !important;
            }
            .smg-search-sentinel.is-loading .smg-loading {
                display: flex !important;
            }
            .smg-search-sentinel .smg-loading::after {
                width: 22px !important;
                height: 22px !important;
                border-width: 2.5px !important;
                border-color: rgba(255,255,255,0.15) !important;
                border-top-color: var(--smg-link, #ff77b2) !important;
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
            #smg-search-pop::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 4px; }
            /* topbar: lupa + input + atalho + fechar (command palette, sem botão) */
            .smg-search-bar {
                display: flex; align-items: center; gap: 12px;
                height: 56px; padding: 0 8px 0 16px;
                border-radius: 14px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                transition: border-color .15s ease, background .15s ease;
                flex-shrink: 0 !important;
                overflow: visible !important;
            }
            .smg-search-bar:focus-within { border-color: var(--smg-link, #ff77b2); background: rgba(255,255,255,0.07); }   /* foco na cor do tema = mesmo focus da pílula da topbar */
            .smg-search-lupa { flex: 0 0 auto; display: flex; align-items: center; color: rgba(255,255,255,0.5); }
            .smg-search-lupa svg { width: 20px; height: 20px; fill: none; }
            .smg-search-input {
                flex: 1 1 auto; min-width: 0; height: 100%;
                border: none; background: transparent; outline: none;
                color: #fff; font-size: 17px; padding: 0;
            }
            .smg-search-input::placeholder { color: rgba(255,255,255,0.36); }
            .smg-search-global-toolbar {
                position: relative !important;
                z-index: 10000 !important;
                display: flex;
                flex-direction: column;
                gap: 10px;
                padding: 10px 0;
                border-bottom: 1px solid rgba(255,255,255,0.06);
                flex-shrink: 0 !important;
                min-height: fit-content !important;
                overflow: visible !important;
            }
            .smg-search-tb-row {
                display: flex;
                align-items: center;
                gap: 8px;
                width: 100%;
                flex-wrap: wrap;
                flex-shrink: 0 !important;
                overflow: visible !important;
            }
            .smg-search-tb-spacer {
                flex: 1 1 auto;
            }
            .smg-search-badges-slot {
                position: relative !important;
                z-index: 10001 !important;
                display: inline-flex;
                align-items: center;
            }
            .smg-search-tb-left, .smg-search-tb-right {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .smg-search-tb-right {
                margin-left: auto;
            }
            .smg-search-author-box {
                display: inline-flex;
                align-items: center;
                position: relative;
                height: 32px;
                padding: 0 10px;
                border-radius: 9px;
                background: rgba(255,255,255,0.06);
                border: 1px solid rgba(255,255,255,0.12);
                gap: 8px;
                box-sizing: border-box;
                transition: border-color .15s ease, background .15s ease;
            }
            .smg-search-author-box:focus-within {
                border-color: var(--smg-link, #ff77b2);
                background: rgba(255,255,255,0.09);
            }
            .smg-search-author-box.has-value {
                background: var(--smg-link-soft, rgba(255,119,178,0.18));
                border-color: var(--smg-link, #ff77b2);
            }
            .smg-search-author-ic {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 14px;
                height: 14px;
                opacity: 0.6;
                color: currentColor;
                pointer-events: none;
                flex-shrink: 0;
            }
            .smg-search-author-ic svg {
                width: 14px;
                height: 14px;
                fill: none !important;
            }
            .smg-search-author-input, .smg-search-author-inp {
                border: none;
                background: transparent;
                outline: none;
                color: #fff;
                font-size: 12.5px;
                font-weight: 600;
                font-family: inherit;
                width: 110px;
                padding: 0;
                margin: 0;
            }
            .smg-search-author-input::placeholder, .smg-search-author-inp::placeholder {
                color: rgba(255,255,255,0.4);
                font-weight: 500;
            }
            .smg-search-tb-row .smg-search-cfg, .smg-search-tb-right .smg-search-cfg {
                width: 32px;
                height: 32px;
                padding: 0;
                border-radius: 9px;
            }
            .smg-search-tb-row .smg-search-adv, .smg-search-tb-right .smg-search-adv {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                height: 32px;
                padding: 0 12px;
                border-radius: 9px;
                border: 1px solid rgba(255,255,255,0.12);
                background: rgba(255,255,255,0.05);
                color: rgba(255,255,255,0.7);
                font-size: 12px;
                font-weight: 600;
                text-decoration: none;
                cursor: pointer;
                transition: all .15s ease;
            }
            .smg-search-tb-row .smg-search-adv:hover, .smg-search-tb-right .smg-search-adv:hover {
                background: rgba(255,255,255,0.1);
                border-color: rgba(255,255,255,0.22);
                color: #fff;
            }
            .smg-search-tb-row .smg-search-adv .smg-ext-ic, .smg-search-tb-right .smg-search-adv .smg-ext-ic {
                display: inline-flex;
                align-items: center;
            }
            .smg-search-tb-row .smg-search-adv .smg-ext-ic svg, .smg-search-tb-right .smg-search-adv .smg-ext-ic svg {
                width: 12px;
                height: 12px;
                opacity: 0.7;
            }
            .smg-search-global-toolbar .smg-multiselect-btn {
                height: 32px;
                padding: 0 11px;
                font-size: 12.5px;
                border-radius: 9px;
            }
            .smg-search-tool-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                height: 32px;
                padding: 0 11px;
                border-radius: 9px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                color: rgba(255,255,255,0.85);
                font-size: 12.5px;
                font-weight: 600;
                cursor: pointer;
                transition: all .15s ease;
            }
            .smg-search-tool-btn:hover {
                background: rgba(255,255,255,0.1);
                color: #fff;
            }
            .smg-search-tool-btn.active {
                background: var(--smg-link-soft, rgba(255,119,178,0.18));
                border-color: var(--smg-link, #ff77b2);
                color: #fff;
            }
            select.smg-search-tool-btn {
                appearance: none;
                -webkit-appearance: none;
                padding-right: 22px;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.6)' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 8px center;
            }
            select.smg-search-tool-btn option {
                background: #18181b;
                color: #fff;
            }
            input.smg-search-tool-btn {
                appearance: none;
                -webkit-appearance: none;
                outline: none;
                font-family: inherit;
            }

            .smg-ios-toggle {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                user-select: none;
                padding: 4px 6px;
            }
            .smg-ios-toggle input { display: none; }
            .smg-ios-switch {
                width: 34px;
                height: 18px;
                border-radius: 999px;
                background: rgba(255,255,255,0.18);
                position: relative;
                transition: background .2s ease;
                flex-shrink: 0;
            }
            .smg-ios-switch::before {
                content: "";
                position: absolute;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: #fff;
                top: 2px;
                left: 2px;
                transition: transform .2s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            }
            .smg-ios-toggle input:checked + .smg-ios-switch {
                background: var(--smg-link, #ff77b2);
            }
            .smg-ios-toggle input:checked + .smg-ios-switch::before {
                transform: translateX(16px);
            }
            .smg-ios-label {
                font-size: 12.5px;
                font-weight: 600;
                color: rgba(255,255,255,0.8);
            }
            .smg-search-select-wrap select {
                height: 32px;
                padding: 0 10px;
                border-radius: 9px;
                background: rgba(255,255,255,0.06);
                border: 1px solid rgba(255,255,255,0.12);
                color: #fff;
                font-size: 12.5px;
                font-weight: 600;
                cursor: pointer;
                outline: none;
            }
            .smg-search-select-wrap select option {
                background: #18181b;
                color: #fff;
            }

            /* filtros: label + chips de escopo + toggle "só títulos" + autor */
            /* seções separadas com header em maiúsculas (estilo command palette) */
            .smg-search-section { display: flex; flex-direction: column; gap: 11px; }
            .smg-search-shead { font-size: 11px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: rgba(255,255,255,0.4); }
            /* "Search in" / Filters: row único com scroll horizontal (não quebra linha) */
            .smg-search-scopes, .smg-search-toggles {
                display: flex; align-items: center; gap: 8px;
                flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden;
                scrollbar-width: none; -ms-overflow-style: none; -webkit-overflow-scrolling: touch;
                margin: 0 -2px; padding: 2px;
            }
            .smg-search-scopes::-webkit-scrollbar, .smg-search-toggles::-webkit-scrollbar { display: none; }
            .smg-search-scopes .smg-chip, .smg-search-toggles .smg-chip { flex: 0 0 auto; }
            .smg-chip {
                display: inline-flex; align-items: center; gap: 7px;
                height: 40px; padding: 0 18px; box-sizing: border-box;
                border-radius: 999px; border: 1px solid rgba(255,255,255,0.1);
                background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.72);
                font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap;
                transition: background .15s ease, border-color .15s ease, color .15s ease, transform .12s ease;
            }
            .smg-chip:hover { background: rgba(255,255,255,0.08); color: #fff; }
            .smg-chip:active { transform: scale(0.96); }
            .smg-chip.active {
                background: rgba(255,255,255,0.16);
                border-color: rgba(255,255,255,0.32); color: #fff;
            }
            .smg-chip-check { display: none; align-items: center; }
            .smg-chip-check svg { width: 15px; height: 15px; fill: none; }
            .smg-chip-toggle.active .smg-chip-check { display: inline-flex; }
            .smg-search-by {
                flex: 0 0 auto; width: 100%; min-width: 0; height: 44px; padding: 0 16px; box-sizing: border-box;
                border-radius: 12px; border: 1px solid rgba(255,255,255,0.14);
                background: rgba(255,255,255,0.05); color: #fff; font-size: 14px; outline: none;
                transition: border-color .15s ease, background .15s ease;
            }
            .smg-search-by::placeholder { color: rgba(255,255,255,0.38); }
            .smg-search-by:focus { border-color: rgba(255,255,255,0.45); background: rgba(255,255,255,0.08); }
            /* toolbar de filtros (1 linha): escopo (menu) · só-títulos (switch) · autor (ícone) */
            .smg-search-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
            /* ESCOPO — botão + menu dropdown */
            .smg-search-scope { position: relative; }
            .smg-search-scope-btn {
                display: inline-flex; align-items: center; gap: 6px;
                height: 36px; padding: 0 10px 0 13px; box-sizing: border-box;
                border-radius: 10px; border: 1px solid rgba(255,255,255,0.14);
                background: rgba(255,255,255,0.05); color: #fff;
                font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap;
                transition: background .15s ease, border-color .15s ease;
            }
            .smg-search-scope-btn:hover { background: rgba(255,255,255,0.09); }
            .smg-search-scope-btn.open { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.28); }
            .smg-search-scope-chev { display: inline-flex; opacity: 0.55; transition: transform .18s ease; }
            .smg-search-scope-chev svg { width: 14px; height: 14px; fill: none; }
            .smg-search-scope-btn.open .smg-search-scope-chev { transform: rotate(180deg); }
            #smg-search-pop.smg-scope-open { overflow: visible; }   /* menu de escopo aberto → pop não corta o dropdown (overflow do scroll cortava) */
            .smg-search-scope-list {
                position: absolute; top: calc(100% + 6px); left: 0; z-index: 50;
                min-width: 180px; padding: 6px;
                display: flex; flex-direction: column; gap: 2px;
                background: var(--smg-s1); border: 1px solid rgba(255,255,255,0.14); border-radius: 12px;
                box-shadow: 0 20px 48px rgba(0,0,0,0.6);
            }
            .smg-search-scope-list[hidden] { display: none; }
            .smg-search-scope-list button {
                display: flex; align-items: center; height: 36px; padding: 0 12px;
                border: 0; border-radius: 8px; background: transparent; color: rgba(255,255,255,0.78);
                font-size: 13.5px; font-weight: 500; cursor: pointer; text-align: left; white-space: nowrap;
                transition: background .12s ease, color .12s ease;
            }
            .smg-search-scope-list button:hover { background: rgba(255,255,255,0.08); color: #fff; }
            .smg-search-scope-list button.active { background: rgba(255,255,255,0.15); color: #fff; }
            /* ORDENAR — chip-toggle relevância ⇄ data (padrão do sort da thread: mostra o critério ATUAL, clique alterna).
               Vira order=date no POST da busca (= &o=date na URL de resultados). */
            .smg-search-order-btn {
                display: inline-flex; align-items: center; gap: 7px;
                height: 36px; padding: 0 12px; box-sizing: border-box;
                border-radius: 10px; border: 1px solid rgba(255,255,255,0.14);
                background: rgba(255,255,255,0.05); color: #fff;
                font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap;
                transition: background .15s ease, border-color .15s ease;
            }
            .smg-search-order-btn:hover { background: rgba(255,255,255,0.09); }
            .smg-search-order-ic { display: inline-flex; opacity: 0.7; }
            .smg-search-order-ic svg { width: 15px; height: 15px; fill: none; }
            .smg-search-pop--drop .smg-search-toolbar { gap: 8px; }   /* dropdown (480px): toolbar ganhou o chip de ordenar → gap menor pra caber numa linha */
            /* SÓ TÍTULOS — switch */
            .smg-search-switch {
                display: inline-flex; align-items: center; gap: 9px; margin-left: auto;   /* empurra Só-títulos + autor pra DIREITA (escopo fica na esquerda) */
                height: 36px; padding: 0 4px; border: 0; background: transparent;
                color: rgba(255,255,255,0.82); font-size: 13.5px; font-weight: 600; cursor: pointer;
                transition: color .15s ease;
            }
            .smg-search-switch:hover { color: #fff; }
            .smg-search-switch-track {
                position: relative; flex: 0 0 auto; width: 38px; height: 22px; border-radius: 999px;
                background: rgba(255,255,255,0.18); transition: background .18s ease;
            }
            .smg-search-switch-thumb {
                position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%;
                background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.4);
                transition: transform .18s cubic-bezier(.3,.8,.3,1);
            }
            .smg-search-switch.on .smg-search-switch-track { background: #34c759; }
            .smg-search-switch.on .smg-search-switch-thumb { transform: translateX(16px); }
            /* AUTOR — ícone que revela o campo (.smg-search-by reusa o estilo existente) */
            .smg-search-author-btn {
                display: inline-flex; align-items: center; justify-content: center;
                width: 36px; height: 36px; box-sizing: border-box;
                border-radius: 10px; border: 1px solid rgba(255,255,255,0.14);
                background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.72); cursor: pointer;
                transition: background .15s ease, color .15s ease, border-color .15s ease;
            }
            .smg-search-author-btn:hover { background: rgba(255,255,255,0.09); color: #fff; }
            .smg-search-author-btn.open { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.28); color: #fff; }
            .smg-search-author-btn.has-value { background: #fff; color: #141414; border-color: #fff; }
            .smg-search-author-btn svg { width: 17px; height: 17px; fill: none; }
            .smg-search-author-wrap[hidden] { display: none; }
            /* footer: busca avançada (esq) · dica · botão Buscar primário (branco) */
            .smg-search-foot {
                display: flex; align-items: center; gap: 12px;
                margin-top: 2px; padding-top: 16px; border-top: 1px solid var(--smg-bd);
                flex-shrink: 0 !important;
                overflow: visible !important;
            }
            /* AÇÕES DA BARRA — ⇥ (comandos) · funil (avançada) · sliders (defaults) · esc · × têm UM desenho só:
               30px, raio 9, mesma borda/fundo/hover. Antes cada um tinha altura, raio e borda próprios (24/30/36px). */
            .smg-search-acts { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 4px; }
            .smg-search-acts .smg-search-sep { width: 1px; height: 20px; margin: 0 2px; background: rgba(255,255,255,0.12); }
            .smg-search-cmdbtn, .smg-search-adv, .smg-search-cfg, .smg-search-close, .smg-search-kbd {
                flex: 0 0 auto; box-sizing: border-box;
                display: inline-flex; align-items: center; justify-content: center;
                min-width: 30px; height: 30px; padding: 0 7px; margin: 0;
                border-radius: 9px; border: 1px solid rgba(255,255,255,0.12);
                background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.55);
                font: 600 13px/1 -apple-system, system-ui, sans-serif; text-decoration: none; cursor: pointer;
                transition: background .14s ease, color .14s ease, border-color .14s ease, transform .12s ease;
            }
            .smg-search-cmdbtn:hover, .smg-search-adv:hover, .smg-search-cfg:hover, .smg-search-close:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.24); color: #fff; }
            .smg-search-cmdbtn:active, .smg-search-adv:active, .smg-search-cfg:active, .smg-search-close:active { transform: scale(0.93); }
            .smg-search-cmdbtn.open, .smg-search-cfg.open { background: var(--smg-link-soft, rgba(255,119,178,0.18)); border-color: var(--smg-link, #ff77b2); color: var(--smg-link, #ff77b2); }
            .smg-search-adv svg, .smg-search-cfg svg, .smg-search-close svg { width: 16px; height: 16px; fill: none !important; }
            .smg-search-kbd { cursor: default; font: 600 11.5px/1 ui-monospace, SFMono-Regular, Menlo, monospace; color: rgba(255,255,255,0.4); }
            .smg-search-foot { display: none; }   /* rodapé (botão "Search") removido: digitar já busca (debounce) + "See all results" + Enter; o botão é redundante. Desktop já escondia; agora some no mobile tb. */
            .smg-search-hint { font-size: 12.5px; color: rgba(255,255,255,0.4); white-space: nowrap; margin-right: auto; }
            .smg-search-go {
                flex: 0 0 auto; display: inline-flex; align-items: center; gap: 7px;
                height: 42px; padding: 0 18px; box-sizing: border-box;
                border-radius: 12px; border: none;
                background: #fff; color: #141414;
                font-size: 14px; font-weight: 700; cursor: pointer;
                transition: filter .15s ease, transform .12s ease;
            }
            .smg-search-go-ic { display: inline-flex; }
            .smg-search-go-ic svg { width: 17px; height: 17px; fill: none; stroke-width: 2.4; }
            .smg-search-go:hover { filter: brightness(0.9); }
            .smg-search-go:active { transform: scale(0.97); }

            /* ---- painel de busca INLINE na página de RESULTADOS (search_results): input pra edição
               rápida da query + filtros (escopo · ordenar · só-títulos · autor) direto no header.
               Reusa os componentes do dialog (.smg-search-bar/-toolbar/-scope/-switch/-author).
               Largura TOTAL do conteúdo (alinha com a lista de resultados abaixo). ---- */
            #smg-rs-panel { display: flex; flex-direction: column; gap: 10px; margin: 14px 0 2px; }
            #smg-rs-panel .smg-search-bar { height: 50px; }
            #smg-rs-panel .smg-search-toolbar {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 8px;
            }
            #smg-rs-panel .smg-multiselect-btn {
                height: 32px;
                padding: 0 10px;
                font-size: 12.5px;
                border-radius: 9px;
            }
            @media (max-width: 600px) {
                #smg-rs-panel { margin-top: 10px; }
                #smg-rs-panel .smg-search-bar { height: 48px; }
            }

            /* ===== página de RESULTADOS da busca: lista nativa re-tematizada (cards no padrão do tema) =====
               Os .contentRow do XF (avatar · título · snippet · meta) seguem server-render — só a CASCA muda:
               o painelão nativo (.block-container) vira transparente e cada linha vira um card --smg-s1,
               mesma linguagem dos cards do resto do script. Vale pro scroll infinito (CSS pega as linhas novas).
               Seletores ancorados em .block-row → vencem as regras genéricas de .contentRow do smg-threadlist
               (que vêm DEPOIS na folha) por especificidade, não por ordem. */
            html.smg-search-page .p-body-pageContent .block .block-container { background: transparent !important; border: 0 !important; box-shadow: none !important; border-radius: 0 !important; overflow: visible !important; }
            html.smg-search-page .p-body-pageContent .block .block-body { display: flex; flex-direction: column; gap: 10px; padding: 0 !important; background: transparent !important; border: 0 !important; }
            html.smg-search-page .block-row.block-row--separated {
                margin: 0 !important; padding: 15px 18px !important;
                background: var(--smg-s1) !important; border: 1px solid var(--smg-bd) !important; border-radius: 14px !important;
                transition: border-color .14s ease, box-shadow .14s ease;
            }
            html.smg-smg.smg-search-page .block-row.block-row--separated { --smg-s1: hsl(0 0% 12.5%); }   /* SMG: mesma superfície dos cards de post (.smg-pc) */
            html.smg-search-page .block-row.block-row--separated:hover { border-color: var(--smg-bd2) !important; box-shadow: 0 6px 18px rgba(0,0,0,0.3); }
            html.smg-search-page .block-row .contentRow { align-items: flex-start !important; gap: 13px !important; }
            html.smg-search-page .block-row .contentRow-figure { flex: 0 0 auto; }
            html.smg-search-page .block-row .contentRow-main { min-width: 0 !important; }
            /* título: branco + bold; o termo buscado (em.textHighlight) ganha o ACENTO do tema */
            html.smg-search-page .block-row .contentRow-title { font-size: 15.5px !important; font-weight: 700 !important; line-height: 1.35 !important; margin: 1px 0 3px !important; }
            html.smg-search-page .block-row .contentRow-title a { color: #fff !important; text-decoration: none !important; }
            html.smg-search-page .block-row .contentRow-title a:hover { color: var(--smg-link, #ff77b2) !important; }
            html.smg-search-page .block-row .textHighlight { color: var(--smg-link, #ff77b2) !important; font-style: normal !important; background: none !important; }
            /* snippet: no máx 2 linhas, texto suave (URL crua não estoura o card) */
            html.smg-search-page .block-row .contentRow-snippet {
                font-size: 13px !important; line-height: 1.5 !important; color: rgba(255,255,255,0.62) !important;
                display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word;
                margin: 0 0 7px !important;
            }
            /* meta (autor · nº do post · data · fórum/tópico): discreto, links sutis */
            html.smg-search-page .block-row .contentRow-minor { font-size: 12px !important; color: rgba(255,255,255,0.42) !important; margin-top: 5px !important; }
            html.smg-search-page .block-row .contentRow-minor a { color: rgba(255,255,255,0.62) !important; text-decoration: none !important; }
            html.smg-search-page .block-row .contentRow-minor a:hover { color: #fff !important; text-decoration: underline !important; }
            html.smg-search-page .block-row .contentRow-minor time { color: rgba(255,255,255,0.55); }
            html.smg-search-page .block-row .contentRow-minor .tagItem { font-size: 10.5px !important; padding: 2px 7px !important; border-radius: 5px !important; }
            @media (max-width: 600px) {
                html.smg-search-page .block-row.block-row--separated { padding: 12px 13px !important; border-radius: 12px !important; }
                html.smg-search-page .block-row .contentRow { gap: 10px !important; }
            }

            /* ===== página de BUSCA AVANÇADA (search_form): form nativo re-tematizado =====
               Só a CASCA muda (CSS) — os widgets do XF (tagify, autocomplete, datas, abas, sticky submit)
               seguem 100% nativos, sem JS nosso. Card único, labels EMPILHADOS (acima do campo, como nos
               nossos sheets), abas com sublinhado-accent (linguagem das abas da home), inputs no padrão. */
            html.smg-search-form form.block { color-scheme: dark; }   /* date picker/ícones nativos em claro */
            html.smg-search-form form.block .block-container {
                background: var(--smg-s1) !important; border: 1px solid var(--smg-bd) !important;
                border-radius: 18px !important; box-shadow: none !important; overflow: hidden;
            }
            html.smg-smg.smg-search-form form.block .block-container { --smg-s1: hsl(0 0% 12.5%); --smg-s2: hsl(0 0% 16%); --smg-s3: hsl(0 0% 21%); }   /* mesma superfície dos cards (.smg-pc) */
            /* abas (Search everything / threads / …): texto neutro + sublinhado-accent no ativo */
            html.smg-search-form .block-tabHeader {
                margin: 0 !important; padding: 4px 12px 0 !important;
                background: transparent !important; border: 0 !important; border-bottom: 1px solid var(--smg-bd) !important; box-shadow: none !important;
            }
            html.smg-search-form .block-tabHeader .hScroller-action { display: none !important; }   /* setas com gradiente do tema destoam do card; as abas rolam por swipe/scroll */
            html.smg-search-form .block-tabHeader .tabs-tab {
                position: relative; display: inline-flex; align-items: center; height: 48px; padding: 0 13px;
                background: transparent !important; border: 0 !important; box-shadow: none !important;
                color: rgba(255,255,255,0.55) !important; font-size: 14px !important; font-weight: 600 !important;
                text-decoration: none !important; white-space: nowrap; transition: color .15s ease;
            }
            html.smg-search-form .block-tabHeader .tabs-tab:hover { color: #fff !important; }
            html.smg-search-form .block-tabHeader .tabs-tab.is-active { color: #fff !important; font-weight: 700 !important; }
            html.smg-search-form .block-tabHeader .tabs-tab::before { content: none !important; }
            html.smg-search-form .block-tabHeader .tabs-tab::after {   /* substitui QUALQUER indicador nativo pelo nosso sublinhado */
                content: "" !important; position: absolute; left: 11px; right: 11px; bottom: -1px; height: 2.5px;
                border-radius: 3px 3px 0 0; background: var(--smg-link, #ff77b2); border: 0 !important; box-shadow: none !important;
                transform: scaleX(0); transition: transform .2s ease;
            }
            html.smg-search-form .block-tabHeader .tabs-tab.is-active::after { transform: scaleX(1); }
            /* corpo: form na LARGURA TOTAL do conteúdo — GRID de 2 colunas no desktop (Keywords, a 1ª
               row, atravessa as duas = campo principal); 1 coluna no estreito. Vale pra qualquer aba
               (threads/profile/DMs): a 1ª row é sempre Keywords e o resto flui no grid. */
            html.smg-search-form form.block .block-body {
                display: grid; grid-template-columns: 1fr; gap: 20px;
                padding: 22px 24px 24px !important; background: transparent !important; border: 0 !important;
            }
            @media (min-width: 901px) {
                html.smg-search-form form.block .block-body { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px 40px; padding: 26px 30px 28px !important; }
                html.smg-search-form form.block .block-body > .formRow:first-child { grid-column: 1 / -1; }
            }
            html.smg-search-form form.block .block-body > .formRow {
                display: flex !important; flex-direction: column !important; gap: 8px;
                margin: 0 !important; padding: 0 !important; border: 0 !important; background: transparent !important;
            }
            html.smg-search-form form.block .block-body > .formRow > dt {
                display: block !important; width: auto !important; max-width: none !important;
                padding: 0 !important; margin: 0 !important; text-align: left !important; border: 0 !important; background: transparent !important;
            }
            html.smg-search-form form.block .formRow-labelWrapper { padding: 0 !important; margin: 0 !important; }
            html.smg-search-form form.block .formRow-label { font-size: 11.5px !important; font-weight: 700 !important; letter-spacing: .07em; text-transform: uppercase; color: rgba(255,255,255,0.5) !important; }
            html.smg-search-form form.block .block-body > .formRow > dd { display: block !important; width: auto !important; padding: 0 !important; margin: 0 !important; border: 0 !important; background: transparent !important; }
            html.smg-search-form form.block .formRow-explain { font-size: 12px !important; color: rgba(255,255,255,0.4) !important; margin-top: 6px !important; }
            /* inputs (texto, busca, data, select, tagify — todos têm .input) no padrão do tema */
            html.smg-search-form form.block .input {
                min-height: 44px; padding: 9px 14px; box-sizing: border-box;
                background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.14) !important;
                border-radius: 11px !important; color: #fff !important; font-size: 14.5px !important; box-shadow: none !important;
            }
            html.smg-search-form form.block .input:focus, html.smg-search-form form.block .input:focus-within {
                border-color: var(--smg-link, #ff77b2) !important; background: rgba(255,255,255,0.07) !important; outline: none !important;
            }
            html.smg-search-form form.block select.input option { background: #1b1c20; color: #fff; }
            /* tagify (Tags / Without tags): chips no padrão (o tile do chip nativo vem de um ::before com box-shadow) */
            html.smg-search-form form.block .tagify__input { color: #fff; }
            html.smg-search-form form.block .tagify__tag > div::before { box-shadow: none !important; background: var(--smg-s3) !important; border-radius: 7px; }
            html.smg-search-form form.block .tagify__tag-text { color: #fff !important; }
            /* datas (Newer/Older than): linha flex limpa, rótulo do meio vira label pequeno */
            html.smg-search-form form.block .inputGroup { display: flex !important; align-items: center; gap: 10px; flex-wrap: wrap; }
            html.smg-search-form form.block .inputGroup .input--date { flex: 0 1 190px; width: auto !important; }
            html.smg-search-form form.block .inputGroup-text {
                display: inline-flex; padding: 0 !important; background: transparent !important; border: 0 !important; box-shadow: none !important;
                color: rgba(255,255,255,0.5) !important; font-size: 11.5px !important; font-weight: 700 !important; letter-spacing: .07em; text-transform: uppercase;
            }
            html.smg-search-form form.block .inputGroup-splitter { display: none !important; }
            /* lista do campo Keywords (input + 2 checkboxes) com respiro */
            html.smg-search-form form.block .inputList { display: flex; flex-direction: column; gap: 11px; margin: 0 !important; }
            html.smg-search-form form.block .inputList > li { margin: 0 !important; }
            /* checkboxes/radios (.iconic): caixinha própria + ACENTO quando marcado (o glifo nativo do XF é mantido) */
            html.smg-search-form form.block label.iconic {
                display: inline-flex !important; align-items: center; gap: 9px; padding: 0 !important; margin: 0 !important;
                color: rgba(255,255,255,0.78) !important; font-size: 13.5px !important; cursor: pointer;
            }
            html.smg-search-form form.block label.iconic > i {
                position: static !important; flex: 0 0 auto; width: 19px; height: 19px; margin: 0 !important; box-sizing: border-box;
                display: inline-flex !important; align-items: center; justify-content: center;
                border: 1px solid rgba(255,255,255,0.24) !important; border-radius: 6px !important;
                background: rgba(255,255,255,0.05) !important; box-shadow: none !important;
                transition: background .14s ease, border-color .14s ease;
            }
            html.smg-search-form form.block label.iconic--radio > i { border-radius: 50% !important; }
            html.smg-search-form form.block label.iconic > i::after { position: static !important; margin: 0 !important; font-size: 11px !important; line-height: 1 !important; }
            html.smg-search-form form.block label.iconic input:checked + i { background: var(--smg-link-strong, #d14d8f) !important; border-color: var(--smg-link-strong, #d14d8f) !important; }
            html.smg-search-form form.block label.iconic input:checked + i::after { color: #fff !important; }
            /* Order by (Relevance/Date): radios na HORIZONTAL */
            html.smg-search-form form.block .inputChoices { display: flex !important; flex-wrap: wrap; gap: 8px 22px; margin: 0 !important; padding: 0 !important; }
            html.smg-search-form form.block .inputChoices-choice { margin: 0 !important; padding: 0 !important; }
            /* rodapé (sticky submit): faixa integrada ao card + botão Search no acento, à direita */
            html.smg-search-form form.block .formSubmitRow { display: block !important; margin: 0 !important; border: 0 !important; }
            html.smg-search-form form.block .formSubmitRow > dt { display: none !important; }
            html.smg-search-form form.block .formSubmitRow > dd { display: block !important; padding: 0 !important; margin: 0 !important; }
            html.smg-search-form form.block .formSubmitRow-bar { background: var(--smg-s1) !important; border-top: 1px solid var(--smg-bd) !important; box-shadow: none !important; }
            html.smg-smg.smg-search-form form.block .formSubmitRow-bar { background: hsl(0 0% 12.5%) !important; }
            html.smg-search-form form.block .formSubmitRow-controls { display: flex; justify-content: flex-end; padding: 12px 24px !important; }
            html.smg-search-form form.block .formSubmitRow .button--primary {
                display: inline-flex !important; align-items: center; gap: 8px; height: 44px; padding: 0 24px !important;
                border: 0 !important; border-radius: 11px !important; box-shadow: none !important;
                background: var(--smg-link-strong, #d14d8f) !important; color: #fff !important;
                font-size: 14px !important; font-weight: 700 !important;
                transition: filter .14s ease, transform .12s ease;
            }
            html.smg-search-form form.block .formSubmitRow .button--primary:hover { filter: brightness(1.1); }
            html.smg-search-form form.block .formSubmitRow .button--primary:active { transform: scale(0.97); }
            @media (max-width: 600px) {
                html.smg-search-form form.block .block-body { padding: 16px 15px 18px !important; gap: 18px; }
                html.smg-search-form .block-tabHeader { padding: 2px 6px 0 !important; }
                html.smg-search-form .block-tabHeader .tabs-tab { height: 44px; padding: 0 10px; font-size: 13px !important; }
                html.smg-search-form form.block .formSubmitRow-controls { padding: 12px 15px !important; }
                html.smg-search-form form.block .formSubmitRow .button--primary { flex: 1 1 auto; justify-content: center; }   /* botão full-width (alvo de toque) */
            }

            /* ---- search em modo DROPDOWN (desktop): ancorado abaixo do input REAL da topbar, sem backdrop escuro ---- */
            #smg-search-overlay.smg-search-overlay--drop {
                background: transparent; -webkit-backdrop-filter: none; backdrop-filter: none; pointer-events: none;   /* não bloqueia a página nem o input da topbar */
            }
            #smg-search-pop.smg-search-pop--drop {
                position: fixed; transform: none; margin: 0;   /* top/left/width vêm inline do JS (ancorado ao input) */
                width: 480px; max-width: calc(100vw - 16px); max-height: min(85vh, 760px);
                padding: 16px 18px 0; gap: 14px; border-radius: 16px;   /* sem padding-bottom: o footer "Ver todos" cola no fundo (sticky) */
                pointer-events: auto;
            }
            #smg-search-overlay.open #smg-search-pop.smg-search-pop--drop { transform: none; }   /* sem o scale do modal; só o fade de opacity */
            .smg-search-pop--drop .smg-search-bar { display: none; }   /* no dropdown o input fica na topbar, não no pop */
            .smg-search-pop--drop .smg-search-go { display: none; }    /* o Buscar foi pro input da topbar (sobra Avançado + dica no rodapé) */

            /* histórico de buscas */
            .smg-search-history { display: flex; flex-direction: column; gap: 6px; padding-top: 2px; }
            .smg-search-history[hidden] { display: none !important; margin: 0 !important; padding: 0 !important; height: 0 !important; }
            /* estado vazio (sem histórico): evita o dropdown virar um toco só com a toolbar */
            .smg-search-empty { display: flex; flex-direction: column; align-items: center; gap: 7px; padding: 30px 16px 34px; text-align: center; }
            .smg-search-empty[hidden] { display: none; }
            .smg-search-empty-ic { display: flex; align-items: center; justify-content: center; width: 46px; height: 46px; border-radius: 14px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); margin-bottom: 2px; }
            .smg-search-empty-ic svg { width: 22px; height: 22px; fill: none; }
            .smg-search-empty-t { font-size: 14.5px; font-weight: 600; color: rgba(255,255,255,0.72); }
            .smg-search-empty-s { font-size: 12.5px; color: rgba(255,255,255,0.4); }
            .smg-search-empty-hint { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; margin-top: 12px; }
            .smg-search-empty-hint code { padding: 3px 8px; border-radius: 6px; background: rgba(255,255,255,0.07); color: var(--smg-link, #ff77b2); font: 600 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; }
            .smg-search-hist-head { display: flex; align-items: center; gap: 7px; margin-bottom: 4px; }
            .smg-search-hist-title { font-size: 11px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: rgba(255,255,255,0.4); }
            .smg-search-hist-badge { padding: 1px 7px; border-radius: 999px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); font-size: 11px; font-weight: 700; font-variant-numeric: tabular-nums; }
            .smg-search-hist-clear {
                margin-left: auto; padding: 5px 10px; border-radius: 8px; border: none;
                background: transparent; color: rgba(255,255,255,0.55); font-size: 12px; font-weight: 600; cursor: pointer;
                transition: background .15s ease, color .15s ease;
            }
            .smg-search-hist-clear:hover { background: rgba(255,255,255,0.08); color: #fff; }
            .smg-search-hist-list { display: flex; flex-direction: column; gap: 1px; }
            .smg-search-hist-item {
                display: flex; align-items: center; gap: 12px; width: 100%;
                padding: 8px 10px; border-radius: 11px; border: none; cursor: pointer; text-align: left;
                background: transparent; color: #fff; transition: background .12s ease;
            }
            .smg-search-hist-item:hover { background: rgba(255,255,255,0.07); }
            .smg-search-hist-ico {
                flex: 0 0 auto; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
                border-radius: 9px; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.55);
            }
            .smg-search-hist-ico svg { width: 16px; height: 16px; fill: none; }
            .smg-search-hist-q { flex: 1 1 auto; min-width: 0; font-size: 14px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .smg-search-hist-meta { flex: 0 0 auto; font-size: 11.5px; color: rgba(255,255,255,0.4); white-space: nowrap; }
            .smg-search-hist-remove {
                flex: 0 0 auto; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
                border-radius: 7px; border: none; background: transparent; color: rgba(255,255,255,0.4); cursor: pointer;
                opacity: 0; transition: opacity .12s ease, background .12s ease, color .12s ease;
            }
            .smg-search-hist-item:hover .smg-search-hist-remove { opacity: 1; }
            .smg-search-hist-remove:hover { background: rgba(255,255,255,0.14); color: #fff; }
            .smg-search-hist-remove svg { width: 14px; height: 14px; fill: none; }
            /* ações por linha do histórico: ↖ mandar pra barra · ↗ abrir no outro fórum · × remover (aparecem no hover da linha) */
            .smg-search-hist-acts { flex: 0 0 auto; display: flex; align-items: center; gap: 2px; }
            .smg-search-hist-act {
                flex: 0 0 auto; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
                border-radius: 7px; border: none; background: transparent; color: rgba(255,255,255,0.4); cursor: pointer;
                opacity: 0; transition: opacity .12s ease, background .12s ease, color .12s ease;
            }
            .smg-search-hist-item:hover .smg-search-hist-act { opacity: 1; }
            .smg-search-hist-act:hover { background: rgba(255,255,255,0.14); color: #fff; }
            .smg-search-hist-act svg { width: 14px; height: 14px; fill: none; }
            /* resultados da busca INLINE (mostrados no próprio dropdown) */
            .smg-search-results { display: flex; flex-direction: column; gap: 2px; }
            .smg-search-rloading { display: flex; align-items: center; justify-content: center; padding: 28px 0; }
            .smg-search-noresults { padding: 18px 4px; text-align: center; font-size: 13.5px; color: rgba(255,255,255,0.45); }
            .smg-search-result {
                display: flex; flex-direction: row; align-items: flex-start; gap: 11px;
                padding: 9px 11px; border-radius: 11px; text-decoration: none; color: #fff;
                transition: background .12s ease;
            }
            .smg-search-result:hover { background: rgba(255,255,255,0.08); }
            /* mata o underline FEIO do hover: o XF tem a:hover{text-decoration:underline} global → vazava na linha
               inteira do resultado E nos itens da nav central (Timeline/Following também são <a>). Escopado aos 2 containers. */
            #smg-topbar-wrap a, #smg-topbar-wrap a:hover, #smg-topbar-wrap a:focus,
            #smg-search-pop a, #smg-search-pop a:hover, #smg-search-pop a:focus { text-decoration: none !important; }
            .smg-search-result-fig { flex: 0 0 auto; width: 110px; height: 74px; border-radius: 9px; overflow: hidden; background: rgba(255,255,255,0.06); }
            .smg-search-result-fig img { width: 100% !important; height: 100% !important; object-fit: cover; display: block; transition: transform .3s cubic-bezier(.2,.7,.3,1); }
            .smg-search-result:hover .smg-search-result-fig img { transform: scale(1.06); }   /* zoom sutil da thumb no hover (igual aos cards da home) */
            .smg-search-result-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
            .smg-search-result-titlerow { display: flex; align-items: center; gap: 6px; min-width: 0; flex-wrap: wrap; }
            .smg-search-result-title { font-size: 15.5px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
            .smg-search-result-snippet { font-size: 14px; line-height: 1.45; color: rgba(255,255,255,0.72); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            .smg-search-result-meta { font-size: 12.5px; color: rgba(255,255,255,0.42); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            /* highlight do termo buscado (title + snippet) */
            .smg-search-result mark.smg-search-hl { background: rgba(255,205,70,0.30); color: #fff; border-radius: 3px; padding: 0 1px; font-weight: 700; }
            /* "Ver todos" = FOOTER FIXO (sticky no fundo do dropdown; resultados rolam atrás) */
            .smg-search-result-all {
                position: sticky; bottom: 0; z-index: 3;
                display: flex; align-items: center; justify-content: center; gap: 7px;
                margin: 6px -18px 0; padding: 13px 18px;
                background: var(--smg-s1); border-top: 1px solid var(--smg-bd);
                font-size: 13px; font-weight: 700; text-decoration: none; color: rgba(255,255,255,0.82);
                transition: color .14s ease, gap .14s ease;
            }
            .smg-search-result-all:hover { color: #fff; gap: 11px; }
            .smg-search-result-all svg { width: 15px; height: 15px; fill: none; }
            .smg-search-pop--drop .smg-search-history { padding-bottom: 12px; }   /* sem footer (mostrando histórico) → respiro no fundo */
            /* lista SEMPRE scrollável (substituiu o "Show all" e a paginação ‹ ›) — chunks renderizam conforme rola */
            .smg-search-hist-list--scroll {
                max-height: min(46vh, 340px); overflow-y: auto;
                overflow-x: hidden !important; width: 100%; box-sizing: border-box;
                overscroll-behavior: contain;   /* o fim da lista não rola a página/pop por trás */
                padding-right: 4px;
            }
            .smg-search-hist-list--scroll::-webkit-scrollbar { width: 8px; }
            .smg-search-hist-list--scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 4px; }

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

            /* ---- modo feed (tiktok) ---- */
            #smg-feed {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100vh;
                z-index: 2147483601;
                display: none;
                background: #000;
            }
            #smg-feed.open { display: block; }

            /* aviso único: galeria/feed têm navegação própria. z-index ACIMA do feed/galeria (scrim cobre tudo). */
            #smg-navnotice { position: fixed; inset: 0; z-index: 2147483646; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(0,0,0,0.62); -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); }
            .smg-navnotice-card { max-width: 420px; width: 100%; background: var(--smg-s1); border: 1px solid var(--smg-bd); border-radius: 16px; padding: 22px 22px 18px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
            .smg-navnotice-title { font-size: 17px; font-weight: 700; color: rgba(255,255,255,0.95); margin: 0 0 9px; }
            .smg-navnotice-text { font-size: 14px; line-height: 1.5; color: rgba(255,255,255,0.62); margin: 0 0 18px; }
            .smg-navnotice-ok { display: block; width: 100%; padding: 11px; border: 0; border-radius: 10px; background: var(--smg-link, #ff77b2); color: #fff; font-size: 14px; font-weight: 650; cursor: pointer; }
            .smg-navnotice-ok:hover { filter: brightness(1.06); }
            .smg-feed-track {
                height: 100%;
                width: 100%;
                overflow: hidden;
                position: relative;
                touch-action: none;
            }
            .smg-feed-reel {
                display: flex;
                flex-direction: column;
                will-change: transform;
            }
            .smg-feed-slide {
                height: 100vh;
                width: 100%;
                flex: 0 0 auto;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .smg-feed-media {
                max-width: 100vw;
                max-height: 100vh;
                object-fit: contain;
                user-select: none;
                -webkit-user-drag: none;
                cursor: zoom-in;
            }
            .smg-feed-media.smg-zoomed { cursor: grab; }
            .smg-feed-media.smg-grabbing { cursor: grabbing; }
            .smg-feed-embed {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .smg-feed-embed iframe {
                width: 95vw;
                max-width: 95vw;
                aspect-ratio: 16 / 9;
                max-height: 95vh;
                border: 0;
                border-radius: 8px;
                background: #000;
                pointer-events: none; /* deixa wheel/touch passarem pro feed (senão o iframe engole o scroll) */
            }
            .smg-feed-embed.is-live iframe { pointer-events: auto; } /* tap/click libera os controles do player */
            /* redgifs no feed = nosso <video> (mesmo padrão de pointer-events do iframe) */
            .smg-feed-embed .smg-rg {
                height: 90vh !important;
                width: auto !important;
                max-width: 95vw !important;
                max-height: 90vh !important;
                margin: 0 !important;
                pointer-events: none;
            }
            .smg-feed-embed.is-live .smg-rg { pointer-events: auto; }
            /* no feed, os CONTROLES sempre clicáveis (mesmo sem is-live) — senão os botões não funcionam lá */
            .smg-feed-embed .smg-rgc-bottom, .smg-feed-embed .smg-rgc-flash button, .smg-feed-embed .smg-rgc-src { pointer-events: auto; }
            .smg-feed-embed .smg-rgc-over { display: none; }   /* no feed já é o visualizador → esconde o botão "abrir no visualizador" */
            /* no feed o player enche a caixa de 90vh (sizing por ALTURA) — sobrepõe o height:auto/max-height do inline */
            .smg-feed-embed .smg-rg-v { height: 100% !important; max-height: none !important; }
            .smg-feed-empty {
                color: rgba(255,255,255,0.6);
                font-size: 16px;
            }
            .smg-feed-nav {
                position: absolute;
                right: 18px;
                z-index: 5;
                width: 48px;
                height: 48px;
                font-size: 22px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                cursor: pointer;
                color: #fff;
                border: 1px solid rgba(255,255,255,0.15);
                background: rgba(20,20,24,0.82);   /* PERF: era backdrop-filter blur(6px) (repintava a cada frame de scroll do reel) — sólido semi-opaco fica visualmente igual sobre mídia escura */
                transition: background .15s ease, transform .12s ease;
            }
            .smg-feed-nav:hover { background: rgba(42,42,50,0.85); }
            .smg-feed-nav:active { transform: scale(0.9); }
            .smg-feed-nav svg { width: 1em; height: 1em; display: block; }
            .smg-feed-prev { top: calc(50% - 56px); }
            .smg-feed-next { top: calc(50% + 8px); }
            .smg-feed-close {
                position: absolute;
                top: 16px;
                right: 18px;
                z-index: 5;
                width: 54px;
                height: 54px;
                font-size: 27px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                cursor: pointer;
                color: #fff;
                border: 1px solid rgba(255,255,255,0.15);
                background: rgba(20,20,24,0.82);   /* PERF: era backdrop-filter blur(6px) (repintava a cada frame de scroll do reel) — sólido semi-opaco fica visualmente igual sobre mídia escura */
                transition: background .15s ease, transform .12s ease;
            }
            .smg-feed-close:hover { background: rgba(42,42,50,0.85); }
            .smg-feed-close:active { transform: scale(0.92); }
            .smg-feed-close svg { width: 1em; height: 1em; display: block; }
            .smg-feed-counter {
                position: absolute;
                top: 20px;
                left: 18px;
                z-index: 5;
                padding: 6px 14px;
                border-radius: 999px;
                background: rgba(20,20,24,0.82);   /* PERF: sem backdrop-filter (repintava no scroll do reel) */
                border: 1px solid rgba(255,255,255,0.12);
                color: #fff;
                font-size: 13px;
                font-weight: 600;
            }

            /* ---- mobile: a dock vira uma navbar full-width colada embaixo ---- */
            @media (max-width: 600px) {
                .smg-dock-thread-bar { display: flex !important; }
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
                #smg-search-pop .smg-search-bar {
                    height: auto !important;
                    min-height: 48px;
                    flex-wrap: wrap !important;
                    padding: 8px 10px;
                    gap: 8px;
                    border-radius: 13px;
                }
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
                .smg-dock-thread-bar {
                    display: flex !important;
                    flex-direction: row !important;
                    width: 100% !important;
                    height: 40px !important;
                    align-items: center !important;
                    justify-content: space-around !important;
                    padding: 0 4px !important;
                    box-sizing: border-box !important;
                    border-bottom: 1px solid rgba(255,255,255,0.06) !important;
                    background: rgba(255,255,255,0.025) !important;
                    gap: 2px !important;
                }
                .smg-dock-thread-bar .smg-nav-btn {
                    flex: 1 1 0 !important;
                    height: 34px !important;
                    min-height: 34px !important;
                    max-height: 34px !important;
                    width: auto !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    background: transparent !important;
                    border: none !important;
                    border-radius: 8px !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    box-shadow: none !important;
                    vertical-align: middle !important;
                }
                .smg-dock-thread-bar .smg-nav-btn .smg-nav-ico {
                    font-size: 18px !important;
                    line-height: 1 !important;
                    height: 18px !important;
                    width: 18px !important;
                    color: rgba(255,255,255,0.8) !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                .smg-dock-thread-bar .smg-nav-btn .smg-nav-ico svg {
                    width: 18px !important;
                    height: 18px !important;
                    stroke-width: 1.9 !important;
                    display: block !important;
                    margin: 0 auto !important;
                }

                /* Botão de Ordenação (Data / Reações / etc.) no Mobile - Flat Text + Icon */
                .smg-dock-thread-bar #smg-post-sort-toggle,
                .smg-dock-thread-bar #smg-list-sort-m,
                .smg-dock-thread-bar .smg-sort-pill {
                    flex: 1.2 1 0 !important;
                    height: 34px !important;
                    min-height: 34px !important;
                    max-height: 34px !important;
                    align-self: center !important;
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    padding: 0 !important;
                    gap: 4px !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                .smg-dock-thread-bar #smg-post-sort-toggle .smg-nav-ico svg,
                .smg-dock-thread-bar #smg-list-sort-m .smg-nav-ico svg,
                .smg-dock-thread-bar .smg-sort-pill .smg-nav-ico svg {
                    width: 14px !important;
                    height: 14px !important;
                }
                .smg-dock-thread-bar #smg-post-sort-toggle .smg-nav-btn-text,
                .smg-dock-thread-bar #smg-list-sort-m .smg-nav-btn-text,
                .smg-dock-thread-bar .smg-sort-pill .smg-nav-btn-text {
                    display: inline-block !important;
                    font-size: 12px !important;
                    font-weight: 700 !important;
                    color: rgba(255,255,255,0.85) !important;
                    line-height: 1 !important;
                }
                .smg-dock-thread-bar #smg-post-sort-toggle.smg-active,
                .smg-dock-thread-bar #smg-list-sort-m.smg-active,
                .smg-dock-thread-bar .smg-sort-pill.smg-active {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                }
                .smg-dock-thread-bar #smg-post-sort-toggle.smg-active .smg-nav-ico,
                .smg-dock-thread-bar #smg-post-sort-toggle.smg-active .smg-nav-btn-text,
                .smg-dock-thread-bar #smg-list-sort-m.smg-active .smg-nav-ico,
                .smg-dock-thread-bar #smg-list-sort-m.smg-active .smg-nav-btn-text,
                .smg-dock-thread-bar .smg-sort-pill.smg-active .smg-nav-ico,
                .smg-dock-thread-bar .smg-sort-pill.smg-active .smg-nav-btn-text {
                    color: var(--smg-link, #ff77b2) !important;
                }

                /* Botão de Paginação Mobile - Flat Text + Icon */
                .smg-dock-thread-bar #smg-mobile-page-btn {
                    flex: 1.25 1 0 !important;
                    height: 34px !important;
                    min-height: 34px !important;
                    max-height: 34px !important;
                    align-self: center !important;
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    padding: 0 !important;
                    gap: 4px !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                .smg-dock-thread-bar #smg-mobile-page-btn .smg-nav-ico svg {
                    width: 14px !important;
                    height: 14px !important;
                }
                .smg-dock-thread-bar #smg-mobile-page-btn .smg-nav-btn-text {
                    display: inline-block !important;
                    font-size: 12px !important;
                    font-weight: 700 !important;
                    color: rgba(255,255,255,0.92) !important;
                    line-height: 1 !important;
                }
                .smg-dock-thread-bar #smg-mobile-page-btn.smg-active {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                }
                .smg-dock-thread-bar #smg-mobile-page-btn.smg-active .smg-nav-ico,
                .smg-dock-thread-bar #smg-mobile-page-btn.smg-active .smg-nav-btn-text {
                    color: var(--smg-link, #ff77b2) !important;
                }
                .smg-dock-thread-bar #smg-thread-view-mode.smg-active .smg-nav-ico {
                    color: var(--smg-link, #ff77b2) !important;
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

            /* ---- settings / filtro por autor / filtro da listagem: popovers (padrão do search) ---- */
            #smg-settings-pop, #smg-filter-pop, #smg-listfilter-pop, #smg-listsort-pop {
                position: absolute;
                bottom: calc(100% + 12px);
                left: 50%;
                width: 420px;
                max-width: calc(100vw - 20px);
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                gap: 10px;
                padding: 16px 18px;
                border-radius: 16px;
                background: var(--smg-s1);
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 44px rgba(0,0,0,0.62);
                backdrop-filter: blur(20px) saturate(170%);
                -webkit-backdrop-filter: blur(20px) saturate(170%);
                visibility: hidden;   /* PERF: fechado SAI da render tree (opacity:0 sozinho mantinha a camada de blur viva em toda thread/lista — o #smg-goto-pop já fazia certo) */
                opacity: 0;
                pointer-events: none;
                transform: translateX(-50%) translateY(6px);
                transition: opacity .18s ease, transform .18s ease, visibility .18s;
                z-index: 11;
            }
            #smg-post-nav-wrapper.settings-open #smg-settings-pop,
            #smg-post-nav-wrapper.filter-open #smg-filter-pop,
            #smg-post-nav-wrapper.listfilter-open #smg-listfilter-pop,
            #smg-post-nav-wrapper.listsort-open #smg-listsort-pop {
                visibility: visible;
                opacity: 1;
                pointer-events: auto;
                transform: translateX(-50%) translateY(0);
            }
            /* ---- filtro da listagem (fórum) ---- */
            #smg-listfilter-pop {
                width: 520px;
                max-width: min(520px, calc(100vw - 20px));
                max-height: 85vh;
                overflow-y: auto;
            }
            #smg-listfilter-pop::-webkit-scrollbar { width: 8px; }
            #smg-listfilter-pop::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 4px; }
            #smg-listfilter-pop .smg-multiselect-container { width: 100%; }
            #smg-listfilter-pop .smg-multiselect-btn { width: 100%; justify-content: space-between; }
            #smg-listfilter-pop .smg-multiselect-pop {
                position: static !important;
                width: 100% !important;
                max-width: 100% !important;
                max-height: 420px !important;
                margin-top: 8px !important;
                box-shadow: none !important;
                border: 1px solid rgba(255,255,255,0.1) !important;
            }
            #smg-listfilter-pop .smg-multiselect-list {
                max-height: 320px !important;
            }
            /* ---- ordenação da listagem (fórum) ---- */
            #smg-listsort-pop { width: 380px; max-width: min(380px, calc(100vw - 20px)); max-height: 80vh; overflow-y: auto; padding: 18px 20px; }
            #smg-listsort-pop::-webkit-scrollbar { width: 8px; }
            #smg-listsort-pop::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 4px; }
            .smg-sort-body { display: flex; flex-direction: column; gap: 14px; }
            .smg-lf-body { display: flex; flex-direction: column; gap: 14px; }
            .smg-lf-headrow { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-bottom: 2px; }
            .smg-lf-counter { font-size: 13px; font-weight: 600; color: rgba(255, 255, 255, 0.7); }
            .smg-lf-reset-btn {
                background: transparent; border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 8px;
                color: rgba(255, 255, 255, 0.7); padding: 3px 9px; font-size: 12px; font-weight: 600; cursor: pointer;
                transition: background 0.12s ease, color 0.12s ease;
            }
            .smg-lf-reset-btn:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
            .smg-lf-row { display: flex; flex-direction: column; gap: 7px; }
            .smg-lf-label { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); }
            .smg-lf-chips { display: flex; flex-wrap: wrap; gap: 7px; }
            .smg-lf-group { width: 100%; margin-top: 4px; font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: rgba(255,255,255,0.35); }
            .smg-lf-group-title {
                width: 100%;
                margin: 8px 0 4px 0;
                font-size: 10.5px;
                font-weight: 800;
                letter-spacing: .05em;
                text-transform: uppercase;
                color: rgba(255,255,255,0.45);
                border-bottom: 1px solid rgba(255,255,255,0.06);
                padding-bottom: 3px;
            }
            .smg-lf-prefix { padding: 0 9px; height: 30px; }
            .smg-lf-prefix .label { font-size: 10px !important; padding: 1.5px 5px !important; }
            .label,
            .smg-badge-chip {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 1.5px 5.5px !important;
                border-radius: 4px !important;
                font-size: 9.5px !important;
                font-weight: 700 !important;
                line-height: 1.2 !important;
                cursor: pointer !important;
                white-space: nowrap !important;
                user-select: none !important;
                text-decoration: none !important;
                vertical-align: middle !important;
                border: 1px solid rgba(255,255,255,0.12) !important;
                background: rgba(255,255,255,0.07);
                color: #e7e7ea;
                transition: transform .12s ease, box-shadow .12s ease, filter .12s ease !important;
            }
            .smg-badge-chip:hover {
                filter: brightness(1.18) !important;
                transform: translateY(-1px) !important;
            }
            .smg-badge-chip.active,
            .smg-badge-chip.is-selected {
                outline: 2px solid var(--smg-link, #ff77b2) !important;
                outline-offset: 1px !important;
                box-shadow: 0 0 10px rgba(255,119,178,0.45) !important;
                filter: brightness(1.25) !important;
            }
            .smg-badge-chip.tagItem {
                border-radius: 4px !important;
                background: rgba(255,255,255,0.06) !important;
                color: var(--smg-tx, #cbd9ff) !important;
                font-weight: 600 !important;
            }
            /* Cores dos Prefixos Nativos e Customizados Xenforo */
            .label.label--green, .smg-badge-chip.label--green, .label--green { background: #27ae60 !important; color: #fff !important; }
            .label.label--trans, .smg-badge-chip.label--trans, .label--trans { background: #5dade2 !important; color: #fff !important; }
            .label.label--vtuber, .smg-badge-chip.label--vtuber, .label--vtuber { background: #a569bd !important; color: #fff !important; }
            .label.label--asmr, .smg-badge-chip.label--asmr, .label--asmr { background: #eb984e !important; color: #fff !important; }
            .label.label--celeb, .smg-badge-chip.label--celeb, .label--celeb { background: #e74c3c !important; color: #fff !important; }
            .label.label--patreon, .smg-badge-chip.label--patreon, .label--patreon { background: #ff424d !important; color: #fff !important; }
            .label.label--twitch, .smg-badge-chip.label--twitch, .label--twitch { background: #9146ff !important; color: #fff !important; }
            .label.label--youtube, .smg-badge-chip.label--youtube, .label--youtube { background: #ff0000 !important; color: #fff !important; }
            .label.label--kick, .smg-badge-chip.label--kick, .label--kick { background: #53fc18 !important; color: #051a02 !important; }
            .label.label--onlyfans, .smg-badge-chip.label--onlyfans, .label--onlyfans { background: #00aff0 !important; color: #fff !important; }
            .label.label--tiktok, .smg-badge-chip.label--tiktok, .label--tiktok { background: #00f2fe !important; color: #000 !important; }
            .label.label--insta, .smg-badge-chip.label--insta, .label--insta { background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888) !important; color: #fff !important; }
            .label.label--professional-modelling-sites, .smg-badge-chip.label--professional-modelling-sites, .label--professional-modelling-sites { background: #34495e !important; color: #fff !important; }
            .label.label--manyvids, .smg-badge-chip.label--manyvids, .label--manyvids { background: #00b2a9 !important; color: #fff !important; }
            .label.label--reddit, .smg-badge-chip.label--reddit, .label--reddit { background: #ff4500 !important; color: #fff !important; }
            .label.label--fantrie, .smg-badge-chip.label--fantrie, .label--fantrie { background: #4a90e2 !important; color: #fff !important; }
            .label.label--fanfix, .smg-badge-chip.label--fanfix, .label--fanfix { background: #9b51e0 !important; color: #fff !important; }
            .label.label--boosty, .smg-badge-chip.label--boosty, .label--boosty { background: #f2994a !important; color: #fff !important; }
            .label.label--camgirls, .smg-badge-chip.label--camgirls, .label--camgirls { background: #eb5757 !important; color: #fff !important; }
            .label.label--gumroad, .smg-badge-chip.label--gumroad, .label--gumroad { background: #ff90e8 !important; color: #000 !important; }
            .label.label--snapchat, .smg-badge-chip.label--snapchat, .label--snapchat { background: #fffc00 !important; color: #000 !important; }
            .label.label--x, .smg-badge-chip.label--x, .label--x { background: #111 !important; border: 1px solid rgba(255,255,255,0.4) !important; color: #fff !important; }
            .label.label--fansly, .smg-badge-chip.label--fansly, .label--fansly { background: #1ea1f1 !important; color: #fff !important; }
            .label.label--xxx, .smg-badge-chip.label--xxx, .label--xxx { background: #8e44ad !important; color: #fff !important; }
            .label.label--pornhub, .smg-badge-chip.label--pornhub, .label--pornhub { background: #ffa31a !important; color: #000 !important; }
            .label.label--cosplay, .smg-badge-chip.label--cosplay, .label--cosplay { background: #ff69b4 !important; color: #fff !important; }
            .label.label--NEWasian, .smg-badge-chip.label--NEWasian, .label--NEWasian { background: #e67e22 !important; color: #fff !important; }
            .label.label--thicc, .smg-badge-chip.label--thicc, .label--thicc { background: #e91e63 !important; color: #fff !important; }
            .label.label--asian, .smg-badge-chip.label--asian, .label--asian { background: #c0392b !important; color: #fff !important; }
            .label.label--misc, .smg-badge-chip.label--misc, .label--misc { background: #7f8c8d !important; color: #fff !important; }
            .label.label--requests, .smg-badge-chip.label--requests, .label--requests { background: #d35400 !important; color: #fff !important; }
            .label.label--brazil, .smg-badge-chip.label--brazil, .label--brazil { background: #27ae60 !important; color: #fff !important; }
            .label.label--passes, .smg-badge-chip.label--passes, .label--passes { background: #2c3e50 !important; color: #fff !important; }
            .label.label--playboy, .smg-badge-chip.label--playboy, .label--playboy { background: #111 !important; color: #ff77b2 !important; border: 1px solid #ff77b2 !important; }
            .label.label--kofi, .smg-badge-chip.label--kofi, .label--kofi { background: #13c3ff !important; color: #000 !important; }
            .label.label--fantia, .smg-badge-chip.label--fantia, .label--fantia { background: #ff5274 !important; color: #fff !important; }
            .label.label--jvid, .smg-badge-chip.label--jvid, .label--jvid { background: #f39c12 !important; color: #fff !important; }
            .label.label--afreecatv, .smg-badge-chip.label--afreecatv, .label--afreecatv { background: #2253a3 !important; color: #fff !important; }
            .label.label--twitter, .smg-badge-chip.label--twitter, .label--twitter { background: #0096fa !important; color: #fff !important; }
            .label.label--hentai, .smg-badge-chip.label--hentai, .label--hentai { background: #e84393 !important; color: #fff !important; }
            .label.label--3d, .smg-badge-chip.label--3d, .label--3d { background: #6c5ce7 !important; color: #fff !important; }
            .label.label--ai, .smg-badge-chip.label--ai, .label--ai { background: #0984e3 !important; color: #fff !important; }
            .label.label--onlyfanslogo, .smg-badge-chip.label--onlyfanslogo, .label--onlyfanslogo { background: #00aff0 !important; color: #fff !important; }
            .label.label--privacylogo, .smg-badge-chip.label--privacylogo, .label--privacylogo { background: #ff4757 !important; color: #fff !important; }
            .label.label--patreonlogo, .smg-badge-chip.label--patreonlogo, .label--patreonlogo { background: #ff424d !important; color: #fff !important; }
            .label.label--xvideoslogo, .smg-badge-chip.label--xvideoslogo, .label--xvideoslogo { background: #e74c3c !important; color: #fff !important; }
            .label.label--redditlogo, .smg-badge-chip.label--redditlogo, .label--redditlogo { background: #ff4500 !important; color: #fff !important; }
            .label.label--japan, .smg-badge-chip.label--japan, .label--japan { background: #c0392b !important; color: #fff !important; }
            .label.label--korea, .smg-badge-chip.label--korea, .label--korea { background: #2980b9 !important; color: #fff !important; }
            .label.label--china, .smg-badge-chip.label--china, .label--china { background: #c0392b !important; color: #f1c40f !important; }
            .label.label--thailand, .smg-badge-chip.label--thailand, .label--thailand { background: #8e44ad !important; color: #fff !important; }
            .label.label--philippines, .smg-badge-chip.label--philippines, .label--philippines { background: #16a085 !important; color: #fff !important; }
            .label.label--indonesia, .smg-badge-chip.label--indonesia, .label--indonesia { background: #d35400 !important; color: #fff !important; }
            .label.label--taiwan, .smg-badge-chip.label--taiwan, .label--taiwan { background: #2c3e50 !important; color: #fff !important; }
            .label.label--vietnam, .smg-badge-chip.label--vietnam, .label--vietnam { background: #b71540 !important; color: #fff !important; }
            .label.label--hong_kong, .smg-badge-chip.label--hong_kong, .label--hong_kong { background: #eb2f06 !important; color: #fff !important; }
            .label.label--singapore, .smg-badge-chip.label--singapore, .label--singapore { background: #b71540 !important; color: #fff !important; }
            .label.label--malaysia, .smg-badge-chip.label--malaysia, .label--malaysia { background: #f39c12 !important; color: #fff !important; }
            .smg-badge-chip-cnt {
                font-size: 10px !important;
                font-weight: 800 !important;
                padding: 1px 4px !important;
                border-radius: 4px !important;
                background: rgba(0,0,0,0.35) !important;
                color: rgba(255,255,255,0.9) !important;
                line-height: 1 !important;
                margin-left: 2px !important;
            }
            .smg-search-chips {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 6px !important;
                padding: 8px 12px 10px !important;
                border-top: 1px solid rgba(255,255,255,0.06) !important;
            }
            .smg-lf-badges {
                display: flex; flex-wrap: wrap; gap: 6px;
                max-height: 200px; overflow-y: auto; padding: 2px 0;
            }
            .smg-lf-badges::-webkit-scrollbar { width: 6px; }
            .smg-lf-badges::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
            .smg-lf-input {
                height: 38px; padding: 0 12px; box-sizing: border-box;
                border-radius: 10px; border: 1px solid rgba(255,255,255,0.16);
                background: rgba(255,255,255,0.06); color: #fff; font-size: 14px; outline: none;
            }
            .smg-lf-input:focus { border-color: rgba(255,255,255,0.45); }
            .smg-lf-select option { background: #1b1c20; color: #fff; }
            .smg-lf-sort { display: flex; gap: 8px; }
            .smg-lf-sort .smg-lf-select { flex: 1; }
            /* ---- Controles de Ordenação na Dock ---- */
            .smg-lf-sort-row { display: flex; flex-direction: column; gap: 8px; }
            .smg-lf-sort-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
            .smg-lf-sort-opt {
                display: inline-flex; align-items: center; justify-content: center; gap: 7px;
                padding: 9px 12px; border-radius: 10px;
                background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08);
                color: rgba(255, 255, 255, 0.85); font-size: 12.5px; font-weight: 600;
                cursor: pointer; transition: all .15s ease;
            }
            .smg-lf-sort-opt:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.18); color: #fff; transform: translateY(-1px); }
            .smg-lf-sort-opt.active {
                background: rgba(255, 119, 178, 0.16); border-color: #ff77b2;
                color: #fff; font-weight: 700;
                box-shadow: 0 0 14px rgba(255, 119, 178, 0.25);
            }
            .smg-lf-dir-group { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 3px; background: rgba(0,0,0,0.25); border-radius: 10px; border: 1px solid rgba(255,255,255,0.06); }
            .smg-lf-dir-opt {
                padding: 8px 12px; border-radius: 8px; border: 0; background: transparent;
                color: rgba(255,255,255,0.65); font-size: 12.5px; font-weight: 600;
                cursor: pointer; transition: all .15s ease; text-align: center;
            }
            .smg-lf-dir-opt:hover { color: #fff; }
            .smg-lf-dir-opt.active { background: var(--smg-link, #ff77b2); color: #fff; font-weight: 700; box-shadow: 0 2px 8px rgba(255,119,178,0.3); }
            .smg-lf-select {
                width: 100%; height: 38px; padding: 0 12px; border-radius: 10px;
                background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
                color: #fff; font-size: 13px; font-weight: 500; outline: none; cursor: pointer;
                transition: border-color .15s;
            }
            .smg-lf-select:hover, .smg-lf-select:focus { border-color: rgba(255, 255, 255, 0.25); }
            .smg-lf-apply {
                margin-top: 10px;
                width: 100%;
                padding: 12px;
                border-radius: 12px;
                border: none;
                background: var(--smg-link, #ff77b2);
                color: #fff;
                font-size: 14.5px;
                font-weight: 700;
                cursor: pointer;
                box-shadow: 0 4px 16px rgba(255, 119, 178, 0.35);
                transition: filter .15s ease, transform .12s ease;
            }
            .smg-lf-apply:hover {
                filter: brightness(1.12);
                transform: translateY(-1px);
            }
            .smg-lf-apply:active {
                transform: scale(0.98);
            }
            .smg-pop-title {
                font-size: 11px;
                font-weight: 600;
                letter-spacing: .06em;
                text-transform: uppercase;
                color: rgba(255,255,255,0.55);
            }
            /* ===== painel de settings (estilo painel do Twitter): header + busca + rail de categorias + seções + footer ===== */
            #smg-settings-pop { width: 460px; max-height: 86vh; padding: 0 !important; gap: 0 !important; overflow: hidden; }
            #smg-settings-pop .smg-set-body { min-height: 0; }
            .smg-set-head { display: flex; align-items: center; gap: 10px; padding: 14px 16px 12px; border-bottom: 1px solid rgba(255,255,255,0.08); }
            .smg-set-logo { flex: 0 0 auto; width: 30px; height: 30px; border-radius: 9px; background: var(--smg-link, #ff77b2); display: flex; align-items: center; justify-content: center; }
            .smg-set-logo svg { width: 17px; height: 17px; fill: none !important; color: #fff; }
            .smg-set-title { flex: 1; min-width: 0; font-size: 16px; font-weight: 800; color: #fff; }
            .smg-set-x { flex: 0 0 auto; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 8px; background: transparent; color: rgba(255,255,255,0.55); cursor: pointer; }
            .smg-set-x:hover { background: rgba(255,255,255,0.12); color: #fff; }
            .smg-set-x svg { width: 16px; height: 16px; fill: none !important; }
            .smg-set-search { display: flex; align-items: center; gap: 8px; margin: 11px 14px; padding: 8px 12px; border-radius: 999px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); }
            .smg-set-search:focus-within { border-color: var(--smg-link, #ff77b2); }
            .smg-set-searchic { flex: 0 0 auto; display: inline-flex; color: rgba(255,255,255,0.5); }
            .smg-set-searchic svg { width: 16px; height: 16px; fill: none !important; }
            .smg-set-q { flex: 1; min-width: 0; border: 0; background: transparent; outline: none; color: #fff; font: inherit; font-size: 14px; }
            .smg-set-q::placeholder { color: rgba(255,255,255,0.45); }
            .smg-set-body { display: flex; min-height: 0; flex: 1; }
            .smg-set-rail { display: flex; flex-direction: column; gap: 4px; padding: 10px 8px; border-right: 1px solid rgba(255,255,255,0.08); flex: 0 0 auto; }
            .smg-set-tab { width: 40px; height: 40px; border: 0; border-radius: 11px; display: inline-flex; align-items: center; justify-content: center; background: transparent; color: rgba(255,255,255,0.5); cursor: pointer; transition: background .14s ease, color .14s ease; }
            .smg-set-tab svg { width: 20px; height: 20px; fill: none !important; }
            .smg-set-tab:hover { background: rgba(255,255,255,0.07); color: #fff; }
            .smg-set-tab.active { background: var(--smg-link-soft, rgba(255,119,178,0.16)); color: var(--smg-link, #ff77b2); }
            .smg-set-content { flex: 1; min-width: 0; overflow-y: auto; max-height: 58vh; padding: 2px 10px 12px; }
            .smg-set-sectitle { font-size: 10.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,0.45); padding: 12px 6px 6px; }
            .smg-set-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; padding: 9px 6px; border-radius: 9px; cursor: pointer; }
            .smg-set-row:hover { background: rgba(255,255,255,0.05); }
            .smg-set-text { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
            .smg-set-label { font-size: 13.5px; font-weight: 600; color: rgba(255,255,255,0.92); line-height: 1.3; }
            .smg-set-desc { font-size: 11.5px; color: rgba(255,255,255,0.5); line-height: 1.4; }
            .smg-set-row .smg-switch { margin-top: 1px; }
            .smg-switch { position: relative; flex: 0 0 auto; width: 40px; height: 23px; border-radius: 999px; background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.12); transition: background .16s ease; }
            .smg-switch::after { content: ""; position: absolute; top: 2px; left: 2px; width: 17px; height: 17px; border-radius: 50%; background: #fff; transition: transform .18s cubic-bezier(.2,.8,.3,1); box-shadow: 0 1px 3px rgba(0,0,0,.4); }
            .smg-set-row input { position: absolute; opacity: 0; pointer-events: none; }
            .smg-set-row input:checked + .smg-switch { background: var(--smg-link, #ff77b2); border-color: var(--smg-link, #ff77b2); }
            .smg-set-row input:checked + .smg-switch::after { transform: translateX(17px); }
            .smg-set-slider { display: flex; flex-direction: column; gap: 9px; padding: 11px 6px; }
            .smg-set-slidertop { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
            .smg-set-val { flex: 0 0 auto; color: var(--smg-link, #ff77b2); font-weight: 700; background: var(--smg-link-soft, rgba(255,119,178,0.12)); border-radius: 6px; padding: 1px 8px; font-size: 13px; min-width: 38px; text-align: center; font-variant-numeric: tabular-nums; }
            .smg-set-slider input[type=range] { width: 100%; accent-color: var(--smg-link, #ff77b2); cursor: pointer; }
            .smg-set-action-card {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 10px 8px;
                border-radius: 10px;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.06);
                margin-top: 6px;
            }
            .smg-set-action-card:hover {
                background: rgba(255,255,255,0.05);
                border-color: rgba(255,255,255,0.1);
            }
            .smg-set-btn-danger {
                flex: 0 0 auto;
                padding: 6px 12px;
                border-radius: 8px;
                border: 1px solid rgba(244,63,94,0.3);
                background: rgba(244,63,94,0.12);
                color: #fb7185;
                font: inherit;
                font-size: 12.5px;
                font-weight: 700;
                cursor: pointer;
                transition: background .12s, border-color .12s, color .12s;
            }
            .smg-set-btn-danger:hover {
                background: rgba(244,63,94,0.22);
                border-color: rgba(244,63,94,0.5);
                color: #fff;
            }
            .smg-set-btn-danger:active {
                transform: scale(0.96);
            }
            .smg-set-empty { padding: 30px 16px; text-align: center; color: rgba(255,255,255,0.45); font-size: 13.5px; }
            .smg-set-foot { display: flex; align-items: center; gap: 10px; padding: 11px 16px; border-top: 1px solid rgba(255,255,255,0.08); }
            .smg-set-reset { border: 0; background: transparent; color: rgba(255,255,255,0.55); font: inherit; font-size: 13px; font-weight: 600; padding: 5px 9px; border-radius: 7px; cursor: pointer; }
            .smg-set-reset:hover { color: #fb7185; background: rgba(244,63,94,0.1); }
            .smg-set-reload { border: 1px solid var(--smg-bd2); background: var(--smg-s3); color: #fff; font: inherit; font-size: 13px; font-weight: 600; padding: 6px 12px; border-radius: 9px; cursor: pointer; }
            .smg-set-reload:hover { filter: brightness(1.12); }
            .smg-set-ver { margin-left: auto; color: rgba(255,255,255,0.35); font-size: 12px; }
            /* filtro por autor */
            .smg-filter-quick { display: flex; flex-wrap: wrap; gap: 8px; }
            .smg-filter-chip { padding: 7px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.16); background: rgba(255,255,255,0.07); color: #fff; font-size: 13px; cursor: pointer; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .smg-filter-chip:hover { background: rgba(255,255,255,0.16); }
            .smg-filter-chip.active { background: var(--smg-s3); border-color: var(--smg-bd2); }
            .smg-filter-row { display: flex; gap: 8px; }
            .smg-filter-input { flex: 1 1 auto; min-width: 0; height: 38px; padding: 0 12px; box-sizing: border-box; border-radius: 10px; border: 1px solid rgba(255,255,255,0.16); background: rgba(255,255,255,0.07); color: #fff; font-size: 14px; outline: none; }
            .smg-filter-input:focus { border-color: rgba(255,255,255,0.45); background: rgba(255,255,255,0.1); }
            .smg-filter-apply, .smg-filter-clear { flex: 0 0 auto; height: 38px; padding: 0 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.16); background: rgba(255,255,255,0.13); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
            .smg-filter-apply:hover, .smg-filter-clear:hover { background: rgba(255,255,255,0.22); }
            .smg-filter-clear { width: 100%; }

            /* ---- backdrop dos popovers do dock (vira o scrim do bottom sheet no mobile) ---- */
            .smg-dock-backdrop {
                position: fixed; inset: 0; z-index: 15;
                background: var(--smg-scrim);
                -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
                opacity: 0; visibility: hidden; pointer-events: none;
                transition: opacity .22s ease, visibility .22s;
            }

            `;
