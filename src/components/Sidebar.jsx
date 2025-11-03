import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const { user } = useContext(AuthContext);
  const { pathname } = useLocation();

  const baseLinks = [{ path: "/dashboard", label: "Dashboard" }];
  const roleLinks = {
    dealer: [{ path: "/invoices", label: "Invoices" }, { path: "/documents", label: "Documents" }],
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
    <aside style={{ width: 200, background: "#f3f3f3", padding: 20, height: "100vh" }}>
      {links.map((l) => (
        <div key={l.path} style={{ margin: "10px 0" }}>
          <Link
            to={l.path}
            style={{
              textDecoration: "none",
              color: pathname === l.path ? "#1976d2" : "#333",
              fontWeight: pathname === l.path ? "bold" : "normal",
            }}
          >
            {l.label}
          </Link>
        </div>
      ))}
    </aside>
  );
}
