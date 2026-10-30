import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import "@/features/notes/notes.css";
import "@/features/auth/sign-in.css";
import "@/features/auth/settings.css";
import "@/bootstrap/notice.css";
import "lenis/dist/lenis.css";
import { SmoothScroll } from "@/bootstrap/SmoothScroll";
import { NoticeProvider } from "@/bootstrap/NoticeProvider";
import { CopyrightYear } from "@/bootstrap/CopyrightYear";

export const metadata: Metadata = {
  title: "KeepText",
  description: "A simple space for your notes and ideas.",
  manifest: "/assets/keeptext-favicon/site.webmanifest",
  icons: {
    icon: [
      { url: "/assets/keeptext-favicon/favicon.ico", sizes: "any" },
      { url: "/assets/keeptext-favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/assets/keeptext-favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: { url: "/assets/keeptext-favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0b",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: "try{document.documentElement.dataset.theme=localStorage.getItem('keeptext.theme')||'dark'}catch{}" }} /></head>
      <body suppressHydrationWarning><NoticeProvider><SmoothScroll />{children}<footer className="site-footer">
        <span className="site-footer-copy">&copy; <CopyrightYear /> Ahnaf Tajwar Suchak. All rights reserved.</span>
        <nav className="site-footer-links" aria-label="Creator links">
          <a href="https://atsuchak.me" target="_blank" rel="noopener noreferrer" aria-label="Portfolio" title="Portfolio"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.4 4 5.5 4 9s-1.5 6.6-4 9c-2.5-2.4-4-5.5-4-9s1.5-6.6 4-9Z" /></svg></a>
          <a href="https://github.com/atsuchak" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 19c-4.3 1.3-4.3-2.3-6-2.5m12 4V17a3 3 0 0 0-.8-2.3c3-.3 6-1.5 6-6.5A5 5 0 0 0 19 4a4.7 4.7 0 0 0-.1-3S17.8.7 15 2a12 12 0 0 0-6 0C6.2.7 5.1 1 5.1 1A4.7 4.7 0 0 0 5 4a5 5 0 0 0-1.2 3.2c0 5 3 6.2 6 6.5A3 3 0 0 0 9 17v3.5" /></svg></a>
          <a href="https://www.linkedin.com/in/atsuchak/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10v9M4 5v.01M10 19v-9m0 3.5a4 4 0 0 1 8 0V19" /></svg></a>
          <a href="mailto:ahnaftajwarsuchak@gmail.com" aria-label="Email" title="Email"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg></a>
        </nav>
      </footer></NoticeProvider><Analytics /><SpeedInsights /></body>
    </html>
  );
}
