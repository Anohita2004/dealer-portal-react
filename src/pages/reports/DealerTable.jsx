// src/components/reports/DealerTable.jsx
import React from "react";
import { Box, Paper, Typography } from "@mui/material";

export default function DealerTable({ rows = [] }) {
  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="h6" mb={2}>
        Dealer-wise Sales Summary
      </Typography>
      <Box sx={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>
              <th style={{ padding: 12 }}>Dealer</th>
              <th style={{ padding: 12 }}>Code</th>
              <th style={{ padding: 12 }}>Territory</th>
              <th style={{ padding: 12 }}>Sales</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: 12 }}>{r.dealerName}</td>
                <td style={{ padding: 12 }}>{r.dealerCode}</td>
                <td style={{ padding: 12 }}>{r.territory}</td>
                <td style={{ padding: 12 }}>₹{Number(r.totalSales || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </Paper>
  );
}
