"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "./auth-client";

export function ResetPasswordForm() {
  const token = useSearchParams().get("token");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || busy) return;
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("password") || "");
    const confirmation = String(form.get("confirmation") || "");
    if (newPassword !== confirmation) {
      setMessage("Passwords do not match.");
      setBusy(false);
      return;
    }
    try {
      const { error } = await authClient.resetPassword({ newPassword, token });
      setMessage(error?.message || "Password updated. You can sign in now.");
    } catch {
      setMessage("Could not reset your password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) return <p>This reset link is invalid or expired. Request a new one from the sign-in page.</p>;

  return (
    <form className="auth-form" onSubmit={submit}>
      <label>New password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
      <label>Confirm password<input name="confirmation" type="password" autoComplete="new-password" minLength={8} required /></label>
      {message && <p className="auth-message" role="status">{message}</p>}
      <button type="submit" disabled={busy}>{busy ? "Please wait..." : "Reset password"}</button>
    </form>
  );
}
