"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("aumnex-theme");

    if (
      savedTheme === "light" ||
      savedTheme === "dark" ||
      savedTheme === "system"
    ) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      setTheme("light");
      applyTheme("light");
    }
  }, []);

  function applyTheme(selectedTheme) {
    const root = document.documentElement;

    root.classList.remove("light", "dark");

    if (selectedTheme === "dark") {
      root.classList.add("dark");
      return;
    }

    if (selectedTheme === "light") {
      root.classList.add("light");
      return;
    }

    // System theme
    const systemDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    root.classList.add(systemDark ? "dark" : "light");
  }

  function changeTheme(newTheme) {
    setTheme(newTheme);

    localStorage.setItem(
      "aumnex-theme",
      newTheme
    );

    applyTheme(newTheme);
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        changeTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
}