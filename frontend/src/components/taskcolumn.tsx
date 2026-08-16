"use client";

import { useState } from "react";
import { VisibleFields, TaskPriority } from "@/types/task";
import TaskCard from "./taskcard";

type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ON_HOLD";

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  labels: string[];
  status: TaskStatus;
  priority?: TaskPriority;
  project?: string;
}

interface TaskColumnProps {
  title: string;
  tasks: Task[];
  visibleFields?: VisibleFields;

  onAddTask: () => void;
  onEditTask: (id: string) => void;
  onDeleteTask: (id: string) => void;

  onStatusChange: (
    id: string,
    status: TaskStatus
  ) => void;

  onDuplicateTask: (id: string) => void;

  // Drag & Drop
  onTaskDragStart: (id: string) => void;
  onTaskDragEnd: () => void;
  onTaskDrop: (status: TaskStatus) => void;
}

export default function TaskColumn({
  title,
  tasks,
  visibleFields,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onDuplicateTask,
  onTaskDragStart,
  onTaskDragEnd,
  onTaskDrop,
}: TaskColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  // Convert column title to status
  const getColumnStatus = (): TaskStatus => {
    switch (title) {
      case "To Do":
        return "TODO";

      case "Doing":
        return "IN_PROGRESS";

      case "Completed":
        return "COMPLETED";

      case "On Hold":
        return "ON_HOLD";

      default:
        return "TODO";
    }
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    setIsDragOver(false);

    const status = getColumnStatus();

    onTaskDrop(status);
  };

  return (
    <div
      className={`flex min-w-0 flex-col rounded-lg transition-colors ${
        isDragOver
          ? "bg-indigo-50 dark:bg-indigo-950/40 ring-2 ring-indigo-300 dark:ring-indigo-700"
          : "bg-gray-50 dark:bg-gray-900/70 border border-gray-200/60 dark:border-gray-800"
      }`}
    >

      {/* Column Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-3 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white">
            {title}
          </h2>

          <span className="rounded-full bg-gray-200 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-200">
            {tasks.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onAddTask}
          className="text-lg font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          aria-label={`Add task to ${title}`}
        >
          +
        </button>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="flex min-h-[120px] flex-1 flex-col gap-3 p-3"
      >

        {/* Task Cards */}
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/30 py-8 text-center">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
              No tasks
            </p>

            {isDragOver && (
              <p className="mt-1 text-xs font-medium text-indigo-500 dark:text-indigo-400">
                Drop task here
              </p>
            )}
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              id={task.id}
              title={task.title}
              description={task.description}
              assignee={task.assignee}
              dueDate={task.dueDate}
              labels={task.labels}
              status={task.status}
              priority={task.priority}
              project={task.project}
              visibleFields={visibleFields}

              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onStatusChange={onStatusChange}
              onDuplicate={onDuplicateTask}

              // Drag & Drop
              onDragStart={onTaskDragStart}
              onDragEnd={onTaskDragEnd}
            />
          ))
        )}

        {/* Add Task */}
        <button
          type="button"
          onClick={onAddTask}
          className="w-full rounded-md border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/80 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-2xs"
        >
          + Add Task
        </button>

      </div>
    </div>
  );
}