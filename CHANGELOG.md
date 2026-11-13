# Changelog

## 1.0.1 - 2026-11-13

### Fixes
- Folding back on a tap elsewhere now works on iOS (Safari and the companion app): a tap on something that is not clickable sent no click to the page, so the unfolded sections, the popup and the detailed view of the mini card stayed open. The press and the release are caught instead; a slider dragged out of the card and a scroll do not fold anything.
- Leaving the card (another dashboard view, a conditional card hidden) brings it back in its default state: sections folded as configured, popup closed, mini card compact.
- Clicks lost under an update: Home Assistant updates the card several times a second, and an update that rewrote the card between the press and the release replaced the element pressed, so that the click landed on the card itself and did nothing. The card is no longer rewritten while a press is in progress; the pending update is drawn right after the click.
- Focus ring after a mouse click: the focus was put back on the clicked element after each update, which drew the focus ring. It is now kept across updates only for the keyboard.

## 1.0.0 - 2026-11-13

### Features
- **Doorbell Card** (`custom:doorbell-card`) for video doorbells and intercoms: drawn doorbell colored by its state, camera preview (refreshed snapshot or live stream), last visitor (time, day, how long ago, snapshot), quick actions (open the door or the gate after a confirmation at the top of the card, quick messages by text-to-speech or on the doorbell's display, mute the chime), details (rings today, last motion, lock, battery) and ring history from the recorder.
- **Doorbell Mini Card** (`custom:doorbell-mini-card`): state, last visitor, Open and Mute buttons, and a detail button switching to the full card.
- Animations of the drawn doorbell: it vibrates with sound waves while it rings, sweeps a radar above its lens on motion and frames a detected person; the camera frame glows and a banner shows while it rings. All of them honour `prefers-reduced-motion`.
- Entities discovered from the registries for Ring, Reolink, UniFi Protect, Google Nest, Tapo, DoorBird, Aqara (Matter / HomeKit), Frigate and more; every entity can also be set by hand.
- Snapshots taken by the card when a ring arrives, shown as the last visitor's picture and in the history.
- Visual editors for both cards, collapsible sections folded back by a click elsewhere, Sections view sizes and narrow layouts.
- 22 languages: English in the bundle, every other language in its own file loaded on demand.
