    // ===== v2.9 — GALERIA MODERNA ESTILO YOUTUBE (ÁLBUM) =====
    function killOldCounter() {
        const counter = document.getElementById("resultsCounter");
        if (counter) {
            const p = counter.closest("p, div.text-center, .results-counter");
            if (p) p.style.display = "none";
            else counter.style.display = "none";
        }
        document.querySelectorAll(".results-counter, .advanced-notice, main > p:has(#resultsCounter)").forEach(el => el.style.display = "none");
    }

    let galleryObserver = null;
    let albumCountUpdate = null;
    let isEnhancingCards = false;

    function fixAlbumHeader() {
        const h1 = document.querySelector("main h1, .bunkr-album-title, h1.truncate");
        if (h1) {
            const raw = h1.textContent || h1.innerText || "";
            const cleaned = cleanHtmlText(raw);
            if (cleaned && h1.textContent !== cleaned) {
                h1.textContent = cleaned;
            }
            const cleanedDocTitle = cleanHtmlText(document.title);
            if (cleanedDocTitle && document.title !== cleanedDocTitle) {
                document.title = cleanedDocTitle;
            }
        }

        // Estiliza o botão de report e garante alinhamento ao lado
        const rep = document.querySelector('main a[href*="report"], main a.ic-flag-01');
        if (rep && !rep.dataset.bunkrStyled) {
            rep.dataset.bunkrStyled = "1";
            rep.className = "bunkr-album-report-btn";
            rep.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                    <line x1="4" y1="22" x2="4" y2="15"/>
                </svg>
                <span>Report</span>
            `;
            const rightCol = document.querySelector("main > div.flex:first-child > div:last-child");
            if (rightCol && rep.parentNode !== rightCol) {
                rightCol.appendChild(rep);
            }
        }
    }

    function getFileInfo(itemOrName) {
        let name = "";
        if (typeof itemOrName === "string") name = itemOrName;
        else if (itemOrName) {
            name = itemOrName.dataset?.origTitle || itemOrName.title || itemOrName.querySelector?.(".theName")?.textContent || "";
        }
        const clean = cleanHtmlText(name).trim();
        const m = clean.match(/\.([a-zA-Z0-9]{2,5})(?:\?|#|$)/);
        const ext = m ? m[1].toLowerCase() : "";

        let category = "other";
        if (["mp4", "mkv", "mov", "webm", "avi", "flv", "m4v", "wmv", "ts"].includes(ext)) category = "video";
        else if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "avif", "heic"].includes(ext)) category = "image";
        else if (["txt", "md", "nfo", "log", "json", "csv"].includes(ext)) category = "text";
        else if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(ext)) category = "archive";
        else if (["mp3", "wav", "flac", "m4a", "ogg", "aac", "opus"].includes(ext)) category = "audio";
        else if (["pdf", "doc", "docx", "epub"].includes(ext)) category = "doc";

        // Fallback pelas classes nativas do Bunkr se não tiver extensão explícita
        if (category === "other" && itemOrName && itemOrName.querySelector) {
            if (itemOrName.querySelector(".type-Video, span[class*='type-Video']")) category = "video";
            else if (itemOrName.querySelector(".type-Image, span[class*='type-Image']")) category = "image";
            else if (itemOrName.querySelector(".type-Audio, span[class*='type-Audio']")) category = "audio";
        }

        return { name: clean, ext, category };
    }

    const txtPreviewCache = new Map();
    // Preview de .txt nos cards: só quando o card fica visível, 2 por vez, 2 KB por arquivo.
    const TXT_PREVIEW_BYTES = 2048;
    const txtPreviewQueue = [];
    let txtPreviewBusy = 0;
    let txtPreviewIO = null;
    function pumpTxtPreviews() {
        while (txtPreviewBusy < 2 && txtPreviewQueue.length) {
            const job = txtPreviewQueue.shift();
            if (!job.body.isConnected) continue;
            txtPreviewBusy++;
            loadCardTextPreview(job.link, job.body).finally(() => { txtPreviewBusy--; pumpTxtPreviews(); });
        }
    }
    function queueCardTextPreview(link, body) {
        if (!link || txtPreviewCache.has(link) || !("IntersectionObserver" in window)) { loadCardTextPreview(link, body); return; }
        if (!txtPreviewIO) {
            txtPreviewIO = new IntersectionObserver(entries => {
                for (const e of entries) {
                    if (!e.isIntersecting) continue;
                    txtPreviewIO.unobserve(e.target);
                    txtPreviewQueue.push({ link: e.target._bunkrTxtLink, body: e.target });
                }
                pumpTxtPreviews();
            }, { rootMargin: "200px" });
        }
        body._bunkrTxtLink = link;
        txtPreviewIO.observe(body);
    }

    async function loadCardTextPreview(link, bodyEl) {
        if (!link) {
            bodyEl.textContent = "Arquivo de texto. Clique para visualizar.";
            return;
        }
        if (txtPreviewCache.has(link)) {
            bodyEl.textContent = txtPreviewCache.get(link);
            return;
        }
        try {
            const html = await httpGet(link);
            const m = html.match(/href="([^"]*(?:storage\/media|\/d\/|get-download|media-files)[^"]*)"/i) ||
                      html.match(/href="([^"]*\.txt(?:\?[^"]*)?)"/i);
            let text = "";
            if (m && m[1]) {
                let dlUrl = m[1];
                if (dlUrl.startsWith("/")) dlUrl = location.origin + dlUrl;
                try {
                    const M2 = /href="([^"]*(?:storage\/media|media-files|\.txt)[^"]*)"/i;
                    let fileData = await httpGet(dlUrl, TXT_PREVIEW_BYTES);
                    if (/^\s*<!DOCTYPE|^\s*<html/i.test(fileData)) {
                        // Página intermediária: o recorte pode ter cortado o link, então busca inteira.
                        if (!M2.test(fileData)) fileData = await httpGet(dlUrl);
                        const m2 = fileData.match(M2);
                        if (m2 && m2[1]) {
                            let dlUrl2 = m2[1];
                            if (dlUrl2.startsWith("/")) dlUrl2 = location.origin + dlUrl2;
                            fileData = await httpGet(dlUrl2, TXT_PREVIEW_BYTES);
                        }
                    }
                    if (!/^\s*<!DOCTYPE|^\s*<html/i.test(fileData)) {
                        text = fileData;
                    }
                } catch {}
            }
            if (!text) {
                const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
                if (preMatch && preMatch[1]) {
                    text = cleanHtmlText(preMatch[1]);
                }
            }
            if (text) {
                const preview = text.trim().slice(0, 1200);
                txtPreviewCache.set(link, preview);
                bodyEl.textContent = preview;
            } else {
                bodyEl.textContent = "Arquivo de texto. Clique para abrir e visualizar o conteúdo completo.";
            }
        } catch {
            bodyEl.textContent = "Arquivo de texto. Clique para visualizar.";
        }
    }

    function applyCardThumbnailAndPreview(item, thumbBox, fileInfo) {
        const isTxt = ["txt", "md", "nfo", "log"].includes(fileInfo.ext);
        const img = thumbBox.querySelector(".grid-images_box-img");

        // 1. Arquivos de texto (.txt, etc.): renderiza preview do conteúdo
        if (isTxt) {
            if (img) img.style.display = "none";
            thumbBox.classList.add("has-placeholder");
            if (!thumbBox.querySelector(".bunkr-txt-preview")) {
                const prev = el("div", { class: "bunkr-txt-preview" });
                const head = el("div", { class: "bunkr-txt-head" },
                    el("span", { class: "bunkr-txt-head-tag" }, fileInfo.ext.toUpperCase()),
                    el("span", { class: "bunkr-txt-head-title" }, fileInfo.name)
                );
                const body = el("pre", { class: "bunkr-txt-body" }, "Carregando conteúdo…");
                const fade = el("div", { class: "bunkr-txt-fade" });
                prev.append(head, body, fade);
                thumbBox.appendChild(prev);

                const link = item.querySelector("a[href]")?.getAttribute("href") || "";
                queueCardTextPreview(link, body);
            }
            return;
        }

        // 2. Imagens com erro de carregamento ou arquivos sem thumbnail válida (.zip, .rar, etc.)
        const isArchive = ["zip", "rar", "7z", "tar", "gz"].includes(fileInfo.ext);
        const isAudio = ["mp3", "wav", "flac", "m4a", "ogg"].includes(fileInfo.ext);
        const isDoc = ["pdf", "doc", "docx", "xls", "xlsx"].includes(fileInfo.ext);
        const isKnownNonMedia = isArchive || isAudio || isDoc;

        const renderPlaceholder = () => {
            if (img) img.style.display = "none";
            thumbBox.classList.add("has-placeholder");
            if (thumbBox.querySelector(".bunkr-thumb-placeholder")) return;

            let iconSvg = PL_ICONS.file;
            let badgeText = fileInfo.ext ? fileInfo.ext.toUpperCase() : "FILE";
            if (fileInfo.category === "video") { iconSvg = PL_ICONS.video; badgeText = "VÍDEO"; }
            else if (fileInfo.category === "image") { iconSvg = PL_ICONS.image; badgeText = "IMAGEM"; }
            else if (isArchive) { iconSvg = PL_ICONS.archive; badgeText = fileInfo.ext.toUpperCase(); }
            else if (isAudio) { iconSvg = PL_ICONS.audio; badgeText = fileInfo.ext.toUpperCase(); }
            else if (isDoc) { iconSvg = PL_ICONS.doc; badgeText = fileInfo.ext.toUpperCase(); }

            const ph = el("div", { class: "bunkr-thumb-placeholder" });
            const iconWrap = el("div", { class: "bunkr-ph-icon" });
            iconWrap.innerHTML = iconSvg;
            const badge = el("span", { class: "bunkr-ph-badge" }, badgeText);
            ph.append(iconWrap, badge);
            thumbBox.appendChild(ph);
        };

        if (isKnownNonMedia) {
            renderPlaceholder();
        } else if (img) {
            if (img.complete && img.naturalWidth === 0) {
                renderPlaceholder();
            } else {
                img.addEventListener("error", renderPlaceholder, { once: true });
            }
        }
    }

    function enhanceCards() {
        if (isEnhancingCards) return;
        isEnhancingCards = true;
        try {
            const items = document.querySelectorAll(".theItem");
            items.forEach(item => {
                // Garante que o link não abre em nova aba
                const a = item.querySelector("a[href]");
                if (a && a.target !== "_self") {
                    a.removeAttribute("target");
                    a.target = "_self";
                }

                // Preserva e limpa título original do arquivo
                const theName = item.querySelector(".theName");
                if (!item.dataset.origTitle) {
                    const raw = theName ? (theName.textContent || theName.innerText || "") : (item.title || "");
                    const cleaned = cleanHtmlText(raw).trim();
                    if (cleaned) item.dataset.origTitle = cleaned;
                }
                const cleanRaw = item.dataset.origTitle || "";
                if (!cleanRaw) return;

                // Identifica data no nome do arquivo
                const titleDate = extractDateFromTitle(cleanRaw);

                // Título limpo sem o prefixo/ocorrência de data
                const displayTitle = cleanTitleWithoutDate(cleanRaw, titleDate, true);

                if (theName && theName.textContent !== displayTitle) {
                    theName.textContent = displayTitle;
                    theName.title = cleanRaw;
                }
                if (item.title !== cleanRaw) {
                    item.title = cleanRaw;
                }

                const fileInfo = getFileInfo(item);

                // Injeta badge de tamanho no canto inferior direito da thumbnail se ainda não tiver
                const thumbBox = item.querySelector(".grid-images_box-txt");
                if (thumbBox && !thumbBox.querySelector(".theItem-size-badge")) {
                    const sizeEl = item.querySelector(".theSize");
                    const txt = sizeEl ? sizeEl.textContent.trim() : "";
                    if (txt) {
                        const badge = el("span", { class: "theItem-size-badge" }, txt);
                        thumbBox.appendChild(badge);
                    }
                }

                // Aplica guard de thumbnail: preview para .txt ou placeholder para thumbs quebradas
                if (thumbBox) {
                    applyCardThumbnailAndPreview(item, thumbBox, fileInfo);
                }

                // Remove badge antiga roxa com ícone caso ainda exista
                const oldBadges = item.querySelectorAll(".theItem-title-date-badge");
                if (oldBadges.length) oldBadges.forEach(b => b.remove());

                // Datas em texto simples: Data de envio e Data extraída (sem badges, sem ícones)
                const rawUploadTs = item.querySelector(".theDate")?.textContent || "";
                const upFmt = formatUploadDate(rawUploadTs);
                const titleDateDisplay = (titleDate && titleDate.displayDate) || "";
                const dateKey = `${upFmt}|${titleDateDisplay}`;

                let datesBox = item.querySelector(".theItem-dates");
                if (datesBox && datesBox.dataset.renderedKey === dateKey) {
                    return; // Já renderizado e idêntico, zero mutações no DOM
                }

                if (!datesBox) {
                    datesBox = el("div", { class: "theItem-dates" });
                    const mt2 = item.querySelector("div.mt-2") || item;
                    mt2.appendChild(datesBox);
                }

                datesBox.dataset.renderedKey = dateKey;
                datesBox.textContent = "";
                if (upFmt) {
                    datesBox.append(el("div", { class: "theItem-date-row" },
                        el("span", { class: "theItem-date-lbl" }, "Data de envio:"),
                        el("span", { class: "theItem-date-val" }, upFmt)
                    ));
                }
                if (titleDateDisplay) {
                    const lbl = el("span", {
                        class: "theItem-date-lbl bunkr-has-tip",
                        title: "Data identificada e extraída do nome do arquivo (definida no upload)"
                    }, "Data extraída:");
                    lbl.appendChild(el("span", { class: "bunkr-tip-icon", title: "Data identificada e extraída do nome do arquivo (definida no upload)" }, "ⓘ"));
                    datesBox.append(el("div", { class: "theItem-date-row" },
                        lbl,
                        el("span", { class: "theItem-date-val" }, titleDateDisplay)
                    ));
                }
            });
        } finally {
            isEnhancingCards = false;
        }
    }

    let isGroupByType = safeGetStorage("bunkr_group_by_type") === "1";

    function groupGalleryByType(forceState) {
        if (typeof forceState === "boolean") isGroupByType = forceState;
        safeSetStorage("bunkr_group_by_type", isGroupByType ? "1" : "0");

        const btn = document.querySelector("#bunkrToggleGroup");
        if (btn) {
            btn.classList.toggle("is-active", isGroupByType);
            const label = btn.querySelector(".label");
            if (label) label.textContent = isGroupByType ? "Desagrupar" : "Agrupar por Tipo";
        }

        const grid = document.querySelector("#galleryGrid, .grid-images");
        if (!grid) return;

        grid.querySelectorAll(".bunkr-group-header").forEach(h => h.remove());

        if (!isGroupByType) {
            return;
        }

        const items = Array.from(grid.querySelectorAll(":scope > .theItem"));
        if (!items.length) return;

        const groups = {
            video: [],
            image: [],
            text: [],
            other: []
        };

        items.forEach(it => {
            const info = getFileInfo(it);
            if (info.category === "video") groups.video.push(it);
            else if (info.category === "image") groups.image.push(it);
            else if (info.category === "text") groups.text.push(it);
            else groups.other.push(it);
        });

        const groupDefs = [
            { key: "video", title: "Vídeos", icon: PL_ICONS.video, unit: "vídeos", list: groups.video },
            { key: "image", title: "Fotos", icon: PL_ICONS.image, unit: "fotos", list: groups.image },
            { key: "text", title: "Documentos & Textos", icon: PL_ICONS.doc, unit: "textos", list: groups.text },
            { key: "other", title: "Outros Arquivos", icon: PL_ICONS.archive, unit: "arquivos", list: groups.other },
        ];

        if (galleryObserver) galleryObserver.disconnect();

        groupDefs.forEach(g => {
            if (!g.list.length) return;
            const hdr = el("div", { class: "bunkr-group-header", "data-group": g.key });
            const left = el("div", { class: "bunkr-group-header-left" });
            const iconSpan = el("span", null);
            iconSpan.innerHTML = g.icon;
            const titleSpan = el("span", null, g.title);
            const countSpan = el("span", { class: "bunkr-group-count" }, `${g.list.length} ${g.list.length === 1 ? 'arquivo' : g.unit}`);
            left.append(iconSpan, titleSpan, countSpan);
            const line = el("div", { class: "bunkr-group-line" });
            hdr.append(left, line);

            grid.appendChild(hdr);
            g.list.forEach(it => grid.appendChild(it));
        });

        if (galleryObserver && grid) {
            galleryObserver.observe(grid, { childList: true, subtree: false });
        }
    }

    function updateGroupHeadersVisibility() {
        if (!isGroupByType) return;
        const grid = document.querySelector("#galleryGrid, .grid-images");
        if (!grid) return;
        const headers = grid.querySelectorAll(".bunkr-group-header");
        headers.forEach(hdr => {
            let count = 0;
            let next = hdr.nextElementSibling;
            while (next && !next.classList.contains("bunkr-group-header")) {
                if (next.classList.contains("theItem") && next.style.display !== "none") {
                    count++;
                }
                next = next.nextElementSibling;
            }
            hdr.style.display = count === 0 ? "none" : "";
            const countEl = hdr.querySelector(".bunkr-group-count");
            if (countEl && count > 0) {
                countEl.textContent = `${count} ${count === 1 ? 'arquivo' : 'arquivos'}`;
            }
        });
    }

    function sortGalleryByUploadDate(dir = "desc") {
        const grid = document.querySelector("#galleryGrid, .grid-images");
        if (!grid) return;
        const items = Array.from(grid.querySelectorAll(":scope > .theItem"));
        if (!items.length) return;
        items.sort((a, b) => {
            const dateA = a.querySelector(".theDate")?.textContent || "";
            const dateB = b.querySelector(".theDate")?.textContent || "";
            const tA = parseUploadTimestamp(dateA);
            const tB = parseUploadTimestamp(dateB);
            return dir === "desc" ? (tB - tA) : (tA - tB);
        });
        if (galleryObserver) galleryObserver.disconnect();
        items.forEach(it => grid.appendChild(it));
        enhanceCards();
        if (isGroupByType) groupGalleryByType(true);
        if (galleryObserver && grid) galleryObserver.observe(grid, { childList: true, subtree: false });
        if (window.albumFiles && Array.isArray(window.albumFiles)) {
            window.albumFiles.sort((a, b) => {
                const tA = parseUploadTimestamp(a.timestamp || a.date);
                const tB = parseUploadTimestamp(b.timestamp || b.date);
                return dir === "desc" ? (tB - tA) : (tA - tB);
            });
        }
    }

    function sortGalleryByTitleDate(dir = "desc") {
        const grid = document.querySelector("#galleryGrid, .grid-images");
        if (!grid) return;
        const items = Array.from(grid.querySelectorAll(":scope > .theItem"));
        if (!items.length) return;
        items.sort((a, b) => {
            const nameA = a.dataset.origTitle || a.title || a.querySelector(".theName")?.textContent || "";
            const nameB = b.dataset.origTitle || b.title || b.querySelector(".theName")?.textContent || "";
            const dtA = extractDateFromTitle(nameA);
            const dtB = extractDateFromTitle(nameB);
            const tA = dtA ? dtA.timestamp : (dir === "desc" ? -Infinity : Infinity);
            const tB = dtB ? dtB.timestamp : (dir === "desc" ? -Infinity : Infinity);
            return dir === "desc" ? (tB - tA) : (tA - tB);
        });
        if (galleryObserver) galleryObserver.disconnect();
        items.forEach(it => grid.appendChild(it));
        enhanceCards();
        if (isGroupByType) groupGalleryByType(true);
        if (galleryObserver && grid) galleryObserver.observe(grid, { childList: true, subtree: false });
        if (window.albumFiles && Array.isArray(window.albumFiles)) {
            window.albumFiles.sort((a, b) => {
                const nameA = (a.original || a.name || "").trim();
                const nameB = (b.original || b.name || "").trim();
                const dtA = extractDateFromTitle(nameA);
                const dtB = extractDateFromTitle(nameB);
                const tA = dtA ? dtA.timestamp : (dir === "desc" ? -Infinity : Infinity);
                const tB = dtB ? dtB.timestamp : (dir === "desc" ? -Infinity : Infinity);
                return dir === "desc" ? (tB - tA) : (tA - tB);
            });
        }
    }

    function sortGalleryByName(dir = "asc") {
        const grid = document.querySelector("#galleryGrid, .grid-images");
        if (!grid) return;
        const items = Array.from(grid.querySelectorAll(":scope > .theItem"));
        if (!items.length) return;
        items.sort((a, b) => {
            const rawA = a.dataset.origTitle || a.querySelector(".theName")?.textContent || a.title || "";
            const rawB = b.dataset.origTitle || b.querySelector(".theName")?.textContent || b.title || "";
            const dtA = extractDateFromTitle(rawA);
            const dtB = extractDateFromTitle(rawB);
            const nA = cleanTitleWithoutDate(rawA, dtA, true);
            const nB = cleanTitleWithoutDate(rawB, dtB, true);
            const res = nA.localeCompare(nB, undefined, { numeric: true, sensitivity: "base" });
            return dir === "desc" ? -res : res;
        });
        if (galleryObserver) galleryObserver.disconnect();
        items.forEach(it => grid.appendChild(it));
        enhanceCards();
        if (isGroupByType) groupGalleryByType(true);
        if (galleryObserver && grid) galleryObserver.observe(grid, { childList: true, subtree: false });
    }

    function setupModernGallery() {
        const grid = document.querySelector("#galleryGrid, .grid-images");
        if (!grid) return;
        document.documentElement.classList.remove("bunkr-file");
        document.documentElement.classList.add("bunkr-album");
        fixAlbumHeader();

        // Oculta blocos legados de toolbar, paginação e ordenação isolada
        const oldSortWrap = document.querySelector("main .flex.bg-soft.p-1.rounded-lg.items-center");
        if (oldSortWrap) oldSortWrap.style.display = "none";
        document.querySelectorAll(".floating-detailed-thumb, #floatingThumb, .album-toolbar, .album-adv, .advanced-notice").forEach(el => el.style.display = "none");

        // Monta a Actionbar Integrada se ainda não existir
        if (!document.querySelector(".bunkr-gallery-actionbar")) {
            const bar = el("div", { class: "bunkr-gallery-actionbar" });

            // 1. Busca
            const searchWrap = el("div", { class: "bunkr-actionbar-search", id: "bunkrSearchWrap" });
            searchWrap.innerHTML = `
                <svg class="bunkr-actionbar-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="7"/>
                    <path d="m21 21-4.3-4.3"/>
                </svg>
                <input type="text" id="bunkrGallerySearch" placeholder="Buscar nos arquivos… (atalho /)" autocomplete="off">
                <button type="button" class="bunkr-actionbar-search-clear" id="bunkrSearchClear" title="Limpar busca">&times;</button>
            `;

            // 2. Divisor
            const div1 = el("div", { class: "bunkr-actionbar-divider" });

            // 3. Chips de Ordenação estilo YouTube (rounded-full)
            const chipsWrap = el("div", { class: "bunkr-actionbar-chips" });
            chipsWrap.innerHTML = `
                <span class="bunkr-actionbar-label">Ordenar:</span>
                <button type="button" class="bunkr-chip is-active" data-sort="upload-date" id="bunkrChipUploadDate" title="Ordenar por data de envio">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>Data de Envio</span>
                    <span class="bunkr-sort-direction" id="bunkrUploadDateDir">⬇</span>
                </button>
                <button type="button" class="bunkr-chip" data-sort="title-date" id="bunkrChipTitleDate" title="Ordenar por data extraída do nome do arquivo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span>Data Extraída</span>
                    <span class="bunkr-sort-direction" id="bunkrTitleDateDir">⬇</span>
                </button>
                <button type="button" class="bunkr-chip" data-sort="name" id="bunkrChipName" title="Ordenar por nome alfabético">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="8" y2="18"/></svg>
                    <span>A-Z</span>
                </button>
                <button type="button" class="bunkr-chip" data-sort="size" id="bunkrChipSize" title="Ordenar por tamanho de arquivo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                    <span>Tamanho</span>
                </button>
            `;

            // 4. Divisor
            const div2 = el("div", { class: "bunkr-actionbar-divider" });

            // 5. Ações Rápidas & Contador
            const actionsWrap = el("div", { class: "bunkr-actionbar-actions" });
            actionsWrap.innerHTML = `
                <button type="button" class="bunkr-act-btn${isGroupByType ? ' is-active' : ''}" id="bunkrToggleGroup" title="Agrupar arquivos por tipo (Vídeos, Fotos, Textos, Outros)">
                    ${PL_ICONS.group}
                    <span class="label">${isGroupByType ? 'Desagrupar' : 'Agrupar por Tipo'}</span>
                </button>
                <button type="button" class="bunkr-act-btn" id="bunkrToggleNames" title="Alternar nome completo/truncado">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
                    <span class="label">Nomes Completos</span>
                </button>
                <button type="button" class="bunkr-act-btn" id="bunkrCopyNames" title="Copiar nomes dos arquivos visíveis">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    <span class="label">Copiar Nomes</span>
                </button>
                <button type="button" class="bunkr-act-btn" id="bunkrCopyUrls" title="Copiar URLs diretas dos arquivos">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    <span class="label">Copiar URLs</span>
                </button>
                <span class="bunkr-actionbar-count" id="bunkrGalleryCount"></span>
            `;

            bar.append(searchWrap, div1, chipsWrap, div2, actionsWrap);
            grid.parentNode.insertBefore(bar, grid);

            const searchInp = bar.querySelector("#bunkrGallerySearch");
            const searchClear = bar.querySelector("#bunkrSearchClear");
            const countEl = bar.querySelector("#bunkrGalleryCount");

            // Atalho "/" para focar busca
            document.addEventListener("keydown", e => {
                if (e.key === "/" && document.activeElement !== searchInp && !e.target.matches("input, textarea")) {
                    e.preventDefault();
                    searchInp.focus();
                }
            });

            // Sincroniza busca com #advFilterInput nativo do Bunkr
            const syncSearch = () => {
                const val = searchInp.value.trim();
                searchWrap.classList.toggle("has-text", !!val);
                const nativeInp = document.querySelector("#advFilterInput");
                if (nativeInp) {
                    nativeInp.value = val;
                    nativeInp.dispatchEvent(new Event("input", { bubbles: true }));
                }
                setTimeout(() => {
                    enhanceCards();
                    updateCount();
                }, 150);
            };
            searchInp.addEventListener("input", syncSearch);
            searchClear.addEventListener("click", () => {
                searchInp.value = "";
                syncSearch();
                searchInp.focus();
            });

            // Preenche busca se já houver parâmetro ?q=
            const q = getQ();
            if (q) {
                searchInp.value = q;
                searchWrap.classList.add("has-text");
            }

            // Sincroniza chips de ordenação
            let uploadDateDir = "desc";
            let titleDateSortDir = "desc";
            const chips = bar.querySelectorAll(".bunkr-chip");
            chips.forEach(chip => {
                chip.addEventListener("click", () => {
                    const st = chip.dataset.sort;
                    if (st === "upload-date") {
                        if (chip.classList.contains("is-active")) {
                            uploadDateDir = uploadDateDir === "desc" ? "asc" : "desc";
                        }
                        const dirEl = chip.querySelector("#bunkrUploadDateDir");
                        if (dirEl) dirEl.textContent = uploadDateDir === "desc" ? "⬇" : "⬆";
                        chips.forEach(c => c.classList.remove("is-active"));
                        chip.classList.add("is-active");
                        sortGalleryByUploadDate(uploadDateDir);
                        return;
                    }

                    if (st === "title-date") {
                        if (chip.classList.contains("is-active")) {
                            titleDateSortDir = titleDateSortDir === "desc" ? "asc" : "desc";
                        }
                        const dirEl = chip.querySelector("#bunkrTitleDateDir");
                        if (dirEl) dirEl.textContent = titleDateSortDir === "desc" ? "⬇" : "⬆";
                        chips.forEach(c => c.classList.remove("is-active"));
                        chip.classList.add("is-active");
                        sortGalleryByTitleDate(titleDateSortDir);
                        return;
                    }

                    chips.forEach(c => c.classList.remove("is-active"));
                    chip.classList.add("is-active");
                    if (st === "name") {
                        sortGalleryByName("asc");
                        document.querySelector(".btnName")?.click();
                    } else if (st === "size") {
                        document.querySelector(".btnSize")?.click();
                    }
                    setTimeout(() => {
                        enhanceCards();
                        if (isGroupByType) groupGalleryByType(true);
                        updateCount();
                    }, 200);
                });
            });

            // Sincroniza toggle de agrupamento por tipo
            const btnGroupToggle = bar.querySelector("#bunkrToggleGroup");
            btnGroupToggle.addEventListener("click", () => {
                groupGalleryByType(!isGroupByType);
                updateCount();
            });

            // Sincroniza toggle de nomes completos
            const btnNamesToggle = bar.querySelector("#bunkrToggleNames");
            btnNamesToggle.addEventListener("click", () => {
                document.querySelector("#advToggleNames")?.click();
                grid.classList.toggle("full-filename");
                const active = grid.classList.contains("full-filename");
                btnNamesToggle.classList.toggle("is-active", active);
                btnNamesToggle.querySelector(".label").textContent = active ? "Nomes Truncados" : "Nomes Completos";
            });

            // Sincroniza botões de cópia
            bar.querySelector("#bunkrCopyNames").addEventListener("click", () => {
                document.querySelector("#advCopyNames")?.click();
                toast("Nomes copiados!");
            });
            bar.querySelector("#bunkrCopyUrls").addEventListener("click", () => {
                document.querySelector("#advCopyURLs")?.click();
                toast("URLs copiadas!");
            });

            // Contador de arquivos
            const updateCount = () => {
                killOldCounter();
                const totalFiles = (window.albumFiles && window.albumFiles.length) || document.querySelectorAll(".theItem").length;
                const counter = document.getElementById("resultsCounter");
                if (counter && counter.textContent) {
                    countEl.textContent = cleanHtmlText(counter.textContent).replace(/Showing\s*all/i, "Total:").replace(/files/i, "arquivos");
                } else {
                    const visible = document.querySelectorAll('.theItem:not([style*="display: none"])').length;
                    countEl.textContent = visible === totalFiles ? `Total: ${totalFiles} arquivos` : `${visible} de ${totalFiles} arquivos`;
                }
                if (isGroupByType) updateGroupHeadersVisibility();
            };
            updateCount();
            albumCountUpdate = updateCount;
            // Contagem por evento (filtro/ordem/grupo/novos cards e o contador nativo),
            // em vez de um setInterval de 1 s que forçava layout para sempre.
            const counterEl = document.getElementById("resultsCounter");
            if (counterEl && !counterEl.dataset.bunkrCountObs) {
                counterEl.dataset.bunkrCountObs = "1";
                let queued = false;
                new MutationObserver(() => {
                    if (queued) return;
                    queued = true;
                    requestAnimationFrame(() => { queued = false; if (albumCountUpdate) albumCountUpdate(); });
                }).observe(counterEl, { childList: true, characterData: true, subtree: true });
            }
        }

        // Executa enhance inicial nos cards existentes
        enhanceCards();
        if (isGroupByType) {
            groupGalleryByType(true);
        }

        // Observa novos cards carregados via infinite scroll (apenas adições diretas de nós .theItem no grid, sem subtree para evitar qualquer loop)
        if (!galleryObserver) {
            galleryObserver = new MutationObserver(mutations => {
                let hasNewCards = false;
                for (const m of mutations) {
                    if (m.addedNodes && m.addedNodes.length) {
                        for (const node of m.addedNodes) {
                            if (node.nodeType === 1 && (node.classList?.contains("theItem") || node.querySelector?.(".theItem"))) {
                                hasNewCards = true;
                                break;
                            }
                        }
                    }
                    if (hasNewCards) break;
                }
                if (hasNewCards) {
                    enhanceCards();
                    if (albumCountUpdate) albumCountUpdate();
                }
            });
            galleryObserver.observe(grid, { childList: true, subtree: false });
        }
    }

    // Interceptor global: NENHUM link de card deve abrir em nova aba
    document.addEventListener("click", e => {
        const a = e.target.closest && e.target.closest(".theItem a[href]");
        if (a) {
            a.removeAttribute("target");
            a.target = "_self";
        }
    }, true);

    function checkPageType() {
        if (/\/a\//.test(location.pathname)) {
            document.documentElement.classList.remove("bunkr-file", "bunkr-home");
            document.documentElement.classList.add("bunkr-album");
        } else if (location.pathname === "/" || location.pathname === "") {
            document.documentElement.classList.remove("bunkr-file", "bunkr-album");
            document.documentElement.classList.add("bunkr-home");
        } else {
            document.documentElement.classList.remove("bunkr-album", "bunkr-home");
            document.documentElement.classList.add("bunkr-file");
        }
    }

    const isFile = () => !/\/a\//.test(location.pathname) && location.pathname !== "/" && location.pathname !== "";
    function apply() {
        checkPageType();
        simplifyHeader(); killBanner();   // header/busca valem pro ÁLBUM; na página de arquivo o stage cobre por cima
        if (!isFile()) setupModernGallery();
    }
    onReady(() => {
        if (!isFile() && openSingleItemAlbum()) return;
        checkPageType();
        apply(); setTimeout(apply, 700); initFilter();
        if (!isFile()) {
            setupModernGallery();
            setTimeout(setupModernGallery, 600);
            setTimeout(setupModernGallery, 1500);
        }
        if (isFile()) {   // página de arquivo: monta o STAGE (vrow + mídia fixa + strip do álbum) e a mídia assim que o src/img aparecer
            let n = 0, done = false, id = null;
            const stop = () => { done = true; if (id) clearInterval(id); };
            const tick = () => {
                const stage = buildStage();
                if (stage) {
                    if (stage.classList.contains("is-video")) mountOwnPlayer();
                    else if (stage.classList.contains("is-text")) mountTextViewer();
                    else mountPhotoZoom();
                    if (stage._sidebarList) renderRelatedToPlaylist(stage._sidebarList, stage._sbCount);   // mantém o fallback fresco até o álbum baixar (renderPlaylist assume quando playlistFull)
                    testMirror();
                }
                const noProbe = !document.querySelector("#video-container, #video-wrapper") || (stage && stage.classList.contains("is-text"));   // imagem/não-vídeo/texto → não há probe de mirror (probed nunca vira true)
                if (mediaMounted && (probed || noProbe)) stop();
                else if (++n > 30) {   // ~12s de segurança
                    stop();
                    if (!mediaMounted) { document.documentElement.classList.add("bunkr-fallback"); const st = document.querySelector(".bunkr-stage"); if (st) st.remove(); document.documentElement.classList.remove("bunkr-has-stage"); }
                }
            };
            tick();   // JÁ no DOMContentLoaded (não espera o 1º intervalo de 400ms) → o stage cobre o placeholder ASAP, sem flash da interface antiga
            if (!done) id = setInterval(tick, 400);
        }
    });
})();
