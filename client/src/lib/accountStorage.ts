/**
 * Browser-local, persistent, account-free draft store. Deliberately does not
 * migrate prior account-scoped session drafts or send information to a server.
 * Clearing site data or private browsing can delete saved answers.
 */
const prefix = "ltc-public:v1:";
export function setStorageAccount(_id: number | null) { /* account-free public portal */ }
export const accountStorage = {
  getItem(key: string) {
    try { return typeof window === "undefined" ? null : window.localStorage.getItem(prefix + key); }
    catch { return null; }
  },
  setItem(key: string, value: string) {
    try { if (typeof window !== "undefined") window.localStorage.setItem(prefix + key, value); }
    catch { /* browser privacy mode/quota may disable persistence */ }
  },
  removeItem(key: string) {
    try { if (typeof window !== "undefined") window.localStorage.removeItem(prefix + key); }
    catch {}
  },
};
export function clearAccountDrafts(_id?: number | null) {
  try {
    if (typeof window === "undefined") return;
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith(prefix)) window.localStorage.removeItem(key);
    }
  } catch {}
}
