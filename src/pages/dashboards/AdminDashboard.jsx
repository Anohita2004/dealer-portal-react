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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const perf = await api.get("/reports/dealer-performance");
        const invoices = perf.data?.invoices || [];
        const totalSales = perf.data?.totalSales || 0;
        const dealers = new Set(invoices.map((i) => i.dealerId)).size;

        const campaignRes = await api.get("/campaigns");
        const activeCampaigns = campaignRes.data.campaigns?.length || 0;
        setCampaigns(campaignRes.data.campaigns || campaignRes.data);

        const docs = await api.get("/documents");
        const approvals = docs.data.documents || [];

        const monthly = {};
        invoices.forEach((i) => {
          const m = new Date(i.invoiceDate).toLocaleString("default", { month: "short" });
          monthly[m] = monthly[m] || { dealersOnboarded: 0, blockedDealers: 0 };
          monthly[m].dealersOnboarded += 1;
        });

        setDealerActivity(
          Object.keys(monthly).map((m) => ({
            month: m,
            dealersOnboarded: monthly[m].dealersOnboarded,
            blockedDealers: Math.floor(Math.random() * 3),
          }))
        );

        setSummary({
          dealers,
          totalSales,
          activeCampaigns,
          blockedDealers: 2,
          pendingApprovals: approvals.length,
        });
        setApprovals(approvals);
      } catch (e) {
        console.error("Admin dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleApproval = async (id, action) => {
    toast.info(`Dealer ${action === "approve" ? "approved ✅" : "rejected ❌"}`);
    setApprovals((prev) => prev.filter((a) => a.id !== id));
  };

  if (loading)
    return (
      <div className="center text-center" style={{ height: "80vh" }}>
        Loading Admin Dashboard...
      </div>
    );

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <PageHeader title="Admin Dashboard" subtitle="Quick overview of dealer performance & campaigns." />

      {/* TOOLBAR */}
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

      {/* KPI SUMMARY */}
      <div className="stat-grid">
        <StatCard title="Total Dealers" value={summary.dealers || 0} icon="🏪" />
        <StatCard title="Pending Approvals" value={summary.pendingApprovals || 0} icon="🕒" />
        <StatCard title="Blocked Dealers" value={summary.blockedDealers || 0} icon="🚫" />
        <StatCard title="Active Campaigns" value={summary.activeCampaigns || 0} icon="📢" />
      </div>

      {/* MAIN GRID */}
      <div className="dashboard-grid">
        {/* LEFT COLUMN */}
        <div className="column">
          <Card title="Dealer Activity (Last 6 Months)" className="chart-card">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dealerActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--card-border)",
                    color: "var(--text-color)",
                  }}
                />
                <Bar dataKey="dealersOnboarded" fill="var(--accent)" barSize={12} radius={[4, 4, 0, 0]} />
                <Bar dataKey="blockedDealers" fill="var(--text-muted)" barSize={12} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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

        {/* RIGHT COLUMN */}
        <div className="column">
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
                  <div style={{ display: "flex", gap: "0.3rem" }}>
                    <button className="btn-success" onClick={() => handleApproval(a.id, "approve")}>
                      ✔
                    </button>
                    <button className="btn-danger" onClick={() => handleApproval(a.id, "reject")}>
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
                  <strong style={{ color: "var(--accent)" }}>{c.title}</strong>
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
