import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@/features/notes/notes.css";
import "@/features/auth/sign-in.css";
import "@/features/auth/settings.css";
import "lenis/dist/lenis.css";
import { SmoothScroll } from "@/bootstrap/SmoothScroll";

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
      <body suppressHydrationWarning><SmoothScroll />{children}</body>
    </html>
  );
}
