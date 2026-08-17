"use client";

import { useState } from "react";
import { AuthUser, loginUser, registerUser } from "@/utils/authStore";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import Link from "next/link";

interface UserLoginPageProps {
  initialMode?: "login" | "register";
  onUserLoginSuccess?: (user: AuthUser) => void;
  onGoToAdminLogin?: () => void;
}

export function UserLoginPage({
  initialMode = "login",
  onUserLoginSuccess,
  onGoToAdminLogin,
}: UserLoginPageProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(initialMode === "register");
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Please enter your password.");
      return;
    }

    if (isRegisterMode) {
      if (!name.trim()) {
        setErrorMessage("Please enter your full name.");
        return;
      }

      if (password.length < 4) {
        setErrorMessage("Password must be at least 4 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match. Please re-enter.");
        return;
      }

      setIsLoading(true);
      const res = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
        role: "User",
      });
      setIsLoading(false);

      if (!res.success) {
        setErrorMessage(res.error || "Registration failed. Please try again.");
        return;
      }

      setSuccessMessage("Account created successfully! Logging you in...");
      setTimeout(() => {
        if (res.user && onUserLoginSuccess) {
          onUserLoginSuccess(res.user);
        } else {
          window.location.href = "/Dashboard";
        }
      }, 600);
      return;
    }

    // Login Flow
    setIsLoading(true);
    const res = await loginUser(email.trim(), password, rememberMe);
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || "Invalid email or password.");
      return;
    }

    if (res.user && onUserLoginSuccess) {
      onUserLoginSuccess(res.user);
    } else {
      window.location.href = "/Dashboard";
    }
  };

  const handleGuestQuickLogin = async () => {
    setIsLoading(true);
    const res = await loginUser("guest@ablespace.io", "guest", true);
    setIsLoading(false);

    if (res.user && onUserLoginSuccess) {
      onUserLoginSuccess(res.user);
    } else {
      window.location.href = "/Dashboard";
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-100/80 via-indigo-50/60 to-slate-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 text-slate-900 dark:text-white flex items-center justify-center p-3 sm:p-6 font-sans box-border overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-5 left-5 h-48 w-48 sm:h-72 sm:w-72 rounded-full bg-purple-300/30 dark:bg-purple-900/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-5 right-5 h-48 w-48 sm:h-80 sm:w-80 rounded-full bg-indigo-300/30 dark:bg-indigo-900/20 blur-3xl pointer-events-none"></div>

      {/* User Login / Register Card */}
      <div className="w-[92%] max-w-[400px] rounded-2xl sm:rounded-[32px] bg-white dark:bg-gray-800 p-5 sm:p-8 shadow-2xl border border-purple-100/50 dark:border-gray-700 z-10 space-y-4 text-center my-auto mx-auto box-border flex flex-col justify-center">
        {/* Top Logo Avatar */}
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
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isRegisterMode ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 dark:text-gray-400 mt-1 font-medium">
            {isRegisterMode
              ? "Register to start managing your tasks and projects"
              : "Login to your workspace account to continue"}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 rounded-xl bg-slate-100 dark:bg-gray-700 p-1 text-[11px] sm:text-xs font-bold w-full">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={`rounded-lg py-1.5 transition-all truncate cursor-pointer ${
              !isRegisterMode
                ? "bg-white dark:bg-gray-800 text-violet-700 dark:text-violet-400 shadow-xs"
                : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            🔑 Login
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={`rounded-lg py-1.5 transition-all truncate cursor-pointer ${
              isRegisterMode
                ? "bg-white dark:bg-gray-800 text-violet-700 dark:text-violet-400 shadow-xs"
                : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            ✨ Register
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 p-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 text-left animate-in fade-in">
            ⚠️ {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 text-left animate-in fade-in">
            ✅ {successMessage}
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-left w-full">
          {isRegisterMode && (
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/60 py-2 sm:py-2.5 px-3 text-xs font-medium text-slate-800 dark:text-white outline-none focus:border-violet-500 focus:bg-white dark:focus:bg-gray-900 placeholder:text-slate-400 box-border"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-gray-300 mb-1">
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
                className="w-full rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/60 py-2 sm:py-2.5 pl-8 sm:pl-9 pr-3 text-xs font-medium text-slate-800 dark:text-white outline-none focus:border-violet-500 focus:bg-white dark:focus:bg-gray-900 placeholder:text-slate-400 box-border"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-gray-300 mb-1">
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
                className="w-full rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/60 py-2 sm:py-2.5 pl-8 sm:pl-9 pr-8 sm:pr-9 text-xs font-medium text-slate-800 dark:text-white outline-none focus:border-violet-500 focus:bg-white dark:focus:bg-gray-900 placeholder:text-slate-400 box-border"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 sm:pr-3 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {isRegisterMode && (
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-xs sm:text-sm">
                  🛡️
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password..."
                  className="w-full rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/60 py-2 sm:py-2.5 pl-8 sm:pl-9 pr-3 text-xs font-medium text-slate-800 dark:text-white outline-none focus:border-violet-500 focus:bg-white dark:focus:bg-gray-900 placeholder:text-slate-400 box-border"
                />
              </div>
            </div>
          )}

          {!isRegisterMode && (
            <div className="flex items-center justify-between text-[11px]">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded-sm border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="font-semibold text-violet-600 dark:text-violet-400 hover:underline text-[11px] cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 active:scale-98 transition-all mt-1 cursor-pointer disabled:opacity-70"
          >
            {isLoading
              ? "Please wait..."
              : isRegisterMode
              ? "Create Account & Login"
              : "Login"}
          </button>
        </form>

        {/* Quick guest demo & Admin link */}
        <div className="pt-2 border-t border-slate-100 dark:border-gray-700 flex flex-col gap-2 text-center text-[11px] sm:text-xs text-slate-400 dark:text-gray-400">
          <div className="flex items-center justify-center gap-2">
            <span>Or test as: </span>
            <button
              type="button"
              onClick={handleGuestQuickLogin}
              className="font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
            >
              Guest Demo
            </button>
            <span>•</span>
            <Link
              href="/admin/login"
              className="font-bold text-slate-700 dark:text-gray-300 hover:underline cursor-pointer"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <ForgotPasswordModal
          initialEmail={email}
          onClose={() => setShowForgotModal(false)}
          onSuccess={(resetEmail, newPass) => {
            setEmail(resetEmail);
            setPassword(newPass);
            setSuccessMessage("Password reset successfully! Click Login to enter.");
          }}
        />
      )}
    </div>
  );
}

export default UserLoginPage;
