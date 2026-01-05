import { createTheme } from "@mui/material/styles";

/**
 * Design System Theme
 * Single source of truth for Material-UI components
 * Uses the same color palette as CSS variables
 */
export default function getTheme(mode = "light") {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#2563EB",
        dark: "#1E40AF",
        light: "#DBEAFE",
        contrastText: "#FFFFFF",
      },
      success: {
        main: "#16A34A",
      },
      warning: {
        main: "#F59E0B",
      },
      error: {
        main: "#DC2626",
      },
      text: {
        primary: isDark ? "#F9FAFB" : "#111827",
        secondary: isDark ? "#9CA3AF" : "#6B7280",
      },
      background: {
        default: isDark ? "#111827" : "#F9FAFB",
        paper: isDark ? "#1F2937" : "#FFFFFF",
      },
      divider: isDark ? "#374151" : "#E5E7EB",

      // Premium Accents (Khroma)
      accent: {
        opal: "#A1C2C7",
        blueBell: "#9E96C6",
        pink: "#FEC7BF",
        corvette: "#FBDAA4",
        opalSoft: "rgba(161, 194, 199, 0.15)",
        blueBellSoft: "rgba(158, 150, 198, 0.15)",
        pinkSoft: "rgba(254, 199, 191, 0.15)",
        corvetteSoft: "rgba(251, 218, 164, 0.15)",
      }
    },

    typography: {
      fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: "2.25rem",
        lineHeight: 1.25,
        letterSpacing: "-0.02em",
      },
      h2: {
        fontWeight: 700,
        fontSize: "1.875rem",
        lineHeight: 1.25,
        letterSpacing: "-0.01em",
      },
      h3: {
        fontWeight: 600,
        fontSize: "1.5rem",
        lineHeight: 1.3,
      },
      h4: {
        fontWeight: 600,
        fontSize: "1.25rem",
        lineHeight: 1.4,
      },
      h5: {
        fontWeight: 500,
        fontSize: "1.125rem",
        lineHeight: 1.5,
      },
      h6: {
        fontWeight: 500,
        fontSize: "1rem",
        lineHeight: 1.5,
      },
      body1: {
        fontSize: "1rem",
        lineHeight: 1.75,
        fontWeight: 400,
      },
      body2: {
        fontSize: "0.875rem",
        lineHeight: 1.5,
        fontWeight: 400,
      },
      button: {
        textTransform: "none",
        fontWeight: 600,
      },
    },

    shape: {
      borderRadius: 12,
    },

    spacing: 4, // Base spacing unit (4px)

    components: {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // CARDS
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            background: isDark ? "#1F2937" : "#FFFFFF",
            border: `1px solid ${isDark ? "#374151" : "#E5E7EB"}`,
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
            transition: "all 200ms ease",
            "&:hover": {
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              transform: "translateY(-2px)",
            },
          },
        },
      },

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // BUTTONS
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: "none",
            fontWeight: 600,
            padding: "10px 18px",
            fontSize: "0.875rem",
            transition: "all 200ms ease",
            boxShadow: "none",
            "&:hover": {
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            },
            "&:active": {
              transform: "translateY(1px)",
            },
          },
          contained: {
            backgroundColor: "#2563EB",
            color: "#FFFFFF",
            "&:hover": {
              backgroundColor: "#1E40AF",
            },
            "&:disabled": {
              backgroundColor: isDark ? "#374151" : "#E5E7EB",
              color: isDark ? "#6B7280" : "#9CA3AF",
            },
          },
          outlined: {
            borderColor: "#2563EB",
            color: "#2563EB",
            backgroundColor: "transparent",
            "&:hover": {
              borderColor: "#1E40AF",
              backgroundColor: "#DBEAFE",
            },
          },
          text: {
            color: "#2563EB",
            "&:hover": {
              backgroundColor: "#DBEAFE",
            },
          },
        },
      },

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // TABLES
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 600,
            fontSize: "0.875rem",
            background: isDark ? "#111827" : "#F9FAFB",
            color: isDark ? "#F9FAFB" : "#111827",
            borderBottom: `1px solid ${isDark ? "#374151" : "#E5E7EB"}`,
          },
          body: {
            fontSize: "0.875rem",
            borderBottom: `1px solid ${isDark ? "#374151" : "#E5E7EB"}`,
            color: isDark ? "#F9FAFB" : "#111827",
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: "background-color 150ms ease",
            "&:hover": {
              backgroundColor: isDark ? "rgba(37, 99, 235, 0.1)" : "#DBEAFE",
            },
            "&:last-child td": {
              borderBottom: "none",
            },
          },
        },
      },

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // INPUTS / TEXT FIELDS
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            "& fieldset": {
              borderColor: isDark ? "#374151" : "#E5E7EB",
            },
            "&:hover fieldset": {
              borderColor: "#2563EB",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#2563EB",
              borderWidth: "2px",
            },
            "&.Mui-error fieldset": {
              borderColor: "#DC2626",
            },
          },
          input: {
            color: isDark ? "#F9FAFB" : "#111827",
            fontSize: "0.875rem",
            padding: "12px 14px",
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: isDark ? "#9CA3AF" : "#6B7280",
            fontSize: "0.875rem",
            fontWeight: 500,
            "&.Mui-focused": {
              color: "#2563EB",
            },
            "&.Mui-error": {
              color: "#DC2626",
            },
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            fontSize: "0.75rem",
            marginTop: "4px",
            color: isDark ? "#9CA3AF" : "#6B7280",
            "&.Mui-error": {
              color: "#DC2626",
            },
          },
        },
      },

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // PAPER (Dialogs, Menus, etc.)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      MuiPaper: {
        styleOverrides: {
          root: {
            background: isDark ? "#1F2937" : "#FFFFFF",
            borderRadius: 12,
            border: `1px solid ${isDark ? "#374151" : "#E5E7EB"}`,
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          },
        },
      },

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // APP BAR / NAVBAR
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: isDark ? "#1F2937" : "#FFFFFF",
            color: isDark ? "#F9FAFB" : "#111827",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            borderBottom: `1px solid ${isDark ? "#374151" : "#E5E7EB"}`,
          },
        },
      },

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // CHIP / BADGE
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
            fontSize: "0.75rem",
          },
        },
      },
      MuiBadge: {
        styleOverrides: {
          badge: {
            fontWeight: 600,
            fontSize: "0.75rem",
          },
        },
      },
    },
  });
}
