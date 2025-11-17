import React, { useEffect, useState } from "react";
import api from "../../services/api";
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
        const res = await api.get("/admin/reports");
        setStats(res.data);
      } catch (e) {
        console.error("Failed to load dashboard:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;

  const k = stats.kpis;
  const c = stats.charts;

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>
        Super Admin Dashboard
      </h1>

      {/* KPI GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <KPI title="Total Users" value={k.totalUsers} color="#3b82f6" />
        <KPI title="Total Roles" value={k.totalRoles} color="#8b5cf6" />
        <KPI title="Total Dealers" value={k.totalDealers} color="#10b981" />
        <KPI title="Documents" value={k.totalDocuments} color="#f59e0b" />
        <KPI title="Pricing Updates" value={k.totalPricingUpdates} color="#ef4444" />

        <KPI title="Pending Docs" value={k.pendingDocuments} color="#eab308" />
        <KPI title="Approved Docs" value={k.approvedDocuments} color="#22c55e" />
        <KPI title="Rejected Docs" value={k.rejectedDocuments} color="#dc2626" />

        <KPI title="Pending Pricing" value={k.pendingPricing} color="#eab308" />
        <KPI title="Approved Pricing" value={k.approvedPricing} color="#22c55e" />
        <KPI title="Rejected Pricing" value={k.rejectedPricing} color="#dc2626" />
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
                data: c.userGrowth.map((x) => x.count),
              },
            ]}
            options={{
              chart: { toolbar: { show: false } },
              colors: ["#3b82f6"],
              xaxis: { categories: c.userGrowth.map((x) => x.month) },
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
                data: c.docsPerMonth.map((x) => x.count),
              },
            ]}
            options={{
              xaxis: { categories: c.docsPerMonth.map((x) => x.month) },
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
                data: c.pricingTrend.map((x) => x.count),
              },
            ]}
            options={{
              xaxis: { categories: c.pricingTrend.map((x) => x.month) },
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
            {stats.recentActivity.map((a) => (
              <tr key={a.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                <td>{a.userId}</td>
                <td>{a.action}</td>
                <td>{a.entity}</td>
                <td>{new Date(a.createdAt).toLocaleString()}</td>
              </tr>
            ))}
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
