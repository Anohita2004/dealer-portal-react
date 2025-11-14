import React, { useEffect, useMemo } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Divider,
} from "@mui/material";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";

const ACCENT = "#F97316";
const KPI = { p: 2, borderRadius: 2, boxShadow: "0 6px 18px rgba(2,6,23,0.06)" };
const COLORS = ["#F97316", "#10B981", "#6366F1", "#EF4444", "#F59E0B"];

export default function DealerPerformance({ data, loading, error, fetchReport, filters, role }) {
  useEffect(() => {
    if (!data) fetchReport();
  }, []); // eslint-disable-line

  if (loading) return <Box sx={{ mt: 3, textAlign: "center" }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ mt: 3 }}><Typography color="error">{error}</Typography></Box>;
  if (!data) return null;

  // backend returns either array (admin) or object (dealer)
  const dealers = Array.isArray(data) ? data : (data.dealers || []);
  const totalSales = Array.isArray(data)
    ? dealers.reduce((s, d) => s + Number(d.totalSales || 0), 0)
    : data.totalSales || 0;

  const productGroups = (Array.isArray(data) ? (dealers[0]?.productGroups || {}) : (data.productGroups || {}));

  const barData = dealers.map(d => ({ name: d.dealerName || d.businessName, total: Number(d.totalSales || 0) }));
  const pieData = Object.entries(productGroups).map(([k, v]) => ({ name: k, value: Number(v) }));

  return (
    <Box mt={3}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ ...KPI }}>
            <Typography variant="subtitle2" color={ACCENT}>Total Dealers</Typography>
            <Typography variant="h5" fontWeight={700}>{dealers.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ ...KPI }}>
            <Typography variant="subtitle2" color={ACCENT}>Total Sales</Typography>
            <Typography variant="h5" fontWeight={700}>₹{Number(totalSales).toLocaleString()}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ ...KPI }}>
            <Typography variant="subtitle2" color={ACCENT}>Pending Orders</Typography>
            <Typography variant="h5" fontWeight={700}>{data.pendingOrders ?? 0}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">Dealer-wise Sales</Typography>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill={ACCENT} radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">Product Group Mix</Typography>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
