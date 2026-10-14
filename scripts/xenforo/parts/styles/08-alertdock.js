    // STYLE CONTEXT: Alerts dock
    const CSS_ALERTDOCK = `/* ============ NOTIFICAÇÕES DOCKED (rail fixo à direita) ============ */
            /* o painel EMPURRA a página: body ganha padding, a topbar termina onde o rail começa e a
               dock (pílula centralizada) desloca meio-rail pra esquerda → nada fica escondido atrás. */
            html { --smg-ald-w: 360px; }
            #smg-aldock {
                position: fixed; top: 0; right: 0; bottom: 0; width: var(--smg-ald-w);
                z-index: 101;   /* 1 acima da topbar: a borda esquerda do rail é a divisa da página */
                display: none; flex-direction: column; box-sizing: border-box;
                background: var(--smg-bg); border-left: 1px solid rgba(255,255,255,0.09);
                box-shadow: -10px 0 30px rgba(0,0,0,0.35);
            }
            html.smg-aldock-on #smg-aldock { display: flex; }
            html.smg-aldock-on body { padding-right: var(--smg-ald-w) !important; }
            html.smg-aldock-on #smg-topbar-wrap { right: var(--smg-ald-w); width: auto; }
            html.smg-aldock-on #smg-post-nav-wrapper { margin-left: calc(var(--smg-ald-w) / -2); }
            html.smg-aldock-resizing { cursor: col-resize; user-select: none; }
            html.smg-aldock-resizing #smg-aldock { transition: none; }
            /* pegador de largura: faixa fina na borda esquerda (acende no hover/arrasto) */
            .smg-aldock-grip {
                position: absolute; left: -3px; top: 0; bottom: 0; width: 7px; z-index: 3;
                cursor: col-resize; background: transparent; transition: background .15s ease;
            }
            .smg-aldock-grip:hover, html.smg-aldock-resizing .smg-aldock-grip { background: var(--smg-link-soft); }
            /* cabeçalho: título + contador + ações (atualizar · marcar tudo · fechar) */
            .smg-aldock-head {
                flex: 0 0 auto; display: flex; align-items: center; gap: 8px;
                height: 62px; padding: 0 8px 0 16px; box-sizing: border-box;
                border-bottom: 1px solid rgba(255,255,255,0.07);
            }
            .smg-aldock-title { display: flex; align-items: center; gap: 8px; margin-right: auto; font-size: 16px; font-weight: 800; color: #fff; }
            .smg-aldock-n {
                padding: 1px 8px; border-radius: 999px; font-size: 11px; font-weight: 800; font-variant-numeric: tabular-nums;
                background: var(--smg-link-soft); color: var(--smg-link);
            }
            .smg-aldock-n[hidden] { display: none; }
            .smg-aldock-acts { display: flex; align-items: center; gap: 6px; }
            .smg-aldock-btn {
                display: inline-flex; align-items: center; justify-content: center;
                width: 32px; height: 32px; padding: 0; border: 0; border-radius: 8px;
                background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); font-size: 16px; cursor: pointer;
                -webkit-appearance: none; appearance: none; transition: background .15s ease, color .15s ease, transform .1s ease;
            }
            .smg-aldock-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
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
            /* navbar mobile: traço mais leve (depois do 2px acima, senão nunca vale) */
            @media (max-width: 600px) { .smg-nav-ico svg, .smg-nav-ico svg * { stroke-width: 1.9 !important; } }
            /* enquanto busca alertas novos: o ícone de atualizar gira (a lista atual continua na tela) */
            #smg-aldock.smg-aldock--refreshing .smg-aldock-refresh svg { animation: smg-ald-spin .9s linear infinite; }
            @keyframes smg-ald-spin { to { transform: rotate(360deg); } }
            /* corpo: ocupa a altura toda (o .smg-tb-listbody base é capado em 62vh, que é do popover) */
            .smg-aldock-body { flex: 1 1 auto; max-height: none !important; margin: 0 !important; overflow-y: auto; overscroll-behavior: contain; }
            .smg-aldock-list { list-style: none; margin: 0; padding: 0; }
            .smg-aldock-skel-row {
                position: relative; display: flex; align-items: center; gap: 10px; min-height: 74px;
                padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); overflow: hidden;
            }
            .smg-aldock-skel-thumb { position: relative; flex: 0 0 54px; width: 54px; height: 54px; border-radius: 12px; background: rgba(255,255,255,0.07); overflow: hidden; }
            .smg-aldock-skel-copy { position: relative; display: flex; flex: 1 1 auto; flex-direction: column; gap: 8px; overflow: hidden; }
            .smg-aldock-skel-line { position: relative; width: 82%; height: 10px; border-radius: 5px; background: rgba(255,255,255,0.09); overflow: hidden; }
            .smg-aldock-skel-line.short { width: 54%; height: 8px; }
            .smg-aldock-skel-thumb::after,
            .smg-aldock-skel-line::after {
                content: ""; position: absolute; inset: 0; transform: translateX(-100%);
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.075), transparent);
                animation: smg-skel-shimmer 1.3s ease-in-out infinite;
            }
            .smg-aldock-status { padding: 16px 14px 22px; text-align: center; font-size: 12.5px; color: rgba(255,255,255,0.38); }
            .smg-aldock-status--busy { color: rgba(255,255,255,0.55); }
            .smg-aldock-foot {
                flex: 0 0 auto; display: flex; justify-content: space-between; align-items: center;
                padding: 8px 10px; border-top: 1px solid rgba(255,255,255,0.07);
            }
            .smg-aldock-foot a { padding: 6px 10px; border-radius: 8px; color: rgba(255,255,255,0.65); font-size: 13px; font-weight: 600; text-decoration: none; }
            .smg-aldock-foot a:hover { background: rgba(255,255,255,0.09); color: #fff; }
            /* botão do PAINEL LATERAL — controle único do rail, logo à direita do avatar */
            .smg-tb-bellbtn.active,
            html.smg-aldock-on .smg-tb-bellbtn { background: var(--smg-link-soft); color: var(--smg-link); }
            /* faixa do meio: o rail comeria o conteúdo e não é tela cheia → some (o JS também
               desdocka, isto é a rede de segurança). O celular é tratado logo abaixo. */
            @media (max-width: 1099px) and (min-width: 601px) {
                #smg-aldock { display: none !important; }
                html.smg-aldock-on body { padding-right: 0 !important; }
                html.smg-aldock-on #smg-topbar-wrap { right: 0; width: 100%; }
                html.smg-aldock-on #smg-post-nav-wrapper { margin-left: 0; }
                .smg-tb-bellbtn { display: none !important; }
            }
            /* CELULAR: o mesmo rail, em TELA CHEIA (aberto pelo sino da navbar). Nada de empurrar a
               página — aqui ele cobre tudo, então body/topbar/dock ficam como estavam. */
            @media (max-width: 600px) {
                #smg-aldock {
                    top: 0; right: 0; bottom: 0; left: 0; width: 100%;
                    z-index: 1000001;                 /* acima da navbar e dos sheets */
                    border-left: 0; box-shadow: none;
                }
                html.smg-aldock-on body { padding-right: 0 !important; }
                html.smg-aldock-on #smg-topbar-wrap { right: 0; width: 100%; }
                html.smg-aldock-on #smg-post-nav-wrapper { margin-left: 0; }
                .smg-aldock-grip { display: none !important; }        /* não se arrasta largura em tela cheia */
                .smg-tb-bellbtn { display: none !important; }         /* o controle é o sino da navbar inferior */
                /* respeita as barras do sistema (notch em cima, gesto embaixo) */
                .smg-aldock-head { padding-top: calc(10px + env(safe-area-inset-top)); }
                .smg-aldock-foot { padding-bottom: calc(8px + env(safe-area-inset-bottom)); }
            }
        `;
