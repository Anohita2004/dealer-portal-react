import React from "react";

export default function SearchInput({ placeholder = "Search", value, onChange, style }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.6rem 0.9rem",
        borderRadius: 9999,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "inset 0 0 10px rgba(0,0,0,0.2)",
        color: "#cbd5e1",
        ...style,
      }}
    >
      <span style={{ opacity: 0.8 }}>🔎</span>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          outline: "none",
          border: "none",
          background: "transparent",
          color: "#e2e8f0",
          width: "100%",
        }}
      />
    </div>
  );
}


