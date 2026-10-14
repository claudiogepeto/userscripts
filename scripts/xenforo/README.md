# XenForo userscript

This directory contains the modular source for the SimpCity and
SocialMediaGirls redesign.

## Quick start

Edit the relevant file in `parts/`, then run the checks from the repository
root:

```bash
node scripts/xenforo/build.js
node --check scripts/xenforo/script.js
node scripts/xenforo/test-mock.js
```

To rebuild every userscript and the root README, run:

```bash
node build.mjs
```

`build.js` concatenates the explicit manifest into `script.js`. The assembled
file is generated output: install it from `dist/xenforo.user.js`, and do not
edit `script.js` directly.

## Source layout

Each file in `parts/` contributes one section to the same userscript IIFE. The
manifest in `build.js` determines concatenation order; folders group the files
by feature, while the numeric prefix keeps the historical execution order
readable. A file may continue a function opened by the previous one: `12b` and
`12c` are the rest of `setupPostNavigation` from `12a`.

| Part | Responsibility |
|---|---|
| `core/01-header` | Userscript metadata, runtime model, and IIFE opening |
| `core/02-config` | Feature flags, storage helpers, and settings metadata |
| `core/03-i18n` | Language helpers, navigation, and authentication UI |
| `core/04-icons` | Icons, logos, placeholders, and favicon |
| `core/05-styles` | CSS composer; context-owned CSS lives in `parts/styles/` |
| `core/06-helpers` | Shared text, URL, UI, pagination, fetch, and thumbnail helpers |
| `feed/06b-feed-db` | IndexedDB store for followed threads, feed posts, and bookmarks |
| `thread/07-posts-misc` | Keyboard shortcuts and infinite scrolling |
| `media/08-images-masonry` | Image processing and media gallery grouping |
| `media/10-redgifs-player` | RedGifs, Turbo, ImagePond, and Cyberdrop player pipeline |
| `media/11-autoload-spoiler` | RedGifs autoloading and spoiler expansion |
| `navigation/12a-dock` | Post navigation dock: buttons, global links, mobile sheet, goto |
| `navigation/12b-dock-search` | Dock search popover |
| `navigation/12c-dock-settings` | Settings panel, listing filters and sorting, dock wiring |
| `media/13-search-imageclick` | Search results panel and image-click feed |
| `media/14-feed-lightbox` | Media feed, gallery, and gestures |
| `listing/15-listing` | Thread list/grid, badges, and placeholders |
| `home/16-home` | Forum home layout and sidebar |
| `thread/17a-filterbar` | Filter bar, thread header, sticky sync, and thread cards |
| `following/17b-watched-list` | Followed-thread list: rows, sync to the database, streaming |
| `thread/17c-post-cards` | Post and comment cards |
| `alerts/18-alerts` | Alert cleanup and grouping |
| `alerts/19-alerts-dock` | Following rail and notification dock |
| `navigation/19-topbar` | Topbar and mobile sheets |
| `navigation/20-thumb-url` | Large thumbnail URL helper |
| `runtime/21-init-features` | Redirects, media links, file-host cards, and other feature setup |
| `feed/22-bookmarks` | Bookmark feed replacement |
| `feed/22-feed-sync` | Feed database synchronization and cron |
| `feed/22-feed` | Feed rendering |
| `runtime/22-paint` | Page context, skeletons, readiness checks, and stable paint handoff |
| `runtime/22-init` | Page detection, scheduling, boot, and IIFE closing |

### CSS contexts

The injected stylesheet is assembled from small, ordered contexts instead of a
single template literal:

| File | Responsibility |
|---|---|
| `styles/01-base` | Theme tokens, reset, media and shared components |
| `styles/02-home` | Home layout and home feed |
| `styles/03-topbar` | Topbar and sheets |
| `styles/04-mobile` | Mobile navigation and search |
| `styles/05-filterbar` | Listing/thread filter controls |
| `styles/06-thread` | Thread header, posts and comments |
| `styles/07-feed` | Feed and bookmark feed |
| `styles/08-alertdock` | Alerts/following rail |
| `styles/09-paint` | Shared paint gate and non-home skeletons |

## Editing rules

- Edit the parts, not the generated `script.js`.
- Keep the numbered order stable unless a dependency requires a change.
- The parts share one IIFE scope, so functions and constants can be used across
  sections when they are declared earlier in the build.
- CSS fragments are constants consumed by `core/05-styles.js`; keep their order
  in the build manifest and put page-only rules in the matching context.
- Run the build, syntax check, and mock tests before committing.
