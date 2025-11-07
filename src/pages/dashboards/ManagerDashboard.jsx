// src/pages/dashboards/ManagerDashboard.jsx
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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [summaryRes, perfRes, approvalsRes, msgRes, campRes, invRes] =
          await Promise.all([
            api.get("/reports/dealer-performance"),
            api.get("/reports/territory"),
            api.get("/reports/pending-approvals"),
            api.get("/messages"),
            api.get("/campaigns"),
            api.get("/inventory/summary"),
          ]);

        setSummary(summaryRes.data || {});
        setDealerPerformance(perfRes.data.report || []);
        setPendingApprovals(approvalsRes.data || []);
        setMessages(msgRes.data.messages || msgRes.data || []);
        setCampaigns(campRes.data.campaigns || campRes.data || []);
        setInventory(invRes.data.inventory || []);
      } catch (err) {
        console.error("Manager dashboard load error:", err);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // ✅ Realtime updates
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

  // 🔍 Stock health classification
  const lowStock = inventory.filter((i) => i.available < 20);
  const mediumStock = inventory.filter(
    (i) => i.available >= 20 && i.available < 100
  );
  const highStock = inventory.filter((i) => i.available >= 100);

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
        ]}
      />

      <div className="dashboard-grid">
        {/* LEFT COLUMN */}
        <div className="left-col">
          <div className="kpi-row">
            <StatCard
              title="Total Dealers"
              value={summary.totalDealers || 0}
              icon="🏪"
            />
            <StatCard
              title="Active Campaigns"
              value={campaigns.length}
              icon="📢"
            />
            <StatCard
              title="Pending Approvals"
              value={pendingApprovals.length}
              icon="🕒"
            />
            <StatCard title="New Messages" value={messages.length} icon="💬" />
          </div>

          {/* 🔔 Critical Low Stock Alert */}
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

          {/* 📊 Stock Health Summary */}
          <Card title="Stock Health Overview" style={{ marginBottom: "1rem" }}>
            {inventory.length ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  textAlign: "center",
                }}
              >
                <div>
                  <h3 style={{ color: "#ef4444" }}>{lowStock.length}</h3>
                  <p className="text-muted">Low Stock</p>
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

          {/* 📈 Dealer Performance Chart */}
          <Card
            title="Top 5 Dealers by Sales"
            className="main-chart-card"
            style={{ marginBottom: "1rem" }}
          >
            <ResponsiveContainer width="100%" height={340}>
              <BarChart
                data={dealerPerformance.slice(0, 5)}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="businessName" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalSales" fill={accent} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* 🥧 Inventory Overview */}
          <Card title="Inventory Overview (Top 5 Products)">
            {inventory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={inventory.slice(0, 5)}
                    dataKey="available"
                    nameKey="product"
                    outerRadius={100}
                    fill={accent}
                    label
                  >
                    {inventory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted">No inventory data available</p>
            )}
          </Card>

          {/* 🧾 Pending Approvals Table */}
          <Card title="Pending Approvals" style={{ marginTop: "1rem" }}>
            <DataTable
              columns={[
                { key: "dealer", label: "Dealer" },
                { key: "document", label: "Document" },
                { key: "date", label: "Date" },
                { key: "status", label: "Status" },
              ]}
              rows={pendingApprovals
                .filter((a) => {
                  const q = search.toLowerCase();
                  return (
                    !q ||
                    (a.dealerName || "").toLowerCase().includes(q) ||
                    String(a.dealerId || "").includes(q)
                  );
                })
                .slice(0, 8)
                .map((a) => ({
                  id: a.id || Math.random(),
                  dealer: a.dealerName || a.dealerId,
                  document: a.documentType || "Document",
                  date: new Date(a.createdAt).toLocaleDateString(),
                  status: "Pending",
                }))}
              emptyMessage="No pending approvals"
            />
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <aside className="right-col">
          <div className="side-kpis">
            <div className="mini-kpi">
              <div className="mini-kpi-title">Total Sales</div>
              <div className="mini-kpi-value">
                ₹ {summary.totalSales || 0}
              </div>
            </div>

            <div className="mini-kpi">
              <div className="mini-kpi-title">Active Dealers</div>
              <div className="mini-kpi-value">
                {summary.activeDealers || summary.totalDealers || 0}
              </div>
            </div>

            <div className="mini-kpi">
              <div className="mini-kpi-title">Pending</div>
              <div className="mini-kpi-value">{pendingApprovals.length}</div>
            </div>

            <div className="mini-kpi">
              <div className="mini-kpi-title">Campaigns</div>
              <div className="mini-kpi-value">{campaigns.length}</div>
            </div>
          </div>

          {/* 💬 Recent Messages */}
          <Card
            title="Recent Messages"
            className="side-card"
            style={{ marginTop: "1rem" }}
          >
            <div style={{ maxHeight: 220, overflowY: "auto" }}>
              {messages.length > 0 ? (
                <ul className="message-list">
                  {messages.slice(0, 6).map((msg) => (
                    <li key={msg.id}>
                      <div style={{ fontWeight: 600 }}>
                        {msg.dealerName || `Dealer ${msg.senderId}`}
                      </div>
                      <div className="text-muted" style={{ fontSize: 13 }}>
                        {msg.content}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No new messages</p>
              )}
            </div>
          </Card>

          {/* 📢 Active Campaigns */}
          <Card
            title="Active Campaigns"
            className="side-card"
            style={{ marginTop: "1rem" }}
          >
            <div style={{ maxHeight: 220, overflowY: "auto" }}>
              {campaigns.length > 0 ? (
                campaigns.slice(0, 6).map((c) => (
                  <div
                    key={c.id}
                    className="campaign-preview"
                    onClick={() => navigate(`/campaigns/${c.id}`)}
                  >
                    <div style={{ fontWeight: 700, color: accent }}>
                      {c.title}
                    </div>
                    <div className="text-muted" style={{ fontSize: 13 }}>
                      {c.description}
                    </div>
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
