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
        background: "var(--color-background)",
        color: "var(--color-text-primary)",
      }}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main section (Navbar + dashboard) */}
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
            padding: "var(--spacing-6)",
            overflowX: "hidden",
          }}
        >
          <div
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--color-border)",
              padding: "var(--spacing-6)",
              boxShadow: "var(--shadow-subtle)",
              minHeight: "calc(100vh - 100px)",
            }}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
