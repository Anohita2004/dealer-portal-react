import React from "react";

export default function EmptyState({ icon = "🔍", title = "No data", description }) {
  return (
    <div style={{ 
      textAlign: "center", 
      padding: "var(--spacing-6)", 
      color: "var(--color-text-secondary)" 
    }}>
      <div style={{ fontSize: "var(--font-size-4xl)" }}>{icon}</div>
      <div style={{ 
        fontWeight: "var(--font-weight-semibold)", 
        marginTop: "var(--spacing-1)", 
        color: "var(--color-text-primary)",
        fontSize: "var(--font-size-lg)"
      }}>{title}</div>
      {description && <div style={{ 
        marginTop: "var(--spacing-1)",
        fontSize: "var(--font-size-sm)",
        color: "var(--color-text-secondary)"
      }}>{description}</div>}
    </div>
  );
}


