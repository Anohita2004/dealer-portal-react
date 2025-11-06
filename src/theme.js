import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#0f172a",
      paper: "#0b1222",
    },
    primary: { main: "#3b82f6" },
    secondary: { main: "#a78bfa" },
    success: { main: "#22c55e" },
    error: { main: "#ef4444" },
    warning: { main: "#f59e0b" },
    info: { main: "#60a5fa" },
    text: {
      primary: "#e2e8f0",
      secondary: "#94a3b8",
    },
  },
  shape: { borderRadius: 20 },
  typography: {
    fontFamily: "'Poppins', 'Inter', sans-serif",
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    body1: { lineHeight: 1.6 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          background: "rgba(255,255,255,0.04)",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.35), inset 0 0 10px rgba(255,255,255,0.04)",
          transition: "0.3s ease",
          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow:
              "0 16px 40px rgba(0,0,0,0.45), inset 0 0 10px rgba(255,255,255,0.06)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 700 },
      },
    },
  },
});

export default theme;
