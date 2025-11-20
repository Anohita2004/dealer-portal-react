import React from "react";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import "./DashboardLayout.css";

export default function FinanceAdminDashboard() {
  const summary = { invoices: 124, overdue: 8, receipts: 102 };

  return (
    <div style={{ padding: "1rem" }}>
      <PageHeader title="Finance Dashboard" subtitle="Invoices, statements and accounts" />

      <div className="stat-grid">
        <StatCard title="Invoices" value={summary.invoices} />
        <StatCard title="Overdue" value={summary.overdue} />
        <StatCard title="Receipts" value={summary.receipts} />
      </div>

      <div className="dashboard-grid">
        <div className="column">
          <Card title="Recent Invoices">
            <p className="text-muted">Latest invoices and payment status.</p>
          </Card>
        </div>

        <div className="column">
          <Card title="Accounts Tasks">
            <ul>
              <li>Reconcile statements</li>
              <li>Review credit notes</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
