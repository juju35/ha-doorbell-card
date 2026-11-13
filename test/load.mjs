// Evaluates the card source (src/strings.js then src/doorbell-card.js, as scripts/build.mjs bundles them) in a
// sandbox with minimal DOM stand-ins and returns the names the tests need. No dependency, no browser.
import { readFileSync } from "node:fs";
import vm from "node:vm";

const read = (f) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const source = `${read("strings.js")}\n${read("doorbell-card.js")}`;

// Shadow root stand-in: keeps the HTML it is given and the listeners it gets.
const fakeRoot = () => ({
  innerHTML: "",
  listeners: {},
  addEventListener(type, fn) {
    this.listeners[type] = fn;
  },
  querySelector() {
    return null;
  },
  querySelectorAll() {
    return [];
  },
});

// Plain element stand-in (ha-form of the editors).
const fakeNode = (tag) => ({
  tagName: String(tag).toUpperCase(),
  listeners: {},
  addEventListener(type, fn) {
    this.listeners[type] = fn;
  },
});

export const load = ({ now } = {}) => {
  // A frozen clock (the mock data's NOW) when given; timers never keep the test process alive.
  const RealDate = Date;
  const FakeDate = now
    ? class extends RealDate {
        constructor(...a) {
          super(...(a.length ? a : [now]));
        }
        static now() {
          return now;
        }
      }
    : RealDate;
  const registry = new Map();
  class HTMLElement {
    attachShadow() {
      this.shadowRoot = fakeRoot();
      return this.shadowRoot;
    }
    dispatchEvent(ev) {
      (this.events ||= []).push(ev);
    }
    appendChild(child) {
      (this.children ||= []).push(child);
    }
    toggleAttribute(name, on) {
      (this.attrs ||= {})[name] = !!on;
    }
  }
  class CustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  }
  const sandbox = {
    HTMLElement,
    CustomEvent,
    Intl,
    Date: FakeDate,
    console: { info() {}, warn() {} },
    customElements: { get: (t) => registry.get(t), define: (t, c) => registry.set(t, c) },
    document: {
      createElement: (t) => (registry.has(t) ? new (registry.get(t))() : fakeNode(t)),
      addEventListener() {},
      removeEventListener() {},
    },
    setTimeout: (fn, ms) => {
      const id = setTimeout(fn, ms);
      id.unref?.();
      return id;
    },
    clearTimeout,
    setInterval: () => 0,
    clearInterval() {},
    addEventListener() {},
    removeEventListener() {},
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  return vm.runInContext(
    `${source}
    ({ STRINGS, LANGUAGES, resolve, findDevice, listDevices, ringsFromHistory, lang, intlLocale, ago, dayLabel, pictureUri, doorbellSvg, esc, freshUrl,
       DoorbellCard: customElements.get("doorbell-card"), DoorbellMiniCard: customElements.get("doorbell-mini-card"),
       DoorbellCardEditor: customElements.get("doorbell-card-editor"), DoorbellMiniCardEditor: customElements.get("doorbell-mini-card-editor"), window })`,
    sandbox,
  );
};
