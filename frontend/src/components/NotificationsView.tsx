"use client";

import { useEffect, useState } from "react";
import { NotificationItem, NotificationType } from "@/types/notification";
import {
  clearAllNotifications,
  deleteNotification,
  getStoredNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/utils/notificationStore";
import Link from "next/link";

interface NotificationsViewProps {
  onSelectTask?: (taskId: string) => void;
}

export function NotificationsView({ onSelectTask }: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filterTab, setFilterTab] = useState<"ALL" | "UNREAD" | "ALERTS">("ALL");

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

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    markNotificationAsRead(id);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    deleteNotification(id);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all notifications?")) {
      clearAllNotifications();
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.read) {
      markNotificationAsRead(item.id);
    }
    if (item.taskId && onSelectTask) {
      onSelectTask(item.taskId);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterTab === "UNREAD") return !n.read;
    if (filterTab === "ALERTS")
      return n.type === "TASK_OVERDUE" || n.type === "TASK_DUE_SOON";
    return true;
  });

  const getTypeBadge = (type: NotificationType) => {
    switch (type) {
      case "TASK_CREATED":
        return {
          icon: "🆕",
          label: "Created",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "TASK_UPDATED":
        return {
          icon: "✏️",
          label: "Updated",
          bg: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "TASK_COMPLETED":
        return {
          icon: "✅",
          label: "Completed",
          bg: "bg-green-50 text-green-700 border-green-200",
        };
      case "STATUS_CHANGED":
        return {
          icon: "🔄",
          label: "Status",
          bg: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "TASK_OVERDUE":
        return {
          icon: "⚠️",
          label: "Overdue",
          bg: "bg-red-50 text-red-700 border-red-200",
        };
      case "TASK_DUE_SOON":
        return {
          icon: "📅",
          label: "Due Soon",
          bg: "bg-orange-50 text-orange-700 border-orange-200",
        };
      default:
        return {
          icon: "✉️",
          label: "Info",
          bg: "bg-gray-50 text-gray-700 border-gray-200",
        };
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
      if (diffSecs < 604800) return `${Math.floor(diffSecs / 86400)}d ago`;

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Real-time activity logs, task updates, overdue alerts, and deadlines.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Mark all as read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded-lg border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100/60 transition"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center border-b border-gray-100 bg-gray-50/70 px-6 py-2 gap-2 text-xs">
        <button
          type="button"
          onClick={() => setFilterTab("ALL")}
          className={`rounded-lg px-3 py-1.5 font-semibold transition ${
            filterTab === "ALL"
              ? "bg-white text-gray-900 shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          All ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterTab("UNREAD")}
          className={`rounded-lg px-3 py-1.5 font-semibold transition ${
            filterTab === "UNREAD"
              ? "bg-white text-red-700 shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Unread ({unreadCount})
        </button>

        <button
          type="button"
          onClick={() => setFilterTab("ALERTS")}
          className={`rounded-lg px-3 py-1.5 font-semibold transition ${
            filterTab === "ALERTS"
              ? "bg-white text-amber-700 shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Alerts & Deadlines
        </button>
      </div>

      {/* Notification List */}
      <div className="divide-y divide-gray-100">
        {filteredNotifications.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl">🔔</div>
            <p className="mt-3 text-sm font-semibold text-gray-800">
              No notifications here
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {filterTab === "UNREAD"
                ? "You've read all your notifications. Great job!"
                : "You're all caught up! Updates and alerts will appear here."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const badge = getTypeBadge(item.type);

            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`group flex items-start justify-between gap-4 px-6 py-4 transition-colors cursor-pointer ${
                  !item.read
                    ? "bg-indigo-50/30 hover:bg-indigo-50/50"
                    : "hover:bg-gray-50/80"
                }`}
              >
                {/* Left content */}
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Unread indicator dot */}
                  <div className="mt-1.5 flex h-2 w-2 shrink-0 items-center justify-center">
                    {!item.read && (
                      <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${badge.bg}`}
                      >
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                      </span>

                      <h3
                        className={`text-xs ${
                          !item.read
                            ? "font-bold text-gray-900"
                            : "font-medium text-gray-700"
                        }`}
                      >
                        {item.title}
                      </h3>
                    </div>

                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-400">
                      <span>{formatRelativeTime(item.createdAt)}</span>
                      {item.taskId && (
                        <Link
                          href="/"
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-indigo-600 hover:underline"
                        >
                          View Task →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right quick actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                  {!item.read && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(item.id, e)}
                      className="rounded p-1.5 text-xs text-gray-400 hover:bg-white hover:text-indigo-600 hover:shadow-xs transition"
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleDelete(item.id, e)}
                    className="rounded p-1.5 text-xs text-gray-400 hover:bg-white hover:text-red-600 hover:shadow-xs transition"
                    title="Delete notification"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
