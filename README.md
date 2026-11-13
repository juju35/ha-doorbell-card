# ha-doorbell-card

[![Marketplace](https://img.shields.io/badge/Marketplace-Custom-41BDF5.svg)](https://www.home-assistant.io/integrations/marketplace/)
[![HACS Validation](https://github.com/juju35/ha-doorbell-card/actions/workflows/hacs.yml/badge.svg)](https://github.com/juju35/ha-doorbell-card/actions/workflows/hacs.yml)
[![Validate](https://github.com/juju35/ha-doorbell-card/actions/workflows/validate.yml/badge.svg)](https://github.com/juju35/ha-doorbell-card/actions/workflows/validate.yml)
[![Lint](https://github.com/juju35/ha-doorbell-card/actions/workflows/lint.yml/badge.svg)](https://github.com/juju35/ha-doorbell-card/actions/workflows/lint.yml)
[![Release](https://img.shields.io/github/v/release/juju35/ha-doorbell-card)](https://github.com/juju35/ha-doorbell-card/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/juju35/ha-doorbell-card/blob/main/LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/julienstep9)

<p align="center"><img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/images/icon.svg" alt="Doorbell Card" width="120"></p>

<p align="center">
  <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/images/ring.png" alt="Ring" width="64">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/images/reolink.png" alt="Reolink" width="64">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/images/unifiprotect.png" alt="UniFi Protect" width="64">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/images/nest.png" alt="Google Nest" width="64">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/images/tapo_control.png" alt="Tapo" width="64">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/images/doorbird.png" alt="DoorBird" width="64">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/images/matter.png" alt="Matter" width="64">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/images/homekit.png" alt="HomeKit" width="64">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/images/frigate.png" alt="Frigate" width="64">
</p>

Lovelace cards for Home Assistant **video doorbells and intercoms**: camera preview, last visitor (time and snapshot), ring history and quick actions — open the door or the gate (with a confirmation), send a quick message (text-to-speech or the doorbell's own display) and mute the chime — with a drawn doorbell that rings, vibrates and watches along with yours.

The cards work on top of the integrations you already use — [Ring](https://www.home-assistant.io/integrations/ring/), [Reolink](https://www.home-assistant.io/integrations/reolink/), [UniFi Protect](https://www.home-assistant.io/integrations/unifiprotect/), [Google Nest](https://www.home-assistant.io/integrations/nest/), [Tapo](https://github.com/JurajNyiri/HomeAssistant-Tapo-Control), [DoorBird](https://www.home-assistant.io/integrations/doorbird/), Aqara (through [Matter](https://www.home-assistant.io/integrations/matter/) or [HomeKit Device](https://www.home-assistant.io/integrations/homekit_controller/)), [Frigate](https://github.com/blakeblackshear/frigate-hass-integration) and more. The doorbell's entities (`event`, `binary_sensor`, `camera`, `lock`, `button`, `switch`, `image`…) are **discovered automatically** from the Home Assistant registries, whatever your language or entity ids; each one can also be set by hand.

[![Open your Home Assistant instance and open a repository inside the Marketplace.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-doorbell-card&category=plugin)

| Doorbell Card | Doorbell Mini Card |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/card.png" alt="doorbell card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/mini-card.png" alt="doorbell mini card" width="380"><br><br><img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/mini-card-gate.png" alt="doorbell mini card, gate intercom" width="380"> |

## Features

- Two cards: a full **Doorbell Card** (`custom:doorbell-card`) and a compact **Doorbell Mini Card** (`custom:doorbell-mini-card`)
- Drawn video doorbell, dark, white or stainless steel (per brand, or `color`), colored by its state and animated: it **vibrates with sound waves while it rings**, sweeps a radar above its lens on motion and frames a detected person (see [Animations](#animations)); or your own picture
- Header icon in a tinted round badge taking the color of the state, and a status chip on the title line: **Ringing** (orange), **Person** / **Motion** (blue), **Door unlocked** (orange), **Idle** (green), **Offline** (red)
- Camera preview: snapshot refreshed every 10 seconds (`refresh_interval`), or the live stream (`camera_view: live`); its frame glows and a banner says someone is at the door while it rings; click it for the camera's more-info dialog
- Last visitor: time, day and how long ago, with its snapshot (taken by the card when the ring arrives, or the integration's snapshot image)
- Ring history from the recorder (last 24 hours by default), with the snapshots the card took for the rings it saw
- Quick actions, as smoked-glass buttons: **Open** the door or the gate (a lock is opened — or unlocked —, a relay button pressed, a switch or script turned on), always after a confirmation at the top of the card unless `confirm_open: false`; **Message**, a list of quick messages spoken on a speaker (text-to-speech) or shown on the doorbell's display (UniFi Protect LCD message); **Mute** / **Unmute** the chime or the doorbell's button sound
- Details: rings today, last motion, lock state and battery (whole percent)
- Collapsible sections (chevron to the right when folded, down when unfolded), folded back by a click anywhere else on the page
- Detail button on the mini card (top right): it switches the mini card to the full card's content and back; a click anywhere outside the card brings the compact view back
- Sections view: the full card takes 12 columns by default and at least 6, the mini card 6; narrow widths get their own layout (see [Screenshots](#screenshots))
- Click any value to open its Home Assistant history (more-info dialog)
- Visual editor in the dashboard UI for both cards (no YAML needed)
- Light and dark mode, English, French, German, Spanish, Serbian (Cyrillic and Latin), Italian, Dutch, European Portuguese, Polish, Romanian, Danish, Swedish, Bulgarian, Russian, Ukrainian, Hungarian, Slovak, Czech, Slovenian, Latvian and Greek
- Single file, no external dependency; translations load on demand

## Supported integrations

| Integration | Doorbells | What the cards use |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/images/ring.png" alt="" width="16"> [Ring](https://www.home-assistant.io/integrations/ring/) (core) | Ring Video Doorbell, Battery Doorbell, Doorbell Pro, Peephole Cam | Ding and motion `event` entities, live view `camera`, battery `sensor`, snapshot `image` |
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/images/reolink.png" alt="" width="16"> [Reolink](https://www.home-assistant.io/integrations/reolink/) (core) | Reolink Video Doorbell (WiFi, PoE) | Visitor, motion and person `binary_sensor` entities, Fluent / Clear `camera`, doorbell button sound `switch` (mute) |
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/images/unifiprotect.png" alt="" width="16"> [UniFi Protect](https://www.home-assistant.io/integrations/unifiprotect/) (core) | G4 Doorbell, G4 Doorbell Pro, G6 Entry | Doorbell `event`, motion and person detection `binary_sensor` entities, `camera`, doorbell text `select` and `text` (quick messages on the doorbell's screen) |
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/images/nest.png" alt="" width="16"> [Google Nest](https://www.home-assistant.io/integrations/nest/) (core) | Nest Doorbell (wired, battery) | Chime, motion and person `event` entities, `camera` |
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/images/tapo_control.png" alt="" width="16"> [Tapo](https://github.com/JurajNyiri/HomeAssistant-Tapo-Control) (custom, `tapo_control`) | Tapo video doorbells (D230, D225…) | Doorbell ring and motion / person sensors, `camera`, chime switch |
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/images/doorbird.png" alt="" width="16"> [DoorBird](https://www.home-assistant.io/integrations/doorbird/) (core) | DoorBird D10x, D11x, D21x, D2101V… | Doorbell and motion `event` entities, `camera`, relay `button` (opens the gate) |
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/images/matter.png" alt="" width="16"> [Matter](https://www.home-assistant.io/integrations/matter/) / <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/images/homekit.png" alt="" width="16"> [HomeKit Device](https://www.home-assistant.io/integrations/homekit_controller/) (core) | Aqara G4 and other Matter / HomeKit doorbells | Doorbell `event` (device class `doorbell`), `camera`, motion sensor |
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/images/frigate.png" alt="" width="16"> [Frigate](https://github.com/blakeblackshear/frigate-hass-integration) (custom) | Any camera watched by Frigate | Person occupancy `binary_sensor`, motion, `camera`, last snapshot `image`: pick the camera device and set the doorbell entity (`doorbell`) of the button you use |
| eufy Security, Blink, Amcrest, Hikvision, ONVIF… | Doorbells exposing an event or a binary sensor | Recognized from their entities as well; any entity can be set by hand (see [Entities](#entities)) |

A device is listed as a doorbell when it has an `event` entity of device class `doorbell`, or an `event` / `binary_sensor` entity named after a ring (ding, doorbell, visitor, ring, chime, press…). A door lock, a gate relay or a speaker of another device is set with the `lock` and `tts_entity` options. Details in [How it works](#how-it-works).

## Prerequisites

Home Assistant 2024.8 or later, with the integration of your doorbell configured. The ring history reads the recorder (enabled by default).

## Installation

### Via the Marketplace (recommended)

Click the button below to add the repository directly:

[![Add to the Marketplace](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-doorbell-card&category=plugin)

Then click **Install**, and reload your browser when the Marketplace asks you to.

Or manually:

1. Open **Settings → Marketplace → Add from link** (top right; this needs a GitHub account connected)
2. Add `https://github.com/juju35/ha-doorbell-card` — Type: **Dashboard**
3. Open **Doorbell Card** and click **Install**
4. Clear your browser cache and refresh

The Marketplace adds the resource `/local/community/ha-doorbell-card/doorbell-card.js` for you.

### Manual

1. Download `doorbell-card.js` and the `doorbell-card.i18n.*.js` translation files from the [latest release](https://github.com/juju35/ha-doorbell-card/releases/latest)
2. Copy them all to `/config/www/` (without the translation files, the cards show in English)
3. Go to **Settings → Dashboards → ⋮ → Resources** → Add resource:
   - URL: `/local/doorbell-card.js`
   - Type: **JavaScript Module**
4. Clear your browser cache and refresh

## Configuration

### Card types

| Card | Type |
|---|---|
| Doorbell Card | `custom:doorbell-card` |
| Doorbell Mini Card | `custom:doorbell-mini-card` |

### Visual editor

Edit a dashboard, click **Add card** and search for **Doorbell Card** or **Doorbell Mini Card**. The first doorbell is preselected; pick another device in the list if you have several (cameras without a doorbell are listed after the doorbells), set an optional title, the parts to display, the camera view and the quick messages. The entities found on the device are used unless you pick others under **Entities**. The preview updates live, and options left at their default are kept out of the generated YAML.

### Minimal

```yaml
type: custom:doorbell-card
```

```yaml
type: custom:doorbell-mini-card
```

### Full options

```yaml
type: custom:doorbell-card
device: Front door
title: Front door
image: auto
color: auto
show_title: true
show_subtitle: true
show_camera: true
show_last: true
show_actions: true
show_details: true
show_history: true
confirm_open: true
camera_view: snapshot
refresh_interval: 10
ring_duration: 30
history_hours: 24
history_count: 5
collapsed:
  - details
lock: lock.front_door
tts_entity: media_player.hallway_speaker
tts_engine: tts.piper
messages:
  - We'll be right there
  - Please leave the parcel at the door
language: en
```

```yaml
type: custom:doorbell-mini-card
device: Gate
show_camera: true
show_actions: true
confirm_open: true
zoom: true
```

A camera of no device, or a doorbell made of entities of several devices:

```yaml
type: custom:doorbell-card
camera: camera.yard
doorbell: binary_sensor.yard_button
motion: binary_sensor.yard_motion
lock: switch.gate_relay
```

### Options reference

| Option | Card | Default | Description |
|---|---|---|---|
| `device` | both | First doorbell | Device to display: its name (as shown in Home Assistant) or its device id (set by the visual editor) |
| `title` | both | Device name | Card title |
| `show_title` | both | `true` | Show the title in the header (e.g. `false` under a section heading of your own) |
| `show_subtitle` | full | `true` | Show the brand and model under the title |
| `image` | both | `auto` | Picture: `auto` (drawn doorbell, animated), `none`, or the URL of your own picture (e.g. `/local/my-doorbell.png`) |
| `color` | both | `auto` | Color of the drawn doorbell: `auto` (white for Nest and UniFi Protect, stainless steel for DoorBird, dark otherwise), `dark`, `white` or `steel` |
| `show_camera` | both | `true` | Camera preview (full card) |
| `show_last` | full | `true` | Last visitor: time, day, how long ago and snapshot |
| `show_actions` | both | `true` | Open, Message and Mute buttons (the mini card shows Open and Mute) |
| `show_details` | full | `true` | Rings today, last motion, lock and battery |
| `show_history` | full | `true` | Ring history |
| `confirm_open` | both | `true` | Ask before opening the door; `false` opens at once |
| `camera_view` | full | `snapshot` | `snapshot` (refreshed every `refresh_interval` seconds) or `live` (the camera's stream, when Home Assistant's camera player is loaded; falls back to the snapshot) |
| `refresh_interval` | both | `10` | Seconds between two snapshots of the preview (`0`: only when Home Assistant gives a new picture). Nothing is loaded while the card is hidden, and the live stream stops |
| `ring_duration` | both | `30` | Seconds a ring is shown as **Ringing** after a doorbell `event`, or after a doorbell `binary_sensor` turned on (and while it stays on); also used for motion and person events |
| `history_hours` | full | `24` | Period of the ring history, in hours |
| `history_count` | full | `5` | Rings listed in the history |
| `collapsed` | full | `[details]` | Sections folded by default, among `details` and `history` (`[]` to unfold everything) |
| `zoom` | mini | `true` | Detail button at the top right of the mini card: it shows the full card's content (with the same options) and switches back to the compact view; a click outside the card also brings the compact view back. `false` removes the button |
| `messages` | both | — | Quick messages of the **Message** button. Without a list, the options of the doorbell's message `select` (UniFi Protect) are offered |
| `tts_entity` | both | — | Speaker (`media_player`) that speaks the quick messages |
| `tts_engine` | both | First `tts` entity | Text-to-speech engine used with `tts_entity` |
| `language` | both | Auto | Force language: `fr`, `en`, `de`, `es`, `sr`, `sr-Latn`, `it`, `nl`, `pt`, `pl`, `ro`, `da`, `sv`, `bg`, `ru`, `uk`, `hu`, `sk`, `cs`, `sl`, `lv` or `el` (auto-detects from HA settings) |

### Entities

Every entity is found on the device; these options replace what was found, or complete it (in the visual editor, under **Entities**):

| Option | Domains | Found from |
|---|---|---|
| `camera` | `camera` | The device's camera (its main stream before a "clear" or snapshot one) |
| `doorbell` | `event`, `binary_sensor` | An event of device class `doorbell`, else an event or binary sensor named ding, doorbell, visitor, ring, chime, press… |
| `motion` | `event`, `binary_sensor` | Named motion, else device class `motion` (person, vehicle or package detections that carry this device class are left out) |
| `person` | `event`, `binary_sensor` | Named person, people, human, face or occupancy (Frigate) |
| `lock` | `lock`, `button`, `switch`, `script`, `input_button` | The device's lock, else a button or switch named open, unlock, relay, gate, strike, door, buzzer (never a configuration or diagnostic entity, such as a restart button) |
| `mute` | `switch`, `input_boolean` | Named mute, do not disturb, silent, chime, button sound, ringtone. A switch named after the sound (chime, button sound) is on while the doorbell rings aloud: **Mute** turns it off. `mute_inverted: true / false` overrides this |
| `snapshot` | `image` | The device's image (last event snapshot) |
| `battery` | `sensor` | Device class `battery` |
| `message_entity` | `select`, `text` | Named message, LCD or doorbell text; UniFi Protect's doorbell `text` (any message) and its doorbell text `select` (the console's messages) |

## Screenshots

### Animations

The drawn doorbell animates with what the doorbell is doing, and settles back to a still picture once it is idle. Each state plays its own animation, and every one of them honours `prefers-reduced-motion`.

When a visitor rings, the doorbell vibrates, its button ring glows and sound waves leave both sides; the camera frame glows and a banner says someone is at the door, and the ring joins the history at once:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/ringing.gif" alt="ringing animation" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/ringing-dark.gif" alt="ringing animation dark" width="400"> |

On motion, radar arcs sweep above the lens and the infrared LEDs blink (here a DoorBird motion event):

| Dark | Light |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/motion.gif" alt="motion animation" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/motion-light.gif" alt="motion animation light" width="400"> |

When a person is detected, a frame closes in on the lens (here a UniFi Protect doorbell, drawn white):

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/person.gif" alt="person animation" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/person-dark.gif" alt="person animation dark" width="400"> |

The mini card rings too:

| Dark | Light |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/mini-ringing.gif" alt="mini card ringing animation" width="380"> | <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/mini-ringing-light.gif" alt="mini card ringing animation light" width="380"> |

### Doorbell Card

A Reolink doorbell with a door lock of another device and a speaker for the quick messages, idle:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/card.png" alt="doorbell card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/card-dark.png" alt="doorbell card dark" width="400"> |

A DoorBird intercom (stainless steel) whose relay opens the gate:

| Dark | Light |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/card-gate.png" alt="gate intercom card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/card-gate-light.png" alt="gate intercom card light" width="400"> |

A Ring battery doorbell with the details unfolded (`collapsed: []`): rings today, last motion, battery, and the snapshot of the last visitor:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/card-porch.png" alt="ring doorbell card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/card-porch-dark.png" alt="ring doorbell card dark" width="400"> |

A UniFi Protect doorbell, whose quick messages go to its LCD screen:

| Dark | Light |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/card-entrance.png" alt="unifi protect doorbell card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/card-entrance-light.png" alt="unifi protect doorbell card light" width="400"> |

### Popups

**Open** asks first, at the top of the card; **Message** lists the quick messages:

| Confirmation (light) | Confirmation (dark) |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/card-open.png" alt="open confirmation" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/card-open-dark.png" alt="open confirmation dark" width="400"> |

| Quick messages (dark) | Quick messages (light) |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/card-messages.png" alt="quick messages" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/card-messages-light.png" alt="quick messages light" width="400"> |

### Doorbell Mini Card

State, last visitor and the Open and Mute buttons; the detail button (top right) shows the full card:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/mini-card.png" alt="mini card" width="380"> | <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/mini-card-dark.png" alt="mini card dark" width="380"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/mini-card-gate-light.png" alt="mini card gate light" width="380"> | <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/mini-card-gate.png" alt="mini card gate" width="380"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/mini-card-zoom.png" alt="mini card zoomed in" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/mini-card-zoom-dark.png" alt="mini card zoomed in dark" width="400"> |

### Narrow cards

The full card at 6 columns of a phone's Sections view (the buttons keep their icons, the snapshot gives way, the status chip keeps its dot) and the mini card at 6 columns:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/card-narrow.png" alt="narrow card" width="240"> | <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/card-narrow-dark.png" alt="narrow card dark" width="240"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/mini-card-narrow.png" alt="narrow mini card" width="180"> | <img src="https://raw.githubusercontent.com/juju35/ha-doorbell-card/main/screenshots/mini-card-narrow-dark.png" alt="narrow mini card dark" width="180"> |

## How it works

### Discovery

The cards read the entity and device registries Home Assistant gives every dashboard (no extra request): the entities of each device are sorted into roles (camera, doorbell, motion, person, opener, mute, snapshot, battery, message) from their domain, their device class and their translation key or entity id (without the device's name, so that a device called "Front door" does not make every entity a door opener). Entity options replace a role or add one, so a lock, a gate relay or a speaker of another device works the same way.

### Ringing

A doorbell `event` entity's state is the time of its last event: the card shows **Ringing** for `ring_duration` seconds after it (30 by default). Only rings count: an entity with the standard `ring` event type counts that one only, and button events count their presses, not the releases that follow (Matter, HomeKit). A doorbell `binary_sensor` rings while it is on, and for `ring_duration` seconds after the card saw it turn on (Reolink's visitor sensor stays on a few seconds only). A timestamp that comes back after the entity was unavailable is not a new ring. Motion and person sensors work the same way.

### Ring history and snapshots

The history comes from the recorder (`history/history_during_period` over `history_hours`, read again every 10 minutes): each ring of an event entity, each time a binary sensor turned on. Rings that arrive while the card is shown are added at once, and the card takes a snapshot of the camera for each of them: it is shown as the last visitor's picture and next to the ring in the history while the page stays open. Without one, the last visitor shows the integration's snapshot `image` (Ring, Frigate…) when there is one.

### Actions

- **Open**: after the confirmation (unless `confirm_open: false`), a lock is opened when it supports it (`lock.open`: latch / door strike, as Nuki), unlocked otherwise (`lock.unlock`: the door then stays unlocked until it is locked again); a button (DoorBird relay) is pressed; a switch or a script is turned on. A lock that asks for a code opens its own dialog, where the code is typed. The button pulses for a few seconds while the request is on its way
- **Message**: one of the options of the doorbell's message select is selected (`select.select_option`); any other text goes to the doorbell's `text` entity (`text.set_value`, UniFi Protect: it stays on the screen until another message replaces it), else is spoken with `tts.speak` on `tts_entity`
- **Mute**: turns the mute switch on, or the chime / button sound switch off

## Development

```bash
npm install
npm run build        # bundles src/strings.js + src/doorbell-card.js into dist/doorbell-card.js, translations split into dist/doorbell-card.i18n.<lang>.js
npm run check        # builds and checks the card (run in CI)
npm test             # unit tests (no browser)
npm run screenshots  # renders the cards (and one GIF per animated state, needs ffmpeg) with mock data into screenshots/
```

`dist/` is not committed: `npm run build` creates it locally, CI builds it on every push, and the release workflow attaches the built files to the release, which is where the Marketplace installs them from. The **Screenshots** workflow renders the captures on every pull request that changes the card and commits them to the pull request's branch.

### Releasing

1. Bump `version` in `package.json`
2. Add a `## <version>` section at the top of [CHANGELOG.md](https://github.com/juju35/ha-doorbell-card/blob/main/CHANGELOG.md)
3. Push to `main`: the **Release** workflow builds the card, creates the tag and the GitHub release with the changelog section as notes, and attaches `doorbell-card.js` and its translation files

## Translations

The cards auto-detect the language from your Home Assistant settings. Currently supported:

| Language | Code |
|---|---|
| English | `en` |
| Français | `fr` |
| Deutsch | `de` |
| Español | `es` |
| Српски | `sr` |
| Srpski (latinica) | `sr-Latn` |
| Italiano | `it` |
| Nederlands | `nl` |
| Português (European; also used for `pt-BR`) | `pt` |
| Polski | `pl` |
| Română | `ro` |
| Dansk | `da` |
| Svenska | `sv` |
| Български | `bg` |
| Русский | `ru` |
| Українська | `uk` |
| Magyar | `hu` |
| Slovenčina | `sk` |
| Čeština | `cs` |
| Slovenščina | `sl` |
| Latviešu | `lv` |
| Ελληνικά | `el` |

Contributions for additional languages are welcome!

## Credits

Ring, Reolink, UniFi Protect, Google Nest, Tapo, DoorBird, Aqara, Frigate and the other names are trademarks of their respective owners. The doorbell pictures are drawn by the card and do not represent a particular product. This project is not affiliated with any of these brands.

## License

[MIT](https://github.com/juju35/ha-doorbell-card/blob/main/LICENSE)

## Support

If you find this project useful, you can support its development:

<a href="https://buymeacoffee.com/julienstep9"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" height="50"></a>
