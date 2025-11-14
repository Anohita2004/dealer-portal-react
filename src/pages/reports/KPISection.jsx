// src/components/reports/KPISection.jsx
import React from "react";
import { Grid, Paper, Typography } from "@mui/material";

export default function KPISection({ items = [] }) {
  // items: [{title, value, color}]
  return (
    <Grid container spacing={2}>
      {items.map((it, idx) => (
        <Grid item xs={12} md={3} key={idx}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              background: it.color || "linear-gradient(135deg,#2563eb,#1e3a8a)",
              color: "#fff",
              boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
            }}
          >
            <Typography variant="subtitle2">{it.title}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {it.value}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
