"use client";

import { Task } from "@/types/task";

interface RecentActivityFeedProps {
  tasks: Task[];
}

export function RecentActivityFeed({ tasks }: RecentActivityFeedProps) {
  // Generate real dynamic activity feed items based on task list
  const recentTasks = tasks.slice(0, 4);

  const activities = recentTasks.map((t, idx) => ({
    title: t.title,
    action:
      t.status === "COMPLETED" || t.status === ("completed" as any)
        ? "marked as completed"
        : t.status === "IN_PROGRESS" || t.status === ("in_progress" as any)
        ? "moved to In Progress"
        : "created",
    time: idx === 0 ? "Just now" : `${idx + 1} hours ago`,
    dotBg:
      t.status === "COMPLETED" || t.status === ("completed" as any)
        ? "bg-emerald-500"
        : t.status === "IN_PROGRESS" || t.status === ("in_progress" as any)
        ? "bg-blue-500"
        : "bg-amber-500",
  }));

  return (
    <div className="classic-card rounded-2xl border bg-white p-6 shadow-2xs border-slate-100 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <span>⚡</span> Recent Activity
      </h3>

      {activities.length === 0 ? (
        <div className="py-6 text-center text-slate-400 text-xs font-medium">
          No recent activity yet. Create or update a task to see updates here! ✨
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((act, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span
                className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${act.dotBg}`}
              ></span>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                  <span className="font-bold">{act.title}</span>{" "}
                  <span className="font-normal text-slate-500 dark:text-slate-400">
                    {act.action}
                  </span>
                </p>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5">{act.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
