import React from "react";

export default function IconPillButton({ icon, label, onClick, tone = "primary" }) {
  const tones = {
    primary: {
      background: "var(--color-primary)",
      hover: "var(--color-primary-dark)",
    },
    success: {
      background: "var(--color-success)",
      hover: "#15803D",
    },
    warning: {
      background: "var(--color-warning)",
      hover: "#D97706",
    },
    danger: {
      background: "var(--color-error)",
      hover: "#B91C1C",
    },
  };
  
  const toneStyle = tones[tone] || tones.primary;
  
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        borderRadius: "999px",
        padding: "var(--spacing-2) var(--spacing-3)",
        color: "var(--color-surface)",
        display: "flex",
        alignItems: "center",
        gap: "var(--spacing-2)",
        background: toneStyle.background,
        boxShadow: "var(--shadow-sm)",
        cursor: "pointer",
        fontWeight: "var(--font-weight-semibold)",
        fontSize: "var(--font-size-sm)",
        transition: "all var(--transition-base)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = toneStyle.hover;
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = toneStyle.background;
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  );
}


