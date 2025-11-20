import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

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

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  if (!user) return <p>Loading...</p>;

  const role = user.role?.toLowerCase();

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
  };

  return roleMap[role] || <p>No dashboard available for role: {role}</p>;
}
