import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const { user } = useContext(AuthContext);
  const { pathname } = useLocation();

  const role = user?.role?.toLowerCase() || "user";

  const baseLinks = [{ path: "/dashboard", label: "Dashboard", icon: "🏠" }];

  const roleLinks = {
    dealer: [
      { path: "/invoices", label: "Invoices", icon: "🧾" },
      { path: "/documents", label: "Documents", icon: "📄" },
    ],
    tm: [{ path: "/reports", label: "Reports", icon: "📊" }],
    am: [{ path: "/reports", label: "Reports", icon: "📊" }],
    admin: [
      { path: "/campaigns", label: "Campaigns", icon: "📢" },
      { path: "/admin", label: "Dealer Management", icon: "🧑‍💼" },
      { path: "/reports", label: "Reports", icon: "📊" },
    ],
    accounts: [{ path: "/reports", label: "Accounts Reports", icon: "📘" }],
    inventory: [{ path: "/inventory", label: "Stock View", icon: "📦" }],
  };

  const links = [...baseLinks, ...(roleLinks[role] || [])];

  return (
    <aside
      style={{
        width: "240px",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        background: "var(--sidebar-bg)",
        backdropFilter: "blur(14px)",
        borderRight: "1px solid rgba(255,255,255,0.1)",
        padding: "2rem 1rem",
        display: "flex",
        flexDirection: "column",
        color: "var(--text-color)",
        boxShadow: "4px 0 20px rgba(0,0,0,0.35)",
        zIndex: 50,
      }}
    >
      {/* ROLE HEADER */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "2rem",
          paddingBottom: "1rem",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <h3 style={{ color: "#f97316", fontWeight: "700" }}>
          {role.toUpperCase()}
        </h3>
      </div>

      {/* NAV LINKS */}
      {links.map((l) => {
        const active = pathname === l.path;

        return (
          <Link
            key={l.path}
            to={l.path}
            style={{
              textDecoration: "none",
              color: active ? "#f97316" : "var(--text-color)",
              background: active
                ? "linear-gradient(90deg, rgba(249,115,22,0.3), rgba(249,115,22,0.1))"
                : "transparent",
              padding: "0.75rem 1rem",
              borderRadius: "9999px",
              marginBottom: "0.5rem",
              fontWeight: active ? "600" : "400",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              transition: "0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.background =
                "linear-gradient(90deg, rgba(249,115,22,0.18), rgba(249,115,22,0.07))";
              e.target.style.color = "#f97316";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = active
                ? "linear-gradient(90deg, rgba(249,115,22,0.3), rgba(249,115,22,0.1))"
                : "transparent";
              e.target.style.color = active ? "#f97316" : "var(--text-color)";
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>{l.icon}</span>
            {l.label}
          </Link>
        );
      })}
    </aside>
  );
}
