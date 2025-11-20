import React from "react";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import "./DashboardLayout.css";

export default function TechnicalAdminDashboard() {
  const summary = {
    permissions: 128,
    materials: 542,
    pendingChanges: 6,
  };

  return (
    <div style={{ padding: "1rem" }}>
      <PageHeader
        title="Technical Admin Dashboard"
        subtitle="Manage material master and technical permissions"
      />

      <div className="stat-grid">
        <StatCard title="Permissions" value={summary.permissions} />
        <StatCard title="Materials" value={summary.materials} />
        <StatCard title="Pending Changes" value={summary.pendingChanges} />
      </div>

      <div className="dashboard-grid">
        <div className="column">
          <Card title="Material Master">
            <p className="text-muted">Quick actions for material records and mapping.</p>
            <ul>
              <li>Review recently updated materials</li>
              <li>Approve pending material imports</li>
              <li>Manage attribute mappings</li>
            </ul>
          </Card>
        </div>

        <div className="column">
          <Card title="Permission Audit">
            <p className="text-muted">Recent permission changes and audit trail.</p>
            <div className="text-muted small">No critical changes in last 7 days.</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
