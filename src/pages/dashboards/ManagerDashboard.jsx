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
} from "recharts";

import "./ManagerDashboard.css";

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({});
  const [dealerPerformance, setDealerPerformance] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [messages, setMessages] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [summaryRes, perfRes, approvalsRes, msgRes, campRes] =
          await Promise.all([
            api.get("/reports/dealer-performance"),
            api.get("/reports/territory"),
            api.get("/reports/pending-approvals"),
            api.get("/messages"),
            api.get("/campaigns"),
          ]);

        setSummary(summaryRes.data || {});
        setDealerPerformance(perfRes.data.report || []);
        setPendingApprovals(approvalsRes.data || []);
        setMessages(msgRes.data.messages || msgRes.data || []);
        setCampaigns(campRes.data.campaigns || campRes.data || []);
      } catch (err) {
        console.error("Manager dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Socket.io realtime hooks
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

  return (
    <div className="manager-dashboard" style={{ color: "var(--text-color)" }}>
      <PageHeader
        title="Regional Manager Dashboard"
        subtitle="Monitor dealers, campaigns, and performance insights in real-time."
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
          <IconPillButton key="reports" icon="📊" label="Reports" onClick={() => navigate("/reports")} />,
          <IconPillButton key="campaigns" icon="📢" label="Campaigns" tone="warning" onClick={() => navigate("/campaigns")} />,
        ]}
      />

      {/* 2-column grid */}
      <div className="dashboard-grid">
        {/* Left Column - Main charts & lists */}
        <div className="left-col">
          <div className="kpi-row">
            <StatCard title="Total Dealers" value={summary.totalDealers || summary.totalInvoices || 0} icon="🏪" />
            <StatCard title="Active Campaigns" value={campaigns.length} icon="📢" />
            <StatCard title="Pending Approvals" value={pendingApprovals.length} icon="🕒" />
            <StatCard title="New Messages" value={messages.length} icon="💬" />
          </div>

          <Card title="Dealer Performance Overview" className="main-chart-card">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={dealerPerformance}>
                <defs>
                  <linearGradient id="mgrColorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.85} />
                    <stop offset="95%" stopColor="rgba(0,0,0,0.15)" stopOpacity={0.15} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="businessName" stroke="var(--text-muted)" interval={0} tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--card-border)",
                    color: "var(--text-color)",
                  }}
                />
                <Legend />
                <Bar dataKey="totalSales" fill="url(#mgrColorSales)" barSize={16} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

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
                  return !q || (a.dealerName || "").toLowerCase().includes(q) || String(a.dealerId || "").includes(q);
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

        {/* Right Column - Compact KPIs, messages, campaigns */}
        <aside className="right-col">
          <div className="side-kpis">
            <div className="mini-kpi"> 
              <div className="mini-kpi-title">Total Sales</div>
              <div className="mini-kpi-value">₹ {summary.totalSales || 0}</div>
            </div>

            <div className="mini-kpi">
              <div className="mini-kpi-title">Active Dealers</div>
              <div className="mini-kpi-value">{summary.activeDealers || summary.totalDealers || 0}</div>
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

          <Card title="Recent Messages" className="side-card" style={{ marginTop: "1rem" }}>
            <div style={{ maxHeight: 220, overflowY: "auto" }}>
              {messages.length > 0 ? (
                <ul className="message-list">
                  {messages.slice(0, 6).map((msg) => (
                    <li key={msg.id}>
                      <div style={{ fontWeight: 600 }}>{msg.dealerName || `Dealer ${msg.senderId}`}</div>
                      <div className="text-muted" style={{ fontSize: 13 }}>{msg.content}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No new messages</p>
              )}
            </div>
          </Card>

          <Card title="Active Campaigns" className="side-card" style={{ marginTop: "1rem" }}>
            <div style={{ maxHeight: 220, overflowY: "auto" }}>
              {campaigns.length > 0 ? (
                campaigns.slice(0, 6).map((c) => (
                  <div key={c.id} className="campaign-preview" onClick={() => navigate(`/campaigns/${c.id}`)}>
                    <div style={{ fontWeight: 700, color: "var(--accent)" }}>{c.title}</div>
                    <div className="text-muted" style={{ fontSize: 13 }}>{c.description}</div>
                  </div>
                ))
              ) : (
                <p className="text-muted">No campaigns running</p>
              )}
            </div>
          </Card>

          <div style={{ marginTop: "1rem", display: "flex", gap: "0.6rem", justifyContent: "center" }}>
            <IconPillButton icon="📊" label="Reports" onClick={() => navigate("/reports")} />
            <IconPillButton icon="💬" label="Messages" tone="success" onClick={() => navigate("/messages")} />
          </div>
        </aside>
      </div>
    </div>
  );
}
