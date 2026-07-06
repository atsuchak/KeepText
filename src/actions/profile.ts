"use server";

import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import VerificationToken from "@/models/VerificationToken";
import { getSession } from "@/actions/auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function updateProfile(name: string, mobileNumber: string) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    await connectToDatabase();
    await User.findByIdAndUpdate(session.userId, { name, mobileNumber });
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { error: "Failed to update profile" };
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    await connectToDatabase();
    const user = await User.findById(session.userId);
    if (!user) return { error: "User not found" };
    if (!user.password) return { error: "Password not set for this user" };

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return { error: "Incorrect current password" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return { success: true };
  } catch (error) {
    console.error("Error changing password:", error);
    return { error: "Failed to change password" };
  }
}

export async function logoutAllDevices() {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    await connectToDatabase();
    await User.findByIdAndUpdate(session.userId, { $inc: { tokenVersion: 1 } });
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
    return { success: true };
  } catch (error) {
    console.error("Error logging out of all devices:", error);
    return { error: "Failed to log out of all devices" };
  }
}

export async function deleteAllNotes() {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    await connectToDatabase();
    await User.findByIdAndUpdate(session.userId, { noteContent: "" });
    return { success: true };
  } catch (error) {
    console.error("Error deleting notes:", error);
    return { error: "Failed to delete notes" };
  }
}

export async function deleteAccount() {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    await connectToDatabase();
    await User.findByIdAndDelete(session.userId);
    await VerificationToken.deleteMany({ email: session.email });
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { error: "Failed to delete account" };
  }
}

export async function getProfile() {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };
  
  try {
    await connectToDatabase();
    const user = await User.findById(session.userId).select("name mobileNumber email");
    if (!user) return { error: "User not found" };
    return { success: true, data: { name: user.name || "", mobileNumber: user.mobileNumber || "", email: user.email } };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return { error: "Failed to fetch profile" };
  }
}
