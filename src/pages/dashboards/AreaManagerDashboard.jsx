import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api, { dashboardAPI, reportAPI, managerAPI } from "../../services/api";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import DataTable from "../../components/DataTable";
import TimeFilter from "../../components/dashboard/TimeFilter";
import TrendLineChart from "../../components/dashboard/TrendLineChart";
import ComparisonWidget from "../../components/dashboard/ComparisonWidget";
import PerformanceRanking from "../../components/dashboard/PerformanceRanking";
import TaskList from "../../components/TaskList";
import "./DashboardLayout.css";
import { MapPin, Users, FileText, TrendingUp, AlertCircle } from "lucide-react";

export default function AreaManagerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [summary, setSummary] = useState({
    dealers: 0,
    territories: 0,
    approvalsPending: 0,
    activeCampaigns: 0,
    totalSales: 0,
    totalOutstanding: 0,
    pendingDocuments: 0,
    pendingPricing: 0,
  });
  const [previousSummary, setPreviousSummary] = useState({});
  const [dealers, setDealers] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [territoryPerformance, setTerritoryPerformance] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [dealerRanking, setDealerRanking] = useState([]);
  const [territoryRanking, setTerritoryRanking] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = getTimeRangeParams(timeRange);
      const prevParams = getTimeRangeParams(timeRange, true);

      const [
        summaryRes,
        prevSummaryRes,
        dealersRes,
        approvalsRes,
        territoryRes,
        trendRes,
      ] = await Promise.allSettled([
        api.get("/areas/dashboard/summary", { params }).catch(() => ({ data: {} })),
        api.get("/areas/dashboard/summary", { params: prevParams }).catch(() => ({ data: {} })),
        api.get("/areas/dashboard/dealers", { params }).catch(() => ({ data: [] })),
        api.get("/areas/dashboard/approvals", { params }).catch(() => ({ data: [] })),
        reportAPI.getTerritoryReport(params).catch(() => ({ data: [] })),
        reportAPI.getDealerPerformance(params).catch(() => ({ trend: [] })),
      ]);

      const summaryData = summaryRes.status === 'fulfilled' ? summaryRes.value.data : {};
      const prevSummaryData = prevSummaryRes.status === 'fulfilled' ? prevSummaryRes.value.data : {};

      setSummary({
        dealers: summaryData.dealers || summaryData.totalDealers || 0,
        territories: summaryData.territories || summaryData.totalTerritories || 0,
        approvalsPending: summaryData.approvalsPending || summaryData.pendingApprovals || 0,
        activeCampaigns: summaryData.activeCampaigns || 0,
        totalSales: summaryData.totalSales || summaryData.sales || 0,
        totalOutstanding: summaryData.totalOutstanding || 0,
        pendingDocuments: summaryData.pendingDocuments || 0,
        pendingPricing: summaryData.pendingPricing || 0,
      });

      setPreviousSummary({
        dealers: prevSummaryData.dealers || prevSummaryData.totalDealers || 0,
        totalSales: prevSummaryData.totalSales || prevSummaryData.sales || 0,
        totalOutstanding: prevSummaryData.totalOutstanding || 0,
      });

      setDealers(dealersRes.status === 'fulfilled' ? dealersRes.value.data : []);
      setApprovals(approvalsRes.status === 'fulfilled' ? approvalsRes.value.data : []);

      const territories = territoryRes.status === 'fulfilled' ? (territoryRes.value.data || territoryRes.value || []) : [];
      setTerritoryPerformance(territories);
      setTerritoryRanking(
        territories.map(t => ({
          id: t.id || t.territoryId,
          name: t.territoryName || t.name,
          value: t.totalSales || t.sales || 0,
          change: t.growth || 0,
        }))
      );

      const trend = trendRes.status === 'fulfilled' ? (trendRes.value.trend || trendRes.value.data || []) : [];
      setSalesTrend(formatTrendData(trend));

      // Format dealer ranking
      const dealerList = dealersRes.status === 'fulfilled' ? (dealersRes.value.data || dealersRes.value || []) : [];
      setDealerRanking(
        dealerList
          .map((d) => ({
            id: d.id,
            name: d.businessName || d.dealerName || "Unknown",
            value: Number(d.totalSales || d.sales || 0),
            change: d.growth || 0,
          }))
          .sort((a, b) => b.value - a.value)
      );
    } catch (err) {
      console.error("Area Dashboard Load Error:", err);
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

  if (loading) {
    return (
      <div style={{ padding: "1.2rem", textAlign: "center" }}>
        <p className="loader">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <PageHeader 
          title="Area Manager Dashboard" 
          subtitle="Live analytics for your assigned area"
        />
        <TimeFilter value={timeRange} onChange={setTimeRange} />
      </div>

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
          title="Area Sales"
          current={summary.totalSales || 0}
          previous={previousSummary.totalSales || 0}
          formatValue={(v) => v >= 10000000 ? `₹${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v.toLocaleString()}`}
          color="#10b981"
        />
        <ComparisonWidget
          title="Total Dealers"
          current={summary.dealers || 0}
          previous={previousSummary.dealers || 0}
          formatValue={(v) => v.toLocaleString()}
          color="#3b82f6"
        />
        <ComparisonWidget
          title="Total Outstanding"
          current={summary.totalOutstanding || 0}
          previous={previousSummary.totalOutstanding || 0}
          formatValue={(v) => v >= 10000000 ? `₹${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v.toLocaleString()}`}
          color="#ef4444"
        />
      </div>

      {/* KPI STATS */}
      <div className="stat-grid">
        <StatCard title="Dealers" value={summary.dealers} icon={<Users size={20} />} />
        <StatCard title="Territories" value={summary.territories} icon={<MapPin size={20} />} />
        <StatCard title="Pending Approvals" value={summary.approvalsPending} icon={<AlertCircle size={20} />} highlight />
        <StatCard title="Active Campaigns" value={summary.activeCampaigns} icon={<TrendingUp size={20} />} />
        <StatCard title="Pending Documents" value={summary.pendingDocuments} icon={<FileText size={20} />} />
        <StatCard title="Pending Pricing" value={summary.pendingPricing} icon={<FileText size={20} />} />
      </div>

      {/* TREND AND RANKINGS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "2rem",
          marginTop: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <Card title="Sales Trend">
          <TrendLineChart
            data={salesTrend}
            dataKeys={["value", "orders"]}
            colors={["#10b981", "#3b82f6"]}
            height={300}
            formatValue={(v) => `₹${(v / 1000).toFixed(0)}K`}
          />
        </Card>

        <Card title="Top Territories">
          <PerformanceRanking
            data={territoryRanking}
            nameKey="name"
            valueKey="value"
            changeKey="change"
            formatValue={(v) => `₹${(v / 100000).toFixed(1)}L`}
            showChange={true}
            maxItems={8}
            color="#3b82f6"
          />
        </Card>
      </div>

      <div className="dashboard-3col">
        {/* PENDING APPROVALS */}
        <Card title="Pending Approvals">
          {approvals.length === 0 ? (
            <p className="text-muted">No approvals pending 🎉</p>
          ) : (
            approvals.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="approval-item"
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <b>{a.dealer?.businessName || a.dealerName || "Unknown"}</b>
                  <span style={{ display: "block", fontSize: "0.875rem", color: "#6b7280" }}>
                    {a.documentType || a.type || "Approval"}
                  </span>
                </div>
                <button
                  className="btn-approve"
                  onClick={() => navigate(`/approvals/${a.id}`)}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#3b82f6",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Review
                </button>
              </div>
            ))
          )}
        </Card>

        {/* TOP DEALERS */}
        <Card title="Top Dealers by Performance">
          <PerformanceRanking
            data={dealerRanking}
            nameKey="name"
            valueKey="value"
            changeKey="change"
            formatValue={(v) => `₹${(v / 100000).toFixed(1)}L`}
            showChange={true}
            maxItems={6}
            color="#10b981"
          />
        </Card>

        {/* TERRITORY PERFORMANCE */}
        <Card title="Territory Performance">
          {territoryPerformance.length > 0 ? (
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {territoryPerformance.slice(0, 5).map((t) => (
                <div
                  key={t.id || t.territoryId}
                  style={{
                    padding: "0.75rem",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{t.territoryName || t.name}</div>
                  <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                    Sales: ₹{Number(t.totalSales || t.sales || 0).toLocaleString()} • Dealers: {t.dealerCount || 0}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No territory data available</p>
          )}
        </Card>
      </div>

      {/* DEALER TABLE */}
      <Card title="Dealers in My Area" style={{ marginTop: "1.5rem" }}>
        <DataTable
          columns={[
            { key: "businessName", label: "Dealer Name" },
            { key: "dealerCode", label: "Code" },
            { key: "phoneNumber", label: "Phone" },
            {
              key: "isActive",
              label: "Active?",
              render: (val) => (val ? "Active" : "Inactive"),
            },
          ]}
          rows={dealers}
          emptyMessage="No dealers found"
        />
      </Card>

      {/* TASKS */}
      <div style={{ marginTop: "1.5rem" }}>
        <Card title="My Pending Tasks">
          <TaskList compact={true} />
        </Card>
      </div>
    </div>
  );
}
