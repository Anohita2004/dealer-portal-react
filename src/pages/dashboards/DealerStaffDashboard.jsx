import React from "react";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import "./DashboardLayout.css";

export default function DealerStaffDashboard() {
  const summary = { myOrders: 5, drafts: 2, unreadDocs: 3 };

  return (
    <div style={{ padding: "1rem" }}>
      <PageHeader title="Dealer Staff Dashboard" subtitle="Quick actions and personal stats" />

      <div className="stat-grid">
        <StatCard title="My Orders" value={summary.myOrders} />
        <StatCard title="Drafts" value={summary.drafts} />
        <StatCard title="Unread Documents" value={summary.unreadDocs} />
      </div>

      <div className="dashboard-grid">
        <div className="column">
          <Card title="Recent Orders">
            <p className="text-muted">Your recent order activity and statuses.</p>
          </Card>
        </div>

        <div className="column">
          <Card title="Quick Actions">
            <ul>
              <li>Create new order</li>
              <li>Upload documents</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
