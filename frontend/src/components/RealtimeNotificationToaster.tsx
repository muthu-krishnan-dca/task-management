"use client";

import { useEffect, useState } from "react";
import { NotificationItem, NotificationType } from "@/types/notification";
import {
  markNotificationAsRead,
  requestDesktopNotificationPermission,
} from "@/utils/notificationStore";

export function RealtimeNotificationToaster() {
  const [activeToasts, setActiveToasts] = useState<NotificationItem[]>([]);
  const [showDesktopPrompt, setShowDesktopPrompt] = useState(false);

  useEffect(() => {
    // Check if desktop notification permission is default (can prompt)
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      // Show desktop permission prompt after 3 seconds
      const timer = setTimeout(() => setShowDesktopPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleNewNotification = (e: any) => {
      const item: NotificationItem = e.detail;
      if (!item) return;

      setActiveToasts((prev) => {
        // Prevent duplicate toasts
        if (prev.some((t) => t.id === item.id)) return prev;
        return [item, ...prev.slice(0, 3)]; // Keep max 4 concurrent toasts
      });

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setActiveToasts((prev) => prev.filter((t) => t.id !== item.id));
      }, 6000);
    };

    window.addEventListener("newNotificationReceived", handleNewNotification);
    return () => {
      window.removeEventListener("newNotificationReceived", handleNewNotification);
    };
  }, []);

  const handleDismiss = (id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToastClick = (toast: NotificationItem) => {
    markNotificationAsRead(toast.id);
    handleDismiss(toast.id);
  };

  const handleEnableDesktop = async () => {
    const granted = await requestDesktopNotificationPermission();
    setShowDesktopPrompt(false);
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "SYSTEM_ANNOUNCEMENT":
      case "ADMIN_BROADCAST":
        return "📢";
      case "TASK_CREATED":
        return "🆕";
      case "TASK_COMPLETED":
        return "✅";
      case "STATUS_CHANGED":
        return "🔄";
      case "TASK_OVERDUE":
        return "⚠️";
      case "TASK_DUE_SOON":
        return "📅";
      default:
        return "🔔";
    }
  };

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {/* Optional Desktop Notification Permission Banner */}
      {showDesktopPrompt && (
        <div className="pointer-events-auto rounded-2xl border border-blue-200 bg-white/95 dark:bg-slate-900/95 dark:border-blue-900/50 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-3 duration-300">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-bold text-base shrink-0">
              🔔
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-xs font-black text-slate-900 dark:text-white">
                Enable Desktop Notifications?
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Receive instant real-time alerts when tasks are assigned, completed, or broadcasted.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleEnableDesktop}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-blue-700 transition"
                >
                  Enable Real Alerts
                </button>
                <button
                  type="button"
                  onClick={() => setShowDesktopPrompt(false)}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 transition"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Active Notifications */}
      {activeToasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => handleToastClick(toast)}
          className="pointer-events-auto group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 cursor-pointer transition-all hover:scale-[1.02] animate-in slide-in-from-right-4 duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-slate-800 shrink-0">
              {getTypeIcon(toast.type)}
            </div>

            <div className="flex-1 pr-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {toast.title}
                </h4>
                <span className="text-[9px] font-mono text-slate-400">Just now</span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss(toast.id);
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold p-1 rounded-md"
            >
              ✕
            </button>
          </div>

          {/* Progress bar line */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600/30">
            <div className="h-full bg-blue-600 animate-[progress_6s_linear_forwards]"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
