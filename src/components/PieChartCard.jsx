import React from "react";
import { Card, CardContent, Typography } from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function PieChartCard({ title, data = [] }) {
  const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#ef4444", "#8b5cf6"];

  // ✅ Ensure data is always an array in the correct format
  const chartData = Array.isArray(data)
    ? data
    : Object.entries(data || {}).map(([name, value]) => ({
        name,
        value,
      }));

  // ✅ Handle empty data gracefully
  if (!chartData.length) {
    return (
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: 2,
          p: 2,
          backgroundColor: "#0f172a",
          color: "#94a3b8",
          textAlign: "center",
        }}
      >
        <CardContent>
          <Typography variant="subtitle1">{title}</Typography>
          <Typography sx={{ mt: 2 }}>No data available</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: 2,
        p: 2,
        backgroundColor: "#1e293b",
        color: "#e2e8f0",
      }}
    >
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          {title}
        </Typography>

        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                color: "#e2e8f0",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
