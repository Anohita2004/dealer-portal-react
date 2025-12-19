import React from "react";

export default function Card({ title, children, footer, style }) {
  return (
    <div className="card" style={style}>
      {title && (
        <h3 style={{ marginTop: 0, marginBottom: "var(--spacing-3)", color: "var(--color-text-primary)" }}>{title}</h3>
      )}
      {children}
      {footer && <div style={{ marginTop: "var(--spacing-3)" }}>{footer}</div>}
    </div>
  );
}


