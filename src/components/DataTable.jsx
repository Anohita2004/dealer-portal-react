import React from "react";

export default function DataTable({ columns, rows, emptyMessage = "No data available" }) {
  if (!rows || rows.length === 0) {
    return <p style={{ color: "#94a3b8" }}>{emptyMessage}</p>;
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ textAlign: "left", padding: "0.6rem", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", fontWeight: 600 }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id || idx} style={{ background: idx % 2 === 1 ? "rgba(255,255,255,0.02)" : "transparent" }}>
              {columns.map((c) => (
                <td key={c.key} style={{ padding: "0.6rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
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


