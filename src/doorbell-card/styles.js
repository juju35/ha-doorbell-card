// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

export const BASE_STYLE = `
  :host { --db-accent: #ef6c00; --db-ok: var(--success-color, #43a047); --db-warn: var(--warning-color, #ffa600);
          --db-crit: var(--error-color, #db4437); --db-idle: var(--secondary-text-color, #9e9e9e); --db-active: var(--info-color, #039be5);
          /* Text in a state or accent color is mixed with the text color, so that it reads at 4.5:1 at least. */
          --db-accent-text: color-mix(in srgb, var(--db-accent) 55%, var(--primary-text-color));
          --db-glass: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
          --db-glass-hover: color-mix(in srgb, var(--primary-text-color) 11%, transparent);
          --db-line: var(--divider-color, rgba(127,127,127,.25)); }
  /* The card follows the width it is given (Sections view columns, mini card): container queries below. */
  ha-card { overflow: hidden; container: db-card / inline-size; }
  /* A size container has no width of its own content: this empty grid gives the card a natural width without a
     minimum, so that it still shrinks to its track in a grid or a flex row. */
  :host { display: block; min-width: 0; --db-natural-width: 400px; }
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, var(--db-natural-width)); height: 0; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .muted { color: var(--secondary-text-color); }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible, button:focus-visible { outline: 2px solid var(--primary-color, var(--db-accent)); outline-offset: 2px; }
  .ok { --c: var(--db-ok); } .warn { --c: var(--db-warn); } .crit { --c: var(--db-crit); } .idle { --c: var(--db-idle); }
  .active { --c: var(--db-active); } .ringing { --c: var(--db-accent); }
  /* Texts in a state color are mixed with the text color: tinted, and readable at 4.5:1 in both themes. */
  .ok, .warn, .crit, .idle, .active, .ringing { --ink: color-mix(in srgb, var(--c) 45%, var(--primary-text-color, #212121)); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c, var(--db-ok)); flex: none; display: inline-block; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; white-space: nowrap;
          background: color-mix(in srgb, var(--c, var(--db-ok)) 15%, transparent); color: color-mix(in srgb, var(--c, var(--db-ok)) 55%, var(--primary-text-color));
          flex: 0 1 auto; min-width: 0; max-width: 51%; overflow: hidden; box-sizing: border-box; }
  .chip-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  /* Header: the 40 px icon, then the title line (name, status chip, detail button) above the subtitle, so that the
     chip always sits on the line of the title. */
  .header { position: relative; display: flex; align-items: flex-start; gap: 10px; padding: 12px 12px 0; }
  .type-icon { position: relative; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex: none;
               --db-tint: var(--c, var(--db-accent)); background: color-mix(in srgb, var(--db-tint) 16%, transparent); transition: background-color .3s ease; }
  .type-icon .icon { width: 24px; height: 24px; fill: color-mix(in srgb, var(--db-tint) 70%, var(--primary-text-color)); transition: fill .3s ease; }
  .titles { flex: 1 1 0; min-width: 5ch; container: db-titles / inline-size; display: flex; flex-direction: column; justify-content: center; min-height: 40px; }
  .title-row { display: flex; align-items: center; gap: 8px; min-width: 0; min-height: 20px; }
  .name { flex: 0 1 auto; min-width: 0; font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  :host([hide-title]) .name { visibility: hidden; }
  :host([hide-subtitle]) .sub { display: none; }
  .sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .warning { padding: 16px; color: color-mix(in srgb, var(--db-warn) 55%, var(--primary-text-color)); }
  /* Buttons: never filled. Smoked glass with a thin outline; the icon takes the accent color when the action is on. */
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; font: inherit; font-size: 13px; font-weight: 500;
         padding: 6px 12px; border-radius: 18px; border: 1px solid var(--db-line); background: var(--db-glass); color: var(--primary-text-color);
         min-width: 0; box-sizing: border-box; -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }
  .btn span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .btn .icon { color: var(--secondary-text-color); }
  .btn:not(.disabled):hover { background: var(--db-glass-hover); }
  .btn.accent { border-color: color-mix(in srgb, var(--db-accent) 55%, transparent); color: var(--db-accent-text); }
  .btn.accent .icon, .btn.on .icon { color: var(--db-accent); }
  .btn.on { border-color: color-mix(in srgb, var(--db-accent) 40%, var(--db-line)); }
  .btn.round { width: 36px; height: 36px; padding: 0; border-radius: 50%; flex: none; }
  .btn.disabled { opacity: .45; cursor: default; }
  .btn.busy { cursor: progress; }
  .btn.busy .icon { animation: db-glow 1s ease-in-out infinite; }
  /* The detail button of the mini card: a 24 px round button in the top right corner. */
  .zoom { all: unset; position: absolute; z-index: 2; top: 5px; right: 5px; cursor: pointer; width: 24px; height: 24px; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); box-shadow: inset 0 0 0 1px var(--divider-color, rgba(127,127,127,.3)); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: var(--db-glass-hover); color: var(--primary-text-color); }
  .header:has(.zoom) { padding-right: 34px; }
  /* The status pill sits on the title line, right after the title, when the whole title and its whole label fit
     there; otherwise it goes on its own line under the subtitle (kept to one line), and when even that is too tight
     only its dot is left (its text stays in its title and aria-label). Decided by measure (see _fitPill). */
  .title-row .chip { flex: none; max-width: none; }
  .titles.pill-below .title-row { display: contents; }
  .titles.pill-below .name { max-width: 100%; }
  .titles.pill-below .title-row .chip { order: 3; align-self: flex-start; margin-top: 3px; max-width: 100%; }
  .titles.pill-dot .chip { padding: 4px; } .titles.pill-dot .chip-text { display: none; }
  .thumb { flex: none; border-radius: 8px; overflow: hidden; background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
           display: flex; align-items: center; justify-content: center; color: var(--secondary-text-color); }
  .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .thumb .icon { width: 20px; height: 20px; opacity: .6; }
  .line { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--secondary-text-color); min-width: 0; }
  .line span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .line .icon { width: 14px; height: 14px; }
  .picture { flex: none; display: flex; align-items: center; justify-content: center; }
  .picture img { max-width: 100%; max-height: 100%; object-fit: contain; }
  @keyframes db-shake { 0%, 50%, 100% { transform: rotate(0deg); } 10% { transform: rotate(16deg); } 20% { transform: rotate(-14deg); }
                        30% { transform: rotate(10deg); } 40% { transform: rotate(-6deg); } }
  @keyframes db-glow { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; } }
  /* Very narrow card: only the pill's colored dot stays (its text stays in its title and aria-label). */
  @container db-card (max-width: 200px) {
    .title-row .chip { padding: 4px; flex: none; }
    .chip-text { display: none; }
  }
`;

// In-card popup (confirmation, quick messages), at the top of the card so that it stays in view on a long card.
export const DIALOG_STYLE = `
  ha-card.dialog-open { position: relative; min-height: 180px; }
  .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: flex-start; justify-content: center;
              padding-top: 12px; box-sizing: border-box; z-index: 9; border-radius: inherit; }
  .modal { background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color); width: min(92%, 340px); max-height: calc(100% - 24px); overflow: auto;
           box-sizing: border-box; border-radius: 14px; padding: 16px; box-shadow: 0 8px 30px rgba(0,0,0,.4); display: flex; flex-direction: column; gap: 12px; }
  .modal:focus { outline: none; }
  .modal .msg { font-size: 14px; line-height: 1.4; }
  .modal-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; }
  .modal-title .icon { color: var(--db-accent); }
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
  .msg-list { display: flex; flex-direction: column; gap: 6px; }
  .msg-list .btn { justify-content: flex-start; font-weight: 400; text-align: left; border-radius: 12px; padding: 8px 12px; }
  .msg-list .btn .icon { color: var(--db-accent); }
`;

export const FULL_STYLE = `
  .content { padding: 10px 12px 12px; display: flex; flex-direction: column; gap: 12px; }
  .cam { position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 16 / 9; cursor: pointer;
         background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); }
  .cam img, .cam .stream > * { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
  .cam .stream { position: absolute; inset: 0; }
  .cam .none { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
               font-size: 12px; color: var(--secondary-text-color); }
  .cam .none .icon { width: 28px; height: 28px; opacity: .6; }
  .cam::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; box-shadow: inset 0 0 0 1px rgba(255,255,255,.06); }
  .cam.ringing::after { box-shadow: inset 0 0 0 3px var(--db-accent); animation: db-glow 1.5s ease-in-out infinite; }
  /* Overlays on the picture: smoked glass, white text. */
  .glass { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 12px; font-size: 11px; font-weight: 500; color: #fff;
           background: rgba(0,0,0,.38); border: 1px solid rgba(255,255,255,.18); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }
  .glass .icon { width: 14px; height: 14px; }
  .cam .badge { position: absolute; right: 8px; bottom: 8px; }
  .cam .badge .dot { background: #ff5252; }
  .cam .live .dot { animation: db-blink 1.5s step-end infinite; }
  @keyframes db-blink { 50% { opacity: .2; } }
  .cam .det { position: absolute; top: 8px; left: 8px; }
  .cam .det .icon { color: var(--c); }
  .cam .banner { position: absolute; left: 50%; bottom: 10px; transform: translateX(-50%); font-size: 13px; padding: 5px 12px; max-width: calc(100% - 24px); box-sizing: border-box; }
  .cam .banner span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cam .banner .icon { color: #ffb74d; animation: db-shake 1s ease-in-out infinite; transform-origin: 50% 12%; }
  .hero { display: flex; gap: 12px; align-items: center; min-width: 0; }
  .hero .picture { width: 72px; height: 112px; }
  .hero .picture img { filter: drop-shadow(0 4px 8px rgba(0,0,0,.18)); }
  .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .state { font-size: 22px; font-weight: 400; line-height: 1.1; color: var(--ink); overflow-wrap: anywhere; }
  .visit { font-size: 13px; color: var(--primary-text-color); }
  .visit-time { color: var(--primary-text-color); font-variant-numeric: tabular-nums; }
  .visit .icon { color: var(--c, var(--secondary-text-color)); width: 16px; height: 16px; }
  .visit b { font-weight: 500; }
  .snap { width: 104px; height: 70px; border-radius: 10px; }
  .actions { display: flex; flex-wrap: wrap; gap: 6px; }
  .actions .btn { flex: 1 1 auto; }
  .section-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: .04em;
                   color: var(--secondary-text-color); margin-bottom: 6px; cursor: pointer; user-select: none; }
  .section-title .icon { width: 16px; height: 16px; }
  .section-title span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .section-title .count { margin-left: 4px; }
  .section-title[aria-expanded="false"] { margin-bottom: 0; }
  /* Folded: chevron to the right; unfolded: chevron down. */
  .section-title .chevron { margin-left: auto; transition: transform .2s ease; }
  .section-title[aria-expanded="false"] .chevron { transform: rotate(-90deg); }
  .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 6px; }
  .tile { display: flex; flex-direction: column; gap: 2px; padding: 6px 10px; border-radius: 10px; min-width: 0;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .tile .k { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; }
  .tile .k span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .tile .k .icon { width: 14px; height: 14px; color: var(--c, var(--secondary-text-color)); }
  .tile .v { font-size: 14px; font-weight: 500; line-height: 1.3; overflow-wrap: anywhere; }
  .tile:is(.warn, .crit) .v { color: var(--ink); }
  .hist { display: flex; flex-direction: column; gap: 4px; }
  .hist-row { display: flex; align-items: center; gap: 10px; padding: 4px 6px; border-radius: 10px; min-width: 0; }
  .hist-row:hover { background: var(--db-glass); }
  .hist-row .thumb { width: 44px; height: 28px; border-radius: 6px; }
  .hist-row .thumb .icon { width: 16px; height: 16px; color: var(--db-accent); opacity: 1; }
  .hist-row .day { flex: 1; min-width: 0; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hist-row .time { font-size: 13px; font-weight: 500; white-space: nowrap; }
  .hist-row .rel { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; min-width: 0; overflow: hidden; text-overflow: ellipsis; max-width: 40%; }
  .empty { font-size: 13px; color: var(--secondary-text-color); padding: 2px 6px; }
  /* Narrow cards: the snapshot gives way first, then the picture shrinks; the action buttons keep their icons only. */
  @container (max-width: 360px) {
    .snap { display: none; }
  }
  @container (max-width: 300px) {
    .hero .picture { width: 52px; height: 82px; }
    .state { font-size: 18px; }
    .actions .btn span { display: none; }
    .actions .btn { padding: 6px; }
    .hist-row .rel { display: none; }
  }
`;

export const MINI_STYLE = `
  :host { --db-natural-width: 300px; }
  .content { padding: 10px 12px 12px; display: flex; align-items: center; gap: 10px; }
  .picture { width: 46px; height: 72px; }
  .picture img { filter: drop-shadow(0 2px 4px rgba(0,0,0,.18)); }
  .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
  .info .main { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .controls { display: flex; gap: 6px; flex: none; }
  @container (max-width: 280px) {
    .content { flex-wrap: wrap; row-gap: 8px; }
    .controls { flex-basis: 100%; justify-content: flex-end; }
  }
  @container (max-width: 200px) {
    .picture { display: none; }
  }
`;

// ---------------------------------------------------------------------------
// Illustrated header: the front of the house (siding wall, roof edge, porch lantern, front door cropped at the top,
// house number, potted plant) with the card's own doorbell drawn big beside the door, on a 10 px concrete strip
// edge to edge. The wall is the banner's background, so the title and subtitle sit on it at the left; the scene is
// a 214 × 80 picture at the right, posed on the strip. `illustration: false` keeps the classic header.
// ---------------------------------------------------------------------------


// Night picture: forced by illustration_theme, else Home Assistant's dark theme alone (a light theme keeps the day
// picture after sunset).
// The width of an element's whole text in fractional pixels, even while it is cut with an ellipsis (0 when hidden).
export const textWidth = (el) => {
  if (!el?.getClientRects?.().length || typeof document.createRange !== "function") return 0;
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect().width;
};

// Night picture: forced by illustration_theme, else Home Assistant's dark mode alone (a light theme keeps the day
// picture after sunset).
export const isNight = (hass, config) => {
  const theme = config?.illustration_theme;
  if (theme === "night") return true;
  if (theme === "day") return false;
  return !!hass?.themes?.darkMode;
};

// The scene, without the doorbell (an <img> laid over it, see _banner). `uid` keeps each card's ids apart.
export const doorbellScene = (uid, night) => {
  const n = (day, dark) => (night ? dark : day);
  const leaf = (d, fill) => `<path d="${d}" fill="${fill}"/>`;
  return `<svg class="db-scene-svg" viewBox="16 0 214 80" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false">
    <defs><radialGradient id="db-halo-${uid}"><stop offset="0" stop-color="#ffcf6e" stop-opacity=".75"/><stop offset="1" stop-color="#ffcf6e" stop-opacity="0"/></radialGradient></defs>
    <g class="db-lantern">
      ${night ? `<circle class="db-halo" cx="30" cy="24" r="22" fill="url(#db-halo-${uid})"/>` : ""}
      <rect x="28.6" y="5" width="2.8" height="9" fill="#2a3038"/>
      <path d="M23.5 14h13l-2.4 3.4H25.9z" fill="#2a3038"/>
      <rect x="25" y="17" width="10" height="14" rx="1.6" fill="#2a3038"/>
      <rect class="db-lamp" x="26.6" y="18.6" width="6.8" height="10.8" rx="1" fill="${n("#f3e6d3", "#ffcf6e")}"/>
      <path d="M30 18.6v10.8" stroke="#2a3038" stroke-width=".8"/>
      <rect x="26" y="31" width="8" height="2" rx=".6" fill="#2a3038"/>
    </g>
    <rect x="110" y="0" width="70" height="80" fill="${n("#f6f2ea", "#2a2a33")}"/>
    <rect x="116" y="0" width="58" height="80" fill="${n("#2f5f8a", "#1f3a5a")}"/>
    <rect x="123" y="5" width="44" height="22" rx="2" fill="${n("#bfe0f7", "#ffcf6e")}" opacity="${n(1, 0.85)}"/>
    <path d="M145 5v22M123 16h44" stroke="${n("#2f5f8a", "#1f3a5a")}" stroke-width="1.6"/>
    <rect x="123" y="35" width="44" height="17" rx="1.5" fill="none" stroke="#000" stroke-opacity=".2"/>
    <rect x="123" y="56" width="44" height="17" rx="1.5" fill="none" stroke="#000" stroke-opacity=".2"/>
    <rect x="119" y="40" width="3" height="11" rx="1.5" fill="#d4b26a"/><rect x="119" y="42" width="8" height="2.4" rx="1.2" fill="#d4b26a"/>
    <rect x="104" y="76.5" width="82" height="3.5" fill="${n("#b4b2a9", "#4a4a55")}"/>
    <rect x="40" y="10" width="17" height="13" rx="2" fill="${n("#fff", "#55617a")}" stroke="#9aa3ae" stroke-width=".6"/>
    <text x="48.5" y="19.6" text-anchor="middle" font-size="8.5" font-weight="700" font-family="sans-serif" fill="${n("#2f5f8a", "#dfe7f2")}">12</text>
    <g class="db-plant">
      ${leaf("M212 64C204 60 197 52 198 44c7 2 12 10 14 20z", n("#4a9a33", "#33593e"))}
      ${leaf("M212 64c8-4 15-12 14-20-7 2-12 10-14 20z", n("#4a9a33", "#33593e"))}
      ${leaf("M212 64c-5-8-6-20 0-28 6 8 5 20 0 28z", n("#5aa83d", "#3e6a4a"))}
      ${leaf("M212 64c-9-1-16-6-18-12 7-1 14 4 18 12zM212 64c9-1 16-6 18-12-7-1-14 4-18 12z", n("#6cbb4c", "#467653"))}
      <rect x="199" y="62" width="26" height="4" rx="1" fill="#a94f2e"/>
      <path d="M200.5 66h23l-2.4 14h-18.2z" fill="#c0603a"/>
    </g>
  </svg>`;
};

export const BANNER_STYLE = `
  /* The banner: the house's wall (siding, roof edge at the top), the scene at the right, a 10 px concrete strip. */
  .db-banner { --db-sw: min(214px, 44cqw); position: relative; overflow: hidden; height: 90px; color: #2d2620;
               background: repeating-linear-gradient(180deg, transparent 0 7px, #dccab2 7px 8px) 0 4px / 100% 100%, #e9dccb; }
  .db-banner.night { color: #fff; background: repeating-linear-gradient(180deg, transparent 0 7px, #3c3844 7px 8px) 0 4px / 100% 100%, #33303a; }
  .db-banner::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 5px; background: #a0503a; }
  .db-banner.night::before { background: #3a2a2a; }
  .db-banner::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 10px; background: #9aa1a9; box-shadow: inset 0 2px 0 #b5bbc2; }
  .db-banner.night::after { background: #2c323b; box-shadow: inset 0 2px 0 #3a414b; }
  .db-scene { position: absolute; right: 0; bottom: 10px; width: var(--db-sw); aspect-ratio: 214 / 80; }
  .db-scene-svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  /* The doorbell at x 44, y 5, 44 × 70 of the 214 × 80 scene. */
  .db-device { position: absolute; left: 20.56%; top: 6.25%; width: 20.56%; height: 87.5%; display: flex; }
  .db-device img { width: 100%; height: 100%; object-fit: contain; object-position: 50% 100%; filter: drop-shadow(0 2px 3px rgba(0,0,0,.22)); }
  .db-banner.night .db-device img { filter: drop-shadow(0 0 6px rgba(255,207,110,.25)) drop-shadow(0 2px 3px rgba(0,0,0,.4)); }
  /* While it rings, the porch lantern blinks in the accent color. */
  .db-banner.ring .db-lamp { animation: db-lamp 1s ease-in-out infinite; }
  @keyframes db-lamp { 50% { fill: #ffb74d; } }
  .db-text { position: absolute; left: 12px; top: 5px; bottom: 10px; right: calc(var(--db-sw) + 4px); display: flex; align-items: center; gap: 10px; min-width: 0; }
  .db-text .titles { min-height: 0; gap: 2px; }
  .db-text .name { font-weight: 600; }
  .db-text .sub { color: #6b5a48; }
  .db-banner.night .db-text .sub { color: rgba(255,255,255,.78); }
  /* The round icon on the wall: its color is the state's (gray when idle). */
  .db-banner .type-icon { background: rgba(255,255,255,.66); box-shadow: inset 0 0 0 1px rgba(45,38,32,.12); }
  .db-banner .type-icon .icon { fill: color-mix(in srgb, var(--db-tint) 82%, #000); }
  .db-banner.night .type-icon { background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
  .db-banner.night .type-icon .icon { fill: color-mix(in srgb, var(--db-tint) 78%, #fff); }
  .db-banner .chip { background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
  .db-banner.night .chip { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }
  .db-banner .zoom { color: #33506b; background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7);
                     -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }
  .db-banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
  .db-banner .zoom:hover { background: rgba(255,255,255,.75); }
  .db-banner.night .zoom:hover { background: rgba(255,255,255,.22); }
  /* Narrow card: no room for the scene beside the text, the wall alone stays. */
  @container (max-width: 300px) { .db-scene { display: none; } .db-text { right: 36px; } }
  @media (prefers-reduced-motion: reduce) { .db-banner .db-lamp { animation: none; } }
`;

// Element names of Home Assistant dialogs (the more-info opened from the card, among others).
export const DIALOG_TAGS = new Set(["HA-MORE-INFO-DIALOG", "HA-DIALOG", "DIALOG"]);
export const isOutside = (card, ev) => {
  const path = ev.composedPath();
  return !path.includes(card) && !path.some((n) => DIALOG_TAGS.has(n.tagName));
};

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app) a
// tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to the
// page. It counts when the press and the release are both outside the card (a slider dragged out of the card does not
// fold it), and a scroll does not count (the browser cancels the pointer). Keyboard clicks still go through the click
// event. `tap(ev)` (a press and a release at the same spot) is for the tests.
export const watchOutside = (isOut, handler) => {
  let downOutside = false;
  const onDown = (ev) => {
    downOutside = isOut(ev);
  };
  const onUp = (ev) => {
    if (downOutside && isOut(ev)) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0 && isOut(ev)) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
  };
};

export const FOCUS_SELECTOR = "[data-action], [data-entity]";
export const focusKey = (el) => {
  const data = Object.entries({ ...el.dataset });
  return data.length ? `${el.tagName}|${JSON.stringify(data)}` : "";
};
