// src/pages/AdminDocuments.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";
import EmptyState from "../components/EmptyState";

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | pending | approved | rejected

  const fetchDocuments = async () => {
    try {
      const res = await api.get("/documents");
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error("Error loading documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleReview = async (id, action) => {
    const remarks = prompt(`Remarks for ${action}?`) || "";
    try {
      await api.patch(`/documents/${id}/status`, { action, remarks });
      fetchDocuments();
    } catch (err) {
      console.error("Review failed:", err);
    }
  };

  const filtered = documents.filter((d) =>
    filter === "all" ? true : d.status === filter
  );

  if (loading) return <p style={{ padding: "2rem" }}>Loading...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: "1rem", color: "#cbd5e1" }}>📄 Document Approvals</h1>

      {/* FILTER BUTTONS */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.1)",
              background: filter === f ? "#f97316" : "transparent",
              color: filter === f ? "#fff" : "#cbd5e1",
              cursor: "pointer",
              transition: "0.2s",
            }}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* TABLE OR EMPTY */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="📂"
          title="No documents"
          description="No documents found for the selected filter."
        />
      ) : (
        <DataTable
          columns={[
            { key: "id", label: "ID" },
            { key: "dealerName", label: "Dealer" },
            { key: "type", label: "Document Type" },
            { key: "uploadedAt", label: "Uploaded" },
            {
              key: "status",
              label: "Status",
              render: (v) => (
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 20,
                    fontSize: 12,
                    color: "#fff",
                    background:
                      v === "approved"
                        ? "#22c55e"
                        : v === "rejected"
                        ? "#ef4444"
                        : "#f59e0b",
                  }}
                >
                  {v.toUpperCase()}
                </span>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) =>
                row.status === "pending" ? (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        border: "none",
                        background: "#22c55e",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                      onClick={() => handleReview(row.id, "approve")}
                    >
                      Approve
                    </button>

                    <button
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        border: "none",
                        background: "#ef4444",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                      onClick={() => handleReview(row.id, "reject")}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  "—"
                ),
            },
          ]}
          rows={filtered.map((d) => ({
            id: d.id,
            dealerName: d.dealerName || d.dealerId,
            type: d.documentType,
            uploadedAt: new Date(d.createdAt).toLocaleDateString(),
            status: d.status,
          }))}
          emptyMessage="No documents"
        />
      )}
    </div>
  );
}
