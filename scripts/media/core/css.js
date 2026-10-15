    /* ===================== CORE: CSS DE COMPONENTES (scripts/media/core/css.js) ===================== */
    // CSS dos componentes compartilhados (player, foto, stage, sidebar/playlist, mobile, actionbar, datas,
    // grupos, placeholders, texto, toast), vindo do bunkr e parametrizado por prefixo de classe e accent.
    // t = { p, accent, accentRgb ("r,g,b"), accentLight, onAccent }. Cada host interpola os segmentos no
    // seu próprio CSS (mantendo a ordem da cascata) e acrescenta só os overrides dele.
    function mediaComponentCSS(t) {
        const P = t.p, rgbS = t.accentRgb.replace(/,/g, ", ");
        return {
            player: `        /* ===== v2.7 — PLAYER MODERNO (accent roxo, estilo YouTube Pro) + SIDEBAR PLAYLIST ===== */
        :root { --${P}-accent: ${t.accent}; --${P}-accent-rgb: ${rgbS}; }
        .${P}-host { position: relative; width: 100%; height: 100%; max-width: 100%; max-height: 100%; background: #000; border-radius: 0 !important; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .${P}-video { width: 100% !important; height: 100% !important; max-width: 100% !important; max-height: 100% !important; object-fit: contain !important; background: #000 !important; border-radius: 0 !important; outline: none; cursor: pointer; display: block; }
        
        /* Big Play central */
        .${P}-plc-flash { position: absolute; inset: 0; z-index: 2; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .2s ease; }
        .${P}-pl:not(.is-playing):not(.is-buffering) .${P}-plc-flash { opacity: 1; }
        .${P}-plc-play { width: 68px; height: 68px; border: 1px solid rgba(255,255,255,.18); border-radius: 50%; cursor: pointer; padding: 0; background: rgba(14,16,22,.75); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(0,0,0,.5); transition: transform .14s cubic-bezier(0.4, 0, 0.2, 1), background .14s ease, border-color .14s ease; pointer-events: none; }
        .${P}-plc-play svg { width: 28px; height: 28px; margin-left: 3px; fill: currentColor; }
        .${P}-pl:not(.is-playing) .${P}-plc-play { pointer-events: auto; }
        .${P}-plc-play:hover { transform: scale(1.1); background: rgba(22,24,34,.9); border-color: var(--${P}-accent, ${t.accent}); }
        .${P}-plc-play:active { transform: scale(.95); }
        @media (max-width: 600px) { .${P}-plc-play { width: 54px; height: 54px; } .${P}-plc-play svg { width: 22px; height: 22px; } }

        /* Barra inferior de controles */
        .${P}-plc-bottom { position: absolute; left: 0; right: 0; bottom: 0; z-index: 4; padding: 0 14px 10px; background: linear-gradient(to top, rgba(0,0,0,.88) 0%, rgba(0,0,0,.45) 55%, transparent 100%); opacity: 0; pointer-events: none; transition: opacity .2s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; gap: 4px; }
        .${P}-pl:hover .${P}-plc-bottom, .${P}-pl:not(.is-playing) .${P}-plc-bottom, .${P}-pl.is-menu-open .${P}-plc-bottom, .${P}-img-host:hover .${P}-plc-bottom, .${P}-img-host:focus-within .${P}-plc-bottom { opacity: 1; pointer-events: auto; }
        @media (hover: none) { .${P}-plc-bottom { opacity: 1; pointer-events: auto; } }

        /* Linha de progresso / scrubber com tooltip de tempo */
        .${P}-plc-prog { position: relative; width: 100%; height: 16px; display: flex; align-items: center; cursor: pointer; touch-action: none; }
        .${P}-plc-bar { position: relative; width: 100%; height: 3.5px; background: rgba(255,255,255,.24); border-radius: 4px; transition: height .12s cubic-bezier(0.4, 0, 0.2, 1); }
        .${P}-plc-prog:hover .${P}-plc-bar { height: 6px; }
        .${P}-plc-buf { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: rgba(255,255,255,.34); border-radius: 4px; pointer-events: none; }
        .${P}-plc-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: var(--${P}-accent, ${t.accent}); border-radius: 4px; pointer-events: none; }
        .${P}-plc-knob { position: absolute; right: -6px; top: 50%; width: 12px; height: 12px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.5); transform: translateY(-50%) scale(0); transition: transform .12s ease; }
        .${P}-plc-prog:hover .${P}-plc-knob { transform: translateY(-50%) scale(1); }
        .${P}-plc-timetip { position: absolute; bottom: calc(100% + 7px); transform: translateX(-50%); background: rgba(14,15,19,.95); border: 1px solid rgba(255,255,255,.16); color: #fff; font: 600 11px/1 Inter, system-ui, sans-serif; font-variant-numeric: tabular-nums; padding: 4px 7px; border-radius: 6px; pointer-events: none; opacity: 0; white-space: nowrap; transition: opacity .1s ease; box-shadow: 0 4px 14px rgba(0,0,0,.5); z-index: 10; }
        .${P}-plc-prog:hover .${P}-plc-timetip { opacity: 1; }

        /* Linha de botões */
        .${P}-plc-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 40px; }
        .${P}-plc-left, .${P}-plc-right { display: flex; align-items: center; gap: 3px; }

        /* Botões de controle universais */
        .${P}-plc-act { position: relative; width: 36px; height: 36px; border: 0; border-radius: 50%; cursor: pointer; padding: 0; background: transparent; color: rgba(255,255,255,.9); display: flex; align-items: center; justify-content: center; transition: background .12s, color .12s, transform .1s, opacity .12s; flex: 0 0 auto; }
        .${P}-plc-act:hover { background: rgba(255,255,255,.12); color: #fff; }
        .${P}-plc-act:active { transform: scale(.9); }
        .${P}-plc-act.is-active { color: var(--${P}-accent, ${t.accent}); background: rgba(${t.accentRgb},.18); }
        .${P}-plc-act.is-disabled { opacity: .35 !important; pointer-events: none !important; }
        .${P}-plc-act svg { width: 20px; height: 20px; display: block; filter: drop-shadow(0 0 1px rgba(0,0,0,.4)); }

        /* Play/pause na barra */
        .${P}-plc-barplay { width: 38px; height: 38px; }
        .${P}-plc-barplay svg { width: 22px; height: 22px; fill: currentColor; }

        /* Pular 5s (arcos arredondados quase completos) */
        .${P}-plc-skip { position: relative; width: 36px; height: 36px; border-radius: 50%; }
        .${P}-plc-skip svg { width: 22px; height: 22px; display: block; }
        .${P}-plc-skip .${P}-plc-skipn { position: absolute; left: 0; right: 0; top: 51%; transform: translateY(-50%); text-align: center; font: 800 8.5px/1 Inter, system-ui, sans-serif; color: currentColor; pointer-events: none; }

        /* Grupo de Volume */
        .${P}-plc-vol { display: flex; align-items: center; gap: 2px; }
        .${P}-plc-volbar { position: relative; width: 0; height: 4px; border-radius: 4px; background: rgba(255,255,255,.28); cursor: pointer; opacity: 0; transition: width .18s ease, opacity .18s ease, margin .18s ease; touch-action: none; }
        .${P}-plc-vol:hover .${P}-plc-volbar, .${P}-plc-vol.is-sliding .${P}-plc-volbar { width: 62px; opacity: 1; margin: 0 6px 0 2px; }
        .${P}-plc-volfill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: #fff; border-radius: 4px; pointer-events: none; }

        /* Tempo */
        .${P}-plc-time { color: rgba(255,255,255,.88); font: 600 12px/1 Inter, system-ui, sans-serif; font-variant-numeric: tabular-nums; padding: 0 8px; white-space: nowrap; user-select: none; flex: 0 0 auto; }
        @media (max-width: 600px) { .${P}-plc-act { width: 30px; height: 30px; } .${P}-plc-act svg { width: 17px; height: 17px; } .${P}-plc-time { font-size: 11px; padding: 0 4px; } }

        /* Feedback do seek flash */
        .${P}-plc-seekflash { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); z-index: 3; color: #fff; font: 700 15px/1 Inter, system-ui, sans-serif; background: rgba(0,0,0,.65); padding: 9px 15px; border-radius: 999px; opacity: 0; transition: opacity .15s ease; pointer-events: none; white-space: nowrap; }
        .${P}-plc-seekflash.on { opacity: 1; }
        .${P}-pl.is-buffering::after { content: ""; position: absolute; top: 50%; left: 50%; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%; border: 3px solid rgba(255,255,255,.22); border-top-color: var(--${P}-accent, ${t.accent}); animation: ${P}-spin .8s linear infinite; z-index: 4; pointer-events: none; }
        @keyframes ${P}-spin { to { transform: rotate(360deg); } }

        /* Switch moderno de Autoplay com label */
        .${P}-plc-autoplay { width: auto; height: 30px; padding: 0 8px 0 10px; border-radius: 15px; gap: 8px; font: 600 12px/1 Inter, system-ui, sans-serif; color: rgba(255,255,255,.8); background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); transition: background .12s, border-color .12s, color .12s; }
        .${P}-plc-autoplay:hover { background: rgba(255,255,255,.12); color: #fff; }
        .${P}-plc-autoplay.is-active { background: rgba(${t.accentRgb},.14); border-color: rgba(${t.accentRgb},.35); color: #fff; }
        .${P}-plc-ap-label { font-size: 11.5px; font-weight: 600; letter-spacing: -0.01em; user-select: none; }
        .${P}-plc-ap-pill { position: relative; width: 28px; height: 16px; border-radius: 9px; background: rgba(255,255,255,.24); transition: background .18s ease; display: block; flex: 0 0 28px; }
        .${P}-plc-ap-knob { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: #fff; transition: transform .18s cubic-bezier(0.4, 0, 0.2, 1), background .18s ease; box-shadow: 0 1px 3px rgba(0,0,0,.4); display: block; }
        .${P}-plc-autoplay.is-active .${P}-plc-ap-pill { background: var(--${P}-accent, ${t.accent}); }
        .${P}-plc-autoplay.is-active .${P}-plc-ap-knob { transform: translateX(12px); background: ${t.onAccent}; }

        /* Seletor de Velocidade moderno (texto limpo + popup) */
        .${P}-plc-speedwrap { position: relative; display: flex; align-items: center; }
        .${P}-plc-speed { width: auto; height: 38px; padding: 0 6px; border: 0; background: transparent; color: rgba(255,255,255,.9); font: 700 15px/1 Inter, system-ui, sans-serif; font-variant-numeric: tabular-nums; cursor: pointer; transition: color .12s, transform .1s; display: inline-flex; align-items: center; justify-content: center; }
        .${P}-plc-speed:hover { background: transparent; color: #fff; transform: scale(1.08); }
        .${P}-plc-speedmenu { position: absolute; bottom: calc(100% + 10px); right: 0; z-index: 10; display: none; flex-direction: column; padding: 6px; min-width: 140px; max-height: 280px; overflow-y: auto; background: rgba(16,18,25,.96); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,.14); border-radius: 12px; box-shadow: 0 16px 36px rgba(0,0,0,.65); scrollbar-width: thin; }
        .${P}-plc-speedmenu.open { display: flex; animation: ${P}-fadein .15s ease; }
        @keyframes ${P}-fadein { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .${P}-plc-speedhead { display: flex; align-items: center; justify-content: space-between; padding: 4px 8px 8px; border-bottom: 1px solid rgba(255,255,255,.08); margin-bottom: 4px; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: rgba(255,255,255,.45); }
        .${P}-plc-speedreset { border: 0; background: rgba(255,255,255,.08); color: rgba(255,255,255,.75); font: 700 10.5px Inter, system-ui, sans-serif; padding: 2px 6px; border-radius: 4px; cursor: pointer; transition: background .1s, color .1s; }
        .${P}-plc-speedreset:hover { background: rgba(255,255,255,.16); color: #fff; }
        .${P}-plc-speeditem { display: flex; align-items: center; justify-content: space-between; gap: 8px; border: 0; background: transparent; color: rgba(255,255,255,.88); font: 600 12.5px/1 Inter, system-ui, sans-serif; padding: 7px 10px; border-radius: 7px; cursor: pointer; text-align: left; white-space: nowrap; transition: background .1s, color .1s; }
        .${P}-plc-speeditem:hover { background: rgba(255,255,255,.1); color: #fff; }
        .${P}-plc-speeditem.on { color: var(--${P}-accent, ${t.accent}); font-weight: 700; background: rgba(${t.accentRgb},.12); }
        .${P}-plc-speeditem svg { width: 14px; height: 14px; opacity: 0; color: var(--${P}-accent, ${t.accent}); flex: 0 0 auto; }
        .${P}-plc-speeditem.on svg { opacity: 1; }

        /* ===== FOTO: ZOOM + PAN ===== */
        .${P}-img-host { position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; max-width: 100%; max-height: 100%; margin: 0; overflow: visible; }
        .${P}-image { display: block !important; max-width: 100% !important; max-height: 100% !important; width: auto !important; height: auto !important; object-fit: contain !important; opacity: 1 !important; filter: none !important; position: static !important; background: transparent !important; border-radius: 0 !important; box-shadow: none !important; cursor: zoom-in; user-select: none; -webkit-user-drag: none; transform-origin: center center; will-change: transform; touch-action: none; }
        .${P}-stage-mid.is-zoomed .${P}-image, .${P}-img-host.is-zoomed .${P}-image { cursor: grab; }
        .${P}-stage-mid.is-zoomed .${P}-image:active, .${P}-img-host.is-zoomed .${P}-image:active { cursor: grabbing; }

        /* Spinner de mirror */
        .${P}-mirror.is-testing { opacity: 1 !important; pointer-events: auto !important; }
        .${P}-mirror-spin { display: none; width: 15px; height: 15px; flex: 0 0 auto; border-radius: 50%; border: 2px solid rgba(255,255,255,.35); border-top-color: var(--${P}-accent, ${t.accent}); animation: ${P}-spin .7s linear infinite; }
        .${P}-mirror.is-testing .${P}-mirror-btn svg { display: none; }
        .${P}-mirror.is-testing .${P}-mirror-spin { display: inline-block; }

        /* ===== STAGE: LAYOUT COM SIDEBAR INTEGRADA AO LADO DA TOPBAR E DO PLAYER ===== */
        html.${P}-has-stage, html.${P}-has-stage body { overflow: hidden !important; }
        html.${P}-file::before { content: ""; position: fixed; inset: 0; background: #0b0c0f; z-index: 98000; pointer-events: none; }
        html.${P}-file.${P}-fallback::before { display: none; }
        .${P}-stage { position: fixed; inset: 0; z-index: 99000; display: flex; flex-direction: row; background: #0b0c0f; color: #fff; font-family: Inter, system-ui, sans-serif; overflow: hidden; }
        .${P}-stage * { box-sizing: border-box; }

        /* Coluna principal da esquerda (Topbar + Mídia) */
        .${P}-stage-main { flex: 1 1 0%; min-width: 0; height: 100%; display: flex; flex-direction: column; position: relative; overflow: hidden; background: #000; }

        /* Topbar info (vrow) modernizada */
        .${P}-vrow { flex: 0 0 52px; min-height: 52px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 16px; background: #0e0f13; border-bottom: 1px solid rgba(255,255,255,.07); white-space: nowrap; }
        .${P}-vrow-top { display: flex; align-items: center; gap: 8px; flex: 1 1 auto; min-width: 0; }
        .${P}-top-logo { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; padding: 4px 6px; border-radius: 8px; transition: background .12s, opacity .12s; flex: 0 0 auto; }
        .${P}-top-logo:hover { background: rgba(255,255,255,.06); }
        .${P}-logo-badge { display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 7px; background: linear-gradient(135deg, ${t.accentLight} 0%, #8b5cf6 100%); color: #0e0f13; box-shadow: 0 2px 8px rgba(139,92,246,.35); overflow: hidden; flex: 0 0 26px; }
        .${P}-logo-badge img { width: 100%; height: 100%; object-fit: contain; }
        .${P}-logo-badge svg { width: 15px; height: 15px; fill: #0e0f13; }
        .${P}-logo-text { font: 800 15px/1 Inter, system-ui, sans-serif; letter-spacing: -0.03em; color: #fff; }
        .${P}-logo-dot { color: var(--${P}-accent, ${t.accent}); }
        .${P}-vrow .b-name { flex: 0 1 auto; min-width: 60px; max-width: 38vw; display: inline-flex; align-items: center; gap: 8px; padding: 0 4px; font-weight: 600; font-size: 13px; color: #f1f3f7; }
        .${P}-vrow .b-name svg { color: var(--${P}-accent, ${t.accent}); flex: 0 0 auto; width: 16px; height: 16px; }
        .${P}-vrow .b-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .${P}-vrow-sub { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
        .${P}-stats { display: flex; align-items: center; gap: 6px; padding: 0 4px; flex: 0 0 auto; }
        .${P}-stat { font-size: 11.5px; color: rgba(255,255,255,.7); font-weight: 600; padding: 3px 8px; border-radius: 6px; background: rgba(255,255,255,.06); }
        .${P}-stat-type { background: rgba(${t.accentRgb},.12); color: var(--${P}-accent, ${t.accent}); }
        .b-spacer { flex: 1 1 auto; min-width: 8px; }
        .b-vsep { flex: 0 0 auto; width: 1px; height: 20px; margin: 0 4px; background: rgba(255,255,255,.1); }

        .${P}-item { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 7px; padding: 6px 11px; border: 1px solid rgba(255,255,255,.1); border-radius: 9px; background: rgba(255,255,255,.05); color: #fff; font: 12.5px/1 Inter, system-ui, sans-serif; cursor: pointer; text-decoration: none; transition: background .12s, border-color .12s, color .12s; }
        .${P}-item:hover { background: rgba(255,255,255,.1); border-color: ${t.accent}66; }
        .${P}-item svg { width: 16px; height: 16px; color: var(--${P}-accent, ${t.accent}); }

        /* Botão de Playlist no canto direito da topbar (visível somente quando a sidebar estiver fechada) */
        .${P}-vrow-playlist { display: none; }
        .${P}-stage.is-sidebar-collapsed .${P}-vrow-playlist { display: inline-flex !important; }

        /* Mirror dropdown */
        .${P}-mirror-vrow { position: relative; flex: 0 0 auto; }
        .${P}-mirror-vrow.is-testing .${P}-item svg { display: none; }
        .${P}-mirror-vrow.is-testing .${P}-mirror-spin { display: inline-block; }
        .${P}-mirror-vrow .${P}-mirror-menu { position: fixed; z-index: 100002; }

        /* Mídia no centro */
        .${P}-stage-mid { position: relative; flex: 1 1 0%; min-width: 0; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 0 !important; overflow: hidden; background: #000; }
        .${P}-stage.is-video .${P}-stage-mid > .${P}-host { width: 100%; height: 100%; aspect-ratio: auto; border-radius: 0 !important; }
        .${P}-stage-mid > .${P}-img-host { max-height: 100%; max-width: 100%; margin: 0; display: flex; align-items: center; justify-content: center; overflow: visible; }

        /* Setas laterais de navegação sobre a mídia */
        .${P}-nav-side { position: absolute; top: 50%; transform: translateY(-50%); z-index: 6; width: 46px; height: 46px; border: 0; border-radius: 50%; background: rgba(0,0,0,.5); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .18s ease, background .12s ease; }
        .${P}-nav-prev { left: 16px; } .${P}-nav-next { right: 16px; }
        .${P}-stage.has-nav .${P}-stage-mid:hover .${P}-nav-side { opacity: 1; pointer-events: auto; }
        @media (hover: none) { .${P}-stage.has-nav .${P}-nav-side { opacity: .85; pointer-events: auto; } }
        .${P}-nav-side:hover { background: rgba(0,0,0,.78); } .${P}-nav-side:active { transform: translateY(-50%) scale(.92); }
        .${P}-nav-side svg { width: 26px; height: 26px; display: block; }
        .${P}-nav-side.is-disabled { display: none !important; }

        /* ===== SIDEBAR PLAYLIST (à direita, altura 100vh ao lado da topbar) ===== */
        .${P}-sidebar { position: relative; flex: 0 0 420px; width: 420px; max-width: 45vw; height: 100%; min-height: 0; display: flex; flex-direction: column; background: #0e0f13; border-left: 1px solid rgba(255,255,255,.08); z-index: 20; transition: width .22s cubic-bezier(0.4, 0, 0.2, 1), flex-basis .22s cubic-bezier(0.4, 0, 0.2, 1); }
        .${P}-stage.is-sidebar-collapsed .${P}-sidebar { width: 0 !important; flex-basis: 0 !important; min-width: 0 !important; border-left-width: 0 !important; overflow: hidden !important; pointer-events: none !important; }
        .${P}-stage:not(.has-playlist) .${P}-sidebar { display: none !important; }

        /* Header da sidebar */
        .${P}-sidebar-header { flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,.08); background: #111318; gap: 8px; }
        .${P}-sidebar-title { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 700; color: #fff; letter-spacing: -0.01em; min-width: 0; }
        .${P}-sidebar-title svg { width: 18px; height: 18px; color: var(--${P}-accent, ${t.accent}); flex: 0 0 auto; }
        .${P}-sidebar-count { font-size: 11.5px; font-weight: 600; color: rgba(255,255,255,.55); background: rgba(255,255,255,.08); padding: 2px 7px; border-radius: 999px; white-space: nowrap; }

        /* Ações do header da sidebar (Ver Galeria + Fechar) */
        .${P}-sidebar-actions { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; }
        .${P}-sidebar-gallery-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; border-radius: 8px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); color: #fff; font: 600 12px/1 Inter, system-ui, sans-serif; cursor: pointer; text-decoration: none; transition: background .12s, border-color .12s, color .12s; }
        .${P}-sidebar-gallery-btn:hover { background: rgba(${t.accentRgb},.18); border-color: var(--${P}-accent, ${t.accent}); color: #fff; }
        .${P}-sidebar-gallery-btn svg { width: 14px; height: 14px; color: var(--${P}-accent, ${t.accent}); }

        .${P}-sidebar-btn { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 8px; border: 0; background: transparent; color: rgba(255,255,255,.7); cursor: pointer; transition: background .12s, color .12s; flex: 0 0 auto; }
        .${P}-sidebar-btn:hover { background: rgba(255,255,255,.1); color: #fff; }
        .${P}-sidebar-btn svg { width: 17px; height: 17px; }

        /* Campo de busca sutil na sidebar */
        .${P}-sidebar-search { flex: 0 0 auto; padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,.06); background: #0e0f13; }
        .${P}-sidebar-search input { width: 100%; height: 32px; border-radius: 8px; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.04); color: #fff; font-size: 12.5px; padding: 0 10px; outline: none; transition: border-color .12s, background .12s; }
        .${P}-sidebar-search input:focus { border-color: var(--${P}-accent, ${t.accent}); background: rgba(255,255,255,.07); }

        /* Lista vertical de itens */
        .${P}-playlist-list { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 8px 10px; display: flex; flex-direction: column; gap: 8px; scrollbar-width: thin; scrollbar-color: rgba(${t.accentRgb},.35) transparent; }
        .${P}-playlist-list::-webkit-scrollbar { width: 6px; }
        .${P}-playlist-list::-webkit-scrollbar-thumb { background: rgba(${t.accentRgb},.35); border-radius: 4px; }
        .${P}-playlist-list::-webkit-scrollbar-thumb:hover { background: rgba(${t.accentRgb},.6); }

        /* Item de playlist com thumbnails aumentadas */
        .${P}-playlist-item { display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 10px; background: rgba(255,255,255,.02); border: 1px solid transparent; color: #fff; text-decoration: none; transition: background .12s, border-color .12s, transform .1s; position: relative; }
        .${P}-playlist-item:hover { background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.08); transform: translateX(2px); }
        .${P}-playlist-item.is-current { background: rgba(${t.accentRgb},.13); border-color: rgba(${t.accentRgb},.38); }
        /* Itens fora da tela não são renderizados (o item atual fica sempre renderizado). */
        .${P}-playlist-item:not(.is-current) { content-visibility: auto; flex-shrink: 0; contain-intrinsic-block-size: auto 99px; }
        .${P}-playlist-item.is-current::before { content: none; }
        .${P}-playlist-thumb-wrap { position: relative; flex: 0 0 176px; width: 176px; height: 99px; border-radius: 8px; overflow: hidden; background: #181920; }
        .${P}-playlist-thumb { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; }
        .${P}-playlist-thumb-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; background: linear-gradient(135deg, #13151f 0%, #0d0e14 100%); border: 1px solid rgba(255, 255, 255, 0.06); box-sizing: border-box; }
        .${P}-playlist-thumb-placeholder svg { width: 22px; height: 22px; color: var(--${P}-accent, ${t.accent}); opacity: 0.9; }
        .${P}-playlist-ph-ext { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 9.5px; font-weight: 700; line-height: 1; letter-spacing: 0.05em; padding: 2px 5px; border-radius: 4px; background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.85); border: 1px solid rgba(255, 255, 255, 0.08); }
        .${P}-playlist-kind { position: absolute; top: 6px; left: 6px; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.78); color: #fff; font: 700 10px/1.2 Inter, system-ui, sans-serif; letter-spacing: .02em; }
        .${P}-playlist-num { position: absolute; top: 6px; right: 6px; z-index: 1; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.8); color: #fff; font: 700 11px/1 Inter, system-ui, sans-serif; }
        .${P}-playlist-dur { position: absolute; bottom: 5px; right: 6px; z-index: 1; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.8); color: #fff; font: 700 11px/1 Inter, system-ui, sans-serif; }
        .${P}-playlist-dur[hidden] { display: none !important; }
        .${P}-playlist-info { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .${P}-playlist-name { font-size: 14.5px; font-weight: 500; line-height: 1.35; color: rgba(255,255,255,.9); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; word-break: break-word; }
        .${P}-playlist-item.is-current .${P}-playlist-name { color: #fff; font-weight: 700; }
        .${P}-playlist-meta { font-size: 12.5px; color: rgba(255,255,255,.5); display: flex; align-items: center; gap: 8px; }
        .${P}-playlist-meta-active { color: var(--${P}-accent, ${t.accent}); font-weight: 600; }
        @media (max-width: 1024px) {
            .${P}-sidebar { flex: 0 0 340px; width: 340px; }
            .${P}-playlist-thumb-wrap { flex: 0 0 110px; width: 110px; height: 62px; }
        }

        /* ===== ADAPTAÇÃO MOBILE (<= 768px) ESTILO YOUTUBE ===== */
        @media (max-width: 768px) {
            /* 1. O Stage não prende a tela: flui verticalmente com scroll natural */
            html.${P}-has-stage, html.${P}-has-stage body { overflow: auto !important; height: 100% !important; }
            .${P}-stage {
                position: fixed !important;
                inset: 0 !important;
                width: 100% !important;
                height: 100% !important;
                flex-direction: column !important;
                overflow-y: auto !important;
                overflow-x: hidden !important;
                -webkit-overflow-scrolling: touch !important;
            }
            .${P}-stage-main {
                flex: 0 0 auto !important;
                width: 100% !important;
                height: auto !important;
                min-height: auto !important;
                overflow: visible !important;
            }

            /* 2. Topbar em 2 Linhas:
               Linha 1: Logo [B bunkr.] + Título completo (.b-name com flex: 1 1 auto)
               Linha 2: Metadados (.${P}-stats), [Mirror] e atalho [Playlist] */
            .${P}-vrow {
                flex: 0 0 auto !important;
                flex-direction: column !important;
                height: auto !important;
                min-height: 80px !important;
                padding: 8px 12px !important;
                gap: 6px !important;
                align-items: stretch !important;
                position: sticky !important;
                top: 0 !important;
                z-index: 50 !important;
                background: #0e0f13 !important;
            }
            .${P}-vrow-top {
                width: 100% !important;
                height: 32px !important;
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                min-width: 0 !important;
            }
            .${P}-vrow-top .b-name {
                flex: 1 1 auto !important;
                max-width: none !important;
                font-size: 13.5px !important;
                min-width: 0 !important;
            }
            .${P}-vrow-top .b-name span {
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
            }
            .${P}-vrow-sub {
                width: 100% !important;
                height: 32px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: flex-start !important;
                gap: 6px !important;
            }
            .${P}-vrow-sub .b-spacer {
                flex: 1 1 auto !important;
            }
            .${P}-vrow-playlist {
                display: inline-flex !important;
                padding: 4px 9px !important;
                font-size: 11.5px !important;
            }

            /* 3. Mídia central no topo (proporção de vídeo 16:9) */
            .${P}-stage-mid {
                flex: 0 0 auto !important;
                width: 100% !important;
                height: auto !important;
                min-height: 210px !important;
            }
            .${P}-stage.is-video .${P}-stage-mid {
                aspect-ratio: 16 / 9 !important;
                max-height: 56.25vw !important;
            }
            .${P}-stage.is-video .${P}-stage-mid > .${P}-host {
                width: 100% !important;
                height: 100% !important;
                aspect-ratio: 16 / 9 !important;
            }
            .${P}-stage.is-image .${P}-stage-mid {
                min-height: 280px !important;
                max-height: 70vh !important;
            }
            .${P}-stage.is-text .${P}-stage-mid {
                min-height: 320px !important;
                max-height: 60vh !important;
            }

            /* 4. Base do player em 2 Linhas:
               Linha 1: Controles de reprodução (Play, Repeat, Prev, Next, Skips, Vol, Tempo à direita)
               Linha 2: Ações secundárias (Autoplay à esquerda, Velocidade 1x, Report, Download, Share, PiP, Fullscreen à direita) */
            .${P}-plc-bottom {
                padding: 0 8px 6px !important;
            }
            .${P}-plc-row {
                flex-direction: column !important;
                align-items: stretch !important;
                gap: 3px !important;
                min-height: auto !important;
            }
            .${P}-plc-left {
                display: flex !important;
                align-items: center !important;
                justify-content: flex-start !important;
                width: 100% !important;
                height: 34px !important;
                gap: 1px !important;
            }
            .${P}-plc-left .${P}-plc-time {
                margin-left: auto !important;
                padding: 0 2px !important;
                font-size: 11px !important;
            }
            .${P}-plc-right {
                display: flex !important;
                align-items: center !important;
                justify-content: flex-end !important;
                width: 100% !important;
                height: 34px !important;
                padding-top: 3px !important;
                border-top: 1px solid rgba(255,255,255,.08) !important;
                gap: 3px !important;
            }
            .${P}-plc-act:not(.${P}-plc-autoplay):not(.${P}-plc-speed) {
                width: 30px !important;
                height: 30px !important;
            }
            .${P}-plc-act svg {
                width: 17px !important;
                height: 17px !important;
            }
            .${P}-plc-autoplay {
                width: auto !important;
                min-width: 86px !important;
                flex: 0 0 auto !important;
                margin-right: auto !important;
                height: 28px !important;
                padding: 0 8px 0 10px !important;
                gap: 6px !important;
                white-space: nowrap !important;
            }
            .${P}-plc-ap-label {
                font-size: 11px !important;
                white-space: nowrap !important;
            }
            .${P}-plc-ap-pill {
                width: 24px !important;
                height: 14px !important;
                flex: 0 0 24px !important;
            }
            .${P}-plc-ap-knob {
                width: 10px !important;
                height: 10px !important;
            }
            .${P}-plc-autoplay.is-active .${P}-plc-ap-knob {
                transform: translateX(10px) !important;
            }
            .${P}-plc-speed {
                width: auto !important;
                height: 30px !important;
                font-size: 13.5px !important;
                padding: 0 3px !important;
            }

            /* 5. Próximos vídeos (Sidebar de Playlist) aparecem abaixo do player */
            .${P}-sidebar {
                flex: 1 0 auto !important;
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                min-height: 400px !important;
                border-left: 0 !important;
                border-top: 1px solid rgba(255,255,255,.08) !important;
                display: flex !important;
            }
            .${P}-stage.is-sidebar-collapsed .${P}-sidebar {
                width: 100% !important;
                flex-basis: auto !important;
                min-width: 100% !important;
                pointer-events: auto !important;
                display: flex !important;
                overflow: visible !important;
            }
            .${P}-sidebar-close {
                display: none !important;
            }
            .${P}-playlist-list {
                flex: 0 0 auto !important;
                max-height: none !important;
                overflow: visible !important;
                height: auto !important;
                padding: 8px 10px 48px !important;
            }
            .${P}-playlist-thumb-wrap {
                flex: 0 0 132px !important;
                width: 132px !important;
                height: 74px !important;
            }
            .${P}-playlist-name { font-size: 13.5px !important; }
            .${P}-playlist-date-lbl, .${P}-playlist-date-val, .${P}-playlist-meta { font-size: 12px !important; }
        }
`,
            actionbar: `        /* Nova Actionbar Integrada com busca, chips e ações */
        .${P}-gallery-actionbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #111318; border: 1px solid rgba(255,255,255,.08); border-radius: 16px; padding: 8px 12px; margin: 16px 0 24px; box-shadow: 0 4px 20px rgba(0,0,0,.25); flex-wrap: wrap; }
        .${P}-actionbar-search { position: relative; flex: 1 1 320px; min-width: 240px; max-width: 480px; }
        .${P}-actionbar-search input { width: 100%; height: 38px; border-radius: 10px; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.04); color: #fff; font-size: 13px; font-family: inherit; padding: 0 34px 0 36px; outline: none; transition: border-color .14s, background .14s, box-shadow .14s; }
        .${P}-actionbar-search input:focus { border-color: var(--${P}-accent, ${t.accent}); background: rgba(255,255,255,.07); box-shadow: 0 0 0 3px rgba(${t.accentRgb},.15); }
        .${P}-actionbar-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: rgba(255,255,255,.45); pointer-events: none; }
        .${P}-actionbar-search-clear { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; border-radius: 50%; border: 0; background: rgba(255,255,255,.1); color: rgba(255,255,255,.7); font-size: 13px; display: none; align-items: center; justify-content: center; cursor: pointer; transition: background .12s, color .12s; }
        .${P}-actionbar-search-clear:hover { background: rgba(255,255,255,.2); color: #fff; }
        .${P}-actionbar-search.has-text .${P}-actionbar-search-clear { display: flex; }

        .${P}-actionbar-chips { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .${P}-actionbar-label { font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: rgba(255,255,255,.4); margin-right: 4px; user-select: none; }
        .${P}-chip { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; border-radius: 9999px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); color: rgba(255,255,255,.8); font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all .14s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; }
        .${P}-chip:hover { background: rgba(255,255,255,.1); color: #fff; border-color: rgba(255,255,255,.15); }
        .${P}-chip.is-active { background: var(--${P}-accent, ${t.accent}); color: ${t.onAccent}; border-color: var(--${P}-accent, ${t.accent}); font-weight: 700; box-shadow: 0 2px 10px rgba(${t.accentRgb},.3); }
        .${P}-chip svg { width: 14px; height: 14px; flex-shrink: 0; }

        .${P}-actionbar-divider { width: 1px; height: 24px; background: rgba(255,255,255,.1); margin: 0 4px; }

        .${P}-actionbar-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-left: auto; }
        .${P}-act-btn { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 11px; border-radius: 8px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); color: rgba(255,255,255,.75); font-size: 12px; font-weight: 600; cursor: pointer; transition: all .12s ease; }
        .${P}-act-btn:hover { background: rgba(${t.accentRgb},.12); border-color: rgba(${t.accentRgb},.35); color: #fff; }
        .${P}-act-btn.is-active { background: rgba(${t.accentRgb},.2); border-color: var(--${P}-accent, ${t.accent}); color: var(--${P}-accent, ${t.accent}); }
        .${P}-act-btn svg { width: 14px; height: 14px; flex-shrink: 0; }

        .${P}-actionbar-count { font-size: 12px; font-weight: 600; color: rgba(255,255,255,.45); background: rgba(255,255,255,.05); padding: 4px 10px; border-radius: 999px; white-space: nowrap; margin-left: 6px; }
        .${P}-sort-direction { font-size: 11px; margin-left: 2px; opacity: .85; }

        /* Controles de ordenação na Sidebar da Playlist (maiores e rounded-full) */
        .${P}-sidebar-sort { display: flex; align-items: center; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
        .${P}-sidebar-sort-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: rgba(255,255,255,.45); margin-right: 2px; user-select: none; }
        .${P}-sb-chip { display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 12px; border-radius: 9999px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); color: rgba(255,255,255,.75); font: 600 12px/1 Inter, system-ui, sans-serif; cursor: pointer; transition: all .14s ease; user-select: none; }
        .${P}-sb-chip:hover { background: rgba(255,255,255,.12); color: #fff; border-color: rgba(255,255,255,.18); }
        .${P}-sb-chip.is-active { background: var(--${P}-accent, ${t.accent}); border-color: var(--${P}-accent, ${t.accent}); color: ${t.onAccent}; font-weight: 700; box-shadow: 0 2px 8px rgba(${t.accentRgb},.3); }
        .${P}-sb-dir { font-size: 10px; }
`,
            dates: `        /* Datas em texto simples nos itens da playlist da sidebar (sem badge, sem ícones) */
        .${P}-playlist-dates { display: flex; flex-direction: column; gap: 2px; margin-top: 3px; }
        .${P}-playlist-dates { min-width: 0; }
        .${P}-playlist-date-row { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 12px; line-height: 1.3; color: rgba(255,255,255,.5); white-space: nowrap; overflow: hidden; }
        .${P}-playlist-date-lbl { flex: 0 0 auto; white-space: nowrap; }
        .${P}-playlist-date-val { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .${P}-playlist-date-lbl { color: rgba(255,255,255,.55); font-weight: 600; font-size: 12.5px; }
        .${P}-playlist-date-val { color: rgba(255,255,255,.9); font-weight: 600; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; }

        /* Tooltip sutil e ícone em Data Extraída */
        .${P}-has-tip { cursor: help !important; display: inline-flex !important; align-items: center !important; gap: 3px !important; }
        .${P}-tip-icon { display: inline-flex; align-items: center; justify-content: center; font-size: 9.5px; line-height: 1; color: rgba(255,255,255,.5); border-radius: 50%; width: 13px; height: 13px; background: rgba(255,255,255,.08); transition: color .15s ease, background .15s ease; user-select: none; }
        .${P}-has-tip:hover .${P}-tip-icon { color: #fff; background: var(--${P}-accent, ${t.accent}); }

        /* Cabeçalhos de seção quando Agrupar por Tipo está ativo */
        .${P}-group-header { grid-column: 1 / -1 !important; display: flex !important; align-items: center !important; gap: 14px !important; margin-top: 24px !important; margin-bottom: 4px !important; padding-top: 14px !important; user-select: none !important; }
        .${P}-group-header:first-of-type { margin-top: 0 !important; padding-top: 0 !important; }
        .${P}-group-header-left { display: flex; align-items: center; gap: 8px; font-size: 15.5px; font-weight: 700; color: #f3f4f6; white-space: nowrap; }
        .${P}-group-header-left svg { width: 18px; height: 18px; color: var(--${P}-accent, ${t.accent}); flex-shrink: 0; }
        .${P}-group-count { font-size: 11.5px; font-weight: 600; color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.08); padding: 2.5px 8.5px; border-radius: 999px; }
        .${P}-group-line { flex: 1; height: 1px; background: rgba(255,255,255,0.08); }
`,
            misc: `        .${P}-thumb-placeholder { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 35%, #181b24 0%, #0e1017 100%) !important; border-radius: 14px; gap: 8px; z-index: 1; user-select: none; pointer-events: none; border: 1px solid rgba(255,255,255,0.06); }
        .${P}-ph-icon { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 12px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.06); }
        .${P}-ph-icon svg { width: 22px; height: 22px; stroke: currentColor; fill: none; }
        .${P}-ph-badge { font-family: Inter, system-ui, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: rgba(255,255,255,0.75); background: rgba(255,255,255,0.07); padding: 2px 7px; border-radius: 5px; border: 1px solid rgba(255,255,255,0.08); }

        /* Preview do conteúdo de arquivo .txt no card da galeria */
        .${P}-txt-preview { position: absolute; inset: 0; display: flex; flex-direction: column; background: #0f1118 !important; border-radius: 14px; padding: 10px 12px; overflow: hidden; z-index: 1; pointer-events: none; border: 1px solid rgba(255,255,255,0.08); }
        .${P}-txt-head { display: flex; align-items: center; gap: 7px; padding-bottom: 6px; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.08); flex: 0 0 auto; }
        .${P}-txt-head-tag { font: 700 9.5px/1 Inter, monospace; background: rgba(${t.accentRgb},0.18); color: ${t.accentLight}; padding: 2.5px 6px; border-radius: 4px; border: 1px solid rgba(${t.accentRgb},0.3); letter-spacing: 0.03em; }
        .${P}-txt-head-title { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.65); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .${P}-txt-body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace !important; font-size: 10.5px !important; line-height: 1.45 !important; color: #cbd5e1 !important; white-space: pre-wrap !important; word-break: break-all !important; overflow: hidden !important; flex: 1 1 auto; margin: 0 !important; opacity: 0.9; }
        .${P}-txt-fade { position: absolute; left: 0; right: 0; bottom: 0; height: 38px; background: linear-gradient(to top, #0f1118 15%, transparent 100%); pointer-events: none; }

        /* Visualizador de texto no Stage da página de arquivo (.is-text) */
        .${P}-txt-stage-host { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 24px; box-sizing: border-box; overflow: hidden; }
        .${P}-txt-stage-card { width: 100%; max-width: 960px; height: 85vh; max-height: 820px; background: #11131a; border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; display: flex; flex-direction: column; box-shadow: 0 16px 40px rgba(0,0,0,0.6); overflow: hidden; }
        .${P}-txt-stage-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; background: #161822; border-bottom: 1px solid rgba(255,255,255,0.08); flex: 0 0 auto; }
        .${P}-txt-stage-info { display: flex; align-items: center; gap: 10px; }
        .${P}-txt-tag { font: 700 10.5px/1 Inter, monospace; letter-spacing: 0.05em; background: rgba(${t.accentRgb},0.2); color: ${t.accentLight}; padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(${t.accentRgb},0.35); }
        .${P}-txt-meta { font-size: 12px; color: rgba(255,255,255,0.6); }
        .${P}-txt-stage-actions { display: flex; align-items: center; gap: 8px; }
        .${P}-txt-btn { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #fff; font: 600 12px/1 Inter, sans-serif; cursor: pointer; text-decoration: none; transition: background .12s, border-color .12s; }
        .${P}-txt-btn:hover { background: rgba(${t.accentRgb},0.15); border-color: rgba(${t.accentRgb},0.4); color: #fff; text-decoration: none; }
        .${P}-txt-btn[disabled] { opacity: 0.45; cursor: not-allowed; pointer-events: none; }
        .${P}-txt-btn svg { width: 14px; height: 14px; }
        .${P}-txt-stage-content { flex: 1 1 auto; overflow-y: auto; padding: 18px 20px; margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace !important; font-size: 13px !important; line-height: 1.6 !important; color: #e2e8f0 !important; white-space: pre-wrap !important; word-break: break-word !important; background: transparent !important; }

        /* toast (feedback de copiar etc.) — acima do stage */
        .${P}-toast { position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%) translateY(12px); z-index: 100001; padding: 10px 18px; border-radius: 20px; background: #14161a; border: 1px solid ${t.accent}66; color: #fff; font: 13px Inter, system-ui, sans-serif; box-shadow: 0 6px 22px rgba(0,0,0,.6); opacity: 0; pointer-events: none; transition: opacity .2s, transform .2s; }
        .${P}-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }`,
        };
    }
