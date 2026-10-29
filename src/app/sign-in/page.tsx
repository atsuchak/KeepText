import Link from "next/link";
import { Brand } from "@/features/notes/components/Brand";
import "@/features/auth/sign-in.css";

export default function SignInPage() {
  return (
    <main className="sign-in-page">
      <Brand />

      <div className="sign-in-message">
        <h1>Sign in is coming soon.</h1>
        <p>Email and Google sign-in are being built. For now, your writing stays in this browser.</p>
        <Link href="/">Back to writing</Link>
      </div>
    </main>
  );
}
