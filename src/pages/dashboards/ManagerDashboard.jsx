// src/pages/manager/ManagerDashboard.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/api";
import socket from "../../services/socket";
import { useNavigate } from "react-router-dom";
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
      <header className="dashboard-header">
        <h1>Regional Manager Dashboard</h1>
        <p>Monitor dealers, campaigns, and performance insights in real-time.</p>
      </header>

      {/* Summary Cards */}
      <div className="summary-grid">
        <SummaryCard title="Total Dealers" value={summary.totalInvoices || 0} color="#00d8ff" />
        <SummaryCard title="Active Campaigns" value={campaigns.length} color="#ff4fd8" />
        <SummaryCard title="Pending Approvals" value={pendingApprovals.length} color="#ffd54f" />
        <SummaryCard title="New Messages" value={messages.length} color="#4fff85" />
      </div>

      {/* Graph Section */}
      <div className="chart-card">
        <h2>Dealer Performance Overview</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={dealerPerformance}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d8ff" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#003366" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="businessName" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{ backgroundColor: "rgba(20,20,30,0.9)", borderRadius: "10px" }}
            />
            <Legend />
            <Bar dataKey="totalSales" fill="url(#colorSales)" barSize={16} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pending Approvals */}
      <div className="glass-card">
        <h2>Pending Approvals</h2>
        {pendingApprovals.length > 0 ? (
          <table className="custom-table">
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
                <tr key={a.id || Math.random()}>
                  <td>{a.dealerName || a.dealerId}</td>
                  <td>{a.documentType || "Document"}</td>
                  <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td className="status-pending">Pending</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No pending approvals</p>
        )}
      </div>

      {/* Messages + Campaigns */}
      <div className="dual-section">
        <div className="glass-card">
          <h2>Recent Messages</h2>
          {messages.length > 0 ? (
            <ul className="message-list">
              {messages.slice(0, 5).map((msg) => (
                <li key={msg.id}>
                  <strong>{msg.dealerName || `Dealer ${msg.senderId}`}</strong>: {msg.content}
                </li>
              ))}
            </ul>
          ) : (
            <p>No new messages</p>
          )}
        </div>

        <div className="glass-card">
          <h2>Active Campaigns</h2>
          {campaigns.length > 0 ? (
            <div className="campaign-grid">
              {campaigns.slice(0, 3).map((c) => (
                <div key={c.id} className="campaign-card">
                  <h3>{c.title}</h3>
                  <p>{c.description}</p>
                  <span>Valid till {new Date(c.endDate).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>No campaigns running</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="quick-actions">
        <button onClick={() => navigate("/reports")}>📊 Reports</button>
        <button onClick={() => navigate("/messages")}>💬 Messages</button>
        <button onClick={() => navigate("/campaigns")}>📢 Campaigns</button>
      </div>
    </div>
  );
}

const SummaryCard = ({ title, value, color }) => (
  <div className="summary-card" style={{ borderColor: color, boxShadow: `0 0 15px ${color}55` }}>
    <h4>{title}</h4>
    <p style={{ color }}>{value}</p>
  </div>
);
