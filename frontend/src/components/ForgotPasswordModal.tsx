"use client";

import { useState, useEffect, useRef } from "react";
import {
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  completePasswordReset,
} from "@/utils/authStore";

interface ForgotPasswordModalProps {
  initialEmail?: string;
  onClose: () => void;
  onSuccess?: (email: string, newPassword: string) => void;
}

type ResetStep = "EMAIL" | "OTP" | "PASSWORD" | "SUCCESS";

export function ForgotPasswordModal({
  initialEmail = "",
  onClose,
  onSuccess,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<ResetStep>("EMAIL");
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(300);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (step === "OTP" && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timerSeconds]);

  const formatTimer = () => {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }

    setIsLoading(true);
    const res = await sendPasswordResetOtp(email.trim());
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || "Failed to send verification code.");
      return;
    }

    setTimerSeconds(300);
    setOtp(["", "", "", "", "", ""]);
    setStep("OTP");
    setSuccessMessage(`Verification code has been sent directly to ${email.trim()}! Please check your inbox.`);
  };

  // Step 2: Handle OTP input changes
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle pasting whole 6-digit code
      const pasted = value.replace(/\D/g, "").slice(0, 6).split("");
      const nextOtp = [...otp];
      pasted.forEach((digit, idx) => {
        if (idx < 6) nextOtp[idx] = digit;
      });
      setOtp(nextOtp);
      const targetIdx = Math.min(pasted.length, 5);
      otpInputRefs.current[targetIdx]?.focus();
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = value.replace(/\D/g, "");
    setOtp(nextOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const fullOtp = otp.join("").trim();
    if (fullOtp.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit code from your email.");
      return;
    }

    setIsLoading(true);
    const res = await verifyPasswordResetOtp(email.trim(), fullOtp);
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || "Invalid verification code. Please check your email and retry.");
      return;
    }

    setStep("PASSWORD");
    setSuccessMessage("Code verified! Now choose a new secure password.");
  };

  // Step 3: Complete Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (newPassword.length < 4) {
      setErrorMessage("New password must be at least 4 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please check and try again.");
      return;
    }

    const fullOtp = otp.join("").trim();

    setIsLoading(true);
    const res = await completePasswordReset(email.trim(), fullOtp, newPassword.trim());
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || "Failed to update password.");
      return;
    }

    setStep("SUCCESS");
    setTimeout(() => {
      if (onSuccess) {
        onSuccess(email.trim(), newPassword.trim());
      }
      onClose();
    }, 1800);
  };

  // Password strength calculator
  const getPasswordStrength = () => {
    if (!newPassword) return { score: 0, label: "", color: "bg-slate-200" };
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500" };
    if (score === 2) return { score: 2, label: "Fair", color: "bg-amber-500" };
    if (score === 3) return { score: 3, label: "Good", color: "bg-blue-500" };
    return { score: 4, label: "Strong", color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-150"
      >
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold text-base shadow-sm">
              {step === "EMAIL" && "✉️"}
              {step === "OTP" && "📬"}
              {step === "PASSWORD" && "🔒"}
              {step === "SUCCESS" && "✅"}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {step === "EMAIL" && "Forgot Password"}
                {step === "OTP" && "Check Your Email"}
                {step === "PASSWORD" && "Set New Password"}
                {step === "SUCCESS" && "Password Reset Complete"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {step === "EMAIL" && "Step 1 of 3: Enter your registered email"}
                {step === "OTP" && "Step 2 of 3: Enter the 6-digit code sent to your inbox"}
                {step === "PASSWORD" && "Step 3 of 3: Choose a secure new password"}
                {step === "SUCCESS" && "All set! You can now login seamlessly"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Step Breadcrumb Progress Bar */}
        {step !== "SUCCESS" && (
          <div className="mt-3.5 grid grid-cols-3 gap-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                step === "EMAIL" || step === "OTP" || step === "PASSWORD"
                  ? "bg-violet-600"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}
            ></div>
            <div
              className={`h-1.5 rounded-full transition-all ${
                step === "OTP" || step === "PASSWORD"
                  ? "bg-violet-600"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}
            ></div>
            <div
              className={`h-1.5 rounded-full transition-all ${
                step === "PASSWORD"
                  ? "bg-violet-600"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}
            ></div>
          </div>
        )}

        {/* Dynamic Alerts */}
        {errorMessage && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 animate-in fade-in">
            ⚠️ {errorMessage}
          </div>
        )}

        {successMessage && step !== "SUCCESS" && (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400 animate-in fade-in">
            ✅ {successMessage}
          </div>
        )}

        {/* STEP 1: Enter Email */}
        {step === "EMAIL" && (
          <form onSubmit={handleSendOtp} className="mt-4 space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 text-xs">
                  ✉️
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your account email (e.g. user@gmail.com)..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-4 text-xs font-medium text-slate-800 outline-none focus:border-violet-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500 transition disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
              >
                {isLoading ? "Sending Email..." : "Send Verification Code →"}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Enter 6-Digit OTP from Email */}
        {step === "OTP" && (
          <form onSubmit={handleVerifyOtp} className="mt-4 space-y-4 text-center">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-left dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-start gap-2.5">
                <span className="text-xl">📩</span>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Check your Email Inbox
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    We sent a 6-digit verification code to{" "}
                    <strong className="text-violet-600 dark:text-violet-400">{email}</strong>.
                    Please check your inbox (and Spam folder) and type the code below.
                  </p>
                </div>
              </div>
            </div>

            <div>
              {/* 6 Digit Input Boxes */}
              <div className="flex items-center justify-center gap-2 my-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpInputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="h-12 w-11 rounded-2xl border-2 border-slate-200 bg-slate-50 text-center text-lg font-black text-slate-900 outline-none focus:border-violet-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white transition shadow-xs"
                  />
                ))}
              </div>

              {/* Countdown & Resend Code */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <span>
                  Code expires in:{" "}
                  <strong className="font-mono text-violet-600 dark:text-violet-400">
                    {formatTimer()}
                  </strong>
                </span>

                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={isLoading || timerSeconds > 240}
                  className="font-bold text-violet-600 dark:text-violet-400 hover:underline disabled:opacity-50 cursor-pointer"
                >
                  Resend Code
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep("EMAIL")}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={isLoading || otp.join("").length !== 6}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500 transition disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? "Verifying..." : "Verify Code →"}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Set New Password */}
        {step === "PASSWORD" && (
          <form onSubmit={handleResetPassword} className="mt-4 space-y-3.5 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-xs">
                  🔒
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 4 chars)..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-9 text-xs font-medium text-slate-800 outline-none focus:border-violet-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span>Strength: {strength.label}</span>
                    <span>{strength.score * 25}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                    {[1, 2, 3, 4].map((s) => (
                      <div
                        key={s}
                        className={`h-full flex-1 rounded-full ${
                          s <= strength.score ? strength.color : "bg-transparent"
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-xs">
                  🛡️
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-3 text-xs font-medium text-slate-800 outline-none focus:border-violet-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep("OTP")}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={isLoading || !newPassword || newPassword !== confirmPassword}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500 transition disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? "Updating..." : "Save Password & Login"}
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Success Confetti View */}
        {step === "SUCCESS" && (
          <div className="my-6 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 text-3xl shadow-md">
              ✓
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Password Reset Successfully!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Your new password has been securely saved. Logging you in now...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
