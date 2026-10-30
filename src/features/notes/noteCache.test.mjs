import assert from "node:assert/strict";
import test from "node:test";
import { clearCachedNote, clearUserCache, readCachedList, readCachedNote, writeCachedList, writeCachedNote } from "./noteCache.ts";

test("cached drafts stay with their account and clear on delete or sign-out", () => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };

  const notes = [{ id: "note-1", title: "Hello", pinned: false, customTitle: false }];
  writeCachedList("alice", notes, "note-1");
  writeCachedNote("alice", { id: "note-1", content: "Hello again", savedContent: "Hello", revision: "rev-1" });

  assert.deepEqual(readCachedList("alice"), { notes, selectedId: "note-1" });
  assert.equal(readCachedNote("alice", "note-1")?.content, "Hello again");
  assert.equal(readCachedList("bob"), null);
  assert.equal(readCachedNote("bob", "note-1"), null);

  clearCachedNote("alice", "note-1");
  assert.equal(readCachedNote("alice", "note-1"), null);
  clearUserCache("alice");
  assert.equal(readCachedList("alice"), null);
});
