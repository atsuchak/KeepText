import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import { encryptField, decryptField } from "./noteEncryption.ts";

test("encrypted notes round trip and reject tampering", () => {
  process.env.NOTE_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  const original = "A private note: ✨";
  const encrypted = encryptField(original);

  assert.notEqual(encrypted, original);
  assert.equal(decryptField(encrypted), original);
  assert.throws(() => decryptField(`v1:${randomBytes(40).toString("base64")}`));
});
