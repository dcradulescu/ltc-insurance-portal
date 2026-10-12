import { accountStorage } from "./accountStorage";

/**
 * A random, non-identifying reference for matching the visitor's Strategy,
 * PDF and its emailed Visiting Angels support copy. No lookup database.
 */
const key = "ltc_support_reference";
const valid = /^LTC-[A-F0-9]{12}$/;
export function getOrCreateLtcSupportReference(): string {
  const prior = accountStorage.getItem(key);
  if (prior && valid.test(prior)) return prior;
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const ref = "LTC-" + Array.from(bytes, b=>b.toString(16).padStart(2,"0")).join("").toUpperCase();
  accountStorage.setItem(key, ref);
  return ref;
}
