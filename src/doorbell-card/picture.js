// ---------------------------------------------------------------------------
// Picture: a drawn video doorbell, colored and animated by its state
// ---------------------------------------------------------------------------
import { esc } from "./helpers.js";

// State colors, as in the other ha-* cards; also used by the picture, an <img> that cannot read CSS variables.
export const STATE_COLORS = { ok: "#43a047", warn: "#ffa600", crit: "#db4437", active: "#039be5", idle: "#9e9e9e", ringing: "#ef6c00" };

// Case finishes: [light, dark, rim, faceplate].
export const FINISHES = {
  dark: ["#4a4e54", "#232528", "#5d6168", "#16181b"],
  white: ["#fbfbfa", "#d9dad7", "#c4c5c2", "#2a2d31"],
  steel: ["#f1f2f3", "#9ea3a9", "#b9bdc2", "#1d2024"],
};
// Finish of the brands sold mostly in one color (Nest and UniFi doorbells in white, DoorBird in stainless steel).
export const BRAND_FINISH = { nest: "white", unifiprotect: "white", doorbird: "steel" };

// Animations of the picture. The picture is an <img>: its CSS animations run, no script does.
//   ringing — the doorbell vibrates, its button ring glows and sound waves leave both sides
//   motion  — radar arcs sweep above the lens and the infrared LEDs blink
//   person  — a detection frame closes in on the lens
export const ANIM_CSS = `
  .vib { transform-box: view-box; transform-origin: 40px 118px; animation: vib 1s ease-in-out infinite; }
  .glow { animation: glow .75s ease-in-out infinite alternate; }
  .wv { animation: wv 1.5s ease-out infinite; opacity: 0; }
  .d1 { animation-delay: .25s; } .d2 { animation-delay: .5s; }
  .ir { animation: ir 1.5s steps(1, end) infinite; }
  .frame { transform-box: view-box; transform-origin: 40px 38px; animation: frame 1.5s ease-in-out infinite; }
  @keyframes vib { 0%, 50%, 100% { transform: rotate(0deg); } 10% { transform: rotate(-3deg); } 20% { transform: rotate(3deg); }
                   30% { transform: rotate(-2deg); } 40% { transform: rotate(2deg); } }
  @keyframes glow { from { opacity: .35; } to { opacity: 1; } }
  @keyframes wv { 0% { opacity: 0; } 25% { opacity: 1; } 100% { opacity: 0; } }
  @keyframes ir { 0% { opacity: 1; } 50% { opacity: .25; } }
  @keyframes frame { 0%, 100% { transform: scale(1.18); opacity: .4; } 50% { transform: scale(1); opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`;

// The doorbell picture as an SVG document (finish, state color class, animation).
export const doorbellSvg = (finish, cls, anim) => {
  const f = FINISHES[finish] || FINISHES.dark;
  const led = STATE_COLORS[cls] || STATE_COLORS.ok;
  const blue = STATE_COLORS.active;
  const arcs = (side) =>
    [0, 1, 2]
      .map((i) => {
        const x = side < 0 ? 15 - i * 5 : 65 + i * 5;
        const dx = side * 5;
        return `<path class="wv d${i}" d="M${x} ${78 - i * 4} q${dx} ${14 + i * 4} 0 ${28 + i * 8}" fill="none" stroke="${led}" stroke-width="2.4" stroke-linecap="round"/>`;
      })
      .join("");
  const radar = [0, 1, 2]
    .map((i) => `<path class="wv d${i}" d="M${30 - i * 5} ${11 - i * 3} q${10 + i * 5} ${-8 - i * 2} ${20 + i * 10} 0" fill="none" stroke="${blue}" stroke-width="2.2" stroke-linecap="round"/>`)
    .join("");
  const corner = (x, y, sx, sy) => `<path d="M${x} ${y + sy * 5}v${-sy * 5}h${sx * 5}" fill="none" stroke="${blue}" stroke-width="2" stroke-linecap="round"/>`;
  const frame = `<g class="frame">${corner(26, 24, 1, 1)}${corner(54, 24, -1, 1)}${corner(26, 52, 1, -1)}${corner(54, 52, -1, -1)}</g>`;
  const ir = (x) => `<circle class="${anim === "motion" ? "ir" : ""}" cx="${x}" cy="38" r="1.3" fill="${anim === "motion" ? "#ff5252" : "#3a3d42"}"/>`;
  const body = `
    <rect x="20" y="16" width="40" height="100" rx="20" fill="url(#g)" stroke="${f[2]}"/>
    <rect x="24" y="20" width="32" height="56" rx="16" fill="${f[3]}"/>
    <circle cx="40" cy="38" r="11" fill="#0b0d10" stroke="#2c3036" stroke-width="1.5"/>
    <circle cx="40" cy="38" r="6.5" fill="url(#lens)"/>
    <circle cx="37.6" cy="35.6" r="1.8" fill="#fff" opacity=".7"/>
    ${ir(30)}${ir(50)}
    <rect x="32" y="60" width="16" height="2" rx="1" fill="#474b52"/><rect x="32" y="65" width="16" height="2" rx="1" fill="#474b52"/>
    <circle cx="40" cy="94" r="12.5" fill="none" stroke="${led}" stroke-width="2.6" class="${anim === "ringing" ? "glow" : ""}"/>
    <circle cx="40" cy="94" r="9" fill="url(#r)" stroke="${f[2]}"/>
    <path d="M36.2 97.4h7.6l-1-1.4v-3.6a2.8 2.8 0 0 0-5.6 0v3.6zM38.6 98.6a1.4 1.4 0 0 0 2.8 0z" fill="${f[2]}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 128"><defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${f[0]}"/><stop offset="1" stop-color="${f[1]}"/></linearGradient>
    <radialGradient id="r" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="${f[0]}"/><stop offset="1" stop-color="${f[1]}"/></radialGradient>
    <radialGradient id="lens" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#3b5a7a"/><stop offset=".6" stop-color="#14202c"/><stop offset="1" stop-color="#05080b"/></radialGradient>
  </defs><style>${ANIM_CSS}</style>
  <ellipse cx="40" cy="122" rx="16" ry="3" fill="#000" opacity=".16"/>
  ${anim === "ringing" ? arcs(-1) + arcs(1) : ""}${anim === "motion" ? radar : ""}
  <g class="${anim === "ringing" ? "vib" : ""}">${body}</g>${anim === "person" ? frame : ""}</svg>`;
};

export const pictureUri = (finish, cls, anim) => `data:image/svg+xml,${encodeURIComponent(doorbellSvg(finish, cls, anim))}`;

// Inlined pictures (data: URIs) are written as <img data-img="id"> and get their src once, then the same node is moved
// into every later render: the HTML stays small and the picture is not decoded again on each update.
export const DATA_IMGS = [];
export const DATA_IMG_IDS = new Map();
export const imgTag = (src, attrs) => {
  if (!String(src).startsWith("data:")) return `<img src="${esc(src)}" ${attrs}>`;
  let id = DATA_IMG_IDS.get(src);
  if (id === undefined) {
    id = DATA_IMGS.push(src) - 1;
    DATA_IMG_IDS.set(src, id);
  }
  return `<img data-img="${id}" ${attrs}>`;
};

export const LANGUAGES = [
  ["en", "English"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["es", "Español"],
  ["sr", "Српски"],
  ["sr-Latn", "Srpski (latinica)"],
  ["it", "Italiano"],
  ["nl", "Nederlands"],
  ["pt", "Português (Portugal)"],
  ["pl", "Polski"],
  ["ro", "Română"],
  ["da", "Dansk"],
  ["sv", "Svenska"],
  ["bg", "Български"],
  ["ru", "Русский"],
  ["uk", "Українська"],
  ["hu", "Magyar"],
  ["sk", "Slovenčina"],
  ["cs", "Čeština"],
  ["sl", "Slovenščina"],
  ["lv", "Latviešu"],
  ["el", "Ελληνικά"],
];
