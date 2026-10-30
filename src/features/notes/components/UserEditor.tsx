"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { titleFromContent } from "../noteTitle";
import { readCachedNote, writeCachedNote } from "../noteCache";

export type UserEditorHandle = {
  flush: () => Promise<boolean>;
  reset: () => void;
  prepare: () => void;
};

type Note = { id: string; title: string; content: string; revision: string };
type Props = {
  ref: Ref<UserEditorHandle>;
  userId: string;
  noteId: string | null;
  onCreate: (content: string) => Promise<Note>;
  onCreated: (note: Note) => void;
  onCreatingChange: (creating: boolean) => void;
  onTitleChange: (id: string, title: string) => void;
};

export function UserEditor({ ref, userId, noteId, onCreate, onCreated, onCreatingChange, onTitleChange }: Props) {
  const [content, setContent] = useState("");
  const [ready, setReady] = useState(!noteId);
  const [error, setError] = useState("");
  const saved = useRef<{ id: string | null; content: string; revision: string }>({ id: null, content: "", revision: "" });
  const latest = useRef("");
  const currentId = useRef(noteId);
  const createdId = useRef<string | null>(null);
  const creating = useRef<Promise<boolean> | null>(null);
  const saveQueue = useRef(Promise.resolve());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editor = useRef<HTMLTextAreaElement>(null);

  const save = useCallback((id: string, value: string): Promise<boolean> => {
    const task = saveQueue.current.then(async () => {
      const response = await fetch(`/api/notes/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: value, revision: saved.current.revision }),
      });
      if (response.status === 409) throw new Error("conflict");
      if (!response.ok) throw new Error("Save failed");
      const result = await response.json() as { revision: string };
      if (saved.current.id === id) {
        saved.current = { id, content: value, revision: result.revision };
        writeCachedNote(userId, { id, content: latest.current, savedContent: value, revision: result.revision });
      }
    });
    saveQueue.current = task.catch(() => {});
    return task.then(() => {
      setError("");
      return true;
    }).catch((cause) => {
      setError(cause instanceof Error && cause.message === "conflict"
        ? "This text changed on another device. Your unsaved text is still here. Copy it before refreshing."
        : "Could not save this note. Copy your text before leaving.");
      return false;
    });
  }, [userId]);

  function createFromDraft(value: string) {
    if (creating.current || !value.trim()) return;
    onCreatingChange(true);
    creating.current = onCreate(value).then((note) => {
      saved.current = { id: note.id, content: value, revision: note.revision };
      writeCachedNote(userId, { id: note.id, content: latest.current, savedContent: value, revision: note.revision });
      createdId.current = note.id;
      onCreated({ ...note, title: titleFromContent(latest.current) });
      setError("");
      return true;
    }).catch(() => {
      setError("Could not create this note. Your text is still here.");
      return false;
    }).finally(() => {
      creating.current = null;
      onCreatingChange(false);
    });
  }

  useEffect(() => {
    currentId.current = noteId;
    if (!noteId) {
      return;
    }
    if (createdId.current === noteId) {
      createdId.current = null;
      return;
    }
    const controller = new AbortController();
    const cached = readCachedNote(userId, noteId);
    if (cached) {
      saved.current = { id: noteId, content: cached.savedContent, revision: cached.revision };
      latest.current = cached.content;
    } else {
      saved.current = { id: null, content: "", revision: "" };
      latest.current = "";
    }
    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      setContent(cached?.content ?? "");
      setReady(Boolean(cached));
    });
    const startingRevision = saved.current.revision;
    fetch(`/api/notes/${encodeURIComponent(noteId)}`, { signal: controller.signal, cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load this note.");
        return response.json() as Promise<{ content: string; revision: string }>;
      })
      .then((note) => {
        if (controller.signal.aborted || saved.current.revision !== startingRevision) return;
        if (latest.current !== saved.current.content) {
          if (note.revision !== startingRevision) setError("This text changed on another device. Your unsaved text is still here. Copy it before refreshing.");
          return;
        }
        saved.current = { id: noteId, content: note.content, revision: note.revision };
        latest.current = note.content;
        writeCachedNote(userId, { id: noteId, content: note.content, savedContent: note.content, revision: note.revision });
        setContent(note.content);
        setReady(true);
        setError("");
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("Could not load this note. Refresh to try again.");
      });
    return () => controller.abort();
  }, [noteId, userId]);

  useEffect(() => {
    if (!ready || !noteId) return;
    const id = noteId;
    let active = true;
    let checking = false;
    async function sync() {
      if (!active || checking || document.visibilityState !== "visible" || latest.current !== saved.current.content || saved.current.id !== id) return;
      checking = true;
      const revision = saved.current.revision;
      try {
        const response = await fetch(`/api/notes/${encodeURIComponent(id)}`, {
          headers: { "If-None-Match": `"${revision}"` }, cache: "no-store",
        });
        if (response.status === 304 || !response.ok) return;
        const note = await response.json() as { content: string; title: string; revision: string };
        if (!active || saved.current.id !== id || saved.current.revision !== revision || latest.current !== saved.current.content) return;
        saved.current = { id, content: note.content, revision: note.revision };
        latest.current = note.content;
        setContent(note.content);
        onTitleChange(id, note.title);
      } catch { /* Retry on the next check. */ }
      finally { checking = false; }
    }
    const timer = window.setInterval(sync, 750);
    document.addEventListener("visibilitychange", sync);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener("visibilitychange", sync); };
  }, [ready, noteId, onTitleChange]);

  useEffect(() => {
    if (ready) editor.current?.focus();
  }, [ready, noteId]);

  useEffect(() => {
    if (!ready || !noteId || content === saved.current.content) return;
    saveTimer.current = setTimeout(() => { saveTimer.current = null; void save(noteId, content); }, 300);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [ready, noteId, content, save]);

  useImperativeHandle(ref, () => ({
    reset() {
      currentId.current = null;
      createdId.current = null;
      saved.current = { id: null, content: "", revision: "" };
      latest.current = "";
      setContent("");
      setReady(true);
      setError("");
    },
    prepare() {
      saved.current = { id: null, content: "", revision: "" };
      latest.current = "";
      setContent("");
      setReady(false);
      setError("");
    },
    async flush() {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      if (creating.current && !await creating.current) return false;
      const id = currentId.current ?? createdId.current;
      if (!id) return !latest.current.trim();
      if (saved.current.id === id && latest.current === saved.current.content) return true;
      return save(id, latest.current);
    },
  }));

  return (
    <main className="writing-area">
      {error && <p className="save-error" role="alert">{error} <button className="retry-save" type="button" onClick={() => {
        const id = currentId.current ?? createdId.current;
        if (id) void save(id, latest.current);
        else createFromDraft(latest.current);
      }}>Retry</button></p>}
      <textarea
        ref={editor}
        className="writing-input"
        aria-label="Your note"
        placeholder={ready ? "Write your thoughts..." : "Loading your note..."}
        spellCheck
        value={content}
        disabled={!ready}
        onChange={(event) => {
          const value = event.target.value;
          latest.current = value;
          setContent(value);
          const id = noteId ?? createdId.current;
          if (id) {
            writeCachedNote(userId, { id, content: value, savedContent: saved.current.id === id ? saved.current.content : "", revision: saved.current.id === id ? saved.current.revision : "" });
            onTitleChange(id, titleFromContent(value));
          }
          else createFromDraft(value);
        }}
      />
    </main>
  );
}
