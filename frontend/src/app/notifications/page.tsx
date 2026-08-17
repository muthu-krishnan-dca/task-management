"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { NotificationsView } from "@/components/NotificationsView";
import { TaskFormModal } from "@/components/TaskFormModal";
import { TaskPriority, TaskStatus } from "@/types/task";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { createNotification } from "@/utils/notificationStore";

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

const BACKEND_URL = "http://localhost:3001";

export default function NotificationsPage() {
  const [showForm, setShowForm] = useState(false);

  const handleSaveTask = async (taskData: TaskFormData) => {
    try {
      const response = await fetch(`${BACKEND_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) throw new Error("Failed to create task");
      const created = await response.json();

      createNotification({
        title: `🆕 Task Created: "${created.title}"`,
        message: `Task successfully created with priority ${created.priority || "MEDIUM"}.`,
        type: "TASK_CREATED",
        taskId: created.id || created._id,
      });

      setShowForm(false);
      alert("Task created successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to create task");
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        {/* Modal */}
        {showForm && (
          <TaskFormModal
            onClose={() => setShowForm(false)}
            onSubmit={handleSaveTask}
          />
        )}

        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="md:ml-64 min-h-screen">
          {/* Header */}
          <Header onAddTask={() => setShowForm(true)} />

          {/* Notifications View Content */}
          <main className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
            <NotificationsView />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
