"use client";

import { useState } from "react";

interface UserLoginPageProps {
  onUserLoginSuccess: (user: { name: string; role: "User"; email: string }) => void;
  onGoToAdminLogin?: () => void;
}

export function UserLoginPage({ onUserLoginSuccess }: UserLoginPageProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form states
  const [name, setName] = useState("");
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

    if (!password.trim()) {
      setErrorMessage("Please enter your password.");
      return;
    }

    onUserLoginSuccess({
      name: name.trim() || email.split("@")[0] || "User",
      role: "User",
      email: email.trim(),
    });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-100/80 via-indigo-50/60 to-slate-100 text-slate-900 flex items-center justify-center p-3 sm:p-6 font-sans box-border overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-5 left-5 h-48 w-48 sm:h-72 sm:w-72 rounded-full bg-purple-300/30 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-5 right-5 h-48 w-48 sm:h-80 sm:w-80 rounded-full bg-indigo-300/30 blur-3xl pointer-events-none"></div>

      {/* User Login Card */}
      <div className="w-[92%] max-w-[380px] rounded-2xl sm:rounded-[32px] bg-white p-5 sm:p-8 shadow-2xl border border-purple-100/50 z-10 space-y-4 text-center my-auto mx-auto box-border flex flex-col justify-center">
        {/* Purple Circle Avatar */}
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

        {/* Title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            {isRegisterMode ? "Create Account" : "User Login"}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1 font-medium">
            {isRegisterMode ? "Sign up for a new account" : "Login to access your personal dashboard"}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-2 text-xs font-bold text-rose-600 text-left">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* User Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-left w-full">
          {isRegisterMode && (
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 sm:py-3 px-3.5 text-xs font-medium text-slate-800 outline-none focus:border-violet-500 focus:bg-white placeholder:text-slate-400 box-border"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1">
              Email Address
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
                placeholder="user@ablespace.io"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 sm:py-3 pl-8 sm:pl-9 pr-3 text-xs font-medium text-slate-800 outline-none focus:border-violet-500 focus:bg-white placeholder:text-slate-400 box-border"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-xs sm:text-sm">
                🔒
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
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
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 active:scale-98 transition-all mt-1"
          >
            {isRegisterMode ? "Create Account & Login" : "Sign In to User Dashboard"}
          </button>
        </form>

        {/* Toggle Register / Login */}
        <div className="pt-1 text-center text-[11px] sm:text-xs text-slate-400">
          <span>{isRegisterMode ? "Already have an account? " : "Don't have an account? "}</span>
          <button
            onClick={() => setIsRegisterMode(!isRegisterMode)}
            className="font-bold text-violet-600 hover:underline"
          >
            {isRegisterMode ? "Sign In" : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
