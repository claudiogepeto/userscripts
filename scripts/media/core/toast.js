    /* ===================== CORE: TOAST (scripts/media/core/toast.js) — classe <MEDIA_PREFIX>-toast ===================== */
    let toastT;
    function toast(msg) {
        const cls = MEDIA_PREFIX + "-toast";
        let t = document.querySelector("." + cls);
        if (!t) { t = el("div", { class: cls }); (document.body || document.documentElement).appendChild(t); }
        t.textContent = msg; t.classList.add("show");
        clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 1800);
    }
