    // ── CSS: post cards ──
    const CSS_POST_CARDS = `
            /* ============================================================
               POST estilo REDDIT (.smg-pc no <article>): 1 coluna · header · conteúdo · action bar.
               O JS moveu os nativos pro card; aqui esconde os containers esvaziados e estiliza.
               ============================================================ */
            /* contain style (SEM layout): contain:layout impedia o navegador de usar os posts como âncora
               de scroll nativo (Scroll Anchoring), fazendo a tela sambar ao carregar imagens acima do leitor.
               overflow-anchor:auto reativa o travamento nativo do ponto de leitura pelo motor do browser. */
            html.smg-thread .block--messages, html.smg-thread .block-body--messages { overflow-anchor: auto !important; }
            html.smg-thread .smg-pc { background: var(--smg-s1, #16171b) !important; border: 1px solid rgba(255,255,255,0.11) !important; border-radius: 18px !important; margin: 0 0 14px; overflow: visible; transition: border-color .16s ease, box-shadow .16s ease; contain: style; overflow-anchor: auto !important; }
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
            /* Citação de comentário (uw_quote_thing) não tem o wrapper .bbCodeBlock--quote.
               Como div solta no bbWrapper ela vira uma coluna estreita e o nome quebra no meio. */
            .bbCodeBlock-title.uw_quote_thing,
            html.smg-thread .smg-cc .bbCodeBlock-title.uw_quote_thing {
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
                float: none !important;
                margin: 0 0 6px !important;
                white-space: normal !important;
            }
            .bbCodeBlock-title.uw_quote_thing .username,
            .bbCodeBlock-title.uw_quote_thing .username span {
                display: inline !important;
                white-space: nowrap !important;
            }
            .bbWrapper:has(> .bbCodeBlock-title.uw_quote_thing) {
                display: block !important;
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
                color: rgba(255,255,255,0.6) !important;
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
            html.smg-thread .smg-pc-act--save.is-bookmarked .smg-pc-act-ic svg { fill: currentColor !important; stroke: currentColor !important; }
            html.smg-thread .smg-pc-actions .smg-pc-act--react,
            html.smg-thread .smg-cc-actions .smg-cc-act--react {
                display: inline-flex !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
            html.smg-thread .smg-pc-react-n,
            html.smg-thread .smg-cc-react-n { display: inline-flex !important; align-items: baseline; gap: 4px; visibility: visible !important; }
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
`;