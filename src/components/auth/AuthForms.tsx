"use client";

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Key, ArrowRight } from "lucide-react";
import { sendVerificationCode, verifyAndSignUp, signIn, resetPassword } from "@/actions/auth";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "signin" | "signup" | "forgot";

export function AuthForms() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") as Mode) || "signin";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<1 | 2>(1); // Step 1: email, Step 2: code + password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resetState = (newMode: Mode) => {
    setMode(newMode);
    setStep(1);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setCode("");
    setError(null);
    setSuccess(null);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await sendVerificationCode(email, mode === "signup" ? "signup" : "reset");
    
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess("Verification code sent!");
      setStep(2);
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn(email, password);
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const handleSignUpComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await verifyAndSignUp(email, code, password);
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const handleResetComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await resetPassword(email, code, password);
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      resetState("signin");
      setSuccess("Password reset successfully. You can now sign in.");
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  return (
    <div className="w-full bg-[#0B1120]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-gray-200">
      <div className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
            {mode === "signin" && "Welcome Back"}
            {mode === "signup" && "Create Account"}
            {mode === "forgot" && "Reset Password"}
          </h2>
          <p className="text-gray-400 text-sm">
            {mode === "signin" && "Sign in to access your saved notes"}
            {mode === "signup" && "Join Blanked Note today"}
            {mode === "forgot" && "Enter your email to receive a reset code"}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/50 rounded-xl text-emerald-400 text-sm text-center">
            {success}
          </div>
        )}

        {/* Form Content */}
        <form
          onSubmit={
            mode === "signin"
              ? handleSignIn
              : mode === "signup"
              ? step === 1
                ? handleSendCode
                : handleSignUpComplete
              : step === 1
              ? handleSendCode
              : handleResetComplete
          }
          className="space-y-5"
        >
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-300">Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                required
                disabled={step === 2 && mode !== "signin"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password Field (Sign In) */}
          {mode === "signin" && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-gray-300">Password</label>
                <button
                  type="button"
                  onClick={() => resetState("forgot")}
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Password Field (Sign Up & Forgot - Step 2) */}
          {step === 2 && (mode === "signup" || mode === "forgot") && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-300">
                {mode === "forgot" ? "New Password" : "Password"}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password Field (Forgot - Step 2) */}
          {step === 2 && mode === "forgot" && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-300">
                Confirm New Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Verification Code Field (Step 2) */}
          {step === 2 && (mode === "signup" || mode === "forgot") && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-300">
                Verification Code
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-colors">
                  <Key className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono tracking-widest"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 mt-4 rounded-xl font-medium text-white shadow-lg transition-all flex items-center justify-center gap-2 group ${
              loading ? "opacity-70 cursor-not-allowed" : "hover:shadow-blue-500/25"
            } ${
              step === 1 && mode !== "signin"
                ? "bg-white/5 border border-white/10 hover:bg-white/10"
                : "bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-400 hover:to-cyan-300 text-shadow-sm"
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === "signin" && "Sign In"}
                {step === 1 && mode === "signup" && "Send Verification Code"}
                {step === 2 && mode === "signup" && "Complete Registration"}
                {step === 1 && mode === "forgot" && "Send Verification Code"}
                {step === 2 && mode === "forgot" && "Reset Password"}
                {((mode === "signin") || (step === 2)) && (
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                )}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer Toggle */}
      <div className="p-6 bg-black/50 border-t border-white/5 text-center">
        {mode === "signin" && (
          <button
            onClick={() => resetState("signup")}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Don&apos;t have an account? <span className="text-blue-400">Sign up</span>
          </button>
        )}
        {mode === "signup" && (
          <button
            onClick={() => resetState("signin")}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Already have an account? <span className="text-blue-400">Sign in</span>
          </button>
        )}
        {mode === "forgot" && (
          <button
            onClick={() => resetState("signin")}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Remembered your password? <span className="text-blue-400">Back to login</span>
          </button>
        )}
      </div>
    </div>
  );
}
