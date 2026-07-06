"use server";

import connectToDatabase from "@/lib/mongodb";
import NoteHistory from "@/models/NoteHistory";
import { getSession } from "@/actions/auth";

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
      title: finalTitle,
      content,
    });

    await newNote.save();
    return { success: true, note: JSON.parse(JSON.stringify(newNote)) };
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

    if (search.trim()) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } }
      ];
    }

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

    const notes = await NoteHistory.find(query).sort({ isPinned: -1, createdAt: -1 });
    return { success: true, notes: JSON.parse(JSON.stringify(notes)) };
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

    const updatedNote = await NoteHistory.findOneAndUpdate(
      { _id: id, userId: session.userId },
      { $set: data },
      { new: true }
    );

    if (!updatedNote) {
      return { error: "Note not found" };
    }

    return { success: true, note: JSON.parse(JSON.stringify(updatedNote)) };
  } catch (error) {
    console.error("Error updating history item:", error);
    return { error: "Failed to update history item" };
  }
}
