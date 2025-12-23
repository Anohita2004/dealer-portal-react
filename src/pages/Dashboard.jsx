import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getLandingPageForRole } from "../utils/roleNavigation";

import SuperAdminDashboard from "./dashboards/SuperAdminDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";
import ManagerDashboard from "./dashboards/ManagerDashboard";
import DealerDashboard from "./dashboards/DealerDashboard";
import AccountsDashboard from "./dashboards/AccountsDashboard";
import InventoryDashboard from "./dashboards/InventoryDashboard";
import TechnicalAdminDashboard from "./dashboards/TechnicalAdminDashboard";
import RegionalAdminDashboard from "./dashboards/RegionalAdminDashboard";
import FinanceAdminDashboard from "./dashboards/FinanceAdminDashboard";
import RegionalManagerDashboard from "./dashboards/RegionalManagerDashboard";
import AreaManagerDashboard from "./dashboards/AreaManagerDashboard";
import TerritoryManagerDashboard from "./dashboards/TerritoryManagerDashboard";
import DealerStaffDashboard from "./dashboards/DealerStaffDashboard";
import SalesExecutiveDashboard from "./dashboards/SalesExecutiveDashboard";

/**
 * Dashboard - Role-based dashboard router
 * Automatically shows the appropriate dashboard based on user role
 */
export default function Dashboard() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if no user
    return <Navigate to="/login" replace />;
  }

  const role = (user.roleDetails?.name || user.role || "").toLowerCase();

  const roleMap = {
    super_admin: <SuperAdminDashboard />,
    technical_admin: <TechnicalAdminDashboard />,
    regional_admin: <RegionalAdminDashboard />,
    finance_admin: <FinanceAdminDashboard />,
    regional_manager: <RegionalManagerDashboard />,
    area_manager: <AreaManagerDashboard />,
    territory_manager: <TerritoryManagerDashboard />,
    dealer_admin: <DealerDashboard />,
    dealer_staff: <DealerStaffDashboard />,
    inventory_user: <InventoryDashboard />,
    accounts_user: <AccountsDashboard />,
    sales_executive: <SalesExecutiveDashboard />,
  };

  // If role has a specific dashboard route, redirect there
  const landingPage = getLandingPageForRole(role);
  if (landingPage !== "/dashboard" && !roleMap[role]) {
    return <Navigate to={landingPage} replace />;
  }

  return roleMap[role] || (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <p>No dashboard available for role: {role}</p>
      <p style={{ color: "#666", marginTop: "1rem" }}>
        <a href={landingPage}>Go to your dashboard</a>
      </p>
    </div>
  );
}
