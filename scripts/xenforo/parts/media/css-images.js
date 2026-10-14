    // media/css-images.js
    // Owns: CSS for post images, link chips and file-host cards.
    // Exposes: CSS_MEDIA_IMAGES.
    // Depends on: --smg-* tokens from styles/01-base.js; composed by core/05-styles.js (order matters).
    // ── CSS: post images, link chips and file-host cards ──
    const CSS_MEDIA_IMAGES = `
            /* ---- images ---- */
            img.bbImage {
                width: auto !important;
                height: auto !important;
                max-width: min(75%, 880px) !important;
                max-height: none !important;
                display: block !important;
                margin: 0 auto !important;
                border-radius: var(--smg-img-r) !important;
                cursor: pointer !important;
            }
            a.smg-imglink,
            .bbImageWrapper {
                display: table !important;
                width: fit-content !important;
                max-width: 100% !important;
                margin-left: auto !important;
                margin-right: auto !important;
                margin-top: var(--smg-sp-8) !important;
                margin-bottom: var(--smg-sp-8) !important;
                text-align: center !important;
            }
            /* skeleton: shimmer enquanto a imagem do post não pintou (sem DOM extra — é o bg da própria <img>).
               aspect-ratio (não min-height fixo!) → o box escala com a largura, batendo com a maioria das
               imagens (paisagem). a thumb fica visível e fixa o tamanho real; o JS troca pra inline aspect-ratio
               no load. some no .smg-img-ready. Anti-CLS: a faixa antiga de 160px fixos estourava ao carregar. */
            /* PERF: pulso de OPACITY (composita na GPU) em vez do shimmer por background-position (que repintava
               a caixa INTEIRA a cada frame × dezenas de imgs carregando ao mesmo tempo no burst do scroll infinito).
               O keyframes smg-img-shimmer continua existindo pros consumidores pequenos (fhcard 72px). */
            img.bbImage:not(.smg-img-ready):not([style*="aspect-ratio"]) {
                width: 100% !important;
                aspect-ratio: var(--smg-img-ph, 10 / 13);   /* = MASONRY_PH_RELH (1.3) do motor */
                object-fit: cover;
                background-color: var(--smg-s2);
                border-radius: var(--smg-r-8);
            }
            @keyframes smg-img-shimmer { 0% { background-position: 160% 0; } 100% { background-position: -160% 0; } }
            /* host de imagem (jpg6/cuckcapital) lento/intermitente: o FÓRUM faz .lazyload/.lazyloading{opacity:0} até carregar. Quando o host pendura, a img some (opacity 0). Força visível p/ estas (têm data-smg-link) → aparece o shimmer e depois a img; se travar de vez, o JS troca por link. */
            img.bbImage[data-smg-link] { opacity: 1 !important; }
            /* fallback de imagem que não renderiza (jpg6.su/jpg5 & afins fora do ar) → chip de link clicável */
            /* CHIP de link solto: mesmo idioma visual dos cards (borda, raio, tipografia), só que numa
               linha — antes era uma caixa alta, com fonte grande e a URL quebrada no meio da palavra. */
            .smg-imglink-fallback { display: inline-flex; align-items: center; gap: var(--smg-sp-8); max-width: 100%; margin: var(--smg-sp-4) 0; padding: var(--smg-sp-6) var(--smg-sp-10); border: 1px solid var(--smg-bd); border-radius: var(--smg-r-10); background: var(--smg-s1); color: var(--smg-tx) !important; font-size: var(--smg-fs-13); font-weight: 500; text-decoration: none !important; vertical-align: middle; }
            .smg-imglink-fallback::before { content: "🔗"; font-size: var(--smg-fs-12); opacity: 0.7; flex: 0 0 auto; }
            .smg-imglink-fallback.smg-has-fav::before { content: none; }   /* achamos o ícone do site → dispensa o emoji */
            .smg-linkfav { flex: 0 0 auto; width: 16px; height: 16px; border-radius: var(--smg-r-4); object-fit: contain; }
            .smg-linktext { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .smg-imglink-fallback:hover { background: var(--smg-s2); border-color: var(--smg-bd2); color: var(--smg-link) !important; }

            /* card de link de file-host (pixeldrain/bunkr/gofile): estilo limpo, escuro e neutro */
            .smg-fhcard {
                display: flex;
                align-items: center;
                gap: var(--smg-sp-10);
                width: 100%;
                box-sizing: border-box;
                margin: var(--smg-sp-8) 0;
                padding: var(--smg-sp-8) var(--smg-sp-12);
                border: 1px solid var(--smg-w-12);
                border-radius: var(--smg-card-r);
                background: var(--smg-s1);
                box-shadow: var(--smg-card-shadow);
            }
            .smg-fhcard-main {
                display: flex;
                align-items: center;
                gap: var(--smg-sp-12);
                flex: 1 1 auto;
                min-width: 0;
                padding: var(--smg-sp-4);
                border-radius: var(--smg-r-8);
                text-decoration: none !important;
                color: var(--smg-tx) !important;
                filter: none !important;
                transition: opacity var(--smg-dur-15) ease;
            }
            .smg-fhcard-main:hover {
                background: transparent;
                text-decoration: none !important;
                filter: none !important;
            }
            .smg-fhcard-main:hover .smg-fhcard-host {
                color: #fff !important;
            }
            .smg-fhcard-btn {
                flex: 0 0 auto;
                align-self: center;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 34px;
                height: 34px;
                border: 1px solid var(--smg-w-12);
                border-radius: var(--smg-btn-r);
                background: var(--smg-w-06);
                color: var(--smg-w-72);
                cursor: pointer;
                text-decoration: none !important;
                filter: none !important;
                transition: background var(--smg-dur-15) ease, border-color var(--smg-dur-15) ease, color var(--smg-dur-15) ease;
            }
            .smg-fhcard-btn:hover {
                background: var(--smg-w-12);
                border-color: var(--smg-w-22);
                color: #fff;
                filter: none !important;
            }
            .smg-fhcard-btn svg { width: 17px; height: 17px; }
            .smg-fhcard-copied { color: #46d369 !important; }
            /* preview RICO: mosaico de até 4 thumbs + badge de contagem + "+N" no último */
            .smg-fhcard-thumb { position: relative; flex: 0 0 auto; width: 96px; height: 96px; border-radius: var(--smg-r-12); overflow: hidden; background: var(--smg-s2); }
            .smg-fhcard-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .smg-fhcard-thumb--multi { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: var(--smg-sp-2); }
            .smg-fhcard-cell { position: relative; overflow: hidden; background: var(--smg-s2); }
            .smg-fhcard-more { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: var(--smg-k-55); color: #fff; font-size: var(--smg-fs-16); font-weight: 800; }
            .smg-fhcard-count { position: absolute; left: 6px; bottom: 6px; display: inline-flex; align-items: center; gap: var(--smg-sp-4); padding: var(--smg-sp-2) var(--smg-sp-8) var(--smg-sp-2) var(--smg-sp-6); border-radius: var(--smg-badge-r); background: var(--smg-k-62); color: #fff; font: 700 11.5px/1 -apple-system, system-ui, sans-serif; }
            .smg-fhcard-count svg { width: 12px; height: 12px; fill: none !important; }
            /* skeleton enquanto a thumb carrega (some no load); reusa o @keyframes smg-img-shimmer */
            .smg-fhcard-thumb--loading { background-image: linear-gradient(90deg, transparent, var(--smg-w-08) 50%, transparent); background-size: 220% 100%; background-repeat: no-repeat; animation: smg-img-shimmer 1.25s ease-in-out infinite; }
            /* sem thumb → logo grande do host centralizado no tile */
            /* SEM preview real (só logo/inicial): tile MENOR. Um favicon de 32px esticado num quadrado de
               96px só gastava altura — o tile grande existe pro mosaico de thumbs, que aí sim mostra algo. */
            .smg-fhcard-thumb--logo, .smg-fhcard-thumb--letter { width: 54px; height: 54px; border-radius: var(--smg-r-10); }
            .smg-fhcard-thumb--logo { display: flex; align-items: center; justify-content: center; }
            .smg-fhcard-thumb--logo img.smg-fhcard-logo { width: 30px; height: 30px; object-fit: contain; }
            .smg-fhcard-thumb--letter { display: flex; align-items: center; justify-content: center; font: 800 22px/1 -apple-system, system-ui, "Segoe UI", sans-serif; color: #fff; background: linear-gradient(135deg, var(--smg-link-strong), var(--smg-link)); }
            .smg-fhcard-thumb--instagram {
                background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            .smg-fhcard-thumb--instagram svg {
                width: 30px !important;
                height: 30px !important;
                color: #fff !important;
                stroke: #fff !important;
            }
            .smg-fhcard--inline .smg-fhcard-thumb--instagram svg {
                width: 15px !important;
                height: 15px !important;
            }
            .smg-fhcard-thumb--x {
                background: #000 !important;
                border: 1px solid var(--smg-w-14) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            .smg-fhcard-thumb--x svg {
                width: 22px !important;
                height: 22px !important;
                color: #fff !important;
                fill: #fff !important;
            }
            .smg-fhcard--inline .smg-fhcard-thumb--x svg {
                width: 13px !important;
                height: 13px !important;
            }
            .smg-fhcard-body { display: flex; flex-direction: column; gap: var(--smg-sp-4); min-width: 0; flex: 1 1 auto; }
            .smg-fhcard-platform { font-size: var(--smg-fs-11); font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: var(--smg-link); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.2; }
            .smg-fhcard-host { font-size: var(--smg-fs-14); font-weight: 800; color: var(--smg-tx); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .smg-fhcard-sub { font-size: var(--smg-fs-12); color: var(--smg-w-55); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            /* DENTRO DE LISTA/TABELA: uma linha por item. O card cheio (tile de 96px) repetido em cada
               <li> de uma lista de 80 links viraria uma página quilométrica — aqui ele vira uma pílula. */
            .smg-fhcard--inline { margin: var(--smg-sp-2) 0; padding: var(--smg-sp-2) var(--smg-sp-4); border-radius: var(--smg-r-10); gap: var(--smg-sp-2); }
            .smg-fhcard--inline .smg-fhcard-main { gap: var(--smg-sp-8); padding: var(--smg-sp-2); }
            .smg-fhcard--inline .smg-fhcard-thumb { width: 24px; height: 24px; border-radius: var(--smg-r-8); }
            .smg-fhcard--inline .smg-fhcard-thumb--letter { font-size: var(--smg-fs-12); }
            .smg-fhcard--inline .smg-fhcard-thumb--logo img.smg-fhcard-logo { width: 15px; height: 15px; }
            .smg-fhcard--inline .smg-fhcard-thumb--multi { gap: var(--smg-sp-2); }
            .smg-fhcard--inline .smg-fhcard-count { left: 2px; bottom: 2px; padding: var(--smg-sp-2) var(--smg-sp-6) var(--smg-sp-2) var(--smg-sp-4); font-size: var(--smg-fs-10); }
            .smg-fhcard--inline .smg-fhcard-count svg { width: 9px; height: 9px; }
            .smg-fhcard--inline .smg-fhcard-more { font-size: var(--smg-fs-10); }
            /* título e host na MESMA linha (o sub vira sufixo discreto): duas linhas por item dobravam a
               altura da lista sem acrescentar nada — o host já aparece no ícone. */
            .smg-fhcard--inline .smg-fhcard-body { flex-direction: row; align-items: baseline; gap: var(--smg-sp-8); }
            .smg-fhcard--inline .smg-fhcard-platform { font-size: var(--smg-fs-10); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--smg-link); flex: 0 0 auto; }
            .smg-fhcard--inline .smg-fhcard-host { font-size: var(--smg-fs-13); font-weight: 600; flex: 0 1 auto; }
            .smg-fhcard--inline .smg-fhcard-sub { font-size: var(--smg-fs-11); flex: 0 0 auto; opacity: 0.75; }
            .smg-fhcard--inline .smg-fhcard-btn { width: 24px; height: 24px; border-radius: var(--smg-btn-r); }
            .smg-fhcard--inline .smg-fhcard-btn svg { width: 13px; height: 13px; }
            /* o marcador do <li> some quando o conteúdo vira bloco → mantém a numeração da lista original */
            .bbWrapper li > .smg-fhcard--inline { display: flex; }

            /* ---- socialmediagirls width fix ---- */
            /* PERF: era .bbWrapper:has(.generic2wide-iframe-div) etc — :has é reavaliado pelo engine a cada mutação
               de subtree, e o processAll muta quase todo frame. markG2wWrappers (JS) marca .smg-has-g2w no
               wrapper-pai 1× por embed → casa classe estática. */
            .smg-has-g2w,
            .bbCodeBlock {
                width: 100% !important;
                max-width: none !important;
            }
`;