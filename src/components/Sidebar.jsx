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
  super_admin: [
    { label: "Users", path: "/users", icon: <FaUsers /> },
    { label: "Roles & Permissions", path: "/roles", icon: <FaCogs /> },
    { label: "Documents", path: "/documents", icon: <FaFileAlt /> },
    { label: "Pricing", path: "/pricing", icon: <FaChartBar /> },
    { label: "Inventory", path: "/inventory", icon: <FaWarehouse /> },
    { label: "Accounts", path: "/accounts", icon: <FaFileInvoice /> },
  ],

  technical_admin: [
    { label: "Permissions", path: "/technical-admin", icon: <FaCogs /> },
    {
  label: "Material Master",
  path: "/materials",
  roles: ["technical_admin", "super_admin"],
}

  ],

  regional_admin: [
    { label: "Dealers", path: "/dealers", icon: <FaUsers /> },
    { label: "Regions", path: "/regions", icon: <FaChartBar /> },
  ],

  finance_admin: [
    { label: "Invoices", path: "/invoices", icon: <FaFileInvoice /> },
    { label: "Accounts", path: "/accounts", icon: <FaUsers /> },
  ],

  regional_manager: [
    { label: "Dealers", path: "/dealers", icon: <FaUsers /> },
    { label: "Approvals", path: "/approvals", icon: <FaChartBar /> },
  ],

  area_manager: [
    { label: "Dealers", path: "/dealers", icon: <FaUsers /> },
  ],

  territory_manager: [
    { label: "Dealers", path: "/dealers", icon: <FaUsers /> },
  ],

  dealer_admin: [
    { label: "My Documents", path: "/documents", icon: <FaFileAlt /> },
    { label: "Campaigns", path: "/campaigns", icon: <FaChartBar /> },
    { label: "Invoices", path: "/invoices", icon: <FaFileInvoice /> },
    { label: "Chat", path: "/chat", icon: <FaUsers /> },
    {label:"Order Approvals" ,path:"/orders/approvals",icon: <FaChartBar /> },
  ],

  dealer_staff: [
    { label: "My Documents", path: "/documents", icon: <FaFileAlt /> },
    {label:"Create Order",path: "/orders/create",icon: <FaChartBar /> },
    {label:"My Orders",path: "/orders/my" ,icon: <FaChartBar /> },
  ],

  inventory_user: [
    { label: "Inventory", path: "/inventory", icon: <FaWarehouse /> },
    { label: "Pricing Updates", path: "/pricing", icon: <FaChartBar /> },
  ],

  accounts_user: [
    { label: "Invoices", path: "/invoices", icon: <FaFileInvoice /> },
    { label: "Statements", path: "/statements", icon: <FaFileAlt /> },
  ],
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

