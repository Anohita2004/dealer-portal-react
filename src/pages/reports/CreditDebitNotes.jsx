import React, { useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Divider,
  CircularProgress,
} from "@mui/material";

export default function CreditDebitNotes({ data, loading, error, fetchReport }) {
  useEffect(() => { if (!data) fetchReport(); }, []); // eslint-disable-line

  if (loading) return <Box sx={{ mt: 3, textAlign: "center" }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ mt: 3 }}><Typography color="error">{error}</Typography></Box>;
  if (!data) return null;

  const { notes = [], totalCredit = 0, totalDebit = 0 } = data;

  return (
    <Box mt={3}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">Credit / Debit Notes</Typography>
        <Divider sx={{ my: 1 }} />

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <Paper sx={{ p: 2, minWidth: 180 }}>
            <Typography variant="subtitle2">Total Credit</Typography>
            <Typography variant="h6">₹{Number(totalCredit).toLocaleString()}</Typography>
          </Paper>
          <Paper sx={{ p: 2, minWidth: 180 }}>
            <Typography variant="subtitle2">Total Debit</Typography>
            <Typography variant="h6">₹{Number(totalDebit).toLocaleString()}</Typography>
          </Paper>
        </Box>

        <Box sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                <th style={{ padding: 10 }}>Note #</th>
                <th style={{ padding: 10 }}>Date</th>
                <th style={{ padding: 10 }}>Dealer</th>
                <th style={{ padding: 10 }}>Type</th>
                <th style={{ padding: 10 }}>Amount</th>
                <th style={{ padding: 10 }}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {notes.map(n => (
                <tr key={n.id}>
                  <td style={{ padding: 10 }}>{n.noteNumber || n.id}</td>
                  <td style={{ padding: 10 }}>{n.noteDate ? new Date(n.noteDate).toLocaleDateString() : "—"}</td>
                  <td style={{ padding: 10 }}>{n.dealer?.businessName || "—"}</td>
                  <td style={{ padding: 10 }}>{n.noteType}</td>
                  <td style={{ padding: 10 }}>₹{Number(n.amount || 0).toLocaleString()}</td>
                  <td style={{ padding: 10 }}>{n.reasonCode || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </Paper>
    </Box>
  );
}
