// Mock Home Assistant data for the screenshots and the tests: four doorbells of four integrations (Reolink, DoorBird,
// Ring, UniFi Protect), with neutral names only. Times are relative to NOW, the clock the screenshot pages are frozen at.
export const NOW = Date.parse("2026-11-13T10:47:00Z");
const at = (min) => new Date(NOW - min * 60000).toISOString();

// A camera picture: a porch drawn in SVG (16:9), with an optional visitor holding a parcel, a time stamp and the
// camera name, as camera snapshots usually carry them.
export const scene = ({ wall = "#c9b79c", door = "#5b6b7a", floor = "#8d8478", visitor = false, gate = false, label = "FRONT DOOR", time = "10:47:00" } = {}) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>
  <radialGradient id="v" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient></defs>
  <rect width="640" height="360" fill="${wall}"/>
  <rect y="262" width="640" height="98" fill="${floor}"/>
  <path d="M0 262 L640 262" stroke="#000" stroke-opacity=".18" stroke-width="3"/>
  ${
    gate
      ? `<rect x="120" y="70" width="400" height="200" fill="#9fb3c2"/>${Array.from({ length: 13 }, (_, i) => `<rect x="${130 + i * 30}" y="70" width="8" height="200" fill="#2f3438"/>`).join("")}<rect x="120" y="70" width="400" height="10" fill="#2f3438"/><rect x="120" y="180" width="400" height="8" fill="#2f3438"/>`
      : `<rect x="230" y="40" width="180" height="228" fill="#ece6dc"/><rect x="246" y="56" width="148" height="212" fill="${door}"/>
         <rect x="262" y="76" width="116" height="78" rx="4" fill="#000" opacity=".12"/><rect x="262" y="170" width="116" height="78" rx="4" fill="#000" opacity=".12"/>
         <circle cx="370" cy="170" r="6" fill="#d8c48a"/>
         <rect x="236" y="270" width="168" height="18" rx="4" fill="#6b5a48"/>
         <path d="M110 268 q-30 -60 0 -110 q30 50 0 110z" fill="#5f8a4e"/><path d="M110 268 q-55 -40 -40 -90 q45 30 40 90z" fill="#4e7a40"/><path d="M110 268 q55 -40 40 -90 q-45 30 -40 90z" fill="#6f9a5c"/>
         <path d="M88 268 h44 l-6 34 h-32z" fill="#a0603c"/>
         <rect x="470" y="96" width="58" height="72" rx="6" fill="#3c4148"/><rect x="478" y="104" width="42" height="34" rx="3" fill="#d9dde1"/>`
  }
  ${
    visitor
      ? `<g><ellipse cx="320" cy="340" rx="70" ry="10" fill="#000" opacity=".22"/>
         <path d="M262 360 q0 -120 58 -128 q58 8 58 128z" fill="#2f5d8a"/>
         <circle cx="320" cy="200" r="34" fill="#c99a78"/><path d="M286 196 q4 -42 34 -42 q30 0 34 42 q-12 -18 -34 -18 q-22 0 -34 18z" fill="#3a2b22"/>
         <rect x="280" y="262" width="80" height="58" rx="4" fill="#b98a55"/><rect x="280" y="282" width="80" height="6" fill="#a0733f"/></g>`
      : ""
  }
  <rect width="640" height="360" fill="url(#l)"/><rect width="640" height="360" fill="url(#v)"/>
  <text x="620" y="30" text-anchor="end" font-family="DejaVu Sans Mono, monospace" font-size="18" fill="#fff" opacity=".9">2026-11-13 ${time}</text>
  <text x="20" y="342" font-family="DejaVu Sans Mono, monospace" font-size="16" fill="#fff" opacity=".85">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const PICTURES = {
  front: scene({ label: "FRONT DOOR", time: "10:46:52" }),
  frontVisitor: scene({ label: "FRONT DOOR", visitor: true, time: "10:46:56" }),
  gate: scene({ wall: "#b7c4a8", floor: "#8a8a82", gate: true, label: "GATE", time: "10:46:48" }),
  porch: scene({ wall: "#d7d2c8", door: "#7a4b3a", floor: "#9b8f80", label: "PORCH", time: "10:46:50" }),
  entrance: scene({ wall: "#cfd5d9", door: "#2f3a45", floor: "#7f8790", label: "ENTRANCE", time: "10:46:55" }),
  entranceVisitor: scene({ wall: "#cfd5d9", door: "#2f3a45", floor: "#7f8790", visitor: true, label: "ENTRANCE", time: "10:46:58" }),
};
export { PICTURES };

const st = (entity_id, state, attributes = {}, changedMin = 120) => ({ entity_id, state, attributes, last_changed: at(changedMin), last_updated: at(changedMin) });

export const states = Object.fromEntries(
  [
    // Reolink Video Doorbell WiFi, with a Nuki lock (another device) set as `lock`, a speaker for the messages.
    st("camera.front_door_fluent", "idle", { friendly_name: "Front door", entity_picture: PICTURES.front }),
    st("camera.front_door_clear", "idle", { friendly_name: "Front door Clear", entity_picture: PICTURES.front }),
    st("binary_sensor.front_door_visitor", "off", { friendly_name: "Front door Visitor" }, 5),
    st("binary_sensor.front_door_motion", "off", { friendly_name: "Front door Motion", device_class: "motion" }, 3),
    // Reolink gives its person and vehicle detections the motion device class too.
    st("binary_sensor.front_door_vehicle", "off", { friendly_name: "Front door Vehicle", device_class: "motion" }, 300),
    st("binary_sensor.front_door_person", "off", { friendly_name: "Front door Person", device_class: "motion" }, 4),
    st("button.front_door_restart", "unknown", { friendly_name: "Front door Restart", device_class: "restart" }),
    st("switch.front_door_doorbell_button_sound", "on", { friendly_name: "Front door Doorbell button sound" }),
    st("lock.front_door", "locked", { friendly_name: "Front door lock", supported_features: 1 }),
    st("media_player.hallway_speaker", "idle", { friendly_name: "Hallway speaker" }),
    st("tts.piper", "unknown", { friendly_name: "Piper" }),
    // DoorBird D2101V: event entities, a relay button opening the gate.
    st("camera.gate_live", "idle", { friendly_name: "Gate live", entity_picture: PICTURES.gate }),
    st("event.gate_doorbell", at(49), { friendly_name: "Gate Doorbell", device_class: "doorbell", event_type: "ring", event_types: ["ring"] }, 49),
    st("event.gate_motion", at(12), { friendly_name: "Gate Motion", device_class: "motion", event_type: "motion", event_types: ["motion"] }, 12),
    st("button.gate_relay_1", "unknown", { friendly_name: "Gate Relay 1" }),
    // Ring Battery Doorbell Plus: ding and motion events, battery, snapshot image.
    st("camera.porch_live_view", "idle", { friendly_name: "Porch Live view", entity_picture: PICTURES.porch }),
    st("event.porch_ding", at(95), { friendly_name: "Porch Ding", device_class: "doorbell", event_type: "ring", event_types: ["ring"] }, 95),
    st("event.porch_motion", at(31), { friendly_name: "Porch Motion", device_class: "motion", event_type: "motion", event_types: ["motion"] }, 31),
    st("sensor.porch_battery", "64", { friendly_name: "Porch Battery", device_class: "battery", unit_of_measurement: "%" }),
    st("image.porch_snapshot", "2026-11-13T09:12:00Z", { friendly_name: "Porch Snapshot", entity_picture: PICTURES.porch }),
    // UniFi Protect G4 Doorbell Pro: doorbell event, person detection, LCD message select.
    st("camera.entrance_high_resolution_channel", "idle", { friendly_name: "Entrance High resolution", entity_picture: PICTURES.entrance }),
    st("event.entrance_doorbell", at(180), { friendly_name: "Entrance Doorbell", device_class: "doorbell", event_type: "ring", event_types: ["ring"] }, 180),
    st("binary_sensor.entrance_person_detected", "off", { friendly_name: "Entrance Person detected" }, 18),
    // UniFi Protect: the "Doorbell text" select offers the console's messages, the "Doorbell" text takes any text.
    st("select.entrance_doorbell_text", "Default Message (Welcome)", {
      friendly_name: "Entrance Doorbell text",
      options: ["Default Message (Welcome)", "LEAVE PACKAGE AT DOOR", "DO NOT DISTURB", "Be right there"],
    }),
    st("text.entrance_doorbell", "Welcome", { friendly_name: "Entrance Doorbell", mode: "text", min: 0, max: 30 }),
  ].map((s) => [s.entity_id, s]),
);

const ent = (entity_id, device_id, platform, translation_key, entity_category) => [entity_id, { entity_id, device_id, platform, translation_key, entity_category }];
export const entities = Object.fromEntries([
  ent("camera.front_door_fluent", "dev_front", "reolink", "fluent"),
  ent("camera.front_door_clear", "dev_front", "reolink", "clear"),
  ent("binary_sensor.front_door_vehicle", "dev_front", "reolink", "vehicle"),
  ent("binary_sensor.front_door_person", "dev_front", "reolink", "person"),
  ent("binary_sensor.front_door_visitor", "dev_front", "reolink", "visitor"),
  ent("binary_sensor.front_door_motion", "dev_front", "reolink", null),
  ent("button.front_door_restart", "dev_front", "reolink", null, "config"),
  ent("switch.front_door_doorbell_button_sound", "dev_front", "reolink", "doorbell_button_sound"),
  ent("lock.front_door", "dev_lock", "nuki", null),
  ent("media_player.hallway_speaker", "dev_speaker", "cast", null),
  ent("camera.gate_live", "dev_gate", "doorbird", null),
  ent("event.gate_doorbell", "dev_gate", "doorbird", "doorbell"),
  ent("event.gate_motion", "dev_gate", "doorbird", "motion"),
  ent("button.gate_relay_1", "dev_gate", "doorbird", "relay"),
  ent("camera.porch_live_view", "dev_porch", "ring", "live_view"),
  ent("event.porch_ding", "dev_porch", "ring", "ding"),
  ent("event.porch_motion", "dev_porch", "ring", "motion"),
  ent("sensor.porch_battery", "dev_porch", "ring", null),
  ent("image.porch_snapshot", "dev_porch", "ring", null),
  ent("camera.entrance_high_resolution_channel", "dev_entrance", "unifiprotect", null),
  ent("event.entrance_doorbell", "dev_entrance", "unifiprotect", "doorbell"),
  ent("binary_sensor.entrance_person_detected", "dev_entrance", "unifiprotect", "person_detected"),
  ent("select.entrance_doorbell_text", "dev_entrance", "unifiprotect", "doorbell_text", "config"),
  ent("text.entrance_doorbell", "dev_entrance", "unifiprotect", "doorbell", "config"),
]);

export const devices = {
  dev_front: { id: "dev_front", name: "Front door", manufacturer: "Reolink", model: "Video Doorbell WiFi" },
  dev_gate: { id: "dev_gate", name: "Gate", manufacturer: "DoorBird", model: "D2101V" },
  dev_porch: { id: "dev_porch", name: "Porch", manufacturer: "Ring", model: "Battery Doorbell Plus" },
  dev_entrance: { id: "dev_entrance", name: "Entrance", manufacturer: "Ubiquiti", model: "G4 Doorbell Pro" },
  dev_lock: { id: "dev_lock", name: "Front door lock", manufacturer: "Nuki", model: "Smart Lock 4.0" },
  dev_speaker: { id: "dev_speaker", name: "Hallway speaker", manufacturer: "Google", model: "Nest Mini" },
};

// Recorder answers (history/history_during_period, minimal response): the rings of the last day of each doorbell.
const sec = (min) => (NOW - min * 60000) / 1000;
export const history = {
  "binary_sensor.front_door_visitor": [
    { s: "off", lu: sec(1440) },
    { s: "on", lu: sec(1285) },
    { s: "off", lu: sec(1284.5) },
    { s: "on", lu: sec(977) },
    { s: "off", lu: sec(976.5) },
    { s: "on", lu: sec(152) },
    { s: "off", lu: sec(151.5) },
    { s: "on", lu: sec(5.5) },
    { s: "off", lu: sec(5) },
  ],
  "event.gate_doorbell": [{ s: at(600), lu: sec(600) }, { s: at(260), lu: sec(260) }, { s: at(49), lu: sec(49) }],
  "event.porch_ding": [{ s: at(1300), lu: sec(1300) }, { s: at(95), lu: sec(95) }],
  "event.entrance_doorbell": [{ s: at(900), lu: sec(900) }, { s: at(180), lu: sec(180) }],
};

// Answers the card's WebSocket calls from the mock data.
export const callWS = async (msg) => {
  if (msg?.type !== "history/history_during_period") return {};
  return Object.fromEntries((msg.entity_ids || []).map((id) => [id, history[id] || []]));
};

// State overrides of the animated states (one GIF each):
//   ringing — a visitor rang the front door a few seconds ago (binary_sensor on)
//   motion  — the gate's motion event fired a few seconds ago
//   person  — the entrance sees a person
export const ringing = {
  "binary_sensor.front_door_visitor": { state: "on", last_changed: at(0.1), last_updated: at(0.1) },
  "camera.front_door_fluent": { attributes: { friendly_name: "Front door", entity_picture: PICTURES.frontVisitor } },
};
export const motion = {
  "event.gate_motion": { state: at(0.1), last_changed: at(0.1), last_updated: at(0.1) },
};
export const person = {
  "binary_sensor.entrance_person_detected": { state: "on", last_changed: at(0.2), last_updated: at(0.2) },
  "camera.entrance_high_resolution_channel": { attributes: { friendly_name: "Entrance High resolution", entity_picture: PICTURES.entranceVisitor } },
};

// Card options of the screenshots for each doorbell.
export const FRONT = { device: "dev_front", lock: "lock.front_door", tts_entity: "media_player.hallway_speaker", messages: ["We'll be right there", "Please leave the parcel at the door"] };
export const GATE = { device: "dev_gate" };
export const PORCH = { device: "dev_porch", collapsed: [] };
export const ENTRANCE = { device: "dev_entrance" };
