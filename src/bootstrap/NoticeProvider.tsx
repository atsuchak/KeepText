"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type NoticeKind = "success" | "error";
type Confirmation = { title: string; message: string; confirmLabel: string; danger?: boolean };
type NoticeContextValue = {
  notify: (message: string, kind?: NoticeKind) => void;
  confirm: (options: Confirmation) => Promise<boolean>;
};

const NoticeContext = createContext<NoticeContextValue | null>(null);
const flashKey = "keeptext.notice.v1";

export function queueNotice(message: string, signedIn: boolean) {
  sessionStorage.setItem(flashKey, JSON.stringify({ message, signedIn }));
}

export function clearQueuedNotice() {
  sessionStorage.removeItem(flashKey);
}

export function consumeNotice(signedIn: boolean) {
  const saved = sessionStorage.getItem(flashKey);
  clearQueuedNotice();
  if (!saved) return null;
  try {
    const notice = JSON.parse(saved) as { message: string; signedIn: boolean };
    return notice.signedIn === signedIn ? notice.message : null;
  } catch { return null; }
}

export function NoticeProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<{ message: string; kind: NoticeKind; id: number } | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const resolveConfirmation = useRef<((answer: boolean) => void) | null>(null);

  const notify = useCallback((message: string, kind: NoticeKind = "success") => {
    setNotice({ message, kind, id: Date.now() });
  }, []);

  const confirm = useCallback((options: Confirmation) => new Promise<boolean>((resolve) => {
    resolveConfirmation.current?.(false);
    resolveConfirmation.current = resolve;
    setConfirmation(options);
  }), []);

  const answer = useCallback((value: boolean) => {
    dialog.current?.close();
    resolveConfirmation.current?.(value);
    resolveConfirmation.current = null;
    setConfirmation(null);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (confirmation) dialog.current?.showModal();
  }, [confirmation]);

  useEffect(() => () => { resolveConfirmation.current?.(false); }, []);

  return <NoticeContext.Provider value={{ notify, confirm }}>
    {children}
    <div className="notice-stack" aria-live="polite" aria-atomic="true">
      {notice && <div key={notice.id} className={`notice-card notice-${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}>
        <span className="notice-icon" aria-hidden="true">{notice.kind === "success" ? "✓" : "!"}</span>
        <p>{notice.message}</p>
        <button type="button" aria-label="Dismiss notification" onClick={() => setNotice(null)}>×</button>
      </div>}
    </div>
    <dialog ref={dialog} className="notice-dialog" aria-labelledby="notice-dialog-title" onCancel={(event) => { event.preventDefault(); answer(false); }} onClick={(event) => { if (event.target === dialog.current) answer(false); }}>
      {confirmation && <div className="notice-dialog-card">
        <span className={`notice-dialog-icon${confirmation.danger ? " is-danger" : ""}`} aria-hidden="true">{confirmation.danger ? "!" : "?"}</span>
        <h2 id="notice-dialog-title">{confirmation.title}</h2>
        <p>{confirmation.message}</p>
        <div className="notice-dialog-actions">
          <button type="button" onClick={() => answer(false)}>Cancel</button>
          <button type="button" className={confirmation.danger ? "is-danger" : "is-primary"} onClick={() => answer(true)}>{confirmation.confirmLabel}</button>
        </div>
      </div>}
    </dialog>
  </NoticeContext.Provider>;
}

export function useNotice() {
  const context = useContext(NoticeContext);
  if (!context) throw new Error("useNotice must be used inside NoticeProvider");
  return context;
}
