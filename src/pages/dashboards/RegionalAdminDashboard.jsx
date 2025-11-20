import React from "react";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import "./DashboardLayout.css";

export default function RegionalAdminDashboard() {
  const summary = { dealers: 42, regions: 6, activeCampaigns: 3 };

  return (
    <div style={{ padding: "1rem" }}>
      <PageHeader title="Regional Admin Dashboard" subtitle="Overview of regions and dealers" />

      <div className="stat-grid">
        <StatCard title="Dealers" value={summary.dealers} />
        <StatCard title="Regions" value={summary.regions} />
        <StatCard title="Active Campaigns" value={summary.activeCampaigns} />
      </div>

      <div className="dashboard-grid">
        <div className="column">
          <Card title="Top Performing Dealers">
            <p className="text-muted">Shows dealers in the region with best metrics.</p>
          </Card>
        </div>

        <div className="column">
          <Card title="Regional Tasks">
            <ul>
              <li>Approve dealer onboarding</li>
              <li>Schedule regional visit</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
