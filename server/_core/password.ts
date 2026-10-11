import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const OPTIONS = { N: 131072, r: 8, p: 1, maxmem: 192 * 1024 * 1024 };
function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password, salt, 64, OPTIONS,
    (err, key) => err ? reject(err) : resolve(key)));
}
export async function hashPassword(password: string) {
  if (password.length < 15 || password.length > 128) {
    throw new Error("Password must contain 15–128 characters");
  }
  const salt = randomBytes(16).toString("hex");
  return `scrypt-v1$${salt}$${(await derive(password, salt)).toString("hex")}`;
}
export async function verifyPassword(password: string, encoded: string | undefined) {
  const valid = /^scrypt-v1\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(encoded || "");
  const [, salt, hash] = valid ? encoded!.split("$") : ["", "0".repeat(32), "0".repeat(128)];
  const result = await derive(password, salt);
  return timingSafeEqual(result, Buffer.from(hash, "hex")) && valid;
}
