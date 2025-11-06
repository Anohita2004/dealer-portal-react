import { createTheme } from "@mui/material/styles";

export default function getTheme(mode = "dark") {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#f97316", // glowing amber accent
      },
      secondary: {
        main: "#a78bfa", // lavender accent
      },
      background: {
        default: isDark ? "#0b0d10" : "#f9fafb",
        paper: isDark
          ? "rgba(255,255,255,0.04)"
          : "rgba(255,255,255,0.9)",
      },
      text: {
        primary: isDark ? "#f8fafc" : "#1e293b",
        secondary: isDark ? "#94a3b8" : "#475569",
      },
      divider: isDark
        ? "rgba(255,255,255,0.08)"
        : "rgba(0,0,0,0.08)",
    },

    typography: {
      fontFamily: "'Inter', 'Poppins', sans-serif",
      allVariants: {
        transition: "color 0.3s ease",
      },
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 500 },
      body1: { lineHeight: 1.6 },
    },

    shape: { borderRadius: 20 },

    components: {
      // 🌙 Cards with glass effect
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            background: isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(255,255,255,0.8)",
            backdropFilter: "blur(12px)",
            border: isDark
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid rgba(0,0,0,0.08)",
            boxShadow: isDark
              ? "0 10px 30px rgba(0,0,0,0.4), inset 0 0 10px rgba(255,255,255,0.03)"
              : "0 6px 20px rgba(0,0,0,0.15)",
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: isDark
                ? "0 16px 40px rgba(249,115,22,0.4)"
                : "0 12px 24px rgba(249,115,22,0.3)",
            },
          },
        },
      },

      // ✨ Buttons (rounded glowing gradients)
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: "none",
            fontWeight: 600,
            paddingInline: 18,
            paddingBlock: 10,
            background:
              "linear-gradient(90deg, #f97316, #ea580c)",
            color: "#fff",
            boxShadow: "0 4px 20px rgba(249,115,22,0.3)",
            "&:hover": {
              boxShadow: "0 6px 25px rgba(249,115,22,0.4)",
              transform: "translateY(-2px)",
            },
          },
        },
      },

      // 📊 Table cells (subtle borders + glow headers)
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
            background: isDark
              ? "rgba(249,115,22,0.1)"
              : "rgba(249,115,22,0.15)",
            color: "#fbbf24",
          },
          root: {
            borderBottom: isDark
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid rgba(0,0,0,0.08)",
          },
        },
      },

      // 🧱 Paper (glass backgrounds for menus/dialogs)
      MuiPaper: {
        styleOverrides: {
          root: {
            background: isDark
              ? "rgba(30,30,32,0.9)"
              : "rgba(255,255,255,0.85)",
            backdropFilter: "blur(10px)",
            borderRadius: 20,
            border: isDark
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid rgba(0,0,0,0.08)",
          },
        },
      },

      // 🧭 AppBar / Navbar consistency
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: isDark
              ? "rgba(12,12,14,0.75)"
              : "rgba(255,255,255,0.8)",
            backdropFilter: "blur(14px)",
            color: isDark ? "#f8fafc" : "#1e293b",
            boxShadow: isDark
              ? "0 4px 24px rgba(0,0,0,0.5)"
              : "0 4px 24px rgba(0,0,0,0.1)",
          },
        },
      },

      // 🔘 Inputs / TextFields
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            background: isDark
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.03)",
            "& fieldset": {
              borderColor: isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.1)",
            },
            "&:hover fieldset": {
              borderColor: "#f97316",
            },
          },
          input: {
            color: isDark ? "#e2e8f0" : "#1e293b",
          },
        },
      },
    },
  });
}
