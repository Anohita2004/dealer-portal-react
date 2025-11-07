import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg-glow), var(--bg-base)",
        color: "var(--text-color)",
      }}
    >
      {/* ✅ Sidebar - now flexible height */}
      <Sidebar />

      {/* ✅ Main section (Navbar + dashboard) */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Navbar />

        <main
          style={{
            flex: 1,
            padding: "2rem",
            overflowX: "hidden",
          }}
        >
          <div
            style={{
              background: "var(--card-bg)",
              borderRadius: "20px",
              border: "1px solid var(--card-border)",
              padding: "2rem",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              backdropFilter: "blur(12px)",
              minHeight: "calc(100vh - 100px)", // subtracts navbar height
            }}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
