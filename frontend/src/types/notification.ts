export type NotificationType =
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_COMPLETED"
  | "STATUS_CHANGED"
  | "TASK_OVERDUE"
  | "TASK_DUE_SOON"
  | "SYSTEM_ANNOUNCEMENT"
  | "ADMIN_BROADCAST";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  taskId?: string;
  createdAt: string;
  read: boolean;
  target?: string;
}
