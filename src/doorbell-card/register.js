// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
import { pickerDefine } from "./card-picker.js";
import { VERSION } from "./core.js";
import { DoorbellCard, DoorbellMiniCard } from "./cards.js";
import { DoorbellCardEditor, DoorbellMiniCardEditor } from "./visual-editors.js";

export const define = (name, cls) => {
  if (!customElements.get(name)) pickerDefine(name, cls);
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
