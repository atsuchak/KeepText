import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your Blanked Note account settings and preferences.",
  openGraph: {
    title: "Profile | Blanked Note",
    description: "Manage your Blanked Note account settings and preferences.",
  }
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
