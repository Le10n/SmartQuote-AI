import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeContext, type Theme, type ThemeContextValue } from "@/hooks/theme-context";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem("smartquote-theme") as Theme | null;
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }

  return "system";
}

function getSystemTheme() {
  if (typeof window === "undefined") return "light" as const;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(getSystemTheme);
  const resolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    function handleChange() {
      setSystemTheme(query.matches ? "dark" : "light");
    }
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = window.document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    window.localStorage.setItem("smartquote-theme", theme);
  }, [resolvedTheme, theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: setThemeState,
      toggleTheme: () => setThemeState((current) => (current === "dark" ? "light" : "dark")),
    }),
    [resolvedTheme, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
