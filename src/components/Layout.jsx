import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-glow), var(--bg-base)",
        color: "var(--text-color)",
      }}
    >
      {/* ✅ Fixed sidebar */}
      <Sidebar />

      {/* ✅ Main content shifted right */}
      <div
        style={{
          marginLeft: "240px",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <Navbar />

        <main
          style={{
            flex: 1,
            padding: "2rem",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              background: "var(--card-bg)",
              borderRadius: "20px",
              border: "1px solid var(--card-border)",
              padding: "2rem",
              minHeight: "85vh",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              backdropFilter: "blur(12px)",
            }}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
