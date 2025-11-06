import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function DonutProgress({ value = 0, total = 100, colors = ["#3b82f6", "#1f2937"], center, label }) {
  const safeTotal = total <= 0 ? 1 : total;
  const percent = Math.max(0, Math.min(100, Math.round((value / safeTotal) * 100)));
  const data = [
    { name: "value", value: Math.max(0, value) },
    { name: "rest", value: Math.max(0, safeTotal - value) },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <div style={{ width: 120, height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={48}
              outerRadius={58}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index] || colors[0]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div>
        {label && <div style={{ color: "#94a3b8" }}>{label}</div>}
        <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#e2e8f0" }}>{percent}%</div>
        {center}
      </div>
    </div>
  );
}


