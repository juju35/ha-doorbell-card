// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------
import { DEFAULT_COLLAPSED, DEFAULT_HISTORY_COUNT, DEFAULT_HISTORY_HOURS, DEFAULT_REFRESH, DEFAULT_RING_SECONDS, OPENER_DOMAINS } from "./constants.js";
import { LANGUAGES } from "./picture.js";
import { lang, sameDeps, t } from "./helpers.js";
import { listDevices } from "./registry-based-resolution.js";
import { DoorbellCard } from "./cards.js";

export const ENTITY_FIELDS = [
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

export class DoorbellEditorBase extends HTMLElement {
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
      { name: "illustration_theme", selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((v) => ({ value: v, label: tr(`theme_${v}`) })) } } },
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
        schema: ENTITY_FIELDS.flatMap(([name, domain]) => {
          const field = { name, selector: { entity: { domain } } };
          if (name !== "mute") return [field];
          // mute_inverted: unset (from the switch's name), true or false; a select, as a toggle has no "automatic".
          const options = ["auto", "true", "false"].map((v) => ({ value: v, label: tr(`mute_inverted_${v}`) }));
          return [field, { name: "mute_inverted", selector: { select: { mode: "dropdown", options } } }];
        }),
      },
      { name: "messages", selector: { text: { multiple: true } } },
      { name: "language", selector: { select: { mode: "dropdown", options: [{ value: "", label: tr("lang_auto") }, ...LANGUAGES.map(([value, label]) => ({ value, label }))] } } },
    );
    return schema;
  }

  _render() {
    if (!this._hass || !this._config) return;
    const toggles = this.constructor.toggles;
    const defaults = { ...Object.fromEntries(toggles), image: "auto", color: "auto", illustration_theme: "auto", camera_view: "snapshot", collapsed: DEFAULT_COLLAPSED, history_count: DEFAULT_HISTORY_COUNT, history_hours: DEFAULT_HISTORY_HOURS, ring_duration: DEFAULT_RING_SECONDS, refresh_interval: DEFAULT_REFRESH };
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => t(this._hass, this._config, `opt_${s.name}`);
      this._form.computeHelper = (s) => (s.name === "zoom" || s.name === "messages" ? t(this._hass, this._config, `help_${s.name}`) : undefined);
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        if (config.mute_inverted === "true" || config.mute_inverted === "false") config.mute_inverted = config.mute_inverted === "true";
        else delete config.mute_inverted;
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
    const data = { ...defaults, ...this._config, mute_inverted: typeof this._config.mute_inverted === "boolean" ? String(this._config.mute_inverted) : "auto" };
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

export class DoorbellCardEditor extends DoorbellEditorBase {
  static get full() {
    return true;
  }

  static get toggles() {
    return [
      ["illustration", true],
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

// The detailed view of the mini card is the full card: its editor offers the full card's options, and the zoom button.
export class DoorbellMiniCardEditor extends DoorbellCardEditor {
  static get toggles() {
    return [...DoorbellCardEditor.toggles, ["zoom", true]];
  }
}
