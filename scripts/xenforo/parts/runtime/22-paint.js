    // =========================================================
    // PAINT RUNTIME: page context, skeletons and stable handoff.
    // The native XenForo tree stays mounted for compatibility, but remains hidden
    // until the active page controller reports that its first composition is ready.
    // =========================================================
    // =========================================================
    // SHARED PAINT GATE roda TODAS as features · scheduleRun (coalesce rAF do observer) ·
    //       detectPageClasses (smg-sc/smg-smg/home/threadlist/thread) · boot() + MutationObserver.
    //       ⇒ processAll roda quase TODO frame: cada pass tem que sair barato (REGRA DE OURO, ver topo).
    // =========================================================
    const PAINT_PAGE_KINDS = Object.freeze({
        HOME: 'home',
        THREAD: 'thread',
        LISTING: 'listing',
        FOLLOWING: 'following',
        TIMELINE: 'timeline',
        BOOKMARKS: 'bookmarks',
        NONE: 'none',
    });

    function classifyPaintPage(input) {
        const source = input || {};
        const pathname = source.pathname || location.pathname || '/';
        const search = source.search == null ? location.search : source.search;
        const template = source.template == null
            ? (document.documentElement.getAttribute('data-template') || '')
            : source.template;
        const tpl = String(template).toLowerCase();
        const homePath = pathname === '/' || pathname === '';
        const home = homePath || tpl === 'forum_list';
        const feed = new URLSearchParams(search || '').get('view') === 'feed';
        let kind = PAINT_PAGE_KINDS.NONE;

        if (home && feed) kind = PAINT_PAGE_KINDS.TIMELINE;
        else if (home) kind = PAINT_PAGE_KINDS.HOME;
        else if (tpl.includes('bookmarks') || /\/account\/bookmarks|\/bookmarks\//i.test(pathname)) kind = PAINT_PAGE_KINDS.BOOKMARKS;
        else if (tpl === 'thread_view' || /\/threads\//i.test(pathname)) kind = PAINT_PAGE_KINDS.THREAD;
        else if (/\/watched\/threads(?:\/|$)/i.test(pathname) || tpl === 'watched_threads_list') kind = PAINT_PAGE_KINDS.FOLLOWING;
        else if (/\/forums(?:\/|$)|\/whats-new(?:\/|$)|\/tags(?:\/|$)|\/categories(?:\/|$)/i.test(pathname)
            || /^(?:forum_view|whats_new_posts|search_results)$/i.test(tpl)) kind = PAINT_PAGE_KINDS.LISTING;

        const gated = kind !== PAINT_PAGE_KINDS.NONE
            && (kind !== PAINT_PAGE_KINDS.HOME || !!FEATURES.homeRemake)
            && (kind !== PAINT_PAGE_KINDS.BOOKMARKS || !!FEATURES.bookmarksFeed);
        return { kind, gated, pathname, template };
    }

    function paintSkeletonMarkup(kind) {
        if (kind === PAINT_PAGE_KINDS.HOME) {
            const feedCards = Array.from({ length: 10 }, () =>
                '<div class="smg-home-skeleton-card"><div class="smg-home-skeleton-card-thumb"></div>'
                + '<div class="smg-home-skeleton-card-body"><i class="smg-home-skeleton-line"></i>'
                + '<i class="smg-home-skeleton-line short"></i></div></div>'
            ).join('');
            const categoryTiles = Array.from({ length: 10 }, () =>
                '<div class="smg-home-skeleton-tile"><i class="smg-home-skeleton-line"></i>'
                + '<i class="smg-home-skeleton-line short"></i></div>'
            ).join('');
            const section = '<section><div class="smg-home-skeleton-section-head">'
                + '<i class="smg-home-skeleton-section-title"></i><span class="smg-home-skeleton-section-divider"></span>'
                + '</div><div class="smg-home-skeleton-grid">' + categoryTiles + '</div></section>';
            const noticesExpanded = gmGet('smg-notices-expanded', '0') === '1';
            const notices = '<div class="smg-home-skeleton-notices' + (noticesExpanded ? ' is-expanded' : '') + '">'
                + '<div class="smg-home-skeleton-notices-head"><i></i><i class="smg-home-skeleton-notices-title"></i>'
                + '<i class="smg-home-skeleton-notices-badge"></i><span class="smg-home-skeleton-notices-actions"><i></i><i></i></span></div>'
                + '<div class="smg-home-skeleton-notices-body"><i class="smg-home-skeleton-notices-line"></i>'
                + '<i class="smg-home-skeleton-notices-line short"></i></div></div>';
            return '<div class="smg-home-skeleton-topbar"><i class="smg-home-skeleton-topbar-logo"></i>'
                + '<div class="smg-home-skeleton-topbar-nav"><i></i><i></i><i></i></div>'
                + '<div class="smg-home-skeleton-topbar-actions"><i></i><i></i><i></i></div></div>'
                + '<main class="smg-home-skeleton-main">' + notices
                + '<section class="smg-home-skeleton-feed"><div class="smg-home-skeleton-feed-head"><i></i><i></i><span></span></div>'
                + '<div class="smg-home-skeleton-feed-cards">' + feedCards + '</div></section>'
                + '<div class="smg-home-skeleton-sections">' + section + section + section + '</div></main>'
                + '<nav class="smg-home-skeleton-bottom-nav" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></nav>';
        }

        const line = (className, extra) => '<i class="smg-page-skeleton-line smg-skeleton-shimmer'
            + (className ? ' ' + className : '') + '"' + (extra || '') + '></i>';
        const chrome = '<div class="smg-page-skeleton-chrome"><i class="smg-page-skeleton-chrome-logo smg-skeleton-shimmer"></i>'
            + '<div class="smg-page-skeleton-chrome-nav"><i class="smg-skeleton-shimmer"></i><i class="smg-skeleton-shimmer"></i><i class="smg-skeleton-shimmer"></i></div>'
            + '<div class="smg-page-skeleton-chrome-actions"><i class="smg-skeleton-shimmer"></i><i class="smg-skeleton-shimmer"></i><i class="smg-skeleton-shimmer"></i></div></div>';
        const header = '<header class="smg-page-skeleton-header"><div class="smg-page-skeleton-header-copy">'
            + '<i class="smg-page-skeleton-title smg-skeleton-shimmer"></i><div class="smg-page-skeleton-meta">'
            + '<i class="smg-skeleton-shimmer"></i><i class="smg-skeleton-shimmer"></i></div></div>'
            + '<div class="smg-page-skeleton-actions"><i class="smg-page-skeleton-action smg-skeleton-shimmer"></i>'
            + '<i class="smg-page-skeleton-action smg-skeleton-shimmer"></i></div></header>';
        const filter = '<div class="smg-page-skeleton-filter"><i class="smg-skeleton-shimmer"></i><i class="smg-skeleton-shimmer"></i>'
            + '<i class="smg-skeleton-shimmer"></i><i class="smg-skeleton-shimmer"></i></div>';
        const post = '<article class="smg-page-skeleton-post"><div class="smg-page-skeleton-post-head">'
            + '<i class="smg-page-skeleton-avatar smg-skeleton-shimmer"></i><div class="smg-page-skeleton-post-copy">'
            + line() + line() + '</div></div><div class="smg-page-skeleton-post-body">'
            + line() + line() + line() + line() + '</div></article>';
        const feedCard = '<div class="smg-page-skeleton-feed-card"><i class="smg-page-skeleton-card-thumb smg-skeleton-shimmer"></i>'
            + '<div class="smg-page-skeleton-card-copy">' + line() + line() + line() + '</div></div>';
        const row = '<div class="smg-page-skeleton-row"><i class="smg-page-skeleton-row-thumb smg-skeleton-shimmer"></i>'
            + '<div class="smg-page-skeleton-row-copy">' + line() + line() + '</div>'
            + '<i class="smg-page-skeleton-row-action smg-skeleton-shimmer"></i></div>';
        let body = filter + '<div class="smg-page-skeleton-posts">' + post.repeat(6) + '</div>';
        if (kind === PAINT_PAGE_KINDS.LISTING || kind === PAINT_PAGE_KINDS.FOLLOWING) {
            body = filter + '<div class="smg-page-skeleton-list">' + row.repeat(12) + '</div>';
        } else if (kind === PAINT_PAGE_KINDS.TIMELINE || kind === PAINT_PAGE_KINDS.BOOKMARKS) {
            body = '<div class="smg-page-skeleton-' + (kind === PAINT_PAGE_KINDS.TIMELINE ? 'feed' : 'bookmarks') + '">' + feedCard.repeat(8) + '</div>';
        }
        const bottomNav = '<nav class="smg-page-skeleton-bottom-nav" aria-hidden="true"><i class="smg-skeleton-shimmer"></i><i class="smg-skeleton-shimmer"></i><i class="smg-skeleton-shimmer"></i><i class="smg-skeleton-shimmer"></i><i class="smg-skeleton-shimmer"></i></nav>';
        return chrome + '<main class="smg-page-skeleton-main">' + header + body + '</main>' + bottomNav;
    }

    function paintRailMarkup() {
        const row = '<div class="smg-page-skeleton-rail-row"><i class="smg-page-skeleton-rail-thumb smg-skeleton-shimmer"></i>'
            + '<div class="smg-page-skeleton-rail-copy"><i class="smg-page-skeleton-rail-line smg-skeleton-shimmer"></i>'
            + '<i class="smg-page-skeleton-rail-line short smg-skeleton-shimmer"></i></div></div>';
        return '<header class="smg-page-skeleton-rail-head"><i class="smg-page-skeleton-rail-title smg-skeleton-shimmer"></i>'
            + '<span class="smg-page-skeleton-rail-actions"><i class="smg-skeleton-shimmer"></i><i class="smg-skeleton-shimmer"></i></span></header>'
            + '<div class="smg-page-skeleton-rail-list">' + row.repeat(7) + '</div>';
    }

    function ensureHomeSkeleton() {
        const root = document.documentElement;
        if (!root.classList.contains('smg-home-pending') || document.getElementById('smg-home-skeleton')) return;
        const shell = document.createElement('div');
        shell.id = 'smg-home-skeleton';
        shell.className = 'smg-home-skeleton';
        shell.setAttribute('aria-hidden', 'true');
        shell.innerHTML = paintSkeletonMarkup(PAINT_PAGE_KINDS.HOME);
        root.appendChild(shell);
    }

    function ensureSkeletonRail() {
        const root = document.documentElement;
        const current = document.getElementById('smg-page-skeleton-rail');
        if (!root.classList.contains('smg-page-pending') || !root.classList.contains('smg-aldock-on')) {
            if (current) current.remove();
            return;
        }
        if (current) return;
        const rail = document.createElement('aside');
        rail.id = 'smg-page-skeleton-rail';
        rail.className = 'smg-page-skeleton smg-page-skeleton-rail';
        rail.setAttribute('aria-hidden', 'true');
        rail.innerHTML = paintRailMarkup();
        root.appendChild(rail);
    }

    function ensurePageSkeleton() {
        const context = classifyPaintPage();
        if (!context.gated) return;
        if (context.kind === PAINT_PAGE_KINDS.HOME) {
            ensureHomeSkeleton();
            ensureSkeletonRail();
            return;
        }
        if (document.getElementById('smg-page-skeleton')) {
            ensureSkeletonRail();
            return;
        }
        const shell = document.createElement('div');
        shell.id = 'smg-page-skeleton';
        shell.className = 'smg-page-skeleton smg-page-skeleton--' + context.kind;
        shell.setAttribute('aria-hidden', 'true');
        shell.innerHTML = paintSkeletonMarkup(context.kind);
        document.documentElement.appendChild(shell);
        ensureSkeletonRail();
    }

    function releaseHomeSkeleton() {
        const shell = document.getElementById('smg-home-skeleton');
        if (!shell) return;
        // Swap the composed DOM and the shell in the same task. A fade would expose the
        // native XenForo tree behind it for a few frames, which is more noticeable than
        // an immediate, already-stable handoff.
        if (shell.parentNode) shell.remove();
    }

    function releasePageSkeleton() {
        releaseHomeSkeleton();
        const shell = document.getElementById('smg-page-skeleton');
        if (shell) shell.remove();
        const rail = document.getElementById('smg-page-skeleton-rail');
        if (rail) rail.remove();
    }

    function homeNoticesAreReady() {
        const blocks = Array.from(document.querySelectorAll('.notices--block'));
        return !blocks.some(block => block.querySelector('.notice') && block.style.display !== 'none');
    }

    function paintHasFatalError() {
        try {
            const navigation = performance.getEntriesByType('navigation')[0];
            const responseStatus = navigation && Number(navigation.responseStatus);
            if (responseStatus >= 500) return true;
        } catch (e) {}

        const title = (document.title || '').replace(/\s+/g, ' ').trim();
        if (/^(?:5\d{2}|500)\b|\binternal server error\b/i.test(title)) return true;

        const headings = Array.from(document.querySelectorAll('h1, .p-title-value, .blockMessage--error, .error-page'));
        return headings.some(node => /oops!?\s+we ran into some problems|we encountered an error|server returned an error|internal server error|erro interno|encontramos alguns problemas/i.test((node.textContent || '').replace(/\s+/g, ' ').trim()));
    }

    // A página só troca do shell para o DOM nativo quando o controlador ativo terminou
    // sua primeira composição. O timeout é apenas um fallback para páginas quebradas ou
    // respostas interrompidas; em condições normais a liberação acontece por prontidão +
    // dois frames estáveis.
    const PAINT_SETTLE_FRAMES = 2;
    const PAINT_MAX_WAIT_MS = 4200;
    const PAINT_RETRY_MS = 250;
    let paintTimer = 0;
    let paintRaf = 0;
    let paintDeadline = 0;
    let paintReleaseScheduled = false;
    let paintObservedKind = '';
    let paintObservedSignature = null;
    let homePassSignature = null;

    function cancelPagePaintRelease() {
        if (paintTimer) clearTimeout(paintTimer);
        if (paintRaf) cancelAnimationFrame(paintRaf);
        paintTimer = 0;
        paintRaf = 0;
        paintDeadline = 0;
        paintReleaseScheduled = false;
        paintObservedKind = '';
        paintObservedSignature = null;
    }

    function paintChromeIsReady() {
        const hasNativeNav = !!document.querySelector('.p-nav');
        const topbarReady = !FEATURES.topBar || !hasNativeNav || !!document.getElementById('smg-topbar-wrap');
        const dockWanted = typeof aldockWanted === 'function' && aldockWanted();
        const dockReady = !FEATURES.alertsDock || !dockWanted || !!document.getElementById('smg-aldock');
        return topbarReady && dockReady;
    }

    function paintPageSignature(context) {
        const kind = context.kind;
        if (kind === PAINT_PAGE_KINDS.HOME) {
            return typeof homeLayoutSignature === 'function' ? homeLayoutSignature() : '';
        }
        if (kind === PAINT_PAGE_KINDS.THREAD) {
            const header = document.querySelector('.p-body-header');
            const posts = Array.from(document.querySelectorAll('article.message')).map(post =>
                (post.id || '') + ':' + (post.dataset.smgCard || '') + ':' + (post.dataset.smgCardReady || '') + ':' + (post.dataset.smgCc || '') + ':' + (post.dataset.smgCcReady || '')
            ).join('|');
            return (header ? (header.textContent || '').replace(/\s+/g, ' ').trim() : '') + '[' + posts + ']';
        }
        if (kind === PAINT_PAGE_KINDS.LISTING || kind === PAINT_PAGE_KINDS.FOLLOWING) {
            const rows = Array.from(document.querySelectorAll('.structItemContainer .structItem--thread, .p-body-content .structItem--thread, .smg-article-grid .message--articlePreview'));
            return rows.map(row => (row.querySelector('.structItem-title a, .articlePreview-title a') || {}).href || '')
                .join('|') + ':' + rows.map(row => (row.dataset.smgDecorated || '') + (row.dataset.smgDecoratedReady || '') + (row.dataset.smgArtReady || '') + (row.dataset.smgPhReady || '')).join('');
        }
        if (kind === PAINT_PAGE_KINDS.TIMELINE) {
            const river = document.getElementById('smg-river');
            if (!river) return '';
            const list = river.querySelector('.smg-fp-list');
            return 'river:' + (list ? list.childElementCount : 0) + ':' + (list && list.firstElementChild ? list.firstElementChild.className : '');
        }
        if (kind === PAINT_PAGE_KINDS.BOOKMARKS) {
            const feed = document.getElementById('smg-bm-feed');
            const list = feed && feed.querySelector('.smg-fp-list');
            return feed ? 'bookmarks:' + (list ? list.childElementCount : 0) : '';
        }
        return '';
    }

    function paintHasExplicitEmptyState() {
        return !!document.querySelector('.blockMessage, .blockMessage--empty, .message--none, .no-results, .js-emptyMessage, .structItemContainer .blockMessage');
    }

    function paintListItems() {
        return Array.from(document.querySelectorAll(
            '.structItemContainer .structItem--thread, .p-body-content .structItem--thread, .smg-article-grid .message--articlePreview'
        ));
    }

    function paintPageCanFallback(context) {
        if (paintHasFatalError()) return true;
        if (context.kind === PAINT_PAGE_KINDS.TIMELINE) {
            const river = document.getElementById('smg-river');
            return !!river;
        }
        if (context.kind === PAINT_PAGE_KINDS.BOOKMARKS) {
            const feed = document.getElementById('smg-bm-feed');
            return !!feed;
        }
        return document.readyState === 'complete' && paintHasExplicitEmptyState();
    }

    function paintPageIsReady(context) {
        if (!paintChromeIsReady()) return false;
        if (context.kind === PAINT_PAGE_KINDS.HOME) {
            const hasCategory = !!document.querySelector('.p-body-content .block--category');
            if (!hasCategory || typeof homeLayoutSignature !== 'function') return false;
            if (typeof homeComponentsReady === 'function' && !homeComponentsReady()) return false;
            if (typeof homeNoticesAreReady === 'function' && FEATURES.headerNotices && !homeNoticesAreReady()) return false;
            return homePassSignature === homeLayoutSignature();
        }
        if (context.kind === PAINT_PAGE_KINDS.THREAD) {
            const content = document.querySelector('.p-body-content');
            const header = document.querySelector('.p-body-header');
            const messages = document.querySelector('.block--messages, .block-body--messages');
            if (!content || !header || !messages || header.dataset.smgThead !== '1' || header.dataset.smgUnified !== '1') return false;
            const posts = Array.from(content.querySelectorAll('article.message'));
            if (!posts.length) return false;
            const postsReady = posts.every(post => post.dataset.smgCardReady === '1' || post.dataset.smgCardReady === 'skip');
            const commentsReady = Array.from(content.querySelectorAll('.message-responses .comment')).every(comment =>
                comment.dataset.smgCcReady === '1' || comment.dataset.smgCcReady === 'skip'
            );
            return postsReady && commentsReady;
        }
        if (context.kind === PAINT_PAGE_KINDS.LISTING || context.kind === PAINT_PAGE_KINDS.FOLLOWING) {
            const items = paintListItems();
            if (!items.length) return document.readyState === 'complete' && paintHasExplicitEmptyState();
            return items.every(row => {
                if (row.classList.contains('message--articlePreview')) return row.dataset.smgArtReady === '1';
                return row.dataset.smgDecoratedReady === '1'
                    && (!FEATURES.thumbPlaceholders || row.dataset.smgPhReady === '1');
            });
        }
        if (context.kind === PAINT_PAGE_KINDS.TIMELINE) {
            const river = document.getElementById('smg-river');
            const list = document.querySelector('#smg-river .smg-fp-list');
            return !!river && river.dataset.smgPaintReady === '1' && !!list
                && !!list.querySelector('.smg-fp-card, .smg-fp-setup, .smg-fp-empty');
        }
        if (context.kind === PAINT_PAGE_KINDS.BOOKMARKS) {
            const feed = document.getElementById('smg-bm-feed');
            const list = document.querySelector('#smg-bm-feed .smg-fp-list');
            return !!feed && feed.dataset.smgPaintReady === '1' && !!list && !!list.firstElementChild;
        }
        return true;
    }

    function pagePaintIsStable(context) {
        if (!context.gated || !paintPageIsReady(context)) return false;
        const signature = paintPageSignature(context);
        if (!signature) return false;
        if (paintObservedKind !== context.kind || paintObservedSignature !== signature) {
            paintObservedKind = context.kind;
            paintObservedSignature = signature;
            return false;
        }
        return true;
    }

    function schedulePagePaintRelease() {
        const root = document.documentElement;
        const context = classifyPaintPage();
        if (!context.gated || !root.classList.contains('smg-page-pending') || document.readyState === 'loading') return;
        if (paintReleaseScheduled) return;
        if (!paintDeadline) paintDeadline = Date.now() + PAINT_MAX_WAIT_MS;
        paintReleaseScheduled = true;

        const release = () => {
            paintRaf = 0;
            paintReleaseScheduled = false;
            if (!root.classList.contains('smg-page-pending')) return;
            root.classList.remove('smg-page-pending', 'smg-home-pending');
            root.classList.add('smg-page-ready');
            if (context.kind === PAINT_PAGE_KINDS.HOME) root.classList.add('smg-home-ready');
            releasePageSkeleton();
        };
        const waitForStableFrames = framesLeft => {
            paintRaf = 0;
            if (!root.classList.contains('smg-page-pending')) {
                paintReleaseScheduled = false;
                return;
            }
            if (paintHasFatalError()) {
                release();
                return;
            }
            const stable = pagePaintIsStable(context);
            if (stable && framesLeft > 0) {
                paintRaf = requestAnimationFrame(() => waitForStableFrames(framesLeft - 1));
                return;
            }
            const expired = Date.now() >= paintDeadline;
            if (stable || (expired && paintPageCanFallback(context))) {
                release();
                return;
            }
            paintReleaseScheduled = false;
            const wait = expired ? PAINT_RETRY_MS : Math.min(80, Math.max(0, paintDeadline - Date.now()));
            paintTimer = setTimeout(() => {
                paintTimer = 0;
                schedulePagePaintRelease();
            }, wait);
        };
        paintRaf = requestAnimationFrame(() => waitForStableFrames(PAINT_SETTLE_FRAMES));
    }

    if (typeof window !== 'undefined' && window.__TEST_MODE__) {
        window.__paintExports = { classifyPaintPage, paintSkeletonMarkup, paintRailMarkup, paintHasFatalError, paintPageSignature, paintPageIsReady, paintPageCanFallback, PAINT_PAGE_KINDS };
    }
