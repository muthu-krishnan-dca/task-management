import { Task } from "@/types/task";
import * as XLSX from "xlsx";

export interface ExportResult {
  success: boolean;
  message?: string;
  error?: string;
}

function getFormattedTasksData(tasks: Task[]) {
  return tasks.map((t) => ({
    "Task ID": t.id || (t as any)._id || "—",
    "Title": t.title || "Untitled",
    "Description": t.description || "",
    "Status": t.status || "TODO",
    "Priority": t.priority || "MEDIUM",
    "Project": (t as any).project || "General",
    "Assignee": (t as any).assignedTo || (t as any).assignee || "Unassigned",
    "Due Date": t.dueDate || "No due date",
    "Due Time": (t as any).dueTime || "—",
    "Estimated Time": (t as any).estimatedTime || "—",
    "Created At": t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—",
  }));
}

function getFilename(extension: "csv" | "xlsx"): string {
  const dateStr = new Date().toISOString().split("T")[0];
  return `ablespace-tasks-${dateStr}.${extension}`;
}

/**
 * Export filtered tasks to CSV file
 */
export function exportTasksToCSV(tasks: Task[]): ExportResult {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return {
      success: false,
      error: "⚠️ No tasks available to export.",
    };
  }

  try {
    const formattedData = getFormattedTasksData(tasks);
    const headers = Object.keys(formattedData[0]);

    // Build CSV content with UTF-8 BOM for proper Excel encoding
    const csvRows: string[] = [];
    csvRows.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","));

    for (const row of formattedData) {
      const values = headers.map((header) => {
        const val = (row as any)[header] ?? "";
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(","));
    }

    const csvString = "\uFEFF" + csvRows.join("\r\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", getFilename("csv"));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      message: `Exported ${tasks.length} task${tasks.length > 1 ? "s" : ""} to CSV successfully! 📄`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to export CSV: ${err.message || "Unknown error"}`,
    };
  }
}

/**
 * Export filtered tasks to Excel (.xlsx) file
 */
export function exportTasksToExcel(tasks: Task[]): ExportResult {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return {
      success: false,
      error: "⚠️ No tasks available to export.",
    };
  }

  try {
    const formattedData = getFormattedTasksData(tasks);

    // Create Worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Set smart column widths
    const columnWidths = [
      { wch: 18 }, // Task ID
      { wch: 30 }, // Title
      { wch: 40 }, // Description
      { wch: 14 }, // Status
      { wch: 12 }, // Priority
      { wch: 18 }, // Project
      { wch: 22 }, // Assignee
      { wch: 14 }, // Due Date
      { wch: 10 }, // Due Time
      { wch: 14 }, // Estimated Time
      { wch: 14 }, // Created At
    ];
    worksheet["!cols"] = columnWidths;

    // Create Workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Workspace Tasks");

    // Trigger Download
    XLSX.writeFile(workbook, getFilename("xlsx"));

    return {
      success: true,
      message: `Exported ${tasks.length} task${tasks.length > 1 ? "s" : ""} to Excel (.xlsx) successfully! 📊`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to export Excel: ${err.message || "Unknown error"}`,
    };
  }
}
