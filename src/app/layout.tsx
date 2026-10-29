import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Redesign",
  description: "A new version is in progress.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
