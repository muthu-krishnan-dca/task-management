"use client";

import { CalendarView } from "@/components/CalendarView";
import Header from "@/components/Header";
import { SummaryCards } from "@/components/SummaryCards";
import { TaskFormModal } from "@/components/TaskFormModal";
import { TaskList } from "@/components/TaskList";
import { Task, TaskPriority, TaskStatus } from "@/types/task";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  createNotification,
  syncSystemTaskNotifications,
} from "@/utils/notificationStore";
import { applyTheme, getThemeMode } from "@/utils/themeStore";
import { getAuthUser, logoutUser } from "@/utils/authStore";

const BACKEND_URLS = ["http://localhost:5000/tasks", "http://localhost:3001/tasks", "http://localhost:3000/tasks"];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "products" | "orders" | "reports" | "settings">("products");

  const [currentAdmin, setCurrentAdmin] = useState<{
    name: string;
    role: "Admin";
    email: string;
  }>({
    name: "Admin Administrator",
    role: "Admin",
    email: "admin@ablespace.io",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | TaskStatus | "OVERDUE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Demo user data for Manage Users tab
  const [usersList] = useState([
    { id: "1", name: "Admin Administrator", email: "admin@ablespace.io", role: "Admin", status: "Active" },
    { id: "2", name: "Sarah Jenkins (SLP)", email: "sarah.j@ablespace.io", role: "User / Evaluator", status: "Active" },
    { id: "3", name: "Michael Chen (OT)", email: "m.chen@ablespace.io", role: "User / Evaluator", status: "Active" },
    { id: "4", name: "Emily Rodriguez (PT)", email: "emily.r@ablespace.io", role: "User / Evaluator", status: "Active" },
  ]);

  // Session verification
  useEffect(() => {
    const savedSession = localStorage.getItem("isLoggedIn");
    const savedUser = localStorage.getItem("user");

    if (savedSession === "true" && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.role === "Admin") {
          setCurrentAdmin(parsed);
        } else {
          router.push("/admin/login");
        }
      } catch {
        router.push("/admin/login");
      }
    } else {
      router.push("/admin/login");
    }

    const savedTheme = getThemeMode();
    if (savedTheme === "dark") setDarkMode(true);
  }, [router]);

  const toggleTheme = () => {
    const nextMode = darkMode ? "light" : "dark";
    setDarkMode(!darkMode);
    applyTheme(nextMode);
  };

  const handleLogout = () => {
    logoutUser("/admin/login");
  };

  // API Client
  const fetchFromBackend = async (path = "", options?: RequestInit) => {
    for (const baseUrl of BACKEND_URLS) {
      try {
        const res = await fetch(`${baseUrl}${path}`, options);
        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/json")) {
          return res;
        }
      } catch {
        // Fallback
      }
    }
    throw new Error("Unable to connect to backend server");
  };

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const res = await fetchFromBackend();
      const data = await res.json();
      const loadedTasks = Array.isArray(data) ? data : [];
      setTasks(loadedTasks);
      syncSystemTaskNotifications(loadedTasks);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleAddTaskForDate = (dateStr: string) => {
    setEditingTask({
      id: "",
      title: "",
      description: "",
      assignee: "Admin",
      dueDate: dateStr,
      labels: [],
      status: "TODO",
      priority: "MEDIUM",
    } as any);
    setShowForm(true);
  };

  const handleSaveTask = async (taskData: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    dueTime?: string;
    estimatedTime?: string;
    project?: string;
  }) => {
    try {
      if (editingTask && editingTask.id) {
        const res = await fetchFromBackend(`/${editingTask.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });
        const updatedTask = await res.json();
        setTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? updatedTask : t))
        );

        createNotification({
          title: `✏️ Task Updated: "${updatedTask.title}"`,
          message: `Task details have been updated by Admin.`,
          type: "TASK_UPDATED",
          taskId: updatedTask.id,
        });
      } else {
        const res = await fetchFromBackend("", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });
        const createdTask = await res.json();
        setTasks((prev) => [createdTask, ...prev]);

        createNotification({
          title: `🆕 Task Created: "${createdTask.title}"`,
          message: `Task created by Admin in project ${createdTask.project || "General"}.`,
          type: "TASK_CREATED",
          taskId: createdTask.id,
        });
      }
      setShowForm(false);
      setEditingTask(null);
    } catch (error) {
      alert("Failed to save task");
      console.error(error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const currentTask = tasks.find((t) => t.id === taskId);
    if (currentTask && currentTask.status !== newStatus) {
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
          message: `Task status updated from ${currentTask.status} to ${newStatus}.`,
          type: "STATUS_CHANGED",
          taskId: currentTask.id,
        });
      }
    }

    try {
      const res = await fetchFromBackend(`/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await fetchFromBackend(`/${taskId}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const isTaskOverdue = (task: Task) => {
    if (!task?.dueDate) return false;
    if (task.status === "COMPLETED") return false;

    const dueDate = new Date(task.dueDate);
    const today = new Date();

    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return dueDate < today;
  };

  const todoCount = tasks.filter((task) => task?.status === "TODO").length;
  const progressCount = tasks.filter((task) => task?.status === "IN_PROGRESS").length;
  const completedCount = tasks.filter((task) => task?.status === "COMPLETED").length;
  const onHoldCount = tasks.filter((task) => task?.status === "ON_HOLD").length;
  const overdueCount = tasks.filter((task) => isTaskOverdue(task)).length;

  const filteredTasks = tasks.filter((task) => {
    if (!task) return false;

    const query = (searchQuery || "").toLowerCase();

    const matchesSearch =
      (task.title || "").toLowerCase().includes(query) ||
      (task.description || "").toLowerCase().includes(query) ||
      (task.project || "").toLowerCase().includes(query) ||
      (task.priority || "").toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (statusFilter === "ALL") return true;

    if (statusFilter === "OVERDUE") {
      return isTaskOverdue(task);
    }

    return task.status === statusFilter;
  });

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <main
        className={`min-h-screen font-sans transition-colors duration-200 ${
          darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
        }`}
      >
      {/* Dedicated Admin Dashboard Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 border-r transition-colors duration-200 z-30 hidden md:flex flex-col justify-between ${
          darkMode
            ? "border-slate-800 bg-slate-900 text-slate-100"
            : "border-slate-200 bg-white text-slate-900"
        }`}
      >
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="flex h-16 items-center justify-between border-b px-6 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-600 font-black text-white shadow-md text-sm">
                👑
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Admin Panel
              </span>
            </div>
          </div>

          {/* Sidebar Menu */}
          <div className="px-4 py-4 space-y-6">
            <div>
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                ADMINISTRATION
              </span>
              <nav className="mt-2 space-y-1">
                <button
                  onClick={() => setActiveTab("users")}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold transition-all ${
                    activeTab === "users"
                      ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <span className="text-sm">👥</span>
                  <span>Manage Users</span>
                </button>

                <button
                  onClick={() => setActiveTab("products")}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold transition-all ${
                    activeTab === "products"
                      ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <span className="text-sm">📦</span>
                  <span>Manage Tasks</span>
                </button>

                <button
                  onClick={() => setActiveTab("orders")}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold transition-all ${
                    activeTab === "orders"
                      ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <span className="text-sm">🛒</span>
                  <span>Activity Log</span>
                </button>

                <button
                  onClick={() => setActiveTab("reports")}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold transition-all ${
                    activeTab === "reports"
                      ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <span className="text-sm">📊</span>
                  <span>Reports & Calendar</span>
                </button>

                <button
                  onClick={() => setActiveTab("settings")}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold transition-all ${
                    activeTab === "settings"
                      ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <span className="text-sm">⚙️</span>
                  <span>Settings</span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Footer Admin Profile */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-white text-xs font-bold">
                👑
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-xs font-bold truncate">{currentAdmin.name}</p>
                <p className="text-[10px] text-amber-500 font-semibold truncate">System Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-rose-500 hover:underline shrink-0"
              title="Sign Out Admin"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="md:ml-64 min-h-screen">
        <Header
          darkMode={darkMode}
          onToggleTheme={toggleTheme}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
          {/* Top Admin Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  🛠️ Admin Dashboard
                </h1>
                <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 px-3 py-1 text-xs font-bold">
                  👑 Authorized Admin
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Logged in as <strong className="text-slate-900 dark:text-white">{currentAdmin.name}</strong> ({currentAdmin.email})
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setEditingTask(null);
                  setShowForm(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 font-bold text-white shadow-md hover:bg-amber-700 transition-all text-xs sm:text-sm"
              >
                <span>+</span> Add New Task
              </button>

              <button
                onClick={handleLogout}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>

          {/* Active Tab View Render */}
          {activeTab === "users" ? (
            /* 👥 Manage Users View */
            <div className="rounded-2xl border bg-white p-6 shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900 space-y-6">
              <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">👥 Manage Users & Roles</h2>
                  <p className="text-xs text-slate-500">View and manage authorized system users and evaluators</p>
                </div>
                <button
                  onClick={() => alert("Add User modal triggered")}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                >
                  + Add New User
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b bg-slate-50 text-slate-500 dark:bg-slate-800 dark:border-slate-700 uppercase font-bold">
                    <tr>
                      <th className="p-3">User Name</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{u.name}</td>
                        <td className="p-3 font-mono text-slate-500">{u.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            u.role === "Admin" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-emerald-600">{u.status}</td>
                        <td className="p-3 text-right space-x-2">
                          <button className="text-blue-600 hover:underline font-bold">Edit</button>
                          <button className="text-rose-600 hover:underline font-bold">Revoke</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === "orders" ? (
            /* 🛒 Orders & Activity View */
            <div className="rounded-2xl border bg-white p-6 shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h2 className="text-xl font-bold">🛒 System Orders & Activity Log</h2>
              <p className="text-sm text-slate-500">View recent system activity and task logs.</p>
            </div>
          ) : activeTab === "reports" ? (
            <div className="space-y-6">
              <SummaryCards
                todoCount={todoCount}
                progressCount={progressCount}
                completedCount={completedCount}
                onHoldCount={onHoldCount}
                overdueCount={overdueCount}
              />
              <CalendarView
                tasks={tasks}
                onStatusChange={handleStatusChange}
                onAddTaskForDate={handleAddTaskForDate}
              />
            </div>
          ) : activeTab === "settings" ? (
            /* ⚙️ Settings View */
            <div className="rounded-2xl border bg-white p-6 shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h2 className="text-xl font-bold">⚙️ Admin System Settings</h2>
              <p className="text-xs text-slate-500">Configure global website settings and permissions.</p>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold">Dark / Light Mode Preference</span>
                <button
                  onClick={toggleTheme}
                  className="rounded-xl border px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800"
                >
                  {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
                </button>
              </div>
            </div>
          ) : (
            /* 📦 Manage Tasks View */
            <>
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

              <SummaryCards
                todoCount={todoCount}
                progressCount={progressCount}
                completedCount={completedCount}
                onHoldCount={onHoldCount}
                overdueCount={overdueCount}
              />

              <TaskList
                tasks={tasks}
                filteredTasks={filteredTasks}
                activeTab={statusFilter}
                todoCount={todoCount}
                progressCount={progressCount}
                completedCount={completedCount}
                isLoading={isLoading}
                userRole="Admin"
                onTabChange={setStatusFilter}
                onRefresh={loadTasks}
                onStatusChange={handleStatusChange}
                onDeleteTask={handleDeleteTask}
                onEditTask={handleEditTask}
                onOpenLoginModal={handleLogout}
                onHoldCount={onHoldCount}
                overdueCount={overdueCount}
              />
            </>
          )}
        </div>
      </section>
    </main>
    </ProtectedRoute>
  );
}
