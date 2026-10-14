    // ── CSS: post cards ──
    const CSS_POST_CARDS = `
            /* ============================================================
               POST estilo REDDIT (.smg-pc no <article>): 1 coluna · header · conteúdo · action bar.
               O JS moveu os nativos pro card; aqui esconde os containers esvaziados e estiliza.
               ============================================================ */
            /* contain style (SEM layout): contain:layout impedia o navegador de usar os posts como âncora
               de scroll nativo (Scroll Anchoring), fazendo a tela sambar ao carregar imagens acima do leitor.
               overflow-anchor:auto reativa o travamento nativo do ponto de leitura pelo motor do browser. */
            /* PERF: banner animado do SMG fora da tela fica parado (pauseOffscreenBanners, 07-posts-misc) */
            .userBanner.smg-anim-paused, .userBanner.smg-anim-paused *,
            .userBanner.smg-anim-paused::before, .userBanner.smg-anim-paused::after,
            .userBanner.smg-anim-paused *::before, .userBanner.smg-anim-paused *::after { animation-play-state: paused !important; }
            /* POST CARD: UMA pele pro post da thread (.smg-pc) e pros cards do Feed/Salvos (.smg-fp-card, o
               modificador "feed": thumb da thread + título como contexto, ver 07-feed). Superfície, header e
               conteúdo moram aqui; 07-feed só tem o que é do feed. */
            html.smg-thread .smg-pc, .smg-fp-card { background: var(--smg-s1) !important; border: 1px solid var(--smg-w-12) !important; border-radius: var(--smg-card-r) !important; transition: border-color var(--smg-dur-15) ease, box-shadow var(--smg-dur-15) ease; }
            html.smg-thread .smg-pc { margin: 0 0 var(--smg-sp-14); overflow: visible; contain: style; overflow-anchor: auto !important; }
            html.smg-thread .smg-pc:hover, .smg-fp-card:hover { border-color: var(--smg-w-22) !important; box-shadow: var(--smg-card-shadow) !important; }   /* realce no hover (estilo Reddit) — !important p/ vencer o tema do SMG */
            /* SMG: o card usa as superfícies (cinzas) do SimpCity — mais escuras que o tema SMG (s1 12.5 vs 13.5 etc.). Escopo .smg-pc → só os cards/posts; o resto do SMG mantém o tema dele. (escolha do user) */
            html.smg-smg .smg-pc, html.smg-smg .smg-fp-card { --smg-s1: hsl(0 0% 12.5%); --smg-s2: hsl(0 0% 16%); --smg-s3: hsl(0 0% 21%); }
            /* QUOTES / unfurl dentro do post: inset escuro (recuado) + border + rounded — !important p/ vencer o cinza claro do tema */
            html.smg-thread .smg-pc .bbCodeBlock { background: var(--smg-k-25) !important; border: 1px solid var(--smg-w-08) !important; border-radius: var(--smg-r-12) !important; }
            html.smg-thread .smg-pc .bbCodeBlock .contentRow, html.smg-thread .smg-pc .bbCodeBlock-content { background: transparent !important; }

            /* ---- QUOTES MODERNAS (Citações nos posts) ---- */
            .bbCodeBlock--quote,
            blockquote.bbCodeBlock--quote,
            html.smg-thread .smg-pc .bbCodeBlock--quote {
                margin: var(--smg-sp-16) 0 var(--smg-sp-20) !important;
                padding: 0 !important;
                border: 1px solid var(--smg-w-10) !important;
                border-left: 4px solid var(--smg-link) !important;
                border-radius: var(--smg-r-12) !important;
                background: var(--smg-s2) !important;
                overflow: hidden !important;
                box-shadow: var(--smg-shadow-1) !important;
            }
            .bbCodeBlock--quote .bbCodeBlock-title,
            html.smg-thread .smg-pc .bbCodeBlock--quote .bbCodeBlock-title {
                display: flex !important;
                align-items: center !important;
                padding: var(--smg-sp-10) var(--smg-sp-16) var(--smg-sp-8) !important;
                font-size: var(--smg-fs-13) !important;
                font-weight: 700 !important;
                color: var(--smg-link) !important;
                background: var(--smg-k-25) !important;
                border-bottom: 1px solid var(--smg-w-06) !important;
            }
            .bbCodeBlock--quote .bbCodeBlock-title a,
            .bbCodeBlock--quote .bbCodeBlock-sourceJump {
                color: inherit !important;
                text-decoration: none !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: var(--smg-sp-6) !important;
            }
            .bbCodeBlock--quote .bbCodeBlock-title a:hover {
                text-decoration: underline !important;
            }
            .bbCodeBlock--quote .bbCodeBlock-content,
            html.smg-thread .smg-pc .bbCodeBlock--quote .bbCodeBlock-content {
                padding: var(--smg-sp-14) var(--smg-sp-18) var(--smg-sp-16) !important;
                font-size: var(--smg-fs-14) !important;
                line-height: 1.65 !important;
                color: var(--smg-tx) !important;
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
                margin: 0 0 var(--smg-sp-6) !important;
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
                background: linear-gradient(to bottom, transparent, var(--smg-s1) 90%) !important;
                padding: var(--smg-sp-28) 0 var(--smg-sp-10) !important;
                text-align: center !important;
            }
            .bbCodeBlock--quote .bbCodeBlock-expandLink a,
            .bbCodeBlock--expandable.is-expandable .bbCodeBlock-expandLink a {
                display: inline-block !important;
                padding: var(--smg-sp-6) var(--smg-sp-16) !important;
                border-radius: var(--smg-r-pill) !important;
                background: var(--smg-s3) !important;
                border: 1px solid var(--smg-w-12) !important;
                color: var(--smg-link) !important;
                font-size: var(--smg-fs-12) !important;
                font-weight: 700 !important;
                cursor: pointer !important;
                transition: background var(--smg-dur-15) ease, transform var(--smg-dur-12) ease !important;
            }
            .bbCodeBlock--quote .bbCodeBlock-expandLink a:hover,
            .bbCodeBlock--expandable.is-expandable .bbCodeBlock-expandLink a:hover {
                background: var(--smg-link) !important;
                color: #fff !important;
            }
            /* Mídias / imagens dentro da citação */
            .bbCodeBlock--quote img.bbImage {
                max-height: 280px !important;
                object-fit: contain !important;
            }

            /* ---- Spoilers Redesign com Arrow de Collapse ---- */
            .bbCodeSpoiler {
                margin: var(--smg-sp-10) 0 !important;
                border-radius: var(--smg-r-12) !important;
                overflow: hidden !important;
                border: 1px solid var(--smg-bd) !important;
                background: var(--smg-s1) !important;
                box-shadow: var(--smg-shadow-1) !important;
            }
            .bbCodeSpoiler-button {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                width: 100% !important;
                padding: var(--smg-sp-10) var(--smg-sp-14) !important;
                background: var(--smg-s2) !important;
                border: none !important;
                border-radius: 0 !important;
                color: var(--smg-tx) !important;
                font-size: var(--smg-fs-14) !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease !important;
                box-sizing: border-box !important;
            }
            .bbCodeSpoiler-button:hover {
                background: var(--smg-w-10) !important;
                color: #fff !important;
            }
            .bbCodeSpoiler-button .button-text {
                display: flex !important;
                align-items: center !important;
                gap: var(--smg-sp-8) !important;
            }
            .bbCodeSpoiler-button .bbCodeSpoiler-button-title {
                color: var(--smg-link) !important;
                font-weight: 700 !important;
            }
            .smg-spoiler-arrow {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 20px !important;
                height: 20px !important;
                flex-shrink: 0 !important;
                color: var(--smg-w-60) !important;
                transition: transform var(--smg-dur-20) ease, color var(--smg-dur-15) ease !important;
            }
            .bbCodeSpoiler-button.is-active .smg-spoiler-arrow,
            .bbCodeSpoiler.is-active .smg-spoiler-arrow,
            .bbCodeSpoiler-button[aria-expanded="true"] .smg-spoiler-arrow {
                transform: rotate(180deg) !important;
                color: var(--smg-link) !important;
            }
            .bbCodeSpoiler-content {
                padding: var(--smg-sp-12) var(--smg-sp-14) !important;
                border-top: 1px solid var(--smg-bd) !important;
                background: var(--smg-s1) !important;
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
            html.smg-thread .smg-pc .message-content, .smg-fp-content { padding: var(--smg-sp-18) var(--smg-sp-24) var(--smg-sp-10); }
            /* HEADER (com divisor border-b) */
            html.smg-thread .smg-pc-head, .smg-fp-head { display: flex; align-items: flex-start; gap: var(--smg-sp-12); padding: var(--smg-sp-18) var(--smg-sp-24) var(--smg-sp-14); border-bottom: 1px solid var(--smg-bd); }
            html.smg-thread .smg-pc-avatar { flex: 0 0 auto; width: 40px; height: 40px; border-radius: var(--smg-r-round); overflow: hidden; }
            html.smg-thread .smg-pc-avatar img, html.smg-thread .smg-pc-avatar span { width: 100% !important; height: 100% !important; object-fit: cover; display: flex; align-items: center; justify-content: center; }
            html.smg-thread .smg-pc-meta, .smg-fp-meta { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: var(--smg-sp-4); }
            html.smg-thread .smg-pc-row1 { display: flex; align-items: center; gap: var(--smg-sp-8); }
            html.smg-thread .smg-pc-idline { display: flex; align-items: baseline; gap: var(--smg-sp-6); min-width: 0; flex-wrap: wrap; }
            html.smg-thread .smg-pc-name { margin: 0; font-size: var(--smg-fs-14); font-weight: 700; }
            html.smg-thread .smg-pc-name a { text-decoration: none; }                                   /* mantém a cor nativa do username (identidade) */
            html.smg-thread .smg-pc-name a:hover { text-decoration: underline; }
            html.smg-thread .smg-pc-dot, .smg-fp-dot { color: var(--smg-w-40); }
            html.smg-thread .smg-pc-time, .smg-fp-by { color: var(--smg-w-50); font-size: var(--smg-fs-13); }
            html.smg-thread .smg-pc-num { margin-left: auto; flex: 0 0 auto; color: var(--smg-w-40); font-size: var(--smg-fs-13); text-decoration: none; }
            html.smg-thread .smg-pc-num:hover { color: var(--smg-w-72); }
            html.smg-thread .smg-pc-row2 { display: flex; align-items: center; flex-wrap: wrap; gap: var(--smg-sp-6) var(--smg-sp-8); }
            html.smg-thread .smg-pc-utitle { margin: 0; font-size: var(--smg-fs-12); color: var(--smg-w-40); font-weight: 500; }
            html.smg-thread .smg-pc-row2 .userBanner { margin: 0; font-size: var(--smg-fs-10); padding: var(--smg-sp-2) var(--smg-sp-6); }
            html.smg-thread .smg-pc-row2 .featuredBadges { display: inline-flex; flex-wrap: wrap; gap: var(--smg-sp-4); margin: 0; }
            html.smg-thread .smg-pc-row2 .badgeIcon { width: 16px; height: 16px; }
            /* ACTION BAR */
            html.smg-thread .smg-pc-actions { display: flex; align-items: center; gap: var(--smg-sp-4); flex-wrap: wrap; padding: var(--smg-sp-12) var(--smg-sp-18) var(--smg-sp-14); margin-top: var(--smg-sp-8); border-top: 1px solid var(--smg-bd); }
            html.smg-thread .smg-pc-act { display: inline-flex !important; align-items: center; gap: var(--smg-sp-8); height: 34px; margin: 0 !important; padding: 0 var(--smg-sp-14) !important; border-radius: var(--smg-btn-r); border: 0; background: transparent; color: var(--smg-w-72); font-size: var(--smg-fs-13); font-weight: 600; line-height: 1; cursor: pointer; text-decoration: none; white-space: nowrap; transition: background var(--smg-dur-12) ease, color var(--smg-dur-12) ease; }
            html.smg-thread .smg-pc-act:hover { background: var(--smg-s3); color: #fff; }
            /* MÉTRICA ÚNICA dos ícones da action bar (post e comentário). Cada ação trazia a sua:
               o <i> da fonte do XF em 15px, o nosso react em 16, o bookmark/share nativos em outra
               — tamanhos, pesos e espaçamentos diferentes na mesma fila. Aqui todos passam a ter
               17px, o mesmo traço, a cor do botão (não a nativa) e o mesmo gap até o texto. */
            html.smg-thread :is(.smg-pc-act, .smg-cc-act) { gap: var(--smg-sp-6); }
            html.smg-thread :is(.smg-pc-act, .smg-cc-act)::before,
            html.smg-thread :is(.smg-pc-act, .smg-cc-act)::after,
            html.smg-thread :is(.smg-pc-act, .smg-cc-act) > i:not(.reaction-sprite):not(.reaction-image),
            html.smg-thread :is(.smg-pc-act, .smg-cc-act) > .fa--xf,
            html.smg-thread :is(.smg-pc-act, .smg-cc-act) > .uix_icon {
                display: none !important;
                content: none !important;
            }
            /* os NOSSOS (react + o que substituiu o glifo nativo): traço e preenchimento também */
            html.smg-thread :is(.smg-pc-act-ic, .smg-pc-react-ic, .smg-cc-react-ic) { display: inline-flex; align-items: center; font-size: var(--smg-fs-18); }
            html.smg-thread :is(.smg-pc-act-ic, .smg-pc-react-ic, .smg-cc-react-ic) svg {
                width: 1em !important; height: 1em !important; fill: none !important; stroke-width: 1.9 !important;
            }
            html.smg-thread .smg-pc-act svg { width: 16px; height: 16px; }
            html.smg-thread .smg-pc-act .reaction-sprite, html.smg-thread .smg-pc-act .reaction-image { width: 18px; height: 18px; }
            html.smg-thread .smg-pc-act--save .js-bookmarkText { display: none; }   /* texto nativo "Adicionar aos favoritos" fica escondido → o rótulo "Salvar" (smg-pc-act-lbl) é o visível (sem duplicar) */
            html.smg-thread .smg-pc-react-n { font-weight: 600; font-variant-numeric: tabular-nums; }
            /* ESTADO ATIVO (#3): salvo = bookmark (is-bookmarked, nativo) · reagido = classe do XF (is-reacted/reaction--active) → cor do tema + fundinho */
            html.smg-thread .smg-pc-act--save.is-bookmarked { color: var(--smg-link) !important; background: var(--smg-link-soft); }
            html.smg-thread .smg-pc-actions .smg-pc-act--react,
            html.smg-thread .smg-cc-actions .smg-cc-act--react {
                display: inline-flex !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
            html.smg-thread .smg-pc-react-n,
            html.smg-thread .smg-cc-react-n { display: inline-flex !important; align-items: baseline; gap: var(--smg-sp-4); visibility: visible !important; }
            /* Compartilhar copiou o link: confirmação de ~1,2s no próprio botão (não abre menu nenhum) */
            html.smg-thread .smg-pc-act--copied { color: #46d369 !important; background: rgba(70,211,105,0.12); }
            html.smg-thread .smg-pc-act--react.is-reacted, html.smg-thread .smg-pc-act--react.reaction--active, html.smg-thread .smg-cc-act--react.is-reacted, html.smg-thread .smg-cc-act--react.reaction--active { color: var(--smg-link) !important; background: var(--smg-link-soft); }
            /* REACT: cor NEUTRA (ícone + número + texto iguais aos outros) — o azul nativo fazia parecer "já reagi" */
            html.smg-thread .smg-pc-act--react { color: var(--smg-w-72) !important; }
            html.smg-thread .smg-cc-act--react { color: var(--smg-w-60) !important; }
            html.smg-thread .smg-pc-act--react *, html.smg-thread .smg-cc-act--react * { color: inherit !important; }
            html.smg-thread .smg-pc-act--react:hover, html.smg-thread .smg-cc-act--react:hover { color: #fff !important; }
            /* react = CONTADOR: esconde o visual nativo (sprite/<i>/emoji/"React" = a "asa" torta), usa ícone limpo + "N reações" */
            html.smg-thread .smg-pc-act--react > i, html.smg-thread .smg-pc-act--react .reaction-sprite, html.smg-thread .smg-pc-act--react .reaction-image, html.smg-thread .smg-pc-act--react .reaction-text,
            html.smg-thread .smg-cc-act--react > i, html.smg-thread .smg-cc-act--react .reaction-sprite, html.smg-thread .smg-cc-act--react .reaction-image, html.smg-thread .smg-cc-act--react .reaction-text { display: none !important; }
            /* CONTENT: texto maior que a action bar (hierarquia) */
            html.smg-thread .smg-pc .message-content, html.smg-thread .smg-pc .message-content .bbWrapper, .smg-fp-content { font-size: var(--smg-fs-15); line-height: 1.55; }
            /* PILLS de reação ESCONDIDAS (escolha do user): misturam joypixels + emojione (medal) = impossível alinhar a arte.
               O contador "N reações" na action bar já mostra o total (lê as contagens do DOM, que continua aqui em display:none). */
            html.smg-thread .smg-pc .reactionsBar, html.smg-thread .smg-pc .comment-reactions { display: none !important; }
            /* ⋯ overflow */
            html.smg-thread .smg-pc-morewrap { position: relative; margin-left: auto; }
            html.smg-thread .smg-pc-act--more { font-size: var(--smg-fs-18); padding: 0 var(--smg-sp-12); }
            html.smg-thread .smg-pc-morepop { position: absolute; right: 0; bottom: calc(100% + 6px); display: none; flex-direction: column; gap: var(--smg-sp-2); min-width: 168px; padding: var(--smg-sp-6); z-index: var(--smg-z-50); background: var(--smg-s2); border: 1px solid var(--smg-bd2); border-radius: var(--smg-pop-r); box-shadow: var(--smg-pop-shadow); }
            html.smg-thread .smg-pc-morewrap.open .smg-pc-morepop { display: flex; }
            html.smg-thread .smg-pc-morerow { display: flex !important; align-items: center; gap: var(--smg-sp-8); height: 36px; padding: 0 var(--smg-sp-10); border-radius: var(--smg-r-8); background: transparent; color: var(--smg-w-85); font-size: var(--smg-fs-14); font-weight: 600; text-align: left; text-decoration: none; white-space: nowrap; cursor: pointer; }
            html.smg-thread .smg-pc-morerow:hover { background: var(--smg-s3); color: #fff; }
            /* DISCUSSÃO (social): badge + indicador "silent" no header do post */
            html.smg-thread .smg-pc-idline .smg-discussion-badge { font-size: var(--smg-fs-10); font-weight: 800; letter-spacing: .04em; padding: var(--smg-sp-2) var(--smg-sp-6); border-radius: var(--smg-badge-r); background: var(--smg-link-soft); color: var(--smg-link); }
            html.smg-thread .smg-pc-idline .smg-silent-indicator { font-size: var(--smg-fs-11); color: var(--smg-w-40); display: inline-flex; align-items: center; gap: var(--smg-sp-4); }
            /* mobile: barra de ações compacta numa linha só (depois da regra base, senão nunca vale) */
            @media (max-width: 600px) {
                html.smg-thread .smg-pc-actions { gap: var(--smg-sp-2); flex-wrap: nowrap; padding: var(--smg-sp-10) var(--smg-sp-14) var(--smg-sp-12); }
                html.smg-thread .smg-pc-act { padding: 0 var(--smg-sp-12) !important; }
                html.smg-thread .smg-pc-act--save,
                html.smg-thread .smg-pc-act--share,
                html.smg-thread .smg-pc-act--comment { padding: 0 var(--smg-sp-10) !important; }
            }
`;