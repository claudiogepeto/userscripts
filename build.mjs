#!/usr/bin/env node
// =============================================================================
//  build.mjs — build all other userscripts into dist/.
//
//  Sources live in scripts/. XenForo keeps its modular source in
//  scripts/xenforo/parts/ and is assembled into scripts/xenforo/script.js.
//  The build produces one installable file per userscript.
//
//  Usage: node build.mjs
// =============================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- CONFIG ---------------------------------------------------------------
const GH = {
  user: "claudiogepeto",
  repo: "userscripts",
  branch: "main",
};
const RAW = `https://raw.githubusercontent.com/${GH.user}/${GH.repo}/${GH.branch}/dist`;

// ---- helpers --------------------------------------------------------------
const HEADER_RE = /\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/;

function parse(src) {
  const m = src.match(HEADER_RE);
  if (!m) throw new Error("sem bloco ==UserScript==");
  const header = m[0];
  const body = src.slice(m.index + header.length).replace(/^\s*\n/, "");
  const meta = {}; // key -> array of values
  for (const line of header.split("\n")) {
    const mm = line.match(/^\/\/\s*@(\S+)(?:\s+(.*?))?\s*$/);
    if (!mm) continue;
    (meta[mm[1]] ||= []).push(mm[2] ?? "");   // diretivas sem valor (@noframes) → ""
  }
  return { header, body, meta };
}

const first = (meta, k, def = "") => (meta[k]?.[0] ?? def);

// Extract base hostnames from @match values (without scheme, path, or '*.').
function hostsFrom(meta) {
  const out = new Set();
  for (const pat of meta.match || []) {
    const mm = pat.match(/^(?:\*|https?):\/\/([^/]+)\//);
    if (!mm) continue;
    out.add(mm[1].replace(/^\*\./, ""));
  }
  return [...out];
}

// Inject @updateURL/@downloadURL immediately after @version.
function withUpdate(header, fileName) {
  const url = `${RAW}/${fileName}`;
  const lines = header.split("\n").filter(l => !/@(updateURL|downloadURL)\b/.test(l));
  const out = [];
  for (const l of lines) {
    out.push(l);
    if (/^\/\/\s*@version\b/.test(l)) {
      out.push(`// @updateURL    ${url}`);
      out.push(`// @downloadURL  ${url}`);
    }
  }
  return out.join("\n");
}

// ---- load sources ----------------------------------------------------------
const scriptsDir = path.join(__dirname, "scripts");
const xenforoDir = path.join(scriptsDir, "xenforo");

try {
  execFileSync("node", [path.join(xenforoDir, "build.js")], { stdio: "inherit" });
} catch {
  console.warn("! scripts/xenforo/build.js failed — using the existing script.js");
}

const standaloneFiles = fs.readdirSync(scriptsDir)
  .filter(file => file.endsWith(".user.js"))
  .sort();
const entries = standaloneFiles.map(file => ({
  name: file.replace(/\.user\.js$/, ""),
  src: fs.readFileSync(path.join(scriptsDir, file), "utf8"),
}));
entries.push({
  name: "xenforo",
  src: fs.readFileSync(path.join(xenforoDir, "script.js"), "utf8"),
});

// ---- 1) dist/NOME.user.js (com auto-update) -------------------------------
const distDir = path.join(__dirname, "dist");
fs.mkdirSync(distDir, { recursive: true });

const parsed = [];
for (const e of entries) {
  const pp = parse(e.src);
  parsed.push({ ...e, ...pp });
  const file = `${e.name}.user.js`;
  fs.writeFileSync(path.join(distDir, file), withUpdate(pp.header, file) + "\n" + pp.body);
}

// ---- README.md ------------------------------------------------------------
const README_DESCRIPTIONS = {
  bunkr: "Theater stage, custom player, gallery view, mirror fallback, and album navigation for Bunkr.",
  ehentai: "Dark theme, responsive gallery, infinite scroll, fullscreen viewer, and high-quality downloads for E-Hentai and ExHentai.",
  filester: "Theater stage, custom player, album strip, gallery grid, zoomable images, and AMOLED styling for Filester.",
  gofile: "Card grid, search, custom player, theater stage, gallery strip, and AMOLED styling for GoFile.",
  nhentai: "Dark gallery theme, command search, responsive reader, language filter, and infinite scroll for NHentai.",
  pixeldrain: "AMOLED theater player for Pixeldrain with mirror fallback, custom image zoom, album navigation, and direct media failover.",
  rule34: "Dark theme, responsive media grid, infinite scroll, tag search, and fullscreen viewer for Rule34.",
  turbo: "Native player and theater stage for Turbo with signed-media playback, album navigation, search, and AMOLED styling.",
  xenforo: "Full redesign for SimpCity and SocialMediaGirls with custom navigation, feeds, media tools, and forum layouts.",
};
const cards = parsed.map(p => ({
  id: p.name,
  title: first(p.meta, "name") || p.name,
  desc: README_DESCRIPTIONS[p.name] || first(p.meta, "description") || "",
}));
const trunc = (s, n) => { s = String(s || ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
const scriptRows = cards.map(c => {
  const description = trunc(c.desc || c.title, 180).replace(/[\r\n]+/g, " ").replace(/\|/g, "\\|");
  return `| **${c.id}** | ${description} | [Install](${RAW}/${c.id}.user.js) |`;
}).join("\n");
const readme = `# Userscripts

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
${scriptRows}

## Repository layout

- \`scripts/*.user.js\` contains standalone userscript sources.
- \`scripts/xenforo/parts/*.js\` contains the modular XenForo source.
- \`scripts/xenforo/script.js\` is assembled from the XenForo parts.
- \`dist/\` contains generated installable files.

## Development

Edit the sources, then run:

\`\`\`bash
node build.mjs
node --check scripts/xenforo/script.js
node scripts/xenforo/test-mock.js
\`\`\`

The build regenerates XenForo, every individual file, and this README. Do not edit generated files in \`dist/\` or the assembled XenForo file directly. Every installable file includes its GitHub auto-update URL.
`;
fs.writeFileSync(path.join(__dirname, "README.md"), readme);

// ---- resumo ---------------------------------------------------------------
console.log("\nOK — dist/ gerado:");
for (const p of parsed) console.log(`  ${p.name}.user.js`);
