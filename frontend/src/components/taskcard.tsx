"use client";

import { useState } from "react";
import { TaskPriority, TaskStatus, VisibleFields } from "@/types/task";

interface TaskCardProps {
  id: string;
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  labels: string[];
  status: TaskStatus;
  priority?: TaskPriority;
  project?: string;
  visibleFields?: VisibleFields;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDuplicate: (id: string) => void;
  onDragStart: (id: string) => void;
onDragEnd: () => void;
}

export default function TaskCard({
  id,
  title,
  description,
  assignee,
  dueDate,
  labels,
  status,
  priority,
  project,
  visibleFields,
  onEdit,
  onDelete,
  onStatusChange,
  onDuplicate,
  onDragStart,
onDragEnd,
}: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const showDescription = visibleFields?.description ?? true;
  const showAssignee = visibleFields?.assignee ?? true;
  const showDueDate = visibleFields?.dueDate ?? true;
  const showStatus = visibleFields?.status ?? true;
  const showPriority = visibleFields?.priority ?? true;
  const showProject = visibleFields?.project ?? true;

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"?`
    );

    if (confirmed) {
      onDelete(id);
    }
  };

  // Filter labels based on visible fields
  const filteredLabels = labels.filter((label) => {
    const isPriorityLabel = ["LOW", "MEDIUM", "HIGH"].includes(label.toUpperCase());
    if (isPriorityLabel) return showPriority;
    return showProject;
  });

  return (
    <div
      draggable
      onDragStart={() => onDragStart(id)}
      onDragEnd={onDragEnd}
      className="relative cursor-grab rounded-lg border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-800 p-3.5 shadow-xs transition-all hover:shadow-sm active:cursor-grabbing text-gray-900 dark:text-white"
    >

      {/* Header */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
          {title}
        </h3>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            className="text-lg text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            ⋯
          </button>

          {showMenu && (
            <div className="absolute right-0 top-7 z-30 w-32 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-1 shadow-lg">

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onEdit(id);
                }}
                className="block w-full px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ✏️ Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onDuplicate(id);
                }}
                className="block w-full px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                📋 Duplicate
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  handleDelete();
                }}
                className="block w-full px-3 py-2 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
              >
                🗑️ Delete
              </button>

            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {showDescription && (
        <p className="mb-3 text-xs leading-5 text-gray-500 dark:text-gray-400">
          {description || "No description"}
        </p>
      )}

      {/* Assignee + Due Date */}
      {(showAssignee || showDueDate) && (
        <div className="mb-3 flex items-center justify-between text-xs">
          {showAssignee ? (
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-[10px] font-semibold text-white">
                {assignee.charAt(0).toUpperCase()}
              </div>

              <span className="text-gray-600 dark:text-gray-300 font-medium">
                {assignee}
              </span>
            </div>
          ) : <div />}

          {showDueDate && (
            <span className="text-red-600 dark:text-red-400 font-medium">
              {dueDate}
            </span>
          )}
        </div>
      )}

      {/* Status Change */}
      {showStatus && (
        <div className="mb-3">
          <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-400 dark:text-gray-400">
            Status
          </label>

          <select
            value={status}
            onChange={(e) =>
              onStatusChange(
                id,
                e.target.value as TaskStatus
              )
            }
            className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/80 px-2 py-1.5 text-xs text-gray-700 dark:text-gray-200 outline-none focus:border-indigo-500"
          >
            <option value="TODO">
              To Do
            </option>

            <option value="IN_PROGRESS">
              In Progress
            </option>

            <option value="COMPLETED">
              Completed
            </option>

            <option value="ON_HOLD">
              On Hold
            </option>
          </select>
        </div>
      )}

      {/* Labels / Badges */}
      {filteredLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filteredLabels.map((label, index) => {
            const isPriority = ["LOW", "MEDIUM", "HIGH"].includes(label.toUpperCase());
            return (
              <span
                key={`${label}-${index}`}
                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  isPriority
                    ? label.toUpperCase() === "HIGH"
                      ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300"
                      : label.toUpperCase() === "MEDIUM"
                      ? "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                      : "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300"
                }`}
              >
                {label}
              </span>
            );
          })}
        </div>
      )}

    </div>
  );
}