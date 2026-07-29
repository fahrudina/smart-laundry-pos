// src/integrations/supabase/client.ts reads `localStorage` at module load
// time. Tests run under vitest's 'node' environment (no jsdom - these
// tests only exercise plain logic, not DOM), so this stubs just enough of
// the Storage interface for that import to succeed.
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}
