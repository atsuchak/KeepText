import "server-only";

import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { sendEmail } from "@/integrations/sendEmail";
import { db, mongoClient } from "@/integrations/mongo";

export const auth = betterAuth({
  database: mongodbAdapter(db, { client: mongoClient }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(user.email, "Reset your KeepText password", `Reset your password: ${url}`);
    },
  },
  emailVerification: {
    sendOnSignIn: true,
  },
  user: {
    additionalFields: {
      phoneNumber: { type: "string", required: false, input: true },
    },
    deleteUser: {
      enabled: true,
      afterDelete: async (user) => {
        await db.collection("notes").deleteMany({ userId: user.id });
        await db.collection("account").deleteMany({ userId: user.id });
      },
    },
  },
  databaseHooks: {
    user: {
      update: {
        before: async (user) => {
          if (typeof user.name === "string" && (!user.name.trim() || user.name.length > 80)) return false;
          if (typeof user.phoneNumber === "string" && user.phoneNumber !== "" && !/^\+?[0-9() -]{7,20}$/.test(user.phoneNumber)) return false;
          if (typeof user.image === "string" && user.image.startsWith("data:") && (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(user.image) || user.image.length > 350_000)) return false;
        },
      },
    },
  },
  plugins: [emailOTP({
    overrideDefaultEmailVerification: true,
    storeOTP: "encrypted",
    disableSignUp: true,
    async sendVerificationOTP({ email, otp, type }) {
      const purpose = type === "email-verification" ? "Verify your email" : type === "sign-in" ? "Sign in to KeepText" : "Your KeepText code";
      const html = `<!doctype html><html><body style="margin:0;padding:32px 16px;background:#f3f6f9;font-family:Arial,sans-serif;color:#18212a"><table role="presentation" style="width:100%;max-width:480px;margin:0 auto;border-collapse:collapse"><tr><td style="padding:30px 32px;background:#fff;border:1px solid #e2e8ee;border-radius:16px;text-align:center"><div style="font-size:24px;font-weight:700;letter-spacing:-1px">Keep<span style="color:#428fca">Text</span></div><h1 style="margin:32px 0 10px;font-size:22px;font-weight:600">${purpose}</h1><p style="margin:0 0 24px;color:#63707c;font-size:14px;line-height:1.6">Enter this code to continue.</p><div style="padding:20px 12px;border:1px solid #cbdceb;border-radius:12px;background:#f1f7fc;color:#142d43;font-size:32px;font-weight:700;letter-spacing:8px">${otp}</div><p style="margin:24px 0 0;color:#7b8792;font-size:12px">This code expires in 5 minutes. If you did not request it, you can ignore this email.</p></td></tr></table></body></html>`;
      await sendEmail(email, type === "email-verification" ? "Verify your KeepText email" : type === "sign-in" ? "Sign in to KeepText" : "Your KeepText code", `Your KeepText code is ${otp}. It expires in 5 minutes.`, html);
    },
  })],
  socialProviders: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          requireEmailVerification: true,
        },
      }
    : {},
});
