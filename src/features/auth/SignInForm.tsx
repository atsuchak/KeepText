"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "./auth-client";
import { OtpInput } from "./OtpInput";

type Mode = "sign-in" | "sign-up" | "verify" | "forgot" | "otp-email" | "otp-code";

export function SignInForm({ googleEnabled, initialMode = "sign-in", inDrawer = false }: { googleEnabled: boolean; initialMode?: "sign-in" | "sign-up"; inDrawer?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(inDrawer ? null : initialMode === "sign-up" ? "right" : "left");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const email = mode === "verify" || mode === "otp-code" ? verificationEmail : String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    try {
      if (mode === "otp-code") {
        const { error } = await authClient.signIn.emailOtp({ email, otp: String(form.get("otp") || "").trim() });
        if (error) setMessage(error.message || "Invalid code. Please try again.");
        else if (inDrawer) router.refresh();
        else router.replace("/");
      } else if (mode === "otp-email") {
        const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
        if (error) setMessage(error.message || "Could not send a code. Please try again.");
        else { setVerificationEmail(email); setOtp(""); setMode("otp-code"); setMessage("If this email has an account, a code is on its way."); }
      } else if (mode === "verify") {
        const { error } = await authClient.emailOtp.verifyEmail({ email, otp: String(form.get("otp") || "").trim() });
        if (error) setMessage(error.message || "Invalid code. Please try again.");
        else if (inDrawer) { setSlideDirection(null); setMode("sign-in"); setMessage("Email verified. Sign in to continue."); }
        else router.replace("/sign-in");
      } else if (mode === "forgot") {
        const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
        setMessage(error?.message || "If this email has an account, a reset link is on its way.");
      } else if (mode === "sign-up") {
        const { error } = await authClient.signUp.email({
          name: String(form.get("name") || "").trim(),
          email,
          password,
          callbackURL: "/",
        });
        if (error) setMessage(error.message || "Could not create account.");
        else { setVerificationEmail(email); setOtp(""); setMode("verify"); setMessage("Check your email for a six-digit code."); }
      } else {
        const { error } = await authClient.signIn.email({ email, password, callbackURL: "/" });
        if (error?.code === "EMAIL_NOT_VERIFIED") { setVerificationEmail(email); setOtp(""); setMode("verify"); setMessage("Check your email for a verification code."); }
        else if (error) setMessage(error.message || "Could not sign in.");
        else if (inDrawer) router.refresh();
        else router.replace("/");
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    setBusy(true);
    setMessage("");
    try {
      const { error } = await authClient.signIn.social({ provider: "google", callbackURL: "/" });
      if (error) setMessage(error.message || "Could not start Google sign-in.");
    } catch {
      setMessage("Could not start Google sign-in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`auth-stage${slideDirection && (mode === "sign-in" || mode === "sign-up") ? ` auth-stage-from-${slideDirection}` : ""}`}>
      <h1 id="auth-title">{mode === "sign-up" ? "Create an account" : mode === "verify" || mode === "otp-code" ? "Enter your code" : mode === "otp-email" ? "Sign in with a code" : mode === "forgot" ? "Reset password" : "Welcome back"}</h1>
      {(mode === "verify" || mode === "otp-code") && <p className="auth-intro">{mode === "verify" ? "Code sent to" : "Enter the code for"} {verificationEmail}.</p>}
      {mode === "forgot" && <p className="auth-intro">We will email you a reset link.</p>}
      {(mode === "sign-in" || mode === "sign-up") && <nav className="auth-tabs" aria-label="Account access">
        {inDrawer ? <>
          <button type="button" className={mode === "sign-in" ? "active" : ""} aria-current={mode === "sign-in" ? "page" : undefined} onClick={() => { setSlideDirection("left"); setMode("sign-in"); setMessage(""); }}>Sign in</button>
          <button type="button" className={mode === "sign-up" ? "active" : ""} aria-current={mode === "sign-up" ? "page" : undefined} onClick={() => { setSlideDirection("right"); setMode("sign-up"); setMessage(""); }}>Create account</button>
        </> : <>
          <Link href="/sign-in" className={mode === "sign-in" ? "active" : ""} aria-current={mode === "sign-in" ? "page" : undefined}>Sign in</Link>
          <Link href="/sign-up" className={mode === "sign-up" ? "active" : ""} aria-current={mode === "sign-up" ? "page" : undefined}>Create account</Link>
        </>}
      </nav>}
      <form className="auth-form" onSubmit={submit}>
        {mode === "sign-up" && <input name="name" aria-label="Name" placeholder="Name" autoComplete="name" required />}
        {mode !== "verify" && mode !== "otp-code" && <input name="email" type="email" aria-label="Email" placeholder="Email" autoComplete="email" required />}
        {(mode === "sign-in" || mode === "sign-up") && <input name="password" type="password" aria-label="Password" placeholder="Password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} minLength={8} required />}
        {mode === "sign-in" && <button className="forgot-link" type="button" onClick={() => { setMode("forgot"); setMessage(""); }}>Forgot password?</button>}
        {(mode === "verify" || mode === "otp-code") && <OtpInput value={otp} onChange={setOtp} />}
        {message && <p className="auth-message" role="status">{message}</p>}
        <button type="submit" disabled={busy}>{busy ? "Please wait..." : mode === "sign-up" ? "Create account" : mode === "verify" ? "Verify email" : mode === "forgot" ? "Send reset link" : mode === "otp-email" ? "Send code" : "Sign in"}</button>
      </form>
      {mode === "sign-in" && <button className="otp-entry-button" type="button" onClick={() => { setSlideDirection(null); setMode("otp-email"); setMessage(""); }}>Sign in with email code</button>}
      {(mode === "verify" || mode === "otp-code") && <button className="resend-code" type="button" disabled={busy} onClick={async () => {
        setBusy(true);
        try {
          const { error } = await authClient.emailOtp.sendVerificationOtp({ email: verificationEmail, type: mode === "otp-code" ? "sign-in" : "email-verification" });
          setOtp("");
          setMessage(error?.message || "A new code is on its way.");
        } catch {
          setMessage("Could not send a new code. Please try again.");
        } finally {
          setBusy(false);
        }
      }}>Send a new code</button>}
      {(mode === "sign-in" || mode === "sign-up") && googleEnabled && <>
        <div className="auth-divider"><span>or continue with</span></div>
        <button className="google-button" type="button" disabled={busy} onClick={signInWithGoogle}><span className="google-mark" aria-hidden="true">G</span>Google</button>
      </>}
      {(mode === "verify" || mode === "forgot" || mode === "otp-email" || mode === "otp-code") && <div className="auth-switch">
        {inDrawer
          ? <button type="button" onClick={() => { setSlideDirection(null); setMode("sign-in"); setMessage(""); }}>Back to sign in</button>
          : <Link href="/sign-in">Back to sign in</Link>}
      </div>}
    </div>
  );
}
