import React, { useEffect, useState } from "react";
import api from "../../services/api";
import socket from "../../services/socket";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import DataTable from "../../components/DataTable";
import Toolbar from "../../components/Toolbar";
import SearchInput from "../../components/SearchInput";
import IconPillButton from "../../components/IconPillButton";

import { toast } from "react-toastify";

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
  const [search, setSearch] = useState("");

  // ✅ Load dashboard data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const performanceRes = await api.get("/reports/dealer-performance");
        const invoices = performanceRes.data?.invoices || [];

        const totalSales = performanceRes.data?.totalSales || 0;
        const dealers = new Set(invoices.map((i) => i.dealerId)).size;

        setSummary({
          activeCampaigns: 0,
          dealers,
          pendingApprovals: 0,
          blockedDealers: 2,
          totalSales,
        });

        // ✅ Campaigns
        const campaignRes = await api.get("/campaigns");
        setCampaigns(campaignRes.data.campaigns || campaignRes.data);
        setSummary((prev) => ({
          ...prev,
          activeCampaigns: campaignRes.data.campaigns?.length || 0,
        }));

        // ✅ Dealer activity by month
        const monthly = {};
        invoices.forEach((i) => {
          const m = new Date(i.invoiceDate).toLocaleString("default", {
            month: "short",
          });
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

        // ✅ Pending approvals
        const approvalRes = await api.get("/documents");
        setApprovals(approvalRes.data.documents || []);
        setSummary((prev) => ({
          ...prev,
          pendingApprovals: approvalRes.data.documents?.length || 0,
        }));
      } catch (e) {
        console.error("Admin dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ✅ Real-time updates
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) socket.auth = { token };
    socket.connect();

    socket.on("connect", () => console.log("✅ Admin socket connected"));

    // New Document Uploaded
    socket.on("document:new", (data) => {
      toast.info(`📄 New document uploaded by Dealer ${data.dealerId}`);

      setApprovals((prev) => [
        {
          id: data.id || Date.now(),
          dealerName: data.dealerName || `Dealer ${data.dealerId}`,
          documentType: data.documentType || "Document",
          createdAt: new Date(),
        },
        ...prev,
      ]);

      setSummary((prev) => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals + 1,
      }));
    });

    socket.on("document:pending:update", () => {
      api.get("/documents").then((res) => {
        setApprovals(res.data.documents || []);
        setSummary((prev) => ({
          ...prev,
          pendingApprovals: res.data.documents?.length || 0,
        }));
      });
    });

    socket.on("campaign:new", (campaign) => {
      toast.success(`📢 New campaign launched: ${campaign.title}`);
      setCampaigns((prev) => [campaign, ...prev]);
    });

    return () => socket.disconnect();
  }, []);

  // ✅ Approve/Reject actions
  const handleApproval = async (id, action) => {
    try {
      await api.patch(`/documents/${id}/status`, { action });
      toast.success(`Document ${action}d`);

      setApprovals((prev) => prev.filter((doc) => doc.id !== id));
      setSummary((prev) => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals - 1,
      }));
    } catch {
      toast.error(`Failed to ${action} document`);
    }
  };

  if (loading)
    return (
      <div className="center text-center" style={{ height: "80vh" }}>
        Loading admin dashboard...
      </div>
    );

  return (
  <div style={{ padding: "1.5rem", color: "var(--text-color)" }}>

    {/* ✅ Page Header */}
    <PageHeader
      title="Administrator Dashboard"
      subtitle="Overview of your system activity, dealer performance, and approvals."
    />

    {/* ✅ TOP CONTROL BAR like reference UI */}
    <Toolbar
      left={[
        <SearchInput
          key="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search dealers, campaigns..."
        />,
      ]}
      right={[
        <IconPillButton key="date" icon="📅" label="This Month" />,
        <IconPillButton key="filter" icon="⚙️" label="Filter" />,
        <IconPillButton
          key="new-camp"
          icon="➕"
          label="New Campaign"
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

    {/* ✅ 2-COLUMN WRAPPER */}
    <div className="dashboard-grid" style={{
      display: "grid",
      gridTemplateColumns: "70% 30%",
      gap: "1.5rem",
      marginTop: "1.5rem"
    }}>

      {/* ✅ LEFT COLUMN */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* ✅ SALES CHART (Main card) */}
        <Card title="Dealer Activity Overview" subtitle="Last 6 months">
          <ResponsiveContainer width="100%" height={260}>
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
              <Bar dataKey="dealersOnboarded" fill="var(--accent)" />
              <Bar dataKey="blockedDealers" fill="var(--text-muted)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* ✅ 2 SMALLER CARDS (like "Market demand" + "Time order tracking") */}
        <div className="grid" style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "1fr 1fr" }}>
          
          <Card title="Market Demand">
            <div style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "1rem" }}>
              {summary.activeCampaigns}
            </div>
            <p className="text-muted">Active campaigns currently running.</p>
          </Card>

          <Card title="New Dealers This Month">
            <div style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "1rem" }}>
              {summary.dealers}
            </div>
            <p className="text-muted">Dealers onboarded in recent invoices.</p>
          </Card>

        </div>

      </div>

      {/* ✅ RIGHT COLUMN (KPIs + Approvals + Campaigns) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* ✅ KPI GRID */}
        <div className="grid" style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr" }}>
          <StatCard title="Total Dealers" value={summary.dealers || 0} icon="🏪" />
          <StatCard title="Pending Approvals" value={summary.pendingApprovals || 0} icon="🕒" />
          <StatCard title="Blocked Dealers" value={summary.blockedDealers || 0} icon="🚫" />
          <StatCard title="Active Campaigns" value={summary.activeCampaigns || 0} icon="📢" />
        </div>

        {/* ✅ Pending Approvals (Condensed list) */}
        <Card title="Pending Approvals">
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {approvals.slice(0, 5).map((a) => (
              <div key={a.id} style={{
                padding: "0.7rem 0",
                borderBottom: "1px solid var(--card-border)",
                display: "flex",
                justifyContent: "space-between"
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{a.dealerName}</div>
                  <div className="text-muted" style={{ fontSize: "0.85rem" }}>{a.documentType}</div>
                </div>

                <div style={{ display: "flex", gap: "0.3rem" }}>
                  <button className="btn-success" onClick={() => handleApproval(a.id, "approve")}>✔</button>
                  <button className="btn-danger" onClick={() => handleApproval(a.id, "reject")}>✖</button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ✅ Campaign Previews */}
        <Card title="Active Campaigns">
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {campaigns.slice(0, 4).map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/campaigns/${c.id}`)}
                style={{
                  padding: "0.7rem 0",
                  borderBottom: "1px solid var(--card-border)",
                  cursor: "pointer"
                }}
              >
                <div style={{ fontWeight: 600, color: "var(--accent)" }}>{c.title}</div>
                <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                  {c.description}
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>

    </div>

  </div>
);

}
