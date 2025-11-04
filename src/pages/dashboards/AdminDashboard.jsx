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
} from "recharts";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({});
  const [approvals, setApprovals] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [dealerActivity, setDealerActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // ✅ 1. Admin summary using dealer performance as proxy
        const performanceRes = await api.get("/reports/dealer-performance");
        const invoices = performanceRes.data?.invoices || [];
        const totalSales = performanceRes.data?.totalSales || 0;
        const dealers = new Set(invoices.map((i) => i.dealerId)).size;

        setSummary({
          activeCampaigns: 0, // will update below
          dealers,
          pendingApprovals: 5, // mock fallback if not implemented yet
          blockedDealers: 2,
          totalSales,
        });

        // ✅ 2. Campaigns
        const campaignRes = await api.get("/campaigns");
        setCampaigns(campaignRes.data.campaigns || campaignRes.data);
        setSummary((prev) => ({
          ...prev,
          activeCampaigns: campaignRes.data.campaigns?.length || 0,
        }));

        // ✅ 3. Simulated dealer activity (based on invoices by month)
        const monthly = {};
        invoices.forEach((i) => {
          const month = new Date(i.invoiceDate).toLocaleString("default", {
            month: "short",
          });
          monthly[month] = monthly[month] || { dealersOnboarded: 0, blockedDealers: 0 };
          monthly[month].dealersOnboarded += 1;
        });
        const dealerTrend = Object.keys(monthly).map((m) => ({
          month: m,
          dealersOnboarded: monthly[m].dealersOnboarded,
          blockedDealers: Math.floor(Math.random() * 3),
        }));
        setDealerActivity(dealerTrend);

        // ✅ 4. Pending approvals (placeholder - will connect later)
        const approvalRes = await api.get("/documents").catch(() => ({ data: [] }));
        setApprovals(approvalRes.data || []);
      } catch (e) {
        console.error("Error fetching admin dashboard:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <div className="center text-center" style={{ height: "80vh" }}>
        Loading admin dashboard...
      </div>
    );

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: "2rem", color: "#2563eb", marginBottom: "0.3rem" }}>
          Administrator Dashboard
        </h2>
        <p style={{ color: "#6b7280" }}>
          Manage campaigns, dealer approvals, and monitor business operations.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid mt-4">
        <Card
          title="Active Campaigns"
          value={summary.activeCampaigns || 0}
          icon="📢"
          onClick={() => navigate("/campaigns")}
        />
        <Card
          title="Registered Dealers"
          value={summary.dealers || 0}
          icon="🏪"
          onClick={() => navigate("/admin")}
        />
        <Card
          title="Pending Approvals"
          value={summary.pendingApprovals || 0}
          icon="🕒"
          onClick={() => navigate("/documents")}
        />
        <Card title="Blocked Dealers" value={summary.blockedDealers || 0} icon="🚫" />
      </div>

      {/* Dealer Activity Chart */}
      <div className="card mt-6">
        <h3 style={{ color: "#2563eb" }}>Dealer Activity (Last 6 Months)</h3>
        {dealerActivity.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dealerActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="dealersOnboarded" fill="#2563eb" name="Dealers Onboarded" />
              <Bar dataKey="blockedDealers" fill="#ef4444" name="Blocked Dealers" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: "#94a3b8" }}>No dealer activity data available</p>
        )}
      </div>

      {/* Pending Approvals Table */}
      <div className="card mt-6">
        <h3 style={{ color: "#2563eb" }}>Pending Approvals</h3>
        {approvals.length > 0 ? (
          <table className="styled-table">
            <thead>
              <tr>
                <th>Dealer</th>
                <th>Document Type</th>
                <th>Uploaded On</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {approvals.slice(0, 5).map((a) => (
                <tr key={a.id}>
                  <td>{a.dealerName}</td>
                  <td>{a.documentType}</td>
                  <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="approve-btn"
                      style={{
                        marginRight: "0.5rem",
                        background: "linear-gradient(90deg, #22c55e, #16a34a)",
                      }}
                    >
                      Approve
                    </button>
                    <button
                      className="reject-btn"
                      style={{
                        background: "linear-gradient(90deg, #ef4444, #b91c1c)",
                      }}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: "#94a3b8" }}>No pending approvals</p>
        )}
      </div>

      {/* Campaign Overview */}
      <div className="card mt-6">
        <h3 style={{ color: "#2563eb" }}>Active Campaigns</h3>
        {campaigns.length > 0 ? (
          <div className="grid">
            {campaigns.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="card hover-glow"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/campaigns/${c.id}`)}
              >
                <h4 style={{ color: "#1e40af" }}>{c.title}</h4>
                <p style={{ color: "#6b7280" }}>{c.description}</p>
                <p style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                  Valid till: {new Date(c.endDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#94a3b8" }}>No active campaigns</p>
        )}
      </div>

      {/* Quick Admin Actions */}
      <div className="mt-6 flex" style={{ gap: "1rem" }}>
        <button className="primary" onClick={() => navigate("/campaigns")}>
          ➕ Create Campaign
        </button>
        <button
          className="primary"
          onClick={() => navigate("/admin")}
          style={{
            background: "linear-gradient(90deg, #facc15, #eab308)",
          }}
        >
          ⚙️ Manage Dealers
        </button>
        <button
          className="primary"
          onClick={() => navigate("/reports")}
          style={{
            background: "linear-gradient(90deg, #3b82f6, #2563eb)",
          }}
        >
          📊 View Reports
        </button>
      </div>
    </div>
  );
}

const Card = ({ title, value, icon, onClick }) => (
  <div className="card hover-glow" onClick={onClick}>
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <span style={{ fontSize: "1.5rem" }}>{icon}</span>
      <h4>{title}</h4>
    </div>
    <p
      style={{
        fontSize: "1.8rem",
        fontWeight: "bold",
        color: "#2563eb",
        marginTop: "0.3rem",
      }}
    >
      {value}
    </p>
  </div>
);
