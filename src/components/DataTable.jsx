import React from "react";

export default function DataTable({ columns, rows, emptyMessage = "No data available" }) {
  if (!rows || rows.length === 0) {
    return <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>{emptyMessage}</p>;
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ 
                textAlign: "left", 
                padding: "var(--spacing-3) var(--spacing-4)", 
                borderBottom: "1px solid var(--color-border)", 
                color: "var(--color-text-primary)", 
                fontWeight: "var(--font-weight-semibold)",
                fontSize: "var(--font-size-sm)",
                background: "var(--color-background)"
              }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr 
              key={row.id || idx} 
              style={{ 
                background: idx % 2 === 1 ? "var(--color-background)" : "transparent",
                transition: "background-color var(--transition-fast)"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-primary-soft)"}
              onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 1 ? "var(--color-background)" : "transparent"}
            >
              {columns.map((c) => (
                <td key={c.key} style={{ 
                  padding: "var(--spacing-3) var(--spacing-4)", 
                  borderBottom: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                  fontSize: "var(--font-size-sm)"
                }}>
                  {typeof c.render === "function" ? c.render(row[c.key], row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


