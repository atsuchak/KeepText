"use client";

import { useState } from "react";
import Link from "next/link";
import { Brand } from "./components/Brand";
import { GuestEditor } from "./components/GuestEditor";
import { SignedInSidebar } from "./components/SignedInSidebar";

type Props = { isSignedIn: boolean };

export function NotesApp({ isSignedIn }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`app-shell${isSignedIn && sidebarOpen ? " sidebar-open" : ""}`}>
      {isSignedIn && sidebarOpen && <SignedInSidebar onClose={() => setSidebarOpen(false)} />}

      <div className="main-panel">
        <header className="site-header">
          <div className="header-left">
            {isSignedIn && (
              <button
                className="sidebar-toggle"
                type="button"
                aria-label="Toggle sidebar"
                aria-expanded={sidebarOpen}
                onClick={() => setSidebarOpen((open) => !open)}
              >
                ☰
              </button>
            )}
            <Brand />
          </div>

          {!isSignedIn && <Link className="sign-in-button" href="/sign-in">Sign in</Link>}
        </header>

        <GuestEditor />
      </div>
    </div>
  );
}
