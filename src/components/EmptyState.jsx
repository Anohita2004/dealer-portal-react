import React from "react";

export default function EmptyState({ icon = "🔍", title = "No data", description }) {
  return (
    <div style={{ textAlign: "center", padding: "1.5rem", color: "#94a3b8" }}>
      <div style={{ fontSize: "2rem" }}>{icon}</div>
      <div style={{ fontWeight: 600, marginTop: "0.25rem", color: "#cbd5e1" }}>{title}</div>
      {description && <div style={{ marginTop: "0.25rem" }}>{description}</div>}
    </div>
  );
}


