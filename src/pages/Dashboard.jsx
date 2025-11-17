import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

import SuperAdminDashboard from "./dashboards/SuperAdminDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";
import ManagerDashboard from "./dashboards/ManagerDashboard";
import DealerDashboard from "./dashboards/DealerDashboard";
import AccountsDashboard from "./dashboards/AccountsDashboard";
import InventoryDashboard from "./dashboards/InventoryDashboard";

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  if (!user) return <p>Loading...</p>;

  const role = user.role?.toLowerCase();

  const roleMap = {
    super_admin: <SuperAdminDashboard />,
    technical_admin: <AdminDashboard />,
    regional_admin: <AdminDashboard />,
    finance_admin: <AccountsDashboard />,
    regional_manager: <ManagerDashboard />,
    area_manager: <ManagerDashboard />,
    territory_manager: <ManagerDashboard />,
    dealer_admin: <DealerDashboard />,
    dealer_staff: <DealerDashboard />,
    inventory_user: <InventoryDashboard />,
    accounts_user: <AccountsDashboard />,
  };

  return roleMap[role] || <p>No dashboard available for role: {role}</p>;
}
