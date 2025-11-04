import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({});
  const [dealerPerformance, setDealerPerformance] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [messages, setMessages] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // Summary for TM/AM region
        const summaryRes = await api.get("/reports/dealer-performance");
        setSummary(summaryRes.data || {});

        // Dealer performance trend
        const perfRes = await api.get("/reports/territory");
        setDealerPerformance(perfRes.data.report || []);

        // Pending dealer document approvals (filtered by region)
        const approvalsRes = await api.get("/reports/pending-approvals");
        setPendingApprovals(approvalsRes.data || []);

        // Messages from dealers
        const msgRes = await api.get("/messages");
        setMessages(msgRes.data.messages || msgRes.data || []);

        // Active campaigns in region
        const campRes = await api.get("/campaigns");
        setCampaigns(campRes.data.campaigns || campRes.data || []);
      } catch (err) {
        console.error("Manager dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return <div className="center text-center" style={{ height: "80vh" }}>Loading manager dashboard...</div>;

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: "2rem", color: "#60a5fa" }}>Manager Dashboard</h2>
        <p style={{ color: "#94a3b8" }}>
          Monitor dealers, campaigns, and regional activities in your assigned territory.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid mt-4">
        <Card title="Total Dealers" value={summary.totalInvoices || 0} icon="🏪" onClick={() => navigate("/dealers")} />
        <Card title="Active Campaigns" value={campaigns.length} icon="📢" onClick={() => navigate("/campaigns")} />
        <Card title="Pending Approvals" value={pendingApprovals.length} icon="🕒" onClick={() => navigate("/reports")} />
        <Card title="New Messages" value={messages.length} icon="💬" onClick={() => navigate("/messages")} />
      </div>

      {/* Dealer Performance Chart */}
      <div className="card mt-6">
        <h3>Dealer Performance by Territory</h3>
        {dealerPerformance.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dealerPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="businessName" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalSales" fill="#3b82f6" name="Sales (₹)" />
              <Bar dataKey="outstanding" fill="#ef4444" name="Outstanding (₹)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: "#94a3b8" }}>No dealer performance data available</p>
        )}
      </div>

      {/* Pending Approvals */}
      <div className="card mt-6">
        <h3>Pending Dealer Approvals</h3>
        {pendingApprovals.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Dealer</th>
                <th>Document</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingApprovals.map((a) => (
                <tr key={a.id}>
                  <td>{a.dealerName}</td>
                  <td>{a.documentType}</td>
                  <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td>Pending</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: "#94a3b8" }}>No pending approvals</p>
        )}
      </div>

      {/* Recent Messages */}
      <div className="card mt-6">
        <h3>Recent Dealer Messages</h3>
        {messages.length > 0 ? (
          <ul>
            {messages.slice(0, 5).map((msg) => (
              <li key={msg.id} style={{ margin: "0.5rem 0" }}>
                <strong>{msg.dealerName}</strong>: {msg.subject} —{" "}
                <span style={{ color: "#64748b" }}>{msg.status || "Unread"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "#94a3b8" }}>No new messages</p>
        )}
      </div>

      {/* Active Campaigns */}
      <div className="card mt-6">
        <h3>Active Campaigns</h3>
        {campaigns.length > 0 ? (
          <div className="grid">
            {campaigns.slice(0, 3).map((c) => (
              <div key={c.id} className="card hover-glow" style={{ cursor: "pointer" }}>
                <h4 style={{ color: "#60a5fa" }}>{c.title}</h4>
                <p style={{ color: "#94a3b8" }}>{c.description}</p>
                <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Valid till: {new Date(c.endDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#94a3b8" }}>No active campaigns</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex" style={{ gap: "1rem" }}>
        <button className="primary" onClick={() => navigate("/reports")}>
          📊 View Reports
        </button>
        <button
          className="primary"
          onClick={() => navigate("/messages")}
          style={{ background: "linear-gradient(90deg, #3b82f6, #2563eb)" }}
        >
          💬 View Messages
        </button>
        <button
          className="primary"
          onClick={() => navigate("/campaigns")}
          style={{ background: "linear-gradient(90deg, #22c55e, #16a34a)" }}
        >
          📢 Regional Campaigns
        </button>
      </div>
    </div>
  );
}

// 📦 Card Component
const Card = ({ title, value, icon, onClick }) => (
  <div className="card hover-glow" onClick={onClick}>
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <span style={{ fontSize: "1.5rem" }}>{icon}</span>
      <h4>{title}</h4>
    </div>
    <p style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#3b82f6" }}>{value}</p>
  </div>
);
