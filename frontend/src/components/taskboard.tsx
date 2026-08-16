"use client";

import { useState } from "react";
import { VisibleFields } from "@/types/task";
import TaskColumn from "./taskcolumn";

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
}

interface TaskBoardProps {
  tasks: Task[];
  visibleFields?: VisibleFields;
  searchQuery?: string;
  onClearSearch?: () => void;
  onAddTask: () => void;
  onEditTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onStatusChange: (
    id: string,
    status: TaskStatus
  ) => void;
  onDuplicateTask: (id: string) => void;
}

export default function TaskBoard({
  tasks,
  visibleFields,
  searchQuery,
  onClearSearch,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onDuplicateTask,
}: TaskBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(
    null
  );

  const todoTasks = tasks.filter(
    (task) => task.status === "TODO"
  );

  const inProgressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  );

  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED"
  );

  const onHoldTasks = tasks.filter(
    (task) => task.status === "ON_HOLD"
  );

  // --------------------------------
  // Drag Start
  // --------------------------------
  const handleTaskDragStart = (id: string) => {
    setDraggedTaskId(id);
  };

  // --------------------------------
  // Drag End
  // --------------------------------
  const handleTaskDragEnd = () => {
    setDraggedTaskId(null);
  };

  // --------------------------------
  // Drop
  // --------------------------------
  const handleTaskDrop = (newStatus: TaskStatus) => {
    if (!draggedTaskId) {
      return;
    }

    const task = tasks.find(
      (task) => task.id === draggedTaskId
    );

    if (!task) {
      setDraggedTaskId(null);
      return;
    }

    // Same column - nothing to update
    if (task.status === newStatus) {
      setDraggedTaskId(null);
      return;
    }

    // Update status
    onStatusChange(
      draggedTaskId,
      newStatus
    );

    setDraggedTaskId(null);
  };

  if (searchQuery && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center shadow-xs">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl shadow-xs">
          🔍
        </div>

        <h3 className="mt-4 text-base font-semibold text-gray-800">
          No tasks found matching &quot;{searchQuery}&quot;
        </h3>

        <p className="mt-1 max-w-sm text-xs text-gray-500">
          We couldn&apos;t find any tasks matching your search.
          Try adjusting keywords or clear the filter.
        </p>

        {onClearSearch && (
          <button
            type="button"
            onClick={onClearSearch}
            className="mt-4 rounded-xl bg-gray-900 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-gray-800 transition-colors"
          >
            Clear Search
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

      {/* To Do */}
      <TaskColumn
        title="To Do"
        tasks={todoTasks}
        visibleFields={visibleFields}
        onAddTask={onAddTask}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
        onStatusChange={onStatusChange}
        onDuplicateTask={onDuplicateTask}
        onTaskDragStart={handleTaskDragStart}
        onTaskDragEnd={handleTaskDragEnd}
        onTaskDrop={handleTaskDrop}
      />

      {/* Doing */}
      <TaskColumn
        title="Doing"
        tasks={inProgressTasks}
        visibleFields={visibleFields}
        onAddTask={onAddTask}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
        onStatusChange={onStatusChange}
        onDuplicateTask={onDuplicateTask}
        onTaskDragStart={handleTaskDragStart}
        onTaskDragEnd={handleTaskDragEnd}
        onTaskDrop={handleTaskDrop}
      />

      {/* Completed */}
      <TaskColumn
        title="Completed"
        tasks={completedTasks}
        visibleFields={visibleFields}
        onAddTask={onAddTask}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
        onStatusChange={onStatusChange}
        onDuplicateTask={onDuplicateTask}
        onTaskDragStart={handleTaskDragStart}
        onTaskDragEnd={handleTaskDragEnd}
        onTaskDrop={handleTaskDrop}
      />

      {/* On Hold */}
      <TaskColumn
        title="On Hold"
        tasks={onHoldTasks}
        visibleFields={visibleFields}
        onAddTask={onAddTask}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
        onStatusChange={onStatusChange}
        onDuplicateTask={onDuplicateTask}
        onTaskDragStart={handleTaskDragStart}
        onTaskDragEnd={handleTaskDragEnd}
        onTaskDrop={handleTaskDrop}
      />

    </div>
  );
}