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
 * @param {function} onClick - Optional click handler
 * @param {object} style - Additional inline styles
 */
export default function StatCard({ title, value, icon, accent, scope, urgent = false, onClick, style = {} }) {
  const accentColor = accent || "var(--color-primary)";
  const isClickable = !!onClick;

  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-1)",
        border: urgent ? `2px solid ${accentColor}` : undefined,
        boxShadow: urgent ? `0 0 0 3px ${accentColor}33` : undefined,
        cursor: isClickable ? "pointer" : undefined,
        transition: isClickable ? "transform 0.2s, box-shadow 0.2s" : undefined,
        ...style,
      }}
      onMouseEnter={isClickable ? (e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = urgent
          ? `0 4px 12px rgba(0,0,0,0.1), 0 0 0 3px ${accentColor}33`
          : "0 4px 12px rgba(0,0,0,0.1)";
      } : undefined}
      onMouseLeave={isClickable ? (e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = urgent ? `0 0 0 3px ${accentColor}33` : "none";
      } : undefined}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)", flex: 1 }}>
          {icon && <span style={{ fontSize: "1.35rem", color: accentColor }}>{icon}</span>}
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, color: "var(--color-text-primary)", fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)" }}>{title}</h4>
            {scope && (
              <span style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text-secondary)",
                fontWeight: "var(--font-weight-medium)",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                {scope}
              </span>
            )}
          </div>
        </div>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: accentColor }} />
      </div>
      <div style={{ fontSize: "var(--font-size-3xl)", fontWeight: "var(--font-weight-bold)", color: accentColor, lineHeight: "var(--line-height-tight)" }}>{value}</div>
      {urgent && (
        <div style={{
          fontSize: "var(--font-size-xs)",
          color: accentColor,
          fontWeight: "var(--font-weight-semibold)",
          marginTop: "var(--spacing-1)"
        }}>
          ⚠️ Requires Attention
        </div>
      )}
    </div>
  );
}
