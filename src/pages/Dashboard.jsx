import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import DealerDashboard from "./dashboards/DealerDashboard";
import ManagerDashboard from "./dashboards/ManagerDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";
import AccountsDashboard from "./dashboards/AccountsDashboard";
import InventoryDashboard from "./dashboards/InventoryDashboard";

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  if (!user) return <p>Loading user...</p>;

  switch (user.role?.toLowerCase()) {
    case "dealer":
      return <DealerDashboard />;
    case "tm":
    case "am":
      return <ManagerDashboard />;
    case "admin":
      return <AdminDashboard />;
    case "accounts":
      return <AccountsDashboard />;
    case "inventory":
      return <InventoryDashboard />;
    default:
      return <p>No dashboard available for role: {user.role}</p>;
  }
}
