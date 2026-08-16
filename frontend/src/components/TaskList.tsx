"use client";

import { Task, TaskStatus } from "@/types/task";

interface TaskListProps {
  tasks: Task[];
  filteredTasks: Task[];
  activeTab: "ALL" | TaskStatus | "OVERDUE";
  todoCount: number;
  progressCount: number;
  completedCount: number;
  onHoldCount?: number;
  overdueCount?: number;
  isLoading: boolean;
  userRole?: "Admin" | "Guest";
  onTabChange: (tab: "ALL" | TaskStatus | "OVERDUE") => void;
  onRefresh: () => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask?: (task: Task) => void;
  onOpenLoginModal?: () => void;
}

export function TaskList({
  tasks,
  filteredTasks,
  activeTab,
  todoCount,
  progressCount,
  completedCount,
  onHoldCount = 0,
  overdueCount = 0,
  isLoading,
  userRole = "Guest",
  onTabChange,
  onRefresh,
  onStatusChange,
  onDeleteTask,
  onEditTask,
  onOpenLoginModal,
}: TaskListProps) {
  const isAdmin = userRole === "Admin";

  const handleProtectedStatusChange = (
    taskId: string,
    newStatus: TaskStatus
  ) => {
    if (!isAdmin) {
      if (
        confirm(
          "Admin Permission Required.\n\nGuest users have Read-Only access."
        )
      ) {
        onOpenLoginModal?.();
      }
      return;
    }

    onStatusChange(taskId, newStatus);
  };

  const handleDelete = (taskId: string) => {
    if (!isAdmin) {
      alert("Admin permission required.");
      return;
    }

    if (confirm("Are you sure you want to delete this task?")) {
      onDeleteTask(taskId);
    }
  };

  const isOverdue = (task: Task) => {
    if (!task.dueDate) return false;
    if (task.status === "COMPLETED") return false;

    const due = new Date(task.dueDate);
    const today = new Date();

    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return due < today;
  };

  const formatDate = (date?: string) => {
    if (!date) return "No due date";

    const parsed = new Date(date);

    if (isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">

        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            My Tasks
          </h2>

          <p className="text-xs text-gray-500">
            Showing {filteredTasks.length} tasks
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1 overflow-x-auto">

          <button
            type="button"
            onClick={() => onTabChange("ALL")}
            className={`rounded-md px-3 py-2 text-xs font-medium transition ${
              activeTab === "ALL"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            All ({tasks.length})
          </button>

          <button
            type="button"
            onClick={() => onTabChange("TODO")}
            className={`rounded-md px-3 py-2 text-xs font-medium transition ${
              activeTab === "TODO"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            To Do ({todoCount})
          </button>

          <button
            type="button"
            onClick={() => onTabChange("IN_PROGRESS")}
            className={`rounded-md px-3 py-2 text-xs font-medium ${
              activeTab === "IN_PROGRESS"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            In Progress ({progressCount})
          </button>

          <button
            type="button"
            onClick={() => onTabChange("COMPLETED")}
            className={`rounded-md px-3 py-2 text-xs font-medium ${
              activeTab === "COMPLETED"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Completed ({completedCount})
          </button>

          <button
            type="button"
            onClick={() => onTabChange("ON_HOLD")}
            className={`rounded-md px-3 py-2 text-xs font-medium ${
              activeTab === "ON_HOLD"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            On Hold ({onHoldCount})
          </button>

          <button
            type="button"
            onClick={() => onTabChange("OVERDUE")}
            className={`rounded-md px-3 py-2 text-xs font-medium ${
              activeTab === "OVERDUE"
                ? "bg-white text-red-600 shadow-sm font-semibold"
                : "text-gray-500 hover:text-red-600"
            }`}
          >
            Overdue ({overdueCount})
          </button>

        </div>
      </div>

      {/* Refresh */}
      <div className="flex justify-end border-b border-gray-100 px-5 py-2">
        <button
          type="button"
          onClick={onRefresh}
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          ↻ Refresh Tasks
        </button>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-gray-500">
          Loading tasks...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-500">
          No tasks found.
        </div>
      ) : (
        <div>
          {filteredTasks.map((task) => {
            const overdue = isOverdue(task);

            return (
              <div
                key={task.id}
               className="flex flex-col gap-4 border-b border-gray-100 px-6 py-5 last:border-b-0 hover:bg-gray-50/70 transition-colors md:flex-row md:items-center md:justify-between"
              >

                {/* Left */}
                <div className="flex min-w-0 items-start gap-3">

                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />

                  <div className="min-w-0">

                    {/* Title + Project */}
                    <div className="flex flex-wrap items-center gap-2">

                      <h3 className="text-sm font-semibold text-gray-900">
                        {task.title}
                      </h3>

                      {task.project && (
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                          {task.project}
                        </span>
                      )}

                      {task.priority && (
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                            task.priority === "HIGH"
                              ? "bg-red-50 text-red-600"
                              : task.priority === "MEDIUM"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-green-50 text-green-600"
                          }`}
                        >
                          {task.priority}
                        </span>
                      )}

                    </div>

                    {/* Description */}
                    {task.description && (
                      <p className="mt-1 text-xs text-gray-500">
                        {task.description}
                      </p>
                    )}

                    {/* Date / Time / Duration */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">

                      {task.dueDate && (
                        <span
                          className={
                            overdue
                              ? "font-medium text-red-600"
                              : "text-gray-500"
                          }
                        >
                          {overdue
                            ? `Overdue: ${formatDate(task.dueDate)}`
                            : formatDate(task.dueDate)}
                        </span>
                      )}

                      {task.dueTime && (
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-600">
                          ⏰ {task.dueTime}
                        </span>
                      )}

                      {task.estimatedTime && (
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-amber-600">
                          ⌛ {task.estimatedTime}
                        </span>
                      )}

                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className="flex shrink-0 items-center gap-3">

                  {/* Status */}
                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleProtectedStatusChange(
                        task.id,
                        e.target.value as TaskStatus
                      )
                    }
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold outline-none transition-colors ${
                      task.status === "COMPLETED"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : task.status === "IN_PROGRESS"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-gray-200 bg-white text-gray-700"
                    }`}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ON_HOLD">On Hold</option>
                  </select>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAdmin) {
                        alert("Admin permission required to edit task.");
                        return;
                      }
                      onEditTask?.(task);
                    }}
                    className="text-sm text-orange-400 hover:text-orange-600"
                    title="Edit Task"
                  >
                    ✎
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    className="text-sm text-gray-400 hover:text-red-500"
                    title="Delete"
                  >
                    🗑
                  </button>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}