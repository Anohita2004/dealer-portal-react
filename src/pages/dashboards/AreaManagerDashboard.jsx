import React, { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import DataTable from "../../components/DataTable";
import api from "../../services/api";
import "./DashboardLayout.css";

export default function AreaManagerDashboard() {
  const [summary, setSummary] = useState(null);
  const [dealers, setDealers] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const s = await api.get("/areas/dashboard/summary");
      const d = await api.get("/areas/dashboard/dealers");
      const a = await api.get("/areas/dashboard/approvals");

      setSummary(s.data);
      setDealers(d.data);
      setApprovals(a.data || []);
    } catch (err) {
      console.error("Area Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p className="loader">Loading dashboard…</p>;

  return (
    <div style={{ padding: "1.2rem" }}>
      <PageHeader 
        title="Area Manager Dashboard" 
        subtitle="Live analytics for your assigned region"
      />

      {/* ==================== Top Stats  ==================== */}
      <div className="stat-grid">
        <StatCard title="Dealers" value={summary.dealers} icon="🏬" />
        <StatCard title="Territories" value={summary.territories} icon="🗺️" />
        <StatCard title="Pending Approvals" value={summary.approvalsPending} icon="⚠️" highlight />
        <StatCard title="Active Campaigns" value={summary.activeCampaigns} icon="📢" />
      </div>

      <div className="dashboard-3col">

        {/* ==================== Approvals ==================== */}
        <Card title="Pending Approvals">
          {approvals.length === 0 && <p className="text-muted">No approvals pending 🎉</p>}
          {approvals.slice(0, 5).map(a => (
            <div className="approval-item" key={a.id}>
              <b>{a.dealer?.businessName}</b>
              <span>{a.documentType}</span>
              <button className="btn-approve">Review</button>
            </div>
          ))}
        </Card>

        {/* ==================== Alerts ==================== */}
        <Card title="Alerts & Notifications">
          <ul className="alert-list">
            <li>⚠ Low inventory for 3 dealers</li>
            <li>📄 Contracts expiring this month</li>
            <li>📉 Territory performance dips warning</li>
          </ul>
        </Card>

        {/* ==================== (Placeholder) Performance ==================== */}
        <Card title="30-Day Performance">
          <p className="text-muted">Graph module coming next 🚀</p>
        </Card>

      </div>

      {/* ==================== Dealer Table ==================== */}
      <Card title="Dealers in My Area" style={{ marginTop: "1.5rem" }}>
        <DataTable
          columns={["Dealer Name", "Code", "Phone", "Active?"]}
          data={dealers.map(d => [
            d.businessName, 
            d.dealerCode, 
            d.phoneNumber || "-",
            d.isActive ? "Active" : "Inactive"
          ])}
        />
      </Card>
    </div>
  );
}
