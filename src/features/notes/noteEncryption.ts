import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function encryptionKey() {
  const key = Buffer.from(process.env.NOTE_ENCRYPTION_KEY || "", "base64");
  if (key.length !== 32) throw new Error("NOTE_ENCRYPTION_KEY must be a 32-byte base64 value");
  return key;
}

export function encryptField(text: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return `v1:${Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64")}`;
}

export function decryptField(value: string) {
  if (!value.startsWith("v1:")) throw new Error("Unsupported encrypted field");
  const bytes = Buffer.from(value.slice(3), "base64");
  if (bytes.length < 28) throw new Error("Invalid encrypted field");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8");
}
