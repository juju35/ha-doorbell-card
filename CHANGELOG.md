# Changelog

## 1.1.0 - 2026-11-17

### Features
- Illustrated header on both cards (90 px): the front of the house (siding wall, roof edge, porch lantern, front door, house number, potted plant) on a 10 px concrete strip, with the card's own doorbell drawn big beside the door, in its finish and animated by its state (vibrating with sound waves while it rings, radar on motion, detection frame on a person); the porch lantern blinks while it rings. The title, the status chip and the subtitle sit on the wall at the left.
- Night picture (dark wall, lit lantern and door glass) while the sun is below the horizon, else with the dark theme; `illustration_theme: day | night` forces it, `illustration: false` keeps the classic header. Both options are in the visual editors, in every language.
- The header icon's color always follows the state: gray when idle, the accent while ringing, blue on a detection, amber when the door is unlocked, red when offline.
- Status pill on the title line, right after the title, in the header icon's color (gray when idle); on a narrow card (≤ 260 px) it takes a line of its own under the subtitle, and below 200 px only its dot stays. The mini card's detail button is a 24 px round glass button in the top right corner of the header.
- Night picture with the dark theme even while the sun is up
- Full card: while idle, the big line under the header shows the last visitor's time (under a small "Last visitor" caption) instead of repeating the "Idle" already in the status pill; ringing, a detection, an unlocked door or offline stay big.

## 1.0.2 - 2026-11-14

### Fixes
- Visual editors: `mute_inverted` was YAML only; both editors now offer it under the mute switch, as Automatic (from the switch's name), on while it rings aloud, or on while muted, in every language.
- Mini card visual editor: it now offers the full card's options that its detailed view uses (`show_subtitle`, `show_last`, `show_details`, `show_history`, `camera_view`, `collapsed`, `history_count`, `history_hours`), which could only be set in YAML.

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
