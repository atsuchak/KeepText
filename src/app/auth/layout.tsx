import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Log in or create an account to sync your notes across all your devices.",
  openGraph: {
    title: "Authentication | Blanked Note",
    description: "Log in or create an account to sync your notes across all your devices.",
  }
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
