import React from "react";

export default function IconPillButton({ icon, label, onClick, tone = "primary" }) {
  const tones = {
    primary: "linear-gradient(90deg, #f97316, #ea580c)",
    success: "linear-gradient(90deg, #22c55e, #16a34a)",
    warning: "linear-gradient(90deg, #f59e0b, #d97706)",
    danger: "linear-gradient(90deg, #ef4444, #b91c1c)",
  };
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        borderRadius: 9999,
        padding: "0.5rem 0.9rem",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        background: tones[tone] || tones.primary,
        boxShadow: "0 0 12px rgba(0,0,0,0.25)",
        cursor: "pointer",
      }}
    >
      {icon && <span>{icon}</span>}
      <span style={{ fontWeight: 600 }}>{label}</span>
    </button>
  );
}


