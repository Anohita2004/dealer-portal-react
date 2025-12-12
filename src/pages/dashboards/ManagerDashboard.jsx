import React, { useEffect, useState, useCallback } from "react";
import api, { dashboardAPI, reportAPI, managerAPI, pricingAPI, campaignAPI } from "../../services/api";
import { getSocket, onEvent, offEvent } from "../../services/socket";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import DataTable from "../../components/DataTable";
import Toolbar from "../../components/Toolbar";
import SearchInput from "../../components/SearchInput";
import IconPillButton from "../../components/IconPillButton";
import TimeFilter from "../../components/dashboard/TimeFilter";
import TrendLineChart from "../../components/dashboard/TrendLineChart";
import ComparisonWidget from "../../components/dashboard/ComparisonWidget";
import PerformanceRanking from "../../components/dashboard/PerformanceRanking";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  Users,
  Clock,
  FileText,
  BarChart2,
  Activity,
  Megaphone,
  MessageSquare,
  CheckCircle,
  XCircle,
  ArrowRightCircle,
} from "lucide-react";

import "./ManagerDashboard.css";

const COLORS = ["#3b82f6", "#60a5fa", "#2563eb", "#1d4ed8", "#93c5fd"];
const ACCENT = "#3b82f6";

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("30d");
  const [summary, setSummary] = useState({});
  const [previousSummary, setPreviousSummary] = useState({});
  const [dealerPerformance, setDealerPerformance] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [messages, setMessages] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [dealerRanking, setDealerRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const safeNum = (v) => (typeof v === "number" ? v : Number(v) || 0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = getTimeRangeParams(timeRange);
      const prevParams = getTimeRangeParams(timeRange, true);

      const [
        summaryRes,
        prevSummaryRes,
        dealersRes,
        pricingRes,
        msgRes,
        campRes,
        invRes,
        trendRes,
      ] = await Promise.allSettled([
        dashboardAPI.getManagerDashboard(params).catch(() => ({})),
        dashboardAPI.getManagerDashboard(prevParams).catch(() => ({})),
        managerAPI.getDealers(params).catch(() => ({ data: { dealers: [] } })),
        pricingAPI.getPending().catch(() => ({ data: [] })),
        api.get("/messages").catch(() => ({ data: { messages: [] } })),
        campaignAPI.getActiveCampaigns().catch(() => ({ data: [] })),
        api.get("/inventory/summary").catch(() => ({ data: { inventory: [] } })),
        reportAPI.getDealerPerformance(params).catch(() => ({ trend: [] })),
      ]);

      const summary = summaryRes.status === 'fulfilled' ? summaryRes.value : {};
      const prevSummary = prevSummaryRes.status === 'fulfilled' ? prevSummaryRes.value : {};
      
      setSummary(summary || {});
      setPreviousSummary(prevSummary || {});
      
      const dealers = dealersRes.status === 'fulfilled' ? (dealersRes.value.data?.dealers || dealersRes.value.dealers || []) : [];
      setDealerPerformance(dealers);
      
      setPendingApprovals(pricingRes.status === 'fulfilled' ? (pricingRes.value.data?.updates || pricingRes.value.updates || []) : []);
      setMessages(msgRes.status === 'fulfilled' ? (msgRes.value.data?.messages || msgRes.value.messages || msgRes.value || []) : []);
      setCampaigns(campRes.status === 'fulfilled' ? (campRes.value.data?.campaigns || campRes.value.campaigns || campRes.value || []) : []);
      setInventory(invRes.status === 'fulfilled' ? (invRes.value.data?.inventory || invRes.value.inventory || invRes.value || []) : []);

      const trend = trendRes.status === 'fulfilled' ? (trendRes.value.trend || trendRes.value.data || []) : [];
      setSalesTrend(formatTrendData(trend));
      setDealerRanking(
        dealers
          .map((d) => ({
            id: d.id,
            name: d.businessName || d.dealerName || "Unknown",
            value: safeNum(d.totalSales),
            change: d.growth || 0,
          }))
          .sort((a, b) => b.value - a.value)
      );
    } catch (err) {
      console.error("Manager dashboard load error:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
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
      orders: item.orders || 0,
    }));
  }

  // Socket realtime updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onDocumentNew = (data) => {
      toast.info(`New document uploaded by dealer ${data.dealerId || ""}`);
      setPendingApprovals((prev) => [
        {
          id: data.id || Date.now(),
          dealer: data.dealerName || `Dealer ${data.dealerId}`,
          documentType: data.documentType || "Document",
          createdAt: data.createdAt || new Date().toISOString(),
          status: data.status || "pending",
        },
        ...prev,
      ]);
    };

    const onMessageNew = (msg) => {
      toast.success("New message received");
      setMessages((prev) => [msg, ...prev]);
    };

    const onCampaignNew = (campaign) => {
      toast.info(`New campaign: ${campaign.title || "Untitled"}`);
      setCampaigns((prev) => [campaign, ...prev]);
    };

    onEvent("document:new", onDocumentNew);
    onEvent("message:new", onMessageNew);
    onEvent("campaign:new", onCampaignNew);

    return () => {
      offEvent("document:new");
      offEvent("message:new");
      offEvent("campaign:new");
    };
  }, []);

  const lowStock = inventory.filter((i) => safeNum(i.available) < 20);
  const mediumStock = inventory.filter((i) => {
    const a = safeNum(i.available);
    return a >= 20 && a < 100;
  });
  const highStock = inventory.filter((i) => safeNum(i.available) >= 100);

  const handlePricingAction = async (id, action) => {
    try {
      const remarks = window.prompt(`Remarks for ${action.toUpperCase()} (optional):`) || "";
      await api.patch(`/managers/pricing/${id}/forward`, { action, remarks });
      toast.success(`Pricing ${action}ed`);
      setPendingApprovals((prev) => prev.filter((p) => p.id !== id));
      const s = await api.get("/managers/summary").catch(() => ({ data: {} }));
      setSummary(s.data || {});
    } catch (err) {
      console.error("Pricing action failed:", err);
      toast.error("Failed to process pricing action");
    }
  };

  const fmtCurrency = (v) => `₹ ${safeNum(v).toLocaleString()}`;
  const fmtDate = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return iso;
    }
  };

  const pendingPricingRows = (pendingApprovals || [])
    .filter(Boolean)
    .filter((p) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const hay = `${p.dealer?.businessName || p.dealer || ""} ${p.product?.name || p.productId || ""} ${p.requestedBy || ""}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, 12)
    .map((a) => ({
      id: a.id,
      dealer: a.dealer?.businessName || a.dealer || "—",
      product: a.product?.name || a.productId || "—",
      newPrice: fmtCurrency(a.newPrice),
      requestedBy: a.requestedBy || "—",
      requestedAt: fmtDate(a.createdAt),
      status: (a.status || "pending").toString(),
      actions: (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => handlePricingAction(a.id, "approve")}
            className="btn btn-success"
            title="Approve"
          >
            <CheckCircle size={16} />
          </button>
          <button
            onClick={() => handlePricingAction(a.id, "reject")}
            className="btn btn-danger"
            title="Reject"
          >
            <XCircle size={16} />
          </button>
          <button
            onClick={() => handlePricingAction(a.id, "forward")}
            className="btn btn-primary"
            title="Forward to Admin"
          >
            <ArrowRightCircle size={16} />
          </button>
        </div>
      ),
    }));

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-text">Loading Manager Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="manager-dashboard" style={{ color: "var(--text-color)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <PageHeader
          title="Manager Dashboard"
          subtitle="Monitor dealers, campaigns and inventory in one place"
          actions={[
            <IconPillButton
              key="reports"
              icon={<BarChart2 size={16} />}
              label="Reports"
              onClick={() => navigate("/reports")}
            />,
            <IconPillButton
              key="campaigns"
              icon={<Megaphone size={16} />}
              label="Campaigns"
              tone="warning"
              onClick={() => navigate("/campaigns")}
            />,
            <IconPillButton
              key="chat"
              icon={<MessageSquare size={16} />}
              label="Messages"
              tone="info"
              onClick={() => navigate("/manager/chat")}
            />,
          ]}
        />
        <TimeFilter value={timeRange} onChange={setTimeRange} />
      </div>

      <Toolbar
        left={[
          <SearchInput
            key="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dealers, products, requests..."
          />,
        ]}
        right={[
          <div key="quick" style={{ display: "flex", gap: 8 }}>
            <IconPillButton icon={<Users size={16} />} label="My Dealers" onClick={() => navigate("/manager/dealers")} />
          </div>,
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
          title="Recent Sales"
          current={safeNum(summary.recentSales)}
          previous={safeNum(previousSummary.recentSales)}
          formatValue={fmtCurrency}
          color="#10b981"
        />
        <ComparisonWidget
          title="Total Dealers"
          current={summary.totalDealers || 0}
          previous={previousSummary.totalDealers || 0}
          formatValue={(v) => v.toLocaleString()}
          color="#3b82f6"
        />
        <ComparisonWidget
          title="Total Outstanding"
          current={safeNum(summary.totalOutstanding)}
          previous={safeNum(previousSummary.totalOutstanding)}
          formatValue={fmtCurrency}
          color="#ef4444"
        />
      </div>

      <div className="dashboard-grid">
        <div className="left-col">
          <div className="kpi-row">
            <StatCard title="Total Dealers" value={summary.totalDealers || 0} icon={<Users size={20} />} />
            <StatCard title="Pending Pricing" value={summary.pendingPricing || 0} icon={<Activity size={20} />} />
            <StatCard title="Pending Documents" value={summary.pendingDocuments || 0} icon={<FileText size={20} />} />
            <StatCard title="Recent Sales" value={fmtCurrency(summary.recentSales || 0)} icon={<BarChart2 size={20} />} />
          </div>

          {lowStock.length > 0 && (
            <div className="alert-banner" style={{ background: "#fee2e2", color: "#b91c1c" }}>
              <Clock size={16} style={{ marginRight: 8 }} />
              {lowStock.length} products are critically low on stock
            </div>
          )}

          <Card title="Sales Trend" style={{ marginBottom: 16 }}>
            <TrendLineChart
              data={salesTrend}
              dataKeys={["value", "orders"]}
              colors={["#10b981", "#3b82f6"]}
              height={300}
              formatValue={fmtCurrency}
            />
          </Card>

          <Card title="Stock Health Overview" style={{ marginBottom: 16 }}>
            {inventory.length ? (
              <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
                <div>
                  <h3 style={{ color: "#ef4444" }}>{lowStock.length}</h3>
                  <p className="text-muted">Low</p>
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

          <Card title="Top 5 Dealers (Sales)">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart
                data={(dealerPerformance || []).slice(0, 5).map((d) => ({
                  businessName: d.businessName || d.dealerName || "Unknown",
                  totalSales: safeNum(d.totalSales),
                }))}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="businessName" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip formatter={(v) => fmtCurrency(v)} />
                <Legend />
                <Bar dataKey="totalSales" fill={ACCENT} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Pending Pricing Approvals" style={{ marginTop: 16 }}>
            <DataTable
              columns={[
                { key: "dealer", label: "Dealer" },
                { key: "product", label: "Product" },
                { key: "newPrice", label: "Requested Price" },
                { key: "requestedBy", label: "Requested By" },
                { key: "requestedAt", label: "Requested At" },
                { key: "status", label: "Status" },
                { key: "actions", label: "Actions" },
              ]}
              rows={pendingPricingRows}
              emptyMessage="No pending pricing requests"
            />
          </Card>
        </div>

        <aside className="right-col">
          <div className="side-kpis">
            <div className="mini-kpi">
              <div className="mini-kpi-title">Total Outstanding</div>
              <div className="mini-kpi-value">{fmtCurrency(summary.totalOutstanding || 0)}</div>
            </div>
            <div className="mini-kpi">
              <div className="mini-kpi-title">Dealers Managed</div>
              <div className="mini-kpi-value">{summary.totalDealers || 0}</div>
            </div>
            <div className="mini-kpi">
              <div className="mini-kpi-title">Pending Docs</div>
              <div className="mini-kpi-value">{summary.pendingDocuments || 0}</div>
            </div>
            <div className="mini-kpi">
              <div className="mini-kpi-title">Pending Pricing</div>
              <div className="mini-kpi-value">{summary.pendingPricing || 0}</div>
            </div>
          </div>

          <Card title="Top Dealers by Performance" className="side-card" style={{ marginTop: 12 }}>
            <PerformanceRanking
              data={dealerRanking}
              nameKey="name"
              valueKey="value"
              changeKey="change"
              formatValue={fmtCurrency}
              showChange={true}
              maxItems={8}
              color="#3b82f6"
            />
          </Card>

          <Card title="Active Campaigns" className="side-card" style={{ marginTop: 12 }}>
            <div style={{ maxHeight: 220, overflowY: "auto" }}>
              {campaigns.length ? (
                campaigns.slice(0, 6).map((c) => (
                  <div
                    key={c.id || `${c.title}-${Math.random()}`}
                    className="campaign-preview"
                    onClick={() => navigate(`/campaigns/${c.id}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <div style={{ fontWeight: 700, color: ACCENT }}>{c.title || c.campaignName}</div>
                    <div className="text-muted" style={{ fontSize: 13 }}>{c.description}</div>
                  </div>
                ))
              ) : (
                <p className="text-muted">No campaigns running</p>
              )}
            </div>
          </Card>

          <Card title="Recent Messages" className="side-card" style={{ marginTop: 12 }}>
            <div style={{ maxHeight: 220, overflowY: "auto" }}>
              {messages.length ? (
                messages.slice(0, 6).map((m) => (
                  <div key={m.id || Math.random()} style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    <div style={{ fontWeight: 600 }}>{m.fromName || m.username || "Dealer"}</div>
                    <div className="text-muted small">{(m.content || m.text || "").slice(0, 80)}</div>
                    <div className="text-muted small">{fmtDate(m.createdAt || m.timestamp)}</div>
                  </div>
                ))
              ) : (
                <p className="text-muted">No recent messages</p>
              )}
            </div>
          </Card>

          <Card title="Stock Distribution" className="side-card" style={{ marginTop: 12 }}>
            {inventory.length ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={inventory.slice(0, 6).map((it) => ({ name: it.product || it.sku || "Item", value: safeNum(it.available) }))}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={70}
                    innerRadius={30}
                    label
                  >
                    {inventory.slice(0, 6).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v} units`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted">No inventory to show</p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
