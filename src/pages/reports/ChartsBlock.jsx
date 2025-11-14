// src/components/reports/ChartsBlock.jsx
import React from "react";
import { Paper, Typography, Box } from "@mui/material";

export default function ChartsBlock({ title, children }) {
  return (
    <Paper sx={{ p: 2, borderRadius: 2, boxShadow: "0 6px 18px rgba(2,6,23,0.06)" }}>
      <Typography variant="subtitle1" mb={1}>
        {title}
      </Typography>
      <Box sx={{ height: 300 }}>{children}</Box>
    </Paper>
  );
}
