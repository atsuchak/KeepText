"use server";

import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import VerificationToken from "@/models/VerificationToken";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import { signToken, verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendVerificationCode(email: string, type: "signup" | "reset") {
  try {
    await connectToDatabase();
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    return { error: "Failed to connect to the database. Please ensure your IP is whitelisted in MongoDB Atlas and your network allows the connection." };
  }

  const existingUser = await User.findOne({ email });

  if (type === "signup" && existingUser) {
    return { error: "User already exists with this email." };
  }

  if (type === "reset" && !existingUser) {
    return { error: "No user found with this email." };
  }

  // Generate 6 digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Remove existing tokens for this email and type
  await VerificationToken.deleteMany({ email, type });

  await VerificationToken.create({ email, code, type });

  const subject = type === "signup" ? "Verify your Blanked Note account" : "Reset your Blanked Note password";
  
  const htmlTemplate = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f9fafb; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #111827; font-size: 28px; font-weight: 700; margin: 0;">Blanked <span style="color: #06b6d4;">Note</span></h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 40px; rounded-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 12px;">
        <h2 style="color: #1f2937; font-size: 22px; font-weight: 600; margin-top: 0; margin-bottom: 24px; text-align: center;">
          ${type === "signup" ? "Welcome! Let's verify your email" : "Reset your password"}
        </h2>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
          ${type === "signup" 
            ? "Thank you for joining Blanked Note. To complete your registration, please use the verification code below:" 
            : "We received a request to reset your password. Please use the verification code below:"}
        </p>
        
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 32px;">
          <span style="font-family: monospace; font-size: 42px; font-weight: 700; color: #0284c7; letter-spacing: 8px;">${code}</span>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 0;">
          This code will expire in 5 minutes. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 32px;">
        <p style="color: #9ca3af; font-size: 13px;">
          &copy; ${new Date().getFullYear()} Blanked Note. All rights reserved.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: '"Blanked Note" <' + process.env.EMAIL_USER + '>',
      to: email,
      subject,
      html: htmlTemplate,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { error: "Failed to send verification email." };
  }
}

export async function verifyAndSignUp(email: string, code: string, password: string) {
  await connectToDatabase();

  const tokenRecord = await VerificationToken.findOne({ email, code, type: "signup" });

  if (!tokenRecord) {
    return { error: "Invalid or expired verification code." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({ email, password: hashedPassword });
  await VerificationToken.deleteMany({ email, type: "signup" });

  const token = await signToken({ userId: newUser._id.toString(), email: newUser.email, tokenVersion: newUser.tokenVersion || 0 });
  
  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return { success: true };
}

export async function signIn(email: string, password: string) {
  await connectToDatabase();

  const user = await User.findOne({ email });
  if (!user || !user.password) {
    return { error: "Invalid email or password." };
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return { error: "Invalid email or password." };
  }

  const token = await signToken({ userId: user._id.toString(), email: user.email, tokenVersion: user.tokenVersion || 0 });
  
  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return { success: true };
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  await connectToDatabase();

  const tokenRecord = await VerificationToken.findOne({ email, code, type: "reset" });

  if (!tokenRecord) {
    return { error: "Invalid or expired reset code." };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await User.updateOne({ email }, { password: hashedPassword });
  await VerificationToken.deleteMany({ email, type: "reset" });

  return { success: true };
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  await connectToDatabase();
  const user = await User.findById(payload.userId).select('tokenVersion');
  
  if (!user || user.tokenVersion !== (payload.tokenVersion || 0)) {
    return null;
  }

  return payload;
}
