import React from "react";

export default function StatCard({ title, value, icon, accent = "#f97316" }) {
  return (
    <div
      className="card hover-glow"
      style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {icon && <span style={{ fontSize: "1.35rem" }}>{icon}</span>}
          <h4 style={{ margin: 0 }}>{title}</h4>
        </div>
        <div style={{ width: 8, height: 8, borderRadius: 9999, background: accent }} />
      </div>
      <div style={{ fontSize: "1.8rem", fontWeight: 700, color: accent }}>{value}</div>
    </div>
  );
}


