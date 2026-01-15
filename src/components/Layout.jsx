import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Outlet, useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./PageTransition";
import BarcodeCaptureWidget from "./BarcodeCaptureWidget";

export default function Layout() {
  const location = useLocation();

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        background: (theme) => theme.palette.mode === 'dark' ? 'var(--color-background)' : '#F9FAFB',
        color: "text.primary",
      }}
    >
      {/* Sidebar */}
      <Sidebar />
      <BarcodeCaptureWidget />

      {/* Main section (Navbar + dashboard content) */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0, // Prevent overflow issues
        }}
      >
        <Navbar />

        <Box
          component="main"
          sx={{
            flex: 1,
            padding: { xs: 2, md: 4 },
            overflowX: "hidden",
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Box
                sx={{
                  background: "var(--color-surface)",
                  borderRadius: "var(--radius-2xl)",
                  border: "1px solid",
                  borderColor: "divider",
                  padding: { xs: 2, md: 4 },
                  boxShadow: "var(--shadow-sm)",
                  minHeight: "calc(100vh - 120px)",
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Outlet />
              </Box>
            </PageTransition>
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
}

