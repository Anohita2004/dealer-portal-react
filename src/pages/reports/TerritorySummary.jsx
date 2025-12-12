// src/pages/reports/TerritorySummary.jsx
import React from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";

const ACCENT = "#F97316";

const KPI_CARD = {
  p: 2,
  borderRadius: "16px",
  color: "white",
  minHeight: 110,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
};

const CHART_CARD = {
  p: 3,
  borderRadius: "16px",
  background: "white",
  boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
};

const colors = ["#F97316", "#0d9488", "#6366f1", "#dc2626", "#16a34a", "#22d3ee"];

export default function TerritorySummary({ data, loading }) {
  if (loading)
    return (
      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Typography>Loading…</Typography>
      </Box>
    );

  if (!data)
    return (
      <Box sx={{ mt: 3 }}>
        <Typography>Select filters and click Generate.</Typography>
      </Box>
    );

 // Safe parsing: prevents undefined.map crashes
  // Handle different response formats
  const kpis = data.kpis || data.summary || {};
  const dealerSalesChart = Array.isArray(data.dealerSalesChart) 
    ? data.dealerSalesChart 
    : Array.isArray(data.dealers)
    ? data.dealers
    : Array.isArray(data.data)
    ? data.data
    : [];
  const territoryContributionChart = Array.isArray(data.territoryContributionChart)
    ? data.territoryContributionChart
    : Array.isArray(data.territories)
    ? data.territories
    : Array.isArray(data.territoryBreakdown)
    ? data.territoryBreakdown
    : [];
  const productMixChart = Array.isArray(data.productMixChart)
    ? data.productMixChart
    : Array.isArray(data.products)
    ? data.products
    : Array.isArray(data.productBreakdown)
    ? data.productBreakdown
    : [];
  const highlights = data.highlights || {};
  
  // Transform data if needed
  const transformedTerritoryChart = territoryContributionChart.map(item => ({
    name: item.name || item.territory || item.territoryName || "Unknown",
    value: Number(item.value || item.sales || item.totalSales || 0)
  }));
  
  const transformedProductChart = productMixChart.map(item => ({
    name: item.name || item.product || item.productGroup || "Unknown",
    value: Number(item.value || item.sales || item.totalSales || 0)
  }));


  // For heatmap: determine max & % values
  const maxSales = transformedTerritoryChart.length > 0 
    ? Math.max(...transformedTerritoryChart.map((t) => t.value), 1)
    : 1;

  const getHeatColor = (value) => {
    const ratio = value / maxSales;
    if (ratio > 0.75) return "#B91C1C"; // deep red
    if (ratio > 0.5) return "#DC2626"; // medium red
    if (ratio > 0.25) return "#F87171"; // light red
    return "#FECACA"; // pale red
  };

  return (
    <Box mt={3}>
      {/* KPI SECTION ----------------------------------------- */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ ...KPI_CARD, background: "linear-gradient(135deg,#2563eb,#1e3a8a)" }}>
            <Typography variant="subtitle2">Total Sales</Typography>
            <Typography variant="h4" fontWeight={700}>
              ₹{Number(kpis?.totalSales || 0).toLocaleString()}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ ...KPI_CARD, background: "linear-gradient(135deg,#F97316,#C2410C)" }}>
            <Typography variant="subtitle2">Total Dealers</Typography>
            <Typography variant="h4" fontWeight={700}>
              {kpis?.totalDealers || 0}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ ...KPI_CARD, background: "linear-gradient(135deg,#059669,#065F46)" }}>
            <Typography variant="subtitle2">Top Territory</Typography>
            <Typography variant="h4" fontWeight={700}>
              {kpis?.topTerritory || "-"}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ ...KPI_CARD, background: "linear-gradient(135deg,#6366f1,#312e81)" }}>
            <Typography variant="subtitle2">Top Product Group</Typography>
            <Typography variant="h4" fontWeight={700}>
              {kpis?.topProductGroup || "-"}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* TERRITORY HEATMAP (Dynamic) ------------------------- */}
      <Box mt={4}>
        <Typography variant="h6" mb={1}>
          Territory Performance Heatmap
        </Typography>
        <Grid container spacing={2}>
          {transformedTerritoryChart.map((t, i) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={i}>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: "16px",
                  textAlign: "center",
                  background: getHeatColor(t.value),
                  boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
                }}
              >
                <Typography sx={{ fontWeight: 700 }}>{t.name}</Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                  ₹{t.value.toLocaleString()}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* CHARTS ------------------------------------------------ */}
      <Grid container spacing={2} mt={3}>
        {/* Territory Contribution Donut */}
        <Grid item xs={12} md={6}>
          <Paper sx={CHART_CARD}>
            <Typography variant="h6" mb={1}>
              Territory Contribution %
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={transformedTerritoryChart} dataKey="value" nameKey="name" label>
                    {transformedTerritoryChart.map((_, i) => (
                      <Cell key={i} fill={colors[i % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Product Mix Bar */}
        <Grid item xs={12} md={6}>
          <Paper sx={CHART_CARD}>
            <Typography variant="h6" mb={1}>
              Product Group Mix
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transformedProductChart}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {transformedProductChart.map((_, i) => (
                      <Cell key={i} fill={colors[i % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* HIGHLIGHTS BLOCK ------------------------------------- */}
      <Box mt={4}>
        <Paper sx={{ p: 3, borderRadius: "16px", background: "white", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
          <Typography variant="h6" mb={2}>
            Highlights
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, borderRadius: "12px", background: "#ecfdf5", border: "1px solid #d1fae5" }}>
                <Typography variant="subtitle2" color="#059669">
                  ⭐ Top Performing Dealer
                </Typography>
                <Typography fontWeight={700}>
                  {highlights?.topDealer?.dealerName || highlights?.topDealer?.name || "-"} — ₹
                  {Number(highlights?.topDealer?.totalSales || 0).toLocaleString()}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, borderRadius: "12px", background: "#fef2f2", border: "1px solid #fee2e2" }}>
                <Typography variant="subtitle2" color="#dc2626">
                  ⚠ Lowest Performing Dealer
                </Typography>
                <Typography fontWeight={700}>
                  {highlights?.bottomDealer?.dealerName || highlights?.bottomDealer?.name || "-"} — ₹
                  {Number(highlights?.bottomDealer?.totalSales || 0).toLocaleString()}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* LEADERBOARD TABLE ----------------------------------- */}
      <Box mt={4}>
        <Paper sx={{ p: 3, borderRadius: "16px", background: "white", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
          <Typography variant="h6" mb={2}>
            Dealer Performance Table
          </Typography>

          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                  <th style={{ padding: "12px" }}>Dealer</th>
                  <th style={{ padding: "12px" }}>Code</th>
                  <th style={{ padding: "12px" }}>Territory</th>
                  <th style={{ padding: "12px" }}>Sales</th>
                </tr>
              </thead>
              <tbody>
                {dealerSalesChart.length > 0 ? (
                  dealerSalesChart.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "12px" }}>{row.dealerName || row.name || row.businessName || "-"}</td>
                      <td style={{ padding: "12px" }}>{row.dealerCode || row.code || "-"}</td>
                      <td style={{ padding: "12px" }}>{row.territory || row.territoryName || "-"}</td>
                      <td style={{ padding: "12px" }}>₹{Number(row.totalSales || row.sales || 0).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ padding: "12px", textAlign: "center" }}>
                      No dealer data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
