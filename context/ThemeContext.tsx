"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { THEMES, type ResolvedTheme, type ThemeMode } from "../lib/theme";

type ThemeContextValue = {
  mode: ThemeMode;
  theme: ResolvedTheme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("kl-theme");
      const next: ThemeMode = saved === "light" ? "light" : "dark";
      setMode(next);
    } catch {
      setMode("dark");
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("kl-theme", mode);
    } catch {
      // ignore persistence failures
    }
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      theme: THEMES[mode],
      toggleTheme: () => setMode((prev) => (prev === "dark" ? "light" : "dark")),
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
