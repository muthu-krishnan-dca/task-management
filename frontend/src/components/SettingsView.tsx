"use client";

import { useEffect, useRef, useState } from "react";
import { getUserProfile, saveUserProfile, UserProfile } from "@/utils/userStore";
import {
  AppSettings,
  DEFAULT_SETTINGS,
  getAppSettings,
  resetAppSettings,
  saveAppSettings,
} from "@/utils/settingsStore";
import { applyTheme, ThemeMode } from "@/utils/themeStore";
import { TaskPriority, TaskStatus } from "@/types/task";

interface SettingsViewProps {
  darkMode?: boolean;
  currentUser?: { name: string; role: string; email: string };
  onThemeChange?: (mode: ThemeMode) => void;
  onUpdateUser?: (updated: { name: string; email: string }) => void;
}

export function SettingsView({
  onThemeChange,
  onUpdateUser,
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<
    "appearance" | "account" | "notifications" | "preferences"
  >("appearance");

  // 1. Account Settings State
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2. App Settings State
  const [settings, setSettings] = useState<AppSettings>(getAppSettings());
  const [themeMode, setThemeMode] = useState<ThemeMode>(settings.themeMode);
  const [notifTaskUpdates, setNotifTaskUpdates] = useState(settings.notifTaskUpdates);
  const [notifDueDateReminders, setNotifDueDateReminders] = useState(settings.notifDueDateReminders);
  const [notifOverdueAlerts, setNotifOverdueAlerts] = useState(settings.notifOverdueAlerts);
  const [defaultPriority, setDefaultPriority] = useState<TaskPriority>(settings.defaultPriority);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>(settings.defaultStatus);
  const [defaultEstimatedDuration, setDefaultEstimatedDuration] = useState(settings.defaultEstimatedDuration);

  // Toast / Alert State
  const [toastMsg, setToastMsg] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg("");
    }, 3500);
  };

  const loadAll = () => {
    const currentProfile = getUserProfile();
    setProfile(currentProfile);
    setName(currentProfile.name);
    setEmail(currentProfile.email);
    setPhone(currentProfile.phone || "");
    setAvatarUrl(currentProfile.avatarUrl || "");

    const currentSettings = getAppSettings();
    setSettings(currentSettings);
    setThemeMode(currentSettings.themeMode);
    setNotifTaskUpdates(currentSettings.notifTaskUpdates);
    setNotifDueDateReminders(currentSettings.notifDueDateReminders);
    setNotifOverdueAlerts(currentSettings.notifOverdueAlerts);
    setDefaultPriority(currentSettings.defaultPriority);
    setDefaultStatus(currentSettings.defaultStatus);
    setDefaultEstimatedDuration(currentSettings.defaultEstimatedDuration);
  };

  useEffect(() => {
    loadAll();

    const handleSettingsUpdate = () => loadAll();
    window.addEventListener("settingsUpdated", handleSettingsUpdate);
    window.addEventListener("userProfileUpdated", handleSettingsUpdate);

    return () => {
      window.removeEventListener("settingsUpdated", handleSettingsUpdate);
      window.removeEventListener("userProfileUpdated", handleSettingsUpdate);
    };
  }, []);

  // Theme selection handler
  const handleSelectTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    applyTheme(mode);
    onThemeChange?.(mode);
  };

  // Image Upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result as string;
        setAvatarUrl(base64Url);
        saveUserProfile({ avatarUrl: base64Url });
        triggerToast("Profile picture updated! 📸");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setAvatarUrl("");
    saveUserProfile({ avatarUrl: "" });
    triggerToast("Profile picture removed! 🗑️");
  };

  // Validation
  const validateAccount = () => {
    const newErrors: { name?: string; email?: string } = {};
    if (!name.trim()) {
      newErrors.name = "Full Name cannot be empty.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save Changes
  const handleSaveChanges = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateAccount()) {
      setActiveTab("account");
      return;
    }

    // 1. Save Profile
    const updatedProfile = saveUserProfile({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      avatarUrl,
    });
    setProfile(updatedProfile);
    onUpdateUser?.({ name: updatedProfile.name, email: updatedProfile.email });

    // 2. Save App Settings
    const updatedSettings = saveAppSettings({
      themeMode,
      notifTaskUpdates,
      notifDueDateReminders,
      notifOverdueAlerts,
      defaultPriority,
      defaultStatus,
      defaultEstimatedDuration,
    });
    setSettings(updatedSettings);

    triggerToast("Settings saved successfully! ✨");
  };

  // Cancel / Discard Changes
  const handleCancel = () => {
    loadAll();
    setErrors({});
    triggerToast("Unsaved changes discarded.");
  };

  // Reset to Defaults
  const handleResetToDefaults = () => {
    if (
      !confirm(
        "Are you sure you want to reset all preferences to factory defaults?"
      )
    )
      return;

    const reset = resetAppSettings();
    setSettings(reset);
    setThemeMode(reset.themeMode);
    setNotifTaskUpdates(reset.notifTaskUpdates);
    setNotifDueDateReminders(reset.notifDueDateReminders);
    setNotifOverdueAlerts(reset.notifOverdueAlerts);
    setDefaultPriority(reset.defaultPriority);
    setDefaultStatus(reset.defaultStatus);
    setDefaultEstimatedDuration(reset.defaultEstimatedDuration);

    triggerToast("Settings reset to defaults! 🔄");
  };

  const userInitial = (name || "U").charAt(0).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/*"
        className="hidden"
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 p-4 rounded-2xl bg-emerald-600 text-white font-bold shadow-2xl animate-in slide-in-from-top-3 text-sm">
          <span>✓</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            ⚙️ Workspace Settings
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage your account details, appearance themes, notifications, and default task preferences.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            className="rounded-lg bg-black dark:bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-gray-800 dark:hover:bg-indigo-500 transition shadow-xs"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Main Settings Layout with Sidebar Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Navigation Tabs */}
        <div className="space-y-1">
          {[
            { id: "appearance" as const, label: "Appearance", icon: "🎨", desc: "Themes & dark mode" },
            { id: "account" as const, label: "Account Info", icon: "👤", desc: "Profile details" },
            { id: "notifications" as const, label: "Notifications", icon: "🔔", desc: "Alerts & reminders" },
            { id: "preferences" as const, label: "Task Defaults", icon: "📋", desc: "Priority & status" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all ${
                activeTab === tab.id
                  ? "bg-black dark:bg-indigo-600 text-white font-semibold shadow-xs"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200/80 dark:border-gray-800"
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{tab.label}</p>
                <p
                  className={`text-[10px] truncate ${
                    activeTab === tab.id
                      ? "text-gray-300 dark:text-indigo-200"
                      : "text-gray-400"
                  }`}
                >
                  {tab.desc}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Tab Content Panels */}
        <div className="md:col-span-3">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6 sm:p-7 shadow-xs">
            
            {/* 1. APPEARANCE TAB */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>🎨</span> Appearance & Theme Mode
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Select your preferred interface display mode. Changes apply immediately.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  {[
                    { mode: "light" as const, label: "Light Mode", icon: "☀️", desc: "Clean white & slate theme" },
                    { mode: "dark" as const, label: "Dark Mode", icon: "🌙", desc: "Sleek dark contrast theme" },
                    { mode: "system" as const, label: "System Default", icon: "💻", desc: "Sync automatically with OS" },
                  ].map((item) => (
                    <button
                      key={item.mode}
                      type="button"
                      onClick={() => handleSelectTheme(item.mode)}
                      className={`flex flex-col gap-2 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        themeMode === item.mode
                          ? "border-black dark:border-indigo-500 bg-gray-50 dark:bg-gray-700/60 ring-2 ring-black/10 dark:ring-indigo-500/30"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{item.icon}</span>
                        {themeMode === item.mode && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black dark:bg-indigo-600 text-[10px] text-white">
                            ✓
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. ACCOUNT INFO TAB */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>👤</span> Account Information
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Update your public user name, contact email, and workspace profile photo.
                  </p>
                </div>

                {/* Profile Photo Upload */}
                <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-purple-600 font-bold text-white text-xl overflow-hidden border-2 border-purple-200 dark:border-purple-800">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      userInitial
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      Profile Avatar
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-lg bg-black dark:bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-800 dark:hover:bg-indigo-500 transition"
                      >
                        {avatarUrl ? "Change Photo" : "Upload Photo"}
                      </button>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      className={`w-full rounded-lg border px-3.5 py-2 text-xs font-medium outline-none transition ${
                        errors.name
                          ? "border-red-500 bg-red-50/30"
                          : "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500"
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      className={`w-full rounded-lg border px-3.5 py-2 text-xs font-medium outline-none transition ${
                        errors.email
                          ? "border-red-500 bg-red-50/30"
                          : "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500"
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white px-3.5 py-2 text-xs font-medium outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. NOTIFICATIONS PREFERENCES TAB */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>🔔</span> Notification Preferences
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Choose which activities trigger notifications and alerts in your dashboard.
                  </p>
                </div>

                <div className="space-y-3 pt-2 divide-y divide-gray-100 dark:divide-gray-700">
                  {/* Task Updates Toggle */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        Task Updates & Changes
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Receive alerts when tasks are created, edited, duplicated, or status changes.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifTaskUpdates(!notifTaskUpdates)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                        notifTaskUpdates ? "bg-black dark:bg-indigo-600" : "bg-gray-300 dark:bg-gray-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                          notifTaskUpdates ? "translate-x-5" : "translate-x-0.5"
                        } mt-0.5`}
                      />
                    </button>
                  </div>

                  {/* Due Date Reminders Toggle */}
                  <div className="flex items-center justify-between pt-4">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        Due Date Reminders
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Get notified when a task deadline is approaching today or tomorrow.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifDueDateReminders(!notifDueDateReminders)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                        notifDueDateReminders ? "bg-black dark:bg-indigo-600" : "bg-gray-300 dark:bg-gray-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                          notifDueDateReminders ? "translate-x-5" : "translate-x-0.5"
                        } mt-0.5`}
                      />
                    </button>
                  </div>

                  {/* Overdue Alerts Toggle */}
                  <div className="flex items-center justify-between pt-4">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        Overdue Task Alerts
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Display high-priority warning notifications when task due dates pass.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifOverdueAlerts(!notifOverdueAlerts)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                        notifOverdueAlerts ? "bg-black dark:bg-indigo-600" : "bg-gray-300 dark:bg-gray-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                          notifOverdueAlerts ? "translate-x-5" : "translate-x-0.5"
                        } mt-0.5`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. TASK PREFERENCES TAB */}
            {activeTab === "preferences" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>📋</span> Default Task Preferences
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Pre-fill values automatically when creating new tasks in the modal.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Default Priority Level
                    </label>
                    <select
                      value={defaultPriority}
                      onChange={(e) => setDefaultPriority(e.target.value as TaskPriority)}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white px-3.5 py-2 text-xs font-medium outline-none focus:border-indigo-500"
                    >
                      <option value="LOW">Low Priority</option>
                      <option value="MEDIUM">Medium Priority (Standard)</option>
                      <option value="HIGH">High Priority (Urgent)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Default Initial Status
                    </label>
                    <select
                      value={defaultStatus}
                      onChange={(e) => setDefaultStatus(e.target.value as TaskStatus)}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white px-3.5 py-2 text-xs font-medium outline-none focus:border-indigo-500"
                    >
                      <option value="TODO">To Do (Backlog)</option>
                      <option value="IN_PROGRESS">In Progress (Doing)</option>
                      <option value="ON_HOLD">On Hold</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Default Estimated Duration
                    </label>
                    <select
                      value={defaultEstimatedDuration}
                      onChange={(e) => setDefaultEstimatedDuration(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white px-3.5 py-2 text-xs font-medium outline-none focus:border-indigo-500"
                    >
                      <option value="30 mins">30 mins</option>
                      <option value="1 hour">1 hour</option>
                      <option value="2 hours">2 hours</option>
                      <option value="4 hours">4 hours</option>
                      <option value="1 day">1 day</option>
                      <option value="2 days">2 days</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel / Revert
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  className="rounded-lg bg-black dark:bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-gray-800 dark:hover:bg-indigo-500 transition shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
