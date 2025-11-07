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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./DashboardLayout.css";

export default function DealerDashboard() {
  const [summary, setSummary] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [trend, setTrend] = useState([]);
  const [inventory, setInventory] = useState([]); // 👀 visible stock data
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const COLORS = ["#3b82f6", "#60a5fa", "#2563eb", "#1d4ed8", "#93c5fd"];

  // ✅ Fetch Dealer Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryRes, invoiceRes, promoRes, docRes, trendRes, inventoryRes] =
          await Promise.all([
            api.get("/reports/dealer-performance"),
            api.get("/invoices"),
            api.get("/campaigns/active"),
            api.get("/documents"),
            api.get("/reports/dealer-performance?trend=true"),
            api.get("/inventory/summary"), // fetch visible stock for dealers
          ]);

        setSummary(summaryRes.data);
        setInvoices(invoiceRes.data.invoices || []);
        setPromotions(promoRes.data || []);
        setDocuments(docRes.data.documents || []);
        setTrend(trendRes.data.trend || []);
        setInventory(inventoryRes.data.inventory || []);
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

    return () => socket.disconnect();
  }, []);

  if (loading)
    return (
      <div className="center text-center" style={{ height: "80vh" }}>
        Loading Dealer Dashboard...
      </div>
    );

  // 🎨 Dealer theme (blue accents)
  const accent = "#3b82f6";

  return (
    <div className="dashboard-container" style={{ background: "#f9fafb" }}>
      {/* HEADER */}
      <header className="dashboard-header">
        <h1>Dealer Dashboard</h1>
        <p>
          Welcome back,{" "}
          <span style={{ color: accent, fontWeight: 600 }}>
            {summary.dealerName || "Dealer"}
          </span>
        </p>
      </header>

      {/* TOOLBAR */}
      <Toolbar
        left={[
          <SearchInput
            key="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoices or documents..."
          />,
        ]}
        right={[
          <IconPillButton key="upload" icon="📤" label="Upload" />,
          <IconPillButton
            key="promo"
            icon="🎉"
            label="Promotions"
            tone="warning"
          />,
        ]}
      />

      {/* KPI SUMMARY */}
      <div className="stat-grid">
        <StatCard
          title="Total Sales"
          value={`₹${summary.totalSales || 0}`}
          icon="💰"
        />
        <StatCard
          title="Invoices"
          value={summary.totalInvoices || 0}
          icon="🧾"
        />
        <StatCard
          title="Outstanding"
          value={`₹${summary.outstanding || 0}`}
          icon="⚠️"
        />
        <StatCard title="Promotions" value={promotions.length} icon="🎉" />
      </div>

      {/* MAIN GRID */}
      <div className="dashboard-grid">
        {/* LEFT COLUMN */}
        <div className="column">
          {/* Sales Trend Chart */}
          <Card
            title="Sales vs Outstanding (Last 6 Months)"
            className="chart-card"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    color: "#111827",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="sales"
                  fill={accent}
                  barSize={12}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="outstanding"
                  fill="#93c5fd"
                  barSize={12}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Inventory Visibility for Dealers */}
          <Card title="Stock Availability">
            {inventory.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={inventory}
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

          {/* Invoices & Docs */}
          <div className="stat-grid">
            <Card title="Recent Invoices">
              {invoices.length ? (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>₹</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.slice(0, 4).map((i) => (
                      <tr key={i.id}>
                        <td>{i.invoiceNumber}</td>
                        <td>
                          {new Date(i.invoiceDate).toLocaleDateString()}
                        </td>
                        <td>{i.totalAmount}</td>
                        <td
                          className={
                            i.status === "Paid"
                              ? "status-approved"
                              : "status-pending"
                          }
                        >
                          {i.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted">No invoices found</p>
              )}
            </Card>

            <Card title="Documents">
              {documents.length ? (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>File</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.slice(0, 4).map((d) => (
                      <tr key={d.id}>
                        <td>{d.fileName}</td>
                        <td
                          className={`status-${d.status || "pending"}`}
                        >
                          {d.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted">No uploaded docs</p>
              )}
            </Card>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="column">
          <Card title="Active Promotions">
            {promotions.length ? (
              promotions.slice(0, 3).map((promo) => (
                <div
                  key={promo.id}
                  style={{
                    padding: "0.4rem 0",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <strong style={{ color: accent }}>{promo.title}</strong>
                  <p className="text-muted">{promo.description}</p>
                  <small className="text-muted">
                    Till {new Date(promo.validTill).toLocaleDateString()}
                  </small>
                </div>
              ))
            ) : (
              <p className="text-muted">No active promotions</p>
            )}
          </Card>

          <div className="quick-actions">
            <IconPillButton icon="📤" label="Upload" />
            <IconPillButton icon="📑" label="Statements" />
            <IconPillButton icon="💬" label="Contact" tone="success" />
          </div>
        </div>
      </div>
    </div>
  );
}
