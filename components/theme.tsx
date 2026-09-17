"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Icon } from "./icon";

type Theme = "light" | "dark" | "system";
const KEY = "9p.theme";
const valid = (value: string | null): Theme =>
  value === "light" || value === "dark" ? value : "system";
const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({ theme: "system", setTheme: () => {} });

// Runs before paint so a saved light preference never flashes dark (or vice versa).
export const themeScript = `(function(){var t='system';try{t=localStorage.getItem('${KEY}')||'system'}catch(e){}document.documentElement.dataset.theme=t==='light'||t==='dark'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'})()`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, updateTheme] = useState<Theme>("system");
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    let preference: Theme = "system";
    try {
      preference = valid(localStorage.getItem(KEY));
    } catch {
      /* Session preference still works. */
    }
    const apply = () => {
      document.documentElement.dataset.theme =
        preference === "system"
          ? media.matches
            ? "dark"
            : "light"
          : preference;
      updateTheme(preference);
    };
    const storage = (event: StorageEvent) => {
      if (event.key === KEY || event.key === null) {
        preference = valid(event.newValue);
        apply();
      }
    };
    const change = (event: Event) => {
      preference = (event as CustomEvent<Theme>).detail;
      apply();
    };
    apply();
    media.addEventListener("change", apply);
    window.addEventListener("storage", storage);
    window.addEventListener("9p:theme", change);
    return () => {
      media.removeEventListener("change", apply);
      window.removeEventListener("storage", storage);
      window.removeEventListener("9p:theme", change);
    };
  }, []);
  const setTheme = (next: Theme) => {
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* Storage may be unavailable. */
    }
    window.dispatchEvent(new CustomEvent("9p:theme", { detail: next }));
  };
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemePicker({ expanded = false }: { expanded?: boolean }) {
  const { theme, setTheme } = useContext(ThemeContext);
  return (
    <div
      className={expanded ? "theme-options" : "theme-picker"}
      role="group"
      aria-label="Appearance"
    >
      {(["light", "dark", "system"] as const).map((value) => (
        <button
          key={value}
          type="button"
          className={theme === value ? "selected" : ""}
          aria-pressed={theme === value}
          aria-label={`${value[0].toUpperCase()}${value.slice(1)} theme`}
          title={`${value[0].toUpperCase()}${value.slice(1)} theme`}
          onClick={() => setTheme(value)}
        >
          {expanded && (
            <span className={`theme-preview ${value}`}>
              <span />
              <span>
                <i />
                <i />
                <i />
              </span>
            </span>
          )}
          <span className="theme-label">
            <Icon
              name={
                value === "light"
                  ? "sun"
                  : value === "dark"
                    ? "moon"
                    : "monitor"
              }
              size={16}
            />
            {expanded && value[0].toUpperCase() + value.slice(1)}
          </span>
        </button>
      ))}
    </div>
  );
}

export function AuthTheme() {
  return (
    <div className="auth-theme">
      <ThemePicker />
    </div>
  );
}
