# XenForo userscript: notes for agents

One userscript that redesigns two XenForo 2 forums, SimpCity and
SocialMediaGirls: topbar, dock, thread and post cards, media overlay, Feed,
alerts rail, bookmarks feed, settings. Paths below are relative to
`scripts/xenforo/`. Read this before changing anything; the README is the
human overview.

## Build model

- The source is `parts/**/*.js`. `build.js` concatenates them, in the order of
  its `PART_FILES` manifest, into `script.js`; the root `build.mjs` turns that
  into `dist/xenforo.user.js` (and regenerates the root README). `script.js`
  and `dist/` are generated: never edit them, always commit them rebuilt.
- Every part runs in ONE shared IIFE scope, opened in `parts/core/01-header.js`
  and closed in `parts/runtime/22-init.js`. A top-level `function` or `const`
  in one part is visible to every later part. There are no imports.
- Manifest order matters: constants must be declared before code that runs at
  load time reads them. `parts/navigation/12a-dock.js` opens
  `setupPostNavigation`, `12b-dock-search.js` and `12c-dock-settings.js`
  continue it and `12c` closes it: those three stay adjacent and in order.
- Every part starts with a short header: what it owns, what it exposes, what
  it depends on. Keep it true when you change the part.
- `build.js` fails the build when:
  - two parts declare the same top-level name (4-space indent = top level);
  - a CSS part other than the palette (`parts/styles/01-base.js`) contains a raw
    colour literal (hex, rgb/rgba, hsl/hsla). Literals that predate the check
    are listed per part in `color-allowlist.json`; never add to it, use a
    `--smg-*` token or add a token to the palette. An entry that is no longer
    used must be removed, so the list only shrinks.

## Gates

Run from the repository root after every change:

```bash
node build.mjs                                # must print no ERRO, regenerates script.js and dist
node --check scripts/xenforo/script.js
node scripts/xenforo/tests/run.js             # summary line: scenarios: N  passed: N  failed: 0
```

Read the summary line, not the exit code of a pipeline. Only
`dist/xenforo.user.js` may change in `dist/` for a XenForo change.

## Feature map

| Feature | JS | CSS |
|---|---|---|
| Config, settings, kill switch | `parts/core/02-config.js`, `parts/navigation/12c-dock-settings.js` | `parts/navigation/css-settings.js` |
| i18n | `parts/core/03-i18n.js` | |
| Icons and placeholders | `parts/core/04-icons.js` | |
| Style composition, tokens | `parts/core/05-styles.js` | `parts/styles/01-base.js` |
| Shared helpers, toast, popover, sheet | `parts/core/06-helpers.js` | `parts/navigation/css-dock.js` |
| Paint gate and skeletons | `parts/runtime/22-paint.js` | `parts/styles/09-paint.js` |
| Boot, scheduler, soft navigation | `parts/runtime/22-init.js` | |
| Pager engine, infinite scroll, shortcuts | `parts/thread/07-posts-misc.js` | |
| Masonry engine | `parts/media/08a-masonry-engine.js` | `parts/media/css-grids.js` |
| Post images and post block model | `parts/media/08-images-masonry.js` | `parts/media/css-images.js` |
| Players (RedGifs, Turbo, ImagePond, Cyberdrop) | `parts/media/10-redgifs-player.js`, `parts/media/11-autoload-spoiler.js` | `parts/media/css-players.js` |
| Embeds, file-host cards, per-post features | `parts/runtime/21-init-features.js` | `parts/media/css-social-embeds.js`, `parts/media/css-images.js` |
| Media overlay (gallery and feed views) | `parts/media/14-feed-lightbox.js`, `parts/media/13-search-imageclick.js` | `parts/media/css-grids.js`, `parts/media/css-media-feed.js` |
| Dock | `parts/navigation/12a-dock.js` | `parts/navigation/css-dock.js`, `parts/navigation/css-dock-mobile.js` |
| Search | `parts/navigation/12b-dock-search.js` | `parts/navigation/css-search.js`, `parts/styles/04-mobile.js` |
| Topbar, notices | `parts/navigation/19-topbar.js` | `parts/styles/03-topbar.js`, `parts/navigation/css-notices.js` |
| Forum listings | `parts/listing/15-listing.js` | `parts/listing/css-thread-cards.js`, `parts/listing/css-listing-controls.js` |
| Home | `parts/home/16-home.js` | `parts/styles/02-home.js` |
| Thread header, filter bar, thread card, follow button | `parts/thread/17a-filterbar.js` | `parts/styles/05-filterbar.js`, `parts/styles/06-thread.js` |
| Post and comment cards | `parts/thread/17c-post-cards.js` | `parts/thread/css-post-cards.js`, `parts/thread/css-comments.js` |
| Followed threads list | `parts/following/17b-watched-list.js` | `parts/styles/06-thread.js` |
| Alerts (cleanup and rail) | `parts/alerts/18-alerts.js`, `parts/alerts/19-alerts-dock.js` | `parts/alerts/css-alerts.js`, `parts/styles/08-alertdock.js` |
| Feed, feed sync, cron | `parts/feed/22-feed.js`, `parts/feed/22-feed-sync.js` | `parts/styles/07-feed.js` |
| Bookmarks feed | `parts/feed/22-bookmarks.js` | `parts/styles/07-feed.js` |
| IndexedDB | `parts/feed/06b-feed-db.js` | |
| Thumbnail URL rule | `parts/navigation/20-thumb-url.js` | |

## Single owners: use these, do not create another

Each concern below has exactly one implementation. Extend it; a second
toast, pager, skeleton or masonry is a defect even when it works.

- **Tokens**: `parts/styles/01-base.js`, the `--smg-*` palette (colours, white
  and black alpha ladders, radius, font, spacing, shadow, durations, z-index,
  per-component radius and shadow such as `--smg-pop-r`, `--smg-sheet-r`).
  Feature CSS only references tokens.
- **Breakpoints**: CSS cannot read variables in `@media`, so the numbers are
  fixed by convention: `600px` phone (CSS and JS
  `matchMedia('(max-width: 600px)')`, masonry `MASONRY_BP_TWO`), `800px`
  narrow, `1100px` medium. Do not introduce new ones.
- **Toast**: `toast(msg, kind)` in `parts/core/06-helpers.js` (polite live
  region, at most 4 stacked, `TOAST_MS`).
- **Popover**: `smgPopover(entry)` in `parts/core/06-helpers.js` closes on
  outside click and Escape and repositions on scroll; `smgPopHost` in
  `parts/thread/17a-filterbar.js` mounts filter-bar popovers in `<body>`.
- **Sheet and modal**: `smgSheetOpen`/`smgSheetClose`, `smgModalOpen`/
  `smgModalClose`, `wireSheetClose` in `parts/core/06-helpers.js` (scroll lock
  via `smg-sheet-lock`, one history entry per open sheet, Back closes it).
- **Infinite loader**: `createPager` in `parts/thread/07-posts-misc.js`. Every
  list that grows at its end uses it: thread and listing pages, Feed, Saved,
  home carousel (x axis), search results, alerts rail.
- **Skeleton and paint**: `parts/runtime/22-paint.js` (page kinds,
  `paintSkeletonMarkup`, readiness, release) with `parts/styles/09-paint.js`.
- **Masonry**: `parts/media/08a-masonry-engine.js` (`masonryMount`,
  `masonrySchedule`): shortest column, 2 columns up to 600px, 3 above, never
  more; landscape items span 2, and a group of only landscape items lays out
  as pairs in 2 columns. In-post groups and the gallery both use it.
- **Post card and thread card**: `buildPostCard`/`buildCommentCard` in
  `parts/thread/17c-post-cards.js`; `decorateThreadCard` in
  `parts/thread/17a-filterbar.js`.
- **i18n**: `i18n('English text')` and `I18N_PT` in `parts/core/03-i18n.js`.
- **Settings**: `DEFAULT_FEATURES` and `SETTINGS_META` in
  `parts/core/02-config.js`; read with `FEATURES.<key>`. The panel is built
  from `SETTINGS_META`.
- **Storage**: `gmGet`/`gmSet` in `parts/core/02-config.js` for userscript
  storage; the IndexedDB schema and every access live in
  `parts/feed/06b-feed-db.js`.

## Persisted names: never rename

Users already have data under these names. Renaming one silently loses it.

- GM storage keys: `smg-features`, `smg-off`, `smg-alerts-dock`,
  `smg-alerts-dock-w`, `smg-alerts-count`, `smg-feed-cron-last-run`,
  `smg-feed-retention-days`, `smg-feed-muted`, `smg-fh-logos`,
  `smg-search-history`, `smg-thumb-cache-<site>`, `smg-thumb-tpl-<site>`,
  `smg-navmode-notice`, `smg-notices-dismissed-ids`, `smg-notices-expanded`,
  `smg-threadview`.
- localStorage: `smg-off`, `smg-dock-hidden`, `smg_known_prefix_ids`,
  `smg-search-def-titles`, `smg-search-def-order`, `smg-search-like`.
  sessionStorage: `smg_feed_cache_v2_*`.
- IndexedDB: database `smg-feed` (`FDB_VERSION`), stores `followed` (key
  `path`), `timeline` (key `post_id`), `meta` (key `key`), `bookmarks` (key
  `postId`), and the record fields the feed writes. Schema changes go through
  a version bump and an upgrade step in `fdbOpen`.
- URL parameters: `view` (`gallery`, `feed`) and `order` on thread pages.
- `SETTINGS_META` keys (they are the keys inside `smg-features`).

## Recipes

**Add a page kind.** Add the class in `detectPageClasses`
(`parts/runtime/22-init.js`), the kind in `PAINT_PAGE_KINDS` and
`classifyPaintPage`, its skeleton in `paintSkeletonMarkup` and its readiness
in `paintPageIsReady` (`parts/runtime/22-paint.js`), skeleton CSS in
`parts/styles/09-paint.js`, the setup call in `boot` and `softNavigate`
(`parts/runtime/22-init.js`). Add a scenario to
`tests/scenarios/01-paint.test.js`.

**Add an embed or file host.** A file-host card is one entry in
`FH_PROVIDERS` (`parts/runtime/21-init-features.js`). A built-in player goes
in `parts/media/10-redgifs-player.js` behind its own setting, and must join
the post block model in `parts/media/08-images-masonry.js` so it lays out with
images. Requests to other origins go through `GM_xmlhttpRequest` (`GMX`,
`gmGetJSON`) and need an `@connect` line in `parts/core/01-header.js`.

**Add a setting.** Add the key to `DEFAULT_FEATURES` and an item to
`SETTINGS_META` (label, `desc` in en and pt) in `parts/core/02-config.js`;
add the label to `I18N_PT`; guard the feature with `FEATURES.<key>`. Add a
row to `CASES` in `tests/scenarios/11-settings.test.js` (the suite fails when
the panel and `CASES` disagree).

**Add an i18n key.** Write the English text at the call site,
`i18n('Load more')`, and add `'Load more': '...'` to `I18N_PT`. For markup
built as HTML strings, call `i18nDom(root)` after inserting it: it translates
the `placeholder`, `title`, `aria-label` and `data-label` attributes.

**Add a CSS component.** Put it in the feature's `css-*.js` part (or create
`parts/<feature>/css-<name>.js` declaring one `CSS_<NAME>` constant, add it
to `PART_FILES` in `build.js` next to the other CSS parts and to the
concatenation in `injectStyles`, `parts/core/05-styles.js`). Use tokens only;
radius and shadow come from the component tokens.

## Verify

- `tests/run.js` runs the scenario suite. Each scenario loads the built
  `script.js` into a jsdom page made from a XenForo-shaped fixture
  (`tests/fixtures/`, builders in `tests/lib.js`), with GM storage, fetch,
  `GM_xmlhttpRequest`, IndexedDB (`tests/fake-idb.js`) and observers stubbed
  (`tests/harness.js`). Assert on DOM, storage and requests, never on source
  text or CSS strings.
- Units no page shows directly are reached through `window.__smgTest`
  (`masonryPlace`, `createPager`), created at the end of
  `parts/runtime/22-init.js` only when `window.__SMG_TEST__` is set before the
  script runs. Do not add other test exports or test-mode branches.
- `node scripts/xenforo/tests/run.js masonry pager` runs a subset;
  `SMG_TEST_LOGS=1` prints the page console of failing scenarios.
- jsdom has no layout, no real media and no CSS cascade. Visual results,
  real column widths, video playback, scroll position and the live forums are
  checked in a headless browser against the real sites, never by the suite.
