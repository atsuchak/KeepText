import Link from "next/link";
import { Brand } from "@/features/notes/components/Brand";
import { SignInForm } from "@/features/auth/SignInForm";

export default function SignUpPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <main className="sign-in-page">
      <Brand />
      <section className="sign-in-message auth-content">
        <SignInForm googleEnabled={googleEnabled} initialMode="sign-up" />
      </section>
      <p className="auth-page-footer">Your guest draft stays in this browser. <Link href="/">Back to writing</Link></p>
    </main>
  );
}
