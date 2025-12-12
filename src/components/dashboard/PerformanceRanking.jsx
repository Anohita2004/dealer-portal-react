import React from "react";
import { Trophy, Medal, Award, TrendingUp, TrendingDown } from "lucide-react";

const RANK_ICONS = {
  1: <Trophy size={20} style={{ color: "#fbbf24" }} />,
  2: <Medal size={20} style={{ color: "#9ca3af" }} />,
  3: <Award size={20} style={{ color: "#d97706" }} />,
};

export default function PerformanceRanking({
  title,
  data = [],
  rankKey = "rank",
  nameKey = "name",
  valueKey = "value",
  formatValue = (v) => v,
  showChange = false,
  changeKey = "change",
  maxItems = 10,
  color = "#3b82f6",
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
        No ranking data available
      </div>
    );
  }

  const sortedData = [...data]
    .sort((a, b) => {
      const aValue = Number(a[valueKey] || 0);
      const bValue = Number(b[valueKey] || 0);
      return bValue - aValue;
    })
    .slice(0, maxItems)
    .map((item, index) => ({
      ...item,
      displayRank: index + 1,
    }));

  return (
    <div>
      {title && (
        <h3 style={{ marginBottom: "1rem", fontSize: "1.125rem", fontWeight: 600 }}>{title}</h3>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {sortedData.map((item, index) => {
          const rank = item.displayRank || item[rankKey] || index + 1;
          const name = item[nameKey] || "Unknown";
          const value = item[valueKey] || 0;
          const change = showChange ? (item[changeKey] || 0) : null;

          return (
            <div
              key={item.id || index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "0.75rem",
                background: rank <= 3 ? "#fef3c7" : "#fff",
                border: `1px solid ${rank <= 3 ? "#fbbf24" : "#e5e7eb"}`,
                borderRadius: "8px",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: rank <= 3 ? "#fef3c7" : "#f3f4f6",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  color: rank <= 3 ? "#92400e" : "#374151",
                }}
              >
                {rank <= 3 ? RANK_ICONS[rank] : rank}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#111827" }}>{name}</div>
                {showChange && change !== null && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      fontSize: "0.75rem",
                      color: change >= 0 ? "#10b981" : "#ef4444",
                      marginTop: "0.25rem",
                    }}
                  >
                    {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(change).toFixed(1)}%
                  </div>
                )}
              </div>
              <div
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: color,
                }}
              >
                {formatValue(value)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

