import React, { useEffect, useState } from "react";
import api from "../../services/api";
import socket from "../../services/socket";
import { toast } from "react-toastify";
import Card from "../../components/Card";
import StatCard from "../../components/StatCard";
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
  Legend,
} from "recharts";

export default function DealerDashboard() {
  const [summary, setSummary] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // ✅ Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryRes, invoiceRes, promoRes, docRes, trendRes] =
          await Promise.all([
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

  // ✅ Socket Events
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
    <div style={{ padding: "1.5rem" }}>
      {/* ✅ Header */}
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ marginBottom: ".3rem" }}>Dealer Dashboard</h1>
        <p className="text-muted">
          Welcome back,{" "}
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>
            {summary.dealerName || "Dealer"}
          </span>
          — here is your latest performance overview.
        </p>
      </header>

      {/* ✅ Toolbar */}
      <Toolbar
        left={[
          <SearchInput
            key="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoices, documents..."
          />,
        ]}
        right={[
          <IconPillButton key="upload" icon="📤" label="Upload Document" />,
          <IconPillButton key="promo" icon="🎉" label="Promotions" tone="warning" />,
        ]}
      />

      {/* ✅ 2 Column Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "70% 30%",
          gap: "1.5rem",
          marginTop: "1.5rem",
        }}
      >
        {/* ✅ LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* ✅ Sales Chart */}
          <Card title="Sales vs Outstanding (Last 6 Months)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trend}>
                <defs>
                  <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.2} />
                  </linearGradient>
                </defs>

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
                <Legend />
                <Bar
                  dataKey="sales"
                  fill="url(#sales)"
                  barSize={18}
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="outstanding"
                  fill="var(--text-muted)"
                  barSize={18}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* ✅ Recent Invoices */}
          <Card title="Recent Invoices">
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
                      <td
                        className={
                          i.status === "Paid" ? "status-approved" : "status-pending"
                        }
                      >
                        {i.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No invoices found</p>
            )}
          </Card>

          {/* ✅ Uploaded Documents */}
          <Card title="Uploaded Documents">
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
          </Card>
        </div>

        {/* ✅ RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* ✅ KPIs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <StatCard
              title="Total Sales"
              value={`₹${summary.totalSales || 0}`}
              icon="💰"
            />
            <StatCard title="Invoices" value={summary.totalInvoices || 0} icon="🧾" />
            <StatCard
              title="Outstanding"
              value={`₹${summary.outstanding || 0}`}
              icon="⚠️"
            />
            <StatCard
              title="Promotions"
              value={promotions.length}
              icon="🎉"
            />
          </div>

          {/* ✅ Promotions */}
          <Card title="Active Promotions">
            {promotions.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gap: "1rem",
                }}
              >
                {promotions.slice(0, 3).map((promo) => (
                  <div
                    key={promo.id}
                    style={{
                      padding: ".7rem",
                      borderBottom: "1px solid var(--card-border)",
                    }}
                  >
                    <h4 style={{ color: "var(--accent)" }}>{promo.title}</h4>
                    <p className="text-muted">{promo.description}</p>
                    <small className="text-muted">
                      Valid till {new Date(promo.validTill).toLocaleDateString()}
                    </small>
                  </div>
                ))}
              </div>
            ) : (
              <p>No active promotions</p>
            )}
          </Card>

          {/* ✅ Quick Actions */}
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <IconPillButton icon="📤" label="Upload Document" />
            <IconPillButton icon="📑" label="View Statements" />
            <IconPillButton icon="💬" label="Contact Manager" tone="success" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ nothing below here needs changes
