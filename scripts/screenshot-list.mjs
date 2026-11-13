// The README screenshots (PNG) and animations (GIF) rendered by scripts/screenshots.mjs.
// Every capture has a twin in the other theme ("-dark" for a light capture, "-light" for a dark one)
// that shows exactly the same state: only the theme differs (checked by test/screenshots.test.mjs).
import { ENTRANCE, FRONT, GATE, motion, PORCH, person, ringing } from "./mock-states.mjs";

const twins = (file, theme, rest) => [
  { file, theme, ...rest },
  { file: `${file}-${theme === "light" ? "dark" : "light"}`, theme: theme === "light" ? "dark" : "light", ...rest },
];

export const shots = [
  ...twins("card", "light", { type: "doorbell-card", width: 460, config: FRONT }),
  ...twins("card-gate", "dark", { type: "doorbell-card", width: 460, config: GATE }),
  ...twins("card-porch", "light", { type: "doorbell-card", width: 460, config: PORCH }),
  ...twins("card-entrance", "dark", { type: "doorbell-card", width: 460, config: ENTRANCE }),
  // The confirmation before opening and the quick messages, at the top of the card.
  ...twins("card-open", "light", { type: "doorbell-card", width: 460, config: FRONT, clicks: ['[data-action="open"]'] }),
  ...twins("card-messages", "dark", { type: "doorbell-card", width: 460, config: FRONT, clicks: ['[data-action="messages"]'] }),
  ...twins("mini-card", "light", { type: "doorbell-mini-card", width: 380, config: FRONT }),
  ...twins("mini-card-gate", "dark", { type: "doorbell-mini-card", width: 380, config: GATE }),
  ...twins("mini-card-zoom", "light", { type: "doorbell-mini-card", width: 460, config: FRONT, clicks: [".zoom"] }),
  // Narrow cards: the full card at 6 of 12 columns of a phone's Sections view, the mini card at 6 columns.
  ...twins("card-narrow", "light", { type: "doorbell-card", width: 238, config: FRONT }),
  ...twins("mini-card-narrow", "light", { type: "doorbell-mini-card", width: 170, config: FRONT }),
];

// One looping GIF per distinct animated state (each plays different keyframes):
//   ringing      — the doorbell vibrates, its button ring glows, sound waves leave it; the camera frame glows and
//                  a banner says someone is at the door
//   motion       — radar arcs sweep above the lens and the infrared LEDs blink (DoorBird motion event)
//   person       — a detection frame closes in on the lens (UniFi Protect person detection)
//   mini-ringing — the mini card while it rings
// Each one is followed by its twin in the other theme.
export const gifs = [
  ...twins("ringing", "light", { type: "doorbell-card", width: 460, config: FRONT, overrides: ringing }),
  ...twins("motion", "dark", { type: "doorbell-card", width: 460, config: GATE, overrides: motion }),
  ...twins("person", "light", { type: "doorbell-card", width: 460, config: ENTRANCE, overrides: person }),
  ...twins("mini-ringing", "dark", { type: "doorbell-mini-card", width: 380, config: FRONT, overrides: ringing }),
];
