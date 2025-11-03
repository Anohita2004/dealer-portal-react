import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div>
      <Navbar />
      <div style={{ display: "flex" }}>
        <Sidebar />
        <main style={{ flex: 1, padding: "1.5rem" }}>
          <Outlet />  {/* 👈 This renders the page inside Layout */}
        </main>
      </div>
    </div>
  );
}

