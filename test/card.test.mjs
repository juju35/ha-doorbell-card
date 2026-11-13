import assert from "node:assert/strict";
import { test } from "node:test";
import { devices, entities, ENTRANCE, FRONT, GATE, history, NOW, PORCH, ringing, states } from "../scripts/mock-states.mjs";
import { load } from "./load.mjs";

const lib = load({ now: NOW });
// Values built in the card's sandbox are compared as plain data (their prototypes belong to another realm).
const eq = (a, b, msg) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b, msg);
const clone = (v) => JSON.parse(JSON.stringify(v));

// A mock hass recording the service and WebSocket calls.
const makeHass = (overrides = {}, { withHistory = false } = {}) => {
  const s = clone(states);
  for (const [id, o] of Object.entries(overrides)) s[id] = { ...s[id], ...o, attributes: { ...s[id]?.attributes, ...o.attributes } };
  const hass = {
    states: s,
    entities,
    devices,
    language: "en",
    locale: { language: "en" },
    calls: [],
    ws: [],
    callService(domain, service, data) {
      hass.calls.push([domain, service, data]);
      return Promise.resolve();
    },
    callWS(msg) {
      hass.ws.push(msg);
      return Promise.resolve(withHistory ? Object.fromEntries(msg.entity_ids.map((id) => [id, history[id] || []])) : {});
    },
  };
  return hass;
};

const mount = (Cls, config, hass = makeHass()) => {
  const card = new Cls();
  card.setConfig({ type: "custom:x", ...config });
  card.hass = hass;
  return card;
};
const html = (card) => card.shadowRoot.innerHTML;
// A click on an element with these data attributes, as the shadow root listener receives it.
const click = (card, dataset, extra = {}) => {
  const el = { dataset, classList: { contains: (c) => (extra.classes || []).includes(c) } };
  card.shadowRoot.listeners.click({ composedPath: () => [el], stopPropagation() {}, detail: 1 });
};
const tick = () => new Promise((r) => setTimeout(r, 0));

test("doorbells are found from the registries, whatever the integration", () => {
  const m = lib.resolve(makeHass());
  eq(
    [...m.devices.map((d) => d.name)],
    ["Entrance", "Front door", "Gate", "Porch"],
  );
  const by = Object.fromEntries(m.devices.map((d) => [d.name, d.roles]));
  // Reolink: the main (fluent) camera before its "clear" stream, the visitor sensor, the button sound switch.
  assert.equal(by["Front door"].camera, "camera.front_door_fluent");
  assert.equal(by["Front door"].doorbell, "binary_sensor.front_door_visitor");
  assert.equal(by["Front door"].motion, "binary_sensor.front_door_motion");
  assert.equal(by["Front door"].person, "binary_sensor.front_door_person");
  assert.equal(by["Front door"].mute, "switch.front_door_doorbell_button_sound");
  // DoorBird: doorbell event (device class), relay button as the opener.
  assert.equal(by.Gate.doorbell, "event.gate_doorbell");
  assert.equal(by.Gate.motion, "event.gate_motion");
  assert.equal(by.Gate.opener, "button.gate_relay_1");
  // Ring: ding event, battery sensor, snapshot image.
  assert.equal(by.Porch.doorbell, "event.porch_ding");
  assert.equal(by.Porch.battery, "sensor.porch_battery");
  assert.equal(by.Porch.snapshot, "image.porch_snapshot");
  // UniFi Protect: person detection, LCD message select.
  assert.equal(by.Entrance.person, "binary_sensor.entrance_person_detected");
  assert.equal(by.Entrance.message, "text.entrance_doorbell");
  assert.equal(by.Entrance.message_select, "select.entrance_doorbell_text");
});

test("the device's name in the entity ids lends no role, and openers are never configuration entities", () => {
  const hass = makeHass();
  const by = Object.fromEntries(lib.resolve(hass).devices.map((d) => [d.name, d.roles]));
  // "Front door": its restart button (configuration) and its vehicle detection (motion device class) are not taken
  // for an opener or the motion sensor; the motion sensor without translation key is found from its entity id.
  assert.equal(by["Front door"].opener, undefined);
  assert.equal(by["Front door"].motion, "binary_sensor.front_door_motion");
  // A device called "Doorbell": its person sensor is not taken for the doorbell, nor its switch for an opener.
  const entities = {
    ...hass.entities,
    "binary_sensor.doorbell_person": { entity_id: "binary_sensor.doorbell_person", device_id: "dev_db", platform: "x" },
    "binary_sensor.doorbell_visitor": { entity_id: "binary_sensor.doorbell_visitor", device_id: "dev_db", platform: "x" },
    "switch.doorbell_door_floodlight": { entity_id: "switch.doorbell_door_floodlight", device_id: "dev_db", platform: "x", entity_category: "config" },
    "switch.doorbell_infrared": { entity_id: "switch.doorbell_infrared", device_id: "dev_db", platform: "x" },
  };
  const devices = { ...hass.devices, dev_db: { id: "dev_db", name: "Doorbell" } };
  const db = lib.resolve({ ...hass, entities, devices }).all.get("dev_db").roles;
  assert.equal(db.doorbell, "binary_sensor.doorbell_visitor");
  assert.equal(db.person, "binary_sensor.doorbell_person");
  assert.equal(db.opener, undefined);
});

test("only ring events ring: other event types and old timestamps coming back are left out", () => {
  const now = new Date(NOW - 5000).toISOString();
  const status = (overrides) => mount(lib.DoorbellCard, GATE, makeHass(overrides))._status(lib.findDevice(makeHass(overrides), GATE).dev).key;
  assert.equal(status({ "event.gate_doorbell": { state: now, attributes: { event_type: "ring" } } }), "ringing");
  assert.equal(status({ "event.gate_doorbell": { state: now, attributes: { event_type: "other", event_types: ["ring", "other"] } } }), "idle");
  // Button presses count, not the releases that follow them (Matter, HomeKit).
  assert.equal(status({ "event.gate_doorbell": { state: now, attributes: { event_type: "single_press", event_types: ["single_press", "long_press"] } } }), "ringing");
  assert.equal(status({ "event.gate_doorbell": { state: now, attributes: { event_type: "short_release", event_types: ["initial_press", "short_release"] } } }), "idle");
  const rows = [
    { s: new Date(NOW - 60000).toISOString(), a: { event_type: "ring" } },
    { s: new Date(NOW - 30000).toISOString(), a: { event_type: "other" } },
  ];
  assert.equal(lib.ringsFromHistory("event.gate_doorbell", rows, 0, ["ring", "other"]).length, 1);
  // An event entity's history keeps its attributes; a binary sensor's does not need them.
  const gate = mount(lib.DoorbellCard, GATE);
  assert.equal(gate.hass.ws[0].no_attributes, false);
  assert.equal(mount(lib.DoorbellCard, FRONT).hass.ws[0].no_attributes, true);
  // Unavailable, then back with its old timestamp: no snapshot of a new ring.
  const hass = makeHass({ "event.gate_doorbell": { state: "unavailable" } });
  const card = mount(lib.DoorbellCard, GATE, hass);
  card.hass = makeHass();
  assert.equal(card._captures.length, 0);
  card.hass = makeHass({ "event.gate_doorbell": { state: now } });
  assert.equal(card._captures.length, 1);
});

test("entity options override the registries, and a card given only entities works", () => {
  const hass = makeHass();
  const { dev } = lib.findDevice(hass, FRONT);
  assert.equal(dev.roles.opener, "lock.front_door");
  assert.equal(lib.findDevice(hass, {}).dev.name, "Entrance");
  assert.equal(lib.findDevice(hass, { device: "Gate" }).dev.id, "dev_gate");
  assert.equal(lib.findDevice(hass, { device: "nope" }).error, "unknown_device");
  // An entity of a doorbell device picks that device.
  assert.equal(lib.findDevice(hass, { doorbell: "event.porch_ding" }).dev.id, "dev_porch");
  // A camera of no device: a device of its own.
  hass.states["camera.yard"] = { entity_id: "camera.yard", state: "idle", attributes: { friendly_name: "Yard" } };
  const own = lib.findDevice(hass, { camera: "camera.yard" }).dev;
  assert.equal(own.name, "Yard");
  assert.equal(own.roles.camera, "camera.yard");
  assert.equal(lib.findDevice({ states: {} }, {}).error, "no_registry");
  assert.equal(lib.findDevice({ states: {}, entities: {}, devices: {} }, {}).error, "no_device");
});

test("rings are read from the recorder: event timestamps, binary sensors turning on", () => {
  const since = NOW - 24 * 3600000;
  const bin = lib.ringsFromHistory("binary_sensor.front_door_visitor", history["binary_sensor.front_door_visitor"], since);
  assert.equal(bin.length, 4);
  assert.ok(bin[0] > bin[1], "newest first");
  assert.equal(bin[0], Math.round(NOW - 5.5 * 60000));
  const ev = lib.ringsFromHistory("event.gate_doorbell", history["event.gate_doorbell"], since);
  eq([...ev], [NOW - 49 * 60000, NOW - 260 * 60000, NOW - 600 * 60000]);
  eq([...lib.ringsFromHistory("event.x", [{ s: "unavailable", lu: 1 }, { s: "unknown", lu: 2 }], 0)], []);
  // Older than the period: left out.
  assert.equal(lib.ringsFromHistory("event.porch_ding", history["event.porch_ding"], NOW - 60 * 60000).length, 0);
});

test("status: ringing, person, motion, door unlocked, idle, offline", () => {
  const now = new Date(NOW - 5000).toISOString();
  const status = (overrides, config = FRONT) => mount(lib.DoorbellCard, config, makeHass(overrides))._status(lib.findDevice(makeHass(overrides), config).dev).key;
  assert.equal(status({}), "idle");
  assert.equal(status(ringing), "ringing");
  assert.equal(status({ "binary_sensor.front_door_person": { state: "on" } }), "person");
  assert.equal(status({ "binary_sensor.front_door_motion": { state: "on" } }), "motion");
  assert.equal(status({ "lock.front_door": { state: "unlocked" } }), "unlocked");
  assert.equal(status({ "binary_sensor.front_door_visitor": { state: "unavailable" }, "camera.front_door_fluent": { state: "unavailable" } }), "offline");
  // An event entity rings for ring_duration seconds after its event.
  assert.equal(status({ "event.gate_doorbell": { state: now } }, GATE), "ringing");
  assert.equal(status({}, GATE), "idle");
  assert.equal(status({ "event.gate_motion": { state: now } }, GATE), "motion");
});

test("a binary sensor that is on for a few seconds still shows the ring for ring_duration", () => {
  const card = mount(lib.DoorbellCard, FRONT);
  const dev = () => lib.findDevice(card.hass, FRONT).dev;
  const on = new Date(NOW - 3000).toISOString();
  card.hass = makeHass({ "binary_sensor.front_door_visitor": { state: "on", last_changed: on } });
  assert.equal(card._status(dev()).key, "ringing");
  card.hass = makeHass({ "binary_sensor.front_door_visitor": { state: "off", last_changed: new Date(NOW - 1000).toISOString() } });
  assert.equal(card._status(dev()).key, "ringing");
  // Opened after the ring, the card has not seen it turn on: idle.
  assert.equal(mount(lib.DoorbellCard, FRONT, makeHass({ "binary_sensor.front_door_visitor": { state: "off", last_changed: new Date(NOW - 1000).toISOString() } }))._status(dev()).key, "idle");
});

test("the full card shows the picture, the camera, the last visitor, the actions and the history", async () => {
  const card = mount(lib.DoorbellCard, FRONT, makeHass({}, { withHistory: true }));
  await tick();
  const h = html(card);
  assert.match(h, /class="hero"/);
  assert.match(h, /data-img="\d+"/, "drawn doorbell picture");
  assert.match(h, /data-cam="camera\.front_door_fluent"/);
  assert.match(h, /Last visitor · <b>/);
  assert.match(h, /data-action="open"/);
  assert.match(h, /data-action="messages"/);
  assert.match(h, /data-action="mute"/);
  assert.match(h, /Recent rings/);
  assert.equal((h.match(/class="hist-row"/g) || []).length, 4);
  assert.match(h, /class="chip clickable ok"/);
  // Details folded by default, history unfolded: chevrons follow.
  assert.match(h, /data-section="details" aria-expanded="false"/);
  assert.match(h, /data-section="history" aria-expanded="true"/);
  const ws = card.hass.ws[0];
  assert.equal(ws.type, "history/history_during_period");
  eq([...ws.entity_ids], ["binary_sensor.front_door_visitor"]);
});

test("while ringing, the picture vibrates and the camera shows a banner", () => {
  const card = mount(lib.DoorbellCard, FRONT, makeHass(ringing));
  assert.match(html(card), /Someone is at the door/);
  assert.match(html(card), /class="cam ringing"/);
  const svg = lib.doorbellSvg("dark", "ringing", "ringing");
  assert.match(svg, /class="vib"/);
  assert.match(svg, /class="wv d0"/);
  assert.match(svg, /class="glow"/);
  assert.match(lib.doorbellSvg("dark", "active", "motion"), /class="ir"/);
  assert.match(lib.doorbellSvg("dark", "active", "person"), /class="frame"/);
  assert.doesNotMatch(lib.doorbellSvg("dark", "ok", ""), /class="(vib|wv|ir|frame)/);
  assert.match(lib.doorbellSvg("dark", "ok", ""), /prefers-reduced-motion/);
});

test("opening asks first, at the top of the card, then opens the lock (or presses the relay)", () => {
  const card = mount(lib.DoorbellCard, FRONT);
  click(card, { action: "open" });
  assert.match(html(card), /class="backdrop"/);
  assert.match(html(card), /Open Front door lock\?/);
  assert.equal(card.hass.calls.length, 0);
  click(card, { action: "confirm_ok" });
  // supported_features 1: the latch is opened.
  eq(card.hass.calls[0], ["lock", "open", { entity_id: "lock.front_door" }]);

  const gate = mount(lib.DoorbellCard, { ...GATE, confirm_open: false });
  click(gate, { action: "open" });
  eq(gate.hass.calls[0], ["button", "press", { entity_id: "button.gate_relay_1" }]);

  // While the request is on its way, the button says so and a second press does nothing.
  assert.match(html(gate), /class="btn accent busy" data-action="open"[^>]*aria-busy="true"/);
  click(gate, { action: "open" }, { classes: ["busy"] });
  assert.equal(gate.hass.calls.length, 1);

  const plain = mount(lib.DoorbellCard, FRONT, makeHass({ "lock.front_door": { attributes: { supported_features: 0 } } }));
  click(plain, { action: "open" });
  click(plain, { action: "popup_cancel" });
  assert.equal(plain.hass.calls.length, 0);
  // (a click right after the popup closed is ignored: the guard is over)
  plain._popupClosedAt = 0;
  click(plain, { action: "open" });
  click(plain, { action: "confirm_ok" });
  eq(plain.hass.calls[0], ["lock", "unlock", { entity_id: "lock.front_door" }]);

  // A lock asking for a code: its own dialog opens, where the code is typed; nothing is called from the card.
  const coded = mount(lib.DoorbellCard, FRONT, makeHass({ "lock.front_door": { attributes: { code_format: "^\\d{4}$" } } }));
  click(coded, { action: "open" });
  assert.equal(coded.hass.calls.length, 0);
  assert.equal(coded.events.at(-1).type, "hass-more-info");
  assert.equal(coded.events.at(-1).detail.entityId, "lock.front_door");
});

test("mute: a chime / button sound switch is turned off to mute", () => {
  const card = mount(lib.DoorbellCard, FRONT);
  assert.match(html(card), /aria-label="Mute"/);
  click(card, { action: "mute" });
  eq(card.hass.calls[0], ["switch", "turn_off", { entity_id: "switch.front_door_doorbell_button_sound" }]);
  // Shown muted at once, until the switch reports it.
  assert.match(html(card), /aria-label="Unmute"/);
  const inv = mount(lib.DoorbellCard, { ...FRONT, mute_inverted: false });
  click(inv, { action: "mute" });
  eq(inv.hass.calls[0], ["switch", "turn_off", { entity_id: "switch.front_door_doorbell_button_sound" }]);
  assert.match(html(inv), /aria-label="Mute"/);
});

test("quick messages: spoken with text-to-speech, or shown on the doorbell's display", () => {
  const card = mount(lib.DoorbellCard, FRONT);
  click(card, { action: "messages" });
  assert.match(html(card), /Quick message/);
  assert.match(html(card), /Please leave the parcel at the door/);
  click(card, { action: "send", index: "1" });
  eq(card.hass.calls[0], [
    "tts",
    "speak",
    { entity_id: "tts.piper", media_player_entity_id: "media_player.hallway_speaker", message: "Please leave the parcel at the door", cache: true },
  ]);
  const unifi = mount(lib.DoorbellCard, ENTRANCE);
  click(unifi, { action: "messages" });
  assert.match(html(unifi), /LEAVE PACKAGE AT DOOR/);
  click(unifi, { action: "send", index: "1" });
  eq(unifi.hass.calls[0], ["select", "select_option", { entity_id: "select.entrance_doorbell_text", option: "LEAVE PACKAGE AT DOOR" }]);
  // A message of your own, not one of the select's options, goes to the doorbell's text entity.
  const own = mount(lib.DoorbellCard, { ...ENTRANCE, messages: ["Back in 5 minutes"] });
  click(own, { action: "messages" });
  click(own, { action: "send", index: "0" });
  eq(own.hass.calls[0], ["text", "set_value", { entity_id: "text.entrance_doorbell", value: "Back in 5 minutes" }]);
  // No message target: no Message button.
  assert.doesNotMatch(html(mount(lib.DoorbellCard, GATE)), /data-action="messages"/);
});

test("details: rings today, last motion, lock and battery (whole percent)", async () => {
  const card = mount(lib.DoorbellCard, PORCH, makeHass({ "sensor.porch_battery": { state: "63.6" } }, { withHistory: true }));
  await tick();
  const h = html(card);
  assert.match(h, /Rings today/);
  assert.match(h, /Last motion/);
  assert.match(h, />64 %</);
});

test("sections fold on click and fold back on a click elsewhere", () => {
  const card = mount(lib.DoorbellCard, FRONT);
  click(card, { action: "toggle_section", section: "details" });
  assert.match(html(card), /data-section="details" aria-expanded="true"/);
  card.connectedCallback();
  card._outside.tap({ composedPath: () => [] });
  assert.match(html(card), /data-section="details" aria-expanded="false"/);
});

test("no rewrite under a press: an update is held until the click, which draws it at once, or the release", async () => {
  const card = mount(lib.DoorbellCard, FRONT);
  const open = /data-section="details" aria-expanded="true"/;
  // Pressed: an update (here the section's state changed from elsewhere) does not rewrite the card under the pointer.
  card._onPress();
  card._toggled = new Map([["details", false]]);
  card._update();
  assert.doesNotMatch(html(card), open, "held under the press");
  // Released without a click: drawn right after.
  card._onPressEnd();
  await tick();
  assert.match(html(card), open);
  // The click itself draws at once.
  card._onPress();
  card._onPressClick({ detail: 1 });
  click(card, { action: "toggle_section", section: "details" });
  assert.doesNotMatch(html(card), open);
  card._onPressEnd();
  await tick();
});

test("folding: a tap elsewhere (pointer), not a drag that ends outside; leaving the page folds back too", () => {
  const card = mount(lib.DoorbellCard, FRONT);
  card.connectedCallback();
  const open = /data-section="details" aria-expanded="true"/;
  click(card, { action: "toggle_section", section: "details" });
  // A slider pressed in the card and released outside of it: nothing folds.
  card._outside.tap({ composedPath: () => [card] });
  assert.match(html(card), open);
  // Left with the section open and back: folded.
  card.disconnectedCallback();
  card.connectedCallback();
  assert.doesNotMatch(html(card), open);
  card.disconnectedCallback();
  const mini = mount(lib.DoorbellMiniCard, FRONT);
  mini.connectedCallback();
  click(mini, { action: "zoom" });
  assert.match(html(mini), /class="cam/);
  mini.disconnectedCallback();
  mini.connectedCallback();
  assert.doesNotMatch(html(mini), /class="cam/, "back compact");
  mini.disconnectedCallback();
});

test("mini card: compact last visitor, detail button switching to the full card", () => {
  const card = mount(lib.DoorbellMiniCard, FRONT);
  assert.match(html(card), /class="zoom"/);
  assert.doesNotMatch(html(card), /class="cam/);
  assert.match(html(card), /data-action="open"/);
  assert.equal(card.getGridOptions().columns, 6);
  click(card, { action: "zoom" });
  assert.match(html(card), /class="cam/);
  assert.match(html(card), /aria-label="Show less"/);
  assert.equal(card.getGridOptions().columns, 12);
  card._unzoom.tap({ composedPath: () => [] });
  assert.doesNotMatch(html(card), /class="cam/);
  assert.doesNotMatch(html(mount(lib.DoorbellMiniCard, { ...FRONT, zoom: false })), /class="zoom"/);
});

test("show_* options hide their part; show_title / show_subtitle set host attributes", () => {
  const card = mount(lib.DoorbellCard, { ...FRONT, show_camera: false, show_actions: false, show_history: false, show_details: false, show_last: false, image: "none", show_title: false });
  const h = html(card);
  assert.doesNotMatch(h, /class="cam/);
  assert.doesNotMatch(h, /data-action="open"/);
  assert.doesNotMatch(h, /Recent rings/);
  assert.doesNotMatch(h, /data-img=/);
  assert.equal(card.attrs["hide-title"], true);
});

test("errors are shown in the card", () => {
  assert.match(html(mount(lib.DoorbellCard, { device: "Nope" })), /Device not found: Nope/);
  const empty = { states: {}, entities: {}, devices: {}, language: "en" };
  assert.match(html(mount(lib.DoorbellCard, {}, empty)), /No doorbell found/);
});

test("language: the option, then Home Assistant's, with a fallback to English", () => {
  const card = mount(lib.DoorbellCard, { ...FRONT, language: "fr" });
  assert.match(html(card), /Dernières sonneries/);
  assert.equal(lib.lang({ language: "de-CH" }, {}), "de");
  assert.equal(lib.lang({ language: "sr-Latn" }, {}), "sr-Latn");
  assert.equal(lib.lang({ language: "xx" }, {}), "en");
  assert.equal(lib.intlLocale({ language: "pt" }, {}), "pt-PT");
});

test("every language has every English text, with the same placeholders", () => {
  const en = lib.STRINGS.en;
  const langs = lib.LANGUAGES.map(([l]) => l);
  eq(Object.keys(lib.STRINGS).sort(), [...langs].sort());
  assert.ok(!langs.includes("ga") && !langs.includes("mt"));
  for (const l of langs) {
    const tr = lib.STRINGS[l];
    eq(Object.keys(tr).sort(), Object.keys(en).sort(), l);
    for (const k of Object.keys(en)) {
      const vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
      assert.equal(vars(tr[k]), vars(en[k]), `${l}.${k}`);
      assert.ok(tr[k].trim(), `${l}.${k} is empty`);
    }
  }
});

test("visual editor: stub config, labels, minimal YAML", () => {
  const hass = makeHass();
  eq(lib.DoorbellCard.getStubConfig(hass), { device: "dev_entrance" });
  assert.equal(lib.DoorbellCard.getConfigElement().constructor, lib.DoorbellCardEditor);
  assert.equal(lib.DoorbellMiniCard.getConfigElement().constructor, lib.DoorbellMiniCardEditor);
  const ed = new lib.DoorbellCardEditor();
  ed.setConfig({ type: "custom:doorbell-card" });
  ed.hass = hass;
  const form = ed.children[0];
  assert.equal(form.computeLabel({ name: "lock" }), "Door opener (lock, button or switch)");
  const names = JSON.stringify(form.schema);
  for (const n of ["device", "camera_view", "collapsed", "history_count", "doorbell", "tts_entity", "messages", "language"]) assert.ok(names.includes(`"${n}"`), n);
  const events = [];
  ed.dispatchEvent = (ev) => events.push(ev);
  form.listeners["value-changed"]({
    stopPropagation() {},
    detail: { value: { type: "custom:doorbell-card", device: "dev_front", show_camera: true, camera_view: "snapshot", title: "", ring_duration: 30, messages: ["Hi", ""], collapsed: ["details"] } },
  });
  eq(events[0].detail.config, { type: "custom:doorbell-card", device: "dev_front", messages: ["Hi"] });
  const mini = new lib.DoorbellMiniCardEditor();
  mini.setConfig({});
  mini.hass = hass;
  const miniNames = JSON.stringify(mini.children[0].schema);
  assert.ok(miniNames.includes('"zoom"'));
  assert.ok(!names.includes('"zoom"'));
  // The mini card's detailed view is the full card: its editor offers the full card's options too.
  for (const n of ["show_subtitle", "show_last", "show_details", "show_history", "camera_view", "collapsed", "history_count", "history_hours", "mute_inverted"]) {
    assert.ok(miniNames.includes(`"${n}"`), n);
  }
});

test("visual editor: mute_inverted is automatic, true or false", () => {
  const ed = new lib.DoorbellCardEditor();
  ed.setConfig({ type: "custom:doorbell-card", mute_inverted: false });
  ed.hass = makeHass();
  const form = ed.children[0];
  assert.ok(JSON.stringify(form.schema).includes('"mute_inverted"'));
  assert.equal(form.data.mute_inverted, "false");
  assert.equal(form.computeLabel({ name: "mute_inverted" }), "Chime or mute switch direction");
  const events = [];
  ed.dispatchEvent = (ev) => events.push(ev);
  const change = (mute_inverted) => form.listeners["value-changed"]({ stopPropagation() {}, detail: { value: { type: "custom:doorbell-card", mute_inverted } } });
  change("true");
  change("auto");
  change("false");
  eq(events[0].detail.config, { type: "custom:doorbell-card", mute_inverted: true });
  eq(events[1].detail.config, { type: "custom:doorbell-card" });
  eq(events[2].detail.config, { type: "custom:doorbell-card", mute_inverted: false });
  const auto = new lib.DoorbellMiniCardEditor();
  auto.setConfig({});
  auto.hass = makeHass();
  assert.equal(auto.children[0].data.mute_inverted, "auto");
});

test("the cards are registered for the card picker", () => {
  eq(
    [...lib.window.customCards.map((c) => c.type)],
    ["doorbell-card", "doorbell-mini-card"],
  );
});

test("snapshot URLs are refreshed with a stamp, data URIs are left alone", () => {
  assert.equal(lib.freshUrl("/api/camera_proxy/camera.x?token=a", 5), "/api/camera_proxy/camera.x?token=a&_ts=5");
  assert.equal(lib.freshUrl("data:image/png;base64,AA", 5), "data:image/png;base64,AA");
});
