import React from "react";
import { Calendar, Clock } from "lucide-react";

const TIME_RANGES = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 90 Days", value: "90d" },
  { label: "Last 6 Months", value: "6m" },
  { label: "Last 12 Months", value: "12m" },
  { label: "Custom", value: "custom" },
];

export default function TimeFilter({ value, onChange, showCustom = true }) {
  const [showCustomPicker, setShowCustomPicker] = React.useState(false);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  const handleRangeChange = (rangeValue) => {
    if (rangeValue === "custom") {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
      onChange(rangeValue);
    }
  };

  const handleCustomSubmit = () => {
    if (startDate && endDate) {
      onChange({ type: "custom", startDate, endDate });
      setShowCustomPicker(false);
    }
  };

  const ranges = showCustom ? TIME_RANGES : TIME_RANGES.filter((r) => r.value !== "custom");

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Clock size={16} style={{ opacity: 0.7 }} />
        {ranges.map((range) => {
          const isActive =
            value === range.value ||
            (range.value === "custom" && typeof value === "object" && value?.type === "custom");
          return (
            <button
              key={range.value}
              onClick={() => handleRangeChange(range.value)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: `1px solid ${isActive ? "#3b82f6" : "#e5e7eb"}`,
                background: isActive ? "#3b82f6" : "#fff",
                color: isActive ? "#fff" : "#374151",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: isActive ? 600 : 500,
                transition: "all 0.2s",
              }}
            >
              {range.label}
            </button>
          );
        })}
      </div>

      {showCustomPicker && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "0.5rem",
            padding: "1rem",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            zIndex: 1000,
            minWidth: "300px",
          }}
        >
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
            <Calendar size={16} />
            <strong>Custom Date Range</strong>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: "0.5rem",
                border: "1px solid #e5e7eb",
                borderRadius: "4px",
                fontSize: "0.875rem",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: "0.5rem",
                border: "1px solid #e5e7eb",
                borderRadius: "4px",
                fontSize: "0.875rem",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button
              onClick={() => {
                setShowCustomPicker(false);
                setStartDate("");
                setEndDate("");
              }}
              style={{
                padding: "0.5rem 1rem",
                border: "1px solid #e5e7eb",
                borderRadius: "4px",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCustomSubmit}
              style={{
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "4px",
                background: "#3b82f6",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

