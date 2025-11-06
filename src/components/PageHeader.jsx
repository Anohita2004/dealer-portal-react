import React from "react";

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "1rem", marginBottom: "1.25rem" }}>
      <div>
        <h2 style={{ fontSize: "2rem", margin: 0, color: "#f97316" }}>{title}</h2>
        {subtitle && (
          <p style={{ marginTop: "0.25rem", color: "#94a3b8" }}>{subtitle}</p>
        )}
      </div>
      {actions && <div style={{ display: "flex", gap: "0.5rem" }}>{actions}</div>}
    </div>
  );
}


