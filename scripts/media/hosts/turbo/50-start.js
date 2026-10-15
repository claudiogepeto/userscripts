    /* ===================== BOOT ===================== */
    function onReady(fn) {
        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
        else fn();
    }
    onReady(() => {
        if (isAlbum) {
            if (openSingleItemAlbum()) return;
            let n = 0; const aid = setInterval(() => {
                if (openSingleItemAlbum()) { clearInterval(aid); return; }
                if (buildAlbumGrid() || ++n > 20) clearInterval(aid);
            }, 300);
            buildAlbumGrid();
            return;
        }
        if (!isVideo) return;
        takeSingleOpen();
        let n = 0, id = null;
        const stop = () => { if (id) clearInterval(id); };
        const tick = () => {
            const stage = buildStage();
            if (stage && mediaMounted) { stop(); return; }
            if (++n > 16) {
                stop();
                if (!mediaMounted) {
                    document.documentElement.classList.add("tb-fallback");
                    const st = document.querySelector(".tb-stage");
                    if (st) st.remove();
                    document.documentElement.classList.remove("tb-has-stage");
                }
            }
        };
        tick();
        id = setInterval(tick, 400);
    });
})();
