// Bundles src/strings.js (the translations) and src/doorbell-card.js into the single file dist/doorbell-card.js.
// Usage: node scripts/build.mjs  (dist/ is not committed: CI and the release workflow build it)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { splitDist } from "./i18n-split.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(`${root}package.json`, "utf8"));

// The card's source is one classic script: the translation table first, as the cards read it at their first render.
export const source = () => `${readFileSync(`${root}src/strings.js`, "utf8")}\n${readFileSync(`${root}src/doorbell-card.js`, "utf8")}`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = source().replace("__VERSION__", pkg.version);
  mkdirSync(`${root}dist`, { recursive: true });
  writeFileSync(`${root}dist/doorbell-card.js`, out);
  console.log(`Built dist/doorbell-card.js (${(out.length / 1024).toFixed(1)} KB)`);
  // Translations: English stays in the bundle, each other language goes to dist/doorbell-card.i18n.<lang>.js,
  // fetched when a card needs it (scripts/i18n-split.mjs).
  splitDist(`${root}dist`, "doorbell-card.js", { version: pkg.version });
}
