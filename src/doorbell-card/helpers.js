// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
import { ICONS } from "./constants.js";

export const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

// Locale for Intl: the card's language option, else Home Assistant's full locale (keeps its region) when its base
// matches the card language. A bare "pt" (European Portuguese) becomes "pt-PT", otherwise Intl writes it the Brazilian way.
export const intlLocale = (hass, config) => {
  const l = lang(hass, config);
  const src = config?.language || (hass && (hass.locale?.language || hass.language)) || "";
  const out = src && src.split("-")[0] === l.split("-")[0] ? src : l;
  return out === "pt" ? "pt-PT" : out;
};

export const t = (hass, config, key, vars = {}) => String(STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

export const valid = (s) => !!s && !["unknown", "unavailable", ""].includes(s.state);
export const domainOf = (id) => String(id || "").split(".")[0];
export const objectId = (id) => String(id || "").split(".").slice(1).join(".");
// The engine of the quick messages without `tts_engine`: Home Assistant Cloud's when it is set up (the engine Home
// Assistant proposes first), else the first available `tts` entity by ID — never one picked by the order of the states.
export const defaultTtsEngine = (hass) => {
  const ids = Object.keys(hass?.states || {})
    .filter((id) => domainOf(id) === "tts" && hass.states[id]?.state !== "unavailable")
    .sort();
  return ids.find((id) => id === "tts.home_assistant_cloud") || ids[0];
};
export const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="${path === ICONS.doorbell ? "evenodd" : "nonzero"}" d="${path}"/></svg>`;
export const sameDeps = (a, b) => !!a && a.length === b.length && a.every((d, i) => d === b[i]);
export const clampInt = (v, def, min, max) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : def;
};

// Percentages are whole numbers.
export const pct = (v) => `${Math.round(v)} %`;

// True when an event entity's last event (or a recorded one, `attrs`) counts: an entity that has the standard "ring"
// event type (doorbell device class) counts only its rings; button events count their presses, not the releases
// that follow them (Matter, HomeKit). `types` are the entity's event types, from its current state.
export const countedEvent = (eventType, types) => {
  if (!eventType) return true;
  if (Array.isArray(types) && types.includes("ring")) return eventType === "ring";
  return !/(^|_)(release|ongoing)(_|$)/.test(eventType);
};

// Time of an entity's state as a timestamp (ms): an event entity's state is the time of its last event.
export const eventTime = (s) => {
  if (!valid(s) || !countedEvent(s.attributes?.event_type, s.attributes?.event_types)) return null;
  const v = Date.parse(s.state);
  return Number.isFinite(v) ? v : null;
};

// True for a time of the last `seconds` (a minute ahead allowed: the device's clock may run a little fast).
export const recent = (ms, seconds) => ms !== null && Date.now() - ms < seconds * 1000 && ms - Date.now() < 60000;

// Time an entity last turned on (binary_sensor), or its last event (event entity); null when unknown.
export const lastOn = (s) => {
  if (!s) return null;
  if (domainOf(s.entity_id) === "event") return eventTime(s);
  if (s.state === "on") return Date.parse(s.last_changed) || null;
  return null;
};

// One formatter per locale and kind, built on first use.
export const FMT = {};
export const fmt = (locale, kind, opts) => (FMT[`${locale}|${kind}`] ??= kind === "rel" ? new Intl.RelativeTimeFormat(locale, opts) : new Intl.DateTimeFormat(locale, opts));

export const ago = (locale, ms, now = Date.now()) => {
  if (!Number.isFinite(ms)) return "";
  const diff = (ms - now) / 1000;
  const abs = Math.abs(diff);
  const rtf = fmt(locale, "rel", { numeric: "auto" });
  if (abs < 45) return rtf.format(0, "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86400), "day");
};

export const clock = (locale, ms) => fmt(locale, "time", { hour: "numeric", minute: "2-digit" }).format(ms);

export const startOfDay = (ms) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// "Today", "Yesterday" or a short date, for the ring history.
export const dayLabel = (hass, config, ms, now = Date.now()) => {
  const days = Math.round((startOfDay(now) - startOfDay(ms)) / 86400000);
  if (days === 0) return t(hass, config, "today");
  if (days === 1) return t(hass, config, "yesterday");
  return fmt(intlLocale(hass, config), "day", { weekday: "short", day: "numeric", month: "short" }).format(ms);
};

// Ring times (ms, newest first) from a history/history_during_period answer for one entity, since `since`.
// An event entity's state is the time of each ring; a binary_sensor rings when it turns on.
// `types`: the event types of an event entity (its current state's), to leave out what is not a ring.
export const ringsFromHistory = (entityId, rows, since, types) => {
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
export const freshUrl = (url, stamp) => {
  if (!url || String(url).startsWith("data:")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}_ts=${stamp}`;
};
