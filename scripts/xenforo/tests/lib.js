'use strict';
// Builders for the pieces of XenForo markup the fixtures leave open ({{posts}}, {{rows}}, ...).
// They reproduce the shape XenForo 2.x renders on SimpCity and SocialMediaGirls.
const { fixture } = require('./harness');

const THREAD = '/threads/sample-thread.100/';

function post({ id, author = 'Author', ts = 1700000000 + id, body = 'Post ' + id, thread = THREAD }) {
    return `<article class="message message--post js-post js-inlineModContainer" data-author="${author}" data-content="post-${id}" id="js-post-${id}">
<span class="u-anchorTarget" id="post-${id}"></span>
<div class="message-inner">
<div class="message-cell message-cell--user"><section class="message-user"><div class="message-avatar"><div class="message-avatar-wrapper"><a href="/members/${author.toLowerCase()}.7/" class="avatar avatar--m"><img src="/data/avatars/m/0/7.jpg" alt="${author}"></a></div></div><div class="message-userDetails"><h4 class="message-name"><a href="/members/${author.toLowerCase()}.7/" class="username">${author}</a></h4></div></section></div>
<div class="message-cell message-cell--main"><div class="message-main js-quickEditTarget">
<header class="message-attribution message-attribution--split"><ul class="message-attribution-main listInline"><li class="u-concealed"><a href="${thread}post-${id}" rel="nofollow"><time class="u-dt" dir="auto" data-timestamp="${ts}">Nov 14, 2023</time></a></li></ul><ul class="message-attribution-opposite message-attribution-opposite--list"><li><a href="${thread}post-${id}" class="message-attribution-gadget" data-xf-init="share-tooltip" data-href="/posts/${id}/share" aria-label="Share" rel="nofollow"><i class="fa--xf far fa-share-alt" aria-hidden="true"></i></a></li><li><a href="${thread}post-${id}" rel="nofollow">#${id}</a></li></ul></header>
<div class="message-content js-messageContent"><div class="message-userContent lbContainer js-lbContainer" data-lb-id="post-${id}"><article class="message-body js-selectToQuote"><div class="bbWrapper">${body}</div></article></div></div>
<footer class="message-footer"><div class="message-actionBar actionBar"><div class="actionBar-set actionBar-set--external"><a href="/posts/${id}/react?reaction_id=1" class="reaction actionBar-action actionBar-action--reaction" data-xf-click="reaction" data-reaction-id="1"><bdi>Like</bdi></a></div><div class="actionBar-set actionBar-set--internal"><a href="/posts/${id}/bookmark" class="bookmarkLink actionBar-action actionBar-action--bookmark" data-xf-click="bookmark-click" data-sk-bookmarked="addClass:is-bookmarked">Bookmark</a><a href="${thread}reply?quote=${id}" class="actionBar-action actionBar-action--reply" data-xf-click="quote">Reply</a></div></div><div class="reactionsBar js-reactionsList"></div></footer>
</div></div>
</div>
</article>`;
}

function pageNav(base, cur, max) {
    const href = n => base + (n > 1 ? 'page-' + n : '');
    const pages = [];
    for (let n = 1; n <= max; n++) pages.push(`<li class="pageNav-page${n === cur ? ' pageNav-page--current' : ''}"><a href="${href(n)}">${n}</a></li>`);
    return `<nav class="pageNavWrapper pageNavWrapper--mixed"><div class="pageNav">
${cur > 1 ? `<a href="${href(cur - 1)}" class="pageNav-jump pageNav-jump--prev">Prev</a>` : ''}
<ul class="pageNav-main">${pages.join('')}</ul>
${cur < max ? `<a href="${href(cur + 1)}" class="pageNav-jump pageNav-jump--next">Next</a>` : ''}
</div></nav>`;
}

function watchButton(watching, thread = THREAD) {
    return `<a href="${thread}watch" class="button--link button" data-xf-click="switch-overlay" data-sk-watch="Watch" data-sk-unwatch="Unwatch"><span class="button-text">${watching ? 'Unwatch' : 'Watch'}</span></a>`;
}

// a thread page (the live page or one the script fetches): posts [{id, ...}], page/of for the pager
function threadPage({ posts = [], page = 1, of = 1, watching = false, prefix = '', base = THREAD, head = '', after = '', lang = 'en-US', alertBadge = '0' } = {}) {
    return fixture('thread', {
        posts: posts.map(p => post(Object.assign({ thread: base }, p))).join('\n'),
        pageNav: of > 1 ? pageNav(base, page, of) : '',
        watchButton: watchButton(watching, base),
        canonPage: page > 1 ? 'page-' + page : '',
        prefix, head, after, lang, alertBadge,
        alertBadgeClass: +alertBadge ? ' badgeContainer--highlighted' : '',
    });
}

function threadRow({ id, title = 'Thread ' + id, author = 'Starter', ts = 1700000000 + id, replies = 3, thumb = '', prefix = '', unread = false, sticky = false, slug = 'thread-' + id }) {
    const href = `/threads/${slug}.${id}/`;
    return `<div class="structItem structItem--thread js-inlineModContainer js-threadListItem-${id}${unread ? ' is-unread' : ''}${sticky ? ' structItem--sticky' : ''}" data-author="${author}">
<div class="structItem-cell structItem-cell--icon"><div class="structItem-iconContainer">${thumb ? `<a href="${href}" class="dcThumbnail"><img src="${thumb}" alt="" class="dcThumbnail-img"></a>` : `<a href="/members/${author.toLowerCase()}.9/" class="avatar avatar--s"><img src="/data/avatars/s/0/9.jpg" alt="${author}"></a>`}</div></div>
<div class="structItem-cell structItem-cell--main" data-xf-init="touch-proxy"><div class="structItem-title">${prefix}<a href="${href}" class="" data-tp-primary="on">${title}</a></div>
<div class="structItem-minor"><ul class="structItem-parts"><li><a href="/members/${author.toLowerCase()}.9/" class="username">${author}</a></li><li class="structItem-startDate"><a href="${href}" rel="nofollow"><time class="u-dt" data-timestamp="${ts - 1000}">Nov 1, 2023</time></a></li></ul></div></div>
<div class="structItem-cell structItem-cell--meta"><dl class="pairs pairs--justified"><dt>Replies</dt><dd>${replies}</dd></dl><dl class="pairs pairs--justified structItem-minor"><dt>Views</dt><dd>1K</dd></dl></div>
<div class="structItem-cell structItem-cell--latest"><a href="${href}latest" rel="nofollow"><time class="structItem-latestDate u-dt" data-timestamp="${ts}">Nov 14, 2023</time></a><div class="structItem-minor"><a href="/members/last.3/" class="username">Last</a></div></div>
</div>`;
}

module.exports = { THREAD, post, pageNav, watchButton, threadPage, threadRow };

const FORUM = '/forums/instagram.5/';
// a forum listing page (the live page or a fetched next page)
function listingPage({ rows = [], sticky = [], page = 1, of = 1, base = FORUM, lang = 'en-US' } = {}) {
    return fixture('listing', {
        rows: rows.map(threadRow).join('\n'),
        sticky: sticky.map(r => threadRow(Object.assign({ sticky: true }, r))).join('\n'),
        pageNav: of > 1 ? pageNav(base, page, of) : '',
        canonPage: page > 1 ? 'page-' + page : '',
        lang,
    });
}

module.exports.FORUM = FORUM;
module.exports.listingPage = listingPage;

// one alert row as XenForo renders it in the alerts popup/page
function alertRow({ id, unread = false, thread = 'thread-' + id, threadId = id, who = 'Poster', ts = '2026-01-01T00:00:00Z' }) {
    return `<li class="alert js-alert${unread ? ' is-unread' : ''}" data-alert-id="${id}"><div class="contentRow"><div class="contentRow-figure"><a href="/members/${who.toLowerCase()}.4/" class="avatar avatar--xxs"><img src="/data/avatars/s/0/4.jpg" alt="${who}"></a></div><div class="contentRow-main contentRow-main--close"><a href="/members/${who.toLowerCase()}.4/" class="username">${who}</a> replied to the thread <a href="/threads/${thread}.${threadId}/unread" class="fauxBlockLink-blockLink">Thread ${id}</a>.<div class="contentRow-minor contentRow-minor--smaller"><time class="u-dt" datetime="${ts}" data-timestamp="${Math.floor(Date.parse(ts) / 1000)}">Jan 1</time></div></div></div></li>`;
}
// the JSON XenForo answers to /account/alerts?_xfResponseType=json
function alertsJson(rows, next, unread) {
    return { json: { status: 'ok', html: { content: '<ol class="listPlain">' + rows.map(alertRow).join('') + '</ol>' + (next ? `<a class="pageNav-jump pageNav-jump--next" href="${next}">Next</a>` : '') }, visitor: { alerts_unread: unread == null ? rows.filter(r => r.unread).length : unread } } };
}
module.exports.alertRow = alertRow;
module.exports.alertsJson = alertsJson;

// one row of /account/bookmarks
function bookmarkRow({ id, title = 'Saved thread ' + id, note = '', ts = 1700000000 + id, who = 'Author' }) {
    return `<div class="block-row block-row--separated"><div class="contentRow"><div class="contentRow-figure"><a href="/members/${who.toLowerCase()}.7/" class="avatar avatar--s"><img src="/data/avatars/s/0/7.jpg" alt="${who}"></a></div><div class="contentRow-main"><h3 class="contentRow-header"><a href="/posts/${id}/">${title}</a></h3><div class="contentRow-snippet">${note || 'No bookmark note.'}</div><div class="contentRow-minor contentRow-minor--hideLinks"><ul class="listInline listInline--bullet"><li><a href="/members/${who.toLowerCase()}.7/" class="username">${who}</a></li><li><time class="u-dt" data-timestamp="${ts}">Nov 14</time></li></ul></div></div><div class="contentRow-extra"><a href="/posts/${id}/bookmark" class="button button--link">Edit</a></div></div></div>`;
}
function bookmarksPage(rows, next) {
    return fixture('bookmarks', { rows: rows.map(bookmarkRow).join('\n'), next: next ? `<div class="pageNav"><a class="pageNav-jump pageNav-jump--next" href="${next}">Next</a></div>` : '' });
}
module.exports.bookmarkRow = bookmarkRow;
module.exports.bookmarksPage = bookmarksPage;

// the forum home (forum_list): category blocks with forum nodes
function homePage(categories = [['Social media', ['Instagram', 'TikTok', 'OnlyFans']], ['Community', ['Requests', 'Off-Topic']]]) {
    let n = 1;
    const cats = categories.map(([title, forums], ci) => `<div class="block block--category block--category${ci + 1}"><span class="u-anchorTarget" id="cat-${ci + 1}"></span><div class="block-container"><h2 class="block-header"><a href="/categories/c.${ci + 1}/">${title}</a></h2><div class="block-body">`
        + forums.map(f => { const id = n++; return `<div class="node node--id${id} node--depth2 node--forum node--read"><div class="node-body"><span class="node-icon" aria-hidden="true"><i></i></span><div class="node-main js-nodeMain"><h3 class="node-title"><a href="/forums/${f.toLowerCase().replace(/\W+/g, '-')}.${id}/" data-xf-init="element-tooltip">${f}</a></h3></div><div class="node-stats"><dl class="pairs pairs--rows"><dt>Threads</dt><dd>1K</dd></dl></div><div class="node-extra"><div class="node-extra-row"><a href="/threads/latest-${id}.${900 + id}/post-1" class="node-extra-title">Latest ${f}</a></div></div></div></div>`; }).join('')
        + '</div></div></div>').join('\n');
    return fixture('home', { categories: cats });
}
module.exports.homePage = homePage;
