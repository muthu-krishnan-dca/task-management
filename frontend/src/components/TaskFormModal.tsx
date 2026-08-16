"use client";

import { Task, TaskPriority, TaskStatus } from "@/types/task";
import { useEffect, useState } from "react";
import { getAppSettings } from "@/utils/settingsStore";

interface TaskFormModalProps {
  initialTask?: Task | null;
  onClose: () => void;
  onSubmit: (task: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    dueTime?: string;
    estimatedTime?: string;
    project?: string;
  }) => Promise<void>;
}

// Convert date to YYYY-MM-DD for HTML input
function formatForDateInput(dateStr?: string): string {
  if (!dateStr || dateStr === "No due date") return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function TaskFormModal({
  initialTask,
  onClose,
  onSubmit,
}: TaskFormModalProps) {
  const currentDefaults = getAppSettings();
  const [title, setTitle] = useState(initialTask?.title || "");
  const [description, setDescription] = useState(
    initialTask?.description || ""
  );
  const [project, setProject] = useState(
    initialTask?.project || "Website Redesign"
  );
  const [status, setStatus] = useState<TaskStatus>(
    initialTask?.status || currentDefaults.defaultStatus || "TODO"
  );
  const [priority, setPriority] = useState<TaskPriority>(
    initialTask?.priority || currentDefaults.defaultPriority || "MEDIUM"
  );
  const [dueDate, setDueDate] = useState(
    formatForDateInput(initialTask?.dueDate)
  );
  const [dueTime, setDueTime] = useState(initialTask?.dueTime || "");
  const [estimatedTime, setEstimatedTime] = useState(
    initialTask?.estimatedTime || currentDefaults.defaultEstimatedDuration || "1 hour"
  );

  // Sync state whenever initialTask prop changes
  useEffect(() => {
    const defaults = getAppSettings();
    setTitle(initialTask?.title || "");
    setDescription(initialTask?.description || "");
    setProject(initialTask?.project || "Website Redesign");
    setStatus(initialTask?.status || defaults.defaultStatus || "TODO");
    setPriority(initialTask?.priority || defaults.defaultPriority || "MEDIUM");
    setDueDate(formatForDateInput(initialTask?.dueDate));
    setDueTime(initialTask?.dueTime || "");
    setEstimatedTime(initialTask?.estimatedTime || defaults.defaultEstimatedDuration || "1 hour");
    setErrors({});
    setTouched({});
  }, [initialTask]);

  // Validation errors state
  const [errors, setErrors] = useState<{
    title?: string;
    dueDate?: string;
    project?: string;
  }>({});
  const [touched, setTouched] = useState<{
    title?: boolean;
    dueDate?: boolean;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate fields
  const validate = () => {
    const newErrors: {
      title?: string;
      dueDate?: string;
      project?: string;
    } = {};

    // Title validation
    if (!title.trim()) {
      newErrors.title = "Task title is required.";
    } else if (title.trim().length < 2) {
      newErrors.title = "Title must be at least 2 characters.";
    } else if (title.trim().length > 120) {
      newErrors.title = "Title cannot exceed 120 characters.";
    }

    // Due date validation
    if (dueDate) {
      const parsedDate = new Date(dueDate);
      if (isNaN(parsedDate.getTime())) {
        newErrors.dueDate = "Please enter a valid date.";
      }
    }

    // Project validation
    if (project.trim().length > 60) {
      newErrors.project = "Project name cannot exceed 60 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (errors.title) {
      if (val.trim().length >= 2) {
        setErrors((prev) => ({ ...prev, title: undefined }));
      }
    }
  };

  const handleDueDateChange = (val: string) => {
    setDueDate(val);
    if (errors.dueDate) {
      setErrors((prev) => ({ ...prev, dueDate: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ title: true, dueDate: true });

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        project: project.trim() || "General",
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        dueTime: dueTime.trim() || undefined,
        estimatedTime: estimatedTime || undefined,
      });
      onClose();
    } catch (err) {
      console.error("Failed to submit task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {initialTask ? "Edit Task" : "Create New Task"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {initialTask
                ? "Update the details and properties for this task."
                : "Fill in the required details to create a new task."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          
          {/* Task Title (Required) */}
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="task-title"
                className="block text-xs font-semibold text-gray-700"
              >
                Task Title <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-gray-400">
                {title.length}/120
              </span>
            </div>

            <input
              id="task-title"
              type="text"
              value={title}
              onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Design Landing Page Mockups"
              className={`mt-1.5 w-full rounded-lg border px-3.5 py-2.5 text-xs font-medium text-gray-900 placeholder-gray-400 outline-none transition ${
                touched.title && errors.title
                  ? "border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  : "border-gray-200 bg-gray-50/50 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              }`}
            />

            {touched.title && errors.title && (
              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                <span>⚠</span> {errors.title}
              </p>
            )}
          </div>

          {/* Project & Priority */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="task-project"
                className="block text-xs font-semibold text-gray-700"
              >
                Project
              </label>
              <input
                id="task-project"
                type="text"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="e.g. Website Redesign"
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-medium text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
              {errors.project && (
                <p className="mt-1 text-xs text-red-600">{errors.project}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="task-priority"
                className="block text-xs font-semibold text-gray-700"
              >
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as TaskPriority)
                }
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-medium text-gray-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
              </select>
            </div>
          </div>

          {/* Status & Due Date */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="task-status"
                className="block text-xs font-semibold text-gray-700"
              >
                Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-medium text-gray-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">Doing / In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="task-duedate"
                className="block text-xs font-semibold text-gray-700"
              >
                Due Date
              </label>
              <input
                id="task-duedate"
                type="date"
                value={dueDate}
                onBlur={() => setTouched((prev) => ({ ...prev, dueDate: true }))}
                onChange={(e) => handleDueDateChange(e.target.value)}
                className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-xs font-medium text-gray-900 outline-none transition ${
                  touched.dueDate && errors.dueDate
                    ? "border-red-500 bg-red-50/20 focus:border-red-500"
                    : "border-gray-200 bg-gray-50/50 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                }`}
              />
              {touched.dueDate && errors.dueDate && (
                <p className="mt-1 text-xs text-red-600">{errors.dueDate}</p>
              )}
            </div>
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="task-duetime"
                className="block text-xs font-semibold text-gray-700"
              >
                Time
              </label>
              <input
                id="task-duetime"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-medium text-gray-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                htmlFor="task-duration"
                className="block text-xs font-semibold text-gray-700"
              >
                Estimated Duration
              </label>
              <select
                id="task-duration"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-medium text-gray-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              >
                <option value="15 mins">15 mins</option>
                <option value="30 mins">30 mins</option>
                <option value="45 mins">45 mins</option>
                <option value="1 hour">1 hour</option>
                <option value="2 hours">2 hours</option>
                <option value="3 hours">3 hours</option>
                <option value="4 hours">4 hours</option>
                <option value="Full Day">Full Day</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="task-description"
              className="block text-xs font-semibold text-gray-700"
            >
              Description
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add optional notes or acceptance criteria..."
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs font-medium text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-lg bg-black px-5 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : initialTask
                ? "Save Changes"
                : "Create Task"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
