    // styles/08-alertdock.js
    // Owns: CSS for alerts rail.
    // Exposes: CSS_ALERTDOCK.
    // Depends on: --smg-* tokens from styles/01-base.js; composed by core/05-styles.js (order matters).
    // STYLE CONTEXT: Alerts dock
    const CSS_ALERTDOCK = `/* ============ NOTIFICAÇÕES DOCKED (rail fixo à direita) ============ */
            /* o painel EMPURRA a página: body ganha padding, a topbar termina onde o rail começa e a
               dock (pílula centralizada) desloca meio-rail pra esquerda → nada fica escondido atrás. */
            html { --smg-ald-w: 360px; }
            #smg-aldock {
                position: fixed; top: 0; right: 0; bottom: 0; width: var(--smg-ald-w);
                z-index: var(--smg-z-aldock);   /* 1 acima da topbar: a borda esquerda do rail é a divisa da página */
                display: none; flex-direction: column; box-sizing: border-box;
                background: var(--smg-bg); border-left: 1px solid var(--smg-w-10);
                box-shadow: -10px 0 30px var(--smg-k-35);
            }
            html.smg-aldock-on #smg-aldock { display: flex; }
            html.smg-aldock-on body { padding-right: var(--smg-ald-w) !important; }
            html.smg-aldock-on #smg-topbar-wrap { right: var(--smg-ald-w); width: auto; }
            html.smg-aldock-on #smg-post-nav-wrapper { margin-left: calc(var(--smg-ald-w) / -2); }
            html.smg-aldock-resizing { cursor: col-resize; user-select: none; }
            html.smg-aldock-resizing #smg-aldock { transition: none; }
            /* pegador de largura: faixa fina na borda esquerda (acende no hover/arrasto) */
            .smg-aldock-grip {
                position: absolute; left: -3px; top: 0; bottom: 0; width: 7px; z-index: var(--smg-z-3);
                cursor: col-resize; background: transparent; transition: background var(--smg-dur-15) ease;
            }
            .smg-aldock-grip:hover, html.smg-aldock-resizing .smg-aldock-grip { background: var(--smg-link-soft); }
            /* cabeçalho: título + contador + ações (atualizar · marcar tudo · fechar) */
            .smg-aldock-head {
                flex: 0 0 auto; display: flex; align-items: center; gap: var(--smg-sp-8);
                height: 62px; padding: 0 var(--smg-sp-8) 0 var(--smg-sp-16); box-sizing: border-box;
                border-bottom: 1px solid var(--smg-w-08);
            }
            .smg-aldock-title { display: flex; align-items: center; gap: var(--smg-sp-8); margin-right: auto; font-size: var(--smg-fs-16); font-weight: 800; color: #fff; }
            .smg-aldock-n {
                padding: var(--smg-sp-2) var(--smg-sp-8); border-radius: var(--smg-badge-r); font-size: var(--smg-fs-11); font-weight: 800; font-variant-numeric: tabular-nums;
                background: var(--smg-link-soft); color: var(--smg-link);
            }
            .smg-aldock-n[hidden] { display: none; }
            .smg-aldock-acts { display: flex; align-items: center; gap: var(--smg-sp-6); }
            .smg-aldock-btn {
                display: inline-flex; align-items: center; justify-content: center;
                width: 32px; height: 32px; padding: 0; border: 0; border-radius: var(--smg-btn-r);
                background: var(--smg-w-06); color: var(--smg-w-72); font-size: var(--smg-fs-16); cursor: pointer;
                -webkit-appearance: none; appearance: none; transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease, transform var(--smg-dur-12) ease;
            }
            .smg-aldock-btn:hover { background: var(--smg-w-12); color: #fff; }
            .smg-aldock-btn:active { transform: scale(0.92); }
            .smg-aldock-btn[data-busy] { opacity: 0.45; pointer-events: none; }
            .smg-aldock-btn svg { width: 16px; height: 16px; display: block; }
            #smg-aldock svg,
            #smg-aldock svg *,
            #smg-aldock .smg-aldock-btn svg,
            #smg-aldock .smg-aldock-btn svg *,
            .smg-aldock-acts svg,
            .smg-aldock-acts svg *,
            .smg-aldock-acts button svg,
            .smg-aldock-acts button svg *,
            .smg-nav-ico svg,
            .smg-nav-ico svg *,
            svg.smg-svg-lucide,
            svg.smg-svg-lucide * {
                fill: none !important;
                stroke: currentColor !important;
                stroke-width: 2px !important;
            }
            /* enquanto busca alertas novos: o ícone de atualizar gira (a lista atual continua na tela) */
            #smg-aldock.smg-aldock--refreshing .smg-aldock-refresh svg { animation: smg-ald-spin .9s linear infinite; }
            @keyframes smg-ald-spin { to { transform: rotate(360deg); } }
            /* corpo: ocupa a altura toda (o .smg-tb-listbody base é capado em 62vh, que é do popover) */
            .smg-aldock-body { flex: 1 1 auto; max-height: none !important; margin: 0 !important; overflow-y: auto; overscroll-behavior: contain; }
            .smg-aldock-list { list-style: none; margin: 0; padding: 0; }
            .smg-aldock-skel-row { list-style: none; }   /* a linha é a MESMA do skeleton do rail (paintRailRow, 09-paint) */
            .smg-aldock-status { padding: var(--smg-sp-16) var(--smg-sp-14) var(--smg-sp-24); text-align: center; font-size: var(--smg-fs-13); color: var(--smg-w-40); }
            .smg-aldock-status--busy { color: var(--smg-w-55); }
            .smg-aldock-foot {
                flex: 0 0 auto; display: flex; justify-content: space-between; align-items: center;
                padding: var(--smg-sp-8) var(--smg-sp-10); border-top: 1px solid var(--smg-w-08);
            }
            .smg-aldock-foot a { padding: var(--smg-sp-6) var(--smg-sp-10); border-radius: var(--smg-r-8); color: var(--smg-w-60); font-size: var(--smg-fs-13); font-weight: 600; text-decoration: none; }
            .smg-aldock-foot a:hover { background: var(--smg-w-10); color: #fff; }
            /* botão do PAINEL LATERAL — controle único do rail, logo à direita do avatar. Aberto = ícone na cor do
               tema, SEM caixa preenchida (mesmo tratamento da busca e do avatar; o fundo só no hover, como eles) */
            .smg-tb-bellbtn.active,
            html.smg-aldock-on .smg-tb-bellbtn { color: var(--smg-link); }
            /* faixa do meio: o rail comeria o conteúdo e não é tela cheia → some (o JS também
               desdocka, isto é a rede de segurança). O celular é tratado logo abaixo. */
            @media (max-width: 1100px) and (min-width: 601px) {
                #smg-aldock { display: none !important; }
                html.smg-aldock-on body { padding-right: 0 !important; }
                html.smg-aldock-on #smg-topbar-wrap { right: 0; width: 100%; }
                html.smg-aldock-on #smg-post-nav-wrapper { margin-left: 0; }
                .smg-tb-bellbtn { display: none !important; }
            }
            /* puxador e scrim do drawer: só existem no celular */
            .smg-aldock-handle, .smg-aldock-scrim { display: none; }
            /* CELULAR: o mesmo rail vira um DRAWER (aberto pelo sino da navbar) — metade da tela, arrasta pelo
               topo até a altura cheia ou pra baixo pra fechar; tocar no scrim fecha. Nada de empurrar a
               página: body/topbar/dock ficam como estavam. Alturas = as do drawer de conta (css-notices). */
            @media (max-width: 600px) { .smg-nav-ico svg, .smg-nav-ico svg * { stroke-width: 1.9 !important; }
                #smg-aldock {
                    top: auto; right: 0; bottom: 0; left: 0; width: 100%;
                    height: var(--smg-drawer-half); max-height: var(--smg-drawer-full);
                    z-index: var(--smg-z-sheet-1);                 /* acima da navbar e dos sheets */
                    border-left: 0; border-top: 1px solid var(--smg-w-10);
                    border-radius: var(--smg-sheet-r) var(--smg-sheet-r) 0 0;
                    background: var(--smg-s1); box-shadow: var(--smg-sheet-shadow);
                    transition: height var(--smg-dur-30) cubic-bezier(.2,.8,.3,1), transform var(--smg-dur-30) cubic-bezier(.2,.8,.3,1);
                }
                #smg-aldock.is-full { height: var(--smg-drawer-full); }
                /* acima do scrim e da navbar: vence o z-index do gate de paint (09-paint, html.smg-sidebar-ready #smg-aldock) */
                html.smg-aldock-on body > #smg-aldock { z-index: var(--smg-z-sheet-1) !important; }
                .smg-aldock-handle { display: block; margin-top: var(--smg-sp-8); margin-bottom: 0; }
                html.smg-aldock-on .smg-aldock-scrim {
                    display: block; position: fixed; inset: 0; z-index: var(--smg-z-sheet);
                    background: var(--smg-k-55); -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px);
                }
                html.smg-aldock-on body { padding-right: 0 !important; }
                html.smg-aldock-on #smg-topbar-wrap { right: 0; width: 100%; }
                html.smg-aldock-on #smg-post-nav-wrapper { margin-left: 0; }
                .smg-aldock-grip { display: none !important; }        /* largura não se arrasta no celular */
                .smg-tb-bellbtn { display: none !important; }         /* o controle é o sino da navbar inferior */
                .smg-aldock-head { height: 52px; border-bottom-color: var(--smg-w-06); }
                .smg-aldock-foot { padding-bottom: calc(8px + env(safe-area-inset-bottom)); }
            }
        `;
