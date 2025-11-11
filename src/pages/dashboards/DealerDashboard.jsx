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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [docFilter, setDocFilter] = useState("all"); // all | pending | approved | rejected
  const [trend, setTrend] = useState([]);
  const [inventory, setInventory] = useState([]);

  const COLORS = ["#3b82f6", "#60a5fa", "#2563eb", "#1d4ed8", "#93c5fd"];
  const accent = "#3b82f6";

  // ================= FETCH INITIAL DATA =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          summaryRes,
          invoiceRes,
          promoRes,
          docRes,
          trendRes,
          inventoryRes,
        ] = await Promise.all([
          api.get("/reports/dealer-performance"),
          api.get("/invoices"),
          api.get("/campaigns/active"),
          api.get("/documents"),
          api.get("/reports/dealer-performance?trend=true"),
          api.get("/inventory/summary"),
        ]);

        setSummary(summaryRes.data || {});
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

  // ================= SOCKET REAL-TIME UPDATES =================
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) socket.auth = { token };
    socket.connect();

    socket.on("promotion:new", (promo) => {
      toast.success(`🎉 New promotion: ${promo.title}`);
      setPromotions((prev) => [promo, ...prev]);
    });

    socket.on("document:update", (doc) => {
      toast.info(`📄 Document "${doc.fileName}" ${doc.status}`);
      setDocuments((prev) => {
        const exists = prev.find((d) => d.id === doc.id);
        if (exists) {
          return prev.map((d) => (d.id === doc.id ? { ...d, status: doc.status } : d));
        } else {
          return [doc, ...prev];
        }
      });
    });

    return () => socket.disconnect();
  }, []);

  if (loading)
    return (
      <div className="center text-center" style={{ height: "80vh" }}>
        Loading Dealer Dashboard...
      </div>
    );

  // ================= FILTERED DOCUMENTS =================
  const filteredDocs = documents.filter((d) =>
    docFilter === "all" ? true : d.status === docFilter
  );

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
          <IconPillButton key="promo" icon="🎉" label="Promotions" tone="warning" />,
        ]}
      />

      {/* KPI SUMMARY */}
      <div className="stat-grid">
        <StatCard title="Total Sales" value={`₹${summary.totalSales || 0}`} icon="💰" />
        <StatCard title="Invoices" value={summary.totalInvoices || 0} icon="🧾" />
        <StatCard title="Outstanding" value={`₹${summary.outstanding || 0}`} icon="⚠️" />
        <StatCard title="Promotions" value={promotions.length} icon="🎉" />
      </div>

      {/* MAIN GRID */}
      <div className="dashboard-grid">
        {/* LEFT COLUMN */}
        <div className="column">
          {/* Sales Trend */}
          <Card title="Sales vs Outstanding (Last 6 Months)" className="chart-card">
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
                <Bar dataKey="sales" fill={accent} barSize={12} radius={[4, 4, 0, 0]} />
                <Bar dataKey="outstanding" fill="#93c5fd" barSize={12} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Inventory */}
          <Card title="Stock Availability">
            {inventory.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={inventory} dataKey="available" nameKey="product" outerRadius={100} fill={accent} label>
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

          {/* Invoices */}
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
                      <td>{new Date(i.invoiceDate).toLocaleDateString()}</td>
                      <td>{i.totalAmount}</td>
                      <td className={i.status === "Paid" ? "status-approved" : "status-pending"}>
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

          {/* Documents */}
          <Card title="Documents">
            {/* Filter Buttons */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.8rem" }}>
              {["all", "pending", "approved", "rejected"].map((status) => (
                <button
                  key={status}
                  onClick={() => setDocFilter(status)}
                  style={{
                    padding: "0.3rem 0.8rem",
                    borderRadius: "6px",
                    border: docFilter === status ? "2px solid #3b82f6" : "1px solid #ccc",
                    background: docFilter === status ? "#bfdbfe" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {filteredDocs.length ? (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Status</th>
                    <th>Uploaded At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((d) => (
                    <tr key={d.id}>
                      <td>{d.fileName}</td>
                      <td className={`status-${d.status || "pending"}`}>{d.status}</td>
                      <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-muted">No documents found.</p>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="column">
          <Card title="Active Promotions">
            {promotions.length ? (
              promotions.slice(0, 3).map((promo) => (
                <div key={promo.id} style={{ padding: "0.4rem 0", borderBottom: "1px solid #e5e7eb" }}>
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
