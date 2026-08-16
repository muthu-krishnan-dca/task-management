import { TaskPriority, TaskStatus } from "@/types/task";
import { applyTheme, getThemeMode, ThemeMode } from "./themeStore";

export interface AppSettings {
  // Appearance
  themeMode: ThemeMode;

  // Notifications
  notifTaskUpdates: boolean;
  notifDueDateReminders: boolean;
  notifOverdueAlerts: boolean;

  // Task Preferences
  defaultPriority: TaskPriority;
  defaultStatus: TaskStatus;
  defaultEstimatedDuration: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  themeMode: "light",
  notifTaskUpdates: true,
  notifDueDateReminders: true,
  notifOverdueAlerts: true,
  defaultPriority: "MEDIUM",
  defaultStatus: "TODO",
  defaultEstimatedDuration: "1 hour",
};

const SETTINGS_KEY = "ablespace_settings";

export function getAppSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const theme = getThemeMode();
    if (!raw) {
      return {
        ...DEFAULT_SETTINGS,
        themeMode: theme,
      };
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      themeMode: theme,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveAppSettings(settings: Partial<AppSettings>): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const current = getAppSettings();
  const updated: AppSettings = {
    ...current,
    ...settings,
  };

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));

  if (settings.themeMode) {
    applyTheme(settings.themeMode);
  }

  window.dispatchEvent(new Event("settingsUpdated"));
  return updated;
}

export function resetAppSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  localStorage.removeItem(SETTINGS_KEY);
  applyTheme(DEFAULT_SETTINGS.themeMode);
  window.dispatchEvent(new Event("settingsUpdated"));
  return DEFAULT_SETTINGS;
}
