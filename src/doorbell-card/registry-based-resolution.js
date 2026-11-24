// ---------------------------------------------------------------------------
// Registry-based resolution
// ---------------------------------------------------------------------------
import { DETECTION_RE, DOORBELL_RE, MESSAGE_RE, MOTION_RE, MUTE_RE, OPENER_RE, PERSON_FIRST_RE, PERSON_RE, PLATFORMS, SECONDARY_CAMERA_RE } from "./constants.js";
import { domainOf, objectId } from "./helpers.js";

export const _cache = new WeakMap();

// Entity id form of a name, as Home Assistant writes it ("Front door" → front_door).
export const slugify = (v) =>
  String(v || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

// Entity id prefixes a device gives its entities: its names, slugified.
export const deviceSlugs = (d) => [...new Set([d?.name_by_user, d?.name].map(slugify).filter(Boolean))];

// The key an entity is recognized by: its translation key and its object id without the device's name, which would
// otherwise lend every entity of a device called "Front door" or "Doorbell" the words door and doorbell.
export const roleKey = (e, slugs = []) => {
  let oid = objectId(e.entity_id);
  for (const s of slugs) {
    if (oid === s) oid = "";
    else if (oid.startsWith(`${s}_`)) oid = oid.slice(s.length + 1);
    else continue;
    break;
  }
  return `${e.translation_key || ""} ${oid}`;
};
export const deviceClassOf = (hass, id) => hass.states?.[id]?.attributes?.device_class;

// First entity of `list` that matches `test`, in the order of the list.
export const pick = (list, test) => list.find(test)?.entity_id;

// Roles of a device's entities: camera, doorbell, motion, person, opener, mute, snapshot, battery, message.
export const roles = (hass, list, slugs = []) => {
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
export const resolve = (hass) => {
  if (!hass?.entities || !hass.devices) return null;
  const cached = _cache.get(hass.entities);
  // Rebuilt when the registries change, not on every state change (device classes do not change with the state),
  // and once an entity whose device class is read had no state yet (registries loaded before the states): its
  // doorbell, motion or battery device class would otherwise stay unknown until the registries change.
  if (cached && cached.devices === hass.devices && !cached.stateless.some((id) => hass.states?.[id])) return cached.model;
  const byDevice = new Map();
  const stateless = [];
  for (const e of Object.values(hass.entities)) {
    if (!e?.device_id || e.hidden || e.disabled_by) continue;
    if (!hass.states?.[e.entity_id] && ["event", "binary_sensor", "sensor"].includes(domainOf(e.entity_id))) stateless.push(e.entity_id);
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
  _cache.set(hass.entities, { devices: hass.devices, stateless, model });
  return model;
};

export const listDevices = (hass) => {
  const m = resolve(hass);
  if (!m) return [];
  const doorbells = m.devices.map((d) => ({ value: d.id, label: d.name }));
  const cameras = [...m.all.values()].filter((d) => !d.roles.doorbell).sort((a, b) => a.name.localeCompare(b.name));
  return [...doorbells, ...cameras.map((d) => ({ value: d.id, label: d.name }))];
};

// Entity options that override (or stand in for) what the registries give.
export const ROLE_OPTIONS = { camera: "camera", doorbell: "doorbell", motion: "motion", person: "person", opener: "lock", mute: "mute", snapshot: "snapshot", battery: "battery", message: "message_entity" };

/**
 * The device the card shows, with its entity roles merged with the entity options. Without `device`, the device of
 * the `doorbell` or `camera` option, else the first doorbell. A card given only entities (no device in the
 * registries, a YAML camera…) still works: it gets a device of its own, named after the camera or the doorbell.
 */
export const findDevice = (hass, config) => {
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
