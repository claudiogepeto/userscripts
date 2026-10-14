    // ── CSS: alert list cards ──
    const CSS_ALERTS = `
            /* ===== alertas "Limpo" (estilo FB): seções Novas/Anteriores · nome · tags · autor+data · dot ===== */
            /* cor de link do tema do XF (cada fórum tem a sua) — composta dos componentes H/S/L do XF */
            .smg-tb-listbody .smg-alert-clean { --smg-link: hsl(var(--xf-linkColor--h, 330), var(--xf-linkColor--s, 70%), var(--xf-linkColor--l, 60%)); --smg-al-sep: rgba(255,255,255,0.085); }
            .smg-tb-listbody .smg-alert-clean .contentRow-figure { display: none !important; }   /* a foto é do user, não do tópico */
            /* ícone de tipo à esquerda: publicação (cinza, foto) vs comentário (cor do site, balão) */
            .smg-tb-listbody .smg-alert-clean .smg-al-icon {
                flex: 0 0 80px !important; width: 80px !important; min-height: 80px !important; height: auto !important; aspect-ratio: 1 / 1 !important; margin-top: 1px; box-sizing: border-box;
                display: flex; align-items: center; justify-content: center;
                border-radius: 12px !important; border: 1px solid rgba(255,255,255,0.08);
                background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5);
                align-self: stretch !important;
                transition: border-color .15s ease, background .15s ease, color .15s ease;
            }
            .smg-tb-listbody .smg-alert-clean .smg-al-icon svg { width: 24px; height: 24px; }
            .smg-tb-listbody .smg-alert-clean .smg-al-icon--comment { color: var(--smg-link); }
            /* não-lida: o ícone ganha a tinta do tema (o card inteiro fica mais "vivo" que as lidas) */
            .smg-tb-listbody .smg-alert-clean li.alert.is-unread .smg-al-icon {
                background: var(--smg-link-soft); border-color: rgba(255,255,255,0.14); color: var(--smg-link);
            }
            /* FOTO da thread no lugar do glifo (quando o cache de thumbs conhece a thread do alerta):
               mesma caixa, então trocar o glifo pela imagem não desloca uma linha sequer. */
            .smg-tb-listbody .smg-alert-clean .smg-al-icon--thumb { width: 80px !important; min-height: 80px !important; height: auto !important; aspect-ratio: 1 / 1 !important; border-radius: 12px !important; flex: 0 0 80px !important; align-self: stretch !important; padding: 0; overflow: hidden; background: rgba(255,255,255,0.05); }
            .smg-tb-listbody .smg-alert-clean .smg-al-icon--thumb img { width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 12px; }
            .smg-tb-listbody .smg-alert-clean li.alert.is-unread .smg-al-icon--thumb { background: rgba(255,255,255,0.05); }   /* com foto, a tinta do tema só polui */
            .smg-tb-listbody .smg-alert-clean li.alert .contentRow {
                display: flex !important;
                align-items: stretch !important;
                gap: 14px !important;
            }
            /* flex:1 — a coluna de texto ocupa a linha inteira, alinhada com a thumbnail */
            .smg-tb-listbody .smg-alert-clean .contentRow-main {
                flex: 1 1 auto;
                min-width: 0;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                gap: 4px !important;
                position: relative;
                padding-right: 30px;
                min-height: 80px !important;
            }
            /* linha do alerta: SEPARADOR entre todas + não-lida com faixa da cor do tema à esquerda */
            .smg-tb-listbody .smg-alert-clean li.alert {
                position: relative; padding: 13px 14px;
                border-bottom: 1px solid var(--smg-al-sep);
                transition: background .14s ease, opacity .15s ease;
            }
            .smg-tb-listbody .smg-alert-clean li.alert:last-child { border-bottom: 0; }
            .smg-tb-listbody .smg-alert-clean li.alert .fauxBlockLink { position: static !important; }
            .smg-tb-listbody .smg-alert-clean li.alert,
            .smg-tb-listbody .smg-alert-clean li.alert .contentRow { background: transparent !important; box-shadow: none !important; }
            .smg-tb-listbody .smg-alert-clean li.alert:hover { background: rgba(255,255,255,0.055) !important; }
            /* NÃO-LIDA: tinta suave do tema + faixa de 3px na borda esquerda (marcador claro, sem poluir) */
            .smg-tb-listbody .smg-alert-clean li.alert.is-unread { background: var(--smg-link-soft) !important; }
            .smg-tb-listbody .smg-alert-clean li.alert.is-unread::before {
                content: ""; position: absolute; left: 0; top: 7px; bottom: 7px; width: 3px;
                border-radius: 0 3px 3px 0; background: var(--smg-link);
            }
            .smg-tb-listbody .smg-alert-clean li.alert.is-unread:hover { box-shadow: inset 0 0 0 999px rgba(255,255,255,0.05) !important; }
            /* JÁ VISTAS: bem apagadas (o olho vai direto nas novas) — o hover devolve o contraste inteiro */
            .smg-tb-listbody .smg-alert-clean li.smg-al-old { opacity: 0.4; }
            .smg-tb-listbody .smg-alert-clean li.smg-al-old .smg-al-title { font-weight: 600; color: rgba(255,255,255,0.8) !important; }
            .smg-tb-listbody .smg-alert-clean li.smg-al-old .smg-al-icon { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.06); }
            .smg-tb-listbody .smg-alert-clean li.smg-al-old:hover { opacity: 1; }
            /* nome do tópico */
            .smg-tb-listbody .smg-alert-clean .smg-al-title {
                font-weight: 700; color: #fff !important; line-height: 1.35; font-size: 14px; letter-spacing: -0.01em;
                display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden;
                text-decoration: none !important;   /* sublinhado só no hover (no sheet mobile vinha sublinhado sempre) */
            }
            .smg-tb-listbody .smg-alert-clean li.alert:hover .smg-al-title { text-decoration: underline !important; text-underline-offset: 2px; }
            /* tags: chips nativos coloridos (cor da plataforma) — menores */
            .smg-al-tags { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
            .smg-alert-clean .smg-al-tags .smg-al-chip,
            .smg-alert-clean .smg-al-tags .label,
            .smg-alert-clean .smg-al-tags .prefix,
            #smg-aldock .smg-al-tags .smg-al-chip,
            #smg-aldock .smg-al-tags .label,
            .smg-al-tags .smg-al-chip {
                font-size: 9.5px !important;
                font-weight: 600 !important;
                padding: 1px 5px !important;
                border-radius: 4px !important;
                line-height: 1.3 !important;
                letter-spacing: normal !important;
                white-space: nowrap !important;
                display: inline-flex !important;
                align-items: center !important;
            }
            .smg-al-tags .label-append { display: none !important; }
            /* publicado por @autor · data */
            .smg-al-by,
            .smg-alert-clean .smg-al-by {
                display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 11.5px; color: rgba(255,255,255,0.42);
                justify-content: flex-start !important;
                width: 100% !important;
            }
            .smg-al-time {
                margin-left: 0 !important;
                margin-right: auto !important;
                text-align: left !important;
                white-space: nowrap !important;
                color: rgba(255,255,255,0.4) !important;
                font-size: 11px !important;
            }
            /* botão "marcar como lido" — SEMPRE visível nas não-lidas: dot rosa que vira ✓ no hover · clique persiste */
            .smg-al-read {
                position: absolute; right: 6px; top: 11px; z-index: 2;
                width: 28px; height: 28px; padding: 0; border: 0; border-radius: 999px;
                background: transparent; cursor: pointer; -webkit-appearance: none; appearance: none;
                display: inline-flex; align-items: center; justify-content: center; transition: background .15s ease;
            }
            .smg-al-read::before {
                content: ""; width: 11px; height: 11px; border-radius: 50%; background: var(--smg-link);
                line-height: 1; font-size: 0; font-weight: 800; transition: background .12s ease;
            }
            .smg-al-read:hover { background: rgba(255,255,255,0.12); }
            .smg-al-read:hover::before { content: "✓"; width: auto; height: auto; background: transparent; font-size: 17px; color: var(--smg-link); }
            .smg-al-read:active { transform: scale(0.88); }
            .smg-al-read-txt { display: none; }   /* texto só no mobile (sheet) */
            html.smg-smg .smg-al-read::before { width: 8px; height: 8px; }   /* badge um pouco menor no socialmediagirls */
            html.smg-smg .smg-al-read:hover::before { font-size: 15px; }

            /* Estilização de /account/alerts caso renderizada nativamente */
            html[data-template="account_alerts"] .contentRow,
            .block-body.js-alertList .contentRow {
                display: flex !important;
                flex-direction: row !important;
                align-items: center !important;
                gap: 12px !important;
            }
            html[data-template="account_alerts"] .contentRow-figure,
            .block-body.js-alertList .contentRow-figure {
                flex: 0 0 64px !important;
                width: 64px !important;
                height: 64px !important;
            }
            html[data-template="account_alerts"] .contentRow-figure img,
            .block-body.js-alertList .contentRow-figure img {
                width: 64px !important;
                height: 64px !important;
                object-fit: cover !important;
                border-radius: 12px !important;
            }
            html[data-template="account_alerts"] .contentRow-main,
            .block-body.js-alertList .contentRow-main {
                flex: 1 1 auto !important;
                min-width: 0 !important;
            }

            @media (max-width: 992px) {
                /* tablet: some o Discover do canto, search central continua */
                .smg-tb-nav { display: none; }
                html.smg-topbar-on body { padding-top: 52px !important; }
            }`;