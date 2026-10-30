import { NotesApp } from "@/features/notes/NotesApp";
import { auth } from "@/features/auth/auth";
import { headers } from "next/headers";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  return <NotesApp key={session?.user.id ?? "guest"} isSignedIn={Boolean(session)} userName={session?.user.name || session?.user.email || "Account"} userImage={session?.user.image} googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)} />;
}
