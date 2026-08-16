"use client";

import { Task, TaskPriority, TaskStatus } from "@/types/task";
import { useState } from "react";

interface CalendarViewProps {
  tasks: Task[];
  onAddTaskForDate?: (dateStr: string) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Available Years range (2020 - 2035)
const YEARS_LIST = Array.from({ length: 16 }, (_, i) => 2020 + i);

function normalizeDate(dateVal?: string): string {
  if (!dateVal) return "";
  const trimmed = dateVal.trim();
  if (trimmed.includes("T")) {
    return trimmed.split("T")[0];
  }
  if (trimmed.includes("/")) {
    const parts = trimmed.split("/");
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        const [p1, p2, year] = parts;
        const month = p2.padStart(2, "0");
        const day = p1.padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    }
  }
  return trimmed;
}

export function CalendarView({
  tasks = [],
  onAddTaskForDate,
  onStatusChange,
}: CalendarViewProps) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    setViewDate(today);
    setSelectedDateStr(today.toISOString().split("T")[0]);
  };

  // Month & Year Direct Select Handlers
  const handleMonthChange = (newMonth: number) => {
    setViewDate(new Date(currentYear, newMonth, 1));
  };

  const handleYearChange = (newYear: number) => {
    setViewDate(new Date(newYear, currentMonth, 1));
  };

  const formatDateString = (year: number, month: number, day: number) => {
    const m = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
    const d = day < 10 ? `0${day}` : `${day}`;
    return `${year}-${m}-${d}`;
  };

  const getTasksForDate = (dateStr: string) => {
    const target = normalizeDate(dateStr);
    return safeTasks.filter((t) => {
      if (!t || !t.dueDate) return false;
      return normalizeDate(t.dueDate) === target;
    });
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blankCells = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  const todayStr = new Date().toISOString().split("T")[0];

  const selectedDayTasks = getTasksForDate(selectedDateStr);

  // Month-specific tasks calculation for Monthly Progress & Achievements
  const monthTasks = safeTasks.filter((t) => {
    if (!t || !t.dueDate) return false;
    const normalized = normalizeDate(t.dueDate);
    if (!normalized) return false;
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return false;
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const totalMonthTasks = monthTasks.length;
  const completedMonthTasks = monthTasks.filter(
    (t) => t && t.status === "COMPLETED"
  ).length;
  const completionPercentage =
    totalMonthTasks > 0
      ? Math.round((completedMonthTasks / totalMonthTasks) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Progress Summary */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Schedule & Achievements Dashboard
          </span>
          <h2 className="text-2xl font-black mt-1">Calendar & Task Progress</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Customize Month & Year to set or view tasks, descriptions, progress status, and achievements.
          </p>
        </div>

        {/* Achievement Progress Box */}
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 w-full md:w-auto">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 font-extrabold text-white text-lg shadow-sm">
            🎯
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold">Monthly Completion Rate</span>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {completionPercentage}% Done
              </span>
            </div>
            {/* Progress Bar */}
            <div className="mt-2 h-2 w-48 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dual-Pane Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Compact Calendar Picker */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            {/* Customizable Month & Year Selector Header */}
            <div className="flex items-center justify-between mb-4 border-b pb-3 border-slate-200 dark:border-slate-800 gap-2">
              {/* Customizable Dropdowns */}
              <div className="flex items-center gap-1.5">
                {/* Month Dropdown */}
                <select
                  value={currentMonth}
                  onChange={(e) => handleMonthChange(Number(e.target.value))}
                  className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-black outline-none focus:border-blue-500 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={idx} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>

                {/* Year Dropdown */}
                <select
                  value={currentYear}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-black outline-none focus:border-blue-500 text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400 cursor-pointer"
                >
                  {YEARS_LIST.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prev / Next / Today Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border bg-slate-50 text-xs font-bold hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                  title="Previous Month"
                >
                  ◀
                </button>
                <button
                  onClick={handleGoToToday}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"
                  title="Go to Today"
                >
                  Today
                </button>
                <button
                  onClick={handleNextMonth}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border bg-slate-50 text-xs font-bold hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                  title="Next Month"
                >
                  ▶
                </button>
              </div>
            </div>

            {/* Compact Days Grid */}
            <div className="grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <div>Su</div>
              <div>Mo</div>
              <div>Tu</div>
              <div>We</div>
              <div>Th</div>
              <div>Fr</div>
              <div>Sa</div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {blankCells.map((_, i) => (
                <div key={`b-${i}`} className="h-9"></div>
              ))}

              {daysArray.map((day) => {
                const dateStr = formatDateString(currentYear, currentMonth, day);
                const dayTasks = getTasksForDate(dateStr);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDateStr;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDateStr(dateStr)}
                    className={`h-9 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all relative ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-md"
                        : isToday
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span>{day}</span>
                    {dayTasks.length > 0 && !isSelected && (
                      <span className="h-1 w-1 rounded-full bg-blue-500 absolute bottom-1"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Stats Widget */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Achievement Highlights
            </h4>
            <div className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="flex items-center gap-2">🏆 Completed Tasks</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">{completedMonthTasks}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="flex items-center gap-2">⚡ Pending Tasks</span>
              <span className="font-black text-amber-600 dark:text-amber-400">
                {totalMonthTasks - completedMonthTasks}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Rich Task & Description & Time & Progress View */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-[420px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Selected Schedule Date
                  </span>
                  <h3 className="text-xl font-extrabold">{selectedDateStr}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {selectedDayTasks.length} Task(s) Set
                  </span>
                  {onAddTaskForDate && (
                    <button
                      onClick={() => onAddTaskForDate(selectedDateStr)}
                      className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all flex items-center gap-1"
                    >
                      <span>➕</span> Add Task
                    </button>
                  )}
                </div>
              </div>

              {/* Task Items Timeline & Descriptions */}
              <div className="mt-5 space-y-4">
                {selectedDayTasks.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <p className="text-2xl">📅</p>
                    <p className="text-sm font-semibold">No tasks scheduled for {selectedDateStr}.</p>
                    <p className="text-xs text-slate-500">
                      Add a task or set a due date to view its progress & description here.
                    </p>
                  </div>
                ) : (
                  selectedDayTasks.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-2xl border p-5 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60 space-y-3 transition-all hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-slate-900 dark:text-white">
                              {t.title}
                            </h4>
                            {t.priority && (
                              <span
                                className={`rounded px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                                  t.priority === "HIGH"
                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                    : t.priority === "MEDIUM"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                    : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {t.priority}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                            {t.description || "No description provided."}
                          </p>
                        </div>

                        {/* Status Select Pill */}
                        <select
                          value={t.status}
                          onChange={(e) =>
                            onStatusChange && onStatusChange(t.id, e.target.value as TaskStatus)
                          }
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold border outline-none ${
                            t.status === "COMPLETED"
                              ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-300"
                              : t.status === "IN_PROGRESS"
                              ? "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-300"
                              : t.status === "ON_HOLD"
                              ? "bg-purple-50 border-purple-300 text-purple-700 dark:bg-purple-950 dark:border-purple-700 dark:text-purple-300"
                              : "bg-white border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                          }`}
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="ON_HOLD">On Hold</option>
                        </select>
                      </div>

                      {/* Date & Time & Progress Info Footer */}
                      <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-4">
                          <span>🗓️ Due: {t.dueDate || selectedDateStr}</span>
                          <span>🕒 Time: {t.dueTime || "—"}</span>
                        </div>

                        <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                          {t.status === "COMPLETED" ? (
                            <>
                              <span>🏆 Achievement Unlocked</span>
                            </>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400">
                              ⚡ In Progress
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
