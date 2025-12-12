import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { dashboardAPI, dealerAPI, reportAPI, campaignAPI, taskAPI } from "../../services/api";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import TaskList from "../../components/TaskList";
import DataTable from "../../components/DataTable";
import "./DashboardLayout.css";

export default function RegionalAdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    dealers: 0,
    activeCampaigns: 0,
    pendingApprovals: 0,
    totalInvoices: 0,
    totalOutstanding: 0,
    totalSales: 0,
    managers: 0,
    territories: 0,
    overdueTasks: 0,
    overduePayments: 0,
  });
  const [topDealers, setTopDealers] = useState([]);
  const [territoryPerformance, setTerritoryPerformance] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await dashboardAPI.getRegionalDashboard();
        setSummary({
          dealers: data.totalDealers || 0,
          activeCampaigns: data.activeCampaigns || 0,
          pendingApprovals: data.pendingApprovals || 0,
          totalInvoices: data.totalInvoices || 0,
          totalOutstanding: data.totalOutstanding || 0,
          totalSales: data.totalSales || data.regionSales || 0,
          managers: data.totalManagers || data.managers || 0,
          territories: data.totalTerritories || data.territories || 0,
          overdueTasks: data.overdueTasks || 0,
          overduePayments: data.overduePayments || 0,
        });
      } catch (e) {
        console.error("Failed to load regional dashboard:", e);
        // Set default values on error
        setSummary({
          dealers: 0,
          activeCampaigns: 0,
          pendingApprovals: 0,
          totalInvoices: 0,
          totalOutstanding: 0,
          totalSales: 0,
          managers: 0,
          territories: 0,
          overdueTasks: 0,
          overduePayments: 0,
        });
      }

      // Load top performing dealers (non-blocking)
      try {
        const dealersData = await dealerAPI.getDealers({ limit: 5 });
        setTopDealers(dealersData.data || dealersData || []);
      } catch (e) {
        console.warn("Failed to load top dealers:", e);
        setTopDealers([]);
      }

      // Load territory performance (non-blocking)
      try {
        const territoryData = await reportAPI.getTerritoryReport({ limit: 5 });
        setTerritoryPerformance(territoryData.data || territoryData || []);
      } catch (e) {
        console.warn("Failed to load territory performance:", e);
        setTerritoryPerformance([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "1rem", textAlign: "center" }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const dealerColumns = [
    { key: "businessName", label: "Dealer Name" },
    { key: "city", label: "City" },
    {
      key: "performance",
      label: "Performance",
      render: (val) => val ? `${val}%` : "N/A",
    },
  ];

  const territoryColumns = [
    { key: "territoryName", label: "Territory" },
    { key: "totalSales", label: "Sales", render: (val) => `₹${Number(val || 0).toLocaleString()}` },
    { key: "dealerCount", label: "Dealers" },
  ];

  return (
    <div style={{ padding: "1rem" }}>
      <PageHeader
        title="Regional Admin Dashboard"
        subtitle="Overview of your region's performance and activities"
      />

      <div className="stat-grid">
        <StatCard title="Total Dealers" value={summary.dealers || 0} />
        <StatCard title="Region Sales" value={`₹${Number(summary.totalSales || 0).toLocaleString()}`} />
        <StatCard title="Total Outstanding" value={`₹${Number(summary.totalOutstanding || 0).toLocaleString()}`} />
        <StatCard title="Total Invoices" value={summary.totalInvoices || 0} />
        <StatCard title="Managers" value={summary.managers || 0} />
        <StatCard title="Territories" value={summary.territories || 0} />
        <StatCard title="Active Campaigns" value={summary.activeCampaigns || 0} />
        <StatCard title="Pending Approvals" value={summary.pendingApprovals || 0} />
        <StatCard title="Overdue Tasks" value={summary.overdueTasks || 0} />
        <StatCard title="Overdue Payments" value={summary.overduePayments || 0} />
      </div>

      <div className="dashboard-grid" style={{ marginTop: "1.5rem" }}>
        <div className="column">
          <Card title="Top Performing Dealers">
            {topDealers.length > 0 ? (
              <DataTable
                columns={dealerColumns}
                rows={topDealers.slice(0, 5)}
                emptyMessage="No dealer data available"
              />
            ) : (
              <p className="text-muted">No dealer performance data available</p>
            )}
            <div style={{ marginTop: "1rem" }}>
              <button
                onClick={() => navigate("/regional/reports")}
                style={{
                  padding: "0.5rem 1rem",
                  background: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  borderRadius: "0.5rem",
                  color: "#60a5fa",
                  cursor: "pointer",
                }}
              >
                View All Dealers →
              </button>
            </div>
          </Card>
        </div>

        <div className="column">
          <Card title="Territory Performance">
            {territoryPerformance.length > 0 ? (
              <DataTable
                columns={territoryColumns}
                rows={territoryPerformance.slice(0, 5)}
                emptyMessage="No territory data available"
              />
            ) : (
              <p className="text-muted">No territory performance data available</p>
            )}
            <div style={{ marginTop: "1rem" }}>
              <button
                onClick={() => navigate("/regional/reports")}
                style={{
                  padding: "0.5rem 1rem",
                  background: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  borderRadius: "0.5rem",
                  color: "#60a5fa",
                  cursor: "pointer",
                }}
              >
                View Territory Reports →
              </button>
            </div>
          </Card>
        </div>

        <div className="column">
          <Card title="Pending Tasks">
            <TaskList compact={true} />
          </Card>
        </div>

        <div className="column">
          <Card title="Quick Actions">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                onClick={() => navigate("/regional/users")}
                style={{
                  padding: "0.75rem",
                  background: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  borderRadius: "0.5rem",
                  color: "#60a5fa",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                Manage Users
              </button>
              <button
                onClick={() => navigate("/regional/approvals")}
                style={{
                  padding: "0.75rem",
                  background: "rgba(245, 158, 11, 0.1)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  borderRadius: "0.5rem",
                  color: "#fbbf24",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                Pending Approvals
              </button>
              <button
                onClick={() => navigate("/regional/reports")}
                style={{
                  padding: "0.75rem",
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "0.5rem",
                  color: "#34d399",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                View Reports
              </button>
              <button
                onClick={() => navigate("/map-view")}
                style={{
                  padding: "0.75rem",
                  background: "rgba(139, 92, 246, 0.1)",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  borderRadius: "0.5rem",
                  color: "#a78bfa",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                View Region Map
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
