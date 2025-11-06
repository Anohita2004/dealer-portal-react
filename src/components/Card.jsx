import React from "react";

export default function Card({ title, children, footer, style }) {
  return (
    <div className="card" style={style}>
      {title && (
        <h3 style={{ marginTop: 0, marginBottom: "0.75rem" }}>{title}</h3>
      )}
      {children}
      {footer && <div style={{ marginTop: "0.75rem" }}>{footer}</div>}
    </div>
  );
}


