let accountId: number | null = null;
export function setStorageAccount(id: number | null) { accountId = id; }
const prefix = () => accountId === null ? null : `ltc-account:${accountId}:`;
export const accountStorage = {
  getItem(key: string) { const p = prefix(); return p ? sessionStorage.getItem(p + key) : null; },
  setItem(key: string, value: string) { const p = prefix(); if (p) sessionStorage.setItem(p + key, value); },
  removeItem(key: string) { const p = prefix(); if (p) sessionStorage.removeItem(p + key); },
};
export function clearAccountDrafts(id = accountId) {
  const p = id === null ? null : `ltc-account:${id}:`;
  if (p) for (const key of Object.keys(sessionStorage)) if (key.startsWith(p)) sessionStorage.removeItem(key);
}
