import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";

export default function DashboardCard({ title, value, icon, color = "primary.main" }) {
  return (
    <Card sx={{
      borderRadius: 3,
      boxShadow: 2,
      p: 2,
      backgroundColor: "background.paper",
      transition: "transform 0.2s ease",
      "&:hover": { transform: "translateY(-4px)", boxShadow: 4 },
    }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          <Box color={color}>{icon}</Box>
        </Box>
        <Typography variant="h5" sx={{ mt: 1, fontWeight: "bold" }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
