import React, { useEffect, useState } from "react";
import api, { dashboardAPI } from "../../services/api";
import Chart from "react-apexcharts";

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    kpis: {},
    charts: {
      userGrowth: [],
      docsPerMonth: [],
      
      pricingTrend: [],
      dealerDistribution: [],
    },
    recentActivity: []
  });

  useEffect(() => {
    async function load() {
      try {
        // Use dashboardAPI method
        const data = await dashboardAPI.getSuperAdminDashboard();
        
        console.log("Super Admin Dashboard API Response:", data);
        
        // Handle different response formats
        if (data.kpis && data.charts) {
          // Old format with kpis and charts
          setStats(data);
        } else {
          // New format from /reports/dashboard/super
          // Map actual API response to expected structure
          setStats({
            kpis: {
              totalUsers: data.totalUsers || data.users || 0,
              totalRoles: data.totalRoles || data.roles || 0,
              totalDealers: data.totalDealers || 0,
              totalDocuments: data.totalDocuments || data.documents || 0,
              totalPricingUpdates: data.totalPricingUpdates || data.pricingUpdates || 0,
              pendingDocuments: data.pendingDocuments || 0,
              approvedDocuments: data.approvedDocuments || 0,
              rejectedDocuments: data.rejectedDocuments || 0,
              pendingPricing: data.pendingPricing || 0,
              approvedPricing: data.approvedPricing || 0,
              rejectedPricing: data.rejectedPricing || 0,
              // Also include fields from actual API response
              totalInvoices: data.totalInvoices || 0,
              totalOutstanding: data.totalOutstanding || 0,
              totalApprovalsPending: data.totalApprovalsPending || 0,
              activeCampaigns: data.activeCampaigns || 0,
            },
            charts: {
              userGrowth: data.userGrowth || data.monthlyGrowth || [],
              docsPerMonth: data.docsPerMonth || [],
              pricingTrend: data.pricingTrend || [],
              dealerDistribution: data.dealerDistribution || 
                (data.regions && Array.isArray(data.regions) 
                  ? data.regions.map(r => ({ 
                      region: r.name || r.regionName || r.id, 
                      count: r.dealerCount || r.totalDealers || 0 
                    }))
                  : []),
            },
            recentActivity: data.recentActivity || [],
          });
        }
      } catch (e) {
        console.error("Failed to load dashboard:", e);
        console.error("Error details:", e.response?.data || e.message);
        
        // Fallback to old endpoint if new one fails
        try {
          const fallbackData = await dashboardAPI.getSuperAdminKPI();
          console.log("Fallback API Response:", fallbackData);
          
          if (fallbackData && (fallbackData.kpis || fallbackData.totalDealers)) {
            setStats(fallbackData.kpis ? fallbackData : {
              kpis: {
                totalUsers: fallbackData.totalUsers || 0,
                totalRoles: fallbackData.totalRoles || 0,
                totalDealers: fallbackData.totalDealers || 0,
                totalDocuments: fallbackData.totalDocuments || 0,
                totalPricingUpdates: fallbackData.totalPricingUpdates || 0,
                pendingDocuments: fallbackData.pendingDocuments || 0,
                approvedDocuments: fallbackData.approvedDocuments || 0,
                rejectedDocuments: fallbackData.rejectedDocuments || 0,
                pendingPricing: fallbackData.pendingPricing || 0,
                approvedPricing: fallbackData.approvedPricing || 0,
                rejectedPricing: fallbackData.rejectedPricing || 0,
              },
              charts: {
                userGrowth: fallbackData.userGrowth || [],
                docsPerMonth: fallbackData.docsPerMonth || [],
                pricingTrend: fallbackData.pricingTrend || [],
                dealerDistribution: fallbackData.dealerDistribution || [],
              },
              recentActivity: fallbackData.recentActivity || [],
            });
          } else {
            throw new Error("Fallback also returned invalid data");
          }
        } catch (fallbackError) {
          console.error("Fallback endpoint also failed:", fallbackError);
          // Set empty stats to prevent errors
          setStats({ 
            kpis: {}, 
            charts: { 
              userGrowth: [], 
              docsPerMonth: [], 
              pricingTrend: [], 
              dealerDistribution: [] 
            }, 
            recentActivity: [] 
          });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;

  const k = stats.kpis || {};
  const c = stats.charts || { userGrowth: [], docsPerMonth: [], pricingTrend: [], dealerDistribution: [] };

  // Calculate additional metrics
  const totalSales = k.totalSales || 0;
  const totalOrders = k.totalOrders || 0;
  const totalPayments = k.totalPayments || 0;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  const collectionRate = totalSales > 0 ? ((totalSales - (k.totalOutstanding || 0)) / totalSales * 100) : 0;

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: 0 }}>
          Super Admin Dashboard
        </h1>
        <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.875rem", opacity: 0.7 }}>
          <span>Viewing: All Data</span>
        </div>
      </div>

      {/* KPI GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        {/* Primary KPIs from API */}
        {/* Primary Business KPIs */}
        <KPI title="Total Dealers" value={k.totalDealers || 0} color="#10b981" />
        <KPI title="Total Invoices" value={k.totalInvoices || 0} color="#3b82f6" />
        <KPI title="Total Outstanding" value={k.totalOutstanding ? `₹${(k.totalOutstanding / 10000000).toFixed(1)}Cr` : "₹0"} color="#ef4444" />
        <KPI title="Pending Approvals" value={k.totalApprovalsPending || 0} color="#eab308" />
        <KPI title="Active Campaigns" value={k.activeCampaigns || 0} color="#8b5cf6" />
        <KPI title="Total Sales" value={totalSales ? `₹${(totalSales / 10000000).toFixed(1)}Cr` : "₹0"} color="#10b981" />
        <KPI title="Total Orders" value={totalOrders || 0} color="#3b82f6" />
        <KPI title="Collection Rate" value={`${collectionRate.toFixed(1)}%`} color={collectionRate > 80 ? "#22c55e" : collectionRate > 60 ? "#eab308" : "#ef4444"} />
        <KPI title="Avg Order Value" value={avgOrderValue ? `₹${(avgOrderValue / 1000).toFixed(1)}K` : "₹0"} color="#6366f1" />
        
        {/* User & System KPIs */}
        <KPI title="Total Users" value={k.totalUsers || 0} color="#3b82f6" />
        <KPI title="Total Roles" value={k.totalRoles || 0} color="#8b5cf6" />
        <KPI title="Documents" value={k.totalDocuments || 0} color="#f59e0b" />
        <KPI title="Pricing Updates" value={k.totalPricingUpdates || 0} color="#ef4444" />

        {/* Document Status */}
        <KPI title="Pending Docs" value={k.pendingDocuments || 0} color="#eab308" />
        <KPI title="Approved Docs" value={k.approvedDocuments || 0} color="#22c55e" />
        <KPI title="Rejected Docs" value={k.rejectedDocuments || 0} color="#dc2626" />

        {/* Pricing Status */}
        <KPI title="Pending Pricing" value={k.pendingPricing || 0} color="#eab308" />
        <KPI title="Approved Pricing" value={k.approvedPricing || 0} color="#22c55e" />
        <KPI title="Rejected Pricing" value={k.rejectedPricing || 0} color="#dc2626" />
      </div>

      {/* CHARTS GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          marginBottom: "2rem",
        }}
      >
        {/* User Growth */}
        <ChartCard title="User Growth (Last 12 Months)">
          <Chart
            type="line"
            height={300}
            series={[
              {
                name: "Users",
                data: (c.userGrowth || []).map((x) => x.count || 0),
              },
            ]}
            options={{
              chart: { toolbar: { show: false } },
              colors: ["#3b82f6"],
              xaxis: { categories: (c.userGrowth || []).map((x) => x.month || "") },
            }}
          />
        </ChartCard>

        {/* Dealer Region Distribution */}
   <ChartCard title="Dealer Distribution by Region">
  <Chart
    type="pie"
    height={300}
    series={(c.dealerDistribution || []).map((d) => Number(d.count))}
    options={{
      labels: (c.dealerDistribution || []).map(
        (d) => d.region || "Unknown"
      ),
      colors: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1"],
      legend: { position: "bottom" },
    }}
  />
</ChartCard>





        {/* Documents Per Month */}
        <ChartCard title="Documents Per Month">
          <Chart
            type="bar"
            height={300}
            series={[
              {
                name: "Documents",
                data: (c.docsPerMonth || []).map((x) => x.count || 0),
              },
            ]}
            options={{
              xaxis: { categories: (c.docsPerMonth || []).map((x) => x.month || "") },
              colors: ["#f59e0b"],
            }}
          />
        </ChartCard>

        {/* Pricing Trend */}
        <ChartCard title="Pricing Update Trend">
          <Chart
            type="area"
            height={300}
            series={[
              {
                name: "Pricing Updates",
                data: (c.pricingTrend || []).map((x) => x.count || 0),
              },
            ]}
            options={{
              xaxis: { categories: (c.pricingTrend || []).map((x) => x.month || "") },
              colors: ["#ef4444"],
            }}
          />
        </ChartCard>
      </div>

      {/* Recent Activity */}
      <div
        style={{
          background: "var(--card-bg)",
          padding: "1.5rem",
          borderRadius: "12px",
          border: "1px solid var(--card-border)",
        }}
      >
        <h2 style={{ marginBottom: "1rem", fontWeight: 600 }}>Recent Activity</h2>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {(stats.recentActivity || []).length > 0 ? (
              stats.recentActivity.map((a) => (
                <tr key={a.id || Math.random()} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td>{a.userId || a.user || "N/A"}</td>
                  <td>{a.action || "N/A"}</td>
                  <td>{a.entity || "N/A"}</td>
                  <td>{a.createdAt ? new Date(a.createdAt).toLocaleString() : "N/A"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "1rem", opacity: 0.6 }}>
                  No recent activity
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KPI({ title, value, color }) {
  return (
    <div
      style={{
        padding: "1.5rem",
        borderRadius: "14px",
        background: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        boxShadow: "0px 4px 10px rgba(0,0,0,0.08)",
      }}
    >
      <h3 style={{ opacity: 0.7 }}>{title}</h3>
      <p style={{ fontSize: "2rem", fontWeight: 700, color }}>{value}</p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div
      style={{
        background: "var(--card-bg)",
        padding: "1.5rem",
        borderRadius: "14px",
        border: "1px solid var(--card-border)",
      }}
    >
      <h3 style={{ marginBottom: "1rem" }}>{title}</h3>
      {children}
    </div>
  );
}
