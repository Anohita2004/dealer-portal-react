// src/pages/reports/reportTypes/RegionalSalesSummary.jsx
import React, { useEffect } from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import KPISection from "./KPISection";
import ChartsBlock from "./ChartsBlock";
import DealerTable from "./DealerTable";

const COLORS = ["#F97316", "#0d9488", "#6366f1", "#dc2626", "#f59e0b", "#22d3ee"];

export default function RegionalSalesSummary({ data, loading, error, fetchReport, filters }) {
  useEffect(() => {
    // fetch automatically if no data
    if (!data) fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return null;

  // Handle different response formats
  const kpis = data.kpis || data.summary || {};
  const dealerSalesChart = data.dealerSalesChart || data.dealerSales || data.dealers || [];
  const territoryContributionChart = data.territoryContributionChart || data.territories || data.territoryBreakdown || [];
  const productMixChart = data.productMixChart || data.products || data.productBreakdown || [];
  const table = data.table || data.dealers || data.data || [];
  const highlights = data.highlights || {};
  
  // Transform data if needed
  const transformedTerritoryChart = Array.isArray(territoryContributionChart)
    ? territoryContributionChart.map(item => ({
        name: item.name || item.territory || item.territoryName || "Unknown",
        value: Number(item.value || item.sales || item.totalSales || 0)
      }))
    : [];
    
  const transformedProductChart = Array.isArray(productMixChart)
    ? productMixChart.map(item => ({
        name: item.name || item.product || item.productGroup || "Unknown",
        value: Number(item.value || item.sales || item.totalSales || 0)
      }))
    : [];

  return (
    <Box mt={3}>
      <KPISection
        items={[
          { title: "Total Sales", value: `₹${Number(kpis.totalSales || 0).toLocaleString()}`, color: "linear-gradient(135deg,#2563eb,#1e3a8a)" },
          { title: "Total Dealers", value: kpis.totalDealers || 0, color: "linear-gradient(135deg,#f97316,#c2410c)" },
          { title: "Top Territory", value: kpis.topTerritory || "-", color: "linear-gradient(135deg,#059669,#065f46)" },
          { title: "Top Product Group", value: kpis.topProductGroup || "-", color: "linear-gradient(135deg,#6366f1,#312e81)" },
        ]}
      />

      <Grid container spacing={2} mt={2}>
        <Grid item xs={12} md={6}>
          <ChartsBlock title="Territory Contribution">
            {transformedTerritoryChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={transformedTerritoryChart} dataKey="value" nameKey="name" outerRadius={90} label>
                    {transformedTerritoryChart.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No territory data available
              </Typography>
            )}
          </ChartsBlock>
        </Grid>

        <Grid item xs={12} md={6}>
          <ChartsBlock title="Product Mix">
            {transformedProductChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transformedProductChart}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {transformedProductChart.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No product data available
              </Typography>
            )}
          </ChartsBlock>
        </Grid>
      </Grid>

      <Box mt={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" mb={2}>
            Highlights
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, background: "#ecfdf5", border: "1px solid #d1fae5" }}>
                <Typography variant="subtitle2" color="#059669">
                  ⭐ Top Performing Dealer
                </Typography>
                <Typography fontWeight={700}>
                  {highlights.topDealer?.dealerName || "-"} — ₹{Number(highlights.topDealer?.totalSales || 0).toLocaleString()}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, background: "#fef2f2", border: "1px solid #fee2e2" }}>
                <Typography variant="subtitle2" color="#dc2626">
                  ⚠ Lowest Performing Dealer
                </Typography>
                <Typography fontWeight={700}>
                  {highlights.bottomDealer?.dealerName || "-"} — ₹{Number(highlights.bottomDealer?.totalSales || 0).toLocaleString()}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <Box mt={3}>
        <DealerTable rows={table} />
      </Box>
    </Box>
  );
}
