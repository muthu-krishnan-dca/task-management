"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DEFAULT_USER, getUserProfile, UserProfile } from "@/utils/userStore";

interface SidebarProps {
  darkMode?: boolean;
  activeView?: string;
  onViewChange?: (view: any) => void;
  currentUser?: {
    name: string;
    role: string;
    email: string;
  };
  onOpenLoginModal?: () => void;
}

export default function Sidebar({
  currentUser,
}: SidebarProps = {}) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setProfile(getUserProfile());

    const handleUpdate = () => {
      setProfile(getUserProfile());
    };
    const handleToggle = () => setMobileOpen((prev) => !prev);
    const handleClose = () => setMobileOpen(false);

    window.addEventListener("userProfileUpdated", handleUpdate);
    window.addEventListener("toggleMobileSidebar", handleToggle);
    window.addEventListener("closeMobileSidebar", handleClose);

    return () => {
      window.removeEventListener("userProfileUpdated", handleUpdate);
      window.removeEventListener("toggleMobileSidebar", handleToggle);
      window.removeEventListener("closeMobileSidebar", handleClose);
    };
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isDashboard = pathname.toLowerCase().includes("dashboard");
  const isTasks =
    pathname === "/" ||
    pathname.toLowerCase().includes("/tasks");
  const isProfile = pathname.toLowerCase().includes("profile");
  const isSettings = pathname.toLowerCase().includes("settings");

  const displayName = currentUser?.name || profile.name;
  const displayEmail = currentUser?.email || profile.email;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Logo & Close Button for Mobile */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black dark:bg-indigo-600 text-sm font-bold text-white shadow-xs">
              A
            </div>

            <div>
              <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
                AbleSpace
              </h1>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Workspace
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Workspace
          </p>

          <div className="space-y-1">
            {/* Dashboard */}
            <Link
              href="/Dashboard"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isDashboard
                  ? "bg-gray-100 dark:bg-gray-800 font-semibold text-gray-900 dark:text-white"
                  : "font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center text-sm">
                ▦
              </span>
              <span>Dashboard</span>
            </Link>

            {/* Tasks */}
            <Link
              href="/"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isTasks
                  ? "bg-gray-100 dark:bg-gray-800 font-semibold text-gray-900 dark:text-white"
                  : "font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center text-sm">
                ✓
              </span>
              <span>Tasks</span>
            </Link>

            {/* Calendar */}
            <Link
              href="/calendar"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                pathname.toLowerCase().includes("calendar")
                  ? "bg-gray-100 dark:bg-gray-800 font-semibold text-gray-900 dark:text-white"
                  : "font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center text-sm">
                📅
              </span>
              <span>Calendar</span>
            </Link>

            {/* Notifications */}
            <Link
              href="/notifications"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                pathname.toLowerCase().includes("notifications")
                  ? "bg-gray-100 dark:bg-gray-800 font-semibold text-gray-900 dark:text-white"
                  : "font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center text-sm">
                🔔
              </span>
              <span>Notifications</span>
            </Link>

            {/* Profile */}
            <Link
              href="/profile"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isProfile
                  ? "bg-gray-100 dark:bg-gray-800 font-semibold text-gray-900 dark:text-white"
                  : "font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center text-sm">
                👤
              </span>
              <span>Profile</span>
            </Link>

            {/* Settings */}
            <Link
              href="/settings"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isSettings
                  ? "bg-gray-100 dark:bg-gray-800 font-semibold text-gray-900 dark:text-white"
                  : "font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center text-sm">
                ⚙️
              </span>
              <span>Settings</span>
            </Link>
          </div>
        </nav>

        {/* User Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-lg p-1 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white overflow-hidden">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                displayName?.charAt(0).toUpperCase() || "U"
              )}
            </div>

            <div className="min-w-0" suppressHydrationWarning>
              <p suppressHydrationWarning className="truncate text-xs font-semibold text-gray-900 dark:text-white">
                {displayName}
              </p>
              <p suppressHydrationWarning className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                {displayEmail}
              </p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}