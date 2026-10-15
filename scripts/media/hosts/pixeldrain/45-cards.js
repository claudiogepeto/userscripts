    /* ===================== DECORAÇÃO DOS CARDS NA GALERIA ===================== */
    function decorateGalleryCards() {
        const gal = document.querySelector(".file_viewer .gallery") || document.querySelector(".file_preview .gallery");
        if (!gal) return;
        const al = albumInfo();
        const filesMap = new Map();
        if (al && al.files) {
            al.files.forEach(f => {
                filesMap.set(f.id, f);
                filesMap.set(f.name, f);
            });
        }

        const cards = Array.from(gal.querySelectorAll(".file"));
        cards.forEach((card, idx) => {
            if (card.dataset.pdxDecorated) return;
            card.dataset.pdxDecorated = "1";
            card.dataset.pdxOrigIdx = String(idx);

            let fid = null;
            const href = card.getAttribute("href") || "";
            const mh = href.match(/\/u\/([A-Za-z0-9]+)/) || href.match(/item=(\d+)/);
            if (mh && mh[1]) {
                if (href.includes("/u/")) fid = mh[1];
                else if (al && al.files[+mh[1]]) fid = al.files[+mh[1]].id;
            }
            const f = (fid && filesMap.get(fid)) || (al && al.files[idx]) || null;
            const fname = (f && f.name) || (card.getAttribute("title") || card.textContent || "").trim();
            const extractedDate = (f && f.extractedDate) || extractDateFromTitle(fname);
            const displayTitle = (f && f.displayTitle) || cleanTitleWithoutDate(fname, extractedDate);
            const kind = f ? getFileKind(f) : (VIDEO_EXT.test(fname) ? "video" : (IMAGE_EXT.test(fname) ? "image" : "other"));

            card.dataset.pdxName = fname;
            card.classList.add("pdx-card-item");
            Array.from(card.childNodes).forEach(n => {
                if (n.nodeType === 3 && (n.textContent || "").trim()) n.remove();
            });

            const img = card.querySelector("img");
            if (img) {
                img.referrerPolicy = "no-referrer";
                img.loading = "lazy";
            }

            const imageBox = card.querySelector(".icon_container, .image");
            if (kind === "video" && imageBox && !imageBox.querySelector(".pdx-card-play-overlay")) {
                const playOv = el("div", { class: "pdx-card-play-overlay" });
                playOv.innerHTML = PL_ICONS.play;
                imageBox.appendChild(playOv);
            }

            let body = card.querySelector(".pdx-card-body");
            if (!body) {
                body = el("div", { class: "pdx-card-body" });
                body.appendChild(el("div", { class: "pdx-card-name", title: fname }, displayTitle || fname));

                if (f && f.date_upload) {
                    body.appendChild(el("div", { class: "pdx-card-date-val", title: "Data de envio" }, formatDisplayDate(f.date_upload)));
                }
                if (extractedDate && extractedDate.displayDate) {
                    body.appendChild(el("div", { class: "pdx-card-date-val", title: "Data extraída do nome do arquivo" }, extractedDate.displayDate));
                }
                if (f && f.size) body.appendChild(el("div", { class: "pdx-card-foot" }, fmtSize(f.size)));
                card.appendChild(body);
            }
        });
    }
