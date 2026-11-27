// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------
import { CONFIRM_GUARD_MS, DEFAULT_COLLAPSED, DEFAULT_HISTORY_COUNT, DEFAULT_HISTORY_HOURS, DEFAULT_REFRESH, DEFAULT_RING_SECONDS, HISTORY_REFETCH_MS, ICONS, MAX_CAPTURES, OPENER_DOMAINS, OPENING_MS, PENDING_MS, SOUND_RE } from "./constants.js";
import { BRAND_FINISH, DATA_IMGS, FINISHES, imgTag, pictureUri } from "./picture.js";
import { ago, clampInt, clock, dayLabel, defaultTtsEngine, domainOf, esc, eventTime, freshUrl, intlLocale, lastOn, pct, recent, ringsFromHistory, sameDeps, startOfDay, svgIcon, t, valid } from "./helpers.js";
import { findDevice, resolve, roleKey } from "./registry-based-resolution.js";
import { BANNER_STYLE, BASE_STYLE, DIALOG_STYLE, FOCUS_SELECTOR, FULL_STYLE, MINI_STYLE, doorbellScene, focusKey, isNight, isOutside, textWidth, watchOutside } from "./styles.js";

export let _dbUid = 0;

export class DoorbellBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._uid = ++_dbUid;
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
    // A new width (or the web font loaded): the status pill is fitted again, in the next frame.
    if (typeof ResizeObserver === "function") {
      this._pillResize ??= new ResizeObserver((entries) => {
        const w = Math.round(entries.at(-1).contentRect.width);
        if (w === this._pillWidth) return;
        this._pillWidth = w;
        cancelAnimationFrame(this._pillFrame);
        this._pillFrame = requestAnimationFrame(() => this._fitPill());
      });
      this._pillResize.observe(this);
    }
    document.fonts?.ready?.then(() => this._fitPill());
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
    this._pillResize?.disconnect();
    if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(this._pillFrame);
    this._pillWidth = null;
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
    // Another device may be shown: the rings seen live start again (their snapshots free their memory).
    for (const old of this._captures || []) {
      old.dropped = true;
      if (old.url?.startsWith("blob:")) URL.revokeObjectURL(old.url);
    }
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

  // The status pill goes on the title row, right after the title, only when the whole title and the pill's whole
  // label fit there; otherwise it takes its own line under the subtitle (.pill-below) and the title keeps its row
  // (cut only when it does not fit alone). The subtitle then keeps one line (its whole text in its tooltip), and when
  // the block still runs out of the banner or into its ground strip, or the label does not fit its own line, the pill
  // keeps its dot alone (.pill-dot, the label in its tooltip and aria-label). Measured after each render and on each
  // new width, never by a fixed width, so that every language fits.
  _fitPill() {
    for (const t of this.shadowRoot?.querySelectorAll?.(".titles") || []) {
      const chips = [...t.querySelectorAll(".chip")];
      if (!chips[0]?.getBoundingClientRect) continue;
      t.classList.remove("pill-below", "pill-dot");
      const sub = t.querySelector(".sub");
      sub?.removeAttribute("title");
      if (!chips[0].querySelector(".chip-text")?.getClientRects().length) continue;
      const avail = t.getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(chips[0].parentElement).columnGap) || 0;
      const widths = chips.map((c) => {
        const cs = getComputedStyle(c);
        return c.getBoundingClientRect().width + (parseFloat(cs.marginLeft) || 0) + (parseFloat(cs.marginRight) || 0);
      });
      if (textWidth(t.querySelector(".name")) + widths.reduce((w, c) => w + gap + c, 0) <= avail + 0.01) continue;
      t.classList.add("pill-below");
      if (sub && sub.scrollWidth > sub.clientWidth) sub.title = sub.textContent.trim();
      const banner = t.closest(".db-banner");
      const box = banner?.getBoundingClientRect();
      const floor = box && box.bottom - 10; // the 10 px strip (.db-banner::after)
      const r = t.getBoundingClientRect();
      const out = box && (r.top < box.top - 0.5 || r.bottom > floor + 0.5);
      const room = avail;
      if (out || widths.some((w) => w > room + 0.01)) t.classList.add("pill-dot");
    }
  }

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
      this._fitPill();
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

  // The illustrated header (the default), else the classic one (`illustration: false`).
  _illustrated() {
    return this._config.illustration !== false;
  }

  _header(dev, status, sub) {
    if (this._illustrated()) return this._banner(dev, status, sub);
    return `
      <div class="header">
        ${this._headIcon(status)}
        ${this._titles(dev, status, sub)}
        ${this._zoomButton()}
      </div>`;
  }

  // The round icon: its color always follows the state (gray when idle, the accent while ringing, blue on a
  // detection, amber when the door is unlocked, red when offline).
  _headIcon(status) {
    return `<span class="type-icon ${this._stateCls(status)}">${svgIcon(status.key === "ringing" ? ICONS.bell_ring : ICONS.doorbell)}</span>`;
  }

  // The color of the round icon and of the status pill: gray when idle, else the state's.
  _stateCls(status) {
    return status.key === "idle" ? "idle" : status.cls;
  }

  // The status pill: on the title line, right after the title, or on a line of its own under the subtitle (see
  // _fitPill); at ≤ 200 px only its dot stays (text in title/aria-label).
  _chip(status) {
    return `<span class="chip clickable ${this._stateCls(status)}" role="button" tabindex="0" data-entity="${esc(status.entity || "")}" title="${esc(status.text)}" aria-label="${esc(status.text)}"><span class="dot"></span><span class="chip-text">${esc(status.text)}</span></span>`;
  }

  _titles(dev, status, sub) {
    return `<div class="titles">
          <div class="title-row">
            <div class="name">${esc(this._config.title || dev.name)}</div>
            ${this._chip(status)}
          </div>
          ${sub ? `<div class="sub">${esc(sub)}</div>` : ""}
        </div>`;
  }

  // The front of the house, the doorbell big beside the door (the card's own picture, animated by the state), the
  // title on the wall at the left. Night: the dark theme, or forced by `illustration_theme`.
  _banner(dev, status, sub) {
    const night = isNight(this._hass, this._config);
    const src = this._pictureSrc(dev, status);
    const target = dev.roles.doorbell || dev.roles.camera || "";
    const device = src
      ? `<div class="db-device clickable" role="button" tabindex="0" data-entity="${esc(target)}" aria-label="${esc(this._config.title || dev.name)}">${imgTag(src, 'alt=""')}</div>`
      : "";
    return `
      <div class="db-banner${night ? " night" : ""}${status.key === "ringing" ? " ring" : ""}">
        <div class="db-scene">${doorbellScene(this._uid, night)}${device}</div>
        <div class="db-text">${this._headIcon(status)}${this._titles(dev, status, sub)}</div>
        ${this._zoomButton()}
      </div>`;
  }

  _styles() {
    return this._illustrated() ? BANNER_STYLE : "";
  }

  _zoomButton() {
    return "";
  }

  // Drawn doorbell (`image: auto`), colored by the state and animated while it rings or sees someone; `none`, or
  // the URL of a picture of your own.
  _pictureSrc(dev, status) {
    const img = this._config.image ?? "auto";
    if (img === "none") return "";
    const anim = status.key === "ringing" ? "ringing" : status.key === "motion" || status.key === "person" ? status.key : "";
    const finish = FINISHES[this._config.color] ? this._config.color : BRAND_FINISH[dev.platform] || "dark";
    return img === "auto" ? pictureUri(finish, status.cls, anim) : img;
  }

  // Below the classic header only: the illustrated header already shows the doorbell.
  _picture(dev, status) {
    if (this._illustrated()) return "";
    const src = this._pictureSrc(dev, status);
    if (!src) return "";
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
    const engine = this._config.tts_engine || defaultTtsEngine(this._hass);
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

export class DoorbellCard extends DoorbellBase {
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
    return `<style>${BASE_STYLE}${FULL_STYLE}${this._styles()}</style>
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

  // Picture, then the big line and the last visitor (time, day, how long ago) with its snapshot when there is one.
  // The status is already in the header pill: while idle the big line is the last visitor's time (under a small
  // "Last visitor" caption) instead of repeating "Idle"; any other state (ringing, person, motion, unlocked,
  // offline) stays big, above the last visitor.
  _hero(dev, status) {
    const c = this._config;
    const idle = status.key === "idle";
    const lines = idle ? [] : [`<div class="state ${status.cls}">${esc(status.text)}</div>`];
    let snap = "";
    if (c.show_last !== false) {
      const last = this._lastVisit(dev);
      const l = this._locale();
      if (last) {
        const kinds = { ring: ICONS.bell_ring, person: ICONS.person, motion: ICONS.motion };
        const cls = last.kind === "ring" ? "ringing" : "active";
        const attrs = `role="button" tabindex="0" data-entity="${esc(last.entity)}"`;
        const when = `<div class="line">${svgIcon(ICONS.clock)}<span>${esc(`${dayLabel(this._hass, this._config, last.ms)} · ${ago(l, last.ms)}`)}</span></div>`;
        if (idle) {
          lines.push(
            `<div class="line visit clickable ${cls}" ${attrs}>${svgIcon(kinds[last.kind])}<span>${esc(this._t("last_visitor"))}</span></div>`,
            `<div class="state visit-time clickable" ${attrs}>${esc(clock(l, last.ms))}</div>`,
            when,
          );
        } else {
          lines.push(`<div class="line visit clickable ${cls}" ${attrs}>${svgIcon(kinds[last.kind])}<span>${esc(this._t("last_visitor"))} · <b>${esc(clock(l, last.ms))}</b></span></div>`, when);
        }
        if (this._snapSrc(dev, last.ms)) snap = this._thumb(dev, last.ms, "snap");
      } else if (idle) {
        lines.push(`<div class="state visit-time">${esc(this._t("no_visitor"))}</div>`);
      } else {
        lines.push(`<div class="line">${svgIcon(ICONS.bell_ring)}<span>${esc(this._t("no_visitor"))}</span></div>`);
      }
    }
    const picture = this._picture(dev, status);
    if (!picture && !lines.length && !snap) return "";
    return `<div class="hero">
      ${picture}
      <div class="info">
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
export class DoorbellMiniCard extends DoorbellCard {
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
    return `<style>${BASE_STYLE}${MINI_STYLE}${this._styles()}</style>
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
