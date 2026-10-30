import { createHash, randomUUID } from "node:crypto";
import { decryptField, encryptField } from "@/features/notes/noteEncryption";
import { titleFromContent } from "@/features/notes/noteTitle";
import { notes, signedInUserId } from "@/features/notes/notesStore";

export async function GET(request: Request) {
  const userId = await signedInUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const records = await notes.find({ userId }, { projection: { title: 1, pinned: 1, customTitle: 1 } }).toArray();
  try {
    const result = records.map((note) => ({ id: note._id, title: decryptField(note.title) || "Untitled", pinned: note.pinned === true, customTitle: note.customTitle === true }));
    result.sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.title.localeCompare(b.title));
    return Response.json({ notes: result }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Could not open your notes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await signedInUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid request" }, { status: 400 }); }
  if (typeof body !== "object" || body === null || !("content" in body) || typeof body.content !== "string" || !body.content.trim() || Buffer.byteLength(body.content, "utf8") > 1024 * 1024) {
    return Response.json({ error: "Invalid note" }, { status: 400 });
  }

  const id = randomUUID();
  const title = titleFromContent(body.content);
  const encryptedContent = encryptField(body.content);
  await notes.insertOne({ _id: id, userId, title: encryptField(title), content: encryptedContent });
  const revision = createHash("sha256").update(encryptedContent).digest("base64url");
  return Response.json({ id, title, content: body.content, revision }, { status: 201 });
}
