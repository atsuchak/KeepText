export type CachedSidebarNote = { id: string; title: string; pinned: boolean; customTitle: boolean };
export type CachedNote = { id: string; content: string; savedContent: string; revision: string };

const key = (userId: string, kind: string) => `keeptext.user.${userId}.${kind}.v1`;

export function readCachedList(userId: string): { notes: CachedSidebarNote[]; selectedId: string | null } | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key(userId, "list")) || "null");
    if (!value || typeof value !== "object" || !("notes" in value) || !("selectedId" in value)) return null;
    const { notes, selectedId } = value;
    if (!Array.isArray(notes) || !(selectedId === null || typeof selectedId === "string") || !notes.every((note) =>
      note && typeof note.id === "string" && typeof note.title === "string" && typeof note.pinned === "boolean" && typeof note.customTitle === "boolean")) return null;
    return { notes, selectedId };
  } catch { return null; }
}

export function writeCachedList(userId: string, notes: CachedSidebarNote[], selectedId: string | null) {
  try { localStorage.setItem(key(userId, "list"), JSON.stringify({ notes, selectedId })); } catch { /* Remote data is still available. */ }
}

export function readCachedNote(userId: string, id: string): CachedNote | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key(userId, "note")) || "null");
    if (!value || typeof value !== "object" || !("id" in value) || value.id !== id || !("content" in value) || typeof value.content !== "string" || !("savedContent" in value) || typeof value.savedContent !== "string" || !("revision" in value) || typeof value.revision !== "string") return null;
    return value as CachedNote;
  } catch { return null; }
}

export function writeCachedNote(userId: string, note: CachedNote) {
  try { localStorage.setItem(key(userId, "note"), JSON.stringify(note)); } catch { /* The server save still runs. */ }
}

export function clearCachedNote(userId: string, id: string) {
  if (readCachedNote(userId, id)) try { localStorage.removeItem(key(userId, "note")); } catch { /* Ignore blocked storage. */ }
}

export function clearUserCache(userId: string) {
  try {
    localStorage.removeItem(key(userId, "list"));
    localStorage.removeItem(key(userId, "note"));
  } catch { /* Ignore blocked storage. */ }
}
