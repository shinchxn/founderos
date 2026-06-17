"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { motion } from "motion/react";
import { Loader2, Zap } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-sm mx-4"
    >
      <div className="rounded-2xl border border-[#1F2330] bg-[#111318] p-8 shadow-2xl">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="h-8 w-8 rounded-lg bg-[#6C63FF] flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-lg font-semibold text-[#F0F2FA] tracking-tight">
            FounderOS
          </span>
          <span className="ml-auto text-xs text-[#4A5168] bg-[#191C23] px-2 py-0.5 rounded-full border border-[#1F2330]">
            v1.0 Beta
          </span>
        </div>

        <h1 className="text-2xl font-bold text-[#F0F2FA] mb-1.5">
          Welcome back
        </h1>
        <p className="text-sm text-[#8B93A9] mb-8">
          Your AI-powered startup operating system
        </p>

        {/* Google Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 rounded-xl bg-[#6C63FF] hover:bg-[#7B73FF] disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium text-sm py-3 px-4 transition-all duration-150 cursor-pointer"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        <p className="mt-6 text-center text-xs text-[#4A5168]">
          By signing in, you agree to our{" "}
          <span className="text-[#8B93A9] underline underline-offset-2 cursor-pointer">
            Terms of Service
          </span>
        </p>
      </div>

      {/* Footer badges */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-[#4A5168]">
        <span>SOC 2 ready</span>
        <span>·</span>
        <span>Built on AWS</span>
        <span>·</span>
        <span>H0 Hackathon 2026</span>
      </div>
    </motion.div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z" fill="#fff" />
    </svg>
  );
}
