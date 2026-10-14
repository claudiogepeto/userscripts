    // STYLE CONTEXT: Topbar, sheets and desktop navigation
    const CSS_TOPBAR = `/* ================= TOPBAR REFORMULADA ================= */
            /* esconde a nav/header nativos e abre espaço pra nossa barra fixa */
            html.smg-topbar-on .p-header,
            html.smg-topbar-on .p-navSticky { display: none !important; }
            .u-scrollButtons, .js-scrollButtons { display: none !important; }   /* esconde os botões de scroll nativos do XF (a dock provê scroll topo/fundo) */
            html.smg-topbar-on body { padding-top: 72px !important; }   /* reserve space for the fixed topbar */
            /* deep-link (#post-X / âncora): cai ABAIXO da topbar fixa, não atrás dela (vale p/ o scroll do browser E o nosso pin) */
            html.smg-topbar-on :target { scroll-margin-top: 86px; }

            /* TOPBAR estilo ehentai: barra FIXA FULL-WIDTH (bg/borda de ponta a ponta),
               com o inner alinhado à MESMA largura do conteúdo (.p-body-inner) via margin:auto. */
            #smg-topbar-wrap {
                position: fixed; top: 0; left: 0; right: 0; width: 100%; z-index: var(--smg-z-topbar);  /* acima do feed; toasts e overlays ficam mais altos */
            }
            #smg-topbar {
                position: relative; width: 100%; box-sizing: border-box;
                background: var(--smg-bg);
                border: 0; border-bottom: 1px solid var(--smg-w-08);
                box-shadow: 0 1px 0 var(--smg-w-02);
                transition: box-shadow var(--smg-dur-20) ease, background var(--smg-dur-20) ease;
            }
            /* leve sombra ao rolar */
            #smg-topbar-wrap.floating #smg-topbar { box-shadow: var(--smg-shadow-2); border-bottom-color: var(--smg-w-06); }
            /* inner = largura do conteúdo (80% no desktop), centralizado igual ao .p-body-inner */
            /* 3 zonas (flex: os lados NUNCA cortam): esquerda fit-content · centro cresce (search capada
               e centralizada no espaço livre) · direita fit-content. A search encolhe sozinha conforme
               sobra espaço entre logo/Discover e os ícones → não corta o resto em nenhuma resolução. */
            #smg-tb-inner {
                display: flex; align-items: center; gap: var(--smg-sp-16);
                height: 72px; max-width: var(--smg-cw); margin: 0 auto; padding: 0; box-sizing: border-box;
                position: relative;   /* âncora do overlay de busca (ocupa a topbar) */
                transition: height var(--smg-dur-20) cubic-bezier(0.16, 1, 0.3, 1);
            }
            /* Mobile threads use a dedicated shell, like an app topbar. */
            .smg-mobile-threadbar { display: none; }   /* encolhe no scroll down (.floating = scrollY>40); desktop só (mobile já é compacto) */
            /* SMG: cor da topbar #1a1a1a */
            html.smg-smg #smg-topbar { background: #1a1a1a; }
            .smg-tb-left { display: flex; align-items: center; gap: var(--smg-sp-4); flex: 0 0 auto; }
            .smg-tb-center { flex: 1 1 auto; min-width: 0; display: flex; justify-content: center; }
            .smg-tb-logo {
                display: flex; align-items: center; height: 48px; flex: 0 0 auto; margin-right: var(--smg-sp-12);
                text-decoration: none; color: #fff; font-weight: 800;
                transition: transform var(--smg-dur-20) ease, filter var(--smg-dur-20) ease, height var(--smg-dur-20) cubic-bezier(0.16, 1, 0.3, 1);
            }
            .smg-tb-logo:hover {
                transform: scale(1.02);
                filter: drop-shadow(0 2px 14px var(--smg-w-22));
            }
            .smg-tb-logo img {
                height: 42px; width: auto; max-width: 220px; object-fit: contain; display: block;
                filter: drop-shadow(0 2px 8px var(--smg-k-45));
                transition: height var(--smg-dur-20) cubic-bezier(0.16, 1, 0.3, 1), filter var(--smg-dur-20) ease;
            }
            @media (max-width: 800px) {
                .smg-tb-logo { height: 36px; margin-right: var(--smg-sp-6); }
                .smg-tb-logo img { height: 30px; max-width: 140px; }
            }
            /* logo custom do SMG: wordmark "SMG" (G em rosa = acento da marca) */
            .smg-logo { display: inline-flex; align-items: center; }
            .smg-logo-word {
                font-size: var(--smg-fs-28); font-weight: 900; letter-spacing: 0.8px; color: #fff; line-height: 1;
                text-shadow: 0 2px 10px var(--smg-k-55);
                transition: font-size var(--smg-dur-20) cubic-bezier(0.16, 1, 0.3, 1);
            }
            .smg-logo-accent { color: #ff3d84; text-shadow: 0 0 16px rgba(255,61,132,0.5); }
            .smg-tb-nav { display: flex; align-items: center; gap: var(--smg-sp-4); }
            .smg-tb-item {
                position: relative;
                display: flex; align-items: center; gap: var(--smg-sp-8); height: 42px; padding: 0 var(--smg-sp-14);
                border-radius: var(--smg-r-12); border: none; background: transparent; color: var(--smg-w-85);
                font-size: var(--smg-fs-15); font-weight: 600; cursor: pointer; text-decoration: none; white-space: nowrap;
                transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease, height var(--smg-dur-20) cubic-bezier(0.16, 1, 0.3, 1);
            }
            .smg-tb-item:hover, .smg-tb-item.active { background: var(--smg-link-soft); color: #fff; }
            .smg-tb-ico { display: flex; align-items: center; }
            .smg-tb-ico svg { width: 18px; height: 18px; fill: none !important; }
            .smg-tb-caret { display: flex; align-items: center; margin-left: -2px; }
            .smg-tb-caret svg { width: 14px; height: 14px; opacity: .55; fill: none !important; }
            .smg-tb-item.active .smg-tb-caret { transform: rotate(180deg); }

            .smg-tb-actions { display: flex; align-items: center; gap: var(--smg-sp-4); flex: 0 0 auto; }
            .smg-tb-act {
                position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;
                border-radius: var(--smg-btn-r); border: none; background: transparent; color: var(--smg-w-85);
                cursor: pointer; text-decoration: none;
                transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease, width var(--smg-dur-20) cubic-bezier(0.16, 1, 0.3, 1), height var(--smg-dur-20) cubic-bezier(0.16, 1, 0.3, 1);
            }
            .smg-tb-act:hover { background: var(--smg-link-soft); color: #fff; }
            .smg-tb-act svg { width: 20px; height: 20px; fill: none !important; }
            @media (min-width: 801px) { #smg-topbar-wrap.floating #smg-tb-inner { height: 60px; }
                #smg-topbar-wrap.floating .smg-tb-logo { height: 42px; }
                #smg-topbar-wrap.floating .smg-tb-logo img { height: 36px; }
                #smg-topbar-wrap.floating .smg-logo-word { font-size: var(--smg-fs-24); }
                #smg-topbar-wrap.floating .smg-tb-item { height: 38px; padding: 0 var(--smg-sp-12); font-size: var(--smg-fs-14); }
                #smg-topbar-wrap.floating .smg-tb-act { width: 38px; height: 38px; }
            }
            /* search bar CENTRAL: cresce com a zona do meio mas capa em 600px e centraliza */
            .smg-tb-search {
                display: flex; align-items: center; gap: var(--smg-sp-12); width: 100%; max-width: 720px; height: 46px; padding: 0 var(--smg-sp-16); margin: 0;
                box-sizing: border-box; border-radius: var(--smg-r-14);
                border: 1px solid var(--smg-w-10); background: var(--smg-w-06);
                color: var(--smg-w-50); font-size: var(--smg-fs-15); font-weight: 500; cursor: text; white-space: nowrap; text-align: left;
                transition: background var(--smg-dur-15) ease, border-color var(--smg-dur-15) ease;
            }
            .smg-tb-search:hover { background: var(--smg-w-08); border-color: var(--smg-w-22); }
            .smg-tb-search:focus-within { background: var(--smg-w-10); border-color: var(--smg-link); }   /* foco na cor do tema */
            /* ===== experimento: nav CENTRAL + search como OVERLAY que ocupa a topbar ===== */
            .smg-tb-center--nav { justify-content: center; }
            .smg-tb-center--nav .smg-tb-nav { gap: var(--smg-sp-4); }
            .smg-tb-search--overlay {
                display: none !important;
                position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%) scale(0.99);
                width: auto; max-width: none; margin: 0; z-index: var(--smg-z-20);
                opacity: 0; pointer-events: none;
                transition: opacity var(--smg-dur-15) ease, transform var(--smg-dur-15) ease;
            }
            html.smg-search-open .smg-tb-search--overlay {
                display: flex !important;
                opacity: 1; pointer-events: auto; transform: translateY(-50%) scale(1);
            }
            /* ao abrir a busca, recolhe logo/nav/ações atrás do overlay (busca toma a topbar) */
            html.smg-search-open .smg-tb-left,
            html.smg-search-open .smg-tb-center--nav,
            html.smg-search-open .smg-tb-actions { opacity: 0; pointer-events: none; transition: opacity var(--smg-dur-15) ease; }
            .smg-search-clear {
                flex: 0 0 auto; width: 28px; height: 28px;
                display: inline-flex; align-items: center; justify-content: center;
                margin: 0 var(--smg-sp-2); border: 0; border-radius: var(--smg-r-8); background: transparent;
                color: var(--smg-w-50); cursor: pointer;
                transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease; padding: 0;
            }
            .smg-search-clear:hover { background: var(--smg-w-12); color: #fff; }
            .smg-search-clear svg { width: 14px; height: 14px; fill: none !important; }
            .smg-search-clear[hidden] { display: none !important; }
            /* SEARCH: chip de contexto (Reddit-style) + tooltip de comandos — valem na barra da topbar E no modal da dock */
            .smg-tb-search-chip, .smg-search-chip { flex: 0 0 auto; display: inline-flex; align-items: center; gap: var(--smg-sp-6); max-width: 42%; margin-right: var(--smg-sp-2); padding: var(--smg-sp-4) var(--smg-sp-6) var(--smg-sp-4) var(--smg-sp-12); border: 0; border-radius: var(--smg-chip-r); background: var(--smg-link-soft); color: var(--smg-link); font: inherit; font-size: var(--smg-fs-13); font-weight: 700; cursor: pointer; pointer-events: auto !important; z-index: var(--smg-z-2); }
            .smg-tb-search-chip[hidden], .smg-search-chip[hidden] { display: none !important; }   /* o display:inline-flex de autor vencia o [hidden] do browser → chip vazio aparecia fora de tópico/fórum */
            .smg-search-chip-k { flex: 0 0 auto; padding: var(--smg-sp-2) var(--smg-sp-6); border-radius: var(--smg-r-6); background: var(--smg-w-18); color: var(--smg-w-72); font-size: var(--smg-fs-10); font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; }   /* tag TÓPICO/FÓRUM antes do nome */
            .smg-search-chip-t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .smg-search-chip-x { flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: var(--smg-r-round); cursor: pointer; pointer-events: auto !important; z-index: var(--smg-z-2); opacity: 0.75; }
            .smg-search-chip-x:hover { background: var(--smg-w-22); opacity: 1; }
            .smg-search-chip-x svg { width: 12px; height: 12px; fill: none !important; }
            .smg-search-tabkey { flex: 0 0 auto; padding: var(--smg-sp-4) var(--smg-sp-8); border-radius: var(--smg-r-6); border: 1px solid var(--smg-w-14); background: var(--smg-w-06); color: var(--smg-w-55); font: 600 12px/1.4 -apple-system, system-ui, sans-serif; }
            /* paleta de comandos (Tab) */
            .smg-search-cmd { position: fixed; z-index: var(--smg-z-max); display: none; flex-direction: column; gap: var(--smg-sp-2); width: 280px; max-width: calc(100vw - 16px); padding: var(--smg-sp-6); border-radius: var(--smg-r-12); background: var(--smg-s1); border: 1px solid var(--smg-bd); box-shadow: var(--smg-shadow-3); }
            .smg-search-cmd.open { display: flex; }
            .smg-search-cmd-head { padding: var(--smg-sp-4) var(--smg-sp-8) var(--smg-sp-6); font-size: var(--smg-fs-11); font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--smg-w-40); }
            .smg-search-cmd-item { display: flex; align-items: center; gap: var(--smg-sp-10); width: 100%; padding: var(--smg-sp-8) var(--smg-sp-10); border: 0; border-radius: var(--smg-r-8); background: transparent; color: var(--smg-tx); font: inherit; font-size: var(--smg-fs-14); text-align: left; cursor: pointer; }
            .smg-search-cmd-item:hover, .smg-search-cmd-item.sel { background: var(--smg-link-soft); }
            .smg-search-cmd-item code { flex: 0 0 auto; min-width: 46px; padding: var(--smg-sp-2) var(--smg-sp-8); border-radius: var(--smg-r-6); background: var(--smg-w-08); color: var(--smg-link); font: 600 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; text-align: center; }
            .smg-search-cfg-portal { position: fixed; z-index: var(--smg-z-max); display: none; flex-direction: column; gap: var(--smg-sp-2); min-width: 244px; max-width: 320px; padding: var(--smg-sp-8); border-radius: var(--smg-pop-r); background: var(--smg-s1); border: 1px solid var(--smg-bd); box-shadow: var(--smg-pop-shadow); }
            .smg-search-cfg-portal.open { display: flex; }
            .smg-search-cfg-head { padding: var(--smg-sp-4) var(--smg-sp-8) var(--smg-sp-6); font-size: var(--smg-fs-11); font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--smg-w-40); }
            .smg-search-cfg-row { display: flex; align-items: center; gap: var(--smg-sp-10); padding: var(--smg-sp-8); border-radius: var(--smg-r-8); font-size: var(--smg-fs-14); color: var(--smg-tx); cursor: pointer; }
            .smg-search-cfg-row:hover { background: var(--smg-w-06); }
            .smg-search-cfg-row input { flex: 0 0 auto; width: 16px; height: 16px; accent-color: var(--smg-link); cursor: pointer; }   /* mobile usa o modal da dock, não o overlay da topbar */
            .smg-tb-search-ico { display: inline-flex; align-items: center; flex: 0 0 auto; }
            .smg-tb-search-ico svg { width: 18px; height: 18px; opacity: 0.7; fill: none !important; }
            .smg-tb-search-input {
                flex: 1 1 auto; min-width: 0; height: 100%;
                border: 0; background: transparent; outline: none; padding: 0; margin: 0;
                color: #fff; font: inherit;
            }
            .smg-tb-search-input::placeholder { color: var(--smg-w-50); }
            .smg-tb-badge {
                position: absolute; top: 3px; right: 3px; min-width: 16px; height: 16px; padding: 0 var(--smg-sp-4);
                border-radius: var(--smg-badge-r); background: #e0245e; color: #fff; font-size: var(--smg-fs-10); font-weight: 700;
                display: flex; align-items: center; justify-content: center; box-sizing: border-box;
                font-variant-numeric: tabular-nums;
            }
            /* CONTA: mesma caixa de 40px dos outros ícones da direita (busca/painel), com o avatar
               desenhado a 28px dentro. Antes era um círculo de 38px com anel — do lado de ícones de
               traço de 20px ele lia quase o dobro do tamanho e desalinhava a fileira. */
            .smg-tb-account {
                width: 40px; height: 40px; flex: 0 0 auto; border-radius: var(--smg-r-10); cursor: pointer; padding: 0;
                border: 0; background: transparent;
                display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: var(--smg-fs-13);
                transition: background var(--smg-dur-15) ease;
            }
            .smg-tb-account:hover { background: var(--smg-link-soft); }
            .smg-tb-account img { width: 100%; height: 100%; object-fit: cover; }
            .smg-tb-account .avatar,
            .smg-tb-account > img {
                width: 28px !important; height: 28px !important; margin: 0 !important;
                border-radius: var(--smg-r-round) !important; display: block; overflow: hidden;
                box-shadow: 0 0 0 1px var(--smg-w-18);   /* anel fino: separa do fundo sem virar botão */
            }
            .smg-tb-account .avatar > span,
            .smg-tb-account .avatar > img { width: 28px !important; height: 28px !important; display: flex !important; align-items: center; justify-content: center; font-size: var(--smg-fs-13) !important; line-height: 28px !important; border-radius: var(--smg-r-round) !important; }
            /* VISITANTE: Cadastrar (texto) + Entrar (preenchido, na cor da marca) no lugar do avatar/dropdown */
            .smg-tb-authlink {
                display: inline-flex; align-items: center; height: 36px; padding: 0 var(--smg-sp-12); flex: 0 0 auto;
                border-radius: var(--smg-r-10); color: var(--smg-w-72); font-size: var(--smg-fs-14); font-weight: 700;
                text-decoration: none; white-space: nowrap; transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease;
            }
            .smg-tb-authlink:hover { background: var(--smg-w-10); color: #fff; }
            .smg-tb-loginbtn {
                display: inline-flex; align-items: center; gap: var(--smg-sp-8); height: 36px; padding: 0 var(--smg-sp-16); flex: 0 0 auto;
                border-radius: var(--smg-btn-r); border: 0; white-space: nowrap;
                background: var(--smg-link-strong); color: #fff !important;
                font-size: var(--smg-fs-14); font-weight: 800; text-decoration: none !important;
                transition: filter var(--smg-dur-15) ease, transform var(--smg-dur-12) ease;
            }
            .smg-tb-loginbtn:hover { filter: brightness(1.12); }
            .smg-tb-loginbtn:active { transform: scale(0.97); }
            .smg-tb-loginbtn .smg-tb-ico { font-size: var(--smg-fs-16); }   /* espaço curto: sobra o Entrar */

            /* popovers agrupados */
            .smg-tb-pop {
                position: absolute; top: calc(100% + 8px); left: 0; min-width: 290px; max-width: 340px;
                padding: var(--smg-sp-8); border-radius: var(--smg-pop-r);
                background: var(--smg-s1);
                border: 1px solid var(--smg-w-10);
                box-shadow: var(--smg-pop-shadow);
                opacity: 0; visibility: hidden; transform: translateY(6px);
                transition: opacity var(--smg-dur-15) ease, transform var(--smg-dur-15) ease, visibility var(--smg-dur-15);
                z-index: var(--smg-z-40);
            }
            .smg-tb-pop.open { opacity: 1; visibility: visible; transform: translateY(0); z-index: var(--smg-z-40); }
            .smg-tb-pop--account { min-width: 230px; max-width: 280px; }
            .smg-tb-acchead { display: flex; align-items: center; gap: var(--smg-sp-8); padding: var(--smg-sp-8) var(--smg-sp-10) var(--smg-sp-8); font-size: var(--smg-fs-13); font-weight: 700; color: #fff; border-bottom: 1px solid var(--smg-w-08); margin-bottom: var(--smg-sp-4); }
            /* pílula com quantas NÃO-LIDAS vieram nesta busca (some quando zera) */
            .smg-tb-poprow { display: flex; align-items: center; gap: var(--smg-sp-12); padding: var(--smg-sp-10) var(--smg-sp-10); border-radius: var(--smg-r-12); text-decoration: none; color: #fff; transition: background var(--smg-dur-12) ease; }
            .smg-tb-poprow:hover { background: var(--smg-link-soft); }
            .smg-tb-poprow--sm { gap: var(--smg-sp-12); padding: var(--smg-sp-8) var(--smg-sp-10); }
            .smg-tb-popico { flex: 0 0 auto; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: var(--smg-r-10); background: var(--smg-w-06); color: var(--smg-w-85); }
            .smg-tb-poprow--sm .smg-tb-popico { width: 28px; height: 28px; border-radius: var(--smg-r-8); }
            .smg-tb-popico svg { width: 18px; height: 18px; fill: none !important; }
            .smg-tb-poprow--sm .smg-tb-popico svg { width: 16px; height: 16px; }
            .smg-tb-poptext { display: flex; flex-direction: column; gap: var(--smg-sp-2); min-width: 0; }
            .smg-tb-poptitle { font-size: var(--smg-fs-14); font-weight: 600; color: #fff; }
            .smg-tb-popdesc { font-size: var(--smg-fs-12); color: var(--smg-w-50); }
            .smg-tb-popdiv { height: 1px; background: var(--smg-w-08); margin: var(--smg-sp-6) var(--smg-sp-8); }
            /* ===== mega-menu do Discover (grid 2-col + painel destacado, estilo Vimeo) ===== */
            .smg-tb-pop--mega { min-width: 660px; max-width: 720px; padding: var(--smg-sp-18); }
            .smg-tb-mega-cols { display: flex; gap: var(--smg-sp-18); align-items: stretch; }
            .smg-tb-mega-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: var(--smg-sp-16); }
            .smg-tb-mega-label { font-size: var(--smg-fs-11); font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: var(--smg-w-40); padding: 0 var(--smg-sp-8) var(--smg-sp-10); }
            .smg-tb-mega-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--smg-sp-2); }
            .smg-tb-megaitem { display: flex; align-items: center; gap: var(--smg-sp-12); padding: var(--smg-sp-10) var(--smg-sp-10); border-radius: var(--smg-r-12); text-decoration: none; color: #fff; transition: background var(--smg-dur-12) ease; }
            .smg-tb-megaitem:hover { background: var(--smg-link-soft); }
            .smg-tb-megaico { flex: 0 0 auto; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: var(--smg-r-10); background: var(--smg-w-06); color: var(--smg-w-85); transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease, transform var(--smg-dur-15) ease; }
            .smg-tb-megaitem:hover .smg-tb-megaico { background: var(--smg-link); color: #fff; transform: translateY(-1px); }
            .smg-tb-megaico svg { width: 18px; height: 18px; fill: none !important; }
            .smg-tb-megatext { display: flex; flex-direction: column; gap: var(--smg-sp-2); min-width: 0; }
            .smg-tb-megatitle { font-size: var(--smg-fs-14); font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .smg-tb-megadesc { font-size: var(--smg-fs-12); color: var(--smg-w-40); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            /* painel destacado à direita (promove a Timeline) */
            .smg-tb-mega-feat { flex: 0 0 226px; display: flex; flex-direction: column; border-radius: var(--smg-r-14); overflow: hidden; text-decoration: none; background: var(--smg-s2); border: 1px solid var(--smg-bd); transition: border-color var(--smg-dur-15) ease, transform var(--smg-dur-15) ease, box-shadow var(--smg-dur-15) ease; }
            .smg-tb-mega-feat:hover { border-color: var(--smg-bd2); transform: translateY(-2px); box-shadow: var(--smg-shadow-2); }
            .smg-tb-mega-feat-art { height: 112px; display: flex; align-items: center; justify-content: center; color: #fff; background: radial-gradient(120% 110% at 28% 18%, var(--smg-link), transparent 62%), linear-gradient(155deg, var(--smg-s3), var(--smg-s1)); }
            .smg-tb-mega-feat-art svg { width: 34px; height: 34px; fill: none !important; opacity: .95; }
            .smg-tb-mega-feat-body { padding: var(--smg-sp-14) var(--smg-sp-16) var(--smg-sp-16); display: flex; flex-direction: column; gap: var(--smg-sp-6); }
            .smg-tb-mega-feat-title { font-size: var(--smg-fs-15); font-weight: 800; color: #fff; }
            .smg-tb-mega-feat-desc { font-size: var(--smg-fs-12); line-height: 1.45; color: var(--smg-w-50); }
            .smg-tb-mega-feat-cta { margin-top: var(--smg-sp-4); display: inline-flex; align-items: center; gap: var(--smg-sp-6); font-size: var(--smg-fs-13); font-weight: 700; color: var(--smg-link); }
            .smg-tb-mega-feat-cta svg { width: 14px; height: 14px; fill: none !important; }
            @media (max-width: 800px) {
                html.smg-topbar-on :target { scroll-margin-top: 66px; } #smg-tb-inner { max-width: calc(100% - 24px); height: 48px; }
                .smg-logo-word { font-size: var(--smg-fs-20); } .smg-tb-authlink { display: none; }
                .smg-tb-pop--mega { min-width: 0; width: calc(100vw - 16px); max-width: calc(100vw - 16px); padding: var(--smg-sp-14); }
                .smg-tb-mega-cols { flex-direction: column; gap: var(--smg-sp-14); }
                .smg-tb-mega-feat { flex-basis: auto; }
                .smg-tb-mega-feat-art { height: 92px; }
                .smg-tb-mega-grid { grid-template-columns: 1fr; }
            }

            /* lista nativa do XF embutida (sheet mobile de alertas + painel lateral) */
            .smg-tb-listbody { position: relative; max-height: 62vh; overflow-y: auto; margin: var(--smg-sp-2) 0; }
            .smg-tb-listbody::-webkit-scrollbar { width: 8px; }
            .smg-tb-listbody::-webkit-scrollbar-thumb { background: var(--smg-w-14); border-radius: var(--smg-r-4); }
            .smg-tb-listbody .listPlain { list-style: none; margin: 0; padding: 0; }
            .smg-tb-listbody .menu-row { display: block; padding: var(--smg-sp-10) var(--smg-sp-8); border: none !important; border-radius: var(--smg-r-10); }
            .smg-tb-listbody .menu-row + .menu-row { border-top: 1px solid var(--smg-w-06) !important; }
            .smg-tb-listbody .menu-row:hover { background: var(--smg-w-06); }
            .smg-tb-listbody .contentRow-main { min-width: 0; font-size: var(--smg-fs-13); line-height: 1.45; color: var(--smg-w-85); }
            .smg-tb-listbody .contentRow-minor { font-size: var(--smg-fs-12); color: var(--smg-w-50); margin-top: var(--smg-sp-2); }
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
                z-index: var(--smg-z-sheet-4) !important;
                width: auto !important;
                max-width: min(380px, calc(100vw - 32px)) !important;
                margin: 0 !important;
                padding: var(--smg-sp-12) var(--smg-sp-16) !important;
                border: 1px solid var(--smg-w-12) !important;
                border-radius: var(--smg-r-14) !important;
                background: var(--smg-s1) !important;
                color: #fff !important;
                box-shadow: var(--smg-shadow-3) !important;
                font-size: var(--smg-fs-14) !important;
                line-height: 1.4 !important;
            }
            .flashMessage .flashMessage-content { color: inherit !important; }
            @media (max-width: 600px) { .smg-tb-search--overlay, html.smg-search-open .smg-tb-search--overlay { display: none !important; }
                .flashMessage { right: 12px !important; left: 12px !important; bottom: 76px !important; max-width: none !important; }
            }
            /* Tooltip de bookmark: cartão, não a caixa nativa estreita. */
            .tooltip--bookmark { z-index: var(--smg-z-sheet-5) !important; max-width: min(380px, calc(100vw - 24px)) !important; }
            .tooltip--bookmark .tooltip-content {
                background: var(--smg-s1) !important;
                border: 1px solid var(--smg-w-12) !important;
                border-radius: var(--smg-r-16) !important;
                box-shadow: var(--smg-shadow-4) !important;
                color: #fff !important;
                overflow: hidden;
            }
            .tooltip--bookmark .tooltip-content-inner { padding: var(--smg-sp-4) var(--smg-sp-4) var(--smg-sp-8) !important; }
            .tooltip--bookmark .block-minorHeader {
                background: transparent !important;
                border: 0 !important;
                color: #fff !important;
                font-size: var(--smg-fs-15) !important;
                font-weight: 750 !important;
                padding: var(--smg-sp-14) var(--smg-sp-14) var(--smg-sp-4) !important;
            }
            .tooltip--bookmark .block-body { background: transparent !important; }
            .tooltip--bookmark .block-row { padding: var(--smg-sp-8) var(--smg-sp-14) !important; }
            .tooltip--bookmark .formRow-label { color: var(--smg-w-85) !important; font-weight: 650 !important; }
            .tooltip--bookmark .formRow-hint { color: var(--smg-w-40) !important; }
            .tooltip--bookmark .formRow-explain { color: var(--smg-w-40) !important; font-size: var(--smg-fs-12) !important; }
            .tooltip--bookmark textarea.input,
            .tooltip--bookmark .tagify,
            .tooltip--bookmark input.input {
                background: var(--smg-w-04) !important;
                border: 1px solid var(--smg-w-12) !important;
                border-radius: var(--smg-r-10) !important;
                color: #fff !important;
            }
            .tooltip--bookmark .formButtonGroup { margin: 0 !important; }
            .tooltip--bookmark .button {
                border-radius: var(--smg-r-10) !important;
                min-height: 36px;
            }
            .tooltip--bookmark .button--primary {
                background: var(--smg-link) !important;
                border-color: transparent !important;
                color: #fff !important;
            }
            .tooltip--bookmark .tooltip-arrow { display: none !important; }
            .notices, .notices--block {
                list-style: none !important;
                padding: 0 !important;
                margin: 0 0 var(--smg-sp-12) 0 !important;
                display: flex !important;
                flex-direction: column !important;
                gap: var(--smg-sp-8) !important;
            }
            .notice {
                position: relative !important;
                display: flex !important;
                align-items: center !important;
                gap: var(--smg-sp-12) !important;
                padding: var(--smg-sp-10) var(--smg-sp-14) !important;
                border-radius: var(--smg-r-12) !important;
                background: var(--smg-w-04) !important;
                border: 1px solid var(--smg-w-08) !important;
                box-shadow: var(--smg-shadow-1) !important;
                color: var(--smg-w-85) !important;
                font-size: var(--smg-fs-13) !important;
                font-weight: 500 !important;
                line-height: 1.45 !important;
            }
            .notice::before {
                content: "" !important;
                position: absolute !important;
                left: 0 !important;
                top: 6px !important;
                bottom: 6px !important;
                width: 3px !important;
                border-radius: 0 var(--smg-r-4) var(--smg-r-4) 0 !important;
                background: var(--smg-link) !important;
            }
            .notice-content {
                flex: 1 1 auto !important;
                min-width: 0 !important;
                display: flex !important;
                align-items: center !important;
                flex-wrap: wrap !important;
                gap: var(--smg-sp-6) !important;
                color: var(--smg-w-85) !important;
                font-size: var(--smg-fs-13) !important;
            }
            .notice-content a {
                color: var(--smg-link) !important;
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
                border-radius: var(--smg-r-4) !important;
                display: block !important;
            }
            .notice-dismiss, a.notice-dismiss {
                position: static !important;
                margin-left: auto !important;
                flex: 0 0 22px !important;
                width: 22px !important;
                height: 22px !important;
                border-radius: var(--smg-r-round) !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                color: var(--smg-w-40) !important;
                background: var(--smg-w-06) !important;
                text-decoration: none !important;
                transition: background var(--smg-dur-12) ease, color var(--smg-dur-12) ease, transform var(--smg-dur-12) ease !important;
            }
            .notice-dismiss:hover {
                background: var(--smg-w-14) !important;
                color: #fff !important;
                transform: scale(1.08) !important;
            }
            .notice-dismiss::before {
                content: "✕" !important;
                font-size: var(--smg-fs-10) !important;
                font-weight: 700 !important;
                line-height: 1 !important;
            }
`;