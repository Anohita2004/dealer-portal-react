import React from "react";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import "./DashboardLayout.css";

export default function RegionalManagerDashboard() {
  const summary = { dealers: 28, approvals: 5, visits: 2 };

  return (
    <div style={{ padding: "1rem" }}>
      <PageHeader title="Regional Manager Dashboard" subtitle="Operations and approvals for your region" />

      <div className="stat-grid">
        <StatCard title="Dealers" value={summary.dealers} />
        <StatCard title="Pending Approvals" value={summary.approvals} />
        <StatCard title="Upcoming Visits" value={summary.visits} />
      </div>

      <div className="dashboard-grid">
        <div className="column">
          <Card title="Approvals">
            <p className="text-muted">Approve dealer documents and pricing requests.</p>
          </Card>
        </div>

        <div className="column">
          <Card title="Region Activity">
            <p className="text-muted">Summary of dealer activity and alerts.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
