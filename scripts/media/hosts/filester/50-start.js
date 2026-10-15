    /* ===================== BOOT ===================== */
    onReady(() => {
        if (isAlbum) {
            if (openSingleItemFolder()) return;
            setupGalleryGrouping();
            return;
        }
        if (!isFile) return;
        takeSingleOpen();
        let n = 0, id = null;
        const stop = () => { if (id) clearInterval(id); };
        const tick = () => {
            const stage = buildStage();
            const mid = stage && stage.querySelector(".fl-stage-mid");
            if (stage && mid) {
                if (stage.classList.contains("is-video")) {
                    triggerNativeLoad();
                    const src = getFilesterVideoSrc();
                    if (src) {
                        mountOwnPlayer(mid, src);
                    }
                } else if (stage.classList.contains("is-text")) {
                    mountFilesterText(mid);
                } else {
                    mountPhotoZoom(mid);
                }
            }
            if (mediaMounted) { stop(); return; }
            if (++n > 25) {
                stop();
                if (!mediaMounted) {
                    document.documentElement.classList.add("fl-fallback");
                    const st = document.querySelector(".fl-stage");
                    if (st) st.remove();
                    document.documentElement.classList.remove("fl-has-stage");
                }
            }
        };
        tick();
        id = setInterval(tick, 200);
    });
})();
