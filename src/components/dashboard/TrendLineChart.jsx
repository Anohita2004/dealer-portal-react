import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function TrendLineChart({
  title,
  data = [],
  dataKeys = [],
  colors = ["#3b82f6", "#10b981", "#f59e0b"],
  height = 300,
  showArea = false,
  showTrend = true,
  formatValue = (v) => v,
}) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "#6b7280",
          background: "#f9fafb",
          borderRadius: "8px",
        }}
      >
        No trend data available
      </div>
    );
  }

  // Calculate trend percentage
  const calculateTrend = () => {
    if (data.length < 2) return null;
    const firstValue = data[0]?.[dataKeys[0]] || 0;
    const lastValue = data[data.length - 1]?.[dataKeys[0]] || 0;
    if (firstValue === 0) return null;
    const change = ((lastValue - firstValue) / firstValue) * 100;
    return change;
  };

  const trend = showTrend ? calculateTrend() : null;

  const ChartComponent = showArea ? AreaChart : LineChart;

  return (
    <div>
      {title && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>{title}</h3>
          {trend !== null && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                color: trend >= 0 ? "#10b981" : "#ef4444",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="label"
            stroke="#6b7280"
            style={{ fontSize: "0.75rem" }}
            tick={{ fill: "#6b7280" }}
          />
          <YAxis stroke="#6b7280" style={{ fontSize: "0.75rem" }} tick={{ fill: "#6b7280" }} />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              padding: "0.5rem",
            }}
            formatter={(value, name) => [formatValue(value), name]}
          />
          <Legend />
          {dataKeys.map((key, index) => {
            if (showArea) {
              return (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              );
            }
            return (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            );
          })}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}

