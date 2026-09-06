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
manifest in `build.js` determines concatenation order; folders show ownership,
while the numeric prefix keeps the historical execution order readable.

| Part | Responsibility |
|---|---|
| `01-header` | Userscript metadata, runtime model, and IIFE opening |
| `02-config` | Feature flags, storage helpers, and settings metadata |
| `03-i18n` | Language helpers, navigation, and authentication UI |
| `04-icons` | Icons, logos, placeholders, and favicon |
| `05-styles` | CSS composer; context-owned CSS lives in `parts/styles/` |
| `06-helpers` | Shared text, URL, UI, pagination, fetch, and thumbnail helpers |
| `07-posts-misc` | Author filters, keyboard shortcuts, and infinite scrolling |
| `08-images-masonry` | Image processing and media gallery grouping |
| `10-redgifs-player` | RedGifs and Turbo player pipeline |
| `11-autoload-spoiler` | RedGifs autoloading and spoiler expansion |
| `12-dock-postnav` | Post navigation dock, search, settings, and filters |
| `13-search-imageclick` | Search result filtering and image-click feed |
| `14-feed-lightbox` | Media feed, gallery, gestures, and downloads |
| `15-listing` | Thread list/grid, badges, and placeholders |
| `16-home` | Forum home layout, feed, and sidebar |
| `17-thread-filterbar` | Thread filter and sorting controls |
| `18-alerts` | Alert cleanup and grouping |
| `19-alerts-dock` | Following rail and notification dock |
| `19-topbar` | Topbar and mobile sheets |
| `20-hover-preview` | Thread thumbnail hover previews |
| `21-init-features` | Redirects, downloads, media links, and other feature setup |
| `22-paint` | Page context, skeletons, readiness checks, and stable paint handoff |
| `22-bookmarks` | Bookmark feed replacement |
| `22-feed` | Timeline/feed rendering |
| `22-feed-sync` | Timeline database synchronization |
| `22-init` | Page detection, scheduling, boot, and IIFE closing |

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
| `styles/07-feed` | Timeline and bookmark feed |
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
