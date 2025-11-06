import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeModeContext = createContext({ mode: "dark", toggle: () => {} });

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem("ui-mode") || "dark");

  useEffect(() => {
    localStorage.setItem("ui-mode", mode);
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  const value = useMemo(() => ({ mode, toggle: () => setMode((m) => (m === "dark" ? "light" : "dark")) }), [mode]);

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  return useContext(ThemeModeContext);
}


