    /* ===================== PROCESSAMENTO DE CARDS ===================== */
    const SIZE_RE = /\b\d+(?:\.\d+)?\s?(?:B|KB|MB|GB|TB)\b/i;

    function resolveDirectGofileUrl(d) {
        if (!d) return "";
        if (d.directUrl) return d.directUrl;
        const name = d.name;
        const thumb = d.thumb;
        if (thumb && name) {
            const m = thumb.match(/^(https?:\/\/[^\/]+\/download\/web\/[^\/]+\/)/i);
            if (m) {
                const url = m[1] + encodeURIComponent(name);
                d.directUrl = url;
                return url;
            }
        }
        return "";
    }

    // "dd/mm/aaaa hh:mm" (compactPtDate) em ms; 0 quando não há data.
    function ptDateTs(text) {
        const m = String(text || "").match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
        return m ? new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0)).getTime() : 0;
    }
    function sizeBytes(text) {
        const m = String(text || "").match(/(\d+(?:\.\d+)?)\s?(B|KB|MB|GB|TB)\b/i);
        return m ? parseFloat(m[1]) * Math.pow(1024, ["B", "KB", "MB", "GB", "TB"].indexOf(m[2].toUpperCase())) : 0;
    }
    let cardSeq = 0;   // ordem em que o gofile entregou os cards (ficha "Padrão" e desagrupar)

    function extractGofileItemData(it) {
        let cleanName = "";
        const nameP = it.querySelector('[data-action="open-file"] p.truncate, [data-action="open-file"] p, p.truncate');
        if (nameP) {
            cleanName = (nameP.textContent || "").trim();
        }
        if (!cleanName) {
            const titleAttrEl = it.querySelector("[title]");
            if (titleAttrEl && titleAttrEl.getAttribute("title")) {
                const t = titleAttrEl.getAttribute("title").trim();
                if (/\.[a-zA-Z0-9]{2,5}$/i.test(t)) cleanName = t;
            }
        }
        if (!cleanName) {
            const leaves = it.querySelectorAll("p, span, a");
            for (const el of leaves) {
                if (el.children.length === 0) {
                    const txt = (el.textContent || "").trim();
                    if (/\.[a-zA-Z0-9]{2,5}$/i.test(txt) && !SIZE_RE.test(txt)) {
                        cleanName = txt;
                        break;
                    }
                }
            }
        }
        if (!cleanName) {
            const nameEl = it.querySelector("a.item_open, .item-name, [data-action='open-file']");
            const raw = nameEl ? (nameEl.textContent || "").trim() : "";
            cleanName = raw.replace(/\s*\d+(?:\.\d+)?\s*(?:B|KB|MB|GB|TB).*$/i, "").trim();
        }

        let uploadDate = "";
        const calEl = it.querySelector('[data-lucide="calendar"], .lucide-calendar');
        if (calEl) {
            const calWrap = calEl.closest("span, p, div");
            if (calWrap) uploadDate = (calWrap.textContent || "").trim();
        }
        if (!uploadDate) {
            const dateCandidates = Array.from(it.querySelectorAll("span, p"))
                .filter(e => e.children.length === 0)
                .map(e => (e.textContent || "").trim());
            uploadDate = dateCandidates.find(t => /\b\d{1,2}\s+de\s+[a-z]{3}\.|\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/i.test(t)) || "";
        }
        uploadDate = compactPtDate(uploadDate);

        let sizeText = "";
        const sizeCandidates = Array.from(it.querySelectorAll("span, p"))
            .filter(e => e.children.length === 0)
            .map(e => (e.textContent || "").trim());
        sizeText = sizeCandidates.find(t => SIZE_RE.test(t) && t !== cleanName) || "";

        const extractedDate = extractDateFromTitle(cleanName);
        const displayTitle = cleanTitleWithoutDate(cleanName, extractedDate);

        return {
            cleanName,
            displayTitle,
            sizeText,
            uploadDate,
            extractedDate
        };
    }

    function processItem(it) {
        if (it.dataset.gfDone) return;

        const data = extractGofileItemData(it);
        const name = data.cleanName;
        if (!name) return;

        it.dataset.gfDone = "1";
        it.dataset.gfOrigIdx = String(cardSeq++);
        it.classList.add("gf-card");

        const sizeText = data.sizeText;
        const img = Array.from(it.querySelectorAll("img")).find(candidate => isMediaImage(candidate, name));
        const thumbSrc = img ? mediaImageSource(img) : "";
        let isVid = /\.(mp4|m4v|mov|webm|mkv|avi|ts|flv|wmv|m4p)$/i.test(name) || !!it.querySelector('[data-lucide="file-video"], .lucide-file-video, .fa-video, .item_play');
        let isImg = /\.(jpe?g|png|gif|webp|avif|bmp|svg|tiff?)$/i.test(name) || !!it.querySelector('[data-lucide="file-image"], .lucide-file-image, .fa-image');
        const isTxt = /\.(txt|md|nfo|log|json|csv)$/i.test(name) || !!it.querySelector('[data-lucide="file-text"], .lucide-file-text');
        const isArchive = /\.(zip|rar|7z|tar|gz|bz2)$/i.test(name);
        const isAudio = /\.(mp3|wav|flac|m4a|ogg|aac|opus)$/i.test(name);

        if (!isVid && !isTxt && !isArchive && !isAudio && (isImg || thumbSrc)) {
            isImg = true;
        }

        let kind = "other";
        if (isVid) kind = "video";
        else if (isImg) kind = "image";
        else if (isTxt) kind = "text";
        else if (isArchive) kind = "archive";
        else if (isAudio) kind = "audio";

        const playable = isVid || isImg || isTxt;

        const openBtn = it.querySelector("[data-action='open-file'], a.item_open");
        const previewBtn = it.querySelector("[data-action='preview'], .item_play");
        const downloadBtn = it.querySelector("[data-action='download'], .item_download");
        const selectBtn = it.querySelector("[data-action='toggle-select'], .item_checkbox");

        it._gf = {
            name,
            displayTitle: data.displayTitle,
            size: sizeText,
            uploadDate: data.uploadDate,
            uploadTs: ptDateTs(data.uploadDate),
            sizeBytes: sizeBytes(sizeText),
            extractedDate: data.extractedDate,
            thumb: thumbSrc,
            kind,
            playable,
            openBtn,
            previewBtn,
            downloadBtn,
            selectBtn
        };
        resolveDirectGofileUrl(it._gf);

        // Constrói o DOM do Card
        const media = el("div", { class: "gf-media" });
        if (thumbSrc) {
            const mImg = el("img", { src: thumbSrc, alt: "", loading: "lazy" });
            mImg.onerror = () => {
                mImg.remove();
                if (!media.querySelector(".gf-media-ic")) {
                    const icWrap = el("span", { class: "gf-media-ic" });
                    icWrap.insertAdjacentHTML("beforeend", kindIcon(kind));
                    media.appendChild(icWrap);
                }
            };
            media.appendChild(mImg);
        } else {
            const icWrap = el("span", { class: "gf-media-ic" });
            icWrap.insertAdjacentHTML("beforeend", kindIcon(kind));
            media.appendChild(icWrap);
        }

        if (sizeText) {
            media.appendChild(el("span", { class: "gf-card-size-badge" }, sizeText));
        }

        if (isVid) {
            const playOv = el("div", { class: "gf-media-play" });
            const sp = el("span"); sp.insertAdjacentHTML("beforeend", IC.play);
            playOv.appendChild(sp);
            media.appendChild(playOv);
        }

        // Checkbox de multiselect
        const checkEl = el("div", { class: "gf-card-select" });
        checkEl.insertAdjacentHTML("beforeend", IC.check);
        checkEl.addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();
            toggleCardSelected(it);
        });

        // Informações e datas no corpo do card
        const body = el("div", { class: "gf-card-body" },
            el("div", { class: "gf-card-name", title: name }, data.displayTitle)
        );

        const datesBox = el("div", { class: "gf-card-dates" });
        if (data.uploadDate) {
            datesBox.append(el("div", { class: "gf-card-date-row" },
                el("span", { class: "gf-card-date-lbl" }, "Data de envio:"),
                el("span", null, data.uploadDate)
            ));
        }
        if (data.extractedDate && data.extractedDate.displayDate) {
            datesBox.append(el("div", { class: "gf-card-date-row" },
                el("span", { class: "gf-card-date-lbl", title: "Data identificada e extraída do nome do arquivo (definida no upload)" }, "Data extraída:"),
                el("span", null, data.extractedDate.displayDate),
                el("span", { class: "gf-tip-icon", title: "Data identificada e extraída do nome do arquivo (definida no upload)" }, "ⓘ")
            ));
        }
        if (datesBox.childNodes.length) body.appendChild(datesBox);

        it.append(media, checkEl, body);

        // Intercepta clique no card inteiro
        it.addEventListener("click", e => {
            if (firingNativeClick) return;
            if (e.target.closest(".gf-card-select")) return;
            e.preventDefault();
            e.stopPropagation();
            if (selectMode) toggleCardSelected(it);
            else if (playable) openStage(it);
            else if (openBtn) openBtn.click();
        }, true);
    }

    // Abertura automática de pasta com 1 arquivo: roda sempre que a lista assenta (o scan já
    // roda a cada mutação), independente da ordem em que os nós chegam. Só deixa de reabrir
    // depois que o usuário fechou o stage nesta rota.
    let autoDismissedRoute = null;
    let autoExpandTimer = null;
    const AUTO_EXPAND_SETTLE_MS = 350;

    function getSingleFileCard() {
        const previewSection = document.getElementById("fm-file-preview");
        const vid = previewSection ? previewSection.querySelector("video") : document.querySelector("#fm-root video, #page video");
        const img = previewSection ? previewSection.querySelector("img") : null;
        const fileSection = document.querySelector("#fm-root .max-w-3xl section.panel, #fm-root section.panel");
        if (!fileSection && !previewSection && !vid && !img) return null;

        const h1 = (fileSection && fileSection.querySelector("h1")) || document.querySelector("#header-title");
        const name = (h1 ? h1.textContent : document.title).replace(/\s*·\s*Gofile.*$/i, "").trim();
        if (!name) return null;

        const sizeText = Array.from(document.querySelectorAll("#fm-root p, #fm-root span"))
            .map(e => (e.textContent || "").trim())
            .find(t => SIZE_RE.test(t)) || "";

        const downloadBtn = document.querySelector("#fm-root button[data-action='download']");
        const previewBtn = document.querySelector("#fm-root button[data-action='preview']");
        const isVid = !!vid || /\.(mp4|m4v|mov|webm|mkv|avi|ts|flv)$/i.test(name);
        const isImg = !!img || /\.(jpe?g|png|gif|webp|avif|bmp|svg)$/i.test(name);
        const isTxt = /\.(txt|md|nfo|log|json|csv)$/i.test(name);
        let kind = "other";
        if (isVid) kind = "video";
        else if (isImg) kind = "image";
        else if (isTxt) kind = "text";

        const thumb = vid ? (vid.getAttribute("poster") || "") : (img ? (img.getAttribute("src") || img.src) : "");

        const card = fileSection || previewSection || document.getElementById("fm-root");
        card._gf = {
            name,
            size: sizeText,
            thumb,
            kind,
            playable: isVid || isImg || isTxt,
            downloadBtn,
            previewBtn,
            openBtn: previewBtn,
            nativeVid: vid,
            nativeImg: img,
            isSingleFile: true
        };

        if (fileSection && !fileSection.querySelector(".gf-open-stage-btn")) {
            const acts = fileSection.querySelector(".mt-5, [class*='gap-2']");
            if (acts) {
                const btn = el("button", {
                    type: "button",
                    class: "btn-primary gf-open-stage-btn w-full sm:w-auto",
                    style: "background:#f5c400!important; border-color:#f5c400!important; color:#1a1400!important; font-weight:700!important;"
                });
                btn.insertAdjacentHTML("beforeend", IC.play + " <span style='margin-left:6px'>Assistir no Player (Theater)</span>");
                btn.addEventListener("click", e => {
                    e.preventDefault();
                    e.stopPropagation();
                    openStage(card);
                });
                acts.prepend(btn);
            }
        }

        if (previewSection && !previewSection.dataset.gfClickBound) {
            previewSection.dataset.gfClickBound = "1";
            previewSection.addEventListener("click", e => {
                if (firingNativeClick) return;
                e.preventDefault();
                e.stopPropagation();
                openStage(card);
            });
        }

        return card;
    }

    // Linha que é arquivo de verdade (exclui pastas, linha-pai e cabeçalhos de coluna da lista).
    function isFileCard(c) {
        const d = c._gf;
        if (!d || !c.isConnected) return false;
        if (c.getAttribute("data-type") === "folder" || c.querySelector('[data-lucide="folder"], .lucide-folder, [data-lucide="folder-open"]')) return false;
        return d.kind !== "other" || /\.[a-z0-9]{2,5}$/i.test(d.name || "");
    }

    function findSingleItemTarget() {
        const files = Array.from(document.querySelectorAll(".gf-card")).filter(isFileCard);
        if (files.length === 1) return files[0];
        if (files.length > 1) return null;
        return getSingleFileCard();
    }

    // Assinatura da lista: o timer só recomeça quando ela muda (o boot também chama scan a cada 300 ms).
    let autoExpandSig = "";
    function fileListSig() {
        return Array.from(document.querySelectorAll(".gf-card")).filter(isFileCard).map(c => c._gf.name).join("\n") + "|" + routeKey(location.href);
    }
    function checkAutoExpandSingleItem() {
        if (autoDismissedRoute === routeKey(location.href)) return;
        if (stage && stage.classList.contains("open")) return;
        const sig = fileListSig();
        if (autoExpandTimer && sig === autoExpandSig) return;
        if (autoExpandTimer) clearTimeout(autoExpandTimer);
        autoExpandSig = sig;
        autoExpandTimer = setTimeout(() => {
            autoExpandTimer = null;
            if (autoDismissedRoute === routeKey(location.href)) return;
            if (stage && stage.classList.contains("open")) return;
            if (fileListSig() !== autoExpandSig) { checkAutoExpandSingleItem(); return; }
            const target = findSingleItemTarget();
            if (target && target._gf && target._gf.playable) openStage(target, { collapseSidebar: true });
        }, AUTO_EXPAND_SETTLE_MS);
    }

    function scan() {
        const rows = document.querySelectorAll(".fm-row:not([data-gf-done]), #filemanager_itemslist > [data-item-id]:not([data-gf-done]), [data-type='file']:not([data-gf-done]), [role='list'][aria-label*='Folder' i] > [data-id]:not([data-gf-done])");
        rows.forEach(processItem);
        injectFolderActions();
        checkAutoExpandSingleItem();
        arrangeGallery();
    }
