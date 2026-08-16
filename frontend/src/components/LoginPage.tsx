"use client";

import { useState } from "react";

interface LoginPageProps {
  onLoginSuccess: (user: { name: string; role: "Admin" | "Guest"; email: string }) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [activeRole, setActiveRole] = useState<"Admin" | "Guest">("Admin");

  // Input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (activeRole === "Admin" && !password.trim()) {
      setErrorMessage("Please enter your password.");
      return;
    }

    onLoginSuccess({
      name: activeRole === "Admin" ? email.split("@")[0] || "Admin Evaluator" : "Guest Evaluator",
      role: activeRole,
      email: email.trim(),
    });
  };

  const handleGuestQuickLogin = () => {
    onLoginSuccess({
      name: "Guest Evaluator",
      role: "Guest",
      email: "guest@ablespace.io",
    });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-100/80 via-indigo-50/60 to-slate-100 text-slate-900 flex items-center justify-center p-3 sm:p-6 font-sans box-border overflow-hidden">
      {/* Soft decorative background circles */}
      <div className="absolute top-5 left-5 h-48 w-48 sm:h-72 sm:w-72 rounded-full bg-purple-300/30 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-5 right-5 h-48 w-48 sm:h-80 sm:w-80 rounded-full bg-indigo-300/30 blur-3xl pointer-events-none"></div>

      {/* 100% Fluid Pure Percentage Responsive Card */}
      <div className="w-[92%] max-w-[380px] rounded-2xl sm:rounded-[32px] bg-white p-5 sm:p-8 shadow-2xl border border-purple-100/50 z-10 space-y-4 text-center my-auto mx-auto box-border flex flex-col justify-center">
        {/* Purple User Circle Icon Header */}
        <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shrink-0">
          <svg
            className="h-7 w-7 sm:h-8 sm:w-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>

        {/* Title & Subtitle */}
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Welcome Back!
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1 font-medium">
            Login to your account to continue
          </p>
        </div>

        {/* Role Toggle Pills */}
        <div className="grid grid-cols-2 rounded-xl sm:rounded-2xl bg-slate-100 p-1 text-[11px] sm:text-xs font-bold w-full">
          <button
            type="button"
            onClick={() => {
              setActiveRole("Admin");
              setErrorMessage("");
            }}
            className={`rounded-lg sm:rounded-xl py-1.5 sm:py-2 transition-all truncate px-1 text-center ${
              activeRole === "Admin"
                ? "bg-white text-violet-700 shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            👑 Admin Mode
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveRole("Guest");
              setErrorMessage("");
            }}
            className={`rounded-lg sm:rounded-xl py-1.5 sm:py-2 transition-all truncate px-1 text-center ${
              activeRole === "Guest"
                ? "bg-white text-violet-700 shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            👤 Guest Mode
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-2 text-xs font-bold text-rose-600 text-left">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-3 text-left w-full">
          {/* Email Input */}
          <div className="w-full">
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1">
              Email
            </label>
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-xs sm:text-sm">
                ✉️
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 sm:py-3 pl-8 sm:pl-9 pr-3 text-xs font-medium text-slate-800 outline-none focus:border-violet-500 focus:bg-white placeholder:text-slate-400 box-border"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="w-full">
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-xs sm:text-sm">
                🔒
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required={activeRole === "Admin"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 sm:py-3 pl-8 sm:pl-9 pr-8 sm:pr-9 text-xs font-medium text-slate-800 outline-none focus:border-violet-500 focus:bg-white placeholder:text-slate-400 box-border"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 sm:pr-3 text-slate-400 hover:text-slate-600 text-xs"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <div className="flex justify-end mt-1">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Password reset link sent!");
                }}
                className="text-[10px] sm:text-[11px] font-bold text-violet-600 hover:underline"
              >
                Forgot Password?
              </a>
            </div>
          </div>

          {/* Primary Login Button */}
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 active:scale-98 transition-all mt-1"
          >
            Login
          </button>
        </form>

        {/* Footer */}
        <div className="pt-1 text-center text-[11px] sm:text-xs text-slate-400">
          <span>Don't have an account? </span>
          <button
            onClick={handleGuestQuickLogin}
            className="font-bold text-violet-600 hover:underline"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
}
