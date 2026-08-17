export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  dueTime?: string;
  estimatedTime?: string;
  project?: string;
  assignedTo?: string;
  assignee?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VisibleFields {
  description: boolean;
  assignee: boolean;
  dueDate: boolean;
  priority: boolean;
  project: boolean;
  status: boolean;
}

export const defaultVisibleFields: VisibleFields = {
  description: true,
  assignee: true,
  dueDate: true,
  priority: true,
  project: true,
  status: true,
};
