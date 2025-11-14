// src/pages/reports/reportTypes/AdminSummary.jsx
import React, { useEffect } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import KPISection from "./KPISection";

export default function AdminSummary({ data, loading, fetchReport }) {
  useEffect(() => {
    if (!data) fetchReport();
    // eslint-disable-next-line
  }, []);

  if (!data) return null;

  const series = [
    { name: "Dealers", value: data.totalDealers || 0 },
    { name: "Blocked", value: data.blockedDealers || 0 },
    { name: "Pending Docs", value: data.pendingDocuments || 0 },
    { name: "Outstanding", value: Number(data.totalOutstanding || 0) },
  ];

  return (
    <Box mt={3}>
      <KPISection
        items={[
          { title: "Total Dealers", value: data.totalDealers ?? 0, color: "linear-gradient(135deg,#2563eb,#1e3a8a)" },
          { title: "Blocked Dealers", value: data.blockedDealers ?? 0, color: "linear-gradient(135deg,#dc2626,#7f1d1d)" },
          { title: "Pending Documents", value: data.pendingDocuments ?? 0, color: "linear-gradient(135deg,#f59e0b,#b45309)" },
          { title: "Total Outstanding", value: `₹${Number(data.totalOutstanding || 0).toLocaleString()}`, color: "linear-gradient(135deg,#059669,#065f46)" },
        ]}
      />

      <Box mt={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" mb={2}>
            Overall KPIs Trend
          </Typography>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={series}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Box>
    </Box>
  );
}
