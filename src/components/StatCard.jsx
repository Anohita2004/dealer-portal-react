import React from "react";

/**
 * StatCard Component
 * Enhanced to show scope information from backend intelligence
 * @param {string} title - KPI title
 * @param {string|number} value - KPI value
 * @param {ReactNode} icon - Optional icon
 * @param {string} accent - Accent color
 * @param {string} scope - Scope indicator (e.g., "Region", "Area", "Dealer") - from backend
 * @param {boolean} urgent - Whether this KPI represents urgent/overdue items
 */
export default function StatCard({ title, value, icon, accent = "#f97316", scope, urgent = false }) {
  return (
    <div
      className="card hover-glow"
      style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: "0.25rem",
        border: urgent ? `2px solid ${accent}` : undefined,
        boxShadow: urgent ? `0 0 0 3px ${accent}20` : undefined,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
          {icon && <span style={{ fontSize: "1.35rem" }}>{icon}</span>}
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0 }}>{title}</h4>
            {scope && (
              <span style={{ 
                fontSize: "0.75rem", 
                color: "#6b7280", 
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                {scope}
              </span>
            )}
          </div>
        </div>
        <div style={{ width: 8, height: 8, borderRadius: 9999, background: accent }} />
      </div>
      <div style={{ fontSize: "1.8rem", fontWeight: 700, color: accent }}>{value}</div>
      {urgent && (
        <div style={{ 
          fontSize: "0.75rem", 
          color: accent, 
          fontWeight: 600,
          marginTop: "0.25rem"
        }}>
          ⚠️ Requires Attention
        </div>
      )}
    </div>
  );
}


