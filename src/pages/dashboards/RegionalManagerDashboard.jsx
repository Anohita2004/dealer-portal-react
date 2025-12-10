import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardAPI, orderAPI, pricingAPI } from "../../services/api";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
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
  const [stats, setStats] = useState({
    totalDealers: 0,
    pendingApprovals: 0,
    upcomingVisits: 0,
    activeOrders: 0,
    monthlyRevenue: 0,
    approvalRate: 0,
  });
  const [pendingItems, setPendingItems] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch manager summary
      const summaryRes = await dashboardAPI.getManagerSummary();
      setStats({
        totalDealers: summaryRes.totalDealers || 0,
        pendingApprovals: summaryRes.pendingApprovals || 0,
        upcomingVisits: summaryRes.upcomingVisits || 0,
        activeOrders: summaryRes.activeOrders || 0,
        monthlyRevenue: summaryRes.monthlyRevenue || 0,
        approvalRate: summaryRes.approvalRate || 0,
      });

      // Fetch pending approvals
      const approvalsRes = await dashboardAPI.getManagerApprovalQueue();
      setPendingItems(approvalsRes.items || []);

      // Fetch performance data for chart
      setPerformanceData(summaryRes.performanceData || [
        { month: "Jan", revenue: 45000 },
        { month: "Feb", revenue: 52000 },
        { month: "Mar", revenue: 48000 },
        { month: "Apr", revenue: 61000 },
        { month: "May", revenue: 55000 },
        { month: "Jun", revenue: 67000 },
      ]);

      setRecentActivity(summaryRes.recentActivity || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // Set fallback data
      setStats({
        totalDealers: 28,
        pendingApprovals: 5,
        upcomingVisits: 2,
        activeOrders: 18,
        monthlyRevenue: 245000,
        approvalRate: 92,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (itemId, action) => {
    try {
      await orderAPI.approveOrder(itemId, { action });
      fetchDashboardData(); // Refresh data
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
      <PageHeader 
        title="Regional Manager Dashboard" 
        subtitle="Operations and approvals for your region"
      />

      {/* KPI Cards Grid */}
      <div className="stat-grid" style={{ marginBottom: "2rem" }}>
        <StatCard 
          title="Total Dealers" 
          value={stats.totalDealers}
          icon={<Users size={24} />}
          trend="+3 this month"
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
          trend="+12% vs last month"
          color="#10b981"
        />
        <StatCard 
          title="Monthly Revenue" 
          value={`₹${(stats.monthlyRevenue / 1000).toFixed(0)}K`}
          icon={<DollarSign size={24} />}
          trend="+8.5%"
          color="#06b6d4"
        />
        <StatCard 
          title="Approval Rate" 
          value={`${stats.approvalRate}%`}
          icon={<CheckCircle size={24} />}
          color="#22c55e"
        />
      </div>

      {/* Main Content Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", 
        gap: "1.5rem",
        marginBottom: "2rem"
      }}>
        {/* Performance Chart */}
        <Card title="Regional Performance" icon={<TrendingUp size={20} />}>
          <Chart
            type="area"
            height={280}
            series={[{
              name: "Revenue",
              data: performanceData.map(d => d.revenue)
            }]}
            options={{
              chart: {
                toolbar: { show: false },
                sparkline: { enabled: false }
              },
              colors: ["#3b82f6"],
              stroke: { curve: "smooth", width: 3 },
              fill: {
                type: "gradient",
                gradient: {
                  shadeIntensity: 1,
                  opacityFrom: 0.5,
                  opacityTo: 0.1,
                }
              },
              xaxis: {
                categories: performanceData.map(d => d.month),
                labels: { style: { colors: "#94a3b8" } }
              },
              yaxis: {
                labels: { 
                  style: { colors: "#94a3b8" },
                  formatter: (val) => `₹${(val / 1000).toFixed(0)}K`
                }
              },
              tooltip: {
                theme: "dark",
                y: {
                  formatter: (val) => `₹${val.toLocaleString()}`
                }
              },
              grid: {
                borderColor: "rgba(148, 163, 184, 0.1)"
              }
            }}
          />
        </Card>

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
