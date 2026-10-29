"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  userName: string;
  userImage?: string | null;
  notes: { id: string; title: string; pinned: boolean; customTitle: boolean }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => Promise<boolean>;
  onPin: (id: string, pinned: boolean) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onSignOut: () => void;
  onSettings: () => void;
  busy: boolean;
};

export function SignedInSidebar({ open, userName, userImage, notes, selectedId, onSelect, onNew, onRename, onPin, onDelete, onSignOut, onSettings, busy }: Props) {
  const sidebar = useRef<HTMLElement>(null);
  const [search, setSearch] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const visibleNotes = notes.filter((note) => note.title.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.title.localeCompare(b.title));

  useEffect(() => {
    const menus = () => sidebar.current?.querySelectorAll<HTMLDetailsElement>(".sidebar-menu[open]");
    if (!open) menus()?.forEach((menu) => { menu.open = false; });
    function closeOutside(event: PointerEvent) {
      menus()?.forEach((menu) => { if (!menu.contains(event.target as Node)) menu.open = false; });
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") menus()?.forEach((menu) => { menu.open = false; });
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <aside ref={sidebar} className={`sidebar${open ? " is-open" : ""}`} aria-label="Notes sidebar" aria-hidden={!open}>
      <button className="new-note-button" type="button" onClick={onNew} disabled={busy}><span aria-hidden="true">+</span> New Text</button>
      <nav className="note-list" aria-label="Your notes">
        {visibleNotes.map((note) => (
          <div className={`note-row${note.id === selectedId ? " active" : ""}${note.pinned ? " pinned" : ""}`} key={note.id}>
            {renamingId === note.id ? (
              <form className="note-rename" onSubmit={async (event) => {
                event.preventDefault();
                const title = renameValue.trim();
                if (title && await onRename(note.id, title)) setRenamingId(null);
              }} onKeyDown={(event) => { if (event.key === "Escape") setRenamingId(null); }}>
                <input autoFocus aria-label={`Rename ${note.title}`} value={renameValue} onChange={(event) => setRenameValue(event.target.value)} maxLength={120} required />
              </form>
            ) : <button className="note-select" type="button" aria-label={`${note.title}${note.pinned ? " (pinned)" : ""}`} onClick={() => onSelect(note.id)} disabled={busy}><span className="note-label">{note.title}</span></button>}
            <details className="sidebar-menu note-menu">
              <summary aria-label={`Options for ${note.title}`}>⋯</summary>
              <div className="sidebar-menu-items">
                <button type="button" disabled={busy} onClick={(event) => { event.currentTarget.closest("details")!.open = false; void onPin(note.id, !note.pinned); }}>{note.pinned ? "Unpin" : "Pin"}</button>
                <button type="button" disabled={busy} onClick={(event) => { event.currentTarget.closest("details")!.open = false; setRenamingId(note.id); setRenameValue(note.title); }}>Rename</button>
                <button className="menu-danger" type="button" disabled={busy} onClick={(event) => { event.currentTarget.closest("details")!.open = false; if (window.confirm("Delete this text? This cannot be undone.")) void onDelete(note.id); }}>Remove</button>
              </div>
            </details>
          </div>
        ))}
      </nav>
      <label className="sidebar-search">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 4 4" /></svg>
        <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search texts" aria-label="Search texts" />
      </label>
      <div className="sidebar-account">
        <span className="profile-icon" aria-hidden="true">{userImage ? <span className="profile-photo" style={{ backgroundImage: `url(${JSON.stringify(userImage)})` }} /> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="3.5" /><path d="M5.5 19c.5-3.2 2.8-5 6.5-5s6 1.8 6.5 5" /></svg>}</span>
        <span className="profile-name" title={userName}>{userName}</span>
        <details className="sidebar-menu account-menu">
          <summary aria-label="Account options">⋯</summary>
          <div className="sidebar-menu-items">
            <button type="button" onClick={onSettings}>Settings</button>
            <button className="menu-danger" type="button" onClick={onSignOut}>Sign out</button>
          </div>
        </details>
      </div>
    </aside>
  );
}
