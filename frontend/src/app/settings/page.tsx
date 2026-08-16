"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { SettingsView } from "@/components/SettingsView";
import { TaskFormModal } from "@/components/TaskFormModal";
import { TaskPriority, TaskStatus } from "@/types/task";
import { createNotification } from "@/utils/notificationStore";
import { getUserProfile, saveUserProfile } from "@/utils/userStore";

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

export default function SettingsPage() {
  const [profile, setProfile] = useState(getUserProfile());
  const [showForm, setShowForm] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleUpdateUser = (updated: { name: string; email: string }) => {
    const next = saveUserProfile(updated);
    setProfile(next);
  };

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
        message: `Task created in project ${created.project || "General"}.`,
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
        <Header hideTaskControls={true} hideMobileToolbar={true} />

        {/* Settings Content */}
        <main className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
          <SettingsView
            darkMode={darkMode}
            currentUser={profile}
            onUpdateUser={handleUpdateUser}
          />
        </main>
      </div>
    </div>
  );
}
