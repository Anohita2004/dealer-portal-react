import React, { useEffect, useState } from "react";
import api from "../services/api";
import DocumentApprovalCard from "../components/documents/DocumentApprovalCard";
import { Grid, Box, Typography, Button } from "@mui/material";
import EmptyState from "../components/EmptyState";

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | pending | approved | rejected

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/documents");
      const list = res.data.documents || res.data || [];
      setDocuments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Error loading documents:", err);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filtered = documents.filter((d) => {
    if (filter === "all") return true;
    const s = (d.status || "").toLowerCase();
    const as = (d.approvalStatus || "").toLowerCase();
    return s === filter || as === filter;
  });

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
      <Typography>Loading...</Typography>
    </Box>
  );

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
          📄 Document Approvals
        </Typography>
        <Button variant="outlined" onClick={fetchDocuments}>Refresh List</Button>
      </Box>

      {/* FILTER BUTTONS */}
      <Box sx={{ mb: 3, display: "flex", gap: 1 }}>
        {["all", "pending", "approved", "rejected"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "contained" : "outlined"}
            color={filter === f ? "primary" : "inherit"}
            onClick={() => setFilter(f)}
            size="small"
          >
            {f.toUpperCase()}
          </Button>
        ))}
      </Box>

      {/* LIST OR EMPTY */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="📂"
          title="No documents"
          description="No documents found for the selected filter."
        />
      ) : (
        <Grid container spacing={2}>
          {filtered.map((doc) => (
            <Grid item xs={12} key={doc.id}>
              <DocumentApprovalCard document={doc} onUpdate={fetchDocuments} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
