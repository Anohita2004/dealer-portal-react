import React from "react";

export default function Toolbar({ children, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>{children}</div>
      {right && <div style={{ display: "flex", gap: "0.5rem" }}>{right}</div>}
    </div>
  );
}


