import React, { useEffect, useState, useCallback } from "react";
import api, { dashboardAPI, invoiceAPI, orderAPI, paymentAPI, campaignAPI, documentAPI, reportAPI } from "../../services/api";
import { getSocket, onEvent, offEvent } from "../../services/socket";
import { toast } from "react-toastify";
import Card from "../../components/Card";
import StatCard from "../../components/StatCard";
import Toolbar from "../../components/Toolbar";
import SearchInput from "../../components/SearchInput";
import IconPillButton from "../../components/IconPillButton";
import PricingRequestModal from "../../components/PricingRequestModal";
import TaskList from "../../components/TaskList";
import TimeFilter from "../../components/dashboard/TimeFilter";
import TrendLineChart from "../../components/dashboard/TrendLineChart";
import ComparisonWidget from "../../components/dashboard/ComparisonWidget";
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
  const [timeRange, setTimeRange] = useState("30d");
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState({});
  const [previousSummary, setPreviousSummary] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [docFilter, setDocFilter] = useState("all");
  const [trend, setTrend] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [pricingStats, setPricingStats] = useState([]);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [duePayments, setDuePayments] = useState([]);

  const COLORS = ["#3b82f6", "#60a5fa", "#2563eb", "#1d4ed8", "#93c5fd"];
  const accent = "#3b82f6";

  const loadData = useCallback(async () => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = getTimeRangeParams(timeRange);
        const prevParams = getTimeRangeParams(timeRange, true);

        const [
          summaryRes,
          prevSummaryRes,
          invoiceRes,
          orderRes,
          paymentRes,
          promoRes,
          docRes,
          trendRes,
          inventoryRes,
          duePaymentsRes,
        ] = await Promise.allSettled([
          dashboardAPI.getDealerDashboard(params).catch(() => ({})),
          dashboardAPI.getDealerDashboard(prevParams).catch(() => ({})),
          invoiceAPI.getInvoices(params).catch(() => ({ data: { invoices: [] } })),
          orderAPI.getMyOrders(params).catch(() => ({ data: [] })),
          paymentAPI.getMyRequests(params).catch(() => ({ data: [] })),
          campaignAPI.getActiveCampaigns().catch(() => ({ data: [] })),
          documentAPI.getDocuments(params).catch(() => ({ data: { documents: [] } })),
          reportAPI.getDealerPerformance({ ...params, trend: true }).catch(() => ({ trend: [] })),
          api.get("/inventory/summary").catch(() => ({ data: { inventory: [] } })),
          api.get("/payments/due").catch(() => ({ data: [] })),
        ]);

        if (!mounted) return;

        const summary = summaryRes.status === 'fulfilled' ? summaryRes.value : {};
        const prevSummary = prevSummaryRes.status === 'fulfilled' ? prevSummaryRes.value : {};
        
        setSummary(summary || {});
        setPreviousSummary(prevSummary || {});
        setInvoices(invoiceRes.status === 'fulfilled' ? (invoiceRes.value.data?.invoices || invoiceRes.value.invoices || invoiceRes.value || []) : []);
        setOrders(orderRes.status === 'fulfilled' ? (orderRes.value.data || orderRes.value || []) : []);
        setPayments(paymentRes.status === 'fulfilled' ? (paymentRes.value.data || paymentRes.value || []) : []);
        setPromotions(promoRes.status === 'fulfilled' ? (promoRes.value.data || promoRes.value || []) : []);
        setDocuments(docRes.status === 'fulfilled' ? (docRes.value.data?.documents || docRes.value.documents || docRes.value || []) : []);
        setTrend(formatTrendData(trendRes.status === 'fulfilled' ? (trendRes.value.trend || trendRes.value.data?.trend || []) : []));
        setInventory(inventoryRes.status === 'fulfilled' ? (inventoryRes.value.data?.inventory || inventoryRes.value.inventory || inventoryRes.value || []) : []);
        setDuePayments(duePaymentsRes.status === 'fulfilled' ? (duePaymentsRes.value.data || duePaymentsRes.value || []) : []);

        const pb = summary?.pricingBreakdown;
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
  }, [timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function getTimeRangeParams(range, previous = false) {
    const now = new Date();
    let startDate, endDate;

    if (typeof range === 'object' && range.type === 'custom') {
      startDate = range.startDate;
      endDate = range.endDate;
    } else {
      const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : range === '6m' ? 180 : 365;
      endDate = new Date(now);
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days);
    }

    if (previous) {
      const diff = endDate - startDate;
      endDate = new Date(startDate);
      startDate = new Date(startDate.getTime() - diff);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  }

  function formatTrendData(data) {
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      label: item.month || item.label || item.date || "",
      value: item.sales || item.totalSales || 0,
      outstanding: item.outstanding || 0,
      orders: item.orders || 0,
    }));
  }

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
    };
  }, []);

  if (loading)
    return (
      <div className="center text-center" style={{ height: "80vh" }}>
        Loading Dealer Dashboard...
      </div>
    );

  const filteredDocs = (documents || []).filter((d) =>
    docFilter === "all" ? true : (d.status || "").toLowerCase() === docFilter.toLowerCase()
  );

  return (
    <div className="dashboard-container" style={{ background: "#f9fafb" }}>
      <header className="dashboard-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1>Dealer Dashboard</h1>
            <p>
              Welcome back,{" "}
              <span style={{ color: accent, fontWeight: 600 }}>
                {summary.dealerName || "Dealer"}
              </span>
            </p>
          </div>
          <TimeFilter value={timeRange} onChange={setTimeRange} />
        </div>
      </header>

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

      {/* COMPARISON WIDGETS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <ComparisonWidget
          title="Total Sales"
          current={summary.totalSales || 0}
          previous={previousSummary.totalSales || 0}
          formatValue={(v) => `₹${Number(v || 0).toLocaleString()}`}
          color="#10b981"
        />
        <ComparisonWidget
          title="Outstanding"
          current={summary.outstanding || 0}
          previous={previousSummary.outstanding || 0}
          formatValue={(v) => `₹${Number(v || 0).toLocaleString()}`}
          color="#ef4444"
        />
        <ComparisonWidget
          title="Total Orders"
          current={orders.length || 0}
          previous={0}
          formatValue={(v) => v.toLocaleString()}
          color="#3b82f6"
        />
        <ComparisonWidget
          title="Total Invoices"
          current={summary.totalInvoices || invoices.length || 0}
          previous={previousSummary.totalInvoices || 0}
          formatValue={(v) => v.toLocaleString()}
          color="#6366f1"
        />
      </div>

      {/* KPI SUMMARY */}
      <div className="stat-grid">
        <StatCard
          title="Due Payments"
          value={duePayments.length || 0}
          icon={<AlertCircle />}
          onClick={() => navigate("/payments/due")}
          style={{ cursor: "pointer" }}
        />
        <StatCard
          title="Pending Orders"
          value={orders.filter((o) => o.status === "pending").length || 0}
          icon={<Box />}
          onClick={() => navigate("/orders?status=pending")}
          style={{ cursor: "pointer" }}
        />
        <StatCard
          title="Promotions"
          value={promotions?.length || 0}
          icon={<Tag />}
        />
      </div>

      {/* MAIN GRID */}
      <div className="dashboard-grid">
        <div className="column">
          <Card title="Sales vs Outstanding Trend" className="chart-card">
            <TrendLineChart
              data={trend || []}
              dataKeys={["value", "outstanding"]}
              colors={[accent, "#93c5fd"]}
              height={340}
              formatValue={(v) => `₹${Number(v || 0).toLocaleString()}`}
            />
          </Card>

          <Card title="Due Payments">
            {duePayments.length > 0 ? (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {duePayments.slice(0, 6).map((p) => (
                    <tr key={p.id}>
                      <td>{p.invoiceNumber || p.invoiceId}</td>
                      <td>₹{Number(p.amount || 0).toLocaleString()}</td>
                      <td>{p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "-"}</td>
                      <td className={p.isOverdue ? "status-pending" : "status-approved"}>
                        {p.isOverdue ? "Overdue" : "Due Soon"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-muted">No due payments</p>
            )}
          </Card>

          <Card title="Recent Orders">
            {Array.isArray(orders) && orders.length ? (
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
                  {orders.slice(0, 6).map((o) => (
                    <tr key={o.id}>
                      <td>{o.orderNumber || o.id}</td>
                      <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "-"}</td>
                      <td>{Number(o.totalAmount || 0).toLocaleString()}</td>
                      <td className={o.status === "approved" ? "status-approved" : "status-pending"}>
                        {o.status || "Unknown"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-muted">No orders found</p>
            )}
          </Card>

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

        <div className="column">
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
                    <Tooltip formatter={(v, name) => [v, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted">No inventory data available</p>
            )}
          </Card>

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
