import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: "light" | "dark";
  toggleTheme?: () => void;
  setTheme?: (theme: Theme) => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    return (localStorage.getItem("theme-preference") as Theme) || null;
  } catch {
    return null;
  }
}

function saveTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("theme-preference", theme);
  } catch {
    console.error("Failed to save theme preference");
  }
}

function getEffectiveTheme(preference: Theme): "light" | "dark" {
  if (preference === "system") {
    return getSystemTheme();
  }
  return preference;
}

function applyTheme(theme: "light" | "dark"): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  switchable = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (switchable) {
      const stored = getStoredTheme();
      return stored || defaultTheme;
    }
    return defaultTheme;
  });

  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">(() => {
    return getEffectiveTheme(theme);
  });

  const [mounted, setMounted] = useState(false);

  // 初始化和应用主题
  useEffect(() => {
    const effective = getEffectiveTheme(theme);
    setEffectiveTheme(effective);
    applyTheme(effective);
    setMounted(true);
  }, [theme]);

  // 监听系统主题变化
  useEffect(() => {
    if (!mounted || theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const newEffective = e.matches ? "dark" : "light";
      setEffectiveTheme(newEffective);
      applyTheme(newEffective);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (switchable) {
      saveTheme(newTheme);
    }
  };

  const toggleTheme = switchable
    ? () => {
        if (theme === "system") {
          setTheme(effectiveTheme === "light" ? "dark" : "light");
        } else {
          setTheme(effectiveTheme === "light" ? "dark" : "light");
        }
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, toggleTheme, setTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
