import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";

test("email signup requires OTP verification before password sign-in", async () => {
  let otp = "";
  const auth = betterAuth({
    secret: randomBytes(32).toString("base64"),
    baseURL: "http://localhost:3000",
    emailAndPassword: { enabled: true, requireEmailVerification: true },
    emailVerification: { sendOnSignIn: true },
    plugins: [emailOTP({
      overrideDefaultEmailVerification: true,
      storeOTP: "encrypted",
      disableSignUp: true,
      async sendVerificationOTP(data) { otp = data.otp; },
    })],
  });

  const email = "signup-test@example.com";
  const password = "safe-test-password-123";
  const signup = await auth.api.signUpEmail({ body: { name: "Test User", email, password } });
  assert.equal(signup.token, null);
  assert.match(otp, /^\d{6}$/);

  await assert.rejects(auth.api.signInEmail({ body: { email, password } }), { status: "FORBIDDEN" });
  await auth.api.verifyEmailOTP({ body: { email, otp } });
  const signin = await auth.api.signInEmail({ body: { email, password } });
  assert.ok(signin.token);

  otp = "";
  await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
  assert.match(otp, /^\d{6}$/);
  const otpSignin = await auth.api.signInEmailOTP({ body: { email, otp } });
  assert.ok(otpSignin.token);
});
