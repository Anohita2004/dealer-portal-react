// ==============================
// FILE: src/pages/dashboards/ManagerDashboard.jsx
// ==============================

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
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import "./ManagerDashboard.css";

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({});
  const [dealerPerformance, setDealerPerformance] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [messages, setMessages] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const COLORS = ["#3b82f6", "#60a5fa", "#2563eb", "#1d4ed8", "#93c5fd"];
  const accent = "#3b82f6";

  // 🔹 Load manager summary, dealers, pricing requests, campaigns, etc.
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [summaryRes, dealersRes, pricingRes, msgRes, campRes, invRes] =
          await Promise.all([
            api.get("/managers/summary"), // ✅ manager summary
            api.get("/managers/dealers"), // ✅ dealers list
            api.get("/managers/pricing?status=pending"), // ✅ pending pricing approvals
            api.get("/messages"), // ✅ messages (existing backend)
            api.get("/campaigns"), // ✅ active campaigns
            api.get("/inventory/summary"), // ✅ inventory summary
          ]);

        setSummary(summaryRes.data || {});
        setDealerPerformance(dealersRes.data.dealers || []);
        setPendingApprovals(pricingRes.data.updates || []);
        setMessages(msgRes.data.messages || msgRes.data || []);
        setCampaigns(campRes.data.campaigns || campRes.data || []);
        setInventory(invRes.data.inventory || invRes.data || []);
      } catch (err) {
        console.error("Manager dashboard load error:", err);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 🔹 Realtime updates (documents, messages, campaigns)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) socket.auth = { token };
    socket.connect();

    socket.on("document:new", (data) => {
      toast.info(`📄 New document uploaded by Dealer ${data.dealerId}`);
      setPendingApprovals((prev) => [
        {
          id: data.id || Date.now(),
          dealerName: data.dealerName || `Dealer ${data.dealerId}`,
          documentType: data.documentType || "Upload",
          createdAt: new Date(),
        },
        ...prev,
      ]);
    });

    socket.on("message:new", (msg) => {
      toast.success(`💬 Message from Dealer: ${msg.content}`);
      setMessages((prev) => [msg, ...prev]);
    });

    socket.on("campaign:new", (campaign) => {
      toast.info(`📢 New Campaign: ${campaign.title}`);
      setCampaigns((prev) => [campaign, ...prev]);
    });

    return () => socket.disconnect();
  }, []);

  if (loading)
    return (
      <div className="loading-screen">
        <div className="loading-text">Loading Manager Dashboard...</div>
      </div>
    );

  // 🧮 Stock health classification
  const lowStock = inventory.filter((i) => i.available < 20);
  const mediumStock = inventory.filter(
    (i) => i.available >= 20 && i.available < 100
  );
  const highStock = inventory.filter((i) => i.available >= 100);
// 🔹 Handle pricing approval / rejection / forwarding
const handlePricingAction = async (id, action) => {
  try {
    const remarks = prompt(`Enter remarks for ${action.toUpperCase()} (optional):`) || "";

    const res = await api.patch(`/managers/pricing/${id}/forward`, {
      action,
      remarks,
    });

    toast.success(`✅ Pricing request ${action} successful!`);

    // Refresh list after action
    setPendingApprovals((prev) =>
      prev.filter((p) => p.id !== id)
    );

    // Optional: reload summary counts
    const summaryRes = await api.get("/managers/summary");
    setSummary(summaryRes.data || {});
  } catch (err) {
    console.error("Pricing action failed:", err);
    toast.error("Failed to process pricing action");
  }
};

  return (
    <div className="manager-dashboard" style={{ color: "var(--text-color)" }}>
      <PageHeader
        title="Regional Manager Dashboard"
        subtitle="Monitor dealers, campaigns, and inventory performance in real-time."
      />

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
          <IconPillButton
            key="reports"
            icon="📊"
            label="Reports"
            onClick={() => navigate("/reports")}
          />,
          <IconPillButton
            key="campaigns"
            icon="📢"
            label="Campaigns"
            tone="warning"
            onClick={() => navigate("/campaigns")}
          />,
          <IconPillButton
  key="chat"
  icon="💬"
  label="Chat"
  tone="info"
  onClick={() => navigate("/manager/chat")}
/>

        ]}
      />

      <div className="dashboard-grid">
        {/* LEFT COLUMN */}
        <div className="left-col">
          <div className="kpi-row">
            <StatCard title="Total Dealers" value={summary.totalDealers || 0} icon="🏪" />
            <StatCard title="Pending Pricing" value={summary.pendingPricing || 0} icon="💰" />
            <StatCard title="Pending Documents" value={summary.pendingDocuments || 0} icon="🕒" />
            <StatCard title="Recent Sales" value={`₹ ${summary.recentSales || 0}`} icon="📈" />
          </div>

          {/* Stock Alerts */}
          {lowStock.length > 0 && (
            <div
              className="alert-banner"
              style={{
                background: "#fee2e2",
                color: "#b91c1c",
                padding: "0.75rem",
                borderRadius: "8px",
                marginBottom: "1rem",
                textAlign: "center",
                fontWeight: 500,
              }}
            >
              ⚠️ {lowStock.length} products are critically low on stock!
            </div>
          )}

          {/* Stock Overview */}
          <Card title="Stock Health Overview" style={{ marginBottom: "1rem" }}>
            {inventory.length ? (
              <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
                <div>
                  <h3 style={{ color: "#ef4444" }}>{lowStock.length}</h3>
                  <p className="text-muted">Low</p>
                </div>
                <div>
                  <h3 style={{ color: "#facc15" }}>{mediumStock.length}</h3>
                  <p className="text-muted">Moderate</p>
                </div>
                <div>
                  <h3 style={{ color: "#10b981" }}>{highStock.length}</h3>
                  <p className="text-muted">Healthy</p>
                </div>
              </div>
            ) : (
              <p className="text-muted">No inventory data available</p>
            )}
          </Card>

          {/* Dealer Performance */}
          <Card title="Top 5 Dealers by Sales" className="main-chart-card">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={dealerPerformance.slice(0, 5)} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="businessName" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalSales" fill={accent} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Pending Pricing Table */}
          {/* Pending Pricing Table with Action Buttons */}
<Card title="Pending Pricing Approvals" style={{ marginTop: "1rem" }}>
  <DataTable
    columns={[
      { key: "dealer", label: "Dealer" },
      { key: "product", label: "Product" },
      { key: "newPrice", label: "Requested Price" },
      { key: "requestedBy", label: "Requested By" },
      { key: "requestedAt", label: "Requested At" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Actions" },
    ]}
    rows={pendingApprovals
      .filter((a) => {
        const q = search.toLowerCase();
        return (
          !q ||
          (a.dealer?.businessName || "").toLowerCase().includes(q) ||
          (a.product?.name || "").toLowerCase().includes(q) ||
          (a.requestedBy || "").toLowerCase().includes(q)
        );
      })
      .slice(0, 8)
      .map((a) => ({
        id: a.id,
        dealer: a.dealer?.businessName || a.dealerId,
        product: a.product?.name || a.productId,
        newPrice: `₹ ${parseFloat(a.newPrice || 0).toFixed(2)}`,
        requestedBy: a.requestedBy || "—",
        requestedAt: new Date(a.createdAt).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        status:
          a.status.charAt(0).toUpperCase() + a.status.slice(1).toLowerCase(),
        actions: (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => handlePricingAction(a.id, "approve")}
              style={{
                background: "#10b981",
                color: "white",
                border: "none",
                padding: "4px 8px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Approve
            </button>
            <button
              onClick={() => handlePricingAction(a.id, "reject")}
              style={{
                background: "#ef4444",
                color: "white",
                border: "none",
                padding: "4px 8px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Reject
            </button>
            <button
              onClick={() => handlePricingAction(a.id, "forward")}
              style={{
                background: "#3b82f6",
                color: "white",
                border: "none",
                padding: "4px 8px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Forward
            </button>
          </div>
        ),
      }))}
    emptyMessage="No pending pricing requests"
/>
</Card>


        </div>

        {/* RIGHT COLUMN */}
        <aside className="right-col">
          <div className="side-kpis">
            <div className="mini-kpi"><div className="mini-kpi-title">Total Outstanding</div><div className="mini-kpi-value">₹ {summary.totalOutstanding || 0}</div></div>
            <div className="mini-kpi"><div className="mini-kpi-title">Dealers Managed</div><div className="mini-kpi-value">{summary.totalDealers || 0}</div></div>
            <div className="mini-kpi"><div className="mini-kpi-title">Pending Docs</div><div className="mini-kpi-value">{summary.pendingDocuments || 0}</div></div>
            <div className="mini-kpi"><div className="mini-kpi-title">Pending Pricing</div><div className="mini-kpi-value">{summary.pendingPricing || 0}</div></div>
          </div>

          <Card title="Active Campaigns" className="side-card" style={{ marginTop: "1rem" }}>
            <div style={{ maxHeight: 220, overflowY: "auto" }}>
              {campaigns.length > 0 ? (
                campaigns.slice(0, 6).map((c) => (
                  <div key={c.id} className="campaign-preview" onClick={() => navigate(`/campaigns/${c.id}`)}>
                    <div style={{ fontWeight: 700, color: accent }}>{c.title}</div>
                    <div className="text-muted" style={{ fontSize: 13 }}>{c.description}</div>
                  </div>
                ))
              ) : (
                <p className="text-muted">No campaigns running</p>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
