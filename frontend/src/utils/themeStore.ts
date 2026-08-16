export type ThemeMode = "light" | "dark" | "system";

export function getThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const saved = (localStorage.getItem("themeMode") ||
    localStorage.getItem("theme")) as ThemeMode;
  if (saved === "dark" || saved === "light" || saved === "system") {
    return saved;
  }
  return "light";
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof window === "undefined") return;

  localStorage.setItem("themeMode", mode);
  localStorage.setItem("theme", mode);

  let isDark = false;
  if (mode === "dark") {
    isDark = true;
  } else if (mode === "light") {
    isDark = false;
  } else {
    isDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  window.dispatchEvent(new CustomEvent("themeUpdated", { detail: { mode, isDark } }));
}

export function initTheme(): void {
  if (typeof window === "undefined") return;
  const currentMode = getThemeMode();
  applyTheme(currentMode);

  // Listen to system changes if in system mode
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      const mode = getThemeMode();
      if (mode === "system") {
        if (e.matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    });
}
