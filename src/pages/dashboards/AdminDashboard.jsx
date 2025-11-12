import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import Toolbar from "../../components/Toolbar";
import SearchInput from "../../components/SearchInput";
import IconPillButton from "../../components/IconPillButton";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import "./DashboardLayout.css";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState({});
  const [approvals, setApprovals] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [dealerActivity, setDealerActivity] = useState([]);
  const [pricing, setPricing] = useState({ approved: 0, pending: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Admin: fetch full dealer performance report
        const perfRes = await api.get("/reports/dealer-performance");
        const perfData = perfRes.data;
        let totalSales = 0;
        let dealersCount = 0;

        if (Array.isArray(perfData)) {
          dealersCount = perfData.length;
          perfData.forEach((d) => {
            totalSales += Number(d.totalSales || 0);
          });
        } else {
          dealersCount = perfData?.dealers || 0;
          totalSales = perfData?.totalSales || 0;
        }

        // Campaigns
        const campaignRes = await api.get("/campaigns");
        const activeCampaigns = campaignRes.data.campaigns?.length || campaignRes.data?.length || 0;
        setCampaigns(campaignRes.data.campaigns || campaignRes.data || []);

        // Pending documents (approvals)
        const docs = await api.get("/documents");
        const pendingDocs = docs.data.documents || [];

        // Pricing summary
        let pricingRes;
        try {
          pricingRes = await api.get("/pricing/summary");
        } catch {
          pricingRes = { data: { approved: 0, pending: 0, rejected: 0 } };
        }
        setPricing(pricingRes.data || { approved: 0, pending: 0, rejected: 0 });

        // ===== Enhanced dealer activity insights =====
const monthly = {};

// Get invoices or performance data (depending on your backend)
const rawData = Array.isArray(perfData)
  ? perfData
  : perfData?.dealers || [];

(rawData || []).forEach((dealer) => {
  const date = dealer.createdAt || dealer.onboardedAt || dealer.updatedAt || new Date();
  const m = new Date(date).toLocaleString("default", { month: "short" });

  if (!monthly[m]) {
    monthly[m] = {
      month: m,
      dealersOnboarded: 0,
      blockedDealers: 0,
      totalSales: 0,
    };
  }

  monthly[m].dealersOnboarded += 1;
  monthly[m].totalSales += Number(dealer.totalSales || 0);
  if (dealer.status === "blocked" || dealer.isBlocked) {
    monthly[m].blockedDealers += 1;
  }
});

// Ensure last 6 months are present
const now = new Date();
const last6Months = [];
for (let i = 5; i >= 0; i--) {
  const d = new Date(now);
  d.setMonth(now.getMonth() - i);
  const m = d.toLocaleString("default", { month: "short" });

  last6Months.push({
    month: m,
    dealersOnboarded: monthly[m]?.dealersOnboarded || 0,
    blockedDealers: monthly[m]?.blockedDealers || 0,
    totalSales: monthly[m]?.totalSales || 0,
  });
}

console.log("📊 Dealer Activity Chart Data:", last6Months);
setDealerActivity(last6Months);

// Compute average monthly sales
const avgMonthlySales =
  last6Months.reduce((sum, a) => sum + a.totalSales, 0) / (last6Months.length || 1);

setSummary({
  dealers: dealersCount,
  totalSales,
  avgMonthlySales: Math.round(avgMonthlySales),
  activeCampaigns,
  blockedDealers: last6Months.reduce((sum, a) => sum + a.blockedDealers, 0),
  pendingApprovals: pendingDocs.length,
});


        setApprovals(pendingDocs);
      } catch (e) {
        console.error("Admin dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleApproval = (id, action) => {
    toast.info(`Opening pricing approvals list...`);
    navigate("/pricing-approvals");
  };

  if (loading)
    return (
      <div className="center text-center" style={{ height: "80vh" }}>
        Loading Admin Dashboard...
      </div>
    );

  return (
    <div className="dashboard-container">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Quick overview of dealer performance & campaigns."
      />

      <Toolbar
        left={[
          <SearchInput
            key="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dealers or campaigns..."
          />,
        ]}
        right={[
          <IconPillButton
            key="new-camp"
            icon="➕"
            label="Campaigns"
            onClick={() => navigate("/campaigns")}
          />,
          <IconPillButton
            key="manage"
            icon="🧩"
            tone="warning"
            label="Manage Dealers"
            onClick={() => navigate("/admin")}
          />,
        ]}
      />

      <div className="stat-grid">
        <StatCard title="Total Dealers" value={summary.dealers || 0} icon="🏪" />
        <StatCard title="Pending Approvals" value={summary.pendingApprovals || 0} icon="🕒" />
        <StatCard title="Blocked Dealers" value={summary.blockedDealers || 0} icon="🚫" />
        <StatCard title="Active Campaigns" value={summary.activeCampaigns || 0} icon="📢" />
        <StatCard
          title="Avg Monthly Sales"
          value={`₹${summary.avgMonthlySales?.toLocaleString() || 0}`}
          icon="💰"
        />
      </div>

      <div className="dashboard-grid">
        <div className="column">
          <Card title="Dealer Activity (Last 6 Months)" className="chart-card">
  <div style={{
    width: "100%",
    height: "340px",       // fixed height
    background: "#1e1e1e22", // debug background
    border: "1px dashed #999"
  }}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={dealerActivity}
        margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
        <XAxis dataKey="month" stroke="#666" />
        <YAxis yAxisId="left" stroke="#666" />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#ffb300"
          tickFormatter={(v) => `₹${v / 1000}k`}
        />
        <Tooltip
          contentStyle={{
            background: "#222",
            border: "1px solid #555",
            color: "#fff",
          }}
          formatter={(v, name) =>
            name === "totalSales" ? [`₹${v.toLocaleString()}`, "Total Sales"] : [v, name]
          }
        />
        <Bar yAxisId="left" dataKey="dealersOnboarded" fill="#d44b22ff" name="Dealers Onboarded" />
        <Bar yAxisId="left" dataKey="blockedDealers" fill="#F44336" name="Blocked Dealers" />
        <Bar yAxisId="right" dataKey="totalSales" fill="#ff6a07ff" name="Total Sales" />
      </BarChart>
    </ResponsiveContainer>
  </div>
</Card>



          <div className="stat-grid">
            <Card title="Market Demand" compact>
              <h2>{summary.activeCampaigns}</h2>
              <p className="text-muted small">Active campaigns</p>
            </Card>
            <Card title="New Dealers" compact>
              <h2>{summary.dealers}</h2>
              <p className="text-muted small">Recently onboarded</p>
            </Card>
          </div>
        </div>

        <div className="column">
          <Card title="Pricing Distribution">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "Approved", value: pricing.approved || 0 },
                      { name: "Pending", value: pricing.pending || 0 },
                      { name: "Rejected", value: pricing.rejected || 0 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card-bg)",
                        border: "1px solid var(--card-border)",
                        color: "var(--text-color)",
                      }}
                    />
                    <Bar dataKey="value" fill="var(--accent)" barSize={18} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ width: 170 }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{pricing.approved || 0}</div>
                  <div className="text-muted small">Approved</div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{pricing.pending || 0}</div>
                  <div className="text-muted small">Pending</div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{pricing.rejected || 0}</div>
                  <div className="text-muted small">Rejected</div>
                </div>

                <div style={{ marginTop: 8 }}>
                  <button className="btn-primary" onClick={() => navigate("/pricing-approvals")}>
                    View Pricing Requests
                  </button>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Pending Approvals">
            {approvals.slice(0, 4).length ? (
              approvals.slice(0, 4).map((a) => (
                <div
                  key={a.id}
                  className="approval-item"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid var(--card-border)",
                    padding: "0.5rem 0",
                  }}
                >
                  <div>
                    <strong>{a.dealerName}</strong>
                    <div className="text-muted small">{a.documentType}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn-success" onClick={() => handleApproval(a.id, "open")}>
                      ✔
                    </button>
                    <button className="btn-danger" onClick={() => handleApproval(a.id, "open")}>
                      ✖
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted">No pending approvals</p>
            )}
          </Card>

          <Card title="Active Campaigns">
            {campaigns.slice(0, 4).length ? (
              campaigns.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/campaigns/${c.id}`)}
                  style={{
                    cursor: "pointer",
                    borderBottom: "1px solid var(--card-border)",
                    padding: "0.5rem 0",
                  }}
                >
                  <strong style={{ color: "var(--accent)" }}>{c.title || c.campaignName}</strong>
                  <p className="text-muted small">{c.description}</p>
                </div>
              ))
            ) : (
              <p className="text-muted">No active campaigns</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
