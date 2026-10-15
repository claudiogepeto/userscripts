    /* ==================================================================== * TEMA & CSS AMOLED */
    addStyle(`
        :root {
            --pdx-green: #ffffff;
            --pdx-green-2: #ffffff;
            --pdx-text: #f2f2f2;
            --pdx-muted: #9a9a9a;
            --pdx-surface: #0a0a0a;
            --pdx-surface-2: #121212;
            --pdx-line: #1c1c1c;
        }
        :root, html, body {
            --body_background: #000 !important;
            --body_color: #000 !important;
            --background_color: #000 !important;
            --background: #000 !important;
            --background_pattern: none !important;
            --background_text_color: #f2f2f2 !important;
            --body_text_color: #f2f2f2 !important;
            --card_color: #0a0a0a !important;
            --shaded_background: rgba(0,0,0,.9) !important;
            --separator: #1c1c1c !important;
            --highlight_color: #ffffff !important;
            --highlight_background: rgba(255,255,255,.12) !important;
            --input_background: #0e0e0e !important;
            --input_hover_background: #171717 !important;
            --input_text: #f2f2f2 !important;
        }
        body { background: #000 !important; font-family: Inter, system-ui, -apple-system, sans-serif !important; }

        /* Early paint hide */
        .file_viewer > .headerbar, .file_viewer > .progress_bar_outer, .file_preview_row > .toolbar, .file_viewer > .nav_container { display: none !important; }
        .file_preview { padding: 0 !important; border: none !important; background: #000 !important; }
        .file_preview .block { background: #000 !important; border: none !important; }

        /* MODO CONTEÚDO: Stage Flex com Sidebar 100vh ao lado de tudo (Estilo Bunkr) */
        .file_viewer.pdx-mode-content { display: flex !important; flex-direction: column !important; height: 100vh !important; overflow: hidden !important; }
        .file_viewer.pdx-mode-content .pdx-gtop,
        .file_viewer.pdx-mode-content .pdx-galbar {
            display: none !important;
        }
        .file_viewer.pdx-mode-content .file_preview_row {
            display: flex !important;
            flex-direction: row !important;
            height: 100vh !important;
            flex: 1 1 100vh !important;
            min-height: 0 !important;
            overflow: hidden !important;
            background: #000 !important;
            position: relative !important;
        }
        .pdx-stage-main {
            flex: 1 1 0% !important;
            min-width: 0 !important;
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            position: relative !important;
            overflow: hidden !important;
            background: #000 !important;
        }
        .file_viewer.pdx-mode-content .file_preview {
            flex: 1 1 auto !important;
            min-width: 0 !important;
            height: 100% !important;
            position: relative !important;
            background: #000 !important;
            overflow: hidden !important;
        }

        /* TOPBAR DA GALERIA */
        .pdx-galbar {
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px;
            padding: 10px 16px 12px;
            background: #0a0a0a;
            border-bottom: 1px solid #1c1c1c;
            flex: 0 0 auto;
            box-sizing: border-box;
        }
        .pdx-galbar-top { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .pdx-galtitle { font-size: 14px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pdx-galbar-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0; }

        /* ===================== GRADE DE CARDS NA GALERIA ===================== */
        .file_viewer .gallery,
        .file_preview .gallery {
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
            gap: 28px 20px !important;
            padding: 18px 20px 48px !important;
            background: #000 !important;
            box-sizing: border-box !important;
            width: 100% !important;
            max-width: none !important;
            justify-items: stretch !important;
            align-items: start !important;
        }
        @media (min-width: 1600px) {
            .file_viewer .gallery,
            .file_preview .gallery { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)) !important; gap: 32px 24px !important; }
        }
        @media (max-width: 768px) {
            .file_viewer .gallery,
            .file_preview .gallery { grid-template-columns: 1fr !important; gap: 20px 16px !important; }
        }
        .file_viewer .gallery > a.file,
        .file_preview .gallery > a.file {
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            justify-content: flex-start !important;
            background: transparent !important;
            border: 0 !important;
            outline: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            text-decoration: none !important;
            color: #fff !important;
            position: relative !important;
            width: 100% !important;
            max-width: none !important;
            min-width: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 0 !important;
            float: none !important;
        }
        .file_viewer .gallery > a.file > .icon_container,
        .file_preview .gallery > a.file > .icon_container {
            display: block !important;
            width: 100% !important;
            aspect-ratio: 16 / 9 !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            border-radius: 12px !important;
            overflow: hidden !important;
            background-size: cover !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            background-color: #111 !important;
            position: relative !important;
            font-size: 14px !important;
        }
        .file_viewer .gallery > a.file:hover .icon_container,
        .file_preview .gallery > a.file:hover .icon_container {
            box-shadow: 0 8px 24px rgba(0,0,0,.55) !important;
        }
        .file_preview .gallery .file .image {
            width: 100% !important;
            aspect-ratio: 16 / 9 !important;
            height: auto !important;
            background: #050605 !important;
            position: relative !important;
            overflow: hidden !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
        .file_preview .gallery .file .image img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            display: block !important;
        }
        .pdx-card-play-overlay {
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 44px !important;
            height: 44px !important;
            border-radius: 50% !important;
            background: rgba(0,0,0,.7) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            pointer-events: none !important;
            opacity: 0.85 !important;
            z-index: 2 !important;
        }
        .file:hover .pdx-card-play-overlay { opacity: 1 !important; }
        .pdx-card-play-overlay svg { width: 22px !important; height: 22px !important; color: #fff !important; }
        .pdx-card-body {
            width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
            padding: 8px 2px 0 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 2px !important;
            background: transparent !important;
            position: static !important;
            overflow: visible !important;
            font-size: 14px !important;
            text-align: left !important;
        }
        .pdx-card-name {
            width: 100% !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            color: #f3f4f6 !important;
            line-height: 1.35 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            word-break: break-word !important;
            white-space: normal !important;
        }
        .pdx-card-date-val {
            display: block !important;
            width: auto !important;
            max-width: 100% !important;
            overflow: visible !important;
            text-overflow: clip !important;
            white-space: nowrap !important;
            color: rgba(255,255,255,.72) !important;
            font-weight: 500 !important;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;
            font-size: 12.5px !important;
            line-height: 1.35 !important;
        }
        .pdx-card-foot {
            font-size: 12px !important;
            font-weight: 500 !important;
            color: rgba(255,255,255,.45) !important;
            white-space: nowrap !important;
            line-height: 1.35 !important;
        }

        /* TOPBAR VROW (1 ROW NO DESKTOP ESTILO BUNKR) */
        .pdx-vrow {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            height: 52px;
            min-height: 52px;
            padding: 0 16px;
            background: var(--pdx-surface, #0a0a0a);
            border-bottom: 1px solid var(--pdx-line, #1c1c1c);
            flex: 0 0 auto;
            white-space: nowrap;
            box-sizing: border-box;
        }
        .pdx-vrow-top { display: flex; align-items: center; gap: 8px; flex: 1 1 auto; min-width: 0; }
        .pdx-vrow-actions { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }

        .pdx-logo-link { display: inline-flex; align-items: center; gap: 6px; text-decoration: none; color: #fff; font-weight: 700; font-size: 14px; padding: 4px 6px; border-radius: 6px; flex: 0 0 auto; }
        .pdx-logo-link img { width: 20px; height: 20px; display: block; }
        .pdx-logo-title { font-weight: 800; letter-spacing: -0.02em; }

        .pdx-name { display: inline-flex; align-items: center; gap: 7px; color: #fff; font-weight: 600; font-size: 13.5px; flex: 0 1 auto; min-width: 60px; max-width: 38vw; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pdx-name .icon { color: var(--pdx-green); font-size: 18px; flex: 0 0 auto; }
        .pdx-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .pdx-stats { display: flex; align-items: center; gap: 14px; flex: 0 0 auto; }
        .pdx-stat { display: inline-flex; align-items: baseline; gap: 5px; }
        .pdx-stat .pdx-k { font-size: 10px; color: var(--pdx-muted); text-transform: uppercase; letter-spacing: .05em; }
        .pdx-stat .pdx-statv { font-size: 12px; color: #fff; font-weight: 700; }
        .pdx-spacer { flex: 1 1 auto; min-width: 8px; }
        .pdx-vsep { width: 1px; height: 20px; background: var(--pdx-line); margin: 0 2px; }

        .pdx-item {
            display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 10px; border: 1px solid var(--pdx-line, #1c1c1c);
            border-radius: 8px; background: var(--input_background, #0e0e0e); color: var(--pdx-text, #f2f2f2); font: 600 12.5px/1 Inter, system-ui, sans-serif;
            cursor: pointer; text-decoration: none; transition: background .12s, border-color .12s; white-space: nowrap;
        }
        .pdx-item:hover { background: var(--input_hover_background, #171717); border-color: #ffffff66; }
        .pdx-item .icon { font-size: 17px; color: var(--pdx-green); }
        .pdx-item svg { width: 14px; height: 14px; }
        .pdx-primary { background: var(--pdx-green); border-color: var(--pdx-green); color: #111111 !important; font-weight: 700; }
        .pdx-primary .icon, .pdx-primary svg { color: #111111 !important; }
        .pdx-primary:hover { background: var(--pdx-green-2); border-color: var(--pdx-green-2); }
        .pdx-vrow-playlist.is-active { background: rgba(255,255,255,.18); border-color: var(--pdx-green); color: #ffffff; }
        .pdx-pl-count-badge { font-size: 11px; font-weight: 700; background: rgba(255,255,255,.14); padding: 2px 6px; border-radius: 999px; margin-left: 2px; }

        /* MIRROR DROPDOWN & WIDGET */
        .pdx-mirror-wrap, .pdx-player-mirror { position: relative; display: inline-flex; }
        .pdx-mirror-chev { font-size: 15px !important; margin-left: -2px; opacity: .7; transition: transform .12s; }
        .pdx-mirror-wrap.is-open .pdx-mirror-chev { transform: rotate(180deg); }
        .pdx-mirror-spin { display: none; width: 13px; height: 13px; border-radius: 50%; border: 2px solid #ffffff44; border-top-color: var(--pdx-green); animation: pdx-spin .7s linear infinite; }
        .pdx-loading .pdx-mirror-spin { display: inline-block; }
        .pdx-loading > svg:not(.pdx-mirror-chev), .pdx-loading > .icon:not(.pdx-mirror-chev) { display: none; }

        .pdx-player-mirror { display: none !important; }
        .pdx-host:hover .pdx-player-mirror, .pdx-player-mirror.is-open { opacity: 1; pointer-events: auto; }
        .pdx-player-mirror-btn {
            display: inline-flex; align-items: center; gap: 7px; height: 34px; padding: 0 12px; border-radius: 10px;
            border: 1px solid rgba(255,255,255,.18); background: rgba(14,16,14,.8); color: #fff; font: 700 12.5px/1 Inter, sans-serif;
            cursor: pointer; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); box-shadow: 0 4px 16px rgba(0,0,0,.5);
            transition: all .14s ease;
        }
        .pdx-player-mirror-btn svg { width: 15px; height: 15px; color: var(--pdx-green); }
        .pdx-player-mirror-btn:hover, .pdx-player-mirror.is-open .pdx-player-mirror-btn { background: var(--pdx-green); color: #111111; border-color: var(--pdx-green); }
        .pdx-player-mirror-btn:hover svg, .pdx-player-mirror.is-open .pdx-player-mirror-btn svg { color: #111111; }

        .pdx-mirror-menu {
            position: fixed; z-index: 10002; width: 290px; max-width: 85vw; background: rgba(14,16,14,.98);
            border: 1px solid var(--pdx-line); border-radius: 12px; box-shadow: 0 16px 42px rgba(0,0,0,.7);
            padding: 8px; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: flex; flex-direction: column; gap: 6px;
        }
        .pdx-mirror-menu[hidden] { display: none; }
        .pdx-mirror-menu-h { font-size: 11px; font-weight: 700; color: var(--pdx-muted); text-transform: uppercase; letter-spacing: .05em; padding: 4px 6px; }
        .pdx-mirror-menu-h b { color: var(--pdx-green); }
        .pdx-mirror-grid { display: flex; flex-direction: column; gap: 3px; max-height: 240px; overflow-y: auto; }
        .pdx-mirror-grid-item {
            display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 8px; border: 0; background: transparent;
            color: var(--pdx-text); font: 600 12.5px Inter, sans-serif; cursor: pointer; text-align: left; transition: background .12s;
        }
        .pdx-mirror-grid-item:hover { background: rgba(255,255,255,.08); }
        .pdx-mirror-grid-item.is-current { background: rgba(255,255,255,.16); color: var(--pdx-green); font-weight: 700; }
        .pdx-mirror-item-icon svg { width: 14px; height: 14px; color: inherit; }
        .pdx-mirror-item-title { flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pdx-mirror-actions { border-top: 1px solid var(--pdx-line); padding-top: 6px; display: flex; flex-direction: column; gap: 3px; }
        .pdx-mirror-action-btn {
            display: flex; align-items: center; gap: 8px; padding: 7px 10px; border: 0; border-radius: 7px; background: transparent;
            color: var(--pdx-muted); font: 500 12px Inter, sans-serif; cursor: pointer; text-align: left; transition: all .12s;
        }
        .pdx-mirror-action-btn:hover { background: rgba(255,255,255,.06); color: #fff; }
        .pdx-mirror-action-btn svg { width: 14px; height: 14px; }

        /* MIRROR WARN BANNER FLUTUANTE */
        .pdx-mirror-warn {
            position: fixed; top: 18px; left: 50%; transform: translateX(-50%) translateY(-20px); z-index: 10005;
            display: flex; align-items: center; gap: 12px; max-width: calc(100% - 32px); padding: 10px 18px;
            border-radius: 12px; background: rgba(176, 32, 32, 0.94); color: #fff; font: 600 13px Inter, sans-serif;
            box-shadow: 0 12px 34px rgba(0,0,0,0.6); opacity: 0; pointer-events: none; transition: all .2s ease;
        }
        .pdx-mirror-warn.show { transform: translateX(-50%) translateY(0); opacity: 1; pointer-events: auto; }
        .pdx-mirror-warn-t b { font-weight: 800; text-decoration: underline; }
        .pdx-mirror-warn-x { background: transparent; border: 0; color: #fff; cursor: pointer; display: flex; opacity: .8; padding: 2px; }
        .pdx-mirror-warn-x:hover { opacity: 1; }
        .pdx-mirror-warn-x svg { width: 15px; height: 15px; }

        /* ===================== SIDEBAR DA PLAYLIST ===================== */
        .pdx-sidebar {
            width: 420px; flex: 0 0 420px; max-width: 45vw; box-sizing: border-box; height: 100%; display: flex; flex-direction: column;
            background: #080908; border-left: 1px solid var(--pdx-line, #1c1c1c); overflow: hidden; z-index: 25;
            transition: width .18s ease, margin .18s ease;
        }
        .pdx-sidebar-collapsed .pdx-sidebar { display: none !important; }

        .pdx-sidebar-header {
            display: flex; align-items: center; justify-content: space-between; padding: 12px 14px 8px;
            border-bottom: 1px solid rgba(255,255,255,.06); flex: 0 0 auto;
        }
        .pdx-sidebar-title-wrap { display: flex; align-items: center; gap: 8px; }
        .pdx-sidebar-icon svg { width: 18px; height: 18px; color: var(--pdx-green); }
        .pdx-sidebar-title { font-size: 14.5px; font-weight: 700; color: #fff; }
        .pdx-sidebar-count { font-size: 11.5px; font-weight: 600; color: var(--pdx-muted); background: rgba(255,255,255,.06); padding: 2px 7px; border-radius: 999px; }
        .pdx-sidebar-collapse-btn { background: transparent; border: 0; color: var(--pdx-muted); cursor: pointer; display: flex; padding: 4px; border-radius: 6px; }
        .pdx-sidebar-collapse-btn:hover { background: rgba(255,255,255,.08); color: #fff; }
        .pdx-sidebar-collapse-btn svg { width: 16px; height: 16px; }
        .pdx-sidebar-actions { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; }
        .pdx-sidebar-gallery-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; border-radius: 8px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); color: #fff; font: 600 12px/1 Inter, system-ui, sans-serif; cursor: pointer; }
        .pdx-sidebar-gallery-btn:hover { background: rgba(255,255,255,.12); }
        .pdx-sidebar-gallery-btn svg { width: 14px; height: 14px; }
        .pdx-playlist-dates { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .pdx-playlist-dates { min-width: 0; }
        .pdx-playlist-date-row { display: block; min-width: 0; font-size: 12.5px; line-height: 1.3; white-space: nowrap; }
        .pdx-playlist-date-val { display: block; overflow: visible; white-space: nowrap; color: rgba(255,255,255,.72); font-weight: 500; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; }
        .pdx-playlist-now-playing { position: absolute; top: 5px; left: 5px; width: 22px; height: 22px; border-radius: 50%; background: #fff; color: #111; display: flex; align-items: center; justify-content: center; }
        .pdx-playlist-now-playing svg { width: 12px; height: 12px; }

        .pdx-sidebar-search {
            position: relative; display: flex; align-items: center; margin: 8px 12px 6px; background: rgba(255,255,255,.05);
            border: 1px solid rgba(255,255,255,.08); border-radius: 8px; padding: 0 8px; flex: 0 0 auto;
        }
        .pdx-sidebar-search:focus-within { border-color: var(--pdx-green); background: rgba(255,255,255,.08); }
        .pdx-sidebar-search-icon svg { width: 14px; height: 14px; color: var(--pdx-muted); margin-right: 6px; }
        .pdx-sidebar-search-in { width: 100%; height: 32px; background: transparent; border: 0; outline: none; color: #fff; font: 12.5px Inter, sans-serif; }
        .pdx-sidebar-search-in::placeholder { color: var(--pdx-muted); }


        .pdx-playlist-list { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 8px 10px; display: flex; flex-direction: column; gap: 8px; scrollbar-width: thin; }
        .pdx-playlist-list::-webkit-scrollbar { width: 6px; }
        .pdx-playlist-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,.28); border-radius: 4px; }

        .pdx-playlist-item {
            display: flex; align-items: flex-start; gap: 12px; padding: 8px; border-radius: 10px; background: rgba(255,255,255,.02);
            border: 1px solid transparent; cursor: pointer; transition: background .12s, border-color .12s, transform .1s; position: relative;
        }
        .pdx-playlist-item:hover { background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.08); transform: translateX(2px); }
        .pdx-playlist-item.is-current { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.38); }
        /* Itens fora da tela não são renderizados (o item atual fica sempre renderizado). */
        .pdx-playlist-item:not(.is-current) { content-visibility: auto; flex-shrink: 0; contain-intrinsic-block-size: auto 99px; }

        .pdx-playlist-thumb-wrap {
            position: relative; flex: 0 0 176px; width: 176px; height: 99px; border-radius: 8px;
            overflow: hidden; background: #181920;
        }
        .pdx-playlist-kind { position: absolute; top: 6px; left: 6px; z-index: 1; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.78); color: #fff; font: 700 10px/1.2 Inter, system-ui, sans-serif; letter-spacing: .02em; }
        .pdx-playlist-num { position: absolute; top: 6px; right: 6px; z-index: 1; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.8); color: #fff; font: 700 11px/1 Inter, system-ui, sans-serif; }
        .pdx-playlist-dur { position: absolute; bottom: 5px; right: 6px; z-index: 1; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.8); color: #fff; font: 700 11px/1 Inter, system-ui, sans-serif; }
        .pdx-playlist-dur[hidden] { display: none !important; }
        .pdx-playlist-thumb, .pdx-playlist-thumb-wrap > img { position: absolute; inset: 0; width: 100%; height: 100%; max-width: none; object-fit: cover; object-position: center; display: block; }
        .pdx-playlist-thumb-idx { position: absolute; top: 4px; left: 4px; background: rgba(0,0,0,.75); color: #fff; font: 700 9.5px Inter; padding: 1.5px 5px; border-radius: 4px; }
        .pdx-playlist-now-playing { position: absolute; top: 5px; left: 5px; right: auto; bottom: auto; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 50%; background: #fff; color: #111; display: flex; align-items: center; justify-content: center; }
        .pdx-now-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--pdx-green); animation: pdx-pulse 1.2s infinite; }

        .pdx-playlist-placeholder { width: 100%; height: 100%; background: #070707; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
        .pdx-playlist-ph-icon svg { width: 22px; height: 22px; color: var(--pdx-green); opacity: .75; }
        .pdx-playlist-ph-ext { font: 800 9px Inter; letter-spacing: .06em; color: rgba(255,255,255,.5); background: rgba(255,255,255,.08); padding: 1px 5px; border-radius: 3px; }

        .pdx-playlist-info { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .pdx-playlist-name {
            font-size: 14.5px; font-weight: 500; color: rgba(255,255,255,.9); line-height: 1.35; display: -webkit-box;
            -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word;
        }
        .pdx-playlist-item.is-current .pdx-playlist-name { color: var(--pdx-green-2); }
        .pdx-playlist-meta { font-size: 12.5px; color: rgba(255,255,255,.55); display: flex; align-items: center; gap: 8px; }
        .pdx-playlist-meta-active { color: var(--pdx-green); font-weight: 700; }
        .pdx-playlist-empty { padding: 32px 16px; text-align: center; color: var(--pdx-muted); font-size: 13px; }

        /* ===================== VISUALIZADOR DE TEXTO ===================== */
        .pdx-txt-host { display: flex; flex-direction: column; background: #070707; }
        .pdx-txt-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; background: #0d0d0d; border-bottom: 1px solid var(--pdx-line); flex: 0 0 auto; gap: 12px; }
        .pdx-txt-title { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .pdx-txt-icon svg { width: 18px; height: 18px; color: var(--pdx-green); }
        .pdx-txt-name { font-size: 14px; font-weight: 700; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pdx-txt-badge { font-size: 10px; font-weight: 800; color: var(--pdx-green); background: rgba(255,255,255,.16); padding: 2px 6px; border-radius: 4px; }
        .pdx-txt-meta { font-size: 12px; color: var(--pdx-muted); display: flex; align-items: center; gap: 6px; }
        .pdx-txt-bullet { opacity: .4; }
        .pdx-txt-tools { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
        .pdx-txt-body {
            flex: 1 1 auto; margin: 0; padding: 18px; background: #050605; color: #d4d4d8; font: 13px/1.65 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            overflow: auto; white-space: pre-wrap; word-break: break-word; tab-size: 4;
        }


        /* ===================== CONTROLES DO PLAYER ===================== */
        .pdx-host { position: absolute; inset: 0; z-index: 30; background: #000; overflow: hidden; }
        .pdx-video { position: absolute; inset: 0; width: 100% !important; height: 100% !important; object-fit: contain !important; background: #000 !important; outline: none; cursor: pointer; display: block; }
        .pdx-img-host { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; overflow: visible; }
        .pdx-image { max-width: 100% !important; max-height: 100% !important; object-fit: contain !important; background: #000 !important; cursor: zoom-in; user-select: none; will-change: transform; touch-action: none; }
        .pdx-img-host.pdx-zoomed .pdx-image { cursor: grab; }
        .pdx-img-host.pdx-zoomed .pdx-image:active { cursor: grabbing; }

        /* Velocidade limpa (sem pill pesado) */

        .pdx-plc-side { position: absolute; top: 50%; transform: translateY(-50%); z-index: 4; width: 46px; height: 46px; border: 0; border-radius: 50%; background: rgba(0,0,0,.5); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .18s; }
        .pdx-plc-sprev { left: 12px; } .pdx-plc-snext { right: 12px; }
        .pdx-pl:hover .pdx-plc-side, .pdx-img-host:hover .pdx-plc-side { opacity: 1; pointer-events: auto; }
        @media (hover:none) { .pdx-plc-side { opacity: .85; pointer-events: auto; } }
        .pdx-plc-side:hover { background: rgba(0,0,0,.75); }
        .pdx-plc-side svg { width: 26px; height: 26px; }

        .pdx-fail { position: absolute; inset: 0; z-index: 6; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 24px; text-align: center; color: #fff; background: rgba(0,0,0,.92); font: 14px Inter; }
        .pdx-failrow { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
        .pdx-mini { padding: 6px 12px; border: 1px solid var(--pdx-line); border-radius: 7px; background: #0e0e0e; color: #fff; cursor: pointer; text-decoration: none; font: 600 12.5px Inter; }
        .pdx-mini:hover { background: #171717; border-color: var(--pdx-green); }

        .pdx-toast { position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%) translateY(12px); z-index: 10000; padding: 9px 18px; border-radius: 20px; background: #0e0e0e; border: 1px solid var(--pdx-green); color: #fff; font: 600 13px Inter; box-shadow: 0 6px 20px rgba(0,0,0,.7); opacity: 0; pointer-events: none; transition: all .2s; }
        .pdx-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

        .pdx-modal { position: fixed; inset: 0; z-index: 10001; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.8); backdrop-filter: blur(4px); }
        .pdx-card { background: var(--pdx-surface); color: #fff; border: 1px solid var(--pdx-line); border-radius: 12px; min-width: 320px; max-width: 90vw; max-height: 88vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 16px 48px #000; }
        .pdx-card-h { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 16px; background: #000; font-weight: 700; border-bottom: 1px solid var(--pdx-line); }
        .pdx-x { background: none; border: none; color: var(--pdx-muted); cursor: pointer; display: flex; } .pdx-x:hover { color: #fff; }
        .pdx-card-b { padding: 16px; overflow: auto; }
        .pdx-tbl { width: 100%; border-collapse: collapse; font-size: 13px; } .pdx-tbl td { padding: 6px 8px; border-bottom: 1px solid var(--pdx-line); vertical-align: top; } .pdx-tbl td:first-child { color: var(--pdx-muted); white-space: nowrap; width: 1%; }
        .pdx-links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; } .pdx-links a { padding: 6px 10px; border-radius: 6px; background: #0e0e0e; color: var(--pdx-green); text-decoration: none; font-size: 12px; border: 1px solid var(--pdx-line); font-weight: 600; } .pdx-links a:hover { background: #171717; border-color: var(--pdx-green); }
        .pdx-qr { width: 240px; height: 240px; border-radius: 8px; background: #fff; } .pdx-qrcap { margin-top: 10px; font-size: 12px; color: var(--pdx-muted); max-width: 240px; margin-inline: auto; }

        @keyframes pdx-spin { to { transform: rotate(360deg); } }
        @keyframes pdx-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }

        /* ===================== RESPONSIVIDADE MOBILE ===================== */
        @media (max-width: 1024px) {
            .pdx-sidebar { flex: 0 0 340px; width: 340px; }
            .pdx-playlist-thumb-wrap { flex: 0 0 110px; width: 110px; height: 62px; }
        }
        @media (max-width: 768px) {
            .file_viewer.pdx-mode-content { height: auto !important; min-height: 100vh !important; overflow-y: auto !important; }
            .file_viewer.pdx-mode-content .file_preview_row {
                flex-direction: column !important; height: auto !important; min-height: 0 !important; overflow: visible !important;
            }
            .pdx-stage-main {
                flex: 0 0 auto !important; width: 100% !important; height: auto !important; min-height: 0 !important;
            }
            .file_viewer.pdx-mode-content .file_preview {
                flex: 0 0 auto !important; width: 100% !important; height: 55vh !important; min-height: 270px !important;
            }
            .pdx-sidebar {
                width: 100% !important; flex: 1 1 auto !important; height: auto !important; max-height: none !important;
                border-left: none !important; border-top: 1px solid var(--pdx-line) !important;
            }
            .pdx-playlist-list { max-height: 65vh !important; overflow-y: auto !important; }
            .pdx-playlist-thumb-wrap { flex: 0 0 132px !important; width: 132px !important; height: 74px !important; }
            .pdx-playlist-name { font-size: 13.5px !important; }
            .pdx-playlist-meta, .pdx-playlist-date-lbl, .pdx-playlist-date-val { font-size: 12px !important; }

            .pdx-vrow {
                flex-direction: column !important;
                height: auto !important;
                min-height: auto !important;
                padding: 8px 12px !important;
                gap: 6px !important;
                align-items: stretch !important;
            }
            .pdx-vrow-top { width: 100% !important; justify-content: flex-start !important; }
            .pdx-vrow-actions { width: 100% !important; justify-content: space-between !important; overflow-x: auto !important; }
            .pdx-name { max-width: calc(100vw - 120px) !important; }
        }
        
        /* Barra de ações do bunkr na galeria e controles da sidebar */
        .pdx-galbar .pdx-gallery-actionbar { margin: 0; }
        .pdx-gallery-actionbar, .pdx-gallery-actionbar input, .pdx-gallery-actionbar button { font-family: Inter, system-ui, sans-serif; box-sizing: border-box; }
        .pdx-act-btn .icon { font-size: 16px; }
        html.pdx-full-names .pdx-card-name { display: block !important; -webkit-line-clamp: unset !important; overflow: visible !important; word-break: break-all; }
        .pdx-sidebar-controls { flex: 0 0 auto; padding: 0 12px 8px; border-bottom: 1px solid rgba(255,255,255,.06); }
        .pdx-sidebar-controls .pdx-sidebar-sort:first-child { margin-top: 2px; }
${mediaComponentCSS(mediaTheme()).plc}
${mediaComponentCSS(mediaTheme()).actionbar}
${mediaComponentCSS(mediaTheme()).dates}
    `);

    /* Observer & Boot */
    const OURS = ".pdx-gtop,.pdx-vrow,.pdx-galbar,.pdx-sidebar,.pdx-host,.pdx-toast,.pdx-modal,.gallery";
    function relevant(muts) {
        for (const m of muts) { const t = m.target; if (t && t.nodeType === 1 && t.closest && t.closest(OURS)) continue; return true; }
        return false;
    }
    function boot() {
        window.addEventListener("hashchange", () => { writePosition(currentIndex() + 1); sync(); });
        const bootPos = readPosition();
        if (bootPos > 0) {
            const want = bootPos - 1;
            if (currentIndex() !== want) location.hash = "#item=" + want;
            else writePosition(bootPos);
        }
        new MutationObserver(muts => { if (relevant(muts)) sync(); }).observe(document.body, { childList: true, subtree: true });
        loadProxies();
        sync();
    }
    if (document.body) boot();
    else document.addEventListener("DOMContentLoaded", boot, { once: true });
})();
