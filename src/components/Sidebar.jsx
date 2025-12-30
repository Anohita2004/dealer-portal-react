import React, { useContext, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { getSocket, connectSocket } from "../services/socket";   // ← FIXED IMPORT
import { getRoleName, isSalesExecutive } from "../utils/authUtils";

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
  FaFire,
  FaSitemap,
  FaClipboardList,
  FaBullhorn,
  FaFileContract,
  FaExclamationTriangle,
  FaBoxes,
  FaBuilding,
  FaTruck,
} from "react-icons/fa";

// Helper function to format username for display
function formatUsername(username) {
  if (!username) return "User";

  // Replace underscores and hyphens with spaces
  let formatted = username.replace(/[_-]/g, " ");

  // Capitalize first letter of each word
  formatted = formatted
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return formatted;
}

export default function Sidebar() {
  const { user } = useContext(AuthContext);
  const { pathname } = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(0);

  const role = getRoleName(user) || "user";
  const salesExec = isSalesExecutive(user);

  const orderApprovalRoles = ["super_admin", "regional_admin", "regional_manager", "dealer_admin"];

  const baseLinks = [
    { path: "/dashboard", label: "Dashboard", icon: <FaHome /> },
    { path: "/chat", label: "Chat", icon: <FaUsers /> },
  ];

  const roleLinks = {
    super_admin: [
      // Dashboard Section
      { label: "Overview Dashboard", path: "/dashboard/super", icon: <FaHome />, section: "Dashboard" },

      // Governance Section
      { label: "Users", path: "/superadmin/users", icon: <FaUsers />, section: "Governance" },
      { label: "Roles & Permissions", path: "/superadmin/roles", icon: <FaCogs />, section: "Governance" },
      { label: "Audit Logs", path: "/superadmin/activity", icon: <FaBell />, section: "Governance" },
      { label: "Dealer Management", path: "/dealers", icon: <FaUsers />, section: "Governance" },
      { label: "Pending Approvals", path: "/approvals", icon: <FaClipboardList />, section: "Governance" },

      // Global Visibility Section
      { label: "All Orders", path: "/superadmin/orders", icon: <FaFileAlt />, section: "Global Visibility" },
      { label: "All Invoices", path: "/superadmin/invoices", icon: <FaFileInvoice />, section: "Global Visibility" },
      { label: "All Payments", path: "/superadmin/payments", icon: <FaMoneyCheckAlt />, section: "Global Visibility" },
      { label: "All Dealers", path: "/superadmin/dealers", icon: <FaUsers />, section: "Global Visibility" },
      { label: "Documents", path: "/documents", icon: <FaFileAlt />, section: "Global Visibility" },
      { label: "Campaign Management", path: "/campaigns", icon: <FaBullhorn />, section: "Global Visibility" },

      // Analytics & Reports Section
      { label: "Global Reports", path: "/superadmin/reports", icon: <FaChartBar />, section: "Analytics & Reports" },
      { label: "Region Performance", path: "/superadmin/region-reports", icon: <FaChartBar />, section: "Analytics & Reports" },
      { label: "Global Maps", path: "/map-view", icon: <FaFire />, section: "Analytics & Reports" },

      // System Configuration Section
      { label: "System Admin", path: "/superadmin/system-admin", icon: <FaCogs />, section: "System Configuration" },
      { label: "Feature Toggles", path: "/superadmin/feature-toggles", icon: <FaCogs />, section: "System Configuration" },
      { label: "Geography Management", path: "/superadmin/geography", icon: <FaMapMarkedAlt />, section: "System Configuration" },
      { label: "Inventory Management", path: "/superadmin/inventory-management", icon: <FaWarehouse />, section: "System Configuration" },
      { label: "Dealer Material Assignment", path: "/materials/dealers", icon: <FaBoxes />, section: "System Configuration" },
      { label: "Region Material Availability", path: "/materials/regions", icon: <FaSitemap />, section: "System Configuration" },

      // Fleet Management Section
      { label: "Fleet Management", path: "/fleet", icon: <FaTruck />, section: "Fleet Management" },
      { label: "Driver Management", path: "/fleet/drivers", icon: <FaUsers />, section: "Fleet Management" },
      { label: "Live Tracking", path: "/fleet/tracking", icon: <FaMapMarkedAlt />, section: "Fleet Management" },
    ],
    technical_admin: [
      { label: "Permissions", path: "/technical-admin", icon: <FaCogs /> },
      { label: "Material Master", path: "/materials", icon: <FaCogs /> },
      { label: "Material Import", path: "/materials/import", icon: <FaUpload /> },
      { label: "Material Analytics", path: "/materials/analytics", icon: <FaChartBar /> },
      { label: "Dealer Material Assignment", path: "/materials/dealers", icon: <FaBoxes /> },
      { label: "Region Material Availability", path: "/materials/regions", icon: <FaSitemap /> },
      { label: "Region Map", path: "/map-view", icon: <FaMapMarkedAlt /> },
    ],
    regional_admin: [
      // Dashboard Section
      { label: "Regional Dashboard", path: "/dashboard/regional", icon: <FaHome />, section: "Dashboard" },
      { label: "Regional Heatmap", path: "/regional/heatmap", icon: <FaFire />, section: "Dashboard" },

      // Hierarchy Section
      { label: "Users", path: "/regional/users", icon: <FaUsers />, section: "Hierarchy" },
      { label: "Managers", path: "/regional/managers", icon: <FaSitemap />, section: "Hierarchy" },
      { label: "Dealers", path: "/dealers", icon: <FaUsers />, section: "Hierarchy" },

      // Workflows Section
      { label: "Orders", path: "/regional/orders", icon: <FaFileAlt />, section: "Workflows" },
      { label: "Invoices", path: "/regional/invoices", icon: <FaFileInvoice />, section: "Workflows" },
      { label: "Payments", path: "/regional/payments", icon: <FaMoneyCheckAlt />, section: "Workflows" },
      { label: "Documents", path: "/regional/documents", icon: <FaFileAlt />, section: "Workflows" },
      { label: "Pricing Requests", path: "/regional/pricing", icon: <FaFileContract />, section: "Workflows" },
      { label: "Campaign Approvals", path: "/regional/campaign-approvals", icon: <FaClipboardList />, section: "Workflows" },

      // Campaigns Section
      { label: "Regional Campaigns", path: "/regional/campaigns", icon: <FaBullhorn />, section: "Campaigns" },
      { label: "Campaign Analytics", path: "/regional/campaigns/analytics", icon: <FaChartBar />, section: "Campaigns" },

      // Reports Section
      { label: "Regional Reports", path: "/regional/reports", icon: <FaChartBar />, section: "Reports" },
      { label: "Territory Performance", path: "/regional/reports/territory", icon: <FaChartBar />, section: "Reports" },
      { label: "Dealer Performance", path: "/regional/reports/dealer", icon: <FaChartBar />, section: "Reports" },
      { label: "Outstanding Region Payments", path: "/regional/reports/payments", icon: <FaMoneyCheckAlt />, section: "Reports" },

      // Inventory Section
      { label: "Regional Inventory", path: "/regional/inventory", icon: <FaWarehouse />, section: "Inventory" },
      { label: "Stock Alerts", path: "/regional/inventory/alerts", icon: <FaExclamationTriangle />, section: "Inventory" },
      { label: "Material Summary", path: "/regional/inventory/materials", icon: <FaBoxes />, section: "Inventory" },

      // Fleet Management Section
      { label: "Fleet Management", path: "/fleet", icon: <FaTruck />, section: "Fleet Management" },
      { label: "Driver Management", path: "/fleet/drivers", icon: <FaUsers />, section: "Fleet Management" },
      { label: "Live Tracking", path: "/fleet/tracking", icon: <FaMapMarkedAlt />, section: "Fleet Management" },
    ],
    area_manager: [
      // Dashboard Section
      { label: "Area Dashboard", path: "/dashboard/area-manager", icon: <FaHome />, section: "Dashboard" },
      { label: "Area Heatmap", path: "/area/heatmap", icon: <FaFire />, section: "Dashboard" },

      // Hierarchy Section
      { label: "Dealers", path: "/area/dealers", icon: <FaUsers />, section: "Hierarchy" },
      { label: "Staff", path: "/area/staff", icon: <FaUsers />, section: "Hierarchy" },

      // Workflows Section
      { label: "Pending Approvals", path: "/area/approvals", icon: <FaClipboardList />, section: "Workflows" },
      { label: "Orders", path: "/area/orders", icon: <FaFileAlt />, section: "Workflows" },
      { label: "Documents", path: "/area/documents", icon: <FaFileAlt />, section: "Workflows" },
      { label: "Payments", path: "/area/payments", icon: <FaMoneyCheckAlt />, section: "Workflows" },
      { label: "Pricing Requests", path: "/area/pricing", icon: <FaFileContract />, section: "Workflows" },

      // Reports Section
      { label: "Area Sales", path: "/area/reports/sales", icon: <FaChartBar />, section: "Reports" },
      { label: "Area Outstanding", path: "/area/reports/outstanding", icon: <FaMoneyCheckAlt />, section: "Reports" },
      { label: "Dealer Performance", path: "/area/reports/dealer-performance", icon: <FaChartBar />, section: "Reports" },

      // Campaigns Section
      { label: "Campaigns Assigned to Area", path: "/area/campaigns", icon: <FaBullhorn />, section: "Campaigns" },

      // Inventory Section
      { label: "Area Inventory Overview", path: "/area/inventory", icon: <FaWarehouse />, section: "Inventory" },

      // Fleet Management Section
      { label: "Fleet Management", path: "/fleet", icon: <FaTruck />, section: "Fleet Management" },
      { label: "Driver Management", path: "/fleet/drivers", icon: <FaUsers />, section: "Fleet Management" },
      { label: "Live Tracking", path: "/fleet/tracking", icon: <FaMapMarkedAlt />, section: "Fleet Management" },
    ],
    regional_manager: [
      // Dashboard Section
      { label: "Regional Manager Dashboard", path: "/dashboard/regional-manager", icon: <FaHome />, section: "Dashboard" },

      // Hierarchy Section
      { label: "Dealers", path: "/dealers", icon: <FaUsers />, section: "Hierarchy" },

      // Workflows Section
      { label: "Approvals", path: "/approvals", icon: <FaClipboardList />, section: "Workflows" },
      { label: "Invoice Approvals", path: "/invoices", icon: <FaFileInvoice />, section: "Workflows" },

      // Reports Section
      { label: "Region Map", path: "/map-view", icon: <FaMapMarkedAlt />, section: "Reports" },

      // Fleet Management Section
      { label: "Fleet Management", path: "/fleet", icon: <FaTruck />, section: "Fleet Management" },
      { label: "Driver Management", path: "/fleet/drivers", icon: <FaUsers />, section: "Fleet Management" },
      { label: "Live Tracking", path: "/fleet/tracking", icon: <FaMapMarkedAlt />, section: "Fleet Management" },
    ],
    territory_manager: [
      // Dashboard Section
      { label: "Territory Dashboard", path: "/dashboard/territory-manager", icon: <FaHome />, section: "Dashboard" },

      // Hierarchy Section
      { label: "Dealers in Territory", path: "/territory/dealers", icon: <FaUsers />, section: "Hierarchy" },

      // Workflows Section
      { label: "Approvals", path: "/approvals", icon: <FaClipboardList />, section: "Workflows" },
      { label: "Invoice Approvals", path: "/invoices", icon: <FaFileInvoice />, section: "Workflows" },
      { label: "Orders", path: "/territory/orders", icon: <FaFileAlt />, section: "Workflows" },
      { label: "Payments", path: "/territory/payments", icon: <FaMoneyCheckAlt />, section: "Workflows" },
      { label: "Documents", path: "/territory/documents", icon: <FaFileAlt />, section: "Workflows" },

      // Reports Section
      { label: "Territory Sales", path: "/territory/reports/sales", icon: <FaChartBar />, section: "Reports" },
      { label: "Dealer Performance", path: "/territory/reports/dealer-performance", icon: <FaChartBar />, section: "Reports" },
      { label: "Outstanding", path: "/territory/reports/outstanding", icon: <FaMoneyCheckAlt />, section: "Reports" },

      // Campaigns Section
      { label: "Territory Campaigns", path: "/campaigns", icon: <FaBullhorn />, section: "Campaigns" },

      // Inventory Section
      { label: "Territory Inventory", path: "/territory/inventory", icon: <FaWarehouse />, section: "Inventory" },

      // Fleet Management Section
      { label: "Fleet Management", path: "/fleet", icon: <FaTruck />, section: "Fleet Management" },
      { label: "Driver Management", path: "/fleet/drivers", icon: <FaUsers />, section: "Fleet Management" },
      { label: "Live Tracking", path: "/fleet/tracking", icon: <FaMapMarkedAlt />, section: "Fleet Management" },
    ],
    dealer_admin: [
      { label: "My Company", path: "/dealer/profile", icon: <FaBuilding /> },
      { label: "My Documents", path: "/documents", icon: <FaFileAlt /> },
      { label: "Campaigns", path: "/campaigns", icon: <FaChartBar /> },
      { label: "Invoices", path: "/invoices", icon: <FaFileInvoice /> },
      { label: "Pending Approvals", path: "/approvals", icon: <FaClipboardList /> },
      { label: "Payment Approvals", path: "/payments/dealer/pending", icon: <FaMoneyCheckAlt /> },
      { label: "Live Tracking", path: "/fleet/tracking", icon: <FaMapMarkedAlt /> },
      { label: "Region Map", path: "/map-view", icon: <FaMapMarkedAlt /> },
    ],
    dealer_staff: [
      // Dashboard Section
      { label: "My Dashboard", path: "/dashboard", icon: <FaHome />, section: "Dashboard" },
      { label: "My Company", path: "/dealer/profile", icon: <FaBuilding />, section: "Dashboard" },

      // Orders Section
      { label: "My Orders", path: "/orders/my", icon: <FaFileAlt />, section: "Orders" },
      { label: "Create Order", path: "/orders/create", icon: <FaFileAlt />, section: "Orders" },
      { label: "Live Tracking", path: "/fleet/tracking", icon: <FaMapMarkedAlt />, section: "Orders" },

      // Payments Section
      { label: "My Payment Requests", path: "/payments/my", icon: <FaMoneyCheckAlt />, section: "Payments" },
      { label: "Create Payment Request", path: "/payments/create", icon: <FaMoneyCheckAlt />, section: "Payments" },

      // Invoices Section
      { label: "My Invoices", path: "/invoices", icon: <FaFileInvoice />, section: "Invoices" },

      // Documents Section
      { label: "My Documents", path: "/documents", icon: <FaFileAlt />, section: "Documents" },
      { label: "Upload Document", path: "/documents", icon: <FaUpload />, section: "Documents" },

      // Campaigns Section
      { label: "Campaigns Assigned to My Dealer", path: "/campaigns", icon: <FaBullhorn />, section: "Campaigns" },
    ],
    finance_admin: [
      // Dashboard Section
      { label: "Accounts Dashboard", path: "/dashboard/accounts", icon: <FaHome />, section: "Dashboard" },

      // Financial Operations Section
      { label: "Payment Approvals", path: "/payments/finance/pending", icon: <FaMoneyCheckAlt />, section: "Financial Operations" },
      { label: "All Invoices", path: "/invoices", icon: <FaFileInvoice />, section: "Financial Operations" },
      { label: "Reconciliation", path: "/accounts/invoices", icon: <FaClipboardList />, section: "Financial Operations" },

      // Reports Section
      { label: "Financial Reports", path: "/accounts/reports", icon: <FaChartBar />, section: "Reports" },
    ],
    accounts_user: [
      // Dashboard Section
      { label: "Accounts Dashboard", path: "/accounts", icon: <FaHome />, section: "Dashboard" },

      // Financial Operations Section
      { label: "Payment Approvals", path: "/payments/finance/pending", icon: <FaMoneyCheckAlt />, section: "Financial Operations" },
      { label: "All Payments", path: "/payments/my", icon: <FaMoneyCheckAlt />, section: "Financial Operations" },
      { label: "Invoices", path: "/accounts/invoices", icon: <FaFileInvoice />, section: "Financial Operations" },

      // Reports Section
      { label: "Financial Reports", path: "/accounts/reports", icon: <FaChartBar />, section: "Reports" },
    ],

    // ================= SALES EXECUTIVE =================
    sales_executive: [
      // Dashboard Section
      { label: "Sales Dashboard", path: "/dashboard", icon: <FaHome />, section: "Dashboard" },

      // Dealers & Sales Workflows
      { label: "My Dealers", path: "/sales/my-dealers", icon: <FaUsers />, section: "Sales" },
      { label: "Create Order", path: "/sales/orders/new", icon: <FaFileAlt />, section: "Sales" },
      { label: "Pending Approvals", path: "/approvals", icon: <FaClipboardList />, section: "Sales" },
      { label: "Create Payment Request", path: "/sales/payments/new", icon: <FaMoneyCheckAlt />, section: "Sales" },
    ],
  };

  const links = [...baseLinks, ...(roleLinks[role] || [])];

  if (orderApprovalRoles.includes(role) && !salesExec) {
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

  const isActive = (path) => pathname === path;

  return (
    <aside style={{
      width: collapsed ? "70px" : "240px",
      background: "var(--color-surface)",
      borderRight: "1px solid var(--color-border)",
      padding: "var(--spacing-4)",
      display: "flex",
      flexDirection: "column",
      transition: "width var(--transition-slow)",
      overflowY: "auto"
    }}>
      <div style={{
        display: "flex",
        justifyContent: collapsed ? "center" : "space-between",
        alignItems: "center",
        marginBottom: "var(--spacing-6)"
      }}>
        {!collapsed && <h3 style={{
          color: "var(--color-primary)",
          fontWeight: "var(--font-weight-bold)",
          fontSize: "var(--font-size-lg)",
          margin: 0
        }}>
          {user?.name || (user?.username ? formatUsername(user.username) : "User")}
        </h3>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            padding: "var(--spacing-2)",
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: "transparent",
            color: "var(--color-text-secondary)",
            cursor: "pointer",
            transition: "all var(--transition-base)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-primary-soft)";
            e.currentTarget.style.color = "var(--color-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--color-text-secondary)";
          }}
        >
          <FaBars />
        </button>
      </div>

      {links.map((l, idx) => {
        const showSection = !collapsed && l.section && (idx === 0 || links[idx - 1]?.section !== l.section);
        const active = isActive(l.path);
        return (
          <React.Fragment key={`${idx}-${l.path}-${l.label}`}>
            {showSection && (
              <div style={{
                marginTop: idx > 0 ? "var(--spacing-4)" : "0",
                marginBottom: "var(--spacing-2)",
                padding: "var(--spacing-2)",
                fontSize: "var(--font-size-xs)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--color-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                {l.section}
              </div>
            )}
            <Link
              to={l.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-2)",
                padding: "var(--spacing-3) var(--spacing-4)",
                borderRadius: "var(--radius-md)",
                color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
                fontWeight: active ? "var(--font-weight-semibold)" : "var(--font-weight-normal)",
                marginLeft: l.section && !collapsed ? "var(--spacing-2)" : "0",
                textDecoration: "none",
                transition: "all var(--transition-base)",
                background: active ? "var(--color-primary-soft)" : "transparent"
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "var(--color-primary-soft)";
                  e.currentTarget.style.color = "var(--color-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                }
              }}
            >
              <span style={{ display: "flex", alignItems: "center" }}>{l.icon}</span>
              {!collapsed && (
                <span style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--spacing-2)",
                  fontSize: "var(--font-size-sm)"
                }}>
                  {l.label}
                  {l.path === "/chat" && unread > 0 && (
                    <span style={{
                      background: "var(--color-error)",
                      color: "var(--color-surface)",
                      padding: "2px 7px",
                      borderRadius: "999px",
                      fontSize: "var(--font-size-xs)",
                      fontWeight: "var(--font-weight-semibold)"
                    }}>
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </span>
              )}
            </Link>
          </React.Fragment>
        );
      })}
    </aside>
  );
}
