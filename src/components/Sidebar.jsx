/*import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const { user } = useContext(AuthContext);
  const { pathname } = useLocation();

  const baseLinks = [{ path: "/dashboard", label: "Dashboard" }];
  const roleLinks = {
    dealer: [
      { path: "/invoices", label: "Invoices" },
      { path: "/documents", label: "Documents" },
    ],
    tm: [{ path: "/reports", label: "Reports" }],
    am: [{ path: "/reports", label: "Reports" }],
    admin: [
      { path: "/campaigns", label: "Campaigns" },
      { path: "/admin", label: "Dealer Management" },
      { path: "/reports", label: "Reports" },
    ],
    accounts: [{ path: "/reports", label: "Accounts Reports" }],
    inventory: [{ path: "/inventory", label: "Stock View" }],
  };

  const links = [...baseLinks, ...(roleLinks[user?.role?.toLowerCase()] || [])];

  return (
    <aside
      style={{
        width: "240px",
        background: "rgba(12, 12, 14, 0.78)",
        backdropFilter: "blur(10px)",
        borderRight: "1px solid rgba(255,255,255,0.1)",
        color: "#cbd5e1",
        padding: "2rem 1rem",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        boxShadow: "4px 0 20px rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: "2rem",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          paddingBottom: "1rem",
        }}
      >
        <h3 style={{ color: "#f97316", fontWeight: "bold" }}>
          {user?.role?.toUpperCase() || "USER"}
        </h3>
      </div>

      {links.map((l) => (
        <Link
          key={l.path}
          to={l.path}
          style={{
            textDecoration: "none",
            color: pathname === l.path ? "#f97316" : "#e2e8f0",
            background:
              pathname === l.path
                ? "linear-gradient(90deg, rgba(249,115,22,0.25), rgba(249,115,22,0.1))"
                : "transparent",
            fontWeight: pathname === l.path ? "bold" : "normal",
            padding: "0.75rem 1rem",
            borderRadius: 9999,
            margin: "0.25rem 0",
            transition: "all 0.3s ease",
            display: "block",
          }}
          onMouseEnter={(e) => {
            e.target.style.background =
              "linear-gradient(90deg, rgba(249,115,22,0.2), rgba(249,115,22,0.08))";
            e.target.style.color = "#f97316";
          }}
          onMouseLeave={(e) => {
            e.target.style.background =
              pathname === l.path
                ? "linear-gradient(90deg, rgba(249,115,22,0.25), rgba(249,115,22,0.1))"
                : "transparent";
            e.target.style.color =
              pathname === l.path ? "#f97316" : "#e2e8f0";
          }}
        >
          {l.label}
        </Link>
      ))}
    </aside>
  );
}*/
import React from "react";
import { NavLink } from "react-router-dom";
import {
  DashboardRounded,
  ReceiptLong,
  FolderCopy,
  Assessment,
  Campaign,
  Settings,
  Logout,
} from "@mui/icons-material";
import { useThemeMode } from "../context/ThemeContext";

export default function Sidebar() {
  const { mode } = useThemeMode();

  const menuItems = [
    { label: "Dashboard", icon: <DashboardRounded />, path: "/dashboard" },
    { label: "Invoices", icon: <ReceiptLong />, path: "/invoices" },
    { label: "Documents", icon: <FolderCopy />, path: "/documents" },
    { label: "Reports", icon: <Assessment />, path: "/reports" },
    { label: "Campaigns", icon: <Campaign />, path: "/campaigns" },
  ];

  return (
    <aside
      style={{
        width: 250,
        height: "100vh",
        background:
          mode === "dark"
            ? "linear-gradient(160deg, rgba(15,15,17,0.9), rgba(30,30,32,0.6))"
            : "rgba(255,255,255,0.8)",
        borderRight:
          mode === "dark"
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid rgba(0,0,0,0.08)",
        backdropFilter: "blur(18px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "1.5rem 1rem",
        boxShadow:
          mode === "dark"
            ? "inset -1px 0 10px rgba(0,0,0,0.4)"
            : "inset -1px 0 10px rgba(0,0,0,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Logo / Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
        <img
          src="/logo192.png"
          alt="Portal Logo"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            boxShadow: "0 0 10px rgba(249,115,22,0.5)",
          }}
        />
        <strong
          style={{
            fontSize: "1.2rem",
            color: "var(--accent, #f97316)",
            letterSpacing: "0.5px",
          }}
        >
          Dealer Portal
        </strong>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "0.8rem",
              padding: "0.75rem 1rem",
              borderRadius: 12,
              color: isActive
                ? "#fff"
                : mode === "dark"
                ? "#cbd5e1"
                : "#1e293b",
              background: isActive
                ? "linear-gradient(90deg, #f97316, #ea580c)"
                : "transparent",
              fontWeight: 500,
              textDecoration: "none",
              transition: "0.3s ease",
              boxShadow: isActive
                ? "0 0 15px rgba(249,115,22,0.4)"
                : "none",
            })}
          >
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div style={{ marginTop: "2rem" }}>
        <NavLink
          to="/settings"
          style={({ isActive }) => ({
            display: "flex",
            alignItems: "center",
            gap: "0.8rem",
            padding: "0.7rem 1rem",
            borderRadius: 12,
            color: isActive
              ? "#fff"
              : mode === "dark"
              ? "#cbd5e1"
              : "#1e293b",
            background: isActive
              ? "linear-gradient(90deg, #f97316, #ea580c)"
              : "transparent",
            fontWeight: 500,
            textDecoration: "none",
            transition: "0.3s ease",
          })}
        >
          <Settings fontSize="small" /> Settings
        </NavLink>

        <NavLink
          to="/logout"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.8rem",
            padding: "0.7rem 1rem",
            borderRadius: 12,
            color: "#ef4444",
            textDecoration: "none",
            marginTop: "0.5rem",
            transition: "0.3s ease",
          }}
        >
          <Logout fontSize="small" /> Logout
        </NavLink>
      </div>
    </aside>
  );
}

