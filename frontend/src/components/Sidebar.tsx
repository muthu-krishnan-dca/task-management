"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DEFAULT_USER, getUserProfile, UserProfile } from "@/utils/userStore";
import { getAuthUser, logoutUser } from "@/utils/authStore";

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
    const authUser = getAuthUser();
    if (authUser) {
      setProfile({
        name: authUser.name,
        email: authUser.email,
        role: authUser.role === "Admin" ? "Administrator" : authUser.role,
        phone: authUser.phone || "",
        avatarUrl: authUser.avatarUrl || "",
      });
    } else {
      setProfile(getUserProfile());
    }

    const handleUpdate = () => {
      const currentAuth = getAuthUser();
      if (currentAuth) {
        setProfile({
          name: currentAuth.name,
          email: currentAuth.email,
          role: currentAuth.role === "Admin" ? "Administrator" : currentAuth.role,
          phone: currentAuth.phone || "",
          avatarUrl: currentAuth.avatarUrl || "",
        });
      } else {
        setProfile(getUserProfile());
      }
    };
    const handleToggle = () => setMobileOpen((prev) => !prev);
    const handleClose = () => setMobileOpen(false);

    window.addEventListener("userProfileUpdated", handleUpdate);
    window.addEventListener("authChanged", handleUpdate);
    window.addEventListener("toggleMobileSidebar", handleToggle);
    window.addEventListener("closeMobileSidebar", handleClose);

    return () => {
      window.removeEventListener("userProfileUpdated", handleUpdate);
      window.removeEventListener("authChanged", handleUpdate);
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

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      logoutUser("/login");
    }
  };

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
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isDashboard
                  ? "bg-gray-100 dark:bg-gray-800 font-semibold text-gray-900 dark:text-white"
                  : "font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center text-sm">
                📊
              </span>
              <span>Dashboard</span>
            </Link>

            {/* Tasks */}
            <Link
              href="/tasks"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isTasks
                  ? "bg-gray-100 dark:bg-gray-800 font-semibold text-gray-900 dark:text-white"
                  : "font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center text-sm">
                📋
              </span>
              <span>Tasks</span>
            </Link>

            {/* Calendar */}
            <Link
              href="/calendar"
              onClick={() => setMobileOpen(false)}
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
              onClick={() => setMobileOpen(false)}
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
          </div>

          <p className="mt-6 mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Account & System
          </p>

          <div className="space-y-1">
            {/* Admin Console (visible to Admin) */}
            {(profile.role === "Administrator" || profile.role === "Admin") && (
              <Link
                href="/admin/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-amber-600 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100 transition-colors"
              >
                <span className="flex h-5 w-5 items-center justify-center text-sm">
                  👑
                </span>
                <span>Admin Dashboard</span>
              </Link>
            )}

            {/* Profile */}
            <Link
              href="/profile"
              onClick={() => setMobileOpen(false)}
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
              onClick={() => setMobileOpen(false)}
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

        {/* User Footer with Profile Link and Logout Button */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-3 bg-gray-50/50 dark:bg-gray-900/40">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/profile"
              className="flex items-center gap-2.5 min-w-0 flex-1 rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white overflow-hidden">
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

              <div className="min-w-0 flex-1" suppressHydrationWarning>
                <p suppressHydrationWarning className="truncate text-xs font-semibold text-gray-900 dark:text-white leading-snug">
                  {displayName}
                </p>
                <p suppressHydrationWarning className="truncate text-[10px] text-gray-500 dark:text-gray-400">
                  {profile.role || "User"}
                </p>
              </div>
            </Link>

            {/* Logout Action Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:border-rose-200 dark:hover:border-rose-800 transition-colors shadow-2xs cursor-pointer"
              title="Log out of account"
              aria-label="Log out"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}