import React from "react";

export default function SearchInput({ placeholder = "Search", value, onChange, style }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--spacing-2)",
        padding: "var(--spacing-3) var(--spacing-4)",
        borderRadius: "999px",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        color: "var(--color-text-secondary)",
        transition: "all var(--transition-base)",
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--color-primary)";
        e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary-soft)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border)";
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
      }}
    >
      <span style={{ opacity: 0.7, fontSize: "var(--font-size-sm)" }}>🔎</span>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          outline: "none",
          border: "none",
          background: "transparent",
          color: "var(--color-text-primary)",
          width: "100%",
          fontSize: "var(--font-size-sm)",
          fontFamily: "var(--font-family)",
        }}
      />
    </div>
  );
}


