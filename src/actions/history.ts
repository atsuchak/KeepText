"use server";

import connectToDatabase from "@/lib/mongodb";
import NoteHistory from "@/models/NoteHistory";
import { getSession } from "@/actions/auth";
import { encrypt, decrypt } from "@/lib/encryption";

export async function saveToHistory(title: string | null, content: string) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    await connectToDatabase();
    
    // Determine the title if not provided
    let finalTitle = title;
    if (!finalTitle || finalTitle.trim() === "") {
      const words = content.trim().split(/\s+/);
      finalTitle = words.slice(0, 2).join(" ");
      if (!finalTitle) finalTitle = "Untitled"; // Fallback
    }

    const newNote = new NoteHistory({
      userId: session.userId,
      title: encrypt(finalTitle),
      content: encrypt(content),
    });

    await newNote.save();
    const resultNote = JSON.parse(JSON.stringify(newNote));
    resultNote.title = finalTitle;
    resultNote.content = content;
    return { success: true, note: resultNote };
  } catch (error) {
    console.error("Error saving note to history:", error);
    return { error: "Failed to save note to history" };
  }
}

export async function getHistory(search: string = "", sort: string = "all_time") {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    await connectToDatabase();

    const query: any = { userId: session.userId };

    if (sort === "today") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: startOfToday };
    } else if (sort === "7_days") {
      const startOf7Days = new Date();
      startOf7Days.setDate(startOf7Days.getDate() - 7);
      query.createdAt = { $gte: startOf7Days };
    } else if (sort === "30_days") {
      const startOf30Days = new Date();
      startOf30Days.setDate(startOf30Days.getDate() - 30);
      query.createdAt = { $gte: startOf30Days };
    }

    let notes = await NoteHistory.find(query).sort({ isPinned: -1, order: 1, createdAt: -1 });
    
    // Decrypt notes
    let decryptedNotes = notes.map(note => {
      const obj = note.toObject();
      obj.title = obj.title ? decrypt(obj.title) : obj.title;
      obj.content = obj.content ? decrypt(obj.content) : obj.content;
      return obj;
    });

    // In-memory search since DB is encrypted
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      decryptedNotes = decryptedNotes.filter(n => 
        (n.title && n.title.toLowerCase().includes(lowerSearch)) || 
        (n.content && n.content.toLowerCase().includes(lowerSearch))
      );
    }

    return { success: true, notes: JSON.parse(JSON.stringify(decryptedNotes)) };
  } catch (error) {
    console.error("Error fetching history:", error);
    return { error: "Failed to fetch history" };
  }
}

export async function clearHistory() {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    await connectToDatabase();
    await NoteHistory.deleteMany({ userId: session.userId });
    return { success: true };
  } catch (error) {
    console.error("Error clearing history:", error);
    return { error: "Failed to clear history" };
  }
}

export async function deleteHistoryItem(id: string) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    await connectToDatabase();
    await NoteHistory.findOneAndDelete({ _id: id, userId: session.userId });
    return { success: true };
  } catch (error) {
    console.error("Error deleting history item:", error);
    return { error: "Failed to delete history item" };
  }
}

export async function updateHistoryItem(id: string, data: { title?: string; content?: string; isPinned?: boolean }) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    await connectToDatabase();

    if (data.isPinned === true) {
      const currentNote = await NoteHistory.findOne({ _id: id, userId: session.userId });
      if (!currentNote?.isPinned) {
        const pinnedCount = await NoteHistory.countDocuments({ userId: session.userId, isPinned: true });
        if (pinnedCount >= 4) {
          return { error: "You can only pin up to 4 notes." };
        }
      }
    }

    const updateData: any = { ...data };
    if (data.title !== undefined) updateData.title = encrypt(data.title);
    if (data.content !== undefined) updateData.content = encrypt(data.content);

    const updatedNote = await NoteHistory.findOneAndUpdate(
      { _id: id, userId: session.userId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedNote) {
      return { error: "Note not found" };
    }

    const obj = updatedNote.toObject();
    obj.title = obj.title ? decrypt(obj.title) : obj.title;
    obj.content = obj.content ? decrypt(obj.content) : obj.content;

    return { success: true, note: JSON.parse(JSON.stringify(obj)) };
  } catch (error) {
    console.error("Error updating history item:", error);
    return { error: "Failed to update history item" };
  }
}

export async function updateNotesOrder(updates: { id: string; order: number }[]) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    await connectToDatabase();
    
    // Bulk write for better performance
    const bulkOps = updates.map((update) => ({
      updateOne: {
        filter: { _id: update.id, userId: session.userId },
        update: { $set: { order: update.order } }
      }
    }));

    if (bulkOps.length > 0) {
      await NoteHistory.bulkWrite(bulkOps);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error updating notes order:", error);
    return { error: "Failed to update notes order" };
  }
}
