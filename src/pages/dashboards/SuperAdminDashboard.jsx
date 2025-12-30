import React, { useEffect, useState, useCallback } from "react";
import api, { dashboardAPI, reportAPI, geoAPI } from "../../services/api";
import Chart from "react-apexcharts";
import TimeFilter from "../../components/dashboard/TimeFilter";
import TrendLineChart from "../../components/dashboard/TrendLineChart";
import ComparisonWidget from "../../components/dashboard/ComparisonWidget";
import PerformanceRanking from "../../components/dashboard/PerformanceRanking";
import Card from "../../components/Card";
import DriverStatusUpdates from "../../components/fleet/DriverStatusUpdates";
import { MapPin, TrendingUp, BarChart3 } from "lucide-react";

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [stats, setStats] = useState({
    kpis: {},
    previousKpis: {},
    charts: {
      userGrowth: [],
      docsPerMonth: [],
      pricingTrend: [],
      dealerDistribution: [],
      regionComparison: [],
      salesTrend: [],
    },
    recentActivity: [],
    regionRanking: [],
    dealerRanking: [],
    heatmapData: [],
  });

  // Helper functions to extract chart data
  function extractSalesTrend(regions, dashboardData) {
    // Try to get from dashboard data first
    if (dashboardData && (dashboardData.salesTrend || dashboardData.monthlySales)) {
      return dashboardData.salesTrend || dashboardData.monthlySales;
    }
    
    // Extract from regional sales data
    if (!regions) return [];
    
    let regionList = [];
    if (Array.isArray(regions)) {
      regionList = regions;
    } else if (regions && typeof regions === 'object') {
      regionList = Array.isArray(regions.regions) ? regions.regions : 
                   Array.isArray(regions.data) ? regions.data : [];
    }
    
    if (!Array.isArray(regionList) || regionList.length === 0) return [];
    
    const monthlySales = {};
    
    regionList.forEach(region => {
      if (region.monthlySales && Array.isArray(region.monthlySales)) {
        region.monthlySales.forEach(item => {
          const month = item.month || item.label || item.date;
          if (!monthlySales[month]) {
            monthlySales[month] = { month, sales: 0, orders: 0 };
          }
          monthlySales[month].sales += item.sales || item.totalSales || 0;
          monthlySales[month].orders += item.orders || 0;
        });
      }
      
      // Also check territories and dealers for monthly data
      if (region.territories && Array.isArray(region.territories)) {
        region.territories.forEach(territory => {
          if (territory.monthlySales && Array.isArray(territory.monthlySales)) {
            territory.monthlySales.forEach(item => {
              const month = item.month || item.label || item.date;
              if (!monthlySales[month]) {
                monthlySales[month] = { month, sales: 0, orders: 0 };
              }
              monthlySales[month].sales += item.sales || item.totalSales || 0;
              monthlySales[month].orders += item.orders || 0;
            });
          }
        });
      }
    });
    
    return Object.values(monthlySales).sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA - dateB;
    });
  }

  function extractUserGrowth(dashboardData, adminSummary) {
    if (dashboardData.userGrowth || dashboardData.monthlyGrowth) {
      return dashboardData.userGrowth || dashboardData.monthlyGrowth;
    }
    
    if (adminSummary && adminSummary.userGrowth) {
      return adminSummary.userGrowth;
    }
    
    // Generate placeholder if no data available
    return [];
  }

  function extractDocsPerMonth(dashboardData, adminSummary) {
    if (dashboardData.docsPerMonth) {
      return dashboardData.docsPerMonth;
    }
    
    if (adminSummary && adminSummary.docsPerMonth) {
      return adminSummary.docsPerMonth;
    }
    
    if (adminSummary && adminSummary.documentsByMonth) {
      return adminSummary.documentsByMonth;
    }
    
    return [];
  }

  function extractPricingTrend(dashboardData, adminSummary) {
    if (dashboardData.pricingTrend) {
      return dashboardData.pricingTrend;
    }
    
    if (adminSummary && adminSummary.pricingTrend) {
      return adminSummary.pricingTrend;
    }
    
    if (adminSummary && adminSummary.pricingUpdatesByMonth) {
      return adminSummary.pricingUpdatesByMonth;
    }
    
    return [];
  }

  function extractDealerDistribution(regions) {
    if (!regions) return [];
    
    let regionList = [];
    if (Array.isArray(regions)) {
      regionList = regions;
    } else if (regions && typeof regions === 'object') {
      regionList = Array.isArray(regions.regions) ? regions.regions : 
                   Array.isArray(regions.data) ? regions.data : [];
    }
    
    if (!Array.isArray(regionList)) return [];
    
    return regionList.map(r => ({
      region: r.name || r.regionName || r.id,
      count: r.dealerCount || r.totalDealers || 0
    }));
  }

  function extractTopDealers(regions) {
    if (!regions) return [];
    
    let regionList = [];
    if (Array.isArray(regions)) {
      regionList = regions;
    } else if (regions && typeof regions === 'object') {
      regionList = Array.isArray(regions.regions) ? regions.regions : 
                   Array.isArray(regions.data) ? regions.data : [];
    }
    
    if (!Array.isArray(regionList)) return [];
    
    const allDealers = [];
    
    regionList.forEach(region => {
      if (region.territories && Array.isArray(region.territories)) {
        region.territories.forEach(territory => {
          if (territory.dealers && Array.isArray(territory.dealers)) {
            allDealers.push(...territory.dealers);
          }
        });
      }
      
      if (region.dealers && Array.isArray(region.dealers)) {
        allDealers.push(...region.dealers);
      }
    });
    
    return allDealers
      .sort((a, b) => (b.totalSales || b.sales || 0) - (a.totalSales || a.sales || 0))
      .slice(0, 10);
  }

  function calculateTotalSales(regions) {
    if (!regions) return 0;
    
    let regionList = [];
    if (Array.isArray(regions)) {
      regionList = regions;
    } else if (regions && typeof regions === 'object') {
      regionList = Array.isArray(regions.regions) ? regions.regions : 
                   Array.isArray(regions.data) ? regions.data : [];
    }
    
    if (!Array.isArray(regionList)) return 0;
    
    return regionList.reduce((sum, r) => sum + (r.totalSales || r.sales || 0), 0);
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = getTimeRangeParams(timeRange);
      
      // Fetch data from available endpoints
      const [dashboardData, regionData, adminSummaryData, heatmapData] = await Promise.allSettled([
        dashboardAPI.getSuperAdminDashboard(params),
        reportAPI.getRegionalSales(params).catch(() => null),
        reportAPI.getAdminSummary(params).catch(() => null),
        geoAPI.getHeatmapData({ granularity: "region", ...params }).catch(() => null),
      ]);

      const data = dashboardData.status === 'fulfilled' ? dashboardData.value : {};
      const regions = regionData.status === 'fulfilled' ? regionData.value : null;
      const adminSummary = adminSummaryData.status === 'fulfilled' ? adminSummaryData.value : null;
      const heatmap = heatmapData.status === 'fulfilled' ? heatmapData.value : [];

      // Calculate previous period for comparison
      const prevParams = getTimeRangeParams(timeRange, true);
      const [prevDashboardData] = await Promise.allSettled([
        dashboardAPI.getSuperAdminDashboard(prevParams).catch(() => ({})),
      ]);
      const prevData = prevDashboardData.status === 'fulfilled' ? prevDashboardData.value : {};

      // Extract sales trend from regional sales data
      let salesTrendData = [];
      try {
        salesTrendData = typeof extractSalesTrend === 'function' 
          ? extractSalesTrend(regions, data) 
          : [];
      } catch (e) {
        console.warn('Error extracting sales trend:', e);
        salesTrendData = [];
      }
      
      // Extract user growth data
      let userGrowthData = [];
      try {
        userGrowthData = typeof extractUserGrowth === 'function'
          ? extractUserGrowth(data, adminSummary)
          : [];
      } catch (e) {
        console.warn('Error extracting user growth:', e);
        userGrowthData = [];
      }
      
      // Extract documents per month
      let docsPerMonthData = [];
      try {
        docsPerMonthData = typeof extractDocsPerMonth === 'function'
          ? extractDocsPerMonth(data, adminSummary)
          : [];
      } catch (e) {
        console.warn('Error extracting docs per month:', e);
        docsPerMonthData = [];
      }
      
      // Extract pricing trend
      let pricingTrendData = [];
      try {
        pricingTrendData = typeof extractPricingTrend === 'function'
          ? extractPricingTrend(data, adminSummary)
          : [];
      } catch (e) {
        console.warn('Error extracting pricing trend:', e);
        pricingTrendData = [];
      }

      // Map current stats - all data should come from the main dashboard endpoint
      const mappedStats = {
        kpis: {
          totalDealers: data.totalDealers || data.dealers || 0,
          totalInvoices: data.totalInvoices || 0,
          totalOutstanding: data.totalOutstanding || 0,
          totalApprovalsPending: data.totalApprovalsPending || data.approvalsPending || 0,
          activeCampaigns: data.activeCampaigns || 0,
          totalUsers: data.totalUsers || data.users || 0,
          totalRoles: data.totalRoles || data.roles || 0,
          totalDocuments: data.totalDocuments || data.documents || 0,
          totalPricingUpdates: data.totalPricingUpdates || data.pricingUpdates || 0,
          totalSales: data.totalSales || (regions && typeof calculateTotalSales === 'function' ? calculateTotalSales(regions) : 0) || 0,
          totalOrders: data.totalOrders || 0,
          totalPayments: data.totalPayments || 0,
        },
        previousKpis: {
          totalDealers: prevData.totalDealers || prevData.dealers || 0,
          totalInvoices: prevData.totalInvoices || 0,
          totalOutstanding: prevData.totalOutstanding || 0,
          totalApprovalsPending: prevData.totalApprovalsPending || prevData.approvalsPending || 0,
          totalSales: prevData.totalSales || 0,
          totalOrders: prevData.totalOrders || 0,
        },
        charts: {
          userGrowth: formatChartData(userGrowthData),
          docsPerMonth: formatChartData(docsPerMonthData),
          pricingTrend: formatChartData(pricingTrendData),
          dealerDistribution: data.dealerDistribution || 
            (data.regions && Array.isArray(data.regions) 
              ? data.regions.map(r => ({ 
                  region: r.name || r.regionName || r.id, 
                  count: r.dealerCount || r.totalDealers || 0 
                }))
              : []) || 
            (regions && typeof extractDealerDistribution === 'function' ? extractDealerDistribution(regions) : []) || [],
          regionComparison: typeof formatRegionComparison === 'function' ? formatRegionComparison(regions) : [],
          salesTrend: formatChartData(salesTrendData),
        },
        recentActivity: data.recentActivity || [],
        regionRanking: typeof formatRegionRanking === 'function' ? formatRegionRanking(regions) : [],
        dealerRanking: formatDealerRanking(
          data.topDealers || 
          (regions && typeof extractTopDealers === 'function' ? extractTopDealers(regions) : [])
        ),
        heatmapData: heatmap || [],
      };
      
      setStats(mappedStats);
    } catch (e) {
      console.error("Failed to load dashboard:", e);
      setStats({ 
        kpis: {}, 
        previousKpis: {},
        charts: { 
          userGrowth: [], 
          docsPerMonth: [], 
          pricingTrend: [], 
          dealerDistribution: [],
          regionComparison: [],
          salesTrend: [],
        }, 
        recentActivity: [],
        regionRanking: [],
        dealerRanking: [],
        heatmapData: [],
      });
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper functions
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

  function formatChartData(data) {
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      label: item.month || item.label || item.date || '',
      value: item.count || item.value || 0,
      sales: item.sales || 0,
      orders: item.orders || 0,
    }));
  }

  function formatRegionComparison(regions) {
    if (!regions) return [];
    
    let regionList = [];
    if (Array.isArray(regions)) {
      regionList = regions;
    } else if (regions && typeof regions === 'object') {
      regionList = Array.isArray(regions.regions) ? regions.regions : 
                   Array.isArray(regions.data) ? regions.data : [];
    }
    
    if (!Array.isArray(regionList)) return [];
    
    return regionList.map(r => ({
      name: r.name || r.regionName || r.id,
      sales: r.totalSales || r.sales || 0,
      dealers: r.dealerCount || r.totalDealers || 0,
      outstanding: r.totalOutstanding || 0,
    }));
  }

  function formatRegionRanking(regions) {
    if (!regions) return [];
    
    let regionList = [];
    if (Array.isArray(regions)) {
      regionList = regions;
    } else if (regions && typeof regions === 'object') {
      regionList = Array.isArray(regions.regions) ? regions.regions : 
                   Array.isArray(regions.data) ? regions.data : [];
    }
    
    if (!Array.isArray(regionList)) return [];
    
    return regionList
      .map(r => ({
        id: r.id,
        name: r.name || r.regionName || r.id,
        value: r.totalSales || r.sales || 0,
        change: r.growth || 0,
      }))
      .sort((a, b) => b.value - a.value);
  }

  function formatDealerRanking(dealers) {
    if (!Array.isArray(dealers)) return [];
    return dealers
      .map(d => ({
        id: d.id,
        name: d.businessName || d.dealerName || d.name,
        value: d.totalSales || d.sales || 0,
        change: d.growth || 0,
      }))
      .sort((a, b) => b.value - a.value);
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const k = stats.kpis || {};
  const pk = stats.previousKpis || {};
  const c = stats.charts || {};

  // Calculate additional metrics
  const totalSales = k.totalSales || 0;
  const totalOrders = k.totalOrders || 0;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  const collectionRate = totalSales > 0 ? ((totalSales - (k.totalOutstanding || 0)) / totalSales * 100) : 0;

  return (
    <div style={{ padding: "2rem" }}>
      {/* HEADER WITH TIME FILTER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: 0, marginBottom: "0.5rem" }}>
            Super Admin Dashboard
          </h1>
          <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.875rem", alignItems: "center" }}>
            <span style={{ padding: "var(--spacing-1) var(--spacing-3)", background: "rgba(220, 38, 38, 0.1)", color: "var(--color-error)", borderRadius: "var(--radius-sm)", fontWeight: "var(--font-weight-semibold)", fontSize: "var(--font-size-xs)" }}>
              GLOBAL SCOPE
            </span>
            <span style={{ opacity: 0.7 }}>Viewing: All Regions, All Roles, All Entities</span>
          </div>
        </div>
        <TimeFilter value={timeRange} onChange={setTimeRange} />
      </div>

      {/* GOVERNANCE ALERTS - System-Wide Risks */}
      {(() => {
        const pendingApprovals = k.totalApprovalsPending || 0;
        const hasRisks = pendingApprovals > 50 || k.totalOutstanding > 10000000;
        
        if (!hasRisks) return null;
        
        return (
          <div style={{ 
            marginBottom: "var(--spacing-6)", 
            padding: "var(--spacing-6)", 
            background: "rgba(245, 158, 11, 0.1)", 
            border: "2px solid var(--color-warning)", 
            borderRadius: "var(--radius-lg)" 
          }}>
            <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: "var(--font-weight-bold)", margin: 0, marginBottom: "var(--spacing-4)", color: "var(--color-warning)" }}>
              ⚠️ Governance Alerts
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {pendingApprovals > 50 && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.25rem" }}>⚠️</span>
                  <span>
                    <strong>Approval Bottleneck:</strong> {pendingApprovals} items pending approval. Review workflow efficiency.
                  </span>
                </div>
              )}
              {k.totalOutstanding > 10000000 && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.25rem" }}>💰</span>
                  <span>
                    <strong>High Outstanding:</strong> ₹{(k.totalOutstanding / 10000000).toFixed(1)}Cr outstanding. Monitor collection.
                  </span>
                </div>
              )}
            </div>
            <div style={{ marginTop: "var(--spacing-4)", fontSize: "var(--font-size-sm)", color: "var(--color-warning)", fontStyle: "italic" }}>
              These are informational governance metrics. Use Reports and Workflows sections for detailed analysis.
            </div>
          </div>
        );
      })()}

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
          current={totalSales}
          previous={pk.totalSales || 0}
          formatValue={(v) => v >= 10000000 ? `₹${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v.toLocaleString()}`}
          color="var(--color-success)"
        />
        <ComparisonWidget
          title="Total Dealers"
          current={k.totalDealers || 0}
          previous={pk.totalDealers || 0}
          formatValue={(v) => v.toLocaleString()}
          color="var(--color-primary)"
        />
        <ComparisonWidget
          title="Total Orders"
          current={totalOrders}
          previous={pk.totalOrders || 0}
          formatValue={(v) => v.toLocaleString()}
          color="var(--color-primary-dark)"
        />
        <ComparisonWidget
          title="Outstanding Amount"
          current={k.totalOutstanding || 0}
          previous={pk.totalOutstanding || 0}
          formatValue={(v) => v >= 10000000 ? `₹${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v.toLocaleString()}`}
          color="var(--color-error)"
        />
      </div>

      {/* KPI GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <KPI title="Total Invoices" value={k.totalInvoices || 0} color="var(--color-primary)" />
        <KPI 
          title="Pending Approvals" 
          value={k.totalApprovalsPending || 0} 
          color={k.totalApprovalsPending > 50 ? "var(--color-error)" : "var(--color-warning)"} 
        />
        <KPI title="Active Campaigns" value={k.activeCampaigns || 0} color="var(--color-primary-dark)" />
        <KPI title="Collection Rate" value={`${collectionRate.toFixed(1)}%`} color={collectionRate > 80 ? "var(--color-success)" : collectionRate > 60 ? "var(--color-warning)" : "var(--color-error)"} />
        <KPI title="Avg Order Value" value={avgOrderValue ? `₹${(avgOrderValue / 1000).toFixed(1)}K` : "₹0"} color="var(--color-primary-dark)" />
        <KPI title="Total Users" value={k.totalUsers || 0} color="var(--color-primary)" />
      </div>

      {/* TREND CHARTS AND RANKINGS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "2rem",
          marginBottom: "2rem",
        }}
      >
        {/* LEFT: TREND CHARTS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <Card title="Sales Trend">
            <TrendLineChart
              data={c.salesTrend || []}
              dataKeys={["value", "orders"]}
              colors={["var(--color-success)", "var(--color-primary)"]}
              height={300}
              formatValue={(v) => `₹${(v / 1000).toFixed(0)}K`}
            />
          </Card>

          <Card title="User Growth Trend">
            <TrendLineChart
              data={c.userGrowth || []}
              dataKeys={["value"]}
              colors={["var(--color-primary)"]}
              height={250}
            />
          </Card>

          <Card title="Region Comparison">
            {c.regionComparison && c.regionComparison.length > 0 ? (
              <div style={{ width: "100%", height: 300 }}>
                <Chart
                  type="bar"
                  height={300}
                  series={[
                    {
                      name: "Sales",
                      data: c.regionComparison.map((r) => r.sales || 0),
                    },
                  ]}
                  options={{
                    chart: { toolbar: { show: false } },
                    colors: ["var(--color-primary)"],
                    xaxis: { categories: c.regionComparison.map((r) => r.name) },
                    dataLabels: { enabled: false },
                  }}
                />
              </div>
            ) : (
              <div style={{ padding: "var(--spacing-6)", textAlign: "center", color: "var(--color-text-secondary)" }}>
                No region comparison data available
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT: RANKINGS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <Card title="Top Regions by Sales">
            <PerformanceRanking
              data={stats.regionRanking || []}
              nameKey="name"
              valueKey="value"
              changeKey="change"
              formatValue={(v) => `₹${(v / 1000000).toFixed(1)}M`}
              showChange={true}
              maxItems={10}
              color="var(--color-primary)"
            />
          </Card>

          <Card title="Top Dealers by Sales">
            <PerformanceRanking
              data={stats.dealerRanking || []}
              nameKey="name"
              valueKey="value"
              changeKey="change"
              formatValue={(v) => `₹${(v / 100000).toFixed(1)}L`}
              showChange={true}
              maxItems={10}
              color="var(--color-success)"
            />
          </Card>
        </div>
      </div>

      {/* HEATMAP AND ADDITIONAL CHARTS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          marginBottom: "2rem",
        }}
      >
        <Card title="Dealer Distribution by Region">
          {c.dealerDistribution && c.dealerDistribution.length > 0 ? (
            <Chart
              type="pie"
              height={300}
              series={c.dealerDistribution.map((d) => Number(d.count || d.value || 0))}
              options={{
                labels: c.dealerDistribution.map((d) => d.region || d.label || "Unknown"),
                colors: ["var(--color-primary)", "var(--color-success)", "var(--color-warning)", "var(--color-error)", "var(--color-primary-dark)"],
                legend: { position: "bottom" },
              }}
            />
          ) : (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
              No dealer distribution data available
            </div>
          )}
        </Card>

        <Card title="Documents Per Month">
          <TrendLineChart
            data={c.docsPerMonth || []}
            dataKeys={["value"]}
            colors={["var(--color-warning)"]}
            height={300}
            showArea={true}
          />
        </Card>
      </div>

      {/* DRIVER STATUS UPDATES */}
      <div style={{ marginBottom: "2rem" }}>
        <DriverStatusUpdates />
      </div>

      {/* RECENT ACTIVITY */}
      <Card title="Recent Activity">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600 }}>User</th>
              <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600 }}>Action</th>
              <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600 }}>Entity</th>
              <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: 600 }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {(stats.recentActivity || []).length > 0 ? (
              stats.recentActivity.slice(0, 10).map((a, idx) => (
                <tr key={a.id || idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "0.75rem" }}>{a.userId || a.user || "N/A"}</td>
                  <td style={{ padding: "0.75rem" }}>{a.action || "N/A"}</td>
                  <td style={{ padding: "0.75rem" }}>{a.entity || "N/A"}</td>
                  <td style={{ padding: "0.75rem" }}>
                    {a.createdAt ? new Date(a.createdAt).toLocaleString() : "N/A"}
                  </td>
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
      </Card>
    </div>
  );
}

function KPI({ title, value, color }) {
  return (
    <div
      style={{
        padding: "1.5rem",
        borderRadius: "12px",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <h3 style={{ fontSize: "0.875rem", opacity: 0.7, marginBottom: "0.5rem", fontWeight: 500 }}>{title}</h3>
      <p style={{ fontSize: "1.875rem", fontWeight: 700, color, margin: 0 }}>{value}</p>
    </div>
  );
}
