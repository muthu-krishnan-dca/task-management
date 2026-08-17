"use client";

import { useEffect, useRef, useState } from "react";
import { Task, VisibleFields, defaultVisibleFields } from "@/types/task";
import { NotificationDropdown } from "./NotificationDropdown";
import { DEFAULT_USER, getUserProfile, UserProfile } from "@/utils/userStore";
import { exportTasksToCSV, exportTasksToExcel } from "@/utils/exportUtils";
import Link from "next/link";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type?: "info" | "warning" | "success" | "error" | "danger";
  timestamp?: string;
  read?: boolean;
  task?: any;
}

export interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onAddTask?: () => void;
  visibleFields?: VisibleFields;
  onVisibleFieldsChange?: (fields: VisibleFields) => void;
  filters?: TaskFilters;
  onFiltersChange?: (filters: TaskFilters) => void;
  darkMode?: boolean;
  onToggleTheme?: () => void;
  onThemeChange?: (mode: any) => void;
  onOpenProfile?: () => void;
  currentUser?: { name: string; role: string; email: string };
  notifications?: NotificationItem[];
  tasksToExport?: Task[];
}
export type TaskStatus =
  | "ALL"
  | "TODO"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ON_HOLD";
export type TaskPriority = "ALL" | "LOW" | "MEDIUM" | "HIGH";

export interface TaskFilters {
  status: TaskStatus;
  priority: TaskPriority;
  project: string;
}

export function Header({
  searchQuery = "",
  onSearchChange = () => {},
  onAddTask,
  visibleFields = defaultVisibleFields,
  onVisibleFieldsChange,
  filters = {
    status: "ALL",
    priority: "ALL",
    project: "",
  },
  onFiltersChange,
  currentUser,
  tasksToExport = [],
}: HeaderProps) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER);
  const [showFieldsMenu, setShowFieldsMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const desktopFieldsRef = useRef<HTMLDivElement>(null);
  const mobileFieldsRef = useRef<HTMLDivElement>(null);
  const desktopFilterRef = useRef<HTMLDivElement>(null);
  const mobileFilterRef = useRef<HTMLDivElement>(null);
  const desktopExportRef = useRef<HTMLDivElement>(null);
  const mobileExportRef = useRef<HTMLDivElement>(null);

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

  // Close menus on outside click or touch
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      const clickedInsideFilter =
        (desktopFilterRef.current && desktopFilterRef.current.contains(target)) ||
        (mobileFilterRef.current && mobileFilterRef.current.contains(target));

      if (!clickedInsideFilter) {
        setShowFilterMenu(false);
      }

      const clickedInsideFields =
        (desktopFieldsRef.current && desktopFieldsRef.current.contains(target)) ||
        (mobileFieldsRef.current && mobileFieldsRef.current.contains(target));

      if (!clickedInsideFields) {
        setShowFieldsMenu(false);
      }

      const clickedInsideExport =
        (desktopExportRef.current && desktopExportRef.current.contains(target)) ||
        (mobileExportRef.current && mobileExportRef.current.contains(target));

      if (!clickedInsideExport) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showFieldsMenu, showFilterMenu, showExportMenu]);

  const toggleField = (fieldKey: keyof VisibleFields) => {
    if (!onVisibleFieldsChange) return;
    onVisibleFieldsChange({
      ...visibleFields,
      [fieldKey]: !visibleFields[fieldKey],
    });
  };

  const handleSelectAll = (select: boolean) => {
    if (!onVisibleFieldsChange) return;
    onVisibleFieldsChange({
      description: select,
      assignee: select,
      dueDate: select,
      priority: select,
      project: select,
      status: select,
    });
  };

  const fieldOptions: { key: keyof VisibleFields; label: string }[] = [
    { key: "description", label: "Description" },
    { key: "assignee", label: "Assignee" },
    { key: "dueDate", label: "Due Date" },
    { key: "priority", label: "Priority" },
    { key: "project", label: "Project" },
    { key: "status", label: "Status" },
  ];

  const activeCount = Object.values(visibleFields).filter(Boolean).length;
  const isFilterActive =
    filters.status !== "ALL" ||
    filters.priority !== "ALL" ||
    filters.project !== "";

  const renderFilterDropdown = (align: "right" | "left" = "right") => (
    <div
      className={`absolute ${
        align === "right" ? "right-0" : "left-0"
      } top-10 sm:top-11 z-50 w-72 max-w-[calc(100vw-24px)] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-xl animate-in fade-in zoom-in-95 duration-100`}
    >
      <div className="mb-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Filter Tasks
        </span>
        <button
          type="button"
          onClick={() => {
            onFiltersChange?.({ status: "ALL", priority: "ALL", project: "" });
          }}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) =>
              onFiltersChange?.({ ...filters, status: e.target.value as TaskStatus })
            }
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Status</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">
            Priority
          </label>
          <select
            value={filters.priority}
            onChange={(e) =>
              onFiltersChange?.({ ...filters, priority: e.target.value as TaskPriority })
            }
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">
            Project
          </label>
          <input
            type="text"
            value={filters.project}
            onChange={(e) =>
              onFiltersChange?.({ ...filters, project: e.target.value })
            }
            placeholder="Filter by project..."
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  );

  const renderFieldsDropdown = (align: "right" | "left" = "right") => (
    <div
      className={`absolute ${
        align === "right" ? "right-0" : "left-0"
      } top-10 sm:top-11 z-50 w-60 max-w-[calc(100vw-24px)] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-xl animate-in fade-in zoom-in-95 duration-100`}
    >
      <div className="mb-2 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Visible Fields
        </span>
        <div className="flex items-center gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => handleSelectAll(true)}
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            All
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button
            type="button"
            onClick={() => handleSelectAll(false)}
            className="font-semibold text-gray-500 dark:text-gray-400 hover:underline cursor-pointer"
          >
            None
          </button>
        </div>
      </div>

      <div className="space-y-1 py-1">
        {fieldOptions.map(({ key, label }) => {
          const isChecked = !!visibleFields[key];
          return (
            <label
              key={key}
              className={`flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                isChecked
                  ? "bg-indigo-50/70 dark:bg-indigo-950/50 text-gray-900 dark:text-white font-medium"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <span>{label}</span>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleField(key)}
                className="h-4 w-4 rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          );
        })}
      </div>
    </div>
  );

  const handleExportCSVClick = () => {
    setShowExportMenu(false);
    if (!tasksToExport || tasksToExport.length === 0) {
      alert("⚠️ No tasks available to export.");
      return;
    }
    exportTasksToCSV(tasksToExport);
  };

  const handleExportExcelClick = () => {
    setShowExportMenu(false);
    if (!tasksToExport || tasksToExport.length === 0) {
      alert("⚠️ No tasks available to export.");
      return;
    }
    exportTasksToExcel(tasksToExport);
  };

  const renderExportDropdown = (align: "left" | "right") => (
    <div
      className={`absolute ${
        align === "right" ? "right-0" : "left-0"
      } top-10 sm:top-11 z-50 w-52 max-w-[calc(100vw-24px)] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100`}
    >
      <div className="mb-1.5 border-b border-gray-100 dark:border-gray-700 px-2 pb-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Export Tasks ({tasksToExport.length})
        </p>
      </div>
      <div className="space-y-1">
        <button
          type="button"
          onClick={handleExportCSVClick}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 font-bold">
            📄
          </span>
          <div className="text-left">
            <p className="leading-none">Export as CSV</p>
            <p className="text-[10px] text-gray-400 font-normal">.csv format</p>
          </div>
        </button>

        <button
          type="button"
          onClick={handleExportExcelClick}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-bold">
            📊
          </span>
          <div className="text-left">
            <p className="leading-none">Export as Excel</p>
            <p className="text-[10px] text-gray-400 font-normal">.xlsx spreadsheet</p>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-30 flex flex-col border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
      
      {/* Top Navbar Row */}
      <div className="flex h-14 sm:h-16 w-full items-center justify-between px-3 sm:px-6 gap-3">
        
        {/* Left: Mobile Drawer Button & Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("toggleMobileSidebar"))}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition md:hidden cursor-pointer shadow-xs"
            aria-label="Toggle navigation menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* AbleSpace Brand Badge */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black dark:bg-indigo-600 text-xs font-black text-white shadow-xs md:hidden">
              A
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
              <span>AbleSpace</span>
              <span className="hidden sm:inline text-gray-400 dark:text-gray-600 font-normal">/</span>
              <span className="hidden sm:inline text-gray-500 dark:text-gray-400 font-medium">Workspace</span>
            </div>
          </div>
        </div>

        {/* Center/Right Toolbar: Search, Filter, Fields, Export next to Notification */}
        <div className="hidden md:flex items-center gap-2.5 flex-1 justify-end">
          {/* Search Bar */}
          <div className="relative flex items-center w-64 lg:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks, project, priority..."
              className="h-9 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800 px-3 text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-[10px] text-gray-500 dark:text-gray-300 hover:bg-gray-300"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Dropdown (Desktop) */}
          <div className="relative" ref={desktopFilterRef}>
            <button
              type="button"
              onClick={() => {
                setShowFilterMenu((prev) => !prev);
                setShowFieldsMenu(false);
                setShowExportMenu(false);
              }}
              className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors cursor-pointer ${
                showFilterMenu || isFilterActive
                  ? "border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <span>🌪️ Filter</span>
              {isFilterActive && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                  !
                </span>
              )}
            </button>

            {showFilterMenu && renderFilterDropdown("right")}
          </div>

          {/* Fields Dropdown (Desktop) */}
          <div className="relative" ref={desktopFieldsRef}>
            <button
              type="button"
              onClick={() => {
                setShowFieldsMenu((prev) => !prev);
                setShowFilterMenu(false);
                setShowExportMenu(false);
              }}
              className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors cursor-pointer ${
                showFieldsMenu
                  ? "border-gray-900 dark:border-white bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <span>⚙️ Fields</span>
              <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-[10px] text-gray-700 dark:text-gray-200 font-bold">
                {activeCount}
              </span>
            </button>

            {showFieldsMenu && renderFieldsDropdown("right")}
          </div>

          {/* Export Dropdown (Desktop) */}
          <div className="relative" ref={desktopExportRef}>
            <button
              type="button"
              onClick={() => {
                setShowExportMenu((prev) => !prev);
                setShowFilterMenu(false);
                setShowFieldsMenu(false);
              }}
              className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors cursor-pointer ${
                showExportMenu
                  ? "border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-xs"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <span>📤 Export</span>
            </button>

            {showExportMenu && renderExportDropdown("right")}
          </div>

          {/* Notifications Bell */}
          <NotificationDropdown />

          {/* Add Task Button (Desktop) */}
          <button
            type="button"
            onClick={onAddTask}
            className="hidden sm:inline-flex items-center justify-center rounded-xl bg-black dark:bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-gray-800 dark:hover:bg-indigo-500 transition shadow-xs cursor-pointer"
          >
            + Add Task
          </button>

          {/* Profile Avatar */}
          <Link
            href="/profile"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white shadow-xs overflow-hidden border-2 border-purple-200 dark:border-purple-800 hover:opacity-90 transition"
            title={`Profile: ${profile.name}`}
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="h-full w-full object-cover"
              />
            ) : (
              (profile.name || "U").charAt(0).toUpperCase()
            )}
          </Link>
        </div>

        {/* Right Mobile Actions (Notification & Avatar only) */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          <NotificationDropdown />
          <Link
            href="/profile"
            className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white shadow-xs overflow-hidden border border-purple-300"
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="h-full w-full object-cover"
              />
            ) : (
              (profile.name || "U").charAt(0).toUpperCase()
            )}
          </Link>
        </div>

      </div>

      {/* Mobile Toolbar Sub-Row (Search, Filter, Fields, Export, + Add Task) */}
      <div className="flex md:hidden flex-col gap-2 border-t border-gray-100 dark:border-gray-800 px-3 py-2.5 bg-gray-50/50 dark:bg-gray-900/50">
        {/* Mobile Search Bar */}
        <div className="relative flex items-center w-full">
          <span className="absolute left-3 text-xs text-gray-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks, project, priority..."
            className="h-9 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-8 pr-8 text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-indigo-500 shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-[10px] text-gray-500 dark:text-gray-300"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Mobile Quick Action Buttons: Filter, Fields, Export, Add Task */}
        <div className="flex items-center gap-2">
          {/* Mobile Filter Button */}
          <div className="relative" ref={mobileFilterRef}>
            <button
              type="button"
              onClick={() => {
                setShowFilterMenu((prev) => !prev);
                setShowFieldsMenu(false);
                setShowExportMenu(false);
              }}
              className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                showFilterMenu || isFilterActive
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              <span>🌪️ Filter</span>
              {isFilterActive && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                  !
                </span>
              )}
            </button>

            {showFilterMenu && renderFilterDropdown("left")}
          </div>

          {/* Mobile Fields Button */}
          <div className="relative" ref={mobileFieldsRef}>
            <button
              type="button"
              onClick={() => {
                setShowFieldsMenu((prev) => !prev);
                setShowFilterMenu(false);
                setShowExportMenu(false);
              }}
              className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                showFieldsMenu
                  ? "border-gray-900 dark:border-white bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              <span>⚙️ Fields</span>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-[10px] text-gray-700 dark:text-gray-200 font-bold">
                {activeCount}
              </span>
            </button>

            {showFieldsMenu && renderFieldsDropdown("left")}
          </div>

          {/* Mobile Export Button */}
          <div className="relative" ref={mobileExportRef}>
            <button
              type="button"
              onClick={() => {
                setShowExportMenu((prev) => !prev);
                setShowFilterMenu(false);
                setShowFieldsMenu(false);
              }}
              className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                showExportMenu
                  ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              <span>📤 Export</span>
            </button>

            {showExportMenu && renderExportDropdown("left")}
          </div>

          {/* Mobile + Add Task Button */}
          <button
            type="button"
            onClick={onAddTask}
            className="flex h-8 items-center justify-center gap-1 rounded-lg bg-black dark:bg-indigo-600 px-3 text-xs font-bold text-white hover:bg-gray-800 dark:hover:bg-indigo-500 transition shrink-0 shadow-xs cursor-pointer ml-auto"
          >
            <span>+</span>
            <span>Add Task</span>
          </button>
        </div>
      </div>

    </header>
  );
}

export default Header;
