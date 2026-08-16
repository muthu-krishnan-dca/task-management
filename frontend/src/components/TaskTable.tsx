"use client";

import { Task, TaskPriority, TaskStatus } from "@/types/task";
import { useState } from "react";

interface TaskTableProps {
  tasks: Task[];
  filteredTasks: Task[];
  isLoading: boolean;
  onRefresh: () => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask?: (task: Task) => void;
  onOpenCreateTask?: () => void;
}

export function TaskTable({
  tasks,
  filteredTasks,
  isLoading,
  onRefresh,
  onStatusChange,
  onDeleteTask,
  onEditTask,
  onOpenCreateTask,
}: TaskTableProps) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [filterPriority, setFilterPriority] = useState<string>("ALL");

  const toggleSelectAll = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map((t) => t.id));
    }
  };

  const toggleSelectTask = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const displayedTasks = filteredTasks.filter((t) => {
    if (filterPriority === "ALL") return true;
    return (t.priority || "MEDIUM").toUpperCase() === filterPriority;
  });

  const getProjectDotColor = (project?: string) => {
    if (!project) return "bg-indigo-500";
    if (project.toLowerCase().includes("website")) return "bg-purple-500";
    if (project.toLowerCase().includes("mobile")) return "bg-emerald-500";
    if (project.toLowerCase().includes("backend") || project.toLowerCase().includes("api")) return "bg-blue-500";
    return "bg-indigo-500";
  };

  const getPriorityBadgeClass = (priority?: TaskPriority) => {
    switch (priority) {
      case "HIGH":
        return "bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
      case "MEDIUM":
        return "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
      case "LOW":
      default:
        return "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
    }
  };

  const getStatusBadgeClass = (status: TaskStatus) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300";
      case "TODO":
      default:
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300";
    }
  };

  return (
    <div className="rounded-2xl border bg-white shadow-2xs overflow-hidden border-slate-100 dark:border-slate-800 dark:bg-slate-900">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between p-6 gap-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Tasks</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">🔍 Filter Priority (All)</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>

          {onOpenCreateTask && (
            <button
              onClick={onOpenCreateTask}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all"
            >
              <span>+</span> Create Task
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 font-medium">Loading tasks...</div>
      ) : displayedTasks.length === 0 ? (
        <div className="p-16 text-center text-slate-400 font-medium">No tasks found. Create a task to get started!</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-4 pl-6 pr-3 w-10">
                  <input
                    type="checkbox"
                    checked={
                      displayedTasks.length > 0 &&
                      selectedTaskIds.length === displayedTasks.length
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-4 px-4">Task Name</th>
                <th className="py-4 px-4">Project</th>
                <th className="py-4 px-4">Priority</th>
                <th className="py-4 px-4">Due Date</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 pr-6 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
              {displayedTasks.map((task) => {
                const isChecked = selectedTaskIds.includes(task.id);
                return (
                  <tr
                    key={task.id}
                    className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                      isChecked ? "bg-indigo-50/30 dark:bg-indigo-950/20" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-4 pl-6 pr-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectTask(task.id)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    {/* Task Title */}
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                      <div>
                        <p className={task.status === "COMPLETED" ? "line-through text-slate-400" : ""}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-[11px] font-normal text-slate-400 truncate max-w-xs mt-0.5">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Project Tag */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${getProjectDotColor(
                            task.project
                          )}`}
                        ></span>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {task.project || "Website Redesign"}
                        </span>
                      </div>
                    </td>

                    {/* Priority Badge */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block rounded-lg px-2.5 py-1 text-[11px] font-bold ${getPriorityBadgeClass(
                          task.priority
                        )}`}
                      >
                        {task.priority || "MEDIUM"}
                      </span>
                    </td>

                    {/* Due Date & Time */}
                    <td className="py-4 px-4 font-medium text-slate-500 dark:text-slate-400">
                      <div>
                        <span>{task.dueDate || "No due date"}</span>
                        {task.dueTime && (
                          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 ml-1.5 font-bold">
                            ⏰ {task.dueTime}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-4 px-4">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          onStatusChange(task.id, e.target.value as TaskStatus)
                        }
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold border-none outline-none cursor-pointer ${getStatusBadgeClass(
                          task.status
                        )}`}
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </td>

                    {/* Action Icons */}
                    <td className="py-4 pr-6 pl-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onEditTask && (
                          <button
                            onClick={() => onEditTask(task)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title="Edit Task"
                          >
                            ✏️
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this task?")) {
                              onDeleteTask(task.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          title="Delete Task"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Link */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center">
        <button
          onClick={onRefresh}
          className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
        >
          View All Tasks →
        </button>
      </div>
    </div>
  );
}
