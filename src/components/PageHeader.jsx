import React from "react";

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "flex-end", 
      gap: "var(--spacing-4)", 
      marginBottom: "var(--spacing-6)" 
    }}>
      <div>
        <h2 style={{ 
          fontSize: "var(--font-size-3xl)", 
          margin: 0, 
          color: "var(--color-primary)",
          fontWeight: "var(--font-weight-bold)",
          lineHeight: "var(--line-height-tight)"
        }}>{title}</h2>
        {subtitle && (
          <p style={{ 
            marginTop: "var(--spacing-1)", 
            color: "var(--color-text-secondary)",
            fontSize: "var(--font-size-sm)"
          }}>{subtitle}</p>
        )}
      </div>
      {actions && <div style={{ display: "flex", gap: "var(--spacing-2)" }}>{actions}</div>}
    </div>
  );
}


