// src/pages/dashboard/AdminDashboard.jsx
import React, { useEffect, useState, useContext } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import Toolbar from "../../components/Toolbar";
import SearchInput from "../../components/SearchInput";
import IconPillButton from "../../components/IconPillButton";

import { AuthContext } from "../../context/AuthContext";

// Lucide Icons
import {
  Plus,
  Puzzle,
  Users,
  Clock,
  Ban,
  Megaphone,
  Wallet,
  TrendingUp,
  Check,
  X,
} from "lucide-react";

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
  const { user } = useContext(AuthContext);

  const [summary, setSummary] = useState({});
  const [approvals, setApprovals] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [dealerActivity, setDealerActivity] = useState([]);
  const [pricing, setPricing] = useState({ approved: 0, pending: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // 🌈 Same visual identity as Accounts Dashboard
  const roleTheme = {
    admin: { color: "var(--color-primary-dark)", bg: "rgba(37, 99, 235, 0.1)" },
    accounts: { color: "var(--color-success)", bg: "rgba(22, 163, 74, 0.1)" },
    manager: { color: "var(--color-warning)", bg: "rgba(245, 158, 11, 0.1)" },
    dealer: { color: "var(--color-primary)", bg: "var(--color-primary-soft)" },
  };
  const theme = roleTheme[user?.role] || { color: "var(--color-text-secondary)", bg: "var(--color-background)" };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // Performance Data
        const perfRes = await api.get("/reports/dealer-performance");
        let perfData = Array.isArray(perfRes.data)
          ? perfRes.data
          : perfRes.data?.dealers || [];

        const dealersCount = perfData.length;
        const totalSales = perfData.reduce((sum, d) => sum + (d.totalSales || 0), 0);

        // Campaigns
        const campRes = await api.get("/campaigns");
        const allCampaigns = campRes.data.campaigns || campRes.data || [];

        // Pending Documents
        const docsRes = await api.get("/documents");
        const pendingDocs = docsRes.data.documents || [];

        // Pricing summary
        let pricingRes;
        try {
          pricingRes = await api.get("/pricing/summary");
        } catch {
          pricingRes = { data: { approved: 0, pending: 0, rejected: 0 } };
        }

        setPricing(pricingRes.data);

        // Dealer Activity — Last 6 Months
        const monthly = {};
        perfData.forEach((dealer) => {
          const date = dealer.updatedAt || dealer.createdAt || new Date();
          const month = new Date(date).toLocaleString("default", { month: "short" });

          if (!monthly[month]) {
            monthly[month] = { month, dealersOnboarded: 0, blocked: 0, totalSales: 0 };
          }
          monthly[month].dealersOnboarded += 1;
          monthly[month].totalSales += dealer.totalSales || 0;
          if (dealer.status === "blocked") monthly[month].blocked += 1;
        });

        const now = new Date();
        const last6 = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now);
          d.setMonth(now.getMonth() - i);
          const m = d.toLocaleString("default", { month: "short" });
          last6.push({
            month: m,
            dealersOnboarded: monthly[m]?.dealersOnboarded || 0,
            blocked: monthly[m]?.blocked || 0,
            totalSales: monthly[m]?.totalSales || 0,
          });
        }

        setDealerActivity(last6);
        setApprovals(pendingDocs);
        setCampaigns(allCampaigns);

        const avgMonthlySales =
          last6.reduce((s, m) => s + m.totalSales, 0) / last6.length || 0;

        setSummary({
          dealers: dealersCount,
          totalSales,
          avgMonthlySales: Math.round(avgMonthlySales),
          pendingApprovals: pendingDocs.length,
          activeCampaigns: allCampaigns.length,
          blockedDealers: last6.reduce((s, m) => s + m.blocked, 0),
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load admin dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading)
    return (
      <div className="center text-center" style={{ height: "70vh" }}>
        Loading Admin Dashboard…
      </div>
    );

  return (
    <div style={{ padding: "1rem", background: theme.bg }}>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Full insight into dealer performance, approvals, and campaigns"
      />

      {/* FILTER + ACTIONS BAR */}
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
            key="camp"
            icon={<Plus size={18} />}
            label="Campaigns"
            onClick={() => navigate("/campaigns")}
          />,
          <IconPillButton
            key="manage"
            icon={<Puzzle size={18} />}
            tone="warning"
            label="Manage Dealers"
            onClick={() => navigate("/admin")}
          />,
        ]}
      />

      {/* KPI CARDS */}
      <div className="stat-grid">
        <StatCard title="Total Dealers" value={summary.dealers} icon={<Users />} />
        <StatCard
          title="Pending Approvals"
          value={summary.pendingApprovals}
          icon={<Clock />}
        />
        <StatCard
          title="Blocked Dealers"
          value={summary.blockedDealers}
          icon={<Ban />}
        />
        <StatCard
          title="Active Campaigns"
          value={summary.activeCampaigns}
          icon={<Megaphone />}
        />
        <StatCard
          title="Avg Monthly Sales"
          value={`₹${summary.avgMonthlySales?.toLocaleString()}`}
          icon={<TrendingUp />}
        />
      </div>

      {/* MAIN GRID */}
      <div className="dashboard-grid">
        {/* LEFT COLUMN */}
        <div className="column">
          <Card title="Dealer Activity (Last 6 Months)">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={dealerActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="dealersOnboarded" fill={theme.color} name="Onboarded" />
                <Bar dataKey="blocked" fill="var(--color-error)" name="Blocked" />
                <Bar dataKey="totalSales" fill="var(--color-warning)" name="Sales" />
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
          <Card title="Pricing Distribution">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={[
                  { name: "Approved", value: pricing.approved },
                  { name: "Pending", value: pricing.pending },
                  { name: "Rejected", value: pricing.rejected },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={theme.color} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <button
              className="btn-primary"
              style={{ marginTop: "1rem" }}
              onClick={() => navigate("/pricing-approvals")}
            >
              View Pricing Requests
            </button>
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
                    borderBottom: "1px solid #eee",
                    padding: "0.6rem 0",
                  }}
                >
                  <div>
                    <strong>{a.dealerName}</strong>
                    <div className="text-muted small">{a.documentType}</div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-success">
                      <Check size={16} />
                    </button>
                    <button className="btn-danger">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted">No pending approvals</p>
            )}
          </Card>

          <Card title="Active Campaigns">
            {campaigns.slice(0, 4).map((c) => (
              <div
                key={c.id}
                style={{
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                  padding: "0.6rem 0",
                }}
                onClick={() => navigate(`/campaigns/${c.id}`)}
              >
                <strong style={{ color: theme.color }}>
                  {c.title || c.campaignName}
                </strong>
                <p className="text-muted small">{c.description}</p>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
