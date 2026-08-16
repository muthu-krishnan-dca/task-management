"use client";

import { Task } from "@/types/task";

interface PriorityDonutChartProps {
  tasks: Task[];
}

export function PriorityDonutChart({ tasks }: PriorityDonutChartProps) {
  const highCount = tasks.filter((t) => (t.priority || "MEDIUM") === "HIGH").length;
  const mediumCount = tasks.filter((t) => (t.priority || "MEDIUM") === "MEDIUM").length;
  const lowCount = tasks.filter((t) => (t.priority || "MEDIUM") === "LOW").length;
  const total = tasks.length;

  // Calculate angles for SVG stroke-dasharray
  const highRatio = total > 0 ? highCount / total : 0.33;
  const mediumRatio = total > 0 ? mediumCount / total : 0.34;
  const lowRatio = total > 0 ? lowCount / total : 0.33;

  const circumference = 2 * Math.PI * 36; // radius = 36 -> ~226.195

  const highDash = highRatio * circumference;
  const mediumDash = mediumRatio * circumference;
  const lowDash = lowRatio * circumference;

  return (
    <div className="classic-card rounded-2xl border bg-white p-6 shadow-2xs border-slate-100 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <span>🎯</span> Tasks by Priority
      </h3>

      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* SVG Donut Chart */}
        <div className="relative flex items-center justify-center">
          <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="36"
              fill="transparent"
              stroke="#F1F5F9"
              strokeWidth="12"
              className="dark:stroke-slate-800"
            />
            {/* High (Rose) segment */}
            <circle
              cx="50"
              cy="50"
              r="36"
              fill="transparent"
              stroke="#F43F5E"
              strokeWidth="12"
              strokeDasharray={`${highDash} ${circumference}`}
              strokeDashoffset="0"
              className="transition-all duration-500"
            />
            {/* Medium (Amber) segment */}
            <circle
              cx="50"
              cy="50"
              r="36"
              fill="transparent"
              stroke="#F59E0B"
              strokeWidth="12"
              strokeDasharray={`${mediumDash} ${circumference}`}
              strokeDashoffset={`-${highDash}`}
              className="transition-all duration-500"
            />
            {/* Low (Emerald) segment */}
            <circle
              cx="50"
              cy="50"
              r="36"
              fill="transparent"
              stroke="#10B981"
              strokeWidth="12"
              strokeDasharray={`${lowDash} ${circumference}`}
              strokeDashoffset={`-${highDash + mediumDash}`}
              className="transition-all duration-500"
            />
          </svg>

          {/* Donut Center Count */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
              {total}
            </span>
            <span className="text-[10px] font-medium text-slate-400">Total</span>
          </div>
        </div>

        {/* Priority Legend List */}
        <div className="space-y-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className="h-3 w-3 rounded-full bg-rose-500 shrink-0"></span>
            <span className="text-slate-600 dark:text-slate-400">High ({highCount})</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className="h-3 w-3 rounded-full bg-amber-500 shrink-0"></span>
            <span className="text-slate-600 dark:text-slate-400">Medium ({mediumCount})</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className="h-3 w-3 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="text-slate-600 dark:text-slate-400">Low ({lowCount})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
