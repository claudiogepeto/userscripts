    // ── CSS: comments, editor and quick reply ──
    const CSS_COMMENTS = `
            /* ============================================================
               COMENTÁRIOS (uw_fcs, SMG): modernos, indentados sob o post (thread-line). Mesmo modelo do card.
               ============================================================ */
            html.smg-thread .smg-pc .message-responses { margin-top: var(--smg-sp-4); padding: var(--smg-sp-4) var(--smg-sp-24) var(--smg-sp-18); }
            /* HEADER da seção de comentários: faixa destacada (full-width via margin negativa que cancela o padding da section) + dividers em cima/embaixo.
               !important + escopo .smg-pc → ganha do neutralize/tema. align-items:center + line-height:1 centralizam ícone · nº · "Comments". */
            html.smg-thread .smg-pc .uw-comment-count { display: flex !important; flex-wrap: wrap; align-items: center !important; gap: var(--smg-sp-8); margin: var(--smg-sp-6) -22px var(--smg-sp-12) !important; padding: var(--smg-sp-14) var(--smg-sp-24) !important; font-size: var(--smg-fs-14); font-weight: 800; line-height: 1; color: #fff; background: var(--smg-s2) !important; border-top: 1px solid var(--smg-bd2) !important; border-bottom: 1px solid var(--smg-bd2) !important; }
            html.smg-thread .smg-pc .uw-comment-count .mdi { font-size: var(--smg-fs-16); line-height: 1; display: inline-flex; align-items: center; opacity: 0.85; }
            html.smg-thread .smg-pc .uw-comment-count .comment-count { color: var(--smg-link); line-height: 1; }   /* nº em destaque (cor do tema) */
            html.smg-thread .smg-pc .uw-fcs-sort-toggle { display: inline-flex; align-items: center; gap: var(--smg-sp-6); margin-left: auto; }   /* sort no canto DIREITO do header */
            html.smg-thread .smg-pc .uw-fcs-sort-sep { display: none; }   /* tira o "|" separador */
            html.smg-thread .smg-pc .smg-cbar-sortlbl { font-size: var(--smg-fs-12); font-weight: 600; color: var(--smg-w-50); white-space: nowrap; }   /* label "Sort:" antes do chip */
            /* "Top reacted" → chip de sort à direita */
            html.smg-thread .smg-pc .uw-fcs-sort-btn { display: inline-flex; align-items: center; gap: var(--smg-sp-6); padding: var(--smg-sp-6) var(--smg-sp-12); border: 1px solid var(--smg-bd2); border-radius: var(--smg-r-pill); background: var(--smg-s1); color: var(--smg-w-72); font-size: var(--smg-fs-12); font-weight: 700; line-height: 1; text-decoration: none !important; white-space: nowrap; }
            html.smg-thread .smg-pc .uw-fcs-sort-btn:hover { background: var(--smg-s3); color: #fff; border-color: var(--smg-bd2); }
            html.smg-thread .smg-pc .uw-fcs-sort-btn i { font-size: var(--smg-fs-12); opacity: .85; }
            /* "Previous comments" → botão paginador (linha própria, full-width — flex-basis 100% quebra a linha) */
            html.smg-thread .smg-pc .uw_load_prev { flex: 0 0 100%; display: block; box-sizing: border-box; margin: var(--smg-sp-12) 0 var(--smg-sp-2); padding: var(--smg-sp-10); border: 1px solid var(--smg-bd2); border-radius: var(--smg-r-10); background: var(--smg-s1); color: var(--smg-link); font-size: var(--smg-fs-13); font-weight: 700; text-align: center; text-decoration: none !important; }
            html.smg-thread .smg-pc .uw_load_prev:hover { background: var(--smg-s3); border-color: var(--smg-bd2); }
            html.smg-thread .smg-cc { position: relative; margin: 0; padding: var(--smg-sp-14) 0 var(--smg-sp-14) var(--smg-sp-16); border-left: 2px solid var(--smg-bd2); border-bottom: 1px solid var(--smg-bd); }
            html.smg-thread .smg-cc .comment-inner { display: block; }
            html.smg-thread .smg-cc .comment-avatar { display: none; }                              /* movido pro head */
            html.smg-thread .smg-cc .comment-content { display: none; }                             /* user/tempo/# movidos */
            html.smg-thread .smg-cc .comment-footer .comment-actionBar { display: none; }            /* movido p/ smg-cc-actions (pills .comment-reactions ficam) */
            html.smg-thread .smg-cc .comment-footer .js-historyTarget { display: none; }
            html.smg-thread .smg-cc-head { display: flex; align-items: center; gap: var(--smg-sp-8); margin-bottom: var(--smg-sp-6); }
            html.smg-thread .smg-cc-avatar { width: 28px; height: 28px; border-radius: var(--smg-r-round); overflow: hidden; flex: 0 0 auto; }
            html.smg-thread .smg-cc-avatar img, html.smg-thread .smg-cc-avatar span { width: 100% !important; height: 100% !important; object-fit: cover; display: flex; align-items: center; justify-content: center; }
            html.smg-thread .smg-cc-idline { display: flex; align-items: baseline; gap: var(--smg-sp-6); min-width: 0; flex-wrap: wrap; flex: 1 1 auto; }
            html.smg-thread .smg-cc-name { font-size: var(--smg-fs-13); font-weight: 700; text-decoration: none; }
            html.smg-thread .smg-cc-name:hover { text-decoration: underline; }
            html.smg-thread .smg-cc-time { color: var(--smg-w-50); font-size: var(--smg-fs-12); }
            html.smg-thread .smg-cc-num { margin-left: auto; color: var(--smg-w-40); font-size: var(--smg-fs-12); text-decoration: none; }
            html.smg-thread .smg-cc-num:hover { color: var(--smg-w-72); }
            html.smg-thread .smg-cc .comment-body { font-size: var(--smg-fs-14); line-height: 1.5; }
            html.smg-thread .smg-cc-actions { display: flex; align-items: center; gap: var(--smg-sp-4); flex-wrap: wrap; margin-top: var(--smg-sp-6); }
            html.smg-thread .smg-cc-act { display: inline-flex !important; align-items: center; gap: var(--smg-sp-6); height: 30px; margin: 0 !important; padding: 0 var(--smg-sp-10) !important; border-radius: var(--smg-r-8); background: transparent; border: 0; color: var(--smg-w-60); font-size: var(--smg-fs-13); font-weight: 600; line-height: 1; cursor: pointer; text-decoration: none; white-space: nowrap; transition: background var(--smg-dur-12) ease, color var(--smg-dur-12) ease; }
            html.smg-thread .smg-cc-act:hover { background: var(--smg-s3); color: #fff; }
            html.smg-thread .smg-cc-act svg { width: 14px; height: 14px; }
            html.smg-thread .smg-cc-act > i { font-size: var(--smg-fs-14); }
            html.smg-thread .smg-cc-act .reaction-image, html.smg-thread .smg-cc-act .reaction-sprite { width: 16px; height: 16px; }
            html.smg-thread .smg-cc-act--more { margin-left: auto; font-size: var(--smg-fs-16); }
            html.smg-thread .smg-cc-react-n { font-weight: 600; font-variant-numeric: tabular-nums; }
            /* matar o "quadrado cinza" do tema nos comentários → integra no card; mantém só o thread-line do .smg-cc */
            html.smg-thread .smg-pc .message-responses, html.smg-thread .smg-pc .message-responseRow:not(.uw-comment-count), html.smg-thread .smg-pc .uw_fcs_comment_section,
            html.smg-thread .smg-cc, html.smg-thread .smg-cc .comment-inner, html.smg-thread .smg-cc .comment-main, html.smg-thread .smg-cc .comment-content { background: transparent !important; box-shadow: none !important; }
            html.smg-thread .smg-pc .message-responseRow:not(.uw-comment-count), html.smg-thread .smg-cc .comment-inner, html.smg-thread .smg-cc .comment-main, html.smg-thread .smg-cc .comment-content { border: 0 !important; }
            /* editor "escrever comentário": blend escuro (era um quadrado claro do tema) */
            html.smg-thread .smg-pc .editorPlaceholder-placeholder .input { background: var(--smg-s2) !important; border: 1px solid var(--smg-bd2) !important; border-radius: var(--smg-r-10) !important; color: var(--smg-w-60) !important; }
            /* ---- editor Froala (reply / comentário / conversa): vinha CLARO (destoava do tema escuro) → escurece toolbar, área de edição e dropdowns ---- */
            /* RING ÚNICO: a borda do editor vive SÓ no .fr-box (filhos com border 0) — o tema desenhava
               border-top azul no toolbar + border-bottom azul no second-toolbar, parecendo um anel quebrado.
               SEM overflow:hidden no box (clipava os dropdowns absolutos do toolbar) → cantos arredondados
               explícitos nos filhos das pontas. */
            :is(html.smg-sc, html.smg-smg) .fr-box.fr-basic {
                border: 1px solid var(--smg-bd2) !important;
                border-radius: var(--smg-r-12) !important; box-shadow: none !important;
                transition: border-color var(--smg-dur-15) ease;
            }
            :is(html.smg-sc, html.smg-smg) .fr-box.fr-basic .fr-toolbar {
                background: var(--smg-s2) !important; color: var(--smg-tx) !important;
                border: 0 !important; border-bottom: 1px solid var(--smg-bd) !important;
                border-radius: var(--smg-r-12) var(--smg-r-12) 0 0 !important; box-shadow: none !important;
            }
            :is(html.smg-sc, html.smg-smg) .fr-box.fr-basic .fr-toolbar .fr-more-toolbar { background: var(--smg-s2) !important; border: 0 !important; box-shadow: none !important; }
            :is(html.smg-sc, html.smg-smg) .fr-box.fr-basic .fr-second-toolbar {
                background: var(--smg-s2) !important; color: var(--smg-tx) !important;
                border: 0 !important; border-radius: 0 0 var(--smg-r-12) var(--smg-r-12) !important; box-shadow: none !important;
            }
            :is(html.smg-sc, html.smg-smg) .fr-box.fr-basic .fr-wrapper { background: var(--smg-s1) !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
            :is(html.smg-sc, html.smg-smg) .fr-box.fr-basic .fr-element.fr-view { color: var(--smg-tx) !important; }
            :is(html.smg-sc, html.smg-smg) .fr-box.fr-basic .fr-placeholder { color: var(--smg-w-40) !important; }
            :is(html.smg-sc, html.smg-smg) .fr-toolbar .fr-btn, :is(html.smg-sc, html.smg-smg) .fr-toolbar .fr-btn i, :is(html.smg-sc, html.smg-smg) .fr-toolbar .fr-btn svg { color: var(--smg-w-72) !important; }
            :is(html.smg-sc, html.smg-smg) .fr-toolbar .fr-btn.fr-disabled, :is(html.smg-sc, html.smg-smg) .fr-toolbar .fr-btn.fr-disabled i { color: var(--smg-w-30) !important; }
            :is(html.smg-sc, html.smg-smg) .fr-toolbar .fr-btn:not(.fr-disabled):hover { background: var(--smg-s3) !important; }
            :is(html.smg-sc, html.smg-smg) .fr-toolbar .fr-btn.fr-active { color: var(--smg-link) !important; }
            :is(html.smg-sc, html.smg-smg) .fr-dropdown-menu { background: var(--smg-s1) !important; box-shadow: var(--smg-shadow-2) !important; }
            :is(html.smg-sc, html.smg-smg) .fr-dropdown-menu .fr-dropdown-wrapper { background: transparent !important; }
            :is(html.smg-sc, html.smg-smg) .fr-dropdown-menu .fr-dropdown-list a, :is(html.smg-sc, html.smg-smg) .fr-dropdown-menu .fr-dropdown-list a * { color: var(--smg-tx) !important; }
            :is(html.smg-sc, html.smg-smg) .fr-dropdown-menu .fr-dropdown-list a:hover { background: var(--smg-s3) !important; }
            /* foco no editor: o RING (borda do .fr-box) acende no acento — mesma linguagem dos inputs */
            :is(html.smg-sc, html.smg-smg) .fr-box.fr-basic:focus-within { border-color: var(--smg-link) !important; }
            /* QUOTE dentro do EDITOR (blockquote do Froala ao citar um post): mesmo visual dos quotes
               renderizados no post (.smg-pc .bbCodeBlock) — inset escuro + filete no ACENTO. O caixote
               azul-claro com borda azul era o estilo nativo do editor do XF. */
            :is(html.smg-sc, html.smg-smg) .fr-element blockquote {
                background: var(--smg-k-25) !important;
                border: 1px solid var(--smg-w-08) !important;
                border-left: 3px solid var(--smg-link) !important;
                border-radius: var(--smg-r-12) !important;
                margin: var(--smg-sp-10) 0 !important; padding: var(--smg-sp-12) var(--smg-sp-16) !important;
                color: var(--smg-w-85) !important;
            }
            /* nome do autor citado (o XF desenha via ::before com attr(data-quote)) → acento + peso */
            :is(html.smg-sc, html.smg-smg) .fr-element blockquote::before {
                color: var(--smg-link) !important;
                font-weight: 700 !important; font-size: var(--smg-fs-13) !important; opacity: 1 !important;
            }
            :is(html.smg-sc, html.smg-smg) .fr-element blockquote img { border-radius: var(--smg-r-8); }
            /* PREVIEW do editor (aba de pré-visualização): quote renderizado ganha o MESMO inset dos posts
               (o .smg-pc não alcança aqui — o preview vive dentro do form, fora do card de post) */
            :is(html.smg-sc, html.smg-smg) .xfPreview .bbCodeBlock {
                background: var(--smg-k-25) !important; border: 1px solid var(--smg-w-08) !important; border-radius: var(--smg-r-12) !important;
            }
            :is(html.smg-sc, html.smg-smg) .xfPreview .bbCodeBlock .contentRow, :is(html.smg-sc, html.smg-smg) .xfPreview .bbCodeBlock-content { background: transparent !important; }

            /* ===== QUICK REPLY (rodapé da thread): card no padrão dos posts (.smg-pc) =====
               Sai a coluna cinza do avatar (decoração — é o seu próprio), o editor ocupa o card todo
               e a botoeira entra no tema: Post Content = acento · Add Discussion = secundário ·
               extras (.button--link, ex. ImagePond) = chip fantasma à ESQUERDA. */
            html.smg-thread form.js-quickReply .block-container {
                background: var(--smg-s1) !important; border: 1px solid var(--smg-w-12) !important;
                border-radius: var(--smg-r-18) !important; box-shadow: none !important; overflow: hidden;
            }
            html.smg-smg.smg-thread form.js-quickReply .block-container { --smg-s1: hsl(0 0% 12.5%); --smg-s2: hsl(0 0% 16%); --smg-s3: hsl(0 0% 21%); }   /* mesmas superfícies dos cards (.smg-pc) */
            html.smg-thread form.js-quickReply .block-body { background: transparent !important; border: 0 !important; padding: 0 !important; }
            html.smg-thread .message--quickReply { background: transparent !important; border: 0 !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; }
            html.smg-thread .message--quickReply .message-inner { display: block !important; }
            html.smg-thread .message--quickReply .message-cell--user { display: none !important; }
            html.smg-thread .message--quickReply .message-cell--main {
                width: 100% !important; max-width: none !important; padding: var(--smg-sp-16) var(--smg-sp-18) !important;
                border: 0 !important; background: transparent !important;
            }
            /* botoeira: extras à esquerda, ações primárias empurradas pra DIREITA */
            html.smg-thread form.js-quickReply .formButtonGroup { display: flex !important; align-items: center; gap: var(--smg-sp-8); flex-wrap: wrap; margin-top: var(--smg-sp-12); float: none !important; }
            html.smg-thread form.js-quickReply .formButtonGroup-primary { display: flex !important; gap: var(--smg-sp-8); order: 9; margin-left: auto; float: none !important; }
            html.smg-thread form.js-quickReply .formButtonGroup .button {
                min-height: 40px; padding: 0 var(--smg-sp-18); margin: 0 !important;
                border-radius: var(--smg-r-12) !important; box-shadow: none !important;
                font-size: var(--smg-fs-14) !important; font-weight: 600 !important;
                display: inline-flex !important; align-items: center; gap: var(--smg-sp-8);
                background: var(--smg-s2) !important; border: 1px solid var(--smg-bd2) !important; color: var(--smg-w-85) !important;
                transition: background var(--smg-dur-15) ease, color var(--smg-dur-15) ease, filter var(--smg-dur-15) ease, transform var(--smg-dur-12) ease;
            }
            html.smg-thread form.js-quickReply .formButtonGroup .button:hover { background: var(--smg-s3) !important; color: #fff !important; }
            html.smg-thread form.js-quickReply .formButtonGroup .button:active { transform: scale(0.97); }
            html.smg-thread form.js-quickReply .formButtonGroup .button--primary {
                background: var(--smg-link-strong) !important; border: 0 !important; color: #fff !important; font-weight: 700 !important; padding: 0 var(--smg-sp-24);
            }
            html.smg-thread form.js-quickReply .formButtonGroup .button--primary:hover { background: var(--smg-link-strong) !important; filter: brightness(1.12); }
            html.smg-thread form.js-quickReply .formButtonGroup .button--link {
                background: transparent !important; border: 1px solid var(--smg-bd) !important; color: var(--smg-w-55) !important;
            }
            html.smg-thread form.js-quickReply .formButtonGroup .button--link:hover { background: var(--smg-s2) !important; color: #fff !important; }
            @media (max-width: 600px) {
                html.smg-thread form.js-quickReply .block-container { border-radius: var(--smg-r-14) !important; }
                html.smg-thread .message--quickReply .message-cell--main { padding: var(--smg-sp-12) var(--smg-sp-14) !important; }
            }
        `;
