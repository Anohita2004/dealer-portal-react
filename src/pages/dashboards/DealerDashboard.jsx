import React, { useEffect, useState } from "react";
import api from "../../services/api";
import socket from "../../services/socket";
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
import "./ManagerDashboard.css"; // ✅ reuse same CSS

export default function DealerDashboard() {
  const [summary, setSummary] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  // 📊 Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryRes, invoiceRes, promoRes, docRes, trendRes] = await Promise.all([
          api.get("/reports/dealer-performance"),
          api.get("/invoices"),
          api.get("/campaigns/active"),
          api.get("/documents"),
          api.get("/reports/dealer-performance?trend=true"),
        ]);

        setSummary(summaryRes.data);
        setInvoices(invoiceRes.data.invoices || []);
        setPromotions(promoRes.data || []);
        setDocuments(docRes.data.documents || []);
        setTrend(trendRes.data.trend || []);
      } catch (err) {
        console.error("Dealer dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ⚡ Socket events
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) socket.auth = { token };
    socket.connect();

    socket.on("promotion:new", (promo) => {
      toast.success(`🎉 New promotion: ${promo.title}`);
      setPromotions((prev) => [promo, ...prev]);
    });

    socket.on("document:update", (doc) => {
      toast.info(`📄 Document ${doc.status}`);
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, status: doc.status } : d))
      );
    });

    socket.on("notification:update", (notif) => {
      toast.info(`🔔 ${notif.message || "New update"}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading)
    return (
      <div className="loading-screen">
        <div className="loading-text">Loading Dealer Dashboard...</div>
      </div>
    );

  return (
    <div className="manager-dashboard">
      {/* HEADER */}
      <header className="dashboard-header">
        <h1>Dealer Dashboard</h1>
        <p>
          Welcome back,{" "}
          <span style={{ color: "#f97316" }}>{summary.dealerName || "Dealer"}</span> — your latest
          performance overview and business updates.
        </p>
      </header>

      {/* SUMMARY */}
      <div className="summary-grid">
        <SummaryCard title="Total Sales" value={`₹${summary.totalSales || 0}`} color="#f97316" />
        <SummaryCard title="Invoices" value={summary.totalInvoices || 0} color="#ff4fd8" />
        <SummaryCard title="Outstanding" value={`₹${summary.outstanding || 0}`} color="#ffd54f" />
        <SummaryCard title="Active Promotions" value={promotions.length} color="#4fff85" />
      </div>

      {/* CHART */}
      <div className="chart-card">
        <h2>Sales vs Outstanding (Last 6 Months)</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={trend}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.85} />
                <stop offset="95%" stopColor="#3d1e0f" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="outstandingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff4fd8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b003b" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ backgroundColor: "rgba(20,20,30,0.9)", borderRadius: "10px" }} />
            <Legend />
            <Bar dataKey="sales" fill="url(#salesGradient)" barSize={16} radius={[8, 8, 0, 0]} />
            <Bar
              dataKey="outstanding"
              fill="url(#outstandingGradient)"
              barSize={16}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* RECENT INVOICES */}
      <div className="glass-card">
        <h2>Recent Invoices</h2>
        {invoices.length > 0 ? (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 5).map((i) => (
                <tr key={i.id}>
                  <td>{i.invoiceNumber}</td>
                  <td>{new Date(i.invoiceDate).toLocaleDateString()}</td>
                  <td>₹{i.totalAmount}</td>
                  <td className={i.status === "Paid" ? "status-approved" : "status-pending"}>
                    {i.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No invoices found</p>
        )}
      </div>

      {/* DOCUMENTS */}
      <div className="glass-card">
        <h2>Uploaded Documents</h2>
        {documents.length > 0 ? (
          <table className="custom-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Type</th>
                <th>Status</th>
                <th>Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {documents.slice(0, 5).map((d) => (
                <tr key={d.id}>
                  <td>{d.fileName}</td>
                  <td>{d.documentType}</td>
                  <td className={`status-${d.status || "pending"}`}>{d.status}</td>
                  <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No uploaded documents</p>
        )}
      </div>

      {/* PROMOTIONS */}
      <div className="glass-card">
        <h2>Active Promotions</h2>
        {promotions.length > 0 ? (
          <div className="campaign-grid">
            {promotions.slice(0, 3).map((promo) => (
              <div key={promo.id} className="campaign-card">
                <h3>{promo.title}</h3>
                <p>{promo.description}</p>
                <span>Valid till {new Date(promo.validTill).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>No active promotions</p>
        )}
      </div>

      {/* ACTIONS */}
      <div className="quick-actions">
        <button>📤 Upload Document</button>
        <button>📑 View Statements</button>
        <button>💬 Contact Manager</button>
      </div>
    </div>
  );
}

// 📦 Reuse summary card
const SummaryCard = ({ title, value, color }) => (
  <div className="summary-card" style={{ borderColor: color, boxShadow: `0 0 15px ${color}55` }}>
    <h4>{title}</h4>
    <p style={{ color }}>{value}</p>
  </div>
);
