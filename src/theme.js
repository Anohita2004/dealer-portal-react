import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#f4f5f7",
      paper: "#ffffff",
    },
    primary: { main: "#000000" }, // black accents
    secondary: { main: "#616161" },
    text: {
      primary: "#111",
      secondary: "#555",
    },
  },
  shape: { borderRadius: 20 },
  typography: {
    fontFamily: "'Poppins', 'Inter', sans-serif",
    h5: { fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          background: "#ffffff",
          boxShadow:
            "6px 6px 16px rgba(0,0,0,0.1), -6px -6px 16px rgba(255,255,255,0.9)",
          transition: "0.3s ease",
          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow:
              "10px 10px 24px rgba(0,0,0,0.15), -10px -10px 24px rgba(255,255,255,0.8)",
          },
        },
      },
    },
  },
});

export default theme;
