"use client";

import { useState } from "react";

interface CalendarWidgetProps {
  onOpenFullCalendar?: () => void;
}

export function CalendarWidget({ onOpenFullCalendar }: CalendarWidgetProps) {
  const [currentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const todayDate = currentDate.getDate();

  // Generating a standard 35-day grid sample matching screenshot layout
  const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(year, currentDate.getMonth(), 1).getDay();

  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const calendarDays = [];
  // Padding previous month days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({ day: 30 - i, isCurrentMonth: false });
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, isCurrentMonth: true });
  }
  // Padding next month days
  const remaining = 35 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({ day: i, isCurrentMonth: false });
  }

  return (
    <div className="classic-card rounded-2xl border bg-white p-6 shadow-2xs border-slate-100 dark:border-slate-800 dark:bg-slate-900">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>📅</span> Calendar
        </h3>
        <div className="flex items-center gap-3">
          {onOpenFullCalendar && (
            <button
              onClick={onOpenFullCalendar}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline mr-1"
            >
              Full View ➔
            </button>
          )}
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm">
            ‹
          </button>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {monthName} {year}
          </span>
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm">
            ›
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
        {dayHeaders.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
        {calendarDays.map((item, idx) => {
          const isToday = item.isCurrentMonth && item.day === todayDate;
          return (
            <div key={idx} className="flex items-center justify-center p-1">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                  isToday
                    ? "bg-indigo-600 text-white font-bold shadow-sm"
                    : item.isCurrentMonth
                    ? "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    : "text-slate-300 dark:text-slate-700"
                }`}
              >
                {item.day}
              </span>
            </div>
          );
        })}
      </div>

      {/* Calendar Footer */}
      <div className="mt-4 border-t pt-3 border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400">
        Today - {todayDate} {monthName} {year}
      </div>
    </div>
  );
}
