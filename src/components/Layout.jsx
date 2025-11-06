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
        background: "var(--bg-glow), var(--bg-base)",
        color: "var(--text-color)",
        overflow: "hidden",
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backdropFilter: "blur(8px)",
        }}
      >
        <Navbar />

        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "2rem",
            background: "transparent",
            borderTopLeftRadius: "1.5rem",
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
              color: "var(--text-color)",
            }}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
