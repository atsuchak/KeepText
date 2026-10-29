"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { readGuestDraft, subscribeToDraft, writeGuestDraft } from "@/bootstrap/guestDraftStorage";

export function GuestEditor() {
  const storedDraft = useSyncExternalStore(subscribeToDraft, readGuestDraft, () => "");
  const [memoryDraft, setMemoryDraft] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    editorRef.current?.focus();
  }, []);

  function updateDraft(value: string) {
    setMemoryDraft(value);
    try {
      writeGuestDraft(value);
      setMemoryDraft(null);
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }

  return (
    <main className="writing-area">
      <textarea
        ref={editorRef}
        className="writing-input"
        aria-label="Your note"
        placeholder="Write your thoughts..."
        spellCheck
        value={memoryDraft ?? storedDraft}
        onChange={(event) => updateDraft(event.target.value)}
      />
      {saveError && <p className="save-error" role="alert">Could not save this note. Copy your text before leaving.</p>}
    </main>
  );
}
