"use server";

import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { getSession } from "@/actions/auth";

export async function saveNote(content: string) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    await connectToDatabase();
    await User.findByIdAndUpdate(session.userId, { noteContent: content });
    return { success: true };
  } catch (error) {
    console.error("Error saving note:", error);
    return { error: "Failed to save note" };
  }
}

export async function getNote() {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    await connectToDatabase();
    const user = await User.findById(session.userId).select('noteContent');
    if (!user) {
      return { error: "User not found" };
    }
    return { success: true, content: user.noteContent || "" };
  } catch (error) {
    console.error("Error fetching note:", error);
    return { error: "Failed to fetch note" };
  }
}
