import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardAPI, orderAPI, pricingAPI, reportAPI, managerAPI } from "../../services/api";
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
      
      const [
        summaryRes,
        prevSummaryRes,
        approvalsRes,
        dealersRes,
        areaRes,
      ] = await Promise.allSettled([
        dashboardAPI.getManagerDashboard(params).catch(() => ({})),
        dashboardAPI.getManagerDashboard(prevParams).catch(() => ({})),
        dashboardAPI.getManagerApprovalQueue(params).catch(() => ({ items: [] })),
        managerAPI.getDealers(params).catch(() => ({ data: { dealers: [] } })),
        reportAPI.getTerritoryReport(params).catch(() => ({ data: [] })),
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

      setPendingItems(approvalsRes.status === 'fulfilled' ? (approvalsRes.value.items || []) : []);
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
      const dealers = dealersRes.status === 'fulfilled' ? (dealersRes.value.data?.dealers || dealersRes.value.dealers || []) : [];
      setDealerRanking(
        dealers
          .map((d) => ({
            id: d.id,
            name: d.businessName || d.dealerName || "Unknown",
            value: Number(d.totalSales || d.sales || 0),
            change: d.growth || 0,
          }))
          .sort((a, b) => b.value - a.value)
      );

      // Format area/territory ranking
      const areas = areaRes.status === 'fulfilled' ? (areaRes.value.data || areaRes.value || []) : [];
      setAreaRanking(
        areas
          .map((a) => ({
            id: a.id || a.areaId || a.territoryId,
            name: a.areaName || a.territoryName || a.name,
            value: Number(a.totalSales || a.sales || 0),
            change: a.growth || 0,
          }))
          .sort((a, b) => b.value - a.value)
      );
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
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

  const handleApprovalAction = async (itemId, action) => {
    try {
      await orderAPI.approveOrder(itemId, { action });
      loadData(); // Refresh data
    } catch (error) {
      console.error(`Failed to ${action} item:`, error);
    }
  };

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
          subtitle="Operations and approvals for your region"
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
          color="#10b981"
        />
        <ComparisonWidget
          title="Total Dealers"
          current={stats.totalDealers || 0}
          previous={previousStats.totalDealers || 0}
          formatValue={(v) => v.toLocaleString()}
          color="#3b82f6"
        />
        <ComparisonWidget
          title="Total Outstanding"
          current={stats.totalOutstanding || 0}
          previous={previousStats.totalOutstanding || 0}
          formatValue={(v) => v >= 1000000 ? `₹${(v / 1000000).toFixed(1)}M` : v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v.toLocaleString()}`}
          color="#ef4444"
        />
      </div>

      {/* KPI Cards Grid */}
      <div className="stat-grid" style={{ marginBottom: "2rem" }}>
        <StatCard 
          title="Total Dealers" 
          value={stats.totalDealers}
          icon={<Users size={24} />}
          color="#3b82f6"
        />
        <StatCard 
          title="Pending Approvals" 
          value={stats.pendingApprovals}
          icon={<Clock size={24} />}
          color="#f59e0b"
          onClick={() => navigate("/orders/approvals")}
        />
        <StatCard 
          title="Upcoming Visits" 
          value={stats.upcomingVisits}
          icon={<MapPin size={24} />}
          color="#8b5cf6"
        />
        <StatCard 
          title="Active Orders" 
          value={stats.activeOrders}
          icon={<TrendingUp size={24} />}
          color="#10b981"
        />
        <StatCard 
          title="Approval Rate" 
          value={`${stats.approvalRate}%`}
          icon={<CheckCircle size={24} />}
          color="#22c55e"
        />
        <StatCard 
          title="Pending Documents" 
          value={stats.pendingDocuments}
          icon={<FileText size={24} />}
          color="#f59e0b"
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
            colors={["#3b82f6"]}
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
            color="#3b82f6"
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
        <Card title="Pending Approvals" icon={<FileText size={20} />}>
          {pendingItems.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "2rem",
              color: "var(--text-secondary)" 
            }}>
              <CheckCircle size={48} style={{ opacity: 0.3, marginBottom: "1rem" }} />
              <p>No pending approvals</p>
            </div>
          ) : (
            <div style={{ maxHeight: "280px", overflowY: "auto" }}>
              {pendingItems.slice(0, 5).map((item, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: "0.75rem",
                    borderBottom: "1px solid var(--card-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.title || `Order #${item.id}`}</div>
                    <div style={{ 
                      fontSize: "0.85rem", 
                      color: "var(--text-secondary)" 
                    }}>
                      {item.dealer || "Unknown"} • {item.type || "Order"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => handleApprovalAction(item.id, "approve")}
                      style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "6px",
                        border: "none",
                        background: "#22c55e",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: "0.85rem"
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApprovalAction(item.id, "reject")}
                      style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "6px",
                        border: "none",
                        background: "#ef4444",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: "0.85rem"
                      }}
                    >
                      Reject
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
                color: "var(--text-primary)"
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
            color="#10b981"
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
                    color: "var(--text-secondary)"
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
                        background: activity.status === "approved" ? "#22c55e20" : 
                                  activity.status === "rejected" ? "#ef444420" : "#f59e0b20",
                        color: activity.status === "approved" ? "#22c55e" : 
                              activity.status === "rejected" ? "#ef4444" : "#f59e0b"
                      }}>
                        {activity.status}
                      </span>
                    </td>
                    <td style={{ 
                      padding: "0.75rem",
                      color: "var(--text-secondary)",
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
            border: "1px solid var(--card-border)",
            background: "var(--card-bg)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--text-primary)",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
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
            border: "1px solid var(--card-border)",
            background: "var(--card-bg)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--text-primary)",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <FileText size={20} />
          Review Approvals
        </button>
        <button
          onClick={() => navigate("/chat")}
          style={{
            padding: "1rem",
            borderRadius: "12px",
            border: "1px solid var(--card-border)",
            background: "var(--card-bg)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--text-primary)",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
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
