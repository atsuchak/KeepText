import { decryptField, encryptField } from "@/features/notes/noteEncryption";
import { titleFromContent } from "@/features/notes/noteTitle";
import { notes, signedInUserId } from "@/features/notes/notesStore";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  const userId = await signedInUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const note = await notes.findOne({ _id: id, userId });
  if (!note) return Response.json({ error: "Not found" }, { status: 404 });

  try {
    return Response.json({ id, title: decryptField(note.title), content: decryptField(note.content) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Could not open this note" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Context) {
  const userId = await signedInUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid request" }, { status: 400 }); }
  if (typeof body !== "object" || body === null || !("content" in body)) {
    return Response.json({ error: "Invalid note" }, { status: 400 });
  }
  const { content } = body;
  if (typeof content !== "string" || Buffer.byteLength(content, "utf8") > 1024 * 1024) {
    return Response.json({ error: "Invalid note" }, { status: 400 });
  }

  const { id } = await params;
  const title = titleFromContent(content);
  const updated = await notes.findOneAndUpdate({ _id: id, userId }, [{ $set: {
    title: { $cond: [{ $eq: ["$customTitle", true] }, "$title", encryptField(title)] },
    content: encryptField(content),
  } }], { returnDocument: "after", projection: { title: 1 } });
  if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ saved: true, title: decryptField(updated.title) });
}

export async function PATCH(request: Request, { params }: Context) {
  const userId = await signedInUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid request" }, { status: 400 }); }
  if (typeof body !== "object" || body === null || !("action" in body)) return Response.json({ error: "Invalid request" }, { status: 400 });

  const { id } = await params;
  if (body.action === "rename" && "title" in body && typeof body.title === "string") {
    const title = body.title.trim();
    if (!title || title.length > 120) return Response.json({ error: "Title must be 1 to 120 characters" }, { status: 400 });
    const result = await notes.updateOne({ _id: id, userId }, { $set: { title: encryptField(title), customTitle: true } });
    if (!result.matchedCount) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ title, customTitle: true });
  }
  if (body.action === "pin" && "pinned" in body && typeof body.pinned === "boolean") {
    const result = await notes.updateOne({ _id: id, userId }, { $set: { pinned: body.pinned } });
    if (!result.matchedCount) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ pinned: body.pinned });
  }
  return Response.json({ error: "Invalid request" }, { status: 400 });
}

export async function DELETE(request: Request, { params }: Context) {
  const userId = await signedInUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await notes.deleteOne({ _id: id, userId });
  if (!result.deletedCount) return Response.json({ error: "Not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
