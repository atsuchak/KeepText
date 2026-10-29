import assert from "node:assert/strict";
import test from "node:test";
import { titleFromContent } from "./noteTitle.ts";

test("sidebar title follows the first three words of a note", () => {
  assert.equal(titleFromContent("  First\nsecond   third fourth"), "First second third");
  assert.equal(titleFromContent("   "), "Untitled");
});
