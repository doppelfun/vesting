export async function register() {
  // Polyfill localStorage for SSR/static export (RainbowKit needs it)
  if (typeof globalThis.localStorage === "undefined") {
    const storage: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        Object.keys(storage).forEach(k => delete storage[k]);
      },
      get length() {
        return Object.keys(storage).length;
      },
      key: (i: number) => Object.keys(storage)[i] ?? null,
    };
  }
}
