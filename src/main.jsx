import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider, CssBaseline } from "@mui/material";
import getTheme from "./theme.js";
import { ThemeModeProvider, useThemeMode } from "./context/ThemeContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx"; // ✅ add this
import { AuthProvider } from "./context/AuthContext.jsx"; // ✅ add this if not wrapped yet
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ThemedApp() {
  const { mode } = useThemeMode();
  return (
    <ThemeProvider theme={getTheme(mode)}>
      <CssBaseline />
      <App />
      <ToastContainer position="bottom-right" />
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <ThemeModeProvider>
        <NotificationProvider>
          <ThemedApp />
        </NotificationProvider>
      </ThemeModeProvider>
    </AuthProvider>
  </StrictMode>
);
