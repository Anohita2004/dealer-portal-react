import React, { useContext } from "react";
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
        background: "rgba(15, 23, 42, 0.7)",
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
        <h3 style={{ color: "#60a5fa", fontWeight: "bold" }}>
          {user?.role?.toUpperCase() || "USER"}
        </h3>
      </div>

      {links.map((l) => (
        <Link
          key={l.path}
          to={l.path}
          style={{
            textDecoration: "none",
            color: pathname === l.path ? "#3b82f6" : "#e2e8f0",
            background:
              pathname === l.path
                ? "linear-gradient(90deg, rgba(59,130,246,0.2), rgba(37,99,235,0.1))"
                : "transparent",
            fontWeight: pathname === l.path ? "bold" : "normal",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            margin: "0.25rem 0",
            transition: "all 0.3s ease",
            display: "block",
          }}
          onMouseEnter={(e) => {
            e.target.style.background =
              "linear-gradient(90deg, rgba(59,130,246,0.15), rgba(37,99,235,0.05))";
            e.target.style.color = "#60a5fa";
          }}
          onMouseLeave={(e) => {
            e.target.style.background =
              pathname === l.path
                ? "linear-gradient(90deg, rgba(59,130,246,0.2), rgba(37,99,235,0.1))"
                : "transparent";
            e.target.style.color =
              pathname === l.path ? "#3b82f6" : "#e2e8f0";
          }}
        >
          {l.label}
        </Link>
      ))}
    </aside>
  );
}

