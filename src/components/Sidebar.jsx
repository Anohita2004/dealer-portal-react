import React from "react";
import { Link, useLocation } from "react-router-dom";

const links = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/invoices", label: "Invoices" },
  { path: "/documents", label: "Documents" },
  { path: "/campaigns", label: "Campaigns" },
  { path: "/reports", label: "Reports" },
  { path: "/admin", label: "Admin" },
];

function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside
      style={{
        width: 200,
        background: "#f3f3f3",
        padding: 20,
        height: "100vh",
      }}
    >
      {links.map((link) => (
        <div key={link.path} style={{ margin: "10px 0" }}>
          <Link
            to={link.path}
            style={{
              textDecoration: "none",
              color: pathname === link.path ? "#1976d2" : "#333",
              fontWeight: pathname === link.path ? "bold" : "normal",
            }}
          >
            {link.label}
          </Link>
        </div>
      ))}
    </aside>
  );
}

export default Sidebar; // ✅ This line fixes the error
