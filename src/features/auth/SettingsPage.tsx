"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Brand } from "@/features/notes/components/Brand";
import { authClient } from "./auth-client";

type Props = { name: string; email: string; phoneNumber: string; image?: string | null };

function PasswordField({ label, name, autoComplete, minLength, value, onValueChange }: {
  label: string;
  name?: string;
  autoComplete: string;
  minLength?: number;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="settings-password-field">
      {label}
      <span className="settings-password-input">
        <input name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} minLength={minLength} value={value} onChange={onValueChange ? (event) => onValueChange(event.target.value) : undefined} required={name !== undefined} />
        <button type="button" aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} onClick={() => setVisible((current) => !current)}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" />{visible && <path d="M3 21 21 3" />}</svg>
        </button>
      </span>
    </label>
  );
}

export function SettingsPage({ name, email, phoneNumber, image }: Props) {
  const router = useRouter();
  const imageInput = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(name);
  const [phone, setPhone] = useState(phoneNumber);
  const [profileImage, setProfileImage] = useState(image || "");
  const [theme, setTheme] = useState("dark");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [forgot, setForgot] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  useEffect(() => { setTheme(document.documentElement.dataset.theme || "dark"); }, []);

  function chooseTheme(value: "dark" | "light") {
    document.documentElement.dataset.theme = value;
    localStorage.setItem("keeptext.theme", value);
    setTheme(value);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = displayName.trim();
    const nextPhone = phone.trim();
    if (!nextName || nextName.length > 80) { setMessage("Name must be 1 to 80 characters."); return; }
    if (nextPhone && !/^\+?[0-9() -]{7,20}$/.test(nextPhone)) { setMessage("Enter a valid phone number or leave it empty."); return; }
    setBusy(true); setMessage("");
    try {
      const { error } = await authClient.updateUser({ name: nextName, phoneNumber: nextPhone });
      if (error) setMessage(error.message || "Could not update profile.");
      else { setDisplayName(nextName); setPhone(nextPhone); setMessage("Profile updated."); router.refresh(); }
    } catch { setMessage("Could not update profile."); }
    finally { setBusy(false); }
  }

  async function changeImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 256 * 1024) {
      setMessage("Choose a JPG, PNG, or WebP image under 256 KB."); return;
    }
    setBusy(true); setMessage("");
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read image"));
        reader.readAsDataURL(file);
      });
      const { error } = await authClient.updateUser({ image: dataUrl });
      if (error) setMessage(error.message || "Could not change image.");
      else { setProfileImage(dataUrl); setMessage("Profile image updated."); router.refresh(); }
    } catch { setMessage("Could not change image."); }
    finally { setBusy(false); }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const newPassword = String(values.get("newPassword") || "");
    if (newPassword !== values.get("confirmation")) { setMessage("New passwords do not match."); return; }
    setBusy(true); setMessage("");
    try {
      const { error } = await authClient.changePassword({ currentPassword: String(values.get("currentPassword")), newPassword });
      if (error) setMessage(error.code === "INVALID_PASSWORD" ? "Current password is not correct." : error.message || "Could not change password.");
      else { form.reset(); setMessage("Password changed."); }
    } catch { setMessage("Could not change password."); }
    finally { setBusy(false); }
  }

  async function sendResetCode() {
    setBusy(true); setMessage("");
    try {
      const { error } = await authClient.emailOtp.requestPasswordReset({ email });
      setMessage(error?.message || "A reset code is on its way to your email.");
    } catch { setMessage("Could not send a reset code."); }
    finally { setBusy(false); }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const password = String(values.get("newPassword") || "");
    if (password !== values.get("confirmation")) { setMessage("New passwords do not match."); return; }
    setBusy(true); setMessage("");
    try {
      const { error } = await authClient.emailOtp.resetPassword({ email, otp: String(values.get("otp") || "").trim(), password });
      if (error) setMessage(error.message || "Invalid or expired code.");
      else { form.reset(); setForgot(false); setMessage("Password changed with email code."); }
    } catch { setMessage("Could not reset password."); }
    finally { setBusy(false); }
  }

  async function signOut() {
    setBusy(true); setMessage("");
    try {
      const { error } = await authClient.signOut();
      if (error) setMessage(error.message || "Could not sign out.");
      else window.location.assign("/");
    } catch { setMessage("Could not sign out."); }
    finally { setBusy(false); }
  }

  async function signOutEverywhere() {
    if (!window.confirm("Sign out from every device, including this one?")) return;
    setBusy(true); setMessage("");
    try {
      const { error } = await authClient.revokeSessions();
      if (error) setMessage(error.message || "Could not sign out all devices.");
      else window.location.assign("/");
    } catch { setMessage("Could not sign out all devices."); }
    finally { setBusy(false); }
  }

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!window.confirm("Permanently delete your account and every text? This cannot be undone.")) return;
    setBusy(true); setMessage("");
    try {
      const { error } = await authClient.deleteUser({ password: deletePassword || undefined });
      if (error) setMessage(error.message || "Could not delete account. Sign in again and retry.");
      else window.location.assign("/");
    } catch { setMessage("Could not delete account. Sign in again and retry."); }
    finally { setBusy(false); }
  }

  return (
    <main className="settings-page">
      <header className="settings-header"><Brand /></header>
      <div className="settings-content">
        <div className="settings-title-row">
          <Link href="/" aria-label="Back to texts" className="settings-back"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14 5-7 7 7 7" /></svg></Link>
          <h1>Settings</h1>
          <button className="settings-signout" type="button" disabled={busy} onClick={signOut}>Sign out</button>
        </div>
        {message && <p className="settings-message" role="status">{message}</p>}

        <section className="settings-section" aria-labelledby="profile-title">
          <h2 id="profile-title">Account</h2>
          <div className="settings-photo-row">
            <span className="settings-avatar" style={profileImage ? { backgroundImage: `url(${JSON.stringify(profileImage)})` } : undefined}>{profileImage ? "" : displayName.slice(0, 1).toUpperCase()}</span>
            <div className="settings-photo-info"><strong>{displayName}</strong><span>{email}</span></div>
            <input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp" aria-label="Choose profile image" onChange={changeImage} disabled={busy} hidden />
            <button className="settings-plain-button" type="button" disabled={busy} onClick={() => imageInput.current?.click()}>Change photo</button>
            {profileImage && <button className="settings-secondary" type="button" disabled={busy} onClick={async () => {
              setBusy(true); setMessage("");
              try {
                const { error } = await authClient.updateUser({ image: null });
                if (error) setMessage(error.message || "Could not remove image.");
                else { setProfileImage(""); setMessage("Profile image removed."); router.refresh(); }
              } catch { setMessage("Could not remove image."); }
              finally { setBusy(false); }
            }}>Remove</button>}
          </div>
          <form className="settings-form settings-name-form" onSubmit={saveProfile}>
            <label>Name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} autoComplete="name" required /></label>
            <label>Phone number<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={20} autoComplete="tel" placeholder="Optional" /></label>
            <button type="submit" disabled={busy}>Save</button>
          </form>
        </section>

        <section className="settings-section settings-inline-section" aria-labelledby="appearance-title">
          <div><h2 id="appearance-title">Light theme</h2><p>Switch the app to a lighter look.</p></div>
          <button className="settings-switch" type="button" role="switch" aria-checked={theme === "light"} aria-label="Light theme" onClick={() => chooseTheme(theme === "light" ? "dark" : "light")}><span /></button>
        </section>

        <section className="settings-section" aria-labelledby="password-title">
          <div className="settings-section-heading">
            <h2 id="password-title">Password</h2>
            {!forgot ? <button className="settings-text-button" type="button" onClick={() => { setForgot(true); setMessage(""); }}>Forgot password?</button> : <button className="settings-text-button" type="button" onClick={() => { setForgot(false); setMessage(""); }}>Use current password</button>}
          </div>
          {!forgot ? <>
            <form className="settings-form settings-password-form" onSubmit={changePassword}>
              <PasswordField label="Current password" name="currentPassword" autoComplete="current-password" />
              <PasswordField label="New password" name="newPassword" autoComplete="new-password" minLength={8} />
              <PasswordField label="Re-enter new password" name="confirmation" autoComplete="new-password" minLength={8} />
              <button className="settings-password-submit" type="submit" disabled={busy}>Change password</button>
            </form>
          </> : <>
            <div className="settings-reset-intro"><p>Send a code to {email}.</p><button className="settings-plain-button" type="button" disabled={busy} onClick={sendResetCode}>Send code</button></div>
            <form className="settings-form settings-password-form" onSubmit={resetPassword}>
              <label>Email code<input name="otp" inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={6} required /></label>
              <PasswordField label="New password" name="newPassword" autoComplete="new-password" minLength={8} />
              <PasswordField label="Re-enter new password" name="confirmation" autoComplete="new-password" minLength={8} />
              <button className="settings-password-submit" type="submit" disabled={busy}>Reset password</button>
            </form>
          </>}
        </section>

        <section className="settings-section settings-inline-section" aria-labelledby="sessions-title">
          <div><h2 id="sessions-title">Sessions</h2><p>Manage where you are signed in.</p></div>
          <div className="settings-actions">
            <button className="settings-signout" type="button" disabled={busy} onClick={signOutEverywhere}>Sign out everywhere</button>
          </div>
        </section>

        <details className="settings-section settings-danger" aria-labelledby="delete-title">
          <summary id="delete-title">Delete account <span>+</span></summary>
          <p>Your account and all its texts will be permanently deleted.</p>
          <form className="settings-form settings-delete-form" onSubmit={deleteAccount}>
            <PasswordField label="Password, if your account has one" autoComplete="current-password" value={deletePassword} onValueChange={setDeletePassword} />
            <button type="submit" disabled={busy}>Delete account</button>
          </form>
        </details>
      </div>
    </main>
  );
}
