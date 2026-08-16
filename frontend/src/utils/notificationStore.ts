import { NotificationItem, NotificationType } from "@/types/notification";
import { Task } from "@/types/task";
import { getAppSettings } from "./settingsStore";

const STORAGE_KEY = "ablespace_notifications";

// Deduplicate notifications list
export function deduplicateNotifications(
  list: NotificationItem[]
): NotificationItem[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();

  return list.filter((item) => {
    if (!item) return false;
    // For system alerts (Overdue / Due soon), allow only 1 notification per task
    if (item.type === "TASK_OVERDUE" || item.type === "TASK_DUE_SOON") {
      const alertKey = `${item.type}_${item.taskId || item.title}`;
      if (seen.has(alertKey)) return false;
      seen.add(alertKey);
      return true;
    }

    // For user actions (Created, Updated, Completed, Status), deduplicate if same title & type within 1 minute
    const actionKey = `${item.type}_${item.taskId || item.title}_${(
      item.createdAt || ""
    ).slice(0, 16)}`;
    if (seen.has(actionKey)) return false;
    seen.add(actionKey);
    return true;
  });
}

export function getStoredNotifications(): NotificationItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return deduplicateNotifications(parsed);
  } catch (error) {
    console.error("Failed to parse notifications from localStorage", error);
    return [];
  }
}

export function saveStoredNotifications(
  notifications: NotificationItem[]
): void {
  if (typeof window === "undefined") return;
  try {
    const deduplicated = deduplicateNotifications(notifications).slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deduplicated));
    window.dispatchEvent(new Event("notificationsUpdated"));
  } catch (error) {
    console.error("Failed to save notifications to localStorage", error);
  }
}

export function createNotification(params: {
  title: string;
  message: string;
  type: NotificationType;
  taskId?: string;
}): NotificationItem {
  const settings = getAppSettings();

  // If user disabled task updates notification and this is an action notification, skip creation
  if (!settings.notifTaskUpdates && (params.type === "TASK_CREATED" || params.type === "TASK_UPDATED" || params.type === "TASK_COMPLETED" || params.type === "STATUS_CHANGED")) {
    return {
      id: `skipped_${Date.now()}`,
      title: params.title,
      message: params.message,
      type: params.type,
      taskId: params.taskId,
      createdAt: new Date().toISOString(),
      read: true,
    };
  }

  const existing = getStoredNotifications();

  // Prevent duplicate creation within 3 seconds for the same task & type
  const isDuplicate = existing.some((n) => {
    if (n.type !== params.type) return false;
    const sameTask = params.taskId && n.taskId === params.taskId;
    const sameTitle = n.title === params.title;
    const isRecent =
      Date.now() - new Date(n.createdAt).getTime() < 3000;
    return (sameTask || sameTitle) && isRecent;
  });

  if (isDuplicate && existing.length > 0) {
    return existing[0];
  }

  const newNotification: NotificationItem = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: params.title,
    message: params.message,
    type: params.type,
    taskId: params.taskId,
    createdAt: new Date().toISOString(),
    read: false,
  };

  const updated = [newNotification, ...existing];
  saveStoredNotifications(updated);
  return newNotification;
}

export function markNotificationAsRead(id: string): void {
  const current = getStoredNotifications();
  const updated = current.map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  saveStoredNotifications(updated);
}

export function markAllNotificationsAsRead(): void {
  const current = getStoredNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  saveStoredNotifications(updated);
}

export function deleteNotification(id: string): void {
  const current = getStoredNotifications();
  const updated = current.filter((n) => n.id !== id);
  saveStoredNotifications(updated);
}

export function clearAllNotifications(): void {
  saveStoredNotifications([]);
}

// Check and generate overdue and due soon alerts strictly WITHOUT duplicate creation
export function syncSystemTaskNotifications(tasks: Task[]): void {
  if (!Array.isArray(tasks) || tasks.length === 0) return;
  if (typeof window === "undefined") return;

  const settings = getAppSettings();
  const current = getStoredNotifications();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let hasNew = false;
  const newNotifs: NotificationItem[] = [];

  tasks.forEach((task) => {
    if (!task || !task.dueDate || task.dueDate === "No due date") return;
    if (task.status === "COMPLETED") return;

    const dueDate = new Date(task.dueDate);
    if (isNaN(dueDate.getTime())) return;

    const dueDateMidnight = new Date(dueDate);
    dueDateMidnight.setHours(0, 0, 0, 0);

    // 1. Check Overdue (only if enabled in settings)
    if (settings.notifOverdueAlerts && dueDateMidnight < today) {
      // Check if an overdue notification ALREADY exists for this taskId or title
      const alreadyNotified =
        current.some(
          (n) =>
            n.type === "TASK_OVERDUE" &&
            (n.taskId === task.id || n.title.includes(task.title))
        ) ||
        newNotifs.some(
          (n) =>
            n.type === "TASK_OVERDUE" &&
            (n.taskId === task.id || n.title.includes(task.title))
        );

      if (!alreadyNotified) {
        newNotifs.push({
          id: `notif_overdue_${task.id}`,
          title: `⚠️ Task Overdue: "${task.title}"`,
          message: `This task was due on ${task.dueDate} and is still pending.`,
          type: "TASK_OVERDUE",
          taskId: task.id,
          createdAt: new Date().toISOString(),
          read: false,
        });
        hasNew = true;
      }
    }
    // 2. Check Due Soon (only if enabled in settings)
    else if (
      settings.notifDueDateReminders &&
      (dueDateMidnight.getTime() === today.getTime() ||
        dueDateMidnight.getTime() === tomorrow.getTime())
    ) {
      const alreadyNotified =
        current.some(
          (n) =>
            n.type === "TASK_DUE_SOON" &&
            (n.taskId === task.id || n.title.includes(task.title))
        ) ||
        newNotifs.some(
          (n) =>
            n.type === "TASK_DUE_SOON" &&
            (n.taskId === task.id || n.title.includes(task.title))
        );

      if (!alreadyNotified) {
        const isToday = dueDateMidnight.getTime() === today.getTime();
        newNotifs.push({
          id: `notif_duesoon_${task.id}`,
          title: `📅 Task Due Soon: "${task.title}"`,
          message: isToday
            ? `This task is due today (${task.dueDate})!`
            : `This task is due tomorrow (${task.dueDate}).`,
          type: "TASK_DUE_SOON",
          taskId: task.id,
          createdAt: new Date().toISOString(),
          read: false,
        });
        hasNew = true;
      }
    }
  });

  if (hasNew) {
    const updated = [...newNotifs, ...current];
    saveStoredNotifications(updated);
  }
}
