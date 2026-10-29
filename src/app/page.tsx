import { NotesApp } from "@/features/notes/NotesApp";

export default function Home() {
  return <NotesApp isSignedIn={false} />;
}
