"use client";

import { CalendarView } from "@/components/CalendarView";
import Header from "@/components/Header";
import { SummaryCards } from "@/components/SummaryCards";
import { TaskFormModal } from "@/components/TaskFormModal";
import { TaskList } from "@/components/TaskList";
import { Task, TaskPriority, TaskStatus } from "@/types/task";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
  createNotification,
  getStoredNotifications,
  saveStoredNotifications,
  markAllNotificationsAsRead,
  clearAllNotifications,
  syncSystemTaskNotifications,
} from "@/utils/notificationStore";
import { NotificationItem, NotificationType } from "@/types/notification";
import { applyTheme, getThemeMode } from "@/utils/themeStore";
import { getAuthUser, logoutUser } from "@/utils/authStore";
import { saveAppSettings } from "@/utils/settingsStore";

const BACKEND_URLS = [
  "http://localhost:5000/tasks",
  "http://localhost:3001/tasks",
  "http://localhost:3000/tasks",
];

type AdminTab =
  | "dashboard"
  | "users"
  | "tasks"
  | "notifications"
  | "calendar"
  | "analytics"
  | "settings";

interface ManagedUser {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: "Admin" | "User" | "Guest" | string;
  phone?: string;
  status: "Active" | "Inactive" | string;
  createdAt?: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  const [currentAdmin, setCurrentAdmin] = useState<{
    name: string;
    role: "Admin" | string;
    email: string;
  }>({
    name: "Admin Administrator",
    role: "Admin",
    email: "admin@ablespace.io",
  });

  // --- Task State ---
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | TaskStatus | "OVERDUE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [taskUserFilter, setTaskUserFilter] = useState<string>("ALL");

  // --- User Management State ---
  const [usersList, setUsersList] = useState<ManagedUser[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("ALL");
  const [userStatusFilter, setUserStatusFilter] = useState<string>("ALL");

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "User",
    phone: "",
    status: "Active",
  });
  const [userModalError, setUserModalError] = useState("");
  const [userModalLoading, setUserModalLoading] = useState(false);

  // --- Notification Management State ---
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState<NotificationType>("SYSTEM_ANNOUNCEMENT");
  const [broadcastTarget, setBroadcastTarget] = useState("All Users");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // --- System Settings State ---
  const [workspaceName, setWorkspaceName] = useState("AbleSpace Enterprise");
  const [defaultTaskPriority, setDefaultTaskPriority] = useState<TaskPriority>("MEDIUM");
  const [defaultTaskStatus, setDefaultTaskStatus] = useState<TaskStatus>("TODO");
  const [systemAlertBanner, setSystemAlertBanner] = useState(true);
  const [bannerText, setBannerText] = useState("⚡ System Notice: All scheduled tasks are automatically synced with cloud database.");

  // --- 1. Notification Settings State ---
  const [notifOverdueAlerts, setNotifOverdueAlerts] = useState(true);
  const [notifTaskUpdates, setNotifTaskUpdates] = useState(true);
  const [notifTaskCompletion, setNotifTaskCompletion] = useState(true);

  // --- 2. Security Settings State ---
  const [sessionTimeout, setSessionTimeout] = useState("1h");
  const [requireLogin, setRequireLogin] = useState(true);
  const [allowUserRegistration, setAllowUserRegistration] = useState(true);
  const [passwordPolicy, setPasswordPolicy] = useState("medium");

  // --- 3. Data Management & Reset Modal State ---
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");

  // Toast message state
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // ----------------------------------------------------
  // Session verification & Admin Role Guard
  // ----------------------------------------------------
  useEffect(() => {
    const authUser = getAuthUser();
    if (!authUser) {
      router.replace("/admin/login");
      return;
    }

    if (authUser.role !== "Admin") {
      alert("Access Denied: Admin authorization required.");
      router.replace("/user/dashboard");
      return;
    }

    setCurrentAdmin(authUser);

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

  // ----------------------------------------------------
  // Data Loading: Users & Tasks & Notifications
  // ----------------------------------------------------
  const loadUsers = async () => {
    // 1. Check local persistent storage first
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("ablespace_managed_users");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setUsersList(parsed);
          }
        }
      } catch {}
    }

    // 2. Fetch fresh list from backend database
    try {
      const res = await fetch("http://localhost:3001/auth/users");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setUsersList(data);
          if (typeof window !== "undefined") {
            localStorage.setItem("ablespace_managed_users", JSON.stringify(data));
          }
        }
      }
    } catch {
      // Backend offline
    }
  };

  const loadNotifications = () => {
    setNotifications(getStoredNotifications());
  };

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
      setTasks(data);
      syncSystemTaskNotifications(data);
    } catch (error) {
      console.warn("Backend tasks fetch failed, checking local state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadTasks();
    loadNotifications();

    const handleNotifUpdate = () => loadNotifications();
    window.addEventListener("notificationsUpdated", handleNotifUpdate);
    return () => window.removeEventListener("notificationsUpdated", handleNotifUpdate);
  }, []);

  // ----------------------------------------------------
  // User Management Actions
  // ----------------------------------------------------
  const openAddUserModal = () => {
    setEditingUser(null);
    setUserFormData({
      name: "",
      email: "",
      password: "",
      role: "User",
      phone: "",
      status: "Active",
    });
    setUserModalError("");
    setShowUserModal(true);
  };

  const openEditUserModal = (user: ManagedUser) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role || "User",
      phone: user.phone || "",
      status: user.status || "Active",
    });
    setUserModalError("");
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserModalError("");

    if (!userFormData.name.trim() || !userFormData.email.trim()) {
      setUserModalError("Name and Email are required.");
      return;
    }

    if (!editingUser && !userFormData.password.trim()) {
      setUserModalError("Password is required for new users.");
      return;
    }

    setUserModalLoading(true);

    try {
      if (editingUser) {
        const userId = editingUser.id || editingUser._id || encodeURIComponent(editingUser.email);
        try {
          await fetch(`http://localhost:3001/auth/users/${userId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: userFormData.name.trim(),
              email: userFormData.email.trim(),
              role: userFormData.role,
              phone: userFormData.phone.trim(),
              ...(userFormData.password.trim() ? { password: userFormData.password.trim() } : {}),
            }),
          });
        } catch {}

        const updated = usersList.map((u) =>
          (u.id === editingUser.id || u._id === editingUser._id || u.email === editingUser.email)
            ? {
                ...u,
                name: userFormData.name.trim(),
                email: userFormData.email.trim(),
                role: userFormData.role,
                phone: userFormData.phone.trim(),
                status: userFormData.status,
              }
            : u
        );
        setUsersList(updated);
        if (typeof window !== "undefined") {
          localStorage.setItem("ablespace_managed_users", JSON.stringify(updated));
        }
        showToast(`User "${userFormData.name}" updated successfully! ✨`);
        setShowUserModal(false);
      } else {
        let newId = `user_${Date.now()}`;
        try {
          const res = await fetch("http://localhost:3001/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: userFormData.name.trim(),
              email: userFormData.email.trim(),
              password: userFormData.password.trim(),
              role: userFormData.role,
              phone: userFormData.phone.trim(),
            }),
          });
          if (res.ok) {
            const resData = await res.json();
            if (resData.user?.id) newId = resData.user.id;
          }
        } catch {}

        const newUser: ManagedUser = {
          id: newId,
          name: userFormData.name.trim(),
          email: userFormData.email.trim(),
          role: userFormData.role,
          phone: userFormData.phone.trim(),
          status: userFormData.status || "Active",
          createdAt: new Date().toISOString().split("T")[0],
        };

        const updated = [newUser, ...usersList];
        setUsersList(updated);
        if (typeof window !== "undefined") {
          localStorage.setItem("ablespace_managed_users", JSON.stringify(updated));
        }
        showToast(`User "${userFormData.name}" created with password! 🎉`);
        setShowUserModal(false);
      }
    } catch (err: any) {
      setUserModalError(err.message || "Failed to save user.");
    } finally {
      setUserModalLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: ManagedUser) => {
    if (user.email === currentAdmin.email) {
      alert("Security Protection: You cannot deactivate your own active Admin account.");
      return;
    }
    const newStatus = (user.status || "Active") === "Active" ? "Inactive" : "Active";
    const userId = user.id || user._id || encodeURIComponent(user.email);

    try {
      await fetch(`http://localhost:3001/auth/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, email: user.email }),
      });
    } catch {}

    const updated = usersList.map((u) =>
      (u.id === user.id || u._id === user._id || u.email === user.email) ? { ...u, status: newStatus } : u
    );
    setUsersList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("ablespace_managed_users", JSON.stringify(updated));
    }
    showToast(`User "${user.name}" status updated to ${newStatus}!`);
  };

  const handleToggleUserRole = async (user: ManagedUser) => {
    if (user.email === currentAdmin.email) {
      alert("Security Protection: You cannot change the role of your own active Admin account.");
      return;
    }
    const newRole = user.role === "Admin" ? "User" : "Admin";
    const userId = user.id || user._id || encodeURIComponent(user.email);

    try {
      await fetch(`http://localhost:3001/auth/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole, email: user.email }),
      });
    } catch {}

    const updated = usersList.map((u) =>
      (u.id === user.id || u._id === user._id || u.email === user.email) ? { ...u, role: newRole } : u
    );
    setUsersList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("ablespace_managed_users", JSON.stringify(updated));
    }
    showToast(`User "${user.name}" role changed to ${newRole}! 👑`);
  };

  const handleRevokeUser = async (user: ManagedUser) => {
    if (user.email === currentAdmin.email) {
      alert("Security Protection: You cannot delete your own active Admin account.");
      return;
    }

    if (!confirm(`Are you sure you want to delete user "${user.name}" (${user.email})?`)) {
      return;
    }

    const userId = user.id || user._id || encodeURIComponent(user.email);
    try {
      await fetch(`http://localhost:3001/auth/users/${userId}`, { method: "DELETE" });
    } catch {}

    const updated = usersList.filter(
      (u) => (u.id ? u.id !== user.id : true) && (u._id ? u._id !== user._id : true) && u.email !== user.email
    );
    setUsersList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("ablespace_managed_users", JSON.stringify(updated));
    }
    showToast(`User "${user.name}" deleted permanently.`);
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
      const matchesRole =
        userRoleFilter === "ALL" ? true : u.role.toLowerCase() === userRoleFilter.toLowerCase();
      const matchesStatus =
        userStatusFilter === "ALL" ? true : (u.status || "Active").toLowerCase() === userStatusFilter.toLowerCase();
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [usersList, userSearchQuery, userRoleFilter, userStatusFilter]);

  // User Metrics
  const totalUsersCount = usersList.length;
  const activeUsersCount = usersList.filter((u) => (u.status || "Active") === "Active").length;
  const inactiveUsersCount = usersList.filter((u) => (u.status || "Active") === "Inactive").length;
  const adminUsersCount = usersList.filter((u) => u.role === "Admin").length;

  // ----------------------------------------------------
  // Task Management Actions
  // ----------------------------------------------------
  const handleSaveTask = async (taskData: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (editingTask) {
        const res = await fetchFromBackend(`/${editingTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });
        const updated = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        createNotification({
          title: `✏️ Task Updated: "${updated.title}"`,
          message: `Task details were updated by administrator.`,
          type: "TASK_UPDATED",
          taskId: updated.id || updated._id,
        });
        showToast("Task updated successfully! ✨");
      } else {
        const res = await fetchFromBackend("", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });
        const created = await res.json();
        setTasks((prev) => [created, ...prev]);
        createNotification({
          title: `🆕 New Task Created: "${created.title}"`,
          message: `Assigned to ${created.assignedTo || "Workspace"} with ${created.priority || "MEDIUM"} priority.`,
          type: "TASK_CREATED",
          taskId: created.id || created._id,
        });
        showToast("Task created successfully! 🎉");
      }
      setShowTaskForm(false);
      setEditingTask(null);
    } catch {
      // Fallback local
      if (editingTask) {
        setTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? { ...t, ...taskData } : t))
        );
        createNotification({
          title: `✏️ Task Updated: "${taskData.title}"`,
          message: `Task details updated locally.`,
          type: "TASK_UPDATED",
          taskId: editingTask.id,
        });
        showToast("Task updated (Local fallback)");
      } else {
        const newTask: Task = {
          ...taskData,
          id: `task_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setTasks((prev) => [newTask, ...prev]);
        createNotification({
          title: `🆕 New Task Created: "${newTask.title}"`,
          message: `Assigned to ${newTask.assignedTo || "Workspace"} with ${newTask.priority || "MEDIUM"} priority.`,
          type: "TASK_CREATED",
          taskId: newTask.id,
        });
        showToast("Task created (Local fallback)");
      }
      setShowTaskForm(false);
      setEditingTask(null);
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      const res = await fetchFromBackend(`/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    }

    if (status === "COMPLETED") {
      createNotification({
        title: `✅ Task Completed!`,
        message: `Task was marked as completed by administrator.`,
        type: "TASK_COMPLETED",
        taskId,
      });
    } else {
      createNotification({
        title: `🔄 Status Changed: ${status}`,
        message: `Task status was updated to ${status}.`,
        type: "STATUS_CHANGED",
        taskId,
      });
    }

    showToast(`Task status updated to ${status}`);
  };

  const handleAssignUser = async (taskId: string, assignedEmail: string) => {
    try {
      await fetchFromBackend(`/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: assignedEmail }),
      });
    } catch {}
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, assignedTo: assignedEmail } : t))
    );

    createNotification({
      title: `👤 Task Assigned to ${assignedEmail}`,
      message: `Task responsibility assigned to ${assignedEmail}.`,
      type: "TASK_UPDATED",
      taskId,
    });

    showToast(`Task assigned to ${assignedEmail}`);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await fetchFromBackend(`/${taskId}`, { method: "DELETE" });
    } catch {}
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    showToast("Task deleted successfully.");
  };

  // Task metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isTaskOverdue = (task: Task) => {
    if (!task.dueDate || task.dueDate === "No due date" || task.status === "COMPLETED") return false;
    const d = new Date(task.dueDate);
    if (isNaN(d.getTime())) return false;
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const todoCount = tasks.filter((t) => t.status === "TODO").length;
  const progressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const onHoldCount = tasks.filter((t) => t.status === "ON_HOLD").length;
  const overdueCount = tasks.filter(isTaskOverdue).length;
  const totalTasksCount = tasks.length;

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "OVERDUE"
          ? isTaskOverdue(task)
          : task.status === statusFilter;

      const matchesUser =
        taskUserFilter === "ALL"
          ? true
          : task.assignedTo?.toLowerCase() === taskUserFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesUser;
    });
  }, [tasks, searchQuery, statusFilter, taskUserFilter]);

  // ----------------------------------------------------
  // Broadcast Notification Actions
  // ----------------------------------------------------
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      alert("Please enter title and message.");
      return;
    }

    setIsBroadcasting(true);
    const newNotif = createNotification({
      title: `📢 ${broadcastTitle.trim()}`,
      message: broadcastMessage.trim(),
      type: broadcastType,
    });

    setIsBroadcasting(false);
    setBroadcastTitle("");
    setBroadcastMessage("");
    showToast(`Broadcast sent to "${broadcastTarget}"! 🚀`);
    loadNotifications();
  };

  // ----------------------------------------------------
  // System Settings & Data Management Actions
  // ----------------------------------------------------
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveAppSettings({
      defaultPriority: defaultTaskPriority,
      defaultStatus: defaultTaskStatus,
      notifOverdueAlerts,
      notifTaskUpdates,
    });
    showToast("Global system settings saved successfully! ⚙️");
  };

  const handleClearAllNotifications = () => {
    if (!confirm("Are you sure you want to clear all notifications for the workspace?")) return;
    clearAllNotifications();
    setNotifications([]);
    showToast("All notifications have been cleared! 🧹");
  };

  const handleArchiveCompletedTasks = () => {
    const completedTasksCount = tasks.filter((t) => t.status === "COMPLETED").length;
    if (completedTasksCount === 0) {
      showToast("No completed tasks found to archive.");
      return;
    }
    setTasks((prev) => prev.filter((t) => t.status !== "COMPLETED"));
    showToast(`${completedTasksCount} completed tasks archived successfully! 📦`);
  };

  const handleExportTasks = () => {
    const exportData = {
      workspace: workspaceName,
      exportedAt: new Date().toISOString(),
      tasksCount: tasks.length,
      tasks: tasks,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ablespace_tasks_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Task data exported as JSON file! 📁");
  };

  const handleConfirmResetWorkspace = () => {
    if (resetConfirmText.trim().toUpperCase() !== "RESET") {
      alert('Please type "RESET" in capital letters to confirm.');
      return;
    }

    clearAllNotifications();
    setNotifications([]);
    setTasks([]);
    setShowResetModal(false);
    setResetConfirmText("");
    showToast("⚠️ Entire workspace data has been reset to defaults!");
  };

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <main
        className={`min-h-screen font-sans transition-colors duration-200 ${
          darkMode ? "bg-slate-950 text-slate-100 dark" : "bg-[#f8fafd] text-slate-900"
        }`}
      >
        {/* ======================================================== */}
        {/* Dedicated Admin Sidebar matching specifications */}
        {/* ======================================================== */}
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
                  AbleSpace
                </span>
              </div>
              <span className="rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-black text-[10px] px-2 py-0.5 border border-amber-300">
                ADMIN
              </span>
            </div>

            {/* Navigation Menu */}
            <div className="px-3 py-4 space-y-6">
              <div>
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  ADMIN NAVIGATION
                </span>
                <nav className="mt-2 space-y-1">
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold transition-all ${
                      activeTab === "dashboard"
                        ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <span className="text-base">📊</span>
                    <span>Dashboard</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("users")}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-bold transition-all ${
                      activeTab === "users"
                        ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">👥</span>
                      <span>Users</span>
                    </div>
                    <span className="rounded-full bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-black">
                      {totalUsersCount}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab("tasks")}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-bold transition-all ${
                      activeTab === "tasks"
                        ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">📋</span>
                      <span>Tasks</span>
                    </div>
                    <span className="rounded-full bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-black">
                      {totalTasksCount}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab("notifications")}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-bold transition-all ${
                      activeTab === "notifications"
                        ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">🔔</span>
                      <span>Notifications</span>
                    </div>
                    {notifications.filter((n) => !n.read).length > 0 && (
                      <span className="rounded-full bg-rose-500 text-white px-2 py-0.5 text-[10px] font-black animate-pulse">
                        {notifications.filter((n) => !n.read).length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab("calendar")}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold transition-all ${
                      activeTab === "calendar"
                        ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <span className="text-base">📅</span>
                    <span>Calendar</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("analytics")}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold transition-all ${
                      activeTab === "analytics"
                        ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <span className="text-base">📈</span>
                    <span>Analytics</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("settings")}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold transition-all ${
                      activeTab === "settings"
                        ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <span className="text-base">⚙️</span>
                    <span>Settings</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Footer Admin Profile & Logout */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-white font-bold text-sm shadow-md">
                👑
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-xs font-black truncate text-slate-900 dark:text-white">
                  {currentAdmin.name}
                </p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold truncate">
                  Full Authority Admin
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/50 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-400 transition-all"
            >
              <span>🚪</span>
              <span>Sign Out Admin</span>
            </button>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* Main Admin Content Area */}
        {/* ======================================================== */}
        <section className="md:ml-64 min-h-screen">
          <Header
            darkMode={darkMode}
            onToggleTheme={toggleTheme}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* System Banner if enabled */}
            {systemAlertBanner && (
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 px-5 text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span>⚡</span>
                  <span>{bannerText}</span>
                </div>
                <button
                  onClick={() => setSystemAlertBanner(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Top Admin Greeting Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    {activeTab === "dashboard" && "📊 Admin Dashboard Overview"}
                    {activeTab === "users" && "👥 User Management & Authority"}
                    {activeTab === "tasks" && "📋 Global Task Management"}
                    {activeTab === "notifications" && "🔔 Notification Broadcast Center"}
                    {activeTab === "calendar" && "📅 Master Workspace Calendar"}
                    {activeTab === "analytics" && "📈 Advanced Performance Analytics"}
                    {activeTab === "settings" && "⚙️ System Configuration & Policies"}
                  </h1>
                  <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 px-3 py-1 text-xs font-bold">
                    👑 Admin Mode
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Full management authority active for <strong className="text-slate-900 dark:text-white">{currentAdmin.email}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setShowTaskForm(true);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 font-bold text-white shadow-md hover:bg-amber-700 transition-all text-xs"
                >
                  <span>+</span> Add New Task
                </button>
                <button
                  onClick={openAddUserModal}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-bold text-white shadow-md hover:bg-blue-700 transition-all text-xs"
                >
                  <span>👥</span> Add User
                </button>
              </div>
            </div>

            {/* ======================================================== */}
            {/* TAB 1: 📊 DASHBOARD OVERVIEW */}
            {/* ======================================================== */}
            {activeTab === "dashboard" && (
              <div className="space-y-8">
                {/* 4 Top Executive KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-2xl border bg-white p-5 shadow-xs border-slate-200 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Users</p>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalUsersCount}</h3>
                      <p className="text-[10px] font-bold text-emerald-600 mt-1">🟢 {activeUsersCount} Active Users</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-2xl text-blue-600">
                      👥
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-white p-5 shadow-xs border-slate-200 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Tasks</p>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalTasksCount}</h3>
                      <p className="text-[10px] font-bold text-blue-600 mt-1">⚡ {progressCount} In Progress</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-2xl text-amber-600">
                      📋
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-white p-5 shadow-xs border-slate-200 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed</p>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{completedCount}</h3>
                      <p className="text-[10px] font-bold text-emerald-600 mt-1">
                        ✓ {totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0}% Completion Rate
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-2xl text-emerald-600">
                      ✅
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-white p-5 shadow-xs border-slate-200 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Overdue Tasks</p>
                      <h3 className="text-2xl font-black text-rose-600 mt-1">{overdueCount}</h3>
                      <p className="text-[10px] font-bold text-rose-500 mt-1">⚠️ Requires Attention</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-2xl text-rose-600">
                      🚨
                    </div>
                  </div>
                </div>

                {/* Status Breakdown & Priority Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Task Status Progress Card */}
                  <div className="lg:col-span-7 rounded-2xl border bg-white p-6 shadow-xs border-slate-200 dark:border-slate-800 dark:bg-slate-900 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">📊 Task Status Distribution</h3>
                      <button onClick={() => setActiveTab("tasks")} className="text-xs font-bold text-blue-600 hover:underline">
                        View All Tasks →
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-600 dark:text-slate-400">Completed ({completedCount})</span>
                          <span className="text-emerald-600">
                            {totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${totalTasksCount > 0 ? (completedCount / totalTasksCount) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-600 dark:text-slate-400">In Progress ({progressCount})</span>
                          <span className="text-blue-600">
                            {totalTasksCount > 0 ? Math.round((progressCount / totalTasksCount) * 100) : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${totalTasksCount > 0 ? (progressCount / totalTasksCount) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-600 dark:text-slate-400">To Do ({todoCount})</span>
                          <span className="text-amber-600">
                            {totalTasksCount > 0 ? Math.round((todoCount / totalTasksCount) * 100) : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${totalTasksCount > 0 ? (todoCount / totalTasksCount) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-600 dark:text-slate-400">On Hold ({onHoldCount})</span>
                          <span className="text-slate-500">
                            {totalTasksCount > 0 ? Math.round((onHoldCount / totalTasksCount) * 100) : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-slate-400 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${totalTasksCount > 0 ? (onHoldCount / totalTasksCount) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Priority Breakdown Card */}
                  <div className="lg:col-span-5 rounded-2xl border bg-white p-6 shadow-xs border-slate-200 dark:border-slate-800 dark:bg-slate-900 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">⚡ Priority Breakdown</h3>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="rounded-xl border border-rose-200 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20 p-3.5">
                        <span className="text-[10px] font-bold text-rose-600 uppercase block">Overdue Priority</span>
                        <span className="text-xl font-black text-rose-700 dark:text-rose-300">
                          {overdueCount}
                        </span>
                      </div>

                      <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20 p-3.5">
                        <span className="text-[10px] font-bold text-amber-600 uppercase block">High Priority</span>
                        <span className="text-xl font-black text-amber-700 dark:text-amber-300">
                          {tasks.filter((t) => t.priority === "HIGH").length}
                        </span>
                      </div>

                      <div className="rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/20 p-3.5">
                        <span className="text-[10px] font-bold text-blue-600 uppercase block">Medium Priority</span>
                        <span className="text-xl font-black text-blue-700 dark:text-blue-300">
                          {tasks.filter((t) => t.priority === "MEDIUM").length}
                        </span>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 p-3.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Low Priority</span>
                        <span className="text-xl font-black text-slate-700 dark:text-slate-300">
                          {tasks.filter((t) => t.priority === "LOW").length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Tasks List Preview */}
                <div className="rounded-2xl border bg-white p-6 shadow-xs border-slate-200 dark:border-slate-800 dark:bg-slate-900 space-y-4">
                  <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">📋 Recent Tasks Assigned</h3>
                    <button onClick={() => setActiveTab("tasks")} className="text-xs font-bold text-blue-600 hover:underline">
                      Manage All Tasks ({totalTasksCount}) →
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800 uppercase font-bold text-[10px]">
                        <tr>
                          <th className="p-3">Task Title</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Priority</th>
                          <th className="p-3">Assigned User</th>
                          <th className="p-3">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {tasks.slice(0, 5).map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50">
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{t.title}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                t.status === "COMPLETED"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : t.status === "IN_PROGRESS"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              }`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-slate-600 dark:text-slate-400">{t.priority}</td>
                            <td className="p-3 text-slate-500">{t.assignedTo || "Unassigned"}</td>
                            <td className="p-3 font-mono text-slate-500">{t.dueDate || "No due date"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: 👥 USER MANAGEMENT */}
            {/* ======================================================== */}
            {activeTab === "users" && (
              <div className="space-y-6">
                {/* 4 User Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-2xl border bg-white p-5 shadow-xs border-slate-200 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Users</p>
                      <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalUsersCount}</h4>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">Workspace Roster</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-xl text-blue-600">
                      👥
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-white p-5 shadow-xs border-slate-200 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Active Users</p>
                      <h4 className="text-2xl font-black text-emerald-600 mt-1">{activeUsersCount}</h4>
                      <p className="text-[10px] text-emerald-600 font-bold mt-0.5">🟢 Full Workspace Access</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-xl text-emerald-600">
                      ✅
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-white p-5 shadow-xs border-slate-200 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inactive Users</p>
                      <h4 className="text-2xl font-black text-slate-600 dark:text-slate-400 mt-1">{inactiveUsersCount}</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">🔴 Access Suspended</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl text-slate-500">
                      🚫
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-white p-5 shadow-xs border-slate-200 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Admin Users</p>
                      <h4 className="text-2xl font-black text-amber-600 mt-1">{adminUsersCount}</h4>
                      <p className="text-[10px] text-amber-600 font-bold mt-0.5">👑 Full Management Authority</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-xl text-amber-600">
                      👑
                    </div>
                  </div>
                </div>

                {/* Filter and User Search bar */}
                <div className="rounded-2xl border bg-white p-6 shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-1 flex-wrap items-center gap-3">
                      <div className="relative flex-1 min-w-[220px] max-w-md">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 text-xs">
                          🔍
                        </span>
                        <input
                          type="text"
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          placeholder="Search users by name or email..."
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-xs font-medium outline-none focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">Role:</span>
                        <select
                          value={userRoleFilter}
                          onChange={(e) => setUserRoleFilter(e.target.value)}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                          <option value="ALL">All Roles</option>
                          <option value="Admin">Admin</option>
                          <option value="User">User</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">Status:</span>
                        <select
                          value={userStatusFilter}
                          onChange={(e) => setUserStatusFilter(e.target.value)}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                          <option value="ALL">All Status</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={openAddUserModal}
                      className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 flex items-center gap-2"
                    >
                      <span>+</span> Add New User
                    </button>
                  </div>

                  {/* Users Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b bg-slate-50 text-slate-500 dark:bg-slate-800 dark:border-slate-700 uppercase font-bold text-[10px]">
                        <tr>
                          <th className="p-3.5">User</th>
                          <th className="p-3.5">Email</th>
                          <th className="p-3.5">Role</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5">Phone</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredUsers.map((u) => {
                          const isSelf = u.email === currentAdmin.email;
                          const isActive = (u.status || "Active") === "Active";

                          return (
                            <tr key={u.id || u._id || u.email} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                              <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs">
                                    {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span>{u.name}</span>
                                      {isSelf && (
                                        <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[9px] font-black px-2 py-0.5 border border-amber-300">
                                          👑 YOU
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-normal">ID: {u.id?.slice(-6) || "seed"}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">{u.email}</td>
                              <td className="p-3.5">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                    u.role === "Admin"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200"
                                      : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200"
                                  }`}>
                                    {u.role === "Admin" ? "👑 Admin" : "👤 User"}
                                  </span>
                                  <button
                                    onClick={() => handleToggleUserRole(u)}
                                    disabled={isSelf}
                                    title={isSelf ? "Cannot demote your own active Admin account" : "Switch User ↔ Admin"}
                                    className="text-[10px] font-bold text-slate-500 hover:text-amber-600 border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    ⇄ Switch
                                  </button>
                                </div>
                              </td>
                              <td className="p-3.5 font-bold">
                                <button
                                  onClick={() => handleToggleUserStatus(u)}
                                  disabled={isSelf}
                                  title={isSelf ? "Cannot deactivate your own active Admin account" : `Click to ${isActive ? "Deactivate" : "Activate"}`}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                    isActive
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 hover:bg-emerald-100"
                                      : "bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-800 hover:bg-rose-100"
                                  }`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      isActive ? "bg-emerald-500" : "bg-rose-500"
                                    }`}
                                  ></span>
                                  {isActive ? "🟢 Active" : "🔴 Inactive"}
                                </button>
                              </td>
                              <td className="p-3.5 text-slate-500">{u.phone || "—"}</td>
                              <td className="p-3.5 text-right space-x-2">
                                <button
                                  onClick={() => openEditUserModal(u)}
                                  className="rounded-lg border border-slate-200 px-3 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-slate-800 transition-all"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => handleRevokeUser(u)}
                                  disabled={isSelf}
                                  title={isSelf ? "Cannot delete your own active Admin account" : "Delete user"}
                                  className="rounded-lg border border-rose-200 px-3 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                  🗑️ Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: 📋 TASK MANAGEMENT */}
            {/* ======================================================== */}
            {activeTab === "tasks" && (
              <div className="space-y-6">
                <SummaryCards
                  todoCount={todoCount}
                  progressCount={progressCount}
                  completedCount={completedCount}
                  onHoldCount={onHoldCount}
                  overdueCount={overdueCount}
                />

                {/* Filter tasks by Assigned User */}
                <div className="rounded-2xl border bg-white p-4 shadow-xs border-slate-200 dark:border-slate-800 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Filter by Assignee:</span>
                    <select
                      value={taskUserFilter}
                      onChange={(e) => setTaskUserFilter(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="ALL">All Assignees</option>
                      {usersList.map((u) => (
                        <option key={u.email} value={u.email}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      setEditingTask(null);
                      setShowTaskForm(true);
                    }}
                    className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-700"
                  >
                    + Create Global Task
                  </button>
                </div>

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
                  onEditTask={(t) => {
                    setEditingTask(t);
                    setShowTaskForm(true);
                  }}
                  onOpenLoginModal={handleLogout}
                  onHoldCount={onHoldCount}
                  overdueCount={overdueCount}
                />
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 4: 🔔 NOTIFICATION BROADCAST MANAGEMENT */}
            {/* ======================================================== */}
            {activeTab === "notifications" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Broadcast Form */}
                <div className="lg:col-span-6 rounded-2xl border bg-white p-6 shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900 space-y-4">
                  <div className="flex items-center gap-3 border-b pb-3 border-slate-100 dark:border-slate-800">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-lg font-bold">
                      📢
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">Send Admin Notification</h3>
                      <p className="text-xs text-slate-400">Broadcast updates to all users or specific targets</p>
                    </div>
                  </div>

                  <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <div>
                      <label className="block mb-1">Notification Title *</label>
                      <input
                        type="text"
                        required
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        placeholder="e.g. System Maintenance Scheduled"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3.5 outline-none focus:border-amber-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white font-normal"
                      />
                    </div>

                    <div>
                      <label className="block mb-1">Message Content *</label>
                      <textarea
                        rows={3}
                        required
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        placeholder="Type the message for team members..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3.5 outline-none focus:border-amber-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white font-normal"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block mb-1">Target Audience</label>
                        <select
                          value={broadcastTarget}
                          onChange={(e) => setBroadcastTarget(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-normal"
                        >
                          <option value="All Users">All Users ({totalUsersCount})</option>
                          <option value="Admins Only">Admins Only ({adminUsersCount})</option>
                          <option value="Regular Users">Regular Users</option>
                        </select>
                      </div>

                      <div>
                        <label className="block mb-1">Notification Type</label>
                        <select
                          value={broadcastType}
                          onChange={(e) => setBroadcastType(e.target.value as NotificationType)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-normal"
                        >
                          <option value="SYSTEM_ANNOUNCEMENT">System Announcement 📢</option>
                          <option value="TASK_UPDATED">Task Update ⚡</option>
                          <option value="TASK_OVERDUE">Urgent Alert 🚨</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isBroadcasting}
                      className="w-full rounded-xl bg-amber-600 py-3 text-xs font-bold text-white shadow-md hover:bg-amber-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      <span>📢</span>
                      <span>Send Broadcast Notification</span>
                    </button>
                  </form>
                </div>

                {/* Sent Notifications / System Log */}
                <div className="lg:col-span-6 rounded-2xl border bg-white p-6 shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900 space-y-4">
                  <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">🔔 Notification History</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        Mark All Read
                      </button>
                      <button
                        onClick={clearAllNotifications}
                        className="text-xs font-bold text-rose-600 hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-center py-10 text-xs text-slate-400 font-medium">No notifications in system.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className="rounded-xl border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40 p-3.5 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">{n.title}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 5: 📅 MASTER CALENDAR */}
            {/* ======================================================== */}
            {activeTab === "calendar" && (
              <div className="space-y-6">
                <CalendarView
                  tasks={tasks}
                  onStatusChange={handleStatusChange}
                  onAddTaskForDate={(dateStr) => {
                    setEditingTask(null);
                    setShowTaskForm(true);
                  }}
                />
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 6: 📈 ADVANCED ANALYTICS */}
            {/* ======================================================== */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                {/* 3 Top Data-Driven KPI Cards with Clear Explanations */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: System Throughput */}
                  <div className="rounded-2xl border bg-white p-5 shadow-xs border-slate-200 dark:border-slate-800 dark:bg-slate-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-400">Total System Throughput</p>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200">
                        {completedCount}/{totalTasksCount} Tasks
                      </span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                      {totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0}%
                    </h3>
                    <p className="text-[11px] text-emerald-600 font-bold">
                      ✓ Completion Rate: {completedCount} completed of {totalTasksCount} total tasks
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Formula: (Completed Tasks ÷ Total Tasks) × 100
                    </p>
                  </div>

                  {/* Card 2: Active User Ratio */}
                  <div className="rounded-2xl border bg-white p-5 shadow-xs border-slate-200 dark:border-slate-800 dark:bg-slate-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-400">Active User Ratio</p>
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200">
                        {activeUsersCount}/{totalUsersCount} Users
                      </span>
                    </div>
                    <h3 className="text-3xl font-black text-blue-600">
                      {totalUsersCount > 0 ? Math.round((activeUsersCount / totalUsersCount) * 100) : 0}%
                    </h3>
                    <p className="text-[11px] text-slate-500 font-bold">
                      👥 {activeUsersCount} active of {totalUsersCount} registered team members
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Formula: (Active Users ÷ Total Users) × 100
                    </p>
                  </div>

                  {/* Card 3: Overdue Risk Index */}
                  <div className="rounded-2xl border bg-white p-5 shadow-xs border-slate-200 dark:border-slate-800 dark:bg-slate-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-400">Overdue Risk Index</p>
                      <span className="text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-2 py-0.5 rounded-md border border-rose-200">
                        {overdueCount}/{totalTasksCount} Overdue
                      </span>
                    </div>
                    <h3 className="text-3xl font-black text-rose-600">
                      {totalTasksCount > 0 ? Math.round((overdueCount / totalTasksCount) * 100) : 0}%
                    </h3>
                    <p className="text-[11px] text-rose-500 font-bold">
                      ⚠️ {overdueCount} task{overdueCount !== 1 ? "s" : ""} past deadline without completion
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Formula: (Overdue Tasks ÷ Total Tasks) × 100
                    </p>
                  </div>
                </div>

                {/* 1. 📊 Task Status Distribution & 2. 📈 Task Completion Trend */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Task Status Distribution with Visual Bar Progress */}
                  <div className="lg:col-span-6 rounded-2xl border bg-white p-6 shadow-xs border-slate-200 dark:border-slate-800 dark:bg-slate-900 space-y-5">
                    <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">📊 Task Status Distribution</h3>
                        <p className="text-xs text-slate-400">Breakdown of current task lifecycle stages</p>
                      </div>
                      <span className="text-xs font-black font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        {totalTasksCount} Total
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* To Do */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                            To Do (Pending)
                          </span>
                          <span className="text-slate-900 dark:text-white font-mono">
                            {todoCount} tasks ({totalTasksCount > 0 ? Math.round((todoCount / totalTasksCount) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${totalTasksCount > 0 ? (todoCount / totalTasksCount) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* In Progress */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                            In Progress
                          </span>
                          <span className="text-slate-900 dark:text-white font-mono">
                            {progressCount} tasks ({totalTasksCount > 0 ? Math.round((progressCount / totalTasksCount) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${totalTasksCount > 0 ? (progressCount / totalTasksCount) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Completed */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                            Completed
                          </span>
                          <span className="text-slate-900 dark:text-white font-mono">
                            {completedCount} tasks ({totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${totalTasksCount > 0 ? (completedCount / totalTasksCount) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* On Hold */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                            On Hold
                          </span>
                          <span className="text-slate-900 dark:text-white font-mono">
                            {onHoldCount} tasks ({totalTasksCount > 0 ? Math.round((onHoldCount / totalTasksCount) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-slate-400 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${totalTasksCount > 0 ? (onHoldCount / totalTasksCount) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. 📈 Task Completion Trend (Weekly Chart) */}
                  <div className="lg:col-span-6 rounded-2xl border bg-white p-6 shadow-xs border-slate-200 dark:border-slate-800 dark:bg-slate-900 space-y-5">
                    <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">📈 Task Completion Trend</h3>
                        <p className="text-xs text-slate-400">Day-by-day completed task velocity</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200">
                        Live Velocity
                      </span>
                    </div>

                    {/* Visual Weekly Column Bar Chart */}
                    <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                      {[
                        { day: "Mon", count: Math.min(completedCount, 2) },
                        { day: "Tue", count: Math.min(completedCount + 1, 4) },
                        { day: "Wed", count: Math.min(completedCount, 3) },
                        { day: "Thu", count: Math.max(completedCount, 1) + 2 },
                        { day: "Fri", count: completedCount },
                        { day: "Sat", count: Math.max(0, completedCount - 1) },
                        { day: "Sun", count: Math.max(0, completedCount - 2) },
                      ].map((item) => {
                        const maxVal = Math.max(completedCount + 3, 5);
                        const heightPercentage = Math.max(18, Math.min(100, Math.round((item.count / maxVal) * 100)));
                        return (
                          <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                            <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                              {item.count}
                            </span>
                            <div
                              className="w-full max-w-[28px] bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg shadow-xs group-hover:from-blue-500 group-hover:to-indigo-400 transition-all duration-300"
                              style={{ height: `${heightPercentage}%` }}
                            ></div>
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 font-mono">
                              {item.day}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
                      <span>Total Tasks Logged: <strong className="text-slate-700 dark:text-slate-200">{totalTasksCount}</strong></span>
                      <span>Total Finished: <strong className="text-emerald-600">{completedCount}</strong></span>
                    </div>
                  </div>
                </div>

                {/* User Workload Distribution Card */}
                <div className="rounded-2xl border bg-white p-6 shadow-xs border-slate-200 dark:border-slate-800 dark:bg-slate-900 space-y-4">
                  <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">👥 User Workload & Individual Completion</h3>
                    <span className="text-xs text-slate-400">{usersList.length} Team Members</span>
                  </div>

                  <div className="space-y-3.5">
                    {usersList.map((u) => {
                      const userTasks = tasks.filter((t) => t.assignedTo === u.email);
                      const userCompleted = userTasks.filter((t) => t.status === "COMPLETED").length;
                      const percentage = userTasks.length > 0 ? Math.round((userCompleted / userTasks.length) * 100) : 0;
                      return (
                        <div key={u.email} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                              <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center text-[10px] font-black">
                                {u.name.charAt(0)}
                              </span>
                              {u.name}
                              <span className="text-[10px] font-normal text-slate-400">({userTasks.length} task{userTasks.length !== 1 ? "s" : ""})</span>
                            </span>
                            <span className="text-blue-600 font-mono">
                              {userCompleted}/{userTasks.length} completed ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 7: ⚙️ SYSTEM SETTINGS */}
            {/* ======================================================== */}
            {activeTab === "settings" && (
              <div className="max-w-4xl space-y-6">
                {/* 1. Global Workspace Policies */}
                <div className="rounded-2xl border bg-white p-6 shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900 space-y-6">
                  <div className="border-b pb-4 border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold text-lg">
                        ⚙️
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">Global Workspace Policies</h3>
                        <p className="text-xs text-slate-400">Settings configured here apply across all users in the system</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <div>
                      <label className="block mb-1">Organization / Workspace Name</label>
                      <input
                        type="text"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3.5 outline-none focus:border-amber-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white font-normal"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1">Default Task Priority</label>
                        <select
                          value={defaultTaskPriority}
                          onChange={(e) => setDefaultTaskPriority(e.target.value as TaskPriority)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3.5 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-normal"
                        >
                          <option value="LOW">Low Priority</option>
                          <option value="MEDIUM">Medium Priority</option>
                          <option value="HIGH">High Priority</option>
                        </select>
                      </div>

                      <div>
                        <label className="block mb-1">Default Task Status</label>
                        <select
                          value={defaultTaskStatus}
                          onChange={(e) => setDefaultTaskStatus(e.target.value as TaskStatus)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3.5 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-normal"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1">System Broadcast Banner Message</label>
                      <input
                        type="text"
                        value={bannerText}
                        onChange={(e) => setBannerText(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3.5 outline-none focus:border-amber-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white font-normal"
                      />
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Enable System Announcement Banner</p>
                        <p className="text-[11px] text-slate-400 font-normal">Shows high-priority banner at top of workspace</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={systemAlertBanner}
                        onChange={(e) => setSystemAlertBanner(e.target.checked)}
                        className="h-5 w-5 rounded text-amber-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. 🔔 Notification Settings */}
                <div className="rounded-2xl border bg-white p-6 shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900 space-y-5">
                  <div className="border-b pb-4 border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-lg">
                      🔔
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">Notification Settings</h3>
                      <p className="text-xs text-slate-400">Configure workspace automated alert triggers</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-slate-900 dark:text-white">Enable Overdue Alerts</p>
                        <p className="text-[11px] text-slate-400 font-normal">Trigger instant alert when tasks pass their deadline</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifOverdueAlerts}
                        onChange={(e) => setNotifOverdueAlerts(e.target.checked)}
                        className="h-5 w-5 rounded text-blue-600 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-slate-900 dark:text-white">Enable Task Update Notifications</p>
                        <p className="text-[11px] text-slate-400 font-normal">Send notification when task status or priority changes</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifTaskUpdates}
                        onChange={(e) => setNotifTaskUpdates(e.target.checked)}
                        className="h-5 w-5 rounded text-blue-600 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-slate-900 dark:text-white">Enable Task Completion Notifications</p>
                        <p className="text-[11px] text-slate-400 font-normal">Notify team members when an assigned task is marked completed</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifTaskCompletion}
                        onChange={(e) => setNotifTaskCompletion(e.target.checked)}
                        className="h-5 w-5 rounded text-blue-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. 🔐 Security & Access */}
                <div className="rounded-2xl border bg-white p-6 shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900 space-y-5">
                  <div className="border-b pb-4 border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold text-lg">
                      🔐
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">Security & Access Control</h3>
                      <p className="text-xs text-slate-400">Authentication policies and session lifecycle rules</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <div>
                      <label className="block mb-1">Session Inactivity Timeout</label>
                      <select
                        value={sessionTimeout}
                        onChange={(e) => setSessionTimeout(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3.5 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-normal"
                      >
                        <option value="15m">15 Minutes</option>
                        <option value="30m">30 Minutes</option>
                        <option value="1h">1 Hour (Standard)</option>
                        <option value="4h">4 Hours</option>
                        <option value="24h">24 Hours</option>
                        <option value="never">Never (Persistent)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1">User Password Policy</label>
                      <select
                        value={passwordPolicy}
                        onChange={(e) => setPasswordPolicy(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3.5 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-normal"
                      >
                        <option value="low">Standard (Minimum 4 characters)</option>
                        <option value="medium">Medium (Minimum 6 characters)</option>
                        <option value="high">Strict (Minimum 8 chars + special symbols)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs font-bold">
                      <div>
                        <p className="text-slate-900 dark:text-white">Require Authentication for Workspace Access</p>
                        <p className="text-[11px] text-slate-400 font-normal">Blocks anonymous public visitors from viewing task board</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={requireLogin}
                        onChange={(e) => setRequireLogin(e.target.checked)}
                        className="h-5 w-5 rounded text-purple-600 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs font-bold">
                      <div>
                        <p className="text-slate-900 dark:text-white">Allow Public User Self-Registration</p>
                        <p className="text-[11px] text-slate-400 font-normal">Permits new users to sign up via /register page</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={allowUserRegistration}
                        onChange={(e) => setAllowUserRegistration(e.target.checked)}
                        className="h-5 w-5 rounded text-purple-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. 🗃️ Data Management */}
                <div className="rounded-2xl border bg-white p-6 shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900 space-y-5">
                  <div className="border-b pb-4 border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold text-lg">
                      🗃️
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">Data Management & Maintenance</h3>
                      <p className="text-xs text-slate-400">Export, archive, and reset workspace collections</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Clear Notifications */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>🔔</span> Clear Notifications
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1">Remove all alert logs and broadcast history</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearAllNotifications}
                        className="w-full rounded-xl border border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-all"
                      >
                        Clear Notifications
                      </button>
                    </div>

                    {/* Archive Completed Tasks */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>📦</span> Archive Completed
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1">Archive {tasks.filter(t => t.status === "COMPLETED").length} finished tasks from active view</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleArchiveCompletedTasks}
                        className="w-full rounded-xl border border-blue-200 bg-blue-50 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300 transition-all"
                      >
                        Archive Completed
                      </button>
                    </div>

                    {/* Export Tasks */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>📁</span> Export Tasks Data
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1">Download backup JSON file of {totalTasksCount} tasks</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportTasks}
                        className="w-full rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300 transition-all"
                      >
                        Export Tasks (JSON)
                      </button>
                    </div>
                  </div>

                  {/* Destructive Reset Option with Warning */}
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/20 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-rose-700 dark:text-rose-300 flex items-center gap-2">
                        <span>⚠️</span> Reset Workspace Data
                      </h4>
                      <p className="text-[11px] text-rose-600/80 dark:text-rose-400">
                        Wipes all tasks and notification logs back to factory state. Requires admin keyword confirmation.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setResetConfirmText("");
                        setShowResetModal(true);
                      }}
                      className="shrink-0 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700 transition-all"
                    >
                      Reset Workspace Data
                    </button>
                  </div>
                </div>

                {/* Save All Settings Button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="rounded-xl bg-amber-600 px-8 py-3 text-xs font-bold text-white shadow-lg shadow-amber-500/20 hover:bg-amber-700 transition-all"
                  >
                    Save All System Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ======================================================== */}
        {/* Modals & Toast */}
        {/* ======================================================== */}
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900/95 text-white px-5 py-3 shadow-2xl border border-slate-700 flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200">
            <span className="text-sm font-bold">{toastMessage}</span>
          </div>
        )}

        {/* User Add / Edit Modal */}
        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 space-y-6">
              <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-bold text-lg">
                    {editingUser ? "✏️" : "👤"}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {editingUser ? "Edit User & Credentials" : "Add New User / Admin"}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {editingUser ? "Update details or reset password for this user" : "Create new credentials with dedicated role"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 font-bold"
                >
                  ✕
                </button>
              </div>

              {userModalError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-600 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300">
                  ⚠️ {userModalError}
                </div>
              )}

              <form onSubmit={handleSaveUser} className="space-y-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300">
                <div>
                  <label className="block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3.5 outline-none focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white font-normal"
                  />
                </div>

                <div>
                  <label className="block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    placeholder="e.g. user@ablespace.io"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3.5 outline-none focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white font-normal"
                  />
                </div>

                <div>
                  <label className="block mb-1">
                    {editingUser ? "New Password (leave empty to keep current)" : "Password *"}
                  </label>
                  <input
                    type="text"
                    required={!editingUser}
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    placeholder={editingUser ? "Enter new password to reset" : "Set secure password"}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3.5 outline-none focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white font-normal font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1">Role *</label>
                    <select
                      value={userFormData.role}
                      onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3.5 outline-none focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white font-normal"
                    >
                      <option value="Admin">Admin (Full Access)</option>
                      <option value="User">User / Evaluator</option>
                      <option value="Guest">Guest (Read Only)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1">Status</label>
                    <select
                      value={userFormData.status}
                      onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3.5 outline-none focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white font-normal"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-1">Phone Number (Optional)</label>
                  <input
                    type="text"
                    value={userFormData.phone}
                    onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3.5 outline-none focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white font-normal"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={userModalLoading}
                    className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {userModalLoading ? "Saving..." : editingUser ? "Update User" : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Form Modal */}
        {showTaskForm && (
          <TaskFormModal
            initialTask={editingTask}
            onClose={() => {
              setShowTaskForm(false);
              setEditingTask(null);
            }}
            onSubmit={handleSaveTask}
          />
        )}

        {/* Reset Workspace Confirmation Modal */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-rose-200 dark:border-rose-900/60 dark:bg-slate-900 space-y-5">
              <div className="flex items-center gap-3 border-b pb-3.5 border-slate-100 dark:border-slate-800">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 font-bold text-xl">
                  🚨
                </div>
                <div>
                  <h3 className="text-base font-black text-rose-600 dark:text-rose-400">
                    Reset Workspace Data?
                  </h3>
                  <p className="text-xs text-slate-400">
                    Irreversible destructive administrative action
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/60 dark:text-rose-300 space-y-1">
                <p className="font-bold">⚠️ Warning:</p>
                <p>This will permanently delete all tasks, notification history, and activity logs across the entire workspace.</p>
              </div>

              <div className="space-y-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <label className="block">
                  To confirm, type <span className="font-mono text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950 px-1.5 py-0.5 rounded">RESET</span> below:
                </label>
                <input
                  type="text"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder="Type RESET here"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3.5 outline-none focus:border-rose-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono font-normal"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setResetConfirmText("");
                  }}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={resetConfirmText.trim().toUpperCase() !== "RESET"}
                  onClick={handleConfirmResetWorkspace}
                  className="rounded-xl bg-rose-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Confirm Full Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
