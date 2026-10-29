import type { LegacyNote } from "@/types/note";

const DRAFT_KEY = "keeptext.guestDraft.v1";
const LEGACY_NOTES_KEY = "keeptext.notes.v1";
const CHANGE_EVENT = "keeptext-draft-change";

export function subscribeToDraft(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function readGuestDraft() {
  try {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft !== null) return draft;

    const previous: unknown = JSON.parse(localStorage.getItem(LEGACY_NOTES_KEY) ?? "[]");
    if (!Array.isArray(previous)) return "";

    return previous
      .filter(
        (note): note is LegacyNote =>
          note !== null &&
          typeof note.title === "string" &&
          typeof note.content === "string",
      )
      .map((note) => [note.title.trim(), note.content].filter(Boolean).join("\n\n"))
      .filter(Boolean)
      .join("\n\n\n");
  } catch {
    return "";
  }
}

export function writeGuestDraft(value: string) {
  localStorage.setItem(DRAFT_KEY, value);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
