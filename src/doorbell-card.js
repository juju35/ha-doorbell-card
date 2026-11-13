/*
 * Doorbell Card for Home Assistant
 * https://github.com/juju35/ha-doorbell-card
 *
 * Lovelace cards for video doorbells and intercoms, whatever the integration: Ring, Reolink, UniFi Protect,
 * Google Nest, Tapo, DoorBird, Aqara (Matter / HomeKit), Frigate, eufy, Blink…
 * The doorbell's entities (event, binary_sensor, camera, lock, button, switch, image) are found through the entity
 * and device registries, so they work whatever the Home Assistant language or entity ids; each one can be set by
 * hand too. The translations (STRINGS) are in src/strings.js, bundled before this file by scripts/build.mjs.
 */

const VERSION = "__VERSION__";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Brand of the device, from the integration (platform) that provides it.
const PLATFORMS = {
  ring: "Ring",
  reolink: "Reolink",
  unifiprotect: "UniFi Protect",
  nest: "Google Nest",
  tapo_control: "Tapo",
  tapo: "Tapo",
  doorbird: "DoorBird",
  matter: "Matter",
  homekit_controller: "HomeKit",
  frigate: "Frigate",
  eufy_security: "eufy",
  blink: "Blink",
  amcrest: "Amcrest",
  hikvision: "Hikvision",
  onvif: "ONVIF",
  aqara: "Aqara",
};

// Entity roles, recognized from the translation key or the entity id (the object id, without its domain).
const DOORBELL_RE = /(^|_)(ding|doorbell|visitor|ring|rings|chime|pressed|button_pressed|press|call)(_|$)/;
const MOTION_RE = /(^|_)motion(_|$)/;
const PERSON_RE = /(^|_)(person|people|human|face|occupancy)(_|$)/;
const PERSON_FIRST_RE = /(^|_)(person|people|human)(_|$)/;
// Detections of their own, which some integrations (Reolink) give the motion device class too.
const DETECTION_RE = /(^|_)(person|people|human|face|occupancy|vehicle|pet|animal|package|cry|tamper|visitor|ding|doorbell)(_|$)/;
const OPENER_RE = /(^|_)(open|opener|unlock|relay|relay_\d+|gate|strike|door|buzzer|intercom)(_|$)/;
const MUTE_RE = /(^|_)(mute|muted|do_not_disturb|dnd|silent|silence|button_sound|chime|chime_sound|ringtone|doorbell_sound)(_|$)/;
// A switch named after the sound itself (chime, button sound) is on while the doorbell rings aloud: muted when off.
const SOUND_RE = /(^|_)(button_sound|chime|chime_sound|ringtone|doorbell_sound)(_|$)/;
const MESSAGE_RE = /(^|_)(message|lcd|lcd_message|doorbell_text|text)(_|$)/;
// Camera entities that are a second view of the same camera (Reolink "clear" main stream, snapshot archives).
const SECONDARY_CAMERA_RE = /(_clear|_snapshots?|_package|_telephoto|_ext)$/;

const DEFAULT_COLLAPSED = ["details"];
const DEFAULT_RING_SECONDS = 30;
const DEFAULT_HISTORY_HOURS = 24;
const DEFAULT_HISTORY_COUNT = 5;
const DEFAULT_REFRESH = 10;
const HISTORY_REFETCH_MS = 10 * 60 * 1000;
// Snapshots taken by the card when a ring arrives, kept for the history while the page is open.
const MAX_CAPTURES = 10;
// Switches and openers only change on the next poll of some integrations: the requested state is shown meanwhile.
const PENDING_MS = 20000;
const CONFIRM_GUARD_MS = 400;
// Time the Open button shows the request in progress (and ignores another press).
const OPENING_MS = 4000;
const OPENER_DOMAINS = ["lock", "button", "switch", "script", "input_button"];

const ICONS = {
  doorbell:
    "M10 2h4a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zM12 4.8a2.2 2.2 0 1 0 0 4.4a2.2 2.2 0 1 0 0-4.4zM12 13.4a2.6 2.6 0 1 0 0 5.2a2.6 2.6 0 1 0 0-5.2z",
  bell_ring:
    "M21,19V20H3V19L5,17V11C5,7.9 7.03,5.17 10,4.29C10,4.19 10,4.1 10,4A2,2 0 0,1 12,2A2,2 0 0,1 14,4C14,4.1 14,4.19 14,4.29C16.97,5.17 19,7.9 19,11V17L21,19M14,21A2,2 0 0,1 12,23A2,2 0 0,1 10,21M19.75,3.19L18.33,4.61C20.04,6.3 21,8.6 21,11H23C23,8.07 21.84,5.25 19.75,3.19M1,11H3C3,8.6 3.96,6.3 5.67,4.61L4.25,3.19C2.16,5.25 1,8.07 1,11Z",
  person: "M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z",
  motion:
    "M13.5,5.5C14.59,5.5 15.5,4.58 15.5,3.5C15.5,2.38 14.59,1.5 13.5,1.5C12.39,1.5 11.5,2.38 11.5,3.5C11.5,4.58 12.39,5.5 13.5,5.5M9.89,19.38L10.89,15L13,17V23H15V15.5L12.89,13.5L13.5,10.5C14.79,12 16.79,13 19,13V11C17.09,11 15.5,10 14.69,8.58L13.69,7C13.29,6.38 12.69,6 12,6C11.69,6 11.5,6.08 11.19,6.08L6,8.28V13H8V9.58L9.79,8.88L8.19,17L3.29,16L2.89,18L9.89,19.38Z",
  lock: "M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z",
  lock_open:
    "M18,1C15.24,1 13,3.24 13,6V8H4C2.9,8 2,8.89 2,10V20C2,21.11 2.9,22 4,22H16C17.11,22 18,21.11 18,20V10C18,8.9 17.11,8 16,8H15V6C15,4.34 16.34,3 18,3C19.66,3 21,4.34 21,6V8H23V6C23,3.24 20.76,1 18,1M10,13C11.1,13 12,13.89 12,15C12,16.11 11.11,17 10,17C8.9,17 8,16.11 8,15C8,13.9 8.9,13 10,13Z",
  door_open: "M12,3C10.89,3 10,3.89 10,5H3V19H2V21H22V19H21V5C21,3.89 20.11,3 19,3H12M12,5H19V19H12V5M5,11H7V13H5V11Z",
  message: "M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4C22,2.89 21.1,2 20,2M6,9H18V11H6M14,14H6V12H14M18,8H6V6H18",
  volume_off:
    "M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z",
  volume_high:
    "M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z",
  chevron_down: "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
  expand: "M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z",
  collapse: "M19.5,3.09L15,7.59V4H13V11H20V9H16.41L20.91,4.5L19.5,3.09M4,13V15H7.59L3.09,19.5L4.5,20.91L9,16.41V20H11V13H4Z",
  battery: "M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z",
  history:
    "M13.5,8H12V13L16.28,15.54L17,14.33L13.5,12.25V8M13,3A9,9 0 0,0 4,12H1L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3",
  info: "M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z",
  clock:
    "M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z",
  video_off: "M3.27,2L2,3.27L4.73,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16C16.2,18 16.39,17.92 16.54,17.82L19.73,21L21,19.73M21,6.5L17,10.5V7A1,1 0 0,0 16,6H9.82L21,17.18V6.5Z",
  send: "M2,21L23,12L2,3V10L17,12L2,14V21Z",
};

// ---------------------------------------------------------------------------
// Picture: a drawn video doorbell, colored and animated by its state
// ---------------------------------------------------------------------------

// State colors, as in the other ha-* cards; also used by the picture, an <img> that cannot read CSS variables.
const STATE_COLORS = { ok: "#43a047", warn: "#ffa600", crit: "#db4437", active: "#039be5", idle: "#9e9e9e", ringing: "#ef6c00" };

// Case finishes: [light, dark, rim, faceplate].
const FINISHES = {
  dark: ["#4a4e54", "#232528", "#5d6168", "#16181b"],
  white: ["#fbfbfa", "#d9dad7", "#c4c5c2", "#2a2d31"],
  steel: ["#f1f2f3", "#9ea3a9", "#b9bdc2", "#1d2024"],
};
// Finish of the brands sold mostly in one color (Nest and UniFi doorbells in white, DoorBird in stainless steel).
const BRAND_FINISH = { nest: "white", unifiprotect: "white", doorbird: "steel" };

// Animations of the picture. The picture is an <img>: its CSS animations run, no script does.
//   ringing — the doorbell vibrates, its button ring glows and sound waves leave both sides
//   motion  — radar arcs sweep above the lens and the infrared LEDs blink
//   person  — a detection frame closes in on the lens
const ANIM_CSS = `
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
const doorbellSvg = (finish, cls, anim) => {
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

const pictureUri = (finish, cls, anim) => `data:image/svg+xml,${encodeURIComponent(doorbellSvg(finish, cls, anim))}`;

// Inlined pictures (data: URIs) are written as <img data-img="id"> and get their src once, then the same node is moved
// into every later render: the HTML stays small and the picture is not decoded again on each update.
const DATA_IMGS = [];
const DATA_IMG_IDS = new Map();
const imgTag = (src, attrs) => {
  if (!String(src).startsWith("data:")) return `<img src="${esc(src)}" ${attrs}>`;
  let id = DATA_IMG_IDS.get(src);
  if (id === undefined) {
    id = DATA_IMGS.push(src) - 1;
    DATA_IMG_IDS.set(src, id);
  }
  return `<img data-img="${id}" ${attrs}>`;
};

const LANGUAGES = [
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

// Locale for Intl: the card's language option, else Home Assistant's full locale (keeps its region) when its base
// matches the card language. A bare "pt" (European Portuguese) becomes "pt-PT", otherwise Intl writes it the Brazilian way.
const intlLocale = (hass, config) => {
  const l = lang(hass, config);
  const src = config?.language || (hass && (hass.locale?.language || hass.language)) || "";
  const out = src && src.split("-")[0] === l.split("-")[0] ? src : l;
  return out === "pt" ? "pt-PT" : out;
};

const t = (hass, config, key, vars = {}) => String(STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

const valid = (s) => !!s && !["unknown", "unavailable", ""].includes(s.state);
const domainOf = (id) => String(id || "").split(".")[0];
const objectId = (id) => String(id || "").split(".").slice(1).join(".");
const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="${path === ICONS.doorbell ? "evenodd" : "nonzero"}" d="${path}"/></svg>`;
const sameDeps = (a, b) => !!a && a.length === b.length && a.every((d, i) => d === b[i]);
const clampInt = (v, def, min, max) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : def;
};

// Percentages are whole numbers.
const pct = (v) => `${Math.round(v)} %`;

// True when an event entity's last event (or a recorded one, `attrs`) counts: an entity that has the standard "ring"
// event type (doorbell device class) counts only its rings; button events count their presses, not the releases
// that follow them (Matter, HomeKit). `types` are the entity's event types, from its current state.
const countedEvent = (eventType, types) => {
  if (!eventType) return true;
  if (Array.isArray(types) && types.includes("ring")) return eventType === "ring";
  return !/(^|_)(release|ongoing)(_|$)/.test(eventType);
};

// Time of an entity's state as a timestamp (ms): an event entity's state is the time of its last event.
const eventTime = (s) => {
  if (!valid(s) || !countedEvent(s.attributes?.event_type, s.attributes?.event_types)) return null;
  const v = Date.parse(s.state);
  return Number.isFinite(v) ? v : null;
};

// True for a time of the last `seconds` (a minute ahead allowed: the device's clock may run a little fast).
const recent = (ms, seconds) => ms !== null && Date.now() - ms < seconds * 1000 && ms - Date.now() < 60000;

// Time an entity last turned on (binary_sensor), or its last event (event entity); null when unknown.
const lastOn = (s) => {
  if (!s) return null;
  if (domainOf(s.entity_id) === "event") return eventTime(s);
  if (s.state === "on") return Date.parse(s.last_changed) || null;
  return null;
};

// One formatter per locale and kind, built on first use.
const FMT = {};
const fmt = (locale, kind, opts) => (FMT[`${locale}|${kind}`] ??= kind === "rel" ? new Intl.RelativeTimeFormat(locale, opts) : new Intl.DateTimeFormat(locale, opts));

const ago = (locale, ms, now = Date.now()) => {
  if (!Number.isFinite(ms)) return "";
  const diff = (ms - now) / 1000;
  const abs = Math.abs(diff);
  const rtf = fmt(locale, "rel", { numeric: "auto" });
  if (abs < 45) return rtf.format(0, "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86400), "day");
};

const clock = (locale, ms) => fmt(locale, "time", { hour: "numeric", minute: "2-digit" }).format(ms);

const startOfDay = (ms) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// "Today", "Yesterday" or a short date, for the ring history.
const dayLabel = (hass, config, ms, now = Date.now()) => {
  const days = Math.round((startOfDay(now) - startOfDay(ms)) / 86400000);
  if (days === 0) return t(hass, config, "today");
  if (days === 1) return t(hass, config, "yesterday");
  return fmt(intlLocale(hass, config), "day", { weekday: "short", day: "numeric", month: "short" }).format(ms);
};

// Ring times (ms, newest first) from a history/history_during_period answer for one entity, since `since`.
// An event entity's state is the time of each ring; a binary_sensor rings when it turns on.
// `types`: the event types of an event entity (its current state's), to leave out what is not a ring.
const ringsFromHistory = (entityId, rows, since, types) => {
  const out = new Set();
  const domain = domainOf(entityId);
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!r || ["unknown", "unavailable", ""].includes(r.s)) continue;
    let ms = null;
    if (domain === "event") {
      if (r.a && !countedEvent(r.a.event_type, types)) continue;
      ms = Date.parse(r.s);
    } else if (r.s === "on") {
      const sec = r.lc ?? r.lu;
      ms = typeof sec === "number" ? Math.round(sec * 1000) : Date.parse(sec);
    }
    if (Number.isFinite(ms) && ms >= since) out.add(ms);
  }
  return [...out].sort((a, b) => b - a);
};

// Snapshot URL refreshed by a query parameter (a camera proxy URL always returns the latest picture).
const freshUrl = (url, stamp) => {
  if (!url || String(url).startsWith("data:")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}_ts=${stamp}`;
};

// ---------------------------------------------------------------------------
// Registry-based resolution
// ---------------------------------------------------------------------------

const _cache = new WeakMap();

// Entity id form of a name, as Home Assistant writes it ("Front door" → front_door).
const slugify = (v) =>
  String(v || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

// Entity id prefixes a device gives its entities: its names, slugified.
const deviceSlugs = (d) => [...new Set([d?.name_by_user, d?.name].map(slugify).filter(Boolean))];

// The key an entity is recognized by: its translation key and its object id without the device's name, which would
// otherwise lend every entity of a device called "Front door" or "Doorbell" the words door and doorbell.
const roleKey = (e, slugs = []) => {
  let oid = objectId(e.entity_id);
  for (const s of slugs) {
    if (oid === s) oid = "";
    else if (oid.startsWith(`${s}_`)) oid = oid.slice(s.length + 1);
    else continue;
    break;
  }
  return `${e.translation_key || ""} ${oid}`;
};
const deviceClassOf = (hass, id) => hass.states?.[id]?.attributes?.device_class;

// First entity of `list` that matches `test`, in the order of the list.
const pick = (list, test) => list.find(test)?.entity_id;

// Roles of a device's entities: camera, doorbell, motion, person, opener, mute, snapshot, battery, message.
const roles = (hass, list, slugs = []) => {
  const of = (...domains) => list.filter((e) => domains.includes(domainOf(e.entity_id)));
  const keyMatch = (re) => (e) => roleKey(e, slugs).split(" ").some((k) => re.test(k));
  // Openers are never configuration or diagnostic entities (restart button, child lock…).
  const primary = (e) => !e.entity_category;
  const cameras = of("camera").sort((a, b) => SECONDARY_CAMERA_RE.test(a.entity_id) - SECONDARY_CAMERA_RE.test(b.entity_id));
  const sensors = of("event", "binary_sensor");
  const doorbell =
    pick(sensors, (e) => deviceClassOf(hass, e.entity_id) === "doorbell") ||
    pick(sensors, (e) => keyMatch(DOORBELL_RE)(e) && !keyMatch(MOTION_RE)(e) && !keyMatch(MUTE_RE)(e));
  const others = sensors.filter((e) => e.entity_id !== doorbell);
  // Named motion first: person, vehicle or package sensors may have the motion device class too (Reolink).
  const motion = pick(others, keyMatch(MOTION_RE)) || pick(others, (e) => deviceClassOf(hass, e.entity_id) === "motion" && !keyMatch(DETECTION_RE)(e));
  const people = others.filter((e) => e.entity_id !== motion);
  const person = pick(people, keyMatch(PERSON_FIRST_RE)) || pick(people, keyMatch(PERSON_RE));
  const opener =
    pick(of("lock"), primary) ||
    pick(of("button", "input_button"), (e) => primary(e) && keyMatch(OPENER_RE)(e)) ||
    pick(of("switch"), (e) => primary(e) && keyMatch(OPENER_RE)(e) && !keyMatch(MUTE_RE)(e));
  const mute = pick(of("switch", "input_boolean"), keyMatch(MUTE_RE));
  const snapshot = pick(of("image"), () => true);
  const battery = pick(of("sensor"), (e) => deviceClassOf(hass, e.entity_id) === "battery" || keyMatch(/(^|_)battery(_level)?$/)(e));
  // Quick messages: a text entity takes any text (UniFi Protect "Doorbell" text, the LCD message); a select offers
  // its own list (UniFi Protect "Doorbell text").
  const messageText = pick(of("text"), (e) => keyMatch(MESSAGE_RE)(e) || (e.platform === "unifiprotect" && e.translation_key === "doorbell"));
  const messageSelect = pick(of("select"), keyMatch(MESSAGE_RE));
  return { camera: cameras[0]?.entity_id, doorbell, motion, person, opener, mute, snapshot, battery, message: messageText || messageSelect, message_select: messageSelect };
};

/**
 * The doorbells of the instance: { devices: [{ id, name, brand, model, roles }] }, every device with a doorbell
 * entity (an event of device class doorbell, or an event / binary_sensor named after a ring), sorted by name.
 * `all` keeps every device by id (cameras without a doorbell too), for a device picked by hand.
 */
const resolve = (hass) => {
  if (!hass?.entities || !hass.devices) return null;
  const cached = _cache.get(hass.entities);
  // Rebuilt when the registries change, not on every state change (device classes do not change with the state).
  if (cached && cached.devices === hass.devices) return cached.model;
  const byDevice = new Map();
  for (const e of Object.values(hass.entities)) {
    if (!e?.device_id || e.hidden || e.disabled_by) continue;
    const list = byDevice.get(e.device_id) || [];
    list.push(e);
    byDevice.set(e.device_id, list);
  }
  const all = new Map();
  for (const [id, list] of byDevice) {
    const d = hass.devices[id];
    if (!d) continue;
    const slugs = deviceSlugs(d);
    const r = roles(hass, list, slugs);
    if (!r.doorbell && !r.camera) continue;
    const platform = list.find((e) => PLATFORMS[e.platform])?.platform || list[0].platform;
    all.set(id, {
      id,
      name: d.name_by_user || d.name || id,
      brand: d.manufacturer || PLATFORMS[platform] || "",
      integration: PLATFORMS[platform] || platform || "",
      platform,
      model: d.model || "",
      slugs,
      roles: r,
    });
  }
  const devices = [...all.values()].filter((d) => d.roles.doorbell).sort((a, b) => a.name.localeCompare(b.name));
  const model = { devices, all };
  _cache.set(hass.entities, { devices: hass.devices, model });
  return model;
};

const listDevices = (hass) => {
  const m = resolve(hass);
  if (!m) return [];
  const doorbells = m.devices.map((d) => ({ value: d.id, label: d.name }));
  const cameras = [...m.all.values()].filter((d) => !d.roles.doorbell).sort((a, b) => a.name.localeCompare(b.name));
  return [...doorbells, ...cameras.map((d) => ({ value: d.id, label: d.name }))];
};

// Entity options that override (or stand in for) what the registries give.
const ROLE_OPTIONS = { camera: "camera", doorbell: "doorbell", motion: "motion", person: "person", opener: "lock", mute: "mute", snapshot: "snapshot", battery: "battery", message: "message_entity" };

/**
 * The device the card shows, with its entity roles merged with the entity options. Without `device`, the device of
 * the `doorbell` or `camera` option, else the first doorbell. A card given only entities (no device in the
 * registries, a YAML camera…) still works: it gets a device of its own, named after the camera or the doorbell.
 */
const findDevice = (hass, config) => {
  const m = resolve(hass);
  if (!m) return { error: "no_registry" };
  let dev;
  if (config.device) {
    dev = m.all.get(config.device) || [...m.all.values()].find((d) => d.name === config.device);
    if (!dev) return { error: "unknown_device" };
  } else {
    const given = config.doorbell || config.camera;
    const owner = given && hass.entities[given]?.device_id;
    dev = (owner && m.all.get(owner)) || (!given ? m.devices[0] : null);
    if (!dev && given) {
      const s = hass.states[given];
      dev = { id: "", name: s?.attributes?.friendly_name || given, brand: "", integration: "", model: "", slugs: [], roles: {} };
    }
  }
  if (!dev) return { error: "no_device" };
  const r = { ...dev.roles };
  for (const [role, opt] of Object.entries(ROLE_OPTIONS)) if (config[opt]) r[role] = config[opt];
  // A message entity set by hand replaces the device's message select as well, unless it is one.
  if (config.message_entity) r.message_select = domainOf(config.message_entity) === "select" ? config.message_entity : undefined;
  return { dev: { ...dev, roles: r } };
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const BASE_STYLE = `
  :host { --db-accent: #ef6c00; --db-ok: var(--success-color, #43a047); --db-warn: var(--warning-color, #ffa600);
          --db-crit: var(--error-color, #db4437); --db-idle: var(--disabled-text-color, #9e9e9e); --db-active: var(--info-color, #039be5);
          /* Text in a state or accent color is mixed with the text color, so that it reads at 4.5:1 at least. */
          --db-accent-text: color-mix(in srgb, var(--db-accent) 55%, var(--primary-text-color));
          --db-glass: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
          --db-glass-hover: color-mix(in srgb, var(--primary-text-color) 11%, transparent);
          --db-line: var(--divider-color, rgba(127,127,127,.25)); }
  /* The card follows the width it is given (Sections view columns, mini card): container queries below. */
  ha-card { overflow: hidden; container-type: inline-size; }
  /* A size container has no width of its own content: this empty grid gives the card a natural width without a
     minimum, so that it still shrinks to its track in a grid or a flex row. */
  :host { display: block; min-width: 0; --db-natural-width: 400px; }
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, var(--db-natural-width)); height: 0; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .muted { color: var(--secondary-text-color); }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible, button:focus-visible { outline: 2px solid var(--primary-color, var(--db-accent)); outline-offset: 2px; }
  .ok { --c: var(--db-ok); } .warn { --c: var(--db-warn); } .crit { --c: var(--db-crit); } .idle { --c: var(--db-idle); }
  .active { --c: var(--db-active); } .ringing { --c: var(--db-accent); }
  /* Texts in a state color are mixed with the text color: tinted, and readable at 4.5:1 in both themes. */
  .ok, .warn, .crit, .idle, .active, .ringing { --ink: color-mix(in srgb, var(--c) 45%, var(--primary-text-color, #212121)); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c, var(--db-ok)); flex: none; display: inline-block; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; white-space: nowrap;
          background: color-mix(in srgb, var(--c, var(--db-ok)) 15%, transparent); color: color-mix(in srgb, var(--c, var(--db-ok)) 55%, var(--primary-text-color));
          flex: 0 1 auto; min-width: 0; max-width: 50%; overflow: hidden; box-sizing: border-box; }
  .chip-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  /* Header: the 40 px icon, then the title line (name, status chip, detail button) above the subtitle, so that the
     chip always sits on the line of the title. */
  .header { display: flex; align-items: flex-start; gap: 10px; padding: 12px 12px 0; }
  .type-icon { position: relative; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex: none;
               --db-tint: var(--c, var(--db-accent)); background: color-mix(in srgb, var(--db-tint) 16%, transparent); transition: background-color .3s ease; }
  .type-icon .icon { width: 24px; height: 24px; fill: color-mix(in srgb, var(--db-tint) 70%, var(--primary-text-color)); transition: fill .3s ease; }
  .titles { flex: 1 1 0; min-width: 5ch; display: flex; flex-direction: column; justify-content: center; min-height: 40px; }
  .title-row { display: flex; align-items: center; gap: 8px; min-width: 0; min-height: 20px; }
  .name { flex: 1 1 0; min-width: 4ch; font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  :host([hide-title]) .name { visibility: hidden; }
  :host([hide-subtitle]) .sub { display: none; }
  .sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .warning { padding: 16px; color: color-mix(in srgb, var(--db-warn) 55%, var(--primary-text-color)); }
  /* Buttons: never filled. Smoked glass with a thin outline; the icon takes the accent color when the action is on. */
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; font: inherit; font-size: 13px; font-weight: 500;
         padding: 6px 12px; border-radius: 18px; border: 1px solid var(--db-line); background: var(--db-glass); color: var(--primary-text-color);
         min-width: 0; box-sizing: border-box; -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }
  .btn span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .btn .icon { color: var(--secondary-text-color); }
  .btn:not(.disabled):hover { background: var(--db-glass-hover); }
  .btn.accent { border-color: color-mix(in srgb, var(--db-accent) 55%, transparent); color: var(--db-accent-text); }
  .btn.accent .icon, .btn.on .icon { color: var(--db-accent); }
  .btn.on { border-color: color-mix(in srgb, var(--db-accent) 40%, var(--db-line)); }
  .btn.round { width: 36px; height: 36px; padding: 0; border-radius: 50%; flex: none; }
  .btn.disabled { opacity: .45; cursor: default; }
  .btn.busy { cursor: progress; }
  .btn.busy .icon { animation: db-glow 1s ease-in-out infinite; }
  .zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -2px -4px -2px 0; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: var(--db-glass-hover); color: var(--primary-text-color); }
  .thumb { flex: none; border-radius: 8px; overflow: hidden; background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
           display: flex; align-items: center; justify-content: center; color: var(--secondary-text-color); }
  .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .thumb .icon { width: 20px; height: 20px; opacity: .6; }
  .line { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--secondary-text-color); min-width: 0; }
  .line span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .line .icon { width: 14px; height: 14px; }
  .picture { flex: none; display: flex; align-items: center; justify-content: center; }
  .picture img { max-width: 100%; max-height: 100%; object-fit: contain; }
  @keyframes db-shake { 0%, 50%, 100% { transform: rotate(0deg); } 10% { transform: rotate(16deg); } 20% { transform: rotate(-14deg); }
                        30% { transform: rotate(10deg); } 40% { transform: rotate(-6deg); } }
  @keyframes db-glow { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; } }
  /* Narrow card: the status chip keeps only its colored dot (its text stays in its title and aria-label). */
  @container (max-width: 250px) {
    .chip { padding: 4px; flex: none; }
    .chip-text { display: none; }
  }
`;

// In-card popup (confirmation, quick messages), at the top of the card so that it stays in view on a long card.
const DIALOG_STYLE = `
  ha-card.dialog-open { position: relative; min-height: 180px; }
  .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: flex-start; justify-content: center;
              padding-top: 12px; box-sizing: border-box; z-index: 9; border-radius: inherit; }
  .modal { background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color); width: min(92%, 340px); max-height: calc(100% - 24px); overflow: auto;
           box-sizing: border-box; border-radius: 14px; padding: 16px; box-shadow: 0 8px 30px rgba(0,0,0,.4); display: flex; flex-direction: column; gap: 12px; }
  .modal:focus { outline: none; }
  .modal .msg { font-size: 14px; line-height: 1.4; }
  .modal-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; }
  .modal-title .icon { color: var(--db-accent); }
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
  .msg-list { display: flex; flex-direction: column; gap: 6px; }
  .msg-list .btn { justify-content: flex-start; font-weight: 400; text-align: left; border-radius: 12px; padding: 8px 12px; }
  .msg-list .btn .icon { color: var(--db-accent); }
`;

const FULL_STYLE = `
  .content { padding: 10px 12px 12px; display: flex; flex-direction: column; gap: 12px; }
  .cam { position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 16 / 9; cursor: pointer;
         background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); }
  .cam img, .cam .stream > * { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
  .cam .stream { position: absolute; inset: 0; }
  .cam .none { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
               font-size: 12px; color: var(--secondary-text-color); }
  .cam .none .icon { width: 28px; height: 28px; opacity: .6; }
  .cam::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; box-shadow: inset 0 0 0 1px rgba(255,255,255,.06); }
  .cam.ringing::after { box-shadow: inset 0 0 0 3px var(--db-accent); animation: db-glow 1.5s ease-in-out infinite; }
  /* Overlays on the picture: smoked glass, white text. */
  .glass { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 12px; font-size: 11px; font-weight: 500; color: #fff;
           background: rgba(0,0,0,.38); border: 1px solid rgba(255,255,255,.18); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }
  .glass .icon { width: 14px; height: 14px; }
  .cam .badge { position: absolute; right: 8px; bottom: 8px; }
  .cam .badge .dot { background: #ff5252; }
  .cam .live .dot { animation: db-blink 1.5s step-end infinite; }
  @keyframes db-blink { 50% { opacity: .2; } }
  .cam .det { position: absolute; top: 8px; left: 8px; }
  .cam .det .icon { color: var(--c); }
  .cam .banner { position: absolute; left: 50%; bottom: 10px; transform: translateX(-50%); font-size: 13px; padding: 5px 12px; max-width: calc(100% - 24px); box-sizing: border-box; }
  .cam .banner span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cam .banner .icon { color: #ffb74d; animation: db-shake 1s ease-in-out infinite; transform-origin: 50% 12%; }
  .hero { display: flex; gap: 12px; align-items: center; min-width: 0; }
  .hero .picture { width: 72px; height: 112px; }
  .hero .picture img { filter: drop-shadow(0 4px 8px rgba(0,0,0,.18)); }
  .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .state { font-size: 22px; font-weight: 400; line-height: 1.1; color: var(--ink); overflow-wrap: anywhere; }
  .visit { font-size: 13px; color: var(--primary-text-color); }
  .visit .icon { color: var(--c, var(--secondary-text-color)); width: 16px; height: 16px; }
  .visit b { font-weight: 500; }
  .snap { width: 104px; height: 70px; border-radius: 10px; }
  .actions { display: flex; flex-wrap: wrap; gap: 6px; }
  .actions .btn { flex: 1 1 auto; }
  .section-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: .04em;
                   color: var(--secondary-text-color); margin-bottom: 6px; cursor: pointer; user-select: none; }
  .section-title .icon { width: 16px; height: 16px; }
  .section-title span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .section-title .count { margin-left: 4px; }
  .section-title[aria-expanded="false"] { margin-bottom: 0; }
  /* Folded: chevron to the right; unfolded: chevron down. */
  .section-title .chevron { margin-left: auto; transition: transform .2s ease; }
  .section-title[aria-expanded="false"] .chevron { transform: rotate(-90deg); }
  .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 6px; }
  .tile { display: flex; flex-direction: column; gap: 2px; padding: 6px 10px; border-radius: 10px; min-width: 0;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .tile .k { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; }
  .tile .k span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .tile .k .icon { width: 14px; height: 14px; color: var(--c, var(--secondary-text-color)); }
  .tile .v { font-size: 14px; font-weight: 500; line-height: 1.3; overflow-wrap: anywhere; }
  .tile:is(.warn, .crit) .v { color: var(--ink); }
  .hist { display: flex; flex-direction: column; gap: 4px; }
  .hist-row { display: flex; align-items: center; gap: 10px; padding: 4px 6px; border-radius: 10px; min-width: 0; }
  .hist-row:hover { background: var(--db-glass); }
  .hist-row .thumb { width: 44px; height: 28px; border-radius: 6px; }
  .hist-row .thumb .icon { width: 16px; height: 16px; color: var(--db-accent); opacity: 1; }
  .hist-row .day { flex: 1; min-width: 0; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hist-row .time { font-size: 13px; font-weight: 500; white-space: nowrap; }
  .hist-row .rel { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; min-width: 0; overflow: hidden; text-overflow: ellipsis; max-width: 40%; }
  .empty { font-size: 13px; color: var(--secondary-text-color); padding: 2px 6px; }
  /* Narrow cards: the snapshot gives way first, then the picture shrinks; the action buttons keep their icons only. */
  @container (max-width: 360px) {
    .snap { display: none; }
  }
  @container (max-width: 300px) {
    .hero .picture { width: 52px; height: 82px; }
    .state { font-size: 18px; }
    .actions .btn span { display: none; }
    .actions .btn { padding: 6px; }
    .hist-row .rel { display: none; }
  }
`;

const MINI_STYLE = `
  :host { --db-natural-width: 300px; }
  .content { padding: 10px 12px 12px; display: flex; align-items: center; gap: 10px; }
  .picture { width: 46px; height: 72px; }
  .picture img { filter: drop-shadow(0 2px 4px rgba(0,0,0,.18)); }
  .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
  .info .main { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .controls { display: flex; gap: 6px; flex: none; }
  @container (max-width: 280px) {
    .content { flex-wrap: wrap; row-gap: 8px; }
    .controls { flex-basis: 100%; justify-content: flex-end; }
  }
  @container (max-width: 200px) {
    .picture { display: none; }
  }
`;

// Element names of Home Assistant dialogs (the more-info opened from the card, among others).
const DIALOG_TAGS = new Set(["HA-MORE-INFO-DIALOG", "HA-DIALOG", "DIALOG"]);
const isOutside = (card, ev) => {
  const path = ev.composedPath();
  return !path.includes(card) && !path.some((n) => DIALOG_TAGS.has(n.tagName));
};

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app) a
// tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to the
// page. It counts when the press and the release are both outside the card (a slider dragged out of the card does not
// fold it), and a scroll does not count (the browser cancels the pointer). Keyboard clicks still go through the click
// event. `tap(ev)` (a press and a release at the same spot) is for the tests.
const watchOutside = (isOut, handler) => {
  let downOutside = false;
  const onDown = (ev) => {
    downOutside = isOut(ev);
  };
  const onUp = (ev) => {
    if (downOutside && isOut(ev)) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0 && isOut(ev)) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
  };
};

const FOCUS_SELECTOR = "[data-action], [data-entity]";
const focusKey = (el) => {
  const data = Object.entries({ ...el.dataset });
  return data.length ? `${el.tagName}|${JSON.stringify(data)}` : "";
};

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

class DoorbellBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this._captures = [];
    this._stamp = 0;
    // No rewrite of the card between a press and its click: Home Assistant updates the card several times a second,
    // and a rewrite under the pointer replaces the element pressed, so that the click lands on the card itself and
    // does nothing. The update held back is drawn once released: by the click (registered before the card's own
    // handler, which renders at once), else right after the release.
    this._onPress = () => {
      this._byPointer = true;
      this._pressing = true;
      window.addEventListener("pointerup", this._onPressEnd, true);
      window.addEventListener("pointercancel", this._onPressEnd, true);
    };
    this._onPressEnd = () => {
      window.removeEventListener("pointerup", this._onPressEnd, true);
      window.removeEventListener("pointercancel", this._onPressEnd, true);
      setTimeout(() => {
        this._pressing = false;
        if (this._dirty) this._update();
      }, 0);
    };
    this._onPressClick = (ev) => {
      if (ev.detail === 0) this._byPointer = false;
      this._pressing = false;
    };
    this.shadowRoot.addEventListener("pointerdown", this._onPress);
    this.shadowRoot.addEventListener("click", this._onPressClick);
    // From the keyboard, the focus is kept across rewrites (with the pointer it would draw the focus ring).
    this.shadowRoot.addEventListener("keydown", () => {
      this._byPointer = false;
    });
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    // Enter / Space on an element with the button role acts as a click, as on a <button>.
    this.shadowRoot.addEventListener("keydown", (ev) => {
      if ((ev.key !== "Enter" && ev.key !== " ") || ev.target?.getAttribute?.("role") !== "button") return;
      ev.preventDefault();
      ev.target.click();
    });
    // Escape closes the popup (as Cancel), listened on the window while it is open.
    this._onKey = (ev) => {
      if (ev.key !== "Escape" || !this._popup) return;
      ev.stopPropagation();
      this._closePopup();
    };
  }

  // Home Assistant pushes a new hass on every state change of the instance: the card is only redrawn when
  // something it shows changed (see _deps).
  set hass(hass) {
    this._hass = hass;
    this._watchRing();
    const deps = this._deps();
    if (deps && sameDeps(this._lastDeps, deps)) return;
    this._lastDeps = deps;
    this._update();
  }

  get hass() {
    return this._hass;
  }

  // What a render reads: the registries, the language, the state objects of the device's entities, and the texts
  // that move with time ("5 minutes ago", ringing for 30 s).
  _deps() {
    const h = this._hass;
    if (!h || !this._config) return null;
    const { dev } = findDevice(h, this._config);
    if (!dev) return null;
    const ids = [...Object.values(dev.roles), this._config.tts_entity];
    const last = this._lastVisit(dev);
    return [
      h.entities,
      h.devices,
      h.language,
      h.locale,
      h.themes?.darkMode,
      this._history,
      this._captures.length,
      this._ringing(dev),
      last ? ago(this._locale(), last.ms) : "",
      ...ids.map((id) => h.states[id]),
    ];
  }

  connectedCallback() {
    // A click elsewhere on the page folds the sections back to their defaults and closes the popup.
    this._outside ??= watchOutside(
      (ev) => isOutside(this, ev),
      () => {
        if (!this._toggled?.size && !this._popup) return;
        this._toggled = new Map();
        if (this._popup) this._closePopup();
        else this._update();
      },
    );
    this._outside.on();
    if (this._popup) window.addEventListener("keydown", this._onKey);
    this._onVisibility ??= () => this._syncCamera();
    document.addEventListener("visibilitychange", this._onVisibility);
    if (typeof IntersectionObserver === "function") {
      this._observer ??= new IntersectionObserver((entries) => {
        this._offscreen = !entries.at(-1).isIntersecting;
        this._syncCamera();
      });
      this._observer.observe(this);
    }
    // Relative times move on their own: re-checked every 30 s; the snapshot is refreshed every refresh_interval.
    clearInterval(this._tick);
    this._tick = setInterval(() => {
      if (!this._hass) return;
      this.hass = this._hass;
      // The recorder's history is read again every 10 minutes (HISTORY_REFETCH_MS).
      this._loadHistory();
    }, 30000);
    this._startRefresh();
    if (this._hass) this._loadHistory();
    // Back on the page after leaving it: rendered again in its default state.
    if (this._hass && this._config) this._update();
  }

  disconnectedCallback() {
    this._pressing = this._dirty = false;
    window.removeEventListener("pointerup", this._onPressEnd, true);
    window.removeEventListener("pointercancel", this._onPressEnd, true);
    clearInterval(this._tick);
    clearInterval(this._refresh);
    clearTimeout(this._ringTimer);
    clearTimeout(this._pendingTimer);
    clearTimeout(this._openingTimer);
    this._opening = 0;
    this._ringTimerFor = undefined;
    this._tick = this._refresh = null;
    this._outside?.off();
    document.removeEventListener("visibilitychange", this._onVisibility);
    // Left (another dashboard view, a conditional card hidden): back to the defaults, so that the card does not come
    // back unfolded or with its popup open.
    this._toggled = new Map();
    this._popup = null;
    window.removeEventListener("keydown", this._onKey);
    this._observer?.disconnect();
    this._stream?.remove();
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    if (config.messages !== undefined && !Array.isArray(config.messages)) throw new Error("messages must be a list");
    this._config = { ...config };
    this.toggleAttribute?.("hide-title", config.show_title === false);
    this.toggleAttribute?.("hide-subtitle", config.show_subtitle === false);
    this._html = "";
    this._lastDeps = null;
    this._history = undefined;
    this._historyFor = undefined;
    // Another device may be shown: the rings seen live start again.
    this._captures = [];
    this._seenRing = undefined;
    this._startRefresh();
    this._update();
  }

  _t(key, vars) {
    return t(this._hass, this._config, key, vars);
  }

  _locale() {
    return intlLocale(this._hass, this._config);
  }

  _s(id) {
    return id ? this._hass?.states?.[id] : undefined;
  }

  _ringSeconds() {
    return clampInt(this._config.ring_duration, DEFAULT_RING_SECONDS, 5, 600);
  }

  // Service call whose failure Home Assistant already reports (toast): handled here so that it does not end up as
  // "Uncaught (in promise)". `onError` undoes what the card showed meanwhile.
  _call(domain, service, data, onError) {
    return Promise.resolve(this._hass.callService(domain, service, data)).catch(() => onError?.());
  }

  // ---- State -------------------------------------------------------------

  // Ringing: the event entity's last ring is younger than ring_duration; a binary_sensor while it is on, and for
  // ring_duration after the card saw it turn on (Reolink's visitor sensor is on for a few seconds only).
  _ringing(dev) {
    const s = this._s(dev.roles.doorbell);
    if (!s) return false;
    if (domainOf(s.entity_id) === "event") {
      return recent(eventTime(s), this._ringSeconds());
    }
    return s.state === "on" || (s.state === "off" && recent(this._captures[0]?.ms ?? null, this._ringSeconds()));
  }

  // Motion or person seen now (a binary_sensor on, or an event of the last ring_duration seconds).
  _detected(id) {
    const s = this._s(id);
    if (!s) return false;
    if (domainOf(id) === "event") {
      return recent(eventTime(s), this._ringSeconds());
    }
    return s.state === "on";
  }

  _offline(dev) {
    const ids = [dev.roles.doorbell, dev.roles.camera].filter(Boolean);
    return ids.length > 0 && ids.every((id) => !this._s(id) || this._s(id).state === "unavailable");
  }

  // { key, cls, text, entity } of the device: offline, ringing, person, motion, door open, idle.
  _status(dev) {
    const r = dev.roles;
    const st = (key, cls, entity) => ({ key, cls, text: this._t(`st_${key}`), entity });
    if (this._offline(dev)) return st("offline", "crit", r.doorbell || r.camera);
    if (this._ringing(dev)) return st("ringing", "ringing", r.doorbell);
    if (this._detected(r.person)) return st("person", "active", r.person);
    if (this._detected(r.motion)) return st("motion", "active", r.motion);
    const lock = this._s(r.opener);
    if (domainOf(r.opener) === "lock" && ["unlocked", "open", "opening", "unlocking"].includes(lock?.state)) return st("unlocked", "warn", r.opener);
    return st("idle", "ok", r.doorbell || r.camera);
  }

  // Last visit: the last ring, else the last person, else the last motion. { ms, kind, entity }
  _lastVisit(dev) {
    const r = dev.roles;
    const ring = [lastOn(this._s(r.doorbell)), this._history?.[0], this._captures[0]?.ms].filter(Number.isFinite);
    if (ring.length) return { ms: Math.max(...ring), kind: "ring", entity: r.doorbell };
    const person = lastOn(this._s(r.person));
    if (person) return { ms: person, kind: "person", entity: r.person };
    const motion = lastOn(this._s(r.motion));
    if (motion) return { ms: motion, kind: "motion", entity: r.motion };
    return null;
  }

  // Ring times shown in the history: the recorder's, with the rings seen live since (newest first).
  _rings(dev) {
    const all = new Set([...(this._history || []), ...this._captures.map((c) => c.ms)]);
    const now = lastOn(this._s(dev.roles.doorbell));
    if (now) all.add(now);
    return [...all].sort((a, b) => b - a);
  }

  // A new ring (an event entity's new timestamp, a binary_sensor turning on): the card takes a snapshot of the
  // camera for the history, and redraws once the ringing time is over.
  _watchRing() {
    if (!this._hass || !this._config) return;
    const { dev } = findDevice(this._hass, this._config);
    if (!dev?.roles.doorbell) return;
    const at = lastOn(this._s(dev.roles.doorbell));
    const key = `${dev.roles.doorbell}|${at}`;
    if (this._seenRing === undefined) {
      // First look: a ring from before the card was shown is not a new one.
      this._seenRing = key;
    } else if (at && key !== this._seenRing) {
      this._seenRing = key;
      // An old timestamp coming back (the entity was unavailable, Home Assistant restarted) is not a new ring.
      if (recent(at, this._ringSeconds())) this._capture(dev, at);
    }
    // Once per ring: the redraw at the end of the ringing time does not schedule another one.
    if (at && this._ringTimerFor !== key) {
      clearTimeout(this._ringTimer);
      this._ringTimerFor = key;
      const left = at + this._ringSeconds() * 1000 - Date.now();
      if (left > 0) this._ringTimer = setTimeout(() => this._hass && (this.hass = this._hass), left + 50);
    }
  }

  // Snapshot of the camera at the time of a ring, kept in memory (object URL) for the history and the last visitor.
  _capture(dev, ms) {
    const url = this._s(dev.roles.camera)?.attributes?.entity_picture;
    const entry = { ms, url: url && String(url).startsWith("data:") ? url : null };
    this._captures = [entry, ...this._captures];
    // The snapshots that drop out of the list free their memory.
    for (const old of this._captures.splice(MAX_CAPTURES)) {
      old.dropped = true;
      if (old.url?.startsWith("blob:")) URL.revokeObjectURL(old.url);
    }
    if (url && !entry.url && typeof fetch === "function") {
      Promise.resolve(fetch(freshUrl(url, Date.now())))
        .then((res) => (res.ok ? res.blob() : null))
        .then((blob) => {
          if (!blob || entry.dropped || typeof URL?.createObjectURL !== "function") return;
          entry.url = URL.createObjectURL(blob);
          this._lastDeps = null;
          this._update();
        })
        .catch(() => {});
    }
    this._lastDeps = null;
  }

  // Ring history from the recorder: once, then again after a while (rings seen live are added meanwhile).
  _loadHistory() {
    const h = this._hass;
    if (!h?.callWS || !this._config || this._config.show_history === false) return;
    const { dev } = findDevice(h, this._config);
    const id = dev?.roles.doorbell;
    if (!id) return;
    const hours = clampInt(this._config.history_hours, DEFAULT_HISTORY_HOURS, 1, 24 * 30);
    const key = `${id}|${hours}`;
    if (this._historyFor === key && Date.now() - (this._historyAt || 0) < HISTORY_REFETCH_MS) return;
    this._historyFor = key;
    this._historyAt = Date.now();
    const since = Date.now() - hours * 3600000;
    // An event entity's rows keep their attributes: its event type tells a ring from another event.
    const event = domainOf(id) === "event";
    Promise.resolve(
      h.callWS({
        type: "history/history_during_period",
        start_time: new Date(since).toISOString(),
        entity_ids: [id],
        minimal_response: !event,
        no_attributes: !event,
        significant_changes_only: false,
      }),
    )
      .then((res) => {
        if (this._historyFor !== key) return;
        this._history = ringsFromHistory(id, res?.[id], since, this._s(id)?.attributes?.event_types);
        this._update();
      })
      .catch(() => {
        if (this._historyFor !== key) return;
        this._history = [];
        this._update();
      });
  }

  // ---- Rendering ---------------------------------------------------------

  _update() {
    if (!this._hass || !this._config) return;
    // Held back under a press (see the constructor): drawn once released.
    if (this._pressing) {
      this._dirty = true;
      return;
    }
    this._dirty = false;
    if (this._historyFor === undefined) this._loadHistory();
    let html = this._render();
    if (this._popup) html = html.replace(/<ha-card>([\s\S]*)<\/ha-card>\s*$/, (_, inner) => `<ha-card class="dialog-open">${inner}${this._popupHtml()}</ha-card>`);
    if (html !== this._html) {
      const kept = this._popup || this._byPointer ? null : this._focusedSpot();
      this._html = html;
      this.shadowRoot.innerHTML = html;
      this._placeImages();
      this._placeCamera();
      if (kept) this._restoreFocus(kept);
      // The dialog itself takes the focus (Tab reaches its buttons): Enter can never open the door or send a message by mistake.
      if (this._popup) this.shadowRoot.querySelector(".modal")?.focus({ preventScroll: true });
    }
    this._syncCamera();
  }

  _focusedSpot() {
    const el = this.shadowRoot.activeElement;
    if (!el?.dataset) return null;
    const key = focusKey(el);
    if (!key) return null;
    const index = this._focusables(key).indexOf(el);
    return index < 0 ? null : { key, index };
  }

  _focusables(key) {
    return [...this.shadowRoot.querySelectorAll(FOCUS_SELECTOR)].filter((n) => focusKey(n) === key);
  }

  _restoreFocus({ key, index }) {
    this._focusables(key)[index]?.focus({ preventScroll: true });
  }

  _errorCard(key) {
    return `<style>${BASE_STYLE}</style><ha-card><div class="warning">${esc(key === "unknown_device" ? `${this._t(key)}: ${this._config.device}` : this._t(key))}</div></ha-card>`;
  }

  _subtitle(dev) {
    return [dev.brand || dev.integration, dev.model].filter(Boolean).join(" · ");
  }

  _header(dev, status, sub) {
    const c = this._config;
    return `
      <div class="header">
        <span class="type-icon ${status.cls}">${svgIcon(status.key === "ringing" ? ICONS.bell_ring : ICONS.doorbell)}</span>
        <div class="titles">
          <div class="title-row">
            <div class="name">${esc(c.title || dev.name)}</div>
            <span class="chip clickable ${status.cls}" role="button" tabindex="0" data-entity="${esc(status.entity || "")}" title="${esc(status.text)}" aria-label="${esc(status.text)}"><span class="dot"></span><span class="chip-text">${esc(status.text)}</span></span>
            ${this._zoomButton()}
          </div>
          ${sub ? `<div class="sub">${esc(sub)}</div>` : ""}
        </div>
      </div>`;
  }

  _zoomButton() {
    return "";
  }

  // Drawn doorbell (`image: auto`), colored by the state and animated while it rings or sees someone; `none`, or
  // the URL of a picture of your own.
  _picture(dev, status) {
    const img = this._config.image ?? "auto";
    if (img === "none") return "";
    const anim = status.key === "ringing" ? "ringing" : status.key === "motion" || status.key === "person" ? status.key : "";
    const finish = FINISHES[this._config.color] ? this._config.color : BRAND_FINISH[dev.platform] || "dark";
    const src = img === "auto" ? pictureUri(finish, status.cls, anim) : img;
    const target = dev.roles.doorbell || dev.roles.camera || "";
    return `<div class="picture clickable" role="button" tabindex="0" data-entity="${esc(target)}" aria-label="${esc(this._config.title || dev.name)}">${imgTag(src, 'alt=""')}</div>`;
  }

  // Moves the inlined pictures kept from the previous render into the new one, or gives them their src once.
  _placeImages() {
    const kept = this._imgNodes || new Map();
    this._imgNodes = new Map();
    for (const img of this.shadowRoot.querySelectorAll?.("img[data-img]") || []) {
      const key = img.dataset.img;
      const old = kept.get(key);
      if (old) {
        kept.delete(key);
        img.replaceWith(old);
        this._imgNodes.set(key, old);
      } else {
        img.src = DATA_IMGS[key];
        this._imgNodes.set(key, img);
      }
    }
  }

  // Camera picture: a persistent <img> (or live stream element) moved into every render, see _placeCamera.
  _cameraSlot(dev) {
    const s = this._s(dev.roles.camera);
    if (!valid(s) && !s?.attributes?.entity_picture) return `<div class="none">${svgIcon(ICONS.video_off)}<span>${esc(this._t("camera_unavailable"))}</span></div>`;
    const live = this._liveView(dev);
    return live ? `<div class="stream" data-stream="${esc(dev.roles.camera)}"></div>` : `<img data-cam="${esc(dev.roles.camera)}" alt="${esc(s.attributes?.friendly_name || "")}">`;
  }

  _liveView(dev) {
    return this._config.camera_view === "live" && !!dev.roles.camera && !!customElements.get("ha-camera-stream");
  }

  // The <img> outlives the renders: a new node has no picture until it has loaded, which would flash the preview.
  _placeCamera() {
    const kept = this._camNodes || new Map();
    this._camNodes = new Map();
    for (const img of this.shadowRoot.querySelectorAll?.("img[data-cam]") || []) {
      const key = `${img.dataset.cam}|${img.className}`;
      const old = kept.get(key);
      if (old) {
        old.alt = img.alt;
        img.replaceWith(old);
        this._camNodes.set(key, old);
      } else this._camNodes.set(key, img);
    }
    for (const slot of this.shadowRoot.querySelectorAll?.("[data-stream]") || []) {
      const id = slot.dataset.stream;
      this._stream ??= document.createElement("ha-camera-stream");
      this._stream.muted = true;
      this._stream.controls = false;
      this._stream.allowExoPlayer = true;
      this._stream.hass = this._hass;
      this._stream.stateObj = this._s(id);
    }
  }

  // Gives each camera <img> the camera's latest picture: loaded aside and swapped once decoded, so that the
  // preview never goes blank between two snapshots. Nothing is loaded while the card is hidden.
  _syncCamera() {
    const hidden = this._offscreen || (typeof document !== "undefined" && document.hidden);
    // The live stream stops while the card is out of sight (another tab, scrolled away) and starts again after.
    if (this._stream) {
      const slot = this.shadowRoot.querySelector?.("[data-stream]");
      if (hidden || !slot) this._stream.remove();
      else if (this._stream.parentNode !== slot) slot.appendChild(this._stream);
    }
    if (hidden) return;
    for (const [key, img] of this._camNodes || []) {
      const id = key.split("|")[0];
      const base = this._s(id)?.attributes?.entity_picture;
      if (!base) continue;
      const url = freshUrl(base, this._stamp);
      if (img.getAttribute("src") === url) continue;
      if (!img.hasAttribute("src") || typeof Image !== "function") {
        img.setAttribute("src", url);
        continue;
      }
      if (this._camNext?.getAttribute("src") === url) continue;
      const next = new Image();
      next.src = url;
      this._camNext = next;
      next.decode().then(
        () => {
          if (this._camNext === next) img.setAttribute("src", url);
        },
        () => {},
      );
    }
  }

  _startRefresh() {
    clearInterval(this._refresh);
    this._refresh = null;
    if (!this.isConnected || !this._config) return;
    const sec = clampInt(this._config.refresh_interval, DEFAULT_REFRESH, 0, 3600);
    if (!sec) return;
    this._refresh = setInterval(() => {
      this._stamp = Date.now();
      this._syncCamera();
    }, sec * 1000);
  }

  // Thumbnail of a visit: the snapshot the card took, else the snapshot image entity, else the camera.
  _snapSrc(dev, ms) {
    const cap = this._captures.find((c) => c.ms === ms && c.url);
    if (cap) return cap.url;
    return ms === this._lastVisit(dev)?.ms ? this._s(dev.roles.snapshot)?.attributes?.entity_picture || null : null;
  }

  _thumb(dev, ms, cls = "") {
    const cap = this._captures.find((c) => c.ms === ms && c.url);
    const src = this._snapSrc(dev, ms);
    const target = cap ? dev.roles.camera : dev.roles.snapshot || dev.roles.camera;
    return `<div class="thumb ${cls}" ${target ? `role="button" tabindex="0" data-entity="${esc(target)}"` : ""}>${src ? `<img src="${esc(src)}" alt="">` : svgIcon(ICONS.bell_ring)}</div>`;
  }

  // ---- Actions -----------------------------------------------------------

  _opener(dev) {
    const id = dev.roles.opener;
    return id && OPENER_DOMAINS.includes(domainOf(id)) ? id : null;
  }

  _muteState(dev) {
    const id = dev.roles.mute;
    const s = this._s(id);
    if (!s) return null;
    const p = this._pending?.[id];
    let on = s.state === "on";
    if (p && Date.now() < p.until && s.state !== p.state) on = p.state === "on";
    else if (p) delete this._pending[id];
    const inverted = this._config.mute_inverted ?? roleKey(this._hass.entities?.[id] || { entity_id: id }, dev.slugs).split(" ").some((k) => SOUND_RE.test(k));
    return { id, on, muted: inverted ? !on : on, available: s.state !== "unavailable" };
  }

  // Options of the doorbell's message select (UniFi Protect "Doorbell text"), [] without one.
  _selectOptions(dev) {
    return (this._s(dev.roles.message_select)?.attributes?.options || []).map(String);
  }

  // The quick messages: the `messages` option (those that can go somewhere), else the options of the doorbell's
  // message select.
  _messages(dev) {
    const own = (this._config.messages || []).map((m) => String(m)).filter(Boolean);
    return own.length ? own.filter((m) => this._messageTarget(dev, m)) : this._selectOptions(dev);
  }

  // The speaker and engine of text-to-speech, or null.
  _tts() {
    const player = this._config.tts_entity;
    if (!player) return null;
    const engine = this._config.tts_engine || Object.keys(this._hass.states).find((id) => domainOf(id) === "tts");
    return engine ? { kind: "tts", entity: player, engine } : null;
  }

  // Where a quick message goes: one of the select's options is selected; any other text goes to the doorbell's text
  // entity (UniFi Protect LCD), else to the speaker (text-to-speech). Without `text`: whether a message can go anywhere.
  _messageTarget(dev, text) {
    const sel = dev.roles.message_select;
    if (sel && this._s(sel) && (text === undefined || this._selectOptions(dev).includes(text))) return { kind: "select", entity: sel };
    const msg = dev.roles.message;
    if (msg && domainOf(msg) === "text" && this._s(msg)) return { kind: "text", entity: msg };
    return this._tts();
  }

  _sendMessage(dev, text) {
    const target = text ? this._messageTarget(dev, text) : null;
    if (!target) return;
    if (target.kind === "select") return this._call("select", "select_option", { entity_id: target.entity, option: text });
    if (target.kind === "text") return this._call("text", "set_value", { entity_id: target.entity, value: text });
    return this._call("tts", "speak", { entity_id: target.engine, media_player_entity_id: target.entity, message: text, cache: true });
  }

  // A lock that asks for a code (code_format) is opened from its own dialog, where the code is typed.
  _needsCode(dev) {
    const id = this._opener(dev);
    return domainOf(id) === "lock" && !!this._s(id)?.attributes?.code_format;
  }

  _open(dev) {
    const id = this._opener(dev);
    if (!id) return;
    const d = domainOf(id);
    // The Open button shows that the request left until the device answers (a few seconds at most).
    this._opening = Date.now();
    clearTimeout(this._openingTimer);
    this._openingTimer = setTimeout(() => {
      this._opening = 0;
      this._lastDeps = null;
      this._update();
    }, OPENING_MS);
    this._lastDeps = null;
    this._update();
    const done = () => {
      this._opening = 0;
      this._lastDeps = null;
      this._update();
    };
    if (d === "lock") {
      // A lock that can open (latch / door strike, LockEntityFeature.OPEN) is opened; otherwise unlocked.
      const open = (Number(this._s(id)?.attributes?.supported_features) & 1) === 1;
      return this._call("lock", open ? "open" : "unlock", { entity_id: id }, done);
    }
    if (d === "button" || d === "input_button") return this._call(d, "press", { entity_id: id }, done);
    if (d === "script") return this._call("script", "turn_on", { entity_id: id }, done);
    return this._call("switch", "turn_on", { entity_id: id }, done);
  }

  _toggleMute(dev) {
    const m = this._muteState(dev);
    if (!m) return;
    const domain = domainOf(m.id);
    const next = m.on ? "off" : "on";
    this._pending = { ...this._pending, [m.id]: { state: next, until: Date.now() + PENDING_MS } };
    clearTimeout(this._pendingTimer);
    this._pendingTimer = setTimeout(() => this._update(), PENDING_MS + 100);
    this._lastDeps = null;
    this._update();
    return this._call(domain, m.on ? "turn_off" : "turn_on", { entity_id: m.id }, () => {
      if (this._pending) delete this._pending[m.id];
      this._update();
    });
  }

  _actionButtons(dev, round = false) {
    if (this._config.show_actions === false) return "";
    const off = this._offline(dev);
    const out = [];
    const btn = (action, icon, label, cls = "", disabled = false) =>
      `<button class="btn${round ? " round" : ""} ${cls}${disabled ? " disabled" : ""}" data-action="${action}" title="${esc(label)}" aria-label="${esc(label)}"${disabled ? ' aria-disabled="true"' : ""}${cls.includes("busy") ? ' aria-busy="true"' : ""}>${svgIcon(icon)}${round ? "" : `<span>${esc(label)}</span>`}</button>`;
    const opener = this._opener(dev);
    if (opener) {
      const s = this._s(opener);
      // A button entity's state is the time it was last pressed, "unknown" until then: only "unavailable" disables it.
      const busy = Date.now() - (this._opening || 0) < OPENING_MS;
      out.push(btn("open", domainOf(opener) === "lock" ? ICONS.lock_open : ICONS.door_open, this._t("open"), `accent${busy ? " busy" : ""}`, !s || s.state === "unavailable"));
    }
    if (!round && this._messageTarget(dev)) out.push(btn("messages", ICONS.message, this._t("message"), "", off));
    const m = this._muteState(dev);
    if (m) out.push(btn("mute", m.muted ? ICONS.volume_off : ICONS.volume_high, this._t(m.muted ? "unmute" : "mute"), m.muted ? "on" : "", !m.available));
    return out.join("");
  }

  // ---- Clicks and popups -------------------------------------------------

  _onClick(ev) {
    const path = ev.composedPath();
    const el = path.find((n) => n.dataset && (n.dataset.entity !== undefined || n.dataset.action));
    if (!this._popup && Date.now() - (this._popupClosedAt ?? 0) < CONFIRM_GUARD_MS) {
      ev.stopPropagation();
      return;
    }
    const { dev } = findDevice(this._hass, this._config);
    if (this._popup) {
      ev.stopPropagation();
      const action = el?.dataset.action;
      if (action === "confirm_ok") {
        this._closePopup();
        if (dev) this._open(dev);
      } else if (action === "send" && dev) {
        const text = this._messages(dev)[Number(el.dataset.index)];
        this._closePopup();
        this._sendMessage(dev, text);
      } else if (action === "popup_cancel" || (action === "popup_backdrop" && path[0] === el)) {
        this._closePopup();
      }
      return;
    }
    if (!el || !dev) return;
    ev.stopPropagation();
    const { action, entity } = el.dataset;
    if (el.classList?.contains("disabled")) return;
    if (action === "zoom") return this._toggleZoom(ev);
    if (action === "toggle_section") {
      const key = el.dataset.section;
      this._toggled = new Map(this._toggled).set(key, !this._isCollapsed(key));
      return this._update();
    }
    if (action === "open") {
      if (el.classList?.contains("busy")) return;
      // The code is typed in the lock's own dialog, which asks before opening as well.
      if (this._needsCode(dev)) return this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: this._opener(dev) }, bubbles: true, composed: true }));
      if (this._config.confirm_open === false) return this._open(dev);
      const s = this._s(this._opener(dev));
      return this._openPopup({ kind: "confirm", text: this._t("confirm_open", { name: s?.attributes?.friendly_name || this._opener(dev) }) });
    }
    if (action === "messages") return this._openPopup({ kind: "messages" });
    if (action === "mute") return this._toggleMute(dev);
    if (entity) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: entity }, bubbles: true, composed: true }));
  }

  _toggleZoom() {}

  _isCollapsed(key) {
    if (this._toggled?.has(key)) return this._toggled.get(key);
    const c = this._config.collapsed ?? DEFAULT_COLLAPSED;
    return (Array.isArray(c) ? c : [c]).includes(key);
  }

  _openPopup(popup) {
    this._popup = popup;
    window.addEventListener("keydown", this._onKey);
    this._update();
  }

  _closePopup() {
    this._popup = null;
    this._popupClosedAt = Date.now();
    window.removeEventListener("keydown", this._onKey);
    this._update();
  }

  _popupHtml() {
    const p = this._popup;
    let body;
    if (p.kind === "confirm") {
      body = `<div class="msg">${esc(p.text)}</div>
        <div class="modal-actions">
          <button class="btn" data-action="popup_cancel"><span>${esc(this._t("cancel"))}</span></button>
          <button class="btn accent" data-action="confirm_ok">${svgIcon(ICONS.lock_open)}<span>${esc(this._t("open"))}</span></button>
        </div>`;
    } else {
      const { dev } = findDevice(this._hass, this._config);
      const list = dev ? this._messages(dev) : [];
      body = `<div class="modal-title">${svgIcon(ICONS.message)}<span>${esc(this._t("quick_message"))}</span></div>
        ${
          list.length
            ? `<div class="msg-list">${list.map((m, i) => `<button class="btn" data-action="send" data-index="${i}">${svgIcon(ICONS.send)}<span>${esc(m)}</span></button>`).join("")}</div>`
            : `<div class="msg muted">${esc(this._t("no_messages"))}</div>`
        }
        <div class="modal-actions"><button class="btn" data-action="popup_cancel"><span>${esc(this._t("cancel"))}</span></button></div>`;
    }
    return `<style>${DIALOG_STYLE}</style><div class="backdrop" data-action="popup_backdrop"><div class="modal" role="dialog" aria-modal="true" tabindex="-1">${body}</div></div>`;
  }
}

class DoorbellCard extends DoorbellBase {
  static getConfigElement() {
    return document.createElement("doorbell-card-editor");
  }

  static getStubConfig(hass) {
    const m = resolve(hass);
    const dev = m?.devices[0];
    return dev ? { device: dev.id } : {};
  }

  getCardSize() {
    return 9;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  _render() {
    const { dev, error } = findDevice(this._hass, this._config);
    if (error) return this._errorCard(error);
    const c = this._config;
    const status = this._status(dev);
    const parts = [this._hero(dev, status)];
    if (c.show_camera !== false && dev.roles.camera) parts.push(this._camera(dev, status));
    const actions = this._actionButtons(dev);
    if (actions) parts.push(`<div class="actions">${actions}</div>`);
    if (c.show_details !== false) parts.push(this._details(dev));
    if (c.show_history !== false && dev.roles.doorbell) parts.push(this._historySection(dev));
    return `<style>${BASE_STYLE}${FULL_STYLE}</style>
      <ha-card>
        ${this._header(dev, status, this._subtitle(dev))}
        <div class="content">${parts.filter(Boolean).join("")}</div>
      </ha-card>`;
  }

  _camera(dev, status) {
    const live = this._liveView(dev);
    const det = status.key === "person" || status.key === "motion";
    return `<div class="cam${status.key === "ringing" ? " ringing" : ""}" role="button" tabindex="0" data-entity="${esc(dev.roles.camera)}" aria-label="${esc(this._s(dev.roles.camera)?.attributes?.friendly_name || this._t("opt_camera"))}">
      ${this._cameraSlot(dev)}
      ${live ? `<span class="glass badge live"><span class="dot"></span>${esc(this._t("live"))}</span>` : ""}
      ${det ? `<span class="glass det ${status.cls}">${svgIcon(status.key === "person" ? ICONS.person : ICONS.motion)}${esc(status.text)}</span>` : ""}
      ${status.key === "ringing" ? `<span class="glass banner">${svgIcon(ICONS.bell_ring)}<span>${esc(this._t("someone_at_door"))}</span></span>` : ""}
    </div>`;
  }

  // Picture, big state, last visitor (time, day, how long ago) and its snapshot when there is one.
  _hero(dev, status) {
    const c = this._config;
    const lines = [];
    let snap = "";
    if (c.show_last !== false) {
      const last = this._lastVisit(dev);
      const l = this._locale();
      if (last) {
        const kinds = { ring: ICONS.bell_ring, person: ICONS.person, motion: ICONS.motion };
        const cls = last.kind === "ring" ? "ringing" : "active";
        lines.push(
          `<div class="line visit clickable ${cls}" role="button" tabindex="0" data-entity="${esc(last.entity)}">${svgIcon(kinds[last.kind])}<span>${esc(this._t("last_visitor"))} · <b>${esc(clock(l, last.ms))}</b></span></div>`,
          `<div class="line">${svgIcon(ICONS.clock)}<span>${esc(`${dayLabel(this._hass, this._config, last.ms)} · ${ago(l, last.ms)}`)}</span></div>`,
        );
        if (this._snapSrc(dev, last.ms)) snap = this._thumb(dev, last.ms, "snap");
      } else {
        lines.push(`<div class="line">${svgIcon(ICONS.bell_ring)}<span>${esc(this._t("no_visitor"))}</span></div>`);
      }
    }
    return `<div class="hero">
      ${this._picture(dev, status)}
      <div class="info">
        <div class="state ${status.cls}">${esc(status.text)}</div>
        ${lines.join("")}
      </div>
      ${snap}
    </div>`;
  }

  _sectionTitle(key, icon, label, extra = "") {
    const closed = this._isCollapsed(key);
    return `<div class="section-title" role="button" tabindex="0" data-action="toggle_section" data-section="${key}" aria-expanded="${!closed}">${svgIcon(icon)}<span>${esc(label)}</span>${extra}${svgIcon(ICONS.chevron_down, "chevron")}</div>`;
  }

  _tile(id, icon, label, value, cls = "") {
    return `<div class="tile clickable ${cls}" role="button" tabindex="0" data-entity="${esc(id || "")}"><div class="k">${svgIcon(icon)}<span>${esc(label)}</span></div><div class="v">${esc(value)}</div></div>`;
  }

  _fmtState(id) {
    const s = this._s(id);
    if (!s) return "—";
    try {
      if (this._hass.formatEntityState) return this._hass.formatEntityState(s);
    } catch (_e) {
      /* older Home Assistant */
    }
    const v = String(s.state).replace(/_/g, " ");
    return v.charAt(0).toUpperCase() + v.slice(1);
  }

  _details(dev) {
    const r = dev.roles;
    const l = this._locale();
    const tiles = [];
    const today = this._rings(dev).filter((ms) => ms >= startOfDay(Date.now())).length;
    if (r.doorbell) tiles.push(this._tile(r.doorbell, ICONS.bell_ring, this._t("rings_today"), String(today)));
    const motionAt = lastOn(this._s(r.motion)) ?? (valid(this._s(r.motion)) ? Date.parse(this._s(r.motion).last_changed) : null);
    if (r.motion) tiles.push(this._tile(r.motion, ICONS.motion, this._t("last_motion"), Number.isFinite(motionAt) ? ago(l, motionAt) : "—"));
    if (domainOf(r.opener) === "lock") {
      const st = this._s(r.opener)?.state;
      const cls = st === "jammed" ? "crit" : ["unlocked", "open", "opening", "unlocking"].includes(st) ? "warn" : "";
      tiles.push(this._tile(r.opener, st === "locked" ? ICONS.lock : ICONS.lock_open, this._t("lock"), this._fmtState(r.opener), cls));
    }
    const b = this._s(r.battery);
    if (b) {
      const v = Number.parseFloat(b.state);
      const cls = Number.isFinite(v) ? (v <= 10 ? "crit" : v <= 25 ? "warn" : "ok") : "";
      tiles.push(this._tile(r.battery, ICONS.battery, this._t("battery"), Number.isFinite(v) ? pct(v) : "—", cls));
    }
    if (!tiles.length) return "";
    const closed = this._isCollapsed("details");
    return `<div>${this._sectionTitle("details", ICONS.info, this._t("details"))}${closed ? "" : `<div class="tiles">${tiles.join("")}</div>`}</div>`;
  }

  _historySection(dev) {
    const closed = this._isCollapsed("history");
    const count = clampInt(this._config.history_count, DEFAULT_HISTORY_COUNT, 1, 50);
    const hours = clampInt(this._config.history_hours, DEFAULT_HISTORY_HOURS, 1, 24 * 30);
    const rings = this._rings(dev).filter((ms) => ms >= Date.now() - hours * 3600000);
    const l = this._locale();
    const extra = rings.length ? `<span class="count muted">· ${rings.length}</span>` : "";
    let body = "";
    if (!closed) {
      body = rings.length
        ? `<div class="hist">${rings
            .slice(0, count)
            .map(
              (ms) =>
                `<div class="hist-row">${this._thumb(dev, ms)}<span class="day">${esc(dayLabel(this._hass, this._config, ms))}</span><span class="time">${esc(clock(l, ms))}</span><span class="rel">${esc(ago(l, ms))}</span></div>`,
            )
            .join("")}</div>`
        : `<div class="empty">${esc(this._history === undefined ? "…" : this._t("no_history", { hours }))}</div>`;
    }
    return `<div>${this._sectionTitle("history", ICONS.history, this._t("history"), extra)}${body}</div>`;
  }
}

// The mini card is a full card drawn compact: its detail button (top right, `zoom: false` removes it) switches it to
// the full card's content and back, and a click anywhere else on the page brings the compact view back.
class DoorbellMiniCard extends DoorbellCard {
  constructor() {
    super();
    this._unzoom = watchOutside(
      (ev) => isOutside(this, ev),
      () => {
        if (this._zoomed) this._setZoom(false);
      },
    );
  }

  static getConfigElement() {
    return document.createElement("doorbell-mini-card-editor");
  }

  connectedCallback() {
    super.connectedCallback();
    this._unzoom.on();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unzoom.off();
    // Back to the compact view once off the screen (see the full card).
    this._zoomed = false;
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 2;
  }

  getGridOptions() {
    return { ...(this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 }), rows: "auto" };
  }

  _zoomButton() {
    if (this._config.zoom === false) return "";
    const z = this._zoomed;
    const label = esc(this._t(z ? "zoom_out" : "zoom_in"));
    return `<button class="zoom" data-action="zoom" title="${label}" aria-label="${label}">${svgIcon(z ? ICONS.collapse : ICONS.expand)}</button>`;
  }

  _setZoom(on) {
    this._zoomed = on;
    this._update();
    this.dispatchEvent(new CustomEvent("iron-resize", { bubbles: true, composed: true }));
  }

  _toggleZoom(ev) {
    this._setZoom(!this._zoomed);
    if (ev?.detail === 0) this.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  }

  _render() {
    if (this._zoomed) return super._render();
    const { dev, error } = findDevice(this._hass, this._config);
    if (error) return this._errorCard(error);
    const status = this._status(dev);
    const last = this._lastVisit(dev);
    const l = this._locale();
    const main = last ? `${this._t("last_visitor")} ${clock(l, last.ms)}` : this._t("no_visitor");
    const sub = last ? `${dayLabel(this._hass, this._config, last.ms)} · ${ago(l, last.ms)}` : this._subtitle(dev);
    const controls = this._actionButtons(dev, true);
    return `<style>${BASE_STYLE}${MINI_STYLE}</style>
      <ha-card>
        ${this._header(dev, status, "")}
        <div class="content">
          ${this._picture(dev, status)}
          <div class="info clickable" role="button" tabindex="0" data-entity="${esc(last?.entity || dev.roles.doorbell || "")}">
            <div class="main">${esc(main)}</div>
            ${sub ? `<div class="line">${svgIcon(ICONS.clock)}<span>${esc(sub)}</span></div>` : ""}
          </div>
          ${controls ? `<div class="controls">${controls}</div>` : ""}
        </div>
      </ha-card>`;
  }
}

// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------

const ENTITY_FIELDS = [
  ["camera", ["camera"]],
  ["doorbell", ["event", "binary_sensor"]],
  ["motion", ["event", "binary_sensor"]],
  ["person", ["event", "binary_sensor"]],
  ["lock", OPENER_DOMAINS],
  ["mute", ["switch", "input_boolean"]],
  ["snapshot", ["image"]],
  ["battery", ["sensor"]],
  ["message_entity", ["select", "text"]],
  ["tts_entity", ["media_player"]],
  ["tts_engine", ["tts"]],
];

class DoorbellEditorBase extends HTMLElement {
  // [name, default]
  static get toggles() {
    return [];
  }

  static get full() {
    return false;
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _schema() {
    const tr = (k) => t(this._hass, this._config, k);
    const full = this.constructor.full;
    const schema = [
      { name: "device", selector: { select: { mode: "dropdown", options: listDevices(this._hass) } } },
      { name: "title", selector: { text: {} } },
      {
        name: "image",
        selector: { select: { mode: "dropdown", custom_value: true, options: ["auto", "none"].map((v) => ({ value: v, label: tr(`image_${v}`) })) } },
      },
      { name: "color", selector: { select: { mode: "dropdown", options: ["auto", "dark", "white", "steel"].map((v) => ({ value: v, label: tr(`color_${v}`) })) } } },
      { type: "grid", name: "", schema: this.constructor.toggles.map(([name]) => ({ name, selector: { boolean: {} } })) },
    ];
    if (full) {
      schema.push(
        { name: "camera_view", selector: { select: { mode: "dropdown", options: ["snapshot", "live"].map((v) => ({ value: v, label: tr(`view_${v}`) })) } } },
        {
          name: "collapsed",
          selector: { select: { multiple: true, mode: "list", options: ["details", "history"].map((value) => ({ value, label: tr(value) })) } },
        },
        { type: "grid", name: "", schema: ["history_count", "history_hours"].map((name) => ({ name, selector: { number: { min: 1, max: name === "history_count" ? 50 : 720, mode: "box" } } })) },
      );
    }
    schema.push(
      { type: "grid", name: "", schema: ["ring_duration", "refresh_interval"].map((name) => ({ name, selector: { number: { min: name === "ring_duration" ? 5 : 0, max: 3600, mode: "box", unit_of_measurement: "s" } } })) },
      {
        type: "expandable",
        name: "",
        title: tr("opt_entities"),
        icon: "mdi:tune-variant",
        schema: ENTITY_FIELDS.map(([name, domain]) => ({ name, selector: { entity: { domain } } })),
      },
      { name: "messages", selector: { text: { multiple: true } } },
      { name: "language", selector: { select: { mode: "dropdown", options: [{ value: "", label: tr("lang_auto") }, ...LANGUAGES.map(([value, label]) => ({ value, label }))] } } },
    );
    return schema;
  }

  _render() {
    if (!this._hass || !this._config) return;
    const toggles = this.constructor.toggles;
    const defaults = { ...Object.fromEntries(toggles), image: "auto", color: "auto", camera_view: "snapshot", collapsed: DEFAULT_COLLAPSED, history_count: DEFAULT_HISTORY_COUNT, history_hours: DEFAULT_HISTORY_HOURS, ring_duration: DEFAULT_RING_SECONDS, refresh_interval: DEFAULT_REFRESH };
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => t(this._hass, this._config, `opt_${s.name}`);
      this._form.computeHelper = (s) => (s.name === "zoom" || s.name === "messages" ? t(this._hass, this._config, `help_${s.name}`) : undefined);
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        for (const [k, v] of Object.entries(config)) {
          // Keep the YAML minimal: drop empty values and options left at their default.
          const empty = v === "" || v === undefined || v === null || (Array.isArray(v) && !v.length && k === "messages");
          if (empty || (k in defaults && JSON.stringify(v) === JSON.stringify(defaults[k]))) delete config[k];
        }
        if (Array.isArray(config.messages)) config.messages = config.messages.filter((m) => m !== "" && m != null);
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const data = { ...defaults, ...this._config };
    if (!data.device && !data.camera && !data.doorbell) data.device = DoorbellCard.getStubConfig(this._hass).device;
    this._form.hass = this._hass;
    const h = this._hass;
    const dataDeps = [this._config, h.entities, h.devices];
    if (!sameDeps(this._dataDeps, dataDeps)) {
      this._dataDeps = dataDeps;
      this._form.data = data;
    }
    const schemaDeps = [lang(h, this._config), h.entities, h.devices];
    if (!sameDeps(this._schemaDeps, schemaDeps)) {
      this._schemaDeps = schemaDeps;
      this._form.schema = this._schema();
    }
  }
}

class DoorbellCardEditor extends DoorbellEditorBase {
  static get full() {
    return true;
  }

  static get toggles() {
    return [
      ["show_title", true],
      ["show_subtitle", true],
      ["show_camera", true],
      ["show_last", true],
      ["show_actions", true],
      ["show_details", true],
      ["show_history", true],
      ["confirm_open", true],
    ];
  }
}

class DoorbellMiniCardEditor extends DoorbellEditorBase {
  static get toggles() {
    return [
      ["show_title", true],
      ["show_camera", true],
      ["show_actions", true],
      ["confirm_open", true],
      ["zoom", true],
    ];
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const define = (name, cls) => {
  if (!customElements.get(name)) customElements.define(name, cls);
};
define("doorbell-card", DoorbellCard);
define("doorbell-mini-card", DoorbellMiniCard);
define("doorbell-card-editor", DoorbellCardEditor);
define("doorbell-mini-card-editor", DoorbellMiniCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  {
    type: "doorbell-card",
    name: "Doorbell Card",
    description: "Video doorbell or intercom: camera preview, last visitor, ring history and quick actions (open the door, quick message, mute).",
  },
  {
    type: "doorbell-mini-card",
    name: "Doorbell Mini Card",
    description: "Compact video doorbell overview: status, last visitor and quick actions.",
  },
]) {
  if (!window.customCards.some((c) => c.type === card.type)) window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-doorbell-card" });
}

console.info(`%c DOORBELL-CARD %c v${VERSION} `, "color: white; background: #ef6c00; font-weight: 700;", "color: #ef6c00; background: white; font-weight: 700;");
