"use client";

import { useState } from "react";

interface LoginModalProps {
  onLogin: (user: { name: string; role: "Admin" | "Guest"; email: string }) => void;
  onClose: () => void;
}

export function LoginModal({ onLogin, onClose }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<"admin" | "guest">("admin");

  // Form states
  const [adminEmail, setAdminEmail] = useState("admin@ablespace.io");
  const [adminPassword, setAdminPassword] = useState("••••••••");

  const [guestName, setGuestName] = useState("Guest Evaluator");
  const [guestEmail, setGuestEmail] = useState("guest@ablespace.io");

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({
      name: "Admin Evaluator",
      role: "Admin",
      email: adminEmail,
    });
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({
      name: guestName || "Guest Evaluator",
      role: "Guest",
      email: guestEmail,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
        >
          ✕
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl overflow-hidden shadow-md">
            <img src="/logo.png" alt="Task Management Logo" className="h-full w-full object-cover" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Task Management Portal</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select your login role to access the Task Management System
          </p>
        </div>

        {/* Tab Switcher: Admin Login vs Guest Login */}
        <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800 mb-6">
          <button
            onClick={() => setActiveTab("admin")}
            className={`rounded-xl py-2.5 text-xs font-extrabold transition-all ${
              activeTab === "admin"
                ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            👑 Admin Login
          </button>
          <button
            onClick={() => setActiveTab("guest")}
            className={`rounded-xl py-2.5 text-xs font-extrabold transition-all ${
              activeTab === "guest"
                ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            👤 Guest User Login
          </button>
        </div>

        {/* Admin Login Form */}
        {activeTab === "admin" ? (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div className="rounded-xl bg-amber-50 p-3 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
              🛡️ Administrator Portal: Grants full system management rights.
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-amber-600 py-3 text-xs font-bold text-white shadow-md hover:bg-amber-700 active:scale-98 transition-all"
            >
              ⚡ Login as Administrator
            </button>
          </form>
        ) : (
          /* Guest User Login Form */
          <form onSubmit={handleGuestSubmit} className="space-y-4">
            <div className="rounded-xl bg-blue-50 p-3 text-[11px] font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              🚀 Guest Portal: Instant evaluator onboarding without password.
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Your Display Name
              </label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-98 transition-all"
            >
              🚀 Enter as Guest Evaluator
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
