import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import api from "../services/api";
import socket from "../services/socket";

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
import { FaMoneyCheckAlt } from "react-icons/fa";

export default function Sidebar() {
  const { user } = useContext(AuthContext);
  const { pathname } = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(0);

  const role = user?.role?.toLowerCase() || "user";

  // -------------------------
  // BASE MENU LINKS
  // -------------------------
  const baseLinks = [
    { path: "/dashboard", label: "Dashboard", icon: <FaHome /> },
    { path: "/chat", label: "Chat", icon: <FaUsers /> },
  ];

  // -------------------------
  // ROLE-BASED NAVIGATION
  // -------------------------
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
      { label: "Material Master", path: "/materials", icon: <FaCogs /> },
    ],

    regional_admin: [
      { label: "Dealers", path: "/dealers", icon: <FaUsers /> },
      { label: "Regions", path: "/regions", icon: <FaChartBar /> },
    ],

    finance_admin: [
      { label: "Invoices", path: "/invoices", icon: <FaFileInvoice /> },
      {
        label: "Payment Approvals",
        path: "/payments/finance/pending",
        icon: <FaMoneyCheckAlt />,
      },
      { label: "Accounts", path: "/accounts", icon: <FaUsers /> },
    ],

    regional_manager: [
      { label: "Dealers", path: "/dealers", icon: <FaUsers /> },
      { label: "Approvals", path: "/approvals", icon: <FaChartBar /> },
    ],

    area_manager: [{ label: "Dealers", path: "/dealers", icon: <FaUsers /> }],

    territory_manager: [
      { label: "Dealers", path: "/dealers", icon: <FaUsers /> },
    ],

    dealer_admin: [
      { label: "My Documents", path: "/documents", icon: <FaFileAlt /> },
      { label: "Campaigns", path: "/campaigns", icon: <FaChartBar /> },
      { label: "Invoices", path: "/invoices", icon: <FaFileInvoice /> },
      {
        label: "Order Approvals",
        path: "/orders/approvals",
        icon: <FaChartBar />,
      },
      {
        label: "Payment Approvals",
        path: "/payments/dealer/pending",
        icon: <FaMoneyCheckAlt />,
      },
    ],

    dealer_staff: [
      { label: "My Documents", path: "/documents", icon: <FaFileAlt /> },
      { label: "Create Order", path: "/orders/create", icon: <FaChartBar /> },
      { label: "My Orders", path: "/orders/my", icon: <FaChartBar /> },

      // NEW: payment
      { label: "Make Payment", path: "/payments/create", icon: <FaMoneyCheckAlt /> },
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

  // -------------------------
  // UNREAD BADGE LOGIC
  // -------------------------
  useEffect(() => {
    let mounted = true;

    const loadUnread = async () => {
      try {
        const res = await api.get("/chat/unread-count");
        const count = res.data.count || res.data.unread || 0;

        if (mounted) setUnread(count);
      } catch (err) {
        console.log("Unread fetch error:", err);
      }
    };

    loadUnread();

    // 📌 LIVE socket updates
    socket.on("message:new", () => {
      if (pathname !== "/chat") {
        setUnread((v) => v + 1);
      }
    });

    // 📌 When chat UI tells us messages are read
    socket.on("chat:read", () => {
      if (mounted) setUnread(0);
    });

    return () => {
      mounted = false;
      socket.off("message:new");
      socket.off("chat:read");
    };
  }, [pathname]);

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
      {/* HEADER */}
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
              >
                <span style={{ fontSize: "1.3rem" }}>{l.icon}</span>

                {!collapsed && (
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>{l.label}</span>

                    {l.path === "/chat" && unread > 0 && (
                      <span
                        style={{
                          background: "#ef4444",
                          color: "white",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
