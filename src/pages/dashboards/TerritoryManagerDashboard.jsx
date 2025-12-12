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
import { Users, FileText, AlertCircle, TrendingUp, MapPin, CheckCircle } from "lucide-react";

export default function TerritoryManagerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [summary, setSummary] = useState({
    dealers: 0,
    approvals: 0,
    totalSales: 0,
    totalOutstanding: 0,
    pendingDocuments: 0,
    pendingPricing: 0,
    activeOrders: 0,
  });
  const [previousSummary, setPreviousSummary] = useState({});
  const [dealers, setDealers] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [dealerRanking, setDealerRanking] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

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
        trendRes,
        activityRes,
      ] = await Promise.allSettled([
        dashboardAPI.getManagerDashboard(params).catch(() => ({ data: {} })),
        dashboardAPI.getManagerDashboard(prevParams).catch(() => ({ data: {} })),
        managerAPI.getDealers(params).catch(() => ({ data: { dealers: [] } })),
        dashboardAPI.getManagerApprovalQueue(params).catch(() => ({ items: [] })),
        reportAPI.getDealerPerformance(params).catch(() => ({ trend: [] })),
        api.get("/managers/recent-activity", { params }).catch(() => ({ data: [] })),
      ]);

      const summaryData = summaryRes.status === 'fulfilled' ? summaryRes.value : {};
      const prevSummaryData = prevSummaryRes.status === 'fulfilled' ? prevSummaryRes.value : {};

      setSummary({
        dealers: summaryData.totalDealers || summaryData.dealers || 0,
        approvals: summaryData.pendingApprovals || summaryData.approvalsPending || 0,
        totalSales: summaryData.recentSales || summaryData.totalSales || 0,
        totalOutstanding: summaryData.totalOutstanding || 0,
        pendingDocuments: summaryData.pendingDocuments || 0,
        pendingPricing: summaryData.pendingPricing || 0,
        activeOrders: summaryData.activeOrders || 0,
      });

      setPreviousSummary({
        dealers: prevSummaryData.totalDealers || prevSummaryData.dealers || 0,
        totalSales: prevSummaryData.recentSales || prevSummaryData.totalSales || 0,
        totalOutstanding: prevSummaryData.totalOutstanding || 0,
      });

      const dealerList = dealersRes.status === 'fulfilled' ? (dealersRes.value.data?.dealers || dealersRes.value.dealers || []) : [];
      setDealers(dealerList);
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

      setApprovals(approvalsRes.status === 'fulfilled' ? (approvalsRes.value.items || approvalsRes.value || []) : []);

      const trend = trendRes.status === 'fulfilled' ? (trendRes.value.trend || trendRes.value.data || []) : [];
      setSalesTrend(formatTrendData(trend));

      setRecentActivity(activityRes.status === 'fulfilled' ? (activityRes.value.data || activityRes.value || []) : []);
    } catch (err) {
      console.error("Territory Manager Dashboard Load Error:", err);
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
      <div style={{ padding: "1rem", textAlign: "center" }}>
        <p>Loading Territory Manager Dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <PageHeader 
          title="Territory Manager Dashboard" 
          subtitle="Territory overview and approvals"
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
          title="Territory Sales"
          current={summary.totalSales || 0}
          previous={previousSummary.totalSales || 0}
          formatValue={(v) => v >= 1000000 ? `₹${(v / 1000000).toFixed(1)}M` : v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v.toLocaleString()}`}
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
          formatValue={(v) => v >= 1000000 ? `₹${(v / 1000000).toFixed(1)}M` : v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v.toLocaleString()}`}
          color="#ef4444"
        />
      </div>

      {/* KPI STATS */}
      <div className="stat-grid">
        <StatCard title="Dealers" value={summary.dealers} icon={<Users size={20} />} />
        <StatCard title="Pending Approvals" value={summary.approvals} icon={<AlertCircle size={20} />} />
        <StatCard title="Active Orders" value={summary.activeOrders} icon={<TrendingUp size={20} />} />
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

        <Card title="Top Dealers">
          <PerformanceRanking
            data={dealerRanking}
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

      <div className="dashboard-grid">
        <div className="column">
          <Card title="Territory Activity">
            {recentActivity.length > 0 ? (
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {recentActivity.slice(0, 10).map((activity, idx) => (
                  <div
                    key={activity.id || idx}
                    style={{
                      padding: "0.75rem",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      {activity.action || activity.title || "Activity"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                      {activity.dealer || activity.dealerName || "Unknown"} • {activity.date ? new Date(activity.date).toLocaleDateString() : ""}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">Recent activity from dealers in your territory.</p>
            )}
          </Card>

          <Card title="Pending Approvals" style={{ marginTop: "1rem" }}>
            {approvals.length > 0 ? (
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {approvals.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "0.75rem",
                      borderBottom: "1px solid #e5e7eb",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.title || `Order #${item.id}`}</div>
                      <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                        {item.dealer || "Unknown"} • {item.type || "Order"}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/orders/${item.id}`)}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "#3b82f6",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                      }}
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">No pending approvals</p>
            )}
          </Card>
        </div>

        <div className="column">
          <Card title="My Dealers">
            {dealers.length > 0 ? (
              <DataTable
                columns={[
                  { key: "businessName", label: "Dealer Name" },
                  { key: "city", label: "City" },
                  {
                    key: "totalSales",
                    label: "Sales",
                    render: (val) => `₹${Number(val || 0).toLocaleString()}`,
                  },
                  {
                    key: "isActive",
                    label: "Status",
                    render: (val) => (val ? "Active" : "Inactive"),
                  },
                ]}
                rows={dealers.slice(0, 8)}
                emptyMessage="No dealers found"
              />
            ) : (
              <p className="text-muted">No dealers assigned to your territory</p>
            )}
          </Card>

          <Card title="Tasks" style={{ marginTop: "1rem" }}>
            <TaskList compact={true} />
          </Card>
        </div>
      </div>
    </div>
  );
}
