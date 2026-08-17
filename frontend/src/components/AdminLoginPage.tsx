"use client";

import { useState } from "react";
import { AuthUser, loginUser } from "@/utils/authStore";

interface AdminLoginPageProps {
  onAdminLoginSuccess: (admin: AuthUser) => void;
  onGoToUserLogin: () => void;
}

export function AdminLoginPage({ onAdminLoginSuccess, onGoToUserLogin }: AdminLoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter your admin email and password.");
      return;
    }

    setIsLoading(true);
    const res = await loginUser(email.trim(), password, rememberMe);
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || "Invalid admin credentials.");
      return;
    }

    const adminUser = res.user || {
      name: email.split("@")[0] || "Admin Evaluator",
      role: "Admin",
      email: email.trim(),
    };

    onAdminLoginSuccess(adminUser);
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 grid grid-cols-1 lg:grid-cols-12 font-sans overflow-x-hidden">
      {/* Left Side: Dark Hero Panel matching reference screenshot */}
      <div className="lg:col-span-6 bg-[#0b1329] p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden min-h-[400px] lg:min-h-screen">
        {/* Background glow graphics */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none"></div>

        {/* Header Branding */}
        <div className="text-center mt-6 z-10 space-y-3 max-w-md mx-auto">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600/20 border border-blue-500/40 shadow-xl shadow-blue-500/10">
            <svg
              className="h-10 w-10 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Admin Panel
          </h1>
          <p className="text-sm text-slate-300 font-medium">
            Secure access to manage your system and users.
          </p>
        </div>

        {/* Center Admin Dashboard Mockup Card matching screenshot */}
        <div className="my-8 z-10 max-w-lg mx-auto w-full">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/90 shadow-2xl p-4 md:p-5 backdrop-blur-md grid grid-cols-12 gap-3 text-left">
            {/* Mini Sidebar */}
            <div className="col-span-4 bg-[#080e1e] rounded-xl p-3 space-y-2 border border-slate-800 text-[11px] font-bold text-slate-400">
              <div className="flex items-center gap-2 text-white bg-blue-600 rounded-lg p-2 shadow-xs">
                <span>🛡️</span> <span>Dashboard</span>
              </div>
              <div className="flex items-center gap-2 p-2 hover:text-white">
                <span>👤</span> <span>Users</span>
              </div>
              <div className="flex items-center gap-2 p-2 hover:text-white">
                <span>📦</span> <span>Tasks</span>
              </div>
              <div className="flex items-center gap-2 p-2 hover:text-white">
                <span>📊</span> <span>Reports</span>
              </div>
              <div className="flex items-center gap-2 p-2 hover:text-white">
                <span>⚙️</span> <span>Settings</span>
              </div>
            </div>

            {/* Mini Dashboard Metrics Content */}
            <div className="col-span-8 space-y-3">
              <div className="text-[11px] font-bold text-slate-300 border-b border-slate-800 pb-1">
                Overview
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/50">
                  <span className="text-[9px] text-slate-400 block font-semibold">Users</span>
                  <span className="text-xs font-black text-white">1,245</span>
                  <span className="text-[9px] font-bold text-emerald-400 block">↑ 12%</span>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/50">
                  <span className="text-[9px] text-slate-400 block font-semibold">Tasks</span>
                  <span className="text-xs font-black text-white">856</span>
                  <span className="text-[9px] font-bold text-emerald-400 block">↑ 8%</span>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/50">
                  <span className="text-[9px] text-slate-400 block font-semibold">Revenue</span>
                  <span className="text-xs font-black text-white">₹45,231</span>
                  <span className="text-[9px] font-bold text-emerald-400 block">↑ 15%</span>
                </div>
              </div>

              {/* Chart line graphic */}
              <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-700/50 h-20 flex items-end justify-between gap-1">
                <div className="w-full bg-blue-500/30 rounded-t h-4"></div>
                <div className="w-full bg-blue-500/50 rounded-t h-8"></div>
                <div className="w-full bg-blue-500/40 rounded-t h-6"></div>
                <div className="w-full bg-blue-500/70 rounded-t h-12"></div>
                <div className="w-full bg-blue-500/90 rounded-t h-14"></div>
                <div className="w-full bg-blue-500 rounded-t h-16"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center z-10 text-xs text-slate-500">
          © 2026 AbleSpace. All rights reserved.
        </div>
      </div>

      {/* Right Side: Clean White Admin Login Form matching reference screenshot */}
      <div className="lg:col-span-6 bg-white p-6 sm:p-10 md:p-14 flex items-center justify-center min-h-[500px] lg:min-h-screen">
        <div className="w-full max-w-md space-y-6 text-center">
          {/* Top Blue User Icon Header */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-sm border border-blue-100">
            <svg
              className="h-8 w-8"
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
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Admin Login
            </h2>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              Please enter your credentials to continue
            </p>
          </div>

          {/* Error Notification */}
          {errorMessage && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-600 text-left">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Admin Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            {/* Username / Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Username / Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 text-sm">
                  👤
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter admin username or email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 text-sm">
                  🔒
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-10 pr-10 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span>Remember me</span>
              </label>

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Password reset instructions sent to admin email.");
                }}
                className="font-bold text-blue-600 hover:underline"
              >
                Forgot Password?
              </a>
            </div>

            {/* Primary Login Button */}
            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 active:scale-98 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>🔒</span>
              <span>Login</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="w-full border-t border-slate-200"></div>
            <span className="bg-white px-3 text-xs font-medium text-slate-400 absolute">
              or
            </span>
          </div>

          {/* Back to Website Button */}
          <button
            type="button"
            onClick={onGoToUserLogin}
            className="w-full rounded-xl border border-slate-200 bg-white py-3.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <span>←</span>
            <span>Back to Website</span>
          </button>
        </div>
      </div>
    </div>
  );
}
