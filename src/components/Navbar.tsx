"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, UserCircle, LogOut, History } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSession, signOut } from "@/actions/auth";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<{ email: string } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const fetchSession = async () => {
      const sess = await getSession();
      if (sess) {
        setSession(sess);
      }
    };
    fetchSession();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setSession(null);
    window.location.reload();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 pointer-events-none">
      {/* Pill-shaped Navbar */}
      <nav className="pointer-events-auto flex items-center justify-between px-6 py-3 w-full max-w-5xl bg-white/80 dark:bg-[#0B1120]/90 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-full shadow-lg dark:shadow-black/50 transition-all duration-300">
        
        {/* Brand / Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-inner group-hover:shadow-cyan-500/50 transition-all">
              <span className="text-white font-bold text-sm">BN</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100 hidden sm:block">
              Blanked <span className="text-cyan-500">Note</span>
            </h1>
          </Link>
        </div>

        {/* Right Section: Theme Toggle & Auth */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors focus:outline-none"
            aria-label="Toggle Theme"
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>

          <div className="h-5 w-[1px] bg-gray-300 dark:bg-white/10 mx-1 hidden sm:block"></div>

          {mounted && (
            <>
              {session ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/profile"
                    className="p-1.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                    title="Profile Settings"
                  >
                    <UserCircle className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="p-1.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-full transition-all shadow-sm shadow-blue-500/25"
                >
                  Sign In
                </Link>
              )}
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
