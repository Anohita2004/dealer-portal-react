import React from "react";
import { Card, CardContent, Typography } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function BarChartCard({ title, data, xKey, yKey, color = "var(--color-primary)" }) {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: 2, p: 2 }}>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>{title}</Typography>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Bar dataKey={yKey} fill={color} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
