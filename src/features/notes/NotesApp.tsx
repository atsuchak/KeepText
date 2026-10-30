"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "./components/Brand";
import { GuestEditor } from "./components/GuestEditor";
import { UserEditor, type UserEditorHandle } from "./components/UserEditor";
import { SignedInSidebar } from "./components/SignedInSidebar";
import { authClient } from "@/features/auth/auth-client";
import { SignInForm } from "@/features/auth/SignInForm";
import { consumeNotice, queueNotice, useNotice } from "@/bootstrap/NoticeProvider";
import { clearCachedNote, clearUserCache, readCachedList, writeCachedList, type CachedSidebarNote } from "./noteCache";

type Props = { userId: string | null; isSignedIn: boolean; userName: string; userImage?: string | null; googleEnabled: boolean };
type SidebarNote = CachedSidebarNote;

export function NotesApp({ userId, isSignedIn, userName, userImage, googleEnabled }: Props) {
  const router = useRouter();
  const { confirm, notify } = useNotice();
  const authDialog = useRef<HTMLDialogElement>(null);
  const userEditor = useRef<UserEditorHandle>(null);
  const freshDraft = useRef(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [cacheReady, setCacheReady] = useState(false);
  const [creating, setCreating] = useState(false);
  const [notes, setNotes] = useState<SidebarNote[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listError, setListError] = useState("");

  useEffect(() => {
    const message = consumeNotice(isSignedIn);
    if (message) notify(message);
  }, [isSignedIn, notify]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const cached = readCachedList(userId);
      if (cached) {
        setNotes(cached.notes);
        setSelectedId(cached.selectedId && cached.notes.some((note) => note.id === cached.selectedId) ? cached.selectedId : cached.selectedId === null ? null : cached.notes[0]?.id ?? null);
        freshDraft.current = cached.selectedId === null && cached.notes.length > 0;
        setNotesLoaded(true);
      }
      setCacheReady(true);
    });
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (userId && cacheReady && notesLoaded) writeCachedList(userId, notes, selectedId);
  }, [userId, cacheReady, notesLoaded, notes, selectedId]);

  useEffect(() => {
    if (!isSignedIn) return;
    let active = true;
    let checking = false;
    let loaded = false;
    async function syncList() {
      if (!active || checking || document.visibilityState !== "visible") return;
      checking = true;
      try {
        const response = await fetch("/api/notes", { cache: "no-store" });
        if (!response.ok) throw new Error("Could not load notes");
        const result = await response.json() as { notes: SidebarNote[] };
        if (!active) return;
        setNotes(result.notes);
        if (!freshDraft.current) setSelectedId((current) => current && result.notes.some((note) => note.id === current) ? current : result.notes[0]?.id ?? null);
        if (!loaded) setListError("");
        loaded = true;
        setNotesLoaded(true);
      } catch {
        if (active && !loaded) setListError("Could not load notes. Refresh the page to try again.");
      } finally { checking = false; }
    }
    void syncList();
    const timer = window.setInterval(syncList, 2000);
    document.addEventListener("visibilitychange", syncList);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener("visibilitychange", syncList); };
  }, [isSignedIn]);

  async function createNote(content: string) {
    const response = await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
    if (!response.ok) throw new Error("Could not create a note.");
    return response.json() as Promise<{ id: string; title: string; content: string; revision: string }>;
  }

  function noteCreated(note: { id: string; title: string }) {
    freshDraft.current = false;
    setNotes((current) => [{ ...note, pinned: false, customTitle: false }, ...current]);
    setSelectedId(note.id);
    setListError("");
  }

  async function selectNote(id: string | null) {
    if (creating || await userEditor.current?.flush() === false) return;
    freshDraft.current = id === null;
    if (id === null) userEditor.current?.reset();
    else if (id !== selectedId) userEditor.current?.prepare();
    setSelectedId(id);
    if (window.innerWidth <= 700) setSidebarOpen(false);
  }

  const updateTitle = useCallback((id: string, title: string) => {
    setNotes((current) => current.map((note) => note.id === id && !note.customTitle ? { ...note, title: title || "Untitled" } : note));
  }, []);

  async function renameNote(id: string, title: string) {
    if (id === selectedId && await userEditor.current?.flush() === false) return false;
    try {
      const response = await fetch(`/api/notes/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "rename", title }) });
      if (!response.ok) throw new Error("Rename failed");
      setNotes((current) => current.map((note) => note.id === id ? { ...note, title, customTitle: true } : note));
      setListError("");
      return true;
    } catch { setListError("Could not rename this text."); return false; }
  }

  async function pinNote(id: string, pinned: boolean) {
    try {
      const response = await fetch(`/api/notes/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "pin", pinned }) });
      if (!response.ok) throw new Error("Pin failed");
      setNotes((current) => current.map((note) => note.id === id ? { ...note, pinned } : note));
      setListError("");
      return true;
    } catch { setListError("Could not update this text."); return false; }
  }

  async function deleteNote(id: string) {
    if (id === selectedId && await userEditor.current?.flush() === false) return false;
    try {
      const response = await fetch(`/api/notes/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      if (userId) clearCachedNote(userId, id);
      const remaining = notes.filter((note) => note.id !== id)
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.title.localeCompare(b.title));
      setNotes(remaining);
      if (id === selectedId) {
        const nextId = remaining[0]?.id ?? null;
        if (nextId) userEditor.current?.prepare();
        else userEditor.current?.reset();
        setSelectedId(nextId);
      }
      setListError("");
      return true;
    } catch { setListError("Could not delete this text."); return false; }
  }

  return (
    <div className={`app-shell${sidebarOpen ? " sidebar-open" : ""}`}>
      {isSignedIn && <>
        {sidebarOpen && <button className="sidebar-backdrop" type="button" aria-label="Close notes sidebar" onClick={() => setSidebarOpen(false)} />}
        <SignedInSidebar open={sidebarOpen} userName={userName} userImage={userImage} notes={notes} selectedId={selectedId} onSelect={(id) => void selectNote(id)} onNew={() => void selectNote(null)} onRename={renameNote} onPin={pinNote} onDelete={async (id) => {
          if (!await confirm({ title: "Delete text?", message: "This text will be permanently deleted. This cannot be undone.", confirmLabel: "Delete text", danger: true })) return false;
          return deleteNote(id);
        }} onSettings={async () => { if (await userEditor.current?.flush() === false) return; router.push("/settings"); }} onSignOut={async () => {
          if (await userEditor.current?.flush() === false) return;
          try {
            const { error } = await authClient.signOut();
            if (error) notify(error.message || "Could not sign out.", "error");
            else { if (userId) clearUserCache(userId); queueNotice("Signed out successfully.", false); router.refresh(); }
          } catch { notify("Could not sign out.", "error"); }
        }} busy={creating} />
      </>}

      <div className={`main-panel${isSignedIn ? " signed-in-panel" : ""}`}>
        <header className="site-header">
          <div className={`header-left${isSignedIn ? " signed-in-header" : ""}`}>
            {isSignedIn && (
              <button
                className="sidebar-toggle"
                type="button"
                aria-label={sidebarOpen ? "Close notes sidebar" : "Open notes sidebar"}
                aria-expanded={sidebarOpen}
                disabled={!notesLoaded}
                onClick={() => setSidebarOpen((open) => !open)}
              >
                <span className="toggle-line" aria-hidden="true" />
                <span className="toggle-line" aria-hidden="true" />
              </button>
            )}
            <Brand />
          </div>

          {!isSignedIn && (
            <button className="sign-in-button" type="button" onClick={() => authDialog.current?.showModal()}>Sign in</button>
          )}
        </header>

        {listError && <p className="save-error app-error" role="alert">{listError}</p>}
        {isSignedIn ? notesLoaded
          ? <UserEditor ref={userEditor} userId={userId!} noteId={selectedId} onCreate={createNote} onCreated={noteCreated} onCreatingChange={setCreating} onTitleChange={updateTitle} />
          : <main className="writing-area">{!listError && <p className="loading-notes">Loading your notes...</p>}</main>
          : <GuestEditor />}
      </div>
      {!isSignedIn && (
        <dialog ref={authDialog} className="auth-drawer" aria-labelledby="auth-title" onClick={(event) => { if (event.clientX < event.currentTarget.getBoundingClientRect().left) event.currentTarget.close(); }}>
          <div className="auth-drawer-top">
            <Brand />
            <button className="auth-drawer-close" type="button" aria-label="Close sign in panel" onClick={() => authDialog.current?.close()}>×</button>
          </div>
          <div className="auth-content auth-drawer-content">
            <SignInForm googleEnabled={googleEnabled} inDrawer />
            <p className="auth-drawer-note">Your guest draft stays in this browser.</p>
          </div>
        </dialog>
      )}
    </div>
  );
}
