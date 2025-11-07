import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Download, Search, FileText } from "lucide-react";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const res = await api.get("/invoices");
      setInvoices(res.data.invoices || res.data);
    })();
  }, []);

  const downloadPdf = async (id, invoiceNumber) => {
    try {
      const res = await api.get(`/invoices/${id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to download PDF");
    }
  };

  const filtered = invoices.filter((i) => {
    const q = search.toLowerCase();
    return (
      i.invoiceNumber?.toString()?.includes(q) ||
      i.status?.toLowerCase()?.includes(q) ||
      i.totalAmount?.toString()?.includes(q)
    );
  });

  return (
    <div style={{ padding: "2rem" }}>
      {/* HEADER */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.7rem", marginBottom: "0.5rem" }}>Invoices</h2>
        <p style={{ opacity: 0.7 }}>
          View, filter, and download your invoices.
        </p>
      </div>

      {/* SEARCH BAR */}
      <div
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          padding: "0.7rem 1rem",
          borderRadius: "12px",
        }}
      >
        <Search size={18} />
        <input
          type="text"
          placeholder="Search invoices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text-color)",
            fontSize: "1rem",
          }}
        />
      </div>

      {/* INVOICE TABLE */}
      <div
        style={{
          borderRadius: "14px",
          border: "1px solid var(--card-border)",
          background: "var(--card-bg)",
          overflow: "hidden",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead
            style={{
              background: "rgba(255,255,255,0.05)",
              textAlign: "left",
            }}
          >
            <tr>
              {["Invoice #", "Date", "Amount", "Status", "Action"].map((head) => (
                <th
                  key={head}
                  style={{
                    padding: "1rem",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--card-border)",
                  }}
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign: "center",
                    padding: "2rem",
                    opacity: 0.6,
                  }}
                >
                  <FileText size={18} style={{ marginRight: 6 }} />
                  No invoices found
                </td>
              </tr>
            )}

            {filtered.map((i) => (
              <tr
                key={i.id}
                style={{
                  borderBottom: "1px solid var(--card-border)",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "1rem" }}>{i.invoiceNumber}</td>

                <td style={{ padding: "1rem" }}>
                  {new Date(i.invoiceDate).toLocaleDateString()}
                </td>

                <td style={{ padding: "1rem", fontWeight: 600 }}>
                  ₹{i.totalAmount}
                </td>

                <td style={{ padding: "1rem" }}>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color:
                        i.status === "Paid"
                          ? "#16a34a"
                          : i.status === "Pending"
                          ? "#f59e0b"
                          : "#ef4444",
                      background:
                        i.status === "Paid"
                          ? "rgba(22,163,74,0.15)"
                          : i.status === "Pending"
                          ? "rgba(245,158,11,0.15)"
                          : "rgba(239,68,68,0.15)",
                    }}
                  >
                    {i.status}
                  </span>
                </td>

                <td style={{ padding: "1rem" }}>
                  <button
                    onClick={() => downloadPdf(i.id, i.invoiceNumber)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background:
                        "linear-gradient(90deg, var(--accent), var(--accent-dark))",
                      padding: "0.45rem 0.9rem",
                      color: "#fff",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    }}
                  >
                    <Download size={16} />
                    PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
