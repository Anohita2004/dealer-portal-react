import React, { useContext, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { getSocket, connectSocket } from "../services/socket";   // ← FIXED IMPORT

import {
  FaHome,
  FaFileInvoice,
  FaFileAlt,
  FaChartBar,
  FaCogs,
  FaUsers,
  FaWarehouse,
  FaBars,
  FaBell,
  FaUpload,
  FaMoneyCheckAlt,
  FaMapMarkedAlt,
} from "react-icons/fa";

export default function Sidebar() {
  const { user } = useContext(AuthContext);
  const { pathname } = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(0);

  const role = user?.role?.toLowerCase() || "user";

  const orderApprovalRoles = ["super_admin", "regional_admin", "regional_manager", "dealer_admin"];

  const baseLinks = [
    { path: "/dashboard", label: "Dashboard", icon: <FaHome /> },
    { path: "/chat", label: "Chat", icon: <FaUsers /> },
  ];

  const roleLinks = {
    super_admin: [
      { label: "Dashboard", path: "/dashboard/super", icon: <FaHome /> },
      { label: "Users", path: "/superadmin/users", icon: <FaUsers /> },
      { label: "Roles & Permissions", path: "/superadmin/roles", icon: <FaCogs /> },
      { label: "Teams", path: "/superadmin/teams", icon: <FaUsers /> },
      { label: "Team Performance", path: "/superadmin/teams/performance", icon: <FaChartBar /> },
      { label: "Campaigns", path: "/campaigns", icon: <FaChartBar /> },
      { label: "All Orders", path: "/superadmin/orders", icon: <FaFileAlt /> },
      { label: "All Invoices", path: "/superadmin/invoices", icon: <FaFileInvoice /> },
      { label: "All Payments", path: "/superadmin/payments", icon: <FaMoneyCheckAlt /> },
      { label: "All Dealers", path: "/superadmin/dealers", icon: <FaUsers /> },
      { label: "Documents", path: "/superadmin/documents", icon: <FaFileAlt /> },
      { label: "Pricing Approvals", path: "/superadmin/pricing", icon: <FaChartBar /> },
      { label: "Reports", path: "/superadmin/reports", icon: <FaChartBar /> },
      { label: "Region Reports", path: "/superadmin/region-reports", icon: <FaChartBar /> },
      { label: "Inventory", path: "/superadmin/inventory", icon: <FaWarehouse /> },
      { label: "Accounts", path: "/superadmin/accounts", icon: <FaFileInvoice /> },
      { label: "Materials", path: "/materials", icon: <FaWarehouse /> },
      { label: "Material Analytics", path: "/materials/analytics", icon: <FaChartBar /> },
      { label: "Material Import", path: "/materials/import", icon: <FaUpload /> },
      { label: "Material Alerts", path: "/alerts/materials", icon: <FaBell /> },
      { label: "Region Map", path: "/map-view", icon: <FaMapMarkedAlt /> },
      { label: "Feature Toggles", path: "/superadmin/feature-toggles", icon: <FaCogs /> },
      { label: "System Admin", path: "/superadmin/system-admin", icon: <FaCogs /> },
      { label: "User Activity", path: "/superadmin/activity", icon: <FaBell /> },
    ],
    technical_admin: [
      { label: "Permissions", path: "/technical-admin", icon: <FaCogs /> },
      { label: "Material Master", path: "/materials", icon: <FaCogs /> },
      { label: "Material Import", path: "/materials/import", icon: <FaUpload /> },
      { label: "Material Analytics", path: "/materials/analytics", icon: <FaChartBar /> },
      { label: "Region Map", path: "/map-view", icon: <FaMapMarkedAlt /> },
    ],
    regional_admin: [
      { label: "Dealers", path: "/dealers", icon: <FaUsers /> },
      { label: "Regions", path: "/regions", icon: <FaChartBar /> },
      { label: "Region Map", path: "/map-view", icon: <FaMapMarkedAlt /> },
    ],
    regional_manager: [
      { label: "Dealers", path: "/dealers", icon: <FaUsers /> },
      { label: "Approvals", path: "/approvals", icon: <FaChartBar /> },
      { label: "Region Map", path: "/map-view", icon: <FaMapMarkedAlt /> },
    ],
    dealer_admin: [
      { label: "My Documents", path: "/documents", icon: <FaFileAlt /> },
      { label: "Campaigns", path: "/campaigns", icon: <FaChartBar /> },
      { label: "Invoices", path: "/invoices", icon: <FaFileInvoice /> },
      { label: "Payment Approvals", path: "/payments/dealer/pending", icon: <FaMoneyCheckAlt /> },
      { label: "Region Map", path: "/map-view", icon: <FaMapMarkedAlt /> },
    ],
    dealer_staff: [
      { label: "My Documents", path: "/documents", icon: <FaFileAlt /> },
      { label: "Create Order", path: "/orders/create", icon: <FaChartBar /> },
      { label: "My Orders", path: "/orders/my", icon: <FaChartBar /> },
      { label: "Make Payment", path: "/payments/create", icon: <FaMoneyCheckAlt /> },
    ],
    finance_admin: [
      { label: "Payment Approvals", path: "/payments/finance/pending", icon: <FaMoneyCheckAlt /> }
    ],
  };

  const links = [...baseLinks, ...(roleLinks[role] || [])];

  if (orderApprovalRoles.includes(role)) {
    links.push({ label: "Order Approvals", path: "/orders/approvals", icon: <FaChartBar /> });
  }

  // -----  UNREAD CHAT LISTENER FIXED COMPLETELY  -----
  useEffect(() => {
    let mounted = true;
    const s = getSocket() || connectSocket();

    if (!s) return;

    api.get("/chat/unread-count")
      .then(res => mounted && setUnread(res.data.count || 0))
      .catch((err) => {
        // Silently handle 403 Forbidden (user doesn't have permission for chat)
        if (err.response?.status !== 403) {
          console.warn("Failed to fetch chat unread count:", err);
        }
        if (mounted) setUnread(0);
      });

    const msg = () => pathname !== "/chat" && setUnread(prev => prev + 1);
    const read = () => mounted && setUnread(0);

    s.on("message:new", msg);
    s.on("chat:read", read);

    return () => {
      mounted = false;
      s.off("message:new", msg);
      s.off("chat:read", read);
    };
  }, [pathname]);

  return (
    <aside style={{
      width: collapsed ? "70px" : "240px",
      background: "var(--sidebar-bg)",
      borderRight: "1px solid var(--card-border)",
      padding: "1rem",
      display: "flex",
      flexDirection: "column",
      transition: "width .3s",
      overflowY: "auto"
    }}>
      <div style={{display:"flex",justifyContent:collapsed?"center":"space-between",alignItems:"center",marginBottom:"1.5rem"}}>
        {!collapsed && <h3 style={{color:"#f97316",fontWeight:"700"}}>{role.toUpperCase()}</h3>}
        <button onClick={()=>setCollapsed(!collapsed)} style={{padding:"6px",borderRadius:"6px"}}>
          <FaBars />
        </button>
      </div>

      {links.map(l=>(
        <Link key={l.path} to={l.path}
          style={{
            display:"flex",alignItems:"center",gap:"10px",
            padding:"10px",borderRadius:"8px",
            color:pathname===l.path?"#f97316":"var(--text-color)",
            fontWeight:pathname===l.path?600:400
          }}>
          <span>{l.icon}</span>
          {!collapsed && (
            <span style={{display:"flex",alignItems:"center",gap:"6px"}}>
              {l.label}
              {l.path==="/chat" && unread>0 && (
                <span style={{background:"#ef4444",color:"#fff",padding:"1px 7px",borderRadius:"999px",fontSize:"11px"}}>
                  {unread>99?"99+":unread}
                </span>
              )}
            </span>
          )}
        </Link>
      ))}
    </aside>
  );
}
