        // ---- settings (engrenagem) ----
        const setupSettings = () => {
            btnSettings.addEventListener('click', e => {
                e.stopPropagation();
                if (navWrapper.classList.contains('settings-open')) closePopovers();
                else { closePopovers(); navWrapper.classList.add('settings-open'); }
            });
            // toggles (FEATURES)
            settingsPop.querySelectorAll('input[data-feat]').forEach(inp => {
                inp.addEventListener('change', () => {
                    const feat = inp.dataset.feat;
                    FEATURES[feat] = inp.checked;
                    saveFeatures();
                    if (feat === 'replaceThumbsWithFull') {
                        applyReplaceThumbsWithFull(inp.checked);
                    }
                });
            });
            // sliders (tunables do feed → gmSet; aplicam na próxima abertura do feed)
            settingsPop.querySelectorAll('input[data-tune]').forEach(inp => {
                inp.addEventListener('input', () => {
                    gmSet(inp.dataset.tune, String(inp.value));
                    const badge = inp.parentElement.querySelector('.smg-set-val'); if (badge) badge.textContent = inp.value;
                });
            });
            // versão (do gerenciador de userscript)
            const verEl = settingsPop.querySelector('.smg-set-ver');
            if (verEl) verEl.textContent = (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) ? 'v' + GM_info.script.version : '';
            // fechar (×) + recarregar
            settingsPop.querySelector('.smg-set-x').addEventListener('click', e => { e.stopPropagation(); closePopovers(); });
            settingsPop.querySelector('.smg-set-reload').addEventListener('click', () => location.reload());
            // restaurar padrões: zera FEATURES + tunables e recarrega
            settingsPop.querySelector('.smg-set-reset').addEventListener('click', () => {
                if (!confirm(i18n('Restore default settings?'))) return;
                Object.assign(FEATURES, DEFAULT_FEATURES); saveFeatures();
                SET_TUNABLES.forEach(t => gmSet(t.key, ''));   // limpa → volta ao default no código
                location.reload();
            });
            // limpeza do banco de dados (aba Feed)
            const btnClearTimeline = settingsPop.querySelector('.smg-btn-clear-timeline');
            if (btnClearTimeline) {
                btnClearTimeline.addEventListener('click', () => {
                    if (!confirm(IS_PT ? 'Limpar todos os posts salvos no feed e resetar páginas salvas?' : 'Clear all saved feed posts and reset saved pages?')) return;
                    dbClearTimeline().then(() => {
                        if (typeof toast === 'function') toast(IS_PT ? 'Feed limpo com sucesso' : 'Feed cleared successfully');
                        else alert(IS_PT ? 'Feed limpo com sucesso!' : 'Feed cleared successfully!');
                    });
                });
            }
            const btnClearFollowed = settingsPop.querySelector('.smg-btn-clear-followed');
            if (btnClearFollowed) {
                btnClearFollowed.addEventListener('click', () => {
                    if (!confirm(IS_PT ? 'Limpar a tabela local de tópicos seguidos? (Isso NÃO deixará de seguir nada no fórum)' : 'Clear local cache of followed threads? (This will NOT unfollow anything on the forum)')) return;
                    dbClearFollowed().then(() => {
                        if (typeof toast === 'function') toast(IS_PT ? 'Cache de tópicos seguidos limpo com sucesso' : 'Followed threads cache cleared successfully');
                        else alert(IS_PT ? 'Cache de tópicos seguidos limpo com sucesso!' : 'Followed threads cache cleared successfully!');
                    });
                });
            }
            // rail de categorias + busca (filtra entre todas)
            const setTabs = Array.prototype.slice.call(settingsPop.querySelectorAll('.smg-set-tab'));
            const setSecs = Array.prototype.slice.call(settingsPop.querySelectorAll('.smg-set-sec'));
            const setEmpty = settingsPop.querySelector('.smg-set-empty');
            const setQ = settingsPop.querySelector('.smg-set-q');
            const setContentEl = settingsPop.querySelector('.smg-set-content');
            let setActive = 0;
            function setShowTab(i) {
                setActive = i; if (setQ) setQ.value = ''; settingsPop.classList.remove('searching'); if (setEmpty) setEmpty.hidden = true;
                setSecs.forEach((s, j) => { s.hidden = j !== i; s.querySelectorAll('[data-q]').forEach(r => { r.style.display = ''; }); });
                setTabs.forEach((t, j) => t.classList.toggle('active', j === i));
                if (setContentEl) setContentEl.scrollTop = 0;
            }
            setTabs.forEach((t, i) => t.addEventListener('click', e => { e.stopPropagation(); setShowTab(i); }));
            if (setQ) {
                setQ.addEventListener('keydown', e => e.stopPropagation());
                setQ.addEventListener('input', () => {
                    const term = setQ.value.trim().toLowerCase();
                    if (!term) { setShowTab(setActive); return; }
                    settingsPop.classList.add('searching'); setTabs.forEach(t => t.classList.remove('active'));
                    let any = false;
                    setSecs.forEach(s => {
                        let vis = false;
                        s.querySelectorAll('[data-q]').forEach(r => { const m = r.getAttribute('data-q').indexOf(term) !== -1; r.style.display = m ? '' : 'none'; if (m) { vis = true; any = true; } });
                        s.hidden = !vis;
                    });
                    if (setEmpty) setEmpty.hidden = any;
                });
            }

            // FAB de configurações: nas páginas onde a dock fica escondida (baronly no desktop), garante
            // acesso ao mod. Clique → revela a dock (só a engrenagem) + abre o settings. O closePopovers reseta.
            if (navWrapper.classList.contains('smg-dock-baronly') && !document.getElementById('smg-settings-fab')) {
                const fab = document.createElement('button');
                fab.id = 'smg-settings-fab';
                fab.type = 'button';
                fab.title = i18n('Settings');
                fab.setAttribute('aria-label', i18n('Settings'));
                fab.innerHTML = '<span class="smg-nav-ico">' + ICONS.settings + '</span>';   // mesmo wrapper da dock (fill:none → outline, não blob)
                fab.addEventListener('click', e => {
                    e.stopPropagation();
                    if (navWrapper.classList.contains('settings-open')) { closePopovers(); return; }
                    closePopovers();
                    navWrapper.classList.add('smg-dock-show', 'settings-open');
                });
                document.body.appendChild(fab);
            }
        };
        setupSettings();

        // ---- filtro e ordenação da listagem (fórum / watched / bookmarks / search) ----
        const setupListSortAndFilter = () => {
            if (!listFilterPop && !sortPop) return;
            const lfBody = listFilterPop ? listFilterPop.querySelector('.smg-lf-body') : null;
            const sortBody = sortPop ? sortPop.querySelector('.smg-sort-body') : null;
            let lfLoaded = false, lfData = null;
            let clientFilterQuery = '';
            const activeClientBadges = new Set();
            let clientBadgeMultiselect = null;
            const serverPrefixMap = new Map();
            let currentSortDir = 'desc';
            let currentLastDays = '0';

            const lfRow = label => {
                const row = document.createElement('div');
                row.className = 'smg-lf-row';
                if (label) { const l = document.createElement('div'); l.className = 'smg-lf-label'; l.textContent = label; row.appendChild(l); }
                return row;
            };
            function getThreadListContainer() {
                return document.querySelector('.structItemContainer.smg-tl-grid')
                    || document.querySelector('.structItemContainer')
                    || document.querySelector('.block-body.js-threadList')
                    || document.querySelector('.smg-article-grid')
                    || document.querySelector('.p-body-main .block-body');
            }

            const LIST_ITEM_SELECTOR = '.structItem--thread, .structItem--bookmark, .message--articlePreview';
            const listMetaCache = new WeakMap();
            const parseListCount = text => {
                if (!text) return 0;
                const clean = text.replace(/[^0-9.KMkm]/g, '').trim().toUpperCase();
                if (!clean) return 0;
                if (clean.endsWith('M')) return (parseFloat(clean) || 0) * 1000000;
                if (clean.endsWith('K')) return (parseFloat(clean) || 0) * 1000;
                return parseInt(clean, 10) || 0;
            };
            const timeValue = time => {
                if (!time) return 0;
                const ts = parseInt(time.getAttribute('data-timestamp') || time.getAttribute('data-time') || '0', 10);
                if (ts > 10000) return ts;
                const dt = time.getAttribute('datetime');
                if (dt) { const ms = Date.parse(dt); if (!isNaN(ms)) return Math.floor(ms / 1000); }
                return 0;
            };
            function listItemMeta(el) {
                if (!el) return { title: '', author: '', badges: [], tags: [], values: {} };
                const cached = listMetaCache.get(el);
                if (cached) return cached;
                const titleA = el.querySelector('.structItem-title a[href*="/threads/"]')
                    || el.querySelector('.structItem-title a, .contentRow-title a, .articlePreview-title a, h3 a');
                const userA = el.querySelector('.username, [data-user-id], .structItem-parts a');
                const badges = extractRowBadges(el);
                const tags = badges.map(b => (b.name || '').toLowerCase().replace(/^[#\s]+|[#\s]+$/g, '').trim());
                const startTime = el.querySelector('.structItem-startDate time, .contentRow-minor time, time');
                const lastTime = el.querySelector('.structItem-latestDate, .structItem-cell--latest time, .structItem-latestDate time, .structItem-cell--latest .u-dt');
                const reply = el.querySelector('.structItem-cell--meta dt:first-child + dd, .pairs--justified dd');
                const views = el.querySelector('.structItem-cell--meta dl:nth-child(2) dd, .structItem-cell--meta dt:last-of-type + dd');
                const reacts = el.querySelector('.structItem-cell--meta .reactions, [data-reaction-score]');
                const meta = {
                    title: (titleA ? titleA.textContent : '').replace(/\s+/g, ' ').trim().toLowerCase(),
                    author: (userA ? userA.textContent : '').replace(/\s+/g, ' ').trim().toLowerCase(),
                    badges,
                    tags,
                    values: {
                        title: (titleA ? titleA.textContent : '').replace(/\s+/g, ' ').trim().toLowerCase(),
                        post_date: timeValue(startTime),
                        last_post_date: timeValue(lastTime),
                        reply_count: reply ? parseListCount(reply.textContent) : 0,
                        view_count: views ? parseListCount(views.textContent) : 0,
                        first_post_reaction_score: reacts ? (reacts.getAttribute('data-reaction-score') ? parseInt(reacts.getAttribute('data-reaction-score'), 10) || 0 : parseListCount(reacts.textContent)) : 0
                    }
                };
                listMetaCache.set(el, meta);
                return meta;
            }
            function invalidateListMeta(roots) {
                if (!roots) return;
                normalizeRoots(roots).forEach(root => {
                    const row = root.closest && root.closest(LIST_ITEM_SELECTOR);
                    if (row) listMetaCache.delete(row);
                    if (root.matches && root.matches(LIST_ITEM_SELECTOR)) listMetaCache.delete(root);
                    if (root.querySelectorAll) root.querySelectorAll(LIST_ITEM_SELECTOR).forEach(item => listMetaCache.delete(item));
                });
            }

            let featChip = null;
            let starterInput = null;

            function applyForumFilterViaUrl() {
                const url = new URL(location.pathname, location.origin);
                if (currentLastDays && currentLastDays !== '0') url.searchParams.set('last_days', currentLastDays);
                else url.searchParams.set('last_days', '-1');
                if (currentSortOrder) url.searchParams.set('order', currentSortOrder);
                if (currentSortDir) url.searchParams.set('direction', currentSortDir);

                let pIdx = 0;
                activeClientBadges.forEach(badgeKey => {
                    if (serverPrefixMap.has(badgeKey)) {
                        url.searchParams.set(`prefix_id[${pIdx}]`, serverPrefixMap.get(badgeKey));
                        pIdx++;
                    }
                });
                if (featChip && featChip.dataset.on === '1') url.searchParams.set('featured', '1');
                const sv = starterInput ? starterInput.value.trim() : '';
                if (sv) url.searchParams.set('starter', sv);

                dockGo(url.toString());
            }

            function sortListItems(order, direction) {
                if (order) currentSortOrder = order;
                if (listSortTxt) listSortTxt.textContent = getListSortLabel(currentSortOrder);
                if (listSortTxtM) listSortTxtM.textContent = getListSortLabel(currentSortOrder);
                const tip = IS_PT
                    ? `Ordenação atual: por ${getListSortLabel(currentSortOrder)}. Clique para alternar`
                    : `Current sort: by ${getListSortLabel(currentSortOrder)}. Click to change`;
                if (btnListSort) setBtnLabel(btnListSort, tip);
                if (btnListSortM) setBtnLabel(btnListSortM, tip);

                const listContainer = getThreadListContainer();
                if (!listContainer) return;
                const items = Array.from(listContainer.querySelectorAll(LIST_ITEM_SELECTOR));
                if (items.length < 2) return;
                const activeOrder = order || currentSortOrder;
                const entries = items.map(el => ({ el, value: listItemMeta(el).values[activeOrder] }));
                entries.sort((a, b) => {
                    const va = a.value, vb = b.value;
                    let res = 0;
                    if (typeof va === 'string') res = va.localeCompare(vb);
                    else res = va - vb;
                    return direction === 'desc' ? -res : res;
                });

                const frag = document.createDocumentFragment();
                entries.forEach(entry => frag.appendChild(entry.el));
                listContainer.appendChild(frag);
            }

            const sortOptions = [
                { key: 'last_post_date', label: '🕒 ' + (IS_PT ? 'Última mensagem' : 'Last message') },
                { key: 'post_date', label: '📅 ' + (IS_PT ? 'Primeira mensagem' : 'First message') },
                { key: 'title', label: '🔤 ' + (IS_PT ? 'Título' : 'Title') },
                { key: 'reply_count', label: '💬 ' + (IS_PT ? 'Respostas' : 'Replies') },
                { key: 'view_count', label: '👁️ ' + (IS_PT ? 'Visualizações' : 'Views') },
                { key: 'first_post_reaction_score', label: '❤️ ' + (IS_PT ? 'Curtidas' : 'Likes') }
            ];

            const periodOptions = [
                { value: '0', label: IS_PT ? 'A qualquer momento' : 'Any time' },
                { value: '7', label: IS_PT ? '7 dias' : '7 days' },
                { value: '14', label: IS_PT ? '14 dias' : '14 days' },
                { value: '30', label: IS_PT ? '30 dias' : '30 days' },
                { value: '60', label: IS_PT ? '2 meses' : '2 months' },
                { value: '90', label: IS_PT ? '3 meses' : '3 months' },
                { value: '182', label: IS_PT ? '6 meses' : '6 months' },
                { value: '365', label: IS_PT ? '1 ano' : '1 year' }
            ];

            function buildSortPop() {
                if (!sortBody) return;
                sortBody.innerHTML = '';

                // 1. Ordenar por
                const sRow = lfRow(IS_PT ? 'Ordenar por' : 'Sort by');
                sRow.className = 'smg-lf-row smg-lf-sort-row';
                const grid = document.createElement('div');
                grid.className = 'smg-lf-sort-grid';

                sortOptions.forEach(opt => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'smg-lf-sort-opt' + (currentSortOrder === opt.key ? ' active' : '');
                    btn.textContent = opt.label;
                    btn.dataset.sort = opt.key;
                    btn.addEventListener('click', () => {
                        currentSortOrder = opt.key;
                        grid.querySelectorAll('.smg-lf-sort-opt').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        if (listSortTxt) listSortTxt.textContent = getListSortLabel(currentSortOrder);
                        if (listSortTxtM) listSortTxtM.textContent = getListSortLabel(currentSortOrder);
                        const tip = IS_PT
                            ? `Ordenação atual: por ${getListSortLabel(currentSortOrder)}. Clique para alternar`
                            : `Current sort: by ${getListSortLabel(currentSortOrder)}. Click to change`;
                        if (btnListSort) setBtnLabel(btnListSort, tip);
                        if (btnListSortM) setBtnLabel(btnListSortM, tip);
                        sortListItems(currentSortOrder, currentSortDir);
                    });
                    grid.appendChild(btn);
                });
                sRow.appendChild(grid);
                sortBody.appendChild(sRow);

                // 2. Direção
                const dRow = lfRow(IS_PT ? 'Direção' : 'Direction');
                const dirGroup = document.createElement('div');
                dirGroup.className = 'smg-lf-dir-group';
                dirGroup.innerHTML = `
                    <button type="button" class="smg-lf-dir-opt ${currentSortDir === 'desc' ? 'active' : ''}" data-dir="desc">↓ ${IS_PT ? 'Decrescente' : 'Descending'}</button>
                    <button type="button" class="smg-lf-dir-opt ${currentSortDir === 'asc' ? 'active' : ''}" data-dir="asc">↑ ${IS_PT ? 'Crescente' : 'Ascending'}</button>
                `;
                dirGroup.querySelectorAll('.smg-lf-dir-opt').forEach(btn => {
                    btn.addEventListener('click', () => {
                        currentSortDir = btn.dataset.dir;
                        dirGroup.querySelectorAll('.smg-lf-dir-opt').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        sortListItems(currentSortOrder, currentSortDir);
                    });
                });
                dRow.appendChild(dirGroup);
                sortBody.appendChild(dRow);

                // 3. Última atualização / Período
                const pRow = lfRow(IS_PT ? 'Última atualização' : 'Last updated');
                const pSelect = document.createElement('select');
                pSelect.className = 'smg-lf-select';
                periodOptions.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.value;
                    opt.textContent = p.label;
                    if (p.value === currentLastDays) opt.selected = true;
                    pSelect.appendChild(opt);
                });
                pSelect.addEventListener('change', () => {
                    currentLastDays = pSelect.value;
                });
                pRow.appendChild(pSelect);
                sortBody.appendChild(pRow);

                // 4. Se houver formulário do servidor, botão de Aplicar / Recarregar
                if (lfData && lfData.token) {
                    const apply = document.createElement('button');
                    apply.type = 'button';
                    apply.className = 'smg-lf-apply';
                    apply.textContent = IS_PT ? 'Filtrar / Recarregar' : 'Filter / Reload';
                    apply.addEventListener('click', () => {
                        if (/\/forums\//i.test(location.pathname)) {
                            applyForumFilterViaUrl();
                        } else {
                            const fields = [['_xfToken', lfData.token], ['apply', '1']];
                            if (currentSortOrder) fields.push(['order', currentSortOrder]);
                            if (currentSortDir) fields.push(['direction', currentSortDir]);
                            if (currentLastDays) fields.push(['last_days', currentLastDays]);
                            postForm(lfData.action, fields);
                        }
                    });
                    sortBody.appendChild(apply);
                }

                i18nDom(sortBody);
            }

            function getPageBadges() {
                const badgeMap = new Map();
                const container = getThreadListContainer();
                const items = container ? Array.from(container.querySelectorAll(LIST_ITEM_SELECTOR)) : [];
                items.forEach(row => {
                    const bList = listItemMeta(row).badges;
                    bList.forEach(b => {
                        const name = (b.name || '').trim();
                        if (!name) return;
                        const k = name.toLowerCase().replace(/^[#\s]+|[#\s]+$/g, '').trim();
                        if (!badgeMap.has(k)) {
                            badgeMap.set(k, { name: name.replace(/^[#\s]+|[#\s]+$/g, '').trim(), type: b.type, className: b.className, style: b.style, count: 0 });
                        }
                        badgeMap.get(k).count++;
                    });
                });
                if (serverPrefixMap && serverPrefixMap.size > 0) {
                    serverPrefixMap.forEach((prefixId, nameKey) => {
                        if (!badgeMap.has(nameKey)) {
                            let cls = (typeof KNOWN_XF_PREFIXES !== 'undefined' && KNOWN_XF_PREFIXES[nameKey]) ? KNOWN_XF_PREFIXES[nameKey] : 'label label--misc';
                            if (!cls.includes('label')) cls = 'label ' + cls;
                            const displayName = nameKey.charAt(0).toUpperCase() + nameKey.slice(1);
                            badgeMap.set(nameKey, { name: displayName, type: 'prefix', className: cls, style: '', count: 0 });
                        }
                    });
                }
                return Array.from(badgeMap.values());
            }

            function applyLocalFilter() {
                const container = getThreadListContainer();
                if (!container) return;
                const items = Array.from(container.querySelectorAll(LIST_ITEM_SELECTOR));
                const q = clientFilterQuery.toLowerCase().trim();
                const activeSelectedTags = new Set(Array.from(activeClientBadges).map(normalizeTag));

                let visible = 0;
                items.forEach(row => {
                    const meta = listItemMeta(row);
                    const title = meta.title;
                    const author = meta.author;
                    const threadTags = meta.tags;

                    const badgeMatch = activeSelectedTags.size === 0 || threadTags.some(t => activeSelectedTags.has(t));
                    const queryMatch = !q || title.includes(q) || author.includes(q) || threadTags.some(t => t.includes(q));

                    const show = badgeMatch && queryMatch;
                    if (show) {
                        row.style.removeProperty('display');
                        row.classList.remove('smg-hidden');
                        visible++;
                    } else {
                        row.style.setProperty('display', 'none', 'important');
                        row.classList.add('smg-hidden');
                    }
                });

                // Ocultar separadores de scroll infinito cujas threads estejam todas ocultas
                document.querySelectorAll('.smg-inf-sep').forEach(sep => {
                    let curr = sep.nextElementSibling;
                    let hasVisible = false;
                    let hasAnyItem = false;
                    while (curr && !curr.classList.contains('smg-inf-sep')) {
                        if (curr.matches(LIST_ITEM_SELECTOR)) {
                            hasAnyItem = true;
                            if (curr.style.display !== 'none' && !curr.classList.contains('smg-hidden')) {
                                hasVisible = true;
                                break;
                            }
                        }
                        curr = curr.nextElementSibling;
                    }
                    if (hasAnyItem && !hasVisible) {
                        sep.style.setProperty('display', 'none', 'important');
                    } else {
                        sep.style.removeProperty('display');
                    }
                });

                const countText = (visible === items.length)
                    ? (IS_PT ? `${items.length} tópicos` : `${items.length} threads`)
                    : (IS_PT ? `${visible} de ${items.length} tópicos` : `${visible} of ${items.length} threads`);

                if (listFilterPop) {
                    const popCount = listFilterPop.querySelector('.smg-lf-counter');
                    if (popCount) popCount.textContent = countText;
                }


                let emptyEl = container.querySelector('.smg-watched-empty');
                if (visible === 0 && items.length > 0) {
                    if (!emptyEl) {
                        emptyEl = document.createElement('div');
                        emptyEl.className = 'smg-watched-empty';
                        emptyEl.textContent = i18n('No matching threads found.');
                        container.appendChild(emptyEl);
                    }
                } else if (emptyEl) {
                    emptyEl.remove();
                }
            }

            window.smgReapplyFilters = roots => {
                try {
                    invalidateListMeta(roots);
                    if (clientBadgeMultiselect && typeof clientBadgeMultiselect.updateBadges === 'function') {
                        clientBadgeMultiselect.updateBadges(getPageBadges());
                    }
                    if (clientFilterQuery || activeClientBadges.size > 0) {
                        applyLocalFilter();
                    }
                } catch (e) {}
            };

            function buildClientListFilter() {
                if (!lfBody) return;
                lfBody.innerHTML = '';

                // Top row: Counter + Clear button
                const topRow = document.createElement('div');
                topRow.className = 'smg-lf-headrow';
                const container = getThreadListContainer();
                const totalItems = container ? container.querySelectorAll(LIST_ITEM_SELECTOR).length : 0;
                topRow.innerHTML = `
                    <span class="smg-lf-counter">${IS_PT ? `${totalItems} tópicos` : `${totalItems} threads`}</span>
                    <button type="button" class="smg-lf-reset-btn">${i18n('Clear filters')}</button>
                `;
                lfBody.appendChild(topRow);

                // Search row (instant search input)
                const sRow = lfRow(i18n('Search in page'));
                const sInput = document.createElement('input');
                sInput.type = 'text';
                sInput.className = 'smg-lf-input';
                sInput.placeholder = i18n('Filter by title, author or tag…');
                sInput.value = clientFilterQuery;
                sRow.appendChild(sInput);
                lfBody.appendChild(sRow);

                sInput.addEventListener('input', () => {
                    clientFilterQuery = sInput.value;
                    applyLocalFilter();
                });

                // Multiselect dropdown de Badges & Tags
                const bRow = lfRow(IS_PT ? 'Badges & Tags' : 'Badges & Tags');
                clientBadgeMultiselect = createBadgeMultiselect({
                    badges: getPageBadges(),
                    activeBadges: activeClientBadges,
                    placeholder: i18n('Search tags…'),
                    buttonLabel: IS_PT ? 'Filtrar por Badges / Tags' : 'Filter by Badges / Tags',
                    onChange: () => applyLocalFilter()
                });
                bRow.appendChild(clientBadgeMultiselect);
                lfBody.appendChild(bRow);

                // Reset button listener
                topRow.querySelector('.smg-lf-reset-btn').addEventListener('click', () => {
                    clientFilterQuery = '';
                    sInput.value = '';
                    activeClientBadges.clear();
                    if (clientBadgeMultiselect && typeof clientBadgeMultiselect.reset === 'function') {
                        clientBadgeMultiselect.reset();
                    }
                    applyLocalFilter();
                });

                i18nDom(lfBody);
                applyLocalFilter();
            }

            function buildListFilter(form) {
                lfData = { action: form.getAttribute('action') || location.pathname, token: form.querySelector('input[name="_xfToken"]')?.value || '' };
                const orderOrig = form.querySelector('select[name="order"]');
                const dirOrig = form.querySelector('select[name="direction"]');
                const lastOrig = form.querySelector('select[name="last_days"]');
                if (orderOrig?.value) {
                    currentSortOrder = orderOrig.value;
                    if (listSortTxt) listSortTxt.textContent = getListSortLabel(currentSortOrder);
                    if (listSortTxtM) listSortTxtM.textContent = getListSortLabel(currentSortOrder);
                    const tip = IS_PT
                        ? `Ordenação atual: por ${getListSortLabel(currentSortOrder)}. Clique para alternar`
                        : `Current sort: by ${getListSortLabel(currentSortOrder)}. Click to change`;
                    if (btnListSort) setBtnLabel(btnListSort, tip);
                    if (btnListSortM) setBtnLabel(btnListSortM, tip);
                }
                if (dirOrig?.value) currentSortDir = dirOrig.value;
                if (lastOrig?.value) currentLastDays = lastOrig.value;

                serverPrefixMap.clear();
                harvestPrefixesFromDoc(form);
                const prefixSelect = form.querySelector('select[name="prefix_id[]"]') || form.querySelector('select[name*="prefix"]');
                if (prefixSelect) {
                    Array.from(prefixSelect.querySelectorAll('option')).forEach(opt => {
                        if (opt.value && opt.value !== '-1' && opt.value !== '') {
                            const txt = (opt.textContent || '').replace(/\s+/g, ' ').trim();
                            if (txt) {
                                const k = txt.toLowerCase().replace(/^[#\s]+|[#\s]+$/g, '').trim();
                                serverPrefixMap.set(k, opt.value);
                                if (opt.selected) {
                                    activeClientBadges.add(k);
                                }
                            }
                        }
                    });
                }

                if (sortBody) buildSortPop();
                if (!lfBody) return;
                lfBody.innerHTML = '';

                // Top row: Counter + Clear button
                const topRow = document.createElement('div');
                topRow.className = 'smg-lf-headrow';
                const container = getThreadListContainer();
                const totalItems = container ? container.querySelectorAll(LIST_ITEM_SELECTOR).length : 0;
                topRow.innerHTML = `
                    <span class="smg-lf-counter">${IS_PT ? `${totalItems} tópicos` : `${totalItems} threads`}</span>
                    <button type="button" class="smg-lf-reset-btn">${i18n('Clear filters')}</button>
                `;
                lfBody.appendChild(topRow);

                // Busca rápida na página
                const sRow = lfRow(i18n('Search in page'));
                const sInput = document.createElement('input');
                sInput.type = 'text';
                sInput.className = 'smg-lf-input';
                sInput.placeholder = i18n('Filter by title, author or tag…');
                sInput.value = clientFilterQuery;
                sRow.appendChild(sInput);
                lfBody.appendChild(sRow);
                sInput.addEventListener('input', () => {
                    clientFilterQuery = sInput.value;
                    applyLocalFilter();
                });

                // Em destaque (toggle)
                const featOrig = form.querySelector('input[name="featured"]');
                featChip = null;
                if (featOrig) {
                    const row = lfRow('');
                    featChip = document.createElement('button');
                    featChip.type = 'button';
                    featChip.className = 'smg-chip smg-chip-toggle' + (featOrig.checked ? ' active' : '');
                    featChip.dataset.on = featOrig.checked ? '1' : '0';
                    featChip.innerHTML = '<span class="smg-chip-check">' + svgIcon('<path d="M20 6 9 17l-5-5"/>') + '</span>' + (IS_PT ? 'Apenas em destaque' : 'Featured only');
                    featChip.addEventListener('click', () => { const on = featChip.dataset.on !== '1'; featChip.dataset.on = on ? '1' : '0'; featChip.classList.toggle('active', on); });
                    row.appendChild(featChip);
                    lfBody.appendChild(row);
                }

                // Multiselect dropdown de Badges & Tags
                const isForumListing = /\/forums\//i.test(location.pathname);
                const bRow = lfRow(IS_PT ? 'Badges & Tags' : 'Badges & Tags');
                clientBadgeMultiselect = createBadgeMultiselect({
                    badges: getPageBadges(),
                    activeBadges: activeClientBadges,
                    placeholder: i18n('Search tags…'),
                    buttonLabel: IS_PT ? 'Filtrar por Badges / Tags' : 'Filter by Badges / Tags',
                    onChange: () => {
                        // Apenas atualiza o conjunto activeClientBadges, não recarrega automaticamente
                    }
                });
                bRow.appendChild(clientBadgeMultiselect);
                lfBody.appendChild(bRow);

                // Iniciado por
                const starterOrig = form.querySelector('input[name="starter"]');
                starterInput = null;
                if (starterOrig) {
                    const row = lfRow(IS_PT ? 'Iniciado por' : 'Started by');
                    starterInput = document.createElement('input');
                    starterInput.type = 'text';
                    starterInput.className = 'smg-lf-input';
                    starterInput.placeholder = IS_PT ? 'Nome de usuário' : 'Username';
                    starterInput.value = starterOrig.value || '';
                    row.appendChild(starterInput);
                    lfBody.appendChild(row);
                }

                // Reset button listener
                topRow.querySelector('.smg-lf-reset-btn').addEventListener('click', () => {
                    clientFilterQuery = '';
                    sInput.value = '';
                    activeClientBadges.clear();
                    if (clientBadgeMultiselect && typeof clientBadgeMultiselect.reset === 'function') {
                        clientBadgeMultiselect.reset();
                    }
                    if (featChip) { featChip.dataset.on = '0'; featChip.classList.remove('active'); }
                    if (starterInput) starterInput.value = '';
                    if (isForumListing) {
                        applyForumFilterViaUrl();
                        return;
                    }
                    applyLocalFilter();
                });

                // Filtrar
                const apply = document.createElement('button');
                apply.type = 'button';
                apply.className = 'smg-lf-apply';
                apply.textContent = IS_PT ? 'Filtrar' : 'Filter';
                apply.addEventListener('click', () => {
                    applyForumFilterViaUrl();
                });
                lfBody.appendChild(apply);
                i18nDom(lfBody);
            }

            const tryBuild = form => {
                if (!form) return false;
                try { buildListFilter(form); } catch (err) { console.warn('[smg] erro ao montar filtro', err); buildClientListFilter(); buildSortPop(); }
                return true;
            };

            const loadViaNative = () => {
                const trigger = document.querySelector('.filterBar-menuTrigger');
                const menuBody = document.querySelector('.filterBar .js-filterMenuBody');
                if (!trigger || !menuBody) { buildClientListFilter(); buildSortPop(); return; }
                if (tryBuild(menuBody.querySelector('form'))) return;

                const closeNative = () => document.querySelectorAll('.menu[data-href*="filters"], .menu.is-active, [data-menu="menu"]').forEach(m => {
                    if (m.classList.contains('is-active') || (m.getAttribute('data-href') || '').includes('filters')) {
                        m.classList.remove('is-active');
                        m.setAttribute('aria-hidden', 'true');
                    }
                });
                const hide = document.createElement('style');
                hide.textContent = '.menu[data-href*="filters"], .filterBar .menu, .menu.js-filterMenuBody, .menu.is-active { opacity: 0 !important; pointer-events: none !important; visibility: hidden !important; }';
                document.head.appendChild(hide);
                const sy = window.scrollY;
                trigger.click();

                let tries = 0;
                const poll = setInterval(() => {
                    const f = menuBody.querySelector('form');
                    if (f) {
                        clearInterval(poll);
                        tryBuild(f);
                        closeNative();
                        window.scrollTo(0, sy);
                        setTimeout(() => hide.remove(), 100);
                    } else if (++tries > 60) {
                        clearInterval(poll);
                        closeNative();
                        hide.remove();
                        buildClientListFilter();
                        buildSortPop();
                    }
                }, 100);
            };

            function loadListFilter(forceSort) {
                if (lfLoaded) {
                    if (location.pathname.includes('/watched/') || location.pathname.includes('/bookmarks') || !document.querySelector('.filterBar-menuTrigger')) {
                        buildClientListFilter();
                        buildSortPop();
                    } else if (forceSort) {
                        buildSortPop();
                    }
                    return;
                }
                lfLoaded = true;
                if (location.pathname.includes('/watched/') || location.pathname.includes('/bookmarks') || !document.querySelector('.filterBar-menuTrigger')) {
                    buildClientListFilter();
                    buildSortPop();
                    return;
                }
                const url = document.querySelector('.filterBar .menu[data-href]')?.getAttribute('data-href');
                if (!url) { loadViaNative(); return; }
                const tok = (document.documentElement.getAttribute('data-csrf') || '').trim();
                fetch(url + (url.includes('?') ? '&' : '?') + '_xfResponseType=json&_xfWithData=1' + (tok ? '&_xfToken=' + encodeURIComponent(tok) : ''), { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
                    .then(r => r.text())
                    .then(text => {
                        let h = text;
                        try {
                            const j = JSON.parse(text);
                            if (j && j.html && typeof j.html === 'object' && j.html.content) h = j.html.content;
                            else if (j && typeof j.html === 'string') h = j.html;
                        } catch {}
                        const form = new DOMParser().parseFromString(h, 'text/html').querySelector('form');
                        if (!tryBuild(form)) loadViaNative();
                    })
                    .catch(err => { console.warn('[smg] erro no fetch do filtro', err); loadViaNative(); });
            }

            if (btnListFilter) {
                btnListFilter.addEventListener('click', e => {
                    e.stopPropagation();
                    const isOpen = navWrapper.classList.contains('listfilter-open');
                    closePopovers();
                    if (!isOpen) {
                        navWrapper.classList.add('listfilter-open');
                        loadListFilter();
                    }
                });
            }

            if (btnListSort) {
                btnListSort.addEventListener('click', e => {
                    e.stopPropagation();
                    const isOpen = navWrapper.classList.contains('listsort-open');
                    closePopovers();
                    if (!isOpen) {
                        navWrapper.classList.add('listsort-open');
                        if (!lfLoaded) loadListFilter(true);
                        else buildSortPop();
                    }
                });
            }
        };
        setupListSortAndFilter();

        // fecha os popovers da dock (goto/config/filtro de lista/ordenação) ao clicar fora — o search tem backdrop próprio
        document.addEventListener('click', e => {
            if (!navWrapper.classList.contains('goto-open') && !navWrapper.classList.contains('settings-open')
                && !navWrapper.classList.contains('listfilter-open') && !navWrapper.classList.contains('listsort-open')) return;
            const inside = gotoPop.contains(e.target)
                || settingsPop.contains(e.target)
                || (listFilterPop && listFilterPop.contains(e.target))
                || (sortPop && sortPop.contains(e.target))
                || btnGoto.contains(e.target)
                || btnSettings.contains(e.target)
                || (btnListFilter && btnListFilter.contains(e.target))
                || (btnListFilterM && btnListFilterM.contains(e.target))
                || (btnListSort && btnListSort.contains(e.target))
                || (btnListSortM && btnListSortM.contains(e.target))
                || (e.target.closest && e.target.closest('.filterBar')); // não fecha ao usar o loader nativo
            if (!inside) closePopovers();
        });

        // ---- helpers de post ----
        let lastPostScan = 0, lastScanHeight = 0;
        function refreshPosts() {   // scroll infinito anexa posts DEPOIS do build → re-materializa a lista (só quando cresce)
            const h = document.documentElement.scrollHeight;
            if (h === lastScanHeight) return;   // nada anexado desde o último scan → poupa o qSA doc-wide + closest por anchor
            lastScanHeight = h;
            let p = Array.from(document.querySelectorAll('span.u-anchorTarget[id^="post-"]')).filter(el => !el.closest('.message-responseRow'));
            if (!p.length) p = Array.from(document.querySelectorAll('.message'));
            if (p.length > posts.length) posts = p;
        }
        // estado dos botões prev/next/goto: depende só de constantes capturadas no mount → seta 1× (não no scroll)
        function updatePostButtonsState() {
            btnPageFirst.disabled = !pageJump || pageJump.current <= 1;
            btnPagePrev.disabled = !pageJump || pageJump.current <= 1;
            btnPageNext.disabled = !pageJump || pageJump.current >= pageJump.max;
            btnPageLast.disabled = !pageJump || pageJump.current >= pageJump.max;
            btnGoto.disabled = !pageJump;
        }
        // sondagem "cheguei no fim da lista?" (scroll infinito anexou posts) — throttled 800ms.
        // O estado dos botões é constante; o scroll só verifica quando o último post
        // entrou na área de pré-carregamento.
        function pollEndOfList() {
            const now = Date.now();
            if (now - lastPostScan <= 800) return;
            lastPostScan = now;
            // "perto do fim?" só precisa do ÚLTIMO anchor (1 rect) — getCurrentPostIndex() lia o rect de
            // TODOS os posts até o atual (O(N) num thread fundo) só pra gatear este refresh
            const last = posts[posts.length - 1];
            if (last && last.getBoundingClientRect().top < window.innerHeight * 2) refreshPosts();
        }

        // ---- scroll topo / fundo (substituem o nav de post) ----
        btnUp.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        btnDown.addEventListener('click', () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }));

        // ---- watch thread ----
        function getWatchButton() {
            return document.querySelector('.buttonGroup a[data-sk-watch][data-sk-unwatch]');
        }

        const paintWatch = on => {
            const tip = on
                ? (IS_PT ? 'Seguindo este tópico. Clique para deixar de seguir' : 'Watching this thread. Click to unwatch')
                : (IS_PT ? 'Seguir este tópico (receber notificações)' : 'Watch thread (receive updates)');
            [btnWatch, btnWatchM].filter(Boolean).forEach(b => {
                setBtnIcon(b, on ? ICONS.unwatch : ICONS.watch);
                setBtnLabel(b, tip);
                b.classList.toggle('smg-active', on);   // destaca quando seguindo
            });
        };
        function updateWatchIcon() { paintWatch(smgIsWatching(getWatchButton())); }

        btnWatch.addEventListener('click', async () => {
            const watchBtn = getWatchButton();
            if (!watchBtn) return;
            const wasWatching = smgIsWatching(watchBtn);
            paintWatch(!wasWatching);   // REATIVO: vira o estado na hora (otimista)
            watchBtn.click();
            const confirmBtn = await waitForElement('.overlay button[type="submit"].button--primary');
            confirmBtn?.click();
            setTimeout(() => {
                updateWatchIcon();                  // re-sincroniza com o real (corrige se errou)
                const nowWatching = smgIsWatching(getWatchButton());
                // sincroniza o NOSSO banco do feed com a mudança: passou a seguir → adiciona a thread (puxa posts já); deixou de seguir → remove
                if (nowWatching && !wasWatching) safe(feedAddCurrentThread);
                else if (!nowWatching && wasWatching) safe(feedRemoveCurrentThread);
            }, 1500);
        });

        updateWatchIcon();

        // ---- paginação ----
        btnPageFirst.addEventListener('click', () => { if (pageJump) dockGo(jumpUrl(1)); });
        btnPagePrev.addEventListener('click', () => { if (pageJump && pageJump.current > 1) dockGo(jumpUrl(pageJump.current - 1)); });
        btnPageNext.addEventListener('click', () => { if (pageJump && pageJump.current < pageJump.max) dockGo(jumpUrl(pageJump.current + 1)); });
        btnPageLast.addEventListener('click', () => { if (pageJump) dockGo(jumpUrl(pageJump.max)); });

        // ---- sort ----
        function updateSortIcon() {
            const sortTip = sortIsDate
                ? (IS_PT ? 'Ordenação atual: por data. Clique para ordenar por reações' : 'Current sort: by date. Click to sort by reactions')
                : (IS_PT ? 'Ordenação atual: por reações. Clique para ordenar por data' : 'Current sort: by reactions. Click to sort by date');
            [btnSort, btnSortM].filter(Boolean).forEach(b => {
                setBtnIcon(b, sortIsDate ? ICONS.sort : (ICONS.heart || ICONS.sort));
                setBtnLabel(b, sortTip);
                const t = b.querySelector('.smg-nav-btn-text');
                if (t) t.textContent = i18n(sortIsDate ? 'Date' : 'Reactions');
                b.classList.toggle('smg-active', !sortIsDate);
            });
        }

        btnSort.addEventListener('click', () => {
            sortIsDate = !sortIsDate;
            updateSortIcon();
            const targetUrl = getSortHref(sortIsDate);
            if (targetUrl) {
                dockGo(targetUrl);
            }
        });

        updateSortIcon();

        // ---- estado inicial dos botões (1×) + sondagem de fim-de-lista no scroll ----
        updatePostButtonsState();

        onScrollRaf(pollEndOfList);
    }
