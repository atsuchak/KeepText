import Link from "next/link";
import { Suspense } from "react";
import { Brand } from "@/features/notes/components/Brand";
import { ResetPasswordForm } from "@/features/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <main className="sign-in-page">
      <Brand />
      <section className="sign-in-message auth-content">
        <h1>Set a new password</h1>
        <Suspense fallback={<p>Loading...</p>}><ResetPasswordForm /></Suspense>
        <Link href="/sign-in">Back to sign in</Link>
      </section>
    </main>
  );
}
