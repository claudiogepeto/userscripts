        // ---- search: popover de busca (XenForo /search/search) ----
        const setupSearch = () => {
            harvestPrefixesFromDoc(document);
            const threadId = (location.pathname.match(/threads\/[^/]+\.(\d+)/) || [])[1] || '';
            // node id do fórum pai: último link /forums/slug.ID/ do breadcrumb
            const forumId = (() => {
                let id = '';
                document.querySelectorAll('.p-breadcrumbs a[href*="/forums/"], .breadcrumbs a[href*="/forums/"]').forEach(a => {
                    const m = (a.getAttribute('href') || '').match(/\/forums\/[^/]+\.(\d+)/);
                    if (m) id = m[1];
                });
                return id;
            })();

            const searchInput = searchPop.querySelector('.smg-search-input');
            // input ATIVO: desktop usa o input REAL da topbar (dropdown); mobile usa o input do próprio modal.
            const getSearchInput = () => (window.innerWidth > 600 && document.querySelector('.smg-tb-search-input')) || searchInput;
            const searchResultsEl = searchPop.querySelector('.smg-search-results');
            const searchAdv = searchPop.querySelector('.smg-search-adv');
            const searchHistEl = searchPop.querySelector('.smg-search-history');
            const searchHistList = searchPop.querySelector('.smg-search-hist-list');
            const searchHistClear = searchPop.querySelector('.smg-search-hist-clear');
            const searchHistBadge = searchPop.querySelector('.smg-search-hist-badge');
            const searchEmptyEl = searchPop.querySelector('.smg-search-empty');

            // action + token do quick-search da própria página (robusto a subdiretório)
            const qsForm = document.querySelector('form[data-xf-init="quick-search"]');
            const searchAction = qsForm?.getAttribute('action') || '/search/search';
            if (searchAdv) searchAdv.href = searchAction.replace(/search\/?$/, ''); // /search/search -> /search/

            let applyingEntry = false;   // true durante fillFromEntry → segura o re-search por filtro

            // ===== ESCOPO estilo Reddit: começa no CONTEXTO (tópico/fórum atual); chip com × na barra → "em tudo" =====
            // título da página SEM o que injetamos/o XF cola dentro do h1 (botão de notices, prefixos/labels)
            const pageTitle = (() => {
                const el = document.querySelector('h1.p-title-value, .p-title-value'); if (!el) return '';
                const c = el.cloneNode(true);
                c.querySelectorAll('.smg-notices, .smg-notices-collapse, .label, .labelLink, [class*="label--"], .prefix, [class*="prefix"]').forEach(x => x.remove());
                return (c.textContent || '').replace(/\s+/g, ' ').trim();
            })();
            const ctxLabel = threadId
                ? pageTitle
                : forumId
                    ? (() => { let n = ''; document.querySelectorAll('.p-breadcrumbs a[href*="/forums/"], .breadcrumbs a[href*="/forums/"]').forEach(a => { const t = a.textContent.trim(); if (t) n = t; }); return n || pageTitle; })()
                    : '';
            let currentScope = threadId ? 'thread' : 'everywhere';
            let titlesOn = true, orderDate = false;   // (re)setados pelos comandos a cada busca
            const activeSearchBadges = new Set();
            let toggleTitleOnly = null;
            let sortSelect = null;
            let authorInput = null;
            let scopeSelect = null;
            let badgeMultiselect = null;

            function applyScopeUI() {
                const isThread = currentScope === 'thread';
                const scoped = isThread || (currentScope === 'forum' && !!ctxLabel);   // tópico vale pelo threadId (mesmo sem título); fórum precisa do nome
                document.documentElement.classList.toggle('smg-search-scoped', scoped);
                const chipText = isThread ? i18n('This thread') : ctxLabel;   // TÓPICO: rótulo curto fixo (nomes de tópico podem ser enormes); FÓRUM: nome
                const kind = isThread ? '' : i18n('Forum');                   // tópico não precisa de tag — o rótulo já diz
                Array.prototype.forEach.call(document.querySelectorAll('.smg-tb-search-chip, .smg-search-chip'), ch => {
                    ch.hidden = !scoped;
                    const t = ch.querySelector('.smg-search-chip-t'); if (t) t.textContent = chipText;
                    let k = ch.querySelector('.smg-search-chip-k');
                    if (scoped && kind) { if (!k) { k = document.createElement('span'); k.className = 'smg-search-chip-k'; ch.insertBefore(k, t); } k.textContent = kind; }
                    else if (k) k.remove();
                });
                const ph = isThread ? i18n('Search in this thread') : (scoped ? (i18n('Search in') + ' ' + ctxLabel) : i18n('Search the forum…'));
                if (searchInput) searchInput.placeholder = ph;
                const tb = document.querySelector('.smg-tb-search-input'); if (tb) tb.placeholder = ph;
                const scSel = searchPop.querySelector('.smg-search-scope-select');
                if (scSel && scSel.value !== currentScope) scSel.value = currentScope;
            }
            function unscope() { currentScope = 'everywhere'; applyScopeUI(); researchOnFilter(); try { getSearchInput().focus(); } catch (e) {} }
            // × do chip (delegado → cobre o chip da topbar E o do modal)
            document.addEventListener('pointerdown', e => {
                if (e.target.closest && (e.target.closest('.smg-search-chip-x') || e.target.closest('.smg-search-chip'))) {
                    e.preventDefault();
                }
            });
            document.addEventListener('click', e => {
                if (e.target.closest && (e.target.closest('.smg-search-chip-x') || e.target.closest('.smg-search-chip'))) {
                    e.preventDefault();
                    e.stopPropagation();
                    unscope();
                }
            });
            applyScopeUI();

            // defaults configuráveis (engrenagem da barra) — DECLARADOS AQUI (antes do bloco que os usa no setup); comando explícito sempre vence
            const CFG_TITLES = 'smg-search-def-titles', CFG_ORDER = 'smg-search-def-order', CFG_LIKE = 'smg-search-like';
            let cfgTitles = localStorage.getItem(CFG_TITLES) === '1';                 // só-títulos por padrão (busca global/fórum)
            let cfgOrder = localStorage.getItem(CFG_ORDER) === '1';                   // por data por padrão
            let cfgLike = (localStorage.getItem(CFG_LIKE) ?? '1') === '1';            // wildcard de parte da palavra

            // BUSCA AVANÇADA (na barra): com query → abre os RESULTADOS NATIVOS numa nova aba (POST, igual o inline → garantido),
            // já com o escopo/filtros atuais; a página de resultados tem o painel pra refinar. Sem query → o form de busca avançada.
            const advUrl = searchAction.replace(/search\/?$/, '');   // /search/search → /search/
            Array.prototype.forEach.call(document.querySelectorAll('.smg-search-adv'), a => { a.href = advUrl; a.title = i18n('Advanced'); });   // href base (ctrl/middle-click)
            function openAdvanced() {
                let keywords = getSearchInput().value.trim();
                const by = authorInput ? authorInput.value.trim() : '';
                const activeBadges = Array.from(activeSearchBadges);
                const titles = toggleTitleOnly ? toggleTitleOnly.checked : (currentScope !== 'thread' && cfgTitles);
                const order = sortSelect ? (sortSelect.value === 'date') : cfgOrder;
                if (!keywords && !by && !activeBadges.length && currentScope !== 'watched') { window.open(advUrl, '_blank', 'noopener'); return; }   // sem query → form avançado
                const token = qsForm?.querySelector('input[name="_xfToken"]')?.value || document.querySelector('input[name="_xfToken"]')?.value || '';
                const fields = [['_xfToken', token]];
                let hasPid = false;
                const fallbackBadges = [];
                if (activeBadges.length) {
                    activeBadges.forEach(b => {
                        const k = b.toLowerCase().trim();
                        const pid = globalPrefixMap.get(k) || (typeof serverPrefixMap !== 'undefined' && serverPrefixMap.get(k));
                        if (pid) {
                            fields.push(['c[prefixes][]', pid]);
                            hasPid = true;
                        } else {
                            fallbackBadges.push(b);
                        }
                    });
                }
                if (fallbackBadges.length) {
                    keywords = (keywords ? (keywords + ' ') : '') + fallbackBadges.join(' ');
                }
                if (keywords) {
                    fields.push(['keywords', buildFlexibleKeywords(keywords, titles)]);
                } else if (hasPid) {
                    fields.push(['search_type', 'thread']);
                }
                if (currentScope === 'thread' && threadId) fields.push(['c[thread]', threadId], ['search_type', 'post']);   // search_type=post é OBRIGATÓRIO p/ restringir À thread (senão o XF busca threads no global e ignora c[thread])
                else if (currentScope === 'forum' && forumId) fields.push(['c[nodes][0]', forumId], ['c[child_nodes]', '1']);
                else if (currentScope === 'threads' && !fields.some(f => f[0] === 'search_type')) fields.push(['search_type', 'thread']);
                else if (currentScope === 'watched') fields.push(['c[watched]', '1']);
                if (titles && currentScope !== 'thread') fields.push(['c[title_only]', '1']);
                if (by) fields.push(['c[users]', by]);
                if (order) fields.push(['order', 'date']);
                const f = document.createElement('form'); f.method = 'post'; f.action = searchAction; f.target = '_blank'; f.style.display = 'none';
                fields.forEach(kv => { const i = document.createElement('input'); i.type = 'hidden'; i.name = kv[0]; i.value = kv[1]; f.appendChild(i); });
                document.body.appendChild(f); f.submit(); setTimeout(() => f.remove(), 0);
            }
            document.addEventListener('click', e => { const adv = e.target.closest && e.target.closest('.smg-search-adv'); if (adv) { e.preventDefault(); openAdvanced(); } });

            // CONFIG de defaults da busca (engrenagem na barra) — portalizada no body, igual o tooltip
            const cfgPortal = document.createElement('div'); cfgPortal.className = 'smg-search-cfg-portal';
            const cfgRow = (key, label, on) => '<label class="smg-search-cfg-row"><input type="checkbox" data-cfg="' + key + '"' + (on ? ' checked' : '') + '><span>' + label + '</span></label>';
            cfgPortal.innerHTML = '<div class="smg-search-cfg-head">' + i18n('Search defaults') + '</div>' +
                cfgRow(CFG_TITLES, i18n('Titles only by default'), cfgTitles) +
                cfgRow(CFG_ORDER, i18n('Newest first by default'), cfgOrder) +
                cfgRow(CFG_LIKE, i18n('Match partial words'), cfgLike);
            document.body.appendChild(cfgPortal);
            cfgPortal.addEventListener('change', e => {
                const k = e.target.getAttribute && e.target.getAttribute('data-cfg'); if (!k) return;
                const on = !!e.target.checked; localStorage.setItem(k, on ? '1' : '0');
                if (k === CFG_TITLES) cfgTitles = on; else if (k === CFG_ORDER) cfgOrder = on; else if (k === CFG_LIKE) cfgLike = on;
                researchOnFilter();   // re-busca com o novo default (se já tem query)
            });
            function closeCfg() { cfgPortal.classList.remove('open'); document.querySelectorAll('.smg-search-cfg').forEach(b => b.classList.remove('open')); }
            document.addEventListener('click', e => {
                const g = e.target.closest && e.target.closest('.smg-search-cfg');
                if (g) {
                    e.preventDefault(); e.stopPropagation();
                    const willOpen = !cfgPortal.classList.contains('open');
                    closeCfg();
                    if (willOpen) {
                        const r = g.getBoundingClientRect();
                        cfgPortal.classList.add('open');
                        g.classList.add('open');
                        const w = cfgPortal.offsetWidth || 240;
                        let left = r.right - w;
                        if (left < 8) left = 8;
                        if (left + w > window.innerWidth - 8) left = window.innerWidth - 8 - w;
                        cfgPortal.style.left = Math.round(left) + 'px';
                        let top = r.bottom + 6;
                        const h = cfgPortal.offsetHeight || 160;
                        if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
                        cfgPortal.style.top = Math.round(top) + 'px';
                    }
                    return;
                }
                if (!e.target.closest('.smg-search-cfg-portal')) closeCfg();
            });

            // TECLADO: Backspace no início do input remove o chip de contexto ("Neste tópico") → vira "em tudo"
            document.addEventListener('keydown', e => {
                if (e.key !== 'Backspace') return;
                const inp = e.target; if (!inp.matches || !inp.matches('.smg-tb-search-input, .smg-search-input')) return;
                if (currentScope !== 'everywhere' && (inp.value === '' || ((inp.selectionStart || 0) === 0 && (inp.selectionEnd || 0) === 0))) {
                    e.preventDefault();
                    unscope();
                }
            });

            // MENU DE COMANDOS (Tab): paleta pra escolher !a/!tag/!w/!sn/!st/!t/!i com teclado ou clique — descobrível sem decorar
            const CMD_ITEMS = [
                { code: '!t', ins: '!t ', label: i18n('titles only') },
                { code: '!i', ins: '!i ', label: i18n('search post text') },
                { code: '!a', ins: '!a ', label: i18n('author') },
                { code: '!tag', ins: '!tag ', label: i18n('tags / prefix') },
                { code: '!w', ins: '!w ', label: i18n('watched threads') },
                { code: '!sn', ins: '!sn ', label: i18n('by date') },
                { code: '!st', ins: '!st ', label: i18n('Relevance') },
            ];
            const cmdMenu = document.createElement('div'); cmdMenu.className = 'smg-search-cmd';
            cmdMenu.innerHTML = '<div class="smg-search-cmd-head">' + i18n('Search commands') + '</div>' +
                CMD_ITEMS.map((c, i) => '<button type="button" class="smg-search-cmd-item" data-i="' + i + '"><code>' + c.code + '</code><span>' + c.label + '</span></button>').join('');
            document.body.appendChild(cmdMenu);
            let cmdSel = -1;
            let cmdBtnEl = null;   // botão ⇥ que abriu (ganha .open e serve de âncora)
            // âncora = o PRÓPRIO botão ⇥ da barra visível (antes abria colado na esquerda da barra inteira)
            function cmdAnchorFor(el) {
                const bar = (el && el.closest && el.closest('.smg-tb-search, .smg-search-bar'))
                    || (window.innerWidth > 600 && document.querySelector('.smg-tb-search'))
                    || searchPop.querySelector('.smg-search-bar');
                if (!bar) return null;
                return bar.querySelector('.smg-search-cmdbtn') || bar;
            }
            function cmdOpen(anchor) {
                const a = (anchor && anchor.classList && anchor.classList.contains('smg-search-cmdbtn')) ? anchor : cmdAnchorFor(anchor);
                if (!a) return;
                cmdMenu.classList.add('open');                       // mede já visível (offsetWidth/Height)
                cmdBtnEl = a.classList.contains('smg-search-cmdbtn') ? a : null;
                if (cmdBtnEl) cmdBtnEl.classList.add('open');
                const r = a.getBoundingClientRect();
                const w = cmdMenu.offsetWidth, h = cmdMenu.offsetHeight;
                let left = r.right - w;                              // alinhado pela DIREITA do botão…
                left = Math.min(Math.max(8, left), Math.max(8, window.innerWidth - w - 8));   // …e preso na viewport
                let top = r.bottom + 6;
                if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);       // sem espaço abaixo → abre acima
                cmdMenu.style.left = left + 'px';
                cmdMenu.style.top = top + 'px';
                cmdSetSel(0);
            }
            function cmdClose() {
                cmdMenu.classList.remove('open'); cmdSel = -1;
                if (cmdBtnEl) { cmdBtnEl.classList.remove('open'); cmdBtnEl = null; }
            }
            function cmdSetSel(i) {
                const items = cmdMenu.querySelectorAll('.smg-search-cmd-item'); if (!items.length) return;
                cmdSel = (i + items.length) % items.length;
                items.forEach((el, j) => el.classList.toggle('sel', j === cmdSel));
            }
            function cmdInsert(i) {
                const c = CMD_ITEMS[i]; if (!c) return;
                const inp = getSearchInput(); const v = inp.value.replace(/\s+$/, '');
                inp.value = (v ? v + ' ' : '') + c.ins;
                cmdClose(); inp.focus();
                try { const L = inp.value.length; inp.setSelectionRange(L, L); } catch (e) {}
                inp.dispatchEvent(new Event('input', { bubbles: true }));   // re-avalia (flags re-buscam; !a espera o nome)
            }
            cmdMenu.addEventListener('mousedown', e => { const it = e.target.closest && e.target.closest('.smg-search-cmd-item'); if (it) { e.preventDefault(); cmdInsert(+it.dataset.i); } });
            // CAPTURE: roda ANTES dos handlers de Enter→buscar; com o menu aberto, intercepta a navegação/seleção
            document.addEventListener('keydown', e => {
                if (!e.target.matches || !e.target.matches('.smg-tb-search-input, .smg-search-input')) return;
                const open = cmdMenu.classList.contains('open');
                if (e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); if (!open) cmdOpen(e.target); else cmdSetSel(cmdSel + (e.shiftKey ? -1 : 1)); return; }
                if (!open) return;
                if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); cmdSetSel(cmdSel + 1); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); cmdSetSel(cmdSel - 1); }
                else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); cmdInsert(cmdSel); }
                else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cmdClose(); }
                else cmdClose();   // qualquer outra tecla → fecha e segue digitando
            }, true);
            // fora = fecha. O PRÓPRIO ⇥ fica de fora: senão o mousedown fechava e o click reabria (o toggle nunca desligava).
            document.addEventListener('mousedown', e => { if (cmdMenu.classList.contains('open') && !(e.target.closest && (e.target.closest('.smg-search-cmd') || e.target.closest('.smg-search-cmdbtn') || e.target.closest('.smg-tb-search-input, .smg-search-input')))) cmdClose(); });
            window.addEventListener('resize', () => { if (cmdMenu.classList.contains('open')) cmdClose(); });   // âncora se move → fecha (em vez de flutuar solto)
            // botão ⇥ (indica que o Tab existe + abre a paleta no clique → também serve no mobile, que não tem Tab)
            document.addEventListener('click', e => {
                const b = e.target.closest && e.target.closest('.smg-search-cmdbtn'); if (!b) return;
                e.preventDefault(); e.stopPropagation();
                if (cmdMenu.classList.contains('open')) cmdClose(); else { cmdOpen(b); try { getSearchInput().focus(); } catch (x) {} }
            });

            // %LIKE%: a busca (MySQL fulltext) não acha por parte da palavra → wildcard de PREFIXO (termo* = LIKE 'termo%').
            // Infix real (%termo%) o fulltext não suporta; respeita aspas/operadores (+ - " *) do usuário. Liga/desliga na config.
            function likeify(q) {
                if (!cfgLike || !q || /[*"+\-]/.test(q)) return q;
                return q.split(/\s+/).map(w => (w.length >= 3 && /^[\wÀ-ſ]+$/.test(w)) ? w + '*' : w).join(' ');
            }

            // EXTRAÇÃO DE IDENTIFICADORES SOCIAIS:
            // Converte URLs de perfis (Instagram, Twitter/X, TikTok, OnlyFans, Fansly, Patreon, Telegram, Reddit, YouTube)
            // ou formatos @handle diretamente no handle limpo, facilitando buscas copiadas/coladas da web.
            function extractSocialHandle(str) {
                if (!str) return '';
                let s = str.trim();
                const m = s.match(/(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|threads\.net|twitter\.com|x\.com|tiktok\.com|onlyfans\.com|fansly\.com|patreon\.com|t\.me|telegram\.me|youtube\.com\/(?:@)?|reddit\.com\/(?:user|u))\/(?:@)?([a-zA-Z0-9_.-]+)/i);
                if (m && m[1]) {
                    s = m[1];
                } else if (/^@([a-zA-Z0-9_.-]+)$/.test(s)) {
                    s = s.slice(1);
                }
                return s.replace(/[/?#].*$/, '').replace(/[/]$/, '').trim();
            }
            if (typeof window !== 'undefined') window.extractSocialHandle = extractSocialHandle;

            // NORMALIZAÇÃO DE DIACRÍTICOS / ACENTOS (Unicode Unaccent):
            function removeAccents(str) {
                if (!str) return '';
                return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            }
            if (typeof window !== 'undefined') window.removeAccents = removeAccents;

            // GERAÇÃO FLEXÍVEL DE PALAVRAS-CHAVE:
            // Permite dar match tanto com espaços ("jade the jaguar") quanto sem espaços ("jadethejaguar"),
            // delimitadores ("jade_the_jaguar") ou CamelCase ("JadeTheJaguar"), unindo as variantes pelo
            // operador nativo OR do XenForo. Não abre a busca para palavras genéricas isoladas.
            // Suporta também extração de handles de redes sociais e normalização de acentos.
            function buildFlexibleKeywords(q, isTitlesOnly) {
                if (!q) return '';
                const cleanSocial = extractSocialHandle(q);
                const raw = cleanSocial.trim();
                // Se contiver aspas explícitas, operadores manuais (+, -, ~) ou operador booleano OR existente:
                // preserva a intenção literal do usuário sem inventar variantes.
                if (/[*"+~\-]|\bOR\b/.test(raw)) {
                    return likeify(raw);
                }

                const variants = new Set();
                const addVariantGroup = text => {
                    if (!text) return;
                    variants.add(likeify(text));

                    // 1. Termo com espaços → gera versão unificada sem espaços
                    if (/\s+/.test(text)) {
                        const unspaced = text.replace(/[\s\-_.]+/g, '');
                        if (unspaced.length >= 3) {
                            variants.add(likeify(unspaced));
                        }
                    }

                    // 2. Termo com delimitadores (_, -, .) → gera versão espaçada e sem separadores
                    if (/[\-_.]/.test(text)) {
                        const spaced = text.replace(/[\-_.]+/g, ' ').replace(/\s+/g, ' ').trim();
                        if (spaced && spaced !== text) {
                            variants.add(likeify(spaced));
                        }
                        const unspaced = text.replace(/[\s\-_.]+/g, '');
                        if (unspaced.length >= 3) {
                            variants.add(likeify(unspaced));
                        }
                    }

                    // 3. Termo em CamelCase → gera versão decomposta com espaços
                    if (/[a-z][A-Z]/.test(text)) {
                        const deCamel = text.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
                        if (deCamel && deCamel !== text) {
                            variants.add(likeify(deCamel));
                        }
                    }
                };

                addVariantGroup(raw);

                // Normalização de acentos: gera também variantes sem acento
                const unaccented = removeAccents(raw);
                if (unaccented && unaccented !== raw) {
                    addVariantGroup(unaccented);
                }

                return Array.from(variants).filter(Boolean).join(' OR ');
            }
            if (typeof window !== 'undefined') window.buildFlexibleKeywords = buildFlexibleKeywords;

            // ---- histórico (últimos 1000, COMPARTILHADO entre os fóruns via GM storage) ----
            const SEARCH_HISTORY_KEY = 'smg-search-history';
            const HIST_CHUNK = 20;   // linhas por lote: render incremental no scroll (nunca monta as 1000 de uma vez)
            const HIST_MAX = 1000;
            const SCOPE_LABEL = { everywhere: 'Everywhere', threads: 'Threads', forum: 'This forum', thread: 'This thread' };
            let histShown = 0;       // linhas já renderizadas na lista (índice do próximo lote)

            // gmGet/gmSet usam GM_*Value (mesmo storage do script em todos os domínios), com fallback localStorage
            // PERF: parse 1× por sessão (cache) — o JSON.parse de até 1000 entradas (~100KB) rodava a CADA
            // keystroke <3 chars (clearResults→renderHistory). Outra aba gravar não invalida o cache: staleness
            // aceitável (resolve no F5); esta aba sempre escreve via saveHistory, que atualiza o cache.
            let histCache = null;
            const loadHistory = () => { if (histCache) return histCache; try { histCache = JSON.parse(gmGet(SEARCH_HISTORY_KEY, '[]')) || []; } catch { histCache = []; } return histCache; };
            const saveHistory = arr => { histCache = arr; gmSet(SEARCH_HISTORY_KEY, JSON.stringify(arr)); };

            const histKey = e => (e.q || '') + '|' + (e.by || '') + '|' + (e.scope || '') + '|' + (e.titles ? 1 : 0) + '|' + (e.order || '');

            function addHistory(entry) {
                if (!entry.q && !entry.by) return;
                const k = histKey(entry);
                const arr = loadHistory().filter(e => histKey(e) !== k); // dedupe: move pro topo
                arr.unshift(entry);
                saveHistory(arr.slice(0, HIST_MAX));
            }

            function removeHistory(entry) {   // só persiste — a linha sai do DOM no handler do × (sem re-render → scroll preservado)
                const k = histKey(entry);
                saveHistory(loadHistory().filter(e => histKey(e) !== k));
            }

            // reconstrói o TEXTO da barra (keywords limpas) a partir de uma entrada do histórico
            function entryToBar(e) {
                return (e.q || '').trim();
            }
            function fillFromEntry(e) {
                applyingEntry = true;
                getSearchInput().value = entryToBar(e);
                if (authorInput) {
                    authorInput.value = e.by || '';
                }
                if (toggleTitleOnly) {
                    toggleTitleOnly.checked = !!e.titles;
                }
                if (sortSelect) {
                    sortSelect.value = (e.order === 'date') ? 'date' : 'relevance';
                }
                currentScope = ((e.scope === 'thread' && threadId) || (e.scope === 'forum' && forumId)) ? e.scope : 'everywhere';   // só reusa o escopo se existe NESTA página
                applyScopeUI();
                updateSearchClearButtons();
                applyingEntry = false;
            }
            function applyHistoryEntry(e) { fillFromEntry(e); doSearch(true); }            // clique na linha: busca direto (grava)
            function sendToBar(e) { fillFromEntry(e); getSearchInput().focus(); }       // ↖ manda pra barra SEM buscar (ajusta filtros e busca depois)
            function openOnOther(e) {                                                   // ↗ abre a MESMA busca no OUTRO fórum (simpcity ↔ smg)
                const other = /socialmediagirls/i.test(location.hostname) ? 'https://simpcity.cr/' : 'https://forums.socialmediagirls.com/';
                const payload = { q: e.q || '', by: e.by || '', titles: !!e.titles, threads: e.scope === 'threads', order: e.order || '' };
                window.open(other + '#smg-xsearch=' + encodeURIComponent(JSON.stringify(payload)), '_blank', 'noopener');
            }

            function buildHistRow(e) {
                const row = document.createElement('button');
                row.type = 'button';
                row.className = 'smg-search-hist-item';
                const tags = [];
                if (e.scope && e.scope !== 'everywhere') tags.push(i18n(SCOPE_LABEL[e.scope] || e.scope));
                if (e.q && e.by) tags.push(i18n('author') + ': ' + e.by);
                if (e.titles) tags.push(i18n('titles only'));
                if (e.order === 'date') tags.push(i18n('by date'));
                const otherLabel = /socialmediagirls/i.test(location.hostname) ? 'SimpCity' : 'SocialMediaGirls';
                row.innerHTML =
                    '<span class="smg-search-hist-ico">' + ICONS.search + '</span>' +
                    '<span class="smg-search-hist-q"></span>' +
                    (tags.length ? '<span class="smg-search-hist-meta"></span>' : '') +
                    '<span class="smg-search-hist-acts">' +
                        '<span class="smg-search-hist-act smg-search-hist-edit" role="button" aria-label="' + i18n('Edit in search bar') + '" title="' + i18n('Edit in search bar') + '">' + svgIcon('<line x1="17" y1="17" x2="7" y2="7"/><polyline points="7 17 7 7 17 7"/>') + '</span>' +
                        '<span class="smg-search-hist-act smg-search-hist-cross" role="button" aria-label="' + i18n('Search on') + ' ' + otherLabel + '" title="' + i18n('Search on') + ' ' + otherLabel + '">' + svgIcon('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>') + '</span>' +
                        '<span class="smg-search-hist-act smg-search-hist-remove" role="button" aria-label="' + i18n('Remove') + '">' + ICONS.close + '</span>' +
                    '</span>';
                row.querySelector('.smg-search-hist-q').textContent = e.q || (i18n('author') + ': ' + e.by);
                if (tags.length) row.querySelector('.smg-search-hist-meta').textContent = tags.join(' · ');
                row.addEventListener('click', () => applyHistoryEntry(e));
                row.querySelector('.smg-search-hist-edit').addEventListener('click', ev => { ev.stopPropagation(); sendToBar(e); });
                row.querySelector('.smg-search-hist-cross').addEventListener('click', ev => { ev.stopPropagation(); openOnOther(e); });
                row.querySelector('.smg-search-hist-remove').addEventListener('click', ev => {
                    ev.stopPropagation();
                    removeHistory(e);                       // persiste
                    row.remove();                           // tira SÓ a linha (sem re-render → o scroll fica onde está)
                    histShown = Math.max(0, histShown - 1);
                    const all = loadHistory();
                    searchHistBadge.textContent = all.length;
                    if (!all.length) { renderHistory(); return; }   // zerou → estado vazio
                    // lista ficou curta demais pra rolar → repõe a linha removida
                    if (histShown < all.length && searchHistList.scrollHeight - searchHistList.scrollTop - searchHistList.clientHeight < 220) appendHistChunk(all, 1);
                });
                return row;
            }
            // anexa as próximas n linhas a partir de histShown (render incremental — as ~1000 nunca montam de uma vez)
            function appendHistChunk(all, n) {
                const end = Math.min(all.length, histShown + n);
                for (let i = histShown; i < end; i++) { const row = buildHistRow(all[i]); searchHistList.appendChild(row); i18nDom(row); }
                histShown = end;
            }
            function renderHistory() {
                const all = loadHistory();
                if (!all.length) { searchHistEl.hidden = true; searchEmptyEl.hidden = false; return; }   // sem histórico → estado vazio (não um toco só com a toolbar)
                searchEmptyEl.hidden = true;
                searchHistEl.hidden = false;
                searchHistBadge.textContent = all.length;
                // lista SEMPRE scrollável: mostra ~6 linhas e rola pro resto, carregando em lotes (sem "Show all")
                searchHistList.classList.add('smg-search-hist-list--scroll');
                searchHistList.scrollTop = 0;
                searchHistList.innerHTML = '';
                histShown = 0;
                appendHistChunk(all, HIST_CHUNK);
            }
            // perto do fundo → próximo lote (rAF-throttled, passive — padrão onScrollRaf, mas no scroll DA LISTA)
            let histScrollTick = false;
            searchHistList.addEventListener('scroll', () => {
                if (histScrollTick) return;
                histScrollTick = true;
                requestAnimationFrame(() => {
                    histScrollTick = false;
                    if (searchHistList.scrollHeight - searchHistList.scrollTop - searchHistList.clientHeight >= 220) return;
                    const all = loadHistory();
                    if (histShown < all.length) appendHistChunk(all, HIST_CHUNK);
                });
            }, { passive: true });

            searchHistClear.addEventListener('click', () => {
                if (!confirm(i18n('Clear all recent searches?'))) return;   // confirma antes de apagar
                saveHistory([]); renderHistory();
            });

            // mobile: mantém o sheet ACIMA do teclado e sem passar do topo da tela (visualViewport)
            const vv = window.visualViewport;
            function syncSearchKeyboard() {
                if (!vv || !searchOverlay.classList.contains('open')) return;
                if (window.innerWidth > 600) {
                    searchPop.style.bottom = ''; searchPop.style.maxHeight = '';
                    searchPop.style.removeProperty('--smg-kb-top');
                    searchPop.style.removeProperty('--smg-kb-h');
                    searchPop.classList.remove('is-kb');
                    return;
                }
                const top = Math.max(0, Math.round(vv.offsetTop));
                const h = Math.max(120, Math.round(vv.height));
                const kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
                searchPop.style.setProperty('--smg-kb-top', top + 'px');
                searchPop.style.setProperty('--smg-kb-h', h + 'px');
                searchPop.classList.toggle('is-kb', kb > 40);
            }
            if (vv) { vv.addEventListener('resize', syncSearchKeyboard); vv.addEventListener('scroll', syncSearchKeyboard); }

            // DROPDOWN (desktop): ancora o pop abaixo do input REAL da topbar. MODAL (mobile/sem topbar): centralizado, como antes.
            const isDrop = () => window.innerWidth > 600 && !!document.querySelector('.smg-tb-search-input');
            function positionDrop() {
                const bar = document.querySelector('.smg-tb-search'); if (!bar) return;
                const r = bar.getBoundingClientRect();
                const w = Math.min(Math.max(r.width, 460), window.innerWidth - 16);
                let left = r.left; if (left + w > window.innerWidth - 8) left = window.innerWidth - 8 - w; if (left < 8) left = 8;
                // writes guardados: o followDrop roda por frame — só escreve quando a âncora moveu de fato
                const t = (r.bottom + 8) + 'px', l = left + 'px', ww = w + 'px';
                if (searchPop.style.top !== t) searchPop.style.top = t;
                if (searchPop.style.left !== l) searchPop.style.left = l;
                if (searchPop.style.width !== ww) searchPop.style.width = ww;
            }
            // A topbar pode encolher durante uma transição e mudar de posição ao rolar. Observa apenas
            // esses eventos: um rAF contínuo mantinha a aba fazendo layout mesmo quando nada se movia.
            let dropPositionRaf = 0;
            let dropResizeObserver = null;
            let dropPositionBound = false;
            function scheduleDropPosition() {
                if (dropPositionRaf) return;
                dropPositionRaf = requestAnimationFrame(() => {
                    dropPositionRaf = 0;
                    if (searchOverlay.classList.contains('open') && searchPop.classList.contains('smg-search-pop--drop')) positionDrop();
                });
            }
            function bindDropPositioning() {
                if (dropPositionBound) return;
                dropPositionBound = true;
                const bar = document.querySelector('.smg-tb-search');
                if (typeof ResizeObserver !== 'undefined' && bar) {
                    dropResizeObserver = new ResizeObserver(scheduleDropPosition);
                    dropResizeObserver.observe(bar);
                }
                window.addEventListener('resize', scheduleDropPosition, { passive: true });
                window.addEventListener('scroll', scheduleDropPosition, { passive: true });
                if (bar) bar.addEventListener('transitionend', scheduleDropPosition);
            }
            function unbindDropPositioning() {
                dropPositionBound = false;
                if (dropResizeObserver) { dropResizeObserver.disconnect(); dropResizeObserver = null; }
                window.removeEventListener('resize', scheduleDropPosition);
                window.removeEventListener('scroll', scheduleDropPosition);
                if (dropPositionRaf) { cancelAnimationFrame(dropPositionRaf); dropPositionRaf = 0; }
                const bar = document.querySelector('.smg-tb-search');
                if (bar) bar.removeEventListener('transitionend', scheduleDropPosition);
            }
            let searchLocked = false;   // o modal trava o fundo; o dropdown do desktop não (pareado no closeSearch)
            function openSearch() {
                refreshPrefixHarvest(() => {
                    if (badgeMultiselect && typeof badgeMultiselect.updateBadges === 'function') {
                        badgeMultiselect.updateBadges(getAllSearchBadges());
                    }
                });
                closePopovers();
                clearResults();   // some com os resultados da busca anterior + re-renderiza o histórico
                searchHistList.scrollTop = 0;   // sempre abre no topo da lista
                applyScopeUI();   // reflete o chip de contexto + placeholder ao abrir
                const drop = isDrop();
                searchOverlay.classList.toggle('smg-search-overlay--drop', drop);
                searchPop.classList.toggle('smg-search-pop--drop', drop);
                if (!drop) { unbindDropPositioning(); searchPop.style.top = ''; searchPop.style.left = ''; searchPop.style.width = ''; }
                searchOverlay.classList.add('open');
                if (drop) { bindDropPositioning(); positionDrop(); }
                // modal (mobile): o mesmo dos bottom sheets — trava o fundo (senão a página rola atrás
                // enquanto você digita) e o "voltar" do celular fecha a busca em vez de sair da página.
                // No dropdown do desktop, nada disso.
                if (!drop && !searchLocked) { searchLocked = true; smgModalOpen(searchPop, () => closeSearch(true)); }
                document.documentElement.classList.add('smg-search-open');   // mostra o botão Buscar dentro do input da topbar (CSS)
                updateSearchClearButtons();
                // foco síncrono mantém o gesto p/ abrir o teclado no mobile (no desktop o input já é o da topbar, foco é no-op)
                getSearchInput().focus({ preventScroll: true });
                if (!drop) { syncSearchKeyboard(); setTimeout(syncSearchKeyboard, 260); }   // mobile: ajusta acima do teclado
            }

            function closeSearch(fromPop) {   // fromPop === true: o "voltar" já consumiu o estado do modal
                closeCfg();
                unbindDropPositioning();
                removeSearchSentinel();
                searchOverlay.classList.remove('open');
                if (searchLocked) { searchLocked = false; smgModalClose(searchPop, fromPop === true); }
                document.documentElement.classList.remove('smg-search-open');
                searchPop.style.bottom = ''; searchPop.style.maxHeight = '';   // limpa pra animação de saída
                searchPop.style.removeProperty('--smg-kb-top'); searchPop.style.removeProperty('--smg-kb-h');
                searchPop.classList.remove('is-kb');
                searchPop.style.top = ''; searchPop.style.left = ''; searchPop.style.width = '';   // limpa o posicionamento do dropdown
            }

            function doSearch(addToHistory) {
                let keywords = getSearchInput().value.trim();
                const titlesOn = toggleTitleOnly?.checked ?? cfgTitles;
                const orderDate = (sortSelect?.value === 'date') || cfgOrder;
                const by = authorInput?.value.trim();
                const activeBadges = Array.from(activeSearchBadges);

                if (!keywords && !by && !activeBadges.length && currentScope !== 'watched') return;

                if (addToHistory) addHistory({ q: keywords || activeBadges.join(' '), by, scope: currentScope, titles: titlesOn, order: orderDate ? 'date' : '', t: Date.now() });

                const token = qsForm?.querySelector('input[name="_xfToken"]')?.value
                    || document.querySelector('input[name="_xfToken"]')?.value || '';

                const fields = [['_xfToken', token]];
                let hasPid = false;
                const fallbackBadges = [];
                if (activeBadges.length) {
                    activeBadges.forEach(b => {
                        const k = b.toLowerCase().trim();
                        const pid = globalPrefixMap.get(k) || (typeof serverPrefixMap !== 'undefined' && serverPrefixMap.get(k));
                        if (pid) {
                            fields.push(['c[prefixes][]', pid]);
                            hasPid = true;
                        } else {
                            fallbackBadges.push(b);
                        }
                    });
                }
                if (fallbackBadges.length) {
                    keywords = (keywords ? (keywords + ' ') : '') + fallbackBadges.join(' ');
                }
                if (keywords) {
                    fields.push(['keywords', buildFlexibleKeywords(keywords, titlesOn)]);
                } else if (hasPid) {
                    fields.push(['search_type', 'thread']);
                }
                if (currentScope === 'watched') {
                    fields.push(['c[watched]', '1']);
                }
                // ESCOPO: dentro do tópico busca POSTS (c[thread]); no fórum, posts dos nós (com filhos). title_only só faz sentido fora do tópico.
                if (currentScope === 'thread' && threadId) fields.push(['c[thread]', threadId], ['search_type', 'post']);   // search_type=post é OBRIGATÓRIO p/ restringir À thread (senão o XF busca threads no global e ignora c[thread])
                else if (currentScope === 'forum' && forumId) fields.push(['c[nodes][0]', forumId], ['c[child_nodes]', '1']);
                else if (currentScope === 'threads' && !fields.some(f => f[0] === 'search_type')) fields.push(['search_type', 'thread']);
                if (titlesOn && currentScope !== 'thread') fields.push(['c[title_only]', '1']);
                if (orderDate) fields.push(['order', 'date']);   // omitido = relevance (default do XF)
                if (by) fields.push(['c[users]', by]);

                runSearchInline(fields);
            }
            // === busca INLINE: faz o fetch dos resultados e mostra NO PRÓPRIO dropdown (em vez de navegar) ===
            let searchSeq = 0, searchAbort = null;
            let searchSentinelEl = null;
            function removeSearchSentinel() {
                if (searchSentinelEl && searchSentinelEl.parentNode) searchSentinelEl.remove();
                searchSentinelEl = null;
            }
            // "carregar mais" no motor comum (createPager, 07): a lista de resultados rola (no celular, o popover),
            // a próxima página entra antes da sentinela, falha encerra (sem retry a cada scroll). Cada lista nova
            // (paintResults/clearResults/nova busca) faz reset: a página de uma busca anterior que chega depois é
            // descartada e a request dela abortada. Rolar a busca não é rolar a página: o master switch não vale aqui.
            const searchPager = createPager({
                root: [searchResultsEl, searchPop],
                near: 350,
                load: (url, signal) => fetchDoc(url, { credentials: 'same-origin', signal }),
                apply: (doc, urlFetched) => {
                    const moreResults = parseSearchResults(doc);
                    let moreFiltered = moreResults;
                    if (activeSearchBadges && activeSearchBadges.size > 0) {
                        const activeLower = Array.from(activeSearchBadges).map(b => b.toLowerCase().trim());
                        moreFiltered = moreResults.filter(r => {
                            const labelTexts = (r.labels || []).map(l => (l.textContent || '').toLowerCase().replace(/^[#\s\[\]]+|[#\s\[\]]+$/g, '').trim());
                            const hasLabel = activeLower.some(ab => labelTexts.some(lt => lt === ab || lt.includes(ab) || ab.includes(lt)));
                            if (hasLabel) return true;
                            const tLower = (r.title || '').toLowerCase();
                            return activeLower.some(ab => tLower.includes(ab));
                        });
                    }
                    const curTerms = hlTerms();
                    const targetList = searchResultsEl.querySelector('.smg-search-results-list') || searchResultsEl;
                    moreFiltered.forEach(r => {
                        const card = renderSearchCard(r, curTerms);
                        if (searchSentinelEl && searchSentinelEl.parentNode === targetList) targetList.insertBefore(card, searchSentinelEl);
                        else targetList.appendChild(card);
                    });
                    const nextEl = doc.querySelector('.pageNav-jump--next, .pageNavSimple-el--next, a[rel="next"]');
                    let nextUrl = nextEl ? nextEl.getAttribute('href') : null;
                    if (nextUrl) {
                        try { nextUrl = new URL(nextUrl, urlFetched).href; } catch (e) {}
                    }
                    return { next: nextUrl, added: moreFiltered.length };
                },
                enabled: () => !!searchSentinelEl && searchSentinelEl.isConnected,
                onFail: () => 'stop',
                onState: kind => {
                    if (searchSentinelEl) searchSentinelEl.classList.toggle('is-loading', kind === 'loading');
                    if (kind === 'end') removeSearchSentinel();
                },
            });

            function renderSearchCard(r, terms) {
                const a = document.createElement('a');
                a.className = 'smg-search-result'; a.href = r.href;
                if (r.photo) {
                    const f = document.createElement('span'); f.className = 'smg-search-result-fig';
                    const img = document.createElement('img'); img.loading = 'lazy'; img.referrerPolicy = 'no-referrer'; img.alt = '';
                    img.src = r.photo;
                    img.addEventListener('error', () => f.remove(), { once: true });
                    f.appendChild(img); a.appendChild(f);
                }
                const main = document.createElement('span'); main.className = 'smg-search-result-main';
                const tr = document.createElement('span'); tr.className = 'smg-search-result-titlerow';
                (r.labels || []).forEach(l => tr.appendChild(l.cloneNode(true)));
                const t = document.createElement('span'); t.className = 'smg-search-result-title'; setHL(t, r.title, terms); tr.appendChild(t);
                main.appendChild(tr);
                if (r.snippet) { const s = document.createElement('span'); s.className = 'smg-search-result-snippet'; setHL(s, r.snippet, terms); main.appendChild(s); }
                if (r.meta) { const m = document.createElement('span'); m.className = 'smg-search-result-meta'; m.textContent = r.meta; main.appendChild(m); }
                a.appendChild(main);
                a.addEventListener('click', () => { commitCurrentSearch(); closeSearch(); });
                return a;
            }

            function loadMoreSearchResults() {
                return searchPager.more();
            }

            function runSearchInline(fields) {
                refreshPrefixHarvest();
                const seq = ++searchSeq;
                searchPager.reset(null);   // a página que ainda carregava é da busca anterior: descarta e aborta
                if (searchAbort) searchAbort.abort();   // mata o POST anterior (full-text é caro no servidor; o seq só descartava a RESPOSTA — a request continuava rodando)
                const ctrl = searchAbort = (typeof AbortController === 'function') ? new AbortController() : null;
                searchHistEl.hidden = true;   // esconde o histórico enquanto mostra resultados
                searchEmptyEl.hidden = true;
                searchResultsEl.hidden = false;
                searchResultsEl.innerHTML = '<div class="smg-search-rloading"><span class="smg-loading"></span></div>';
                const body = fields.map(f => encodeURIComponent(f[0]) + '=' + encodeURIComponent(f[1])).join('&');
                fetch(searchAction, { method: 'POST', body: body, credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: ctrl ? ctrl.signal : undefined })
                    .then(r => r.text().then(html => ({ html: html, url: r.url })))
                    .then(o => {
                        if (seq === searchSeq) {
                            const doc = new DOMParser().parseFromString(o.html, 'text/html');
                            const results = parseSearchResults(doc);
                            const nextEl = doc.querySelector('.pageNav-jump--next, .pageNavSimple-el--next, a[rel="next"]');
                            let nextUrl = nextEl ? nextEl.getAttribute('href') : null;
                            if (nextUrl) {
                                try { nextUrl = new URL(nextUrl, o.url || location.href).href; } catch (e) {}
                            }
                            // Fallback resiliente: se a busca com OR retornar 0 resultados, tenta imediatamente
                            // a variante sem espaços para casos de instâncias MySQL que bloqueiem união booleana
                            if (!results.length && fields.some(f => f[0] === 'keywords' && f[1].includes(' OR '))) {
                                const kwField = fields.find(f => f[0] === 'keywords');
                                const parts = kwField[1].split(' OR ');
                                if (parts.length > 1) {
                                    const fallbackFields = fields.map(f => f[0] === 'keywords' ? [f[0], parts[1]] : f);
                                    const fallbackBody = fallbackFields.map(f => encodeURIComponent(f[0]) + '=' + encodeURIComponent(f[1])).join('&');
                                    fetch(searchAction, { method: 'POST', body: fallbackBody, credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: ctrl ? ctrl.signal : undefined })
                                        .then(r2 => r2.text().then(h2 => ({ html: h2, url: r2.url })))
                                        .then(o2 => {
                                            if (seq === searchSeq) {
                                                const doc2 = new DOMParser().parseFromString(o2.html, 'text/html');
                                                const r2 = parseSearchResults(doc2);
                                                if (r2.length) {
                                                    paintResults(r2, null);
                                                    return;
                                                }
                                                paintResults(results, nextUrl);
                                            }
                                        })
                                        .catch(() => {
                                            if (seq === searchSeq) paintResults(results, nextUrl);
                                        });
                                    return;
                                }
                            }
                            paintResults(results, nextUrl);
                        }
                    })
                    .catch(err => { if (seq === searchSeq && !(err && err.name === 'AbortError')) searchResultsEl.innerHTML = '<div class="smg-search-noresults">' + i18n('Search failed') + '</div>'; });
            }
            function parseSearchResults(doc) {
                const out = [];
                doc.querySelectorAll('.block-body .contentRow').forEach(row => {
                    const a = row.querySelector('.contentRow-title a[href], h3 a[href], .contentRow-main a[href]');
                    if (!a) return;
                    let href = a.getAttribute('href') || '';
                    try { href = new URL(href, location.href).href; } catch (e) {}
                    const snip = row.querySelector('.contentRow-snippet');
                    const minor = row.querySelector('.contentRow-minor');
                    // prefixos/tags: SimpCity usa .label; SMG usa .prefix (mesma divergência dos alertas) → seletor cobre os dois, senão a tag vaza no título ("YoutubersGals Of Gurk")
                    const LABEL_SEL = '.label, .label-append, [class*="label--"], .prefix, [class*="prefix"]';
                    const titleEl = a.closest('.contentRow-title') || a.parentElement;
                    const labels = titleEl ? Array.from(titleEl.querySelectorAll(LABEL_SEL)) : [];
                    const aClone = a.cloneNode(true);   // tags vêm DENTRO do <a> → tira do texto do título (senão duplica/cola)
                    aClone.querySelectorAll(LABEL_SEL).forEach(l => l.remove());
                    // FOTO = thumbnail do tópico (.structItem-cell--icon > .dcThumbnail; a URL real está no background-image do <img>). Reusa o dcThumbUrl.
                    const thumbEl = row.querySelector('.dcThumbnail');
                    let photo = thumbEl ? dcThumbUrl(thumbEl) : '';
                    if (/no_image|defaultThumbnail/i.test(photo)) photo = '';   // placeholder "sem imagem" → ignora
                    out.push({
                        href: href,
                        title: aClone.textContent.replace(/\s+/g, ' ').trim(),
                        snippet: snip ? snip.textContent.replace(/\s+/g, ' ').trim() : '',
                        meta: minor ? minor.textContent.replace(/\s+/g, ' ').trim() : '',
                        photo: photo,   // URL do thumbnail (string) — img limpa no paint (sem clonar <a> aninhado)
                        labels: labels.map(l => document.importNode(l, true)),  // tags/prefixos originais
                    });
                });
                return out;
            }
            // clicar num resultado (ou "Ver todos") TAMBÉM grava a busca no histórico — antes só Enter/Buscar gravava, então type→clica-link se perdia
            function commitCurrentSearch() {
                const keywords = getSearchInput().value.trim();
                const titlesOn = toggleTitleOnly?.checked ?? cfgTitles;
                const orderDate = (sortSelect?.value === 'date') || cfgOrder;
                const by = authorInput?.value.trim() || '';
                const activeBadges = Array.from(activeSearchBadges);
                addHistory({ q: keywords || activeBadges.join(' '), by, scope: currentScope, titles: (titlesOn === true), order: orderDate ? 'date' : '', t: Date.now() });
            }
            // termos p/ highlight = keywords digitadas (sem aspas/wildcard), ≥2 chars
            function hlTerms() {
                const kw = extractSocialHandle(getSearchInput().value.trim());
                const terms = kw.split(/\s+/).map(s => s.replace(/["*]/g, '').trim()).filter(s => s.length >= 2);
                const unspaced = kw.replace(/[\s\-_.]+/g, '').trim();
                if (unspaced.length >= 3 && !terms.includes(unspaced)) {
                    terms.push(unspaced);
                }
                const camel = kw.replace(/([a-z])([A-Z])/g, '$1 $2').split(/\s+/).map(s => s.trim()).filter(s => s.length >= 2);
                camel.forEach(w => { if (!terms.includes(w)) terms.push(w); });

                const unaccented = removeAccents(kw);
                if (unaccented && unaccented !== kw) {
                    unaccented.split(/\s+/).map(s => s.replace(/["*]/g, '').trim()).filter(s => s.length >= 2).forEach(w => {
                        if (!terms.includes(w)) terms.push(w);
                    });
                }

                return terms;
            }
            // escreve `text` em `el` envolvendo as ocorrências dos termos em <mark> (text nodes → SEM injeção de HTML).
            // como a busca usa wildcard de prefixo, o termo "fileste" destaca a palavra inteira "filester" ([\w] após o termo).
            function setHL(el, text, terms) {
                el.textContent = '';
                if (!terms.length || !text) { el.textContent = text || ''; return; }
                const esc = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\w]*');
                let re; try { re = new RegExp('(' + esc.join('|') + ')', 'ig'); } catch (e) { el.textContent = text; return; }
                let last = 0, m;
                while ((m = re.exec(text))) {
                    if (m.index > last) el.appendChild(document.createTextNode(text.slice(last, m.index)));
                    const mk = document.createElement('mark'); mk.className = 'smg-search-hl'; mk.textContent = m[0];
                    el.appendChild(mk);
                    last = m.index + m[0].length;
                    if (re.lastIndex === m.index) re.lastIndex++;   // guarda contra match vazio
                }
                if (last < text.length) el.appendChild(document.createTextNode(text.slice(last)));
            }
            let currentTagFilter = '';
            function paintResults(results, nextUrl) {
                searchResultsEl.innerHTML = '';
                searchPager.reset(nextUrl || null);
                currentTagFilter = '';
                removeSearchSentinel();

                const terms = hlTerms();

                let filtered = results;
                if (activeSearchBadges && activeSearchBadges.size > 0) {
                    const activeLower = Array.from(activeSearchBadges).map(b => b.toLowerCase().trim());
                    filtered = results.filter(r => {
                        const labelTexts = (r.labels || []).map(l => (l.textContent || '').toLowerCase().replace(/^[#\s\[\]]+|[#\s\[\]]+$/g, '').trim());
                        const hasLabel = activeLower.some(ab => labelTexts.some(lt => lt === ab || lt.includes(ab) || ab.includes(lt)));
                        if (hasLabel) return true;
                        // Fallback: se o título do tópico contém a badge
                        const tLower = (r.title || '').toLowerCase();
                        return activeLower.some(ab => tLower.includes(ab));
                    });
                }

                // Coletar chips dinâmicos de prefixo/tags presentes nestes resultados
                const tagCountMap = new Map();
                filtered.forEach(r => {
                    const seen = new Set();
                    (r.labels || []).forEach(l => {
                        const txt = (l.textContent || '').replace(/^[#\s\[\]]+|[#\s\[\]]+$/g, '').trim();
                        if (txt && !seen.has(txt.toLowerCase())) {
                            const low = txt.toLowerCase();
                            seen.add(low);
                            const cur = tagCountMap.get(low) || { name: txt, count: 0 };
                            cur.count++;
                            tagCountMap.set(low, cur);
                        }
                    });
                });

                const listContainer = document.createElement('div');
                listContainer.className = 'smg-search-results-list';

                const renderCardsForList = (items) => {
                    listContainer.innerHTML = '';
                    if (!items.length) {
                        const e = document.createElement('div');
                        e.className = 'smg-search-noresults';
                        e.textContent = (activeSearchBadges && activeSearchBadges.size > 0 || currentTagFilter)
                            ? (IS_PT ? 'Nenhum resultado com os filtros selecionados' : 'No results found with selected filters')
                            : i18n('No results');
                        listContainer.appendChild(e);
                    } else {
                        items.forEach(r => {
                            listContainer.appendChild(renderSearchCard(r, terms));
                        });
                    }
                };

                // Se houver 2 ou mais tags distintas nos resultados, cria a linha de chips dinâmicos
                if (tagCountMap.size >= 2) {
                    const chipsRow = document.createElement('div');
                    chipsRow.className = 'smg-search-chips-row';

                    const allChip = document.createElement('button');
                    allChip.type = 'button';
                    allChip.className = 'smg-search-result-chip is-active';
                    allChip.dataset.tag = '';
                    allChip.innerHTML = i18n('All') + ' <span class="smg-chip-count">' + filtered.length + '</span>';
                    chipsRow.appendChild(allChip);

                    const sortedTags = Array.from(tagCountMap.values()).sort((a, b) => b.count - a.count);
                    sortedTags.forEach(t => {
                        const chip = document.createElement('button');
                        chip.type = 'button';
                        chip.className = 'smg-search-result-chip';
                        chip.dataset.tag = t.name.toLowerCase();
                        chip.innerHTML = t.name + ' <span class="smg-chip-count">' + t.count + '</span>';
                        chipsRow.appendChild(chip);
                    });

                    chipsRow.addEventListener('click', e => {
                        const chipBtn = e.target.closest && e.target.closest('.smg-search-result-chip');
                        if (!chipBtn) return;
                        e.preventDefault();
                        chipsRow.querySelectorAll('.smg-search-result-chip').forEach(c => c.classList.remove('is-active'));
                        chipBtn.classList.add('is-active');
                        const tagKey = chipBtn.dataset.tag;
                        currentTagFilter = tagKey;
                        if (!tagKey) {
                            renderCardsForList(filtered);
                            if (searchSentinelEl) searchSentinelEl.hidden = false;
                        } else {
                            const subFiltered = filtered.filter(r => {
                                const lTexts = (r.labels || []).map(l => (l.textContent || '').toLowerCase().replace(/^[#\s\[\]]+|[#\s\[\]]+$/g, '').trim());
                                return lTexts.some(lt => lt === tagKey || lt.includes(tagKey) || tagKey.includes(lt));
                            });
                            renderCardsForList(subFiltered);
                            if (searchSentinelEl) searchSentinelEl.hidden = true;
                        }
                    });

                    searchResultsEl.appendChild(chipsRow);
                }

                searchResultsEl.appendChild(listContainer);
                renderCardsForList(filtered);

                if (!searchPager.ended) {
                    searchSentinelEl = document.createElement('div');
                    searchSentinelEl.className = 'smg-search-sentinel';
                    searchSentinelEl.innerHTML = '<span class="smg-loading"></span>';
                    searchResultsEl.appendChild(searchSentinelEl);
                    // a lista curta já mostra a sentinela: puxa a 2ª página depois do layout, sem esperar um scroll
                    requestAnimationFrame(() => searchPager.check());
                }

                searchResultsEl.hidden = false;
            }
            function updateSearchClearButtons() {
                const curVal = getSearchInput().value.trim();
                document.querySelectorAll('.smg-search-clear').forEach(btn => {
                    const bar = btn.closest('.smg-search-bar, .smg-tb-search');
                    const inp = bar ? bar.querySelector('.smg-search-input, .smg-tb-search-input') : null;
                    const val = inp ? inp.value.trim() : curVal;
                    btn.hidden = !val;
                });
            }
            function clearResults() {   // volta pro histórico — sem re-render se ele JÁ está na tela (era rebuild por keystroke)
                searchPager.reset(null);
                removeSearchSentinel();
                if (!searchResultsEl.hidden) { searchResultsEl.hidden = true; searchResultsEl.innerHTML = ''; }
                if (searchHistEl.hidden && searchEmptyEl.hidden) renderHistory();
                updateSearchClearButtons();
            }
            // DEBOUNCE: busca enquanto digita (não grava histórico; só Enter/Buscar grava). Delegado: vale pro input da topbar E do modal + autor.
            let searchDebounce = null;
            function onSearchInput() {
                clearTimeout(searchDebounce);
                const kw = getSearchInput().value.trim();
                const by = authorInput ? authorInput.value.trim() : '';
                const hasBadges = activeSearchBadges && activeSearchBadges.size > 0;
                if (kw.length < 3 && !by && !hasBadges && currentScope !== 'watched') { clearResults(); return; }   // vazio/curto demais → histórico (XF tem mínimo de caracteres)
                searchDebounce = setTimeout(() => doSearch(false), 420);
            }
            document.addEventListener('input', e => {
                if (e.target && e.target.matches && e.target.matches('.smg-tb-search-input, .smg-search-input')) {
                    updateSearchClearButtons();
                    onSearchInput();
                }
            });
            // mudança de FILTRO (escopo via chip) re-busca JÁ (sem debounce) se já existe query. Hoisted → ok no init.
            function researchOnFilter() {
                if (applyingEntry) return;
                const kw = getSearchInput().value.trim();
                const by = authorInput ? authorInput.value.trim() : '';
                const hasBadges = activeSearchBadges && activeSearchBadges.size > 0;
                if (kw.length < 3 && !by && !hasBadges && currentScope !== 'watched') return;
                clearTimeout(searchDebounce);
                doSearch(false);
            }

            searchInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') { e.preventDefault(); clearTimeout(searchDebounce); doSearch(true); }
                else if (e.key === 'Escape') closePopovers();
            });
            searchPop.querySelector('.smg-search-go').addEventListener('click', () => { clearTimeout(searchDebounce); doSearch(true); });

            // Toolbar de Filtros Completa no Search Global (Organizada em 2 Rows)
            const searchToolbarEl = searchPop.querySelector('.smg-search-global-toolbar');
            if (searchToolbarEl) {
                searchToolbarEl.innerHTML = '';

                // Obter badges conhecidas (DOM + PREFIX_CATEGORY_MAP + serverPrefixMap)
                const getAllSearchBadges = () => {
                    const badgeMap = new Map();
                    if (typeof getPageBadges === 'function') {
                        try {
                            getPageBadges().forEach(b => {
                                const k = (b.name || '').toLowerCase().trim();
                                if (k) badgeMap.set(k, b);
                            });
                        } catch (e) {}
                    }
                    if (typeof PREFIX_CATEGORY_MAP !== 'undefined') {
                        Object.keys(PREFIX_CATEGORY_MAP).forEach(k => {
                            const lower = k.toLowerCase().trim();
                            if (!badgeMap.has(lower)) {
                                const displayName = lower.charAt(0).toUpperCase() + lower.slice(1);
                                let cls = KNOWN_XF_PREFIXES[lower]
                                    ? KNOWN_XF_PREFIXES[lower]
                                    : 'label label--misc';
                                if (!cls.includes('label')) cls = 'label ' + cls;
                                badgeMap.set(lower, { name: displayName, type: 'prefix', className: cls, count: 0 });
                            }
                        });
                    }
                    if (typeof globalPrefixMap !== 'undefined' && globalPrefixMap && globalPrefixMap.size > 0) {
                        globalPrefixMap.forEach((prefixId, nameKey) => {
                            const lower = nameKey.toLowerCase().trim();
                            if (!badgeMap.has(lower)) {
                                const displayName = lower.charAt(0).toUpperCase() + lower.slice(1);
                                let cls = KNOWN_XF_PREFIXES[lower]
                                    ? KNOWN_XF_PREFIXES[lower]
                                    : 'label label--misc';
                                if (!cls.includes('label')) cls = 'label ' + cls;
                                badgeMap.set(lower, { name: displayName, type: 'prefix', className: cls, count: 0 });
                            }
                        });
                    }
                    if (typeof serverPrefixMap !== 'undefined' && serverPrefixMap && serverPrefixMap.size > 0) {
                        serverPrefixMap.forEach((prefixId, nameKey) => {
                            const lower = nameKey.toLowerCase().trim();
                            if (!badgeMap.has(lower)) {
                                const displayName = lower.charAt(0).toUpperCase() + lower.slice(1);
                                let cls = KNOWN_XF_PREFIXES[lower]
                                    ? KNOWN_XF_PREFIXES[lower]
                                    : 'label label--misc';
                                if (!cls.includes('label')) cls = 'label ' + cls;
                                badgeMap.set(lower, { name: displayName, type: 'prefix', className: cls, count: 0 });
                            }
                        });
                    }
                    return Array.from(badgeMap.values());
                };

                // ===== ÍCONES MONOCROMÁTICOS DOS SELECTS =====
                const SCOPE_ICONS = {
                    everywhere: ICONS.globe,
                    watched: ICONS.star || ICONS.watched,
                    threads: ICONS.chat,
                    thread: ICONS.comment || ICONS.chat
                };
                const SORT_ICONS = {
                    relevance: ICONS.barChart,
                    date: ICONS.sortDate
                };

                // ===== TOOLBAR UNIFICADA (PAINEL INTEGRADO) =====
                searchToolbarEl.innerHTML = `
                    <div class="smg-search-tb-row">
                        <div class="smg-search-select-wrap">
                            <span class="smg-search-select-ic" aria-hidden="true">${ICONS.globe}</span>
                            <select class="smg-search-scope-select" aria-label="${IS_PT ? 'Escopo da busca' : 'Search scope'}">
                                <option value="everywhere">${IS_PT ? 'Todo o fórum' : 'Everywhere'}</option>
                                <option value="watched">${IS_PT ? 'Tópicos seguidos' : 'Watched'}</option>
                                <option value="threads">${IS_PT ? 'Tópicos' : 'Threads'}</option>
                                ${threadId ? `<option value="thread">${IS_PT ? 'Neste tópico' : 'This thread'}</option>` : ''}
                            </select>
                        </div>
                        <div class="smg-search-select-wrap">
                            <span class="smg-search-select-ic" aria-hidden="true">${ICONS.barChart}</span>
                            <select class="smg-search-sort-select" aria-label="${IS_PT ? 'Ordenação' : 'Sort order'}">
                                <option value="relevance">${IS_PT ? 'Relevância' : 'Relevance'}</option>
                                <option value="date">${IS_PT ? 'Mais recentes' : 'Newest'}</option>
                            </select>
                        </div>
                        <label class="smg-ios-toggle" title="${IS_PT ? 'Buscar apenas nos títulos' : 'Search titles only'}">
                            <input type="checkbox" class="smg-toggle-title-only"${titlesOn ? ' checked' : ''}>
                            <span class="smg-ios-switch"></span>
                            <span class="smg-ios-label">${IS_PT ? 'Só títulos' : 'Titles only'}</span>
                        </label>
                        <button type="button" class="smg-search-author-trigger" title="${IS_PT ? 'Filtrar por autor' : 'Filter by author'}" aria-label="${IS_PT ? 'Filtrar por autor' : 'Filter by author'}">
                            ${ICONS.user}
                        </button>
                        <div class="smg-search-tb-spacer"></div>
                        <button type="button" class="smg-search-cfg" title="${i18n('Search defaults')}">${ICONS.sliders}</button>
                        <a class="smg-search-adv" href="${searchAction.replace(/search\/?$/, '') || '/search/'}" target="_blank" rel="noopener" title="${i18n('Advanced')}">
                            <span>${IS_PT ? 'Filtro avançado' : 'Advanced'}</span>
                            <span class="smg-ext-ic">${svgIcon('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>')}</span>
                        </a>
                    </div>
                    <div class="smg-search-author-row" hidden>
                        <span class="smg-search-author-ic">${ICONS.user}</span>
                        <input type="text" class="smg-search-author-inp" placeholder="${IS_PT ? 'Filtrar por autor…' : 'Filter by author…'}" spellcheck="false" autocomplete="off">
                        <button type="button" class="smg-search-author-clear" title="${i18n('Clear')}" aria-label="${i18n('Clear')}" hidden>${ICONS.close}</button>
                        <button type="button" class="smg-search-author-close" title="${IS_PT ? 'Concluir' : 'Done'}" aria-label="${IS_PT ? 'Concluir' : 'Done'}">${ICONS.close}</button>
                    </div>
                `;

                scopeSelect = searchToolbarEl.querySelector('.smg-search-scope-select');
                sortSelect = searchToolbarEl.querySelector('.smg-search-sort-select');
                toggleTitleOnly = searchToolbarEl.querySelector('.smg-toggle-title-only');
                const authorTrigger = searchToolbarEl.querySelector('.smg-search-author-trigger');
                const authorRow = searchToolbarEl.querySelector('.smg-search-author-row');
                authorInput = searchToolbarEl.querySelector('.smg-search-author-inp');
                const authorClear = searchToolbarEl.querySelector('.smg-search-author-clear');
                const authorClose = searchToolbarEl.querySelector('.smg-search-author-close');

                const updateSelectIcon = (sel, map) => {
                    if (!sel) return;
                    const wrap = sel.closest('.smg-search-select-wrap');
                    const ic = wrap?.querySelector('.smg-search-select-ic');
                    if (ic && map[sel.value]) ic.innerHTML = map[sel.value];
                };

                scopeSelect.value = currentScope;
                updateSelectIcon(scopeSelect, SCOPE_ICONS);
                scopeSelect.addEventListener('change', () => {
                    currentScope = scopeSelect.value;
                    updateSelectIcon(scopeSelect, SCOPE_ICONS);
                    applyScopeUI();
                    researchOnFilter();
                    try { getSearchInput().focus(); } catch (e) {}
                });

                sortSelect.value = orderDate ? 'date' : 'relevance';
                updateSelectIcon(sortSelect, SORT_ICONS);
                sortSelect.addEventListener('change', () => {
                    orderDate = (sortSelect.value === 'date');
                    updateSelectIcon(sortSelect, SORT_ICONS);
                    researchOnFilter();
                });

                toggleTitleOnly.addEventListener('change', () => {
                    titlesOn = toggleTitleOnly.checked;
                    researchOnFilter();
                });

                const openAuthorRow = () => {
                    searchToolbarEl.classList.add('author-open');
                    authorRow.hidden = false;
                    authorClear.hidden = !authorInput.value;
                    try { authorInput.focus(); authorInput.select(); } catch (e) {}
                };

                const closeAuthorRow = () => {
                    searchToolbarEl.classList.remove('author-open');
                    authorRow.hidden = true;
                    const uname = (authorInput.value || '').trim();
                    authorTrigger.classList.toggle('has-value', !!uname);
                    authorTrigger.title = uname ? `${IS_PT ? 'Autor' : 'Author'}: ${uname}` : (IS_PT ? 'Filtrar por autor' : 'Filter by author');
                };

                authorTrigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    openAuthorRow();
                });

                authorClose.addEventListener('click', (e) => {
                    e.preventDefault();
                    closeAuthorRow();
                });

                authorClear.addEventListener('click', (e) => {
                    e.preventDefault();
                    authorInput.value = '';
                    authorClear.hidden = true;
                    commitAuthor();
                    try { authorInput.focus(); } catch (e) {}
                });

                let authorDebounce = null;
                const commitAuthor = () => {
                    const uname = (authorInput.value || '').trim();
                    authorTrigger.classList.toggle('has-value', !!uname);
                    authorTrigger.title = uname ? `${IS_PT ? 'Autor' : 'Author'}: ${uname}` : (IS_PT ? 'Filtrar por autor' : 'Filter by author');
                    authorClear.hidden = !uname;
                    researchOnFilter();
                };
                authorInput.addEventListener('input', () => {
                    clearTimeout(authorDebounce);
                    authorDebounce = setTimeout(commitAuthor, 350);
                });
                authorInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        clearTimeout(authorDebounce);
                        commitAuthor();
                        closeAuthorRow();
                        doSearch(true);
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        closeAuthorRow();
                    }
                });
            }

            if (typeof window !== 'undefined' && window.__TEST_MODE__) {
                window.__dockSearchExports = {
                    paintResults,
                    activeSearchBadges,
                    get searchResultsEl() { return searchResultsEl; },
                    doSearch,
                    openAdvanced,
                    getSearchInput,
                    parseSearchResults,
                    loadMoreSearchResults,
                    get currentSearchNextUrl() { return searchPager.cursor; },
                    get searchSentinelEl() { return searchSentinelEl; },
                    renderSearchCard,
                    clearResults,
                    openSearch,
                    closeSearch,
                    updateSearchClearButtons,
                    extractSocialHandle,
                    removeAccents
                };
            }

            // Limpar busca (✕) no input
            document.addEventListener('click', e => {
                const clearBtn = e.target.closest && e.target.closest('.smg-search-clear');
                if (!clearBtn) return;
                e.preventDefault();
                e.stopPropagation();
                const bar = clearBtn.closest('.smg-search-bar, .smg-tb-search');
                const inp = bar ? bar.querySelector('.smg-search-input, .smg-tb-search-input') : getSearchInput();
                if (inp) {
                    inp.value = '';
                    updateSearchClearButtons();
                    clearResults();
                    inp.focus();
                    inp.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });

            // Extrair handle ao colar link de rede social no input
            document.addEventListener('paste', e => {
                const inp = e.target;
                if (!inp || !inp.matches || !inp.matches('.smg-tb-search-input, .smg-search-input')) return;
                const pasted = (e.clipboardData || window.clipboardData)?.getData('text');
                if (pasted) {
                    const handle = extractSocialHandle(pasted);
                    if (handle && handle !== pasted.trim()) {
                        e.preventDefault();
                        inp.value = handle;
                        updateSearchClearButtons();
                        inp.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            });

            // Atalho "/" foca a busca no desktop (estilo GitHub/YouTube)
            window.addEventListener('keydown', e => {
                if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    const active = document.activeElement;
                    const tag = active ? (active.tagName || '').toLowerCase() : '';
                    if (tag === 'input' || tag === 'textarea' || tag === 'select' || (active && active.isContentEditable)) {
                        return;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    openSearch();
                    const inp = getSearchInput();
                    if (inp) {
                        try {
                            inp.focus({ preventScroll: true });
                            inp.select();
                        } catch (err) {}
                    }
                }
            });

            btnSearch.addEventListener('click', e => {
                e.stopPropagation();
                if (searchOverlay.classList.contains('open')) closeSearch();
                else openSearch();
            });

            // fechar: botão X, clique no backdrop (modal), Esc
            searchPop.querySelector('.smg-search-close').addEventListener('click', closeSearch);
            searchOverlay.addEventListener('click', e => { if (e.target === searchOverlay) closeSearch(); });
            document.addEventListener('keydown', e => { if (e.key === 'Escape' && searchOverlay.classList.contains('open')) closeSearch(); });

            // abrir/fechar disparado pela topbar (input real) via eventos custom — desacopla do escopo do dock
            document.addEventListener('smg-search-open', openSearch);
            document.addEventListener('smg-search-close', closeSearch);
            // DROPDOWN (desktop): o overlay é pointer-events:none, então o clique-no-backdrop não vale — fecha ao clicar FORA do pop e da search bar
            document.addEventListener('pointerdown', e => {
                if (!searchOverlay.classList.contains('open') || !searchPop.classList.contains('smg-search-pop--drop')) return;
                if (searchPop.contains(e.target) || (e.target.closest && e.target.closest('.smg-tb-search, .smg-search-cmd, .smg-search-cfg-portal'))) return;   // portais (paleta/config) ficam no body → não contam como "fora"
                closeSearch();
            }, true);
            window.addEventListener('resize', () => { if (searchOverlay.classList.contains('open') && searchPop.classList.contains('smg-search-pop--drop')) positionDrop(); });
            // arrastar pra baixo fecha o modal de busca (mobile; não no dropdown do desktop)
            addSwipeClose(searchPop, closeSearch, () => searchOverlay.classList.contains('open') && !searchPop.classList.contains('smg-search-pop--drop'));
        };
        setupSearch();
