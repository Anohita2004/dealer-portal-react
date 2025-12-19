import React from "react";

export default function Toolbar({ children, right }) {
  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center", 
      gap: "var(--spacing-4)", 
      marginBottom: "var(--spacing-3)" 
    }}>
      <div style={{ display: "flex", gap: "var(--spacing-2)", alignItems: "center" }}>{children}</div>
      {right && <div style={{ display: "flex", gap: "var(--spacing-2)" }}>{right}</div>}
    </div>
  );
}


