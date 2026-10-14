    // STYLE CONTEXT: Topbar, sheets and desktop navigation
    const CSS_TOPBAR = `/* ================= TOPBAR REFORMULADA ================= */
            /* esconde a nav/header nativos e abre espaço pra nossa barra fixa */
            html.smg-topbar-on .p-header,
            html.smg-topbar-on .p-navSticky { display: none !important; }
            .u-scrollButtons, .js-scrollButtons { display: none !important; }   /* esconde os botões de scroll nativos do XF (a dock provê scroll topo/fundo) */
            html.smg-topbar-on body { padding-top: 72px !important; }   /* reserve space for the fixed topbar */
            /* deep-link (#post-X / âncora): cai ABAIXO da topbar fixa, não atrás dela (vale p/ o scroll do browser E o nosso pin) */
            html.smg-topbar-on :target { scroll-margin-top: 86px; }
            @media (max-width: 800px) {
                html.smg-topbar-on body { padding-top: 50px !important; }
                html.smg-topbar-on :target { scroll-margin-top: 66px; }
            }

            /* TOPBAR estilo ehentai: barra FIXA FULL-WIDTH (bg/borda de ponta a ponta),
               com o inner alinhado à MESMA largura do conteúdo (.p-body-inner) via margin:auto. */
            #smg-topbar-wrap {
                position: fixed; top: 0; left: 0; right: 0; width: 100%; z-index: 1000;  /* acima do feed; toasts e overlays ficam mais altos */
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
                height: 72px; max-width: var(--smg-cw); margin: 0 auto; padding: 0; box-sizing: border-box;
                position: relative;   /* âncora do overlay de busca (ocupa a topbar) */
                transition: height .24s cubic-bezier(0.16, 1, 0.3, 1);
            }
            /* Mobile threads use a dedicated shell, like an app topbar. */
            .smg-mobile-threadbar { display: none; }
            @media (min-width: 801px) { #smg-topbar-wrap.floating #smg-tb-inner { height: 60px; } }   /* encolhe no scroll down (.floating = scrollY>40); desktop só (mobile já é compacto) */
            @media (max-width: 800px) { #smg-tb-inner { max-width: calc(100% - 24px); height: 48px; } }
            /* SMG: cor da topbar #1a1a1a */
            html.smg-smg #smg-topbar { background: #1a1a1a; }
            .smg-tb-left { display: flex; align-items: center; gap: 4px; flex: 0 0 auto; }
            .smg-tb-center { flex: 1 1 auto; min-width: 0; display: flex; justify-content: center; }
            .smg-tb-logo {
                display: flex; align-items: center; height: 48px; flex: 0 0 auto; margin-right: 12px;
                text-decoration: none; color: #fff; font-weight: 800;
                transition: transform .18s ease, filter .18s ease, height .22s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .smg-tb-logo:hover {
                transform: scale(1.02);
                filter: drop-shadow(0 2px 14px rgba(255,255,255,0.22));
            }
            .smg-tb-logo img {
                height: 42px; width: auto; max-width: 220px; object-fit: contain; display: block;
                filter: drop-shadow(0 2px 8px rgba(0,0,0,0.45));
                transition: height .22s cubic-bezier(0.16, 1, 0.3, 1), filter .18s ease;
            }
            @media (min-width: 801px) {
                #smg-topbar-wrap.floating .smg-tb-logo { height: 42px; }
                #smg-topbar-wrap.floating .smg-tb-logo img { height: 36px; }
            }
            @media (max-width: 800px) {
                .smg-tb-logo { height: 36px; margin-right: 6px; }
                .smg-tb-logo img { height: 30px; max-width: 140px; }
            }
            /* logo custom do SMG: wordmark "SMG" (G em rosa = acento da marca) */
            .smg-logo { display: inline-flex; align-items: center; }
            .smg-logo-word {
                font-size: 26px; font-weight: 900; letter-spacing: 0.8px; color: #fff; line-height: 1;
                text-shadow: 0 2px 10px rgba(0,0,0,0.5);
                transition: font-size .22s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .smg-logo-accent { color: #ff3d84; text-shadow: 0 0 16px rgba(255,61,132,0.5); }
            @media (min-width: 801px) {
                #smg-topbar-wrap.floating .smg-logo-word { font-size: 23px; }
            }
            @media (max-width: 800px) {
                .smg-logo-word { font-size: 20px; }
            }
            .smg-tb-nav { display: flex; align-items: center; gap: 4px; }
            .smg-tb-item {
                position: relative;
                display: flex; align-items: center; gap: 7px; height: 42px; padding: 0 14px;
                border-radius: 11px; border: none; background: transparent; color: rgba(255,255,255,0.85);
                font-size: 14.5px; font-weight: 600; cursor: pointer; text-decoration: none; white-space: nowrap;
                transition: background .14s ease, color .14s ease, height .22s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .smg-tb-item:hover, .smg-tb-item.active { background: var(--smg-link-soft, rgba(255,255,255,0.09)); color: #fff; }
            @media (min-width: 801px) {
                #smg-topbar-wrap.floating .smg-tb-item { height: 38px; padding: 0 12px; font-size: 14px; }
            }
            .smg-tb-ico { display: flex; align-items: center; }
            .smg-tb-ico svg { width: 18px; height: 18px; fill: none !important; }
            .smg-tb-caret { display: flex; align-items: center; margin-left: -2px; }
            .smg-tb-caret svg { width: 14px; height: 14px; opacity: .55; fill: none !important; }
            .smg-tb-item.active .smg-tb-caret { transform: rotate(180deg); }

            .smg-tb-actions { display: flex; align-items: center; gap: 4px; flex: 0 0 auto; }
            .smg-tb-act {
                position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;
                border-radius: 11px; border: none; background: transparent; color: rgba(255,255,255,0.85);
                cursor: pointer; text-decoration: none;
                transition: background .14s ease, color .14s ease, width .22s cubic-bezier(0.16, 1, 0.3, 1), height .22s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .smg-tb-act:hover { background: var(--smg-link-soft, rgba(255,255,255,0.1)); color: #fff; }
            .smg-tb-act svg { width: 20px; height: 20px; fill: none !important; }
            @media (min-width: 801px) {
                #smg-topbar-wrap.floating .smg-tb-act { width: 38px; height: 38px; }
            }
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
            .smg-search-clear {
                flex: 0 0 auto; width: 28px; height: 28px;
                display: inline-flex; align-items: center; justify-content: center;
                margin: 0 2px; border: 0; border-radius: 8px; background: transparent;
                color: rgba(255,255,255,0.45); cursor: pointer;
                transition: background .14s ease, color .14s ease; padding: 0;
            }
            .smg-search-clear:hover { background: rgba(255,255,255,0.12); color: #fff; }
            .smg-search-clear svg { width: 14px; height: 14px; fill: none !important; }
            .smg-search-clear[hidden] { display: none !important; }
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
            .smg-tb-badge {
                position: absolute; top: 3px; right: 3px; min-width: 16px; height: 16px; padding: 0 4px;
                border-radius: 999px; background: #e0245e; color: #fff; font-size: 10px; font-weight: 700;
                display: flex; align-items: center; justify-content: center; box-sizing: border-box;
                font-variant-numeric: tabular-nums;
            }
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

            /* popovers agrupados */
            .smg-tb-pop {
                position: absolute; top: calc(100% + 8px); left: 0; min-width: 290px; max-width: 340px;
                padding: 8px; border-radius: 16px;
                background: var(--smg-s1);
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 22px 55px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.06);
                opacity: 0; visibility: hidden; transform: translateY(6px);
                transition: opacity .16s ease, transform .16s ease, visibility .16s;
                z-index: 40;
            }
            .smg-tb-pop.open { opacity: 1; visibility: visible; transform: translateY(0); z-index: 40; }
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
            .smg-tb-listbody::-webkit-scrollbar { width: 8px; }
            .smg-tb-listbody::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 4px; }
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
            /* Flash do XF vira toast no canto inferior direito. */
            .flashMessage {
                position: fixed !important;
                top: auto !important;
                left: auto !important;
                right: 18px !important;
                bottom: 22px !important;
                z-index: 1000004 !important;
                width: auto !important;
                max-width: min(380px, calc(100vw - 32px)) !important;
                margin: 0 !important;
                padding: 12px 16px !important;
                border: 1px solid rgba(255,255,255,0.12) !important;
                border-radius: 14px !important;
                background: var(--smg-s1, #1c1d22) !important;
                color: #fff !important;
                box-shadow: 0 14px 36px rgba(0,0,0,0.5) !important;
                font-size: 14px !important;
                line-height: 1.4 !important;
            }
            .flashMessage .flashMessage-content { color: inherit !important; }
            @media (max-width: 600px) {
                .flashMessage { right: 12px !important; left: 12px !important; bottom: 76px !important; max-width: none !important; }
            }
            /* Tooltip de bookmark: cartão, não a caixa nativa estreita. */
            .tooltip--bookmark { z-index: 1000005 !important; max-width: min(380px, calc(100vw - 24px)) !important; }
            .tooltip--bookmark .tooltip-content {
                background: var(--smg-s1, #1c1d22) !important;
                border: 1px solid rgba(255,255,255,0.12) !important;
                border-radius: 16px !important;
                box-shadow: 0 18px 48px rgba(0,0,0,0.55) !important;
                color: #fff !important;
                overflow: hidden;
            }
            .tooltip--bookmark .tooltip-content-inner { padding: 4px 4px 8px !important; }
            .tooltip--bookmark .block-minorHeader {
                background: transparent !important;
                border: 0 !important;
                color: #fff !important;
                font-size: 15px !important;
                font-weight: 750 !important;
                padding: 14px 14px 4px !important;
            }
            .tooltip--bookmark .block-body { background: transparent !important; }
            .tooltip--bookmark .block-row { padding: 8px 14px !important; }
            .tooltip--bookmark .formRow-label { color: rgba(255,255,255,0.88) !important; font-weight: 650 !important; }
            .tooltip--bookmark .formRow-hint { color: rgba(255,255,255,0.42) !important; }
            .tooltip--bookmark .formRow-explain { color: rgba(255,255,255,0.4) !important; font-size: 12px !important; }
            .tooltip--bookmark textarea.input,
            .tooltip--bookmark .tagify,
            .tooltip--bookmark input.input {
                background: rgba(255,255,255,0.04) !important;
                border: 1px solid rgba(255,255,255,0.12) !important;
                border-radius: 10px !important;
                color: #fff !important;
            }
            .tooltip--bookmark .formButtonGroup { margin: 0 !important; }
            .tooltip--bookmark .button {
                border-radius: 10px !important;
                min-height: 36px;
            }
            .tooltip--bookmark .button--primary {
                background: var(--smg-link, #ff77b2) !important;
                border-color: transparent !important;
                color: #fff !important;
            }
            .tooltip--bookmark .tooltip-arrow { display: none !important; }
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
`;