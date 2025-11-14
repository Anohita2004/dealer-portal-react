import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaFileInvoice,
  FaFileAlt,
  FaChartBar,
  FaCogs,
  FaUsers,
  FaWarehouse,
  FaBars,
} from "react-icons/fa";

export default function Sidebar() {
  const { user } = useContext(AuthContext);
  const { pathname } = useLocation();

  const [collapsed, setCollapsed] = useState(false);

  const role = user?.role?.toLowerCase() || "user";

  const baseLinks = [{ path: "/dashboard", label: "Dashboard", icon: <FaHome /> }];

  const roleLinks = {
    dealer: [
      { path: "/invoices", label: "Invoices", icon: <FaFileInvoice /> },
      { path: "/documents", label: "Documents", icon: <FaFileAlt /> },
      { path: "/reports", label: "Reports", icon: <FaChartBar /> },
    ],
    tm: [{ path: "/reports", label: "Reports", icon: <FaChartBar /> }],
    am: [{ path: "/reports", label: "Reports", icon: <FaChartBar /> }],
    admin: [
      { path: "/campaigns", label: "Campaigns", icon: <FaCogs /> },
      { path: "/admin", label: "Dealer Mgmt", icon: <FaUsers /> },
      { path: "/admin/documents", label: "Documents", icon: <FaFileAlt /> },
      { path: "/reports", label: "Reports", icon: <FaChartBar /> },
    ],
    accounts: [{ path: "/reports", label: "Accounts Reports", icon: <FaChartBar /> }],
    inventory: [{ path: "/inventory", label: "Stock View", icon: <FaWarehouse /> }],
  };

  const links = [...baseLinks, ...(roleLinks[role] || [])];

  return (
    <aside
      style={{
        width: collapsed ? "70px" : "240px",
        background: "var(--sidebar-bg)",
        backdropFilter: "blur(14px)",
        borderRight: "1px solid var(--card-border)",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s ease",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {/* HEADER + TOGGLE */}
      <div
        style={{
          display: "flex",
          justifyContent: collapsed ? "center" : "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          paddingBottom: "1rem",
          borderBottom: "1px solid var(--card-border)",
        }}
      >
        {!collapsed && (
          <h3 style={{ color: "#f97316", fontWeight: "700" }}>
            {role.toUpperCase()}
          </h3>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "8px",
            padding: "0.5rem",
            cursor: "pointer",
            color: "var(--text-color)",
          }}
        >
          <FaBars />
        </button>
      </div>

      {/* NAV LINKS */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {links.map((l) => {
          const active = pathname === l.path;

          return (
            <div style={{ position: "relative" }} key={l.path}>
              <Link
                to={l.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: collapsed ? "0" : "0.75rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  color: active ? "#f97316" : "var(--text-color)",
                  textDecoration: "none",
                  background: active
                    ? "linear-gradient(90deg, rgba(249,115,22,0.25), rgba(249,115,22,0.1))"
                    : "transparent",
                  fontWeight: active ? "600" : "400",
                  transition: "0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background =
                    "linear-gradient(90deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))";
                  e.target.style.color = "#f97316";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = active
                    ? "linear-gradient(90deg, rgba(249,115,22,0.25), rgba(249,115,22,0.1))"
                    : "transparent";
                  e.target.style.color = active ? "#f97316" : "var(--text-color)";
                }}
              >
                <span style={{ fontSize: "1.3rem" }}>{l.icon}</span>
                {!collapsed && <span>{l.label}</span>}
              </Link>

              {/* Tooltip when collapsed */}
              {collapsed && <div className="sidebar-tooltip">{l.label}</div>}
            </div>
          );
        })}
      </div>

      <style>
        {`
            .sidebar-tooltip {
                position: absolute;
                left: 80px;
                top: 50%;
                transform: translateY(-50%);
                background: var(--card-bg);
                padding: 6px 10px;
                border-radius: 6px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.25);
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: 0.2s ease;
                color: var(--text-color);
                border: 1px solid var(--card-border);
            }
            a:hover + .sidebar-tooltip {
                opacity: 1;
            }
        `}
      </style>
    </aside>
  );
}

