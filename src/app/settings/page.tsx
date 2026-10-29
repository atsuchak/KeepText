import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/features/auth/auth";
import { SettingsPage } from "@/features/auth/SettingsPage";

export default async function Settings() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  return <SettingsPage name={session.user.name} email={session.user.email} phoneNumber={session.user.phoneNumber || ""} image={session.user.image} />;
}
