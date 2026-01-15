import React, { useContext, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { getSocket, connectSocket } from "../services/socket";
import { getRoleName, isSalesExecutive } from "../utils/authUtils";
import { motion, AnimatePresence } from "framer-motion";

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
  FaUserPlus,
} from "react-icons/fa";

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
    // ... same roleLinks object ...
    super_admin: [
      { label: "Overview Dashboard", path: "/dashboard/super", icon: <FaHome />, section: "Dashboard" },
      { label: "Users", path: "/superadmin/users", icon: <FaUsers />, section: "Governance" },
      { label: "Roles & Permissions", path: "/superadmin/roles", icon: <FaCogs />, section: "Governance" },
      { label: "Audit Logs", path: "/superadmin/activity", icon: <FaBell />, section: "Governance" },
      { label: "Dealer Management", path: "/dealers", icon: <FaUsers />, section: "Governance" },
      { label: "Create Dealer", path: "/superadmin/dealers/new", icon: <FaUserPlus />, section: "Governance" },
      { label: "Pending Approvals", path: "/approvals", icon: <FaClipboardList />, section: "Governance" },
      { label: "All Orders", path: "/superadmin/orders", icon: <FaFileAlt />, section: "Global Visibility" },
      { label: "All Invoices", path: "/superadmin/invoices", icon: <FaFileInvoice />, section: "Global Visibility" },
      { label: "All Payments", path: "/superadmin/payments", icon: <FaMoneyCheckAlt />, section: "Global Visibility" },
      { label: "All Dealers", path: "/superadmin/dealers", icon: <FaUsers />, section: "Global Visibility" },
      { label: "Documents", path: "/documents", icon: <FaFileAlt />, section: "Global Visibility" },
      { label: "Campaign Management", path: "/campaigns", icon: <FaBullhorn />, section: "Global Visibility" },
      { label: "Global Reports", path: "/superadmin/reports", icon: <FaChartBar />, section: "Analytics & Reports" },
      { label: "Region Performance", path: "/superadmin/region-reports", icon: <FaChartBar />, section: "Analytics & Reports" },
      { label: "Global Maps", path: "/map-view", icon: <FaFire />, section: "Analytics & Reports" },
      { label: "System Admin", path: "/superadmin/system-admin", icon: <FaCogs />, section: "System Configuration" },
      { label: "Feature Toggles", path: "/superadmin/feature-toggles", icon: <FaCogs />, section: "System Configuration" },
      { label: "Geography Management", path: "/superadmin/geography", icon: <FaMapMarkedAlt />, section: "System Configuration" },
      { label: "Inventory Management", path: "/superadmin/inventory-management", icon: <FaWarehouse />, section: "System Configuration" },
      { label: "Dealer Material Assignment", path: "/materials/dealers", icon: <FaBoxes />, section: "System Configuration" },
      { label: "Region Material Availability", path: "/materials/regions", icon: <FaSitemap />, section: "System Configuration" },
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
      { label: "Regional Dashboard", path: "/dashboard/regional", icon: <FaHome />, section: "Dashboard" },
      { label: "Regional Heatmap", path: "/regional/heatmap", icon: <FaFire />, section: "Dashboard" },
      { label: "Users", path: "/regional/users", icon: <FaUsers />, section: "Hierarchy" },
      { label: "Managers", path: "/regional/managers", icon: <FaSitemap />, section: "Hierarchy" },
      { label: "Dealers", path: "/dealers", icon: <FaUsers />, section: "Hierarchy" },
      { label: "Orders", path: "/regional/orders", icon: <FaFileAlt />, section: "Workflows" },
      { label: "Invoices", path: "/regional/invoices", icon: <FaFileInvoice />, section: "Workflows" },
      { label: "Payments", path: "/regional/payments", icon: <FaMoneyCheckAlt />, section: "Workflows" },
      { label: "Documents", path: "/regional/documents", icon: <FaFileAlt />, section: "Workflows" },
      { label: "Pricing Requests", path: "/regional/pricing", icon: <FaFileContract />, section: "Workflows" },
      { label: "Campaign Approvals", path: "/regional/campaign-approvals", icon: <FaClipboardList />, section: "Workflows" },
      { label: "Regional Campaigns", path: "/regional/campaigns", icon: <FaBullhorn />, section: "Campaigns" },
      { label: "Campaign Analytics", path: "/regional/campaigns/analytics", icon: <FaChartBar />, section: "Campaigns" },
      { label: "Regional Reports", path: "/regional/reports", icon: <FaChartBar />, section: "Reports" },
      { label: "Territory Performance", path: "/regional/reports/territory", icon: <FaChartBar />, section: "Reports" },
      { label: "Dealer Performance", path: "/regional/reports/dealer", icon: <FaChartBar />, section: "Reports" },
      { label: "Outstanding Region Payments", path: "/regional/reports/payments", icon: <FaMoneyCheckAlt />, section: "Reports" },
      { label: "Regional Inventory", path: "/regional/inventory", icon: <FaWarehouse />, section: "Inventory" },
      { label: "Stock Alerts", path: "/regional/inventory/alerts", icon: <FaExclamationTriangle />, section: "Inventory" },
      { label: "Material Summary", path: "/regional/inventory/materials", icon: <FaBoxes />, section: "Inventory" },
      { label: "Fleet Management", path: "/fleet", icon: <FaTruck />, section: "Fleet Management" },
      { label: "Driver Management", path: "/fleet/drivers", icon: <FaUsers />, section: "Fleet Management" },
      { label: "Live Tracking", path: "/fleet/tracking", icon: <FaMapMarkedAlt />, section: "Fleet Management" },
    ],
    area_manager: [
      { label: "Area Dashboard", path: "/dashboard/area-manager", icon: <FaHome />, section: "Dashboard" },
      { label: "Area Heatmap", path: "/area/heatmap", icon: <FaFire />, section: "Dashboard" },
      { label: "Dealers", path: "/area/dealers", icon: <FaUsers />, section: "Hierarchy" },
      { label: "Staff", path: "/area/staff", icon: <FaUsers />, section: "Hierarchy" },
      { label: "Pending Approvals", path: "/area/approvals", icon: <FaClipboardList />, section: "Workflows" },
      { label: "Orders", path: "/area/orders", icon: <FaFileAlt />, section: "Workflows" },
      { label: "Documents", path: "/area/documents", icon: <FaFileAlt />, section: "Workflows" },
      { label: "Payments", path: "/area/payments", icon: <FaMoneyCheckAlt />, section: "Workflows" },
      { label: "Pricing Requests", path: "/area/pricing", icon: <FaFileContract />, section: "Workflows" },
      { label: "Area Sales", path: "/area/reports/sales", icon: <FaChartBar />, section: "Reports" },
      { label: "Area Outstanding", path: "/area/reports/outstanding", icon: <FaMoneyCheckAlt />, section: "Reports" },
      { label: "Dealer Performance", path: "/area/reports/dealer-performance", icon: <FaChartBar />, section: "Reports" },
      { label: "Campaigns Assigned to Area", path: "/area/campaigns", icon: <FaBullhorn />, section: "Campaigns" },
      { label: "Area Inventory Overview", path: "/area/inventory", icon: <FaWarehouse />, section: "Inventory" },
      { label: "Fleet Management", path: "/fleet", icon: <FaTruck />, section: "Fleet Management" },
      { label: "Driver Management", path: "/fleet/drivers", icon: <FaUsers />, section: "Fleet Management" },
      { label: "Live Tracking", path: "/fleet/tracking", icon: <FaMapMarkedAlt />, section: "Fleet Management" },
    ],
    regional_manager: [
      { label: "Regional Manager Dashboard", path: "/dashboard/regional-manager", icon: <FaHome />, section: "Dashboard" },
      { label: "Dealers", path: "/dealers", icon: <FaUsers />, section: "Hierarchy" },
      { label: "Approvals", path: "/approvals", icon: <FaClipboardList />, section: "Workflows" },
      { label: "Invoice Approvals", path: "/invoices", icon: <FaFileInvoice />, section: "Workflows" },
      { label: "Region Map", path: "/map-view", icon: <FaMapMarkedAlt />, section: "Reports" },
      { label: "Fleet Management", path: "/fleet", icon: <FaTruck />, section: "Fleet Management" },
      { label: "Driver Management", path: "/fleet/drivers", icon: <FaUsers />, section: "Fleet Management" },
      { label: "Live Tracking", path: "/fleet/tracking", icon: <FaMapMarkedAlt />, section: "Fleet Management" },
    ],
    territory_manager: [
      { label: "Territory Dashboard", path: "/dashboard/territory-manager", icon: <FaHome />, section: "Dashboard" },
      { label: "Dealers in Territory", path: "/territory/dealers", icon: <FaUsers />, section: "Hierarchy" },
      { label: "Approvals", path: "/approvals", icon: <FaClipboardList />, section: "Workflows" },
      { label: "Invoice Approvals", path: "/invoices", icon: <FaFileInvoice />, section: "Workflows" },
      { label: "Orders", path: "/territory/orders", icon: <FaFileAlt />, section: "Workflows" },
      { label: "Payments", path: "/territory/payments", icon: <FaMoneyCheckAlt />, section: "Workflows" },
      { label: "Documents", path: "/territory/documents", icon: <FaFileAlt />, section: "Workflows" },
      { label: "Territory Sales", path: "/territory/reports/sales", icon: <FaChartBar />, section: "Reports" },
      { label: "Dealer Performance", path: "/territory/reports/dealer-performance", icon: <FaChartBar />, section: "Reports" },
      { label: "Outstanding", path: "/territory/reports/outstanding", icon: <FaMoneyCheckAlt />, section: "Reports" },
      { label: "Territory Campaigns", path: "/campaigns", icon: <FaBullhorn />, section: "Campaigns" },
      { label: "Territory Inventory", path: "/territory/inventory", icon: <FaWarehouse />, section: "Inventory" },
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
      { label: "Goods Received", path: "/inventory/goods-received", icon: <FaBoxes /> },
      { label: "Live Tracking", path: "/fleet/tracking", icon: <FaMapMarkedAlt /> },
      { label: "Region Map", path: "/map-view", icon: <FaMapMarkedAlt /> },
    ],
    dealer_staff: [
      { label: "My Dashboard", path: "/dashboard", icon: <FaHome />, section: "Dashboard" },
      { label: "My Company", path: "/dealer/profile", icon: <FaBuilding />, section: "Dashboard" },
      { label: "My Orders", path: "/orders/my", icon: <FaFileAlt />, section: "Orders" },
      { label: "Create Order", path: "/orders/create", icon: <FaFileAlt />, section: "Orders" },
      { label: "Goods Received", path: "/inventory/goods-received", icon: <FaBoxes />, section: "Orders" },
      { label: "Live Tracking", path: "/fleet/tracking", icon: <FaMapMarkedAlt />, section: "Orders" },
      { label: "My Payment Requests", path: "/payments/my", icon: <FaMoneyCheckAlt />, section: "Payments" },
      { label: "Create Payment Request", path: "/payments/create", icon: <FaMoneyCheckAlt />, section: "Payments" },
      { label: "My Invoices", path: "/invoices", icon: <FaFileInvoice />, section: "Invoices" },
      { label: "My Documents", path: "/documents", icon: <FaFileAlt />, section: "Documents" },
      { label: "Upload Document", path: "/documents", icon: <FaUpload />, section: "Documents" },
      { label: "Campaigns Assigned to My Dealer", path: "/campaigns", icon: <FaBullhorn />, section: "Campaigns" },
    ],
    finance_admin: [
      { label: "Accounts Dashboard", path: "/dashboard/accounts", icon: <FaHome />, section: "Dashboard" },
      { label: "Payment Approvals", path: "/payments/finance/pending", icon: <FaMoneyCheckAlt />, section: "Financial Operations" },
      { label: "All Invoices", path: "/invoices", icon: <FaFileInvoice />, section: "Financial Operations" },
      { label: "Reconciliation", path: "/accounts/invoices", icon: <FaClipboardList />, section: "Financial Operations" },
      { label: "Financial Reports", path: "/accounts/reports", icon: <FaChartBar />, section: "Reports" },
    ],
    accounts_user: [
      { label: "Accounts Dashboard", path: "/accounts", icon: <FaHome />, section: "Dashboard" },
      { label: "Payment Approvals", path: "/payments/finance/pending", icon: <FaMoneyCheckAlt />, section: "Financial Operations" },
      { label: "All Payments", path: "/payments/my", icon: <FaMoneyCheckAlt />, section: "Financial Operations" },
      { label: "Invoices", path: "/accounts/invoices", icon: <FaFileInvoice />, section: "Financial Operations" },
      { label: "Financial Reports", path: "/accounts/reports", icon: <FaChartBar />, section: "Reports" },
    ],
    inventory_user: [
      { label: "Inventory Dashboard", path: "/inventory", icon: <FaHome />, section: "Dashboard" },
      { label: "Inventory Details", path: "/inventory/details", icon: <FaWarehouse />, section: "Inventory Management" },
      { label: "Stock Alerts", path: "/inventory/alerts", icon: <FaExclamationTriangle />, section: "Inventory Management" },
      { label: "Materials Management", path: "/materials", icon: <FaBoxes />, section: "Inventory Management" },
      { label: "Warehouse Inventory", path: "/inventory/plants", icon: <FaWarehouse />, section: "Inventory Management" },
      { label: "Inventory Reports", path: "/inventory/reports", icon: <FaChartBar />, section: "Reports & Analytics" },
    ],
    sales_executive: [
      { label: "Sales Dashboard", path: "/dashboard", icon: <FaHome />, section: "Dashboard" },
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

  useEffect(() => {
    let mounted = true;
    const s = getSocket() || connectSocket();

    if (!s) return;

    api.get("/chat/unread-count")
      .then(res => mounted && setUnread(res.data.count || 0))
      .catch((err) => {
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

  const containerVariants = {
    expanded: { width: "240px" },
    collapsed: { width: "70px" }
  };

  return (
    <motion.aside
      initial={false}
      animate={collapsed ? "collapsed" : "expanded"}
      variants={containerVariants}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        padding: "var(--spacing-4)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        overflowX: "hidden",
        height: "100vh",
        position: 'sticky',
        top: 0
      }}
    >
      <div style={{
        display: "flex",
        justifyContent: collapsed ? "center" : "space-between",
        alignItems: "center",
        marginBottom: "var(--spacing-6)",
        minHeight: "40px"
      }}>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.h3
              key="sidebar-title"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              style={{
                color: "var(--color-primary)",
                fontWeight: "var(--font-weight-bold)",
                fontSize: "var(--font-size-lg)",
                margin: 0,
                whiteSpace: 'nowrap'
              }}
            >
              Portal
            </motion.h3>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            padding: "var(--spacing-2)",
            borderRadius: "var(--radius-md)",
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

      <div style={{ flex: 1 }}>
        {links.map((l, idx) => {
          const showSection = !collapsed && l.section && (idx === 0 || links[idx - 1]?.section !== l.section);
          const active = isActive(l.path);
          return (
            <React.Fragment key={`${idx}-${l.path}-${l.label}`}>
              {showSection && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    marginTop: idx > 0 ? "var(--spacing-6)" : "0",
                    marginBottom: "var(--spacing-2)",
                    paddingLeft: "var(--spacing-4)",
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    color: "var(--color-text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    opacity: 0.7
                  }}
                >
                  {l.section}
                </motion.div>
              )}
              <Link
                to={l.path}
                title={collapsed ? l.label : ""}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "flex-start",
                  gap: collapsed ? "0" : "var(--spacing-3)",
                  padding: "var(--spacing-3) var(--spacing-4)",
                  borderRadius: "var(--radius-lg)",
                  color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
                  fontWeight: active ? 700 : 500,
                  textDecoration: "none",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  background: active ? "var(--color-primary-soft)" : "transparent",
                  marginBottom: "4px",
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "var(--color-primary-soft)";
                    e.currentTarget.style.color = "var(--color-primary)";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                    e.currentTarget.style.transform = "translateX(0)";
                  }
                }}
              >
                {active && (
                  <motion.div
                    layoutId="active-indicator"
                    style={{
                      position: 'absolute',
                      left: 0,
                      width: '3px',
                      height: '24px',
                      background: 'var(--color-primary)',
                      borderRadius: '0 4px 4px 0'
                    }}
                  />
                )}
                <span style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: active ? "1.2rem" : "1.1rem",
                  transition: 'font-size 0.2s'
                }}>
                  {l.icon}
                </span>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      style={{
                        fontSize: "var(--font-size-sm)",
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {l.label}
                      {l.path === "/chat" && unread > 0 && (
                        <span style={{
                          background: "var(--color-error)",
                          color: "var(--color-surface)",
                          padding: "2px 8px",
                          marginLeft: "8px",
                          borderRadius: "999px",
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
                        }}>
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </React.Fragment>
          );
        })}
      </div>
    </motion.aside>
  );
}

