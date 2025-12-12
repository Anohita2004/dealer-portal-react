// src/pages/dashboards/DealerDashboard.jsx
import React, { useEffect, useState } from "react";
import api, { dashboardAPI } from "../../services/api";
import { getSocket, onEvent, offEvent } from "../../services/socket";
import { toast } from "react-toastify";
import Card from "../../components/Card";
import StatCard from "../../components/StatCard";
import Toolbar from "../../components/Toolbar";
import SearchInput from "../../components/SearchInput";
import IconPillButton from "../../components/IconPillButton";
import PricingRequestModal from "../../components/PricingRequestModal";
import TaskList from "../../components/TaskList";
import { useNavigate } from "react-router-dom";

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
import {
  MessageSquare,
  UploadCloud,
  Gift,
  DollarSign,
  FileText,
  AlertCircle,
  Box,
  Tag,
  Phone,
} from "lucide-react";

import "./DashboardLayout.css";

export default function DealerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [docFilter, setDocFilter] = useState("all");
  const [trend, setTrend] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [pricingStats, setPricingStats] = useState([]);
  const [showPriceModal, setShowPriceModal] = useState(false);

  const COLORS = ["#3b82f6", "#60a5fa", "#2563eb", "#1d4ed8", "#93c5fd"];
  const accent = "#3b82f6";

  // ================= FETCH INITIAL DATA =================
  useEffect(() => {
    let mounted = true;
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
          dashboardAPI.getDealerDashboard().catch(() => ({ data: {} })),
          api.get("/invoices").catch(() => ({ data: { invoices: [] } })),
          api.get("/campaigns/active").catch(() => ({ data: [] })),
          api.get("/documents").catch(() => ({ data: { documents: [] } })),
          api.get("/reports/dealer-performance?trend=true").catch(() => ({ data: { trend: [] } })),
          api.get("/inventory/summary").catch(() => ({ data: { inventory: [] } })),
        ]);

        if (!mounted) return;

        setSummary(summaryRes.data || {});
        setInvoices(invoiceRes.data?.invoices || []);
        setPromotions(promoRes.data || []);
        setDocuments(docRes.data?.documents || []);
        setTrend(trendRes.data?.trend || []);
        setInventory(inventoryRes.data?.inventory || []);

        // Extract pricing distribution from summary (defensive)
        const pb = summaryRes.data?.pricingBreakdown;
        if (pb) {
          setPricingStats([
            { name: "Approved", value: Number(pb.approved || 0) },
            { name: "Pending", value: Number(pb.pending || 0) },
            { name: "Rejected", value: Number(pb.rejected || 0) },
          ]);
        } else {
          setPricingStats([]);
        }
      } catch (err) {
        console.error("Dealer dashboard error:", err);
        toast.error("Failed to load dealer dashboard (see console).");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  // ================= SOCKET REAL-TIME UPDATES =================
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handlePromotion = (promo) => {
      toast.success(`New promotion: ${promo.title}`);
      setPromotions((prev) => [promo, ...prev]);
    };

    const handleDocumentUpdate = (doc) => {
      toast.info(`Document "${doc.fileName}" ${doc.status}`);
      setDocuments((prev) => {
        const exists = prev.find((d) => d.id === doc.id);
        if (exists) {
          return prev.map((d) => (d.id === doc.id ? { ...d, status: doc.status } : d));
        } else {
          return [doc, ...prev];
        }
      });
    };

    onEvent("promotion:new", handlePromotion);
    onEvent("document:update", handleDocumentUpdate);

    return () => {
      offEvent("promotion:new");
      offEvent("document:update");
      // Don't disconnect socket here as it's shared across the app
    };
  }, []);

  if (loading)
    return (
      <div className="center text-center" style={{ height: "80vh" }}>
        Loading Dealer Dashboard...
      </div>
    );

  // ================= FILTERED DOCUMENTS =================
  const filteredDocs = (documents || []).filter((d) =>
    docFilter === "all" ? true : (d.status || "").toLowerCase() === docFilter.toLowerCase()
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
          <IconPillButton
            key="chat"
            icon={<MessageSquare size={16} />}
            label="Chat with Manager"
            tone="info"
            onClick={() => navigate("/dealer/chat")}
          />,
          <IconPillButton
            key="upload"
            icon={<UploadCloud size={16} />}
            label="Upload"
            onClick={() => navigate("/documents/upload")}
          />,
          <IconPillButton
            key="promo"
            icon={<Gift size={16} />}
            label="Promotions"
            tone="warning"
            onClick={() => navigate("/promotions")}
          />,
          <IconPillButton
            key="pricing"
            icon={<DollarSign size={16} />}
            label="Request Price Change"
            onClick={() => setShowPriceModal(true)}
          />,
        ]}
      />

      {/* KPI SUMMARY */}
      <div className="stat-grid">
        <StatCard
          title="Total Sales"
          value={`₹${Number(summary.totalSales || 0).toLocaleString()}`}
          icon={<DollarSign />}
        />
        <StatCard
          title="Invoices"
          value={Number(summary.totalInvoices || 0)}
          icon={<FileText />}
        />
        <StatCard
          title="Outstanding"
          value={`₹${Number(summary.outstanding || 0).toLocaleString()}`}
          icon={<AlertCircle />}
        />
        <StatCard
          title="Promotions"
          value={promotions?.length || 0}
          icon={<Tag />}
        />
      </div>

      {/* MAIN GRID */}
      <div className="dashboard-grid">
        {/* LEFT COLUMN */}
        <div className="column">
          {/* Sales Trend */}
          <Card title="Sales vs Outstanding (Last 6 Months)" className="chart-card">
            <div style={{ width: "100%", height: 340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      color: "#111827",
                    }}
                    formatter={(value, name) =>
                      name === "sales"
                        ? [`₹${Number(value || 0).toLocaleString()}`, "Sales"]
                        : [`₹${Number(value || 0).toLocaleString()}`, "Outstanding"]
                    }
                  />
                  <Legend />
                  <Bar dataKey="sales" fill={accent} barSize={12} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outstanding" fill="#93c5fd" barSize={12} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Inventory */}
          <Card title="Stock Availability">
            {Array.isArray(inventory) && inventory.length > 0 ? (
              <div style={{ width: "100%", height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inventory}
                      dataKey="available"
                      nameKey="product"
                      outerRadius={90}
                      label
                    >
                      {inventory.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, name) => [v, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted">No inventory data available</p>
            )}
          </Card>

          {/* Invoices */}
          <Card title="Recent Invoices">
            {Array.isArray(invoices) && invoices.length ? (
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
                  {invoices.slice(0, 6).map((i) => (
                    <tr key={i.id}>
                      <td>{i.invoiceNumber}</td>
                      <td>{i.invoiceDate ? new Date(i.invoiceDate).toLocaleDateString() : "-"}</td>
                      <td>{Number(i.totalAmount || 0).toLocaleString()}</td>
                      <td className={i.status === "Paid" ? "status-approved" : "status-pending"}>
                        {i.status || "Unknown"}
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
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.8rem" }}>
              {["all", "pending", "approved", "rejected"].map((status) => (
                <button
                  key={status}
                  onClick={() => setDocFilter(status)}
                  style={{
                    padding: "0.35rem 0.9rem",
                    borderRadius: "6px",
                    border: docFilter === status ? `2px solid ${accent}` : "1px solid #ccc",
                    background: docFilter === status ? "#bfdbfe" : "#fff",
                    cursor: "pointer",
                    fontWeight: docFilter === status ? 600 : 500,
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
                      <td className={`status-${(d.status || "pending").toLowerCase()}`}>
                        {d.status || "pending"}
                      </td>
                      <td>{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "-"}</td>
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
          {/* Pricing Distribution */}
          <Card title="Pricing Request Distribution">
            {Array.isArray(pricingStats) && pricingStats.length ? (
              <div style={{ width: "100%", height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pricingStats} dataKey="value" nameKey="name" outerRadius={90} label>
                      {pricingStats.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [v, "count"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted">No pricing data available.</p>
            )}
          </Card>

          {/* Active Promotions */}
          <Card title="Active Promotions">
            {Array.isArray(promotions) && promotions.length ? (
              promotions.slice(0, 5).map((promo) => (
                <div
                  key={promo.id}
                  style={{
                    padding: "0.45rem 0",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: accent }}>{promo.title}</strong>
                    <small className="text-muted">
                      {promo.validTill ? new Date(promo.validTill).toLocaleDateString() : ""}
                    </small>
                  </div>
                  <p className="text-muted" style={{ margin: "4px 0 0" }}>
                    {promo.description}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted">No active promotions</p>
            )}
          </Card>

          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <IconPillButton icon={<UploadCloud />} label="Upload" />
            <IconPillButton icon={<FileText />} label="Statements" />
            <IconPillButton icon={<Phone />} label="Contact" tone="success" onClick={() => navigate("/support")} />
          </div>
        </div>
      </div>

      <PricingRequestModal open={showPriceModal} onClose={() => setShowPriceModal(false)} />
    </div>
  );
}
