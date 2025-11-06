import React from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

export default function SparklineMini({ data, color = "#3b82f6" }) {
  return (
    <div style={{ width: "100%", height: 60 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.7} />
              <stop offset="95%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} fill="url(#spark)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}


