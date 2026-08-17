"use client";

import { useEffect, useState } from "react";
import { VisibleFields, defaultVisibleFields } from "@/types/task";
import Header, { TaskFilters } from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import TaskBoard from "@/components/taskboard";
import { TaskFormModal } from "@/components/TaskFormModal";
import { TaskStatus } from "@/types/task";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  createNotification,
  syncSystemTaskNotifications,
} from "@/utils/notificationStore";

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

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleFields, setVisibleFields] = useState<VisibleFields>(defaultVisibleFields);
  const [filters, setFilters] = useState<TaskFilters>({
    status: "ALL",
    priority: "ALL",
    project: "",
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // --------------------------------
  // Format backend task
  // --------------------------------
  const formatDueDate = (dateStr?: string): string => {
    if (!dateStr || dateStr === "No due date") return "No due date";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatTask = (task: any): Task => ({
    id: task.id || task._id,
    title: task.title,
    description: task.description || "",
    assignee: "User",
    dueDate: formatDueDate(task.dueDate),
    labels: [
      task.project || "General",
      task.priority || "MEDIUM",
    ],
    status: task.status,
    priority: task.priority || "MEDIUM",
    dueTime: task.dueTime,
    estimatedTime: task.estimatedTime,
    project: task.project,
  });

  // --------------------------------
  // Load Tasks
  // --------------------------------
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/tasks`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }

        const data = await response.json();

        const formattedTasks = data.map(formatTask);

        setTasks(formattedTasks);
        syncSystemTaskNotifications(formattedTasks);
      } catch (error) {
        console.error(
          "Failed to load tasks:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  // --------------------------------
  // Add Task
  // --------------------------------
  const handleAddTask = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  // --------------------------------
  // Edit Task
  // --------------------------------
  const handleEditTask = (taskId: string) => {
    const task = tasks.find(
      (task) => task.id === taskId
    );

    if (!task) {
      return;
    }

    setEditingTask(task);
    setShowForm(true);
  };

  // --------------------------------
  // Save Task
  // Add OR Update
  // --------------------------------
  const handleSaveTask = async (
    taskData: TaskFormData
  ) => {
    try {
      // ==============================
      // UPDATE EXISTING TASK
      // ==============================
      if (editingTask) {
        const response = await fetch(
          `${BACKEND_URL}/tasks/${editingTask.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(taskData),
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to update task"
          );
        }

        const updatedTask =
          await response.json();

        const formattedTask =
          formatTask(updatedTask);

        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === editingTask.id
              ? formattedTask
              : task
          )
        );

        createNotification({
          title: `✏️ Task Updated: "${formattedTask.title}"`,
          message: `Task details have been modified.`,
          type: "TASK_UPDATED",
          taskId: formattedTask.id,
        });

        setShowForm(false);
        setEditingTask(null);

        alert(
          "Task updated successfully!"
        );

        return;
      }

      // ==============================
      // CREATE NEW TASK
      // ==============================
      const response = await fetch(
        `${BACKEND_URL}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(taskData),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to create task"
        );
      }

      const createdTask =
        await response.json();

      const formattedTask =
        formatTask(createdTask);

      setTasks((currentTasks) => [
        formattedTask,
        ...currentTasks,
      ]);

      createNotification({
        title: `🆕 Task Created: "${formattedTask.title}"`,
        message: `New task added with priority ${formattedTask.priority || "MEDIUM"}.`,
        type: "TASK_CREATED",
        taskId: formattedTask.id,
      });

      setShowForm(false);

      alert(
        "Task created successfully!"
      );
    } catch (error) {
      console.error(
        "Failed to save task:",
        error
      );

      alert("Failed to save task");
    }
  };

  // --------------------------------
  // Delete Task
  // --------------------------------
  const handleDeleteTask = async (
    taskId: string
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}/tasks/${taskId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete task"
        );
      }

      setTasks((currentTasks) =>
        currentTasks.filter(
          (task) => task.id !== taskId
        )
      );

      alert(
        "Task deleted successfully!"
      );
    } catch (error) {
      console.error(
        "Failed to delete task:",
        error
      );

      alert("Failed to delete task");
    }
  };

  const handleDuplicateTask = async (taskId: string) => {
  const originalTask = tasks.find(
    (task) => task.id === taskId
  );

  if (!originalTask) {
    return;
  }

  try {
      const duplicateData = {
        title: `${originalTask.title} (Copy)`,
        description: originalTask.description,
        status: originalTask.status,
        priority: originalTask.priority,
        dueDate:
          originalTask.dueDate && originalTask.dueDate !== "No due date"
            ? originalTask.dueDate
            : undefined,
        dueTime: originalTask.dueTime,
        estimatedTime: originalTask.estimatedTime,
        project: originalTask.project,
      };

    const response = await fetch(
      `${BACKEND_URL}/tasks`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(duplicateData),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to duplicate task");
    }

    const createdTask = await response.json();

    const formattedTask = formatTask(createdTask);

    setTasks((currentTasks) => [
      formattedTask,
      ...currentTasks,
    ]);

    createNotification({
      title: `📋 Task Duplicated: "${formattedTask.title}"`,
      message: `Created a copy of task in project ${formattedTask.project || "General"}.`,
      type: "TASK_CREATED",
      taskId: formattedTask.id,
    });

    alert("Task duplicated successfully!");
  } catch (error) {
    console.error(
      "Failed to duplicate task:",
      error
    );

    alert("Failed to duplicate task");
  }
};
const handleStatusChange = async (
  taskId: string,
  newStatus: TaskStatus
) => {
  // Find current task
  const currentTask = tasks.find(
    (task) => task.id === taskId
  );

  if (!currentTask) {
    return;
  }

  // Already same status
  if (currentTask.status === newStatus) {
    return;
  }

  // Optimistic UI update
  setTasks((currentTasks) =>
    currentTasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status: newStatus,
          }
        : task
    )
  );

  if (newStatus === "COMPLETED") {
    createNotification({
      title: `✅ Task Completed: "${currentTask.title}"`,
      message: `Task has been marked as completed!`,
      type: "TASK_COMPLETED",
      taskId: currentTask.id,
    });
  } else {
    createNotification({
      title: `🔄 Status Changed: "${currentTask.title}"`,
      message: `Task status updated from ${currentTask.status} to ${newStatus}.`,
      type: "STATUS_CHANGED",
      taskId: currentTask.id,
    });
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/tasks/${taskId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update task status");
    }

    console.log(
      `Task status updated to ${newStatus}`
    );
  } catch (error) {
    console.error(
      "Failed to update task status:",
      error
    );

    // Rollback if backend update fails
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: currentTask.status,
            }
          : task
      )
    );

    alert("Failed to update task status");
  }
  };
  const filteredTasks = tasks.filter((task) => {
    // Search query filter
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const matchesSearch =
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        (task.project || "").toLowerCase().includes(query) ||
        task.priority.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (
      filters.status !== "ALL" &&
      (task.status || "").toUpperCase() !== filters.status.toUpperCase()
    ) {
      return false;
    }

    // Priority filter
    if (
      filters.priority !== "ALL" &&
      (task.priority || "").toUpperCase() !== filters.priority.toUpperCase()
    ) {
      return false;
    }

    // Project filter
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

  // --------------------------------
  // Close Modal
  // --------------------------------
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">

        {/* Add / Edit Task Modal */}
        {showForm && (
          <TaskFormModal
            initialTask={editingTask}
            onClose={handleCloseForm}
            onSubmit={handleSaveTask}
          />
        )}

        {/* Sidebar */}
        <Sidebar />

        {/* Main Area */}
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

          {/* Content */}
          <main className="p-4 sm:p-6">

            {/* Page Header */}
            <div className="mb-6 flex items-center justify-between">

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Tasks
                </h1>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Manage and track your tasks
                </p>
              </div>

              {/* Add Task */}
              <button
                type="button"
                onClick={handleAddTask}
                className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
              >
                + Add Task
              </button>

            </div>

            {/* Task Board */}
            {loading ? (
              <div className="py-10 text-center text-gray-500">
                Loading tasks...
              </div>
            ) : (
              <TaskBoard
                tasks={filteredTasks}
                visibleFields={visibleFields}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery("")}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onStatusChange={handleStatusChange}
                onDuplicateTask={handleDuplicateTask}
              />
            )}

          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}