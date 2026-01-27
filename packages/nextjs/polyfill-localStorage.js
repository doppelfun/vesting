// Polyfill localStorage for SSR/static export (RainbowKit needs it)
if (typeof globalThis.localStorage === "undefined") {
  const s = {};
  globalThis.localStorage = {
    getItem: (k) => s[k] ?? null,
    setItem: (k, v) => { s[k] = String(v); },
    removeItem: (k) => { delete s[k]; },
    clear: () => { for (const k in s) delete s[k]; },
    get length() { return Object.keys(s).length; },
    key: (i) => Object.keys(s)[i] ?? null,
  };
}
