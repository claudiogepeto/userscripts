# Userscripts

A collection of browser userscripts for specialized media sites and communities.

## Install

Install a userscript manager first, then choose the scripts you need:

- [Violentmonkey](https://violentmonkey.github.io/)
- [Tampermonkey](https://www.tampermonkey.net/)

### Enable full script access

For all userscript features to work, allow the userscript manager to run scripts on the target sites:

1. Open your browser's extensions page (chrome://extensions on Chrome/Chromium; about:addons on Firefox).
2. Open the details for **Tampermonkey** or **Violentmonkey**.
3. On Chrome/Chromium, enable **Allow User Scripts**.
4. Allow the manager to access the sites you want to customize, then install one of the scripts above.

If **Allow User Scripts** is not available, update the browser and userscript manager first.

### Available scripts

Install only the scripts you need:

| Script | Description | Install |
|---|---|---|
| **bunkr** | Theater stage, custom player, gallery view, mirror fallback, and album navigation for Bunkr. | [Install](https://raw.githubusercontent.com/claudiogepeto/userscripts/main/dist/bunkr.user.js) |
| **ehentai** | Dark theme, responsive gallery, infinite scroll, fullscreen viewer, and high-quality downloads for E-Hentai and ExHentai. | [Install](https://raw.githubusercontent.com/claudiogepeto/userscripts/main/dist/ehentai.user.js) |
| **filester** | Theater stage, custom player, album strip, gallery grid, zoomable images, and AMOLED styling for Filester. | [Install](https://raw.githubusercontent.com/claudiogepeto/userscripts/main/dist/filester.user.js) |
| **gofile** | Card grid, search, custom player, theater stage, gallery strip, and AMOLED styling for GoFile. | [Install](https://raw.githubusercontent.com/claudiogepeto/userscripts/main/dist/gofile.user.js) |
| **hentaiera** | Modern dark AMOLED theme, responsive gallery grid, infinite scroll, unified navigation, and multi-mode reader for HentaiEra | [Install](https://raw.githubusercontent.com/claudiogepeto/userscripts/main/dist/hentaiera.user.js) |
| **nhentai** | Dark gallery theme, command search, responsive reader, language filter, and infinite scroll for NHentai. | [Install](https://raw.githubusercontent.com/claudiogepeto/userscripts/main/dist/nhentai.user.js) |
| **pixeldrain** | AMOLED theater player for Pixeldrain with mirror fallback, custom image zoom, album navigation, and direct media failover. | [Install](https://raw.githubusercontent.com/claudiogepeto/userscripts/main/dist/pixeldrain.user.js) |
| **rule34** | Dark theme, responsive media grid, infinite scroll, tag search, and fullscreen viewer for Rule34. | [Install](https://raw.githubusercontent.com/claudiogepeto/userscripts/main/dist/rule34.user.js) |
| **turbo** | Native player and theater stage for Turbo with signed-media playback, album navigation, search, and AMOLED styling. | [Install](https://raw.githubusercontent.com/claudiogepeto/userscripts/main/dist/turbo.user.js) |
| **xenforo** | Full redesign for SimpCity and SocialMediaGirls with custom navigation, feeds, media tools, and forum layouts. | [Install](https://raw.githubusercontent.com/claudiogepeto/userscripts/main/dist/xenforo.user.js) |
| **bypassbr** | Age-gate and sensitive-media bypass adapters for Twitter/X, SpankBang, Chaturbate, Erome, Pornhub, and Sex.com. | [Install](https://raw.githubusercontent.com/claudiogepeto/userscripts/main/dist/bypassbr.user.js) |

## Repository layout

- `scripts/*.user.js` contains standalone userscript sources.
- `scripts/xenforo/parts/*.js` contains the modular XenForo source.
- `scripts/xenforo/script.js` is assembled from the XenForo parts.
- `scripts/bypassbr/parts/*.js` contains the modular BypassBR source.
- `scripts/bypassbr/script.js` is assembled from the BypassBR parts.
- `dist/` contains generated installable files.

## Development

Edit the sources, then run:

```bash
node build.mjs
node --check scripts/xenforo/script.js
node --check scripts/bypassbr/script.js
node scripts/xenforo/test-mock.js
```

The build regenerates XenForo, every individual file, and this README. Do not edit generated files in `dist/` or the assembled XenForo file directly. Every installable file includes its GitHub auto-update URL.
