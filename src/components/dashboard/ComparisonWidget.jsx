import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export default function ComparisonWidget({
  title,
  current,
  previous,
  formatValue = (v) => v,
  showPercentage = true,
  color = "#3b82f6",
}) {
  if (current === undefined || previous === undefined) {
    return (
      <div
        style={{
          padding: "1.5rem",
          background: "#f9fafb",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>{title}</div>
        <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>N/A</div>
      </div>
    );
  }

  const change = previous !== 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0);
  const isPositive = change >= 0;
  const isNeutral = change === 0;

  return (
    <div
      style={{
        padding: "1.5rem",
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem", fontWeight: 500 }}>
        {title}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <div style={{ fontSize: "1.875rem", fontWeight: 700, color: color }}>{formatValue(current)}</div>
        {showPercentage && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: isNeutral ? "#6b7280" : isPositive ? "#10b981" : "#ef4444",
            }}
          >
            {isNeutral ? (
              <Minus size={14} />
            ) : isPositive ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
        Previous: {formatValue(previous)}
      </div>
    </div>
  );
}

