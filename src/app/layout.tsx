import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://blanked-note.vercel.app'),
  title: {
    default: "Blanked Note",
    template: "%s | Blanked Note",
  },
  description: "A fast, minimalist notepad right in your browser. Save notes locally or create an account to sync across devices.",
  keywords: ["notepad", "notes", "minimalist", "blanked note", "online notepad"],
  authors: [{ name: "Blanked Note" }],
  creator: "Blanked Note",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://blanked-note.vercel.app",
    title: "Blanked Note",
    description: "A fast, minimalist notepad right in your browser.",
    siteName: "Blanked Note",
    images: [
      {
        url: "/og-image.png", // Make sure to create and place an og-image.png in your public folder
        width: 1200,
        height: 630,
        alt: "Blanked Note",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blanked Note",
    description: "A fast, minimalist notepad right in your browser.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col bg-white dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
