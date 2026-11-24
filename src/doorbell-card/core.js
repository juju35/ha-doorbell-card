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

export const VERSION = "__VERSION__";
