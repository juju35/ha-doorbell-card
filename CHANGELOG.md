# Changelog

## 1.0.0 - 2026-11-13

### Features
- **Doorbell Card** (`custom:doorbell-card`) for video doorbells and intercoms: drawn doorbell colored by its state, camera preview (refreshed snapshot or live stream), last visitor (time, day, how long ago, snapshot), quick actions (open the door or the gate after a confirmation at the top of the card, quick messages by text-to-speech or on the doorbell's display, mute the chime), details (rings today, last motion, lock, battery) and ring history from the recorder.
- **Doorbell Mini Card** (`custom:doorbell-mini-card`): state, last visitor, Open and Mute buttons, and a detail button switching to the full card.
- Animations of the drawn doorbell: it vibrates with sound waves while it rings, sweeps a radar above its lens on motion and frames a detected person; the camera frame glows and a banner shows while it rings. All of them honour `prefers-reduced-motion`.
- Entities discovered from the registries for Ring, Reolink, UniFi Protect, Google Nest, Tapo, DoorBird, Aqara (Matter / HomeKit), Frigate and more; every entity can also be set by hand.
- Snapshots taken by the card when a ring arrives, shown as the last visitor's picture and in the history.
- Visual editors for both cards, collapsible sections folded back by a click elsewhere, Sections view sizes and narrow layouts.
- 22 languages: English in the bundle, every other language in its own file loaded on demand.
