import { NoteEditor } from "@/components/NoteEditor";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 w-full h-full pt-20 sm:pt-24">
      <NoteEditor />
    </div>
  );
}
