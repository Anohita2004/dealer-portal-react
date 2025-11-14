import React, { useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Divider,
} from "@mui/material";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const ACCENT = "#F97316";
const COLORS = ["#F97316", "#F59E0B", "#EF4444", "#06B6D4"];

export default function OutstandingReceivables({ data, loading, error, fetchReport }) {
  useEffect(() => { if (!data) fetchReport(); }, []); // eslint-disable-line

  if (loading) return <Box sx={{ mt: 3, textAlign: "center" }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ mt: 3 }}><Typography color="error">{error}</Typography></Box>;
  if (!data) return null;

  const { totalOutstanding = 0, aging = {}, invoices = [] } = data;
  const pieData = Object.entries(aging).map(([k, v]) => ({ name: k, value: Number(v || 0) }));

  return (
    <Box mt={3}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Total Outstanding</Typography>
            <Typography variant="h4" fontWeight={700}>₹{Number(totalOutstanding).toLocaleString()}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">Aging</Typography>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Outstanding Invoices</Typography>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#f8fafc" }}>
                  <tr>
                    <th style={{ padding: 10 }}>Invoice #</th>
                    <th style={{ padding: 10 }}>Dealer</th>
                    <th style={{ padding: 10 }}>Due Date</th>
                    <th style={{ padding: 10 }}>Balance</th>
                    <th style={{ padding: 10 }}>Days Past Due</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => {
                    const daysPast = inv.dueDate ? Math.floor((new Date() - new Date(inv.dueDate)) / (1000*60*60*24)) : 0;
                    return (
                      <tr key={inv.id}>
                        <td style={{ padding: 10 }}>{inv.invoiceNumber}</td>
                        <td style={{ padding: 10 }}>{inv.dealer?.businessName || "—"}</td>
                        <td style={{ padding: 10 }}>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}</td>
                        <td style={{ padding: 10 }}>₹{Number(inv.balanceAmount || 0).toLocaleString()}</td>
                        <td style={{ padding: 10 }}>{daysPast}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
