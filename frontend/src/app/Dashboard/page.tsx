"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { TaskFormModal } from "@/components/TaskFormModal";
import { VisibleFields, defaultVisibleFields } from "@/types/task";
import { TaskFilters } from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  createNotification,
  syncSystemTaskNotifications,
} from "@/utils/notificationStore";
import { DEFAULT_USER, getUserProfile, UserProfile } from "@/utils/userStore";
import { getTasksRequestUrl, attachUserToTaskPayload } from "@/utils/authStore";

type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  labels: string[];
  status: TaskStatus;
  priority: TaskPriority;
  dueTime?: string;
  estimatedTime?: string;
  project?: string;
  createdAt?: string;
}

interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  dueTime?: string;
  estimatedTime?: string;
  project?: string;
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | TaskStatus | "OVERDUE">("ALL");
  const [visibleFields, setVisibleFields] = useState<VisibleFields>(defaultVisibleFields);
  const [filters, setFilters] = useState<TaskFilters>({
    status: "ALL",
    priority: "ALL",
    project: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    setProfile(getUserProfile());
    const handleProfileUpdate = () => {
      setProfile(getUserProfile());
    };
    window.addEventListener("userProfileUpdated", handleProfileUpdate);
    return () => {
      window.removeEventListener("userProfileUpdated", handleProfileUpdate);
    };
  }, []);

  // Format backend task safely
  const formatTask = (task: any): Task => {
    let formattedDueDate = "No due date";
    if (task.dueDate) {
      const date = new Date(task.dueDate);
      if (!isNaN(date.getTime())) {
        formattedDueDate = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
    }

    return {
      id: task.id || task._id,
      title: task.title || "Untitled Task",
      description: task.description || "",
      assignee: task.assignee || "Unassigned",
      dueDate: formattedDueDate,
      dueTime: task.dueTime,
      estimatedTime: task.estimatedTime,
      labels: task.labels || [],
      status: task.status || "TODO",
      priority: task.priority || "MEDIUM",
      project: task.project || "General",
      createdAt: task.createdAt,
    };
  };

  // Fetch tasks
  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(getTasksRequestUrl());
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      const data = await response.json();
      const formatted = data.map(formatTask);
      setTasks(formatted);
      syncSystemTaskNotifications(formatted);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Helper to check if task is overdue
  const isTaskOverdue = (task: Task) => {
    if (!task.dueDate || task.dueDate === "No due date") return false;
    if (task.status === "COMPLETED") return false;
    const due = new Date(task.dueDate);
    if (isNaN(due.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  // Calculations for Summary Cards
  const totalTasksCount = tasks.length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const overdueCount = tasks.filter(isTaskOverdue).length;

  // Add / Edit Task
  const handleAddTask = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const handleSaveTask = async (taskData: TaskFormData) => {
    try {
      if (editingTask) {
        const response = await fetch(`${BACKEND_URL}/tasks/${editingTask.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });

        if (!response.ok) throw new Error("Failed to update task");

        const updatedTask = await response.json();
        const formatted = formatTask(updatedTask);
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? formatted : t)));

        createNotification({
          title: `✏️ Task Updated: "${formatted.title}"`,
          message: `Task details have been updated.`,
          type: "TASK_UPDATED",
          taskId: formatted.id,
        });
      } else {
        const response = await fetch(`${BACKEND_URL}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(attachUserToTaskPayload(taskData)),
        });

        if (!response.ok) throw new Error("Failed to create task");

        const newTask = await response.json();
        const formatted = formatTask(newTask);
        setTasks((prev) => [formatted, ...prev]);

        createNotification({
          title: `🆕 Task Created: "${formatted.title}"`,
          message: `Task created in project ${formatted.project || "General"}.`,
          type: "TASK_CREATED",
          taskId: formatted.id,
        });
      }
      handleCloseForm();
    } catch (error) {
      console.error("Error saving task:", error);
      alert("Failed to save task");
    }
  };

  // Status Change
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask || currentTask.status === newStatus) return;

    if (newStatus === "COMPLETED") {
      createNotification({
        title: `✅ Task Completed: "${currentTask.title}"`,
        message: `Task marked as completed!`,
        type: "TASK_COMPLETED",
        taskId: currentTask.id,
      });
    } else {
      createNotification({
        title: `🔄 Status Changed: "${currentTask.title}"`,
        message: `Status moved from ${currentTask.status} to ${newStatus}.`,
        type: "STATUS_CHANGED",
        taskId: currentTask.id,
      });
    }

    // Optimistic Update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      const response = await fetch(`${BACKEND_URL}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");
    } catch (error) {
      console.error("Status update error:", error);
      // Rollback
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: currentTask.status } : t))
      );
      alert("Failed to update task status");
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`${BACKEND_URL}/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete task");

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error("Delete task error:", error);
      alert("Failed to delete task");
    }
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((task) => {
    // Search query
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const matches =
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        (task.project || "").toLowerCase().includes(query) ||
        task.priority.toLowerCase().includes(query);
      if (!matches) return false;
    }

    // Active Tab Filter
    if (activeTab === "TODO") {
      if (task.status !== "TODO") return false;
    } else if (activeTab === "IN_PROGRESS") {
      if (task.status !== "IN_PROGRESS") return false;
    } else if (activeTab === "COMPLETED") {
      if (task.status !== "COMPLETED") return false;
    } else if (activeTab === "ON_HOLD") {
      if (task.status !== "ON_HOLD") return false;
    } else if (activeTab === "OVERDUE") {
      if (!isTaskOverdue(task)) return false;
    }

    // Header Filters: Status
    if (
      filters.status !== "ALL" &&
      (task.status || "").toUpperCase() !== filters.status.toUpperCase()
    ) {
      return false;
    }

    // Header Filters: Priority
    if (
      filters.priority !== "ALL" &&
      (task.priority || "").toUpperCase() !== filters.priority.toUpperCase()
    ) {
      return false;
    }

    // Header Filters: Project
    if (
      filters.project.trim() &&
      !(task.project || "")
        .toLowerCase()
        .includes(filters.project.toLowerCase().trim())
    ) {
      return false;
    }

    return true;
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        {/* Modal */}
        {showForm && (
          <TaskFormModal
            initialTask={editingTask}
            onClose={handleCloseForm}
            onSubmit={handleSaveTask}
          />
        )}

        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="md:ml-64 min-h-screen">
          {/* Header */}
          <Header
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddTask={handleAddTask}
            visibleFields={visibleFields}
            onVisibleFieldsChange={setVisibleFields}
            filters={filters}
            onFiltersChange={setFilters}
            tasksToExport={filteredTasks}
          />

          {/* Dashboard Body */}
          <main className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
            {/* Welcome / Dashboard Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 suppressHydrationWarning className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Welcome back, {profile.name}!
                </h1>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Here is the real-time summary of your workspace tasks and deadlines.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-black dark:bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-gray-800 dark:hover:bg-indigo-500 transition-colors cursor-pointer"
                >
                  <span>+</span>
                  <span>Add Task</span>
                </button>
              </div>
            </div>

            {/* Quick Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Tasks Card */}
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 p-5 shadow-xs transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Total Tasks
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-sm">
                    📋
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                    {totalTasksCount}
                  </span>
                  <span className="text-xs font-medium text-gray-400">active</span>
                </div>
              </div>

              {/* In Progress Card */}
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 p-5 shadow-xs transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    In Progress
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-sm">
                    ⚡
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                    {inProgressCount}
                  </span>
                  <span className="text-xs font-medium text-gray-400">doing</span>
                </div>
              </div>

              {/* Completed Card */}
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 p-5 shadow-xs transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Completed
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-sm">
                    ✅
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {completedCount}
                  </span>
                  <span className="text-xs font-medium text-gray-400">done</span>
                </div>
              </div>

              {/* Overdue Card */}
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 p-5 shadow-xs transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Overdue
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-sm">
                    🚨
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                    {overdueCount}
                  </span>
                  <span className="text-xs font-medium text-gray-400">needs action</span>
                </div>
              </div>
            </div>

            {/* MY TASKS SECTION WITH STATUS FILTERS & RECENT TASK LIST */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-xs overflow-hidden">
              {/* Section Header & Status Filters */}
              <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    Workspace Task Activity
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Showing {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
                  </p>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
                  <div className="flex items-center rounded-xl bg-gray-100 dark:bg-gray-700/60 p-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
                    <button
                      type="button"
                      onClick={() => setActiveTab("ALL")}
                      className={`rounded-lg px-3 py-1.5 transition ${
                        activeTab === "ALL"
                          ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs font-bold"
                          : "hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      All ({tasks.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("TODO")}
                      className={`rounded-lg px-3 py-1.5 transition ${
                        activeTab === "TODO"
                          ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs font-bold"
                          : "hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      To Do
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("IN_PROGRESS")}
                      className={`rounded-lg px-3 py-1.5 transition ${
                        activeTab === "IN_PROGRESS"
                          ? "bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-xs font-bold"
                          : "hover:text-amber-600 dark:hover:text-amber-400"
                      }`}
                    >
                      In Progress ({inProgressCount})
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("COMPLETED")}
                      className={`rounded-lg px-3 py-1.5 transition ${
                        activeTab === "COMPLETED"
                          ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold"
                          : "hover:text-emerald-600 dark:hover:text-emerald-400"
                      }`}
                    >
                      Completed ({completedCount})
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("OVERDUE")}
                      className={`rounded-lg px-3 py-1.5 transition ${
                        activeTab === "OVERDUE"
                          ? "bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400 shadow-xs font-bold"
                          : "text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      }`}
                    >
                      Overdue ({overdueCount})
                    </button>
                  </div>
                </div>
              </div>

              {/* Task List Content */}
              <div className="p-4">
                {isLoading ? (
                  <div className="py-12 text-center text-xs text-gray-400">
                    Loading tasks...
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="text-3xl">📋</div>
                    <p className="mt-2 text-xs font-semibold text-gray-700">No tasks found</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Try changing your search keywords or status filter.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredTasks.map((task) => {
                      const overdue = isTaskOverdue(task);

                      return (
                        <div
                          key={task.id}
                          className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5 px-2 hover:bg-gray-50/80 rounded-lg transition"
                        >
                          {/* Left Info */}
                          <div className="flex items-start gap-3 min-w-0">
                            {/* Quick Status Toggle Checkbox */}
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(
                                  task.id,
                                  task.status === "COMPLETED" ? "TODO" : "COMPLETED"
                                )
                              }
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition ${
                                task.status === "COMPLETED"
                                  ? "border-green-600 bg-green-600 text-white"
                                  : "border-gray-300 hover:border-gray-400"
                              }`}
                              title={
                                task.status === "COMPLETED"
                                  ? "Mark as Incomplete"
                                  : "Mark as Completed"
                              }
                            >
                              {task.status === "COMPLETED" && (
                                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </button>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3
                                  className={`text-xs font-semibold truncate ${
                                    task.status === "COMPLETED"
                                      ? "text-gray-400 line-through"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {task.title}
                                </h3>

                                {/* Project Tag */}
                                {visibleFields.project && task.project && (
                                  <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                                    {task.project}
                                  </span>
                                )}
                              </div>

                              {visibleFields.description && task.description && (
                                <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right Info & Actions */}
                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                            {/* Priority Badge */}
                            {visibleFields.priority && (
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                  task.priority === "HIGH"
                                    ? "bg-red-50 text-red-700 border border-red-100"
                                    : task.priority === "MEDIUM"
                                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                }`}
                              >
                                {task.priority}
                              </span>
                            )}

                            {/* Due Date */}
                            {visibleFields.dueDate && (
                              <span
                                className={`text-xs ${
                                  overdue
                                    ? "font-semibold text-red-600"
                                    : "text-gray-500"
                                }`}
                              >
                                {overdue ? `Overdue: ${task.dueDate}` : task.dueDate}
                              </span>
                            )}

                            {/* Status Select */}
                            {visibleFields.status && (
                              <select
                                value={task.status}
                                onChange={(e) =>
                                  handleStatusChange(task.id, e.target.value as TaskStatus)
                                }
                                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none focus:border-indigo-500"
                              >
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="ON_HOLD">On Hold</option>
                              </select>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => handleEditTask(task)}
                                className="p-1 text-xs text-gray-400 hover:text-gray-700"
                                title="Edit Task"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1 text-xs text-gray-400 hover:text-red-600"
                                title="Delete Task"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
