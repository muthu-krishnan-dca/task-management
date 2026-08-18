import { NotificationItem, NotificationType } from "@/types/notification";
import { Task } from "@/types/task";
import { getAppSettings } from "./settingsStore";
import { getAuthUser } from "./authStore";

export function getNotificationStorageKey(): string {
  if (typeof window === "undefined") return "ablespace_notifications";
  try {
    const user = getAuthUser();
    if (user && user.email) {
      return `ablespace_notifications_${user.email.toLowerCase().trim()}`;
    }
  } catch {}
  return "ablespace_notifications_guest";
}

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
    const key = getNotificationStorageKey();
    const raw = localStorage.getItem(key);
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
    const key = getNotificationStorageKey();
    const deduplicated = deduplicateNotifications(notifications).slice(0, 50);
    localStorage.setItem(key, JSON.stringify(deduplicated));
    window.dispatchEvent(new Event("notificationsUpdated"));
  } catch (error) {
    console.error("Failed to save notifications to localStorage", error);
  }
}

// Soft Web Audio synthesized notification chime
export function playNotificationChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";

    // Pleasant two-tone chime (D5 -> A5)
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    osc2.frequency.setValueAtTime(880, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.28);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.15);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);
  } catch (err) {
    // Audio context may be restricted by browser until user interaction
  }
}

// Request Browser Desktop Push Notification Permission
export async function requestDesktopNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  try {
    if (Notification.permission === "granted") return true;
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return false;
  } catch {
    return false;
  }
}

// Send Real Desktop OS Notification
export function sendDesktopNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  try {
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
      });
    }
  } catch {}
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

  // Play real chime sound
  playNotificationChime();

  // Send real desktop notification if enabled
  sendDesktopNotification(params.title, params.message);

  // Dispatch custom event for real-time floating toaster
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("newNotificationReceived", { detail: newNotification })
    );
  }

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

// Check and generate overdue and due soon alerts strictly WITHOUT duplicate creation & auto-clean completed tasks
export function syncSystemTaskNotifications(tasks: Task[]): void {
  if (!Array.isArray(tasks)) return;
  if (typeof window === "undefined") return;

  const settings = getAppSettings();
  let current = getStoredNotifications();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Set of completed task IDs to clean up any obsolete overdue/due-soon alerts
  const completedTaskIds = new Set(
    tasks.filter((t) => t.status === "COMPLETED").map((t) => t.id)
  );

  // Clean up alerts for completed tasks
  const beforeCount = current.length;
  current = current.filter((n) => {
    if (
      (n.type === "TASK_OVERDUE" || n.type === "TASK_DUE_SOON") &&
      n.taskId &&
      completedTaskIds.has(n.taskId)
    ) {
      return false;
    }
    return true;
  });

  let hasNew = beforeCount !== current.length;
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
