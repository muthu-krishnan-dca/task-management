"use client";

import { useEffect } from "react";
import { initTheme } from "@/utils/themeStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initTheme();
  }, []);

  return <>{children}</>;
}
