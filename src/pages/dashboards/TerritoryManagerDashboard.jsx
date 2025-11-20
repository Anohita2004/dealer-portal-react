import React from "react";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import "./DashboardLayout.css";

export default function TerritoryManagerDashboard() {
  const summary = { dealers: 8, approvals: 2 };

  return (
    <div style={{ padding: "1rem" }}>
      <PageHeader title="Territory Manager Dashboard" subtitle="Territory overview and approvals" />

      <div className="stat-grid">
        <StatCard title="Dealers" value={summary.dealers} />
        <StatCard title="Pending Approvals" value={summary.approvals} />
      </div>

      <div className="dashboard-grid">
        <div className="column">
          <Card title="Territory Activity">
            <p className="text-muted">Recent activity from dealers in your territory.</p>
          </Card>
        </div>

        <div className="column">
          <Card title="Tasks">
            <ul>
              <li>Review pricing exceptions</li>
              <li>Approve new dealer requests</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
