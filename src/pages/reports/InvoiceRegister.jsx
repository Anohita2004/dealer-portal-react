import React, { useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Divider,
} from "@mui/material";

const ACCENT = "#F97316";

export default function InvoiceRegister({ data, loading, error, fetchReport, filters }) {
  useEffect(() => { if (!data) fetchReport(); }, []); // eslint-disable-line

  if (loading) return <Box sx={{ mt: 3, textAlign: "center" }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ mt: 3 }}><Typography color="error">{error}</Typography></Box>;
  if (!data) return null;

  const invoices = data.invoices || [];

  const downloadInvoice = async (id) => {
    try {
      const res = await fetch(`/api/invoices/${id}/pdf`, { credentials: "include" });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `invoice_${id}.pdf`; a.click();
    } catch (err) {
      console.error("downloadInvoice:", err);
    }
  };

  return (
    <Box mt={3}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">Invoice Register</Typography>
        <Divider sx={{ my: 1 }} />

        <Box sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                <th style={{ padding: 10 }}>Invoice #</th>
                <th style={{ padding: 10 }}>Date</th>
                <th style={{ padding: 10 }}>Dealer</th>
                <th style={{ padding: 10 }}>Product Group</th>
                <th style={{ padding: 10 }}>Amount</th>
                <th style={{ padding: 10 }}>Status</th>
                <th style={{ padding: 10 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td style={{ padding: 10 }}>{inv.invoiceNumber}</td>
                  <td style={{ padding: 10 }}>{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : "—"}</td>
                  <td style={{ padding: 10 }}>{inv.dealer?.businessName || "—"}</td>
                  <td style={{ padding: 10 }}>{inv.productGroup || "—"}</td>
                  <td style={{ padding: 10 }}>₹{Number(inv.totalAmount || 0).toLocaleString()}</td>
                  <td style={{ padding: 10 }}>{inv.status}</td>
                  <td style={{ padding: 10 }}>
                    <Button size="small" variant="outlined" onClick={() => downloadInvoice(inv.id)} sx={{ borderColor: ACCENT, color: ACCENT }}>
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </Paper>
    </Box>
  );
}
