"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { CalendarView } from "@/components/CalendarView";
import { TaskFormModal } from "@/components/TaskFormModal";
import { Task, TaskPriority, TaskStatus, VisibleFields, defaultVisibleFields } from "@/types/task";
import { createNotification, syncSystemTaskNotifications } from "@/utils/notificationStore";

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

const BACKEND_URLS = [
  "http://localhost:5000/tasks",
  "http://localhost:3001/tasks",
  "http://localhost:3000/tasks",
];

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleFields, setVisibleFields] = useState<VisibleFields>(defaultVisibleFields);

  const fetchTasksFromBackend = async () => {
    setIsLoading(true);
    for (const url of BACKEND_URLS) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const formatted: Task[] = data.map((t: any) => ({
              id: t.id || t._id,
              title: t.title || "Untitled Task",
              description: t.description || "",
              dueDate: t.dueDate || "No due date",
              dueTime: t.dueTime || "",
              estimatedTime: t.estimatedTime || "1 hour",
              status: (t.status || "TODO") as TaskStatus,
              priority: (t.priority || "MEDIUM") as TaskPriority,
              project: t.project || "Website Redesign",
              createdAt: t.createdAt,
            }));
            setTasks(formatted);
            syncSystemTaskNotifications(formatted);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // try next fallback url
      }
    }

    // Fallback if backend offline
    const saved = localStorage.getItem("ablespace_tasks");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTasks(parsed);
        syncSystemTaskNotifications(parsed);
      } catch {}
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTasksFromBackend();
  }, []);

  const handleSaveTask = async (taskData: TaskFormData) => {
    try {
      const isEdit = !!editingTask && !!editingTask.id;
      const url = isEdit
        ? `http://localhost:3001/tasks/${editingTask.id}`
        : "http://localhost:3001/tasks";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (res.ok) {
        const saved = await res.json();
        createNotification({
          title: isEdit
            ? `✏️ Task Updated: "${taskData.title}"`
            : `🆕 Task Created: "${taskData.title}"`,
          message: `Task due date scheduled for ${taskData.dueDate || "upcoming date"}.`,
          type: isEdit ? "TASK_UPDATED" : "TASK_CREATED",
          taskId: saved.id || saved._id,
        });
      }
    } catch {
      // Local fallback
    }

    setShowForm(false);
    setEditingTask(null);
    fetchTasksFromBackend();
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await fetch(`http://localhost:3001/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {}

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  const handleAddTaskForDate = (dateStr: string) => {
    setEditingTask({
      id: "",
      title: "",
      description: "",
      dueDate: dateStr,
      status: "TODO",
      priority: "MEDIUM",
      project: "Website Redesign",
    });
    setShowForm(true);
  };

  // Filter tasks based on searchQuery
  const filteredTasks = tasks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      (t.project || "").toLowerCase().includes(q) ||
      (t.priority && t.priority.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Modal */}
      {showForm && (
        <TaskFormModal
          initialTask={editingTask}
          onClose={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
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
          onAddTask={() => {
            setEditingTask(null);
            setShowForm(true);
          }}
          visibleFields={visibleFields}
          onVisibleFieldsChange={setVisibleFields}
        />

        {/* Calendar View Content */}
        <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                📅 Workspace Calendar
              </h1>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                View deadlines, manage daily schedules, and add scheduled tasks by date.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingTask(null);
                setShowForm(true);
              }}
              className="inline-flex items-center justify-center rounded-lg bg-black dark:bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 dark:hover:bg-indigo-500 shadow-xs cursor-pointer"
            >
              + Add Task
            </button>
          </div>

          {isLoading ? (
            <div className="py-24 text-center text-xs text-gray-400">
              Loading calendar schedules...
            </div>
          ) : (
            <CalendarView
              tasks={filteredTasks}
              onAddTaskForDate={handleAddTaskForDate}
              onStatusChange={handleStatusChange}
            />
          )}
        </main>
      </div>
    </div>
  );
}
