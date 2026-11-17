// The status pill (banner and classic header, full card and mini card compact and expanded): on the title row right
// after the title only while the whole title fits beside it, else on its own line under the subtitle; its whole label
// or its dot alone (always its dot alone at 200 px or less); nothing past the banner's ground strip or out of the
// banner. In English, French, German, Hungarian, Greek and Russian, from 245 to 500 px.
// Rendered in Chromium when Playwright and its browser are installed (or CHROMIUM_PATH); skipped otherwise.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { devices, entities, FRONT, GATE, states } from "../scripts/mock-states.mjs";

const read = (f) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const source = `${read("strings.js")}\n${read("doorbell-card.js")}`;
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {}
const browser = await chromium?.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}).catch(() => null);
test.after(() => browser?.close());

const LANGUAGES = ["en", "fr", "de", "hu", "el", "ru"];
const WIDTHS = [190, 245, 300, 400, 460, 500];
const VARIANTS = [
  ["doorbell-card", FRONT],
  ["doorbell-card", GATE],
  ["doorbell-mini-card", FRONT],
  ["doorbell-mini-card", GATE],
];
const DATA = { states, entities, devices };
const SEL = { titles: ".titles", chip: ".chip", label: ".chip-text", name: ".name", banner: ".db-banner", groundPx: 10, zoom: ".zoom" };
const HA_CARD = `customElements.define("ha-card", class extends HTMLElement { constructor() { super();
  this.attachShadow({ mode: "open" }).innerHTML = "<style>:host{display:block;border:1px solid #ddd;overflow:hidden}</style><slot></slot>"; } });`;

test("the status pill keeps the title whole beside it, its label whole, inside the banner", { skip: !browser && "no Chromium" }, async (t) => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  try {
    await page.setContent('<!doctype html><body style="margin:0;font-family:Roboto,Arial,sans-serif"></body>');
    await page.addScriptTag({ content: HA_CARD });
    await page.addScriptTag({ content: source });
    const { bad, dots } = await page.evaluate(
      async ({ variants, languages, widths, data, sel }) => {
        const hass = (language) => ({ ...data, language, locale: { language }, themes: {}, callService() {}, callWS: async () => ({}) });
        const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const textWidth = (el) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          return range.getBoundingClientRect().width;
        };
        const out = [];
        const dots = [];
        const check = (sr, where, width) => {
          const blocks = [...sr.querySelectorAll(sel.titles)].filter((t) => t.querySelector(sel.chip) && t.getClientRects().length);
          if (!blocks.length) out.push(`${where}: no pill`);
          for (const t of blocks) {
            const name = t.querySelector(sel.name);
            const n = name.getBoundingClientRect();
            for (const chip of t.querySelectorAll(sel.chip)) {
              const p = chip.getBoundingClientRect();
              const label = chip.querySelector(sel.label);
              const shown = !!label?.getClientRects().length && label.getBoundingClientRect().width > 0;
              const sameLine = Math.abs(p.top + p.height / 2 - (n.top + n.height / 2)) < 3;
              if (width <= 200 && shown) out.push(`${where}: label shown`);
              if (width > 200 && !shown) dots.push(where);
              const edge = (t.closest(sel.banner || ".banner") || t).getBoundingClientRect().right;
              if (shown && (label.scrollWidth > label.clientWidth + 0.5 || p.right > edge + 0.5)) out.push(`${where}: label cut`);
              if (sameLine && width > 200 && textWidth(name) > n.width + 0.5) out.push(`${where}: title cut beside the pill`);
              if (!sameLine && p.top < n.bottom - 0.5) out.push(`${where}: pill neither after the title nor under it`);
            }
            const banner = t.closest(sel.banner || ".banner");
            if (!banner) continue;
            const box = banner.getBoundingClientRect();
            const floor = (sel.ground && banner.querySelector(sel.ground)?.getBoundingClientRect().top) ?? box.bottom - (sel.groundPx || 0);
            for (const el of [t, ...t.querySelectorAll("*")]) {
              const r = el.getBoundingClientRect();
              if (!r.width || !r.height) continue;
              if (r.top < box.top - 0.5 || r.bottom > floor + 0.5 || r.left < box.left - 0.5 || r.right > box.right + 0.5) {
                out.push(`${where}: ${el.className || el.tagName} out of the banner or on its ground strip`);
                break;
              }
            }
          }
        };
        for (const [type, config] of variants)
          for (const illustration of [true, false])
            for (const lang of languages)
              for (const width of widths) {
                document.body.innerHTML = "";
                const outer = document.body.appendChild(document.createElement("div"));
                outer.style.width = `${width}px`;
                const card = document.createElement(type);
                // Keys starting with "_" pick the mock data (see hass), they are not card options.
                card.setConfig({ type: `custom:${type}`, ...Object.fromEntries(Object.entries(config).filter(([k]) => !k.startsWith("_"))), illustration });
                card.hass = hass(lang, config);
                outer.appendChild(card);
                await frame();
                const where = `${type} ${JSON.stringify(config)} ${illustration ? "banner" : "classic"} ${lang} ${width}px`;
                check(card.shadowRoot, where, width);
                const zoom = card.shadowRoot.querySelector(sel.zoom);
                if (!type.includes("mini") || !zoom) continue;
                zoom.click();
                await frame();
                check(card.shadowRoot, `${where} expanded`, width);
              }
        return { bad: out, dots };
      },
      { variants: VARIANTS, languages: LANGUAGES, widths: WIDTHS, data: DATA, sel: SEL },
    );
    // Where the height guard (or a label longer than the row) left the dot alone above 200 px.
    if (dots.length) t.diagnostic(`dot only: ${dots.join("; ")}`);
    assert.deepEqual(bad, []);
  } finally {
    await page.close();
  }
});
