    /* ===================== PARSER DE DATAS E TÍTULOS ===================== */
    function cleanHtmlText(str) {
        if (!str || typeof str !== "string") return "";
        let cur = str;
        for (let i = 0; i < 3; i++) {
            if (!/&[a-zA-Z0-9#]+;/.test(cur)) break;
            const txt = document.createElement("textarea");
            txt.innerHTML = cur;
            cur = txt.value;
        }
        return cur.trim();
    }

    function extractDateFromTitle(title) {
        if (!title || typeof title !== "string") return null;
        title = cleanHtmlText(title).trim();

        // 1. ISO: YYYY[-._]MM[-._]DD
        const mIso = title.match(/(?:^|[\[(_\s])(20\d\d|19\d\d)[.\-_](0[1-9]|1[0-2])[.\-_](0[1-9]|[12]\d|3[01])\b/);
        if (mIso) {
            const y = parseInt(mIso[1], 10), m = parseInt(mIso[2], 10), d = parseInt(mIso[3], 10);
            return {
                timestamp: Date.UTC(y, m - 1, d),
                formatted: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
                displayDate: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`,
                year: y, month: m, day: d,
                raw: mIso[0].trim().replace(/^[\[(_\s]+|[\])_\s]+$/g, "")
            };
        }

        // 2. Compacto: YYYYMMDD
        const mCompact = title.match(/(?:^|[\[(_\s])(20\d\d|19\d\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\b/);
        if (mCompact) {
            const y = parseInt(mCompact[1], 10), m = parseInt(mCompact[2], 10), d = parseInt(mCompact[3], 10);
            return {
                timestamp: Date.UTC(y, m - 1, d),
                formatted: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
                displayDate: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`,
                year: y, month: m, day: d,
                raw: mCompact[0].trim().replace(/^[\[(_\s]+|[\])_\s]+$/g, "")
            };
        }

        // 3. BR/EU: DD[-._]MM[-._]YYYY
        const mDmy = title.match(/(?:^|[\[(_\s])(0[1-9]|[12]\d|3[01])[.\-_](0[1-9]|1[0-2])[.\-_](20\d\d|19\d\d)\b/);
        if (mDmy) {
            const d = parseInt(mDmy[1], 10), m = parseInt(mDmy[2], 10), y = parseInt(mDmy[3], 10);
            return {
                timestamp: Date.UTC(y, m - 1, d),
                formatted: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
                displayDate: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`,
                year: y, month: m, day: d,
                raw: mDmy[0].trim().replace(/^[\[(_\s]+|[\])_\s]+$/g, "")
            };
        }

        // 4. Mês e Ano: YYYY[-._]MM
        const mYm = title.match(/(?:^|[\[(_\s])(20\d\d|19\d\d)[.\-_](0[1-9]|1[0-2])\b/);
        if (mYm) {
            const y = parseInt(mYm[1], 10), m = parseInt(mYm[2], 10);
            return {
                timestamp: Date.UTC(y, m - 1, 1),
                formatted: `${y}-${String(m).padStart(2, "0")}`,
                displayDate: `${String(m).padStart(2, "0")}/${y}`,
                year: y, month: m, day: 1,
                raw: mYm[0].trim().replace(/^[\[(_\s]+|[\])_\s]+$/g, "")
            };
        }

        return null;
    }

    function cleanTitleWithoutDate(title, dt) {
        if (!title || typeof title !== "string") return "";
        title = cleanHtmlText(title).trim();
        const withoutExt = title.replace(/\.[a-zA-Z0-9]{2,5}$/i, "").trim();
        const target = withoutExt || title;
        if (!dt || !dt.raw) return target;
        const esc = dt.raw.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        let cleaned = target.replace(new RegExp("^[\\s\\[(_-]*" + esc + "[\\s\\])_–—-]*(?:[-–—_]\\s*)?", "i"), "");
        cleaned = cleaned.replace(/^[\s\-_–—.]+\s*/, "").trim();
        return cleaned || target;
    }
