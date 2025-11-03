import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "linear-gradient(135deg, #0f172a, #1e293b, #0f172a)",
        color: "#f8fafc",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "2rem",
            background:
              "radial-gradient(circle at top left, rgba(255,255,255,0.03), rgba(0,0,0,0.3))",
            borderTopLeftRadius: "1.5rem",
            boxShadow: "inset 0 0 20px rgba(255,255,255,0.05)",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: "16px",
              padding: "2rem",
              boxShadow:
                "0 4px 20px rgba(0,0,0,0.4), inset 0 0 10px rgba(255,255,255,0.05)",
              backdropFilter: "blur(10px)",
              minHeight: "85vh",
            }}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

