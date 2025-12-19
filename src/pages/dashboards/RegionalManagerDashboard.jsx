import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardAPI } from "../../services/api";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import TimeFilter from "../../components/dashboard/TimeFilter";
import TrendLineChart from "../../components/dashboard/TrendLineChart";
import ComparisonWidget from "../../components/dashboard/ComparisonWidget";
import PerformanceRanking from "../../components/dashboard/PerformanceRanking";
import Chart from "react-apexcharts";
import "./DashboardLayout.css";
import { 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MapPin,
  FileText,
  DollarSign
} from "lucide-react";

export default function RegionalManagerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [stats, setStats] = useState({
    totalDealers: 0,
    pendingApprovals: 0,
    upcomingVisits: 0,
    activeOrders: 0,
    monthlyRevenue: 0,
    approvalRate: 0,
    totalOutstanding: 0,
    pendingDocuments: 0,
  });
  const [previousStats, setPreviousStats] = useState({});
  const [pendingItems, setPendingItems] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [areaRanking, setAreaRanking] = useState([]);
  const [dealerRanking, setDealerRanking] = useState([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = getTimeRangeParams(timeRange);
      const prevParams = getTimeRangeParams(timeRange, true);
      
      const [summaryRes, prevSummaryRes] = await Promise.allSettled([
        dashboardAPI.getManagerDashboard(params).catch(() => ({})),
        dashboardAPI.getManagerDashboard(prevParams).catch(() => ({})),
      ]);

      const summary = summaryRes.status === 'fulfilled' ? summaryRes.value : {};
      const prevSummary = prevSummaryRes.status === 'fulfilled' ? prevSummaryRes.value : {};

      setStats({
        totalDealers: summary.totalDealers || 0,
        pendingApprovals: summary.pendingApprovals || 0,
        upcomingVisits: summary.upcomingVisits || 0,
        activeOrders: summary.activeOrders || 0,
        monthlyRevenue: summary.monthlyRevenue || summary.recentSales || 0,
        approvalRate: summary.approvalRate || 0,
        totalOutstanding: summary.totalOutstanding || 0,
        pendingDocuments: summary.pendingDocuments || 0,
      });

      setPreviousStats({
        totalDealers: prevSummary.totalDealers || 0,
        monthlyRevenue: prevSummary.monthlyRevenue || prevSummary.recentSales || 0,
        totalOutstanding: prevSummary.totalOutstanding || 0,
      });

      // Pending workflow items (read-only view for Regional Manager)
      const queueSource =
        summary.pendingItems ||
        summary.pendingOrders ||
        summary.pendingWorkflows;
      const approvals =
        queueSource && Array.isArray(queueSource)
          ? queueSource
          : [];
      setPendingItems(approvals);
      setRecentActivity(summary.recentActivity || []);

      // Format performance data for chart
      const perfData = summary.performanceData || [
        { month: "Jan", revenue: 45000 },
        { month: "Feb", revenue: 52000 },
        { month: "Mar", revenue: 48000 },
        { month: "Apr", revenue: 61000 },
        { month: "May", revenue: 55000 },
        { month: "Jun", revenue: 67000 },
      ];
      setPerformanceData(perfData);

      // Format dealer ranking
      const dealerRankingSource =
        summary.dealerRanking ||
        summary.topDealers ||
        summary.dealerPerformance ||
        [];
      const dealers = Array.isArray(dealerRankingSource) ? dealerRankingSource : [];
      setDealerRanking(
        dealers
          .map((d) => ({
            id: d.id || d.dealerId,
            name: d.businessName || d.dealerName || d.name || "Unknown",
            value: Number(d.totalSales || d.sales || d.revenue || 0),
            change: d.growth || d.change || 0,
          }))
          .sort((a, b) => b.value - a.value)
      );

      // Format area/territory ranking
      const areaSource =
        summary.areaRanking ||
        summary.territoryRanking ||
        summary.territories ||
        summary.areas ||
        [];
      const areas = Array.isArray(areaSource) ? areaSource : [];
      setAreaRanking(
        areas
          .map((a) => ({
            id: a.id || a.areaId || a.territoryId,
            name: a.areaName || a.territoryName || a.name,
            value: Number(a.totalSales || a.sales || a.revenue || 0),
            change: a.growth || a.change || 0,
          }))
          .sort((a, b) => b.value - a.value)
      );
    } catch (error) {
      // 403/404 are expected for optional or not-yet-configured widgets
      if (error?.response?.status !== 403 && error?.response?.status !== 404) {
        console.error("Failed to fetch dashboard data:", error);
      }
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

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div className="spinner">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <PageHeader 
          title="Regional Manager Dashboard" 
          subtitle="Execution-focused view of your assigned dealers, orders, and inventory"
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
          title="Monthly Revenue"
          current={stats.monthlyRevenue || 0}
          previous={previousStats.monthlyRevenue || 0}
          formatValue={(v) => v >= 1000000 ? `₹${(v / 1000000).toFixed(1)}M` : v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v.toLocaleString()}`}
          color="var(--color-success)"
        />
        <ComparisonWidget
          title="Total Dealers"
          current={stats.totalDealers || 0}
          previous={previousStats.totalDealers || 0}
          formatValue={(v) => v.toLocaleString()}
          color="var(--color-primary)"
        />
        <ComparisonWidget
          title="Total Outstanding"
          current={stats.totalOutstanding || 0}
          previous={previousStats.totalOutstanding || 0}
          formatValue={(v) => v >= 1000000 ? `₹${(v / 1000000).toFixed(1)}M` : v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v.toLocaleString()}`}
          color="var(--color-error)"
        />
      </div>

      {/* KPI Cards Grid */}
      <div className="stat-grid" style={{ marginBottom: "2rem" }}>
        <StatCard 
          title="Total Dealers" 
          value={stats.totalDealers}
          icon={<Users size={24} />}
          accent="var(--color-primary)"
        />
        <StatCard 
          title="Pending Orders in Workflow" 
          value={stats.pendingApprovals}
          icon={<Clock size={24} />}
          accent="var(--color-warning)"
          onClick={() => navigate("/orders/approvals")}
        />
        <StatCard 
          title="Upcoming Visits" 
          value={stats.upcomingVisits}
          icon={<MapPin size={24} />}
          accent="var(--color-primary-dark)"
        />
        <StatCard 
          title="Active Orders" 
          value={stats.activeOrders}
          icon={<TrendingUp size={24} />}
          accent="var(--color-success)"
        />
        <StatCard 
          title="Workflow Completion Rate" 
          value={`${stats.approvalRate}%`}
          icon={<CheckCircle size={24} />}
          accent="var(--color-success)"
        />
        <StatCard 
          title="Pending Documents" 
          value={stats.pendingDocuments}
          icon={<FileText size={24} />}
          accent="var(--color-warning)"
        />
      </div>

      {/* TREND AND RANKINGS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "2rem",
          marginBottom: "2rem",
        }}
      >
        <Card title="Regional Performance">
          <TrendLineChart
            data={performanceData.map(d => ({ label: d.month, value: d.revenue }))}
            dataKeys={["value"]}
            colors={["var(--color-primary)"]}
            height={300}
            formatValue={(v) => `₹${(v / 1000).toFixed(0)}K`}
            showArea={true}
          />
        </Card>

        <Card title="Top Areas/Territories">
          <PerformanceRanking
            data={areaRanking}
            nameKey="name"
            valueKey="value"
            changeKey="change"
            formatValue={(v) => `₹${(v / 100000).toFixed(1)}L`}
            showChange={true}
            maxItems={8}
            color="var(--color-primary)"
          />
        </Card>
      </div>

      {/* Main Content Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", 
        gap: "1.5rem",
        marginBottom: "2rem"
      }}>
        {/* Pending Approvals */}
        <Card title="Orders in Workflow" icon={<FileText size={20} />}>
          {pendingItems.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "2rem",
              color: "var(--color-text-secondary)" 
            }}>
              <CheckCircle size={48} style={{ opacity: 0.3, marginBottom: "1rem" }} />
              <p>No orders currently waiting in your workflow</p>
            </div>
          ) : (
            <div style={{ maxHeight: "280px", overflowY: "auto" }}>
              {pendingItems.slice(0, 5).map((item, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: "0.75rem",
                    borderBottom: "1px solid var(--color-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.title || `Order #${item.id}`}</div>
                    <div style={{ 
                      fontSize: "0.85rem", 
                      color: "var(--color-text-secondary)" 
                    }}>
                      {item.dealer || "Unknown"} • {item.type || "Order"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => navigate(`/orders/${item.id}`)}
                      style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "6px",
                        border: "none",
                        background: "var(--color-primary)",
                        color: "var(--color-surface)",
                        cursor: "pointer",
                        fontSize: "0.85rem"
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {pendingItems.length > 5 && (
            <button
              onClick={() => navigate("/orders/approvals")}
              style={{
                width: "100%",
                marginTop: "0.75rem",
                padding: "0.5rem",
                background: "transparent",
                border: "1px solid var(--card-border)",
                borderRadius: "6px",
                cursor: "pointer",
                color: "var(--color-text-primary)"
              }}
            >
              View All ({pendingItems.length})
            </button>
          )}
        </Card>

        {/* Top Dealers */}
        <Card title="Top Dealers by Performance" icon={<TrendingUp size={20} />}>
          <PerformanceRanking
            data={dealerRanking}
            nameKey="name"
            valueKey="value"
            changeKey="change"
            formatValue={(v) => `₹${(v / 100000).toFixed(1)}L`}
            showChange={true}
            maxItems={6}
            color="var(--color-success)"
          />
        </Card>
      </div>

      {/* Recent Activity */}
      <Card title="Recent Activity" icon={<AlertCircle size={20} />}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ 
            width: "100%", 
            borderCollapse: "collapse",
            fontSize: "0.9rem"
          }}>
            <thead>
              <tr style={{ 
                borderBottom: "1px solid var(--card-border)",
                textAlign: "left"
              }}>
                <th style={{ padding: "0.75rem" }}>Activity</th>
                <th style={{ padding: "0.75rem" }}>Dealer</th>
                <th style={{ padding: "0.75rem" }}>Status</th>
                <th style={{ padding: "0.75rem" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ 
                    padding: "2rem", 
                    textAlign: "center",
                    color: "var(--color-text-secondary)"
                  }}>
                    No recent activity
                  </td>
                </tr>
              ) : (
                recentActivity.map((activity, idx) => (
                  <tr 
                    key={idx}
                    style={{ borderBottom: "1px solid var(--card-border)" }}
                  >
                    <td style={{ padding: "0.75rem" }}>{activity.action}</td>
                    <td style={{ padding: "0.75rem" }}>{activity.dealer}</td>
                    <td style={{ padding: "0.75rem" }}>
                      <span style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        background: activity.status === "approved" ? "rgba(22, 163, 74, 0.2)" : 
                                  activity.status === "rejected" ? "rgba(220, 38, 38, 0.2)" : "rgba(245, 158, 11, 0.2)",
                        color: activity.status === "approved" ? "var(--color-success)" : 
                              activity.status === "rejected" ? "var(--color-error)" : "var(--color-warning)"
                      }}>
                        {activity.status}
                      </span>
                    </td>
                    <td style={{ 
                      padding: "0.75rem",
                      color: "var(--color-text-secondary)",
                      fontSize: "0.85rem"
                    }}>
                      {new Date(activity.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Actions */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
        marginTop: "1.5rem"
      }}>
        <button
          onClick={() => navigate("/map-view")}
          style={{
            padding: "1rem",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--color-text-primary)",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "var(--shadow-md)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <MapPin size={20} />
          View Territory Map
        </button>
        <button
          onClick={() => navigate("/orders/approvals")}
          style={{
            padding: "1rem",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--color-text-primary)",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "var(--shadow-md)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <FileText size={20} />
          Track Orders
        </button>
        <button
          onClick={() => navigate("/chat")}
          style={{
            padding: "1rem",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--color-text-primary)",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "var(--shadow-md)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <Users size={20} />
          Team Communication
        </button>
      </div>
    </div>
  );
}
