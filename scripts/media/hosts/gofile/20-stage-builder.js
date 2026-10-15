    /* ===================== STAGE BUILDER ===================== */
    let stage, stMid, stName, stSize, stDl, stIcon, stCur = null;
    let stSidebarList, stSbCount, stPlBtn, stTypeStat;
    let isSidebarCollapsed = localStorage.getItem("gf_sidebar_collapsed") === "1";
    let stTempCollapsed = false;   // recolhida só nesta abertura (pasta de 1 item); não persiste
    let plGroupFilter = "all"; // "all" | "video" | "image" | "text"
    let plSortMode = "default"; // "default" | "name"
    let plSearchQuery = "";

    const kindIcon = k => {
        if (k === "video") return IC.video;
        if (k === "image") return IC.image;
        if (k === "text") return IC.doc;
        if (k === "archive") return IC.archive;
        if (k === "audio") return IC.audio;
        return IC.file;
    };

    // Ganchos do gofile para o player do core: navegação no stage e download pelo botão nativo do item.
    const GF_PLAYER_HOOKS = {
        nav: dir => navStage(dir),
        download: src => {
            if (stCur && stCur._gf && stCur._gf.downloadBtn) stCur._gf.downloadBtn.click();
            else if (src) window.open(src, "_blank");
        },
    };

    function toggleSidebar(forceState) {
        if (!stage) return;
        stTempCollapsed = false;
        isSidebarCollapsed = typeof forceState === "boolean" ? forceState : !stage.classList.contains("is-sidebar-collapsed");
        stage.classList.toggle("is-sidebar-collapsed", isSidebarCollapsed);
        try { localStorage.setItem("gf_sidebar_collapsed", isSidebarCollapsed ? "1" : "0"); } catch {}
    }

    function buildStage() {
        if (stage) return;
        stage = el("div", { class: "gf-stage" + (isSidebarCollapsed ? " is-sidebar-collapsed" : "") });

        // Coluna Principal da Esquerda (Topbar + Mídia)
        const stageMain = el("div", { class: "gf-stage-main" });

        // Topbar
        const vrow = el("div", { class: "gf-vrow" });

        // Linha 1 (Desktop Esquerda, Mobile Linha 1): Logo + Nome
        const vrowTop = el("div", { class: "gf-vrow-top" });
        const topLogo = el("a", { class: "gf-top-logo", href: "https://gofile.io/", title: "Gofile" },
            el("img", { class: "gf-logo-img", src: "https://gofile.io/assets/img/logo-small-70.png", alt: "Gofile" }),
            el("span", null, "Gofile")
        );
        stIcon = el("span", { class: "gf-nameic" }); stIcon.insertAdjacentHTML("beforeend", IC.video);
        stName = el("span", null, "");
        const nameWrap = el("div", { class: "gf-name" }, stIcon, stName);
        vrowTop.append(topLogo, el("div", { class: "gf-vsep" }), nameWrap);

        // Linha 2 (Desktop Direita, Mobile Linha 2): Stats, Playlist e Ações
        const vrowSub = el("div", { class: "gf-vrow-sub" });
        const stats = el("div", { class: "gf-stats" });
        stSize = el("span", { class: "gf-stat" }, "");
        stTypeStat = el("span", { class: "gf-stat gf-stat-type" }, "Vídeo");
        stats.append(stSize, stTypeStat);

        stPlBtn = el("button", {
            class: "gf-item gf-vrow-playlist",
            type: "button",
            title: "Abrir playlist da pasta (p)",
            onClick: () => {
                const sb = document.querySelector(".gf-sidebar");
                if (window.innerWidth <= 768 && sb) {
                    sb.scrollIntoView({ behavior: "smooth" });
                } else {
                    toggleSidebar();
                }
            }
        });
        stPlBtn.insertAdjacentHTML("beforeend", IC.playlist);
        stPlBtn.append(el("span", null, "Playlist"));

        const close = vbtn(IC.close, "", { title: "Fechar (Esc)", onClick: closeStage });

        vrowSub.append(stats, el("div", { class: "gf-spacer" }), stPlBtn, el("div", { class: "gf-vsep" }), close);
        vrow.append(vrowTop, vrowSub);

        // Área Central de Mídia
        stMid = el("div", { class: "gf-stage-mid" });
        const navPrev = el("button", { class: "gf-nav-side gf-nav-prev", type: "button", title: "Anterior (Shift+P)", onClick: e => { e.stopPropagation(); navStage(-1); } }); navPrev.insertAdjacentHTML("beforeend", IC.chevL);
        const navNext = el("button", { class: "gf-nav-side gf-nav-next", type: "button", title: "Próximo (Shift+N)", onClick: e => { e.stopPropagation(); navStage(1); } }); navNext.insertAdjacentHTML("beforeend", IC.chevR);
        stMid.append(navPrev, navNext);

        stageMain.append(vrow, stMid);

        // Sidebar da Playlist
        const sidebar = el("aside", { class: "gf-sidebar" });
        const sbHeader = el("div", { class: "gf-sidebar-header" });
        stSbCount = el("span", null, "(0)");
        const sbTitle = el("div", { class: "gf-sidebar-title" }, el("span", null, "Arquivos da pasta"), stSbCount);
        const sbActions = el("div", { class: "gf-sidebar-actions" });
        const galleryBtn = el("button", { class: "gf-sidebar-btn", type: "button", title: "Abrir a galeria", onClick: closeStage }, "Galeria");
        const closeSb = el("button", { class: "gf-sidebar-btn gf-sidebar-close", type: "button", title: "Recolher sidebar (p)", onClick: () => toggleSidebar(true) }); closeSb.innerHTML = IC.close;
        sbActions.append(galleryBtn, closeSb);
        sbHeader.append(sbTitle, sbActions);

        // Barra de Busca na Sidebar
        const sbSearch = el("div", { class: "gf-sidebar-search" });
        const sbInput = el("input", { type: "text", class: "gf-sidebar-input", placeholder: "Filtrar na pasta…", autocomplete: "off", spellcheck: "false" });
        sbInput.addEventListener("input", () => {
            plSearchQuery = sbInput.value.trim().toLowerCase();
            renderPlaylist();
        });
        sbSearch.appendChild(sbInput);

        // Abas de Agrupamento por Tipo
        const sbTabs = el("div", { class: "gf-sidebar-filter-tabs" });
        const tabAll = el("button", { class: "gf-tab-chip is-active", type: "button", dataset: { group: "all" } }, "Todos");
        const tabVideos = el("button", { class: "gf-tab-chip", type: "button", dataset: { group: "video" } }, "Vídeos");
        const tabImages = el("button", { class: "gf-tab-chip", type: "button", dataset: { group: "image" } }, "Fotos");
        const tabTexts = el("button", { class: "gf-tab-chip", type: "button", dataset: { group: "text" }, style: "display:none;" }, "Textos");
        [tabAll, tabVideos, tabImages, tabTexts].forEach(tab => {
            tab.addEventListener("click", () => {
                sbTabs.querySelectorAll(".gf-tab-chip").forEach(t => t.classList.remove("is-active"));
                tab.classList.add("is-active");
                plGroupFilter = tab.dataset.group;
                renderPlaylist();
            });
            sbTabs.appendChild(tab);
        });

        // Barra de Ordenação na Sidebar
        const sbSortBar = el("div", { class: "gf-sidebar-sort-bar" },
            el("span", null, "ORDEM:"),
            el("button", { class: "gf-sort-chip is-active", type: "button", onClick: (e) => {
                sbSortBar.querySelectorAll(".gf-sort-chip").forEach(c => c.classList.remove("is-active"));
                e.target.classList.add("is-active");
                plSortMode = "default";
                renderPlaylist();
            }}, "Padrão"),
            el("button", { class: "gf-sort-chip", type: "button", onClick: (e) => {
                sbSortBar.querySelectorAll(".gf-sort-chip").forEach(c => c.classList.remove("is-active"));
                e.target.classList.add("is-active");
                plSortMode = "name";
                renderPlaylist();
            }}, "A-Z")
        );

        // Lista de Cards da Playlist
        stSidebarList = el("div", { class: "gf-playlist-list" });

        sidebar.append(sbHeader, sbSearch, sbTabs, sbSortBar, stSidebarList);

        stage.append(stageMain, sidebar);
        (document.body || document.documentElement).appendChild(stage);

        document.addEventListener("keydown", e => {
            if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable)) return;
            if (e.key === "Escape" && stage.classList.contains("open")) closeStage();
            else if (e.shiftKey && (e.key === "P" || e.key === "p") && stage.classList.contains("open")) {
                e.preventDefault();
                navStage(-1);
            } else if (e.shiftKey && (e.key === "N" || e.key === "n") && stage.classList.contains("open")) {
                e.preventDefault();
                navStage(1);
            } else if ((e.key === "p" || e.key === "P") && stage.classList.contains("open")) {
                e.preventDefault();
                toggleSidebar();
            }
        });
    }

    function playableCards() {
        return Array.from(document.querySelectorAll(".gf-card")).filter(c => c._gf && c._gf.playable && !c.classList.contains("gf-filtered"));
    }

    function makePlaylistThumbPlaceholder(kind, ext) {
        const ph = el("div", { class: "gf-playlist-thumb-placeholder" });
        let ic = IC.image;
        if (kind === "video") ic = IC.video;
        else if (kind === "text") ic = IC.doc;
        else if (kind === "archive") ic = IC.archive;
        else if (kind === "audio") ic = IC.audio;
        else if (kind === "other") ic = IC.file;

        const iconSpan = el("span", { class: "gf-playlist-ph-icon" });
        iconSpan.innerHTML = ic;
        const badge = el("span", { class: "gf-playlist-ph-ext" }, (ext || kind || "FILE").toUpperCase().slice(0, 5));
        ph.append(iconSpan, badge);
        return ph;
    }

    function playlistCard(card, idx) {
        const d = card._gf || {};
        const isCurrent = card === stCur;
        const extMatch = (d.name || "").match(/\.([a-zA-Z0-9]{2,5})(?:\?|#|$)/);
        const ext = extMatch ? extMatch[1].toLowerCase() : "";

        const itemEl = el("div", {
            class: "gf-playlist-item" + (isCurrent ? " is-current" : ""),
            title: d.name
        });

        const thumbWrap = el("div", { class: "gf-playlist-thumb-wrap" });
        const isMedia = (d.kind === "video" || d.kind === "image") && !!d.thumb;
        if (isMedia) {
            const img = el("img", { class: "gf-playlist-thumb", src: d.thumb, alt: "", loading: "lazy" });
            img.onerror = () => {
                img.remove();
                if (!thumbWrap.querySelector(".gf-playlist-thumb-placeholder")) {
                    thumbWrap.prepend(makePlaylistThumbPlaceholder(d.kind, ext));
                }
            };
            thumbWrap.appendChild(img);
        } else {
            thumbWrap.appendChild(makePlaylistThumbPlaceholder(d.kind, ext));
        }

        const kindLabel = d.kind === "video" ? "Video" : d.kind === "image" ? "Imagem" : d.kind === "audio" ? "Audio" : "Arquivo";
        thumbWrap.appendChild(el("span", { class: "gf-playlist-kind" }, kindLabel));
        if (typeof idx === "number") thumbWrap.appendChild(el("span", { class: "gf-playlist-num" }, String(idx + 1)));
        if (d.kind === "video") {
            const durUrl = resolveDirectGofileUrl(d);
            const durKey = d.directUrl || d.name || "";
            const known = gfCachedDur(durKey);
            const durEl = el("span", { class: "gf-playlist-dur" }, known || "");
            durEl.dataset.durKey = durKey;
            durEl.hidden = !known;
            thumbWrap.appendChild(durEl);
            gfProbeDur(durKey, durUrl, thumbWrap);
        }

        const info = el("div", { class: "gf-playlist-info" });
        info.append(el("span", { class: "gf-playlist-name" }, d.displayTitle || d.name));

        const datesBox = el("div", { class: "gf-playlist-dates" });
        if (d.uploadDate) {
            datesBox.append(el("div", { class: "gf-playlist-date-row", title: "Data de envio" },
                el("span", { class: "gf-playlist-date-val" }, d.uploadDate)
            ));
        }
        if (d.extractedDate && d.extractedDate.displayDate) {
            datesBox.append(el("div", { class: "gf-playlist-date-row", title: "Data extraída do nome do arquivo" },
                el("span", { class: "gf-playlist-date-val" }, d.extractedDate.displayDate)
            ));
        }
        if (datesBox.childNodes.length) info.append(datesBox);

        if (isCurrent) {
            const meta = el("div", { class: "gf-playlist-meta" });
            meta.append(el("span", { class: "gf-playlist-meta-active" }, d.kind === "video" ? "Reproduzindo agora" : "Visualizando agora"));
            info.append(meta);
        }

        itemEl.append(thumbWrap, info);
        itemEl.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); loadStageItem(card); });
        itemEl._card = card;
        return itemEl;
    }

    function renderPlaylist() {
        if (!stSidebarList) return;
        const allCards = playableCards();
        stSidebarList.textContent = "";

        const numVideos = allCards.filter(c => c._gf && c._gf.kind === "video").length;
        const numImages = allCards.filter(c => c._gf && c._gf.kind === "image").length;
        const numTexts = allCards.filter(c => c._gf && c._gf.kind === "text").length;

        // Atualiza contadores nas abas
        const tabs = stage.querySelectorAll(".gf-tab-chip");
        tabs.forEach(t => {
            const grp = t.dataset.group;
            if (grp === "all") t.textContent = `Todos (${allCards.length})`;
            else if (grp === "video") t.textContent = `Vídeos (${numVideos})`;
            else if (grp === "image") t.textContent = `Fotos (${numImages})`;
            else if (grp === "text") {
                t.textContent = `Textos (${numTexts})`;
                t.style.display = numTexts ? "inline-flex" : "none";
            }
        });

        if (stSbCount) stSbCount.textContent = `(${allCards.length})`;

        // Filtra por busca e por aba
        let filtered = allCards.filter(c => {
            const d = c._gf || {};
            if (plSearchQuery && (d.name || "").toLowerCase().indexOf(plSearchQuery) === -1) return false;
            if (plGroupFilter !== "all" && d.kind !== plGroupFilter) return false;
            return true;
        });

        // Ordenação
        if (plSortMode === "name") {
            filtered = filtered.slice().sort((a, b) => (a._gf?.name || "").localeCompare(b._gf?.name || "", undefined, { numeric: true, sensitivity: "base" }));
        }

        stage.classList.toggle("has-nav", allCards.length > 1);

        filtered.forEach((card, idx) => {
            stSidebarList.appendChild(playlistCard(card, idx));
        });

        const curItem = stSidebarList.querySelector(".is-current");
        if (curItem && window.innerWidth > 768) {
            setTimeout(() => {
                try { curItem.scrollIntoView({ block: "center", behavior: "smooth" }); } catch {}
            }, 80);
        }
    }

    function compactPtDate(text) {
        const raw = String(text || "").replace(/\s+/g, " ").trim();
        if (!raw) return "";
        const months = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };
        const m = raw.match(/(\d{1,2})\s+de\s+([a-zç]{3})\.?\s+de\s+(\d{4})(?:(?:,|\s)+(\d{1,2}:\d{2}))?/i);
        if (!m) return raw;
        const mo = months[m[2].slice(0, 3).toLowerCase()];
        if (!mo) return raw;
        const pad = n => String(n).padStart(2, "0");
        return pad(m[1]) + "/" + pad(mo) + "/" + m[3] + (m[4] ? " " + m[4] : "");
    }
    function navStage(dir) {
        const cards = playableCards(); if (cards.length < 2) return;
        let i = cards.indexOf(stCur); if (i < 0) i = 0;
        const ni = (i + dir + cards.length) % cards.length;
        writePosition(ni + 1);
        loadStageItem(cards[ni]);
    }

    const IMAGE_SOURCE_ATTRS = ["data-src", "data-original", "data-url", "data-lazy-src", "data-original-src", "src"];
    const UI_IMAGE_RE = /\b(?:favicon|logo|icon|avatar|spinner|placeholder|loading|loader|sprite|transparent)\b/i;

    function imageSourceCandidates(img) {
        const out = [];
        const add = value => {
            if (!value || typeof value !== "string") return;
            const src = value.trim();
            if (src && src !== "about:blank" && !out.includes(src)) out.push(src);
        };
        IMAGE_SOURCE_ATTRS.forEach(attr => add(img.getAttribute(attr)));
        add(img.currentSrc);
        add(img.src);
        return out;
    }

    function decodedImageText(value) {
        try { return decodeURIComponent(String(value || "")); } catch (e) { return String(value || ""); }
    }

    function imageSourceLooksUsable(src) {
        return !!src && !/^(?:about:blank|javascript:)/i.test(src) && !UI_IMAGE_RE.test(decodedImageText(src));
    }

    function mediaImageSource(img) {
        return imageSourceCandidates(img).find(imageSourceLooksUsable) || "";
    }

    function isMediaImage(img, fileName = "") {
        if (!img || (stage && stage.contains(img))) return false;
        const src = mediaImageSource(img);
        if (!src) return false;
        const metadata = [img.alt, img.title, img.id, img.getAttribute("class"), img.getAttribute("aria-label")].join(" ");
        if (UI_IMAGE_RE.test(metadata)) return false;
        if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0 && img.naturalWidth <= 64 && img.naturalHeight <= 64) return false;
        return true;
    }

    function findNativeModalImage() {
        const modals = Array.from(document.querySelectorAll(".fixed, dialog, [role='dialog'], .media-viewer, #modal-root, body > div[class*='fixed']"));
        for (const m of modals) {
            if (stage && stage.contains(m)) continue;
            const imgs = Array.from(m.querySelectorAll("img")).filter(i => {
                const src = i.currentSrc || i.src || i.getAttribute("src") || "";
                return src && !/logo|icon|avatar|favicon/i.test(src);
            });
            if (imgs.length) return imgs[0];
        }
        return null;
    }

    let gfToastT;
    function toast(msg) {
        let t = document.querySelector(".gf-toast");
        if (!t) {
            t = document.createElement("div");
            t.className = "gf-toast";
            t.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483000;background:#111;color:#fff;padding:8px 14px;border-radius:8px;font:600 13px/1 Inter,system-ui,sans-serif;opacity:0;transition:opacity .15s;pointer-events:none";
            document.body.append(t);
        }
        t.textContent = msg;
        t.style.opacity = "1";
        clearTimeout(gfToastT);
        gfToastT = setTimeout(() => { t.style.opacity = "0"; }, 1600);
    }
    function appendImageChrome(host, imgUrl) {
        const mkAct = (ic, label, cb) => {
            const b = el("button", { type: "button", class: "gf-plc-act", title: label, "aria-label": label });
            b.innerHTML = ic;
            b.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); cb(); });
            return b;
        };
        const prevBtn = mkAct(IC.prev, "Anterior", () => navStage(-1));
        const nextBtn = mkAct(IC.next, "Próximo", () => navStage(1));
        const reportBtn = mkAct(IC.flag, "Reportar", () => {
            const a = document.querySelector('a[href*="report"], a[href*="abuse"]');
            if (a && a.href) window.open(a.href, "_blank", "noopener");
            else toast("Sem página de denúncia neste site");
        });
        const dlb = mkAct(IC.download, "Baixar", () => {
            const d = stCur && stCur._gf;
            if (d && d.downloadBtn) d.downloadBtn.click();
            else if (imgUrl) window.open(imgUrl, "_blank", "noopener");
        });
        const shareBtn = mkAct(IC.share, "Compartilhar / Copiar link", () => {
            copyText(location.href).then(ok => {
                toast(ok ? "Link copiado!" : "Falha ao copiar link");
                if (ok) { shareBtn.innerHTML = IC.check; setTimeout(() => { shareBtn.innerHTML = IC.share; }, 1600); }
            });
        });
        const fsb = mkAct(IC.expand, "Tela cheia (f)", () => {
            try {
                const target = host;
                if (document.fullscreenElement) document.exitFullscreen();
                else target.requestFullscreen();
            } catch { /* fullscreen blocked */ }
        });
        const row = el("div", { class: "gf-plc-row" },
            el("div", { class: "gf-plc-left" }, prevBtn, nextBtn),
            el("div", { class: "gf-plc-right" }, reportBtn, dlb, shareBtn, fsb)
        );
        host.append(el("div", { class: "gf-plc-bottom" }, row));
    }

    let curAc = null;
    function mountPhotoZoom(mid, imgUrl, fallbackUrl) {
        const existingHost = mid.querySelector(".gf-img-host");
        if (existingHost) {
            const existingImg = existingHost.querySelector(".gf-image");
            if (existingImg && imgUrl && existingImg.src !== imgUrl) {
                if (fallbackUrl) {
                    existingImg.onerror = () => {
                        existingImg.onerror = null;
                        if (fallbackUrl && existingImg.src !== fallbackUrl) existingImg.src = fallbackUrl;
                    };
                }
                existingImg.src = imgUrl;
            }
            return;
        }

        const host = el("div", { class: "gf-img-host" });
        mid.appendChild(host);
        const newImg = el("img", { class: "gf-image", src: imgUrl || "", alt: "" });
        if (fallbackUrl) {
            newImg.onerror = () => {
                newImg.onerror = null;
                if (fallbackUrl && newImg.src !== fallbackUrl) newImg.src = fallbackUrl;
            };
        }
        host.appendChild(newImg);
        appendImageChrome(host, imgUrl);
        bindZoom(mid, newImg, { host, padH: 80, keys: { nav: navStage, fullscreenTarget: () => stage } });
    }

    async function mountTextViewer(mid, d) {
        const extMatch = (d.name || "").match(/\.([a-zA-Z0-9]{2,5})(?:\?|#|$)/);
        const ext = extMatch ? extMatch[1].toUpperCase() : "TXT";

        const host = el("div", { class: "gf-txt-stage-host" });
        host.innerHTML = `
            <div class="gf-txt-stage-card">
                <div class="gf-txt-stage-bar">
                    <div class="gf-txt-stage-info">
                        <span class="gf-txt-tag">${ext}</span>
                        <span class="gf-txt-meta" id="gfTxtMeta">Carregando conteúdo…</span>
                    </div>
                    <div class="gf-txt-stage-actions">
                        <a class="gf-txt-btn" id="gfDlTxtBtn" href="#" download target="_blank" style="display:none;">
                            ${IC.download}
                            <span>Baixar</span>
                        </a>
                        <button type="button" class="gf-txt-btn" id="gfCopyTxtBtn" disabled>
                            ${IC.copy}
                            <span>Copiar Texto</span>
                        </button>
                    </div>
                </div>
                <pre class="gf-txt-stage-content" id="gfTxtContent">Carregando conteúdo do arquivo…</pre>
            </div>
        `;
        mid.appendChild(host);

        const contentEl = host.querySelector("#gfTxtContent");
        const metaEl = host.querySelector("#gfTxtMeta");
        const copyBtn = host.querySelector("#gfCopyTxtBtn");
        const dlBtn = host.querySelector("#gfDlTxtBtn");

        let loadedTxt = "";

        if (d.downloadBtn) {
            dlBtn.style.display = "inline-flex";
            dlBtn.onclick = () => { d.downloadBtn.click(); };
        }

        if (d.previewBtn) {
            try { d.previewBtn.click(); } catch (e) {}
        }

        let tries = 0;
        const iv = setInterval(() => {
            const preEl = Array.from(document.querySelectorAll("pre, code, textarea")).find(p => !stage || !stage.contains(p));
            if (preEl && preEl.textContent) {
                clearInterval(iv);
                loadedTxt = preEl.textContent;
                contentEl.textContent = loadedTxt;
                const lines = loadedTxt.split("\n").length;
                metaEl.textContent = `${lines} linhas · ${loadedTxt.length} caracteres`;
                copyBtn.disabled = false;
            } else if (++tries > 25) {
                clearInterval(iv);
                if (!loadedTxt) {
                    contentEl.textContent = "Prévia de texto carregada. Use o botão Baixar acima para abrir ou salvar o arquivo completo.";
                    metaEl.textContent = "Texto pronto para download";
                }
            }
        }, 120);

        copyBtn.addEventListener("click", () => {
            if (loadedTxt) {
                try { navigator.clipboard.writeText(loadedTxt); } catch (e) {
                    const ta = document.createElement("textarea"); ta.value = loadedTxt; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
                }
                metaEl.textContent = "Copiado para a área de transferência!";
                setTimeout(() => {
                    const lines = loadedTxt.split("\n").length;
                    metaEl.textContent = `${lines} linhas · ${loadedTxt.length} caracteres`;
                }, 1500);
            }
        });
    }

    function loadStageItem(card) {
        if (curAc) { curAc.abort(); curAc = null; }
        stCur = card;
        const posCards = typeof playableCards === "function" ? playableCards() : [];
        const posIdx = posCards.indexOf(card);
        if (posIdx >= 0) writePosition(posIdx + 1);
        const d = card._gf || {};
        stName.textContent = d.name || "";
        stSize.textContent = d.size || "";
        if (stIcon) stIcon.innerHTML = kindIcon(d.kind);
        if (stTypeStat) {
            let typeLabel = "Arquivo";
            if (d.kind === "video") typeLabel = "Vídeo";
            else if (d.kind === "image") typeLabel = "Foto";
            else if (d.kind === "text") typeLabel = "Texto";
            stTypeStat.textContent = typeLabel;
        }
        if (typeof stDl !== "undefined" && stDl) {
            stDl.onclick = () => { if (d.downloadBtn) d.downloadBtn.click(); };
        }

        // Atualiza item ativo na sidebar e dá scroll suave
        if (stSidebarList) {
            Array.from(stSidebarList.children).forEach(ch => ch.classList.toggle("is-current", ch._card === card));
            const cur = stSidebarList.querySelector(".is-current");
            if (cur && window.innerWidth > 768) {
                try { cur.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {}
            }
        }

        // Limpa mídia anterior do stage
        stMid.querySelectorAll(".gf-host, .gf-img-host, .gf-txt-stage-host, .gf-spin, .gf-stage-msg, .item-mediaplayer, video, audio").forEach(e => {
            if (e.tagName === "VIDEO" || e.tagName === "AUDIO") { try { e.pause(); } catch (err) {} }
            e.remove();
        });

        // 1. Single File View: se o vídeo/imagem nativo já estiver no DOM
        if (d.isSingleFile) {
            const nativeVid = d.nativeVid || document.querySelector("#fm-file-preview video, #fm-root video");
            const nativeImg = d.nativeImg || (document.getElementById("fm-file-preview") ? document.getElementById("fm-file-preview").querySelector("img") : null);

            if (nativeVid) {
                const src = nativeVid.currentSrc || nativeVid.src || (nativeVid.querySelector("source") ? (nativeVid.querySelector("source").getAttribute("src") || nativeVid.querySelector("source").src) : "");
                if (src) {
                    try { nativeVid.pause(); } catch (e) {}
                    curAc = new AbortController();
                    const playerVid = document.createElement("video");
                    playerVid.className = "gf-video";
                    playerVid.src = src;
                    playerVid.addEventListener("loadedmetadata", () => {
                        const key = (stCur && stCur._gf && (stCur._gf.directUrl || stCur._gf.name)) || "";
                        if (key && Number.isFinite(playerVid.duration)) gfRememberDur(key, fmtT(playerVid.duration));
                    }, { once: true });
                    if (nativeVid.poster) playerVid.poster = nativeVid.poster;
                    playerVid.preload = "auto";
                    playerVid.playsInline = true;

                    playerVid.volume = prefs.volume ?? 1;
                    playerVid.muted = prefs.muted ?? false;
                    playerVid.addEventListener("volumechange", () => {
                        prefs.volume = playerVid.volume;
                        prefs.muted = playerVid.muted;
                        saveP();
                    }, { signal: curAc.signal });

                    const host = el("div", { class: "gf-host gf-pl" }, playerVid);
                    buildPlayerControls(host, playerVid, src, curAc, GF_PLAYER_HOOKS);
                    stMid.appendChild(host);

                    const p = playerVid.play();
                    if (p && p.catch) p.catch(() => {});
                    return;
                }
            } else if (nativeImg) {
                mountPhotoZoom(stMid, mediaImageSource(nativeImg) || d.thumb);
                return;
            }
        }

        // 2. Se for IMAGEM: carrega a imagem em alta resolução diretamente
        if (d.kind === "image") {
            const direct = resolveDirectGofileUrl(d);
            const highRes = direct || d.mediaUrl || d.thumb || "";
            mountPhotoZoom(stMid, highRes, d.thumb);
            return;
        }

        // 3. Se for TEXTO: monta o leitor integrado
        if (d.kind === "text") {
            mountTextViewer(stMid, d);
            return;
        }

        // 4. Se for VÍDEO:
        const videoSrc = resolveDirectGofileUrl(d) || d.mediaUrl;
        if (videoSrc) {
            d.mediaUrl = videoSrc;
            curAc = new AbortController();
            const playerVid = document.createElement("video");
            playerVid.className = "gf-video";
            playerVid.src = videoSrc;
            if (d.thumb) playerVid.poster = d.thumb;
            playerVid.preload = "auto";
            playerVid.playsInline = true;
            playerVid.volume = prefs.volume ?? 1;
            playerVid.muted = prefs.muted ?? false;
            playerVid.addEventListener("volumechange", () => {
                prefs.volume = playerVid.volume;
                prefs.muted = playerVid.muted;
                saveP();
            }, { signal: curAc.signal });

            const host = el("div", { class: "gf-host gf-pl" }, playerVid);
            buildPlayerControls(host, playerVid, videoSrc, curAc, GF_PLAYER_HOOKS);
            stMid.appendChild(host);

            const p = playerVid.play();
            if (p && p.catch) p.catch(() => {});
            return;
        }

        const spin = el("div", { class: "gf-spin", style: "width:42px; height:42px; border-radius:50%; border:3px solid rgba(255,255,255,0.2); border-top-color:#f5c400; animation:gf-spin .8s linear infinite;" });
        stMid.appendChild(spin);

        fireNativeClick(d.openBtn || d.previewBtn);

        let tries = 0;
        const iv = setInterval(() => {
            const nativeVid = Array.from(document.querySelectorAll("video")).find(v => !stage || !stage.contains(v));
            const src = nativeVid ? (nativeVid.currentSrc || nativeVid.src || (nativeVid.querySelector("source") ? (nativeVid.querySelector("source").getAttribute("src") || nativeVid.querySelector("source").src) : "")) : "";

            if (src) {
                clearInterval(iv);
                spin.remove();
                d.mediaUrl = src;

                curAc = new AbortController();
                const playerVid = document.createElement("video");
                playerVid.className = "gf-video";
                playerVid.src = src;
                playerVid.addEventListener("loadedmetadata", () => {
                    const key = d.directUrl || d.name || "";
                    if (key && Number.isFinite(playerVid.duration)) gfRememberDur(key, fmtT(playerVid.duration));
                }, { once: true });
                if ((nativeVid && nativeVid.poster) || d.thumb) playerVid.poster = (nativeVid && nativeVid.poster) || d.thumb;
                playerVid.preload = "auto";
                playerVid.playsInline = true;
                playerVid.volume = prefs.volume ?? 1;
                playerVid.muted = prefs.muted ?? false;
                playerVid.addEventListener("volumechange", () => {
                    prefs.volume = playerVid.volume;
                    prefs.muted = playerVid.muted;
                    saveP();
                }, { signal: curAc.signal });

                const host = el("div", { class: "gf-host gf-pl" }, playerVid);
                buildPlayerControls(host, playerVid, src, curAc, GF_PLAYER_HOOKS);
                stMid.appendChild(host);

                const p = playerVid.play();
                if (p && p.catch) p.catch(() => {});

                try { if (nativeVid) nativeVid.pause(); } catch (e) {}
                const closeBtn = document.querySelector('[data-dialog] [data-close], [role="dialog"] [data-close], [data-dialog] button[aria-label*="Close" i]');
                if (closeBtn) closeBtn.click();
            } else if (++tries > 60) {
                clearInterval(iv);
                spin.remove();
                stMid.appendChild(el("div", { class: "gf-stage-msg", style: "color:rgba(255,255,255,0.6); font-size:14px;" }, "Não foi possível carregar o vídeo. Tente clicar no botão de Download."));
            }
        }, 80);
    }

    // collapseSidebar: abre com a playlist recolhida SÓ nesta abertura (pasta de 1 item), sem gravar gf_sidebar_collapsed.
    // Vale até fechar o stage ou o usuário mexer na sidebar (toggleSidebar limpa).
    function openStage(card, opts) {
        buildStage();
        stCur = card;
        if (opts && opts.collapseSidebar) stTempCollapsed = true;
        stage.classList.toggle("is-sidebar-collapsed", stTempCollapsed || isSidebarCollapsed);
        stage.classList.add("open");
        document.documentElement.classList.add("gf-has-stage");
        renderPlaylist();
        const cards = playableCards();
        const p = readPosition();
        loadStageItem((p && cards[p - 1]) || card);
    }

    // closeStage dispara Escape no document, e o atalho Escape chama closeStage de novo.
    let closingStage = false;
    function closeStage(opts) {
        if (!stage || closingStage) return;
        closingStage = true;
        try { closeStageNow(opts); } finally { closingStage = false; }
    }
    function closeStageNow(opts) {
        const fromRoute = !!(opts && opts.fromRoute === true);
        if (!fromRoute && stage.classList.contains("open")) autoDismissedRoute = routeKey(location.href);
        if (curAc) { curAc.abort(); curAc = null; }
        stMid.querySelectorAll("video, audio").forEach(v => {
            try { v.pause(); v.muted = true; } catch (err) {}
            v.remove();
        });
        // Limpa a mídia mas mantém as setas laterais, criadas uma única vez em buildStage().
        Array.from(stMid.children).forEach(c => { if (!c.classList.contains("gf-nav-side")) c.remove(); });

        // Fecha qualquer modal nativo do GoFile via clique
        document.querySelectorAll("dialog[open], [data-action='close'], [data-action='back'], #modal-close, button[aria-label*='Close' i], [class*='fixed'] button[aria-label*='close' i]").forEach(b => {
            try { b.click(); } catch (e) {}
        });

        // Dispara Escape nativo no window e document
        try {
            const escEv = new KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, which: 27, bubbles: true, cancelable: true });
            document.dispatchEvent(escEv);
            window.dispatchEvent(escEv);
        } catch (e) {}

        // Remove quaisquer modais/backdrops nativos residuais
        document.querySelectorAll("dialog[open], [role='dialog'], #modal-root > div, body > div.fixed.inset-0:not(#sidebar-overlay):not(.gf-stage):not(.gf-bulk)").forEach(m => {
            try { m.remove(); } catch (e) {}
        });

        stage.classList.remove("open");
        stTempCollapsed = false;
        document.documentElement.classList.remove("gf-has-stage");
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
        stCur = null;

        requestAnimationFrame(() => {
            buildStage();
            scan();
            if (isGroupByType) groupGalleryByType(true);
        });
    }
