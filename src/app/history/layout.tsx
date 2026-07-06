import { Metadata } from "next";

export const metadata: Metadata = {
  title: "History",
  description: "View and manage your saved notes history.",
  openGraph: {
    title: "History | Blanked Note",
    description: "View and manage your saved notes history.",
  }
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
