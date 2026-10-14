    // ── CSS: listing filter and sort popovers ──
    const CSS_LISTING_CONTROLS = `
            /* ---- settings / filtro por autor / filtro da listagem: popovers (padrão do search) ---- */
            #smg-settings-pop, #smg-listfilter-pop, #smg-listsort-pop {
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
                outline: 2px solid var(--smg-link) !important;
                outline-offset: 1px !important;
                box-shadow: 0 0 10px rgba(255,119,178,0.45) !important;
                filter: brightness(1.25) !important;
            }
            .smg-badge-chip.tagItem {
                border-radius: 4px !important;
                background: rgba(255,255,255,0.06) !important;
                color: #cbd9ff !important;
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
            .smg-lf-input {
                height: 38px; padding: 0 12px; box-sizing: border-box;
                border-radius: 10px; border: 1px solid rgba(255,255,255,0.16);
                background: rgba(255,255,255,0.06); color: #fff; font-size: 14px; outline: none;
            }
            .smg-lf-input:focus { border-color: rgba(255,255,255,0.45); }
            .smg-lf-select option { background: #1b1c20; color: #fff; }
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
            .smg-lf-dir-opt.active { background: var(--smg-link); color: #fff; font-weight: 700; box-shadow: 0 2px 8px rgba(255,119,178,0.3); }
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
                background: var(--smg-link);
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
            }`;