"use client";

import { useEffect, useRef, useState } from "react";
import { NotificationItem, NotificationType } from "@/types/notification";
import {
  getStoredNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/utils/notificationStore";
import Link from "next/link";

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    setNotifications(getStoredNotifications());
  };

  useEffect(() => {
    loadNotifications();

    const handleUpdate = () => {
      loadNotifications();
    };

    window.addEventListener("notificationsUpdated", handleUpdate);
    return () => {
      window.removeEventListener("notificationsUpdated", handleUpdate);
    };
  }, []);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const recentNotifications = notifications.slice(0, 5);

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markNotificationAsRead(id);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "TASK_CREATED":
        return "🆕";
      case "TASK_UPDATED":
        return "✏️";
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

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSecs < 60) return "Just now";
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
      if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative flex h-8.5 w-8.5 items-center justify-center rounded-lg border text-xs transition ${
          isOpen
            ? "border-gray-900 dark:border-white bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
        }`}
        title="Notifications"
        aria-label="Notifications"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-xs animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-2xl border border-gray-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-indigo-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {recentNotifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                <div className="text-2xl mb-1">🔔</div>
                <p className="font-semibold text-gray-700">No notifications</p>
                <p className="mt-0.5 text-[11px]">You're all caught up!</p>
              </div>
            ) : (
              recentNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!item.read) markNotificationAsRead(item.id);
                  }}
                  className={`flex items-start justify-between gap-3 p-3 text-xs transition cursor-pointer ${
                    !item.read
                      ? "bg-indigo-50/40 hover:bg-indigo-50/70"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="mt-0.5 text-sm">{getTypeIcon(item.type)}</span>
                    <div className="min-w-0">
                      <p
                        className={`truncate text-xs ${
                          !item.read
                            ? "font-bold text-gray-900"
                            : "font-medium text-gray-700"
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="line-clamp-2 text-[11px] text-gray-500 mt-0.5">
                        {item.message}
                      </p>
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  {!item.read && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(item.id, e)}
                      className="rounded p-1 text-[11px] text-gray-400 hover:text-indigo-600 shrink-0"
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50/60 p-2.5 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              View all notifications ({notifications.length}) →
            </Link>
          </div>

        </div>
      )}
    </div>
  );
}
