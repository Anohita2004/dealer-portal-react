import React from "react";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import "./DashboardLayout.css";

export default function AreaManagerDashboard() {
  const summary = { dealers: 12, tasks: 7 };

  return (
    <div style={{ padding: "1rem" }}>
      <PageHeader title="Area Manager Dashboard" subtitle="Overview for area-level management" />

      <div className="stat-grid">
        <StatCard title="Dealers" value={summary.dealers} />
        <StatCard title="Open Tasks" value={summary.tasks} />
      </div>

      <div className="dashboard-grid">
        <div className="column">
          <Card title="Area Tasks">
            <ul>
              <li>Follow up with underperforming dealers</li>
              <li>Coordinate logistics</li>
            </ul>
          </Card>
        </div>

        <div className="column">
          <Card title="Notifications">
            <p className="text-muted">Alerts and important updates for your area.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
