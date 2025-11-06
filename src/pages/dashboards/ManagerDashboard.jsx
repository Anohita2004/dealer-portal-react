// src/pages/manager/ManagerDashboard.jsx
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

  // Socket.io
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) socket.auth = { token };
    socket.connect();

    socket.on("document:new", (data) => {
      toast.info(`📄 New document uploaded by Dealer ${data.dealerId}`);
      setPendingApprovals((prev) => [
        { dealerId: data.dealerId, documentType: "New Upload", createdAt: new Date() },
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

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading)
    return (
      <div className="loading-screen">
        <div className="loading-text">Loading Manager Dashboard...</div>
      </div>
    );

  return (
    <div className="manager-dashboard">
      <PageHeader
        title="Regional Manager Dashboard"
        subtitle="Monitor dealers, campaigns, and performance insights in real-time."
      />

      <Toolbar
        right={[
          <IconPillButton key="reports" icon="📊" label="Reports" onClick={() => navigate("/reports")} />,
          <IconPillButton key="campaigns" icon="📢" label="Campaigns" tone="warning" onClick={() => navigate("/campaigns")} />,
        ]}
      >
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search dealers, campaigns..." />
      </Toolbar>

      <div className="summary-grid">
        <StatCard title="Total Dealers" value={summary.totalInvoices || 0} icon="🏪" accent="#f97316" />
        <StatCard title="Active Campaigns" value={campaigns.length} icon="📢" accent="#a78bfa" />
        <StatCard title="Pending Approvals" value={pendingApprovals.length} icon="🕒" accent="#f59e0b" />
        <StatCard title="New Messages" value={messages.length} icon="💬" accent="#22c55e" />
      </div>

      <Card title="Dealer Performance Overview" style={{ marginTop: "1.5rem" }}>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={dealerPerformance}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.85} />
                <stop offset="95%" stopColor="#3d1e0f" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="businessName" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ backgroundColor: "rgba(20,20,30,0.9)", borderRadius: "10px" }} />
            <Legend />
            <Bar dataKey="totalSales" fill="url(#colorSales)" barSize={16} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Pending Approvals" style={{ marginTop: "1.5rem" }}>
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
              return !q || a.dealerName?.toLowerCase().includes(q) || String(a.dealerId || "").includes(q);
            })
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

      <div className="dual-section" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginTop: "1.5rem" }}>
        <Card title="Recent Messages">
          {messages.length > 0 ? (
            <ul className="message-list">
              {messages.slice(0, 5).map((msg) => (
                <li key={msg.id} style={{ margin: "0.5rem 0", borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>
                  <strong>{msg.dealerName || `Dealer ${msg.senderId}`}</strong>: {msg.content}
                </li>
              ))}
            </ul>
          ) : (
            <p>No new messages</p>
          )}
        </Card>

        <Card title="Active Campaigns">
          {campaigns.length > 0 ? (
            <div className="campaign-grid">
              {campaigns.slice(0, 3).map((c) => (
                <div key={c.id} className="campaign-card">
                  <h4>{c.title}</h4>
                  <p>{c.description}</p>
                  <span>Valid till {new Date(c.endDate).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>No campaigns running</p>
          )}
        </Card>
      </div>

      <div className="quick-actions" style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "center" }}>
        <IconPillButton icon="📊" label="Reports" onClick={() => navigate("/reports")} />
        <IconPillButton icon="💬" label="Messages" onClick={() => navigate("/messages")} tone="success" />
        <IconPillButton icon="📢" label="Campaigns" onClick={() => navigate("/campaigns")} tone="warning" />
      </div>
    </div>
  );
}

// (legacy SummaryCard removed in favor of shared StatCard)
